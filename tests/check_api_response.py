
import requests
import json

BASE_URL = "http://localhost:8000"

def check():
    # Login
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "1234"
    })
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        return

    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get Hospitals
    res = requests.get(f"{BASE_URL}/admin/hospitals", headers=headers)
    if res.status_code != 200:
        print(f"Failed to get hospitals: {res.text}")
        return

    hospitals = res.json()
    print("Hospitals Response:")
    print(json.dumps(hospitals, indent=2))
    
    if hospitals:
        print(f"First hospital keys: {list(hospitals[0].keys())}")
    else:
        print("No hospitals found.")

if __name__ == "__main__":
    check()
