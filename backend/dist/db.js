"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.DB = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class DB {
    constructor(filePath = 'data.db') {
        // Veritabanı dosya yolu
        const fullPath = path_1.default.resolve(__dirname, filePath);
        // Dosya yoksa boş bir dosya oluştur (OneDrive gibi sorunlarda garanti)
        if (!fs_1.default.existsSync(fullPath)) {
            fs_1.default.writeFileSync(fullPath, '');
        }
        try {
            this.db = new better_sqlite3_1.default(fullPath);
        }
        catch (err) {
            console.error('Failed to open database:', err);
            throw err; // açılmazsa dur
        }
    }
    ensureOpen() {
        if (!this.db) {
            throw new Error('Database connection is not open');
        }
        return this.db;
    }
    query(sql, params = []) {
        return this.ensureOpen().prepare(sql).run(...params);
    }
    fetch(sql, params = []) {
        return this.ensureOpen().prepare(sql).get(...params);
    }
    fetchAll(sql, params = []) {
        return this.ensureOpen().prepare(sql).all(...params);
    }
    insert(sql, params = []) {
        const info = this.ensureOpen().prepare(sql).run(...params);
        return info.lastInsertRowid;
    }
    update(sql, params = []) {
        const info = this.ensureOpen().prepare(sql).run(...params);
        return info.changes;
    }
    delete(sql, params = []) {
        const info = this.ensureOpen().prepare(sql).run(...params);
        return info.changes;
    }
    close() {
        if (this.db) {
            this.db.close();
        }
    }
}
exports.DB = DB;
// Singleton olarak kullanılabilir
exports.db = new DB();
