from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_active_user, UserInfo
from app.repositories.skill_repository import skill_repository
from app.repositories.relationship_repository import relationship_repository
from app.repositories.document_repository import document_repository

router = APIRouter()

@router.get("/")
async def get_graph(current_user: UserInfo = Depends(get_current_active_user)):
    """Get knowledge graph nodes and edges for the current user."""
    try:
        user_id = current_user.id
        skills = skill_repository.find_by_user_id(user_id)
        relationships = relationship_repository.find_by_user_id(user_id)
        documents = document_repository.get_indexed_documents(user_id, limit=50)

        nodes = []
        node_ids = set()

        for skill in skills:
            node_id = f"skill-{skill.get('id')}"
            nodes.append({
                "id": node_id,
                "label": skill.get("name"),
                "type": "skill",
                "category": "Skills",
                "has_evidence": len(skill.get("source_document_ids", [])) > 0,
            })
            node_ids.add(node_id)

        for doc in documents:
            node_id = f"doc-{doc.get('id')}"
            nodes.append({
                "id": node_id,
                "label": doc.get("filename"),
                "type": "document",
                "category": doc.get("category", "Projects"),
            })
            node_ids.add(node_id)

        edges = []
        for rel in relationships:
            source_id = f"doc-{rel.get('from_entity')}"
            target_id = f"doc-{rel.get('to_entity')}"
            
            # Support skill relations if they exist (though right now everything is between documents)
            if source_id not in node_ids and f"skill-{rel.get('from_entity')}" in node_ids:
                source_id = f"skill-{rel.get('from_entity')}"
            if target_id not in node_ids and f"skill-{rel.get('to_entity')}" in node_ids:
                target_id = f"skill-{rel.get('to_entity')}"
                
            if source_id in node_ids and target_id in node_ids:
                edges.append({
                    "source": source_id,
                    "target": target_id,
                    "type": rel.get("relation_type"),
                    "strength": 0.5,
                })

        return {"nodes": nodes, "edges": edges, "total_nodes": len(nodes), "total_edges": len(edges)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get graph: {str(e)}")
