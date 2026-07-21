"""
Embedding / Vector Search service — Qdrant Cloud + local sentence-transformers.
Replaces the old ChromaDB-based embeddings.py.
"""
from typing import List, Dict, Optional

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue

from app.core.config import settings

# ── Local embedding model (loaded once) ────────────────────────────────
_embedder = None


def _get_embedder():
    """Lazy-load sentence-transformers model."""
    global _embedder
    if _embedder is None:
        try:
            from sentence_transformers import SentenceTransformer
            print(f"[Embeddings] Loading model: {settings.HUGGINGFACE_MODEL}")
            _embedder = SentenceTransformer(settings.HUGGINGFACE_MODEL)
            print("[Embeddings] Model loaded successfully")
        except Exception as e:
            print(f"[Embeddings] WARN: Could not load model: {e}")
    return _embedder


def embed_text(text: str) -> List[float]:
    """Generate a vector for the given text, or fall back to a hash-based stub."""
    model = _get_embedder()
    if model is not None:
        return model.encode(text, convert_to_numpy=True).tolist()
    # Fallback: deterministic hash embedding (not useful for real search, but keeps the API alive)
    import hashlib
    h = hashlib.sha256(text.encode()).hexdigest()
    vec = [int(h[i:i+2], 16) / 255.0 for i in range(0, len(h), 2)]
    dim = settings.LOCAL_EMBEDDING_DIMENSION
    return (vec * (dim // len(vec) + 1))[:dim]


# ── Qdrant client ──────────────────────────────────────────────────────
COLLECTION_NAME = "user_documents"


class EmbeddingService:
    def __init__(self):
        self.client: Optional[QdrantClient] = None
        self._init_qdrant()

    def _init_qdrant(self):
        if not settings.QDRANT_URL or not settings.QDRANT_API_KEY:
            print("[Qdrant] WARN: QDRANT_URL / QDRANT_API_KEY not set; vector search disabled.")
            return
        try:
            self.client = QdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY)
            # Ensure collection exists
            collections = [c.name for c in self.client.get_collections().collections]
            if COLLECTION_NAME not in collections:
                self.client.create_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=VectorParams(
                        size=settings.LOCAL_EMBEDDING_DIMENSION,
                        distance=Distance.COSINE,
                    ),
                )
                print(f"[Qdrant] Created collection '{COLLECTION_NAME}'")
            print(f"[Qdrant] Connected to {settings.QDRANT_URL}")
        except Exception as e:
            print(f"[Qdrant] WARN: Init failed: {e}")
            self.client = None

    # ── Public API ─────────────────────────────────────────────────────
    def add_document_embedding(self, document_id: str, text: str, metadata: Dict) -> Optional[str]:
        """Embed text and upsert into Qdrant."""
        if self.client is None:
            return None
        try:
            vector = embed_text(text)
            self.client.upsert(
                collection_name=COLLECTION_NAME,
                points=[
                    PointStruct(
                        id=document_id,
                        vector=vector,
                        payload=metadata,
                    )
                ],
            )
            return document_id
        except Exception as e:
            print(f"[Qdrant] Error upserting: {e}")
            return None

    def search_similar(self, query: str, user_id: str, n_results: int = 5) -> List[Dict]:
        """Semantic search filtered by user_id."""
        if self.client is None:
            return []
        try:
            query_vector = embed_text(query)
            results = self.client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_vector,
                query_filter=Filter(
                    must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
                ),
                limit=n_results,
            )
            return [
                {
                    "id": str(hit.id),
                    "score": hit.score,
                    "metadata": hit.payload,
                }
                for hit in results
            ]
        except Exception as e:
            print(f"[Qdrant] Search error: {e}")
            return []

    def delete_document(self, document_id: str):
        if self.client is None:
            return
        try:
            self.client.delete(
                collection_name=COLLECTION_NAME,
                points_selector=[document_id],
            )
        except Exception as e:
            print(f"[Qdrant] Delete error: {e}")

    def get_collection_stats(self) -> Dict:
        if self.client is None:
            return {}
        try:
            info = self.client.get_collection(COLLECTION_NAME)
            return {"total_documents": info.points_count, "collection_name": COLLECTION_NAME}
        except Exception as e:
            print(f"[Qdrant] Stats error: {e}")
            return {}


# Global singleton
embedding_service = EmbeddingService()