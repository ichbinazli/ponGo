# 🔐 Authentication

Backend kimlik doğrulama sistemi: JWT, 2FA ve OAuth.

---

## JWT Token Sistemi

### Token Türleri

| Token | Süre | Kullanım |
|-------|------|----------|
| Access Token | 15 dakika | API istekleri |
| Refresh Token | 7 gün | Access token yenileme |

### Kullanım

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### JWT Payload

```json
{
  "sub": 1,
  "email": "user@example.com",
  "iat": 1706176438,
  "exp": 1706177338
}
```

---

## Login Akışı

```
┌─────────────┐                    ┌─────────────┐
│   Client    │                    │   Backend   │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ POST /api/auth/login             │
       │ {email, password}                │
       │─────────────────────────────────>│
       │                                  │
       │       2FA enabled?               │
       │<─────────────────────────────────│
       │                                  │
       │ POST /api/2fa/verify             │
       │ {userId, code}                   │
       │─────────────────────────────────>│
       │                                  │
       │ {accessToken, refreshToken}      │
       │<─────────────────────────────────│
```

### Normal Login

```bash
curl -X POST https://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "Pass123!"}'
```

**Yanıt (2FA kapalı):**
```json
{
  "success": true,
  "data": {
    "user": {"id": 1, "email": "user@example.com", "displayName": "User"},
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG...",
      "expiresAt": "2026-01-27T12:30:00.000Z"
    }
  }
}
```

**Yanıt (2FA aktif):**
```json
{
  "success": true,
  "data": {"requires2FA": true, "userId": 1}
}
```

---

## Token Yenileme

```bash
curl -X POST https://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "eyJhbG..."}'
```

---

## 2FA (İki Faktörlü Doğrulama)

### Kurulum Adımları

1. **Setup:** `POST /api/2fa/setup` → QR kod döner
2. **Authenticator'a ekle:** Google Authenticator, Authy
3. **Doğrula:** `POST /api/2fa/confirm` + `{code: "123456"}`
4. **Yedek kodlar:** `POST /api/2fa/backup-codes`

### Status Kontrolü

```bash
GET /api/2fa/status
Authorization: Bearer ...
```

```json
{
  "data": {
    "enabled": true,
    "hasBackupCodes": true,
    "backupCodesCount": 8
  }
}
```

---

## OAuth

### Desteklenen Providers

| Provider | ID | Callback |
|----------|-------|----------|
| Google | `google` | `/api/oauth/google/callback` |
| GitHub | `github` | `/api/oauth/github/callback` |
| 42 Intra | `42` | `/api/oauth/42/callback` |

### OAuth Akışı

1. `GET /api/oauth/google` → Redirect URL döner
2. User Google'da authorize eder
3. `GET /api/oauth/google/callback` → JWT tokens döner

### Hesaba OAuth Bağlama

```bash
POST /api/oauth/google/link
Authorization: Bearer ...
```

---

## Session Yönetimi

### Aktif Oturumlar

```bash
GET /api/auth/sessions
Authorization: Bearer ...
```

### Oturum Sonlandırma

```bash
DELETE /api/auth/sessions/1
Authorization: Bearer ...
```

---

## Environment Variables

| Değişken | Açıklama |
|----------|----------|
| `JWT_SECRET` | Token imzalama anahtarı (min 32 karakter) |
| `JWT_ACCESS_EXPIRY` | Access token süresi (default: 15m) |
| `JWT_REFRESH_EXPIRY` | Refresh token süresi (default: 7d) |

---

*Son Güncelleme: Ocak 2026*
