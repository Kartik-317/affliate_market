from PyPDF2 import PdfReader

reader = PdfReader("static/forms/f1040.pdf")
fields = reader.get_fields()

for key, field in fields.items():
    if key.startswith("c1_3") or key.startswith("c1_4") or key.startswith("c1_5"):
        print(f"{key}: V={field.get('/V')}, DV={field.get('/DV')}, AS={field.get('/AS')}, Opt={field.get('/Opt')}")
