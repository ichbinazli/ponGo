# Tech Context: ft_transcendence Backend

## Teknoloji Stack

### Runtime & Framework
| Teknoloji | Versiyon | Açıklama |
|-----------|----------|----------|
| Node.js | LTS (20.x+) | JavaScript runtime |
| Fastify | 4.x | Web framework (zorunlu) |
| TypeScript | 5.x | Tip güvenliği |

### Veritabanı
| Teknoloji | Versiyon | Açıklama |
|-----------|----------|----------|
| SQLite | 3.x | Embedded veritabanı (zorunlu) |
| better-sqlite3 | latest | Node.js SQLite driver |

### Kimlik Doğrulama
| Teknoloji | Açıklama |
|-----------|----------|
| @fastify/jwt | JWT token yönetimi |
| @fastify/oauth2 | OAuth 2.0 entegrasyonu |
| otplib | 2FA TOTP üretimi |
| qrcode | 2FA QR kod üretimi |
| bcrypt / argon2 | Şifre hashing |

### Güvenlik
| Teknoloji | Açıklama |
|-----------|----------|
| @fastify/helmet | HTTP güvenlik header'ları |
| @fastify/cors | CORS yönetimi |
| @fastify/rate-limit | Rate limiting |

### Validation
| Teknoloji | Açıklama |
|-----------|----------|
| zod / typebox | Schema validation |
| @fastify/multipart | File upload (avatar) |

### Development
| Teknoloji | Açıklama |
|-----------|----------|
| tsx | TypeScript execution |
| vitest | Testing framework |
| eslint | Linting |
| prettier | Code formatting |

## Geliştirme Ortamı

### Gereksinimler
- Node.js 20.x LTS
- npm veya pnpm
- Docker & Docker Compose
- SQLite3

### Ortam Değişkenleri (.env)
```env
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database
DATABASE_URL=./database/transcendence.db

# JWT
JWT_SECRET=your-super-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://localhost:3000/auth/google/callback

# OAuth - GitHub (alternatif)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=https://localhost:3000/auth/github/callback

# 2FA
TWO_FACTOR_APP_NAME=ft_transcendence

# HTTPS
SSL_KEY_PATH=./certs/key.pem
SSL_CERT_PATH=./certs/cert.pem
```

## Docker Yapılandırması

### Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/app.js"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./backend/database:/app/database
      - ./certs:/app/certs:ro
    restart: unless-stopped
```

## Kısıtlamalar

### Proje Kurallarından
1. **Hazır çözüm yasak**: Tam modül çözümü sunan kütüphaneler kullanılamaz
2. **HTTPS zorunlu**: Tüm bağlantılar HTTPS olmalı
3. **Docker zorunlu**: Tek komutla çalışmalı
4. **SQLite zorunlu**: Başka veritabanı kullanılamaz
5. **.env zorunlu**: Credentials asla kod içinde olmamalı

### Teknik Kısıtlamalar
1. SQLite single-writer limitation
2. File-based database (container restart'ta dikkat)
3. Fastify plugin sistemi öğrenilmeli
4. TypeScript strict mode önerilir

## Bağımlılıklar Arası İlişkiler

```
Fastify Backend (Major)
    │
    ├── SQLite Database (Minor) ─── Ön koşul
    │
    ├── User Management (Major)
    │       │
    │       ├── OAuth 2.0 (Major) ─── Alternatif giriş
    │       │
    │       ├── 2FA & JWT (Major) ─── Güvenlik katmanı
    │       │
    │       └── GDPR (Minor) ─── Veri hakları
    │
    └── (Frontend & Game bağlantısı)
```

## API Endpoints (Planlanan)

### Auth Routes
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/oauth/google
GET    /api/auth/oauth/google/callback
POST   /api/auth/2fa/setup
POST   /api/auth/2fa/verify
POST   /api/auth/2fa/disable
```

### User Routes
```
GET    /api/users/me
PUT    /api/users/me
POST   /api/users/me/avatar
GET    /api/users/:id
GET    /api/users/:id/stats
GET    /api/users/:id/matches
```

### Friends Routes
```
GET    /api/friends
POST   /api/friends/request/:userId
PUT    /api/friends/accept/:userId
DELETE /api/friends/:userId
GET    /api/friends/online
```

### GDPR Routes
```
GET    /api/gdpr/my-data
POST   /api/gdpr/anonymize
DELETE /api/gdpr/delete-account
GET    /api/gdpr/export
```
