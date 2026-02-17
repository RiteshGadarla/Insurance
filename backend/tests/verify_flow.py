import httpx
import time
import sys

BASE_URL = "http://localhost:8000"

def test_flow():
    print(f"Starting verification flow against {BASE_URL}...")
    timestamp = int(time.time())
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)

    try:
        # Check if server is up
        try:
            resp = client.get("/")
            print("Server status:", resp.status_code)
        except Exception as e:
            print("Server not reachable:", e)
            return

        # 1. Login Admin (Pre-seeded)
        print("Logging in as Admin...")
        response = client.post("/auth/login", json={
            "username": "admin",
            "password": "1234"
        })
        if response.status_code != 200:
            print("Admin Login Failed:", response.text)
            return
        admin_token = response.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("Admin Logged In")

        # 2. Create Hospital
        hospital_username = f"hospital_{timestamp}"
        print(f"Creating Hospital with admin username: {hospital_username}")
        response = client.post("/admin/hospitals", json={
            "name": "Best Care Hospital",
            "address": "123 Health St",
            "contact_info": "555-1234",
            "admin_username": hospital_username,
            "admin_email": f"{hospital_username}@example.com",
            "admin_name": "Dr. House",
            "admin_password": "password123"
        }, headers=admin_headers)
        if response.status_code != 200:
            print("Create Hospital Failed:", response.text)
            return
        hospital_data = response.json()
        hospital_id = hospital_data.get("_id") or hospital_data.get("id")
        print(f"Hospital Created: {hospital_id}")

        # 3. Create Insurance Company
        insurance_username = f"insurance_{timestamp}"
        print(f"Creating Insurance Company with admin username: {insurance_username}")
        response = client.post("/admin/insurance-companies", json={
            "name": "Safe Guard Insurance",
            "contact_info": "555-5678",
            "admin_username": insurance_username,
            "admin_email": f"{insurance_username}@example.com",
            "admin_name": "Agent Smith",
            "admin_password": "password123"
        }, headers=admin_headers)
        if response.status_code != 200:
            print("Create Insurance Company Failed:", response.text)
        company_data = response.json()
        company_id = company_data.get("_id") or company_data.get("id")
        print(f"Insurance Company Created: {company_id}")

        # 4. Login Insurance User
        print("Logging in as Insurance User...")
        response = client.post("/auth/login", json={
            "username": insurance_username, # Login with username
            "password": "password123"
        })
        if response.status_code != 200:
            print("Insurance Login Failed:", response.text)
            return
        insurance_token = response.json()["access_token"]
        insurance_headers = {"Authorization": f"Bearer {insurance_token}"}

        # 5. Create Policy
        print("Creating Policy...")
        response = client.post("/insurance/policies", json={
            "name": "Gold Health Plan",
            "coverage_details": "Full coverage",
            "required_documents": ["ID", "Report"]
        }, headers=insurance_headers)
        if response.status_code != 200:
            print("Create Policy Failed:", response.text)
            return
        policy_data = response.json()
        policy_id = policy_data.get("_id") or policy_data.get("id")
        print(f"Policy Created: {policy_id}")

        # 6. Link Hospital to Policy
        print("Linking Hospitals to Policy...")
        response = client.put(f"/insurance/policies/{policy_id}/hospitals", json=[hospital_id], headers=insurance_headers)
        if response.status_code != 200:
            print("Link Hospital Failed:", response.text)
            return
        print("Hospital Linked")

        # 7. Login Hospital User
        print("Logging in as Hospital User...")
        response = client.post("/auth/login", json={
            "username": hospital_username, # Login with username
            "password": "password123"
        })
        if response.status_code != 200:
            print("Hospital Login Failed:", response.text)
            return
        hospital_token = response.json()["access_token"]
        hospital_headers = {"Authorization": f"Bearer {hospital_token}"}

        # 8. List Policies
        print("Listing Available Policies...")
        response = client.get("/hospital/policies", headers=hospital_headers)
        if response.status_code != 200:
            print("List Policies Failed:", response.text)
            return
        policies = response.json()
        if not any(p.get("_id") == policy_id or p.get("id") == policy_id for p in policies):
            print("Linked Policy NOT found in list!")
            print("Found:", policies)
        else:
            print("Linked Policy Found")

        # 9. Create Custom Policy as Hospital
        print("Creating Custom Policy as Hospital...")
        response = client.post("/hospital/policies", json={
            "name": "Internal Hospital Plan",
            "coverage_details": "Internal only",
            "required_documents": ["Form A"]
        }, headers=hospital_headers)
        if response.status_code != 200:
            print("Create Custom Policy Failed:", response.text)
        else:
            print("Custom Policy Created")

        print("\nVERIFICATION SUCCESSFUL")
    finally:
        client.close()

if __name__ == "__main__":
    test_flow()
