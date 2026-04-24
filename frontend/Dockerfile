# PURPOSE: Production Docker image for FamilyHub React frontend
# ROLE: Frontend Infrastructure
# MODIFIED: 2026-04-24 — Phase 1.1 Docker setup

FROM node:20.11.0-alpine AS builder

LABEL org.opencontainers.image.title="FamilyHub Frontend"
LABEL org.opencontainers.image.version="1"
LABEL org.opencontainers.image.description="React + Vite frontend for FamilyHub (production)"

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Runtime stage
FROM nginx:1.27-alpine

WORKDIR /usr/share/nginx/html

# Copy built application from builder
COPY --from=builder /app/dist .

# Copy nginx configuration
RUN echo 'server { \
    listen 3000; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
