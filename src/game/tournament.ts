import { createTournament, startTournament, TournamentMatch, TournamentStartPayload, tournamentAddGuest, tournamentAddParticipant} from './apiCalls';

interface Player{
    participantId: number;
    userId: number | null;
    alias: string;
}

interface Match {
    player1: Player;
    player2: Player | null;
    winner?: Player;
    round: number;
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

async function addPlayersApi(){
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

    for (let i = 0; i < shuffledPlayers.length; i += 2) {
        if (i + 1 < shuffledPlayers.length) {
            matches.push({
                player1: shuffledPlayers[i],
                player2: shuffledPlayers[i + 1],
                round: 1
            });
        }
    }

    const tournamentMathches: TournamentMatch[] = matches.map((match, index) => ({
        round: match.round,
        matchOrder: index + 1,
        participant1Alias: match.player1.alias,
        participant2Alias: match.player2 ? match.player2.alias : null
    }));

    const payload: TournamentStartPayload = {
        tournamentId: tournamentId,
        matches: tournamentMathches
    }

    startTournament(payload);
}