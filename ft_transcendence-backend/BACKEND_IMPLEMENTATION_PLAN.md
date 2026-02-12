# Backend API Güncellemeleri — Implementation Plan

**Tarih:** 2026-02-12  
**Alan:** Backend (Fastify + SQLite)  
**Amaç:** AI maç geçmişi desteği, oyun endpoint güncellemesi, tespit edilen sorunların düzeltilmesi

---

## 🔴 Tespit Edilen Sorunlar ve Düzeltmeleri

---

### SORUN 1: Match Endpoint'lerinde Authentication Yok (Güvenlik Açığı)

**Dosya:** `src/routes/match.routes.ts`

**Mevcut Durum:**  
`POST /api/matches`, `GET /api/matches`, `GET /api/matches/:id` — hiçbirinde `authenticate` middleware yok. Herhangi biri token göndermeden maç oluşturabilir, sahte skorlar kaydedebilir.

```typescript
// ŞU AN — auth middleware yok:
fastify.post('/', matchController.createMatch.bind(matchController));
fastify.get('/:id', matchController.getMatch.bind(matchController));
fastify.get('/', matchController.getMatches.bind(matchController));
```

**Düzeltme:**  
`POST` route'a `authenticate` preHandler ekleniyor. `GET` route'lar dashboard/public kullanım için açık kalabilir.

```typescript
// SONRA:
fastify.post('/', { preHandler: [authenticate] }, matchController.createMatch.bind(matchController));
```

**Etkilenen Ekip:**  
- **Frontend Oyun:** `POST /api/matches` çağırırken artık `Authorization: Bearer <token>` header göndermek **zorunlu**. Göndermezse `401 Unauthorized` alır.

---

### SORUN 2: Başkasının Adına Maç Kaydedebilme

**Dosya:** `src/controllers/match.controller.ts`

**Mevcut Durum:**  
`createMatch()` fonksiyonunda `request.user` hiç kullanılmıyor. Body'de herhangi bir `player1_id` göndererek, başka bir kullanıcının adına sahte maç oluşturulabilir.

```typescript
// ŞU AN — request.user hiç kontrol edilmiyor:
const validatedData = createMatchSchema.parse(request.body);
const player1 = userModel.findById(validatedData.player1_id); // body'den gelen ID
```

**Düzeltme:**  
Auth eklendikten sonra, `player1_id` veya `player2_id`'den birinin `request.user.id` olması doğrulanacak.

```typescript
// SONRA:
const userId = request.user.id;
if (validatedData.player1_id !== userId && validatedData.player2_id !== userId) {
    return reply.status(403).send({ error: 'Sadece kendi maçınızı kaydedebilirsiniz' });
}
```

**Etkilenen Ekip:**  
- **Frontend Oyun:** Maç kaydederken `player1_id` veya `player2_id`'den biri giriş yapan kullanıcının ID'si olmalı.

---

### SORUN 3: Aynı Oyuncu Kendine Karşı Maç Oynayabilir

**Dosya:** `src/controllers/match.controller.ts`

**Mevcut Durum:**  
`player1_id === player2_id` kontrolü yok. Aynı ID ile kendine karşı maç oluşturup istatistikleri manipüle etmek mümkün.

**Düzeltme:**  
```typescript
if (validatedData.player1_id === validatedData.player2_id) {
    return reply.status(400).send({ error: 'Kendinize karşı oynayamazsınız' });
}
```

**Etkilenen Ekip:** Yok — ek validasyon, mevcut davranışı bozmaz.

---

### SORUN 4: `getMatches` Offset Parametresini Kullanmıyor (Sayfalama Bozuk)

**Dosya:** `src/controllers/match.controller.ts` — satır 181-182

**Mevcut Durum:**
```typescript
const query = getMatchesQuerySchema.parse(request.query); // offset parse ediliyor
const matches = matchHistoryModel.getRecentMatches(query.limit); // ← offset hiç gönderilmiyor!

// Response'ta offset bilgisi var ama gerçekte uygulanmıyor:
pagination: {
    limit: query.limit,
    offset: query.offset,  // ← bu bilgi yalan, çünkü altta kullanılmıyor
}
```

**Düzeltme:**  
`getRecentMatches()` metoduna offset parametresi eklenecek ve controller'da kullanılacak.

**Etkilenen Ekip:**  
- **Frontend Dashboard:** Maç listesinde sayfalama artık gerçekten çalışacak.

---

### SORUN 5: Tournament `recordMatchResult` — participant_id / user_id Karışıklığı (Bug)

**Dosya:** `src/controllers/localTournament.controller.ts` — satır 416-436

**Mevcut Durum:**  
Kazanan için `updateParticipantStatus()` çağrılırken `winnerParticipantId` (tournament_participants.id) gönderiliyor, ama fonksiyon `user_id` (users.id) bekliyor. **Kaybeden** tarafta ise doğru yapılmış — bu tutarsızlık açıkça bir bug.

```typescript
// KAZANAN — BUG:
tournamentModel.updateParticipantStatus(
    match.tournament_id,
    winnerParticipantId,  // ← tournament_participants.id gönderiliyor
    'playing'
);

// KAYBEDEN — DOĞRU:
const loserParticipant = tournamentModel.getParticipant(loserParticipantId);
if (loserParticipant && loserParticipant.user_id) {
    tournamentModel.updateParticipantStatus(
        match.tournament_id,
        loserParticipant.user_id,  // ← users.id gönderiliyor — DOĞRU
        'eliminated'
    );
}
```

`updateParticipantStatus()` fonksiyonu: `WHERE tournament_id = ? AND user_id = ?` sorgusu çalıştırıyor.

**Düzeltme:**
```typescript
// SONRA — kazanan için de doğru user_id kullanılacak:
const winnerParticipant = tournamentModel.getParticipant(winnerParticipantId);
if (winnerParticipant?.user_id) {
    tournamentModel.updateParticipantStatus(
        match.tournament_id,
        winnerParticipant.user_id,
        'playing'
    );
}
```

**Etkilenen Ekip:**  
- **Frontend Turnuva:** API çağrısı aynı kalıyor ama artık katılımcı durumları doğru güncelleniyor.

---

## ℹ️ Bilgi Notu (Düzeltme Gerekmez)

### winner_id null / undefined Davranışı

`match.controller.ts`'de `winner_id` otomatik belirleme mantığı:
```typescript
let winnerId = validatedData.winner_id;
if (winnerId === undefined) {  // sadece undefined'da auto-detect çalışıyor
    // skorlara göre kazanan belirleniyor...
}
```

- `winner_id` **gönderilmezse** (undefined) → skorlara göre otomatik belirleniyor ✓
- `winner_id: null` **açıkça gönderilirse** → berabere olarak kaydediliyor (auto-detect atlanıyor)

Bu bir bug değil, **tasarım tercihi**. Frontend bilinçli olarak `null` gönderiyorsa "berabere" demek istiyor demektir. Eğer kazananın otomatik belirlenmesini istiyorsanız `winner_id` alanını body'den **çıkarın** (göndermeyin).

---

## ✅ Yeni Özellikler

---

### Veritabanı: AI Player Desteği

**Yeni Dosya:** `database/migrations/008_add_ai_support.sql`

**Neden Gerekli?**  
`match_history`'de `player1_id` ve `player2_id` → `users` tablosuna FOREIGN KEY ile bağlı. AI ile oynanan bir maçı kaydetmek için AI'nın `users` tablosunda bir kaydı olmalı. Şu an `game_type` constraint'i `'ai'` kabul etmiyor.

**Yapılacak:**
- `users` tablosuna `is_ai INTEGER DEFAULT 0` kolonu
- `game_type` constraint'ine `'ai'` eklenmesi
- AI kullanıcı kaydı: `email: ai-player@system.local`, `display_name: AI Player`, `is_ai: 1`

**Etkilenen Ekip:**
| Ekip | Etki |
|------|------|
| **Frontend Oyun** | AI maçı kaydederken `game_type: 'ai'` gönderecek. `player2_id` gerekmez — backend otomatik atar |
| **Frontend Profil** | Maç listesinde `game_type === 'ai'` → "vs AI" gösterimi yapılabilir |
| **Frontend Leaderboard** | Değişiklik yok — AI kullanıcı otomatik filtreleniyor |
| **DevOps** | Migration otomatik çalışır (sunucu başlatılınca) |

---

### Model: user.model.ts Güncellemesi

- `User` interface → `is_ai: number` ekleme
- `getOrCreateAIUser()` metodu — AI kullanıcıyı bul veya oluştur
- `search()`, `getOnlineUsers()` → `AND is_ai = 0` filtresi (AI kullanıcı arama/online listesinde görünmez)

**Etkilenen Ekip:** Yok — filtre backend'de otomatik uygulanır.

---

### Model: match.model.ts Güncellemesi

- `GameType` → `'ai'` seçeneği ekleme
- Tüm maç sorguları `JOIN` → `LEFT JOIN` (AI/silinmiş kullanıcı desteği)
- `getLeaderboard()`, `getUserRank()` → `AND u.is_ai = 0` (AI sıralamada yok)
- `getRecentMatches()` → offset parametresi ekleme (SORUN 4 düzeltmesi)

**Etkilenen Ekip:**
- **Frontend Maç Listesi:** AI maçlarında `player2_display_name = "AI Player"` gelecek
- **Frontend Leaderboard:** Değişiklik yok — AI otomatik filtreleniyor

---

### Controller: Yeni AI Maç Endpoint'i

**Yeni route:** `POST /api/matches/ai`

Frontend sadece basit bilgileri gönderir, backend AI user atamasını otomatik yapar:

```javascript
// Frontend kullanımı:
fetch('/api/matches/ai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    player_id: currentUser.id,
    player_score: 11,
    ai_score: 7,
    duration_seconds: 120  // opsiyonel
  })
});

// Response:
{
  "success": true,
  "data": {
    "match": {
      "id": 42,
      "player1_id": 1,
      "player2_id": 999,          // AI user ID (otomatik)
      "player1_score": 11,
      "player2_score": 7,
      "winner_id": 1,              // Otomatik hesaplanır
      "game_type": "ai",
      "player2_display_name": "AI Player"
    }
  }
}
```

---

## Frontend Ekibi İçin Kısa Özet

> ⚠️ **Breaking Change:** `POST /api/matches` artık `Authorization: Bearer <token>` header'ı **zorunlu** tutuyor. Token göndermezseniz `401 Unauthorized` alırsınız.

> 💡 **Oyun ekibi:** AI maçı → `POST /api/matches/ai`. PvP maçı → mevcut `POST /api/matches`.

> 💡 **Profil ekibi:** Maç geçmişinde `game_type === 'ai'` → "vs AI" gösterimi. `player2_display_name` = `"AI Player"`.

> 💡 **Leaderboard ekibi:** Değişiklik yok — AI filtresi backend'de otomatik.

---

## Özet Tablo

| # | Konu | Tip | Ciddiyet | Durum |
|---|------|-----|----------|-------|
| 1 | Match endpoint'lerinde auth yok | 🐛 Bug | 🔴 Yüksek | Düzeltilecek |
| 2 | Başkası adına maç kaydedebilme | 🐛 Bug | 🔴 Yüksek | Düzeltilecek |
| 3 | Kendine karşı oynayabilme | 🐛 Bug | 🟡 Orta | Düzeltilecek |
| 4 | Offset/sayfalama çalışmıyor | 🐛 Bug | 🟡 Orta | Düzeltilecek |
| 5 | Tournament participant_id/user_id bug | 🐛 Bug | 🟡 Orta | Düzeltilecek |
| 6 | AI maç desteği yok | ✨ Özellik | 🔴 Yüksek | Eklenecek |
| 7 | winner_id null/undefined davranışı | ℹ️ Bilgi | 🟢 Düşük | Tasarım gereği, değişiklik yok |

---

## 📝 Yapılan Değişikliklerin Detaylı Listesi

---

### 1. [YENİ DOSYA] `database/migrations/008_add_ai_support.sql`

**Tüm dosya yeni oluşturuldu** (68 satır)

Yapılan işlemler:
- `users` tablosuna `is_ai INTEGER DEFAULT 0` kolonu ekleme (`ALTER TABLE`)
- `match_history` tablosunu yeniden oluşturma (SQLite'da CHECK constraint değiştirilemez)
  - Geçici tablo oluşturma → veri kopyalama → eski tabloyu silme → yeni tabloyu adlandırma
  - `game_type` constraint: `('pong','tournament','other')` → `('pong','tournament','ai','other')`
- Index'leri yeniden oluşturma (5 index)
- AI kullanıcı kaydı: `INSERT OR IGNORE INTO users (...) VALUES ('ai-player@system.local', 'AI Player', 1, '', 'default-avatar.png')`

---

### 2. [DEĞİŞTİRİLDİ] `src/models/user.model.ts`

| Satır | Değişiklik | Açıklama |
|-------|-----------|----------|
| 17 | `is_ai: number;` eklendi | `User` interface'ine yeni alan |
| 72-96 | Yeni metod: `getOrCreateAIUser()` | AI kullanıcıyı `is_ai = 1` ile arar, yoksa oluşturur |
| 280 | `AND is_ai = 0` eklendi | `getOnlineUsers()` sorgusuna AI filtresi |
| 302 | `AND is_ai = 0` eklendi | `search()` sorgusuna AI filtresi |

---

### 3. [DEĞİŞTİRİLDİ] `src/models/match.model.ts`

| Satır | Değişiklik | Açıklama |
|-------|-----------|----------|
| 6 | `'ai'` eklendi | `GameType = 'pong' \| 'tournament' \| 'ai' \| 'other'` |
| 112-118 | `JOIN` → `LEFT JOIN` + `COALESCE` | `getMatchWithPlayers()` — p1 ve p2 için null-safe |
| 137-148 | `JOIN` → `LEFT JOIN` + `COALESCE` | `getUserMatches()` — p1 ve p2 için null-safe |
| 164-175 | `JOIN` → `LEFT JOIN` + `COALESCE` | `getMatchesBetweenUsers()` — p1 ve p2 için null-safe |
| 223 | `getRecentMatches(limit = 10)` → `getRecentMatches(limit = 10, offset = 0)` | Offset parametresi eklendi |
| 226-238 | `JOIN` → `LEFT JOIN` + `COALESCE` + `OFFSET ?` | `getRecentMatches()` — null-safe + offset desteği |
| 290 | `AND u.is_ai = 0` eklendi | `getLeaderboard()` — AI kullanıcı hariç |
| 331 | `AND u.is_ai = 0` eklendi | `getUserRank()` — AI kullanıcı hariç |
| 353 | `AND is_ai = 0` eklendi | `getGlobalStats()` — totalUsers'dan AI hariç |
| 359 | `AND is_ai = 0` eklendi | `getGlobalStats()` — playersOnline'dan AI hariç |
| 389 | `AND is_ai = 0` eklendi | `getGlobalStats()` — activeUsers24h'den AI hariç |

---

### 4. [DEĞİŞTİRİLDİ] `src/controllers/match.controller.ts`

Dosya tamamen yeniden yazıldı. Değişiklikler:

| Satır Aralığı | Değişiklik | Düzeltilen Sorun |
|---------------|-----------|-----------------|
| 18 | `game_type` enum'a `'ai'` eklendi | Yeni özellik |
| 24-31 | Yeni schema: `createAIMatchSchema` | Yeni özellik — AI maç kayıt validasyonu |
| 57-60 | `request.user.id` kontrolü | SORUN 2 — başkası adına maç engellendi |
| 61-65 | `player1_id !== userId && player2_id !== userId` kontrolü | SORUN 2 — yetkisiz erişim engellendi |
| 69-77 | `player1_id === player2_id` kontrolü | SORUN 3 — kendine karşı oynama engellendi |
| 78-89 | AI maçlarında `player1_id !== userId` kontrolü | SORUN 2 — AI maçlarında da sahtecilik engellendi |
| 103-107 | AI maçlarında otomatik AI user ataması | Yeni özellik — `player2_id` otomatik |
| 186-268 | Yeni metod: `createAIMatch()` | Yeni özellik — `POST /api/matches/ai` |
| 321 | `getRecentMatches(query.limit, query.offset)` | SORUN 4 — offset gerçekten kullanılıyor |

---

### 5. [DEĞİŞTİRİLDİ] `src/routes/match.routes.ts`

Dosya tamamen yeniden yazıldı. Değişiklikler:

| Satır | Değişiklik | Düzeltilen Sorun |
|-------|-----------|-----------------|
| 3 | `import { authenticate }` eklendi | SORUN 1 — auth import |
| 32-35 | `POST /` → `{ preHandler: [authenticate] }` eklendi | SORUN 1 — auth zorunlu |
| 54-58 | Yeni route: `POST /ai` + `{ preHandler: [authenticate] }` | Yeni özellik |

---

### 6. [DEĞİŞTİRİLDİ] `src/controllers/localTournament.controller.ts`

| Satır | Değişiklik | Düzeltilen Sorun |
|-------|-----------|-----------------|
| 415-424 | `updateParticipantStatus()` çağrısı düzeltildi | SORUN 5 |

Eski kod:
```typescript
tournamentModel.updateParticipantStatus(match.tournament_id, winnerParticipantId, 'playing');
```

Yeni kod:
```typescript
if (winnerParticipant && winnerParticipant.user_id) {
    tournamentModel.updateParticipantStatus(match.tournament_id, winnerParticipant.user_id, 'playing');
}
```

