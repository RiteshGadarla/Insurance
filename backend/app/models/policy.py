from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import Field, BaseModel
from app.models.base import MongoModel
from bson import ObjectId

class RequiredDocument(BaseModel):
    document_name: str
    description: str
    notes: Optional[str] = None
    mandatory: bool = True

class Policy(MongoModel):
    name: str
    insurance_company_id: str = ""
    hospital_id: Optional[str] = None  # For hospital-created internal policies
    connected_hospital_ids: List[str] = []
    required_documents: List[RequiredDocument] = []
    additional_notes: Optional[str] = None
    policy_pdf_url: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            ObjectId: str
        }
