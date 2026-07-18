from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Document, DocumentRelationship, Skill
from app.services.ai_service import ai_service
import json

def extract_and_save_relationships(user_id: int):
    """Extract relationships between all documents for specific user and save to database"""
    db = SessionLocal()
    try:
        # Get all processed documents for user
        documents = db.query(Document).filter(
            Document.user_id == user_id,
            Document.processing_status == "completed"
        ).all()
        
        # Convert to dict format for AI service
        docs_data = []
        for doc in documents:
            docs_data.append({
                "id": doc.id,
                "title": doc.title,
                "content": doc.content,
                "category": doc.category,
                "skills": _get_document_skills(doc.id, db)
            })
        
        # Extract relationships using AI
        relationships = ai_service.extract_relationships(docs_data)
        
        # Save relationships to database
        for rel in relationships:
            # Check if relationship already exists
            existing = db.query(DocumentRelationship).filter(
                DocumentRelationship.user_id == user_id,
                DocumentRelationship.document_id == rel["document_id"],
                DocumentRelationship.related_document_id == rel["related_document_id"],
                DocumentRelationship.relationship_type == rel["relationship_type"]
            ).first()
            
            if not existing:
                db_rel = DocumentRelationship(
                    user_id=user_id,
                    document_id=rel["document_id"],
                    related_document_id=rel["related_document_id"],
                    relationship_type=rel["relationship_type"],
                    confidence=rel["confidence"],
                    metadata=json.dumps(rel.get("metadata", {}))
                )
                db.add(db_rel)
        
        db.commit()
        return {"status": "success", "relationships_created": len(relationships)}
    
    except Exception as e:
        db.rollback()
        print(f"Error extracting relationships: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

def _get_document_skills(document_id: int, db: Session) -> List[str]:
    """Get skills associated with a document"""
    # This is a simplified version - in production, you'd have a proper document-skill relationship
    skills = db.query(Skill).all()
    return [skill.name for skill in skills]

def get_document_relationships(document_id: int) -> List[Dict]:
    """Get all relationships for a specific document"""
    db = SessionLocal()
    try:
        relationships = db.query(DocumentRelationship).filter(
            DocumentRelationship.document_id == document_id
        ).all()
        
        result = []
        for rel in relationships:
            related_doc = db.query(Document).filter(
                Document.id == rel.related_document_id
            ).first()
            
            result.append({
                "id": rel.id,
                "relationship_type": rel.relationship_type,
                "confidence": rel.confidence,
                "metadata": json.loads(rel.metadata) if rel.metadata else {},
                "related_document": {
                    "id": related_doc.id if related_doc else None,
                    "title": related_doc.title if related_doc else None,
                    "category": related_doc.category if related_doc else None
                } if related_doc else None
            })
        
        return result
    except Exception as e:
        print(f"Error getting relationships: {e}")
        return []
    finally:
        db.close()

def get_all_relationships() -> List[Dict]:
    """Get all document relationships"""
    db = SessionLocal()
    try:
        relationships = db.query(DocumentRelationship).all()
        
        result = []
        for rel in relationships:
            doc = db.query(Document).filter(Document.id == rel.document_id).first()
            related_doc = db.query(Document).filter(
                Document.id == rel.related_document_id
            ).first()
            
            result.append({
                "id": rel.id,
                "relationship_type": rel.relationship_type,
                "confidence": rel.confidence,
                "document": {
                    "id": doc.id,
                    "title": doc.title,
                    "category": doc.category
                } if doc else None,
                "related_document": {
                    "id": related_doc.id,
                    "title": related_doc.title,
                    "category": related_doc.category
                } if related_doc else None
            })
        
        return result
    except Exception as e:
        print(f"Error getting all relationships: {e}")
        return []
    finally:
        db.close()