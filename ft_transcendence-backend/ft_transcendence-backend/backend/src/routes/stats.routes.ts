import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
    getLeaderboard,
    getGlobalStats,
    getRecentMatches,
} from '../controllers/stats.controller.js';

/**
 * Stats routes plugin
 * Provides game statistics and leaderboard endpoints
 */
export const statsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    /**
     * Get leaderboard - top players
     * GET /api/stats/leaderboard?limit=10
     */
    fastify.get('/leaderboard', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    limit: { type: 'string' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                leaderboard: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'number' },
                                            name: { type: 'string' },
                                            avatar_url: { type: 'string' },
                                            score: { type: 'number' },
                                            gamesPlayed: { type: 'number' },
                                            wins: { type: 'number' },
                                            losses: { type: 'number' },
                                            winRate: { type: 'number' },
                                        },
                                    },
                                },
                                total: { type: 'number' },
                            },
                        },
                    },
                },
            },
        },
    }, getLeaderboard);

    /**
     * Get global statistics
     * GET /api/stats/global
     */
    fastify.get('/global', {
        schema: {
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                totalUsers: { type: 'number' },
                                playersOnline: { type: 'number' },
                                totalMatches: { type: 'number' },
                                gamesToday: { type: 'number' },
                                bestScore: { type: 'number' },
                                activeUsers24h: { type: 'number' },
                            },
                        },
                    },
                },
            },
        },
    }, getGlobalStats);

    /**
     * Get recent matches
     * GET /api/stats/recent-matches?limit=10
     */
    fastify.get('/recent-matches', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    limit: { type: 'string' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                matches: { type: 'array' },
                                total: { type: 'number' },
                            },
                        },
                    },
                },
            },
        },
    }, getRecentMatches);
};
