export interface PlayerStats {
    playersOnline: number;
    gamesToday: number;
    bestScore: number;
}

export interface LeaderboardEntry {
    id: number;
    name: string;
    avatar_url: string;
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

export class APIClient {
    constructor() {
    }

    public async getStats(): Promise<PlayerStats> {
        try {
            await this.delay(500);
            return {
                playersOnline: Math.floor(Math.random() * 100) + 10,
                gamesToday: Math.floor(Math.random() * 500) + 50,
                bestScore: Math.floor(Math.random() * 1000) + 100,
            };
        } catch (error) {
            throw new Error('Failed to fetch stats');
        }
    }

    public async getLeaderboard(): Promise<LeaderboardEntry[]> {
        try {
            await this.delay(800);
            const mockPlayers = [
                'AlexMaster', 'PongKing', 'BallWizard', 'PaddlePro', 'GameChamp',
                'RetroGamer', 'ArcadeHero', 'PixelMaster', 'ScoreHunter', 'PlayMaster'
            ];
            
            return mockPlayers.map((name, index) => ({
                id: index + 1,
                name,
                avatar_url: '',
                score: Math.floor(Math.random() * 5000) + 1000 - (index * 100),
                gamesPlayed: Math.floor(Math.random() * 200) + 50,
                winRate: Math.floor(Math.random() * 40) + 60 - (index * 2),
            })).sort((a, b) => b.score - a.score);
        } catch (error) {
            throw new Error('Failed to fetch leaderboard');
        }
    }

    public async getProfile(): Promise<PlayerProfile> {
        try {
            await this.delay(600);
            const gamesPlayed = Math.floor(Math.random() * 150) + 50;
            const wins = Math.floor(gamesPlayed * (Math.random() * 0.4 + 0.4));
            const losses = gamesPlayed - wins;
            const winRate = Math.floor((wins / gamesPlayed) * 100);
            
            return {
                name: 'Player' + Math.floor(Math.random() * 1000),
                joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
                totalScore: Math.floor(Math.random() * 10000) + 2000,
                gamesPlayed,
                wins,
                losses,
                winRate,
                bestStreak: Math.floor(Math.random() * 20) + 5,
            };
        } catch (error) {
            throw new Error('Failed to fetch profile');
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
