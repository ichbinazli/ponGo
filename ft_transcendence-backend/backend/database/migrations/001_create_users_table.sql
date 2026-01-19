-- Migration: Create users table
-- Created: 2024-12-24

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Authentication
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    
    -- Profile
    display_name TEXT UNIQUE NOT NULL,
    avatar_url TEXT DEFAULT 'default-avatar.png',
    
    -- OAuth
    oauth_provider TEXT,
    oauth_id TEXT,
    
    -- 2FA
    two_factor_secret TEXT,
    two_factor_enabled INTEGER DEFAULT 0,
    
    -- Status
    is_online INTEGER DEFAULT 0,
    last_seen_at DATETIME,
    
    -- GDPR
    anonymized INTEGER DEFAULT 0,
    anonymized_at DATETIME,
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id);
CREATE INDEX IF NOT EXISTS idx_users_online ON users(is_online);

-- Trigger to update updated_at
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
