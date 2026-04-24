# FamilyHub — Implementation Plan v2.0

**Version:** 2.0 (Enhanced with Phase Efficiency & Testing Integration)  
**Derived from:** Requirements Document v1.1 + Phase & Testing Strategy Review  
**Date:** April 2026  
**Status:** Ready for Development  

---

## What Changed From v1.0

This version integrates recommendations from the Phase Efficiency & Testing Strategy Review:
- ✅ Added **Phase 1.0 API Design Sprint** (before Sprint 1.1)
- ✅ Added **testing tasks to every sprint** (not just Phase 1.4)
- ✅ Added **Phase N.5 overlap sprints** (knowledge transfer between phases)
- ✅ Added **Phase N.T tech debt sprints** (prevent rework)
- ✅ Added **performance baseline validation** (Task 1.4.11)
- ✅ Added **feedback gates** between phases
- ✅ Added **developer readiness exit criteria**
- ✅ Added **security review tasks** to each phase
- ✅ Added **e2e testing** to Phase 2
- ✅ Parallelized **Phase 2 sprint structure**
- ✅ Updated **Task 1.1.4** with Vitest + React Testing Library
- ✅ Added **production support model** documentation
- ✅ Added **pairing strategy** for complex features

---

## How to Use This Document

Each phase is broken into sprints (roughly 1–2 weeks each). Each sprint contains ordered tasks. Tasks are written as concrete development actions, not abstract goals. Dependencies are called out explicitly. Each task has acceptance criteria (AC) — the definition of "done" before moving to the next task.

**Conventions:**
- `[BE]` = backend (Python/FastAPI) work
- `[FE]` = frontend (React/TypeScript) work
- `[INFRA]` = Docker / Caddy / deployment work
- `[DB]` = database schema / migration work
- `[TEST]` = test writing (unit, integration, or manual)
- `[SEC]` = security review and testing
- Tasks marked `*BLOCKER*` must be complete before any subsequent task in that sprint begins

**New Sprint Types:**
- **Phase N.0:** Pre-phase planning & design (before Phase N.1)
- **Phase N.T:** Tech debt & documentation sprint (between phases, 5 days)
- **Phase N.5:** Overlap sprint (final 1-2 weeks of phase, knowledge transfer)

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
│   ├── tests/                # Unit and integration tests
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
│   │   ├── __tests__/        # Frontend unit tests (Vitest + RTL)
│   │   └── wall/             # Wall display components (isolated)
│   ├── public/
│   │   └── icons/            # PWA icons (all sizes)
│   ├── index.html
│   ├── vite.config.ts
│   ├── vitest.config.ts      # Test configuration
│   └── Dockerfile
├── config/
│   └── Caddyfile
├── data/                     # Bind-mounted at runtime (gitignored)
│   ├── db/
│   ├── photos/
│   └── backups/
├── docs/                     # Project documentation (NEW)
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT.md
│   ├── DATABASE_SCHEMA.md
│   ├── CONTRIBUTING.md
│   └── adr/                  # Architecture Decision Records
│       ├── 001-caddy-reverse-proxy.md
│       └── ...
├── scripts/
│   └── setup-wall-screen.sh
├── docker-compose.yml
├── .env.example
├── README.md
└── VERSION
```

---

## Timeline Overview (v2.0)

### Phase Timeline

| Phase | Duration | Key Deliverable | Exit Gate |
|-------|----------|-----------------|-----------|
| **Phase 0** | Week 0 (prep) | API contracts, tech decisions | Design approval |
| **Phase 1** | Weeks 1–8 | MVP: wall, PWA, Google Calendar | User testing + dev readiness |
| **Phase 1.T** | Week 8 (5 days) | Tech debt cleanup, docs | Quality check |
| **Phase 1.5** | Weeks 7–8 | Knowledge transfer to Phase 2 | Phase 2 team on-board |
| **Phase 2** | Weeks 9–18 | All calendars, lists, chores, rewards | User feedback + performance baseline |
| **Phase 2.T** | Week 18 (5 days) | Tech debt cleanup | Quality check |
| **Phase 2.5** | Weeks 17–18 | Knowledge transfer to Phase 3 | Phase 3 team on-board |
| **Phase 3** | Weeks 19–30 | Routines, meal planning, wiki, enrichment | User validation + performance audit |
| **Phase 3.T** | Week 30 (5 days) | Tech debt cleanup | Quality check |
| **Phase 3.5** | Weeks 29–30 | Knowledge transfer to Phase 4 | Phase 4 team on-board |
| **Phase 4** | Weeks 31–44 | Admin polish, accessibility, advanced features | Performance optimization + security |
| **Phase 4.T** | Week 44 (5 days) | Tech debt cleanup | Quality check |
| **Phase 4.5** | Weeks 43–44 | Knowledge transfer to Phase 5 | Phase 5 team on-board |
| **Phase 5** | Weeks 45–56 | Ecosystem, integrations, mobile | Launch ready |

**Total Duration (with overlaps + tech debt):** ~58 weeks
**With Parallelization (Phase 2–5):** ~49 weeks (20% faster)

---

## Pre-Development: Pre-Phase Setup

### Phase 0 — Planning, Architecture & API Design (Week 0)

**Goal:** Team alignment on all architecture and API contracts before any code is written.

**Prerequisites:**
- Requirements v1.1 finalized ✅
- Team assigned (2–3 BE devs, 1–2 FE devs, 1 DevOps, 1 PM)
- Development environment ready (Docker Desktop, Node 20+, Python 3.12)

---

#### Task 0.1 `[INFRA]` *BLOCKER* — Infrastructure & Database Decisions

**What to decide:**
- **Database:** SQLite for Phase 1–5, or PostgreSQL in Phase 4? (Recommend: decide now for async SQLAlchemy compatibility)
- **Caching layer:** In-memory (Cachetools) or Redis?
- **Job queue:** APScheduler only (Phase 1–3), or RabbitMQ/Celery in Phase 3+?
- **Search:** SQLite full-text search or Elasticsearch in Phase 5?
- **External services:** Cloud dependencies allowed, or zero-cloud only?

**AC:**
- Written decision document (1 page max per question)
- Tech lead sign-off
- Implications for Phase 1 architecture documented

**Duration:** 2–4 hours (meeting + documentation)

---

#### Task 0.2 `[BE][FE]` *BLOCKER* — OpenAPI Contract Design

**What to build:**
- **OpenAPI 3.1 specification** for all Phase 1 endpoints
  - Input: Feature list from Sprint 1.2–1.4 tasks
  - Output: Versioned `openapi.json` file in repo
  - All endpoints documented with request/response schemas

**Participants:** 1 BE lead, 1 FE lead, optional: architect

**AC:**
- `openapi.json` checked in to repo
- All Phase 1 endpoints documented:
  - `/api/auth/*` (setup, login, logout, me, status)
  - `/api/users/*` (list, create, update, delete, avatar)
  - `/api/calendar/*` (events, sources)
  - `/api/tasks/*` (list, create, complete, verify)
  - `/api/photos/*` (upload, list, delete)
  - `/api/ws/wall` (WebSocket)
- FE lead reviews and approves (or files issues on spec)

**Duration:** 2–3 days

---

#### Task 0.3 `[BE]` — Technology Stack & Dependencies Lock

**What to build:**
- Finalize `requirements.txt` for backend (with versions)
- Decide on and document:
  - **SQLAlchemy strategy:** Async with `aiosqlite` for Phase 1 (compatible with PostgreSQL upgrade in Phase 4)
  - **Testing frameworks:** pytest, pytest-asyncio, httpx
  - **Async concurrency:** asyncio model (no Celery in Phase 1; APScheduler in-process)
  - **Logging:** Python `logging` + structured JSON logs (for production)

**AC:**
- `requirements.txt` locked with all versions
- `backend/pyproject.toml` or `setup.py` configured (if using modern Python packaging)
- README documents: "To develop, install with `pip install -r requirements.txt`"

**Duration:** 1 day

---

#### Task 0.4 `[FE]` — Frontend Test Framework & Dependencies

**What to build:**
- Initialize test framework: **Vitest + React Testing Library**
- Create `vitest.config.ts` with:
  - TanStack Query test utilities (createWrapper for QueryClient)
  - Mock setup for API calls
  - Coverage reporting
- Create example test: `frontend/src/__tests__/pages/Login.test.tsx` (placeholder)
- Install all dependencies:
  - Testing: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@vitest/ui`
  - Mocking: `msw` (mock service worker)
  - TanStack Query mock utilities

**AC:**
- `npm test` runs without errors (0 tests initially)
- `vitest.config.ts` configured and checked in
- Example test file created (placeholder, can be empty)
- README documents: "To run tests: `npm test`"
- Code coverage reporting configured: `npm test -- --coverage`

**Duration:** 1–2 days

---

#### Task 0.5 `[INFRA]` — Development Environment Setup & CI/CD Pipeline

**What to build:**
- `.github/workflows/ci.yml` template (not pushing images yet, just testing)
  - Lint checks (frontend + backend)
  - Unit tests (pytest + npm test)
  - Code coverage reports
  - Type checking (mypy for Python, TypeScript for frontend)
- Local development guide (`docs/DEVELOPMENT.md`)
- Team development environment checklist

**AC:**
- CI workflow checks in to repo
- Local dev environment runs without Docker issues
- README updated with "Day 1 Setup" instructions

**Duration:** 1 day

---

**Phase 0 Deliverables:**
- ✅ Architecture decision document
- ✅ OpenAPI specification (openapi.json)
- ✅ `requirements.txt` + dependencies locked
- ✅ Vitest + RTL configured
- ✅ CI/CD pipeline framework
- ✅ Phase 1 team is 100% aligned on API contracts and architecture

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
- Create Git repository with the directory structure shown above
- Write `docker-compose.yml` with three services: `api` (FastAPI, port 8000), `web` (Vite dev server, port 5173 in dev / Nginx in prod, port 3000), `caddy` (ports 80/443)
- Write `Caddyfile` with `tls internal` for `familyhub.local`, routing `/api/*` → api:8000 and `/*` → web:3000
- Write `.env.example` documenting all required variables
- Write `README.md` with quick-start instructions
- Configure bind mounts: `./data/db`, `./data/photos`, `./data/backups`, `./config`
- Set all services to `restart: unless-stopped`

**AC:**
- `docker compose up -d` on a clean machine starts all three containers without errors
- `https://familyhub.local` returns a 200
- `https://familyhub.local/api/health` returns `{"status": "ok"}`
- Containers survive `docker compose restart` with no data loss

---

#### Task 1.1.2 `[INFRA]` — GitHub Actions CI: lint, tests, type checking

**What to build:**
- `.github/workflows/ci.yml` that triggers on push to `main`
- Runs:
  - **Backend:** `mypy` type checking, `pytest` unit tests, coverage report
  - **Frontend:** TypeScript type checking, `npm test`, coverage report
  - **Linting:** `flake8` / `ruff` for Python, `eslint` for JavaScript
- Caches Docker layers and dependencies between builds
- Reports coverage to codecov.io (optional, but recommended)

**AC:**
- Push to main triggers CI within 2 minutes
- All checks pass with 0 errors
- Coverage reports generated and stored

---

#### Task 1.1.3 `[BE]` *BLOCKER* — FastAPI application skeleton

**What to build:**
- `backend/app/main.py`: FastAPI app, CORS middleware, exception handlers, lifespan hooks
- `backend/app/core/config.py`: Pydantic Settings model
- `backend/app/core/database.py`: **Async SQLAlchemy engine + aiosqlite** (Phase 4 PostgreSQL compatible)
- `backend/app/core/security.py`: JWT, password hashing
- `/api/health` endpoint returning build version and uptime
- Alembic initialized and wired to async SQLAlchemy
- `requirements.txt` with all Phase 1 dependencies

**AC:**
- `GET /api/health` returns 200 with version
- Alembic migrations run on startup
- No startup errors in container logs
- Type checking passes: `mypy app/` ✅

---

#### Task 1.1.4 `[FE]` *BLOCKER* — React/Vite/TypeScript frontend skeleton

**What to build:**
- Initialize Vite project: `npm create vite@latest frontend -- --template react-ts`
- Install: `react-router-dom`, `@tanstack/react-query`, `tailwindcss`, `@shadcn/ui`, `zustand`, `axios`
- Configure Tailwind with custom theme
- Install and configure `vite-plugin-pwa` with manifest
- Create placeholder PWA icons
- Set up React Router with placeholder routes
- Set up TanStack Query provider
- Set up Zustand auth store
- Create `src/api/client.ts`: axios instance with JWT handling
- **NEW:** Set up test framework (**Vitest + React Testing Library**)
  - `vitest.config.ts` configured
  - TanStack Query test utilities (createWrapper)
  - Example test: `src/__tests__/pages/Login.test.tsx` (placeholder)
- `frontend/Dockerfile`: multi-stage build
- `frontend/package.json` scripts: `npm run dev`, `npm run build`, `npm test`

**AC:**
- `npm run dev` starts without errors
- `npm run build` produces `dist/` folder
- `npm test` runs without errors (0 tests initially)
- `https://familyhub.local` shows React app
- Chrome DevTools → Application → Manifest shows PWA manifest
- TypeScript strict mode: `tsc --noEmit` ✅ (no errors)

---

#### Task 1.1.5 `[DB]` *BLOCKER* — Initial database schema migration

**What to build:**
- Alembic migration `001_initial_schema.py` creating:
  - `families` table (id, name, timezone, settings_json, created_at)
  - `users` table (id, family_id, display_name, role, avatar, color, ui_mode, pin_hash, password_hash, created_at, last_login_at)
  - `sessions` table (id, user_id, token_hash, device_hint, expires_at, created_at)
- SQLAlchemy models in `backend/app/models/auth.py`
- All tables use UUID primary keys (TEXT in SQLite)
- All timestamps are UTC

**AC:**
- `alembic upgrade head` runs cleanly against an empty database
- `alembic downgrade -1` rolls back completely
- Rollback tested: database state pre/post is identical
- Tables queryable via SQLite CLI
- Migration test: `tests/test_migrations.py` includes upgrade/downgrade cycle

---

#### Task 1.1.6 `[TEST]` — Phase 1 Backend Test Framework Setup

**What to build:**
- `backend/tests/conftest.py`: async test client fixture, in-memory SQLite, fresh schema per test session
- `backend/tests/test_health.py`: assert `/api/health` returns 200
- Install test dependencies: `pytest`, `pytest-asyncio`, `httpx`
- GitHub Actions step to run `pytest` and coverage

**AC:**
- `pytest tests/test_health.py` passes
- CI runs tests on every push
- Coverage reported: `--cov=app --cov-report=html`

**Duration:** 5 days (parallel with other 1.1 tasks)

---

**Sprint 1.1 Duration:** 2 weeks (Days 1–10)  
**Sprint 1.1 Exit Criteria:**
- [ ] `docker compose up -d` works on clean machine
- [ ] `https://familyhub.local` accessible
- [ ] All GitHub Actions checks pass
- [ ] Backend and frontend builds without errors
- [ ] Test framework configured and running

---

### Sprint 1.2 — Authentication & First-Run Setup (Week 2–3)

**Goal:** Family can create accounts, log in, and set up the household

---

#### Task 1.2.1 `[BE]` *BLOCKER* — Auth API endpoints

**What to build:**
- `backend/app/routers/auth.py`: POST /api/auth/setup, /api/auth/login, /api/auth/login/pin, /api/auth/logout, GET /api/auth/me, GET /api/auth/setup/status
- `backend/app/core/security.py` additions: `get_current_user` dependency, `require_role` dependency factory
- Rate limiting for PIN: 5 failures → 60-second lockout

**AC:**
- POST /api/auth/setup creates family + admin user, returns JWT cookie
- POST /api/auth/login returns 200 with cookie on valid credentials, 401 on invalid
- PIN rate-limiting: 6th attempt within 60s returns 429
- GET /api/auth/me returns user when cookie present, 401 when absent
- GET /api/auth/setup/status returns false on fresh DB, true after setup

**Testing AC (NEW):**
- Unit tests: `tests/test_auth.py` (12+ tests covering setup, login, PIN, rate limiting, session validation)
- Coverage: 90%+
- Test both happy path and error scenarios (auth failure, timeout, invalid input)
- All tests pass: `pytest tests/test_auth.py -v`

---

#### Task 1.2.2 `[BE]` — User management API

**What to build:**
- `backend/app/routers/users.py`: GET /api/users, POST /api/users, GET /api/users/{id}, PATCH, DELETE, POST avatar upload
- `backend/app/services/users.py`: user CRUD, avatar processing via Pillow

**AC:**
- Admin can create users of any role
- Non-admin cannot create users (403)
- Avatar upload saves file and thumbnail
- User list returns all non-deleted users

**Testing AC (NEW):**
- Unit tests: `tests/test_users.py` (10+ tests)
- Coverage: 85%+

---

#### Task 1.2.3 `[FE]` *BLOCKER* — Setup wizard (first-run flow)

**What to build:**
- `frontend/src/pages/SetupWizard.tsx`: multi-step form (household name, timezone, admin account)
- Update `App.tsx`: check `/api/auth/setup/status` on load; redirect to `/setup` if needed

**Testing AC (NEW):**
- Integration tests: `frontend/src/__tests__/pages/SetupWizard.test.tsx` (5+ tests)
- Coverage: 75%+

**AC:**
- Fresh install navigates to `/setup` automatically
- Completing wizard creates family + admin and lands on dashboard
- Form validates: password min 8 chars, required fields

---

#### Task 1.2.4 `[FE]` — Login page

**What to build:**
- `frontend/src/pages/Login.tsx`: family member avatars as cards, PIN pad or password field per user, error handling

**Testing AC (NEW):**
- Component tests: `frontend/src/__tests__/pages/Login.test.tsx` (6+ tests)
- Coverage: 75%+

**AC:**
- Family member avatars display without auth
- PIN pad has 56×56px minimum button size
- Successful login navigates to dashboard
- 5 failed PINs shows lockout message

---

#### Task 1.2.5 `[FE]` — User management screens (admin)

**What to build:**
- `frontend/src/pages/admin/ManageUsers.tsx`: list members, add/edit/delete form

**Testing AC (NEW):**
- Component tests: `frontend/src/__tests__/pages/admin/ManageUsers.test.tsx` (5+ tests)
- Coverage: 70%+

**AC:**
- Admin can add, edit, remove members
- Non-admin see profile only

---

**Sprint 1.2 Duration:** 2 weeks  
**Sprint 1.2 Testing Summary:**
- 12 backend auth tests
- 10 user management tests
- 5 setup wizard tests
- 6 login tests
- 5 user management UI tests
- **Total: 38 tests**
- **Coverage target: 80%+ backend, 70%+ frontend**

---

### Sprint 1.3 — Calendar & Tasks Core (Week 3–5)

**Goal:** Internal calendar working; Google Calendar syncing; tasks creatable and completable

---

#### Task 1.3.1 `[DB]` *BLOCKER* — Calendar and task schema migration

**What to build:**
- Alembic migration `002_calendar_tasks.py` creating calendar_sources, calendar_events, tasks, task_completions tables
- SQLAlchemy models in `backend/app/models/calendar.py` and `backend/app/models/tasks.py`

**Testing AC (NEW):**
- Migration test: `tests/test_migrations.py` includes this migration
- `alembic upgrade +1` completes without error
- `alembic downgrade -1` rolls back completely
- No data loss on downgrade

**AC:**
- Migration runs cleanly
- All foreign key relationships correct
- Rollback works

---

#### Task 1.3.2 `[BE]` *BLOCKER* — Internal calendar API

**What to build:**
- `backend/app/routers/calendar.py`: GET/POST/PATCH/DELETE events, GET calendar sources
- `backend/app/services/calendar.py`: event CRUD, recurrence expansion (python-dateutil), conflict detection

**Testing AC (NEW):**
- Unit tests: `tests/test_calendar.py` (15+ tests)
- Coverage: 85%+
- Test: CRUD, recurrence expansion, date range queries, all-day events, timezone conversion, concurrent updates
- Test both happy path and error scenarios (malformed RRULE, invalid dates, etc.)

**AC:**
- Can create, read, update, delete events
- Recurrence expansion works for date ranges
- All-day events handled correctly

---

#### Task 1.3.3 `[BE]` — Google Calendar OAuth2 integration

**What to build:**
- `backend/app/integrations/google_calendar.py`: get_auth_url, exchange_code, refresh_token, sync_events
- `backend/app/core/encryption.py`: AES-256-GCM encryption for credentials
- `backend/app/routers/integrations.py`: OAuth endpoints
- `backend/app/jobs/calendar_sync.py`: APScheduler job syncing every 15 minutes

**Testing AC (NEW):**
- Unit tests: `tests/test_integrations.py` (12+ tests for Google Calendar)
- Coverage: 85%+
- Mock Google API responses (msw - mock service worker)
- Test: auth URL generation, code exchange, token refresh, error handling (invalid credentials, network timeout)
- Test encryption/decryption of stored credentials

**AC:**
- Admin OAuth flow works
- Events appear in calendar_events table after sync
- Background job runs every 15 min
- Sync errors don't crash the job

---

#### Task 1.3.4 `[BE]` *BLOCKER* — Tasks API

**What to build:**
- `backend/app/routers/tasks.py`: GET/POST/PATCH/DELETE tasks, complete, verify, history
- `backend/app/services/tasks.py`: task CRUD, recurrence, overdue detection
- Background job: check_overdue_tasks (hourly)

**Testing AC (NEW):**
- Unit tests: `tests/test_tasks.py` (18+ tests)
- Coverage: 85%+
- Test: CRUD, completion (with/without photo), verify/reject, overdue job, recurrence, subtasks, permissions
- Test photo handling: save, generate metadata, cleanup on task delete

**AC:**
- Task CRUD works per role
- Completion generates next recurring instance
- Overdue job marks tasks correctly
- Photo attachment works

---

#### Task 1.3.5 `[FE]` *BLOCKER* — Calendar UI (Day/Week/Month/Agenda views)

**What to build:**
- `frontend/src/pages/Calendar.tsx`: Month/Week/Day/Agenda view switcher, event pills, detail drawer
- Drag-to-reschedule (admin only)
- New event FAB → event form sheet

**Testing AC (NEW):**
- Component tests: `frontend/src/__tests__/pages/Calendar.test.tsx` (10+ tests)
- Coverage: 75%+
- Test: render all views, event filtering, drag-to-reschedule, event creation UI, responsive on phone

**AC:**
- All four views render
- Event detail drawer works
- Create/edit/delete without full page reload
- Month view handles overflow
- Usable on 375px phone screen

---

#### Task 1.3.6 `[FE]` — Tasks UI (My Tasks + Household Board)

**What to build:**
- `frontend/src/pages/Tasks.tsx`: My Tasks tab, Kanban Board tab, By Person tab (admin)
- Task detail sheet: title, description, due date, subtasks, completion sheet
- Task card component

**Testing AC (NEW):**
- Component tests: `frontend/src/__tests__/pages/Tasks.test.tsx` (12+ tests)
- Coverage: 75%+
- Test: task list by due date, Kanban drag-drop, completion UI, subtasks

**AC:**
- My Tasks shows current user's tasks
- Complete action opens sheet, submits, updates UI
- Admin sees all tasks in Board
- Subtask checkboxes update

---

**Sprint 1.3 Duration:** 3 weeks  
**Sprint 1.3 Testing Summary:**
- 15 calendar API tests
- 12 Google Calendar integration tests
- 18 tasks API tests
- 10 calendar UI tests
- 12 tasks UI tests
- **Total: 67 tests**
- **Cumulative coverage: 80%+ backend, 70%+ frontend**

---

### Sprint 1.4 — Wall Display, PWA & Photo Slideshow (Week 5–8)

**Goal:** Wall screen functional; PWA installable on phones; photo slideshow running

[Continue with existing Sprint 1.4 tasks, but add testing tasks to each...]

#### Task 1.4.1 `[DB]` — Photo and album schema migration

[Existing content...]

**Testing AC (NEW):**
- Migration tested in `tests/test_migrations.py`

---

#### Task 1.4.2 `[BE]` — Photo and album API

[Existing content...]

**Testing AC (NEW):**
- Unit tests: `tests/test_photos.py` (12+ tests)
- Coverage: 80%+
- Test: upload, HEIC conversion, thumbnail generation, album CRUD
- Mock Pillow image processing

**AC:** [Existing...]

---

#### Task 1.4.3 `[FE]` — Photo album management UI

[Existing content...]

**Testing AC (NEW):**
- Component tests: `frontend/src/__tests__/pages/Photos.test.tsx` (8+ tests)
- Coverage: 70%+

**AC:** [Existing...]

---

#### Task 1.4.4 `[FE]` *BLOCKER* — Wall display route (`/wall`)

[Existing content...]

**Testing AC (NEW):**
- Component tests: `frontend/src/__tests__/wall/WallLayout.test.tsx` (6+ tests)
- Manual test: render at 1920×1080 and 1280×800 (common Pi displays)

**AC:** [Existing...]

---

#### Task 1.4.5 `[BE]` — WebSocket endpoint for real-time wall updates

[Existing content...]

**Testing AC (NEW):**
- Unit tests: `tests/test_websocket.py` (5+ tests)
- Coverage: 75%+
- Test: client connect, event broadcast, polling fallback

**AC:** [Existing...]

---

#### Task 1.4.6 `[FE]` *BLOCKER* — PWA: service worker, install flow, offline mode

[Existing content...]

**Testing AC (NEW):**
- Manual test: install on Chrome Desktop, Android Chrome, iOS Safari
- Component tests: `frontend/src/__tests__/components/InstallPrompt.test.tsx` (4+ tests)
- Manual: Lighthouse PWA audit (0 critical failures)

**AC:** [Existing...]

---

#### Task 1.4.7 `[FE]` — Dashboard (Phase 1 version)

[Existing content...]

**Testing AC (NEW):**
- Component tests: `frontend/src/__tests__/pages/Dashboard.test.tsx` (6+ tests)
- Coverage: 70%+
- Test: role-aware rendering, widget loading, responsiveness

**AC:** [Existing...]

---

#### Task 1.4.8 `[INFRA]` — Kiosk boot script and wall screen setup documentation

[Existing content...]

**AC:** [Existing...]

---

#### Task 1.4.9 `[BE]` — Automated daily backup job

[Existing content...]

**Testing AC (NEW):**
- Unit tests: `tests/test_backup.py` (3+ tests)
- Test: backup file creation, old file cleanup, error handling

**AC:** [Existing...]

---

#### Task 1.4.10 `[TEST]` — Phase 1 Integration & E2E Test Suite (EXPANDED)

**What to build:**

**Backend Integration Tests:**
- `tests/test_auth.py`: 12+ tests (setup, login, PIN, rate limiting, session validation, coverage 90%+)
- `tests/test_calendar.py`: 15+ tests (CRUD, recurrence, date range, timezone, coverage 85%+)
- `tests/test_tasks.py`: 18+ tests (CRUD, completion, verify/reject, overdue, coverage 85%+)
- `tests/test_photos.py`: 12+ tests (upload, HEIC, thumbnail, album, coverage 80%+)
- `tests/test_websocket.py`: 5+ tests (real-time updates, polling fallback)
- `tests/test_backup.py`: 3+ tests (backup creation, cleanup)
- `tests/test_integrations.py`: 12+ tests (Google Calendar OAuth, token refresh, error handling)
- **Total backend: 77 tests, 80%+ coverage**

**Frontend Component Tests:**
- `frontend/src/__tests__/pages/Calendar.test.tsx`: 10+ tests (all views, filtering, drag-drop)
- `frontend/src/__tests__/pages/Tasks.test.tsx`: 12+ tests (task list, Kanban, completion)
- `frontend/src/__tests__/pages/Photos.test.tsx`: 8+ tests (gallery, upload, slideshow)
- `frontend/src/__tests__/pages/Dashboard.test.tsx`: 6+ tests (role-based views, widgets)
- `frontend/src/__tests__/pages/Login.test.tsx`: 6+ tests (PIN pad, password, lockout)
- `frontend/src/__tests__/pages/SetupWizard.test.tsx`: 5+ tests (form validation, submission)
- `frontend/src/__tests__/wall/WallLayout.test.tsx`: 6+ tests (clock, events, chores, idle mode)
- `frontend/src/__tests__/components/InstallPrompt.test.tsx`: 4+ tests (install prompt, offline banner)
- **Total frontend: 57 tests, 70%+ coverage**

**Manual Test Checklist (User-Facing):**
- [ ] docker compose up -d on fresh Pi → app accessible at familyhub.local within 3 minutes
- [ ] Setup wizard completes successfully
- [ ] Family member can log in on iPhone/Android via PWA with PIN
- [ ] PWA install prompt appears and installs on Android Chrome + iOS Safari
- [ ] Wall display loads at `/wall`, clock ticks, events shown
- [ ] Idle slideshow activates after 5 minutes, touch exits it
- [ ] Completing task on phone updates wall within 5 seconds
- [ ] Google Calendar events appear in FamilyHub within 15 minutes
- [ ] Child-mode dashboard renders with large touch targets

**AC:**
- pytest: 80%+ overall coverage, all 77 backend tests pass
- npm test: all 57 frontend tests pass, 70%+ coverage
- CI reports coverage; warns if coverage drops
- Manual test checklist passes on Pi hardware
- No console errors or warnings

**Duration:** 5 days (parallel with 1.4.1–1.4.9)

---

#### Task 1.4.11 `[TEST]` — Phase 1 Performance Baseline (Pi Hardware) (NEW)

**What to test (on Raspberry Pi 4, 4GB RAM, real network):**
- Dashboard load time: < 3 seconds (first paint)
- GET /api/calendar/events: < 200ms (response time)
- GET /api/tasks: < 200ms (response time)
- Wall display clock update: 60fps (smooth)
- Memory per container (1 hour idle):
  - api: < 150MB
  - web: < 100MB
  - caddy: < 50MB
- All API endpoints (p95): < 500ms
- Database file size: < 100MB
- Startup time: < 2 minutes from `docker compose up -d` to fully responsive

**Equipment:**
- Raspberry Pi 4, 4GB RAM (performance baseline)
- Raspberry Pi 4, 2GB RAM (minimum spec test — log warnings)
- Real WiFi network (not localhost)

**Tools:**
- `curl` for endpoint timing
- `docker stats` for memory monitoring
- Chrome DevTools for frontend load time
- Physical stopwatch for startup time (or script automation)

**AC:**
- Dashboard fully renders < 3s
- All API endpoints respond < 500ms (p95)
- Memory stable after 1 hour continuous use (no leaks)
- Memory usage on 2GB Pi documented (warning if > 80% used)
- Baseline metrics stored in `docs/PERFORMANCE.md`
- GitHub Issues created for any regressions

**Duration:** 3–4 days (includes testing + documentation)

---

#### Task 1.4.12 `[SEC]` — Phase 1 Security Review (NEW)

**What to test:**
- **Authentication:** Verify `@require_auth` on all non-public endpoints (no auth required: `/api/auth/setup`, `/api/auth/setup/status`, `/api/users` (display names only))
- **Authorization:** Role checks; admin endpoints reject teen/child/guest users (test with 401/403)
- **Input validation:** SQL injection attempts on search/filter, XSS in user display names, path traversal in file endpoints
- **Secrets:** No API keys in code; all env vars in `.env.example` only; credentials encrypted at rest
- **CORS:** Origin whitelist correct; no `*` except in dev
- **Rate limiting:** PIN attempts (5 failures → 429), password login (no limit but log)
- **Data exposure:** Soft-deletes work (deleted users don't appear in lists); no leaked user data in API responses
- **Password strength:** No plaintext passwords in database; bcrypt hashes > 12 rounds

**Tools:**
- `bandit` (Python security linter): `bandit -r app/` (should be 0 critical issues)
- `npm audit` (JavaScript dependencies): check for vulnerabilities
- Manual testing: curl requests testing auth boundaries
- Code review: 2 reviewers sign-off on all auth/security code

**AC:**
- Bandit report: 0 critical issues
- npm audit: 0 critical vulnerabilities
- All OWASP Top 10 checks passed (doc checklist)
- Code review sign-off: 2 developers
- Security findings logged in GitHub Issues (if any)
- **No Phase 1 release without this passing**

**Duration:** 2–3 days

---

**Sprint 1.4 Duration:** 4 weeks (Days 27–42)  
**Sprint 1.4 Testing Summary:**
- 77 backend unit/integration tests
- 57 frontend component tests
- Performance baseline on Pi hardware (documented)
- Security audit (0 critical issues required)
- **Total: 134 tests, 80%+ backend coverage, 70%+ frontend coverage**

---

### Phase 1.T — Tech Debt & Documentation Sprint (Week 8, Days 43–47)

**Goal:** Clean up Phase 1 code, document decisions, prepare Phase 2 team

**Duration:** 5 days (half sprint)

---

#### Task 1.T.1 `[BE][FE]` — Code Cleanup & Refactoring

**What to do:**
- Fix any linter warnings (ruff, eslint)
- Extract magic numbers → constants
- Consolidate repeated code patterns
- Remove debug logs
- Update stale comments
- Fix any low-priority tech debt items discovered during Phase 1

**AC:**
- All linter warnings resolved (0 warnings on main branch)
- All TODO comments resolved or promoted to GitHub Issues
- Code coverage stable at 80%+ backend, 70%+ frontend

**Duration:** 2 days

---

#### Task 1.T.2 `[ARCH]` — Architecture Documentation (NEW)

**What to create:**
- `docs/ARCHITECTURE.md`: High-level system design, component overview, technology choices + rationale
- `docs/DATABASE_SCHEMA.md`: ER diagram, table descriptions, indexing strategy
- `docs/DEVELOPMENT.md`: Day 1 setup for new developers (expanded from README)
- `docs/CONTRIBUTING.md`: Code style guide, testing requirements, PR process
- `docs/CALENDAR_SYNC.md`: How Google Calendar sync works (for Phase 2 team building Microsoft/Apple)
- `docs/SECURITY.md`: Known limitations, threat model, what auth covers
- `docs/adr/001-caddy-reverse-proxy.md`: Why Caddy was chosen
- `docs/adr/002-async-sqlalchemy.md`: Why async SQLAlchemy from Phase 1
- `docs/adr/003-vitest-react-testing-library.md`: Why this testing stack

**AC:**
- All documentation files created + reviewed by tech lead
- README links to docs/
- New developer can on-board in < 1 hour using docs
- ADRs cover all major decisions from Phase 1

**Duration:** 2 days

---

#### Task 1.T.3 `[TOOLS]` — Performance Baseline & Metrics

**What to do:**
- Create `docs/PERFORMANCE.md`: Phase 1 baseline metrics
  - Dashboard load time: < 3s
  - API response times: < 500ms (p95)
  - Memory per container at idle
  - Startup time: < 2 minutes
- Add performance tests to CI: `npm test -- --coverage` includes bundle size check
- Document how to measure performance on Pi hardware (manual instructions)

**AC:**
- `docs/PERFORMANCE.md` created with Phase 1 baseline
- Bundle size tracked in CI (warn if > 10% larger)
- Documentation on how to benchmark on Pi

**Duration:** 1 day

---

**Phase 1.T Deliverables:**
- ✅ Clean, linted code (0 warnings)
- ✅ Comprehensive documentation (ARCHITECTURE, DEVELOPMENT, DATABASE, CALENDAR_SYNC, SECURITY, CONTRIBUTING)
- ✅ 5 ADRs documenting major decisions
- ✅ Performance baselines documented

---

### Phase 1.5 — Knowledge Transfer & Phase 2 Preparation (Week 7–8, overlap with 1.T)

**Goal:** Phase 2 team on-boards, Phase 1 retrospective, knowledge transfer

**Duration:** 1 week, parallel with 1.T

---

#### Task 1.5.1 `[TEAM]` — Phase 1 Retrospective & Lessons Learned

**What to do:**
- Team meeting (1–2 hours): What worked well in Phase 1? What could be better?
- Document findings: "Phase 1 Retrospective" (1-page markdown)
  - Testing: What testing patterns worked well? What was hard?
  - Architecture: Any regrets? Early warnings for Phase 2?
  - Velocity: Did 2-week sprints work? Adjust for Phase 2?
  - Tools: Any pain points with Docker, TypeScript, FastAPI?
- Share findings with Phase 2 team

**AC:**
- Retrospective document created
- All team members attended and contributed
- Key learnings applied to Phase 2 sprint planning

**Duration:** 3 hours (1 meeting + documentation)

---

#### Task 1.5.2 `[TEAM]` — Phase 2 Team Ramp-Up

**What to do (if Phase 2 team is different from Phase 1):**
- Phase 2 developers spend 2–3 days reading Phase 1 code
  - Read `docs/ARCHITECTURE.md` (1 hour)
  - Read `docs/DATABASE_SCHEMA.md` (1 hour)
  - Review Phase 1 code: `app/routers/auth.py`, `app/routers/calendar.py`, `app/routers/tasks.py` (2 hours)
  - Review Phase 1 test patterns: `tests/test_auth.py`, `tests/test_calendar.py` (1 hour)
  - Ask questions; tech lead answers
  
- Pair programming session (1 day):
  - Phase 1 dev + Phase 2 dev pair on simple task (e.g., add a new field to User model)
  - Phase 2 dev drives; Phase 1 dev guides

**AC:**
- Phase 2 developers can explain Phase 1 architecture without looking at docs
- Pair programming session completed
- Phase 2 developers comfortable with codebase

**Duration:** 2–3 days

---

**Phase 1.5 Deliverables:**
- ✅ Phase 1 Retrospective document
- ✅ Phase 2 team on-boarded
- ✅ Pair programming session completed

---

## Phase 1 Exit Criteria (Enhanced with Developer Readiness)

### User-Facing Criteria

- [ ] `docker compose up -d` on fresh Pi → app accessible at familyhub.local within 3 minutes
- [ ] Setup wizard completes successfully
- [ ] Family member can log in on iPhone/Android via PWA with PIN
- [ ] PWA install prompt appears and installs successfully on Android Chrome and iOS Safari
- [ ] Wall display loads at `/wall`, clock ticks, events and chores shown
- [ ] Idle slideshow activates after 5 minutes, touch exits it
- [ ] Completing a task on the phone updates the wall display within 5 seconds
- [ ] Google Calendar events appear in FamilyHub within 15 minutes
- [ ] Child-mode dashboard renders correctly with large touch targets

### Developer Readiness Criteria (NEW)

- [ ] Code review: all Phase 1 PRs approved by 2 developers
- [ ] Test coverage: 80%+ backend, 70%+ frontend (reported by CI)
- [ ] CI/CD: all tests pass; 0 skipped tests
- [ ] Documentation: README, DEVELOPMENT.md, ARCHITECTURE.md, DATABASE_SCHEMA.md all complete and reviewed
- [ ] Onboarding: a new developer can clone, set up, and deploy locally in < 2 hours
- [ ] Rollback: can revert the last 5 commits without data loss (tested)
- [ ] Code quality: 0 linter warnings (ruff, eslint)
- [ ] Clean code: 0 TODO comments; all high-complexity functions documented
- [ ] Dependency audit: `pip-audit` and `npm audit` pass; 0 critical vulnerabilities
- [ ] Architecture review: 1 independent architect reviews Phase 1 design (no blockers for Phase 2)

### Deployment Criteria (NEW)

- [ ] Production deployment procedure documented and tested (dry-run on Pi)
- [ ] Backup and restore tested (not just coded, actually tested)
- [ ] Database migration tested (upgrade + downgrade for all Alembic migrations)
- [ ] All secrets stored in .env, not in code (confirmed by grep)
- [ ] Monitoring: logging working; can see errors in production without SSH
- [ ] Performance baseline: dashboard < 3s, API < 500ms (p95), memory < 300MB total idle
- [ ] Security review: 0 critical findings; bandit passed; 2 reviewers sign-off

**AC: If any criterion fails, Phase 1 is not complete. Must be fixed before Phase 2 begins.**

---

## Phase 2 — Full Calendars + Lists + Family Board

**Duration:** Weeks 9–18 (5 sprints × ~2 weeks, or parallelized: 6 weeks)  
**Goal:** All three calendar providers syncing; custom lists are the primary household tool; Family Board fully configurable

**Key Enhancement:** Phase 2 sprints are parallelized into independent streams (see below)

---

### Phase 2 Sprint Structure (Parallelized)

Instead of linear sprints 2.1 → 2.2 → 2.3 → 2.4 → 2.5, Phase 2 runs parallel streams:

**Stream A: Calendar Providers & Conflict Resolution**
- Sprint 2.1: Microsoft + Apple Calendar APIs
- Sprint 2.4.1: Conflict detection + resolution
- Duration: Weeks 9–12 (4 weeks)

**Stream B: Lists & Chore Board**
- Sprint 2.2: Lists module (templates, instances)
- Sprint 2.3: Chore board + Kanban UI + Rewards system
- Duration: Weeks 9–12 (4 weeks)

**Stream C: Notifications & Wall Enhancements**
- Sprint 2.4: Weather + Announcements + Push notifications
- Sprint 2.3.2: Rewards system
- Duration: Weeks 10–14 (5 weeks)

**Stream D: Integration & E2E Testing**
- Sprint 2.5: iCal feeds + Phase 2 integration tests + e2e test suite
- Duration: Weeks 12–18 (overlaps with other streams)

**Team Allocation:**
- Backend Team 1 (2 devs): Streams A + C
- Frontend Team (2 devs): All streams (UI is critical path)
- DevOps: CI/CD, Docker builds

**Convergence:** Week 14 (all feature streams done); Week 18 (tested + on Pi)

---

### Stream A: Calendar Providers (Weeks 9–12)

#### Sprint 2.1 — Microsoft & Apple Calendar Integrations

**Task 2.1.1 `[BE]` — Microsoft Graph API integration**

**What to build:**
- `backend/app/integrations/microsoft_calendar.py`: OAuth, token refresh, list calendars, sync events (delta queries)
- `backend/app/routers/integrations.py`: GET /api/integrations/microsoft/auth-url, callback, delete

**Testing AC (NEW):**
- Unit tests: `tests/test_integrations_microsoft.py` (10+ tests)
- Coverage: 85%+
- Mock Microsoft Graph API responses

**AC:**
- Microsoft OAuth completes
- Events sync to calendar_events
- Delta sync fetches only changed events

---

**Task 2.1.2 `[BE]` — Apple CalDAV integration**

**What to build:**
- `backend/app/integrations/apple_calendar.py`: CalDAV client, discover calendars, sync events
- `backend/app/routers/integrations.py`: POST /connect, GET calendars, DELETE

**Testing AC (NEW):**
- Unit tests: `tests/test_integrations_apple.py` (8+ tests)
- Coverage: 80%+

**AC:**
- CalDAV connection works with app-specific password
- iCloud events sync correctly
- Rate limit errors trigger exponential backoff

---

**Task 2.1.3 `[FE]` — Calendar settings page**

**What to build:**
- `frontend/src/pages/admin/CalendarSettings.tsx`: list connected calendars, add providers, sync direction selector, sync log viewer

**Testing AC (NEW):**
- Component tests: `frontend/src/__tests__/pages/admin/CalendarSettings.test.tsx` (6+ tests)
- Coverage: 70%+

**AC:**
- All three providers have connect/disconnect flows
- Sync direction changeable per source
- Sync errors display with actionable messaging

---

#### Sprint 2.4.1 — Calendar Sync Conflict Detection & Resolution

**Task 2.4.1 `[DB]` — Sync conflicts table**

Alembic migration `004_sync_conflicts.py`

---

**Task 2.4.1.2 `[BE]` — Conflict detection & resolution API**

`backend/app/services/calendar.py` additions: detect when `external_last_modified > last_synced_at AND local_last_modified > last_synced_at`

**Testing AC (NEW):**
- Unit tests: `tests/test_calendar_conflicts.py` (6+ tests)
- Coverage: 80%+

**AC:**
- Conflicts detected and logged (not silently overwritten)
- Admin can resolve each conflict

---

**Task 2.4.1.3 `[FE]` — Conflict resolution UI**

Component to show conflicts and resolve options

**Testing AC (NEW):**
- Component tests: `frontend/src/__tests__/components/ConflictBadge.test.tsx` (3+ tests)

---

**Stream A Duration: 4 weeks (Weeks 9–12)**  
**Stream A Testing Summary:**
- 10 Microsoft Calendar tests
- 8 Apple Calendar tests
- 6 calendar settings UI tests
- 6 sync conflict tests
- 3 conflict badge tests
- **Total: 33 tests**

---

### Stream B: Lists & Chore Board (Weeks 9–12)

#### Sprint 2.2 — Custom Lists Module

**Task 2.2.1 `[DB]` — Lists schema migration**

Alembic migration `005_lists.py`: list_templates, list_template_items, list_instances, list_instance_items

---

**Task 2.2.2 `[BE]` — Lists API**

`backend/app/routers/lists.py`: template CRUD, instantiation, instance CRUD, item CRUD, reorder

**Testing AC (NEW):**
- Unit tests: `tests/test_lists.py` (14+ tests)
- Coverage: 85%+

**AC:**
- Template instantiation creates deep copy
- Item ordering persisted
- Completion tracked

---

**Task 2.2.3 `[FE]` — Lists UI**

`frontend/src/pages/Lists.tsx`: Active, Templates, Archive tabs; list instance page with shopping mode

**Testing AC (NEW):**
- Component tests: `frontend/src/__tests__/pages/Lists.test.tsx` (8+ tests)
- Coverage: 75%+

**AC:**
- Template instantiation works
- Checking items off works simultaneously on wall/phone
- Shopping mode groups by aisle
- Drag-to-reorder works on touch

---

#### Sprint 2.3 — Chore Board & Rewards System

**Task 2.3.1 `[FE]` — Kanban chore board**

`frontend/src/pages/ChoreBoard.tsx`: To Do / In Progress / Done / Verified columns, drag-drop, verify/reject

**Testing AC (NEW):**
- Component tests: `frontend/src/__tests__/pages/ChoreBoard.test.tsx` (6+ tests)
- Coverage: 70%+

**AC:**
- Drag-drop updates task status
- Photo evidence visible on completed tasks
- Verify/reject works directly from board

---

**Task 2.3.2 `[BE][FE]` — Point / reward system**

Migration `006_rewards.py`: reward_definitions, reward_redemptions

`backend/app/routers/rewards.py`: CRUD rewards, redemption requests, approval

`frontend/src/pages/Rewards.tsx`: point balance, reward list, redemption requests

**Testing AC (NEW):**
- Backend tests: `tests/test_rewards.py` (6+ tests)
- Frontend tests: `frontend/src/__tests__/pages/Rewards.test.tsx` (4+ tests)
- Coverage: 80%+ backend, 70%+ frontend

**AC:**
- Points accumulate automatically
- Child can request redemptions
- Admin approves/denies

---

**Stream B Duration: 4 weeks (Weeks 9–12)**  
**Stream B Testing Summary:**
- 14 lists API tests
- 8 lists UI tests
- 6 chore board tests
- 6 rewards backend tests
- 4 rewards UI tests
- **Total: 38 tests**

---

### Stream C: Notifications & Wall (Weeks 10–14)

[Similar structure: Database migrations, backend API, frontend UI, testing AC for each]

**Tasks:**
- 2.4.1: Weather widget (OpenMeteo API)
- 2.4.2: Family announcements board
- 2.4.3: Push notifications infrastructure (Web Push API, VAPID)
- 2.3.2 (continued): Rewards system (included above)

**Testing AC (NEW):**
- Weather: API client tests (4+ tests), widget tests (3+ tests)
- Announcements: API tests (6+ tests), component tests (4+ tests)
- Push: API tests (5+ tests), hook tests (3+ tests)
- **Total: 25+ tests**

---

### Stream D: Integration & E2E Testing (Weeks 12–18)

#### Sprint 2.5 — iCal Feeds, Phase 2 Integration Tests, E2E Test Suite

**Task 2.5.1 `[BE]` — iCal (.ics) feed subscriptions**

Alembic migration: icalendar library integration

`backend/app/integrations/ical_feed.py`: fetch and parse .ics URLs

`backend/app/routers/integrations.py`: POST /api/integrations/ical (URL validation)

**Testing AC (NEW):**
- Unit tests: `tests/test_ical_feeds.py` (5+ tests)
- Coverage: 75%+

**AC:**
- Paste iCal URL → events appear
- Invalid URLs show validation error
- iCal sources are read-only

---

**Task 2.5.2 `[TEST]` — Phase 2 Integration Test Suite**

**What to build:**
- Expand all test files from Streams A, B, C
- Cross-module integration: calendar + task + list all working together
- Database state management: fixtures that set up complex scenarios
- Ensure all new API endpoints tested (80%+ coverage)

**AC:**
- pytest: 80%+ backend coverage
- npm test: 70%+ frontend coverage
- All Phase 2 features have unit + integration tests
- CI passes with 0 skipped tests

**Duration:** 2 days

---

**Task 2.5.3 `[TEST]` — E2E Test Suite (Playwright) (NEW)**

**What to build:**
- `frontend/e2e/auth.spec.ts`: login flow across devices
- `frontend/e2e/calendar.spec.ts`: create event on desktop, verify on wall
- `frontend/e2e/lists.spec.ts`: instantiate list, check items off from phone and wall simultaneously
- `frontend/e2e/tasks.spec.ts`: create task, complete, verify from multiple devices
- `frontend/e2e/offline.spec.ts`: complete task offline, verify sync when back online

**Framework:** Playwright (cross-browser, headless, fast)

**AC:**
- 8+ e2e scenarios pass in CI
- All critical user flows covered
- Tests run in < 5 minutes
- No flaky tests (run 3x; all pass)

**Duration:** 3–4 days

---

**Task 2.5.4 `[TEST]` — Phase 2 Performance Validation (NEW)**

**What to test:**
- Same baselines from Phase 1 (must still pass)
- Multi-user load: 3 concurrent users
- Wall display with 50+ events: smooth
- Sync job CPU impact: < 80%

**AC:**
- Phase 1 benchmarks still met
- p95 API response time: < 500ms under 3-user load
- Memory increase < 30MB under load
- Sync job completes in < 5 minutes

**Duration:** 2 days

---

**Task 2.5.5 `[SEC]` — Phase 2 Security Review (NEW)**

**What to test:**
- All new API endpoints have proper auth checks
- Role checks on admin endpoints
- Input validation on new features (lists, rewards, announcements)
- New database fields encrypted (if credentials involved)

**Tools:** bandit, npm audit, manual testing

**AC:**
- Bandit: 0 critical issues
- npm audit: 0 critical vulnerabilities
- 2 reviewers sign-off on security
- No Phase 2 release without passing

**Duration:** 2 days

---

**Stream D Duration: 6 weeks (Weeks 12–18)**  
**Stream D Testing Summary:**
- 5 iCal tests
- 60+ Phase 2 integration tests (cumulative from A, B, C)
- 8+ e2e scenarios
- Performance validation
- Security review
- **Total: 73+ tests**

---

## Phase 2 Exit Criteria (Enhanced)

### User-Facing Criteria

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

### Developer Readiness Criteria

- [ ] All Phase 2 PRs approved by 2 developers
- [ ] Test coverage: 80%+ backend, 70%+ frontend
- [ ] CI/CD: all tests pass, 0 skipped tests
- [ ] Code quality: 0 linter warnings
- [ ] E2E test suite created and passing (8+ scenarios)
- [ ] Documentation: Phase 2 modules documented (LISTS_MODULE.md, CALENDAR_INTEGRATIONS.md)
- [ ] ADRs updated: 2 new decisions documented

### Performance Criteria

- [ ] Phase 1 baselines still met
- [ ] API response times: < 500ms (p95) under 3-user load
- [ ] Memory usage: < 400MB total idle (increase < 100MB from Phase 1)
- [ ] Sync job impact: CPU spike < 80%
- [ ] Wall display smooth with 50+ events

### Security Criteria

- [ ] Bandit: 0 critical issues
- [ ] npm audit: 0 critical vulnerabilities
- [ ] All new API endpoints have auth checks
- [ ] All new database fields properly encrypted (if secrets)
- [ ] 2 security reviewers sign-off

---

## Feedback Gate: Phase 2 → Phase 3 (Weeks 17–18)

**Duration:** 1 week

1. Phase 2 complete (exit criteria met)
2. Family uses app for 1 week
3. Collect feedback: usability, performance, surprises
4. 30-min debrief meeting with family
5. Decision:
   - Blocking bugs → Phase 2.5 (fix sprint) — delay Phase 3 by 1 week
   - Major UX issue → Phase 3 scope adjustment
   - Minor issues → Phase 3 backlog
   - No issues → Proceed to Phase 3

---

## Phase 2.T — Tech Debt & Documentation (Week 18, Days 87–91)

**Duration:** 5 days

Similar to Phase 1.T:
- Code cleanup, refactoring, linter fixes
- Documentation: CALENDAR_INTEGRATIONS.md, LISTS_MODULE.md, WALL_DISPLAY.md, REWARDS_SYSTEM.md
- 2–3 ADRs for major Phase 2 decisions
- Performance baselines updated

---

## Phase 2.5 — Knowledge Transfer & Phase 3 Prep (Weeks 17–18, overlap)

**Duration:** 1 week, parallel with Phase 2.T

- Phase 2 retrospective
- Phase 3 team on-boarding (if different)
- Pair programming session
- Identify Phase 3 blockers (should be none)

---

## Phases 3–5 (High-Level Structure)

Each phase follows the same pattern as Phase 1 & 2:

1. **Phase N.0:** Pre-phase design sprint (if major architecture decisions needed)
2. **Phase N.1 – N.4:** Feature sprints with integrated testing
   - Every sprint includes `[TEST]` task
   - Coverage targets: 80%+ backend, 70%+ frontend
3. **Phase N.T:** Tech debt sprint (5 days, documentation, cleanup)
4. **Phase N.5:** Overlap sprint (knowledge transfer, Phase N+1 prep)
5. **Feedback gate:** User testing + family feedback (1 week)

### Phase 3: Routines + Meal Planning + Enrichment (Weeks 19–30)

- Sprint 3.1: Routines module
- Sprint 3.2: Meal planning
- Sprint 3.3: Morning Briefing, Homework Tracker, Wiki
- Sprint 3.4: Allowance, Pet Care, Collaborative Notes
- Sprint 3.5: Guest Access & Caregiver Links
- Sprint 3.6: Performance profiling + Phase 3 integration tests + security review
- **Phase 3.T:** Tech debt sprint
- **Phase 3.5 overlap:** Phase 4 prep

**Testing per sprint:**
- Every feature gets unit tests (80%+ coverage)
- Integration tests combine modules (e.g., routines + tasks)
- E2E tests cover multi-device flows
- Performance validation at Phase 3.6
- Security review at Phase 3.6

---

### Phase 4: Intelligence + Admin Polish + Accessibility (Weeks 31–44)

- Sprint 4.1: Goals & Habit Tracker + Vehicle Maintenance
- Sprint 4.2: Full Admin Settings UI (all config from UI; no .env editing)
- Sprint 4.3: Advanced reporting (30/60/90-day stats)
- Sprint 4.4: PostgreSQL migration path (if decided in Phase 0) + offline write queue
- Sprint 4.5: Bulk operations
- Sprint 4.6: i18n + WCAG 2.1 AA accessibility audit
- Sprint 4.7: Performance optimization + API documentation (OpenAPI Swagger)
- **Phase 4.T:** Tech debt sprint
- **Phase 4.5 overlap:** Phase 5 prep

**Testing:** Same pattern as Phase 3
- 80%+ backend coverage per sprint
- 70%+ frontend coverage per sprint
- Performance regression tests (ensure Phase 1–3 baselines maintained)
- Accessibility testing: automated (axe-core) + manual WCAG checklist

---

### Phase 5: Ecosystem & Extensibility (Weeks 45–56)

- Sprint 5.1: Home Assistant integration
- Sprint 5.2: Alexa + Google Home
- Sprint 5.3: Multi-household support
- Sprint 5.4: Capacitor mobile app wrappers
- Sprint 5.5: Community template library
- Sprint 5.6: Backup restore UI, automated update flow, Phase 5 integration tests

**Testing:** Same pattern
- Final e2e test suite covering all ecosystems
- Performance audit across all features
- Security audit before launch
- Launch readiness checklist

---

## Cross-Phase Responsibilities (All Phases)

### Testing (Every Sprint)

- **Unit tests:** 80%+ backend coverage minimum
- **Integration tests:** Cross-module interactions tested
- **E2E tests:** Critical user flows tested (start Phase 2)
- **Performance tests:** Baselines tracked every phase
- **Security review:** Before each phase release
- **Accessibility:** Starting Phase 4 (WCAG 2.1 AA)

### Documentation (Phase N.T)

- `docs/[MODULE].md` for every new module
- ADRs for all major decisions
- README updated after each phase
- API docs auto-generated from OpenAPI

### Quality Gates (Every Phase Exit)

- [ ] 80%+ backend coverage, 70%+ frontend
- [ ] Bandit: 0 critical issues
- [ ] npm audit: 0 critical vulns
- [ ] CI/CD: 0 skipped tests
- [ ] Code review: 2 approvals per PR
- [ ] Performance baselines met
- [ ] Security review: 2 reviewers sign-off

---

## Development Environment Setup (Day 1 Checklist)

For any developer picking up this project:

1. Install: Docker Desktop, Node.js 20+, Python 3.12, Git
2. `git clone [repo]`
3. `cp .env.example .env` — fill in `SECRET_KEY`, `TIMEZONE`, `FAMILY_NAME`
4. `docker compose up -d` — starts the full stack
5. Navigate to `https://familyhub.local` — accept self-signed cert warning
6. Run setup wizard to create first admin account
7. **For backend development:** `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload`
8. **For frontend development:** `cd frontend && npm install && npm run dev`
9. **For testing:** `cd backend && pytest` and `cd frontend && npm test`
10. **API docs:** `http://localhost:8000/docs` (FastAPI Swagger UI, auto-generated)

---

## Timeline Summary (v2.0)

| Phase | Original | With Overlaps | With Parallelization |
|-------|----------|---------------|----------------------|
| Phase 0 | — | 1 week (planning) | 1 week |
| Phase 1 | 8 weeks | 10 weeks (+ 1.T + 1.5) | 10 weeks |
| Phase 2 | 10 weeks | 12 weeks (+ 2.T + 2.5) | 6 weeks (parallel) |
| Phase 3 | 12 weeks | 14 weeks (+ 3.T + 3.5) | 9 weeks (parallel) |
| Phase 4 | 14 weeks | 16 weeks (+ 4.T + 4.5) | 11 weeks (parallel) |
| Phase 5 | 12 weeks | 13 weeks (+ 5.T) | 9 weeks (parallel) |
| **Total** | **56 weeks** | **58 weeks** | **49 weeks (20% faster)** |

**With parallelization + overlap + tech debt sprints: 49 weeks (11.8 months) vs. 56 weeks (13.5 months)**

---

*Implementation Plan v2.0 — Enhanced with Phase Efficiency & Testing Integration*  
*Generated April 23, 2026 from v1.0 + Phase & Testing Strategy Review v1.0*  
*Ready for Phase 0 (pre-development planning)*
