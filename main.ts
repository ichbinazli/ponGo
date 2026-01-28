const aiCard = document.getElementById('aiCard')!;
const h2hCard = document.getElementById('h2hCard')!;
const tournamentCard = document.getElementById('tournamentCard')!;


aiCard.addEventListener('click', () => {
    sessionStorage.setItem('gameMode', 'h2ai');
    window.location.href = './game.html';
});

h2hCard.addEventListener('click', () => {
    sessionStorage.setItem('gameMode', 'h2h');
    window.location.href = './game.html';
});

tournamentCard.addEventListener('click', () => {
    sessionStorage.setItem('gameMode', 'tournament');
    window.location.href = './game/tournament.html';
});

