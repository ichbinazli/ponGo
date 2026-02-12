import { getDatabase } from '../config/database.js';
import { getAvatarUrl } from '../services/upload.service.js';

/**
 * User model interface
 */
export interface User {
    id: number;
    email: string;
    password_hash: string | null;
    display_name: string;
    avatar_url: string;
    oauth_provider: string | null;
    oauth_id: string | null;
    two_factor_secret: string | null;
    two_factor_enabled: number;
    two_factor_backup_codes: string | null;
    is_online: number;
    is_ai: number;
    last_seen_at: string | null;
    anonymized: number;
    anonymized_at: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * User without sensitive data
 */
export interface PublicUser {
    id: number;
    display_name: string;
    avatar_url: string;
    is_online: boolean;
    last_seen_at: string | null;
    created_at: string;
}

/**
 * Create user input
 */
export interface CreateUserInput {
    email: string;
    password_hash?: string;
    display_name: string;
    avatar_url?: string;
    oauth_provider?: string;
    oauth_id?: string;
}

/**
 * Update user input
 */
export interface UpdateUserInput {
    email?: string;
    password_hash?: string;
    display_name?: string;
    avatar_url?: string;
    oauth_provider?: string;
    oauth_id?: string;
    two_factor_secret?: string;
    two_factor_enabled?: boolean;
    two_factor_backup_codes?: string;
    is_online?: boolean;
    last_seen_at?: string;
}

/**
 * User model class
 */
export class UserModel {
    private db = getDatabase();

    /**
     * AI kullanıcıyı bul veya oluştur.
     * Migration'da oluşturulan AI kullanıcıyı döndürür.
     * Eğer yoksa yeniden oluşturur (güvenlik önlemi).
     */
    getOrCreateAIUser(): User {
        let aiUser = this.db
            .prepare('SELECT * FROM users WHERE is_ai = 1 LIMIT 1')
            .get() as User | undefined;

        if (!aiUser) {
            this.db.prepare(`
                INSERT INTO users (email, display_name, is_ai, password_hash, avatar_url)
                VALUES ('ai-player@system.local', 'AI Player', 1, '', 'default-avatar.png')
            `).run();

            aiUser = this.db
                .prepare('SELECT * FROM users WHERE is_ai = 1 LIMIT 1')
                .get() as User | undefined;
        }

        return aiUser!;
    }

    /**
     * Find user by ID
     */
    findById(id: number): User | undefined {
        return this.db
            .prepare('SELECT * FROM users WHERE id = ? AND anonymized = 0')
            .get(id) as User | undefined;
    }

    /**
     * Find user by email
     */
    findByEmail(email: string): User | undefined {
        return this.db
            .prepare('SELECT * FROM users WHERE email = ? AND anonymized = 0')
            .get(email.toLowerCase()) as User | undefined;
    }

    /**
     * Find user by display name
     */
    findByDisplayName(displayName: string): User | undefined {
        return this.db
            .prepare('SELECT * FROM users WHERE display_name = ? AND anonymized = 0')
            .get(displayName) as User | undefined;
    }

    /**
     * Find user by OAuth provider and ID
     */
    findByOAuth(provider: string, oauthId: string): User | undefined {
        return this.db
            .prepare(
                'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ? AND anonymized = 0'
            )
            .get(provider, oauthId) as User | undefined;
    }

    /**
     * Create a new user
     */
    create(input: CreateUserInput): User {
        const stmt = this.db.prepare(`
      INSERT INTO users (email, password_hash, display_name, avatar_url, oauth_provider, oauth_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

        const result = stmt.run(
            input.email.toLowerCase(),
            input.password_hash || null,
            input.display_name,
            input.avatar_url || 'default-avatar.png',
            input.oauth_provider || null,
            input.oauth_id || null
        );

        return this.findById(result.lastInsertRowid as number)!;
    }

    /**
     * Update user
     */
    update(id: number, input: UpdateUserInput): User | undefined {
        const updates: string[] = [];
        const values: (string | number | null)[] = [];

        if (input.email !== undefined) {
            updates.push('email = ?');
            values.push(input.email.toLowerCase());
        }
        if (input.password_hash !== undefined) {
            updates.push('password_hash = ?');
            values.push(input.password_hash);
        }
        if (input.display_name !== undefined) {
            updates.push('display_name = ?');
            values.push(input.display_name);
        }
        if (input.avatar_url !== undefined) {
            updates.push('avatar_url = ?');
            values.push(input.avatar_url);
        }
        if (input.oauth_provider !== undefined) {
            updates.push('oauth_provider = ?');
            values.push(input.oauth_provider || null);
        }
        if (input.oauth_id !== undefined) {
            updates.push('oauth_id = ?');
            values.push(input.oauth_id || null);
        }
        if (input.two_factor_secret !== undefined) {
            updates.push('two_factor_secret = ?');
            values.push(input.two_factor_secret);
        }
        if (input.two_factor_enabled !== undefined) {
            updates.push('two_factor_enabled = ?');
            values.push(input.two_factor_enabled ? 1 : 0);
        }
        if (input.two_factor_backup_codes !== undefined) {
            updates.push('two_factor_backup_codes = ?');
            values.push(input.two_factor_backup_codes || null);
        }
        if (input.is_online !== undefined) {
            updates.push('is_online = ?');
            values.push(input.is_online ? 1 : 0);
        }
        if (input.last_seen_at !== undefined) {
            updates.push('last_seen_at = ?');
            values.push(input.last_seen_at);
        }

        if (updates.length === 0) {
            return this.findById(id);
        }

        values.push(id);

        this.db
            .prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
            .run(...values);

        return this.findById(id);
    }

    /**
     * Update online status
     */
    setOnlineStatus(id: number, isOnline: boolean): void {
        this.db
            .prepare(
                'UPDATE users SET is_online = ?, last_seen_at = CURRENT_TIMESTAMP WHERE id = ?'
            )
            .run(isOnline ? 1 : 0, id);
    }

    /**
     * Get public user info
     */
    getPublicProfile(id: number): PublicUser | undefined {
        const user = this.findById(id);
        if (!user) return undefined;

        return {
            id: user.id,
            display_name: user.display_name,
            avatar_url: getAvatarUrl(user.avatar_url),
            is_online: user.is_online === 1,
            last_seen_at: user.last_seen_at,
            created_at: user.created_at,
        };
    }

    /**
     * Check if email exists
     */
    emailExists(email: string): boolean {
        const result = this.db
            .prepare('SELECT 1 FROM users WHERE email = ?')
            .get(email.toLowerCase());
        return result !== undefined;
    }

    /**
     * Check if display name exists
     */
    displayNameExists(displayName: string): boolean {
        const result = this.db
            .prepare('SELECT 1 FROM users WHERE display_name = ?')
            .get(displayName);
        return result !== undefined;
    }

    /**
     * Anonymize user (GDPR)
     */
    anonymize(id: number): void {
        this.db
            .prepare(
                `UPDATE users SET 
        email = 'anonymized_' || id || '@deleted.local',
        password_hash = NULL,
        display_name = 'Deleted User ' || id,
        avatar_url = 'default-avatar.png',
        oauth_provider = NULL,
        oauth_id = NULL,
        two_factor_secret = NULL,
        two_factor_enabled = 0,
        anonymized = 1,
        anonymized_at = CURRENT_TIMESTAMP
      WHERE id = ?`
            )
            .run(id);
    }

    /**
     * Delete user permanently
     */
    delete(id: number): boolean {
        const result = this.db.prepare('DELETE FROM users WHERE id = ?').run(id);
        return result.changes > 0;
    }

    /**
     * Get all online users
     */
    getOnlineUsers(): PublicUser[] {
        const users = this.db
            .prepare(
                'SELECT id, display_name, avatar_url, is_online, last_seen_at, created_at FROM users WHERE is_online = 1 AND anonymized = 0 AND is_ai = 0'
            )
            .all() as User[];

        return users.map((u) => ({
            id: u.id,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            is_online: true,
            last_seen_at: u.last_seen_at,
            created_at: u.created_at,
        }));
    }

    /**
     * Search users by display name
     */
    search(query: string, limit = 20): PublicUser[] {
        const users = this.db
            .prepare(
                `SELECT id, display_name, avatar_url, is_online, last_seen_at, created_at 
       FROM users 
       WHERE display_name LIKE ? AND anonymized = 0 AND is_ai = 0
       LIMIT ?`
            )
            .all(`%${query}%`, limit) as User[];

        return users.map((u) => ({
            id: u.id,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            is_online: u.is_online === 1,
            last_seen_at: u.last_seen_at,
            created_at: u.created_at,
        }));
    }
}

// Export singleton instance
export const userModel = new UserModel();
