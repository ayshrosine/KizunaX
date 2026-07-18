from typing import Optional, List
from beanie import PydanticObjectId

from app.models.mongodb_models import User, AuthProvider, UserRole

class UserRepository:
    """Repository for User model - MongoDB operations only"""
    
    async def create(self, user_data: dict) -> User:
        """Create a new user"""
        user = User(**user_data)
        await user.save()
        return user
    
    async def find_by_email(self, email: str) -> Optional[User]:
        """Find user by email (case-insensitive)"""
        return await User.find_one(User.email == email.lower())
    
    async def find_by_id(self, user_id: str) -> Optional[User]:
        """Find user by ID"""
        return await User.get(PydanticObjectId(user_id))
    
    async def find_by_google_id(self, google_id: str) -> Optional[User]:
        """Find user by Google ID"""
        return await User.find_one(User.google_id == google_id)
    
    async def update(self, user_id: str, update_data: dict) -> Optional[User]:
        """Update user by ID"""
        user = await User.get(PydanticObjectId(user_id))
        if user:
            for key, value in update_data.items():
                setattr(user, key, value)
            await user.save()
        return user
    
    async def update_last_login(self, user_id: str) -> None:
        """Update user's last login timestamp"""
        from datetime import datetime
        user = await User.get(PydanticObjectId(user_id))
        if user:
            user.last_login_at = datetime.utcnow()
            await user.save()
    
    async def verify_email(self, user_id: str) -> None:
        """Mark user's email as verified"""
        user = await User.get(PydanticObjectId(user_id))
        if user:
            user.email_verified = True
            await user.save()
    
    async def delete(self, user_id: str) -> bool:
        """Delete user by ID (hard delete - use with caution)"""
        user = await User.get(PydanticObjectId(user_id))
        if user:
            await user.delete()
            return True
        return False
    
    async def list_all(self, skip: int = 0, limit: int = 100) -> List[User]:
        """List all users with pagination"""
        return await User.find().skip(skip).limit(limit).to_list()
    
    async def count(self) -> int:
        """Count total users"""
        return await User.count()

# Singleton instance
user_repository = UserRepository()
