# IdentityVault - Architecture Documentation

## Overview
IdentityVault is an AI-powered Digital Identity System that transforms fragmented academic and professional data into a structured, searchable, and intelligent knowledge repository.

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **AI/ML**: 
  - OpenAI API for complex categorization and embeddings
  - Hugging Face transformers for local model inference
- **Vector Database**: ChromaDB for semantic search
- **Primary Database**: MongoDB with Motor (async driver) and Beanie ODM
- **Media Storage**: Cloudflare R2 (S3-compatible storage)
- **Document Processing**: PyPDF2, python-docx, textract

### Frontend
- **Framework**: Next.js 14 (React 18)
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**: React Context + Hooks
- **HTTP Client**: Axios
- **Visualization**: Recharts for timeline visualization

### Database
- **Vector Store**: ChromaDB (local or cloud)
- **Primary Database**: MongoDB for structured data and user management
- **Media Storage**: Cloudflare R2 for file storage with S3-compatible API

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Dashboard│  │ Upload   │  │ Search   │  │   Timeline   │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST API
┌───────────────────────────┴─────────────────────────────────┐
│                    Backend (FastAPI)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Layer (app/api/)                     │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │  │
│  │  │ Upload  │  │ Search  │  │ Retrieve│  │ Timeline│  │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Service Layer (app/services/)             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │ Ingestion│  │Categorize│  │ Relation │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │ Embedding│  │ Search   │  │ Timeline │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              AI/ML Layer (app/services/)              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │ OpenAI   │  │ Hugging  │  │ ChromaDB │          │  │
│  │  │ Service  │  │ Face     │  │ Client   │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                    Data Layer                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ChromaDB  │  │ MongoDB  │  │ Cloudflare│                  │
│  │(Vectors) │  │(Metadata)│  │    R2     │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. Data Ingestion Module
**Location**: `backend/app/services/ingestion.py`

**Responsibilities**:
- Accept file uploads (PDF, DOCX, TXT, images)
- Extract text content from documents
- Extract metadata (dates, titles, authors)
- Store original files in organized directory structure
- Trigger categorization and embedding processes

**Supported File Types**:
- Certificates: PDF, PNG, JPG
- Resumes: PDF, DOCX
- Project Reports: PDF, DOCX, TXT
- Internship Letters: PDF, DOCX
- Portfolio Links: URLs (stored as metadata)

### 2. Intelligent Categorization Module
**Location**: `backend/app/services/categorization.py`

**Responsibilities**:
- Analyze document content using AI
- Classify into categories: Projects, Skills, Certifications, Internships, Achievements, Academics
- Extract key information: dates, skills, organizations, descriptions
- Use mixed AI approach:
  - OpenAI GPT for complex categorization
  - Hugging Face models for faster classification

**Categories**:
- **Projects**: Code repositories, project reports, portfolios
- **Skills**: Technical and soft skills extracted from documents
- **Certifications**: Certificates, course completions, badges
- **Internships**: Internship letters, work experience
- **Achievements**: Awards, competitions, recognition
- **Academics**: Transcripts, degrees, courses

### 3. Relationship Engine Module
**Location**: `backend/app/services/relationships.py`

**Responsibilities**:
- Identify connections between different documents
- Build knowledge graph of user's journey
- Map relationships:
  - Certification → Skills gained
  - Skills → Projects using those skills
  - Projects → Internships/Career path
  - Academics → Skills → Projects
- Store relationships in graph structure

**Relationship Types**:
- `LEADS_TO`: Certification leads to skill
- `REQUIRES`: Project requires skill
- `DEMONSTRATES`: Project demonstrates skill
- `PART_OF`: Internship part of career path
- `RELATED_TO`: General semantic relationship

### 4. Smart Retrieval Module
**Location**: `backend/app/services/search.py`

**Responsibilities**:
- Semantic search using vector embeddings
- Natural language query processing
- Hybrid search (semantic + keyword)
- Category-based filtering
- Relevance ranking

**Search Capabilities**:
- "Show all my certificates"
- "Show my AI projects"
- "Show internship documents"
- "What skills did I learn in 2024?"
- "Projects using Python"

### 5. Digital Journey Timeline Module
**Location**: `backend/app/services/timeline.py`

**Responsibilities**:
- Extract temporal data from all documents
- Create chronological timeline
- Group by time periods (year, month)
- Identify milestones and achievements
- Generate timeline data structure for visualization

**Timeline Events**:
- Certification completions
- Project submissions
- Internship start/end dates
- Academic achievements
- Skill acquisition periods

## Data Flow

### Upload Flow
```
User Upload → API → R2 Storage → Text Extraction → 
Categorization → Embedding Generation → Vector DB → 
MongoDB Metadata → Relationship Extraction → Timeline Update → Response
```

### Search Flow
```
User Query → API → Query Processing → 
Vector Search (ChromaDB) → Metadata Filter (MongoDB) → 
Ranking → Results → Response
```

### Timeline Flow
```
Request → API → Timeline Service → 
Data Aggregation (MongoDB + R2 URLs) → 
Chronological Ordering → Relationship Enrichment → 
Timeline Generation → Response
```

## File Organization

### Backend Structure
```
backend/
├── app/
│   ├── api/              # API endpoints
│   │   ├── auth.py        # Authentication endpoints
│   │   ├── upload.py      # Document upload with R2
│   │   ├── search.py      # Semantic search
│   │   ├── timeline.py    # Timeline generation
│   │   └── documents.py   # Document CRUD
│   ├── core/             # Core configuration
│   │   ├── config.py      # Settings and environment variables
│   │   ├── security.py    # JWT authentication
│   │   ├── mongodb.py     # MongoDB connection and Beanie init
│   │   └── database.py    # Legacy SQLite (retained for compatibility)
│   ├── models/           # MongoDB document models
│   │   └── mongodb_models.py  # Beanie ODM models
│   ├── services/         # Business logic
│   │   ├── ingestion.py
│   │   ├── categorization.py
│   │   ├── relationships.py
│   │   ├── search.py
│   │   ├── timeline.py
│   │   ├── embeddings.py
│   │   └── ai_service.py
│   └── utils/            # Utilities
│       └── r2_storage.py  # Cloudflare R2 storage client
├── data/                 # Application data
│   ├── uploads/          # Temporary upload directory
│   └── chroma_db/        # Vector database
├── main.py              # Application entry point
├── requirements.txt      # Python dependencies
├── .env                 # Environment variables
└── .env.example         # Environment variables template
```

### Frontend Structure
```
frontend/
├── src/
│   ├── app/             # Next.js app directory
│   │   ├── page.tsx     # Home page
│   │   ├── layout.tsx   # Root layout
│   │   ├── dashboard/
│   │   ├── upload/
│   │   ├── search/
│   │   └── timeline/
│   ├── components/      # React components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── Dashboard.tsx
│   │   ├── Upload.tsx
│   │   ├── Search.tsx
│   │   ├── Timeline.tsx
│   │   └── DocumentCard.tsx
│   ├── lib/             # Utilities
│   │   ├── api.ts       # API client
│   │   └── utils.ts
│   └── styles/          # Global styles
├── public/              # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## API Endpoints

### Upload
- `POST /api/upload` - Upload document
- `GET /api/documents` - List all documents
- `GET /api/documents/{id}` - Get specific document
- `DELETE /api/documents/{id}` - Delete document

### Search
- `POST /api/search` - Semantic search
- `GET /api/search/categories` - Get categories
- `GET /api/search/skills` - Get all skills

### Timeline
- `GET /api/timeline` - Get digital journey timeline
- `GET /api/timeline/relationships` - Get document relationships

### Analytics
- `GET /api/analytics/overview` - Get overview statistics
- `GET /api/analytics/skills` - Get skills distribution
- `GET /api/analytics/categories` - Get category distribution

## Environment Variables

### Backend (.env)
```
# MongoDB Configuration
MONGODB_URI=mongodb+srv://your_username:your_password@your-cluster.mongodb.net/
MONGODB_DATABASE_NAME=identityvault

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY=your_r2_access_key
R2_SECRET_KEY=your_r2_secret_key
R2_BUCKET=your_r2_bucket_name
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
HUGGINGFACE_MODEL=sentence-transformers/all-MiniLM-L6-v2

# ChromaDB Configuration
CHROMA_DB_PATH=./data/chroma_db

# Application Configuration
UPLOAD_DIR=./data/uploads
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=pdf,docx,txt,png,jpg,jpeg
CORS_ORIGINS=http://localhost:3000
SECRET_KEY=your-secret-key-change-in-production
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## AI/ML Implementation Details

### Embeddings
- **Primary**: OpenAI text-embedding-3-small (1536 dimensions)
- **Fallback**: Hugging Face sentence-transformers/all-MiniLM-L6-v2 (384 dimensions)
- **Storage**: ChromaDB with cosine similarity

### Categorization
- **Complex**: OpenAI GPT-4 for nuanced categorization
- **Simple**: Hugging Face zero-shot classification for faster processing
- **Confidence Threshold**: 0.7 for auto-categorization

### Relationship Extraction
- **Method**: Named Entity Recognition + Rule-based patterns
- **AI Enhancement**: GPT-4 for complex relationship inference
- **Graph Storage**: MongoDB DocumentRelationship collection

## Security Considerations

1. **File Upload Validation**
   - File type verification
   - Size limits (10MB default)
   - Malware scanning integration point

2. **API Security**
   - CORS configuration
   - Rate limiting
   - Input validation
   - SQL injection prevention

3. **Data Privacy**
   - Local-first storage (optional cloud sync)
   - No data shared with third parties
   - User-controlled data deletion

## Performance Optimization

1. **Caching**
   - Embedding cache
   - Search result caching
   - Timeline generation cache

2. **Async Processing**
   - Background task for categorization
   - Async file processing
   - Batch embedding generation

3. **Database Optimization**
   - ChromaDB indexing
   - SQLite query optimization
   - Connection pooling

## Scalability Considerations

1. **Horizontal Scaling**
   - Stateless API design
   - Shared ChromaDB storage
   - Load balancer ready

2. **Cloud Migration Path**
   - ChromaDB → Pinecone/Weaviate
   - MongoDB → MongoDB Atlas (already cloud-ready)
   - R2 → Any S3-compatible storage

## Monitoring & Logging

1. **Application Logging**
   - Structured logging (JSON)
   - Log levels: DEBUG, INFO, WARNING, ERROR
   - Request/response logging

2. **Performance Metrics**
   - API response times
   - Search latency
   - Upload processing time
   - Categorization accuracy

## Testing Strategy

1. **Unit Tests**
   - Service layer logic
   - AI/ML model mocking
   - Utility functions

2. **Integration Tests**
   - API endpoints
   - Database operations
   - File processing pipeline

3. **E2E Tests**
   - Upload flow
   - Search functionality
   - Timeline generation

## Deployment

### Development
- Backend: `uvicorn main:app --reload`
- Frontend: `npm run dev`

### Production
- Backend: Docker container with Gunicorn
- Frontend: Next.js build with Nginx
- Database: Persistent volume mounts

## Future Enhancements

1. **Multi-language Support**
2. **Collaboration Features**
3. **Cloud Sync Integration**
4. **Mobile Application**
5. **Advanced Analytics**
6. **Export Functionality (PDF, JSON)**
7. **Resume Generation**
8. **Portfolio Website Generation**