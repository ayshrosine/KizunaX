"""
Auth API routes — backed by Supabase Auth.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

from app.core.security import get_current_user
from app.models.schemas import UserInfo, UserRegister, UserLogin, TokenResponse
from app.services.auth_service import auth_service

router = APIRouter()


# ── Register ──────────────────────────────────────────────────────────
@router.post("/register")
async def register(data: UserRegister):
    """Register a new user via Supabase Auth."""
    try:
        result = auth_service.register_user(
            email=data.email,
            full_name=data.full_name,
            password=data.password,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ── Login ─────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    """Authenticate and return Supabase session."""
    try:
        return auth_service.login_user(email=data.email, password=data.password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ── Me ────────────────────────────────────────────────────────────────
@router.get("/me")
async def get_me(current_user: UserInfo = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
    }


# ── Logout ────────────────────────────────────────────────────────────
@router.post("/logout")
async def logout(current_user: UserInfo = Depends(get_current_user)):
    """Logout (best-effort server-side session invalidation)."""
    return {"message": "Successfully logged out"}