import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { userModel } from '../models/user.model.js';
import { tournamentModel } from '../models/tournament.model.js';
import { matchHistoryModel } from '../models/match.model.js';
import { successResponse, errorResponse, ErrorCodes } from '../utils/response.js';

// ===========================================
// Validation Schemas
// ===========================================

const createLocalTournamentSchema = z.object({
    name: z.string().min(3).max(50),
    description: z.string().max(200).optional(),
    maxPlayers: z.number().min(4).max(16).optional().default(8),
});

const addGuestSchema = z.object({
    tournamentId: z.number(),
    alias: z.string().min(2).max(20),
});

const addParticipantSchema = z.object({
    tournamentId: z.number(),
    userId: z.number(),
    alias: z.string().min(2).max(20),
});

const completeTournamentSchema = z.object({
    winnerParticipantId: z.number(),
});

const startTournamentSchema = z.object({
    matches: z.array(z.object({
        round: z.number(),
        matchOrder: z.number(),
        participant1Alias: z.string().optional(),
        participant2Alias: z.string().optional(),
    })),
});

const recordMatchResultSchema = z.object({
    participant1Score: z.number().min(0),
    participant2Score: z.number().min(0),
    winnerParticipantId: z.number(),
    durationSeconds: z.number().optional(),
    winningScore: z.number().int().min(1).optional(),
    gameMode: z.enum(['modern', 'nostalgia', 'tournament']).optional().default('tournament'),
});

// ===========================================
// Controller Functions
// ===========================================

/**
 * Create a new local tournament
 */
export const createLocalTournament = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const userId = (request as any).user?.id;
        if (!userId) {
            return reply.status(401).send(
                errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
            );
        }

        const validation = createLocalTournamentSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, validation.error.message)
            );
        }

        const { name, description, maxPlayers } = validation.data;

        const tournament = tournamentModel.create({
            name,
            description,
            max_players: maxPlayers,
            created_by: userId,
            is_local: true,
        });

        return reply.status(201).send(
            successResponse({
                tournament,
                message: 'Local tournament created successfully',
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create tournament')
        );
    }
};


/**
 * Add guest participant (no verification needed)
 */
export const addGuestParticipant = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const validation = addGuestSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, validation.error.message)
            );
        }

        const { tournamentId, alias } = validation.data;

        // Check tournament exists and is pending
        const tournament = tournamentModel.findById(tournamentId);
        if (!tournament) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'Tournament not found')
            );
        }

        if (tournament.status !== 'pending') {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Tournament is not in registration phase')
            );
        }

        // Check alias uniqueness
        if (!tournamentModel.isAliasUnique(tournamentId, alias)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Alias is already taken in this tournament')
            );
        }

        // Check participant count
        const participantCount = tournamentModel.getParticipantCount(tournamentId);
        if (participantCount >= tournament.max_players) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Tournament is full')
            );
        }

        // Add guest participant
        const participant = tournamentModel.addGuestParticipant(tournamentId, alias);

        return reply.status(201).send(
            successResponse({
                participant,
                isGuest: true,
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to add guest participant')
        );
    }
};

/**
 * Start tournament with bracket data from frontend
 */
export const startTournament = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const tournamentId = parseInt(request.params.id, 10);
        if (isNaN(tournamentId)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid tournament ID')
            );
        }

        const validation = startTournamentSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, validation.error.message)
            );
        }

        // Check tournament exists and is pending
        const tournament = tournamentModel.findById(tournamentId);
        if (!tournament) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'Tournament not found')
            );
        }

        if (tournament.status !== 'pending') {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Tournament has already started')
            );
        }

        const { matches } = validation.data;

        // Create matches from frontend bracket data
        const createdMatches = [];
        for (const match of matches) {
            // Get participant IDs by alias if provided
            let participant1Id: number | undefined;
            let participant2Id: number | undefined;

            if (match.participant1Alias) {
                const p1 = tournamentModel.getParticipantByAlias(tournamentId, match.participant1Alias);
                participant1Id = p1?.id;
            }

            if (match.participant2Alias) {
                const p2 = tournamentModel.getParticipantByAlias(tournamentId, match.participant2Alias);
                participant2Id = p2?.id;
            }

            const createdMatch = tournamentModel.createMatch({
                tournament_id: tournamentId,
                round: match.round,
                match_order: match.matchOrder,
                participant1_id: participant1Id,
                participant2_id: participant2Id,
            });

            createdMatches.push(createdMatch);
        }

        // Update tournament status
        tournamentModel.updateStatus(tournamentId, 'in_progress');

        return reply.send(
            successResponse({
                tournament: tournamentModel.findById(tournamentId),
                matches: createdMatches,
                message: 'Tournament started successfully',
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to start tournament')
        );
    }
};

/**
 * Record match result
 */
export const recordMatchResult = async (
    request: FastifyRequest<{ Params: { matchId: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const matchId = parseInt(request.params.matchId, 10);
        if (isNaN(matchId)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid match ID')
            );
        }

        const validation = recordMatchResultSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, validation.error.message)
            );
        }

        const { participant1Score, participant2Score, winnerParticipantId, durationSeconds, winningScore, gameMode } = validation.data;

        // Get match with participants
        const match = tournamentModel.getMatchWithParticipants(matchId);
        if (!match) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'Match not found')
            );
        }

        // Update match result
        const updated = tournamentModel.updateMatchResult(
            matchId,
            participant1Score,
            participant2Score,
            winnerParticipantId,
            durationSeconds
        );

        if (!updated) {
            return reply.status(500).send(
                errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to update match result')
            );
        }

        // Get winner participant info
        const winnerParticipant = tournamentModel.getParticipant(winnerParticipantId);

        // Persist to match_history if winner is a registered user (not guest)
        let persistedToHistory = false;
        if (winnerParticipant && winnerParticipant.user_id !== null) {
            // Get loser participant
            const loserParticipantId = match.participant1_id === winnerParticipantId
                ? match.participant2_id
                : match.participant1_id;

            const loserParticipant = loserParticipantId
                ? tournamentModel.getParticipant(loserParticipantId)
                : null;

            // Only persist if both players are registered users
            if (loserParticipant && loserParticipant.user_id !== null) {
                const isP1Winner = match.participant1_id === winnerParticipantId;

                matchHistoryModel.create({
                    player1_id: isP1Winner ? winnerParticipant.user_id : loserParticipant.user_id,
                    player2_id: isP1Winner ? loserParticipant.user_id : winnerParticipant.user_id,
                    player1_score: participant1Score,
                    player2_score: participant2Score,
                    winner_id: winnerParticipant.user_id,
                    game_type: 'tournament',
                    tournament_id: match.tournament_id,
                    duration_seconds: durationSeconds,
                    // V2 fields
                    game_mode: gameMode ?? 'tournament',
                    match_type: 'h2h',
                    player1_name: isP1Winner ? winnerParticipant.alias : loserParticipant.alias,
                    player2_name: isP1Winner ? loserParticipant.alias : winnerParticipant.alias,
                    winning_score: winningScore,
                });

                persistedToHistory = true;
            }
        }

        // Update participant statuses using participant ID (works for both registered and guest)
        // Mark winner as still playing
        if (winnerParticipant) {
            tournamentModel.updateParticipantStatusById(
                winnerParticipantId,
                'playing'
            );
        }

        // Mark loser as eliminated
        const loserParticipantId = match.participant1_id === winnerParticipantId
            ? match.participant2_id
            : match.participant1_id;

        if (loserParticipantId) {
            tournamentModel.updateParticipantStatusById(
                loserParticipantId,
                'eliminated'
            );
        }

        return reply.send(
            successResponse({
                match: tournamentModel.getMatchWithParticipants(matchId),
                persistedToHistory,
                message: 'Match result recorded successfully',
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to record match result')
        );
    }
};

/**
 * Get tournament matches
 */
export const getTournamentMatches = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const tournamentId = parseInt(request.params.id, 10);
        if (isNaN(tournamentId)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid tournament ID')
            );
        }

        const tournament = tournamentModel.findById(tournamentId);
        if (!tournament) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'Tournament not found')
            );
        }

        const matches = tournamentModel.getMatchesByTournament(tournamentId);

        return reply.send(
            successResponse({
                tournament,
                matches,
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get tournament matches')
        );
    }
};

/**
 * Get tournament bracket (participants and matches organized by round)
 */
export const getTournamentBracket = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const tournamentId = parseInt(request.params.id, 10);
        if (isNaN(tournamentId)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid tournament ID')
            );
        }

        const tournament = tournamentModel.getWithCreator(tournamentId);
        if (!tournament) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'Tournament not found')
            );
        }

        const participants = tournamentModel.getParticipants(tournamentId);
        const matches = tournamentModel.getMatchesByTournament(tournamentId);

        // Organize matches by round
        const rounds: { [key: number]: typeof matches } = {};
        for (const match of matches) {
            if (!rounds[match.round]) {
                rounds[match.round] = [];
            }
            rounds[match.round].push(match);
        }

        return reply.send(
            successResponse({
                tournament,
                participants,
                rounds,
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get tournament bracket')
        );
    }
};

/**
 * Get tournament participants
 */
export const getTournamentParticipants = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const tournamentId = parseInt(request.params.id, 10);
        if (isNaN(tournamentId)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid tournament ID')
            );
        }

        const tournament = tournamentModel.findById(tournamentId);
        if (!tournament) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'Tournament not found')
            );
        }

        const participants = tournamentModel.getParticipants(tournamentId);

        return reply.send(
            successResponse({
                tournament,
                participants,
                count: participants.length,
                maxPlayers: tournament.max_players,
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to get participants')
        );
    }
};

/**
 * Add verified registered participant to tournament
 * Frontend önce /api/auth/verify-password ile şifre doğrulaması yapar,
 * ardından bu endpoint ile kullanıcıyı turnuvaya ekler.
 */
export const addParticipant = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const validation = addParticipantSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, validation.error.message)
            );
        }

        const { tournamentId, userId, alias } = validation.data;

        // Check tournament exists and is pending
        const tournament = tournamentModel.findById(tournamentId);
        if (!tournament) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'Tournament not found')
            );
        }

        if (tournament.status !== 'pending') {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Tournament is not in registration phase')
            );
        }

        // Verify user exists
        const user = userModel.findById(userId);
        if (!user) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'User not found')
            );
        }

        // Check alias uniqueness
        if (!tournamentModel.isAliasUnique(tournamentId, alias)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Alias is already taken in this tournament')
            );
        }

        // Check if user is already a participant
        if (tournamentModel.isParticipant(tournamentId, userId)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'User is already a participant in this tournament')
            );
        }

        // Check participant count
        const participantCount = tournamentModel.getParticipantCount(tournamentId);
        if (participantCount >= tournament.max_players) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Tournament is full')
            );
        }

        // Add participant
        const participant = tournamentModel.addParticipant(tournamentId, userId, alias);

        return reply.status(201).send(
            successResponse({
                participant,
                user: {
                    id: user.id,
                    displayName: user.display_name,
                    avatarUrl: user.avatar_url,
                },
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to add participant')
        );
    }
};

/**
 * Complete tournament — set winner and finalize
 * Son round'un kazananı belirlendikten sonra frontend bu endpoint'i çağırır.
 */
export const completeTournament = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
): Promise<void> => {
    try {
        const tournamentId = parseInt(request.params.id, 10);
        if (isNaN(tournamentId)) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid tournament ID')
            );
        }

        const validation = completeTournamentSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, validation.error.message)
            );
        }

        const { winnerParticipantId } = validation.data;

        // Check tournament exists and is in_progress
        const tournament = tournamentModel.findById(tournamentId);
        if (!tournament) {
            return reply.status(404).send(
                errorResponse(ErrorCodes.NOT_FOUND, 'Tournament not found')
            );
        }

        if (tournament.status !== 'in_progress') {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Tournament is not in progress')
            );
        }

        // Verify winner participant belongs to this tournament
        const winnerParticipant = tournamentModel.getParticipant(winnerParticipantId);
        if (!winnerParticipant || winnerParticipant.tournament_id !== tournamentId) {
            return reply.status(400).send(
                errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid winner participant for this tournament')
            );
        }

        // Set winner status to 'winner' and placement to 1
        tournamentModel.updateParticipantStatusById(winnerParticipantId, 'winner');

        // Set tournament winner (user_id if registered, null if guest)
        const winnerUserId = winnerParticipant.user_id;
        if (winnerUserId) {
            tournamentModel.setWinner(tournamentId, winnerUserId);
        }

        // Update tournament status to completed
        tournamentModel.updateStatus(tournamentId, 'completed');

        return reply.send(
            successResponse({
                tournament: tournamentModel.findById(tournamentId),
                winner: {
                    participantId: winnerParticipantId,
                    userId: winnerUserId,
                    alias: winnerParticipant.alias,
                    isGuest: winnerParticipant.is_guest === 1,
                },
                message: 'Tournament completed successfully',
            })
        );
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send(
            errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to complete tournament')
        );
    }
};
