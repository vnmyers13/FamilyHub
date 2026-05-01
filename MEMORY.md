# FamilyHub Project Memory File
# Purpose: Persistent context for AI-assisted development
# Last Updated: 2026-04-30

## PROJECT OVERVIEW
- **Name:** FamilyHub
- **Version:** 1.02
- **Description:** Self-hosted family organizational hub running on Raspberry Pi
- **Stack:** FastAPI (backend) + React/Vite (frontend) + Caddy (reverse proxy) + SQLite (database)
- **Repo:** https://github.com/vnmyers13/FamilyHub.git
- **Target Platform:** Raspberry Pi (Alpine-based Docker containers)
- **Current Sprint:** Sprint 1.1 complete + security hardening, heading into Sprint 1.2

## ARCHITECTURE
```
Caddy (HTTPS, ports 80/443)
  ├── /api/* → FastAPI backend (port 8000)
  ├── /photos/* → FastAPI backend (port 8000)
  └── /* → nginx frontend (port 3000)
```

### Services (docker-compose)
- **api** (familyhub-api): Python 3.12 Alpine, FastAPI + Uvicorn, SQLite at /data/db/familyhub.db
- **web** (familyhub-web): nginx Alpine, serves React SPA on port 3000
- **caddy** (familyhub-caddy): Caddy 2 Alpine, HTTPS via internal CA

### Networks
- **frontend**: web + caddy (nginx visible only to Caddy)
- **backend**: api + caddy (API visible to Caddy)

### Data Volumes
- `./data/db` - SQLite database
- `./data/photos` - Family photos
- `./data/backups` - Database backups
- `caddy_data` - TLS certs
- `caddy_config` - Caddy config

## KEY FILES
| File | Purpose |
|------|---------|
| `backend/app/core/config.py` | Pydantic Settings (all env config) |
| `backend/app/core/database.py` | SQLAlchemy async engine + session |
| `backend/app/main.py` | FastAPI app, lifespan, CORS |
| `backend/requirements.txt` | Production Python deps |
| `backend/requirements-dev.txt` | Dev/test Python deps |
| `docker-compose.yml` | Service orchestration |
| `config/Caddyfile` | Reverse proxy + security headers |
| `frontend/nginx.conf` | SPA routing + caching |
| `SOLO_DEV_ROADMAP.md` | Sprint timeline + dev guide |
| `TESTING.md` | Testing framework + coverage targets |
| `.env` | Runtime secrets (gitignored) |
| `.env.example` | Template for required env vars |

## RECENT SECURITY IMPROVEMENTS (v1.01)
- Secret key validator rejects empty/default values
- Non-root container users (appuser + nginx)
- Dockerignore files prevent secret leakage
- Connection pool limits (pool_size=5, max_overflow=10, recycle=1800s)
- Security headers on nginx + Caddy (X-Frame-Options, HSTS, etc.)
- Network segmentation (frontend/backend networks)
- Resource limits on all containers
- Rate limiting on API paths (20 req/min)
- Gzip compression enabled
- Test/dev dependency split

## DEVELOPMENT WORKFLOW
1. Develop locally or in Docker
2. Run tests: `cd backend && python -m pytest tests/ -v`
3. Build: `docker compose up -d --build`
4. Health check: `curl http://localhost:8000/api/health`

## RELEASE PROCESS
1. Increment VERSION file (+0.01)
2. Run full test suite
3. Update CHANGELOG.md
4. Update SOLO_DEV_ROADMAP.md version history
5. Update FamilyHub_DevGuide_Phase1.md if API changed
6. Commit all changes
7. Tag release
8. Push to `dev` branch (not main)
9. Verify dev branch builds cleanly

## ENVIRONMENT VARIABLES (from .env.example)
- SECRET_KEY (required - validated)
- DATABASE_URL
- ALLOWED_ORIGINS
- WEATHER_API_KEY
- VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
- SMTP_* settings
- MOCK_* flags for development

## TESTING
- Framework: pytest + pytest-asyncio
- Location: backend/tests/
- Run: `python -m pytest tests/ -v`
- Coverage target: 80%+ (per roadmap)
- Current test count: 7 (3 endpoint + 4 config security)

## DEFERRED ITEMS (Sprint 1.2+)
- Establish Python venv
- Migrate passlib → argon2-cffi
- Supply-chain hash pinning
- Content-Security-Policy header
- read_only root filesystems
- Structured JSON logging
