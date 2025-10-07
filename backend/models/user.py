from pydantic import BaseModel

class User(BaseModel):
    email: str
    password: str
    name: str

    def dict(self):
        return {
            "email": self.email,
            "password": self.password,
            "name": self.name
        }