# Production Dockerfile for Project Eklavya (Full-Stack Vite + Express)
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json bun.lock* ./
RUN npm ci

# Copy source files
COPY . .

# Build Vite frontend assets
RUN npm run build

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install only production dependencies + tsx for runtime
COPY package*.json ./
RUN npm ci --omit=dev && npm install -g tsx

# Copy built frontend assets and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/SAMPLE_DATA.json ./SAMPLE_DATA.json
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["tsx", "server.ts"]
