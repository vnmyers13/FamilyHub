# FamilyHub Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) for versions v1.0.0 onwards.

## [Unreleased]

### Added
- N/A

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

---

## [1.02] - 2026-04-30

### Security Hardening (Code Review Fixes)

### Added
- `field_validator` on `secret_key` rejecting empty/default/"changeme" values
- `validate_default=True` in Pydantic Settings model config
- Connection pool limits: `pool_size=5`, `max_overflow=10`, `pool_timeout=30`, `pool_recycle=1800`
- Security headers on nginx: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`
- Security headers on Caddy: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`
- Gzip compression on nginx for JS/CSS/JSON/XML/SVG
- Rate limiting on Caddy: 20 requests/minute for `/api/*` paths
- Network segmentation: `frontend` and `backend` Docker networks
- Resource limits on all compose services (CPU + memory limits and reservations)
- `depends_on` with health conditions (Caddy waits for healthy API)
- `.dockerignore` files (root, backend, frontend) preventing secrets/cache in build layers
- `backend/requirements-dev.txt` for test/dev dependency separation
- `pip-audit` and `ruff` in dev dependencies
- 4 new config security tests (total 7 tests)
- Pytest `client` fixture for reusable test client
- `CODE_REVIEW.md` documenting all findings and fixes
- `MEMORY.md` project context file for AI-assisted development

### Changed
- Backend Dockerfile: non-root `appuser` with proper data directory ownership
- Frontend Dockerfile: non-root `nginx` user with proper permissions
- `aiosmtpd` moved from production to dev dependencies (commented in prod)
- `pytest` and `pytest-asyncio` removed from production `requirements.txt`
- Version bumped to 1.02 across all files
- `SOLO_DEV_ROADMAP.md` updated: Python venv added to Sprint 1.2 scope

### Security
- Containers no longer run as root (least-privilege principle)
- Secret key enforced at startup (no default fallback)
- Build contexts exclude `.env`, `__pycache__`, `.git`, and data directories
- Frontend cannot reach backend directly (network isolation)
- HSTS enabled via Caddy (max-age=31536000)
- Permissions-Policy disables geolocation, microphone, and camera

### Testing
- 7/7 tests passing (3 endpoint + 4 config security)
- Test coverage expanded to verify security enforcement

---

## [1.01] - 2026-04-30

### Sprint 1.1: Dockerized Infrastructure Scaffold (COMPLETE)

### Added
- Docker Compose stack with 3 services:
  - `api` — FastAPI backend (Python 3.12 Alpine)
  - `web` — nginx frontend server (nginx Alpine)
  - `caddy` — HTTPS reverse proxy (Caddy 2 Alpine)
- FastAPI application with lifespan lifecycle (startup/shutdown events)
- Auto-running Alembic migrations on container startup
- Health check endpoint (`GET /api/health`)
- Root endpoint (`GET /`) returning API info
- CORS middleware with configurable origins
- SQLAlchemy async database engine + session management
- Pydantic v2 Settings with full environment variable configuration
- Alembic migration scaffolding (env.py, script.py.mako, alembic.ini)
- pytest configuration (pytest.ini) with asyncio_mode=auto
- 3 smoke tests verifying health endpoint and root endpoint
- `.env` file generation from `.env.example` with auto-generated SECRET_KEY
- Volume mounts for persistent data (`./data:/data`)
- Docker healthcheck for API service (curl-based, 30s interval)
- Data directories: `/data/db`, `/data/photos`, `/data/backups`

### Changed
- Updated `.gitignore` to exclude `.env`, `__pycache__`, `.pytest_cache`, `data/`, `node_modules/`
- Migrated Pydantic Settings from deprecated `class Config` to `model_config = SettingsConfigDict()`
- Switched API base image from `python:3.12-slim` (Debian) to `python:3.12-alpine` for reduced attack surface

### Security
- All Docker base images use Alpine Linux (minimal attack surface)
- `.env` file excluded from version control
- SECRET_KEY auto-generated with 512-bit random key

### Testing
- 3/3 smoke tests passing (0.12s)
- Test coverage: health endpoint (200 status, JSON content-type), root endpoint (200 status)

### Infrastructure
- API image size: ~285MB
- Web image size: ~92MB
- Caddy image: ~55MB (shared from Docker Hub)

---

## [1.00] - 2026-04-29
### Initial Project Setup
- Initial project setup with documentation and configuration
- Comprehensive implementation plan covering 5 development phases
- Release protocol for version management and deployment
- GitHub Actions CI/CD pipeline structure
- Docker and Docker Compose configuration planning
- Environment variable template (.env.example)
- Solo developer roadmap (~50-week timeline)
- Requirements plan and testing strategy

### Security
- Environment files (.env) excluded from version control
- VAPID and OAuth credentials documented in .env.example with placeholder values

---

## [v1] - Planned (Q2-Q3 2026)
### Foundation Phase
- FastAPI backend scaffolding ✅ (Sprint 1.1 complete)
- React + TypeScript frontend setup (pending)
- SQLite database initialization ✅ (Sprint 1.1 complete)
- Docker Compose stack deployment ✅ (Sprint 1.1 complete)
- Google Calendar OAuth integration (Sprint 1.3)
- Wall display component (Sprint 1.4)
- Task management system (Sprint 1.4)
- PWA support (Sprint 1.5)

---

## Release Checklist

Before creating a release, ensure:
- [x] All tests pass locally
- [x] Documentation is updated
- [x] VERSION file is bumped
- [x] Dockerfiles are updated
- [x] `.env.example` is current
- [x] CHANGELOG.md is updated
- [ ] Git commit and tag are created
- [ ] Docker images are built and pushed
- [ ] GitHub release is created
