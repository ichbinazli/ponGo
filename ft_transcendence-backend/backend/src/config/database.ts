import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { env } from './env.js';

let db: Database.Database | null = null;

/**
 * Initialize and get database connection
 */
export const getDatabase = (): Database.Database => {
    if (db) return db;

    // Ensure database directory exists
    const dbDir = dirname(env.databasePath);
    if (!existsSync(dbDir)) {
        mkdirSync(dbDir, { recursive: true });
    }

    // Create database connection
    db = new Database(env.databasePath, {
        verbose: env.isDevelopment ? console.log : undefined,
    });

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    console.log(`✅ Database connected: ${env.databasePath}`);

    return db;
};

/**
 * Close database connection
 */
export const closeDatabase = (): void => {
    if (db) {
        db.close();
        db = null;
        console.log('📦 Database connection closed');
    }
};

/**
 * Transaction wrapper
 */
export const transaction = <T>(fn: () => T): T => {
    const database = getDatabase();
    return database.transaction(fn)();
};

/**
 * Check if database is connected
 */
export const isDatabaseConnected = (): boolean => {
    return db !== null && db.open;
};

export { Database };
