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
    speed: 6,
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

interface PlayersInfo {
    mainPlayer_name: string;
    otherPlayer_name: string;
    mainPlayer_id: number | null;
    otherPlayer_id: number | null;
    mainPlayer_score: number;
    otherPlayer_score: number;
    mainPlayer_side: 'left' | 'right';
    mainPlayer_power_up_freeze: boolean;
    mainPlayer_power_up_mega: boolean;
    otherPlayer_power_up_freeze: boolean;
    otherPlayer_power_up_mega: boolean;
}

export const playersInfo: PlayersInfo = {
    mainPlayer_name: '',
    otherPlayer_name: '',
    mainPlayer_id: null,
    otherPlayer_id: null,
    mainPlayer_score: 0,
    otherPlayer_score: 0,
    mainPlayer_side: 'right',
    mainPlayer_power_up_freeze: false,
    mainPlayer_power_up_mega: false,
    otherPlayer_power_up_freeze: false,
    otherPlayer_power_up_mega: false,
};

let matchType = sessionStorage.getItem('matchType');
if (matchType !== 'h2h' && matchType !== 'h2ai') {
    matchType = 'h2h';
    sessionStorage.setItem('matchType', 'h2h');
}

export const gameState = {
    matchType: matchType as 'h2h' | 'h2ai',
    gameMode: sessionStorage.getItem('gameMode') || 'modern' as 'modern' | 'nostalgia' | 'tournament',
}

let userIsOnLeftSide = sessionStorage.getItem('playerSide') === 'left';

document.addEventListener('keydown', (event) => {
    maybePreventScroll(event);
    
    const matchType = sessionStorage.getItem('matchType');
    const isAiMatch = matchType === 'h2ai';
    
    if (isAiMatch) {
        userIsOnLeftSide = sessionStorage.getItem('playerSide') === 'left';
        
        if (userIsOnLeftSide) {
            if (['ArrowUp', 'ArrowDown'].includes(event.key)) return;
        }
        else {
            if (['w', 'W', 's', 'S'].includes(event.key)) return;
        }
    }
    
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
