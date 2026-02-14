from fastapi import APIRouter, Depends, HTTPException, status
from app.core.deps import require_role, get_current_user
from app.models.user import User, UserRole
from app.models.policy import Policy
from app.models.hospital import Hospital
from app.core.database import db
from typing import List
from pydantic import BaseModel
from bson import ObjectId

router = APIRouter()

class PolicyCreateRequest(BaseModel):
    name: str
    coverage_details: str
    required_documents: List[str]

@router.post("/policies", response_model=Policy, dependencies=[Depends(require_role([UserRole.INSURANCE_COMPANY]))])
async def create_policy(request: PolicyCreateRequest, current_user: User = Depends(get_current_user)):
    company_id = current_user.insurance_company_id
    if not company_id:
        raise HTTPException(status_code=400, detail="User not linked to an insurance company")
    
    # Fetch company name for 'insurer' field
    company = await db.db["insurance_companies"].find_one({"_id": ObjectId(company_id)})
    insurer_name = company["name"] if company else current_user.name

    new_policy = Policy(
        name=request.name,
        insurance_company_id=company_id,
        coverage_details=request.coverage_details,
        required_documents=request.required_documents,
        insurer=insurer_name
    )
    
    result = await db.db["policies"].insert_one(new_policy.model_dump(by_alias=True, exclude={"id"}))
    new_policy.id = result.inserted_id
    return new_policy

@router.get("/policies", response_model=List[Policy], dependencies=[Depends(require_role([UserRole.INSURANCE_COMPANY]))])
async def list_policies(current_user: User = Depends(get_current_user)):
    company_id = current_user.insurance_company_id
    policies = await db.db["policies"].find({"insurance_company_id": company_id}).to_list(100)
    return policies

@router.put("/policies/{policy_id}/hospitals", dependencies=[Depends(require_role([UserRole.INSURANCE_COMPANY]))])
async def link_hospitals(policy_id: str, hospital_ids: List[str], current_user: User = Depends(get_current_user)):
    # Verify policy belongs to this company
    try:
        pid = ObjectId(policy_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid Policy ID")

    policy = await db.db["policies"].find_one({"_id": pid, "insurance_company_id": current_user.insurance_company_id})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    await db.db["policies"].update_one({"_id": pid}, {"$set": {"eligible_hospital_ids": hospital_ids}})
    return {"message": "Hospitals linked successfully"}

@router.get("/hospitals", response_model=List[Hospital], dependencies=[Depends(require_role([UserRole.INSURANCE_COMPANY]))])
async def list_hospitals(current_user: User = Depends(get_current_user)):
    # Helper to list all hospitals so they can be linked
    hospitals = await db.db["hospitals"].find().to_list(100)
    return hospitals
