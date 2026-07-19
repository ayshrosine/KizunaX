# KizunaX — Frontend Detailed Specification

Companion to `KizunaX_Database_Schema_and_Data_Flow.md` and
`KizunaX_Backend_Detailed_Doc.md`. This document covers every page's design, exactly
which backend/AI data it connects to, and the user experience contract for each screen.
Rebuilt from scratch, minimalist, no decorative theming standing in for real
functionality (see the audit note at the top of the Core Rebuild Spec for why this
matters).

---

## 0. Design System

```
Style: minimalist, calm, content-first — plain functional UI, not a themed product.
Colors: one navy/blue accent (#1c3a57) for primary actions and headers; neutral
  greys/off-white for surfaces; category colors used ONLY on category pills/tags:
    Projects = blue (#2F5D8A)     Skills = green (#2E8B57)
    Certifications = amber (#B5652A)   Internships = purple (#8A4FA0)
    Achievements = teal (#2E8B8B)      Academics = grey (#6B7280)
Typography: one sans-serif family, 2 weights (regular/bold), max 3 sizes per screen.
Layout: left sidebar nav (collapsible) + top bar (search, avatar) + card-based content.
Components: consistent button/card/input styles reused everywhere — build a small
  shared component library (Button, Card, Pill, Modal, Toast, Skeleton) FIRST, before
  building any page, so no page invents its own one-off styling.
State management: React Context or a lightweight store (Zustand) for auth/user state;
  local component state or React Query/SWR for server data — do NOT hold server data
  only in top-level App.tsx state passed down through many prop layers (this was a
  structural issue in the current app; prefer a data-fetching hook per page instead).
```

---

## 1. Global Frontend Architecture

```
/src
  /pages            # one file per route (Login, Signup, Dashboard, Upload, Library,
                     # Graph, Timeline, Search, Insights, Portfolio, Notifications)
  /components        # shared UI: Button, Card, Pill, Modal, Toast, Skeleton, Sidebar,
                      # TopBar, FileDropzone, CategoryFilter
  /hooks              # useDocuments(), useTimeline(), useSearch(), useGraph(),
                       # useInsights(), usePortfolio(), useNotifications()
                       # — each hook owns its own fetch/loading/error state
  /api                # apiClient.ts — one typed function per backend endpoint,
                       # IDs typed as `string` everywhere, matching MongoDB ObjectIds
  /context            # AuthContext (current user, token, login/logout)
  /types              # shared TypeScript types, mirrored 1:1 to the MongoDB schema
                       # in the Database doc — id fields are ALWAYS string
```

**Rule:** every page's data comes from its hook, every hook calls `apiClient`, no page
imports a hardcoded data file. If a page has nothing to show because the hook hasn't
returned yet or returned empty, that's the loading/empty state — never fake data as a
placeholder for "what it'll look like once it works."

---

## 2. Pages

For each page: layout, exact API calls, what AI/ML output it renders, and the UX
contract (loading / empty / error states — mandatory on every page, no exceptions).

### 2.1 Login / Signup
```
Layout: centered form, no illustration/theme — plain white card on a neutral
background, IdentityVault/KizunaX wordmark above the form.

API calls: POST /api/auth/login, POST /api/auth/register.
AI/ML: none.

UX contract:
- Loading: submit button shows a spinner, inputs disabled during request.
- Error: inline message above the form for wrong credentials / duplicate email,
  field-level messages for validation (empty email, short password).
- Empty state: n/a (this page IS the empty state before auth).
```

### 2.2 Dashboard
```
Layout: greeting header, 6 stat cards in a row, two-column body — "Recent Uploads"
(left) and "Recently Connected" (right, relationship notifications) — plus 3
quick-action tiles at the bottom.

API calls:
- GET /api/documents?limit=5  (recent uploads + stat counts)
- GET /api/notifications?type=relationship_detected&limit=5 (recently connected)
AI/ML: stat cards and "recently connected" reflect real categorization/relationship
results — a "Skills Identified" count is literally `skills.count({userId})`, not a
static number.

UX contract:
- Loading: skeleton cards for stats and both list columns.
- Empty (new user, 0 documents): replace the two-column section with "You haven't
  uploaded anything yet" + a prominent Upload button — do not show 6 stat cards all
  reading "0" with nothing else on screen, that reads as broken, not empty.
- Error: a dismissible banner ("Couldn't load your dashboard — retry") rather than a
  blank page.
```

### 2.3 Upload (AI Data Ingestion)
```
Layout: dropzone + URL-paste field for portfolio links, "Upload Queue" list below
showing each file's real processing stage.

API calls:
- POST /api/documents/upload (multipart, real file bytes — THIS MUST BE A REAL
  NETWORK CALL, see Backend doc Section on the upload endpoint contract)
- GET /api/documents/{id}/status — poll every 1-2s until status is "indexed" or
  "failed" (or use SSE/WebSocket if the backend implements it — poll is the simpler
  MVP option)

AI/ML: this page is the entry point to the entire AI pipeline (OCR -> LLM
categorization -> embedding -> relationship detection). The queue row's stage label
must reflect the REAL backend status field, not a fixed animation timeline —
different files take different amounts of time depending on OCR/LLM latency, and the
UI must reflect that truthfully.

UX contract:
- Loading/progress: real progress per file (upload % during transfer, then stage
  label from polling: Extracting -> Classifying -> Indexed).
- Error: a failed file shows the backend's actual `failureReason` (e.g. "File type
  not supported" or "Classification failed — please retry"), with a Retry action —
  never a generic "something went wrong."
- Success: once indexed, show the detected category and a "View in Library" link
  inline in the same row — don't make the user hunt for what just happened.
```

### 2.4 Library (Categorization view)
```
Layout: search bar + category/year/type filter chips, responsive document card grid.

API calls: GET /api/documents?category=&year=&q=&page=&limit=
Re-tag: PATCH /api/documents/{id}/category
Delete: DELETE /api/documents/{id} (behind a confirmation modal, always)

AI/ML: category pill on each card is the LLM's classification result plus a
confidence indicator (e.g. a subtle dot or icon if confidence < 0.6, inviting review)
— surfacing model uncertainty is part of the UX, not hidden.

UX contract:
- Loading: skeleton grid.
- Empty (no documents / no filter matches): distinct messages — "You haven't
  uploaded anything yet" vs "No documents match these filters" + a Clear Filters
  action.
- Error: inline retry affordance, not a blank grid.
```

### 2.5 Knowledge Graph (Relationship Engine)
```
Layout: force-directed graph canvas + right sidebar for selected-node detail.

API calls: GET /api/graph (nodes + edges from the `relationships` collection),
GET /api/graph/node/{type}/{id} (detail on selection).

AI/ML: nodes/edges ARE the AI output — every edge rendered must trace back to a real
`relationships` document with an `aiGenerated` flag and a `strength` score. Nodes
representing a claimed-but-unevidenced skill (from Insights' gap analysis) render
with a dashed amber outline.

UX contract:
- Loading: centered spinner (graphs don't skeleton well) with a text label, not just
  a blank canvas.
- Empty (no relationships detected yet — likely true for a brand-new account with
  <2 documents): "Upload a couple more documents and we'll start connecting them" —
  explain WHY it's empty, since an empty graph looks identical to a broken one
  otherwise.
- Error: fallback text list of nodes if the graph library itself fails to render,
  so a rendering bug doesn't make the feature totally inaccessible.
```

### 2.6 Timeline
```
Layout: vertical spine with year markers, alternating milestone cards.

API calls: GET /api/timeline
AI/ML: milestone descriptions are LLM-generated one-liners stored in
`timelineEvents.description` at ingestion time — not generated fresh on every page
load (keeps this page fast and avoids inconsistent wording on repeat views).

UX contract:
- Loading: skeleton spine with 2-3 placeholder cards.
- Empty (<2 milestones): "Your timeline will build itself as you upload more
  documents" illustration state.
- Error: retry banner.
```

### 2.7 Search (Smart Retrieval)
```
Layout: chat-style thread, search bar + suggested query chips at top.

API calls: POST /api/search { query }
AI/ML: this is the most AI-visible page — response text is generated from real
search results (a short natural-language summary of what was found), not a canned
sentence. Category-keyword fast paths ("show all my certificates") should feel
instant; open-ended semantic queries may take 1-3s — show a "thinking" indicator
during that gap, not a frozen input.

UX contract:
- Loading: a lightweight typing/thinking indicator in the response bubble.
- Empty (no results found): "No documents matched that search" + a suggestion to
  try a different phrasing or check the Library directly — never a blank response
  bubble with no explanation.
- Error: response bubble shows "Search failed, try again" inline in the thread
  (keeps conversation context) rather than a disruptive modal/toast.
```

### 2.8 Insights
```
Layout: skill-strength bar chart, gap-analysis two-column card, career-path tiles.

API calls: GET /api/insights/skills, GET /api/insights/gaps,
GET /api/insights/career-paths.

AI/ML: gap analysis is a direct query over `skills.hasEvidence` and resume-extracted
skill mentions; career-path suggestions are an LLM call over the user's aggregated
skill/project/certification data, cached and regenerated only when meaningfully new
data arrives (not on every page visit) to keep this page fast and consistent.

UX contract:
- Loading: skeleton chart + skeleton cards.
- Empty (not enough data yet): explain the minimum needed ("Upload at least one
  certificate and one project to see skill insights") rather than showing an empty
  chart with axes and no bars.
- Error: retry banner per section (a failure in career-path suggestions shouldn't
  block the skill-strength chart from showing if that call succeeded).
```

### 2.9 Portfolio
```
Layout: two-pane — left settings (category/document toggles, theme, custom URL),
right live preview.

API calls: GET/PATCH /api/portfolio/settings, POST /api/portfolio/publish.
Public page (separate, unauthenticated route): GET /api/u/{username}.

AI/ML: none directly — this page is a curated view over already-categorized data.

UX contract:
- Loading: skeleton preview pane.
- Empty (nothing published yet / no documents toggled visible): preview pane shows
  "Your portfolio is empty — toggle a category to include it" rather than a blank
  page that looks like a bug.
- Error: settings save failures show inline near the affected toggle, not just a
  generic top-of-page banner.
```

### 2.10 Notifications / Activity Log
```
Layout: two tabs — chronological Notifications list, denser Activity Log table.

API calls: GET /api/notifications, PATCH /api/notifications/read-all,
GET /api/activity-log?page=&limit=.

AI/ML: notification content reflects real pipeline events
(document_classified, relationship_detected, skill_gap, etc.) generated at the
moment those events happen in the backend pipeline — never pre-scripted sample text.

UX contract:
- Loading: skeleton list rows.
- Empty: "You're all caught up" for notifications; "No activity yet" for the log.
- Error: retry banner.
```

---

## 3. AI/ML Connection Summary (frontend's view of it)

The frontend never calls an AI model directly — it only ever calls backend endpoints,
which internally call the LLM/embedding/OCR services. This keeps API keys server-side
and lets the backend enforce tenant isolation before any AI call happens. The
frontend's job with respect to AI/ML output is:

```
1. Render confidence/uncertainty where the backend provides it (category confidence,
   relationship strength) — don't hide it, and don't over-explain it either; a small
   visual indicator is enough.
2. Reflect REAL processing state truthfully (Section 2.3) — never simulate stages
   the backend hasn't actually reached yet.
3. Always provide a path back to the original file/source for any AI-derived
   summary, category, or connection shown — the product's core promise is "instant
   access to the original," so no AI output should be a dead end.
4. Allow correction (re-tagging, "remove from resume" on a skill gap) and treat that
   correction as a first-class action, not an afterthought buried in a menu.
```

---

## 4. Cross-Cutting UX Rules (apply to every page above)

```
- Every data-driven page has 3 explicit states: loading (skeleton, not spinner-only,
  where the layout allows it), empty (with an explanation + next action), and error
  (with a retry affordance) — a page is not "done" until all three exist.
- Every destructive action (delete document, unpublish portfolio) requires the
  shared Delete Confirmation modal — no button fires a destructive request directly
  on click.
- Every list is paginated or infinitely-scrolled — never render an unbounded list.
- Category color-coding is defined once (Section 0) and applied identically
  everywhere a category renders — pill, graph node, timeline marker, filter chip.
- No page renders a number, list, or status that can't be traced to a real network
  response — this is the acceptance test for "is this page actually finished"
  referenced in the Core Rebuild Spec.
```
