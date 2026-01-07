// ============================================================================
// SEARCH MODAL - Búsqueda semántica en todos los libros
// ============================================================================

// 🔧 FIX v2.9.284: Migrated all console.* to logger
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

    // 🔧 FIX #29: Guardar promise de metadata para await en open()
    this.metadataPromise = this.loadMetadata();

    // 🔧 FIX #86: Event manager centralizado para limpieza consistente
    this.eventManager = new EventManager();
    this.eventManager.setComponentName('SearchModal');

    // 🔧 FIX #30: Caché de resultados de búsqueda para evitar búsquedas repetidas
    this.searchCache = new Map(); // key: "query|filters", value: { results, timestamp }
    this.cacheTTL = 5 * 60 * 1000; // 5 minutos
    this.maxCacheSize = 50; // Máximo 50 búsquedas en caché

    // 🔧 FIX #35: Debounce configurable a nivel de instancia
    this.debounceDelay = parseInt(localStorage.getItem('search-debounce-delay') || '300', 10); // 300ms por defecto
    this.debounceTimer = null; // Timer a nivel de instancia

    // 🔧 FIX #33: Índice invertido para búsqueda rápida en catálogos grandes
    this.searchIndex = null;
    this.indexPromise = this.buildSearchIndex();

    // 🔧 FIX #31: Inicializar filtros dinámicos desde catálogo
    this.filters = null;
    this.filtersPromise = this.loadFilters();
  }

  async loadMetadata() {
    try {
      // 🔧 FIX v2.9.234: Usar SafeFetch con cache offline y validación
      if (window.SafeFetch) {
        this.metadata = await window.SafeFetch.jsonWithFallback(
          'books/metadata/chapters-metadata.json',
          null,
          { showToast: false }
        );
      } else {
        const response = await fetch('books/metadata/chapters-metadata.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        this.metadata = await response.json();
      }
    } catch (error) {
      logger.error('Error loading metadata:', error);
      this.metadata = null;
    }
  }

  // 🔧 FIX #31: Cargar filtros dinámicamente desde el catálogo real
  async loadFilters() {
    try {
      // 🔧 FIX v2.9.234: Usar SafeFetch con cache offline
      let catalog;
      if (window.SafeFetch) {
        catalog = await window.SafeFetch.jsonWithFallback(
          'books/catalog.json',
          { books: [] },
          { showToast: false }
        );
      } else {
        const catalogResponse = await fetch('books/catalog.json');
        if (!catalogResponse.ok) throw new Error(`HTTP ${catalogResponse.status}`);
        catalog = await catalogResponse.json();
      }

      // Extraer categorías únicas de todos los libros
      const categoriesSet = new Set();
      if (catalog && catalog.books) {
        catalog.books.forEach(book => {
          if (book.category) {
            categoriesSet.add(book.category);
          }
        });
      }

      this.filters = {
        books: catalog.books
          .filter(book => book.status === 'published')
          .map(book => ({
            id: book.id,
            title: book.title
          })),
        categories: Array.from(categoriesSet).sort(),
        difficulty: ['básico', 'intermedio', 'avanzado']
      };

      logger.debug('✅ Filtros cargados desde catálogo:', this.filters);
    } catch (error) {
      logger.error('Error loading filters from catalog:', error);
      // Fallback a filtros vacíos
      this.filters = {
        books: [],
        categories: [],
        difficulty: ['básico', 'intermedio', 'avanzado']
      };
    }
  }

  // 🔧 FIX #33: Tokenizar texto para índice de búsqueda
  tokenize(text) {
    if (!text) return [];

    return this.normalizeText(text)
      .split(/\s+/)
      .filter(word => word.length > 2) // Ignorar palabras muy cortas
      .filter(word => !this.isStopWord(word)); // Filtrar palabras comunes sin valor semántico
  }

  // 🔧 FIX #33: Palabras comunes en español que no aportan valor a la búsqueda
  isStopWord(word) {
    const stopWords = new Set([
      'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
      'de', 'del', 'al', 'en', 'con', 'por', 'para', 'sin',
      'que', 'como', 'pero', 'mas', 'mas', 'esto', 'esta',
      'ese', 'esa', 'aquel', 'aquella', 'este', 'estos', 'estas',
      'esos', 'esas', 'aquellos', 'aquellas', 'su', 'sus',
      'mi', 'mis', 'tu', 'tus', 'nuestro', 'nuestra', 'vuestro',
      'ser', 'estar', 'haber', 'tener', 'hacer', 'poder', 'ir',
      'muy', 'mas', 'menos', 'tan', 'tanto', 'cuando', 'donde',
      'quien', 'cual', 'cuales'
    ]);
    return stopWords.has(word);
  }

  // 🔧 FIX #33: Construir índice invertido para búsqueda rápida
  async buildSearchIndex() {
    try {
      const index = new Map();

      // Cargar catálogo de libros
      const catalog = await this.bookEngine.loadCatalog();
      if (!catalog || !catalog.books) {
        logger.warn('No se pudo cargar el catálogo para construir el índice');
        return;
      }

      // Indexar todos los libros
      for (const book of catalog.books) {
        try {
          const bookData = await this.loadBookData(book.id);
          if (!bookData || !bookData.sections) continue;

          // Indexar cada sección y capítulo
          for (const section of bookData.sections) {
            for (const chapter of section.chapters || []) {
              // Tokenizar contenido del capítulo
              const titleTokens = this.tokenize(chapter.title || '');
              const contentTokens = this.tokenize(chapter.content || '');

              // Tokenizar ejercicios si existen
              let exerciseTokens = [];
              if (chapter.exercises && chapter.exercises.length > 0) {
                const exerciseText = chapter.exercises.map(ex =>
                  `${ex.title} ${ex.description || ''} ${ex.reflection || ''}`
                ).join(' ');
                exerciseTokens = this.tokenize(exerciseText);
              }

              // Combinar todos los tokens únicos
              const allTokens = new Set([...titleTokens, ...contentTokens, ...exerciseTokens]);

              // Agregar al índice invertido
              for (const token of allTokens) {
                if (!index.has(token)) {
                  index.set(token, []);
                }

                // Guardar referencia al capítulo
                index.get(token).push({
                  bookId: book.id,
                  bookTitle: book.title,
                  sectionId: section.id,
                  sectionTitle: section.title,
                  chapterId: chapter.id,
                  chapterTitle: chapter.title
                });
              }
            }
          }
        } catch (error) {
          logger.error(`Error indexando libro ${book.id}:`, error);
        }
      }

      this.searchIndex = index;
      logger.debug(`✅ Índice de búsqueda construido: ${index.size} términos únicos indexados`);
    } catch (error) {
      logger.error('Error construyendo índice de búsqueda:', error);
      this.searchIndex = null;
    }
  }

  async open() {
    // 🔧 FIX #29: Esperar a que metadata esté cargada antes de continuar
    await this.metadataPromise;

    // 🔧 FIX #33: Esperar a que el índice de búsqueda esté construido
    await this.indexPromise;

    // 🔧 FIX #31: Esperar a que los filtros estén cargados
    await this.filtersPromise;

    // Registrar uso de feature para hints contextuales
    if (window.contextualHints) {
      window.contextualHints.markFeatureUsed('search');
    }

    this.render();

    // Esperar a que el DOM se actualice antes de adjuntar listeners
    setTimeout(() => {
      // logger.debug('⏱️ Timeout ejecutado - adjuntando listeners');
      this.attachEventListeners();

      // Focus en el input de búsqueda
      const input = document.getElementById('search-input');
      // logger.debug('🎯 Focus en input:', input ? 'SÍ' : 'NO');
      input?.focus();
    }, 50);
  }

  close() {
    // 🔧 FIX #86: Limpiar todos los event listeners con EventManager
    if (this.eventManager) {
      this.eventManager.cleanup();
    }

    // Limpiar escape key handler
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }

    // 🔧 FIX #35: Limpiar debounce timer para evitar búsquedas pendientes
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
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

    // 🔧 FIX #30: Verificar caché antes de ejecutar búsqueda costosa
    const cacheKey = `${query}|${JSON.stringify(this.currentFilters)}`;
    const cachedResult = this.searchCache.get(cacheKey);
    const now = Date.now();

    if (cachedResult && (now - cachedResult.timestamp) < this.cacheTTL) {
      // Usar resultados cacheados
      this.searchResults = cachedResult.results;
      this.renderResults();

      // Ocultar indicador de carga
      const loadingIndicator = document.getElementById('search-loading');
      if (loadingIndicator) loadingIndicator.classList.add('hidden');

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

    // 🔧 FIX #33: Usar índice de búsqueda si está disponible (búsqueda rápida)
    if (this.searchIndex) {
      try {
        await this.searchWithIndex(queryWords);
      } catch (error) {
        logger.error('Error en búsqueda indexada, fallback a búsqueda secuencial:', error);
        await this.searchSequential(queryWords);
      }
    } else {
      // Fallback a búsqueda secuencial si el índice no está disponible
      logger.warn('Índice no disponible, usando búsqueda secuencial');
      await this.searchSequential(queryWords);
    }

    // logger.debug('🎯 Total resultados encontrados:', this.searchResults.length);

    // Ordenar por relevancia
    this.searchResults.sort((a, b) => b.score - a.score);

    // 🔧 FIX #30: Guardar resultados en caché (con evicción LRU si es necesario)
    // Limpiar entradas expiradas primero
    for (const [key, value] of this.searchCache.entries()) {
      if ((now - value.timestamp) >= this.cacheTTL) {
        this.searchCache.delete(key);
      }
    }

    // Evicción LRU: eliminar entrada más antigua si se excede el tamaño
    if (this.searchCache.size >= this.maxCacheSize) {
      const firstKey = this.searchCache.keys().next().value;
      this.searchCache.delete(firstKey);
    }

    // Guardar nuevos resultados en caché
    this.searchCache.set(cacheKey, {
      results: [...this.searchResults], // Deep copy para evitar mutaciones
      timestamp: now
    });

    // Ocultar indicador de carga
    if (loadingIndicator) loadingIndicator.classList.add('hidden');

    // Aplicar filtros
    this.applyFilters();
  }

  // 🔧 FIX #33: Búsqueda rápida usando índice invertido
  async searchWithIndex(queryWords) {
    // Usar el índice para obtener candidatos rápidamente
    const candidatesMap = new Map(); // key: "bookId|chapterId", value: { bookId, chapterId, ... }

    // Para cada palabra de la query, obtener capítulos candidatos del índice
    for (const word of queryWords) {
      const matches = this.searchIndex.get(word) || [];

      for (const match of matches) {
        const key = `${match.bookId}|${match.chapterId}`;
        if (!candidatesMap.has(key)) {
          candidatesMap.set(key, match);
        }
      }
    }

    // logger.debug(`🔍 Índice encontró ${candidatesMap.size} candidatos únicos`);

    // Ahora calcular relevancia detallada solo para los candidatos
    const candidates = Array.from(candidatesMap.values());

    for (const candidate of candidates) {
      try {
        // Cargar datos completos del libro para calcular relevancia precisa
        const bookData = await this.loadBookData(candidate.bookId);
        if (!bookData || !bookData.sections) continue;

        // Encontrar el capítulo específico
        for (const section of bookData.sections) {
          const chapter = section.chapters?.find(ch => ch.id === candidate.chapterId);

          if (chapter && chapter.content) {
            const relevance = this.calculateRelevance(chapter, queryWords, chapter.id, candidate.bookId);

            if (relevance.score > 0) {
              this.searchResults.push({
                bookId: candidate.bookId,
                bookTitle: candidate.bookTitle,
                sectionId: section.id,
                sectionTitle: section.title,
                chapterId: chapter.id,
                chapterTitle: chapter.title,
                score: relevance.score,
                matches: relevance.matches,
                excerpt: relevance.excerpt,
                metadata: this.getChapterMetadata(candidate.bookId, chapter.id)
              });
            }
            break; // Ya encontramos el capítulo, salir del loop de secciones
          }
        }
      } catch (error) {
        logger.error(`❌ Error procesando candidato ${candidate.bookId}/${candidate.chapterId}:`, error);
      }
    }
  }

  // 🔧 FIX #33: Búsqueda secuencial (fallback cuando no hay índice)
  async searchSequential(queryWords) {
    // Buscar en todos los libros del catálogo
    // logger.debug('🔍 Iniciando búsqueda secuencial con query:', queryWords);

    let catalog;
    try {
      catalog = await this.bookEngine.loadCatalog();
    } catch (error) {
      logger.error('❌ Error cargando catálogo:', error);
      const loadingIndicator = document.getElementById('search-loading');
      const container = document.getElementById('search-results');

      if (loadingIndicator) loadingIndicator.classList.add('hidden');
      if (container) {
        // ⭐ FIX v2.9.181: Sanitizar error.message para prevenir XSS
        container.innerHTML = `
          <div class="text-center text-red-600 dark:text-red-400 py-12">
            <div class="text-6xl mb-4">❌</div>
            <p class="text-lg">Error cargando el catálogo de libros</p>
            <p class="text-sm mt-2">${Sanitizer.escapeHtml(error.message)}</p>
          </div>
        `;
      }
      return;
    }

    for (const book of catalog.books) {
      try {
        // Cargar book.json completo (contiene todas las secciones y capítulos)
        const bookData = await this.loadBookData(book.id);

        if (!bookData || !bookData.sections) {
          continue;
        }

        // Buscar en cada sección
        for (const section of bookData.sections) {
          for (const chapter of section.chapters || []) {
            // El contenido está directamente en el capítulo
            if (chapter.content) {
              const relevance = this.calculateRelevance(chapter, queryWords, chapter.id, book.id);

              if (relevance.score > 0) {
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
        logger.error(`❌ Error searching in book ${book.id}:`, error);
      }
    }
  }

  async loadBookData(bookId) {
    try {
      const url = `books/${bookId}/book.json`;
      // logger.debug(`📖 Cargando: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        logger.error(`❌ HTTP ${response.status} para ${url}`);
        return null;
      }
      const data = await response.json();
      // logger.debug(`✅ ${bookId} cargado: ${data.sections?.length || 0} secciones`);
      return data;
    } catch (error) {
      logger.error(`❌ Error loading book ${bookId}:`, error);
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

  // 🔧 FIX #34: Pre-procesar query con frecuencia de términos para evitar iteraciones redundantes
  calculateRelevance(chapter, queryWords, chapterId, bookId) {
    const matches = [];
    let excerpt = '';

    // Calcular frecuencia de términos en la query (pre-procesamiento)
    const termFrequencyMap = new Map();
    queryWords.forEach(term => {
      termFrequencyMap.set(term, (termFrequencyMap.get(term) || 0) + 1);
    });

    // Pre-normalizar todos los textos una sola vez
    const titleNormalized = this.normalizeText(chapter.title || '');
    const contentNormalized = this.normalizeText(chapter.content || '');

    let score = 0;

    // Buscar en título (peso 5x, ponderado por frecuencia del término)
    queryWords.forEach(term => {
      if (titleNormalized.includes(term)) {
        const termWeight = termFrequencyMap.get(term);
        score += 5 * termWeight;
        matches.push({ field: 'title', word: term });
      }
    });

    // Buscar en contenido (peso 1x por ocurrencia)
    queryWords.forEach(term => {
      // Contar ocurrencias usando regex
      const occurrences = (contentNormalized.match(new RegExp(term, 'g')) || []).length;
      if (occurrences > 0) {
        score += occurrences;
        matches.push({ field: 'content', word: term, count: occurrences });
      }
    });

    // Buscar en ejercicios (peso 2x, ponderado por frecuencia del término)
    if (chapter.exercises && chapter.exercises.length > 0) {
      for (const exercise of chapter.exercises) {
        const exerciseText = this.normalizeText(
          `${exercise.title} ${exercise.description || ''} ${exercise.reflection || ''}`
        );

        queryWords.forEach(term => {
          if (exerciseText.includes(term)) {
            const termWeight = termFrequencyMap.get(term);
            score += 2 * termWeight;
            matches.push({ field: 'exercise', word: term });
          }
        });
      }
    }

    // Buscar en metadatos/tags (peso 4x, ponderado por frecuencia del término)
    const metadata = this.getChapterMetadata(bookId, chapterId);
    if (metadata) {
      const tags = [...(metadata.tags || []), ...(metadata.keywords || [])];
      if (tags.length > 0) {
        const tagsText = this.normalizeText(tags.join(' '));

        queryWords.forEach(term => {
          if (tagsText.includes(term)) {
            const termWeight = termFrequencyMap.get(term);
            score += 4 * termWeight;
            matches.push({ field: 'tags', word: term });
          }
        });
      }
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
      <div id="search-modal" class="fixed inset-0 bg-white/95 dark:bg-black/90 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm">
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

    // 🔧 FIX #31: Usar filtros cargados dinámicamente desde loadFilters()
    let booksOptions = '<option value="all">Todos los libros</option>';
    if (this.filters && this.filters.books) {
      this.filters.books.forEach(book => {
        booksOptions += `<option value="${book.id}">${book.title}</option>`;
      });
    }

    return `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Filtro por libro -->
        <select id="filter-book" class="${selectClass}">
          ${booksOptions}
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
    // logger.debug('📊 updateResults() llamado');
    const container = document.getElementById('search-results');
    if (!container) {
      logger.error('❌ Container search-results no encontrado');
      return;
    }

    const results = this.filteredResults || this.searchResults;
    // logger.debug('📊 Mostrando resultados:', results.length);

    if (results.length === 0) {
      // logger.debug('⚠️ Sin resultados, mostrando mensaje');
      container.innerHTML = `
        <div class="text-center text-gray-600 dark:text-gray-400 py-12">
          <div class="text-6xl mb-4">🔍</div>
          <p class="text-lg text-gray-800 dark:text-gray-300">No se encontraron resultados</p>
          <p class="text-sm mt-2 text-gray-600 dark:text-gray-400">Intenta con otros términos o ajusta los filtros</p>
        </div>
      `;
      return;
    }

    // logger.debug('✅ Renderizando', results.length, 'resultados');
    const html = `
      <div class="space-y-4">
        <div class="text-sm text-gray-700 dark:text-gray-400 mb-4 font-semibold">
          ${results.length} resultado${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}
        </div>
        ${results.map(result => this.renderResult(result)).join('')}
      </div>
    `;

    container.innerHTML = html;
    // logger.debug('✅ Resultados renderizados en el DOM');
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

    // 🔧 FIX v2.9.198: XSS prevention - sanitize search result data
    return `
      <div class="bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded-lg p-4 hover:border-cyan-500/50 hover:shadow-lg transition cursor-pointer search-result-item"
           data-book-id="${Sanitizer.sanitizeAttribute(result.bookId)}"
           data-chapter-id="${Sanitizer.sanitizeAttribute(result.chapterId)}">

        <!-- Title and Book -->
        <div class="flex items-start justify-between gap-4 mb-2">
          <div class="flex-1">
            <h3 class="text-lg font-bold text-cyan-700 dark:text-cyan-400 mb-1 hover:text-cyan-800 dark:hover:text-cyan-300">${Sanitizer.escapeHtml(result.chapterTitle)}</h3>
            <p class="text-sm text-gray-700 dark:text-gray-400">${Sanitizer.escapeHtml(result.bookTitle)} › ${Sanitizer.escapeHtml(result.sectionTitle)}</p>
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-500 text-right font-medium">
            Relevancia: ${Math.round(result.score)}
          </div>
        </div>

        <!-- Excerpt -->
        ${result.excerpt ? `
          <div class="text-sm text-gray-800 dark:text-gray-300 mb-3 italic bg-cyan-50 dark:bg-slate-900/50 p-3 rounded border-l-2 border-cyan-500/50">
            "${Sanitizer.escapeHtml(result.excerpt)}"
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
    // logger.debug('🎯 attachEventListeners() llamado');

    // Close button
    document.getElementById('close-search')?.addEventListener('click', () => {
      // logger.debug('❌ Close button clicked');
      this.close();
    });

    // Search input
    const searchInput = document.getElementById('search-input');
    // logger.debug('📝 Search input encontrado:', searchInput ? 'SÍ' : 'NO');

    if (searchInput) {
      // 🔧 FIX #35: Usar debounce a nivel de instancia con delay configurable
      searchInput.addEventListener('input', (e) => {
        // logger.debug('⌨️ Input event - valor:', e.target.value);
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          // logger.debug('⏰ Debounce timeout - ejecutando búsqueda automática');
          this.search(e.target.value);
        }, this.debounceDelay);
      });

      // Search on Enter
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          // logger.debug('⏎ Enter presionado - ejecutando búsqueda');
          clearTimeout(this.debounceTimer);
          this.search(e.target.value);
        }
      });
    }

    // Search button
    const searchBtn = document.getElementById('search-btn');
    // logger.debug('🔘 Search button encontrado:', searchBtn ? 'SÍ' : 'NO');

    // Verificar si hay múltiples inputs con el mismo ID
    const allInputs = document.querySelectorAll('#search-input');
    // logger.debug('🔍 Número de elementos con ID "search-input":', allInputs.length);
    allInputs.forEach((input, index) => {
      // logger.debug(`  Input ${index}: value="${input.value}", placeholder="${input.placeholder}"`);
    });

    if (searchBtn) {
      searchBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevenir comportamiento por defecto
        // logger.debug('🔘 BOTÓN BUSCAR CLICKEADO');

        // Obtener el input desde el contexto del modal
        const modal = document.getElementById('search-modal');
        const searchInputInModal = modal?.querySelector('#search-input');

        // logger.debug('🔘 Modal encontrado:', modal ? 'SÍ' : 'NO');
        // logger.debug('🔘 Input en modal:', searchInputInModal ? 'SÍ' : 'NO');
        // logger.debug('🔘 Valor del input:', searchInputInModal?.value);
        // logger.debug('🔘 Input es visible:', searchInputInModal ? window.getComputedStyle(searchInputInModal).display : 'N/A');

        if (searchInputInModal && searchInputInModal.value) {
          // logger.debug('✅ Ejecutando búsqueda con:', searchInputInModal.value);
          this.search(searchInputInModal.value);
        } else if (searchInputInModal) {
          // logger.warn('⚠️ Input vacío - por favor escribe algo primero');
          searchInputInModal.focus();
        } else {
          logger.error('❌ Input no encontrado en el modal');
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

    // 🔧 FIX #32: Limpiar handler anterior antes de crear uno nuevo
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }

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
