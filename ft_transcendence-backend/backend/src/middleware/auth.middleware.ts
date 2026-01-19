import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { extractTokenFromHeader, verifyJwtToken } from '../services/jwt.service.js';
import { userModel } from '../models/user.model.js';
import { errorResponse, ErrorCodes } from '../utils/response.js';

/**
 * Extend FastifyRequest to include user
 */
declare module 'fastify' {
    interface FastifyRequest {
        user: {
            id: number;
            email: string;
            displayName: string;
        };
    }
}

/**
 * Authentication middleware - requires valid JWT
 */
export const authenticate = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    const token = extractTokenFromHeader(request);

    if (!token) {
        return reply.status(401).send(
            errorResponse(ErrorCodes.UNAUTHORIZED, 'Authorization token required')
        );
    }

    const server = request.server as FastifyInstance;
    const payload = verifyJwtToken(server, token);

    if (!payload) {
        return reply.status(401).send(
            errorResponse(ErrorCodes.TOKEN_INVALID, 'Invalid or expired token')
        );
    }

    if (payload.type !== 'access') {
        return reply.status(401).send(
            errorResponse(ErrorCodes.TOKEN_INVALID, 'Invalid token type')
        );
    }

    // Verify user still exists and is not anonymized
    const user = userModel.findById(payload.userId);
    if (!user) {
        return reply.status(401).send(
            errorResponse(ErrorCodes.UNAUTHORIZED, 'User not found')
        );
    }

    // Update last_seen_at for online status tracking
    userModel.update(payload.userId, {
        last_seen_at: new Date().toISOString(),
    });

    // Attach user to request
    request.user = {
        id: payload.userId,
        email: payload.email,
        displayName: payload.displayName,
    };
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
    request: FastifyRequest,
    _reply: FastifyReply
): Promise<void> => {
    const token = extractTokenFromHeader(request);

    if (!token) {
        return;
    }

    const server = request.server as FastifyInstance;
    const payload = verifyJwtToken(server, token);

    if (payload && payload.type === 'access') {
        const user = userModel.findById(payload.userId);
        if (user) {
            request.user = {
                id: payload.userId,
                email: payload.email,
                displayName: payload.displayName,
            };
        }
    }
};

/**
 * Check if user is authenticated (for use in route handlers)
 */
export const isAuthenticated = (request: FastifyRequest): boolean => {
    return request.user !== undefined;
};

/**
 * Get current user ID (throws if not authenticated)
 */
export const getCurrentUserId = (request: FastifyRequest): number => {
    if (!request.user) {
        throw new Error('User not authenticated');
    }
    return request.user.id;
};
