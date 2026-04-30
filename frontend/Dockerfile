# FamilyHub Frontend Web
# Version: 1.01
# Date: 2026-04-30

FROM nginx:alpine

LABEL org.label-schema.name="familyhub-web" \
      org.label-schema.version="1.01" \
      org.label-schema.description="FamilyHub Frontend Web Server"

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend (or placeholder for scaffold)
COPY dist/ /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
