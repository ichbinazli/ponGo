import { FastifyInstance, FastifyRequest } from 'fastify';
import jwt from '@fastify/jwt';
import { env } from '../config/env.js';
import { User } from '../models/user.model.js';
import { randomBytes } from 'crypto';

/**
 * JWT Payload interface
 */
export interface JwtPayload {
    userId: number;
    email: string;
    displayName: string;
    type: 'access' | 'refresh';
}

/**
 * Token pair interface
 */
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: Date;
    refreshTokenExpiresAt: Date;
}

/**
 * Parse duration string to milliseconds
 */
const parseDuration = (duration: string): number => {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
        throw new Error(`Invalid duration format: ${duration}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 's':
            return value * 1000;
        case 'm':
            return value * 60 * 1000;
        case 'h':
            return value * 60 * 60 * 1000;
        case 'd':
            return value * 24 * 60 * 60 * 1000;
        default:
            throw new Error(`Unknown duration unit: ${unit}`);
    }
};

/**
 * Register JWT plugin with Fastify
 */
export const registerJwtPlugin = async (server: FastifyInstance): Promise<void> => {
    await server.register(jwt, {
        secret: env.jwt.secret,
        sign: {
            expiresIn: env.jwt.accessExpiry,
        },
    });
};

/**
 * Generate access token
 */
export const generateAccessToken = (
    server: FastifyInstance,
    user: User
): string => {
    const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        displayName: user.display_name,
        type: 'access',
    };

    return server.jwt.sign(payload, {
        expiresIn: env.jwt.accessExpiry,
    });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (
    server: FastifyInstance,
    user: User
): string => {
    const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        displayName: user.display_name,
        type: 'refresh',
    };

    return server.jwt.sign(payload, {
        expiresIn: env.jwt.refreshExpiry,
    });
};

/**
 * Generate a random token for refresh token storage
 */
export const generateRandomToken = (): string => {
    return randomBytes(32).toString('hex');
};

/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = (
    server: FastifyInstance,
    user: User
): TokenPair => {
    const accessToken = generateAccessToken(server, user);
    const refreshToken = generateRefreshToken(server, user);

    const accessExpiresMs = parseDuration(env.jwt.accessExpiry);
    const refreshExpiresMs = parseDuration(env.jwt.refreshExpiry);

    return {
        accessToken,
        refreshToken,
        accessTokenExpiresAt: new Date(Date.now() + accessExpiresMs),
        refreshTokenExpiresAt: new Date(Date.now() + refreshExpiresMs),
    };
};

/**
 * Verify and decode a token
 */
export const verifyJwtToken = (
    server: FastifyInstance,
    token: string
): JwtPayload | null => {
    try {
        return server.jwt.verify<JwtPayload>(token);
    } catch {
        return null;
    }
};

/**
 * Decode token without verification (for expired tokens)
 */
export const decodeJwtToken = (
    server: FastifyInstance,
    token: string
): JwtPayload | null => {
    try {
        return server.jwt.decode<JwtPayload>(token);
    } catch {
        return null;
    }
};

/**
 * Get expiration date for refresh token
 */
export const getRefreshTokenExpiry = (): Date => {
    const expiresMs = parseDuration(env.jwt.refreshExpiry);
    return new Date(Date.now() + expiresMs);
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (
    request: FastifyRequest
): string | null => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
};
