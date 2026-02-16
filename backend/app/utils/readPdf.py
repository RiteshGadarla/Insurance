"""
Text Extraction Helper Module.
This module provides functionality to extract text from PDF and image files.
"""

import logging
import os
from typing import Optional
from pypdf import PdfReader

# Configure logger
logger = logging.getLogger(__name__)

def extract_text_from_file(file_path: str) -> Optional[str]:
    """
    Extracts text from a file (PDF or Image). Uses pypdf for PDFs (assuming text-based)
    and simply errors out for images as we are avoiding complex OCR dependencies if possible.

    Args:
        file_path (str): The absolute path to the file.

    Returns:
        Optional[str]: The extracted text, or None if extraction fails.
    """
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return None

    try:
        extracted_text = ""
        file_ext = os.path.splitext(file_path)[1].lower()

        if file_ext == ".pdf":
            logger.info(f"Processing PDF file: {file_path}")
            try:
                reader = PdfReader(file_path)
                for i, page in enumerate(reader.pages):
                    logger.info(f"Processing page {i+1} of PDF...")
                    text = page.extract_text()
                    # print(text)
                    if text:
                        extracted_text += f"\n--- Page {i+1} ---\n{text}"
                    else:
                        logger.warning(f"No text found on page {i+1} (might be an image-only page).")
            except Exception as e:
                logger.error(f"Error reading PDF: {e}")
                return None
        
        else:
            logger.warning(f"Unsupported or image-based file format: {file_ext}. Only text-based PDFs are supported in this mode.")
            return None

        return extracted_text.strip()

    except Exception as e:
        logger.error(f"Unexpected error in text extraction: {e}")
        return None
