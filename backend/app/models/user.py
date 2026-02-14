from app.models.base import MongoModel
from pydantic import EmailStr
from enum import Enum
from typing import Optional

class UserRole(str, Enum):
    ADMIN = "admin"
    HOSPITAL = "hospital"
    INSURANCE_COMPANY = "insurance_company"

class User(MongoModel):
    username: str
    email: Optional[EmailStr] = None
    name: str
    role: UserRole
    password_hash: str
    # Optional links to specific entities
    hospital_id: Optional[str] = None
    insurance_company_id: Optional[str] = None
