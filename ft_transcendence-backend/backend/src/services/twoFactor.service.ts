import { randomInt } from 'crypto';

/**
 * In-memory store for verification codes
 * Key: string identifier (userId or email), Value: { code, expiresAt }
 */
interface PendingCode {
    code: string;
    expiresAt: number;
    attempts: number;
}

const pendingCodes = new Map<string, PendingCode>();

// Clean up expired codes every 60 seconds
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of pendingCodes) {
        if (data.expiresAt < now) {
            pendingCodes.delete(key);
        }
    }
}, 60000);

/**
 * Generate a 6-digit verification code
 */
export const generateVerificationCode = (): string => {
    // Generate a random number between 100000 and 999999
    return randomInt(100000, 999999).toString();
};

/**
 * Store a verification code for a given key (userId or email)
 * @param key - unique identifier (e.g. `2fa:${userId}` or `reset:${email}`)
 * @param code - 6-digit code
 * @param ttlMinutes - time to live in minutes (default 5)
 */
export const storeVerificationCode = (
    key: string,
    code: string,
    ttlMinutes: number = 5
): void => {
    pendingCodes.set(key, {
        code,
        expiresAt: Date.now() + ttlMinutes * 60 * 1000,
        attempts: 0,
    });
};

/**
 * Verify a code against the stored one
 * Returns true if code is valid, false otherwise
 * The code is deleted after successful verification
 */
export const verifyCode = (key: string, code: string): boolean => {
    const pending = pendingCodes.get(key);

    if (!pending) {
        return false;
    }

    // Check expiry
    if (pending.expiresAt < Date.now()) {
        pendingCodes.delete(key);
        return false;
    }

    // Limit attempts to prevent brute force (max 5 tries)
    pending.attempts++;
    if (pending.attempts > 5) {
        pendingCodes.delete(key);
        return false;
    }

    // Verify code
    if (pending.code === code) {
        pendingCodes.delete(key); // One-time use
        return true;
    }

    return false;
};

/**
 * Check if a code exists and is still valid (without consuming it)
 */
export const hasValidCode = (key: string): boolean => {
    const pending = pendingCodes.get(key);
    if (!pending) return false;
    if (pending.expiresAt < Date.now()) {
        pendingCodes.delete(key);
        return false;
    }
    return true;
};

/**
 * Remove a pending code
 */
export const removeCode = (key: string): void => {
    pendingCodes.delete(key);
};
