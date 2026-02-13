-- Migration: Add tournament_matches table and local tournament support
-- Created: 2026-01-27

-- 1. Add is_local column to tournaments table
ALTER TABLE tournaments ADD COLUMN is_local INTEGER DEFAULT 0;

-- 2. Create new tournament_participants table with nullable user_id
-- SQLite doesn't support ALTER COLUMN, so we need to recreate the table

-- Step 2.1: Create temporary table with new schema
CREATE TABLE tournament_participants_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    user_id INTEGER,  -- NOW NULLABLE for guest support
    
    -- Alias is required for all participants (registered or guest)
    alias TEXT NOT NULL,
    
    -- Placement (1st, 2nd, etc.)
    placement INTEGER,
    
    -- Status: registered, playing, eliminated, winner
    status TEXT DEFAULT 'registered' CHECK(status IN ('registered', 'playing', 'eliminated', 'winner')),
    
    -- Is this a guest (no registered account)?
    is_guest INTEGER DEFAULT 0,
    
    -- Timestamps
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 2.2: Copy existing data (set alias from display_name if null)
INSERT INTO tournament_participants_new (id, tournament_id, user_id, alias, placement, status, is_guest, joined_at)
SELECT 
    tp.id, 
    tp.tournament_id, 
    tp.user_id, 
    COALESCE(tp.alias, u.display_name, 'Player ' || tp.id),
    tp.placement, 
    tp.status, 
    0,  -- existing participants are not guests
    tp.joined_at
FROM tournament_participants tp
LEFT JOIN users u ON u.id = tp.user_id;

-- Step 2.3: Drop old table
DROP TABLE tournament_participants;

-- Step 2.4: Rename new table
ALTER TABLE tournament_participants_new RENAME TO tournament_participants;

-- Step 2.5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_alias ON tournament_participants(alias);

-- 3. Create tournament_matches table
CREATE TABLE IF NOT EXISTS tournament_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    
    -- Round and order within round (for bracket positioning)
    round INTEGER NOT NULL,
    match_order INTEGER NOT NULL,
    
    -- Participant references (NULL = TBD/bye)
    participant1_id INTEGER,
    participant2_id INTEGER,
    
    -- Scores
    participant1_score INTEGER DEFAULT 0,
    participant2_score INTEGER DEFAULT 0,
    
    -- Winner participant
    winner_participant_id INTEGER,
    
    -- Match status: pending, in_progress, completed, cancelled
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    
    -- Game duration in seconds
    duration_seconds INTEGER,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    ended_at DATETIME,
    
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (participant1_id) REFERENCES tournament_participants(id) ON DELETE SET NULL,
    FOREIGN KEY (participant2_id) REFERENCES tournament_participants(id) ON DELETE SET NULL,
    FOREIGN KEY (winner_participant_id) REFERENCES tournament_participants(id) ON DELETE SET NULL,
    
    -- Unique constraint for round and match order within a tournament
    UNIQUE(tournament_id, round, match_order)
);

-- Indexes for tournament_matches
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round ON tournament_matches(tournament_id, round);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_status ON tournament_matches(status);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_participants ON tournament_matches(participant1_id, participant2_id);
