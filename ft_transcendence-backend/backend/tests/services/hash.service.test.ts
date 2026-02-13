/**
 * Hash Service Tests
 */

import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, isPasswordStrong } from '../../src/services/hash.service.js';

describe('Hash Service', () => {
    describe('hashPassword', () => {
        it('should hash a password successfully', async () => {
            const password = 'SecurePassword123!';
            const hash = await hashPassword(password);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
        });

        it('should generate different hashes for the same password', async () => {
            const password = 'SecurePassword123!';
            const hash1 = await hashPassword(password);
            const hash2 = await hashPassword(password);

            expect(hash1).not.toBe(hash2); // Salts should make them different
        });

        it('should handle empty password', async () => {
            const hash = await hashPassword('');
            expect(hash).toBeDefined();
        });

        it('should handle very long passwords', async () => {
            const longPassword = 'A'.repeat(100);
            const hash = await hashPassword(longPassword);
            expect(hash).toBeDefined();
        });
    });

    describe('verifyPassword', () => {
        it('should verify correct password', async () => {
            const password = 'SecurePassword123!';
            const hash = await hashPassword(password);

            const isValid = await verifyPassword(password, hash);
            expect(isValid).toBe(true);
        });

        it('should reject incorrect password', async () => {
            const password = 'SecurePassword123!';
            const hash = await hashPassword(password);

            const isValid = await verifyPassword('WrongPassword123!', hash);
            expect(isValid).toBe(false);
        });

        it('should be case-sensitive', async () => {
            const password = 'SecurePassword123!';
            const hash = await hashPassword(password);

            const isValid = await verifyPassword('securepassword123!', hash);
            expect(isValid).toBe(false);
        });

        it('should reject empty password against valid hash', async () => {
            const password = 'SecurePassword123!';
            const hash = await hashPassword(password);

            const isValid = await verifyPassword('', hash);
            expect(isValid).toBe(false);
        });
    });

    describe('isPasswordStrong', () => {
        it('should accept strong password', () => {
            const result = isPasswordStrong('SecurePass123!');
            expect(result.isStrong).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject password without uppercase', () => {
            const result = isPasswordStrong('securepass123!');
            expect(result.isStrong).toBe(false);
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
        });

        it('should reject password without lowercase', () => {
            const result = isPasswordStrong('SECUREPASS123!');
            expect(result.isStrong).toBe(false);
            expect(result.errors).toContain('Password must contain at least one lowercase letter');
        });

        it('should reject password without number', () => {
            const result = isPasswordStrong('SecurePass!');
            expect(result.isStrong).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });

        it('should reject short password', () => {
            const result = isPasswordStrong('Sec1!');
            expect(result.isStrong).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters long');
        });

        it('should accumulate multiple errors', () => {
            const result = isPasswordStrong('weak');
            expect(result.isStrong).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });

        it('should accept password at minimum length', () => {
            const result = isPasswordStrong('Secure1!');
            expect(result.isStrong).toBe(true);
        });
    });
});
