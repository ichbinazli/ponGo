import type { SessionStorage } from '../../../../../node_modules/react-router/dist/development/index.js';
import { ui } from './ui.js';

export const keysPressedHuman: { [key: string]: boolean } = {};
export const keysPressedAI: { [key: string]: boolean } = {};

export const paddles = {
    paddleSpeed: 5,
    paddle1Y: ui.gameBoard.clientHeight / 2 - ui.paddle1.clientHeight / 2,
    paddle2Y: ui.gameBoard.clientHeight / 2 - ui.paddle2.clientHeight / 2,
}

export const ball = {
    x: ui.gameBoard.clientWidth / 2 - ui.ball.clientWidth / 2,
    y: ui.gameBoard.clientHeight / 2 - ui.ball.clientHeight / 2,
    speed: 7,
    velocityX: 0,
    velocityY: 0,
}

export const scores = {
    player1: 0,
    player2: 0,
}

let gameMode = sessionStorage.getItem('gameMode');
if (gameMode !== 'h2h' && gameMode !== 'h2ai' && gameMode !== 'tournament') {
    gameMode = 'h2h';
    sessionStorage.setItem('gameMode', 'h2h');
}

export const gameState = {
    gameMode: gameMode as 'h2h' | 'h2ai' | 'tournament',
}

document.addEventListener('keydown', (event) => {
    keysPressedHuman[event.key] = true;
});

document.addEventListener('keyup', (event) => {
    keysPressedHuman[event.key] = false;
});
