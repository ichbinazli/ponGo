declare const BABYLON: any;
import { createBall } from "./ball.js";
import { createBoard } from "./board.js";
import { createEngine } from "./engine.js";
import { createTopDownCamera } from "./camera.js";
import { createLights } from "./lights.js";
import { createPaddle } from "./paddle.js";
import { BabylonRenderer } from "./renderer.js";
import { BALL_LIFT, BOARD_DEPTH, DEFAULT_CANVAS_ID, DEFAULT_LAYER_CLASS, PADDLE_DEPTH } from "./constants.js";
import type { GameSnapshot } from "./types.js";
// We intentionally avoid importing the 2D game layer; use DOM if present, otherwise fall back to defaults.
const DEFAULT_BOARD = { width: 800, height: 400 };
const DEFAULT_PADDLE = { width: 12, height: 80 };
const DEFAULT_BALL_SIZE = 18;



function buildCanvas() {
    const existing = document.getElementById(DEFAULT_CANVAS_ID) as HTMLCanvasElement | null;
    if (existing) return existing;

    const canvas = document.createElement("canvas");
    canvas.id = DEFAULT_CANVAS_ID;
    canvas.className = DEFAULT_LAYER_CLASS;
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";

    const host = document.getElementById("gameBoard") as HTMLDivElement | null;
    if (host) {
        if (!host.style.position) {
            host.style.position = "relative";
        }
        host.appendChild(canvas);
    } else {
        canvas.style.position = "relative";
        canvas.style.width = "100vw";
        canvas.style.height = "100vh";
        document.body.appendChild(canvas);
    }
    return canvas;
}

function getUiElements() {
    const gameBoard = document.getElementById("gameBoard") as HTMLDivElement | null;
    const paddle1 = document.getElementById("paddle1") as HTMLDivElement | null;
    const paddle2 = document.getElementById("paddle2") as HTMLDivElement | null;
    const ball = document.getElementById("ball") as HTMLDivElement | null;
    return { gameBoard, paddle1, paddle2, ball };
}

function snapshotFromUi(): GameSnapshot {
    const { gameBoard, paddle1, paddle2, ball } = getUiElements();

    const boardWidth = gameBoard?.clientWidth ?? DEFAULT_BOARD.width;
    const boardHeight = gameBoard?.clientHeight ?? DEFAULT_BOARD.height;

    const paddleWidth = paddle1?.clientWidth ?? DEFAULT_PADDLE.width;
    const paddleHeight = paddle1?.clientHeight ?? DEFAULT_PADDLE.height;
    const paddle1X = paddle1?.offsetLeft ?? 40;
    const paddle2X = paddle2?.offsetLeft ?? (boardWidth - paddleWidth - 40);
    const paddle1Y = paddle1?.offsetTop ?? (boardHeight - paddleHeight) / 2;
    const paddle2Y = paddle2?.offsetTop ?? (boardHeight - paddleHeight) / 2;

    const ballSize = ball?.clientWidth ?? DEFAULT_BALL_SIZE;
    const ballX = ball?.offsetLeft ?? (boardWidth - ballSize) / 2;
    const ballY = ball?.offsetTop ?? (boardHeight - ballSize) / 2;

    return {
        boardWidth,
        boardHeight,
        paddleWidth,
        paddleHeight,
        paddle1X,
        paddle2X,
        paddle1Y,
        paddle2Y,
        ballX,
        ballY,
        ballSize,
    };
}

function mountBabylonLayer() {
    const snapshot = snapshotFromUi();

    const canvas = buildCanvas();
    const { engine, scene } = createEngine(canvas);

    const boardSize = {
        width: snapshot.boardWidth,
        height: snapshot.boardHeight,
        depth: BOARD_DEPTH,
    };

    const camera = createTopDownCamera(scene, canvas, boardSize);
    const lights = createLights(scene);

    const paddleDims = { width: snapshot.paddleWidth, height: snapshot.paddleHeight, depth: PADDLE_DEPTH };
    const board = createBoard(scene, boardSize);
    const paddle1 = createPaddle(scene, "Paddle1", paddleDims, BABYLON.Color3.FromHexString("#52a7f2"));
    const paddle2 = createPaddle(scene, "Paddle2", paddleDims, BABYLON.Color3.FromHexString("#ef476f"));
    const ballMesh = createBall(scene, snapshot.ballSize / 2);

    const renderer = new BabylonRenderer({ board, paddle1, paddle2, ball: ballMesh }, {
        boardDepth: BOARD_DEPTH,
        paddleDepth: PADDLE_DEPTH,
        ballRadius: snapshot.ballSize / 2,
        zLift: BALL_LIFT,
    });

    // Keep the render loop independent from game logic; we only read shared state.
    engine.runRenderLoop(() => {
        renderer.sync(snapshotFromUi());
        scene.render();
    });

    return { engine, scene, camera, lights, meshes: { board, paddle1, paddle2, ball: ballMesh } };
}

function startWhenReady() {
    const start = () => { void mountBabylonLayer(); };
    if (document.readyState === "complete" || document.readyState === "interactive") {
        start();
    } else {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    }
}

// Auto-start when this module is imported. This keeps the 3D view opt-in via module usage only.
startWhenReady();

export { mountBabylonLayer };
