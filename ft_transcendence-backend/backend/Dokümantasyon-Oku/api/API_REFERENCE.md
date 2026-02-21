# 🚀 API Reference

Backend'in sunduğu tüm API endpoint'lerinin kapsamlı referansı.

**Base URL:** `https://localhost:3000`

---

## 📋 İçindekiler

1. [Temel Endpoint'ler](#1-temel-endpointler)
2. [Auth (/api/auth)](#2-auth)
3. [Users (/api/users)](#3-users)
4. [Friends (/api/friends)](#4-friends)
5. [OAuth (/api/oauth)](#5-oauth)
6. [2FA (/api/2fa)](#6-2fa)
7. [GDPR (/api/gdpr)](#7-gdpr)
8. [Stats (/api/stats)](#8-stats)
9. [Matches (/api/matches)](#9-matches)
10. [Local Tournament (/api/local-tournament)](#10-local-tournament)

---

## 1. Temel Endpoint'ler

| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/health` | ❌ | Sunucu sağlık kontrolü |
| GET | `/api` | ❌ | API bilgisi |

---

## 2. Auth

**Prefix:** `/api/auth`

| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | `/register` | ❌ | Yeni kullanıcı kaydı |
| POST | `/login` | ❌ | Kullanıcı girişi |
| POST | `/refresh` | ❌ | Token yenileme |
| POST | `/verify-password` | ✅ | Şifre doğrulama (game team için) |
| POST | `/logout` | ✅ | Çıkış yap |
| POST | `/logout-all` | ✅ | Tüm oturumlardan çık |
| POST | `/forgot-password` | ❌ | Şifre sıfırlama kodu gönder |
| POST | `/reset-password` | ❌ | Şifreyi sıfırla |
| GET | `/me` | ✅ | Mevcut kullanıcı bilgisi |
| GET | `/sessions` | ✅ | Aktif oturumlar |
| DELETE | `/sessions/:sessionId` | ✅ | Oturum sonlandır |

### Register
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "KullaniciAdi"
}
```

### Login
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "twoFactorCode": "123456"  // Opsiyonel, 2FA aktifse
}
```

### Refresh Token
```json
POST /api/auth/refresh
{
  "refreshToken": "eyJhbG..."
}
```

### Verify Password (🆕)
```json
POST /api/auth/verify-password
Authorization: Bearer <token>
{
  "userId": 5,
  "password": "KullaniciSifresi123!"
}
// Yanıt: { "verified": true, "user": { "id": 5, "displayName": "...", "avatarUrl": "..." } }
```

---

## 3. Users

**Prefix:** `/api/users`

| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/search?q=query` | ❌ | Kullanıcı ara |
| GET | `/online` | ❌ | Online kullanıcılar |
| GET | `/:id` | ❌ | Kullanıcı profili |
| GET | `/:id/matches` | ❌ | Maç geçmişi |
| GET | `/:id/stats` | ❌ | İstatistikler |
| GET | `/:id/rank` | ❌ | Leaderboard sırası |
| GET | `/me` | ✅ | Kendi profilim |
| PATCH | `/me` | ✅ | Profil güncelle |
| PUT | `/me/password` | ✅ | Şifre değiştir |
| POST | `/me/avatar` | ✅ | Avatar yükle |
| DELETE | `/me/avatar` | ✅ | Avatar sil |

### Update Profile
```json
PATCH /api/users/me
{
  "displayName": "YeniIsim",
  "email": "yeni@email.com"
}
```

### Change Password
```json
PUT /api/users/me/password
{
  "currentPassword": "EskiSifre123!",
  "newPassword": "YeniSifre123!"
}
```

---

## 4. Friends

**Prefix:** `/api/friends`  
**Not:** Tüm endpoint'ler authentication gerektirir.

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/` | Arkadaş listesi |
| GET | `/online` | Online arkadaşlar |
| POST | `/requests` | İstek gönder |
| GET | `/requests/pending` | Gelen istekler |
| GET | `/requests/sent` | Gönderilen istekler |
| POST | `/requests/:id/accept` | İsteği kabul et |
| POST | `/requests/:id/reject` | İsteği reddet |
| DELETE | `/requests/:id` | İsteği iptal et |
| GET | `/status/:id` | Arkadaşlık durumu |
| DELETE | `/:id` | Arkadaşı çıkar |
| GET | `/blocked` | Engellenenler |
| POST | `/block` | Engelle |
| DELETE | `/block/:id` | Engeli kaldır |

### Send Friend Request
```json
POST /api/friends/requests
{
  "userId": 5
}
```

### Block User
```json
POST /api/friends/block
{
  "userId": 5
}
```

---

## 5. OAuth

**Prefix:** `/api/oauth`

| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/providers` | ❌ | Mevcut OAuth sağlayıcıları |
| GET | `/:provider` | ❌ | OAuth akışını başlat |
| GET | `/:provider/callback` | ❌ | OAuth callback |
| POST | `/:provider/link` | ✅ | Hesaba OAuth bağla |
| DELETE | `/unlink` | ✅ | OAuth bağlantısını kaldır |

**Desteklenen Providers:** `42`

---

## 6. 2FA

**Prefix:** `/api/2fa`

| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/status` | ✅ | 2FA durumu |
| POST | `/setup` | ✅ | 2FA kurulumu başlat (Kod gönder) |
| POST | `/confirm` | ✅ | 2FA'yı aktifleştir (Kodu doğrula) |
| POST | `/disable` | ✅ | 2FA'yı kapat (Şifre gerekir) |

### Confirm 2FA
```json
POST /api/2fa/confirm
{
  "code": "123456"
}
```

---

## 7. GDPR

**Prefix:** `/api/gdpr`

| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/info` | ❌ | Gizlilik bilgisi |
| GET | `/export` | ✅ | Verilerimi dışa aktar |
| GET | `/retention` | ✅ | Veri saklama bilgisi |
| POST | `/anonymize` | ✅ | Hesabı anonimleştir |
| DELETE | `/delete` | ✅ | Hesabı kalıcı sil |

### Anonymize Account
```json
POST /api/gdpr/anonymize
{
  "password": "MevcutSifre",
  "confirmation": "ANONYMIZE MY ACCOUNT"
}
```

### Delete Account
```json
DELETE /api/gdpr/delete
{
  "password": "MevcutSifre",
  "confirmation": "DELETE MY ACCOUNT PERMANENTLY"
}
```

---

## 8. Stats

**Prefix:** `/api/stats`

| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/leaderboard?limit=10` | ❌ | Liderlik tablosu |
| GET | `/global` | ❌ | Global istatistikler |
| GET | `/recent-matches?limit=10` | ❌ | Son maçlar |

### Leaderboard Response
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "id": 1,
        "name": "ProPlayer",
        "avatar_url": "...",
        "score": 150,
        "gamesPlayed": 20,
        "wins": 15,
        "losses": 5,
        "winRate": 75
      }
    ],
    "total": 100
  }
}
```

---

## 9. Matches

**Prefix:** `/api/matches`

| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | `/` | ✅ | Maç kaydet |
| GET | `/` | ❌ | Maçları listele |
| GET | `/:id` | ❌ | Maç detayı |

### Create Match
```json
POST /api/matches
Authorization: Bearer <token>
{
  "player1_id": 1,
  "player2_id": 2,           // null olabilir (misafir oyuncu)
  "player1_score": 11,
  "player2_score": 7,
  "winner_id": 1,             // Opsiyonel (otomatik hesaplanır)
  "game_type": "pong",        // "pong" | "tournament" | "ai" | "other"
  "tournament_id": null,      // Opsiyonel
  "duration_seconds": 180,    // Opsiyonel
  "started_at": "...",        // Opsiyonel

  // V2 Yeni Alanlar
  "game_mode": "modern",      // "modern" | "nostalgia" | "tournament"
  "match_type": "h2h",        // "h2h" | "h2ai"
  "aiDifficultly": "easy",    // Opsiyonel (Sadece h2ai). "easy" | "medium" | "hard"
  "player1_name": "PlayerOne",// Opsiyonel
  "player2_name": "Misafir",  // player2_id null ise ZORUNLU
  "winning_score": 11,
  "player1_power_up_freeze": false,
  "player1_power_up_mega": false,
  "player2_power_up_freeze": false,
  "player2_power_up_mega": false
}
```

> **NOT:** `player2_id: null` → Misafir oyuncu. Bu durumda `player2_name` zorunludur. En az 1 oyuncu kayıtlı olmalıdır.  
> `match_type: "h2ai"` → player2_id otomatik AI Player olur. player1_id istek yapan kullanıcı olmalıdır.

---

## 10. Local Tournament

**Prefix:** `/api/local-tournament`

| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | `/create` | ✅ | Turnuva oluştur |
| POST | `/add-participant` | ✅ | Kayıtlı kullanıcı ekle (🆕) |
| POST | `/add-guest` | ✅ | Misafir ekle |
| POST | `/:id/start` | ✅ | Turnuvayı başlat (bracket) |
| POST | `/match/:matchId/result` | ✅ | Maç sonucu kaydet |
| POST | `/:id/complete` | ✅ | Turnuvayı bitir + winner (🆕) |
| GET | `/:id/participants` | ❌ | Katılımcılar |
| GET | `/:id/matches` | ❌ | Maçlar |
| GET | `/:id/bracket` | ❌ | Bracket |

### Create Tournament
```json
POST /api/local-tournament/create
{
  "name": "Haftalık Turnuva",
  "description": "Arkadaşlar arası",
  "maxPlayers": 8
}
```

### Add Participant — Kayıtlı Kullanıcı (🆕)
```json
POST /api/local-tournament/add-participant
{
  "tournamentId": 1,
  "userId": 5,
  "alias": "ProPlayer"
}
```

### Add Guest
```json
POST /api/local-tournament/add-guest
{
  "tournamentId": 1,
  "alias": "Misafir1"
}
```

### Start Tournament (Bracket Gönder)
```json
POST /api/local-tournament/1/start
{
  "matches": [
    { "round": 1, "matchOrder": 1, "participant1Alias": "ProPlayer", "participant2Alias": "Misafir1" },
    { "round": 1, "matchOrder": 2, "participant1Alias": "Player3", "participant2Alias": "Player4" }
  ]
}
```

### Record Match Result
```json
POST /api/local-tournament/match/1/result
{
  "participant1Score": 11,
  "participant2Score": 5,
  "winnerParticipantId": 1,
  "durationSeconds": 120,
  "winningScore": 11,
  "gameMode": "tournament"
}
```

### Complete Tournament (🆕)
```json
POST /api/local-tournament/1/complete
{
  "winnerParticipantId": 1
}
// Yanıt: { tournament: {..., status: "completed"}, winner: { participantId, userId, alias, isGuest } }
```

---

## 🔒 Authentication

Auth gerektiren endpoint'ler için:

```
Authorization: Bearer <accessToken>
```

---

## ❌ Error Responses

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  }
}
```

| HTTP | Code | Açıklama |
|------|------|----------|
| 400 | VALIDATION_ERROR | Geçersiz istek |
| 401 | UNAUTHORIZED | Token geçersiz |
| 403 | FORBIDDEN | Yetkisiz erişim |
| 404 | NOT_FOUND | Kaynak bulunamadı |
| 409 | CONFLICT | Kaynak mevcut |
| 429 | RATE_LIMITED | Limit aşıldı |
| 500 | INTERNAL_ERROR | Sunucu hatası |

---

*Son Güncelleme: Şubat 2026*
