from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Form
from app.models.document import Document
from app.models.policy import Policy
from app.core.collections import get_policy_collection, get_document_collection
from app.services.ocr_service import ocr_service
from app.services.ai_service import ai_service
from app.utils.file_handling import save_upload_file
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.post("/submit", response_model=Document)
async def submit_document(
    policy_id: str = Form(...),
    hospital_id: str = Form(...),
    document_type: str = Form("Unknown"),
    file: UploadFile = File(...)
):
    # 1. Save File
    file_path = save_upload_file(file, "documents")
    
    # 2. Extract Text (OCR)
    extracted_text = ocr_service.extract_text(file_path)
    
    # 3. Create Document Record
    doc_data = Document(
        filename=file.filename,
        file_path=file_path,
        policy_id=policy_id,
        hospital_id=hospital_id,
        document_type=document_type,
        extracted_text=extracted_text,
        created_at=datetime.utcnow()
    )
    
    # 4. Fetch Policy for Analysis
    policy_collection = get_policy_collection()
    policy = await policy_collection.find_one({"_id": ObjectId(policy_id)})
    
    if policy:
        # Get Policy Text (prefer extracted, fallback to raw description/name)
        policy_text = policy.get("extracted_text", "")
        if not policy_text:
             policy_text = f"Policy Name: {policy.get('name')}. Notes: {policy.get('additional_notes')}"
        
        # 5. Analyze with Gemini
        analysis = ai_service.analyze_document(policy_text, extracted_text, document_type)
        doc_data.analysis_result = analysis
    
    # 6. Save to DB
    doc_collection = get_document_collection()
    inserted = await doc_collection.insert_one(doc_data.model_dump(by_alias=True, exclude={"id"}))
    
    # 7. Return Result
    created_doc = await doc_collection.find_one({"_id": inserted.inserted_id})
    if created_doc:
        created_doc["id"] = str(created_doc["_id"])
        
    return created_doc
