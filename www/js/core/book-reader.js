// ============================================================================
// BOOK READER - Lector de Capítulos
// ============================================================================
// Vista de lectura de capítulos con navegación, sidebar, etc.

class BookReader {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    // 🔧 FIX #87: Usar getDependency en lugar de window directo
    // (Note: getDependency is called after assignment, so use fallback pattern)
    this.i18n = null; // Will be set via getDependency in init
    // Sidebar cerrado por defecto en móvil, abierto en desktop
    this.sidebarOpen = window.innerWidth >= 768; // Browser API, OK to use window
    this.currentChapter = null;
    this._eventListenersAttached = false; // Flag para evitar duplicación masiva

    // 🧹 MEMORY LEAK FIX #44: EventManager para gestionar listeners
    this.eventManager = new EventManager(false); // false = sin debug logs
    this.eventManager.setComponentName('BookReader');

    // 🔧 FIX #44: Event handlers cleanup para prevenir memory leaks
    this._eventHandlers = new Map();

    // 🔧 FIX #87: Inicializar dependencias de forma segura
    this.initDependencies();
  }

  /**
   * 🔧 FIX #87: Inicializar dependencias opcionales
   */
  initDependencies() {
    // Obtener i18n de forma segura, con fallback
    const i18nDep = this.getDependency('i18n');
    this.i18n = i18nDep || new I18n();
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  isCapacitor() {
    return typeof window.Capacitor !== 'undefined';
  }

  /**
   * 🔧 FIX #87: Acceso seguro a dependencias globales
   * @param {string} name - Nombre de la dependencia
   * @returns {any|null} - Dependencia o null si no está disponible
   */
  getDependency(name) {
    if (window.dependencyInjector) {
      return window.dependencyInjector.getSafe(name);
    }
    return window[name] || null;
  }

  /**
   * 🔧 FIX #87: Acceso seguro a múltiples dependencias
   * @param {string[]} names - Array de nombres de dependencias
   * @returns {Object} - Objeto con las dependencias disponibles
   */
  getDependencies(names) {
    if (window.dependencyInjector) {
      return window.dependencyInjector.getMultipleSafe(names);
    }
    const result = {};
    names.forEach(name => {
      result[name] = window[name] || null;
    });
    return result;
  }

  /**
   * 🔧 FIX #87: Helper para mostrar toasts de forma segura
   * @param {string} type - Tipo de toast: 'info', 'success', 'error', 'warning'
   * @param {string} message - Mensaje a mostrar
   */
  showToast(type, message) {
    const toast = this.getDependency('toast');
    if (toast && typeof toast[type] === 'function') {
      toast[type](message);
    } else {
      // Fallback a console si toast no está disponible
      console.log(`[Toast ${type.toUpperCase()}]`, message);
    }
  }

  /**
   * 🔧 FIX #87: Helper para obtener tema de forma segura
   * @returns {Object} Objeto con icon, label del tema
   */
  getThemeInfo() {
    const themeHelper = this.getDependency('themeHelper');
    return {
      icon: themeHelper?.getThemeIcon?.() || '🌙',
      label: themeHelper?.getThemeLabel?.() || 'Tema'
    };
  }

  /**
   * 🔧 FIX #87: Helper para aplicar tema de libro de forma segura
   */
  applyBookTheme() {
    const themeHelper = this.getDependency('themeHelper');
    if (themeHelper) {
      themeHelper.applyBookTheme(this.bookEngine.getCurrentBookConfig());
    }
  }

  /**
   * 🔧 FIX #87: Helper para remover tema de libro de forma segura
   */
  removeBookTheme() {
    const themeHelper = this.getDependency('themeHelper');
    if (themeHelper) {
      themeHelper.removeBookTheme();
    }
  }

  /**
   * 🔧 FIX #87: Helper para capturar errores de forma segura
   */
  captureError(error, context) {
    const errorBoundary = this.getDependency('errorBoundary');
    if (errorBoundary) {
      errorBoundary.captureError(error, context);
    } else {
      console.error('[BookReader] Error:', error, context);
    }
  }

  /**
   * 🔧 FIX #44: Event handlers cleanup para prevenir memory leaks
   * Adjunta un event listener con seguimiento para limpieza posterior
   * @param {string} elementId - ID del elemento DOM
   * @param {string} event - Tipo de evento ('click', 'change', etc.)
   * @param {Function} handler - Función manejadora del evento
   */
  attachEventListener(elementId, event, handler) {
    const key = `${elementId}-${event}`;
    const oldHandler = this._eventHandlers.get(key);

    // Limpiar listener anterior si existe
    if (oldHandler) {
      const element = document.getElementById(elementId);
      if (element) {
        element.removeEventListener(event, oldHandler);
      }
    }

    // Añadir nuevo listener
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener(event, handler);
      this._eventHandlers.set(key, handler);
    }
  }

  // ==========================================================================
  // RENDERIZADO PRINCIPAL
  // ==========================================================================

  show(chapter) {
    this.currentChapter = chapter;
    this.render();
    this.attachEventListeners();

    const container = document.getElementById('book-reader-view');
    if (container) {
      container.classList.remove('hidden');
    }

    // Ocultar main-nav al abrir el lector
    const mainNav = document.getElementById('main-nav');
    if (mainNav) {
      mainNav.classList.add('hidden');
    }

    // Aplicar tamaño de fuente guardado
    this.applyFontSize();
  }

  applyFontSize() {
    const savedFontSize = localStorage.getItem('font-size');
    if (savedFontSize) {
      const chapterContent = document.querySelector('.chapter-content');
      if (chapterContent) {
        chapterContent.style.fontSize = savedFontSize + 'px';
      }
    }
  }

  hide() {
    const container = document.getElementById('book-reader-view');
    if (container) {
      container.classList.add('hidden');
    }

    // 🧹 CLEANUP: Liberar todos los event listeners (#44)
    this.cleanup();
  }

  // 🧹 MEMORY LEAK FIX #44: Método de cleanup
  // 🔧 FIX #47: Cleanup completo de recursos
  cleanup() {
    // 🔧 FIX #4: Usar logger en lugar de console.log
    logger.debug('[BookReader] Iniciando cleanup...');

    // 🔧 FIX #47: Limpiar todos los event listeners gestionados por EventManager
    if (this.eventManager) {
      this.eventManager.cleanup();
    }

    // 🔧 FIX #44: Event handlers cleanup para prevenir memory leaks
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

    // 🔧 FIX #47: Resetear todos los flags de dropdown y event listeners
    this._eventListenersAttached = false;
    this._bottomNavClickOutsideAttached = false;
    this._moreActionsClickOutsideAttached = false;
    this._desktopDropdownsClickOutsideAttached = false;

    // 🔧 FIX #47: Limpiar referencias a handlers almacenados
    this._toggleSidebarHandler = null;
    this._closeSidebarHandler = null;
    this._backToBibliotecaHandler = null;
    this._mobileMenuHandler = null;
    this._bottomNavMoreHandler = null;
    this._bottomNavClickOutsideHandler = null;
    this._audioreaderHandler = null;
    this._moreActionsToggleHandler = null;
    this._moreActionsClickOutsideHandler = null;
    this._desktopDropdownsClickOutsideHandler = null;
    this._markReadHandler = null;

    // 🔧 FIX #45: Resetear mapa de dropdown handlers a null (no solo vaciar)
    // Antes: se asignaba {} pero el código hace if (!this._dropdownHandlers)
    // lo cual falla con objeto vacío, causando que los handlers no se recreen
    this._dropdownHandlers = null;

    // 🔧 FIX #47: Limpiar referencia al capítulo actual
    this.currentChapter = null;

    // 🔧 FIX #47: Remover tema del libro al cerrar
    this.removeBookTheme();

    // 🔧 FIX #4: Usar logger en lugar de console.log
    logger.debug('[BookReader] Cleanup completado ✅');
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;

    // Solo actualizar las clases del sidebar sin re-renderizar todo
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      if (this.sidebarOpen) {
        // Abrir: ancho completo en móvil, 320px en desktop
        sidebar.className = sidebar.className.replace(/\bw-\S+/g, '');
        sidebar.classList.add('w-full', 'sm:w-80');
      } else {
        // Cerrar: w-0 en todos los breakpoints
        sidebar.className = sidebar.className.replace(/\bw-\S+/g, '');
        sidebar.classList.add('w-0', 'sm:w-0', 'md:w-0', 'lg:w-0');
      }
    }

    // Actualizar icono del botón toggle
    const toggleBtn = document.getElementById('toggle-sidebar');
    const Icons = this.getDependency('Icons'); // 🔧 FIX #87
    if (toggleBtn && Icons) {
      toggleBtn.innerHTML = this.sidebarOpen ? Icons.chevronLeft() : Icons.chevronRight();
      toggleBtn.setAttribute('aria-label', this.sidebarOpen ? 'Contraer barra lateral' : 'Expandir barra lateral');
      toggleBtn.setAttribute('title', this.sidebarOpen ? 'Contraer barra lateral' : 'Expandir barra lateral');
    }
  }

  // 🔧 FIX #46: Método unificado para toggle de dropdowns con cierre automático
  toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    const isOpen = dropdown.classList.contains('hidden');

    // Cerrar todos los dropdowns
    document.querySelectorAll('[id$="-dropdown"]').forEach(dd => {
      dd.classList.add('hidden');
    });

    if (isOpen) {
      dropdown.classList.remove('hidden');

      // Cerrar al hacer click fuera
      const closeHandler = (e) => {
        if (!e.target.closest(`#${dropdownId}`) && !e.target.closest('[data-dropdown-toggle]')) {
          dropdown.classList.add('hidden');
          document.removeEventListener('click', closeHandler);
        }
      };

      setTimeout(() => {
        document.addEventListener('click', closeHandler);
      }, 0);
    }
  }

  backToLibrary() {
    // Hide the book reader
    this.hide();

    // Show the biblioteca view
    const bibliotecaView = document.getElementById('biblioteca-view');
    if (bibliotecaView) {
      bibliotecaView.classList.remove('hidden');
    }

    // Mostrar main-nav al volver a biblioteca
    const mainNav = document.getElementById('main-nav');
    if (mainNav) {
      mainNav.classList.remove('hidden');
    }

    // Update URL hash to remove book reference
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', window.location.pathname);
    }

    // Scroll to top
    window.scrollTo(0, 0);
  }

  render() {
    try {
      const container = document.getElementById('book-reader-view');
      if (!container) return;

      // 🔧 FIX #44: Limpiar event listeners antes de resetear flag y recrear HTML
      if (this._eventListenersAttached) {
        this.eventManager.cleanup();
      }

      // ⚠️ CRÍTICO: Resetear flag porque vamos a crear elementos HTML completamente nuevos
      this._eventListenersAttached = false;

      // Detectar si es móvil para mostrar bottom nav
      const isMobile = window.innerWidth < 1024;

      let html = `
        <div class="book-reader-container flex h-screen overflow-x-hidden">
          <!-- Sidebar -->
          ${this.renderSidebar()}

          <!-- Main Content -->
          <div class="main-content flex-1 flex flex-col overflow-x-hidden">
            <!-- Header -->
            ${this.renderHeader()}

            <!-- Chapter Content -->
            <div class="chapter-content flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
              ${this.renderChapterContent()}
            </div>

            <!-- Footer Navigation (prev/next) - visible en todas las pantallas -->
            <div class="block">
              ${this.renderFooterNav()}
            </div>
          </div>
        </div>
      `;

      // Add mobile menu
      html += this.renderMobileMenu();

      // Add floating ExplorationHub button
      html += this.renderExplorationHubButton();

      // Nota: Bottom nav eliminado - redundante con header y menú móvil

      container.innerHTML = html;

      // Initialize Lucide icons
      const Icons = this.getDependency('Icons'); // 🔧 FIX #87
      if (Icons) {
        Icons.init();
      }

      // Notificar al sistema de hints contextuales
      const contextualHints = this.getDependency('contextualHints'); // 🔧 FIX #87
      if (contextualHints) {
        contextualHints.onPageVisit('reader');
      }
    } catch (error) {
      // 🔧 FIX #94: Error boundary para render completo
      console.error('[BookReader] Error en render:', error);
      const errorBoundary = this.getDependency('errorBoundary'); // 🔧 FIX #87
      if (errorBoundary) {
        errorBoundary.captureError(error, {
          context: 'render',
          filename: 'book-reader.js'
        });
      }

      // Mostrar UI de error al usuario
      const container = document.getElementById('book-reader-view');
      if (container) {
        container.innerHTML = `
          <div class="flex items-center justify-center h-screen bg-slate-900 text-white p-8">
            <div class="text-center max-w-md">
              <div class="text-6xl mb-4">⚠️</div>
              <h2 class="text-2xl font-bold mb-4">Error al cargar el lector</h2>
              <p class="text-slate-400 mb-6">Ha ocurrido un error al renderizar el contenido.</p>
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

  renderSidebar() {
    const chapters = this.bookEngine.getAllChapters();
    const bookData = this.bookEngine.getCurrentBookData();

    return `
      <!-- Backdrop oscuro en móvil cuando sidebar está abierto -->
      ${this.sidebarOpen ? '<div id="sidebar-backdrop" class="fixed inset-0 bg-black/60 z-40 sm:hidden" onclick="window.bookReader?.toggleSidebar()"></div>' : ''}

      <!-- Sidebar: Fixed overlay en móvil, normal en desktop -->
      <div class="sidebar ${this.sidebarOpen ? 'w-full sm:w-80' : 'w-0'}
                  fixed sm:relative top-0 left-0 h-full sm:h-auto z-50 sm:z-auto
                  flex-shrink-0 bg-gray-900/95 sm:bg-gray-900/50 border-r border-gray-700
                  overflow-hidden transition-all duration-300 flex flex-col">
        <!-- Fixed Header Section -->
        <div class="flex-shrink-0 p-4 sm:p-6 pb-3 sm:pb-4">
          <!-- Close Sidebar Button (visible on all screens) -->
          <button id="close-sidebar-mobile" class="absolute top-2 right-2 w-10 h-10 flex items-center justify-center text-2xl sm:text-3xl font-bold hover:bg-red-500/20 hover:text-red-400 text-white transition-all rounded-lg z-20 border-2 border-gray-500 bg-gray-800 shadow-lg"
                  aria-label="Cerrar índice"
                  title="Cerrar índice de capítulos">
            ×
          </button>

          <!-- Book Title -->
          <div class="mb-3 sm:mb-4 pr-12">
            <h2 class="text-lg sm:text-2xl font-bold mb-1 leading-tight">${bookData.title}</h2>
            <p class="text-xs sm:text-sm opacity-70 leading-tight">${bookData.subtitle || ''}</p>
          </div>

          <!-- Progress -->
          ${this.renderSidebarProgress()}
        </div>

        <!-- Scrollable Chapters List -->
        <div class="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 sidebar-scroll">
          <div class="chapters-list space-y-1.5 sm:space-y-2">
            ${chapters.map(ch => this.renderChapterItem(ch)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderSidebarProgress() {
    const bookId = this.bookEngine.getCurrentBook();
    const progress = this.bookEngine.getProgress(bookId);

    return `
      <div class="progress-box p-3 sm:p-4 rounded-lg bg-gray-800/50 border border-gray-700">
        <div class="flex justify-between text-xs sm:text-sm mb-2">
          <span>Progreso</span>
          <span class="font-bold">${progress.percentage}%</span>
        </div>
        <div class="w-full h-1.5 sm:h-2 bg-gray-700 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
               style="width: ${progress.percentage}%"></div>
        </div>
        <p class="text-xs opacity-60 mt-1.5 sm:mt-2">
          ${progress.chaptersRead} de ${progress.totalChapters} capítulos
        </p>
      </div>
    `;
  }

  // 🔧 FIX #44: Attach listeners solo para chapter items usando EventManager
  attachChapterListeners() {
    // Chapter read toggle buttons
    const readToggleBtns = document.querySelectorAll('.chapter-read-toggle');
    readToggleBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', (e) => {
        e.stopPropagation();
        const chapterId = btn.getAttribute('data-chapter-id');
        this.bookEngine.toggleChapterRead(chapterId);
        this.updateSidebar();
      });
    });

    // Chapter title areas
    const chapterTitleAreas = document.querySelectorAll('.chapter-title-area');
    chapterTitleAreas.forEach(area => {
      this.eventManager.addEventListener(area, 'click', () => {
        const chapterId = area.getAttribute('data-chapter-id');
        this.navigateToChapter(chapterId);
        // 🔧 FIX #49: Cerrar sidebar en móvil sin re-render completo
        if (window.innerWidth < 768) {
          this.sidebarOpen = false;
          this.updateSidebar();
        }
      });
    });

    // Chapter items
    const chapterItems = document.querySelectorAll('.chapter-item');
    chapterItems.forEach(item => {
      this.eventManager.addEventListener(item, 'click', (e) => {
        if (e.target.closest('.chapter-read-toggle') || e.target.closest('.chapter-title-area')) {
          return;
        }
        const chapterId = item.getAttribute('data-chapter-id');
        this.navigateToChapter(chapterId);
        // 🔧 FIX #49: Cerrar sidebar en móvil sin re-render completo
        if (window.innerWidth < 768) {
          this.sidebarOpen = false;
          this.updateSidebar();
        }
      });
    });
  }

  renderChapterItem(chapter) {
    const isActive = chapter.id === this.currentChapter?.id;
    const isRead = this.bookEngine.isChapterRead(chapter.id);

    return `
      <div class="chapter-item p-2 sm:p-3 rounded-lg cursor-pointer transition-all ${
        isActive ? 'bg-cyan-600/30 border border-cyan-500' : 'hover:bg-gray-800/50'
      }"
           data-chapter-id="${chapter.id}">
        <div class="flex items-center gap-1.5 sm:gap-2">
          <button class="chapter-read-toggle p-1.5 sm:p-2 rounded hover:bg-gray-700/50 transition ${isRead ? 'text-green-400' : 'opacity-30 hover:opacity-60'}"
                  data-chapter-id="${chapter.id}"
                  aria-label="${isRead ? this.i18n.t('reader.markUnread') : this.i18n.t('reader.markRead')}"
                  title="${isRead ? this.i18n.t('reader.markUnread') : this.i18n.t('reader.markRead')}">
            ${isRead ? Icons.checkCircle(16) : Icons.circle(16)}
          </button>
          <div class="flex-1 chapter-title-area" data-chapter-id="${chapter.id}">
            <div class="text-xs sm:text-sm font-semibold ${isActive ? 'text-cyan-300' : ''} leading-snug">
              ${chapter.title}
            </div>
            ${chapter.sectionTitle ? `
              <div class="text-xs opacity-50 mt-0.5 sm:mt-1 leading-tight">${chapter.sectionTitle}</div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  renderHeader() {
    const bookData = this.bookEngine.getCurrentBookData();
    const bookConfig = this.bookEngine.getCurrentBookConfig();
    const isBookmarked = this.bookEngine.isBookmarked(this.currentChapter?.id);
    const bookId = this.bookEngine.getCurrentBook();

    // Features específicas por libro
    const hasTimeline = bookConfig?.features?.timeline?.enabled;
    const hasResources = bookConfig?.features?.resources?.enabled;
    const hasManualPractico = bookConfig?.features?.manualPractico;
    const hasPracticasRadicales = bookConfig?.features?.practicasRadicales;
    // Koan solo disponible para ciertos libros
    const koanBooks = ['codigo-despertar', 'manual-practico', 'practicas-radicales'];
    const hasKoan = koanBooks.includes(bookId);

    return `
      <div class="header border-b border-gray-700 p-3 lg:p-4">
        <!-- Primera fila: Navegación + Acciones -->
        <div class="flex items-center justify-between gap-2">
          <!-- Left: Toggle Sidebar -->
          <div class="flex items-start sm:items-center gap-1 flex-shrink-0">
            <button id="toggle-sidebar"
                    class="p-2 sm:p-3 hover:bg-gray-800 rounded-lg transition flex items-center justify-center sm:justify-start gap-1.5"
                    aria-label="${this.sidebarOpen ? 'Contraer barra lateral' : 'Expandir barra lateral'}"
                    title="${this.sidebarOpen ? 'Contraer barra lateral' : 'Expandir barra lateral'}">
              ${this.sidebarOpen ? Icons.chevronLeft(18) : Icons.chevronRight(18)}
              <span class="text-xs sm:text-sm">${this.sidebarOpen ? 'Ocultar' : 'Índice'}</span>
            </button>
          </div>

          <!-- Right: Actions -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <!-- Mobile/Android view: Solo acciones no duplicadas en bottom nav -->
            <!-- En Capacitor siempre usar vista móvil, en web solo < md (768px) -->
            <div class="${this.isCapacitor() ? 'flex lg:hidden' : 'flex md:hidden'} items-center gap-1">
              <button id="bookmark-btn-mobile"
                      class="p-3 hover:bg-gray-800 rounded-lg transition"
                      aria-label="${isBookmarked ? 'Quitar marcador' : this.i18n.t('reader.bookmark')}"
                      title="${isBookmarked ? 'Quitar marcador' : this.i18n.t('reader.bookmark')}">
                ${isBookmarked ? Icons.bookmarkFilled() : Icons.bookmark()}
              </button>
              <!-- Botón Audio mobile: cambia entre 🎧/▶/⏸ -->
              <button id="audioreader-btn-mobile"
                      class="p-3 hover:bg-gray-800 rounded-lg transition"
                      aria-label="${this.i18n.t('reader.audio')}"
                      title="${this.i18n.t('reader.audio')}">
                <span id="audio-icon-mobile">${Icons.audio()}</span>
              </button>
              <!-- Botón Desplegar reproductor (oculto hasta activar audio) -->
              <button id="audio-expand-btn-mobile"
                      class="p-3 hover:bg-gray-800 rounded-lg transition hidden"
                      aria-label="Ver reproductor"
                      title="Ver reproductor">
                ${Icons.chevronDown ? Icons.chevronDown(20) : '▼'}
              </button>
              <!-- Botón Apoyar mobile -->
              <button id="support-btn-mobile"
                      class="p-3 hover:bg-pink-900/50 rounded-lg transition text-pink-400 support-heartbeat"
                      aria-label="${this.i18n.t('btn.support')}"
                      title="${this.i18n.t('btn.support')}">
                <span class="support-heart">❤️</span>
              </button>
              <!-- More actions button -->
              <button id="mobile-menu-btn"
                      class="p-3 hover:bg-gray-800 rounded-lg transition"
                      aria-label="${this.i18n.t('menu.more') || 'Más opciones'}"
                      title="${this.i18n.t('menu.more') || 'Más'}">
                ${Icons.moreVertical ? Icons.moreVertical() : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>`}
              </button>
            </div>

            <!-- Tablet view (md a lg): Main actions + More dropdown -->
            <!-- Solo en web, no en Capacitor -->
            <div class="${this.isCapacitor() ? 'hidden' : 'hidden md:flex lg:hidden'} items-center gap-1">
              <button id="bookmark-btn-tablet"
                      class="p-3 hover:bg-gray-800 rounded-lg transition"
                      aria-label="${isBookmarked ? 'Quitar marcador' : this.i18n.t('reader.bookmark')}"
                      title="${isBookmarked ? 'Quitar marcador' : this.i18n.t('reader.bookmark')}">
                ${isBookmarked ? Icons.bookmarkFilled() : Icons.bookmark()}
              </button>
              <button id="ai-chat-btn-tablet"
                      class="p-3 hover:bg-gray-800 rounded-lg transition"
                      aria-label="${this.i18n.t('reader.chat')}"
                      title="${this.i18n.t('reader.chat')}">
                ${Icons.chat()}
              </button>
              <button id="audioreader-btn-tablet"
                      class="p-3 hover:bg-gray-800 rounded-lg transition"
                      aria-label="${this.i18n.t('reader.audio')}"
                      title="${this.i18n.t('reader.audio')}">
                ${Icons.audio()}
              </button>
              <!-- Botón Apoyar tablet - siempre visible -->
              <button id="support-btn-tablet"
                      class="p-3 hover:bg-pink-900/50 rounded-lg transition text-pink-400 support-heartbeat"
                      aria-label="${this.i18n.t('btn.support')}"
                      title="${this.i18n.t('btn.support')}">
                <span class="support-heart">❤️</span>
              </button>
              <div class="w-px h-5 bg-gray-700 mx-1"></div>
              <!-- More actions dropdown for tablet -->
              <div class="relative">
                <button id="more-actions-btn"
                        class="p-3 hover:bg-gray-800 rounded-lg transition"
                        aria-label="${this.i18n.t('menu.more') || 'Más opciones'}"
                        title="${this.i18n.t('menu.more') || 'Más'}">
                  ${Icons.moreVertical ? Icons.moreVertical() : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>`}
                </button>
                <div id="more-actions-dropdown" class="hidden absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
                  <div class="px-3 py-1.5 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-700">Configuración</div>
                  <button id="open-settings-modal-btn-tablet" class="w-full text-left px-4 py-2 hover:bg-blue-900/30 flex items-center gap-3 text-blue-400 font-semibold" aria-label="Configuración General">
                    ${Icons.settings(18)} <span>Configuración General</span>
                  </button>
                  <button id="open-help-center-btn-tablet" class="w-full text-left px-4 py-2 hover:bg-cyan-900/30 flex items-center gap-3 text-cyan-400 font-semibold" aria-label="Centro de Ayuda">
                    ${Icons.helpCircle(18)} <span>Centro de Ayuda</span>
                  </button>
                  <div class="border-t border-gray-700 my-1"></div>
                  <button id="notes-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="${this.i18n.t('reader.notes')}">
                    ${Icons.note(18)} <span>${this.i18n.t('reader.notes')}</span>
                  </button>
                  <button id="chapter-resources-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-blue-400" aria-label="Recursos del Capítulo">
                    ${Icons.create('link', 18)} <span>Recursos del Capítulo</span>
                  </button>
                  <button id="learning-paths-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-purple-900/30 flex items-center gap-3 text-purple-400" aria-label="Learning Paths">
                    ${Icons.target(18)} <span>Learning Paths</span>
                  </button>
                  ${hasTimeline ? `<button id="timeline-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="Timeline Histórico">${Icons.timeline(18)} <span>Timeline Histórico</span></button>` : ''}
                  ${hasResources ? `<button id="book-resources-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="Recursos del Libro">${Icons.resources(18)} <span>Recursos del Libro</span></button>` : ''}
                  ${hasManualPractico ? `<button id="manual-practico-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="${this.i18n.t('reader.manualPractico')}">${Icons.manual(18)} <span>${this.i18n.t('reader.manualPractico')}</span></button>` : ''}
                  ${hasPracticasRadicales ? `<button id="practicas-radicales-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="${this.i18n.t('reader.practicasRadicales')}">${Icons.radical(18)} <span>${this.i18n.t('reader.practicasRadicales')}</span></button>` : ''}
                  ${hasKoan ? `<button id="koan-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="${this.i18n.t('reader.koan')}">${Icons.koan(18)} <span>${this.i18n.t('reader.koan')}</span></button>` : ''}
                  <div class="border-t border-gray-700 my-1"></div>
                  ${this.isCapacitor() ? '' : `<button id="android-download-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="${this.i18n.t('btn.download')}">${Icons.download(18)} <span>${this.i18n.t('btn.download')}</span></button>`}
                  <button id="donations-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="${this.i18n.t('btn.support')}">${Icons.donate(18)} <span>${this.i18n.t('btn.support')}</span></button>
                  <button id="premium-edition-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-amber-900/30 flex items-center gap-3 text-amber-400" aria-label="${this.i18n.t('premium.title')}">${Icons.book(18)} <span>${this.i18n.t('premium.title')}</span></button>
                  <button id="language-selector-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="${this.i18n.t('lang.title')}">${Icons.language(18)} <span>${this.i18n.t('lang.title')}</span></button>
                  <button id="theme-toggle-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="${window.themeHelper?.getThemeLabel() || 'Tema'}"><span id="theme-icon-dropdown">${window.themeHelper?.getThemeIcon() || '🌙'}</span> <span id="theme-label-dropdown">${window.themeHelper?.getThemeLabel() || 'Tema'}</span></button>
                  <button id="share-chapter-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-blue-900/30 flex items-center gap-3 text-blue-400" aria-label="Compartir capítulo">${Icons.create('share-2', 18)} <span>Compartir</span></button>
                </div>
              </div>
            </div>

            <!-- Desktop view (lg+): Organized in groups -->
            <div class="hidden lg:flex items-center gap-1">
              <!-- Grupo 1: Acciones principales (siempre visibles) -->
              <button id="bookmark-btn"
                      class="p-3 hover:bg-gray-800 rounded-lg transition"
                      aria-label="${isBookmarked ? 'Quitar marcador' : this.i18n.t('reader.bookmark')}"
                      title="${isBookmarked ? 'Quitar marcador' : this.i18n.t('reader.bookmark')}">
                ${isBookmarked ? Icons.bookmarkFilled() : Icons.bookmark()}
              </button>
              <button id="notes-btn"
                      class="p-3 hover:bg-gray-800 rounded-lg transition"
                      aria-label="${this.i18n.t('reader.notes')}"
                      title="${this.i18n.t('reader.notes')}">
                ${Icons.note()}
              </button>
              <button id="ai-chat-btn"
                      class="p-3 hover:bg-gray-800 rounded-lg transition"
                      aria-label="${this.i18n.t('reader.chat')}"
                      title="${this.i18n.t('reader.chat')}">
                ${Icons.chat()}
              </button>
              <button id="audioreader-btn"
                      class="p-3 hover:bg-gray-800 rounded-lg transition"
                      aria-label="${this.i18n.t('reader.audio')}"
                      title="${this.i18n.t('reader.audio')}">
                ${Icons.audio()}
              </button>

              <!-- Botón Apoyar - siempre visible con animación de latido -->
              <button id="support-btn"
                      class="p-3 hover:bg-pink-900/50 rounded-lg transition text-pink-400 support-heartbeat"
                      aria-label="${this.i18n.t('btn.support')}"
                      title="${this.i18n.t('btn.support')}">
                <span class="support-heart">❤️</span>
              </button>

              <div class="w-px h-5 bg-gray-700 mx-1"></div>

              <!-- Grupo 2: Herramientas (dropdown) -->
              <div class="relative">
                <button id="tools-dropdown-btn"
                        class="p-3 hover:bg-cyan-900/50 rounded-lg transition text-cyan-400 flex items-center gap-1"
                        aria-label="Herramientas"
                        title="Herramientas">
                  ${Icons.create('wrench', 18)}
                  <svg class="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
                <div id="tools-dropdown" class="hidden absolute right-0 top-full mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
                  <div class="px-3 py-1.5 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-700">Herramientas</div>
                  <button id="chapter-resources-btn" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-blue-400" aria-label="Recursos del Capítulo">
                    ${Icons.create('link', 18)} <span>Recursos del Capítulo</span>
                  </button>
                  <button id="summary-btn" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="Resumen del capítulo">
                    ${Icons.create('file-text', 18)} <span>Resumen del capítulo</span>
                  </button>
                  <button id="voice-notes-btn" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-red-400" aria-label="Notas de voz">
                    ${Icons.create('mic', 18)} <span>Notas de voz</span>
                  </button>
                  <button id="concept-map-btn" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-cyan-400" aria-label="Mapa Conceptual">
                    ${Icons.create('git-branch', 18)} <span>Mapa Conceptual</span>
                  </button>
                  <button id="action-plans-btn" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-green-400" aria-label="Planes de Acción">
                    ${Icons.create('clipboard-list', 18)} <span>Planes de Acción</span>
                  </button>
                  <button id="achievements-btn" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3 text-amber-400" aria-label="Mis Logros">
                    ${Icons.trophy(18)} <span>Mis Logros</span>
                  </button>
                  <button id="learning-paths-btn-desktop" class="w-full text-left px-4 py-2 hover:bg-purple-900/30 flex items-center gap-3 text-purple-400" aria-label="Learning Paths">
                    ${Icons.target(18)} <span>Learning Paths</span>
                  </button>
                  <div class="border-t border-gray-700 my-1"></div>
                  <button id="content-adapter-btn" class="w-full text-left px-4 py-2 hover:bg-purple-900/30 flex items-center gap-3 text-purple-400" aria-label="Adaptar Contenido">
                    ${Icons.create('sliders', 18)} <span>Adaptar Contenido</span>
                  </button>
                </div>
              </div>

              <!-- Grupo 3: Contenido del libro (dropdown, solo si hay features) -->
              ${(hasTimeline || hasResources || hasManualPractico || hasPracticasRadicales || hasKoan) ? `
              <div class="relative">
                <button id="book-features-dropdown-btn"
                        class="p-3 hover:bg-purple-900/50 rounded-lg transition text-purple-400 flex items-center gap-1"
                        aria-label="Contenido del libro"
                        title="Contenido">
                  ${Icons.resources(18)}
                  <svg class="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
                <div id="book-features-dropdown" class="hidden absolute right-0 top-full mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
                  <div class="px-3 py-1.5 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-700">Contenido del libro</div>
                  <button id="quiz-btn" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="Quiz de Autoevaluación" title="Quiz de Autoevaluación">
                    <span class="text-lg">🎯</span> <span>Quiz de Autoevaluación</span>
                  </button>
                  ${hasTimeline ? `<button id="timeline-btn" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="Timeline Histórico">${Icons.timeline(18)} <span>Timeline Histórico</span></button>` : ''}
                  ${hasResources ? `<button id="book-resources-btn" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="Recursos del Libro">${Icons.resources(18)} <span>Recursos del Libro</span></button>` : ''}
                  ${hasManualPractico ? `<button id="manual-practico-btn" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="${this.i18n.t('reader.manualPractico')}">${Icons.manual(18)} <span>${this.i18n.t('reader.manualPractico')}</span></button>` : ''}
                  ${hasPracticasRadicales ? `<button id="practicas-radicales-btn" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="${this.i18n.t('reader.practicasRadicales')}">${Icons.radical(18)} <span>${this.i18n.t('reader.practicasRadicales')}</span></button>` : ''}
                  ${hasKoan ? `<button id="koan-btn" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="${this.i18n.t('reader.koan')}">${Icons.koan(18)} <span>${this.i18n.t('reader.koan')}</span></button>` : ''}
                </div>
              </div>
              ` : ''}

              <!-- Grupo 4: Configuración y más (dropdown) -->
              <div class="relative">
                <button id="settings-dropdown-btn"
                        class="p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-1"
                        aria-label="Configuración"
                        title="Configuración">
                  ${Icons.settings(18)}
                  <svg class="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
                <div id="settings-dropdown" class="hidden absolute right-0 top-full mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
                  <div class="px-3 py-1.5 text-xs text-gray-500 uppercase tracking-wide border-b border-gray-700">Configuración</div>
                  <button id="open-settings-modal-btn" class="w-full text-left px-4 py-2 hover:bg-blue-900/30 flex items-center gap-3 text-blue-400 font-semibold" aria-label="Configuración General">
                    ${Icons.settings(18)} <span>Configuración General</span>
                  </button>
                  <button id="open-help-center-btn" class="w-full text-left px-4 py-2 hover:bg-cyan-900/30 flex items-center gap-3 text-cyan-400 font-semibold" aria-label="Centro de Ayuda">
                    ${Icons.helpCircle(18)} <span>Centro de Ayuda</span>
                  </button>
                  <div class="border-t border-gray-700 my-1"></div>
                  <button id="language-selector-btn" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="${this.i18n.t('lang.title')}">
                    ${Icons.language(18)} <span>${this.i18n.t('lang.title')}</span>
                  </button>
                  <button id="theme-toggle-btn" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="${window.themeHelper?.getThemeLabel() || 'Tema'}">
                    <span id="theme-icon">${window.themeHelper?.getThemeIcon() || '🌙'}</span> <span id="theme-label">${window.themeHelper?.getThemeLabel() || 'Tema'}</span>
                  </button>
                  <div class="border-t border-gray-700 my-1"></div>
                  <button id="premium-edition-btn" class="w-full text-left px-4 py-2 hover:bg-amber-900/30 flex items-center gap-3 text-amber-400" aria-label="${this.i18n.t('premium.title')}">
                    ${Icons.book(18)} <span>${this.i18n.t('premium.title')}</span>
                  </button>
                  ${this.isCapacitor() ? '' : `
                  <button id="android-download-btn" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3" aria-label="${this.i18n.t('btn.download')}">
                    ${Icons.download(18)} <span>${this.i18n.t('btn.download')}</span>
                  </button>
                  `}
                  <div class="border-t border-gray-700 my-1"></div>
                  <button id="share-chapter-btn" class="w-full text-left px-4 py-2 hover:bg-blue-900/30 flex items-center gap-3 text-blue-400" aria-label="Compartir capítulo">
                    ${Icons.create('share-2', 18)} <span>Compartir capítulo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Segunda fila: Libro y Capítulo (siempre visible) -->
        <div class="mt-2 text-center border-t border-gray-300 dark:border-gray-700/50 pt-2">
          <div class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 truncate px-2">${bookData.title}</div>
          <h3 class="text-sm lg:text-base font-bold text-gray-900 dark:text-gray-100 truncate px-2 mt-0.5" style="color: inherit;">${this.currentChapter?.title || ''}</h3>
        </div>

        <!-- Barra de progreso de audio (oculta hasta activar audio) -->
        <div id="audio-progress-bar-container" class="hidden mt-2">
          <div class="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div id="audio-progress-bar" class="h-full bg-cyan-500 transition-all duration-300" style="width: 0%"></div>
          </div>
          <div class="flex justify-between text-xs text-gray-400 mt-1 px-1">
            <span id="audio-current-time">0:00</span>
            <span id="audio-paragraph-info">--</span>
            <span id="audio-total-time">0:00</span>
          </div>
        </div>
      </div>
    `;
  }

  renderChapterContent() {
    if (!this.currentChapter) return '<p>No hay capítulo seleccionado</p>';

    let html = '<div class="chapter max-w-4xl mx-auto overflow-x-hidden">';

    // Título del capítulo
    html += `<h1 class="text-4xl font-bold mb-6">${this.currentChapter.title}</h1>`;

    // Enlace al libro principal (para libros de ejercicios)
    if (this.currentChapter.parentBook) {
      html += this.bookEngine.renderParentBookLink(this.currentChapter.parentBook);
    }

    // Enlace al Manifiesto (para Manual de Transición y Toolkit)
    if (this.currentChapter.relatedManifiesto) {
      html += this.bookEngine.renderManifiestoLink(this.currentChapter.relatedManifiesto);
    }

    // Epígrafe
    if (this.currentChapter.epigraph) {
      html += this.bookEngine.renderEpigraph(this.currentChapter.epigraph);
    }

    // Contenido principal
    html += `<div class="content prose prose-invert max-w-none overflow-x-hidden break-words">`;
    html += this.bookEngine.renderContent(this.currentChapter.content);
    html += `</div>`;

    // Banner contextual de práctica (si hay ejercicios)
    html += this.renderContextualPracticeBanner();

    // Pregunta de cierre
    if (this.currentChapter.closingQuestion) {
      html += this.bookEngine.renderClosingQuestion(this.currentChapter.closingQuestion);
    }

    // Botón de Edición Premium (aparece solo en el último capítulo de cada libro)
    if (this.isLastChapter()) {
      html += this.renderPremiumEditionButton();
    }

    // Material Complementario (solo para Código del Despertar que tiene mapeos específicos)
    const currentBook = this.bookEngine.getCurrentBook();

    if (currentBook === 'codigo-despertar') {
      // Mostrar Material Complementario con enlaces a Manual Práctico y Prácticas Radicales
      html += this.bookEngine.renderExerciseLinks([], this.currentChapter.id);
    } else if (this.currentChapter.exercises && this.currentChapter.exercises.length > 0) {
      // Para libros de ejercicios (Manual Práctico, Prácticas Radicales), mostrar completo
      html += this.bookEngine.renderExercises(this.currentChapter.exercises, this.currentChapter.id);
    }

    // Reflexiones críticas (Manifiesto)
    if (this.currentChapter.criticalReflections && this.currentChapter.criticalReflections.length > 0) {
      html += this.bookEngine.renderCriticalReflections(this.currentChapter.criticalReflections);
    }

    // Acciones sugeridas (Manifiesto) - con enlaces a Guía de Acciones
    if (this.currentChapter.suggestedActions && this.currentChapter.suggestedActions.length > 0) {
      html += this.bookEngine.renderSuggestedActions(this.currentChapter.suggestedActions, this.currentChapter.id);
    }

    // Ejercicio enlazado al Toolkit (Manual de Transición)
    if (this.currentChapter.linkedExercise) {
      html += this.bookEngine.renderLinkedExercise(this.currentChapter.linkedExercise, this.currentChapter.title);
    }

    // Sugerencias de IA (para profundizar)
    const aiSuggestions = this.getDependency('aiSuggestions'); // 🔧 FIX #87
    if (aiSuggestions) {
      const bookId = this.bookEngine.getCurrentBook();
      html += aiSuggestions.render(bookId, this.currentChapter.id);
    }

    // Botón de marcar capítulo como leído
    html += this.renderMarkAsReadButton();

    // Action cards al final del capítulo
    html += this.renderActionCards();

    html += '</div>';

    return html;
  }

  /**
   * Renderiza un banner contextual de práctica
   * Aparece sutilmente cuando el capítulo tiene ejercicios o práctica asociada
   */
  renderContextualPracticeBanner() {
    // Verificar si hay ejercicios en el capítulo
    const tieneEjercicios = this.currentChapter?.exercises?.length > 0;
    const tieneLinkedExercise = this.currentChapter?.linkedExercise;
    const currentBookId = this.bookEngine.getCurrentBook();

    // Para libros de ejercicios (Manual Práctico, Toolkit), no mostrar banner adicional
    const librosDeEjercicios = ['manual-practico', 'practicas-radicales', 'toolkit-transicion'];
    if (librosDeEjercicios.includes(currentBookId)) {
      return '';
    }

    // Verificar si el libro de referencia tiene ejercicios relacionados
    const librosConPracticas = {
      'codigo-despertar': { practicaLibroId: 'manual-practico', practicaNombre: 'Manual Práctico' },
      'tierra-que-despierta': { practicaLibroId: 'manual-practico', practicaNombre: 'Manual Práctico' },
      'manifiesto': { practicaLibroId: 'guia-acciones', practicaNombre: 'Guía de Acciones' },
      'manual-transicion': { practicaLibroId: 'toolkit-transicion', practicaNombre: 'Toolkit de Transición' }
    };

    const practicaRelacionada = librosConPracticas[currentBookId];

    if (!tieneEjercicios && !tieneLinkedExercise && !practicaRelacionada) {
      return '';
    }

    // Determinar qué tipo de banner mostrar
    let bannerContent = '';

    if (tieneEjercicios) {
      const primerEjercicio = this.currentChapter.exercises[0];
      bannerContent = `
        <div class="chapter-practice-banner">
          <div class="icon">🧘</div>
          <div class="content">
            <div class="title">Este capítulo incluye una práctica</div>
            <div class="description">${primerEjercicio.title || 'Ejercicio de integración'} • ${primerEjercicio.duration || '10 min'}</div>
          </div>
          <button class="action-btn" onclick="window.bookReader?.scrollToElement('.exercises-section')">
            Ver práctica
          </button>
        </div>
      `;
    } else if (tieneLinkedExercise) {
      bannerContent = `
        <div class="chapter-practice-banner">
          <div class="icon">⚡</div>
          <div class="content">
            <div class="title">Ejercicio práctico disponible</div>
            <div class="description">${tieneLinkedExercise.title || 'Actividad práctica relacionada'}</div>
          </div>
          <button class="action-btn" onclick="window.bookReader?.scrollToElement('.linked-exercise')">
            Ver ejercicio
          </button>
        </div>
      `;
    } else if (practicaRelacionada) {
      bannerContent = `
        <div class="chapter-practice-banner" style="opacity: 0.8;">
          <div class="icon">💡</div>
          <div class="content">
            <div class="title">¿Quieres profundizar con prácticas?</div>
            <div class="description">El ${practicaRelacionada.practicaNombre} tiene ejercicios relacionados</div>
          </div>
          <button class="action-btn" onclick="window.biblioteca?.openBook('${practicaRelacionada.practicaLibroId}')">
            Explorar
          </button>
        </div>
      `;
    }

    return bannerContent;
  }

  renderActionCards() {
    const bookId = this.bookEngine.getCurrentBook();
    const chapterId = this.currentChapter && this.currentChapter.id;
    if (!bookId || !chapterId) return '';

    // Verificar qué features están disponibles
    const bookConfig = this.bookEngine.getCurrentBookConfig();
    const InteractiveQuiz = this.getDependency('InteractiveQuiz'); // 🔧 FIX #87
    const hasQuiz = InteractiveQuiz && this.currentChapter && this.currentChapter.quiz;
    const hasResources = bookConfig && bookConfig.features && bookConfig.features.resources && bookConfig.features.resources.enabled;
    const hasReflection = this.currentChapter && this.currentChapter.closingQuestion;
    const nextChapter = this.bookEngine.getNextChapter(chapterId);

    return `
      <div class="chapter-complete-actions">
        <h4>
          <span>✅</span>
          <span>¿Qué quieres hacer ahora?</span>
        </h4>
        <p class="subtitle">Elige cómo continuar tu exploración</p>

        <div class="actions-grid">
          <!-- Siguiente capítulo (siempre visible si hay siguiente) -->
          ${nextChapter ? `
            <div class="action-card" onclick="window.bookReader?.navigateToChapter('${nextChapter.id}')">
              <span class="icon">→</span>
              <span class="label">Siguiente capítulo</span>
            </div>
          ` : ''}

          <!-- Reflexionar con notas -->
          <div class="action-card" onclick="window.notesModal?.open()">
            <span class="icon">📝</span>
            <span class="label">Tomar notas</span>
          </div>

          <!-- Preguntar a la IA -->
          <div class="action-card" onclick="window.aiChatModal?.open()">
            <span class="icon">🤖</span>
            <span class="label">Preguntar a la IA</span>
          </div>

          <!-- Quiz si está disponible -->
          ${hasQuiz ? `
            <div class="action-card" data-action="quiz">
              <span class="icon">🎯</span>
              <span class="label">Quiz interactivo</span>
            </div>
          ` : ''}

          <!-- Recursos si está disponible -->
          ${hasResources ? `
            <div class="action-card" onclick="window.chapterResourcesModal?.open()">
              <span class="icon">📚</span>
              <span class="label">Ver recursos</span>
            </div>
          ` : ''}

          <!-- Escuchar audio -->
          <div class="action-card" onclick="window.audioReader?.toggle()">
            <span class="icon">🎧</span>
            <span class="label">Escuchar audio</span>
          </div>
        </div>
      </div>
    `;
  }

  renderMarkAsReadButton() {
    const isRead = this.bookEngine.isChapterRead(this.currentChapter?.id);

    return `
      <div class="mark-read-section mt-12 pt-8 border-t border-gray-700/50 text-center">
        <button id="mark-chapter-read-btn"
                class="inline-flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 ${
                  isRead
                    ? 'bg-green-900/30 text-green-300 border border-green-500/30 hover:bg-green-900/50'
                    : 'bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-cyan-500'
                }">
          ${isRead ? Icons.checkCircle(22) : Icons.circle(22)}
          <span class="font-medium">
            ${isRead ? this.i18n.t('reader.markUnread') : this.i18n.t('reader.markRead')}
          </span>
        </button>
        ${isRead ? `
          <p class="mt-3 text-sm text-green-400/70">${this.i18n.t('reader.chapterComplete')}</p>
        ` : ''}
      </div>
    `;
  }

  renderFooterNav() {
    const prevChapter = this.bookEngine.getPreviousChapter(this.currentChapter?.id);
    const nextChapter = this.bookEngine.getNextChapter(this.currentChapter?.id);

    return `
      <div class="footer-nav border-t border-slate-700/50 bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-sm">
        <div class="max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 flex flex-row justify-between items-center gap-2 sm:gap-4">
          <!-- Previous Button -->
          ${prevChapter ? `
            <button id="prev-chapter"
                    class="group flex items-center gap-1.5 sm:gap-3 px-2.5 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/10 flex-1 sm:max-w-md"
                    data-chapter-id="${prevChapter.id}"
                    title="${prevChapter.title}">
              <div class="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded sm:rounded-lg bg-slate-700/50 group-hover:bg-cyan-600/20 flex items-center justify-center transition-colors">
                ${Icons.chevronLeft(16)}
              </div>
              <div class="flex-1 text-left min-w-0">
                <div class="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide hidden sm:block mb-0.5">Anterior</div>
                <div class="text-[11px] sm:text-sm font-semibold text-slate-200 truncate leading-tight">${prevChapter.title}</div>
              </div>
            </button>
          ` : '<div class="hidden sm:flex flex-1"></div>'}

          <!-- Next Button -->
          ${nextChapter ? `
            <button id="next-chapter"
                    class="group flex items-center gap-1.5 sm:gap-3 px-2.5 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-cyan-600/90 to-blue-600/90 hover:from-cyan-500/90 hover:to-blue-500/90 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/20 flex-1 sm:max-w-md"
                    data-chapter-id="${nextChapter.id}"
                    title="${nextChapter.title}">
              <div class="flex-1 text-right min-w-0">
                <div class="text-[10px] sm:text-xs text-cyan-100 uppercase tracking-wide hidden sm:block mb-0.5">Siguiente</div>
                <div class="text-[11px] sm:text-sm font-semibold text-white truncate leading-tight">${nextChapter.title}</div>
              </div>
              <div class="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded sm:rounded-lg bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                ${Icons.chevronRight(16)}
              </div>
            </button>
          ` : '<div class="hidden sm:flex flex-1"></div>'}
        </div>
      </div>
    `;
  }

  /**
   * Renderiza la barra de navegación inferior para el lector (solo móvil)
   * Tabs: Capítulos, Audio, Chat IA, Notas, Más
   */
  renderReaderBottomNav() {
    const prevChapter = this.bookEngine.getPreviousChapter(this.currentChapter?.id);
    const nextChapter = this.bookEngine.getNextChapter(this.currentChapter?.id);

    return `
      <nav class="app-bottom-nav" id="reader-bottom-nav">
        <!-- Índice -->
        <button class="app-bottom-nav-tab" data-tab="capitulos" onclick="window.bookReader?.toggleSidebar()">
          <span class="app-bottom-nav-icon">📖</span>
          <span class="app-bottom-nav-label">Índice</span>
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

        <!-- Navegación con dropdown -->
        <div class="relative">
          <button class="app-bottom-nav-tab" data-tab="nav" id="bottom-nav-more-btn">
            <span class="app-bottom-nav-icon">⋯</span>
            <span class="app-bottom-nav-label">Más</span>
          </button>

          <!-- Dropdown Menu -->
          <div id="bottom-nav-dropdown" class="hidden absolute bottom-full right-0 mb-2 w-56 bg-slate-800/95 backdrop-blur-lg border border-slate-700 rounded-lg shadow-2xl z-[1000] py-1">
            ${prevChapter ? `
              <button onclick="window.bookReader?.bookEngine.navigateToChapter('${prevChapter.id}')" class="w-full text-left px-4 py-3 hover:bg-slate-700 flex items-center gap-3 border-b border-slate-700/50">
                <span class="text-xl">⬅️</span>
                <div class="flex-1 min-w-0">
                  <div class="text-xs text-slate-400 uppercase">Anterior</div>
                  <div class="text-sm font-semibold text-white truncate">${prevChapter.title}</div>
                </div>
              </button>
            ` : ''}
            ${nextChapter ? `
              <button onclick="window.bookReader?.bookEngine.navigateToChapter('${nextChapter.id}')" class="w-full text-left px-4 py-3 hover:bg-slate-700 flex items-center gap-3 border-b border-slate-700/50">
                <span class="text-xl">➡️</span>
                <div class="flex-1 min-w-0">
                  <div class="text-xs text-slate-400 uppercase">Siguiente</div>
                  <div class="text-sm font-semibold text-white truncate">${nextChapter.title}</div>
                </div>
              </button>
            ` : ''}
            <button onclick="window.bookReader?.toggleMobileMenu()" class="w-full text-left px-4 py-2 hover:bg-slate-700 flex items-center gap-3">
              <span class="text-lg">⚙️</span>
              <span class="text-sm">Opciones</span>
            </button>
          </div>
        </div>
      </nav>
    `;
  }

  /**
   * Toggle del reproductor de audio
   */
  toggleAudioPlayer() {
    const audioReader = this.getDependency('audioReader'); // 🔧 FIX #87
    if (audioReader) {
      audioReader.toggle();
    } else {
      this.showToast('info', 'Cargando reproductor de audio...');
    }
    this.setReaderActiveTab('audio');
  }

  /**
   * Abre el chat de IA
   */
  openAIChat() {
    const aiBookFeatures = this.getDependency('aiBookFeatures'); // 🔧 FIX #87
    const aiChatModal = this.getDependency('aiChatModal'); // 🔧 FIX #87

    if (aiBookFeatures) {
      aiBookFeatures.openChat();
    } else if (aiChatModal) {
      aiChatModal.open();
    } else {
      this.showToast('info', 'Chat de IA no disponible');
    }
    this.setReaderActiveTab('chat');
  }

  /**
   * Abre el modal de notas
   */
  openNotes() {
    const smartNotes = this.getDependency('smartNotes'); // 🔧 FIX #87
    if (smartNotes) {
      smartNotes.open();
    } else {
      this.showToast('info', 'Sistema de notas no disponible');
    }
    this.setReaderActiveTab('notas');
  }

  /**
   * Muestra opciones de navegación (prev/next o menú móvil)
   */
  showNavOptions() {
    const nextChapter = this.bookEngine.getNextChapter(this.currentChapter?.id);
    const prevChapter = this.bookEngine.getPreviousChapter(this.currentChapter?.id);

    if (nextChapter) {
      this.bookEngine.navigateToChapter(nextChapter.id);
    } else if (prevChapter) {
      this.bookEngine.navigateToChapter(prevChapter.id);
    } else {
      // Si no hay prev/next, abrir menú móvil
      this.toggleMobileMenu();
    }
  }

  /**
   * Actualiza el tab activo en la navegación inferior del lector
   */
  setReaderActiveTab(tabName) {
    document.querySelectorAll('#reader-bottom-nav .app-bottom-nav-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      }
    });
  }

  renderMobileMenu() {
    const bookConfig = this.bookEngine.getCurrentBookConfig();
    const hasTimeline = bookConfig?.features?.timeline?.enabled;
    const hasResources = bookConfig?.features?.resources?.enabled;
    const hasManualPractico = bookConfig?.features?.manualPractico;
    const hasPracticasRadicales = bookConfig?.features?.practicasRadicales;
    const isBookmarked = this.bookEngine.isBookmarked(this.currentChapter?.id);

    // Koan solo disponible para libros específicos
    const bookId = bookConfig?.id || '';
    const koanBooks = ['codigo-despertar', 'manual-practico', 'practicas-radicales'];
    const hasKoan = koanBooks.includes(bookId);

    return `
      <div id="mobile-menu" class="hidden fixed inset-0 z-50 md:hidden">
        <!-- Backdrop (clickable to close) -->
        <div id="mobile-menu-backdrop" class="absolute inset-0 bg-black/80"></div>

        <!-- Menu Panel -->
        <div class="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gray-900 border-l border-gray-700 shadow-2xl flex flex-col overflow-hidden">
          <!-- Fixed Header -->
          <div class="flex-shrink-0 p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
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

            <div class="border-t border-gray-700 my-3"></div>

            <!-- Notas (no está en header móvil, solo aquí) -->
            <button id="notes-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
              ${Icons.note(24)}
              <span>${this.i18n.t('reader.notes')}</span>
            </button>

            <button id="chapter-resources-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3 text-blue-400">
              ${Icons.create('link', 24)}
              <span>Recursos del Capítulo</span>
            </button>

            <!-- Learning Paths Button -->
            <button id="learning-paths-btn-mobile" class="w-full text-left p-3 hover:bg-purple-900/30 rounded-lg transition flex items-center gap-3 text-purple-400 border border-purple-500/30">
              ${Icons.target(24)}
              <span>Learning Paths</span>
            </button>

            <div class="border-t border-gray-700 my-3"></div>

            <!-- Feature Buttons -->
            ${hasTimeline ? `
              <button id="timeline-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
                ${Icons.timeline(24)}
                <span>Timeline Histórico</span>
              </button>
            ` : ''}

            ${hasResources ? `
              <button id="book-resources-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
                ${Icons.resources(24)}
                <span>Recursos del Libro</span>
              </button>
            ` : ''}

            ${hasManualPractico ? `
              <button id="manual-practico-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
                ${Icons.manual(24)}
                <span>${this.i18n.t('reader.manualPractico')}</span>
              </button>
            ` : ''}

            ${hasPracticasRadicales ? `
              <button id="practicas-radicales-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
                ${Icons.radical(24)}
                <span>${this.i18n.t('reader.practicasRadicales')}</span>
              </button>
            ` : ''}

            ${hasKoan ? `
            <button id="koan-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
              ${Icons.koan(24)}
              <span>${this.i18n.t('reader.koan')}</span>
            </button>
            ` : ''}

            <div class="border-t border-gray-700 my-3"></div>

            ${this.isCapacitor() ? '' : `
            <button id="android-download-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
              ${Icons.download(24)}
              <span>${this.i18n.t('btn.download')}</span>
            </button>
            `}

            <button id="donations-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
              ${Icons.donate(24)}
              <span>${this.i18n.t('btn.support')}</span>
            </button>

            <button id="premium-edition-btn-mobile" class="w-full text-left p-3 hover:bg-amber-900/30 rounded-lg transition flex items-center gap-3 text-amber-400 border border-amber-500/30">
              ${Icons.book(24)}
              <div>
                <span class="font-bold">${this.i18n.t('premium.title')}</span>
                <span class="text-xs text-amber-300/70 block">${this.i18n.t('premium.contribution')}: 15€ (${this.i18n.t('premium.optional')})</span>
              </div>
            </button>

            <button id="language-selector-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
              ${Icons.language(24)}
              <span>${this.i18n.t('lang.title')}</span>
            </button>

            <button id="theme-toggle-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
              <span class="text-2xl" id="theme-icon-mobile">${window.themeHelper?.getThemeIcon() || '🌙'}</span>
              <span id="theme-label-mobile">${window.themeHelper?.getThemeLabel() || 'Tema'}</span>
            </button>

            <div class="border-t border-gray-700 my-3"></div>

            <button id="open-settings-modal-btn-mobile" class="w-full text-left p-3 hover:bg-blue-900/30 rounded-lg transition flex items-center gap-3 text-blue-400 border border-blue-500/30 font-semibold">
              ${Icons.settings(24)}
              <span>Configuración</span>
            </button>

            <button id="open-help-center-btn-mobile" class="w-full text-left p-3 hover:bg-cyan-900/30 rounded-lg transition flex items-center gap-3 text-cyan-400 border border-cyan-500/30 font-semibold">
              ${Icons.helpCircle(24)}
              <span>Centro de Ayuda</span>
            </button>

            <button id="share-chapter-btn-mobile" class="w-full text-left p-3 hover:bg-blue-900/30 rounded-lg transition flex items-center gap-3 text-blue-400 border border-blue-500/30">
              ${Icons.create('share-2', 24)}
              <span>Compartir capítulo</span>
            </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderExplorationHubButton() {
    return `
      <!-- Floating ExplorationHub Button -->
      <button
        id="exploration-hub-floating-btn"
        class="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-2xl
               bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600
               hover:from-purple-700 hover:via-pink-700 hover:to-blue-700
               transition-all duration-300 transform hover:scale-110
               flex items-center justify-center text-white
               border-2 border-white/20
               md:bottom-8 md:right-8"
        aria-label="Abrir Centro de Exploración"
        title="Buscar, explorar temas y recursos">
        ${Icons.compass(28)}
      </button>
    `;
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  attachEventListeners() {
    // ⚠️ PROTECCIÓN CRÍTICA: Solo ejecutar una vez para evitar acumulación masiva
    if (this._eventListenersAttached) {
      return; // Ya se ejecutó, salir inmediatamente
    }

    console.log('✅ Ejecutando attachEventListeners por ÚNICA vez');
    this._eventListenersAttached = true; // Marcar como ejecutado

    // 🔧 FIX #43: Helpers reutilizables para eliminar duplicación (~300 líneas)

    /**
     * 🔧 FIX #43: Crea un handler para abrir modales con cierre automático de menús
     * Usa getDependency() en lugar de window.* para acceso seguro
     * @param {string} modalPath - Nombre del modal/dependencia (ej: 'notesModal', 'chapterResourcesModal')
     * @param {Function|null} closeMenu - Función para cerrar menú (null si no aplica)
     * @param {string} methodName - Nombre del método a llamar (default: 'open')
     * @param  {...any} args - Argumentos para el método del modal
     */
    const createModalHandler = (modalPath, closeMenu = null, methodName = 'open', ...args) => {
      return () => {
        if (closeMenu) closeMenu();

        // 🔧 FIX #43: Usar getDependency() en lugar de eval() o window.*
        const modal = this.getDependency(modalPath);

        if (modal) {
          // Evaluar args que sean funciones (ej: () => this.currentChapter?.id)
          const evaluatedArgs = args.map(arg => typeof arg === 'function' ? arg() : arg);
          modal[methodName](...evaluatedArgs);
        } else {
          const errorKey = `error.${modalPath}NotAvailable`;
          this.showToast('error', errorKey);
        }
      };
    };

    // 🔧 FIX #43: Eliminación de duplicación masiva de handlers
    /**
     * Crea un handler para cambiar de libro usando el método unificado handleBookSwitch
     * @param {string} bookId - ID del libro
     * @param {Function|null} closeMenu - Función para cerrar menú
     */
    const createBookSwitchHandler = (bookId, closeMenu = null) => {
      return async () => {
        if (closeMenu) closeMenu();
        await this.handleBookSwitch(bookId);
      };
    };

    /**
     * 🔧 FIX #43: Crea un handler genérico para ejecutar métodos de this
     * @param {string} methodName - Nombre del método de this a llamar
     * @param {...any} args - Argumentos para el método
     * @returns {Function} Handler que ejecuta el método
     */
    const createMethodHandler = (methodName, ...args) => {
      return () => {
        if (typeof this[methodName] === 'function') {
          this[methodName](...args);
        }
      };
    };

    /**
     * 🔧 FIX #44: Registra el mismo handler en múltiples botones usando EventManager
     * @param {string[]} buttonIds - Array de IDs de botones
     * @param {Function} handler - Handler a registrar
     */
    const attachMultiDevice = (buttonIds, handler) => {
      buttonIds.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
          this.eventManager.addEventListener(btn, 'click', handler);
        }
      });
    };

    /**
     * 🔧 FIX #43: Versión mejorada de attachMultiDevice con cierre automático de menús
     * Detecta automáticamente si debe cerrar menús basándose en el ID del botón
     * @param {string[]} buttonIds - Array de IDs de botones
     * @param {Function} handler - Handler base a ejecutar
     */
    const attachMultiDeviceWithMenuClose = (buttonIds, handler) => {
      buttonIds.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
          this.eventManager.addEventListener(btn, 'click', () => {
            // Cerrar menús según el tipo de botón
            if (id.includes('-mobile')) {
              closeMobileMenuDropdown();
            } else if (id.includes('-dropdown')) {
              closeDropdownHelper();
            }
            // Ejecutar handler principal
            handler();
          });
        }
      });
    };

    // Toggle sidebar - usar referencia guardada para evitar duplicación
    if (!this._toggleSidebarHandler) {
      this._toggleSidebarHandler = (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.toggleSidebar();
      };
    }

    const toggleSidebar = document.getElementById('toggle-sidebar');
    if (toggleSidebar) {
      this.eventManager.addEventListener(toggleSidebar, 'click', this._toggleSidebarHandler);
    }

    // Close sidebar (mobile)
    if (!this._closeSidebarHandler) {
      this._closeSidebarHandler = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (this.sidebarOpen) {
          this.toggleSidebar();
        }
      };
    }

    const closeSidebarMobile = document.getElementById('close-sidebar-mobile');
    if (closeSidebarMobile) {
      this.eventManager.addEventListener(closeSidebarMobile, 'click', this._closeSidebarHandler);
    }

    // Back to biblioteca
    if (!this._backToBibliotecaHandler) {
      this._backToBibliotecaHandler = (e) => {
        e.stopPropagation();
        e.preventDefault();
        // Remover tema específico del libro
        this.removeBookTheme();
        this.hide();
        const biblioteca = this.getDependency('biblioteca'); // 🔧 FIX #87
        if (biblioteca) biblioteca.show();
      };
    }

    const backBtn = document.getElementById('back-to-biblioteca');
    if (backBtn) {
      this.eventManager.addEventListener(backBtn, 'click', this._backToBibliotecaHandler);
    }

    // Mobile menu toggle
    if (!this._mobileMenuHandler) {
      this._mobileMenuHandler = (e) => {
        e.stopPropagation();
        e.preventDefault();
        document.getElementById('mobile-menu')?.classList.remove('hidden');
      };
    }

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
      this.eventManager.addEventListener(mobileMenuBtn, 'click', this._mobileMenuHandler);
    }

    // Bottom nav "Más" dropdown toggle
    const bottomNavMoreBtn = document.getElementById('bottom-nav-more-btn');
    const bottomNavDropdown = document.getElementById('bottom-nav-dropdown');
    if (bottomNavMoreBtn && bottomNavDropdown) {
      if (!this._bottomNavMoreHandler) {
        this._bottomNavMoreHandler = (e) => {
          e.stopPropagation();
          bottomNavDropdown.classList.toggle('hidden');
        };
      }

      this.eventManager.addEventListener(bottomNavMoreBtn, 'click', this._bottomNavMoreHandler);

      // Cerrar dropdown al hacer click fuera - SOLO UNA VEZ
      if (!this._bottomNavClickOutsideAttached) {
        this._bottomNavClickOutsideHandler = (e) => {
          if (!bottomNavDropdown.contains(e.target) && e.target !== bottomNavMoreBtn) {
            bottomNavDropdown.classList.add('hidden');
          }
        };
        this.eventManager.addEventListener(document, 'click', this._bottomNavClickOutsideHandler);
        this._bottomNavClickOutsideAttached = true;
      }

      // 🔧 FIX #44: Cerrar dropdown después de seleccionar una opción usando EventManager
      bottomNavDropdown.querySelectorAll('button').forEach(btn => {
        this.eventManager.addEventListener(btn, 'click', () => {
          setTimeout(() => {
            bottomNavDropdown.classList.add('hidden');
          }, 100);
        });
      });
    }

    // 🔧 FIX #44: Close mobile menu button usando EventManager
    const closeMobileMenu = document.getElementById('close-mobile-menu');
    if (closeMobileMenu) {
      this.eventManager.addEventListener(closeMobileMenu, 'click', () => {
        // 🔧 FIX #48: Verificar existencia antes de manipular elemento
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
          mobileMenu.classList.add('hidden');
        }
      });
    }

    // 🔧 FIX #44: Close on backdrop click usando EventManager
    const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');
    if (mobileMenuBackdrop) {
      this.eventManager.addEventListener(mobileMenuBackdrop, 'click', () => {
        // 🔧 FIX #48: Verificar existencia antes de manipular elemento
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
          mobileMenu.classList.add('hidden');
        }
      });
    }

    // 🔧 FIX #44: Back to biblioteca (mobile) usando EventManager
    const backToLibMobile = document.getElementById('back-to-biblioteca-mobile');
    if (backToLibMobile) {
      this.eventManager.addEventListener(backToLibMobile, 'click', () => {
        // 🔧 FIX #48: Verificar existencia antes de manipular elemento
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
          mobileMenu.classList.add('hidden');
        }
        // Remover tema específico del libro
        this.removeBookTheme();
        this.hide();
        const biblioteca = this.getDependency('biblioteca'); // 🔧 FIX #87
        if (biblioteca) biblioteca.show();
      });
    }

    // Helper function to close mobile menu dropdown
    const closeMobileMenuDropdown = () => {
      const menu = document.getElementById('mobile-menu');
      if (menu) menu.classList.add('hidden');
    };

    // Bookmark button (desktop lg+ and tablet md)
    const bookmarkHandler = () => {
      closeMobileMenuDropdown();
      const isBookmarked = this.bookEngine.isBookmarked(this.currentChapter.id);
      if (isBookmarked) {
        this.bookEngine.removeBookmark(this.currentChapter.id);
      } else {
        this.bookEngine.addBookmark(this.currentChapter.id);
      }
      // 🔧 FIX #49: Solo actualizar header y sidebar, no render completo
      this.updateHeader();
      this.updateSidebar();
    };

    const bookmarkBtn = document.getElementById('bookmark-btn');
    const bookmarkBtnTablet = document.getElementById('bookmark-btn-tablet');
    const bookmarkBtnMobile = document.getElementById('bookmark-btn-mobile');

    // 🔧 FIX #44: Bookmark buttons usando EventManager
    if (bookmarkBtn) this.eventManager.addEventListener(bookmarkBtn, 'click', bookmarkHandler);
    if (bookmarkBtnTablet) this.eventManager.addEventListener(bookmarkBtnTablet, 'click', bookmarkHandler);
    if (bookmarkBtnMobile) this.eventManager.addEventListener(bookmarkBtnMobile, 'click', bookmarkHandler);

    // AI Chat button (desktop lg+, tablet md, and mobile)
    const aiChatHandler = () => {
      closeMobileMenuDropdown();
      const aiChatModal = this.getDependency('aiChatModal'); // 🔧 FIX #87
      if (aiChatModal) {
        aiChatModal.open();
      } else {
        this.showToast('error', 'error.chatNotAvailable');
      }
    };

    const aiChatBtn = document.getElementById('ai-chat-btn');
    const aiChatBtnTablet = document.getElementById('ai-chat-btn-tablet');
    const aiChatBtnMobile = document.getElementById('ai-chat-btn-mobile');

    // 🔧 FIX #44: AI Chat buttons usando EventManager
    if (aiChatBtn) this.eventManager.addEventListener(aiChatBtn, 'click', aiChatHandler);
    if (aiChatBtnTablet) this.eventManager.addEventListener(aiChatBtnTablet, 'click', aiChatHandler);
    if (aiChatBtnMobile) this.eventManager.addEventListener(aiChatBtnMobile, 'click', aiChatHandler);

    // 🔧 FIX #44: ExplorationHub floating button usando EventManager
    const explorationHubBtn = document.getElementById('exploration-hub-floating-btn');
    if (explorationHubBtn) {
      this.eventManager.addEventListener(explorationHubBtn, 'click', () => {
        const ExplorationHub = this.getDependency('ExplorationHub'); // 🔧 FIX #87
        if (ExplorationHub && this.bookEngine) {
          const hub = new ExplorationHub(this.bookEngine);
          hub.open('search'); // Abrir con tab de búsqueda por defecto
        } else {
          console.error('ExplorationHub no está disponible');
        }
      });
    }

    // 🔧 FIX #44: Notes button usando EventManager
    const notesBtn = document.getElementById('notes-btn');
    if (notesBtn) {
      this.eventManager.addEventListener(notesBtn, 'click', () => {
        const notesModal = this.getDependency('notesModal'); // 🔧 FIX #87
        if (notesModal) {
          notesModal.open(this.currentChapter?.id);
        } else {
          this.showToast('error', 'error.notesNotAvailable');
        }
      });
    }

    // 🔧 FIX #44: Voice notes button usando EventManager
    const voiceNotesBtn = document.getElementById('voice-notes-btn');
    if (voiceNotesBtn) {
      this.eventManager.addEventListener(voiceNotesBtn, 'click', () => {
        const voiceNotes = this.getDependency('voiceNotes'); // 🔧 FIX #87
        if (voiceNotes) {
          voiceNotes.showRecordingModal();
        } else {
          this.showToast('error', 'Notas de voz no disponibles');
        }
      });
    }

    // 🔧 FIX #44: Koan button usando EventManager
    const koanBtn = document.getElementById('koan-btn');
    if (koanBtn) {
      this.eventManager.addEventListener(koanBtn, 'click', () => {
        const koanModal = this.getDependency('koanModal'); // 🔧 FIX #87
        if (koanModal) {
          koanModal.setCurrentChapter(this.currentChapter?.id);
          koanModal.open(this.currentChapter?.id);
        } else {
          this.showToast('error', 'error.koanNotAvailable');
        }
      });
    }

    // 🔧 FIX #44: Quiz button usando EventManager
    const quizBtn = document.getElementById('quiz-btn');
    if (quizBtn) {
      this.eventManager.addEventListener(quizBtn, 'click', async () => {
        const bookId = this.bookEngine.getCurrentBook();
        const chapterId = this.currentChapter?.id;

        if (!chapterId) {
          this.showToast('info', 'Selecciona un capítulo primero');
          return;
        }

        const interactiveQuiz = this.getDependency('interactiveQuiz'); // 🔧 FIX #87
        if (interactiveQuiz) {
          const quiz = await interactiveQuiz.loadQuiz(bookId, chapterId);
          if (quiz) {
            interactiveQuiz.open(bookId, chapterId);
          } else {
            this.showToast('info', 'No hay quiz disponible para este capítulo');
          }
        } else {
          console.error('InteractiveQuiz no está disponible');
        }
      });
    }

    // 🔧 FIX #44: Timeline button usando EventManager
    const timelineBtn = document.getElementById('timeline-btn');
    if (timelineBtn) {
      this.eventManager.addEventListener(timelineBtn, 'click', () => {
        const timelineViewer = this.getDependency('timelineViewer'); // 🔧 FIX #87
        if (timelineViewer) {
          timelineViewer.open();
        } else {
          this.showToast('error', 'error.timelineNotAvailable');
        }
      });
    }

    // Resources button - eliminado, ahora se maneja con ChapterResourcesModal más abajo

    // Audioreader button - Cambia icono y activa/pausa audio
    // Usar referencia guardada para evitar duplicación de listeners
    if (!this._audioreaderHandler) {
      this._audioreaderHandler = async (e) => {
        e.stopPropagation(); // Evitar propagación que pueda activar otros handlers
        e.preventDefault();

        // Cerrar menú móvil si está abierto
        const menu = document.getElementById('mobile-menu');
        if (menu) menu.classList.add('hidden');

        const audioReader = this.getDependency('audioReader'); // 🔧 FIX #87
        const reader = audioReader?.baseReader || audioReader;
        if (!reader) {
          this.showToast('error', 'Reproductor no disponible');
          return;
        }

        // Si no tiene contenido preparado, prepararlo primero
        if (reader.paragraphs.length === 0) {
          const chapterContent = document.querySelector('.chapter-content');
          if (chapterContent) {
            reader.prepareContent(chapterContent.innerHTML);
            await reader.updateUI(); // Sincronizar iconos
          }
          return;
        }

        // Ya tiene contenido - toggle play/pause
        if (reader.isPlaying && !reader.isPaused) {
          // Pausar
          await reader.pause();
        } else {
          // Reproducir o resumir
          if (reader.isPaused) {
            await reader.resume();
          } else {
            const chapterContent = document.querySelector('.chapter-content');
            if (chapterContent) {
              await reader.play(chapterContent.innerHTML);
            }
          }
        }
      };
    }

    // Botón expandir - muestra reproductor completo
    const audioExpandHandler = () => {
      const audioReader = this.getDependency('audioReader'); // 🔧 FIX #87
      const reader = audioReader?.baseReader || audioReader;
      if (reader && reader.showSimplePlayer) {
        reader.showSimplePlayer();
      }
    };

    // 🔧 FIX #44: Audio expand button usando EventManager
    const audioExpandBtn = document.getElementById('audio-expand-btn-mobile');
    if (audioExpandBtn) {
      this.eventManager.addEventListener(audioExpandBtn, 'click', audioExpandHandler);
    }

    const audioreaderBtn = document.getElementById('audioreader-btn');
    const audioreaderBtnTablet = document.getElementById('audioreader-btn-tablet');
    const audioreaderBtnMobile = document.getElementById('audioreader-btn-mobile');

    console.log('🎧 Attaching audio listeners:', {
      desktop: !!audioreaderBtn,
      tablet: !!audioreaderBtnTablet,
      mobile: !!audioreaderBtnMobile
    });

    // Usar EventManager para gestionar listeners de audio
    if (audioreaderBtn) {
      this.eventManager.addEventListener(audioreaderBtn, 'click', this._audioreaderHandler);
    }
    if (audioreaderBtnTablet) {
      this.eventManager.addEventListener(audioreaderBtnTablet, 'click', this._audioreaderHandler);
    }
    if (audioreaderBtnMobile) {
      this.eventManager.addEventListener(audioreaderBtnMobile, 'click', this._audioreaderHandler);
    }

    // 🔧 FIX #43: Support buttons tablet/mobile
    attachMultiDevice(
      ['support-btn-tablet', 'support-btn-mobile'],
      createModalHandler('donationsModal')
    );

    // 🔧 FIX #44: Android Download button usando EventManager
    const androidBtn = document.getElementById('android-download-btn');
    if (androidBtn) {
      this.eventManager.addEventListener(androidBtn, 'click', () => {
        const apkUrl = this.bookEngine.getLatestAPK();
        window.open(apkUrl, '_blank');
      });
    }

    // 🔧 FIX #44: Achievements button usando EventManager
    const achievementsBtn = document.getElementById('achievements-btn');
    if (achievementsBtn) {
      this.eventManager.addEventListener(achievementsBtn, 'click', () => {
        const achievementSystem = this.getDependency('achievementSystem'); // 🔧 FIX #87
        if (achievementSystem) {
          achievementSystem.showDashboardModal();
        }
      });
    }

    // 🔧 FIX #44: Content Adapter button usando EventManager
    const contentAdapterBtn = document.getElementById('content-adapter-btn');
    if (contentAdapterBtn) {
      this.eventManager.addEventListener(contentAdapterBtn, 'click', () => {
        const contentAdapter = this.getDependency('contentAdapter'); // 🔧 FIX #87
        if (contentAdapter) {
          contentAdapter.toggleSelector();
        } else {
          this.showToast('info', 'Cargando adaptador de contenido...');
          // Intentar cargar el módulo dinámicamente
          const lazyLoader = this.getDependency('lazyLoader'); // 🔧 FIX #87
          if (lazyLoader) {
            lazyLoader.load('contentAdapter').then(() => {
              const contentAdapterLoaded = this.getDependency('contentAdapter');
              if (contentAdapterLoaded) {
                contentAdapterLoaded.toggleSelector();
              }
            }).catch(() => {
              this.showToast('error', 'Error al cargar el adaptador de contenido');
            });
          }
        }
      });
    }

    // 🔧 FIX #44: Summary button (Auto-summary with AI) usando EventManager
    const summaryBtn = document.getElementById('summary-btn');
    if (summaryBtn) {
      this.eventManager.addEventListener(summaryBtn, 'click', () => {
        const autoSummary = this.getDependency('autoSummary'); // 🔧 FIX #87
        if (autoSummary && this.currentChapter) {
          const bookId = this.bookEngine.getCurrentBook();
          autoSummary.showSummaryModal(this.currentChapter, bookId);
        } else {
          this.showToast('info', 'Configura la IA para generar resúmenes');
        }
      });
    }

    // 🔧 FIX #44: Concept Map button usando EventManager
    const conceptMapBtn = document.getElementById('concept-map-btn');
    if (conceptMapBtn) {
      this.eventManager.addEventListener(conceptMapBtn, 'click', () => {
        const conceptMaps = this.getDependency('conceptMaps'); // 🔧 FIX #87
        if (conceptMaps) {
          conceptMaps.show();
        }
      });
    }

    // 🔧 FIX #44: Action Plans button usando EventManager
    const actionPlansBtn = document.getElementById('action-plans-btn');
    if (actionPlansBtn) {
      this.eventManager.addEventListener(actionPlansBtn, 'click', () => {
        const actionPlans = this.getDependency('actionPlans'); // 🔧 FIX #87
        if (actionPlans) {
          actionPlans.show();
        }
      });
    }

    // 🔧 FIX #43: Chapter Resources y Book Resources - versiones desktop/tablet
    attachMultiDevice(
      ['chapter-resources-btn'],
      createModalHandler('chapterResourcesModal', closeDropdownHelper, 'open', () => this.currentChapter?.id)
    );

    attachMultiDevice(
      ['book-resources-btn'],
      createModalHandler('resourcesViewer', closeDropdownHelper)
    );

    // 🔧 FIX #43: Donations/Support - versión unificada
    attachMultiDevice(
      ['donations-btn', 'support-btn'],
      createModalHandler('donationsModal')
    );

    // 🔧 FIX #43: Premium Edition button - versión consolidada (3 variantes)
    attachMultiDeviceWithMenuClose(
      ['premium-edition-btn', 'premium-edition-btn-mobile', 'premium-edition-btn-dropdown'],
      createMethodHandler('showPremiumDownloadModal')
    );

    // 🔧 FIX #43: Settings Modal - versión unificada (antes: 3 versiones duplicadas)
    attachMultiDevice(
      ['open-settings-modal-btn', 'open-settings-modal-btn-mobile', 'open-settings-modal-btn-tablet'],
      () => {
        // Cerrar menús si existen
        document.getElementById('mobile-menu')?.classList.add('hidden');
        document.getElementById('more-actions-dropdown')?.classList.add('hidden');

        const SettingsModal = this.getDependency('SettingsModal'); // 🔧 FIX #87
        if (SettingsModal) {
          const settingsModal = new SettingsModal();
          settingsModal.show();
        }
      }
    );

    // 🔧 FIX #43: Help Center - versión unificada (antes: 3 versiones duplicadas)
    attachMultiDevice(
      ['open-help-center-btn', 'open-help-center-btn-tablet', 'open-help-center-btn-mobile'],
      createModalHandler('helpCenterModal', () => {
        document.getElementById('mobile-menu')?.classList.add('hidden');
        document.getElementById('more-actions-dropdown')?.classList.add('hidden');
        document.getElementById('settings-dropdown')?.classList.add('hidden');
      })
    );

    // 🔧 FIX #43: Language Selector - versión consolidada (3 variantes)
    attachMultiDeviceWithMenuClose(
      ['language-selector-btn', 'language-selector-btn-mobile', 'language-selector-btn-dropdown'],
      createModalHandler('languageSelector')
    );

    // 🔧 FIX #43: Theme Toggle - versión consolidada (3 variantes)
    const themeToggleHandler = () => {
      const themeHelper = this.getDependency('themeHelper'); // 🔧 FIX #87
      if (themeHelper) {
        themeHelper.toggle();
        this.updateThemeIcons();
        this.showToast('info', `Tema: ${themeHelper.getThemeLabel()}`);
      }
    };

    attachMultiDeviceWithMenuClose(
      ['theme-toggle-btn', 'theme-toggle-btn-mobile', 'theme-toggle-btn-dropdown'],
      themeToggleHandler
    );

    // 🔧 FIX #43: Share Chapter - versión consolidada (3 variantes)
    attachMultiDeviceWithMenuClose(
      ['share-chapter-btn', 'share-chapter-btn-mobile', 'share-chapter-btn-dropdown'],
      () => this.shareCurrentChapter()
    );

    // 🔧 FIX #43: Learning Paths - versión consolidada (3 variantes)
    attachMultiDeviceWithMenuClose(
      ['learning-paths-btn-desktop', 'learning-paths-btn-mobile', 'learning-paths-btn-dropdown'],
      () => {
        const learningPaths = this.getDependency('learningPaths');
        if (learningPaths) {
          const currentBookId = this.bookEngine.getCurrentBook();
          learningPaths.open(currentBookId);
        } else {
          this.showToast('error', 'Learning Paths no disponible');
        }
      }
    );

    // 🔧 FIX #43: Cambio de libros - handlers unificados
    attachMultiDevice(
      ['manual-practico-btn'],
      createBookSwitchHandler('manual-practico')
    );

    attachMultiDevice(
      ['practicas-radicales-btn'],
      createBookSwitchHandler('practicas-radicales')
    );

    // ========================================================================
    // MOBILE MENU BUTTON LISTENERS
    // ========================================================================
    // Note: closeMobileMenuDropdown() helper is defined earlier in this function

    // 🔧 FIX #43: Notes y Timeline - versiones mobile
    attachMultiDevice(
      ['notes-btn-mobile'],
      createModalHandler('notesModal', closeMobileMenuDropdown, 'open', () => this.currentChapter?.id)
    );

    attachMultiDevice(
      ['timeline-btn-mobile'],
      createModalHandler('timelineViewer', closeMobileMenuDropdown)
    );

    // AI Chat button mobile - already has handler from earlier, no need to duplicate

    // 🔧 FIX #43: Chapter Resources, Learning Paths y Book Resources - versiones mobile
    attachMultiDevice(
      ['chapter-resources-btn-mobile'],
      createModalHandler('chapterResourcesModal', closeMobileMenuDropdown, 'open', () => this.currentChapter?.id)
    );

    // 🔧 FIX #43: Learning Paths mobile ya consolidado arriba con attachMultiDeviceWithMenuClose

    attachMultiDevice(
      ['book-resources-btn-mobile'],
      createModalHandler('resourcesViewer', closeMobileMenuDropdown)
    );

    // 🔧 FIX #43: Manual Práctico y Prácticas Radicales - versiones móviles unificadas
    attachMultiDevice(
      ['manual-practico-btn-mobile'],
      createBookSwitchHandler('manual-practico', closeMobileMenuDropdown)
    );

    attachMultiDevice(
      ['practicas-radicales-btn-mobile'],
      createBookSwitchHandler('practicas-radicales', closeMobileMenuDropdown)
    );

    // Audioreader button mobile - already has handler from line 926, no need to duplicate

    // 🔧 FIX #43: Koan - versión mobile (requiere setCurrentChapter)
    attachMultiDevice(['koan-btn-mobile'], () => {
      closeMobileMenuDropdown();
      const koanModal = this.getDependency('koanModal'); // 🔧 FIX #87
      if (koanModal) {
        koanModal.setCurrentChapter(this.currentChapter?.id);
        koanModal.open(this.currentChapter?.id);
      } else {
        this.showToast('error', 'error.koanNotAvailable');
      }
    });

    // 🔧 FIX #43: Android Download - versión mobile
    attachMultiDevice(['android-download-btn-mobile'], () => {
      closeMobileMenuDropdown();
      const apkUrl = this.bookEngine.getLatestAPK();
      window.open(apkUrl, '_blank');
    });

    // 🔧 FIX #43: Donations button mobile
    attachMultiDevice(
      ['donations-btn-mobile'],
      createModalHandler('donationsModal', closeMobileMenuDropdown)
    );

    // 🔧 FIX #44: Premium Edition button mobile usando EventManager
    // 🔧 FIX #43: Premium button mobile ya consolidado arriba con attachMultiDeviceWithMenuClose

    // 🔧 FIX #43: Language Selector mobile ya consolidado arriba con attachMultiDeviceWithMenuClose

    // 🔧 FIX #43: Theme Toggle mobile ya consolidado arriba con attachMultiDeviceWithMenuClose

    // 🔧 FIX #43: Share Chapter mobile ya consolidado arriba con attachMultiDeviceWithMenuClose

    // ========================================================================
    // TABLET DROPDOWN MENU (md breakpoint)
    // ========================================================================

    const moreActionsBtn = document.getElementById('more-actions-btn');
    const moreActionsDropdown = document.getElementById('more-actions-dropdown');

    if (moreActionsBtn && moreActionsDropdown) {
      // Toggle dropdown
      if (!this._moreActionsToggleHandler) {
        this._moreActionsToggleHandler = (e) => {
          e.stopPropagation();
          moreActionsDropdown.classList.toggle('hidden');
        };
      }

      // 🔧 FIX #44: More actions button usando EventManager
      this.eventManager.addEventListener(moreActionsBtn, 'click', this._moreActionsToggleHandler);

      // 🔧 FIX #44: Close dropdown when clicking outside usando EventManager
      if (!this._moreActionsClickOutsideAttached) {
        this._moreActionsClickOutsideHandler = (e) => {
          if (!moreActionsBtn.contains(e.target) && !moreActionsDropdown.contains(e.target)) {
            moreActionsDropdown.classList.add('hidden');
          }
        };
        this.eventManager.addEventListener(document, 'click', this._moreActionsClickOutsideHandler);
        this._moreActionsClickOutsideAttached = true;
      }
    }

    const closeDropdownHelper = () => {
      if (moreActionsDropdown) moreActionsDropdown.classList.add('hidden');
    };

    // ========================================================================
    // DESKTOP DROPDOWN MENUS (lg+ breakpoint)
    // ========================================================================

    // Helper para crear dropdown toggle
    const setupDropdown = (btnId, dropdownId) => {
      const btn = document.getElementById(btnId);
      const dropdown = document.getElementById(dropdownId);
      if (btn && dropdown) {
        // Guardar handler para evitar duplicación
        if (!this._dropdownHandlers) this._dropdownHandlers = {};

        const handlerKey = `${btnId}_${dropdownId}`;
        if (!this._dropdownHandlers[handlerKey]) {
          this._dropdownHandlers[handlerKey] = (e) => {
            e.stopPropagation();
            // Cerrar otros dropdowns
            ['tools-dropdown', 'book-features-dropdown', 'settings-dropdown'].forEach(id => {
              if (id !== dropdownId) {
                document.getElementById(id)?.classList.add('hidden');
              }
            });
            dropdown.classList.toggle('hidden');
          };
        }

        // 🔧 FIX #44: Dropdown toggle usando EventManager
        this.eventManager.addEventListener(btn, 'click', this._dropdownHandlers[handlerKey]);
      }
    };

    // Setup desktop dropdowns
    setupDropdown('tools-dropdown-btn', 'tools-dropdown');
    setupDropdown('book-features-dropdown-btn', 'book-features-dropdown');
    setupDropdown('settings-dropdown-btn', 'settings-dropdown');

    // 🔧 FIX #44: Cerrar dropdowns al hacer click fuera usando EventManager
    if (!this._desktopDropdownsClickOutsideAttached) {
      this._desktopDropdownsClickOutsideHandler = (e) => {
        const dropdowns = ['tools-dropdown', 'book-features-dropdown', 'settings-dropdown'];
        const btns = ['tools-dropdown-btn', 'book-features-dropdown-btn', 'settings-dropdown-btn'];

        let clickedInside = false;
        btns.forEach((btnId, i) => {
          const btn = document.getElementById(btnId);
          const dropdown = document.getElementById(dropdowns[i]);
          if ((btn && btn.contains(e.target)) || (dropdown && dropdown.contains(e.target))) {
            clickedInside = true;
          }
        });

        if (!clickedInside) {
          dropdowns.forEach(id => {
            document.getElementById(id)?.classList.add('hidden');
          });
        }
      };
      this.eventManager.addEventListener(document, 'click', this._desktopDropdownsClickOutsideHandler);
      this._desktopDropdownsClickOutsideAttached = true;
    }

    // Helper para cerrar todos los dropdowns desktop
    const closeDesktopDropdowns = () => {
      ['tools-dropdown', 'book-features-dropdown', 'settings-dropdown'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
      });
    };

    // 🔧 FIX #43: Notes y Timeline - versiones dropdown (tablet)
    attachMultiDevice(
      ['notes-btn-dropdown'],
      createModalHandler('notesModal', closeDropdownHelper, 'open', () => this.currentChapter?.id)
    );

    attachMultiDevice(
      ['timeline-btn-dropdown'],
      createModalHandler('timelineViewer', closeDropdownHelper)
    );

    // 🔧 FIX #43: Dropdown (tablet) - handlers unificados
    attachMultiDevice(
      ['chapter-resources-btn-dropdown'],
      createModalHandler('chapterResourcesModal', closeDropdownHelper, 'open', () => this.currentChapter?.id)
    );

    attachMultiDevice(
      ['book-resources-btn-dropdown'],
      createModalHandler('resourcesViewer', closeDropdownHelper)
    );

    attachMultiDevice(
      ['manual-practico-btn-dropdown'],
      createBookSwitchHandler('manual-practico', closeDropdownHelper)
    );

    attachMultiDevice(
      ['practicas-radicales-btn-dropdown'],
      createBookSwitchHandler('practicas-radicales', closeDropdownHelper)
    );

    attachMultiDevice(['koan-btn-dropdown'], () => {
      closeDropdownHelper();
      const koanModal = this.getDependency('koanModal'); // 🔧 FIX #87
      if (koanModal) {
        koanModal.setCurrentChapter(this.currentChapter?.id);
        koanModal.open(this.currentChapter?.id);
      }
    });

    attachMultiDevice(['android-btn-dropdown'], () => {
      closeDropdownHelper();
      const apkUrl = this.bookEngine.getLatestAPK();
      window.open(apkUrl, '_blank');
    });

    attachMultiDevice(
      ['donations-btn-dropdown'],
      createModalHandler('donationsModal', closeDropdownHelper)
    );

    // 🔧 FIX #43: Learning Paths dropdown ya consolidado arriba con attachMultiDeviceWithMenuClose

    // 🔧 FIX #43: Learning Paths desktop ya consolidado arriba con attachMultiDeviceWithMenuClose

    // 🔧 FIX #43: Premium button dropdown ya consolidado arriba con attachMultiDeviceWithMenuClose

    // 🔧 FIX #43: Language Selector dropdown ya consolidado arriba con attachMultiDeviceWithMenuClose

    // 🔧 FIX #43: Theme Toggle dropdown ya consolidado arriba con attachMultiDeviceWithMenuClose

    // 🔧 FIX #43: Share Chapter dropdown ya consolidado arriba con attachMultiDeviceWithMenuClose

    // 🔧 FIX #44: Chapter read toggle buttons usando EventManager
    const readToggleBtns = document.querySelectorAll('.chapter-read-toggle');
    readToggleBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', (e) => {
        e.stopPropagation(); // Evitar que se propague al chapter-item
        const chapterId = btn.getAttribute('data-chapter-id');
        this.bookEngine.toggleChapterRead(chapterId);
        // Re-renderizar sidebar para actualizar estado
        this.updateSidebar();
      });
    });

    // 🔧 FIX #44: Chapter title areas usando EventManager
    const chapterTitleAreas = document.querySelectorAll('.chapter-title-area');
    chapterTitleAreas.forEach(area => {
      this.eventManager.addEventListener(area, 'click', () => {
        const chapterId = area.getAttribute('data-chapter-id');
        this.navigateToChapter(chapterId);
        // 🔧 FIX #49: Cerrar sidebar en móvil sin re-render completo
        if (window.innerWidth < 768) {
          this.sidebarOpen = false;
          this.updateSidebar();
        }
      });
    });

    // 🔧 FIX #44: Chapter items usando EventManager
    const chapterItems = document.querySelectorAll('.chapter-item');
    chapterItems.forEach(item => {
      this.eventManager.addEventListener(item, 'click', (e) => {
        // Si se hizo click en el toggle o área de título, ya está manejado
        if (e.target.closest('.chapter-read-toggle') || e.target.closest('.chapter-title-area')) {
          return;
        }
        const chapterId = item.getAttribute('data-chapter-id');
        this.navigateToChapter(chapterId);
        // 🔧 FIX #49: Cerrar sidebar en móvil sin re-render completo
        if (window.innerWidth < 768) {
          this.sidebarOpen = false;
          this.updateSidebar();
        }
      });
    });

    // 🔧 FIX #44: Mark chapter as read button usando EventManager
    // Note: Este botón se re-renderiza dinámicamente, necesita un handler global
    if (!this._markReadHandler) {
      this._markReadHandler = () => {
        if (this.currentChapter?.id) {
          this.bookEngine.toggleChapterRead(this.currentChapter.id);
          const markReadSection = document.querySelector('.mark-read-section');
          if (markReadSection) {
            markReadSection.outerHTML = this.renderMarkAsReadButton();
            const newBtn = document.getElementById('mark-chapter-read-btn');
            if (newBtn) {
              this.eventManager.addEventListener(newBtn, 'click', this._markReadHandler);
            }
            Icons.init();
          }
          this.updateSidebar();
        }
      };
    }

    const markReadBtn = document.getElementById('mark-chapter-read-btn');
    if (markReadBtn) {
      this.eventManager.addEventListener(markReadBtn, 'click', this._markReadHandler);
    }

    // 🔧 FIX #44: Action cards usando EventManager
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(card => {
      this.eventManager.addEventListener(card, 'click', (e) => {
        const action = card.getAttribute('data-action');
        const button = e.target.closest('button');

        if (action === 'quiz') {
          const InteractiveQuiz = this.getDependency('InteractiveQuiz'); // 🔧 FIX #87
          if (InteractiveQuiz && this.currentChapter && this.currentChapter.quiz) {
            const quiz = new InteractiveQuiz(this.currentChapter.quiz, this.currentChapter.id);
            quiz.start();
          }
        } else if (action === 'resources') {
          const chapterResourcesModal = this.getDependency('chapterResourcesModal'); // 🔧 FIX #87
          if (chapterResourcesModal) {
            const chapterId = (this.currentChapter && this.currentChapter.id) ? this.currentChapter.id : null;
            chapterResourcesModal.open(chapterId);
          }
        } else if (action === 'reflection') {
          // 🔧 FIX #48: Usar método seguro con validación
          this.scrollToElement('.closing-question');
        }
      });
    });

    // 🔧 FIX #44: Previous/Next buttons usando EventManager
    const prevBtn = document.getElementById('prev-chapter');
    if (prevBtn) {
      this.eventManager.addEventListener(prevBtn, 'click', () => {
        const chapterId = prevBtn.getAttribute('data-chapter-id');
        this.navigateToChapter(chapterId);
      });
    }

    const nextBtn = document.getElementById('next-chapter');
    if (nextBtn) {
      this.eventManager.addEventListener(nextBtn, 'click', () => {
        const chapterId = nextBtn.getAttribute('data-chapter-id');
        this.navigateToChapter(chapterId);
      });
    }

    // 🔧 FIX #44: Cross-reference clicks usando EventManager
    const crossRefItems = document.querySelectorAll('.reference');
    crossRefItems.forEach(item => {
      this.eventManager.addEventListener(item, 'click', async () => {
        const targetBook = item.getAttribute('data-book');
        const targetChapter = item.getAttribute('data-chapter');

        if (!targetBook) {
          this.showToast('warning', 'Referencia sin libro destino');
          return;
        }

        try {
          this.showToast('info', `Navegando a ${targetBook}...`);
          await this.bookEngine.loadBook(targetBook);
          this.applyBookTheme();

          if (targetChapter) {
            const chapters = this.bookEngine.getChapters();
            const chapter = chapters.find(c => c.id === targetChapter || c.slug === targetChapter);
            if (chapter) {
              await this.navigateTo(chapter.id);
            } else {
              await this.navigateTo(chapters[0]?.id);
            }
          } else {
            const chapters = this.bookEngine.getChapters();
            if (chapters.length > 0) {
              await this.navigateTo(chapters[0].id);
            }
          }

          this.showToast('success', `Ahora leyendo: ${this.bookEngine.getCurrentBookData()?.title || targetBook}`);
        } catch (error) {
          console.error('Error navegando a referencia cruzada:', error);
          this.showToast('error', 'Error al cargar el libro referenciado');
        }
      });
    });

    // 🔧 FIX #44: Premium edition download button usando EventManager
    const downloadPremiumBtn = document.getElementById('download-premium-btn');
    if (downloadPremiumBtn) {
      this.eventManager.addEventListener(downloadPremiumBtn, 'click', () => {
        this.showPremiumDownloadModal();
      });
    }

    // ========================================================================
    // 🔧 FIX #44: EXERCISE LINK BUTTONS usando EventManager
    // ========================================================================
    const exerciseLinkBtns = document.querySelectorAll('.exercise-link-btn');
    exerciseLinkBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', async () => {
        const targetBook = btn.getAttribute('data-book');
        const exerciseId = btn.getAttribute('data-exercise-id');
        const exerciseTitle = btn.getAttribute('data-exercise-title');

        try {
          // Cargar el libro de destino
          await this.bookEngine.loadBook(targetBook);
          this.applyBookTheme();

          // Buscar el capítulo que corresponde al ejercicio
          let targetChapterId = null;

          if (exerciseId) {
            // Para Manual Práctico, el exerciseId es directamente el ID del capítulo
            // Para Prácticas Radicales, también es el ID del capítulo
            targetChapterId = exerciseId;

            // Verificar que el capítulo existe, si no buscar por ID de ejercicio
            const chapter = this.bookEngine.navigateToChapter(targetChapterId);
            if (!chapter) {
              targetChapterId = this.bookEngine.findChapterByExerciseId(exerciseId);
            }
          } else if (exerciseTitle) {
            // Buscar por título de ejercicio (fallback)
            targetChapterId = this.bookEngine.findChapterByExerciseTitle(exerciseTitle);
          }

          // 🔧 FIX #49: Usar navigateToChapter() para actualización parcial
          if (targetChapterId) {
            this.navigateToChapter(targetChapterId);
          } else {
            this.navigateToChapter(this.bookEngine.getFirstChapter().id);
          }

        } catch (error) {
          console.error('Error navigating to exercise:', error);
          this.showToast('error', 'error.navigationFailed');
        }
      });
    });

    // ========================================================================
    // CROSS REFERENCE BUTTONS - Navigate to related books
    // ========================================================================
    const crossRefBtns = document.querySelectorAll('.cross-reference-btn');
    crossRefBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', async () => {
        const targetBook = btn.getAttribute('data-book');
        const targetChapterId = btn.getAttribute('data-chapter-id');

        try {
          // Cargar el libro de destino
          await this.bookEngine.loadBook(targetBook);
          this.applyBookTheme();

          // 🔧 FIX #48: Verificación de existencia en cross-references
          // Navegar al capítulo específico o al primero si no se especifica
          if (targetChapterId) {
            // Verificar que el capítulo existe antes de navegar
            const chapter = this.bookEngine.getChapter(targetChapterId);
            if (!chapter) {
              console.warn(`Cross-reference target not found: ${targetChapterId}`);
              this.showToast('warning', 'Referencia no encontrada');
              // Navegar al primer capítulo como fallback
              this.navigateToChapter(this.bookEngine.getFirstChapter().id);
              return;
            }
            this.navigateToChapter(targetChapterId);
          } else {
            this.navigateToChapter(this.bookEngine.getFirstChapter().id);
          }

        } catch (error) {
          console.error('Error navigating to cross reference:', error);
          this.showToast('error', 'error.navigationFailed');
        }
      });
    });

    // ========================================================================
    // ACTION LINK BUTTONS - Navigate to Guía de Acciones
    // ========================================================================

    // Botón para abrir el libro completo de Guía de Acciones
    const openActionsBookBtns = document.querySelectorAll('.open-actions-book-btn');
    openActionsBookBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', async () => {
        const targetBook = btn.getAttribute('data-book');

        try {
          await this.bookEngine.loadBook(targetBook);
          this.applyBookTheme();

          // 🔧 FIX #49: Navegar usando método con actualización parcial
          const firstChapter = this.bookEngine.getFirstChapter();
          this.navigateToChapter(firstChapter?.id || 'prologo');

        } catch (error) {
          console.error('Error opening actions book:', error);
          this.showToast('error', 'Error al abrir la Guía de Acciones');
        }
      });
    });

    // Botones para abrir una acción específica
    const openActionDetailBtns = document.querySelectorAll('.open-action-detail-btn');
    openActionDetailBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', async () => {
        const targetBook = btn.getAttribute('data-book');
        const targetChapterId = btn.getAttribute('data-chapter');

        try {
          await this.bookEngine.loadBook(targetBook);
          this.applyBookTheme();

          // 🔧 FIX #48: Verificación de existencia en cross-references
          // Navegar al capítulo de la acción específica
          if (targetChapterId) {
            const chapter = this.bookEngine.getChapter(targetChapterId);
            if (!chapter) {
              console.warn(`Action detail target not found: ${targetChapterId}`);
              this.showToast('warning', 'Referencia no encontrada');
              this.navigateToChapter(this.bookEngine.getFirstChapter().id);
              return;
            }
            this.currentChapter = this.bookEngine.navigateToChapter(targetChapterId);
          }

          // 🔧 FIX #49: Usar navigateToChapter() para actualización parcial
          if (!this.currentChapter) {
            this.navigateToChapter(this.bookEngine.getFirstChapter().id);
          }

          const contentArea = document.querySelector('.chapter-content');
          if (contentArea) contentArea.scrollTop = 0;

        } catch (error) {
          console.error('Error navigating to action detail:', error);
          this.showToast('error', 'Error al abrir la acción');
        }
      });
    });

    // ========================================================================
    // TOOLKIT LINK BUTTONS - Navigate to Toolkit de Transición
    // ========================================================================

    // Botón para abrir un ejercicio específico del Toolkit
    const toolkitExerciseBtns = document.querySelectorAll('.toolkit-exercise-btn');
    toolkitExerciseBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', async () => {
        const targetBook = btn.getAttribute('data-book');
        const targetChapterId = btn.getAttribute('data-chapter-id');

        try {
          await this.bookEngine.loadBook(targetBook);
          this.applyBookTheme();

          // 🔧 FIX #48: Verificación de existencia en cross-references
          // Navegar al capítulo del ejercicio específico
          if (targetChapterId) {
            const chapter = this.bookEngine.getChapter(targetChapterId);
            if (!chapter) {
              console.warn(`Toolkit exercise target not found: ${targetChapterId}`);
              this.showToast('warning', 'Referencia no encontrada');
              this.navigateToChapter(this.bookEngine.getFirstChapter().id);
              return;
            }
            this.currentChapter = this.bookEngine.navigateToChapter(targetChapterId);
          }

          // 🔧 FIX #49: Usar navigateToChapter() para actualización parcial
          if (!this.currentChapter) {
            this.navigateToChapter(this.bookEngine.getFirstChapter().id);
          }

          const contentArea = document.querySelector('.chapter-content');
          if (contentArea) contentArea.scrollTop = 0;

        } catch (error) {
          console.error('Error navigating to toolkit exercise:', error);
          this.showToast('error', 'Error al abrir el ejercicio del Toolkit');
        }
      });
    });

    // Botón para abrir el libro completo del Toolkit
    const openToolkitBookBtns = document.querySelectorAll('.open-toolkit-book-btn');
    openToolkitBookBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', async () => {
        const targetBook = btn.getAttribute('data-book');

        try {
          await this.bookEngine.loadBook(targetBook);
          this.applyBookTheme();

          // 🔧 FIX #49: Navegar usando método con actualización parcial
          const firstChapter = this.bookEngine.getFirstChapter();
          this.navigateToChapter(firstChapter?.id || 'toolkit-1');

        } catch (error) {
          console.error('Error opening toolkit book:', error);
          this.showToast('error', 'Error al abrir el Toolkit de Transición');
        }
      });
    });

    // ========================================================================
    // MANIFIESTO LINK BUTTONS - Navigate to Manifiesto from Manual/Toolkit
    // ========================================================================
    const manifiestoLinkBtns = document.querySelectorAll('.manifiesto-link-btn');
    manifiestoLinkBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', async () => {
        const targetBook = btn.getAttribute('data-book');
        const targetChapterId = btn.getAttribute('data-chapter-id');

        try {
          await this.bookEngine.loadBook(targetBook);
          this.applyBookTheme();

          if (targetChapterId) {
            this.currentChapter = this.bookEngine.navigateToChapter(targetChapterId);
          }

          // 🔧 FIX #49: Usar navigateToChapter() para actualización parcial
          if (!this.currentChapter) {
            this.navigateToChapter(this.bookEngine.getFirstChapter().id);
          }

          const contentArea = document.querySelector('.chapter-content');
          if (contentArea) contentArea.scrollTop = 0;

        } catch (error) {
          console.error('Error navigating to Manifiesto:', error);
          this.showToast('error', 'Error al abrir el Manifiesto');
        }
      });
    });

    // ========================================================================
    // PARENT BOOK BUTTONS - Navigate back to main book from exercises
    // ========================================================================
    const parentBookBtns = document.querySelectorAll('.parent-book-btn');
    parentBookBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', async () => {
        const targetBook = btn.getAttribute('data-book');
        const targetChapterId = btn.getAttribute('data-chapter-id');

        try {
          await this.bookEngine.loadBook(targetBook);
          this.applyBookTheme();

          // 🔧 FIX #48: Verificación de existencia en cross-references
          // Navegar al capítulo del libro principal
          if (targetChapterId) {
            const chapter = this.bookEngine.getChapter(targetChapterId);
            if (!chapter) {
              console.warn(`Parent book target not found: ${targetChapterId}`);
              this.showToast('warning', 'Referencia no encontrada');
              this.navigateToChapter(this.bookEngine.getFirstChapter().id);
              return;
            }
            this.currentChapter = this.bookEngine.navigateToChapter(targetChapterId);
          }

          // 🔧 FIX #49: Usar navigateToChapter() para actualización parcial
          if (!this.currentChapter) {
            this.navigateToChapter(this.bookEngine.getFirstChapter().id);
          }

          const contentArea = document.querySelector('.chapter-content');
          if (contentArea) contentArea.scrollTop = 0;

        } catch (error) {
          console.error('Error navigating to parent book:', error);
          this.showToast('error', 'Error al abrir el libro principal');
        }
      });
    });

    // ========================================================================
    // AI SUGGESTIONS - Attach click handlers for chapter suggestions
    // ========================================================================
    const aiSuggestions = this.getDependency('aiSuggestions'); // 🔧 FIX #87
    if (aiSuggestions) {
      aiSuggestions.attachToChapterContent();
    }
  }

  // ==========================================================================
  // NAVEGACIÓN
  // ==========================================================================

  navigateToChapter(chapterId) {
    try {
      const chapter = this.bookEngine.navigateToChapter(chapterId);
      if (chapter) {
        this.currentChapter = chapter;

        // 🔧 FIX #49 + HOTFIX: Verificar si ya existe la estructura DOM Y está visible
        // Si no existe O no está visible, hacer render completo. Si existe, actualización parcial.
        const container = document.getElementById('book-reader-view');
        const contentArea = document.querySelector('.chapter-content');
        const isContainerVisible = container && !container.classList.contains('hidden');
        const hasRendered = contentArea !== null && isContainerVisible;

        if (!hasRendered) {
          // Primera vez O container oculto: render completo
          this.render();
          this.attachEventListeners();

          // 🔧 HOTFIX: Asegurar que el container esté visible
          if (container) {
            container.classList.remove('hidden');
          }
        } else {
          // 🔧 FIX #49: Ya renderizado - solo actualizar las partes que cambian
          // Evita re-renderizar TODO el reader, mejora rendimiento significativamente
          this.updateChapterContent();
          this.updateHeader();
          this.updateSidebar();
          this.updateFooterNav();
        }

        // Scroll to top
        const finalContentArea = document.querySelector('.chapter-content');
        if (finalContentArea) {
          finalContentArea.scrollTop = 0;
        }
      }
    } catch (error) {
      // 🔧 FIX #94: Error boundary para navegación de capítulos
      console.error('[BookReader] Error navegando a capítulo:', error);
      this.captureError(error, {
        context: 'navigate_to_chapter',
        chapterId: chapterId,
        filename: 'book-reader.js'
      });
      this.showToast('error', 'Error al cargar el capítulo');
    }
  }

  // 🔧 FIX #48: Scroll seguro con validación de existencia
  /**
   * Scroll suave a un elemento con validación de existencia
   * @param {string} selector - Selector CSS del elemento objetivo
   */
  scrollToElement(selector) {
    const targetElement = document.querySelector(selector);

    if (!targetElement) {
      console.warn(`[BookReader] Elemento no encontrado: ${selector}`);
      if (window.toast) {
        window.toast.warning('Referencia no encontrada');
      } else {
        this.showToast('warning', 'Referencia no encontrada');
      }
      return;
    }

    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // 🔧 FIX #43: Handler reutilizable para cambio de libros
  /**
   * Cambia al libro especificado con confirmación del usuario
   * @param {string} bookId - ID del libro de destino
   */
  async handleBookSwitch(bookId) {
    try {
      const allBooks = this.bookEngine.getAllBooks();
      const targetBook = allBooks.find(b => b.id === bookId);

      if (!targetBook) {
        console.warn(`[BookReader] Libro no encontrado: ${bookId}`);
        this.showToast('error', 'Libro no encontrado');
        return;
      }

      // Confirmar cambio de libro
      const currentBookId = this.bookEngine.getCurrentBook();
      if (currentBookId === bookId) {
        this.showToast('info', 'Ya estás leyendo este libro');
        return;
      }

      const confirmMessage = this.i18n?.t('reader.confirmBookSwitch', { title: targetBook.title })
        || `¿Cambiar a "${targetBook.title}"?`;

      if (!confirm(confirmMessage)) {
        return;
      }

      // Cargar el libro de destino
      await this.bookEngine.loadBook(bookId);
      this.applyBookTheme();

      // Navegar al primer capítulo
      const firstChapter = this.bookEngine.getFirstChapter();
      if (firstChapter) {
        this.navigateToChapter(firstChapter.id);
      } else {
        // Fallback: render completo si no hay primer capítulo
        this.render();
        this.attachEventListeners();
      }

      this.showToast('success', this.i18n?.t('reader.bookSwitched') || 'Libro cambiado exitosamente');
    } catch (error) {
      console.error('[BookReader] Error cambiando de libro:', error);
      this.captureError(error, {
        context: 'handle_book_switch',
        bookId: bookId,
        filename: 'book-reader.js'
      });
      this.showToast('error', 'Error al cambiar de libro');
    }
  }

  // 🔧 FIX #49: Métodos de actualización parcial para evitar re-renderizados completos

  /**
   * 🔧 FIX #49: Actualiza solo el contenido del capítulo sin reconstruir todo el reader
   * Evita re-renderizado completo, solo actualiza el área de contenido del capítulo
   */
  updateChapterContent() {
    try {
      const contentContainer = document.querySelector('.chapter-content');
      if (contentContainer) {
        // 🔧 FIX #49: Renderizado parcial - solo chapter content
        contentContainer.innerHTML = this.renderChapterContent();

        // 🔧 FIX #49: Re-attach event listeners solo para elementos del contenido
        this.attachContentListeners();
      }
    } catch (error) {
      // 🔧 FIX #94: Error boundary para actualización de contenido
      console.error('[BookReader] Error actualizando contenido:', error);
      this.captureError(error, {
        context: 'navigate_to_chapter',
        chapterId: chapterId,
        filename: 'book-reader.js'
      });
    }
  }

  /**
   * 🔧 FIX #49: Actualiza solo el header sin reconstruir todo el reader
   * Evita re-renderizado completo, solo actualiza la sección del header
   */
  updateHeader() {
    try {
      const headerContainer = document.querySelector('.main-content > .header, .main-content > header');
      if (headerContainer) {
        // 🔧 FIX #49: Renderizado parcial - solo header
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.renderHeader();
        const newHeader = tempDiv.firstElementChild;
        if (newHeader) {
          headerContainer.replaceWith(newHeader);
        }
      }
    } catch (error) {
      // 🔧 FIX #94: Error boundary para actualización de header
      console.error('[BookReader] Error actualizando header:', error);
      this.captureError(error, {
        context: 'navigate_to_chapter',
        chapterId: chapterId,
        filename: 'book-reader.js'
      });
    }
  }

  /**
   * 🔧 FIX #49: Actualiza solo el sidebar sin reconstruir todo el reader
   * Evita re-renderizado completo, solo actualiza el sidebar y preserva su estado
   */
  updateSidebar() {
    try {
      const sidebarContainer = document.querySelector('.sidebar');
      if (sidebarContainer) {
        // 🔧 FIX #49: Renderizado parcial - solo sidebar
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.renderSidebar();

        // 🔧 BUGFIX: renderSidebar() puede retornar backdrop + sidebar
        // Buscar específicamente el elemento con clase .sidebar
        const newSidebar = tempDiv.querySelector('.sidebar');
        if (newSidebar) {
          // 🔧 FIX #49: Preservar estado de apertura del sidebar
          if (this.sidebarOpen) {
            newSidebar.classList.remove('-translate-x-full');
          } else {
            newSidebar.classList.add('-translate-x-full');
          }
          sidebarContainer.replaceWith(newSidebar);
        }

        // 🔧 FIX #49: Actualizar o remover backdrop si existe
        const oldBackdrop = document.getElementById('sidebar-backdrop');
        const newBackdrop = tempDiv.querySelector('#sidebar-backdrop');
        if (newBackdrop && this.sidebarOpen) {
          if (oldBackdrop) {
            oldBackdrop.replaceWith(newBackdrop);
          } else {
            document.body.appendChild(newBackdrop);
          }
        } else if (oldBackdrop) {
          oldBackdrop.remove();
        }

        // 🔧 FIX #49: Re-attach listeners para chapter items en el sidebar
        this.attachChapterListeners();

        // Re-inicializar iconos
        Icons.init();
      }
    } catch (error) {
      // 🔧 FIX #94: Error boundary para actualización de sidebar
      console.error('[BookReader] Error actualizando sidebar:', error);
      this.captureError(error, {
        context: 'navigate_to_chapter',
        chapterId: chapterId,
        filename: 'book-reader.js'
      });
    }
  }

  /**
   * 🔧 FIX #49: Actualiza solo la navegación inferior sin reconstruir todo el reader
   * Evita re-renderizado completo, solo actualiza los botones de navegación prev/next
   */
  updateFooterNav() {
    try {
      const footerNavContainer = document.querySelector('.main-content > .block');
      if (footerNavContainer) {
        // 🔧 FIX #49: Renderizado parcial - solo footer nav
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.renderFooterNav();
        footerNavContainer.innerHTML = tempDiv.innerHTML;

        // 🔧 FIX #49: Re-attach event listeners solo para los botones de navegación
        this.attachNavigationListeners();
      }
    } catch (error) {
      // 🔧 FIX #94: Error boundary para actualización de footer nav
      console.error('[BookReader] Error actualizando footer nav:', error);
      this.captureError(error, {
        context: 'navigate_to_chapter',
        chapterId: chapterId,
        filename: 'book-reader.js'
      });
    }
  }

  /**
   * 🔧 FIX #49: Adjunta event listeners solo para los botones de navegación (prev/next)
   * Evita re-attachar todos los listeners del reader durante actualización parcial
   */
  attachNavigationListeners() {
    try {
      const prevBtn = document.getElementById('prev-chapter-btn');
      const nextBtn = document.getElementById('next-chapter-btn');

      // 🔧 FIX #44: Usar EventManager para navigation buttons
      if (prevBtn) {
        const chapterId = prevBtn.getAttribute('data-chapter-id');
        if (chapterId) {
          this.eventManager.addEventListener(prevBtn, 'click', () => this.navigateToChapter(chapterId));
        }
      }

      if (nextBtn) {
        const chapterId = nextBtn.getAttribute('data-chapter-id');
        if (chapterId) {
          this.eventManager.addEventListener(nextBtn, 'click', () => this.navigateToChapter(chapterId));
        }
      }
    } catch (error) {
      // 🔧 FIX #94: Error boundary para attach de listeners
      console.error('[BookReader] Error adjuntando navigation listeners:', error);
      this.captureError(error, {
        context: 'navigate_to_chapter',
        chapterId: chapterId,
        filename: 'book-reader.js'
      });
    }
  }

  /**
   * 🔧 FIX #49: Adjunta event listeners solo para elementos dentro del contenido del capítulo
   * Usado después de updateChapterContent() para restaurar interactividad
   */
  attachContentListeners() {
    try {
      // Mark chapter as read button
      if (!this._markReadHandler) {
        this._markReadHandler = () => {
          if (this.currentChapter?.id) {
            this.bookEngine.toggleChapterRead(this.currentChapter.id);
            const markReadSection = document.querySelector('.mark-read-section');
            if (markReadSection) {
              markReadSection.outerHTML = this.renderMarkAsReadButton();
              const newBtn = document.getElementById('mark-chapter-read-btn');
              if (newBtn) {
                this.eventManager.addEventListener(newBtn, 'click', this._markReadHandler);
              }
              Icons.init();
            }
            this.updateSidebar();
          }
        };
      }

      const markReadBtn = document.getElementById('mark-chapter-read-btn');
      if (markReadBtn) {
        this.eventManager.addEventListener(markReadBtn, 'click', this._markReadHandler);
      }

      // Action cards (solo las que tienen data-action, las otras usan onclick en HTML)
      const actionCards = document.querySelectorAll('.action-card');
      actionCards.forEach(card => {
        const action = card.getAttribute('data-action');
        if (action) {
          this.eventManager.addEventListener(card, 'click', (e) => {
            const button = e.target.closest('button');

            if (action === 'quiz') {
              const InteractiveQuiz = this.getDependency('InteractiveQuiz');
              if (InteractiveQuiz && this.currentChapter && this.currentChapter.quiz) {
                const quiz = new InteractiveQuiz(this.currentChapter.quiz, this.currentChapter.id);
                quiz.start();
              }
            } else if (action === 'resources') {
              const chapterResourcesModal = this.getDependency('chapterResourcesModal');
              if (chapterResourcesModal) {
                const chapterId = (this.currentChapter && this.currentChapter.id) ? this.currentChapter.id : null;
                chapterResourcesModal.open(chapterId);
              }
            } else if (action === 'reflection') {
              // 🔧 FIX #48: Usar método seguro con validación
              this.scrollToElement('.closing-question');
            }
          });
        }
      });

      // Previous/Next chapter buttons en footer
      const prevBtn = document.getElementById('prev-chapter');
      if (prevBtn) {
        this.eventManager.addEventListener(prevBtn, 'click', () => {
          const chapterId = prevBtn.getAttribute('data-chapter-id');
          this.navigateToChapter(chapterId);
        });
      }

      const nextBtn = document.getElementById('next-chapter');
      if (nextBtn) {
        this.eventManager.addEventListener(nextBtn, 'click', () => {
          const chapterId = nextBtn.getAttribute('data-chapter-id');
          this.navigateToChapter(chapterId);
        });
      }

      // AI Suggestions (si está disponible)
      const aiSuggestions = this.getDependency('aiSuggestions');
      if (aiSuggestions) {
        aiSuggestions.attachToChapterContent();
      }

      // Re-inicializar iconos
      Icons.init();

    } catch (error) {
      // 🔧 FIX #94: Error boundary para attach de content listeners
      console.error('[BookReader] Error adjuntando content listeners:', error);
      this.captureError(error, {
        context: 'attach_content_listeners',
        chapterId: this.currentChapter?.id,
        filename: 'book-reader.js'
      });
    }
  }

  // ==========================================================================
  // PREMIUM EDITION BUTTON
  // ==========================================================================

  isLastChapter() {
    if (!this.currentChapter) return false;
    const nextChapter = this.bookEngine.getNextChapter(this.currentChapter.id);
    return !nextChapter; // Es el último si no hay siguiente
  }

  renderPremiumEditionButton() {
    const bookId = this.bookEngine.getCurrentBook();
    const premiumFile = `downloads/${bookId}-premium.html`;

    return `
      <div class="premium-edition-box my-12 p-8 bg-gradient-to-r from-amber-900/20 to-yellow-900/20 border-2 border-amber-500/30 rounded-2xl">
        <div class="flex flex-col md:flex-row items-start md:items-center gap-6">
          <!-- Icon -->
          <div class="flex-shrink-0 w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>

          <!-- Content -->
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-amber-300 mb-2">${this.i18n.t('premium.title')}</h3>
            <p class="text-gray-300 mb-1">${this.i18n.t('premium.description')}</p>
            <p class="text-sm text-gray-400">${this.i18n.t('premium.features')}</p>
          </div>

          <!-- Buttons -->
          <div class="flex-shrink-0 flex flex-col gap-3">
            <button id="download-premium-btn"
                    data-premium-file="${premiumFile}"
                    class="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold rounded-lg transition flex items-center gap-2 shadow-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              ${this.i18n.t('premium.download')}
            </button>
            <div class="text-center">
              <span class="text-sm text-amber-400">${this.i18n.t('premium.contribution')}: <strong>15€</strong></span>
              <span class="text-xs text-gray-500 block">${this.i18n.t('premium.optional')}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================================
  // MODAL DE DESCARGA PREMIUM
  // ============================================================================

  showPremiumDownloadModal() {
    const bookId = this.bookEngine.getCurrentBook();
    const premiumFile = `downloads/${bookId}-premium.html`;
    const bookData = this.bookEngine.getCurrentBookData();
    const bookTitle = bookData?.title || 'Libro';

    // Remover modal existente si hay
    const existingModal = document.getElementById('premium-download-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'premium-download-modal';
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.style.animation = 'fadeIn 0.3s ease-out';

    modal.innerHTML = `
      <div class="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-amber-600/50 rounded-2xl max-w-2xl w-full shadow-2xl" style="animation: slideUp 0.3s ease-out">
        <!-- Header -->
        <div class="bg-gradient-to-r from-amber-900/40 to-amber-800/30 border-b border-amber-700/50 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div class="flex items-center gap-3">
            <svg class="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 class="text-xl md:text-2xl font-bold text-amber-200">${this.i18n.t('premium.title')}</h3>
          </div>
          <button id="close-premium-modal" class="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 md:p-8">
          <div class="mb-6">
            <h4 class="text-lg md:text-xl font-semibold text-amber-300 mb-3">${this.i18n.t('premium.whatIncludes')}</h4>
            <ul class="space-y-2 text-slate-300 text-sm md:text-base">
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <span>${this.i18n.t('premium.feature1')}</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <span>${this.i18n.t('premium.feature2')}</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <span>${this.i18n.t('premium.feature3')}</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <span>${this.i18n.t('premium.feature4')}</span>
              </li>
            </ul>
          </div>

          <div class="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4 md:p-6 mb-6">
            <h4 class="text-lg font-semibold text-amber-300 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"></path>
              </svg>
              ${this.i18n.t('premium.suggestedContribution')}
            </h4>
            <p class="text-slate-300 mb-4 text-sm md:text-base">
              ${this.i18n.t('premium.contributionText')}
            </p>
            <p class="text-sm text-slate-400 italic">
              ✨ ${this.i18n.t('premium.supportText')}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-3">
            <a href="https://www.paypal.com/paypalme/codigodespierto"
               target="_blank"
               rel="noopener noreferrer"
               class="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"></path>
              </svg>
              ${this.i18n.t('premium.contributePaypal')}
            </a>

            <button id="download-free-btn"
                    data-premium-file="${premiumFile}"
                    class="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              ${this.i18n.t('premium.downloadFree')}
            </button>
          </div>

          <p class="mt-4 text-xs text-center text-slate-500">
            ${this.i18n.t('premium.freeNote')}
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 🔧 FIX #44: Event listeners usando EventManager
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
  // SHARE HELPERS
  // ==========================================================================

  shareCurrentChapter() {
    const shareHelper = this.getDependency('shareHelper'); // 🔧 FIX #87
    if (!shareHelper || !this.currentChapter) return;

    const bookData = this.bookEngine?.getCurrentBookData();
    const bookTitle = bookData?.title || 'Colección Nuevo Ser';
    const chapterTitle = this.currentChapter.title || '';
    const progress = this.bookEngine?.getProgress(this.bookEngine.getCurrentBook());

    // Get epigraph or first paragraph as quote
    let quote = '';
    if (this.currentChapter.epigraph?.text) {
      quote = this.currentChapter.epigraph.text;
    } else if (this.currentChapter.closingQuestion) {
      quote = this.currentChapter.closingQuestion;
    }

    if (quote) {
      shareHelper.shareQuote({
        quote: quote.substring(0, 280), // Limit to tweet-like length
        author: this.currentChapter.epigraph?.author || '',
        bookTitle: bookTitle,
        chapterTitle: chapterTitle
      });
    } else {
      // Share progress instead
      shareHelper.shareProgress({
        bookTitle: bookTitle,
        progress: progress?.percentage || 0,
        chaptersRead: progress?.read || 0,
        totalChapters: progress?.total || 0
      });
    }
  }

  // ==========================================================================
  // THEME HELPERS
  // ==========================================================================

  updateThemeIcons() {
    const themeHelper = this.getDependency('themeHelper'); // 🔧 FIX #87
    if (!themeHelper) return;

    const icon = themeHelper.getThemeIcon();
    const label = themeHelper.getThemeLabel();

    // Update all theme icons and labels
    const iconElements = ['theme-icon', 'theme-icon-mobile', 'theme-icon-dropdown', 'theme-icon-bib'];
    const labelElements = ['theme-label', 'theme-label-mobile', 'theme-label-dropdown', 'theme-label-bib'];

    iconElements.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = icon;
    });

    labelElements.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = label;
    });
  }

  // ==========================================================================
  // METADATA-DRIVEN NAVIGATION
  // ==========================================================================

  /**
   * Navigate to a specific exercise in Manual Práctico
   * Called from chapter-resources-modal.js exercise cards
   */
  async navigateToExercise(bookId, exerciseId) {
    try {
      // Close chapter resources modal if open
      const chapterResourcesModal = this.getDependency('chapterResourcesModal'); // 🔧 FIX #87
      if (chapterResourcesModal) {
        chapterResourcesModal.close();
      }

      // Load the target book
      await this.bookEngine.loadBook(bookId);
      this.applyBookTheme();

      // 🔧 FIX #49: Navigate usando método con actualización parcial
      const chapter = this.bookEngine.getChapterById(exerciseId);
      if (chapter) {
        this.navigateToChapter(exerciseId);
      } else {
        this.showToast('warning', 'Ejercicio no encontrado, mostrando primer capítulo');
        this.navigateToChapter(this.bookEngine.getFirstChapter().id);
      }

      this.showToast('success', 'Navegando al ejercicio...');

    } catch (error) {
      console.error('Error navigating to exercise:', error);
      this.showToast('error', 'Error al navegar al ejercicio');
    }
  }

  /**
   * Navigate to a specific practice in Prácticas Radicales
   * Called from chapter-resources-modal.js practice cards
   */
  async navigateToPractice(bookId, practiceId) {
    try {
      // Close chapter resources modal if open
      const chapterResourcesModal = this.getDependency('chapterResourcesModal'); // 🔧 FIX #87
      if (chapterResourcesModal) {
        chapterResourcesModal.close();
      }

      // Load the target book
      await this.bookEngine.loadBook(bookId);
      this.applyBookTheme();

      // 🔧 FIX #49: Navigate usando método con actualización parcial
      const chapter = this.bookEngine.getChapterById(practiceId);
      if (chapter) {
        this.navigateToChapter(practiceId);
      } else {
        this.showToast('warning', 'Práctica no encontrada, mostrando primer capítulo');
        this.navigateToChapter(this.bookEngine.getFirstChapter().id);
      }

      this.showToast('success', 'Navegando a la práctica...');

    } catch (error) {
      console.error('Error navigating to practice:', error);
      this.showToast('error', 'Error al navegar a la práctica');
    }
  }

}

// Exportar para uso global
window.BookReader = BookReader;
