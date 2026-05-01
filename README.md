# FamilyHub

**Version:** 1.02 &nbsp;|&nbsp; **Status:** Sprint 1.1 Complete + Security Hardening &nbsp;|&nbsp; **Date:** April 30, 2026

Self-hosted family organizational hub — a single Docker Compose stack that gives your family a shared calendar, task manager, wall display, and photo slideshow, all accessible from phones, tablets, and a wall-mounted screen.

---

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Caddy      │────▶│    Web       │────▶│     API      │
│  (HTTPS RP)  │     │  (nginx SPA) │     │  (FastAPI)   │
│  :80 / :443  │     │   :3000      │     │   :8000      │
└──────────────┘     └──────────────┘     └──────────────┘
                                                   │
                                            ┌──────────────┐
                                            │   SQLite     │
                                            │  (./data/db) │
                                            └──────────────┘
```

All containers use **Alpine Linux** base images for a minimal attack surface.

## Quick Start

```bash
# Clone & enter project directory
git clone https://github.com/vnmyers13/FamilyHub.git
cd FamilyHub

# Review environment variables (copy from template)
cp .env.example .env

# Build and start
docker compose up -d --build

# Check status
docker compose ps

# Run tests
docker exec -w /app familyhub-api sh -c "PYTHONPATH=/app pytest tests/ -v"
```

## Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `api` | `python:3.12-alpine` | 8000 (internal) | FastAPI REST API, auto-runs Alembic migrations |
| `web` | `nginx:alpine` | 3000 (internal) | Static frontend + SPA router, proxies `/api` to backend |
| `caddy` | `caddy:2-alpine` | 80, 443 | HTTPS reverse proxy with auto-certificate management |

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | API info (version, docs link) |
| `GET` | `/api/health` | Health check (`{"status":"ok"}`) |
| `GET` | `/docs` | Auto-generated OpenAPI/Swagger docs |

## Project Structure

```
FamilyHub/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py      # Pydantic Settings (env vars)
│   │   │   └── database.py    # SQLAlchemy async engine
│   │   └── main.py            # FastAPI app, lifespan, routes
│   ├── alembic/               # DB migration scaffolding
│   ├── tests/                 # pytest test suite
│   ├── Dockerfile
│   ├── requirements.txt
│   └── pytest.ini
├── frontend/
│   ├── dist/                  # Static files (placeholder)
│   ├── nginx.conf
│   └── Dockerfile
├── config/
│   └── Caddyfile
├── docker-compose.yml
├── .env.example
├── CHANGELOG.md
├── SOLO_DEV_ROADMAP.md
└── VERSION
```

## Configuration

All configuration is handled through environment variables in `.env`. See `.env.example` for the full list of available settings.

**Important:** Never commit `.env` to version control. It is listed in `.gitignore`.

## Testing

```bash
# Run all tests
docker exec -w /app familyhub-api sh -c "PYTHONPATH=/app pytest tests/ -v"

# Run with coverage (requires pytest-cov)
docker exec -w /app familyhub-api sh -c "PYTHONPATH=/app pytest tests/ --cov=app -v"
```

## Development Roadmap

See [SOLO_DEV_ROADMAP.md](SOLO_DEV_ROADMAP.md) for the full solo-developer timeline and sprint breakdown.

### Current Phase: Phase 1 — Foundation

| Sprint | Status | Description |
|--------|--------|-------------|
| 1.1 | ✅ Complete | Docker scaffold, FastAPI, DB, health checks, smoke tests |
| 1.2 | ⏳ Planned | Auth, family profiles, PIN/password |
| 1.3 | ⏳ Planned | Internal calendar, Google Calendar sync |
| 1.4 | ⏳ Planned | Tasks, dashboard, wall display |
| 1.5 | ⏳ Planned | Photos, slideshow, PWA polish |

## License

Private — for personal/family use.

---

*Built with ❤️ for family organization.*
