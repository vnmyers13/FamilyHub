# FamilyHub Development Guide

## Project Overview
FamilyHub is a comprehensive family organization system featuring:
- **Backend:** FastAPI (Python) with SQLAlchemy ORM
- **Frontend:** React + TypeScript + Vite
- **Deployment:** Docker + Docker Compose + Caddy
- **Key Features:** Wall display, Google Calendar sync, task management, PWA

**Repository:** https://github.com/vnmyers13/FamilyHub

---

## Release Protocol

**Every release to GitHub, Docker Hub, and production must follow these steps in order.**
**Do not publish until all steps are complete.**

### Step 1: Bump Version
- Edit `VERSION` file (single line, e.g., `1`, `2`, `3` — increment by 1 per release)
- Update `backend/Dockerfile` — set `org.opencontainers.image.version` label to match new version
- Update `frontend/Dockerfile` — set `org.opencontainers.image.version` label to match new version
- Update `docker-compose.yml` — update image tags if using version tags

### Step 2: Update All Documentation
Update the following files to reflect completed features and current state:

#### `README.md` (Primary documentation)
- [ ] Update feature list to match completed functionality
- [ ] Update quick-start instructions if setup changed
- [ ] Update prerequisites (Node, Python, Docker versions)
- [ ] Add any new environment variables to the example section
- [ ] Update deployment instructions if changed

#### `FamilyHub_Implementation_Plan_v1.0.md` (Progress tracking)
- [ ] Mark completed sprints/tasks with ✅
- [ ] Move in-progress tasks to "Currently Working On" section
- [ ] Update timeline if schedule changed
- [ ] Add new sprints/phases if discovered
- [ ] Note any architectural changes made

#### `FamilyHub_DevGuide_Phase1.md` (Development guide)
- [ ] Update code examples if patterns changed
- [ ] Add new setup instructions if needed
- [ ] Document new API endpoints or database models
- [ ] Update component hierarchy if frontend structure changed
- [ ] Add troubleshooting section for common issues

#### `.env.example` (Environment template)
- [ ] Add any new required environment variables
- [ ] Update descriptions for clarity
- [ ] Remove deprecated variables
- [ ] Add comments for variables that need specific formats

#### `docker-compose.yml` and `config/Caddyfile.example`
- [ ] Update service versions if dependencies upgraded
- [ ] Update port mappings if changed
- [ ] Document any new services added

### Step 3: Run Tests
- [ ] Run `pytest` for backend unit tests — ensure 100% pass
- [ ] Run `npm test` for frontend unit tests — ensure 100% pass
- [ ] Run integration tests if they exist
- [ ] Manually test core features:
  - [ ] Wall display loads correctly
  - [ ] Calendar sync works
  - [ ] Task creation/assignment works
  - [ ] PWA installation works

### Step 4: Commit Changes
```bash
git add .
git commit -m "Release v{VERSION}: {Feature summary}

{Detailed changelog}

Changes:
- {Feature 1}
- {Feature 2}
- {Bug fix 1}
- {Improvement 1}"
```

### Step 5: Tag Release
```bash
git tag -a v{VERSION} -m "Release v{VERSION}: {Feature summary}"
git push origin master --tags
```

### Step 6: Build and Publish Docker Images
If Dockerfile(s) exist:

```bash
# Build multi-architecture images (requires buildx)
docker buildx build --platform linux/amd64,linux/arm64 \
  -t vnmyers13/familyhub-backend:v{VERSION} \
  -t vnmyers13/familyhub-backend:latest \
  --push backend/

docker buildx build --platform linux/amd64,linux/arm64 \
  -t vnmyers13/familyhub-frontend:v{VERSION} \
  -t vnmyers13/familyhub-frontend:latest \
  --push frontend/

# Or single-platform if buildx not available:
docker build -t vnmyers13/familyhub-backend:v{VERSION} backend/
docker push vnmyers13/familyhub-backend:v{VERSION}
docker build -t vnmyers13/familyhub-frontend:v{VERSION} frontend/
docker push vnmyers13/familyhub-frontend:v{VERSION}
```

### Step 7: Create GitHub Release
```bash
gh release create v{VERSION} \
  --title "FamilyHub v{VERSION}" \
  --notes "See CHANGELOG.md for detailed changes"
```

---

## File Purpose Labels (Required for all releases)

Add these labels to the top of key files:

```python
# PURPOSE: [Brief description of what this file does]
# ROLE: [Backend/Frontend/Infrastructure/Database]
# MODIFIED: [YYYY-MM-DD] — [What changed]
```

### Backend Files
- `backend/app/main.py` — FastAPI application entry point
- `backend/app/core/config.py` — Configuration management
- `backend/app/models/` — SQLAlchemy ORM models
- `backend/app/schemas/` — Pydantic request/response schemas
- `backend/app/services/` — Business logic layer
- `backend/app/routers/` — API route handlers
- `backend/Dockerfile` — Docker image for FastAPI backend

### Frontend Files
- `frontend/src/main.tsx` — React application entry point
- `frontend/src/App.tsx` — Root component
- `frontend/src/components/` — Reusable UI components
- `frontend/src/pages/` — Route-level page components
- `frontend/src/api/` — TanStack Query API clients
- `frontend/src/stores/` — Zustand global state
- `frontend/Dockerfile` — Docker image for React frontend

### Infrastructure
- `docker-compose.yml` — Multi-container orchestration
- `config/Caddyfile` — Reverse proxy configuration
- `.env.example` — Environment variable template
- `.gitignore` — Git ignore patterns

### Documentation
- `README.md` — Project overview and quick-start
- `FamilyHub_Implementation_Plan_v1.0.md` — Development roadmap
- `FamilyHub_DevGuide_Phase1.md` — Developer setup and patterns
- `VERSION` — Current release version

---

## Development Workflow

### Creating a New Feature
1. Create a feature branch: `git checkout -b feature/wall-display-improvements`
2. Follow implementation plan sprint tasks
3. Write tests for new functionality
4. Update `.env.example` if adding new variables
5. Create a pull request with detailed description
6. Merge to master after code review

### Fixing a Bug
1. Create a bugfix branch: `git checkout -b bugfix/calendar-sync-timeout`
2. Write a test that reproduces the bug
3. Fix the bug
4. Ensure test passes
5. Update relevant documentation
6. Create a pull request

### Code Standards
- **Python:** Follow PEP 8, use type hints
- **TypeScript:** Use strict mode, aim for no `any` types
- **Components:** Prefer functional components with hooks
- **State:** Use Zustand for global state, React Query for server state

---

## Important Notes

- **Secrets:** Never commit `.env` files. Use `.env.example` for templates.
- **Docker:** Always test images locally before pushing to registry.
- **Versioning:** Increment by 1 per release (v1, v2, v3, etc.)
- **Tags:** Use semantic versioning format: `v{VERSION}`
- **Tests:** Ensure all tests pass before releasing.
