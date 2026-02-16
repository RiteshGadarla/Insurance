import os
import sys

# Add current directory to path
sys.path.append(os.getcwd())

try:
    from app.main import app
    print("Import Success")
except Exception as e:
    print(f"Import Failed: {e}")
    exit(1)

try:
    from fastapi.testclient import TestClient
    client = TestClient(app)
    print("Client Init Success")
except Exception as e:
    print(f"Client Init Failed: {e}")
    # Print full traceback
    import traceback
    traceback.print_exc()
    exit(1)
