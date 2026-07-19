from typing import List, Dict, Optional
from app.models.mongodb_models import Relationship, Document, Skill, RelationshipType
from app.services.ai_service import ai_service
from app.repositories.relationship_repository import relationship_repository
from app.repositories.document_repository import document_repository
from app.repositories.skill_repository import skill_repository

async def detect_for_document(document_id: str, user_id: str):
    """Detect relationships for a single document using ChromaDB similarity + LLM confirmation"""
    try:
        # Get the document
        document = await document_repository.find_by_id(document_id)
        if not document or document.user_id != user_id:
            return {"status": "error", "message": "Document not found or access denied"}

        # Get embedding service
        try:
            from app.services.embeddings import embedding_service
            if not embedding_service or not embedding_service.collection:
                return {"status": "success", "relationships_created": 0, "message": "Embedding service not available"}
        except:
            return {"status": "success", "relationships_created": 0, "message": "Embedding service not available"}

        # Query ChromaDB for similar documents (same user only)
        if document.extracted_text:
            similar_docs = embedding_service.search_similar(
                query=document.extracted_text,
                user_id=user_id,  # MANDATORY for multi-tenant isolation
                n_results=11,  # Request extra to account for self being in results
            )
            # Filter out self from results (ChromaDB doesn't support $ne)
            similar_docs = [r for r in similar_docs if r.get('id') != str(document_id)]
        else:
            similar_docs = []

        created_count = 0

        # For each similar document above threshold, confirm relationship with LLM
        for result in similar_docs:
            # Skip if similarity is too low (distance > 0.35 in cosine space)
            if result.get('distance', 1.0) > 0.35:
                continue

            related_doc_id = result['id']
            related_doc = await document_repository.find_by_id(related_doc_id)

            if not related_doc or related_doc.user_id != user_id:
                continue

            # Check if relationship already exists
            existing = await relationship_repository.find_by_edge(
                user_id=user_id,
                source_id=str(document_id),
                target_id=str(related_doc_id),
                relationship_type=None  # Check any relationship type
            )

            if existing:
                continue

            # Use LLM to confirm relationship type
            relationship_type = await _confirm_relationship_type(
                document, related_doc, result.get('distance', 0.0)
            )

            if relationship_type:
                # Create relationship
                relationship_data = {
                    "user_id": user_id,
                    "source_type": "document",
                    "source_id": str(document_id),
                    "target_type": "document",
                    "target_id": str(related_doc_id),
                    "relationship_type": relationship_type,
                    "strength": 1.0 - result.get('distance', 0.0),  # Convert distance to strength
                    "ai_generated": True
                }
                await relationship_repository.create(relationship_data)
                created_count += 1

        return {"status": "success", "relationships_created": created_count}

    except Exception as e:
        print(f"Error detecting relationships for document {document_id}: {e}")
        return {"status": "error", "message": str(e)}

async def _confirm_relationship_type(doc1: Document, doc2: Document, similarity: float) -> Optional[RelationshipType]:
    """Use LLM to confirm and label the relationship type between two documents"""
    try:
        if not ai_service.openai_client:
            # Fallback to rule-based detection
            return _detect_relationship_rule_based(doc1, doc2)

        prompt = f"""
        Analyze the relationship between these two documents:

        Document 1:
        - Title: {doc1.filename}
        - Category: {doc1.category.value if doc1.category else 'Unknown'}
        - Content: {doc1.extracted_text[:500] if doc1.extracted_text else ''}

        Document 2:
        - Title: {doc2.filename}
        - Category: {doc2.category.value if doc2.category else 'Unknown'}
        - Content: {doc2.extracted_text[:500] if doc2.extracted_text else ''}

        Similarity score: {similarity:.3f}

        Determine the relationship type from these options:
        - "backs": Document 1 backs/supports Document 2 (e.g., a certificate backs a skill claim)
        - "leadsTo": Document 1 leads to Document 2 (e.g., an internship leads to a career path)
        - "derivedFrom": Document 1 is derived from Document 2 (e.g., a project is derived from learned skills)

        Respond with ONLY the relationship type name, or "none" if no clear relationship exists.
        """

        response = ai_service.openai_client.chat.completions.create(
            model=ai_service.openai_client.api_key and "gpt-3.5-turbo" or "gpt-4",
            messages=[
                {"role": "system", "content": "You are a document relationship analysis expert."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=10
        )

        result = response.choices[0].message.content.strip().lower()

        # Map to enum
        type_mapping = {
            "backs": RelationshipType.BACKS,
            "leadsto": RelationshipType.LEADS_TO,
            "leads to": RelationshipType.LEADS_TO,
            "derivedfrom": RelationshipType.DERIVED_FROM,
            "derived from": RelationshipType.DERIVED_FROM
        }

        return type_mapping.get(result)

    except Exception as e:
        print(f"Error in LLM relationship confirmation: {e}")
        return _detect_relationship_rule_based(doc1, doc2)

def _detect_relationship_rule_based(doc1: Document, doc2: Document) -> Optional[RelationshipType]:
    """Rule-based relationship detection as fallback"""
    cat1 = doc1.category.value if doc1.category else ""
    cat2 = doc2.category.value if doc2.category else ""

    # Simple category-based rules
    if cat1 == "Certifications" and cat2 == "Skills":
        return RelationshipType.BACKS
    elif cat1 == "Skills" and cat2 == "Projects":
        return RelationshipType.LEADS_TO
    elif cat1 == "Projects" and cat2 == "Internships":
        return RelationshipType.LEADS_TO
    elif cat1 == "Internships" and cat2 == "Academics":
        return RelationshipType.DERIVED_FROM

    return None

async def extract_and_save_relationships(user_id: str):
    """Extract relationships between all documents for specific user and save to MongoDB"""
    try:
        # Get all indexed documents for user
        documents = await document_repository.get_indexed_documents(user_id)

        created_count = 0

        # Process each document to find relationships
        for doc in documents:
            result = await detect_for_document(str(doc.id), user_id)
            if result.get("status") == "success":
                created_count += result.get("relationships_created", 0)

        return {"status": "success", "relationships_created": created_count}

    except Exception as e:
        print(f"Error extracting relationships: {e}")
        return {"status": "error", "message": str(e)}

async def get_document_relationships(document_id: str, user_id: str) -> List[Dict]:
    """Get all relationships for a specific document"""
    try:
        relationships = await relationship_repository.find_by_source_id(document_id, user_id)
        
        result = []
        for rel in relationships:
            # Get related document
            related_doc = await document_repository.find_by_id(rel.target_id)
            
            result.append({
                "id": str(rel.id),
                "relationship_type": rel.relationship_type.value,
                "strength": rel.strength,
                "ai_generated": rel.ai_generated,
                "related_document": {
                    "id": str(related_doc.id) if related_doc else None,
                    "filename": related_doc.filename if related_doc else None,
                    "category": related_doc.category.value if related_doc and related_doc.category else None
                } if related_doc else None
            })
        
        return result
    except Exception as e:
        print(f"Error getting relationships: {e}")
        return []

async def get_all_relationships(user_id: str) -> List[Dict]:
    """Get all document relationships for user"""
    try:
        relationships = await relationship_repository.find_by_user(user_id)
        
        result = []
        for rel in relationships:
            doc = await document_repository.find_by_id(rel.source_id)
            related_doc = await document_repository.find_by_id(rel.target_id)
            
            result.append({
                "id": str(rel.id),
                "relationship_type": rel.relationship_type.value,
                "strength": rel.strength,
                "ai_generated": rel.ai_generated,
                "document": {
                    "id": str(doc.id) if doc else None,
                    "filename": doc.filename if doc else None,
                    "category": doc.category.value if doc and doc.category else None
                } if doc else None,
                "related_document": {
                    "id": str(related_doc.id) if related_doc else None,
                    "filename": related_doc.filename if related_doc else None,
                    "category": related_doc.category.value if related_doc and related_doc.category else None
                } if related_doc else None
            })
        
        return result
    except Exception as e:
        print(f"Error getting all relationships: {e}")
        return []