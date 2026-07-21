from typing import List, Dict, Optional
from app.models.schemas import RelationshipType
from app.services.ai_service import ai_service
from app.repositories.relationship_repository import relationship_repository
from app.repositories.document_repository import document_repository

async def detect_for_document(document_id: str, user_id: str):
    """Detect relationships for a single document using Qdrant similarity + LLM confirmation"""
    try:
        document = document_repository.find_by_id(document_id)
        if not document or document.get("user_id") != user_id:
            return {"status": "error", "message": "Document not found or access denied"}

        try:
            from app.services.embeddings import embedding_service
            if not embedding_service or not embedding_service.client:
                return {"status": "success", "relationships_created": 0, "message": "Embedding service not available"}
        except:
            return {"status": "success", "relationships_created": 0, "message": "Embedding service not available"}

        if document.get("extracted_text"):
            similar_docs = embedding_service.search_similar(
                query=document["extracted_text"],
                user_id=user_id,
                n_results=11
            )
            # Filter out self
            similar_docs = [r for r in similar_docs if r.get('id') != str(document_id)]
        else:
            similar_docs = []

        created_count = 0

        for result in similar_docs:
            related_doc_id = result['id']
            related_doc = document_repository.find_by_id(related_doc_id)

            if not related_doc or related_doc.get("user_id") != user_id:
                continue

            # Check if relationship already exists
            existing = relationship_repository.find_by_entity(user_id, str(document_id))
            is_existing = any(
                (r["from_entity"] == str(document_id) and r["to_entity"] == str(related_doc_id)) or
                (r["from_entity"] == str(related_doc_id) and r["to_entity"] == str(document_id))
                for r in existing
            )

            if is_existing:
                continue

            # Confirm with LLM (or fallback)
            relationship_type = await _confirm_relationship_type(document, related_doc)

            if relationship_type:
                relationship_data = {
                    "user_id": user_id,
                    "from_entity": str(document_id),
                    "to_entity": str(related_doc_id),
                    "relation_type": relationship_type.value
                }
                relationship_repository.create(relationship_data)
                created_count += 1

        return {"status": "success", "relationships_created": created_count}

    except Exception as e:
        print(f"Error detecting relationships for document {document_id}: {e}")
        return {"status": "error", "message": str(e)}

async def _confirm_relationship_type(doc1: dict, doc2: dict) -> Optional[RelationshipType]:
    """Confirm and label relationship type using Qwen via HF API"""
    try:
        # Prompting for a single relation label
        prompt = f"""Analyze the relationship between these two documents and select one relation:
        
        Doc 1: {doc1.get('filename')} (Category: {doc1.get('category')})
        Content: {doc1.get('extracted_text', '')[:400]}
        
        Doc 2: {doc2.get('filename')} (Category: {doc2.get('category')})
        Content: {doc2.get('extracted_text', '')[:400]}
        
        Choose from:
        - "enabled_by": Doc 1 is supported or made possible by Doc 2
        - "led_to": Doc 1 leads to or resulted in Doc 2
        - "applied_in": Doc 1 skills/work are applied in Doc 2
        
        Return ONLY the relation label name (enabled_by, led_to, applied_in) or "none"."""
        
        system_prompt = "You are a relation extractor. Output only the relation label string."
        res = ai_service._query_hf_api(prompt, system_prompt, max_new_tokens=10)
        
        if res:
            res_clean = res.strip().lower()
            for r_type in RelationshipType:
                if r_type.value in res_clean:
                    return r_type
                    
        return _detect_relationship_rule_based(doc1, doc2)
    except Exception as e:
        print(f"Error in LLM confirmation: {e}")
        return _detect_relationship_rule_based(doc1, doc2)

def _detect_relationship_rule_based(doc1: dict, doc2: dict) -> Optional[RelationshipType]:
    cat1 = doc1.get("category", "")
    cat2 = doc2.get("category", "")
    if cat1 == "Certifications" and cat2 == "Skills":
        return RelationshipType.ENABLED_BY
    elif cat1 == "Skills" and cat2 == "Projects":
        return RelationshipType.APPLIED_IN
    elif cat1 == "Projects" and cat2 == "Internships":
        return RelationshipType.LED_TO
    return None

async def extract_and_save_relationships(user_id: str):
    """Extract relationships for all indexed documents of user"""
    try:
        documents = document_repository.get_indexed_documents(user_id)
        created_count = 0
        for doc in documents:
            result = await detect_for_document(doc["id"], user_id)
            if result.get("status") == "success":
                created_count += result.get("relationships_created", 0)
        return {"status": "success", "relationships_created": created_count}
    except Exception as e:
        print(f"Error extracting relationships: {e}")
        return {"status": "error", "message": str(e)}

async def get_document_relationships(document_id: str, user_id: str) -> List[Dict]:
    try:
        relationships = relationship_repository.find_by_entity(user_id, document_id)
        result = []
        for rel in relationships:
            related_id = rel["to_entity"] if rel["from_entity"] == document_id else rel["from_entity"]
            related_doc = document_repository.find_by_id(related_id)
            if related_doc:
                result.append({
                    "id": rel["id"],
                    "relationship_type": rel["relation_type"],
                    "related_document": {
                        "id": related_id,
                        "filename": related_doc.get("filename"),
                        "category": related_doc.get("category")
                    }
                })
        return result
    except Exception as e:
        print(f"Error getting document relationships: {e}")
        return []

async def get_all_relationships(user_id: str) -> List[Dict]:
    try:
        relationships = relationship_repository.find_by_user_id(user_id)
        result = []
        for rel in relationships:
            doc1 = document_repository.find_by_id(rel["from_entity"])
            doc2 = document_repository.find_by_id(rel["to_entity"])
            if doc1 and doc2:
                result.append({
                    "id": rel["id"],
                    "relationship_type": rel["relation_type"],
                    "document": {
                        "id": rel["from_entity"],
                        "filename": doc1.get("filename"),
                        "category": doc1.get("category")
                    },
                    "related_document": {
                        "id": rel["to_entity"],
                        "filename": doc2.get("filename"),
                        "category": doc2.get("category")
                    }
                })
        return result
    except Exception as e:
        print(f"Error getting all relationships: {e}")
        return []