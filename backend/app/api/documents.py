from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from pydantic import BaseModel, Field

from app.models.mongodb_models import Document, DocumentCategory
from app.core.security import get_current_active_user, User
from app.repositories.document_repository import document_repository
from app.services.search_service import search_service

router = APIRouter()

class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size_bytes: Optional[int] = None
    storage_url: Optional[str] = None
    status: str
    category: Optional[str] = None
    category_confidence: Optional[float] = None
    extracted_text: Optional[str] = None
    created_at: str
    updated_at: str

class DocumentUpdate(BaseModel):
    category: DocumentCategory

class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int
    page: int
    limit: int

@router.get("/", response_model=DocumentListResponse)
async def get_documents(
    category: Optional[DocumentCategory] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_active_user)
):
    """Get all documents for current user with optional category filter and pagination"""
    try:
        skip = (page - 1) * limit
        
        if category:
            documents = await document_repository.find_by_user_and_category(
                str(current_user.id), 
                category, 
                skip=skip, 
                limit=limit
            )
            total = await document_repository.count_by_user(str(current_user.id))
        else:
            documents = await document_repository.find_by_user_id(
                str(current_user.id), 
                skip=skip, 
                limit=limit
            )
            total = await document_repository.count_by_user(str(current_user.id))
        
        return DocumentListResponse(
            documents=[
                DocumentResponse(
                    id=str(doc.id),
                    filename=doc.filename,
                    file_type=doc.file_type,
                    file_size_bytes=doc.file_size_bytes,
                    storage_url=doc.storage_url,
                    status=doc.status.value,
                    category=doc.category.value if doc.category else None,
                    category_confidence=doc.category_confidence,
                    extracted_text=doc.extracted_text[:500] if doc.extracted_text else None,
                    created_at=doc.created_at.isoformat(),
                    updated_at=doc.updated_at.isoformat()
                )
                for doc in documents
            ],
            total=total,
            page=page,
            limit=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get documents: {str(e)}")

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific document by ID for current user"""
    try:
        document = await search_service.get_document_by_id(str(current_user.id), document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return DocumentResponse(
            id=str(document.id),
            filename=document.filename,
            file_type=document.file_type,
            file_size_bytes=document.file_size_bytes,
            storage_url=document.storage_url,
            status=document.status.value,
            category=document.category.value if document.category else None,
            category_confidence=document.category_confidence,
            extracted_text=document.extracted_text[:500] if document.extracted_text else None,
            created_at=document.created_at.isoformat(),
            updated_at=document.updated_at.isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get document: {str(e)}")

@router.patch("/{document_id}/category")
async def update_document_category(
    document_id: str,
    document_update: DocumentUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update document category for current user"""
    try:
        document = await search_service.get_document_by_id(str(current_user.id), document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        await document_repository.update_category(
            document_id, 
            document_update.category
        )
        
        return {"message": "Document category updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update document: {str(e)}")

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a document for current user (soft delete)"""
    try:
        from app.services.upload_service import upload_service
        
        success = await upload_service.delete_document(str(current_user.id), document_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {"message": "Document deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")