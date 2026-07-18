from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
from pydantic import BaseModel

from app.models.mongodb_models import Document
from app.core.config import settings
from app.core.security import get_current_active_user, User
from app.services.upload_service import upload_service

router = APIRouter()

class UploadResponse(BaseModel):
    id: str
    filename: str
    status: str
    storage_url: str = None
    message: str

class BulkUploadResponse(BaseModel):
    total: int
    successful: int
    failed: int
    results: List[dict]

@router.post("/", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a document"""
    
    # Validate file size
    file_content = await file.read()
    if len(file_content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds limit")
    
    # Validate file extension
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in settings.allowed_extensions_list:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    try:
        document = await upload_service.upload_document(
            user_id=str(current_user.id),
            filename=file.filename,
            file_content=file_content,
            content_type=file.content_type
        )
        
        return UploadResponse(
            id=str(document.id),
            filename=document.filename,
            status=document.status.value,
            storage_url=document.storage_url,
            message="Document uploaded successfully"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@router.get("/{document_id}/status")
async def get_document_status(
    document_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get document processing status"""
    try:
        document = await upload_service.get_document_status(document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {
            "id": str(document.id),
            "status": document.status.value,
            "category": document.category.value if document.category else None,
            "created_at": document.created_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting document status: {str(e)}")