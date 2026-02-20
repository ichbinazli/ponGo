import { createWriteStream, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { randomBytes } from 'crypto';
import { env } from '../config/env.js';

/**
 * Allowed image MIME types for avatar uploads
 */
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
];

/**
 * File extension mapping
 */
const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
};

/**
 * Upload result interface
 */
export interface UploadResult {
    filename: string;
    path: string;
    url: string;
    size: number;
    mimeType: string;
}

/**
 * Upload error class
 */
export class UploadError extends Error {
    constructor(
        message: string,
        public code: string
    ) {
        super(message);
        this.name = 'UploadError';
    }
}

/**
 * Ensure upload directory exists
 */
const ensureUploadDir = (subdir: string): string => {
    const uploadPath = join(process.cwd(), env.upload.dir, subdir);
    if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
    }
    return uploadPath;
};

/**
 * Generate unique filename
 */
const generateFilename = (userId: number, mimeType: string): string => {
    const ext = MIME_TO_EXT[mimeType] || '.jpg';
    const uniqueId = randomBytes(8).toString('hex');
    return `${userId}_${uniqueId}${ext}`;
};

/**
 * Validate file upload
 */
export const validateUpload = (
    mimeType: string,
    fileSize: number
): void => {
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        throw new UploadError(
            `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
            'INVALID_FILE_TYPE'
        );
    }

    // Check file size
    if (fileSize > env.upload.maxFileSize) {
        throw new UploadError(
            `File too large. Maximum size: ${env.upload.maxFileSize / 1024 / 1024}MB`,
            'FILE_TOO_LARGE'
        );
    }
};

/**
 * Save avatar file
 */
export const saveAvatar = async (
    userId: number,
    fileStream: NodeJS.ReadableStream,
    mimeType: string,
    fileSize: number
): Promise<UploadResult> => {
    // Validate upload
    validateUpload(mimeType, fileSize);

    // Ensure directory exists
    const uploadDir = ensureUploadDir('avatars');

    // Generate unique filename
    const filename = generateFilename(userId, mimeType);
    const filepath = join(uploadDir, filename);

    // Save file using stream
    const writeStream = createWriteStream(filepath);

    try {
        await pipeline(fileStream, writeStream);
    } catch (error) {
        // Clean up on error
        if (existsSync(filepath)) {
            unlinkSync(filepath);
        }
        throw new UploadError('Failed to save file', 'UPLOAD_FAILED');
    }

    return {
        filename,
        path: filepath,
        url: `/uploads/avatars/${filename}`,
        size: fileSize,
        mimeType,
    };
};

/**
 * Delete avatar file
 */
export const deleteAvatar = (filename: string): boolean => {
    if (!filename || filename === 'default-avatar.png') {
        return false;
    }

    // Don't try to delete external URLs
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
        return false;
    }

    const filepath = join(process.cwd(), env.upload.dir, 'avatars', filename);

    if (existsSync(filepath)) {
        try {
            unlinkSync(filepath);
            return true;
        } catch {
            return false;
        }
    }

    return false;
};

/**
 * Get avatar URL from filename
 */
export const getAvatarUrl = (filename: string): string => {
    if (!filename) {
        return '/uploads/avatars/default-avatar.png';
    }
    // External URLs (e.g. 42 CDN) should be returned as-is
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
        return filename;
    }
    return `/uploads/avatars/${filename}`;
};
