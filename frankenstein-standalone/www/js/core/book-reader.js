// ============================================================================
// BOOK READER - Lector de Capítulos
// ============================================================================
// Vista de lectura de capítulos con navegación, sidebar, etc.

class BookReader {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.i18n = window.i18n || new I18n();
    this.sidebarOpen = true;
    this.currentChapter = null;
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  isCapacitor() {
    return typeof window.Capacitor !== 'undefined';
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
    if (toggleBtn && window.Icons) {
      toggleBtn.innerHTML = this.sidebarOpen ? Icons.chevronLeft() : Icons.chevronRight();
      toggleBtn.setAttribute('aria-label', this.sidebarOpen ? 'Contraer barra lateral' : 'Expandir barra lateral');
      toggleBtn.setAttribute('title', this.sidebarOpen ? 'Contraer barra lateral' : 'Expandir barra lateral');
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
    const container = document.getElementById('book-reader-view');
    if (!container) return;

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
          <div class="chapter-content flex-1 overflow-y-auto overflow-x-hidden p-8">
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
    if (window.Icons) {
      Icons.init();
    }

    // Notificar al sistema de hints contextuales
    if (window.contextualHints) {
      window.contextualHints.onPageVisit('reader');
    }
  }

  renderSidebar() {
    const chapters = this.bookEngine.getAllChapters();
    const bookData = this.bookEngine.getCurrentBookData();

    return `
      <div class="sidebar ${this.sidebarOpen ? 'w-full sm:w-80' : 'w-0'} flex-shrink-0 bg-gray-900/50 border-r border-gray-700 overflow-hidden transition-all duration-300 flex flex-col relative">
        <!-- Fixed Header Section -->
        <div class="flex-shrink-0 p-6 pb-4">
          <!-- Close Sidebar Button (visible on all screens) -->
          <button id="close-sidebar-mobile" class="absolute top-2 right-2 w-10 h-10 flex items-center justify-center text-3xl font-bold hover:bg-red-500/20 hover:text-red-400 text-white transition-all rounded-lg z-20 border-2 border-gray-500 bg-gray-800 shadow-lg"
                  aria-label="Cerrar índice"
                  title="Cerrar índice de capítulos">
            ×
          </button>

          <!-- Book Title -->
          <div class="mb-4">
            <h2 class="text-2xl font-bold mb-1">${bookData.title}</h2>
            <p class="text-sm opacity-70">${bookData.subtitle}</p>
          </div>

          <!-- Back to Library Button -->
          <button onclick="window.bookReader?.backToLibrary()"
                  class="w-full mb-4 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm border border-slate-600/50"
                  aria-label="Volver a la biblioteca">
            <span aria-hidden="true">←</span>
            <span>Volver a Biblioteca</span>
          </button>

          <!-- Progress -->
          ${this.renderSidebarProgress()}
        </div>

        <!-- Scrollable Chapters List -->
        <div class="flex-1 overflow-y-auto px-6 pb-6 sidebar-scroll">
          <div class="chapters-list space-y-2">
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
      <div class="progress-box p-4 rounded-lg bg-gray-800/50 border border-gray-700">
        <div class="flex justify-between text-sm mb-2">
          <span>Progreso</span>
          <span class="font-bold">${progress.percentage}%</span>
        </div>
        <div class="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
               style="width: ${progress.percentage}%"></div>
        </div>
        <p class="text-xs opacity-60 mt-2">
          ${progress.chaptersRead} de ${progress.totalChapters} capítulos
        </p>
      </div>
    `;
  }

  // Actualiza solo el sidebar sin re-renderizar toda la página
  updateSidebar() {
    const sidebarContainer = document.querySelector('.sidebar');
    if (sidebarContainer) {
      // Re-renderizar solo los chapter items
      const chaptersContainer = sidebarContainer.querySelector('.chapters-list');
      if (chaptersContainer) {
        const chapters = this.bookEngine.getAllChapters();
        chaptersContainer.innerHTML = chapters.map(ch => this.renderChapterItem(ch)).join('');

        // Re-attach listeners solo para los chapter items
        this.attachChapterListeners();
      }

      // Actualizar barra de progreso
      const progressContainer = sidebarContainer.querySelector('.progress-box');
      if (progressContainer) {
        progressContainer.outerHTML = this.renderSidebarProgress();
      }

      // Re-inicializar iconos
      Icons.init();
    }
  }

  // Attach listeners solo para chapter items (para usar en updateSidebar)
  attachChapterListeners() {
    // Chapter read toggle buttons
    const readToggleBtns = document.querySelectorAll('.chapter-read-toggle');
    readToggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const chapterId = btn.getAttribute('data-chapter-id');
        this.bookEngine.toggleChapterRead(chapterId);
        this.updateSidebar();
      });
    });

    // Chapter title areas
    const chapterTitleAreas = document.querySelectorAll('.chapter-title-area');
    chapterTitleAreas.forEach(area => {
      area.addEventListener('click', () => {
        const chapterId = area.getAttribute('data-chapter-id');
        this.navigateToChapter(chapterId);
        if (window.innerWidth < 768) {
          this.sidebarOpen = false;
          this.render();
          this.attachEventListeners();
        }
      });
    });

    // Chapter items
    const chapterItems = document.querySelectorAll('.chapter-item');
    chapterItems.forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.chapter-read-toggle') || e.target.closest('.chapter-title-area')) {
          return;
        }
        const chapterId = item.getAttribute('data-chapter-id');
        this.navigateToChapter(chapterId);
        if (window.innerWidth < 768) {
          this.sidebarOpen = false;
          this.render();
          this.attachEventListeners();
        }
      });
    });
  }

  renderChapterItem(chapter) {
    const isActive = chapter.id === this.currentChapter?.id;
    const isRead = this.bookEngine.isChapterRead(chapter.id);

    return `
      <div class="chapter-item p-3 rounded-lg cursor-pointer transition-all ${
        isActive ? 'bg-cyan-600/30 border border-cyan-500' : 'hover:bg-gray-800/50'
      }"
           data-chapter-id="${chapter.id}">
        <div class="flex items-center gap-2">
          <button class="chapter-read-toggle p-3 rounded hover:bg-gray-700/50 transition ${isRead ? 'text-green-400' : 'opacity-30 hover:opacity-60'}"
                  data-chapter-id="${chapter.id}"
                  aria-label="${isRead ? this.i18n.t('reader.markUnread') : this.i18n.t('reader.markRead')}"
                  title="${isRead ? this.i18n.t('reader.markUnread') : this.i18n.t('reader.markRead')}">
            ${isRead ? Icons.checkCircle(18) : Icons.circle(18)}
          </button>
          <div class="flex-1 chapter-title-area" data-chapter-id="${chapter.id}">
            <div class="text-sm font-semibold ${isActive ? 'text-cyan-300' : ''}">
              ${chapter.title}
            </div>
            ${chapter.sectionTitle ? `
              <div class="text-xs opacity-50 mt-1">${chapter.sectionTitle}</div>
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
          <!-- Left: Toggle Sidebar + Back -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <button id="toggle-sidebar"
                    class="p-3 hover:bg-gray-800 rounded-lg transition"
                    aria-label="${this.sidebarOpen ? 'Contraer barra lateral' : 'Expandir barra lateral'}"
                    title="${this.sidebarOpen ? 'Contraer barra lateral' : 'Expandir barra lateral'}">
              ${this.sidebarOpen ? Icons.chevronLeft() : Icons.chevronRight()}
            </button>
            <button id="back-to-biblioteca"
                    class="p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-1"
                    aria-label="Volver a la biblioteca"
                    title="Volver a la biblioteca">
              ${Icons.library()} <span class="hidden lg:inline text-sm">${this.i18n.t('nav.library')}</span>
            </button>
          </div>

          <!-- Right: Actions (más espacio sin el título en medio) -->
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

        <!-- Segunda fila: Título del capítulo (siempre visible) -->
        <div class="mt-2 text-center border-t border-gray-300 dark:border-gray-700/50 pt-2">
          <h3 class="text-sm lg:text-base font-bold text-gray-900 dark:text-gray-100 truncate px-2" style="color: inherit;">${this.currentChapter?.title || ''}</h3>
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
    if (window.aiSuggestions) {
      const bookId = this.bookEngine.getCurrentBook();
      html += window.aiSuggestions.render(bookId, this.currentChapter.id);
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
          <button class="action-btn" onclick="document.querySelector('.exercises-section')?.scrollIntoView({behavior: 'smooth'})">
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
          <button class="action-btn" onclick="document.querySelector('.linked-exercise')?.scrollIntoView({behavior: 'smooth'})">
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
    const hasQuiz = window.InteractiveQuiz && this.currentChapter && this.currentChapter.quiz;
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
        <div class="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center gap-4">
          <!-- Previous Button -->
          ${prevChapter ? `
            <button id="prev-chapter"
                    class="group flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 hover:border-slate-500/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/10 flex-1 max-w-md"
                    data-chapter-id="${prevChapter.id}"
                    title="${prevChapter.title}">
              <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-700/50 group-hover:bg-cyan-600/20 flex items-center justify-center transition-colors">
                ${Icons.chevronLeft(20)}
              </div>
              <div class="flex-1 text-left min-w-0">
                <div class="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Anterior</div>
                <div class="text-sm font-semibold text-slate-200 truncate">${prevChapter.title}</div>
              </div>
            </button>
          ` : '<div class="flex-1"></div>'}

          <!-- Next Button -->
          ${nextChapter ? `
            <button id="next-chapter"
                    class="group flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600/90 to-blue-600/90 hover:from-cyan-500/90 hover:to-blue-500/90 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/20 flex-1 max-w-md"
                    data-chapter-id="${nextChapter.id}"
                    title="${nextChapter.title}">
              <div class="flex-1 text-right min-w-0">
                <div class="text-xs text-cyan-100 uppercase tracking-wide mb-0.5">Siguiente</div>
                <div class="text-sm font-semibold text-white truncate">${nextChapter.title}</div>
              </div>
              <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                ${Icons.chevronRight(20)}
              </div>
            </button>
          ` : '<div class="flex-1"></div>'}
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
    if (window.audioReader) {
      window.audioReader.toggle();
    } else {
      window.toast?.info('Cargando reproductor de audio...');
    }
    this.setReaderActiveTab('audio');
  }

  /**
   * Abre el chat de IA
   */
  openAIChat() {
    if (window.aiBookFeatures) {
      window.aiBookFeatures.openChat();
    } else if (window.aiChatModal) {
      window.aiChatModal.open();
    } else {
      window.toast?.info('Chat de IA no disponible');
    }
    this.setReaderActiveTab('chat');
  }

  /**
   * Abre el modal de notas
   */
  openNotes() {
    if (window.smartNotes) {
      window.smartNotes.open();
    } else {
      window.toast?.info('Sistema de notas no disponible');
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
    // Toggle sidebar
    const toggleSidebar = document.getElementById('toggle-sidebar');
    if (toggleSidebar) {
      toggleSidebar.addEventListener('click', () => {
        this.toggleSidebar();
      });
    }

    // Close sidebar (mobile)
    const closeSidebarMobile = document.getElementById('close-sidebar-mobile');
    if (closeSidebarMobile) {
      closeSidebarMobile.addEventListener('click', () => {
        if (this.sidebarOpen) {
          this.toggleSidebar();
        }
      });
    }

    // Back to biblioteca
    const backBtn = document.getElementById('back-to-biblioteca');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        // Remover tema específico del libro
        window.themeHelper?.removeBookTheme();
        this.hide();
        window.biblioteca.show();
      });
    }

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.remove('hidden');
      });
    }

    // Bottom nav "Más" dropdown toggle
    const bottomNavMoreBtn = document.getElementById('bottom-nav-more-btn');
    const bottomNavDropdown = document.getElementById('bottom-nav-dropdown');
    if (bottomNavMoreBtn && bottomNavDropdown) {
      bottomNavMoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        bottomNavDropdown.classList.toggle('hidden');
      });

      // Cerrar dropdown al hacer click fuera
      document.addEventListener('click', (e) => {
        if (!bottomNavDropdown.contains(e.target) && e.target !== bottomNavMoreBtn) {
          bottomNavDropdown.classList.add('hidden');
        }
      });

      // Cerrar dropdown después de seleccionar una opción
      bottomNavDropdown.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          setTimeout(() => {
            bottomNavDropdown.classList.add('hidden');
          }, 100);
        });
      });
    }

    // Close mobile menu button
    const closeMobileMenu = document.getElementById('close-mobile-menu');
    if (closeMobileMenu) {
      closeMobileMenu.addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.add('hidden');
      });
    }

    // Close on backdrop click
    const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');
    if (mobileMenuBackdrop) {
      mobileMenuBackdrop.addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.add('hidden');
      });
    }

    // Back to biblioteca (mobile)
    const backToLibMobile = document.getElementById('back-to-biblioteca-mobile');
    if (backToLibMobile) {
      backToLibMobile.addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.add('hidden');
        // Remover tema específico del libro
        window.themeHelper?.removeBookTheme();
        this.hide();
        window.biblioteca.show();
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
      this.render();
      this.attachEventListeners();
    };

    const bookmarkBtn = document.getElementById('bookmark-btn');
    const bookmarkBtnTablet = document.getElementById('bookmark-btn-tablet');
    const bookmarkBtnMobile = document.getElementById('bookmark-btn-mobile');

    if (bookmarkBtn) bookmarkBtn.addEventListener('click', bookmarkHandler);
    if (bookmarkBtnTablet) bookmarkBtnTablet.addEventListener('click', bookmarkHandler);
    if (bookmarkBtnMobile) bookmarkBtnMobile.addEventListener('click', bookmarkHandler);

    // AI Chat button (desktop lg+, tablet md, and mobile)
    const aiChatHandler = () => {
      closeMobileMenuDropdown();
      if (window.aiChatModal) {
        window.aiChatModal.open();
      } else {
        window.toast.error('error.chatNotAvailable');
      }
    };

    const aiChatBtn = document.getElementById('ai-chat-btn');
    const aiChatBtnTablet = document.getElementById('ai-chat-btn-tablet');
    const aiChatBtnMobile = document.getElementById('ai-chat-btn-mobile');

    if (aiChatBtn) aiChatBtn.addEventListener('click', aiChatHandler);
    if (aiChatBtnTablet) aiChatBtnTablet.addEventListener('click', aiChatHandler);
    if (aiChatBtnMobile) aiChatBtnMobile.addEventListener('click', aiChatHandler);

    // ExplorationHub floating button
    const explorationHubBtn = document.getElementById('exploration-hub-floating-btn');
    if (explorationHubBtn) {
      explorationHubBtn.addEventListener('click', () => {
        if (window.ExplorationHub && window.bookEngine) {
          const hub = new window.ExplorationHub(window.bookEngine);
          hub.open('search'); // Abrir con tab de búsqueda por defecto
        } else {
          console.error('ExplorationHub no está disponible');
        }
      });
    }

    // Notes button
    const notesBtn = document.getElementById('notes-btn');
    if (notesBtn) {
      notesBtn.addEventListener('click', () => {
        if (window.notesModal) {
          window.notesModal.open(this.currentChapter?.id);
        } else {
          window.toast.error('error.notesNotAvailable');
        }
      });
    }

    // Voice notes button
    const voiceNotesBtn = document.getElementById('voice-notes-btn');
    if (voiceNotesBtn) {
      voiceNotesBtn.addEventListener('click', () => {
        if (window.voiceNotes) {
          window.voiceNotes.showRecordingModal();
        } else {
          window.toast?.error('Notas de voz no disponibles');
        }
      });
    }

    // Koan button
    const koanBtn = document.getElementById('koan-btn');
    if (koanBtn) {
      koanBtn.addEventListener('click', () => {
        if (window.koanModal) {
          window.koanModal.setCurrentChapter(this.currentChapter?.id);
          window.koanModal.open(this.currentChapter?.id);
        } else {
          window.toast.error('error.koanNotAvailable');
        }
      });
    }

    // Quiz button
    const quizBtn = document.getElementById('quiz-btn');
    if (quizBtn) {
      quizBtn.addEventListener('click', async () => {
        const bookId = this.bookEngine.getCurrentBook();
        const chapterId = this.currentChapter?.id;

        if (!chapterId) {
          window.toast?.info('Selecciona un capítulo primero');
          return;
        }

        if (window.interactiveQuiz) {
          const quiz = await window.interactiveQuiz.loadQuiz(bookId, chapterId);
          if (quiz) {
            window.interactiveQuiz.open(bookId, chapterId);
          } else {
            window.toast?.info('No hay quiz disponible para este capítulo');
          }
        } else {
          console.error('InteractiveQuiz no está disponible');
        }
      });
    }

    // Timeline button
    const timelineBtn = document.getElementById('timeline-btn');
    if (timelineBtn) {
      timelineBtn.addEventListener('click', () => {
        if (window.timelineViewer) {
          window.timelineViewer.open();
        } else {
          window.toast.error('error.timelineNotAvailable');
        }
      });
    }

    // Resources button - eliminado, ahora se maneja con ChapterResourcesModal más abajo

    // Estado del audio en header
    let audioHeaderActive = false;

    // Audioreader button - Cambia icono y activa/pausa audio
    const audioreaderHandler = async (e) => {
      closeMobileMenuDropdown();

      const iconMobile = document.getElementById('audio-icon-mobile');
      const expandBtn = document.getElementById('audio-expand-btn-mobile');
      const progressContainer = document.getElementById('audio-progress-bar-container');

      const reader = window.audioReader?.baseReader || window.audioReader;
      if (!reader) {
        window.toast?.error('Reproductor no disponible');
        return;
      }

      // Si no está activo, activar modo audio
      if (!audioHeaderActive) {
        audioHeaderActive = true;
        // Preparar contenido
        const chapterContent = document.querySelector('.chapter-content');
        if (chapterContent) {
          reader.prepareContent(chapterContent.innerHTML);
        }
        // Cambiar icono a Play
        if (iconMobile) iconMobile.innerHTML = Icons.play ? Icons.play(20) : '▶';
        // Mostrar botón expandir y barra de progreso
        if (expandBtn) expandBtn.classList.remove('hidden');
        if (progressContainer) progressContainer.classList.remove('hidden');
        // Actualizar info
        const paraInfo = document.getElementById('audio-paragraph-info');
        if (paraInfo && reader.paragraphs) {
          paraInfo.textContent = `1/${reader.paragraphs.length}`;
        }
        return;
      }

      // Ya está activo - toggle play/pause
      if (reader.isPlaying && !reader.isPaused) {
        // Pausar
        reader.pause();
        if (iconMobile) iconMobile.innerHTML = Icons.play ? Icons.play(20) : '▶';
      } else {
        // Reproducir
        try {
          const chapterContent = document.querySelector('.chapter-content');
          if (chapterContent) {
            const result = await reader.play(chapterContent.innerHTML);
            if (result === false) {
              alert('Play retornó false');
            }
          } else {
            alert('No hay chapter-content');
          }
          if (iconMobile) iconMobile.innerHTML = Icons.pause ? Icons.pause(20) : '⏸';
        } catch (err) {
          alert('Error play header: ' + err.message);
        }
      }
    };

    // Botón expandir - muestra reproductor completo
    const audioExpandHandler = () => {
      const reader = window.audioReader?.baseReader || window.audioReader;
      if (reader && reader.showSimplePlayer) {
        reader.showSimplePlayer();
      }
    };

    const audioExpandBtn = document.getElementById('audio-expand-btn-mobile');
    if (audioExpandBtn) {
      audioExpandBtn.addEventListener('click', audioExpandHandler);
    }

    const audioreaderBtn = document.getElementById('audioreader-btn');
    const audioreaderBtnTablet = document.getElementById('audioreader-btn-tablet');
    const audioreaderBtnMobile = document.getElementById('audioreader-btn-mobile');

    console.log('🎧 Attaching audio listeners:', {
      desktop: !!audioreaderBtn,
      tablet: !!audioreaderBtnTablet,
      mobile: !!audioreaderBtnMobile
    });

    if (audioreaderBtn) audioreaderBtn.addEventListener('click', audioreaderHandler);
    if (audioreaderBtnTablet) audioreaderBtnTablet.addEventListener('click', audioreaderHandler);
    if (audioreaderBtnMobile) audioreaderBtnMobile.addEventListener('click', audioreaderHandler);

    // Support button (desktop, tablet, and mobile)
    const supportBtnTablet = document.getElementById('support-btn-tablet');
    const supportBtnMobile = document.getElementById('support-btn-mobile');
    const supportHandler = () => {
      if (window.donationsModal) {
        window.donationsModal.open();
      }
    };
    if (supportBtnTablet) supportBtnTablet.addEventListener('click', supportHandler);
    if (supportBtnMobile) supportBtnMobile.addEventListener('click', supportHandler);

    // Android Download button
    const androidBtn = document.getElementById('android-download-btn');
    if (androidBtn) {
      androidBtn.addEventListener('click', () => {
        const apkUrl = this.bookEngine.getLatestAPK();
        window.open(apkUrl, '_blank');
      });
    }

    // Achievements button
    const achievementsBtn = document.getElementById('achievements-btn');
    if (achievementsBtn) {
      achievementsBtn.addEventListener('click', () => {
        if (window.achievementSystem) {
          window.achievementSystem.showDashboardModal();
        }
      });
    }

    // Content Adapter button
    const contentAdapterBtn = document.getElementById('content-adapter-btn');
    if (contentAdapterBtn) {
      contentAdapterBtn.addEventListener('click', () => {
        if (window.contentAdapter) {
          window.contentAdapter.toggleSelector();
        } else {
          window.toast?.info('Cargando adaptador de contenido...');
          // Intentar cargar el módulo dinámicamente
          if (window.lazyLoader) {
            window.lazyLoader.load('contentAdapter').then(() => {
              if (window.contentAdapter) {
                window.contentAdapter.toggleSelector();
              }
            }).catch(() => {
              window.toast?.error('Error al cargar el adaptador de contenido');
            });
          }
        }
      });
    }

    // Summary button (Auto-summary with AI)
    const summaryBtn = document.getElementById('summary-btn');
    if (summaryBtn) {
      summaryBtn.addEventListener('click', () => {
        if (window.autoSummary && this.currentChapter) {
          const bookId = this.bookEngine.getCurrentBook();
          window.autoSummary.showSummaryModal(this.currentChapter, bookId);
        } else {
          window.toast?.info('Configura la IA para generar resúmenes');
        }
      });
    }

    // Concept Map button
    const conceptMapBtn = document.getElementById('concept-map-btn');
    if (conceptMapBtn) {
      conceptMapBtn.addEventListener('click', () => {
        if (window.conceptMaps) {
          window.conceptMaps.show();
        }
      });
    }

    // Action Plans button
    const actionPlansBtn = document.getElementById('action-plans-btn');
    if (actionPlansBtn) {
      actionPlansBtn.addEventListener('click', () => {
        if (window.actionPlans) {
          window.actionPlans.show();
        }
      });
    }

    // Chapter Resources button (Recursos del Capítulo)
    const chapterResourcesBtn = document.getElementById('chapter-resources-btn');
    if (chapterResourcesBtn) {
      chapterResourcesBtn.addEventListener('click', () => {
        closeDropdownHelper();
        if (window.chapterResourcesModal) {
          const chapterId = (this.currentChapter && this.currentChapter.id) ? this.currentChapter.id : null;
          window.chapterResourcesModal.open(chapterId);
        }
      });
    }

    // Book Resources button (Recursos del Libro - resourcesViewer)
    const bookResourcesBtn = document.getElementById('book-resources-btn');
    if (bookResourcesBtn) {
      bookResourcesBtn.addEventListener('click', () => {
        closeDropdownHelper();
        if (window.resourcesViewer) {
          window.resourcesViewer.open();
        }
      });
    }

    // Donations button
    const donationsBtn = document.getElementById('donations-btn');
    if (donationsBtn) {
      donationsBtn.addEventListener('click', () => {
        if (window.donationsModal) {
          window.donationsModal.open();
        }
      });
    }

    // Support button (visible heart button) - with heartbeat animation
    const supportBtn = document.getElementById('support-btn');
    if (supportBtn) {
      supportBtn.addEventListener('click', () => {
        if (window.donationsModal) {
          window.donationsModal.open();
        }
      });
    }

    // Premium Edition button - opens modal
    const premiumBtn = document.getElementById('premium-edition-btn');
    if (premiumBtn) {
      premiumBtn.addEventListener('click', () => {
        this.showPremiumDownloadModal();
      });
    }

    // Open settings modal button (desktop dropdown)
    const openSettingsModalBtn = document.getElementById('open-settings-modal-btn');
    if (openSettingsModalBtn) {
      openSettingsModalBtn.addEventListener('click', () => {
        if (window.SettingsModal) {
          const settingsModal = new window.SettingsModal();
          settingsModal.show();
        }
      });
    }

    // Open settings modal button (mobile menu)
    const openSettingsModalBtnMobile = document.getElementById('open-settings-modal-btn-mobile');
    if (openSettingsModalBtnMobile) {
      openSettingsModalBtnMobile.addEventListener('click', () => {
        // Cerrar menú móvil primero
        document.getElementById('mobile-menu')?.classList.add('hidden');

        // Abrir modal de configuración
        if (window.SettingsModal) {
          const settingsModal = new window.SettingsModal();
          settingsModal.show();
        }
      });
    }

    // Open settings modal button (tablet dropdown)
    const openSettingsModalBtnTablet = document.getElementById('open-settings-modal-btn-tablet');
    if (openSettingsModalBtnTablet) {
      openSettingsModalBtnTablet.addEventListener('click', () => {
        // Cerrar dropdown primero
        document.getElementById('more-actions-dropdown')?.classList.add('hidden');

        // Abrir modal de configuración
        if (window.SettingsModal) {
          const settingsModal = new window.SettingsModal();
          settingsModal.show();
        }
      });
    }

    // Open help center button (desktop dropdown)
    const openHelpCenterBtn = document.getElementById('open-help-center-btn');
    if (openHelpCenterBtn) {
      openHelpCenterBtn.addEventListener('click', () => {
        // Cerrar dropdown primero
        document.getElementById('settings-dropdown')?.classList.add('hidden');

        // Abrir centro de ayuda
        if (window.helpCenterModal) {
          window.helpCenterModal.open();
        }
      });
    }

    // Open help center button (tablet dropdown)
    const openHelpCenterBtnTablet = document.getElementById('open-help-center-btn-tablet');
    if (openHelpCenterBtnTablet) {
      openHelpCenterBtnTablet.addEventListener('click', () => {
        // Cerrar dropdown primero
        document.getElementById('more-actions-dropdown')?.classList.add('hidden');

        // Abrir centro de ayuda
        if (window.helpCenterModal) {
          window.helpCenterModal.open();
        }
      });
    }

    // Open help center button (mobile menu)
    const openHelpCenterBtnMobile = document.getElementById('open-help-center-btn-mobile');
    if (openHelpCenterBtnMobile) {
      openHelpCenterBtnMobile.addEventListener('click', () => {
        // Cerrar menú móvil primero
        document.getElementById('mobile-menu')?.classList.add('hidden');

        // Abrir centro de ayuda
        if (window.helpCenterModal) {
          window.helpCenterModal.open();
        }
      });
    }

    // Language selector button
    const languageSelectorBtn = document.getElementById('language-selector-btn');
    if (languageSelectorBtn) {
      languageSelectorBtn.addEventListener('click', () => {
        if (window.languageSelector) {
          window.languageSelector.open();
        }
      });
    }

    // Theme toggle button
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        if (window.themeHelper) {
          window.themeHelper.toggle();
          this.updateThemeIcons();
          window.toast?.info(`Tema: ${window.themeHelper.getThemeLabel()}`);
        }
      });
    }

    // Share chapter button
    const shareChapterBtn = document.getElementById('share-chapter-btn');
    if (shareChapterBtn) {
      shareChapterBtn.addEventListener('click', () => {
        this.shareCurrentChapter();
      });
    }

    // Manual Práctico button - Navegar al libro en el sistema unificado
    const manualPracticoBtn = document.getElementById('manual-practico-btn');
    if (manualPracticoBtn) {
      manualPracticoBtn.addEventListener('click', async () => {
        await this.bookEngine.loadBook('manual-practico');
        window.themeHelper?.applyBookTheme(this.bookEngine.getCurrentBookConfig());
        const firstChapter = this.bookEngine.getFirstChapter();
        if (firstChapter) {
          this.currentChapter = this.bookEngine.navigateToChapter(firstChapter.id);
        }
        this.render();
        this.attachEventListeners();
      });
    }

    // Prácticas Radicales button - Navegar al libro en el sistema unificado
    const practicasRadicalesBtn = document.getElementById('practicas-radicales-btn');
    if (practicasRadicalesBtn) {
      practicasRadicalesBtn.addEventListener('click', async () => {
        await this.bookEngine.loadBook('practicas-radicales');
        window.themeHelper?.applyBookTheme(this.bookEngine.getCurrentBookConfig());
        const firstChapter = this.bookEngine.getFirstChapter();
        if (firstChapter) {
          this.currentChapter = this.bookEngine.navigateToChapter(firstChapter.id);
        }
        this.render();
        this.attachEventListeners();
      });
    }

    // ========================================================================
    // MOBILE MENU BUTTON LISTENERS
    // ========================================================================
    // Note: closeMobileMenuDropdown() helper is defined earlier in this function

    // Notes button mobile
    const notesBtnMobile = document.getElementById('notes-btn-mobile');
    if (notesBtnMobile) {
      notesBtnMobile.addEventListener('click', () => {
        closeMobileMenuDropdown();
        if (window.notesModal) {
          window.notesModal.open(this.currentChapter?.id);
        } else {
          window.toast.error('error.notesNotAvailable');
        }
      });
    }

    // AI Chat button mobile - already has handler from line 840, no need to duplicate

    // Timeline button mobile
    const timelineBtnMobile = document.getElementById('timeline-btn-mobile');
    if (timelineBtnMobile) {
      timelineBtnMobile.addEventListener('click', () => {
        closeMobileMenuDropdown();
        if (window.timelineViewer) {
          window.timelineViewer.open();
        } else {
          window.toast.error('error.timelineNotAvailable');
        }
      });
    }

    // Chapter Resources button mobile
    const chapterResourcesBtnMobile = document.getElementById('chapter-resources-btn-mobile');
    if (chapterResourcesBtnMobile) {
      chapterResourcesBtnMobile.addEventListener('click', () => {
        closeMobileMenuDropdown();
        if (window.chapterResourcesModal) {
          const chapterId = (this.currentChapter && this.currentChapter.id) ? this.currentChapter.id : null;
          window.chapterResourcesModal.open(chapterId);
        } else {
          if (window.toast) {
            window.toast.error('error.resourcesNotAvailable');
          }
        }
      });
    }

    // Learning Paths button mobile
    const learningPathsBtnMobile = document.getElementById('learning-paths-btn-mobile');
    if (learningPathsBtnMobile) {
      learningPathsBtnMobile.addEventListener('click', () => {
        closeMobileMenuDropdown();
        if (window.learningPaths) {
          const currentBookId = this.bookEngine.getCurrentBook();
          window.learningPaths.open(currentBookId);
        } else {
          if (window.toast) {
            window.toast.error('Learning Paths no disponible');
          }
        }
      });
    }

    // Book Resources button mobile (resourcesViewer)
    const bookResourcesBtnMobile = document.getElementById('book-resources-btn-mobile');
    if (bookResourcesBtnMobile) {
      bookResourcesBtnMobile.addEventListener('click', () => {
        closeMobileMenuDropdown();
        if (window.resourcesViewer) {
          window.resourcesViewer.open();
        } else {
          if (window.toast) {
            window.toast.error('error.resourcesNotAvailable');
          }
        }
      });
    }

    // Manual Práctico button mobile - Navegar al libro
    const manualPracticoBtnMobile = document.getElementById('manual-practico-btn-mobile');
    if (manualPracticoBtnMobile) {
      manualPracticoBtnMobile.addEventListener('click', async () => {
        closeMobileMenuDropdown();
        await this.bookEngine.loadBook('manual-practico');
        window.themeHelper?.applyBookTheme(this.bookEngine.getCurrentBookConfig());
        this.currentChapter = this.bookEngine.navigateToChapter(this.bookEngine.getFirstChapter().id);
        this.render();
        this.attachEventListeners();
      });
    }

    // Prácticas Radicales button mobile - Navegar al libro
    const practicasRadicalesBtnMobile = document.getElementById('practicas-radicales-btn-mobile');
    if (practicasRadicalesBtnMobile) {
      practicasRadicalesBtnMobile.addEventListener('click', async () => {
        closeMobileMenuDropdown();
        await this.bookEngine.loadBook('practicas-radicales');
        window.themeHelper?.applyBookTheme(this.bookEngine.getCurrentBookConfig());
        this.currentChapter = this.bookEngine.navigateToChapter(this.bookEngine.getFirstChapter().id);
        this.render();
        this.attachEventListeners();
      });
    }

    // Audioreader button mobile - already has handler from line 926, no need to duplicate

    // Koan button mobile
    const koanBtnMobile = document.getElementById('koan-btn-mobile');
    if (koanBtnMobile) {
      koanBtnMobile.addEventListener('click', () => {
        closeMobileMenuDropdown();
        if (window.koanModal) {
          window.koanModal.setCurrentChapter(this.currentChapter?.id);
          window.koanModal.open(this.currentChapter?.id);
        } else {
          window.toast.error('error.koanNotAvailable');
        }
      });
    }

    // Android Download button mobile
    const androidBtnMobile = document.getElementById('android-download-btn-mobile');
    if (androidBtnMobile) {
      androidBtnMobile.addEventListener('click', () => {
        closeMobileMenuDropdown();
        const apkUrl = this.bookEngine.getLatestAPK();
        window.open(apkUrl, '_blank');
      });
    }

    // Donations button mobile
    const donationsBtnMobile = document.getElementById('donations-btn-mobile');
    if (donationsBtnMobile) {
      donationsBtnMobile.addEventListener('click', () => {
        closeMobileMenuDropdown();
        if (window.donationsModal) {
          window.donationsModal.open();
        }
      });
    }

    // Premium Edition button mobile - opens modal
    const premiumBtnMobile = document.getElementById('premium-edition-btn-mobile');
    if (premiumBtnMobile) {
      premiumBtnMobile.addEventListener('click', () => {
        closeMobileMenuDropdown();
        this.showPremiumDownloadModal();
      });
    }

    // Language selector button mobile
    const languageSelectorBtnMobile = document.getElementById('language-selector-btn-mobile');
    if (languageSelectorBtnMobile) {
      languageSelectorBtnMobile.addEventListener('click', () => {
        closeMobileMenuDropdown();
        if (window.languageSelector) {
          window.languageSelector.open();
        }
      });
    }

    // Theme toggle button mobile
    const themeToggleBtnMobile = document.getElementById('theme-toggle-btn-mobile');
    if (themeToggleBtnMobile) {
      themeToggleBtnMobile.addEventListener('click', () => {
        closeMobileMenuDropdown();
        if (window.themeHelper) {
          window.themeHelper.toggle();
          this.updateThemeIcons();
          window.toast?.info(`Tema: ${window.themeHelper.getThemeLabel()}`);
        }
      });
    }

    // Share chapter button mobile
    const shareChapterBtnMobile = document.getElementById('share-chapter-btn-mobile');
    if (shareChapterBtnMobile) {
      shareChapterBtnMobile.addEventListener('click', () => {
        closeMobileMenuDropdown();
        this.shareCurrentChapter();
      });
    }

    // ========================================================================
    // TABLET DROPDOWN MENU (md breakpoint)
    // ========================================================================

    const moreActionsBtn = document.getElementById('more-actions-btn');
    const moreActionsDropdown = document.getElementById('more-actions-dropdown');

    if (moreActionsBtn && moreActionsDropdown) {
      // Toggle dropdown
      moreActionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moreActionsDropdown.classList.toggle('hidden');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!moreActionsBtn.contains(e.target) && !moreActionsDropdown.contains(e.target)) {
          moreActionsDropdown.classList.add('hidden');
        }
      });
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
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          // Cerrar otros dropdowns
          ['tools-dropdown', 'book-features-dropdown', 'settings-dropdown'].forEach(id => {
            if (id !== dropdownId) {
              document.getElementById(id)?.classList.add('hidden');
            }
          });
          dropdown.classList.toggle('hidden');
        });
      }
    };

    // Setup desktop dropdowns
    setupDropdown('tools-dropdown-btn', 'tools-dropdown');
    setupDropdown('book-features-dropdown-btn', 'book-features-dropdown');
    setupDropdown('settings-dropdown-btn', 'settings-dropdown');

    // Cerrar dropdowns al hacer click fuera
    document.addEventListener('click', (e) => {
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
    });

    // Helper para cerrar todos los dropdowns desktop
    const closeDesktopDropdowns = () => {
      ['tools-dropdown', 'book-features-dropdown', 'settings-dropdown'].forEach(id => {
        document.getElementById(id)?.classList.add('hidden');
      });
    };

    // Notes button dropdown
    const notesBtnDropdown = document.getElementById('notes-btn-dropdown');
    if (notesBtnDropdown) {
      notesBtnDropdown.addEventListener('click', () => {
        closeDropdownHelper();
        if (window.notesModal) {
          window.notesModal.open(this.currentChapter?.id);
        }
      });
    }

    // Timeline button dropdown
    const timelineBtnDropdown = document.getElementById('timeline-btn-dropdown');
    if (timelineBtnDropdown) {
      timelineBtnDropdown.addEventListener('click', () => {
        closeDropdownHelper();
        if (window.timelineViewer) {
          window.timelineViewer.open();
        }
      });
    }

    // Chapter Resources button dropdown
    const chapterResourcesBtnDropdown = document.getElementById('chapter-resources-btn-dropdown');
    if (chapterResourcesBtnDropdown) {
      chapterResourcesBtnDropdown.addEventListener('click', () => {
        closeDropdownHelper();
        if (window.chapterResourcesModal) {
          const chapterId = (this.currentChapter && this.currentChapter.id) ? this.currentChapter.id : null;
          window.chapterResourcesModal.open(chapterId);
        }
      });
    }

    // Book Resources button dropdown (resourcesViewer)
    const bookResourcesBtnDropdown = document.getElementById('book-resources-btn-dropdown');
    if (bookResourcesBtnDropdown) {
      bookResourcesBtnDropdown.addEventListener('click', () => {
        closeDropdownHelper();
        if (window.resourcesViewer) {
          window.resourcesViewer.open();
        }
      });
    }

    // Manual Práctico button dropdown
    const manualPracticoBtnDropdown = document.getElementById('manual-practico-btn-dropdown');
    if (manualPracticoBtnDropdown) {
      manualPracticoBtnDropdown.addEventListener('click', async () => {
        closeDropdownHelper();
        await this.bookEngine.loadBook('manual-practico');
        window.themeHelper?.applyBookTheme(this.bookEngine.getCurrentBookConfig());
        this.currentChapter = this.bookEngine.navigateToChapter(this.bookEngine.getFirstChapter().id);
        this.render();
        this.attachEventListeners();
      });
    }

    // Prácticas Radicales button dropdown
    const practicasRadicalesBtnDropdown = document.getElementById('practicas-radicales-btn-dropdown');
    if (practicasRadicalesBtnDropdown) {
      practicasRadicalesBtnDropdown.addEventListener('click', async () => {
        closeDropdownHelper();
        await this.bookEngine.loadBook('practicas-radicales');
        window.themeHelper?.applyBookTheme(this.bookEngine.getCurrentBookConfig());
        this.currentChapter = this.bookEngine.navigateToChapter(this.bookEngine.getFirstChapter().id);
        this.render();
        this.attachEventListeners();
      });
    }

    // Koan button dropdown
    const koanBtnDropdown = document.getElementById('koan-btn-dropdown');
    if (koanBtnDropdown) {
      koanBtnDropdown.addEventListener('click', () => {
        closeDropdownHelper();
        if (window.koanModal) {
          window.koanModal.setCurrentChapter(this.currentChapter?.id);
          window.koanModal.open(this.currentChapter?.id);
        }
      });
    }

    // Android Download button dropdown
    const androidBtnDropdown = document.getElementById('android-download-btn-dropdown');
    if (androidBtnDropdown) {
      androidBtnDropdown.addEventListener('click', () => {
        closeDropdownHelper();
        const apkUrl = this.bookEngine.getLatestAPK();
        window.open(apkUrl, '_blank');
      });
    }

    // Donations button dropdown
    const donationsBtnDropdown = document.getElementById('donations-btn-dropdown');
    if (donationsBtnDropdown) {
      donationsBtnDropdown.addEventListener('click', () => {
        closeDropdownHelper();
        if (window.donationsModal) {
          window.donationsModal.open();
        }
      });
    }

    // Learning Paths button dropdown
    const learningPathsBtnDropdown = document.getElementById('learning-paths-btn-dropdown');
    if (learningPathsBtnDropdown) {
      learningPathsBtnDropdown.addEventListener('click', () => {
        closeDropdownHelper();
        if (window.learningPaths) {
          const currentBookId = this.bookEngine.getCurrentBook();
          window.learningPaths.open(currentBookId);
        } else {
          window.toast?.error('Learning Paths no disponible');
        }
      });
    }

    // Learning Paths button desktop (tools dropdown)
    const learningPathsBtnDesktop = document.getElementById('learning-paths-btn-desktop');
    if (learningPathsBtnDesktop) {
      learningPathsBtnDesktop.addEventListener('click', () => {
        closeDropdownHelper();
        if (window.learningPaths) {
          const currentBookId = this.bookEngine.getCurrentBook();
          window.learningPaths.open(currentBookId);
        } else {
          window.toast?.error('Learning Paths no disponible');
        }
      });
    }

    // Premium Edition button dropdown
    const premiumBtnDropdown = document.getElementById('premium-edition-btn-dropdown');
    if (premiumBtnDropdown) {
      premiumBtnDropdown.addEventListener('click', () => {
        closeDropdownHelper();
        this.showPremiumDownloadModal();
      });
    }

    // Language selector button dropdown
    const languageSelectorBtnDropdown = document.getElementById('language-selector-btn-dropdown');
    if (languageSelectorBtnDropdown) {
      languageSelectorBtnDropdown.addEventListener('click', () => {
        closeDropdownHelper();
        if (window.languageSelector) {
          window.languageSelector.open();
        }
      });
    }

    // Theme toggle button dropdown
    const themeToggleBtnDropdown = document.getElementById('theme-toggle-btn-dropdown');
    if (themeToggleBtnDropdown) {
      themeToggleBtnDropdown.addEventListener('click', () => {
        closeDropdownHelper();
        if (window.themeHelper) {
          window.themeHelper.toggle();
          this.updateThemeIcons();
          window.toast?.info(`Tema: ${window.themeHelper.getThemeLabel()}`);
        }
      });
    }

    // Share chapter button dropdown
    const shareChapterBtnDropdown = document.getElementById('share-chapter-btn-dropdown');
    if (shareChapterBtnDropdown) {
      shareChapterBtnDropdown.addEventListener('click', () => {
        closeDropdownHelper();
        this.shareCurrentChapter();
      });
    }

    // Chapter read toggle buttons (click en el icono)
    const readToggleBtns = document.querySelectorAll('.chapter-read-toggle');
    readToggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Evitar que se propague al chapter-item
        const chapterId = btn.getAttribute('data-chapter-id');
        this.bookEngine.toggleChapterRead(chapterId);
        // Re-renderizar sidebar para actualizar estado
        this.updateSidebar();
      });
    });

    // Chapter title areas (click para navegar)
    const chapterTitleAreas = document.querySelectorAll('.chapter-title-area');
    chapterTitleAreas.forEach(area => {
      area.addEventListener('click', () => {
        const chapterId = area.getAttribute('data-chapter-id');
        this.navigateToChapter(chapterId);
        // En móvil, cerrar el sidebar automáticamente
        if (window.innerWidth < 768) {
          this.sidebarOpen = false;
          this.render();
          this.attachEventListeners();
        }
      });
    });

    // Chapter items (click en cualquier parte excepto el toggle)
    const chapterItems = document.querySelectorAll('.chapter-item');
    chapterItems.forEach(item => {
      item.addEventListener('click', (e) => {
        // Si se hizo click en el toggle o área de título, ya está manejado
        if (e.target.closest('.chapter-read-toggle') || e.target.closest('.chapter-title-area')) {
          return;
        }
        const chapterId = item.getAttribute('data-chapter-id');
        this.navigateToChapter(chapterId);
        // En móvil, cerrar el sidebar automáticamente
        if (window.innerWidth < 768) {
          this.sidebarOpen = false;
          this.render();
          this.attachEventListeners();
        }
      });
    });

    // Mark chapter as read button
    const markReadBtn = document.getElementById('mark-chapter-read-btn');
    if (markReadBtn) {
      markReadBtn.addEventListener('click', () => {
        if (this.currentChapter?.id) {
          this.bookEngine.toggleChapterRead(this.currentChapter.id);
          // Re-renderizar el botón y actualizar sidebar
          const markReadSection = document.querySelector('.mark-read-section');
          if (markReadSection) {
            markReadSection.outerHTML = this.renderMarkAsReadButton();
            // Re-attach listener para el nuevo botón
            const newBtn = document.getElementById('mark-chapter-read-btn');
            if (newBtn) {
              newBtn.addEventListener('click', () => {
                this.bookEngine.toggleChapterRead(this.currentChapter.id);
                this.render();
                this.attachEventListeners();
              });
            }
            Icons.init();
          }
          this.updateSidebar();
        }
      });
    }

    // Action cards event listeners
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const action = card.getAttribute('data-action');
        const button = e.target.closest('button');

        // Si se hace click en el botón o en cualquier parte de la card
        if (action === 'quiz') {
          if (window.InteractiveQuiz && this.currentChapter && this.currentChapter.quiz) {
            const quiz = new window.InteractiveQuiz(this.currentChapter.quiz, this.currentChapter.id);
            quiz.start();
          }
        } else if (action === 'resources') {
          if (window.chapterResourcesModal) {
            const chapterId = (this.currentChapter && this.currentChapter.id) ? this.currentChapter.id : null;
            window.chapterResourcesModal.open(chapterId);
          }
        } else if (action === 'reflection') {
          // Hacer scroll hasta la pregunta de cierre
          const closingQuestion = document.querySelector('.closing-question');
          if (closingQuestion) {
            closingQuestion.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });

    // Previous/Next buttons
    const prevBtn = document.getElementById('prev-chapter');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const chapterId = prevBtn.getAttribute('data-chapter-id');
        this.navigateToChapter(chapterId);
      });
    }

    const nextBtn = document.getElementById('next-chapter');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const chapterId = nextBtn.getAttribute('data-chapter-id');
        this.navigateToChapter(chapterId);
      });
    }

    // Cross-reference clicks - Navegación entre libros
    const crossRefItems = document.querySelectorAll('.reference');
    crossRefItems.forEach(item => {
      item.addEventListener('click', async () => {
        const targetBook = item.getAttribute('data-book');
        const targetChapter = item.getAttribute('data-chapter');

        if (!targetBook) {
          window.toast?.warning('Referencia sin libro destino');
          return;
        }

        try {
          window.toast?.info(`Navegando a ${targetBook}...`);

          // Cargar el libro de destino
          await this.bookEngine.loadBook(targetBook);
          window.themeHelper?.applyBookTheme(this.bookEngine.getCurrentBookConfig());

          // Si hay capítulo específico, navegar a él
          if (targetChapter) {
            const chapters = this.bookEngine.getChapters();
            const chapter = chapters.find(c => c.id === targetChapter || c.slug === targetChapter);
            if (chapter) {
              await this.navigateTo(chapter.id);
            } else {
              // Si no se encuentra, ir al primer capítulo
              await this.navigateTo(chapters[0]?.id);
            }
          } else {
            // Navegar al primer capítulo del libro
            const chapters = this.bookEngine.getChapters();
            if (chapters.length > 0) {
              await this.navigateTo(chapters[0].id);
            }
          }

          window.toast?.success(`Ahora leyendo: ${this.bookEngine.getCurrentBookData()?.title || targetBook}`);
        } catch (error) {
          console.error('Error navegando a referencia cruzada:', error);
          window.toast?.error('Error al cargar el libro referenciado');
        }
      });
    });

    // Premium edition download button - opens modal
    const downloadPremiumBtn = document.getElementById('download-premium-btn');
    if (downloadPremiumBtn) {
      downloadPremiumBtn.addEventListener('click', () => {
        this.showPremiumDownloadModal();
      });
    }

    // ========================================================================
    // EXERCISE LINK BUTTONS - Navigate to practice books
    // ========================================================================
    const exerciseLinkBtns = document.querySelectorAll('.exercise-link-btn');
    exerciseLinkBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetBook = btn.getAttribute('data-book');
        const exerciseId = btn.getAttribute('data-exercise-id');
        const exerciseTitle = btn.getAttribute('data-exercise-title');

        try {
          // Cargar el libro de destino
          await this.bookEngine.loadBook(targetBook);
          window.themeHelper?.applyBookTheme(this.bookEngine.getCurrentBookConfig());

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

          // Navegar al capítulo o al primero si no se encontró
          if (targetChapterId) {
            this.currentChapter = this.bookEngine.navigateToChapter(targetChapterId);
          } else {
            this.currentChapter = this.bookEngine.navigateToChapter(this.bookEngine.getFirstChapter().id);
          }

          this.render();
          this.attachEventListeners();

          // Scroll al inicio
          const contentArea = document.querySelector('.chapter-content');
          if (contentArea) contentArea.scrollTop = 0;

        } catch (error) {
          console.error('Error navigating to exercise:', error);
          window.toast.error('error.navigationFailed');
        }
      });
    });

    // ========================================================================
    // CROSS REFERENCE BUTTONS - Navigate to related books
    // ========================================================================
    const crossRefBtns = document.querySelectorAll('.cross-reference-btn');
    crossRefBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetBook = btn.getAttribute('data-book');
        const targetChapterId = btn.getAttribute('data-chapter-id');

        try {
          // Cargar el libro de destino
          await this.bookEngine.loadBook(targetBook);
          window.themeHelper?.applyBookTheme(this.bookEngine.getCurrentBookConfig());

          // Navegar al capítulo específico o al primero si no se especifica
          if (targetChapterId) {
            this.currentChapter = this.bookEngine.navigateToChapter(targetChapterId);
          }

          if (!this.currentChapter) {
            this.currentChapter = this.bookEngine.navigateToChapter(this.bookEngine.getFirstChapter().id);
          }

          this.render();
          this.attachEventListeners();

          // Scroll al inicio
          const contentArea = document.querySelector('.chapter-content');
          if (contentArea) contentArea.scrollTop = 0;

        } catch (error) {
          console.error('Error navigating to cross reference:', error);
          window.toast.error('error.navigationFailed');
        }
      });
    });

    // ========================================================================
    // ACTION LINK BUTTONS - Navigate to Guía de Acciones
    // ========================================================================

    // Botón para abrir el libro completo de Guía de Acciones
    const openActionsBookBtns = document.querySelectorAll('.open-actions-book-btn');
    openActionsBookBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetBook = btn.getAttribute('data-book');

        try {
          await this.bookEngine.loadBook(targetBook);
          window.themeHelper?.applyBookTheme(this.bookEngine.getCurrentBookConfig());

          // Navegar al prólogo o primer capítulo
          const firstChapter = this.bookEngine.getFirstChapter();
          this.currentChapter = this.bookEngine.navigateToChapter(firstChapter?.id || 'prologo');

          this.render();
          this.attachEventListeners();

          const contentArea = document.querySelector('.chapter-content');
          if (contentArea) contentArea.scrollTop = 0;

        } catch (error) {
          console.error('Error opening actions book:', error);
          window.toast.error('Error al abrir la Guía de Acciones');
        }
      });
    });

    // Botones para abrir una acción específica
    const openActionDetailBtns = document.querySelectorAll('.open-action-detail-btn');
    openActionDetailBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetBook = btn.getAttribute('data-book');
        const targetChapterId = btn.getAttribute('data-chapter');

        try {
          await this.bookEngine.loadBook(targetBook);
          window.themeHelper?.applyBookTheme(this.bookEngine.getCurrentBookConfig());

          // Navegar al capítulo de la acción específica
          if (targetChapterId) {
            this.currentChapter = this.bookEngine.navigateToChapter(targetChapterId);
          }

          if (!this.currentChapter) {
            this.currentChapter = this.bookEngine.navigateToChapter(this.bookEngine.getFirstChapter().id);
          }

          this.render();
          this.attachEventListeners();

          const contentArea = document.querySelector('.chapter-content');
          if (contentArea) contentArea.scrollTop = 0;

        } catch (error) {
          console.error('Error navigating to action detail:', error);
          window.toast.error('Error al abrir la acción');
        }
      });
    });

    // ========================================================================
    // TOOLKIT LINK BUTTONS - Navigate to Toolkit de Transición
    // ========================================================================

    // Botón para abrir un ejercicio específico del Toolkit
    const toolkitExerciseBtns = document.querySelectorAll('.toolkit-exercise-btn');
    toolkitExerciseBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetBook = btn.getAttribute('data-book');
        const targetChapterId = btn.getAttribute('data-chapter-id');

        try {
          await this.bookEngine.loadBook(targetBook);
          window.themeHelper?.applyBookTheme(this.bookEngine.getCurrentBookConfig());

          // Navegar al capítulo del ejercicio específico
          if (targetChapterId) {
            this.currentChapter = this.bookEngine.navigateToChapter(targetChapterId);
          }

          if (!this.currentChapter) {
            this.currentChapter = this.bookEngine.navigateToChapter(this.bookEngine.getFirstChapter().id);
          }

          this.render();
          this.attachEventListeners();

          const contentArea = document.querySelector('.chapter-content');
          if (contentArea) contentArea.scrollTop = 0;

        } catch (error) {
          console.error('Error navigating to toolkit exercise:', error);
          window.toast.error('Error al abrir el ejercicio del Toolkit');
        }
      });
    });

    // Botón para abrir el libro completo del Toolkit
    const openToolkitBookBtns = document.querySelectorAll('.open-toolkit-book-btn');
    openToolkitBookBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetBook = btn.getAttribute('data-book');

        try {
          await this.bookEngine.loadBook(targetBook);
          window.themeHelper?.applyBookTheme(this.bookEngine.getCurrentBookConfig());

          // Navegar al primer capítulo
          const firstChapter = this.bookEngine.getFirstChapter();
          this.currentChapter = this.bookEngine.navigateToChapter(firstChapter?.id || 'toolkit-1');

          this.render();
          this.attachEventListeners();

          const contentArea = document.querySelector('.chapter-content');
          if (contentArea) contentArea.scrollTop = 0;

        } catch (error) {
          console.error('Error opening toolkit book:', error);
          window.toast.error('Error al abrir el Toolkit de Transición');
        }
      });
    });

    // ========================================================================
    // MANIFIESTO LINK BUTTONS - Navigate to Manifiesto from Manual/Toolkit
    // ========================================================================
    const manifiestoLinkBtns = document.querySelectorAll('.manifiesto-link-btn');
    manifiestoLinkBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetBook = btn.getAttribute('data-book');
        const targetChapterId = btn.getAttribute('data-chapter-id');

        try {
          await this.bookEngine.loadBook(targetBook);
          window.themeHelper?.applyBookTheme(this.bookEngine.getCurrentBookConfig());

          if (targetChapterId) {
            this.currentChapter = this.bookEngine.navigateToChapter(targetChapterId);
          }

          if (!this.currentChapter) {
            this.currentChapter = this.bookEngine.navigateToChapter(this.bookEngine.getFirstChapter().id);
          }

          this.render();
          this.attachEventListeners();

          const contentArea = document.querySelector('.chapter-content');
          if (contentArea) contentArea.scrollTop = 0;

        } catch (error) {
          console.error('Error navigating to Manifiesto:', error);
          window.toast.error('Error al abrir el Manifiesto');
        }
      });
    });

    // ========================================================================
    // PARENT BOOK BUTTONS - Navigate back to main book from exercises
    // ========================================================================
    const parentBookBtns = document.querySelectorAll('.parent-book-btn');
    parentBookBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetBook = btn.getAttribute('data-book');
        const targetChapterId = btn.getAttribute('data-chapter-id');

        try {
          await this.bookEngine.loadBook(targetBook);
          window.themeHelper?.applyBookTheme(this.bookEngine.getCurrentBookConfig());

          // Navegar al capítulo del libro principal
          if (targetChapterId) {
            this.currentChapter = this.bookEngine.navigateToChapter(targetChapterId);
          }

          if (!this.currentChapter) {
            this.currentChapter = this.bookEngine.navigateToChapter(this.bookEngine.getFirstChapter().id);
          }

          this.render();
          this.attachEventListeners();

          const contentArea = document.querySelector('.chapter-content');
          if (contentArea) contentArea.scrollTop = 0;

        } catch (error) {
          console.error('Error navigating to parent book:', error);
          window.toast.error('Error al abrir el libro principal');
        }
      });
    });

    // ========================================================================
    // AI SUGGESTIONS - Attach click handlers for chapter suggestions
    // ========================================================================
    if (window.aiSuggestions) {
      window.aiSuggestions.attachToChapterContent();
    }
  }

  // ==========================================================================
  // NAVEGACIÓN
  // ==========================================================================

  navigateToChapter(chapterId) {
    const chapter = this.bookEngine.navigateToChapter(chapterId);
    if (chapter) {
      this.show(chapter);
      // Scroll to top
      const contentArea = document.querySelector('.chapter-content');
      if (contentArea) {
        contentArea.scrollTop = 0;
      }
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

    // Event listeners
    const closeBtn = modal.querySelector('#close-premium-modal');
    closeBtn.addEventListener('click', () => modal.remove());

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    const downloadFreeBtn = modal.querySelector('#download-free-btn');
    downloadFreeBtn.addEventListener('click', () => {
      const file = downloadFreeBtn.getAttribute('data-premium-file');
      window.open(file, '_blank');
      modal.remove();
    });
  }

  // ==========================================================================
  // SHARE HELPERS
  // ==========================================================================

  shareCurrentChapter() {
    if (!window.shareHelper || !this.currentChapter) return;

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
      window.shareHelper.shareQuote({
        quote: quote.substring(0, 280), // Limit to tweet-like length
        author: this.currentChapter.epigraph?.author || '',
        bookTitle: bookTitle,
        chapterTitle: chapterTitle
      });
    } else {
      // Share progress instead
      window.shareHelper.shareProgress({
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
    if (!window.themeHelper) return;

    const icon = window.themeHelper.getThemeIcon();
    const label = window.themeHelper.getThemeLabel();

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
      if (window.chapterResourcesModal) {
        window.chapterResourcesModal.close();
      }

      // Load the target book
      await this.bookEngine.loadBook(bookId);
      window.themeHelper?.applyBookTheme(this.bookEngine.getCurrentBookConfig());

      // Navigate to the exercise chapter
      this.currentChapter = this.bookEngine.navigateToChapter(exerciseId);

      if (!this.currentChapter) {
        // Fallback to first chapter if not found
        this.currentChapter = this.bookEngine.navigateToChapter(this.bookEngine.getFirstChapter().id);
        window.toast.warning('Ejercicio no encontrado, mostrando primer capítulo');
      }

      this.render();
      this.attachEventListeners();

      // Scroll to top
      const contentArea = document.querySelector('.chapter-content');
      if (contentArea) contentArea.scrollTop = 0;

      window.toast.success('Navegando al ejercicio...');

    } catch (error) {
      console.error('Error navigating to exercise:', error);
      window.toast.error('Error al navegar al ejercicio');
    }
  }

  /**
   * Navigate to a specific practice in Prácticas Radicales
   * Called from chapter-resources-modal.js practice cards
   */
  async navigateToPractice(bookId, practiceId) {
    try {
      // Close chapter resources modal if open
      if (window.chapterResourcesModal) {
        window.chapterResourcesModal.close();
      }

      // Load the target book
      await this.bookEngine.loadBook(bookId);
      window.themeHelper?.applyBookTheme(this.bookEngine.getCurrentBookConfig());

      // Navigate to the practice chapter
      this.currentChapter = this.bookEngine.navigateToChapter(practiceId);

      if (!this.currentChapter) {
        // Fallback to first chapter if not found
        this.currentChapter = this.bookEngine.navigateToChapter(this.bookEngine.getFirstChapter().id);
        window.toast.warning('Práctica no encontrada, mostrando primer capítulo');
      }

      this.render();
      this.attachEventListeners();

      // Scroll to top
      const contentArea = document.querySelector('.chapter-content');
      if (contentArea) contentArea.scrollTop = 0;

      window.toast.success('Navegando a la práctica...');

    } catch (error) {
      console.error('Error navigating to practice:', error);
      window.toast.error('Error al navegar a la práctica');
    }
  }

}

// Exportar para uso global
window.BookReader = BookReader;
