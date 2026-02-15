export const ui = {
    gameBoard: null as unknown as HTMLDivElement,
    scoreBoard: null as unknown as HTMLDivElement,
    player1Name: null as unknown as HTMLSpanElement,
    player1Score: null as unknown as HTMLSpanElement,
    player2Name: null as unknown as HTMLSpanElement,
    player2Score: null as unknown as HTMLSpanElement,
    paddle1: null as unknown as HTMLDivElement,
    paddle2: null as unknown as HTMLDivElement,
    ball: null as unknown as HTMLDivElement,
    spaceHint: null as unknown as HTMLDivElement,
};

export function initUI(): void {
    ui.gameBoard = document.getElementById('gameBoard') as HTMLDivElement;
    ui.scoreBoard = document.getElementById('scoreboard') as HTMLDivElement;
    ui.player1Name = document.getElementById('player1Name') as HTMLSpanElement;
    ui.player1Score = document.getElementById('player1Score') as HTMLSpanElement;
    ui.player2Name = document.getElementById('player2Name') as HTMLSpanElement;
    ui.player2Score = document.getElementById('player2Score') as HTMLSpanElement;
    ui.paddle1 = document.getElementById('paddle1') as HTMLDivElement;
    ui.paddle2 = document.getElementById('paddle2') as HTMLDivElement;
    ui.ball = document.getElementById('ball') as HTMLDivElement;
    ui.spaceHint = document.getElementById('spaceHint') as HTMLDivElement;
}