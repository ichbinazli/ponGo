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
       │  Password OK? 2FA Enabled?       │
       │<─────────────────────────────────│
       │                                  │
       │ IF 2FA: { requires2FA: true }    │
       │ AND Email sent with code         │
       │                                  │
       │ POST /api/auth/login             │
       │ {email, password, twoFactorCode} │
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

### Sistem
Google Authenticator/TOTP yerine **E-posta tabanlı** doğrulama sistemi kullanılmaktadır.

### Kurulum Adımları

1. **Setup:** `POST /api/2fa/setup` → E-postana 6 haneli kod gönderir.
2. **Doğrula:** `POST /api/2fa/confirm` + `{code: "123456"}`
3. **Sonuç:** 2FA aktifleşir. Artık girişte kod sorulur.

### Status Kontrolü

```bash
GET /api/2fa/status
Authorization: Bearer ...
```

```json
{
  "data": {
    "enabled": true
  }
}
```

---

## Şifre Sıfırlama

### 1. Şifremi Unuttum
Kullanıcı e-postasını girer, sistem 6 haneli bir kod gönderir.

```bash
POST /api/auth/forgot-password
{ "email": "user@example.com" }
```

### 2. Şifreyi Sıfırla
Gelen kod ve yeni şifre ile işlem tamamlanır.
Tüm aktif oturumlar güvenlik gereği kapatılır.

```bash
POST /api/auth/reset-password
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "YeniGucluSifre1!"
}
```

---

## OAuth

### Desteklenen Providers

| Provider | ID | Callback |
|----------|-------|----------|
| 42 Intra | `42` | `/api/oauth/42/callback` |

### OAuth Akışı

1. `GET /api/oauth/42` → Redirect URL döner
2. User 42 Intra'da authorize eder
3. `GET /api/oauth/42/callback` → JWT tokens döner

### Hesaba OAuth Bağlama

```bash
POST /api/oauth/42/link
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
