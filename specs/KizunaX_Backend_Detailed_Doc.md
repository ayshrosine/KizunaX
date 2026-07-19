# KizunaX — Backend Detailed Specification

Companion to `KizunaX_Database_Schema_and_Data_Flow.md` and
`KizunaX_Frontend_Detailed_Doc.md`. This document covers backend implementation:
folder structure, exactly which AI/ML models to use and how to call them, step-by-step
build instructions for each core feature, database/storage connection details, and how
the backend serves the frontend and the Cloudflare edge layer.

---

## 1. Project Structure

```
/app
  /routers            # HTTP layer ONLY — parse request, call a service, return
                       # response. No DB queries or AI calls directly in a router.
    auth_router.py
    documents_router.py
    library_router.py
    graph_router.py
    timeline_router.py
    search_router.py
    insights_router.py
    portfolio_router.py
    notifications_router.py
  /services            # business logic — orchestrates repositories + integrations
    auth_service.py
    upload_service.py
    extraction_service.py     # OCR + text extraction
    classification_service.py  # LLM categorization
    embedding_service.py        # ChromaDB read/write
    relationship_service.py      # similarity + LLM confirm + edge writing
    search_service.py
    insights_service.py
    portfolio_service.py
  /repositories          # ONLY layer that talks to MongoDB directly
    user_repository.py
    document_repository.py
    skill_repository.py
    relationship_repository.py
    timeline_repository.py
    notification_repository.py
    portfolio_repository.py
  /models                # Pydantic/Beanie schemas
    /db                    # Beanie Document models (mirrors the Database doc exactly)
    /requests               # request body schemas
    /responses               # response schemas
  /integrations             # external service clients, isolated behind an interface
    mongodb_client.py
    r2_client.py
    chroma_client.py
    llm_client.py             # wraps whichever LLM provider is configured
    ocr_client.py
  /workers                    # background job definitions (Celery/RQ/arq)
    process_document.py        # the full ingestion pipeline, as one job
  /middleware
    auth_middleware.py
    error_handler.py            # ONE centralized handler, consistent error shape
  /core
    config.py                    # all env vars loaded + validated here, nowhere else
    security.py                   # password hashing, JWT

Dependency direction: routers -> services -> repositories/integrations. Never skip a
layer. A router must never import a Beanie model directly and query it inline.
```

---

## 2. Database & Storage Connections

### 2.1 MongoDB (via Motor + Beanie)
```python
# core/mongodb_client.py
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.db import User, Document, Skill, Relationship, TimelineEvent, \
    Notification, ActivityLog, PortfolioSettings

async def init_db(settings):
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    await client.admin.command("ping")   # fail fast if unreachable
    await init_beanie(
        database=client[settings.MONGODB_DATABASE_NAME],
        document_models=[User, Document, Skill, Relationship, TimelineEvent,
                          Notification, ActivityLog, PortfolioSettings],
    )
```
**Critical:** import Beanie's base class under an alias to avoid any naming collision
with your own `Document` model:
```python
from beanie import Document as BeanieDocument
class Document(BeanieDocument):
    ...
```
This is a one-line fix that prevents an entire class of schema-inheritance bugs where
later models accidentally inherit from your app's `Document` instead of Beanie's base.

**ID handling rule, enforced everywhere in this layer:** every `userId`/`_id` used in
a query is the **string** form of the ObjectId. Repository functions accept
`user_id: str` and compare directly — never wrap it in `int(...)`.

### 2.2 ChromaDB (embedded, persistent)
```python
# integrations/chroma_client.py
import chromadb

class ChromaClient:
    def __init__(self, settings):
        self.client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
        self.collection = self.client.get_or_create_collection(
            name="kizunax_documents",
            metadata={"hnsw:space": "cosine"},
        )

    def upsert(self, doc_id: str, text: str, embedding: list[float], metadata: dict):
        assert "user_id" in metadata, "user_id is mandatory in Chroma metadata"
        self.collection.upsert(ids=[doc_id], embeddings=[embedding],
                                documents=[text], metadatas=[metadata])

    def query(self, query_embedding: list[float], user_id: str, n_results=10,
              extra_where: dict | None = None):
        where = {"user_id": user_id, **(extra_where or {})}
        return self.collection.query(query_embeddings=[query_embedding],
                                      n_results=n_results, where=where)
```
`settings.CHROMA_DB_PATH` must point at a **mounted, persistent volume** on whatever
host runs this process — confirm this explicitly in your deployment config, since
redeploying on ephemeral storage silently wipes every embedding and desyncs Chroma
from MongoDB (Section 2.3 in the Database doc covers the recovery path).

### 2.3 Cloudflare R2 (via boto3 S3-compatible client)
```python
# integrations/r2_client.py
import boto3
from botocore.client import Config

class R2Client:
    def __init__(self, settings):
        self.s3 = boto3.client(
            "s3", endpoint_url=settings.R2_ENDPOINT,
            aws_access_key_id=settings.R2_ACCESS_KEY,
            aws_secret_access_key=settings.R2_SECRET_KEY,
            config=Config(signature_version="s3v4"), region_name="auto",
        )
        self.bucket = settings.R2_BUCKET

    def object_key(self, user_id: str, document_id: str, filename: str) -> str:
        return f"users/{user_id}/{document_id}/{filename}"

    def upload(self, key: str, file_bytes: bytes, content_type: str):
        self.s3.put_object(Bucket=self.bucket, Key=key, Body=file_bytes,
                            ContentType=content_type)

    def signed_url(self, key: str, expires_in=300) -> str:
        return self.s3.generate_presigned_url(
            "get_object", Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expires_in)

    def delete(self, key: str):
        self.s3.delete_object(Bucket=self.bucket, Key=key)
```

### 2.4 How the frontend actually connects to this backend
```
Browser (Cloudflare Pages) --HTTPS-->
  Cloudflare Worker (JWT check, rate limit, security headers) --proxy-->
    FastAPI app (uvicorn, running on Render/Fly.io/a VM) --queries-->
      MongoDB Atlas / ChromaDB (same host) / Cloudflare R2 (via boto3)

CORS: FastAPI's CORSMiddleware allow_origins must list the exact Cloudflare Pages
domain (and localhost for dev) — never "*" once real user auth cookies/tokens are
involved.

Auth token delivery: the frontend sends `Authorization: Bearer <token>` on every
request; the Worker verifies the JWT signature/expiry before forwarding, and
FastAPI's `get_current_user` dependency verifies it again and resolves the actual
user document — defense in depth, not redundant.
```

---

## 3. AI/ML Models — What to Use and Why

```
LLM (categorization, field extraction, relationship confirmation, career-path
suggestions):
  - Use a hosted LLM API (Claude or GPT-4-class model) via a structured-output
    prompt — request JSON matching a strict schema (category enum, confidence
    float, extracted fields) and validate the response against that schema before
    trusting it. Never accept free-text category values.
  - Keep prompts short and single-purpose: one prompt for categorization, a
    separate one for relationship-type confirmation — don't combine unrelated
    tasks into one call, it makes failures harder to isolate and retry.

Embeddings (semantic search + relationship candidate detection):
  - Use one embedding model consistently for the life of a deployment (e.g. OpenAI
    text-embedding-3-small, or a local sentence-transformers model if you want to
    avoid a second external API dependency). Changing models later requires
    re-embedding every existing document — build the re-embed script (Section 5)
    from day one so this is never a blocker.

OCR (scanned certificates/images):
  - Tesseract (open-source, no per-call cost) is sufficient for typical certificate/
    resume scans. Only reach for a paid OCR API (AWS Textract, Google Vision) if
    Tesseract's accuracy on your actual test documents proves insufficient — measure
    this before adding a paid dependency, don't assume you need it.

Model-call isolation: every LLM/embedding/OCR call happens inside a background job
scoped to exactly one document and one user (Section 4) — never a batch call that
loops over "all documents" across users, which would both slow down individual
processing and risk cross-tenant context leaking into a single request.
```

---

## 4. Core Feature Implementation (step by step)

### 4.1 Upload & Ingestion Pipeline
```
1. Router (documents_router.py, POST /upload):
   - Validate file size/type against settings.
   - Call upload_service.create_upload(current_user, file).

2. upload_service.create_upload():
   - r2_client.upload(key, file_bytes, content_type)
   - document_repository.create(userId=current_user.id, storageKey=key,
       status="uploading")
   - enqueue background job: process_document.delay(document_id, user_id)
   - return { documentId, status: "uploading" }   # respond immediately, don't block
     on AI processing

3. Background worker (workers/process_document.py), scoped to ONE document:
   a. document_repository.update(id, status="extracting")
   b. extraction_service.extract(file) -> raw text (OCR fallback built in)
   c. classification_service.classify(text) -> { category, confidence, fields }
      -> validate category against the enum; if invalid or confidence too low,
         set status="classifying" with a "needs_review" flag rather than guessing
   d. document_repository.update(id, status="classifying", category=..., 
        extractedFields=...)
   e. embedding = embedding_client.embed(text)
      chroma_client.upsert(doc_id, text, embedding,
        metadata={"user_id": user_id, "category": category, ...})
   f. relationship_service.detect_for_document(document_id, user_id):
        - chroma_client.query(embedding, user_id, extra_where=exclude self)
        - for matches above threshold: llm_client.confirm_relationship(doc_a, doc_b)
        - relationship_repository.create(...) for confirmed matches
        - if any created: notification_repository.create(type="relationship_detected")
   g. document_repository.update(id, status="indexed", chromaVectorId=document_id)
   h. notification_repository.create(type="document_classified")

   On any exception in b-g: catch specifically (not a bare except-all), set
   status="failed" with a real failureReason string, and stop — do not leave a
   document silently stuck in an intermediate status forever.
```

### 4.2 Categorization Correction (re-tag)
```
Router: PATCH /documents/{id}/category
Service: verify document belongs to current_user (404 if not, never a silent
  no-op), update category, set categoryOverridden=true, log to activityLogs with
  the old and new value — this log is what lets you later measure real-world
  classification accuracy and spot systematic misclassification patterns.
```

### 4.3 Relationship Engine (also see 4.1.f)
```
This must be triggered automatically during ingestion (4.1), not only on-demand —
the audit's biggest finding on this feature was that the code existed but nothing
ever called it. Also expose an idempotent re-scan endpoint (POST
/graph/rescan) that re-runs detection across a user's existing documents — useful
after a bug fix or a threshold tuning change, without requiring a full re-upload.
```

### 4.4 Timeline
```
Compute on read from `documents` (status="indexed") joined conceptually with
`timelineEvents` — GET /timeline builds the response directly from MongoDB queries
(Section 5.4 in the Database doc). No separate "generate and cache" step is required
for an MVP; add caching only if read latency actually becomes a problem, and
invalidate the cache specifically on new document ingestion, not on a blanket timer.
```

### 4.5 Search
```
POST /search:
  1. Try a category fast-path: if the query contains "certificate(s)",
     "certification(s)" -> filter category="Certifications" directly and skip
     embedding entirely (faster, and more precise than semantic similarity for an
     exact category ask). Same pattern for "project(s)", "internship(s)", "skill(s)".
  2. Otherwise: embed the query, chroma_client.query(embedding, user_id=current_user),
     enrich each hit with its MongoDB document record (ownership re-verified here
     too, as defense in depth — but the Chroma filter is the primary enforcement,
     not this step).
  3. Return results with a short natural-language summary sentence generated by the
     LLM from the result set's categories/titles (small, cheap call) — this is what
     makes the search page feel conversational rather than a raw results list.
```

### 4.6 Insights (skill gaps, career paths)
```
GET /insights/gaps: pure MongoDB query — skills where hasEvidence=false (claimed on
  resume, no sourceDocumentIds) vs. skills with evidence but not marked onResume.
GET /insights/career-paths: one LLM call over the user's aggregated skill/category
  summary (not raw document text — keep this prompt small), cached in a new
  `careerPathSuggestions` field on the user or a small dedicated collection,
  regenerated only when the user's skill set has meaningfully changed (e.g. N new
  skills since last generation) rather than on every page load.
```

### 4.7 Portfolio
```
GET/PATCH /portfolio/settings, POST /portfolio/publish — straightforward CRUD over
`portfolioSettings` (Section 2.8 of the Database doc). The one behavior to get right:
GET /u/{username} (public route) must NEVER expose isPublished=false portfolios, and
must filter documents by both visibleCategories AND hiddenDocumentIds — test both
independently, since a document toggled hidden individually should stay hidden even
if its whole category is toggled visible.
```

---

## 5. Admin/Maintenance Endpoints (build these early, not as an afterthought)

```
POST /admin/rebuild-embeddings/{user_id}
  - Re-generates every ChromaDB vector for a user from MongoDB's extractedText.
    Needed after: switching embedding models, detecting Chroma/Mongo drift, or
    recovering from an ephemeral-storage wipe.

GET /admin/health
  - Checks MongoDB connectivity, Chroma collection accessibility, and R2 bucket
    reachability independently, returning which specific dependency is down rather
    than a single boolean — this is what you actually want paged on, not a generic
    "unhealthy."
```

---

## 6. Server / Deployment Configuration

```
- FastAPI + uvicorn on Render, Fly.io, or a plain VM — NOT Cloudflare Workers
  (Workers can't run Python or hold ChromaDB's persistent disk).
- Background jobs: Celery+Redis or a lighter arq/RQ setup, running as a separate
  worker process from the API process (so a slow OCR job never blocks API
  request-handling threads).
- Environment variables loaded and validated ONCE at startup in core/config.py —
  fail fast (raise on startup) if MONGODB_URI, a valid SECRET_KEY (not the
  placeholder default), or R2 credentials are missing, rather than failing
  confusingly on the first request that needs them.
- Cloudflare Worker in front of the origin handles: JWT verification, per-user rate
  limiting, and caching of genuinely static responses only (never user-specific
  document/search data) — see the Frontend doc Section 3 and the Database doc
  Section 5 for what crosses this boundary and when.
```
