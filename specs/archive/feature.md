dentityVault — Rebuild Specification

Database Design · System Architecture · UI/UX · Testing Guide

Stack: MongoDB + Cloudflare + ChromaDB

This document is written to be handed directly to an AI coding agent (Devin or similar)
to fix the current messy implementation: no proper routing, no defined database schema,
no data-layer discipline, and no real UI/UX system. Every section below is a
self-contained prompt/spec block you can paste in individually, or hand over the whole
document as one master rebuild brief.


0. Important Stack Clarification (read first)

Before generating anything, understand where each piece of this stack actually runs —
mixing MongoDB, Cloudflare, and ChromaDB is fine, but they don't all live in the same
place, and getting this wrong is the #1 cause of a messy architecture.

- MongoDB Atlas        → your primary database. Runs as a managed cloud service,
                          connected to from your backend via connection string.
- ChromaDB              → needs a persistent process/disk. It CANNOT run inside
                          Cloudflare Workers (Workers are stateless/serverless with
                          no persistent filesystem). Run it embedded inside your
                          Python backend process (same server as FastAPI), or as its
                          own small container next to it.
- Cloudflare Workers     → use for edge concerns only: auth-token verification,
                          rate limiting, request caching, routing/redirects. Workers
                          run JS/TS/WASM — they do NOT run your Python/FastAPI backend
                          or OCR/embedding code directly.
- Cloudflare R2          → S3-compatible object storage. Use this to store the
                          ORIGINAL uploaded files (certificates, resumes, PDFs).
                          Zero egress fees, which matters once students start
                          downloading their own documents/portfolios often.
- Cloudflare Pages       → hosts your frontend (React/Next.js static or edge-rendered).
- Cloudflare Images      → optional, for generating/caching thumbnails of uploaded
                          documents without doing it yourself in Python.
- FastAPI backend        → your actual application server (routers, business logic,
                          OCR, LLM calls, ChromaDB). Runs on Render, Fly.io, Railway,
                          or a VM — NOT on Cloudflare Workers.

One-line architecture summary: Cloudflare sits at the edge (frontend hosting, file
storage, caching, basic security) in front of a normal Python application server that
holds your real logic, MongoDB connection, and embedded ChromaDB — this hybrid pattern
is common and is not a compromise, it's correct.


1. System Architecture Flow

Prompt: Design/implement the following request lifecycle for a document upload in
IdentityVault, using MongoDB + Cloudflare + ChromaDB exactly as scoped below. Implement
each numbered step as a distinct, testable function/service — do not collapse steps into
one giant handler.

1. Client (Cloudflare Pages) sends the file to POST /api/documents/upload on the FastAPI
   backend, through a Cloudflare Worker that first verifies the JWT and applies rate
   limiting (max 20 uploads/hour/user) before forwarding the request.

2. FastAPI validates file type/size, uploads the raw file directly to Cloudflare R2
   (using the S3-compatible API), and creates a `documents` record in MongoDB with
   status "uploading" and the R2 object key — NOT the file bytes — stored on the record.

3. FastAPI enqueues a background job (Celery/RQ/arq) with the document ID and returns
   an immediate 202 response with the document ID so the UI can show upload-queue
   progress without blocking on AI processing.

4. The background worker:
   a. Downloads the file from R2 (or streams it), runs OCR if it's a scanned/image
      document, and extracts raw text.
   b. Calls the LLM (Claude/GPT) to classify the document into a category and extract
      structured fields (issuer, date, skills, organization).
   c. Generates an embedding for the extracted text and upserts it into ChromaDB with
      metadata: { mongo_document_id, user_id, category, year }.
   d. Updates the MongoDB `documents` record: status → "indexed", category, extracted
      fields, and the ChromaDB vector id.
   e. Runs relationship-detection logic: queries ChromaDB for semantically similar
      existing documents belonging to the same user, and writes any new edges to the
      `relationships` collection in MongoDB.
   f. Writes a `notifications` record if a new relationship or skill gap was detected.

5. The frontend polls (or subscribes via WebSocket/SSE) GET /api/documents/{id}/status
   until status = "indexed", then refreshes the Library view.

Deliverable: implement steps 1-5 as separate, independently testable modules —
`upload_service`, `storage_service` (R2), `extraction_service` (OCR/LLM),
`embedding_service` (Chroma), `relationship_service`, `notification_service` — wired
together by a single orchestrator function, not inlined into the route handler.

Reference diagram:

Show Image

Text version of the same flow (generate this exact flow visually if producing architecture docs elsewhere):

Cloudflare Pages (frontend)
        │
        ▼
Cloudflare Worker (auth check, rate limit)
        │
        ▼
FastAPI Backend  ──────────────►  Cloudflare R2 (original file)
        │                                │
        ▼                                │
 MongoDB Atlas  ◄───────────────────────┘  (stores R2 key, not the file)
        │
        ▼
Background Worker: OCR → LLM classify → Embed
        │
        ├──► ChromaDB (embedded, same server) — semantic vectors
        └──► MongoDB — extracted fields, category, relationships, notifications


2. MongoDB Database Design

Prompt: Implement the following MongoDB schema for IdentityVault using Mongoose (or
Pydantic + Motor if staying fully async-Python). Every collection below must have
explicit schema validation (not "whatever gets sent"), the listed indexes, and
user-scoping enforced at the query layer — no endpoint should be able to return another
user's documents even if they guess an ID.

2.1 users

javascript{
  _id: ObjectId,
  fullName: String,            // required, 2-100 chars
  email: String,                // required, unique, lowercase, indexed
  passwordHash: String,         // null if OAuth-only
  authProvider: String,         // "local" | "google"
  googleId: String,             // null unless authProvider = "google"
  institution: String,          // optional
  avatarUrl: String,            // optional, R2/Cloudflare Images URL
  role: String,                 // "student" | "admin"  (default "student")
  emailVerified: Boolean,       // default false
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date,
}
// Indexes: { email: 1 } unique

2.2 documents

javascript{
  _id: ObjectId,
  userId: ObjectId,             // required, indexed — FK to users._id
  filename: String,             // original filename
  fileType: String,             // "pdf" | "docx" | "jpg" | "png"
  fileSizeBytes: Number,
  storageKey: String,           // Cloudflare R2 object key (NOT the file itself)
  storageUrl: String,           // signed/public URL, generated on read, not stored raw
  status: String,               // "uploading" | "extracting" | "classifying"
                                 // | "indexed" | "failed"
  category: String,             // "Projects" | "Skills" | "Certifications"
                                 // | "Internships" | "Achievements" | "Academics"
  categoryConfidence: Number,   // 0-1, from the classifier
  categoryOverridden: Boolean,  // true if user manually re-tagged
  extractedText: String,        // full OCR/parsed text, for fallback keyword search
  extractedFields: {
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    organization: String,
    skillsDetected: [String],
  },
  chromaVectorId: String,       // reference to the ChromaDB embedding
  ocrApplied: Boolean,
  isDeleted: Boolean,           // soft delete, default false
  createdAt: Date,
  updatedAt: Date,
}
// Indexes:
//   { userId: 1, category: 1 }
//   { userId: 1, createdAt: -1 }
//   { userId: 1, isDeleted: 1 }
//   text index on { filename: "text", extractedText: "text" }  — keyword fallback search

2.3 skills

javascript{
  _id: ObjectId,
  userId: ObjectId,             // indexed
  name: String,
  normalizedName: String,       // lowercase, trimmed — for dedupe/matching
  sourceDocumentIds: [ObjectId],
  confidenceScore: Number,
  onResume: Boolean,             // does this appear in the user's resume text
  hasEvidence: Boolean,          // computed: sourceDocumentIds.length > 0
  firstDetectedAt: Date,
  updatedAt: Date,
}
// Indexes: { userId: 1, normalizedName: 1 } unique compound

2.4 relationships (graph edges)

javascript{
  _id: ObjectId,
  userId: ObjectId,             // indexed
  sourceType: String,           // "skill" | "project" | "certification" | "internship"
  sourceId: ObjectId,
  targetType: String,
  targetId: ObjectId,
  relationshipType: String,     // "backs" | "leadsTo" | "derivedFrom"
  strength: Number,             // 0-1, similarity/confidence score
  aiGenerated: Boolean,
  createdAt: Date,
}
// Indexes: { userId: 1 }, { sourceId: 1 }, { targetId: 1 }

2.5 timelineEvents

javascript{
  _id: ObjectId,
  userId: ObjectId,             // indexed
  year: Number,
  month: Number,                 // nullable
  title: String,
  category: String,
  documentId: ObjectId,          // ref to documents
  description: String,           // AI-generated one-liner
  createdAt: Date,
}
// Indexes: { userId: 1, year: 1, month: 1 }

2.6 notifications

javascript{
  _id: ObjectId,
  userId: ObjectId,             // indexed
  type: String,                 // "document_classified" | "relationship_detected"
                                 // | "timeline_updated" | "skill_gap" | "portfolio_viewed"
  title: String,
  message: String,
  relatedDocumentId: ObjectId,   // nullable
  read: Boolean,                 // default false
  createdAt: Date,
}
// Indexes: { userId: 1, read: 1, createdAt: -1 }

2.7 activityLogs

javascript{
  _id: ObjectId,
  userId: ObjectId,             // indexed
  action: String,                // "upload" | "retag" | "delete" | "search" | "export"
  targetType: String,
  targetId: ObjectId,
  metadata: Object,              // free-form extra detail
  ipAddress: String,
  createdAt: Date,
}
// Indexes: { userId: 1, createdAt: -1 }
// TTL: consider auto-expiring logs older than 12 months

2.8 portfolioSettings

javascript{
  _id: ObjectId,
  userId: ObjectId,             // unique, indexed
  username: String,              // unique, indexed — used in /u/:username
  theme: String,
  visibleCategories: [String],
  hiddenDocumentIds: [ObjectId],
  isPublished: Boolean,
  publishedAt: Date,
  updatedAt: Date,
}
// Indexes: { username: 1 } unique, { userId: 1 } unique

2.9 sessions (refresh tokens, if not using stateless-only JWT)

javascript{
  _id: ObjectId,
  userId: ObjectId,             // indexed
  refreshTokenHash: String,
  deviceInfo: String,
  expiresAt: Date,
}
// TTL index: { expiresAt: 1 }, expireAfterSeconds: 0

Rules to enforce everywhere:
- Every query on a user-scoped collection MUST filter by the authenticated userId —
  never trust a userId passed in the request body/params for read/write scoping.
- Use Mongoose schema validation (required, enum, min/max) — reject invalid documents
  at the ODM layer, not just in frontend forms.
- Soft-delete documents (isDeleted flag) instead of hard-deleting, so relationships/
  timeline don't break; hard-delete only via an explicit admin/GDPR-erasure path.
- Never store the raw file in MongoDB — only the R2 storageKey.


3. ChromaDB Vector Layer Design

Prompt: Implement a single ChromaDB collection named "identityvault_documents" —
do not create one collection per user (that doesn't scale and complicates search
across categories). Isolate users via metadata filtering instead.

Collection schema:
- id: string = the MongoDB document's chromaVectorId (use the Mongo _id as the Chroma
  id directly, so they're always in sync — never generate a separate random id)
- embedding: vector, generated from `extractedText` (truncate/chunk if longer than the
  embedding model's context window — do not silently drop overflow text)
- metadata: {
    mongo_document_id: string,
    user_id: string,          // REQUIRED on every query filter — this is what
                               // prevents one student's search from ever surfacing
                               // another student's documents
    category: string,
    year: number,
    filename: string,
  }
- document: the extractedText itself (Chroma stores this alongside the vector for
  convenience — do not duplicate large blobs unnecessarily beyond this)

Query pattern for semantic search:
  results = collection.query(
      query_texts=[user_query],
      n_results=10,
      where={"user_id": current_user_id}   // mandatory filter, every single query
  )

Query pattern for relationship detection (after a new document is indexed):
  similar = collection.query(
      query_texts=[new_document_text],
      n_results=5,
      where={"user_id": current_user_id, "mongo_document_id": {"$ne": new_doc_id}}
  )
  # any result above a similarity threshold (e.g. cosine distance < 0.35) becomes a
  # candidate `relationships` edge, written to MongoDB — not stored in Chroma itself.

Persistence: use PersistentClient with the storage path on a MOUNTED, PERSISTENT VOLUME
on your app server (Render/Fly disk, or a mounted EBS volume) — confirm this explicitly,
since redeploys on ephemeral storage will silently wipe all embeddings and desync Chroma
from MongoDB.

Re-sync safety: implement a startup check that compares document count in MongoDB
(status="indexed") against vector count in Chroma for spot-checking drift, and a
`rebuild_embeddings` admin script that can regenerate the full Chroma collection from
MongoDB's extractedText field if they ever fall out of sync.


4. Cloudflare Configuration

Prompt: Configure the following Cloudflare resources for IdentityVault:

R2 Bucket ("identityvault-documents"):
- Private bucket (not public-read) — files are only accessible via short-lived signed
  URLs generated by the backend, never a permanent public link.
- Object key pattern: {userId}/{documentId}/{originalFilename} — keeps files
  logically grouped per user and avoids collisions.
- Enable versioning off (not needed for this use case, keeps costs/complexity down).
- Lifecycle rule: move to R2 infrequent access after 90 days of no reads (cost
  optimization, optional).

Cloudflare Worker ("api-gateway"):
- Sits in front of the FastAPI origin. Responsibilities ONLY:
  1. Verify the JWT from the Authorization header (signature + expiry) before
     forwarding — reject with 401 immediately if invalid, don't even hit the origin.
  2. Rate limit per user/IP using Workers KV or Durable Objects
     (e.g. 100 requests/min general, 20 uploads/hour).
  3. Cache GET responses that are safe to cache (e.g. static category lists) using
     the Cache API — never cache user-specific document lists or search results.
  4. Add security headers (CSP, X-Frame-Options, etc.) to every response.
- Do NOT put business logic, database calls, or AI calls in the Worker — proxy
  everything else straight through to the FastAPI origin unchanged.

Cloudflare Pages:
- Deploy the frontend build here with preview deployments on every PR branch.
- Environment variables (API base URL, public keys) injected at build time, never
  hardcoded.

Cloudflare Images (optional but recommended):
- Auto-generate a thumbnail variant for every uploaded image/PDF-first-page so the
  Library grid doesn't have to load full-resolution files.


5. Backend System Design (fixing the "messy" structure)

Prompt: Restructure the FastAPI backend into this layered structure. This is the #1
fix for a project with "no proper routing" — every concern below must live in its own
layer, and routers must never contain business logic or direct database queries.

/app
  /routers          # HTTP layer only — parse request, call a service, return response
    auth_router.py
    documents_router.py
    library_router.py
    graph_router.py
    timeline_router.py
    search_router.py
    insights_router.py
    portfolio_router.py
    notifications_router.py
  /services          # business logic — no HTTP or DB-driver specifics here
    auth_service.py
    upload_service.py
    extraction_service.py
    embedding_service.py
    relationship_service.py
    search_service.py
    portfolio_service.py
  /repositories       # ONLY layer that talks to MongoDB directly
    user_repository.py
    document_repository.py
    skill_repository.py
    relationship_repository.py
    notification_repository.py
  /models             # Pydantic schemas: request, response, and DB models — separated
    /requests
    /responses
    /db
  /integrations        # external service clients, isolated behind an interface
    r2_client.py
    chroma_client.py
    llm_client.py
    ocr_client.py
  /workers              # background job definitions (Celery/RQ tasks)
    process_document.py
  /middleware
    auth_middleware.py
    error_handler.py       # ONE centralized handler — every uncaught exception
                            # returns a consistent {error, code, requestId} shape,
                            # never a raw stack trace to the client
  /core
    config.py               # all env vars loaded and validated here, nowhere else
    security.py              # password hashing, JWT creation/verification

Rules to enforce:
- Routers depend on Services, Services depend on Repositories — never skip a layer
  (no router calling MongoDB directly "just this once").
- Every route requiring auth uses a shared `get_current_user` dependency — do not
  re-implement token parsing per-router.
- Every list/search endpoint is paginated (limit/offset or cursor) — never return
  an unbounded collection.
- All environment secrets (Mongo URI, R2 keys, LLM API keys) loaded via one config
  module and validated at startup — the app should fail fast on boot if a required
  secret is missing, not fail confusingly on the first request that needs it.

5.1 API Endpoint Reference

POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/forgot-password
GET    /api/users/me

POST   /api/documents/upload
GET    /api/documents/{id}/status
GET    /api/documents/{id}
PATCH  /api/documents/{id}/category
DELETE /api/documents/{id}

GET    /api/library?category=&year=&q=&page=&limit=

GET    /api/graph
GET    /api/graph/node/{type}/{id}

GET    /api/timeline

POST   /api/search              body: { query: string }

GET    /api/insights/skills
GET    /api/insights/gaps
GET    /api/insights/career-paths

GET    /api/portfolio/settings
PATCH  /api/portfolio/settings
POST   /api/portfolio/publish
GET    /api/u/{username}          # public, no auth

GET    /api/notifications
PATCH  /api/notifications/read-all
GET    /api/activity-log?page=&limit=


6. UI/UX Design Prompt

Note: I attempted to open your Stitch design link, but Stitch requires an authenticated
session to view project contents, so I could not read the specific frames/nodes from
that link. Paste the actual frame contents, screenshots, or the design tokens Stitch
generated here, and I'll align this section to match it exactly. In the meantime, the
following is a complete, stack-agnostic UI/UX prompt for the same 12 pages already
scoped for IdentityVault (see the earlier design-prompts document) — use it as-is,
or as the base to reconcile against your Stitch frames once shared.

Reuse the full IdentityVault_UI_UX_Design_Prompts.md deliverable already generated
for this project (Global Design System + all 12 pages + 10 popups). For this rebuild,
additionally enforce:

- Every list-rendering page (Library, Timeline, Search results, Notifications) must
  implement a loading skeleton state, an empty state, and an error state — not just
  the "happy path" with data. This is usually what makes an AI-generated UI feel
  unfinished — audit every screen for these three states explicitly.
- Every destructive action (delete document, unpublish portfolio) requires the
  Delete Confirmation modal — audit the current build for any delete button that
  fires immediately without confirmation.
- Category color-coding (defined in the Global Design System) must be applied
  consistently everywhere a category appears — pill badges, graph nodes, timeline
  markers, filter chips — audit for any place a category renders in a different,
  inconsistent color.
- Form validation errors render inline, below the field, not as a generic top-of-page
  banner only — audit signup/login/upload forms for this.


7. Master Rebuild Prompt (paste this whole block to Devin)

The current IdentityVault codebase has no clear routing structure, no defined database
schema, no consistent data management, and an unfinished UI/UX. Rebuild it against the
following spec, in this order, and do not proceed to the next phase until the current
one is passing its listed tests:

PHASE 1 — Database & Backend Foundation
- Implement the MongoDB schema exactly as defined in Section 2, with Mongoose/Pydantic
  validation and the listed indexes.
- Restructure the backend into the layered architecture in Section 5 (routers →
  services → repositories), migrating existing logic into the correct layer rather
  than rewriting from scratch where the logic itself is already correct.
- Implement the centralized error handler and auth middleware before any other route
  work continues.

PHASE 2 — Storage & AI Pipeline
- Wire up Cloudflare R2 for file storage per Section 4 — confirm no file bytes are
  ever written to MongoDB.
- Implement the background job pipeline in Section 1 (OCR → classify → embed →
  relationship-detect) as separate, independently callable functions.
- Set up ChromaDB exactly per Section 3, on a persistent volume, with the mandatory
  user_id metadata filter enforced on every query without exception.

PHASE 3 — API Completion
- Implement every endpoint listed in Section 5.1. Every endpoint must have request/
  response Pydantic models — no raw dict responses.
- Add pagination to every list endpoint.

PHASE 4 — Frontend & UX Completion
- Rebuild/complete each of the 12 pages against the UI/UX prompts, ensuring loading/
  empty/error states exist on every data-driven screen (Section 6).
- Implement all 10 popups/modals with correct open/close/focus-trap behavior.

PHASE 5 — Cloudflare Edge & Deployment
- Deploy frontend to Cloudflare Pages, backend to Render/Fly.io, configure the
  Cloudflare Worker for auth-check + rate-limiting only (Section 4).

At the end of each phase, run the corresponding tests from the Testing Guide below and
report pass/fail per test before moving on. Do not mark a phase complete based on the
app merely "not crashing" — it must satisfy the specific expected_behavior in each test.


8. Detailed Testing Guide

This extends the earlier IdentityVault testing prompts with checks specific to this
stack (MongoDB integrity, R2 storage, Chroma consistency, Cloudflare Worker behavior).

8.1 Database Integrity Tests

[ ] Every document created via POST /api/documents/upload has a valid ObjectId userId
    matching the authenticated user — attempt to spoof a different userId in the
    request body and confirm it is ignored/rejected, not honored.
[ ] Unique index on users.email is enforced — attempt duplicate signup, expect a
    clean 409 error, not a raw MongoDB duplicate-key exception leaking to the client.
[ ] Unique index on portfolioSettings.username is enforced — attempt to claim a
    taken username, expect a clear validation error.
[ ] Soft-deleting a document (isDeleted: true) removes it from Library/search results
    but does NOT delete its relationships/timeline entries silently (they should be
    handled explicitly — either cascaded or preserved with a "source deleted" flag).
[ ] All required-field validations reject malformed writes at the schema level —
    attempt to insert a document missing `userId` directly and confirm Mongoose/
    Pydantic rejects it before it reaches the database.
[ ] Query every user-scoped endpoint (documents, skills, notifications, activity log)
    as User A, then attempt the same request with User B's auth token but User A's
    resource ID in the URL — confirm a 403/404, never User A's data.

8.2 Cloudflare R2 / Storage Tests

[ ] Upload a file and confirm it lands in R2 under the expected key pattern
    ({userId}/{documentId}/{filename}), not in a flat/unorganized bucket root.
[ ] Confirm the MongoDB `documents` record stores only the storageKey, never raw
    file bytes or a permanently public URL.
[ ] Request a document's file URL and confirm it is a short-lived signed URL that
    expires (attempt to reuse it after expiry and confirm it fails).
[ ] Delete a document and confirm the corresponding R2 object is also removed
    (or explicitly retained per your soft-delete policy — but this must be a
    deliberate decision, not an orphaned file left behind unintentionally).
[ ] Attempt to upload a file over the size limit and confirm R2/backend rejects it
    with a clear error before any partial object is written.

8.3 ChromaDB Consistency Tests

[ ] After a document reaches status "indexed" in MongoDB, confirm a corresponding
    vector exists in ChromaDB with matching mongo_document_id metadata.
[ ] Run a semantic search as User A and confirm zero results ever belong to User B,
    even when User B has near-identical document content (tests the metadata filter
    is actually applied, not just present in code but unused).
[ ] Kill and restart the backend process; confirm ChromaDB data persists (validates
    the persistent volume is correctly mounted, not using in-memory mode by accident).
[ ] Run the `rebuild_embeddings` admin script against a test user and confirm the
    resulting vector count matches their indexed document count exactly.
[ ] Upload two clearly related documents (e.g. a Python certificate and a Python
    project report) for the same user and confirm a `relationships` edge is created
    in MongoDB after both are indexed.

8.4 Cloudflare Worker Tests

[ ] Send a request with no Authorization header to a protected endpoint through the
    Worker — confirm it's rejected with 401 at the edge (check that the FastAPI
    origin logs show the request never arrived, proving the Worker actually blocked
    it rather than passing through).
[ ] Send a request with an expired JWT — confirm 401 at the edge.
[ ] Exceed the configured rate limit (e.g. 21 uploads in an hour) — confirm the 21st
    request is rejected with 429, not forwarded to the origin.
[ ] Confirm cached responses (e.g. static category list) are served from Cloudflare
    cache on the second request (check the cf-cache-status header) and that
    user-specific endpoints (documents, search) are never cached.

8.5 End-to-End Regression

Run all 10 functional flows from the earlier IdentityVault AI Testing Prompts document
(Signup & First Upload, Category Correction, Semantic Search, Relationship Graph,
Timeline Export, Skill Gap Detection, Portfolio Publish, Notifications, Session
Timeout, Negative/Bad Input Handling) against the rebuilt system, plus the
Error-Category Checklist (console errors, UI breakage, frontend errors, backend
errors, functional errors) on every one of the 12 pages.