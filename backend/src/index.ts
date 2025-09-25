import { api } from "./api";
import { db as database } from './db';
import { response } from "./response";

database.query(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER NOT NULL
  )
`);

api.post('/users', (req, res) => {
    const { name, age } = req.body;
    const id = database.insert('INSERT INTO users (name, age) VALUES (?, ?)', [name, age]);
    response(res, {
        title: "User Created",
        message: "User has been created successfully",
        data: { id: id },
    })
});

api.get('/users', (req, res) => {
    const users = database.fetchAll('SELECT * FROM users');
    response(res, {
        title: "Users Fetched",
        message: "Users have been fetched successfully",
        data: users,
    });
});


api.listen(3000, () => {
  console.log("🚀 API running on http://localhost:3000");
});

