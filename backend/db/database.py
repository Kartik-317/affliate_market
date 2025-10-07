from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import Settings

class Database:
    client: AsyncIOMotorClient = None
    db = None

def get_db():
    if Database.db is None:
        settings = Settings()
        Database.client = AsyncIOMotorClient(settings.MONGODB_URI)
        Database.db = Database.client[settings.MONGODB_DB_NAME]
    return Database.db