from typing import Optional, List
from beanie import PydanticObjectId

from app.models.mongodb_models import Notification, NotificationType

class NotificationRepository:
    """Repository for Notification model - MongoDB operations only"""
    
    async def create(self, notification_data: dict) -> Notification:
        """Create a new notification"""
        notification = Notification(**notification_data)
        await notification.save()
        return notification
    
    async def find_by_id(self, notification_id: str) -> Optional[Notification]:
        """Find notification by ID"""
        return await Notification.get(PydanticObjectId(notification_id))
    
    async def find_by_user_id(self, user_id: str, skip: int = 0, limit: int = 100) -> List[Notification]:
        """Find notifications by user ID with pagination"""
        return await Notification.find(
            Notification.user_id == user_id
        ).skip(skip).limit(limit).sort("-created_at").to_list()
    
    async def find_unread(self, user_id: str, skip: int = 0, limit: int = 100) -> List[Notification]:
        """Find unread notifications by user ID"""
        return await Notification.find(
            Notification.user_id == user_id,
            Notification.read == False
        ).skip(skip).limit(limit).sort("-created_at").to_list()
    
    async def find_by_type(self, user_id: str, notification_type: NotificationType, skip: int = 0, limit: int = 100) -> List[Notification]:
        """Find notifications by type"""
        return await Notification.find(
            Notification.user_id == user_id,
            Notification.type == notification_type
        ).skip(skip).limit(limit).sort("-created_at").to_list()
    
    async def mark_as_read(self, notification_id: str) -> Optional[Notification]:
        """Mark notification as read"""
        return await self.update(notification_id, {"read": True})
    
    async def mark_all_as_read(self, user_id: str) -> int:
        """Mark all notifications for a user as read"""
        notifications = await self.find_unread(user_id)
        count = 0
        for notification in notifications:
            await self.mark_as_read(str(notification.id))
            count += 1
        return count
    
    async def update(self, notification_id: str, update_data: dict) -> Optional[Notification]:
        """Update notification by ID"""
        notification = await Notification.get(PydanticObjectId(notification_id))
        if notification:
            for key, value in update_data.items():
                setattr(notification, key, value)
            await notification.save()
        return notification
    
    async def delete(self, notification_id: str) -> bool:
        """Delete notification by ID"""
        notification = await Notification.get(PydanticObjectId(notification_id))
        if notification:
            await notification.delete()
            return True
        return False
    
    async def delete_old(self, user_id: str, days: int = 30) -> int:
        """Delete notifications older than specified days"""
        from datetime import datetime, timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        notifications = await Notification.find(
            Notification.user_id == user_id,
            Notification.created_at < cutoff_date
        ).to_list()
        count = 0
        for notification in notifications:
            await notification.delete()
            count += 1
        return count
    
    async def count_by_user(self, user_id: str) -> int:
        """Count notifications by user ID"""
        return await Notification.find(Notification.user_id == user_id).count()
    
    async def count_unread(self, user_id: str) -> int:
        """Count unread notifications by user ID"""
        return await Notification.find(
            Notification.user_id == user_id,
            Notification.read == False
        ).count()

# Singleton instance
notification_repository = NotificationRepository()
