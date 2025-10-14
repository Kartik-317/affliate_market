import logging
from bson import ObjectId
from fastapi import HTTPException
from pymongo.database import Database
from typing import List, Dict
from datetime import datetime
import stripe
import paypalrestsdk
from pydantic import BaseModel
from config.settings import Settings # Assumed to exist

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Configure Stripe and PayPal
settings = Settings()
stripe.api_key = settings.STRIPE_SECRET_KEY
paypalrestsdk.configure({
    "mode": "sandbox",
    "client_id": settings.PAYPAL_CLIENT_ID,
    "client_secret": settings.PAYPAL_SECRET
})

class PaymentMethodRequest(BaseModel):
    user_id: str
    type: str
    details: Dict
    token: str = ""

class TwoFactorVerification(BaseModel):
    user_id: str
    code: str

class PaymentService:
    def __init__(self, db: Database):
        self.db = db

    async def get_payments(self, user_id: str) -> List[Dict]:
        """Retrieves payment/withdrawal history for a user."""
        payments = await self.db.payments.find({"user_id": user_id}).to_list(None)
        return payments

    async def request_withdrawal(self, user_id: str, amount: float, method: str) -> Dict:
        """Processes a withdrawal (payout or transfer) request."""
        logging.info(f"Processing withdrawal request for user_id: {user_id}, amount: ${amount}, method: {method}")

        try:
            method_id = ObjectId(method)
        except Exception as e:
            logging.error(f"Invalid method ID format: {method}. Error: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid payment method ID format")

        payment_method = await self.db.payment_methods.find_one({"_id": method_id, "user_id": user_id})
        if not payment_method:
            logging.error(f"Invalid payment method: No method found with ID {method} for user {user_id}")
            raise HTTPException(status_code=400, detail="Invalid payment method")
        
        logging.info(f"Payment method found: {payment_method}")

        if payment_method.get("status") != "verified":
            logging.error(f"Payment method {method} is not verified. Current status: {payment_method.get('status')}")
            raise HTTPException(status_code=400, detail="Payment method must be verified for withdrawal")
        
        logging.info(f"Attempting withdrawal of ${amount} to method ID: {method} (Type: {payment_method.get('type')})")

        try:
            payout_id = None
            payout_status = "pending"

            if payment_method["type"] == "paypal":
                payout_id = f"paypal_payout_{datetime.utcnow().timestamp()}"
                payout_status = "pending"
                logging.info(f"PayPal withdrawal processed (simulated). Payout ID: {payout_id}")
            
            elif payment_method["type"] in ["stripe_standard"]:
                stripe_account_id = payment_method["stripe_account_id"]
                
                logging.info(f"Creating Stripe Transfer to Standard account: amount={int(amount * 100)}, currency=usd, destination={stripe_account_id}")
                
                transfer = stripe.Transfer.create(
                    amount=int(amount * 100),
                    currency="usd",
                    destination=stripe_account_id,
                    metadata={"withdrawal_method_id": method, "user_id": user_id}
                )
                payout_id = transfer.id
                payout_status = "processed"
                logging.info(f"Stripe Transfer created successfully. Transfer ID: {payout_id}, Status: {payout_status}")
            
            else:
                logging.error(f"Unsupported withdrawal method type: {payment_method['type']}")
                raise HTTPException(status_code=400, detail="Unsupported withdrawal method type.")
            
            result = await self.db.payments.insert_one({
                "user_id": user_id,
                "amount": amount,
                "method_id": method,
                "status": payout_status,
                "created_at": datetime.utcnow(),
                "stripe_transfer_id": payout_id
            })
            logging.info(f"Withdrawal recorded in database. Inserted ID: {str(result.inserted_id)}")
            
            return {"id": str(result.inserted_id), "message": "Withdrawal requested (Funds transferred to user's Stripe balance)."}
        
        except stripe.error.StripeError as e:
            error_message = f"Stripe API Error: {str(e)}, Code: {e.code if hasattr(e, 'code') else 'N/A'}, Request ID: {e.request_id if hasattr(e, 'request_id') else 'N/A'}"
            logging.error(error_message)
            raise HTTPException(status_code=400, detail=error_message)
        
        except Exception as e:
            error_message = f"Internal Error during withdrawal: {str(e)}"
            logging.error(error_message)
            raise HTTPException(status_code=500, detail=error_message)

    async def add_payment_method(self, request: PaymentMethodRequest, user_id: str, tenant_id: str) -> Dict:
        """Adds a payment method (either a Stripe Standard Account link or PayPal)."""
        try:
            authenticated_user_id = user_id
            
            # Use ObjectId to ensure the find operation works correctly against the user's _id
            user = await self.db.users.find_one({"_id": ObjectId(authenticated_user_id)})
            
            if not user:
                # If the user somehow doesn't exist (e.g., token is valid but DB entry is gone), create a minimal one.
                user_data = {"_id": ObjectId(authenticated_user_id), "email": f"user_{authenticated_user_id}@example.com", "tenantId": tenant_id}
                await self.db.users.insert_one(user_data)
                user = user_data
            
            # --- START STRIPE ID UPDATE LOGIC ---
            
            # 1. Handle Stripe Customer ID (for accepting payments, optional for payouts but good practice)
            customer_id = user.get("stripe_customer_id")
            if not customer_id:
                customer = stripe.Customer.create(email=user.get("email", f"user_{authenticated_user_id}@example.com"))
                
                # UPDATE EXISTING USER DOCUMENT
                await self.db.users.update_one(
                    {"_id": ObjectId(authenticated_user_id)},
                    {"$set": {"stripe_customer_id": customer.id}}
                )
                customer_id = customer.id
                user["stripe_customer_id"] = customer_id # Update local user dict for immediate use

            destination_id = None
            details = {}
            payment_method_type = None
            custom_account_id = None
            account_link = None # Initialize for broader scope

            if request.type in ["card", "bank", "stripe_standard"]:
                # 2. Handle Stripe Connect Account ID (for receiving payouts)
                custom_account_id = user.get("stripe_account_id")
                if not custom_account_id:
                    # Create a Stripe Connect Standard account
                    custom_account = stripe.Account.create(
                        type="standard",
                        email=user.get("email", f"user_{authenticated_user_id}@example.com"),
                    )
                    
                    # UPDATE EXISTING USER DOCUMENT
                    await self.db.users.update_one(
                        {"_id": ObjectId(authenticated_user_id)},
                        {"$set": {"stripe_account_id": custom_account.id}}
                    )
                    custom_account_id = custom_account.id
                    
                destination_id = custom_account_id
                payment_method_type = "stripe_standard"
                details = {"account_id": custom_account_id}
                
                # Create an account link for user onboarding
                account_link = stripe.AccountLink.create(
                    account=custom_account_id,
                    refresh_url=f"{settings.FRONTEND_BASE_URL}/payments/onboarding/refresh",
                    return_url=f"{settings.FRONTEND_BASE_URL}/payments/onboarding/return",
                    type="account_onboarding",
                )
                
                status = "pending_onboarding" # More accurate status before bank details are added
                message = f"Stripe Standard Account linked. User must complete onboarding at: {account_link.url}"
                
            elif request.type == "paypal":
                email = request.details.get("email")
                if not email:
                    raise HTTPException(status_code=400, detail="PayPal email is required")
                
                destination_id = f"paypal_{authenticated_user_id}_{datetime.utcnow().timestamp()}"
                details = {"email": email}
                payment_method_type = "paypal"
                status = "pending" # Requires 2FA verification
                message = "PayPal method added, pending 2FA verification"
            
            else:
                raise HTTPException(status_code=400, detail="Unsupported payment method")

            # Store payment method in database (payment_methods collection)
            payment_method_data = {
                "user_id": authenticated_user_id,
                "type": payment_method_type,
                "name": f"{payment_method_type.replace('_', ' ').title()} Payout Method",
                "details": details,
                "stripe_destination_id": destination_id, 
                "stripe_account_id": custom_account_id if payment_method_type == "stripe_standard" else None,
                "status": status,
                "added_date": datetime.utcnow(),
                "is_default": False
            }
            result = await self.db.payment_methods.insert_one(payment_method_data)
            
            return {"id": str(result.inserted_id), "message": message, "onboarding_url": account_link.url if account_link else None}
        
        except stripe.error.StripeError as e:
            error_message = f"Stripe API Error: {str(e)}, Code: {e.code if hasattr(e, 'code') else 'N/A'}, Request ID: {e.request_id if hasattr(e, 'request_id') else 'N/A'}"
            logging.error(error_message)
            raise HTTPException(status_code=400, detail=error_message)
        
        except Exception as e:
            logging.error(f"Internal Error during add_payment_method: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Internal Error: {str(e)}")

    async def verify_payment_method_2fa(self, verification: TwoFactorVerification, user_id: str) -> Dict:
        """Verifies a payment method using 2FA (Primarily for PayPal)."""
        if not verification.code:
            raise HTTPException(status_code=400, detail="Invalid 2FA code")

        # Find the latest pending PayPal method using the authenticated user_id
        payment_method = await self.db.payment_methods.find_one(
            {"user_id": user_id, "status": "pending", "type": "paypal"},
            sort=[("added_date", -1)]
        )
        if not payment_method:
            raise HTTPException(status_code=400, detail="No pending PayPal payment method found for verification.")
        
        # NOTE: Mock verification logic
        await self.db.payment_methods.update_one(
            {"_id": payment_method["_id"]},
            {"$set": {"status": "verified"}}
        )

        updated_method = await self.db.payment_methods.find_one({"_id": payment_method["_id"]})

        return {
            "message": "Payment method verified",
            "id": str(updated_method["_id"]),
            "type": updated_method["type"],
            "details": updated_method["details"],
            "name": updated_method.get("name")
        }