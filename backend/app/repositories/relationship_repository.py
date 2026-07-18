from typing import Optional, List
from beanie import PydanticObjectId

from app.models.mongodb_models import Relationship, RelationshipType

class RelationshipRepository:
    """Repository for Relationship model - MongoDB operations only"""
    
    async def create(self, relationship_data: dict) -> Relationship:
        """Create a new relationship"""
        relationship = Relationship(**relationship_data)
        await relationship.save()
        return relationship
    
    async def find_by_id(self, relationship_id: str) -> Optional[Relationship]:
        """Find relationship by ID"""
        return await Relationship.get(PydanticObjectId(relationship_id))
    
    async def find_by_user_id(self, user_id: str, skip: int = 0, limit: int = 100) -> List[Relationship]:
        """Find relationships by user ID with pagination"""
        return await Relationship.find(
            Relationship.user_id == user_id
        ).skip(skip).limit(limit).sort("-created_at").to_list()
    
    async def find_by_source(self, user_id: str, source_type: str, source_id: str) -> List[Relationship]:
        """Find relationships by source"""
        return await Relationship.find(
            Relationship.user_id == user_id,
            Relationship.source_type == source_type,
            Relationship.source_id == source_id
        ).to_list()
    
    async def find_by_target(self, user_id: str, target_type: str, target_id: str) -> List[Relationship]:
        """Find relationships by target"""
        return await Relationship.find(
            Relationship.user_id == user_id,
            Relationship.target_type == target_type,
            Relationship.target_id == target_id
        ).to_list()
    
    async def find_by_type(self, user_id: str, relationship_type: RelationshipType, skip: int = 0, limit: int = 100) -> List[Relationship]:
        """Find relationships by type"""
        return await Relationship.find(
            Relationship.user_id == user_id,
            Relationship.relationship_type == relationship_type
        ).skip(skip).limit(limit).sort("-created_at").to_list()
    
    async def find_strong_relationships(self, user_id: str, min_strength: float = 0.7, skip: int = 0, limit: int = 100) -> List[Relationship]:
        """Find relationships with strength above threshold"""
        return await Relationship.find(
            Relationship.user_id == user_id,
            Relationship.strength >= min_strength
        ).skip(skip).limit(limit).sort("-strength").to_list()
    
    async def find_ai_generated(self, user_id: str, skip: int = 0, limit: int = 100) -> List[Relationship]:
        """Find AI-generated relationships"""
        return await Relationship.find(
            Relationship.user_id == user_id,
            Relationship.ai_generated == True
        ).skip(skip).limit(limit).sort("-created_at").to_list()
    
    async def update(self, relationship_id: str, update_data: dict) -> Optional[Relationship]:
        """Update relationship by ID"""
        relationship = await Relationship.get(PydanticObjectId(relationship_id))
        if relationship:
            for key, value in update_data.items():
                setattr(relationship, key, value)
            await relationship.save()
        return relationship
    
    async def delete(self, relationship_id: str) -> bool:
        """Delete relationship by ID"""
        relationship = await Relationship.get(PydanticObjectId(relationship_id))
        if relationship:
            await relationship.delete()
            return True
        return False
    
    async def delete_by_source(self, user_id: str, source_type: str, source_id: str) -> int:
        """Delete all relationships for a source"""
        relationships = await self.find_by_source(user_id, source_type, source_id)
        for rel in relationships:
            await rel.delete()
        return len(relationships)
    
    async def count_by_user(self, user_id: str) -> int:
        """Count relationships by user ID"""
        return await Relationship.count(Relationship.user_id == user_id)
    
    async def count_by_type(self, user_id: str, relationship_type: RelationshipType) -> int:
        """Count relationships by type"""
        return await Relationship.count(
            Relationship.user_id == user_id,
            Relationship.relationship_type == relationship_type
        )

# Singleton instance
relationship_repository = RelationshipRepository()
