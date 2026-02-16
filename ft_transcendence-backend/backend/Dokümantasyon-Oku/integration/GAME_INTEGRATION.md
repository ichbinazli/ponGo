# 🎮 Game Entegrasyon

Pong oyunu ve turnuva sistemi için backend API kullanımı.

---

## Maç Kaydetme

### 1. Maç Sonucu Kaydetme (Global)

Oyun bittiğinde bu endpoint'e istek atılır.

```javascript
const matchData = {
  player1_id: 1,
  player2_id: 2,
  player1_score: 11,
  player2_score: 5,
  winner_id: 1,
  
  // V2 Yeni Alanlar
  game_mode: "modern",          // "modern" | "nostalgia" | "tournament"
  match_type: "h2h",            // "h2h" | "h2ai"
  player1_name: "PlayerOne",    // Snapshot
  player2_name: "PlayerTwo",    // Snapshot (veya "AI Player")
  aiDifficultly: null,          // "easy" | "medium" | "hard" (Sadece h2ai için)
  winning_score: 11,
  player1_power_up_freeze: true,
  player1_power_up_mega: false,
  player2_power_up_freeze: false,
  player2_power_up_mega: true,
  
  duration_seconds: 120
};

// AI Maçı için match_type: "h2ai" ve player2_id gönderilmesine gerek yok
// (Backend otomatik AI player atar)

await fetch('/api/matches', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(matchData)
});
```

---

## Turnuva Sistemi

### Turnuva Türleri

| Tür | `is_local` | Özellik |
|-----|------------|---------|
| Online | 0 | Sadece kayıtlı kullanıcılar |
| Local | 1 | Kayıtlı + misafir oyuncular |

### Status Değerleri

```
pending → in_progress → completed
                     ↘ cancelled
```

---

## Local Turnuva Akışı

### 1. Turnuva Oluştur

```javascript
const res = await fetch('/api/local-tournament/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Haftalık Turnuva',
    max_players: 8
  })
});
```

### 2. Kayıtlı Kullanıcı Ekle (Şifre ile Doğrulama)

```javascript
await fetch('/api/local-tournament/verify-participant', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    tournamentId: 1,
    username: 'player2',
    password: 'KullaniciSifresi123!'
  })
});
```

### 3. Misafir Ekle

```javascript
await fetch('/api/local-tournament/add-guest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    tournamentId: 1,
    alias: 'GuestPlayer1'
  })
});
```

### 4. Turnuvayı Başlat

```javascript
const res = await fetch('/api/local-tournament/1/start', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }
});
// Bracket bilgisi döner
```

### 5. Maç Sonucu Kaydet

```javascript
await fetch('/api/local-tournament/match/1/result', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    participant1_score: 11,
    participant2_score: 5,
    duration_seconds: 120
  })
});
```

### 6. Bracket Görüntüle

```javascript
const res = await fetch('/api/local-tournament/1/bracket');
const { data } = await res.json();
// data.participants, data.matches
```

---

## İstatistikler

### Kullanıcı Stats

```javascript
const res = await fetch('/api/users/5/stats');
// { total_matches, wins, losses, win_rate }
```

### Leaderboard

```javascript
const res = await fetch('/api/stats/leaderboard?limit=10');
// { leaderboard: [...], total }
```

### Global Stats

```javascript
const res = await fetch('/api/stats/global');
// { totalUsers, playersOnline, totalMatches, gamesToday }
```

---

## Veri Akışı (Kayıtlı vs Misafir)

```
┌────────────────────────────────────────┐
│ Her iki oyuncu da kayıtlı mı?          │
├────────────────────────────────────────┤
│ EVET → match_history'e yaz             │
│      → İstatistikleri güncelle         │
│      → Leaderboard'a yansıt            │
├────────────────────────────────────────┤
│ HAYIR → Sadece tournament_matches'te   │
│       → İstatistikler ETKİLENMEZ       │
└────────────────────────────────────────┘
```

---

*Son Güncelleme: Ocak 2026*
