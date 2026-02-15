from app.core.database import db

def get_user_collection():
    return db.db.users

def get_policy_collection():
    return db.db.policies

def get_claim_collection():
    return db.db.claims

def get_document_collection():
    return db.db.documents

def get_insurance_company_collection():
    return db.db.insurance_companies
