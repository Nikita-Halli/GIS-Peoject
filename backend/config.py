import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/medical_gis")
    
    # JWT
    SECRET_KEY: str = os.getenv("FASTAPI_SECRET_KEY", "your-secret-key-change-this-in-production")
    ALGORITHM: str = os.getenv("FASTAPI_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Medical GIS Disease Prediction System"
    
    # ML Model
    MODEL_PATH: str = "models/disease_risk_model.pkl"
    
    class Config:
        case_sensitive = True

settings = Settings()
