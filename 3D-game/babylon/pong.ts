// Initialize game when elements are available
function initializePong(): void {
    const canvasElement = document.getElementById('pongCanvas') as HTMLCanvasElement | null;
    const scoreElement = document.getElementById('score') as HTMLElement | null;
    const startBtn = document.getElementById('startBtn') as HTMLButtonElement | null;
    const endBtn = document.getElementById('endBtn') as HTMLButtonElement | null;

    if (!canvasElement || !scoreElement || !startBtn || !endBtn) {
        console.error('Required elements not found');
        return;
    }

    const canvas = canvasElement;
    const ctx = canvas.getContext('2d')!;
    const score = scoreElement;

    // Game state
    let gameRunning = false;

    // Game settings
    const paddleWidth = 10;
    const paddleHeight = 100;
    const ballSize = 10;
    let player1Y = (canvas.height - paddleHeight) / 2;
    let player2Y = (canvas.height - paddleHeight) / 2;
    let ballX = canvas.width / 2;
    let ballY = canvas.height / 2;
    let ballSpeedX = 5;
    let ballSpeedY = 5;
    let player1Score = 0;
    let player2Score = 0;

    // Draw everything
    function draw(): void {
        // Clear the canvas with black background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw game board border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // Draw paddles
        ctx.fillStyle = 'white';
        ctx.fillRect(0, player1Y, paddleWidth, paddleHeight);
        ctx.fillRect(canvas.width - paddleWidth, player2Y, paddleWidth, paddleHeight);

        // Draw ball
        ctx.fillRect(ballX, ballY, ballSize, ballSize);

        // Draw center line (dashed)
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw game status text
        if (!gameRunning) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Click START to begin', canvas.width / 2, canvas.height / 2);
        }

        // Update score display
        score.innerText = `Player 1: ${player1Score} | Player 2: ${player2Score}`;
    }

    // Update game state
    function update(): void {
        if (!gameRunning) return;

        // Move ball
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        // Ball collision with top and bottom walls
        if (ballY <= 0 || ballY + ballSize >= canvas.height) {
            ballSpeedY = -ballSpeedY;
            // Clamp ball position to stay within bounds
            if (ballY <= 0) ballY = 0;
            if (ballY + ballSize >= canvas.height) ballY = canvas.height - ballSize;
        }

        // Ball collision with paddles
        if (ballX <= paddleWidth && ballY + ballSize >= player1Y && ballY <= player1Y + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            ballX = paddleWidth;
        }
        if (ballX + ballSize >= canvas.width - paddleWidth && ballY + ballSize >= player2Y && ballY <= player2Y + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            ballX = canvas.width - paddleWidth - ballSize;
        }

        // Scoring
        if (ballX < 0) {
            player2Score++;
            resetBall();
        } else if (ballX > canvas.width) {
            player1Score++;
            resetBall();
        }
    }

    // Reset ball to center
    function resetBall(): void {
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 5;
        ballSpeedY = (Math.random() > 0.5 ? 1 : -1) * 5;
    }

    // Handle input
    function handleKeyDown(event: KeyboardEvent): void {
        switch (event.key) {
            case 'w':
            case 'W':
                if (player1Y > 0) player1Y -= 20;
                break;
            case 's':
            case 'S':
                if (player1Y < canvas.height - paddleHeight) player1Y += 20;
                break;
            case 'ArrowUp':
                if (player2Y > 0) player2Y -= 20;
                break;
            case 'ArrowDown':
                if (player2Y < canvas.height - paddleHeight) player2Y += 20;
                break;
        }
    }

    // Start game function
    function startGame(): void {
        gameRunning = true;
        player1Score = 0;
        player2Score = 0;
        player1Y = (canvas.height - paddleHeight) / 2;
        player2Y = (canvas.height - paddleHeight) / 2;
        resetBall();
    }

    // End game function
    function endGame(): void {
        gameRunning = false;
        player1Y = (canvas.height - paddleHeight) / 2;
        player2Y = (canvas.height - paddleHeight) / 2;
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
    }

    // Game loop
    function gameLoop(): void {
        draw();
        update();
        requestAnimationFrame(gameLoop);
    }

    // Event listeners
    startBtn.addEventListener('click', startGame);
    endBtn.addEventListener('click', endGame);
    document.addEventListener('keydown', handleKeyDown);

    // Start the game loop
    gameLoop();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePong);
} else {
    initializePong();
}

export {};