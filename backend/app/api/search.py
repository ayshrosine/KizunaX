from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from pydantic import BaseModel, Field

from app.models.schemas import DocumentCategory
from app.core.security import get_current_active_user, UserInfo
from app.services.search_service import search_service
from app.repositories.skill_repository import skill_repository

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    category: Optional[str] = None
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
    current_user: UserInfo = Depends(get_current_active_user)
):
    """Search documents using text search"""
    
    try:
        documents = await search_service.search_documents(
            user_id=current_user.id,
            query=request.query,
            category=request.category,
            skip=0,
            limit=request.limit
        )
        
        results = []
        for doc in documents:
            created_at_str = doc.get("created_at") or ""
            results.append({
                "id": str(doc.get("id")),
                "filename": doc.get("filename", "Untitled"),
                "category": doc.get("category"),
                "extracted_text": doc.get("extracted_text", "")[:300],
                "created_at": created_at_str
            })
        
        return SearchResponse(
            query=request.query,
            total_results=len(results),
            results=results
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/categories")
async def get_categories(
    current_user: UserInfo = Depends(get_current_active_user)
):
    """Get all document categories"""
    try:
        return await search_service.get_all_categories()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get categories: {str(e)}")

@router.get("/skills")
async def get_skills(
    current_user: UserInfo = Depends(get_current_active_user)
):
    """Get all skills for current user"""
    try:
        skills = skill_repository.find_by_user_id(current_user.id)
        return [
            {
                "id": str(skill.get("id")),
                "name": skill.get("name"),
                "normalized_name": skill.get("normalized_name"),
                "confidence_score": skill.get("confidence_score"),
                "has_evidence": len(skill.get("source_document_ids", [])) > 0,
                "source_document_ids": skill.get("source_document_ids")
            }
            for skill in skills
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get skills: {str(e)}")