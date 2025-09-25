import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export class DB {
  private db: Database;

  constructor(filePath: string = 'data.db') {
    // Veritabanı dosya yolu
    const fullPath = path.resolve(__dirname, filePath);

    // Dosya yoksa boş bir dosya oluştur (OneDrive gibi sorunlarda garanti)
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, '');
    }

    try {
      this.db = new Database(fullPath);
    } catch (err) {
      console.error('Failed to open database:', err);
      throw err; // açılmazsa dur
    }
  }

  private ensureOpen(): Database {
    if (!this.db) {
      throw new Error('Database connection is not open');
    }
    return this.db;
  }

  query(sql: string, params: any[] = []): any {
    return this.ensureOpen().prepare(sql).run(...params);
  }

  fetch(sql: string, params: any[] = []): any {
    return this.ensureOpen().prepare(sql).get(...params);
  }

  fetchAll(sql: string, params: any[] = []): any[] {
    return this.ensureOpen().prepare(sql).all(...params);
  }

  insert(sql: string, params: any[] = []): number {
    const info = this.ensureOpen().prepare(sql).run(...params);
    return info.lastInsertRowid as number;
  }

  update(sql: string, params: any[] = []): number {
    const info = this.ensureOpen().prepare(sql).run(...params);
    return info.changes;
  }

  delete(sql: string, params: any[] = []): number {
    const info = this.ensureOpen().prepare(sql).run(...params);
    return info.changes;
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Singleton olarak kullanılabilir
export const db = new DB();
