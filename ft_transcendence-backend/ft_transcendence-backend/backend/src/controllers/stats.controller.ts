import { FastifyRequest, FastifyReply } from 'fastify';
import { matchHistoryModel } from '../models/match.model.js';
import { successResponse, errorResponse, ErrorCodes } from '../utils/response.js';

/**
 * Get leaderboard - top players
 * GET /api/stats/leaderboard?limit=10
 */
export const getLeaderboard = async (
    request: FastifyRequest<{ Querystring: { limit?: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const limit = Math.min(parseInt(request.query.limit || '10', 10), 100);

        const leaderboard = matchHistoryModel.getLeaderboard(limit);

        return reply.send(
            successResponse({
                leaderboard,
                total: leaderboard.length,
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get leaderboard')
        );
    }
};

/**
 * Get global statistics
 * GET /api/stats/global
 */
export const getGlobalStats = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const stats = matchHistoryModel.getGlobalStats();

        return reply.send(
            successResponse(stats)
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get global stats')
        );
    }
};

/**
 * Get user rank in leaderboard
 * GET /api/users/:id/rank
 */
export const getUserRank = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = parseInt(request.params.id, 10);

        if (isNaN(userId)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid user ID')
            );
        }

        const rankInfo = matchHistoryModel.getUserRank(userId);

        return reply.send(
            successResponse(rankInfo)
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get user rank')
        );
    }
};

/**
 * Get recent matches
 * GET /api/stats/recent-matches?limit=10
 */
export const getRecentMatches = async (
    request: FastifyRequest<{ Querystring: { limit?: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const limit = Math.min(parseInt(request.query.limit || '10', 10), 50);

        const matches = matchHistoryModel.getRecentMatches(limit);

        return reply.send(
            successResponse({
                matches,
                total: matches.length,
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get recent matches')
        );
    }
};
