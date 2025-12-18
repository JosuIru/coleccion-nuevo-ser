// ============================================================================
// SEARCH MODAL - Búsqueda semántica en todos los libros
// ============================================================================

class SearchModal {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.i18n = window.i18n || new I18n();
    this.metadata = null;
    this.searchResults = [];
    this.currentFilters = {
      book: 'all',
      type: 'all',
      difficulty: 'all',
      practicalUse: 'all'
    };
    this.escapeHandler = null; // Handler for escape key
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

  open() {
    // console.log('🚀 SearchModal.open() llamado');
    // console.log('🚀 BookEngine disponible:', this.bookEngine ? 'SÍ' : 'NO');

    this.render();

    // Esperar a que el DOM se actualice antes de adjuntar listeners
    setTimeout(() => {
      // console.log('⏱️ Timeout ejecutado - adjuntando listeners');
      this.attachEventListeners();

      // Focus en el input de búsqueda
      const input = document.getElementById('search-input');
      // console.log('🎯 Focus en input:', input ? 'SÍ' : 'NO');
      input?.focus();
    }, 50);
  }

  close() {
    // Limpiar escape key handler
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }

    const modal = document.getElementById('search-modal');
    if (modal) modal.remove();
  }

  // Búsqueda full-text en todos los libros
  async search(query) {
    if (!query || query.trim().length < 3) {
      if (query.trim().length > 0 && query.trim().length < 3) {
        // Mostrar mensaje de mínimo 3 caracteres
        const container = document.getElementById('search-results');
        if (container) {
          container.innerHTML = `
            <div class="text-center text-gray-600 dark:text-gray-400 py-12">
              <div class="text-6xl mb-4">⌨️</div>
              <p class="text-lg text-gray-800 dark:text-gray-300">Escribe al menos 3 caracteres para buscar</p>
            </div>
          `;
        }
      }
      this.searchResults = [];
      return;
    }

    // Mostrar indicador de carga
    const loadingIndicator = document.getElementById('search-loading');
    if (loadingIndicator) loadingIndicator.classList.remove('hidden');

    const normalizedQuery = this.normalizeText(query);
    const queryWords = normalizedQuery.split(' ').filter(w => w.length > 2);

    this.searchResults = [];

    // Mostrar mensaje "Buscando..."
    const container = document.getElementById('search-results');
    if (container) {
      container.innerHTML = `
        <div class="text-center text-gray-600 dark:text-gray-400 py-12">
          <div class="animate-pulse text-6xl mb-4">🔍</div>
          <p class="text-lg text-gray-800 dark:text-gray-300">Buscando en todos los libros...</p>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">Esto puede tomar unos segundos</p>
        </div>
      `;
    }

    // Buscar en todos los libros del catálogo
    // console.log('🔍 Iniciando búsqueda con query:', query);
    // console.log('🔍 BookEngine:', this.bookEngine);

    let catalog;
    try {
      catalog = await this.bookEngine.loadCatalog();
      // console.log('🔍 Catálogo cargado:', catalog);
    } catch (error) {
      console.error('❌ Error cargando catálogo:', error);
      if (loadingIndicator) loadingIndicator.classList.add('hidden');
      if (container) {
        container.innerHTML = `
          <div class="text-center text-red-600 dark:text-red-400 py-12">
            <div class="text-6xl mb-4">❌</div>
            <p class="text-lg">Error cargando el catálogo de libros</p>
            <p class="text-sm mt-2">${error.message}</p>
          </div>
        `;
      }
      return;
    }

    for (const book of catalog.books) {
      try {
        // console.log('🔍 Buscando en libro:', book.id);
        // Cargar book.json completo (contiene todas las secciones y capítulos)
        const bookData = await this.loadBookData(book.id);
        // console.log(`📚 Datos de ${book.id}:`, bookData);

        if (!bookData || !bookData.sections) {
          // console.warn(`⚠️ ${book.id} no tiene secciones`);
          continue;
        }

        // Buscar en cada sección
        for (const section of bookData.sections) {
          for (const chapter of section.chapters || []) {
            // El contenido está directamente en el capítulo
            if (chapter.content) {
              const relevance = this.calculateRelevance(chapter, queryWords, chapter.id, book.id);
              // console.log(`   📄 Capítulo ${chapter.id}: score=${relevance.score}`);

              if (relevance.score > 0) {
                // console.log(`   ✅ MATCH encontrado en ${chapter.id}`);
                this.searchResults.push({
                  bookId: book.id,
                  bookTitle: book.title,
                  sectionId: section.id,
                  sectionTitle: section.title,
                  chapterId: chapter.id,
                  chapterTitle: chapter.title,
                  score: relevance.score,
                  matches: relevance.matches,
                  excerpt: relevance.excerpt,
                  metadata: this.getChapterMetadata(book.id, chapter.id)
                });
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error searching in book ${book.id}:`, error);
      }
    }

    // console.log('🎯 Total resultados encontrados:', this.searchResults.length);

    // Ordenar por relevancia
    this.searchResults.sort((a, b) => b.score - a.score);

    // Ocultar indicador de carga
    if (loadingIndicator) loadingIndicator.classList.add('hidden');

    // Aplicar filtros
    this.applyFilters();
  }

  async loadBookData(bookId) {
    try {
      const url = `books/${bookId}/book.json`;
      // console.log(`📖 Cargando: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`❌ HTTP ${response.status} para ${url}`);
        return null;
      }
      const data = await response.json();
      // console.log(`✅ ${bookId} cargado: ${data.sections?.length || 0} secciones`);
      return data;
    } catch (error) {
      console.error(`❌ Error loading book ${bookId}:`, error);
      return null;
    }
  }

  normalizeText(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^\w\s]/g, ' ') // Eliminar puntuación
      .replace(/\s+/g, ' ')
      .trim();
  }

  calculateRelevance(chapter, queryWords, chapterId, bookId) {
    let score = 0;
    const matches = [];
    let excerpt = '';

    // Buscar en título (peso 3x)
    const titleNormalized = this.normalizeText(chapter.title || '');
    queryWords.forEach(word => {
      if (titleNormalized.includes(word)) {
        score += 3;
        matches.push({ field: 'title', word });
      }
    });

    // Buscar en contenido (peso 1x)
    const contentNormalized = this.normalizeText(chapter.content || '');
    queryWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      const occurrences = (contentNormalized.match(regex) || []).length;
      score += occurrences;
      if (occurrences > 0) {
        matches.push({ field: 'content', word, count: occurrences });
      }
    });

    // Buscar en ejercicios (peso 2x)
    if (chapter.exercises) {
      chapter.exercises.forEach(exercise => {
        const exerciseText = this.normalizeText(
          `${exercise.title} ${exercise.description || ''} ${exercise.reflection || ''}`
        );
        queryWords.forEach(word => {
          if (exerciseText.includes(word)) {
            score += 2;
            matches.push({ field: 'exercise', word });
          }
        });
      });
    }

    // Buscar en metadatos/tags (peso 4x)
    const metadata = this.getChapterMetadata(bookId, chapterId);
    if (metadata) {
      const tagsText = this.normalizeText(
        [...(metadata.tags || []), ...(metadata.keywords || [])].join(' ')
      );
      queryWords.forEach(word => {
        if (tagsText.includes(word)) {
          score += 4;
          matches.push({ field: 'tags', word });
        }
      });
    }

    // Generar extracto
    if (matches.length > 0 && chapter.content) {
      excerpt = this.generateExcerpt(chapter.content, queryWords[0]);
    }

    return { score, matches, excerpt };
  }

  generateExcerpt(content, keyword) {
    const normalizedContent = this.normalizeText(content);
    const normalizedKeyword = this.normalizeText(keyword);
    const index = normalizedContent.indexOf(normalizedKeyword);

    if (index === -1) return '';

    // Extraer ~150 caracteres alrededor de la palabra
    const start = Math.max(0, index - 75);
    const end = Math.min(content.length, index + 75);
    let excerpt = content.substring(start, end);

    // Limpiar inicio/fin
    excerpt = excerpt.replace(/^\S+\s/, '');
    excerpt = excerpt.replace(/\s\S+$/, '');

    return (start > 0 ? '...' : '') + excerpt + (end < content.length ? '...' : '');
  }

  getChapterMetadata(bookId, chapterId) {
    if (!this.metadata || !this.metadata.chapters) return null;
    return this.metadata.chapters[bookId]?.[chapterId] || null;
  }

  applyFilters() {
    let filtered = [...this.searchResults];

    // Filtrar por libro
    if (this.currentFilters.book !== 'all') {
      filtered = filtered.filter(r => r.bookId === this.currentFilters.book);
    }

    // Filtrar por tipo
    if (this.currentFilters.type !== 'all') {
      filtered = filtered.filter(r => r.metadata?.type === this.currentFilters.type);
    }

    // Filtrar por dificultad
    if (this.currentFilters.difficulty !== 'all') {
      filtered = filtered.filter(r => r.metadata?.difficulty === this.currentFilters.difficulty);
    }

    // Filtrar por uso práctico
    if (this.currentFilters.practicalUse !== 'all') {
      filtered = filtered.filter(r =>
        r.metadata?.practicalUses?.includes(this.currentFilters.practicalUse)
      );
    }

    this.filteredResults = filtered;
    this.updateResults();
  }

  render() {
    const html = `
      <div id="search-modal" class="fixed inset-0 bg-white/95 dark:bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div class="bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 rounded-2xl max-w-4xl w-full border-2 border-gray-300 dark:border-cyan-500/30 shadow-2xl max-h-[90vh] flex flex-col">

          <!-- Header -->
          <div class="p-4 sm:p-6 border-b border-gray-200 dark:border-cyan-500/20 flex-shrink-0">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl sm:text-2xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                <span class="text-cyan-600 dark:text-cyan-400">${Icons.search(28)}</span>
                <span class="text-gray-900 dark:text-transparent dark:bg-gradient-to-r dark:from-cyan-400 dark:to-blue-400 dark:bg-clip-text">
                  Búsqueda Inteligente
                </span>
              </h2>
              <button id="close-search" class="w-10 h-10 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition flex items-center justify-center text-gray-900 dark:text-white" aria-label="Cerrar búsqueda">
                ${Icons.close(28)}
              </button>
            </div>

            <!-- Search Input -->
            <div class="relative flex gap-2">
              <div class="relative flex-1">
                <input
                  type="text"
                  id="search-input"
                  placeholder="Escribe para buscar... (mínimo 3 caracteres)"
                  class="w-full px-4 py-3 pl-12 pr-12 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50"
                />
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  ${Icons.search(20)}
                </div>
                <div id="search-loading" class="absolute right-4 top-1/2 -translate-y-1/2 hidden">
                  <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-500"></div>
                </div>
              </div>
              <button id="search-btn" class="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white font-semibold rounded-lg transition flex items-center gap-2">
                ${Icons.search(20)} Buscar
              </button>
            </div>

            <!-- Filters -->
            <div id="search-filters" class="mt-4 hidden">
              ${this.renderFilters()}
            </div>

            <button id="toggle-filters" class="mt-2 text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-2">
              ${Icons.filter(16)} Mostrar filtros
            </button>
          </div>

          <!-- Results -->
          <div id="search-results" class="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-transparent">
            <div class="text-center text-gray-600 dark:text-gray-400 py-12">
              <div class="text-6xl mb-4 text-gray-400 dark:text-gray-500">${Icons.search(64)}</div>
              <p class="text-lg text-gray-800 dark:text-gray-300">Busca en toda la colección de libros</p>
              <p class="text-sm mt-2 text-gray-600 dark:text-gray-400">Prueba: "crear comunidad", "meditación para ansiedad", "grupo de consumo"</p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  renderFilters() {
    const selectClass = "px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-white";
    return `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Filtro por libro -->
        <select id="filter-book" class="${selectClass}">
          <option value="all">Todos los libros</option>
          <option value="manual-transicion">Manual de Transición</option>
        </select>

        <!-- Filtro por tipo -->
        <select id="filter-type" class="${selectClass}">
          <option value="all">Todos los tipos</option>
          <option value="teoría">Teoría</option>
          <option value="práctica">Práctica</option>
          <option value="teoría-práctica">Teoría + Práctica</option>
        </select>

        <!-- Filtro por dificultad -->
        <select id="filter-difficulty" class="${selectClass}">
          <option value="all">Todas las dificultades</option>
          <option value="básico">Básico</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>

        <!-- Filtro por uso práctico -->
        <select id="filter-practical" class="${selectClass}">
          <option value="all">Todos los usos</option>
          <option value="crear-comunidad">Crear Comunidad</option>
          <option value="grupo-consumo">Grupo de Consumo</option>
          <option value="vivienda-colaborativa">Vivienda Colaborativa</option>
          <option value="meditación">Meditación</option>
          <option value="huerto">Huerto/Permacultura</option>
        </select>
      </div>
    `;
  }

  updateResults() {
    // console.log('📊 updateResults() llamado');
    const container = document.getElementById('search-results');
    if (!container) {
      console.error('❌ Container search-results no encontrado');
      return;
    }

    const results = this.filteredResults || this.searchResults;
    // console.log('📊 Mostrando resultados:', results.length);

    if (results.length === 0) {
      // console.log('⚠️ Sin resultados, mostrando mensaje');
      container.innerHTML = `
        <div class="text-center text-gray-600 dark:text-gray-400 py-12">
          <div class="text-6xl mb-4">🔍</div>
          <p class="text-lg text-gray-800 dark:text-gray-300">No se encontraron resultados</p>
          <p class="text-sm mt-2 text-gray-600 dark:text-gray-400">Intenta con otros términos o ajusta los filtros</p>
        </div>
      `;
      return;
    }

    // console.log('✅ Renderizando', results.length, 'resultados');
    const html = `
      <div class="space-y-4">
        <div class="text-sm text-gray-700 dark:text-gray-400 mb-4 font-semibold">
          ${results.length} resultado${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}
        </div>
        ${results.map(result => this.renderResult(result)).join('')}
      </div>
    `;

    container.innerHTML = html;
    // console.log('✅ Resultados renderizados en el DOM');
  }

  renderResult(result) {
    const metadata = result.metadata || {};
    const typeInfo = this.metadata?.contentTypes?.[metadata.type] || {};
    const difficultyInfo = this.metadata?.difficultyLevels?.[metadata.difficulty] || {};

    // Mapear colores de dificultad a clases completas de Tailwind
    const difficultyClasses = {
      'green': 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30',
      'yellow': 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30',
      'orange': 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30',
      'red': 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30',
      'gray': 'bg-gray-500/20 text-gray-600 dark:text-gray-200 border-gray-500/30'
    };

    const difficultyClass = difficultyClasses[difficultyInfo.color] || difficultyClasses.gray;

    return `
      <div class="bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg p-4 hover:border-cyan-500/50 hover:shadow-lg transition cursor-pointer search-result-item"
           data-book-id="${result.bookId}"
           data-chapter-id="${result.chapterId}">

        <!-- Title and Book -->
        <div class="flex items-start justify-between gap-4 mb-2">
          <div class="flex-1">
            <h3 class="text-lg font-bold text-cyan-700 dark:text-cyan-400 mb-1 hover:text-cyan-800 dark:hover:text-cyan-300">${result.chapterTitle}</h3>
            <p class="text-sm text-gray-700 dark:text-gray-400">${result.bookTitle} › ${result.sectionTitle}</p>
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-500 text-right font-medium">
            Relevancia: ${Math.round(result.score)}
          </div>
        </div>

        <!-- Excerpt -->
        ${result.excerpt ? `
          <div class="text-sm text-gray-800 dark:text-gray-300 mb-3 italic bg-cyan-50 dark:bg-slate-900/50 p-3 rounded border-l-2 border-cyan-500/50">
            "${result.excerpt}"
          </div>
        ` : ''}

        <!-- Metadata badges -->
        <div class="flex flex-wrap gap-2">
          ${metadata.type ? `
            <span class="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded border border-blue-300 dark:border-blue-500/30 flex items-center gap-1 font-medium">
              ${typeInfo.icon ? Icons.create(typeInfo.icon, 12) : ''} ${typeInfo.label || metadata.type}
            </span>
          ` : ''}

          ${metadata.difficulty ? `
            <span class="px-2 py-1 text-xs ${difficultyClass} rounded border font-medium">
              ${difficultyInfo.label || metadata.difficulty}
            </span>
          ` : ''}

          ${metadata.readingTime ? `
            <span class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-500/20 text-gray-800 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-500/30 flex items-center gap-1 font-medium">
              ${Icons.clock(12)} ${metadata.readingTime} min
            </span>
          ` : ''}
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // console.log('🎯 attachEventListeners() llamado');

    // Close button
    document.getElementById('close-search')?.addEventListener('click', () => {
      // console.log('❌ Close button clicked');
      this.close();
    });

    // Search input
    const searchInput = document.getElementById('search-input');
    // console.log('📝 Search input encontrado:', searchInput ? 'SÍ' : 'NO');

    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        // console.log('⌨️ Input event - valor:', e.target.value);
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          // console.log('⏰ Debounce timeout - ejecutando búsqueda automática');
          this.search(e.target.value);
        }, 500);
      });

      // Search on Enter
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          // console.log('⏎ Enter presionado - ejecutando búsqueda');
          clearTimeout(debounceTimer);
          this.search(e.target.value);
        }
      });
    }

    // Search button
    const searchBtn = document.getElementById('search-btn');
    // console.log('🔘 Search button encontrado:', searchBtn ? 'SÍ' : 'NO');

    // Verificar si hay múltiples inputs con el mismo ID
    const allInputs = document.querySelectorAll('#search-input');
    // console.log('🔍 Número de elementos con ID "search-input":', allInputs.length);
    allInputs.forEach((input, index) => {
      // console.log(`  Input ${index}: value="${input.value}", placeholder="${input.placeholder}"`);
    });

    if (searchBtn) {
      searchBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevenir comportamiento por defecto
        // console.log('🔘 BOTÓN BUSCAR CLICKEADO');

        // Obtener el input desde el contexto del modal
        const modal = document.getElementById('search-modal');
        const searchInputInModal = modal?.querySelector('#search-input');

        // console.log('🔘 Modal encontrado:', modal ? 'SÍ' : 'NO');
        // console.log('🔘 Input en modal:', searchInputInModal ? 'SÍ' : 'NO');
        // console.log('🔘 Valor del input:', searchInputInModal?.value);
        // console.log('🔘 Input es visible:', searchInputInModal ? window.getComputedStyle(searchInputInModal).display : 'N/A');

        if (searchInputInModal && searchInputInModal.value) {
          // console.log('✅ Ejecutando búsqueda con:', searchInputInModal.value);
          this.search(searchInputInModal.value);
        } else if (searchInputInModal) {
          // console.warn('⚠️ Input vacío - por favor escribe algo primero');
          searchInputInModal.focus();
        } else {
          console.error('❌ Input no encontrado en el modal');
        }
      });
    }

    // Toggle filters
    document.getElementById('toggle-filters')?.addEventListener('click', (e) => {
      const filtersDiv = document.getElementById('search-filters');
      const btn = e.currentTarget;

      if (filtersDiv.classList.contains('hidden')) {
        filtersDiv.classList.remove('hidden');
        btn.innerHTML = `${Icons.filter(16)} Ocultar filtros`;
      } else {
        filtersDiv.classList.add('hidden');
        btn.innerHTML = `${Icons.filter(16)} Mostrar filtros`;
      }
    });

    // Filter selects
    ['book', 'type', 'difficulty', 'practical'].forEach(filterType => {
      const select = document.getElementById(`filter-${filterType}`);
      if (select) {
        select.addEventListener('change', (e) => {
          this.currentFilters[filterType === 'practical' ? 'practicalUse' : filterType] = e.target.value;
          this.applyFilters();
        });
      }
    });

    // Result items
    document.addEventListener('click', (e) => {
      const resultItem = e.target.closest('.search-result-item');
      if (resultItem) {
        const bookId = resultItem.dataset.bookId;
        const chapterId = resultItem.dataset.chapterId;

        this.close();

        // Abrir el libro en el capítulo encontrado
        if (window.openBook) {
          window.openBook(bookId, chapterId);
        }
      }
    });

    // ESC to close - store handler for cleanup
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);

    // Click outside to close
    document.getElementById('search-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'search-modal') {
        this.close();
      }
    });
  }
}

// Export
window.SearchModal = SearchModal;
