# Phase 0 Detailed Review & Recommendations

**Date:** April 23, 2026  
**Scope:** Pre-development planning tasks before Phase 1 Sprint 1.1  
**Duration:** 1 week (5 working days)  
**Goal:** Team alignment on architecture, API contracts, and technology decisions

---

## Phase 0 Overview

Phase 0 contains 5 tasks spanning infrastructure decisions, API design, and dependency locking. Current tasks:

1. **Task 0.1:** Infrastructure & Database Decisions
2. **Task 0.2:** OpenAPI Contract Design
3. **Task 0.3:** Technology Stack & Dependencies Lock
4. **Task 0.4:** Frontend Test Framework & Dependencies
5. **Task 0.5:** Development Environment Setup & CI/CD Pipeline

---

## Task-by-Task Analysis

### Task 0.1: Infrastructure & Database Decisions

**Current State:**
```
Duration: 2–4 hours
Participants: Tech lead (1 hour), team meeting (1 hour), documentation (1 hour)
```

**What's Decided:**
- Database: SQLite for all 56 weeks, or PostgreSQL in Phase 4?
- Caching layer: In-memory or Redis?
- Job queue: APScheduler only, or RabbitMQ/Celery later?
- Search: SQLite full-text search or Elasticsearch?
- External services: Cloud dependencies allowed?

**Issues & Recommendations:**

✅ **Good:** Decisions are architectural — impact the entire project

⚠️ **Issue 1: Timing of PostgreSQL Decision**
- Current recommendation: "Decide now for async SQLAlchemy compatibility"
- Problem: Building async SQLAlchemy from day 1 has overhead if you never migrate
- Recommendation: **Make a firm decision NOW**
  - If "yes, PostgreSQL in Phase 4" → commit to async SQLAlchemy from Phase 1 (no extra cost)
  - If "no, SQLite only" → simplify Phase 1 (remove async overhead, use simpler ORM patterns)
  - **Do not** say "we'll decide in Phase 4"

**Suggested Enhancement:**

```markdown
Task 0.1 [DECISION] — Infrastructure & Database Strategy

**Decision Framework:**

1. **Database Scale Estimation**
   - Expected family size: 4–8 people
   - Expected data volume by Phase 5:
     - Users: 8
     - Events (7 years of calendars): ~2,000
     - Tasks (7 years): ~10,000
     - Photos (7 years): ~50,000 (thumbnails cached)
     - Database file size estimate: 100–500 MB
   - SQLite adequate? YES for household scale (SQLite handles 100MB+ easily)
   - Multi-household support (Phase 5)? Single server, no sharding needed

2. **Database Decision (Pick ONE)**
   
   **Option A: SQLite Only (all 56 weeks)**
   - Pros: zero setup, simpler code, no migrations
   - Cons: no concurrent write scaling (not needed for household)
   - Recommendation: **PICK THIS unless you anticipate Phase 5 multi-household with shared database**
   - Implementation: Use async SQLAlchemy anyway (no cost, defensive)

   **Option B: SQLite (Phase 1–3) → PostgreSQL (Phase 4+)**
   - Pros: flexibility for future (multi-household, concurrent writes)
   - Cons: Phase 4 migration effort (estimated 3–5 days with preparation)
   - Recommendation: **PICK THIS if you want to support enterprise features in Phase 5**
   - Implementation: Use async SQLAlchemy + connection pooling from Phase 1

   **Decision: [CHOOSE ONE] A or B**

3. **Caching Layer Decision (Pick ONE)**
   
   **Option A: In-Memory (Python dict with TTL) — Phase 1–5**
   - Pros: Zero deployment complexity, fast for single-instance app
   - Cons: Cache lost on API restart; not shared across instances (future concern)
   - Recommended for: Single-instance deployment (typical household)
   - Implementation: Cachetools library (lightweight, simple)
   
   **Option B: Redis — Phase 3+**
   - Pros: persistent cache, shared across future instances, scalable
   - Cons: Docker service addition, operational complexity
   - Recommended for: Phase 5 multi-household or if caching becomes critical
   - Implementation: Defer to Phase 3 or 4 if needed

   **Decision: [CHOOSE ONE] A (recommended for household) or B**

4. **Background Job Queue Decision (Pick ONE)**
   
   **Option A: APScheduler In-Process (Phase 1–5)**
   - Pros: No external service; calendar sync + backup jobs fine in same process
   - Cons: Jobs block API if long-running; no job persistence (lost if API crashes)
   - Recommended for: Single-instance household app
   - Risk: If sync job hangs, API becomes unresponsive
   - Mitigation: Timeout jobs (30s max), log hangs, page on-call
   
   **Option B: Celery + RabbitMQ (Phase 3+)**
   - Pros: Job queue, persistence, worker isolation
   - Cons: Extra Docker service, operational complexity
   - Recommended for: Phase 5 if you anticipate heavy async work
   - Implementation: Defer decision to Phase 3; migrate if needed

   **Decision: [CHOOSE ONE] A (recommended) or B**

5. **Full-Text Search Decision (Pick ONE)**
   
   **Option A: SQLite FTS5 (Phase 3 Wiki feature)**
   - Pros: Built-in, no extra service, good enough for 1000 pages
   - Cons: Limited query syntax, not ideal for large corpus
   - Recommended for: Household wiki (< 100 pages expected)
   
   **Option B: Elasticsearch (Phase 5)**
   - Pros: Advanced search, faceting, analytics
   - Cons: Extra service, operational overhead, overkill for household
   - Recommended for: Phase 5 multi-household or large communities

   **Decision: [CHOOSE ONE] A (recommended) or B (if Phase 5 community feature is priority)**

6. **Cloud Dependencies Decision**
   
   **Google Calendar:** Required (Phase 1)
   **Microsoft/Apple:** Required (Phase 2)
   **Home Assistant:** Optional (Phase 5)
   **AWS/GCP/Azure:** Avoid if possible (zero-cloud goal)
   **SendGrid/Twilio:** Not planned (keep zero-cloud)
   
   **Decision: Zero-cloud only. External OAuth for calendars is acceptable (read-only from user's perspective).**

**Deliverable:**
- Written decision document (1 page per question, 6 decisions total)
- Tech lead sign-off
- Team understanding: no surprises in Phase 1

**Duration:** 2–4 hours (meeting 1h, documentation 1h, review 30min)
```

---

### Task 0.2: OpenAPI Contract Design

**Current State:**
```
Duration: 2–3 days
Participants: 1 BE lead, 1 FE lead, 1 architect (optional)
Deliverable: openapi.json with all Phase 1 endpoints
```

**Issues & Recommendations:**

✅ **Good:** Forces BE/FE alignment upfront

⚠️ **Issue 1: Who Writes the Spec?**
- Current: "BE lead writes, FE lead reviews"
- Problem: BE might design endpoints that are hard to consume on FE
- Recommendation: **Collaborative design, not waterfall**
  - BE lead drafts based on features
  - FE lead reviews + suggests changes
  - Iterate until both sign off

✅ **Issue 2: Spec Verification**
- Need to confirm spec is actually followed during implementation
- Recommendation: **Add task to CI:** Validate that actual endpoints match openapi.json
  - Tool: `openapi-spec-validator` (Python) or similar
  - CI check: Warns if implemented API drifts from spec

**Suggested Enhancement:**

```markdown
Task 0.2 [BE][FE] *BLOCKER* — OpenAPI Contract Design

**What to build:**

**Phase 1 Endpoints to Document:**

Authentication:
- POST /api/auth/setup {family_name, timezone, admin_name, password} → {session_token}
- POST /api/auth/login {user_id_or_name, password} → {user, token}
- POST /api/auth/login/pin {user_id, pin} → {user, token}
- POST /api/auth/logout → 200
- GET /api/auth/me → {user} or 401
- GET /api/auth/setup/status → {setup_complete: bool}

Users:
- GET /api/users → [{user}, ...] (authenticated)
- POST /api/users {display_name, role, color, pin?, password?} → {user} (admin only)
- GET /api/users/{user_id} → {user}
- PATCH /api/users/{user_id} {fields} → {user}
- DELETE /api/users/{user_id} → 204
- POST /api/users/{user_id}/avatar (multipart) → {avatar_url}

Calendar:
- GET /api/calendar/events {start, end, assignee_id?, source_id?} → [{event}, ...]
- POST /api/calendar/events {title, start, end, ...} → {event}
- GET /api/calendar/events/{event_id} → {event}
- PATCH /api/calendar/events/{event_id} {fields} → {event}
- DELETE /api/calendar/events/{event_id} → 204
- GET /api/calendar/sources → [{source}, ...]
- POST /api/calendar/sources {provider, display_name, color, sync_direction} → {source}

Tasks:
- GET /api/tasks {assignee_id?, status?, due_before?, due_after?, area_tag?} → [{task}, ...]
- POST /api/tasks {title, description, assignee_id?, due_date?, ...} → {task}
- GET /api/tasks/{task_id} → {task, completions: [...]}
- PATCH /api/tasks/{task_id} {fields} → {task}
- DELETE /api/tasks/{task_id} → 204
- POST /api/tasks/{task_id}/complete {notes?, photo?} (multipart) → {completion}
- POST /api/tasks/{task_id}/verify {status, rejection_reason?} → {task}
- GET /api/tasks/{task_id}/completions → [{completion}, ...]

Photos:
- POST /api/photos/upload (multipart) → {photo}
- GET /api/photos {album_id?, tagged_user?, date_range?, offset, limit} → {photos: [...], total}
- PATCH /api/photos/{photo_id} {caption, tags, ...} → {photo}
- DELETE /api/photos/{photo_id} → 204
- POST /api/albums {name, slideshow_eligible, slideshow_transition, ...} → {album}
- GET /api/albums → [{album}, ...]
- PATCH /api/albums/{album_id} {fields} → {album}
- POST /api/albums/{album_id}/photos {photo_ids: [...]} → {album}
- DELETE /api/albums/{album_id}/photos/{photo_id} → 204
- GET /api/albums/{album_id}/slideshow → {photos: [...], settings: {...}}

Health:
- GET /api/health → {status: "ok", version, uptime}

WebSocket:
- WS /api/ws/wall → Event stream (task_updated, event_updated, etc.)

**Process:**

1. **BE lead:** Draft openapi.json with all endpoint definitions
   - Use FastAPI openapi schema as reference
   - Include request/response schemas
   - Include error responses (400, 401, 403, 404, 500)
   
2. **FE lead:** Review spec
   - Can FE consume all responses? (check field names, types)
   - Are required fields documented? (nullable vs. required)
   - Error handling: does FE know how to handle each error code?
   - File uploads: do multipart parameters match FE expectations?
   - Pagination: does offset/limit work for FE pagination UI?
   
3. **Iterate:** Address FE concerns
   - BE lead adjusts spec if needed
   - If large disagreement: discuss with architect
   
4. **Sign-off:** Both BE + FE lead approve
   - No surprises during Sprint 1.2–1.3

5. **CI Integration:** Add validation check
   - Tool: `openapi-spec-validator` in CI
   - Check: Implemented API matches spec
   - Warn on drift (informational, not blocking)

**AC:**
- openapi.json checked into repo
- All Phase 1 endpoints documented (33 endpoints above)
- Request/response schemas defined
- Error codes documented (400, 401, 403, 404, 500)
- FE lead review completed + sign-off
- CI includes openapi-spec-validator check
- Zero ambiguity: developers can implement without asking "what should the response look like?"

**Duration:** 2–3 days
- Day 1 (4h): BE lead drafts spec
- Day 2 (4h): FE lead reviews, iterate with BE lead
- Day 3 (2h): Finalize, sign-off, CI integration
```

---

### Task 0.3: Technology Stack & Dependencies Lock

**Current State:**
```
Duration: 1 day
Deliverable: requirements.txt with all versions locked
```

**Issues & Recommendations:**

✅ **Good:** Locks dependencies upfront (avoids "version drift" issues)

⚠️ **Issue 1: Which Python Version?**
- Current plan: Python 3.12
- Problem: Python 3.13 released Oct 2024; 3.12 EOL Oct 2028
- Recommendation: **Lock to specific 3.12.x version (e.g., 3.12.4)**
  - Allows future 3.12 patches (bug fixes)
  - Prevents surprise of 3.12 → 3.13 major upgrade mid-project

⚠️ **Issue 2: Which Node Version?**
- Current plan: Node 20+
- Problem: "20+" is vague; should be 20.x LTS (EOL April 2026)
- Recommendation: **Lock to Node 20.x LTS (e.g., 20.11.1)**
  - Long-term support until April 2026
  - Project ends ~Nov 2026; 20.x will be out of support by then
  - Consider: Node 22.x LTS (April 2027 EOL) for longer support

⚠️ **Issue 3: FastAPI Version**
- Current plan: "fastapi" (latest)
- Problem: Major version bumps (v0.100 → v1.0) change APIs
- Recommendation: **Specify "fastapi>=0.100,<1.0" or "fastapi==0.100.1"** (depending on how conservative you want)

**Suggested Enhancement:**

```markdown
Task 0.3 [BE] — Technology Stack & Dependencies Lock

**Backend Stack (Python 3.12):**

Core:
- Python: 3.12.4 (minor version pinned for patch updates)
- FastAPI: 0.104.1+ (async web framework)
- Uvicorn: 0.24.0+ (ASGI server)
- SQLAlchemy: 2.0.23+ (ORM, async support)
- aiosqlite: 0.19.0+ (async SQLite driver)
  - [PostgreSQL decision: if Phase 4 → also include psycopg[binary]]

Database & Migrations:
- Alembic: 1.12.1+ (schema migrations)

Validation & Serialization:
- Pydantic: 2.4.2+ (data validation)
- pydantic-settings: 2.0.3+ (.env loading)

Authentication & Security:
- PyJWT: 2.8.1+ (JWT tokens)
- passlib[bcrypt]: 1.7.4+ (password hashing)
- python-multipart: 0.0.6+ (multipart form parsing)

Calendar Integration:
- google-auth-oauthlib: 1.1.0+ (Google OAuth)
- google-auth-httplib2: 0.2.0+ (Google API client)
- msal: 1.24.1+ (Microsoft OAuth)
- caldav: 1.1.4+ (Apple CalDAV)
- python-dateutil: 2.8.2+ (date/time utilities)
- icalendar: 5.1.1+ (iCalendar parsing)

Background Jobs:
- APScheduler: 3.10.4+ (scheduling, no external service)

Image Processing:
- Pillow: 10.0.1+ (thumbnail generation, HEIC support)
- pillow-heif: 0.13.1+ (HEIC format support)

HTTP Client:
- httpx: 0.25.1+ (async HTTP requests)

Testing:
- pytest: 7.4.3+
- pytest-asyncio: 0.21.1+
- pytest-cov: 4.1.0+

Linting & Type Checking:
- mypy: 1.6.1+ (type checking)
- ruff: 0.1.6+ (fast linting)
- bandit: 1.7.5+ (security linting)

**Dependency Grouping (optional, but recommended):**

requirements-base.txt:
  fastapi, uvicorn, sqlalchemy, aiosqlite, alembic, pydantic, etc.
  (core runtime dependencies)

requirements-dev.txt:
  -r requirements-base.txt
  pytest, pytest-asyncio, mypy, ruff, bandit
  (development and testing dependencies)

CI/CD:
  Use requirements-base.txt for production Docker images
  Use requirements-dev.txt locally for development

**Frontend Stack (Node 20.x LTS):**

Core:
- Node: 20.11.0 LTS (until April 2026)
- npm: 10.2.4+

React & Framework:
- react: ^18.2.0
- react-dom: ^18.2.0
- react-router-dom: ^6.20.0
- vite: ^5.0.0

State Management & Data Fetching:
- zustand: ^4.4.1+ (global state)
- @tanstack/react-query: ^5.25.0+ (server state)
- axios: ^1.6.2+ (HTTP client)

UI & Styling:
- tailwindcss: ^3.4.0+
- @shadcn/ui: latest (via npx cli)

PWA:
- vite-plugin-pwa: ^0.18.0+
- workbox-*: ^7.0.0+ (service workers, auto-included in pwa plugin)

Testing:
- vitest: ^0.34.0+ (unit testing)
- @testing-library/react: ^14.1.0+
- @testing-library/user-event: ^14.5.1+
- @testing-library/jest-dom: ^6.1.5+
- msw: ^1.3.2+ (mock service worker)

E2E Testing (Phase 2):
- playwright: ^1.40.0+

Linting & Type Checking:
- typescript: ^5.3.0
- @typescript-eslint/eslint-plugin: ^6.13.0+
- @typescript-eslint/parser: ^6.13.0+
- eslint: ^8.55.0+
- prettier: ^3.1.0+

**Dependency Lock Strategy:**

1. Use npm ci (clean install) in CI/CD
   - Respects package-lock.json exactly
   - Prevents "works on my machine" issues

2. Update policy:
   - Monthly dependency audits (see cross-phase tasks)
   - Security patches: apply within 1 week
   - Feature updates: quarterly (if at all during 56-week project)
   - Major version bumps: **NOT** during active development (only between phases)

3. Version pinning for CI:
   - Production Docker: Pin exact versions (0.1.0, not ^0.1.0)
   - Local development: Allow patch updates (^0.1.0)

**AC:**
- requirements.txt (or requirements-base.txt) with all versions locked
- package-lock.json committed to repo
- Frontend package.json with caret (^) for minor/patch updates, tilde (~) for patches
- Documentation: "To install, run: pip install -r requirements.txt (backend) or npm ci (frontend)"
- Developers can reproduce builds exactly: no surprises

**Duration:** 1 day
- Identify all Phase 1 dependencies (2h)
- Lock versions and test locally (2h)
- Document in README (1h)
- Commit to repo (1h)
```

---

### Task 0.4: Frontend Test Framework & Dependencies

**Current State:**
```
Duration: 1–2 days
Deliverable: vitest.config.ts, example test, test dependencies installed
```

**Issues & Recommendations:**

✅ **Good:** Specifies Vitest + React Testing Library early

⚠️ **Issue 1: Testing Database in Frontend Tests**
- Problem: Frontend tests need to mock backend API calls
- Current plan mentions "msw" (mock service worker) — good
- Recommendation: **Create msw handlers library**
  - Shared across all e2e and component tests
  - Handlers for every Phase 1 API endpoint
  - Easy to reuse in Phase 2–5

⚠️ **Issue 2: TanStack Query Testing**
- Problem: Components use TanStack Query; tests need fake QueryClient
- Current plan: "createWrapper helper for test QueryClient"
- Recommendation: **Be very explicit about TanStack Query setup**
  - Create test utils file
  - Export renderWithQuery helper
  - Example: `renderWithQuery(<Component />, { queryClient })`

**Suggested Enhancement:**

```markdown
Task 0.4 [FE] — Frontend Test Framework & Dependencies (Enhanced)

**What to set up:**

1. **Test Framework: Vitest + React Testing Library**

   Install:
   ```
   npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/user-event @testing-library/jest-dom
   ```

2. **Create vitest.config.ts:**

   ```typescript
   import { defineConfig } from 'vitest/config'
   import react from '@vitejs/plugin-react'
   import path from 'path'

   export default defineConfig({
     plugins: [react()],
     test: {
       globals: true,
       environment: 'jsdom',
       setupFiles: ['./src/__tests__/setup.ts'],
       coverage: {
         provider: 'v8',
         reporter: ['text', 'json', 'html'],
         exclude: [
           'node_modules/',
           'src/__tests__/',
         ],
         lines: 70,     // frontend target
         functions: 70,
         branches: 70,
         statements: 70,
       },
     },
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
   })
   ```

3. **Create frontend/src/__tests__/setup.ts:**

   ```typescript
   import '@testing-library/jest-dom'
   import { server } from './mocks/server'
   
   // Start MSW server before all tests
   beforeAll(() => server.listen())
   
   // Reset handlers after each test
   afterEach(() => server.resetHandlers())
   
   // Clean up after all tests
   afterAll(() => server.close())
   ```

4. **Create Mock Service Worker (MSW) Handlers:**

   File: `frontend/src/__tests__/mocks/server.ts`
   
   ```typescript
   import { setupServer } from 'msw/node'
   import { authHandlers } from './handlers/auth'
   import { calendarHandlers } from './handlers/calendar'
   import { tasksHandlers } from './handlers/tasks'
   import { photosHandlers } from './handlers/photos'
   
   export const server = setupServer(
     ...authHandlers,
     ...calendarHandlers,
     ...tasksHandlers,
     ...photosHandlers,
   )
   ```

   File: `frontend/src/__tests__/mocks/handlers/auth.ts`
   
   ```typescript
   import { http, HttpResponse } from 'msw'
   
   export const authHandlers = [
     http.post('/api/auth/setup', () => {
       return HttpResponse.json({ session_token: 'test-token' })
     }),
     
     http.post('/api/auth/login', () => {
       return HttpResponse.json({ 
         user: { id: '1', display_name: 'Test User', role: 'admin' },
         token: 'test-token'
       })
     }),
     
     http.get('/api/auth/me', () => {
       return HttpResponse.json({ 
         user: { id: '1', display_name: 'Test User', role: 'admin' }
       })
     }),
     
     http.get('/api/auth/setup/status', () => {
       return HttpResponse.json({ setup_complete: true })
     }),
   ]
   ```

   (Similar for calendar, tasks, photos handlers)

5. **Create TanStack Query Test Utils:**

   File: `frontend/src/__tests__/utils/test-utils.tsx`
   
   ```typescript
   import React, { ReactElement } from 'react'
   import { render, RenderOptions } from 'vitest'
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
   
   const createTestQueryClient = () =>
     new QueryClient({
       defaultOptions: {
         queries: { retry: false, gcTime: 0 },
         mutations: { retry: false },
       },
     })
   
   export function renderWithQuery(
     ui: ReactElement,
     { queryClient = createTestQueryClient(), ...renderOptions }: 
     RenderOptions & { queryClient?: QueryClient } = {},
   ) {
     function Wrapper({ children }: { children: React.ReactNode }) {
       return (
         <QueryClientProvider client={queryClient}>
           {children}
         </QueryClientProvider>
       )
     }
   
     return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient }
   }
   
   export * from '@testing-library/react'
   ```

6. **Create Example Test:**

   File: `frontend/src/__tests__/pages/Login.test.tsx`
   
   ```typescript
   import { describe, it, expect } from 'vitest'
   import { renderWithQuery, screen, userEvent } from '../utils/test-utils'
   import Login from '../../pages/Login'
   
   describe('Login Page', () => {
     it('renders family member avatars', async () => {
       renderWithQuery(<Login />)
       expect(screen.getByRole('heading', { name: /login/i })).toBeDefined()
     })
     
     it('shows PIN pad after member selection', async () => {
       renderWithQuery(<Login />)
       const user = userEvent.setup()
       // ... test logic
     })
   })
   ```

7. **Update package.json scripts:**

   ```json
   {
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "test": "vitest run",
       "test:watch": "vitest",
       "test:ui": "vitest --ui",
       "test:coverage": "vitest run --coverage",
       "type-check": "tsc --noEmit",
       "lint": "eslint src --ext .ts,.tsx",
       "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
     }
   }
   ```

8. **Create Example Component Test:**

   File: `frontend/src/__tests__/components/TaskCard.test.tsx`
   
   ```typescript
   import { describe, it, expect } from 'vitest'
   import { renderWithQuery, screen } from '../utils/test-utils'
   import TaskCard from '../../components/TaskCard'
   
   const mockTask = {
     id: '1',
     title: 'Test Task',
     description: 'Test description',
     status: 'pending',
     assignee: { id: 'user1', display_name: 'Alice' },
   }
   
   describe('TaskCard', () => {
     it('renders task title', () => {
       renderWithQuery(<TaskCard task={mockTask} />)
       expect(screen.getByText('Test Task')).toBeDefined()
     })
     
     it('shows complete button', () => {
       renderWithQuery(<TaskCard task={mockTask} />)
       expect(screen.getByRole('button', { name: /complete/i })).toBeDefined()
     })
   })
   ```

**AC:**
- vitest.config.ts configured and checked in
- MSW server set up with handlers for all Phase 1 endpoints
- TanStack Query test utilities created (renderWithQuery helper)
- Example tests created (Login.test.tsx, TaskCard.test.tsx)
- npm test runs without errors (0 tests initially, but framework ready)
- npm run test:coverage configured
- GitHub Actions CI includes npm test step

**Duration:** 1–2 days
- Day 1 (4h): Install vitest, configure, set up MSW
- Day 2 (4h): Create test utilities, example tests, CI integration

**Benefit:**
- All frontend tests use consistent patterns
- MSW handlers reused across component + e2e tests
- TanStack Query testing standardized (no "how do I mock queries?" questions)
- Phase 1–5 developers all write tests the same way
```

---

### Task 0.5: Development Environment Setup & CI/CD Pipeline

**Current State:**
```
Duration: 1 day
Deliverable: .github/workflows/ci.yml, docs/DEVELOPMENT.md
```

**Issues & Recommendations:**

✅ **Good:** CI/CD early prevents "it works on my machine" problems

⚠️ **Issue 1: What Should CI Check?**
- Current plan mentions: "lint, tests, type checking"
- Missing: Docker build, bundle size analysis, security scanning
- Recommendation: **Layered CI checks (fail fast)**
  1. Lint (ruff, eslint) — 30 seconds
  2. Type check (mypy, tsc) — 1 minute
  3. Unit tests (pytest, npm test) — 2–3 minutes
  4. Docker build (single-arch, not multi-arch yet) — 1–2 minutes
  5. Security scan (bandit, npm audit) — 30 seconds
  6. Bundle size check (optional, warnings only) — 30 seconds

⚠️ **Issue 2: Local vs. CI Development**
- Problem: Developer installs deps locally; CI uses Docker
- Risk: "Works in Docker, breaks locally" or vice versa
- Recommendation: **Ensure both paths work identically**
  - Local: `pip install -r requirements.txt` or `npm ci`
  - CI: Docker image built with same deps
  - Test both paths early

**Suggested Enhancement:**

```markdown
Task 0.5 [INFRA] — Development Environment Setup & CI/CD Pipeline

**Part 1: Local Development Setup**

File: `docs/DEVELOPMENT.md`

```markdown
# FamilyHub Development Setup

## Prerequisites

- Docker Desktop (for containerized dev + testing)
- Python 3.12.4+
- Node 20.11.0 LTS+
- Git

## Option A: Full Docker Setup (Recommended for consistency)

```bash
# Clone and enter directory
git clone https://github.com/[org]/familyhub.git
cd familyhub

# Copy and edit .env
cp .env.example .env
# Edit .env: set SECRET_KEY (openssl rand -hex 32), FAMILY_NAME, TIMEZONE

# Start full stack
docker compose up -d

# Wait ~30 seconds for services to start
sleep 30

# Navigate to https://familyhub.local (accept self-signed cert)
# Run setup wizard to create first admin account
```

## Option B: Local Python + Node Development (Faster iteration)

```bash
# Backend
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# In another terminal: Frontend
cd frontend
npm install
npm run dev

# Navigate to http://localhost:5173 (dev server)
# API still on localhost:8000
```

## Testing

```bash
# Backend: unit tests
cd backend
pytest                    # Run all tests
pytest -v                 # Verbose output
pytest --cov=app          # Coverage report
pytest --cov=app -v       # Both

# Frontend: unit tests
cd frontend
npm test                  # Run in watch mode
npm test -- --ui          # Open Vitest UI
npm test -- --coverage    # Coverage report
```

## CI Checks (Run These Before Pushing)

```bash
# Backend
cd backend
mypy app/                 # Type checking
ruff check app/           # Linting
pytest --cov=app          # Tests + coverage

# Frontend
cd frontend
tsc --noEmit              # Type checking
npm run lint              # ESLint
npm test                  # Unit tests

# Both
cd ..
docker compose build      # Build Docker images (ensures Dockerfile works)
```

## Deployment

See [docs/DEPLOYMENT.md](DEPLOYMENT.md) (created in Phase 1.T)
```

---

**Part 2: CI/CD Pipeline**

File: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_BACKEND: familyhub-api
  IMAGE_FRONTEND: familyhub-web

jobs:
  lint-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.12'
          cache: 'pip'
      - run: pip install ruff mypy
      - run: cd backend && ruff check app/
      - run: cd backend && mypy app/

  lint-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: cd frontend && npm ci
      - run: cd frontend && npm run lint
      - run: cd frontend && tsc --noEmit

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.12'
          cache: 'pip'
      - run: pip install -r backend/requirements.txt
      - run: cd backend && pytest --cov=app --cov-report=xml
      - uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.xml

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - run: cd frontend && npm ci
      - run: cd frontend && npm test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/coverage-final.json

  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.12'
      - run: pip install bandit
      - run: cd backend && bandit -r app/
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm audit --audit-level=moderate

  docker-build:
    runs-on: ubuntu-latest
    needs: [lint-backend, lint-frontend, test-backend, test-frontend]
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v2
      - uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: ${{ github.event_name == 'push' }}
          tags: |
            ${{ env.REGISTRY }}/${{ github.repository }}/${{ env.IMAGE_BACKEND }}:latest
            ${{ env.REGISTRY }}/${{ github.repository }}/${{ env.IMAGE_BACKEND }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      - uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: ${{ github.event_name == 'push' }}
          tags: |
            ${{ env.REGISTRY }}/${{ github.repository }}/${{ env.IMAGE_FRONTEND }}:latest
            ${{ env.REGISTRY }}/${{ github.repository }}/${{ env.IMAGE_FRONTEND }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**AC:**
- .github/workflows/ci.yml created and tested
- All checks pass before Phase 1 Sprint 1.1 starts
- Developers have clear docs/DEVELOPMENT.md for Day 1 setup
- CI runs on every PR (prevents broken code on main)
- Coverage reports generated and stored
- Docker images built and pushed to GHCR (for Phase 1+ testing on Pi)

**Duration:** 1 day
- Write CI workflow (2h)
- Test locally (1h)
- Document in DEVELOPMENT.md (1h)
- Commit and verify CI runs successfully (1h)
```

---

## Phase 0 Critical Path & Dependencies

```
Task 0.1 (Decisions)
    ↓
Task 0.2 (OpenAPI Contract) depends on 0.1
    ↓
Task 0.3 & 0.4 & 0.5 (parallel, depend on 0.1 & 0.2)
    ↓
All Phase 0 complete → Phase 1.0 (API Design Sprint) ready
    ↓
Phase 1.0 complete → Phase 1.1 (Infrastructure) can start
```

**Sequential tasks:** 0.1 → 0.2 (1–2 days)  
**Parallel tasks:** 0.3, 0.4, 0.5 (1–2 days, all in parallel)  
**Total Phase 0:** 2–4 days, not a full week

---

## Phase 0 Resource Allocation

| Task | Lead | Participants | Duration |
|------|------|--------------|----------|
| 0.1 | Tech Lead | Team (1 meeting) | 2–4 hours |
| 0.2 | BE Lead | FE Lead (review) | 2–3 days |
| 0.3 | DevOps / Tech Lead | BE Team | 1 day |
| 0.4 | FE Lead | FE Team | 1–2 days |
| 0.5 | DevOps | All | 1 day |

**Total effort:** 1 tech lead (4 days) + 2 BE devs (3 days) + 2 FE devs (3 days) + 1 DevOps (2 days)

---

## Recommendations & Issues Summary

### ✅ What's Working Well

1. **Upfront planning:** Phase 0 prevents "surprises" in Phase 1
2. **API-first design:** OpenAPI contract eliminates integration rework
3. **Test framework early:** Vitest setup allows testing from day 1
4. **CI/CD ready:** GitHub Actions prevents "works on my machine" issues
5. **Dependency lock:** Reproducible builds across environments

### ⚠️ Issues to Address

1. **Task 0.1 is too open-ended**
   - Recommendation: Make firm database decision (SQLite OR PostgreSQL, not "maybe")
   - Recommendation: Provide decision matrix (scale, cost, complexity)

2. **Task 0.2 missing error handling spec**
   - Recommendation: Specify all error responses (400, 401, 403, 404, 500)
   - Recommendation: Add CI check for spec drift (openapi-spec-validator)

3. **Task 0.4 needs more detail on MSW setup**
   - Recommendation: Provide example MSW server setup
   - Recommendation: Create handler templates for each module

4. **Task 0.5 missing security scanning**
   - Recommendation: Add bandit (Python security linter) to CI
   - Recommendation: Add npm audit to CI
   - Recommendation: Fail on critical issues

5. **Phase 0 timeline ambiguous**
   - Recommendation: Clearly state: 2–4 days actual, 1 week allocated for buffer

---

## Phase 0 Approval Checklist

Before Phase 1.1 can start:

- [ ] **0.1 Complete:** All infrastructure decisions documented and signed off
- [ ] **0.2 Complete:** openapi.json created, BE + FE both approve, no ambiguity on API shapes
- [ ] **0.3 Complete:** requirements.txt (Python) and package-lock.json (Node) locked and committed
- [ ] **0.4 Complete:** vitest.config.ts, MSW handlers, test utils, example tests all ready
- [ ] **0.5 Complete:** CI/CD pipeline running successfully, docs/DEVELOPMENT.md complete
- [ ] **All Checks Pass:** CI workflow executes without errors on main branch
- [ ] **Team Ready:** All developers can run full stack locally in < 2 hours
- [ ] **No Blockers:** No questions about Phase 1 architecture or API contracts

---

## Next Steps

1. **Review Phase 0 Enhanced Tasks** (5 recommended tasks above)
2. **Make Infrastructure Decisions** (Task 0.1)
   - Database: SQLite only, or PostgreSQL in Phase 4?
   - Caching: In-memory or Redis?
   - Job queue: APScheduler only or Celery in Phase 3+?
   - Search: SQLite FTS5 or Elasticsearch in Phase 5?
3. **Assign Leads** (Tech Lead, BE Lead, FE Lead, DevOps)
4. **Schedule Phase 0** (2–4 days starting immediately)
5. **Review & Approve OpenAPI Spec** (FE lead + BE lead sign-off)

---

*Phase 0 Review generated April 23, 2026*  
*Provides detailed recommendations for each of 5 tasks*  
*Ready for team review and adjustment*
