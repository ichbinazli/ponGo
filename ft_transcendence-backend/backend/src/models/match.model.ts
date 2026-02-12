import { getDatabase } from '../config/database.js';

/**
 * Game type
 */
export type GameType = 'pong' | 'tournament' | 'ai' | 'other';

/**
 * Match history model interface
 */
export interface MatchHistory {
    id: number;
    player1_id: number;
    player2_id: number;
    player1_score: number;
    player2_score: number;
    winner_id: number | null;
    game_type: GameType;
    tournament_id: number | null;
    duration_seconds: number | null;
    started_at: string | null;
    ended_at: string;
}

/**
 * Match with player info
 */
export interface MatchWithPlayers extends MatchHistory {
    player1_display_name: string;
    player1_avatar_url: string;
    player2_display_name: string;
    player2_avatar_url: string;
    winner_display_name: string | null;
}

/**
 * User stats
 */
export interface UserStats {
    total_matches: number;
    wins: number;
    losses: number;
    draws: number;
    win_rate: number;
    total_points_scored: number;
    total_points_against: number;
    average_game_duration: number | null;
}

/**
 * Create match input
 */
export interface CreateMatchInput {
    player1_id: number;
    player2_id: number;
    player1_score: number;
    player2_score: number;
    winner_id?: number | null;
    game_type?: GameType;
    tournament_id?: number;
    duration_seconds?: number;
    started_at?: string;
}

/**
 * Match history model class
 */
export class MatchHistoryModel {
    private db = getDatabase();

    /**
     * Create a new match record
     */
    create(input: CreateMatchInput): MatchHistory {
        const stmt = this.db.prepare(`
      INSERT INTO match_history 
        (player1_id, player2_id, player1_score, player2_score, winner_id, game_type, tournament_id, duration_seconds, started_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        const result = stmt.run(
            input.player1_id,
            input.player2_id,
            input.player1_score,
            input.player2_score,
            input.winner_id ?? null,
            input.game_type ?? 'pong',
            input.tournament_id ?? null,
            input.duration_seconds ?? null,
            input.started_at ?? null
        );

        return this.findById(result.lastInsertRowid as number)!;
    }

    /**
     * Find match by ID
     */
    findById(id: number): MatchHistory | undefined {
        return this.db
            .prepare('SELECT * FROM match_history WHERE id = ?')
            .get(id) as MatchHistory | undefined;
    }

    /**
     * Get match with player info
     */
    getMatchWithPlayers(id: number): MatchWithPlayers | undefined {
        return this.db
            .prepare(
                `SELECT 
        mh.*,
        COALESCE(p1.display_name, 'Unknown') as player1_display_name,
        COALESCE(p1.avatar_url, 'default-avatar.png') as player1_avatar_url,
        COALESCE(p2.display_name, 'Unknown') as player2_display_name,
        COALESCE(p2.avatar_url, 'default-avatar.png') as player2_avatar_url,
        w.display_name as winner_display_name
      FROM match_history mh
      LEFT JOIN users p1 ON p1.id = mh.player1_id
      LEFT JOIN users p2 ON p2.id = mh.player2_id
      LEFT JOIN users w ON w.id = mh.winner_id
      WHERE mh.id = ?`
            )
            .get(id) as MatchWithPlayers | undefined;
    }

    /**
     * Get user's match history
     */
    getUserMatches(
        userId: number,
        limit = 20,
        offset = 0
    ): MatchWithPlayers[] {
        return this.db
            .prepare(
                `SELECT 
        mh.*,
        COALESCE(p1.display_name, 'Unknown') as player1_display_name,
        COALESCE(p1.avatar_url, 'default-avatar.png') as player1_avatar_url,
        COALESCE(p2.display_name, 'Unknown') as player2_display_name,
        COALESCE(p2.avatar_url, 'default-avatar.png') as player2_avatar_url,
        w.display_name as winner_display_name
      FROM match_history mh
      LEFT JOIN users p1 ON p1.id = mh.player1_id
      LEFT JOIN users p2 ON p2.id = mh.player2_id
      LEFT JOIN users w ON w.id = mh.winner_id
      WHERE mh.player1_id = ? OR mh.player2_id = ?
      ORDER BY mh.ended_at DESC
      LIMIT ? OFFSET ?`
            )
            .all(userId, userId, limit, offset) as MatchWithPlayers[];
    }

    /**
     * Get matches between two users
     */
    getMatchesBetweenUsers(
        userId1: number,
        userId2: number,
        limit = 10
    ): MatchWithPlayers[] {
        return this.db
            .prepare(
                `SELECT 
        mh.*,
        COALESCE(p1.display_name, 'Unknown') as player1_display_name,
        COALESCE(p1.avatar_url, 'default-avatar.png') as player1_avatar_url,
        COALESCE(p2.display_name, 'Unknown') as player2_display_name,
        COALESCE(p2.avatar_url, 'default-avatar.png') as player2_avatar_url,
        w.display_name as winner_display_name
      FROM match_history mh
      LEFT JOIN users p1 ON p1.id = mh.player1_id
      LEFT JOIN users p2 ON p2.id = mh.player2_id
      LEFT JOIN users w ON w.id = mh.winner_id
      WHERE (mh.player1_id = ? AND mh.player2_id = ?)
         OR (mh.player1_id = ? AND mh.player2_id = ?)
      ORDER BY mh.ended_at DESC
      LIMIT ?`
            )
            .all(userId1, userId2, userId2, userId1, limit) as MatchWithPlayers[];
    }

    /**
     * Get user statistics
     */
    getUserStats(userId: number): UserStats {
        const stats = this.db
            .prepare(
                `SELECT 
        COUNT(*) as total_matches,
        SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN winner_id IS NOT NULL AND winner_id != ? THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN winner_id IS NULL THEN 1 ELSE 0 END) as draws,
        SUM(CASE WHEN player1_id = ? THEN player1_score ELSE player2_score END) as total_points_scored,
        SUM(CASE WHEN player1_id = ? THEN player2_score ELSE player1_score END) as total_points_against,
        AVG(duration_seconds) as average_game_duration
      FROM match_history
      WHERE player1_id = ? OR player2_id = ?`
            )
            .get(userId, userId, userId, userId, userId, userId) as {
                total_matches: number;
                wins: number;
                losses: number;
                draws: number;
                total_points_scored: number;
                total_points_against: number;
                average_game_duration: number | null;
            };

        return {
            ...stats,
            win_rate:
                stats.total_matches > 0
                    ? Math.round((stats.wins / stats.total_matches) * 100)
                    : 0,
        };
    }

    /**
     * Get recent matches
     */
    getRecentMatches(limit = 10, offset = 0): MatchWithPlayers[] {
        return this.db
            .prepare(
                `SELECT 
        mh.*,
        COALESCE(p1.display_name, 'Unknown') as player1_display_name,
        COALESCE(p1.avatar_url, 'default-avatar.png') as player1_avatar_url,
        COALESCE(p2.display_name, 'Unknown') as player2_display_name,
        COALESCE(p2.avatar_url, 'default-avatar.png') as player2_avatar_url,
        w.display_name as winner_display_name
      FROM match_history mh
      LEFT JOIN users p1 ON p1.id = mh.player1_id
      LEFT JOIN users p2 ON p2.id = mh.player2_id
      LEFT JOIN users w ON w.id = mh.winner_id
      ORDER BY mh.ended_at DESC
      LIMIT ? OFFSET ?`
            )
            .all(limit, offset) as MatchWithPlayers[];
    }

    /**
     * Get total match count for a user
     */
    getMatchCount(userId: number): number {
        const result = this.db
            .prepare(
                `SELECT COUNT(*) as count FROM match_history 
       WHERE player1_id = ? OR player2_id = ?`
            )
            .get(userId, userId) as { count: number };
        return result.count;
    }

    /**
     * Delete all matches for a user (GDPR)
     */
    deleteUserMatches(userId: number): number {
        // Update matches where user was a player but not delete (keep history integrity)
        // Just anonymize by setting winner to null if it was this user
        const result = this.db
            .prepare(
                `DELETE FROM match_history 
       WHERE player1_id = ? OR player2_id = ?`
            )
            .run(userId, userId);
        return result.changes;
    }

    /**
     * Leaderboard entry interface
     */
    /**
     * Get leaderboard - top players by wins
     */
    getLeaderboard(limit = 10): LeaderboardEntry[] {
        const results = this.db
            .prepare(
                `SELECT 
                    u.id,
                    u.display_name as name,
                    u.avatar_url,
                    COUNT(mh.id) as gamesPlayed,
                    SUM(CASE WHEN mh.winner_id = u.id THEN 1 ELSE 0 END) as wins,
                    SUM(CASE WHEN mh.winner_id IS NOT NULL AND mh.winner_id != u.id THEN 1 ELSE 0 END) as losses,
                    SUM(CASE WHEN mh.player1_id = u.id THEN mh.player1_score ELSE mh.player2_score END) as totalScore
                FROM users u
                LEFT JOIN match_history mh ON u.id = mh.player1_id OR u.id = mh.player2_id
                WHERE u.anonymized = 0 AND u.is_ai = 0
                GROUP BY u.id
                HAVING gamesPlayed > 0
                ORDER BY wins DESC, gamesPlayed ASC, totalScore DESC
                LIMIT ?`
            )
            .all(limit) as {
                id: number;
                name: string;
                avatar_url: string;
                gamesPlayed: number;
                wins: number;
                losses: number;
                totalScore: number;
            }[];

        return results.map((r) => ({
            id: r.id,
            name: r.name,
            avatar_url: r.avatar_url,
            score: r.wins * 100 + r.totalScore, // Score calculation: wins * 100 + total points
            gamesPlayed: r.gamesPlayed,
            wins: r.wins,
            losses: r.losses,
            winRate: r.gamesPlayed > 0 ? Math.round((r.wins / r.gamesPlayed) * 100) : 0,
        }));
    }

    /**
     * Get user's rank in leaderboard
     */
    getUserRank(userId: number): { rank: number; totalPlayers: number } {
        // Get all players ordered by wins
        const allPlayers = this.db
            .prepare(
                `SELECT 
                    u.id,
                    SUM(CASE WHEN mh.winner_id = u.id THEN 1 ELSE 0 END) as wins,
                    COUNT(mh.id) as gamesPlayed
                FROM users u
                LEFT JOIN match_history mh ON u.id = mh.player1_id OR u.id = mh.player2_id
                WHERE u.anonymized = 0 AND u.is_ai = 0
                GROUP BY u.id
                HAVING gamesPlayed > 0
                ORDER BY wins DESC, gamesPlayed ASC`
            )
            .all() as { id: number; wins: number; gamesPlayed: number }[];

        const totalPlayers = allPlayers.length;
        const rank = allPlayers.findIndex((p) => p.id === userId) + 1;

        return {
            rank: rank > 0 ? rank : totalPlayers + 1, // If not found, last place
            totalPlayers: totalPlayers > 0 ? totalPlayers : 1,
        };
    }

    /**
     * Get global statistics
     */
    getGlobalStats(): GlobalStats {
        // Total users count
        const usersResult = this.db
            .prepare('SELECT COUNT(*) as count FROM users WHERE anonymized = 0 AND is_ai = 0')
            .get() as { count: number };

        // Online users (last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const onlineResult = this.db
            .prepare('SELECT COUNT(*) as count FROM users WHERE last_seen_at > ? AND anonymized = 0 AND is_ai = 0')
            .get(fiveMinutesAgo) as { count: number };

        // Total matches
        const totalMatchesResult = this.db
            .prepare('SELECT COUNT(*) as count FROM match_history')
            .get() as { count: number };

        // Today's matches
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString();
        const todayMatchesResult = this.db
            .prepare('SELECT COUNT(*) as count FROM match_history WHERE ended_at >= ?')
            .get(todayStr) as { count: number };

        // Best score (highest single game score)
        const bestScoreResult = this.db
            .prepare(
                `SELECT MAX(score) as bestScore FROM (
                    SELECT player1_score as score FROM match_history
                    UNION ALL
                    SELECT player2_score as score FROM match_history
                )`
            )
            .get() as { bestScore: number | null };

        // Active users (last 24 hours)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const activeUsersResult = this.db
            .prepare('SELECT COUNT(*) as count FROM users WHERE last_seen_at > ? AND anonymized = 0 AND is_ai = 0')
            .get(twentyFourHoursAgo) as { count: number };

        return {
            totalUsers: usersResult.count,
            playersOnline: onlineResult.count,
            totalMatches: totalMatchesResult.count,
            gamesToday: todayMatchesResult.count,
            bestScore: bestScoreResult.bestScore ?? 0,
            activeUsers24h: activeUsersResult.count,
        };
    }
}

/**
 * Leaderboard entry interface
 */
export interface LeaderboardEntry {
    id: number;
    name: string;
    avatar_url: string;
    score: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
}

/**
 * Global stats interface
 */
export interface GlobalStats {
    totalUsers: number;
    playersOnline: number;
    totalMatches: number;
    gamesToday: number;
    bestScore: number;
    activeUsers24h: number;
}

// Export singleton instance
export const matchHistoryModel = new MatchHistoryModel();
