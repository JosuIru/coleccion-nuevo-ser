// ============================================================================
// BOOK READER HEADER - Renderizado del header del lector
// ============================================================================
// v2.9.279: Modularizacion del BookReader
// Maneja renderizado del header con navegacion, acciones, dropdowns desktop/tablet/mobile

class BookReaderHeader {
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

  get sidebarOpen() {
    return this.bookReader.sidebarOpen;
  }

  // ==========================================================================
  // PLATFORM DETECTION
  // ==========================================================================

  isCapacitor() {
    return typeof window.Capacitor !== 'undefined';
  }

  /**
   * 🔧 v2.9.334: Truncar texto para breadcrumb
   */
  truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  // ==========================================================================
  // RENDER PRINCIPAL
  // ==========================================================================

  render() {
    const bookData = this.bookEngine.getCurrentBookData();
    const bookConfig = this.bookEngine.getCurrentBookConfig();
    const isBookmarked = this.bookEngine.isBookmarked(this.currentChapter?.id);
    const bookId = this.bookEngine.getCurrentBook();

    // Features especificas por libro
    const hasTimeline = bookConfig?.features?.timeline?.enabled;
    const hasResources = bookConfig?.features?.resources?.enabled;
    const hasManualPractico = bookConfig?.features?.manualPractico;
    const hasPracticasRadicales = bookConfig?.features?.practicasRadicales;
    // Koan solo disponible para ciertos libros
    const koanBooks = ['codigo-despertar', 'manual-practico', 'practicas-radicales'];
    const hasKoan = koanBooks.includes(bookId);

    return `
      <div class="header border-b border-gray-200 dark:border-gray-700 p-3 lg:p-4">
        <!-- Primera fila: Navegacion + Acciones -->
        <div class="flex items-center justify-between gap-2">
          <!-- Left: Toggle Sidebar -->
          <div class="flex items-start sm:items-center gap-1 flex-shrink-0">
            <button id="toggle-sidebar"
                    class="p-2 sm:p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex items-center justify-center sm:justify-start gap-1.5"
                    aria-label="${this.sidebarOpen ? 'Contraer barra lateral' : 'Expandir barra lateral'}"
                    title="${this.sidebarOpen ? 'Contraer barra lateral' : 'Expandir barra lateral'}">
              ${this.sidebarOpen ? Icons.chevronLeft(18) : Icons.chevronRight(18)}
              <span id="toggle-sidebar-text" class="text-xs sm:text-sm">${this.sidebarOpen ? 'Ocultar' : 'Índice'}</span>
            </button>
          </div>

          <!-- Right: Actions -->
          <div class="flex items-center gap-1 flex-shrink-0">
            ${this.renderMobileActions(isBookmarked)}
            ${this.renderTabletActions(isBookmarked, hasTimeline, hasResources, hasManualPractico, hasPracticasRadicales, hasKoan)}
            ${this.renderDesktopActions(isBookmarked, hasTimeline, hasResources, hasManualPractico, hasPracticasRadicales, hasKoan)}
          </div>
        </div>

        <!-- 🔧 v2.9.334: Breadcrumb navegable -->
        <nav class="mt-2 border-t border-gray-300 dark:border-gray-700/50 pt-2 px-2">
          <div class="flex items-center justify-center gap-1 text-xs sm:text-sm flex-wrap">
            <!-- Libros (clickeable → vuelve a biblioteca) -->
            <button
              id="breadcrumb-library-btn"
              class="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 hover:underline font-semibold transition-colors px-1.5 py-0.5 rounded hover:bg-cyan-500/10"
              title="Volver a la biblioteca"
              aria-label="Volver a la biblioteca">
              <span>📚</span>
              <span class="hidden xs:inline">Libros</span>
            </button>

            <span class="text-gray-500 mx-0.5">/</span>

            <!-- Título del libro (no clickeable, solo info) -->
            <span class="text-gray-600 dark:text-gray-400 truncate max-w-[120px] sm:max-w-[200px]" title="${bookData.title}">
              ${this.truncateText(bookData.title, 25)}
            </span>

            <span class="text-gray-500 mx-0.5">/</span>

            <!-- Capítulo actual (destacado) -->
            <span class="text-gray-900 dark:text-gray-100 font-semibold truncate max-w-[100px] sm:max-w-[180px]" title="${this.currentChapter?.title || ''}">
              ${this.truncateText(this.currentChapter?.title || '', 20)}
            </span>
          </div>
        </nav>

        <!-- Barra de progreso de audio (oculta hasta activar audio) -->
        <div id="audio-progress-bar-container" class="hidden mt-2">
          <div class="h-1 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
            <div id="audio-progress-bar" class="h-full bg-cyan-500 transition-all duration-300" style="width: 0%"></div>
          </div>
          <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
            <span id="audio-current-time">0:00</span>
            <span id="audio-paragraph-info">--</span>
            <span id="audio-total-time">0:00</span>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // MOBILE ACTIONS (< md, or always in Capacitor)
  // ==========================================================================

  renderMobileActions(isBookmarked) {
    return `
      <!-- Mobile/Android view: Solo acciones no duplicadas en bottom nav -->
      <!-- En Capacitor siempre usar vista movil, en web solo < md (768px) -->
      <div class="${this.isCapacitor() ? 'flex lg:hidden' : 'flex md:hidden'} items-center gap-1">
        <button id="bookmark-btn-mobile"
                class="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                aria-label="${isBookmarked ? 'Quitar marcador' : this.i18n.t('reader.bookmark')}"
                title="${isBookmarked ? 'Quitar marcador' : this.i18n.t('reader.bookmark')}"
                onclick="window.bookReader?.toggleBookmark()">
          ${isBookmarked ? Icons.bookmarkFilled() : Icons.bookmark()}
        </button>
        <!-- Boton AI Chat mobile -->
        <button id="ai-chat-btn-mobile"
                class="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                aria-label="${this.i18n.t('reader.chat')}"
                title="${this.i18n.t('reader.chat')}">
          ${Icons.chat()}
        </button>
        <!-- Boton Audio mobile: cambia entre headphones/play/pause -->
        <button id="audioreader-btn-mobile"
                class="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                aria-label="${this.i18n.t('reader.audio')}"
                title="${this.i18n.t('reader.audio')}">
          <span id="audio-icon-mobile">${Icons.headphones()}</span>
        </button>
        <!-- Boton Desplegar reproductor (oculto hasta activar audio) -->
        <button id="audio-expand-btn-mobile"
                class="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition hidden"
                aria-label="Ver reproductor"
                title="Ver reproductor">
          ${Icons.chevronDown ? Icons.chevronDown(20) : '▼'}
        </button>
        <!-- Boton Apoyar mobile -->
        <button id="support-btn-mobile"
                class="p-3 hover:bg-pink-900/50 rounded-lg transition text-pink-400 support-heartbeat"
                aria-label="${this.i18n.t('btn.support')}"
                title="${this.i18n.t('btn.support')}">
          <span class="support-heart">❤️</span>
        </button>
        <!-- More actions button -->
        <button id="mobile-menu-btn"
                class="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                aria-label="${this.i18n.t('menu.more') || 'Mas opciones'}"
                title="${this.i18n.t('menu.more') || 'Mas'}">
          ${Icons.moreVertical ? Icons.moreVertical() : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>`}
        </button>
      </div>
    `;
  }

  // ==========================================================================
  // TABLET ACTIONS (md to lg, only on web)
  // ==========================================================================

  renderTabletActions(isBookmarked, hasTimeline, hasResources, hasManualPractico, hasPracticasRadicales, hasKoan) {
    return `
      <!-- Tablet view (md a lg): Main actions + More dropdown -->
      <!-- Solo en web, no en Capacitor -->
      <div class="${this.isCapacitor() ? 'hidden' : 'hidden md:flex lg:hidden'} items-center gap-1">
        <button id="bookmark-btn-tablet"
                class="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                aria-label="${isBookmarked ? 'Quitar marcador' : this.i18n.t('reader.bookmark')}"
                title="${isBookmarked ? 'Quitar marcador' : this.i18n.t('reader.bookmark')}"
                onclick="window.bookReader?.toggleBookmark()">
          ${isBookmarked ? Icons.bookmarkFilled() : Icons.bookmark()}
        </button>
        <button id="ai-chat-btn-tablet"
                class="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                aria-label="${this.i18n.t('reader.chat')}"
                title="${this.i18n.t('reader.chat')}">
          ${Icons.chat()}
        </button>
        <button id="audioreader-btn-tablet"
                class="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                aria-label="${this.i18n.t('reader.audio')}"
                title="${this.i18n.t('reader.audio')}">
          <span id="audio-icon-tablet">${Icons.headphones()}</span>
        </button>
        <!-- Boton Apoyar tablet - siempre visible -->
        <button id="support-btn-tablet"
                class="p-3 hover:bg-pink-900/50 rounded-lg transition text-pink-400 support-heartbeat"
                aria-label="${this.i18n.t('btn.support')}"
                title="${this.i18n.t('btn.support')}">
          <span class="support-heart">❤️</span>
        </button>
        <div class="w-px h-5 bg-gray-300 dark:bg-gray-700 mx-1"></div>
        <!-- More actions dropdown for tablet -->
        <div class="relative">
          <button id="more-actions-btn"
                  class="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                  aria-label="${this.i18n.t('menu.more') || 'Mas opciones'}"
                  title="${this.i18n.t('menu.more') || 'Mas'}">
            ${Icons.moreVertical ? Icons.moreVertical() : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>`}
          </button>
          ${this.renderTabletDropdown(hasTimeline, hasResources, hasManualPractico, hasPracticasRadicales, hasKoan)}
        </div>
      </div>
    `;
  }

  // 🔧 v2.9.379: Menú tablet reorganizado con secciones colapsables
  renderTabletDropdown(hasTimeline, hasResources, hasManualPractico, hasPracticasRadicales, hasKoan) {
    const menuBtn = 'w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition flex items-center gap-2 text-sm';
    const sectionHeader = 'flex items-center justify-between w-full px-3 py-2 text-left text-xs font-bold rounded cursor-pointer transition-colors uppercase tracking-wide';

    // Verificar si hay features del libro
    const hasBookFeatures = hasTimeline || hasResources || hasManualPractico || hasPracticasRadicales || hasKoan;

    return `
      <div id="more-actions-dropdown" class="hidden absolute right-0 top-full mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
        <div class="p-2 space-y-1">

          <!-- Acceso rápido -->
          <button id="notes-btn-dropdown" class="${menuBtn} bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
            ${Icons.note(16)} <span>Mis Notas</span>
          </button>

          <!-- 🤖 HERRAMIENTAS IA -->
          <details class="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden" open>
            <summary class="${sectionHeader} bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 text-cyan-700 dark:text-cyan-400">
              <span class="flex items-center gap-2">🤖 Herramientas IA</span>
              <span class="transform transition-transform group-open:rotate-180 text-[10px]">▼</span>
            </summary>
            <div class="p-1.5 space-y-0.5 bg-gray-50 dark:bg-gray-800/50">
              <button id="chapter-resources-btn-dropdown" class="${menuBtn} text-blue-600 dark:text-blue-400">
                ${Icons.create('link', 16)} <span>Recursos del Capítulo</span>
              </button>
              <button id="summary-btn-dropdown" class="${menuBtn} text-emerald-600 dark:text-emerald-400">
                ${Icons.create('file-text', 16)} <span>Resumen del Capítulo</span>
              </button>
              <button id="voice-notes-btn-dropdown" class="${menuBtn} text-red-600 dark:text-red-400">
                ${Icons.create('mic', 16)} <span>Notas de Voz</span>
              </button>
              <button id="concept-map-btn-dropdown" class="${menuBtn} text-cyan-600 dark:text-cyan-400">
                ${Icons.create('git-branch', 16)} <span>Mapa Conceptual</span>
              </button>
              <button id="action-plans-btn-dropdown" class="${menuBtn} text-green-600 dark:text-green-400">
                ${Icons.create('clipboard-list', 16)} <span>Planes de Acción</span>
              </button>
              <button id="smart-reader-btn-dropdown" class="${menuBtn} text-indigo-600 dark:text-indigo-400">
                ${Icons.create('book-open', 16)} <span>Smart Reader</span>
              </button>
              <button id="content-adapter-btn-dropdown" class="${menuBtn} text-violet-600 dark:text-violet-400">
                ${Icons.create('sliders', 16)} <span>Adaptar Contenido</span>
              </button>
            </div>
          </details>

          <!-- 📈 MI PROGRESO -->
          <details class="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <summary class="${sectionHeader} bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-400">
              <span class="flex items-center gap-2">📈 Mi Progreso</span>
              <span class="transform transition-transform group-open:rotate-180 text-[10px]">▼</span>
            </summary>
            <div class="p-1.5 space-y-0.5 bg-gray-50 dark:bg-gray-800/50">
              <button id="learning-paths-btn-dropdown" class="${menuBtn} text-purple-600 dark:text-purple-400">
                ${Icons.target(16)} <span>Learning Paths</span>
              </button>
              <button id="achievements-btn-dropdown" class="${menuBtn} text-amber-600 dark:text-amber-400">
                ${Icons.trophy(16)} <span>Mis Logros</span>
              </button>
              <button id="quiz-btn-dropdown" class="${menuBtn} text-orange-600 dark:text-orange-400">
                <span class="text-base">🎯</span> <span>Quiz de Autoevaluación</span>
              </button>
            </div>
          </details>

          <!-- 💬 COMUNIDAD -->
          <details class="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <summary class="${sectionHeader} bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30 text-pink-700 dark:text-pink-400">
              <span class="flex items-center gap-2">💬 Comunidad</span>
              <span class="transform transition-transform group-open:rotate-180 text-[10px]">▼</span>
            </summary>
            <div class="p-1.5 space-y-0.5 bg-gray-50 dark:bg-gray-800/50">
              <button id="chapter-comments-btn-dropdown" class="${menuBtn} text-pink-600 dark:text-pink-400">
                ${Icons.create('message-circle', 16)} <span>Comentarios del Capítulo</span>
              </button>
              <button id="reading-circles-btn-dropdown" class="${menuBtn} text-emerald-600 dark:text-emerald-400">
                ${Icons.create('users', 16)} <span>Círculos de Lectura</span>
              </button>
              <button id="leaderboards-btn-dropdown" class="${menuBtn} text-amber-600 dark:text-amber-400">
                ${Icons.create('award', 16)} <span>Clasificación</span>
              </button>
            </div>
          </details>

          <!-- 🎧 MULTIMEDIA -->
          <details class="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <summary class="${sectionHeader} bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/30 dark:to-indigo-900/30 text-violet-700 dark:text-violet-400">
              <span class="flex items-center gap-2">🎧 Multimedia</span>
              <span class="transform transition-transform group-open:rotate-180 text-[10px]">▼</span>
            </summary>
            <div class="p-1.5 space-y-0.5 bg-gray-50 dark:bg-gray-800/50">
              <button id="audioreader-btn-dropdown" class="${menuBtn} text-violet-600 dark:text-violet-400">
                ${Icons.headphones(16)} <span>Narración</span>
              </button>
              <button id="podcast-player-btn-dropdown" class="${menuBtn} text-indigo-600 dark:text-indigo-400">
                ${Icons.create('radio', 16)} <span>Modo Podcast</span>
              </button>
              <button id="micro-courses-btn-dropdown" class="${menuBtn} text-teal-600 dark:text-teal-400">
                ${Icons.create('play-circle', 16)} <span>Micro-Cursos</span>
              </button>
            </div>
          </details>

          <!-- 📖 ESTE LIBRO (condicional) -->
          ${hasBookFeatures ? `
          <details class="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <summary class="${sectionHeader} bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-400">
              <span class="flex items-center gap-2">📖 Este Libro</span>
              <span class="transform transition-transform group-open:rotate-180 text-[10px]">▼</span>
            </summary>
            <div class="p-1.5 space-y-0.5 bg-gray-50 dark:bg-gray-800/50">
              ${hasTimeline ? `<button id="timeline-btn-dropdown" class="${menuBtn}">${Icons.timeline(16)} <span>Timeline Histórico</span></button>` : ''}
              ${hasResources ? `<button id="book-resources-btn-dropdown" class="${menuBtn}">${Icons.resources(16)} <span>Recursos del Libro</span></button>` : ''}
              ${hasManualPractico ? `<button id="manual-practico-btn-dropdown" class="${menuBtn}">${Icons.manual(16)} <span>${this.i18n.t('reader.manualPractico')}</span></button>` : ''}
              ${hasPracticasRadicales ? `<button id="practicas-radicales-btn-dropdown" class="${menuBtn}">${Icons.radical(16)} <span>${this.i18n.t('reader.practicasRadicales')}</span></button>` : ''}
              ${hasKoan ? `<button id="koan-btn-dropdown" class="${menuBtn}">${Icons.koan(16)} <span>${this.i18n.t('reader.koan')}</span></button>` : ''}
            </div>
          </details>
          ` : ''}

          <!-- ⚙️ CONFIGURACIÓN -->
          <details class="group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <summary class="${sectionHeader} bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800 dark:to-slate-800 text-gray-700 dark:text-gray-300">
              <span class="flex items-center gap-2">⚙️ Configuración</span>
              <span class="transform transition-transform group-open:rotate-180 text-[10px]">▼</span>
            </summary>
            <div class="p-1.5 space-y-0.5 bg-gray-50 dark:bg-gray-800/50">
              <button id="open-settings-modal-btn-tablet" class="${menuBtn} text-blue-600 dark:text-blue-400">
                ${Icons.settings(16)} <span>Ajustes</span>
              </button>
              <button id="premium-edition-btn-dropdown" class="${menuBtn} text-amber-600 dark:text-amber-400">
                ${Icons.book(16)} <span>${this.i18n.t('premium.title')}</span>
              </button>
              <button id="donations-btn-dropdown" class="${menuBtn} text-pink-600 dark:text-pink-400">
                ${Icons.donate(16)} <span>${this.i18n.t('btn.support')}</span>
              </button>
              <button id="integrations-btn-dropdown" class="${menuBtn} text-indigo-600 dark:text-indigo-400">
                ${Icons.create('plug', 16)} <span>Integraciones</span>
              </button>
              <button id="my-account-btn-tablet" class="${menuBtn} text-cyan-600 dark:text-cyan-400">
                ${Icons.user(16)} <span>Mi Cuenta</span>
              </button>
              ${this.isCapacitor() ? '' : `<button id="android-download-btn-dropdown" class="${menuBtn}">${Icons.download(16)} <span>${this.i18n.t('btn.download')}</span></button>`}
              <button id="open-help-center-btn-tablet" class="${menuBtn} text-cyan-600 dark:text-cyan-400">
                ${Icons.helpCircle(16)} <span>Centro de Ayuda</span>
              </button>
              <button id="language-selector-btn-dropdown" class="${menuBtn}">
                ${Icons.language(16)} <span>${this.i18n.t('lang.title')}</span>
              </button>
              <button id="theme-toggle-btn-dropdown" class="${menuBtn}">
                <span id="theme-icon-dropdown">${window.themeHelper?.getThemeIcon() || '🌙'}</span>
                <span id="theme-label-dropdown">${window.themeHelper?.getThemeLabel() || 'Tema'}</span>
              </button>
              <button id="share-chapter-btn-dropdown" class="${menuBtn} text-blue-600 dark:text-blue-400">
                ${Icons.create('share-2', 16)} <span>Compartir</span>
              </button>
            </div>
          </details>

        </div>
      </div>
    `;
  }

  // ==========================================================================
  // DESKTOP ACTIONS (lg+)
  // ==========================================================================

  renderDesktopActions(isBookmarked, hasTimeline, hasResources, hasManualPractico, hasPracticasRadicales, hasKoan) {
    return `
      <!-- Desktop view (lg+): Organized in groups -->
      <div class="hidden lg:flex items-center gap-1">
        <!-- Grupo 1: Acciones principales (siempre visibles) -->
        <button id="bookmark-btn"
                class="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                aria-label="${isBookmarked ? 'Quitar marcador' : this.i18n.t('reader.bookmark')}"
                title="${isBookmarked ? 'Quitar marcador' : this.i18n.t('reader.bookmark')}"
                onclick="window.bookReader?.toggleBookmark()">
          ${isBookmarked ? Icons.bookmarkFilled() : Icons.bookmark()}
        </button>
        <button id="notes-btn"
                class="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                aria-label="${this.i18n.t('reader.notes')}"
                title="${this.i18n.t('reader.notes')}">
          ${Icons.note()}
        </button>
        <button id="ai-chat-btn"
                class="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                aria-label="${this.i18n.t('reader.chat')}"
                title="${this.i18n.t('reader.chat')}">
          ${Icons.chat()}
        </button>
        <button id="audioreader-btn"
                class="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                aria-label="${this.i18n.t('reader.audio')}"
                title="${this.i18n.t('reader.audio')}">
          <span id="audio-icon-desktop">${Icons.headphones()}</span>
        </button>

        <!-- Boton Apoyar - siempre visible con animacion de latido -->
        <button id="support-btn"
                class="p-3 hover:bg-pink-900/50 rounded-lg transition text-pink-400 support-heartbeat"
                aria-label="${this.i18n.t('btn.support')}"
                title="${this.i18n.t('btn.support')}">
          <span class="support-heart">❤️</span>
        </button>

        <div class="w-px h-5 bg-gray-300 dark:bg-gray-700 mx-1"></div>

        <!-- Grupo 2: Herramientas (dropdown) -->
        ${this.renderToolsDropdown()}

        <!-- Grupo 3: Contenido del libro (dropdown, solo si hay features) -->
        ${this.renderBookFeaturesDropdown(hasTimeline, hasResources, hasManualPractico, hasPracticasRadicales, hasKoan)}

        <!-- Grupo 4: Configuracion y mas (dropdown) -->
        ${this.renderSettingsDropdown()}
      </div>
    `;
  }

  // 🔧 v2.9.325: Mejorar hover states con transiciones y feedback visual
  renderToolsDropdown() {
    // Clase base mejorada para botones de herramientas
    const toolBtnBase = 'w-full text-left px-4 py-2.5 flex items-center gap-3 transition-all duration-150 hover:translate-x-1 hover:bg-gray-100 dark:hover:bg-gray-700/80 active:scale-[0.98] font-medium';

    return `
      <div class="relative">
        <button id="tools-dropdown-btn"
                class="p-3 hover:bg-cyan-900/50 hover:scale-105 rounded-lg transition-all duration-200 text-cyan-400 flex items-center gap-1"
                aria-label="Herramientas"
                title="Herramientas">
          ${Icons.create('wrench', 18)}
          <svg class="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div id="tools-dropdown" class="hidden absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 py-2 backdrop-blur-sm">
          <div class="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 mb-1">🛠️ Herramientas IA</div>
          <button id="chapter-resources-btn" class="${toolBtnBase} text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30" aria-label="Recursos del Capítulo">
            ${Icons.create('link', 18)} <span>Recursos del Capítulo</span>
          </button>
          <button id="summary-btn" class="${toolBtnBase} text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" aria-label="Resumen del capítulo">
            ${Icons.create('file-text', 18)} <span>Resumen del Capítulo</span>
          </button>
          <button id="voice-notes-btn" class="${toolBtnBase} text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" aria-label="Notas de voz">
            ${Icons.create('mic', 18)} <span>Notas de Voz</span>
          </button>
          <button id="concept-map-btn" class="${toolBtnBase} text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30" aria-label="Mapa Conceptual">
            ${Icons.create('git-branch', 18)} <span>Mapa Conceptual</span>
          </button>
          <button id="action-plans-btn" class="${toolBtnBase} text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30" aria-label="Planes de Acción">
            ${Icons.create('clipboard-list', 18)} <span>Planes de Acción</span>
          </button>
          <button id="achievements-btn" class="${toolBtnBase} text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30" aria-label="Mis Logros">
            ${Icons.trophy(18)} <span>Mis Logros</span>
          </button>
          <button id="learning-paths-btn-desktop" class="${toolBtnBase} text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30" aria-label="Learning Paths">
            ${Icons.target(18)} <span>Learning Paths</span>
          </button>
          <button id="smart-reader-btn" class="${toolBtnBase} text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30" aria-label="Smart Reader">
            ${Icons.create('book-open', 18)} <span>Smart Reader</span>
          </button>
          <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>
          <div class="px-4 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">💬 Comunidad</div>
          <button id="chapter-comments-btn" class="${toolBtnBase} text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/30" aria-label="Comentarios">
            ${Icons.create('message-circle', 18)} <span>Comentarios del Capítulo</span>
          </button>
          <button id="reading-circles-btn" class="${toolBtnBase} text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" aria-label="Círculos de Lectura">
            ${Icons.create('users', 18)} <span>Círculos de Lectura</span>
          </button>
          <button id="leaderboards-btn" class="${toolBtnBase} text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30" aria-label="Clasificación">
            ${Icons.create('award', 18)} <span>Clasificación</span>
          </button>
          <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>
          <div class="px-4 py-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">🚀 Más</div>
          <button id="podcast-player-btn" class="${toolBtnBase} text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30" aria-label="Podcast">
            ${Icons.create('headphones', 18)} <span>Modo Podcast</span>
          </button>
          <button id="micro-courses-btn" class="${toolBtnBase} text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30" aria-label="Micro-Cursos">
            ${Icons.create('calendar', 18)} <span>Micro-Cursos</span>
          </button>
          <button id="integrations-btn" class="${toolBtnBase} text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30" aria-label="Integraciones">
            ${Icons.create('link', 18)} <span>Integraciones</span>
          </button>
          <div class="border-t border-gray-200 dark:border-gray-700 my-2"></div>
          <button id="content-adapter-btn" class="${toolBtnBase} text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30" aria-label="Adaptar Contenido">
            ${Icons.create('sliders', 18)} <span>Adaptar Contenido</span>
          </button>
        </div>
      </div>
    `;
  }

  renderBookFeaturesDropdown(hasTimeline, hasResources, hasManualPractico, hasPracticasRadicales, hasKoan) {
    // Solo renderizar si hay features disponibles
    if (!hasTimeline && !hasResources && !hasManualPractico && !hasPracticasRadicales && !hasKoan) {
      return '';
    }

    return `
      <div class="relative">
        <button id="book-features-dropdown-btn"
                class="p-3 hover:bg-purple-900/50 rounded-lg transition text-purple-400 flex items-center gap-1"
                aria-label="Contenido del libro"
                title="Contenido">
          ${Icons.resources(18)}
          <svg class="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div id="book-features-dropdown" class="hidden absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 py-1">
          <div class="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700">Contenido del libro</div>
          <button id="quiz-btn" class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3" aria-label="Quiz de Autoevaluacion" title="Quiz de Autoevaluacion">
            <span class="text-lg">🎯</span> <span>Quiz de Autoevaluacion</span>
          </button>
          ${hasTimeline ? `<button id="timeline-btn" class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3" aria-label="Timeline Historico">${Icons.timeline(18)} <span>Timeline Historico</span></button>` : ''}
          ${hasResources ? `<button id="book-resources-btn" class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3" aria-label="Recursos del Libro">${Icons.resources(18)} <span>Recursos del Libro</span></button>` : ''}
          ${hasManualPractico ? `<button id="manual-practico-btn" class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3" aria-label="${this.i18n.t('reader.manualPractico')}">${Icons.manual(18)} <span>${this.i18n.t('reader.manualPractico')}</span></button>` : ''}
          ${hasPracticasRadicales ? `<button id="practicas-radicales-btn" class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3" aria-label="${this.i18n.t('reader.practicasRadicales')}">${Icons.radical(18)} <span>${this.i18n.t('reader.practicasRadicales')}</span></button>` : ''}
          ${hasKoan ? `<button id="koan-btn" class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3" aria-label="${this.i18n.t('reader.koan')}">${Icons.koan(18)} <span>${this.i18n.t('reader.koan')}</span></button>` : ''}
        </div>
      </div>
    `;
  }

  renderSettingsDropdown() {
    return `
      <div class="relative">
        <button id="settings-dropdown-btn"
                class="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex items-center gap-1"
                aria-label="Configuracion"
                title="Configuracion">
          ${Icons.settings(18)}
          <svg class="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div id="settings-dropdown" class="hidden absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 py-1">
          <div class="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700">Configuracion</div>
          <button id="open-settings-modal-btn" class="w-full text-left px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 flex items-center gap-3 text-blue-600 dark:text-blue-400 font-semibold" aria-label="Configuracion General">
            ${Icons.settings(18)} <span>Configuracion General</span>
          </button>
          <button id="open-help-center-btn" class="w-full text-left px-4 py-2 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 flex items-center gap-3 text-cyan-600 dark:text-cyan-400 font-semibold" aria-label="Centro de Ayuda">
            ${Icons.helpCircle(18)} <span>Centro de Ayuda</span>
          </button>
          <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          <button id="language-selector-btn" class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3" aria-label="${this.i18n.t('lang.title')}">
            ${Icons.language(18)} <span>${this.i18n.t('lang.title')}</span>
          </button>
          <button id="theme-toggle-btn" class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3" aria-label="${window.themeHelper?.getThemeLabel() || 'Tema'}">
            <span id="theme-icon">${window.themeHelper?.getThemeIcon() || '🌙'}</span> <span id="theme-label">${window.themeHelper?.getThemeLabel() || 'Tema'}</span>
          </button>
          <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          <button id="premium-edition-btn" class="w-full text-left px-4 py-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 flex items-center gap-3 text-amber-600 dark:text-amber-400" aria-label="${this.i18n.t('premium.title')}">
            ${Icons.book(18)} <span>${this.i18n.t('premium.title')}</span>
          </button>
          ${this.isCapacitor() ? '' : `
          <button id="android-download-btn" class="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3" aria-label="${this.i18n.t('btn.download')}">
            ${Icons.download(18)} <span>${this.i18n.t('btn.download')}</span>
          </button>
          `}
          <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          <button id="share-chapter-btn" class="w-full text-left px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 flex items-center gap-3 text-blue-600 dark:text-blue-400" aria-label="Compartir capitulo">
            ${Icons.create('share-2', 18)} <span>Compartir capitulo</span>
          </button>
          <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          <div class="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700">Cuenta</div>
          <button id="my-account-btn" class="w-full text-left px-4 py-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 flex items-center gap-3 text-purple-600 dark:text-purple-400 font-semibold" aria-label="Mi Cuenta">
            ${Icons.create('user', 18)} <span>Mi Cuenta</span>
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    this.bookReader = null;
  }
}

// Exportar globalmente
window.BookReaderHeader = BookReaderHeader;
