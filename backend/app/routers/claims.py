from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, BackgroundTasks, Body
from typing import List, Dict, Any, Optional
from app.models.claim import Claim, AIDocumentFeedback
from app.models.policy import Policy
from app.models.user import User, UserRole
from app.models.document import Document
from app.core.collections import get_claim_collection, get_document_collection, get_policy_collection
from app.core.deps import get_current_user
from app.utils.file_handling import save_upload_file
from bson import ObjectId
import math
from datetime import datetime

# Mock AI Service - In a real app, this would be imported from services
class AIService:
    @staticmethod
    def analyze_claim(claim_data: Dict, policy_data: Dict, docs: List[Dict]) -> Dict:
        # Valid Mock Logic
        score = 85
        notes = "AI Analysis Complete. All documents match policy requirements."
        estimated_amount = 4500.0  # Just a mock
        
        doc_feedback = []
        for d in docs:
            doc_feedback.append({
                "document_name": d.get("document_name", "Unknown"),
                "feedback_note": "Document specific feedback: Looks valid."
            })
            
        ready = True
        return {
            "ai_score": score,
            "ai_estimated_amount": estimated_amount,
            "ai_notes": notes,
            "ai_document_feedback": doc_feedback,
            "ai_ready_for_review": ready
        }

router = APIRouter()

@router.post("/", response_model=Claim)
async def create_claim(claim: Claim, user: User = Depends(get_current_user)):
    if user.role != UserRole.HOSPITAL:
        raise HTTPException(status_code=403, detail="Only hospitals can create claims")
    
    # Assign Hospital ID
    claim.hospital_id = user.hospital_id or str(user.id)
    claim.status = "DRAFT"
    
    collection = get_claim_collection()
    new_claim = await collection.insert_one(claim.model_dump(by_alias=True, exclude={"id"}))
    created_claim = await collection.find_one({"_id": new_claim.inserted_id})
    if created_claim:
        created_claim["id"] = str(created_claim["_id"])
    return created_claim

@router.get("/", response_model=List[Claim])
async def get_claims(user: User = Depends(get_current_user)):
    collection = get_claim_collection()
    
    if user.role == UserRole.HOSPITAL:
        claims = await collection.find({"hospital_id": user.hospital_id or str(user.id)}).to_list(100)
    
    elif user.role == UserRole.INSURANCE_COMPANY:
        # Find policies owned by this company
        company_id = user.insurance_company_id or str(user.id)
        policy_collection = get_policy_collection()
        company_policies = await policy_collection.find({"insurance_company_id": company_id}).to_list(1000)
        policy_ids = [str(p["_id"]) for p in company_policies]
        
        # Insurance sees non-draft CASHLESS claims usually, or verified REIMBURSEMENT
        claims = await collection.find({
            "policy_id": {"$in": policy_ids},
            "status": {"$in": ["REVIEW_READY", "APPROVED", "REJECTED", "ANALYZED"]} 
        }).to_list(100)
        
    elif user.role == UserRole.ADMIN:
        # Admin generally doesn't manage claims in this scope, but let's allow viewing all for debug if needed
        return [] 
    
    else:
        return []
        
    return claims

@router.get("/{claim_id}", response_model=Dict[str, Any])
async def get_claim_details(claim_id: str, user: User = Depends(get_current_user)):
    collection = get_claim_collection()
    try:
        oid = ObjectId(claim_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid Claim ID")
        
    claim = await collection.find_one({"_id": oid})
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    # RBAC Check
    if user.role == UserRole.HOSPITAL:
        if claim.get("hospital_id") != (user.hospital_id or str(user.id)):
            raise HTTPException(status_code=403, detail="Not authorized to view this claim")
            
    elif user.role == UserRole.INSURANCE_COMPANY:
        # Check if policy belongs to company
        policy_collection = get_policy_collection()
        if claim.get("policy_id"):
            policy = await policy_collection.find_one({"_id": ObjectId(claim["policy_id"])})
            if not policy or policy.get("insurance_company_id") != (user.insurance_company_id or str(user.id)):
                raise HTTPException(status_code=403, detail="Not authorized to view this claim")
        else:
             # If no policy linked yet (Reimbursement draft?), insurance shouldn't see it probably
             raise HTTPException(status_code=403, detail="Not authorized")

    # Fetch Policy Details
    policy_collection = get_policy_collection()
    policy = await policy_collection.find_one({"_id": ObjectId(claim["policy_id"])}) if claim.get("policy_id") else None
    
    if claim:
        claim["id"] = str(claim["_id"])
        if "_id" in claim: del claim["_id"]

    if policy:
        policy["id"] = str(policy["_id"])
        if "_id" in policy: del policy["_id"]
    
    return {"claim": claim, "policy": policy}

@router.post("/{claim_id}/upload", response_model=Claim)
async def upload_document(
    claim_id: str,
    document_name: str, # Should match one of the required_document types
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    if user.role != UserRole.HOSPITAL:
         raise HTTPException(status_code=403, detail="Only hospitals can upload documents")

    collection = get_claim_collection()
    try:
        oid = ObjectId(claim_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid Claim ID")

    claim = await collection.find_one({"_id": oid})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    # Validating ownership
    if claim.get("hospital_id") != (user.hospital_id or str(user.id)):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Save File
    file_path = save_upload_file(file, "claims")
    
    # Update Claim with new document
    doc_entry = {
        "document_name": document_name,
        "url": file_path, # Using 'url' to be generic, though strictly local path here
        "uploaded_at": datetime.utcnow()
    }
    
    await collection.update_one(
        {"_id": oid},
        {"$push": {"uploaded_documents": doc_entry}}
    )
    
    # Trigger AI Processing (Simplified: Run immediately)
    # Fetch updated claim
    updated_claim = await collection.find_one({"_id": oid})
    
    # Fetch Policy
    policy_collection = get_policy_collection()
    policy = await policy_collection.find_one({"_id": ObjectId(updated_claim["policy_id"])}) if updated_claim.get("policy_id") else {}
    
    # Run AI Analysis
    ai_result = AIService.analyze_claim(updated_claim, policy, updated_claim.get("uploaded_documents", []))
    
    # Update Claim with AI results
    await collection.update_one(
        {"_id": oid},
        {"$set": ai_result}
    )
    
    return await collection.find_one({"_id": oid})

@router.post("/{claim_id}/submit-review")
async def submit_for_review(claim_id: str, user: User = Depends(get_current_user)):
    if user.role != UserRole.HOSPITAL:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    collection = get_claim_collection()
    try:
        oid = ObjectId(claim_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid Claim ID")

    claim = await collection.find_one({"_id": oid})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    if claim.get("hospital_id") != (user.hospital_id or str(user.id)):
         raise HTTPException(status_code=403, detail="Not authorized")

    if claim.get("policy_type") == "CASHLESS":
        new_status = "REVIEW_READY"
    else:
        # Reimbursement flow might differ, but for now...
        new_status = "ANALYZED" # Or similar

    await collection.update_one(
        {"_id": oid},
        {"$set": {"status": new_status}}
    )
    return {"message": f"Claim status updated to {new_status}"}

@router.post("/{claim_id}/decide")
async def judge_claim(
    claim_id: str, 
    decision: str = Body(..., embed=True), # APPROVED or REJECTED
    reason: Optional[str] = Body(None, embed=True),
    user: User = Depends(get_current_user)
):
    if user.role != UserRole.INSURANCE_COMPANY:
         raise HTTPException(status_code=403, detail="Only Insurance Companies can decide claims")
         
    collection = get_claim_collection()
    try:
        oid = ObjectId(claim_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid Claim ID")
        
    claim = await collection.find_one({"_id": oid})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    # Verify ownership via policy
    policy_collection = get_policy_collection()
    policy = await policy_collection.find_one({"_id": ObjectId(claim["policy_id"])})
    if not policy or policy.get("insurance_company_id") != (user.insurance_company_id or str(user.id)):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if decision not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Invalid decision")
        
    update_data = {"status": decision}
    if decision == "REJECTED":
        if not reason:
             raise HTTPException(status_code=400, detail="Rejection reason is required")
        update_data["rejection_reason"] = reason
        
    await collection.update_one(
        {"_id": oid},
        {"$set": update_data}
    )
    
    return {"message": f"Claim {decision}"}
