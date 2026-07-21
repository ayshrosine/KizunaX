"""
Upload service — Uploads files to Supabase Storage (bucket 'user-files')
and creates records in Supabase Postgres.
"""
from typing import Optional
from app.repositories.document_repository import document_repository
from app.repositories.activity_log_repository import activity_log_repository
from app.models.schemas import DocumentStatus, ActionType
from app.core.supabase_client import get_supabase


class UploadService:
    """Upload service - business logic for document upload operations"""
    
    async def upload_document(
        self, 
        user_id: str, 
        filename: str, 
        file_content: bytes, 
        content_type: str
    ) -> dict:
        """Upload document to Supabase Storage and create Postgres record"""
        supabase = get_supabase()
        
        # Path structure: user_id/filename (to ensure tenant separation in storage)
        storage_path = f"{user_id}/{filename}"
        
        try:
            # Upload to Supabase 'user-files' bucket
            supabase.storage.from_("user-files").upload(
                path=storage_path,
                file=file_content,
                file_options={"content-type": content_type, "x-upsert": "true"}
            )
            
            # Get public url for download
            url_res = supabase.storage.from_("user-files").get_public_url(storage_path)
            file_url = url_res if isinstance(url_res, str) else getattr(url_res, "public_url", "")
            
        except Exception as e:
            raise ValueError(f"Failed to upload to Supabase Storage: {e}")
            
        # Create document record in Postgres
        document_data = {
            "user_id": user_id,
            "filename": filename,
            "file_type": filename.split('.')[-1].lower() if '.' in filename else 'bin',
            "file_size_bytes": len(file_content),
            "file_url": file_url,
            "status": DocumentStatus.UPLOADING.value,
            "is_deleted": False
        }
        
        document = document_repository.create(document_data)
        doc_id = document.get("id")
        
        # Log activity
        try:
            activity_log_repository.create({
                "user_id": user_id,
                "action": ActionType.UPLOAD.value,
                "target_type": "document",
                "target_id": doc_id,
                "metadata": {
                    "filename": filename,
                    "file_size": len(file_content)
                }
            })
        except Exception as e:
            print(f"[UploadService] Activity logging failed: {e}")
            
        return document
    
    async def get_document_status(self, document_id: str) -> Optional[dict]:
        """Get document processing status"""
        return document_repository.find_by_id(document_id)
    
    async def delete_document(self, user_id: str, document_id: str) -> bool:
        """Delete document (soft delete)"""
        document = document_repository.find_by_id(document_id)
        
        if not document or document.get("user_id") != user_id:
            raise ValueError("Document not found or access denied")
        
        # Soft delete in Postgres
        document_repository.soft_delete(document_id)
        
        # Log activity
        try:
            activity_log_repository.create({
                "user_id": user_id,
                "action": ActionType.DELETE.value,
                "target_type": "document",
                "target_id": document_id,
                "metadata": {
                    "filename": document.get("filename")
                }
            })
        except Exception as e:
            print(f"[UploadService] Activity logging failed: {e}")
            
        return True


# Singleton instance
upload_service = UploadService()
