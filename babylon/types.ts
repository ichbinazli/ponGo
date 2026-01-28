declare const BABYLON: any;

export interface Dimensions {
    width: number;
    height: number;
    depth?: number;
}

export interface GameSnapshot {
    boardWidth: number;
    boardHeight: number;
    paddleWidth: number;
    paddleHeight: number;
    paddle1X: number;
    paddle2X: number;
    paddle1Y: number;
    paddle2Y: number;
    ballX: number;
    ballY: number;
    ballSize: number;
}

export interface RendererConfig {
    boardDepth?: number;
    paddleDepth?: number;
    ballRadius?: number;
    zLift?: number;
}

export interface BabylonContext {
    engine: BABYLON.Engine;
    scene: BABYLON.Scene;
}

export interface MeshBundle {
    board: BABYLON.Mesh;
    paddle1: BABYLON.Mesh;
    paddle2: BABYLON.Mesh;
    ball: BABYLON.Mesh;
}
