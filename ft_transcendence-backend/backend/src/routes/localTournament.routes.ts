import { FastifyInstance } from 'fastify';
import {
    createLocalTournament,
    verifyParticipant,
    addGuestParticipant,
    startTournament,
    recordMatchResult,
    getTournamentMatches,
    getTournamentBracket,
    getTournamentParticipants,
} from '../controllers/localTournament.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

// Route parameter schemas
const tournamentIdParams = {
    type: 'object',
    properties: {
        id: { type: 'string' }
    },
    required: ['id']
} as const;

const matchIdParams = {
    type: 'object',
    properties: {
        matchId: { type: 'string' }
    },
    required: ['matchId']
} as const;

/**
 * Local Tournament Routes
 * 
 * Handles local tournament operations including:
 * - Creating local tournaments
 * - Adding registered participants with 2FA verification
 * - Adding guest participants
 * - Starting tournaments with bracket data
 * - Recording match results
 * - Viewing tournament data
 */
export const localTournamentRoutes = async (fastify: FastifyInstance): Promise<void> => {

    // ==========================================
    // Tournament Management (Requires Auth)
    // ==========================================

    // Create a new local tournament
    fastify.post(
        '/create',
        { preHandler: [authenticate] },
        createLocalTournament
    );

    // Start tournament with bracket data
    fastify.post<{ Params: { id: string } }>(
        '/:id/start',
        {
            preHandler: [authenticate],
            schema: { params: tournamentIdParams }
        },
        startTournament
    );

    // ==========================================
    // Participant Management (Requires Auth)
    // ==========================================

    // Verify and add registered participant (with 2FA)
    fastify.post(
        '/verify-participant',
        { preHandler: [authenticate] },
        verifyParticipant
    );

    // Add guest participant (no 2FA required)
    fastify.post(
        '/add-guest',
        { preHandler: [authenticate] },
        addGuestParticipant
    );

    // ==========================================
    // Match Management (Requires Auth)
    // ==========================================

    // Record match result
    fastify.post<{ Params: { matchId: string } }>(
        '/match/:matchId/result',
        {
            preHandler: [authenticate],
            schema: { params: matchIdParams }
        },
        recordMatchResult
    );

    // ==========================================
    // Tournament Data (Public)
    // ==========================================

    // Get tournament participants
    fastify.get<{ Params: { id: string } }>(
        '/:id/participants',
        { schema: { params: tournamentIdParams } },
        getTournamentParticipants
    );

    // Get tournament matches
    fastify.get<{ Params: { id: string } }>(
        '/:id/matches',
        { schema: { params: tournamentIdParams } },
        getTournamentMatches
    );

    // Get tournament bracket (participants + matches organized by round)
    fastify.get<{ Params: { id: string } }>(
        '/:id/bracket',
        { schema: { params: tournamentIdParams } },
        getTournamentBracket
    );
};
