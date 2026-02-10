from typing import List, Optional
from app.models.base import MongoModel

class Policy(MongoModel):
    name: str
    insurer: str
    required_documents: List[str]
    document_path: Optional[str] = None
    notes: Optional[str] = None
