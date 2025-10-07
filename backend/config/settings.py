from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    FRONTEND_BASE_URL: str 
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    MONGODB_URI: str
    MONGODB_DB_NAME: str
    STRIPE_SECRET_KEY: str
    STRIPE_PUBLISHABLE_KEY: str  # Add this field
    PAYPAL_CLIENT_ID: str
    PAYPAL_SECRET: str
    GROQ_API_KEY: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"