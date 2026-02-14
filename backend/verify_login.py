import httpx
import time
import sys

BASE_URL = "http://localhost:8000"

def test_login():
    print(f"Testing login against {BASE_URL}...")
    client = httpx.Client(base_url=BASE_URL, timeout=10.0)

    try:
        # Check if server is up
        try:
            resp = client.get("/")
            print("Server status:", resp.status_code)
        except Exception as e:
            print("Server not reachable:", e)
            return

        # Login Admin
        print("Logging in as Admin (admin/1234)...")
        response = client.post("/auth/login", json={
            "username": "admin",
            "password": "1234"
        })
        if response.status_code != 200:
            print("Admin Login Failed:", response.text)
            return
        
        data = response.json()
        print("Login Successful!")
        print("Token:", data["access_token"][:20] + "...")
        print("Role:", data["role"])

    finally:
        client.close()

if __name__ == "__main__":
    test_login()
