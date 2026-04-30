# FamilyHub — Implementation Plan
**Version:** 1.1
**Derived from:** Requirements Document v1.2
**Date:** April 29, 2026
**Status:** Updated — Testing Strategy + Solo Dev Adjustments

---

## Version History

| Version | Date | Changes |
|---|---|---|
| **1.1** | 2026-04-29 | Added frontend test framework setup (Task 1.1.4). Expanded Phase 1 test suite with specific test counts and coverage targets (Task 1.4.10). Added Phase 1 Performance Baseline task (Task 1.4.11). Added Phase 1 Security Review checklist (Task 1.4.12). |
| **1.0** | 2026-04-23 | Initial implementation plan derived from Requirements v1.1. |

---

## How to Use This Document

Each phase is broken into sprints (roughly 1–2 weeks each). Each sprint contains ordered tasks. Tasks are written as concrete development actions, not abstract goals. Dependencies are called out explicitly. Each task has acceptance criteria (AC) — the definition of "done" before moving to the next task.

**Conventions:**
- `[BE]` = backend (Python/FastAPI) work
- `[FE]` = frontend (React/TypeScript) work
- `[INFRA]` = Docker / Caddy / deployment work
- `[DB]` = database schema / migration work
- `[TEST]` = test writing (unit, integration, or manual)
- Tasks marked `*BLOCKER*` must be complete before any subsequent task in that sprint begins

---

## Repository Structure (Target)

```
familyhub/
├── backend/                  # Python FastAPI application
│   ├── app/
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── core/             # Config, security, database session
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── routers/          # API route handlers (one file per module)
│   │   ├── services/         # Business logic (one file per domain)
│   │   ├── jobs/             # APScheduler background jobs
│   │   └── integrations/     # Calendar provider clients
│   ├── alembic/              # Database migrations
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/       # Shared UI components
│   │   ├── pages/            # Route-level page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── api/              # TanStack Query API clients
│   │   ├── stores/           # Zustand global state (auth, theme)
│   │   └── wall/             # Wall display components (isolated)
│   ├── public/
│   │   └── icons/            # PWA icons (all sizes)
│   ├── index.html
│   ├── vite.config.ts
│   └── Dockerfile
├── config/
│   └── Caddyfile
├── data/                     # Bind-mounted at runtime (gitignored)
│   ├── db/
│   ├── photos/
│   └── backups/
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Phase 1 — Foundation + Wall Screen + PWA
**Duration:** Weeks 1–8 (4 sprints × ~2 weeks)
**Goal:** A working, Docker-deployed application the family can start using on day 1 — wall display running, PWA installable on phones, Google Calendar syncing, tasks assignable and completable.

---

### Sprint 1.1 — Project Scaffold & Infrastructure (Week 1–2)

**Goal:** Empty repo → running Docker stack accessible at `familyhub.local`

---

#### Task 1.1.1 `[INFRA]` *BLOCKER* — Initialize repository and Docker Compose stack

**What to build:**
- Create Git repository with the directory structure above
- Write `docker-compose.yml` with three services: `api` (FastAPI, port 8000), `web` (Vite dev server, port 5173 in dev / Nginx in prod, port 3000), `caddy` (ports 80/443)
- Write `Caddyfile` with `tls internal` for `familyhub.local`, routing `/api/*` → api:8000 and `/*` → web:3000
- Write `.env.example` documenting all required variables: `SECRET_KEY`, `FAMILY_NAME`, `TIMEZONE`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `BACKUP_RETENTION_DAYS`
- Write `README.md` with quick-start instructions (clone → copy .env → docker compose up -d → navigate to familyhub.local)
- Configure bind mounts: `./data/db`, `./data/photos`, `./data/backups`, `./config`
- Set all services to `restart: unless-stopped`

**AC:**
- `docker compose up -d` on a clean machine starts all three containers without errors
- `https://familyhub.local` returns a 200 (even a placeholder page)
- `https://familyhub.local/api/health` returns `{"status": "ok"}`
- Containers survive `docker compose restart` with no data loss

---

#### Task 1.1.2 `[INFRA]` — GitHub Actions CI: multi-arch Docker build

**What to build:**
- `.github/workflows/build.yml` that triggers on push to `main`
- Builds both `linux/amd64` and `linux/arm64` images for `familyhub-api` and `familyhub-web`
- Pushes to GitHub Container Registry (ghcr.io) with tags: `latest` and the git SHA
- Caches Docker layers between builds

**AC:**
- Push to main produces arm64 images in GHCR within 10 minutes
- Both images can be pulled on a Raspberry Pi 4 and started

---

#### Task 1.1.3 `[BE]` *BLOCKER* — FastAPI application skeleton

**What to build:**
- `backend/app/main.py`: FastAPI app instance, CORS middleware (configured from `ALLOWED_ORIGINS` env var), exception handlers, lifespan context (startup/shutdown hooks)
- `backend/app/core/config.py`: Pydantic `Settings` model loading from `.env` (uses `pydantic-settings`)
- `backend/app/core/database.py`: async SQLAlchemy engine + session factory for SQLite (`aiosqlite`), `get_db` dependency
- `backend/app/core/security.py`: `create_access_token`, `verify_token`, `hash_password`, `verify_password` using PyJWT + passlib[bcrypt]
- `/api/health` GET endpoint returning build version and uptime
- Alembic initialized: `alembic init alembic/`, `env.py` wired to async SQLAlchemy engine
- Alembic auto-run on container startup (call `alembic upgrade head` in lifespan startup hook)
- `requirements.txt`: fastapi, uvicorn[standard], sqlalchemy[asyncio], aiosqlite, alembic, pydantic-settings, pyjwt, passlib[bcrypt], python-multipart, httpx, pillow, apscheduler

**AC:**
- `GET /api/health` returns 200 with `{"status":"ok","version":"0.1.0"}`
- Alembic runs migrations on startup without error
- All imports resolve; no startup errors in container logs

---

#### Task 1.1.4 `[FE]` *BLOCKER* — React/Vite/TypeScript frontend skeleton + test framework

**What to build:**
- Initialize Vite project: `npm create vite@latest frontend -- --template react-ts`
- Install dependencies: `react-router-dom`, `@tanstack/react-query`, `tailwindcss`, `@shadcn/ui`, `zustand`, `axios`
- Configure Tailwind with custom `familyhub` theme tokens (primary colors, font sizes, spacing)
- Install and configure `vite-plugin-pwa` with basic manifest (name, short_name, theme_color, background_color, display: standalone, start_url: /)
- Create placeholder PWA icons (512×512, 192×192, 180×180 for iOS) — can be a colored square at this stage
- Set up React Router with placeholder routes: `/`, `/login`, `/wall`, `/tasks`, `/calendar`, `/lists`
- Set up TanStack Query provider in `main.tsx`
- Set up Zustand auth store: `{ user, token, setUser, clearUser }`
- Create `src/api/client.ts`: axios instance with base URL `/api`, automatic JWT cookie handling, 401 interceptor redirecting to `/login`
- `frontend/Dockerfile`: multi-stage build — `npm run build` → serve with `nginx:alpine`

**Test Framework Setup:**
- Install Vitest + React Testing Library: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`
- Configure `vitest.config.ts` with test globals and jsdom environment
- Create `createWrapper` helper for TanStack Query test setup (provides test `QueryClient`)
- Add `test` and `test:coverage` scripts to `package.json`
- Create placeholder test: `src/__tests__/pages/Login.test.tsx` (verifies framework works)

**AC:**
- `npm run dev` starts without errors
- `npm run build` produces a `dist/` folder
- `npm test` runs tests (framework configured, placeholder test passes)
- Navigating to `https://familyhub.local` shows the React app (even a placeholder)
- Chrome DevTools → Application → Manifest shows the PWA manifest with all required fields
- "Install app" prompt appears in Chrome on desktop

---

#### Task 1.1.5 `[DB]` *BLOCKER* — Initial database schema migration

**What to build:**
- Alembic migration `001_initial_schema.py` creating tables:
  - `families`: id (UUID), name, timezone, settings_json, created_at
  - `users`: id (UUID), family_id (FK), display_name, role (enum: admin/co_admin/teen/child/guest), avatar_type (photo/emoji), avatar_value, color_hex, ui_mode (standard/child/kiosk), pin_hash, password_hash, created_at, last_login_at
  - `sessions`: id (UUID), user_id (FK), token_hash, device_hint, expires_at, created_at
- SQLAlchemy models in `backend/app/models/auth.py` matching the above
- All tables use UUID primary keys (stored as TEXT in SQLite)
- All timestamps are UTC

**AC:**
- `alembic upgrade head` runs cleanly against an empty database
- `alembic downgrade -1` rolls back cleanly
- Tables exist and are queryable via SQLite CLI

---

#### Task 1.1.6 `[TEST]` — Smoke test suite setup

**What to build:**
- Install `pytest`, `pytest-asyncio`, `httpx` (for async FastAPI test client)
- `backend/tests/conftest.py`: async test client fixture using in-memory SQLite, fresh schema per test session
- `backend/tests/test_health.py`: assert `/api/health` returns 200
- GitHub Actions step to run `pytest` after build

**AC:**
- `pytest` passes with 0 failures
- CI runs tests on every push

---

### Sprint 1.2 — Authentication & First-Run Setup (Week 2–3)

**Goal:** Family can create accounts, log in, and set up the household

---

#### Task 1.2.1 `[BE]` *BLOCKER* — Auth API endpoints

**What to build:**

`backend/app/routers/auth.py`:

- `POST /api/auth/setup` — first-run only (blocked if family already exists): creates the `families` row and first `admin` user. Body: `{family_name, timezone, admin_display_name, admin_password}`. Returns a session token.
- `POST /api/auth/login` — standard password login. Body: `{user_id_or_name, password}`. Sets httpOnly, SameSite=Strict JWT cookie (30-day expiry). Returns user profile.
- `POST /api/auth/login/pin` — PIN login. Body: `{user_id, pin}`. Rate-limited: 5 failures → 60-second lockout stored in memory (or a `pin_lockouts` table). Sets same JWT cookie.
- `POST /api/auth/logout` — clears the cookie.
- `GET /api/auth/me` — returns current user from cookie. Used by frontend on load to restore session.
- `GET /api/auth/setup/status` — returns `{setup_complete: bool}`. No auth required. Used by frontend to decide whether to show setup wizard or login.

`backend/app/core/security.py` additions:
- `get_current_user` FastAPI dependency: reads JWT from cookie, validates, returns `User` model or raises 401
- `require_role(*roles)` dependency factory: wraps `get_current_user`, raises 403 if role not in list

**AC:**
- POST /api/auth/setup creates family + admin user, returns valid JWT cookie
- POST /api/auth/login returns 200 with cookie on valid credentials, 401 on invalid
- PIN rate-limiting: 6th attempt within 60s returns 429
- GET /api/auth/me returns user when cookie is present, 401 when absent
- GET /api/auth/setup/status returns false on fresh DB, true after setup

---

#### Task 1.2.2 `[BE]` — User management API

**What to build:**

`backend/app/routers/users.py`:

- `GET /api/users` — list all users in the family (requires auth)
- `POST /api/users` — create a new family member (admin/co-admin only). Body: `{display_name, role, color_hex, ui_mode, pin?, password?}`
- `GET /api/users/{user_id}` — get a user profile
- `PATCH /api/users/{user_id}` — update profile fields (own profile: any user; other profiles: admin only)
- `DELETE /api/users/{user_id}` — soft-delete (admin only, cannot delete self)
- `POST /api/users/{user_id}/avatar` — upload avatar photo (multipart/form-data). Saves to `./data/photos/avatars/{user_id}.jpg`, generates 96×96 thumbnail.

`backend/app/services/users.py`: user CRUD business logic, avatar processing via Pillow.

**AC:**
- Admin can create users of any role
- Non-admin cannot create users (returns 403)
- Avatar upload saves file and thumbnail, returns URL
- User list returns all non-deleted users

---

#### Task 1.2.3 `[FE]` *BLOCKER* — Setup wizard (first-run flow)

**What to build:**

`frontend/src/pages/SetupWizard.tsx` — multi-step form, shown when `GET /api/auth/setup/status` returns false:

- Step 1: Household name + timezone (searchable dropdown using `Intl.supportedValuesOf('timeZone')`)
- Step 2: Admin account — display name, password, confirm password
- Step 3: Confirmation screen with household summary

On submit: `POST /api/auth/setup` → on success, redirect to `/dashboard`.

`frontend/src/App.tsx` update: on load, call `GET /api/auth/setup/status`. If false → redirect to `/setup`. If true, call `GET /api/auth/me` → if 401 → redirect to `/login`.

**AC:**
- Fresh install navigates to `/setup` automatically
- Completing wizard creates family + admin and lands on dashboard
- After setup, `/setup` redirects to `/dashboard`
- Form validates: password min 8 chars, household name required, timezone required

---

#### Task 1.2.4 `[FE]` — Login page

**What to build:**

`frontend/src/pages/Login.tsx`:
- Shows all family members as large avatar cards (from `GET /api/users`, no auth required for this endpoint — return display names/avatars only)
- Tap a member card → shows PIN pad (4–8 digits, large touch targets) or password field depending on their configured auth method
- Submit calls `POST /api/auth/login/pin` or `POST /api/auth/login`
- On success: stores user in Zustand auth store, navigates to `/dashboard`
- Error state: "Incorrect PIN, X attempts remaining"

**AC:**
- Family member avatars display on login page without requiring a session
- PIN pad has 56×56px minimum button size (touch-friendly)
- Successful login navigates to dashboard
- 5 failed PINs shows lockout message with countdown

---

#### Task 1.2.5 `[FE]` — User management screens (admin)

**What to build:**

`frontend/src/pages/admin/ManageUsers.tsx`:
- List of current family members with role badge, avatar, color swatch
- "Add member" button → drawer/modal with form: name, role selector, color picker (preset swatches), UI mode toggle, PIN field, optional password field
- Edit member: tap member → same drawer pre-filled
- Delete member: confirmation dialog

**AC:**
- Admin can add, edit, and remove family members
- Role selector shows all five roles with descriptions
- Non-admin users see their own profile only (no manage users nav item)

---

### Sprint 1.3 — Calendar & Tasks Core (Week 3–5)

**Goal:** Internal calendar working; Google Calendar syncing; tasks creatable and completable

---

#### Task 1.3.1 `[DB]` *BLOCKER* — Calendar and task schema migration

**What to build:**

Alembic migration `002_calendar_tasks.py` creating:

- `calendar_sources`: id, family_id, provider (enum: internal/google/microsoft/apple/ical), display_name, color_hex, sync_direction (enum: read/write/bidirectional), credentials_encrypted (TEXT, JSON blob AES-256 encrypted), last_synced_at, sync_error, enabled, created_at
- `calendar_events`: id, source_id (FK), external_id (nullable, for synced events), title, start_dt (ISO8601 UTC), end_dt, all_day (bool), location, description, recurrence_rule (RRULE string), color_label, created_by (FK users), assignee_ids (JSON array), category_tag, last_modified, is_deleted
- `tasks`: id, family_id (FK), title, description, assignee_id (FK users nullable), due_date, recurrence_rule, status (enum: pending/in_progress/completed/verified/rejected/overdue/skipped/archived), priority (enum: low/medium/high/urgent), area_tag, category_tag, points (int), parent_task_id (FK tasks, nullable), estimated_minutes, created_by (FK), created_at, updated_at, is_deleted
- `task_completions`: id, task_id (FK), completed_by (FK users), completed_at, notes, photo_path, verified_by (FK users nullable), verified_at, verification_status (enum: pending/approved/rejected), rejection_reason

SQLAlchemy models in `backend/app/models/calendar.py` and `backend/app/models/tasks.py`.

**AC:**
- Migration runs cleanly
- All foreign key relationships are correct
- Rollback works

---

#### Task 1.3.2 `[BE]` *BLOCKER* — Internal calendar API

**What to build:**

`backend/app/routers/calendar.py`:

- `GET /api/calendar/events` — query params: `start`, `end` (ISO dates), `assignee_id`, `source_id`. Returns events in range.
- `POST /api/calendar/events` — create event (admin/co-admin/teen). Body mirrors `calendar_events` schema. Creates in the `internal` source.
- `GET /api/calendar/events/{event_id}` — get single event
- `PATCH /api/calendar/events/{event_id}` — update (owner or admin)
- `DELETE /api/calendar/events/{event_id}` — soft delete (sets is_deleted=true)
- `GET /api/calendar/sources` — list calendar sources for the family
- `POST /api/calendar/sources` — add a new source (admin only; used by calendar sync setup)

`backend/app/services/calendar.py`: event CRUD, recurrence expansion (expand RRULE events for a date range using `python-dateutil`), conflict detection logic.

**AC:**
- Can create, read, update, delete events
- GET with date range returns all events including expanded recurrences in that range
- All-day events are handled (no time component, stored as date-only with `all_day=true`)

---

#### Task 1.3.3 `[BE]` — Google Calendar OAuth2 integration

**What to build:**

`backend/app/integrations/google_calendar.py`:
- `get_auth_url(state)` → Google OAuth2 authorization URL with scopes: `https://www.googleapis.com/auth/calendar`
- `exchange_code(code)` → exchanges auth code for access + refresh tokens
- `refresh_token(credentials)` → refreshes access token using refresh token
- `list_calendars(credentials)` → returns list of the user's Google calendars
- `sync_events(credentials, calendar_id, sync_direction, since_token)` → pulls events since last sync using incremental sync tokens. For `bidirectional` or `write`: also pushes local events created/modified since `last_synced_at`.
- Encrypt credentials before storage: `backend/app/core/encryption.py` — `encrypt(data: str) → str` and `decrypt(data: str) → str` using AES-256-GCM with key derived from `SECRET_KEY`

`backend/app/routers/integrations.py`:
- `GET /api/integrations/google/auth-url` — returns OAuth URL (admin only)
- `GET /api/integrations/google/callback` — OAuth callback; exchanges code, fetches calendar list, stores encrypted credentials, creates `calendar_sources` rows, redirects to `/settings/calendars`
- `DELETE /api/integrations/google/{source_id}` — disconnects a Google calendar

`backend/app/jobs/calendar_sync.py`:
- APScheduler job: `sync_all_calendars()` — runs every 15 minutes (configurable via env `CALENDAR_SYNC_INTERVAL_MINUTES`)
- Iterates all enabled `calendar_sources`, dispatches to the appropriate provider integration
- On error: logs to `sync_errors` column, does not crash the scheduler

**AC:**
- Admin can initiate Google OAuth flow from the UI
- After callback, Google Calendar events appear in `calendar_events` table
- Background job runs every 15 min and imports new events
- Sync errors are stored and don't stop other sources from syncing

---

#### Task 1.3.4 `[BE]` *BLOCKER* — Tasks API

**What to build:**

`backend/app/routers/tasks.py`:

- `GET /api/tasks` — query params: `assignee_id`, `status`, `due_before`, `due_after`, `area_tag`. Returns tasks matching filters. Family-scoped.
- `POST /api/tasks` — create task (admin/co-admin). Body mirrors task schema.
- `GET /api/tasks/{task_id}` — single task with sub-tasks and completion history
- `PATCH /api/tasks/{task_id}` — update task fields (admin/co-admin)
- `DELETE /api/tasks/{task_id}` — soft delete (admin only)
- `POST /api/tasks/{task_id}/complete` — mark complete (any authenticated user if they are the assignee, or admin). Body: `{notes?, photo?}` (multipart). Creates `task_completions` row. If task has recurrence, generates next instance.
- `POST /api/tasks/{task_id}/verify` — admin/co-admin only. Body: `{status: "approved"|"rejected", rejection_reason?}`
- `GET /api/tasks/{task_id}/completions` — history of completions for this task

`backend/app/services/tasks.py`: recurrence next-date calculation (using `python-dateutil` RRULE), overdue detection, subtask completion roll-up logic.

Background job: `check_overdue_tasks()` — runs every hour, sets `status=overdue` on tasks past due_date with `status=pending`.

**AC:**
- Task CRUD works for admin; non-admin can only read assigned tasks and mark their own complete
- Photo attachment on completion saves to `./data/photos/completions/{task_id}/{timestamp}.jpg`
- Completing a recurring task generates next instance with the correct next due date
- Overdue job fires hourly and updates status correctly

---

#### Task 1.3.5 `[FE]` *BLOCKER* — Calendar UI (Day/Week/Month/Agenda views)

**What to build:**

`frontend/src/pages/Calendar.tsx` + supporting components:

- View switcher: Day / Week / Month / Agenda (persisted per user in localStorage)
- **Month view**: grid of 5–6 week rows; each day cell shows event pills (title truncated, color-coded by source); overflow indicator ("+2 more") that expands on tap
- **Week view**: 7 columns, time-of-day rows; events positioned by start/end time; touch-draggable to reschedule (admin only)
- **Day view**: single column time grid
- **Agenda view**: flat list grouped by date, infinite scroll
- Event pill colors: use the `calendar_source.color_hex`; overlay assignee avatar icon if assigned
- Navigation: prev/next arrows, "Today" button; swipe left/right on mobile for prev/next period
- Tap event → Event Detail drawer: shows title, time, location, description, assignees, source label, edit/delete buttons (if admin)
- "New event" FAB (floating action button) → Event form sheet (admin/co-admin only): title, all-day toggle, start/end datetime pickers, location, description, assignees multi-select, category, recurrence dropdown (None / Daily / Weekly / Specific days / Monthly / Custom)
- Family member filter chips at top (tap to show/hide a member's events)

`frontend/src/api/calendar.ts`: TanStack Query hooks for `useCalendarEvents(start, end, filters)`, `useCreateEvent`, `usePatchEvent`, `useDeleteEvent`.

**AC:**
- All four views render events correctly
- Tapping an event opens the detail drawer
- Creating/editing/deleting an event updates the view without a full page reload
- Month view handles event overflow without layout breakage
- View is usable on a 375px wide phone screen

---

#### Task 1.3.6 `[FE]` — Tasks UI (My Tasks + Household Board)

**What to build:**

`frontend/src/pages/Tasks.tsx` — tab view:

- **My Tasks** tab: grouped by due date (Today / Tomorrow / This Week / Later / No due date). Each task card: title, priority badge, area tag, points value, assignee avatar, complete button (checkmark, 56×56px). Tap card → task detail.
- **Board** tab (Kanban): columns: To Do / In Progress / Done / Needs Verification. Cards show task title, assignee avatar. Horizontal scroll on mobile.
- **By Person** tab (admin only): accordion grouped by family member, showing each person's pending tasks.

Task Detail sheet/page:
- Title, description, due date, recurrence label, estimated time, area, priority, points
- Subtask checklist (checkboxes)
- Complete button → opens completion sheet: notes text area, photo upload (camera or file), submit
- For admin: "Verify" / "Reject" buttons if task has pending verification
- Completion history timeline at bottom

`frontend/src/components/tasks/TaskCard.tsx`: reusable task card for all contexts.
`frontend/src/api/tasks.ts`: TanStack Query hooks.

**AC:**
- My Tasks shows current user's pending tasks
- Complete action opens the completion sheet, submits, and optimistically updates the UI
- Admin can see all tasks in the Board view
- Subtask checkboxes update in real-time
- Task cards have min 56×56px touch targets

---

### Sprint 1.4 — Wall Display, PWA & Photo Slideshow (Week 5–8)

**Goal:** Wall screen functional on dedicated display; PWA installable on phones; photo slideshow running

---

#### Task 1.4.1 `[DB]` — Photo and album schema migration

**What to build:**

Alembic migration `003_photos.py`:
- `photos`: id, family_id, file_path, thumbnail_path, caption, taken_at, uploaded_by, uploaded_at, tagged_user_ids (JSON), exif_data (JSON, nullable), is_deleted
- `albums`: id, family_id, name, cover_photo_id (FK nullable), slideshow_eligible (bool), slideshow_transition (enum: fade/slide/zoom), slideshow_duration_s (int default 10), slideshow_order (enum: sequential/random/date), show_captions (bool), created_by, created_at
- `album_photos`: album_id, photo_id, order_index (composite PK)

**AC:** Migration runs; rollback works.

---

#### Task 1.4.2 `[BE]` — Photo and album API

**What to build:**

`backend/app/routers/photos.py`:
- `POST /api/photos/upload` — multipart file upload. Accepts JPEG/PNG/HEIC. Saves original to `./data/photos/originals/{uuid}{ext}`. Generates 400×300 thumbnail via Pillow (runs in `asyncio.to_thread` to avoid blocking). Extracts EXIF date if present. Returns photo record.
- `GET /api/photos` — list with filters: album_id, tagged_user, date_range, offset/limit
- `PATCH /api/photos/{photo_id}` — update caption, tags, album membership
- `DELETE /api/photos/{photo_id}` — soft delete
- `POST /api/albums` — create album
- `GET /api/albums` — list albums
- `PATCH /api/albums/{album_id}` — update album settings
- `POST /api/albums/{album_id}/photos` — add photos to album (body: `{photo_ids: []}`)
- `DELETE /api/albums/{album_id}/photos/{photo_id}` — remove from album
- `GET /api/albums/{album_id}/slideshow` — returns ordered photo list for slideshow display

Static file serving: FastAPI `StaticFiles` mount at `/photos` → `./data/photos/` (serves originals and thumbnails).

**AC:**
- Upload accepts file, generates thumbnail, returns both URLs
- HEIC files (from iPhone) are converted to JPEG via Pillow (requires `pillow-heif` package)
- Album CRUD works
- Slideshow endpoint returns photos in correct order (sequential/random/date)

---

#### Task 1.4.3 `[FE]` — Photo album management UI

**What to build:**

`frontend/src/pages/Photos.tsx`:
- Album grid: thumbnail mosaics, album name, photo count
- Inside album: masonry grid of photos, tap to open full-screen viewer with swipe navigation
- Full-screen viewer: swipe gestures, caption display, tagged members display, share/download button
- Upload flow: file picker (multi-select) + drag-and-drop on desktop; progress bar per file
- "New album" button, album settings (slideshow options)
- Photo detail: edit caption, tag family members (tap member avatar chips)

**AC:**
- Upload multiple photos in one operation
- Full-screen viewer supports swipe on touch devices
- Album settings save correctly (transition style, duration, order)

---

#### Task 1.4.4 `[FE]` *BLOCKER* — Wall display route (`/wall`)

**What to build:**

`frontend/src/wall/WallLayout.tsx` — full-screen layout served at `/wall`:

**Layout structure** (configurable later, hardcoded layout for Phase 1):
```
┌─────────────────────────────────────────────────────────────┐
│  CLOCK + DATE (large)    │    TODAY'S EVENTS                 │
│                          │    (family calendar strip)        │
├──────────────────────────┴───────────────────────────────────┤
│  CHORE STATUS                                                │
│  [Person 1: ✓ ✓ ○]  [Person 2: ✓ ○ ○]  [Person 3: ○ ○ ○] │
└─────────────────────────────────────────────────────────────┘
```

Components to build:
- `WallClock.tsx` — large digital clock (HH:MM) + full date ("Wednesday, April 23"). Updates every second via `setInterval`.
- `WallEventStrip.tsx` — today's events in time order. Each event: colored pill with title and time. Pulls from `GET /api/calendar/events?start=today&end=today`. Refreshes every 60 seconds.
- `WallChoreStatus.tsx` — per-person chore completion widget. For each family member: avatar + display name + dot indicators (✓ for complete, ○ for pending). Tapping a pending dot opens the Quick Complete overlay.
- `WallQuickComplete.tsx` — touch overlay that appears when a chore is tapped: shows task title, large "Mark Complete" button, optional PIN pad (if admin has configured PIN requirement). On complete: calls `POST /api/tasks/{id}/complete`, closes overlay, updates dot indicator.
- `WallPhotoSlideshow.tsx` — runs in the photo area (or full-screen in idle mode). Fetches slideshow-eligible albums. Cycles photos with configured transition (CSS transitions, fade implemented first). Each photo displays with optional caption overlay.

**Idle mode:**
- After 5 minutes of no touch interaction (`touchstart`/`mousemove`), enter idle mode: photo slideshow fills entire screen, clock overlaid bottom-right
- Any touch returns to main wall layout
- Idle timeout configurable via `WALL_IDLE_TIMEOUT_SECONDS` env var

**Wall-specific styles:**
- Base font size 20px (vs 16px elsewhere)
- All colors from Tailwind config; support for `dark` class on `<html>` (admin-toggleable)
- No scrolling — everything must fit in the viewport
- All tap targets ≥ 56×56px

**AC:**
- Wall layout renders correctly at 1920×1080 and 1280×800 (the two most common Pi display resolutions)
- Clock updates every second
- Events refresh without page reload
- Chore status updates within 60 seconds of a task being completed on any device
- Idle slideshow activates after 5 minutes; any touch exits it
- Quick complete works with and without PIN confirmation

---

#### Task 1.4.5 `[BE]` — WebSocket endpoint for real-time wall updates

**What to build:**

`backend/app/routers/ws.py`:
- `WS /api/ws/wall` — WebSocket endpoint. On connect: sends current wall state snapshot. On task/event change (triggered by service layer): broadcasts update event to all connected wall clients.
- Event types: `task_updated`, `event_updated`, `announcement_new`
- `backend/app/core/events.py`: in-memory `EventBus` class; services call `event_bus.emit(type, payload)`; websocket handler subscribes and forwards to clients
- Polling fallback: if WebSocket fails (client network issue), wall components fall back to 60-second polling

**AC:**
- Marking a task complete on a phone causes the wall to update within 2 seconds via WebSocket
- Wall continues working (with 60s delay) if WebSocket connection drops
- WebSocket gracefully handles client disconnect

---

#### Task 1.4.6 `[FE]` *BLOCKER* — PWA: service worker, install flow, offline mode

**What to build:**

`vite.config.ts` — configure `vite-plugin-pwa`:
- `registerType: 'autoUpdate'`
- `workbox.runtimeCaching`: cache `/api/auth/me`, `/api/users`, `/api/tasks`, `/api/calendar/events` with `NetworkFirst` strategy (try network, fall back to cache)
- `workbox.navigateFallback`: serve cached app shell for all routes
- `manifest`: complete manifest with all icon sizes, `display: standalone`, correct `theme_color`, `background_color`

`frontend/src/components/OfflineBanner.tsx`: listens to `navigator.onLine` + `online`/`offline` events; shows a yellow banner "You're offline — showing saved data" when disconnected.

`frontend/src/components/InstallPrompt.tsx`:
- Listens for `beforeinstallprompt` event (Chrome/Android)
- Shows "Add to Home Screen" banner with Install button after 30 seconds on first visit
- On iOS Safari: detects `navigator.standalone === false` on iOS → shows a custom "Tap Share → Add to Home Screen" instruction modal (once per device, stored in localStorage)

**AC:**
- Chrome Desktop: "Install app" button appears and installs the PWA
- Android Chrome: Install prompt appears after 30 seconds
- iOS Safari: install instruction modal appears on first visit
- With Pi off: app loads from cache, shows offline banner, doesn't crash
- Task list from last session is visible while offline
- DevTools → Lighthouse PWA audit: no critical failures

---

#### Task 1.4.7 `[FE]` — Dashboard (Phase 1 version)

**What to build:**

`frontend/src/pages/Dashboard.tsx` — role-aware home page:

**Standard mode (admin/co-admin/teen):**
- Today's Events widget: compact list of today's calendar events
- My Tasks Today widget: tasks due today with complete buttons
- Greeting: "Good morning, [name]" with current time

**Child mode** (`ui_mode === 'child'`):
- Large avatar greeting
- Task cards: illustrated emoji icon, large task title, giant checkmark button
- Star/point balance prominently displayed ("⭐ 12 stars")

All dashboard widgets load independently (each its own TanStack Query call) so one slow query doesn't block others.

**AC:**
- Admin sees today's events + today's tasks
- Child-mode user sees simplified view with large touch targets
- Widgets update without full page reload
- Dashboard loads in under 3 seconds on Pi hardware (test this)

---

#### Task 1.4.8 `[INFRA]` — Kiosk boot script and wall screen setup documentation

**What to build:**

`scripts/setup-wall-screen.sh`:
```bash
#!/bin/bash
# Sets up Raspberry Pi OS desktop to launch Chromium in kiosk mode on boot
# Disables screensaver, configures autostart
```

`docs/wall-screen-setup.md`:
- Step-by-step for: install Raspberry Pi OS desktop, enable SSH, configure auto-login, install Chromium, set up autostart with kiosk flags (`--kiosk --noerrdialogs --disable-infobars --touch-events=enabled http://familyhub.local/wall`), disable cursor on touch-only displays, configure display rotation if needed.

**AC:**
- Following the documentation on a fresh Pi OS install results in the wall display launching automatically on boot within 2 minutes
- Touch events are correctly handled (no cursor visible, touch = click)

---

#### Task 1.4.9 `[BE]` — Automated daily backup job

**What to build:**

`backend/app/jobs/backup.py`:
- APScheduler job: runs daily at `BACKUP_TIME` (default: 3:00 AM local time)
- Creates a timestamped copy of the SQLite file: `./data/backups/familyhub_{YYYY-MM-DD}.db`
- Deletes backups older than `BACKUP_RETENTION_DAYS` (default: 30)
- Logs backup success/failure

**AC:**
- Backup job runs at configured time
- Backup files appear in `./data/backups/`
- Old backups are pruned
- Job failure is logged but doesn't crash the application

---

#### Task 1.4.10 `[TEST]` — Phase 1 integration test suite

**What to build:**

**Backend (pytest):**
- `tests/test_auth.py` (12+ tests): setup flow, password login, PIN login, rate limiting (5 attempts → 429), session validation, token expiry, role-based endpoint access, 401 on missing cookie — **Coverage target: 90%+**
- `tests/test_calendar.py` (15+ tests): event CRUD, recurrence expansion (daily/weekly/monthly RRULE), date range queries, all-day event handling, timezone conversion, soft delete — **Coverage target: 85%+**
- `tests/test_tasks.py` (18+ tests): task CRUD, complete task (with + without photo), verify/reject, overdue job, subtask roll-up, recurrence generation, permission checks (non-admin can only complete own tasks) — **Coverage target: 85%+**
- `tests/test_photos.py` (10+ tests): upload, thumbnail generation, HEIC→JPEG conversion, album CRUD, slideshow ordering (sequential/random/date) — **Coverage target: 80%+**
- `tests/test_migrations.py` (3+ tests): `alembic upgrade +1` / `alembic downgrade -1` cycle for each migration — **Coverage target: 80%+**

**Frontend (Vitest + RTL):**
- `src/__tests__/pages/Login.test.tsx` (8+ tests): render family avatars, PIN pad input, successful login redirect, failed PIN lockout, password login — **Coverage target: 75%+**
- `src/__tests__/pages/Dashboard.test.tsx` (6+ tests): render events widget, render tasks widget, child mode rendering, widget independent loading — **Coverage target: 75%+**
- `src/__tests__/wall/WallClock.test.tsx` (4+ tests): clock updates every second, date displays correctly — **Coverage target: 80%+**

**AC:**
- `pytest --cov=app --cov-report=term-missing`: all tests pass, 80%+ overall coverage
- `npm test`: all frontend tests pass, 70%+ coverage
- CI reports coverage on every push; warns if coverage drops below targets

---

#### Task 1.4.11 `[TEST]` — Phase 1 Performance Baseline (Pi Hardware)

**What to test:**
- Dashboard load time: < 3 seconds (first paint)
- GET /api/calendar/events: < 200ms (response time)
- Wall display clock update: smooth (no visible lag)
- Memory per container: api < 150MB, web < 80MB, caddy < 30MB

**Equipment:** Raspberry Pi 4, 4GB RAM, actual Pi OS (not Docker Desktop)

**How to measure:**
```bash
# API response time
curl -w "%{time_total}s\n" -o /dev/null -s http://localhost:8000/api/calendar/events
# Memory per container
docker stats --no-stream
```

**AC:**
- Dashboard fully renders in < 3s on Pi 4
- All API endpoints respond in < 500ms (p95)
- Memory stable after 1 hour continuous use
- Document baseline metrics in `README.md`

---

#### Task 1.4.12 `[TEST]` — Phase 1 Security Review

**Checklist:**
- [ ] Authentication: verify `require_auth` / `get_current_user` on all non-public endpoints
- [ ] Authorization: role checks — admin/co-admin endpoints reject teen/child/guest users (403)
- [ ] Input validation: all API endpoints validate input via Pydantic schemas
- [ ] Secrets: no API keys in code; all env vars documented in `.env.example`
- [ ] CORS: `ALLOWED_ORIGINS` configured correctly, no `*` wildcard
- [ ] Rate limiting: login and PIN attempts rate-limited (429 after 5 failures)
- [ ] Data exposure: soft-deletes work (is_deleted=true), no leaked user data
- [ ] Bandit scan: `bandit -r backend/app` — 0 critical issues
- [ ] Cookie security: JWT cookies are httpOnly, SameSite=Strict

**AC:**
- All security checklist items pass
- Bandit report: 0 critical issues
- Document any known limitations as TODOs in code

---

**Phase 1 Exit Criteria (all must pass before Phase 2 begins):**
- [ ] `docker compose up -d` on fresh Pi → app accessible at familyhub.local within 3 minutes
- [ ] Setup wizard completes successfully
- [ ] Family member can log in on iPhone/Android via PWA with PIN
- [ ] PWA install prompt appears and installs successfully on Android Chrome and iOS Safari
- [ ] Wall display loads at `/wall`, clock ticks, events and chores shown
- [ ] Idle slideshow activates after 5 minutes, touch exits it
- [ ] Completing a task on the phone updates the wall display within 5 seconds
- [ ] Google Calendar events appear in FamilyHub within 15 minutes
- [ ] Child-mode dashboard renders correctly with large touch targets

---

## Phase 2 — Full Calendars + Lists + Family Board
**Duration:** Weeks 8–18 (5 sprints × ~2 weeks)
**Goal:** All three calendar providers syncing; custom lists are the primary household tool; Family Board fully configurable

---

### Sprint 2.1 — Microsoft & Apple Calendar Integrations (Week 8–10)

#### Task 2.1.1 `[BE]` — Microsoft Graph API integration

**What to build:**

`backend/app/integrations/microsoft_calendar.py`:
- MSAL `ConfidentialClientApplication` setup with `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` (from .env; default tenant = `common` for personal accounts)
- `get_auth_url(state)`, `exchange_code(code)`, `refresh_token(credentials)`
- `list_calendars(credentials)` → GET `/me/calendars`
- `sync_events(credentials, calendar_id, sync_direction, delta_link)` → use Graph API delta queries (`/me/calendarView/delta`) for incremental sync

`backend/app/routers/integrations.py` additions:
- `GET /api/integrations/microsoft/auth-url`
- `GET /api/integrations/microsoft/callback`
- `DELETE /api/integrations/microsoft/{source_id}`

**AC:**
- Microsoft OAuth flow completes and stores encrypted tokens
- Microsoft Calendar events sync to `calendar_events` table
- Sync direction (read-only / write / bidirectional) is respected
- Delta sync only fetches changed events (not full re-sync every 15 min)

---

#### Task 2.1.2 `[BE]` — Apple CalDAV integration

**What to build:**

`backend/app/integrations/apple_calendar.py` using `caldav` Python library:
- `connect(email, app_specific_password)` → DAV client connecting to `https://caldav.icloud.com`
- `discover_calendars(client)` → list user's iCloud calendars via DAV principal
- `sync_events(client, calendar_url, sync_direction, last_synced_at)` → pull events modified since last sync using `REPORT` DAV method with time range
- For write direction: `PUT` new/modified events as iCalendar (`.ics`) objects via `caldav`

`backend/app/routers/integrations.py` additions:
- `POST /api/integrations/apple/connect` — body: `{email, app_specific_password}` (not OAuth; stored encrypted)
- `GET /api/integrations/apple/calendars` — list discovered calendars
- `POST /api/integrations/apple/enable/{calendar_id}` — create `calendar_source` row
- `DELETE /api/integrations/apple/{source_id}`

UI note: Apple integration form must display a clear explanation that an app-specific password is required (link to Apple's instructions) and that this is a limitation of Apple's APIs, not a bug.

**AC:**
- Apple CalDAV connection works with app-specific password
- iCloud events sync to `calendar_events`
- Rate limit errors trigger exponential backoff (not crash)

---

#### Task 2.1.3 `[FE]` — Calendar settings page

**What to build:**

`frontend/src/pages/admin/CalendarSettings.tsx`:
- Connected calendars list: each source shows provider logo, display name, color swatch (editable), sync direction selector (read-only / write-only / two-way), last synced timestamp, sync status (ok / error), disconnect button
- "Add calendar" section with three provider cards: Google, Microsoft, Apple (each with connect button)
- Sync log viewer: last 20 sync events per source with timestamp, events synced count, error details if any
- "Sync now" button per source (calls `POST /api/calendar/sources/{id}/sync`)

**AC:**
- All three providers have connect/disconnect flows
- Sync direction can be changed per source without reconnecting
- Sync errors display clearly with actionable messaging

---

#### Task 2.1.4 `[BE]` — Calendar sync conflict detection + resolution

**What to build:**

`backend/app/services/calendar.py` additions:
- Conflict detection: when syncing a bidirectional source, detect when `external_last_modified > last_synced_at AND local_last_modified > last_synced_at` on the same event
- Create `sync_conflicts` table (migration `004_sync_conflicts.py`): id, source_id, event_id, external_version (JSON), local_version (JSON), detected_at, resolved_by, resolution (keep_local / keep_external / keep_both), resolved_at

`backend/app/routers/calendar.py` additions:
- `GET /api/calendar/conflicts` — list unresolved conflicts (admin only)
- `POST /api/calendar/conflicts/{id}/resolve` — body: `{resolution: "keep_local"|"keep_external"|"keep_both"}`

`frontend/src/components/ConflictBadge.tsx`: notification badge in calendar settings when unresolved conflicts exist.

**AC:**
- Conflicts are detected and logged, not silently overwritten
- Admin can see and resolve each conflict
- Resolving "keep_external" overwrites local; "keep_local" overwrites external; "keep_both" creates a duplicate

---

### Sprint 2.2 — Custom Lists Module (Week 10–12)

#### Task 2.2.1 `[DB]` — Lists schema migration

**What to build:**

Alembic migration `005_lists.py`:
- `list_templates`: id, family_id, name, category (enum: packing/sleepover/cleaning/grocery/school/birthday/road_trip/emergency/pet/medication/custom), locked, created_by, created_at, updated_at
- `list_template_items`: id, template_id, title, notes, default_assignee_id (FK nullable), default_quantity (int), default_unit, aisle_category, order_index
- `list_instances`: id, template_id (FK nullable — instances can be created without a template), name, context_note, created_by, created_at, archived_at, completed_at
- `list_instance_items`: id, instance_id, title, notes, assignee_id (FK nullable), quantity, unit, aisle_category, priority (bool), completed (bool), completed_by (FK nullable), completed_at, order_index

**AC:** Migration runs; rollback works.

---

#### Task 2.2.2 `[BE]` — Lists API

**What to build:**

`backend/app/routers/lists.py`:

Templates:
- `GET /api/list-templates` — all templates for the family
- `POST /api/list-templates` — create template (admin/co-admin)
- `PATCH /api/list-templates/{id}` — update (admin/co-admin; blocked if locked)
- `DELETE /api/list-templates/{id}` — soft delete

Instances:
- `POST /api/list-templates/{id}/instantiate` — creates a `list_instance` with a full copy of the template's items. Body: `{name, context_note}`
- `POST /api/list-instances` — create blank instance (no template)
- `GET /api/list-instances` — list active instances; query: `archived=false` (default)
- `GET /api/list-instances/{id}` — instance with all items and completion status
- `PATCH /api/list-instances/{id}` — update name, context note
- `POST /api/list-instances/{id}/archive` — archive completed instance
- `GET /api/list-instances/archived` — archived instances

Instance items:
- `POST /api/list-instances/{id}/items` — add item
- `PATCH /api/list-instances/{id}/items/{item_id}` — update item (text, assignee, quantity)
- `POST /api/list-instances/{id}/items/{item_id}/complete` — mark item complete
- `POST /api/list-instances/{id}/items/{item_id}/uncomplete` — uncheck
- `DELETE /api/list-instances/{id}/items/{item_id}` — remove item
- `POST /api/list-instances/{id}/items/reorder` — body: `{item_ids: []}` reorders items

**AC:**
- Template instantiation creates a deep copy (editing the instance doesn't affect the template)
- Item ordering is persisted
- Completion is per-item and tracked (who completed it, when)
- Locked templates: items cannot be added/removed/reordered (but can be instantiated)

---

#### Task 2.2.3 `[FE]` — Lists UI (templates + active instances)

**What to build:**

`frontend/src/pages/Lists.tsx`:
- **Active** tab: cards for each active list instance (name, context note, progress bar "9/14 items", creation date). Tap → open instance.
- **Templates** tab: grid of template cards by category (category icons). Tap template → "Use this list" button (creates instance) or "Edit template" (admin).
- **Archive** tab: chronological list of archived instances.

`frontend/src/pages/ListInstance.tsx` — the active list view:
- List title + context note (editable inline)
- Progress bar at top
- Item rows: large checkbox (56×56px), item title, assignee avatar chip, quantity badge, priority star
- **Shopping Mode** toggle (for grocery/shopping lists): groups items by `aisle_category` with section headers; checked items slide to a "Done" section at the bottom. Section headers are collapsible.
- "Add item" inline text field at bottom of list
- Reorder: long-press on an item activates drag mode (touch-optimized using `@dnd-kit/sortable`)
- Assign item: tap assignee chip → member picker
- Share button: copies a deep link to the list

`frontend/src/pages/admin/ListTemplateEditor.tsx`:
- Full template editor with same item list UI
- "Lock template" toggle (admin only)
- Built-in templates: pre-populated from a `seed_templates.py` fixture run on first setup

**AC:**
- Instantiating a template creates a working active list
- Checking items off works on wall, phone, and tablet simultaneously
- Shopping mode groups items by aisle
- Drag-to-reorder works on touchscreen
- List progress percentage updates in real-time

---

### Sprint 2.3 — Chore Board, Rewards & Enhanced Wall (Week 12–14)

#### Task 2.3.1 `[FE]` — Kanban chore board

**What to build:**

`frontend/src/pages/ChoreBoard.tsx`:
- Four columns: To Do / In Progress / Done (pending verification) / Verified
- Each card: task title, assignee avatar, area tag, priority color, point value badge
- Drag cards between columns to update status (admin only; uses `@dnd-kit`)
- Filter bar: by assignee, by area, by date
- "Add chore" button → quick-add form (title, assignee, due date, recurrence, points)
- Completion photo thumbnail shown on Done cards (tap to view full-size)
- Verify/Reject buttons on Done cards (admin/co-admin)

**AC:**
- Drag-and-drop updates task status via API
- Photo evidence visible on completed tasks
- Admin can verify or reject directly from the board

---

#### Task 2.3.2 `[BE]` `[FE]` — Point / reward system

**What to build:**

`backend` additions:
- Migration `006_rewards.py`: `reward_definitions` (id, family_id, title, description, point_cost, created_by), `reward_redemptions` (id, user_id, reward_id, redeemed_at, approved_by)
- `GET /api/rewards` — list reward definitions
- `POST /api/rewards` — create reward (admin)
- `GET /api/users/{id}/points` — return point balance (sum of completed+verified task points minus redeemed)
- `POST /api/rewards/{id}/redeem` — user requests redemption; creates redemption record with pending status
- `POST /api/rewards/redemptions/{id}/approve` — admin approves

`frontend/src/pages/Rewards.tsx`:
- Per-member point balance with animated star count
- Available rewards list with point cost; "Redeem" button (disabled if insufficient points)
- Admin view: pending redemption requests with approve/deny buttons
- Point history ledger: list of earned points (task title, points, date)

**AC:**
- Points accumulate automatically when tasks are verified
- Child can see their balance and request reward redemptions
- Admin receives notification of pending redemption requests

---

#### Task 2.3.3 `[FE]` — Family Board panel editor + enhanced wall

**What to build:**

`frontend/src/pages/admin/WallLayoutEditor.tsx` — drag-and-drop grid editor:
- Available panels list (left): Clock/Date, Today's Events, Chore Status, Meal Plan Today (placeholder), Photo Slideshow, Weather, Announcements, Upcoming Countdowns
- Canvas (right): 2-column or 3-column grid; drag panels from list onto grid; resize panels (1×1, 1×2, 2×1, 2×2)
- Panel settings: click a placed panel → configure it (e.g., Chore Status: select which members to show; Photo Slideshow: select albums)
- "Dark mode" toggle for wall display
- "Save layout" → stores as JSON in `families.settings_json`

`frontend/src/wall/WallLayout.tsx` update:
- Read layout configuration from API instead of hardcoded structure
- Render panels in configured positions
- Per-member focus mode: tap a member's avatar → full-screen view of their tasks + events; tap anywhere to return

**AC:**
- Admin can rearrange wall panels without code changes
- Per-person focus mode works on wall touchscreen
- Dark mode toggle takes effect immediately on the wall display

---

### Sprint 2.4 — Weather, Announcements & Push Notifications (Week 14–16)

#### Task 2.4.1 `[BE]` `[FE]` — Weather widget

**What to build:**

`backend/app/integrations/weather.py`:
- Fetches from `https://api.open-meteo.com/v1/forecast` (no API key)
- Params: `latitude`, `longitude`, `current=temperature_2m,weather_code,wind_speed_10m`, `daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code`
- Caches response for 30 minutes (in-memory cache dict with expiry)
- `GET /api/weather` — returns current + 5-day forecast. Lat/lon come from `WEATHER_LAT` and `WEATHER_LON` env vars.

`frontend/src/components/widgets/WeatherWidget.tsx`:
- Current temp + weather icon (mapped from WMO weather codes)
- High/low for today
- 5-day forecast strip (icon + high/low)
- Shows "weather unavailable" gracefully if lat/lon not configured

**AC:**
- Weather loads on dashboard and wall board
- Weather icon correctly maps to WMO weather codes (sunny, cloudy, rain, snow, etc.)
- Weather is unavailable message shown (not a crash) if WEATHER_LAT/LON are not set

---

#### Task 2.4.2 `[BE]` `[FE]` — Family announcements board

**What to build:**

Migration `007_announcements.py`: `announcements` (id, family_id, author_id, body, pinned, reactions_json, created_at, expires_at nullable)

`backend` additions:
- `GET /api/announcements` — list active (not expired) announcements, pinned first
- `POST /api/announcements` — create (any authenticated user). Body: `{body, expires_at?}`
- `DELETE /api/announcements/{id}` — author or admin
- `POST /api/announcements/{id}/pin` — admin only; toggle pin
- `POST /api/announcements/{id}/react` — body: `{emoji: "👍"}`. Adds or removes user's reaction.

`frontend/src/components/widgets/AnnouncementsWidget.tsx`:
- Card feed of announcements, pinned at top with pin icon
- Each card: author avatar, time ago, body text, emoji reaction row (tap to react)
- Post field at bottom of widget: multiline textarea + "Post" button
- On wall display: read-only (shows only), no post field

**AC:**
- Any family member can post an announcement
- Pinned announcements stay at top
- Reactions update immediately (optimistic UI)
- Expired announcements disappear automatically (filter on `expires_at`)

---

#### Task 2.4.3 `[BE]` `[FE]` — Push notifications infrastructure

**What to build:**

`backend` additions:
- Migration `008_push_subscriptions.py`: `push_subscriptions` (id, user_id, endpoint, p256dh, auth, created_at, device_hint)
- `POST /api/push/subscribe` — save a Web Push subscription
- `DELETE /api/push/subscribe` — remove subscription for current device
- `backend/app/services/push.py`: `send_push(user_id, title, body, url)` using `pywebpush`. Iterates all subscriptions for user, sends push, handles expired subscription cleanup (410 Gone → delete subscription).
- VAPID keys generated on first run and stored in `families.settings_json`. Document key generation in setup README.

`frontend/src/hooks/usePushNotifications.ts`:
- `requestPermission()`: requests browser notification permission, registers service worker push handler, posts subscription to `/api/push/subscribe`
- Handles permission denied gracefully (no error thrown, user can re-enable later)

Notification triggers (call `send_push` from services):
- Task overdue: sent to assignee when task is marked overdue
- Task verification needed: sent to admins when a task completion is submitted
- Reward redemption requested: sent to admins

Settings UI: `frontend/src/pages/NotificationSettings.tsx` — per-category toggles for notification types (overdue tasks, verifications, announcements). Preferences stored in `users.settings_json`.

**AC:**
- After granting permission, push notifications are delivered to PWA on Android and iOS
- Notification tapping opens the relevant task/item
- Users can opt out per category in notification settings

---

### Sprint 2.5 — Backup Automation, Calendar iCal Feeds & Phase 2 Testing (Week 16–18)

#### Task 2.5.1 `[BE]` — iCal (.ics) feed subscriptions

**What to build:**

`backend/app/integrations/ical_feed.py`:
- `fetch_and_parse(url)` → uses `httpx` to fetch .ics URL, parses with `icalendar` Python library, returns list of event dicts
- Handles recurring events, timezone conversion to UTC
- `backend/app/jobs/calendar_sync.py` update: include iCal feeds in the sync job (refresh every 6 hours; configurable per-source via `sync_interval_hours`)

`backend/app/routers/integrations.py` additions:
- `POST /api/integrations/ical` — body: `{url, display_name, color_hex}`. Validates URL by fetching it. Creates `calendar_source` with `provider=ical` and `sync_direction=read`.

`frontend/src/pages/admin/CalendarSettings.tsx` update: "Add iCal feed" section with URL input field, display name, color picker.

**AC:**
- Paste a public iCal URL (e.g., school calendar) → events appear in calendar within 6 hours
- Invalid URLs show a validation error immediately on save
- iCal sources are read-only (no sync direction option shown)

---

#### Task 2.5.2 `[TEST]` — Phase 2 exit criteria validation

**Manual test checklist:**
- [ ] Google, Microsoft, and Apple calendars all sync with correct direction settings
- [ ] Sync conflict appears when same event modified on both sides; admin can resolve
- [ ] Packing list template instantiated, shared with family, items checked off from wall and phone simultaneously
- [ ] Shopping mode groups grocery items by aisle
- [ ] Drag-to-reorder works on both wall touchscreen and mobile
- [ ] Kanban board drag-and-drop updates task status
- [ ] Child can see point balance and request reward redemption
- [ ] Wall board layout can be rearranged by admin
- [ ] Dark mode toggle takes effect on wall display
- [ ] Per-person focus mode works on wall
- [ ] Weather widget displays on wall and dashboard
- [ ] Push notification received on phone for overdue task

---

## Phase 3 — Routines + Meal Planning + Enrichment
**Duration:** Weeks 18–30 (6 sprints × ~2 weeks)
**Goal:** Proactive household management — structured routines, meal planning, quality-of-life enrichment features

---

### Sprint 3.1 — Routines Module (Week 18–20)

#### Task 3.1.1 `[DB]` — Routines schema

Migration `009_routines.py`:
- `routines`: id, family_id, name, description, assignee_ids (JSON), schedule_days (JSON array of weekday ints), schedule_time, active, created_by, created_at
- `routine_steps`: id, routine_id, order_index, title, description, estimated_minutes, linked_task_id (FK nullable), linked_list_item_id (FK nullable), icon_emoji
- `routine_logs`: id, routine_id, user_id, date, completed_steps (JSON array of step IDs), completed_at, started_at

#### Task 3.1.2 `[BE]` — Routines API

- Full CRUD for routines and steps
- `POST /api/routines/{id}/start` — creates a `routine_logs` row with `started_at = now`
- `POST /api/routines/{id}/logs/{log_id}/step/{step_id}/complete` — marks step complete in the log
- `POST /api/routines/{id}/logs/{log_id}/complete` — marks the entire routine log complete
- `GET /api/routines/{id}/stats` — returns streak count, weekly completion rate, last 30-day history
- `POST /api/routines/{id}/clone` — deep-clones routine and all steps with "(copy)" suffix

#### Task 3.1.3 `[FE]` — Routine builder (admin)

- `frontend/src/pages/admin/RoutineBuilder.tsx`: name, description, assignee multi-select, schedule days (day-of-week checkboxes), schedule time picker
- Step editor: drag-to-reorder step list, inline add/edit/delete steps, estimated duration field, emoji picker for step icon, optional link to existing task

#### Task 3.1.4 `[FE]` — Routine Runner (full-screen mode)

`frontend/src/pages/RoutineRunner.tsx`:
- Full-screen, large-touch-target guided mode (designed for wall or tablet)
- Shows one step at a time: step icon (large emoji, 80px), step title (32px), description, estimated time
- Countdown timer per step (circle progress animation); skip button
- Progress bar at top showing step X of Y
- "Complete step" large button (entire bottom third of screen)
- Confetti animation on routine completion
- Streak indicator on completion: "🔥 5-day streak!"

#### Task 3.1.5 `[FE]` — Routine dashboard widget + wall panel

- `RoutineProgressWidget.tsx`: shows each assigned family member's routine for today with step completion dots
- Wall board panel: compact per-person routine status

**Sprint 3.1 AC:**
- Admin can build a custom routine with 5+ steps
- Child can run a bedtime routine on the wall touchscreen step-by-step
- Streak counter correctly calculates consecutive days

---

### Sprint 3.2 — Meal Planning (Week 20–23)

#### Task 3.2.1 `[DB]` — Meal planning schema

Migration `010_meals.py`:
- `recipes`: id, family_id, name, description, servings, prep_minutes, cook_minutes, instructions (JSON steps), dietary_tags (JSON), photo_path, source_url, created_by
- `recipe_ingredients`: id, recipe_id, name, quantity, unit, aisle_category, order_index
- `meal_plan_weeks`: id, family_id, week_start_date (Monday), created_by, is_template (bool), template_name
- `meal_plan_slots`: id, week_id, day_of_week (0-6), meal_type (enum: breakfast/lunch/dinner/snack), recipe_id (FK nullable), free_text (nullable), suggested_by, approved (bool)
- `pantry_items`: id, family_id, ingredient_name, quantity, unit, expiry_date, updated_at

#### Task 3.2.2 `[BE]` — Meal planner API

- Recipe CRUD + `GET /api/recipes/search?q=` (text search on name + tags)
- Meal plan CRUD (current week auto-created if not exists)
- `POST /api/meal-plans/{week_id}/generate-shopping-list` — consolidates ingredients from all planned meals minus pantry on-hand items, creates a `list_instance` in the Lists module
- `POST /api/recipes/import-url` — scrapes recipe from URL using `recipe-scrapers` Python library
- Pantry CRUD endpoints

#### Task 3.2.3 `[FE]` — Weekly meal planner UI

`frontend/src/pages/MealPlanner.tsx`:
- 7-column × 4-row grid (Mon–Sun × Breakfast/Lunch/Dinner/Snack)
- Each cell: recipe photo thumbnail + name (or free-text entry); tap to assign recipe or type free text
- Recipe picker: searchable drawer with recipe cards, dietary tag filters
- "Generate shopping list" button → creates list instance and navigates to it
- Meal suggestions panel: recently-not-used recipes suggested based on meal history
- Week navigation (prev/next); "Use as template" saves the week as a named template

#### Task 3.2.4 `[FE]` — Recipe library + import

`frontend/src/pages/Recipes.tsx`:
- Recipe card grid with photo, name, cook time, dietary tags
- Recipe detail: ingredients (scalable by servings using a serving-count slider), step-by-step instructions
- Add recipe form: all fields + ingredient rows (add/remove rows)
- Recipe URL import: paste URL → loading state → pre-filled form for review before saving

**Sprint 3.2 AC:**
- Weekly meal plan can be fully planned for the week
- "Generate shopping list" produces a correctly consolidated list
- Recipe URL import works for at least 3 major recipe sites
- Meal plan widget displays on wall board and dashboard

---

### Sprint 3.3 — Morning Briefing, Homework Tracker & Family Wiki (Week 23–25)

#### Task 3.3.1 `[FE]` — Morning Briefing auto-cycle wall mode

`frontend/src/wall/MorningBriefing.tsx`:
- Full-screen mode (toggled from wall settings, or auto-activates 6–9 AM daily)
- Cycles through panels on a configurable timer (default: 10 seconds per panel)
- Panel sequence (configurable): Date/Clock → Weather → Today's Meals → Per-person tasks → Family events → Photo slideshow
- Each panel is full-bleed, large-text design optimized for viewing at 3m distance
- Subtle progress dots at bottom showing position in cycle
- Touch anywhere to pause cycle; touch again to resume

#### Task 3.3.2 `[BE]` `[FE]` — Homework tracker

Migration `011_homework.py`: `homework_assignments` (id, user_id, subject, title, due_date, estimated_minutes, status, notes, created_at)

- `backend/app/routers/homework.py`: CRUD for assignments (user-scoped: each user sees only their own)
- `frontend/src/pages/Homework.tsx`: subject-grouped list, due date calendar integration (auto-creates calendar event), progress bar showing today's homework load
- Widget shown on teen/child dashboard

#### Task 3.3.3 `[BE]` `[FE]` — Family Wiki

Migration `012_wiki.py`: `wiki_pages` (id, family_id, title, category, content_markdown, visible_to_roles (JSON), updated_by, updated_at)

- Categories: Emergency Contacts, Medical, Insurance, School, Utilities, Pets, Vehicles, WiFi & Tech
- Markdown editor in admin
- Role-based visibility: admin can mark pages visible to all roles or only admin/co-admin
- Fast full-text search across all wiki pages
- `frontend/src/pages/Wiki.tsx`: category sidebar + content area; mobile: accordion layout

---

### Sprint 3.4 — Allowance, Pet Care & Collaborative Notes (Week 25–27)

#### Task 3.4.1 `[BE]` `[FE]` — Allowance tracker extension

Extend rewards system:
- Add `monetary_value` field to `reward_definitions` (null = points-only reward; number = dollar amount)
- `allowance_ledger` table: id, user_id, amount_cents, type (earned/deducted/paid), task_id (FK nullable), created_by, note, created_at
- Admin can set a "pay rate" per task or a weekly flat allowance per user
- `frontend/src/pages/Allowance.tsx`: per-child balance, ledger history, "Mark as paid" action for admin

#### Task 3.4.2 `[BE]` `[FE]` — Pet care tracker

Migration: `pets` (id, family_id, name, species, photo_path, birth_date, notes), `pet_care_tasks` (extends tasks with `pet_id` FK)

- Pet profiles page: name, species, photo, age calculated from birth_date
- Pet's recurring care tasks (feeding, medication, grooming) integrate with the main task assignment system
- Vet appointments auto-added to family calendar

#### Task 3.4.3 `[BE]` `[FE]` — Collaborative notes

Migration: `notes` (id, family_id, title, content_markdown, visible_to_roles, pinned, created_by, updated_at)

- Simple markdown scratchpad (no rich editor — use `react-markdown` for rendering, textarea for editing)
- "Convert to list" button: parses bullet points into a new list template
- Pinned notes appear on dashboard

---

### Sprint 3.5 — Guest Access & Caregiver Link (Week 27–28)

#### Task 3.5.1 `[BE]` `[FE]` — Temporary caregiver access

Migration: `access_links` (id, family_id, created_by, token_hash, label (e.g., "Babysitter June 5"), permissions_json, expires_at, used_count, max_uses)

- `POST /api/access-links` — admin creates a time-limited access link (e.g., 24 hours)
- `GET /api/access-links/{token}` — validates token, returns a guest session with limited permissions
- Guest sessions show: today's calendar, today's tasks with assignees, emergency contacts from wiki, specific lists (configurable per-link)
- Link management UI in admin: create, list active links, revoke

---

### Sprint 3.6 — Phase 3 Integration & Performance Testing (Week 28–30)

#### Task 3.6.1 `[TEST]` — Performance profiling on Pi hardware

- Measure: dashboard load time, API response times under simultaneous use by 5 users, memory usage per container after 24h uptime
- Identify and fix any > 1s API responses
- Verify thumbnail generation doesn't spike CPU to 100% on Pi 4 (2GB)
- Verify backup job completes in < 30 seconds for a 1GB database

**Phase 3 Exit Criteria:**
- [ ] Bedtime routine runs step-by-step on wall touchscreen; streaks tracked
- [ ] Weekly meal plan generates a consolidated shopping list correctly
- [ ] Recipe URL import works
- [ ] Morning Briefing mode cycles panels without touch
- [ ] Family Wiki is searchable and role-gated
- [ ] API response time < 500ms at p95 on Pi 4 under household load
- [ ] Memory footprint stays within budget (< 300MB total idle)

---

## Phase 4 — Intelligence + Admin Polish + Accessibility
**Duration:** Weeks 30–44 (7 sprints × ~2 weeks)

High-level sprint breakdown:

| Sprint | Focus |
|---|---|
| 4.1 | Goals & Habit Tracker + Vehicle Maintenance Tracker |
| 4.2 | Full Admin Settings UI (all config from the UI; no .env editing post-install) |
| 4.3 | Advanced task/chore reporting (30/60/90-day completion stats per person) |
| 4.4 | PostgreSQL migration path + offline write queue (task completions sync when back online) |
| 4.5 | Bulk operations (bulk assign, reschedule, archive across tasks and lists) |
| 4.6 | i18n string extraction + WCAG 2.1 AA accessibility audit and remediation |
| 4.7 | Phase 4 performance optimization + API documentation (OpenAPI via FastAPI Swagger UI) |

Each sprint follows the same pattern as Phase 1–3 sprints: DB migration → BE API → FE UI → Tests.

---

## Phase 5 — Ecosystem & Extensibility
**Duration:** Weeks 44–56 (6 sprints × ~2 weeks)

| Sprint | Focus |
|---|---|
| 5.1 | Home Assistant integration (MQTT/REST webhook bridge; wall panels showing HA sensors) |
| 5.2 | Alexa + Google Home webhook (read-only voice query API) |
| 5.3 | Multi-household support (separate data spaces; shared calendar view option) |
| 5.4 | Capacitor mobile app wrappers (iOS + Android; push notifications via FCM) |
| 5.5 | Community template library (JSON import/export; shareable via URL or file) |
| 5.6 | Backup restore UI; automated update flow; setup wizard v2 |

---

## Cross-Cutting Tasks (Every Phase)

These tasks recur throughout development and should be treated as ongoing obligations, not one-time deliverables:

- **Security review:** Before each phase release, review new API endpoints for missing auth checks, over-broad permissions, and unvalidated inputs
- **Pi hardware testing:** At the end of every phase, run the full application on actual Raspberry Pi 4 hardware and measure memory, CPU, and response times. Do not rely solely on Docker Desktop testing.
- **Dependency updates:** Monthly `pip-audit` and `npm audit` run; patch critical CVEs within one week
- **Documentation:** Every new API endpoint documented in OpenAPI (FastAPI does this automatically). Every new env var added to `.env.example` with a comment.
- **Migration rollback test:** Every Alembic migration must be tested both `upgrade` and `downgrade` before merging

---

## Development Environment Setup (Day 1 Checklist)

For any developer picking up this project:

1. Install: Docker Desktop, Node.js 20+, Python 3.12, Git
2. `git clone [repo]`
3. `cp .env.example .env` — fill in `SECRET_KEY` (generate with `openssl rand -hex 32`), `TIMEZONE`, `FAMILY_NAME`
4. `docker compose up -d` — starts the full stack
5. Navigate to `https://familyhub.local` — accept self-signed cert warning
6. Run setup wizard to create first admin account
7. For backend development: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload` (runs outside Docker for hot-reload)
8. For frontend development: `cd frontend && npm install && npm run dev` (Vite dev server with HMR)
9. API docs: `http://localhost:8000/docs` (FastAPI Swagger UI, auto-generated)

---

*Implementation Plan v1.1 — Derived from FamilyHub Requirements v1.2*
*Next update: After Phase 1 Sprint 1.2 retrospective*
