# Stage 1: Build React Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Container with Multi-Process Support
FROM node:18-slim 

# Install system tools and PM2
RUN apt-get update && \
    apt-get install -y lsof net-tools procps && \
    rm -rf /var/lib/apt/lists/* && \
    npm install -g pm2

WORKDIR /app

# Copy backend dependencies and code
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy host-agent dependencies and code
COPY host-agent/package*.json ./host-agent/
RUN cd host-agent && npm install --production

# Copy all source code
COPY backend/ ./backend/
COPY host-agent/ ./host-agent/

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy PM2 ecosystem configuration
COPY ecosystem.config.js ./

# Expose ports
EXPOSE 3001 3002

# Set environment to production
ENV NODE_ENV=production

# Start both processes with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
