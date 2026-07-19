from typing import Optional, List
from beanie import PydanticObjectId

from app.models.mongodb_models import Integration, IntegrationProvider

class IntegrationRepository:
    """Repository for Integration model - MongoDB operations only"""
    
    async def create(self, integration_data: dict) -> Integration:
        """Create a new integration"""
        integration = Integration(**integration_data)
        await integration.save()
        return integration
    
    async def find_by_id(self, integration_id: str) -> Optional[Integration]:
        """Find integration by ID"""
        return await Integration.get(PydanticObjectId(integration_id))
    
    async def find_by_user_id(self, user_id: str) -> List[Integration]:
        """Find integrations by user ID"""
        return await Integration.find(Integration.user_id == user_id).to_list()
    
    async def find_by_user_and_provider(self, user_id: str, provider: IntegrationProvider) -> Optional[Integration]:
        """Find integration by user ID and provider"""
        return await Integration.find_one(
            Integration.user_id == user_id,
            Integration.provider == provider
        )
    
    async def update(self, integration_id: str, update_data: dict) -> Optional[Integration]:
        """Update integration details"""
        integration = await Integration.get(PydanticObjectId(integration_id))
        if integration:
            for key, value in update_data.items():
                setattr(integration, key, value)
            await integration.save()
        return integration
        
    async def delete(self, integration_id: str) -> bool:
        """Delete integration"""
        integration = await Integration.get(PydanticObjectId(integration_id))
        if integration:
            await integration.delete()
            return True
        return False

integration_repository = IntegrationRepository()
