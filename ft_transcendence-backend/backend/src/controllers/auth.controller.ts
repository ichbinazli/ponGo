import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { z } from 'zod';
import { userModel } from '../models/user.model.js';
import { sessionModel } from '../models/session.model.js';
import { hashPassword, verifyPassword, hashToken, verifyToken } from '../services/hash.service.js';
import {
    generateTokenPair,
    verifyJwtToken,
    generateRandomToken,
} from '../services/jwt.service.js';
import { generateVerificationCode, storeVerificationCode, verifyCode } from '../services/twoFactor.service.js';
import { sendVerificationCode, sendPasswordResetCode } from '../services/email.service.js';
import { successResponse, errorResponse, ErrorCodes } from '../utils/response.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validators.js';

/**
 * Register a new user
 */
export const register = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        // Validate input
        const input = registerSchema.parse(request.body);

        // Check if email already exists
        if (userModel.emailExists(input.email)) {
            return reply.status(409).send(
                errorResponse(ErrorCodes.ALREADY_EXISTS, 'Email already registered')
            );
        }

        // Check if display name already exists
        if (userModel.displayNameExists(input.displayName)) {
            return reply.status(409).send(
                errorResponse(ErrorCodes.ALREADY_EXISTS, 'Display name already taken')
            );
        }

        // Hash password
        const passwordHash = await hashPassword(input.password);

        // Create user
        const user = userModel.create({
            email: input.email,
            password_hash: passwordHash,
            display_name: input.displayName,
        });

        // Generate tokens
        const server = request.server as FastifyInstance;
        const tokens = generateTokenPair(server, user);

        // Store refresh token
        const refreshTokenId = generateRandomToken();
        const refreshTokenHash = await hashToken(refreshTokenId);

        sessionModel.create({
            user_id: user.id,
            refresh_token_hash: refreshTokenHash,
            user_agent: request.headers['user-agent'],
            ip_address: request.ip,
            expires_at: tokens.refreshTokenExpiresAt.toISOString(),
        });

        // Set user online
        userModel.setOnlineStatus(user.id, true);

        return reply.status(201).send(
            successResponse(
                {
                    user: {
                        id: user.id,
                        email: user.email,
                        displayName: user.display_name,
                        avatarUrl: user.avatar_url,
                    },
                    tokens: {
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken,
                        expiresAt: tokens.accessTokenExpiresAt.toISOString(),
                    },
                },
                'Registration successful'
            )
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid input', error.errors)
            );
        }
        throw error;
    }
};

/**
 * Login user
 */
export const login = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        // Validate input
        const input = loginSchema.parse(request.body);

        // Find user by email
        const user = userModel.findByEmail(input.email);
        if (!user) {
            return reply.status(401).send(
                errorResponse(ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password')
            );
        }

        // Check if user has a password (might be OAuth-only)
        if (!user.password_hash) {
            return reply.status(401).send(
                errorResponse(
                    ErrorCodes.INVALID_CREDENTIALS,
                    'This account uses external login. Please use OAuth.'
                )
            );
        }

        // Verify password
        const isValidPassword = await verifyPassword(input.password, user.password_hash);
        if (!isValidPassword) {
            return reply.status(401).send(
                errorResponse(ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password')
            );
        }

        // Check if 2FA is enabled
        if (user.two_factor_enabled === 1) {
            // If no 2FA code provided, send code to email and ask for it
            if (!input.twoFactorCode) {
                // Generate and send email code
                const code = generateVerificationCode();
                storeVerificationCode(`2fa-login:${user.id}`, code, 5);
                await sendVerificationCode(user.email, code);

                return reply.status(200).send(
                    successResponse(
                        { requires2FA: true, userId: user.id },
                        'Two-factor authentication required. Code sent to your email.'
                    )
                );
            }

            // Verify 2FA email code
            if (!verifyCode(`2fa-login:${user.id}`, input.twoFactorCode)) {
                return reply.status(401).send(
                    errorResponse(ErrorCodes.INVALID_CREDENTIALS, 'Invalid or expired 2FA code')
                );
            }
        }

        // Generate tokens
        const server = request.server as FastifyInstance;
        const tokens = generateTokenPair(server, user);

        // Store refresh token
        const refreshTokenHash = await hashToken(tokens.refreshToken);

        sessionModel.create({
            user_id: user.id,
            refresh_token_hash: refreshTokenHash,
            user_agent: request.headers['user-agent'],
            ip_address: request.ip,
            expires_at: tokens.refreshTokenExpiresAt.toISOString(),
        });

        // Set user online
        userModel.setOnlineStatus(user.id, true);

        return reply.status(200).send(
            successResponse(
                {
                    user: {
                        id: user.id,
                        email: user.email,
                        displayName: user.display_name,
                        avatarUrl: user.avatar_url,
                        twoFactorEnabled: user.two_factor_enabled === 1,
                    },
                    tokens: {
                        accessToken: tokens.accessToken,
                        refreshToken: tokens.refreshToken,
                        expiresAt: tokens.accessTokenExpiresAt.toISOString(),
                    },
                },
                'Login successful'
            )
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid input', error.errors)
            );
        }
        throw error;
    }
};

/**
 * Forgot password — sends reset code to email
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const input = forgotPasswordSchema.parse(request.body);

        const user = userModel.findByEmail(input.email);

        // Always return success to prevent email enumeration
        if (!user || !user.password_hash) {
            return reply.send(
                successResponse(
                    { message: 'If this email exists, a reset code has been sent.' },
                    'Password reset code sent'
                )
            );
        }

        // Generate and store code (10 minute TTL for password reset)
        const code = generateVerificationCode();
        storeVerificationCode(`pwd-reset:${user.email}`, code, 10);

        // Send code via email
        await sendPasswordResetCode(user.email, code);

        return reply.send(
            successResponse(
                { message: 'If this email exists, a reset code has been sent.' },
                'Password reset code sent'
            )
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid input', error.errors)
            );
        }
        throw error;
    }
};

/**
 * Reset password — verifies code and sets new password
 * POST /api/auth/reset-password
 */
export const resetPassword = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const input = resetPasswordSchema.parse(request.body);

        const user = userModel.findByEmail(input.email);
        if (!user) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid reset request')
            );
        }

        // Verify the reset code
        if (!verifyCode(`pwd-reset:${user.email}`, input.code)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid or expired reset code')
            );
        }

        // Hash and update password
        const passwordHash = await hashPassword(input.newPassword);
        userModel.update(user.id, { password_hash: passwordHash });

        // Revoke all sessions (force re-login)
        sessionModel.revokeAllForUser(user.id);

        return reply.send(
            successResponse(null, 'Password reset successful. Please login with your new password.')
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid input', error.errors)
            );
        }
        throw error;
    }
};

/**
 * Logout user
 */
export const logout = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    const userId = request.user?.id;

    if (!userId) {
        return reply.status(401).send(
            errorResponse(ErrorCodes.UNAUTHORIZED, 'Not authenticated')
        );
    }

    // Get refresh token from body if provided
    const body = request.body as { refreshToken?: string } | undefined;

    if (body?.refreshToken) {
        // Revoke specific session
        const sessions = sessionModel.findByUserId(userId);
        for (const session of sessions) {
            const isMatch = await verifyToken(body.refreshToken, session.refresh_token_hash);
            if (isMatch) {
                sessionModel.revoke(session.id);
                break;
            }
        }
    }

    // Set user offline
    userModel.setOnlineStatus(userId, false);

    return reply.status(200).send(
        successResponse(null, 'Logout successful')
    );
};

/**
 * Logout from all devices
 */
export const logoutAll = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    const userId = request.user?.id;

    if (!userId) {
        return reply.status(401).send(
            errorResponse(ErrorCodes.UNAUTHORIZED, 'Not authenticated')
        );
    }

    // Revoke all sessions
    const revokedCount = sessionModel.revokeAllForUser(userId);

    // Set user offline
    userModel.setOnlineStatus(userId, false);

    return reply.status(200).send(
        successResponse(
            { revokedSessions: revokedCount },
            'Logged out from all devices'
        )
    );
};

/**
 * Refresh access token
 */
export const refreshToken = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    const body = request.body as { refreshToken?: string } | undefined;

    if (!body?.refreshToken) {
        return reply.status(400).send(
            errorResponse(ErrorCodes.VALIDATION_ERROR, 'Refresh token required')
        );
    }

    const server = request.server as FastifyInstance;

    // Verify the refresh token JWT
    const payload = verifyJwtToken(server, body.refreshToken);
    if (!payload || payload.type !== 'refresh') {
        return reply.status(401).send(
            errorResponse(ErrorCodes.TOKEN_INVALID, 'Invalid refresh token')
        );
    }

    // Find user
    const user = userModel.findById(payload.userId);
    if (!user) {
        return reply.status(401).send(
            errorResponse(ErrorCodes.UNAUTHORIZED, 'User not found')
        );
    }

    // Find and verify session
    const sessions = sessionModel.findByUserId(user.id);
    let validSession = null;

    for (const session of sessions) {
        const isMatch = await verifyToken(body.refreshToken, session.refresh_token_hash);
        if (isMatch) {
            validSession = session;
            break;
        }
    }

    if (!validSession) {
        return reply.status(401).send(
            errorResponse(ErrorCodes.TOKEN_INVALID, 'Session not found or revoked')
        );
    }

    // Generate new tokens
    const tokens = generateTokenPair(server, user);

    // Update session with new refresh token
    sessionModel.revoke(validSession.id);

    const newRefreshTokenHash = await hashToken(tokens.refreshToken);
    sessionModel.create({
        user_id: user.id,
        refresh_token_hash: newRefreshTokenHash,
        user_agent: request.headers['user-agent'],
        ip_address: request.ip,
        expires_at: tokens.refreshTokenExpiresAt.toISOString(),
    });

    return reply.status(200).send(
        successResponse(
            {
                tokens: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    expiresAt: tokens.accessTokenExpiresAt.toISOString(),
                },
            },
            'Token refreshed'
        )
    );
};

/**
 * Get current user info
 */
export const getCurrentUser = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    const userId = request.user?.id;

    if (!userId) {
        return reply.status(401).send(
            errorResponse(ErrorCodes.UNAUTHORIZED, 'Not authenticated')
        );
    }

    const user = userModel.findById(userId);
    if (!user) {
        return reply.status(404).send(
            errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
        );
    }

    return reply.status(200).send(
        successResponse({
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            avatarUrl: user.avatar_url,
            isOnline: user.is_online === 1,
            twoFactorEnabled: user.two_factor_enabled === 1,
            createdAt: user.created_at,
        })
    );
};

/**
 * Get active sessions for current user
 */
export const getSessions = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    const userId = request.user?.id;

    if (!userId) {
        return reply.status(401).send(
            errorResponse(ErrorCodes.UNAUTHORIZED, 'Not authenticated')
        );
    }

    const sessions = sessionModel.findByUserId(userId);

    return reply.status(200).send(
        successResponse(
            sessions.map((s) => ({
                id: s.id,
                userAgent: s.user_agent,
                ipAddress: s.ip_address,
                createdAt: s.created_at,
                expiresAt: s.expires_at,
            }))
        )
    );
};

/**
 * Revoke a specific session
 */
export const revokeSession = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    const userId = request.user?.id;
    const { sessionId } = request.params as { sessionId: string };

    if (!userId) {
        return reply.status(401).send(
            errorResponse(ErrorCodes.UNAUTHORIZED, 'Not authenticated')
        );
    }

    const session = sessionModel.findById(parseInt(sessionId, 10));

    if (!session || session.user_id !== userId) {
        return reply.status(404).send(
            errorResponse(ErrorCodes.NOT_FOUND, 'Session not found')
        );
    }

    sessionModel.revoke(session.id);

    return reply.status(200).send(
        successResponse(null, 'Session revoked')
    );
};
