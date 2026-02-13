import { FastifyRequest, FastifyReply } from 'fastify';
import {
    matchHistoryModel,
    CreateMatchInput,
    GameType,
} from '../models/match.model.js';
import { userModel } from '../models/user.model.js';
import { z } from 'zod';

// Validation schemas
const createMatchSchema = z.object({
    player1_id: z.number().int().positive(),
    player2_id: z.number().int().positive(),
    player1_score: z.number().int().min(0),
    player2_score: z.number().int().min(0),
    winner_id: z.number().int().positive().nullable().optional(),
    game_type: z.enum(['pong', 'tournament', 'ai', 'other']).default('pong'),
    tournament_id: z.number().int().positive().optional(),
    duration_seconds: z.number().int().positive().optional(),
    started_at: z.string().datetime().optional(),
});

// AI maç kaydı için basitleştirilmiş schema
const createAIMatchSchema = z.object({
    player_id: z.number().int().positive(),
    player_score: z.number().int().min(0),
    ai_score: z.number().int().min(0),
    duration_seconds: z.number().int().positive().optional(),
});

const getMatchesQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Match Controller
 * Handles match-related operations
 */
export class MatchController {
    /**
     * Create a new match record
     * POST /api/matches
     * 
     * Requires authentication. İstek yapan kullanıcı player1 veya player2 olmalıdır.
     */
    async createMatch(
        request: FastifyRequest<{ Body: CreateMatchInput }>,
        reply: FastifyReply
    ) {
        try {
            const validatedData = createMatchSchema.parse(request.body);

            // SORUN 2 FIX: İstek yapan kullanıcı maçın oyuncularından biri olmalı
            const userId = request.user.id;
            if (validatedData.game_type !== 'ai') {
                // PvP maçlarında player1 veya player2 giriş yapan kullanıcı olmalı
                if (validatedData.player1_id !== userId && validatedData.player2_id !== userId) {
                    return reply.status(403).send({
                        success: false,
                        error: {
                            code: 'FORBIDDEN',
                            message: 'You can only record your own matches',
                        },
                    });
                }

                // SORUN 3 FIX: Aynı oyuncu kendine karşı oynayamaz
                if (validatedData.player1_id === validatedData.player2_id) {
                    return reply.status(400).send({
                        success: false,
                        error: {
                            code: 'INVALID_PLAYERS',
                            message: 'Players must be different',
                        },
                    });
                }
            } else {
                // AI maçlarında da player1 giriş yapan kullanıcı olmalı
                if (validatedData.player1_id !== userId) {
                    return reply.status(403).send({
                        success: false,
                        error: {
                            code: 'FORBIDDEN',
                            message: 'You can only record your own matches',
                        },
                    });
                }
            }

            // Validate players exist
            const player1 = userModel.findById(validatedData.player1_id);
            if (!player1) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'PLAYER_NOT_FOUND',
                        message: `Player 1 with ID ${validatedData.player1_id} not found`,
                    },
                });
            }

            // AI maçlarında player2 otomatik atanır
            if (validatedData.game_type === 'ai') {
                const aiUser = userModel.getOrCreateAIUser();
                validatedData.player2_id = aiUser.id;
            }

            const player2 = userModel.findById(validatedData.player2_id);
            if (!player2) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'PLAYER_NOT_FOUND',
                        message: `Player 2 with ID ${validatedData.player2_id} not found`,
                    },
                });
            }

            // Validate winner_id if provided
            if (validatedData.winner_id !== null && validatedData.winner_id !== undefined) {
                if (
                    validatedData.winner_id !== validatedData.player1_id &&
                    validatedData.winner_id !== validatedData.player2_id
                ) {
                    return reply.status(400).send({
                        success: false,
                        error: {
                            code: 'INVALID_WINNER',
                            message: 'Winner must be one of the players',
                        },
                    });
                }
            }

            // Auto-determine winner if not provided
            let winnerId = validatedData.winner_id;
            if (winnerId === undefined) {
                if (validatedData.player1_score > validatedData.player2_score) {
                    winnerId = validatedData.player1_id;
                } else if (validatedData.player2_score > validatedData.player1_score) {
                    winnerId = validatedData.player2_id;
                } else {
                    winnerId = null; // Draw
                }
            }

            // Create match
            const match = matchHistoryModel.create({
                player1_id: validatedData.player1_id,
                player2_id: validatedData.player2_id,
                player1_score: validatedData.player1_score,
                player2_score: validatedData.player2_score,
                winner_id: winnerId,
                game_type: validatedData.game_type as GameType,
                tournament_id: validatedData.tournament_id,
                duration_seconds: validatedData.duration_seconds,
                started_at: validatedData.started_at,
            });

            // Get match with player details
            const matchWithPlayers = matchHistoryModel.getMatchWithPlayers(match.id);

            return reply.status(201).send({
                success: true,
                data: {
                    match: matchWithPlayers,
                },
                message: 'Match recorded successfully',
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid match data',
                        details: error.errors,
                    },
                });
            }
            throw error;
        }
    }

    /**
     * Create an AI match record (shortcut endpoint)
     * POST /api/matches/ai
     * 
     * Basitleştirilmiş endpoint: sadece player_id, player_score, ai_score gönderilir.
     * Backend otomatik olarak AI user ataması yapar ve kazananı belirler.
     */
    async createAIMatch(
        request: FastifyRequest<{ Body: { player_id: number; player_score: number; ai_score: number; duration_seconds?: number } }>,
        reply: FastifyReply
    ) {
        try {
            const validatedData = createAIMatchSchema.parse(request.body);

            // Auth kontrolü: istek yapan kullanıcı player olmalı
            const userId = request.user.id;
            if (validatedData.player_id !== userId) {
                return reply.status(403).send({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'You can only record your own matches',
                    },
                });
            }

            // Player'ı doğrula
            const player = userModel.findById(validatedData.player_id);
            if (!player) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'PLAYER_NOT_FOUND',
                        message: 'Player not found',
                    },
                });
            }

            // AI kullanıcıyı al veya oluştur
            const aiUser = userModel.getOrCreateAIUser();

            // Kazananı belirle
            let winnerId: number | null = null;
            if (validatedData.player_score > validatedData.ai_score) {
                winnerId = validatedData.player_id;
            } else if (validatedData.ai_score > validatedData.player_score) {
                winnerId = aiUser.id;
            }

            // Maç oluştur
            const match = matchHistoryModel.create({
                player1_id: validatedData.player_id,
                player2_id: aiUser.id,
                player1_score: validatedData.player_score,
                player2_score: validatedData.ai_score,
                winner_id: winnerId,
                game_type: 'ai' as GameType,
                duration_seconds: validatedData.duration_seconds,
            });

            // Detaylı maç bilgisi
            const matchWithPlayers = matchHistoryModel.getMatchWithPlayers(match.id);

            return reply.status(201).send({
                success: true,
                data: {
                    match: matchWithPlayers,
                },
                message: 'AI match recorded successfully',
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid match data',
                        details: error.errors,
                    },
                });
            }
            throw error;
        }
    }

    /**
     * Get a match by ID
     * GET /api/matches/:id
     */
    async getMatch(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ) {
        const matchId = parseInt(request.params.id, 10);

        if (isNaN(matchId)) {
            return reply.status(400).send({
                success: false,
                error: {
                    code: 'INVALID_ID',
                    message: 'Invalid match ID',
                },
            });
        }

        const match = matchHistoryModel.getMatchWithPlayers(matchId);

        if (!match) {
            return reply.status(404).send({
                success: false,
                error: {
                    code: 'MATCH_NOT_FOUND',
                    message: 'Match not found',
                },
            });
        }

        return reply.send({
            success: true,
            data: { match },
        });
    }

    /**
     * Get all matches with pagination
     * GET /api/matches?limit=20&offset=0
     * 
     * SORUN 4 FIX: offset parametresi artık gerçekten kullanılıyor
     */
    async getMatches(
        request: FastifyRequest<{ Querystring: { limit?: string; offset?: string } }>,
        reply: FastifyReply
    ) {
        try {
            const query = getMatchesQuerySchema.parse(request.query);
            const matches = matchHistoryModel.getRecentMatches(query.limit, query.offset);

            return reply.send({
                success: true,
                data: {
                    matches,
                    pagination: {
                        limit: query.limit,
                        offset: query.offset,
                    },
                },
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid query parameters',
                        details: error.errors,
                    },
                });
            }
            throw error;
        }
    }
}

// Export singleton instance
export const matchController = new MatchController();
