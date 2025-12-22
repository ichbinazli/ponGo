// Game Elements
const gameBoard = document.getElementById('gameBoard');
const ball = document.getElementById('ball');
const paddle1 = document.getElementById('paddle1');
const paddle2 = document.getElementById('paddle2');
const player1ScoreElem = document.getElementById('player1Score');
const player2ScoreElem = document.getElementById('player2Score');
const startButton = document.getElementById('startButton');
// Game Constants
const boardWidth = gameBoard.clientWidth;
const boardHeight = gameBoard.clientHeight;
const paddleHeight = paddle1.clientHeight;
const ballSize = ball.clientWidth;
const paddleSpeed = 8;
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
// Controller State
const keysPressed = {};
// --- Event Listeners ---
document.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true;
});
document.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
});
startButton.addEventListener('click', startGame);
// --- Game Logic ---
function startGame() {
    if (gameRunning)
        return;
    gameRunning = true;
    player1Score = 0;
    player2Score = 0;
    updateScoreboard();
    resetBall(true); // Start moving immediately
    gameLoop();
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
}
function movePaddles() {
    // Player 1 (W, S)
    if (keysPressed['w'] && paddle1Y > 0) {
        paddle1Y -= paddleSpeed;
    }
    if (keysPressed['s'] && paddle1Y < boardHeight - paddleHeight) {
        paddle1Y += paddleSpeed;
    }
    // Player 2 (ArrowUp, ArrowDown)
    if (keysPressed['ArrowUp'] && paddle2Y > 0) {
        paddle2Y -= paddleSpeed;
    }
    if (keysPressed['ArrowDown'] && paddle2Y < boardHeight - paddleHeight) {
        paddle2Y += paddleSpeed;
    }
}
function gameLoop() {
    if (!gameRunning)
        return;
    // --- Move Paddles ---
    movePaddles();
    // --- Move Ball ---
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    // --- Collision Detection ---
    // Top/Bottom walls
    if (ballY <= 0 || ballY >= boardHeight - ballSize) {
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
// Initialize paddle positions
paddle1.style.top = `${paddle1Y}px`;
paddle2.style.top = `${paddle2Y}px`;
ball.style.left = `${ballX}px`;
ball.style.top = `${ballY}px`;
export {};
//# sourceMappingURL=main.js.map