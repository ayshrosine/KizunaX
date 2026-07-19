# KizunaX — Core Feature Rebuild Specification
### Multi-Tenant AI Digital Identity System · MongoDB + Cloudflare + ChromaDB

This document specifies a from-scratch rebuild of KizunaX's core features, informed
directly by the audit of your current repo (`github.com/ayshrosine/KizunaX`). Every
requirement below either implements one of the 5 problem-statement modules, or exists
specifically to prevent a bug already found in your current codebase — those are called
out inline as **"Audit fix:"** notes so nothing regresses back to the current behavior.

**Non-negotiables driving every decision in this doc:**
1. One database for one purpose each — no parallel/dead implementations (your current
   repo runs SQLite *and* MongoDB at once; this rebuild uses MongoDB only).
2. Every piece of user data is tenant-scoped, enforced server-side, at every layer —
   not just hidden in the UI.
3. The frontend calls real endpoints for every feature — no `setTimeout`-simulated
   flows, no hardcoded sample data standing in for a working feature.
4. IDs are strings end-to-end (MongoDB ObjectIds) — never cast to `int` anywhere.

---

## 1. Core Feature Requirements (the 5 modules)

### Module 1 — AI Data Ingestion
```
Accept: certificates, resumes, project reports, internship letters, portfolio links
(URL), other academic/professional documents. Formats: PDF, DOCX, TXT, PNG, JPG.

Functional requirements:
- Upload must actually transmit the file to the backend (Audit fix: current
  IngestionView.tsx never calls the API — this is priority zero).
- Backend validates size/type BEFORE uploading to storage, not after.
- Original file is preserved unmodified in Cloudflare R2 — the system never
  re-encodes, compresses, or discards the original in favor of only extracted text.
- Processing status is real and visible: Uploading → Extracting → Classifying →
  Indexed → (or Failed, with a human-readable reason, not a silently swallowed
  exception — Audit fix: current services catch-and-log broad exceptions instead of
  surfacing them).
- Scanned/image documents fall back to OCR automatically when direct text extraction
  yields too little content (this logic already exists correctly in
  `services/ingestion.py` — keep it, it's one of the few things already right).
```

### Module 2 — Intelligent Categorization
```
Categories (fixed enum, not free text): Projects, Skills, Certifications,
Internships, Achievements, Academics.

Functional requirements:
- Category is assigned by an LLM classification call, not a keyword guess —
  the current ai_service.py's OpenAI-based categorization approach is directionally
  right; keep the LLM-driven approach.
- Category field in the database is constrained to the enum above (Audit fix:
  current schema allows any string, and the upload fallback even writes
  "uncategorized" in lowercase, which matches nothing the frontend expects).
- Every classification returns and stores a confidence score.
- User can manually override the category from the Library view; overriding writes
  back to the same document record and is used as a (lightweight) signal to review
  categorization quality over time — it does not need to retrain a model, just log
  the correction for later review.
- Categorization must actually run and persist for every document (Audit fix:
  currently crashes via the `int(current_user.id)` bug and gets caught by a broad
  except block, silently leaving every document "failed"/"uncategorized" forever).
```

### Module 3 — Relationship Engine
```
Detect and store relationships across a user's own data only:
Certification → Skill, Skill → Project, Project → Internship, Internship → Career Path.

Functional requirements:
- Relationship detection actually runs as part of the ingestion pipeline (Audit fix:
  current `extract_and_save_relationships` exists but is never called from any route
  — it's dead code; the Knowledge Graph currently has no way to ever get data).
- Detection method: after a new document is embedded, query ChromaDB for the same
  user's existing documents above a similarity threshold (e.g. cosine distance <
  0.35), then optionally confirm/label the relationship type with an LLM call before
  writing an edge — this avoids the relationship logic depending on a second parallel
  in-memory pass over "all documents" (Audit fix: current `_get_document_skills`
  returns every skill in the entire database, unscoped by user or document, which is
  both wrong and a cross-user data leak).
- Relationships are stored with a confidence/strength score and an `aiGenerated`
  flag, so manually-added relationships (if ever supported later) are distinguishable
  from AI-detected ones.
- A claimed skill (e.g. from a resume) with zero linked evidence documents must be
  identifiable as a "gap" — this is a query over the relationship data, not a
  separate feature.
```

### Module 4 — Digital Journey Timeline
```
Auto-generated, year-grouped view of a user's milestones, sourced from their own
categorized documents (not a separate manually-maintained list, though manual
milestone entry can supplement it).

Functional requirements:
- Timeline generation reads only from MongoDB, computed on read (or cached and
  invalidated on new uploads) — do not maintain two separate implementations of the
  same generation logic (Audit fix: current repo has a full SQLite-based
  `generate_timeline()` in `services/timeline.py` that is unreachable dead code,
  while `api/timeline.py` reimplements the same logic again directly against
  MongoDB — pick one implementation and delete the other).
- Each milestone links back to its source document for one-click access to the
  original file.
- Sorting/grouping by year must handle documents with only an upload date (no
  extracted document date) gracefully — never crash on a missing `document_date`.
```

### Module 5 — Smart Retrieval System
```
Natural-language queries like "show all my certificates," "show my AI projects,"
"show my latest resume" — resolved via semantic search (ChromaDB) with pattern-based
shortcuts for common phrasings, falling back to general semantic search otherwise.

Functional requirements:
- Search always scopes to the requesting user only, enforced at the ChromaDB query
  level via a mandatory `user_id` metadata filter — never only "checked afterward"
  against MongoDB (Audit fix: current `search.py` never includes `user_id` in the
  Chroma filter dict at all; it happens to avoid leaking results today only because
  a later, separate, broken lookup silently drops mismatched results — this is not a
  safe isolation mechanism, it's an accident that depends on another bug).
- Every result links back to the original file, viewable/downloadable in its
  original format — never only a text snippet with no path back to the source file.
- Response time target: under 3 seconds for a typical query against a few hundred
  documents.
```

---

## 2. Multi-Tenancy Architecture & Data Isolation / Sandboxing

Multi-tenancy here means: many students share one deployed application and one set of
databases, but each student's data must be as inaccessible to other students as if they
were on entirely separate servers. This is enforced at **every layer independently** —
not just once at the API gateway — so that a bug in one layer can't expose another
tenant's data.

![Multi-Tenant Data Isolation](./KizunaX_tenant_isolation_diagram.png)

```
Layer-by-layer isolation rules:

1. Authentication layer
   - JWT payload contains only the user's ObjectId (`sub` claim) — never a role or
     permission that could be forged to impersonate another tenant.
   - Every protected route resolves `current_user` from the verified token, never
     from a client-supplied user_id in the URL, query string, or request body.

2. MongoDB layer
   - Every document-type collection (documents, skills, relationships, timeline
     events, notifications, activity logs, portfolio settings) has a required
     `userId` field.
   - Every repository-layer query function takes `current_user.id` as a mandatory
     parameter and filters by it — there is no "get all documents" function that
     omits a user filter, even internally.
   - Enforce this in code review / CI with a simple static check: any MongoDB query
     against a tenant-scoped collection that doesn't reference `current_user` in the
     same function should fail a lint check or a unit test.

3. ChromaDB layer
   - Single shared collection (not one Chroma collection per user — doesn't scale),
     isolated purely by a mandatory `user_id` field in every vector's metadata.
   - Every `.query()` call — search, relationship-detection, everything — includes
     `where={"user_id": current_user_id}` with no code path that omits it
     (Audit fix: this is exactly the gap in the current `search.py`/`embeddings.py`
     pairing — the service supports the filter and even warns when it's missing, but
     the caller never provides it).
   - Add an automated test that inserts two fake users' embeddings and asserts a
     query for User A's data, with User A's filter, never returns a User B vector —
     run this test on every deploy, not just once.

4. Cloudflare R2 layer
   - Object key pattern `users/{userId}/{documentId}/{filename}` — never a flat
     bucket structure where filenames alone could collide or be guessed.
   - Files are never public — every read goes through a signed URL, generated only
     after the backend verifies the requesting user owns that document's MongoDB
     record.

5. Cloudflare Worker (edge) layer
   - Verifies the JWT signature and expiry before any request reaches the origin —
     an invalid/missing token never reaches application code at all.
   - Rate-limits per authenticated user (not just per IP), so one tenant can't
     degrade service for others.

6. Sandboxing for AI processing
   - Background jobs (OCR, LLM classification, embedding) run with only the
     `userId` and `documentId` they were queued with — a job never has an API for
     "process all documents," only "process this one document belonging to this one
     user," so a bug in a background worker can't cross tenant boundaries by
     iterating over the wrong scope.
   - LLM calls (categorization, relationship confirmation) send only the current
     document's extracted text, never prior context from other users' documents —
     no shared conversation/session state across requests from different tenants.
```

---

## 3. Database Design (MongoDB — the only database)

Reusing and tightening the schema from the earlier architecture doc, with the audit
findings folded in directly (enum-constrained category, string IDs everywhere, no
SQLAlchemy models at all).

```javascript
// users
{
  _id: ObjectId,
  fullName: String,
  email: String,                 // unique, indexed
  passwordHash: String,
  authProvider: "local" | "google",
  isActive: Boolean,
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date,
}

// documents
{
  _id: ObjectId,
  userId: ObjectId,              // required, indexed — every query filters on this
  filename: String,
  originalFilename: String,
  storageKey: String,            // Cloudflare R2 key — NEVER the raw file bytes
  fileType: String,
  fileSizeBytes: Number,
  status: "uploading" | "extracting" | "classifying" | "indexed" | "failed",
  failureReason: String,          // nullable — human-readable, always set on failure
  category: "Projects" | "Skills" | "Certifications" | "Internships"
          | "Achievements" | "Academics",   // enum-constrained, no free text
  categoryConfidence: Number,
  categoryOverridden: Boolean,
  extractedText: String,
  extractedFields: { issuer, issueDate, organization, skillsDetected: [String] },
  chromaVectorId: String,          // == this document's _id, always in sync
  createdAt: Date,
  updatedAt: Date,
}
// Indexes: { userId: 1, category: 1 }, { userId: 1, createdAt: -1 },
//          text index on { extractedText: "text" }

// skills / relationships / timelineEvents / notifications / activityLogs /
// portfolioSettings — same shapes as the earlier architecture doc's Section 2,
// unchanged; the fix here is entirely about actually writing to these MongoDB
// collections instead of a parallel SQLite table, and never casting userId to int.
```

**Rule enforced everywhere:** `userId` fields are stored and compared as strings
(the string form of a MongoDB ObjectId) consistently across the entire codebase — one
representation, no conversions back and forth.

---

## 4. Backend Rebuild Plan

```
Layered structure (routers -> services -> repositories), same as the earlier
architecture doc's Section 5 — the two changes that matter most given the audit:

1. Delete entirely: core/database.py (SQLAlchemy models), init_db(), and every
   SQLite-touching function in categorization.py, relationships.py, timeline.py.
   Rewrite their logic against the MongoDB Beanie models instead — reusing the pure
   helper functions (category->event-type mapping, importance scoring) that don't
   touch a database at all.

2. Fix models/mongodb_models.py's import collision:
     from beanie import Document as BeanieDocument
   and change every model's inheritance to BeanieDocument explicitly, so Skill,
   DocumentRelationship, and TimelineEvent no longer accidentally inherit fields
   from the Document model.

3. Remove every int(...) cast around a user id or ObjectId anywhere in the backend.
   Grep the codebase for `int(current_user` and `int(.*\.id)` before considering
   this phase done — zero matches should remain.

4. Wire the upload pipeline to actually call relationship-detection after
   categorization succeeds, writing to MongoDB, so the Knowledge Graph has real data.

5. Add `user_id` to every ChromaDB write and every ChromaDB query filter, no
   exceptions.
```

---

## 5. AI/ML Accuracy Requirements

The problem statement's success metric — "I never have to search through folders
again" — depends entirely on categorization and retrieval actually being accurate, not
just present. Treat these as testable requirements, not aspirational goals:

```
Categorization:
- Use an LLM call (not keyword matching) with a structured-output prompt that returns
  exactly one of the 6 allowed categories plus a confidence score — never let the
  model return free text that isn't validated against the enum before saving.
- Target: correct category on first pass for at least 85% of clearly-labeled document
  types (a document literally titled "AWS Certified Solutions Architect.pdf" should
  never land in the wrong category) — build a small test set of ~20 sample documents
  per category and measure against it before considering this feature "done."
- When confidence is below a threshold (e.g. 0.6), surface it to the user as
  "needs review" rather than silently guessing — better to ask than to mis-file.

Relationship detection:
- Use embedding similarity as the candidate-generation step (fast, cheap), then an
  LLM call to confirm/label the relationship type only for candidates above the
  similarity threshold — don't call the LLM on every possible document pair, it
  won't scale and isn't necessary.
- Target: no relationship edges below a minimum confidence score are auto-created;
  store the score and let low-confidence links be filterable/hideable in the UI
  rather than cluttering the graph.

Semantic search:
- Embedding model choice should stay consistent for the lifetime of a deployment —
  changing embedding models later requires re-embedding all existing documents
  (build the `rebuild_embeddings` admin path from the earlier architecture doc so
  this is possible without a full data loss).
- Target: a query like "show all my certificates" returns 100% of the user's
  Certifications-category documents (this specific phrasing should hit the
  category-based fast path, not rely purely on semantic similarity, which is less
  reliable for exact category requests than a direct filter).
- Build a small regression test suite of 10-15 natural-language queries against a
  fixed seed dataset, and run it after any change to the categorization or embedding
  pipeline — this is the sanity check for "did I just make search worse."
```

---

## 6. Frontend — Rebuilt From Scratch (Minimalist, Real Data Only)

Your current frontend is a Stitch-generated "vault" themed shell with decorative
copy ("CONNECTING TUNNEL...", "DECRYPTING METADATA...") sitting over fake
`setTimeout`-driven flows and hardcoded sample data in most views. The rebuild below
intentionally drops the theme in favor of a plain, calm, functional interface — and
every screen must be wired to a real endpoint before it's considered complete.

### 6.1 Design Direction
```
Minimalist, calm, content-first — closer to a clean admin dashboard than a themed
product. No decorative flavor text standing in for real status ("Uploading 40%" not
"Decrypting metadata"). Neutral off-white/white surfaces, one accent color, plenty of
whitespace, clear typography hierarchy. Every loading state shows real progress from
a real request; every empty state explains what to do next; every error state shows
what actually went wrong, not a generic failure message.

Color: single navy/blue accent (#1c3a57), neutral greys, category colors used ONLY
for category pills/tags (Projects=blue, Skills=green, Certifications=amber,
Internships=purple, Achievements=teal, Academics=grey) — consistent everywhere a
category renders, never re-colored per-screen.

Typography: one sans-serif family, 2 weights (regular/bold), no more than 3 font
sizes on any single screen.
```

### 6.2 Screens to Rebuild (each MUST call a real endpoint, no mock fallback)
```
1. Login / Signup — calls /api/auth/login and /api/auth/register (already correct
   in the current LoginScreen.tsx — keep this one, it's real).
2. Dashboard — stat cards computed from real counts (GET /api/documents,
   GET /api/timeline), not decorative numbers.
3. Upload — MUST call a real upload endpoint with real multipart file transfer and
   real status polling. This is the single highest-priority screen to fix.
4. Library — real document list with real category filters, backed by
   GET /api/documents?category=&page=.
5. Knowledge Graph — real relationship data from GET /api/graph (once Module 3
   actually writes data — see Section 4, item 4).
6. Timeline — real milestones from GET /api/timeline.
7. Search — real natural-language queries against POST /api/search, not a scripted
   chat transcript.
8. Insights — real skill/gap analysis computed from actual relationship data.
9. Portfolio — real publish/visibility settings persisted via
   GET/PATCH /api/portfolio/settings.
10. Notifications/Activity — real events from GET /api/notifications.

Acceptance test for "is this screen actually done": open browser DevTools Network
tab, use the screen normally, and confirm every piece of data shown corresponds to
an actual request/response — if a number or list item can't be traced to a network
call, it's still a mock and the screen isn't finished.
```

### 6.3 Frontend/Backend Contract Fix
```
Rewrite api.ts's TypeScript interfaces to match the real MongoDB shapes:
  id: string        (not number)
  userId: string     (not number)
  ... for every model.
This alone prevents the parseInt(id) class of bug from being reintroduced — if the
type system says `id: string`, passing it into a function expecting a number becomes
a compile-time error instead of a silent runtime data-corruption bug.
```

---

## 7. Build Order (hand this to Devin as the top-level instruction)

```
Rebuild KizunaX in this order. Do not start a phase until the previous phase's
acceptance criteria pass.

PHASE 1 — Database consolidation
- Remove SQLite/SQLAlchemy entirely. Fix the Beanie Document name collision.
- Remove every int(...) cast on a user/document id across the whole backend.
- Acceptance: grep for `int(current_user` and `SQLAlchemy` returns zero results.

PHASE 2 — Core pipeline correctness
- Fix categorization to write to MongoDB with an enum-constrained category.
- Wire relationship-detection into the upload pipeline (Chroma similarity -> LLM
  confirm -> MongoDB edge).
- Add user_id to every ChromaDB write and query.
- Acceptance: upload 5 sample documents across different categories; confirm each
  lands in the correct category with confidence >0.6, and at least one relationship
  edge is created between two related documents (e.g. a certificate and a project
  mentioning the same skill).

PHASE 3 — Multi-tenant isolation verification
- Create two test users; upload distinct documents for each.
- Acceptance: User A's search, library, graph, and timeline endpoints NEVER return
  any of User B's data, verified by automated test, not manual spot-check.

PHASE 4 — Frontend rebuild
- Rebuild the 10 screens in Section 6.2 with the minimalist design direction,
  each wired to its real endpoint, no mock data remaining in any component.
- Acceptance: DevTools Network-tab trace test (Section 6.2) passes for every screen.

PHASE 5 — AI accuracy validation
- Run the categorization test set (Section 5) and the search regression suite.
- Acceptance: categorization hits the 85% target; all 10-15 search queries return
  the expected documents.

At the end of each phase, report pass/fail against that phase's acceptance criteria
before proceeding — "it doesn't crash" is not the bar, "it matches the acceptance
criteria" is.
```
