# KizunaX — Codebase Audit Report

Reviewed directly from `github.com/ayshrosine/KizunaX` (backend FastAPI + MongoDB/Beanie +
ChromaDB, frontend React/Vite, clearly Stitch-generated UI). This is an evidence-based
audit — every finding below references the exact file and line/logic that causes it.

**Bottom line up front:** the backend has one dominant bug (ObjectId vs integer ID
mismatch) that breaks most single-document operations, it's running two separate,
disconnected databases at once, and the frontend's core AI features — upload, search,
graph, insights, portfolio — are not wired to the backend at all. This isn't a handful
of small bugs; it's an incomplete integration between three parallel implementations
(an old SQLite design, a newer MongoDB design, and a Stitch-generated UI shell) that
were never fully reconciled.

---

## 1. Critical — App-Breaking Bugs

### 1.1 MongoDB ObjectId vs `int()` type mismatch (breaks most endpoints)
Your `User.id` and `Document.id` are MongoDB ObjectIds — strings like
`"65fa3b2c1e4a2f0012ab34cd"` — but 7 places in the backend call `int(current_user.id)`
on them, which raises `ValueError` on virtually every real request:

```
backend/app/api/documents.py:70   Document.user_id == int(current_user.id)   # GET /{id}
backend/app/api/documents.py:104  Document.user_id == int(current_user.id)   # PUT /{id}
backend/app/api/documents.py:128  Document.user_id == int(current_user.id)   # DELETE /{id}
backend/app/api/search.py:53      Document.user_id == int(current_user.id)   # search
backend/app/api/search.py:84      Document.find(Document.user_id == int(...))# categories
backend/app/api/search.py:96      Skill.find(Skill.user_id == int(...))      # skills
backend/app/api/upload.py:101     categorize_document(..., int(current_user.id)) # upload
```

**Practical effect:** viewing a single document, editing its category, deleting it,
searching, listing categories, listing skills, and the categorization step of upload —
all throw a 500 error for every user, every time. This is very likely the single
biggest reason "nothing works right." `Document.user_id` is also declared as
`Indexed(str)` in the schema (`mongodb_models.py:26`) — so even conceptually, comparing
it against an `int` is comparing the wrong types, not just a runtime crash waiting to
happen once "fixed" naively.

**Fix:** remove every `int(...)` cast around an ObjectId/user id anywhere in the
backend — compare as `str(current_user.id)` consistently, matching what
`documents.py`'s `GET /` (list) and `timeline.py` already correctly do. Add a lint rule
or a code-review checklist item: *ObjectId fields are never cast to `int`.*

### 1.2 Beanie model class shadows its own base class
`backend/app/models/mongodb_models.py`:
```python
from beanie import Document, Indexed
...
class Document(Document):        # <- redefines the name "Document"
    ...
class Skill(Document):           # <- now inherits from YOUR Document model,
                                  #    not beanie.Document, because the name was
                                  #    rebound above
class DocumentRelationship(Document):   # same issue
class TimelineEvent(Document):          # same issue
```
Because `Document` is redefined in the same module, every model declared *after* it
(`Skill`, `DocumentRelationship`, `TimelineEvent`) inherits from your app's `Document`
model instead of Beanie's base class. That means `Skill`, `DocumentRelationship`, and
`TimelineEvent` all silently inherit `Document`'s fields — `filename`, `original_filename`
(required, no default), `r2_key`, `category`, etc. — fields that make no sense on a
Skill or a Relationship, and some of which are *required*, which can cause validation
failures or silently-present junk fields depending on how Beanie resolves the schema.

**Fix:** rename the import to avoid the collision, e.g.
`from beanie import Document as BeanieDocument`, and have every model inherit from
`BeanieDocument` explicitly. This is a one-line-per-class fix but it's foundational —
fix it before anything else, since it affects every non-Document collection's schema.

### 1.3 Frontend upload never calls the backend
`frontend/src/components/IngestionView.tsx` has **zero** references to `apiClient`.
The entire upload flow — "CONNECTING TUNNEL...", "DECRYPTING METADATA...", success
state — is a `setTimeout`-driven animation with no network request at all:
```
grep apiClient IngestionView.tsx   → no matches
grep setTimeout IngestionView.tsx  → drives the fake progress states
```
And in `App.tsx`, the handler that receives the "uploaded" document confirms this
explicitly in its own comment:
```javascript
const handleAddDocument = async (newDoc: Document) => {
  // In a real implementation, this would upload the file to the backend
  // For now, just add to local state
  setDocuments((prev) => [newDoc, ...prev]);
  ...
```
**Practical effect:** no file a user selects in the UI is ever sent to the backend, ever
ends up in R2, MongoDB, or ChromaDB. The core feature of the entire product — upload →
AI categorize — does not exist end-to-end today, independent of whether the backend
bugs above are fixed.

**Fix:** wire `IngestionView`'s file input to `apiClient.uploadDocument(file)` (already
defined in `api.ts` conventions used elsewhere), show real progress from the actual
upload request, and call `fetchInitialData()` (or a targeted refetch) on success instead
of only updating local React state.

### 1.4 `parseInt()` on a MongoDB ObjectId (silent data corruption, not just a crash)
`App.tsx`:
```javascript
await apiClient.deleteDocument(parseInt(id));
```
`id` is a MongoDB ObjectId string. `parseInt("65fa3b2c...")` doesn't throw — it silently
parses only the leading digit characters and returns a truncated, wrong number (or
`NaN` if the string starts with a letter). This is worse than a crash: it fails
*quietly*, sending a garbage ID to the backend, which then 404s or — in a worse
scenario, if IDs ever collided — could act on the wrong document.

**Fix:** keep IDs as strings end-to-end on the frontend; `api.ts`'s own type
definitions (`BackendDocument.id: number`) are themselves wrong (see 2.3) and are
likely what encouraged this `parseInt` call in the first place.

---

## 2. Database & Data Management Issues

### 2.1 Two separate, disconnected databases running at once
`backend/main.py` initializes **both** SQLite (SQLAlchemy) and MongoDB (Beanie) on
startup:
```python
init_db()              # SQLite — comment literally says "legacy, for compatibility"
await init_mongodb()   # MongoDB — comment says "primary database"
```
But it's not actually legacy-and-unused — three services still write exclusively to
SQLite:
```
services/categorization.py   → writes Skill rows to SQLite
services/relationships.py    → writes DocumentRelationship rows to SQLite
services/timeline.py         → reads/writes TimelineEvent rows in SQLite
```
...while every API route reads from MongoDB. Concretely:
- `upload.py` calls `categorize_document(...)` (section 1.1), which — when it doesn't
  crash on the `int()` cast — would save extracted skills into **SQLite**, but
  `search.py`'s `/skills` endpoint reads skills from **MongoDB**. Skills saved by
  categorization can never be seen by the Skills UI, even in principle.
- `services/relationships.py`'s `extract_and_save_relationships()` is **never called
  from any API route** — it's dead code. The Knowledge Graph / Relationship Engine
  feature has no code path that ever populates it in MongoDB, where `timeline.py`
  actually reads relationships from (`get_all_relationships_for_user`). Relationships
  will always be an empty list.
- `services/timeline.py` (SQLite) is also largely dead code — `api/timeline.py`
  reimplements timeline generation directly against MongoDB instead of calling it,
  reusing only 3 pure helper functions from it. You effectively have two full
  implementations of "generate a timeline," one of which (SQLite) is unreachable.

**Fix:** pick MongoDB as the only database (per your own "primary database" comment)
and delete `core/database.py`'s SQLAlchemy models, `init_db()`, and every SQLite-based
service function. Rewrite `categorization.py` and `relationships.py` to write to the
Beanie/MongoDB `Skill` and `DocumentRelationship` models — matching what `timeline.py`
already correctly does — and actually call `extract_and_save_relationships`-equivalent
logic from the upload pipeline so the graph ever gets populated.

### 2.2 `_get_document_skills` returns every user's skills, unscoped
`services/relationships.py`:
```python
def _get_document_skills(document_id: int, db: Session) -> List[str]:
    """Get skills associated with a document"""
    # This is a simplified version - in production, you'd have a proper document-skill relationship
    skills = db.query(Skill).all()   # <- no filter by document_id OR user_id at all
    return [skill.name for skill in skills]
```
Even setting aside that this function is currently unreachable (2.1), if it were wired
up it would return every skill from every user in the database for every document,
regardless of which document or user is asking. This is a cross-user data leak
combined with meaningless output (a document's "skills" would just be the entire
system's skill list).

### 2.3 Frontend/backend type contracts don't match the real schema
`frontend/src/api.ts`:
```typescript
export interface User {
  id: number;          // actual backend: string (ObjectId)
  ...
}
export interface BackendDocument {
  id: number;           // actual backend: string (ObjectId)
  user_id: number;       // actual backend: string (ObjectId)
  ...
}
```
These TypeScript interfaces describe the *old SQLite integer-ID* shape, not what the
MongoDB backend actually returns. This is almost certainly what led to the `parseInt()`
bug in 1.4 — the types told the developer (or the AI writing the code) that IDs were
numbers. Any code trusting these types to do numeric operations on an ID
(sort, comparison, math) will misbehave.

**Fix:** change every `id`/`*_id` field in `api.ts` to `string`, then let TypeScript's
compiler surface every place currently assuming a number so they can be fixed
individually, rather than finding them one crash at a time in production.

### 2.4 No schema-level required-field discipline enforced beyond Pydantic defaults
Several MongoDB fields that should always be present are optional in practice, e.g.
`Document.category: Indexed(str)` has no default and no enum constraint — nothing stops
a document being saved with an arbitrary free-text category string that won't match any
of the category pills/filters the frontend expects (`Projects`, `Skills`,
`Certifications`, `Internships`, `Achievements`, `Academics`). Combine this with
`upload.py`'s fallback `category="uncategorized"` (lowercase, not in that enum set) and
you get documents that will never render correctly in any category-based filter.

**Fix:** constrain `category` to a `Literal[...]`/enum type in the Beanie model so
invalid values are rejected at the database layer, not just hoped for by convention.

### 2.5 ChromaDB metadata omits `user_id` at the actual call site
`services/embeddings.py` itself is written defensively — it warns if `user_id` is
missing from metadata and if a search filter lacks `user_id`. But the one place that
calls it, `upload.py`, does exactly that:
```python
embedding_service.add_document_embedding(
    str(document.id),
    document.content,
    {"category": document.category, "title": document.title, "filename": document.original_filename}
    # no "user_id" key here
)
```
And `search.py`'s `filter_dict` only ever contains `category`, never `user_id`. The
service-level warnings you already wrote in the code are firing on every request — they
were never acted on. Semantic search is currently querying across **all users'**
embeddings; it only avoids leaking content in the final response because of a
after-the-fact MongoDB ownership check (which itself is broken by the `int()` bug in
1.1, meaning search is doubly broken right now).

**Fix:** always include `user_id` when writing to Chroma, and always pass it in every
`search_similar` filter — never rely on a downstream re-check to enforce isolation that
should happen at the vector-query layer itself.

---

## 3. Frontend / Backend Integration Gaps

Checked every view component for backend calls directly:

| Component | Calls `apiClient`? | Status |
|---|---|---|
| `LoginScreen.tsx` | Yes | Real — login/register work |
| `App.tsx` (documents, timeline fetch) | Yes | Real, but breaks on single-doc ops (1.1) |
| `IngestionView.tsx` (upload) | **No** | Fake — `setTimeout` only (1.3) |
| `GraphView.tsx` | **No** | Static/mock data only |
| `InsightsView.tsx` | **No** | Static/mock data only |
| `SearchChatView.tsx` | **No** | Static/mock data only |
| `LibraryView.tsx` | **No** (receives props from App) | Depends on App's fetch |
| `PortfolioView.tsx` | **No** | Static/mock data only |
| `TimelineView.tsx` | **No** (receives props from App) | Depends on App's fetch |

Roughly half the app's *named* features (Knowledge Graph, Insights, Search, Portfolio)
are currently pure UI shells over `data.ts`'s hardcoded sample content — regardless of
whether the backend endpoints for them work, the frontend never calls them.

`data.ts` and inline image URLs throughout components (`App.tsx`, `LibraryView.tsx`,
etc.) reference `https://lh3.googleusercontent.com/aida-public/...` — these are
Stitch/Google AI-Studio-generated placeholder image URLs, hosted on Google's
infrastructure, not your own asset pipeline. They're fine for a prototype but are an
external dependency you don't control — if Google ever invalidates those links, every
icon/badge in the app breaks at once, and they should be replaced with real bundled
assets (SVG icon set, or your own R2/Cloudflare Images-hosted defaults) before this
goes anywhere near production.

---

## 4. Backend Structural / Code-Quality Issues

- **No layered architecture.** Routes in `api/*.py` contain business logic directly
  (DB queries, R2 calls, embedding calls) inline in the route handler instead of
  delegating to a service layer. `upload.py`'s single route handler does file
  validation, R2 upload, temp-file writing, text extraction, categorization, embedding,
  and error cleanup all in one function — hard to test, hard to reuse, hard to find
  where a given piece of logic lives.
- **Broad `except Exception` swallowing real bugs.** Nearly every service function
  catches all exceptions and prints/logs a message, then returns an empty result or
  `{"status": "error"}`. This is why bugs like the `int()` cast (1.1) and the invalid
  `metadata=` kwarg (below) don't surface as loud failures — they're caught, logged to
  console (which nobody's watching in production), and the endpoint just returns
  something that looks like "no results" instead of a real error.
- **`DocumentRelationship(..., metadata=json.dumps(...))`** in `services/relationships.py`
  passes a `metadata` keyword to a SQLAlchemy declarative model constructor, but the
  actual mapped column is named `additional_data`. `metadata` is also a reserved
  attribute on SQLAlchemy's declarative base itself. This would raise a `TypeError` on
  every call — moot right now since the function is dead code (2.1), but it needs
  fixing as part of the SQLite-removal/MongoDB-migration anyway.
- **Insecure defaults with no startup validation.** `config.py` defaults
  `SECRET_KEY = "your-secret-key-change-in-production"` and `MONGODB_URI = ""`,
  `OPENAI_API_KEY = ""`, R2 credentials `""` — the app boots successfully even with
  these empty, and only fails deep inside a request when something tries to use them.
  There's no startup check that fails fast with a clear error if required secrets are
  missing or if `SECRET_KEY` is still the placeholder value.
- **No pagination guard rails.** `GET /api/documents/` accepts `limit` with no
  server-side maximum — a client (or a bug) passing a very large limit returns
  unbounded results.
- **Inconsistent async/sync boundaries.** `embedding_service.add_document_embedding` is
  a synchronous function called without `await` from an `async def` route — it works
  because it's not itself a coroutine, but it means embedding generation blocks the
  event loop during the request instead of running as a background task, contradicting
  the "In production, this should be a background task" comment left directly above it
  in `upload.py`.

---

## 5. UI/UX Issues (Stitch-generated shell)

- **No loading/empty/error states beyond the initial fetch.** `App.tsx` has one global
  `loading` flag for the initial document/timeline fetch, but individual views
  (Library, Search, Graph) have no per-view loading skeleton, empty-state illustration,
  or error message — if `fetchInitialData` fails, the console gets an error and the UI
  just silently shows empty lists with no explanation to the user.
- **"Vault" theming obscures real state.** Copy like "CONNECTING TUNNEL...",
  "DECRYPTING METADATA...", "Shred and declassify file" (delete handler comment) is a
  nice thematic touch, but combined with the fake `setTimeout` upload flow (1.3), it
  actively misleads the user into believing a real upload/processing pipeline ran when
  nothing was sent anywhere.
- **No confirmation modal wired for delete.** `handleDeleteDocument` fires immediately
  on call — check whether `LibraryView.tsx` gates this behind a confirmation click, or
  whether a single click deletes permanently; if the latter, that's a UX risk worth
  fixing regardless of the backend bug in the same function.
- **Category taxonomy mismatch between frontend and backend.** The frontend's mock
  categories (`Academic`, `Professional`, `Design`) don't match the backend's intended
  categories (`Projects`, `Skills`, `Certifications`, `Internships`, `Achievements`,
  `Academics`) — once real data flows through, the color-coding/pill logic keyed off
  category strings in components like `handlePromoteToTimeline` won't recognize the
  real backend values and will fall through to default styling every time.

---

## 6. Prioritized Fix List

```
P0 — Do these first, nothing else works reliably until they're fixed:
  1. Fix the 7 int(current_user.id) call sites (Section 1.1)
  2. Fix the Beanie Document name-shadowing bug (Section 1.2)
  3. Wire IngestionView.tsx to actually call apiClient.uploadDocument (Section 1.3)
  4. Stop passing parseInt(id) for MongoDB ObjectIds anywhere on the frontend (1.4)

P1 — Data integrity, do next:
  5. Remove SQLite/SQLAlchemy entirely; migrate categorization.py and
     relationships.py to write to MongoDB (Section 2.1)
  6. Add user_id to every ChromaDB write and every search filter (Section 2.5)
  7. Fix api.ts's id/user_id types from number to string (Section 2.3)
  8. Constrain Document.category to an enum matching the frontend's expected values
     (Section 2.4)

P2 — Wire up the rest of the frontend to real data:
  9. Connect GraphView, InsightsView, SearchChatView, PortfolioView to real
     apiClient calls instead of data.ts mocks (Section 3)
  10. Add an actual relationship-extraction call in the upload pipeline so the
      Knowledge Graph has data to show (Section 2.1)

P3 — Hardening, before this goes anywhere near real users:
  11. Fail-fast startup validation for SECRET_KEY/MONGODB_URI/R2 creds (Section 4)
  12. Replace broad except Exception blocks with specific handling + real logging
      (Section 4)
  13. Move embedding generation and categorization to a real background task queue,
      per the code's own TODO comment (Section 4)
  14. Replace Stitch's Google-hosted placeholder image URLs with bundled assets
      (Section 3)
```

I can turn any single item above (e.g. "fix P0 items 1-4," or "migrate off SQLite
entirely") into a standalone, copy-pasteable prompt for Devin, sized to one PR at a
time rather than handing over the whole list at once — let me know which one to start
with.
