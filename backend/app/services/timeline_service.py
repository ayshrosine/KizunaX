from typing import Optional, List, Dict
from datetime import datetime
from beanie import PydanticObjectId

from app.repositories.document_repository import document_repository
from app.repositories.timeline_event_repository import timeline_event_repository
from app.models.mongodb_models import Document, DocumentStatus, DocumentCategory

class TimelineService:
    """Timeline service - business logic for timeline operations"""
    
    async def generate_timeline(self, user_id: str) -> Dict:
        """Generate timeline from user's indexed documents"""
        # Get all indexed documents
        documents = await document_repository.get_indexed_documents(user_id)
        
        timeline_events = []
        
        for doc in documents:
            # Extract year from document date or upload date
            if doc.document_date:
                year = doc.document_date.year
                month = doc.document_date.month
            else:
                year = doc.created_at.year
                month = doc.created_at.month
            
            # Map category to timeline category
            category = doc.category.value if doc.category else "General"
            
            timeline_events.append({
                "year": year,
                "month": month,
                "title": doc.filename,
                "category": category,
                "document_id": str(doc.id),
                "description": doc.extracted_text[:200] if doc.extracted_text else "No description available"
            })
        
        # Sort by date
        timeline_events.sort(key=lambda x: (x["year"], x["month"] or 0))
        
        # Group by year
        grouped = {}
        for event in timeline_events:
            year = event["year"]
            if year not in grouped:
                grouped[year] = []
            grouped[year].append(event)
        
        return {
            "events": timeline_events,
            "grouped": grouped,
            "total_events": len(timeline_events)
        }
    
    async def save_timeline_events(self, user_id: str) -> int:
        """Save timeline events to database"""
        timeline_data = await self.generate_timeline(user_id)
        
        # Clear existing timeline events for user
        # Note: Need to implement timeline_event_repository first
        # For now, return the count
        
        return timeline_data["total_events"]
    
    async def get_persisted_timeline(self, user_id: str) -> Dict:
        """Get persisted timeline from database"""
        # Note: Need to implement timeline_event_repository first
        return await self.generate_timeline(user_id)

# Singleton instance
timeline_service = TimelineService()
