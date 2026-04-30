# FamilyHub API Backend
# Version: 1.01
# Date: 2026-04-30

FROM python:3.12-alpine

ARG APP_VERSION="1.01"
LABEL org.label-schema.name="familyhub-api" \
      org.label-schema.version="${APP_VERSION}" \
      org.label-schema.description="FamilyHub API Backend"

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure data directories exist
RUN mkdir -p /data/db /data/photos /data/backups

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
