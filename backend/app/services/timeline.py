from typing import List, Dict, Optional
from datetime import datetime
from app.models.mongodb_models import Document, DocumentCategory
from app.repositories.document_repository import document_repository
from app.repositories.timeline_event_repository import timeline_event_repository

def _map_category_to_event_type(category: str) -> str:
    """Map document category to timeline event type"""
    mapping = {
        "Certifications": "certification",
        "Projects": "project",
        "Internships": "internship",
        "Achievements": "achievement",
        "Academics": "academic",
        "Skills": "skill"
    }
    return mapping.get(category, "other")

def _calculate_importance(document: Document) -> float:
    """Calculate importance score for timeline display"""
    base_score = 1.0

    # Boost certain categories
    if document.category and document.category.value in ["Certifications", "Achievements"]:
        base_score += 0.5
    elif document.category and document.category.value == "Projects":
        base_score += 0.3

    # Boost if has organization
    if document.extracted_fields and document.extracted_fields.organization:
        base_score += 0.2

    # Boost based on categorization confidence
    if document.category_confidence:
        base_score *= document.category_confidence

    return min(base_score, 2.0)  # Cap at 2.0

def _group_by_year(events: List[Dict]) -> Dict:
    """Group timeline events by year"""
    grouped = {}

    for event in events:
        try:
            date = datetime.fromisoformat(event["event_date"])
            year = date.year

            if year not in grouped:
                grouped[year] = []

            grouped[year].append(event)
        except:
            # If date parsing fails, skip grouping for this event
            pass

    return grouped

async def generate_timeline(user_id: str):
    """Generate digital journey timeline from all documents for a user"""
    try:
        # Get all indexed documents for user
        documents = await document_repository.get_indexed_documents(user_id)

        timeline_events = []

        for doc in documents:
            # Use extracted_fields.issue_date if available, otherwise use created_at
            event_date = doc.extracted_fields.issue_date if doc.extracted_fields and doc.extracted_fields.issue_date else doc.created_at

            # Determine event type based on category
            event_type = _map_category_to_event_type(doc.category.value if doc.category else "other")

            # Create timeline event
            event = {
                "document_id": str(doc.id),
                "event_type": event_type,
                "title": doc.filename,
                "description": doc.extracted_fields.issuer if doc.extracted_fields else None,
                "event_date": event_date.isoformat(),
                "end_date": None,
                "category": doc.category.value if doc.category else "other",
                "organization": doc.extracted_fields.organization if doc.extracted_fields else None,
                "importance": _calculate_importance(doc)
            }

            timeline_events.append(event)

        # Sort by date
        timeline_events.sort(key=lambda x: x["event_date"])

        # Group by year
        grouped_timeline = _group_by_year(timeline_events)

        return {
            "events": timeline_events,
            "grouped": grouped_timeline,
            "total_events": len(timeline_events)
        }

    except Exception as e:
        print(f"Error generating timeline: {e}")
        return {"events": [], "grouped": {}, "total_events": 0}