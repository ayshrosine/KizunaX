"""
Document repository — Supabase Postgres (replaces Beanie/MongoDB).
"""
from typing import Optional, List
from app.core.supabase_client import get_supabase


class DocumentRepository:
    """CRUD for the 'documents' table in Supabase Postgres."""

    TABLE = "documents"

    def create(self, data: dict) -> dict:
        """Insert a new document row."""
        supabase = get_supabase()
        result = supabase.table(self.TABLE).insert(data).execute()
        return result.data[0] if result.data else {}

    def find_by_id(self, doc_id: str) -> Optional[dict]:
        """Find a document by its UUID primary key."""
        supabase = get_supabase()
        result = supabase.table(self.TABLE).select("*").eq("id", doc_id).single().execute()
        return result.data

    def find_by_user_id(self, user_id: str, skip: int = 0, limit: int = 100) -> List[dict]:
        """Return all (non-deleted) documents for a user."""
        supabase = get_supabase()
        result = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("user_id", user_id)
            .eq("is_deleted", False)
            .order("created_at", desc=True)
            .range(skip, skip + limit - 1)
            .execute()
        )
        return result.data or []

    def find_by_user_and_category(self, user_id: str, category: str, skip: int = 0, limit: int = 100) -> List[dict]:
        """Return documents for a user filtered by category."""
        supabase = get_supabase()
        result = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("user_id", user_id)
            .eq("category", category)
            .eq("is_deleted", False)
            .order("created_at", desc=True)
            .range(skip, skip + limit - 1)
            .execute()
        )
        return result.data or []

    def update(self, doc_id: str, update_data: dict) -> Optional[dict]:
        """Update a document row."""
        supabase = get_supabase()
        result = supabase.table(self.TABLE).update(update_data).eq("id", doc_id).execute()
        return result.data[0] if result.data else None

    def update_status(self, doc_id: str, status: str) -> Optional[dict]:
        return self.update(doc_id, {"status": status})

    def update_category(self, doc_id: str, category: str, confidence: float = None) -> Optional[dict]:
        data = {"category": category}
        if confidence is not None:
            data["category_confidence"] = confidence
        return self.update(doc_id, data)

    def soft_delete(self, doc_id: str) -> Optional[dict]:
        return self.update(doc_id, {"is_deleted": True})

    def hard_delete(self, doc_id: str) -> bool:
        supabase = get_supabase()
        supabase.table(self.TABLE).delete().eq("id", doc_id).execute()
        return True

    def count_by_user(self, user_id: str) -> int:
        supabase = get_supabase()
        result = (
            supabase.table(self.TABLE)
            .select("id", count="exact")
            .eq("user_id", user_id)
            .eq("is_deleted", False)
            .execute()
        )
        return result.count or 0

    def search_text(self, user_id: str, query: str, limit: int = 20) -> List[dict]:
        """Basic text search via Postgres ilike (use Qdrant for semantic search)."""
        supabase = get_supabase()
        result = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("user_id", user_id)
            .eq("is_deleted", False)
            .ilike("extracted_text", f"%{query}%")
            .limit(limit)
            .execute()
        )
        return result.data or []

    def get_indexed_documents(self, user_id: str, limit: int = 100) -> List[dict]:
        supabase = get_supabase()
        result = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("user_id", user_id)
            .eq("status", "indexed")
            .eq("is_deleted", False)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []


# Singleton
document_repository = DocumentRepository()
