from app.models.base import MongoModel
from pydantic import EmailStr

class User(MongoModel):
    email: EmailStr
    name: str
    role: str = "staff" # default role
