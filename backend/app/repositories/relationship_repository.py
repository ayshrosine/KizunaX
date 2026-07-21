"""
Relationship repository — Supabase Postgres.
"""
from typing import Optional, List
from app.core.supabase_client import get_supabase


class RelationshipRepository:
    TABLE = "relationships"

    def create(self, data: dict) -> dict:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).insert(data).execute()
        return result.data[0] if result.data else {}

    def find_by_user_id(self, user_id: str) -> List[dict]:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).select("*").eq("user_id", user_id).execute()
        return result.data or []

    def find_by_entity(self, user_id: str, entity: str) -> List[dict]:
        """Find relationships where entity appears as from or to."""
        supabase = get_supabase()
        from_results = (
            supabase.table(self.TABLE).select("*")
            .eq("user_id", user_id).eq("from_entity", entity).execute()
        )
        to_results = (
            supabase.table(self.TABLE).select("*")
            .eq("user_id", user_id).eq("to_entity", entity).execute()
        )
        combined = (from_results.data or []) + (to_results.data or [])
        # Deduplicate by id
        seen = set()
        unique = []
        for r in combined:
            if r["id"] not in seen:
                seen.add(r["id"])
                unique.append(r)
        return unique

    def delete(self, rel_id: str) -> bool:
        supabase = get_supabase()
        supabase.table(self.TABLE).delete().eq("id", rel_id).execute()
        return True

    def delete_by_user(self, user_id: str) -> None:
        supabase = get_supabase()
        supabase.table(self.TABLE).delete().eq("user_id", user_id).execute()

    def count_by_user(self, user_id: str) -> int:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).select("id", count="exact").eq("user_id", user_id).execute()
        return result.count or 0


# Singleton
relationship_repository = RelationshipRepository()
