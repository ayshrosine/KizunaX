"""
Supabase client initialization — replaces the old mongodb.py module.
Provides a single global Supabase client used by all repositories.
"""
from supabase import create_client, Client
from app.core.config import settings

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Return the global Supabase client, creating it on first call."""
    global _supabase_client
    if _supabase_client is None:
        supabase_url = settings.SUPABASE_URL
        # Prioritize SECRET_KEY for backend admin operations, fallback to PUBLISHABLE_KEY or KEY
        supabase_key = settings.SUPABASE_SECRET_KEY or settings.SUPABASE_PUBLISHABLE_KEY or settings.SUPABASE_KEY
        
        if not supabase_url or not supabase_key:
            raise RuntimeError(
                "SUPABASE_URL and a SUPABASE key must be set in .env"
            )
        _supabase_client = create_client(supabase_url, supabase_key)
        print(f"[OK] Supabase client connected to {supabase_url}")
    return _supabase_client
