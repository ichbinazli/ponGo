-- Migration: Add backup codes to users table
-- Created: 2024-12-24

-- Add backup_codes column (stored as JSON array of hashed codes)
ALTER TABLE users ADD COLUMN two_factor_backup_codes TEXT;
