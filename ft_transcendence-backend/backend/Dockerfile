FROM node:20-bookworm-slim AS base
WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# ─────────────────────────────────────────────
# Development stage
# ─────────────────────────────────────────────
FROM base AS development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# ─────────────────────────────────────────────
# Build stage
# ─────────────────────────────────────────────
FROM base AS builder
RUN npm install
COPY . .
RUN npm run build
# Dev bağımlılıklarını kaldır
RUN npm prune --production

# ─────────────────────────────────────────────
# Production stage — Debian slim (glibc uyumlu, musl sorunu yok)
# ─────────────────────────────────────────────
FROM node:20-bookworm-slim AS production
WORKDIR /app

# Runtime native deps
RUN apt-get update && apt-get install -y python3 make g++ wget && rm -rf /var/lib/apt/lists/*

# Copy package files and dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Install production dependencies (rebuilds native modules for this platform)
RUN npm ci --only=production

RUN mkdir -p uploads/avatars certs logs

# Copy the database files properly (including migrations folder)
COPY database ./database

RUN chown -R node:node /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider --no-check-certificate https://localhost:3000/health || exit 1

CMD ["node", "dist/app.js"]
