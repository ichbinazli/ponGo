import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import multipart from '@fastify/multipart';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import {
    getMyProfile,
    getUserProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteUserAvatar,
    getMatchHistory,
    getUserStats,
    searchUsers,
    getOnlineUsers,
} from '../controllers/user.controller.js';
import { getUserRank } from '../controllers/stats.controller.js';
import { env } from '../config/env.js';

/**
 * User routes plugin
 */
export const userRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // Register multipart for file uploads
    await fastify.register(multipart, {
        limits: {
            fileSize: env.upload.maxSize, // Max file size from env
            files: 1, // Only 1 file at a time
        },
    });

    // ===== Public Routes =====

    /**
     * Search users by display name
     * GET /api/users/search?q=query&limit=20
     */
    fastify.get('/search', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    q: { type: 'string', minLength: 2, maxLength: 50 },
                    limit: { type: 'string' },
                },
                required: ['q'],
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                users: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'number' },
                                            display_name: { type: 'string' },
                                            avatar_url: { type: 'string' },
                                            is_online: { type: 'boolean' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    }, searchUsers);

    /**
     * Get online users
     * GET /api/users/online
     */
    fastify.get('/online', getOnlineUsers);

    /**
     * Get public user profile
     * GET /api/users/:id
     */
    fastify.get('/:id', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
    }, getUserProfile);

    /**
     * Get user match history
     * GET /api/users/:id/matches
     */
    fastify.get('/:id/matches', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'string' },
                    limit: { type: 'string' },
                },
            },
        },
    }, getMatchHistory);

    /**
     * Get user stats
     * GET /api/users/:id/stats
     */
    fastify.get('/:id/stats', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
    }, getUserStats);

    /**
     * Get user rank in leaderboard
     * GET /api/users/:id/rank
     */
    fastify.get('/:id/rank', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                rank: { type: 'number' },
                                totalPlayers: { type: 'number' },
                            },
                        },
                    },
                },
            },
        },
    }, getUserRank);

    // ===== Protected Routes (require auth) =====

    /**
     * Get current user's full profile
     * GET /api/users/me
     */
    fastify.get('/me', {
        preHandler: [authenticate],
    }, getMyProfile);

    /**
     * Update current user's profile
     * PATCH /api/users/me
     */
    fastify.patch('/me', {
        preHandler: [authenticate],
        schema: {
            body: {
                type: 'object',
                properties: {
                    displayName: { type: 'string', minLength: 3, maxLength: 32 },
                    email: { type: 'string', format: 'email' },
                },
            },
        },
    }, updateProfile);

    /**
     * Change password
     * PUT /api/users/me/password
     */
    fastify.put('/me/password', {
        preHandler: [authenticate],
        schema: {
            body: {
                type: 'object',
                properties: {
                    currentPassword: { type: 'string', minLength: 1 },
                    newPassword: { type: 'string', minLength: 8 },
                },
                required: ['currentPassword', 'newPassword'],
            },
        },
    }, changePassword);

    /**
     * Upload avatar
     * POST /api/users/me/avatar
     */
    fastify.post('/me/avatar', {
        preHandler: [authenticate],
    }, uploadAvatar);

    /**
     * Delete avatar (reset to default)
     * DELETE /api/users/me/avatar
     */
    fastify.delete('/me/avatar', {
        preHandler: [authenticate],
    }, deleteUserAvatar);
};
