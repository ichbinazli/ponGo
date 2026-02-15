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

let currentMode: GameMode | null = null;

/**
 * Router yölendir - SPA için navigate fonksiyonu
 */
function navigateTo(path: string): void {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Oyun modu kartlarına click event'i ekle
 */
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
                currentMode = mode as GameMode;
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

    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedMode = btn.dataset.nostalgiaMode;

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
            const selectedBtn = document.querySelector<HTMLButtonElement>('.nostalgia-mode-btn.bg-purple-500');
            if (!selectedBtn) {
                alert('Lütfen bir oyun modu seçin!');
                return;
            }

            const selectedMode = selectedBtn.dataset.nostalgiaMode;

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

    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedMode = btn.dataset.modernMode;

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
            const selectedBtn = document.querySelector<HTMLButtonElement>('.modern-mode-btn.bg-cyan-500');
            if (!selectedBtn) {
                alert('Lütfen bir oyun modu seçin!');
                return;
            }

            const selectedMode = selectedBtn.dataset.modernMode;

            const powerups = {
                freeze: (document.getElementById('powerup-freeze') as HTMLInputElement)?.checked || false,
                speedBoost: (document.getElementById('powerup-speed-boost') as HTMLInputElement)?.checked || false,
                megaPaddle: (document.getElementById('powerup-mega-paddle') as HTMLInputElement)?.checked || false
            };

            if (selectedMode === '1v1') {
                const player1Input = (document.getElementById('modern-player1-name') as HTMLInputElement)?.value.trim();
                const player2Input = (document.getElementById('modern-player2-name') as HTMLInputElement)?.value.trim();

                const player1 = player1Input || 'Oyuncu 1';
                const player2 = player2Input || 'Oyuncu 2';

                sessionStorage.setItem('gameMode', 'modern');
                sessionStorage.setItem('player1', player1);
                sessionStorage.setItem('player2', player2);
                sessionStorage.setItem('powerups', JSON.stringify(powerups));
                navigateTo('/game');
            } else if (selectedMode === '1vAI') {
                const playerNameInput = (document.getElementById('modern-player-name') as HTMLInputElement)?.value.trim();
                const playerName = playerNameInput || 'Oyuncu';
                const aiDifficulty = (document.getElementById('modern-ai-difficulty') as HTMLSelectElement)?.value;

                sessionStorage.setItem('gameMode', 'modern');
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
currentMode = null;

/**
 * Tüm setup işlemlerini başlat
 */
export function initGameOptions(): void {
    console.log('Game Options başlatılıyor...');
    setupGameModeSelection();
    setupNostalgiaMode();
    setupModernMode();
    setupTournamentFunctionality();
    console.log('Game Options başarıyla başlatıldı');
}

/**
 * Mevcut modu getir
 */
export function getCurrentMode(): GameMode | null {
    return currentMode;
}

/**
 * Tüm ayarları gizle
 */
export function clearOptions(): void {
    Object.values(GAME_MODE_CONFIG).forEach((config) => {
        const modeDiv = document.querySelector(config.divSelector) as HTMLElement;
        if (modeDiv) {
            modeDiv.classList.add('hidden');
        }
    });
    currentMode = null;
}
