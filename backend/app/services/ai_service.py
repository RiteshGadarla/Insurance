
import os
import google.generativeai as genai
import json
import random
from typing import Dict, Any, List, Optional
from app.models.policy import RequiredDocument
from app.core.config import settings

class AIService:
    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY
        if not self.api_key:
            print("WARNING: GOOGLE_API_KEY not found in settings.")
        else:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.5-flash')

    @staticmethod
    def analyze_policy_pdf(file_path: str) -> List[RequiredDocument]:
        """
        Dummy AI service that simulates policy analysis and returns 
        suggested required documents.
        (Kept for backward compatibility with policy creation flow)
        """
        possible_docs = [
            ("Discharge Summary", "Summary of the patient's hospital stay and treatment."),
            ("Final Bill", "The itemized final bill provided by the hospital."),
            ("Diagnosis Report", "Official document confirming the medical diagnosis."),
            ("ID Card", "Patient's national ID or insurance card."),
            ("Lab Results", "Reports for laboratory tests performed during stay."),
            ("Pharmacy Invoices", "Bills for medications purchased separately."),
            ("Operation Theater Notes", "Detailed notes from any surgical procedures.")
        ]
        
        # Select 3-5 random documents as suggestions
        count = random.randint(3, 5)
        suggestions = random.sample(possible_docs, count)
        
        return [
            RequiredDocument(
                document_name=name,
                description=desc,
                notes="AI suggested based on policy analysis",
                mandatory=True
            ) for name, desc in suggestions
        ]

    def analyze_document(self, policy_text: str, document_text: str, document_type: str) -> Dict[str, Any]:
        """
        Analyzes a single document against the policy text to find violations and anomalies.
        """
        if not self.api_key:
            return {"status": "Error", "message": "AI Service not configured"}

        prompt = f"""
        You are an expert insurance claim adjuster. Compare the following Hospital Document against the Policy Terms.

        **Policy Terms (Extracted Text):**
        {policy_text[:10000]}  # Truncate to avoid token limits if necessary

        **Hospital Document (Extracted Text):**
        Type: {document_type}
        Content:
        {document_text[:10000]}

        **Task:**
        1. Identify any violations of the policy terms in the document.
        2. Identify any anomalies or suspicious details (e.g., mismatched dates, excessive charges, non-medical items).
        3. Determine if the document is valid and verified based on the policy.

        **Output Format (JSON strictly):**
        {{
            "is_valid": <bool>,
            "violation_probability": <int 0-100>,
            "anomalies": [
                {{ "description": "<text>", "severity": "<High/Medium/Low>" }}
            ],
            "violations": [
                {{ "description": "<text>", "policy_clause": "<relevant text from policy>" }}
            ],
            "confidence_score": <int 0-100>,
            "summary": "<Short analysis summary>"
        }}
        """

        try:
            response = self.model.generate_content(prompt)
            clean_text = response.text.replace('```json', '').replace('```', '').strip()
            start = clean_text.find('{')
            end = clean_text.rfind('}') + 1
            if start != -1 and end != -1:
                clean_text = clean_text[start:end]
            return json.loads(clean_text)
        except Exception as e:
            print(f"Gemini Error: {e}")
            return {"status": "Error", "message": str(e)}

    def analyze_claim(self, claim: Dict[str, Any], policy: Dict[str, Any], documents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes a claim against a policy and submitted documents using Gemini.
        """
        if not self.api_key:
            return {
                "score": 0,
                "findings": [{"item": "System", "status": "Fail", "details": "AI Service not configured (missing API Key)"}],
                "notes": "AI analysis unavailable.",
                "estimated_amount": 0,
                "document_feedback": []
            }

        # Construct the prompt
        text_prompt = self._construct_prompt(claim, policy, documents)
        
        # Prepare multimodal content
        contents = [text_prompt]
        
        for doc in documents:
            path = doc.get("url")
            # The path might be relative to root or absolute. 
            # In save_upload_file (utils/file_handling.py), it usually returns strict path or relative.
            # Let's assume relative to backend root or absolute. 
            # If it starts with uploads/, likely relative.
            if path:
                if not os.path.exists(path) and os.path.exists(os.path.join(os.getcwd(), path)):
                    path = os.path.join(os.getcwd(), path)
                
                if os.path.exists(path):
                    try:
                        mime_type = "application/pdf" if path.lower().endswith(".pdf") else "image/jpeg"
                        # For simplicity assuming images are jpeg/png. Gemini handles common formats.
                        if path.lower().endswith(".png"): mime_type = "image/png"
                        
                        with open(path, "rb") as f:
                            file_data = f.read()
                            
                        contents.append({
                            "mime_type": mime_type,
                            "data": file_data
                        })
                    except Exception as e:
                        print(f"Failed to load file {path}: {e}")

        import time
        max_retries = 3
        retry_delay = 5  # Start with 5 seconds

        for attempt in range(max_retries):
            try:
                # Gemini generate_content accepts list of parts (text, images, blobs)
                response = self.model.generate_content(contents)
                # Cleanup json
                clean_text = response.text.replace('```json', '').replace('```', '').strip()
                # Find the first { and last }
                start = clean_text.find('{')
                end = clean_text.rfind('}') + 1
                if start != -1 and end != -1:
                    clean_text = clean_text[start:end]
                
                result = json.loads(clean_text)
                return result
            except Exception as e:
                error_str = str(e)
                if "429" in error_str and attempt < max_retries - 1:
                    print(f"Rate limit hit, retrying in {retry_delay}s...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                    continue
                
                print(f"Error calling Gemini: {e}")
                return {
                    "score": 0,
                    "findings": [{"item": "Error", "status": "Fail", "details": f"AI Analysis failed: {str(e)}"}],
                    "notes": "An error occurred during analysis.",
                    "estimated_amount": 0,
                    "document_feedback": []
                }
        
        # Should not reach here
        return {
            "score": 0,
            "findings": [{"item": "Error", "status": "Fail", "details": "AI Analysis failed after retries"}],
            "notes": "Analysis failed.",
            "estimated_amount": 0,
            "document_feedback": []
        }

    def _construct_prompt(self, claim: Dict[str, Any], policy: Dict[str, Any], documents: List[Dict[str, Any]]) -> str:
        """
        Constructs a detailed prompt for Gemini.
        """
        
        doc_list = ", ".join([d.get("type", "Unknown") for d in documents])
        required_docs_list = policy.get("required_documents", [])
        # Handle if required_docs is list of objects or dicts
        if required_docs_list and isinstance(required_docs_list[0], dict):
             required_docs = ", ".join([d.get("document_name", "") for d in required_docs_list])
        else: 
             required_docs = str(required_docs_list)

        
        prompt = f"""
        You are an expert insurance claim adjuster. Analyze the following claim against the policy and the attached documents (images/PDFs).
        
        **Policy Details:**
        - Name: {policy.get('name')}
        - Coverage Limit: {policy.get('coverage_limit', 'N/A')}
        - Required Documents: {required_docs}
        - Type: {policy.get('type')}
        
        **Claim Details:**
        - Diagnosis: {claim.get('diagnosis')}
        - Treatment Plan: {claim.get('treatment_plan')}
        - Claimed Amount: {claim.get('total_amount', 'Not specified')}
        - Submitted Documents: {doc_list}
        
        **Task:**
        1. Compare submitted documents vs required documents. Verify if the attached files match the required document types.
        2. Assess if the diagnosis is generally covered by a standard health policy of this name (simulate validity).
        3. Provide an acceptance score (0-100). If essential documents are missing, the score MUST be low (e.g., 0-20). It MUST be an integer.
        4. Estimate the approved amount. If claimed amount is missing, estimate based on diagnosis. It MUST be a number.
        5. EXTRACT TEXT: Briefly transcribe relevant text from the documents for debugging purposes.
        
        **Output Format (JSON strictly):**
        {{
            "score": <int>,
            "estimated_amount": <float>,
            "findings": [
                {{ "item": "<Document Name or Policy Rule>", "status": "<Pass/Fail/Warning>", "details": "<Short reason (max 5 words)>" }}
            ],
            "notes": "<EXTREMELY CONCISE Summary (Max 1 sentence).>",
            "extracted_data_debug": "<Summary of text found in documents for debugging>",
            "document_feedback": [
                 {{ "document_name": "<name>", "feedback_note": "<Very short note (max 5-10 words). e.g., 'Missing signature' or 'Valid document'.>" }}
            ]
        }}
        """
        return prompt

ai_service = AIService()
