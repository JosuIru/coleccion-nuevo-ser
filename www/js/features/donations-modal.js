// ============================================================================
// DONATIONS MODAL - Sistema de Donaciones/Apoyo
// ============================================================================

class DonationsModal {
  constructor() {
    this.i18n = window.i18n || new I18n();
    this.isOpen = false;
  }

  open() {
    this.isOpen = true;
    this.render();
    this.attachEventListeners();
  }

  close() {
    this.isOpen = false;
    // 🔧 FIX #32: Cleanup escape key handler to prevent memory leaks
    if (this.handleEscape) {
      document.removeEventListener('keydown', this.handleEscape);
      this.handleEscape = null;
    }
    const modal = document.getElementById('donations-modal');
    if (modal) modal.remove();
  }

  copyToClipboard(text, buttonId) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showCopiedFeedback(buttonId);
      }).catch(() => {
        this.fallbackCopy(text, buttonId);
      });
    } else {
      this.fallbackCopy(text, buttonId);
    }
  }

  fallbackCopy(text, buttonId) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      this.showCopiedFeedback(buttonId);
    } catch (err) {
      logger.error('Error copying:', err);
    }

    document.body.removeChild(textArea);
  }

  showCopiedFeedback(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
      const originalText = button.textContent;
      button.textContent = '✓ ' + (this.i18n.currentLang === 'es' ? 'Copiado!' : 'Copied!');
      button.classList.add('bg-green-600');

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('bg-green-600');
      }, 2000);
    }
  }

  share(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent('Colección Nuevo Ser - Exploraciones Humano-IA');
    const text = encodeURIComponent('Una biblioteca de co-creaciones humano-IA explorando la transformación personal y colectiva');

    const urls = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${title}%20${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${title}`,
      email: `mailto:?subject=${title}&body=${text}%0A%0A${url}`
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  }

  render() {
    // Remover modal anterior si existe
    const existing = document.getElementById('donations-modal');
    if (existing) existing.remove();

    const html = `
      <div id="donations-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] p-4">
        <div class="bg-gray-900 rounded-xl max-w-sm sm:max-w-md md:max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-amber-500/30">
          <!-- Header -->
          <div class="p-4 sm:p-6 border-b border-gray-800">
            <div class="flex items-center justify-between">
              <h2 class="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
                ☕ ${this.i18n.t('donate.title')}
              </h2>
              <button id="close-donations" class="text-3xl hover:text-red-400 transition" aria-label="Cerrar donaciones">
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">

            <!-- Intro -->
            <div class="text-center space-y-3">
              <p class="text-lg opacity-90">
                ${this.i18n.t('donate.intro')}
              </p>
              <p class="text-sm opacity-70">
                ${this.i18n.t('donate.helpText')}
              </p>
            </div>

            <!-- Donation Options -->
            <div class="space-y-3">

              <!-- Ko-fi -->
              <a href="https://ko-fi.com/codigodespierto" target="_blank"
                 class="block p-4 bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 rounded-lg transition transform hover:scale-105 text-white">
                <div class="flex items-center gap-4">
                  <div class="text-4xl">☕</div>
                  <div class="flex-1">
                    <div class="font-bold text-lg text-white">Ko-fi</div>
                    <div class="text-sm text-white/90">${this.i18n.t('donate.coffee')}</div>
                  </div>
                  <div class="text-2xl text-white">${Icons.chevronRight(24)}</div>
                </div>
              </a>

              <!-- PayPal -->
              <a href="https://www.paypal.com/paypalme/codigodespierto" target="_blank"
                 class="block p-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition transform hover:scale-105">
                <div class="flex items-center gap-4">
                  <div class="text-4xl">💳</div>
                  <div class="flex-1">
                    <div class="font-bold text-lg">PayPal</div>
                    <div class="text-sm opacity-90">${this.i18n.t('donate.direct')}</div>
                  </div>
                  <div class="text-2xl">${Icons.chevronRight(24)}</div>
                </div>
              </a>

              <!-- Bitcoin Native SegWit -->
              <div class="p-4 bg-gradient-to-r from-orange-700 to-yellow-700 rounded-lg text-white">
                <div class="flex items-center gap-4 mb-3">
                  <div class="text-4xl">₿</div>
                  <div class="flex-1">
                    <div class="font-bold text-lg text-white">Bitcoin (Native SegWit)</div>
                    <div class="text-xs text-white/90 font-mono break-all">bc1qjnva46wy92ldhsv4w0j26jmu8c5wm5cxvgdfd7</div>
                  </div>
                </div>
                <button id="copy-btc-bc1q" onclick="window.donationsModal.copyToClipboard('bc1qjnva46wy92ldhsv4w0j26jmu8c5wm5cxvgdfd7', 'copy-btc-bc1q')"
                        class="w-full px-4 py-2 bg-black/30 hover:bg-black/50 rounded transition text-sm text-white">
                  📋 ${this.i18n.currentLang === 'es' ? 'Copiar dirección' : 'Copy address'}
                </button>
              </div>

              <!-- Bitcoin Taproot -->
              <div class="p-4 bg-gradient-to-r from-yellow-700 to-amber-700 rounded-lg text-white">
                <div class="flex items-center gap-4 mb-3">
                  <div class="text-4xl">₿</div>
                  <div class="flex-1">
                    <div class="font-bold text-lg text-white">Bitcoin (Taproot)</div>
                    <div class="text-xs text-white/90 font-mono break-all">bc1p29l9vjelerljlwhg6dhr0uldldus4zgn8vjaecer0spj7273d7rss4gnyk</div>
                  </div>
                </div>
                <button id="copy-btc-bc1p" onclick="window.donationsModal.copyToClipboard('bc1p29l9vjelerljlwhg6dhr0uldldus4zgn8vjaecer0spj7273d7rss4gnyk', 'copy-btc-bc1p')"
                        class="w-full px-4 py-2 bg-black/30 hover:bg-black/50 rounded transition text-sm text-white">
                  📋 ${this.i18n.currentLang === 'es' ? 'Copiar dirección' : 'Copy address'}
                </button>
              </div>

            </div>

            <!-- Share on Social Networks -->
            <div class="p-4 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg">
              <h3 class="font-bold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                📢 ${this.i18n.currentLang === 'es' ? 'Compartir en redes' : 'Share on social media'}
              </h3>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button onclick="window.donationsModal.share('twitter')"
                        class="flex items-center justify-center gap-2 px-3 py-2 bg-sky-600 hover:bg-sky-700 rounded transition text-sm">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                  Twitter
                </button>
                <button onclick="window.donationsModal.share('facebook')"
                        class="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded transition text-sm">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </button>
                <button onclick="window.donationsModal.share('whatsapp')"
                        class="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded transition text-sm">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  WhatsApp
                </button>
                <button onclick="window.donationsModal.share('telegram')"
                        class="flex items-center justify-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition text-sm">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  Telegram
                </button>
                <button onclick="window.donationsModal.share('linkedin')"
                        class="flex items-center justify-center gap-2 px-3 py-2 bg-blue-700 hover:bg-blue-800 rounded transition text-sm">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </button>
                <button onclick="window.donationsModal.share('email')"
                        class="flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition text-sm">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  Email
                </button>
              </div>
            </div>

            <!-- Creative Commons License -->
            <div class="p-4 bg-gradient-to-r from-green-900/20 to-teal-900/20 border border-green-700/30 rounded-lg">
              <div class="flex items-start gap-4">
                <div class="text-4xl flex-shrink-0">${Icons.book(32)}</div>
                <div class="flex-1 space-y-2">
                  <h3 class="font-bold flex items-center gap-2">
                    ${this.i18n.currentLang === 'es' ? 'Licencia Creative Commons' : 'Creative Commons License'}
                  </h3>
                  <p class="text-sm opacity-90">
                    ${this.i18n.currentLang === 'es'
                      ? 'Esta obra está bajo una licencia Creative Commons Atribución-NoComercial-CompartirIgual 4.0 Internacional (CC BY-NC-SA 4.0).'
                      : 'This work is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0).'}
                  </p>
                  <div class="flex flex-wrap gap-2 text-xs">
                    <span class="px-2 py-1 bg-green-600/30 rounded flex items-center gap-1">${Icons.check(12)} ${this.i18n.currentLang === 'es' ? 'Compartir' : 'Share'}</span>
                    <span class="px-2 py-1 bg-green-600/30 rounded flex items-center gap-1">${Icons.check(12)} ${this.i18n.currentLang === 'es' ? 'Adaptar' : 'Adapt'}</span>
                    <span class="px-2 py-1 bg-amber-600/30 rounded flex items-center gap-1">${Icons.alertTriangle(12)} ${this.i18n.currentLang === 'es' ? 'No comercial' : 'Non-commercial'}</span>
                    <span class="px-2 py-1 bg-amber-600/30 rounded flex items-center gap-1">${Icons.alertTriangle(12)} ${this.i18n.currentLang === 'es' ? 'Compartir igual' : 'Share alike'}</span>
                  </div>
                  <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank"
                     class="inline-flex items-center gap-1 mt-2 text-teal-400 hover:text-teal-300 text-sm underline">
                    ${this.i18n.currentLang === 'es' ? 'Ver licencia completa' : 'View full license'} ${Icons.chevronRight(14)}
                  </a>
                </div>
              </div>
            </div>

            <!-- Other Ways to Help -->
            <div class="p-4 bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg">
              <h3 class="font-bold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                🌟 ${this.i18n.currentLang === 'es' ? 'Otras formas de ayudar' : 'Other ways to help'}
              </h3>
              <ul class="space-y-2 text-sm opacity-80 text-gray-900 dark:text-white">
                <li>⭐ ${this.i18n.currentLang === 'es' ? 'Dale una estrella en GitHub' : 'Star on GitHub'}</li>
                <li>🐛 ${this.i18n.currentLang === 'es' ? 'Reporta bugs o sugiere mejoras' : 'Report bugs or suggest improvements'}</li>
                <li>📢 ${this.i18n.currentLang === 'es' ? 'Comparte el proyecto con amigos' : 'Share the project with friends'}</li>
                <li>✍️ ${this.i18n.currentLang === 'es' ? 'Contribuye con código o documentación' : 'Contribute code or documentation'}</li>
                <li>💬 ${this.i18n.currentLang === 'es' ? 'Deja un comentario positivo' : 'Leave a positive review'}</li>
              </ul>
            </div>

            <!-- Thank You -->
            <div class="text-center p-4 bg-gradient-to-r from-cyan-200/30 to-purple-200/30 dark:from-cyan-900/20 dark:to-purple-900/20 border border-cyan-400/30 dark:border-cyan-700/30 rounded-lg">
              <p class="text-lg font-bold mb-2 text-gray-900 dark:text-white">🙏 ${this.i18n.t('donate.thanks')}</p>
              <p class="text-sm opacity-80 text-gray-900 dark:text-white">
                ${this.i18n.t('donate.thanksText')}
              </p>
            </div>

          </div>

          <!-- Footer -->
          <div class="p-4 sm:p-6 border-t border-gray-300 dark:border-gray-800 flex justify-center">
            <button id="close-donations-btn" class="px-6 sm:px-8 py-2 sm:py-3 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition text-gray-900 dark:text-white">
              ${this.i18n.t('btn.close')}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  attachEventListeners() {
    // Close buttons
    document.getElementById('close-donations')?.addEventListener('click', () => this.close());
    document.getElementById('close-donations-btn')?.addEventListener('click', () => this.close());

    // Close on backdrop click
    document.getElementById('donations-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'donations-modal') this.close();
    });

    // ESC to close
    document.addEventListener('keydown', this.handleEscape = (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  }
}

// Exportar para uso global
window.DonationsModal = DonationsModal;
