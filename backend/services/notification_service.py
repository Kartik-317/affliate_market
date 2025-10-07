from pymongo.database import Database
from models.notification import Notification
from typing import List, Dict
from datetime import datetime

class NotificationService:
    def __init__(self, db: Database):
        self.db = db

    async def create_notification(self, user_id: str, message: str, type: str) -> Dict:
        notification = Notification(user_id=user_id, message=message, type=type, created_at=datetime.utcnow())
        result = await self.db.notifications.insert_one(notification.dict())
        return {"id": str(result.inserted_id), "message": "Notification created"}

    async def get_notifications(self, user_id: str) -> List[Dict]:
        notifications = await self.db.notifications.find({"user_id": user_id}).sort("created_at", -1).limit(50).to_list(None)
        return notifications