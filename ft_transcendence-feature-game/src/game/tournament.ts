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

    // Round 1: eşleşebilen çiftler
    for (let i = 0; i + 1 < shuffledPlayers.length; i += 2) {
        matches.push({
            player1: shuffledPlayers[i],
            player2: shuffledPlayers[i + 1],
            round: 1
        });
    }

    // Tek sayıda oyuncu varsa, kalan oyuncuyu Round 2'ye bye olarak ekle
    // Bu oyuncu Round 1'deki ilk kazananla Round 2'de eşleşecek
    if (shuffledPlayers.length % 2 !== 0) {
        const byePlayer = shuffledPlayers[shuffledPlayers.length - 1];
        matches.push({
            player1: byePlayer,
            player2: null,
            round: 2,
            matchOrder: 1  // Round 2'nin ilk maçı olarak rezerve edilir
        });
    }

    // Round 1 maçlarına 1'den başlayan sıra numarası ver
    // Round 2 bye maçı kendi matchOrder'ını zaten taşıyor
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

    const payload: TournamentStartPayload = {
        tournamentId: tournamentId,
        matches: tournamentMathches
    }

    startTournament(payload);
}