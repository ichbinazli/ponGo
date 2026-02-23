export declare const keysPressedHuman: {
    [key: string]: boolean;
};
export declare const keysPressedAI: {
    [key: string]: boolean;
};
export declare const paddles: {
    paddleSpeed: number;
    paddle1Y: number;
    paddle2Y: number;
};
export declare const ball: {
    x: number;
    y: number;
    speed: number;
    velocityX: number;
    velocityY: number;
};
export declare function initGameObjects(): void;
export declare const scores: {
    player1: number;
    player2: number;
};
interface PlayersInfo {
    mainPlayer_name: string;
    otherPlayer_name: string;
    mainPlayer_id: number | null;
    otherPlayer_id: number | null;
    mainPlayer_score: number;
    otherPlayer_score: number;
    mainPlayer_side: 'left' | 'right';
    mainPlayer_power_up_freeze: boolean;
    mainPlayer_power_up_mega: boolean;
    otherPlayer_power_up_freeze: boolean;
    otherPlayer_power_up_mega: boolean;
}
export declare const playersInfo: PlayersInfo;
export declare const gameState: {
    matchType: "h2h" | "h2ai";
};
export {};
//# sourceMappingURL=types.d.ts.map