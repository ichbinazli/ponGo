-- Migration: Add AI player support
-- Created: 2026-02-12
-- Description: 
--   1. users tablosuna is_ai kolonu ekleniyor
--   2. match_history tablosundaki game_type CHECK constraint güncelleniyor ('ai' ekleniyor)
--   3. AI kullanıcı kaydı oluşturuluyor

-- Step 1: users tablosuna is_ai kolonu ekle
ALTER TABLE users ADD COLUMN is_ai INTEGER DEFAULT 0;

-- Step 2: match_history tablosundaki game_type constraint güncelleme
-- SQLite'da CHECK constraint doğrudan ALTER ile değiştirilemez
-- Bu yüzden tabloyu yeniden oluşturuyoruz

-- Geçici tablo oluştur
CREATE TABLE match_history_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Players
    player1_id INTEGER NOT NULL,
    player2_id INTEGER NOT NULL,
    
    -- Scores
    player1_score INTEGER NOT NULL DEFAULT 0,
    player2_score INTEGER NOT NULL DEFAULT 0,
    
    -- Winner (NULL for draw)
    winner_id INTEGER,
    
    -- Game type: pong, tournament, ai, other
    game_type TEXT DEFAULT 'pong' CHECK(game_type IN ('pong', 'tournament', 'ai', 'other')),
    
    -- Tournament reference (if part of a tournament)
    tournament_id INTEGER,
    
    -- Game duration in seconds
    duration_seconds INTEGER,
    
    -- Timestamps
    started_at DATETIME,
    ended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (player2_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Mevcut verileri kopyala
INSERT INTO match_history_new 
SELECT * FROM match_history;

-- Eski tabloyu sil
DROP TABLE match_history;

-- Yeni tabloyu eski isimle yeniden adlandır
ALTER TABLE match_history_new RENAME TO match_history;

-- Index'leri yeniden oluştur
CREATE INDEX IF NOT EXISTS idx_match_player1 ON match_history(player1_id);
CREATE INDEX IF NOT EXISTS idx_match_player2 ON match_history(player2_id);
CREATE INDEX IF NOT EXISTS idx_match_winner ON match_history(winner_id);
CREATE INDEX IF NOT EXISTS idx_match_game_type ON match_history(game_type);
CREATE INDEX IF NOT EXISTS idx_match_ended_at ON match_history(ended_at);

-- Step 3: AI kullanıcı kaydı oluştur
-- password_hash boş bırakılıyor çünkü AI kullanıcı giriş yapmayacak
INSERT OR IGNORE INTO users (email, display_name, is_ai, password_hash, avatar_url)
VALUES ('ai-player@system.local', 'AI Player', 1, '', 'default-avatar.png');
