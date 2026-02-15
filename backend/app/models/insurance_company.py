from app.models.base import MongoModel
from datetime import datetime
from pydantic import Field
from bson import ObjectId

class InsuranceCompany(MongoModel):
    name: str
    contact_info: str # Keeping for now as it's useful, though not in strict list, it's implied by "clean design" usually needing contact.
    admin_user_id: str # Required for RBAC
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            ObjectId: str
        }
