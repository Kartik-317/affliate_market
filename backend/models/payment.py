from pydantic import BaseModel
from datetime import datetime

class Payment(BaseModel):
    user_id: str
    amount: float
    method: str
    status: str
    created_at: datetime

    def dict(self):
        return {
            "user_id": self.user_id,
            "amount": self.amount,
            "method": self.method,
            "status": self.status,
            "created_at": self.created_at
        }