from fastapi import FastAPI
from app.core.database import db
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    db.connect()
    yield
    db.close()

app = FastAPI(title="Insurance Claim Verification API", lifespan=lifespan)

# CORS (Allowing all for scaffold)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Insurance Claim Verification API is running"}

from app.routers import auth, policies, claims
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(policies.router, prefix="/policies", tags=["Policies"])
app.include_router(claims.router, prefix="/claims", tags=["Claims"])


