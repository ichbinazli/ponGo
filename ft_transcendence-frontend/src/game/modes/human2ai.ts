import { ui } from '../ui';
import { keysPressedAI, paddles, ball } from '../types';

let aiTimer = 0;

type DifficultyLevel = 'easy' | 'medium' | 'hard';

type DifficultyConfig = {
    delayMinMs: number;
    delayMaxMs: number;
    errorCenter: number;
    errorSpread: number;
};

const DIFFICULTY_CONFIG: Record<DifficultyLevel, DifficultyConfig> = {
    hard: {
        delayMinMs: 0,
        delayMaxMs: 300,
        errorCenter: 0.4,
        errorSpread: 40,
    },
    medium: {
        delayMinMs: 100,
        delayMaxMs: 500,
        errorCenter: 0.3,
        errorSpread: 70,
    },
    easy: {
        delayMinMs: 200,
        delayMaxMs: 800,
        errorCenter: 0.2,
        errorSpread: 110,
    },
};

let currentDifficulty: DifficultyLevel = 'medium';
let currentConfig: DifficultyConfig = DIFFICULTY_CONFIG.medium;

export function update(deltaMs: number) {
    const refs = getUIRefs();
    if (!refs) return;

    const { paddle1 } = refs;
    hydrateDifficulty();
    aiTimer += deltaMs;

    if (aiTimer >= 1000) {
        aiTimer = 0;
        aiDecision();
    }

    paddleCenter = paddles.paddle1Y + paddle1.clientHeight / 2;
    const paddleTop = paddles.paddle1Y + paddle1.clientHeight * 0.25;
    const paddleBottom = paddles.paddle1Y + paddle1.clientHeight * 0.75;

    if (aiMode === 'IDLE' || aiMode === 'DEFENDING') {
        if (Math.abs(targetY - paddleCenter) < paddles.paddleSpeed)
            keysPressedAI['s'] = keysPressedAI['w'] = false;
    }
    else if (aiMode === 'ATTACKING') {
        if (Math.abs(targetY - paddleBottom) < paddles.paddleSpeed || Math.abs(targetY - paddleTop) < paddles.paddleSpeed)
            keysPressedAI['s'] = keysPressedAI['w'] = false;
    }
}

let aiMode: 'IDLE' | 'DEFENDING' | 'ATTACKING' = 'IDLE';
let targetY = 0;
let paddleCenter = 0;

function getUIRefs() {
    const { paddle1, gameBoard, ball: ballEl } = ui;
    if (!paddle1 || !gameBoard || !ballEl) return null;
    return { paddle1, gameBoard, ballEl };
}

function predictBallImpactY() {
    const refs = getUIRefs();
    if (!refs) return null;
    const { gameBoard, ballEl } = refs;

    if (ball.velocityX >= 0) return null;

    const time = (0 - ball.x) / ball.velocityX;
    let y = ball.y + ball.velocityY * time;

    const minY = 0;
    const maxY = gameBoard.clientHeight - ballEl.clientHeight;

    while (y < minY || y > maxY) {
        if (y < minY) y = -y;
        else if (y > maxY) y = 2 * maxY - y;
    }
    return y;
}


function aiDecisionCore() {
    const refs = getUIRefs();
    if (!refs) return;
    const { gameBoard } = refs;

    const boardCenterY = gameBoard.clientHeight / 2;
    const error = (Math.random() - currentConfig.errorCenter) * currentConfig.errorSpread;

    if (ball.velocityX > 0) {
        aiMode = 'IDLE';
        targetY = boardCenterY;
    }
    else if (ball.x < ui.gameBoard.clientWidth / 2) {
        aiMode = 'DEFENDING';
        targetY = (predictBallImpactY() ?? boardCenterY) + error;
    } else {
        aiMode = 'ATTACKING';
        targetY = (predictBallImpactY() ?? boardCenterY) + error;
    }

    executeAction();
}

function randomDelay() {
    const range = currentConfig.delayMaxMs - currentConfig.delayMinMs;
    return currentConfig.delayMinMs + Math.random() * range;
}

function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function aiDecision() {
    const delay = randomDelay();
    await wait(delay); 
    aiDecisionCore();
}

function executeAction() {
    const refs = getUIRefs();
    if (!refs) return;
    const { paddle1 } = refs;

    paddleCenter = paddles.paddle1Y + paddle1.clientHeight / 2;
    if (Math.abs(targetY - paddleCenter) < paddles.paddleSpeed) {
        keysPressedAI['s'] = keysPressedAI['w'] = false;
    }
    else if (targetY < paddleCenter) {
        keysPressedAI['w'] = true;
        keysPressedAI['s'] = false;
    }
    else {
        keysPressedAI['s'] = true;
        keysPressedAI['w'] = false;
    }
}

function hydrateDifficulty() {
    const stored = sessionStorage.getItem('aiDifficulty');
    const level: DifficultyLevel = stored === 'easy' || stored === 'medium' || stored === 'hard'
        ? stored
        : 'hard';

    if (level !== currentDifficulty) {
        currentDifficulty = level;
        currentConfig = DIFFICULTY_CONFIG[level];
    }
}
