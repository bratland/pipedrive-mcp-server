# Use Node.js LTS version with Alpine for smaller image size
FROM --platform=linux/amd64 node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy TypeScript configuration and source files
COPY tsconfig.json ./
COPY src ./src

# Install dev dependencies for building
RUN npm install --only=development

# Build the TypeScript project
RUN npm run build

# Production stage
FROM --platform=linux/amd64 node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port (Cloud Run uses PORT environment variable)
EXPOSE 8080

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the authenticated MCP server for Cloud Run
CMD ["node", "dist/mcp-auth-server.js"]