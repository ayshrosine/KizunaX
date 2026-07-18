from typing import Dict, List
from app.services.ai_service import ai_service
from app.core.database import SessionLocal, Skill

def categorize_document(title: str, content: str, user_id: int) -> Dict:
    """Categorize document using AI service for specific user"""
    
    # Use OpenAI for categorization
    result = ai_service.categorize_document_openai(title, content)
    
    # Extract skills and save to database for user
    if result.get("skills"):
        _save_skills(result["skills"], user_id)
    
    return result

def _save_skills(skill_names: List[str], user_id: int):
    """Save extracted skills to database for specific user"""
    db = SessionLocal()
    try:
        for skill_name in skill_names:
            # Check if skill already exists for this user
            existing_skill = db.query(Skill).filter(
                Skill.user_id == user_id,
                Skill.name == skill_name
            ).first()
            
            if not existing_skill:
                # Determine skill category
                skill_category = _categorize_skill(skill_name)
                
                # Create new skill for user
                skill = Skill(
                    user_id=user_id,
                    name=skill_name,
                    category=skill_category,
                    confidence=0.8
                )
                db.add(skill)
        
        db.commit()
    except Exception as e:
        print(f"Error saving skills: {e}")
        db.rollback()
    finally:
        db.close()

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

def bulk_categorize_documents(documents: List[Dict]) -> List[Dict]:
    """Categorize multiple documents"""
    results = []
    
    for doc in documents:
        try:
            result = categorize_document(doc.get("title", ""), doc.get("content", ""))
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