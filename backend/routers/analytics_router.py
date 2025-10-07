from fastapi import APIRouter, Depends
from services.analytics_service import AnalyticsService
from db.database import get_db
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/analytics", tags=["analytics"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

class AnalyticsRequest(BaseModel):
    start_date: datetime
    end_date: datetime

@router.post("/")
async def get_analytics(analytics_request: AnalyticsRequest, token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    analytics_service = AnalyticsService(db)
    user_id = "user_id_from_token" 
    return await analytics_service.get_analytics(user_id, analytics_request.start_date, analytics_request.end_date)