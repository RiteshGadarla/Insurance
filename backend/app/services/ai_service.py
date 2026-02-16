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
