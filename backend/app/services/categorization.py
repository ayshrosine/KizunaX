from typing import Dict, List
from app.services.ai_service import ai_service
from app.repositories.skill_repository import skill_repository

async def categorize_document(title: str, content: str, user_id: str, document_id: str = None) -> Dict:
    """Categorize document using AI service for specific user"""
    # Use HF Inference API (or fallback) for categorization
    result = ai_service.categorize_document_openai(title, content)
    
    # Extract skills and save to database for user
    if result.get("skills"):
        _save_skills(result["skills"], user_id, document_id)
    
    return result

def _save_skills(skill_names: List[str], user_id: str, document_id: str = None):
    """Save extracted skills to Supabase for specific user"""
    try:
        for skill_name in skill_names:
            skill_repository.upsert_skill(user_id, skill_name, document_id, 0.8)
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