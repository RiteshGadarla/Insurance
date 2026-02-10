from datetime import datetime
from typing import Optional
from app.models.base import MongoModel, PyObjectId
from pydantic import Field

class Claim(MongoModel):
    patient_name: str
    policy_id: str # keeping as string to simplify linking for now
    insurer_name: str
    claim_type: str # Cashless or Reimbursement
    status: str = "Pending Verification"
    created_at: datetime = Field(default_factory=datetime.utcnow)
