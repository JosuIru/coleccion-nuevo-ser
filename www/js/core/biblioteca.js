// ============================================================================
// BIBLIOTECA - Pantalla Principal (Home)
// ============================================================================
// Gestión de la vista principal con grid de libros y navegación

class Biblioteca {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.i18n = window.i18n || new I18n();
    this.searchQuery = '';
    this.filterCategory = 'all';
    this.listenersAttached = false; // Track global listeners
    this.delegatedListenersAttached = false; // Track delegated listeners
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
  // RENDERIZADO PRINCIPAL
  // ==========================================================================

  render() {
    const container = document.getElementById('biblioteca-view');
    if (!container) return;

    const html = `
      <div class="biblioteca-container min-h-screen p-4 sm:p-6">
        <!-- Header -->
        <div class="header mb-6 sm:mb-8">
          <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 text-gradient flex items-center justify-center gap-3">
            ${Icons.library(48)} ${this.bookEngine.catalog.library.name}
          </h1>
          <p class="text-lg sm:text-xl opacity-80">
            ${this.bookEngine.catalog.library.tagline}
          </p>
          <p class="text-sm opacity-60 mt-2">
            Por ${this.bookEngine.catalog.library.authors.join(' & ')}
          </p>

          <!-- Global Actions -->
          <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-6">
            <button id="android-download-btn-bib" class="px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg transition flex items-center gap-2 font-bold" title="${this.i18n.t('btn.download')}">
              ${Icons.download()}
              <span class="hidden sm:inline">${this.i18n.t('btn.download')}</span>
            </button>
            <button id="ai-settings-btn-bib" class="px-3 sm:px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg transition flex items-center gap-2 font-bold" title="${this.i18n.t('btn.aiSettings')}">
              ${Icons.settings()}
              <span class="hidden sm:inline">${this.i18n.t('btn.aiSettings')}</span>
            </button>
            <button id="donations-btn-bib" class="px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-lg transition flex items-center gap-2 font-bold" title="${this.i18n.t('btn.support')}">
              ${Icons.donate()}
              <span class="hidden sm:inline">${this.i18n.t('btn.support')}</span>
            </button>
            <button id="language-selector-btn-bib" class="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg transition flex items-center gap-2 font-bold" title="${this.i18n.t('btn.language')}">
              ${Icons.language()}
              <span class="hidden sm:inline">${this.i18n.t('btn.language')}</span>
            </button>
          </div>

        </div>

        <!-- Global Stats -->
        ${this.renderGlobalStats()}

        <!-- Search & Filters -->
        ${this.renderSearchAndFilters()}

        <!-- Books Grid -->
        ${this.renderBooksGrid()}

        <!-- Tools & Apps Section -->
        ${this.renderToolsSection()}

        <!-- Future Books -->
        ${this.renderFutureBooks()}

        <!-- About -->
        ${this.renderAbout()}
      </div>
    `;

    container.innerHTML = html;

    // Initialize Lucide icons
    if (window.Icons) {
      Icons.init();
    }
  }

  renderGlobalStats() {
    const progress = this.bookEngine.getGlobalProgress();

    return `
      <div class="global-stats mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/30">
        <h3 class="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          ${this.i18n.t('library.progress')}
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div class="stat">
            <div class="text-2xl sm:text-3xl font-bold text-cyan-300">${progress.totalRead}</div>
            <div class="text-xs sm:text-sm opacity-70">${this.i18n.t('library.chaptersRead')}</div>
          </div>
          <div class="stat">
            <div class="text-2xl sm:text-3xl font-bold text-purple-300">${progress.totalChapters}</div>
            <div class="text-xs sm:text-sm opacity-70">${this.i18n.t('library.totalChapters')}</div>
          </div>
          <div class="stat">
            <div class="text-2xl sm:text-3xl font-bold text-amber-300">${progress.percentage}%</div>
            <div class="text-xs sm:text-sm opacity-70">${this.i18n.t('library.completed')}</div>
          </div>
          <div class="stat">
            <div class="text-2xl sm:text-3xl font-bold text-green-300">${progress.booksStarted}</div>
            <div class="text-xs sm:text-sm opacity-70">${this.i18n.t('library.booksStarted')}</div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full h-2 bg-gray-700 rounded-full mt-4 overflow-hidden">
          <div class="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
               style="width: ${progress.percentage}%"></div>
        </div>
      </div>
    `;
  }

  renderSearchAndFilters() {
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
            class="w-full pl-11 pr-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 focus:border-cyan-500 focus:outline-none transition"
          />
        </div>

        <!-- Filter by Category -->
        <select
          id="category-filter"
          class="px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 focus:border-cyan-500 focus:outline-none cursor-pointer"
        >
          <option value="all">${this.i18n.t('library.allCategories')}</option>
          <option value="Espiritualidad & Ciencia">Espiritualidad & Ciencia</option>
          <option value="Filosofía Política">Filosofía Política</option>
          <option value="Activismo & Transformación Social">Activismo & Transformación Social</option>
          <option value="Prácticas & Ejercicios">Prácticas & Ejercicios</option>
          <option value="Prácticas Avanzadas">Prácticas Avanzadas</option>
        </select>
      </div>
    `;
  }

  renderBooksGrid() {
    const books = this.getFilteredBooks();

    let html = '<div class="books-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">';

    books.forEach(book => {
      html += this.renderBookCard(book);
    });

    html += '</div>';

    return html;
  }

  renderBookCard(book) {
    const progress = this.bookEngine.getProgress(book.id);
    const hasStarted = progress.chaptersRead > 0;

    return `
      <div class="book-card group relative rounded-xl border-2 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
           style="border-color: ${book.color}20"
           data-book-id="${book.id}">

        <!-- Background Gradient -->
        <div class="absolute inset-0 bg-gradient-to-br opacity-10"
             style="background: linear-gradient(135deg, ${book.color}, ${book.secondaryColor})"></div>

        <div class="relative p-4 sm:p-6">
          <!-- Icon & Status -->
          <div class="flex items-start justify-between mb-3 sm:mb-4">
            <div class="text-5xl sm:text-6xl">${book.icon}</div>
            <div class="flex flex-col items-end gap-2">
              ${book.status === 'published' ?
                `<span class="px-2 py-1 text-xs rounded bg-green-500/20 text-green-300">${this.i18n.t('library.published')}</span>` :
                `<span class="px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-300">${this.i18n.t('library.comingSoon')}</span>`
              }
              ${hasStarted ?
                `<span class="px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-300">${this.i18n.t('library.inProgress')}</span>` :
                `<span class="px-2 py-1 text-xs rounded bg-gray-500/20 text-gray-300">${this.i18n.t('library.notStarted')}</span>`
              }
            </div>
          </div>

          <!-- Title -->
          <h3 class="text-xl sm:text-2xl font-bold mb-2 group-hover:text-[${book.color}] transition">
            ${book.title}
          </h3>

          <!-- Subtitle -->
          <p class="text-xs sm:text-sm opacity-70 mb-2">
            ${book.subtitle}
          </p>

          <!-- Complementary Info -->
          ${this.renderComplementaryInfo(book)}

          <!-- Info -->
          <div class="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm opacity-60 mb-3 sm:mb-4">
            <span class="flex items-center gap-1">${Icons.book(14)} ${book.chapters} ${this.i18n.t('library.chapters')}</span>
            <span class="flex items-center gap-1">${Icons.clock(14)} ${book.estimatedReadTime}</span>
          </div>

          <!-- Progress Bar -->
          ${hasStarted ? `
            <div class="mb-3 sm:mb-4">
              <div class="flex justify-between text-xs mb-1">
                <span>${progress.chaptersRead} ${this.i18n.t('progress.of')} ${progress.totalChapters} ${this.i18n.t('library.chapters')}</span>
                <span>${progress.percentage}%</span>
              </div>
              <div class="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full transition-all duration-500"
                     style="width: ${progress.percentage}%; background-color: ${book.color}"></div>
              </div>
            </div>
          ` : ''}

          <!-- Tags -->
          <div class="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            ${book.tags.slice(0, 3).map(tag =>
              `<span class="px-2 py-1 text-xs rounded bg-gray-700/50">#${tag}</span>`
            ).join('')}
          </div>

          <!-- Action Button -->
          <button class="w-full py-2.5 sm:py-3 px-4 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                  style="background-color: ${book.color}; color: white"
                  data-action="open-book"
                  data-book-id="${book.id}">
            ${hasStarted ? `${Icons.book(18)} ${this.i18n.t('library.continue')}` : `${Icons.zap(18)} ${this.i18n.t('library.start')}`}
          </button>

          <!-- Features Icons -->
          <div class="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2 text-base sm:text-sm opacity-60">
            ${book.features.meditations ? `<span class="px-1.5 py-1 rounded hover:bg-gray-700/30 transition cursor-help" title="Meditaciones" aria-label="Meditaciones">${Icons.meditation(18)}</span>` : ''}
            ${book.features.exercises ? `<span class="px-1.5 py-1 rounded hover:bg-gray-700/30 transition cursor-help" title="Ejercicios" aria-label="Ejercicios">${Icons.edit(18)}</span>` : ''}
            ${book.features.aiChat ? `<span class="px-1.5 py-1 rounded hover:bg-gray-700/30 transition cursor-help" title="Chat IA" aria-label="Chat IA">${Icons.bot(18)}</span>` : ''}
            ${book.features.timeline ? `<span class="px-1.5 py-1 rounded hover:bg-gray-700/30 transition cursor-help" title="Timeline" aria-label="Timeline">${Icons.calendar(18)}</span>` : ''}
            ${book.features.audiobook ? `<span class="px-1.5 py-1 rounded hover:bg-gray-700/30 transition cursor-help" title="Audioreader" aria-label="Audioreader">${Icons.volume(18)}</span>` : ''}
            ${book.features.actionTracker ? `<span class="px-1.5 py-1 rounded hover:bg-gray-700/30 transition cursor-help" title="Tracker Acciones" aria-label="Tracker Acciones">${Icons.zap(18)}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // Renderizar información sobre libros complementarios
  renderComplementaryInfo(book) {
    // Mapeo de relaciones entre libros
    const complementaryRelations = {
      // Libros de ejercicios -> Libro principal
      'guia-acciones': { type: 'complements', target: 'manifiesto', targetTitle: 'Manifiesto' },
      'toolkit-transicion': { type: 'complements', target: 'manual-transicion', targetTitle: 'Manual de Transición' },
      'manual-practico': { type: 'complements', target: 'codigo-despertar', targetTitle: 'El Código del Despertar' },
      'practicas-radicales': { type: 'complements', target: 'codigo-despertar', targetTitle: 'El Código del Despertar' },
      // Libros principales -> Libros complementarios
      'manifiesto': { type: 'hasGuides', guides: [
        { id: 'guia-acciones', title: 'Guía de Acciones', icon: '🎯' }
      ]},
      'manual-transicion': { type: 'hasGuides', guides: [
        { id: 'toolkit-transicion', title: 'Toolkit de Transición', icon: '🧰' }
      ]},
      'codigo-despertar': { type: 'hasGuides', guides: [
        { id: 'manual-practico', title: 'Manual Práctico', icon: '📿' },
        { id: 'practicas-radicales', title: 'Prácticas Radicales', icon: '🔥' }
      ]}
    };

    const relation = complementaryRelations[book.id];
    if (!relation) return '';

    if (relation.type === 'complements') {
      // Este libro complementa a otro
      return `
        <div class="mb-3 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
          <p class="text-xs text-gray-400 flex items-center gap-2">
            ${Icons.link(12)}
            <span>Complementa a: <strong class="text-gray-200">${relation.targetTitle}</strong></span>
          </p>
        </div>
      `;
    } else if (relation.type === 'hasGuides') {
      // Este libro tiene guías complementarias
      const guidesList = relation.guides.map(g =>
        `<span class="inline-flex items-center gap-1">${g.icon} ${g.title}</span>`
      ).join(', ');

      return `
        <div class="mb-3 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
          <p class="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
            ${Icons.sparkles(12)}
            <span>Guías: <strong class="text-gray-200">${guidesList}</strong></span>
          </p>
        </div>
      `;
    }

    return '';
  }

  renderToolsSection() {
    // Herramientas y aplicaciones relacionadas
    const tools = [
      {
        id: 'truk',
        name: 'Truk',
        description: 'Red social de economía colaborativa local',
        icon: '🤝',
        url: 'https://truk-production.up.railway.app/',
        color: '#3B82F6',
        tags: ['economía', 'colaborativa', 'comunidad', 'local']
      }
    ];

    if (tools.length === 0) return '';

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

    tools.forEach(tool => {
      html += `
        <a href="${tool.url}" target="_blank" rel="noopener noreferrer"
           class="tool-card group relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20 cursor-pointer block bg-gray-800/60 backdrop-blur border border-gray-700/50 hover:border-emerald-500/50">

          <div class="relative p-4 sm:p-6">
            <!-- Header con icono y badge -->
            <div class="flex items-start justify-between mb-4">
              <div class="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                <span class="text-4xl">${tool.icon}</span>
              </div>
              <span class="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                🌐 Web App
              </span>
            </div>

            <!-- Name -->
            <h4 class="text-xl sm:text-2xl font-bold mb-2 text-white group-hover:text-emerald-300 transition">
              ${tool.name}
            </h4>

            <!-- Description -->
            <p class="text-sm opacity-80 mb-4 text-gray-300">
              ${tool.description}
            </p>

            <!-- Tags -->
            <div class="flex flex-wrap gap-2 mb-4">
              ${tool.tags.map(tag =>
                `<span class="px-2 py-1 text-xs rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-700/30">#${tag}</span>`
              ).join('')}
            </div>

            <!-- Action Button -->
            <div class="w-full py-3 px-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 text-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg group-hover:shadow-emerald-500/25">
              🚀 Abrir Aplicación
            </div>
          </div>
        </a>
      `;
    });

    html += '</div></div>';
    return html;
  }

  renderFutureBooks() {
    const futureBooks = this.bookEngine.catalog.futureBooks;
    if (!futureBooks || futureBooks.length === 0) return '';

    let html = '<div class="future-books mb-8 sm:mb-12">';
    html += `<h3 class="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      ${this.i18n.t('library.comingSoon')}
    </h3>`;
    html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';

    futureBooks.forEach(book => {
      html += `
        <div class="future-book p-6 rounded-xl border border-dashed border-gray-600 opacity-60">
          <h4 class="text-xl font-bold mb-2">${book.title}</h4>
          <p class="text-sm mb-3">${book.category}</p>
          <p class="text-sm opacity-70">${book.description}</p>
        </div>
      `;
    });

    html += '</div></div>';
    return html;
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
    let books = this.bookEngine.getAllBooks();

    // Filtrar por categoría
    if (this.filterCategory && this.filterCategory !== 'all') {
      books = books.filter(book => book.category === this.filterCategory);
    }

    // Filtrar por búsqueda
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      books = books.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.subtitle.toLowerCase().includes(query) ||
        book.description.toLowerCase().includes(query) ||
        book.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return books;
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
    // Search input (re-attached after each render)
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      // Remove old listener if exists
      const newInput = searchInput.cloneNode(true);
      searchInput.parentNode.replaceChild(newInput, searchInput);

      newInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
        this.attachEventListeners();
      });
    }

    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
      const newFilter = categoryFilter.cloneNode(true);
      categoryFilter.parentNode.replaceChild(newFilter, categoryFilter);

      newFilter.addEventListener('change', (e) => {
        this.filterCategory = e.target.value;
        this.render();
        this.attachEventListeners();
      });
    }
  }

  attachDelegatedListeners() {
    // Event delegation for book cards (attach once, persists across renders)
    if (this.delegatedListenersAttached) {
      return; // Ya está attached
    }

    // Attach to parent container that never gets recreated
    const bibliotecaView = document.getElementById('biblioteca-view');
    if (bibliotecaView) {
      bibliotecaView.addEventListener('click', (e) => {
        // Header action buttons (using delegation)
        const androidBtn = e.target.closest('#android-download-btn-bib');
        const aiSettingsBtn = e.target.closest('#ai-settings-btn-bib');
        const donationsBtn = e.target.closest('#donations-btn-bib');
        const languageBtn = e.target.closest('#language-selector-btn-bib');

        if (androidBtn) {
          e.preventDefault();
          const apkUrl = this.bookEngine.getLatestAPK();
          window.open(apkUrl, '_blank');
          return;
        }

        if (aiSettingsBtn) {
          e.preventDefault();
          if (window.aiSettingsModal) window.aiSettingsModal.open();
          return;
        }

        if (donationsBtn) {
          e.preventDefault();
          if (window.donationsModal) window.donationsModal.open();
          return;
        }

        if (languageBtn) {
          e.preventDefault();
          if (window.languageSelector) window.languageSelector.open();
          return;
        }

        // Find book card or button
        const button = e.target.closest('[data-action="open-book"]');
        const card = e.target.closest('.book-card');

        if (button) {
          e.preventDefault();
          e.stopPropagation();
          const bookId = button.getAttribute('data-book-id');
          if (bookId) {
            logger.log('📖 Opening book:', bookId);
            this.openBook(bookId);
          }
        } else if (card && e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
          const bookId = card.getAttribute('data-book-id');
          if (bookId) {
            logger.log('📖 Opening book from card:', bookId);
            this.openBook(bookId);
          }
        }
      });

      this.delegatedListenersAttached = true;
      logger.log('✅ Event delegation attached to biblioteca-view');
    }
  }

  // ==========================================================================
  // NAVEGACIÓN
  // ==========================================================================

  async openBook(bookId) {
    try {
      // Todos los libros ahora usan el sistema unificado JSON
      // (manual-practico y practicas-radicales fueron convertidos de HTML a JSON)

      // Mostrar loading
      this.showLoading(`${this.i18n.t('loading.loadingBook')} ${bookId}...`);

      // Cargar libro
      await this.bookEngine.loadBook(bookId);

      // Aplicar tema
      this.bookEngine.applyTheme(this.bookEngine.getCurrentBookConfig());

      // Determinar qué capítulo abrir
      const progress = this.bookEngine.getProgress(bookId);
      let chapterId;

      if (progress.lastChapter) {
        // Continuar desde donde dejó
        chapterId = progress.lastChapter;
      } else {
        // Empezar desde el principio
        const chapters = this.bookEngine.getAllChapters();
        chapterId = chapters[0]?.id || 'prologo';
      }

      // Navegar al capítulo
      const chapter = this.bookEngine.navigateToChapter(chapterId);

      // Ocultar loading
      this.hideLoading();

      // Ocultar biblioteca, mostrar lector
      this.hide();
      window.bookReader.show(chapter);

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
