import { ui } from './ui';

export const keysPressedHuman: { [key: string]: boolean } = {};
export const keysPressedAI: { [key: string]: boolean } = {};

export const paddles = {
    paddleSpeed: 5,
    paddle1Y: 0,
    paddle2Y: 0,
}

export const ball = {
    x: 0,
    y: 0,
    speed: 7,
    velocityX: 0,
    velocityY: 0,
}

export function initGameObjects(): void {
    paddles.paddle1Y = ui.gameBoard.clientHeight / 2 - ui.paddle1.clientHeight / 2;
    paddles.paddle2Y = ui.gameBoard.clientHeight / 2 - ui.paddle2.clientHeight / 2;
    ball.x = ui.gameBoard.clientWidth / 2 - ui.ball.clientWidth / 2;
    ball.y = ui.gameBoard.clientHeight / 2 - ui.ball.clientHeight / 2;
}

export const scores = {
    player1: 0,
    player2: 0,
}

export const playersInfo = {
    player1_name: '',
    player2_name: '',
    player1_id: 0,
    player2_id: 0,
}

let matchType = sessionStorage.getItem('matchType');
if (matchType !== 'h2h' && matchType !== 'h2ai') {
    matchType = 'h2h';
    sessionStorage.setItem('matchType', 'h2h');
}

export const gameState = {
    gameMode: matchType as 'h2h' | 'h2ai',
}

document.addEventListener('keydown', (event) => {
    maybePreventScroll(event);
    keysPressedHuman[event.key] = true;
});

document.addEventListener('keyup', (event) => {
    keysPressedHuman[event.key] = false;
});

function maybePreventScroll(event: KeyboardEvent) {
    const isArrow = event.key === 'ArrowUp' || event.key === 'ArrowDown';
    if (!isArrow) return;

    const active = document.activeElement as HTMLElement | null;
    const isTyping = active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName);
    if (isTyping) return;

    const onGameRoute = window.location.pathname === '/game';
    const gamePageExists = !!document.getElementById('gamePage');

    if (onGameRoute || gamePageExists)
        event.preventDefault();
}
