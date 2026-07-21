"""
Timeline event repository — Supabase Postgres.
"""
from typing import Optional, List
from app.core.supabase_client import get_supabase


class TimelineEventRepository:
    TABLE = "timeline_events"

    def create(self, data: dict) -> dict:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).insert(data).execute()
        return result.data[0] if result.data else {}

    def find_by_user_id(self, user_id: str) -> List[dict]:
        supabase = get_supabase()
        result = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("user_id", user_id)
            .order("year", desc=True)
            .execute()
        )
        return result.data or []

    def find_by_id(self, event_id: str) -> Optional[dict]:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).select("*").eq("id", event_id).single().execute()
        return result.data

    def update(self, event_id: str, update_data: dict) -> Optional[dict]:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).update(update_data).eq("id", event_id).execute()
        return result.data[0] if result.data else None

    def delete(self, event_id: str) -> bool:
        supabase = get_supabase()
        supabase.table(self.TABLE).delete().eq("id", event_id).execute()
        return True

    def count_by_user(self, user_id: str) -> int:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).select("id", count="exact").eq("user_id", user_id).execute()
        return result.count or 0


# Singleton
timeline_event_repository = TimelineEventRepository()
