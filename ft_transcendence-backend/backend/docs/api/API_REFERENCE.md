# 🚀 ft_transcendence Backend API Endpoint Dökümanı

Bu dosya, backend tarafından sunulan tüm API endpoint'lerini detaylı olarak açıklamaktadır.

**Base URL:** `https://localhost:3000`

---

## 📋 İçindekiler
1. [Temel Endpoint'ler](#1-temel-endpointler)
2. [Kimlik Doğrulama (Auth)](#2-kimlik-doğrulama-auth)
3. [Kullanıcı İşlemleri](#3-kullanıcı-işlemleri)
4. [Arkadaşlık Sistemi](#4-arkadaşlık-sistemi)
5. [Maç İşlemleri](#5-maç-işlemleri)
6. [İstatistikler](#6-istatistikler)
7. [2FA (İki Faktörlü Doğrulama)](#7-2fa-iki-faktörlü-doğrulama)
8. [OAuth](#8-oauth)
9. [GDPR](#9-gdpr)

---

## 1. Temel Endpoint'ler

### `GET /health`
Sunucu sağlık kontrolü.

**Yanıt:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-20T09:53:48.604Z",
  "uptime": 179.129
}
```

### `GET /api`
API bilgisi ve Swagger dokümantasyonu.

---

## 2. Kimlik Doğrulama (Auth)

### `POST /api/auth/register`
Yeni kullanıcı kaydı.

**İstek:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "KullanıcıAdı"
}
```

**Yanıt (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "displayName": "KullanıcıAdı",
      "avatarUrl": "default-avatar.png"
    },
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG...",
      "expiresAt": "2026-01-20T10:08:58.166Z"
    }
  },
  "message": "Registration successful"
}
```

---

### `POST /api/auth/login`
Kullanıcı girişi.

**İstek:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Yanıt (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": { ... }
  }
}
```

---

### `POST /api/auth/logout`
🔒 **Auth Gerekli**

Kullanıcı çıkışı.

**Header:** `Authorization: Bearer <accessToken>`

---

### `POST /api/auth/refresh`
Access token yenileme.

**İstek:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

---

### `GET /api/auth/sessions`
🔒 **Auth Gerekli**

Aktif oturumları listele.

**Yanıt:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userAgent": "curl/8.14.1",
      "ipAddress": "127.0.0.1",
      "createdAt": "2026-01-20 09:53:58",
      "expiresAt": "2026-01-27T09:53:58.166Z"
    }
  ]
}
```

---

### `DELETE /api/auth/sessions/:id`
🔒 **Auth Gerekli**

Belirli bir oturumu sonlandır.

---

## 3. Kullanıcı İşlemleri

### `GET /api/users/me`
🔒 **Auth Gerekli**

Kendi profil bilgilerini getir.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "display_name": "KullanıcıAdı",
    "avatar_url": "default-avatar.png",
    "is_online": true,
    "two_factor_enabled": false,
    "created_at": "2026-01-20 09:53:58",
    "stats": {
      "total_matches": 0,
      "wins": 0,
      "losses": 0,
      "win_rate": 0
    }
  }
}
```

---

### `PATCH /api/users/me`
🔒 **Auth Gerekli**

Profil güncelle.

**İstek:**
```json
{
  "displayName": "YeniIsim"
}
```

---

### `POST /api/users/me/avatar`
🔒 **Auth Gerekli**

Avatar yükle (multipart/form-data).

---

### `GET /api/users/:id`
Belirli bir kullanıcının profilini getir (public bilgiler).

---

### `GET /api/users/:id/stats`
Kullanıcının istatistiklerini getir.

---

## 4. Arkadaşlık Sistemi

### `GET /api/friends`
🔒 **Auth Gerekli**

Arkadaş listesini getir.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "friends": [],
    "count": 0
  }
}
```

---

### `POST /api/friends/request/:userId`
🔒 **Auth Gerekli**

Arkadaşlık isteği gönder.

---

### `POST /api/friends/accept/:userId`
🔒 **Auth Gerekli**

Arkadaşlık isteğini kabul et.

---

### `POST /api/friends/reject/:userId`
🔒 **Auth Gerekli**

Arkadaşlık isteğini reddet.

---

### `DELETE /api/friends/:userId`
🔒 **Auth Gerekli**

Arkadaşlıktan çıkar.

---

### `POST /api/friends/block/:userId`
🔒 **Auth Gerekli**

Kullanıcıyı engelle.

---

### `DELETE /api/friends/block/:userId`
🔒 **Auth Gerekli**

Engeli kaldır.

---

## 5. Maç İşlemleri

### `POST /api/matches`
🔒 **Auth Gerekli**

Maç sonucu kaydet (Game modülü için).

**İstek:**
```json
{
  "player1_id": 1,
  "player2_id": 2,
  "player1_score": 11,
  "player2_score": 5,
  "game_type": "classic"
}
```

---

### `GET /api/matches`
Tüm maçları listele (pagination destekli).

**Query Params:**
- `page` (default: 1)
- `limit` (default: 20)

---

### `GET /api/matches/:id`
Belirli bir maçın detaylarını getir.

---

## 6. İstatistikler

### `GET /api/stats/global`
Global oyun istatistikleri.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1,
    "playersOnline": 1,
    "totalMatches": 0,
    "gamesToday": 0,
    "bestScore": 0,
    "activeUsers24h": 1
  }
}
```

---

### `GET /api/stats/leaderboard`
Liderlik tablosu.

**Query Params:**
- `page` (default: 1)
- `limit` (default: 10)

---

## 7. 2FA (İki Faktörlü Doğrulama)

### `GET /api/2fa/status`
🔒 **Auth Gerekli**

2FA durumunu kontrol et.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "enabled": false,
    "hasBackupCodes": false,
    "backupCodesCount": 0
  }
}
```

---

### `POST /api/2fa/setup`
🔒 **Auth Gerekli**

2FA kurulumu başlat (QR kod döner).

---

### `POST /api/2fa/verify`
🔒 **Auth Gerekli**

2FA kodunu doğrula ve aktifleştir.

**İstek:**
```json
{
  "code": "123456"
}
```

---

### `POST /api/2fa/disable`
🔒 **Auth Gerekli**

2FA'yı devre dışı bırak.

---

### `POST /api/2fa/backup-codes`
🔒 **Auth Gerekli**

Yedek kodlar oluştur.

---

## 8. OAuth

### `GET /api/oauth/providers`
Aktif OAuth sağlayıcılarını listele.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "providers": [
      { "name": "Google", "id": "google", "enabled": true },
      { "name": "GitHub", "id": "github", "enabled": true }
    ]
  }
}
```

---

### `GET /api/oauth/:provider`
OAuth akışını başlat (Google veya GitHub).

---

### `GET /api/oauth/:provider/callback`
OAuth callback endpoint'i.

---

### `POST /api/oauth/:provider/link`
🔒 **Auth Gerekli**

Mevcut hesaba OAuth bağla.

---

### `DELETE /api/oauth/:provider/unlink`
🔒 **Auth Gerekli**

OAuth bağlantısını kaldır.

---

## 9. GDPR

### `GET /api/gdpr/info`
Gizlilik bilgisi.

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "dataCollected": [
      "Email address",
      "Display name",
      "Avatar image",
      "Match history",
      "Friend connections",
      "Session information"
    ],
    "dataRetention": { ... },
    "yourRights": { ... }
  }
}
```

---

### `GET /api/gdpr/export`
🔒 **Auth Gerekli**

Tüm kullanıcı verilerini JSON olarak dışa aktar.

---

### `POST /api/gdpr/anonymize`
🔒 **Auth Gerekli**

Hesabı anonimleştir.

---

### `DELETE /api/gdpr/delete`
🔒 **Auth Gerekli**

Hesabı kalıcı olarak sil.

---

## 🔒 Kimlik Doğrulama

Auth gerektiren endpoint'ler için header'a şunu ekleyin:
```
Authorization: Bearer <accessToken>
```

---

## ❌ Hata Yanıtları

Tüm hatalar şu formatta döner:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  }
}
```

**Yaygın Hata Kodları:**
| Kod | Açıklama |
|-----|----------|
| 400 | Bad Request - Geçersiz istek |
| 401 | Unauthorized - Kimlik doğrulama gerekli |
| 403 | Forbidden - Yetkisiz erişim |
| 404 | Not Found - Kaynak bulunamadı |
| 409 | Conflict - Kaynak zaten mevcut |
| 429 | Too Many Requests - Rate limit aşıldı |
| 500 | Internal Server Error - Sunucu hatası |
