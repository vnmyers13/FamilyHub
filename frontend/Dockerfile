# FamilyHub Frontend Web
# Version: 1.03
# Date: 2026-05-01

# ──────────────────────────────────────────────
# Stage 1: Build
# ──────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json tsconfig.json tsconfig.node.json vite.config.ts ./

# Install dependencies (including dev for build)
RUN npm install --ignore-scripts

# Copy source
COPY . .

# Build production bundle
RUN npm run build

# ──────────────────────────────────────────────
# Stage 2: Serve with Nginx
# ──────────────────────────────────────────────
FROM nginx:alpine

LABEL org.label-schema.name="familyhub-web" \
      org.label-schema.version="1.03" \
      org.label-schema.description="FamilyHub Frontend Web Server"

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend from build stage
COPY --from=build /app/dist/ /usr/share/nginx/html

# Set proper permissions for nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 3000

# Run as non-root nginx user
USER nginx

CMD ["nginx", "-g", "daemon off;"]
