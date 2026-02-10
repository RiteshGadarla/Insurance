import shutil
import os
from fastapi import UploadFile
from uuid import uuid4

UPLOAD_DIR = "uploads"

def save_upload_file(upload_file: UploadFile, sub_dir: str) -> str:
    directory = os.path.join(UPLOAD_DIR, sub_dir)
    os.makedirs(directory, exist_ok=True)
    
    file_extension = os.path.splitext(upload_file.filename)[1]
    file_name = f"{uuid4()}{file_extension}"
    file_path = os.path.join(directory, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
        
    return file_path
