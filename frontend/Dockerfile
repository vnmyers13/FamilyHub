# FamilyHub Frontend Web
# Version: 1.02
# Date: 2026-04-30

FROM nginx:alpine

LABEL org.label-schema.name="familyhub-web" \
      org.label-schema.version="1.02" \
      org.label-schema.description="FamilyHub Frontend Web Server"

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built frontend (or placeholder for scaffold)
COPY dist/ /usr/share/nginx/html

# Set proper permissions for nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 3000

# Run as non-root nginx user
USER nginx

CMD ["nginx", "-g", "daemon off;"]
