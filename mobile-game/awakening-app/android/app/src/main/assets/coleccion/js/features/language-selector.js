// ============================================================================
// LANGUAGE SELECTOR - Selector de Idioma
// ============================================================================

class LanguageSelector {
  constructor(i18n) {
    this.i18n = i18n;
  }

  // Render language selector button
  renderButton() {
    const currentLang = this.i18n.getLanguage();
    const flag = currentLang === 'es' ? '🇪🇸' : '🇬🇧';

    return `
      <button id="language-selector-btn" class="p-2 hover:bg-gray-800 rounded-lg transition flex items-center gap-1" title="Cambiar idioma / Change language">
        🌐 ${flag}
      </button>
    `;
  }

  // Open language selector modal
  open() {
    this.render();
    this.attachEventListeners();
  }

  // Close modal
  close() {
    const modal = document.getElementById('language-modal');
    if (modal) modal.remove();
  }

  // Render modal
  render() {
    const existing = document.getElementById('language-modal');
    if (existing) existing.remove();

    const currentLang = this.i18n.getLanguage();
    const languages = this.i18n.getAvailableLanguages();

    const html = `
      <div id="language-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div class="bg-gray-900 rounded-xl max-w-sm sm:max-w-md w-full border-2 border-cyan-500/30">
          <!-- Header -->
          <div class="p-4 sm:p-6 border-b border-gray-800">
            <div class="flex items-center justify-between">
              <h2 class="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
                🌐 ${this.i18n.t('lang.title')}
              </h2>
              <button id="close-language" class="text-3xl hover:text-red-400 transition" aria-label="Cerrar selector de idioma">
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="p-4 sm:p-6 space-y-3">
            ${languages.map(lang => `
              <button
                data-lang="${lang.code}"
                class="language-option w-full p-3 sm:p-4 rounded-lg border-2 transition ${
                  currentLang === lang.code
                    ? 'border-cyan-500 bg-cyan-500/20'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                }"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 sm:gap-3">
                    <span class="text-2xl sm:text-3xl">${lang.flag}</span>
                    <span class="text-base sm:text-lg font-bold">${lang.name}</span>
                  </div>
                  ${currentLang === lang.code ? `<span class="text-cyan-400">${Icons.check(18)}</span>` : ''}
                </div>
              </button>
            `).join('')}
          </div>

          <!-- Info -->
          <div class="p-4 sm:p-6 border-t border-gray-800">
            <p class="text-xs sm:text-sm opacity-70 text-center">
              <span class="block mb-1">Los contenidos de los libros permanecen en su idioma original.</span>
              <span class="block">Book contents remain in their original language.</span>
            </p>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  // Attach event listeners
  attachEventListeners() {
    // Close button
    document.getElementById('close-language')?.addEventListener('click', () => this.close());

    // Language options
    const options = document.querySelectorAll('.language-option');
    options.forEach(option => {
      option.addEventListener('click', () => {
        const lang = option.getAttribute('data-lang');
        this.changeLanguage(lang);
      });
    });

    // Close on backdrop click
    document.getElementById('language-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'language-modal') this.close();
    });

    // ESC to close
    document.addEventListener('keydown', this.handleEscape = (e) => {
      if (e.key === 'Escape') this.close();
    });
  }

  // Change language
  changeLanguage(lang) {
    const success = this.i18n.setLanguage(lang);

    if (success) {
      this.close();

      // Show toast notification
      this.showToast(
        this.i18n.t('lang.changed'),
        'success'
      );

      // Reload page to apply language
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }

  // Show toast notification
  showToast(message, type = 'info') {
    const colors = {
      'success': 'bg-green-600',
      'error': 'bg-red-600',
      'info': 'bg-blue-600'
    };

    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 right-6 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
}

// Make global
window.LanguageSelector = LanguageSelector;
