"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("./api");
const db_1 = require("./db");
db_1.db.query(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER NOT NULL
  )
`);
api_1.api.post('/users', (req, res) => {
    const { name, age } = req.body;
    const id = db_1.db.insert('INSERT INTO users (name, age) VALUES (?, ?)', [name, age]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ id: id }));
});
api_1.api.get('/users', (req, res) => {
    const users = db_1.db.fetchAll('SELECT * FROM users');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(users));
});
api_1.api.listen(3000, () => {
    console.log("🚀 API running on http://localhost:3000");
});
