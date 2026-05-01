# FamilyHub API Backend
# Version: 1.02
# Date: 2026-04-30

FROM python:3.12-alpine

ARG APP_VERSION="1.02"
LABEL org.label-schema.name="familyhub-api" \
      org.label-schema.version="${APP_VERSION}" \
      org.label-schema.description="FamilyHub API Backend"

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Ensure data directories exist and are owned by appuser
RUN mkdir -p /data/db /data/photos /data/backups && chown -R appuser:appgroup /data

# Switch to non-root user
USER appuser

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
