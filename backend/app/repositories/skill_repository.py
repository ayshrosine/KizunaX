from typing import Optional, List
from beanie import PydanticObjectId
from datetime import datetime

from app.models.mongodb_models import Skill

class SkillRepository:
    """Repository for Skill model - MongoDB operations only"""
    
    async def create(self, skill_data: dict) -> Skill:
        """Create a new skill"""
        skill = Skill(**skill_data)
        await skill.save()
        return skill
    
    async def find_by_id(self, skill_id: str) -> Optional[Skill]:
        """Find skill by ID"""
        return await Skill.get(PydanticObjectId(skill_id))
    
    async def find_by_user_id(self, user_id: str, skip: int = 0, limit: int = 100) -> List[Skill]:
        """Find skills by user ID with pagination"""
        return await Skill.find(
            Skill.user_id == user_id
        ).skip(skip).limit(limit).sort("-updated_at").to_list()
    
    async def find_by_user_and_name(self, user_id: str, normalized_name: str) -> Optional[Skill]:
        """Find skill by user ID and normalized name"""
        return await Skill.find_one(
            Skill.user_id == user_id,
            Skill.normalized_name == normalized_name.lower().strip()
        )
    
    async def find_with_evidence(self, user_id: str, skip: int = 0, limit: int = 100) -> List[Skill]:
        """Find skills with evidence (has_evidence = True)"""
        return await Skill.find(
            Skill.user_id == user_id,
            Skill.has_evidence == True
        ).skip(skip).limit(limit).sort("-updated_at").to_list()
    
    async def find_on_resume(self, user_id: str, skip: int = 0, limit: int = 100) -> List[Skill]:
        """Find skills that appear on resume"""
        return await Skill.find(
            Skill.user_id == user_id,
            Skill.on_resume == True
        ).skip(skip).limit(limit).sort("-updated_at").to_list()
    
    async def update(self, skill_id: str, update_data: dict) -> Optional[Skill]:
        """Update skill by ID"""
        skill = await Skill.get(PydanticObjectId(skill_id))
        if skill:
            for key, value in update_data.items():
                setattr(skill, key, value)
            skill.updated_at = datetime.utcnow()
            await skill.save()
        return skill
    
    async def add_source_document(self, skill_id: str, document_id: str) -> Optional[Skill]:
        """Add a source document to a skill"""
        skill = await Skill.get(PydanticObjectId(skill_id))
        if skill and document_id not in skill.source_document_ids:
            skill.source_document_ids.append(document_id)
            skill.has_evidence = True
            skill.updated_at = datetime.utcnow()
            await skill.save()
        return skill
    
    async def remove_source_document(self, skill_id: str, document_id: str) -> Optional[Skill]:
        """Remove a source document from a skill"""
        skill = await Skill.get(PydanticObjectId(skill_id))
        if skill and document_id in skill.source_document_ids:
            skill.source_document_ids.remove(document_id)
            skill.has_evidence = len(skill.source_document_ids) > 0
            skill.updated_at = datetime.utcnow()
            await skill.save()
        return skill
    
    async def delete(self, skill_id: str) -> bool:
        """Delete skill by ID"""
        skill = await Skill.get(PydanticObjectId(skill_id))
        if skill:
            await skill.delete()
            return True
        return False
    
    async def count_by_user(self, user_id: str) -> int:
        """Count skills by user ID"""
        return await Skill.find(Skill.user_id == user_id).count()
    
    async def count_with_evidence(self, user_id: str) -> int:
        """Count skills with evidence by user ID"""
        return await Skill.find(
            Skill.user_id == user_id,
            Skill.has_evidence == True
        ).count()
    
    async def upsert_by_name(self, user_id: str, name: str, document_id: str, confidence: float = None) -> Skill:
        """Upsert skill by name - create if doesn't exist, update if does"""
        normalized_name = name.lower().strip()
        skill = await self.find_by_user_and_name(user_id, normalized_name)
        
        if skill:
            # Update existing skill
            if document_id not in skill.source_document_ids:
                skill.source_document_ids.append(document_id)
                skill.has_evidence = True
            if confidence is not None and (skill.confidence_score is None or confidence > skill.confidence_score):
                skill.confidence_score = confidence
            skill.updated_at = datetime.utcnow()
            await skill.save()
        else:
            # Create new skill
            skill_data = {
                "user_id": user_id,
                "name": name,
                "normalized_name": normalized_name,
                "source_document_ids": [document_id],
                "has_evidence": True,
                "confidence_score": confidence
            }
            skill = await self.create(skill_data)
        
        return skill

# Singleton instance
skill_repository = SkillRepository()
