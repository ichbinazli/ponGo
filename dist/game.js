const gameBoard = document.getElementById('gameBoard');
const ball = document.getElementById('ball');
const paddle1 = document.getElementById('paddle1');
const paddle2 = document.getElementById('paddle2');
const player1ScoreElem = document.getElementById('player1Score');
const player2ScoreElem = document.getElementById('player2Score');
const player1NameElem = document.getElementById('player1Name');
const player2NameElem = document.getElementById('player2Name');
const backButton = document.getElementById('backButton');
const startButton = document.getElementById('startButton');
const gameModeLabel = document.getElementById('gameModeLabel');
const gameOverModal = document.getElementById('gameOverModal');
const winnerText = document.getElementById('winnerText');
const finalStats = document.getElementById('finalStats');
const backToTournamentButton = document.getElementById('backToTournamentButton');
const boardWidth = gameBoard.clientWidth;
const boardHeight = gameBoard.clientHeight;
const paddleHeight = paddle1.clientHeight;
const ballSize = ball.clientWidth;
const paddleSpeed = 11;
const initialBallSpeedX = 5;
const initialBallSpeedY = 5;
// Game State
let ballX = boardWidth / 2 - ballSize / 2;
let ballY = boardHeight / 2 - ballSize / 2;
let ballSpeedX = 0;
let ballSpeedY = 0;
let paddle1Y = boardHeight / 2 - paddleHeight / 2;
let paddle2Y = boardHeight / 2 - paddleHeight / 2;
let player1Score = 0;
let player2Score = 0;
let gameRunning = false;
function isGameMode(value) {
    return value === 'h2ai' || value === 'h2h' || value === 'tournament';
}
// Resolve game mode and player names from sessionStorage (fallbacks for direct access)
const storedMode = sessionStorage.getItem('gameMode');
const resolvedMode = isGameMode(storedMode) ? storedMode : 'h2h';
const player1Name = sessionStorage.getItem('player1') || 'Player 1';
const player2Name = sessionStorage.getItem('player2') || 'Player 2';
let currentGameMode = resolvedMode;
// Inject player names into scoreboard
player1NameElem.textContent = player1Name;
player2NameElem.textContent = player2Name;
showGame(resolvedMode);
function showGame(mode) {
    currentGameMode = mode;
    // Update game mode label
    const modeLabels = {
        'h2ai': 'vs AI',
        'h2h': 'vs Human',
        'tournament': 'Tournament Mode'
    };
    gameModeLabel.textContent = modeLabels[mode];
    // Reset game state
    player1Score = 0;
    player2Score = 0;
    updateScoreboard();
    resetBall(true);
    // Initialize paddle positions
    paddle1.style.top = `${paddle1Y}px`;
    paddle2.style.top = `${paddle2Y}px`;
    ball.style.left = `${ballX}px`;
    ball.style.top = `${ballY}px`;
    // Auto-complete BYE match in tournament mode
    if (resolvedMode === 'tournament' && player2Name.trim() === '') {
        setTimeout(() => endGame(player1Name, 10, 0), 100);
    }
}
const keysPressed = {};
// --- Event Listeners ---
document.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true;
});
document.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
});
startButton.addEventListener('click', toggleGame);
backButton.addEventListener('click', () => {
    window.location.href = './index.html';
});
backToTournamentButton.addEventListener('click', () => {
    window.location.href = './game_modes/tournament.html';
});
// --- Game Logic ---
function toggleGame() {
    if (gameRunning) {
        // End the game
        gameRunning = false;
        startButton.textContent = 'Start Game';
    }
    else {
        if (player2Name.trim() === '') {
            alert('BYE match will auto-complete; no gameplay needed.');
            return;
        }
        // Start the game
        gameRunning = true;
        startButton.textContent = 'End Game';
        if (ballSpeedX === 0 && ballSpeedY === 0) {
            resetBall(true);
        }
        gameLoop();
    }
}
function resetBall(serveRight) {
    ballX = boardWidth / 2 - ballSize / 2;
    ballY = boardHeight / 2 - ballSize / 2;
    // Serve in the opposite direction of who scored
    const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8); // -22.5 to 22.5 degrees
    ballSpeedX = initialBallSpeedX * (serveRight ? 1 : -1);
    ballSpeedY = initialBallSpeedY * Math.sin(angle);
}
function updateScoreboard() {
    player1ScoreElem.textContent = player1Score.toString();
    player2ScoreElem.textContent = player2Score.toString();
    // Check if game is over (score reaches 10)
    if (player1Score >= 3) {
        endGame(player1Name, player1Score, player2Score);
    }
    else if (player2Score >= 3) {
        endGame(player2Name, player1Score, player2Score);
    }
}
function movePaddles() {
    // Player 1 movement based on game mode
    if (currentGameMode === 'h2h' || currentGameMode === 'tournament') {
        // h2h Mode: Player 1 uses W, S
        if (keysPressed['w'] && paddle1Y > 0) {
            paddle1Y -= paddleSpeed;
        }
        if (keysPressed['s'] && paddle1Y < boardHeight - paddleHeight) {
            paddle1Y += paddleSpeed;
        }
    }
    // Player 2 (ArrowUp, ArrowDown)
    if (player2Name.trim() !== '') {
        if (keysPressed['ArrowUp'] && paddle2Y > 0) {
            paddle2Y -= paddleSpeed;
        }
        if (keysPressed['ArrowDown'] && paddle2Y < boardHeight - paddleHeight) {
            paddle2Y += paddleSpeed;
        }
    }
    // Clamp paddle positions to prevent going out of bounds
    paddle1Y = Math.max(0, Math.min(boardHeight - paddleHeight, paddle1Y));
    paddle2Y = Math.max(0, Math.min(boardHeight - paddleHeight, paddle2Y));
}
const DIFFICULTY_SETTINGS = {
    ['EASY']: {
        aiSpeed: 4,
        aiErrorMargin: 50,
        ballSpeedMult: 0.8
    },
    ['MEDIUM']: {
        aiSpeed: 7,
        aiErrorMargin: 20,
        ballSpeedMult: 1.0
    },
    ['HARD']: {
        aiSpeed: 11,
        aiErrorMargin: 5,
        ballSpeedMult: 1.3
    }
};
function gameLoop() {
    if (!gameRunning)
        return;
    // --- Move Paddles ---
    movePaddles();
    // AI Movement (only in AI mode)
    if (currentGameMode === 'h2ai') {
        const diff = DIFFICULTY_SETTINGS['EASY'];
        const targetY = ballY;
        const dy = targetY - paddle1Y;
        // AI movement with smoothing and speed limit
        const move = Math.sign(dy) * Math.min(Math.abs(dy), diff.aiSpeed);
        paddle1Y += move;
        // Clamp paddle1Y to prevent going out of bounds
        paddle1Y = Math.max(0, Math.min(boardHeight - paddleHeight, paddle1Y));
    }
    // --- Move Ball ---
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    // --- Collision Detection ---
    // Top/Bottom walls
    if (ballY <= 0) {
        ballY = 0;
        ballSpeedY *= -1;
    }
    else if (ballY >= boardHeight - ballSize) {
        ballY = boardHeight - ballSize;
        ballSpeedY *= -1;
    }
    // Paddle 1 collision
    if (ballX <= paddle1.offsetLeft + paddle1.clientWidth &&
        ballX >= paddle1.offsetLeft &&
        ballY + ballSize >= paddle1Y &&
        ballY <= paddle1Y + paddleHeight) {
        ballSpeedX *= -1;
        // Optional: change angle based on where it hits the paddle
        const deltaY = ballY - (paddle1Y + paddleHeight / 2);
        ballSpeedY = deltaY * 0.3;
    }
    // Paddle 2 collision
    if (ballX + ballSize >= paddle2.offsetLeft &&
        ballX <= paddle2.offsetLeft + paddle2.clientWidth &&
        ballY + ballSize >= paddle2Y &&
        ballY <= paddle2Y + paddleHeight) {
        ballSpeedX *= -1;
        // Optional: change angle based on where it hits the paddle
        const deltaY = ballY - (paddle2Y + paddleHeight / 2);
        ballSpeedY = deltaY * 0.3;
    }
    // --- Scoring ---
    // Player 2 scores
    if (ballX < 0) {
        player2Score++;
        updateScoreboard();
        resetBall(true); // Serve to the right
    }
    // Player 1 scores
    if (ballX > boardWidth) {
        player1Score++;
        updateScoreboard();
        resetBall(false); // Serve to the left
    }
    // --- Update DOM ---
    paddle1.style.top = `${paddle1Y}px`;
    paddle2.style.top = `${paddle2Y}px`;
    ball.style.left = `${ballX}px`;
    ball.style.top = `${ballY}px`;
    // --- Next Frame ---
    requestAnimationFrame(gameLoop);
}
function endGame(winner, player1FinalScore, player2FinalScore) {
    gameRunning = false;
    startButton.textContent = 'Start Game';
    if (resolvedMode === 'tournament') {
        const displayPlayer2Name = player2Name.trim() === '' ? 'BYE' : player2Name;
        // Save to sessionStorage
        sessionStorage.setItem('winner', winner);
        sessionStorage.setItem('player1Score', player1FinalScore.toString());
        sessionStorage.setItem('player2Score', player2FinalScore.toString());
        // If tournament mode, save match result
        if (resolvedMode === 'tournament') {
            const currentRound = parseInt(sessionStorage.getItem('currentRound') || '0');
            const currentMatch = parseInt(sessionStorage.getItem('currentMatch') || '0');
            const playedMatches = JSON.parse(sessionStorage.getItem('playedMatches') || '[]');
            playedMatches.push({
                roundIndex: currentRound,
                matchIndex: currentMatch,
                player1: player1Name,
                player2: player2Name,
                winner: winner,
                player1Score: player1FinalScore,
                player2Score: player2FinalScore
            });
            sessionStorage.setItem('playedMatches', JSON.stringify(playedMatches));
            // Update bracket in sessionStorage if tournament mode
            if (resolvedMode === 'tournament') {
                // Bracket already saved in sessionStorage, it will be updated
                // when continuing tournament from tournament.ts
            }
        }
        // Show game over modal
        winnerText.textContent = `🎉 ${winner} wins!`;
        finalStats.innerHTML = `
        <div class="stats-row">
            <span class="stat-label">${player1Name}:</span>
            <span class="stat-value">${player1FinalScore}</span>
        </div>
        <div class="stats-row">
            <span class="stat-label">${displayPlayer2Name}:</span>
            <span class="stat-value">${player2FinalScore}</span>
        </div>
    `;
        gameOverModal.classList.remove('hidden');
    }
    else {
        alert(`${winner} wins! Final Score: ${player1Name} ${player1FinalScore} - ${player2Name} ${player2FinalScore}`);
        window.location.href = './index.html';
    }
}
export {};
//# sourceMappingURL=game.js.map