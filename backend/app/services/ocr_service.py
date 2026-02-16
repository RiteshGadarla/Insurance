import pytesseract
from PIL import Image
import os
import pypdf
import io

class OCRService:
    @staticmethod
    def extract_text(file_path: str) -> str:
        """
        Extracts text from a file (Image or PDF).
        - Uses pypdf for PDFs (fast, text-based).
        - Uses pytesseract for Images (OCR).
        - Fallback: If pypdf yields no text, could try OCR on PDF (requires pdf2image + poppler, omitted for MVP unless requested).
        """
        if not os.path.exists(file_path):
            return ""
            
        ext = os.path.splitext(file_path)[1].lower()
        
        try:
            if ext == ".pdf":
                return OCRService._extract_from_pdf(file_path)
            elif ext in [".jpg", ".jpeg", ".png", ".bmp", ".tiff"]:
                return OCRService._extract_from_image(file_path)
            else:
                return f"Unsupported file format: {ext}"
        except Exception as e:
            print(f"Error extracting text from {file_path}: {e}")
            return ""

    @staticmethod
    def _extract_from_image(file_path: str) -> str:
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            return text
        except Exception as e:
            print(f"OCR Error: {e}")
            return ""

    @staticmethod
    def _extract_from_pdf(file_path: str) -> str:
        text = ""
        try:
            # Try pypdf first (fast, good for digital PDFs)
            reader = pypdf.PdfReader(file_path)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            
            # If text is very short, it might be a scanned PDF. 
            # For this MVP, we will return what we found. 
            # If 0 length, we can return a message or try OCR if poppler was available.
            if not text.strip():
                return "[OCR Warning] Scanned PDF detected. Text extraction might be empty without OCR-for-PDF support (requires Poppler)."
                
            return text
        except Exception as e:
            print(f"PDF Extraction Error: {e}")
            return ""

ocr_service = OCRService()
