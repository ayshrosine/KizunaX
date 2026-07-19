from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.core.security import get_current_active_user, User
from app.services.timeline import generate_timeline
from app.services.timeline_service import timeline_service
from app.repositories.relationship_repository import relationship_repository

router = APIRouter()

class TimelineResponse(BaseModel):
    events: list
    grouped: dict
    total_events: int

class RelationshipsResponse(BaseModel):
    relationships: list
    total: int

@router.get("/", response_model=TimelineResponse)
async def get_timeline(
    current_user: User = Depends(get_current_active_user)
):
    """Get digital journey timeline for current user"""
    try:
        return await generate_timeline(str(current_user.id))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate timeline: {str(e)}")

@router.get("/relationships", response_model=RelationshipsResponse)
async def get_timeline_relationships(
    current_user: User = Depends(get_current_active_user)
):
    """Get document relationships for timeline context for current user"""
    try:
        relationships = await relationship_repository.find_by_user_id(str(current_user.id))
        return {
            "relationships": [
                {
                    "id": str(rel.id),
                    "source_type": rel.source_type,
                    "source_id": rel.source_id,
                    "target_type": rel.target_type,
                    "target_id": rel.target_id,
                    "relationship_type": rel.relationship_type.value,
                    "strength": rel.strength,
                    "ai_generated": rel.ai_generated
                }
                for rel in relationships
            ],
            "total": len(relationships)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get relationships: {str(e)}")

@router.get("/persisted", response_model=TimelineResponse)
async def get_persisted_timeline(
    current_user: User = Depends(get_current_active_user)
):
    """Get timeline from database (cached version) for current user"""
    try:
        return await timeline_service.get_persisted_timeline(str(current_user.id))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get persisted timeline: {str(e)}")