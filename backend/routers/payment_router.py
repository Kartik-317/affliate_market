# routers/payment_router.py
from datetime import datetime
import logging
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
import stripe
from routers.affiliate_router import generate_notification_message, get_user_from_token
from services.payment_service import PaymentService, PaymentMethodRequest, TwoFactorVerification
from db.database import get_db
from pymongo.database import Database 
from pydantic import BaseModel
from config.settings import Settings 
from fastapi.security import OAuth2PasswordBearer 

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["payments"])

# --- Initialization & Setup ---
settings = Settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login") 

class WithdrawalRequest(BaseModel):
    amount: float
    method: str

# --- Dependency to get user and tenantId from token (Used across multiple routers) ---
async def get_current_user_and_tenant(token: str = Depends(oauth2_scheme), db: Database = Depends(get_db)):
    """Fetches user and tenant info from the token."""
    user = await get_user_from_token(token, db)
    tenant_id = user.get("tenantId")
    user_id = str(user.get("_id"))
    if not tenant_id or not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: User or Tenant ID missing.")
    return {"user_id": user_id, "tenant_id": tenant_id}

# --- Endpoints ---

@router.get("/config")
async def get_stripe_config():
    settings = Settings() 
    return {"publishableKey": settings.STRIPE_PUBLISHABLE_KEY}

@router.get("/")
async def get_payments(user_info: dict = Depends(get_current_user_and_tenant), db: Database = Depends(get_db)):
    user_id = user_info["user_id"]
    payment_service = PaymentService(db)
    return await payment_service.get_payments(user_id)

@router.get("/methods")
async def list_payment_methods(user_info: dict = Depends(get_current_user_and_tenant), db: Database = Depends(get_db)):
    """Lists payment methods for the authenticated user."""
    user_id = user_info["user_id"]

    methods_cursor = db.get_collection("payment_methods").find({"user_id": user_id})
    methods_list = await methods_cursor.to_list(length=None)

    for method in methods_list:
        method['id'] = str(method.pop('_id'))
    
    return methods_list

@router.post("/withdraw")
async def request_withdrawal(
    withdrawal: WithdrawalRequest, 
    user_info: dict = Depends(get_current_user_and_tenant), 
    db: Database = Depends(get_db)
):
    """Processes a withdrawal request for the authenticated user."""
    user_id = user_info["user_id"]
    tenant_id = user_info["tenant_id"]
    now = datetime.utcnow()
    
    # PaymentService is instantiated but not explicitly used in the final version's core logic
    # payment_service = PaymentService(db) 

    logger.info(f"Processing withdrawal for user_id: {user_id}, amount: ${withdrawal.amount}, method: {withdrawal.method}")

    # 1. Validate Method ID
    try:
        method_id = ObjectId(withdrawal.method)
    except Exception as e:
        logger.error(f"Invalid method ID format: {withdrawal.method}. Error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid payment method ID format")

    # 2. Find and Validate Payment Method
    payment_method = await db.get_collection("payment_methods").find_one({"_id": method_id, "user_id": user_id})
    if not payment_method:
        logger.error(f"Invalid payment method: No method found with ID {withdrawal.method} for user {user_id}")
        raise HTTPException(status_code=400, detail="Invalid payment method")

    logger.info(f"Payment method found: {payment_method}")

    if payment_method.get("status") != "verified":
        logger.error(f"Payment method {withdrawal.method} is not verified. Current status: {payment_method.get('status')}")
        raise HTTPException(status_code=400, detail="Payment method must be verified for withdrawal")

    # 3. Setup Transaction Details
    network_name = payment_method.get("network", "Internal Wallet")

    withdrawal_status = "Completed" # Assume immediate comple
    # 4. Process Withdrawal / Simulate Stripe Deposit
    try:
        if payment_method["type"] == "stripe_standard":
            # --- RESTORED: Actual Stripe Charge Logic ---
            stripe_account_id = payment_method["stripe_account_id"]
            logger.info(f"Creating test charge to add ${withdrawal.amount} to Stripe account: {stripe_account_id}")

            charge = stripe.Charge.create(
                amount=int(withdrawal.amount * 100),
                currency="usd",
                source="tok_visa", # Use a test token
                destination={
                    "account": stripe_account_id, 
                },
                description=f"Test funds for withdrawal to user {user_id}",
                statement_descriptor="TEST DEPOSIT",
            )
            
            stripe_transaction_id = charge.id
            logger.info(f"Test charge created successfully. Charge ID: {stripe_transaction_id}")

            # Record the transaction as a simple 'deposit' in payments collection
            await db.get_collection("payments").insert_one({
                "user_id": user_id,
                "amount": withdrawal.amount,
                "method_id": withdrawal.method,
                "status": "completed",
                "created_at": now,
                "stripe_charge_id": stripe_transaction_id,
                "type": "deposit" 
            })

        # --- Create the Payout Event (for the main Wallet/History feed) ---
        payout_event = {
            "tenantId": tenant_id, # Added tenantId
            "event": "payout",
            "network": network_name, 
            "amount": withdrawal.amount * -1, # Payouts must be recorded as negative
            "status": withdrawal_status,
            "date": now.isoformat(),
            "paymentMethodId": withdrawal.method, # Corrected to use withdrawal.method
        }
        
        event_result = await db.get_collection("data").insert_one(payout_event)
        logger.info(f"Payout event recorded in 'data' collection. Event ID: {str(event_result.inserted_id)}")

        # --- Create and Record the Notification ---
        # NOTE: Assumes 'generate_notification_message' is imported/defined.
        notification_message = generate_notification_message(payout_event)
        
        new_notification = {
            "user_id": user_id,
            "tenantId": tenant_id, # Added tenantId
            "message": notification_message,
            "type": "payout",
            "network": network_name,
            "amount": payout_event["amount"],
            "status": withdrawal_status,
            "paymentMethodId": withdrawal.method, # Corrected to use withdrawal.method
            "created_at": now,
            "read": False
        }
        
        notification_result = await db.get_collection("notifications").insert_one(new_notification)

        # --- Return final success response ---
        return {
            "id": str(event_result.inserted_id),
            "notification_id": str(notification_result.inserted_id),
            "message": f"Withdrawal of ${withdrawal.amount} to {payment_method.get('name', payment_method['type'])} processed successfully. Payout event created."
        }

    except stripe.error.StripeError as e:
        error_message = f"Stripe API Error: {str(e)}, Code: {e.code if hasattr(e, 'code') else 'N/A'}, Request ID: {e.request_id if hasattr(e, 'request_id') else 'N/A'}"
        logger.error(error_message)
        raise HTTPException(status_code=400, detail=error_message)

    except Exception as e:
        error_message = f"Internal Error during withdrawal processing: {str(e)}"
        logger.error(error_message)
        raise HTTPException(status_code=500, detail=error_message)

@router.post("/method")
async def add_payment_method(
    request: PaymentMethodRequest, 
    user_info: dict = Depends(get_current_user_and_tenant), 
    db: Database = Depends(get_db)
):
    user_id = user_info["user_id"]
    tenant_id = user_info["tenant_id"]
    payment_service = PaymentService(db)
    # FIX: Call the service method with the correct number of arguments (4 arguments including self)
    return await payment_service.add_payment_method(request, user_id, tenant_id)

@router.post("/method/verify-2fa")
async def verify_payment_method_2fa(
    verification: TwoFactorVerification, 
    user_info: dict = Depends(get_current_user_and_tenant), 
    db: Database = Depends(get_db)
):
    user_id = user_info["user_id"]
    payment_service = PaymentService(db)
    # FIX: Call the service method with the correct number of arguments (3 arguments including self)
    return await payment_service.verify_payment_method_2fa(verification, user_id)

class TestBalanceRequest(BaseModel):
    token: str
    amount: float

@router.post("/test/add-balance")
async def add_test_balance(request: TestBalanceRequest):
    try:
        # Create a charge using the provided token
        charge = stripe.Charge.create(
            amount=int(request.amount * 100),  
            currency="usd",
            source=request.token,  
            description="Test funds for withdrawal",
        )
        return {"message": "Test balance added successfully", "charge_id": charge.id}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")