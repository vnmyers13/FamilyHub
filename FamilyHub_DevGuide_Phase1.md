# FamilyHub — Developer Guide: Secrets & Phase 1 Task Instructions
**Version:** 1.0
**Date:** April 2026
**Audience:** Developer starting Phase 1 development

---

## Part 1 — Before You Write a Single Line of Code

Three things must be done **before** development starts — not mid-sprint when you're blocked. Each one requires account setup or registration that takes time.

---

### Reminder 1 — Register the Google OAuth App (needed for Task 1.3.3)

**Do this on Day 1 of Sprint 1.3, not when you start writing the integration code.**

Google OAuth requires a registered application with an approved redirect URI before any auth flow can be tested end-to-end. The registration itself takes 5 minutes, but if you need to request expanded scopes or Google puts the app in "testing" mode, you may need to wait or configure test users.

**Steps:**

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project named `familyhub` (or add to an existing one)
3. Enable the **Google Calendar API**: APIs & Services → Library → search "Google Calendar API" → Enable
4. Go to APIs & Services → **OAuth consent screen**
   - User type: **External** (unless you have a Google Workspace org, in which case choose Internal)
   - App name: `FamilyHub`
   - User support email: your email
   - Developer contact: your email
   - Scopes: add `https://www.googleapis.com/auth/calendar` (full calendar read/write)
   - Test users: add the Google accounts you'll test with (while in "Testing" mode, only listed users can authorize)
   - Publishing status: leave as **Testing** for now — publish only when the app is production-ready
5. Go to APIs & Services → **Credentials** → Create Credentials → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `FamilyHub Local`
   - Authorized redirect URIs:
     - `https://familyhub.local/api/integrations/google/callback`
     - `https://localhost/api/integrations/google/callback` (for dev testing)
6. Download the JSON credentials file — copy `client_id` and `client_secret` into your `.env` as:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=https://familyhub.local/api/integrations/google/callback
   ```

**Gotcha:** The redirect URI must exactly match what you register — including `https://` vs `http://` and trailing slashes. If you change the domain later, you must update it in the Google Console and in your `.env`.

---

### Reminder 2 — Register the Microsoft OAuth App (needed for Sprint 2.1)

**Do this on Day 1 of Sprint 2.1.** Like Google, this needs to be registered before any code can be tested.

**Steps:**

1. Go to [https://portal.azure.com](https://portal.azure.com) and sign in with a Microsoft account (personal or work)
2. Navigate to **Azure Active Directory** → **App registrations** → **New registration**
   - Name: `FamilyHub`
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts** (this covers both Outlook.com personal accounts and Microsoft 365 work accounts)
   - Redirect URI: Web → `https://familyhub.local/api/integrations/microsoft/callback`
3. After creation, note the **Application (client) ID** — this is your `MICROSOFT_CLIENT_ID`
4. Go to **Certificates & secrets** → **New client secret**
   - Description: `familyhub-local`
   - Expiry: 24 months
   - Copy the **Value** immediately (it won't be shown again) → this is your `MICROSOFT_CLIENT_SECRET`
5. Go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**
   - Add: `Calendars.ReadWrite`, `offline_access`, `User.Read`
   - Click "Grant admin consent" if available (not required for personal account testing)
6. Add to `.env`:
   ```
   MICROSOFT_CLIENT_ID=your_application_id
   MICROSOFT_CLIENT_SECRET=your_client_secret_value
   MICROSOFT_TENANT_ID=common
   MICROSOFT_REDIRECT_URI=https://familyhub.local/api/integrations/microsoft/callback
   ```

**Note on `TENANT_ID`:** Use `common` to support both personal (Outlook.com) and organizational (Microsoft 365) accounts. Use a specific tenant GUID only if this app will be restricted to one organization.

---

### Reminder 3 — Trust the Self-Signed Certificate on Test Devices (needed for Task 1.4.6)

**Do this when the Caddy stack is first running.** The PWA install prompt on iOS requires HTTPS. Caddy issues a self-signed cert for `familyhub.local` via `tls internal`. Browsers will block this unless the cert is explicitly trusted on each device.

**Steps per device:**

**On the Pi itself (for wall screen testing):**
```bash
# Copy Caddy's root CA cert to system trust
docker compose exec caddy cat /data/caddy/pki/authorities/local/root.crt \
  > ~/caddy-root.crt
sudo cp ~/caddy-root.crt /usr/local/share/ca-certificates/caddy-root.crt
sudo update-ca-certificates
```

**On macOS (admin laptop):**
1. Run: `docker compose exec caddy cat /data/caddy/pki/authorities/local/root.crt > caddy-root.crt`
2. Double-click `caddy-root.crt` → Keychain Access opens
3. Find "Caddy Local Authority" → double-click → Trust → set "When using this certificate" to **Always Trust**
4. Restart Chrome/Safari

**On iPhone/iPad:**
1. You need to serve the cert file from the Pi:
   ```bash
   # Temporarily serve the cert on port 8080
   python3 -m http.server 8080 --directory ~
   ```
2. On the iPhone, open Safari and navigate to `http://[pi-ip-address]:8080/caddy-root.crt`
3. Tap **Allow** to download the profile
4. Go to Settings → General → VPN & Device Management → tap the profile → Install
5. Go to Settings → General → About → Certificate Trust Settings → enable "Caddy Local Authority" (full trust)
6. Now navigate to `https://familyhub.local` — it should load without a warning

**Note:** Android accepts the cert at the system level differently depending on Android version. Chrome on Android 14+ may still warn about self-signed certs even after profile installation. Testing the install prompt is more reliable on iOS or Chrome desktop.

---

## Part 2 — Secrets Management Strategy

### The Core Rules

1. **Never commit secrets to Git.** Not in `.env`, not in comments, not in test files. The `.env` file must be in `.gitignore` from the very first commit.
2. **The `.env.example` file is the source of truth for what variables exist.** It documents every variable with a description but contains no real values — only placeholders and instructions.
3. **Secrets that the app generates at runtime (VAPID keys, encryption keys) are stored in `.env` after first generation — not hardcoded anywhere.**
4. **OAuth tokens stored in the database are always encrypted at rest**, never stored as plaintext strings.

### File Structure for Secrets

```
familyhub/
├── .gitignore          ← must include .env, data/, *.key, *.pem
├── .env.example        ← committed to Git; contains NO real values
├── .env                ← NOT committed; contains real values; lives only on the Pi
└── data/
    └── db/             ← NOT committed; the database file lives here
```

### The `.env.example` File (complete)

Create this in the root of the repository. Copy it to `.env` and fill in real values on the Pi.

```bash
# ─────────────────────────────────────────────
# FamilyHub — Environment Variables
# Copy this file to .env and fill in your values.
# Never commit .env to Git.
# ─────────────────────────────────────────────

# ── Core ──────────────────────────────────────
# The name shown in the browser tab and setup wizard
FAMILY_NAME=The Smiths

# Your local timezone (IANA format). Find yours at:
# https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
TIMEZONE=America/New_York

# ── Security ──────────────────────────────────
# 64-character random hex string. Generate with:
#   openssl rand -hex 32
# Changing this will invalidate all existing sessions and
# will break decryption of stored OAuth tokens.
# BACK THIS UP somewhere secure (password manager).
SECRET_KEY=REPLACE_WITH_64_CHAR_HEX

# ── Web Push / Push Notifications ─────────────
# Generate VAPID keys once with:
#   pip install pywebpush
#   python -c "from py_vapid import Vapid; v=Vapid(); v.generate_keys(); print('PUBLIC:', v.public_key); print('PRIVATE:', v.private_key)"
# Or use the web tool at: https://web-push-codelab.glitch.me/
VAPID_PUBLIC_KEY=REPLACE_WITH_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY=REPLACE_WITH_VAPID_PRIVATE_KEY
VAPID_CONTACT=mailto:admin@familyhub.local

# ── Database ──────────────────────────────────
# Path inside the container (do not change unless you know what you're doing)
DATABASE_URL=sqlite+aiosqlite:////data/db/familyhub.db

# ── Backups ───────────────────────────────────
# Number of daily backup files to retain
BACKUP_RETENTION_DAYS=30
# Time to run the daily backup (24-hour format, local time)
BACKUP_TIME=03:00

# ── Calendar Sync ─────────────────────────────
# How often to sync calendars (minutes). Default: 15.
CALENDAR_SYNC_INTERVAL_MINUTES=15

# ── Google Calendar (Optional) ────────────────
# Register your OAuth app at https://console.cloud.google.com
# See docs/google-calendar-setup.md for full instructions
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://familyhub.local/api/integrations/google/callback

# ── Microsoft Calendar (Optional) ─────────────
# Register your OAuth app at https://portal.azure.com
# See docs/microsoft-calendar-setup.md for full instructions
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=https://familyhub.local/api/integrations/microsoft/callback

# ── Weather Widget (Optional) ─────────────────
# Find your coordinates at https://www.latlong.net/
# No API key required (uses Open-Meteo)
WEATHER_LAT=
WEATHER_LON=

# ── Wall Display ──────────────────────────────
# Seconds of inactivity before idle slideshow activates
WALL_IDLE_TIMEOUT_SECONDS=300

# ── Networking ────────────────────────────────
# Comma-separated list of allowed CORS origins
ALLOWED_ORIGINS=https://familyhub.local,https://localhost

# ── Email Notifications (Optional) ───────────
# Leave blank to disable email notifications
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=familyhub@yourdomain.com
```

### How to Generate the `SECRET_KEY`

```bash
# On any machine with OpenSSL:
openssl rand -hex 32

# On any machine with Python:
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output into your `.env` as `SECRET_KEY`. **Store this in a password manager (1Password, Bitwarden, etc.)** — if the Pi SD card dies and you replace it, you need this key to restore your encrypted OAuth tokens from the database backup.

### How to Generate VAPID Keys

```bash
# Install pywebpush (only needed for key generation, not at runtime)
pip install pywebpush

# Generate keys
python3 -c "
from py_vapid import Vapid
v = Vapid()
v.generate_keys()
print('VAPID_PUBLIC_KEY=' + v.public_key)
print('VAPID_PRIVATE_KEY=' + v.private_key)
"
```

Paste both lines into your `.env`.

### How OAuth Tokens Are Stored in the Database

OAuth tokens (Google access token + refresh token, Microsoft access token, Apple app-specific password) are **never stored as plaintext** in the `calendar_sources` table. The `credentials_encrypted` column stores an AES-256-GCM encrypted JSON blob.

The encryption is keyed off `SECRET_KEY` from `.env`. When the app starts:
1. It derives a 32-byte AES key from `SECRET_KEY` using HKDF (HMAC-based key derivation)
2. When storing credentials: encrypts the JSON string and stores the base64-encoded ciphertext
3. When reading credentials: decrypts and parses back to JSON

**This means: if you change `SECRET_KEY`, all stored calendar integrations will break and need to be reconnected.** Treat it like a master password.

### Handling Secrets for the Pi in Production

**Where the `.env` file lives:** Only on the Pi at `/home/pi/familyhub/.env`. It should not be in a synced folder (e.g., not in a Nextcloud or Dropbox-synced directory).

**Protect the file:**
```bash
# Only the pi user can read it
chmod 600 .env
```

**Back up the `.env` file** (separately from the database backup) to a secure location — a password manager, an encrypted USB drive, or a printed copy stored safely. You need it if you need to restore on a new Pi.

**On developer laptops:** When developing locally, your `.env` can have a non-production `SECRET_KEY` and dummy OAuth credentials. Keep a note that the Pi's `.env` is separate and has the real values.

### What NOT to Put in Environment Variables

Environment variables are appropriate for short strings (keys, passwords, URLs). They are not appropriate for:
- Certificate files (`.pem`, `.crt`) — mount these as files in Docker volumes
- Large configuration blobs — use the `config/` directory and mount as a file
- User data — that goes in the database

---

## Part 3 — Phase 1 Task Instructions

For each task: what to do first, key steps, tools to use, common gotchas, and where to look if something goes wrong.

---

### Sprint 1.1 — Project Scaffold & Infrastructure

---

#### Task 1.1.1 — Initialize repository and Docker Compose stack

**How to do it:**

1. **Create the GitHub repo** — create it at github.com, initialize with a README and a `.gitignore` (choose the Python template; you'll add Node entries manually).

2. **Add to `.gitignore` immediately** — before any other files:
   ```
   .env
   data/
   *.db
   *.db-shm
   *.db-wal
   __pycache__/
   node_modules/
   dist/
   .venv/
   caddy_data/
   caddy_config/
   ```

3. **Create the directory structure** manually or with `mkdir -p`:
   ```bash
   mkdir -p backend/app/{core,models,schemas,routers,services,jobs,integrations}
   mkdir -p backend/{alembic,tests}
   mkdir -p frontend/src/{components,pages,hooks,api,stores,wall}
   mkdir -p frontend/public/icons
   mkdir -p config data/{db,photos,backups}
   touch data/.gitkeep data/db/.gitkeep data/photos/.gitkeep data/backups/.gitkeep
   ```

4. **Write `docker-compose.yml`** — use Docker Compose v2 syntax (`services:` at root, not `version:`). Key settings:
   - All services: `restart: unless-stopped`
   - `api` service: `build: ./backend`, bind-mount `./data:/data`, expose port 8000 internally (not published to host — Caddy proxies it)
   - `web` service: `build: ./frontend`, expose port 3000 internally
   - `caddy` service: `image: caddy:2-alpine`, publish ports `80:80` and `443:443`, bind-mount `./config/Caddyfile:/etc/caddy/Caddyfile`, named volumes for `caddy_data` and `caddy_config`
   - Load `.env` via `env_file: .env` on the `api` service

5. **Write `config/Caddyfile`**:
   ```
   familyhub.local {
     tls internal
     
     handle /api/* {
       reverse_proxy api:8000
     }
     
     handle {
       reverse_proxy web:3000
     }
   }
   ```

6. **Set up mDNS on the Pi** so `familyhub.local` resolves. Install Avahi if not present:
   ```bash
   sudo apt install avahi-daemon
   sudo systemctl enable avahi-daemon
   sudo systemctl start avahi-daemon
   ```
   Avahi broadcasts the Pi's hostname. If your Pi's hostname is already `raspberrypi`, you can either change it to `familyhub` (`sudo raspi-config` → System → Hostname) or add a Caddyfile entry for `raspberrypi.local` during development.

7. **Create placeholder backend** to confirm stack boots:
   - `backend/app/main.py`: a minimal FastAPI app with a `/api/health` endpoint returning `{"status": "ok"}`
   - `backend/Dockerfile`: `FROM python:3.12-slim`, `pip install fastapi uvicorn`, `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]`

8. **Create placeholder frontend** — just an `index.html` that says "FamilyHub" served by `nginx:alpine`:
   - `frontend/Dockerfile`: `FROM nginx:alpine`, `COPY index.html /usr/share/nginx/html/`

9. **Boot and verify:**
   ```bash
   cp .env.example .env
   # Edit .env — fill in SECRET_KEY (generate it now) and FAMILY_NAME
   docker compose up -d
   docker compose logs -f  # watch for errors
   curl https://familyhub.local/api/health  # may need to trust cert first
   ```

**Gotcha:** Docker's internal DNS resolves service names (e.g., `api`, `web`) only between containers. `familyhub.local` is resolved by Avahi on the host network. Make sure Caddy's `network_mode` is not `host` — keep the default bridge networking.

---

#### Task 1.1.2 — GitHub Actions CI (multi-arch Docker build)

**How to do it:**

1. **Enable GitHub Container Registry (GHCR):** No setup needed — it's automatically available for any GitHub repo. You authenticate from Actions using `GITHUB_TOKEN` (built-in, no configuration required).

2. **Create `.github/workflows/build.yml`:**
   ```yaml
   name: Build and push Docker images
   
   on:
     push:
       branches: [main]
   
   jobs:
     build:
       runs-on: ubuntu-latest
       permissions:
         contents: read
         packages: write
       
       steps:
         - uses: actions/checkout@v4
         
         - name: Set up QEMU  # needed for ARM emulation
           uses: docker/setup-qemu-action@v3
         
         - name: Set up Docker Buildx
           uses: docker/setup-buildx-action@v3
         
         - name: Log in to GHCR
           uses: docker/login-action@v3
           with:
             registry: ghcr.io
             username: ${{ github.actor }}
             password: ${{ secrets.GITHUB_TOKEN }}
         
         - name: Build and push API image
           uses: docker/build-push-action@v5
           with:
             context: ./backend
             platforms: linux/amd64,linux/arm64
             push: true
             tags: ghcr.io/${{ github.repository }}/familyhub-api:latest
             cache-from: type=gha
             cache-to: type=gha,mode=max
         
         - name: Build and push Web image
           uses: docker/build-push-action@v5
           with:
             context: ./frontend
             platforms: linux/amd64,linux/arm64
             push: true
             tags: ghcr.io/${{ github.repository }}/familyhub-web:latest
             cache-from: type=gha
             cache-to: type=gha,mode=max
   ```

3. **QEMU** is the emulator that lets GitHub's x86 runners build ARM64 images. The `setup-qemu-action` installs it automatically — you don't need to configure anything.

4. **Layer caching:** The `cache-from/cache-to: type=gha` lines cache Docker layers in GitHub Actions cache between runs. This reduces build time from ~10 minutes to ~2 minutes on repeat builds.

5. **On the Pi, update `docker-compose.yml`** to pull from GHCR instead of building locally:
   ```yaml
   api:
     image: ghcr.io/yourusername/familyhub/familyhub-api:latest
   web:
     image: ghcr.io/yourusername/familyhub/familyhub-web:latest
   ```
   For development, keep `build:` in compose so you can build locally without pushing.

**Gotcha:** The first multi-arch build with QEMU is slow (15–20 min). Subsequent builds with cache hit are much faster. If the Pi is ARM64 (Pi 4 running 64-bit OS), it will pull the `arm64` manifest automatically — Docker handles this transparently.

---

#### Task 1.1.3 — FastAPI application skeleton

**How to do it:**

1. **Set up Python environment locally** (for development outside Docker):
   ```bash
   cd backend
   python3.12 -m venv .venv
   source .venv/bin/activate
   pip install fastapi uvicorn[standard] sqlalchemy[asyncio] aiosqlite alembic \
     pydantic-settings pyjwt "passlib[bcrypt]" python-multipart httpx pillow \
     apscheduler python-dateutil
   pip freeze > requirements.txt
   ```

2. **`backend/app/core/config.py`** — use `pydantic-settings` to load `.env`:
   ```python
   from pydantic_settings import BaseSettings

   class Settings(BaseSettings):
       family_name: str = "FamilyHub"
       timezone: str = "UTC"
       secret_key: str
       database_url: str
       allowed_origins: str = "https://familyhub.local"
       # ... all other env vars
       
       class Config:
           env_file = ".env"

   settings = Settings()
   ```
   Import `settings` everywhere instead of calling `os.environ` directly.

3. **`backend/app/core/database.py`** — async SQLAlchemy engine:
   ```python
   from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
   from sqlalchemy.orm import sessionmaker, DeclarativeBase
   
   engine = create_async_engine(settings.database_url, echo=False)
   AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
   
   class Base(DeclarativeBase):
       pass
   
   async def get_db():
       async with AsyncSessionLocal() as session:
           yield session
   ```

4. **`backend/app/main.py`** — lifespan pattern for startup/shutdown:
   ```python
   from contextlib import asynccontextmanager
   from fastapi import FastAPI
   
   @asynccontextmanager
   async def lifespan(app: FastAPI):
       # Startup: run Alembic migrations
       from alembic.config import Config
       from alembic import command
       alembic_cfg = Config("alembic.ini")
       command.upgrade(alembic_cfg, "head")
       yield
       # Shutdown: nothing needed for SQLite
   
   app = FastAPI(lifespan=lifespan)
   ```

5. **Initialize Alembic:**
   ```bash
   cd backend
   alembic init alembic
   ```
   Edit `alembic/env.py` to use the async engine and import `Base` from your models.

6. **`backend/Dockerfile`** — multi-stage is not necessary for the backend; keep it simple:
   ```dockerfile
   FROM python:3.12-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

**Gotcha:** Alembic's `env.py` needs special handling for async SQLAlchemy. Use `run_migrations_offline` and `run_migrations_online` with the async engine. The FastAPI docs have a dedicated async SQLAlchemy + Alembic section — follow it exactly rather than adapting the sync example.

---

#### Task 1.1.4 — React/Vite/TypeScript frontend skeleton

**How to do it:**

1. **Scaffold the project:**
   ```bash
   cd ..  # back to repo root
   npm create vite@latest frontend -- --template react-ts
   cd frontend
   npm install
   npm install react-router-dom @tanstack/react-query axios zustand
   npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa workbox-window
   npx tailwindcss init -p
   ```

2. **Configure Tailwind** — `tailwind.config.js`:
   ```js
   export default {
     content: ["./index.html", "./src/**/*.{ts,tsx}"],
     theme: {
       extend: {
         colors: {
           // FamilyHub brand tokens — choose your palette here
           primary: { DEFAULT: '#4F46E5', dark: '#3730A3' },
           child: { bg: '#FEF9C3', accent: '#EAB308' }
         }
       }
     }
   }
   ```

3. **Configure `vite-plugin-pwa`** in `vite.config.ts`:
   ```ts
   import { VitePWA } from 'vite-plugin-pwa'
   
   export default defineConfig({
     plugins: [
       react(),
       VitePWA({
         registerType: 'autoUpdate',
         manifest: {
           name: 'FamilyHub',
           short_name: 'FamilyHub',
           theme_color: '#4F46E5',
           background_color: '#ffffff',
           display: 'standalone',
           start_url: '/',
           icons: [
             { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
             { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
             { src: 'icons/icon-180.png', sizes: '180x180', type: 'image/png', purpose: 'apple-touch-icon' }
           ]
         },
         workbox: {
           runtimeCaching: [
             { urlPattern: /^\/api\//, handler: 'NetworkFirst' }
           ]
         }
       })
     ],
     server: {
       proxy: { '/api': 'http://localhost:8000' }  // dev proxy to backend
     }
   })
   ```

4. **Generate placeholder PWA icons** — you can use a simple Python script or an online tool ([https://realfavicongenerator.net](https://realfavicongenerator.net)). At this stage, a colored square is fine:
   ```python
   from PIL import Image
   for size in [192, 512, 180]:
       img = Image.new('RGB', (size, size), color='#4F46E5')
       img.save(f'public/icons/icon-{size}.png')
   ```

5. **`frontend/Dockerfile`** — multi-stage build:
   ```dockerfile
   FROM node:20-alpine AS build
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build
   
   FROM nginx:alpine
   COPY --from=build /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   ```

6. **`frontend/nginx.conf`** — needed to make React Router work (serve `index.html` for all routes):
   ```nginx
   server {
     listen 3000;
     root /usr/share/nginx/html;
     index index.html;
     location / {
       try_files $uri $uri/ /index.html;
     }
   }
   ```

**Gotcha:** Without the `nginx.conf` fallback, navigating directly to `/wall` or `/tasks` on a hard refresh returns a 404 from Nginx. The `try_files ... /index.html` line fixes this — don't skip it.

---

#### Task 1.1.5 — Initial database schema migration

**How to do it:**

1. **Create the SQLAlchemy models first** in `backend/app/models/auth.py`, then generate the migration from them:
   ```python
   import uuid
   from sqlalchemy import Column, String, DateTime, Enum, ForeignKey
   from sqlalchemy.dialects.sqlite import JSON
   from app.core.database import Base
   
   class Family(Base):
       __tablename__ = "families"
       id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
       name = Column(String, nullable=False)
       timezone = Column(String, default="UTC")
       settings_json = Column(JSON, default=dict)
       created_at = Column(DateTime, ...)
   ```

2. **Generate the migration:**
   ```bash
   cd backend
   alembic revision --autogenerate -m "001_initial_schema"
   ```
   Review the generated file in `alembic/versions/` — autogenerate is good but not perfect. Check that enums, JSON columns, and UUID defaults look correct.

3. **Apply the migration:**
   ```bash
   alembic upgrade head
   ```

4. **Verify with SQLite CLI:**
   ```bash
   sqlite3 ../data/db/familyhub.db ".tables"
   sqlite3 ../data/db/familyhub.db ".schema users"
   ```

**Note on SQLite + Alembic + Enums:** SQLite doesn't have a native ENUM type. SQLAlchemy renders enums as VARCHAR. Alembic may not detect enum changes as schema changes in SQLite — document enum columns with a comment in the model so future developers know the valid values.

**Gotcha:** SQLite doesn't enforce foreign key constraints by default. Add this to `database.py` to enable them:
```python
from sqlalchemy import event
@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_conn, _):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()
```

---

#### Task 1.1.6 — Smoke test suite setup

**How to do it:**

1. **Install test dependencies:**
   ```bash
   pip install pytest pytest-asyncio httpx
   pip freeze > requirements.txt  # or use a requirements-dev.txt
   ```

2. **`backend/tests/conftest.py`** — use an in-memory SQLite database per test session:
   ```python
   import pytest
   import pytest_asyncio
   from httpx import AsyncClient, ASGITransport
   from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
   from sqlalchemy.orm import sessionmaker
   from app.main import app
   from app.core.database import Base, get_db

   TEST_DB = "sqlite+aiosqlite:///:memory:"

   @pytest_asyncio.fixture(scope="session")
   async def test_db():
       engine = create_async_engine(TEST_DB)
       async with engine.begin() as conn:
           await conn.run_sync(Base.metadata.create_all)
       session_factory = sessionmaker(engine, class_=AsyncSession)
       async with session_factory() as session:
           yield session
       await engine.dispose()

   @pytest_asyncio.fixture
   async def client(test_db):
       app.dependency_overrides[get_db] = lambda: test_db
       async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
           yield ac
       app.dependency_overrides.clear()
   ```

3. **`backend/tests/test_health.py`:**
   ```python
   import pytest
   
   @pytest.mark.asyncio
   async def test_health(client):
       resp = await client.get("/api/health")
       assert resp.status_code == 200
       assert resp.json()["status"] == "ok"
   ```

4. **`pytest.ini` or `pyproject.toml`:**
   ```ini
   [pytest]
   asyncio_mode = auto
   ```

5. **Add to GitHub Actions** (in `build.yml`, after the `Build API` step):
   ```yaml
   - name: Run tests
     working-directory: ./backend
     run: |
       pip install -r requirements.txt pytest pytest-asyncio httpx
       pytest tests/ -v
   ```

---

### Sprint 1.2 — Authentication & First-Run Setup

---

#### Task 1.2.1 — Auth API endpoints

**How to do it:**

1. **`backend/app/core/security.py`** — implement JWT + bcrypt:
   ```python
   from datetime import datetime, timedelta, timezone
   from passlib.context import CryptContext
   import jwt
   
   pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
   
   def hash_password(password: str) -> str:
       return pwd_context.hash(password)
   
   def verify_password(plain: str, hashed: str) -> bool:
       return pwd_context.verify(plain, hashed)
   
   def create_access_token(user_id: str, expires_days: int = 30) -> str:
       payload = {
           "sub": user_id,
           "exp": datetime.now(timezone.utc) + timedelta(days=expires_days)
       }
       return jwt.encode(payload, settings.secret_key, algorithm="HS256")
   ```

2. **Setting the JWT as an httpOnly cookie** in a FastAPI response:
   ```python
   from fastapi import Response
   
   response.set_cookie(
       key="access_token",
       value=token,
       httponly=True,
       secure=True,       # HTTPS only
       samesite="strict",
       max_age=60*60*24*30  # 30 days in seconds
   )
   ```

3. **`get_current_user` dependency** — reads the cookie on every protected request:
   ```python
   from fastapi import Cookie, Depends, HTTPException
   
   async def get_current_user(
       access_token: str | None = Cookie(default=None),
       db: AsyncSession = Depends(get_db)
   ):
       if not access_token:
           raise HTTPException(status_code=401)
       try:
           payload = jwt.decode(access_token, settings.secret_key, algorithms=["HS256"])
           user_id = payload["sub"]
       except jwt.PyJWTError:
           raise HTTPException(status_code=401)
       user = await db.get(User, user_id)
       if not user:
           raise HTTPException(status_code=401)
       return user
   ```

4. **PIN rate limiting** — store attempts in a simple dict (sufficient for household scale; no Redis needed):
   ```python
   from collections import defaultdict
   from time import time
   
   _pin_attempts: dict[str, list[float]] = defaultdict(list)
   
   def check_pin_rate_limit(user_id: str) -> None:
       now = time()
       attempts = [t for t in _pin_attempts[user_id] if now - t < 60]
       _pin_attempts[user_id] = attempts
       if len(attempts) >= 5:
           raise HTTPException(status_code=429, detail="Too many attempts. Wait 60 seconds.")
       _pin_attempts[user_id].append(now)
   ```

**Gotcha:** `SameSite=Strict` cookies will not be sent on the first navigation from an external URL (e.g., clicking a link from a text message). For a household app accessed primarily by typing the URL or from the PWA home screen, this is acceptable. If you later add caregiver access links that are clicked from outside, you may need to relax to `SameSite=Lax`.

---

#### Task 1.2.2 — User management API

**How to do it:**

1. **Pillow thumbnail generation** — run in a thread to avoid blocking the async event loop:
   ```python
   import asyncio
   from PIL import Image
   
   async def generate_thumbnail(source_path: str, dest_path: str, size: tuple):
       def _do_it():
           with Image.open(source_path) as img:
               img.thumbnail(size, Image.LANCZOS)
               img.save(dest_path, "JPEG", quality=85)
       await asyncio.to_thread(_do_it)
   ```

2. **File upload endpoint** — use FastAPI's `UploadFile`:
   ```python
   from fastapi import UploadFile, File
   import shutil
   
   @router.post("/users/{user_id}/avatar")
   async def upload_avatar(user_id: str, file: UploadFile = File(...)):
       dest = f"/data/photos/avatars/{user_id}.jpg"
       with open(dest, "wb") as f:
           shutil.copyfileobj(file.file, f)
       await generate_thumbnail(dest, dest.replace(".jpg", "_thumb.jpg"), (96, 96))
       return {"url": f"/photos/avatars/{user_id}_thumb.jpg"}
   ```

3. **Soft delete pattern** — add `is_deleted: bool = False` to the User model. All queries filter on `is_deleted = False`. Deletion sets `is_deleted = True` and clears sensitive fields (pin_hash, password_hash) but keeps the record for referential integrity (completed tasks still reference the user).

---

#### Task 1.2.3 — Setup wizard (frontend)

**How to do it:**

1. **Multi-step form with local React state** — no routing needed between steps:
   ```tsx
   const [step, setStep] = useState(1)
   const [formData, setFormData] = useState({ familyName: '', timezone: '', adminName: '', password: '' })
   
   if (step === 1) return <Step1 data={formData} onNext={() => setStep(2)} onChange={setFormData} />
   if (step === 2) return <Step2 data={formData} onNext={() => setStep(3)} onChange={setFormData} />
   if (step === 3) return <Step3 data={formData} onSubmit={handleSubmit} />
   ```

2. **Timezone picker** — use the browser's built-in timezone list, no library needed:
   ```tsx
   const timezones = Intl.supportedValuesOf('timeZone')
   // Render as a searchable <select> or combobox
   ```

3. **Block double-submission** — disable the submit button and show a loading spinner while the API call is in flight (using TanStack Query's `isPending` state).

4. **App startup routing** in `App.tsx`:
   ```tsx
   useEffect(() => {
     axios.get('/api/auth/setup/status').then(res => {
       if (!res.data.setup_complete) navigate('/setup')
       else axios.get('/api/auth/me')
         .then(r => setUser(r.data))
         .catch(() => navigate('/login'))
     })
   }, [])
   ```

---

#### Task 1.2.4 & 1.2.5 — Login page and user management UI

**How to do it:**

1. **PIN pad component** — build it as a custom numpad grid (3×3 + 0 + delete), not an `<input type="number">`. The input element approach looks wrong on all platforms. Use a state string that you append digits to and submit when length reaches the expected PIN length.

2. **Member card grid on login** — load avatars from `GET /api/users/public` (a no-auth endpoint returning only display_name, avatar, and user_id). Don't return password hashes or other sensitive fields from this endpoint.

3. **shadcn/ui components** you'll use in user management: `Dialog` (for add/edit member modal), `Select` (role dropdown), `Input`, `Button`, `Badge` (role label). Install them one at a time with `npx shadcn-ui@latest add dialog`.

**Gotcha:** `shadcn/ui` generates component files into your `src/components/ui/` directory — these are your files to own and modify, not a node_modules dependency. Don't add them to `.gitignore`.

---

### Sprint 1.3 — Calendar & Tasks Core

---

#### Task 1.3.1 — Calendar and task schema migration

**How to do it:**

1. **Create all models first**, then run autogenerate once to get a single migration file covering both calendar and task tables. Batching related tables into one migration is cleaner than creating 10 separate files.

2. **RRULE storage** — store recurrence rules as plain strings (e.g., `RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR`). Use `python-dateutil`'s `rrulestr()` to parse them at query time. Don't parse/validate the string in the database layer.

3. **`assignee_ids` as a JSON column** — SQLite doesn't have arrays. Store as a JSON list: `["uuid1", "uuid2"]`. Query events by assignee in Python after fetching, or use `json_each()` in a raw SQLite query for filtering.

4. **UTC everywhere** — all `DateTime` columns store UTC. Apply timezone conversion only at the API response layer (send UTC to the frontend; let the browser display in the user's local timezone).

---

#### Task 1.3.2 — Internal calendar API

**How to do it:**

1. **RRULE expansion for date range queries** — when a user requests events for May, you need to expand recurring events that fall in that range:
   ```python
   from dateutil.rrule import rrulestr
   
   def expand_recurring(event, start, end):
       rule = rrulestr(event.recurrence_rule, dtstart=event.start_dt)
       return [event.copy(start=dt) for dt in rule.between(start, end)]
   ```

2. **Performance note:** Expanding all recurring events in the database on every calendar query is expensive. For Phase 1, it's acceptable. In Phase 4, add a `calendar_event_occurrences` cache table that pre-generates the next 3 months of occurrences during the background sync job.

3. **All-day events** — treat `start_dt` as a date only (set time to 00:00:00 UTC) and set `all_day=true`. In the API response, format all-day events differently: `"date": "2026-05-01"` instead of `"start": "2026-05-01T00:00:00Z"`.

---

#### Task 1.3.3 — Google Calendar OAuth2 integration

**How to do it:**

1. **Prerequisite:** Complete Reminder 1 above. You need `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` before this code can be tested.

2. **Use the official `google-auth` library** — don't implement the OAuth flow manually:
   ```bash
   pip install google-auth google-auth-oauthlib google-api-python-client
   ```

3. **Auth URL generation:**
   ```python
   from google_auth_oauthlib.flow import Flow
   
   def get_google_auth_url(state: str) -> str:
       flow = Flow.from_client_config(
           {"web": {"client_id": settings.google_client_id, "client_secret": settings.google_client_secret,
                    "redirect_uris": [settings.google_redirect_uri], "auth_uri": "...", "token_uri": "..."}},
           scopes=["https://www.googleapis.com/auth/calendar"]
       )
       flow.redirect_uri = settings.google_redirect_uri
       url, _ = flow.authorization_url(access_type="offline", prompt="consent", state=state)
       return url
   ```
   The `prompt="consent"` parameter forces Google to return a refresh token every time, even if the user has previously authorized the app. Without it, you only get a refresh token on the first authorization.

4. **Incremental sync** — Google Calendar supports sync tokens to avoid re-fetching all events:
   ```python
   service = build("calendar", "v3", credentials=creds)
   result = service.events().list(calendarId=cal_id, syncToken=last_token).execute()
   events = result.get("items", [])
   next_sync_token = result.get("nextSyncToken")
   # Store next_sync_token in calendar_sources for the next sync
   ```

5. **Encryption:** Implement `backend/app/core/encryption.py` before storing any credentials:
   ```python
   from cryptography.hazmat.primitives.ciphers.aead import AESGCM
   from cryptography.hazmat.primitives.kdf.hkdf import HKDF
   from cryptography.hazmat.primitives import hashes
   import os, base64
   
   def _derive_key() -> bytes:
       return HKDF(algorithm=hashes.SHA256(), length=32, salt=None,
                   info=b"familyhub-encryption").derive(settings.secret_key.encode())
   
   def encrypt(plaintext: str) -> str:
       key = _derive_key()
       nonce = os.urandom(12)
       ct = AESGCM(key).encrypt(nonce, plaintext.encode(), None)
       return base64.b64encode(nonce + ct).decode()
   
   def decrypt(ciphertext: str) -> str:
       key = _derive_key()
       data = base64.b64decode(ciphertext)
       nonce, ct = data[:12], data[12:]
       return AESGCM(key).decrypt(nonce, ct, None).decode()
   ```
   Install: `pip install cryptography`

---

#### Task 1.3.4 — Tasks API

**How to do it:**

1. **Recurrence — next occurrence calculation:**
   ```python
   from dateutil.rrule import rrulestr
   from datetime import datetime, timezone
   
   def next_occurrence(rule_str: str, after: datetime) -> datetime | None:
       rule = rrulestr(rule_str, dtstart=after)
       return rule.after(after)
   ```
   When a recurring task is completed, call this to get the `due_date` of the new instance, then insert a new task row with `status=pending`.

2. **Photo upload for task completion** — use `asyncio.to_thread` for Pillow processing, same pattern as avatar upload. Store path as `./data/photos/completions/{task_id}/{timestamp}.jpg`.

3. **Overdue APScheduler job:**
   ```python
   from apscheduler.schedulers.asyncio import AsyncIOScheduler
   
   scheduler = AsyncIOScheduler()
   
   @scheduler.scheduled_job('interval', hours=1)
   async def check_overdue_tasks():
       async with AsyncSessionLocal() as db:
           now = datetime.now(timezone.utc)
           stmt = update(Task).where(
               Task.due_date < now,
               Task.status == "pending"
           ).values(status="overdue")
           await db.execute(stmt)
           await db.commit()
   
   # Start in lifespan startup:
   scheduler.start()
   ```

---

#### Task 1.3.5 — Calendar UI

**How to do it:**

1. **Don't build the calendar grid from scratch** — use `@schedule-x/react` or `react-big-calendar`. Both support month/week/day/agenda views. `react-big-calendar` is more mature; `schedule-x` has a cleaner modern API. Review both and choose one.

   If you choose `react-big-calendar`:
   ```bash
   npm install react-big-calendar date-fns
   npm install -D @types/react-big-calendar
   ```

2. **Custom event rendering** — both libraries support a custom event component for styled event pills.

3. **Swipe navigation on mobile** — add touch gesture detection:
   ```bash
   npm install @use-gesture/react
   ```
   ```tsx
   const bind = useDrag(({ direction: [dx], distance: [d] }) => {
     if (d > 50) dx > 0 ? goToPrev() : goToNext()
   })
   return <div {...bind()}>...</div>
   ```

4. **Event form as a bottom sheet on mobile** — use shadcn's `Sheet` component with `side="bottom"` for a natural mobile modal that slides up from the bottom.

---

#### Task 1.3.6 — Tasks UI

**How to do it:**

1. **Kanban board** — use `@dnd-kit/core` + `@dnd-kit/sortable`:
   ```bash
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```
   Wrap columns in `DndContext`, cards in `SortableContext`. On drag end, call `PATCH /api/tasks/{id}` with the new status.

2. **Optimistic updates with TanStack Query** — update the cache immediately on complete action, then sync with server. If the server returns an error, roll back:
   ```tsx
   const { mutate: completeTask } = useMutation({
     mutationFn: (id) => api.post(`/tasks/${id}/complete`),
     onMutate: async (id) => {
       await queryClient.cancelQueries(['tasks'])
       const prev = queryClient.getQueryData(['tasks'])
       queryClient.setQueryData(['tasks'], old => 
         old.map(t => t.id === id ? {...t, status: 'completed'} : t))
       return { prev }
     },
     onError: (_, __, ctx) => queryClient.setQueryData(['tasks'], ctx.prev)
   })
   ```

3. **Camera photo on mobile** — use `<input type="file" accept="image/*" capture="environment">` which opens the camera app on mobile devices. No library needed.

---

### Sprint 1.4 — Wall Display, PWA & Photo Slideshow

---

#### Task 1.4.1 — Photo and album schema migration

Follow the same pattern as Task 1.1.5. Create SQLAlchemy models first, then autogenerate.

**Note:** The `album_photos` association table has a composite primary key: `(album_id, photo_id)`. SQLAlchemy handles this with `PrimaryKeyConstraint`.

---

#### Task 1.4.2 — Photo and album API

**How to do it:**

1. **HEIC support** — iPhones shoot HEIC by default. Install `pillow-heif` to add HEIC format support to Pillow:
   ```bash
   pip install pillow-heif
   ```
   ```python
   import pillow_heif
   pillow_heif.register_heif_opener()  # call once at module load
   # After this, Image.open() handles .heic files normally
   ```

2. **EXIF date extraction:**
   ```python
   from PIL import Image
   from PIL.ExifTags import TAGS
   
   def get_exif_date(path: str) -> datetime | None:
       try:
           with Image.open(path) as img:
               exif = img._getexif()
               if exif:
                   for tag_id, val in exif.items():
                       if TAGS.get(tag_id) == "DateTimeOriginal":
                           return datetime.strptime(val, "%Y:%m:%d %H:%M:%S")
       except Exception:
           return None
   ```

3. **Static file serving** — mount the photos directory in `main.py`:
   ```python
   from fastapi.staticfiles import StaticFiles
   app.mount("/photos", StaticFiles(directory="/data/photos"), name="photos")
   ```
   URLs like `/photos/originals/abc.jpg` serve the file directly.

---

#### Task 1.4.3 — Photo album management UI

**How to do it:**

1. **Masonry grid** — use CSS Grid with `grid-auto-rows` for a clean responsive photo grid. No library needed for a basic implementation:
   ```css
   .photo-grid {
     display: grid;
     grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
     gap: 4px;
   }
   ```

2. **Full-screen viewer** — build it as a portal-rendered overlay. Use `swiper` or `@use-gesture/react` for swipe navigation between photos.

3. **Multi-file upload** — show a progress bar per file. Since the API takes one file per request, upload files sequentially (not in parallel) to avoid overwhelming the Pi's CPU with simultaneous thumbnail generation jobs.

---

#### Task 1.4.4 — Wall display route (`/wall`)

**How to do it:**

1. **Full-screen layout** — the `/wall` route should render its own root HTML structure with `overflow: hidden` and no scrollbars. Use a CSS Grid layout for the panel arrangement:
   ```css
   .wall-layout {
     display: grid;
     grid-template-columns: 1fr 1fr;
     grid-template-rows: auto 1fr;
     height: 100vh;
     overflow: hidden;
   }
   ```

2. **Live clock** — use `useEffect` with `setInterval`:
   ```tsx
   const [now, setNow] = useState(new Date())
   useEffect(() => {
     const id = setInterval(() => setNow(new Date()), 1000)
     return () => clearInterval(id)
   }, [])
   ```

3. **Idle mode detection:**
   ```tsx
   const idleTimer = useRef<NodeJS.Timeout>()
   
   const resetIdle = useCallback(() => {
     clearTimeout(idleTimer.current)
     setIsIdle(false)
     idleTimer.current = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT_MS)
   }, [])
   
   useEffect(() => {
     document.addEventListener('touchstart', resetIdle)
     document.addEventListener('mousemove', resetIdle)
     resetIdle()
     return () => {
       document.removeEventListener('touchstart', resetIdle)
       document.removeEventListener('mousemove', resetIdle)
     }
   }, [resetIdle])
   ```

4. **Photo slideshow transition** — use CSS transitions with a state machine (currentPhoto, nextPhoto, transitionState):
   ```tsx
   // "fade" transition: fade out old, fade in new
   // Use CSS opacity transitions, not JS animation libraries
   ```

5. **Quick complete overlay** — render as a full-screen semi-transparent overlay. Show family member avatar buttons (64×64px minimum). If PIN required, show the PIN pad after member selection. On success, play a brief success animation (green checkmark scale-up) and close.

6. **Test on actual hardware early** — connect a monitor to the Pi and load `/wall` as soon as the basic layout is rendered. Font sizes, touch target sizes, and layout proportions all look very different on a wall screen than in a browser window.

---

#### Task 1.4.5 — WebSocket endpoint

**How to do it:**

1. **FastAPI native WebSockets** — no extra library needed:
   ```python
   from fastapi import WebSocket, WebSocketDisconnect
   
   class ConnectionManager:
       def __init__(self):
           self.active: list[WebSocket] = []
       
       async def connect(self, ws: WebSocket):
           await ws.accept()
           self.active.append(ws)
       
       def disconnect(self, ws: WebSocket):
           self.active.remove(ws)
       
       async def broadcast(self, message: dict):
           dead = []
           for ws in self.active:
               try:
                   await ws.send_json(message)
               except Exception:
                   dead.append(ws)
           for ws in dead:
               self.active.remove(ws)
   
   manager = ConnectionManager()
   
   @router.websocket("/api/ws/wall")
   async def wall_ws(websocket: WebSocket):
       await manager.connect(websocket)
       try:
           while True:
               await websocket.receive_text()  # keep alive
       except WebSocketDisconnect:
           manager.disconnect(websocket)
   ```

2. **Emit events from service layer** — import `manager` in your task service and call `await manager.broadcast({"type": "task_updated", ...})` after a task completion is saved.

3. **Frontend WebSocket client** with polling fallback:
   ```tsx
   useEffect(() => {
     const ws = new WebSocket('wss://familyhub.local/api/ws/wall')
     ws.onmessage = (e) => {
       const msg = JSON.parse(e.data)
       if (msg.type === 'task_updated') queryClient.invalidateQueries(['tasks'])
     }
     ws.onerror = () => {
       // Start polling fallback
       const id = setInterval(() => queryClient.invalidateQueries(['tasks']), 60000)
       return () => clearInterval(id)
     }
     return () => ws.close()
   }, [])
   ```

---

#### Task 1.4.6 — PWA: service worker, install flow, offline mode

**How to do it:**

1. **Complete Reminder 3 first** — trust the Caddy cert on test devices before testing the PWA install prompt.

2. **Vite PWA plugin** does most of the heavy lifting. The key workbox config:
   ```ts
   workbox: {
     navigateFallback: '/index.html',
     navigateFallbackDenylist: [/^\/api/, /^\/photos/],
     runtimeCaching: [
       { urlPattern: /^\/api\/auth\/me/, handler: 'NetworkFirst', options: { cacheName: 'auth' } },
       { urlPattern: /^\/api\/users/, handler: 'NetworkFirst', options: { cacheName: 'users' } },
       { urlPattern: /^\/api\/tasks/, handler: 'NetworkFirst', options: { cacheName: 'tasks' } },
       { urlPattern: /^\/api\/calendar\/events/, handler: 'NetworkFirst', options: { cacheName: 'events' } },
     ]
   }
   ```
   `navigateFallbackDenylist` prevents the service worker from intercepting API and photo requests and serving stale HTML instead.

3. **`beforeinstallprompt` for Chrome/Android:**
   ```tsx
   const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
   
   useEffect(() => {
     window.addEventListener('beforeinstallprompt', (e) => {
       e.preventDefault()
       setInstallPrompt(e as BeforeInstallPromptEvent)
     })
   }, [])
   
   const handleInstall = async () => {
     if (!installPrompt) return
     await installPrompt.prompt()
     setInstallPrompt(null)
   }
   ```

4. **iOS install guide modal** — detect iOS:
   ```tsx
   const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
   const isStandalone = window.matchMedia('(display-mode: standalone)').matches
   const showIOSGuide = isIOS && !isStandalone && !localStorage.getItem('ios-guide-shown')
   ```
   Show a simple modal with a screenshot or animation of the Share button → "Add to Home Screen" steps.

---

#### Task 1.4.7 — Dashboard (Phase 1)

**How to do it:**

1. **Widget independence** — each widget is its own component with its own TanStack Query `useQuery` call. Use `Suspense` with individual fallback skeletons so one slow widget doesn't block the others from rendering.

2. **Child mode detection:**
   ```tsx
   const { user } = useAuthStore()
   if (user.ui_mode === 'child') return <ChildDashboard />
   return <StandardDashboard />
   ```

3. **Child mode task cards** — make the checkmark button the dominant UI element. The entire right third of the card should be the tap target for completing the task.

---

#### Task 1.4.8 — Kiosk boot documentation

**How to do it:**

Create `docs/wall-screen-setup.md` with these exact steps:

1. Flash Raspberry Pi OS Desktop (64-bit) to SD card using Raspberry Pi Imager
2. Enable SSH in Imager settings; set hostname to `familyhub`; set username and password
3. Boot, SSH in, run:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y chromium-browser unclutter
   ```
4. Disable screen blanking: add to `/etc/xdg/lxsession/LXDE-pi/autostart`:
   ```
   @xset s off
   @xset -dpms
   @xset s noblank
   ```
5. Create autostart entry `/etc/xdg/autostart/kiosk.desktop`:
   ```ini
   [Desktop Entry]
   Type=Application
   Name=FamilyHub Kiosk
   Exec=chromium-browser --kiosk --noerrdialogs --disable-infobars \
     --disable-session-crashed-bubble --touch-events=enabled \
     --disable-pinch --overscroll-history-navigation=0 \
     http://familyhub.local/wall
   ```
6. Install `unclutter` to hide the cursor on touch-only displays:
   ```
   @unclutter -idle 0.5 -root
   ```
7. Trust the Caddy self-signed cert following Reminder 3 above
8. Reboot — Chromium should launch automatically to `/wall`

---

#### Task 1.4.9 — Automated daily backup job

**How to do it:**

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from pathlib import Path
import shutil
from datetime import datetime

@scheduler.scheduled_job('cron', hour=3, minute=0)
async def daily_backup():
    db_path = Path("/data/db/familyhub.db")
    backup_dir = Path("/data/backups")
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    date_str = datetime.now().strftime("%Y-%m-%d")
    dest = backup_dir / f"familyhub_{date_str}.db"
    
    # SQLite-safe copy (using backup API to avoid corruption mid-write)
    import sqlite3
    src_conn = sqlite3.connect(str(db_path))
    dest_conn = sqlite3.connect(str(dest))
    src_conn.backup(dest_conn)
    src_conn.close()
    dest_conn.close()
    
    # Prune old backups
    retention = settings.backup_retention_days
    all_backups = sorted(backup_dir.glob("familyhub_*.db"))
    for old in all_backups[:-retention]:
        old.unlink()
```

Using `sqlite3.backup()` (Python's built-in) rather than `shutil.copy()` ensures the backup is consistent even if there are pending writes.

---

#### Task 1.4.10 — Phase 1 integration tests and Pi hardware testing

**How to do it:**

1. **Automated tests** — add integration test files for each router (`test_auth.py`, `test_tasks.py`, etc.) following the `conftest.py` pattern from Task 1.1.6.

2. **Pi hardware test checklist** — run through manually on the actual hardware before declaring Phase 1 complete:

   ```
   Hardware test checklist:
   [ ] docker compose up -d completes in under 3 minutes on Pi 4
   [ ] https://familyhub.local loads in under 3 seconds (cold)
   [ ] Setup wizard completes successfully
   [ ] Admin login with password works
   [ ] Child login with PIN works; 6th wrong PIN shows lockout message
   [ ] Add a Google Calendar → events appear within 15 min
   [ ] Create a task; assign to family member; mark complete from phone PWA
   [ ] Wall display at /wall shows clock, events, chore status
   [ ] Idle slideshow activates after 5 min; touch returns to wall
   [ ] Quick complete on wall (tap chore → select member → mark done)
   [ ] Wall updates within 5 seconds of phone completing a task (WebSocket test)
   [ ] PWA install on Android Chrome
   [ ] PWA install on iOS Safari (Add to Home Screen)
   [ ] Offline: turn off Pi → app loads from cache → offline banner shows
   [ ] Pi reboot: all containers start automatically; no data lost
   [ ] Backup file appears in ./data/backups/ (trigger manually for test)
   [ ] API response time for /api/tasks < 200ms (check with Chrome DevTools Network tab)
   [ ] Memory usage: docker stats shows total memory < 300MB
   ```

---

## Quick Reference — Secret Generation Commands

| Secret | Generate with |
|---|---|
| `SECRET_KEY` | `openssl rand -hex 32` |
| VAPID keys | `python -c "from py_vapid import Vapid; v=Vapid(); v.generate_keys(); print('PUB:', v.public_key, '\nPRIV:', v.private_key)"` |
| Google OAuth credentials | Google Cloud Console → Credentials |
| Microsoft OAuth credentials | Azure Portal → App registrations |
| Apple app-specific password | appleid.apple.com → Sign-In and Security → App-Specific Passwords |

## Quick Reference — Where Each Secret Is Used

| Secret | Used in |
|---|---|
| `SECRET_KEY` | JWT signing, AES encryption key derivation for stored OAuth tokens |
| `VAPID_PUBLIC_KEY` | Frontend: passed to `pushManager.subscribe()` |
| `VAPID_PRIVATE_KEY` | Backend: `pywebpush` sends push notifications |
| `GOOGLE_CLIENT_ID/SECRET` | Backend: Google OAuth flow (Task 1.3.3) |
| `MICROSOFT_CLIENT_ID/SECRET` | Backend: Microsoft OAuth flow (Sprint 2.1) |
| Apple app-specific password | Stored encrypted in DB after user enters it in calendar settings (Sprint 2.1) |

---

*Dev Guide v1.0 — Phase 1*
*Update this document when Sprints 2.1 (Microsoft/Apple calendar setup) begin*
