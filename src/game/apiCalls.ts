import Api from '../api/apiLibrary';
// import backupApi from '../api/apiLibrary-backup';

export interface MatchPayload {
    player1_id: number | null;
    player2_id: number | null;
    player1_score: number;
    player2_score: number;
    game_type: string;
    duration_seconds: number;
    started_at: string;
}

// {
//     "player1_id": number,
//     "player2_id": number,
//     "player1_score": number,
//     "player2_score": number,
//     "game_mode": "modern" | "nostalgia" | "tournament",
//     "match_type": "h2h" | "h2ai",
//     "winning_score": number,
//     "player1_power_up_freeze", true | false,
//     "player1_power_up_mega", true | false,
//     "player2_power_up_freeze", true | false,
//     "player2_power_up_mega", true | false,
//     "started_at": "2026-02-16T12:00:00.000Z"
// }

// {
//     "tournamentId": 1,
//     "userId": 2,
//     "alias": "Neslihan",
//     "password": "Nesli1234,."  // 2FA kodu
// } 

export async function saveMatch(match: MatchPayload) {
    try {
        const response = await Api.post('/api/matches',
            {
                "player1_id": null,
                "player2_id": 2,
                "player1_score": match.player1_score,
                "player2_score": match.player2_score,
                "game_type": "pong",
                "duration_seconds": 180,
            });
        return response;
    } catch (error) {
        console.error('Match save API failed!', error);
    }
}