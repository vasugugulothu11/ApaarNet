from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "ApaarNet Core API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database and Caching
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/apaarnet_db"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Cryptographic keys
    # 32-byte private key (hex-encoded) for Ed25519 signing of W3C Verifiable Credentials
    ED25519_PRIVATE_KEY: str = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"
    
    # Integration toggles
    USE_MOCK_APAAR_REGISTRY: bool = True
    
    # CORS Origins
    CORS_ORIGINS: List[str] = ["*"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
