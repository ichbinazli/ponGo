FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./

FROM base AS development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS builder
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force
COPY --from=builder /app/dist ./dist
RUN mkdir -p uploads/avatars logs
RUN chown -R node:node /app
USER node
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1
CMD ["node", "dist/app.js"]
