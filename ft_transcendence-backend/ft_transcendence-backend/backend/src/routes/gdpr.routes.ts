import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { authenticate } from '../middleware/auth.middleware.js';
import {
    exportUserData,
    anonymizeAccount,
    deleteAccount,
    getPrivacyInfo,
    getRetentionInfo,
} from '../controllers/gdpr.controller.js';

/**
 * GDPR compliance routes plugin
 * Implements GDPR rights: Access, Rectification, Erasure, Portability
 */
export const gdprRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // ===== Public Route =====

    /**
     * Get privacy policy and data collection info
     * GET /api/gdpr/info
     */
    fastify.get('/info', getPrivacyInfo);

    // ===== Protected Routes =====

    /**
     * Export all user data (Data Portability - Article 20)
     * GET /api/gdpr/export
     * Returns JSON file with all user data
     */
    fastify.get('/export', {
        preHandler: [authenticate],
    }, exportUserData);

    /**
     * Get data retention info for current user
     * GET /api/gdpr/retention
     */
    fastify.get('/retention', {
        preHandler: [authenticate],
    }, getRetentionInfo);

    /**
     * Anonymize account (Right to Erasure - Article 17 - Soft Delete)
     * POST /api/gdpr/anonymize
     * Removes personal data but keeps anonymized records
     * Body: { password?: string, confirmation: "ANONYMIZE MY ACCOUNT" }
     */
    fastify.post('/anonymize', {
        preHandler: [authenticate],
        schema: {
            body: {
                type: 'object',
                properties: {
                    password: { type: 'string' },
                    confirmation: { type: 'string' },
                },
                required: ['confirmation'],
            },
        },
    }, anonymizeAccount);

    /**
     * Permanently delete account (Right to Erasure - Article 17 - Hard Delete)
     * DELETE /api/gdpr/delete
     * Permanently removes all user data
     * Body: { password?: string, confirmation: "DELETE MY ACCOUNT PERMANENTLY" }
     */
    fastify.delete('/delete', {
        preHandler: [authenticate],
        schema: {
            body: {
                type: 'object',
                properties: {
                    password: { type: 'string' },
                    confirmation: { type: 'string' },
                },
                required: ['confirmation'],
            },
        },
    }, deleteAccount);
};
