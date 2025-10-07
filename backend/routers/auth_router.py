from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from services.auth_service import AuthService
from db.database import get_db
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

@router.post("/register")
async def register(user: UserCreate, db=Depends(get_db)):
    auth_service = AuthService(db)
    return await auth_service.register_user(user.email, user.password, user.name)

@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    auth_service = AuthService(db)
    access_token = await auth_service.authenticate_user(form_data.username, form_data.password)
    return {"access_token": access_token, "token_type": "bearer"}