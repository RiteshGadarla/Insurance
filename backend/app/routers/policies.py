from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.policy import Policy
from app.models.user import User, UserRole
from app.core.collections import get_policy_collection
from app.core.deps import get_current_user
from bson import ObjectId

router = APIRouter()

@router.post("/", response_model=Policy)
async def create_policy(
    policy: Policy, 
    user: User = Depends(get_current_user)
):
    if user.role != UserRole.INSURANCE_COMPANY:
        raise HTTPException(status_code=403, detail="Only Insurance Companies can create policies")

    # Auto-assign insurance company ID from the logged-in user
    # Assuming user.insurance_company_id is set. If not, we might use user.id as fallback or error.
    if user.insurance_company_id:
        policy.insurance_company_id = user.insurance_company_id
    else:
         # Fallback: if the user IS the insurance company account directly
        policy.insurance_company_id = str(user.id)

    collection = get_policy_collection()
    new_policy = await collection.insert_one(policy.model_dump(by_alias=True, exclude={"id"}))
    created_policy = await collection.find_one({"_id": new_policy.inserted_id})
    if created_policy:
        created_policy["id"] = str(created_policy["_id"])
    return created_policy

@router.get("/", response_model=List[Policy])
async def get_policies(user: User = Depends(get_current_user)):
    collection = get_policy_collection()
    
    # Filter policies based on role
    if user.role == UserRole.INSURANCE_COMPANY:
        # Show only policies owned by this company
        company_id = user.insurance_company_id or str(user.id)
        policies = await collection.find({"insurance_company_id": company_id}).to_list(100)
    elif user.role == UserRole.HOSPITAL:
        # Show only policies connected to this hospital OR general policies (if logic allows)
        # For now, show all or filter by connected_hospital_ids
        hospital_id = user.hospital_id or str(user.id)
        # Simple logical OR: Public policies (no hospital restriction) OR explicitly connected
        # But per schema: connected_hospital_ids is a list.
        # If empty, maybe it's valid for all? OR maybe strict.
        # Let's assume strict for now based on prompt "Connected Hospitals".
        # But usually hospitals need to pick a policy.
        # Let's return all for Hospital to select from, or filter if requirements say so.
        # Prompt: "HOSPITAL Sidebar... Internal Policies".
        # Prompt: "Select available company policy."
        # Let's return all policies for now to allow selection.
        policies = await collection.find().to_list(100)
    else:
        # Admin or others
        policies = await collection.find().to_list(100)
        
    return policies

@router.get("/mine", response_model=List[Policy])
async def get_my_policies(user: User = Depends(get_current_user)):
    if user.role != UserRole.INSURANCE_COMPANY:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    collection = get_policy_collection()
    company_id = user.insurance_company_id or str(user.id)
    policies = await collection.find({"insurance_company_id": company_id}).to_list(100)
    return policies
@router.get("/{policy_id}", response_model=Policy)
async def get_policy(policy_id: str, user: User = Depends(get_current_user)):
    try:
        pid = ObjectId(policy_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Policy ID")

    collection = get_policy_collection()
    policy = await collection.find_one({"_id": pid})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Simple check: Is hospital linked to the insurer? 
    # Or is it an internal hospital policy?
    # For now, allow viewing if policy exists for logged in users.
    
    policy["id"] = str(policy["_id"])
    return policy
