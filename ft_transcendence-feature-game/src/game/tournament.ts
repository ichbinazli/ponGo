import { createTournament, startTournament, TournamentMatch, TournamentStartPayload, tournamentAddGuest, tournamentAddParticipant } from './apiCalls';

interface Player {
    participantId: number;
    userId: number | null;
    alias: string;
}

interface Match {
    player1: Player;
    player2: Player;
    winner?: Player;
    round: number;
    matchOrder?: number;
}


let tournamentPlayers: Player[] = [];
let matches: Match[] = [];
let tournamentId: number;

//Kendime not
//
//Player    Round     1.Round     2.Round     Final
//3         2           1 maç      1 maç
//4         2           2 maç      1 maç
//5         3           2 maç      1 maç      1 maç
//6         3           3 maç      1 maç      1 maç
//7         3           3 maç      2 maç      1 maç
//8         3           4 maç      2 maç      1 maç

type PlayerCount = 3 | 4 | 5 | 6 | 7 | 8;

const Rounds: Record<PlayerCount, number[]> = {
    3: [1, 1],
    4: [2, 1],
    5: [2, 1, 1],
    6: [3, 1, 1],
    7: [3, 2, 1],
    8: [4, 2, 1]
};

export async function initTournament() {
    const tournamentRoot = document.getElementById('tournament-bracket');
    if (!tournamentRoot) {
        return;
    }
    if (tournamentRoot.dataset.initialized === 'true') {
        return;
    }
    tournamentRoot.dataset.initialized = 'true';


    const storedPlayers = sessionStorage.getItem('tournamentPlayers');
    if (storedPlayers) {
        tournamentPlayers = JSON.parse(storedPlayers);
    }

    console.log("Tournament Players: ", tournamentPlayers);

    if (tournamentPlayers.length < 3) {
        alert('Yeterli oyuncu bulunamadı!');
        return;
    }

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
    const res = await createTournament(createTournamentTitle(), 8);
    if (res?.success) {
        tournamentId = res.data.tournament.id;
    }
    await addPlayersApi();
    await createFirstRound();
}

function createTournamentTitle(): string {
    const today = new Date()

    const formattedDate = new Intl.DateTimeFormat("tr-TR").format(today)

    return `${formattedDate} Tarihinde Düzenlenen Turnuva`
}

async function createFirstRound() {
    const shuffledPlayers = [...tournamentPlayers].sort(() => Math.random() - 0.5);

    matches = [];

    // Round 1: eşleşebilen çiftler
    for (let i = 0; i + 1 < shuffledPlayers.length; i += 2) {
        matches.push({
            player1: shuffledPlayers[i],
            player2: shuffledPlayers[i + 1],
            round: 1
        });
    }


    let round1Order = 1;
    const tournamentMathches: TournamentMatch[] = matches.map((match) => {
        if (match.round === 1) {
            return {
                round: match.round,
                matchOrder: round1Order++,
                participant1Alias: match.player1.alias,
                participant2Alias: match.player2 ? match.player2.alias : null
            };
        } else {
            // Round 2+ bye maçı
            return {
                round: match.round,
                matchOrder: match.matchOrder ?? 1,
                participant1Alias: match.player1.alias,
                participant2Alias: null
            };
        }
    });


    const playerCount = tournamentPlayers.length as PlayerCount;
    const roundPlan = Rounds[playerCount];

    roundPlan.forEach((matchCount: number, roundIndex: number) => {
        const roundNumber = roundIndex + 1;
        if (roundNumber !== 1) {
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
        if (roundNumber !== 1) {
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
    if (res?.success) {
        console.log("Matches started: ", res.data.matches);
    }
}