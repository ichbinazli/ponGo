import Api from '../api/apiLibrary';

interface UserSearchResult {
    id: number;
    display_name: string;
    avatar_url: string;
    is_online: boolean;
}
export interface TournamentMatch {
    round: number;
    matchOrder: number;
    participant1Alias?: string;
    participant2Alias?: string;
}
export interface TournamentStartPayload {
    tournamentId: number;
    matches: TournamentMatch[];
}

export interface MatchPayload {
    player1_id: number | null;
    player2_id: number | null;
    player1_name: string;
    player2_name: string;
    player1_score: number;
    player2_score: number;
    game_mode: string;
    match_type: "h2h" | "h2ai";
    aiDifficultly: string | null;
    winning_score: number;
    player1_power_up_freeze: boolean;
    player1_power_up_mega: boolean;
    player2_power_up_freeze: boolean;
    player2_power_up_mega: boolean;
    started_at: string;
}

export async function saveMatch(match: MatchPayload) {
    try {
        const response = await Api.post('/api/matches',
            match);
        return response;
    } catch (error) {
        console.error('Match save API failed!', error);
    }
}

export async function searchUser(query: string) {
    if (!query || query.length < 2) return Promise.resolve([]);
    try {
        const response = await Api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (response.success && response.data && response.data.users) {
            return response.data.users.map((user: UserSearchResult) => ({
                id: user.id,
                displayName: user.display_name,
                avatar_url: user.avatar_url,
                is_online: user.is_online
            }));
        }
        return [];
    } catch (error) {
        console.error('User search API failed!', error);
        return [];
    }
}

export async function verifyPassword(userId: number, password: string) {
    try {
        const response = await Api.post('/api/auth/verify-password', {
            userId,
            password
        });
        return response.success;
    } catch (error) {
        console.error('Password verification API failed!', error);
        return false;
    }
}

export async function startTournament(payload: TournamentStartPayload) {
    try {
        const response = await Api.post(`/api/local-tournament/${payload.tournamentId}/start`, payload);
        return response;
    } catch (error) {
        console.error('Tournament start API failed!', error);
    }
}

export async function createTournament(name: string, maxPlayers: number) {
    try {
        const response = await Api.post('/api/local-tournament/create', {
            name,
            maxPlayers
        });
        return response;
    } catch (error) {
        console.error('Tournament creation API failed!', error);
    }

}

export async function tournamentAddParticipant(tournamentId: number, userId: number, alias: string) {
    try {
        const response = await Api.post(`/api/local-tournament/add-participant`, {
            tournamentId,
            userId,
            alias
        });
        return response;
    } catch (error) {
        console.error('Add participant API failed!', error);
    }
}

export async function tournamentAddGuest(tournamentId: number, alias: string) {
    try {
        const response = await Api.post(`/api/local-tournament/add-guest`, {
            tournamentId,
            alias
        });
        return response;
    } catch (error) {
        console.error('Add guest API failed!', error);
    }
}

export interface TournamentMatchSavePayload {
    participant1Score: number;
    participant2Score: number;
    winnerParticipantId: number;
    durationSeconds: number;
    winningScore: number;
    gameMode: string;
}

export async function tournamentMatchSave(matchId: number, data: TournamentMatchSavePayload) {
    try {
        const response = await Api.post(`/api/local-tournament/match/${matchId}/result`, data);
        return response;
    } catch (error) {
        console.error('Tournament match save API failed!', error);
    }
}