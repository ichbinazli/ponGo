import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { userModel } from '../models/user.model.js';
import { matchHistoryModel } from '../models/match.model.js';
import { hashPassword, verifyPassword } from '../services/hash.service.js';
import { saveAvatar, deleteAvatar, getAvatarUrl, UploadError } from '../services/upload.service.js';
import { successResponse, errorResponse, ErrorCodes } from '../utils/response.js';
import { updateProfileSchema, changePasswordSchema, paginationSchema } from '../utils/validators.js';

/**
 * Get current user profile (authenticated user)
 */
export const getMyProfile = async (
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

        // Get user stats
        const stats = matchHistoryModel.getUserStats(userId);

        return reply.send(
            successResponse({
                id: user.id,
                email: user.email,
                display_name: user.display_name,
                avatar_url: getAvatarUrl(user.avatar_url),
                is_online: user.is_online === 1,
                two_factor_enabled: user.two_factor_enabled === 1,
                created_at: user.created_at,
                stats,
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get profile')
        );
    }
};

/**
 * Get public user profile by ID
 */
export const getUserProfile = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = parseInt(request.params.id, 10);

        if (isNaN(userId)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid user ID')
            );
        }

        const profile = userModel.getPublicProfile(userId);

        if (!profile) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
            );
        }

        // Get user stats
        const stats = matchHistoryModel.getUserStats(userId);

        return reply.send(
            successResponse({
                ...profile,
                stats,
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get user profile')
        );
    }
};

/**
 * Update current user profile
 */
export const updateProfile = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const input = updateProfileSchema.parse(request.body);

        // Check if display name is taken by another user
        if (input.displayName) {
            const existing = userModel.findByDisplayName(input.displayName);
            if (existing && existing.id !== userId) {
                return reply.status(409).send(
                    errorResponse(ErrorCodes.ALREADY_EXISTS, 'Display name already taken')
                );
            }
        }

        // Check if email is taken by another user
        if (input.email) {
            const existing = userModel.findByEmail(input.email);
            if (existing && existing.id !== userId) {
                return reply.status(409).send(
                    errorResponse(ErrorCodes.ALREADY_EXISTS, 'Email already in use')
                );
            }
        }

        // Update user
        const updated = userModel.update(userId, {
            display_name: input.displayName,
            email: input.email,
        });

        if (!updated) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
            );
        }

        return reply.send(
            successResponse({
                id: updated.id,
                email: updated.email,
                display_name: updated.display_name,
                avatar_url: updated.avatar_url,
                is_online: updated.is_online === 1,
                two_factor_enabled: updated.two_factor_enabled === 1,
                created_at: updated.created_at,
                updated_at: updated.updated_at,
            }, 'Profile updated successfully')
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
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update profile')
        );
    }
};

/**
 * Change password
 */
export const changePassword = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const input = changePasswordSchema.parse(request.body);

        const user = userModel.findById(userId);

        if (!user) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
            );
        }

        // Users with OAuth only cannot change password
        if (!user.password_hash) {
            return reply.status(400).send(
                errorResponse(
                    ErrorCodes.VALIDATION_ERROR,
                    'Cannot change password for OAuth-only accounts'
                )
            );
        }

        // Verify current password
        const isValid = await verifyPassword(input.currentPassword, user.password_hash);
        if (!isValid) {
            return reply.status(401).send(
                errorResponse(ErrorCodes.INVALID_CREDENTIALS, 'Current password is incorrect')
            );
        }

        // Hash new password
        const newPasswordHash = await hashPassword(input.newPassword);

        // Update password
        userModel.update(userId, { password_hash: newPasswordHash });

        return reply.send(
            successResponse(null, 'Password changed successfully')
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
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to change password')
        );
    }
};

/**
 * Upload avatar
 */
export const uploadAvatar = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;

        // Get uploaded file
        const data = await request.file();

        if (!data) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'No file uploaded')
            );
        }

        // Get current user to delete old avatar
        const user = userModel.findById(userId);
        const oldAvatar = user?.avatar_url;

        // Save new avatar
        const result = await saveAvatar(
            userId,
            data.file,
            data.mimetype,
            data.file.readableLength || 0
        );

        // Update user avatar
        userModel.update(userId, { avatar_url: result.filename });

        // Delete old avatar if exists
        if (oldAvatar && oldAvatar !== 'default-avatar.png') {
            deleteAvatar(oldAvatar);
        }

        return reply.send(
            successResponse({
                avatar_url: result.url,
                filename: result.filename,
            }, 'Avatar uploaded successfully')
        );
    } catch (error) {
        if (error instanceof UploadError) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, error.message)
            );
        }
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to upload avatar')
        );
    }
};

/**
 * Delete avatar (reset to default)
 */
export const deleteUserAvatar = async (
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

        // Delete old avatar file
        if (user.avatar_url && user.avatar_url !== 'default-avatar.png') {
            deleteAvatar(user.avatar_url);
        }

        // Reset to default
        userModel.update(userId, { avatar_url: 'default-avatar.png' });

        return reply.send(
            successResponse({ avatar_url: '/uploads/avatars/default-avatar.png' }, 'Avatar deleted')
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to delete avatar')
        );
    }
};

/**
 * Get user match history
 */
export const getMatchHistory = async (
    request: FastifyRequest<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = parseInt(request.params.id, 10);

        if (isNaN(userId)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid user ID')
            );
        }

        // Check if user exists
        const user = userModel.getPublicProfile(userId);
        if (!user) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
            );
        }

        // Parse pagination
        const pagination = paginationSchema.parse(request.query);
        const offset = (pagination.page - 1) * pagination.limit;

        // Get matches
        const matches = matchHistoryModel.getUserMatches(userId, pagination.limit, offset);
        const totalMatches = matchHistoryModel.getMatchCount(userId);

        return reply.send(
            successResponse({
                matches,
                pagination: {
                    page: pagination.page,
                    limit: pagination.limit,
                    total: totalMatches,
                    totalPages: Math.ceil(totalMatches / pagination.limit),
                },
            })
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            return reply.status(400).send(
                errorResponse(
                    ErrorCodes.VALIDATION_ERROR,
                    'Invalid pagination parameters'
                )
            );
        }
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get match history')
        );
    }
};

/**
 * Get user stats
 */
export const getUserStats = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = parseInt(request.params.id, 10);

        if (isNaN(userId)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid user ID')
            );
        }

        // Check if user exists
        const user = userModel.getPublicProfile(userId);
        if (!user) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
            );
        }

        const stats = matchHistoryModel.getUserStats(userId);

        return reply.send(successResponse(stats));
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get user stats')
        );
    }
};

/**
 * Search users by display name
 */
export const searchUsers = async (
    request: FastifyRequest<{ Querystring: { q: string; limit?: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const query = request.query.q;
        const limit = Math.min(parseInt(request.query.limit || '20', 10), 50);

        if (!query || query.length < 2) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Search query must be at least 2 characters')
            );
        }

        const users = userModel.search(query, limit);

        return reply.send(successResponse({ users }));
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to search users')
        );
    }
};

/**
 * Get online users
 */
export const getOnlineUsers = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const users = userModel.getOnlineUsers();
        return reply.send(successResponse({ users, count: users.length }));
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get online users')
        );
    }
};
