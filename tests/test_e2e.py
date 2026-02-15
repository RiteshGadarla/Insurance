import requests
import time
import sys

BASE_URL = "http://localhost:8000"

def log(msg):
    print(f"[TEST] {msg}")

def check(response, expected_status=200):
    if response.status_code != expected_status:
        log(f"FAILED: {response.status_code} - {response.text}")
        sys.exit(1)
    return response.json()

def run_test():
    log("Starting E2E Test...")

    # 1. Admin Login (Assuming seed data or create on fly if possible, but let's try default admin)
    # The system likely has a create_initial_data script or similar. 
    # Let's try to create an admin user directly if endpoints allow open registration (unlikely) 
    # or use the /token endpoint with known credentials.
    # Given I don't know exact credentials, I might need to create them or rely on what's there.
    # Let's assume standard 'admin' / 'admin' or similar, or I can create one via a shell script using python shell.
    # Actually, the user's previous context implies I can just create users if I have access to DB, but I want to test API.
    
    # Let's try to register a new admin if the endpoint exists, otherwise login.
    # Looking at auth router (not visible now but standard), usually /auth/register or /auth/login.
    # Let's try to create a new user for this test.
    
    session = requests.Session()
    
    # Register Admin
    admin_username = f"admin_{int(time.time())}"
    admin_email = f"{admin_username}@example.com"
    admin_pass = "secret"
    log(f"Registering Admin: {admin_username}")
    res = requests.post(f"{BASE_URL}/auth/signup", json={
        "username": admin_username,
        "email": admin_email,
        "password": admin_pass,
        "name": "Test Admin",
        "role": "admin"
    })
    
    if res.status_code == 200:
        log("Admin Registered")
    elif res.status_code == 400: # Already exists?
        log("Admin might exist, trying login")
    else:
        log(f"Register failed: {res.text}")

    # Login Admin
    log("Logging in Admin...")
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "username": admin_username,
        "password": admin_pass
    })
    if res.status_code != 200:
         log("Login failed, trying default admin")
         res = requests.post(f"{BASE_URL}/auth/login", json={
            "username": "admin",
            "password": "password" # Assuming default credentials if any
        })
         if res.status_code != 200:
             log(f"Could not login as admin. Response: {res.text}")
             sys.exit(1)
             
    admin_token = res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    log("Admin Logged In")

    # 2. Create Insurance Company
    log("Creating Insurance Company...")
    insurance_data = {
        "name": f"Test Insure {int(time.time())}",
        "contact_info": "1-800-TEST",
        "admin_username": f"insure_admin_{int(time.time())}",
        "admin_name": "Insure Admin",
        "admin_password": "password123"
    }
    res = requests.post(f"{BASE_URL}/admin/insurance-companies", json=insurance_data, headers=admin_headers)
    check(res, 200)
    insure_company = res.json()
    insure_id = insure_company.get("id") or insure_company.get("_id")
    log(f"Insurance Company Created: {insure_id}")

    # 3. Create Hospital
    log("Creating Hospital...")
    hospital_data = {
        "name": f"Test Hospital {int(time.time())}",
        "address": "123 Test St",
        "contact_info": "555-0199",
        "admin_username": f"hosp_admin_{int(time.time())}",
        "admin_name": "Hospital Admin",
        "admin_password": "password123"
    }
    res = requests.post(f"{BASE_URL}/admin/hospitals", json=hospital_data, headers=admin_headers)
    check(res, 200)
    hospital = res.json()
    hospital_id = hospital.get("id") or hospital.get("_id")
    log(f"Hospital Created: {hospital_id}")

    # 4. Login as Insurance Company to create Policy
    log("Logging in as Insurance Admin...")
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "username": insurance_data["admin_username"],
        "password": insurance_data["admin_password"]
    })
    check(res, 200)
    insure_token = res.json()["access_token"]
    insure_headers = {"Authorization": f"Bearer {insure_token}"}

    # Create Policy
    log("Creating Policy...")
    policy_data = {
        "name": "Gold Health Plan",
        "type": "CASHLESS",
        "coverage_limit": 50000,
        "premium": 500,
        "insurer": "Test Insure",
        "insurance_company_id": insure_id,
        "required_documents": [{"document_name": "Diagnosis Report", "description": "Medical report"}],
        "connected_hospital_ids": [hospital_id]
    }
    res = requests.post(f"{BASE_URL}/policies/", json=policy_data, headers=insure_headers)
    check(res, 200)
    policy = res.json()
    policy_id = policy.get("id") or policy.get("_id")
    log(f"Policy Created: {policy_id}")

    # 5. Login as Hospital to Submit Claim
    log("Logging in as Hospital Admin...")
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "username": hospital_data["admin_username"],
        "password": hospital_data["admin_password"]
    })
    check(res, 200)
    hospital_token = res.json()["access_token"]
    hospital_headers = {"Authorization": f"Bearer {hospital_token}"}

    # Create Draft Claim
    log("Creating Draft Claim...")
    claim_data = {
        "patient_name": "John Doe",
        "age": 30,
        "hospital_id": hospital_id,
        "policy_type": "CASHLESS",
        "policy_id": policy_id
    }
    res = requests.post(f"{BASE_URL}/claims/", json=claim_data, headers=hospital_headers)
    check(res, 200)
    claim = res.json()
    claim_id = claim.get("id") or claim.get("_id")
    log(f"Claim Created: {claim_id}")

    # Upload Document
    log("Uploading Document...")
    files = {'file': ('test_doc.txt', 'This is a test medical report')}
    res = requests.post(f"{BASE_URL}/claims/{claim_id}/upload?document_name=Diagnosis Report", files=files, headers={"Authorization": f"Bearer {hospital_token}"})
    if res.status_code != 200: # Try with query param 'type' if 'document_name' fails or vice versa based on router
        # Router says 'document_name'
        check(res, 200)
    
    updated_claim = res.json()
    log(f"Document Uploaded. AI Score: {updated_claim.get('ai_score')}")

    # Submit for Review
    log("Submitting for Review...")
    res = requests.post(f"{BASE_URL}/claims/{claim_id}/submit-review", headers=hospital_headers)
    check(res, 200)
    log("Claim Submitted")

    # 6. Login as Insurance to Approve
    # (Reuse existing token)
    
    # Get Claim Details
    log("Fetching Claim Details (Insurance)...")
    res = requests.get(f"{BASE_URL}/claims/{claim_id}", headers=insure_headers)
    check(res, 200)
    
    # Approve Claim
    log("Approving Claim...")
    decision_data = {"decision": "APPROVED"}
    res = requests.post(f"{BASE_URL}/claims/{claim_id}/decide", json=decision_data, headers=insure_headers)
    check(res, 200)
    log("Claim Approved")

    log("SUCCESS: End-to-End Test Passed!")

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        log(f"Test Failed with Exception: {e}")
        sys.exit(1)
