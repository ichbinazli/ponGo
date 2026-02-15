/* eslint-disable no-console */
import { initUI, ui } from './ui';
import { initGameObjects, keysPressedHuman, keysPressedAI, paddles, ball, gameState, scores } from './types';
import { update } from './modes/human2ai';
// import api from '../api/apiLibrary-backup';

// async function testApi() {
//     try {
//         const res = await api.get('/api/users/search?q=ksl');
//         console.log('API OK:', res);
//     } catch (err) {
//         console.error('API HATA:', err);
//     }
// }

// sadece hızlı test için, oyun başlarken bir kez çalıştır
// testApi();
// ...existing code...

const DEFAULT_WINNING_SCORE = 5;
let winningScore = DEFAULT_WINNING_SCORE;

type Powerups = {
    freeze: boolean;
    megaPaddle: boolean;
};

const powerups: Powerups = {
    freeze: false,
    megaPaddle: false,
};

const streaks = {
    player1: 0,
    player2: 0,
};

const freezeUsed = {
    player1: false,
    player2: false,
};

type FreezeState = {
    active: boolean;
    target: 'player1' | 'player2' | null;
    expiresAt: number;
};

const freezeState: FreezeState = {
    active: false,
    target: null,
    expiresAt: 0,
};

const freezeUI = {
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

const basePaddleHeights = {
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

let gameRunning = false;
let animationId: number | null = null;
let gameFinished = false;
let lastTime = performance.now();
let spaceHintDismissed = false;
let spaceToggleBound = false;

type GameOverUI = {
    overlay: HTMLDivElement | null;
    title: HTMLElement | null;
    score: HTMLElement | null;
    playAgain: HTMLButtonElement | null;
    backToOptions: HTMLAnchorElement | null;
};

const gameOverUI: GameOverUI = {
    overlay: null,
    title: null,
    score: null,
    playAgain: null,
    backToOptions: null,
};

export function initGameEngine(): void {
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    gameRunning = false;
    gameFinished = false;
    spaceHintDismissed = false;

    initUI();
    setPlayerNames();
    initGameOverUI();
    initFreezeUI();
    initPowerupUI();
    hydrateWinningScore();
    hydratePowerups();
    initGameObjects();
    captureBasePaddleHeights();
    showSpaceHint();
    hideScoreboard();
    bindSpaceToggle();
    resetMatchState();
}

function isKeyPressed(key: 'w' | 's') {
    return gameState.gameMode === 'h2ai'
        ? keysPressedAI[key]
        : keysPressedHuman[key];
}

function movePoddle1() {
    if (isFrozen('player1')) return;
    if (isKeyPressed('w') && paddles.paddle1Y > 0)
        paddles.paddle1Y -= paddles.paddleSpeed;
    if (isKeyPressed('s') && paddles.paddle1Y < ui.gameBoard.clientHeight - ui.paddle1.clientHeight)
        paddles.paddle1Y += paddles.paddleSpeed;
}

function movePoddle2() {
    if (isFrozen('player2')) return;
    if (keysPressedHuman['ArrowUp'] && paddles.paddle2Y > 0)
        paddles.paddle2Y -= paddles.paddleSpeed;
    if (keysPressedHuman['ArrowDown'] && paddles.paddle2Y < ui.gameBoard.clientHeight - ui.paddle2.clientHeight)
        paddles.paddle2Y += paddles.paddleSpeed;
}

function updateScoreboard() {
    ui.player1Score.textContent = scores.player1.toString();
    ui.player2Score.textContent = scores.player2.toString();

    if (scores.player1 >= winningScore) {
        finishGame('player1');
        return;
    }
    if (scores.player2 >= winningScore) {
        finishGame('player2');
        return;
    }
}

function updatePowerupBoard() {
    if (!powerupUI.board) return;
    const streak1 = streaks.player1;
    const streak2 = streaks.player2;

    if (powerupUI.p1Streak) powerupUI.p1Streak.textContent = `Sayı Serisi: ${streak1}`;
    if (powerupUI.p2Streak) powerupUI.p2Streak.textContent = `Sayı Serisi: ${streak2}`;

    const enabled = powerups.freeze || powerups.megaPaddle;
    powerupUI.board.classList.toggle('hidden', !enabled);
    if (!enabled) return;

    const progressPct = (streak: number, threshold: number) => {
        if (streak === 0) return 0;
        const mod = streak % threshold;
        return mod === 0 ? 100 : (mod / threshold) * 100;
    };

    // Freeze UI
    if (powerupUI.p1Progress) powerupUI.p1Progress.style.width = `${powerups.freeze ? (freezeUsed.player1 ? 100 : progressPct(streak1, 3)) : 0}%`;
    if (powerupUI.p2Progress) powerupUI.p2Progress.style.width = `${powerups.freeze ? (freezeUsed.player2 ? 100 : progressPct(streak2, 3)) : 0}%`;

    const freezeCountText = (streak: number, used: boolean) => {
        if (used) return '3/3';
        const current = streak === 0 ? 0 : (streak % 3 || 3);
        return `${current}/3`;
    };

    if (powerupUI.p1FreezeCount) powerupUI.p1FreezeCount.textContent = powerups.freeze ? freezeCountText(streak1, freezeUsed.player1) : '0/3';
    if (powerupUI.p2FreezeCount) powerupUI.p2FreezeCount.textContent = powerups.freeze ? freezeCountText(streak2, freezeUsed.player2) : '0/3';

    // Mega Paddle UI
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

function resetBall(serveRight: boolean) {
    ball.x = ui.gameBoard.clientWidth / 2 - ui.ball.clientWidth / 2;
    ball.y = ui.gameBoard.clientHeight / 2 - ui.ball.clientHeight / 2;

    const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8);
    ball.velocityX = ball.speed * Math.cos(angle) * (serveRight ? 1 : -1);
    ball.velocityY = ball.speed * Math.sin(angle);
}

function centerBallAndStop() {
    ball.x = ui.gameBoard.clientWidth / 2 - ui.ball.clientWidth / 2;
    ball.y = ui.gameBoard.clientHeight / 2 - ui.ball.clientHeight / 2;
    ball.velocityX = 0;
    ball.velocityY = 0;
    syncPositions();
}

function resetMatchState() {
    scores.player1 = 0;
    scores.player2 = 0;
    streaks.player1 = 0;
    streaks.player2 = 0;
    freezeUsed.player1 = false;
    freezeUsed.player2 = false;
    clearFreeze();
    clearMega('player1');
    clearMega('player2');
    paddles.paddle1Y = ui.gameBoard.clientHeight / 2 - ui.paddle1.clientHeight / 2;
    paddles.paddle2Y = ui.gameBoard.clientHeight / 2 - ui.paddle2.clientHeight / 2;
    updateScoreboard();
    updatePowerupBoard();
    centerBallAndStop();
    gameFinished = false;
}

function startGame() {
    if (gameRunning) return;
    if (gameFinished) resetMatchState();

    hideGameOverModal();
    dismissSpaceHint();
    showScoreboard();

    gameRunning = true;
    if (ball.velocityX === 0 && ball.velocityY === 0)
        resetBall(Math.random() > 0.5);
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

function stopGame() {
    if (!gameRunning && animationId === null) return;

    gameRunning = false;
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    //centerBallAndStop();
}

function finishGame(winner: 'player1' | 'player2') {
    gameFinished = true;
    stopGame();
    clearFreeze();
    clearMega('player1');
    clearMega('player2');
    centerBallAndStop();
    showGameOverModal(winner);
}

function syncPositions() {
    ui.paddle1.style.top = `${paddles.paddle1Y}px`;
    ui.paddle2.style.top = `${paddles.paddle2Y}px`;
    ui.ball.style.left = `${ball.x}px`;
    ui.ball.style.top = `${ball.y}px`;
    if (freezeState.active && freezeState.target === 'player1' && freezeUI.p1)
        freezeUI.p1.style.top = `${paddles.paddle1Y}px`;
    if (freezeState.active && freezeState.target === 'player2' && freezeUI.p2)
        freezeUI.p2.style.top = `${paddles.paddle2Y}px`;
}

function gameLoop(time: number) {
    if (!gameRunning) return;

    movePoddle2();
    movePoddle1();

    if (gameState.gameMode === 'h2ai') {
        const deltaTime = time - lastTime;
        lastTime = time;
        update(deltaTime);
    }

    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    const now = performance.now();
    updateFreeze(now);
    updateMega(now);

    if (ball.y <= 0) {
        ball.y = 0;
        ball.velocityY *= -1;
    } else if (ball.y >= ui.gameBoard.clientHeight - ui.ball.clientHeight) {
        ball.y = ui.gameBoard.clientHeight - ui.ball.clientHeight;
        ball.velocityY *= -1;
    }

    const ballLeft = ball.x;
    const ballRight = ball.x + ui.ball.clientWidth;
    const ballTop = ball.y;
    const ballBottom = ball.y + ui.ball.clientHeight;

    const paddle1Left = ui.paddle1.offsetLeft;
    const paddle1Right = ui.paddle1.offsetLeft + ui.paddle1.clientWidth;
    const paddle1Top = paddles.paddle1Y;
    const paddle1Bottom = paddles.paddle1Y + ui.paddle1.clientHeight;

    const paddle2Left = ui.paddle2.offsetLeft;
    const paddle2Right = ui.paddle2.offsetLeft + ui.paddle2.clientWidth;
    const paddle2Top = paddles.paddle2Y;
    const paddle2Bottom = paddles.paddle2Y + ui.paddle2.clientHeight;

    const hitPaddle1 = ballRight >= paddle1Left && ballLeft <= paddle1Right && ballBottom >= paddle1Top && ballTop <= paddle1Bottom;
    if (hitPaddle1) {
        ball.velocityX *= -1;
        const deltaY = ball.y - (paddles.paddle1Y + ui.paddle1.clientHeight / 2);
        ball.velocityY = deltaY * 0.3;
    }

    const hitPaddle2 = ballRight >= paddle2Left && ballLeft <= paddle2Right && ballBottom >= paddle2Top && ballTop <= paddle2Bottom;
    if (hitPaddle2) {
        ball.velocityX *= -1;
        const deltaY = ball.y - (paddles.paddle2Y + ui.paddle2.clientHeight / 2);
        ball.velocityY = deltaY * 0.3;
    }


    if (ballRight <= 0) {
        scores.player2 += 1;
        streaks.player2 += 1;
        streaks.player1 = 0;
        maybeApplyFreeze('player2', 'player1', now);
        maybeApplyMegaPaddle('player2', now);
        updateScoreboard();
        updatePowerupBoard();
        if (!gameFinished) resetBall(true);
    }

    if (ballLeft > ui.gameBoard.clientWidth) {
        scores.player1 += 1;
        streaks.player1 += 1;
        streaks.player2 = 0;
        maybeApplyFreeze('player1', 'player2', now);
        maybeApplyMegaPaddle('player1', now);
        updateScoreboard();
        updatePowerupBoard();
        if (!gameFinished) resetBall(false);
    }

    syncPositions();

    if (gameRunning)
        animationId = requestAnimationFrame(gameLoop);
}

function showSpaceHint() {
    if (!ui.spaceHint) return;
    ui.spaceHint.classList.remove('hidden');
}

function dismissSpaceHint() {
    if (spaceHintDismissed) return;
    spaceHintDismissed = true;
    ui.spaceHint?.classList.add('hidden');
}

function showScoreboard() {
    ui.scoreBoard?.classList.remove('hidden');
}

function hideScoreboard() {
    ui.scoreBoard?.classList.add('hidden');
}

function bindSpaceToggle() {
    if (spaceToggleBound) return;
    spaceToggleBound = true;

    document.addEventListener('keydown', (event) => {
        if (event.code !== 'Space') return;
        if (event.repeat) return;

        const active = document.activeElement as HTMLElement | null;
        const isTyping = active && (['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName) || active.isContentEditable);
        if (isTyping) return;

        const onGameRoute = window.location.pathname === '/game';
        const gamePageExists = !!document.getElementById('gamePage');
        if (!(onGameRoute || gamePageExists)) return;

        event.preventDefault();
        dismissSpaceHint();

        if (gameRunning) stopGame();
        else startGame();
    });
}

function initGameOverUI() {
    gameOverUI.overlay = document.getElementById('gameOverOverlay') as HTMLDivElement;
    gameOverUI.title = document.getElementById('winnerTitle');
    gameOverUI.score = document.getElementById('winnerScore');
    gameOverUI.playAgain = document.getElementById('playAgainButton') as HTMLButtonElement;
    gameOverUI.backToOptions = document.getElementById('backToOptionsButton') as HTMLAnchorElement;

    if (gameOverUI.playAgain) {
        gameOverUI.playAgain.onclick = () => {
            hideGameOverModal();
            resetMatchState();
            startGame();
        };
    }

    if (gameOverUI.backToOptions) {
        gameOverUI.backToOptions.onclick = (event) => {
            event.preventDefault();
            hideGameOverModal();
            navigateToGameOptions();
        };
    }
}

function setPlayerNames() {
    const storedPlayer1 = sessionStorage.getItem('player1');
    const storedPlayer2 = sessionStorage.getItem('player2');
    const singlePlayer = sessionStorage.getItem('playerName');
    const matchType = sessionStorage.getItem('matchType');

    const isAiMatch = matchType === 'h2ai';

    const player1Name = isAiMatch
        ? 'AI'
        : (storedPlayer1 || 'Player 1');

    const player2Name = isAiMatch
        ? (singlePlayer || storedPlayer2 || 'Player 2')
        : (storedPlayer2 || 'Player 2');

    if (ui.player1Name) ui.player1Name.textContent = player1Name;
    if (ui.player2Name) ui.player2Name.textContent = player2Name;
}

function hydrateWinningScore() {
    const stored = sessionStorage.getItem('winningScore');
    const parsed = stored ? parseInt(stored, 10) : NaN;
    winningScore = !Number.isNaN(parsed) && parsed > 0 ? parsed : DEFAULT_WINNING_SCORE;
}

function showGameOverModal(winner: 'player1' | 'player2') {
    if (!gameOverUI.overlay) return;

    const winnerName = winner === 'player1'
        ? (ui.player1Name?.textContent || 'Player 1')
        : (ui.player2Name?.textContent || 'Player 2');

    if (gameOverUI.title)
        gameOverUI.title.textContent = `${winnerName} kazandı!`;

    if (gameOverUI.score)
        gameOverUI.score.textContent = `${scores.player1} - ${scores.player2}`;

    gameOverUI.overlay.classList.remove('hidden');
}

function hideGameOverModal() {
    gameOverUI.overlay?.classList.add('hidden');
}

function navigateToGameOptions() {
    const path = '/game-options';
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

function captureBasePaddleHeights() {
    if (ui.paddle1) basePaddleHeights.player1 = ui.paddle1.clientHeight;
    if (ui.paddle2) basePaddleHeights.player2 = ui.paddle2.clientHeight;
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

function initFreezeUI() {
    freezeUI.p1 = document.getElementById('freezeOverlayP1') as HTMLDivElement;
    freezeUI.p2 = document.getElementById('freezeOverlayP2') as HTMLDivElement;
}

function initPowerupUI() {
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

function hydratePowerups() {
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

function isFrozen(player: 'player1' | 'player2') {
    return freezeState.active && freezeState.target === player;
}

function updateFreeze(now: number) {
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

function clearFreeze() {
    freezeState.active = false;
    freezeState.target = null;
    freezeState.expiresAt = 0;
    freezeUI.p1?.classList.add('hidden');
    freezeUI.p2?.classList.add('hidden');
}

function maybeApplyFreeze(scorer: 'player1' | 'player2', target: 'player1' | 'player2', now: number) {
    if (!powerups.freeze) return;
    if (freezeUsed[scorer]) return;
    if (freezeState.active) return;

    const streak = scorer === 'player1' ? streaks.player1 : streaks.player2;
    if (streak < 3) return;
    if (streak % 3 !== 0) return; // only on every 3rd consecutive score (3,6,9,...)

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

function maybeApplyMegaPaddle(player: 'player1' | 'player2', now: number) {
    if (!powerups.megaPaddle) return;

    const state = megaState[player];
    if (state.active) return;

    const streak = player === 'player1' ? streaks.player1 : streaks.player2;
    if (streak < 5) return;
    if (streak % 5 !== 0) return;

    state.active = true;
    state.expiresAt = now + 7000;

    const paddleEl = player === 'player1' ? ui.paddle1 : ui.paddle2;
    const baseHeight = player === 'player1' ? basePaddleHeights.player1 : basePaddleHeights.player2;
    if (paddleEl) {
        const newHeight = (baseHeight || paddleEl.clientHeight) * 2;
        paddleEl.style.height = `${newHeight}px`;
        paddleEl.classList.add('mega-active');
        clampPaddlePosition(player);
    }
}

function clearMega(player: 'player1' | 'player2') {
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

function updateMega(now: number) {
    (['player1', 'player2'] as const).forEach((player) => {
        const state = megaState[player];
        if (!state.active) return;
        if (now >= state.expiresAt) {
            clearMega(player);
        }
    });
}