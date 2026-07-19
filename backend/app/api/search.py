from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from pydantic import BaseModel, Field

from app.models.mongodb_models import Document, DocumentCategory
from app.core.security import get_current_active_user, User
from app.services.search_service import search_service
from app.repositories.skill_repository import skill_repository

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    category: Optional[DocumentCategory] = None
    limit: int = Field(10, ge=1, le=100)

class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[dict]

class DocumentSearchResult(BaseModel):
    id: str
    filename: str
    category: Optional[str] = None
    extracted_text: Optional[str] = None
    created_at: str

@router.post("/", response_model=SearchResponse)
async def search_documents(
    request: SearchRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Search documents using text search"""
    
    try:
        documents = await search_service.search_documents(
            user_id=str(current_user.id),
            query=request.query,
            category=request.category.value if request.category else None,
            skip=0,
            limit=request.limit
        )
        
        results = [
            DocumentSearchResult(
                id=str(doc.id),
                filename=doc.filename,
                category=doc.category.value if doc.category else None,
                extracted_text=doc.extracted_text[:300] if doc.extracted_text else None,
                created_at=doc.created_at.isoformat()
            ).__dict__
            for doc in documents
        ]
        
        return SearchResponse(
            query=request.query,
            total_results=len(results),
            results=results
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/categories")
async def get_categories(
    current_user: User = Depends(get_current_active_user)
):
    """Get all document categories"""
    try:
        return await search_service.get_all_categories()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get categories: {str(e)}")

@router.get("/skills")
async def get_skills(
    current_user: User = Depends(get_current_active_user)
):
    """Get all skills for current user"""
    try:
        skills = await skill_repository.find_by_user_id(str(current_user.id))
        return [
            {
                "id": str(skill.id),
                "name": skill.name,
                "normalized_name": skill.normalized_name,
                "confidence_score": skill.confidence_score,
                "has_evidence": skill.has_evidence,
                "source_document_ids": skill.source_document_ids
            }
            for skill in skills
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get skills: {str(e)}")