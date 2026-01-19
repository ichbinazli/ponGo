import { getDatabase } from '../config/database.js';

/**
 * Session model interface
 */
export interface Session {
    id: number;
    user_id: number;
    refresh_token_hash: string;
    user_agent: string | null;
    ip_address: string | null;
    expires_at: string;
    revoked: number;
    revoked_at: string | null;
    created_at: string;
}

/**
 * Create session input
 */
export interface CreateSessionInput {
    user_id: number;
    refresh_token_hash: string;
    user_agent?: string;
    ip_address?: string;
    expires_at: string;
}

/**
 * Session model class
 */
export class SessionModel {
    private db = getDatabase();

    /**
     * Create a new session
     */
    create(input: CreateSessionInput): Session {
        const stmt = this.db.prepare(`
      INSERT INTO sessions (user_id, refresh_token_hash, user_agent, ip_address, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `);

        const result = stmt.run(
            input.user_id,
            input.refresh_token_hash,
            input.user_agent || null,
            input.ip_address || null,
            input.expires_at
        );

        return this.findById(result.lastInsertRowid as number)!;
    }

    /**
     * Find session by ID
     */
    findById(id: number): Session | undefined {
        return this.db
            .prepare('SELECT * FROM sessions WHERE id = ?')
            .get(id) as Session | undefined;
    }

    /**
     * Find session by refresh token hash
     */
    findByTokenHash(tokenHash: string): Session | undefined {
        return this.db
            .prepare(
                'SELECT * FROM sessions WHERE refresh_token_hash = ? AND revoked = 0 AND expires_at > datetime("now")'
            )
            .get(tokenHash) as Session | undefined;
    }

    /**
     * Find all active sessions for a user
     */
    findByUserId(userId: number): Session[] {
        return this.db
            .prepare(
                'SELECT * FROM sessions WHERE user_id = ? AND revoked = 0 AND expires_at > datetime("now") ORDER BY created_at DESC'
            )
            .all(userId) as Session[];
    }

    /**
     * Revoke a session
     */
    revoke(id: number): boolean {
        const result = this.db
            .prepare(
                'UPDATE sessions SET revoked = 1, revoked_at = CURRENT_TIMESTAMP WHERE id = ?'
            )
            .run(id);
        return result.changes > 0;
    }

    /**
     * Revoke session by token hash
     */
    revokeByTokenHash(tokenHash: string): boolean {
        const result = this.db
            .prepare(
                'UPDATE sessions SET revoked = 1, revoked_at = CURRENT_TIMESTAMP WHERE refresh_token_hash = ?'
            )
            .run(tokenHash);
        return result.changes > 0;
    }

    /**
     * Revoke all sessions for a user
     */
    revokeAllForUser(userId: number): number {
        const result = this.db
            .prepare(
                'UPDATE sessions SET revoked = 1, revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked = 0'
            )
            .run(userId);
        return result.changes;
    }

    /**
     * Clean up expired sessions
     */
    cleanupExpired(): number {
        const result = this.db
            .prepare('DELETE FROM sessions WHERE expires_at < datetime("now")')
            .run();
        return result.changes;
    }

    /**
     * Delete all sessions for a user
     */
    deleteAllForUser(userId: number): number {
        const result = this.db
            .prepare('DELETE FROM sessions WHERE user_id = ?')
            .run(userId);
        return result.changes;
    }

    /**
     * Check if token is valid (not revoked and not expired)
     */
    isValidToken(tokenHash: string): boolean {
        const session = this.findByTokenHash(tokenHash);
        return session !== undefined;
    }
}

// Export singleton instance
export const sessionModel = new SessionModel();
