from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from app.core.deps import require_role, get_current_user
from app.models.user import User, UserRole
from app.models.policy import Policy, RequiredDocument
from app.models.hospital import Hospital
from app.models.insurance_company import InsuranceCompany
from app.core.database import db
from app.services.ai_service import AIService
from typing import List, Optional
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime
import os
import shutil

router = APIRouter()

class RequiredDocumentInput(BaseModel):
    document_name: str
    description: str = ""
    notes: Optional[str] = None
    mandatory: bool = True

class PolicyCreateRequest(BaseModel):
    name: str
    connected_hospital_ids: List[str] = []
    required_documents: List[RequiredDocumentInput] = []
    additional_notes: Optional[str] = None
    policy_pdf_url: Optional[str] = None

class PolicyUpdateRequest(BaseModel):
    name: Optional[str] = None
    connected_hospital_ids: Optional[List[str]] = None
    required_documents: Optional[List[RequiredDocumentInput]] = None
    additional_notes: Optional[str] = None
    policy_pdf_url: Optional[str] = None

@router.post("/policies", response_model=Policy, response_model_by_alias=False, dependencies=[Depends(require_role([UserRole.INSURANCE_COMPANY]))])
async def create_policy(
    name: str = Form(...), 
    file: UploadFile = File(...), 
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.insurance_company_id
    if not company_id:
        raise HTTPException(status_code=400, detail="User not linked to an insurance company")

    # Create upload directory if it doesn't exist
    upload_dir = "uploads/policies"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, f"{ObjectId()}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Call AI service for suggestions
    suggested_docs = AIService.analyze_policy_pdf(file_path)

    new_policy = Policy(
        name=name,
        insurance_company_id=company_id,
        policy_pdf_path=file_path,
        required_documents=suggested_docs,
        status="DRAFT"
    )
    
    result = await db.db["policies"].insert_one(new_policy.model_dump(by_alias=True, exclude={"id"}))
    created = await db.db["policies"].find_one({"_id": result.inserted_id})
    if created:
        created["id"] = str(created["_id"])
    return created

@router.get("/policies", response_model=List[Policy], dependencies=[Depends(require_role([UserRole.INSURANCE_COMPANY]))])
async def list_policies(current_user: User = Depends(get_current_user)):
    company_id = current_user.insurance_company_id
    policies = await db.db["policies"].find({"insurance_company_id": company_id}).to_list(100)
    return policies

@router.get("/policies/{policy_id}", response_model=Policy, response_model_by_alias=False, dependencies=[Depends(require_role([UserRole.INSURANCE_COMPANY]))])
async def get_policy(policy_id: str, current_user: User = Depends(get_current_user)):
    company_id = current_user.insurance_company_id
    try:
        pid = ObjectId(policy_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")
    
    policy = await db.db["policies"].find_one({"_id": pid, "insurance_company_id": company_id})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    policy["id"] = str(policy["_id"])
    return policy

@router.put("/policies/{policy_id}/finalize", response_model=Policy, response_model_by_alias=False, dependencies=[Depends(require_role([UserRole.INSURANCE_COMPANY]))])
async def finalize_policy(
    policy_id: str, 
    required_documents: List[RequiredDocumentInput], 
    current_user: User = Depends(get_current_user)
):
    company_id = current_user.insurance_company_id
    try:
        pid = ObjectId(policy_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")

    policy = await db.db["policies"].find_one({"_id": pid, "insurance_company_id": company_id})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    updated_docs = [d.model_dump() for d in required_documents]
    
    await db.db["policies"].update_one(
        {"_id": pid},
        {"$set": {
            "required_documents": updated_docs,
            "status": "ACTIVE",
            "updated_at": datetime.utcnow()
        }}
    )

    updated = await db.db["policies"].find_one({"_id": pid})
    if updated:
        updated["id"] = str(updated["_id"])
    return updated

@router.post("/hospitals/link", dependencies=[Depends(require_role([UserRole.INSURANCE_COMPANY]))])
async def link_hospitals(hospital_ids: List[str], current_user: User = Depends(get_current_user)):
    company_id = current_user.insurance_company_id
    if not company_id:
        raise HTTPException(status_code=400, detail="User not linked to an insurance company")
    
    try:
        cid = ObjectId(company_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID")

    await db.db["insurance_companies"].update_one(
        {"_id": cid},
        {"$set": {"connected_hospital_ids": hospital_ids, "updated_at": datetime.utcnow()}}
    )
    return {"message": "Hospitals linked to company successfully"}

@router.get("/hospitals", response_model=List[Hospital], dependencies=[Depends(require_role([UserRole.INSURANCE_COMPANY]))])
async def list_hospitals(current_user: User = Depends(get_current_user)):
    hospitals = await db.db["hospitals"].find().to_list(100)
    return hospitals

@router.get("/my-company", response_model=InsuranceCompany, dependencies=[Depends(require_role([UserRole.INSURANCE_COMPANY]))])
async def get_my_company(current_user: User = Depends(get_current_user)):
    company_id = current_user.insurance_company_id
    if not company_id:
        raise HTTPException(status_code=404, detail="Company not linked")
    
    company = await db.db["insurance_companies"].find_one({"_id": ObjectId(company_id)})
    if not company:
        raise HTTPException(status_code=404, detail="Company details not found")
    return company

