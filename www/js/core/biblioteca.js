// ============================================================================
// BIBLIOTECA - Pantalla Principal (Home)
// ============================================================================
// Gestión de la vista principal con grid de libros y navegación

// ============================================================================
// CONFIGURACIONES
// ============================================================================

const BIBLIOTECA_CONFIG = {
  CATEGORIAS_FILTRO: [
    { value: 'all', label: 'library.allCategories' },
    { value: 'Espiritualidad & Ciencia', label: 'Espiritualidad & Ciencia' },
    { value: 'Filosofía Política', label: 'Filosofía Política' },
    { value: 'Activismo & Transformación Social', label: 'Activismo & Transformación Social' },
    { value: 'Prácticas & Ejercicios', label: 'Prácticas & Ejercicios' },
    { value: 'Prácticas Avanzadas', label: 'Prácticas Avanzadas' }
  ],

  // Botones destacados siempre visibles
  BOTONES_PRIMARIOS: [
    { id: 'practice-library-btn-bib', icon: 'book-open', label: 'Prácticas', gradient: 'from-violet-600 to-purple-600', hoverGradient: 'from-violet-700 to-purple-700', handler: 'handlePracticeLibraryButton', featured: true },
    { id: 'exploration-hub-btn-bib', icon: 'compass', label: 'Explorar', gradient: 'from-purple-600 via-pink-600 to-blue-600', hoverGradient: 'from-purple-700 via-pink-700 to-blue-700', handler: 'handleExplorationHub' },
    { id: 'progress-dashboard-btn-bib', icon: 'bar-chart-2', label: 'Progreso', gradient: 'from-cyan-600 to-teal-600', hoverGradient: 'from-cyan-700 to-teal-700', handler: 'handleProgressButton' },
    { id: 'help-center-btn-bib', icon: 'help-circle', label: 'Ayuda', gradient: 'from-green-600 to-emerald-600', hoverGradient: 'from-green-700 to-emerald-700', handler: 'handleHelpCenterButton' },
    { id: 'donations-btn-bib', icon: 'donate', labelKey: 'btn.support', cssClass: 'support-heartbeat', iconClass: 'support-heart', gradient: 'from-amber-600 to-orange-600', hoverGradient: 'from-amber-700 to-orange-700', handler: 'handleDonationsButton' }
  ],

  // Botones secundarios en menú dropdown
  BOTONES_SECUNDARIOS: [
    { id: 'settings-btn-bib', icon: 'settings', label: 'Configuración', handler: 'handleSettingsButton' },
    { id: 'language-selector-btn-bib', icon: 'language', labelKey: 'btn.language', handler: 'handleLanguageButton' },
    { id: 'android-download-btn-bib', icon: 'download', labelKey: 'btn.download', handler: 'handleDownloadButton' },
    { id: 'theme-toggle-btn-bib', iconDynamic: true, labelDynamic: true, handler: 'handleThemeButton' }
  ],

  // Mantener compatibilidad (incluir todos para event delegation)
  BOTONES_ACCION_GLOBAL: [], // Se llena dinámicamente en init

  RELACIONES_COMPLEMENTARIAS: {
    'guia-acciones': { type: 'complements', target: 'manifiesto', targetTitle: 'Manifiesto' },
    'toolkit-transicion': { type: 'complements', target: 'manual-transicion', targetTitle: 'Manual de Transición' },
    'manual-practico': { type: 'complements', target: 'codigo-despertar', targetTitle: 'El Código del Despertar' },
    'practicas-radicales': { type: 'complements', target: 'codigo-despertar', targetTitle: 'El Código del Despertar' },
    'manifiesto': { type: 'hasGuides', guides: [
      { id: 'guia-acciones', title: 'Guía de Acciones' }
    ]},
    'manual-transicion': { type: 'hasGuides', guides: [
      { id: 'toolkit-transicion', title: 'Toolkit de Transición' }
    ]},
    'codigo-despertar': { type: 'hasGuides', guides: [
      { id: 'manual-practico', title: 'Manual Práctico' },
      { id: 'practicas-radicales', title: 'Prácticas Radicales' }
    ]}
  },

  HERRAMIENTAS_ECOSISTEMA: [
    {
      id: 'coleccion-nuevo-ser',
      name: 'Colección del Nuevo Ser',
      description: 'Biblioteca interactiva: 7 libros sobre conciencia, filosofía y transformación social',
      icon: '📚',
      url: './',
      color: '#EC4899',
      tags: ['lectura', 'aprendizaje', 'biblioteca', 'exploración'],
      isInternal: false
    },
    {
      id: 'frankenstein-lab',
      name: 'Frankenstein Lab',
      description: 'Juego educativo: crea seres conscientes combinando conocimientos de los libros',
      icon: '⚡',
      url: './test-frankenstein.html',
      color: '#8B5CF6',
      tags: ['juego', 'aprendizaje', 'quiz', 'gamificación'],
      isInternal: false
    },
    {
      id: 'cosmos-navigation',
      name: 'Cosmos',
      description: 'Navegación cósmica 3D: explora los libros como sistemas planetarios interconectados',
      icon: '🌌',
      url: './codigo-cosmico.html',
      color: '#6366F1',
      tags: ['visualización', '3D', 'exploración', 'inmersivo'],
      isInternal: false
    },
    {
      id: 'truk',
      name: 'Truk',
      description: 'Red social de economía colaborativa local',
      icon: '🤝',
      url: 'https://truk-production.up.railway.app/',
      color: '#3B82F6',
      tags: ['economía', 'colaborativa', 'comunidad', 'local'],
      isInternal: false
    }
  ]
};

class Biblioteca {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.i18n = window.i18n || new I18n();
    this.searchQuery = '';
    this.filterCategory = 'all';
    this.listenersAttached = false; // Track global listeners
    this.delegatedListenersAttached = false; // Track delegated listeners
    this.menuDropdownOpen = false;

    // Combinar botones primarios y secundarios para event delegation
    BIBLIOTECA_CONFIG.BOTONES_ACCION_GLOBAL = [
      ...BIBLIOTECA_CONFIG.BOTONES_PRIMARIOS,
      ...BIBLIOTECA_CONFIG.BOTONES_SECUNDARIOS
    ];
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  async init() {
    try {
      await this.bookEngine.loadCatalog();
      this.render();
      this.attachEventListeners();
    } catch (error) {
      console.error('Error initializing Biblioteca:', error);
      this.renderError(error);
    }
  }

  // ==========================================================================
  // HELPERS DE RENDERIZADO
  // ==========================================================================

  renderBotonAccion(configuracionBoton) {
    const textoLabel = configuracionBoton.labelKey
      ? this.i18n.t(configuracionBoton.labelKey)
      : configuracionBoton.label;

    const tituloBoton = configuracionBoton.labelKey
      ? this.i18n.t(configuracionBoton.labelKey)
      : configuracionBoton.label;

    let iconoHTML;
    if (configuracionBoton.iconDynamic) {
      iconoHTML = `<span id="theme-icon-bib">${window.themeHelper?.getThemeIcon() || Icons.moon(20)}</span>`;
    } else {
      // Usar el método del objeto Icons si existe, sino usar create directamente
      const iconMethod = configuracionBoton.icon;
      iconoHTML = Icons[iconMethod]
        ? Icons[iconMethod](20)
        : Icons.create(iconMethod, 20);

      if (configuracionBoton.iconClass) {
        iconoHTML = `<span class="${configuracionBoton.iconClass}">${iconoHTML}</span>`;
      }
    }

    const labelHTML = configuracionBoton.labelDynamic
      ? `<span class="hidden sm:inline" id="theme-label-bib">${window.themeHelper?.getThemeLabel() || 'Tema'}</span>`
      : `<span class="hidden sm:inline">${textoLabel}</span>`;

    const clasesAdicionales = configuracionBoton.cssClass || '';

    return `
      <button id="${configuracionBoton.id}"
              class="${clasesAdicionales} px-3 sm:px-4 py-2.5 bg-gradient-to-r ${configuracionBoton.gradient} hover:${configuracionBoton.hoverGradient} text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
              title="${tituloBoton}">
        ${iconoHTML}
        ${labelHTML}
      </button>
    `;
  }

  renderBotonesAccionGlobal() {
    return BIBLIOTECA_CONFIG.BOTONES_ACCION_GLOBAL
      .map(boton => this.renderBotonAccion(boton))
      .join('\n');
  }

  renderHeader() {
    const datosLibreria = this.bookEngine.catalog.library;

    return `
      <div class="header mb-6 sm:mb-8">
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 text-gradient flex items-center justify-center gap-3">
          ${Icons.library(48)} ${datosLibreria.name}
        </h1>
        <p class="text-lg sm:text-xl opacity-80">
          ${datosLibreria.tagline}
        </p>
        <p class="text-sm opacity-60 mt-2">
          Por ${datosLibreria.authors.join(' & ')}
        </p>

        <!-- Global Actions - Nuevo layout mejorado -->
        <div class="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8">
          ${this.renderBotonesPrimarios()}
          ${this.renderMenuDropdown()}
        </div>
      </div>
    `;
  }

  renderBotonesPrimarios() {
    return BIBLIOTECA_CONFIG.BOTONES_PRIMARIOS
      .map(boton => this.renderBotonAccion(boton))
      .join('\n');
  }

  renderMenuDropdown() {
    return `
      <div class="relative">
        <button id="more-options-btn-bib"
                class="px-3 sm:px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                title="Más opciones">
          ${Icons.create('more-vertical', 20)}
          <span class="hidden sm:inline">Más</span>
        </button>

        <!-- Dropdown Menu -->
        <div id="more-options-menu-bib" class="hidden absolute right-0 mt-3 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden backdrop-blur-sm">
          <div class="py-1">
            ${this.renderOpcionesMenuDropdown()}
          </div>
        </div>
      </div>
    `;
  }

  renderOpcionesMenuDropdown() {
    return BIBLIOTECA_CONFIG.BOTONES_SECUNDARIOS
      .map(boton => {
        const textoLabel = boton.labelKey
          ? this.i18n.t(boton.labelKey)
          : boton.label;

        let iconoHTML;
        if (boton.iconDynamic) {
          iconoHTML = `<span id="theme-icon-menu">${window.themeHelper?.getThemeIcon() || Icons.moon(20)}</span>`;
        } else {
          const iconMethod = boton.icon;
          iconoHTML = Icons[iconMethod]
            ? Icons[iconMethod](20)
            : Icons.create(iconMethod, 20);
        }

        const labelHTML = boton.labelDynamic
          ? `<span id="theme-label-menu">${window.themeHelper?.getThemeLabel() || 'Tema'}</span>`
          : textoLabel;

        return `
          <button id="${boton.id}"
                  class="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium group">
            <span class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-white dark:group-hover:bg-gray-600 transition-colors duration-200">${iconoHTML}</span>
            <span class="group-hover:translate-x-1 transition-transform duration-200">${labelHTML}</span>
          </button>
        `;
      })
      .join('\n');
  }

  // ==========================================================================
  // RENDERIZADO PRINCIPAL
  // ==========================================================================

  render() {
    const contenedorPrincipal = document.getElementById('biblioteca-view');
    if (!contenedorPrincipal) return;

    const htmlCompleto = `
      <div class="biblioteca-container min-h-screen p-4 sm:p-6">
        ${this.renderHeader()}

        <!-- Global Stats -->
        ${this.renderGlobalStats()}

        <!-- Search & Filters -->
        ${this.renderSearchAndFilters()}

        <!-- Books Grid -->
        ${this.renderBooksGridHTML()}

        <!-- Tools & Apps Section -->
        ${this.renderToolsSection()}

        <!-- Future Books -->
        ${this.renderFutureBooks()}

        <!-- About -->
        ${this.renderAbout()}
      </div>
    `;

    contenedorPrincipal.innerHTML = htmlCompleto;

    if (window.Icons) {
      Icons.init();
    }

    // Renderizar widget de práctica del día (asíncrono)
    this.renderPracticeWidget();
  }

  async renderPracticeWidget(retryCount = 0) {
    const MAX_RETRIES = 10; // Máximo 5 segundos (10 x 500ms)

    // Esperar a que el sistema esté listo
    if (!window.practiceLibrary || !window.practiceRecommender) {
      if (retryCount >= MAX_RETRIES) {
        // console.log('⏭️  Practice system not available - skipping widget');
        return;
      }

      if (retryCount === 0) {
        // console.log('⏳ Waiting for practice system to initialize...');
      }

      setTimeout(() => this.renderPracticeWidget(retryCount + 1), 500);
      return;
    }

    // console.log('✅ Practice system ready - rendering widget');

    const container = document.getElementById('practice-widget-container');
    if (!container) return;

    try {
      const widgetHTML = await window.practiceWidget.render();
      container.innerHTML = widgetHTML;

      // Attach event listeners
      window.practiceWidget.attachEventListeners(container);
    } catch (error) {
      console.error('Error rendering practice widget:', error);
      // Fallar silenciosamente - el widget es opcional
    }
  }

  renderGlobalStats() {
    const progresoGlobal = this.bookEngine.getGlobalProgress();

    return `
      <div class="global-stats mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-300 dark:border-blue-700/30">
        <h3 class="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          ${this.i18n.t('library.progress')}
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div class="stat">
            <div class="text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-300">${progresoGlobal.totalRead}</div>
            <div class="text-xs sm:text-sm opacity-70 text-gray-600 dark:text-gray-200">${this.i18n.t('library.chaptersRead')}</div>
          </div>
          <div class="stat">
            <div class="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-300">${progresoGlobal.totalChapters}</div>
            <div class="text-xs sm:text-sm opacity-70 text-gray-600 dark:text-gray-200">${this.i18n.t('library.totalChapters')}</div>
          </div>
          <div class="stat">
            <div class="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-300">${progresoGlobal.percentage}%</div>
            <div class="text-xs sm:text-sm opacity-70 text-gray-600 dark:text-gray-200">${this.i18n.t('library.completed')}</div>
          </div>
          <div class="stat">
            <div class="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-300">${progresoGlobal.booksStarted}</div>
            <div class="text-xs sm:text-sm opacity-70 text-gray-600 dark:text-gray-200">${this.i18n.t('library.booksStarted')}</div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-full mt-4 overflow-hidden">
          <div class="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
               style="width: ${progresoGlobal.percentage}%"></div>
        </div>
      </div>
    `;
  }

  renderSearchAndFilters() {
    const opcionesCategorias = BIBLIOTECA_CONFIG.CATEGORIAS_FILTRO
      .map(categoria => {
        const labelTexto = categoria.value === 'all'
          ? this.i18n.t(categoria.label)
          : categoria.label;
        return `<option value="${categoria.value}">${labelTexto}</option>`;
      })
      .join('');

    return `
      <div class="search-filters mb-6 flex flex-col md:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1 relative">
          <div class="absolute left-3 top-1/2 -translate-y-1/2 opacity-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>
          <input
            type="text"
            id="search-input"
            placeholder="${this.i18n.t('library.search')}"
            class="w-full pl-11 pr-4 py-3 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none transition"
          />
        </div>

        <!-- Filter by Category -->
        <select
          id="category-filter"
          class="px-4 py-3 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none cursor-pointer"
        >
          ${opcionesCategorias}
        </select>
      </div>
    `;
  }

  renderBooksGridHTML() {
    const libros = this.getFilteredBooks();

    let html = '<div class="books-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">';

    libros.forEach(libro => {
      html += this.renderBookCard(libro);
    });

    html += '</div>';

    return html;
  }

  renderBookCard(libro) {
    const progresoLibro = this.bookEngine.getProgress(libro.id);
    const libroIniciado = progresoLibro.chaptersRead > 0;

    return `
      <div class="book-card group relative rounded-xl border-2 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer hover:border-opacity-60"
           style="border-color: ${libro.color}40"
           data-book-id="${libro.id}">

        <!-- Background Gradient -->
        <div class="absolute inset-0 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity duration-300"
             style="background: linear-gradient(135deg, ${libro.color}, ${libro.secondaryColor})"></div>

        <!-- Paper Texture Overlay -->
        <div class="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
             style="background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg=='); background-repeat: repeat;"></div>

        <div class="relative p-4 sm:p-6">
          <!-- Icon & Status -->
          <div class="flex items-start justify-between mb-3 sm:mb-4">
            <div class="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center opacity-80" style="color: ${libro.color}">
              ${Icons.getBookIcon(libro.id, 48, libro.color)}
            </div>
            <div class="flex flex-col items-end gap-2">
              ${libro.status === 'published' ?
                `<span class="px-2 py-1 text-xs rounded bg-green-500/20 text-green-300">${this.i18n.t('library.published')}</span>` :
                `<span class="px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-300">${this.i18n.t('library.comingSoon')}</span>`
              }
              ${libroIniciado ?
                `<span class="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-300">${this.i18n.t('library.inProgress')}</span>` :
                `<span class="px-2 py-1 text-xs rounded bg-red-500/20 text-red-600 dark:text-red-400">${this.i18n.t('library.notStarted')}</span>`
              }
            </div>
          </div>

          <!-- Title -->
          <h3 class="text-xl sm:text-2xl font-bold mb-2 group-hover:text-[${libro.color}] transition">
            ${libro.title}
          </h3>

          <!-- Subtitle -->
          <p class="text-xs sm:text-sm opacity-70 mb-2">
            ${libro.subtitle}
          </p>

          <!-- Description -->
          ${libro.description ? `
            <p class="text-sm opacity-80 mb-3 line-clamp-3">
              ${libro.description}
            </p>
          ` : ''}

          <!-- Complementary Info -->
          ${this.renderComplementaryInfo(libro)}

          <!-- Info -->
          <div class="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm opacity-60 mb-3 sm:mb-4">
            <span class="flex items-center gap-1">${Icons.book(14)} ${libro.chapters} ${this.i18n.t('library.chapters')}</span>
            <span class="flex items-center gap-1">${Icons.clock(14)} ${libro.estimatedReadTime}</span>
          </div>

          <!-- Progress Bar -->
          ${libroIniciado ? `
            <div class="mb-3 sm:mb-4">
              <div class="flex justify-between text-xs mb-1">
                <span>${progresoLibro.chaptersRead} ${this.i18n.t('progress.of')} ${progresoLibro.totalChapters} ${this.i18n.t('library.chapters')}</span>
                <span>${progresoLibro.percentage}%</span>
              </div>
              <div class="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full transition-all duration-500"
                     style="width: ${progresoLibro.percentage}%; background-color: ${libro.color}"></div>
              </div>
            </div>
          ` : ''}

          <!-- Tags -->
          <div class="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            ${(libro.tags || []).slice(0, 3).map(etiqueta =>
              `<span class="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200">#${etiqueta}</span>`
            ).join('')}
          </div>

          <!-- Action Button -->
          <button class="w-full py-2.5 sm:py-3 px-4 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                  style="background-color: ${libro.color}; color: white"
                  data-action="open-book"
                  data-book-id="${libro.id}">
            ${libroIniciado ? `${Icons.book(18)} ${this.i18n.t('library.continue')}` : `${Icons.zap(18)} ${this.i18n.t('library.start')}`}
          </button>

          <!-- Features Icons -->
          <div class="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2 text-base sm:text-sm opacity-60">
            ${libro.features.meditations ? `<span class="px-1.5 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700/30 transition cursor-help" title="Meditaciones" aria-label="Meditaciones">${Icons.meditation(18)}</span>` : ''}
            ${libro.features.exercises ? `<span class="px-1.5 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700/30 transition cursor-help" title="Ejercicios" aria-label="Ejercicios">${Icons.edit(18)}</span>` : ''}
            ${libro.features.aiChat ? `<span class="px-1.5 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700/30 transition cursor-help" title="Chat IA" aria-label="Chat IA">${Icons.bot(18)}</span>` : ''}
            ${libro.features.timeline ? `<span class="px-1.5 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700/30 transition cursor-help" title="Timeline" aria-label="Timeline">${Icons.calendar(18)}</span>` : ''}
            ${libro.features.audiobook ? `<span class="px-1.5 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700/30 transition cursor-help" title="Audioreader" aria-label="Audioreader">${Icons.volume(18)}</span>` : ''}
            ${libro.features.actionTracker ? `<span class="px-1.5 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700/30 transition cursor-help" title="Tracker Acciones" aria-label="Tracker Acciones">${Icons.zap(18)}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  renderComplementaryInfo(book) {
    const relacionLibro = BIBLIOTECA_CONFIG.RELACIONES_COMPLEMENTARIAS[book.id];
    if (!relacionLibro) return '';

    if (relacionLibro.type === 'complements') {
      return `
        <div class="mb-3 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50">
          <p class="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
            ${Icons.link(12)}
            <span>Complementa a: <strong class="text-gray-800 dark:text-gray-200">${relacionLibro.targetTitle}</strong></span>
          </p>
        </div>
      `;
    }

    if (relacionLibro.type === 'hasGuides') {
      const listaGuias = relacionLibro.guides
        .map(guia => `<span class="inline-flex items-center gap-1">${guia.icon} ${guia.title}</span>`)
        .join(', ');

      return `
        <div class="mb-3 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50">
          <p class="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 flex-wrap">
            ${Icons.sparkles(12)}
            <span>Guías: <strong class="text-gray-800 dark:text-gray-200">${listaGuias}</strong></span>
          </p>
        </div>
      `;
    }

    return '';
  }

  renderToolsSection() {
    const herramientas = BIBLIOTECA_CONFIG.HERRAMIENTAS_ECOSISTEMA;

    if (herramientas.length === 0) return '';

    let html = `
      <div class="tools-section mb-8 sm:mb-12 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-900/20 via-teal-900/10 to-cyan-900/20 border border-emerald-700/30">
        <h3 class="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
          <div class="p-2 rounded-lg bg-emerald-500/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
          </div>
          <span class="text-emerald-300">${this.i18n.t('library.tools') || 'Herramientas y Aplicaciones'}</span>
        </h3>
        <p class="text-sm opacity-60 mb-6 ml-14">Aplicaciones web complementarias del ecosistema Nuevo Ser</p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    `;

    herramientas.forEach(herramienta => {
      const isInternal = herramienta.isInternal || false;
      const badgeText = isInternal ? '🎮 Juego' : '🌐 Web App';

      // Asignar color tema por herramienta
      let colorTheme = 'emerald';
      if (herramienta.id === 'frankenstein-lab') colorTheme = 'purple';
      else if (herramienta.id === 'cosmos-navigation') colorTheme = 'indigo';
      else if (herramienta.id === 'coleccion-nuevo-ser') colorTheme = 'pink';
      else if (herramienta.id === 'truk') colorTheme = 'blue';
      // Mapeo de colores para cada herramienta
      const colorMap = {
        'purple': {
          gradientFrom: 'from-purple-500/20 to-violet-500/20',
          borderColor: 'border-purple-500/30',
          hoverBorderColor: 'hover:border-purple-500/50',
          hoverShadow: 'hover:shadow-purple-500/20',
          hoverTextColor: 'group-hover:text-purple-600 dark:group-hover:text-purple-300',
          badgeBg: 'bg-purple-100 dark:bg-purple-500/20',
          badgeText: 'text-purple-700 dark:text-purple-300',
          badgeBorder: 'border-purple-300 dark:border-purple-500/30',
          tagBg: 'bg-purple-100 dark:bg-purple-900/30',
          tagText: 'text-purple-700 dark:text-purple-400',
          tagBorder: 'border-purple-300 dark:border-purple-700/30',
          btnGradient: 'from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500',
          btnShadow: 'group-hover:shadow-purple-500/25'
        },
        'pink': {
          gradientFrom: 'from-pink-500/20 to-rose-500/20',
          borderColor: 'border-pink-500/30',
          hoverBorderColor: 'hover:border-pink-500/50',
          hoverShadow: 'hover:shadow-pink-500/20',
          hoverTextColor: 'group-hover:text-pink-600 dark:group-hover:text-pink-300',
          badgeBg: 'bg-pink-100 dark:bg-pink-500/20',
          badgeText: 'text-pink-700 dark:text-pink-300',
          badgeBorder: 'border-pink-300 dark:border-pink-500/30',
          tagBg: 'bg-pink-100 dark:bg-pink-900/30',
          tagText: 'text-pink-700 dark:text-pink-400',
          tagBorder: 'border-pink-300 dark:border-pink-700/30',
          btnGradient: 'from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500',
          btnShadow: 'group-hover:shadow-pink-500/25'
        },
        'indigo': {
          gradientFrom: 'from-indigo-500/20 to-blue-500/20',
          borderColor: 'border-indigo-500/30',
          hoverBorderColor: 'hover:border-indigo-500/50',
          hoverShadow: 'hover:shadow-indigo-500/20',
          hoverTextColor: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-300',
          badgeBg: 'bg-indigo-100 dark:bg-indigo-500/20',
          badgeText: 'text-indigo-700 dark:text-indigo-300',
          badgeBorder: 'border-indigo-300 dark:border-indigo-500/30',
          tagBg: 'bg-indigo-100 dark:bg-indigo-900/30',
          tagText: 'text-indigo-700 dark:text-indigo-400',
          tagBorder: 'border-indigo-300 dark:border-indigo-700/30',
          btnGradient: 'from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500',
          btnShadow: 'group-hover:shadow-indigo-500/25'
        },
        'blue': {
          gradientFrom: 'from-blue-500/20 to-cyan-500/20',
          borderColor: 'border-blue-500/30',
          hoverBorderColor: 'hover:border-blue-500/50',
          hoverShadow: 'hover:shadow-blue-500/20',
          hoverTextColor: 'group-hover:text-blue-600 dark:group-hover:text-blue-300',
          badgeBg: 'bg-blue-100 dark:bg-blue-500/20',
          badgeText: 'text-blue-700 dark:text-blue-300',
          badgeBorder: 'border-blue-300 dark:border-blue-500/30',
          tagBg: 'bg-blue-100 dark:bg-blue-900/30',
          tagText: 'text-blue-700 dark:text-blue-400',
          tagBorder: 'border-blue-300 dark:border-blue-700/30',
          btnGradient: 'from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500',
          btnShadow: 'group-hover:shadow-blue-500/25'
        },
        'emerald': {
          gradientFrom: 'from-emerald-500/20 to-teal-500/20',
          borderColor: 'border-emerald-500/30',
          hoverBorderColor: 'hover:border-emerald-500/50',
          hoverShadow: 'hover:shadow-emerald-500/20',
          hoverTextColor: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-300',
          badgeBg: 'bg-emerald-100 dark:bg-emerald-500/20',
          badgeText: 'text-emerald-700 dark:text-emerald-300',
          badgeBorder: 'border-emerald-300 dark:border-emerald-500/30',
          tagBg: 'bg-emerald-100 dark:bg-emerald-900/30',
          tagText: 'text-emerald-700 dark:text-emerald-400',
          tagBorder: 'border-emerald-300 dark:border-emerald-700/30',
          btnGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
          btnShadow: 'group-hover:shadow-emerald-500/25'
        }
      };

      const colors = colorMap[colorTheme];
      const gradientFrom = colors.gradientFrom;
      const borderColor = colors.borderColor;
      const hoverBorderColor = colors.hoverBorderColor;
      const hoverShadow = colors.hoverShadow;
      const hoverTextColor = colors.hoverTextColor;
      const badgeBg = colors.badgeBg;
      const badgeText2 = colors.badgeText;
      const badgeBorder = colors.badgeBorder;
      const tagBg = colors.tagBg;
      const tagText = colors.tagText;
      const tagBorder = colors.tagBorder;
      const btnGradient = colors.btnGradient;
      const btnShadow = colors.btnShadow;

      const wrapperTag = isInternal ? 'div' : 'a';
      const wrapperAttrs = isInternal
        ? `data-tool-handler="${herramienta.handler}" data-tool-id="${herramienta.id}"`
        : `href="${herramienta.url}" target="_blank" rel="noopener noreferrer"`;

      html += `
        <${wrapperTag} ${wrapperAttrs}
           class="tool-card group relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${hoverShadow} cursor-pointer block bg-white dark:bg-gray-800/60 backdrop-blur border border-gray-300 dark:border-gray-700/50 ${hoverBorderColor}">

          <div class="relative p-4 sm:p-6">
            <!-- Header con icono y badge -->
            <div class="flex items-start justify-between mb-4">
              <div class="p-3 rounded-xl bg-gradient-to-br ${gradientFrom} border ${borderColor}">
                <span class="text-4xl">${herramienta.icon}</span>
              </div>
              <span class="px-3 py-1 text-xs font-semibold rounded-full ${badgeBg} ${badgeText2} border ${badgeBorder}">
                ${badgeText}
              </span>
            </div>

            <!-- Name -->
            <h4 class="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-white ${hoverTextColor} transition">
              ${herramienta.name}
            </h4>

            <!-- Description -->
            <p class="text-sm opacity-80 mb-4 text-gray-600 dark:text-gray-200">
              ${herramienta.description}
            </p>

            <!-- Tags -->
            <div class="flex flex-wrap gap-2 mb-4">
              ${herramienta.tags.map(tag =>
                `<span class="px-2 py-1 text-xs rounded-full ${tagBg} ${tagText} border ${tagBorder}">#${tag}</span>`
              ).join('')}
            </div>

            <!-- Action Button -->
            <div class="w-full py-3 px-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 text-center bg-gradient-to-r ${btnGradient} text-white shadow-lg ${btnShadow}">
              ${isInternal ? '🎮 Jugar Ahora' : '🚀 Abrir Aplicación'}
            </div>
          </div>
        </${wrapperTag}>
      `;
    });

    html += '</div></div>';
    return html;
  }

  renderFutureBooks() {
    const librosFuturos = this.bookEngine.catalog.futureBooks;
    if (!librosFuturos || librosFuturos.length === 0) return '';

    let htmlSeccion = '<div class="future-books mb-8 sm:mb-12">';
    htmlSeccion += `<h3 class="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      ${this.i18n.t('library.comingSoon')}
    </h3>`;
    htmlSeccion += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';

    librosFuturos.forEach(libroFuturo => {
      htmlSeccion += `
        <div class="future-book p-6 rounded-xl border border-dashed border-gray-600 opacity-60">
          <h4 class="text-xl font-bold mb-2">${libroFuturo.title}</h4>
          <p class="text-sm mb-3">${libroFuturo.category}</p>
          <p class="text-sm opacity-70">${libroFuturo.description}</p>
        </div>
      `;
    });

    htmlSeccion += '</div></div>';
    return htmlSeccion;
  }

  renderAbout() {
    return `
      <div class="about p-6 rounded-xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-700/30">
        <h3 class="text-2xl font-bold mb-4 flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
          </svg>
          Sobre la Colección
        </h3>
        <p class="mb-4 leading-relaxed">
          ${this.bookEngine.catalog.library.description}
        </p>
        <p class="text-sm opacity-60">
          Versión ${this.bookEngine.catalog.library.version} •
          Última actualización: ${new Date(this.bookEngine.catalog.library.lastUpdate).toLocaleDateString('es-ES')}
        </p>
      </div>
    `;
  }

  renderError(error) {
    const container = document.getElementById('biblioteca-view');
    if (!container) return;

    container.innerHTML = `
      <div class="error-container flex items-center justify-center min-h-screen p-4 sm:p-6">
        <div class="text-center">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" class="mx-auto mb-4">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <path d="M12 9v4"></path>
            <path d="M12 17h.01"></path>
          </svg>
          <h2 class="text-2xl sm:text-3xl font-bold mb-4">${this.i18n.t('error.loadLibrary')}</h2>
          <p class="text-base sm:text-lg opacity-70 mb-6">${error.message}</p>
          <button onclick="location.reload()"
                  class="px-5 sm:px-6 py-2 sm:py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition text-sm sm:text-base">
            ${this.i18n.t('btn.retry')}
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // FILTRADO Y BÚSQUEDA
  // ==========================================================================

  getFilteredBooks() {
    let librosFiltrados = this.bookEngine.getAllBooks();

    // Filtrar solo libros publicados
    librosFiltrados = librosFiltrados.filter(libro => libro.status === 'published');

    if (this.filterCategory && this.filterCategory !== 'all') {
      librosFiltrados = librosFiltrados.filter(libro => libro.category === this.filterCategory);
    }

    if (this.searchQuery) {
      const consultaBusqueda = this.searchQuery.toLowerCase();
      librosFiltrados = librosFiltrados.filter(libro =>
        libro.title.toLowerCase().includes(consultaBusqueda) ||
        (libro.subtitle && libro.subtitle.toLowerCase().includes(consultaBusqueda)) ||
        (libro.description && libro.description.toLowerCase().includes(consultaBusqueda)) ||
        (libro.tags && libro.tags.some(etiqueta => etiqueta.toLowerCase().includes(consultaBusqueda)))
      );
    }

    return librosFiltrados;
  }

  // ==========================================================================
  // HANDLERS DE BOTONES
  // ==========================================================================

  handleSettingsButton(evento) {
    evento.preventDefault();
    if (window.SettingsModal) {
      const modalConfiguracion = new window.SettingsModal();
      modalConfiguracion.show();
    } else {
      // console.warn('SettingsModal no está disponible');
    }
  }

  handleDownloadButton(evento) {
    evento.preventDefault();
    const urlApk = this.bookEngine.getLatestAPK();
    window.open(urlApk, '_blank');
  }

  handleAISettingsButton(evento) {
    evento.preventDefault();
    if (window.aiSettingsModal) window.aiSettingsModal.open();
  }

  handleDonationsButton(evento) {
    evento.preventDefault();
    if (window.donationsModal) window.donationsModal.open();
  }

  handleLanguageButton(evento) {
    evento.preventDefault();
    if (window.languageSelector) window.languageSelector.open();
  }

  handleProgressButton(evento) {
    evento.preventDefault();
    if (window.progressDashboard) window.progressDashboard.show();
  }

  handleHelpCenterButton(evento) {
    evento.preventDefault();
    window.open('https://github.com/anthropics/claude-code/issues', '_blank');
  }

  handlePracticeLibraryButton(evento) {
    evento.preventDefault();
    if (window.practiceLibrary) {
      window.practiceLibrary.open();
    } else {
      console.error('Practice Library not loaded');
    }
  }

  handleExplorationHub(evento) {
    evento.preventDefault();
    if (window.ExplorationHub && window.bookEngine) {
      const hub = new window.ExplorationHub(window.bookEngine);
      hub.open('search'); // Abrir con tab de búsqueda por defecto
    } else {
      console.error('ExplorationHub no está disponible');
    }
  }

  async handleCosmosNavigationButton(evento) {
    evento.preventDefault();

    // Si ya está cargado, mostrarlo directamente
    if (window.cosmosNavigation) {
      window.cosmosNavigation.show();
      // console.log('🌌 Abriendo Cosmos del Conocimiento');
      return;
    }

    // Si no está cargado, cargarlo primero con lazy-loader
    if (window.lazyLoader) {
      if (window.toast) {
        window.toast.show('📦 Cargando Cosmos del Conocimiento...', 'info', 3000);
      }

      try {
        await window.lazyLoader.load('cosmos-3d');

        // Ahora que está cargado, mostrarlo
        if (window.cosmosNavigation) {
          window.cosmosNavigation.show();
          if (window.toast) {
            window.toast.show('✅ Cosmos cargado', 'success', 2000);
          }
        } else {
          console.error('CosmosNavigation no se inicializó correctamente después de la carga');
          if (window.toast) {
            window.toast.show('❌ Error inicializando Cosmos', 'error', 3000);
          }
        }
      } catch (error) {
        console.error('Error cargando cosmos-3d:', error);
        if (window.toast) {
          window.toast.show('❌ Error cargando Cosmos del Conocimiento', 'error', 3000);
        }
      }
    } else {
      console.error('LazyLoader no está disponible');
      if (window.toast) {
        window.toast.show('❌ Sistema de carga no disponible', 'error', 3000);
      }
    }
  }

  // Método eliminado - organism-3d ha sido removido del sistema

  async handleFrankensteinLabCard(evento) {
    evento.preventDefault();

    // Si ya está cargado, mostrarlo directamente
    if (window.frankensteinLabUI) {
      const container = document.getElementById('organism-container');
      if (container) {
        // Limpiar el container y volver a crear la UI
        container.innerHTML = '';
        container.classList.remove('hidden');
        document.getElementById('biblioteca-view')?.classList.add('hidden');

        // Resetear ambos flags para que vuelva a mostrar pantalla de inicio
        window.frankensteinLabUI.isInitialized = false;
        window.frankensteinLabUI.labStarted = false;
        await window.frankensteinLabUI.init();
      }
      return;
    }

    // Si no está cargado, cargarlo primero (solo frankenstein-lab, SIN organism-3d)
    if (window.lazyLoader) {
      if (window.toast) {
        window.toast.show('📦 Cargando Laboratorio Frankenstein...', 'info', 3000);
      }

      try {
        // Solo cargar frankenstein-lab, NO organism-3d
        await window.lazyLoader.load('frankenstein-lab');

        // Crear un contenedor básico si no existe
        let container = document.getElementById('organism-container');
        if (!container) {
          container = document.createElement('div');
          container.id = 'organism-container';
          container.className = 'organism-container';
          document.body.appendChild(container);
        }

        // Mostrar el container y ocultar la biblioteca
        container.classList.remove('hidden');
        document.getElementById('biblioteca-view')?.classList.add('hidden');

        // Inicializar Frankenstein Lab UI directamente
        if (window.FrankensteinLabUI && window.bookEngine) {
          // Crear objeto mínimo para compatibilidad (sin organism-3d completo)
          const labInstance = {
            bookEngine: window.bookEngine,
            hide: () => {
              container.classList.add('hidden');
              document.getElementById('biblioteca-view')?.classList.remove('hidden');
            },
            // Método para obtener capítulos de un libro
            getBookChapters: (book) => {
              const chapters = [];
              if (window.bookEngine?.catalog) {
                const fullBook = window.bookEngine.catalog.books.find(b => b.id === book.id);
                if (fullBook) {
                  if (fullBook.sections && Array.isArray(fullBook.sections)) {
                    fullBook.sections.forEach(section => {
                      if (section.chapters && Array.isArray(section.chapters)) {
                        chapters.push(...section.chapters);
                      }
                    });
                  }
                  if (chapters.length === 0 && fullBook.chapters && Array.isArray(fullBook.chapters)) {
                    chapters.push(...fullBook.chapters);
                  }
                  if (chapters.length > 0) return chapters;
                }
              }
              // Fallback: capítulos genéricos
              for (let i = 0; i < 6; i++) {
                chapters.push({
                  id: `cap${i + 1}`,
                  title: `Capítulo ${i + 1}`,
                  tags: ['conocimiento', 'transformación']
                });
              }
              return chapters;
            },
            // Método para cargar metadata de capítulos
            loadChapterMetadata: async (bookId) => {
              try {
                const response = await fetch(`books/${bookId}/assets/chapter-metadata.json`);
                if (response.ok) {
                  return await response.json();
                }
              } catch (error) {
                // Silent fail
              }
              return {};
            }
          };

          window.frankensteinLabUI = new FrankensteinLabUI(labInstance);
          await window.frankensteinLabUI.init();

          if (window.toast) {
            window.toast.show('✅ Laboratorio cargado', 'success', 2000);
          }
        } else {
          console.error('FrankensteinLabUI o BookEngine no disponibles');
          if (window.toast) {
            window.toast.show('❌ Error inicializando Laboratorio', 'error', 3000);
          }
        }
      } catch (error) {
        console.error('Error cargando Frankenstein Lab:', error);
        if (window.toast) {
          window.toast.show('❌ Error cargando Laboratorio Frankenstein', 'error', 3000);
        }
      }
    } else {
      console.error('LazyLoader no está disponible');
      if (window.toast) {
        window.toast.show('❌ Sistema de carga no disponible', 'error', 3000);
      }
    }
  }

  // Alias para compatibilidad con la tarjeta de herramientas
  handleFrankensteinLabClick(evento) {
    return this.handleFrankensteinLabCard(evento);
  }

  handleCosmosNavigationClick(evento) {
    return this.handleCosmosNavigationButton(evento);
  }

  toggleMenuDropdown(evento) {
    evento.preventDefault();
    evento.stopPropagation();

    const menu = document.getElementById('more-options-menu-bib');
    if (!menu) return;

    this.menuDropdownOpen = !this.menuDropdownOpen;

    if (this.menuDropdownOpen) {
      menu.classList.remove('hidden');
    } else {
      menu.classList.add('hidden');
    }
  }

  closeMenuDropdown() {
    const menu = document.getElementById('more-options-menu-bib');
    if (menu) {
      menu.classList.add('hidden');
      this.menuDropdownOpen = false;
    }
  }

  handleThemeButton(evento) {
    evento.preventDefault();
    if (window.themeHelper) {
      window.themeHelper.toggle();
      window.themeHelper.updateToggleButtons();
      window.toast?.info(`Tema: ${window.themeHelper.getThemeLabel()}`);
    }
  }

  handleOpenBook(evento, idLibro) {
    evento.preventDefault();
    evento.stopPropagation();
    if (idLibro) {
      logger.log('📖 Opening book:', idLibro);
      this.openBook(idLibro);
    }
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  attachEventListeners() {
    // Attach global listeners only once
    if (!this.listenersAttached) {
      this.attachGlobalListeners();
      this.listenersAttached = true;
    }

    // Re-attach dynamic listeners (search, filter)
    this.attachDynamicListeners();

    // Use event delegation for book cards
    this.attachDelegatedListeners();
  }

  attachGlobalListeners() {
    // Los botones globales ahora usan event delegation en attachDelegatedListeners()
    // Este método se mantiene por si se necesitan otros listeners globales en el futuro
  }

  attachDynamicListeners() {
    const campoBusqueda = document.getElementById('search-input');
    if (campoBusqueda && !campoBusqueda.dataset.listenerAttached) {
      campoBusqueda.addEventListener('input', (evento) => {
        this.searchQuery = evento.target.value;
        this.renderBooksGrid();
      });

      // Presionar Enter abre la búsqueda avanzada en todo el contenido
      campoBusqueda.addEventListener('keydown', (evento) => {
        if (evento.key === 'Enter' && window.SearchModal && window.bookEngine) {
          evento.preventDefault();
          const modalBusqueda = new window.SearchModal(window.bookEngine);
          modalBusqueda.open();

          // Si hay texto, iniciar búsqueda automáticamente
          const queryActual = evento.target.value.trim();
          if (queryActual.length >= 3) {
            setTimeout(() => {
              const inputModal = document.querySelector('#search-modal #search-input');
              if (inputModal) {
                inputModal.value = queryActual;
                inputModal.dispatchEvent(new Event('input'));
              }
            }, 100);
          }
        }
      });

      campoBusqueda.dataset.listenerAttached = 'true';
    }

    const filtroCategorias = document.getElementById('category-filter');
    if (filtroCategorias && !filtroCategorias.dataset.listenerAttached) {
      filtroCategorias.addEventListener('change', (evento) => {
        this.filterCategory = evento.target.value;
        this.renderBooksGrid();
      });
      filtroCategorias.dataset.listenerAttached = 'true';
    }
  }

  renderBooksGrid() {
    const contenedorGrid = document.querySelector('.books-grid');
    if (!contenedorGrid) {
      this.render();
      this.attachEventListeners();
      return;
    }

    const libros = this.getFilteredBooks();
    let htmlLibros = '';
    libros.forEach(libro => {
      htmlLibros += this.renderBookCard(libro);
    });

    contenedorGrid.innerHTML = htmlLibros;

    if (window.Icons) {
      Icons.init();
    }
  }

  attachDelegatedListeners() {
    if (this.delegatedListenersAttached) return;

    const contenedorBiblioteca = document.getElementById('biblioteca-view');
    if (!contenedorBiblioteca) return;

    const mapaHandlers = {};
    BIBLIOTECA_CONFIG.BOTONES_ACCION_GLOBAL.forEach(boton => {
      mapaHandlers[boton.id] = this[boton.handler].bind(this);
    });

    contenedorBiblioteca.addEventListener('click', (evento) => {
      // Dropdown toggle button
      const botonDropdown = evento.target.closest('#more-options-btn-bib');
      if (botonDropdown) {
        this.toggleMenuDropdown(evento);
        return;
      }

      // Handle button clicks (including dropdown menu items)
      for (const [idBoton, handler] of Object.entries(mapaHandlers)) {
        const botonEncontrado = evento.target.closest(`#${idBoton}`);
        if (botonEncontrado) {
          handler(evento);
          // Close dropdown after action (if it's a menu item)
          this.closeMenuDropdown();
          return;
        }
      }

      // Handle internal tool card clicks
      const tarjetaHerramienta = evento.target.closest('[data-tool-handler]');
      if (tarjetaHerramienta) {
        const nombreHandler = tarjetaHerramienta.getAttribute('data-tool-handler');
        const idHerramienta = tarjetaHerramienta.getAttribute('data-tool-id');

        if (nombreHandler && this[nombreHandler]) {
          logger.log(`🛠️ Opening tool: ${idHerramienta}`);
          this[nombreHandler](evento);
        } else {
          console.error(`Handler ${nombreHandler} not found for tool ${idHerramienta}`);
        }
        return;
      }

      const botonAbrir = evento.target.closest('[data-action="open-book"]');
      const tarjetaLibro = evento.target.closest('.book-card');

      if (botonAbrir) {
        const idLibro = botonAbrir.getAttribute('data-book-id');
        this.handleOpenBook(evento, idLibro);
      } else if (tarjetaLibro && evento.target.tagName !== 'BUTTON' && !evento.target.closest('button')) {
        const idLibro = tarjetaLibro.getAttribute('data-book-id');
        if (idLibro) {
          logger.log('📖 Opening book from card:', idLibro);
          this.openBook(idLibro);
        }
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (evento) => {
      const dropdown = document.getElementById('more-options-menu-bib');
      const botonDropdown = document.getElementById('more-options-btn-bib');

      if (dropdown && !dropdown.classList.contains('hidden')) {
        if (!dropdown.contains(evento.target) && !botonDropdown?.contains(evento.target)) {
          this.closeMenuDropdown();
        }
      }
    });

    this.delegatedListenersAttached = true;
    logger.log('✅ Event delegation attached to biblioteca-view');
  }

  // ==========================================================================
  // NAVEGACIÓN
  // ==========================================================================

  async openBook(idLibro, idCapituloObjetivo = null) {
    try {
      this.showLoading(`${this.i18n.t('loading.loadingBook')} ${idLibro}...`);

      await this.bookEngine.loadBook(idLibro);
      this.bookEngine.applyTheme(this.bookEngine.getCurrentBookConfig());

      let idCapitulo;

      if (idCapituloObjetivo) {
        idCapitulo = idCapituloObjetivo;
      } else {
        const progresoLibro = this.bookEngine.getProgress(idLibro);

        if (progresoLibro.lastChapter) {
          idCapitulo = progresoLibro.lastChapter;
        } else {
          const capitulos = this.bookEngine.getAllChapters();
          idCapitulo = capitulos[0]?.id || 'prologo';
        }
      }

      const capitulo = this.bookEngine.navigateToChapter(idCapitulo);

      this.hideLoading();

      this.hide();
      window.bookReader.show(capitulo);

      if (window.achievementSystem) {
        window.achievementSystem.trackBookOpened(idLibro);
      }

    } catch (error) {
      console.error('Error opening book:', error);
      window.toast.error(`${this.i18n.t('error.openBook')}: ${error.message}`, 5000, false);
      this.hideLoading();
    }
  }

  showLoading(message) {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
    overlay.innerHTML = `
      <div class="text-center">
        <div class="animate-spin text-6xl mb-4">${Icons.settings(48)}</div>
        <div class="text-xl">${message}</div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  hide() {
    const container = document.getElementById('biblioteca-view');
    if (container) {
      container.classList.add('hidden');
    }
  }

  show() {
    const container = document.getElementById('biblioteca-view');
    if (container) {
      container.classList.remove('hidden');
      this.render();
      this.attachEventListeners();

      // Limpiar URL hash al volver a biblioteca
      if (this.bookEngine) {
        this.bookEngine.clearUrlHash();
        this.bookEngine.currentBook = null;
        this.bookEngine.currentChapter = null;
      }
    }
  }
}

// Exportar para uso global
window.Biblioteca = Biblioteca;
