# 🗄️ Database Schema

SQLite veritabanı şeması (better-sqlite3).

**Dosya:** `database/transcendence.db`

---

## Tablolar

| # | Tablo | Açıklama |
|---|-------|----------|
| 1 | `users` | Kullanıcı hesapları |
| 2 | `sessions` | JWT refresh token'ları |
| 3 | `friendships` | Arkadaşlık ilişkileri |
| 4 | `match_history` | Maç kayıtları |
| 5 | `tournaments` | Turnuva bilgileri |
| 6 | `tournament_participants` | Turnuva katılımcıları |
| 7 | `tournament_matches` | Turnuva maçları |

---

## 1. users

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
    backup_codes TEXT,
    is_online INTEGER DEFAULT 0,
    last_seen_at DATETIME,
    anonymized INTEGER DEFAULT 0,
    anonymized_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. sessions

```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    refresh_token TEXT UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 3. friendships

```sql
CREATE TABLE friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',  -- pending, accepted, blocked
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, friend_id)
);
```

---

## 4. match_history

```sql
CREATE TABLE match_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id INTEGER NOT NULL,
    player2_id INTEGER NOT NULL,
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    winner_id INTEGER,
    game_type TEXT DEFAULT 'pong',
    tournament_id INTEGER,
    duration_seconds INTEGER,
    started_at DATETIME,
    ended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id),
    FOREIGN KEY (winner_id) REFERENCES users(id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
);
```

---

## 5. tournaments

```sql
CREATE TABLE tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',  -- pending, in_progress, completed, cancelled
    max_players INTEGER DEFAULT 8,
    current_round INTEGER DEFAULT 0,
    winner_id INTEGER,
    created_by INTEGER NOT NULL,
    is_local INTEGER DEFAULT 0,      -- Local turnuva mı?
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    ended_at DATETIME,
    FOREIGN KEY (winner_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

---

## 6. tournament_participants

```sql
CREATE TABLE tournament_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    user_id INTEGER,                 -- NULL = misafir
    alias TEXT NOT NULL,             -- Görüntülenecek isim
    placement INTEGER,
    status TEXT DEFAULT 'registered', -- registered, playing, eliminated, winner
    is_guest INTEGER DEFAULT 0,      -- Misafir mi?
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 7. tournament_matches

```sql
CREATE TABLE tournament_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    round INTEGER NOT NULL,
    match_order INTEGER NOT NULL,
    participant1_id INTEGER,
    participant2_id INTEGER,
    participant1_score INTEGER DEFAULT 0,
    participant2_score INTEGER DEFAULT 0,
    winner_participant_id INTEGER,
    status TEXT DEFAULT 'pending',   -- pending, in_progress, completed, cancelled
    duration_seconds INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    ended_at DATETIME,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (participant1_id) REFERENCES tournament_participants(id),
    FOREIGN KEY (participant2_id) REFERENCES tournament_participants(id),
    UNIQUE(tournament_id, round, match_order)
);
```

---

## İlişki Diyagramı

```
users
  ├── sessions (1:N)
  ├── friendships (N:N)
  ├── match_history (N:N)
  ├── tournaments.created_by (1:N)
  └── tournament_participants (1:N)

tournaments
  ├── tournament_participants (1:N)
  └── tournament_matches (1:N)

tournament_participants
  └── tournament_matches (N:N)
```

---

## Migrations

| # | Dosya | İçerik |
|---|-------|--------|
| 1 | `001_create_users_table.sql` | users tablosu |
| 2 | `002_create_sessions_table.sql` | sessions tablosu |
| 3 | `003_create_friendships_table.sql` | friendships tablosu |
| 4 | `004_create_match_history_table.sql` | match_history tablosu |
| 5 | `005_create_tournaments_table.sql` | tournaments + participants |
| 6 | `006_add_backup_codes.sql` | 2FA yedek kodlar |
| 7 | `007_add_tournament_matches.sql` | Local turnuva desteği |

---

*Son Güncelleme: Ocak 2026*
