-- Add new columns to match_history table for V2 requirements
ALTER TABLE match_history ADD COLUMN game_mode TEXT DEFAULT 'modern'; -- 'modern', 'nostalgia', 'tournament'
ALTER TABLE match_history ADD COLUMN match_type TEXT DEFAULT 'h2h'; -- 'h2h', 'h2ai'
ALTER TABLE match_history ADD COLUMN ai_difficulty TEXT; -- 'easy', 'medium', 'hard' (Nullable)
ALTER TABLE match_history ADD COLUMN player1_name TEXT; -- Snapshot of player name
ALTER TABLE match_history ADD COLUMN player2_name TEXT; -- Snapshot of player name
ALTER TABLE match_history ADD COLUMN winning_score INTEGER DEFAULT 0;
ALTER TABLE match_history ADD COLUMN p1_power_up_freeze INTEGER DEFAULT 0;
ALTER TABLE match_history ADD COLUMN p1_power_up_mega INTEGER DEFAULT 0;
ALTER TABLE match_history ADD COLUMN p2_power_up_freeze INTEGER DEFAULT 0;
ALTER TABLE match_history ADD COLUMN p2_power_up_mega INTEGER DEFAULT 0;
