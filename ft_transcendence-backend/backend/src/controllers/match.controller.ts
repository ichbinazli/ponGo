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
    player2_id: z.number().int().positive().nullable(),
    player1_score: z.number().int().min(0),
    player2_score: z.number().int().min(0),
    winner_id: z.number().int().positive().nullable().optional(),
    game_type: z.enum(['pong', 'tournament', 'ai', 'other']).default('pong'),
    tournament_id: z.number().int().positive().optional(),
    duration_seconds: z.number().int().positive().optional(),
    started_at: z.string().datetime().optional(),
    // New fields V2
    game_mode: z.enum(['modern', 'nostalgia', 'tournament']).optional().default('modern'),
    match_type: z.enum(['h2h', 'h2ai']).optional().default('h2h'),
    aiDifficultly: z.enum(['easy', 'medium', 'hard']).nullable().optional(), // Typo in requirement
    player1_name: z.string().optional(),
    player2_name: z.string().optional(),
    winning_score: z.number().int().min(1).optional().default(11),
    player1_power_up_freeze: z.boolean().optional().default(false),
    player1_power_up_mega: z.boolean().optional().default(false),
    player2_power_up_freeze: z.boolean().optional().default(false),
    player2_power_up_mega: z.boolean().optional().default(false),
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
     * player2_id null olabilir (misafir oyuncu). Bu durumda player2_name zorunludur.
     */
    async createMatch(
        request: FastifyRequest<{ Body: CreateMatchInput }>,
        reply: FastifyReply
    ) {
        try {
            const validatedData = createMatchSchema.parse(request.body);

            const userId = request.user.id;

            // Map aiDifficultly (typo from frontend) to ai_difficulty
            // @ts-ignore - Dynamic property access
            const aiDifficulty = request.body.aiDifficultly;

            if (validatedData.match_type === 'h2ai') {
                // AI maçlarında player1 istek yapan kullanıcı olmalı
                if (validatedData.player1_id !== userId) {
                    return reply.status(403).send({
                        success: false,
                        error: {
                            code: 'FORBIDDEN',
                            message: 'You can only record your own matches against AI',
                        },
                    });
                }

                // Player 2 otomatik olarak AI User atanır
                const aiUser = userModel.getOrCreateAIUser();
                validatedData.player2_id = aiUser.id;
                validatedData.game_type = 'ai';
            } else {
                // PvP (h2h) maçları

                // Kural: İkisi de null olamaz
                if (validatedData.player1_id === null && validatedData.player2_id === null) {
                    return reply.status(400).send({
                        success: false,
                        error: {
                            code: 'INVALID_PLAYERS',
                            message: 'At least one player must be a registered user',
                        },
                    });
                }

                // Giriş yapan kullanıcı kayıtlı oyunculardan biri olmalı
                if (validatedData.player1_id !== userId && validatedData.player2_id !== userId) {
                    return reply.status(403).send({
                        success: false,
                        error: {
                            code: 'FORBIDDEN',
                            message: 'You can only record your own matches',
                        },
                    });
                }

                // Aynı oyuncu kendine karşı oynayamaz
                if (validatedData.player2_id !== null && validatedData.player1_id === validatedData.player2_id) {
                    return reply.status(400).send({
                        success: false,
                        error: {
                            code: 'INVALID_PLAYERS',
                            message: 'Players must be different',
                        },
                    });
                }

                // Misafir oyuncu varsa player2_name zorunlu
                if (validatedData.player2_id === null && !validatedData.player2_name) {
                    return reply.status(400).send({
                        success: false,
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'player2_name is required when player2_id is null (guest player)',
                        },
                    });
                }
            }

            // Validate player1 exists (always required)
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

            // Validate player2 exists (only if not null / not guest)
            if (validatedData.player2_id !== null) {
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
                // New fields V2 mapping
                game_mode: validatedData.game_mode,
                match_type: validatedData.match_type,
                ai_difficulty: aiDifficulty || null,
                player1_name: validatedData.player1_name,
                player2_name: validatedData.player2_name,
                winning_score: validatedData.winning_score,
                p1_power_up_freeze: validatedData.player1_power_up_freeze,
                p1_power_up_mega: validatedData.player1_power_up_mega,
                p2_power_up_freeze: validatedData.player2_power_up_freeze,
                p2_power_up_mega: validatedData.player2_power_up_mega,
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
