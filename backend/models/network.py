from pydantic import BaseModel

class NetworkConnection(BaseModel):
    user_id: str
    name: str
    api_key: str
    api_secret: str

    def dict(self):
        return {
            "user_id": self.user_id,
            "name": self.name,
            "api_key": self.api_key,
            "api_secret": self.api_secret
        }
    
    