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
  }

  hide() {
    const container = document.getElementById('book-reader-view');
    if (container) {
      container.classList.add('hidden');
    }
  }

  render() {
    const container = document.getElementById('book-reader-view');
    if (!container) return;

    let html = `
      <div class="book-reader-container flex h-screen">
        <!-- Sidebar -->
        ${this.renderSidebar()}

        <!-- Main Content -->
        <div class="main-content flex-1 flex flex-col">
          <!-- Header -->
          ${this.renderHeader()}

          <!-- Chapter Content -->
          <div class="chapter-content flex-1 overflow-y-auto p-8">
            ${this.renderChapterContent()}
          </div>

          <!-- Footer Navigation -->
          ${this.renderFooterNav()}
        </div>
      </div>
    `;

    // Add mobile menu
    html += this.renderMobileMenu();

    container.innerHTML = html;

    // Initialize Lucide icons
    if (window.Icons) {
      Icons.init();
    }
  }

  renderSidebar() {
    const chapters = this.bookEngine.getAllChapters();
    const bookData = this.bookEngine.getCurrentBookData();

    return `
      <div class="sidebar ${this.sidebarOpen ? 'w-full sm:w-80' : 'w-0'} flex-shrink-0 bg-gray-900/50 border-r border-gray-700 overflow-hidden transition-all duration-300 flex flex-col relative">
        <!-- Fixed Header Section -->
        <div class="flex-shrink-0 p-6 pb-4">
          <!-- Mobile Close Button (visible only on small screens) -->
          <button id="close-sidebar-mobile" class="sm:hidden absolute top-4 right-4 text-3xl hover:text-red-400 transition-colors p-2 z-10"
                  aria-label="${this.i18n.t('menu.close')}"
                  title="${this.i18n.t('menu.close')}">
            ×
          </button>

          <!-- Book Title -->
          <div class="mb-4">
            <h2 class="text-2xl font-bold mb-1">${bookData.title}</h2>
            <p class="text-sm opacity-70">${bookData.subtitle}</p>
          </div>

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
          <button class="chapter-read-toggle p-1 rounded hover:bg-gray-700/50 transition ${isRead ? 'text-green-400' : 'opacity-30 hover:opacity-60'}"
                  data-chapter-id="${chapter.id}"
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
            <button id="toggle-sidebar" class="p-2 hover:bg-gray-800 rounded-lg transition">
              ${this.sidebarOpen ? Icons.chevronLeft() : Icons.chevronRight()}
            </button>
            <button id="back-to-biblioteca" class="p-2 hover:bg-gray-800 rounded-lg transition flex items-center gap-1">
              ${Icons.library()} <span class="hidden lg:inline text-sm">${this.i18n.t('nav.library')}</span>
            </button>
          </div>

          <!-- Center: Chapter Title (only on large screens) -->
          <div class="hidden lg:block text-center flex-1 min-w-0 px-2">
            <h3 class="text-base font-bold truncate">${this.currentChapter?.title || ''}</h3>
          </div>

          <!-- Right: Actions -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <!-- Mobile Menu Button (visible on small screens) -->
            <button id="mobile-menu-btn" class="md:hidden p-2 hover:bg-gray-800 rounded-lg transition" title="${this.i18n.t('menu.open')}" aria-label="${this.i18n.t('menu.open')}">
              ${Icons.menu()}
            </button>

            <!-- Tablet view (md): Main actions + More dropdown -->
            <div class="hidden md:flex lg:hidden items-center gap-1">
              <button id="bookmark-btn-tablet" class="p-2 hover:bg-gray-800 rounded-lg transition" title="${this.i18n.t('reader.bookmark')}">
                ${isBookmarked ? Icons.bookmarkFilled() : Icons.bookmark()}
              </button>
              <button id="ai-chat-btn-tablet" class="p-2 hover:bg-gray-800 rounded-lg transition" title="${this.i18n.t('reader.chat')}">
                ${Icons.chat()}
              </button>
              <button id="audioreader-btn-tablet" class="p-2 hover:bg-gray-800 rounded-lg transition" title="${this.i18n.t('reader.audio')}">
                ${Icons.audio()}
              </button>
              <div class="w-px h-5 bg-gray-700 mx-1"></div>
              <!-- More actions dropdown for tablet -->
              <div class="relative">
                <button id="more-actions-btn" class="p-2 hover:bg-gray-800 rounded-lg transition" title="${this.i18n.t('menu.more') || 'Más'}">
                  ${Icons.moreVertical ? Icons.moreVertical() : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>`}
                </button>
                <div id="more-actions-dropdown" class="hidden absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
                  <button id="notes-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3">
                    ${Icons.note(18)} <span>${this.i18n.t('reader.notes')}</span>
                  </button>
                  ${hasTimeline ? `<button id="timeline-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3">${Icons.timeline(18)} <span>${this.i18n.t('reader.timeline')}</span></button>` : ''}
                  ${hasResources ? `<button id="resources-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3">${Icons.resources(18)} <span>${this.i18n.t('reader.resources')}</span></button>` : ''}
                  ${hasManualPractico ? `<button id="manual-practico-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3">${Icons.manual(18)} <span>${this.i18n.t('reader.manualPractico')}</span></button>` : ''}
                  ${hasPracticasRadicales ? `<button id="practicas-radicales-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3">${Icons.radical(18)} <span>${this.i18n.t('reader.practicasRadicales')}</span></button>` : ''}
                  ${hasKoan ? `<button id="koan-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3">${Icons.koan(18)} <span>${this.i18n.t('reader.koan')}</span></button>` : ''}
                  <div class="border-t border-gray-700 my-1"></div>
                  <button id="android-download-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3">${Icons.download(18)} <span>${this.i18n.t('btn.download')}</span></button>
                  <button id="ai-settings-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3">${Icons.settings(18)} <span>${this.i18n.t('btn.aiSettings')}</span></button>
                  <button id="donations-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3">${Icons.donate(18)} <span>${this.i18n.t('btn.support')}</span></button>
                  <button id="premium-edition-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-amber-900/30 flex items-center gap-3 text-amber-400">${Icons.book(18)} <span>${this.i18n.t('premium.title')}</span></button>
                  <button id="language-selector-btn-dropdown" class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-3">${Icons.language(18)} <span>${this.i18n.t('lang.title')}</span></button>
                </div>
              </div>
            </div>

            <!-- Desktop view (lg+): All actions visible -->
            <div class="hidden lg:flex items-center gap-1">
              <button id="bookmark-btn" class="p-2 hover:bg-gray-800 rounded-lg transition" title="${this.i18n.t('reader.bookmark')}">
                ${isBookmarked ? Icons.bookmarkFilled() : Icons.bookmark()}
              </button>
              <button id="notes-btn" class="p-2 hover:bg-gray-800 rounded-lg transition" title="${this.i18n.t('reader.notes')}">
                ${Icons.note()}
              </button>
              <button id="ai-chat-btn" class="p-2 hover:bg-gray-800 rounded-lg transition" title="${this.i18n.t('reader.chat')}">
                ${Icons.chat()}
              </button>
              <div class="w-px h-5 bg-gray-700 mx-1"></div>
              ${hasTimeline ? `<button id="timeline-btn" class="p-2 hover:bg-gray-800 rounded-lg transition" title="${this.i18n.t('reader.timeline')}">${Icons.timeline()}</button>` : ''}
              ${hasResources ? `<button id="resources-btn" class="p-2 hover:bg-gray-800 rounded-lg transition" title="${this.i18n.t('reader.resources')}">${Icons.resources()}</button>` : ''}
              ${hasManualPractico ? `<button id="manual-practico-btn" class="p-2 hover:bg-gray-800 rounded-lg transition" title="${this.i18n.t('reader.manualPractico')}">${Icons.manual()}</button>` : ''}
              ${hasPracticasRadicales ? `<button id="practicas-radicales-btn" class="p-2 hover:bg-gray-800 rounded-lg transition" title="${this.i18n.t('reader.practicasRadicales')}">${Icons.radical()}</button>` : ''}
              <button id="audioreader-btn" class="p-2 hover:bg-gray-800 rounded-lg transition" title="${this.i18n.t('reader.audio')}">${Icons.audio()}</button>
              ${hasKoan ? `<button id="koan-btn" class="p-2 hover:bg-gray-800 rounded-lg transition" title="${this.i18n.t('reader.koan')}">${Icons.koan()}</button>` : ''}
              <div class="w-px h-5 bg-gray-700 mx-1"></div>
              <button id="achievements-btn" class="p-2 hover:bg-amber-900/50 rounded-lg transition text-amber-400" title="Mis Logros">${Icons.trophy()}</button>
              <button id="android-download-btn" class="p-2 hover:bg-gray-800 rounded-lg transition" title="${this.i18n.t('btn.download')}">${Icons.download()}</button>
              <button id="ai-settings-btn" class="p-2 hover:bg-gray-800 rounded-lg transition" title="${this.i18n.t('btn.aiSettings')}">${Icons.settings()}</button>
              <button id="donations-btn" class="p-2 hover:bg-gray-800 rounded-lg transition" title="${this.i18n.t('btn.support')}">${Icons.donate()}</button>
              <button id="premium-edition-btn" class="p-2 hover:bg-amber-900/50 rounded-lg transition text-amber-400" title="${this.i18n.t('premium.title')}">${Icons.book()}</button>
              <button id="language-selector-btn" class="p-2 hover:bg-gray-800 rounded-lg transition" title="${this.i18n.t('lang.title')}">${Icons.language()}</button>
            </div>
          </div>
        </div>

        <!-- Segunda fila: Título del capítulo (móvil y tablet) -->
        <div class="lg:hidden mt-2 text-center">
          <h3 class="text-sm font-bold text-gray-200 truncate px-2">${this.currentChapter?.title || ''}</h3>
        </div>
      </div>
    `;
  }

  renderChapterContent() {
    if (!this.currentChapter) return '<p>No hay capítulo seleccionado</p>';

    let html = '<div class="chapter max-w-4xl mx-auto">';

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
    html += `<div class="content prose prose-invert max-w-none">`;
    html += this.bookEngine.renderContent(this.currentChapter.content);
    html += `</div>`;

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

    // Botón de marcar capítulo como leído
    html += this.renderMarkAsReadButton();

    html += '</div>';

    return html;
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
      <div class="footer-nav border-t border-gray-700 p-4 flex justify-between">
        <!-- Previous -->
        ${prevChapter ? `
          <button id="prev-chapter"
                  class="px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition flex items-center gap-2"
                  data-chapter-id="${prevChapter.id}">
            ${Icons.chevronLeft(18)} ${prevChapter.title}
          </button>
        ` : '<div></div>'}

        <!-- Next -->
        ${nextChapter ? `
          <button id="next-chapter"
                  class="px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition flex items-center gap-2"
                  data-chapter-id="${nextChapter.id}">
            ${nextChapter.title} ${Icons.chevronRight(18)}
          </button>
        ` : '<div></div>'}
      </div>
    `;
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
            <!-- Main Actions -->
            <button id="bookmark-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
              ${isBookmarked ? Icons.bookmarkFilled(24) : Icons.bookmark(24)}
              <span>${this.i18n.t('reader.bookmark')}</span>
            </button>

            <button id="notes-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
              ${Icons.note(24)}
              <span>${this.i18n.t('reader.notes')}</span>
            </button>

            <button id="ai-chat-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
              ${Icons.chat(24)}
              <span>${this.i18n.t('reader.chat')}</span>
            </button>

            <div class="border-t border-gray-700 my-3"></div>

            <!-- Feature Buttons -->
            ${hasTimeline ? `
              <button id="timeline-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
                ${Icons.timeline(24)}
                <span>${this.i18n.t('reader.timeline')}</span>
              </button>
            ` : ''}

            ${hasResources ? `
              <button id="resources-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
                ${Icons.resources(24)}
                <span>${this.i18n.t('reader.resources')}</span>
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

            <button id="audioreader-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
              ${Icons.audio(24)}
              <span>${this.i18n.t('reader.audio')}</span>
            </button>

            ${hasKoan ? `
            <button id="koan-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
              ${Icons.koan(24)}
              <span>${this.i18n.t('reader.koan')}</span>
            </button>
            ` : ''}

            <div class="border-t border-gray-700 my-3"></div>

            <button id="android-download-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
              ${Icons.download(24)}
              <span>${this.i18n.t('btn.download')}</span>
            </button>

            <button id="ai-settings-btn-mobile" class="w-full text-left p-3 hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
              ${Icons.settings(24)}
              <span>${this.i18n.t('btn.aiSettings')}</span>
            </button>

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
            </div>
          </div>
        </div>
      </div>
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
        this.sidebarOpen = !this.sidebarOpen;
        this.render();
        this.attachEventListeners();
      });
    }

    // Close sidebar (mobile)
    const closeSidebarMobile = document.getElementById('close-sidebar-mobile');
    if (closeSidebarMobile) {
      closeSidebarMobile.addEventListener('click', () => {
        this.sidebarOpen = false;
        this.render();
        this.attachEventListeners();
      });
    }

    // Back to biblioteca
    const backBtn = document.getElementById('back-to-biblioteca');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
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

    // Bookmark button (desktop lg+ and tablet md)
    const bookmarkHandler = () => {
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

    if (bookmarkBtn) bookmarkBtn.addEventListener('click', bookmarkHandler);
    if (bookmarkBtnTablet) bookmarkBtnTablet.addEventListener('click', bookmarkHandler);

    // AI Chat button (desktop lg+ and tablet md)
    const aiChatHandler = () => {
      if (window.aiChatModal) {
        window.aiChatModal.open();
      } else {
        window.toast.error('error.chatNotAvailable');
      }
    };

    const aiChatBtn = document.getElementById('ai-chat-btn');
    const aiChatBtnTablet = document.getElementById('ai-chat-btn-tablet');

    if (aiChatBtn) aiChatBtn.addEventListener('click', aiChatHandler);
    if (aiChatBtnTablet) aiChatBtnTablet.addEventListener('click', aiChatHandler);

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

    // Resources button
    const resourcesBtn = document.getElementById('resources-btn');
    if (resourcesBtn) {
      resourcesBtn.addEventListener('click', () => {
        if (window.resourcesViewer) {
          window.resourcesViewer.open();
        } else {
          window.toast.error('error.resourcesNotAvailable');
        }
      });
    }

    // Audioreader button (desktop lg+ and tablet md)
    const audioreaderHandler = () => {
      if (window.audioReader) {
        window.audioReader.toggle();
      } else {
        window.toast.error('error.audioreaderNotAvailable');
      }
    };

    const audioreaderBtn = document.getElementById('audioreader-btn');
    const audioreaderBtnTablet = document.getElementById('audioreader-btn-tablet');

    if (audioreaderBtn) audioreaderBtn.addEventListener('click', audioreaderHandler);
    if (audioreaderBtnTablet) audioreaderBtnTablet.addEventListener('click', audioreaderHandler);

    // Android Download button
    const androidBtn = document.getElementById('android-download-btn');
    if (androidBtn) {
      androidBtn.addEventListener('click', () => {
        const apkUrl = this.bookEngine.getLatestAPK();
        window.open(apkUrl, '_blank');
      });
    }

    // AI Settings button
    const aiSettingsBtn = document.getElementById('ai-settings-btn');
    if (aiSettingsBtn) {
      aiSettingsBtn.addEventListener('click', () => {
        if (window.aiSettingsModal) {
          window.aiSettingsModal.open();
        }
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

    // Donations button
    const donationsBtn = document.getElementById('donations-btn');
    if (donationsBtn) {
      donationsBtn.addEventListener('click', () => {
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

    // Language selector button
    const languageSelectorBtn = document.getElementById('language-selector-btn');
    if (languageSelectorBtn) {
      languageSelectorBtn.addEventListener('click', () => {
        if (window.languageSelector) {
          window.languageSelector.open();
        }
      });
    }

    // Manual Práctico button - Navegar al libro en el sistema unificado
    const manualPracticoBtn = document.getElementById('manual-practico-btn');
    if (manualPracticoBtn) {
      manualPracticoBtn.addEventListener('click', async () => {
        await this.bookEngine.loadBook('manual-practico');
        this.bookEngine.applyTheme(this.bookEngine.getCurrentBookConfig());
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
        this.bookEngine.applyTheme(this.bookEngine.getCurrentBookConfig());
        const firstChapter = this.bookEngine.getFirstChapter();
        if (firstChapter) {
          this.currentChapter = this.bookEngine.navigateToChapter(firstChapter.id);
        }
        this.render();
        this.attachEventListeners();
      });
    }

    // ========================================================================
    // MOBILE MENU BUTTON LISTENERS (duplicated from desktop)
    // ========================================================================

    const closeMobileMenuHelper = () => {
      const menu = document.getElementById('mobile-menu');
      if (menu) menu.classList.add('hidden');
    };

    // Bookmark button mobile
    const bookmarkBtnMobile = document.getElementById('bookmark-btn-mobile');
    if (bookmarkBtnMobile) {
      bookmarkBtnMobile.addEventListener('click', () => {
        closeMobileMenuHelper();
        const isBookmarked = this.bookEngine.isBookmarked(this.currentChapter.id);
        if (isBookmarked) {
          this.bookEngine.removeBookmark(this.currentChapter.id);
        } else {
          this.bookEngine.addBookmark(this.currentChapter.id);
        }
        this.render();
        this.attachEventListeners();
      });
    }

    // Notes button mobile
    const notesBtnMobile = document.getElementById('notes-btn-mobile');
    if (notesBtnMobile) {
      notesBtnMobile.addEventListener('click', () => {
        closeMobileMenuHelper();
        if (window.notesModal) {
          window.notesModal.open(this.currentChapter?.id);
        } else {
          window.toast.error('error.notesNotAvailable');
        }
      });
    }

    // AI Chat button mobile
    const aiChatBtnMobile = document.getElementById('ai-chat-btn-mobile');
    if (aiChatBtnMobile) {
      aiChatBtnMobile.addEventListener('click', () => {
        closeMobileMenuHelper();
        if (window.aiChatModal) {
          window.aiChatModal.open();
        } else {
          window.toast.error('error.chatNotAvailable');
        }
      });
    }

    // Timeline button mobile
    const timelineBtnMobile = document.getElementById('timeline-btn-mobile');
    if (timelineBtnMobile) {
      timelineBtnMobile.addEventListener('click', () => {
        closeMobileMenuHelper();
        if (window.timelineViewer) {
          window.timelineViewer.open();
        } else {
          window.toast.error('error.timelineNotAvailable');
        }
      });
    }

    // Resources button mobile
    const resourcesBtnMobile = document.getElementById('resources-btn-mobile');
    if (resourcesBtnMobile) {
      resourcesBtnMobile.addEventListener('click', () => {
        closeMobileMenuHelper();
        if (window.resourcesViewer) {
          window.resourcesViewer.open();
        } else {
          window.toast.error('error.resourcesNotAvailable');
        }
      });
    }

    // Manual Práctico button mobile - Navegar al libro
    const manualPracticoBtnMobile = document.getElementById('manual-practico-btn-mobile');
    if (manualPracticoBtnMobile) {
      manualPracticoBtnMobile.addEventListener('click', async () => {
        closeMobileMenuHelper();
        await this.bookEngine.loadBook('manual-practico');
        this.bookEngine.applyTheme(this.bookEngine.getCurrentBookConfig());
        this.currentChapter = this.bookEngine.navigateToChapter(this.bookEngine.getFirstChapter().id);
        this.render();
        this.attachEventListeners();
      });
    }

    // Prácticas Radicales button mobile - Navegar al libro
    const practicasRadicalesBtnMobile = document.getElementById('practicas-radicales-btn-mobile');
    if (practicasRadicalesBtnMobile) {
      practicasRadicalesBtnMobile.addEventListener('click', async () => {
        closeMobileMenuHelper();
        await this.bookEngine.loadBook('practicas-radicales');
        this.bookEngine.applyTheme(this.bookEngine.getCurrentBookConfig());
        this.currentChapter = this.bookEngine.navigateToChapter(this.bookEngine.getFirstChapter().id);
        this.render();
        this.attachEventListeners();
      });
    }

    // Audioreader button mobile
    const audioreaderBtnMobile = document.getElementById('audioreader-btn-mobile');
    if (audioreaderBtnMobile) {
      audioreaderBtnMobile.addEventListener('click', () => {
        closeMobileMenuHelper();
        if (window.audioReader) {
          window.audioReader.toggle();
        } else {
          window.toast.error('error.audioreaderNotAvailable');
        }
      });
    }

    // Koan button mobile
    const koanBtnMobile = document.getElementById('koan-btn-mobile');
    if (koanBtnMobile) {
      koanBtnMobile.addEventListener('click', () => {
        closeMobileMenuHelper();
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
        closeMobileMenuHelper();
        const apkUrl = this.bookEngine.getLatestAPK();
        window.open(apkUrl, '_blank');
      });
    }

    // AI Settings button mobile
    const aiSettingsBtnMobile = document.getElementById('ai-settings-btn-mobile');
    if (aiSettingsBtnMobile) {
      aiSettingsBtnMobile.addEventListener('click', () => {
        closeMobileMenuHelper();
        if (window.aiSettingsModal) {
          window.aiSettingsModal.open();
        }
      });
    }

    // Donations button mobile
    const donationsBtnMobile = document.getElementById('donations-btn-mobile');
    if (donationsBtnMobile) {
      donationsBtnMobile.addEventListener('click', () => {
        closeMobileMenuHelper();
        if (window.donationsModal) {
          window.donationsModal.open();
        }
      });
    }

    // Premium Edition button mobile - opens modal
    const premiumBtnMobile = document.getElementById('premium-edition-btn-mobile');
    if (premiumBtnMobile) {
      premiumBtnMobile.addEventListener('click', () => {
        closeMobileMenuHelper();
        this.showPremiumDownloadModal();
      });
    }

    // Language selector button mobile
    const languageSelectorBtnMobile = document.getElementById('language-selector-btn-mobile');
    if (languageSelectorBtnMobile) {
      languageSelectorBtnMobile.addEventListener('click', () => {
        closeMobileMenuHelper();
        if (window.languageSelector) {
          window.languageSelector.open();
        }
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

    // Resources button dropdown
    const resourcesBtnDropdown = document.getElementById('resources-btn-dropdown');
    if (resourcesBtnDropdown) {
      resourcesBtnDropdown.addEventListener('click', () => {
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
        this.bookEngine.applyTheme(this.bookEngine.getCurrentBookConfig());
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
        this.bookEngine.applyTheme(this.bookEngine.getCurrentBookConfig());
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

    // AI Settings button dropdown
    const aiSettingsBtnDropdown = document.getElementById('ai-settings-btn-dropdown');
    if (aiSettingsBtnDropdown) {
      aiSettingsBtnDropdown.addEventListener('click', () => {
        closeDropdownHelper();
        if (window.aiSettingsModal) {
          window.aiSettingsModal.open();
        }
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

    // Cross-reference clicks
    const crossRefItems = document.querySelectorAll('.reference');
    crossRefItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetBook = item.getAttribute('data-book');
        const targetChapter = item.getAttribute('data-chapter');
        window.toast.info('feature.crossReference');
        // TODO: Implementar navegación entre libros
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
          this.bookEngine.applyTheme(this.bookEngine.getCurrentBookConfig());

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
          this.bookEngine.applyTheme(this.bookEngine.getCurrentBookConfig());

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
          this.bookEngine.applyTheme(this.bookEngine.getCurrentBookConfig());

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
          this.bookEngine.applyTheme(this.bookEngine.getCurrentBookConfig());

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
          this.bookEngine.applyTheme(this.bookEngine.getCurrentBookConfig());

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
          this.bookEngine.applyTheme(this.bookEngine.getCurrentBookConfig());

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
          this.bookEngine.applyTheme(this.bookEngine.getCurrentBookConfig());

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
          this.bookEngine.applyTheme(this.bookEngine.getCurrentBookConfig());

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
}

// Exportar para uso global
window.BookReader = BookReader;
