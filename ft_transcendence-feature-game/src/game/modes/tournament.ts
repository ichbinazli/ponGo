const tournamentBackButton = document.getElementById('tournamentBackButton')!;
const playerNameInput = document.getElementById('playerNameInput') as HTMLInputElement;
const addPlayerButton = document.getElementById('addPlayerButton') as HTMLButtonElement;
const playersList = document.getElementById('playersList')!;
const playerCount = document.getElementById('playerCount')!;
const bracketContainer = document.getElementById('bracketContainer')!;
const bracketContent = document.getElementById('bracketContent')!;
const startTournamentButton = document.getElementById('startTournamentButton') as HTMLButtonElement;
const setMatchesButton = document.getElementById('setMatchesButton') as HTMLButtonElement;
const addPlayersCard = document.getElementById('addPlayersCard')!;
const tournamentStatusCard = document.getElementById('tournamentStatusCard')!;
const tournamentStatusContent = document.getElementById('tournamentStatusContent')!;

type Match = { player1: string; player2: string | null };
type Bracket = { rounds: Match[][] };

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

let tournamentPlayers: string[] = [];
let bracket: Bracket | null = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let tournamentState: TournamentState | null = null;


tournamentPlayers = [];
playersList.innerHTML = '';
playerCount.textContent = '0';
bracketContent.innerHTML = '<p class="empty-bracket">Add 3-6 players to see bracket</p>';
startTournamentButton.disabled = true;
playerNameInput.value = '';
playerNameInput.focus();

// Check if tournament is already in progress
checkTournamentState();

function checkTournamentState() {
    const savedPlayers = sessionStorage.getItem('tournamentPlayers');
    const playedMatches = sessionStorage.getItem('playedMatches');
    
    if (savedPlayers && playedMatches) {
        // Tournament is in progress
        tournamentPlayers = JSON.parse(savedPlayers);
        const matches = JSON.parse(playedMatches);
        
        // Show tournament status card instead of add players
        addPlayersCard.classList.add('hidden');
        tournamentStatusCard.classList.remove('hidden');
        
        // Display played matches
        renderTournamentStatus(matches);
    } else {
        // New tournament setup
        addPlayersCard.classList.remove('hidden');
        tournamentStatusCard.classList.add('hidden');
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function renderTournamentStatus(playedMatches: any[]) {
    let html = '<div class="played-matches">';
    
    if (playedMatches.length === 0) {
        html += '<p>No matches played yet</p>';
    } else {
        playedMatches.forEach((match) => {
            html += `
                <div class="match-result">
                    <div class="match-title">Round ${match.roundIndex + 1}, Match ${match.matchIndex + 1}</div>
                    <div class="match-details">
                        <div class="player-result ${match.winner === match.player1 ? 'winner' : ''}">
                            ${match.player1}: ${match.player1Score}
                        </div>
                        <div class="vs">vs</div>
                        <div class="player-result ${match.winner === match.player2 ? 'winner' : ''}">
                            ${match.player2}: ${match.player2Score}
                        </div>
                    </div>
                    <div class="winner-badge">✓ ${match.winner}</div>
                </div>
            `;
        });
    }
    
    html += '</div>';
    tournamentStatusContent.innerHTML = html;
}

tournamentBackButton.addEventListener('click', backMenu);
setMatchesButton.addEventListener('click', setMatches);

function setMatches() {
    bracketContainer.classList.remove('hidden');
    updateBracket();
}

function backMenu() {
    window.location.href = '../index.html';
}

function addPlayer() {
    const playerName = playerNameInput.value.trim();
    
    // Validation
    if (!playerName) {
        alert('Please enter a player name');
        return;
    }
    
    if (tournamentPlayers.indexOf(playerName) !== -1) {
        alert('This player name already exists');
        return;
    }
    
    if (tournamentPlayers.length >= 6) {
        alert('Maximum 6 players allowed');
        return;
    }
    
    // Add player
    tournamentPlayers.push(playerName);
    playerNameInput.value = '';
    playerNameInput.focus();
    
    // Update UI
    updatePlayersList();
    updateBracket();
}

function removePlayer(index: number) {
    tournamentPlayers.splice(index, 1);
    updatePlayersList();
    updateBracket();
}

function updatePlayersList() {
    playersList.innerHTML = '';
    playerCount.textContent = tournamentPlayers.length.toString();
    
    tournamentPlayers.forEach((name, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${index + 1}. ${name}</span>
            <button class="remove-player-btn" data-index="${index}">Remove</button>
        `;
        playersList.appendChild(li);
    });
    
    // Add event listeners to remove buttons
    playersList.querySelectorAll('.remove-player-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
            removePlayer(index);
        });
    });
    
    // Update add button state
    addPlayerButton.disabled = tournamentPlayers.length >= 6;
    
    // Update player count styling
    const countElement = document.querySelector('.player-count');
    if (tournamentPlayers.length >= 3) {
        countElement?.classList.add('ready');
        setMatchesButton.disabled = false;
    } else {
        countElement?.classList.remove('ready');
        setMatchesButton.disabled = true;
    }
}

function updateBracket() {

    if (tournamentPlayers.length < 3) {
        bracketContainer.classList.add('hidden');
        return;
    }
    
    // Create bracket matches
    bracket = generateBracket(tournamentPlayers);
    startTournamentButton.disabled = false;
    
    // Render bracket
    let html = '<div class="bracket-rounds">';
    
    bracket.rounds.forEach((round, roundIndex) => {
        html += '<div class="bracket-round">';
        html += `<div class="round-title">Round ${roundIndex + 1}</div>`;
        
        round.forEach((match) => {
            if (match.player2 === null) {
                html += '<div class="match">';
                html += `<div class="match-player player1">${match.player1}</div>`;
                html += '<div class="match-player player2">BYE (Auto-advance)</div>';
                html += '</div>';
            } else {
                html += '<div class="match">';
                html += `<div class="match-player player1">${match.player1}</div>`;
                html += `<div class="match-player player2">${match.player2}</div>`;
                html += '</div>';
            }
        });
        
        html += '</div>';
    });
    
    html += '</div>';
    bracketContent.innerHTML = html;
}

function generateBracket(players: string[]) {
    // Shuffle players for random bracket
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    
    // Generate first round matches
    const firstRound: Match[] = [];
    for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
            const p1 = shuffled[i];
            const p2 = shuffled[i + 1];
            if (p1 && p2) {
                firstRound.push({
                    player1: p1,
                    player2: p2
                });
            }
        } else {
            // If odd number, someone gets a bye (we'll handle this simply)
            const p1 = shuffled[i];
            if (p1) {
                firstRound.push({
                    player1: p1,
                    player2: null
                });
            }
        }
    }
    
    // Generate subsequent rounds (simplified - just showing bracket structure)
    const rounds: Match[][] = [firstRound];
    let currentRound = firstRound;
    
    while (currentRound.length > 1) {
        const nextRound: Match[] = [];
        for (let i = 0; i < currentRound.length; i += 2) {
            if (i + 1 < currentRound.length) {
                nextRound.push({
                    player1: `Winner of Match ${i + 1}`,
                    player2: `Winner of Match ${i + 2}`
                });
            }
        }
        if (nextRound.length > 0) {
            rounds.push(nextRound);
        }
        currentRound = nextRound;
    }
    
    return { rounds };
}

addPlayerButton.addEventListener('click', addPlayer);

// Allow adding player by pressing Enter
playerNameInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addPlayer();
    }
});

startTournamentButton.addEventListener('click', () => {
    // Use existing bracket built in updateBracket
    if (!bracket || !bracket.rounds.length || !bracket.rounds[0]?.length) {
        return;
    }

    const firstMatch = bracket.rounds[0][0];
    if (!firstMatch) {
        return;
    }

    // Save to sessionStorage
    sessionStorage.setItem('gameMode', 'tournament');
    sessionStorage.setItem('player1', firstMatch.player1);
    sessionStorage.setItem('player2', firstMatch.player2 === null ? '' : firstMatch.player2);
    sessionStorage.setItem('tournamentPlayers', JSON.stringify(tournamentPlayers));
    sessionStorage.setItem('bracket', JSON.stringify(bracket));
    sessionStorage.setItem('currentRound', '0');
    sessionStorage.setItem('currentMatch', '0');
    sessionStorage.setItem('playedMatches', '[]');
    
    // Redirect to game page
    window.location.href = '../game.html';
});

function updateBracketWithWinners(bracket: Bracket, playedMatches: any[]) {
    // For each round except the first
    for (let roundIdx = 1; roundIdx < bracket.rounds.length; roundIdx++) {
        const round = bracket.rounds[roundIdx];
        const prevRound = bracket.rounds[roundIdx - 1];
        
        // Guard clauses
        if (!round || !prevRound) continue;
        
        // For each match in current round
        for (let matchIdx = 0; matchIdx < round.length; matchIdx++) {
            const match = round[matchIdx];
            if (!match) continue;
            
            // Check player1 (winner of previous round match 1 and 2)
            const prevMatch1Idx = matchIdx * 2;
            const prevMatch2Idx = matchIdx * 2 + 1;
            
            if (match.player1 && match.player1.includes('Winner of Match')) {
                const playedMatch = playedMatches.find((m: any) => 
                    m.roundIndex === roundIdx - 1 && m.matchIndex === prevMatch1Idx
                );
                if (playedMatch) {
                    match.player1 = playedMatch.winner;
                }
            }
            
            if (match.player2 && match.player2.includes('Winner of Match')) {
                const playedMatch = playedMatches.find((m: any) => 
                    m.roundIndex === roundIdx - 1 && m.matchIndex === prevMatch2Idx
                );
                if (playedMatch) {
                    match.player2 = playedMatch.winner;
                } else if (!playedMatch && prevMatch2Idx < prevRound.length) {
                    // Previous match not yet played, use the player from first round
                    match.player2 = prevRound[prevMatch2Idx]?.player1 || null;
                }
            }
        }
    }
}

const continueTournamentButton = document.getElementById('continueTournamentButton');
if (continueTournamentButton) {
    continueTournamentButton.addEventListener('click', () => {
        // Find next match
        const playedMatches = JSON.parse(sessionStorage.getItem('playedMatches') || '[]');
        const bracket = JSON.parse(sessionStorage.getItem('bracket') || 'null');
        
        if (!bracket) return;
        
        // For now, just go to next match in current round
        // This is simplified - a complete implementation would handle advancing to next round winners
        let nextMatchFound = false;
        
        for (let roundIdx = 0; roundIdx < bracket.rounds.length; roundIdx++) {
            const round = bracket.rounds[roundIdx];
            for (let matchIdx = 0; matchIdx < round.length; matchIdx++) {
                const matchPlayed = playedMatches.find((m: any) => 
                    m.roundIndex === roundIdx && m.matchIndex === matchIdx
                );
                
                if (!matchPlayed) {
                    // Update bracket with winners before finding next match
                    updateBracketWithWinners(bracket, playedMatches);
                    
                    // Found unplayed match
                    const match = bracket.rounds[roundIdx][matchIdx]; // Re-read match after update
                    sessionStorage.setItem('player1', match.player1);
                    sessionStorage.setItem('player2', match.player2 === null ? '' : match.player2);
                    sessionStorage.setItem('currentRound', roundIdx.toString());
                    sessionStorage.setItem('currentMatch', matchIdx.toString());
                    // Update bracket in sessionStorage with new winners
                    sessionStorage.setItem('bracket', JSON.stringify(bracket));
                    window.location.href = '../game.html';
                    nextMatchFound = true;
                    break;
                }
            }
            if (nextMatchFound) break;
        }
        
        if (!nextMatchFound) {
            alert('Tournament complete! Congratulations to winner player! Winner player: ' + playedMatches[playedMatches.length - 1].winner);
            sessionStorage.clear();
            window.location.href = '../index.html';
        }
    });
}


// /// Tournament JSON
// {
//     rounds :{
//         1 : {
//             match1:{
//                 player1: string,
//                 player2: string
//             },
//             match2{
//                 player1: string,
//                 player2: string
//             }
//         },
//         2 : {
//             {
//                 player1: string,
//                 player2: string
//             }
//             {
//                 player1: string,
//                 player2: string
//             }
//         },
//     }
// }