import { FastifyRequest, FastifyReply } from 'fastify';
import { userModel } from '../models/user.model.js';
import { sessionModel } from '../models/session.model.js';
import { friendshipModel } from '../models/friendship.model.js';
import { matchHistoryModel } from '../models/match.model.js';
import { verifyPassword } from '../services/hash.service.js';
import { deleteAvatar } from '../services/upload.service.js';
import { successResponse, errorResponse, ErrorCodes } from '../utils/response.js';

/**
 * User data export format (GDPR Article 20 - Data Portability)
 */
interface UserDataExport {
    exportedAt: string;
    user: {
        id: number;
        email: string;
        displayName: string;
        avatarUrl: string;
        createdAt: string;
        lastSeenAt: string | null;
        twoFactorEnabled: boolean;
        oauthProvider: string | null;
    };
    sessions: {
        id: number;
        userAgent: string | null;
        ipAddress: string | null;
        createdAt: string;
        lastUsedAt: string | null;
    }[];
    friends: {
        id: number;
        displayName: string;
        status: string;
        since: string;
    }[];
    matchHistory: {
        id: number;
        opponent: string;
        yourScore: number;
        opponentScore: number;
        result: 'win' | 'loss' | 'draw';
        gameType: string;
        playedAt: string;
    }[];
    statistics: {
        totalMatches: number;
        wins: number;
        losses: number;
        draws: number;
        winRate: number;
    };
}

/**
 * Export all user data (GDPR Data Portability)
 * GET /api/gdpr/export
 */
export const exportUserData = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const user = userModel.findById(userId);

        if (!user) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
            );
        }

        // Get all user sessions
        const sessions = sessionModel.getUserSessions(userId);

        // Get all friends
        const friends = friendshipModel.getFriends(userId);

        // Get match history
        const matches = matchHistoryModel.getUserMatches(userId, 1000, 0);

        // Get stats
        const stats = matchHistoryModel.getUserStats(userId);

        // Build export object
        const exportData: UserDataExport = {
            exportedAt: new Date().toISOString(),
            user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
                avatarUrl: user.avatar_url,
                createdAt: user.created_at,
                lastSeenAt: user.last_seen_at,
                twoFactorEnabled: user.two_factor_enabled === 1,
                oauthProvider: user.oauth_provider,
            },
            sessions: sessions.map((s) => ({
                id: s.id,
                userAgent: s.user_agent,
                ipAddress: s.ip_address,
                createdAt: s.created_at,
                lastUsedAt: null,
            })),
            friends: friends.map((f) => ({
                id: f.friend_id,
                displayName: f.friend_display_name,
                status: f.status,
                since: f.updated_at,
            })),
            matchHistory: matches.map((m) => {
                const isPlayer1 = m.player1_id === userId;
                const yourScore = isPlayer1 ? m.player1_score : m.player2_score;
                const opponentScore = isPlayer1 ? m.player2_score : m.player1_score;
                const opponent = isPlayer1 ? m.player2_display_name : m.player1_display_name;

                let result: 'win' | 'loss' | 'draw' = 'draw';
                if (m.winner_id === userId) result = 'win';
                else if (m.winner_id !== null) result = 'loss';

                return {
                    id: m.id,
                    opponent,
                    yourScore,
                    opponentScore,
                    result,
                    gameType: m.game_type,
                    playedAt: m.ended_at,
                };
            }),
            statistics: {
                totalMatches: stats.total_matches,
                wins: stats.wins,
                losses: stats.losses,
                draws: stats.draws,
                winRate: stats.win_rate,
            },
        };

        // Set headers for file download
        reply.header('Content-Type', 'application/json');
        reply.header(
            'Content-Disposition',
            `attachment; filename="user_data_${userId}_${Date.now()}.json"`
        );

        return reply.send(exportData);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to export user data')
        );
    }
};

/**
 * Anonymize user account (GDPR Right to Erasure - soft delete)
 * POST /api/gdpr/anonymize
 */
export const anonymizeAccount = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const { password, confirmation } = request.body as {
            password?: string;
            confirmation?: string;
        };

        // Require explicit confirmation
        if (confirmation !== 'ANONYMIZE MY ACCOUNT') {
            return reply.status(400).send(
                errorResponse(
                    ErrorCodes.VALIDATION_ERROR,
                    'Please confirm by typing "ANONYMIZE MY ACCOUNT"'
                )
            );
        }

        const user = userModel.findById(userId);
        if (!user) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
            );
        }

        // Verify password if user has one
        if (user.password_hash) {
            if (!password) {
                return reply.status(400).send(
                    errorResponse(ErrorCodes.VALIDATION_ERROR, 'Password required')
                );
            }
            const isValid = await verifyPassword(password, user.password_hash);
            if (!isValid) {
                return reply.status(401).send(
                    errorResponse(ErrorCodes.INVALID_CREDENTIALS, 'Invalid password')
                );
            }
        }

        // Delete avatar file if not default
        if (user.avatar_url && user.avatar_url !== 'default-avatar.png') {
            deleteAvatar(user.avatar_url);
        }

        // Revoke all sessions
        sessionModel.revokeAllUserSessions(userId);

        // Anonymize user data
        userModel.anonymize(userId);

        return reply.send(
            successResponse(
                { anonymized: true },
                'Your account has been anonymized. All personal data has been removed.'
            )
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to anonymize account')
        );
    }
};

/**
 * Permanently delete user account (GDPR Right to Erasure - hard delete)
 * DELETE /api/gdpr/delete
 */
export const deleteAccount = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const { password, confirmation } = request.body as {
            password?: string;
            confirmation?: string;
        };

        // Require explicit confirmation
        if (confirmation !== 'DELETE MY ACCOUNT PERMANENTLY') {
            return reply.status(400).send(
                errorResponse(
                    ErrorCodes.VALIDATION_ERROR,
                    'Please confirm by typing "DELETE MY ACCOUNT PERMANENTLY"'
                )
            );
        }

        const user = userModel.findById(userId);
        if (!user) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
            );
        }

        // Verify password if user has one
        if (user.password_hash) {
            if (!password) {
                return reply.status(400).send(
                    errorResponse(ErrorCodes.VALIDATION_ERROR, 'Password required')
                );
            }
            const isValid = await verifyPassword(password, user.password_hash);
            if (!isValid) {
                return reply.status(401).send(
                    errorResponse(ErrorCodes.INVALID_CREDENTIALS, 'Invalid password')
                );
            }
        }

        // Delete avatar file
        if (user.avatar_url && user.avatar_url !== 'default-avatar.png') {
            deleteAvatar(user.avatar_url);
        }

        // Delete all sessions
        sessionModel.revokeAllUserSessions(userId);

        // Delete match history (or anonymize - depending on requirements)
        matchHistoryModel.deleteUserMatches(userId);

        // Delete friendships
        friendshipModel.deleteUserFriendships(userId);

        // Delete user permanently
        userModel.delete(userId);

        return reply.send(
            successResponse(
                { deleted: true },
                'Your account has been permanently deleted.'
            )
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to delete account')
        );
    }
};

/**
 * Get privacy information
 * GET /api/gdpr/info
 */
export const getPrivacyInfo = async (
    _request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    return reply.send(
        successResponse({
            dataCollected: [
                'Email address (for authentication and communication)',
                'Display name (for identification in game)',
                'Avatar image (optional, for profile)',
                'Match history (game scores and results)',
                'Friend connections (for social features)',
                'Session information (for security)',
            ],
            dataRetention: {
                activeAccount: 'Data is retained while your account is active',
                inactiveAccount: 'Accounts inactive for 2 years may be anonymized',
                deletedAccount: 'Data is permanently deleted upon account deletion request',
            },
            yourRights: {
                access: 'You can export all your data at any time (GET /api/gdpr/export)',
                rectification: 'You can update your profile information (PATCH /api/users/me)',
                erasure: 'You can delete or anonymize your account',
                portability: 'You can download your data in JSON format',
            },
            contact: {
                email: 'privacy@ft_transcendence.local',
                description: 'For any privacy-related inquiries',
            },
        })
    );
};

/**
 * Get data retention info for current user
 * GET /api/gdpr/retention
 */
export const getRetentionInfo = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const user = userModel.findById(userId);

        if (!user) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
            );
        }

        const createdAt = new Date(user.created_at);
        const lastSeenAt = user.last_seen_at ? new Date(user.last_seen_at) : new Date();
        const now = new Date();

        const accountAgeDays = Math.floor(
            (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        const inactiveDays = Math.floor(
            (now.getTime() - lastSeenAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        return reply.send(
            successResponse({
                accountCreated: user.created_at,
                accountAgeDays,
                lastActivity: user.last_seen_at || user.created_at,
                inactiveDays,
                dataStored: {
                    sessions: sessionModel.getUserSessions(userId).length,
                    friends: friendshipModel.getFriendCount(userId),
                    matches: matchHistoryModel.getMatchCount(userId),
                },
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get retention info')
        );
    }
};
