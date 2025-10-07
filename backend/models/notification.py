from pydantic import BaseModel
from datetime import datetime

class Notification(BaseModel):
    user_id: str
    message: str
    type: str
    created_at: datetime

    def dict(self):
        return {
            "user_id": self.user_id,
            "message": self.message,
            "type": self.type,
            "created_at": self.created_at
        }