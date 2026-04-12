from pydantic_settings import BaseSettings, SettingsConfigDict

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
    DATABASE_PUBLIC_URL: str = ""  
    DATABASE_PRIVATE_URL: str = ""  # Often used by Railway internally
    SYNC_DATABASE_URL: str = ""

    # Individual PG variables for construction
    PGHOST: str = ""
    PGPORT: str = "5432"
    PGUSER: str = ""
    PGPASSWORD: str = ""
    PGDATABASE: str = ""

    @model_validator(mode="after")
    def validate_database_urls(self) -> "Settings":
        import sys
        # 1. Debug: Print what we can see in the environment
        import os
        db_keys = [k for k in os.environ.keys() if "DATABASE" in k.upper() or "PG" in k.upper()]
        print(f"DEBUG: Detected environment variables: {db_keys}", file=sys.stderr)

        # 2. Initialize and prioritize URL variables
        url = self.DATABASE_URL.strip() if self.DATABASE_URL else ""
        
        # Fallback sequence
        if not url and self.DATABASE_PRIVATE_URL:
            url = self.DATABASE_PRIVATE_URL.strip()
            print("DEBUG: Using DATABASE_PRIVATE_URL", file=sys.stderr)
        
        if not url and self.DATABASE_PUBLIC_URL:
            url = self.DATABASE_PUBLIC_URL.strip()
            print("DEBUG: Using DATABASE_PUBLIC_URL", file=sys.stderr)

        # 2. Try to construct from PG variables if still empty
        if not url and self.PGHOST and self.PGUSER:
             print(f"DEBUG: Constructing URL from PGHOST={self.PGHOST}, PGUSER={self.PGUSER}", file=sys.stderr)
             # Default to postgresql format; we'll fix driver later
             url = f"postgresql://{self.PGUSER}:{self.PGPASSWORD}@{self.PGHOST}:{self.PGPORT}/{self.PGDATABASE}"

        # 2. Clean and validate main URL
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
        
        # 3. Derive SYNC_DATABASE_URL
        # If SYNC_DATABASE_URL matches the async one (after driver swap) OR if async one is remote but sync is localhost
        derived_sync = url.replace("asyncpg", "psycopg2") if url else ""
        
        if not self.SYNC_DATABASE_URL or ("localhost" in self.SYNC_DATABASE_URL and "localhost" not in url):
            self.SYNC_DATABASE_URL = derived_sync
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
    SECRET_KEY: str = "not-so-secret-key-change-me-in-production"
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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


settings = Settings()
