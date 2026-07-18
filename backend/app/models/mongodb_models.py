from beanie import Document, Indexed
from datetime import datetime
from typing import Optional, List
from pydantic import Field, EmailStr

class User(Document):
    """User model for MongoDB"""
    email: Indexed(EmailStr, unique=True)  # Unique indexed email
    username: Indexed(str, unique=True)  # Unique indexed username
    hashed_password: str
    full_name: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "users"
        indexes = [
            "email",
            "username",
        ]

class Document(Document):
    """Document model for MongoDB"""
    user_id: Indexed(str)  # Foreign key reference to User.id (string ObjectId)
    filename: Indexed(str)
    original_filename: str
    file_path: Optional[str] = None  # Local file path (deprecated, use R2)
    r2_key: Optional[str] = None  # R2 storage key
    r2_url: Optional[str] = None  # R2 public URL
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    category: Indexed(str)
    
    # Extracted content
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    
    # Metadata
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    document_date: Optional[datetime] = None
    author: Optional[str] = None
    organization: Optional[str] = None
    
    # AI Processing
    embedding_id: Optional[str] = None
    categorization_confidence: Optional[float] = None
    processing_status: str = "pending"  # pending, processing, completed, failed
    
    class Settings:
        name = "documents"
        indexes = [
            "user_id",
            "filename",
            "category",
            "upload_date",
        ]

class Skill(Document):
    """Skill model for MongoDB"""
    user_id: Indexed(str)  # Foreign key reference to User.id (string ObjectId)
    name: Indexed(str)
    category: Optional[str] = None  # technical, soft, language, etc.
    confidence: Optional[float] = None
    source_document_id: Optional[str] = None  # Reference to Document.id (string ObjectId)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "skills"
        indexes = [
            [("user_id", 1), ("name", 1)],  # Compound unique index
            "user_id",
            "name",
        ]
        unique_constraints = [("user_id", "name")]

class DocumentRelationship(Document):
    """Document relationship model for MongoDB"""
    user_id: Indexed(str)  # Foreign key reference to User.id (string ObjectId)
    document_id: str  # Reference to Document.id (string ObjectId)
    related_document_id: Optional[str] = None  # Reference to Document.id (string ObjectId)
    relationship_type: str  # LEADS_TO, REQUIRES, DEMONSTRATES, PART_OF, RELATED_TO
    confidence: Optional[float] = None
    additional_data: Optional[str] = None  # JSON string for additional data
    
    class Settings:
        name = "document_relationships"
        indexes = [
            "user_id",
            "document_id",
            "related_document_id",
        ]

class TimelineEvent(Document):
    """Timeline event model for MongoDB"""
    user_id: Indexed(str)  # Foreign key reference to User.id (string ObjectId)
    document_id: Optional[str] = None  # Reference to Document.id (string ObjectId)
    event_type: str  # certification, project, internship, achievement, academic
    title: str
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    skills: Optional[str] = None  # JSON array of skill names
    importance: float = 1.0  # For sorting/ranking
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "timeline_events"
        indexes = [
            "user_id",
            "event_date",
            "event_type",
        ]
