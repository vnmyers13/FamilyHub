# FamilyHub Release Plan

**Last Updated:** 2026-05-01
**Current Version:** 1.02 (on `develop` branch)

---

## Release Workflow

Every release follows this sequence:

### Phase 1: Prepare

1. **Increment version** — Update `VERSION` file (+0.01)
2. **Update all version references** — Search for old version string across codebase:
   - `VERSION`
   - `backend/app/main.py` (app version + root endpoint)
   - `backend/Dockerfile` (comment + ARG)
   - `frontend/Dockerfile` (comment + label)
   - `docker-compose.yml` (comment + build arg)
   - `backend/tests/test_smoke.py` (version assertion)
   - `README.md` (header)
   - `SOLO_DEV_ROADMAP.md` (version + history table)
   - `MEMORY.md` (version field)

### Phase 2: Test

3. **Run full test suite:**
   ```bash
   cd backend
   .venv/bin/pytest tests/ -v --cov=app --cov-report=term-missing
   ```
4. **Verify zero warnings** — No pytest warnings, no deprecation notices
5. **Verify coverage** — Target 80%+ (per roadmap)

### Phase 3: Document

6. **Update CHANGELOG.md** — Add section under `[Unreleased]` with:
   - Added / Changed / Fixed / Security entries
   - Move `[Unreleased]` block to dated version
   - Create fresh `[Unreleased]` stub
7. **Update SOLO_DEV_ROADMAP.md** — Add version row to history table
8. **Update README.md** — Version + status header
9. **Update MEMORY.md** — Version + sprint status

### Phase 4: Commit & Push

10. **Stage all changes:**
    ```bash
    git add -A
    ```
11. **Commit with conventional message:**
    ```bash
    git commit -m "feat: v<X.YZ> - <short description>"
    ```
12. **Push to develop branch:**
    ```bash
    git push origin develop
    ```

### Phase 5: Verify

13. **Confirm push succeeded** — Check GitHub for new commit on `develop`
14. **Verify branch builds** — (When Docker is available) run `docker compose up -d --build`
15. **Smoke test running stack** — `curl http://localhost:8000/api/health`

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `develop` | Active development, all releases land here first |
| `main` | Stable releases only (manual merge from develop after validation) |

**Rule:** Never push directly to `main`. All changes go through `develop`.

---

## Version Numbering

- Format: `MAJOR.MINOR` (e.g., `1.02`)
- Increment by `+0.01` for each release
- `MAJOR` increments only for breaking architectural changes
- Current: `1.02` → Next: `1.03`

---

## Quick Reference Commands

```bash
# Activate venv
cd backend && source .venv/bin/activate

# Run tests
pytest tests/ -v

# Run tests with coverage
pytest tests/ -v --cov=app --cov-report=term-missing

# Check for dependency vulnerabilities
pip-audit

# Lint with ruff
ruff check app/ tests/

# Build & run stack
docker compose up -d --build

# View logs
docker compose logs -f api

# Stop stack
docker compose down

# Commit & push release
git add -A && git commit -m "feat: v1.03 - <desc>" && git push origin develop
```
