export declare const streaks: {
    player1: number;
    player2: number;
};
export declare const freezeUsed: {
    player1: boolean;
    player2: boolean;
};
export declare const megaEarned: {
    player1: boolean;
    player2: boolean;
};
type FreezeState = {
    active: boolean;
    target: 'player1' | 'player2' | null;
    expiresAt: number;
};
export declare const freezeState: FreezeState;
export declare const freezeUI: {
    p1: HTMLDivElement | null;
    p2: HTMLDivElement | null;
};
export declare const basePaddleHeights: {
    player1: number;
    player2: number;
};
export declare function updatePowerupBoard(): void;
export declare function initFreezeUI(): void;
export declare function initPowerupUI(): void;
export declare function hydratePowerups(): void;
export declare function isFrozen(player: 'player1' | 'player2'): boolean;
export declare function updateFreeze(now: number): void;
export declare function clearFreeze(): void;
export declare function maybeApplyFreeze(scorer: 'player1' | 'player2', target: 'player1' | 'player2', now: number): void;
export declare function maybeApplyMegaPaddle(player: 'player1' | 'player2', now: number): void;
export declare function clearMega(player: 'player1' | 'player2'): void;
export declare function updateMega(now: number): void;
export {};
//# sourceMappingURL=powerUps.d.ts.map