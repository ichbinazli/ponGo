// Home sayfası için JavaScript modülü

export function init() {
    console.log('Home sayfası başlatıldı');
    
    // Home sayfasına özel işlevsellik
    initializeHomeFeatures();
}

function initializeHomeFeatures() {
    console.log('Home özellikleri başlatılıyor...');
    
    // Hızlı eylem butonları
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', handleActionClick);
    });
    
    // Hızlı işlem butonları  
    const quickActionButtons = document.querySelectorAll('.quick-action-btn');
    quickActionButtons.forEach(button => {
        button.addEventListener('click', handleQuickAction);
    });
    
    // Mini profil etkileşimleri
    setupMiniProfile();
}

function handleActionClick(event: Event) {
    const button = event.target as HTMLButtonElement;
    const action = button.textContent?.trim();
    
    console.log('Ana eylem tıklandı:', action);
    
    switch(action) {
        case 'Hızlı Oyun':
            startQuickGame();
            break;
        case 'Turnuva Oluştur':
            createTournament();
            break;
        case 'Arkadaş Davet Et':
            inviteFriend();
            break;
        default:
            console.log('Bilinmeyen eylem:', action);
    }
}

function handleQuickAction(event: Event) {
    const button = event.target as HTMLButtonElement;
    const action = button.textContent?.trim();
    
    console.log('Hızlı işlem tıklandı:', action);
    
    if (action?.includes('Liderlik')) {
        // Liderlik tablosuna git
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'leaderboard' }));
    }
}

function setupMiniProfile() {
    const miniProfile = document.querySelector('.mini-profile');
    if (miniProfile) {
        miniProfile.addEventListener('click', () => {
            console.log('Profil sayfasına yönlendiriliyor...');
            window.dispatchEvent(new CustomEvent('navigate', { detail: 'profile' }));
        });
    }
}

function startQuickGame() {
    console.log('Hızlı oyun başlatılıyor...');
    // Oyun sayfasına yönlendir
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'game' }));
}

function createTournament() {
    console.log('Turnuva oluşturuluyor...');
    // Turnuva modalı aç veya sayfa
}

function inviteFriend() {
    console.log('Arkadaş daveti gönderiliyor...');
    // Arkadaş davet modalı
}
