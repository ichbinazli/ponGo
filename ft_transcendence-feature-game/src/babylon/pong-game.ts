/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */

export class PongGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private gameRunning = false;
    
    // Game settings
    private readonly paddleWidth = 10;
    private readonly paddleHeight = 100;
    private readonly ballSize = 10;
    private player1Y: number;
    private player2Y: number;
    private ballX: number;
    private ballY: number;
    private ballSpeedX = 5;
    private ballSpeedY = 5;
    private player1Score = 0;
    private player2Score = 0;
    
    // Key states
    private keys: { [key: string]: boolean } = {};

    constructor(width = 800, height = 600) {
        // Create canvas programmatically
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d')!;
        
        // Initialize positions
        this.player1Y = (this.canvas.height - this.paddleHeight) / 2;
        this.player2Y = (this.canvas.height - this.paddleHeight) / 2;
        this.ballX = this.canvas.width / 2;
        this.ballY = this.canvas.height / 2;
        
        // Setup controls
        this.setupControls();
        
        // Auto start
        this.startGame();
    }

    private setupControls(): void {
        // Track key states
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    private handleInput(): void {
        const speed = 8;
        
        // Player 1 controls (W/S)
        if (this.keys['w'] || this.keys['W']) {
            if (this.player1Y > 0) this.player1Y -= speed;
        }
        if (this.keys['s'] || this.keys['S']) {
            if (this.player1Y < this.canvas.height - this.paddleHeight) {
                this.player1Y += speed;
            }
        }
        
        // Player 2 controls (Arrow keys)
        if (this.keys['ArrowUp']) {
            if (this.player2Y > 0) this.player2Y -= speed;
        }
        if (this.keys['ArrowDown']) {
            if (this.player2Y < this.canvas.height - this.paddleHeight) {
                this.player2Y += speed;
            }
        }
    }

    private draw(): void {
        // Clear the canvas with black background
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw game board border
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw paddles
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, this.player1Y, this.paddleWidth, this.paddleHeight);
        this.ctx.fillRect(
            this.canvas.width - this.paddleWidth,
            this.player2Y,
            this.paddleWidth,
            this.paddleHeight
        );

        // Draw ball
        this.ctx.fillRect(this.ballX, this.ballY, this.ballSize, this.ballSize);

        // Draw center line (dashed)
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw score
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `${this.player1Score} - ${this.player2Score}`,
            this.canvas.width / 2,
            40
        );

        // Draw game status text
        if (!this.gameRunning) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, this.canvas.height / 2 - 30, this.canvas.width, 60);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText('Press SPACE to start', this.canvas.width / 2, this.canvas.height / 2 + 10);
        }
    }

    private update(): void {
        if (!this.gameRunning) return;

        // Handle input
        this.handleInput();

        // Move ball
        this.ballX += this.ballSpeedX;
        this.ballY += this.ballSpeedY;

        // Ball collision with top and bottom walls
        if (this.ballY <= 0 || this.ballY + this.ballSize >= this.canvas.height) {
            this.ballSpeedY = -this.ballSpeedY;
            if (this.ballY <= 0) this.ballY = 0;
            if (this.ballY + this.ballSize >= this.canvas.height) {
                this.ballY = this.canvas.height - this.ballSize;
            }
        }

        // Ball collision with paddles
        if (
            this.ballX <= this.paddleWidth &&
            this.ballY + this.ballSize >= this.player1Y &&
            this.ballY <= this.player1Y + this.paddleHeight
        ) {
            this.ballSpeedX = Math.abs(this.ballSpeedX);
            this.ballX = this.paddleWidth;
        }
        if (
            this.ballX + this.ballSize >= this.canvas.width - this.paddleWidth &&
            this.ballY + this.ballSize >= this.player2Y &&
            this.ballY <= this.player2Y + this.paddleHeight
        ) {
            this.ballSpeedX = -Math.abs(this.ballSpeedX);
            this.ballX = this.canvas.width - this.paddleWidth - this.ballSize;
        }

        // Scoring
        if (this.ballX < 0) {
            this.player2Score++;
            this.resetBall();
        } else if (this.ballX > this.canvas.width) {
            this.player1Score++;
            this.resetBall();
        }
    }

    private resetBall(): void {
        this.ballX = this.canvas.width / 2;
        this.ballY = this.canvas.height / 2;
        this.ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 5;
        this.ballSpeedY = (Math.random() > 0.5 ? 1 : -1) * 5;
    }

    public startGame(): void {
        if (!this.gameRunning) {
            this.gameRunning = true;
            this.player1Score = 0;
            this.player2Score = 0;
            this.resetBall();
        }
    }

    public stopGame(): void {
        this.gameRunning = false;
    }

    public toggleGame(): void {
        if (this.gameRunning) {
            this.stopGame();
        } else {
            this.startGame();
        }
    }

    public tick(): void {
        this.update();
        this.draw();
    }

    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }
}
