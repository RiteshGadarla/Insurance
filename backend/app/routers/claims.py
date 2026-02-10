from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.models.claim import Claim
from app.models.document import Document
from app.models.policy import Policy
from app.core.collections import get_claim_collection, get_document_collection, get_policy_collection
from bson import ObjectId

router = APIRouter()

@router.post("/", response_model=Claim)
async def create_claim(claim: Claim):
    collection = get_claim_collection()
    new_claim = await collection.insert_one(claim.model_dump(by_alias=True, exclude=["id"]))
    created_claim = await collection.find_one({"_id": new_claim.inserted_id})
    return created_claim

@router.get("/", response_model=List[Claim])
async def get_claims():
    collection = get_claim_collection()
    claims = await collection.find().to_list(100)
    return claims

@router.get("/{claim_id}", response_model=Dict[str, Any])
async def get_claim_details(claim_id: str):
    claim_collection = get_claim_collection()
    claim = await claim_collection.find_one({"_id": ObjectId(claim_id)})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    # Fetch Policy
    policy_collection = get_policy_collection()
    policy = await policy_collection.find_one({"_id": ObjectId(claim["policy_id"])})
    
    # Manually convert ObjectId to str for response
    if claim:
        claim["id"] = str(claim["_id"])
        del claim["_id"]
    
    if policy:
        policy["id"] = str(policy["_id"])
        del policy["_id"]

    # Fetch Uploaded Documents
    doc_collection = get_document_collection()
    uploaded_docs = await doc_collection.find({"claim_id": claim_id}).to_list(100)
    for doc in uploaded_docs:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        
    uploaded_doc_names = [doc["type"] for doc in uploaded_docs]

    # Calculate Missing Documents
    missing_docs = []
    required_docs = []
    if policy:
        required_docs = policy.get("required_documents", [])
        for req_doc in required_docs:
            if req_doc not in uploaded_doc_names:
                missing_docs.append(req_doc)

    return {
        "claim": claim,
        "policy": policy,
        "uploaded_documents": uploaded_docs,
        "missing_documents": missing_docs,
        "required_documents": required_docs,
        "acceptance_score": 65 # Dummy score
    }

import asyncio
import random

@router.post("/{claim_id}/verify")
async def verify_claim(claim_id: str):
    # Simulate processing delay
    await asyncio.sleep(random.randint(3, 5))
    
    return {
        "status": "Verified",
        "score": 85,
        "findings": [
            {"item": "Policy Active", "status": "Pass", "details": "Policy is currently active."},
            {"item": "Documents Complete", "status": "Pass", "details": "All required documents are present."},
            {"item": "Claim Amount", "status": "Review", "details": "Claim amount exceeds typical average for this procedure."},
            {"item": "Network Hospital", "status": "Pass", "details": "Hospital is in the preferred network."}
        ]
    }

from fastapi import File, UploadFile
from app.utils.file_handling import save_upload_file

@router.post("/{claim_id}/documents", response_model=Document)
async def upload_document(
    claim_id: str, 
    type: str, 
    file: UploadFile = File(...)
):
    # Ensure claim exists
    claim_collection = get_claim_collection()
    claim = await claim_collection.find_one({"_id": ObjectId(claim_id)})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    file_path = save_upload_file(file, "claims")
    
    new_doc_data = {
        "claim_id": claim_id,
        "name": file.filename,
        "type": type,
        "file_path": file_path
    }
    
    document = Document(**new_doc_data)
    collection = get_document_collection()
    new_doc = await collection.insert_one(document.model_dump(by_alias=True, exclude=["id"]))
    created_doc = await collection.find_one({"_id": new_doc.inserted_id})
    return created_doc
