from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from typing import List
from pydantic import BaseModel

from app.core.config import settings
from app.core.security import get_current_active_user, UserInfo
from app.services.upload_service import upload_service
from app.services.document_processing_service import document_processing_service

router = APIRouter()

class UploadResponse(BaseModel):
    id: str
    filename: str
    status: str
    file_url: str = None
    message: str

class BulkUploadResponse(BaseModel):
    total: int
    successful: int
    failed: int
    results: List[dict]

@router.post("/", response_model=UploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: UserInfo = Depends(get_current_active_user)
):
    """Upload a document"""
    
    file_content = await file.read()
    if len(file_content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds limit")
    
    file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    if file_extension not in settings.allowed_extensions_list:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    try:
        document = await upload_service.upload_document(
            user_id=current_user.id,
            filename=file.filename,
            file_content=file_content,
            content_type=file.content_type
        )
        
        doc_id = document.get("id")
        
        # Trigger background processing task
        background_tasks.add_task(
            document_processing_service.process_document,
            user_id=current_user.id,
            document_id=doc_id,
            file_content=file_content,
            filename=file.filename
        )
        
        return UploadResponse(
            id=doc_id,
            filename=document.get("filename"),
            status=document.get("status"),
            file_url=document.get("file_url"),
            message="Document uploaded successfully and queued for processing"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@router.get("/{document_id}/status")
async def get_document_status(
    document_id: str,
    current_user: UserInfo = Depends(get_current_active_user)
):
    """Get document processing status"""
    try:
        document = await upload_service.get_document_status(document_id)
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {
            "id": document.get("id"),
            "status": document.get("status"),
            "category": document.get("category"),
            "created_at": document.get("created_at")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting document status: {str(e)}")