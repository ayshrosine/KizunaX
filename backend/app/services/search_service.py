from typing import Optional, List
from beanie import PydanticObjectId

from app.repositories.document_repository import document_repository
from app.models.mongodb_models import Document, DocumentStatus

class SearchService:
    """Search service - business logic for search operations"""
    
    async def search_documents(
        self, 
        user_id: str, 
        query: str, 
        category: str = None,
        skip: int = 0, 
        limit: int = 100
    ) -> List[Document]:
        """Search documents by text query and optional category filter"""
        
        if category:
            # Search within specific category
            documents = await document_repository.find_by_user_and_category(
                user_id, 
                DocumentCategory(category), 
                skip=skip, 
                limit=limit
            )
        else:
            # Search all documents
            documents = await document_repository.find_by_user_id(
                user_id, 
                skip=skip, 
                limit=limit
            )
        
        # Filter by query text if provided
        if query:
            # Simple text filtering (in production, use ChromaDB for semantic search)
            query_lower = query.lower()
            documents = [
                doc for doc in documents 
                if query_lower in doc.filename.lower() or 
                   (doc.extracted_text and query_lower in doc.extracted_text.lower())
            ]
        
        return documents
    
    async def get_document_by_id(self, user_id: str, document_id: str) -> Optional[Document]:
        """Get document by ID with user scoping"""
        document = await document_repository.find_by_id(document_id)
        
        if not document or document.user_id != user_id:
            return None
        
        return document
    
    async def get_all_categories(self) -> List[str]:
        """Get all available document categories"""
        from app.models.mongodb_models import DocumentCategory
        return [category.value for category in DocumentCategory]

# Singleton instance
search_service = SearchService()
