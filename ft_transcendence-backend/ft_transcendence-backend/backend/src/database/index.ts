import { getDatabase, closeDatabase } from '../config/database.js';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Initialize database with all migrations
 */
export const initializeDatabase = async (): Promise<void> => {
    const db = getDatabase();

    console.log('🔧 Initializing database...');

    // Create migrations tracking table
    db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Get executed migrations
    const executedMigrations = db
        .prepare('SELECT name FROM migrations')
        .all() as { name: string }[];
    const executedNames = new Set(executedMigrations.map((m) => m.name));

    // Migrations are in backend/database/migrations from project root
    // But when running from src/database, we need to go up
    const migrationsPath = join(__dirname, '../../database/migrations');
    let migrationFiles: string[] = [];

    try {
        migrationFiles = readdirSync(migrationsPath)
            .filter((f) => f.endsWith('.sql') && !f.includes('.down.'))
            .sort();
    } catch (err) {
        console.log('📁 Migrations path:', migrationsPath);
        console.error('❌ Could not read migrations directory:', err);
        return;
    }

    if (migrationFiles.length === 0) {
        console.log('⚠️  No migration files found');
        return;
    }

    // Run pending migrations
    let migrationsRun = 0;

    for (const file of migrationFiles) {
        if (executedNames.has(file)) {
            continue;
        }

        console.log(`🔄 Running migration: ${file}`);

        const sql = readFileSync(join(migrationsPath, file), 'utf-8');

        try {
            db.exec(sql);
            db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);
            migrationsRun++;
            console.log(`✅ Migration completed: ${file}`);
        } catch (error) {
            console.error(`❌ Migration failed: ${file}`, error);
            throw error;
        }
    }

    if (migrationsRun === 0) {
        console.log('✅ All migrations are up to date');
    } else {
        console.log(`✅ Ran ${migrationsRun} migration(s)`);
    }
};

// Export for use in app.ts
export { getDatabase, closeDatabase };
