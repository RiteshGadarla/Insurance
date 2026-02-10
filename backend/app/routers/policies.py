from fastapi import APIRouter, HTTPException, Body
from typing import List
from app.models.policy import Policy
from app.core.collections import get_policy_collection

router = APIRouter()

@router.post("/", response_model=Policy)
async def create_policy(policy: Policy):
    collection = get_policy_collection()
    new_policy = await collection.insert_one(policy.model_dump(by_alias=True, exclude=["id"]))
    created_policy = await collection.find_one({"_id": new_policy.inserted_id})
    return created_policy

@router.get("/", response_model=List[Policy])
async def get_policies():
    collection = get_policy_collection()
    policies = await collection.find().to_list(100)
    return policies

from fastapi import File, UploadFile, Form
from app.utils.file_handling import save_upload_file

@router.post("/with-file", response_model=Policy)
async def create_policy_with_file(
    name: str = Form(...),
    insurer: str = Form(...),
    required_documents: str = Form(...), # Comma separated
    notes: str = Form(None),
    file: UploadFile = File(None)
):
    valid_required_docs = [d.strip() for d in required_documents.split(",")] if required_documents else []
    
    file_path = None
    if file:
        file_path = save_upload_file(file, "policies")

    policy = Policy(
        name=name,
        insurer=insurer,
        required_documents=valid_required_docs,
        notes=notes,
        document_path=file_path
    )
    
    collection = get_policy_collection()
    new_policy = await collection.insert_one(policy.model_dump(by_alias=True, exclude=["id"]))
    created_policy = await collection.find_one({"_id": new_policy.inserted_id})
    return created_policy
