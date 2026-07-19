from typing import Optional
import uuid
import io

from app.repositories.document_repository import document_repository
from app.repositories.activity_log_repository import activity_log_repository
from app.models.mongodb_models import Document, DocumentStatus
from app.utils.r2_storage import get_r2_storage
from app.models.mongodb_models import ActionType

class UploadService:
    """Upload service - business logic for document upload operations"""
    
    async def upload_document(
        self, 
        user_id: str, 
        filename: str, 
        file_content: bytes, 
        content_type: str
    ) -> Document:
        """Upload document to R2 and create MongoDB record"""
        
        r2_storage = get_r2_storage()
        if not r2_storage:
            raise ValueError("R2 storage not available")
        
        # Upload to R2 storage
        file_like_object = io.BytesIO(file_content)
        r2_result = await r2_storage.upload_file(
            file_like_object,
            user_id,
            filename,
            content_type=content_type
        )
        
        if not r2_result["success"]:
            raise ValueError(f"Failed to upload to R2: {r2_result.get('error')}")
        
        # Create document record
        document_data = {
            "user_id": user_id,
            "filename": filename,
            "file_type": filename.split('.')[-1].lower(),
            "file_size_bytes": len(file_content),
            "storage_key": r2_result["r2_key"],
            "storage_url": r2_result["r2_url"],
            "status": DocumentStatus.UPLOADING,
            "is_deleted": False
        }
        
        document = await document_repository.create(document_data)
        
        # Log activity
        await activity_log_repository.create({
            "user_id": user_id,
            "action": ActionType.UPLOAD,
            "target_type": "document",
            "target_id": str(document.id),
            "metadata": {
                "filename": filename,
                "file_size": len(file_content)
            }
        })
        
        return document
    
    async def get_document_status(self, document_id: str) -> Optional[Document]:
        """Get document processing status"""
        return await document_repository.find_by_id(document_id)
    
    async def delete_document(self, user_id: str, document_id: str) -> bool:
        """Delete document (soft delete)"""
        document = await document_repository.find_by_id(document_id)
        
        if not document or document.user_id != user_id:
            raise ValueError("Document not found or access denied")
        
        # Soft delete in MongoDB
        await document_repository.soft_delete(document_id)
        
        # Log activity
        await activity_log_repository.create({
            "user_id": user_id,
            "action": ActionType.DELETE,
            "target_type": "document",
            "target_id": document_id,
            "metadata": {
                "filename": document.filename
            }
        })
        
        return True

# Singleton instance
upload_service = UploadService()
