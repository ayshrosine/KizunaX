from typing import Optional, List
from beanie import PydanticObjectId

from app.models.mongodb_models import TimelineEvent

class TimelineEventRepository:
    """Repository for TimelineEvent model - MongoDB operations only"""
    
    async def create(self, event_data: dict) -> TimelineEvent:
        """Create a new timeline event"""
        event = TimelineEvent(**event_data)
        await event.save()
        return event
    
    async def find_by_id(self, event_id: str) -> Optional[TimelineEvent]:
        """Find timeline event by ID"""
        return await TimelineEvent.get(PydanticObjectId(event_id))
    
    async def find_by_user_id(self, user_id: str, skip: int = 0, limit: int = 100) -> List[TimelineEvent]:
        """Find timeline events by user ID with pagination"""
        return await TimelineEvent.find(
            TimelineEvent.user_id == user_id
        ).skip(skip).limit(limit).sort("-created_at").to_list()
    
    async def find_by_year(self, user_id: str, year: int, skip: int = 0, limit: int = 100) -> List[TimelineEvent]:
        """Find timeline events by user ID and year"""
        return await TimelineEvent.find(
            TimelineEvent.user_id == user_id,
            TimelineEvent.year == year
        ).skip(skip).limit(limit).sort("-created_at").to_list()
    
    async def find_by_document_id(self, document_id: str) -> List[TimelineEvent]:
        """Find timeline events by document ID"""
        return await TimelineEvent.find(
            TimelineEvent.document_id == document_id
        ).to_list()
    
    async def update(self, event_id: str, update_data: dict) -> Optional[TimelineEvent]:
        """Update timeline event by ID"""
        event = await TimelineEvent.get(PydanticObjectId(event_id))
        if event:
            for key, value in update_data.items():
                setattr(event, key, value)
            await event.save()
        return event
    
    async def delete(self, event_id: str) -> bool:
        """Delete timeline event by ID"""
        event = await TimelineEvent.get(PydanticObjectId(event_id))
        if event:
            await event.delete()
            return True
        return False
    
    async def delete_by_user(self, user_id: str) -> int:
        """Delete all timeline events for a user"""
        events = await self.find_by_user_id(user_id)
        count = 0
        for event in events:
            await event.delete()
            count += 1
        return count
    
    async def count_by_user(self, user_id: str) -> int:
        """Count timeline events by user ID"""
        return await TimelineEvent.count(TimelineEvent.user_id == user_id)

# Singleton instance
timeline_event_repository = TimelineEventRepository()
