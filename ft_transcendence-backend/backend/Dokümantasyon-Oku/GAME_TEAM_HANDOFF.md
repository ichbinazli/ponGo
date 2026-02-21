# 🎮 Game Ekibi İçin Backend API Dokümantasyonu

**Son Güncelleme:** Şubat 2026

Bu döküman, oyun ekibinin turnuva ve maç modülleri için kullanacağı tüm API endpoint'lerini, akışı ve kuralları içerir.

**Base URL:** `https://localhost:3000`  
**Auth Header:** `Authorization: Bearer <accessToken>`

---

## 📋 Hızlı Özet — Ne Değişti?

| Değişiklik | Durum |
|---|---|
| `POST /verify-participant` | ❌ **Kaldırıldı** |
| `POST /api/auth/verify-password` | ✅ **Yeni** — Şifre doğrulama |
| `POST /add-participant` | ✅ **Yeni** — Kayıtlı kullanıcı ekleme |
| `POST /:id/complete` | ✅ **Yeni** — Turnuva bitirme |
| `POST /api/matches` — `player2_id: null` | ✅ **Güncellendi** — Misafir oyuncu desteği |

---

## 🏓 Normal Maç (1v1 Pong)

### Maç Kaydetme

```
POST /api/matches
Authorization: Bearer <token>
```

```json
{
  "player1_id": 1,
  "player2_id": 2,
  "player1_score": 11,
  "player2_score": 7,
  "game_mode": "modern",
  "match_type": "h2h",
  "player1_name": "Nazlı",
  "player2_name": "Ali",
  "winning_score": 11,
  "duration_seconds": 180,
  "player1_power_up_freeze": false,
  "player1_power_up_mega": false,
  "player2_power_up_freeze": false,
  "player2_power_up_mega": false
}
```

### Misafir Oyuncu ile Maç

`player2_id: null` gönderin, `player2_name` **zorunlu** olur:

```json
{
  "player1_id": 1,
  "player2_id": null,
  "player1_score": 11,
  "player2_score": 3,
  "player2_name": "Misafir",
  "game_mode": "modern",
  "match_type": "h2h",
  "winning_score": 11
}
```

> ⚠️ **Kurallar:**
> - En az 1 oyuncu kayıtlı kullanıcı olmalı (ikisi de null olamaz)
> - İstek yapan kullanıcı, null olmayan player olmalı
> - `player2_id: null` ise `player2_name` zorunlu

### AI Maçı

```json
{
  "player1_id": 1,
  "player2_id": 999,
  "match_type": "h2ai",
  "aiDifficultly": "medium",
  "player1_score": 11,
  "player2_score": 8,
  "winning_score": 11
}
```

> `match_type: "h2ai"` → `player2_id` otomatik AI Player olarak atanır.

---

## 🏆 Turnuva Akışı

Turnuva 5 aşamadan oluşur:

```
1. Turnuva Oluştur → 2. Oyuncu Ekle → 3. Bracket ile Başlat → 4. Maçları Oyna → 5. Turnuvayı Bitir
```

---

### Aşama 1: Turnuva Oluşturma

```
POST /api/local-tournament/create
Authorization: Bearer <token>
```

```json
{
  "name": "42 Pong Cup",
  "description": "Haftalık turnuva",
  "maxPlayers": 8
}
```

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "tournament": {
      "id": 1,
      "name": "42 Pong Cup",
      "status": "pending",
      "max_players": 8,
      "current_round": 0,
      "created_at": "..."
    }
  }
}
```

---

### Aşama 2: Oyuncu Ekleme

Her oyuncu için **önce şifre doğrula, sonra ekle** akışını kullanın.

#### 2a. Şifre Doğrulama (Kayıtlı Kullanıcılar)

```
POST /api/auth/verify-password
Authorization: Bearer <token>
```

```json
{ "userId": 5, "password": "kullaniciSifresi123" }
```

**Başarılı Yanıt:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "user": { "id": 5, "displayName": "Nazlı", "avatarUrl": "..." }
  }
}
```

**Başarısız:** `401 Invalid password` veya `400 OAuth-only account`

#### 2b. Kayıtlı Kullanıcı Ekleme

Şifre doğrulandıktan sonra:

```
POST /api/local-tournament/add-participant
Authorization: Bearer <token>
```

```json
{
  "tournamentId": 1,
  "userId": 5,
  "alias": "Nazlı42"
}
```

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "participant": { "id": 1, "tournament_id": 1, "user_id": 5, "alias": "Nazlı42", "is_guest": 0 },
    "user": { "id": 5, "displayName": "Nazlı", "avatarUrl": "..." }
  }
}
```

#### 2c. Misafir Oyuncu Ekleme (Şifre gereksiz)

```
POST /api/local-tournament/add-guest
Authorization: Bearer <token>
```

```json
{
  "tournamentId": 1,
  "alias": "MisafirAli"
}
```

#### Katılımcı Listesi Alma

```
GET /api/local-tournament/1/participants
```

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "tournament": { "id": 1, "name": "42 Pong Cup", "status": "pending", ... },
    "participants": [
      { "id": 1, "user_id": 5, "alias": "Nazlı42", "is_guest": 0, "display_name": "Nazlı", "avatar_url": "..." },
      { "id": 2, "user_id": null, "alias": "MisafirAli", "is_guest": 1, "display_name": null, "avatar_url": null }
    ],
    "count": 2,
    "maxPlayers": 8
  }
}
```

---

### Aşama 3: Turnuvayı Başlatma (Bracket Gönderme)

Frontend bracket'ı oluşturur ve eşleşmeleri gönderir:

```
POST /api/local-tournament/1/start
Authorization: Bearer <token>
```

```json
{
  "matches": [
    { "round": 1, "matchOrder": 1, "participant1Alias": "Nazlı42", "participant2Alias": "MisafirAli" },
    { "round": 1, "matchOrder": 2, "participant1Alias": "Player3", "participant2Alias": "Player4" },
    { "round": 2, "matchOrder": 1 }
  ]
}
```

> **Not:** İlerleyen round'lar için `participant1Alias` / `participant2Alias` boş bırakılabilir (kazananlar sonra atanır).

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "tournament": { "id": 1, "status": "in_progress", ... },
    "matches": [
      { "id": 1, "round": 1, "match_order": 1, "participant1_id": 1, "participant2_id": 2, "status": "pending" },
      { "id": 2, "round": 1, "match_order": 2, "participant1_id": 3, "participant2_id": 4, "status": "pending" },
      { "id": 3, "round": 2, "match_order": 1, "participant1_id": null, "participant2_id": null, "status": "pending" }
    ]
  }
}
```

---

### Aşama 4: Maç Sonuçlarını Kaydetme

Her maç bittikten sonra:

```
POST /api/local-tournament/match/1/result
Authorization: Bearer <token>
```

```json
{
  "participant1Score": 11,
  "participant2Score": 5,
  "winnerParticipantId": 1,
  "durationSeconds": 180,
  "winningScore": 11,
  "gameMode": "tournament"
}
```

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "match": {
      "id": 1,
      "round": 1,
      "match_order": 1,
      "participant1_id": 1,
      "participant2_id": 2,
      "participant1_score": 11,
      "participant2_score": 5,
      "winner_participant_id": 1,
      "status": "completed",
      "participant1_alias": "Nazlı42",
      "participant2_alias": "MisafirAli",
      "winner_alias": "Nazlı42"
    },
    "persistedToHistory": false
  }
}
```

> **`persistedToHistory`:** Her iki oyuncu da kayıtlı kullanıcıysa `true` (match_history tablosuna kaydedilir). Misafir varsa `false`.

#### Bracket Durumunu Alma

```
GET /api/local-tournament/1/bracket
```

Round'lara göre organize edilmiş tüm maçlar ve katılımcılar döner.

---

### Aşama 5: Turnuvayı Bitirme

Son round kazananı belliyken:

```
POST /api/local-tournament/1/complete
Authorization: Bearer <token>
```

```json
{
  "winnerParticipantId": 1
}
```

**Yanıt:**
```json
{
  "success": true,
  "data": {
    "tournament": { "id": 1, "status": "completed", "winner_id": 5, ... },
    "winner": {
      "participantId": 1,
      "userId": 5,
      "alias": "Nazlı42",
      "isGuest": false
    }
  }
}
```

---

## 📊 Veri Tipleri Referansı

### game_mode
| Değer | Açıklama |
|---|---|
| `modern` | Modern mod (power-up'lı) |
| `nostalgia` | Klasik pong |
| `tournament` | Turnuva maçı |

### match_type
| Değer | Açıklama |
|---|---|
| `h2h` | İnsan vs İnsan |
| `h2ai` | İnsan vs AI |

### Tournament Status Akışı
```
pending → in_progress → completed
```

### Participant Status Akışı
```
registered → playing → eliminated / winner
```

---

## ❌ Hata Kodları

| HTTP | Code | Açıklama |
|------|------|----------|
| 400 | `VALIDATION_ERROR` | Geçersiz istek verisi |
| 400 | `INVALID_PLAYERS` | Geçersiz oyuncu (ikisi de null / aynı kişi) |
| 401 | `INVALID_CREDENTIALS` | Yanlış şifre |
| 403 | `FORBIDDEN` | Yetki yok (kendi maçını kaydet) |
| 404 | `NOT_FOUND` | Kaynak bulunamadı |
| 404 | `PLAYER_NOT_FOUND` | Oyuncu bulunamadı |

---

Kolay gelsin! 🎮  
Backend Ekibi
