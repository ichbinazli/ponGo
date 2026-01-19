-- Migration: Create sessions table (for JWT refresh tokens)
-- Created: 2024-12-24

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- User reference
    user_id INTEGER NOT NULL,
    
    -- Token info
    refresh_token_hash TEXT UNIQUE NOT NULL,
    
    -- Device/client info (optional)
    user_agent TEXT,
    ip_address TEXT,
    
    -- Expiration
    expires_at DATETIME NOT NULL,
    
    -- Revocation
    revoked INTEGER DEFAULT 0,
    revoked_at DATETIME,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
