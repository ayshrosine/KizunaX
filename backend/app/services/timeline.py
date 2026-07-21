from typing import List, Dict, Optional
from datetime import datetime
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

def _calculate_importance(document: dict) -> float:
    """Calculate importance score for timeline display"""
    base_score = 1.0
    cat = document.get("category")
    
    if cat in ["Certifications", "Achievements"]:
        base_score += 0.5
    elif cat == "Projects":
        base_score += 0.3

    confidence = document.get("category_confidence")
    if confidence:
        base_score *= confidence

    return min(base_score, 2.0)  # Cap at 2.0

def _group_by_year(events: List[Dict]) -> Dict:
    """Group timeline events by year"""
    grouped = {}
    for event in events:
        try:
            date = datetime.fromisoformat(event["event_date"].replace('Z', '+00:00'))
            year = date.year
            if year not in grouped:
                grouped[year] = []
            grouped[year].append(event)
        except Exception as e:
            print(f"[Timeline] Date parse error: {e}")
            pass
    return grouped

async def generate_timeline(user_id: str):
    """Generate digital journey timeline from all documents for a user"""
    try:
        documents = document_repository.get_indexed_documents(user_id)
        timeline_events = []

        for doc in documents:
            # Parse created_at or other event date fields if present
            created_at_str = doc.get("created_at")
            if created_at_str:
                if created_at_str.endswith('Z'):
                    created_at_str = created_at_str.replace('Z', '+00:00')
                event_date = datetime.fromisoformat(created_at_str)
            else:
                event_date = datetime.utcnow()

            event_type = _map_category_to_event_type(doc.get("category", "other"))

            event = {
                "document_id": str(doc["id"]),
                "event_type": event_type,
                "title": doc.get("filename", "Untitled"),
                "description": doc.get("category", "other"),
                "event_date": event_date.isoformat(),
                "end_date": None,
                "category": doc.get("category", "other"),
                "organization": None,
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