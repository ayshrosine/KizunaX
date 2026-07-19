import pytest
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.core.config import settings
from app.models.mongodb_models import (
    User, Document, Skill, Relationship, TimelineEvent, 
    Notification, ActivityLog, PortfolioSettings, Session,
    Integration
)

# Pytest configuration file

@pytest.fixture(autouse=True)
async def init_db():
    # Force use of a test database name
    settings.MONGODB_DATABASE_NAME = "identityvault_test"
    # Ensure a fallback URI if not configured
    if not settings.MONGODB_URI:
        settings.MONGODB_URI = "mongodb://localhost:27017"
        
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    
    # Initialize Beanie
    await init_beanie(
        database=client[settings.MONGODB_DATABASE_NAME],
        document_models=[
            User, Document, Skill, Relationship, TimelineEvent, 
            Notification, ActivityLog, PortfolioSettings, Session,
            Integration
        ]
    )
    
    yield
    
    # Clean up test database
    await client.drop_database(settings.MONGODB_DATABASE_NAME)
    client.close()
