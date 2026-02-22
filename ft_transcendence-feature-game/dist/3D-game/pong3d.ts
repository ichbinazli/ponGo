import {
    Engine,
    Scene,
    ArcRotateCamera,
    HemisphericLight,
    Vector3,
    SceneLoader,
    AbstractMesh,
    DynamicTexture,
    StandardMaterial,
    Color3
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

export class Pong3DGame {
    private engine: Engine;
    private scene: Scene;
    private canvas: HTMLCanvasElement;
    private screenMesh: AbstractMesh | null = null;
    private pongTexture: DynamicTexture | null = null;

    private textureWidth = 1024;
    private textureHeight = 512;
    private paddleWidth = 28;
    private paddleHeight = 90;
    private paddleOffset = 40;
    private leftPaddleY = this.textureHeight / 2 - this.paddleHeight / 2;
    private rightPaddleY = this.textureHeight / 2 - this.paddleHeight / 2;
    private paddleSpeed = 5;

    private ballX = this.textureWidth / 2;
    private ballY = this.textureHeight / 2;
    private ballRadius = 10;
    private ballSpeedX = 6;
    private ballSpeedY = 4;
    private initialBallSpeed = 6;

    private leftScore = 0;
    private rightScore = 0;
    private winningScore = 10;

    private isPlaying = false;
    private isGameOver = false;
    private winner: 'left' | 'right' | null = null;

    private keys: { [key: string]: boolean } = {};

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.engine = new Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true
        });
        this.scene = this.createScene();

        this.init();
    }

    private createScene(): Scene {
        const scene = new Scene(this.engine);
        scene.clearColor = new Color3(0.1, 0.1, 0.15).toColor4();

        const tempCamera = new ArcRotateCamera(
            'tempCamera',
            -Math.PI / 2,
            Math.PI / 2.5,
            3,
            Vector3.Zero(),
            scene
        );
        tempCamera.attachControl(this.canvas, true);

        const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        return scene;
    }

    private async init(): Promise<void> {
        try {
            await this.loadModel();
            this.setupScreenTexture();
            this.setupKeyboardControls();
            this.startRenderLoop();
            this.setupWindowResize();

            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        } catch (error) {
            console.error('❌ Oyun yüklenirken hata:', error);
        }
    }

    private async loadModel(): Promise<void> {
        try {
            const result = await SceneLoader.ImportMeshAsync(
                '',
                '/3D-game/',
                '3DModel.glb',
                this.scene
            );

            await this.scene.whenReadyAsync();

            const modelCameras = this.scene.cameras.filter(cam => cam.name !== 'tempCamera');

            if (modelCameras.length > 0) {
                const modelCamera = modelCameras[0];
                this.scene.activeCamera = modelCamera;

                modelCamera.attachControl(this.canvas, true);
            } else {
                console.warn('⚠️ Modelde kamera bulunamadı, varsayılan kamera kullanılacak');
            }

            this.screenMesh = result.meshes.find(
                mesh => mesh.name.toLowerCase() === 'screen'
            ) || null;

            if (!this.screenMesh) {
                console.warn('⚠️ Screen mesh bulunamadı. Mevcut mesh\'ler:');
            }

        } catch (error) {
            console.error('❌ Model yükleme hatası:', error);
            throw error;
        }
    }

    private setupScreenTexture(): void {
        if (!this.screenMesh) {
            console.warn('⚠️ Screen mesh bulunamadığı için texture oluşturulamıyor');
            return;
        }

        this.pongTexture = new DynamicTexture(
            'pongTexture',
            { width: this.textureWidth, height: this.textureHeight },
            this.scene,
            false
        );
        this.drawPongGame();

        const material = new StandardMaterial('screenMaterial', this.scene);
        material.diffuseTexture = this.pongTexture;
        material.emissiveTexture = this.pongTexture;
        material.emissiveColor = new Color3(1, 1, 1);
        material.specularColor = new Color3(0, 0, 0);
        material.backFaceCulling = false;

        this.screenMesh.material = material;
    }

    private setupKeyboardControls(): void {
        window.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            this.keys[key] = true;

            if (key === ' ' && !this.isGameOver) {
                event.preventDefault();
                this.toggleGame();
            }

            if (this.isPlaying) {
                if (key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright' ||
                    key === 'w' || key === 's' || key === 'a' || key === 'd') {
                    event.preventDefault();
                }
            }

            if (this.isGameOver) {
                if (key === 'r') {
                    event.preventDefault();
                    this.restartGame();
                } else if (key === 'h') {
                    event.preventDefault();
                    this.goToHome();
                }
            }
        });

        window.addEventListener('keyup', (event) => {
            this.keys[event.key.toLowerCase()] = false;
        });
    }

    private toggleGame(): void {
        this.isPlaying = !this.isPlaying;

        if (this.scene.activeCamera) {
            if (this.isPlaying) {
                this.scene.activeCamera.detachControl();
            } else {
                this.scene.activeCamera.attachControl(this.canvas, true);
            }
        }
    }

    private restartGame(): void {
        this.leftScore = 0;
        this.rightScore = 0;

        this.isGameOver = false;
        this.winner = null;
        this.isPlaying = false;

        this.resetBall();

        this.leftPaddleY = this.textureHeight / 2 - this.paddleHeight / 2;
        this.rightPaddleY = this.textureHeight / 2 - this.paddleHeight / 2;

        if (this.scene.activeCamera) {
            this.scene.activeCamera.attachControl(this.canvas, true);
        }
    }

    private goToHome(): void {
        window.location.href = '/home';
    }

    private resetBall(): void {
        this.ballX = this.textureWidth / 2;
        this.ballY = this.textureHeight / 2;

        this.ballSpeedX = this.initialBallSpeed * (Math.random() > 0.5 ? 1 : -1);
        this.ballSpeedY = (Math.random() * 4 - 2);
    }

    private updateBall(): void {
        if (!this.isPlaying) return;

        this.ballX += this.ballSpeedX;
        this.ballY += this.ballSpeedY;

        if (this.ballY - this.ballRadius <= 0 || this.ballY + this.ballRadius >= this.textureHeight) {
            this.ballSpeedY = -this.ballSpeedY;
        }

        if (
            this.ballX - this.ballRadius <= this.paddleOffset + this.paddleWidth &&
            this.ballY >= this.leftPaddleY &&
            this.ballY <= this.leftPaddleY + this.paddleHeight
        ) {
            this.ballSpeedX = Math.abs(this.ballSpeedX);
            const hitPos = (this.ballY - this.leftPaddleY) / this.paddleHeight;
            this.ballSpeedY = (hitPos - 0.5) * 10;
        }

        if (
            this.ballX + this.ballRadius >= this.textureWidth - this.paddleOffset - this.paddleWidth &&
            this.ballY >= this.rightPaddleY &&
            this.ballY <= this.rightPaddleY + this.paddleHeight
        ) {
            this.ballSpeedX = -Math.abs(this.ballSpeedX);
            const hitPos = (this.ballY - this.rightPaddleY) / this.paddleHeight;
            this.ballSpeedY = (hitPos - 0.5) * 10;
        }

        if (this.ballX - this.ballRadius <= 0) {
            this.rightScore++;
            this.checkWinner();
            if (!this.isGameOver) {
                this.resetBall();
            }
        }

        if (this.ballX + this.ballRadius >= this.textureWidth) {
            this.leftScore++;
            this.checkWinner();
            if (!this.isGameOver) {
                this.resetBall();
            }
        }
    }

    private checkWinner(): void {
        if (this.leftScore >= this.winningScore) {
            this.isGameOver = true;
            this.isPlaying = false;
            this.winner = 'left';
            if (this.scene.activeCamera) {
                this.scene.activeCamera.attachControl(this.canvas, true);
            }
        } else if (this.rightScore >= this.winningScore) {
            this.isGameOver = true;
            this.isPlaying = false;
            this.winner = 'right';
            if (this.scene.activeCamera) {
                this.scene.activeCamera.attachControl(this.canvas, true);
            }
        }
    }

    private updatePaddles(): void {
        if (this.keys['w']) {
            this.leftPaddleY = Math.max(0, this.leftPaddleY - this.paddleSpeed);
        }
        if (this.keys['s']) {
            this.leftPaddleY = Math.min(
                this.textureHeight - this.paddleHeight,
                this.leftPaddleY + this.paddleSpeed
            );
        }

        if (this.keys['arrowup']) {
            this.rightPaddleY = Math.max(0, this.rightPaddleY - this.paddleSpeed);
        }
        if (this.keys['arrowdown']) {
            this.rightPaddleY = Math.min(
                this.textureHeight - this.paddleHeight,
                this.rightPaddleY + this.paddleSpeed
            );
        }
    }

    private drawPongGame(): void {
        if (!this.pongTexture) return;

        const ctx = this.pongTexture.getContext() as CanvasRenderingContext2D;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.textureWidth, this.textureHeight);

        ctx.fillStyle = '#333333';
        const dashSize = 15;
        const gapSize = 10;
        for (let y = 0; y < this.textureHeight; y += dashSize + gapSize) {
            ctx.fillRect(
                this.textureWidth / 2 - 2,
                y,
                4,
                dashSize
            );
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
            `${this.leftScore}`,
            this.textureWidth / 4,
            60
        );
        ctx.fillText(
            `${this.rightScore}`,
            (this.textureWidth * 3) / 4,
            60
        );

        if (!this.isPlaying && !this.isGameOver) {
            ctx.font = 'bold 32px monospace';
            ctx.fillStyle = '#00FF00';
            ctx.fillText(
                'SPACE ile başlat',
                this.textureWidth / 2,
                this.textureHeight / 2 + 80
            );
        }

        if (this.isGameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, this.textureWidth, this.textureHeight);

            ctx.font = 'bold 64px monospace';
            ctx.fillStyle = '#FFD700';
            const winnerText = this.winner === 'left' ? 'SOL OYUNCU' : 'SAĞ OYUNCU';
            ctx.fillText(
                winnerText,
                this.textureWidth / 2,
                this.textureHeight / 2 - 80
            );

            ctx.font = 'bold 48px monospace';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(
                'KAZANDI!',
                this.textureWidth / 2,
                this.textureHeight / 2 - 20
            );

            ctx.font = 'bold 36px monospace';
            ctx.fillStyle = '#AAAAAA';
            ctx.fillText(
                `${this.leftScore} - ${this.rightScore}`,
                this.textureWidth / 2,
                this.textureHeight / 2 + 40
            );

            ctx.font = 'bold 28px monospace';
            ctx.fillStyle = '#00FF00';
            ctx.fillText(
                '[R] Tekrar Oyna',
                this.textureWidth / 2,
                this.textureHeight / 2 + 110
            );

            ctx.fillStyle = '#FF6600';
            ctx.fillText(
                '[H] Ana Menüyü Dön',
                this.textureWidth / 2,
                this.textureHeight / 2 + 150
            );

            this.pongTexture.update(false);
            return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(
            this.paddleOffset,
            this.leftPaddleY,
            this.paddleWidth,
            this.paddleHeight
        );

        ctx.fillRect(
            this.textureWidth - this.paddleOffset - this.paddleWidth,
            this.rightPaddleY,
            this.paddleWidth,
            this.paddleHeight
        );

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(
            this.ballX - this.ballRadius,
            this.ballY - this.ballRadius,
            this.ballRadius * 2,
            this.ballRadius * 2
        );

        this.pongTexture.update(false);
    }

    private startRenderLoop(): void {
        this.engine.runRenderLoop(() => {
            this.updatePaddles();

            this.updateBall();

            this.drawPongGame();

            this.scene.render();
        });
    }

    private setupWindowResize(): void {
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    public dispose(): void {
        this.pongTexture?.dispose();
        this.scene.dispose();
        this.engine.dispose();
    }
}
