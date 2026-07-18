from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Union
import os

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "IdentityVault"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    
    # Hugging Face
    HUGGINGFACE_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    # Database Paths
    CHROMA_DB_PATH: str = "./data/chroma_db"
    SQLITE_DB_PATH: str = "./data/metadata.db"
    
    # MongoDB Configuration
    MONGODB_URI: str = ""
    MONGODB_DATABASE_NAME: str = "identityvault"
    
    # ChromaDB Cloud Configuration
    CHROMA_HOST: str = ""
    CHROMA_API_KEY: str = ""
    CHROMA_TENANT: str = ""
    CHROMA_DATABASE: str = ""
    USE_CHROMA_CLOUD: bool = False
    
    # File Upload
    UPLOAD_DIR: str = "./data/uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_EXTENSIONS: Union[str, List[str]] = "pdf,docx,txt,png,jpg,jpeg"
    
    # Cloudflare R2 Configuration
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY: str = ""
    R2_SECRET_KEY: str = ""
    R2_BUCKET: str = ""
    R2_ENDPOINT: str = ""
    
    # CORS
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3000"
    
    # AI Processing
    CATEGORIZATION_CONFIDENCE_THRESHOLD: float = 0.7
    EMBEDDING_DIMENSION: int = 1536  # OpenAI default
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
os.makedirs(settings.CHROMA_DB_PATH, exist_ok=True)

# Create upload subdirectories
categories = ["certificates", "resumes", "projects", "internships", "achievements", "academics"]
for category in categories:
    os.makedirs(os.path.join(settings.UPLOAD_DIR, category), exist_ok=True)