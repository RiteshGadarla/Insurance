from fastapi import APIRouter, HTTPException, status, Depends
from app.models.user import User, UserRole
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.database import db
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import timedelta

router = APIRouter()

class UserCreate(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    name: str
    password: str
    role: UserRole = UserRole.HOSPITAL

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str
    id: str

@router.post("/signup", response_model=User)
async def signup(user: UserCreate):
    # Check if user exists
    existing_user = await db.db["users"].find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        name=user.name,
        role=user.role,
        password_hash=hashed_password
    )
    
    # Save to DB
    result = await db.db["users"].insert_one(new_user.model_dump(by_alias=True, exclude={"id"}))
    new_user.id = result.inserted_id
    return new_user

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = await db.db["users"].find_one({"username": user_credentials.username})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    user_obj = User(**user)
    
    if not verify_password(user_credentials.password, user_obj.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    access_token = create_access_token(
        data={"sub": user_obj.username, "role": user_obj.role, "name": user_obj.name, "id": str(user_obj.id)}
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user_obj.role, 
        "name": user_obj.name,
        "id": str(user_obj.id)
    }
