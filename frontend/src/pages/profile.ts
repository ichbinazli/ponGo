// Profile sayfası için JavaScript modülü

export function init() {
    console.log('Profil sayfası başlatıldı');
    
    initializeProfileFeatures();
}

function initializeProfileFeatures() {
    console.log('Profil özellikleri başlatılıyor...');
    
    // Avatar upload
    setupAvatarUpload();
    
    // Form handling
    setupProfileForm();
    
    // Stats animations
    animateStats();
}

function setupAvatarUpload() {
    const avatarInput = document.getElementById('avatar-input') as HTMLInputElement;
    const avatarContainer = document.querySelector('.avatar-container');
    const avatarImg = document.getElementById('avatar-img') as HTMLImageElement;
    const avatarPlaceholder = document.getElementById('avatar-placeholder');
    
    if (avatarInput && avatarContainer) {
        avatarInput.addEventListener('change', (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (avatarImg && avatarPlaceholder) {
                        avatarImg.src = e.target?.result as string;
                        avatarImg.classList.remove('hidden');
                        avatarPlaceholder.classList.add('hidden');
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function setupProfileForm() {
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveProfile);
    }
    
    // Form input'larına real-time validation ekle
    const inputs = document.querySelectorAll('.form-input, .form-textarea');
    inputs.forEach(input => {
        input.addEventListener('input', validateInput);
    });
}

function saveProfile() {
    console.log('Profil kaydediliyor...');
    
    const formData = {
        username: (document.getElementById('username') as HTMLInputElement)?.value,
        email: (document.getElementById('email') as HTMLInputElement)?.value,
        firstname: (document.getElementById('firstname') as HTMLInputElement)?.value,
        lastname: (document.getElementById('lastname') as HTMLInputElement)?.value,
        country: (document.getElementById('country') as HTMLInputElement)?.value,
        birthdate: (document.getElementById('birthdate') as HTMLInputElement)?.value,
        bio: (document.getElementById('bio') as HTMLTextAreaElement)?.value,
        gamemode: (document.getElementById('gamemode') as HTMLSelectElement)?.value
    };
    
    console.log('Form verileri:', formData);
    
    // Başarı mesajı göster
    showSuccessMessage('Profil başarıyla güncellendi!');
}

function validateInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    
    // Basit validation
    if (input.type === 'email' && value && !isValidEmail(value)) {
        input.style.borderColor = '#ff4444';
    } else {
        input.style.borderColor = 'rgba(0, 255, 255, 0.2)';
    }
}

function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function animateStats() {
    // XP bar animasyonu
    const xpFill = document.getElementById('xp-fill');
    if (xpFill) {
        setTimeout(() => {
            xpFill.style.width = '75%';
        }, 500);
    }
    
    // Stat kartlarını sırayla animate et
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('animate-in');
        }, index * 100);
    });
}

function showSuccessMessage(message: string) {
    // Basit success message
    const existing = document.querySelector('.success-message');
    if (existing) existing.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(45deg, #00ff88, #00cc66);
        color: #000;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}
