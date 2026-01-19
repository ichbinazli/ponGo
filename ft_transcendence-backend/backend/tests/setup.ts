/**
 * Test Setup - Global test utilities and configuration
 */

import Fastify, { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, unlinkSync, readFileSync, readdirSync } from 'fs';

// Test database path
const TEST_DB_PATH = join(process.cwd(), 'test.db');

// Global test database instance
let testDb: Database.Database | null = null;

/**
 * Create a fresh test database with all migrations
 */
export const createTestDatabase = (): Database.Database => {
    // Remove existing test database
    if (existsSync(TEST_DB_PATH)) {
        unlinkSync(TEST_DB_PATH);
    }

    // Create new database
    const db = new Database(TEST_DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Run migrations
    const migrationsDir = join(process.cwd(), 'database', 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

    for (const file of migrationFiles) {
        const sql = readFileSync(join(migrationsDir, file), 'utf-8');
        db.exec(sql);
    }

    testDb = db;
    return db;
};

/**
 * Get the test database instance
 */
export const getTestDatabase = (): Database.Database => {
    if (!testDb) {
        throw new Error('Test database not initialized. Call createTestDatabase first.');
    }
    return testDb;
};

/**
 * Close and cleanup test database
 */
export const closeTestDatabase = (): void => {
    if (testDb) {
        testDb.close();
        testDb = null;
    }
    if (existsSync(TEST_DB_PATH)) {
        unlinkSync(TEST_DB_PATH);
    }
};

/**
 * Clear all data from test database (keep schema)
 */
export const clearTestDatabase = (): void => {
    const db = getTestDatabase();

    // Disable foreign keys temporarily
    db.pragma('foreign_keys = OFF');

    // Get all table names
    const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all() as { name: string }[];

    // Delete data from each table
    for (const { name } of tables) {
        db.exec(`DELETE FROM ${name}`);
    }

    // Re-enable foreign keys
    db.pragma('foreign_keys = ON');
};

/**
 * Create a test Fastify instance
 */
export const createTestServer = async (): Promise<FastifyInstance> => {
    const server = Fastify({
        logger: false, // Disable logging in tests
    });

    return server;
};

/**
 * Test user data factory
 */
export const createTestUser = (overrides: Partial<TestUser> = {}): TestUser => ({
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
    displayName: `TestUser${Date.now()}`,
    ...overrides,
});

export interface TestUser {
    email: string;
    password: string;
    displayName: string;
}

/**
 * Generate random string for unique test data
 */
export const randomString = (length = 8): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Wait for async operations
 */
export const wait = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));
