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
    forgotPassword,
    resetPassword,
    verifyUserPassword,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

/**
 * Auth routes
 */
export const authRoutes = async (server: FastifyInstance): Promise<void> => {
    // Public routes
    server.post('/register', {
        schema: {
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

    server.post('/forgot-password', {
        schema: {
            body: {
                type: 'object',
                required: ['email'],
                properties: {
                    email: { type: 'string', format: 'email' },
                },
            },
        },
        handler: forgotPassword,
    });

    server.post('/reset-password', {
        schema: {
            body: {
                type: 'object',
                required: ['email', 'code', 'newPassword'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    code: { type: 'string', minLength: 6, maxLength: 6 },
                    newPassword: { type: 'string', minLength: 8 },
                },
            },
        },
        handler: resetPassword,
    });

    // Verify user password (for game team - match participant verification)
    server.post('/verify-password', {
        preHandler: [authenticate],
        schema: {
            body: {
                type: 'object',
                required: ['userId', 'password'],
                properties: {
                    userId: { type: 'number' },
                    password: { type: 'string' },
                },
            },
        },
        handler: verifyUserPassword,
    });

    // Protected routes
    server.post('/logout', {
        preHandler: [authenticate],
        schema: {
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
        handler: logoutAll,
    });

    server.get('/me', {
        preHandler: [authenticate],
        handler: getCurrentUser,
    });

    server.get('/sessions', {
        preHandler: [authenticate],
        handler: getSessions,
    });

    server.delete('/sessions/:sessionId', {
        preHandler: [authenticate],
        schema: {
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
