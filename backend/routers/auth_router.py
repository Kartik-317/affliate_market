# routers/auth_router.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from services.auth_service import AuthService
from db.database import get_db
from pydantic import BaseModel
from starlette import status

router = APIRouter(prefix="/auth", tags=["auth"])

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

@router.post("/register")
async def register(user: UserCreate, db=Depends(get_db)):
    auth_service = AuthService(db)
    
    registration_result = await auth_service.register_user(user.email, user.password, user.name)
    
    # Generate access token for the newly registered user
    access_token = auth_service.create_access_token(data={"sub": user.email})
    
    return {
        "message": registration_result["message"], 
        "tenant_id": registration_result["tenant_id"],
        "access_token": access_token,
        "token_type": "bearer",
        "name": user.name
    }

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    auth_service = AuthService(db)
    
    auth_result = await auth_service.authenticate_user(form_data.username, form_data.password)
    
    return auth_result