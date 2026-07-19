from typing import Optional
from datetime import datetime, timedelta

from app.repositories.user_repository import user_repository
from app.models.mongodb_models import User, AuthProvider
from app.core.security import get_password_hash, verify_password, create_access_token

class AuthService:
    """Authentication service - business logic for auth operations"""
    
    async def register_user(self, email: str, full_name: str, password: str, institution: str = None) -> User:
        """Register a new user"""
        # Check if email already exists
        existing_user = await user_repository.find_by_email(email)
        if existing_user:
            raise ValueError("Email already registered")
        
        # Create new user
        user_data = {
            "full_name": full_name,
            "email": email,
            "password_hash": get_password_hash(password),
            "auth_provider": AuthProvider.LOCAL,
            "institution": institution,
            "email_verified": True,
        }
        
        user = await user_repository.create(user_data)
        return user
    
    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = await user_repository.find_by_email(email)
        if not user:
            return None
        
        # Handle both old schema (hashed_password) and new schema (password_hash)
        password_hash = getattr(user, 'password_hash', None) or getattr(user, 'hashed_password', None)
        if not password_hash:
            return None
        
        if not verify_password(password, password_hash):
            return None
        
        # Update last login
        await user_repository.update_last_login(str(user.id))
        
        return user
    
    async def login_user(self, email: str, password: str) -> dict:
        """Login user and return access token"""
        user = await self.authenticate_user(email, password)
        if not user:
            raise ValueError("Invalid email or password")
        
        if not user.email_verified:
            raise ValueError("Email not verified")
        
        # Create access token
        access_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=timedelta(days=30)
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role.value
            }
        }
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        return await user_repository.find_by_id(user_id)
    
    async def verify_user_email(self, user_id: str) -> None:
        """Verify user's email"""
        await user_repository.verify_email(user_id)
    
    async def update_user_profile(self, user_id: str, update_data: dict) -> Optional[User]:
        """Update user profile"""
        # Remove sensitive fields that shouldn't be updated directly
        sensitive_fields = ["password_hash", "auth_provider", "google_id", "role", "email_verified"]
        for field in sensitive_fields:
            update_data.pop(field, None)
        
        return await user_repository.update(user_id, update_data)

# Singleton instance
auth_service = AuthService()
