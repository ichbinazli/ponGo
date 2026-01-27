# 🔐 Authentication Dokümantasyonu

Backend kimlik doğrulama sistemi JWT tabanlıdır ve 2FA (TOTP) ile güçlendirilmiştir.

---

## 📋 İçindekiler

1. [JWT Token Sistemi](#jwt-token-sistemi)
2. [Login Akışı](#login-akışı)
3. [Token Yenileme](#token-yenileme)
4. [2FA (İki Faktörlü Doğrulama)](#2fa-i̇ki-faktörlü-doğrulama)
5. [OAuth Entegrasyonu](#oauth-entegrasyonu)
6. [Session Yönetimi](#session-yönetimi)
7. [Güvenlik Best Practices](#güvenlik-best-practices)

---

## JWT Token Sistemi

### Token Türleri

| Token | Süre | Kullanım |
|-------|------|----------|
| **Access Token** | 15 dakika | API istekleri için Authorization header'da |
| **Refresh Token** | 7 gün | Access token yenilemek için |

### Token Yapısı

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### JWT Payload

```json
{
  "sub": 1,           // user_id
  "email": "user@example.com",
  "iat": 1706176438,  // issued at
  "exp": 1706177338   // expires (15 dk sonra)
}
```

---

## Login Akışı

### Normal Login (Email/Password)

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Client  │         │  Backend │         │    DB    │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │ POST /api/auth/login                    │
     │ {email, password}  │                    │
     │───────────────────>│                    │
     │                    │ check credentials  │
     │                    │───────────────────>│
     │                    │<───────────────────│
     │                    │                    │
     │ 2FA enabled?       │                    │
     │<─ YES: return      │                    │
     │   requires2FA=true │                    │
     │                    │                    │
     │ POST /api/auth/verify-2fa               │
     │ {code: "123456"}   │                    │
     │───────────────────>│                    │
     │                    │                    │
     │ {accessToken,      │                    │
     │  refreshToken}     │                    │
     │<───────────────────│                    │
```

### Request/Response Örnekleri

**Login İsteği:**
```bash
curl -X POST https://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Başarılı Yanıt (2FA kapalı):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "displayName": "TestUser"
    },
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG...",
      "expiresAt": "2026-01-27T12:30:00.000Z"
    }
  }
}
```

**2FA Gerekli Yanıt:**
```json
{
  "success": true,
  "data": {
    "requires2FA": true,
    "userId": 1
  },
  "message": "2FA verification required"
}
```

---

## Token Yenileme

Access token süresi dolduğunda refresh token ile yenilenebilir.

**İstek:**
```bash
curl -X POST https://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "expiresAt": "2026-01-27T12:45:00.000Z"
  }
}
```

### Frontend Token Yönetimi

```javascript
// Token'ları localStorage'da sakla
localStorage.setItem('accessToken', tokens.accessToken);
localStorage.setItem('refreshToken', tokens.refreshToken);

// Her istekte header'a ekle
fetch('/api/users/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});

// 401 aldığında refresh yap
if (response.status === 401) {
  const newTokens = await refreshAccessToken();
  // İsteği tekrarla
}
```

---

## 2FA (İki Faktörlü Doğrulama)

### 2FA Kurulum Akışı

1. **Setup başlat:** `POST /api/2fa/setup` → QR kod + secret döner
2. **Authenticator'a ekle:** Google Authenticator, Authy, vb.
3. **Doğrula ve aktifleştir:** `POST /api/2fa/verify` + `{code: "123456"}`
4. **Yedek kodlar al:** `POST /api/2fa/backup-codes`

### 2FA Status Kontrolü

```bash
curl https://localhost:3000/api/2fa/status \
  -H "Authorization: Bearer eyJhbG..."
```

```json
{
  "success": true,
  "data": {
    "enabled": true,
    "hasBackupCodes": true,
    "backupCodesCount": 8
  }
}
```

### 2FA Doğrulama Endpoint'i

Local turnuva sisteminde kayıtlı kullanıcılar için kullanılır:

```bash
POST /api/local-tournament/verify-participant
{
  "tournamentId": 1,
  "userId": 5,
  "code": "123456"
}
```

---

## OAuth Entegrasyonu

Backend şu OAuth sağlayıcılarını destekler:

| Provider | Durum | Redirect URI |
|----------|-------|--------------|
| 42 Intra | ✅ | `/api/oauth/42/callback` |
| Google | ✅ | `/api/oauth/google/callback` |  
| GitHub | ✅ | `/api/oauth/github/callback` |

### OAuth Akışı

```
1. GET /api/oauth/google
   → Redirect to Google OAuth consent
   
2. User authorizes
   → Google redirects to /api/oauth/google/callback
   
3. Backend exchanges code for tokens
   → Creates/links user account
   → Returns JWT tokens
```

### Mevcut Hesaba OAuth Bağlama

```bash
POST /api/oauth/google/link
Authorization: Bearer eyJhbG...
```

---

## Session Yönetimi

### Aktif Oturumları Listele

```bash
GET /api/auth/sessions
Authorization: Bearer eyJhbG...
```

```json
{
  "data": [
    {
      "id": 1,
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "192.168.1.1",
      "createdAt": "2026-01-27 10:00:00",
      "expiresAt": "2026-02-03T10:00:00.000Z"
    }
  ]
}
```

### Oturum Sonlandırma

```bash
DELETE /api/auth/sessions/1
Authorization: Bearer eyJhbG...
```

### Tüm Oturumları Sonlandır (Logout All)

```bash
POST /api/auth/logout
Authorization: Bearer eyJhbG...
```

---

## Güvenlik Best Practices

### Frontend İçin

| Konu | Öneri |
|------|-------|
| **Token Saklama** | `httpOnly` cookie veya localStorage |
| **Token Süresi** | Access: 15dk, Refresh: 7gün |
| **HTTPS** | Zorunlu (mixed content engellenir) |
| **CORS** | Sadece izinli origin'ler |

### Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/api/auth/login` | 5 istek/dakika |
| `/api/auth/register` | 3 istek/dakika |
| Genel API | 100 istek/dakika |

### Error Responses

```json
// 401 Unauthorized
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}

// 403 Forbidden (2FA gerekli)
{
  "success": false,
  "error": {
    "code": "2FA_REQUIRED",
    "message": "Two-factor authentication required"
  }
}
```

---

## Environment Variables

| Değişken | Açıklama | Örnek |
|----------|----------|-------|
| `JWT_SECRET` | Token imzalama anahtarı | `super-secret-key-min-32-chars` |
| `JWT_EXPIRES_IN` | Access token süresi | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token süresi | `7d` |

---

*Son Güncelleme: Ocak 2026*
