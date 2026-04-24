# Phase 0 Automation Tasks (Agentic Execution Plan)

**Status:** Ready for Agent Execution  
**Decisions Finalized:** ✅ See PHASE_0_DECISIONS.md  
**Team:** 1 full-stack dev + 1 DevOps  
**Timeline:** 2–4 days starting immediately  

---

## Phase 0 Critical Path

```
Task 0.1: Infrastructure Decisions
    ✅ COMPLETE (PHASE_0_DECISIONS.md)
    
Task 0.2: OpenAPI Contract Design
    → NEXT: Agent creates openapi.json
    
Tasks 0.3, 0.4, 0.5 (PARALLEL):
    0.3: Lock Python + Node dependencies
    0.4: Frontend test framework setup
    0.5: CI/CD pipeline creation
    
All Complete → Phase 0 Sign-Off → Phase 1.1 Ready
```

---

## Task 0.2: OpenAPI Contract Design

**Status:** READY TO GENERATE  
**Deliverable:** `docs/openapi.json` (OpenAPI 3.1 spec)

**What to Generate:**

Create `docs/openapi.json` with all Phase 1 endpoints (33 total):

**Authentication (6 endpoints):**
```
POST /api/auth/setup
POST /api/auth/login
POST /api/auth/login/pin
POST /api/auth/logout
GET /api/auth/me
GET /api/auth/setup/status
```

**Users (5 endpoints):**
```
GET /api/users
POST /api/users
GET /api/users/{user_id}
PATCH /api/users/{user_id}
DELETE /api/users/{user_id}
POST /api/users/{user_id}/avatar
```

**Calendar (6 endpoints):**
```
GET /api/calendar/events
POST /api/calendar/events
GET /api/calendar/events/{event_id}
PATCH /api/calendar/events/{event_id}
DELETE /api/calendar/events/{event_id}
GET /api/calendar/sources
POST /api/calendar/sources
```

**Tasks (8 endpoints):**
```
GET /api/tasks
POST /api/tasks
GET /api/tasks/{task_id}
PATCH /api/tasks/{task_id}
DELETE /api/tasks/{task_id}
POST /api/tasks/{task_id}/complete
POST /api/tasks/{task_id}/verify
GET /api/tasks/{task_id}/completions
```

**Photos & Albums (8 endpoints):**
```
POST /api/photos/upload
GET /api/photos
PATCH /api/photos/{photo_id}
DELETE /api/photos/{photo_id}
POST /api/albums
GET /api/albums
PATCH /api/albums/{album_id}
POST /api/albums/{album_id}/photos
DELETE /api/albums/{album_id}/photos/{photo_id}
GET /api/albums/{album_id}/slideshow
```

**System (2 endpoints):**
```
GET /api/health
WS /api/ws/wall
```

**AC:**
- openapi.json valid OpenAPI 3.1 spec
- All 33 endpoints documented
- Request/response schemas for each endpoint
- Error codes: 400, 401, 403, 404, 500 defined
- No ambiguity on API shapes

---

## Task 0.3: Technology Stack & Dependencies Lock

**Status:** READY TO GENERATE  
**Deliverables:** 
- `backend/requirements.txt` (Python 3.12.4)
- `frontend/package.json` (Node 20.11.0 LTS)
- `frontend/package-lock.json` (locked)

**Backend Requirements.txt (Python 3.12.4):**

```
# Core Framework
fastapi==0.104.1
uvicorn[standard]==0.24.0

# Database & Async
sqlalchemy[asyncio]==2.0.23
aiosqlite==0.19.0
alembic==1.12.1

# Caching (IN-MEMORY ONLY)
cachetools==5.3.2

# Config & Settings
pydantic==2.4.2
pydantic-settings==2.0.3
python-dotenv==1.0.0

# Authentication & Security
PyJWT==2.8.1
passlib[bcrypt]==1.7.4
python-multipart==0.0.6

# Calendar Integration
google-auth==2.25.0
google-auth-oauthlib==1.1.0
google-auth-httplib2==0.2.0
google-api-python-client==2.100.0
msal==1.24.1
caldav==1.1.4
python-dateutil==2.8.2
icalendar==5.1.1

# Background Jobs (APScheduler IN-PROCESS)
APScheduler==3.10.4

# HTTP Client
httpx==0.25.1

# Image Processing
Pillow==10.0.1
pillow-heif==0.13.1

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
httpx[http2]==0.25.1

# Security & Linting
bandit==1.7.5
ruff==0.1.6
mypy==1.6.1

# Logging & Monitoring
python-json-logger==2.0.7
```

**Frontend package.json (Node 20.11.0 LTS):**

```json
{
  "name": "familyhub-frontend",
  "version": "1.0.0",
  "type": "module",
  "engines": {
    "node": ">=20.11.0",
    "npm": ">=10.2.4"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\""
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.25.0",
    "zustand": "^4.4.1",
    "axios": "^1.6.2",
    "tailwindcss": "^3.4.0",
    "@shadcn/ui": "latest",
    "vite-plugin-pwa": "^0.18.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "vitest": "^0.34.0",
    "@vitest/ui": "^0.34.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/user-event": "^14.5.1",
    "@testing-library/jest-dom": "^6.1.5",
    "msw": "^1.3.2",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "@typescript-eslint/parser": "^6.13.0",
    "prettier": "^3.1.0",
    "@vitest/coverage-v8": "^0.34.0"
  }
}
```

**AC:**
- `backend/requirements.txt` with all exact versions
- `frontend/package.json` with all exact versions
- `frontend/package-lock.json` locked
- All deps match PHASE_0_DECISIONS.md
- No room for version drift

---

## Task 0.4: Frontend Test Framework & Dependencies

**Status:** READY TO GENERATE  
**Deliverables:**
- `frontend/vitest.config.ts`
- `frontend/src/__tests__/setup.ts`
- `frontend/src/__tests__/mocks/server.ts`
- `frontend/src/__tests__/mocks/handlers/auth.ts`
- `frontend/src/__tests__/mocks/handlers/calendar.ts`
- `frontend/src/__tests__/mocks/handlers/tasks.ts`
- `frontend/src/__tests__/mocks/handlers/photos.ts`
- `frontend/src/__tests__/utils/test-utils.tsx`
- `frontend/src/__tests__/pages/Login.test.tsx` (example)
- `frontend/src/__tests__/components/TaskCard.test.tsx` (example)

**Key Files to Generate:**

1. **vitest.config.ts** — Test runner configuration
2. **MSW Server** — Mock Service Worker for API endpoints
3. **Test Utilities** — TanStack Query helpers (renderWithQuery)
4. **Example Tests** — Login page, TaskCard component

**AC:**
- `npm test` runs without errors
- Vitest + React Testing Library configured
- MSW handlers for all Phase 1 API endpoints
- Example tests demonstrate patterns
- Coverage targets: 70% lines/functions/branches

---

## Task 0.5: Development Environment Setup & CI/CD Pipeline

**Status:** READY TO GENERATE  
**Deliverables:**
- `.github/workflows/ci.yml` (8 jobs)
- `docs/DEVELOPMENT.md` (local setup guide)
- `.github/workflows/api-docs.yml` (optional, auto-generate OpenAPI docs)

**CI Pipeline (`.github/workflows/ci.yml`):**

Jobs (in order):
1. **lint-backend** (ruff, mypy) — 30 sec
2. **lint-frontend** (eslint, tsc) — 1 min
3. **test-backend** (pytest, coverage) — 2–3 min
4. **test-frontend** (vitest, coverage) — 2–3 min
5. **security-audit** (bandit, npm audit) — 30 sec
6. **docker-build-backend** (single-arch, no push yet) — 1–2 min
7. **docker-build-frontend** (single-arch, no push yet) — 1–2 min
8. **report** (coverage to codecov.io) — 30 sec

Trigger: On `push` to `main` or `pull_request`

**Development Guide (`docs/DEVELOPMENT.md`):**

Two setup paths:
- **Option A:** Full Docker (recommended for consistency)
- **Option B:** Local Python + Node (faster iteration)

Includes:
- Prerequisites (Docker Desktop, Python 3.12, Node 20, Git)
- Step-by-step setup for each option
- Testing commands
- CI check commands
- Deployment steps (for Phase 1 later)

**AC:**
- CI runs on every push to main
- All checks pass: lint → type-check → tests → security → docker
- Coverage reported to codecov.io
- Developers can spin up local stack in < 2 hours
- Clear documentation in DEVELOPMENT.md

---

## Phase 0 Execution Checklist

### Day 1 (Task 0.1 + 0.2)
- [ ] Task 0.1: ✅ COMPLETE (PHASE_0_DECISIONS.md)
- [ ] Task 0.2: Generate `docs/openapi.json`
  - [ ] All 33 endpoints documented
  - [ ] Request/response schemas
  - [ ] Error codes defined
  - [ ] Valid OpenAPI 3.1 spec

### Days 2–3 (Tasks 0.3, 0.4, 0.5 PARALLEL)

**Task 0.3:**
- [ ] Generate `backend/requirements.txt`
- [ ] Generate `frontend/package.json`
- [ ] Run `npm ci` to generate `package-lock.json`
- [ ] Commit all dep files

**Task 0.4:**
- [ ] Generate `frontend/vitest.config.ts`
- [ ] Generate `frontend/src/__tests__/setup.ts`
- [ ] Generate MSW server + handlers for all endpoints
- [ ] Generate TanStack Query test utilities
- [ ] Generate example tests (Login, TaskCard)
- [ ] Run `npm test` — 0 errors

**Task 0.5:**
- [ ] Generate `.github/workflows/ci.yml`
- [ ] Generate `docs/DEVELOPMENT.md`
- [ ] Test CI locally: `docker build backend/` and `docker build frontend/`
- [ ] Verify all CI checks pass on main

### Day 4 (Review & Sign-Off)
- [ ] Review `docs/openapi.json` (BE + FE sign-off)
- [ ] Run CI pipeline end-to-end
- [ ] Verify local dev setup works (< 2 hours)
- [ ] Create Phase 0 sign-off document
- [ ] Mark Phase 0 COMPLETE ✅

---

## Agent Execution Notes

**For Agentic Automation:**

1. **Generate files in this order:**
   - Task 0.2: openapi.json (depends on decisions)
   - Task 0.3: requirements.txt + package.json (independent)
   - Task 0.4: vitest setup (independent)
   - Task 0.5: CI/CD pipeline (independent)

2. **Parallelization:** Tasks 0.3, 0.4, 0.5 can be generated in parallel

3. **Validation:**
   - After 0.3: Run `npm ci` locally to validate package.json
   - After 0.5: Dry-run `docker build` to validate Dockerfile references
   - After all: Run CI workflow locally to ensure all checks pass

4. **Commit Strategy:**
   - Commit by task (0.2, 0.3, 0.4, 0.5) as generated
   - Or: Commit all Phase 0 files in one commit at the end
   - Push to GitHub after each commit or at the end

5. **Error Handling:**
   - If openapi.json validation fails: Fix schema, regenerate
   - If npm ci fails: Check package.json syntax, regenerate
   - If CI fails: Fix workflow YAML, regenerate

6. **Sign-Off:**
   - Create `PHASE_0_SIGNOFF.md` with checklist + team approvals
   - Mark Phase 0 COMPLETE when all items checked
   - Phase 1.1 can start immediately after

---

*Phase 0 Automation Tasks v1.0*  
*Ready for Agent Execution*  
*Start: Immediately*  
*Duration: 2–4 days*
