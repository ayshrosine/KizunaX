"""
Skill repository — Supabase Postgres.
"""
from typing import Optional, List
from app.core.supabase_client import get_supabase


class SkillRepository:
    TABLE = "skills"

    def create(self, data: dict) -> dict:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).insert(data).execute()
        return result.data[0] if result.data else {}

    def find_by_id(self, skill_id: str) -> Optional[dict]:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).select("*").eq("id", skill_id).single().execute()
        return result.data

    def find_by_user_id(self, user_id: str) -> List[dict]:
        supabase = get_supabase()
        result = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("user_id", user_id)
            .order("name")
            .execute()
        )
        return result.data or []

    def find_by_normalized_name(self, user_id: str, normalized_name: str) -> Optional[dict]:
        supabase = get_supabase()
        result = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("user_id", user_id)
            .eq("normalized_name", normalized_name)
            .maybe_single()
            .execute()
        )
        return result.data

    def upsert_skill(self, user_id: str, name: str, source_document_id: str = None, confidence: float = None) -> dict:
        """Insert or update a skill for a user."""
        normalized = name.lower().strip()
        existing = self.find_by_normalized_name(user_id, normalized)
        if existing:
            doc_ids = existing.get("source_document_ids", []) or []
            if source_document_id and source_document_id not in doc_ids:
                doc_ids.append(source_document_id)
            return self.update(existing["id"], {"source_document_ids": doc_ids})
        else:
            data = {
                "user_id": user_id,
                "name": name,
                "normalized_name": normalized,
                "source_document_ids": [source_document_id] if source_document_id else [],
                "confidence_score": confidence,
            }
            return self.create(data)

    def update(self, skill_id: str, update_data: dict) -> Optional[dict]:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).update(update_data).eq("id", skill_id).execute()
        return result.data[0] if result.data else None

    def delete(self, skill_id: str) -> bool:
        supabase = get_supabase()
        supabase.table(self.TABLE).delete().eq("id", skill_id).execute()
        return True

    def count_by_user(self, user_id: str) -> int:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).select("id", count="exact").eq("user_id", user_id).execute()
        return result.count or 0


# Singleton
skill_repository = SkillRepository()
