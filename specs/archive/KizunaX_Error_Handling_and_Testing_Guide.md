# KizunaX — Error Handling, What to Avoid, and Testing Guide

The rulebook for how to fail safely and how to know when a feature actually works.
Every "what to avoid" item below is a real pattern found in the current KizunaX
codebase during audit — not a hypothetical. Every "what to do instead" is the
concrete replacement pattern used throughout the other 3 companion documents.

---

## 1. What to Avoid (real anti-patterns found in the current codebase)

### 1.1 Casting a MongoDB ObjectId to `int`
```
AVOID:  Document.user_id == int(current_user.id)
BECAUSE: ObjectIds are strings like "65fa3b2c1e4a2f0012ab34cd" — int() raises
         ValueError on virtually every real value, breaking the endpoint entirely.
DO INSTEAD: Document.user_id == str(current_user.id), consistently, everywhere.
```

### 1.2 Running two databases for the same data
```
AVOID:  Initializing both SQLite/SQLAlchemy AND MongoDB/Beanie at startup, with
        different services writing to different ones for the same logical entity
        (e.g. Skill exists in both, populated independently).
BECAUSE: Data written to one is invisible to code reading the other — features
         silently "don't work" with no error anywhere, because from each database's
         perspective, nothing went wrong.
DO INSTEAD: One database per entity, one implementation per feature. If you're
            migrating between two databases, delete the old one's write paths in the
            same change that adds the new one — never let both stay live.
```

### 1.3 Shadowing an imported base class name
```
AVOID:  from beanie import Document, Indexed
        class Document(Document): ...   # rebinds "Document" in this module
        class Skill(Document): ...       # now inherits from YOUR Document, not
                                          # Beanie's — pulls in unrelated required
                                          # fields
DO INSTEAD: from beanie import Document as BeanieDocument
            class Document(BeanieDocument): ...
            class Skill(BeanieDocument): ...   # explicit, unambiguous
```

### 1.4 Broad `except Exception` that swallows real bugs
```
AVOID:  try:
          ... real logic that might have a genuine bug ...
        except Exception as e:
          print(f"Error: {e}")
          return {"status": "error"}   # or an empty list/dict
BECAUSE: This pattern turns programming errors (wrong types, missing fields, typos
         in a keyword argument) into silent no-ops that look identical to "there's
         just no data." A `TypeError` from a genuinely broken function call gets
         treated exactly the same as "the user has zero documents" — indistinguishable
         from the outside, and invisible unless someone is tailing server logs.
DO INSTEAD: Catch specific, expected exceptions (e.g. a validation error, a
            not-found lookup) and handle those meaningfully. Let unexpected
            exceptions propagate to the centralized error handler (Section 2), which
            logs them with full context AND returns a clear 500 to the client — a
            loud, visible failure is more useful than a quiet, wrong success.
```

### 1.5 Passing a keyword argument that doesn't match the schema
```
AVOID:  DocumentRelationship(..., metadata=json.dumps(...))
        # when the actual field is named `additional_data`, and `metadata` is also
        # a reserved attribute on the ORM's base class
BECAUSE: This raises a TypeError on every call — caught by 1.4's broad except, so it
         fails silently instead of loudly.
DO INSTEAD: Match constructor kwargs to the schema exactly; let your editor/type
            checker catch mismatches before runtime — this is another reason to
            avoid `**kwargs`-style flexibility in model constructors.
```

### 1.6 Frontend feature that never calls the backend
```
AVOID:  A screen that simulates success with `setTimeout` and local state updates,
        with a comment like "In a real implementation, this would call the API."
BECAUSE: It demos perfectly and ships completely broken — there's no visual
         difference between "working" and "faked" until someone checks the Network
         tab or the data disappears on refresh.
DO INSTEAD: Every screen's acceptance test is: open DevTools Network tab, use the
            screen normally, and confirm every visible number/list/status traces to
            a real request. A screen with a `setTimeout` standing in for a network
            call is not "80% done" — it's not started.
```

### 1.7 `parseInt()` on an ID that isn't a number
```
AVOID:  apiClient.deleteDocument(parseInt(id))   // id is a MongoDB ObjectId string
BECAUSE: parseInt doesn't throw — it silently parses leading digit characters and
         returns a truncated, wrong number (or NaN). This is worse than a crash: it
         fails quietly and can act on/reference the wrong resource.
DO INSTEAD: Keep IDs as strings on the frontend end-to-end; type them as `string` in
            every interface, so passing one into a numeric context is a compile-time
            TypeScript error, not a silent runtime bug.
```

### 1.8 Unscoped queries "for now, simplified version"
```
AVOID:  skills = db.query(Skill).all()   # comment: "simplified version — in
        # production you'd scope this properly"
BECAUSE: "For now" code ships. This specific example returned every user's skills
         for every document, regardless of who was asking — a cross-tenant data
         leak, not just a correctness bug.
DO INSTEAD: There is no acceptable "unscoped for now" query on tenant-owned data,
            even in a prototype/demo — write the userId filter from the first line
            of the function, always.
```

### 1.9 AI isolation metadata that's optional in the service but omitted at the call site
```
AVOID:  A service function that warns "user_id not in metadata, isolation may be
        compromised" but is called from exactly one place that never provides it.
BECAUSE: A warning that's always printed and never acted on is worse than no warning
         — it trains everyone to ignore the logs.
DO INSTEAD: Make the isolation field a required parameter (not an optional dict key
            with a runtime warning) so omitting it is a function-signature error the
            caller can't miss, not a log line buried in server output.
```

### 1.10 Decorative UI copy standing in for real status
```
AVOID:  "CONNECTING TUNNEL...", "DECRYPTING METADATA..." as the only feedback during
        a fake setTimeout sequence.
BECAUSE: Flavor text is fine ON TOP OF real status ("Uploading 40%... Decrypting
         metadata" where "40%" is real) — but as a REPLACEMENT for real status, it
         actively misleads the user into trusting a pipeline that never ran.
DO INSTEAD: Real status first ("Extracting text... Classifying..." from the actual
            backend `status` field); theme it cosmetically if you want, but never
            let the theming be the only thing standing between the user and the
            truth about what's happening.
```

---

## 2. Error Handling Strategy

### 2.1 Centralized error handler (backend)
```python
# middleware/error_handler.py
from fastapi import Request
from fastapi.responses import JSONResponse
import uuid, logging

logger = logging.getLogger("kizunax")

async def error_handler(request: Request, exc: Exception):
    request_id = str(uuid.uuid4())
    logger.error(f"[{request_id}] {request.method} {request.url}: {exc}",
                 exc_info=True)
    status_code = getattr(exc, "status_code", 500)
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "message": str(exc) if status_code < 500 else
                           "Something went wrong on our end.",
                "code": type(exc).__name__,
                "requestId": request_id,
            }
        },
    )
```
Every response, success or failure, has a **consistent shape** — the frontend never
has to guess whether a given endpoint returns a raw list, a wrapped object, or a bare
string on error.

### 2.2 Error categories and how each is handled
| Category | Example | Handling |
|---|---|---|
| Validation error | Bad email format, missing field | 400, field-level message, caught before hitting the DB |
| Not found | Document ID doesn't exist / isn't yours | 404, generic "not found" (never reveal it exists but belongs to someone else) |
| Auth error | Missing/expired/invalid JWT | 401, caught at the Cloudflare Worker AND FastAPI dependency layer |
| Rate limit | Too many uploads/searches | 429, from the Worker before reaching the origin |
| Expected external failure | LLM API timeout, OCR failure on unreadable scan | Caught specifically; document status set to `failed` with a real `failureReason`; user can retry |
| Unexpected/programming error | Anything not in the above categories | Propagates to the centralized handler; logged with full trace + requestId; generic 500 to the client |

### 2.3 Frontend error handling
```
- Every data-fetching hook (useDocuments, useSearch, etc.) returns
  { data, isLoading, error } — components branch on all three explicitly, never
  just data (which would render undefined/empty as if it were a real empty state).
- Network/5xx errors show a retry affordance inline in the same component, not a
  disruptive global modal, UNLESS the error is auth-related (401), in which case
  redirect to login — a stale session shouldn't let someone keep interacting with a
  UI that will fail every subsequent request.
- Include the response's requestId in any user-facing error detail/report action, so
  a bug report can be traced directly to the matching server log line.
```

---

## 3. Testing Guide

### 3.1 Unit Tests (backend)
```
[ ] Every repository function that queries a tenant-scoped collection has a test
    asserting it filters by userId — pass two different user IDs with overlapping
    data and confirm each only gets their own.
[ ] Classification service: given a fixed input document, mock the LLM response and
    assert invalid category values (outside the enum) are rejected, not saved.
[ ] Relationship service: given two mock documents above/below the similarity
    threshold, assert an edge is created only for the above-threshold pair.
[ ] Auth: password hashing round-trip, JWT creation/verification, expired-token
    rejection.
[ ] Every place that used to contain int(current_user.id) — regression test that
    passes a real ObjectId-shaped string through the exact same code path and
    asserts no exception.
```

### 3.2 Integration Tests (backend, real test DB)
```
[ ] Full upload flow against a test MongoDB + test Chroma collection: upload a
    sample PDF, assert status progresses to "indexed", category is set, a
    ChromaDB vector exists with correct user_id metadata, and (given a second
    related test document already present) a relationship edge is created.
[ ] Search: seed two users' documents with similar content; assert User A's search
    never returns User B's documents, even when content is nearly identical.
[ ] Delete: upload, then delete a document; assert the MongoDB record, R2 object,
    and Chroma vector are all removed, and any relationship referencing it reflects
    the deletion rather than silently pointing at nothing.
[ ] Portfolio: publish with a category hidden; assert GET /u/{username} never
    returns documents from that category, and never returns anything at all for an
    unpublished portfolio.
```

### 3.3 Multi-Tenancy / Isolation Tests (run on every deploy, not just once)
```
[ ] Create User A and User B. Upload distinct documents for each.
[ ] As User A: GET /documents, GET /timeline, GET /graph, POST /search — assert
    zero results ever contain User B's data.
[ ] Attempt to GET/PATCH/DELETE one of User B's document IDs while authenticated as
    User A — assert 404 (not 403 — don't reveal existence), for every one of those
    three verbs individually.
[ ] Attempt a request with no Authorization header, and one with an expired token —
    assert both are rejected at the edge (Worker) before reaching the FastAPI origin
    (check origin logs show no incoming request for the rejected cases).
```

### 3.4 AI/ML Accuracy Tests
```
[ ] Build a fixed test set: ~20 sample documents per category (120 total), clearly
    and unambiguously labeled by a human. Run the classification pipeline against
    all of them; assert >=85% land in the correct category. Re-run this test after
    any prompt or model change — this is your regression suite for "did I just make
    categorization worse."
[ ] Build a 10-15 query natural-language search regression set against a fixed
    seed dataset (e.g. "show all my certificates" against a user with exactly 4
    certificate documents) — assert the expected document set is returned. Re-run
    after any embedding/search-logic change.
[ ] Relationship detection: seed 3 documents where 2 are genuinely related (e.g. a
    Python certificate and a Python project) and 1 is unrelated (e.g. a gym
    membership certificate); assert an edge is created between the related pair and
    NOT involving the unrelated one.
```

### 3.5 Frontend Functional Tests (per page, from the Frontend doc's page list)
```
For EVERY page in KizunaX_Frontend_Detailed_Doc.md Section 2, verify:
[ ] Loading state renders before data arrives (throttle network in DevTools to see it)
[ ] Empty state renders correctly for a fresh account with no relevant data
[ ] Error state renders when the backend call is made to fail (e.g. stop the backend
    and confirm a retry banner appears, not a blank/broken page)
[ ] Every number/list/status on screen traces to a real network response
    (Network-tab trace test — see Section 1.6's "do instead")
[ ] Destructive actions (delete, unpublish) are gated behind a confirmation modal
```

### 3.6 End-to-End Regression Flow (run before any release)
```
1. Sign up as a new user.
2. Upload 3 documents across different categories (a certificate, a project report,
   a resume) and wait for all to reach "indexed".
3. Confirm Dashboard stat cards reflect the real counts.
4. Confirm Library shows all 3 with correct categories.
5. Confirm Knowledge Graph shows at least one detected relationship if the
   documents share a skill (use content that should trigger one).
6. Confirm Timeline shows 3 milestones grouped correctly.
7. Search "show all my certificates" — confirm exactly the certificate document
   is returned.
8. Check Insights — confirm a skill from the certificate appears with evidence.
9. Publish a Portfolio with one category hidden; open the public link in an
   incognito window; confirm the hidden category is absent.
10. Delete one document; confirm it disappears from Library, Timeline, and Search
    results, and that the Knowledge Graph reflects the change (edge removed or
    marked source-deleted, not silently dangling).
11. Log in as a second, separate test user and confirm none of the first user's
    data appears anywhere in their view.
```

---

## 4. Definition of Done (apply to every feature before calling it complete)

```
A feature is done when ALL of the following are true — not when it "looks right in
a demo":
  [ ] It's covered by at least one automated test from Sections 3.1-3.4.
  [ ] Every state (loading/empty/error) has been manually triggered and verified,
      not just the happy path.
  [ ] It passes the multi-tenancy isolation check relevant to it (Section 3.3).
  [ ] No int() cast, unscoped query, or broad except-and-swallow pattern from
      Section 1 exists anywhere in its code path — grep for these patterns
      specifically before merging.
  [ ] If it involves AI output, it's been checked against the relevant accuracy
      test in Section 3.4, not just "it returned something."
```
