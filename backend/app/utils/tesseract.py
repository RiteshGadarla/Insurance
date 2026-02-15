"""
Tesseract OCR Helper Module.
This module provides functionality to extract text from PDF and image files using Tesseract OCR.
"""

import pytesseract
from pdf2image import convert_from_path
from PIL import Image
import os
import logging
from typing import Optional
from app.core.config import settings

# Configure logger
logger = logging.getLogger(__name__)

# Set Tesseract command path from settings
if settings.TESSERACT_PATH:
    pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_PATH
else:
    logger.warning("TESSERACT_PATH not set in settings. Using default 'tesseract'.")

def extract_text_from_file(file_path: str) -> Optional[str]:
    """
    Extracts text from a file (PDF or Image) using Tesseract OCR.

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
            # Convert PDF to images
            try:
                # Use poppler_path from settings if available
                poppler_path = settings.POPPLER_PATH if settings.POPPLER_PATH else None
                if not poppler_path:
                    logger.warning("POPPLER_PATH not set. PDF conversion might fail on Windows.")
                
                images = convert_from_path(file_path, poppler_path=poppler_path)
                for i, image in enumerate(images):
                    logger.info(f"Processing page {i+1} of PDF...")
                    text = pytesseract.image_to_string(image)
                    extracted_text += f"\n--- Page {i+1} ---\n{text}"
                    # print(text)
            except Exception as e:
                logger.error(f"Error converting PDF to images: {e}")
                # Fallback or re-raise
                return None

        elif file_ext in [".jpg", ".jpeg", ".png", ".bmp", ".tiff"]:
            logger.info(f"Processing Image file: {file_path}")
            try:
                image = Image.open(file_path)
                extracted_text = pytesseract.image_to_string(image)
            except Exception as e:
                logger.error(f"Error processing image: {e}")
                return None
        
        else:
            logger.warning(f"Unsupported file format: {file_ext}")
            return None

        return extracted_text.strip()

    except Exception as e:
        logger.error(f"Unexpected error in OCR extraction: {e}")
        return None
