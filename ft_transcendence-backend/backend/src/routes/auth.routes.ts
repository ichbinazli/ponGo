import { FastifyInstance } from 'fastify';
import {
    register,
    login,
    logout,
    logoutAll,
    refreshToken,
    getCurrentUser,
    getSessions,
    revokeSession,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

/**
 * Auth routes
 */
export const authRoutes = async (server: FastifyInstance): Promise<void> => {
    // Public routes
    server.post('/register', {
        schema: {
            description: 'Register a new user',
            tags: ['Auth'],
            body: {
                type: 'object',
                required: ['email', 'password', 'displayName'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    displayName: { type: 'string', minLength: 3, maxLength: 32 },
                },
            },
        },
        handler: register,
    });

    server.post('/login', {
        schema: {
            description: 'Login with email and password',
            tags: ['Auth'],
            body: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                    twoFactorCode: { type: 'string', minLength: 6, maxLength: 6 },
                },
            },
        },
        handler: login,
    });

    server.post('/refresh', {
        schema: {
            description: 'Refresh access token',
            tags: ['Auth'],
            body: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                    refreshToken: { type: 'string' },
                },
            },
        },
        handler: refreshToken,
    });

    // Protected routes
    server.post('/logout', {
        preHandler: [authenticate],
        schema: {
            description: 'Logout current session',
            tags: ['Auth'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                properties: {
                    refreshToken: { type: 'string' },
                },
            },
        },
        handler: logout,
    });

    server.post('/logout-all', {
        preHandler: [authenticate],
        schema: {
            description: 'Logout from all devices',
            tags: ['Auth'],
            security: [{ bearerAuth: [] }],
        },
        handler: logoutAll,
    });

    server.get('/me', {
        preHandler: [authenticate],
        schema: {
            description: 'Get current user info',
            tags: ['Auth'],
            security: [{ bearerAuth: [] }],
        },
        handler: getCurrentUser,
    });

    server.get('/sessions', {
        preHandler: [authenticate],
        schema: {
            description: 'Get active sessions',
            tags: ['Auth'],
            security: [{ bearerAuth: [] }],
        },
        handler: getSessions,
    });

    server.delete('/sessions/:sessionId', {
        preHandler: [authenticate],
        schema: {
            description: 'Revoke a specific session',
            tags: ['Auth'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['sessionId'],
                properties: {
                    sessionId: { type: 'string' },
                },
            },
        },
        handler: revokeSession,
    });
};
