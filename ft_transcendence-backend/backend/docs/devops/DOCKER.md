# 🐳 Docker Yapılandırması

Backend'in Docker ile nasıl çalıştırılacağını anlatan rehber.

---

## 📋 İçindekiler

1. [Hızlı Başlangıç](#hızlı-başlangıç)
2. [Dockerfile Açıklaması](#dockerfile-açıklaması)
3. [Docker Compose](#docker-compose)
4. [Volume ve Data](#volume-ve-data)
5. [Environment](#environment)

---

## Hızlı Başlangıç

### Development

```bash
# Image build et
docker build --target development -t ft-backend:dev .

# Container çalıştır
docker run -d \
  --name ft-backend \
  -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  --env-file .env \
  ft-backend:dev
```

### Production

```bash
# Production image build et
docker build --target production -t ft-backend:prod .

# Container çalıştır
docker run -d \
  --name ft-backend \
  -p 3000:3000 \
  -v ft-data:/app/database \
  -v ft-uploads:/app/uploads \
  -v ./certs:/app/certs:ro \
  --env-file .env.production \
  ft-backend:prod
```

---

## Dockerfile Açıklaması

### Multi-Stage Build

```dockerfile
# Base stage - ortak bağımlılıklar
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 make g++  # better-sqlite3 için
COPY package*.json ./

# Development stage
FROM base AS development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# Builder stage - TypeScript derleme
FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
RUN mkdir -p database uploads/avatars certs
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost:3000/health || exit 1
CMD ["node", "dist/app.js"]
```

### Stage'ler

| Stage | Amaç | Boyut |
|-------|------|-------|
| `base` | Ortak bağımlılıklar | - |
| `development` | Hot reload ile geliştirme | ~500MB |
| `builder` | TypeScript derleme | - |
| `production` | Minimal production image | ~200MB |

---

## Docker Compose

### Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: .
      target: development
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    env_file:
      - .env
    restart: unless-stopped
```

```bash
docker-compose up -d
```

### Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  backend:
    build:
      context: .
      target: production
    ports:
      - "3000:3000"
    volumes:
      - database:/app/database
      - uploads:/app/uploads
      - ./certs:/app/certs:ro
    env_file:
      - .env.production
    restart: always
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3

volumes:
  database:
  uploads:
```

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## Volume ve Data

### Kritik Dizinler

| Dizin | İçerik | Persist? |
|-------|--------|----------|
| `/app/database` | SQLite database | ✅ |
| `/app/uploads` | Avatar resimleri | ✅ |
| `/app/certs` | SSL sertifikaları | ✅ (read-only) |
| `/app/logs` | Log dosyaları | Opsiyonel |

### Named Volumes

```bash
# Volume oluştur
docker volume create ft-database
docker volume create ft-uploads

# Volume inspect
docker volume inspect ft-database

# Backup
docker run --rm -v ft-database:/data -v $(pwd):/backup alpine \
  tar czf /backup/database-backup.tar.gz /data
```

### Bind Mounts (Development)

```bash
docker run -v $(pwd):/app ...  # Tüm proje
docker run -v $(pwd)/certs:/app/certs:ro ...  # SSL certs (readonly)
```

---

## Environment

### .env Dosyası Kullanımı

```bash
# Docker run ile
docker run --env-file .env ft-backend:prod

# Docker-compose ile (varsayılan)
# docker-compose otomatik olarak .env dosyasını okur
```

### Tek Tek Environment Variable

```bash
docker run \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret \
  -e PORT=3000 \
  ft-backend:prod
```

### Production Environment Örneği

```env
# .env.production
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_PATH=/app/database/transcendence.db
JWT_SECRET=<production-secret-64-chars>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CORS_ORIGIN=https://yourdomain.com
SSL_KEY_PATH=/app/certs/key.pem
SSL_CERT_PATH=/app/certs/cert.pem
```

---

## Yararlı Komutlar

```bash
# Container durumunu kontrol et
docker ps

# Logları görüntüle
docker logs ft-backend -f

# Container'a bağlan
docker exec -it ft-backend sh

# Container yeniden başlat
docker restart ft-backend

# Container sil
docker rm -f ft-backend

# Image sil
docker rmi ft-backend:prod

# Dangling images temizle
docker image prune
```

---

*Son Güncelleme: Ocak 2026*
