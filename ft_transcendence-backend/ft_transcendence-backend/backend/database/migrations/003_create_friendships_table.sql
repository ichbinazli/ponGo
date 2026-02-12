-- Migration: Create friendships table
-- Created: 2024-12-24

CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Users involved
    requester_id INTEGER NOT NULL,
    addressee_id INTEGER NOT NULL,
    
    -- Status: pending, accepted, blocked
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'blocked')),
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate friendships
    UNIQUE(requester_id, addressee_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- Trigger to update updated_at
CREATE TRIGGER IF NOT EXISTS update_friendships_timestamp 
AFTER UPDATE ON friendships
BEGIN
    UPDATE friendships SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
