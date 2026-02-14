from typing import List, Optional
from app.models.base import MongoModel

class Policy(MongoModel):
    name: str
    insurance_company_id: Optional[str] = None
    hospital_id: Optional[str] = None # For custom policies created by hospital
    required_documents: List[str]
    document_path: Optional[str] = None
    notes: Optional[str] = None
    eligible_hospital_ids: List[str] = []
    coverage_details: str
    insurer: str # Name of insurer (Company or Hospital)
