declare const tournamentBackButton: HTMLElement;
declare const playerNameInput: HTMLInputElement;
declare const addPlayerButton: HTMLButtonElement;
declare const playersList: HTMLElement;
declare const playerCount: HTMLElement;
declare const bracketContainer: HTMLElement;
declare const bracketContent: HTMLElement;
declare const startTournamentButton: HTMLButtonElement;
declare const setMatchesButton: HTMLButtonElement;
declare const addPlayersCard: HTMLElement;
declare const tournamentStatusCard: HTMLElement;
declare const tournamentStatusContent: HTMLElement;
type Match = {
    player1: string;
    player2: string | null;
};
type Bracket = {
    rounds: Match[][];
};
type PlayedMatch = {
    roundIndex: number;
    matchIndex: number;
    player1: string;
    player2: string | null;
    winner: string;
    player1Score: number;
    player2Score: number;
};
type TournamentState = {
    players: string[];
    bracket: Bracket;
    playedMatches: PlayedMatch[];
    currentRoundIndex: number;
    currentMatchIndex: number;
};
declare let tournamentPlayers: string[];
declare let bracket: Bracket | null;
declare let tournamentState: TournamentState | null;
declare function checkTournamentState(): void;
declare function renderTournamentStatus(playedMatches: any[]): void;
declare function setMatches(): void;
declare function backMenu(): void;
declare function addPlayer(): void;
declare function removePlayer(index: number): void;
declare function updatePlayersList(): void;
declare function updateBracket(): void;
declare function generateBracket(players: string[]): {
    rounds: Match[][];
};
declare function updateBracketWithWinners(bracket: Bracket, playedMatches: any[]): void;
declare const continueTournamentButton: HTMLElement | null;
//# sourceMappingURL=tournament.d.ts.map