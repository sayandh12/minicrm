from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator, model_validator
from typing import List, Union
import json


class Settings(BaseSettings):
    PROJECT_NAME: str = "MiniCRM"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = ""
    SYNC_DATABASE_URL: str = ""

    @model_validator(mode="after")
    def validate_database_urls(self) -> "Settings":
        import sys
        # 1. Clean and validate DATABASE_URL
        url = self.DATABASE_URL.strip() if self.DATABASE_URL else ""
        
        # Log the raw input for debugging (mask the password for safety)
        if url:
             safe_log = url.split("@")[-1] if "@" in url else "invalid-url"
             print(f"DEBUG: Detected DATABASE_URL ending in: ...@{safe_log}", file=sys.stderr)
        else:
             print("DEBUG: DATABASE_URL is EMPTY in Settings", file=sys.stderr)

        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
        self.DATABASE_URL = url
        
        # 2. Derive SYNC_DATABASE_URL
        if not self.SYNC_DATABASE_URL:
            self.SYNC_DATABASE_URL = url.replace("asyncpg", "psycopg2") if url else ""
        else:
            sync_url = self.SYNC_DATABASE_URL.strip()
            if sync_url.startswith("postgres://"):
                sync_url = sync_url.replace("postgres://", "postgresql+psycopg2://", 1)
            elif sync_url.startswith("postgresql://") and "+psycopg2" not in sync_url:
                sync_url = sync_url.replace("postgresql://", "postgresql+psycopg2://", 1)
            self.SYNC_DATABASE_URL = sync_url

        if not self.DATABASE_URL:
            print("ERROR: DATABASE_URL is missing after validation", file=sys.stderr)
        
        return self

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # First Admin Seed
    FIRST_ADMIN_EMAIL: str = "admin@minicrm.com"
    FIRST_ADMIN_PASSWORD: str = "Admin@123456"
    FIRST_ADMIN_FULL_NAME: str = "System Admin"

    # CORS
    BACKEND_CORS_ORIGINS: Union[List[str], str] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [i.strip() for i in v.split(",")]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
