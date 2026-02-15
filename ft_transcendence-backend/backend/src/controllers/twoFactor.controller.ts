import { FastifyRequest, FastifyReply } from 'fastify';
import { userModel } from '../models/user.model.js';
import { generateVerificationCode, storeVerificationCode, verifyCode } from '../services/twoFactor.service.js';
import { sendVerificationCode, send2FAEnabledNotification } from '../services/email.service.js';
import { verifyPassword } from '../services/hash.service.js';
import { successResponse, errorResponse, ErrorCodes } from '../utils/response.js';

/**
 * Get 2FA status
 * GET /api/2fa/status
 */
export const getTwoFactorStatus = async (
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

        return reply.send(
            successResponse({
                enabled: user.two_factor_enabled === 1,
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get 2FA status')
        );
    }
};

/**
 * Initialize 2FA setup — sends verification code to user's email
 * POST /api/2fa/setup
 */
export const initTwoFactorSetup = async (
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

        // Check if already enabled
        if (user.two_factor_enabled === 1) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, '2FA is already enabled')
            );
        }

        // Generate and store code
        const code = generateVerificationCode();
        storeVerificationCode(`2fa-setup:${userId}`, code, 5);

        // Send code via email
        await sendVerificationCode(user.email, code);

        return reply.send(
            successResponse(
                { message: 'Verification code sent to your email' },
                'Verification code sent'
            )
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to send verification code')
        );
    }
};

/**
 * Confirm and enable 2FA
 * POST /api/2fa/confirm
 * Body: { code: string }
 */
export const confirmTwoFactor = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const { code } = request.body as { code: string };

        if (!code) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Verification code is required')
            );
        }

        const user = userModel.findById(userId);
        if (!user) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
            );
        }

        if (user.two_factor_enabled === 1) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, '2FA is already enabled')
            );
        }

        // Verify the email code
        if (!verifyCode(`2fa-setup:${userId}`, code)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid or expired verification code')
            );
        }

        // Enable 2FA
        userModel.update(userId, {
            two_factor_enabled: true,
        });

        // Send confirmation email
        try {
            await send2FAEnabledNotification(user.email);
        } catch {
            // Non-critical — don't fail if notification email fails
        }

        return reply.send(
            successResponse(
                { enabled: true },
                '2FA enabled successfully'
            )
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to enable 2FA')
        );
    }
};

/**
 * Disable 2FA
 * POST /api/2fa/disable
 * Body: { password: string }
 */
export const disableTwoFactor = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const { password } = request.body as { password: string };

        if (!password) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Password is required to disable 2FA')
            );
        }

        const user = userModel.findById(userId);
        if (!user) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
            );
        }

        if (user.two_factor_enabled !== 1) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, '2FA is not enabled')
            );
        }

        // Verify password
        if (!user.password_hash || !(await verifyPassword(password, user.password_hash))) {
            return reply.status(401).send(
                errorResponse(ErrorCodes.INVALID_CREDENTIALS, 'Invalid password')
            );
        }

        // Disable 2FA
        userModel.update(userId, {
            two_factor_enabled: false,
        });

        return reply.send(
            successResponse(null, '2FA disabled successfully')
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to disable 2FA')
        );
    }
};

/**
 * Send 2FA code for login flow
 * POST /api/2fa/send-code
 * Body: { userId: number }
 */
export const sendTwoFactorCode = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const { userId } = request.body as { userId: number };

        if (!userId) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'userId is required')
            );
        }

        const user = userModel.findById(userId);
        if (!user) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
            );
        }

        if (user.two_factor_enabled !== 1) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, '2FA is not enabled for this user')
            );
        }

        // Generate and store code
        const code = generateVerificationCode();
        storeVerificationCode(`2fa-login:${userId}`, code, 5);

        // Send code via email
        await sendVerificationCode(user.email, code);

        return reply.send(
            successResponse(
                { message: 'Verification code sent to your email' },
                'Verification code sent'
            )
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to send verification code')
        );
    }
};

/**
 * Verify 2FA code during login
 * POST /api/2fa/verify
 * Body: { userId: number, code: string }
 */
export const verifyTwoFactor = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const { userId, code } = request.body as { userId: number; code: string };

        if (!userId || !code) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Missing userId or code')
            );
        }

        const user = userModel.findById(userId);
        if (!user) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
            );
        }

        if (user.two_factor_enabled !== 1) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, '2FA is not enabled for this user')
            );
        }

        // Verify the email code
        if (!verifyCode(`2fa-login:${userId}`, code)) {
            return reply.status(401).send(
                errorResponse(ErrorCodes.INVALID_CREDENTIALS, 'Invalid or expired verification code')
            );
        }

        return reply.send(
            successResponse({ verified: true }, '2FA verified successfully')
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to verify 2FA')
        );
    }
};
