import asyncio
import os
import shutil
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from app.main import app
from app.models.user import User, UserRole
from app.core.deps import get_current_user
from bson import ObjectId

# Mock User
mock_user = User(
    id=ObjectId("507f1f77bcf86cd799439011"),
    username="insurer",
    name="Insurer Name",
    email="insurer@example.com",
    role=UserRole.INSURANCE_COMPANY,
    insurance_company_id="company123",
    password_hash="hashed_secret"
)

# Mock Dependency
app.dependency_overrides[get_current_user] = lambda: mock_user

def test_claims_processing_flow():
    # 1. Mock OCR and Gemini
    with patch("app.services.ocr_service.pytesseract.image_to_string") as mock_ocr, \
         patch("app.services.ai_service.genai.GenerativeModel.generate_content") as mock_gemini, \
         patch("app.services.ocr_service.Image.open") as mock_image_open:
        
        # Mock Image.open to return a dummy object
        mock_image_open.return_value = MagicMock()

        with TestClient(app) as client:
            # Setup Mocks
            mock_ocr.return_value = "Policy Number: 12345. Coverage: Full Health. Required: Diagnosis Report."
            
            mock_gemini_response = MagicMock()
            mock_gemini_response.text = '{"is_valid": true, "violation_probability": 10, "anomalies": [], "violations": [], "confidence_score": 90, "summary": "Looks good"}'
            mock_gemini.return_value = mock_gemini_response

            # 2. Upload Policy Document (Store file first)
            # We need to simulate the file existing for the policy creation logic
            os.makedirs("uploads/policies", exist_ok=True)
            with open("uploads/policies/test_policy.png", "wb") as f:
                f.write(b"fake image content")
                
            # 3. Create Policy
            policy_data = {
                "name": "Test Health Policy",
                "policy_pdf_path": "policies/test_policy.png", 
                "required_documents": [
                    {"document_name": "Diagnosis Report", "description": "Report"}
                ]
            }
            
            # Note: We need to mock OCR service call directly or ensure it runs. 
            # Since we patched `pytesseract.image_to_string`, the service code will call it.
            # But `ocr_service` checks for file existence. We created the file.
            
            try:
                response = client.post("/policies/", json=policy_data)
                if response.status_code != 200:
                    print(f"Create Policy Failed: {response.text}")
                assert response.status_code == 200
            except Exception as e:
                print(f"Exception during Create Policy: {e}")
                raise e
                
            policy = response.json()
            policy_id = policy.get("id") or policy.get("_id")
            print(f"Policy Created: {policy_id}")
            
            # Verify Extraction
            # Note: In our implementation we check if `policy_pdf_path` exists.
            # The service calls `extract_text`.
            # `os.path.exists` will be called.
            
            # 4. Upload Hospital Document
            # We need a dummy file
            files = {"file": ("bill.png", b"fake bill content", "image/png")}
            data = {
                "policy_id": policy_id,
                "hospital_id": "hosp123",
                "document_type": "Bill"
            }
            
            response = client.post("/documents/submit", data=data, files=files)
            assert response.status_code == 200
            document = response.json()
            print("Document Submitted and Analyzed")
            
            # Verify Results
            assert document["extracted_text"] == "Policy Number: 12345. Coverage: Full Health. Required: Diagnosis Report."
            assert document["analysis_result"]["is_valid"] == True
            print("Verification Successful!")

if __name__ == "__main__":
    try:
        test_claims_processing_flow()
        print("Test Passed")
    except Exception as e:
        print(f"Test Failed: {e}")
