import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, env.bcryptSaltRounds);
};

/**
 * Verify a password against a hash
 */
export const verifyPassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

/**
 * Hash a token (for refresh tokens)
 */
export const hashToken = async (token: string): Promise<string> => {
    // Use fewer rounds for tokens since they're already random
    return bcrypt.hash(token, 10);
};

/**
 * Verify a token against a hash
 */
export const verifyToken = async (
    token: string,
    hash: string
): Promise<boolean> => {
    return bcrypt.compare(token, hash);
};
