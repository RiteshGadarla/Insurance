
import pytest
from app.services.ai_service import ai_service
from unittest.mock import MagicMock, patch

def test_ai_service_initialization():
    # Test that it initializes even without key (graceful degradation)
    service = ai_service
    assert service is not None

@patch("app.services.ai_service.genai.GenerativeModel")
def test_ai_service_analysis_mock(mock_model_class):
    # Mocking the actual Gemini call
    mock_model = mock_model_class.return_value
    mock_response = MagicMock()
    mock_response.text = '```json\n{"score": 90, "estimated_amount": 1000, "findings": [{"item": "Doc 1", "status": "Pass", "details": "Good"}], "notes": "Looks good"}\n```'
    mock_model.generate_content.return_value = mock_response
    
    # Needs API Key to even try generating
    with patch.dict('os.environ', {'GEMINI_API_KEY': 'fake_key'}):
        # Re-init to pick up key
        service = ai_service
        service.api_key = "fake_key" 
        service.model = mock_model_class() # re-mock
        
        claim = {"diagnosis": "Flu", "treatment_plan": "Rest", "total_amount": 1200}
        policy = {"name": "Basic", "coverage_limit": 5000, "required_documents": ["Prescription"]}
        docs = [{"type": "Prescription"}]
        
        result = service.analyze_claim(claim, policy, docs)
        
        assert result["score"] == 90
        assert result["estimated_amount"] == 1000
        assert len(result["findings"]) == 1
        assert result["findings"][0]["status"] == "Pass"

def test_ai_service_missing_key():
    # Ensure it returns system error if no key
    service = ai_service
    service.api_key = None
    
    result = service.analyze_claim({}, {}, [])
    assert result["score"] == 0
    assert result["findings"][0]["item"] == "System"
