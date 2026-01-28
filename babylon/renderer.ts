declare const BABYLON: any;
import { BALL_LIFT, BOARD_DEPTH, PADDLE_DEPTH } from "./constants.js";
import type { GameSnapshot, MeshBundle, RendererConfig } from "./types.js";

function toSceneX(x: number, width: number, boardWidth: number) {
    return x - boardWidth / 2 + width / 2;
}

function toSceneZ(y: number, height: number, boardHeight: number) {
    return boardHeight / 2 - y - height / 2;
}

export class BabylonRenderer {
    private readonly meshes: MeshBundle;
    private readonly boardDepth: number;
    private readonly paddleDepth: number;
    private readonly ballLift: number;
    private readonly ballRadiusOverride: number | undefined;

    constructor(meshes: MeshBundle, config: RendererConfig = {}) {
        this.meshes = meshes;
        this.boardDepth = config.boardDepth ?? BOARD_DEPTH;
        this.paddleDepth = config.paddleDepth ?? PADDLE_DEPTH;
        this.ballLift = config.zLift ?? BALL_LIFT;
        this.ballRadiusOverride = config.ballRadius;
    }

    sync(snapshot: GameSnapshot) {
        const boardWidth = snapshot.boardWidth;
        const boardHeight = snapshot.boardHeight;

        this.positionPaddle(this.meshes.paddle1, snapshot.paddle1X, snapshot.paddle1Y, snapshot.paddleWidth, snapshot.paddleHeight, boardWidth, boardHeight);
        this.positionPaddle(this.meshes.paddle2, snapshot.paddle2X, snapshot.paddle2Y, snapshot.paddleWidth, snapshot.paddleHeight, boardWidth, boardHeight);
        this.positionBall(snapshot, boardWidth, boardHeight);
    }

    private positionPaddle(mesh: BABYLON.Mesh, x: number, y: number, width: number, height: number, boardWidth: number, boardHeight: number) {
        mesh.position.x = toSceneX(x, width, boardWidth);
        mesh.position.z = toSceneZ(y, height, boardHeight);
        mesh.position.y = this.paddleDepth / 2;
    }

    private positionBall(snapshot: GameSnapshot, boardWidth: number, boardHeight: number) {
        const radius = this.ballRadiusOverride ?? snapshot.ballSize / 2;
        const x = snapshot.ballX;
        const y = snapshot.ballY;

        this.meshes.ball.position.x = toSceneX(x, radius * 2, boardWidth);
        this.meshes.ball.position.z = toSceneZ(y, radius * 2, boardHeight);
        this.meshes.ball.position.y = radius + this.ballLift;

        this.meshes.ball.scaling = new BABYLON.Vector3(1, 1, 1);
    }
}
