from typing import List, Dict, Optional
import numpy as np
from app.core.config import settings

# Optional import for OpenAI
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("Warning: openai not available, AI features will use fallback")

# Optional import for sentence-transformers - make it truly non-blocking
SENTENCE_TRANSFORMERS_AVAILABLE = False
try:
    # Only import if actually needed, not at module level
    # This prevents the import errors during startup
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    print("Warning: sentence-transformers import deferred to prevent startup issues")
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    print("Warning: sentence-transformers not available, local embeddings will use fallback")

class AIService:
    def __init__(self):
        self.openai_client = None
        self.hf_model = None
        self._init_openai()
        # Don't init huggingface at startup - lazy load instead
    
    def _init_openai(self):
        """Initialize OpenAI client"""
        if not OPENAI_AVAILABLE:
            print("Warning: openai package not available, OpenAI features will use fallback")
            return
        
        if not settings.OPENAI_API_KEY:
            print("Warning: OPENAI_API_KEY not set, OpenAI features will be limited")
            return
        
        try:
            self.openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            print("OpenAI client initialized")
        except Exception as e:
            print(f"Error initializing OpenAI client: {e}")
            print("OpenAI features will use fallback methods")
            self.openai_client = None
    
    def _init_huggingface(self):
        """Initialize Hugging Face model"""
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            print("Skipping Hugging Face model initialization (sentence-transformers not available)")
            return
        
        try:
            print(f"Loading Hugging Face model: {settings.HUGGINGFACE_MODEL}")
            self.hf_model = SentenceTransformer(settings.HUGGINGFACE_MODEL)
            print("Hugging Face model loaded successfully")
        except Exception as e:
            print(f"Error loading Hugging Face model: {e}")
    
    def generate_embedding_openai(self, text: str) -> Optional[List[float]]:
        """Generate embedding using OpenAI"""
        if not OPENAI_AVAILABLE or not self.openai_client:
            return None
        
        try:
            response = self.openai_client.embeddings.create(
                model=settings.OPENAI_EMBEDDING_MODEL,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error generating OpenAI embedding: {e}")
            return None
    
    def generate_embedding_hf(self, text: str) -> Optional[List[float]]:
        """Generate embedding using Hugging Face"""
        if not self.hf_model:
            return None
        
        try:
            embedding = self.hf_model.encode(text, convert_to_numpy=True)
            return embedding.tolist()
        except Exception as e:
            print(f"Error generating HF embedding: {e}")
            return None
    
    def generate_embedding(self, text: str, use_openai: bool = True) -> List[float]:
        """Generate embedding with fallback"""
        if use_openai and self.openai_client:
            embedding = self.generate_embedding_openai(text)
            if embedding:
                return embedding
        
        # Fallback to Hugging Face
        embedding = self.generate_embedding_hf(text)
        if embedding:
            return embedding
        
        # Last resort: simple hash-based embedding
        return self._simple_embedding(text)
    
    def _simple_embedding(self, text: str) -> List[float]:
        """Simple hash-based embedding as fallback"""
        # This is a very basic fallback - not recommended for production
        import hashlib
        hash_obj = hashlib.md5(text.encode())
        hash_hex = hash_obj.hexdigest()
        
        # Convert to 384-dimensional vector (HF default)
        embedding = []
        for i in range(0, len(hash_hex), 2):
            val = int(hash_hex[i:i+2], 16) / 255.0
            embedding.append(val)
        
        # Pad or truncate to correct dimension
        target_dim = settings.LOCAL_EMBEDDING_DIMENSION
        if len(embedding) < target_dim:
            embedding.extend([0.0] * (target_dim - len(embedding)))
        else:
            embedding = embedding[:target_dim]
        
        return embedding
    
    def categorize_document_openai(self, title: str, content: str) -> Dict[str, any]:
        """Categorize document using OpenAI"""
        if not OPENAI_AVAILABLE or not self.openai_client:
            return self._categorize_fallback(title, content)
        
        categories = ["Projects", "Skills", "Certifications", "Internships", "Achievements", "Academics"]
        
        prompt = f"""
        Analyze the following document and categorize it into ONE of these categories: {', '.join(categories)}
        
        Title: {title}
        Content: {content[:1000]}  # First 1000 chars
        
        Also extract:
        - Main skills mentioned (comma-separated)
        - Date mentioned (if any, in YYYY-MM-DD format)
        - Organization/Company (if any)
        - Brief summary (2-3 sentences)
        
        Respond in JSON format:
        {{
            "category": "category_name",
            "skills": ["skill1", "skill2"],
            "date": "YYYY-MM-DD or null",
            "organization": "organization name or null",
            "summary": "brief summary",
            "confidence": 0.0-1.0
        }}
        """
        
        try:
            response = self.openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a document categorization expert."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            import json
            result = json.loads(response.choices[0].message.content)
            return result
        except Exception as e:
            print(f"Error in OpenAI categorization: {e}")
            return self._categorize_fallback(title, content)
    
    def _categorize_fallback(self, title: str, content: str) -> Dict[str, any]:
        """Rule-based categorization as fallback"""
        title_lower = title.lower()
        content_lower = content.lower()
        combined = title_lower + " " + content_lower
        
        result = {
            "category": "Projects",
            "skills": [],
            "date": None,
            "organization": None,
            "summary": content[:200] if content else title,
            "confidence": 0.5
        }
        
        # Simple skill extraction from content
        known_skills = [
            "python", "javascript", "react", "node.js", "node", "mongodb", "docker", 
            "kubernetes", "sql", "java", "c++", "c#", "html", "css", "git", 
            "aws", "azure", "gcp", "machine learning", "deep learning", "ai", "nlp"
        ]
        extracted_skills = []
        for skill in known_skills:
            if skill in combined:
                if skill == "node":
                    extracted_skills.append("node.js")
                else:
                    extracted_skills.append(skill)
        result["skills"] = list(set(extracted_skills))
        
        # Simple keyword matching for category
        if any(word in combined for word in ["certificate", "certification", "course completion", "badge"]):
            result["category"] = "Certifications"
        elif any(word in combined for word in ["internship", "intern", "work experience", "employment"]):
            result["category"] = "Internships"
        elif any(word in combined for word in ["award", "achievement", "prize", "competition", "recognition"]):
            result["category"] = "Achievements"
        elif any(word in combined for word in ["transcript", "degree", "academic", "university", "college", "gpa"]):
            result["category"] = "Academics"
        elif any(word in combined for word in ["resume", "cv", "curriculum vitae"]):
            result["category"] = "Projects"  # Resumes often contain project info
        
        return result
    
    def extract_relationships(self, documents: List[Dict]) -> List[Dict]:
        """Extract relationships between documents using OpenAI"""
        if not self.openai_client or len(documents) < 2:
            return []
        
        # For now, implement simple rule-based relationships
        relationships = []
        
        for i, doc1 in enumerate(documents):
            for doc2 in documents[i+1:]:
                rel = self._detect_simple_relationship(doc1, doc2)
                if rel:
                    relationships.append(rel)
        
        return relationships
    
    def _detect_simple_relationship(self, doc1: Dict, doc2: Dict) -> Optional[Dict]:
        """Detect simple relationships between two documents"""
        skills1 = set(doc1.get("skills", []))
        skills2 = set(doc2.get("skills", []))
        
        # If documents share skills, they're related
        common_skills = skills1.intersection(skills2)
        if common_skills:
            return {
                "document_id": doc1["id"],
                "related_document_id": doc2["id"],
                "relationship_type": "RELATED_TO",
                "confidence": len(common_skills) / max(len(skills1), len(skills2)),
                "metadata": {"common_skills": list(common_skills)}
            }
        
        return None

# Global AI service instance
ai_service = AIService()

def test_openai_connection():
    """Test OpenAI API connection"""
    try:
        if ai_service.openai_client:
            response = ai_service.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10
            )
            print("OpenAI connection successful!")
            return True
        else:
            print("OpenAI client not initialized")
            return False
    except Exception as e:
        print(f"OpenAI connection failed: {e}")
        return False