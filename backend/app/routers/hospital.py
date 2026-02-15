from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from app.core.deps import require_role, get_current_user
from app.models.user import User, UserRole
from app.models.policy import Policy, RequiredDocument
from app.models.patient_file import PatientFile, FileStatus
from app.models.hospital import Hospital
from app.core.database import db
from typing import List, Optional
from pydantic import BaseModel
from app.services.ai_service import AIService
import shutil
import os
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
    required_documents: List[RequiredDocumentInput] = []
    additional_notes: Optional[str] = None
    policy_pdf_url: Optional[str] = None

class PolicyUpdateRequest(BaseModel):
    name: Optional[str] = None
    required_documents: Optional[List[RequiredDocumentInput]] = None
    additional_notes: Optional[str] = None
    policy_pdf_url: Optional[str] = None

class ScoreRequest(BaseModel):
    score: int
    notes: Optional[str] = None

@router.post("/policies", response_model=Policy, dependencies=[Depends(require_role([UserRole.HOSPITAL]))])
async def create_custom_policy(
    name: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    hospital_id = current_user.hospital_id
    if not hospital_id:
        raise HTTPException(status_code=400, detail="User not linked to a hospital")

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
        hospital_id=hospital_id,
        connected_hospital_ids=[hospital_id],
        policy_pdf_path=file_path,
        required_documents=suggested_docs,
        status="DRAFT"
    )
    
    result = await db.db["policies"].insert_one(new_policy.model_dump(by_alias=True, exclude={"id"}))
    created = await db.db["policies"].find_one({"_id": result.inserted_id})
    if created:
        created["id"] = str(created["_id"])
    return created

@router.get("/policies", response_model=List[Policy], dependencies=[Depends(require_role([UserRole.HOSPITAL]))])
async def list_available_policies(current_user: User = Depends(get_current_user)):
    hospital_id = current_user.hospital_id
    if not hospital_id:
        raise HTTPException(status_code=400, detail="User not linked to a hospital")
    
    policies = await db.db["policies"].find({
        "$or": [
            {"connected_hospital_ids": hospital_id},
            {"hospital_id": hospital_id}
        ]
    }).to_list(100)
    return policies

@router.put("/policies/{policy_id}", response_model=Policy, dependencies=[Depends(require_role([UserRole.HOSPITAL]))])
async def update_hospital_policy(policy_id: str, request: PolicyUpdateRequest, current_user: User = Depends(get_current_user)):
    hospital_id = current_user.hospital_id
    if not hospital_id:
        raise HTTPException(status_code=400, detail="User not linked to a hospital")

    try:
        pid = ObjectId(policy_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Policy ID")

    # Only allow editing policies owned by this hospital
    policy = await db.db["policies"].find_one({"_id": pid, "hospital_id": hospital_id})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found or not owned by your hospital")

    update_data = {}
    if request.name is not None:
        update_data["name"] = request.name
    if request.required_documents is not None:
        update_data["required_documents"] = [d.model_dump() for d in request.required_documents]
    if request.additional_notes is not None:
        update_data["additional_notes"] = request.additional_notes
    if request.policy_pdf_url is not None:
        update_data["policy_pdf_url"] = request.policy_pdf_url

    update_data["updated_at"] = datetime.utcnow()

    if update_data:
        await db.db["policies"].update_one({"_id": pid}, {"$set": update_data})

@router.put("/policies/{policy_id}/finalize", response_model=Policy, dependencies=[Depends(require_role([UserRole.HOSPITAL]))])
async def finalize_hospital_policy(policy_id: str, request: List[RequiredDocumentInput], current_user: User = Depends(get_current_user)):
    hospital_id = current_user.hospital_id
    if not hospital_id:
        raise HTTPException(status_code=400, detail="User not linked to a hospital")

    try:
        pid = ObjectId(policy_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Policy ID")

    req_docs = [
        RequiredDocument(
            document_name=d.document_name,
            description=d.description,
            notes=d.notes,
            mandatory=d.mandatory
        ) for d in request
    ]

    await db.db["policies"].update_one(
        {"_id": pid, "hospital_id": hospital_id},
        {"$set": {
            "required_documents": [d.model_dump() for d in req_docs],
            "status": "ACTIVE",
            "updated_at": datetime.utcnow()
        }}
    )

    updated = await db.db["policies"].find_one({"_id": pid})
    if updated:
        updated["id"] = str(updated["_id"])
    return updated

@router.post("/upload", response_model=PatientFile, dependencies=[Depends(require_role([UserRole.HOSPITAL]))])
async def upload_file(
    patient_name: str = Form(...),
    age: int = Form(...),
    diagnosis: str = Form(...),
    policy_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    hospital_id = current_user.hospital_id
    if not hospital_id:
        raise HTTPException(status_code=400, detail="User not linked to a hospital")
    
    # Verify policy eligibility or ownership
    try:
        pid = ObjectId(policy_id)
        policy = await db.db["policies"].find_one({
            "_id": pid, 
            "$or": [
                {"connected_hospital_ids": hospital_id},
                {"hospital_id": hospital_id}
            ]
        })
    except Exception:
        policy = None

    if not policy:
        policy = await db.db["policies"].find_one({
            "_id": policy_id,
             "$or": [
                {"connected_hospital_ids": hospital_id},
                {"hospital_id": hospital_id}
            ]
        })

    if not policy:
        raise HTTPException(status_code=400, detail="Policy not found or not eligible for this hospital")

    # Save file
    file_location = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    
    new_file = PatientFile(
        patient_name=patient_name,
        age=age,
        diagnosis=diagnosis,
        hospital_id=hospital_id,
        policy_id=policy_id,
        file_url=file_location,
        status=FileStatus.UPLOADED
    )
    
    result = await db.db["patient_files"].insert_one(new_file.model_dump(by_alias=True, exclude={"id"}))
    new_file.id = result.inserted_id
    return new_file

@router.get("/files", response_model=List[PatientFile], dependencies=[Depends(require_role([UserRole.HOSPITAL]))])
async def list_files(current_user: User = Depends(get_current_user)):
    hospital_id = current_user.hospital_id
    files = await db.db["patient_files"].find({"hospital_id": hospital_id}).to_list(100)
    return files

@router.post("/files/{file_id}/score", dependencies=[Depends(require_role([UserRole.HOSPITAL]))])
async def assign_score(file_id: str, request: ScoreRequest, current_user: User = Depends(get_current_user)):
    hospital_id = current_user.hospital_id
    if not hospital_id:
        raise HTTPException(status_code=400, detail="User not linked to a hospital")

    try:
        fid = ObjectId(file_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid File ID")

    file = await db.db["patient_files"].find_one({"_id": fid, "hospital_id": hospital_id})
    if not file:
         raise HTTPException(status_code=404, detail="File not found")
    
    await db.db["patient_files"].update_one(
        {"_id": fid}, 
        {"$set": {"score": request.score, "score_notes": request.notes}}
    )
    return {"message": "Score assigned successfully"}
