from typing import Optional
from app.core.supabase_client import get_supabase

class PortfolioRepository:
    TABLE = "portfolio_settings"

    def find_by_user_id(self, user_id: str) -> Optional[dict]:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).select("*").eq("user_id", user_id).maybe_single().execute()
        return result.data

    def find_by_username(self, username: str) -> Optional[dict]:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).select("*").eq("username", username).maybe_single().execute()
        return result.data

    def upsert(self, data: dict) -> dict:
        supabase = get_supabase()
        result = supabase.table(self.TABLE).upsert(data).execute()
        return result.data[0] if result.data else {}

portfolio_repository = PortfolioRepository()
