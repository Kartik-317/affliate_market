from jose import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from passlib.context import CryptContext
from config.settings import Settings
from models.user import User
from pymongo.database import Database

class AuthService:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    def __init__(self, db: Database):
        self.db = db
        self.settings = Settings()

    def create_access_token(self, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.settings.SECRET_KEY, algorithm=self.settings.ALGORITHM)
        return encoded_jwt

    async def register_user(self, email: str, password: str, name: str) -> dict:
        if await self.db.users.find_one({"email": email}):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_password = self.pwd_context.hash(password)
        user = User(email=email, password=hashed_password, name=name)
        await self.db.users.insert_one(user.dict())
        return {"message": "User registered successfully"}

    async def authenticate_user(self, email: str, password: str) -> str:
        user = await self.db.users.find_one({"email": email})
        if not user or not self.pwd_context.verify(password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        access_token = self.create_access_token(data={"sub": email})
        return access_token