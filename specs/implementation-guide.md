# IdentityVault - Implementation Guide

## Code Organization

### Backend Structure

#### Core (`app/core/`)
- **config.py**: Application configuration and environment variables
- **database.py**: SQLAlchemy models and database initialization

#### API (`app/api/`)
- **upload.py**: File upload endpoints (single and bulk)
- **search.py**: Search endpoints (semantic, natural language, categories, skills)
- **timeline.py**: Timeline generation and relationship endpoints
- **documents.py**: Document CRUD operations

#### Services (`app/services/`)
- **ai_service.py**: OpenAI and Hugging Face integration for embeddings and categorization
- **embeddings.py**: ChromaDB vector database operations
- **ingestion.py**: File processing and text extraction
- **categorization.py**: Document categorization and skill extraction
- **relationships.py**: Document relationship extraction and storage
- **timeline.py**: Timeline event generation and persistence

#### Models (`app/models/`)
- Pydantic models for request/response validation (to be added)

#### Utils (`app/utils/`)
- Utility functions for file handling, validation, etc. (to be added)

### Frontend Structure

#### App (`src/app/`)
- **page.tsx**: Landing page with stats and features
- **layout.tsx**: Root layout with metadata
- **globals.css**: Global styles and Tailwind configuration
- **upload/page.tsx**: Document upload interface
- **search/page.tsx**: Smart search interface
- **timeline/page.tsx**: Digital journey timeline visualization

#### Components (`src/components/`)
- Reusable UI components (to be added)

#### Lib (`src/lib/`)
- **api.ts**: API client with typed functions
- **utils.ts**: Utility functions (cn for className merging)

## Key Implementation Details

### 1. AI Service Architecture

The AI service provides a unified interface for both OpenAI and Hugging Face models:

```python
class AIService:
    def __init__(self):
        self.openai_client = None  # OpenAI API client
        self.hf_model = None       # Hugging Face model
    
    def generate_embedding(self, text: str, use_openai: bool = True) -> List[float]:
        # Try OpenAI first, fallback to Hugging Face, then simple hash
```

**Embedding Strategy:**
1. Primary: OpenAI text-embedding-3-small (1536 dimensions)
2. Fallback: Hugging Face sentence-transformers (384 dimensions)
3. Last resort: Simple hash-based embedding

**Categorization Strategy:**
1. Complex: OpenAI GPT-4 for nuanced categorization
2. Fallback: Rule-based keyword matching

### 2. Vector Database Integration

ChromaDB is used for semantic search:

```python
class EmbeddingService:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
        self.collection = self.client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"}
        )
```

**Key Features:**
- Persistent storage on local filesystem
- Cosine similarity for vector comparisons
- Metadata filtering for category-based search
- Automatic collection creation

### 3. Document Processing Pipeline

The upload process follows this pipeline:

```
File Upload → File Validation → Text Extraction → 
Database Storage → AI Categorization → Embedding Generation → 
Vector Storage → Relationship Extraction → Timeline Update
```

**Text Extraction:**
- PDF: PyPDF2 for text extraction
- DOCX: python-docx for Word documents
- TXT: Direct file reading
- Images: Tesseract OCR (optional)

### 4. Relationship Engine

The relationship engine identifies connections between documents:

```python
def extract_and_save_relationships():
    # Get all processed documents
    # Extract relationships using AI
    # Save to database
```

**Relationship Types:**
- `LEADS_TO`: Certification leads to skill
- `REQUIRES`: Project requires skill
- `DEMONSTRATES`: Project demonstrates skill
- `PART_OF`: Internship part of career path
- `RELATED_TO`: General semantic relationship

**Current Implementation:**
- Skill-based matching (documents sharing skills are related)
- Future: AI-powered relationship inference

### 5. Timeline Generation

Timeline events are generated from document metadata:

```python
def generate_timeline():
    # Get all processed documents
    # Map categories to event types
    # Calculate importance scores
    # Group by year
    # Return chronological timeline
```

**Event Type Mapping:**
- Certifications → certification
- Projects → project
- Internships → internship
- Achievements → achievement
- Academics → academic

**Importance Scoring:**
- Base score: 1.0
- Category boost: +0.5 for certifications/achievements
- Organization boost: +0.2 if organization present
- Confidence multiplier: Based on categorization confidence

## Database Schema

### Documents Table
```sql
CREATE TABLE documents (
    id INTEGER PRIMARY KEY,
    filename VARCHAR(255),
    original_filename VARCHAR(255),
    file_path VARCHAR(500),
    file_size INTEGER,
    file_type VARCHAR(50),
    category VARCHAR(100),
    title VARCHAR(500),
    content TEXT,
    summary TEXT,
    upload_date DATETIME,
    document_date DATETIME,
    author VARCHAR(255),
    organization VARCHAR(255),
    embedding_id VARCHAR(255),
    categorization_confidence FLOAT,
    processing_status VARCHAR(50)
);
```

### Skills Table
```sql
CREATE TABLE skills (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) UNIQUE,
    category VARCHAR(100),
    confidence FLOAT,
    source_document_id INTEGER,
    created_at DATETIME
);
```

### Document Relationships Table
```sql
CREATE TABLE document_relationships (
    id INTEGER PRIMARY KEY,
    document_id INTEGER,
    related_document_id INTEGER,
    relationship_type VARCHAR(100),
    confidence FLOAT,
    metadata TEXT
);
```

### Timeline Events Table
```sql
CREATE TABLE timeline_events (
    id INTEGER PRIMARY KEY,
    document_id INTEGER,
    event_type VARCHAR(100),
    title VARCHAR(500),
    description TEXT,
    event_date DATETIME,
    end_date DATETIME,
    skills TEXT,
    importance FLOAT,
    created_at DATETIME
);
```

## API Design Patterns

### 1. Error Handling
```python
try:
    # Process request
    result = process_data()
    return result
except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
```

### 2. Async File Processing
```python
@router.post("/")
async def upload_document(file: UploadFile = File(...)):
    file_content = await file.read()
    # Process file
```

### 3. Database Sessions
```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## Frontend Patterns

### 1. API Client
```typescript
export const documentApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/upload/', formData);
    return response.data;
  }
};
```

### 2. State Management
```typescript
const [files, setFiles] = useState<File[]>([]);
const [uploading, setUploading] = useState(false);
const [results, setUploadResults] = useState<any[]>([]);
```

### 3. Responsive Design
```typescript
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Responsive grid */}
</div>
```

## Performance Optimization

### Backend
1. **Async Processing**: File uploads are processed asynchronously
2. **Connection Pooling**: SQLAlchemy session management
3. **Vector Indexing**: ChromaDB HNSW indexing for fast search
4. **Caching**: Future implementation for search results

### Frontend
1. **Code Splitting**: Next.js automatic code splitting
2. **Image Optimization**: Next.js Image component (future)
3. **Lazy Loading**: Components loaded on demand (future)

## Security Considerations

### Current Implementation
1. **File Validation**: Size limits and extension checking
2. **CORS**: Configured for specific origins
3. **SQL Injection**: SQLAlchemy ORM prevents SQL injection
4. **Input Validation**: Pydantic models for request validation

### Future Enhancements
1. **Authentication**: JWT token-based auth
2. **Rate Limiting**: Prevent API abuse
3. **File Scanning**: Malware detection for uploads
4. **HTTPS**: SSL/TLS encryption in production

## Testing Strategy

### Unit Tests
```python
def test_categorization():
    result = categorize_document("Python Certificate", "Certificate content")
    assert result["category"] == "Certifications"
```

### Integration Tests
```python
def test_upload_flow():
    response = client.post("/api/upload/", files={"file": test_file})
    assert response.status_code == 200
```

### E2E Tests
```typescript
test('upload and search', async ({ page }) => {
  await page.goto('/upload');
  await page.setInputFiles('input[type="file"]', testFile);
  await page.click('button[type="submit"]');
  await expect(page.locator('.success')).toBeVisible();
});
```

## Deployment Considerations

### Backend
1. **Containerization**: Docker image with Python dependencies
2. **Process Manager**: Gunicorn with Uvicorn workers
3. **Database**: Persistent volume for SQLite/ChromaDB
4. **Environment**: Environment variables for configuration

### Frontend
1. **Build**: Next.js production build
2. **Static Files**: Nginx for serving static assets
3. **API Proxy**: Next.js API routes or direct backend calls
4. **CDN**: Cloudflare/CloudFront for global distribution

## Monitoring and Logging

### Logging
```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info("Processing document: %s", document_id)
```

### Metrics
- API response times
- Search latency
- Upload processing time
- Categorization accuracy
- Storage usage

## Development Workflow

### 1. Backend Development
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### 2. Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### 3. Code Style
- Backend: Black formatting, Flake8 linting
- Frontend: ESLint, Prettier

### 4. Git Workflow
```bash
git add .
git commit -m "feat: add search functionality"
git push
```

## Troubleshooting Common Issues

### Backend Issues

**Issue**: OpenAI API fails
```bash
Solution: Check API key in .env file
Verify account has credits
Test with: python -c "from app.services.ai_service import test_openai_connection; test_openai_connection()"
```

**Issue**: ChromaDB initialization fails
```bash
Solution: Ensure data/chroma_db directory exists
Check write permissions
mkdir data\chroma_db
```

**Issue**: File upload fails
```bash
Solution: Check file size limit
Verify file extension is allowed
Check upload directory permissions
```

### Frontend Issues

**Issue**: API connection refused
```bash
Solution: Ensure backend is running
Check NEXT_PUBLIC_API_URL in .env.local
Verify CORS configuration
```

**Issue**: Build fails
```bash
Solution: Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

## Future Enhancements

### Short Term
1. Add user authentication
2. Implement file versioning
3. Add export functionality (PDF, JSON)
4. Improve relationship extraction with AI

### Long Term
1. Mobile application (React Native)
2. Collaboration features
3. Cloud sync integration
4. Advanced analytics dashboard
5. Resume generation
6. Portfolio website generation

## Contributing Guidelines

1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Use descriptive commit messages
5. Create feature branches from main
6. Submit pull requests for review