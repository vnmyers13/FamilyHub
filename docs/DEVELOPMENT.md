# FamilyHub Development Guide

## Overview

This guide provides instructions for setting up FamilyHub for local development. Two approaches are available:
- **Option A: Docker** (recommended for consistency)
- **Option B: Local** (faster iteration)

## Prerequisites

### System Requirements
- Git 2.40+
- 4GB RAM minimum
- 2GB disk space

### Technology Stack
- **Backend:** Python 3.12.4, FastAPI 0.104.1, SQLAlchemy 2.0.23, aiosqlite 0.19.0
- **Frontend:** Node 20.11.0 LTS, React 18.2.0, TypeScript 5.3.3, Vite 5.0.8
- **Database:** SQLite (file-based)
- **Caching:** In-Memory (cachetools)
- **Jobs:** APScheduler (in-process)

## Option A: Docker Development (Recommended)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/vnmyers13/FamilyHub.git
   cd FamilyHub
   ```

2. **Copy environment template**
   ```bash
   cp .env.example .env
   ```

3. **Build and start services**
   ```bash
   docker-compose up --build
   ```

4. **Verify services are running**
   - Backend: http://localhost:8000
   - Frontend: http://localhost:5173
   - API Docs: http://localhost:8000/docs

### Development Workflow

- **Code changes:** Docker volumes mount your local code
- **Backend changes:** Backend container auto-reloads on file changes
- **Frontend changes:** Vite dev server auto-refreshes on file changes
- **Database:** SQLite file persists in `data/` directory

### Running Tests

```bash
# Backend tests
docker-compose exec backend pytest

# Backend tests with coverage
docker-compose exec backend pytest --cov=app

# Frontend tests
docker-compose exec frontend npm test

# All tests
docker-compose exec backend pytest && docker-compose exec frontend npm test
```

### Stopping Services

```bash
docker-compose down

# With data cleanup
docker-compose down -v
```

## Option B: Local Development

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/vnmyers13/FamilyHub.git
   cd FamilyHub
   ```

2. **Copy environment template**
   ```bash
   cp .env.example .env
   ```

3. **Python Backend Setup**
   ```bash
   # Create virtual environment
   python3.12 -m venv backend/venv

   # Activate virtual environment
   source backend/venv/bin/activate  # macOS/Linux
   # or
   backend\venv\Scripts\activate  # Windows

   # Install dependencies
   pip install -r backend/requirements.txt
   ```

4. **Node Frontend Setup**
   ```bash
   # Install Node dependencies
   cd frontend
   npm install
   cd ..
   ```

### Starting Services

1. **Backend (Terminal 1)**
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Frontend (Terminal 2)**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Running Tests

```bash
# Backend tests (from backend directory with venv activated)
pytest

# Backend tests with coverage
pytest --cov=app --cov-report=html

# Frontend tests (from frontend directory)
npm test

# Frontend tests with coverage
npm run test:coverage

# Type checking
cd backend && mypy app --strict
cd ../frontend && npm run type-check
```

## Code Quality

### Linting

```bash
# Frontend linting
cd frontend && npm run lint

# Backend linting
cd backend && ruff check .
```

### Code Formatting

```bash
# Frontend formatting
cd frontend && npx prettier --write src/

# Backend formatting
cd backend && black app/
```

### Type Checking

```bash
# Frontend
cd frontend && npm run type-check

# Backend
cd backend && mypy app --strict
```

## Database Management

### Running Migrations

SQLite is used for development. No migration tool is configured yet; models are created via SQLAlchemy on startup.

### Database Location

- **Docker:** `data/familyhub.db`
- **Local:** Create in current directory or specify in `.env`

## API Documentation

OpenAPI spec is available at:
- **Interactive Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json
- **Local copy:** `docs/openapi.json`

## Testing Strategy

### Test Coverage Targets

- **Backend:** 80%+ coverage on services layer
- **Frontend:** 75%+ coverage on components

### Test Organization

- **Backend:** `backend/tests/` (unit and integration)
- **Frontend:** `frontend/src/**/*.test.tsx` (component tests)

### Running Specific Tests

```bash
# Backend: single file
pytest tests/test_auth.py

# Backend: specific test
pytest tests/test_auth.py::test_login_success

# Frontend: single file
npm test Login.test.tsx

# Frontend: watch mode
npm run test:watch
```

## Environment Variables

See `.env.example` for all available variables. Key variables for development:

```env
# Backend
DEBUG=True
SECRET_KEY=dev-key-change-in-production
DATABASE_URL=sqlite:///./familyhub.db

# Frontend
VITE_API_URL=http://localhost:8000/api
```

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process using port 8000
lsof -ti:8000 | xargs kill -9

# Or change port in uvicorn command
uvicorn app.main:app --reload --port 8001
```

### Virtual Environment Issues

```bash
# Deactivate and recreate
deactivate
rm -rf backend/venv
python3.12 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt
```

### Node Module Issues

```bash
# Clear cache and reinstall
rm -rf frontend/node_modules
npm ci
```

### Database Issues

```bash
# Reset database (removes all data)
rm data/familyhub.db
# Restart backend to recreate

# Or for local development
rm familyhub.db
```

## Debugging

### Backend Debugging

```bash
# With print statements
print(f"Debug: {variable}")

# With Python debugger
import pdb; pdb.set_trace()

# With logging
import logging
logger = logging.getLogger(__name__)
logger.debug(f"Debug message: {data}")
```

### Frontend Debugging

- **Browser DevTools:** F12 or Cmd+Option+I
- **VSCode Debugger:** See `.vscode/launch.json` (if configured)
- **Console logging:**
  ```typescript
  console.log('Debug:', variable);
  ```

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Write tests for new functionality
3. Ensure tests pass: `npm test` and `pytest`
4. Ensure code is formatted and linted
5. Create pull request

## Performance Optimization (Local Only)

### Frontend
- Vite dev server enables fast HMR (Hot Module Replacement)
- React DevTools extension for component debugging

### Backend
- FastAPI auto-reload for development
- Enable SQL logging: `SQLALCHEMY_ECHO=True` in `.env`

## Next Steps

After setup:
1. Read `FamilyHub_Implementation_Plan_v2.0.md` for feature roadmap
2. Check `docs/openapi.json` for API endpoints
3. Run tests to verify setup: `pytest && npm test`
4. Start with Phase 1.1 tasks from implementation plan
