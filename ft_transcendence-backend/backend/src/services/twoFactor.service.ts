import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { env } from '../config/env.js';
import { randomBytes } from 'crypto';

/**
 * TOTP configuration
 */
authenticator.options = {
    digits: 6,
    step: 30, // 30 seconds
    window: 1, // Allow 1 step before/after for clock drift
};

/**
 * 2FA setup result
 */
export interface TwoFactorSetupResult {
    secret: string;
    otpAuthUrl: string;
    qrCodeDataUrl: string;
    backupCodes: string[];
}

/**
 * Generate a new TOTP secret
 */
export const generateTwoFactorSecret = (): string => {
    return authenticator.generateSecret();
};

/**
 * Generate OTP Auth URL for authenticator apps
 */
export const generateOtpAuthUrl = (email: string, secret: string): string => {
    return authenticator.keyuri(email, env.twoFactor.issuer, secret);
};

/**
 * Generate QR code as data URL
 */
export const generateQrCode = async (otpAuthUrl: string): Promise<string> => {
    try {
        return await QRCode.toDataURL(otpAuthUrl, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            margin: 2,
            width: 256,
        });
    } catch (error) {
        throw new Error('Failed to generate QR code');
    }
};

/**
 * Generate backup codes
 */
export const generateBackupCodes = (count: number = 10): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
        // Generate 8-character alphanumeric code
        const code = randomBytes(4).toString('hex').toUpperCase();
        // Format as XXXX-XXXX
        codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    return codes;
};

/**
 * Verify TOTP code
 */
export const verifyTotpCode = (code: string, secret: string): boolean => {
    try {
        return authenticator.verify({ token: code, secret });
    } catch {
        return false;
    }
};

/**
 * Verify backup code
 */
export const verifyBackupCode = (
    code: string,
    hashedBackupCodes: string[],
    verifyFn: (plain: string, hash: string) => Promise<boolean>
): Promise<{ valid: boolean; usedIndex: number }> => {
    return new Promise(async (resolve) => {
        const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const formattedCode = `${normalizedCode.slice(0, 4)}-${normalizedCode.slice(4)}`;

        for (let i = 0; i < hashedBackupCodes.length; i++) {
            if (await verifyFn(formattedCode, hashedBackupCodes[i])) {
                resolve({ valid: true, usedIndex: i });
                return;
            }
        }
        resolve({ valid: false, usedIndex: -1 });
    });
};

/**
 * Complete 2FA setup - generates everything needed
 */
export const setupTwoFactor = async (email: string): Promise<TwoFactorSetupResult> => {
    const secret = generateTwoFactorSecret();
    const otpAuthUrl = generateOtpAuthUrl(email, secret);
    const qrCodeDataUrl = await generateQrCode(otpAuthUrl);
    const backupCodes = generateBackupCodes();

    return {
        secret,
        otpAuthUrl,
        qrCodeDataUrl,
        backupCodes,
    };
};

/**
 * Validate TOTP code format
 */
export const isValidTotpFormat = (code: string): boolean => {
    return /^\d{6}$/.test(code);
};

/**
 * Validate backup code format
 */
export const isValidBackupCodeFormat = (code: string): boolean => {
    // Accept formats: XXXXXXXX, XXXX-XXXX, XXXX XXXX
    const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return /^[A-F0-9]{8}$/.test(normalized);
};
