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
    game_type: z.enum(['pong', 'tournament', 'other']).default('pong'),
    tournament_id: z.number().int().positive().optional(),
    duration_seconds: z.number().int().positive().optional(),
    started_at: z.string().datetime().optional(),
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
     */
    async createMatch(
        request: FastifyRequest<{ Body: CreateMatchInput }>,
        reply: FastifyReply
    ) {
        try {
            const validatedData = createMatchSchema.parse(request.body);

            // Validate players exist
            const player1 = userModel.findById(validatedData.player1_id);
            const player2 = userModel.findById(validatedData.player2_id);

            if (!player1) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'PLAYER_NOT_FOUND',
                        message: `Player 1 with ID ${validatedData.player1_id} not found`,
                    },
                });
            }

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
     * GET /api/matches
     */
    async getMatches(
        request: FastifyRequest<{ Querystring: { limit?: string; offset?: string } }>,
        reply: FastifyReply
    ) {
        try {
            const query = getMatchesQuerySchema.parse(request.query);
            const matches = matchHistoryModel.getRecentMatches(query.limit);

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
