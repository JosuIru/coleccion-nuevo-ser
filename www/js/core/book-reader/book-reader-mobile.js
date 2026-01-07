// ============================================================================
// BOOK READER MOBILE - Navegacion y UI movil
// ============================================================================
// v2.9.279: Modularizacion del BookReader
// Maneja menu movil, bottom nav, bookmarks, audio player toggle

class BookReaderMobile {
  constructor(bookReader) {
    this.bookReader = bookReader;
  }

  // ==========================================================================
  // ACCESSORS
  // ==========================================================================

  get bookEngine() {
    return this.bookReader.bookEngine;
  }

  get i18n() {
    return this.bookReader.i18n;
  }

  get currentChapter() {
    return this.bookReader.currentChapter;
  }

  // ==========================================================================
  // PLATFORM DETECTION
  // ==========================================================================

  isCapacitor() {
    return typeof window.Capacitor !== 'undefined';
  }

  // ==========================================================================
  // DEPENDENCY ACCESS
  // ==========================================================================

  /**
   * Acceso seguro a dependencias globales
   */
  getDependency(name) {
    if (window.dependencyInjector) {
      return window.dependencyInjector.getSafe(name);
    }
    return window[name] || null;
  }

  /**
   * Helper para mostrar toasts de forma segura
   */
  showToast(type, message) {
    const toast = this.getDependency('toast');
    if (toast && typeof toast[type] === 'function') {
      toast[type](message);
    } else {
      if (typeof logger !== 'undefined') {
        logger.debug(`[Toast ${type.toUpperCase()}]`, message);
      }
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Acortar titulo de capitulo para navegacion movil
   */
  shortenChapterTitle(title, maxLength = 35) {
    if (!title) return '';
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength).trim() + '...';
  }

  // ==========================================================================
  // RENDER: BOTTOM NAVIGATION
  // ==========================================================================

  renderReaderBottomNav() {
    const prevChapter = this.bookEngine.getPreviousChapter(this.currentChapter?.id);
    const nextChapter = this.bookEngine.getNextChapter(this.currentChapter?.id);

    return `
      <nav class="app-bottom-nav" id="reader-bottom-nav">
        <!-- Indice -->
        <button class="app-bottom-nav-tab" data-tab="capitulos" onclick="window.bookReader?.toggleSidebar()">
          <span class="app-bottom-nav-icon">📖</span>
          <span class="app-bottom-nav-label">Indice</span>
        </button>

        <!-- Audio -->
        <button class="app-bottom-nav-tab" data-tab="audio" onclick="window.bookReader?.toggleAudioPlayer()">
          <span class="app-bottom-nav-icon">🎧</span>
          <span class="app-bottom-nav-label">Audio</span>
        </button>

        <!-- Chat IA -->
        <button class="app-bottom-nav-tab" data-tab="chat" onclick="window.bookReader?.openAIChat()">
          <span class="app-bottom-nav-icon">💬</span>
          <span class="app-bottom-nav-label">Chat IA</span>
        </button>

        <!-- Notas -->
        <button class="app-bottom-nav-tab" data-tab="notas" onclick="window.bookReader?.openNotes()">
          <span class="app-bottom-nav-icon">📝</span>
          <span class="app-bottom-nav-label">Notas</span>
        </button>

        <!-- Navegacion con dropdown -->
        <div class="relative">
          <button class="app-bottom-nav-tab" data-tab="nav" id="bottom-nav-more-btn">
            <span class="app-bottom-nav-icon">⋯</span>
            <span class="app-bottom-nav-label">Mas</span>
          </button>

          <!-- Dropdown Menu -->
          <div id="bottom-nav-dropdown" class="hidden absolute bottom-full right-0 mb-2 w-56 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border border-gray-200 dark:border-slate-700 rounded-lg shadow-2xl z-[1000] py-1">
            ${prevChapter ? `
              <button onclick="window.bookReader?.bookEngine.navigateToChapter('${prevChapter.id}')" class="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-3 border-b border-gray-200 dark:border-slate-700/50">
                <span class="text-xl">⬅️</span>
                <div class="flex-1 min-w-0">
                  <div class="text-xs text-gray-500 dark:text-slate-400 uppercase">Anterior</div>
                  <div class="text-sm font-semibold text-gray-800 dark:text-white truncate">${this.shortenChapterTitle(prevChapter.title, 40)}</div>
                </div>
              </button>
            ` : ''}
            ${nextChapter ? `
              <button onclick="window.bookReader?.bookEngine.navigateToChapter('${nextChapter.id}')" class="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-3 border-b border-gray-200 dark:border-slate-700/50">
                <span class="text-xl">➡️</span>
                <div class="flex-1 min-w-0">
                  <div class="text-xs text-gray-500 dark:text-slate-400 uppercase">Siguiente</div>
                  <div class="text-sm font-semibold text-gray-800 dark:text-white truncate">${this.shortenChapterTitle(nextChapter.title, 40)}</div>
                </div>
              </button>
            ` : ''}
            <button onclick="window.bookReader?.toggleMobileMenu()" class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-3 border-b border-gray-200 dark:border-slate-700/50">
              <span class="text-lg">⚙️</span>
              <span class="text-sm">Opciones</span>
            </button>
            <button onclick="window.bookReader?.openProfile()" class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-3">
              <span class="text-lg">👤</span>
              <span class="text-sm">Mi Cuenta</span>
            </button>
          </div>
        </div>
      </nav>
    `;
  }

  // ==========================================================================
  // RENDER: MOBILE MENU
  // ==========================================================================

  renderMobileMenu() {
    const bookConfig = this.bookEngine.getCurrentBookConfig();
    const hasTimeline = bookConfig?.features?.timeline?.enabled;
    const hasResources = bookConfig?.features?.resources?.enabled;
    const hasManualPractico = bookConfig?.features?.manualPractico;
    const hasPracticasRadicales = bookConfig?.features?.practicasRadicales;
    const isBookmarked = this.bookEngine.isBookmarked(this.currentChapter?.id);

    // Koan solo disponible para libros especificos
    const bookId = bookConfig?.id || '';
    const koanBooks = ['codigo-despertar', 'manual-practico', 'practicas-radicales'];
    const hasKoan = koanBooks.includes(bookId);

    return `
      <div id="mobile-menu" class="hidden fixed inset-0 z-50 md:hidden">
        <!-- Backdrop (clickable to close) -->
        <div id="mobile-menu-backdrop" class="absolute inset-0 bg-black/80"></div>

        <!-- Menu Panel -->
        <div class="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col overflow-hidden">
          <!-- Fixed Header -->
          <div class="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-900">
            <h3 class="font-bold text-lg">${this.i18n.t('menu.title')}</h3>
            <button id="close-mobile-menu" class="text-3xl hover:text-red-400 transition-colors p-2 -mr-2"
                    aria-label="${this.i18n.t('menu.close')}"
                    title="${this.i18n.t('menu.close')}">
              ×
            </button>
          </div>

          <!-- Scrollable Menu Items -->
          <div class="flex-1 overflow-y-auto mobile-menu-scroll">
            <div class="p-4 pb-6 space-y-2">
            <!-- Back to Biblioteca -->
            <button id="back-to-biblioteca-mobile" class="w-full text-left p-3 hover:bg-cyan-900/30 rounded-lg transition flex items-center gap-3 text-cyan-400 border border-cyan-500/30 mb-2">
              ${Icons.library(24)}
              <span class="font-semibold">${this.i18n.t('nav.library')}</span>
            </button>

            <div class="border-t border-gray-200 dark:border-gray-700 my-3"></div>

            <!-- Notas (no esta en header movil, solo aqui) -->
            <button id="notes-btn-mobile" class="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
              ${Icons.note(24)}
              <span>${this.i18n.t('reader.notes')}</span>
            </button>

            <button id="chapter-resources-btn-mobile" class="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex items-center gap-3 text-blue-600 dark:text-blue-400">
              ${Icons.create('link', 24)}
              <span>Recursos del Capitulo</span>
            </button>

            <!-- Learning Paths Button -->
            <button id="learning-paths-btn-mobile" class="w-full text-left p-3 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition flex items-center gap-3 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-500/30">
              ${Icons.target(24)}
              <span>Learning Paths</span>
            </button>

            <div class="border-t border-gray-200 dark:border-gray-700 my-3"></div>

            <!-- Feature Buttons -->
            ${hasTimeline ? `
              <button id="timeline-btn-mobile" class="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
                ${Icons.timeline(24)}
                <span>Timeline Historico</span>
              </button>
            ` : ''}

            ${hasResources ? `
              <button id="book-resources-btn-mobile" class="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
                ${Icons.resources(24)}
                <span>Recursos del Libro</span>
              </button>
            ` : ''}

            ${hasManualPractico ? `
              <button id="manual-practico-btn-mobile" class="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
                ${Icons.manual(24)}
                <span>${this.i18n.t('reader.manualPractico')}</span>
              </button>
            ` : ''}

            ${hasPracticasRadicales ? `
              <button id="practicas-radicales-btn-mobile" class="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
                ${Icons.radical(24)}
                <span>${this.i18n.t('reader.practicasRadicales')}</span>
              </button>
            ` : ''}

            ${hasKoan ? `
            <button id="koan-btn-mobile" class="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
              ${Icons.koan(24)}
              <span>${this.i18n.t('reader.koan')}</span>
            </button>
            ` : ''}

            <div class="border-t border-gray-200 dark:border-gray-700 my-3"></div>

            ${this.isCapacitor() ? '' : `
            <button id="android-download-btn-mobile" class="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
              ${Icons.download(24)}
              <span>${this.i18n.t('btn.download')}</span>
            </button>
            `}

            <button id="donations-btn-mobile" class="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
              ${Icons.donate(24)}
              <span>${this.i18n.t('btn.support')}</span>
            </button>

            <button id="premium-edition-btn-mobile" class="w-full text-left p-3 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition flex items-center gap-3 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
              ${Icons.book(24)}
              <div>
                <span class="font-bold">${this.i18n.t('premium.title')}</span>
                <span class="text-xs text-amber-500 dark:text-amber-300/70 block">${this.i18n.t('premium.contribution')}: 15EUR (${this.i18n.t('premium.optional')})</span>
              </div>
            </button>

            <button id="language-selector-btn-mobile" class="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
              ${Icons.language(24)}
              <span>${this.i18n.t('lang.title')}</span>
            </button>

            <button id="theme-toggle-btn-mobile" class="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
              <span class="text-2xl" id="theme-icon-mobile">${window.themeHelper?.getThemeIcon() || '🌙'}</span>
              <span id="theme-label-mobile">${window.themeHelper?.getThemeLabel() || 'Tema'}</span>
            </button>

            <div class="border-t border-gray-200 dark:border-gray-700 my-3"></div>

            <button id="open-settings-modal-btn-mobile" class="w-full text-left p-3 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition flex items-center gap-3 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30 font-semibold">
              ${Icons.settings(24)}
              <span>Configuracion</span>
            </button>

            <button id="open-help-center-btn-mobile" class="w-full text-left p-3 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded-lg transition flex items-center gap-3 text-cyan-600 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-500/30 font-semibold">
              ${Icons.helpCircle(24)}
              <span>Centro de Ayuda</span>
            </button>

            <button id="share-chapter-btn-mobile" class="w-full text-left p-3 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition flex items-center gap-3 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30">
              ${Icons.create('share-2', 24)}
              <span>Compartir capitulo</span>
            </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // RENDER: EXPLORATION HUB BUTTON
  // ==========================================================================

  renderExplorationHubButton() {
    return `
      <!-- Floating ExplorationHub Button (semi-oculto) -->
      <button
        id="exploration-hub-floating-btn"
        class="fixed bottom-24 -right-8 z-40 w-14 h-14 rounded-full shadow-2xl
               bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600
               hover:from-purple-700 hover:via-pink-700 hover:to-blue-700
               transition-all duration-300 transform hover:-translate-x-10 hover:scale-110
               flex items-center justify-center text-white
               border-2 border-white/20
               md:bottom-32 md:-right-8"
        aria-label="Abrir Centro de Exploracion"
        title="Buscar, explorar temas y recursos">
        ${Icons.compass(28)}
      </button>
    `;
  }

  // ==========================================================================
  // TOGGLE METHODS
  // ==========================================================================

  /**
   * Toggle del menu movil
   */
  toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  }

  /**
   * Toggle del reproductor de audio
   */
  toggleAudioPlayer() {
    const audioReader = this.getDependency('audioReader');
    if (audioReader) {
      audioReader.toggle();
    } else {
      this.showToast('info', 'Cargando reproductor de audio...');
    }
    this.setReaderActiveTab('audio');
  }

  /**
   * Muestra opciones de navegacion (prev/next o menu movil)
   */
  showNavOptions() {
    const nextChapter = this.bookEngine.getNextChapter(this.currentChapter?.id);
    const prevChapter = this.bookEngine.getPreviousChapter(this.currentChapter?.id);

    if (nextChapter) {
      this.bookEngine.navigateToChapter(nextChapter.id);
    } else if (prevChapter) {
      this.bookEngine.navigateToChapter(prevChapter.id);
    } else {
      // Si no hay prev/next, abrir menu movil
      this.toggleMobileMenu();
    }
  }

  /**
   * Actualiza el tab activo en la navegacion inferior del lector
   */
  setReaderActiveTab(tabName) {
    document.querySelectorAll('#reader-bottom-nav .app-bottom-nav-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      }
    });
  }

  // ==========================================================================
  // BOOKMARK METHODS
  // ==========================================================================

  /**
   * Toggle del marcador del capitulo actual
   */
  async toggleBookmark() {
    if (!this.currentChapter?.id) {
      this.showToast('error', 'No hay capitulo seleccionado');
      return;
    }

    const currentBook = this.bookEngine.getCurrentBook();
    const chapterId = this.currentChapter.id;

    if (!currentBook) {
      this.showToast('error', 'No hay libro seleccionado');
      return;
    }

    const wasBookmarked = this.bookEngine.isBookmarked(chapterId);

    if (wasBookmarked) {
      this.bookEngine.removeBookmark(chapterId);
      // Eliminar de Supabase directamente
      await this.removeBookmarkFromSupabase(currentBook, chapterId);
      this.showToast('info', 'Marcador eliminado');
    } else {
      this.bookEngine.addBookmark(chapterId);
      // Anadir a Supabase directamente
      await this.addBookmarkToSupabase(currentBook, chapterId);
      this.showToast('success', 'Capitulo guardado en marcadores');
    }

    // Actualizar icono en todos los botones de bookmark (usar window.Icons global)
    const isNowBookmarked = !wasBookmarked;
    const newIcon = isNowBookmarked ? window.Icons.bookmarkFilled() : window.Icons.bookmark();
    const newLabel = isNowBookmarked ? 'Quitar marcador' : this.i18n.t('reader.bookmark');

    ['bookmark-btn', 'bookmark-btn-tablet', 'bookmark-btn-mobile'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.innerHTML = newIcon;
        btn.setAttribute('aria-label', newLabel);
        btn.setAttribute('title', newLabel);
      }
    });
  }

  /**
   * Anadir bookmark directamente a Supabase
   */
  async addBookmarkToSupabase(bookId, chapterId) {
    try {
      if (!window.supabaseAuthHelper?.isAuthenticated()) return;

      const supabase = window.supabaseAuthHelper.supabase;
      const userId = window.supabaseAuthHelper.user?.id;
      if (!supabase || !userId) return;

      const { error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: userId,
          book_id: bookId,
          chapter_id: chapterId,
          created_at: new Date().toISOString()
        });

      if (error) {
        logger.error('[Bookmark] Error anadiendo a Supabase:', error);
      }
    } catch (error) {
      logger.error('[Bookmark] Error:', error);
    }
  }

  /**
   * Eliminar bookmark de Supabase
   */
  async removeBookmarkFromSupabase(bookId, chapterId) {
    try {
      if (!window.supabaseAuthHelper?.isAuthenticated()) return;

      const supabase = window.supabaseAuthHelper.supabase;
      const userId = window.supabaseAuthHelper.user?.id;
      if (!supabase || !userId) return;

      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .eq('chapter_id', chapterId);

      if (error) {
        logger.error('[Bookmark] Error eliminando de Supabase:', error);
      }
    } catch (error) {
      logger.error('[Bookmark] Error:', error);
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    this.bookReader = null;
  }
}

// Exportar globalmente
window.BookReaderMobile = BookReaderMobile;
