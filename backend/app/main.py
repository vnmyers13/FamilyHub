# PURPOSE: FastAPI application entry point for FamilyHub
# ROLE: Backend
# MODIFIED: 2026-04-24 — Phase 1.1 setup

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import init_db, close_db
from app.routers import health

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# CORS middleware
allowed_hosts = settings.allowed_hosts.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_hosts if not settings.debug else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=404,
        content={"error": "not_found", "message": f"Path {request.url.path} not found"},
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "internal_error", "message": "Internal server error"},
    )


# Include routers
app.include_router(health.router)

# Import auth and users routers
from app.routers import auth as auth_router
from app.routers import users as users_router
app.include_router(auth_router.router)
app.include_router(users_router.router)


# Root endpoint
@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.app_name} API"}
