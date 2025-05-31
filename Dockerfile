# Use Node.js 20 LTS as base image
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application from base stage
COPY --from=base --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=nextjs:nodejs /app/package*.json ./
COPY --from=base --chown=nextjs:nodejs /app/dist ./dist
COPY --from=base --chown=nextjs:nodejs /app/client ./client
COPY --from=base --chown=nextjs:nodejs /app/shared ./shared
COPY --from=base --chown=nextjs:nodejs /app/drizzle.config.ts ./
COPY --from=base --chown=nextjs:nodejs /app/vite.config.ts ./
COPY --from=base --chown=nextjs:nodejs /app/tailwind.config.ts ./
COPY --from=base --chown=nextjs:nodejs /app/postcss.config.js ./
COPY --from=base --chown=nextjs:nodejs /app/tsconfig.json ./
COPY --from=base --chown=nextjs:nodejs /app/components.json ./

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/auth/user || exit 1

# Start the application
CMD ["npm", "start"]