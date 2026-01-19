import { z } from 'zod';

/**
 * Common validation schemas using Zod
 */

// Email validation
export const emailSchema = z
    .string()
    .email('Invalid email address')
    .min(5, 'Email too short')
    .max(255, 'Email too long')
    .toLowerCase()
    .trim();

// Password validation - strong password requirements
export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

// Display name validation
export const displayNameSchema = z
    .string()
    .min(3, 'Display name must be at least 3 characters')
    .max(32, 'Display name cannot exceed 32 characters')
    .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Display name can only contain letters, numbers, underscores, and hyphens'
    )
    .trim();

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

// Pagination validation
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Registration schema
export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    displayName: displayNameSchema,
});

// Login schema
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
    twoFactorCode: z.string().length(6).optional(),
});

// Update profile schema
export const updateProfileSchema = z.object({
    displayName: displayNameSchema.optional(),
    email: emailSchema.optional(),
});

// Change password schema
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
});

// 2FA setup schema
export const twoFactorSetupSchema = z.object({
    code: z.string().length(6, '2FA code must be 6 digits'),
});

// Friend request schema
export const friendRequestSchema = z.object({
    userId: z.coerce.number().int().positive(),
});

/**
 * Type inference helpers
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
