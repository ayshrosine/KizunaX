from typing import Optional, List
from beanie import PydanticObjectId

from app.models.mongodb_models import ActivityLog, ActionType

class ActivityLogRepository:
    """Repository for ActivityLog model - MongoDB operations only"""
    
    async def create(self, log_data: dict) -> ActivityLog:
        """Create a new activity log"""
        log = ActivityLog(**log_data)
        await log.save()
        return log
    
    async def find_by_id(self, log_id: str) -> Optional[ActivityLog]:
        """Find activity log by ID"""
        return await ActivityLog.get(PydanticObjectId(log_id))
    
    async def find_by_user_id(self, user_id: str, skip: int = 0, limit: int = 100) -> List[ActivityLog]:
        """Find activity logs by user ID with pagination"""
        return await ActivityLog.find(
            ActivityLog.user_id == user_id
        ).skip(skip).limit(limit).sort("-created_at").to_list()
    
    async def find_by_action(self, user_id: str, action: ActionType, skip: int = 0, limit: int = 100) -> List[ActivityLog]:
        """Find activity logs by action type"""
        return await ActivityLog.find(
            ActivityLog.user_id == user_id,
            ActivityLog.action == action
        ).skip(skip).limit(limit).sort("-created_at").to_list()
    
    async def find_by_target(self, user_id: str, target_type: str, target_id: str, skip: int = 0, limit: int = 100) -> List[ActivityLog]:
        """Find activity logs by target"""
        return await ActivityLog.find(
            ActivityLog.user_id == user_id,
            ActivityLog.target_type == target_type,
            ActivityLog.target_id == target_id
        ).skip(skip).limit(limit).sort("-created_at").to_list()
    
    async def delete(self, log_id: str) -> bool:
        """Delete activity log by ID"""
        log = await ActivityLog.get(PydanticObjectId(log_id))
        if log:
            await log.delete()
            return True
        return False
    
    async def delete_old_logs(self, days: int = 365) -> int:
        """Delete activity logs older than specified days (for cleanup)"""
        from datetime import datetime, timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        logs = await ActivityLog.find(
            ActivityLog.created_at < cutoff_date
        ).to_list()
        count = 0
        for log in logs:
            await log.delete()
            count += 1
        return count
    
    async def count_by_user(self, user_id: str) -> int:
        """Count activity logs by user ID"""
        return await ActivityLog.count(ActivityLog.user_id == user_id)
    
    async def count_by_action(self, user_id: str, action: ActionType) -> int:
        """Count activity logs by action type"""
        return await ActivityLog.count(
            ActivityLog.user_id == user_id,
            ActivityLog.action == action
        )

# Singleton instance
activity_log_repository = ActivityLogRepository()
