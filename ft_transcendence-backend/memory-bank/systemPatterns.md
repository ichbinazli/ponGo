# System Patterns: ft_transcendence Backend

## Mimari Genel Bakış

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Container                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Fastify Server                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   Routes    │  │ Middleware  │  │  Plugins    │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  │         │                │                │          │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │              Controllers                      │    │   │
│  │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │    │   │
│  │  │  │ Auth │ │ User │ │ Game │ │ GDPR │       │    │   │
│  │  │  └──────┘ └──────┘ └──────┘ └──────┘       │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │         │                                            │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │              Services                         │    │   │
│  │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │    │   │
│  │  │  │ JWT  │ │OAuth │ │ 2FA  │ │ Hash │       │    │   │
│  │  │  └──────┘ └──────┘ └──────┘ └──────┘       │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │         │                                            │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │           SQLite Database                     │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Klasör Yapısı (Önerilen)

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── oauth.ts
│   │   └── env.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── game.controller.ts
│   │   └── gdpr.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── game.model.ts
│   │   └── friendship.model.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── game.routes.ts
│   │   └── gdpr.routes.ts
│   ├── services/
│   │   ├── jwt.service.ts
│   │   ├── oauth.service.ts
│   │   ├── 2fa.service.ts
│   │   ├── hash.service.ts
│   │   └── gdpr.service.ts
│   ├── utils/
│   │   ├── validators.ts
│   │   └── helpers.ts
│   ├── plugins/
│   │   └── index.ts
│   └── app.ts
├── database/
│   ├── migrations/
│   └── seeds/
├── tests/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── .env.example
```

## Tasarım Desenleri

### 1. Repository Pattern
- Database işlemleri models klasöründe izole
- Controller'lar doğrudan DB'ye erişmez

### 2. Service Layer Pattern
- İş mantığı services klasöründe
- Controller'lar sadece koordinasyon yapar

### 3. Middleware Pattern
- Auth kontrolü middleware'de
- Validation middleware'de
- Error handling merkezi

### 4. Plugin Pattern (Fastify)
- Fastify plugin sistemi kullanılacak
- Modüler yapı

## Veritabanı Şeması (SQLite)

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    display_name TEXT UNIQUE NOT NULL,
    avatar_url TEXT DEFAULT 'default-avatar.png',
    oauth_provider TEXT,
    oauth_id TEXT,
    two_factor_secret TEXT,
    two_factor_enabled INTEGER DEFAULT 0,
    is_online INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    anonymized INTEGER DEFAULT 0
);
```

### Friendships Table
```sql
CREATE TABLE friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id)
);
```

### Match History Table
```sql
CREATE TABLE match_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id INTEGER NOT NULL,
    player2_id INTEGER NOT NULL,
    player1_score INTEGER NOT NULL,
    player2_score INTEGER NOT NULL,
    winner_id INTEGER,
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id)
);
```

### Sessions Table (JWT Blacklist)
```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Güvenlik Patterns

### Password Hashing
- bcrypt veya argon2 kullanılacak
- Salt otomatik oluşturulacak

### JWT Strategy
- Access token: 15 dakika
- Refresh token: 7 gün
- Token blacklist için sessions tablosu

### OAuth Flow
```
User -> Frontend -> Backend -> OAuth Provider
                 <-          <-
                 -> (token)  ->
                 <- (user)   <-
```

### 2FA Flow
```
1. User enables 2FA -> Generate secret -> Show QR code
2. User scans QR -> Enters code -> Verify & enable
3. Login -> Password OK -> Prompt 2FA -> Verify code -> JWT issued
```

## API Response Format

```json
{
    "success": true,
    "data": { ... },
    "message": "Operation successful"
}

{
    "success": false,
    "error": {
        "code": "AUTH_FAILED",
        "message": "Invalid credentials"
    }
}
```
