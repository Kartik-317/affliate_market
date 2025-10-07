from fastapi import APIRouter, Depends
from services.notification_service import NotificationService
from db.database import get_db
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

router = APIRouter(prefix="/notifications", tags=["notifications"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

class NotificationCreate(BaseModel):
    message: str
    type: str

@router.post("/")
async def create_notification(notification: NotificationCreate, token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    notification_service = NotificationService(db)
    user_id = "user_id_from_token"  # Placeholder
    return await notification_service.create_notification(user_id, notification.message, notification.type)

@router.get("/")
async def get_notifications(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    notification_service = NotificationService(db)
    user_id = "user_id_from_token"  # Placeholder
    return await notification_service.get_notifications(user_id)