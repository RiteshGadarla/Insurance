from app.models.base import MongoModel

class Hospital(MongoModel):
    name: str
    address: str
    contact_info: str
    admin_user_id: str 
