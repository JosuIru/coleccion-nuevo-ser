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

    // Koan solo disponible para libros especificos
    const bookId = bookConfig?.id || '';
    const koanBooks = ['codigo-despertar', 'manual-practico', 'practicas-radicales'];
    const hasKoan = koanBooks.includes(bookId);

    // Verificar si hay features del libro
    const hasBookFeatures = hasTimeline || hasResources || hasManualPractico || hasPracticasRadicales || hasKoan;

    // Estilos comunes
    const menuBtn = 'w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex items-center gap-3 text-sm';
    const sectionHeader = 'flex items-center justify-between w-full p-3 text-left font-semibold rounded-lg cursor-pointer transition-colors';

    return `
      <div id="mobile-menu" class="hidden fixed inset-0 z-50 md:hidden">
        <!-- Backdrop -->
        <div id="mobile-menu-backdrop" class="absolute inset-0 bg-black/80"></div>

        <!-- Menu Panel -->
        <div class="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col overflow-hidden">
          <!-- Header -->
          <div class="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 class="font-bold text-lg">${this.i18n.t('menu.title')}</h3>
            <button id="close-mobile-menu" class="text-3xl hover:text-red-400 transition-colors p-2 -mr-2">×</button>
          </div>

          <!-- Scrollable Content -->
          <div class="flex-1 overflow-y-auto mobile-menu-scroll">
            <div class="p-3 space-y-2">

              <!-- Volver a Biblioteca -->
              <button id="back-to-biblioteca-mobile" class="w-full text-left p-3 hover:bg-cyan-900/30 rounded-lg transition flex items-center gap-3 text-cyan-400 border border-cyan-500/30">
                ${Icons.library(20)}
                <span class="font-semibold">${this.i18n.t('nav.library')}</span>
              </button>

              <!-- Acceso rapido: Notas -->
              <button id="notes-btn-mobile" class="${menuBtn} bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                ${Icons.note(20)}
                <span>Mis Notas</span>
              </button>

              <!-- ═══════════════════════════════════════════════════════════ -->
              <!-- 🤖 HERRAMIENTAS IA -->
              <!-- ═══════════════════════════════════════════════════════════ -->
              <details class="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden" open>
                <summary class="${sectionHeader} bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 text-cyan-700 dark:text-cyan-400 hover:from-cyan-100 hover:to-blue-100 dark:hover:from-cyan-900/40 dark:hover:to-blue-900/40">
                  <span class="flex items-center gap-2">
                    <span>🤖</span>
                    <span>Herramientas IA</span>
                  </span>
                  <span class="transform transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div class="p-2 space-y-1 bg-gray-50 dark:bg-gray-800/50">
                  <button id="chapter-resources-btn-mobile" class="${menuBtn} text-blue-600 dark:text-blue-400">
                    ${Icons.create('link', 18)} <span>Recursos del Capítulo</span>
                  </button>
                  <button id="summary-btn-mobile" class="${menuBtn} text-emerald-600 dark:text-emerald-400">
                    ${Icons.create('file-text', 18)} <span>Resumen del Capítulo</span>
                  </button>
                  <button id="voice-notes-btn-mobile" class="${menuBtn} text-red-600 dark:text-red-400">
                    ${Icons.create('mic', 18)} <span>Notas de Voz</span>
                  </button>
                  <button id="concept-map-btn-mobile" class="${menuBtn} text-cyan-600 dark:text-cyan-400">
                    ${Icons.create('git-branch', 18)} <span>Mapa Conceptual</span>
                  </button>
                  <button id="action-plans-btn-mobile" class="${menuBtn} text-green-600 dark:text-green-400">
                    ${Icons.create('clipboard-list', 18)} <span>Planes de Acción</span>
                  </button>
                  <button id="smart-reader-btn-mobile" class="${menuBtn} text-indigo-600 dark:text-indigo-400">
                    ${Icons.create('book-open', 18)} <span>Smart Reader</span>
                  </button>
                  <button id="content-adapter-btn-mobile" class="${menuBtn} text-violet-600 dark:text-violet-400">
                    ${Icons.create('sliders', 18)} <span>Adaptar Contenido</span>
                  </button>
                </div>
              </details>

              <!-- ═══════════════════════════════════════════════════════════ -->
              <!-- 📈 MI PROGRESO -->
              <!-- ═══════════════════════════════════════════════════════════ -->
              <details class="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <summary class="${sectionHeader} bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-400 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/40 dark:hover:to-pink-900/40">
                  <span class="flex items-center gap-2">
                    <span>📈</span>
                    <span>Mi Progreso</span>
                  </span>
                  <span class="transform transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div class="p-2 space-y-1 bg-gray-50 dark:bg-gray-800/50">
                  <button id="learning-paths-btn-mobile" class="${menuBtn} text-purple-600 dark:text-purple-400">
                    ${Icons.target(18)} <span>Learning Paths</span>
                  </button>
                  <button id="achievements-btn-mobile" class="${menuBtn} text-amber-600 dark:text-amber-400">
                    ${Icons.trophy(18)} <span>Mis Logros</span>
                  </button>
                  <button id="quiz-btn-mobile" class="${menuBtn} text-orange-600 dark:text-orange-400">
                    <span class="text-lg">🎯</span> <span>Quiz de Autoevaluación</span>
                  </button>
                </div>
              </details>

              <!-- ═══════════════════════════════════════════════════════════ -->
              <!-- 💬 COMUNIDAD -->
              <!-- ═══════════════════════════════════════════════════════════ -->
              <details class="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <summary class="${sectionHeader} bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30 text-pink-700 dark:text-pink-400 hover:from-pink-100 hover:to-rose-100 dark:hover:from-pink-900/40 dark:hover:to-rose-900/40">
                  <span class="flex items-center gap-2">
                    <span>💬</span>
                    <span>Comunidad</span>
                  </span>
                  <span class="transform transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div class="p-2 space-y-1 bg-gray-50 dark:bg-gray-800/50">
                  <button id="chapter-comments-btn-mobile" class="${menuBtn} text-pink-600 dark:text-pink-400">
                    ${Icons.create('message-circle', 18)} <span>Comentarios del Capítulo</span>
                  </button>
                  <button id="reading-circles-btn-mobile" class="${menuBtn} text-emerald-600 dark:text-emerald-400">
                    ${Icons.create('users', 18)} <span>Círculos de Lectura</span>
                  </button>
                  <button id="leaderboards-btn-mobile" class="${menuBtn} text-amber-600 dark:text-amber-400">
                    ${Icons.create('award', 18)} <span>Clasificación</span>
                  </button>
                </div>
              </details>

              <!-- ═══════════════════════════════════════════════════════════ -->
              <!-- 🎧 MULTIMEDIA -->
              <!-- ═══════════════════════════════════════════════════════════ -->
              <details class="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <summary class="${sectionHeader} bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/30 dark:to-indigo-900/30 text-violet-700 dark:text-violet-400 hover:from-violet-100 hover:to-indigo-100 dark:hover:from-violet-900/40 dark:hover:to-indigo-900/40">
                  <span class="flex items-center gap-2">
                    <span>🎧</span>
                    <span>Multimedia</span>
                  </span>
                  <span class="transform transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div class="p-2 space-y-1 bg-gray-50 dark:bg-gray-800/50">
                  <button id="podcast-player-btn-mobile" class="${menuBtn} text-purple-600 dark:text-purple-400">
                    ${Icons.create('headphones', 18)} <span>Modo Podcast</span>
                  </button>
                  <button id="micro-courses-btn-mobile" class="${menuBtn} text-teal-600 dark:text-teal-400">
                    ${Icons.create('calendar', 18)} <span>Micro-Cursos</span>
                  </button>
                  <button id="integrations-btn-mobile" class="${menuBtn} text-blue-600 dark:text-blue-400">
                    ${Icons.create('link', 18)} <span>Integraciones</span>
                  </button>
                </div>
              </details>

              <!-- ═══════════════════════════════════════════════════════════ -->
              <!-- 📖 ESTE LIBRO (solo si hay features) -->
              <!-- ═══════════════════════════════════════════════════════════ -->
              ${hasBookFeatures ? `
              <details class="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <summary class="${sectionHeader} bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-400 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/40 dark:hover:to-orange-900/40">
                  <span class="flex items-center gap-2">
                    <span>📖</span>
                    <span>Este Libro</span>
                  </span>
                  <span class="transform transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div class="p-2 space-y-1 bg-gray-50 dark:bg-gray-800/50">
                  ${hasTimeline ? `<button id="timeline-btn-mobile" class="${menuBtn}">${Icons.timeline(18)} <span>Timeline Histórico</span></button>` : ''}
                  ${hasResources ? `<button id="book-resources-btn-mobile" class="${menuBtn}">${Icons.resources(18)} <span>Recursos del Libro</span></button>` : ''}
                  ${hasManualPractico ? `<button id="manual-practico-btn-mobile" class="${menuBtn}">${Icons.manual(18)} <span>${this.i18n.t('reader.manualPractico')}</span></button>` : ''}
                  ${hasPracticasRadicales ? `<button id="practicas-radicales-btn-mobile" class="${menuBtn}">${Icons.radical(18)} <span>${this.i18n.t('reader.practicasRadicales')}</span></button>` : ''}
                  ${hasKoan ? `<button id="koan-btn-mobile" class="${menuBtn}">${Icons.koan(18)} <span>${this.i18n.t('reader.koan')}</span></button>` : ''}
                </div>
              </details>
              ` : ''}

              <!-- ═══════════════════════════════════════════════════════════ -->
              <!-- ⚙️ CONFIGURACIÓN -->
              <!-- ═══════════════════════════════════════════════════════════ -->
              <details class="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <summary class="${sectionHeader} bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 text-gray-700 dark:text-gray-300 hover:from-gray-100 hover:to-slate-100 dark:hover:from-gray-700 dark:hover:to-slate-700">
                  <span class="flex items-center gap-2">
                    <span>⚙️</span>
                    <span>Configuración</span>
                  </span>
                  <span class="transform transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div class="p-2 space-y-1 bg-gray-50 dark:bg-gray-800/50">
                  <button id="open-settings-modal-btn-mobile" class="${menuBtn} text-blue-600 dark:text-blue-400 font-medium">
                    ${Icons.settings(18)} <span>Configuración General</span>
                  </button>
                  <button id="open-help-center-btn-mobile" class="${menuBtn} text-cyan-600 dark:text-cyan-400">
                    ${Icons.helpCircle(18)} <span>Centro de Ayuda</span>
                  </button>
                  <button id="language-selector-btn-mobile" class="${menuBtn}">
                    ${Icons.language(18)} <span>${this.i18n.t('lang.title')}</span>
                  </button>
                  <button id="theme-toggle-btn-mobile" class="${menuBtn}">
                    <span id="theme-icon-mobile">${window.themeHelper?.getThemeIcon() || '🌙'}</span>
                    <span id="theme-label-mobile">${window.themeHelper?.getThemeLabel() || 'Tema'}</span>
                  </button>
                  <button id="my-account-btn-mobile" class="${menuBtn} text-purple-600 dark:text-purple-400">
                    ${Icons.create('user', 18)} <span>Mi Cuenta</span>
                  </button>
                  <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  <button id="premium-edition-btn-mobile" class="${menuBtn} text-amber-600 dark:text-amber-400">
                    ${Icons.book(18)}
                    <div>
                      <span class="font-medium">${this.i18n.t('premium.title')}</span>
                      <span class="text-xs text-amber-500 block">15€ (${this.i18n.t('premium.optional')})</span>
                    </div>
                  </button>
                  <button id="share-chapter-btn-mobile" class="${menuBtn} text-blue-600 dark:text-blue-400">
                    ${Icons.create('share-2', 18)} <span>Compartir Capítulo</span>
                  </button>
                  <button id="donations-btn-mobile" class="${menuBtn} text-pink-600 dark:text-pink-400">
                    ${Icons.donate(18)} <span>${this.i18n.t('btn.support')}</span>
                  </button>
                  ${this.isCapacitor() ? '' : `
                  <button id="android-download-btn-mobile" class="${menuBtn} text-green-600 dark:text-green-400">
                    ${Icons.download(18)} <span>${this.i18n.t('btn.download')}</span>
                  </button>
                  `}
                </div>
              </details>

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
    // v2.9.356: Botón movido al FAB Menu - ya no se renderiza aquí
    return '';
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
  async toggleAudioPlayer() {
    // Lazy load AudioReader Suite (164KB) si no está cargado
    if (window.lazyLoader && !window.lazyLoader.isLoaded('audioreader-suite')) {
      this.showToast('info', 'Cargando reproductor de audio...');

      try {
        await window.lazyLoader.loadAudioreaderSuite();

        // Inicializar AudioReader después de cargar
        if (window.AudioReader && window.bookEngine && !window.audioReader) {
          window.audioReader = new AudioReader(window.bookEngine);
          if (typeof logger !== 'undefined') {
            logger.log('✅ AudioReader inicializado tras lazy loading');
          }
        }
      } catch (error) {
        this.showToast('error', 'Error cargando reproductor de audio');
        if (typeof logger !== 'undefined') {
          logger.error('Error lazy loading AudioReader:', error);
        }
        return;
      }
    }

    const audioReader = this.getDependency('audioReader');
    if (audioReader) {
      audioReader.toggle();
    } else {
      this.showToast('error', 'AudioReader no disponible');
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
