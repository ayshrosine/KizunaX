# KizunaX — Google Drive & Notion Integration (One-Way Push, Opt-In)

Extends `KizunaX_Database_Schema_and_Data_Flow.md`,
`KizunaX_Backend_Detailed_Doc.md`, and `KizunaX_Frontend_Detailed_Doc.md`. This is an
additive feature — it does not change the core ingestion pipeline's correctness
requirements, it adds one optional step at the end of it.

**Scope locked in:** one-way push only (KizunaX → Drive/Notion, never the reverse),
opt-in per user, per provider. Two-way sync / scanning a user's existing Drive or
Notion content is explicitly **out of scope** for this build — see Section 8.

---

## 1. Feature Summary

```
When a user connects Google Drive and/or Notion (from Settings, opt-in), every
document that finishes AI categorization is automatically:
  - Google Drive: uploaded into a category-matching folder under a root "KizunaX"
    folder, with a clean, generated filename.
  - Notion: added as a new row/page in a KizunaX-managed Notion database, with
    properties matching the document's category, date, and detected skills —
    particularly valuable for portfolio/project URLs, which aren't files and have
    nowhere natural to live in Drive.

KizunaX's own storage (R2 + MongoDB + ChromaDB) remains the canonical, guaranteed
source of truth regardless of integration status — Drive/Notion pushes are a
convenience mirror, not a dependency. If a push fails or a token expires, the core
app keeps working exactly as before; only the mirror step is affected.
```

---

## 2. Database Schema Additions

### 2.1 New collection: `integrations`
```javascript
{
  _id: ObjectId,
  userId: ObjectId,              // required, indexed, unique per (userId, provider)
  provider: String,              // "google_drive" | "notion"
  status: String,                // "connected" | "disconnected" | "error"
  accessTokenEncrypted: String,   // encrypted at rest (see Section 6)
  refreshTokenEncrypted: String,  // encrypted at rest
  tokenExpiresAt: Date,
  // Google Drive specific:
  rootFolderId: String,           // the "KizunaX" root folder's Drive file ID
  categoryFolderIds: {            // cached map so we don't re-query Drive every push
    Projects: String, Skills: String, Certifications: String,
    Internships: String, Achievements: String, Academics: String,
  },
  // Notion specific:
  databaseId: String,             // the KizunaX-managed Notion database ID
  workspaceName: String,           // for display in Settings ("Connected to: Alex's Workspace")
  lastSyncedAt: Date,
  lastError: String,               // nullable, human-readable, shown in Settings UI
  connectedAt: Date,
  disconnectedAt: Date,             // nullable
}
```
Index: `{ userId: 1, provider: 1 }` unique compound.

### 2.2 Addition to the existing `documents` collection
```javascript
// add to the schema already defined in KizunaX_Database_Schema_and_Data_Flow.md
{
  ...
  externalLinks: {
    googleDrive: { fileId: String, webViewLink: String, pushedAt: Date, status: String },
    notion:      { pageId: String, url: String, pushedAt: Date, status: String },
  }
}
```
`status` per link is `"pushed"` | `"failed"` | `"skipped"` (skipped = provider not
connected at the time this document was processed — pushing is not retroactive unless
the user explicitly requests a re-sync, see Section 5.4).

---

## 3. OAuth Connection Flow

```
Frontend (Settings page)          Backend                        Google / Notion
-----------------------          -------                        ---------------
User clicks "Connect
Google Drive"                 -> GET /api/integrations/
                                  google/auth-url
                                  (builds OAuth URL with
                                  scope=drive.file,
                                  state=signed{userId})     
                               <- { authUrl }
Redirect browser to authUrl                              -> Google consent screen
                                                              (user approves,
                                                              narrow "drive.file"
                                                              scope only — app can
                                                              only see/manage files
                                                              IT creates, nothing
                                                              else in their Drive)
                                                           -> redirects to
Google redirects back to    -> GET /api/integrations/
  /api/integrations/            google/callback?code=...
  google/callback               verify `state` matches
                                 the signed userId
                                 exchange code for tokens -> Google token endpoint
                                 encrypt + store in
                                 integrations collection
                                 create root "KizunaX"
                                 folder + 6 category
                                 subfolders (first-time
                                 only)                    -> Drive API
                                 status="connected"
                              <- redirect to
                                 /settings?connected=google
Frontend shows "Connected"
with workspace/account info
```
Notion follows the same pattern using Notion's OAuth flow; on first connect, the
backend creates the KizunaX-managed database via the Notion API rather than folders.

**Disconnect flow:** `DELETE /api/integrations/{provider}` revokes the token with the
provider (Google's token revocation endpoint / Notion's equivalent), deletes the
`integrations` record, and sets every `externalLinks.<provider>` entry's `status` to
`"skipped"` going forward — existing files/pages already pushed are left alone in the
user's Drive/Notion (KizunaX never deletes a user's own content on disconnect).

---

## 4. Provider-Specific Implementation

### 4.1 Google Drive
```
Scope: https://www.googleapis.com/auth/drive.file
  (app can only access files/folders it created — cannot browse or read the rest of
  the user's Drive. This is also what keeps Google's OAuth verification process
  lightweight — broader scopes require a formal security review from Google.)

Folder structure created on first connect:
  KizunaX/
    Projects/
    Skills/
    Certifications/
    Internships/
    Achievements/
    Academics/

Filename convention on push:
  {YYYY-MM}_{sanitized_title}.{ext}
  e.g. "2025-03_AWS_Certified_Solutions_Architect.pdf"
  (sanitize: strip characters invalid in filenames, collapse whitespace to
  underscores, truncate to a reasonable length)

Push call (integrations/google_drive_client.py):
  1. Refresh access token if expired (using stored refresh token).
  2. drive.files.create(
       body={"name": filename, "parents": [category_folder_id]},
       media_body=file_bytes_from_r2,
     )
  3. Store returned fileId + webViewLink on the document's externalLinks.googleDrive.

Duplicate handling: if a push is retried (e.g. after a transient failure), check
externalLinks.googleDrive.fileId first — if already set and the Drive file still
exists, skip re-uploading; only create a new file if none exists yet.
```

### 4.2 Notion
```
Integration type: Notion OAuth (public integration) — narrower "internal integration
secret" mode is simpler to build but requires the user to manually share a page with
the integration; OAuth is the smoother opt-in UX and is what Section 3 describes.

Database created on first connect ("KizunaX Journey"), with properties:
  Title          (title)
  Category        (select: Projects | Skills | Certifications | Internships |
                            Achievements | Academics)
  Date            (date)
  Skills          (multi-select)
  Source          (url — for portfolio/project links that aren't files)
  KizunaX Link    (url — deep link back to the document inside KizunaX itself, so
                   the Notion row is never a dead end)

Push call (integrations/notion_client.py):
  1. Refresh access token if expired.
  2. notion.pages.create(
       parent={"database_id": database_id},
       properties={ Title, Category, Date, Skills, Source, "KizunaX Link" },
     )
  3. Store returned page id + url on externalLinks.notion.

Rate limit: Notion's API allows roughly 3 requests/second average — batch pushes
(e.g. after a bulk upload) must queue and throttle rather than fire concurrently.
```

---

## 5. Pipeline Integration

### 5.1 Where this fits in the existing ingestion pipeline
```
... (existing steps from KizunaX_Backend_Detailed_Doc.md Section 4.1, a-g) ...
g. document_repository.update(id, status="indexed", chromaVectorId=document_id)
h. notification_repository.create(type="document_classified")

   NEW STEP i. push_to_integrations(document_id, user_id):
     - integration_repository.find(userId, status="connected")
     - for each connected provider: call the matching push function
       (Section 4.1 / 4.2), update externalLinks.<provider>
     - this step runs AFTER indexing succeeds, never blocks it — if a user has no
       integrations connected, this is a no-op; if a push fails, it does not roll
       back or affect the document's "indexed" status in KizunaX itself
     - on failure: set externalLinks.<provider>.status="failed", log to
       integrations.lastError, create a notification
       (type="integration_push_failed") — but the document itself stays fully
       usable inside KizunaX regardless
```

### 5.2 Failure isolation principle
```
A Drive/Notion push failure must NEVER cause the document's own status to regress
or block any KizunaX-native feature (search, timeline, graph all continue to work
off KizunaX's own storage). This mirror is additive only — treat external API
failures the same way you'd treat a flaky third-party dependency: isolated,
retryable, non-blocking.
```

### 5.3 Retry strategy
```
Failed pushes are retried with backoff (e.g. 3 attempts: immediate, +5min, +30min)
via the same background job queue used for ingestion. After 3 failures, mark
status="failed" permanently and surface a "Retry" action in the Settings page and/or
the document's detail modal — don't retry indefinitely in the background.
```

### 5.4 Manual re-sync
```
POST /api/integrations/{provider}/resync — pushes every document with
externalLinks.<provider>.status in ("skipped", "failed") for the current user. This
is what a user runs after connecting a provider for the first time (so documents
uploaded before connecting also get pushed) or after fixing a failure — explicitly
manual, not automatic, to keep behavior predictable and avoid surprise bulk API
usage against provider rate limits.
```

---

## 6. Security

```
- Access and refresh tokens are encrypted at rest (e.g. Fernet/AES via a key held in
  your secrets manager, never the same SECRET_KEY used for JWT signing) — never
  store OAuth tokens in plaintext in MongoDB.
- Scopes are the narrowest available for each provider (drive.file, not full Drive
  access) — the app should be structurally incapable of reading a user's unrelated
  files even if a token were somehow compromised.
- Token refresh happens server-side only; the frontend never sees or handles raw
  Drive/Notion tokens.
- Disconnecting revokes the token with the provider immediately (Section 3), not
  just deleting KizunaX's local record of it.
- Every push action is logged to `activityLogs` (action: "integration_push",
  metadata: { provider, documentId }) for auditability.
```

---

## 7. Frontend Additions

### 7.1 Settings Page (new)
```
Layout: a card per provider (Google Drive, Notion), each showing:
  - Connection status (Not connected / Connected as {account or workspace name})
  - "Connect" button (not connected) or "Disconnect" + "Resync" buttons (connected)
  - lastSyncedAt / lastError if applicable, shown plainly ("Last synced 2 hours ago"
    or "Last push failed: [reason] — Retry")

UX contract: same as every other page (Frontend doc Section 4) — loading state while
checking connection status, clear error state if a connection check itself fails,
no fake "Connected" state shown before the OAuth round-trip actually completes.
```

### 7.2 Document Detail Modal — additions
```
Add two small icon links (Drive, Notion) next to the existing "Download original"
action, shown only when externalLinks.<provider>.status === "pushed" — clicking
opens the file/page directly in Drive/Notion in a new tab. If a provider is
connected but this specific document hasn't been pushed yet (mid-retry, or pushed
before the provider was connected), show a subtle "Not yet synced" state instead of
hiding the icon entirely, so the user understands why it's missing.
```

---

## 8. Explicitly Out of Scope (Phase 2 / future work)

```
- Two-way sync: KizunaX does NOT scan, read, or import a user's existing Drive or
  Notion content in this build. Connecting a provider only affects documents
  processed by KizunaX going forward (or manually re-synced per 5.4) — it never
  reaches into files the user already had there.
- Real-time bidirectional sync (e.g. reflecting a rename done in Drive back into
  KizunaX) is not built — the mirror is push-only and one-directional.
- These are natural, clearly-scoped Phase 2 candidates once the one-way push proves
  reliable, but they require the broader OAuth scopes and conflict-resolution logic
  discussed earlier in this conversation, and should not be started until Phase 1
  (push) has its own tests passing per Section 9.
```

---

## 9. Testing Checklist (extends `KizunaX_Error_Handling_and_Testing_Guide.md`)

```
[ ] Connect flow: OAuth round-trip completes and integrations record is created
    with status="connected" and tokens encrypted (verify they're not plaintext in
    the DB directly, not just "the app seems to work").
[ ] First-connect setup: Drive root+category folders are created exactly once
    (connecting twice, or reconnecting after disconnect, must not create
    duplicate folder trees or duplicate Notion databases).
[ ] Push-on-ingest: upload a document while connected; assert it appears in the
    correct Drive folder / Notion database row within a reasonable time, with
    correct filename/properties.
[ ] Failure isolation: simulate a Drive/Notion API failure (mock a 500) during
    push; assert the document's own status still reaches "indexed" and every
    KizunaX-native feature (search, library, timeline) works normally regardless.
[ ] Retry: force a push failure, then confirm the backoff retry eventually
    succeeds (or permanently fails after 3 attempts with a visible error).
[ ] Disconnect: assert the token is revoked with the provider, the integrations
    record is removed, and previously-pushed files/pages in the user's own
    Drive/Notion are left untouched.
[ ] Resync: upload documents before connecting a provider, then connect and call
    resync — assert all previously "skipped" documents get pushed.
[ ] Multi-tenant isolation: connect Drive for User A and User B separately; assert
    User A's documents never push into User B's Drive/Notion, verified by checking
    which OAuth token/folder each push actually used, not just visual spot-check.
[ ] Rate limiting: bulk-upload enough documents to exceed Notion's ~3 req/sec
    limit; assert pushes queue and complete successfully rather than erroring out
    from a rate-limit response.
```
