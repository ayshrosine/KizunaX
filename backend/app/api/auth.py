from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from pydantic import BaseModel, EmailStr, Field

from app.models.mongodb_models import User
from app.core.security import get_current_active_user
from app.services.auth_service import auth_service

router = APIRouter()

# Pydantic models for requests/responses
class UserRegister(BaseModel):
    email: EmailStr = Field(..., min_length=3, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6)
    institution: str = Field(None, max_length=200)

class UserLogin(BaseModel):
    email: EmailStr = Field(..., min_length=3, max_length=100)
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str
    email_verified: bool
    institution: Optional[str] = None
    created_at: str

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegister):
    """Register a new user"""
    try:
        user = await auth_service.register_user(
            email=user_data.email,
            full_name=user_data.full_name,
            password=user_data.password,
            institution=user_data.institution
        )
        
        return UserResponse(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role.value,
            email_verified=user.email_verified,
            institution=user.institution,
            created_at=user.created_at.isoformat()
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """Authenticate user and return access token"""
    try:
        return await auth_service.login_user(
            email=user_credentials.email,
            password=user_credentials.password
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information"""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        email_verified=current_user.email_verified,
        institution=current_user.institution,
        created_at=current_user.created_at.isoformat()
    )

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    """Logout user (client-side token deletion)"""
    # In a stateless JWT system, logout is handled client-side
    # You might want to implement a token blacklist for server-side logout
    return {"message": "Successfully logged out"}