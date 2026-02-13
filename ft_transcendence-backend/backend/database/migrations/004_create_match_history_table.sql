-- Migration: Create match history table
-- Created: 2024-12-24

CREATE TABLE IF NOT EXISTS match_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Players
    player1_id INTEGER NOT NULL,
    player2_id INTEGER NOT NULL,
    
    -- Scores
    player1_score INTEGER NOT NULL DEFAULT 0,
    player2_score INTEGER NOT NULL DEFAULT 0,
    
    -- Winner (NULL for draw, though Pong typically doesn't have draws)
    winner_id INTEGER,
    
    -- Game type: pong, tournament, other
    game_type TEXT DEFAULT 'pong' CHECK(game_type IN ('pong', 'tournament', 'other')),
    
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_match_player1 ON match_history(player1_id);
CREATE INDEX IF NOT EXISTS idx_match_player2 ON match_history(player2_id);
CREATE INDEX IF NOT EXISTS idx_match_winner ON match_history(winner_id);
CREATE INDEX IF NOT EXISTS idx_match_game_type ON match_history(game_type);
CREATE INDEX IF NOT EXISTS idx_match_ended_at ON match_history(ended_at);
