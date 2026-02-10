from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "insurance_db"
    SECRET_KEY: str = "supersecretkey"

    class Config:
        env_file = ".env"

settings = Settings()
