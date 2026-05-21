import { createTournament, startTournament, TournamentMatch, TournamentStartPayload, tournamentAddGuest, tournamentAddParticipant } from './apiCalls';
import { I18n } from '../utils/i18n';

interface Player {
    participantId: number;
    userId: number | null;
    alias: string;
}

interface Match {
    player1: Player;
    player2?: Player;
    winner?: Player;
    round: number;
    matchOrder?: number;
    id?: number;
    duration_seconds?: number;
    player1_id?: number;
    player2_id?: number;
    player1_score?: number;
    player2_score?: number;
    started_at?: string;
    winner_participant_id?: number;
}

interface TournamentStatusConfig {
    title: string;
    detail: string;
}

let tournamentPlayers: Player[] = [];
let matches: Match[] = [];
let tournamentId: number;
let selectedReadyMatchIndex: number | null = null;

function saveTournamentState() {
    sessionStorage.setItem('tournamentState', JSON.stringify({
        tournamentId,
        matches,
        tournamentPlayers,
    }));
}

function restoreTournamentState(): boolean {
    const raw = sessionStorage.getItem('tournamentState');
    if (!raw) return false;
    try {
        const state = JSON.parse(raw);
        tournamentId = state.tournamentId;
        matches = state.matches;
        tournamentPlayers = state.tournamentPlayers;
        return true;
    } catch {
        return false;
    }
}

function applyMatchResult() {
    const winner = sessionStorage.getItem('tournamentMatchWinner');
    const matchIdStr = sessionStorage.getItem('currentMatchId');
    const apiResponseRaw = sessionStorage.getItem('tournamentMatchApiResponse');

    if (!winner || !matchIdStr) return;

    const matchId = parseInt(matchIdStr);

    if (apiResponseRaw) {
        try {
            const apiResponse = JSON.parse(apiResponseRaw);
            const savedMatch = apiResponse.data?.match;

            if (savedMatch) {
                const localMatch = matches.find(m => m.id === matchId);
                if (localMatch) {
                    localMatch.player1_score = savedMatch.participant1_score;
                    localMatch.player2_score = savedMatch.participant2_score;
                    localMatch.winner_participant_id = savedMatch.winner_participant_id;
                    localMatch.duration_seconds = savedMatch.duration_seconds;

                    if (savedMatch.winner_participant_id === localMatch.player1_id) {
                        localMatch.winner = localMatch.player1;
                    } else if (localMatch.player2 && savedMatch.winner_participant_id === localMatch.player2_id) {
                        localMatch.winner = localMatch.player2;
                    }
                }
            }

            if (apiResponse.data?.roundCompleted && apiResponse.data?.nextRound?.matches) {
                const nextRoundMatches: any[] = apiResponse.data.nextRound.matches;
                const nextRound: number = apiResponse.data.nextRound.round;

                matches = matches.filter(m => m.round !== nextRound);

                for (const nm of nextRoundMatches) {
                    const newMatch: Match = {
                        id: nm.id,
                        round: nm.round,
                        matchOrder: nm.match_order,
                        player1: {
                            participantId: nm.participant1_id,
                            userId: nm.participant1_user_id,
                            alias: nm.participant1_alias || '',
                        },
                        player1_id: nm.participant1_id,
                        player2_id: nm.participant2_id,
                        player1_score: nm.participant1_score ?? 0,
                        player2_score: nm.participant2_score ?? 0,
                    };
                    if (nm.participant2_id) {
                        newMatch.player2 = {
                            participantId: nm.participant2_id,
                            userId: nm.participant2_user_id,
                            alias: nm.participant2_alias || '',
                        };
                    }
                    if (nm.winner_participant_id != null) {
                        newMatch.winner_participant_id = nm.winner_participant_id;
                    }
                    if (nm.duration_seconds != null) {
                        newMatch.duration_seconds = nm.duration_seconds;
                    }
                    matches.push(newMatch);
                }
            }
        } catch (e) {
            console.error('Failed to parse tournament match API response:', e);
        }
    } else {
        const scoreP1 = sessionStorage.getItem('tournamentMatchScoreP1');
        const scoreP2 = sessionStorage.getItem('tournamentMatchScoreP2');
        const localMatch = matches.find(m => m.id === matchId);
        if (localMatch) {
            localMatch.player1_score = parseInt(scoreP1 || '0');
            localMatch.player2_score = parseInt(scoreP2 || '0');
            if (winner === 'player1') {
                localMatch.winner = localMatch.player1;
                localMatch.winner_participant_id = localMatch.player1_id ?? 0;
            } else if (localMatch.player2) {
                localMatch.winner = localMatch.player2;
                localMatch.winner_participant_id = localMatch.player2_id ?? 0;
            }
        }
    }

    sessionStorage.removeItem('tournamentMatchWinner');
    sessionStorage.removeItem('tournamentMatchScoreP1');
    sessionStorage.removeItem('tournamentMatchScoreP2');
    sessionStorage.removeItem('currentMatchId');
    sessionStorage.removeItem('tournamentMatchApiResponse');

    saveTournamentState();
}

type PlayerCount = 3 | 4 | 5 | 6 | 7 | 8;

const Rounds: Record<PlayerCount, number[]> = {
    3: [1, 1],
    4: [2, 1],
    5: [2, 1, 1],
    6: [3, 1, 1],
    7: [3, 2, 1],
    8: [4, 2, 1]
};

function setTournamentStatus(config: TournamentStatusConfig) {
    const statusEl = document.getElementById('tournament-status');
    const detailEl = document.getElementById('tournament-status-detail');

    if (statusEl) {
        statusEl.textContent = config.title;
    }

    if (detailEl) {
        detailEl.textContent = config.detail;
    }
}

function getRoundTitle(round: number, maxRound: number): string {
    const i18n = I18n.getInstance();
    if (round === maxRound) {
        return i18n.t('tournament.final');
    }
    return `${round}. ${i18n.t('tournament.round')}`;
}

function getMatchStatus(match: Match): { text: string; className: string } {
    const i18n = I18n.getInstance();
    if (match.winner || match.winner_participant_id) {
        return { text: i18n.t('tournament.statusCompleted'), className: 'bg-emerald-900 text-emerald-300' };
    }

    if (match.player1?.alias && !match.player2?.alias) {
        if (match.round === 1) {
            return { text: i18n.t('tournament.statusBye'), className: 'bg-amber-900 text-amber-300' };
        }
        return { text: i18n.t('tournament.statusWaitingOpponent'), className: 'bg-slate-700 text-slate-200' };
    }

    if (match.player1?.alias && match.player2?.alias) {
        return { text: i18n.t('tournament.statusReady'), className: 'bg-cyan-900 text-cyan-300' };
    }

    return { text: i18n.t('tournament.statusPending'), className: 'bg-slate-700 text-slate-200' };
}

function isMatchReady(match: Match): boolean {
    return !!match.player1?.alias
        && !!match.player2?.alias
        && !match.winner
        && !match.winner_participant_id;
}

function getReadyMatchCount(): number {
    return matches.filter(isMatchReady).length;
}

function updateCurrentMatchCard() {
    const currentMatchCard = document.getElementById('current-match-card');
    const player1NameEl = document.getElementById('player1-name');
    const player2NameEl = document.getElementById('player2-name');

    if (!currentMatchCard || !player1NameEl || !player2NameEl) {
        return;
    }

    if (selectedReadyMatchIndex === null) {
        currentMatchCard.classList.add('hidden');
        return;
    }

    const selectedMatch = matches[selectedReadyMatchIndex];
    if (!selectedMatch || !isMatchReady(selectedMatch)) {
        selectedReadyMatchIndex = null;
        currentMatchCard.classList.add('hidden');
        return;
    }

    player1NameEl.textContent = selectedMatch.player1.alias;
    player2NameEl.textContent = selectedMatch.player2?.alias || 'TBD';
    currentMatchCard.classList.remove('hidden');
}

function selectMatchForStart(matchIndex: number) {
    if (!matches[matchIndex] || !isMatchReady(matches[matchIndex])) {
        return;
    }

    const i18n = I18n.getInstance();
    selectedReadyMatchIndex = matchIndex;
    updateCurrentMatchCard();
    renderTournamentBracket();

    setTournamentStatus({
        title: i18n.t('tournament.matchSelected'),
        detail: `${matches[matchIndex].player1.alias} vs ${matches[matchIndex].player2?.alias} ${i18n.t('tournament.matchWaiting')}`
    });
}

function bindStartSelectedMatch() {
    const startMatchButton = document.getElementById('start-match-btn') as HTMLButtonElement | null;
    if (!startMatchButton) {
        return;
    }

    startMatchButton.onclick = () => {
        if (selectedReadyMatchIndex === null) {
            return;
        }

        const selectedMatch = matches[selectedReadyMatchIndex];
        if (!selectedMatch || !selectedMatch.player2 || !isMatchReady(selectedMatch)) {
            return;
        }

        sessionStorage.setItem('gameMode', 'tournament');
        sessionStorage.setItem('matchType', 'h2h');
        sessionStorage.setItem('player1', selectedMatch.player1.alias);
        sessionStorage.setItem('player2', selectedMatch.player2.alias);
        sessionStorage.setItem('player1_id', String(selectedMatch.player1_id ?? 0));
        sessionStorage.setItem('player2_id', String(selectedMatch.player2_id ?? 0));
        sessionStorage.setItem('invitedUserId', String(selectedMatch.player1_id ?? ''));
        sessionStorage.setItem('playerSide', 'right');
        sessionStorage.setItem('currentMatchId', String(selectedMatch.id ?? 0));

        saveTournamentState();

        window.history.replaceState({}, '', '/game');
        window.dispatchEvent(new PopStateEvent('popstate'));
    };
}

function renderTournamentBracket() {
    const tournamentRoot = document.getElementById('tournament-bracket');
    if (!tournamentRoot) {
        return;
    }

    const i18n = I18n.getInstance();
    tournamentRoot.innerHTML = '';

    if (!matches.length) {
        const emptyState = document.createElement('div');
        emptyState.className = 'rounded-xl border border-slate-700 bg-slate-800/40 p-4 text-slate-300';
        emptyState.textContent = i18n.t('tournament.noMatchesYet');
        tournamentRoot.appendChild(emptyState);
        return;
    }

    const roundNumbers = [...new Set(matches.map((match) => match.round))].sort((a, b) => a - b);
    const maxRound = Math.max(...roundNumbers);

    roundNumbers.forEach((round) => {
        const roundMatches = matches.filter((match) => match.round === round);

        const roundContainer = document.createElement('div');
        roundContainer.className = 'rounded-2xl border border-slate-700 bg-slate-900/40 p-4';

        const roundHeader = document.createElement('div');
        roundHeader.className = 'mb-4 flex items-center justify-between';

        const roundTitle = document.createElement('h3');
        roundTitle.className = 'text-lg font-semibold text-white';
        roundTitle.textContent = getRoundTitle(round, maxRound);

        const roundBadge = document.createElement('span');
        roundBadge.className = 'rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300';
        roundBadge.textContent = `${roundMatches.length} ${i18n.t('tournament.matches')}`;

        roundHeader.appendChild(roundTitle);
        roundHeader.appendChild(roundBadge);
        roundContainer.appendChild(roundHeader);

        const roundMatchesWrapper = document.createElement('div');
        roundMatchesWrapper.className = 'space-y-3';

        roundMatches.forEach((match, index) => {
            const status = getMatchStatus(match);
            const matchIndex = matches.indexOf(match);
            const ready = isMatchReady(match);
            const isSelected = selectedReadyMatchIndex === matchIndex;

            const matchCard = document.createElement('div');
            matchCard.className = `rounded-xl border p-4 ${isSelected ? 'border-cyan-500 bg-slate-800' : 'border-slate-700 bg-slate-800/60'}`;

            const topRow = document.createElement('div');
            topRow.className = 'mb-3 flex items-center justify-between';

            const matchTitle = document.createElement('span');
            matchTitle.className = 'text-sm font-medium text-slate-300';
            matchTitle.textContent = `${i18n.t('tournament.match')} ${match.matchOrder ?? index + 1}`;

            const statusBadge = document.createElement('span');
            statusBadge.className = `rounded-full px-3 py-1 text-xs font-semibold ${status.className}`;
            statusBadge.textContent = status.text;

            topRow.appendChild(matchTitle);
            topRow.appendChild(statusBadge);
            matchCard.appendChild(topRow);

            const playersRow = document.createElement('div');
            playersRow.className = 'flex items-center justify-between gap-4 text-base font-semibold';

            const isCompleted = !!(match.winner || match.winner_participant_id);
            const p1IsWinner = isCompleted && (match.winner_participant_id === match.player1_id);
            const p2IsWinner = isCompleted && match.player2 && (match.winner_participant_id === match.player2_id);

            const player1El = document.createElement('span');
            player1El.className = p1IsWinner ? 'text-emerald-400 font-bold' : 'text-cyan-300';
            player1El.textContent = match.player1?.alias || 'TBD';
            if (p1IsWinner) player1El.textContent = '🏆 ' + player1El.textContent;

            const versusEl = document.createElement('span');
            versusEl.className = 'text-slate-400';

            if (isCompleted) {
                versusEl.className = 'text-amber-400 font-bold text-lg';
                versusEl.textContent = `${match.player1_score ?? 0} - ${match.player2_score ?? 0}`;
            } else {
                versusEl.textContent = match.player2?.alias ? 'vs' : '→';
            }

            const player2El = document.createElement('span');
            if (isCompleted) {
                player2El.className = p2IsWinner ? 'text-emerald-400 font-bold' : 'text-purple-300';
                player2El.textContent = match.player2?.alias || 'TBD';
                if (p2IsWinner) player2El.textContent += ' 🏆';
            } else {
                player2El.className = match.player2?.alias ? 'text-purple-300' : 'text-slate-500';
                player2El.textContent = match.player2?.alias || 'BYE';
            }

            playersRow.appendChild(player1El);
            playersRow.appendChild(versusEl);
            playersRow.appendChild(player2El);
            matchCard.appendChild(playersRow);

            if (ready) {
                const actionRow = document.createElement('div');
                actionRow.className = 'mt-3 flex justify-end';

                const selectButton = document.createElement('button');
                selectButton.className = `btn px-3 py-1 text-sm ${isSelected ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-slate-700 hover:bg-slate-600'}`;
                selectButton.textContent = isSelected ? i18n.t('tournament.selected') : i18n.t('tournament.selectMatch');
                selectButton.addEventListener('click', () => {
                    selectMatchForStart(matchIndex);
                });

                actionRow.appendChild(selectButton);
                matchCard.appendChild(actionRow);
            }

            roundMatchesWrapper.appendChild(matchCard);
        });

        roundContainer.appendChild(roundMatchesWrapper);
        tournamentRoot.appendChild(roundContainer);
    });
}

export async function initTournament() {
    const tournamentRoot = document.getElementById('tournament-bracket');
    if (!tournamentRoot) {
        return;
    }
    if (tournamentRoot.dataset.initialized === 'true') {
        return;
    }
    tournamentRoot.dataset.initialized = 'true';

    const i18n = I18n.getInstance();

    const isReturningFromMatch = sessionStorage.getItem('tournamentMatchWinner') !== null;
    const hasStoredState = sessionStorage.getItem('tournamentState') !== null;

    if (isReturningFromMatch && hasStoredState) {
        restoreTournamentState();
        applyMatchResult();

        bindStartSelectedMatch();

        selectedReadyMatchIndex = null;
        const firstReadyIndex = matches.findIndex(m => isMatchReady(m));
        if (firstReadyIndex >= 0) {
            selectedReadyMatchIndex = firstReadyIndex;
        }

        updateCurrentMatchCard();
        renderTournamentBracket();

        const readyMatchCount = getReadyMatchCount();
        if (readyMatchCount > 0) {
            setTournamentStatus({
                title: i18n.t('tournament.matchCompleted'),
                detail: `${readyMatchCount} ${i18n.t('tournament.readyMatches')}`
            });
        } else {
            const maxRound = Math.max(...matches.map(m => m.round));
            const finalMatch = matches.find(m => m.round === maxRound);
            const allDone = matches.every(m => m.winner || m.winner_participant_id || !m.player2?.alias);

            if (allDone && finalMatch?.winner) {
                setTournamentStatus({
                    title: i18n.t('tournament.tournamentCompleted'),
                    detail: `${i18n.t('tournament.winnerIs')} ${finalMatch.winner.alias}`
                });
                sessionStorage.removeItem('tournamentState');
            } else {
                setTournamentStatus({
                    title: i18n.t('tournament.waiting'),
                    detail: i18n.t('tournament.noReadyMatches')
                });
            }
        }
        return;
    }

    const storedPlayers = sessionStorage.getItem('tournamentPlayers');
    if (storedPlayers) {
        tournamentPlayers = JSON.parse(storedPlayers);
    }


    if (tournamentPlayers.length < 3) {
        alert(i18n.t('tournament.notEnoughPlayers'));
        return;
    }

    bindStartSelectedMatch();
    updateCurrentMatchCard();

    renderTournamentBracket();

    setTournamentStatus({
        title: i18n.t('tournament.starting'),
        detail: i18n.t('tournament.creating')
    });

    await initAsync();
}

async function addPlayersApi() {
    for (const player of tournamentPlayers) {
        if (player.userId) {
            const res = await tournamentAddParticipant(tournamentId, player.userId, player.alias);
            if (res?.success)
                player.participantId = res.data.participant.id;
        } else {
            const res = await tournamentAddGuest(tournamentId, player.alias);
            if (res?.success)
                player.participantId = res.data.participant.id;
        }
    }
}

async function initAsync() {
    const i18n = I18n.getInstance();
    setTournamentStatus({
        title: i18n.t('tournament.preparingMatches'),
        detail: i18n.t('tournament.creatingApi')
    });

    const res = await createTournament(createTournamentTitle(), 8);
    if (res?.success) {
        tournamentId = res.data.tournament.id;
    } else {
        setTournamentStatus({
            title: i18n.t('error.title'),
            detail: i18n.t('tournament.createError')
        });
        return;
    }

    setTournamentStatus({
        title: i18n.t('tournament.addingPlayers'),
        detail: i18n.t('tournament.registeringPlayers')
    });

    await addPlayersApi();

    setTournamentStatus({
        title: i18n.t('tournament.preparingMatches'),
        detail: i18n.t('tournament.creatingRounds')
    });

    await createFirstRound();
}

function createTournamentTitle(): string {
    const i18n = I18n.getInstance();
    const today = new Date()

    const formattedDate = new Intl.DateTimeFormat(i18n.getLanguage()).format(today)

    return `${formattedDate} ${i18n.t('tournament.tournamentDateTitle')}`
}

async function createFirstRound() {
    const shuffledPlayers = [...tournamentPlayers].sort(() => Math.random() - 0.5);

    matches = [];

    for (let i = 0; i + 1 < shuffledPlayers.length; i += 2) {
        matches.push({
            player1: shuffledPlayers[i],
            player2: shuffledPlayers[i + 1],
            round: 1
        });
    }

    if (shuffledPlayers.length % 2 !== 0) {
        const byePlayer = shuffledPlayers[shuffledPlayers.length - 1];
        matches.push({
            player1: byePlayer,
            round: 2,
            matchOrder: 1
        });
    }

    let round1Order = 1;
    const tournamentMathches: TournamentMatch[] = matches.map((match) => {
        if (match.round === 1 && match.player2) {
            return {
                round: match.round,
                matchOrder: round1Order++,
                participant1Alias: match.player1.alias,
                participant2Alias: match.player2.alias
            };
        } else {
            return {
                round: match.round,
                matchOrder: match.matchOrder ?? 1,
                participant1Alias: match.player1.alias,
            };
        }
    });


    const playerCount = tournamentPlayers.length as PlayerCount;
    const roundPlan = Rounds[playerCount];

    roundPlan.forEach((matchCount: number, roundIndex: number) => {
        const roundNumber = roundIndex + 1;
        if (roundNumber !== 1 && tournamentMathches[tournamentMathches.length - 1]?.round !== roundNumber) {
            for (let i = 0; i < matchCount; i++) {
                tournamentMathches.push({
                    round: roundNumber,
                    matchOrder: i + 1,
                });
            }
        }
    });



    roundPlan.forEach((matchCount: number, roundIndex: number) => {
        const roundNumber = roundIndex + 1;

        if (roundNumber !== 1 && matches[matches.length - 1]?.round !== roundNumber) {
            for (let i = 0; i < matchCount; i++) {
                matches.push({
                    round: roundNumber,
                    player1: { participantId: 0, userId: null, alias: '' },
                    player2: { participantId: 0, userId: null, alias: '' },
                });
            }
        }
    });


    const payload: TournamentStartPayload = {
        tournamentId: tournamentId,
        matches: tournamentMathches
    }


    const res = await startTournament(payload);
    let resultMatchData;
    if (res?.success) {
        resultMatchData = res.data.matches;
    } else {
        const i18n = I18n.getInstance();
        setTournamentStatus({
            title: i18n.t('error.title'),
            detail: i18n.t('tournament.startError')
        });
        return;
    }

    resultMatchData?.forEach((match : any, index: number) => {
        matches[index].id = match.id;
        matches[index].player1_id = match.participant1_id;
        matches[index].player2_id = match.participant2_id;
    });

    renderTournamentBracket();
    const readyMatchCount = getReadyMatchCount();
    if (selectedReadyMatchIndex === null && readyMatchCount > 0) {
        const firstReadyMatchIndex = matches.findIndex((match) => isMatchReady(match));
        if (firstReadyMatchIndex >= 0) {
            selectedReadyMatchIndex = firstReadyMatchIndex;
        }
    }
    updateCurrentMatchCard();
    const i18nLocal = I18n.getInstance();
    setTournamentStatus({
        title: i18nLocal.t('tournament.firstRoundReady'),
        detail: readyMatchCount > 1
            ? `${readyMatchCount} ${i18nLocal.t('tournament.readyMatchesCount')}`
            : readyMatchCount === 1
                ? i18nLocal.t('tournament.oneReadyMatch')
                : i18nLocal.t('tournament.noReadyMatchesShort')
    });
}
