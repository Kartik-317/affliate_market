from fastapi import APIRouter, Depends
from services.dashboard_service import DashboardService
from db.database import get_db
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

@router.get("/")
async def get_dashboard(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    dashboard_service = DashboardService(db)
    # In production, decode token to get user_id
    user_id = "user_id_from_token"  # Placeholder
    return await dashboard_service.get_dashboard_data(user_id)