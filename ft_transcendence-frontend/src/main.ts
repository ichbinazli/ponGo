/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import './styles.css';
import { Router } from './core/Router';
import { APIClient, LeaderboardEntry } from './api/APIClient';
import { TemplateLoader } from './utils/templateLoader';
import Api from './api/apiLibrary';
import { initGameOptions } from './game/gameOptionManager';
import { I18n, Language } from './utils/i18n';
import { initTournament } from './game/tournament';
import {
    Chart,
    ArcElement,
    DoughnutController,
    LineController,
    LineElement,
    BarController,
    BarElement,
    PolarAreaController,
    RadialLinearScale,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

Chart.register(
    ArcElement,
    DoughnutController,
    LineController,
    LineElement,
    BarController,
    BarElement,
    PolarAreaController,
    RadialLinearScale,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    Filler,
);

class TokenRefreshManager {
    private static instance: TokenRefreshManager;

    private constructor() {
        this.init();
    }

    public static getInstance(): TokenRefreshManager {
        if (!TokenRefreshManager.instance) {
            TokenRefreshManager.instance = new TokenRefreshManager();
        }
        return TokenRefreshManager.instance;
    }

    private async init(): Promise<void> {
        let isRefreshing = false;

        setInterval(async () => {
            const expiresAt = localStorage.getItem('expiresAt');
            const refreshToken = localStorage.getItem('refreshToken');

            if (!expiresAt) {
                let response = await Api.get('/api/users/me');
                let unauthorizedPages = ['/register', '/reset-password', '/login'];
                if (!response.success && !unauthorizedPages.includes(window.location.pathname)) {
                    window.location.href = '/login';
                }
                return;
            }

            const now = Date.now();
            const expiresTimestamp = new Date(expiresAt).getTime();
            const timeLeftMs = expiresTimestamp - now;
            const howMany = 14 * 60 * 1000;

            if (timeLeftMs < howMany && !isRefreshing && refreshToken) {
                try {
                    isRefreshing = true;

                    const response = await Api.post('/api/auth/refresh', {
                        refreshToken: refreshToken
                    });

                    if (response.success) {
                        localStorage.setItem('accessToken', response.data.tokens.accessToken);
                        localStorage.setItem('expiresAt', response.data.tokens.expiresAt);
                        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
                        await Api.setAuthToken(response.data.tokens.accessToken);
                    }
                } catch (error) {
                    console.error("Token refresh error:", error);
                } finally {
                    isRefreshing = false;
                }
            }
        }, 1000);
    }
}

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

class App {
    private router: Router;
    private apiClient: APIClient;
    private pongGameInstance: any = null;
    private i18n: I18n;

    constructor() {
        this.apiClient = new APIClient();
        this.router = new Router();
        this.i18n = I18n.getInstance();
        TokenRefreshManager.getInstance();
        localStorage.removeItem('theme');
        document.body.classList.remove('light-mode');
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

    private renderPage(content: string): void {
        const mainContent = document.getElementById(CONSTANTS.SELECTORS.MAIN_CONTENT);
        if (mainContent) {
            mainContent.innerHTML = content;
            this.i18n.applyTranslations();
        }
    }

    private cleanupPongGame(): void {
        if (this.pongGameInstance) {
            this.pongGameInstance.dispose();
            this.pongGameInstance = null;
        }
    }

    private async loadTemplate(templateName: string, wrapInContainer: boolean = true): Promise<void> {
        this.cleanupPongGame();
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
        const trophyImages = ['/image/1.svg', '/image/2.svg', '/image/3.svg'];
        const positionKeys = ['leaderboard.first', 'leaderboard.second', 'leaderboard.third'];

        const cardConfigs = [
            {
                bg: 'linear-gradient(135deg, #1a1207 0%, #2d1f0a 30%, #1a1207 100%)',
                border: '#ca8a04',
                glow: '0 0 30px rgba(234,179,8,0.35), 0 0 60px rgba(234,179,8,0.15)',
                titleColor: 'text-yellow-400',
                badge: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
            },
            {
                bg: 'linear-gradient(135deg, #0f1318 0%, #1a2030 30%, #0f1318 100%)',
                border: '#94a3b8',
                glow: '0 0 30px rgba(148,163,184,0.3), 0 0 60px rgba(148,163,184,0.1)',
                titleColor: 'text-slate-200',
                badge: 'bg-slate-500/20 text-slate-200 border border-slate-400/40',
            },
            {
                bg: 'linear-gradient(135deg, #1a0f07 0%, #2d1a0a 30%, #1a0f07 100%)',
                border: '#c2410c',
                glow: '0 0 30px rgba(249,115,22,0.35), 0 0 60px rgba(249,115,22,0.15)',
                titleColor: 'text-orange-400',
                badge: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
            },
        ];
        const c = cardConfigs[index];

        return `
            <div class="podium-card relative overflow-hidden rounded-2xl text-center transform hover:scale-105 transition-all duration-300 p-5 sm:p-8"
                 style="background: ${c.bg}; border: 2px solid ${c.border}; box-shadow: ${c.glow};">
                <div class="mb-4 sm:mb-5 flex justify-center">
                    <img src="${trophyImages[index]}" alt="${this.i18n.t(positionKeys[index])}" class="w-20 h-20 sm:w-28 sm:h-28 object-contain drop-shadow-2xl">
                </div>
                <div class="flex justify-center mb-3 sm:mb-4">
                    ${this.renderAvatarHtml({ id: player.id, display_name: player.name, avatar_url: player.avatar_url }, 'w-14 h-14 sm:w-18 sm:h-18 ring-2 ring-white/20', 'text-lg sm:text-xl')}
                </div>
                <span class="inline-block ${c.badge} text-xs font-bold px-3 py-1 rounded-full mb-2">${this.i18n.t(positionKeys[index])}</span>
                <h4 class="text-lg sm:text-xl font-bold text-white mb-1">${player.name}</h4>
                <p class="${c.titleColor} text-xl sm:text-2xl font-extrabold mb-1">${player.score.toLocaleString()}</p>
                <p class="text-xs text-slate-400">${player.winRate}% Win Rate</p>
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

        this.delayedExecution(async () => {
            if (window.location.pathname !== CONSTANTS.ROUTES.GAME_NOSTALGIA) {
                return;
            }

            const { Pong3DGame } = await import('./3D-game/pong3d');
            if (window.location.pathname !== CONSTANTS.ROUTES.GAME_NOSTALGIA) {
                return;
            }
            this.cleanupPongGame();

            const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
            if (canvas) {
                this.pongGameInstance = new Pong3DGame(canvas);
            }
        }, CONSTANTS.TIMEOUTS.DOM_READY);
    }

    private async renderTournament(): Promise<void> {
        this.updateActiveNavLink(CONSTANTS.ROUTES.TOURNAMENT);
        await this.loadTemplate(CONSTANTS.TEMPLATES.TOURNAMENT, false);
        initTournament();
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
                            ${index < 3 ? `<img src="/image/${index + 1}.svg" alt="Top ${index + 1}" class="w-6 h-6 sm:w-8 sm:h-8 inline-block">` : `#${index + 1}`}
                        </td>
                        <td class="py-2 sm:py-3 px-2 sm:px-4">
                            <div class="flex items-center space-x-2 sm:space-x-3">
                                ${this.renderAvatarHtml({ id: player.id, display_name: player.name, avatar_url: player.avatar_url }, 'w-8 h-8 sm:w-10 sm:h-10', 'text-xs sm:text-sm')}
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
                setTimeout(checkAndInit, 100);
                return;
            }


            addPhotoBtn.addEventListener('click', () => {
                photoUpload.click();
            });

            photoUpload.addEventListener('change', (e: Event) => {
                const target = e.target as HTMLInputElement;
                const file = target.files?.[0];

                if (!file) return;


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
                this.setupDashboard(stats);
            }, CONSTANTS.TIMEOUTS.DOM_READY);

            const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
            const displayNameInput = document.querySelector('input[name="displayName"]') as HTMLInputElement;

            emailInput.value = user.email;
            displayNameInput.value = user.displayName;
            document.getElementById('update-account-info')?.addEventListener('click', async () => {
                const email = emailInput.value;
                const displayName = displayNameInput.value;
                await Api.patch(`/api/users/me`, {
                    email: email,
                    displayName: displayName
                });
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
                tableBody.innerHTML = '';
                response.data.matches.forEach((item: any) => {
                    const isPlayer1 = item.player1_id === user.id;
                    const opponentName = isPlayer1 ? item.player2_display_name : item.player1_display_name;
                    const playerScore = isPlayer1 ? item.player1_score : item.player2_score;
                    const opponentScore = isPlayer1 ? item.player2_score : item.player1_score;

                    const result = item.winner_id === user.id ?
                        `<span class="text-green-400 font-bold">${this.i18n.t('profile.victory')}</span>` :
                        `<span class="text-red-400 font-bold">${this.i18n.t('profile.defeat')}</span>`;

                    const matchDate = new Date(item.ended_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
                    const durationMinutes = Math.floor(item.duration_seconds / 60);
                    const durationSeconds = item.duration_seconds % 60;
                    const durationStr = `${durationMinutes}m ${durationSeconds}s`;

                    tableBody.innerHTML += `
                    <tr class="border-b border-white/10 hover:bg-white/5">
                        <td class="py-3 px-4 text-left">${matchDate}</td>
                        <td class="py-3 px-4 text-left">${opponentName}</td>
                        <td class="py-3 px-4 text-left capitalize">${item.game_mode}</td>
                        <td class="py-3 px-4 text-left">${playerScore} - ${opponentScore}</td>
                        <td class="py-3 px-4 text-left">${result}</td>
                        <td class="py-3 px-4 text-left">${durationStr}</td>
                    </tr>
                `;
                });
            }
        }

        const usernameEl = document.getElementById('profile-username');
        const avatarEl = document.getElementById('profile-avatar') as HTMLImageElement;

        if (usernameEl) {
            usernameEl.textContent = user.displayName || 'Player';
        }

        if (avatarEl) {
            let avatarSrc = user.avatarUrl || '/uploads/avatars/default-avatar.png';
            if (!avatarSrc.startsWith('http') && !avatarSrc.startsWith('/')) {
                avatarSrc = `/uploads/avatars/${avatarSrc}`;
            }
            avatarEl.src = avatarSrc;
            avatarEl.onerror = () => {
                avatarEl.onerror = null;
                avatarEl.src = '/uploads/avatars/default-avatar.png';
            };
        }

        const statsGridContainer = document.getElementById('stats-grid-container');
        if (statsGridContainer) {
            statsGridContainer.innerHTML = `
            <div class="stat-card">
                <h4 class="text-sm font-semibold text-white/70 mb-2" data-i18n="profile.totalPoints">${this.i18n.t('profile.totalPoints')}</h4>
                <div class="text-2xl font-bold text-yellow-400">${statsData.total_points_scored ? statsData.total_points_scored : 0}</div>
            </div>
            <div class="stat-card">
                <h4 class="text-sm font-semibold text-white/70 mb-2" data-i18n="profile.totalGames">${this.i18n.t('profile.totalGames')}</h4>
                <div class="text-2xl font-bold text-blue-400">${statsData.total_matches ? statsData.total_matches : 0}</div>
            </div>
            <div class="stat-card">
                <h4 class="text-sm font-semibold text-white/70 mb-2" data-i18n="profile.wins">${this.i18n.t('profile.wins')}</h4>
                <div class="text-2xl font-bold text-green-400">${statsData.wins ? statsData.wins : 0}</div>
            </div>
            <div class="stat-card">
                <h4 class="text-sm font-semibold text-white/70 mb-2" data-i18n="profile.losses">${this.i18n.t('profile.losses')}</h4>
                <div class="text-2xl font-bold text-red-400">${statsData.losses ? statsData.losses : 0}</div>
            </div>
            <div class="stat-card">
                <h4 class="text-sm font-semibold text-white/70 mb-2" data-i18n="profile.winRate">${this.i18n.t('profile.winRate')}</h4>
                <div class="text-2xl font-bold text-purple-400">${statsData.win_rate ? statsData.win_rate : 0}%</div>
            </div>
            <div class="stat-card">
                <h4 class="text-sm font-semibold text-white/70 mb-2" data-i18n="profile.draws">${this.i18n.t('profile.draws')}</h4>
                <div class="text-2xl font-bold text-orange-400">${statsData.draws ? statsData.draws : 0}</div>
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

        openBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
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

        const closeModal = () => modal.classList.add('hidden');
        closeBtn?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

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

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = currentPw?.value || '';
            const newPassword = newPw?.value || '';

            if (btnText) btnText.textContent = this.i18n.t('profile.changingPassword') || 'Changing...';
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
                    successEl.textContent = this.i18n.t('profile.passwordChanged') || 'Password changed successfully!';
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
                    errorEl.textContent = err?.message || this.i18n.t('profile.passwordChangeError') || 'Password change failed.';
                    errorEl.classList.remove('hidden');
                }
                if (submitBtn) submitBtn.disabled = false;
            } finally {
                if (btnText) btnText.textContent = this.i18n.t('profile.changePassword') || 'Change Password';
                spinner?.classList.add('hidden');
            }
        });
    }

    private dashboardCharts: Chart[] = [];

    private async setupDashboard(statsResponse: any): Promise<void> {
        this.dashboardCharts.forEach(c => c.destroy());
        this.dashboardCharts = [];

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const statsData = statsResponse?.data || {};

        let matches: any[] = [];
        try {
            const resp = await Api.get('/api/stats/recent-matches?limit=20');
            if (resp.success) {
                matches = resp.data.matches || [];
            }
        } catch (e) {
            console.error('Dashboard: recent-matches fetch failed', e);
        }

        const ppg = statsData.total_matches > 0
            ? (statsData.total_points_scored / statsData.total_matches).toFixed(1)
            : '0';
        this.setTextContent('dash-points-per-game', ppg);

        this.createWinLossDoughnut(statsData);

        this.createPerformanceLineChart(matches, user);

        this.createPointsBarChart(matches, user);

        this.createGameModeChart(matches);

        this.calculateStreaks(matches, user);
    }

    private setTextContent(id: string, text: string): void {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    private createWinLossDoughnut(statsData: any): void {
        const canvas = document.getElementById('dash-winloss-chart') as HTMLCanvasElement;
        if (!canvas) return;

        const wins = statsData.wins ?? 0;
        const losses = statsData.losses ?? 0;
        const draws = statsData.draws ?? 0;

        const chart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: [
                    this.i18n.t('profile.wins'),
                    this.i18n.t('profile.losses'),
                    this.i18n.t('profile.draws'),
                ],
                datasets: [{
                    data: [wins, losses, draws],
                    backgroundColor: [
                        'rgba(74, 222, 128, 0.85)',
                        'rgba(248, 113, 113, 0.85)',
                        'rgba(251, 191, 36, 0.85)',
                    ],
                    borderColor: [
                        'rgba(74, 222, 128, 1)',
                        'rgba(248, 113, 113, 1)',
                        'rgba(251, 191, 36, 1)',
                    ],
                    borderWidth: 2,
                    hoverOffset: 8,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '65%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(139, 92, 246, 0.5)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                    },
                },
            },
        });
        this.dashboardCharts.push(chart);

        const legendEl = document.getElementById('dash-winloss-legend');
        if (legendEl) {
            legendEl.innerHTML = `
                <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-green-400 inline-block"></span> ${this.i18n.t('profile.wins')}: <strong class="text-green-400">${wins}</strong></span>
                <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-red-400 inline-block"></span> ${this.i18n.t('profile.losses')}: <strong class="text-red-400">${losses}</strong></span>
                <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span> ${this.i18n.t('profile.draws')}: <strong class="text-yellow-400">${draws}</strong></span>
            `;
        }
    }

    private createPerformanceLineChart(matches: any[], user: any): void {
        const canvas = document.getElementById('dash-performance-chart') as HTMLCanvasElement;
        if (!canvas) return;

        const last10 = matches.slice(0, 10).reverse();

        const labels = last10.map((_: any, i: number) => `${this.i18n.t('dashboard.match')} ${i + 1}`);
        const scores = last10.map((m: any) => {
            return m.player1_id === user.id ? m.player1_score : m.player2_score;
        });
        const results = last10.map((m: any) => m.winner_id === user.id ? 1 : (m.winner_id === null ? 0.5 : 0));

        const chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: this.i18n.t('dashboard.score'),
                        data: scores,
                        borderColor: 'rgba(139, 92, 246, 1)',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: results.map((r: number) =>
                            r === 1 ? '#4ade80' : r === 0.5 ? '#fbbf24' : '#f87171'
                        ),
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 9,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } },
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } },
                    },
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(139, 92, 246, 0.5)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                            afterLabel: (ctx: any) => {
                                const r = results[ctx.dataIndex];
                                return r === 1
                                    ? `${this.i18n.t('profile.victory')}`
                                    : r === 0.5
                                        ? `${this.i18n.t('profile.draws')}`
                                        : `${this.i18n.t('profile.defeat')}`;
                            },
                        },
                    },
                },
            },
        });
        this.dashboardCharts.push(chart);
    }

    private createPointsBarChart(matches: any[], user: any): void {
        const canvas = document.getElementById('dash-points-chart') as HTMLCanvasElement;
        if (!canvas) return;

        const last10 = matches.slice(0, 10).reverse();
        const labels = last10.map((_: any, i: number) => `${this.i18n.t('dashboard.match')} ${i + 1}`);
        const scored = last10.map((m: any) =>
            m.player1_id === user.id ? m.player1_score : m.player2_score
        );
        const against = last10.map((m: any) =>
            m.player1_id === user.id ? m.player2_score : m.player1_score
        );

        const chart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: this.i18n.t('dashboard.scored'),
                        data: scored,
                        backgroundColor: 'rgba(52, 211, 153, 0.7)',
                        borderColor: 'rgba(52, 211, 153, 1)',
                        borderWidth: 1,
                        borderRadius: 6,
                    },
                    {
                        label: this.i18n.t('dashboard.against'),
                        data: against,
                        backgroundColor: 'rgba(248, 113, 113, 0.7)',
                        borderColor: 'rgba(248, 113, 113, 1)',
                        borderWidth: 1,
                        borderRadius: 6,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } },
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 11 } },
                    },
                },
                plugins: {
                    legend: {
                        labels: { color: 'rgba(255,255,255,0.7)', font: { size: 12 }, usePointStyle: true, pointStyle: 'rectRounded' },
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(139, 92, 246, 0.5)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                    },
                },
            },
        });
        this.dashboardCharts.push(chart);
    }

    private createGameModeChart(matches: any[]): void {
        const canvas = document.getElementById('dash-gamemode-chart') as HTMLCanvasElement;
        if (!canvas) return;

        const modeCounts: Record<string, number> = {};
        matches.forEach((m: any) => {
            const mode = m.game_mode || 'unknown';
            modeCounts[mode] = (modeCounts[mode] || 0) + 1;
        });

        const modeLabels = Object.keys(modeCounts).map(m => m.charAt(0).toUpperCase() + m.slice(1));
        const modeData = Object.values(modeCounts);
        const modeColors = [
            'rgba(139, 92, 246, 0.7)',
            'rgba(236, 72, 153, 0.7)',
            'rgba(59, 130, 246, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(239, 68, 68, 0.7)',
        ];

        const chart = new Chart(canvas, {
            type: 'polarArea',
            data: {
                labels: modeLabels,
                datasets: [{
                    data: modeData,
                    backgroundColor: modeColors.slice(0, modeLabels.length),
                    borderColor: modeColors.slice(0, modeLabels.length).map(c => c.replace('0.7', '1')),
                    borderWidth: 2,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    r: {
                        grid: { color: 'rgba(255,255,255,0.08)' },
                        ticks: { display: false },
                    },
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: 'rgba(255,255,255,0.7)', font: { size: 12 }, usePointStyle: true, padding: 16 },
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(139, 92, 246, 0.5)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                    },
                },
            },
        });
        this.dashboardCharts.push(chart);
    }

    private calculateStreaks(matches: any[], user: any): void {
        if (matches.length === 0) return;

        let currentStreak = 0;
        let currentType: string | null = null;
        let bestWinStreak = 0;
        let tempWinStreak = 0;

        for (const m of matches) {
            const won = m.winner_id === user.id;
            const draw = m.winner_id === null;

            if (won) {
                tempWinStreak++;
                bestWinStreak = Math.max(bestWinStreak, tempWinStreak);
            } else {
                tempWinStreak = 0;
            }

            if (currentType === null) {
                currentType = won ? 'win' : draw ? 'draw' : 'loss';
                currentStreak = 1;
            } else {
                const thisType = won ? 'win' : draw ? 'draw' : 'loss';
                if (thisType === currentType) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }

        this.setTextContent('dash-current-streak', String(currentStreak));
        const streakTypeEl = document.getElementById('dash-streak-type');
        if (streakTypeEl) {
            const labels: Record<string, string> = {
                win: `${this.i18n.t('dashboard.winStreak')}`,
                loss: `${this.i18n.t('dashboard.lossStreak')}`,
                draw: `${this.i18n.t('dashboard.drawStreak')}`,
            };
            streakTypeEl.textContent = currentType ? labels[currentType] || '-' : '-';
        }
        this.setTextContent('dash-best-streak', String(bestWinStreak));
    }

    private async renderSettings(): Promise<void> {
        this.updateActiveNavLink(CONSTANTS.ROUTES.SETTINGS);
        await this.loadTemplate(CONSTANTS.TEMPLATES.SETTINGS);

        this.delayedExecution(() => {
            const langSelect = document.getElementById('language-select') as HTMLSelectElement | null;
            if (langSelect) {
                langSelect.value = this.i18n.getLanguage();
                langSelect.addEventListener('change', () => {
                    const newLang = langSelect.value as Language;
                    this.i18n.setLanguage(newLang);
                });
            }

            const badge = document.getElementById('twofa-status-badge')!;
            const enableBtn = document.getElementById('twofa-enable-btn')!;
            const disableBtn = document.getElementById('twofa-disable-btn')!;
            const codeSection = document.getElementById('twofa-code-section')!;
            const pwSection = document.getElementById('twofa-password-section')!;

            const setEnabled = (enabled: boolean) => {
                badge.textContent = enabled ? 'Active' : 'Inactive';
                badge.className = enabled
                    ? 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-900 text-emerald-300'
                    : 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-900 text-red-300';
                enableBtn.classList.toggle('hidden', enabled);
                disableBtn.classList.toggle('hidden', !enabled);
                codeSection.classList.add('hidden');
                pwSection.classList.add('hidden');
            };

            Api.get('/api/2fa/status').then((res: any) => {
                if (res?.success) setEnabled(res.data.enabled);
            }).catch(() => {
                badge.textContent = 'Failed to load';
            });

            enableBtn?.addEventListener('click', async () => {
                enableBtn.textContent = 'Sending...';
                enableBtn.setAttribute('disabled', 'true');
                const res = await Api.post('/api/2fa/setup', {});
                enableBtn.removeAttribute('disabled');
                enableBtn.textContent = 'Enable 2FA';
                if (res?.success) {
                    codeSection.classList.remove('hidden');
                    (document.getElementById('twofa-code-input') as HTMLInputElement)?.focus();
                } else {
                    alert(res?.message || 'Failed to send code.');
                }
            });

            document.getElementById('twofa-confirm-btn')?.addEventListener('click', async () => {
                const code = (document.getElementById('twofa-code-input') as HTMLInputElement)?.value.trim();
                if (code.length !== 6) { alert('Please enter the 6-digit code.'); return; }
                const res = await Api.post('/api/2fa/confirm', { code });
                if (res?.success) {
                    alert('2FA enabled successfully!');
                    setEnabled(true);
                } else {
                    alert(res?.message || 'Invalid or expired code.');
                }
            });

            document.getElementById('twofa-cancel-setup-btn')?.addEventListener('click', () => {
                codeSection.classList.add('hidden');
                (document.getElementById('twofa-code-input') as HTMLInputElement).value = '';
            });

            disableBtn?.addEventListener('click', () => {
                pwSection.classList.remove('hidden');
                (document.getElementById('twofa-password-input') as HTMLInputElement)?.focus();
            });

            document.getElementById('twofa-disable-confirm-btn')?.addEventListener('click', async () => {
                const password = (document.getElementById('twofa-password-input') as HTMLInputElement)?.value;
                if (!password) { alert('Please enter your password.'); return; }
                const res = await Api.post('/api/2fa/disable', { password });
                if (res?.success) {
                    alert('2FA has been disabled.');
                    setEnabled(false);
                    (document.getElementById('twofa-password-input') as HTMLInputElement).value = '';
                } else {
                    alert(res?.message || 'Invalid password or operation failed.');
                }
            });

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
        this.updateActiveNavLink(CONSTANTS.ROUTES.FRIENDS);
        await this.loadTemplate(CONSTANTS.TEMPLATES.FRIENDS);
        this.loadFriendsData();
    }

    private friendSearchTimeout: ReturnType<typeof setTimeout> | null = null;

    private async loadFriendsData(): Promise<void> {
        try {
            const [friendsRes, pendingRes, sentRes] = await Promise.all([
                Api.get('/api/friends'),
                Api.get('/api/friends/requests/pending'),
                Api.get('/api/friends/requests/sent'),
            ]);

            const friends: any[] = friendsRes?.data?.friends || [];
            const pendingRequests: any[] = pendingRes?.data?.requests || [];
            const sentRequests: any[] = sentRes?.data?.requests || [];

            this.updateElementById('all-friends-count', `${friends.length} ${this.i18n.t('friends.friendLabel')}`);
            this.updateElementById('friend-requests-count', pendingRequests.length.toString());
            this.updateElementById('sent-requests-count', sentRequests.length.toString());

            this.renderAllFriends(friends);

            this.renderPendingRequests(pendingRequests);

            this.renderSentRequests(sentRequests);

            this.setupFriendSearch();

        } catch (error) {
            console.error('Error loading friends data:', error);
            this.showError(CONSTANTS.ERROR_MESSAGES.FRIENDS_LOAD);
        }
    }

    private getInitials(name: string): string {
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }

    private getAvatarGradient(id: number): string {
        const gradients = [
            'from-emerald-400 to-cyan-400',
            'from-violet-400 to-purple-400',
            'from-amber-400 to-orange-400',
            'from-pink-400 to-rose-400',
            'from-blue-400 to-indigo-400',
            'from-teal-400 to-green-400',
            'from-red-400 to-pink-400',
            'from-yellow-400 to-amber-400',
        ];
        return gradients[id % gradients.length];
    }

    private renderAvatarHtml(user: any, sizeClass: string = 'w-10 h-10 sm:w-12 sm:h-12', textSize: string = 'text-sm sm:text-base'): string {
        if (user.avatar_url) {
            let avatarSrc = user.avatar_url;
            if (!avatarSrc.startsWith('http') && !avatarSrc.startsWith('/')) {
                avatarSrc = `/uploads/avatars/${avatarSrc}`;
            }
            return `<img src="${avatarSrc}" alt="${user.display_name}" class="${sizeClass} rounded-full object-cover flex-shrink-0" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                    <div class="${sizeClass} bg-gradient-to-br ${this.getAvatarGradient(user.id || 0)} rounded-full items-center justify-center flex-shrink-0" style="display:none;">
                        <span class="text-white font-bold ${textSize}">${this.getInitials(user.display_name || 'U')}</span>
                    </div>`;
        }
        const initials = this.getInitials(user.display_name || 'U');
        const gradient = this.getAvatarGradient(user.id || 0);
        return `<div class="${sizeClass} bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-white font-bold ${textSize}">${initials}</span>
        </div>`;
    }

    private renderAllFriends(friends: any[]): void {
        const container = document.getElementById('all-friends-container');
        if (!container) return;

        if (friends.length === 0) {
            container.innerHTML = `<p class="text-slate-500 text-sm text-center py-4">${this.i18n.t('friends.noFriends')}</p>`;
            return;
        }

        container.innerHTML = friends.map(friend => `
            <div class="flex items-center justify-between gap-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
                <div class="flex items-center space-x-3 min-w-0 flex-1">
                    ${this.renderAvatarHtml(friend, 'w-8 h-8 sm:w-10 sm:h-10', 'text-xs sm:text-sm')}
                    <p class="text-slate-100 text-sm sm:text-base truncate">${friend.display_name}</p>
                </div>
                <button class="btn btn-secondary text-xs px-2.5 py-1.5 hover:bg-red-600 transition-colors remove-friend-btn flex-shrink-0" data-friend-id="${friend.id}" title="${this.i18n.t('friends.removeFriend')}">✕</button>
            </div>
        `).join('');

        this.attachRemoveFriendListeners(container);
    }

    private renderPendingRequests(requests: any[]): void {
        const container = document.getElementById('friend-requests-container');
        if (!container) return;

        if (requests.length === 0) {
            container.innerHTML = `<p class="text-slate-500 text-xs text-center py-2">${this.i18n.t('friends.noRequests')}</p>`;
            return;
        }

        container.innerHTML = requests.map(req => `
            <div class="flex items-center justify-between gap-2 p-2.5 sm:p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors" data-request-id="${req.id}">
                <div class="flex items-center space-x-2 min-w-0 flex-1">
                    ${this.renderAvatarHtml(req.from, 'w-8 h-8', 'text-xs')}
                    <span class="text-slate-200 text-sm truncate">${req.from.display_name}</span>
                </div>
                <div class="flex space-x-1.5 flex-shrink-0">
                    <button class="btn text-xs px-2.5 py-1.5 hover:bg-emerald-600 transition-colors accept-request-btn" data-request-id="${req.id}" title="${this.i18n.t('friends.accept')}">✓</button>
                    <button class="btn btn-secondary text-xs px-2.5 py-1.5 hover:bg-red-600 transition-colors reject-request-btn" data-request-id="${req.id}" title="${this.i18n.t('friends.reject')}">✗</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.accept-request-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const requestId = (e.currentTarget as HTMLElement).dataset.requestId;
                if (!requestId) return;
                try {
                    await Api.post(`/api/friends/requests/${requestId}/accept`, {});
                    this.loadFriendsData();
                } catch (err) {
                    console.error('Accept request error:', err);
                }
            });
        });

        container.querySelectorAll('.reject-request-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const requestId = (e.currentTarget as HTMLElement).dataset.requestId;
                if (!requestId) return;
                try {
                    await Api.post(`/api/friends/requests/${requestId}/reject`, {});
                    this.loadFriendsData();
                } catch (err) {
                    console.error('Reject request error:', err);
                }
            });
        });
    }

    private renderSentRequests(requests: any[]): void {
        const container = document.getElementById('sent-requests-container');
        if (!container) return;

        if (requests.length === 0) {
            container.innerHTML = `<p class="text-slate-500 text-xs text-center py-2">${this.i18n.t('friends.noSentRequests')}</p>`;
            return;
        }

        container.innerHTML = requests.map(req => `
            <div class="flex items-center justify-between gap-2 p-2.5 sm:p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors" data-request-id="${req.id}">
                <div class="flex items-center space-x-2 min-w-0 flex-1">
                    ${this.renderAvatarHtml(req.to, 'w-8 h-8', 'text-xs')}
                    <div class="min-w-0 flex-1">
                        <span class="text-slate-200 text-sm truncate block">${req.to.display_name}</span>
                        <span class="text-slate-500 text-xs">${this.i18n.t('friends.pending')}</span>
                    </div>
                </div>
                <button class="btn btn-secondary text-xs px-2.5 py-1.5 hover:bg-red-600 transition-colors cancel-request-btn flex-shrink-0" data-request-id="${req.id}" title="${this.i18n.t('friends.cancelRequest')}">✕</button>
            </div>
        `).join('');

        container.querySelectorAll('.cancel-request-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const requestId = (e.currentTarget as HTMLElement).dataset.requestId;
                if (!requestId) return;
                try {
                    await Api.delete(`/api/friends/requests/${requestId}`);
                    this.loadFriendsData();
                } catch (err) {
                    console.error('Cancel request error:', err);
                }
            });
        });
    }

    private attachRemoveFriendListeners(container: HTMLElement): void {
        container.querySelectorAll('.remove-friend-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const friendId = (e.currentTarget as HTMLElement).dataset.friendId;
                if (!friendId) return;
                if (!confirm(this.i18n.t('friends.confirmRemove'))) return;
                try {
                    await Api.delete(`/api/friends/${friendId}`);
                    this.loadFriendsData();
                } catch (err) {
                    console.error('Remove friend error:', err);
                }
            });
        });
    }

    private setupFriendSearch(): void {
        const input = document.getElementById('friend-search-input') as HTMLInputElement;
        const dropdown = document.getElementById('search-results-dropdown');
        const searchIcon = document.getElementById('search-icon');
        const searchSpinner = document.getElementById('search-spinner');
        const searchError = document.getElementById('search-error');
        if (!input || !dropdown) return;

        document.addEventListener('click', (e) => {
            if (!(e.target as HTMLElement).closest('#search-wrapper')) {
                dropdown.classList.add('hidden');
            }
        });

        input.addEventListener('input', () => {
            const query = input.value.trim();

            if (this.friendSearchTimeout) {
                clearTimeout(this.friendSearchTimeout);
            }

            if (searchError) searchError.classList.add('hidden');

            if (query.length < 2) {
                dropdown.classList.add('hidden');
                return;
            }

            this.friendSearchTimeout = setTimeout(async () => {
                try {
                    if (searchIcon) searchIcon.classList.add('hidden');
                    if (searchSpinner) searchSpinner.classList.remove('hidden');

                    const res = await Api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
                    const users: any[] = res?.data?.users || [];

                    if (searchIcon) searchIcon.classList.remove('hidden');
                    if (searchSpinner) searchSpinner.classList.add('hidden');

                    if (users.length === 0) {
                        dropdown.innerHTML = `<p class="text-slate-500 text-sm p-4 text-center">${this.i18n.t('friends.noResults')}</p>`;
                        dropdown.classList.remove('hidden');
                        return;
                    }

                    dropdown.innerHTML = users.map(user => `
                        <div class="flex items-center justify-between gap-2 p-3 hover:bg-slate-700/50 cursor-pointer transition-colors search-result-item" data-user-id="${user.id}">
                            <div class="flex items-center space-x-3 min-w-0 flex-1">
                                ${this.renderAvatarHtml(user, 'w-8 h-8', 'text-xs')}
                                <p class="text-slate-100 text-sm truncate">${user.display_name}</p>
                            </div>
                            <button class="btn text-xs px-3 py-1.5 whitespace-nowrap send-request-btn" data-user-id="${user.id}">
                                + ${this.i18n.t('friends.addFriend')}
                            </button>
                        </div>
                    `).join('');

                    dropdown.classList.remove('hidden');

                    dropdown.querySelectorAll('.send-request-btn').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            const userId = parseInt((e.currentTarget as HTMLElement).dataset.userId || '0');
                            if (!userId) return;
                            const button = e.currentTarget as HTMLButtonElement;
                            button.disabled = true;
                            button.textContent = '...';
                            try {
                                const result = await Api.post('/api/friends/requests', { userId });
                                if (result?.success) {
                                    button.textContent = '✓ ' + this.i18n.t('friends.requestSent');
                                    button.classList.remove('btn');
                                    button.classList.add('text-emerald-400');
                                    const sentRes = await Api.get('/api/friends/requests/sent');
                                    const sentRequests = sentRes?.data?.requests || [];
                                    this.updateElementById('sent-requests-count', sentRequests.length.toString());
                                    this.renderSentRequests(sentRequests);
                                } else {
                                    const msg = result?.message || this.i18n.t('friends.requestError');
                                    button.textContent = msg;
                                    button.classList.add('text-red-400');
                                    setTimeout(() => {
                                        button.textContent = '+ ' + this.i18n.t('friends.addFriend');
                                        button.classList.remove('text-red-400');
                                        button.classList.add('btn');
                                        button.disabled = false;
                                    }, 2000);
                                }
                            } catch (err) {
                                console.error('Send request error:', err);
                                button.textContent = this.i18n.t('friends.requestError');
                                button.classList.add('text-red-400');
                                button.disabled = false;
                            }
                        });
                    });

                } catch (err) {
                    console.error('Search error:', err);
                    if (searchIcon) searchIcon.classList.remove('hidden');
                    if (searchSpinner) searchSpinner.classList.add('hidden');
                    if (searchError) {
                        searchError.textContent = this.i18n.t('friends.searchError');
                        searchError.classList.remove('hidden');
                    }
                }
            }, 400);
        });
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

            let pendingUserId: number | null = null;
            let pendingEmail: string = '';
            let pendingPassword: string = '';

            const showTwoFactorStep = () => {
                document.getElementById('login-form')?.classList.add('hidden');
                document.getElementById('twofa-step')?.classList.remove('hidden');
                (document.getElementById('twofa-login-code') as HTMLInputElement)?.focus();
            };

            const showLoginForm = () => {
                document.getElementById('twofa-step')?.classList.add('hidden');
                document.getElementById('login-form')?.classList.remove('hidden');
                (document.getElementById('twofa-login-code') as HTMLInputElement).value = '';
                pendingUserId = null;
            };

            const completeLogin = async (res: any) => {
                localStorage.setItem('accessToken', res.data.tokens.accessToken);
                localStorage.setItem('refreshToken', res.data.tokens.refreshToken);
                localStorage.setItem('expiresAt', res.data.tokens.expiresAt);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                await Api.setAuthToken(res.data.tokens.accessToken);
                alert(this.i18n.t('alert.loginSuccess'));
                this.router.navigate('/home');
            };

            const form = document.getElementById('login-form') as HTMLFormElement | null;
            if (!form) return;
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                pendingEmail = (document.getElementById('email') as HTMLInputElement).value;
                pendingPassword = (document.getElementById('password') as HTMLInputElement).value;
                try {
                    const res = await Api.post('/api/auth/login', { email: pendingEmail, password: pendingPassword });

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

            document.getElementById('twofa-login-verify-btn')?.addEventListener('click', async () => {
                if (!pendingUserId) return;
                const code = (document.getElementById('twofa-login-code') as HTMLInputElement)?.value.trim();
                if (code.length !== 6) { alert('Please enter the 6-digit code.'); return; }

                const res = await Api.post('/api/auth/login', {
                    email: pendingEmail,
                    password: pendingPassword,
                    twoFactorCode: code,
                });

                if (res?.data?.tokens) {
                    await completeLogin(res);
                } else {
                    alert(res?.message || 'Invalid or expired code.');
                }
            });

            document.getElementById('twofa-login-resend-btn')?.addEventListener('click', async () => {
                if (!pendingUserId) return;
                await Api.post('/api/auth/login', { email: pendingEmail, password: pendingPassword });
                alert('Code has been resent.');
            });

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

                if (!validatePassword(password)) {
                    if (passwordError) {
                        passwordError.textContent = this.i18n.t('register.pwError');
                        passwordError.classList.remove('hidden');
                    }
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

            const codeInputs = document.querySelectorAll('.code-input') as NodeListOf<HTMLInputElement>;
            codeInputs.forEach((input, idx) => {
                input.addEventListener('input', () => {
                    const val = input.value.replace(/[^0-9]/g, '');
                    input.value = val;
                    if (val && idx < codeInputs.length - 1) {
                        codeInputs[idx + 1].focus();
                    }
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

            changeEmailBtn?.addEventListener('click', () => {
                if (resendInterval) clearInterval(resendInterval);
                goToStep(1);
            });

            codeForm?.addEventListener('submit', (e) => {
                e.preventDefault();
                verificationCode = Array.from(codeInputs).map(i => i.value).join('');
                if (verificationCode.length !== 6) return;
                goToStep(3);
                const newPwInput = document.getElementById('new-password') as HTMLInputElement;
                newPwInput?.focus();
            });

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
