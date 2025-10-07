from fastapi import APIRouter, Depends
from services.network_service import NetworkService
from db.database import get_db
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

router = APIRouter(prefix="/networks", tags=["networks"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

class NetworkData(BaseModel):
    name: str
    api_key: str
    api_secret: str

@router.post("/connect")
async def connect_network(network_data: NetworkData, token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    network_service = NetworkService(db)
    user_id = "user_id_from_token"  # Placeholder
    return await network_service.connect_network(user_id, network_data.dict())

@router.get("/")
async def get_networks(token: str = Depends(oauth2_scheme), db=Depends(get_db)):
    network_service = NetworkService(db)
    user_id = "user_id_from_token"  # Placeholder
    return await network_service.get_networks(user_id)