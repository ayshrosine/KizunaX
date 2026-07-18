from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Float, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

from app.core.config import settings

# Create SQLite database engine
engine = create_engine(f"sqlite:///{settings.SQLITE_DB_PATH}", echo=settings.DEBUG)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")
    skills = relationship("Skill", back_populates="user", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String, index=True)
    original_filename = Column(String)
    file_path = Column(String)
    file_size = Column(Integer)
    file_type = Column(String)
    category = Column(String, index=True)
    
    # Extracted content
    title = Column(String)
    content = Column(Text)
    summary = Column(Text)
    
    # Metadata
    upload_date = Column(DateTime, default=datetime.utcnow)
    document_date = Column(DateTime, nullable=True)
    author = Column(String, nullable=True)
    organization = Column(String, nullable=True)
    
    # AI Processing
    embedding_id = Column(String, nullable=True)
    categorization_confidence = Column(Float, nullable=True)
    processing_status = Column(String, default="pending")  # pending, processing, completed, failed
    
    # Relationships
    user = relationship("User", back_populates="documents")
    relationships = relationship("DocumentRelationship", back_populates="document", foreign_keys="DocumentRelationship.document_id")
    related_to = relationship("DocumentRelationship", back_populates="related_document", foreign_keys="DocumentRelationship.related_document_id")

class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, index=True)
    category = Column(String)  # technical, soft, language, etc.
    confidence = Column(Float)
    source_document_id = Column(Integer, ForeignKey("documents.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="skills")
    
    # Unique constraint per user
    __table_args__ = (UniqueConstraint('user_id', 'name', name='unique_user_skill'),)

class DocumentRelationship(Base):
    __tablename__ = "document_relationships"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    related_document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    relationship_type = Column(String)  # LEADS_TO, REQUIRES, DEMONSTRATES, PART_OF, RELATED_TO
    confidence = Column(Float)
    additional_data = Column(Text, nullable=True)  # JSON string for additional data
    
    document = relationship("Document", back_populates="relationships", foreign_keys=[document_id])
    related_document = relationship("Document", back_populates="related_to", foreign_keys=[related_document_id])

class TimelineEvent(Base):
    __tablename__ = "timeline_events"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    event_type = Column(String)  # certification, project, internship, achievement, academic
    title = Column(String)
    description = Column(Text)
    event_date = Column(DateTime)
    end_date = Column(DateTime, nullable=True)
    skills = Column(Text, nullable=True)  # JSON array of skill names
    importance = Column(Float, default=1.0)  # For sorting/ranking
    
    created_at = Column(DateTime, default=datetime.utcnow)

def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print(f"Database initialized at {settings.SQLITE_DB_PATH}")

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()