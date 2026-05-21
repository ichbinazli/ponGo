import { resetMatchState, startGame } from './gameEngine'

type GameOverUI = {
    overlay: HTMLDivElement | null;
    title: HTMLElement | null;
    score: HTMLElement | null;
    playAgain: HTMLButtonElement | null;
    backToOptions: HTMLAnchorElement | null;
};

export const gameOverUI: GameOverUI = {
    overlay: null,
    title: null,
    score: null,
    playAgain: null,
    backToOptions: null,
};

export function initGameOverUI() {
    gameOverUI.overlay = document.getElementById('gameOverOverlay') as HTMLDivElement;
    gameOverUI.title = document.getElementById('winnerTitle');
    gameOverUI.score = document.getElementById('winnerScore');
    gameOverUI.playAgain = document.getElementById('playAgainButton') as HTMLButtonElement;
    gameOverUI.backToOptions = document.getElementById('backToOptionsButton') as HTMLAnchorElement;

    if (gameOverUI.playAgain) {
        gameOverUI.playAgain.onclick = () => {
            hideGameOverModal();
            resetMatchState();
            startGame();
        };
    }

    if (gameOverUI.backToOptions) {
        gameOverUI.backToOptions.onclick = (event) => {
            event.preventDefault();
            hideGameOverModal();
        };
    }
}

export function hideGameOverModal() {
    gameOverUI.overlay?.classList.add('hidden');
}
