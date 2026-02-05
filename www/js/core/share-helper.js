// ============================================================================
// SHARE HELPER - Sistema de Compartir para Android/Web
// ============================================================================

class ShareHelper {
  constructor() {
    this.isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
    this.hasWebShareAPI = typeof navigator.share === 'function';

    // Exponer globalmente
    window.shareHelper = this;
  }

  // ==========================================================================
  // API PRINCIPAL
  // ==========================================================================

  /**
   * Compartir texto simple
   * @param {Object} options - { title, text, url }
   */
  async share(options = {}) {
    const { title = '', text = '', url = '' } = options;

    try {
      if (this.isCapacitor) {
        return await this.shareWithCapacitor({ title, text, url });
      } else if (this.hasWebShareAPI) {
        return await this.shareWithWebAPI({ title, text, url });
      } else {
        return this.fallbackShare({ title, text, url });
      }
    } catch (error) {
      // logger.warn('Error sharing:', error);
      return this.fallbackShare({ title, text, url });
    }
  }

  /**
   * Compartir una cita del libro
   * @param {Object} options - { quote, author, bookTitle, chapterTitle }
   */
  async shareQuote(options = {}) {
    const { quote, author = '', bookTitle = '', chapterTitle = '' } = options;

    let text = `"${quote}"`;

    if (author) {
      text += `\n— ${author}`;
    }

    if (bookTitle) {
      text += `\n\nDe: ${bookTitle}`;
      if (chapterTitle) {
        text += ` - ${chapterTitle}`;
      }
    }

    text += '\n\n#ColecciónNuevoSer #LecturaConsciente';

    return this.share({
      title: bookTitle || 'Cita de Colección Nuevo Ser',
      text: text,
      url: ''
    });
  }

  /**
   * Compartir progreso de lectura
   * @param {Object} options - { bookTitle, progress, chaptersRead, totalChapters }
   */
  async shareProgress(options = {}) {
    const { bookTitle, progress, chaptersRead, totalChapters } = options;

    const text = `Estoy leyendo "${bookTitle}" en la Colección Nuevo Ser.

Mi progreso: ${progress}% completado (${chaptersRead}/${totalChapters} capítulos)

#ColecciónNuevoSer #LecturaConsciente #Transformación`;

    return this.share({
      title: `Mi progreso en ${bookTitle}`,
      text: text,
      url: ''
    });
  }

  /**
   * Compartir un logro desbloqueado
   * @param {Object} achievement - { titulo, descripcion, icon, points }
   */
  async shareAchievement(achievement) {
    const text = `${achievement.icon} ¡He desbloqueado el logro "${achievement.titulo}"!

${achievement.descripcion}
+${achievement.points} puntos

#ColecciónNuevoSer #Logros`;

    return this.share({
      title: `Logro: ${achievement.titulo}`,
      text: text,
      url: ''
    });
  }

  /**
   * Compartir una reflexión personal
   * @param {Object} options - { question, answer, bookTitle }
   */
  async shareReflection(options = {}) {
    const { question, answer, bookTitle = '' } = options;

    let text = `Mi reflexión:

"${question}"

${answer}`;

    if (bookTitle) {
      text += `\n\nInspirado por: ${bookTitle}`;
    }

    text += '\n\n#ColecciónNuevoSer #Reflexión';

    return this.share({
      title: 'Mi reflexión',
      text: text,
      url: ''
    });
  }

  // ==========================================================================
  // IMPLEMENTACIONES
  // ==========================================================================

  async shareWithCapacitor(options) {
    try {
      // Usar Capacitor Share plugin
      if (window.Capacitor?.Plugins?.Share) {
        const { Share } = window.Capacitor.Plugins;

        await Share.share({
          title: options.title,
          text: options.text,
          url: options.url,
          dialogTitle: 'Compartir'
        });

        return { success: true, method: 'capacitor' };
      } else {
        // Fallback a Web Share API
        return this.shareWithWebAPI(options);
      }
    } catch (error) {
      if (error.message === 'Share canceled') {
        return { success: false, canceled: true };
      }
      throw error;
    }
  }

  async shareWithWebAPI(options) {
    try {
      const shareData = {};

      if (options.title) shareData.title = options.title;
      if (options.text) shareData.text = options.text;
      if (options.url) shareData.url = options.url;

      await navigator.share(shareData);
      return { success: true, method: 'webshare' };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, canceled: true };
      }
      throw error;
    }
  }

  fallbackShare(options) {
    // Mostrar modal con opciones de copiar
    this.showFallbackModal(options);
    return { success: true, method: 'fallback' };
  }

  // ==========================================================================
  // MODAL FALLBACK
  // ==========================================================================

  showFallbackModal(options) {
    const existing = document.getElementById('share-fallback-modal');
    if (existing) existing.remove();

    const fullText = [options.title, options.text, options.url]
      .filter(Boolean)
      .join('\n\n');

    const modal = document.createElement('div');
    modal.id = 'share-fallback-modal';
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    modal.style.animation = 'fadeIn 0.3s ease-out';

    modal.innerHTML = `
      <div class="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700 overflow-hidden">
        <!-- Header -->
        <div class="bg-gray-800 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📤</span>
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">Compartir</h2>
          </div>
          <button id="close-share-modal" class="text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition">
            ${window.Icons?.close(20) || '✕'}
          </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          <textarea id="share-text-content" readonly
            class="w-full h-40 p-4 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-200 resize-none"
          >${this.escapeHtml(fullText)}</textarea>

          <div class="flex gap-3 mt-4">
            <button id="copy-share-text" class="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-semibold transition flex items-center justify-center gap-2 text-white">
              ${window.Icons?.create('copy', 18) || '📋'}
              Copiar texto
            </button>
          </div>

          <!-- Social Links -->
          <div class="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
            <p class="text-sm text-gray-700 dark:text-gray-400 mb-3">Compartir en:</p>
            <div class="flex gap-2 flex-wrap">
              <button id="share-twitter" class="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition text-sm">
                Twitter/X
              </button>
              <button id="share-whatsapp" class="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition text-sm">
                WhatsApp
              </button>
              <button id="share-telegram" class="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition text-sm">
                Telegram
              </button>
              <button id="share-email" class="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-700 dark:text-gray-400 rounded-lg transition text-sm">
                Email
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    const closeModal = () => {
      modal.style.animation = 'fadeOut 0.2s ease-out';
      setTimeout(() => modal.remove(), 200);
    };

    modal.querySelector('#close-share-modal').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Copy text
    modal.querySelector('#copy-share-text').addEventListener('click', () => {
      const textarea = modal.querySelector('#share-text-content');
      textarea.select();
      navigator.clipboard.writeText(fullText).then(() => {
        window.toast?.success('Texto copiado al portapapeles');
        closeModal();
      }).catch(() => {
        document.execCommand('copy');
        window.toast?.success('Texto copiado');
        closeModal();
      });
    });

    // Social share buttons
    const encodedText = encodeURIComponent(fullText);
    const encodedUrl = encodeURIComponent(options.url || '');

    modal.querySelector('#share-twitter').addEventListener('click', () => {
      window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank');
      closeModal();
    });

    modal.querySelector('#share-whatsapp').addEventListener('click', () => {
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
      closeModal();
    });

    modal.querySelector('#share-telegram').addEventListener('click', () => {
      window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, '_blank');
      closeModal();
    });

    modal.querySelector('#share-email').addEventListener('click', () => {
      const subject = encodeURIComponent(options.title || 'Compartido desde Colección Nuevo Ser');
      window.open(`mailto:?subject=${subject}&body=${encodedText}`, '_blank');
      closeModal();
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  isShareAvailable() {
    return this.isCapacitor || this.hasWebShareAPI || true; // Always true with fallback
  }

  canShareFiles() {
    if (this.isCapacitor) {
      return !!window.Capacitor?.Plugins?.Share;
    }
    return this.hasWebShareAPI && navigator.canShare && navigator.canShare({ files: [new File([''], 'test.txt')] });
  }
}

// ==========================================================================
// INICIALIZACIÓN AUTOMÁTICA
// ==========================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ShareHelper());
} else {
  new ShareHelper();
}

// Exportar
window.ShareHelper = ShareHelper;
