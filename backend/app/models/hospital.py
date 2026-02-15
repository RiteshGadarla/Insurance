from app.models.base import MongoModel
from datetime import datetime
from pydantic import Field
from bson import ObjectId

class Hospital(MongoModel):
    name: str
    address: str # Useful context
    contact_info: str # Useful context
    admin_user_id: str # Required for RBAC

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            ObjectId: str
        }
