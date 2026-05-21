<div class="min-h-screen flex items-center justify-center px-4 py-12">
        <div class="max-w-md w-full">
            <div class="text-center mb-8">
                <h1 class="text-3xl font-bold text-white mb-2">ft_transcendence</h1>
                <p class="text-slate-400" data-i18n="forgot.subtitle">Şifrenizi sıfırlayın</p>
            </div>

            <div class="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
                <div class="text-center mb-8">
                    <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                    </div>
                    
                    <h2 class="text-2xl font-bold text-white mb-2" data-i18n="forgot.title">Şifrenizi mi unuttunuz?</h2>
                    <p class="text-slate-400 text-sm" data-i18n="forgot.description">
                        E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
                    </p>
                </div>
                
                <form id="forgotPasswordForm" class="space-y-6">
                    <div>
                        <label for="email" class="block text-sm font-medium text-slate-300 mb-2" data-i18n="forgot.emailLabel">
                            E-posta Adresi
                        </label>
                        <div class="relative">
                            <input 
                                type="email" 
                                id="email" 
                                name="email"
                                class="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                placeholder="user@example.com"
                                required
                                data-i18n-placeholder="forgot.emailPlaceholder"
                            >
                            <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a3 3 0 11-6 0 3 3 0 016 0zM21 16.5c-.8.8-2.07.8-2.87 0L16 14.5v-2c0-1.1-.9-2-2-2s-2 .9-2 2v2l-2.13 2c-.8.8-2.07.8-2.87 0-.8-.8-.8-2.07 0-2.87l2.13-2.13c.39-.39.39-1.02 0-1.41l-2.13-2.13c-.8-.8-.8-2.07 0-2.87.8-.8 2.07-.8 2.87 0l2.13 2.13c.39.39 1.02.39 1.41 0l2.13-2.13c.8-.8 2.07-.8 2.87 0z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <span id="submitButtonText" data-i18n="forgot.submit">Sıfırlama Bağlantısı Gönder</span>
                        <div id="submitSpinner" class="hidden inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                    </button>
                </form>

                <div id="successMessage" class="hidden text-center">
                    <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    
                    <h3 class="text-xl font-bold text-white mb-2" data-i18n="forgot.emailSent">E-posta Gönderildi!</h3>
                    <p class="text-slate-400 text-sm mb-4">
                        <span id="userEmail"></span> <span data-i18n="forgot.emailSentDesc">adresine şifre sıfırlama bağlantısı gönderdik.
                        E-postanızı kontrol edin ve bağlantıya tıklayarak şifrenizi sıfırlayın.</span>
                    </p>
                    <button 
                        type="button" 
                        id="resendButton"
                        class="text-purple-400 hover:text-purple-300 font-medium transition-colors text-sm underline"
                    >
                        E-postayı tekrar gönder
                    </button>
                </div>
                <div class="mt-8 text-center">
                    <a href="/login" data-route class="flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        <span data-i18n="forgot.backToLogin">Giriş sayfasına dön</span>
                    </a>
                </div>
            </div>
            <div id="messageContainer" class="mt-4 hidden">
                <div id="messageContent" class="p-4 rounded-xl backdrop-blur-md border text-center">
                    <p id="messageText"></p>
                </div>
            </div>
            <div class="mt-8 text-center">
                <div class="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                    <h3 class="text-lg font-semibold text-white mb-3" data-i18n="forgot.helpTitle">Yardıma mı ihtiyacınız var?</h3>
                    <div class="space-y-3 text-sm text-slate-300">
                        <div class="flex items-start space-x-3">
                            <div class="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                            <p class="text-left" data-i18n="forgot.helpSpam">E-posta gelmiyorsa spam/gereksiz klasörünüzü kontrol edin</p>
                        </div>
                        <div class="flex items-start space-x-3">
                            <div class="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                            <p class="text-left" data-i18n="forgot.helpExpiry">Sıfırlama bağlantısı 15 dakika geçerlidir</p>
                        </div>
                        <div class="flex items-start space-x-3">
                            <div class="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                            <p class="text-left" data-i18n="forgot.helpSupport">Hala sorun yaşıyorsanız destek ekibiyle iletişime geçin</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('forgotPasswordForm');
            const submitButton = form.querySelector('button[type="submit"]');
            const submitButtonText = document.getElementById('submitButtonText');
            const submitSpinner = document.getElementById('submitSpinner');
            const successMessage = document.getElementById('successMessage');
            const userEmail = document.getElementById('userEmail');
            const resendButton = document.getElementById('resendButton');
            const emailInput = document.getElementById('email');

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const email = emailInput.value.trim();
                
                if (!email) {
                    showMessage('Lütfen e-posta adresinizi girin.', 'error');
                    return;
                }
                
                if (!isValidEmail(email)) {
                    showMessage('Lütfen geçerli bir e-posta adresi girin.', 'error');
                    return;
                }
                
                setLoadingState(true);
                
                setTimeout(() => {
                    setLoadingState(false);
                    
                    form.style.display = 'none';
                    successMessage.classList.remove('hidden');
                    userEmail.textContent = email;
                    
                    showMessage('Şifre sıfırlama e-postası başarıyla gönderildi!', 'success');
                }, 2000);
            });
        
            resendButton.addEventListener('click', function() {
                const email = emailInput.value.trim();
                
                setLoadingState(true);
                
                setTimeout(() => {
                    setLoadingState(false);
                    showMessage('E-posta tekrar gönderildi!', 'success');
                }, 1500);
            });
            
            function setLoadingState(isLoading) {
                if (isLoading) {
                    submitButton.disabled = true;
                    submitButtonText.textContent = 'Gönderiliyor...';
                    submitSpinner.classList.remove('hidden');
                    resendButton.disabled = true;
                } else {
                    submitButton.disabled = false;
                    submitButtonText.textContent = 'Sıfırlama Bağlantısı Gönder';
                    submitSpinner.classList.add('hidden');
                    resendButton.disabled = false;
                }
            }
            
            function isValidEmail(email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            }
            
            function showMessage(message, type) {
                const messageContainer = document.getElementById('messageContainer');
                const messageContent = document.getElementById('messageContent');
                const messageText = document.getElementById('messageText');
                
                if (messageContainer && messageContent && messageText) {
                    messageText.textContent = message;
                    
                    messageContent.className = 'p-4 rounded-xl backdrop-blur-md border text-center';
                    
                    if (type === 'error') {
                        messageContent.classList.add('bg-red-500/20', 'border-red-500/30', 'text-red-300');
                    } else if (type === 'success') {
                        messageContent.classList.add('bg-green-500/20', 'border-green-500/30', 'text-green-300');
                    } else if (type === 'info') {
                        messageContent.classList.add('bg-blue-500/20', 'border-blue-500/30', 'text-blue-300');
                    }
                    
                    messageContainer.classList.remove('hidden');
                    
                    setTimeout(() => {
                        messageContainer.classList.add('hidden');
                    }, 5000);
                }
            }
            
            emailInput.focus();
        });
    </script>
