export interface PlayerStats {
    playersOnline: number;
    gamesToday: number;
    bestScore: number;
}
export interface LeaderboardEntry {
    name: string;
    score: number;
    gamesPlayed: number;
    winRate: number;
}
export interface PlayerProfile {
    name: string;
    joinDate: string;
    totalScore: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
    bestStreak: number;
}
export declare class APIClient {
    constructor();
    getStats(): Promise<PlayerStats>;
    getLeaderboard(): Promise<LeaderboardEntry[]>;
    getProfile(): Promise<PlayerProfile>;
    private delay;
}
//# sourceMappingURL=APIClient.d.ts.map