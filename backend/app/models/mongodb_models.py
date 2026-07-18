from beanie import Document as BeanieDocument, Indexed
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr, field_validator
from enum import Enum

class AuthProvider(str, Enum):
    LOCAL = "local"
    GOOGLE = "google"

class UserRole(str, Enum):
    STUDENT = "student"
    ADMIN = "admin"

class DocumentStatus(str, Enum):
    UPLOADING = "uploading"
    EXTRACTING = "extracting"
    CLASSIFYING = "classifying"
    INDEXED = "indexed"
    FAILED = "failed"

class DocumentCategory(str, Enum):
    PROJECTS = "Projects"
    SKILLS = "Skills"
    CERTIFICATIONS = "Certifications"
    INTERNSHIPS = "Internships"
    ACHIEVEMENTS = "Achievements"
    ACADEMICS = "Academics"

class RelationshipType(str, Enum):
    BACKS = "backs"
    LEADS_TO = "leadsTo"
    DERIVED_FROM = "derivedFrom"

class NotificationType(str, Enum):
    DOCUMENT_CLASSIFIED = "document_classified"
    RELATIONSHIP_DETECTED = "relationship_detected"
    TIMELINE_UPDATED = "timeline_updated"
    SKILL_GAP = "skill_gap"
    PORTFOLIO_VIEWED = "portfolio_viewed"

class ActionType(str, Enum):
    UPLOAD = "upload"
    RETAG = "retag"
    DELETE = "delete"
    SEARCH = "search"
    EXPORT = "export"

class User(BeanieDocument):
    """User model for MongoDB"""
    full_name: str = Field(..., min_length=2, max_length=100)
    email: Indexed(EmailStr, unique=True)  # Unique indexed email
    password_hash: Optional[str] = None  # null if OAuth-only
    auth_provider: AuthProvider = AuthProvider.LOCAL
    google_id: Optional[str] = None  # null unless authProvider = google
    institution: Optional[str] = None
    avatar_url: Optional[str] = None  # R2/Cloudflare Images URL
    role: UserRole = UserRole.STUDENT
    email_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login_at: Optional[datetime] = None
    
    @field_validator('email')
    @classmethod
    def email_lowercase(cls, v: str) -> str:
        return v.lower()
    
    class Settings:
        name = "users"
        indexes = [
            "email",
        ]

class ExtractedFields(BaseModel):
    """Extracted fields from document processing"""
    issuer: Optional[str] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    organization: Optional[str] = None
    skills_detected: List[str] = Field(default_factory=list)

class Document(BeanieDocument):
    """Document model for MongoDB"""
    user_id: Indexed(str)  # Foreign key reference to User.id (string ObjectId)
    filename: str  # original filename
    file_type: str  # "pdf" | "docx" | "jpg" | "png"
    file_size_bytes: Optional[int] = None
    storage_key: Optional[str] = None  # Cloudflare R2 object key (NOT the file itself)
    storage_url: Optional[str] = None  # signed/public URL, generated on read
    status: DocumentStatus = DocumentStatus.UPLOADING
    category: Optional[DocumentCategory] = None
    category_confidence: Optional[float] = Field(default=None, ge=0, le=1)  # 0-1
    category_overridden: bool = False
    extracted_text: Optional[str] = None  # full OCR/parsed text
    extracted_fields: Optional[ExtractedFields] = None
    chroma_vector_id: Optional[str] = None  # reference to ChromaDB embedding
    ocr_applied: bool = False
    is_deleted: bool = False  # soft delete
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "documents"
        indexes = [
            [("user_id", 1), ("category", 1)],
            [("user_id", 1), ("created_at", -1)],
            [("user_id", 1), ("is_deleted", 1)],
        ]
        text_indexes = [
            {
                "name": "text_search",
                "fields": ["filename", "extracted_text"]
            }
        ]

class Skill(BeanieDocument):
    """Skill model for MongoDB"""
    user_id: Indexed(str)  # Foreign key reference to User.id (string ObjectId)
    name: str
    normalized_name: str  # lowercase, trimmed — for dedupe/matching
    source_document_ids: List[str] = Field(default_factory=list)  # ObjectIds
    confidence_score: Optional[float] = Field(default=None, ge=0, le=1)
    on_resume: bool = False
    has_evidence: bool = False  # computed: sourceDocumentIds.length > 0
    first_detected_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @field_validator('normalized_name')
    @classmethod
    def normalize_name(cls, v: str) -> str:
        return v.lower().strip()
    
    class Settings:
        name = "skills"
        indexes = [
            [("user_id", 1), ("normalized_name", 1)],  # Compound unique index
            "user_id",
            "normalized_name",
        ]
        unique_constraints = [("user_id", "normalized_name")]

class Relationship(BeanieDocument):
    """Relationship model for MongoDB (graph edges)"""
    user_id: Indexed(str)  # Foreign key reference to User.id (string ObjectId)
    source_type: str  # "skill" | "project" | "certification" | "internship"
    source_id: str  # ObjectId
    target_type: str
    target_id: str  # ObjectId
    relationship_type: RelationshipType
    strength: Optional[float] = Field(default=None, ge=0, le=1)  # 0-1
    ai_generated: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "relationships"
        indexes = [
            "user_id",
            "source_id",
            "target_id",
        ]

class TimelineEvent(BeanieDocument):
    """Timeline event model for MongoDB"""
    user_id: Indexed(str)  # Foreign key reference to User.id (string ObjectId)
    year: int
    month: Optional[int] = None
    title: str
    category: str
    document_id: Optional[str] = None  # Reference to Document.id (string ObjectId)
    description: Optional[str] = None  # AI-generated one-liner
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "timeline_events"
        indexes = [
            [("user_id", 1), ("year", 1), ("month", 1)],
            "user_id",
            "year",
            "month",
        ]

class Notification(BeanieDocument):
    """Notification model for MongoDB"""
    user_id: Indexed(str)  # Foreign key reference to User.id (string ObjectId)
    type: NotificationType
    title: str
    message: str
    related_document_id: Optional[str] = None  # Reference to Document.id (string ObjectId)
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "notifications"
        indexes = [
            [("user_id", 1), ("read", 1), ("created_at", -1)],
            "user_id",
            "read",
            "created_at",
        ]

class ActivityLog(BeanieDocument):
    """Activity log model for MongoDB"""
    user_id: Indexed(str)  # Foreign key reference to User.id (string ObjectId)
    action: ActionType
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    metadata: Optional[dict] = Field(default_factory=dict)
    ip_address: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "activity_logs"
        indexes = [
            [("user_id", 1), ("created_at", -1)],
            "user_id",
            "created_at",
        ]
        # TTL index for auto-expiring logs older than 12 months
        # Note: Beanie doesn't support TTL indexes directly, need to create manually in MongoDB

class PortfolioSettings(BeanieDocument):
    """Portfolio settings model for MongoDB"""
    user_id: Indexed(str, unique=True)  # Unique, indexed
    username: Indexed(str, unique=True)  # unique, indexed — used in /u/:username
    theme: Optional[str] = None
    visible_categories: List[str] = Field(default_factory=list)
    hidden_document_ids: List[str] = Field(default_factory=list)
    is_published: bool = False
    published_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "portfolio_settings"
        indexes = [
            "username",
            "user_id",
        ]

class Session(Document):
    """Session model for MongoDB (refresh tokens)"""
    user_id: Indexed(str)  # Foreign key reference to User.id (string ObjectId)
    refresh_token_hash: str
    device_info: Optional[str] = None
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "sessions"
        indexes = [
            "user_id",
            "expires_at",
        ]
        # TTL index for auto-expiring sessions
        # Note: Beanie doesn't support TTL indexes directly, need to create manually in MongoDB
