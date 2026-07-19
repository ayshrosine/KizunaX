from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

from app.core.security import get_current_active_user, User
from app.models.mongodb_models import PortfolioSettings
from app.repositories.document_repository import document_repository
from app.repositories.skill_repository import skill_repository
from app.services.timeline_service import timeline_service

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
async def get_portfolio_settings(current_user: User = Depends(get_current_active_user)):
    """Get portfolio settings for current user."""
    settings = await PortfolioSettings.find_one(PortfolioSettings.user_id == str(current_user.id))
    if not settings:
        return PortfolioSettingsResponse()
    return PortfolioSettingsResponse(
        username=settings.username,
        theme=settings.theme,
        visible_categories=settings.visible_categories,
        is_published=settings.is_published,
        published_at=settings.published_at.isoformat() if settings.published_at else None,
    )


@router.patch("/settings", response_model=PortfolioSettingsResponse)
async def update_portfolio_settings(
    update: PortfolioSettingsUpdate,
    current_user: User = Depends(get_current_active_user),
):
    """Update portfolio settings for current user."""
    user_id = str(current_user.id)
    settings = await PortfolioSettings.find_one(PortfolioSettings.user_id == user_id)

    if not settings:
        username = update.username or current_user.email.split("@")[0]
        existing = await PortfolioSettings.find_one(PortfolioSettings.username == username)
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        settings = PortfolioSettings(
            user_id=user_id,
            username=username,
            theme=update.theme or "slate",
            visible_categories=update.visible_categories or [],
        )
        await settings.save()
    else:
        if update.username and update.username != settings.username:
            existing = await PortfolioSettings.find_one(PortfolioSettings.username == update.username)
            if existing:
                raise HTTPException(status_code=400, detail="Username already taken")
            settings.username = update.username
        if update.theme is not None:
            settings.theme = update.theme
        if update.visible_categories is not None:
            settings.visible_categories = update.visible_categories
        if update.is_published is not None:
            settings.is_published = update.is_published
            settings.published_at = datetime.utcnow() if update.is_published else None
        settings.updated_at = datetime.utcnow()
        await settings.save()

    return PortfolioSettingsResponse(
        username=settings.username,
        theme=settings.theme,
        visible_categories=settings.visible_categories,
        is_published=settings.is_published,
        published_at=settings.published_at.isoformat() if settings.published_at else None,
    )


@router.post("/publish")
async def publish_portfolio(current_user: User = Depends(get_current_active_user)):
    """Publish portfolio for current user."""
    user_id = str(current_user.id)
    settings = await PortfolioSettings.find_one(PortfolioSettings.user_id == user_id)

    if not settings:
        username = current_user.email.split("@")[0]
        settings = PortfolioSettings(user_id=user_id, username=username, theme="slate")
        await settings.save()

    settings.is_published = True
    settings.published_at = datetime.utcnow()
    settings.updated_at = datetime.utcnow()
    await settings.save()

    return {
        "message": "Portfolio published",
        "username": settings.username,
        "url": f"/u/{settings.username}",
    }


@router.get("/u/{username}")
async def get_public_portfolio(username: str):
    """Get public portfolio by username (no auth required)."""
    settings = await PortfolioSettings.find_one(
        PortfolioSettings.username == username,
        PortfolioSettings.is_published == True,
    )
    if not settings:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    user_id = settings.user_id
    documents = await document_repository.get_indexed_documents(user_id, limit=50)
    if settings.visible_categories:
        documents = [d for d in documents if d.category and d.category.value in settings.visible_categories]

    skills = await skill_repository.find_with_evidence(user_id, limit=20)
    timeline = await timeline_service.generate_timeline(user_id)

    return {
        "username": settings.username,
        "theme": settings.theme,
        "documents": [
            {"filename": d.filename, "category": d.category.value if d.category else None}
            for d in documents
        ],
        "skills": [s.name for s in skills],
        "timeline": timeline.get("events", [])[:10],
    }
