
import asyncio
import httpx
from bson import ObjectId
import json

# Configuration
API_URL = "http://localhost:8000"

async def reproduction_script():
    async with httpx.AsyncClient(base_url=API_URL, timeout=30.0) as client:
        # 1. Login as Admin
        print("Logging in as Admin...")
        resp = await client.post("/auth/login", json={
            "username": "admin",
            "password": "password"  # Assuming password is "password" based on common dev setup, else try "1234"
        })
        if resp.status_code != 200:
             # Try "1234" as seen in seed_admin.py
            print("Retrying admin login with '1234'...")
            resp = await client.post("/auth/login", json={
                "username": "admin",
                "password": "1234"
            })
        
        if resp.status_code != 200:
            print(f"Failed to login as admin: {resp.text}")
            return
            
        admin_token = resp.json()["access_token"]
        print("Admin logged in.")

        # 2. Create Insurance Company
        company_suffix = str(ObjectId())
        company_data = {
            "name": f"Test Insurance Co {company_suffix}",
            "contact_info": "contact@test.com",
            "admin_username": f"company_admin_{company_suffix}",
            "admin_email": f"company_{company_suffix}@test.com",
            "admin_name": "Company Admin",
            "admin_password": "password"
        }
        print(f"Creating Insurance Company: {company_data['name']}")
        resp = await client.post("/admin/insurance-companies", json=company_data, headers={"Authorization": f"Bearer {admin_token}"})
        if resp.status_code != 200:
            print(f"Failed to create company: {resp.text}")
            return
        company = resp.json()
        print(f"Company Response: {company}")
        company_id = company.get("id") or company.get("_id")
        print(f"Company Created: {company_id}")

        # 3. Login as Company Admin
        print("Logging in as Company Admin...")
        resp = await client.post("/auth/login", json={
            "username": company_data["admin_username"],
            "password": company_data["admin_password"]
        })
        if resp.status_code != 200:
            print(f"Failed to login as company admin: {resp.text}")
            return
        company_token = resp.json()["access_token"]

        # 4. Create Policy
        with open("dummy_policy.pdf", "wb") as f:
            f.write(b"%PDF-1.4 dummy content")
            
        print("Creating Policy...")
        files = {"file": ("dummy_policy.pdf", open("dummy_policy.pdf", "rb"), "application/pdf")}
        data = {"name": "Test Policy Cashless"}
        
        resp = await client.post("/insurance/policies", data=data, files=files, headers={"Authorization": f"Bearer {company_token}"})
        if resp.status_code != 200:
            print(f"Failed to create policy: {resp.text}")
            return
        
        policy = resp.json()
        policy_id = policy.get("id") or policy.get("_id")
        print(f"Policy Created: {policy_id}")

        # 5. Create Hospital
        hospital_suffix = str(ObjectId())
        hospital_data = {
            "name": f"Test Hospital {hospital_suffix}",
            "address": "123 Test St",
            "contact_info": "hospital@test.com",
            "admin_username": f"hospital_admin_{hospital_suffix}",
            "admin_email": f"hospital_{hospital_suffix}@test.com",
            "admin_name": "Hospital Admin",
            "admin_password": "password"
        }
        print(f"Creating Hospital: {hospital_data['name']}")
        resp = await client.post("/admin/hospitals", json=hospital_data, headers={"Authorization": f"Bearer {admin_token}"})
        if resp.status_code != 200:
            print(f"Failed to create hospital: {resp.text}")
            return
        hospital = resp.json()
        hospital_id = hospital.get("id") or hospital.get("_id")
        print(f"Hospital Created: {hospital_id}")

        # 6. Link Hospital
        print(f"Linking Hospital {hospital_id} to Company")
        resp = await client.post("/insurance/hospitals/link", json=[hospital_id], headers={"Authorization": f"Bearer {company_token}"})
        if resp.status_code != 200:
            print(f"Failed to link hospital: {resp.text}")
            return

        # 7. Login as Hospital Admin
        print("Logging in as Hospital Admin...")
        resp = await client.post("/auth/login", json={
            "username": hospital_data["admin_username"],
            "password": hospital_data["admin_password"]
        })
        if resp.status_code != 200:
            print(f"Failed to login as hospital admin: {resp.text}")
            return
        hospital_token = resp.json()["access_token"]

        # 8. Create Claim (Cashless)
        print("Attempting to create Cashless Claim...")
        claim_payload = {
            "patient_name": "John Doe",
            "age": 30,
            # "hospital_id": hospital_id, # Frontend doesn't send this
            "policy_id": policy_id,
            "policy_type": "CASHLESS",
            "diagnosis": "Fever",
            "treatment_plan": "Rest and fluids" 
        }
        
        resp = await client.post("/claims/", json=claim_payload, headers={"Authorization": f"Bearer {hospital_token}"})
        print(f"Create Claim Response: {resp.status_code}")
        print(resp.text)
        
        if resp.status_code == 200:
            created_claim = resp.json()
            if "diagnosis" not in created_claim or created_claim["diagnosis"] != "Fever":
                print("FAILURE: Claim created but 'diagnosis' field is missing or incorrect.")
            else:
                print("SUCCESS: Claim created with correct data.")
                
                # 9. Upload Document
                print("Uploading Document...")
                claim_id = created_claim["id"] if "id" in created_claim else created_claim["_id"]
                
                with open("dummy_doc.pdf", "wb") as f:
                    f.write(b"%PDF-1.4 dummy document")
                    
                files = {"file": ("dummy_doc.pdf", open("dummy_doc.pdf", "rb"), "application/pdf")}
                # Note: Using 'document_name' instead of 'type'
                resp = await client.post(f"/claims/{claim_id}/upload?document_name=TestDoc", files=files, headers={"Authorization": f"Bearer {hospital_token}"})
                
                if resp.status_code != 200:
                    print(f"FAILURE: Upload failed: {resp.text}")
                else:
                    updated_claim = resp.json()
                    print("Document uploaded.")
                    
                    # Verify AI did NOT run yet
                    if updated_claim.get("ai_score") is not None:
                         print("FAILURE: AI Analysis ran automatically (should be manual now).")
                    else:
                         print("SUCCESS: AI Analysis did not run automatically.")
                         
                    # 10. Trigger AI Analysis
                    print("Triggering AI Analysis...")
                    resp = await client.post(f"/claims/{claim_id}/analyze", headers={"Authorization": f"Bearer {hospital_token}"})
                    
                    if resp.status_code != 200:
                        print(f"FAILURE: Analysis failed: {resp.text}")
                    else:
                        analyzed_claim = resp.json()
                        if analyzed_claim.get("ai_score") is not None:
                            print(f"SUCCESS: AI Analysis completed. Score: {analyzed_claim['ai_score']}")
                        else:
                            print("FAILURE: AI Analysis returned no score.")
        else:
            print("FAILURE: Could not create claim.")

if __name__ == "__main__":
    asyncio.run(reproduction_script())
