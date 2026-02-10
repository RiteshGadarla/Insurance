import asyncio
from app.core.database import db
from app.models.policy import Policy

async def seed_policies():
    db.connect()
    collection = db.db.policies
    
    # Check if policies already exist
    if await collection.count_documents({}) > 0:
        print("Policies already populated.")
        db.close()
        return

    policies = [
        Policy(
            name="Standard Cashless Health Policy",
            insurer="Acme Insurance",
            required_documents=[
                "Discharge Summary",
                "Final Hospital Bill", 
                "Pharmacy Bills",
                "Patient ID Proof"
            ],
            notes="Standard policy for cashless claims."
        ),
        Policy(
            name="Reimbursement Health Plan – Basic",
            insurer="Global Health",
            required_documents=[
                "Discharge Summary",
                "Final Hospital Bill",
                "Payment Receipt",
                "Doctor's Prescription",
                "Investigation Reports",
                "Cancelled Cheque"
            ],
            notes="Requires manual reimbursement process."
        ),
        Policy(
            name="Corporate Group Health Policy",
            insurer="Corporate Care",
            required_documents=[
                "Discharge Summary",
                "Final Hospital Bill",
                "Employee ID Card",
                "Pre-authorization Letter"
            ],
            notes="Special corporate rates apply."
        )
    ]

    for policy in policies:
        await collection.insert_one(policy.model_dump(by_alias=True, exclude=["id"]))
    
    print("Seed data inserted successfully.")
    db.close()

if __name__ == "__main__":
    asyncio.run(seed_policies())
