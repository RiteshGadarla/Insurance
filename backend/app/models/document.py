from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import Field
from app.models.base import MongoModel
from bson import ObjectId

class Document(MongoModel):
    filename: str
    file_path: str
    policy_id: str
    hospital_id: Optional[str] = None
    document_type: str = "Unknown" # Bill, Report, etc.
    
    # OCR Data
    extracted_text: Optional[str] = None
    
    # AI Analysis
    analysis_result: Optional[Dict[str, Any]] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            ObjectId: str
        }
