from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from app.core.security import get_current_active_user, UserInfo
from app.services.timeline import generate_timeline
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
    current_user: UserInfo = Depends(get_current_active_user)
):
    """Get digital journey timeline for current user"""
    try:
        return await generate_timeline(current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate timeline: {str(e)}")

@router.get("/relationships", response_model=RelationshipsResponse)
async def get_timeline_relationships(
    current_user: UserInfo = Depends(get_current_active_user)
):
    """Get document relationships for timeline context for current user"""
    try:
        relationships = relationship_repository.find_by_user_id(current_user.id)
        return {
            "relationships": [
                {
                    "id": str(rel.get("id")),
                    "from_entity": rel.get("from_entity"),
                    "to_entity": rel.get("to_entity"),
                    "relationship_type": rel.get("relation_type"),
                    "ai_generated": True
                }
                for rel in relationships
            ],
            "total": len(relationships)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get relationships: {str(e)}")

@router.get("/persisted", response_model=TimelineResponse)
async def get_persisted_timeline(
    current_user: UserInfo = Depends(get_current_active_user)
):
    """Get timeline from database for current user"""
    try:
        return await generate_timeline(current_user.id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get persisted timeline: {str(e)}")