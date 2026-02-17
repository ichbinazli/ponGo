/* eslint-disable no-undef */
/**
 * Game Option Manager
 * Tüm oyun seçeneği yönetimini burada yapıyoruz
 */

type GameMode = 'modern' | 'nostalgia' | 'tournament';

interface GameModeConfig {
    mode: GameMode;
    divSelector: string;
    label: string;
}

const GAME_MODE_CONFIG: Record<GameMode, GameModeConfig> = {
    modern: {
        mode: 'modern',
        divSelector: '[data-game-mode-settings="modern"]',
        label: 'Modern Pong'
    },
    nostalgia: {
        mode: 'nostalgia',
        divSelector: '[data-game-mode-settings="nostalgia"]',
        label: 'Nostalji Pong'
    },
    tournament: {
        mode: 'tournament',
        divSelector: '[data-game-mode-settings="tournament"]',
        label: 'Turnuva'
    }
};

function navigateTo(path: string): void {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

export function setupGameModeSelection(): void {
    const modeLinks = document.querySelectorAll<HTMLAnchorElement>('[data-game-mode]');
    const modeCards = document.querySelectorAll<HTMLDivElement>('[data-game-mode]:not(a)');

    // Kartlara click event'i ekle
    modeCards.forEach(card => {
        card.addEventListener('click', () => {
            // Tüm kartlardan selected sınıfını kaldır
            modeCards.forEach(c => c.classList.remove('selected'));
            // Tıklanan kartı seçili yap
            card.classList.add('selected');

            // Seçilen moda ait ayar bölümüne scroll et
            const mode = card.dataset.gameMode;
            if (mode) {
                const settingsElement = document.querySelector<HTMLDivElement>(
                    `[data-game-mode-settings="${mode}"]`
                );

                if (settingsElement) {
                    // Ayar bölümünü göster
                    settingsElement.classList.remove('hidden');

                    // Diğer ayar bölümlerini gizle
                    document.querySelectorAll<HTMLDivElement>('[data-game-mode-settings]').forEach(el => {
                        if (el !== settingsElement) {
                            el.classList.add('hidden');
                        }
                    });

                    // Smooth scroll ile ayar bölümüne git
                    setTimeout(() => {
                        // Başlık elementine focus ver
                        const titleElement = settingsElement.querySelector<HTMLHeadingElement>('h2');
                        if (titleElement) {
                            titleElement.focus();

                            // Header yüksekliğini hesaba katarak scroll yap
                            const header = document.querySelector('nav') || document.querySelector('header');
                            const headerHeight = header ? header.offsetHeight : 80;
                            const elementPosition = settingsElement.getBoundingClientRect().top + window.scrollY;
                            const offsetPosition = elementPosition - headerHeight - 20;

                            window.scrollTo({
                                top: offsetPosition,
                                behavior: 'smooth'
                            });
                        }
                    }, 100);
                }
            }
        });
    });

    modeLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const mode = link.dataset.gameMode;
            if (!mode) return;
            sessionStorage.setItem('gameMode', mode);
            const href = link.getAttribute('href');
            if (href) {
                // Router yölendir
                window.location.href = href;
            }
        });
    });
}

/**
 * Nostalgia modu setup
 */
export function setupNostalgiaMode(): void {
    const modeButtons = document.querySelectorAll<HTMLButtonElement>('.nostalgia-mode-btn');
    const players2v2Section = document.getElementById('nostalgia-players-2v2');
    const players1v1Section = document.getElementById('nostalgia-players-1v1');
    const aiSettingsSection = document.getElementById('nostalgia-ai-settings');
    const startButton = document.getElementById('start-nostalgia-btn') as HTMLButtonElement | null;
    let selectedMode: string | undefined;
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedMode = btn.dataset.nostalgiaMode;

            modeButtons.forEach(b => b.classList.remove('bg-purple-500', 'ring-2', 'ring-purple-400'));
            btn.classList.add('bg-purple-500', 'ring-2', 'ring-purple-400');

            if (selectedMode === '1v1') {
                if (players2v2Section) players2v2Section.classList.remove('hidden');
                if (players1v1Section) players1v1Section.classList.add('hidden');
                if (aiSettingsSection) aiSettingsSection.classList.add('hidden');
            } else if (selectedMode === '1vAI') {
                if (players2v2Section) players2v2Section.classList.add('hidden');
                if (players1v1Section) players1v1Section.classList.remove('hidden');
                if (aiSettingsSection) aiSettingsSection.classList.remove('hidden');
            }

            if (startButton) {
                startButton.disabled = false;
            }
        });
    });

    if (startButton) {
        startButton.addEventListener('click', () => {
            const winScoreSelect = document.getElementById('nostalgia-win-score') as HTMLSelectElement | null;
            const winScoreParsed = winScoreSelect ? parseInt(winScoreSelect.value, 10) : NaN;
            const winScoreToStore = !Number.isNaN(winScoreParsed) && winScoreParsed > 0
                ? winScoreParsed.toString()
                : '10';
            sessionStorage.setItem('winningScore', winScoreToStore);

            if (selectedMode === '1v1') {
                const player1Input = (document.getElementById('nostalgia-player1-name') as HTMLInputElement)?.value.trim();
                const player2Input = (document.getElementById('nostalgia-player2-name') as HTMLInputElement)?.value.trim();

                const player1 = player1Input || 'Oyuncu 1';
                const player2 = player2Input || 'Oyuncu 2';

                sessionStorage.setItem('gameMode', 'nostalgia');
                sessionStorage.setItem('player1', player1);
                sessionStorage.setItem('player2', player2);
                navigateTo('/nostalgia');
            } else if (selectedMode === '1vAI') {
                const playerNameInput = (document.getElementById('nostalgia-player-name') as HTMLInputElement)?.value.trim();
                const playerName = playerNameInput || 'Oyuncu';
                const aiDifficulty = (document.getElementById('nostalgia-ai-difficulty') as HTMLSelectElement)?.value;

                sessionStorage.setItem('gameMode', 'nostalgia');
                sessionStorage.setItem('playerName', playerName);
                sessionStorage.setItem('aiDifficulty', aiDifficulty);
                navigateTo('/nostalgia');
            }
        });
    }
}

/**
 * Modern modu setup
 */
export function setupModernMode(): void {
    const modeButtons = document.querySelectorAll<HTMLButtonElement>('.modern-mode-btn');
    const players2v2Section = document.getElementById('modern-players-2v2');
    const players1v1Section = document.getElementById('modern-players-1v1');
    const aiSettingsSection = document.getElementById('modern-ai-settings');
    const startButton = document.getElementById('start-modern-btn') as HTMLButtonElement | null;
    let selectedMode: string | undefined;
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedMode = btn.dataset.modernMode;

            modeButtons.forEach(b => b.classList.remove('bg-cyan-500', 'ring-2', 'ring-cyan-400'));
            btn.classList.add('bg-cyan-500', 'ring-2', 'ring-cyan-400');

            if (selectedMode === '1v1') {
                if (players2v2Section) players2v2Section.classList.remove('hidden');
                if (players1v1Section) players1v1Section.classList.add('hidden');
                if (aiSettingsSection) aiSettingsSection.classList.add('hidden');
            } else if (selectedMode === '1vAI') {
                if (players2v2Section) players2v2Section.classList.add('hidden');
                if (players1v1Section) players1v1Section.classList.remove('hidden');
                if (aiSettingsSection) aiSettingsSection.classList.remove('hidden');
            }

            if (startButton) {
                startButton.disabled = false;
            }
        });
    });

    if (startButton) {
        startButton.addEventListener('click', () => {
            const powerups = {
                freeze: (document.getElementById('powerup-freeze') as HTMLInputElement)?.checked || false,
                speedBoost: (document.getElementById('powerup-speed-boost') as HTMLInputElement)?.checked || false,
                megaPaddle: (document.getElementById('powerup-mega-paddle') as HTMLInputElement)?.checked || false
            };

            const winScoreSelect = document.getElementById('modern-win-score') as HTMLSelectElement | null;
            const winScoreParsed = winScoreSelect ? parseInt(winScoreSelect.value, 10) : NaN;
            const winScoreToStore = !Number.isNaN(winScoreParsed) && winScoreParsed > 0
                ? winScoreParsed.toString()
                : '10';
            sessionStorage.setItem('winningScore', winScoreToStore);

            if (selectedMode === '1v1') {
                const player1Input = (document.getElementById('modern-player1-name') as HTMLInputElement)?.value.trim();
                const player2Input = (document.getElementById('modern-player2-name') as HTMLInputElement)?.value.trim();

                const player1 = player1Input || 'Oyuncu 1';
                const player2 = player2Input || 'Oyuncu 2';

                sessionStorage.setItem('gameMode', 'modern');
                sessionStorage.setItem('matchType', 'h2h');
                sessionStorage.setItem('player1', player1);
                sessionStorage.setItem('player2', player2);
                sessionStorage.setItem('powerups', JSON.stringify(powerups));
                navigateTo('/game');
            } else if (selectedMode === '1vAI') {
                const playerNameInput = (document.getElementById('modern-player-name') as HTMLInputElement)?.value.trim();
                const playerName = playerNameInput || 'Oyuncu';
                const aiDifficulty = (document.getElementById('modern-ai-difficulty') as HTMLSelectElement)?.value;

                sessionStorage.setItem('gameMode', 'modern');
                sessionStorage.setItem('matchType', 'h2ai');
                sessionStorage.setItem('playerName', playerName);
                sessionStorage.setItem('aiDifficulty', aiDifficulty);
                sessionStorage.setItem('powerups', JSON.stringify(powerups));
                navigateTo('/game');
            }
        });
    }
}

/**
 * Tournament modu setup
 */
export function setupTournamentFunctionality(): void {
    let tournamentPlayers: Array<{ id: number, alias: string, number: number }> = [];
    const maxPlayers = 8;

    const addPlayer = () => {
        const playerInput = document.getElementById('player-alias-input') as HTMLInputElement;
        const playerList = document.getElementById('player-list');
        const playerCountSpan = document.getElementById('player-count');

        if (!playerInput || !playerList || !playerCountSpan) {
            return;
        }

        const alias = playerInput.value.trim();

        if (!alias) {
            alert('Lütfen bir isim girin!');
            playerInput.focus();
            return;
        }

        if (tournamentPlayers.some(p => p.alias.toLowerCase() === alias.toLowerCase())) {
            alert('Bu isim zaten kullanılıyor!');
            playerInput.focus();
            return;
        }

        if (tournamentPlayers.length >= maxPlayers) {
            alert('Maksimum oyuncu sayısına ulaşıldı!');
            return;
        }

        const player = {
            id: Date.now(),
            alias: alias,
            number: tournamentPlayers.length + 1
        };

        tournamentPlayers.push(player);
        renderPlayers();
        playerInput.value = '';
        updatePlayerCount();
        playerInput.focus();
    };

    const removePlayer = (playerId: number) => {
        const index = tournamentPlayers.findIndex(p => p.id === playerId);
        if (index > -1) {
            tournamentPlayers.splice(index, 1);
            tournamentPlayers.forEach((player, idx) => {
                player.number = idx + 1;
            });
            renderPlayers();
            updatePlayerCount();
        }
    };

    const renderPlayers = () => {
        const playerList = document.getElementById('player-list');

        if (!playerList) {
            return;
        }

        playerList.innerHTML = '';

        tournamentPlayers.forEach((player) => {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-item';
            playerElement.innerHTML = `
                <span class="player-number">#${player.number}</span>
                <span class="player-alias">${player.alias}</span>
                <button class="remove-player-btn" data-player-id="${player.id}">
                    🗑️
                </button>
            `;

            const removeBtn = playerElement.querySelector('.remove-player-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => removePlayer(player.id));
            }

            playerList.appendChild(playerElement);
        });
    };

    const updatePlayerCount = () => {
        const playerCountSpan = document.getElementById('player-count');
        const startTournamentBtn = document.getElementById('start-tournament-btn') as HTMLButtonElement;

        if (playerCountSpan) {
            playerCountSpan.textContent = tournamentPlayers.length.toString();
        }

        if (startTournamentBtn) {
            startTournamentBtn.disabled = tournamentPlayers.length < 3;
        }
    };

    const startTournament = () => {
        if (tournamentPlayers.length < 2) {
            alert('En az 2 oyuncu gereklidir!');
            return;
        }

        alert(`Turnuva ${tournamentPlayers.length} oyuncu ile başlatılıyor!`);
    };

    const setupEventListeners = () => {
        const playerInput = document.getElementById('player-alias-input') as HTMLInputElement;
        const addPlayerBtn = document.getElementById('add-player-btn');
        const startTournamentBtn = document.getElementById('start-tournament-btn');

        if (addPlayerBtn) {
            addPlayerBtn.addEventListener('click', () => {
                addPlayer();
            });
        }

        if (playerInput) {
            playerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addPlayer();
                }
            });
        }

        if (startTournamentBtn) {
            startTournamentBtn.addEventListener('click', startTournament);
        }

        updatePlayerCount();

        if (playerInput) {
            setTimeout(() => playerInput.focus(), 100);
        }
    };

    setTimeout(setupEventListeners, 100);
}
Object.values(GAME_MODE_CONFIG).forEach((config) => {
    const modeDiv = document.querySelector(config.divSelector) as HTMLElement;
    if (modeDiv) {
        modeDiv.classList.add('hidden');
    }
});

/**
 * Oyun seçeneklerini temizle (SPA için state sıfırla)
 */
function resetGameOptionState(): void {
    // Mode butonlarından seçili durumunu kaldır
    document.querySelectorAll<HTMLButtonElement>('.modern-mode-btn, .nostalgia-mode-btn').forEach(btn => {
        btn.classList.remove('bg-cyan-500', 'ring-2', 'ring-cyan-400', 'bg-purple-500', 'ring-2', 'ring-purple-400');
    });
    
    // Start buttonlarını disabled yap
    const startButtons = document.querySelectorAll<HTMLButtonElement>(
        '#start-modern-btn, #start-nostalgia-btn, #start-tournament-btn'
    );
    startButtons.forEach(btn => {
        btn.disabled = true;
    });
    
    // Tüm ayar bölümlerini gizle
    document.querySelectorAll<HTMLDivElement>('[data-game-mode-settings]').forEach(el => {
        el.classList.add('hidden');
    });
    
    // Oyuncu bilgisi bölümlerini gizle
    document.querySelectorAll<HTMLDivElement>(
        '#modern-players-2v2, #modern-players-1v1, #nostalgia-players-2v2, #nostalgia-players-1v1'
    ).forEach(el => {
        if (el) el.classList.add('hidden');
    });
}


export function initGameOptions(): void {
    console.log('Game Options başlatılıyor...');
    resetGameOptionState();
    setupGameModeSelection();
    setupNostalgiaMode();
    setupModernMode();
    setupTournamentFunctionality();
    sessionStorage.clear();
    
    // localStorage'dan kullanıcı adını al ve AI input'larını doldur
    fillPlayerNameInputs();
    
    console.log('Game Options başarıyla başlatıldı');
}

function fillPlayerNameInputs(): void {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        
        const user = JSON.parse(userStr);
        const displayName = user?.displayName;
        
        if (!displayName) return;
        
        // Modern mod AI oyuncu input'u
        const modernPlayerInput = document.getElementById('modern-player-name') as HTMLInputElement | null;
        if (modernPlayerInput) {
            modernPlayerInput.value = displayName;
        }
        
        // Nostalgia mod AI oyuncu input'u
        const nostalgiaPlayerInput = document.getElementById('nostalgia-player-name') as HTMLInputElement | null;
        if (nostalgiaPlayerInput) {
            nostalgiaPlayerInput.value = displayName;
        }
    } catch (error) {
        console.error('localStorage displayName okunamadı:', error);
    }
}

