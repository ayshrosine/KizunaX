from fastapi import APIRouter, HTTPException, Depends

from app.models.mongodb_models import Document, TimelineEvent, DocumentRelationship
from app.core.security import get_current_active_user, User
try:
    from app.services.timeline import _map_category_to_event_type, _calculate_importance, _group_by_year
except ImportError:
    # Placeholder functions for testing
    def _map_category_to_event_type(category):
        return "general"
    def _calculate_importance(doc):
        return 1.0
    def _group_by_year(events):
        return {}

router = APIRouter()

@router.get("/")
async def get_timeline(
    current_user: User = Depends(get_current_active_user)
):
    """Get digital journey timeline for current user"""
    try:
        # Generate fresh timeline with user filtering
        timeline_data = await generate_timeline_for_user(str(current_user.id))
        
        # Save to database for persistence
        await save_timeline_events_for_user(str(current_user.id))
        
        return timeline_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate timeline: {str(e)}")

@router.get("/relationships")
async def get_timeline_relationships(
    current_user: User = Depends(get_current_active_user)
):
    """Get document relationships for timeline context for current user"""
    try:
        relationships = await get_all_relationships_for_user(str(current_user.id))
        return {
            "relationships": relationships,
            "total": len(relationships)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get relationships: {str(e)}")

@router.get("/persisted")
async def get_persisted_timeline(
    current_user: User = Depends(get_current_active_user)
):
    """Get timeline from database (cached version) for current user"""
    try:
        events = await get_timeline_from_db_for_user(str(current_user.id))
        
        # Group by year
        grouped = _group_by_year(events)
        
        return {
            "events": events,
            "grouped": grouped,
            "total_events": len(events)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get persisted timeline: {str(e)}")

# Helper functions for user-specific data
async def generate_timeline_for_user(user_id: str):
    """Generate timeline for specific user"""
    documents = await Document.find(
        Document.user_id == user_id,
        Document.processing_status == "completed"
    ).to_list()
    
    timeline_events = []
    
    for doc in documents:
        event_date = doc.document_date if doc.document_date else doc.upload_date
        event_type = _map_category_to_event_type(doc.category)
        
        event = {
            "document_id": str(doc.id),
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
    
    timeline_events.sort(key=lambda x: x["event_date"])
    grouped_timeline = _group_by_year(timeline_events)
    
    return {
        "events": timeline_events,
        "grouped": grouped_timeline,
        "total_events": len(timeline_events)
    }

async def save_timeline_events_for_user(user_id: str):
    """Save timeline events for specific user"""
    from datetime import datetime
    import json
    
    timeline_data = await generate_timeline_for_user(user_id)
    
    # Clear existing timeline events for user
    await TimelineEvent.find(TimelineEvent.user_id == user_id).delete()
    
    # Save new events
    events_saved = 0
    for event in timeline_data["events"]:
        try:
            event_date = datetime.fromisoformat(event["event_date"])
            
            timeline_event = TimelineEvent(
                user_id=user_id,
                document_id=event["document_id"],
                event_type=event["event_type"],
                title=event["title"],
                description=event["description"],
                event_date=event_date,
                importance=event["importance"]
            )
            
            await timeline_event.save()
            events_saved += 1
        except Exception as e:
            print(f"Error saving timeline event: {e}")
            continue
    
    return {"status": "success", "events_saved": events_saved}

async def get_timeline_from_db_for_user(user_id: str):
    """Get timeline events from database for specific user"""
    import json
    
    events = await TimelineEvent.find(
        TimelineEvent.user_id == user_id
    ).sort(TimelineEvent.event_date).to_list()
    
    result = []
    for event in events:
        result.append({
            "id": str(event.id),
            "document_id": str(event.document_id) if event.document_id else None,
            "event_type": event.event_type,
            "title": event.title,
            "description": event.description,
            "event_date": event.event_date.isoformat(),
            "end_date": event.end_date.isoformat() if event.end_date else None,
            "skills": json.loads(event.skills) if event.skills else [],
            "importance": event.importance
        })
    
    return result

async def get_all_relationships_for_user(user_id: str):
    """Get relationships for specific user"""
    import json
    
    relationships = await DocumentRelationship.find(
        DocumentRelationship.user_id == user_id
    ).to_list()
    
    result = []
    for rel in relationships:
        doc = await Document.find_one(Document.id == rel.document_id)
        related_doc = await Document.find_one(Document.id == rel.related_document_id) if rel.related_document_id else None
        
        result.append({
            "id": str(rel.id),
            "relationship_type": rel.relationship_type,
            "confidence": rel.confidence,
            "document": {
                "id": str(doc.id),
                "title": doc.title,
                "category": doc.category
            } if doc else None,
            "related_document": {
                "id": str(related_doc.id),
                "title": related_doc.title,
                "category": related_doc.category
            } if related_doc else None
        })
    
    return result