from datetime import datetime
import logging
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
import stripe
from services.payment_service import PaymentService, PaymentMethodRequest, TwoFactorVerification
from db.database import get_db
from pydantic import BaseModel
from config.settings import Settings 

router = APIRouter(prefix="/payments", tags=["payments"])

class WithdrawalRequest(BaseModel):
    amount: float
    method: str

@router.get("/config")
async def get_stripe_config():
    # FIX: Instantiate Settings class to read environment variable
    settings = Settings() 
    return {"publishableKey": settings.STRIPE_PUBLISHABLE_KEY}

@router.get("/")
async def get_payments(db=Depends(get_db)):
    payment_service = PaymentService(db)
    user_id = "test_user_123" # Hardcode for testing needs to be replaced by token logic
    return await payment_service.get_payments(user_id)

# NEW ENDPOINT: GET /payments/methods to list payment methods
@router.get("/methods")
async def list_payment_methods(db=Depends(get_db)):
    user_id = "test_user_123" # Hardcode for testing

    methods_cursor = db.payment_methods.find({"user_id": user_id})
    methods_list = await methods_cursor.to_list(length=None)

    # Convert ObjectId to string for JSON serialization
    for method in methods_list:
        # Renaming MongoDB's _id to 'id' for front-end consumption
        method['id'] = str(method.pop('_id'))
    
    return methods_list

@router.post("/withdraw")
async def request_withdrawal(withdrawal: WithdrawalRequest, db=Depends(get_db)):
    payment_service = PaymentService(db)
    user_id = "test_user_123"  # Replace with proper user authentication logic
    logging.info(f"Processing test withdrawal for user_id: {user_id}, amount: ${withdrawal.amount}, method: {withdrawal.method}")

    try:
        method_id = ObjectId(withdrawal.method)
    except Exception as e:
        logging.error(f"Invalid method ID format: {withdrawal.method}. Error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid payment method ID format")

    payment_method = await db.payment_methods.find_one({"_id": method_id, "user_id": user_id})
    if not payment_method:
        logging.error(f"Invalid payment method: No method found with ID {withdrawal.method} for user {user_id}")
        raise HTTPException(status_code=400, detail="Invalid payment method")

    logging.info(f"Payment method found: {payment_method}")

    if payment_method.get("status") != "verified":
        logging.error(f"Payment method {withdrawal.method} is not verified. Current status: {payment_method.get('status')}")
        raise HTTPException(status_code=400, detail="Payment method must be verified for withdrawal")

    try:
        # Simulate adding "dummy money" to the user's Stripe Standard account balance
        if payment_method["type"] == "stripe_standard":
            stripe_account_id = payment_method["stripe_account_id"]
            logging.info(f"Creating test charge to add ${withdrawal.amount} to Stripe account: {stripe_account_id}")

            # Create a test charge to simulate adding funds
            # Note: For Standard accounts, funds are typically added via charges to the platform account,
            # then transferred to the connected account.
            charge = stripe.Charge.create(
                amount=int(withdrawal.amount * 100),  # Amount in cents
                currency="usd",
                source="tok_visa",  # Use a test token for simulation
                destination={
                    "account": stripe_account_id,  # Transfer to the connected account
                },
                description=f"Test funds for withdrawal to user {user_id}",
                statement_descriptor="TEST DEPOSIT",
            )

            logging.info(f"Test charge created successfully. Charge ID: {charge.id}")

            # Record the transaction in the database
            result = await db.payments.insert_one({
                "user_id": user_id,
                "amount": withdrawal.amount,
                "method_id": withdrawal.method,
                "status": "completed",
                "created_at": datetime.utcnow(),
                "stripe_charge_id": charge.id,
                "type": "deposit"  # Indicate this is a deposit for clarity
            })

            logging.info(f"Test deposit recorded in database. Inserted ID: {str(result.inserted_id)}")
            return {
                "id": str(result.inserted_id),
                "message": f"Test funds of ${withdrawal.amount} added to Stripe account balance."
            }

        else:
            logging.error(f"Unsupported withdrawal method type: {payment_method['type']}")
            raise HTTPException(status_code=400, detail="Unsupported withdrawal method type.")

    except stripe.error.StripeError as e:
        error_message = f"Stripe API Error: {str(e)}, Code: {e.code if hasattr(e, 'code') else 'N/A'}, Request ID: {e.request_id if hasattr(e, 'request_id') else 'N/A'}"
        logging.error(error_message)
        raise HTTPException(status_code=400, detail=error_message)

    except Exception as e:
        error_message = f"Internal Error during test withdrawal: {str(e)}"
        logging.error(error_message)
        raise HTTPException(status_code=500, detail=error_message)

@router.post("/method")
async def add_payment_method(request: PaymentMethodRequest, db=Depends(get_db)):
    payment_service = PaymentService(db)
    return await payment_service.add_payment_method(request)

@router.post("/method/verify-2fa")
async def verify_payment_method_2fa(verification: TwoFactorVerification, db=Depends(get_db)):
    payment_service = PaymentService(db)
    return await payment_service.verify_payment_method_2fa(verification)

class TestBalanceRequest(BaseModel):
    token: str
    amount: float

@router.post("/test/add-balance")
async def add_test_balance(request: TestBalanceRequest):
    try:
        # Create a charge using the provided token
        charge = stripe.Charge.create(
            amount=int(request.amount * 100),  # Amount in cents
            currency="usd",
            source=request.token,  # Use the token ID as the source
            description="Test funds for withdrawal",
        )
        return {"message": "Test balance added successfully", "charge_id": charge.id}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")