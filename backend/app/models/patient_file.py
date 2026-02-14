from app.models.base import MongoModel
from typing import Optional
from enum import Enum
from datetime import datetime
from pydantic import Field

class FileStatus(str, Enum):
    UPLOADED = "uploaded"
    REVIEWING = "reviewing"
    APPROVED = "approved"
    REJECTED = "rejected"

class PatientFile(MongoModel):
    patient_name: str
    age: int
    diagnosis: str
    hospital_id: str
    policy_id: str
    status: FileStatus = FileStatus.UPLOADED
    file_url: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
