# FamilyHub Testing Guide

**Version:** 1.0
**Status:** Initial Release
**Date:** April 29, 2026
**Target:** Solo developer, all 5 phases

---

## Version History

| Version | Date | Changes |
|---|---|---|
| **1.0** | 2026-04-29 | Initial testing strategy document. Covers backend (pytest), frontend (Vitest+RTL), E2E (Playwright), migration testing, performance baselines, security checklists, Pi hardware validation, and monthly dependency updates. |

---

## Table of Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [Backend Testing](#2-backend-testing)
3. [Frontend Testing](#3-frontend-testing)
4. [E2E Testing](#4-e2e-testing)
5. [Migration Testing](#5-migration-testing)
6. [Performance Testing](#6-performance-testing)
7. [Security Testing](#7-security-testing)
8. [Pi Hardware Validation](#8-pi-hardware-validation)
9. [Coverage Targets](#9-coverage-targets)
10. [Monthly Dependency Updates](#10-monthly-dependency-updates)

---

## 1. Testing Philosophy

- **Test before features:** Write tests for complex modules (OAuth, encryption, sync logic) before implementing them (TDD approach).
- **Every sprint has tests:** Each sprint includes unit + integration test tasks for the features built in that sprint.
- **Pi validation per phase:** Test on actual Raspberry Pi hardware at the end of each phase, not just in Docker Desktop.
- **Coverage matters but isn't everything:** Target 80%+ line coverage on backend, 70%+ on frontend. Focus on business logic, not boilerplate.

---

## 2. Backend Testing

### Framework

- **pytest** + **pytest-asyncio** for async test support
- **pytest-cov** for coverage reporting
- **httpx** for async test client against FastAPI
- **pytest-fixtures** for database state management

### Running Tests

```bash
# All tests
pytest

# With coverage
pytest --cov=app --cov-report=html

# Specific module
pytest tests/test_auth.py -v
```

### Fixtures & Database Strategy

- Use `TransactionRollbackFixture` pattern: wrap each test in a database transaction that rolls back after the test.
- For SQLite: use an in-memory test database (`sqlite:///:memory:`) with schema created via Alembic `upgrade("head")`.
- Mock all external services (Google Calendar, Microsoft Graph, CalDAV, weather API) using `pytest-mock` (`mocker.patch`).

### Test Organization

```
backend/tests/
  conftest.py              # shared fixtures (db session, test client, mock providers)
  test_auth.py             # login, PIN, JWT, rate limiting, session
  test_calendar.py         # event CRUD, recurrence, sync, conflicts
  test_tasks.py            # task CRUD, completion, verification, recurrence
  test_photos.py           # upload, thumbnail, albums
  test_lists.py            # templates, instances, shopping mode
  test_routines.py         # builder, runner, streaks
  test_meals.py            # planner, recipes, shopping list gen
  test_notifications.py    # push, in-app, email
  test_migrations.py       # upgrade/downgrade cycles
  test_security.py         # auth checks, role enforcement, input validation
  integrations/
    test_google_calendar.py   # Google API interaction (mocked)
    test_microsoft_calendar.py # MS Graph interaction (mocked)
    test_apple_caldav.py      # CalDAV interaction (mocked)
```

### Unit Test Requirements Template

Apply to every `[BE]` feature task:

```markdown
**AC (Testing):**
- Unit tests for all new service functions with 80%+ line coverage
- Mock external dependencies using pytest fixtures
- Test both happy path and error scenarios (auth failure, network timeout, malformed response)
- All tests pass: `pytest tests/test_[module].py -v`
```

### High-Risk Modules (require extra test coverage)

| Module | Coverage Target | Key Tests |
|--------|----------------|-----------|
| `integrations/` | 90%+ | OAuth flow, token refresh, error handling, rate limits |
| `core/security.py` | 95%+ | Encryption/decryption, JWT creation/validation, bcrypt |
| `services/calendar.py` | 85%+ | Sync logic, conflict detection, recurrence expansion |
| `services/tasks.py` | 85%+ | State transitions, verification flow, recurrence generation |
| `jobs/` | 80%+ | Sync jobs, backup jobs, overdue detection |

---

## 3. Frontend Testing

### Framework

- **Vitest** (matches Vite build toolchain, faster than Jest)
- **React Testing Library** (test user behavior, not implementation details)
- **@testing-library/user-event** for simulating user interactions

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Test Organization

```
frontend/src/__tests__/
  pages/
    Login.test.tsx
    Dashboard.test.tsx
    Calendar.test.tsx
    Tasks.test.tsx
    Wall.test.tsx
  components/
    TaskCard.test.tsx
    EventList.test.tsx
    PhotoSlideshow.test.tsx
  hooks/
    useAuth.test.ts
    useCalendar.test.ts
  utils/
    formatDate.test.ts
    recurrence.test.ts
```

### Mocking Strategy

- **TanStack Query:** Use `createWrapper` helper to provide a test `QueryClient` that mocks API responses.
- **API calls:** Mock `fetch` or use `msw` (Mock Service Worker) for realistic API mocking.
- **Browser APIs:** Mock `localStorage`, `navigator.onLine`, and `Notification` API as needed.

### Frontend Test Requirements Template

Apply to every `[FE]` feature task:

```markdown
**AC (Testing):**
- Component renders correctly with and without data
- User interactions (click, type, drag) produce expected state changes
- API calls are mocked; both success and error paths tested
- All tests pass: `npm test`
```

---

## 4. E2E Testing

### Framework

- **Playwright** (cross-browser, headless, fast, built-in test runner)

### Setup

```bash
npx playwright install
npx playwright test
```

### Key E2E Scenarios (Phase 2+)

```
e2e/
  auth.spec.ts          # login flow, PIN entry, session expiry
  tasks.spec.ts         # create task, complete task, verify task
  calendar.spec.ts      # create event, view switching, filtering
  photos.spec.ts        # upload photo, create album, slideshow
  wall.spec.ts          # wall display rendering, task completion on wall
  offline.spec.ts       # offline indicator, queued writes, sync on reconnect
```

### E2E Test Requirements

- 8+ critical user flow scenarios per phase
- Tests run in < 5 minutes in CI
- All critical flows covered before phase exit

---

## 5. Migration Testing

### Every Alembic Migration Must

```markdown
**AC (Migration Testing):**
- `alembic upgrade +1` completes without error
- `alembic downgrade -1` rolls back completely
- Database state pre- and post-downgrade is identical
- Test file: `tests/test_migrations.py` includes upgrade/downgrade cycle
```

### Test Implementation

```python
# tests/test_migrations.py
import pytest
from alembic.command import upgrade, downgrade
from alembic.config import Config

@pytest.mark.migrations
def test_migration_upgrade_downgrade():
    cfg = Config("alembic.ini")
    upgrade(cfg, "+1")
    # ... verify schema ...
    downgrade(cfg, "-1")
    # ... verify schema rolled back ...
```

---

## 6. Performance Testing

### Phase 1 Performance Baseline (Sprint 1.4)

| Metric | Target |
|--------|--------|
| Dashboard first paint | < 3 seconds on Pi 4 |
| GET /api/calendar/events | < 200ms |
| Wall display clock update | 60fps smooth scrolling |
| Memory per container | api < 150MB, web < 80MB, caddy < 30MB |

### Phase 2 Performance Validation (Sprint 2.5)

| Metric | Target |
|--------|--------|
| Phase 1 baselines still pass | Yes |
| p95 API response (3 concurrent users) | < 500ms |
| Memory increase under load | < 30MB |
| Sync job completes in | < 5 minutes |
| Sync job CPU spike | < 80% |

### How to Measure

```bash
# API response time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/calendar/events

# Memory per container
docker stats --no-stream

# Load testing (simple)
ab -n 100 -c 3 http://localhost:8000/api/calendar/events
```

---

## 7. Security Testing

### Per-Phase Security Checklist

```markdown
## Sprint N [TEST] — Security Review

- [ ] Authentication: verify `require_auth` on all non-public endpoints
- [ ] Authorization: role checks (admin/co-admin endpoints reject teen users)
- [ ] Input validation: SQL injection, XSS, path traversal (OWASP Top 10)
- [ ] Secrets: no API keys in code, all env vars in `.env.example` only
- [ ] CORS: origin whitelist correct, no `*` except in dev
- [ ] Rate limiting: login, PIN attempts, API endpoints
- [ ] Data exposure: verify soft-deletes work, no leaked user data
- [ ] Bandit scan: `bandit -r backend/app` — 0 critical issues
```

---

## 8. Pi Hardware Validation

### Per-Phase Exit Checklist

**Hardware:** Raspberry Pi 4, 4GB RAM, 64GB SD card
**Duration:** 4 hours per phase end

```markdown
- [ ] docker compose up from clean SD card → all containers start within 3 min
- [ ] Web UI loads and is responsive
- [ ] Background jobs run on schedule (sync, backup)
- [ ] Memory usage stable after 2 hours
- [ ] CPU doesn't spike above 80% during normal use
- [ ] Wall display refresh rate is smooth (no lag)
- [ ] All manual test scenarios pass
- [ ] Document any issues as GitHub issues (with hardware config)
```

**Pass Criteria:** All items pass on 4GB Pi. No blocking issues on 2GB Pi (log warnings).

---

## 9. Coverage Targets

| Module Type | Target | Tool |
|-------------|--------|------|
| Backend business logic | 85%+ | pytest-cov |
| Backend integrations | 90%+ | pytest-cov (mocked) |
| Backend security/crypto | 95%+ | pytest-cov |
| Backend jobs/schedulers | 80%+ | pytest-cov |
| Frontend pages | 70%+ | Vitest coverage |
| Frontend components | 75%+ | Vitest coverage |
| Frontend utilities | 85%+ | Vitest coverage |
| E2E critical flows | 100% of phase features | Playwright |

---

## 10. Monthly Dependency Updates

### Schedule: First Monday of Every Month

```markdown
## Process

1. Run `pip-audit` and `npm audit` locally
2. If no critical issues: done for the month
3. If critical CVEs:
   a. Update package(s)
   b. Run full test suite: `pytest && npm test`
   c. Manual smoke test (wall display, login, task completion)
   d. If all pass: commit with message "chore: security patch X"
   e. If tests fail: revert and file issue with maintainers
4. Complete within 7 days of detection
```

---

*Updated: April 2026*
