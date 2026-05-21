import { initUI, ui } from './ui';
import { initGameObjects, keysPressedHuman, keysPressedAI, paddles, ball, gameState, scores, playersInfo } from './types';
import { update } from './modes/human2ai';
import { initFreezeUI, initPowerupUI, hydratePowerups, isFrozen, streaks, freezeUsed, megaEarned, updatePowerupBoard, clearFreeze, clearMega, freezeState, freezeUI, updateFreeze, updateMega, maybeApplyFreeze, maybeApplyMegaPaddle, basePaddleHeights } from './powerUps';
import { initGameOverUI, gameOverUI, hideGameOverModal } from './gameOver';
import { saveMatch, MatchPayload, tournamentMatchSave, TournamentMatchSavePayload } from './apiCalls';
import { I18n } from '../utils/i18n';

const DEFAULT_WINNING_SCORE = 5;
let winningScore = DEFAULT_WINNING_SCORE;
let gameRunning = false;
let animationId: number | null = null;
let gameFinished = false;
let lastTime = performance.now();
let spaceHintDismissed = false;
let spaceToggleBound = false;
let matchStartTime = 0;
const FIXED_FRAME_MS = 1000 / 60;
const MAX_FRAME_FACTOR = 2;

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
    return gameState.matchType === 'h2ai'
        ? keysPressedAI[key]
        : keysPressedHuman[key];
}

function movePoddle1(deltaTime: number) {
    if (isFrozen('player1')) return;
    if (isKeyPressed('w') && paddles.paddle1Y > 0)
        paddles.paddle1Y -= paddles.paddleSpeed * deltaTime;
    if (isKeyPressed('s') && paddles.paddle1Y < ui.gameBoard.clientHeight - ui.paddle1.clientHeight)
        paddles.paddle1Y += paddles.paddleSpeed * deltaTime;
    paddles.paddle1Y = Math.min(
        Math.max(paddles.paddle1Y, 0),
        ui.gameBoard.clientHeight - ui.paddle1.clientHeight
    );
}

function movePoddle2(deltaTime: number) {
    if (isFrozen('player2')) return;
    if (keysPressedHuman['ArrowUp'] && paddles.paddle2Y > 0)
        paddles.paddle2Y -= paddles.paddleSpeed * deltaTime;
    if (keysPressedHuman['ArrowDown'] && paddles.paddle2Y < ui.gameBoard.clientHeight - ui.paddle2.clientHeight)
        paddles.paddle2Y += paddles.paddleSpeed * deltaTime;
    paddles.paddle2Y = Math.min(
        Math.max(paddles.paddle2Y, 0),
        ui.gameBoard.clientHeight - ui.paddle2.clientHeight
    );
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

export function resetMatchState() {
    scores.player1 = 0;
    scores.player2 = 0;
    streaks.player1 = 0;
    streaks.player2 = 0;
    freezeUsed.player1 = false;
    freezeUsed.player2 = false;
    megaEarned.player1 = false;
    megaEarned.player2 = false;
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

export function startGame() {
    if (gameRunning) return;
    if (gameFinished) resetMatchState();

    hideGameOverModal();
    dismissSpaceHint();
    showScoreboard();

    gameRunning = true;
    if (ball.velocityX === 0 && ball.velocityY === 0) {
        resetBall(Math.random() > 0.5);
        matchStartTime = Date.now();
    }
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
}

function saveMatchResult() {
    const gameMode = sessionStorage.getItem('gameMode') || 'modern';
    const aiDifficulty = sessionStorage.getItem('aiDifficulty') || null;
    if (playersInfo.mainPlayer_side === 'left') {
        playersInfo.mainPlayer_score = scores.player1;
        playersInfo.otherPlayer_score = scores.player2;
        playersInfo.mainPlayer_power_up_freeze = freezeUsed.player1;
        playersInfo.mainPlayer_power_up_mega = megaEarned.player1;
        playersInfo.otherPlayer_power_up_freeze = freezeUsed.player2;
        playersInfo.otherPlayer_power_up_mega = megaEarned.player2;
    } else {
        playersInfo.mainPlayer_score = scores.player2;
        playersInfo.otherPlayer_score = scores.player1;
        playersInfo.mainPlayer_power_up_freeze = freezeUsed.player2;
        playersInfo.mainPlayer_power_up_mega = megaEarned.player2;
        playersInfo.otherPlayer_power_up_freeze = freezeUsed.player1;
        playersInfo.otherPlayer_power_up_mega = megaEarned.player1;
    }
    const matchPayload: MatchPayload = {
        player1_id: playersInfo.mainPlayer_id,
        player2_id: playersInfo.otherPlayer_id,
        player1_name: playersInfo.mainPlayer_name,
        player2_name: playersInfo.otherPlayer_name,
        player1_score: playersInfo.mainPlayer_score,
        player2_score: playersInfo.otherPlayer_score,
        game_mode: gameMode,
        match_type: gameState.matchType,
        aiDifficultly: aiDifficulty,
        winning_score: winningScore,
        player1_power_up_freeze: playersInfo.mainPlayer_power_up_freeze,
        player1_power_up_mega: playersInfo.mainPlayer_power_up_mega,
        player2_power_up_freeze: playersInfo.otherPlayer_power_up_freeze,
        player2_power_up_mega: playersInfo.otherPlayer_power_up_mega,
        started_at: new Date().toISOString(),
    };
    saveMatch(matchPayload);
}


function finishGame(winner: 'player1' | 'player2') {
    gameFinished = true;
    stopGame();
    clearFreeze();
    clearMega('player1');
    clearMega('player2');
    centerBallAndStop();

    if (gameState.gameMode === 'tournament') {
        sessionStorage.setItem('tournamentMatchWinner', winner);
        sessionStorage.setItem('tournamentMatchScoreP1', String(scores.player1));
        sessionStorage.setItem('tournamentMatchScoreP2', String(scores.player2));

        const matchId = parseInt(sessionStorage.getItem('currentMatchId') || '0');
        const winnerParticipantId = winner === 'player1'
            ? parseInt(sessionStorage.getItem('player1_id') || '0')
            : parseInt(sessionStorage.getItem('player2_id') || '0');
        const durationSeconds = Math.round((Date.now() - matchStartTime) / 1000);

        const payload: TournamentMatchSavePayload = {
            participant1Score: scores.player1,
            participant2Score: scores.player2,
            winnerParticipantId,
            durationSeconds,
            winningScore,
            gameMode: 'tournament',
        };

        tournamentMatchSave(matchId, payload).then(response => {
            if (response) {
                sessionStorage.setItem('tournamentMatchApiResponse', JSON.stringify(response));
            }
        }).catch(err => {
            console.error('Tournament match save failed:', err);
        }).finally(() => {
            window.history.replaceState({}, '', '/tournament');
            window.dispatchEvent(new PopStateEvent('popstate'));
        });
    } else {
        saveMatchResult();
        showGameOverModal(winner);
    }
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

    const elapsedMs = time - lastTime;
    const deltaTime = Math.min(elapsedMs / FIXED_FRAME_MS, MAX_FRAME_FACTOR);
    lastTime = time;

    movePoddle2(deltaTime);
    movePoddle1(deltaTime);

    if (gameState.matchType === 'h2ai') {
        update(elapsedMs);
    }

    ball.x += ball.velocityX * deltaTime;
    ball.y += ball.velocityY * deltaTime;

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

    const ballCenterY = ball.y + ui.ball.clientHeight / 2;
    const hitPaddle1 = ballRight >= paddle1Left && ballLeft <= paddle1Right && ballBottom >= paddle1Top && ballTop <= paddle1Bottom;
    if (hitPaddle1) {
        ball.velocityX *= -1;
        const deltaY = ballCenterY - (paddles.paddle1Y + ui.paddle1.clientHeight / 2);
        ball.velocityY = deltaY * 0.3;
        if (ballBottom >= ui.gameBoard.clientHeight - ui.ball.clientHeight && ball.velocityY > 0)
            ball.velocityY = -Math.abs(ball.velocityY);
        if (ballTop <= 0 && ball.velocityY < 0)
            ball.velocityY = Math.abs(ball.velocityY);
    }

    const hitPaddle2 = ballRight >= paddle2Left && ballLeft <= paddle2Right && ballBottom >= paddle2Top && ballTop <= paddle2Bottom;
    if (hitPaddle2) {
        ball.velocityX *= -1;
        const deltaY = ballCenterY - (paddles.paddle2Y + ui.paddle2.clientHeight / 2);
        ball.velocityY = deltaY * 0.3;
        if (ballBottom >= ui.gameBoard.clientHeight - ui.ball.clientHeight && ball.velocityY > 0)
            ball.velocityY = -Math.abs(ball.velocityY);
        if (ballTop <= 0 && ball.velocityY < 0)
            ball.velocityY = Math.abs(ball.velocityY);
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

function setPlayerNames() {
    const storedPlayer1 = sessionStorage.getItem('player1');
    const storedPlayer2 = sessionStorage.getItem('player2');
    const singlePlayer = sessionStorage.getItem('playerName');
    const matchType = sessionStorage.getItem('matchType');
    const i18n = I18n.getInstance();

    const isAiMatch = matchType === 'h2ai';

    const player1Name = isAiMatch
        ? 'AI'
        : (storedPlayer1 || i18n.t('game.defaultPlayer1'));

    const player2Name = isAiMatch
        ? (singlePlayer || storedPlayer2 || i18n.t('game.defaultPlayer2'))
        : (storedPlayer2 || i18n.t('game.defaultPlayer2'));

    gameState.matchType = isAiMatch ? 'h2ai' : 'h2h';

    const mainPlayerSide = sessionStorage.getItem('playerSide') || 'right';
    playersInfo.mainPlayer_side = mainPlayerSide === 'left' ? 'left' : 'right';
    playersInfo.mainPlayer_id = JSON.parse(localStorage.getItem('user') || '{}').id || 0;
    if( mainPlayerSide === 'left') {
        playersInfo.mainPlayer_name = player1Name;
        playersInfo.otherPlayer_name = player2Name;
    } else {
        playersInfo.mainPlayer_name = player2Name;
        playersInfo.otherPlayer_name = player1Name;
    }

    if (isAiMatch){
        playersInfo.otherPlayer_id = 1;
    } else {
        const invitedUserId = sessionStorage.getItem('invitedUserId');
        if (invitedUserId) 
            playersInfo.otherPlayer_id = parseInt(invitedUserId, 0);
        else
            playersInfo.otherPlayer_id = null;
    }

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

    const i18n = I18n.getInstance();
    const winnerName = winner === 'player1'
        ? (ui.player1Name?.textContent || i18n.t('game.defaultPlayer1'))
        : (ui.player2Name?.textContent || i18n.t('game.defaultPlayer2'));

    if (gameOverUI.title)
        gameOverUI.title.textContent = `${winnerName} ${i18n.t('game.won')}`;

    if (gameOverUI.score)
        gameOverUI.score.textContent = `${scores.player1} - ${scores.player2}`;

    gameOverUI.overlay.classList.remove('hidden');
}

function captureBasePaddleHeights() {
    if (ui.paddle1) basePaddleHeights.player1 = ui.paddle1.clientHeight;
    if (ui.paddle2) basePaddleHeights.player2 = ui.paddle2.clientHeight;
}
