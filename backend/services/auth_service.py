# services/auth_service.py
from jose import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from passlib.context import CryptContext
from config.settings import Settings
from models.user import User 
from pymongo.database import Database
import uuid 

class AuthService:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    CLIENT_ID = "Test-123"

    def __init__(self, db: Database):
        self.db = db
        self.settings = Settings()

    def create_access_token(self, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.settings.SECRET_KEY, algorithm=self.settings.ALGORITHM)
        return encoded_jwt

    def generate_tenant_id(self) -> str:
        return str(uuid.uuid4())

    async def register_user(self, email: str, password: str, name: str) -> dict:
        existing_user = await self.db.users.find_one({"email": email})
        
        if existing_user:
            return {
                "message": "User already exists",
                "tenant_id": existing_user.get("tenantId"),
                "is_new_user": False
            }
        
        safe_password = password[:72]
        hashed_password = self.pwd_context.hash(safe_password)
        new_tenant_id = self.generate_tenant_id()
        
        user_data = {
            "email": email,
            "password": hashed_password,
            "name": name,
            "clientId": self.CLIENT_ID,
            "tenantId": new_tenant_id
        }
        
        await self.db.users.insert_one(user_data)
        
        return {
            "message": "User registered successfully",
            "tenant_id": new_tenant_id,
            "is_new_user": True
        }

    async def authenticate_user(self, email: str, password: str) -> dict:
        user = await self.db.users.find_one({"email": email})
        
        safe_password = password[:72]
        
        if not user or not self.pwd_context.verify(safe_password, user["password"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
        access_token = self.create_access_token(data={"sub": email})
        
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "tenant_id": user.get("tenantId"),
            "name": user.get("name")  # Include name in response
        }