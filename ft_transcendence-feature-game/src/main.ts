import './styles.css';
import { Router } from './core/Router';
import { APIClient, LeaderboardEntry } from './api/APIClient';
import { TemplateLoader } from './utils/templateLoader';
import Api from './api/apiLibrary';
import { initGameOptions } from './game/gameOptionManager';
import { I18n, Language } from './utils/i18n';

// ============================================================================
// THEME MANAGER
// ============================================================================
export class ThemeManager {
    private static instance: ThemeManager;
    private isDarkMode: boolean;
    private toggleButton: HTMLElement | null = null;
    private moonIcon: HTMLElement | null = null;
    private sunIcon: HTMLElement | null = null;

    private constructor() {
        this.isDarkMode = this.loadThemePreference();
        this.init();
    }

    public static getInstance(): ThemeManager {
        if (!ThemeManager.instance) {
            ThemeManager.instance = new ThemeManager();
        }
        return ThemeManager.instance;
    }

    private async init(): Promise<void> {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupTheme());
        } else {
            this.setupTheme();
        }

        let isRefreshing = false; // Çakışmaları önlemek için kilit

        setInterval(async () => {
            const expiresAt = localStorage.getItem('expiresAt');
            const refreshToken = localStorage.getItem('refreshToken');

            if (!expiresAt) {
                console.log("Token bulunamadı.");
                let response = await Api.get('/api/users/me');
                console.log('Auth check response:', response);
                let unauthorizedPages = ['/register', '/reset-password', '/login'];
                if (!response.success && !unauthorizedPages.includes(window.location.pathname)) {
                    window.location.href = '/login';
                }
                return;
            }

            const now = Date.now();
            const expiresTimestamp = new Date(expiresAt).getTime();
            const timeLeftMs = expiresTimestamp - now;

            const minutes = Math.floor(timeLeftMs / 60000);
            const seconds = Math.floor((timeLeftMs % 60000) / 1000);
            const formattedTimeLeft = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            const howMany = 14 * 60 * 1000;
            console.log(`Token Bitiş Zamanı: ${new Date(expiresAt).toLocaleString()}, Kalan Süre: ${formattedTimeLeft}`);
            if (timeLeftMs < howMany && !isRefreshing && refreshToken) {
                try {
                    isRefreshing = true;
                    console.log("%c Token yenileniyor...", "color: orange; font-weight: bold;");

                    const response = await Api.post('/api/auth/refresh', {
                        refreshToken: refreshToken
                    });

                    if (response.success) {
                        localStorage.setItem('accessToken', response.data.tokens.accessToken);
                        localStorage.setItem('expiresAt', response.data.tokens.expiresAt);
                        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
                        await Api.setAuthToken(response.data.tokens.accessToken);
                        console.log("%c Token başarıyla yenilendi!", "color: green; font-weight: bold;");
                    }
                } catch (error) {
                    console.error("Yenileme hatası:", error);
                } finally {
                    isRefreshing = false;
                }
            }
        }, 1000);

    }

    private setupTheme(): void {
        this.toggleButton = document.getElementById('theme-toggle-btn');
        this.moonIcon = document.getElementById('moon-icon');
        this.sunIcon = document.getElementById('sun-icon');

        if (!this.toggleButton || !this.moonIcon || !this.sunIcon) {
            console.error('Theme toggle elements not found');
            return;
        }

        this.applyTheme(this.isDarkMode);
        this.toggleButton.addEventListener('click', () => this.toggleTheme());
    }

    private loadThemePreference(): boolean {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme !== 'light';
    }

    private saveThemePreference(isDark: boolean): void {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    private applyTheme(isDark: boolean): void {
        if (isDark) {
            document.body.classList.remove('light-mode');
            this.moonIcon?.classList.remove('hidden');
            this.sunIcon?.classList.add('hidden');
        } else {
            document.body.classList.add('light-mode');
            this.moonIcon?.classList.add('hidden');
            this.sunIcon?.classList.remove('hidden');
        }
    }

    private toggleTheme(): void {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme(this.isDarkMode);
        this.saveThemePreference(this.isDarkMode);
    }

    public getCurrentTheme(): 'dark' | 'light' {
        return this.isDarkMode ? 'dark' : 'light';
    }
}

// ============================================================================
// CONSTANTS
// ============================================================================
const CONSTANTS = {
    ERROR_MESSAGES: {
        UNEXPECTED: 'error.unexpected',
        PROFILE_LOAD: 'error.profileLoad',
        LEADERBOARD_LOAD: 'error.leaderboardLoad',
        FRIENDS_LOAD: 'error.friendsLoad',
        TEMPLATE_LOAD: 'error.templateLoad'
    },
    ROUTES: {
        HOME: '/',
        GAME: '/game',
        GAME_OPTIONS: '/game-options',
        GAME_NOSTALGIA: '/nostalgia',
        TOURNAMENT: '/tournament',
        LEADERBOARD: '/leaderboard',
        PROFILE: '/profile',
        FRIENDS: '/friends',
        SETTINGS: '/settings',
        LOGOUT: '/logout',
        LOGIN: '/login',
        REGISTER: '/register',
        REREGISTER: '/reset-password',
        AUTH_CALLBACK: '/auth/callback'
    },
    TEMPLATES: {
        HOME: 'home',
        GAME: 'game',
        GAME_OPTIONS: 'game-options',
        GAME_NOSTALGIA: 'nostalgia',
        TOURNAMENT: 'tournament',
        LEADERBOARD: 'leaderboard',
        PROFILE: 'profile',
        FRIENDS: 'friends',
        SETTINGS: 'settings',
        LOGOUT: 'logout',
        LOADING: 'loading',
        ERROR: 'error',
        LOGIN: 'login',
        REGISTER: 'register',
        REREGISTER: 'reset-password',
        AUTH_CALLBACK: 'auth-callback'
    },
    SELECTORS: {
        MAIN_CONTENT: 'main-content',
        MOBILE_MENU_BTN: 'mobile-menu-btn',
        MOBILE_MENU: 'mobile-menu'
    },
    TIMEOUTS: {
        DOM_READY: 100,
        STATS_UPDATE: 100
    }
} as const;

// ============================================================================
// MAIN APP CLASS
// ============================================================================
class App {
    private router: Router;
    private apiClient: APIClient;
    private i18n: I18n;

    constructor() {
        this.apiClient = new APIClient();
        this.router = new Router();
        this.i18n = I18n.getInstance();
        ThemeManager.getInstance();
        this.init();
    }

    private init(): void {
        this.preloadTemplates();
        this.setupRoutes();
        this.setupEventListeners();
        this.setupMobileMenu();
        this.i18n.applyTranslations();
        this.router.init();
    }

    private async preloadTemplates(): Promise<void> {
        const templates = Object.values(CONSTANTS.TEMPLATES);
        templates.push('login', 'register', 'reset-password');
        await TemplateLoader.preloadTemplates(templates).catch(console.error);
    }

    private setupRoutes(): void {
        const routes = [
            { path: CONSTANTS.ROUTES.HOME, handler: () => this.renderHome() },
            { path: CONSTANTS.ROUTES.GAME, handler: () => this.renderGame() },
            { path: CONSTANTS.ROUTES.GAME_OPTIONS, handler: () => this.renderGameOptions() },
            { path: CONSTANTS.ROUTES.GAME_NOSTALGIA, handler: () => this.renderNostalgia() },
            { path: CONSTANTS.ROUTES.TOURNAMENT, handler: () => this.renderTournament() },
            { path: CONSTANTS.ROUTES.LEADERBOARD, handler: () => this.renderLeaderboard() },
            { path: CONSTANTS.ROUTES.PROFILE, handler: () => this.renderProfile() },
            { path: CONSTANTS.ROUTES.FRIENDS, handler: () => this.renderFriends() },
            { path: CONSTANTS.ROUTES.SETTINGS, handler: () => this.renderSettings() },
            { path: CONSTANTS.ROUTES.LOGOUT, handler: () => this.renderLogout() },
            { path: CONSTANTS.ROUTES.LOGIN, handler: () => this.renderLogin() },
            { path: CONSTANTS.ROUTES.REGISTER, handler: () => this.renderRegister() },
            { path: CONSTANTS.ROUTES.REREGISTER, handler: () => this.renderResetPassword() },
            { path: CONSTANTS.ROUTES.AUTH_CALLBACK, handler: () => this.renderAuthCallback() },
        ];

        routes.forEach(route => {
            this.router.addRoute(route.path, route.handler);
        });
    }

    private async renderAuthCallback(): Promise<void> {
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        console.log('Auth callback tokens:', { accessToken, refreshToken });

        if (accessToken && refreshToken) {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
            localStorage.setItem('expiresAt', expiresAt);

            Api.setAuthToken(accessToken);

            let response = await Api.get('/api/users/me');
            if (response.success) {
                localStorage.setItem('user', JSON.stringify(response.data));
            } else {
                console.error('Failed to fetch user data after auth callback:', response);
            }
            this.router.navigate('/home');
        }
    }

    private setupEventListeners(): void {
        this.setupNavigationEvents();
        this.setupErrorHandling();
    }

    private setupNavigationEvents(): void {
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.matches('[data-route]')) {
                e.preventDefault();
                const href = target.getAttribute('href');
                if (href) {
                    this.router.navigate(href);
                }
            }
        });

        window.addEventListener('popstate', () => {
            this.router.handleRouteChange();
        });
    }

    private setupErrorHandling(): void {
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showError(CONSTANTS.ERROR_MESSAGES.UNEXPECTED);
            event.preventDefault();
        });

        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showError(CONSTANTS.ERROR_MESSAGES.UNEXPECTED);
        });
    }

    private setupMobileMenu(): void {
        const mobileMenuBtn = document.getElementById(CONSTANTS.SELECTORS.MOBILE_MENU_BTN);
        const mobileMenu = document.getElementById(CONSTANTS.SELECTORS.MOBILE_MENU);

        if (!mobileMenuBtn || !mobileMenu) return;

        this.setupMobileMenuToggle(mobileMenuBtn, mobileMenu);
        this.setupMobileMenuLinks(mobileMenu);
        this.setupMobileMenuOutsideClick(mobileMenuBtn, mobileMenu);
    }

    private setupMobileMenuToggle(menuBtn: HTMLElement, menu: HTMLElement): void {
        menuBtn.addEventListener('click', () => {
            menu.classList.toggle('hidden');
        });
    }

    private setupMobileMenuLinks(menu: HTMLElement): void {
        const mobileLinks = menu.querySelectorAll('a[data-route]');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.add('hidden');
            });
        });
    }

    private setupMobileMenuOutsideClick(menuBtn: HTMLElement, menu: HTMLElement): void {
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (!menuBtn.contains(target) && !menu.contains(target)) {
                menu.classList.add('hidden');
            }
        });
    }

    // Helper Methods
    private renderPage(content: string): void {
        const mainContent = document.getElementById(CONSTANTS.SELECTORS.MAIN_CONTENT);
        if (mainContent) {
            mainContent.innerHTML = content;
            this.i18n.applyTranslations();
        }
    }

    private async loadTemplate(templateName: string, wrapInContainer: boolean = true): Promise<void> {
        try {
            const content = await TemplateLoader.loadTemplate(templateName);
            const finalContent = wrapInContainer
                ? this.createResponsiveContainer(content)
                : content;
            this.renderPage(finalContent);
        } catch (error) {
            console.error(`Error loading template ${templateName}:`, error);
            this.showError(CONSTANTS.ERROR_MESSAGES.TEMPLATE_LOAD);
        }
    }

    private createLoadingSpinner(): string {
        return `
            <div class="flex justify-center items-center py-8 min-h-[200px]">
                <div class="loading-spinner"></div>
            </div>
        `;
    }

    private createErrorMessage(message: string): string {
        return `
            <div class="card animate-fade-in max-w-md mx-auto">
                <div class="error-message text-center">
                    <h2 class="text-xl font-bold mb-2" data-i18n="error.title">${this.i18n.t('error.title')}</h2>
                    <p class="mb-4 text-slate-300">${message}</p>
                    <button class="btn w-full" onclick="location.reload()" data-i18n="error.reload">${this.i18n.t('error.reload')}</button>
                </div>
            </div>
        `;
    }

    private createResponsiveContainer(content: string, maxWidth: string = 'max-w-6xl'): string {
        return `
            <div class="${maxWidth} mx-auto px-4 sm:px-6 lg:px-8">
                ${content}
            </div>
        `;
    }

    private createPodiumCard(player: any, index: number): string {
        const medals = ['🥇', '🥈', '🥉'];
        const gradients = ['from-yellow-400 to-yellow-600', 'from-gray-300 to-gray-500', 'from-orange-400 to-orange-600'];
        const positionKeys = ['leaderboard.first', 'leaderboard.second', 'leaderboard.third'];

        return `
            <div class="podium-card bg-gradient-to-br ${gradients[index]} p-4 sm:p-6 rounded-xl text-center transform hover:scale-105 transition-all duration-300">
                <div class="text-4xl sm:text-6xl mb-2 sm:mb-4">${medals[index]}</div>
                <h3 class="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">${this.i18n.t(positionKeys[index])}</h3>
                <div class="text-white/90 mb-2 sm:mb-4">
                    <h4 class="text-base sm:text-lg font-semibold">${player.name}</h4>
                    <p class="text-xs sm:text-sm">${player.score.toLocaleString()} puan</p>
                    <p class="text-xs">%${player.winRate} kazanma oranı</p>
                </div>
            </div>
        `;
    }

    private showError(messageKey: string): void {
        this.renderPage(this.createErrorMessage(this.i18n.t(messageKey)));
    }

    private updateActiveNavLink(path: string): void {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === path) {
                link.classList.add('active');
            }
        });
    }

    // Page Renderers
    private async renderHome(): Promise<void> {
        this.updateActiveNavLink(CONSTANTS.ROUTES.HOME);
        await this.loadTemplate(CONSTANTS.TEMPLATES.HOME);
        this.loadHomeStats();
    }

    private async loadHomeStats(): Promise<void> {
        try {
            const stats = await this.apiClient.getStats();
            this.updateElementById('players-online', stats.playersOnline.toString());
            this.updateElementById('games-today', stats.gamesToday.toString());
            this.updateElementById('best-score', stats.bestScore.toString());
        } catch (error) {
            console.warn('Failed to load stats:', error);
        }
    }

    private async renderGame(): Promise<void> {
        this.updateActiveNavLink(CONSTANTS.ROUTES.GAME);
        await this.loadTemplate(CONSTANTS.TEMPLATES.GAME, false);
        const scoreboard = document.getElementById('scoreboard');
        if (scoreboard) scoreboard.scrollIntoView({ block: 'start', behavior: 'auto' });
        const { initGameEngine } = await import('./game/gameEngine');
        initGameEngine();
    }

    private async renderGameOptions(): Promise<void> {
        this.updateActiveNavLink(CONSTANTS.ROUTES.GAME_OPTIONS);
        await this.loadTemplate(CONSTANTS.TEMPLATES.GAME_OPTIONS, false);
        initGameOptions();
    }

    private async renderNostalgia(): Promise<void> {
        this.updateActiveNavLink(CONSTANTS.ROUTES.GAME_NOSTALGIA);
        await this.loadTemplate(CONSTANTS.TEMPLATES.GAME_NOSTALGIA, false);

        // 3D Pong oyununu başlat

        this.delayedExecution(async () => {
            const { Pong3DGame } = await import('./3D-game/pong3d');
            const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
            if (canvas) {
                new Pong3DGame(canvas);
            }
        }, CONSTANTS.TIMEOUTS.DOM_READY);
    }

    private async renderTournament(): Promise<void> {
        this.updateActiveNavLink(CONSTANTS.ROUTES.TOURNAMENT);
        await this.loadTemplate(CONSTANTS.TEMPLATES.TOURNAMENT, false);
        initGameOptions();
    }

    private async renderLeaderboard(): Promise<void> {
        this.updateActiveNavLink(CONSTANTS.ROUTES.LEADERBOARD);
        this.renderPage(this.createResponsiveContainer(this.createLoadingSpinner()));

        try {
            const response = await Api.get('/api/stats/leaderboard?limit=10');
            const leaderboard: LeaderboardEntry[] = response.data.leaderboard;

            await this.loadTemplate(CONSTANTS.TEMPLATES.LEADERBOARD);

            const podiumContainer = document.getElementById('podium-container');
            if (podiumContainer) {
                podiumContainer.innerHTML = leaderboard
                    .slice(0, 3)
                    .map((player: LeaderboardEntry, index: number) =>
                        this.createPodiumCard(player, index)
                    ).join('');
            }

            const tableBody = document.getElementById('leaderboard-table');
            if (tableBody) {
                tableBody.innerHTML = leaderboard.map((player: LeaderboardEntry, index: number) => `
                    <tr class="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                        <td class="py-2 sm:py-3 px-2 sm:px-4 font-bold">
                            ${index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                        </td>
                        <td class="py-2 sm:py-3 px-2 sm:px-4">
                            <div class="flex items-center space-x-2 sm:space-x-3">
                                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-violet-400 to-purple-600 rounded-full flex items-center justify-center">
                                    <span class="text-white font-bold text-xs sm:text-sm">${player.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <span class="font-medium text-sm sm:text-base">${player.name}</span>
                            </div>
                        </td>
                        <td class="py-2 sm:py-3 px-2 sm:px-4 font-bold text-amber-400 hidden sm:table-cell">${player.score.toLocaleString()}</td>
                        <td class="py-2 sm:py-3 px-2 sm:px-4 hidden md:table-cell">${player.gamesPlayed}</td>
                        <td class="py-2 sm:py-3 px-2 sm:px-4">
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                ${player.winRate >= 70 ? 'bg-emerald-900 text-emerald-300' :
                        player.winRate >= 50 ? 'bg-amber-900 text-amber-300' :
                            'bg-rose-900 text-rose-300'}">
                                ${player.winRate}%
                            </span>
                        </td>
                        <td class="py-2 sm:py-3 px-2 sm:px-4 hidden lg:table-cell">
                            <span class="status-${Math.random() > 0.6 ? 'online' : Math.random() > 0.3 ? 'away' : 'offline'} text-xs">
                                ${Math.random() > 0.6 ? this.i18n.t('leaderboard.online') : Math.random() > 0.3 ? this.i18n.t('leaderboard.away') : this.i18n.t('leaderboard.offline')}
                            </span>
                        </td>
                    </tr>
                `).join('');
            }

        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.showError(CONSTANTS.ERROR_MESSAGES.LEADERBOARD_LOAD);
        }
    }

    private initProfilePhotoUpload(): void {
        const checkAndInit = () => {
            const addPhotoBtn = document.getElementById('edit-avatar-btn');
            const photoUpload = document.getElementById('avatar-upload') as HTMLInputElement;
            const profileAvatar = document.getElementById('profile-avatar') as HTMLImageElement;

            if (!addPhotoBtn || !photoUpload || !profileAvatar) {
                console.log('Elements not found, retrying...');
                setTimeout(checkAndInit, 100);
                return;
            }

            console.log('Elements found, initializing photo upload');

            addPhotoBtn.addEventListener('click', () => {
                console.log('Button clicked!');
                photoUpload.click();
            });

            photoUpload.addEventListener('change', (e: Event) => {
                const target = e.target as HTMLInputElement;
                const file = target.files?.[0];

                if (!file) return;

                console.log('File selected:', file.name);

                const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

                if (!allowedTypes.includes(file.type)) {
                    alert(I18n.getInstance().t('alert.invalidFile'));
                    photoUpload.value = '';
                    return;
                }

                if (file.size > 5 * 1024 * 1024) {
                    alert(I18n.getInstance().t('alert.fileTooLarge'));
                    photoUpload.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = async (event: ProgressEvent<FileReader>) => {
                    if (event.target?.result && profileAvatar) {
                        profileAvatar.src = event.target.result as string;
                        let response = await Api.uploadFile('/api/users/me/avatar', file, 'avatar');
                        if (response.success) {
                            let object = JSON.parse(localStorage.getItem('user') || '{}');
                            object.avatarUrl = response.data.avatar_url;
                            localStorage.setItem('user', JSON.stringify(object));
                        }
                    }
                };
                reader.readAsDataURL(file);
            });
        };

        checkAndInit();
    }

    private async renderProfile(): Promise<void> {
        let user = JSON.parse(localStorage.getItem('user') || '{}');
        this.updateActiveNavLink(CONSTANTS.ROUTES.PROFILE);
        this.renderPage(this.createLoadingSpinner());

        try {
            let userId = JSON.parse(localStorage.getItem('user') || '{}').id;
            const stats = await Api.get(`/api/users/${userId}/stats`);

            await this.loadTemplate(CONSTANTS.TEMPLATES.PROFILE, false);
            this.fillProfileData(stats);
            this.delayedExecution(() => {
                this.setupProfileTabs();
                this.initProfilePhotoUpload();
                this.setupDangerZone();
                this.setupChangePasswordModal();
            }, CONSTANTS.TIMEOUTS.DOM_READY);

            const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
            const displayNameInput = document.querySelector('input[name="displayName"]') as HTMLInputElement;

            emailInput.value = user.email;
            displayNameInput.value = user.displayName;
            document.getElementById('update-account-info')?.addEventListener('click', async () => {
                const email = emailInput.value;
                const displayName = displayNameInput.value;
                const response = await Api.patch(`/api/users/me`, {
                    email: email,
                    displayName: displayName
                });
                console.log(response);
            });
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showError(CONSTANTS.ERROR_MESSAGES.PROFILE_LOAD);
        }
    }

    private async fillProfileData(stats: any): Promise<void> {
        if (!stats.success) return;

        const statsData = stats.data;
        let user = JSON.parse(localStorage.getItem('user') || '{}');

        let response = await Api.get('/api/stats/recent-matches?limit=10');
        if (response.success) {
            const tableBody = document.getElementById('game-history-table');
            if (tableBody) {
                response.data.matches.forEach((item: any) => {
                    const isPlayer1 = item.player1_id === user.id;
                    const opponentName = isPlayer1 ? item.player2_display_name : item.player1_display_name;
                    const playerScore = isPlayer1 ? item.player1_score : item.player2_score;
                    const opponentScore = isPlayer1 ? item.player2_score : item.player1_score;

                    const result = item.winner_id === user.id ?
                        `<span class="text-green-400 font-bold">${this.i18n.t('profile.victory')}</span>` :
                        `<span class="text-red-400 font-bold">${this.i18n.t('profile.defeat')}</span>`;

                    const matchDate = new Date(item.ended_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
                    const durationMinutes = Math.floor(item.duration_seconds / 60);
                    const durationSeconds = item.duration_seconds % 60;
                    const durationStr = `${durationMinutes}dk ${durationSeconds}s`;

                    tableBody.innerHTML += `
                    <tr class="border-b border-white/10 hover:bg-white/5">
                        <td class="py-3 px-4">${matchDate}</td>
                        <td class="py-3 px-4">${opponentName}</td>
                        <td class="py-3 px-4 capitalize">${item.game_type}</td>
                        <td class="py-3 px-4">${playerScore} - ${opponentScore}</td>
                        <td class="py-3 px-4">${result}</td>
                        <td class="py-3 px-4">${durationStr}</td>
                    </tr>
                `;
                });
            }
        }

        const usernameEl = document.getElementById('profile-username');
        const avatarEl = document.getElementById('profile-avatar') as HTMLImageElement;

        if (usernameEl) {
            usernameEl.textContent = user.displayName || 'Oyuncu';
        }

        if (avatarEl && user.avatarUrl) {
            avatarEl.src = user.avatarUrl;
            // Eğer avatarUrl yoksa varsayılan Dicebear linki HTML'de kalacaktır.
        }

        const statsGridContainer = document.getElementById('stats-grid-container');
        if (statsGridContainer) {
            statsGridContainer.innerHTML = `
            <div class="stat-card">
                <h4 class="text-sm font-semibold text-white/70 mb-2" data-i18n="profile.totalPoints">${this.i18n.t('profile.totalPoints')}</h4>
                <div class="text-2xl font-bold text-yellow-400">${statsData.total_points_scored}</div>
            </div>
            <div class="stat-card">
                <h4 class="text-sm font-semibold text-white/70 mb-2" data-i18n="profile.totalGames">${this.i18n.t('profile.totalGames')}</h4>
                <div class="text-2xl font-bold text-blue-400">${statsData.total_matches}</div>
            </div>
            <div class="stat-card">
                <h4 class="text-sm font-semibold text-white/70 mb-2" data-i18n="profile.wins">${this.i18n.t('profile.wins')}</h4>
                <div class="text-2xl font-bold text-green-400">${statsData.wins}</div>
            </div>
            <div class="stat-card">
                <h4 class="text-sm font-semibold text-white/70 mb-2" data-i18n="profile.losses">${this.i18n.t('profile.losses')}</h4>
                <div class="text-2xl font-bold text-red-400">${statsData.losses}</div>
            </div>
            <div class="stat-card">
                <h4 class="text-sm font-semibold text-white/70 mb-2" data-i18n="profile.winRate">${this.i18n.t('profile.winRate')}</h4>
                <div class="text-2xl font-bold text-purple-400">${statsData.win_rate}%</div>
            </div>
            <div class="stat-card">
                <h4 class="text-sm font-semibold text-white/70 mb-2" data-i18n="profile.draws">${this.i18n.t('profile.draws')}</h4>
                <div class="text-2xl font-bold text-orange-400">${statsData.draws}</div>
            </div>
        `;
        }
    }

    private setupProfileTabs(): void {
        const tabs = document.querySelectorAll('.profile-tab');
        const panels = document.querySelectorAll('.tab-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                const tabName = tab.getAttribute('data-tab');
                const panel = document.getElementById(`${tabName}-panel`);
                if (panel) {
                    panel.classList.add('active');
                }
            });
        });
    }

    private setupDangerZone(): void {
        // Tüm Verileri Sıfırla
        const resetBtn = document.querySelector('[data-i18n="profile.resetData"]') as HTMLButtonElement;
        if (resetBtn) {
            resetBtn.addEventListener('click', async () => {
                const confirmed = confirm(this.i18n.t('confirm.resetData'));
                if (!confirmed) return;

                try {
                    const response = await Api.post('/api/gdpr/anonymize', {});
                    if (response.success) {
                        alert(this.i18n.t('alert.resetDataSuccess'));
                        localStorage.clear();
                        Api.setAuthToken('');
                        this.router.navigate('/login');
                    } else {
                        alert(this.i18n.t('alert.resetDataFailed'));
                    }
                } catch (err) {
                    console.error('Reset data error:', err);
                    alert(this.i18n.t('alert.resetDataFailed'));
                }
            });
        }

        // Veri Dışa Aktar
        const exportBtn = document.querySelector('[data-i18n="profile.exportData"]') as HTMLButtonElement;
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                try {
                    const response = await Api.get('/api/gdpr/export');
                    if (response.success) {
                        const dataStr = JSON.stringify(response.data, null, 2);
                        const blob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'my-data-export.json';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        alert(this.i18n.t('alert.exportSuccess'));
                    } else {
                        alert(this.i18n.t('alert.exportFailed'));
                    }
                } catch (err) {
                    console.error('Export data error:', err);
                    alert(this.i18n.t('alert.exportFailed'));
                }
            });
        }

        // Hesabı Kalıcı Olarak Sil
        const deleteBtn = document.querySelector('[data-i18n="profile.deletePermanent"]') as HTMLButtonElement;
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                const confirmed = confirm(this.i18n.t('confirm.deleteAccount'));
                if (!confirmed) return;

                const doubleConfirm = confirm(this.i18n.t('confirm.deleteAccountFinal'));
                if (!doubleConfirm) return;

                try {
                    const response = await Api.delete('/api/gdpr/delete');
                    if (response.success) {
                        alert(this.i18n.t('alert.deleteSuccess'));
                        localStorage.clear();
                        Api.setAuthToken('');
                        this.router.navigate('/login');
                    } else {
                        alert(this.i18n.t('alert.deleteFailed'));
                    }
                } catch (err) {
                    console.error('Delete account error:', err);
                    alert(this.i18n.t('alert.deleteFailed'));
                }
            });
        }
    }

    private setupChangePasswordModal(): void {
        const openBtn = document.getElementById('open-change-password-modal');
        const modal = document.getElementById('change-password-modal');
        const closeBtn = document.getElementById('close-change-password-modal');
        const form = document.getElementById('change-password-form') as HTMLFormElement | null;
        const currentPw = document.getElementById('cp-current-password') as HTMLInputElement | null;
        const newPw = document.getElementById('cp-new-password') as HTMLInputElement | null;
        const confirmPw = document.getElementById('cp-confirm-password') as HTMLInputElement | null;
        const submitBtn = document.getElementById('cp-submit-btn') as HTMLButtonElement | null;
        const btnText = document.getElementById('cp-btn-text');
        const spinner = document.getElementById('cp-spinner');
        const errorEl = document.getElementById('cp-error');
        const successEl = document.getElementById('cp-success');
        const confirmError = document.getElementById('cp-confirm-error');

        const reqLength = document.getElementById('cp-req-length');
        const reqLower = document.getElementById('cp-req-lowercase');
        const reqUpper = document.getElementById('cp-req-uppercase');
        const reqNumber = document.getElementById('cp-req-number');
        const reqSpecial = document.getElementById('cp-req-special');

        if (!openBtn || !modal) return;

        // Open modal
        openBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            // Reset form
            form?.reset();
            if (errorEl) errorEl.classList.add('hidden');
            if (successEl) successEl.classList.add('hidden');
            if (confirmError) confirmError.classList.add('hidden');
            if (submitBtn) submitBtn.disabled = true;
            [reqLength, reqLower, reqUpper, reqNumber, reqSpecial].forEach(el => {
                if (!el) return;
                el.classList.remove('text-green-400', 'text-red-400');
                el.classList.add('text-slate-500');
                const icon = el.querySelector('.cp-req-icon');
                if (icon) icon.textContent = '○';
            });
        });

        // Close modal
        const closeModal = () => modal.classList.add('hidden');
        closeBtn?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Password validation helpers
        const updateReq = (el: HTMLElement | null, valid: boolean) => {
            if (!el) return;
            const icon = el.querySelector('.cp-req-icon');
            if (valid) {
                el.classList.remove('text-slate-500', 'text-red-400');
                el.classList.add('text-green-400');
                if (icon) icon.textContent = '✓';
            } else {
                el.classList.remove('text-green-400', 'text-red-400');
                el.classList.add('text-slate-500');
                if (icon) icon.textContent = '○';
            }
        };

        const validatePw = (pw: string) => {
            const c = {
                len: pw.length >= 8,
                low: /[a-z]/.test(pw),
                up: /[A-Z]/.test(pw),
                num: /[0-9]/.test(pw),
                spec: /[^a-zA-Z0-9]/.test(pw),
            };
            updateReq(reqLength, c.len);
            updateReq(reqLower, c.low);
            updateReq(reqUpper, c.up);
            updateReq(reqNumber, c.num);
            updateReq(reqSpecial, c.spec);
            return c.len && c.low && c.up && c.num && c.spec;
        };

        const checkFormValid = () => {
            const curPw = currentPw?.value || '';
            const np = newPw?.value || '';
            const cp = confirmPw?.value || '';
            const pwValid = validatePw(np);
            const match = np === cp && np.length > 0;
            if (confirmError) {
                if (cp.length > 0 && !match) confirmError.classList.remove('hidden');
                else confirmError.classList.add('hidden');
            }
            if (submitBtn) submitBtn.disabled = !(curPw.length > 0 && pwValid && match);
        };

        currentPw?.addEventListener('input', checkFormValid);
        newPw?.addEventListener('input', checkFormValid);
        confirmPw?.addEventListener('input', checkFormValid);

        // Submit
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = currentPw?.value || '';
            const newPassword = newPw?.value || '';

            if (btnText) btnText.textContent = this.i18n.t('profile.changingPassword') || 'Değiştiriliyor...';
            spinner?.classList.remove('hidden');
            if (submitBtn) submitBtn.disabled = true;
            if (errorEl) errorEl.classList.add('hidden');
            if (successEl) successEl.classList.add('hidden');

            try {
                await Api.put('/api/users/me/password', {
                    currentPassword,
                    newPassword,
                });
                if (successEl) {
                    successEl.textContent = this.i18n.t('profile.passwordChanged') || 'Şifre başarıyla değiştirildi!';
                    successEl.classList.remove('hidden');
                }
                form?.reset();
                [reqLength, reqLower, reqUpper, reqNumber, reqSpecial].forEach(el => {
                    if (!el) return;
                    el.classList.remove('text-green-400', 'text-red-400');
                    el.classList.add('text-slate-500');
                    const icon = el.querySelector('.cp-req-icon');
                    if (icon) icon.textContent = '○';
                });
                if (submitBtn) submitBtn.disabled = true;
                setTimeout(() => closeModal(), 2000);
            } catch (err: any) {
                if (errorEl) {
                    errorEl.textContent = err?.message || this.i18n.t('profile.passwordChangeError') || 'Şifre değiştirme başarısız oldu.';
                    errorEl.classList.remove('hidden');
                }
                if (submitBtn) submitBtn.disabled = false;
            } finally {
                if (btnText) btnText.textContent = this.i18n.t('profile.changePassword') || 'Şifre Değiştir';
                spinner?.classList.add('hidden');
            }
        });
    }

    private async renderSettings(): Promise<void> {
        this.updateActiveNavLink(CONSTANTS.ROUTES.SETTINGS);
        await this.loadTemplate(CONSTANTS.TEMPLATES.SETTINGS);

        this.delayedExecution(() => {
            // Dil seçimi
            const langSelect = document.getElementById('language-select') as HTMLSelectElement | null;
            if (langSelect) {
                langSelect.value = this.i18n.getLanguage();
                langSelect.addEventListener('change', () => {
                    const newLang = langSelect.value as Language;
                    this.i18n.setLanguage(newLang);
                });
            }

            // 2FA yardımcı fonksiyonları
            const badge = document.getElementById('twofa-status-badge')!;
            const enableBtn = document.getElementById('twofa-enable-btn')!;
            const disableBtn = document.getElementById('twofa-disable-btn')!;
            const codeSection = document.getElementById('twofa-code-section')!;
            const pwSection = document.getElementById('twofa-password-section')!;

            const setEnabled = (enabled: boolean) => {
                badge.textContent = enabled ? '🟢 Aktif' : '🔴 Pasif';
                badge.className = enabled
                    ? 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-900 text-emerald-300'
                    : 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-900 text-red-300';
                enableBtn.classList.toggle('hidden', enabled);
                disableBtn.classList.toggle('hidden', !enabled);
                codeSection.classList.add('hidden');
                pwSection.classList.add('hidden');
            };

            // Mevcut durum
            Api.get('/api/2fa/status').then((res: any) => {
                if (res?.success) setEnabled(res.data.enabled);
            }).catch(() => {
                badge.textContent = '⚠️ Yüklenemedi';
            });

            // Etkinleştir → setup (kod gönder)
            enableBtn?.addEventListener('click', async () => {
                enableBtn.textContent = '⏳ Gönderiliyor...';
                enableBtn.setAttribute('disabled', 'true');
                const res = await Api.post('/api/2fa/setup', {});
                enableBtn.removeAttribute('disabled');
                enableBtn.textContent = '✅ 2FA\'yı Etkinleştir';
                if (res?.success) {
                    codeSection.classList.remove('hidden');
                    (document.getElementById('twofa-code-input') as HTMLInputElement)?.focus();
                } else {
                    alert(res?.message || 'Kod gönderilemedi.');
                }
            });

            // Onayla → confirm
            document.getElementById('twofa-confirm-btn')?.addEventListener('click', async () => {
                const code = (document.getElementById('twofa-code-input') as HTMLInputElement)?.value.trim();
                if (code.length !== 6) { alert('Lütfen 6 haneli kodu girin.'); return; }
                const res = await Api.post('/api/2fa/confirm', { code });
                if (res?.success) {
                    alert('2FA başarıyla etkinleştirildi!');
                    setEnabled(true);
                } else {
                    alert(res?.message || 'Geçersiz ya da süresi dolmuş kod.');
                }
            });

            // Setup iptal
            document.getElementById('twofa-cancel-setup-btn')?.addEventListener('click', () => {
                codeSection.classList.add('hidden');
                (document.getElementById('twofa-code-input') as HTMLInputElement).value = '';
            });

            // Devre dışı bırak → şifre iste
            disableBtn?.addEventListener('click', () => {
                pwSection.classList.remove('hidden');
                (document.getElementById('twofa-password-input') as HTMLInputElement)?.focus();
            });

            // Disable onayla
            document.getElementById('twofa-disable-confirm-btn')?.addEventListener('click', async () => {
                const password = (document.getElementById('twofa-password-input') as HTMLInputElement)?.value;
                if (!password) { alert('Lütfen şifrenizi girin.'); return; }
                const res = await Api.post('/api/2fa/disable', { password });
                if (res?.success) {
                    alert('2FA devre dışı bırakıldı.');
                    setEnabled(false);
                    (document.getElementById('twofa-password-input') as HTMLInputElement).value = '';
                } else {
                    alert(res?.message || 'Geçersiz şifre ya da işlem başarısız.');
                }
            });

            // Disable iptal
            document.getElementById('twofa-cancel-disable-btn')?.addEventListener('click', () => {
                pwSection.classList.add('hidden');
                (document.getElementById('twofa-password-input') as HTMLInputElement).value = '';
            });

        }, CONSTANTS.TIMEOUTS.DOM_READY);
    }

    private async renderLogout(): Promise<void> {
        this.updateActiveNavLink(CONSTANTS.ROUTES.LOGOUT);
        await this.loadTemplate(CONSTANTS.TEMPLATES.LOGOUT, false);

        this.delayedExecution(() => {
            const logoutBtn = document.getElementById('logout-confirm');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.confirmLogout());
            }
        }, CONSTANTS.TIMEOUTS.DOM_READY);
    }

    private confirmLogout(): void {
        setTimeout(() => {
            localStorage.clear();
            Api.setAuthToken("");
            alert(this.i18n.t('alert.logoutSuccess'));
            this.router.navigate('/login');
        }, 1000);
    }

    private async renderFriends(): Promise<void> {
        let friends = await Api.get('/api/friends');
        console.log(friends);
        let pending = await Api.get('/api/friends/requests/pending');
        console.log(pending);
        this.updateActiveNavLink(CONSTANTS.ROUTES.FRIENDS);
        await this.loadTemplate(CONSTANTS.TEMPLATES.FRIENDS);
        this.loadFriendsData();
    }

    private async loadFriendsData(): Promise<void> {
        try {
            const friendsData = {
                online: [
                    { name: 'Oğulcan Durkan', status: 'Oyunda - Classic Pong', initial: 'OD', color: 'from-emerald-400 to-cyan-400' },
                    { name: 'Ali Kanıberk', status: 'Menüde', initial: 'AK', color: 'from-violet-400 to-purple-400' },
                    { name: 'Charlie Khan', status: 'Turnuvada', initial: 'CK', color: 'from-amber-400 to-orange-400', inTournament: true }
                ],
                offline: [
                    { name: 'Diana Abla', lastSeen: '3 saat önce çevrimiçiydi', initial: 'DA' },
                    { name: 'Efe Veli', lastSeen: '1 gün önce çevrimiçiydi', initial: 'EV' },
                    { name: 'Fatma Yıldız', lastSeen: '2 gün önce çevrimiçiydi', initial: 'FY' },
                    { name: 'Gökhan Kaya', lastSeen: '1 hafta önce çevrimiçiydi', initial: 'GK' }
                ],
                requests: [
                    { name: 'Fatma Hanım', initial: 'FH', color: 'from-pink-400 to-rose-400' },
                    { name: 'Gökhan Bey', initial: 'GB', color: 'from-blue-400 to-indigo-400' }
                ],
                activity: [
                    { name: 'Oğulcan Durkan', action: 'Classic Pong\'da yeni rekor kırdı! 🎯', time: '5 dakika önce', color: 'emerald' },
                    { name: 'Charlie Khan', action: 'Turnuvada final turuna yükseldi 🏆', time: '15 dakika önce', color: 'amber' },
                    { name: 'Ali Kanıberk', action: 'Yeni başarım kazandı: "Seri Galip" ⭐', time: '1 saat önce', color: 'blue' },
                    { name: 'Diana Abla', action: '3 maç üst üste kazandı 🔥', time: '3 saat önce', color: 'violet' }
                ]
            };

            this.updateElementById('online-count', `${friendsData.online.length} çevrimiçi`);
            this.updateElementById('all-friends-count', `${friendsData.online.length + friendsData.offline.length} arkadaş`);
            this.updateElementById('total-friends', (friendsData.online.length + friendsData.offline.length).toString());
            this.updateElementById('friend-requests-count', friendsData.requests.length.toString());

            const onlineFriendsContainer = document.getElementById('online-friends-container');
            if (onlineFriendsContainer) {
                onlineFriendsContainer.innerHTML = friendsData.online.map(friend => `
                    <div class="flex items-center justify-between gap-3 p-3 sm:p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors">
                        <div class="flex items-center space-x-3 min-w-0 flex-1">
                            <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${friend.color} rounded-full flex items-center justify-center flex-shrink-0">
                                <span class="text-white font-bold text-sm sm:text-base">${friend.initial}</span>
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="text-slate-100 font-medium text-sm sm:text-base truncate">${friend.name}</p>
                                <p class="text-emerald-400 text-xs sm:text-sm truncate">${friend.status}</p>
                            </div>
                        </div>
                        <div class="flex-shrink-0">
                            <button class="btn text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 whitespace-nowrap ${friend.inTournament ? 'opacity-50 cursor-not-allowed' : ''}" 
                                ${friend.inTournament ? 'disabled' : ''}>
                                ${friend.inTournament ? '🏆 Turnuvada' : '🎮 Davet Et'}
                            </button>
                        </div>
                    </div>
                `).join('');
            }

            const allFriendsContainer = document.getElementById('all-friends-container');
            if (allFriendsContainer) {
                allFriendsContainer.innerHTML = friendsData.offline.map(friend => `
                    <div class="flex items-center justify-between gap-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
                        <div class="flex items-center space-x-3 min-w-0 flex-1">
                            <div class="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span class="text-white text-xs sm:text-sm font-bold">${friend.initial}</span>
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="text-slate-100 text-sm sm:text-base truncate">${friend.name}</p>
                                <p class="text-slate-500 text-xs truncate">${friend.lastSeen}</p>
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            const friendRequestsContainer = document.getElementById('friend-requests-container');
            if (friendRequestsContainer) {
                friendRequestsContainer.innerHTML = friendsData.requests.map(friend => `
                    <div class="flex items-center justify-between gap-2 p-2.5 sm:p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors">
                        <div class="flex items-center space-x-2 min-w-0 flex-1">
                            <div class="w-8 h-8 bg-gradient-to-br ${friend.color} rounded-full flex items-center justify-center flex-shrink-0">
                                <span class="text-white text-xs font-bold">${friend.initial}</span>
                            </div>
                            <span class="text-slate-200 text-sm truncate">${friend.name}</span>
                        </div>
                        <div class="flex space-x-1.5 flex-shrink-0">
                            <button class="btn text-xs px-2.5 py-1.5 hover:bg-emerald-600 transition-colors" title="Kabul Et">✓</button>
                            <button class="btn btn-secondary text-xs px-2.5 py-1.5 hover:bg-red-600 transition-colors" title="Reddet">✗</button>
                        </div>
                    </div>
                `).join('');
            }

            const friendActivityContainer = document.getElementById('friend-activity-container');
            if (friendActivityContainer) {
                friendActivityContainer.innerHTML = friendsData.activity.map(activity => `
                    <div class="text-sm">
                        <div class="flex items-center space-x-2 mb-1.5">
                            <span class="text-${activity.color}-400 text-lg leading-none">●</span>
                            <span class="text-slate-200 font-medium">${activity.name}</span>
                        </div>
                        <p class="text-slate-400 text-xs sm:text-sm pl-6 leading-relaxed">${activity.action}</p>
                        <p class="text-slate-600 text-xs pl-6 mt-1">${activity.time}</p>
                    </div>
                `).join('');
            }

        } catch (error) {
            console.error('Error loading friends data:', error);
            this.showError(CONSTANTS.ERROR_MESSAGES.FRIENDS_LOAD);
        }
    }

    private updateElementById(id: string, content: string): void {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    private delayedExecution(callback: () => void, delay: number = CONSTANTS.TIMEOUTS.DOM_READY): void {
        let unauthorizedPages = ['/register', '/reset-password', '/login'];
        if (unauthorizedPages.includes(window.location.pathname))
            document.getElementById('navigation')!.style.display = 'none';
        else
            document.getElementById('navigation')!.style.display = 'block';
        setTimeout(callback, delay);
    }

    private async renderLogin(): Promise<void> {
        await this.loadTemplate('login', false);

        this.delayedExecution(() => {
            // 42 Intra OAuth butonu
            const intraBtn = document.getElementById('guest-login-btn');
            if (intraBtn) {
                intraBtn.addEventListener('click', async () => {
                    try {
                        const response = await Api.get('/api/oauth/42');
                        const authUrl = response.data?.authUrl || response.data?.url || response.data;
                        if (authUrl) window.location.href = authUrl;
                    } catch (err) {
                        console.error('Intra OAuth error:', err);
                    }
                });
            }

            // 2FA paneli için geçici bilgiler
            let pendingUserId: number | null = null;
            let pendingEmail: string = '';
            let pendingPassword: string = '';

            // ─── 2FA adımını göster ───
            const showTwoFactorStep = () => {
                document.getElementById('login-form')?.classList.add('hidden');
                document.getElementById('twofa-step')?.classList.remove('hidden');
                (document.getElementById('twofa-login-code') as HTMLInputElement)?.focus();
            };

            // ─── Giriş formunu geri göster ───
            const showLoginForm = () => {
                document.getElementById('twofa-step')?.classList.add('hidden');
                document.getElementById('login-form')?.classList.remove('hidden');
                (document.getElementById('twofa-login-code') as HTMLInputElement).value = '';
                pendingUserId = null;
            };

            // ─── Token kaydet ve ana sayfaya yönlendir ───
            const completeLogin = async (res: any) => {
                localStorage.setItem('accessToken', res.data.tokens.accessToken);
                localStorage.setItem('refreshToken', res.data.tokens.refreshToken);
                localStorage.setItem('expiresAt', res.data.tokens.expiresAt);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                await Api.setAuthToken(res.data.tokens.accessToken);
                alert(this.i18n.t('alert.loginSuccess'));
                this.router.navigate('/home');
            };

            // ─── Login Formu Submit ───
            const form = document.getElementById('login-form') as HTMLFormElement | null;
            if (!form) return;
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                pendingEmail = (document.getElementById('email') as HTMLInputElement).value;
                pendingPassword = (document.getElementById('password') as HTMLInputElement).value;
                try {
                    const res = await Api.post('/api/auth/login', { email: pendingEmail, password: pendingPassword });

                    // Backend 2FA gerektiriyor ve kodu e-postaya zaten gönderdi
                    if (res?.data?.requires2FA && res.data.userId) {
                        pendingUserId = res.data.userId;
                        showTwoFactorStep();
                        return;
                    }

                    if (res?.data?.tokens) {
                        await completeLogin(res);
                    } else {
                        alert(this.i18n.t('alert.loginFailed'));
                    }
                } catch (err) {
                    console.error('Login error', err);
                    alert(this.i18n.t('alert.loginError'));
                }
            });

            // ─── 2FA Doğrula ───
            document.getElementById('twofa-login-verify-btn')?.addEventListener('click', async () => {
                if (!pendingUserId) return;
                const code = (document.getElementById('twofa-login-code') as HTMLInputElement)?.value.trim();
                if (code.length !== 6) { alert('Lütfen 6 haneli kodu girin.'); return; }

                // Backend: tekrar login, ama bu sefer twoFactorCode ile
                const res = await Api.post('/api/auth/login', {
                    email: pendingEmail,
                    password: pendingPassword,
                    twoFactorCode: code,
                });

                if (res?.data?.tokens) {
                    await completeLogin(res);
                } else {
                    alert(res?.message || 'Geçersiz ya da süresi dolmuş kod.');
                }
            });

            // ─── Kodu tekrar gönder ───
            document.getElementById('twofa-login-resend-btn')?.addEventListener('click', async () => {
                if (!pendingUserId) return;
                // Backend'e email+password ile tekrar istek at → kodu tekrar gönderir
                await Api.post('/api/auth/login', { email: pendingEmail, password: pendingPassword });
                alert('Kod tekrar gönderildi.');
            });

            // ─── Geri dön ───
            document.getElementById('twofa-login-back-btn')?.addEventListener('click', () => {
                showLoginForm();
            });

        }, CONSTANTS.TIMEOUTS.DOM_READY);
    }

    private async renderRegister(): Promise<void> {
        await this.loadTemplate('register', false);

        this.delayedExecution(() => {
            const form = document.getElementById('register-form') as HTMLFormElement | null;
            if (!form) return;

            // Kullanım koşulları modal işlevleri
            const termsLink = document.getElementById('terms-link');
            const termsModal = document.getElementById('terms-modal');
            const termsClose = document.getElementById('terms-close');
            const termsAccept = document.getElementById('terms-accept');

            if (termsLink && termsModal) {
                termsLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    termsModal.classList.remove('hidden');
                    termsModal.classList.add('flex');
                });

                termsClose?.addEventListener('click', () => {
                    termsModal.classList.add('hidden');
                    termsModal.classList.remove('flex');
                });

                termsAccept?.addEventListener('click', () => {
                    termsModal.classList.add('hidden');
                    termsModal.classList.remove('flex');
                    const checkbox = form.querySelector('input[type="checkbox"]') as HTMLInputElement;
                    if (checkbox) checkbox.checked = true;
                });

                termsModal.addEventListener('click', (e) => {
                    if (e.target === termsModal) {
                        termsModal.classList.add('hidden');
                        termsModal.classList.remove('flex');
                    }
                });
            }

            // Şifre validasyonu
            const passwordInput = document.getElementById('password') as HTMLInputElement;
            const passwordError = document.getElementById('password-error');
            const reqLength = document.getElementById('req-length');
            const reqLowercase = document.getElementById('req-lowercase');
            const reqUppercase = document.getElementById('req-uppercase');
            const reqNumber = document.getElementById('req-number');
            const reqSpecial = document.getElementById('req-special');

            const updateRequirement = (el: HTMLElement | null, valid: boolean) => {
                if (!el) return;
                const icon = el.querySelector('.req-icon');
                if (valid) {
                    el.classList.remove('text-slate-500', 'text-red-400');
                    el.classList.add('text-green-400');
                    if (icon) icon.textContent = '✓';
                } else {
                    el.classList.remove('text-green-400', 'text-red-400');
                    el.classList.add('text-slate-500');
                    if (icon) icon.textContent = '○';
                }
            };

            const validatePassword = (pw: string) => {
                const checks = {
                    length: pw.length >= 8,
                    lowercase: /[a-z]/.test(pw),
                    uppercase: /[A-Z]/.test(pw),
                    number: /[0-9]/.test(pw),
                    special: /[^a-zA-Z0-9]/.test(pw),
                };
                updateRequirement(reqLength, checks.length);
                updateRequirement(reqLowercase, checks.lowercase);
                updateRequirement(reqUppercase, checks.uppercase);
                updateRequirement(reqNumber, checks.number);
                updateRequirement(reqSpecial, checks.special);
                return checks.length && checks.lowercase && checks.uppercase && checks.number && checks.special;
            };

            if (passwordInput) {
                passwordInput.addEventListener('input', () => {
                    validatePassword(passwordInput.value);
                    if (passwordError) {
                        passwordError.classList.add('hidden');
                        passwordError.textContent = '';
                    }
                });
            }

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                let displayName = (document.getElementById('displayName') as HTMLInputElement).value;
                let email = (document.getElementById('email') as HTMLInputElement).value;
                let password = (document.getElementById('password') as HTMLInputElement).value;

                // Frontend şifre politikası kontrolü
                if (!validatePassword(password)) {
                    if (passwordError) {
                        passwordError.textContent = this.i18n.t('register.pwError');
                        passwordError.classList.remove('hidden');
                    }
                    // Karşılanmayan gereksinimleri kırmızı yap
                    if (password.length < 8 && reqLength) { reqLength.classList.remove('text-slate-500'); reqLength.classList.add('text-red-400'); }
                    if (!/[a-z]/.test(password) && reqLowercase) { reqLowercase.classList.remove('text-slate-500'); reqLowercase.classList.add('text-red-400'); }
                    if (!/[A-Z]/.test(password) && reqUppercase) { reqUppercase.classList.remove('text-slate-500'); reqUppercase.classList.add('text-red-400'); }
                    if (!/[0-9]/.test(password) && reqNumber) { reqNumber.classList.remove('text-slate-500'); reqNumber.classList.add('text-red-400'); }
                    if (!/[^a-zA-Z0-9]/.test(password) && reqSpecial) { reqSpecial.classList.remove('text-slate-500'); reqSpecial.classList.add('text-red-400'); }
                    return;
                }

                try {
                    await Api.post('/api/auth/register', { displayName, email, password });
                    alert(this.i18n.t('alert.registerSuccess'));
                    this.router.navigate('/login');
                } catch (err) {
                    console.error('Register error', err);
                    alert(this.i18n.t('alert.registerError'));
                }
            });
        }, CONSTANTS.TIMEOUTS.DOM_READY);
    }

    private async renderResetPassword(): Promise<void> {
        await this.loadTemplate('reset-password', false);

        this.delayedExecution(() => {
            let userEmail = '';
            let verificationCode = '';
            let resendInterval: ReturnType<typeof setInterval> | null = null;

            // DOM elements
            const stepEmail = document.getElementById('step-email');
            const stepCode = document.getElementById('step-code');
            const stepPassword = document.getElementById('step-password');
            const stepSuccess = document.getElementById('step-success');
            const stepIndicator1 = document.getElementById('step-indicator-1');
            const stepIndicator2 = document.getElementById('step-indicator-2');
            const stepIndicator3 = document.getElementById('step-indicator-3');

            const emailForm = document.getElementById('reset-email-form') as HTMLFormElement | null;
            const codeForm = document.getElementById('verify-code-form') as HTMLFormElement | null;
            const passwordForm = document.getElementById('new-password-form') as HTMLFormElement | null;

            const emailError = document.getElementById('email-error');
            const codeError = document.getElementById('code-error');
            const passwordResetError = document.getElementById('password-reset-error');
            const confirmError = document.getElementById('confirm-error');
            const sentEmailDisplay = document.getElementById('sent-email-display');
            const sendCodeText = document.getElementById('send-code-text');
            const sendCodeSpinner = document.getElementById('send-code-spinner');
            const resendBtn = document.getElementById('resend-code-btn');
            const resendTimer = document.getElementById('resend-timer');
            const changeEmailBtn = document.getElementById('change-email-btn');
            const verifyCodeBtn = document.getElementById('verify-code-btn') as HTMLButtonElement | null;
            const resetPasswordBtn = document.getElementById('reset-password-btn') as HTMLButtonElement | null;
            const resetBtnText = document.getElementById('reset-btn-text');
            const resetSpinner = document.getElementById('reset-spinner');

            // Step navigation helper
            const goToStep = (step: number) => {
                stepEmail?.classList.add('hidden');
                stepCode?.classList.add('hidden');
                stepPassword?.classList.add('hidden');
                stepSuccess?.classList.add('hidden');

                [stepIndicator1, stepIndicator2, stepIndicator3].forEach((ind, i) => {
                    if (!ind) return;
                    if (i < step) {
                        ind.classList.remove('bg-white/20', 'text-slate-400');
                        ind.classList.add('bg-purple-500', 'text-white');
                    } else {
                        ind.classList.remove('bg-purple-500', 'text-white');
                        ind.classList.add('bg-white/20', 'text-slate-400');
                    }
                });

                if (step === 1) stepEmail?.classList.remove('hidden');
                else if (step === 2) stepCode?.classList.remove('hidden');
                else if (step === 3) stepPassword?.classList.remove('hidden');
                else if (step === 4) stepSuccess?.classList.remove('hidden');
            };

            // Resend countdown
            const startResendCountdown = () => {
                let seconds = 60;
                if (resendBtn) (resendBtn as HTMLButtonElement).disabled = true;
                if (resendTimer) resendTimer.textContent = String(seconds);
                if (resendInterval) clearInterval(resendInterval);
                resendInterval = setInterval(() => {
                    seconds--;
                    if (resendTimer) resendTimer.textContent = String(seconds);
                    if (seconds <= 0) {
                        if (resendInterval) clearInterval(resendInterval);
                        if (resendBtn) (resendBtn as HTMLButtonElement).disabled = false;
                    }
                }, 1000);
            };

            // STEP 1: Send email code
            emailForm?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const emailInput = document.getElementById('reset-email') as HTMLInputElement;
                userEmail = emailInput?.value || '';

                if (sendCodeText) sendCodeText.textContent = this.i18n.t('reset.sending');
                sendCodeSpinner?.classList.remove('hidden');

                try {
                    await Api.post('/api/auth/forgot-password', { email: userEmail });
                    if (sentEmailDisplay) sentEmailDisplay.textContent = userEmail;
                    goToStep(2);
                    startResendCountdown();
                    // Focus first code input
                    const firstInput = document.querySelector('.code-input') as HTMLInputElement;
                    firstInput?.focus();
                } catch (err) {
                    if (emailError) {
                        emailError.textContent = this.i18n.t('reset.emailSendError');
                        emailError.classList.remove('hidden');
                    }
                } finally {
                    if (sendCodeText) sendCodeText.textContent = this.i18n.t('reset.sendCode');
                    sendCodeSpinner?.classList.add('hidden');
                }
            });

            // Code input UX — auto advance & backspace
            const codeInputs = document.querySelectorAll('.code-input') as NodeListOf<HTMLInputElement>;
            codeInputs.forEach((input, idx) => {
                input.addEventListener('input', () => {
                    const val = input.value.replace(/[^0-9]/g, '');
                    input.value = val;
                    if (val && idx < codeInputs.length - 1) {
                        codeInputs[idx + 1].focus();
                    }
                    // Check if all filled
                    const code = Array.from(codeInputs).map(i => i.value).join('');
                    if (verifyCodeBtn) verifyCodeBtn.disabled = code.length !== 6;
                });
                input.addEventListener('keydown', (e: KeyboardEvent) => {
                    if (e.key === 'Backspace' && !input.value && idx > 0) {
                        codeInputs[idx - 1].focus();
                    }
                });
                input.addEventListener('paste', (e: ClipboardEvent) => {
                    e.preventDefault();
                    const paste = e.clipboardData?.getData('text')?.replace(/[^0-9]/g, '') || '';
                    for (let i = 0; i < Math.min(paste.length, codeInputs.length); i++) {
                        codeInputs[i].value = paste[i];
                    }
                    const focusIdx = Math.min(paste.length, codeInputs.length - 1);
                    codeInputs[focusIdx].focus();
                    const code = Array.from(codeInputs).map(i => i.value).join('');
                    if (verifyCodeBtn) verifyCodeBtn.disabled = code.length !== 6;
                });
            });

            // Resend code
            resendBtn?.addEventListener('click', async () => {
                try {
                    await Api.post('/api/auth/forgot-password', { email: userEmail });
                    startResendCountdown();
                    if (codeError) codeError.classList.add('hidden');
                } catch (err) {
                    if (codeError) {
                        codeError.textContent = this.i18n.t('reset.resendError');
                        codeError.classList.remove('hidden');
                    }
                }
            });

            // Change email — go back to step 1
            changeEmailBtn?.addEventListener('click', () => {
                if (resendInterval) clearInterval(resendInterval);
                goToStep(1);
            });

            // STEP 2: Verify code — just move to step 3
            codeForm?.addEventListener('submit', (e) => {
                e.preventDefault();
                verificationCode = Array.from(codeInputs).map(i => i.value).join('');
                if (verificationCode.length !== 6) return;
                goToStep(3);
                const newPwInput = document.getElementById('new-password') as HTMLInputElement;
                newPwInput?.focus();
            });

            // STEP 3: Password validation
            const rpReqLength = document.getElementById('rp-req-length');
            const rpReqLower = document.getElementById('rp-req-lowercase');
            const rpReqUpper = document.getElementById('rp-req-uppercase');
            const rpReqNumber = document.getElementById('rp-req-number');
            const rpReqSpecial = document.getElementById('rp-req-special');
            const newPwInput = document.getElementById('new-password') as HTMLInputElement;
            const confirmPwInput = document.getElementById('confirm-password') as HTMLInputElement;

            const updateReq = (el: HTMLElement | null, valid: boolean) => {
                if (!el) return;
                const icon = el.querySelector('.rp-req-icon');
                if (valid) {
                    el.classList.remove('text-slate-500', 'text-red-400');
                    el.classList.add('text-green-400');
                    if (icon) icon.textContent = '✓';
                } else {
                    el.classList.remove('text-green-400', 'text-red-400');
                    el.classList.add('text-slate-500');
                    if (icon) icon.textContent = '○';
                }
            };

            const validatePw = (pw: string) => {
                const c = {
                    len: pw.length >= 8,
                    low: /[a-z]/.test(pw),
                    up: /[A-Z]/.test(pw),
                    num: /[0-9]/.test(pw),
                    spec: /[^a-zA-Z0-9]/.test(pw),
                };
                updateReq(rpReqLength, c.len);
                updateReq(rpReqLower, c.low);
                updateReq(rpReqUpper, c.up);
                updateReq(rpReqNumber, c.num);
                updateReq(rpReqSpecial, c.spec);
                return c.len && c.low && c.up && c.num && c.spec;
            };

            const checkResetFormValid = () => {
                const pw = newPwInput?.value || '';
                const cpw = confirmPwInput?.value || '';
                const pwValid = validatePw(pw);
                const match = pw === cpw && pw.length > 0;
                if (confirmError) {
                    if (cpw.length > 0 && !match) confirmError.classList.remove('hidden');
                    else confirmError.classList.add('hidden');
                }
                if (resetPasswordBtn) resetPasswordBtn.disabled = !(pwValid && match);
            };

            newPwInput?.addEventListener('input', checkResetFormValid);
            confirmPwInput?.addEventListener('input', checkResetFormValid);

            // STEP 3: Submit — call reset-password API
            passwordForm?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newPassword = newPwInput?.value || '';

                if (resetBtnText) resetBtnText.textContent = this.i18n.t('reset.resetting');
                resetSpinner?.classList.remove('hidden');
                if (resetPasswordBtn) resetPasswordBtn.disabled = true;

                try {
                    await Api.post('/api/auth/reset-password', {
                        email: userEmail,
                        code: verificationCode,
                        newPassword: newPassword,
                    });
                    goToStep(4);
                } catch (err: any) {
                    if (passwordResetError) {
                        const msg = err?.message || this.i18n.t('reset.resetError');
                        passwordResetError.textContent = msg;
                        passwordResetError.classList.remove('hidden');
                    }
                    if (resetPasswordBtn) resetPasswordBtn.disabled = false;
                } finally {
                    if (resetBtnText) resetBtnText.textContent = this.i18n.t('reset.resetPassword');
                    resetSpinner?.classList.add('hidden');
                }
            });
        }, CONSTANTS.TIMEOUTS.DOM_READY);
    }
}

new App();