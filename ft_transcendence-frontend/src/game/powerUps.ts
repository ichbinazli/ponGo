import { paddles } from './types';
import { ui } from './ui';

type Powerups = {
    freeze: boolean;
    megaPaddle: boolean;
};

const powerups: Powerups = {
    freeze: false,
    megaPaddle: false,
};

export const streaks = {
    player1: 0,
    player2: 0,
};

export const freezeUsed = {
    player1: false,
    player2: false,
};

export const megaEarned = {
    player1: false,
    player2: false,
};

type FreezeState = {
    active: boolean;
    target: 'player1' | 'player2' | null;
    expiresAt: number;
};

export const freezeState: FreezeState = {
    active: false,
    target: null,
    expiresAt: 0,
};

export const freezeUI = {
    p1: null as HTMLDivElement | null,
    p2: null as HTMLDivElement | null,
};

type MegaState = {
    active: boolean;
    expiresAt: number;
};

const megaState: Record<'player1' | 'player2', MegaState> = {
    player1: { active: false, expiresAt: 0 },
    player2: { active: false, expiresAt: 0 },
};

export const basePaddleHeights = {
    player1: 0,
    player2: 0,
};

const powerupUI = {
    board: null as HTMLDivElement | null,
    p1Streak: null as HTMLElement | null,
    p2Streak: null as HTMLElement | null,
    p1Progress: null as HTMLDivElement | null,
    p2Progress: null as HTMLDivElement | null,
    p1Foot: null as HTMLElement | null,
    p2Foot: null as HTMLElement | null,
    p1MegaProgress: null as HTMLDivElement | null,
    p2MegaProgress: null as HTMLDivElement | null,
    p1MegaFoot: null as HTMLElement | null,
    p2MegaFoot: null as HTMLElement | null,
    p1FreezeCount: null as HTMLElement | null,
    p2FreezeCount: null as HTMLElement | null,
    p1MegaCount: null as HTMLElement | null,
    p2MegaCount: null as HTMLElement | null,
};

export function updatePowerupBoard() {
    if (!powerupUI.board) return;
    const streak1 = streaks.player1;
    const streak2 = streaks.player2;

    if (powerupUI.p1Streak) powerupUI.p1Streak.textContent = `Score Streak: ${streak1}`;
    if (powerupUI.p2Streak) powerupUI.p2Streak.textContent = `Score Streak: ${streak2}`;

    const enabled = powerups.freeze || powerups.megaPaddle;
    powerupUI.board.classList.toggle('hidden', !enabled);
    if (!enabled) return;

    const progressPct = (streak: number, threshold: number) => {
        if (streak === 0) return 0;
        const mod = streak % threshold;
        return mod === 0 ? 100 : (mod / threshold) * 100;
    };

    if (powerupUI.p1Progress) powerupUI.p1Progress.style.width = `${powerups.freeze ? (freezeUsed.player1 ? 100 : progressPct(streak1, 3)) : 0}%`;
    if (powerupUI.p2Progress) powerupUI.p2Progress.style.width = `${powerups.freeze ? (freezeUsed.player2 ? 100 : progressPct(streak2, 3)) : 0}%`;

    const freezeCountText = (streak: number, used: boolean) => {
        if (used) return '3/3';
        const current = streak === 0 ? 0 : (streak % 3 || 3);
        return `${current}/3`;
    };

    if (powerupUI.p1FreezeCount) powerupUI.p1FreezeCount.textContent = powerups.freeze ? freezeCountText(streak1, freezeUsed.player1) : '0/3';
    if (powerupUI.p2FreezeCount) powerupUI.p2FreezeCount.textContent = powerups.freeze ? freezeCountText(streak2, freezeUsed.player2) : '0/3';

    const megaActive = {
        player1: megaState.player1.active,
        player2: megaState.player2.active,
    };

    if (powerupUI.p1MegaProgress)
        powerupUI.p1MegaProgress.style.width = `${powerups.megaPaddle ? (megaActive.player1 ? 100 : progressPct(streak1, 5)) : 0}%`;
    if (powerupUI.p2MegaProgress)
        powerupUI.p2MegaProgress.style.width = `${powerups.megaPaddle ? (megaActive.player2 ? 100 : progressPct(streak2, 5)) : 0}%`;

    const megaCountText = (streak: number, active: boolean) => {
        if (active) return '5/5';
        const current = streak === 0 ? 0 : (streak % 5 || 5);
        return `${current}/5`;
    };

    if (powerupUI.p1MegaCount) powerupUI.p1MegaCount.textContent = powerups.megaPaddle ? megaCountText(streak1, megaActive.player1) : '0/5';
    if (powerupUI.p2MegaCount) powerupUI.p2MegaCount.textContent = powerups.megaPaddle ? megaCountText(streak2, megaActive.player2) : '0/5';

    const freezeBlocks = document.querySelectorAll('.freeze-block');
    freezeBlocks.forEach((el) => el.classList.toggle('hidden', !powerups.freeze));
    const megaBlocks = document.querySelectorAll('.mega-block');
    megaBlocks.forEach((el) => el.classList.toggle('hidden', !powerups.megaPaddle));
}

function clampPaddlePosition(player: 'player1' | 'player2') {
    const paddleEl = player === 'player1' ? ui.paddle1 : ui.paddle2;
    if (!paddleEl) return;
    const maxTop = ui.gameBoard.clientHeight - paddleEl.clientHeight;
    const current = player === 'player1' ? paddles.paddle1Y : paddles.paddle2Y;
    const clamped = Math.min(Math.max(current, 0), maxTop);

    if (player === 'player1') paddles.paddle1Y = clamped;
    else paddles.paddle2Y = clamped;
}

export function initFreezeUI() {
    freezeUI.p1 = document.getElementById('freezeOverlayP1') as HTMLDivElement;
    freezeUI.p2 = document.getElementById('freezeOverlayP2') as HTMLDivElement;
}

export function initPowerupUI() {
    powerupUI.board = document.getElementById('powerupBoard') as HTMLDivElement;
    powerupUI.p1Streak = document.getElementById('p1Streak');
    powerupUI.p2Streak = document.getElementById('p2Streak');
    powerupUI.p1Progress = document.getElementById('p1ProgressBar') as HTMLDivElement;
    powerupUI.p2Progress = document.getElementById('p2ProgressBar') as HTMLDivElement;
    powerupUI.p1Foot = document.getElementById('p1Foot');
    powerupUI.p2Foot = document.getElementById('p2Foot');
    powerupUI.p1MegaProgress = document.getElementById('p1MegaProgressBar') as HTMLDivElement;
    powerupUI.p2MegaProgress = document.getElementById('p2MegaProgressBar') as HTMLDivElement;
    powerupUI.p1MegaFoot = document.getElementById('p1MegaFoot');
    powerupUI.p2MegaFoot = document.getElementById('p2MegaFoot');
    powerupUI.p1FreezeCount = document.getElementById('p1FreezeCount');
    powerupUI.p2FreezeCount = document.getElementById('p2FreezeCount');
    powerupUI.p1MegaCount = document.getElementById('p1MegaCount');
    powerupUI.p2MegaCount = document.getElementById('p2MegaCount');
}

export function hydratePowerups() {
    const stored = sessionStorage.getItem('powerups');
    if (!stored) return;
    try {
        const parsed = JSON.parse(stored);
        powerups.freeze = Boolean(parsed?.freeze);
        powerups.megaPaddle = Boolean(parsed?.megaPaddle);
        const enabled = powerups.freeze || powerups.megaPaddle;
        if (powerupUI.board) powerupUI.board.classList.toggle('hidden', !enabled);
    } catch (err) {
        console.error('Powerup parse error', err);
    }
}

export function isFrozen(player: 'player1' | 'player2') {
    return freezeState.active && freezeState.target === player;
}

export function updateFreeze(now: number) {
    if (!freezeState.active) return;
    if (now >= freezeState.expiresAt) {
        clearFreeze();
        return;
    }

    if (freezeState.target === 'player1' && freezeUI.p1)
        freezeUI.p1.style.top = `${paddles.paddle1Y}px`;
    if (freezeState.target === 'player2' && freezeUI.p2)
        freezeUI.p2.style.top = `${paddles.paddle2Y}px`;
}

export function clearFreeze() {
    freezeState.active = false;
    freezeState.target = null;
    freezeState.expiresAt = 0;
    freezeUI.p1?.classList.add('hidden');
    freezeUI.p2?.classList.add('hidden');
}

export function maybeApplyFreeze(scorer: 'player1' | 'player2', target: 'player1' | 'player2', now: number) {
    if (!powerups.freeze) return;
    if (freezeUsed[scorer]) return;
    if (freezeState.active) return;

    const streak = scorer === 'player1' ? streaks.player1 : streaks.player2;
    if (streak < 3) return;
    if (streak % 3 !== 0) return;

    freezeUsed[scorer] = true;

    freezeState.active = true;
    freezeState.target = target;
    freezeState.expiresAt = now + 5000;

    const overlay = target === 'player1' ? freezeUI.p1 : freezeUI.p2;
    const top = target === 'player1' ? paddles.paddle1Y : paddles.paddle2Y;
    if (overlay) {
        overlay.style.top = `${top}px`;
        overlay.classList.remove('hidden');
    }
}

export function maybeApplyMegaPaddle(player: 'player1' | 'player2', now: number) {
    if (!powerups.megaPaddle) return;

    const state = megaState[player];
    if (state.active) return;

    const streak = player === 'player1' ? streaks.player1 : streaks.player2;
    if (streak < 5) return;
    if (streak % 5 !== 0) return;

    state.active = true;
    state.expiresAt = now + 7000;

    megaEarned[player] = true;

    const paddleEl = player === 'player1' ? ui.paddle1 : ui.paddle2;
    const baseHeight = player === 'player1' ? basePaddleHeights.player1 : basePaddleHeights.player2;
    if (paddleEl) {
        const newHeight = (baseHeight || paddleEl.clientHeight) * 2;
        paddleEl.style.height = `${newHeight}px`;
        paddleEl.classList.add('mega-active');
        clampPaddlePosition(player);
    }
}

export function clearMega(player: 'player1' | 'player2') {
    const state = megaState[player];
    state.active = false;
    state.expiresAt = 0;

    const paddleEl = player === 'player1' ? ui.paddle1 : ui.paddle2;
    const baseHeight = player === 'player1' ? basePaddleHeights.player1 : basePaddleHeights.player2;

    if (paddleEl) {
        if (baseHeight > 0) paddleEl.style.height = `${baseHeight}px`;
        else paddleEl.style.height = '';
        paddleEl.classList.remove('mega-active');
        clampPaddlePosition(player);
    }
}

export function updateMega(now: number) {
    (['player1', 'player2'] as const).forEach((player) => {
        const state = megaState[player];
        if (!state.active) return;
        if (now >= state.expiresAt) {
            clearMega(player);
        }
    });
}