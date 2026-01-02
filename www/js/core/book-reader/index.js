// ============================================================================
// BOOK READER - Lector de Capítulos (Coordinador Principal)
// ============================================================================
// v2.9.279: Arquitectura modular
//
// Módulos:
//   - BookReaderUtils      - Timer tracking, dependency injection
//   - BookReaderSidebar    - Sidebar y navegación lateral
//   - BookReaderHeader     - Header y dropdowns
//   - BookReaderContent    - Contenido del capítulo
//   - BookReaderNavigation - Navegación entre capítulos
//   - BookReaderEvents     - Event listeners
//   - BookReaderMobile     - Menú móvil, bottom nav

class BookReader {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;

    // Estado
    this.sidebarOpen = window.innerWidth >= 768;
    this.currentChapter = null;
    this._eventListenersAttached = false;

    // i18n
    this.i18n = null;

    // EventManager para gestionar listeners
    this.eventManager = new EventManager(false);
    this.eventManager.setComponentName('BookReader');

    // Event handlers cleanup
    this._eventHandlers = new Map();

    // Inicializar módulos
    this.utils = new (window.BookReaderUtils || BookReaderUtils)(this);
    this.sidebar = new (window.BookReaderSidebar || BookReaderSidebar)(this);
    this.header = new (window.BookReaderHeader || BookReaderHeader)(this);
    this.content = new (window.BookReaderContent || BookReaderContent)(this);
    this.navigation = new (window.BookReaderNavigation || BookReaderNavigation)(this);
    this.events = new (window.BookReaderEvents || BookReaderEvents)(this);
    this.mobile = new (window.BookReaderMobile || BookReaderMobile)(this);

    // Inicializar dependencias
    this.initDependencies();
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  initDependencies() {
    const i18nDep = this.getDependency('i18n');
    this.i18n = i18nDep || new I18n();
  }

  // ==========================================================================
  // DEPENDENCY INJECTION (delegado a utils)
  // ==========================================================================

  getDependency(name) {
    return this.utils.getDependency(name);
  }

  getDependencies(names) {
    return this.utils.getDependencies(names);
  }

  showToast(type, message) {
    this.utils.showToast(type, message);
  }

  captureError(error, context) {
    this.utils.captureError(error, context);
  }

  // ==========================================================================
  // TIMER TRACKING (delegado a utils)
  // ==========================================================================

  _setTimeout(callback, delay) {
    return this.utils.setTimeout(callback, delay);
  }

  _setInterval(callback, delay) {
    return this.utils.setInterval(callback, delay);
  }

  _addEventListener(target, event, handler, options) {
    return this.utils.addEventListener(target, event, handler, options);
  }

  // ==========================================================================
  // PLATFORM DETECTION (delegado a utils)
  // ==========================================================================

  isCapacitor() {
    return this.utils.isCapacitor();
  }

  // ==========================================================================
  // RENDERIZADO PRINCIPAL
  // ==========================================================================

  show(chapter) {
    this.currentChapter = chapter;

    const container = document.getElementById('book-reader-view');
    if (container) {
      container.classList.remove('hidden');
    }

    this.render();

    this._eventListenersAttached = false;
    this.events.resetFlags(); // Reset events module flag too
    this.events.attachEventListeners();

    const mainNav = document.getElementById('main-nav');
    if (mainNav) {
      mainNav.classList.add('hidden');
    }

    this.navigation.applyFontSize();
  }

  hide() {
    const container = document.getElementById('book-reader-view');
    if (container) {
      container.classList.add('hidden');
    }

    this.cleanup();
  }

  render() {
    try {
      const container = document.getElementById('book-reader-view');
      if (!container) return;

      if (this._eventListenersAttached) {
        this.eventManager.cleanup();
      }

      this._eventListenersAttached = false;

      let html = `
        <div class="book-reader-container flex h-screen overflow-x-hidden">
          <!-- Sidebar -->
          ${this.sidebar.renderSidebar()}

          <!-- Main Content -->
          <div class="main-content flex-1 flex flex-col overflow-x-hidden">
            <!-- Header -->
            ${this.header.render()}

            <!-- Chapter Content -->
            <div class="chapter-content flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
              ${this.content.renderChapterContent()}
            </div>

            <!-- Footer Navigation -->
            <div class="block">
              ${this.content.renderFooterNav()}
            </div>
          </div>
        </div>
      `;

      html += this.mobile.renderMobileMenu();
      html += this.mobile.renderExplorationHubButton();

      container.innerHTML = html;

      const Icons = this.getDependency('Icons');
      if (Icons) {
        Icons.init();
      }

      const contextualHints = this.getDependency('contextualHints');
      if (contextualHints) {
        contextualHints.onPageVisit('reader');
      }

    } catch (error) {
      console.error('[BookReader] Error en render:', error);
      this.captureError(error, {
        context: 'render',
        filename: 'book-reader/index.js'
      });

      const container = document.getElementById('book-reader-view');
      if (container) {
        container.innerHTML = `
          <div class="flex items-center justify-center h-screen bg-gray-100 dark:bg-slate-900 text-gray-900 dark:text-white p-8">
            <div class="text-center max-w-md">
              <div class="text-6xl mb-4">⚠️</div>
              <h2 class="text-2xl font-bold mb-4">Error al cargar el lector</h2>
              <p class="text-gray-600 dark:text-slate-400 mb-6">Ha ocurrido un error al renderizar el contenido.</p>
              <button
                onclick="window.location.reload()"
                class="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
              >
                Recargar Aplicación
              </button>
            </div>
          </div>
        `;
      }
    }
  }

  // ==========================================================================
  // SIDEBAR (delegado)
  // ==========================================================================

  toggleSidebar() {
    this.sidebar.toggleSidebar();
  }

  updateSidebar() {
    this.sidebar.updateSidebar();
  }

  renderSidebar() {
    return this.sidebar.renderSidebar();
  }

  renderSidebarProgress() {
    return this.sidebar.renderSidebarProgress();
  }

  renderChapterItem(chapter) {
    return this.sidebar.renderChapterItem(chapter);
  }

  attachChapterListeners() {
    this.sidebar.attachChapterListeners();
  }

  // ==========================================================================
  // HEADER (delegado)
  // ==========================================================================

  renderHeader() {
    return this.header.render();
  }

  // ==========================================================================
  // CONTENT (delegado)
  // ==========================================================================

  renderChapterContent() {
    return this.content.renderChapterContent();
  }

  renderFooterNav() {
    return this.content.renderFooterNav();
  }

  renderActionCards() {
    return this.content.renderActionCards();
  }

  renderMarkAsReadButton() {
    return this.content.renderMarkAsReadButton();
  }

  renderContextualPracticeBanner() {
    return this.content.renderContextualPracticeBanner();
  }

  renderPremiumEditionButton() {
    return this.content.renderPremiumEditionButton();
  }

  isLastChapter() {
    return this.content.isLastChapter();
  }

  // ==========================================================================
  // NAVIGATION (delegado)
  // ==========================================================================

  navigateToChapter(chapterId, skipAudioStop = false) {
    this.navigation.navigateToChapter(chapterId, skipAudioStop);
  }

  backToLibrary() {
    this.navigation.backToLibrary();
  }

  scrollToElement(selector) {
    this.navigation.scrollToElement(selector);
  }

  applyFontSize() {
    this.navigation.applyFontSize();
  }

  shareCurrentChapter() {
    this.navigation.shareCurrentChapter();
  }

  async navigateToExercise(bookId, exerciseId) {
    return this.navigation.navigateToExercise(bookId, exerciseId);
  }

  async navigateToPractice(bookId, practiceId) {
    return this.navigation.navigateToPractice(bookId, practiceId);
  }

  handleBookSwitch(bookId) {
    return this.navigation.handleBookSwitch(bookId);
  }

  // ==========================================================================
  // EVENTS (delegado)
  // ==========================================================================

  attachEventListeners() {
    this.events.attachEventListeners();
  }

  attachEventListener(elementId, event, handler) {
    this.events.attachEventListener(elementId, event, handler);
  }

  toggleDropdown(dropdownId) {
    this.events.toggleDropdown(dropdownId);
  }

  attachContentEventListeners() {
    this.events.attachContentEventListeners();
  }

  // ==========================================================================
  // MOBILE (delegado)
  // ==========================================================================

  renderMobileMenu() {
    return this.mobile.renderMobileMenu();
  }

  renderExplorationHubButton() {
    return this.mobile.renderExplorationHubButton();
  }

  renderReaderBottomNav() {
    return this.mobile.renderReaderBottomNav();
  }

  toggleMobileMenu() {
    this.mobile.toggleMobileMenu();
  }

  toggleAudioPlayer() {
    this.mobile.toggleAudioPlayer();
  }

  showNavOptions() {
    this.mobile.showNavOptions();
  }

  async toggleBookmark() {
    return this.mobile.toggleBookmark();
  }

  // ==========================================================================
  // THEME (delegado a utils)
  // ==========================================================================

  getThemeInfo() {
    return this.utils.getThemeInfo();
  }

  applyBookTheme() {
    this.utils.applyBookTheme();
  }

  removeBookTheme() {
    this.utils.removeBookTheme();
  }

  updateThemeIcons() {
    this.utils.updateThemeIcons();
  }

  // ==========================================================================
  // PREMIUM MODAL
  // ==========================================================================

  showPremiumDownloadModal() {
    const bookId = this.bookEngine.getCurrentBook();
    const premiumFile = `downloads/${bookId}-premium.html`;
    const bookData = this.bookEngine.getCurrentBookData();
    const bookTitle = bookData?.title || 'Libro';

    const existingModal = document.getElementById('premium-download-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'premium-download-modal';
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.style.animation = 'fadeIn 0.3s ease-out';

    modal.innerHTML = `
      <div class="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-amber-600/50 rounded-2xl max-w-2xl w-full shadow-2xl" style="animation: slideUp 0.3s ease-out">
        <div class="bg-gradient-to-r from-amber-900/40 to-amber-800/30 border-b border-amber-700/50 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📥</span>
            <h3 class="text-xl md:text-2xl font-bold text-amber-200">${this.i18n.t('premium.title')}</h3>
          </div>
          <button id="close-premium-modal" class="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg">×</button>
        </div>
        <div class="p-6 md:p-8">
          <p class="text-slate-300 mb-6">${this.i18n.t('premium.description')}</p>
          <div class="flex flex-col sm:flex-row gap-3">
            <a href="https://www.paypal.com/paypalme/codigodespierto" target="_blank" rel="noopener noreferrer"
               class="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all">
              ${this.i18n.t('premium.contributePaypal')}
            </a>
            <button id="download-free-btn" data-premium-file="${premiumFile}"
                    class="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-lg transition-all">
              ${this.i18n.t('premium.downloadFree')}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#close-premium-modal');
    this.eventManager.addEventListener(closeBtn, 'click', () => modal.remove());

    this.eventManager.addEventListener(modal, 'click', (e) => {
      if (e.target === modal) modal.remove();
    });

    const downloadFreeBtn = modal.querySelector('#download-free-btn');
    this.eventManager.addEventListener(downloadFreeBtn, 'click', () => {
      const file = downloadFreeBtn.getAttribute('data-premium-file');
      window.open(file, '_blank');
      modal.remove();
    });
  }

  // ==========================================================================
  // STRING HELPERS (delegado a utils)
  // ==========================================================================

  shortenChapterTitle(title, maxLength = 35) {
    return this.utils.shortenChapterTitle(title, maxLength);
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  cleanup() {
    if (typeof logger !== 'undefined') {
      logger.debug('[BookReader] Iniciando cleanup...');
    }

    if (this.eventManager) {
      this.eventManager.cleanup();
    }

    this.utils.clearAllTimers();

    if (this._eventHandlers) {
      this._eventHandlers.forEach((handler, key) => {
        const [elementId, event] = key.split('-');
        const element = document.getElementById(elementId);
        if (element) {
          element.removeEventListener(event, handler);
        }
      });
      this._eventHandlers.clear();
    }

    this.events.resetFlags();

    this.currentChapter = null;
    this.removeBookTheme();

    if (typeof logger !== 'undefined') {
      logger.debug('[BookReader] Cleanup completado');
    }
  }

  destroy() {
    this.cleanup();

    this.utils.destroy();
    this.sidebar.destroy();
    this.header.destroy();
    this.content.destroy();
    this.navigation.destroy();
    this.events.destroy();
    this.mobile.destroy();

    if (window.bookReader === this) {
      window.bookReader = null;
    }

    if (typeof logger !== 'undefined') {
      logger.log('[BookReader] Destruido (v2.9.279 modular)');
    }
  }
}

// Exportar globalmente
window.BookReader = BookReader;
