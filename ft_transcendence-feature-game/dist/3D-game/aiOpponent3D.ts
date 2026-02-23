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

let aiTimer = 0;
let aiMode: 'IDLE' | 'DEFENDING' | 'ATTACKING' = 'IDLE';
let targetY = 0;
let paddleCenter = 0;

export type AIInputState = { w: boolean; s: boolean };

export function updateAI(
    deltaMs: number,
    ballX: number,
    ballY: number,
    ballSpeedX: number,
    ballSpeedY: number,
    textureWidth: number,
    textureHeight: number,
    paddleY: number,
    paddleHeight: number,
    paddleSpeed: number,
    isPlaying: boolean,
    aiPaddleX: number
): AIInputState {
    if (!isPlaying) return { w: false, s: false };

    hydrateDifficulty();
    aiTimer += deltaMs;

    if (aiTimer >= 1000) {
        aiTimer = 0;
        aiDecision(ballX, ballY, ballSpeedX, ballSpeedY, textureWidth, textureHeight, aiPaddleX);
    }

    paddleCenter = paddleY + paddleHeight / 2;
    const paddleTop = paddleY + paddleHeight * 0.25;
    const paddleBottom = paddleY + paddleHeight * 0.75;

    let w = false;
    let s = false;

    if (aiMode === 'IDLE' || aiMode === 'DEFENDING') {
        if (Math.abs(targetY - paddleCenter) < paddleSpeed) {
            w = false;
            s = false;
        } else if (targetY < paddleCenter) {
            w = true;
            s = false;
        } else {
            w = false;
            s = true;
        }
    } else if (aiMode === 'ATTACKING') {
        if (Math.abs(targetY - paddleBottom) < paddleSpeed || Math.abs(targetY - paddleTop) < paddleSpeed) {
            w = false;
            s = false;
        } else if (targetY < paddleCenter) {
            w = true;
            s = false;
        } else {
            w = false;
            s = true;
        }
    }

    return { w, s };
}

function predictBallImpactY(
    ballX: number,
    ballY: number,
    ballSpeedX: number,
    ballSpeedY: number,
    textureWidth: number,
    textureHeight: number,
    aiPaddleX: number
): number | null {
    if (ballSpeedX >= 0 && aiPaddleX < textureWidth / 2) return null;

    const time = (aiPaddleX - ballX) / ballSpeedX;
    if (time < 0) return null;

    let y = ballY + ballSpeedY * time;

    const minY = 0;
    const maxY = textureHeight;

    while (y < minY || y > maxY) {
        if (y < minY) y = -y;
        else if (y > maxY) y = 2 * maxY - y;
    }
    return y;
}

function aiDecision(
    ballX: number,
    ballY: number,
    ballSpeedX: number,
    ballSpeedY: number,
    textureWidth: number,
    textureHeight: number,
    aiPaddleX: number
) {
    const boardCenterY = textureHeight / 2;
    const error = (Math.random() - currentConfig.errorCenter) * currentConfig.errorSpread;

    const isBallComingTowardsAI = (aiPaddleX < textureWidth / 2 && ballSpeedX < 0) || (aiPaddleX > textureWidth / 2 && ballSpeedX > 0);

    if (!isBallComingTowardsAI) {
        aiMode = 'IDLE';
        targetY = boardCenterY;
    } else if (Math.abs(ballX - aiPaddleX) > textureWidth / 4) {
        aiMode = 'DEFENDING';
        targetY = (predictBallImpactY(ballX, ballY, ballSpeedX, ballSpeedY, textureWidth, textureHeight, aiPaddleX) ?? boardCenterY) + error;
    } else {
        aiMode = 'ATTACKING';
        targetY = (predictBallImpactY(ballX, ballY, ballSpeedX, ballSpeedY, textureWidth, textureHeight, aiPaddleX) ?? boardCenterY) + error;
    }
}

function hydrateDifficulty() {
    const stored = sessionStorage.getItem('aiDifficulty');
    const level: DifficultyLevel = stored === 'easy' || stored === 'medium' || stored === 'hard'
        ? stored
        : 'medium';

    if (level !== currentDifficulty) {
        currentDifficulty = level;
        currentConfig = DIFFICULTY_CONFIG[level];
    }
}