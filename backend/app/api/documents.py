from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel

from app.models.mongodb_models import Document
from app.core.security import get_current_active_user, User
from app.utils.r2_storage import r2_storage

router = APIRouter()

class DocumentResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    category: str
    title: str
    summary: str
    upload_date: str
    document_date: Optional[str] = None
    organization: Optional[str] = None
    processing_status: str
    r2_url: Optional[str] = None

class DocumentUpdate(BaseModel):
    category: str

@router.get("/", response_model=List[DocumentResponse])
async def get_documents(
    category: str = None,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user)
):
    """Get all documents for current user with optional category filter"""
    try:
        query = Document.find(Document.user_id == str(current_user.id))
        
        if category:
            query = query.find(Document.category == category)
        
        documents = await query.sort(-Document.upload_date).limit(limit).to_list()
        
        return [
            DocumentResponse(
                id=str(doc.id),
                filename=doc.filename,
                original_filename=doc.original_filename,
                category=doc.category,
                title=doc.title,
                summary=doc.summary,
                upload_date=doc.upload_date.isoformat(),
                document_date=doc.document_date.isoformat() if doc.document_date else None,
                organization=doc.organization,
                processing_status=doc.processing_status,
                r2_url=doc.r2_url
            )
            for doc in documents
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get documents: {str(e)}")

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific document by ID for current user"""
    try:
        document = await Document.find_one(
            Document.id == document_id,
            Document.user_id == int(current_user.id)
        )
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return DocumentResponse(
            id=str(document.id),
            filename=document.filename,
            original_filename=document.original_filename,
            category=document.category,
            title=document.title,
            summary=document.summary,
            upload_date=document.upload_date.isoformat(),
            document_date=document.document_date.isoformat() if document.document_date else None,
            organization=document.organization,
            processing_status=document.processing_status,
            r2_url=document.r2_url
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get document: {str(e)}")

@router.put("/{document_id}")
async def update_document(
    document_id: str,
    document_update: DocumentUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update document category for current user"""
    try:
        document = await Document.find_one(
            Document.id == document_id,
            Document.user_id == int(current_user.id)
        )
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document.category = document_update.category
        await document.save()
        
        return {"message": "Document updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update document: {str(e)}")

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a document for current user"""
    try:
        document = await Document.find_one(
            Document.id == document_id,
            Document.user_id == int(current_user.id)
        )
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete from vector database
        try:
            from app.services.embeddings import embedding_service
            if embedding_service:
                embedding_service.delete_document(str(document_id))
        except ImportError:
            pass  # Continue without vector database deletion
        
        # Delete from R2 storage
        if document.r2_key:
            r2_storage.delete_file(document.r2_key)
        
        # Delete from database
        await document.delete()
        
        return {"message": "Document deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")