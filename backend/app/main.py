from fastapi import FastAPI
from app.core.database import db
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, admin, hospital, insurance, policies, claims, documents

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

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(hospital.router, prefix="/hospital", tags=["Hospital"])
app.include_router(insurance.router, prefix="/insurance", tags=["Insurance Company"])
app.include_router(policies.router, prefix="/policies", tags=["Policies"]) # Retaining old routes for now
app.include_router(claims.router, prefix="/claims", tags=["Claims"])     # Retaining old routes for now
app.include_router(documents.router, prefix="/documents", tags=["Documents"])
