from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import SessionLocal, Document, TimelineEvent
import json

def generate_timeline():
    """Generate digital journey timeline from all documents"""
    db = SessionLocal()
    try:
        # Get all processed documents
        documents = db.query(Document).filter(
            Document.processing_status == "completed"
        ).all()
        
        timeline_events = []
        
        for doc in documents:
            # Use document_date if available, otherwise use upload_date
            event_date = doc.document_date if doc.document_date else doc.upload_date
            
            # Determine event type based on category
            event_type = _map_category_to_event_type(doc.category)
            
            # Create timeline event
            event = {
                "document_id": doc.id,
                "event_type": event_type,
                "title": doc.title,
                "description": doc.summary,
                "event_date": event_date.isoformat(),
                "end_date": None,
                "category": doc.category,
                "organization": doc.organization,
                "importance": _calculate_importance(doc)
            }
            
            timeline_events.append(event)
        
        # Sort by date
        timeline_events.sort(key=lambda x: x["event_date"])
        
        # Group by year
        grouped_timeline = _group_by_year(timeline_events)
        
        return {
            "events": timeline_events,
            "grouped": grouped_timeline,
            "total_events": len(timeline_events)
        }
    
    except Exception as e:
        print(f"Error generating timeline: {e}")
        return {"events": [], "grouped": {}, "total_events": 0}
    finally:
        db.close()

def _map_category_to_event_type(category: str) -> str:
    """Map document category to timeline event type"""
    mapping = {
        "Certifications": "certification",
        "Projects": "project",
        "Internships": "internship",
        "Achievements": "achievement",
        "Academics": "academic",
        "Skills": "skill"
    }
    return mapping.get(category, "other")

def _calculate_importance(document: Document) -> float:
    """Calculate importance score for timeline display"""
    base_score = 1.0
    
    # Boost certain categories
    if document.category in ["Certifications", "Achievements"]:
        base_score += 0.5
    elif document.category == "Projects":
        base_score += 0.3
    
    # Boost if has organization
    if document.organization:
        base_score += 0.2
    
    # Boost based on categorization confidence
    if document.categorization_confidence:
        base_score *= document.categorization_confidence
    
    return min(base_score, 2.0)  # Cap at 2.0

def _group_by_year(events: List[Dict]) -> Dict:
    """Group timeline events by year"""
    grouped = {}
    
    for event in events:
        try:
            date = datetime.fromisoformat(event["event_date"])
            year = date.year
            
            if year not in grouped:
                grouped[year] = []
            
            grouped[year].append(event)
        except:
            # If date parsing fails, skip grouping for this event
            pass
    
    return grouped

def save_timeline_events():
    """Save timeline events to database for persistence"""
    db = SessionLocal()
    try:
        # Generate timeline
        timeline_data = generate_timeline()
        
        # Clear existing timeline events
        db.query(TimelineEvent).delete()
        
        # Save new events
        for event in timeline_data["events"]:
            try:
                event_date = datetime.fromisoformat(event["event_date"])
                
                timeline_event = TimelineEvent(
                    document_id=event["document_id"],
                    event_type=event["event_type"],
                    title=event["title"],
                    description=event["description"],
                    event_date=event_date,
                    importance=event["importance"]
                )
                
                db.add(timeline_event)
            except Exception as e:
                print(f"Error saving timeline event: {e}")
                continue
        
        db.commit()
        return {"status": "success", "events_saved": len(timeline_data["events"])}
    
    except Exception as e:
        db.rollback()
        print(f"Error saving timeline: {e}")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

def get_timeline_from_db() -> List[Dict]:
    """Get timeline events from database"""
    db = SessionLocal()
    try:
        events = db.query(TimelineEvent).order_by(TimelineEvent.event_date).all()
        
        result = []
        for event in events:
            result.append({
                "id": event.id,
                "document_id": event.document_id,
                "event_type": event.event_type,
                "title": event.title,
                "description": event.description,
                "event_date": event.event_date.isoformat(),
                "end_date": event.end_date.isoformat() if event.end_date else None,
                "skills": json.loads(event.skills) if event.skills else [],
                "importance": event.importance
            })
        
        return result
    except Exception as e:
        print(f"Error getting timeline from db: {e}")
        return []
    finally:
        db.close()