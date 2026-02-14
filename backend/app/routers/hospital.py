from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from app.core.deps import require_role, get_current_user
from app.models.user import User, UserRole
from app.models.policy import Policy
from app.models.patient_file import PatientFile, FileStatus
from app.models.hospital import Hospital
from app.core.database import db
from typing import List, Optional
from pydantic import BaseModel
import shutil
import os
from bson import ObjectId

router = APIRouter()

class PolicyCreateRequest(BaseModel):
    name: str
    coverage_details: str
    required_documents: List[str]

class ScoreRequest(BaseModel):
    score: int
    notes: Optional[str] = None

@router.post("/policies", response_model=Policy, dependencies=[Depends(require_role([UserRole.HOSPITAL]))])
async def create_custom_policy(request: PolicyCreateRequest, current_user: User = Depends(get_current_user)):
    hospital_id = current_user.hospital_id
    if not hospital_id:
        raise HTTPException(status_code=400, detail="User not linked to a hospital")
    
    # Get hospital name for insurer field
    hospital = await db.db["hospitals"].find_one({"_id": ObjectId(hospital_id)})
    insurer_name = hospital["name"] if hospital else current_user.name

    new_policy = Policy(
        name=request.name,
        hospital_id=hospital_id,
        coverage_details=request.coverage_details,
        required_documents=request.required_documents,
        insurer=insurer_name,
        eligible_hospital_ids=[hospital_id] # Automatically eligible for own hospital
    )
    
    result = await db.db["policies"].insert_one(new_policy.model_dump(by_alias=True, exclude={"id"}))
    new_policy.id = result.inserted_id
    return new_policy

@router.get("/policies", response_model=List[Policy], dependencies=[Depends(require_role([UserRole.HOSPITAL]))])
async def list_available_policies(current_user: User = Depends(get_current_user)):
    hospital_id = current_user.hospital_id
    if not hospital_id:
        raise HTTPException(status_code=400, detail="User not linked to a hospital")
    
    # Policies eligible for this hospital OR owned by this hospital
    policies = await db.db["policies"].find({
        "$or": [
            {"eligible_hospital_ids": hospital_id},
            {"hospital_id": hospital_id}
        ]
    }).to_list(100)
    return policies

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
                {"eligible_hospital_ids": hospital_id},
                {"hospital_id": hospital_id}
            ]
        })
    except:
        policy = None

    if not policy:
         # Try string match just in case
        policy = await db.db["policies"].find_one({
            "_id": policy_id,
             "$or": [
                {"eligible_hospital_ids": hospital_id},
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
    except:
        raise HTTPException(status_code=400, detail="Invalid File ID")

    # Ensure file belongs to this hospital
    file = await db.db["patient_files"].find_one({"_id": fid, "hospital_id": hospital_id})
    if not file:
         raise HTTPException(status_code=404, detail="File not found")
    
    await db.db["patient_files"].update_one(
        {"_id": fid}, 
        {"$set": {"score": request.score, "score_notes": request.notes}}
    )
    return {"message": "Score assigned successfully"}
