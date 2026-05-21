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
    Color3,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import { GamePanel } from './gamePanel';
import { saveMatch, MatchPayload } from '../game/apiCalls';
import { updateAI, AIInputState } from './aiOpponent3D';
import { playersInfo } from '../game/types';
import { I18n } from '../utils/i18n';

export class Pong3DGame {
    private engine: Engine;
    private scene: Scene;
    private canvas: HTMLCanvasElement;
    private screenMesh: AbstractMesh | null = null;
    private pongTexture: DynamicTexture | null = null;
    private gamePanel: GamePanel | null = null;

    private textureWidth = 1024;
    private textureHeight = 512;
    private paddleWidth = 32;
    private paddleHeight = 90;
    private paddleOffset = 40;
    private leftPaddleY = this.textureHeight / 2 - this.paddleHeight / 2;
    private rightPaddleY = this.textureHeight / 2 - this.paddleHeight / 2;
    private paddleSpeed = 5;

    private ballX = this.textureWidth / 2;
    private ballY = this.textureHeight / 2;
    private ballRadius = 15;
    private ballSpeedX = 7;
    private ballSpeedY = 5;
    private initialBallSpeed = 7;

    private leftScore = 0;
    private rightScore = 0;
    private winningScore = 5;

    private isPlaying = false;
    private isGameOver = false;
    private winner: 'left' | 'right' | null = null;

    private keys: { [key: string]: boolean } = {};
    private aiKeys: AIInputState = { w: false, s: false };
    private readonly fixedFrameMs = 1000 / 60;
    private readonly maxFrameFactor = 2;
    private resetCameraButton: HTMLButtonElement | null = null;
    private initialCameraState:
        | { kind: 'arc'; alpha: number; beta: number; radius: number; target: Vector3 }
        | { kind: 'other'; position: Vector3; rotation: Vector3 | null }
        | null = null;
    private readonly cameraEpsilon = 0.01;
    private readonly cameraPositionEpsilon = 0.05;

    private gameData = {
        leftPlayer: '',
        rightPlayer: '',
        matchType: 'h2h',
        aiDifficulty: "",
        mainPlayerSide: 'right',
    }

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        const storedScore = sessionStorage.getItem('winningScore');
        if (storedScore) {
            const parsedScore = parseInt(storedScore, 10);
            if (!isNaN(parsedScore) && parsedScore > 0) {
                this.winningScore = parsedScore;
            }
        }

        this.getStorageData();

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
        scene.collisionsEnabled = true;

        const tempCamera = new ArcRotateCamera(
            'tempCamera',
            -Math.PI / 2,
            Math.PI / 2.5,
            3,
            Vector3.Zero(),
            scene
        );
        tempCamera.checkCollisions = true;
        tempCamera.collisionRadius = new Vector3(0.5, 0.5, 0.5);
        tempCamera.attachControl(this.canvas, true);

        const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        return scene;
    }

    private getStorageData() {

        const invitedUserId = sessionStorage.getItem('invitedUserId') || null;
        const mainPlayerid = JSON.parse(localStorage.getItem('user') || '{}').id;
        const i18n = I18n.getInstance();

        this.gameData.mainPlayerSide = sessionStorage.getItem('playerSide') || 'right';
        this.gameData.matchType = sessionStorage.getItem('matchType') || 'h2h';
        this.gameData.aiDifficulty = sessionStorage.getItem('aiDifficulty') || 'medium';

        playersInfo.mainPlayer_id = mainPlayerid ? parseInt(mainPlayerid, 0) : null;
        if (this.gameData.matchType === 'h2ai') {
            playersInfo.otherPlayer_id = 1;
            this.gameData.leftPlayer = "AI";
            this.gameData.rightPlayer = sessionStorage.getItem('playerName') || i18n.t('game.defaultPlayer');
        }
        else {
            playersInfo.otherPlayer_id = invitedUserId ? parseInt(invitedUserId, 0) : null;
            this.gameData.leftPlayer = sessionStorage.getItem('player1') || i18n.t('game.defaultPlayer1');
            this.gameData.rightPlayer = sessionStorage.getItem('player2') || i18n.t('game.defaultPlayer2');
        }

        if (this.gameData.mainPlayerSide === 'left') {
            playersInfo.mainPlayer_side = 'left';
            playersInfo.mainPlayer_name = this.gameData.leftPlayer;
            playersInfo.otherPlayer_name = this.gameData.rightPlayer;
        } else {
            playersInfo.mainPlayer_side = 'right';
            playersInfo.mainPlayer_name = this.gameData.rightPlayer;
            playersInfo.otherPlayer_name = this.gameData.leftPlayer;
        }

    }

    private async init(): Promise<void> {
        const i18n = I18n.getInstance();
        try {
            await this.loadModel();

            this.gamePanel = new GamePanel(this.scene);

            this.gamePanel.update({
                leftPlayer: this.gameData.leftPlayer,
                rightPlayer: this.gameData.rightPlayer,
                gameMode: this.gameData.matchType === 'h2h' ? i18n.t('game.humanVsHuman') : i18n.t('game.humanVsAI'),
                winningScore: this.winningScore,
                controls: [
                    i18n.t('gamePanel.leftPaddle'),
                    i18n.t('gamePanel.rightPaddle'),
                    i18n.t('gamePanel.startPause'),
                ]
            });

            this.setupScreenTexture();
            this.setupKeyboardControls();
            this.setupCameraResetButton();
            this.captureInitialCameraState();
            this.startRenderLoop();
            this.setupWindowResize();

            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        } catch (error) {
            console.error(i18n.t('game.loadError'), error);
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

                this.enableCameraCollisions(modelCamera);
                modelCamera.attachControl(this.canvas, true);
            } else {
                console.warn(I18n.getInstance().t('game.cameraNotFound'));
            }

            this.screenMesh = result.meshes.find(
                mesh => mesh.name.toLowerCase() === 'screen'
            ) || null;

            result.meshes.forEach((mesh) => {
                if (mesh) mesh.checkCollisions = true;
            });

            if (!this.screenMesh) {
                console.warn('Screen mesh not found. Available meshes:');
                result.meshes.forEach(mesh => {
                    console.warn('Mesh name:', mesh.name);
                });
            }

        } catch (error) {
            console.error('Model loading error:', error);
            throw error;
        }
    }

    private enableCameraCollisions(camera: unknown): void {
        const cam = camera as { checkCollisions?: boolean; collisionRadius?: Vector3 };
        if (!cam) return;
        if ('checkCollisions' in cam) cam.checkCollisions = true;
        if ('collisionRadius' in cam) cam.collisionRadius = new Vector3(0.5, 0.5, 0.5);
    }

    private setupScreenTexture(): void {
        if (!this.screenMesh) {
            console.warn('Cannot create texture because screen mesh was not found');
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
            if (this.gameData.matchType === 'h2ai' && (key === 'w' || key === 's')) {
                event.preventDefault();
                return;
            }
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
                    this.goToGameOptions();
                }
            }
        });

        window.addEventListener('keyup', (event) => {
            const key = event.key.toLowerCase();
            if (this.gameData.matchType === 'h2ai' && (key === 'w' || key === 's')) return;
            this.keys[key] = false;
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

    private goToGameOptions(): void {
        window.location.href = '/game-options';
    }

    private resetBall(direction?: 'left' | 'right'): void {
        this.ballX = this.textureWidth / 2;
        this.ballY = this.textureHeight / 2;

        const serveRight = direction
            ? direction === 'right'
            : Math.random() > 0.5;
        this.ballSpeedX = this.initialBallSpeed * (serveRight ? 1 : -1);
        this.ballSpeedY = (Math.random() * 4 - 2);
    }

    private updateBall(frameFactor: number): void {
        if (!this.isPlaying) return;

        this.ballX += this.ballSpeedX * frameFactor;
        this.ballY += this.ballSpeedY * frameFactor;

        if (this.ballY - this.ballRadius <= 0 || this.ballY + this.ballRadius >= this.textureHeight) {
            this.ballSpeedY = -this.ballSpeedY;
        }

        const ballTop = this.ballY - this.ballRadius;
        const ballBottom = this.ballY + this.ballRadius;

        if (
            this.ballX - this.ballRadius <= this.paddleOffset + this.paddleWidth &&
            ballBottom >= this.leftPaddleY &&
            ballTop <= this.leftPaddleY + this.paddleHeight
        ) {
            this.ballSpeedX = Math.abs(this.ballSpeedX);
            const hitPos = (this.ballY - this.leftPaddleY) / this.paddleHeight;
            this.ballSpeedY = (hitPos - 0.5) * 10;
        }

        if (
            this.ballX + this.ballRadius >= this.textureWidth - this.paddleOffset - this.paddleWidth &&
            ballBottom >= this.rightPaddleY &&
            ballTop <= this.rightPaddleY + this.paddleHeight
        ) {
            this.ballSpeedX = -Math.abs(this.ballSpeedX);
            const hitPos = (this.ballY - this.rightPaddleY) / this.paddleHeight;
            this.ballSpeedY = (hitPos - 0.5) * 10;
        }

        if (this.ballX - this.ballRadius <= 0) {
            this.rightScore++;
            this.checkWinner();
            if (!this.isGameOver) {
                this.resetBall('right');
            }
        }

        if (this.ballX + this.ballRadius >= this.textureWidth) {
            this.leftScore++;
            this.checkWinner();
            if (!this.isGameOver) {
                this.resetBall('left');
            }
        }
    }

    private saveMatchResult(): void {
        if (playersInfo.mainPlayer_side === 'left') {
            playersInfo.mainPlayer_score = this.leftScore;
            playersInfo.otherPlayer_score = this.rightScore;
        } else {
            playersInfo.mainPlayer_score = this.rightScore;
            playersInfo.otherPlayer_score = this.leftScore;
        }
        const match: MatchPayload = {
            player1_id: playersInfo.mainPlayer_id,
            player2_id: playersInfo.otherPlayer_id,
            player1_name: playersInfo.mainPlayer_name,
            player2_name: playersInfo.otherPlayer_name,
            player1_score: playersInfo.mainPlayer_score,
            player2_score: playersInfo.otherPlayer_score,
            game_mode: 'nostalgia',
            match_type: this.gameData.matchType as "h2h" | "h2ai",
            aiDifficultly: this.gameData.aiDifficulty,
            player1_power_up_freeze: false,
            player1_power_up_mega: false,
            player2_power_up_freeze: false,
            player2_power_up_mega: false,
            started_at: new Date().toISOString(),
            winning_score: this.winningScore,
        }
        if (this.gameData.aiDifficulty === "")
            match.aiDifficultly = null;
        saveMatch(match);
    }

    private checkWinner(): void {
        if (this.leftScore >= this.winningScore || this.rightScore >= this.winningScore) {
            this.saveMatchResult();
        }
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

    private updatePaddles(deltaMs: number, frameFactor: number): void {
        if (!this.isPlaying) return;

        if (this.gameData.matchType === 'h2ai') {
            this.aiKeys = updateAI(
                deltaMs,
                this.ballX,
                this.ballY,
                this.ballSpeedX,
                this.ballSpeedY,
                this.textureWidth,
                this.textureHeight,
                this.leftPaddleY,
                this.paddleHeight,
                this.paddleSpeed * frameFactor,
                this.isPlaying,
                this.paddleOffset + this.paddleWidth
            );
        }

        if (this.gameData.matchType === 'h2ai') {

            if (this.keys['arrowup']) {
                this.rightPaddleY = Math.max(0, this.rightPaddleY - this.paddleSpeed * frameFactor);
            }
            if (this.keys['arrowdown']) {
                this.rightPaddleY = Math.min(
                    this.textureHeight - this.paddleHeight,
                    this.rightPaddleY + this.paddleSpeed * frameFactor
                );
            }
        } else {
            if (this.keys['arrowup']) {
                this.rightPaddleY = Math.max(0, this.rightPaddleY - this.paddleSpeed * frameFactor);
            }
            if (this.keys['arrowdown']) {
                this.rightPaddleY = Math.min(
                    this.textureHeight - this.paddleHeight,
                    this.rightPaddleY + this.paddleSpeed * frameFactor
                );
            }
        }

        const leftInputs = this.gameData.matchType === 'h2ai'
            ? this.aiKeys
            : { w: Boolean(this.keys['w']), s: Boolean(this.keys['s']) };

        if (leftInputs.w) {
            this.leftPaddleY = Math.max(0, this.leftPaddleY - this.paddleSpeed * frameFactor);
        }
        if (leftInputs.s) {
            this.leftPaddleY = Math.min(
                this.textureHeight - this.paddleHeight,
                this.leftPaddleY + this.paddleSpeed * frameFactor
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
                I18n.getInstance().t('game.startWithSpace'),
                this.textureWidth / 2,
                this.textureHeight / 2 + 80
            );
        }

        if (this.isGameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, this.textureWidth, this.textureHeight);

            const i18n = I18n.getInstance();

            ctx.font = 'bold 64px monospace';
            ctx.fillStyle = '#FFD700';
            const winnerText = this.winner === 'left' ? this.gameData.leftPlayer : this.gameData.rightPlayer;
            ctx.fillText(
                winnerText,
                this.textureWidth / 2,
                this.textureHeight / 2 - 80
            );

            ctx.font = 'bold 48px monospace';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(
                i18n.t('game.won').toUpperCase(),
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
                i18n.t('game.replayKey'),
                this.textureWidth / 2,
                this.textureHeight / 2 + 110
            );

            ctx.fillStyle = '#FF6600';
            ctx.fillText(
                i18n.t('game.menuKey'),
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

    private lastTime = 0;

    private startRenderLoop(): void {
        this.engine.runRenderLoop(() => {
            if (this.scene.isReady()) {
                const currentTime = performance.now();
                if (this.lastTime === 0) {
                    this.lastTime = currentTime;
                }
                const deltaMs = currentTime - this.lastTime;
                const frameFactor = Math.min(deltaMs / this.fixedFrameMs, this.maxFrameFactor);
                this.lastTime = currentTime;

                this.updatePaddles(deltaMs, frameFactor);
                this.updateBall(frameFactor);
                this.drawPongGame();
                this.updateCameraResetButton();
                this.scene.render();
            }
        });
    }

    private setupCameraResetButton(): void {
        this.resetCameraButton = document.getElementById('resetCameraButton') as HTMLButtonElement | null;
        if (!this.resetCameraButton) return;
        this.resetCameraButton.addEventListener('click', () => this.resetCameraToInitial());
    }

    private captureInitialCameraState(): void {
        const camera = this.scene.activeCamera;
        if (!camera) return;

        if (camera instanceof ArcRotateCamera) {
            this.initialCameraState = {
                kind: 'arc',
                alpha: camera.alpha,
                beta: camera.beta,
                radius: camera.radius,
                target: camera.target.clone(),
            };
            return;
        }

        const position = camera.position?.clone?.() ?? null;
        if (!position) return;
        const rotation = this.readCameraRotation(camera);
        this.initialCameraState = {
            kind: 'other',
            position,
            rotation,
        };
    }

    private resetCameraToInitial(): void {
        const camera = this.scene.activeCamera;
        if (!camera || !this.initialCameraState) return;

        if (this.initialCameraState.kind === 'arc' && camera instanceof ArcRotateCamera) {
            camera.alpha = this.initialCameraState.alpha;
            camera.beta = this.initialCameraState.beta;
            camera.radius = this.initialCameraState.radius;
            camera.target.copyFrom(this.initialCameraState.target);
            return;
        }

        if (this.initialCameraState.kind === 'other') {
            camera.position.copyFrom(this.initialCameraState.position);
            this.setCameraRotation(camera, this.initialCameraState.rotation);
        }
    }

    private updateCameraResetButton(): void {
        if (!this.resetCameraButton || !this.initialCameraState) return;
        const camera = this.scene.activeCamera;
        if (!camera) return;

        let isMoved = false;

        if (this.initialCameraState.kind === 'arc' && camera instanceof ArcRotateCamera) {
            const targetDelta = camera.target.subtract(this.initialCameraState.target).length();
            isMoved =
                Math.abs(camera.alpha - this.initialCameraState.alpha) > this.cameraEpsilon ||
                Math.abs(camera.beta - this.initialCameraState.beta) > this.cameraEpsilon ||
                Math.abs(camera.radius - this.initialCameraState.radius) > this.cameraPositionEpsilon ||
                targetDelta > this.cameraPositionEpsilon;
        } else if (this.initialCameraState.kind === 'other') {
            const positionDelta = camera.position.subtract(this.initialCameraState.position).length();
            let rotationDelta = 0;
            const rotation = this.readCameraRotation(camera);
            if (this.initialCameraState.rotation && rotation) {
                rotationDelta = rotation.subtract(this.initialCameraState.rotation).length();
            }
            isMoved = positionDelta > this.cameraPositionEpsilon || rotationDelta > this.cameraEpsilon;
        }

        this.resetCameraButton.classList.toggle('is-visible', isMoved);
    }

    private readCameraRotation(camera: unknown): Vector3 | null {
        const cam = camera as { rotation?: Vector3 };
        return cam.rotation ? cam.rotation.clone() : null;
    }

    private setCameraRotation(camera: unknown, rotation: Vector3 | null): void {
        if (!rotation) return;
        const cam = camera as { rotation?: Vector3 };
        if (cam.rotation) {
            cam.rotation.copyFrom(rotation);
        }
    }

    private setupWindowResize(): void {
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    public dispose(): void {
        this.pongTexture?.dispose();
        this.gamePanel?.dispose();
        this.scene.dispose();
        this.engine.dispose();
    }
}
