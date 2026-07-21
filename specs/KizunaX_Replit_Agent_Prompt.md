# KizunaX — Replit Agent Build Prompts

Companion file to `KizunaX_Project_Documentation.md`. That file explains *what* and *why*; this one is *what to paste into Replit, and in what order*.

## How to use this file

Replit's own guidance on Agent is consistent: break big builds into small, testable steps and let Agent checkpoint between them, rather than asking for the whole app in one message. A single giant prompt tends to produce a project that half-works everywhere instead of one piece that fully works. So this file is six prompts, meant to be pasted **one at a time, in order**:

1. Create a new Repl (Python, or blank — Agent will set up what it needs) and open **Agent**.
2. If Agent offers a **Plan mode** toggle, turn it on for Prompt 0 so it proposes an approach before writing code — worth reviewing once at the start.
3. Paste **Prompt 0**. Let it finish and create its first checkpoint.
4. Test what it built. Paste **Prompt 1**. Test again.
5. Repeat through **Prompt 5**. Don't paste ahead of where you've tested — if Phase 2 doesn't work yet, Phase 3 will just build on a broken foundation.
6. Use the rollback/checkpoint feature if any single prompt makes things worse instead of better — it's cheaper to rewind one step than to argue your way out of a bad state.

---

## Prompt 0 — Master Context

*Paste this first. It doesn't ask Agent to build anything yet — it gives it the full picture so every later prompt lands correctly.*

```
I'm building "KizunaX," an AI-powered Digital Identity System for students. It ingests
certificates, resumes, project reports, and internship letters; automatically categorizes
them; finds relationships between them (certification -> skill -> project -> internship);
builds a visual timeline of the student's growth; and lets the student retrieve any
document instantly using a natural-language query.

Please don't build anything yet. I'm going to give you this project in five phases, one
prompt at a time, and I want you to fully complete and let me test each phase before I
give you the next one. For now, just confirm you understand the plan below.

TECH STACK (please use exactly this, not a substitute):
- Backend: Python 3.11, FastAPI, Uvicorn
- Database: MongoDB Atlas (I will provide a connection string as a Secret named
  MONGODB_URI) via the Beanie ODM (async, built on Motor + Pydantic)
- Vector search: MongoDB Atlas Vector Search (native, on the same cluster/collection --
  do NOT set up a separate vector database like Chroma, Pinecone, or FAISS)
- Object storage: Cloudflare R2 (S3-compatible, use boto3/aioboto3, credentials provided
  as Secrets: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME)
- OCR: pytesseract + pdf2image for scanned files/images, PyMuPDF (fitz) for native PDF
  text, EasyOCR as a fallback
- AI: Anthropic Claude API (model "claude-sonnet-5"), key provided as ANTHROPIC_API_KEY,
  used for structured field extraction, categorization, and relationship inference
- Embeddings: Voyage AI (model "voyage-3.5"), key provided as VOYAGE_API_KEY
- Auth: JWT via python-jose, password hashing via passlib[bcrypt]
- Frontend: React 18 + Vite + TypeScript, Tailwind CSS, shadcn/ui components,
  TanStack Query for data fetching
- Everything stateful (database, vector index, file storage) lives in external managed
  services, not on this Repl's local disk -- the app itself should be stateless so it can
  run on Replit's Autoscale deployment safely

DATA MODEL (high level -- I'll give exact fields per phase):
- User: name, email, password_hash
- Document: user_id, original_filename, storage_url, category, title, issuer, issue_date,
  raw_text, extracted_fields, embedding, tags, created_at
- Skill: user_id, name, category, source_document_ids
- Relationship: user_id, source_type/id, target_type/id, relationship_type, confidence_score
- TimelineEvent: user_id, date, title, description, related_document_ids, event_type

CATEGORIES a document can fall into: Certification, Project, Internship, Achievement,
Academic, Resume, Other.

Please reply confirming you understand this, and ask me anything you need clarified
before I send Phase 1.
```

---

## Prompt 1 — Phase 1: Foundation

```
Phase 1: Foundation. Build only this -- no AI/OCR yet, that's Phase 2.

1. Project scaffolding: backend/ (FastAPI) and frontend/ (React + Vite + TypeScript +
   Tailwind) as separate folders in one Repl. Add a root README.md with setup
   instructions and a backend/.env.example listing every variable a running instance
   needs (leave values blank).

2. MongoDB connection using Beanie, reading MONGODB_URI from environment/Secrets. Define
   the User and Document models from the data model I gave you (Document can have empty
   AI-related fields for now -- category, extracted_fields, embedding -- we'll fill
   those in Phase 2/3).

3. Auth: POST /auth/register, POST /auth/login (returns a JWT), GET /auth/me. Passwords
   hashed with bcrypt via passlib. JWT secret read from JWT_SECRET_KEY.

4. File upload: POST /documents/upload accepting multipart file upload. For now, just:
   save the file to Cloudflare R2 (credentials from Secrets, S3-compatible client),
   create a Document record with the storage URL and original filename, and return it.
   No AI processing yet -- category can default to "Uncategorized."

5. Basic CRUD: GET /documents (list, filtered by the logged-in user), GET /documents/{id},
   GET /documents/{id}/download (returns a presigned R2 URL), DELETE /documents/{id}.

6. Minimal frontend: a login/register page and an upload page that shows the list of
   already-uploaded documents with a download link for each. Doesn't need to be
   beautiful yet -- just functional, so I can confirm upload and retrieval work
   end-to-end before we add intelligence on top.

7. Show me the FastAPI /docs page working and confirm the upload -> list -> download
   flow works before you finish this phase.
```

---

## Prompt 2 — Phase 2: OCR + AI Extraction Pipeline

```
Phase 2: turn each uploaded document into structured, understood data.

1. After a file is saved to R2 in the upload flow, extract its text:
   - If it's a PDF with a real text layer, extract directly with PyMuPDF.
   - If it's a scanned PDF or an image, convert to image(s) with pdf2image if needed
     and run pytesseract. If pytesseract's confidence is low or the result looks mostly
     empty, fall back to EasyOCR.
   - Store the result in the Document's raw_text field.

2. Send raw_text to the Claude API (model "claude-sonnet-5", key from
   ANTHROPIC_API_KEY) with a prompt that returns structured JSON with these exact keys:
   category (one of: Certification, Project, Internship, Achievement, Academic, Resume,
   Other), title, issuer, issue_date, skills (array of strings), summary. Use Claude's
   tool-use/structured output so this is reliable JSON, not free text you have to parse.
   Save the result into the Document's category, title, issuer, issue_date, and
   extracted_fields.

3. Make this asynchronous relative to the upload response: POST /documents/upload should
   return immediately after the file is saved to R2 and the Document record is created
   with status "processing," then run OCR + extraction as a background task, and update
   the Document's status to "done" (or "failed" with an error message) when finished.
   Add GET /documents/{id}/status so the frontend can poll it.

4. Update the frontend upload page to show live status per file: Uploading -> Reading
   text -> Extracting -> Done (poll the status endpoint every couple seconds while
   processing). Once done, show the extracted category, title, and issuer on each
   document in the list.

5. Test with 2-3 sample files of different kinds (a text-based PDF resume, a scanned
   certificate image) and show me the extracted_fields output for each before finishing
   this phase.
```

---

## Prompt 3 — Phase 3: Categorization Confidence + Relationship Engine + Vector Search

```
Phase 3: make documents aware of each other, and make them searchable by meaning.

1. Embeddings: after extraction in the pipeline from Phase 2, generate an embedding of
   the document's extracted text + metadata using the Voyage AI API (model
   "voyage-3.5", key from VOYAGE_API_KEY) and store it in the Document's embedding
   field.

2. Set up MongoDB Atlas Vector Search on the Document collection's embedding field
   (create the vector search index; if this needs to be done through the Atlas UI rather
   than code, tell me exactly what to click, with field name and dimensions).

3. Relationship Engine: after a new document is embedded, compare it against the user's
   existing Skills and Documents (via vector similarity, then a Claude call to decide the
   specific relationship type and a confidence score) and create Relationship records.
   Relationship types to use: "demonstrates" (Certification -> Skill), "applied_in"
   (Skill -> Project), "showcased_during" (Project -> Internship), "leads_toward"
   (Internship -> Career Path). Also create/update Skill records as new skills are
   discovered, linking back to source_document_ids.

4. Add GET /relationships/graph returning nodes (documents + skills) and edges
   (relationships) in a shape a graph-visualization library can consume directly.

5. Add GET /skills listing all skills for the logged-in user with their source
   documents.

6. Frontend: add a Relationship Graph page using React Flow or react-force-graph showing
   the nodes/edges from /relationships/graph.

7. Show me the relationship output for a small set of test documents (e.g. a
   certification and a project that shares a skill) before finishing this phase.
```

---

## Prompt 4 — Phase 4: Timeline + Smart Retrieval + Core Frontend

```
Phase 4: the two features that make this feel like a finished product -- the timeline
and natural-language search.

1. TimelineEvent generation: whenever a Document finishes processing, create a
   corresponding TimelineEvent using its issue_date, category, and title. Add
   GET /timeline returning all events for the logged-in user sorted chronologically.

2. Smart Retrieval: POST /search accepting a natural-language query string. Embed the
   query with Voyage AI, run a $vectorSearch aggregation against the Document
   collection (top-k, e.g. 10), and return the matching documents ranked by relevance,
   each with a presigned R2 download URL. Also support plain filtering (category, date
   range) as query parameters for users who want to browse instead of search.

3. Frontend:
   - Timeline page: a vertical/horizontal chronological view of TimelineEvents.
   - Library page: grid of all documents with category filter chips and a search bar
     that calls POST /search and highlights why each result matched if you can surface
     that from Claude's summary field.
   - Document detail view: shows extracted fields, a preview of the original file, and
     its related items (pulled from /relationships/graph filtered to that document).
   - Dashboard/home page: quick counts per category and the most recent 5 documents.

4. Confirm end-to-end: upload a certificate, wait for it to process, then search for it
   by describing it in natural language (not its filename) and confirm it comes back
   with a working download link. This is the core demo moment -- make sure it's solid
   before moving on.
```

---

## Prompt 5 — Phase 5: Resume Builder, Integrations, Deployment Prep

```
Phase 5: the polish layer.

1. Resume Builder: POST /resume/generate that pulls the user's categorized documents
   (Projects, Certifications, Internships, Achievements, Academics) and assembles a
   structured resume draft (JSON first -- fields like education, certifications,
   projects, skills -- then rendered to a downloadable PDF or DOCX). Add a Resume
   Builder page on the frontend to trigger this and preview/download the result.

2. (Optional, only if time allows) Google Drive and Notion integrations: OAuth connect
   flow for each, storing tokens encrypted at rest (Fernet, key from
   INTEGRATION_ENCRYPTION_KEY), with a Settings page to connect/disconnect each
   provider and trigger a resync that pushes categorized documents into the user's own
   Drive folder or Notion database.

3. Deployment prep:
   - Make sure the backend serves the built frontend as static files in production (or
     confirm the two-service setup works cleanly under one Replit deployment) so this
     can run as a single Autoscale deployment.
   - Add a GET /health endpoint.
   - Double-check nothing writes to local disk for anything that needs to persist
     (uploads should go straight to R2, never saved permanently to local disk even
     temporarily beyond the request).
   - Update the root README.md with final setup steps, the full list of required
     Secrets, and how to run backend + frontend locally.

4. Walk me through what's left to manually configure in the Replit UI (Secrets, GitHub
   connection, Publish settings) rather than doing it yourself, since those are account-
   specific steps I need to do on my end.
```

---

## After Phase 5: Publishing

Once everything works in the Replit workspace, this isn't a prompt for Agent — it's what you do yourself in the Replit UI:

1. **Tools → Secrets** — enter every variable from the `.env.example` Agent generated.
2. **Connect to GitHub** — link the Repl to a new GitHub repo (covers the README deliverable).
3. **Publish → Deployment type: Autoscale** — the default, and the right choice here since nothing is stored locally (see Section 15 of the project doc for the full reasoning).
4. In the **Deployments** pane, open its own **Secrets** section and re-enter the same variables — this store is separate from the workspace one, and skipping it is the single most common reason a Replit app works while editing but breaks once published.
5. Deploy, then run through the core demo loop once against the live URL: upload → watch it categorize itself → search for it in plain English → confirm the original file downloads.

## A few things worth knowing about Agent while you work through this

- **Checkpoints are your undo button.** Agent snapshots progress after each completed prompt. If Phase 3 makes a mess, roll back to the end of Phase 2 rather than trying to talk your way out of a bad state.
- **Test before you advance.** Each phase above ends with something concrete to check. Don't paste the next prompt until that check passes — later phases build directly on earlier ones.
- **If something's vague, use Plan mode** (or just ask Agent directly) before it writes code: "what's the simplest way to do X on Replit" costs nothing and avoids a wrong turn.
- **Attach real files.** When you get to Phase 2, attach 2-3 real certificate/resume files to your test message instead of describing them — Agent handles concrete examples far better than descriptions.
