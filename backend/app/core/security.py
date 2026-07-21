"""
Security module — validates Supabase Auth JWTs.
No more local password hashing; Supabase handles signup/login/tokens.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings
from app.core.supabase_client import get_supabase
from app.models.schemas import UserInfo

# We use HTTPBearer so the frontend sends "Authorization: Bearer <supabase_access_token>"
security_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> UserInfo:
    """
    Validate the Supabase access token and return a lightweight UserInfo.
    The Supabase client's auth.get_user() hits Supabase's /auth/v1/user
    endpoint, which checks the JWT signature server-side.
    """
    token = credentials.credentials
    try:
        supabase = get_supabase()
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        return UserInfo(
            id=user.id,
            email=user.email,
            full_name=user.user_metadata.get("full_name"),
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Auth error in get_current_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {e}",
        )


async def get_current_active_user(
    current_user: UserInfo = Depends(get_current_user),
) -> UserInfo:
    """Alias kept for backward-compatibility with route signatures."""
    return current_user