"""Environment configuration with validation."""
from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import List


class Settings(BaseSettings):
    """Application settings with validation."""
    
    # Server
    PORT: int = Field(default=5003, ge=1024, le=65535)
    NODE_ENV: str = Field(default="development")
    LOG_LEVEL: str = Field(default="info")
    ENVIRONMENT: str = Field(default="development")  # Added for auth bypass
    
    # ERP Authentication
    ERP_JWT_SECRET: str = Field(min_length=1)
    ERP_JWT_ISSUER: str = Field(min_length=1)
    ERP_JWT_AUDIENCE: str = Field(default="erp_mcp")
    DISABLE_AUTH: bool = Field(default=False)  # Added for development mode
    
    # MySQL Database (Read-Only)
    DB_HOST: str = Field(default="localhost")
    DB_PORT: int = Field(default=3306)
    DB_USER: str = Field(min_length=1)
    DB_PASSWORD: str = Field(min_length=1)
    DB_NAME: str = Field(min_length=1)
    
    # Gemini AI
    GEMINI_API_KEY: str = Field(min_length=1)
    GEMINI_MODEL: str = Field(default="gemini-2.0-flash-exp")
    GEMINI_TEMPERATURE: float = Field(default=0.1, ge=0.0, le=1.0)
    GEMINI_MAX_TOKENS: int = Field(default=500, ge=50, le=2000)
    
    # Redis Cache (Optional)
    REDIS_URL: str = Field(default="")
    CACHE_TTL: int = Field(default=300)
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = Field(default=30)
    RATE_LIMIT_PER_HOUR: int = Field(default=500)
    
    # Audit Database
    AUDIT_DB_HOST: str = Field(default="localhost")
    AUDIT_DB_PORT: int = Field(default=3306)
    AUDIT_DB_USER: str = Field(default="")
    AUDIT_DB_PASSWORD: str = Field(default="")
    AUDIT_DB_NAME: str = Field(default="")
    
    # Security
    ALLOWED_TABLES: str = Field(default="students,teachers,timetables,attendance,subjects,classes,fees,exams")
    MAX_ROWS_RETURNED: int = Field(default=100, ge=1, le=1000)
    
    # CORS
    FRONTEND_URL: str = Field(default="http://localhost:3000")
    
    @validator("ALLOWED_TABLES")
    def parse_allowed_tables(cls, v):
        """Parse comma-separated allowed tables."""
        return [table.strip() for table in v.split(",") if table.strip()]
    
    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.NODE_ENV == "production"
    
    @property
    def has_redis(self) -> bool:
        """Check if Redis is configured."""
        return bool(self.REDIS_URL)
    
    @property
    def has_audit_db(self) -> bool:
        """Check if separate audit DB is configured."""
        return bool(self.AUDIT_DB_USER and self.AUDIT_DB_PASSWORD)
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
