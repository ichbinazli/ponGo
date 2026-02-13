import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { friendshipModel } from '../models/friendship.model.js';
import { userModel } from '../models/user.model.js';
import { successResponse, errorResponse, ErrorCodes } from '../utils/response.js';
import { friendRequestSchema } from '../utils/validators.js';

/**
 * Send friend request
 */
export const sendFriendRequest = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const input = friendRequestSchema.parse(request.body);
        const addresseeId = input.userId;

        // Cannot send request to yourself
        if (userId === addresseeId) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Cannot send friend request to yourself')
            );
        }

        // Check if addressee exists
        const addressee = userModel.findById(addresseeId);
        if (!addressee) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
            );
        }

        // Check if blocked by the addressee
        if (friendshipModel.isBlockedBy(userId, addresseeId)) {
            return reply.status(403).send(
                errorResponse(ErrorCodes.FORBIDDEN, 'Cannot send friend request to this user')
            );
        }

        // Check existing relationship
        const existing = friendshipModel.findBetweenUsers(userId, addresseeId);
        if (existing) {
            if (existing.status === 'accepted') {
                return reply.status(400).send(
                    errorResponse(ErrorCodes.ALREADY_EXISTS, 'Already friends with this user')
                );
            }
            if (existing.status === 'pending') {
                // If they sent us a request, auto-accept
                if (existing.requester_id === addresseeId) {
                    friendshipModel.acceptRequest(existing.id, userId);
                    return reply.send(
                        successResponse({ status: 'accepted' }, 'Friend request accepted')
                    );
                }
                return reply.status(400).send(
                    errorResponse(ErrorCodes.ALREADY_EXISTS, 'Friend request already sent')
                );
            }
            if (existing.status === 'blocked') {
                return reply.status(403).send(
                    errorResponse(ErrorCodes.FORBIDDEN, 'Cannot send friend request to this user')
                );
            }
        }

        // Send request
        const friendship = friendshipModel.sendRequest(userId, addresseeId);
        if (!friendship) {
            return reply.status(500).send(
                errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to send friend request')
            );
        }

        return reply.status(201).send(
            successResponse({
                id: friendship.id,
                status: friendship.status,
                addressee: {
                    id: addressee.id,
                    display_name: addressee.display_name,
                    avatar_url: addressee.avatar_url,
                },
            }, 'Friend request sent')
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
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to send friend request')
        );
    }
};

/**
 * Accept friend request
 */
export const acceptFriendRequest = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const friendshipId = parseInt(request.params.id, 10);

        if (isNaN(friendshipId)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid friendship ID')
            );
        }

        const friendship = friendshipModel.findById(friendshipId);
        if (!friendship) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'Friend request not found')
            );
        }

        // Only addressee can accept
        if (friendship.addressee_id !== userId) {
            return reply.status(403).send(
                errorResponse(ErrorCodes.FORBIDDEN, 'Not authorized to accept this request')
            );
        }

        if (friendship.status !== 'pending') {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Request is not pending')
            );
        }

        const success = friendshipModel.acceptRequest(friendshipId, userId);
        if (!success) {
            return reply.status(500).send(
                errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to accept friend request')
            );
        }

        return reply.send(
            successResponse({ status: 'accepted' }, 'Friend request accepted')
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to accept friend request')
        );
    }
};

/**
 * Reject friend request
 */
export const rejectFriendRequest = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const friendshipId = parseInt(request.params.id, 10);

        if (isNaN(friendshipId)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid friendship ID')
            );
        }

        const friendship = friendshipModel.findById(friendshipId);
        if (!friendship) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'Friend request not found')
            );
        }

        // Only addressee can reject
        if (friendship.addressee_id !== userId) {
            return reply.status(403).send(
                errorResponse(ErrorCodes.FORBIDDEN, 'Not authorized to reject this request')
            );
        }

        if (friendship.status !== 'pending') {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Request is not pending')
            );
        }

        const success = friendshipModel.rejectRequest(friendshipId, userId);
        if (!success) {
            return reply.status(500).send(
                errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to reject friend request')
            );
        }

        return reply.send(
            successResponse(null, 'Friend request rejected')
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to reject friend request')
        );
    }
};

/**
 * Cancel sent friend request
 */
export const cancelFriendRequest = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const friendshipId = parseInt(request.params.id, 10);

        if (isNaN(friendshipId)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid friendship ID')
            );
        }

        const friendship = friendshipModel.findById(friendshipId);
        if (!friendship) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'Friend request not found')
            );
        }

        // Only requester can cancel
        if (friendship.requester_id !== userId) {
            return reply.status(403).send(
                errorResponse(ErrorCodes.FORBIDDEN, 'Not authorized to cancel this request')
            );
        }

        if (friendship.status !== 'pending') {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Request is not pending')
            );
        }

        // Delete the pending request
        const db = friendshipModel['db'];
        db.prepare('DELETE FROM friendships WHERE id = ?').run(friendshipId);

        return reply.send(
            successResponse(null, 'Friend request cancelled')
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to cancel friend request')
        );
    }
};

/**
 * Remove friend
 */
export const removeFriend = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const friendId = parseInt(request.params.id, 10);

        if (isNaN(friendId)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid user ID')
            );
        }

        const success = friendshipModel.removeFriendship(userId, friendId);
        if (!success) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'Friendship not found')
            );
        }

        return reply.send(
            successResponse(null, 'Friend removed')
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to remove friend')
        );
    }
};

/**
 * Get friends list
 */
export const getFriends = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const friends = friendshipModel.getFriends(userId);

        return reply.send(
            successResponse({
                friends: friends.map(f => ({
                    id: f.friend_id,
                    display_name: f.friend_display_name,
                    avatar_url: f.friend_avatar_url,
                    is_online: Boolean(f.friend_is_online),
                    friendship_id: f.id,
                    since: f.updated_at,
                })),
                count: friends.length,
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get friends')
        );
    }
};

/**
 * Get online friends
 */
export const getOnlineFriends = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const friends = friendshipModel.getOnlineFriends(userId);

        return reply.send(
            successResponse({
                friends: friends.map(f => ({
                    id: f.friend_id,
                    display_name: f.friend_display_name,
                    avatar_url: f.friend_avatar_url,
                    is_online: true,
                })),
                count: friends.length,
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get online friends')
        );
    }
};

/**
 * Get pending friend requests (received)
 */
export const getPendingRequests = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const requests = friendshipModel.getPendingRequests(userId);

        return reply.send(
            successResponse({
                requests: requests.map(r => ({
                    id: r.id,
                    from: {
                        id: r.friend_id,
                        display_name: r.friend_display_name,
                        avatar_url: r.friend_avatar_url,
                        is_online: Boolean(r.friend_is_online),
                    },
                    created_at: r.created_at,
                })),
                count: requests.length,
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get pending requests')
        );
    }
};

/**
 * Get sent friend requests
 */
export const getSentRequests = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const requests = friendshipModel.getSentRequests(userId);

        return reply.send(
            successResponse({
                requests: requests.map(r => ({
                    id: r.id,
                    to: {
                        id: r.friend_id,
                        display_name: r.friend_display_name,
                        avatar_url: r.friend_avatar_url,
                        is_online: Boolean(r.friend_is_online),
                    },
                    created_at: r.created_at,
                })),
                count: requests.length,
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get sent requests')
        );
    }
};

/**
 * Block a user
 */
export const blockUser = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const input = friendRequestSchema.parse(request.body);
        const blockedId = input.userId;

        // Cannot block yourself
        if (userId === blockedId) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Cannot block yourself')
            );
        }

        // Check if user exists
        const blockedUser = userModel.findById(blockedId);
        if (!blockedUser) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
            );
        }

        const success = friendshipModel.blockUser(userId, blockedId);
        if (!success) {
            return reply.status(500).send(
                errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to block user')
            );
        }

        return reply.send(
            successResponse(null, 'User blocked')
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
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to block user')
        );
    }
};

/**
 * Unblock a user
 */
export const unblockUser = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const blockedId = parseInt(request.params.id, 10);

        if (isNaN(blockedId)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid user ID')
            );
        }

        const success = friendshipModel.unblockUser(userId, blockedId);
        if (!success) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User is not blocked')
            );
        }

        return reply.send(
            successResponse(null, 'User unblocked')
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to unblock user')
        );
    }
};

/**
 * Get blocked users
 */
export const getBlockedUsers = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const blocked = friendshipModel.getBlockedUsers(userId);

        return reply.send(
            successResponse({
                blocked: blocked.map(b => ({
                    id: b.friend_id,
                    display_name: b.friend_display_name,
                    avatar_url: b.friend_avatar_url,
                    blocked_at: b.created_at,
                })),
                count: blocked.length,
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get blocked users')
        );
    }
};

/**
 * Check friendship status with another user
 */
export const getFriendshipStatus = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = request.user.id;
        const otherId = parseInt(request.params.id, 10);

        if (isNaN(otherId)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid user ID')
            );
        }

        if (userId === otherId) {
            return reply.send(successResponse({ status: 'self' }));
        }

        const friendship = friendshipModel.findBetweenUsers(userId, otherId);

        if (!friendship) {
            return reply.send(successResponse({ status: 'none' }));
        }

        let status: string = friendship.status;

        // Add direction info for pending requests
        if (friendship.status === 'pending') {
            status = friendship.requester_id === userId ? 'pending_sent' : 'pending_received';
        }

        // Check if we're blocked or blocking
        if (friendship.status === 'blocked') {
            status = friendship.requester_id === userId ? 'blocking' : 'blocked';
        }

        return reply.send(
            successResponse({
                status,
                friendship_id: friendship.id,
                since: friendship.status === 'accepted' ? friendship.updated_at : undefined,
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get friendship status')
        );
    }
};
