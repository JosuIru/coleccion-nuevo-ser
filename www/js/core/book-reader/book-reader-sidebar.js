// ============================================================================
// BOOK READER SIDEBAR - Gestión del panel lateral de navegación
// ============================================================================
// v2.9.279: Modularización del BookReader
// Renderizado y control del sidebar, lista de capítulos, progreso

class BookReaderSidebar {
  constructor(bookReader) {
    this.bookReader = bookReader;
  }

  // ==========================================================================
  // ACCESSORS - Acceso a propiedades del BookReader principal
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

  set sidebarOpen(value) {
    this.bookReader.sidebarOpen = value;
  }

  get eventManager() {
    return this.bookReader.eventManager;
  }

  // ==========================================================================
  // HELPER - Acceso a dependencias
  // ==========================================================================

  getDependency(name) {
    return this.bookReader.getDependency(name);
  }

  // ==========================================================================
  // RENDER SIDEBAR
  // ==========================================================================

  /**
   * Renderiza el sidebar completo con lista de capítulos
   * @returns {string} HTML del sidebar
   */
  renderSidebar() {
    const chapters = this.bookEngine.getAllChapters();
    const bookData = this.bookEngine.getCurrentBookData();

    return `
      <!-- Backdrop oscuro en móvil cuando sidebar está abierto -->
      ${this.sidebarOpen ? '<div id="sidebar-backdrop" class="fixed inset-0 bg-black/60 z-40 sm:hidden" onclick="window.bookReader?.toggleSidebar()"></div>' : ''}

      <!-- Sidebar: Fixed overlay en móvil, normal en desktop -->
      <div class="sidebar ${this.sidebarOpen ? 'w-full sm:w-80' : 'w-0'}
                  fixed sm:relative top-0 left-0 h-full sm:h-auto z-50 sm:z-auto
                  flex-shrink-0 bg-white/95 dark:bg-gray-900/95 sm:bg-white/50 dark:sm:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700
                  overflow-hidden transition-all duration-300 flex flex-col">
        <!-- Fixed Header Section -->
        <div class="flex-shrink-0 p-4 sm:p-6 pb-3 sm:pb-4">
          <!-- Close Sidebar Button (visible on all screens) -->
          <!-- 🔧 v2.9.325: Agregar onclick inline para garantizar funcionamiento -->
          <button id="close-sidebar-mobile" class="absolute top-2 right-2 w-10 h-10 flex items-center justify-center text-2xl sm:text-3xl font-bold hover:bg-red-500/20 hover:text-red-400 text-gray-800 dark:text-white transition-all rounded-lg z-20 border-2 border-gray-300 dark:border-gray-500 bg-gray-100 dark:bg-gray-800 shadow-lg"
                  aria-label="Cerrar índice"
                  title="Cerrar índice de capítulos"
                  onclick="window.bookReader?.toggleSidebar()">
            ×
          </button>

          <!-- 🔧 v2.9.334: Botón Volver a Biblioteca -->
          <button id="sidebar-back-to-library"
                  class="w-full mb-3 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  title="Volver a la biblioteca"
                  aria-label="Volver a la biblioteca">
            <span>←</span>
            <span>Biblioteca</span>
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
            ${chapters.map(chapter => this.renderChapterItem(chapter)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // RENDER SIDEBAR PROGRESS
  // ==========================================================================

  /**
   * Renderiza la barra de progreso del libro en el sidebar
   * @returns {string} HTML de la sección de progreso
   */
  renderSidebarProgress() {
    const bookId = this.bookEngine.getCurrentBook();
    const progress = this.bookEngine.getProgress(bookId);

    return `
      <div class="progress-box p-3 sm:p-4 rounded-lg bg-gray-100/80 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700">
        <div class="flex justify-between text-xs sm:text-sm mb-2">
          <span>Progreso</span>
          <span class="font-bold">${progress.percentage}%</span>
        </div>
        <div class="w-full h-1.5 sm:h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
               style="width: ${progress.percentage}%"></div>
        </div>
        <p class="text-xs opacity-60 mt-1.5 sm:mt-2">
          ${progress.chaptersRead} de ${progress.totalChapters} capítulos
        </p>
      </div>
    `;
  }

  // ==========================================================================
  // RENDER CHAPTER ITEM
  // ==========================================================================

  /**
   * Renderiza un item de capítulo en la lista del sidebar
   * @param {Object} chapter - Datos del capítulo
   * @returns {string} HTML del item de capítulo
   */
  renderChapterItem(chapter) {
    const isActive = chapter.id === this.currentChapter?.id;
    const isRead = this.bookEngine.isChapterRead(chapter.id);
    const Icons = this.getDependency('Icons');

    return `
      <div class="chapter-item p-2 sm:p-3 rounded-lg cursor-pointer transition-all ${
        isActive ? 'bg-cyan-600/30 border border-cyan-500' : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
      }"
           data-chapter-id="${chapter.id}">
        <div class="flex items-center gap-1.5 sm:gap-2">
          <button class="chapter-read-toggle p-1.5 sm:p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700/50 transition ${isRead ? 'text-green-400' : 'opacity-30 hover:opacity-60'}"
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

  // ==========================================================================
  // TOGGLE SIDEBAR
  // ==========================================================================

  /**
   * Abre o cierra el sidebar, actualizando clases y backdrop
   */
  toggleSidebar() {
    console.log('[BookReaderSidebar.toggleSidebar] CALLED, current sidebarOpen:', this.sidebarOpen);
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

    // Manejar backdrop (fondo oscuro en móvil)
    const backdrop = document.getElementById('sidebar-backdrop');
    if (this.sidebarOpen && window.innerWidth < 768) {
      // Crear backdrop si no existe
      if (!backdrop) {
        const newBackdrop = document.createElement('div');
        newBackdrop.id = 'sidebar-backdrop';
        newBackdrop.className = 'fixed inset-0 bg-black/60 z-40';
        newBackdrop.onclick = () => this.toggleSidebar();
        document.body.appendChild(newBackdrop);
      }
    } else if (backdrop) {
      // Quitar backdrop al cerrar
      backdrop.remove();
    }

    // Actualizar icono y texto del botón toggle
    const toggleBtn = document.getElementById('toggle-sidebar');
    const toggleText = document.getElementById('toggle-sidebar-text');

    console.log('[toggleSidebar] sidebarOpen:', this.sidebarOpen, 'toggleBtn:', !!toggleBtn, 'toggleText:', !!toggleText);

    if (toggleText) {
      const text = this.sidebarOpen ? 'Ocultar' : 'Índice';
      toggleText.textContent = text;
      console.log('[toggleSidebar] Updated text to:', text);
    }

    if (toggleBtn) {
      toggleBtn.setAttribute('aria-label', this.sidebarOpen ? 'Contraer barra lateral' : 'Expandir barra lateral');
      toggleBtn.setAttribute('title', this.sidebarOpen ? 'Contraer barra lateral' : 'Expandir barra lateral');
    }
  }

  // ==========================================================================
  // UPDATE SIDEBAR
  // ==========================================================================

  /**
   * Actualiza solo el sidebar sin reconstruir todo el reader
   * Evita re-renderizado completo, solo actualiza el sidebar y preserva su estado
   */
  updateSidebar() {
    try {
      const sidebarContainer = document.querySelector('.sidebar');
      if (sidebarContainer) {
        // Renderizado parcial - solo sidebar
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = this.renderSidebar();

        // renderSidebar() puede retornar backdrop + sidebar
        // Buscar específicamente el elemento con clase .sidebar
        const newSidebar = tempDiv.querySelector('.sidebar');
        if (newSidebar) {
          // Preservar estado de apertura del sidebar
          if (this.sidebarOpen) {
            newSidebar.classList.remove('-translate-x-full');
          } else {
            newSidebar.classList.add('-translate-x-full');
          }
          sidebarContainer.replaceWith(newSidebar);
        }

        // Actualizar o remover backdrop si existe
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

        // Re-attach listeners para chapter items en el sidebar
        this.attachChapterListeners();

        // 🔧 v2.9.342: Corregir acceso a handlers - están en events, no en bookReader
        const events = this.bookReader.events;

        // Re-attach close sidebar button
        if (events?._closeSidebarHandler) {
          const closeBtn = document.getElementById('close-sidebar-mobile');
          if (closeBtn) {
            this.eventManager.addEventListener(closeBtn, 'click', events._closeSidebarHandler);
          }
        }

        // Re-attach sidebar-back-to-library button
        if (events?._backToBibliotecaHandler) {
          const sidebarBackBtn = document.getElementById('sidebar-back-to-library');
          if (sidebarBackBtn) {
            this.eventManager.addEventListener(sidebarBackBtn, 'click', events._backToBibliotecaHandler);
          }
        }

        // Re-inicializar iconos
        const Icons = this.getDependency('Icons');
        if (Icons?.init) {
          Icons.init();
        }
      }
    } catch (error) {
      // Error boundary para actualización de sidebar
      logger.error('[BookReaderSidebar] Error actualizando sidebar:', error);
      if (this.bookReader.captureError) {
        this.bookReader.captureError(error, {
          context: 'update_sidebar',
          chapterId: this.currentChapter?.id,
          filename: 'book-reader-sidebar.js'
        });
      }
    }
  }

  // ==========================================================================
  // ATTACH CHAPTER LISTENERS
  // ==========================================================================

  /**
   * Attach listeners para los items de capítulos en el sidebar
   */
  attachChapterListeners() {
    // Chapter read toggle buttons
    const readToggleBtns = document.querySelectorAll('.chapter-read-toggle');
    readToggleBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', (event) => {
        event.stopPropagation();
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
        this.bookReader.navigateToChapter(chapterId);
        // Cerrar sidebar en móvil usando toggleSidebar para sincronizar estado
        if (window.innerWidth < 768 && this.sidebarOpen) {
          this.toggleSidebar();
        }
      });
    });

    // Chapter items
    const chapterItems = document.querySelectorAll('.chapter-item');
    chapterItems.forEach(item => {
      this.eventManager.addEventListener(item, 'click', (event) => {
        if (event.target.closest('.chapter-read-toggle') || event.target.closest('.chapter-title-area')) {
          return;
        }
        const chapterId = item.getAttribute('data-chapter-id');
        this.bookReader.navigateToChapter(chapterId);
        // Cerrar sidebar en móvil usando toggleSidebar para sincronizar estado
        if (window.innerWidth < 768 && this.sidebarOpen) {
          this.toggleSidebar();
        }
      });
    });
  }
}

// Exportar como global
window.BookReaderSidebar = BookReaderSidebar;
