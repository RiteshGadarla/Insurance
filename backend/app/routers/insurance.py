from fastapi import APIRouter, Depends, HTTPException, status
from app.core.deps import require_role, get_current_user
from app.models.user import User, UserRole
from app.models.policy import Policy, RequiredDocument
from app.models.hospital import Hospital
from app.core.database import db
from typing import List, Optional
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime

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

@router.post("/policies", response_model=Policy, dependencies=[Depends(require_role([UserRole.INSURANCE_COMPANY]))])
async def create_policy(request: PolicyCreateRequest, current_user: User = Depends(get_current_user)):
    company_id = current_user.insurance_company_id
    if not company_id:
        raise HTTPException(status_code=400, detail="User not linked to an insurance company")

    req_docs = [
        RequiredDocument(
            document_name=d.document_name,
            description=d.description,
            notes=d.notes,
            mandatory=d.mandatory
        ) for d in request.required_documents
    ]

    new_policy = Policy(
        name=request.name,
        insurance_company_id=company_id,
        connected_hospital_ids=request.connected_hospital_ids,
        required_documents=req_docs,
        additional_notes=request.additional_notes,
        policy_pdf_url=request.policy_pdf_url,
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

@router.put("/policies/{policy_id}", response_model=Policy, dependencies=[Depends(require_role([UserRole.INSURANCE_COMPANY]))])
async def update_policy(policy_id: str, request: PolicyUpdateRequest, current_user: User = Depends(get_current_user)):
    company_id = current_user.insurance_company_id
    if not company_id:
        raise HTTPException(status_code=400, detail="User not linked to an insurance company")

    try:
        pid = ObjectId(policy_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Policy ID")

    policy = await db.db["policies"].find_one({"_id": pid, "insurance_company_id": company_id})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found or not owned by your company")

    update_data = {}
    if request.name is not None:
        update_data["name"] = request.name
    if request.connected_hospital_ids is not None:
        update_data["connected_hospital_ids"] = request.connected_hospital_ids
    if request.required_documents is not None:
        update_data["required_documents"] = [d.model_dump() for d in request.required_documents]
    if request.additional_notes is not None:
        update_data["additional_notes"] = request.additional_notes
    if request.policy_pdf_url is not None:
        update_data["policy_pdf_url"] = request.policy_pdf_url

    update_data["updated_at"] = datetime.utcnow()

    if update_data:
        await db.db["policies"].update_one({"_id": pid}, {"$set": update_data})

    updated = await db.db["policies"].find_one({"_id": pid})
    if updated:
        updated["id"] = str(updated["_id"])
    return updated

@router.put("/policies/{policy_id}/hospitals", dependencies=[Depends(require_role([UserRole.INSURANCE_COMPANY]))])
async def link_hospitals(policy_id: str, hospital_ids: List[str], current_user: User = Depends(get_current_user)):
    company_id = current_user.insurance_company_id
    try:
        pid = ObjectId(policy_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Policy ID")

    policy = await db.db["policies"].find_one({"_id": pid, "insurance_company_id": company_id})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    await db.db["policies"].update_one(
        {"_id": pid}, 
        {"$set": {"connected_hospital_ids": hospital_ids, "updated_at": datetime.utcnow()}}
    )
    return {"message": "Hospitals linked successfully"}

@router.get("/hospitals", response_model=List[Hospital], dependencies=[Depends(require_role([UserRole.INSURANCE_COMPANY]))])
async def list_hospitals(current_user: User = Depends(get_current_user)):
    hospitals = await db.db["hospitals"].find().to_list(100)
    return hospitals
