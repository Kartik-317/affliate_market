from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import FileResponse
from pdfrw import PdfReader, PdfWriter, PdfDict, PdfName
from pdfrw.objects.pdfstring import PdfString
import os
from pathlib import Path
from typing import Dict
import logging
from datetime import date
from PIL import Image
import io
import fitz

# Suppress all pymongo logs by setting level to CRITICAL
logging.getLogger("pymongo").setLevel(logging.CRITICAL)

# Set up application logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
    handlers=[
        logging.FileHandler("tax_router.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/api/tax", tags=["tax"])

# Directory for local PDF forms
FORMS_DIR = Path(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static", "forms")))
FORM_PATHS = {
    "w9": FORMS_DIR / "fw9.pdf",
    "1099-nec": FORMS_DIR / "f1099nec.pdf",
    "1040": FORMS_DIR / "f1040.pdf",
    "1040-es": FORMS_DIR / "f1040es.pdf",
    "4868": FORMS_DIR / "f4868.pdf",
    "8829": FORMS_DIR / "f8829.pdf",
}

def decode_field_name(field_raw) -> str:
    """Decode AcroForm field names from UTF-16BE hex to plain string."""
    try:
        if isinstance(field_raw, PdfString):
            name = field_raw.to_unicode()
        else:
            name = str(field_raw)
    except Exception:
        raw = str(field_raw).strip("<>")
        try:
            name = bytes.fromhex(raw).decode("utf-16-be")
        except Exception:
            name = raw
    return name.replace("\ufeff", "").replace("[0]", "")

def add_signature_to_pdf(input_path: Path, output_path: Path, signature_image: bytes):
    """
    Overlay a signature image and today's date onto the certification section of page 1 of W-9 using PyMuPDF.
    - input_path: Path to input PDF
    - output_path: Path to save signed PDF
    - signature_image: signature image bytes (PNG/JPG)
    """
    try:
        # Open input PDF
        doc = fitz.open(str(input_path))
        page = doc[0]  # W-9 signature is always on first page
        logger.debug(f"Page size: {page.rect}")

        # Verify signature image
        try:
            img = Image.open(io.BytesIO(signature_image)).convert("RGBA")
        except Exception as e:
            logger.error(f"Invalid signature image: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature image format")

        # Remove white-ish background for transparency
        datas = img.getdata()
        new_data = []
        for item in datas:
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
        img.putdata(new_data)

        # Save cleaned signature
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG")
        img_bytes.seek(0)

        # Get page height
        page_height = page.rect.height

        # --- Signature placement ---
        x0 = 90   # horizontal start
        y0 = page_height - 105 - 118
        x1 = x0 + 120   # width
        y1 = y0 + 20    # height

        # Adjust position
        y0 = y0 + 8
        y1 = y1 + 8

        rect = fitz.Rect(x0, y0, x1, y1)
        page.insert_image(rect, stream=img_bytes.getvalue())

        # --- Date placement ---
        today = date.today().strftime("%d/%m/%Y")

        # Approximate rectangle for Date box (to the right of signature line)
        date_x0 = 380   # moved further right
        date_y0 = y0 + 8   # a little lower than signature
        date_x1 = date_x0 + 120
        date_y1 = date_y0 + 20

        date_rect = fitz.Rect(date_x0, date_y0, date_x1, date_y1)
        page.insert_textbox(date_rect, today, fontsize=10, fontname="helv", align=1)

        # Save signed PDF
        doc.save(str(output_path))
        doc.close()

        logger.info(f"Added signature and date overlay to PDF at {output_path}")

    except Exception as e:
        logger.error(f"Error adding signature/date: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error adding signature/date: {str(e)}")


def fill_pdf(input_path: Path, output_path: Path, data: Dict, signature_image: bytes = None):
    """Fill AcroForm fields in a PDF with provided data and optionally add signature."""
    logger.debug(f"Attempting to fill PDF at {input_path} with data: {data}")

    if not input_path.exists():
        logger.error(f"Form file not found: {input_path}")
        raise HTTPException(status_code=404, detail=f"Form {input_path.name} not found")

    try:
        pdf = PdfReader(input_path)
        logger.debug(f"Loaded PDF with {len(pdf.pages)} pages")

        for page_num, page in enumerate(pdf.pages):
            annotations = page.get("/Annots")
            if annotations:
                logger.debug(f"Page {page_num + 1} has {len(annotations)} annotations")
                for annotation in annotations:
                    if annotation.get("/T"):
                        raw_name = annotation["/T"]
                        field_name_clean = decode_field_name(raw_name)
                        logger.debug(f"Decoded field: {raw_name} -> {field_name_clean}")

                        if field_name_clean in data:
                            value = str(data[field_name_clean])
                            logger.info(f"Filling field {field_name_clean} with value: {value}")

                            # Handle checkboxes separately
                            if field_name_clean.startswith("c1_"):
                                ap = annotation.get("/AP")
                                if ap and "/N" in ap:
                                    export_values = list(ap["/N"].keys())
                                    logger.debug(f"Checkbox {field_name_clean} possible values: {export_values}")

                                    # Find the non-Off export value
                                    on_value = None
                                    for v in export_values:
                                        if str(v) != "/Off":
                                            on_value = str(v).lstrip("/")
                                            break

                                    if on_value:
                                        if value.lower() in ["yes", "true", "1", on_value.lower()]:
                                            annotation.update(PdfDict(V=PdfName(on_value), AS=PdfName(on_value)))
                                        else:
                                            annotation.update(PdfDict(V=PdfName("Off"), AS=PdfName("Off")))
                            else:
                                # Normal text fields
                                annotation.update(PdfDict(V=value))
                                annotation.update(PdfDict(AP=""))
                        else:
                            logger.debug(f"Field {field_name_clean} not in provided data")
            else:
                logger.debug(f"No annotations found on page {page_num + 1}")

        # Write the filled PDF temporarily
        temp_output_path = FORMS_DIR / f"temp_filled_{os.urandom(4).hex()}.pdf"
        PdfWriter().write(temp_output_path, pdf)

        # Add signature if provided
        if signature_image:
            add_signature_to_pdf(temp_output_path, output_path, signature_image)
            os.remove(temp_output_path)  # Clean up temporary file
        else:
            os.rename(temp_output_path, output_path)

        logger.info(f"Successfully filled PDF at {output_path}")
    except Exception as e:
        logger.error(f"Error processing PDF: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@router.post("/fill-pdf/{form_type}")
async def fill_pdf_endpoint(
    form_type: str,
    request: Request,
    signature: UploadFile = File(default=None),
):
    """Fill a PDF form with provided data (works for all supported forms)."""
    logger.info(f"Received request to fill form: {form_type}")

    if form_type not in FORM_PATHS:
        logger.error(f"Invalid form type: {form_type}")
        raise HTTPException(
            status_code=400,
            detail="Invalid form type. Use 'w9', '1099-nec', '1040', '1040-es', '4868', or '8829'",
        )

    input_path = FORM_PATHS[form_type]
    output_path = os.path.join(
        FORMS_DIR, f"filled_{form_type}_{os.urandom(4).hex()}.pdf"
    )

    try:
        # Collect all posted form fields dynamically
        form_data = await request.form()
        data = {k: v for k, v in form_data.items()}
        logger.debug(f"Form data received for {form_type}: {data}")

        # Handle signature if present
        signature_image = await signature.read() if signature else None
        if signature_image:
            try:
                Image.open(io.BytesIO(signature_image))  # validate image
            except Exception as e:
                logger.error(f"Invalid signature image: {e}")
                raise HTTPException(
                    status_code=400,
                    detail="Invalid signature image format",
                )

        # Fill the PDF with the provided data
        fill_pdf(input_path, output_path, data, signature_image)
        logger.info(f"Sending filled PDF: {output_path}")

        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=f"filled_{form_type}.pdf",
        )

    except Exception as e:
        logger.error(f"Error filling PDF: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error filling PDF: {str(e)}")