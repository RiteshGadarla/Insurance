import logging
import json
from typing import List, Optional
from app.models.policy import RequiredDocument
from app.utils.readPdf import extract_text_from_file
from app.LLM.llm_helper import llm_helper

# Configure logger
logger = logging.getLogger(__name__)

class AIService:
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

        logger.info("Text extraction successful. Sending to AI for analysis...")

        # 2. Prompt the AI
        prompt = f"""
        You are an expert insurance policy analyzer. 
        Analyze the following insurance policy text and identify the required documents for processing a claim based on the terms and conditions mentioned.
        
        Extracted Policy Text:
        \"\"\"
        {extracted_text[:10000]}  # Limit to 10k chars to avoid token limits if necessary.
        \"\"\"
        
        Based on the text above, list the specific documents required from the policyholder/hospital to process a claim.
        Return the result ONLY as a JSON array of objects, where each object has the following keys:
        - "document_name": The name of the document (e.g., "Discharge Summary", "Final Hospital Bill").
        - "description": A brief description of what this document is (e.g., "Detailed summary of hospitalization").
        - "mandatory": Boolean, true if it seems mandatory, false otherwise.
        
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
                
                # Parse JSON
                suggestions_data = json.loads(response_text)
                # print(suggestions_data)
                suggestions = []
                for item in suggestions_data:
                    suggestions.append(
                        RequiredDocument(
                            document_name=item.get("document_name", "Unknown Document"),
                            description=item.get("description", "No description provided"),
                            notes="AI suggested based on policy analysis",
                            mandatory=item.get("mandatory", True)
                        )
                    )
                
                logger.info(f"AI suggested {len(suggestions)} documents.")
                return suggestions

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.debug(f"Raw AI response: {response_text if 'response_text' in locals() else 'None'}")
        except Exception as e:
            logger.error(f"Error during AI analysis: {e}")

        # Fallback if something goes wrong
        return AIService._get_fallback_suggestions()

    @staticmethod
    def _get_fallback_suggestions() -> List[RequiredDocument]:
        """
        Returns a default list of documents in case of errors.
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
                notes="Default suggestion (AI analysis failed)",
                mandatory=True
            ) for name, desc in default_docs
        ]
