import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';
import {
    getTwoFactorStatus,
    initTwoFactorSetup,
    confirmTwoFactor,
    disableTwoFactor,
    verifyTwoFactor,
    sendTwoFactorCode,
} from '../controllers/twoFactor.controller.js';

/**
 * Two-Factor Authentication routes plugin (Email-based)
 */
export const twoFactorRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // ===== Public Routes (for login flow) =====

    /**
     * Send 2FA verification code to email (login flow)
     * POST /api/2fa/send-code
     * Body: { userId: number }
     */
    fastify.post('/send-code', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    userId: { type: 'number' },
                },
                required: ['userId'],
            },
        },
    }, sendTwoFactorCode);

    /**
     * Verify 2FA code during login
     * POST /api/2fa/verify
     * Body: { userId: number, code: string }
     */
    fastify.post('/verify', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    userId: { type: 'number' },
                    code: { type: 'string', minLength: 6, maxLength: 6 },
                },
                required: ['userId', 'code'],
            },
        },
    }, verifyTwoFactor);

    // ===== Protected Routes =====

    /**
     * Get 2FA status
     * GET /api/2fa/status
     */
    fastify.get('/status', {
        preHandler: [authenticate],
    }, getTwoFactorStatus);

    /**
     * Initialize 2FA setup (sends code to email)
     * POST /api/2fa/setup
     */
    fastify.post('/setup', {
        preHandler: [authenticate],
    }, initTwoFactorSetup);

    /**
     * Confirm and enable 2FA
     * POST /api/2fa/confirm
     * Body: { code: string }
     */
    fastify.post('/confirm', {
        preHandler: [authenticate],
        schema: {
            body: {
                type: 'object',
                properties: {
                    code: { type: 'string', minLength: 6, maxLength: 6 },
                },
                required: ['code'],
            },
        },
    }, confirmTwoFactor);

    /**
     * Disable 2FA
     * POST /api/2fa/disable
     * Body: { password: string }
     */
    fastify.post('/disable', {
        preHandler: [authenticate],
        schema: {
            body: {
                type: 'object',
                properties: {
                    password: { type: 'string' },
                },
                required: ['password'],
            },
        },
    }, disableTwoFactor);
};
