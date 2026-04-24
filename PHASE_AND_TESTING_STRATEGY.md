# FamilyHub: Phase Efficiency & Testing Strategy Integration

**Date:** April 23, 2026  
**Scope:** Phases 1–5 (56 weeks), Team Structure, Continuity, Quality Assurance  
**Audience:** Project leads, developers, stakeholders

---

## Executive Summary

The implementation plan is **ambitious and well-scoped**, but has **interconnected gaps** in:
1. **Phase continuity:** Phases are isolated; knowledge loss between them
2. **Testing coverage:** Under-specified and back-loaded (mostly Phase 1)
3. **Team efficiency:** Sequential sprints vs. parallelizable work
4. **Production readiness:** Transition from Phase 1 → 2 is unclear

**This review integrates both concerns** and provides a **unified improvement plan** to maintain team velocity, preserve knowledge, and ensure quality throughout.

**Key insight:** Testing strategy and phase structure are **not separate**—they're interlocked. A broken phase handoff causes testing rework. Poor testing in Phase 1 blocks Phase 2.

---

## Part 1: Phase Structure Issues & Recommendations

### Issue 1: Phase Boundaries Disconnect Knowledge & Context

**Problem:**
Each phase is a distinct "milestone" with no explicit knowledge transfer or retrospective. Developers build Phase 1, then context-switch to Phase 2's different features.

- Sprint 1.4.10 specifies tests for Phase 1
- No retrospective on "what worked in Phase 1 testing"
- Phase 2 starts (week 8) with new developers → knowledge lost

**Impact:**
- Momentum loss (8 weeks of context vanishes)
- Inconsistent patterns (Phase 2 services don't follow Phase 1 conventions)
- Knowledge silos (only 1 person understands calendar sync)

**Recommendation:**

Add **Phase N.5 Overlap Sprints** (1 week per phase):

```markdown
Phase 1.5 (Week 7–8) — Phase 1→2 Knowledge Transfer Sprint

Parallel tracks:
- Phase 1 final testing + exit criteria validation (above)
- **Phase 2 preparation + learning:**
  - Retrospective: What testing patterns worked in Phase 1?
  - Code review of Phase 1 core modules (identify patterns)
  - Documentation: "Phase 1 Testing Patterns" (for Phase 2 to replicate)
  - Identify technical debt from Phase 1
  - Phase 2 team ramp-up: Review Phase 1 code

Output:
- "Phase 1 Lessons Document" (testing patterns, architecture decisions)
- "Phase 2 Development Handbook" (apply Phase 1 lessons)
```

**Apply to all phase transitions:**
- Phase 2.5: Overlap into Phase 3 (week 17–18)
- Phase 3.5: Overlap into Phase 4 (week 29–30)
- Phase 4.5: Overlap into Phase 5 (week 43–44)

**Benefit:** Maintains momentum, distributes knowledge, reduces rework.

---

### Issue 2: Frontend & Backend Lack API Contract Upfront

**Problem:**
- Sprint 1.1–1.3: Backend and frontend developed independently
- Sprint 1.4: Integration reveals mismatches
  - FE expects `GET /api/tasks?assignee=X` but BE has `?assigned_to=X`
  - FE uses `task.completed_at`; BE uses `task.completion_timestamp`

**Impact:**
- Weeks 6–8: Last-minute API contract changes
- Rework: FE components updated multiple times
- Bugs: Type mismatches discovered in integration

**Recommendation:**

**Option A: Explicit API Design Sprint (Recommended)**

```markdown
Sprint 1.0 (Week 0–1) — API Contract Design

Goal: FE and BE agree on all API shapes BEFORE code

Tasks:
- [BE] Design OpenAPI 3.1 spec (all endpoints, request/response schemas)
  - AC: All Phase 1 endpoints documented
  
- [FE] Review OpenAPI spec; confirm UI feasibility
  - AC: FE lead approval or issues filed on spec

- [DB] Finalize schema for all Phase 1 features
  - AC: Schema review by 2 developers

Timeline: 1 week (short, focused)
Payoff: Eliminates Sprint 1.4 integration surprises
```

**Option B: Daily Sync During Development**

If design sprint feels too formal, add **daily 15-min API sync** (FE lead + BE lead).

---

### Issue 3: Critical Infrastructure Decisions Deferred to Phase 4

**Problem:**
- Phase 1 builds on SQLite (fine for Phase 1–3)
- Phase 4 (weeks 30–44) adds PostgreSQL migration
- All Phase 1–3 code assumes SQLite → **major rework in Phase 4**

**Impact:**
- Weeks 1–30: Developers optimize for SQLite (no connection pooling)
- Week 30: "Let's migrate to PostgreSQL" → 3–4 week rewrite
- Risk: Migration bugs, data loss

**Recommendation:**

**Decide on Phase 4 architecture NOW (before Phase 1 starts):**

```markdown
Decision: Will we migrate to PostgreSQL in Phase 4?

If YES (PostgreSQL planned for Phase 4):
→ Build Phase 1 with async SQLAlchemy + aiosqlite
→ Use connection pooling from day 1
→ Phase 4 migration: 1 day (swap DB driver, no app logic changes)

Cost: Async SQLAlchemy is not harder than sync
Payoff: Phase 4 migration is 1 day (not 3 weeks)

Current plan says Phase 4 includes PostgreSQL, so:
→ **Build Phase 1 with PostgreSQL compatibility in mind**
```

**Apply to:**
- ✅ Database (decide now: SQLite for all 56 weeks, or PostgreSQL in Phase 4?)
- ✅ Caching layer (Redis or in-memory?)
- ✅ Job queue (APScheduler only, or RabbitMQ in Phase 3+?)
- ✅ Search (full-text search on wiki: SQLite or Elasticsearch?)

---

### Issue 4: Knowledge Concentration in Feature Silos

**Problem:**
- One backend dev builds Google Calendar integration (6 days in Sprint 1.3)
- Same dev is **only expert** on OAuth, token refresh, error handling
- If they're on vacation or leave → Calendar sync is at risk
- Phase 2 adds Microsoft Calendar → ramp-up time for same or new dev

**Impact:**
- Vacation risk (July 2026, Phase 2 mid-sprint)
- Turnover risk (if developer leaves)
- Testing risk (developers don't understand each other's code)

**Recommendation:**

**Pair programming for complex features:**

```markdown
## Pairing Strategy

**Identify complex features per phase:**
- Phase 1: Google Calendar (OAuth, encryption, sync)
- Phase 2: Microsoft + Apple Calendar, Lists module
- Phase 3: Routines, Meal Planning
- Phase 4: PostgreSQL migration

**Assignment:**
- Primary: Developer A (experienced)
- Partner: Developer B (learns)
- Weekly swap: B drives, A navigates

**Example (Phase 1.3 — Google Calendar):**
- Week 1: A drives OAuth setup, B navigates/reviews
- Week 2: B drives sync logic, A reviews/helps

**Outcome:** Both A and B know OAuth + sync logic

**Timeline:** Same duration as non-paired development
**Benefit:** 2x knowledge redundancy; faster Phase 2 onboarding
```

---

### Issue 5: Phases 2–5 Are Sequential; Parallelizable Work Not Identified

**Problem:**
Phases 2–5 are structured as **linear sprints**:
- Sprint 2.1: Microsoft Calendar (weeks 8–10)
- Sprint 2.2: Lists (weeks 10–12)
- Sprint 2.3: Chore Board (weeks 12–14)

But many sprints don't depend on each other and could run in parallel.

**Impact:**
- 2–3 developers on Phase 2, but only 1 working at a time
- 10-week Phase 2 could be 6 weeks with parallel streams

**Recommendation:**

**Parallelize independent sprints into streams:**

```markdown
## Phase 2 Revised (Parallel Structure)

Original (Serial): 10 weeks
- Sprint 2.1 (weeks 8–10): Microsoft + Apple Calendar
- Sprint 2.2 (weeks 10–12): Lists
- Sprint 2.3 (weeks 12–14): Chore Board + Rewards
- Sprint 2.4 (weeks 14–16): Weather + Announcements + Push
- Sprint 2.5 (weeks 16–18): iCal + Testing

**Revised (Parallel): 10 weeks, better utilization

Stream A (Calendar):
- Sprint 2.1: Microsoft + Apple Calendar APIs (weeks 8–12)
- Sprint 2.4.1: Conflict detection (weeks 10–12)

Stream B (Lists & Chores):
- Sprint 2.2: Lists module (weeks 8–12)
- Sprint 2.3: Chore board + Kanban (weeks 10–12)

Stream C (Notifications):
- Sprint 2.3.2: Rewards (weeks 10–14)
- Sprint 2.4: Weather + Announcements + Push (weeks 12–14)

Stream D (Integration & Testing):
- Sprint 2.5: iCal + Phase 2 tests (weeks 14–18)

**Requirements (no blocking):**
- All depend on Phase 1 auth ✅
- All depend on Phase 1 tasks ✅
- No cross-stream database conflicts ✅

Team allocation:
- Backend team 1: Streams A + C (2 devs)
- Backend team 2 + Frontend team: Streams B + D (3 devs)

**Payoff:** Same duration (10 weeks), better coordination
```

**Apply to Phases 3–5:** Could reduce timeline by 20% without additional team size.

---

### Issue 6: Technical Debt Is Implicit, Not Tracked

**Problem:**
- Phase 1: Hardcoded wall layout → refactored in Phase 2.3
- Phase 1: SQLite only → refactored in Phase 4
- Phase 3: No full-text search on wiki → added in Phase 5
- All discovered **during the phase**, causing unplanned work

**Impact:**
- 10–15% of time is unplanned rework
- Scope creep (unexpected work delays planned features)

**Recommendation:**

**Add Tech Debt Sprint per phase (Phase N.T):**

```markdown
## Tech Debt Sprint (0.5 sprint = 5 days per phase)

**Phase 1.T (Sprint 1 cleanup, before 1.5 overlap):**
- Refactor: Hardcoded wall layout → configurable (for Phase 2.3)
- Documentation: "Database Schema Rationale" (for Phase 4 PostgreSQL migration)
- Testing: Fill coverage gaps
- Logging: Improve error messages in calendar sync

**Phase 2.T, 3.T, 4.T, 5.T:** Similar pattern

**Effort:** 5 days × 5 phases = 25 days over 56 weeks
**Payoff:** Prevents 15–20 days of unplanned rework
```

---

### Issue 7: Feedback Loop From Users Is Implicit

**Problem:**
- Weeks 1–8: Build in isolation
- Week 8: "Phase 1 done"
- Week 9: Family uses it → feedback arrives
- Week 10–12: Phase 2 already planned → feedback is too late

**Impact:**
- Family tries wall in week 8 → "This layout is confusing"
- Team is 50% through Phase 2 → layout change is "out of scope"
- Feedback deferred 4 months → family is frustrated

**Recommendation:**

**Add Feedback Gate between phases (1 week):**

```markdown
## Phase 1→2 Feedback Gate (Week 7–8)

- Phase 1 complete (exit criteria met)
- Family uses app for 1 week
- Collect feedback: usability, performance, bugs, surprises
- Meeting: 30-min debrief with family

**Decision:**
- Blocking bugs → Phase 1.5 (fix sprint) — delay Phase 2 by 1 week
- Major UX issue → Phase 2 scope adjustment (reduce scope by 1 sprint)
- Minor issues → Phase 2 backlog
- No issues → Proceed to Phase 2

**Apply to all phase transitions:**
- Week 17–18 (Phase 2→3)
- Week 29–30 (Phase 3→4)
- Week 43–44 (Phase 4→5)

**Effort:** 1 week per 8–10 weeks of dev (12.5% of timeline)
**Payoff:** Validates assumptions, prevents rework, keeps family engaged
```

---

### Issue 8: Documentation Is Reactive, Not Proactive

**Problem:**
- Features are documented in-code only
- No "Developer Onboarding Guide" (new hires waste 2–3 days getting context)
- No "Architecture Decision Records" (decisions fade from memory)
- Post-launch, support team doesn't understand system

**Recommendation:**

**Documentation sprint per phase (part of Phase N.T):**

```markdown
## Documentation Sprint (3–5 days per phase)

**Phase 1.T Documentation:**
- ARCHITECTURE.md: High-level system design, technology choices
- docs/DEVELOPMENT.md: Day 1 setup for new developers
- docs/DATABASE_SCHEMA.md: ER diagram, table descriptions
- docs/CALENDAR_SYNC.md: How Google Calendar sync works (for Phase 2)
- docs/CONTRIBUTING.md: Code style, testing, PR process

**Phase 2.T, 3.T, etc.:** Document new modules (Lists, Routines, etc.)

**Tool:** Markdown files in repo + ADRs (Architecture Decision Records)

**Effort:** 3–5 days per phase
**Payoff:** New developer onboarding: 30 min (read docs) instead of 2–3 days
```

---

### Issue 9: Phase Exit Criteria Don't Test Team Readiness

**Problem:**
Phase 1 exit criteria focus on **user features**, not **team readiness**:
```
- docker compose up -d → app accessible
- Setup wizard works
- Login works
- [... 6 more user features ...]
```

But missing:
- Can a new developer deploy Phase 1 in < 2 hours?
- Are tests passing in CI/CD?
- Is code clean enough for Phase 2 to modify?

**Recommendation:**

**Add "Developer Readiness" criteria to each phase:**

```markdown
## Phase 1 Exit Criteria (Enhanced)

**User Criteria (existing):**
- [ ] docker compose up -d works on fresh Pi
- [ ] Setup wizard completes
- [... existing 7 criteria ...]

**Developer Readiness (NEW):**
- [ ] All Phase 1 PRs approved by 2 developers
- [ ] Test coverage: 80%+ backend, 70%+ frontend
- [ ] CI/CD: All tests pass, no skipped tests
- [ ] Documentation: README, setup, architecture reviewed
- [ ] Onboarding: New dev can deploy locally in < 2 hours
- [ ] Rollback: Can revert last 5 commits without data loss
- [ ] Code quality: 0 TODO comments, high-complexity functions documented
- [ ] Dependency audit: pip-audit + npm audit pass
- [ ] Architecture review: 1 independent architect reviews design

**Deployment Criteria (NEW):**
- [ ] Production deployment procedure documented + tested
- [ ] Backup + restore tested (actually tested, not just coded)
- [ ] Database migrations tested (upgrade + downgrade)
- [ ] All secrets in .env, not in code
- [ ] Monitoring: Logging working, can see errors without SSH

AC: If any criterion fails, phase is blocked until fixed.
```

---

### Issue 10: Phase 1 → Production Transition Is Unclear

**Problem:**
- Week 8: Phase 1 is "done"
- Week 9: Family uses it (is it "production"?)
- Week 10: Phase 2 starts; is Phase 1 in "maintenance mode"?

No mention of:
- Rollback procedure if Phase 1 has bugs
- Support model (who answers family questions?)
- How Phase 2 changes don't break Phase 1
- Deployment pipeline

**Recommendation:**

**Define production readiness + support model:**

```markdown
## Phase 1 Production Launch (Week 8–9)

**Launch Criteria:**
- [ ] All exit criteria met
- [ ] Backup procedure tested + documented
- [ ] Rollback procedure documented + tested
- [ ] 2 developers trained on production deployment
- [ ] On-call schedule defined for first 2 weeks
- [ ] Monitoring/logging in place

**Support Model:**

**Weeks 8–9 (hot standby):**
- 1 on-call developer (rotates daily)
- Responds to critical bugs (crashes, data loss)
- Phase 2 team continues; on-call is 25% time available

**Weeks 10–18 (Phase 2 dev):**
- No dedicated on-call; Phase 2 team handles issues
- Critical bugs: Phase 2 pauses, fix + test + deploy
- Expected: 0–2 critical bugs (no regression)

**Week 18+ (Phase 1 + 2 in production):**
- Shift to maintenance mode (5% team effort)
- On-call rotation if serious issues

**Backward Compatibility Policy:**

Phase 2 changes (weeks 8–18):
- **No breaking API changes** to Phase 1 endpoints
- New features are additive (new endpoints, new fields)

Example:
- Phase 1: `GET /api/calendar/events?start=X&end=Y`
- Phase 2 adds: `GET /api/calendar/events?start=X&end=Y&source_id=Z` (optional)
- Phase 1 clients still work (source_id ignored if missing)

**Rationale:** Family is using Phase 1; breaking their integration would be bad.
```

---

## Part 2: Testing Strategy Issues & Integration

### Testing Issue 1: Testing Is Back-Loaded

**Problem:**
- Phase 1: 2 test tasks (smoke + integration in Sprint 1.4)
- Phase 2–5: No dedicated test tasks
- Manual test checklists exist, but no automated test requirements

**Impact:**
- Bugs discovered late → expensive fixes
- Regressions introduced in later phases
- No safety net for refactoring

**Recommendation:**

**Add `[TEST]` task to each sprint that covers:**

```markdown
## Testing in Every Sprint (Not Just Phase 1.4)

**Every `[BE]` feature task includes a `[TEST]` sub-task (1–2 days):**

Example (Sprint 1.2.1 — Auth API):

Sprint 1.2.1 `[BE]` — Auth API endpoints
- What to build: [existing spec]
- AC: [existing AC]

Sprint 1.2.1 `[TEST]` — Auth API unit tests
- What to test: POST /api/auth/setup, login, PIN, rate limiting
- Coverage target: 90%+
- Framework: pytest-asyncio
- AC: 
  - tests/test_auth.py: 12+ tests, all passing
  - Coverage: ≥ 90%
  - No console warnings/errors

**Timeline per sprint:**
- Days 1–4: Feature development (Task A, B, C)
- Days 5–7: Testing (Task A test, B test, C test)
- Days 6–7: Integration (tests from multiple tasks work together)

**Benefit:**
- Tests written while code is fresh (better quality)
- No test bottleneck in Phase 1.4
- Each sprint is tested in isolation
```

**Apply to Phases 2–5:**

```markdown
## Phase 2 Testing Sprints (integrated with features)

- Sprint 2.1.T: Microsoft + Apple Calendar unit tests (15+ tests)
- Sprint 2.2.T: Lists module unit tests (12+ tests)
- Sprint 2.3.T: Chore board + Rewards unit tests (14+ tests)
- Sprint 2.4.T: Weather + Announcements unit tests (8+ tests)
- Sprint 2.5.T: iCal + Phase 2 integration tests (20+ tests)

Similarly for Phases 3–5.
```

---

### Testing Issue 2: No Unit Test Requirements in Feature Tasks

**Problem:**
Feature task example (Phase 1.3.3 — Google Calendar):
```
AC:
- Admin can initiate Google OAuth flow
- Events appear in calendar_events table
- Background job runs every 15 minutes
- Sync errors don't stop other sources
```

No mention of unit tests for:
- `backend/app/integrations/google_calendar.py` functions
- Token encryption/decryption
- Error handling in sync job

**Impact:**
- Utility functions untested
- Bugs in core logic discovered too late
- No confidence in refactoring

**Recommendation:**

**Update **every** `[BE]` feature task to include test AC:**

```markdown
**AC (Testing — add to all backend features):**
- Unit tests for all service functions with 80%+ line coverage
- Mock external dependencies (APIs, database) using pytest fixtures
- Test both happy path + error scenarios (auth failure, timeout, malformed response)
- All tests pass: `pytest tests/test_[module].py -v`
- Coverage report: `pytest --cov=app --cov-report=html` ≥ 80%

**Apply to high-risk modules:**
- integrations/ (Google, Microsoft, Apple, iCal, weather)
- services/ (calendar, tasks, photos, lists, rewards, etc.)
- core/ (security, encryption, database)
- jobs/ (sync, backup, overdue detection)
```

---

### Testing Issue 3: Performance Testing Deferred to Phase 3

**Problem:**
Task 3.6.1 (week 28–30): "Phase 3 Performance profiling"

But Phase 1 exit criteria says: "dashboard loads in under 3 seconds on Pi"

**Risk:** Architectural issues discovered at week 28 → costly refactoring.

**Recommendation:**

**Add performance validation to each phase exit:**

```markdown
## Phase 1 Exit Criteria (Performance)

**Task 1.4.11 [TEST] — Phase 1 Performance Baseline**

What to test (on Raspberry Pi 4, 4GB RAM):
- Dashboard load time: < 3 seconds (first paint)
- GET /api/calendar/events: < 200ms (response time)
- Wall display clock update: 60fps (smooth)
- Memory per container: api < 150MB, web < 100MB, caddy < 50MB

AC:
- Dashboard fully renders < 3s
- All API endpoints: < 500ms (p95)
- Memory stable after 1 hour continuous use
- Document baseline metrics in README.md

## Phase 2 Exit Criteria (Performance)

**Task 2.5.3 [TEST] — Phase 2 Performance Validation**

What to test (same Pi hardware):
- Baseline tests from Phase 1 (must still pass)
- Multi-user load: 3 concurrent users, measure API response times
- Wall display with 50+ events: smooth clock/events
- Sync job impact: CPU spike < 80%

AC:
- Phase 1 benchmarks still pass
- p95 API response time: < 500ms under 3-user load
- Memory increase < 30MB under load
- Sync job completes in < 5 minutes

## Phase 3 Exit Criteria (Performance)

**Task 3.6.1 [TEST] — Phase 3 Performance Profiling (Enhanced)**

What to test (on Pi hardware):
- Dashboard load time: < 2.5 seconds (improved from Phase 1)
- API response times: p95 < 400ms (improved)
- Routine runner: step transitions < 200ms
- Memory footprint: still < 300MB total idle
- Full system: 4-hour continuous use, no memory leaks

AC:
- Phase 1 + 2 benchmarks still pass
- New benchmarks at or above target
- No memory leaks detected over 4 hours
- Document performance regressions (if any) for Phase 4
```

---

### Testing Issue 4: E2E Testing Not Mentioned

**Problem:**
No mention of end-to-end tests (Playwright, Cypress):
- "Create task on phone, complete on wall, verify sync"
- "Upload photo → album → slideshow flow"
- "Login on 2 devices, complete task simultaneously"

**Risk:** Multi-device interactions untested; real-world flows may break.

**Recommendation:**

**Add E2E test task to Phase 2 (after major features in Phase 1 + 2):**

```markdown
## Task 2.5.4 [TEST] — E2E Test Suite (Playwright)

What to test:
- User flows across devices:
  - Login on phone, create task, refresh tablet, verify sync
  - Complete task on wall, check notification on phone
  - Edit event on desktop, verify on wall within 5 seconds
- Photo upload → album → slideshow flow
- Concurrent writes: 2 users editing same task (race condition check)
- Offline resilience: complete task offline, verify sync when back online

Technology: Playwright (cross-browser, headless, fast)

AC:
- 8+ e2e test scenarios pass in CI
- All critical user flows covered
- Tests run in < 5 minutes
- No flaky tests (run 3x; must pass all times)
```

---

### Testing Issue 5: Database Migration Testing Is Vague

**Problem:**
Cross-cutting: "Every Alembic migration must be tested both upgrade and downgrade"

But no concrete task per phase.

**Risk:** Downgrade tests forgotten; migration errors in production.

**Recommendation:**

**Add migration testing AC to every DB migration task:**

```markdown
**AC (Database Migrations — add to all migration tasks):**

Upgrade path:
- `alembic upgrade +1` completes without error
- New tables/columns created correctly
- Foreign keys are correct
- No data loss

Downgrade path:
- `alembic downgrade -1` rolls back completely
- Database state pre/post downgrade is identical
- Can be done safely during maintenance window

Testing:
- Test file: tests/test_migrations.py includes upgrade/downgrade cycle
- Test with both empty database and populated database
- No table locks > 5 seconds on production schema size
```

---

### Testing Issue 6: Security Testing Has No Concrete Tasks

**Problem:**
Cross-cutting: "Security review: Before each phase release..."

No concrete task; just a guideline. Often skipped under deadline pressure.

**Recommendation:**

**Add formal security task to each phase:**

```markdown
## Sprint N.7 [TEST] — Security Review & Audit

(Add to Phase 1, 2, 3, 4, 5 final sprints)

What to test:
- Authentication: verify require_auth on all non-public endpoints
- Authorization: role checks (admin endpoints reject teen users)
- Input validation: SQL injection, XSS, path traversal (OWASP Top 10)
- Secrets: no API keys in code, all env vars in .env.example only
- CORS: origin whitelist correct, no `*` except in dev
- Rate limiting: login, PIN attempts, API endpoints
- Data exposure: soft-deletes work, no leaked user data

Tools:
- Backend: bandit (security linter), manual route review
- Frontend: React DevTools for XSS, manual OWASP checklist
- Database: check password hashing, credential encryption

AC:
- Security checklist: all items pass
- Bandit report: 0 critical issues
- Code review: 2 reviewers sign-off on security before merge
```

---

### Testing Issue 7: Frontend Test Framework Not Specified

**Problem:**
Frontend tests mentioned but no framework specified (Vitest? Jest?). Leads to inconsistent approaches.

**Recommendation:**

**Specify Vitest + React Testing Library in Task 1.1.4:**

```markdown
Task 1.1.4 [FE] *BLOCKER* — React/Vite/TypeScript frontend skeleton

**Updated AC:**
- npm run dev starts without errors
- npm run build produces dist/
- npm test runs tests (zero initially, but framework configured)
  - Framework: Vitest + React Testing Library
  - Config: vitest.config.ts configured
  - TanStack Query: createWrapper helper for test QueryClient
  - Example test: src/__tests__/pages/Login.test.tsx (placeholder)
- PWA manifest appears in DevTools
- "Install app" prompt works
```

---

### Testing Issue 8: Phase 1.4.10 Lacks Coverage Targets

**Problem:**
Task 1.4.10 mentions test files but no count or coverage targets:
```
What to build:
- tests/test_auth.py: setup flow, login, rate limiting
- tests/test_calendar.py: event CRUD, recurrence expansion
- tests/test_tasks.py: task CRUD, complete task, overdue job
- tests/test_photos.py: upload, thumbnail generation
```

No mention of: test count, coverage targets, failure modes, cross-module integration.

**Recommendation:**

**Expand Task 1.4.10 with specific counts:**

```markdown
Task 1.4.10 [TEST] — Phase 1 Integration Test Suite (Enhanced)

**Backend tests:**

tests/test_auth.py (12+ tests):
- Setup flow: family + admin user creation
- Password login: valid + invalid credentials
- PIN login: valid PIN, invalid PIN, rate limiting (5 attempts → 429)
- Session validation: token expiry, role-based endpoint access
- Coverage target: 90%+

tests/test_calendar.py (15+ tests):
- Event CRUD: create, read, update, delete
- Recurrence expansion: daily, weekly, monthly events
- Date range queries: filter events by start/end
- All-day event handling, timezone conversion
- Coverage target: 85%+

tests/test_tasks.py (18+ tests):
- Task CRUD: create, read, update, delete
- Task completion: with + without photo
- Verify/reject flow
- Overdue job: marks tasks past due_date
- Subtask roll-up, recurrence generation
- Coverage target: 85%+

tests/test_photos.py (10+ tests):
- Upload: single + multiple files
- HEIC conversion to JPEG
- Thumbnail generation
- Album management
- Coverage target: 80%+

**Frontend tests:**

frontend/__tests__/pages/Calendar.test.tsx (8+ tests):
- Render all views: month, week, day, agenda
- Event filtering: by member, by source
- Drag-to-reschedule (admin only)
- Coverage target: 75%+

frontend/__tests__/pages/Tasks.test.tsx (10+ tests):
- Task list: by due date, by person
- Complete action: opens sheet, submits, optimistic update
- Kanban board: drag between columns
- Coverage target: 75%+

**AC:**
- pytest: 80%+ overall coverage, all tests pass
- npm test: all tests pass, 70%+ coverage
- CI reports coverage; warns if drops
- Manual test checklist (existing) runs on Pi hardware
```

---

## Part 3: Integrated Recommendations

### Quick Wins (Before Phase 1 Sprint 1.2)

| Change | Effort | Payoff | Owner |
|--------|--------|--------|-------|
| Add Phase 1.0 "API Design Sprint" | 1 week | Eliminates integration surprises in 1.4 | Tech lead |
| Decide PostgreSQL strategy | 30 min | Saves 3 weeks of rework in Phase 4 | Tech lead |
| Define pairing for complex features | 30 min | 2x knowledge redundancy | Team lead |
| Specify Vitest + RTL framework | 1 hour | Consistent testing approach | FE lead |
| Add "Developer Readiness" criteria | 2 hours | Phase 2 starts with low risk | Tech lead |

### Medium-term (By Phase 1 Exit, Week 8)

| Change | Effort | Payoff | Owner |
|--------|--------|--------|-------|
| Expand Task 1.4.10 with test counts | 2 hours | Clear test expectations | QA lead |
| Add Phase 1.T tech debt sprint | 1 day planning | Prevents 15+ days of later rework | Tech lead |
| Create ADR template + process | 1 day | Preserve architectural decisions | Tech lead |
| Define documentation sprint per phase | 1 day | Reduce onboarding from 2 days to 30 min | Tech lead |
| Add production support model | 1 day | Clarity on Phase 1→2 transition | Tech lead |

### Ongoing (Throughout 56 weeks)

| Change | Effort | Payoff | Owner |
|--------|--------|--------|-------|
| Phase N.5 overlap sprints (4 × 1 week) | 4 weeks | Knowledge transfer, momentum preservation | All |
| Phase N.T tech debt sprints (5 × 5 days) | 25 days | Prevent 15–20 days of unplanned rework | All |
| Daily API Sync meetings | 5 min/day | Early detection of BE/FE mismatches | Tech lead |
| Feedback gates between phases (4 × 1 week) | 4 weeks | User validation, prevent scope creep | PM + Team |
| Testing in every sprint (not Phase 1.4 only) | +2 days/sprint | No test bottleneck, higher quality | All |
| Parallelize phases 2–5 (pilot Phase 2) | 1 day planning | 20% faster timeline (40+ weeks vs. 56) | PM |
| Monthly dependency + regression testing | 1 day/month | Security patches don't introduce bugs | DevOps |

---

## Integrated Timeline Impact

### Current Plan
- **Total: 56 weeks (13.5 months)**

### With All Recommendations

**Adding:**
- Phase N.5 overlap sprints: +4 weeks
- Phase N.T tech debt sprints: incl. in timeline
- Feedback gates between phases: +4 weeks

**Reducing (with parallelization):**
- Phase 2: 10 weeks → 6 weeks (parallel streams)
- Phase 3: 12 weeks → 9 weeks (parallel streams)
- Phase 4: 14 weeks → 11 weeks (parallel streams)
- Phase 5: 12 weeks → 9 weeks (parallel streams)
- Savings: 11 weeks (requires 2–3 developers)

**Net timeline: 56 weeks → 49 weeks** (11.8 months)

**Cost:** Same team size; improved communication, testing, documentation; **lower risk of rework.**

---

## Implementation Checklist

### Before Phase 1 Sprint 1.1

- [ ] Add Phase 1.0 API Design Sprint (1 week)
- [ ] Decide PostgreSQL migration strategy
- [ ] Define pairing strategy for complex features
- [ ] Specify Vitest + React Testing Library
- [ ] Establish daily API Sync meetings (15 min)

### Phase 1 Execution (Weeks 1–8)

- [ ] Testing in every sprint (not just 1.4)
- [ ] Unit tests for all `[BE]` features (80%+ coverage)
- [ ] API contracts reviewed daily in sync meetings
- [ ] Tech debt tracked in "Debt Backlog"

### Phase 1 Exit (Week 8)

- [ ] Expand Task 1.4.10 with test counts (12+, 15+, 18+, etc.)
- [ ] Add "Developer Readiness" exit criteria
- [ ] Add "Performance Baseline" exit criteria (Task 1.4.11)
- [ ] Phase 1.5 overlap sprint: retrospective + Phase 2 prep
- [ ] Phase 1.T tech debt sprint: refactoring + documentation
- [ ] Production support model finalized
- [ ] Feedback gate: 1-week family testing + feedback collection

### Phase 2 Preparation (Week 8–10)

- [ ] Parallelize Phase 2 sprints into streams
- [ ] Phase 2 team on-board using Phase 1.T documentation
- [ ] Define Phase 2 testing sprints (2.1.T, 2.2.T, etc.)
- [ ] Identify complex features for pairing (calendars, lists)

### Phases 2–5 (Weeks 10–56)

- [ ] Apply same patterns as Phase 1 to all phases:
  - Testing in every sprint
  - Tech debt sprints (N.T)
  - Overlap sprints (N.5)
  - Feedback gates
  - Performance validation
  - Security reviews
- [ ] Monthly dependency audits + regression testing
- [ ] Document decisions in ADRs (1 per major choice)

---

## Summary: Why These Changes Matter

### 1. **Continuity**
- Phase N.5 overlap sprints preserve knowledge across phases
- Phase N.T tech debt sprints prevent rework
- ADRs keep architectural reasoning alive

### 2. **Efficiency**
- Parallel sprint streams reduce timeline by 20%
- Testing in every sprint eliminates Phase 1.4 bottleneck
- API contract upfront eliminates integration rework

### 3. **Quality**
- 80%+ test coverage prevents bugs
- Security reviews before each phase release
- Performance validation every phase (not just Phase 3)

### 4. **Team Health**
- Pairing strategy prevents knowledge silos
- Clear documentation reduces onboarding from 2 days to 30 min
- Feedback gates keep family engaged and validate assumptions

### 5. **Risk Mitigation**
- Parallelization provides schedule buffer
- Tech debt sprints catch issues early
- Production support model handles Phase 1→2 transition cleanly

---

## Conclusion

The implementation plan is ambitious but achievable. **These 20 recommendations** take it from good to great by:
1. **Connecting phases** (overlap sprints, knowledge transfer)
2. **Integrating testing** (every sprint, not just Phase 1.4)
3. **Parallelizing work** (reduce 56 weeks → 49 weeks)
4. **Tracking debt** (prevent rework)
5. **Validating assumptions** (user feedback, performance baselines)

**Effort to implement:** ~30 days of planning + process changes over 56 weeks.
**Payoff:** 15–20 fewer days of rework, 20% faster delivery, lower risk.

---

*This integrated review was generated April 23, 2026 by Claude Code.*
*Combines: Phase Efficiency Review + Testing Strategy Audit.*
