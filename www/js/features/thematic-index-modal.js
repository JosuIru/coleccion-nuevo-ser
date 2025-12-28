// ============================================================================
// THEMATIC INDEX MODAL - Índice temático con filtros y categorías prácticas
// ============================================================================

class ThematicIndexModal {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.i18n = window.i18n || new I18n();
    this.metadata = null;
    this.currentView = 'practical'; // 'practical' or 'browse'
    this.currentFilters = {
      type: 'all',
      difficulty: 'all',
      tags: []
    };
    this.loadMetadata();
  }

  async loadMetadata() {
    try {
      const response = await fetch('books/metadata/chapters-metadata.json');
      this.metadata = await response.json();
    } catch (error) {
      console.error('Error loading metadata:', error);
      this.metadata = null;
    }
  }

  async open() {
    // FIX v2.9.234: Show loading state while fetching metadata
    this.renderLoading();

    try {
      await this.loadMetadata();
      this.render();

      // Esperar a que el DOM se actualice antes de adjuntar listeners
      setTimeout(() => {
        this.attachEventListeners();
      }, 50);
    } catch (error) {
      console.error('Error opening thematic index:', error);
      window.toast?.error('Error al cargar el indice tematico');
      this.close();
    }
  }

  // FIX v2.9.234: Loading state for async data
  renderLoading() {
    const existing = document.getElementById('thematic-index-modal');
    if (existing) existing.remove();

    const html = `
      <div id="thematic-index-modal" class="fixed inset-0 bg-black/90 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm">
        <div class="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-2xl p-8 border-2 border-purple-500/30 shadow-2xl">
          <div class="flex flex-col items-center gap-4">
            <div class="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <p class="text-gray-400">Cargando indice tematico...</p>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  close() {
    const modal = document.getElementById('thematic-index-modal');
    if (modal) modal.remove();
  }

  render() {
    const html = `
      <div id="thematic-index-modal" class="fixed inset-0 bg-black/90 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm overflow-y-auto">
        <div class="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-2xl max-w-6xl w-full border-2 border-purple-500/30 shadow-2xl my-4 max-h-[90vh] flex flex-col">

          <!-- Header -->
          <div class="p-4 sm:p-6 border-b border-purple-500/20 flex-shrink-0">
            <div class="flex items-center justify-between">
              <h2 class="text-xl sm:text-2xl font-bold flex items-center gap-3">
                <span class="text-3xl">${Icons.library(28)}</span>
                <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Índice Temático
                </span>
              </h2>
              <button id="close-thematic-index" class="hover:text-red-400 transition text-gray-900 dark:text-white" aria-label="Cerrar índice temático">
                ${Icons.close(28)}
              </button>
            </div>

            <!-- View Tabs -->
            <div class="flex gap-2 mt-4">
              <button id="tab-practical" class="px-4 py-2 rounded-lg transition ${this.currentView === 'practical' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-gray-400 hover:text-white'}">
                ${Icons.target(16)} Guías Prácticas
              </button>
              <button id="tab-browse" class="px-4 py-2 rounded-lg transition ${this.currentView === 'browse' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-gray-400 hover:text-white'}">
                ${Icons.filter(16)} Explorar con Filtros
              </button>
            </div>
          </div>

          <!-- Content -->
          <div id="thematic-content" class="flex-1 overflow-y-auto p-4 sm:p-6">
            ${this.currentView === 'practical' ? this.renderPracticalCategories() : this.renderBrowseView()}
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  renderPracticalCategories() {
    if (!this.metadata || !this.metadata.practicalCategories) {
      return '<p class="text-gray-400">Cargando categorías...</p>';
    }

    const categories = this.metadata.practicalCategories;

    return `
      <div class="space-y-6">
        <div class="text-center mb-6">
          <p class="text-gray-300">Explora contenido organizado por casos de uso prácticos</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${Object.entries(categories).map(([key, category]) => this.renderPracticalCard(key, category)).join('')}
        </div>
      </div>
    `;
  }

  renderPracticalCard(key, category) {
    const colorClasses = {
      purple: 'from-purple-600/20 to-purple-800/20 border-purple-500/30 hover:border-purple-400',
      green: 'from-green-600/20 to-green-800/20 border-green-500/30 hover:border-green-400',
      amber: 'from-amber-600/20 to-amber-800/20 border-amber-500/30 hover:border-amber-400',
      pink: 'from-pink-600/20 to-pink-800/20 border-pink-500/30 hover:border-pink-400',
      cyan: 'from-cyan-600/20 to-cyan-800/20 border-cyan-500/30 hover:border-cyan-400',
      lime: 'from-lime-600/20 to-lime-800/20 border-lime-500/30 hover:border-lime-400',
      yellow: 'from-yellow-600/20 to-yellow-800/20 border-yellow-500/30 hover:border-yellow-400',
      indigo: 'from-indigo-600/20 to-indigo-800/20 border-indigo-500/30 hover:border-indigo-400'
    };

    const colorClass = colorClasses[category.color] || colorClasses.purple;

    const chaptersCount = category.relatedChapters?.length || 0;

    return `
      <div class="bg-gradient-to-br ${colorClass} border rounded-lg p-4 hover:shadow-lg transition cursor-pointer practical-category-card"
           data-category="${key}">
        <div class="text-3xl mb-3">${Icons.create(category.icon, 32)}</div>
        <h3 class="text-lg font-bold text-white mb-2">${category.title}</h3>
        <p class="text-sm text-gray-300 mb-3">${category.description}</p>
        <div class="flex items-center justify-between text-xs text-gray-400">
          <span>${chaptersCount} capítulos</span>
          <span class="text-white">${Icons.arrowRight(16)}</span>
        </div>
      </div>
    `;
  }

  renderPracticalCategoryDetail(categoryKey) {
    const category = this.metadata.practicalCategories[categoryKey];
    if (!category) return '';

    const chapters = this.getChaptersForCategory(categoryKey);

    return `
      <div class="space-y-6">
        <!-- Back button -->
        <button id="back-to-categories" class="flex items-center gap-2 text-purple-400 hover:text-purple-300">
          ${Icons.arrowLeft(16)} Volver a categorías
        </button>

        <!-- Category Header -->
        <div class="text-center mb-6">
          <div class="text-5xl mb-4">${Icons.create(category.icon, 48)}</div>
          <h2 class="text-2xl font-bold text-white mb-2">${category.title}</h2>
          <p class="text-gray-300">${category.description}</p>
        </div>

        <!-- Chapters List -->
        <div class="space-y-3">
          <h3 class="text-lg font-semibold text-purple-400">Capítulos relacionados:</h3>
          ${chapters.map(chapter => this.renderChapterCard(chapter)).join('')}
        </div>
      </div>
    `;
  }

  getChaptersForCategory(categoryKey) {
    const category = this.metadata.practicalCategories[categoryKey];
    const chapters = [];

    if (!category || !category.relatedChapters) return chapters;

    // Ahora relatedChapters es un array de objetos {bookId, chapterId}
    category.relatedChapters.forEach(ref => {
      const bookId = ref.bookId;
      const chapterId = ref.chapterId;
      const bookMetadata = this.metadata.chapters[bookId];

      if (bookMetadata && bookMetadata[chapterId]) {
        chapters.push({
          bookId,
          chapterId,
          metadata: bookMetadata[chapterId]
        });
      }
    });

    return chapters;
  }

  renderBrowseView() {
    return `
      <div class="space-y-6">
        <!-- Filters -->
        <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-purple-400 mb-3">Filtros:</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <!-- Type filter -->
            <select id="filter-browse-type" class="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm">
              <option value="all">Todos los tipos</option>
              <option value="teoría">Teoría</option>
              <option value="práctica">Práctica</option>
              <option value="teoría-práctica">Teoría + Práctica</option>
            </select>

            <!-- Difficulty filter -->
            <select id="filter-browse-difficulty" class="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm">
              <option value="all">Todas las dificultades</option>
              <option value="básico">Básico</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </select>

            <!-- Sort -->
            <select id="sort-browse" class="px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm">
              <option value="chapter">Por capítulo</option>
              <option value="difficulty">Por dificultad</option>
              <option value="time">Por tiempo de lectura</option>
            </select>
          </div>
        </div>

        <!-- Chapters List -->
        <div id="browse-chapters-list">
          ${this.renderFilteredChapters()}
        </div>
      </div>
    `;
  }

  renderFilteredChapters() {
    const bookId = 'manual-transicion';
    const bookMetadata = this.metadata?.chapters?.[bookId];

    if (!bookMetadata) {
      return '<p class="text-gray-400">Cargando capítulos...</p>';
    }

    let chapters = Object.entries(bookMetadata).map(([chapterId, metadata]) => ({
      bookId,
      chapterId,
      metadata
    }));

    // Apply filters
    if (this.currentFilters.type !== 'all') {
      chapters = chapters.filter(c => c.metadata.type === this.currentFilters.type);
    }

    if (this.currentFilters.difficulty !== 'all') {
      chapters = chapters.filter(c => c.metadata.difficulty === this.currentFilters.difficulty);
    }

    if (chapters.length === 0) {
      return '<p class="text-gray-400 text-center py-8">No hay capítulos que coincidan con los filtros</p>';
    }

    return `
      <div class="space-y-3">
        ${chapters.map(chapter => this.renderChapterCard(chapter)).join('')}
      </div>
    `;
  }

  renderChapterCard(chapter) {
    const metadata = chapter.metadata;
    const typeInfo = this.metadata?.contentTypes?.[metadata.type] || {};
    const difficultyInfo = this.metadata?.difficultyLevels?.[metadata.difficulty] || {};

    return `
      <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-purple-500/50 transition cursor-pointer chapter-card"
           data-book-id="${chapter.bookId}"
           data-chapter-id="${chapter.chapterId}">

        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <h4 class="font-semibold text-white mb-2">${this.getChapterTitle(chapter.bookId, chapter.chapterId)}</h4>

            <!-- Tags -->
            ${metadata.tags ? `
              <div class="flex flex-wrap gap-1 mb-2">
                ${metadata.tags.slice(0, 4).map(tag => `
                  <span class="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                    ${tag}
                  </span>
                `).join('')}
                ${metadata.tags.length > 4 ? `<span class="text-xs text-gray-400">+${metadata.tags.length - 4}</span>` : ''}
              </div>
            ` : ''}

            <!-- Metadata -->
            <div class="flex flex-wrap gap-2 text-xs">
              ${metadata.type ? `
                <span class="px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 flex items-center gap-1">
                  ${typeInfo.icon ? Icons.create(typeInfo.icon, 12) : ''} ${typeInfo.label || metadata.type}
                </span>
              ` : ''}

              ${metadata.difficulty ? `
                <span class="px-2 py-1 bg-${difficultyInfo.color || 'gray'}-500/20 text-${difficultyInfo.color || 'gray'}-300 rounded border border-${difficultyInfo.color || 'gray'}-500/30">
                  ${difficultyInfo.label || metadata.difficulty}
                </span>
              ` : ''}

              ${metadata.readingTime ? `
                <span class="px-2 py-1 bg-gray-500/20 text-gray-300 rounded border border-gray-500/30 flex items-center gap-1">
                  ${Icons.clock(12)} ${metadata.readingTime} min
                </span>
              ` : ''}
            </div>
          </div>

          <div class="text-purple-400">
            ${Icons.arrowRight(20)}
          </div>
        </div>
      </div>
    `;
  }

  getChapterTitle(bookId, chapterId) {
    // Intentar obtener el título de los metadatos
    const bookMetadata = this.metadata?.chapters?.[bookId];
    const chapterMeta = bookMetadata?.[chapterId];

    if (chapterMeta?.title) {
      return chapterMeta.title;
    }

    // Fallback: obtener del bookEngine si está disponible
    if (this.bookEngine) {
      try {
        // Usar el catálogo para obtener info del libro
        const catalog = this.bookEngine.catalog;
        const book = catalog?.books?.find(b => b.id === bookId);
        if (book) {
          return `${book.title} - ${chapterId}`;
        }
      } catch (error) {
        // console.warn('No se pudo obtener título del bookEngine:', error);
      }
    }

    // Último fallback: simplemente el ID del capítulo
    return chapterId;
  }

  attachEventListeners() {
    // Close
    document.getElementById('close-thematic-index')?.addEventListener('click', () => this.close());

    // View tabs
    document.getElementById('tab-practical')?.addEventListener('click', () => {
      this.currentView = 'practical';
      this.updateContent();
    });

    document.getElementById('tab-browse')?.addEventListener('click', () => {
      this.currentView = 'browse';
      this.updateContent();
    });

    // Practical category cards
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.practical-category-card');
      if (card) {
        const category = card.dataset.category;
        this.showCategoryDetail(category);
      }
    });

    // Chapter cards
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.chapter-card');
      if (card) {
        const bookId = card.dataset.bookId;
        const chapterId = card.dataset.chapterId;

        this.close();

        if (window.openBook) {
          window.openBook(bookId, chapterId);
        }
      }
    });

    // Browse filters
    ['type', 'difficulty'].forEach(filterType => {
      const select = document.getElementById(`filter-browse-${filterType}`);
      if (select) {
        select.addEventListener('change', (e) => {
          this.currentFilters[filterType] = e.target.value;
          this.updateBrowseList();
        });
      }
    });

    // ESC to close
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Click outside to close
    document.getElementById('thematic-index-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'thematic-index-modal') {
        this.close();
      }
    });
  }

  showCategoryDetail(categoryKey) {
    const content = document.getElementById('thematic-content');
    if (!content) return;

    content.innerHTML = this.renderPracticalCategoryDetail(categoryKey);

    // Attach back button listener
    document.getElementById('back-to-categories')?.addEventListener('click', () => {
      content.innerHTML = this.renderPracticalCategories();
    });
  }

  updateContent() {
    const content = document.getElementById('thematic-content');
    if (!content) return;

    content.innerHTML = this.currentView === 'practical'
      ? this.renderPracticalCategories()
      : this.renderBrowseView();

    // Update tabs
    document.getElementById('tab-practical')?.classList.toggle('bg-purple-600', this.currentView === 'practical');
    document.getElementById('tab-practical')?.classList.toggle('bg-slate-800', this.currentView !== 'practical');
    document.getElementById('tab-browse')?.classList.toggle('bg-purple-600', this.currentView === 'browse');
    document.getElementById('tab-browse')?.classList.toggle('bg-slate-800', this.currentView !== 'browse');
  }

  updateBrowseList() {
    const list = document.getElementById('browse-chapters-list');
    if (!list) return;

    list.innerHTML = this.renderFilteredChapters();
  }
}

// Export
window.ThematicIndexModal = ThematicIndexModal;
