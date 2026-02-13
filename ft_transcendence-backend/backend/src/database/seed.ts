import { getDatabase, closeDatabase } from '../config/database.js';
import { hash } from 'bcrypt';
import { env } from '../config/env.js';

/**
 * Seed the database with initial development data
 */
const seed = async (): Promise<void> => {
    const db = getDatabase();

    console.log('🌱 Seeding database...');

    // Check if users already exist
    const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    if (existingUsers.count > 0) {
        console.log('⚠️  Database already has data, skipping seed');
        return;
    }

    // Create password hash for test users
    const passwordHash = await hash('Test1234!', env.bcryptSaltRounds);

    // Insert test users
    const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, display_name, avatar_url, is_online)
    VALUES (?, ?, ?, ?, ?)
  `);

    const users = [
        { email: 'alice@test.com', display_name: 'Alice', avatar_url: 'default-avatar.png', is_online: 1 },
        { email: 'bob@test.com', display_name: 'Bob', avatar_url: 'default-avatar.png', is_online: 1 },
        { email: 'charlie@test.com', display_name: 'Charlie', avatar_url: 'default-avatar.png', is_online: 0 },
        { email: 'diana@test.com', display_name: 'Diana', avatar_url: 'default-avatar.png', is_online: 0 },
        { email: 'eve@test.com', display_name: 'Eve', avatar_url: 'default-avatar.png', is_online: 1 },
    ];

    const insertMany = db.transaction(() => {
        for (const user of users) {
            insertUser.run(user.email, passwordHash, user.display_name, user.avatar_url, user.is_online);
        }
    });

    insertMany();
    console.log(`✅ Created ${users.length} test users`);

    // Create some friendships
    const insertFriendship = db.prepare(`
    INSERT INTO friendships (requester_id, addressee_id, status)
    VALUES (?, ?, ?)
  `);

    const friendships = [
        { requester_id: 1, addressee_id: 2, status: 'accepted' },
        { requester_id: 1, addressee_id: 3, status: 'accepted' },
        { requester_id: 2, addressee_id: 4, status: 'pending' },
        { requester_id: 5, addressee_id: 1, status: 'pending' },
    ];

    const insertFriendships = db.transaction(() => {
        for (const f of friendships) {
            insertFriendship.run(f.requester_id, f.addressee_id, f.status);
        }
    });

    insertFriendships();
    console.log(`✅ Created ${friendships.length} friendships`);

    // Create some match history
    const insertMatch = db.prepare(`
    INSERT INTO match_history (player1_id, player2_id, player1_score, player2_score, winner_id, game_type, duration_seconds)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

    const matches = [
        { player1_id: 1, player2_id: 2, player1_score: 11, player2_score: 7, winner_id: 1, game_type: 'pong', duration: 180 },
        { player1_id: 2, player2_id: 1, player1_score: 11, player2_score: 9, winner_id: 2, game_type: 'pong', duration: 210 },
        { player1_id: 1, player2_id: 3, player1_score: 11, player2_score: 5, winner_id: 1, game_type: 'pong', duration: 150 },
        { player1_id: 3, player2_id: 4, player1_score: 11, player2_score: 11, winner_id: null, game_type: 'pong', duration: 240 },
        { player1_id: 2, player2_id: 5, player1_score: 8, player2_score: 11, winner_id: 5, game_type: 'pong', duration: 195 },
        { player1_id: 1, player2_id: 5, player1_score: 11, player2_score: 3, winner_id: 1, game_type: 'tournament', duration: 120 },
    ];

    const insertMatches = db.transaction(() => {
        for (const m of matches) {
            insertMatch.run(m.player1_id, m.player2_id, m.player1_score, m.player2_score, m.winner_id, m.game_type, m.duration);
        }
    });

    insertMatches();
    console.log(`✅ Created ${matches.length} match records`);

    console.log('🌱 Seeding completed!');
};

// Run seed
seed()
    .then(() => closeDatabase())
    .catch((err) => {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    });
