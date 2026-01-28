import { ui } from '../ui.js';
import { keysPressedAI, paddles, ball } from '../types.js';

let aiTimer = 0;

export function update(deltaTime: number) {
    aiTimer += deltaTime;

    if (aiTimer >= 1000) {
        aiTimer = 0;
        aiDecision(); // FSM çalışır
    }
    paddleCenter = paddles.paddle1Y + ui.paddle1.clientHeight / 2;
    let paddleTop = paddles.paddle1Y + ui.paddle1.clientHeight * 0.25;
    let paddleBottom = paddles.paddle1Y + ui.paddle1.clientHeight * 0.75;
    if (aiMode === 'IDLE' || aiMode === 'DEFENDING') {
        if (Math.abs(targetY - paddleCenter) < paddles.paddleSpeed)
            keysPressedAI['s'] = keysPressedAI['w'] = false;
    }
    else if (aiMode === 'ATTACKING') {
        if (Math.abs(targetY - paddleBottom) < paddles.paddleSpeed || Math.abs(targetY - paddleTop) < paddles.paddleSpeed)
            keysPressedAI['s'] = keysPressedAI['w'] = false;
    }

}

// ball.velocityX > 0 → top sağa gidiyor
// ball.velocityX < 0 → top sola gidiyor
// ball.velocityY > 0 → top aşağıya gidiyor
// ball.velocityY < 0 → top yukarıya gidiyor

let aiMode: 'IDLE' | 'DEFENDING' | 'ATTACKING' = 'IDLE';
let targetY = 0;
let paddleCenter = paddles.paddle1Y + ui.paddle1.clientHeight / 2;

function predictBallImpactY() {
    if (ball.velocityX >= 0) return null;

    const time = (0 - ball.x) / ball.velocityX;
    let y = ball.y + ball.velocityY * time;

    const minY = 0;
    const maxY = ui.gameBoard.clientHeight - ui.ball.clientHeight;

    while (y < minY || y > maxY) {
        if (y < minY) y = -y;
        else if (y > maxY) y = 2 * maxY - y;
    }
    return y;
}


function aiDecisionCore() {
    const boardCenterY = ui.gameBoard.clientHeight / 2;
    const error = (Math.random() - 0.4) * 40;
    console.log('AI Error:', error);

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
    return Math.random() * 300;
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
    paddleCenter = paddles.paddle1Y + ui.paddle1.clientHeight / 2;
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
