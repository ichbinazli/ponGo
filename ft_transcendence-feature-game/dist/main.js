const gameBoard = document.getElementById('gameBoard');
const ball = document.getElementById('ball');
const paddle1 = document.getElementById('paddle1');
const paddle2 = document.getElementById('paddle2');
const player1ScoreElem = document.getElementById('player1Score');
const player2ScoreElem = document.getElementById('player2Score');
const startButton = document.getElementById('startButton');
const boardWidth = gameBoard.clientWidth;
const boardHeight = gameBoard.clientHeight;
const paddleHeight = paddle1.clientHeight;
const ballSize = ball.clientHeight;
const paddleSpeed = 4;
const initialBallSpeedX = 3;
const initialBallSpeedY = 3;
let ballX = boardWidth / 2 - ballSize / 2;
let ballY = boardHeight / 2 - ballSize / 2;
let ballSpeedX = 0;
let ballSpeedY = 0;
let paddle1Y = boardHeight / 2 - paddleHeight / 2;
let paddle2Y = boardHeight / 2 - paddleHeight / 2;
let player1Score = 0;
let player2Score = 0;
let gameRunning = false;
const keysPressed = {};
document.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true;
});
document.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
});
startButton.addEventListener('click', startGame);
function startGame() {
    if (gameRunning) {
        gameRunning = false;
        player1Score = 0;
        player2Score = 0;
        updateScoreBoard();
        resetBall(false);
        paddle1Y = boardHeight / 2 - paddleHeight / 2;
        paddle2Y = boardHeight / 2 - paddleHeight / 2;
        paddle1.style.top = `${paddle1Y}px`;
        paddle2.style.top = `${paddle2Y}px`;
        ball.style.left = `${ballX}px`;
        ball.style.top = `${ballY}px`;
        startButton.textContent = "Start Game";
        return;
    }
    gameRunning = true;
    player1Score = 0;
    player2Score = 0;
    updateScoreBoard();
    resetBall(true);
    startButton.textContent = "End Game";
    gameLoop();
}
function resetBall(serveRight) {
    ballX = boardWidth / 2 - ballSize / 2;
    ballY = boardHeight / 2 - ballSize / 2;
    const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8);
    ballSpeedX = initialBallSpeedX * (serveRight ? 1 : -1);
    ballSpeedY = initialBallSpeedY * Math.sin(angle);
}
function updateScoreBoard() {
    player1ScoreElem.textContent = player1Score.toString();
    player2ScoreElem.textContent = player2Score.toString();
}
function movePaddles() {
    if (keysPressed['w'] && paddle1Y > 0)
        paddle1Y -= paddleSpeed;
    if (keysPressed['s'] && paddle1Y < boardHeight - paddleHeight)
        paddle1Y += paddleSpeed;
    if (keysPressed['ArrowUp'] && paddle2Y > 0)
        paddle2Y -= paddleSpeed;
    if (keysPressed['ArrowDown'] && paddle2Y < boardHeight - paddleHeight)
        paddle2Y += paddleSpeed;
}
function gameLoop() {
    if (!gameRunning)
        return;
    movePaddles();
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    if (ballY <= 0 || ballY >= boardHeight - ballSize)
        ballSpeedY *= -1;
    if (ballX <= paddle1.offsetLeft + paddle1.clientWidth &&
        ballX >= paddle1.offsetLeft &&
        ballY + ballSize >= paddle1Y &&
        ballY <= paddle1Y + paddleHeight) {
        ballSpeedX *= -1;
        const deltaY = ballY - (paddle1Y + paddleHeight / 2);
        ballSpeedY = deltaY * 0.3;
    }
    if (ballX + ballSize >= paddle2.offsetLeft &&
        ballX <= paddle2.offsetLeft + paddle2.clientWidth &&
        ballY + ballSize >= paddle2Y &&
        ballY <= paddle2Y + paddleHeight) {
        ballSpeedX *= -1;
        const deltaY = ballY - (paddle2Y + paddleHeight / 2);
        ballSpeedY = deltaY * 0.3;
    }
    if (ballX < 0) {
        player2Score++;
        updateScoreBoard();
        resetBall(true);
    }
    if (ballX + ballSize > boardWidth) {
        player1Score++;
        updateScoreBoard();
        resetBall(false);
    }
    paddle1.style.top = `${paddle1Y}px`;
    paddle2.style.top = `${paddle2Y}px`;
    ball.style.left = `${ballX}px`;
    ball.style.top = `${ballY}px`;
    requestAnimationFrame(gameLoop);
}
paddle1.style.top = `${paddle1Y}px`;
paddle2.style.top = `${paddle2Y}px`;
ball.style.left = `${ballX}px`;
ball.style.top = `${ballY}px`;
export {};
//# sourceMappingURL=main.js.map