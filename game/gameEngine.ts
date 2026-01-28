import { ui } from './ui.js';
import { keysPressedHuman, keysPressedAI, paddles, ball, gameState, scores } from './types.js';
import { update } from './modes/human2ai.js';

const WINNING_SCORE = 5;

let gameRunning = false;
let animationId: number | null = null;
let gameFinished = false;
let lastTime = performance.now();

function isKeyPressed(key: 'w' | 's') {
    return gameState.gameMode === 'h2ai'
        ? keysPressedAI[key]
        : keysPressedHuman[key];
}

function movePoddle1() {
    if (isKeyPressed('w') && paddles.paddle1Y > 0)
        paddles.paddle1Y -= paddles.paddleSpeed;
    if (isKeyPressed('s') && paddles.paddle1Y < ui.gameBoard.clientHeight - ui.paddle1.clientHeight)
        paddles.paddle1Y += paddles.paddleSpeed;
}

function movePoddle2() {
    if (keysPressedHuman['ArrowUp'] && paddles.paddle2Y > 0)
        paddles.paddle2Y -= paddles.paddleSpeed;
    if (keysPressedHuman['ArrowDown'] && paddles.paddle2Y < ui.gameBoard.clientHeight - ui.paddle2.clientHeight)
        paddles.paddle2Y += paddles.paddleSpeed;
}

function updateScoreboard() {
    ui.player1Score.textContent = scores.player1.toString();
    ui.player2Score.textContent = scores.player2.toString();

    if (scores.player1 >= WINNING_SCORE) {
        finishGame('player1');
        return;
    }
    if (scores.player2 >= WINNING_SCORE) {
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

function resetMatchState() {
    scores.player1 = 0;
    scores.player2 = 0;
    paddles.paddle1Y = ui.gameBoard.clientHeight / 2 - ui.paddle1.clientHeight / 2;
    paddles.paddle2Y = ui.gameBoard.clientHeight / 2 - ui.paddle2.clientHeight / 2;
    updateScoreboard();
    centerBallAndStop();
    gameFinished = false;
}

function startGame() {
    if (gameRunning) return;
    if (gameFinished) resetMatchState();

    gameRunning = true;
    ui.startButton.textContent = 'Stop';
    if (ball.velocityX === 0 && ball.velocityY === 0)
        resetBall(Math.random() > 0.5);
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

function stopGame() {
    if (!gameRunning && animationId === null) return;

    gameRunning = false;
    ui.startButton.textContent = 'Start Game';
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    centerBallAndStop();
}

function finishGame(winner: 'player1' | 'player2') {
    gameFinished = true;
    stopGame();
    alert(`${winner === 'player1' ? 'Player 1' : 'Player 2'} wins!`);
}

function syncPositions() {
    ui.paddle1.style.top = `${paddles.paddle1Y}px`;
    ui.paddle2.style.top = `${paddles.paddle2Y}px`;
    ui.ball.style.left = `${ball.x}px`;
    ui.ball.style.top = `${ball.y}px`;
}

function gameLoop(time: number) {
    if (!gameRunning) return;

    movePoddle2();
    movePoddle1();

    const deltaTime = time - lastTime;
    lastTime = time;
    update(deltaTime);

    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    if (ball.y <= 0) {
        ball.y = 0;
        ball.velocityY *= -1;
    } else if (ball.y >= ui.gameBoard.clientHeight - ui.ball.clientHeight) {
        ball.y = ui.gameBoard.clientHeight - ui.ball.clientHeight;
        ball.velocityY *= -1;
    }

    if (
        ball.x <= ui.paddle1.offsetLeft + ui.paddle1.clientWidth &&
        ball.x >= ui.paddle1.offsetLeft &&
        ball.y + ui.ball.clientHeight >= paddles.paddle1Y &&
        ball.y <= paddles.paddle1Y + ui.paddle1.clientHeight
    ) {
        ball.velocityX *= -1;
        const deltaY = ball.y - (paddles.paddle1Y + ui.paddle1.clientHeight / 2);
        ball.velocityY = deltaY * 0.3;
    }

    if (
        ball.x + ui.ball.clientWidth >= ui.paddle2.offsetLeft &&
        ball.x <= ui.paddle2.offsetLeft + ui.paddle2.clientWidth &&
        ball.y + ui.ball.clientHeight >= paddles.paddle2Y &&
        ball.y <= paddles.paddle2Y + ui.paddle2.clientHeight
    ) {
        ball.velocityX *= -1;
        const deltaY = ball.y - (paddles.paddle2Y + ui.paddle2.clientHeight / 2);
        ball.velocityY = deltaY * 0.3;
    }

    if (ball.x < 0) {
        scores.player2 += 1;
        updateScoreboard();
        if (!gameFinished) resetBall(true);
    }

    if (ball.x > ui.gameBoard.clientWidth) {
        scores.player1 += 1;
        updateScoreboard();
        if (!gameFinished) resetBall(false);
    }

    syncPositions();

    if (gameRunning)
        animationId = requestAnimationFrame(gameLoop);
}

ui.startButton?.addEventListener('click', () => {
    if (gameRunning) stopGame();
    else startGame();
});

resetMatchState();