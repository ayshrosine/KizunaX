# IdentityVault - AI Workflow and Architecture Diagram

## System Workflow

### 1. Document Upload Workflow

```
┌─────────────┐
│   User      │
│  Uploads    │
│   File      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         FastAPI Backend             │
│  ┌───────────────────────────────┐  │
│  │   File Validation             │  │
│  │   - Size Check                │  │
│  │   - Extension Check           │  │
│  │   - Type Verification         │  │
│  └───────────────┬───────────────┘  │
│                  │                  │
│                  ▼                  │
│  ┌───────────────────────────────┐  │
│  │   File Storage               │  │
│  │   - Save to temp directory    │  │
│  │   - Generate unique filename  │  │
│  └───────────────┬───────────────┘  │
│                  │                  │
│                  ▼                  │
│  ┌───────────────────────────────┐  │
│  │   Text Extraction            │  │
│  │   - PDF: PyPDF2              │  │
│  │   - DOCX: python-docx        │  │
│  │   - TXT: Direct read         │  │
│  │   - Images: Tesseract OCR    │  │
│  └───────────────┬───────────────┘  │
│                  │                  │
│                  ▼                  │
│  ┌───────────────────────────────┐  │
│  │   Database Storage           │  │
│  │   - Create document record   │  │
│  │   - Store metadata            │  │
│  │   - Set status: processing   │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│       AI Processing Layer           │
│  ┌───────────────────────────────┐  │
│  │   Categorization             │  │
│  │   - OpenAI GPT-4 analysis    │  │
│  │   - Extract: category         │  │
│  │   - Extract: skills          │  │
│  │   - Extract: dates           │  │
│  │   - Extract: organization    │  │
│  │   - Generate summary         │  │
│  └───────────────┬───────────────┘  │
│                  │                  │
│                  ▼                  │
│  ┌───────────────────────────────┐  │
│  │   Skill Extraction           │  │
│  │   - Parse extracted skills   │  │
│  │   - Categorize skills        │  │
│  │   - Save to database         │  │
│  └───────────────┬───────────────┘  │
│                  │                  │
│                  ▼                  │
│  ┌───────────────────────────────┐  │
│  │   Embedding Generation       │  │
│  │   - OpenAI embeddings        │  │
│  │   - OR HuggingFace embeddings │  │
│  │   - Generate vector           │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│       Vector Database               │
│  ┌───────────────────────────────┐  │
│  │   ChromaDB Storage            │  │
│  │   - Store embedding          │  │
│  │   - Store metadata           │  │
│  │   - Index for search         │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│       Relationship Engine           │
│  ┌───────────────────────────────┐  │
│  │   Relationship Extraction    │  │
│  │   - Analyze document pairs   │  │
│  │   - Find common skills       │  │
│  │   - Identify connections     │  │
│  │   - Save relationships       │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│       Timeline Generation            │
│  ┌───────────────────────────────┐  │
│  │   Event Creation              │  │
│  │   - Extract dates             │  │
│  │   - Map to event types        │  │
│  │   - Calculate importance      │  │
│  │   - Group by year             │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│       File Organization             │
│  ┌───────────────────────────────┐  │
│  │   File Movement               │  │
│  │   - Move to category dir      │  │
│  │   - Update database path      │  │
│  │   - Set status: completed     │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│         Response                     │
│  ┌───────────────────────────────┐  │
│  │   Return to user              │  │
│  │   - Document ID               │  │
│  │   - Category                  │  │
│  │   - Processing status         │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 2. Search Workflow

```
┌─────────────┐
│   User      │
│  Enters     │
│  Query      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         Frontend                    │
│  ┌───────────────────────────────┐  │
│  │   Query Processing            │  │
│  │   - Detect natural language   │  │
│  │   - Extract keywords          │  │
│  │   - Apply filters             │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│         Search API                  │
│  ┌───────────────────────────────┐  │
│  │   Query Analysis              │  │
│  │   - Parse query               │  │
│  │   - Identify intent           │  │
│  │   - Apply category filter     │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│      Embedding Generation            │
│  ┌───────────────────────────────┐  │
│  │   Query Embedding             │  │
│  │   - Generate query vector     │  │
│  │   - Use OpenAI/HF model       │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│       Vector Search                  │
│  ┌───────────────────────────────┐  │
│  │   ChromaDB Query              │  │
│  │   - Cosine similarity search  │  │
│  │   - Apply metadata filters    │  │
│  │   - Return top N results      │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│       Result Enrichment              │
│  ┌───────────────────────────────┐  │
│  │   Database Lookup             │  │
│  │   - Get document details      │  │
│  │   - Add metadata              │  │
│  │   - Calculate similarity      │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│       Ranking & Filtering            │
│  ┌───────────────────────────────┐  │
│  │   Result Processing           │  │
│  │   - Sort by similarity        │  │
│  │   - Apply relevance threshold │  │
│  │   - Format for display       │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│         Response                     │
│  ┌───────────────────────────────┐  │
│  │   Return Results              │  │
│  │   - Document titles           │  │
│  │   - Similarity scores         │  │
│  │   - Category information      │  │
│  │   - Content previews          │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 3. Timeline Generation Workflow

```
┌─────────────┐
│   User      │
│  Requests   │
│  Timeline   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│       Timeline API                  │
│  ┌───────────────────────────────┐  │
│  │   Data Aggregation            │  │
│  │   - Get all documents         │  │
│  │   - Get relationships         │  │
│  │   - Get skills                │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│       Event Extraction               │
│  ┌───────────────────────────────┐  │
│  │   Document Analysis          │  │
│  │   - Extract dates            │  │
│  │   - Map categories to types  │  │
│  │   - Identify milestones     │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│       Event Enrichment               │
│  ┌───────────────────────────────┐  │
│  │   Metadata Addition          │  │
│  │   - Add organization info     │  │
│  │   - Add related skills       │  │
│  │   - Add connections          │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│       Importance Scoring             │
│  ┌───────────────────────────────┐  │
│  │   Score Calculation          │  │
│  │   - Base score: 1.0           │  │
│  │   - Category boost            │  │
│  │   - Organization boost        │  │
│  │   - Confidence multiplier     │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│       Chronological Ordering         │
│  ┌───────────────────────────────┐  │
│  │   Time Sorting                │  │
│  │   - Sort by event date        │  │
│  │   - Handle missing dates     │  │
│  │   - Use upload date fallback  │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│       Year Grouping                  │
│  ┌───────────────────────────────┐  │
│  │   Time Buckets                 │  │
│  │   - Group by year              │  │
│  │   - Count events per year     │  │
│  │   - Create hierarchy          │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│       Relationship Integration       │
│  ┌───────────────────────────────┐  │
│  │   Connection Mapping          │  │
│  │   - Add related events        │  │
│  │   - Show skill connections    │  │
│  │   - Display career path       │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│       Database Persistence           │
│  ┌───────────────────────────────┐  │
│  │   Timeline Storage            │  │
│  │   - Save events to DB         │  │
│  │   - Update on changes         │  │
│  │   - Enable caching            │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│         Response                     │
│  ┌───────────────────────────────┐  │
│  │   Timeline Data               │  │
│  │   - Events array              │  │
│  │   - Grouped by year           │  │
│  │   - Total count               │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## AI/ML Architecture

### Embedding Pipeline

```
┌─────────────────────────────────────┐
│       Input Text                    │
│  "Python machine learning project"  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    Text Preprocessing               │
│  ┌───────────────────────────────┐  │
│  │   - Lowercasing                │  │
│  │   - Tokenization              │  │
│  │   - Stop word removal         │  │
│  │   - Special character handling│  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│    Model Selection                  │
│  ┌───────────────────────────────┐  │
│  │   Primary: OpenAI              │  │
│  │   text-embedding-3-small      │  │
│  │   (1536 dimensions)           │  │
│  └───────────────┬───────────────┘  │
│                  │                   │
│                  ▼                   │
│         ┌──────────────────┐         │
│         │ Fallback: HF      │         │
│         │ all-MiniLM-L6-v2 │         │
│         │ (384 dimensions) │         │
│         └────────┬─────────┘         │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│    Embedding Generation              │
│  ┌───────────────────────────────┐  │
│  │   - Neural network pass       │  │
│  │   - Vector generation         │  │
│  │   - Normalization             │  │
│  │   - Quality check             │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│    Vector Storage                   │
│  ┌───────────────────────────────┐  │
│  │   ChromaDB collection         │  │
│  │   - HNSW indexing            │  │
│  │   - Cosine similarity        │  │
│  │   - Metadata association      │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│    Search Operations                │
│  ┌───────────────────────────────┐  │
│  │   - Query embedding           │  │
│  │   - Vector similarity search   │  │
│  │   - Top-k retrieval           │  │
│  │   - Distance calculation      │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Categorization Pipeline

```
┌─────────────────────────────────────┐
│       Document Input                │
│  Title + Content + Metadata         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    Content Analysis                 │
│  ┌───────────────────────────────┐  │
│  │   - Title analysis            │  │
│  │   - Content scanning          │  │
│  │   - Keyword extraction        │  │
│  │   - Pattern recognition       │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│    AI Processing                    │
│  ┌───────────────────────────────┐  │
│  │   OpenAI GPT-4 Analysis       │  │
│  │   - Category classification    │  │
│  │   - Skill extraction          │  │
│  │   - Date extraction            │  │
│  │   - Organization detection    │  │
│  │   - Summary generation         │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│    Fallback Processing              │
│  ┌───────────────────────────────┐  │
│  │   Rule-based categorization   │  │
│  │   - Keyword matching           │  │
│  │   - Pattern matching          │  │
│  │   - Heuristic rules           │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│    Confidence Scoring               │
│  ┌───────────────────────────────┐  │
│  │   - AI confidence score       │  │
│  │   - Rule confidence score     │  │
│  │   - Combined confidence       │  │
│  │   - Threshold check           │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│    Result Processing                 │
│  ┌───────────────────────────────┐  │
│  │   - Category assignment        │  │
│  │   - Skill categorization      │  │
│  │   - Date normalization        │  │
│  │   - Summary refinement        │  │
│  └───────────────┬───────────────┘  │
└──────────────────┼──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│    Database Update                  │
│  ┌───────────────────────────────┐  │
│  │   - Update document record   │  │
│  │   - Save skills               │  │
│  │   - Update metadata           │  │
│  │   - Set processing status     │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Data Flow Architecture

### Complete Data Flow

```
┌──────────────┐
│   User       │
│  Interface   │
└──────┬───────┘
       │
       │ HTTP/REST
       ▼
┌──────────────────┐
│   FastAPI        │
│   Backend        │
└──────┬───────────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│   SQLite     │  │  ChromaDB    │
│  Database    │  │  Vector DB   │
└──────────────┘  └──────────────┘
       │                 │
       └────────┬────────┘
                │
                ▼
       ┌──────────────┐
       │  File System │
       │  Storage     │
       └──────────────┘
```

### AI Service Integration

```
┌──────────────┐
│  Application │
│    Layer     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  AI Service  │
│   Manager    │
└──────┬───────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌──────────────┐ ┌──────────────┐
│   OpenAI     │ │ Hugging Face │
│    API       │ │   Local      │
└──────────────┘ └──────────────┘
       │              │
       └──────┬───────┘
              │
              ▼
     ┌──────────────┐
     │  Embeddings  │
     │  & Results   │
     └──────────────┘
```

## Technology Stack Integration

### Backend Technologies

```
┌─────────────────────────────────────┐
│         FastAPI Framework           │
│  - Async/await support               │
│  - Automatic API documentation      │
│  - Type hints & validation          │
└──────────────┬──────────────────────┘
               │
               ├─────────────────┐
               │                 │
               ▼                 ▼
┌──────────────────┐  ┌──────────────────┐
│   SQLAlchemy     │  │   Pydantic       │
│   ORM            │  │   Validation     │
└──────────────────┘  └──────────────────┘
```

### AI/ML Technologies

```
┌─────────────────────────────────────┐
│         AI Services                  │
└──────────────┬──────────────────────┘
               │
               ├──────────────────┐
               │                  │
               ▼                  ▼
┌──────────────────┐  ┌──────────────────┐
│   OpenAI API      │  │ Hugging Face     │
│   - GPT-4         │  │ - Transformers   │
│   - Embeddings    │  │ - Sentence-BERT  │
└──────────────────┘  └──────────────────┘
```

### Frontend Technologies

```
┌─────────────────────────────────────┐
│         Next.js Framework            │
│  - React 18                          │
│  - Server Components                 │
│  - File-based routing                │
└──────────────┬──────────────────────┘
               │
               ├──────────────────┐
               │                  │
               ▼                  ▼
┌──────────────────┐  ┌──────────────────┐
│   Tailwind CSS   │  │   Axios          │
│   - Utility-first│  │   HTTP Client    │
│   - Responsive   │  │   API Calls      │
└──────────────────┘  └──────────────────┘
```

## Performance Optimization

### Caching Strategy

```
┌──────────────┐
│   Request    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Cache Check │
└──────┬───────┘
       │
       ├──────────┐
       │          │
       ▼          ▼
┌──────────┐ ┌──────────┐
│   Hit    │ │  Miss    │
└────┬─────┘ └────┬─────┘
     │            │
     ▼            ▼
┌──────────┐ ┌──────────────┐
│ Return   │ │ Process &   │
│ Cached   │ │ Cache Result│
└──────────┘ └──────────────┘
```

### Async Processing

```
┌──────────────┐
│   Upload     │
│  Request     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Quick Save  │
│  (Response)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Background  │
│   Processing │
│  - AI tasks  │
│  - Embedding │
│  - Relations │
└──────────────┘
```

## Security Architecture

### Input Validation

```
┌──────────────┐
│   User Input │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Validation  │
│  - Type check│
│  - Size limit│
│  - Format    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Sanitization│
│  - XSS prev. │
│  - SQL inj.  │
│  - File sec. │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Processing  │
└──────────────┘
```

### Data Protection

```
┌──────────────┐
│  Data at     │
│  Rest        │
│  - Encryption│
│  - Access    │
│    Control   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Data in     │
│  Transit     │
│  - HTTPS     │
│  - TLS       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Data        │
│  Processing  │
│  - Memory    │
│    Security  │
│  - Temp      │
│    File      │
│    Cleanup   │
└──────────────┘
```