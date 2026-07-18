import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Optional
from app.core.config import settings
from app.services.ai_service import ai_service

class EmbeddingService:
    def __init__(self):
        self.client = None
        self.collection = None
        self._init_chromadb()
    
    def _init_chromadb(self):
        """Initialize ChromaDB client and collection - Local/Embedded Mode"""
        try:
            # Use local persistent client (in-memory or on-disk)
            self.client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
            
            # Get or create collection
            self.collection = self.client.get_or_create_collection(
                name="documents",
                metadata={"hnsw:space": "cosine"}
            )
            
            print(f"ChromaDB Local initialized at {settings.CHROMA_DB_PATH}")
        except Exception as e:
            print(f"Error initializing ChromaDB: {e}")
            self.client = None
            self.collection = None
    
    def add_document_embedding(self, document_id: int, text: str, metadata: Dict):
        """Add document embedding to vector database"""
        if not self.collection:
            return None
        
        try:
            # Generate embedding
            embedding = ai_service.generate_embedding(text)
            
            # Ensure user_id is in metadata for multi-user isolation
            if 'user_id' not in metadata:
                print("Warning: user_id not in metadata, data isolation may be compromised")
            
            # Add to ChromaDB
            self.collection.add(
                embeddings=[embedding],
                documents=[text],
                metadatas=[metadata],
                ids=[str(document_id)]
            )
            
            return str(document_id)
        except Exception as e:
            print(f"Error adding embedding: {e}")
            return None
    
    def search_similar(self, query: str, n_results: int = 5, filter_dict: Optional[Dict] = None) -> List[Dict]:
        """Search for similar documents"""
        if not self.collection:
            return []
        
        try:
            # Generate query embedding
            query_embedding = ai_service.generate_embedding(query)
            
            # Ensure user_id filter is applied for data isolation
            if filter_dict is None:
                filter_dict = {}
            
            # Always include user_id in filter if provided for multi-user isolation
            # If no user_id in filter, this is a potential security issue
            if 'user_id' not in filter_dict:
                print("Warning: Searching without user_id filter - may return data from all users")
            
            # Search
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=filter_dict
            )
            
            # Format results
            formatted_results = []
            if results['ids'] and len(results['ids'][0]) > 0:
                for i in range(len(results['ids'][0])):
                    formatted_results.append({
                        'id': results['ids'][0][i],
                        'document': results['documents'][0][i],
                        'metadata': results['metadatas'][0][i],
                        'distance': results['distances'][0][i]
                    })
            
            return formatted_results
        except Exception as e:
            print(f"Error searching embeddings: {e}")
            return []
    
    def delete_document(self, document_id: str):
        """Delete document embedding from vector database"""
        if not self.collection:
            return
        
        try:
            self.collection.delete(ids=[document_id])
        except Exception as e:
            print(f"Error deleting embedding: {e}")
    
    def update_document_embedding(self, document_id: int, text: str, metadata: Dict):
        """Update document embedding"""
        self.delete_document(str(document_id))
        return self.add_document_embedding(document_id, text, metadata)
    
    def get_collection_stats(self) -> Dict:
        """Get collection statistics"""
        if not self.collection:
            return {}
        
        try:
            count = self.collection.count()
            return {
                'total_documents': count,
                'collection_name': 'documents'
            }
        except Exception as e:
            print(f"Error getting collection stats: {e}")
            return {}

# Global embedding service instance
embedding_service = EmbeddingService()