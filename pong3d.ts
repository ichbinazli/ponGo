
import { searchUser, verifyPassword } from './apiCalls';

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

    modeCards.forEach(card => {
        card.addEventListener('click', () => {
            modeCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            const mode = card.dataset.gameMode;
            if (mode) {
                const settingsElement = document.querySelector<HTMLDivElement>(
                    `[data-game-mode-settings="${mode}"]`
                );

                if (settingsElement) {
                    settingsElement.classList.remove('hidden');

                    document.querySelectorAll<HTMLDivElement>('[data-game-mode-settings]').forEach(el => {
                        if (el !== settingsElement) {
                            el.classList.add('hidden');
                        }
                    });

                    setTimeout(() => {
                        const titleElement = settingsElement.querySelector<HTMLHeadingElement>('h2');
                        if (titleElement) {
                            titleElement.focus();

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
                window.location.href = href;
            }
        });
    });
}

export function setupNostalgiaMode(): void {
    const modeButtons = document.querySelectorAll<HTMLButtonElement>('.nostalgia-mode-btn');
    const playersh2hSection = document.getElementById('nostalgia-players-h2h');
    const players1v1Section = document.getElementById('nostalgia-players-1v1');
    const aiSettingsSection = document.getElementById('nostalgia-ai-settings');
    const sideSelectionSectionh2h = document.getElementById('nostalgia-side-selection-h2h');
    const startButton = document.getElementById('start-nostalgia-btn') as HTMLButtonElement | null;
    let selectedMode: string | undefined;
    let selectedSide: string = 'right';
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedMode = btn.dataset.nostalgiaMode;
            selectedSide = 'right';

            modeButtons.forEach(b => b.classList.remove('bg-purple-500', 'ring-2', 'ring-purple-400'));
            btn.classList.add('bg-purple-500', 'ring-2', 'ring-purple-400');

            if (selectedMode === '1v1') {
                if (playersh2hSection) playersh2hSection.classList.remove('hidden');
                if (sideSelectionSectionh2h) sideSelectionSectionh2h.classList.remove('hidden');
                if (players1v1Section) players1v1Section.classList.add('hidden');
                if (aiSettingsSection) aiSettingsSection.classList.add('hidden');
            } else if (selectedMode === '1vAI') {
                if (playersh2hSection) playersh2hSection.classList.add('hidden');
                if (sideSelectionSectionh2h) sideSelectionSectionh2h.classList.add('hidden');
                if (players1v1Section) players1v1Section.classList.remove('hidden');
                if (aiSettingsSection) aiSettingsSection.classList.remove('hidden');
            }

            if (startButton) {
                startButton.disabled = false;
            }

            updateNostalgiaSideButtons();
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
                const player1InputValue = (document.getElementById('nostalgia-player1-name') as HTMLInputElement)?.value.trim();
                const player2InputValue = (document.getElementById('nostalgia-player2-name') as HTMLInputElement)?.value.trim();

                const player1 = player1InputValue || 'Player 1';
                const player2 = player2InputValue || 'Player 2';

                let player2Id;
                let player1Id;
                if (selectedSide === 'right') {
                    player2Id = JSON.parse(localStorage.getItem('user') || '{}').id || '';
                    player1Id = sessionStorage.getItem('invitedUserId') || '';
                }
                else {
                    player1Id = JSON.parse(localStorage.getItem('user') || '{}').id || '';
                    player2Id = sessionStorage.getItem('invitedUserId') || '';
                }
                sessionStorage.setItem('gameMode', 'nostalgia');
                sessionStorage.setItem('matchType', 'h2h');
                sessionStorage.setItem('player1', player1);
                sessionStorage.setItem('player2', player2);
                sessionStorage.setItem('player1_id', player1Id || '');
                sessionStorage.setItem('player2_id', player2Id || '');
                sessionStorage.setItem('playerSide', selectedSide);
                navigateTo('/nostalgia');
            } else if (selectedMode === '1vAI') {
                const playerNameInput = (document.getElementById('nostalgia-player-name') as HTMLInputElement)?.value.trim();
                const playerName = playerNameInput || 'Player';
                const aiDifficulty = (document.getElementById('nostalgia-ai-difficulty') as HTMLSelectElement)?.value;

                sessionStorage.setItem('gameMode', 'nostalgia');
                sessionStorage.setItem('matchType', 'h2ai');
                sessionStorage.setItem('player1_id', '1');
                sessionStorage.setItem('player2_id', JSON.parse(localStorage.getItem('user') || '{}').id || '');
                sessionStorage.setItem('playerName', playerName);
                sessionStorage.setItem('aiDifficulty', aiDifficulty);
                navigateTo('/nostalgia');
            }
        });
    }

    const sideButtonsh2h = document.querySelectorAll<HTMLButtonElement>('[id="nostalgia-side-selection-h2h"] .nostalgia-side-btn');
    const sideToggleh2h = document.getElementById('nostalgia-side-toggle');

    const player1Input = document.getElementById('nostalgia-player1-name') as HTMLInputElement | null;
    const player2Input = document.getElementById('nostalgia-player2-name') as HTMLInputElement | null;

    const updateNostalgiaPlayerNameBySelectedSide = () => {
        const displayName = getDisplayNameFromLocalStorage();
        if (!displayName) return;

        const player1InviteBtn = document.getElementById('nostalgia-player1-invite-btn') as HTMLButtonElement;
        const player2InviteBtn = document.getElementById('nostalgia-player2-invite-btn') as HTMLButtonElement;

        if (selectedSide === 'left') {
            if (player1Input) player1Input.value = displayName;
            if (player2Input) player2Input.value = '';
            if (player1InviteBtn) player1InviteBtn.classList.add('hidden');
            if (player2InviteBtn) player2InviteBtn.classList.remove('hidden');
        } else {
            if (player1Input) player1Input.value = '';
            if (player2Input) player2Input.value = displayName;
            if (player1InviteBtn) player1InviteBtn.classList.remove('hidden');
            if (player2InviteBtn) player2InviteBtn.classList.add('hidden');
        }
    };

    const updateNostalgiaSideButtons = () => {
        sideButtonsh2h.forEach(btn => {
            btn.classList.remove('ring-2', 'ring-purple-400', 'bg-purple-500/30');
            if (btn.dataset.nostalgiaSide === selectedSide) {
                btn.classList.add('ring-2', 'ring-purple-400', 'bg-purple-500/30');
            }
        });

        if (sideToggleh2h) {
            const toggleIndicator = sideToggleh2h.querySelector('div');
            if (toggleIndicator) {
                if (selectedSide === 'left') {
                    toggleIndicator.style.left = '0.25rem';
                    sideToggleh2h.classList.remove('bg-purple-500/50');
                    sideToggleh2h.classList.add('bg-slate-700');
                } else {
                    toggleIndicator.style.left = 'calc(100% - 1.5rem - 0.25rem)';
                    sideToggleh2h.classList.add('bg-purple-500/50');
                    sideToggleh2h.classList.remove('bg-slate-700');
                }
            }
        }

        updateNostalgiaPlayerNameBySelectedSide();
    };

    sideButtonsh2h.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedSide = btn.dataset.nostalgiaSide || 'left';
            updateNostalgiaSideButtons();
        });
    });

    const player1InviteBtn = document.getElementById('nostalgia-player1-invite-btn') as HTMLButtonElement;
    const player2InviteBtn = document.getElementById('nostalgia-player2-invite-btn') as HTMLButtonElement;

    if (player1InviteBtn) {
        player1InviteBtn.addEventListener('click', () => {
            showInviteModal((user) => {
                if (player1Input) player1Input.value = user.displayName;
                player1Input?.setAttribute('data-user-id', user.id.toString());
            });
        });
    }

    if (player2InviteBtn) {
        player2InviteBtn.addEventListener('click', () => {
            showInviteModal((user) => {
                if (player2Input) player2Input.value = user.displayName;
                player2Input?.setAttribute('data-user-id', user.id.toString());
            });
        });
    }
}

export function setupModernMode(): void {
    const modeButtons = document.querySelectorAll<HTMLButtonElement>('.modern-mode-btn');
    const playersh2hSection = document.getElementById('modern-players-h2h');
    const players1v1Section = document.getElementById('modern-players-1v1');
    const aiSettingsSection = document.getElementById('modern-ai-settings');
    const sideSelectionSectionh2h = document.getElementById('modern-side-selection-h2h');
    const startButton = document.getElementById('start-modern-btn') as HTMLButtonElement | null;
    let selectedMode: string | undefined;
    let selectedSide: string = 'right';
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedMode = btn.dataset.modernMode;
            selectedSide = 'right';

            modeButtons.forEach(b => b.classList.remove('bg-cyan-500', 'ring-2', 'ring-cyan-400'));
            btn.classList.add('bg-cyan-500', 'ring-2', 'ring-cyan-400');

            if (selectedMode === '1v1') {
                if (playersh2hSection) playersh2hSection.classList.remove('hidden');
                if (sideSelectionSectionh2h) sideSelectionSectionh2h.classList.remove('hidden');
                if (players1v1Section) players1v1Section.classList.add('hidden');
                if (aiSettingsSection) aiSettingsSection.classList.add('hidden');
            } else if (selectedMode === '1vAI') {
                if (playersh2hSection) playersh2hSection.classList.add('hidden');
                if (sideSelectionSectionh2h) sideSelectionSectionh2h.classList.add('hidden');
                if (players1v1Section) players1v1Section.classList.remove('hidden');
                if (aiSettingsSection) aiSettingsSection.classList.remove('hidden');
            }

            if (startButton) {
                startButton.disabled = false;
            }

            updateSideButtons();
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
                const player1InputValue = (document.getElementById('modern-player1-name') as HTMLInputElement)?.value.trim();
                const player2InputValue = (document.getElementById('modern-player2-name') as HTMLInputElement)?.value.trim();

                const player1 = player1InputValue || 'Player 1';
                const player2 = player2InputValue || 'Player 2';

                const player1Element = document.getElementById('modern-player1-name') as HTMLInputElement;
                const player2Element = document.getElementById('modern-player2-name') as HTMLInputElement;
                const player1Id = player1Element ? player1Element.getAttribute('data-user-id') : null;
                const player2Id = player2Element ? player2Element.getAttribute('data-user-id') : null;

                sessionStorage.setItem('gameMode', 'modern');
                sessionStorage.setItem('matchType', 'h2h');
                sessionStorage.setItem('player1', player1);
                sessionStorage.setItem('player2', player2);
                sessionStorage.setItem('player1_id', player1Id || '');
                sessionStorage.setItem('player2_id', player2Id || '');
                sessionStorage.setItem('playerSide', selectedSide);
                sessionStorage.setItem('powerups', JSON.stringify(powerups));
                navigateTo('/game');
            } else if (selectedMode === '1vAI') {
                const playerNameInput = (document.getElementById('modern-player-name') as HTMLInputElement)?.value.trim();
                const playerName = playerNameInput || 'Player';
                const aiDifficulty = (document.getElementById('modern-ai-difficulty') as HTMLSelectElement)?.value;

                sessionStorage.setItem('gameMode', 'modern');
                sessionStorage.setItem('matchType', 'h2ai');
                sessionStorage.setItem('playerName', playerName);
                sessionStorage.setItem('aiDifficulty', aiDifficulty);
                sessionStorage.setItem('playerSide', selectedSide);
                sessionStorage.setItem('powerups', JSON.stringify(powerups));
                navigateTo('/game');
            }
        });
    }


    const sideButtonsh2h = document.querySelectorAll<HTMLButtonElement>('[id="modern-side-selection-h2h"] .modern-side-btn');
    const sideToggleh2h = document.getElementById('modern-side-toggle');

    const player1Input = document.getElementById('modern-player1-name') as HTMLInputElement | null;
    const player2Input = document.getElementById('modern-player2-name') as HTMLInputElement | null;

    const updatePlayerNameBySelectedSide = () => {
        const displayName = getDisplayNameFromLocalStorage();
        if (!displayName) return;

        const player1InviteBtn = document.getElementById('modern-player1-invite-btn') as HTMLButtonElement;
        const player2InviteBtn = document.getElementById('modern-player2-invite-btn') as HTMLButtonElement;

        if (selectedSide === 'left') {
            if (player1Input) player1Input.value = displayName;
            if (player2Input) player2Input.value = '';
            if (player1InviteBtn) player1InviteBtn.classList.add('hidden');
            if (player2InviteBtn) player2InviteBtn.classList.remove('hidden');
        } else {
            if (player1Input) player1Input.value = '';
            if (player2Input) player2Input.value = displayName;
            if (player1InviteBtn) player1InviteBtn.classList.remove('hidden');
            if (player2InviteBtn) player2InviteBtn.classList.add('hidden');
        }
    };

    const updateSideButtons = () => {
        sideButtonsh2h.forEach(btn => {
            btn.classList.remove('ring-2', 'ring-cyan-400', 'bg-cyan-500/30');
            if (btn.dataset.modernSide === selectedSide) {
                btn.classList.add('ring-2', 'ring-cyan-400', 'bg-cyan-500/30');
            }
        });

        if (sideToggleh2h) {
            const toggleIndicator = sideToggleh2h.querySelector('div');
            if (toggleIndicator) {
                if (selectedSide === 'left') {
                    toggleIndicator.style.left = '0.25rem';
                    sideToggleh2h.classList.remove('bg-cyan-500/50');
                    sideToggleh2h.classList.add('bg-slate-700');
                } else {
                    toggleIndicator.style.left = 'calc(100% - 1.5rem - 0.25rem)';
                    sideToggleh2h.classList.add('bg-cyan-500/50');
                    sideToggleh2h.classList.remove('bg-slate-700');
                }
            }
        }

        updatePlayerNameBySelectedSide();
    };

    sideButtonsh2h.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedSide = btn.dataset.modernSide || 'left';
            updateSideButtons();
        });
    });

    const player1InviteBtn = document.getElementById('modern-player1-invite-btn') as HTMLButtonElement;
    const player2InviteBtn = document.getElementById('modern-player2-invite-btn') as HTMLButtonElement;

    if (player1InviteBtn) {
        player1InviteBtn.addEventListener('click', () => {
            showInviteModal((user) => {
                if (player1Input) player1Input.value = user.displayName;
                player1Input?.setAttribute('data-user-id', user.id.toString());
            });
        });
    }

    if (player2InviteBtn) {
        player2InviteBtn.addEventListener('click', () => {
            showInviteModal((user) => {
                if (player2Input) player2Input.value = user.displayName;
                player2Input?.setAttribute('data-user-id', user.id.toString());
            });
        });
    }
}

export function setupTournamentFunctionality(): void {
    let tournamentPlayers: Array<{ participantId: number, alias: string, number: number, userId?: number }> = [];
    const maxPlayers = 8;

    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.displayName) {
                tournamentPlayers.push({
                    participantId: Date.now(),
                    alias: user.displayName,
                    number: 1,
                    userId: user.id
                });
            }
        } catch (error) {
            console.error('Error parsing user from localStorage:', error);
        }
    }

    const addPlayer = () => {
        const playerInput = document.getElementById('player-alias-input') as HTMLInputElement;
        const playerList = document.getElementById('player-list');
        const playerCountSpan = document.getElementById('player-count');

        if (!playerInput || !playerList || !playerCountSpan) {
            return;
        }

        const alias = playerInput.value.trim();

        if (!alias) {
            alert('Please enter a name!');
            playerInput.focus();
            return;
        }

        if (tournamentPlayers.some(p => p.alias.toLowerCase() === alias.toLowerCase())) {
            alert('This name is already in use!');
            playerInput.focus();
            return;
        }

        if (tournamentPlayers.length >= maxPlayers) {
            alert('Maximum player count reached!');
            return;
        }

        const player: { participantId: number; alias: string; number: number; userId?: number } = {
            participantId: Date.now(),
            alias: alias,
            number: tournamentPlayers.length + 1
        };

        const userIdAttr = playerInput.getAttribute('data-user-id');
        if (userIdAttr) {
            player.userId = parseInt(userIdAttr);
        }

        tournamentPlayers.push(player);
        renderPlayers();
        playerInput.value = '';
        playerInput.removeAttribute('data-user-id');
        updatePlayerCount();
        playerInput.focus();
    };

    const removePlayer = (playerId: number) => {
        const index = tournamentPlayers.findIndex(p => p.participantId === playerId);
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
            playerElement.className = 'flex items-center justify-between bg-slate-700/50 p-3 rounded-lg mb-2';
            playerElement.innerHTML = `
                <div class="flex items-center">
                    <span class="player-number text-cyan-400 font-bold mr-3">#${player.number}</span>
                    <span class="player-alias text-white">${player.alias}</span>
                </div>
                <button class="remove-player-btn text-red-400 hover:text-red-300 transition-colors" data-player-id="${player.participantId}">
                    🗑️
                </button>
            `;

            const removeBtn = playerElement.querySelector('.remove-player-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => removePlayer(player.participantId));
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
        if (tournamentPlayers.length < 3) {
            alert('At least 3 players are required!');
            return;
        }
        const winScoreSelect = document.getElementById('tournament-win-score') as HTMLSelectElement | null;
        const winScoreParsed = winScoreSelect ? parseInt(winScoreSelect.value, 10) : NaN;
        const winScoreToStore = !Number.isNaN(winScoreParsed) && winScoreParsed > 0
            ? winScoreParsed.toString()
            : '10';

        sessionStorage.setItem('gameMode', 'tournament');
        sessionStorage.setItem('tournamentPlayers', JSON.stringify(tournamentPlayers));
        sessionStorage.setItem('winningScore', winScoreToStore);

        navigateTo('/tournament');
    };

    const setupEventListeners = () => {
        const playerInput = document.getElementById('player-alias-input') as HTMLInputElement;
        const addPlayerBtn = document.getElementById('add-player-btn');
        const startTournamentBtn = document.getElementById('start-tournament-btn');
        const tournamentInviteBtn = document.getElementById('tournament-invite-btn') as HTMLButtonElement;

        if (tournamentInviteBtn) {
            tournamentInviteBtn.addEventListener('click', () => {
                showInviteModal((user) => {
                    if (playerInput) playerInput.value = user.displayName;
                    playerInput?.setAttribute('data-user-id', user.id.toString());
                    addPlayer();
                }, (user) => {
                    return !tournamentPlayers.some((player) => {
                        if (player.userId && player.userId === user.id) {
                            return true;
                        }
                        return player.alias.toLowerCase() === user.displayName.toLowerCase();
                    });
                });
            });
        }

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
    renderPlayers();
    updatePlayerCount();
}
Object.values(GAME_MODE_CONFIG).forEach((config) => {
    const modeDiv = document.querySelector(config.divSelector) as HTMLElement;
    if (modeDiv) {
        modeDiv.classList.add('hidden');
    }
});

function resetGameOptionState(): void {
    document.querySelectorAll<HTMLButtonElement>('.modern-mode-btn, .nostalgia-mode-btn').forEach(btn => {
        btn.classList.remove('bg-cyan-500', 'ring-2', 'ring-cyan-400', 'bg-purple-500', 'ring-2', 'ring-purple-400');
    });

    document.querySelectorAll<HTMLButtonElement>('.modern-side-btn, .nostalgia-side-btn').forEach(btn => {
        btn.classList.remove('ring-2', 'ring-cyan-400', 'bg-cyan-500/30', 'ring-2', 'ring-purple-400', 'bg-purple-500/30');
    });

    document.querySelectorAll<HTMLButtonElement>('.modern-side-btn-1v1').forEach(btn => {
        btn.classList.remove('ring-2', 'ring-cyan-400', 'bg-cyan-500/30');
    });

    const sideToggleh2h = document.getElementById('modern-side-toggle');
    if (sideToggleh2h) {
        const toggleIndicator = sideToggleh2h.querySelector('div');
        if (toggleIndicator) {
            toggleIndicator.style.left = '0.25rem';
        }
        sideToggleh2h.classList.remove('bg-cyan-500/50');
        sideToggleh2h.classList.add('bg-slate-700');
    }

    const nostalgiaSideToggleh2h = document.getElementById('nostalgia-side-toggle');
    if (nostalgiaSideToggleh2h) {
        const toggleIndicator = nostalgiaSideToggleh2h.querySelector('div');
        if (toggleIndicator) {
            toggleIndicator.style.left = '0.25rem';
        }
        nostalgiaSideToggleh2h.classList.remove('bg-purple-500/50');
        nostalgiaSideToggleh2h.classList.add('bg-slate-700');
    }

    const sideToggle1v1 = document.getElementById('modern-side-toggle-1v1');
    if (sideToggle1v1) {
        const toggleIndicator = sideToggle1v1.querySelector('div');
        if (toggleIndicator) {
            toggleIndicator.style.left = '0.25rem';
        }
        sideToggle1v1.classList.remove('bg-cyan-500/50');
        sideToggle1v1.classList.add('bg-slate-700');
    }

    const startButtons = document.querySelectorAll<HTMLButtonElement>(
        '#start-modern-btn, #start-nostalgia-btn, #start-tournament-btn'
    );
    startButtons.forEach(btn => {
        btn.disabled = true;
    });

    document.querySelectorAll<HTMLDivElement>('[data-game-mode-settings]').forEach(el => {
        el.classList.add('hidden');
    });

    document.querySelectorAll<HTMLDivElement>(
        '#modern-players-h2h, #modern-players-1v1, #modern-side-selection-h2h, #nostalgia-players-h2h, #nostalgia-players-1v1, #nostalgia-side-selection-h2h'
    ).forEach(el => {
        if (el) el.classList.add('hidden');
    });
}

export function initGameOptions(): void {
    
    resetGameOptionState();
    setupGameModeSelection();
    setupNostalgiaMode();
    setupModernMode();
    setupTournamentFunctionality();
    sessionStorage.clear();

    fillPlayerNameInputs();

    updateSideSelectionTexts();

    initInviteModal();

    
}

function getDisplayNameFromLocalStorage(): string | null {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;

        const user = JSON.parse(userStr);
        const displayName = user?.displayName;

        return displayName;
    } catch (error) {
        console.error('Failed to read localStorage:', error);
        return null;
    }

}

function fillPlayerNameInputs(): void {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;

        const user = JSON.parse(userStr);
        const displayName = user?.displayName;

        if (!displayName) return;

        const modernPlayerInput = document.getElementById('modern-player-name') as HTMLInputElement | null;
        if (modernPlayerInput) {
            modernPlayerInput.value = displayName;
        }

        const nostalgiaPlayerInput = document.getElementById('nostalgia-player-name') as HTMLInputElement | null;
        if (nostalgiaPlayerInput) {
            nostalgiaPlayerInput.value = displayName;
        }
    } catch (error) {
        console.error('Failed to read displayName from localStorage:', error);
    }
}

function updateSideSelectionTexts(): void {
    const displayName = getDisplayNameFromLocalStorage();
    const userName = displayName || 'Account owner';

    const modernSideText = document.querySelector('#modern-side-selection-h2h p span');
    if (modernSideText) {
        modernSideText.textContent = `${userName}, which side would you like to play on?`;
    }

    const nostalgiaSideText = document.querySelector('#nostalgia-side-selection-h2h p span');
    if (nostalgiaSideText) {
        nostalgiaSideText.textContent = `${userName}, which side would you like to play on?`;
    }
}

let inviteCallback: ((user: { id: number; displayName: string }) => void) | null = null;
let inviteFilter: ((user: { id: number; displayName: string }) => boolean) | null = null;
let selectedInviteUser: { id: number; displayName: string } | null = null;
let inviteSearchTimer: number | null = null;
let inviteSearchSeq = 0;

function initInviteModal() {
    const modal = document.getElementById('inviteModal') as HTMLDivElement;
    const searchInput = document.getElementById('inviteSearchInput') as HTMLInputElement;
    const suggestionsDiv = document.getElementById('inviteSuggestions') as HTMLDivElement;
    const passwordSection = document.getElementById('invitePasswordSection') as HTMLDivElement;
    const passwordInput = document.getElementById('invitePasswordInput') as HTMLInputElement;
    const passwordError = document.getElementById('invitePasswordError') as HTMLDivElement;
    const cancelBtn = document.getElementById('inviteCancelBtn') as HTMLButtonElement;
    const confirmBtn = document.getElementById('inviteConfirmBtn') as HTMLButtonElement;

    const clearPasswordError = () => {
        if (passwordError) {
            passwordError.classList.add('hidden');
        }
        passwordInput.classList.remove('ring-2', 'ring-rose-500', 'border-rose-500');
    };

    passwordInput.addEventListener('input', clearPasswordError);

    searchInput.addEventListener('input', async () => {
        const query = searchInput.value.trim();
        passwordSection.classList.add('hidden');
        confirmBtn.classList.add('hidden');
        selectedInviteUser = null;
        clearPasswordError();
        suggestionsDiv.classList.remove('hidden');

        if (inviteSearchTimer) {
            window.clearTimeout(inviteSearchTimer);
        }

        if (query.length === 0) {
            inviteSearchSeq++;
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.classList.add('hidden');
            return;
        }

        inviteSearchTimer = window.setTimeout(async () => {
            const requestId = ++inviteSearchSeq;

            try {
                const users = await searchUser(query);
                if (requestId !== inviteSearchSeq) return;

                suggestionsDiv.innerHTML = '';

                const filteredUsers = users.filter((user: { id: number; displayName: string, avatar_url: string }) => {
                    if (user.id === JSON.parse(localStorage.getItem('user') || '{}').id) {
                        return false;
                    }
                    if (inviteFilter && !inviteFilter(user)) {
                        return false;
                    }
                    return true;
                });

                if (filteredUsers.length === 0 && query.length > 1) {
                    suggestionsDiv.innerHTML = '<div class="p-2 text-slate-400 text-sm">No matches found.</div>';
                    return;
                }

                filteredUsers.forEach((user: { id: number; displayName: string, avatar_url: string }) => {
                    const div = document.createElement('div');
                    div.className = 'p-2 hover:bg-slate-600 cursor-pointer rounded flex items-center';
                    const img = document.createElement('img');
                    let avatarSrc = user.avatar_url || '/uploads/avatars/default-avatar.png';
                    if (!avatarSrc.startsWith('http') && !avatarSrc.startsWith('/')) {
                        avatarSrc = `/uploads/avatars/${avatarSrc}`;
                    }
                    img.src = avatarSrc;
                    img.className = 'w-6 h-6 rounded-full mr-2';
                    img.onerror = () => { img.src = '/uploads/avatars/default-avatar.png'; };
                    div.appendChild(img);
                    const span = document.createElement('span');
                    span.textContent = user.displayName;
                    div.appendChild(span);
                    div.addEventListener('click', () => {
                        selectedInviteUser = user;
                        searchInput.value = user.displayName;
                        suggestionsDiv.innerHTML = '';
                        suggestionsDiv.classList.add('hidden');
                        passwordSection.classList.remove('hidden');
                        confirmBtn.classList.remove('hidden');
                        clearPasswordError();
                        passwordInput.focus();
                    });
                    suggestionsDiv.appendChild(div);
                });
            } catch (error) {
                if (requestId !== inviteSearchSeq) return;
                suggestionsDiv.innerHTML = '<div class="p-2 text-slate-400 text-sm">Arama hatasi.</div>';
                console.error('User search failed:', error);
            }
        }, 200);
    });

    cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        searchInput.value = '';
        suggestionsDiv.innerHTML = '';
        suggestionsDiv.classList.add('hidden');
        passwordSection.classList.add('hidden');
        confirmBtn.classList.add('hidden');
        passwordInput.value = '';
        clearPasswordError();
        selectedInviteUser = null;
        inviteCallback = null;
        inviteFilter = null;
        if (inviteSearchTimer) {
            window.clearTimeout(inviteSearchTimer);
        }
    });

    confirmBtn.addEventListener('click', async () => {
        if (!selectedInviteUser) return;

        const password = passwordInput.value;
        const isValid = await verifyPassword(selectedInviteUser.id, password);
        if (isValid) {
            if (inviteCallback) {
                inviteCallback(selectedInviteUser);
            }
            sessionStorage.setItem('invitedUserId', selectedInviteUser.id.toString());
            modal.classList.add('hidden');
            searchInput.value = '';
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.classList.add('hidden');
            passwordSection.classList.add('hidden');
            confirmBtn.classList.add('hidden');
            passwordInput.value = '';
            clearPasswordError();
            selectedInviteUser = null;
            inviteCallback = null;
            inviteFilter = null;
            if (inviteSearchTimer) {
                window.clearTimeout(inviteSearchTimer);
            }
        } else {
            if (passwordError) {
                passwordError.textContent = 'Wrong password. Please try again.';
                passwordError.classList.remove('hidden');
            }
            passwordInput.classList.add('ring-2', 'ring-rose-500', 'border-rose-500');
            passwordInput.value = '';
            passwordInput.focus();
        }
    });
}

function showInviteModal(
    callback: (user: { id: number; displayName: string }) => void,
    filter?: (user: { id: number; displayName: string }) => boolean
) {
    inviteCallback = callback;
    inviteFilter = filter || null;
    const modal = document.getElementById('inviteModal') as HTMLDivElement;
    modal.classList.remove('hidden');
    const searchInput = document.getElementById('inviteSearchInput') as HTMLInputElement;
    const passwordInput = document.getElementById('invitePasswordInput') as HTMLInputElement;
    const suggestionsDiv = document.getElementById('inviteSuggestions') as HTMLDivElement;
    searchInput.focus();
    suggestionsDiv.classList.add('hidden');
    suggestionsDiv.innerHTML = '';
    passwordInput.value = '';
}
