from app.models.base import MongoModel

class InsuranceCompany(MongoModel):
    name: str
    contact_info: str
    admin_user_id: str
