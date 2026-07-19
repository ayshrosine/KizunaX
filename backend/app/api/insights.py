from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_active_user, User
from app.repositories.skill_repository import skill_repository
from app.repositories.document_repository import document_repository
from app.models.mongodb_models import DocumentCategory

router = APIRouter()

CAREER_PATHS = [
    {
        "id": "software-engineer",
        "title": "Software Engineer",
        "required_skills": ["python", "javascript", "react", "git", "api", "database"],
    },
    {
        "id": "data-scientist",
        "title": "Data Scientist",
        "required_skills": ["python", "machine learning", "data", "sql", "statistics"],
    },
    {
        "id": "cloud-architect",
        "title": "Cloud Architect",
        "required_skills": ["aws", "cloud", "docker", "kubernetes", "devops"],
    },
    {
        "id": "product-designer",
        "title": "Product Designer",
        "required_skills": ["ux", "design", "figma", "wireframe", "prototyping"],
    },
]


def _match_score(user_skills: set, required: list) -> int:
    if not required:
        return 0
    matched = sum(1 for s in required if any(s in us or us in s for us in user_skills))
    return round((matched / len(required)) * 100)


@router.get("/skills")
async def get_skills_insights(current_user: User = Depends(get_current_active_user)):
    """Get skill inventory for the current user."""
    try:
        skills = await skill_repository.find_by_user_id(str(current_user.id), limit=100)
        return {
            "skills": [
                {
                    "id": str(s.id),
                    "name": s.name,
                    "has_evidence": s.has_evidence,
                    "confidence_score": s.confidence_score,
                    "source_count": len(s.source_document_ids),
                }
                for s in skills
            ],
            "total": len(skills),
            "with_evidence": sum(1 for s in skills if s.has_evidence),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get skills: {str(e)}")


@router.get("/gaps")
async def get_skill_gaps(current_user: User = Depends(get_current_active_user)):
    """Detect skill gaps based on document categories."""
    try:
        user_id = str(current_user.id)
        skills = await skill_repository.find_by_user_id(user_id, limit=100)
        user_skill_names = {s.normalized_name for s in skills}

        documents = await document_repository.find_by_user_id(user_id, limit=100)
        categories_present = {d.category.value for d in documents if d.category}

        recommended_categories = {c.value for c in DocumentCategory}
        missing_categories = recommended_categories - categories_present

        common_skills = ["python", "communication", "leadership", "git", "sql"]
        missing_skills = [s for s in common_skills if s not in user_skill_names]

        return {
            "missing_categories": list(missing_categories),
            "missing_skills": missing_skills,
            "categories_present": list(categories_present),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get gaps: {str(e)}")


@router.get("/career-paths")
async def get_career_paths(current_user: User = Depends(get_current_active_user)):
    """Match user skills to career paths."""
    try:
        skills = await skill_repository.find_by_user_id(str(current_user.id), limit=100)
        user_skill_names = {s.normalized_name for s in skills}

        paths = []
        for path in CAREER_PATHS:
            match = _match_score(user_skill_names, path["required_skills"])
            matched = [s for s in path["required_skills"] if any(s in us or us in s for us in user_skill_names)]
            missing = [s for s in path["required_skills"] if s not in matched]
            paths.append({
                "id": path["id"],
                "title": path["title"],
                "match": match,
                "matched_skills": matched,
                "missing_skills": missing,
            })

        paths.sort(key=lambda p: p["match"], reverse=True)
        return {"paths": paths}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get career paths: {str(e)}")
