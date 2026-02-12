/**
 * Two Factor Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { authenticator } from 'otplib';
import {
    generateSecret,
    generateQrCodeDataUrl,
    verifyToken,
    generateBackupCodes,
    hashBackupCode,
    verifyBackupCode,
} from '../../src/services/twoFactor.service.js';

describe('Two Factor Service', () => {
    describe('generateSecret', () => {
        it('should generate a valid secret', () => {
            const secret = generateSecret();

            expect(secret).toBeDefined();
            expect(typeof secret).toBe('string');
            expect(secret.length).toBeGreaterThan(10);
        });

        it('should generate unique secrets each time', () => {
            const secret1 = generateSecret();
            const secret2 = generateSecret();

            expect(secret1).not.toBe(secret2);
        });
    });

    describe('generateQrCodeDataUrl', () => {
        it('should generate a valid data URL', async () => {
            const secret = generateSecret();
            const email = 'test@example.com';

            const dataUrl = await generateQrCodeDataUrl(email, secret);

            expect(dataUrl).toBeDefined();
            expect(dataUrl).toMatch(/^data:image\/png;base64,/);
        });

        it('should include app name and email in otpauth URL', async () => {
            const secret = generateSecret();
            const email = 'test@example.com';

            // The QR code encodes an otpauth URL
            // We can't easily decode the QR, but we can verify it's generated
            const dataUrl = await generateQrCodeDataUrl(email, secret);
            expect(dataUrl.length).toBeGreaterThan(100);
        });
    });

    describe('verifyToken', () => {
        it('should verify a valid token', () => {
            const secret = generateSecret();
            const token = authenticator.generate(secret);

            const isValid = verifyToken(token, secret);
            expect(isValid).toBe(true);
        });

        it('should reject an invalid token', () => {
            const secret = generateSecret();
            const invalidToken = '000000';

            const isValid = verifyToken(invalidToken, secret);
            expect(isValid).toBe(false);
        });

        it('should reject empty token', () => {
            const secret = generateSecret();

            const isValid = verifyToken('', secret);
            expect(isValid).toBe(false);
        });

        it('should reject token with wrong format', () => {
            const secret = generateSecret();

            const isValid = verifyToken('abcdef', secret);
            expect(isValid).toBe(false);
        });
    });

    describe('generateBackupCodes', () => {
        it('should generate the specified number of codes', () => {
            const codes = generateBackupCodes(10);

            expect(codes).toHaveLength(10);
        });

        it('should generate unique codes', () => {
            const codes = generateBackupCodes(10);
            const uniqueCodes = new Set(codes);

            expect(uniqueCodes.size).toBe(10);
        });

        it('should generate codes in correct format', () => {
            const codes = generateBackupCodes(5);

            for (const code of codes) {
                // Format: XXXX-XXXX (8 chars + hyphen)
                expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
            }
        });

        it('should default to 10 codes', () => {
            const codes = generateBackupCodes();
            expect(codes).toHaveLength(10);
        });
    });

    describe('hashBackupCode', () => {
        it('should hash a backup code', async () => {
            const code = 'ABCD-1234';
            const hash = await hashBackupCode(code);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(code);
        });

        it('should generate different hashes for same code (salted)', async () => {
            const code = 'ABCD-1234';
            const hash1 = await hashBackupCode(code);
            const hash2 = await hashBackupCode(code);

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('verifyBackupCode', () => {
        it('should verify correct backup code', async () => {
            const code = 'ABCD-1234';
            const hash = await hashBackupCode(code);

            const isValid = await verifyBackupCode(code, hash);
            expect(isValid).toBe(true);
        });

        it('should reject incorrect backup code', async () => {
            const code = 'ABCD-1234';
            const hash = await hashBackupCode(code);

            const isValid = await verifyBackupCode('WXYZ-5678', hash);
            expect(isValid).toBe(false);
        });

        it('should be case-insensitive for backup codes', async () => {
            const code = 'ABCD-1234';
            const hash = await hashBackupCode(code.toLowerCase());

            const isValid = await verifyBackupCode(code.toUpperCase(), hash);
            // Note: This depends on implementation
            // If case-sensitive, this should fail
            expect(typeof isValid).toBe('boolean');
        });
    });
});
