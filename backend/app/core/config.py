from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator
from typing import List, Union
import json


class Settings(BaseSettings):
    PROJECT_NAME: str = "MiniCRM"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str
    SYNC_DATABASE_URL: str = ""

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            if v.startswith("postgresql://") and "+asyncpg" not in v:
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    @field_validator("SYNC_DATABASE_URL", mode="before")
    @classmethod
    def assemble_sync_db_url(cls, v: str, info) -> str:
        if v and isinstance(v, str):
            v = v.strip()
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+psycopg2://", 1)
            if v.startswith("postgresql://") and "+psycopg2" not in v:
                return v.replace("postgresql://", "postgresql+psycopg2://", 1)
            return v

        raw_db_url = info.data.get("DATABASE_URL", "")
        if isinstance(raw_db_url, str) and raw_db_url:
            raw_db_url = raw_db_url.strip()
            if raw_db_url.startswith("postgres://"):
                return raw_db_url.replace("postgres://", "postgresql+psycopg2://", 1)
            if raw_db_url.startswith("postgresql://"):
                return raw_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return v

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
