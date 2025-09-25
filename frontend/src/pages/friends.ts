// Friends sayfası için JavaScript modülü

export function init() {
    console.log('Arkadaşlar sayfası başlatıldı');
    
    initializeFriendsFeatures();
}

function initializeFriendsFeatures() {
    console.log('Arkadaş özellikleri başlatılıyor...');
    
    // Add friend button
    setupAddFriendButton();
    
    // Action buttons (invite, chat)
    setupActionButtons();
    
    // Leaderboard interactions
    setupLeaderboardInteractions();
}

function setupAddFriendButton() {
    const addFriendBtn = document.querySelector('.add-friend-btn');
    if (addFriendBtn) {
        addFriendBtn.addEventListener('click', () => {
            const friendName = prompt('Eklemek istediğiniz arkadaşın adını girin:');
            if (friendName && friendName.trim()) {
                addFriend(friendName.trim());
            }
        });
    }
}

function setupActionButtons() {
    const inviteButtons = document.querySelectorAll('.action-btn.invite');
    const chatButtons = document.querySelectorAll('.action-btn.chat');
    
    inviteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const friendItem = (e.target as HTMLElement).closest('.leaderboard-item');
            const friendName = friendItem?.querySelector('.friend-name')?.textContent;
            if (friendName) {
                inviteToGame(friendName);
            }
        });
    });
    
    chatButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const friendItem = (e.target as HTMLElement).closest('.leaderboard-item');
            const friendName = friendItem?.querySelector('.friend-name')?.textContent;
            if (friendName) {
                openChat(friendName);
            }
        });
    });
}

function setupLeaderboardInteractions() {
    const leaderboardItems = document.querySelectorAll('.leaderboard-item');
    
    leaderboardItems.forEach(item => {
        // Hover effects
        item.addEventListener('mouseenter', () => {
            const crown = item.querySelector('.crown-icon');
            if (crown) {
                (crown as HTMLElement).style.transform = 'scale(1.2) rotate(15deg)';
            }
        });
        
        item.addEventListener('mouseleave', () => {
            const crown = item.querySelector('.crown-icon');
            if (crown) {
                (crown as HTMLElement).style.transform = 'scale(1) rotate(0deg)';
            }
        });
        
        // Click to view profile
        item.addEventListener('click', (e) => {
            if (!(e.target as HTMLElement).closest('button')) {
                const friendName = item.querySelector('.friend-name')?.textContent;
                if (friendName) {
                    viewFriendProfile(friendName);
                }
            }
        });
    });
}

function addFriend(friendName: string) {
    console.log(`Arkadaş ekleniyor: ${friendName}`);
    
    // Simulated API call
    setTimeout(() => {
        showNotification(`${friendName} arkadaş olarak eklendi!`, 'success');
    }, 1000);
}

function inviteToGame(friendName: string) {
    console.log(`Oyun daveti gönderiliyor: ${friendName}`);
    
    // Simulated game invite
    showNotification(`${friendName} oyuna davet edildi!`, 'info');
    
    // Optionally redirect to game setup
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('navigate', { detail: 'game' }));
    }, 2000);
}

function openChat(friendName: string) {
    console.log(`Sohbet açılıyor: ${friendName}`);
    
    // Chat sayfasına yönlendir veya modal aç
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'chat' }));
}

function viewFriendProfile(friendName: string) {
    console.log(`Profil görüntüleniyor: ${friendName}`);
    
    // Friend profile modal veya sayfa
    showNotification(`${friendName} profili görüntüleniyor...`, 'info');
}

function showNotification(message: string, type: 'success' | 'info' | 'warning' | 'error') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const colors = {
        success: 'linear-gradient(45deg, #00ff88, #00cc66)',
        info: 'linear-gradient(45deg, #00bfff, #0099cc)',
        warning: 'linear-gradient(45deg, #ffaa00, #ff8800)',
        error: 'linear-gradient(45deg, #ff4444, #cc0000)'
    };
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${colors[type]};
        color: ${type === 'warning' || type === 'info' ? '#000' : '#fff'};
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
