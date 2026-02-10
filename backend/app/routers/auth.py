from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr

class LoginResponse(BaseModel):
    token: str
    message: str

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    # Mock login logic - accept any valid email
    if not request.email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    return {
        "token": "mock-jwt-token-12345",
        "message": "Login successful"
    }
