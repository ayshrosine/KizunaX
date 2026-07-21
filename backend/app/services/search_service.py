from typing import Optional, List, Dict
from app.repositories.document_repository import document_repository
from app.models.schemas import DocumentCategory

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
    ) -> List[dict]:
        """Search documents using semantic search with category fast-path"""

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

        if category_fast_path:
            documents = document_repository.find_by_user_and_category(
                user_id,
                category_fast_path,
                skip=skip,
                limit=limit
            )
            return documents

        # Use semantic search via Qdrant
        if self.embedding_service:
            try:
                qdrant_results = self.embedding_service.search_similar(
                    query=query,
                    user_id=user_id,
                    n_results=limit
                )

                if qdrant_results:
                    document_ids = [result['id'] for result in qdrant_results]
                    documents = []
                    for doc_id in document_ids:
                        doc = document_repository.find_by_id(doc_id)
                        if doc and doc.get("user_id") == user_id:
                            documents.append(doc)
                    return documents[:limit]
            except Exception as e:
                print(f"Semantic search failed, falling back to text search: {e}")

        # Fallback to text search
        if category:
            documents = document_repository.find_by_user_and_category(
                user_id,
                category,
                skip=skip,
                limit=limit
            )
        else:
            documents = document_repository.find_by_user_id(
                user_id,
                skip=skip,
                limit=limit
            )

        if query:
            query_lower = query.lower()
            documents = [
                doc for doc in documents
                if query_lower in doc.get("filename", "").lower() or
                   (doc.get("extracted_text") and query_lower in doc.get("extracted_text", "").lower())
            ]

        return documents

    async def get_document_by_id(self, user_id: str, document_id: str) -> Optional[dict]:
        """Get document by ID with user scoping"""
        document = document_repository.find_by_id(document_id)
        if not document or document.get("user_id") != user_id:
            return None
        return document

    async def get_all_categories(self) -> List[str]:
        """Get all available document categories"""
        return [category.value for category in DocumentCategory]

# Singleton instance
search_service = SearchService()
