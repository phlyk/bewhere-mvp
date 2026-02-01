# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S etl -u 1001

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Create cache directory for downloaded files
RUN mkdir -p /app/cache && chown etl:nodejs /app/cache

# Set ownership
RUN chown -R etl:nodejs /app
USER etl

# Default command (can be overridden)
CMD ["node", "dist/index.js"]
