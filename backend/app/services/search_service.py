from typing import Optional, List, Dict
from beanie import PydanticObjectId

from app.repositories.document_repository import document_repository
from app.models.mongodb_models import Document, DocumentStatus, DocumentCategory

class SearchService:
    """Search service - business logic for search operations"""

    def __init__(self):
        try:
            from app.services.embeddings import embedding_service
            self.embedding_service = embedding_service
        except:
            self.embedding_service = None

    async def search_documents(
        self,
        user_id: str,
        query: str,
        category: str = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Document]:
        """Search documents using semantic search with category fast-path"""

        # Category fast-path: if query contains category keywords, filter directly
        query_lower = query.lower()
        category_fast_path = None

        if "certificate" in query_lower or "certification" in query_lower:
            category_fast_path = "Certifications"
        elif "project" in query_lower:
            category_fast_path = "Projects"
        elif "internship" in query_lower:
            category_fast_path = "Internships"
        elif "skill" in query_lower:
            category_fast_path = "Skills"
        elif "achievement" in query_lower:
            category_fast_path = "Achievements"
        elif "academic" in query_lower:
            category_fast_path = "Academics"

        # Use fast-path if detected
        if category_fast_path:
            documents = await document_repository.find_by_user_and_category(
                user_id,
                DocumentCategory(category_fast_path),
                skip=skip,
                limit=limit
            )
            return documents

        # Otherwise use semantic search via ChromaDB
        if self.embedding_service:
            try:
                chroma_results = self.embedding_service.search_similar(
                    query=query,
                    user_id=user_id,  # MANDATORY for multi-tenant isolation
                    n_results=limit
                )

                if chroma_results:
                    # Get document IDs from Chroma results
                    document_ids = [result['id'] for result in chroma_results]

                    # Fetch full documents from MongoDB
                    documents = []
                    for doc_id in document_ids:
                        doc = await document_repository.find_by_id(doc_id)
                        # Verify ownership (defense in depth)
                        if doc and doc.user_id == user_id:
                            documents.append(doc)

                    return documents[:limit]
            except Exception as e:
                print(f"Semantic search failed, falling back to text search: {e}")

        # Fallback to text search
        if category:
            documents = await document_repository.find_by_user_and_category(
                user_id,
                DocumentCategory(category),
                skip=skip,
                limit=limit
            )
        else:
            documents = await document_repository.find_by_user_id(
                user_id,
                skip=skip,
                limit=limit
            )

        # Filter by query text
        if query:
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
