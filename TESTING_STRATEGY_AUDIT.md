# FamilyHub Testing Strategy Audit

**Date:** April 23, 2026  
**Reviewed by:** Claude Code  
**Status:** Issues found — Recommendations provided

---

## Executive Summary

The implementation plan includes testing tasks, but they are **under-specified and unevenly distributed**. 

**Key Issues:**
1. ❌ Testing is **back-loaded** (mostly Phase 1 only; phases 2–5 lack dedicated test tasks)
2. ❌ **No unit test requirements** specified for most feature tasks
3. ❌ **Limited integration test scope** (smoke tests only in Sprint 1.1)
4. ❌ **Performance testing deferred** to Phase 3 Sprint 3.6 (weeks 28–30)
5. ❌ **Database migration testing** mentioned in cross-cutting but not systematic per phase
6. ❌ **Security testing is vague** ("before each phase release" with no concrete tasks)
7. ❌ **No e2e/browser testing** documented
8. ⚠️ **Pi hardware testing is critical but deferred** to "end of every phase"

---

## Current Testing Coverage by Phase

### Phase 1 (Weeks 1–8)
| Sprint | Testing Tasks | Notes |
|--------|---------------|-------|
| 1.1 | `[TEST]` Smoke test setup (health endpoint only) | ✅ Present but minimal |
| 1.2 | None | ❌ Auth endpoints tested manually only |
| 1.3 | None | ❌ Calendar/tasks tested manually only |
| 1.4 | `[TEST]` Integration test suite | ✅ Present but sparse (4 test files mentioned) |

**Test Files Referenced (Task 1.4.10):**
- `tests/test_auth.py`
- `tests/test_calendar.py`
- `tests/test_tasks.py`
- `tests/test_photos.py`
- Manual test checklist

### Phase 2 (Weeks 8–18)
| Sprint | Testing Tasks | Notes |
|--------|---------------|-------|
| 2.1–2.4 | None | ❌ No automated tests specified |
| 2.5 | Manual checklist (Task 2.5.2) | ❌ Manual only, no automated tests |

### Phase 3 (Weeks 18–30)
| Sprint | Testing Tasks | Notes |
|--------|---------------|-------|
| 3.1–3.5 | None | ❌ No automated tests specified |
| 3.6 | `[TEST]` Performance profiling | ✅ Performance testing, but no unit/integration tests |

### Phase 4–5 (Weeks 30–56)
| Sprint | Testing Tasks | Notes |
|--------|---------------|-------|
| All | None | ❌ No testing tasks at all |

---

## Detailed Issues & Recommendations

### Issue 1: Back-Loaded Testing

**Current State:**
- Only Sprint 1.1 and 1.4 have explicit `[TEST]` tasks
- Phases 2–5 have no dedicated testing sprints
- Manual test checklists exist but no automated test requirements

**Risk:** 
- Bugs discovered late → expensive to fix
- Regressions introduced in later phases
- No safety net for refactoring

**Recommendation:**
Add a `[TEST]` task to each sprint that covers:
```
Sprint N.X.Y [TEST] — Unit + Integration Tests for [Sprint Goal]

What to test:
- Unit tests for all new services/utils (target: 80%+ coverage)
- Integration tests for new API endpoints (mocked external services)
- Database migration upgrade + downgrade
- One manual smoke test on Pi hardware (if INFRA work done)

Test files to create/update:
- tests/test_[module].py
- frontend/src/__tests__/[component].test.tsx

AC:
- pytest: all tests pass, 80%+ coverage reported
- npm test: all tests pass, no console errors
- CI runs tests on every push
```

**Timeline:**
- **Phase 1**: Already planned (Tasks 1.1.6, 1.4.10) ✅
- **Phase 2**: Add `[TEST]` task to Sprint 2.5 → "Phase 2 Integration Tests"
- **Phase 3**: Add `[TEST]` task to Sprint 3.6 → "Phase 3 Integration Tests" 
- **Phase 4**: Add `[TEST]` task to Sprint 4.7 → "Phase 4 Integration Tests"
- **Phase 5**: Add `[TEST]` task to Sprint 5.6 → "Phase 5 Integration Tests"

---

### Issue 2: No Unit Test Requirements in Feature Tasks

**Current State:**
Example from Task 1.3.3 (Google Calendar OAuth):
```
AC:
- Admin can initiate Google OAuth flow from the UI
- After callback, Google Calendar events appear in `calendar_events` table
- Background job runs every 15 min and imports new events
- Sync errors are stored and don't stop other sources from syncing
```

No mention of unit tests for:
- `backend/app/integrations/google_calendar.py` functions
- Token encryption/decryption logic
- Error handling in sync job

**Risk:**
- Utility functions untested
- Bugs in core business logic (encryption, sync) discovered too late
- No confidence in refactoring

**Recommendation:**
Update **every** `[BE]` feature task to include test AC:

```markdown
**AC (original):**
- [existing acceptance criteria]

**AC (NEW — Testing):**
- Unit tests for all service functions with 80%+ line coverage
- Mock external dependencies (Google API, database) using pytest fixtures
- Test both happy path and error scenarios (auth failure, network timeout, malformed response)
- All tests pass: `pytest tests/test_[module].py -v`
- Coverage report generated: `pytest --cov=app --cov-report=html`
```

**Apply to these high-risk modules:**
- `integrations/` (Google, Microsoft, Apple, iCal, weather)
- `services/` (calendar, tasks, photos, lists, rewards, etc.)
- `core/` (security, encryption, database)
- `jobs/` (sync, backup, overdue detection)

---

### Issue 3: Limited Integration Test Scope

**Current State:**
Task 1.4.10 lists 4 test files but gives **no details**:
```
What to build:
- tests/test_auth.py: setup flow, login (password + PIN), rate limiting, session validation
- tests/test_calendar.py: event CRUD, recurrence expansion, date range query
- tests/test_tasks.py: task CRUD, complete task (with + without photo), verify/reject, overdue job
- tests/test_photos.py: upload, thumbnail generation, album management
```

No mention of:
- ✅ Test count expectations
- ✅ Database state management (fixtures, transactions)
- ✅ Coverage targets
- ✅ Failure modes (rate limit, invalid input, concurrent requests)
- ✅ Cross-module integration (e.g., calendar + tasks together)

**Risk:**
- Test quality is vague
- Could have 1 test per module or 100
- No coverage targets

**Recommendation:**
Expand Task 1.4.10 to specify:

```markdown
Task 1.4.10 [TEST] — Phase 1 Integration Test Suite

What to build:
- backend/tests/test_auth.py
  - 12+ tests: setup flow, password/PIN login, rate limiting (5 attempts → 429)
  - Session validation, token expiry, role-based endpoint access
  - Coverage target: 90%+

- backend/tests/test_calendar.py
  - 15+ tests: event CRUD, recurrence expansion, date range queries
  - All-day event handling, timezone conversion, concurrent updates
  - Coverage target: 85%+

- backend/tests/test_tasks.py
  - 18+ tests: task CRUD, completion (with/without photo), verify/reject, overdue job
  - Subtask roll-up, recurrence generation, permission checks
  - Coverage target: 85%+

- backend/tests/test_photos.py
  - 10+ tests: upload, HEIC conversion, thumbnail generation, album ops
  - Coverage target: 80%+

- frontend/__tests__/pages/Calendar.test.tsx
  - 8+ tests: render all views (month/week/day/agenda), event filtering, drag-to-reschedule
  - Coverage target: 75%+

- frontend/__tests__/pages/Tasks.test.tsx
  - 10+ tests: task list, completion UI, verification flow, Kanban board
  - Coverage target: 75%+

AC:
- pytest: 80%+ overall coverage, all tests pass
- npm test: all frontend tests pass, 70%+ coverage
- CI reports coverage; warns if coverage drops
- Manual test checklist (existing in plan) runs on Pi hardware
```

---

### Issue 4: Performance Testing Too Late (Phase 3 Sprint 3.6)

**Current State:**
Task 3.6.1 is in **week 28–30**, but performance issues should be caught earlier:
- By week 8 (Phase 1 end): Wall display must load in < 3s on Pi
- By week 18 (Phase 2 end): API response times should be < 500ms

**Risk:**
- Architectural issues discovered at week 28 → costly refactoring
- Phase 1 exit criteria says "loads in under 3 seconds on Pi" but there's no task to validate this until Phase 3

**Recommendation:**
Add performance validation **to each phase exit criteria**:

**Phase 1 (Sprint 1.4):**
Add a task:
```markdown
Task 1.4.11 [TEST] — Phase 1 Performance Baseline (Pi Hardware)

What to test:
- Dashboard load time: < 3 seconds (first paint)
- GET /api/calendar/events: < 200ms (response time)
- Wall display clock update: 60fps (smooth scrolling)
- Memory per container: api < 150MB, web < 100MB, caddy < 50MB

Equipment: Raspberry Pi 4, 4GB RAM, actual Pi OS (not Docker Desktop)

AC:
- Dashboard fully renders in < 3s
- All API endpoints respond in < 500ms (p95)
- Memory stable after 1 hour continuous use
- Document baseline metrics in README.md
```

**Phase 2 (Sprint 2.5):**
```markdown
Task 2.5.3 [TEST] — Phase 2 Performance Validation

What to test:
- Same baseline tests from Phase 1
- Multi-user load test: 3 concurrent users, measure API response times
- Wall display with 50+ events: clock/events still smooth
- Sync job impact: CPU spike during calendar sync (should be < 80%)

AC:
- All benchmarks from Phase 1 still pass
- p95 API response time: < 500ms under 3-user load
- Memory increase < 30MB under load
- Sync job completes in < 5 minutes
```

---

### Issue 5: Database Migration Testing Is Vague

**Current State:**
Mentioned in cross-cutting:
```
- **Migration rollback test:** Every Alembic migration must be tested 
  both `upgrade` and `downgrade` before merging
```

But **no concrete task** for each phase. How is this tested?

**Risk:**
- Downgrade tests forgotten
- Migration errors discovered in production

**Recommendation:**
Add to **each migration task** AC:

```markdown
**AC (existing migration-specific):**
- Migration runs cleanly against an empty database
- Tables/columns created correctly
- Foreign keys are correct

**AC (NEW — Migration Testing):**
- `alembic upgrade +1` completes without error
- `alembic downgrade -1` rolls back completely
- Database state pre and post downgrade is identical
- Migration handles concurrent reads (no table locks > 5s on prod schema size)
- Test file: tests/test_migrations.py includes upgrade/downgrade cycle
```

---

### Issue 6: E2E Testing Not Mentioned

**Current State:**
No mention of end-to-end tests (e.g., Playwright, Cypress):
- "Create task on phone, complete on wall, verify sync" 
- "Upload photo → sync to Google Photos → verify"
- "Login on 2 devices, complete task simultaneously, check race condition"

**Risk:**
- Multi-device interactions untested
- Real-world user flows may break

**Recommendation:**
Add an e2e test task to **Phase 2 Sprint 2.5** (after major features are in):

```markdown
Task 2.5.4 [TEST] — E2E Test Suite (Playwright)

What to test:
- User flows across devices:
  - Login on phone, create task, refresh on tablet, verify sync
  - Complete task on wall, check notification on phone
  - Edit event on desktop, verify on wall within 5 seconds
- Photo upload → album → slideshow flow
- Concurrent writes: 2 users editing same task (race condition check)
- Offline resilience: complete task offline, verify sync when back online

Technology: Playwright (cross-browser, headless)

AC:
- 8+ e2e test scenarios pass in CI
- All critical user flows covered
- Tests run in < 5 minutes
```

---

### Issue 7: Security Testing Is Vague

**Current State:**
Cross-cutting: "Security review: Before each phase release, review new API endpoints for missing auth checks..."

**No concrete task**, just a guideline.

**Risk:**
- Security reviews skipped under deadline pressure
- Vulnerabilities slip through

**Recommendation:**
Add a formal security task to each phase:

```markdown
Sprint N.7 (or 4.6 for Phase 4) [TEST] — Security Review & Audit

What to test:
- Authentication: verify `require_auth` on all non-public endpoints
- Authorization: role checks (admin/co-admin endpoints reject teen users)
- Input validation: SQL injection, XSS, path traversal (use OWASP Top 10)
- Secrets: no API keys in code, all env vars in `.env.example` only
- CORS: origin whitelist correct, no `*` except in dev
- Rate limiting: login, PIN attempts, API endpoints (if added)
- Data exposure: verify soft-deletes work, no leaked user data

Tools:
- Backend: `bandit` (security linter), manual review of routes
- Frontend: React DevTools for XSS, manual OWASP checklist
- Database: check encryption (passwords, credentials)

AC:
- Security checklist: all items pass
- Bandit report: 0 critical issues
- Code review: 2 reviewers sign-off on security before merge
```

---

### Issue 8: Pi Hardware Testing Deferred to "End of Phase"

**Current State:**
Cross-cutting: "At the end of every phase, run the full application on actual Raspberry Pi 4..."

**Too vague**. Which Pi? How many hours of testing?

**Risk:**
- "End of phase" = last day before release = no time to fix issues
- Docker Desktop != Pi hardware (performance, memory, ARM compatibility)

**Recommendation:**
Systematize Pi testing as part of **each phase exit criteria**:

```markdown
## Phase N Exit Checklist — Pi Hardware Validation

**Hardware Setup:**
- Raspberry Pi 4, 4GB RAM, 64GB SD card (performance baseline)
- Raspberry Pi 4, 2GB RAM (minimum spec test)
- Real WiFi network (not localhost)

**Duration:** 4 hours per phase end

**Test Checklist:**
- [ ] docker compose up from clean SD card → all containers start within 3 min
- [ ] Web UI loads and is responsive
- [ ] Background jobs run on schedule (sync, backup)
- [ ] Memory usage stable after 2 hours
- [ ] CPU doesn't spike above 80% during normal use
- [ ] Wall display refresh rate is smooth (no lag)
- [ ] All manual test scenarios pass
- [ ] Document any issues as GitHub issues (with hardware config)

**Pass Criteria:**
- All checklist items pass on 4GB Pi
- No blocking issues on 2GB Pi (log any warnings)
- Measurable metrics: memory, CPU, response times
```

---

### Issue 9: No Frontend Unit Test Framework Specified

**Current State:**
Frontend tests mentioned but **no framework** specified:
- Vitest? Jest? React Testing Library?
- How are components mocked?
- What about TanStack Query mocking?

**Risk:**
- Developers use different approaches
- Tests are inconsistent or unmaintainable

**Recommendation:**
Add to **Task 1.1.4** (Frontend skeleton):

```markdown
Task 1.1.4 [FE] *BLOCKER* — React/Vite/TypeScript frontend skeleton

**Updated AC:**
- `npm run dev` starts without errors
- `npm run build` produces a `dist/` folder
- `npm test` runs tests (zero tests initially, but framework configured)
  - Framework: Vitest + React Testing Library
  - Mock setup: `vitest.config.ts` configured
  - TanStack Query: `createWrapper` helper for test QueryClient setup
  - Example test: `src/__tests__/pages/Login.test.tsx` (placeholder)
- Chrome DevTools → Application → Manifest shows the PWA manifest
- "Install app" prompt appears in Chrome on desktop
```

---

### Issue 10: Dependency Update Schedule Not Tied to Testing

**Current State:**
Cross-cutting: "Monthly `pip-audit` and `npm audit` run; patch critical CVEs within one week"

**No mention of** regression testing after updates.

**Risk:**
- Security patches introduce regressions

**Recommendation:**
Add a recurring task in CLAUDE.md:

```markdown
## Recurring: Monthly Dependency Updates & Testing

**Schedule:** First Monday of every month

**Process:**
1. Run `pip-audit` and `npm audit` locally
2. If no critical issues: done for the month
3. If critical CVEs:
   a. Update package(s): `pip install --upgrade X` / `npm update X`
   b. Run full test suite: `pytest && npm test`
   c. Manual smoke test on Pi (wall display, login, task completion)
   d. If all pass: merge to main with message "chore: security patch X"
   e. If tests fail: revert and file issue with maintainers

**Timeline:** Complete within 7 days of detection
```

---

## Summary of Recommendations

| Issue | Sprint to Fix | Type | Effort |
|-------|---------------|------|--------|
| Add `[TEST]` to Phase 2 Sprint 2.5 | 2.5 | New sprint task | 1 sprint |
| Add `[TEST]` to Phase 3 Sprint 3.6 | 3.6 | Expand existing | + 2 days |
| Add `[TEST]` to Phase 4 Sprint 4.7 | 4.7 | New sprint task | 1 sprint |
| Add `[TEST]` to Phase 5 Sprint 5.6 | 5.6 | New sprint task | 1 sprint |
| Specify unit test AC in all `[BE]` feature tasks | 1.1+ | Update templates | 30 min |
| Expand Task 1.4.10 with test count targets | 1.4 | Expand existing task | 2 hours |
| Add performance validation to Phase 1 exit criteria | 1.4 | New task (1.4.11) | 3 days |
| Add performance validation to Phase 2 exit criteria | 2.5 | New task (2.5.3) | 2 days |
| Add e2e test task (Playwright) | 2.5 | New task (2.5.4) | 1 sprint |
| Add security review task to each phase | 1.7, 2.7, 3.7, 4.6, 5.6 | New sprint task | 1 sprint (once) |
| Formalize Pi hardware testing in phase exit checklist | Each phase | Update exit criteria | 30 min |
| Specify frontend test framework and setup | 1.1.4 | Update AC | 2 hours |
| Add monthly dependency + regression testing routine | CLAUDE.md | New recurring task | 1 hour setup |

---

## Recommended Action Plan

**Immediate (Before Phase 1 Sprint 1.2):**
1. ✏️ Update Task 1.4.10 with specific test counts and coverage targets
2. ✏️ Add unit test AC template to all `[BE]` feature tasks
3. ✏️ Specify Vitest + React Testing Library in Task 1.1.4

**Before Phase 2 Begins (Week 8):**
1. ✏️ Add Task 2.5.3: Phase 2 Performance Validation
2. ✏️ Add Task 2.5.4: E2E Test Suite (Playwright)
3. ✏️ Add security review task (2.7 or part of 2.5)

**Before Phase 3 Begins (Week 18):**
1. ✏️ Add Phase 3 exit criteria with Pi hardware checklist
2. ✏️ Add Task 3.6.1 improvements: not just performance, include regression tests

**Ongoing:**
1. ✏️ Update CLAUDE.md with monthly dependency update routine
2. ✏️ Create testing.md: "Developer Guide to Writing Tests"

---

## Files to Update

1. **FamilyHub_Implementation_Plan_v1.0.md**
   - Add Task 1.4.11 (Phase 1 performance)
   - Expand Task 1.4.10 (test counts)
   - Add Task 2.5.3 (Phase 2 performance)
   - Add Task 2.5.4 (E2E tests)
   - Add security review tasks to each phase
   - Update Phase 3–5 to include `[TEST]` tasks

2. **.claude/CLAUDE.md**
   - Add "Unit Test Requirements Template"
   - Add "Monthly Dependency Update & Regression Testing" routine

3. **Create new:** `TESTING.md`
   - Developer guide to writing tests
   - Fixtures and mocking strategies
   - Coverage expectations per module

---

*This audit was generated April 23, 2026 by Claude Code.*
