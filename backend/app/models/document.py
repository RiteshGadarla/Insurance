from datetime import datetime
from app.models.base import MongoModel

class Document(MongoModel):
    claim_id: str
    name: str
    type: str
    file_path: str
    uploaded_at: datetime = datetime.utcnow()
