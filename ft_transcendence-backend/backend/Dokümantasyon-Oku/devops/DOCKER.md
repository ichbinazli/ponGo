# 🐳 Docker

Docker yapılandırması.

---

## Hızlı Başlangıç

### Development

```bash
docker build --target development -t ft-backend:dev .
docker run -d -p 3000:3000 -v $(pwd):/app --env-file .env ft-backend:dev
```

### Production

```bash
docker build --target production -t ft-backend:prod .
docker run -d -p 3000:3000 \
  -v ft-data:/app/database \
  -v ./certs:/app/certs:ro \
  --env-file .env.production \
  ft-backend:prod
```

---

## Dockerfile

Multi-stage build:

| Stage | Amaç | Boyut |
|-------|------|-------|
| `base` | Ortak bağımlılıklar | - |
| `development` | Hot reload | ~500MB |
| `production` | Minimal image | ~200MB |

---

## Docker Compose

### Development

```yaml
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
```

### Production

```yaml
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

volumes:
  database:
  uploads:
```

---

## Volumes

| Dizin | İçerik | Persist |
|-------|--------|---------|
| `/app/database` | SQLite DB | ✅ |
| `/app/uploads` | Avatarlar | ✅ |
| `/app/certs` | SSL | ✅ (ro) |

---

## Komutlar

```bash
docker ps                     # Container'ları listele
docker logs ft-backend -f     # Logları takip et
docker exec -it ft-backend sh # Container'a bağlan
docker restart ft-backend     # Yeniden başlat
```

---

*Son Güncelleme: Ocak 2026*
