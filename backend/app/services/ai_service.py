"""
AI Service — Hugging Face Inference API (for Qwen3-8B-Instruct) + local embeddings.
Replaces the old OpenAI-dependent ai_service.py.
"""
from typing import List, Dict, Optional
import requests
import json
from app.core.config import settings

class AIService:
    def __init__(self):
        self.hf_token = settings.HF_TOKEN
        # Standard Qwen instruct model URL via HF Inference API
        self.api_url = "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct"

    def _query_hf_api(self, prompt: str, system_prompt: str = "You are a helpful assistant.", max_new_tokens: int = 512) -> Optional[str]:
        """Query Hugging Face Inference API."""
        if not self.hf_token:
            print("[AI Service] WARN: HF_TOKEN not set, skipping API query")
            return None
        
        headers = {
            "Authorization": f"Bearer {self.hf_token}",
            "Content-Type": "application/json"
        }
        
        # Format query following ChatML/Qwen template style
        formatted_prompt = f"<|im_start|>system\n{system_prompt}<|im_end|>\n<|im_start|>user\n{prompt}<|im_end|>\n<|im_start|>assistant\n"
        
        payload = {
            "inputs": formatted_prompt,
            "parameters": {
                "max_new_tokens": max_new_tokens,
                "temperature": 0.1,
                "return_full_text": False
            }
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    text = result[0].get("generated_text", "")
                    # Clean up assistant token if returned
                    if text.startswith("assistant\n"):
                        text = text[10:]
                    return text.strip()
            else:
                print(f"[AI Service] API Error {response.status_code}: {response.text}")
        except Exception as e:
            print(f"[AI Service] Request failed: {e}")
        return None

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding using the local sentence-transformers model."""
        from app.services.embeddings import embed_text
        return embed_text(text)

    def categorize_document_openai(self, title: str, content: str) -> Dict[str, any]:
        """Categorize document using Qwen via Hugging Face Inference API (API signature kept same)."""
        categories = ["Projects", "Skills", "Certifications", "Internships", "Achievements", "Academics"]
        
        prompt = f"""Analyze the following document and categorize it into EXACTLY ONE of these categories: {', '.join(categories)}
        
        Title: {title}
        Content snippet: {content[:1500]}
        
        Also extract:
        - Main skills mentioned (as a list of strings)
        - Date mentioned (if any, in YYYY-MM-DD format)
        - Organization/Company/Institution (if any)
        - Brief summary (2-3 sentences)
        
        Return ONLY valid JSON in the format:
        {{
            "category": "category_name",
            "skills": ["skill1", "skill2"],
            "date": "YYYY-MM-DD or null",
            "organization": "organization name or null",
            "summary": "brief summary",
            "confidence": 0.0-1.0
        }}"""

        system_prompt = "You are a professional document classifier that output ONLY valid JSON. Do not include markdown code block syntax."
        
        response_text = self._query_hf_api(prompt, system_prompt)
        
        if response_text:
            try:
                # Clean up any potential markdown wraps
                cleaned = response_text.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()
                return json.loads(cleaned)
            except Exception as e:
                print(f"[AI Service] JSON parsing failed: {e}. Raw response: {response_text}")
        
        return self._categorize_fallback(title, content)

    def _categorize_fallback(self, title: str, content: str) -> Dict[str, any]:
        """Fallback categorization logic when HF API fails."""
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
        
        if any(word in combined for word in ["certificate", "certification", "course completion", "badge"]):
            result["category"] = "Certifications"
        elif any(word in combined for word in ["internship", "intern", "work experience", "employment"]):
            result["category"] = "Internships"
        elif any(word in combined for word in ["award", "achievement", "prize", "competition", "recognition"]):
            result["category"] = "Achievements"
        elif any(word in combined for word in ["transcript", "degree", "academic", "university", "college", "gpa"]):
            result["category"] = "Academics"
        
        return result

    def extract_relationships(self, documents: List[Dict]) -> List[Dict]:
        """Extract relationships between documents using Qwen via HF API."""
        if len(documents) < 2:
            return []
        
        doc_summaries = []
        for d in documents:
            doc_summaries.append({
                "id": d.get("id"),
                "title": d.get("filename"),
                "category": d.get("category"),
                "summary": d.get("extracted_text", "")[:200]
            })
            
        prompt = f"""Analyze these document summaries and identify relationships (edges) between them.
        Use these types: "enabled_by", "led_to", "applied_in".
        
        Documents:
        {json.dumps(doc_summaries, indent=2)}
        
        Return ONLY valid JSON as a list of relationship objects:
        [
            {{
                "from_entity": "document_id_1",
                "to_entity": "document_id_2",
                "relation_type": "relation_type"
            }}
        ]"""
        
        system_prompt = "You are a knowledge graph builder. Return ONLY valid JSON. Do not include markdown code block wraps."
        response_text = self._query_hf_api(prompt, system_prompt)
        
        if response_text:
            try:
                cleaned = response_text.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()
                return json.loads(cleaned)
            except Exception as e:
                print(f"[AI Service] Relations parsing failed: {e}. Raw: {response_text}")
                
        # Basic fallback matching common skills
        relationships = []
        for i, doc1 in enumerate(documents):
            for doc2 in documents[i+1:]:
                rel = self._detect_simple_relationship(doc1, doc2)
                if rel:
                    relationships.append(rel)
        return relationships

    def _detect_simple_relationship(self, doc1: Dict, doc2: Dict) -> Optional[Dict]:
        skills1 = set(doc1.get("skills", []) or [])
        skills2 = set(doc2.get("skills", []) or [])
        common_skills = skills1.intersection(skills2)
        if common_skills:
            return {
                "from_entity": doc1["id"],
                "to_entity": doc2["id"],
                "relation_type": "applied_in"
            }
        return None

# Global instance
ai_service = AIService()

def test_hf_connection() -> bool:
    """Test connection to Hugging Face Inference API."""
    try:
        res = ai_service._query_hf_api("Say hello.", "You are a test stub.")
        if res:
            print("[AI Service] HF Connection check successful!")
            return True
        return False
    except Exception as e:
        print(f"[AI Service] HF Connection check failed: {e}")
        return False