# IdentityVault - API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication
Currently, the API does not require authentication. In production, implement JWT or OAuth2.

## Endpoints

### Health Check

#### GET /health
Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

---

## Document Upload

### POST /api/upload/
Upload a single document.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `file` (File)

**Response:**
```json
{
  "id": 1,
  "filename": "uuid_original_filename.pdf",
  "category": "Certifications",
  "status": "completed",
  "message": "Document uploaded and processed successfully"
}
```

**Error Response:**
```json
{
  "detail": "File size exceeds limit"
}
```

---

### POST /api/upload/bulk
Upload multiple documents.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `files` (File[])

**Response:**
```json
{
  "total": 3,
  "successful": 2,
  "failed": 1,
  "results": [
    {
      "filename": "document1.pdf",
      "success": true,
      "data": {
        "id": 1,
        "category": "Projects"
      }
    },
    {
      "filename": "document2.pdf",
      "success": false,
      "error": "Processing failed"
    }
  ]
}
```

---

## Document Management

### GET /api/documents/
Get all documents with optional filtering.

**Query Parameters:**
- `category` (optional): Filter by category
- `limit` (optional): Maximum number of results (default: 100)

**Response:**
```json
[
  {
    "id": 1,
    "filename": "uuid_cert.pdf",
    "original_filename": "certificate.pdf",
    "category": "Certifications",
    "title": "Python Certification",
    "summary": "Certificate for completing Python course",
    "upload_date": "2024-01-15T10:30:00",
    "document_date": "2024-01-10T00:00:00",
    "organization": "Coursera",
    "processing_status": "completed"
  }
]
```

---

### GET /api/documents/{id}
Get a specific document by ID.

**Path Parameters:**
- `id`: Document ID

**Response:**
```json
{
  "id": 1,
  "filename": "uuid_cert.pdf",
  "original_filename": "certificate.pdf",
  "category": "Certifications",
  "title": "Python Certification",
  "summary": "Certificate for completing Python course",
  "upload_date": "2024-01-15T10:30:00",
  "document_date": "2024-01-10T00:00:00",
  "organization": "Coursera",
  "processing_status": "completed"
}
```

**Error Response:**
```json
{
  "detail": "Document not found"
}
```

---

### DELETE /api/documents/{id}
Delete a document.

**Path Parameters:**
- `id`: Document ID

**Response:**
```json
{
  "message": "Document deleted successfully"
}
```

---

## Search

### POST /api/search/
Semantic search for documents.

**Request Body:**
```json
{
  "query": "Python machine learning projects",
  "category": "Projects",
  "limit": 10
}
```

**Response:**
```json
{
  "query": "Python machine learning projects",
  "total_results": 5,
  "results": [
    {
      "id": 1,
      "title": "ML Project",
      "filename": "ml_project.pdf",
      "category": "Projects",
      "summary": "Machine learning project using Python",
      "upload_date": "2024-01-15T10:30:00",
      "document_date": "2024-01-10T00:00:00",
      "similarity_score": 0.95,
      "content_preview": "This project implements..."
    }
  ]
}
```

---

### GET /api/search/categories
Get all document categories.

**Response:**
```json
["Projects", "Skills", "Certifications", "Internships", "Achievements", "Academics"]
```

---

### GET /api/search/skills
Get all extracted skills.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Python",
    "category": "technical",
    "confidence": 0.9
  },
  {
    "id": 2,
    "name": "Machine Learning",
    "category": "technical",
    "confidence": 0.85
  }
]
```

---

### GET /api/search/natural/{query}
Natural language search with query interpretation.

**Path Parameters:**
- `query`: Natural language query (URL encoded)

**Examples:**
- `/api/search/natural/Show%20all%20my%20certificates`
- `/api/search/natural/What%20AI%20projects%20do%20I%20have%3F`

**Response:**
```json
{
  "query": "Show all my certificates",
  "total_results": 3,
  "results": [...]
}
```

---

## Timeline

### GET /api/timeline
Get digital journey timeline.

**Response:**
```json
{
  "events": [
    {
      "document_id": 1,
      "event_type": "certification",
      "title": "Python Certification",
      "description": "Certificate for completing Python course",
      "event_date": "2024-01-10T00:00:00",
      "end_date": null,
      "category": "Certifications",
      "organization": "Coursera",
      "importance": 1.5
    }
  ],
  "grouped": {
    "2024": [
      {
        "document_id": 1,
        "event_type": "certification",
        "title": "Python Certification",
        "description": "Certificate for completing Python course",
        "event_date": "2024-01-10T00:00:00",
        "end_date": null,
        "category": "Certifications",
        "organization": "Coursera",
        "importance": 1.5
      }
    ]
  },
  "total_events": 1
}
```

---

### GET /api/timeline/relationships
Get document relationships.

**Response:**
```json
{
  "relationships": [
    {
      "id": 1,
      "relationship_type": "RELATED_TO",
      "confidence": 0.8,
      "document": {
        "id": 1,
        "title": "Python Certification",
        "category": "Certifications"
      },
      "related_document": {
        "id": 2,
        "title": "ML Project",
        "category": "Projects"
      }
    }
  ],
  "total": 1
}
```

---

### GET /api/timeline/persisted
Get cached timeline from database.

**Response:**
```json
{
  "events": [...],
  "grouped": {...},
  "total_events": 10
}
```

---

## Data Models

### Document
```typescript
{
  id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  file_type: string;
  category: string;
  title: string;
  content: string;
  summary: string;
  upload_date: string;
  document_date?: string;
  author?: string;
  organization?: string;
  embedding_id?: string;
  categorization_confidence?: number;
  processing_status: string;
}
```

### Skill
```typescript
{
  id: number;
  name: string;
  category: string;
  confidence: number;
  source_document_id?: number;
  created_at: string;
}
```

### TimelineEvent
```typescript
{
  id: number;
  document_id: number;
  event_type: string;
  title: string;
  description: string;
  event_date: string;
  end_date?: string;
  skills?: string[];
  importance: number;
  created_at: string;
}
```

### DocumentRelationship
```typescript
{
  id: number;
  document_id: number;
  related_document_id?: number;
  relationship_type: string;
  confidence: number;
  metadata?: string;
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid input, file too large, etc.) |
| 404 | Resource Not Found |
| 500 | Internal Server Error |

---

## Rate Limiting
Currently not implemented. Add rate limiting for production use.

## CORS
CORS is enabled for `http://localhost:3000` by default. Configure in backend `.env` file.

## File Upload Limits
- Maximum file size: 10MB (configurable)
- Supported formats: PDF, DOCX, TXT, PNG, JPG, JPEG
- Files are stored in `backend/data/uploads/` organized by category

## Search Features
- Semantic search using vector embeddings
- Category filtering
- Natural language query processing
- Similarity scoring (0-1 range)

## Timeline Features
- Automatic event extraction from documents
- Chronological ordering
- Year-based grouping
- Importance scoring
- Multiple event types: certification, project, internship, achievement, academic