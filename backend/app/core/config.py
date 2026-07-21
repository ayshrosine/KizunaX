from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Union
import os

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "IdentityVault"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = True
    
    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SECRET_KEY: str = ""
    SUPABASE_PUBLISHABLE_KEY: str = ""
    
    # Qdrant Configuration
    QDRANT_URL: str = ""
    QDRANT_API_KEY: str = ""
    
    # Hugging Face Inference API
    HF_TOKEN: str = ""
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    
    # AI Models
    HUGGINGFACE_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    # File Upload
    UPLOAD_DIR: str = "./data/uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_EXTENSIONS: Union[str, List[str]] = "pdf,docx,txt,png,jpg,jpeg"
    
    # Google Drive OAuth Settings
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/integrations/google/callback"
    
    # Notion OAuth Settings
    NOTION_CLIENT_ID: str = ""
    NOTION_CLIENT_SECRET: str = ""
    NOTION_REDIRECT_URI: str = "http://localhost:8000/api/integrations/notion/callback"
    
    # CORS
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173"
    
    # AI Processing
    CATEGORIZATION_CONFIDENCE_THRESHOLD: float = 0.7
    LOCAL_EMBEDDING_DIMENSION: int = 384  # Hugging Face default
    
    # Cache
    ENABLE_CACHE: bool = True
    CACHE_TTL: int = 300  # 5 minutes
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )
    
    @field_validator('ALLOWED_EXTENSIONS', mode='before')
    @classmethod
    def parse_allowed_extensions(cls, v):
        if isinstance(v, list):
            return ','.join(v)
        return v
    
    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, list):
            return ','.join(v)
        return v
    
    @property
    def allowed_extensions_list(self) -> List[str]:
        if isinstance(self.ALLOWED_EXTENSIONS, str):
            return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(',')]
        return self.ALLOWED_EXTENSIONS
    
    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(',')]
        return self.CORS_ORIGINS

settings = Settings()

# Create necessary directories
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)