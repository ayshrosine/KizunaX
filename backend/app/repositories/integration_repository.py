"""
Integration repository — Supabase Postgres.
"""
from typing import Optional, List
from app.core.supabase_client import get_supabase


class IntegrationRepository:
    TABLE = "integrations"

    def create(self, data: dict) -> dict:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).insert(data).execute()
        return result.data[0] if result.data else {}

    def find_by_user_and_provider(self, user_id: str, provider: str) -> Optional[dict]:
        supabase = get_supabase()
        result = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("user_id", user_id)
            .eq("provider", provider)
            .maybe_single()
            .execute()
        )
        return result.data

    def update(self, integration_id: str, update_data: dict) -> Optional[dict]:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).update(update_data).eq("id", integration_id).execute()
        return result.data[0] if result.data else None

    def delete(self, integration_id: str) -> bool:
        supabase = get_supabase()
        supabase.table(self.TABLE).delete().eq("id", integration_id).execute()
        return True

    def find_by_user_id(self, user_id: str) -> List[dict]:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).select("*").eq("user_id", user_id).execute()
        return result.data or []


# Singleton
integration_repository = IntegrationRepository()
