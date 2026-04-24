# PURPOSE: Production Docker image for FamilyHub FastAPI backend
# ROLE: Backend Infrastructure
# MODIFIED: 2026-04-24 — Phase 1.1 Docker setup

FROM python:3.12.4-slim

LABEL org.opencontainers.image.title="FamilyHub Backend"
LABEL org.opencontainers.image.version="1"
LABEL org.opencontainers.image.description="FastAPI backend for FamilyHub family organization system"

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create data directory for SQLite and uploads
RUN mkdir -p /data/db /data/photos /data/backups

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
