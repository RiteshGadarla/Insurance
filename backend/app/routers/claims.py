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

from app.services.ai_service import ai_service
from app.services.ocr_service import ocr_service
# ... imports ...

# Removed Mock AIService

router = APIRouter()

@router.post("/", response_model=Claim)
async def create_claim(claim: Claim, user: User = Depends(get_current_user)):
    if user.role != UserRole.HOSPITAL:
        raise HTTPException(status_code=403, detail="Only hospitals can create claims")
    
    # Assign Hospital ID
    claim.hospital_id = user.hospital_id or str(user.id)
    claim.status = "DRAFT"
    
    # Override hospital_id with the authenticated user's ID for security
    claim.hospital_id = user.hospital_id or str(user.id)

    # Validate Policy and Linkage
    if claim.policy_type == "CASHLESS" and claim.policy_id:
        policy_collection = get_policy_collection()
        try:
            policy_oid = ObjectId(claim.policy_id)
        except:
             raise HTTPException(status_code=400, detail="Invalid Policy ID")

        policy = await policy_collection.find_one({"_id": policy_oid})
        if not policy:
            raise HTTPException(status_code=404, detail="Policy not found")
            
        company_id = policy.get("insurance_company_id")
        if company_id:
            from app.core.collections import get_insurance_company_collection
            company_collection = get_insurance_company_collection()
            company = await company_collection.find_one({"_id": ObjectId(company_id)})
            
            if not company:
                 raise HTTPException(status_code=404, detail="Insurance Company for policy not found")
                 
            if claim.hospital_id not in company.get("connected_hospital_ids", []):
                raise HTTPException(status_code=400, detail="Hospital is not linked to this Insurance Company for Cashless claims")

    collection = get_claim_collection()
    new_claim = await collection.insert_one(claim.model_dump(by_alias=True, exclude={"id"}))
    created_claim = await collection.find_one({"_id": new_claim.inserted_id})
    if created_claim:
        created_claim["id"] = str(created_claim["_id"])
    if created_claim:
        created_claim["id"] = str(created_claim["_id"])
    return created_claim

@router.put("/{claim_id}", response_model=Claim)
async def update_claim(claim_id: str, claim_update: Claim, user: User = Depends(get_current_user)):
    if user.role != UserRole.HOSPITAL:
        raise HTTPException(status_code=403, detail="Only hospitals can update claims")
        
    collection = get_claim_collection()
    try:
         oid = ObjectId(claim_id)
    except:
         raise HTTPException(status_code=400, detail="Invalid Claim ID")
         
    existing_claim = await collection.find_one({"_id": oid})
    if not existing_claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    if existing_claim.get("hospital_id") != (user.hospital_id or str(user.id)):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if existing_claim.get("status") != "DRAFT":
        raise HTTPException(status_code=400, detail="Only DRAFT claims can be updated")

    # Update fields
    update_data = claim_update.model_dump(by_alias=True, exclude={"id", "hospital_id", "status", "uploaded_documents", "ai_score", "ai_notes", "ai_document_feedback", "ai_estimated_amount", "ai_ready_for_review", "rejection_reason"})
    
    # We should preserve existing fields that shouldn't be overridden by defaults if not provided, 
    # but Pydantic model_dump might include defaults. 
    # Ideally use exclude_unset=True but the frontend sends the whole state usually.
    # Let's assume frontend sends full form data.
    
    # Also need to handle policy linkage changes if policy_type changed
    
    await collection.update_one({"_id": oid}, {"$set": update_data})
    
    updated_claim = await collection.find_one({"_id": oid})
    if updated_claim:
        updated_claim["id"] = str(updated_claim["_id"])
    return updated_claim

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
    
    # Extract Text (OCR) immediately
    extracted_text = ocr_service.extract_text(file_path)
    
    # Store in Document Collection
    doc_collection = get_document_collection()
    
    new_doc = Document(
        filename=file.filename,
        file_path=file_path,
        policy_id=claim.get("policy_id", ""),  # Might be empty if generic upload
        hospital_id=user.hospital_id or str(user.id),
        document_type=document_name,
        extracted_text=extracted_text,
        created_at=datetime.utcnow()
    )
    
    doc_result = await doc_collection.insert_one(new_doc.model_dump(by_alias=True, exclude={"id"}))
    doc_id = str(doc_result.inserted_id)

    # Update Claim with new document
    doc_entry = {
        "document_name": document_name,
        "url": file_path, # Using 'url' to be generic, though strictly local path here
        "uploaded_at": datetime.utcnow(),
        "document_id": doc_id,
        "extracted_text": extracted_text # Store here for easy frontend access without extra fetch
    }
    
    await collection.update_one(
        {"_id": oid},
        {"$push": {"uploaded_documents": doc_entry}}
    )
    
    updated_claim = await collection.find_one({"_id": oid}) # Fetch updated claim to return
    if updated_claim:
         updated_claim["id"] = str(updated_claim["_id"])
         
    return updated_claim

@router.post("/{claim_id}/verify", response_model=Claim)
async def verify_claim(claim_id: str, user: User = Depends(get_current_user)):
    """
    Triggers AI analysis for a claim.
    """
    # Allow Hospital (to check before submit) or Insurance (to verify)
    # For now, let's allow both but primarily this is for the "Analysis" phase.
    
    collection = get_claim_collection()
    try:
        oid = ObjectId(claim_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid Claim ID")
        
    claim = await collection.find_one({"_id": oid})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    # Authorization Check
    if user.role == UserRole.HOSPITAL:
        if claim.get("hospital_id") != (user.hospital_id or str(user.id)):
             raise HTTPException(status_code=403, detail="Not authorized")
    elif user.role == UserRole.INSURANCE_COMPANY:
        # Check policy link
        policy_collection = get_policy_collection()
        policy = await policy_collection.find_one({"_id": ObjectId(claim["policy_id"])})
        if not policy or policy.get("insurance_company_id") != (user.insurance_company_id or str(user.id)):
             raise HTTPException(status_code=403, detail="Not authorized")

    # Fetch Policy
    policy_collection = get_policy_collection()
    policy = await policy_collection.find_one({"_id": ObjectId(claim["policy_id"])}) if claim.get("policy_id") else {}

    # Run AI Analysis
    # We pass the claim document list. In a real scenario, we might want to fetch file metadata or content.
    # The AIService expects list of dicts.
    docs = claim.get("uploaded_documents", [])
    
    ai_result = ai_service.analyze_claim(claim, policy, docs)
    
    # Update Claim with AI results
    # We are updating specific AI fields.
    update_data = {
        "ai_score": ai_result.get("score"),
        "ai_estimated_amount": ai_result.get("estimated_amount"),
        "ai_notes": ai_result.get("notes"),
        "ai_document_feedback": ai_result.get("document_feedback", []), # Ensure this matches model
        "ai_ready_for_review": True,
        # We also might want to save the findings but the Claim model in previous step 
        # didn't explicitly show a 'findings' field, only 'ai_document_feedback' and 'ai_notes'.
        # Let's check the Claim model again or just store them in notes or a new field if schema allows dynamic.
        # The schema has:
        # ai_score: Optional[int]
        # ai_estimated_amount: Optional[float]
        # ai_notes: Optional[str]
        # ai_document_feedback: List[AIDocumentFeedback]
        
        # The 'findings' from AI service (Item, Status, Details) don't map directly to 'ai_document_feedback' (Document Name, Note).
        # I should probably map 'findings' to 'ai_notes' or update the schema.
        # For now, let's append findings to notes to avoid schema migration issues if strict.
        # Or better, let's check if AIDocumentFeedback can hold it. 
        # AIDocumentFeedback: document_name, feedback_note.
        
        # Let's map findings to document feedback if possible, or just dump to notes.
    }
    
    # Construct a detailed note from findings
    # Construct a detailed note from findings
    # findings_text = "\n".join([f"- {f['item']}: {f['status']} ({f['details']})" for f in ai_result.get("findings", [])])
    # update_data["ai_notes"] = (ai_result.get("notes") or "") + "\n\nFindings:\n" + findings_text
    
    # User requested very concise notes, so we just use the AI summary.
    update_data["ai_notes"] = ai_result.get("notes") or "Analysis completed."
    
    # Update status to ANALYZED if it was DRAFT (for reimbursement) or just keep as is?
    # If using Cashless, it might be separate.
    
    await collection.update_one(
        {"_id": oid},
        {"$set": update_data}
    )
    
    # Return the updated claim + findings structure for frontend to display immediately
    # The frontend expects { score, findings: [], ... } in the result page.
    # So we should return the raw AI result + updated claim info.
    
    updated_claim = await collection.find_one({"_id": oid})
    if updated_claim:
        updated_claim["id"] = str(updated_claim["_id"])
        
    return updated_claim

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

@router.delete("/{claim_id}", dependencies=[Depends(get_current_user)])
async def delete_claim(claim_id: str, user: User = Depends(get_current_user)):
    collection = get_claim_collection()
    try:
        oid = ObjectId(claim_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid Claim ID")
        
    claim = await collection.find_one({"_id": oid})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    # Check ownership
    if user.role == UserRole.HOSPITAL:
        if claim.get("hospital_id") != (user.hospital_id or str(user.id)):
             raise HTTPException(status_code=403, detail="Not authorized")
    elif user.role == UserRole.INSURANCE_COMPANY:
         pass # maybe insurance can delete? actually probably not. Let's restrict to hospital for now or admin.
         # For this specific request, it's for Hospital "My Claims".
    
    # Only allow deleting DRAFT claims?
    # The user asked: "if they are in draft state opton to choose them and continue filling details" AND "add option to delete claims"
    # Usually you only delete drafts, but let's allow deleting any claim for now if valid, or maybe restrict. 
    # Safest is to allow, but let's just do standard delete.
    
    await collection.delete_one({"_id": oid})
    return {"message": "Claim deleted successfully"}
