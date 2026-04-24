# Phase 1.1 — Project Scaffold & Infrastructure

**Duration:** Weeks 1–2 (10 business days)  
**Goal:** Empty repo → running Docker stack accessible at `familyhub.local`  
**Status:** Ready for Development  
**Start Date:** 2026-04-24

---

## Task Breakdown & Execution Order

### Task 1.1.1 `[INFRA]` *BLOCKER* — Docker Compose Stack

**What to build:**
- `docker-compose.yml` with 3 services:
  - `api`: FastAPI on port 8000
  - `web`: Vite dev server on port 5173 (dev) / Nginx on port 3000 (prod)
  - `caddy`: Reverse proxy on ports 80/443
- `config/Caddyfile` routing rules
  - `familyhub.local` → TLS with internal certificate
  - `/api/*` → `api:8000`
  - `/*` → `web:3000`
- `.env` from `.env.example`
- Bind mounts for `./data/db`, `./data/photos`, `./data/backups`, `./config`
- All services: `restart: unless-stopped`

**Acceptance Criteria:**
- [ ] `docker compose up -d` on clean machine starts all 3 containers without errors
- [ ] `https://familyhub.local` returns 200 (Caddy reverse proxy working)
- [ ] `https://familyhub.local/api/health` returns JSON (API reachable)
- [ ] Containers survive `docker compose restart` with no data loss
- [ ] `docker compose logs` shows no errors from any service

**Dependencies:** None (foundational)  
**Duration:** 1 day  
**Owner:** DevOps / Full-stack dev

**Files to Create/Modify:**
- `docker-compose.yml` (new)
- `config/Caddyfile` (new)
- `backend/Dockerfile` (new)
- `frontend/Dockerfile` (new)
- Ensure `.env` exists from `.env.example`

---

### Task 1.1.2 `[INFRA]` — GitHub Actions CI Pipeline

**What to build:**
- `.github/workflows/ci.yml` (already created in Phase 0, verify it works)
- Ensure it triggers on push/PR
- Backend checks: mypy, pytest, coverage
- Frontend checks: tsc, npm test, coverage
- Linting: ruff, eslint

**Acceptance Criteria:**
- [ ] Push to main triggers CI within 2 minutes
- [ ] All checks pass with 0 errors
- [ ] Coverage reports generated and stored as artifacts
- [ ] CI passes for both backend and frontend

**Dependencies:** Task 1.1.3, 1.1.4 (code must exist)  
**Duration:** 0.5 days (already exists from Phase 0)  
**Owner:** DevOps / CI-CD specialist

**Note:** The workflow already exists from Phase 0. Verify it's working correctly.

---

### Task 1.1.3 `[BE]` *BLOCKER* — FastAPI Application Skeleton

**What to build:**
- `backend/app/main.py`: FastAPI app instance
  - CORS middleware
  - Exception handlers (404, 500, validation errors)
  - Lifespan hooks (startup, shutdown)
  - Include routers (health, auth, users, calendar, tasks, photos)
- `backend/app/core/config.py`: Pydantic Settings for environment variables
- `backend/app/core/database.py`: Async SQLAlchemy engine + aiosqlite
  - `async def get_db()` dependency
  - Alembic integration
- `backend/app/core/security.py`: JWT, password hashing
  - `hash_password()`, `verify_password()`
  - `create_jwt_token()`, `decode_jwt_token()`
  - `get_current_user` dependency
- `backend/app/routers/health.py`: `GET /api/health` endpoint
  - Returns: `{"status": "ok", "version": "1", "timestamp": "..."}`
- Alembic initialized: `alembic init alembic` (if not done)
- `backend/alembic/env.py` configured for async SQLAlchemy

**Acceptance Criteria:**
- [ ] `GET /api/health` returns 200 with JSON body
- [ ] FastAPI docs available at `GET /docs`
- [ ] `mypy app/` passes with 0 errors (strict mode)
- [ ] No startup errors in container logs
- [ ] Database connection successful on startup
- [ ] Environment variables loaded from `.env`

**Dependencies:** Task 1.1.1 (Docker setup)  
**Duration:** 1.5 days  
**Owner:** Backend developer

**Deliverables:**
- FastAPI app skeleton with health check
- Async database configuration
- JWT/password utilities
- Alembic ready for migrations

---

### Task 1.1.4 `[FE]` *BLOCKER* — React/Vite/TypeScript Skeleton + Test Setup

**What to build:**
- React app initialized with Vite (TypeScript template)
- Install dependencies: `react-router-dom`, `@tanstack/react-query`, `tailwindcss`, `zustand`, `axios`
- Tailwind CSS configured with custom theme
- PWA setup: `vite-plugin-pwa`
  - `manifest.json` with app metadata
  - Placeholder icons (192x192, 512x512)
  - Service worker auto-generated
- React Router setup with placeholder routes:
  - `/` → Dashboard (placeholder)
  - `/login` → Login (placeholder)
  - `/setup` → Setup wizard (placeholder)
- TanStack Query provider in App.tsx
- Zustand auth store (`src/stores/authStore.ts`)
  - `useAuthStore()` with login/logout actions
- `src/api/client.ts`: Axios instance
  - Base URL from env: `VITE_API_URL`
  - JWT token in headers (from authStore)
  - Error handling
- **Test Framework (from Phase 0):**
  - Vitest configured (`vitest.config.ts`)
  - React Testing Library installed
  - MSW handlers ready
  - Example tests created
  - `vitest.config.ts` configured for jsdom
- `frontend/Dockerfile`: Multi-stage build
  - Build stage: `npm install && npm run build`
  - Runtime stage: Nginx serving `dist/`

**Acceptance Criteria:**
- [ ] `npm run dev` starts Vite dev server without errors
- [ ] `npm run build` produces `dist/` folder
- [ ] `npm test` runs without errors
- [ ] `npm run type-check` passes (TypeScript strict mode)
- [ ] `https://familyhub.local` shows React app (via Docker)
- [ ] Chrome DevTools → Application → Manifest shows PWA manifest
- [ ] Service Worker registered in browser console
- [ ] ESLint passes: `npm run lint`

**Dependencies:** Task 1.1.1 (Docker setup)  
**Duration:** 1.5 days  
**Owner:** Frontend developer

**Deliverables:**
- Vite + React + TypeScript skeleton
- PWA manifest and icons
- Tailwind CSS configured
- Zustand auth store
- Axios client
- Test framework ready (from Phase 0)
- Multi-stage Dockerfile

---

### Task 1.1.5 `[DB]` *BLOCKER* — Initial Database Schema Migration

**What to build:**
- Alembic migration `001_initial_schema.py` creating:
  ```sql
  CREATE TABLE families (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    settings_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL REFERENCES families(id),
    display_name TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'member',  -- admin, member, viewer
    avatar_url TEXT,
    color TEXT,
    ui_mode TEXT DEFAULT 'light',
    pin_hash TEXT,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
  );
  
  CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    token_hash TEXT NOT NULL,
    device_hint TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```
- SQLAlchemy ORM models:
  - `backend/app/models/__init__.py`
  - `backend/app/models/auth.py`: `Family`, `User`, `Session` models
  - All using SQLAlchemy 2.0 async syntax
  - UUID primary keys (TEXT in SQLite)
  - UTC timestamps

**Acceptance Criteria:**
- [ ] `alembic upgrade head` runs cleanly against empty database
- [ ] All tables created successfully
- [ ] Foreign key relationships enforced
- [ ] `alembic downgrade -1` rolls back completely
- [ ] Rollback tested: pre/post state identical
- [ ] Tables queryable via SQLite CLI
- [ ] Migration test: `tests/test_migrations.py` passes
- [ ] No SQLAlchemy errors on model load

**Dependencies:** Task 1.1.3 (FastAPI/Alembic setup)  
**Duration:** 1 day  
**Owner:** Backend developer

**Deliverables:**
- `backend/alembic/versions/001_initial_schema.py`
- `backend/app/models/auth.py`
- SQLAlchemy models with async compatibility

---

### Task 1.1.6 `[TEST]` — Backend Test Framework & Health Check Tests

**What to build:**
- `backend/tests/__init__.py`
- `backend/tests/conftest.py`:
  - `async_client` fixture (async test client)
  - `db` fixture (in-memory SQLite database)
  - Fresh schema per test session
  - Helper functions for setup
- `backend/tests/test_health.py`:
  - Test: GET /api/health returns 200
  - Test: Response includes `status`, `version`, `timestamp`
  - Test: Database connection status included
- `backend/tests/test_migrations.py`:
  - Test: Migration 001 upgrades cleanly
  - Test: Migration 001 downgrades cleanly
- Test dependencies in `requirements.txt`:
  - pytest, pytest-asyncio, httpx
- GitHub Actions: ensure `pytest` step runs and reports coverage

**Acceptance Criteria:**
- [ ] `pytest tests/test_health.py -v` passes (2+ tests)
- [ ] `pytest tests/test_migrations.py -v` passes (2+ tests)
- [ ] `pytest --cov=app --cov-report=html` generates coverage
- [ ] All tests pass on CI (GitHub Actions)
- [ ] Coverage report available in artifacts
- [ ] Test database isolation: each test gets fresh schema

**Dependencies:** Task 1.1.3, 1.1.5 (API and database)  
**Duration:** 1 day  
**Owner:** Backend developer / QA

**Deliverables:**
- `backend/tests/conftest.py` with fixtures
- `backend/tests/test_health.py`
- `backend/tests/test_migrations.py`
- Coverage reporting enabled

---

## Implementation Sequence

**Day 1:** Task 1.1.1 (Docker Compose)  
**Day 2:** Task 1.1.3 (FastAPI), Task 1.1.4 (Frontend) — **parallel**  
**Day 3:** Task 1.1.5 (Database)  
**Day 4:** Task 1.1.6 (Backend tests)  
**Day 5:** Task 1.1.2 (CI verification) + Integration testing  
**Days 6–10:** Buffer for fixes, documentation, phase exit review

---

## Phase 1.1 Exit Checklist

**Infrastructure:**
- [ ] `docker-compose.yml` functional
- [ ] Caddy routing verified
- [ ] All containers start cleanly
- [ ] Bind mounts working

**Backend:**
- [ ] FastAPI server running
- [ ] `/api/health` returns 200
- [ ] Database migrations running
- [ ] Auth tables exist
- [ ] Type checking passes
- [ ] Tests pass

**Frontend:**
- [ ] React app runs on `npm run dev`
- [ ] Vite build succeeds
- [ ] Tailwind CSS working
- [ ] PWA manifest present
- [ ] Test framework ready
- [ ] Type checking passes
- [ ] ESLint passes

**CI/CD:**
- [ ] GitHub Actions triggered on push
- [ ] All 8 CI jobs pass
- [ ] Coverage reports generated

**Documentation:**
- [ ] README.md updated with quick-start
- [ ] Contributing.md guides next phase
- [ ] API docs available at /docs

---

## Known Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Caddy TLS config complex | Use `tls internal` for local dev; document in DEVELOPMENT.md |
| SQLite async quirks | Aiosqlite + SQLAlchemy async-specific code reviewed by lead |
| PWA icons missing | Generate placeholder SVGs; add real icons in Phase 2 |
| Test isolation issues | Use transaction-based rollback in fixtures |
| Docker build slow | Layer caching; parallel builds where possible |

---

## Success Metrics

| Metric | Target | Verification |
|--------|--------|--------------|
| Docker startup time | <30 seconds | `docker-compose up -d && time curl https://familyhub.local` |
| Test suite duration | <10 seconds | `pytest --tb=short --durations=3` |
| Frontend build time | <10 seconds | `npm run build && ls -la dist/` |
| CI completion time | <5 minutes | GitHub Actions log |
| Type check pass rate | 100% | `mypy app/ && tsc --noEmit` |

---

## Next Phase (Sprint 1.2)

Once Phase 1.1 exits:
- Sprint 1.2 begins: **Authentication & First-Run Setup**
- Tasks: Auth API, user management, setup wizard, login UI
- Parallel: Can start design of Phase 2 features
- Phase 1.1.5 overlap begins: knowledge transfer to next team (if applicable)

---

**Ready to execute Phase 1.1. Begin with Task 1.1.1.**
