# 🎮 Game Module Entegrasyon Rehberi

Backend API'yi Pong oyunu ve turnuva sistemi için nasıl kullanacağınızı anlatan rehber.

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Maç Kaydetme](#maç-kaydetme)
3. [Turnuva Sistemi](#turnuva-sistemi)
4. [Local Turnuva](#local-turnuva)
5. [İstatistikler](#i̇statistikler)
6. [Veri Modelleri](#veri-modelleri)

---

## Genel Bakış

Game modülü backend ile şu işlemleri yapabilir:

| İşlem | Endpoint | Auth |
|-------|----------|------|
| Maç kaydet | `POST /api/matches` | ✅ |
| Maç geçmişi | `GET /api/matches` | ❌ |
| Kullanıcı istatistikleri | `GET /api/users/:id/stats` | ❌ |
| Leaderboard | `GET /api/stats/leaderboard` | ❌ |
| Turnuva oluştur | `POST /api/local-tournament/create` | ✅ |

---

## Maç Kaydetme

### Normal Maç

Oyun bittiğinde maç sonucunu backend'e kaydedin:

```javascript
async function saveMatchResult(matchData) {
  const response = await fetch('/api/matches', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      player1_id: matchData.player1Id,
      player2_id: matchData.player2Id,
      player1_score: matchData.player1Score,
      player2_score: matchData.player2Score,
      game_type: matchData.gameType,        // 'pong', 'tournament', 'other'
      duration_seconds: matchData.duration,
      started_at: matchData.startedAt       // ISO format
    })
  });

  return response.json();
}
```

### İstek Formatı

```json
{
  "player1_id": 1,
  "player2_id": 2,
  "player1_score": 11,
  "player2_score": 7,
  "game_type": "pong",
  "duration_seconds": 180,
  "started_at": "2026-01-27T12:00:00.000Z"
}
```

### Yanıt

```json
{
  "success": true,
  "data": {
    "id": 42,
    "player1_id": 1,
    "player2_id": 2,
    "player1_score": 11,
    "player2_score": 7,
    "winner_id": 1,
    "game_type": "pong",
    "duration_seconds": 180,
    "ended_at": "2026-01-27T12:03:00.000Z"
  }
}
```

---

## Turnuva Sistemi

### Turnuva Türleri

| Tür | `is_local` | Özellik |
|-----|------------|---------|
| **Online** | `false` | Sadece kayıtlı kullanıcılar |
| **Local** | `true` | Kayıtlı + misafir oyuncular |

### Turnuva Status Değerleri

```
pending → in_progress → completed
                     ↘ cancelled
```

| Status | Açıklama |
|--------|----------|
| `pending` | Katılımcı bekleniyor |
| `in_progress` | Turnuva devam ediyor |
| `completed` | Turnuva tamamlandı |
| `cancelled` | Turnuva iptal edildi |

---

## Local Turnuva

Local turnuva, tek bir cihazda oynanan ve misafir oyuncuları destekleyen turnuva türüdür.

### 1. Turnuva Oluştur

```javascript
const response = await fetch('/api/local-tournament/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    name: 'Haftalık Turnuva',
    description: 'Arkadaşlar arası turnuva',
    max_players: 8
  })
});
```

### 2. Kayıtlı Kullanıcı Ekle (2FA ile)

Kayıtlı kullanıcılar 2FA koduyla doğrulanır:

```javascript
const response = await fetch('/api/local-tournament/verify-participant', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    tournamentId: 1,
    username: 'player2',
    code: '123456'  // 2FA kodu
  })
});
```

### 3. Misafir Ekle

Misafirler için 2FA gerekmez:

```javascript
const response = await fetch('/api/local-tournament/add-guest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    tournamentId: 1,
    alias: 'GuestPlayer1'  // Benzersiz takma ad
  })
});
```

### 4. Turnuvayı Başlat

```javascript
const response = await fetch('/api/local-tournament/1/start', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Yanıt: Bracket bilgisi ile
{
  "success": true,
  "data": {
    "tournament": { ... },
    "bracket": {
      "round1": [
        { "id": 1, "participant1": {...}, "participant2": {...} },
        { "id": 2, "participant1": {...}, "participant2": {...} }
      ]
    }
  }
}
```

### 5. Maç Sonucu Kaydet

```javascript
const response = await fetch('/api/local-tournament/match/1/result', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    participant1_score: 11,
    participant2_score: 5,
    duration_seconds: 120
  })
});
```

### 6. Bracket Görüntüle

```javascript
const response = await fetch('/api/local-tournament/1/bracket');
const { data } = await response.json();

// Bracket yapısı
{
  "participants": [...],
  "matches": {
    "1": [...],  // Round 1
    "2": [...],  // Round 2 (semifinal)
    "3": [...]   // Final
  }
}
```

### Veri Akışı (Kayıtlı vs Misafir)

```
┌────────────────────────────────────────────────────────┐
│                    Maç Sonucu                          │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Her iki oyuncu da kayıtlı kullanıcı mı?              │
│                                                        │
│    EVET ─────► match_history tablosuna yaz            │
│              ► Kullanıcı istatistikleri güncelle       │
│              ► Leaderboard'a yansıt                    │
│                                                        │
│    HAYIR ────► Sadece tournament_matches'te sakla      │
│              ► İstatistikler ETKİLENMEZ               │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## İstatistikler

### Kullanıcı İstatistikleri

```javascript
const response = await fetch('/api/users/5/stats');
const { data } = await response.json();
```

```json
{
  "total_matches": 42,
  "wins": 28,
  "losses": 14,
  "win_rate": 66.67,
  "total_points_scored": 385,
  "total_points_against": 280,
  "average_score": 9.17
}
```

### Global İstatistikler

```javascript
const response = await fetch('/api/stats/global');
```

```json
{
  "totalUsers": 150,
  "playersOnline": 23,
  "totalMatches": 1247,
  "gamesToday": 45,
  "bestScore": 11,
  "activeUsers24h": 67
}
```

### Leaderboard

```javascript
const response = await fetch('/api/stats/leaderboard?page=1&limit=10');
const { data } = await response.json();
```

```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user_id": 5,
      "display_name": "ProPlayer",
      "wins": 45,
      "total_matches": 60,
      "win_rate": 75
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150
  }
}
```

---

## Veri Modelleri

### Match

```typescript
interface Match {
  id: number;
  player1_id: number;
  player2_id: number;
  player1_score: number;
  player2_score: number;
  winner_id: number | null;
  game_type: 'pong' | 'tournament' | 'other';
  tournament_id: number | null;
  duration_seconds: number | null;
  started_at: string | null;
  ended_at: string;
}
```

### TournamentParticipant

```typescript
interface TournamentParticipant {
  id: number;
  tournament_id: number;
  user_id: number | null;     // Misafir için NULL
  alias: string;              // Görüntülenecek isim
  is_guest: boolean;          // Misafir mi?
  status: 'registered' | 'playing' | 'eliminated' | 'winner';
  placement: number | null;   // Final sıralaması
}
```

### TournamentMatch

```typescript
interface TournamentMatch {
  id: number;
  tournament_id: number;
  round: number;              // 1, 2, 3... (final için en yüksek)
  match_order: number;        // Tur içindeki sıra
  participant1_id: number | null;
  participant2_id: number | null;
  participant1_score: number;
  participant2_score: number;
  winner_participant_id: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}
```

---

## Örnek: Tam Oyun Akışı

```javascript
class GameAPI {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = '/api';
  }

  async saveMatch(player1Id, player2Id, scores, gameType = 'pong') {
    const response = await fetch(`${this.baseURL}/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify({
        player1_id: player1Id,
        player2_id: player2Id,
        player1_score: scores.player1,
        player2_score: scores.player2,
        game_type: gameType,
        duration_seconds: scores.duration
      })
    });
    return response.json();
  }

  async getLeaderboard(limit = 10) {
    const response = await fetch(`${this.baseURL}/stats/leaderboard?limit=${limit}`);
    return response.json();
  }

  async getUserStats(userId) {
    const response = await fetch(`${this.baseURL}/users/${userId}/stats`);
    return response.json();
  }
}
```

---

*Son Güncelleme: Ocak 2026*
