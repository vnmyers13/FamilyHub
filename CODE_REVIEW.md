# Code Review Report — FamilyHub v1.01

**Date:** April 30, 2026
**Scope:** Full codebase security + efficiency audit
**Reviewer:** AI Code Review

---

## Executive Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 3 | ✅ Fixed |
| High | 4 | ✅ Fixed |
| Medium | 5 | ✅ Fixed |
| Low | 3 | 📋 Deferred to Sprint 1.2 |

---

## Changes Applied

### CRITICAL — Security

#### 1. Hardcoded default secret key (`backend/app/core/config.py`)
**Before:** `secret_key: str = "default-change-in-production"` — if `.env` is missing, JWT/signature forgery is possible.
**Fix:** Replaced with empty default + `field_validator` that rejects empty strings, default values, and "changeme". Added `validate_default=True` to model config.
**Impact:** App now refuses to start without a real secret key.

#### 2. Containers running as root (`backend/Dockerfile`, `frontend/Dockerfile`)
**Before:** No `USER` directive — all containers ran as root, violating least-privilege.
**Fix:** Added non-root `appuser` (backend) and `nginx` user (frontend) with proper ownership.
**Impact:** Container escape exploits have reduced blast radius.

#### 3. No `.dockerignore` files
**Before:** Build contexts could include `.git`, `__pycache__`, `.env`, and secrets.
**Fix:** Created `.dockerignore`, `backend/.dockerignore`, and `frontend/.dockerignore`.
**Impact:** Smaller images, no secret leakage into build layers.

---

### HIGH — Security

#### 4. No connection pool limits (`backend/app/core/database.py`)
**Before:** `create_async_engine` called with no pool configuration — risk of connection exhaustion.
**Fix:** Added `pool_size=5`, `max_overflow=10`, `pool_timeout=30`, `pool_recycle=1800`.
**Impact:** Prevents runaway connections under load.

#### 5. No security headers (`frontend/nginx.conf`, `config/Caddyfile`)
**Before:** Missing `X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `Referrer-Policy`, `Permissions-Policy`.
**Fix:** Added full security header suite to both nginx and Caddy.
**Impact:** Mitigates clickjacking, MIME-sniffing, and unauthorized device access.

#### 6. No network segmentation (`docker-compose.yml`)
**Before:** All services shared the default bridge network.
**Fix:** Created `frontend` and `backend` networks; `web` only on `frontend`, `api` on both, `caddy` on both.
**Impact:** Frontend cannot reach backend directly; only through Caddy reverse proxy.

#### 7. No resource limits (`docker-compose.yml`)
**Before:** No CPU/memory constraints — a memory leak could crash the host.
**Fix:** Added `deploy.resources.limits` and `reservations` for all services.
**Impact:** Single container cannot starve others.

---

### MEDIUM — Efficiency

#### 8. Test deps in production (`backend/requirements.txt`)
**Before:** `pytest`, `pytest-asyncio`, `aiosmtpd` bundled with production deps.
**Fix:** Moved to new `backend/requirements-dev.txt`; commented out `aiosmtpd` in prod.
**Impact:** Smaller production image, reduced attack surface.

#### 9. No gzip compression (`frontend/nginx.conf`)
**Before:** Static assets served uncompressed.
**Fix:** Enabled gzip with appropriate MIME types and 256-byte minimum.
**Impact:** ~60-80% reduction in transferred JS/CSS size.

#### 10. No rate limiting (`config/Caddyfile`)
**Before:** API endpoints had no request throttling.
**Fix:** Added `rate_limit @api 20 1m` for `/api/*` paths.
**Impact:** Slows brute-force and DoS attempts.

---

### LOW — Best Practices

#### 11. Limited test coverage (`backend/tests/test_smoke.py`)
**Before:** Only 3 tests, no fixtures, no config validation.
**Fix:** Added pytest fixture for client reuse, 4 new config security tests (7 total).
**Impact:** Tests verify security enforcement, not just HTTP 200.

#### 12. No depends_on health conditions (`docker-compose.yml`)
**Before:** Caddy could start before API is healthy.
**Fix:** Added `depends_on` with `service_healthy` for API, `service_started` for web.
**Impact:** Proper startup ordering.

#### 13. No dependency audit tooling
**Before:** No mechanism to detect CVEs in dependencies.
**Fix:** Added `pip-audit` to `requirements-dev.txt`.
**Impact:** Future sprints can run `pip-audit` monthly per roadmap.

---

## Deferred to Sprint 1.2

| Item | Reason |
|------|--------|
| Establish Python venv | Roadmap updated; Sprint 1.2 includes this task |
| `argon2-cffi` migration from `passlib` | Requires auth module to exist first |
| Supply-chain hash pinning (`--hash`) | Requires lockfile strategy decision |
| Content-Security-Policy header | Requires knowing all script/image sources first |
| `read_only: true` root filesystem | Requires identifying all writable paths |

---

## Files Modified

| File | Change |
|------|--------|
| `backend/app/core/config.py` | Secret key validator, `validate_default=True` |
| `backend/app/core/database.py` | Connection pool limits |
| `backend/Dockerfile` | Non-root user |
| `frontend/Dockerfile` | Non-root user |
| `frontend/nginx.conf` | Security headers, gzip |
| `config/Caddyfile` | Security headers, rate limiting, HSTS |
| `docker-compose.yml` | Networks, resource limits, depends_on |
| `backend/requirements.txt` | Removed test deps |
| `backend/requirements-dev.txt` | **New** — dev/test deps |
| `backend/tests/test_smoke.py` | Fixtures, config security tests |
| `.dockerignore` | **New** — root dockerignore |
| `backend/.dockerignore` | **New** — backend dockerignore |
| `frontend/.dockerignore` | **New** — frontend dockerignore |
| `SOLO_DEV_ROADMAP.md` | Added venv to Sprint 1.2 |

---

## Recommendations for Next Sprint

1. **Run `pip-audit`** after establishing venv to baseline dependency CVEs
2. **Add Content-Security-Policy** once frontend asset pipeline is known
3. **Enable `read_only: true`** on compose services after identifying writable paths
4. **Consider `pip-tools` or `uv`** for lockfile generation and reproducible builds
5. **Add structured logging** (JSON format) for better observability in production
