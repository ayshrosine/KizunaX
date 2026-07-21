from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

from app.core.security import get_current_active_user, UserInfo
from app.repositories.portfolio_repository import portfolio_repository
from app.repositories.document_repository import document_repository
from app.repositories.skill_repository import skill_repository
from app.services.timeline import generate_timeline

router = APIRouter()

class PortfolioSettingsUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    theme: Optional[str] = None
    visible_categories: Optional[List[str]] = None
    is_published: Optional[bool] = None

class PortfolioSettingsResponse(BaseModel):
    username: Optional[str] = None
    theme: Optional[str] = None
    visible_categories: List[str] = []
    is_published: bool = False
    published_at: Optional[str] = None

@router.get("/settings", response_model=PortfolioSettingsResponse)
async def get_portfolio_settings(current_user: UserInfo = Depends(get_current_active_user)):
    """Get portfolio settings for current user."""
    settings = portfolio_repository.find_by_user_id(current_user.id)
    if not settings:
        return PortfolioSettingsResponse()
    return PortfolioSettingsResponse(
        username=settings.get("username"),
        theme=settings.get("theme"),
        visible_categories=settings.get("visible_categories") or [],
        is_published=settings.get("is_published", False),
        published_at=settings.get("published_at")
    )

@router.patch("/settings", response_model=PortfolioSettingsResponse)
async def update_portfolio_settings(
    update: PortfolioSettingsUpdate,
    current_user: UserInfo = Depends(get_current_active_user),
):
    """Update portfolio settings for current user."""
    user_id = current_user.id
    settings = portfolio_repository.find_by_user_id(user_id) or {"user_id": user_id}

    if update.username and update.username != settings.get("username"):
        existing = portfolio_repository.find_by_username(update.username)
        if existing and existing.get("user_id") != user_id:
            raise HTTPException(status_code=400, detail="Username already taken")
        settings["username"] = update.username
    elif not settings.get("username"):
        settings["username"] = current_user.email.split("@")[0]

    if update.theme is not None:
        settings["theme"] = update.theme
    if update.visible_categories is not None:
        settings["visible_categories"] = update.visible_categories
    if update.is_published is not None:
        settings["is_published"] = update.is_published
        settings["published_at"] = datetime.utcnow().isoformat() if update.is_published else None
        
    settings["updated_at"] = datetime.utcnow().isoformat()
    
    # Needs a primary key for upsert to work perfectly in Supabase, but upsert with matching user_id works if unique
    updated = portfolio_repository.upsert(settings)

    return PortfolioSettingsResponse(
        username=updated.get("username"),
        theme=updated.get("theme"),
        visible_categories=updated.get("visible_categories") or [],
        is_published=updated.get("is_published", False),
        published_at=updated.get("published_at"),
    )

@router.post("/publish")
async def publish_portfolio(current_user: UserInfo = Depends(get_current_active_user)):
    """Publish portfolio for current user."""
    user_id = current_user.id
    settings = portfolio_repository.find_by_user_id(user_id) or {"user_id": user_id}

    if not settings.get("username"):
        settings["username"] = current_user.email.split("@")[0]
        settings["theme"] = "slate"

    settings["is_published"] = True
    settings["published_at"] = datetime.utcnow().isoformat()
    settings["updated_at"] = datetime.utcnow().isoformat()
    
    updated = portfolio_repository.upsert(settings)

    return {
        "message": "Portfolio published",
        "username": updated.get("username"),
        "url": f"/u/{updated.get('username')}",
    }

@router.get("/u/{username}")
async def get_public_portfolio(username: str):
    """Get public portfolio by username (no auth required)."""
    settings = portfolio_repository.find_by_username(username)
    if not settings or not settings.get("is_published"):
        raise HTTPException(status_code=404, detail="Portfolio not found")

    user_id = settings.get("user_id")
    documents = document_repository.get_indexed_documents(user_id, limit=50)
    
    visible_categories = settings.get("visible_categories")
    if visible_categories:
        documents = [d for d in documents if d.get("category") in visible_categories]

    skills = skill_repository.find_by_user_id(user_id)
    skills = [s for s in skills if len(s.get("source_document_ids", [])) > 0][:20]
    
    timeline = await generate_timeline(user_id)

    return {
        "username": settings.get("username"),
        "theme": settings.get("theme"),
        "documents": [
            {"filename": d.get("filename"), "category": d.get("category")}
            for d in documents
        ],
        "skills": [s.get("name") for s in skills],
        "timeline": timeline.get("events", [])[:10],
    }
