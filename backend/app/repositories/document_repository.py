from typing import Optional, List
from beanie import PydanticObjectId
from datetime import datetime

from app.models.mongodb_models import Document, DocumentStatus, DocumentCategory

class DocumentRepository:
    """Repository for Document model - MongoDB operations only"""
    
    async def create(self, document_data: dict) -> Document:
        """Create a new document"""
        document = Document(**document_data)
        await document.save()
        return document
    
    async def find_by_id(self, document_id: str) -> Optional[Document]:
        """Find document by ID"""
        return await Document.get(PydanticObjectId(document_id))
    
    async def find_by_user_id(self, user_id: str, skip: int = 0, limit: int = 100) -> List[Document]:
        """Find documents by user ID with pagination"""
        return await Document.find(
            Document.user_id == user_id,
            Document.is_deleted == False
        ).skip(skip).limit(limit).sort("-created_at").to_list()
    
    async def find_by_user_and_category(self, user_id: str, category: DocumentCategory, skip: int = 0, limit: int = 100) -> List[Document]:
        """Find documents by user ID and category with pagination"""
        return await Document.find(
            Document.user_id == user_id,
            Document.category == category,
            Document.is_deleted == False
        ).skip(skip).limit(limit).sort("-created_at").to_list()
    
    async def find_by_status(self, status: DocumentStatus, skip: int = 0, limit: int = 100) -> List[Document]:
        """Find documents by status"""
        return await Document.find(
            Document.status == status
        ).skip(skip).limit(limit).to_list()
    
    async def find_by_chroma_vector_id(self, chroma_vector_id: str) -> Optional[Document]:
        """Find document by ChromaDB vector ID"""
        return await Document.find_one(Document.chroma_vector_id == chroma_vector_id)
    
    async def update(self, document_id: str, update_data: dict) -> Optional[Document]:
        """Update document by ID"""
        document = await Document.get(PydanticObjectId(document_id))
        if document:
            for key, value in update_data.items():
                setattr(document, key, value)
            document.updated_at = datetime.utcnow()
            await document.save()
        return document
    
    async def update_status(self, document_id: str, status: DocumentStatus) -> Optional[Document]:
        """Update document status"""
        return await self.update(document_id, {"status": status})
    
    async def update_category(self, document_id: str, category: DocumentCategory, confidence: float = None, overridden: bool = True) -> Optional[Document]:
        """Update document category"""
        update_data = {"category": category, "category_overridden": overridden}
        if confidence is not None:
            update_data["category_confidence"] = confidence
        return await self.update(document_id, update_data)
    
    async def soft_delete(self, document_id: str) -> Optional[Document]:
        """Soft delete document by ID"""
        return await self.update(document_id, {"is_deleted": True})
    
    async def hard_delete(self, document_id: str) -> bool:
        """Hard delete document by ID (use with caution)"""
        document = await Document.get(PydanticObjectId(document_id))
        if document:
            await document.delete()
            return True
        return False
    
    async def count_by_user(self, user_id: str) -> int:
        """Count documents by user ID"""
        return await Document.find(
            Document.user_id == user_id,
            Document.is_deleted == False
        ).count()
    
    async def count_by_status(self, status: DocumentStatus) -> int:
        """Count documents by status"""
        return await Document.find(Document.status == status).count()
    
    async def search_text(self, user_id: str, query: str, skip: int = 0, limit: int = 100) -> List[Document]:
        """Text search in filename and extracted_text"""
        return await Document.find(
            Document.user_id == user_id,
            Document.is_deleted == False,
            {"$text": {"$search": query}}
        ).skip(skip).limit(limit).to_list()
    
    async def get_indexed_documents(self, user_id: str, skip: int = 0, limit: int = 100) -> List[Document]:
        """Get all indexed documents for a user"""
        return await Document.find(
            Document.user_id == user_id,
            Document.status == DocumentStatus.INDEXED,
            Document.is_deleted == False
        ).skip(skip).limit(limit).sort("-created_at").to_list()

# Singleton instance
document_repository = DocumentRepository()
