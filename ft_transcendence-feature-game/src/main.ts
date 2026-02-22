import './styles.css';
import { Router } from './core/Router';
import { APIClient, LeaderboardEntry } from './api/APIClient';
import { TemplateLoader } from './utils/templateLoader';
import Api from './api/apiLibrary';
import { initGameOptions } from './game/gameOptionManager';

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
            const unauthorizedPages = ['/register', '/reset-password', '/login'];

            if (!expiresAt) {
                // Auth sayfalarında token gerekmez - gereksiz API çağrısı yapma
                if (unauthorizedPages.includes(window.location.pathname)) {
                    return;
                }
                console.log("Token bulunamadı. Oturum kontrolü yapılıyor...");
                let response = await Api.get('/api/users/me');
                console.log('Auth check response:', response);
                if (!response.success) {
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
        }, 30000); // 30 saniyede bir kontrol et (1s → 30s)

    }

    private setupTheme(): void {
        this.toggleButton = document.getElementById('theme-toggle-btn');
        this.moonIcon = document.getElementById('moon-icon');
        this.sunIcon = document.getElementById('sun-icon');

        if (!this.toggleButton || !this.moonIcon || !this.sunIcon) {
            console.error('Theme toggle elements not found');
            return;
        }

        // Apply saved theme
        this.applyTheme(this.isDarkMode);

        // Setup click event
        this.toggleButton.addEventListener('click', () => this.toggleTheme());
    }

    private loadThemePreference(): boolean {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme !== 'light'; // Default to dark mode
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
        UNEXPECTED: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
        PROFILE_LOAD: 'Profil yüklenemedi. Lütfen daha sonra tekrar deneyin.',
        LEADERBOARD_LOAD: 'Skor tablosu yüklenemedi. Lütfen daha sonra tekrar deneyin.',
        FRIENDS_LOAD: 'Arkadaş listesi yüklenemedi. Lütfen daha sonra tekrar deneyin.',
        TEMPLATE_LOAD: 'Sayfa yüklenemedi. Lütfen daha sonra tekrar deneyin.'
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

    constructor() {
        this.apiClient = new APIClient();
        this.router = new Router();
        // Initialize theme manager (removing unused variable warning)
        ThemeManager.getInstance();
        this.init();
    }

    private init(): void {
        this.preloadTemplates();
        this.setupRoutes();
        this.setupEventListeners();
        this.setupMobileMenu();
        this.router.init();
    }

    private async preloadTemplates(): Promise<void> {
        const templates = Object.values(CONSTANTS.TEMPLATES);
        // also include auth templates
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
                    <h2 class="text-xl font-bold mb-2">Hata</h2>
                    <p class="mb-4 text-slate-300">${message}</p>
                    <button class="btn w-full" onclick="location.reload()">Sayfayı Yenile</button>
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
        const positions = ['Birinci', 'İkinci', 'Üçüncü'];

        return `
            <div class="podium-card bg-gradient-to-br ${gradients[index]} p-4 sm:p-6 rounded-xl text-center transform hover:scale-105 transition-all duration-300">
                <div class="text-4xl sm:text-6xl mb-2 sm:mb-4">${medals[index]}</div>
                <h3 class="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">${positions[index]}</h3>
                <div class="text-white/90 mb-2 sm:mb-4">
                    <h4 class="text-base sm:text-lg font-semibold">${player.name}</h4>
                    <p class="text-xs sm:text-sm">${player.score.toLocaleString()} puan</p>
                    <p class="text-xs">%${player.winRate} kazanma oranı</p>
                </div>
            </div>
        `;
    }

    private showError(message: string): void {
        this.renderPage(this.createErrorMessage(message));
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
        // Lazy-load game engine after template is in the DOM so UI refs resolve
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
                                ${Math.random() > 0.6 ? '● Çevrimiçi' : Math.random() > 0.3 ? '● Uzakta' : '● Çevrimdışı'}
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
        // Elementi bulana kadar bekle
        const checkAndInit = () => {
            const addPhotoBtn = document.getElementById('edit-avatar-btn'); // ← DEĞİŞTİ
            const photoUpload = document.getElementById('avatar-upload') as HTMLInputElement; // ← DEĞİŞTİ
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
                    alert('Lütfen sadece resim dosyası seçin! (PNG, JPG, GIF, WebP)');
                    photoUpload.value = '';
                    return;
                }

                if (file.size > 5 * 1024 * 1024) {
                    alert('Dosya boyutu 5MB\'dan küçük olmalıdır!');
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

        // 1. Maç Geçmişini Doldur
        let response = await Api.get('/api/stats/recent-matches?limit=10');
        if (response.success) {
            const tableBody = document.getElementById('game-history-table');
            if (tableBody) {
                // Tabloyu her seferinde sıfırlamak istersen: tableBody.innerHTML = '';
                response.data.matches.forEach((item: any) => {
                    const isPlayer1 = item.player1_id === user.id;
                    const opponentName = isPlayer1 ? item.player2_display_name : item.player1_display_name;
                    const playerScore = isPlayer1 ? item.player1_score : item.player2_score;
                    const opponentScore = isPlayer1 ? item.player2_score : item.player1_score;

                    const result = item.winner_id === user.id ?
                        `<span class="text-green-400 font-bold">GALİBİYET</span>` :
                        `<span class="text-red-400 font-bold">MAĞLUBİYET</span>`;

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

        // 2. Profil Bilgilerini Güncelle (HTML yapısını bozmadan)
        const usernameEl = document.getElementById('profile-username');
        const avatarEl = document.getElementById('profile-avatar') as HTMLImageElement;

        if (usernameEl) {
            usernameEl.textContent = user.displayName || 'Oyuncu';
        }

        if (avatarEl && user.avatarUrl) {
            avatarEl.src = "https://localhost" + user.avatarUrl;
            // Eğer avatarUrl yoksa varsayılan Dicebear linki HTML'de kalacaktır.
        }

        // 3. İstatistik Kartlarını Güncelle
        const statsGridContainer = document.getElementById('stats-grid-container');
        if (statsGridContainer) {
            statsGridContainer.innerHTML = `
            <div class="stat-card">
                <h4 class="text-sm font-semibold text-white/70 mb-2">Toplam Puan</h4>
                <div class="text-2xl font-bold text-yellow-400">${statsData.total_points_scored}</div>
            </div>
            <div class="stat-card">
                <h4 class="text-sm font-semibold text-white/70 mb-2">Oyun Sayısı</h4>
                <div class="text-2xl font-bold text-blue-400">${statsData.total_matches}</div>
            </div>
            <div class="stat-card">
                <h4 class="text-sm font-semibold text-white/70 mb-2">Galibiyetler</h4>
                <div class="text-2xl font-bold text-green-400">${statsData.wins}</div>
            </div>
            <div class="stat-card">
                <h4 class="text-sm font-semibold text-white/70 mb-2">Mağlubiyetler</h4>
                <div class="text-2xl font-bold text-red-400">${statsData.losses}</div>
            </div>
            <div class="stat-card">
                <h4 class="text-sm font-semibold text-white/70 mb-2">Kazanma Oranı</h4>
                <div class="text-2xl font-bold text-purple-400">${statsData.win_rate}%</div>
            </div>
            <div class="stat-card">
                <h4 class="text-sm font-semibold text-white/70 mb-2">Beraberlik</h4>
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

    private async renderSettings(): Promise<void> {
        this.updateActiveNavLink(CONSTANTS.ROUTES.SETTINGS);
        await this.loadTemplate(CONSTANTS.TEMPLATES.SETTINGS);
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
            alert('Başarıyla çıkış yaptınız!');
            this.router.navigate('/login');
        }, 1000);
    }

    private async renderFriends(): Promise<void> {
        let friends = await Api.get('/api/friends'); // Just to simulate API call
        console.log(friends);
        let pending = await Api.get('/api/friends/requests/pending'); // Just to simulate API call
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
            const form = document.getElementById('login-form') as HTMLFormElement | null;
            if (!form) return;
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = (document.getElementById('email') as HTMLInputElement).value;
                const password = (document.getElementById('password') as HTMLInputElement).value;
                try {
                    const res = await Api.post('/api/auth/login', { email, password });
                    if (res && res.data && res.data.tokens) {
                        localStorage.setItem('accessToken', res.data.tokens.accessToken);
                        localStorage.setItem('refreshToken', res.data.tokens.refreshToken);
                        localStorage.setItem('expiresAt', res.data.tokens.expiresAt);
                        localStorage.setItem('user', JSON.stringify(res.data.user));
                        await Api.setAuthToken(res.data.tokens.accessToken);
                        alert('Giriş başarılı');
                        this.router.navigate('/home');
                    } else {
                        alert('Giriş başarısız');
                    }
                } catch (err) {
                    console.error('Login error', err);
                    alert('Giriş sırasında hata oluştu');
                }
            });
        }, CONSTANTS.TIMEOUTS.DOM_READY);
    }

    private async renderRegister(): Promise<void> {
        await this.loadTemplate('register', false);

        this.delayedExecution(() => {
            const form = document.getElementById('register-form') as HTMLFormElement | null;
            if (!form) return;
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                let displayName = (document.getElementById('displayName') as HTMLInputElement).value;
                let email = (document.getElementById('email') as HTMLInputElement).value;
                let password = (document.getElementById('password') as HTMLInputElement).value;
                try {
                    await Api.post('/api/auth/register', { displayName, email, password });
                    alert('Kayıt başarılı. Giriş sayfasına yönlendiriliyorsunuz.');
                    this.router.navigate('/login');
                } catch (err) {
                    console.error('Register error', err);
                    alert('Kayıt sırasında hata oluştu');
                }
            });
        }, CONSTANTS.TIMEOUTS.DOM_READY);
    }

    private async renderResetPassword(): Promise<void> {
        await this.loadTemplate('reset-password', false);

        this.delayedExecution(() => {
            const form = document.getElementById('reset-password-form') as HTMLFormElement | null;
            if (!form) return;
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = (document.getElementById('reset-email') as HTMLInputElement).value;
                try {
                    await Api.post('/api/auth/forgot-password', { email });
                    alert('Sıfırlama bağlantısı gönderildi (test).');
                    this.router.navigate('/login');
                } catch (err) {
                    console.error('Reregister error', err);
                    alert('İşlem sırasında hata oluştu');
                }
            });
        }, CONSTANTS.TIMEOUTS.DOM_READY);
    }
}

new App();