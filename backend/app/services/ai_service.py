import logging
import json
from typing import List, Optional

import os
import google.generativeai as genai
import json
import random
from typing import Dict, Any, List, Optional
from app.models.policy import RequiredDocument
from app.utils.readPdf import extract_text_from_file
from app.LLM.llm_helper import llm_helper

# Configure logger
logger = logging.getLogger(__name__)
from app.core.config import settings

class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if not self.api_key:
            print("WARNING: GEMINI_API_KEY not found in settings.")
        else:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.5-flash')

    @staticmethod
    async def analyze_policy_pdf(file_path: str) -> List[RequiredDocument]:
        """
        Extracts text from the policy PDF/Image and uses AI to suggest required documents.

        Args:
            file_path (str): The path to the uploaded policy document.

        Returns:
            List[RequiredDocument]: A list of suggested required documents.
        """
        from fastapi.concurrency import run_in_threadpool

        logger.info(f"Analyzing policy document: {file_path}")

        # 1. Extract text using Tesseract (Run in threadpool to avoid blocking)
        extracted_text = await run_in_threadpool(extract_text_from_file, file_path)

        if not extracted_text:
            logger.warning("Failed to extract text from the document. Returning default suggestions.")
            return AIService._get_fallback_suggestions()

        logger.info(f"Text extraction successful. Document length: {len(extracted_text)} characters.")

        # Chunking strategy: Split text into chunks of approx 50,000 characters (~10-12k tokens)
        # This keeps us safe within limits while providing enough context per chunk.
        CHUNK_SIZE = 50000
        chunks = [extracted_text[i : i + CHUNK_SIZE] for i in range(0, len(extracted_text), CHUNK_SIZE)]

        logger.info(f"Splitting document into {len(chunks)} chunks for AI analysis.")

        all_suggestions = []
        seen_document_names = set()

        for index, chunk in enumerate(chunks):
            # 2. Prompt the AI for each chunk
            logger.info(f"Processing chunk {index + 1}/{len(chunks)}...")

            prompt = f"""
            You are an expert insurance policy analyzer. 
            Analyze the following PART {index + 1} of {len(chunks)} of an insurance policy text and identify the required documents for processing a claim based on the terms and conditions mentioned in this specific section.
            
            PARTIAL Policy Text ({index + 1}/{len(chunks)}):
            \"\"\"
            {chunk}
            \"\"\"
            
            Based on the text above, list the specific documents required from the policyholder/hospital to process a claim.
            If no specific documents are mentioned in this section, return an empty array [].
            
            Return the result ONLY as a JSON array of objects, where each object has the following keys:
            - "document_name": The name of the document (e.g., "Discharge Summary", "Final Hospital Bill"). Use standard, concise names.
            - "description": A brief description of what this document is (e.g., "Detailed summary of hospitalization").
            - "mandatory": Boolean, true if it seems mandatory, false otherwise.
            "notes": Include only essential additional instructions for the hospital staff, if explicitly mentioned. Do not indicate whether the document is mandatory or optional. If no specific notes are provided, return an empty string ("").            
           Do not include any markdown formatting like ```json or ```. Just the raw JSON array.
            """

            try:
                # Run LLM call in threadpool as well
                response_text = await run_in_threadpool(llm_helper.generate_response, prompt)

                if response_text:
                    # Clean up response if it contains markdown code blocks
                    if "```json" in response_text:
                        response_text = response_text.replace("```json", "").replace("```", "")
                    elif "```" in response_text:
                        response_text = response_text.replace("```", "")

                    response_text = response_text.strip()
                    # print(response_text)
                    # Parse JSON
                    if not response_text:
                        continue

                    suggestions_data = json.loads(response_text)

                    for item in suggestions_data:
                        doc_name = item.get("document_name", "Unknown Document").strip()

                        # Simple deduplication by name (case-insensitive)
                        if doc_name.lower() not in seen_document_names:
                            all_suggestions.append(
                                RequiredDocument(
                                    document_name=doc_name,
                                    description=item.get("description", "No description provided"),
                                    notes=item.get("notes", ""),
                                    mandatory=item.get("mandatory", True)
                                )
                            )
                            seen_document_names.add(doc_name.lower())

            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse AI response as JSON for chunk {index + 1}: {e}")
                logger.debug(f"Raw AI response: {response_text if 'response_text' in locals() else 'None'}")
            except Exception as e:
                logger.error(f"Error during AI analysis for chunk {index + 1}: {e}")

        if all_suggestions:
            logger.info(f"AI analysis complete. Found {len(all_suggestions)} unique required documents.")
            return all_suggestions

        # Fallback if no suggestions found across all chunks
        logger.warning("No documents identified by AI across any chunks.")
        return AIService._get_fallback_suggestions()

    @staticmethod
    def _get_fallback_suggestions() -> List[RequiredDocument]:
        """
        Returns a default list of documents in case of errors.
        Dummy AI service that simulates policy analysis and returns
        suggested required documents.
        (Kept for backward compatibility with policy creation flow)
        """
        logger.info("Using fallback document suggestions.")
        default_docs = [
            ("Discharge Summary", "Summary of the patient's hospital stay and treatment."),
            ("Final Bill", "The itemized final bill provided by the hospital."),
            ("Diagnosis Report", "Official document confirming the medical diagnosis."),
            ("ID Card", "Patient's national ID or insurance card.")
        ]
        
        return [
            RequiredDocument(
                document_name=name,
                description=desc,
                notes="",
                mandatory=True
            ) for name, desc in default_docs
        ]

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
