import { getDatabase, closeDatabase } from '../config/database.js';
import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Migration {
    id: number;
    name: string;
    executed_at: string;
}

/**
 * Run all pending migrations
 */
export const runMigrations = async (): Promise<void> => {
    const db = getDatabase();

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
        .all() as Migration[];
    const executedNames = new Set(executedMigrations.map((m) => m.name));

    // Get migration files
    const migrationsPath = join(__dirname, 'migrations');
    let migrationFiles: string[] = [];

    try {
        migrationFiles = readdirSync(migrationsPath)
            .filter((f) => f.endsWith('.sql'))
            .sort();
    } catch {
        console.log('📁 No migrations directory found, creating...');
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

/**
 * Rollback last migration
 */
export const rollbackMigration = async (): Promise<void> => {
    const db = getDatabase();

    const lastMigration = db
        .prepare('SELECT name FROM migrations ORDER BY id DESC LIMIT 1')
        .get() as Migration | undefined;

    if (!lastMigration) {
        console.log('No migrations to rollback');
        return;
    }

    console.log(`🔄 Rolling back: ${lastMigration.name}`);

    // Look for down migration file
    const downFile = lastMigration.name.replace('.sql', '.down.sql');
    const migrationsPath = join(__dirname, 'migrations');

    try {
        const sql = readFileSync(join(migrationsPath, downFile), 'utf-8');
        db.exec(sql);
        db.prepare('DELETE FROM migrations WHERE name = ?').run(lastMigration.name);
        console.log(`✅ Rolled back: ${lastMigration.name}`);
    } catch {
        console.error(`❌ No rollback file found: ${downFile}`);
    }
};

// Run if executed directly
const args = process.argv.slice(2);

if (args.includes('--rollback')) {
    rollbackMigration()
        .then(() => closeDatabase())
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
} else {
    runMigrations()
        .then(() => closeDatabase())
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}
