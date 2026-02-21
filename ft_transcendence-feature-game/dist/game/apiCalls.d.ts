export interface MatchPayload {
    player1_id: number | null;
    player2_id: number | null;
    player1_score: number;
    player2_score: number;
    game_type: string;
    duration_seconds: number;
    started_at: string;
}
export declare function saveMatch(match: MatchPayload): Promise<any>;
//# sourceMappingURL=apiCalls.d.ts.map