"""
User repository — mostly delegated to Supabase Auth.
This thin wrapper exists for any backend-side user queries
beyond what Supabase Auth provides (e.g. admin listing).
"""
from typing import Optional
from app.core.supabase_client import get_supabase


class UserRepository:
    """Lightweight user lookup. Supabase Auth handles create/login/password."""

    def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """Fetch user from Supabase Auth admin API."""
        try:
            supabase = get_supabase()
            response = supabase.auth.admin.get_user_by_id(user_id)
            if response and response.user:
                u = response.user
                return {
                    "id": u.id,
                    "email": u.email,
                    "full_name": (u.user_metadata or {}).get("full_name"),
                    "created_at": str(u.created_at) if u.created_at else None,
                }
            return None
        except Exception:
            return None


# Singleton
user_repository = UserRepository()
