import { getDatabase } from '../config/database.js';

/**
 * Tournament status types
 */
export type TournamentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Participant status types
 */
export type ParticipantStatus = 'registered' | 'playing' | 'eliminated' | 'winner';

/**
 * Tournament interface
 */
export interface Tournament {
    id: number;
    name: string;
    description: string | null;
    status: TournamentStatus;
    max_players: number;
    current_round: number;
    winner_id: number | null;
    created_by: number;
    created_at: string;
    started_at: string | null;
    ended_at: string | null;
}

/**
 * Tournament participant interface
 */
export interface TournamentParticipant {
    id: number;
    tournament_id: number;
    user_id: number;
    alias: string | null;
    placement: number | null;
    status: ParticipantStatus;
    joined_at: string;
}

/**
 * Tournament with creator info
 */
export interface TournamentWithCreator extends Tournament {
    creator_display_name: string;
    creator_avatar_url: string;
    participant_count: number;
}

/**
 * Create tournament input
 */
export interface CreateTournamentInput {
    name: string;
    description?: string;
    max_players?: number;
    created_by: number;
}

/**
 * Tournament model class
 */
export class TournamentModel {
    private db = getDatabase();

    /**
     * Create a new tournament
     */
    create(input: CreateTournamentInput): Tournament {
        const stmt = this.db.prepare(`
            INSERT INTO tournaments (name, description, max_players, created_by)
            VALUES (?, ?, ?, ?)
        `);

        const result = stmt.run(
            input.name,
            input.description ?? null,
            input.max_players ?? 8,
            input.created_by
        );

        return this.findById(result.lastInsertRowid as number)!;
    }

    /**
     * Find tournament by ID
     */
    findById(id: number): Tournament | undefined {
        return this.db
            .prepare('SELECT * FROM tournaments WHERE id = ?')
            .get(id) as Tournament | undefined;
    }

    /**
     * Get tournament with creator info
     */
    getWithCreator(id: number): TournamentWithCreator | undefined {
        return this.db
            .prepare(`
                SELECT 
                    t.*,
                    u.display_name as creator_display_name,
                    u.avatar_url as creator_avatar_url,
                    (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as participant_count
                FROM tournaments t
                JOIN users u ON u.id = t.created_by
                WHERE t.id = ?
            `)
            .get(id) as TournamentWithCreator | undefined;
    }

    /**
     * Get all tournaments with pagination
     */
    getAll(limit = 20, offset = 0, status?: TournamentStatus): TournamentWithCreator[] {
        let query = `
            SELECT 
                t.*,
                u.display_name as creator_display_name,
                u.avatar_url as creator_avatar_url,
                (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as participant_count
            FROM tournaments t
            JOIN users u ON u.id = t.created_by
        `;

        const params: (string | number)[] = [];

        if (status) {
            query += ' WHERE t.status = ?';
            params.push(status);
        }

        query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return this.db.prepare(query).all(...params) as TournamentWithCreator[];
    }

    /**
     * Update tournament status
     */
    updateStatus(id: number, status: TournamentStatus): boolean {
        const updates: { status: TournamentStatus; started_at?: string; ended_at?: string } = {
            status,
        };

        if (status === 'in_progress') {
            updates.started_at = new Date().toISOString();
        } else if (status === 'completed' || status === 'cancelled') {
            updates.ended_at = new Date().toISOString();
        }

        let query = 'UPDATE tournaments SET status = ?';
        const params: (string | number)[] = [status];

        if (updates.started_at) {
            query += ', started_at = ?';
            params.push(updates.started_at);
        }
        if (updates.ended_at) {
            query += ', ended_at = ?';
            params.push(updates.ended_at);
        }

        query += ' WHERE id = ?';
        params.push(id);

        const result = this.db.prepare(query).run(...params);
        return result.changes > 0;
    }

    /**
     * Set tournament winner
     */
    setWinner(id: number, winnerId: number): boolean {
        const result = this.db
            .prepare('UPDATE tournaments SET winner_id = ?, status = ?, ended_at = ? WHERE id = ?')
            .run(winnerId, 'completed', new Date().toISOString(), id);
        return result.changes > 0;
    }

    /**
     * Advance round
     */
    advanceRound(id: number): boolean {
        const result = this.db
            .prepare('UPDATE tournaments SET current_round = current_round + 1 WHERE id = ?')
            .run(id);
        return result.changes > 0;
    }

    /**
     * Delete tournament
     */
    delete(id: number): boolean {
        const result = this.db.prepare('DELETE FROM tournaments WHERE id = ?').run(id);
        return result.changes > 0;
    }

    /**
     * Add participant to tournament
     */
    addParticipant(tournamentId: number, userId: number, alias?: string): TournamentParticipant {
        const stmt = this.db.prepare(`
            INSERT INTO tournament_participants (tournament_id, user_id, alias)
            VALUES (?, ?, ?)
        `);

        const result = stmt.run(tournamentId, userId, alias ?? null);
        return this.getParticipant(result.lastInsertRowid as number)!;
    }

    /**
     * Get participant by ID
     */
    getParticipant(id: number): TournamentParticipant | undefined {
        return this.db
            .prepare('SELECT * FROM tournament_participants WHERE id = ?')
            .get(id) as TournamentParticipant | undefined;
    }

    /**
     * Get all participants of a tournament
     */
    getParticipants(tournamentId: number): (TournamentParticipant & {
        display_name: string;
        avatar_url: string;
    })[] {
        return this.db
            .prepare(`
                SELECT 
                    tp.*,
                    u.display_name,
                    u.avatar_url
                FROM tournament_participants tp
                JOIN users u ON u.id = tp.user_id
                WHERE tp.tournament_id = ?
                ORDER BY tp.placement ASC NULLS LAST, tp.joined_at ASC
            `)
            .all(tournamentId) as (TournamentParticipant & {
                display_name: string;
                avatar_url: string;
            })[];
    }

    /**
     * Update participant status
     */
    updateParticipantStatus(
        tournamentId: number,
        userId: number,
        status: ParticipantStatus,
        placement?: number
    ): boolean {
        let query = 'UPDATE tournament_participants SET status = ?';
        const params: (string | number)[] = [status];

        if (placement !== undefined) {
            query += ', placement = ?';
            params.push(placement);
        }

        query += ' WHERE tournament_id = ? AND user_id = ?';
        params.push(tournamentId, userId);

        const result = this.db.prepare(query).run(...params);
        return result.changes > 0;
    }

    /**
     * Remove participant from tournament
     */
    removeParticipant(tournamentId: number, userId: number): boolean {
        const result = this.db
            .prepare('DELETE FROM tournament_participants WHERE tournament_id = ? AND user_id = ?')
            .run(tournamentId, userId);
        return result.changes > 0;
    }

    /**
     * Check if user is participant
     */
    isParticipant(tournamentId: number, userId: number): boolean {
        const result = this.db
            .prepare('SELECT 1 FROM tournament_participants WHERE tournament_id = ? AND user_id = ?')
            .get(tournamentId, userId);
        return !!result;
    }

    /**
     * Get participant count
     */
    getParticipantCount(tournamentId: number): number {
        const result = this.db
            .prepare('SELECT COUNT(*) as count FROM tournament_participants WHERE tournament_id = ?')
            .get(tournamentId) as { count: number };
        return result.count;
    }

    /**
     * Get user's tournaments
     */
    getUserTournaments(userId: number, limit = 10): TournamentWithCreator[] {
        return this.db
            .prepare(`
                SELECT 
                    t.*,
                    u.display_name as creator_display_name,
                    u.avatar_url as creator_avatar_url,
                    (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as participant_count
                FROM tournaments t
                JOIN users u ON u.id = t.created_by
                JOIN tournament_participants tp ON tp.tournament_id = t.id
                WHERE tp.user_id = ?
                ORDER BY t.created_at DESC
                LIMIT ?
            `)
            .all(userId, limit) as TournamentWithCreator[];
    }
}

// Export singleton instance
export const tournamentModel = new TournamentModel();
