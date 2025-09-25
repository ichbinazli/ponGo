"use strict";
// src/main.ts - Düzeltilmiş Transcendance SPA
class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = '/';
        // Tarayıcı geri/ileri butonları
        window.addEventListener('popstate', () => {
            this.handleRoute(window.location.pathname);
        });
    }
    addRoute(path, handler) {
        this.routes.set(path, handler);
    }
    navigateTo(path) {
        window.history.pushState({}, '', path);
        this.handleRoute(path);
    }
    handleRoute(path) {
        this.currentRoute = path;
        const handler = this.routes.get(path) || this.routes.get('/404');
        if (handler)
            handler();
    }
    start() {
        this.handleRoute(window.location.pathname);
    }
}
class TranscendanceApp {
    constructor() {
        this.router = new Router();
        const container = document.getElementById('app') || document.getElementById('output');
        if (!container)
            throw new Error('#app veya #output bulunamadı');
        this.appContainer = container;
        this.setupRoutes();
        this.setupNavigation();
    }
    setupRoutes() {
        this.router.addRoute('/', () => this.renderPage('Ana Sayfa', 'home.html', 'home'));
        this.router.addRoute('/#game', () => this.renderPage('Oyun', 'game.html', 'game'));
        this.router.addRoute('/#profile', () => this.renderPage('Profil', 'profile.html', 'profile'));
        this.router.addRoute('/#settings', () => this.renderPage('Ayarlar', 'settings.html', 'settings'));
        this.router.addRoute('/#leaderboard', () => this.renderPage('Skor Tablosu', 'leaderboard.html', 'leaderboard'));
        this.router.addRoute('/#friends', () => this.renderPage('Arkadaşlar', 'friends.html', 'friends'));
        this.router.addRoute('/#chat', () => this.renderPage('Sohbet', 'chat.html', 'chat'));
        this.router.addRoute('/#login', () => this.renderPage('Giriş', 'login.html', 'login'));
        this.router.addRoute('/#404', () => this.render404());
    }
    setupNavigation() {
        const pageMap = {
            "Ana Sayfa": "/",
            "Profil": "/#profile",
            "Oyun": "/#game",
            "Sohbet": "/#chat",
            "Liderlik Tablosu": "/#leaderboard",
            "Arkadaşlar": "/#friends",
            "Ayarlar": "/#settings",
            "Çıkış": "/#login"
        };
        document.querySelectorAll(".nav-item").forEach(item => {
            item.addEventListener('click', () => {
                const tooltip = item.getAttribute('data-tooltip');
                if (tooltip && pageMap[tooltip]) {
                    this.router.navigateTo(pageMap[tooltip]);
                }
            });
        });
    }
    async renderPage(title, htmlFile, cssFile) {
        document.title = `Transcendance - ${title}`;
        this.appContainer.innerHTML = '<div class="loading">Yükleniyor...</div>';
        try {
            const response = await fetch(`/html/${htmlFile}`);
            if (!response.ok)
                throw new Error('Sayfa bulunamadı: ' + htmlFile);
            const html = await response.text();
            console.log(`Sayfa yüklendi: ${htmlFile}`);
            // HTML içeriği
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const mainElement = doc.querySelector('main');
            this.appContainer.innerHTML = mainElement ? mainElement.innerHTML : html;
            // CSS ekle
            document.querySelectorAll('link[data-page-style]').forEach(el => el.remove());
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `/css/${cssFile}.css`;
            link.setAttribute('data-page-style', 'true');
            document.head.appendChild(link);
            // Sayfa özel scriptleri
            this.executePageScripts(htmlFile);
        }
        catch (err) {
            console.error(err);
            this.appContainer.innerHTML = '<div class="error">Sayfa yüklenemedi.</div>';
        }
    }
    async executePageScripts(htmlFile) {
        const page = htmlFile.replace('.html', '');
        // Önce var olan sayfa script'lerini temizle
        const existingScripts = document.querySelectorAll('script[data-page-script]');
        existingScripts.forEach(script => script.remove());
        try {
            // Script tag'i ile modülü yükle
            const script = document.createElement('script');
            script.type = 'module';
            script.setAttribute('data-page-script', page);
            // Inline olarak modülü import et ve init'i çağır
            script.textContent = `
      import { init } from '/dist/pages/${page}.js';
      if (typeof init === 'function') {
        init();
      } else {
        console.warn('${page} modülünde init fonksiyonu bulunamadı');
      }
    `;
            script.onerror = () => {
                console.warn(`${page} modülü yüklenemedi`);
            };
            document.head.appendChild(script);
            console.log(`${page} modülü yüklendi`);
        }
        catch (err) {
            console.warn(`Sayfa modülü yüklenirken hata: ${page}`, err);
        }
    }
    render404() {
        this.appContainer.innerHTML = `
      <div class="error-section">
        <h3>404 - Sayfa Bulunamadı</h3>
        <p>Aradığınız sayfa mevcut değil.</p>
        <button onclick="window.location.href='/'" class="primary-btn">Ana Sayfaya Dön</button>
      </div>
    `;
    }
    start() {
        console.log('Transcendance SPA başlatılıyor...');
        this.router.start();
    }
}
// DOM yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    const app = new TranscendanceApp();
    app.start();
    const pageMap = {
        "Ana Sayfa": "/",
        "Profil": "/#profile",
        "Oyun": "/#game",
        "Sohbet": "/#chat",
        "Liderlik Tablosu": "/#leaderboard",
        "Arkadaşlar": "/#friends",
        "Ayarlar": "/#settings",
        "Çıkış": "/#login"
    };
    const url = window.location.href;
    console.log("Current URL:", url);
    Object.keys(pageMap).forEach(key => {
        console.log(`Checking for ${key} in URL...`);
        console.log(pageMap[key]);
        if ("/" + url.split('/').slice(-1) == pageMap[key])
            app.router.navigateTo(pageMap[key]);
    });
});
