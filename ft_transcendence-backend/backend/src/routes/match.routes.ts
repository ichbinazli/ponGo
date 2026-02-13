import { FastifyInstance } from 'fastify';
import { CreateMatchInput } from '../models/match.model.js';
import { matchController } from '../controllers/match.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

/**
 * Match routes
 * Handles match recording and retrieval
 */
export async function matchRoutes(fastify: FastifyInstance) {
    /**
     * Create a new match record
     * POST /api/matches
     * 
     * Requires authentication (SORUN 1 FIX)
     * İstek yapan kullanıcı player1 veya player2 olmalıdır (SORUN 2 FIX)
     * 
     * Body:
     * {
     *   "player1_id": 1,
     *   "player2_id": 2,
     *   "player1_score": 11,
     *   "player2_score": 7,
     *   "winner_id": 1,           // Optional, auto-calculated if not provided
     *   "game_type": "pong",      // Optional, default: "pong" | "tournament" | "ai" | "other"
     *   "tournament_id": null,    // Optional
     *   "duration_seconds": 180,  // Optional
     *   "started_at": "..."       // Optional, ISO 8601 format
     * }
     */
    fastify.post<{ Body: CreateMatchInput }>(
        '/',
        { preHandler: [authenticate] },
        matchController.createMatch.bind(matchController)
    );

    /**
     * Create an AI match record (shortcut)
     * POST /api/matches/ai
     * 
     * Requires authentication
     * Basitleştirilmiş endpoint — sadece gerekli bilgileri gönder, backend AI ataması yapar
     * 
     * Body:
     * {
     *   "player_id": 1,            // Oyuncunun ID'si (giriş yapan kullanıcı olmalı)
     *   "player_score": 11,        // Oyuncunun skoru
     *   "ai_score": 7,             // AI'nın skoru
     *   "duration_seconds": 120    // Optional
     * }
     */
    fastify.post<{ Body: { player_id: number; player_score: number; ai_score: number; duration_seconds?: number } }>(
        '/ai',
        { preHandler: [authenticate] },
        matchController.createAIMatch.bind(matchController)
    );

    /**
     * Get a match by ID
     * GET /api/matches/:id
     */
    fastify.get('/:id', matchController.getMatch.bind(matchController));

    /**
     * Get all matches with pagination
     * GET /api/matches?limit=20&offset=0
     */
    fastify.get('/', matchController.getMatches.bind(matchController));
}
