export interface TournamentMatch {
    round: number;
    matchOrder: number;
    participant1Alias: string;
    participant2Alias: string | null;
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
export declare function saveMatch(match: MatchPayload): Promise<any>;
export declare function searchUser(query: string): Promise<any>;
export declare function verifyPassword(userId: number, password: string): Promise<any>;
export declare function startTournament(payload: TournamentStartPayload): Promise<any>;
export declare function createTournament(name: string, maxPlayers: number): Promise<any>;
export declare function tournamentAddParticipant(tournamentId: number, userId: number, alias: string): Promise<any>;
export declare function tournamentAddGuest(tournamentId: number, alias: string): Promise<any>;
//# sourceMappingURL=apiCalls.d.ts.map