from datetime import datetime
from typing import List, Optional, Dict, Any
from app.models.base import MongoModel
from pydantic import Field, BaseModel
from bson import ObjectId

class AIDocumentFeedback(BaseModel):
    document_name: str
    feedback_note: str

class Claim(MongoModel):
    # Core Info
    patient_name: str
    age: int
    hospital_id: str
    
    # Policy Linking
    policy_id: Optional[str] = None # Nullable for Reimbursement if manual/not linked to digital policy yet
    policy_type: str = "CASHLESS" # CASHLESS or REIMBURSEMENT
    
    # Documents & Evidence
    uploaded_documents: List[Dict[str, Any]] = [] # [{name, url, type, ...}]
    
    # AI Analysis Results
    ai_score: Optional[int] = None
    ai_estimated_amount: Optional[float] = None
    ai_notes: Optional[str] = None
    ai_document_feedback: List[AIDocumentFeedback] = []
    ai_ready_for_review: bool = False
    
    # Workflow Status
    # CASHLESS: DRAFT -> REVIEW_READY -> APPROVED/REJECTED
    # REIMBURSEMENT: DRAFT -> ANALYZED
    status: str = "DRAFT" 
    rejection_reason: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            ObjectId: str
        }
