"""
Notification repository — Supabase Postgres.
"""
from typing import Optional, List
from app.core.supabase_client import get_supabase


class NotificationRepository:
    TABLE = "notifications"

    def create(self, data: dict) -> dict:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).insert(data).execute()
        return result.data[0] if result.data else {}

    def find_by_user_id(self, user_id: str, skip: int = 0, limit: int = 100) -> List[dict]:
        supabase = get_supabase()
        result = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .range(skip, skip + limit - 1)
            .execute()
        )
        return result.data or []

    def find_unread(self, user_id: str, limit: int = 100) -> List[dict]:
        supabase = get_supabase()
        result = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("user_id", user_id)
            .eq("read", False)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    def mark_as_read(self, notification_id: str) -> Optional[dict]:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).update({"read": True}).eq("id", notification_id).execute()
        return result.data[0] if result.data else None

    def mark_all_as_read(self, user_id: str) -> int:
        supabase = get_supabase()
        result = (
            supabase.table(self.TABLE)
            .update({"read": True})
            .eq("user_id", user_id)
            .eq("read", False)
            .execute()
        )
        return len(result.data) if result.data else 0

    def delete(self, notification_id: str) -> bool:
        supabase = get_supabase()
        supabase.table(self.TABLE).delete().eq("id", notification_id).execute()
        return True

    def count_unread(self, user_id: str) -> int:
        supabase = get_supabase()
        result = (
            supabase.table(self.TABLE)
            .select("id", count="exact")
            .eq("user_id", user_id)
            .eq("read", False)
            .execute()
        )
        return result.count or 0


# Singleton
notification_repository = NotificationRepository()
