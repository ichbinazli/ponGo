import { getDatabase } from '../config/database.js';

/**
 * Friendship status types
 */
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

/**
 * Friendship model interface
 */
export interface Friendship {
    id: number;
    requester_id: number;
    addressee_id: number;
    status: FriendshipStatus;
    created_at: string;
    updated_at: string;
}

/**
 * Friend with user info
 */
export interface FriendWithInfo extends Friendship {
    friend_id: number;
    friend_display_name: string;
    friend_avatar_url: string;
    friend_is_online: boolean;
}

/**
 * Friendship model class
 */
export class FriendshipModel {
    private db = getDatabase();

    /**
     * Send friend request
     */
    sendRequest(requesterId: number, addresseeId: number): Friendship | null {
        // Check if friendship already exists
        const existing = this.findBetweenUsers(requesterId, addresseeId);
        if (existing) {
            return null; // Already exists
        }

        const stmt = this.db.prepare(`
      INSERT INTO friendships (requester_id, addressee_id, status)
      VALUES (?, ?, 'pending')
    `);

        try {
            const result = stmt.run(requesterId, addresseeId);
            return this.findById(result.lastInsertRowid as number)!;
        } catch {
            return null;
        }
    }

    /**
     * Find friendship by ID
     */
    findById(id: number): Friendship | undefined {
        return this.db
            .prepare('SELECT * FROM friendships WHERE id = ?')
            .get(id) as Friendship | undefined;
    }

    /**
     * Find friendship between two users
     */
    findBetweenUsers(userId1: number, userId2: number): Friendship | undefined {
        return this.db
            .prepare(
                `SELECT * FROM friendships 
       WHERE (requester_id = ? AND addressee_id = ?) 
          OR (requester_id = ? AND addressee_id = ?)`
            )
            .get(userId1, userId2, userId2, userId1) as Friendship | undefined;
    }

    /**
     * Accept friend request
     */
    acceptRequest(friendshipId: number, userId: number): boolean {
        // Only the addressee can accept
        const result = this.db
            .prepare(
                `UPDATE friendships 
       SET status = 'accepted' 
       WHERE id = ? AND addressee_id = ? AND status = 'pending'`
            )
            .run(friendshipId, userId);
        return result.changes > 0;
    }

    /**
     * Reject/decline friend request
     */
    rejectRequest(friendshipId: number, userId: number): boolean {
        // Only the addressee can reject
        const result = this.db
            .prepare(
                `DELETE FROM friendships 
       WHERE id = ? AND addressee_id = ? AND status = 'pending'`
            )
            .run(friendshipId, userId);
        return result.changes > 0;
    }

    /**
     * Block a user
     */
    blockUser(blockerId: number, blockedId: number): boolean {
        // Remove any existing friendship first
        this.db
            .prepare(
                `DELETE FROM friendships 
       WHERE (requester_id = ? AND addressee_id = ?) 
          OR (requester_id = ? AND addressee_id = ?)`
            )
            .run(blockerId, blockedId, blockedId, blockerId);

        // Create blocked relationship
        try {
            this.db
                .prepare(
                    `INSERT INTO friendships (requester_id, addressee_id, status) 
         VALUES (?, ?, 'blocked')`
                )
                .run(blockerId, blockedId);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Unblock a user
     */
    unblockUser(blockerId: number, blockedId: number): boolean {
        const result = this.db
            .prepare(
                `DELETE FROM friendships 
       WHERE requester_id = ? AND addressee_id = ? AND status = 'blocked'`
            )
            .run(blockerId, blockedId);
        return result.changes > 0;
    }

    /**
     * Remove friendship
     */
    removeFriendship(userId: number, friendId: number): boolean {
        const result = this.db
            .prepare(
                `DELETE FROM friendships 
       WHERE ((requester_id = ? AND addressee_id = ?) 
          OR (requester_id = ? AND addressee_id = ?))
         AND status = 'accepted'`
            )
            .run(userId, friendId, friendId, userId);
        return result.changes > 0;
    }

    /**
     * Get all friends for a user
     */
    getFriends(userId: number): FriendWithInfo[] {
        return this.db
            .prepare(
                `SELECT 
        f.*,
        CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END as friend_id,
        u.display_name as friend_display_name,
        u.avatar_url as friend_avatar_url,
        u.is_online as friend_is_online
      FROM friendships f
      JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END
      WHERE (f.requester_id = ? OR f.addressee_id = ?) 
        AND f.status = 'accepted'
        AND u.anonymized = 0
      ORDER BY u.is_online DESC, u.display_name ASC`
            )
            .all(userId, userId, userId, userId) as FriendWithInfo[];
    }

    /**
     * Get pending friend requests received
     */
    getPendingRequests(userId: number): FriendWithInfo[] {
        return this.db
            .prepare(
                `SELECT 
        f.*,
        f.requester_id as friend_id,
        u.display_name as friend_display_name,
        u.avatar_url as friend_avatar_url,
        u.is_online as friend_is_online
      FROM friendships f
      JOIN users u ON u.id = f.requester_id
      WHERE f.addressee_id = ? AND f.status = 'pending' AND u.anonymized = 0
      ORDER BY f.created_at DESC`
            )
            .all(userId) as FriendWithInfo[];
    }

    /**
     * Get sent friend requests
     */
    getSentRequests(userId: number): FriendWithInfo[] {
        return this.db
            .prepare(
                `SELECT 
        f.*,
        f.addressee_id as friend_id,
        u.display_name as friend_display_name,
        u.avatar_url as friend_avatar_url,
        u.is_online as friend_is_online
      FROM friendships f
      JOIN users u ON u.id = f.addressee_id
      WHERE f.requester_id = ? AND f.status = 'pending' AND u.anonymized = 0
      ORDER BY f.created_at DESC`
            )
            .all(userId) as FriendWithInfo[];
    }

    /**
     * Get blocked users
     */
    getBlockedUsers(userId: number): FriendWithInfo[] {
        return this.db
            .prepare(
                `SELECT 
        f.*,
        f.addressee_id as friend_id,
        u.display_name as friend_display_name,
        u.avatar_url as friend_avatar_url,
        u.is_online as friend_is_online
      FROM friendships f
      JOIN users u ON u.id = f.addressee_id
      WHERE f.requester_id = ? AND f.status = 'blocked' AND u.anonymized = 0
      ORDER BY f.created_at DESC`
            )
            .all(userId) as FriendWithInfo[];
    }

    /**
     * Get online friends
     */
    getOnlineFriends(userId: number): FriendWithInfo[] {
        return this.getFriends(userId).filter((f) => f.friend_is_online);
    }

    /**
     * Check if users are friends
     */
    areFriends(userId1: number, userId2: number): boolean {
        const friendship = this.findBetweenUsers(userId1, userId2);
        return friendship?.status === 'accepted';
    }

    /**
     * Check if user is blocked by another user
     */
    isBlockedBy(userId: number, potentialBlockerId: number): boolean {
        const result = this.db
            .prepare(
                `SELECT 1 FROM friendships 
       WHERE requester_id = ? AND addressee_id = ? AND status = 'blocked'`
            )
            .get(potentialBlockerId, userId);
        return result !== undefined;
    }

    /**
     * Get friendship count for a user
     */
    getFriendCount(userId: number): number {
        const result = this.db
            .prepare(
                `SELECT COUNT(*) as count FROM friendships 
       WHERE (requester_id = ? OR addressee_id = ?) AND status = 'accepted'`
            )
            .get(userId, userId) as { count: number };
        return result.count;
    }

    /**
     * Delete all friendships for a user (GDPR)
     */
    deleteUserFriendships(userId: number): number {
        const result = this.db
            .prepare(
                `DELETE FROM friendships 
       WHERE requester_id = ? OR addressee_id = ?`
            )
            .run(userId, userId);
        return result.changes;
    }
}

// Export singleton instance
export const friendshipModel = new FriendshipModel();
