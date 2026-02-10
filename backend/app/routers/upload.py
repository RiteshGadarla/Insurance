from fastapi import APIRouter, File, UploadFile
from app.utils.file_handling import save_upload_file

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), sub_dir: str = "misc"):
    file_path = save_upload_file(file, sub_dir)
    return {"filename": file.filename, "file_path": file_path}
