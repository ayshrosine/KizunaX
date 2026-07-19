from typing import Dict, List
from datetime import datetime
from app.services.ai_service import ai_service
from app.models.mongodb_models import Skill
from app.repositories.skill_repository import skill_repository

async def categorize_document(title: str, content: str, user_id: str, document_id: str = None) -> Dict:
    """Categorize document using AI service for specific user"""
    
    # Use OpenAI for categorization
    result = ai_service.categorize_document_openai(title, content)
    
    # Extract skills and save to database for user
    if result.get("skills"):
        await _save_skills(result["skills"], user_id, document_id)
    
    return result

async def _save_skills(skill_names: List[str], user_id: str, document_id: str = None):
    """Save extracted skills to MongoDB for specific user"""
    try:
        for skill_name in skill_names:
            if document_id:
                # Use upsert to create or update skill with document reference
                await skill_repository.upsert_by_name(user_id, skill_name, document_id, 0.8)
            else:
                # Check if skill already exists for this user
                existing_skill = await skill_repository.find_by_user_and_name(user_id, skill_name.lower().strip())
                
                if not existing_skill:
                    # Create new skill for user
                    skill = Skill(
                        user_id=user_id,
                        name=skill_name,
                        normalized_name=skill_name.lower().strip(),
                        confidence_score=0.8,
                        source_document_ids=[],
                        has_evidence=False
                    )
                    await skill.save()
        
    except Exception as e:
        print(f"Error saving skills: {e}")

def _categorize_skill(skill_name: str) -> str:
    """Categorize a skill into technical, soft, language, etc."""
    skill_lower = skill_name.lower()
    
    # Technical skills
    technical_keywords = [
        "python", "java", "javascript", "react", "node", "sql", "machine learning",
        "ai", "data", "web", "mobile", "cloud", "devops", "git", "docker",
        "kubernetes", "aws", "azure", "gcp", "tensorflow", "pytorch", "nlp",
        "computer vision", "algorithms", "database", "api", "backend", "frontend"
    ]
    
    # Soft skills
    soft_keywords = [
        "leadership", "communication", "teamwork", "problem solving", "analytical",
        "creativity", "adaptability", "time management", "presentation", "negotiation"
    ]
    
    # Languages
    language_keywords = [
        "english", "spanish", "french", "german", "chinese", "japanese", "korean"
    ]
    
    if any(keyword in skill_lower for keyword in technical_keywords):
        return "technical"
    elif any(keyword in skill_lower for keyword in soft_keywords):
        return "soft"
    elif any(keyword in skill_lower for keyword in language_keywords):
        return "language"
    else:
        return "other"

async def bulk_categorize_documents(documents: List[Dict]) -> List[Dict]:
    """Categorize multiple documents"""
    results = []
    
    for doc in documents:
        try:
            result = await categorize_document(
                doc.get("title", ""), 
                doc.get("content", ""),
                doc.get("user_id"),
                doc.get("id")
            )
            results.append({
                "document_id": doc.get("id"),
                "categorization": result
            })
        except Exception as e:
            print(f"Error categorizing document {doc.get('id')}: {e}")
            results.append({
                "document_id": doc.get("id"),
                "error": str(e)
            })
    
    return results