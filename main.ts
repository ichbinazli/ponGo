<div class="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
    <div class="text-center">
        <div class="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
        </div>
        
        <h2 class="text-2xl font-bold text-red-400 mb-2" data-i18n="error.occurred">Bir Hata Oluştu!</h2>
        <p class="text-slate-400 mb-6 max-w-md" id="error-message" data-i18n="error.defaultMessage">
            Sayfa yüklenirken beklenmeyen bir hata meydana geldi. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
                onclick="window.location.reload()"
                class="btn bg-red-600 hover:bg-red-700 text-white px-6 py-3"
                data-i18n="error.reload"
            >
                Sayfayı Yenile
            </button>
            <a 
                href="/" 
                data-route 
                class="btn btn-secondary px-6 py-3"
                data-i18n="error.backToHome"
            >
                Ana Sayfaya Dön
            </a>
        </div>
    </div>
    <div class="mt-8 max-w-2xl mx-auto">
        <button 
            onclick="toggleErrorDetails()"
            class="text-slate-500 hover:text-slate-400 text-sm transition-colors"
            id="toggle-error-details"
            data-i18n="error.showDetails"
        >
            Hata Detaylarını Göster
        </button>
        
        <div class="hidden mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700" id="error-details">
            <h4 class="text-sm font-semibold text-slate-300 mb-2" data-i18n="error.detailsTitle">Hata Detayları:</h4>
            <pre class="text-xs text-slate-400 whitespace-pre-wrap" id="error-stack" data-i18n="error.noDetails">Hata detayları mevcut değil</pre>
        </div>
    </div>
</div>

<script>
function toggleErrorDetails() {
    const detailsEl = document.getElementById('error-details');
    const toggleBtn = document.getElementById('toggle-error-details');
    
    if (detailsEl && toggleBtn) {
        if (detailsEl.classList.contains('hidden')) {
            detailsEl.classList.remove('hidden');
            toggleBtn.setAttribute('data-i18n', 'error.hideDetails');
            toggleBtn.textContent = toggleBtn.getAttribute('data-i18n-resolved') || 'Hata Detaylarını Gizle';
            if (window.I18n) window.I18n.getInstance().applyTranslations();
        } else {
            detailsEl.classList.add('hidden');
            toggleBtn.setAttribute('data-i18n', 'error.showDetails');
            toggleBtn.textContent = toggleBtn.getAttribute('data-i18n-resolved') || 'Hata Detaylarını Göster';
            if (window.I18n) window.I18n.getInstance().applyTranslations();
        }
    }
}

function setErrorDetails(message, stack) {
    const errorMessageEl = document.getElementById('error-message');
    const errorStackEl = document.getElementById('error-stack');
    
    if (errorMessageEl && message) {
        errorMessageEl.textContent = message;
    }
    
    if (errorStackEl && stack) {
        errorStackEl.textContent = stack;
    }
}

window.setErrorDetails = setErrorDetails;
</script>
