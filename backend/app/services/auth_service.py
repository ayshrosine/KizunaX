"""
Authentication service — wraps Supabase Auth for signup/login/logout.
"""
from typing import Optional

from app.core.supabase_client import get_supabase


class AuthService:
    """Thin wrapper around Supabase Auth."""

    def register_user(self, email: str, full_name: str, password: str) -> dict:
        """Register a new user via Supabase Auth."""
        supabase = get_supabase()
        response = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "full_name": full_name,
                }
            }
        })

        if response.user is None:
            raise ValueError("Registration failed — check your Supabase project settings.")

        return {
            "id": response.user.id,
            "email": response.user.email,
            "full_name": full_name,
        }

    def login_user(self, email: str, password: str) -> dict:
        """Authenticate user and return Supabase session tokens."""
        supabase = get_supabase()
        response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password,
        })

        if response.user is None or response.session is None:
            raise ValueError("Invalid email or password")

        user_meta = response.user.user_metadata or {}
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "token_type": "bearer",
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "full_name": user_meta.get("full_name", ""),
            }
        }

    def logout_user(self, access_token: str) -> None:
        """Sign out via Supabase (invalidates the refresh token server-side)."""
        try:
            supabase = get_supabase()
            # Note: sign_out invalidates the current session on Supabase's side
            supabase.auth.sign_out()
        except Exception:
            pass  # Best-effort; client should also discard the token


# Singleton
auth_service = AuthService()
