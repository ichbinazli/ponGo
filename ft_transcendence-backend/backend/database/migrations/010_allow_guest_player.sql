-- Migration: Allow guest (unregistered) player in human-human matches
-- Created: 2026-02-21
-- Description: player2_id artık NULL olabilir (misafir oyuncu desteği)
-- SQLite'da NOT NULL constraint doğrudan kaldırılamaz, tablo yeniden oluşturuluyor.

-- 1) Yeni tablo oluştur (player2_id NOT NULL kaldırıldı)
CREATE TABLE match_history_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Players (player2 can be NULL for guest)
    player1_id INTEGER NOT NULL,
    player2_id INTEGER,

    -- Scores
    player1_score INTEGER NOT NULL DEFAULT 0,
    player2_score INTEGER NOT NULL DEFAULT 0,

    -- Winner (NULL for draw)
    winner_id INTEGER,

    -- Game type
    game_type TEXT DEFAULT 'pong' CHECK(game_type IN ('pong', 'tournament', 'ai', 'other')),

    -- Tournament reference
    tournament_id INTEGER,

    -- Game duration in seconds
    duration_seconds INTEGER,

    -- Timestamps
    started_at DATETIME,
    ended_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- V2 fields
    game_mode TEXT DEFAULT 'modern',
    match_type TEXT DEFAULT 'h2h',
    ai_difficulty TEXT,
    player1_name TEXT,
    player2_name TEXT,
    winning_score INTEGER DEFAULT 0,
    p1_power_up_freeze INTEGER DEFAULT 0,
    p1_power_up_mega INTEGER DEFAULT 0,
    p2_power_up_freeze INTEGER DEFAULT 0,
    p2_power_up_mega INTEGER DEFAULT 0,

    -- Foreign keys
    FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (player2_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 2) Mevcut verileri kopyala
INSERT INTO match_history_new SELECT * FROM match_history;

-- 3) Eski tabloyu sil
DROP TABLE match_history;

-- 4) Yeni tabloyu eski isimle yeniden adlandır
ALTER TABLE match_history_new RENAME TO match_history;

-- 5) Index'leri yeniden oluştur
CREATE INDEX IF NOT EXISTS idx_match_player1 ON match_history(player1_id);
CREATE INDEX IF NOT EXISTS idx_match_player2 ON match_history(player2_id);
CREATE INDEX IF NOT EXISTS idx_match_winner ON match_history(winner_id);
CREATE INDEX IF NOT EXISTS idx_match_game_type ON match_history(game_type);
CREATE INDEX IF NOT EXISTS idx_match_ended_at ON match_history(ended_at);
