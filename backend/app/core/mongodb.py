from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from typing import Optional
import asyncio

from app.core.config import settings
from app.models.mongodb_models import (
    User, Document, Skill, Relationship, TimelineEvent, 
    Notification, ActivityLog, PortfolioSettings, Session,
    Integration
)

# Global MongoDB client
mongodb_client: Optional[AsyncIOMotorClient] = None

async def get_mongodb_client() -> AsyncIOMotorClient:
    """Get or create MongoDB client"""
    global mongodb_client
    if mongodb_client is None:
        mongodb_client = AsyncIOMotorClient(settings.MONGODB_URI)
    return mongodb_client

async def init_mongodb():
    """Initialize MongoDB connection and Beanie ODM"""
    try:
        client = await get_mongodb_client()
        
        # Test connection
        await client.admin.command('ping')
        print(f"[OK] MongoDB connected successfully to {settings.MONGODB_DATABASE_NAME}")
        
        # Initialize Beanie with all models
        await init_beanie(
            database=client[settings.MONGODB_DATABASE_NAME],
            document_models=[
                User, Document, Skill, Relationship, TimelineEvent, 
                Notification, ActivityLog, PortfolioSettings, Session,
                Integration
            ]
        )
        
        print(f"[OK] Beanie ODM initialized with models")
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        print(f"[ERROR] MongoDB connection failed: {e}")
        raise

async def create_indexes():
    """Create database indexes for better query performance"""
    try:
        # User indexes - using Beanie's indexed field decorator in model
        # Indexes are automatically created by Beanie based on model definitions
        print("[OK] MongoDB indexes will be created automatically by Beanie")
        
    except Exception as e:
        print(f"[ERROR] Index creation failed: {e}")

async def close_mongodb():
    """Close MongoDB connection"""
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        mongodb_client = None
        print("MongoDB connection closed")

async def get_database():
    """Get MongoDB database instance"""
    client = await get_mongodb_client()
    return client[settings.MONGODB_DATABASE_NAME]
