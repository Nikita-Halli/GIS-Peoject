import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres123@localhost:5432/authdb")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey123changethis")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    ALGORITHM: str = "HS256"

    @property
    def allowed_origins_list(self):
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

settings = Settings()