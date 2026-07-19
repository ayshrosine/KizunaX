from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_active_user, User
from app.repositories.skill_repository import skill_repository
from app.repositories.relationship_repository import relationship_repository
from app.repositories.document_repository import document_repository

router = APIRouter()


@router.get("/")
async def get_graph(current_user: User = Depends(get_current_active_user)):
    """Get knowledge graph nodes and edges for the current user."""
    try:
        user_id = str(current_user.id)
        skills = await skill_repository.find_by_user_id(user_id, limit=50)
        relationships = await relationship_repository.find_by_user_id(user_id, limit=100)
        documents = await document_repository.get_indexed_documents(user_id, limit=50)

        nodes = []
        node_ids = set()

        for skill in skills:
            node_id = f"skill-{skill.id}"
            nodes.append({
                "id": node_id,
                "label": skill.name,
                "type": "skill",
                "category": "Skills",
                "has_evidence": skill.has_evidence,
            })
            node_ids.add(node_id)

        for doc in documents:
            node_id = f"doc-{doc.id}"
            nodes.append({
                "id": node_id,
                "label": doc.filename,
                "type": "document",
                "category": doc.category.value if doc.category else "Projects",
            })
            node_ids.add(node_id)

        edges = []
        for rel in relationships:
            source_id = f"doc-{rel.source_id}" if rel.source_type == "document" else f"skill-{rel.source_id}"
            target_id = f"doc-{rel.target_id}" if rel.target_type == "document" else f"skill-{rel.target_id}"
            if source_id in node_ids and target_id in node_ids:
                edges.append({
                    "source": source_id,
                    "target": target_id,
                    "type": rel.relationship_type.value,
                    "strength": rel.strength or 0.5,
                })

        return {"nodes": nodes, "edges": edges, "total_nodes": len(nodes), "total_edges": len(edges)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get graph: {str(e)}")
