import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';
import {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    getFriends,
    getOnlineFriends,
    getPendingRequests,
    getSentRequests,
    blockUser,
    unblockUser,
    getBlockedUsers,
    getFriendshipStatus,
} from '../controllers/friend.controller.js';

/**
 * Friend routes plugin
 * All routes require authentication
 */
export const friendRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // Apply authentication to all routes
    fastify.addHook('preHandler', authenticate);

    // ===== Friends List =====

    /**
     * Get all friends
     * GET /api/friends
     */
    fastify.get('/', getFriends);

    /**
     * Get online friends
     * GET /api/friends/online
     */
    fastify.get('/online', getOnlineFriends);

    // ===== Friend Requests =====

    /**
     * Send friend request
     * POST /api/friends/requests
     * Body: { userId: number }
     */
    fastify.post('/requests', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    userId: { type: 'number' },
                },
                required: ['userId'],
            },
        },
    }, sendFriendRequest);

    /**
     * Get pending friend requests (received)
     * GET /api/friends/requests/pending
     */
    fastify.get('/requests/pending', getPendingRequests);

    /**
     * Get sent friend requests
     * GET /api/friends/requests/sent
     */
    fastify.get('/requests/sent', getSentRequests);

    /**
     * Accept friend request
     * POST /api/friends/requests/:id/accept
     */
    fastify.post('/requests/:id/accept', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
    }, acceptFriendRequest);

    /**
     * Reject friend request
     * POST /api/friends/requests/:id/reject
     */
    fastify.post('/requests/:id/reject', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
    }, rejectFriendRequest);

    /**
     * Cancel sent friend request
     * DELETE /api/friends/requests/:id
     */
    fastify.delete('/requests/:id', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
    }, cancelFriendRequest);

    // ===== Friend Management =====

    /**
     * Check friendship status with a user
     * GET /api/friends/status/:id
     */
    fastify.get('/status/:id', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
    }, getFriendshipStatus);

    /**
     * Remove friend
     * DELETE /api/friends/:id
     */
    fastify.delete('/:id', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
    }, removeFriend);

    // ===== Block Management =====

    /**
     * Get blocked users
     * GET /api/friends/blocked
     */
    fastify.get('/blocked', getBlockedUsers);

    /**
     * Block a user
     * POST /api/friends/block
     * Body: { userId: number }
     */
    fastify.post('/block', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    userId: { type: 'number' },
                },
                required: ['userId'],
            },
        },
    }, blockUser);

    /**
     * Unblock a user
     * DELETE /api/friends/block/:id
     */
    fastify.delete('/block/:id', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
    }, unblockUser);
};
