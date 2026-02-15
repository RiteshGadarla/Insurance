from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "insurance_db"
    SECRET_KEY: str = "supersecretkey"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GEMINI_API_KEY: str = "AIzaSyBC23P0O-ppZ8DjJVmMykKPLLlSz9AAi20"
    TESSERACT_PATH: str = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    POPPLER_PATH: str = r"C:\Users\Karthikeya\Downloads\Release-25.12.0-0\poppler-25.12.0\Library\bin"
    
    class Config:
        env_file = ".env"

settings = Settings()
