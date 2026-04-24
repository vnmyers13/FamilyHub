# Phase 0 Infrastructure Decisions (FINALIZED)

**Date:** April 24, 2026  
**Status:** ✅ FINALIZED - Ready for Implementation  
**Team:** 1 full-stack developer + 1 DevOps  
**Start Date:** Week of April 24, 2026  

---

## Critical Infrastructure Decisions (FIRM COMMITMENTS)

### 1. Database Strategy ✅
**Decision:** SQLite Only (all 56 weeks)  
**Rationale:** Simpler, zero setup, adequate for household scale (8 users, 50K photos max)  
**Implementation:**
- Backend: async SQLAlchemy + aiosqlite (defensive, future-proofs code)
- No PostgreSQL migration in Phase 4
- Database file: `./data/db/familyhub.db` (bind-mounted)
- Backup strategy: daily snapshots to `./data/backups/` (already in plan)

**Impact:**
- Phase 1–5: Use SQLite throughout
- Phase 4: No database migration sprint needed
- Simplifies deployment, backup, recovery

---

### 2. Caching Strategy ✅
**Decision:** In-Memory Only (Cachetools library)  
**Rationale:** Fast, zero deployment, adequate for single-instance household app  
**Implementation:**
- Library: `cachetools` (TTL cache)
- Cache targets:
  - User lookups (5 min TTL)
  - Calendar event queries (1 min TTL)
  - Task filters (1 min TTL)
  - Weather API responses (30 min TTL)
- No Redis service
- Cache lost on API restart (acceptable, minimal impact)

**Impact:**
- No redis service in docker-compose.yml
- Simple in-memory caching in Phase 1, adequate through Phase 5
- If scaling becomes needed (Phase 5 multi-household): migrate to Redis (1–2 day effort)

---

### 3. Background Job Queue ✅
**Decision:** APScheduler In-Process (no external service)  
**Rationale:** No external service needed, calendar sync + backup jobs adequate for household  
**Implementation:**
- Library: `APScheduler` (already in requirements.txt)
- Jobs scheduled in Phase 1:
  - `sync_all_calendars()` — every 15 min (Google/Microsoft/Apple)
  - `check_overdue_tasks()` — every hour
  - `backup_database()` — daily at 3:00 AM
- Max job timeout: 30 seconds (prevent API blocking)
- Error logging: job failures logged, don't crash scheduler

**Impact:**
- No RabbitMQ or Celery needed
- If Phase 3 scaling needed: migrate to Celery (3–5 day effort)
- Jobs run in same process as API (trade-off: simplicity vs isolation)

---

### 4. Full-Text Search ✅
**Decision:** SQLite FTS5 (built-in)  
**Rationale:** Adequate for household wiki (< 100 pages expected)  
**Implementation:**
- Feature: Phase 3.3 (Family Wiki)
- Mechanism: SQLite FTS5 virtual tables
- Searchable content: wiki page titles + body text
- Query syntax: simple keyword matching (adequate)

**Impact:**
- No Elasticsearch service
- If Phase 5 community features added: migrate to Elasticsearch (2–3 day effort)
- Simple, no operational overhead

---

## Derived Technical Stack

### Backend (Python 3.12.4)
```
Core:
  fastapi==0.104.1
  uvicorn==0.24.0
  sqlalchemy==2.0.23 (async, SQLite compatible)
  aiosqlite==0.19.0 (async SQLite driver)
  alembic==1.12.1 (migrations)

Database & Caching:
  sqlalchemy[asyncio]
  cachetools==5.3.2 (in-memory cache)

Authentication:
  PyJWT==2.8.1
  passlib[bcrypt]==1.7.4

Calendar Integration:
  google-auth-oauthlib==1.1.0
  msal==1.24.1
  caldav==1.1.4
  python-dateutil==2.8.2
  icalendar==5.1.1

Jobs & Background:
  APScheduler==3.10.4 (in-process)

Image Processing:
  Pillow==10.0.1
  pillow-heif==0.13.1

Testing:
  pytest==7.4.3
  pytest-asyncio==0.21.1
  httpx==0.25.1 (async HTTP client)

Security & Linting:
  bandit==1.7.5
  ruff==0.1.6
  mypy==1.6.1
```

### Frontend (Node 20.11.0 LTS)
```
Core:
  react@18.2.0
  react-dom@18.2.0
  react-router-dom@6.20.0
  vite@5.0.0

State & Data:
  zustand@4.4.1
  @tanstack/react-query@5.25.0
  axios@1.6.2

UI:
  tailwindcss@3.4.0
  @shadcn/ui (latest)

PWA:
  vite-plugin-pwa@0.18.0

Testing:
  vitest@0.34.0
  @testing-library/react@14.1.0
  msw@1.3.2 (mock service worker)

E2E (Phase 2):
  playwright@1.40.0

Linting:
  typescript@5.3.0
  eslint@8.55.0
  prettier@3.1.0
```

---

## Phase 0 Execution Plan

**Timeline:** 2–4 days (accelerated for small team)

### Day 1 (Task 0.1 + 0.2)
- Task 0.1: Finalize infrastructure decisions → **DONE** (this document)
- Task 0.2: Create openapi.json spec (BE + FE collaborate)
  - List all 33 Phase 1 endpoints
  - Define request/response schemas
  - BE lead drafts, FE lead reviews, iterate

### Days 2–3 (Tasks 0.3, 0.4, 0.5 in parallel)
- Task 0.3: Lock Python + Node dependencies
  - Create requirements.txt (Python)
  - Lock frontend/package.json (Node)
  - Commit to repo
  
- Task 0.4: Set up frontend test framework
  - vitest.config.ts
  - MSW (mock service worker) setup
  - Example tests
  
- Task 0.5: Create CI/CD pipeline
  - .github/workflows/ci.yml
  - docs/DEVELOPMENT.md
  - Local setup + Docker setup

### Day 4 (Review & Approval)
- Review openapi.json (BE + FE sign-off)
- Run CI pipeline locally (ensure all checks pass)
- Verify local development setup (can any dev spin up in < 2 hours?)
- Create Phase 0 sign-off document

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **SQLite performance degradation with 50K photos** | Benchmark in Phase 1 exit; migrate to PostgreSQL if needed (but unlikely for household) |
| **APScheduler job blocking API** | Set 30-second timeout, log hangs, monitor in Phase 1 |
| **In-memory cache loss on restart** | Cache is best-effort; data always queryable from database |
| **SQLite FTS5 limited query syntax** | Sufficient for household wiki; migrate to Elasticsearch if Phase 5 community feature needed |

---

## Phase 0 Deliverables Checklist

- [ ] Task 0.1: Infrastructure decisions documented + signed off ✅
- [ ] Task 0.2: openapi.json created, BE + FE approve
- [ ] Task 0.3: requirements.txt locked, package-lock.json committed
- [ ] Task 0.4: vitest.config.ts, MSW handlers, example tests ready
- [ ] Task 0.5: .github/workflows/ci.yml complete, docs/DEVELOPMENT.md ready
- [ ] All CI checks passing on main branch
- [ ] Any developer can spin up full stack locally in < 2 hours
- [ ] Phase 0 sign-off: team confirms all decisions, ready for Phase 1.1

---

*Phase 0 Decisions Document v1.0*  
*Generated April 24, 2026*  
*Ready for Phase 0 Execution*
