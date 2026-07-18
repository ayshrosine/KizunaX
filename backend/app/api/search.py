from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from pydantic import BaseModel

from app.models.mongodb_models import Document, Skill
from app.core.security import get_current_active_user, User
try:
    from app.services.embeddings import embedding_service
except ImportError:
    embedding_service = None

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    category: Optional[str] = None
    limit: int = 10

@router.post("/")
async def search_documents(
    request: SearchRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Search documents using semantic search"""
    
    try:
        if not embedding_service:
            return {
                "query": request.query,
                "total_results": 0,
                "results": [],
                "error": "Embedding service not available"
            }
        
        # Build filter for category
        filter_dict = {}
        if request.category:
            filter_dict["category"] = request.category
        
        # Perform semantic search
        results = embedding_service.search_similar(
            query=request.query,
            n_results=request.limit,
            filter_dict=filter_dict if filter_dict else None
        )
        
        # Enrich results with document details from database (user-specific)
        enriched_results = []
        for result in results:
            doc_id = result['id']
            document = await Document.find_one(
                Document.id == doc_id,
                Document.user_id == int(current_user.id)
            )
            
            if document:
                enriched_results.append({
                    "id": str(document.id),
                    "title": document.title,
                    "filename": document.original_filename,
                    "category": document.category,
                    "summary": document.summary,
                    "upload_date": document.upload_date.isoformat(),
                    "document_date": document.document_date.isoformat() if document.document_date else None,
                    "similarity_score": 1 - result['distance'],  # Convert distance to similarity
                    "content_preview": result['document'][:200] if result['document'] else ""
                })
        
        return {
            "query": request.query,
            "total_results": len(enriched_results),
            "results": enriched_results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/categories")
async def get_categories(
    current_user: User = Depends(get_current_active_user)
):
    """Get all document categories for current user"""
    try:
        documents = await Document.find(Document.user_id == int(current_user.id)).to_list()
        categories = list(set(doc.category for doc in documents if doc.category))
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get categories: {str(e)}")

@router.get("/skills")
async def get_skills(
    current_user: User = Depends(get_current_active_user)
):
    """Get all skills for current user"""
    try:
        skills = await Skill.find(Skill.user_id == int(current_user.id)).to_list()
        return [
            {
                "id": str(skill.id),
                "name": skill.name,
                "category": skill.category,
                "confidence": skill.confidence
            }
            for skill in skills
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get skills: {str(e)}")

@router.get("/natural/{query}")
async def natural_search(
    query: str,
    current_user: User = Depends(get_current_active_user)
):
    """Natural language search with query interpretation"""
    
    # Interpret the query and determine search strategy
    query_lower = query.lower()
    
    # Check for specific patterns
    if "certificate" in query_lower or "certification" in query_lower:
        # Search for certificates
        return await search_documents(
            SearchRequest(query=query, category="Certifications"),
            current_user
        )
    elif "project" in query_lower:
        # Search for projects
        return await search_documents(
            SearchRequest(query=query, category="Projects"),
            current_user
        )
    elif "internship" in query_lower:
        # Search for internships
        return await search_documents(
            SearchRequest(query=query, category="Internships"),
            current_user
        )
    elif "skill" in query_lower:
        # Return skills
        return await get_skills(current_user)
    else:
        # General semantic search
        return await search_documents(
            SearchRequest(query=query),
            current_user
        )