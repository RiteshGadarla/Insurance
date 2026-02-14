from fastapi import APIRouter, Depends, HTTPException, status
from app.core.deps import require_role
from app.models.user import User, UserRole
from app.models.hospital import Hospital
from app.models.insurance_company import InsuranceCompany
from app.core.database import db
from app.core.security import get_password_hash
from pydantic import BaseModel, EmailStr
from typing import List, Optional

router = APIRouter()

class HospitalCreateRequest(BaseModel):
    name: str
    address: str
    contact_info: str
    admin_username: str
    admin_email: Optional[EmailStr] = None
    admin_name: str
    admin_password: str

class InsuranceCompanyCreateRequest(BaseModel):
    name: str
    contact_info: str
    admin_username: str
    admin_email: Optional[EmailStr] = None
    admin_name: str
    admin_password: str

@router.post("/hospitals", response_model=Hospital, dependencies=[Depends(require_role([UserRole.ADMIN]))])
async def create_hospital(request: HospitalCreateRequest):
    existing_user = await db.db["users"].find_one({"username": request.admin_username})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this username already exists")
    
    hashed_password = get_password_hash(request.admin_password)
    new_user = User(
        username=request.admin_username,
        email=request.admin_email,
        name=request.admin_name,
        role=UserRole.HOSPITAL,
        password_hash=hashed_password
    )
    user_result = await db.db["users"].insert_one(new_user.model_dump(by_alias=True, exclude={"id"}))
    user_id = str(user_result.inserted_id)
    
    new_hospital = Hospital(
        name=request.name,
        address=request.address,
        contact_info=request.contact_info,
        admin_user_id=user_id
    )
    hospital_result = await db.db["hospitals"].insert_one(new_hospital.model_dump(by_alias=True, exclude={"id"}))
    new_hospital.id = hospital_result.inserted_id
    
    await db.db["users"].update_one({"_id": user_result.inserted_id}, {"$set": {"hospital_id": str(new_hospital.id)}})
    
    return new_hospital

@router.get("/hospitals", response_model=List[Hospital], dependencies=[Depends(require_role([UserRole.ADMIN]))])
async def list_hospitals():
    hospitals = await db.db["hospitals"].find().to_list(100)
    return hospitals

@router.delete("/hospitals/{hospital_id}", dependencies=[Depends(require_role([UserRole.ADMIN]))])
async def delete_hospital(hospital_id: str):
    from bson import ObjectId
    try:
        oid = ObjectId(hospital_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")
    
    result = await db.db["hospitals"].delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return {"message": "Hospital deleted"}


@router.post("/insurance-companies", response_model=InsuranceCompany, dependencies=[Depends(require_role([UserRole.ADMIN]))])
async def create_insurance_company(request: InsuranceCompanyCreateRequest):
    existing_user = await db.db["users"].find_one({"username": request.admin_username})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this username already exists")
    
    hashed_password = get_password_hash(request.admin_password)
    new_user = User(
        username=request.admin_username,
        email=request.admin_email,
        name=request.admin_name,
        role=UserRole.INSURANCE_COMPANY,
        password_hash=hashed_password
    )
    user_result = await db.db["users"].insert_one(new_user.model_dump(by_alias=True, exclude={"id"}))
    user_id = str(user_result.inserted_id)
    
    new_company = InsuranceCompany(
        name=request.name,
        contact_info=request.contact_info,
        admin_user_id=user_id
    )
    company_result = await db.db["insurance_companies"].insert_one(new_company.model_dump(by_alias=True, exclude={"id"}))
    new_company.id = company_result.inserted_id
    
    await db.db["users"].update_one({"_id": user_result.inserted_id}, {"$set": {"insurance_company_id": str(new_company.id)}})
    
    return new_company

@router.get("/insurance-companies", response_model=List[InsuranceCompany], dependencies=[Depends(require_role([UserRole.ADMIN]))])
async def list_companies():
    companies = await db.db["insurance_companies"].find().to_list(100)
    return companies

@router.delete("/insurance-companies/{company_id}", dependencies=[Depends(require_role([UserRole.ADMIN]))])
async def delete_company(company_id: str):
    from bson import ObjectId
    try:
        oid = ObjectId(company_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")
    
    result = await db.db["insurance_companies"].delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
    return {"message": "Company deleted"}
