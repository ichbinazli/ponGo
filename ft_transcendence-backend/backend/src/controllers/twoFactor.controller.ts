import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { userModel } from '../models/user.model.js';
import {
    setupTwoFactor,
    verifyTotpCode,
    isValidTotpFormat,
    isValidBackupCodeFormat,
    generateBackupCodes,
} from '../services/twoFactor.service.js';
import { hashPassword, verifyPassword } from '../services/hash.service.js';
import { successResponse, errorResponse, ErrorCodes } from '../utils/response.js';
import { twoFactorSetupSchema } from '../utils/validators.js';

// Temporary storage for pending 2FA setups (in production, use Redis)
const pendingSetups = new Map<number, { secret: string; backupCodes: string[]; expiresAt: number }>();

// Clean up expired setups
setInterval(() => {
    const now = Date.now();
    for (const [userId, data] of pendingSetups) {
        if (data.expiresAt < now) {
            pendingSetups.delete(userId);
        }
    }
}, 60000);

/**
 * Get 2FA status
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

        const backupCodes = user.two_factor_backup_codes
            ? JSON.parse(user.two_factor_backup_codes)
            : [];

        return reply.send(
            successResponse({
                enabled: user.two_factor_enabled === 1,
                hasBackupCodes: backupCodes.length > 0,
                backupCodesCount: backupCodes.length,
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
 * Initialize 2FA setup - generates secret and QR code
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

        // Generate 2FA setup
        const setup = await setupTwoFactor(user.email);

        // Store pending setup (expires in 10 minutes)
        pendingSetups.set(userId, {
            secret: setup.secret,
            backupCodes: setup.backupCodes,
            expiresAt: Date.now() + 10 * 60 * 1000,
        });

        return reply.send(
            successResponse({
                qrCode: setup.qrCodeDataUrl,
                secret: setup.secret, // For manual entry
                backupCodes: setup.backupCodes,
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to initialize 2FA setup')
        );
    }
};

/**
 * Confirm and enable 2FA
 */
export const confirmTwoFactor = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const input = twoFactorSetupSchema.parse(request.body);

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

        // Get pending setup
        const pending = pendingSetups.get(userId);
        if (!pending || pending.expiresAt < Date.now()) {
            pendingSetups.delete(userId);
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, '2FA setup expired. Please start again.')
            );
        }

        // Verify the code
        if (!verifyTotpCode(input.code, pending.secret)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid verification code')
            );
        }

        // Hash backup codes for storage
        const hashedBackupCodes: string[] = [];
        for (const code of pending.backupCodes) {
            const hashed = await hashPassword(code);
            hashedBackupCodes.push(hashed);
        }

        // Enable 2FA
        userModel.update(userId, {
            two_factor_secret: pending.secret,
            two_factor_enabled: true,
            two_factor_backup_codes: JSON.stringify(hashedBackupCodes),
        });

        // Clean up pending setup
        pendingSetups.delete(userId);

        return reply.send(
            successResponse({
                enabled: true,
                backupCodesCount: pending.backupCodes.length,
            }, '2FA enabled successfully')
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return reply.status(400).send(
                errorResponse(
                    ErrorCodes.VALIDATION_ERROR,
                    'Validation failed',
                    error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
                )
            );
        }
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to enable 2FA')
        );
    }
};

/**
 * Disable 2FA
 */
export const disableTwoFactor = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const { code, password } = request.body as { code?: string; password?: string };

        const user = userModel.findById(userId);
        if (!user) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
            );
        }

        // Check if 2FA is enabled
        if (user.two_factor_enabled !== 1) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, '2FA is not enabled')
            );
        }

        // Require either TOTP code or password verification
        let verified = false;

        if (code && user.two_factor_secret) {
            verified = verifyTotpCode(code, user.two_factor_secret);
        }

        if (!verified && password && user.password_hash) {
            verified = await verifyPassword(password, user.password_hash);
        }

        if (!verified) {
            return reply.status(401).send(
                errorResponse(ErrorCodes.INVALID_CREDENTIALS, 'Invalid verification')
            );
        }

        // Disable 2FA
        userModel.update(userId, {
            two_factor_secret: undefined,
            two_factor_enabled: false,
            two_factor_backup_codes: undefined,
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
 * Verify 2FA code (for login flow)
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

        if (user.two_factor_enabled !== 1 || !user.two_factor_secret) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, '2FA is not enabled for this user')
            );
        }

        // Check if it's a TOTP code
        if (isValidTotpFormat(code)) {
            if (verifyTotpCode(code, user.two_factor_secret)) {
                return reply.send(successResponse({ verified: true }));
            }
        }

        // Check if it's a backup code
        if (isValidBackupCodeFormat(code) && user.two_factor_backup_codes) {
            const hashedCodes: string[] = JSON.parse(user.two_factor_backup_codes);
            const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
            const formattedCode = `${normalizedCode.slice(0, 4)}-${normalizedCode.slice(4)}`;

            for (let i = 0; i < hashedCodes.length; i++) {
                if (await verifyPassword(formattedCode, hashedCodes[i])) {
                    // Remove used backup code
                    hashedCodes.splice(i, 1);
                    userModel.update(userId, {
                        two_factor_backup_codes: JSON.stringify(hashedCodes),
                    });

                    return reply.send(
                        successResponse({
                            verified: true,
                            backupCodeUsed: true,
                            remainingBackupCodes: hashedCodes.length,
                        })
                    );
                }
            }
        }

        return reply.status(401).send(
            errorResponse(ErrorCodes.INVALID_CREDENTIALS, 'Invalid 2FA code')
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to verify 2FA')
        );
    }
};

/**
 * Regenerate backup codes
 */
export const regenerateBackupCodes = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const { code } = request.body as { code: string };

        if (!code) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Verification code required')
            );
        }

        const user = userModel.findById(userId);
        if (!user) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
            );
        }

        if (user.two_factor_enabled !== 1 || !user.two_factor_secret) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, '2FA is not enabled')
            );
        }

        // Verify TOTP code
        if (!verifyTotpCode(code, user.two_factor_secret)) {
            return reply.status(401).send(
                errorResponse(ErrorCodes.INVALID_CREDENTIALS, 'Invalid verification code')
            );
        }

        // Generate new backup codes
        const newBackupCodes = generateBackupCodes();

        // Hash and store
        const hashedBackupCodes: string[] = [];
        for (const backupCode of newBackupCodes) {
            const hashed = await hashPassword(backupCode);
            hashedBackupCodes.push(hashed);
        }

        userModel.update(userId, {
            two_factor_backup_codes: JSON.stringify(hashedBackupCodes),
        });

        return reply.send(
            successResponse({
                backupCodes: newBackupCodes,
                count: newBackupCodes.length,
            }, 'Backup codes regenerated')
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to regenerate backup codes')
        );
    }
};
