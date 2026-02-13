/**
 * Validators Tests
 */

import { describe, it, expect } from 'vitest';
import {
    emailSchema,
    passwordSchema,
    displayNameSchema,
    uuidSchema,
    paginationSchema,
} from '../../src/utils/validators.js';

describe('Validators', () => {
    describe('emailSchema', () => {
        it('should accept valid email', () => {
            const result = emailSchema.safeParse('test@example.com');
            expect(result.success).toBe(true);
        });

        it('should accept email with subdomain', () => {
            const result = emailSchema.safeParse('test@mail.example.com');
            expect(result.success).toBe(true);
        });

        it('should reject invalid email without @', () => {
            const result = emailSchema.safeParse('testexample.com');
            expect(result.success).toBe(false);
        });

        it('should reject email without domain', () => {
            const result = emailSchema.safeParse('test@');
            expect(result.success).toBe(false);
        });

        it('should trim and lowercase email', () => {
            const result = emailSchema.safeParse('  TEST@EXAMPLE.COM  ');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe('test@example.com');
            }
        });
    });

    describe('passwordSchema', () => {
        it('should accept strong password', () => {
            const result = passwordSchema.safeParse('SecurePass123!');
            expect(result.success).toBe(true);
        });

        it('should reject short password', () => {
            const result = passwordSchema.safeParse('Short1!');
            expect(result.success).toBe(false);
        });

        it('should accept password at minimum length', () => {
            const result = passwordSchema.safeParse('Secure1!');
            expect(result.success).toBe(true);
        });

        it('should reject empty password', () => {
            const result = passwordSchema.safeParse('');
            expect(result.success).toBe(false);
        });
    });

    describe('displayNameSchema', () => {
        it('should accept valid display name', () => {
            const result = displayNameSchema.safeParse('JohnDoe');
            expect(result.success).toBe(true);
        });

        it('should accept display name with numbers', () => {
            const result = displayNameSchema.safeParse('Player42');
            expect(result.success).toBe(true);
        });

        it('should accept display name with underscore', () => {
            const result = displayNameSchema.safeParse('John_Doe');
            expect(result.success).toBe(true);
        });

        it('should reject too short display name', () => {
            const result = displayNameSchema.safeParse('AB');
            expect(result.success).toBe(false);
        });

        it('should reject too long display name', () => {
            const result = displayNameSchema.safeParse('A'.repeat(21));
            expect(result.success).toBe(false);
        });

        it('should reject display name with special characters', () => {
            const result = displayNameSchema.safeParse('John@Doe');
            expect(result.success).toBe(false);
        });

        it('should trim whitespace', () => {
            const result = displayNameSchema.safeParse('  JohnDoe  ');
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toBe('JohnDoe');
            }
        });
    });

    describe('uuidSchema', () => {
        it('should accept valid UUID', () => {
            const result = uuidSchema.safeParse('123e4567-e89b-12d3-a456-426614174000');
            expect(result.success).toBe(true);
        });

        it('should reject invalid UUID format', () => {
            const result = uuidSchema.safeParse('not-a-uuid');
            expect(result.success).toBe(false);
        });

        it('should reject empty string', () => {
            const result = uuidSchema.safeParse('');
            expect(result.success).toBe(false);
        });
    });

    describe('paginationSchema', () => {
        it('should accept valid pagination', () => {
            const result = paginationSchema.safeParse({ page: 1, limit: 10 });
            expect(result.success).toBe(true);
        });

        it('should use default values', () => {
            const result = paginationSchema.safeParse({});
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.page).toBe(1);
                expect(result.data.limit).toBe(20);
            }
        });

        it('should reject page less than 1', () => {
            const result = paginationSchema.safeParse({ page: 0 });
            expect(result.success).toBe(false);
        });

        it('should reject negative limit', () => {
            const result = paginationSchema.safeParse({ limit: -1 });
            expect(result.success).toBe(false);
        });

        it('should cap limit at maximum', () => {
            const result = paginationSchema.safeParse({ limit: 200 });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.limit).toBeLessThanOrEqual(100);
            }
        });

        it('should coerce string to number', () => {
            const result = paginationSchema.safeParse({ page: '2', limit: '10' });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.page).toBe(2);
                expect(result.data.limit).toBe(10);
            }
        });
    });
});
