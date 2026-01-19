import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';
import {
    getProviders,
    initiateOAuth,
    oauthCallback,
    linkOAuth,
    unlinkOAuth,
} from '../controllers/oauth.controller.js';

/**
 * OAuth routes plugin
 */
export const oauthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // ===== Public Routes =====

    /**
     * Get available OAuth providers
     * GET /api/oauth/providers
     */
    fastify.get('/providers', getProviders);

    /**
     * Initiate OAuth flow
     * GET /api/oauth/:provider
     * Returns authorization URL
     */
    fastify.get('/:provider', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    provider: { type: 'string', enum: ['google', 'github', '42'] },
                },
                required: ['provider'],
            },
        },
    }, initiateOAuth);

    /**
     * OAuth callback
     * GET /api/oauth/:provider/callback
     * Handles OAuth provider redirect
     */
    fastify.get('/:provider/callback', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    provider: { type: 'string', enum: ['google', 'github', '42'] },
                },
                required: ['provider'],
            },
            querystring: {
                type: 'object',
                properties: {
                    code: { type: 'string' },
                    state: { type: 'string' },
                    error: { type: 'string' },
                },
            },
        },
    }, oauthCallback);

    // ===== Protected Routes =====

    /**
     * Link OAuth to existing account
     * POST /api/oauth/:provider/link
     * Requires authentication
     */
    fastify.post('/:provider/link', {
        preHandler: [authenticate],
        schema: {
            params: {
                type: 'object',
                properties: {
                    provider: { type: 'string', enum: ['google', 'github', '42'] },
                },
                required: ['provider'],
            },
        },
    }, linkOAuth);

    /**
     * Unlink OAuth from account
     * DELETE /api/oauth/unlink
     * Requires authentication
     */
    fastify.delete('/unlink', {
        preHandler: [authenticate],
    }, unlinkOAuth);
};
