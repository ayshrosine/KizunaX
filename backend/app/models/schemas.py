"""
Pure Pydantic models for KizunaX — no ORM inheritance.
The actual schema lives in Supabase Postgres; these are just validation shapes
used by the API layer and repositories.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr, field_validator
from enum import Enum


# ── Enums ──────────────────────────────────────────────────────────────
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
    ENABLED_BY = "enabled_by"
    LED_TO = "led_to"
    APPLIED_IN = "applied_in"


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


# ── Document Models ────────────────────────────────────────────────────
class DocumentCreate(BaseModel):
    """Payload when inserting a new document row into Supabase."""
    user_id: str
    filename: str
    original_filename: Optional[str] = None
    file_type: str
    file_size_bytes: Optional[int] = None
    file_url: Optional[str] = None
    status: str = DocumentStatus.UPLOADING.value
    category: Optional[str] = None
    category_confidence: Optional[float] = None
    extracted_text: Optional[str] = None


class DocumentRecord(BaseModel):
    """Shape of a row returned from the documents table."""
    id: str
    user_id: str
    filename: str
    original_filename: Optional[str] = None
    file_type: str
    file_size_bytes: Optional[int] = None
    file_url: Optional[str] = None
    status: str = DocumentStatus.UPLOADING.value
    failure_reason: Optional[str] = None
    category: Optional[str] = None
    category_confidence: Optional[float] = None
    extracted_text: Optional[str] = None
    is_deleted: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ── Skill Models ───────────────────────────────────────────────────────
class SkillCreate(BaseModel):
    user_id: str
    name: str
    normalized_name: str
    source_document_ids: List[str] = Field(default_factory=list)
    confidence_score: Optional[float] = None


class SkillRecord(BaseModel):
    id: str
    user_id: str
    name: str
    normalized_name: str
    source_document_ids: List[str] = Field(default_factory=list)
    confidence_score: Optional[float] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ── Relationship Models ────────────────────────────────────────────────
class RelationshipCreate(BaseModel):
    user_id: str
    from_entity: str
    to_entity: str
    relation_type: str


class RelationshipRecord(BaseModel):
    id: str
    user_id: str
    from_entity: str
    to_entity: str
    relation_type: str
    created_at: Optional[str] = None


# ── Timeline Models ───────────────────────────────────────────────────
class TimelineEventCreate(BaseModel):
    user_id: str
    year: int
    month: Optional[int] = None
    title: str
    description: Optional[str] = None
    source_document_id: Optional[str] = None


class TimelineEventRecord(BaseModel):
    id: str
    user_id: str
    year: int
    month: Optional[int] = None
    title: str
    description: Optional[str] = None
    source_document_id: Optional[str] = None
    created_at: Optional[str] = None


# ── Auth / User Models (lightweight — Supabase Auth handles users) ────
class UserInfo(BaseModel):
    """Minimal user representation extracted from Supabase auth.users."""
    id: str
    email: str
    full_name: Optional[str] = None


# ── API Request / Response Schemas ─────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr = Field(..., min_length=3, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr = Field(..., min_length=3, max_length=100)
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
