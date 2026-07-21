"""
Activity log repository — Supabase Postgres.
"""
from typing import List
from app.core.supabase_client import get_supabase


class ActivityLogRepository:
    TABLE = "activity_logs"

    def create(self, data: dict) -> dict:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).insert(data).execute()
        return result.data[0] if result.data else {}

    def find_by_user_id(self, user_id: str, skip: int = 0, limit: int = 50) -> List[dict]:
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


# Singleton
activity_log_repository = ActivityLogRepository()
