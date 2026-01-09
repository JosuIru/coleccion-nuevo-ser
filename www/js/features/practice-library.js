// ============================================================================
// BIBLIOTECA DE PRÁCTICAS
// ============================================================================
// Sistema centralizado para acceder a todos los ejercicios, meditaciones
// y prácticas de toda la colección de forma rápida y componible
// ============================================================================

// 🔧 FIX v2.9.198: Migrated console.log to logger
class PracticeLibrary {
  constructor() {
    this.practices = [];
    this.filters = {
      type: 'all',       // all, meditation, reflection, action, physical
      difficulty: 'all', // all, básico, intermedio, avanzado
      duration: 'all',   // all, short (<15min), medium (15-30min), long (30-60min), verylong (>60min)
      book: 'all',
      theme: 'all'       // all, mindfulness, ecology, activism, community, etc.
    };
    this.isOpen = false;
  }

  // ==========================================================================
  // CARGA DE PRÁCTICAS
  // ==========================================================================

  async loadAllPractices() {
    try {
      // logger.debug('📚 Loading all practices from library...');

      // 🔧 FIX v2.9.234: Usar SafeFetch con validación de respuesta
      let catalog;
      if (window.SafeFetch) {
        catalog = await window.SafeFetch.json('books/catalog.json', { showToast: false });
      } else {
        const response = await fetch('books/catalog.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        catalog = await response.json();
      }

      this.practices = [];

      // Recorrer todos los libros
      for (const book of catalog.books) {
        try {
          // 🔧 FIX v2.9.234: Usar SafeFetch con validación
          let bookData;
          if (window.SafeFetch) {
            bookData = await window.SafeFetch.jsonWithFallback(`books/${book.id}/book.json`, null, { showToast: false });
            if (!bookData) continue;
          } else {
            const bookResponse = await fetch(`books/${book.id}/book.json`);
            if (!bookResponse.ok) continue;
            bookData = await bookResponse.json();
          }

          // Cargar metadata si existe
          let metadata = {};
          try {
            const metadataResponse = await fetch(`books/${book.id}/assets/chapter-metadata.json`);
            metadata = await metadataResponse.json();
          } catch (e) {
            // logger.debug(`No metadata for ${book.id}`);
          }

          // Extraer ejercicios de cada sección/capítulo
          if (bookData.sections) {
            for (const section of bookData.sections) {
              if (section.chapters) {
                for (const chapter of section.chapters) {
                  // Obtener metadata del capítulo
                  const chapterMeta = metadata[chapter.id] || {};

                  // Si el capítulo tiene ejercicios, añadirlos
                  if (chapter.exercises && chapter.exercises.length > 0) {
                    for (const exercise of chapter.exercises) {
                      this.practices.push({
                        id: `${book.id}-${chapter.id}-${exercise.id}`,
                        title: exercise.title,
                        description: exercise.description || '',
                        duration: exercise.duration || '15-30 min',
                        steps: exercise.steps || [],
                        reflection: exercise.reflection || '',
                        type: this.inferType(exercise, chapterMeta),
                        difficulty: chapterMeta.difficulty || 'intermedio',
                        book: {
                          id: book.id,
                          title: book.title,
                          cover: book.coverImage
                        },
                        chapter: {
                          id: chapter.id,
                          title: chapter.title
                        },
                        section: {
                          id: section.id,
                          title: section.title
                        },
                        tags: chapterMeta.tags || [],
                        practicalUses: chapterMeta.practicalUses || [],
                        readingTime: chapterMeta.readingTime || 15
                      });
                    }
                  }

                  // Si el capítulo completo es de tipo práctica (libros como Manual Práctico)
                  if (chapterMeta.type === 'práctica' || chapterMeta.type === 'teoría-práctica') {
                    // Si no tiene ejercicios explícitos pero es un capítulo práctico, añadir el capítulo completo
                    if (!chapter.exercises || chapter.exercises.length === 0) {
                      this.practices.push({
                        id: `${book.id}-${chapter.id}-full`,
                        title: chapter.title,
                        description: this.extractDescription(chapter.content),
                        duration: `${chapterMeta.readingTime || 20} min`,
                        steps: [],
                        reflection: '',
                        type: this.inferTypeFromMeta(chapterMeta),
                        difficulty: chapterMeta.difficulty || 'intermedio',
                        book: {
                          id: book.id,
                          title: book.title,
                          cover: book.coverImage
                        },
                        chapter: {
                          id: chapter.id,
                          title: chapter.title
                        },
                        section: {
                          id: section.id,
                          title: section.title
                        },
                        tags: chapterMeta.tags || [],
                        practicalUses: chapterMeta.practicalUses || [],
                        readingTime: chapterMeta.readingTime || 20,
                        isFullChapter: true
                      });
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          logger.error(`Error loading practices from ${book.id}:`, error);
        }
      }

      // logger.debug(`✅ Loaded ${this.practices.length} practices from ${catalog.books.length} books`);
      return this.practices;

    } catch (error) {
      logger.error('Error loading practice library:', error);
      return [];
    }
  }

  // ==========================================================================
  // HELPERS DE EXTRACCIÓN
  // ==========================================================================

  extractDescription(content) {
    if (!content) return '';

    // Extraer primer párrafo del contenido
    const paragraphs = content.split('\n\n');
    let firstPara = paragraphs[0] || '';

    // Limpiar markdown básico
    firstPara = firstPara.replace(/^#+\s+/, ''); // Headers
    firstPara = firstPara.replace(/\*\*/g, ''); // Bold
    firstPara = firstPara.replace(/\*/g, ''); // Italic

    // Limitar longitud
    if (firstPara.length > 200) {
      firstPara = firstPara.substring(0, 197) + '...';
    }

    return firstPara;
  }

  inferType(exercise, metadata) {
    const title = exercise.title.toLowerCase();
    const tags = metadata.tags || [];

    // Meditación
    if (title.includes('meditación') || title.includes('meditation') ||
        tags.includes('meditación') || tags.includes('mindfulness')) {
      return 'meditation';
    }

    // Reflexión
    if (title.includes('reflexión') || title.includes('reflection') ||
        title.includes('diario') || title.includes('journal') ||
        tags.includes('reflexión') || tags.includes('introspección')) {
      return 'reflection';
    }

    // Físico
    if (title.includes('caminar') || title.includes('respiración') ||
        title.includes('cuerpo') || title.includes('sit spot') ||
        tags.includes('movimiento') || tags.includes('naturaleza')) {
      return 'physical';
    }

    // Acción
    if (title.includes('acción') || title.includes('crear') ||
        title.includes('organizar') || title.includes('comunidad') ||
        tags.includes('activismo') || tags.includes('comunidad')) {
      return 'action';
    }

    return 'reflection'; // Default
  }

  inferTypeFromMeta(metadata) {
    const tags = metadata.tags || [];
    const practicalUses = metadata.practicalUses || [];

    if (tags.includes('meditación') || tags.includes('mindfulness')) return 'meditation';
    if (tags.includes('activismo') || practicalUses.includes('crear-comunidad')) return 'action';
    if (tags.includes('naturaleza') || practicalUses.includes('sit-spot')) return 'physical';

    return 'reflection';
  }

  // ==========================================================================
  // FILTRADO
  // ==========================================================================

  filterPractices(customFilters = null) {
    const filters = customFilters || this.filters;

    return this.practices.filter(practice => {
      // Filtro por tipo
      if (filters.type !== 'all' && practice.type !== filters.type) {
        return false;
      }

      // Filtro por dificultad
      if (filters.difficulty !== 'all' && practice.difficulty !== filters.difficulty) {
        return false;
      }

      // Filtro por duración
      if (filters.duration !== 'all') {
        const durationMin = this.parseDuration(practice.duration);

        if (filters.duration === 'short' && durationMin > 15) return false;
        if (filters.duration === 'medium' && (durationMin < 15 || durationMin > 30)) return false;
        if (filters.duration === 'long' && (durationMin < 30 || durationMin > 60)) return false;
        if (filters.duration === 'verylong' && durationMin <= 60) return false;
      }

      // Filtro por libro
      if (filters.book !== 'all' && practice.book.id !== filters.book) {
        return false;
      }

      // Filtro por tema
      if (filters.theme !== 'all') {
        const hasTheme = practice.tags.includes(filters.theme) ||
                        practice.practicalUses.includes(filters.theme);
        if (!hasTheme) return false;
      }

      return true;
    });
  }

  parseDuration(durationString) {
    // Extraer número de la duración (ej: "15-30 min" -> 15)
    const match = durationString.match(/(\d+)/);
    return match ? parseInt(match[1]) : 20;
  }

  // ==========================================================================
  // BÚSQUEDA
  // ==========================================================================

  searchPractices(query) {
    if (!query || query.trim() === '') {
      return this.filterPractices();
    }

    query = query.toLowerCase();

    return this.filterPractices().filter(practice => {
      const searchableText = `
        ${practice.title}
        ${practice.description}
        ${practice.tags.join(' ')}
        ${practice.book.title}
        ${practice.chapter.title}
      `.toLowerCase();

      return searchableText.includes(query);
    });
  }

  // ==========================================================================
  // UI - MODAL
  // ==========================================================================

  open() {
    if (this.isOpen) return;
    this.isOpen = true;

    // Cargar prácticas si no están cargadas
    if (this.practices.length === 0) {
      // 🔧 FIX v2.9.197: Added error handling to prevent silent failures
      this.loadAllPractices().then(() => {
        this.render();
      }).catch(error => {
        logger.error('Error loading practices:', error);
        window.toast?.error('Error al cargar prácticas. Intenta de nuevo.');
        this.close();
      });
    } else {
      this.render();
    }
  }

  close() {
    this.isOpen = false;
    const modal = document.getElementById('practice-library-modal');
    if (modal) {
      modal.remove();
    }
  }

  render() {
    // Eliminar modal existente si hay
    const existingModal = document.getElementById('practice-library-modal');
    if (existingModal) existingModal.remove();

    // Crear modal
    const modal = document.createElement('div');
    modal.id = 'practice-library-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4';

    // 🔧 FIX v2.9.265: Mobile-friendly layout
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-900 rounded-2xl md:rounded-2xl rounded-t-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] flex flex-col">
        <!-- Header - Compact for mobile -->
        <div class="p-3 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between mb-2 md:mb-4">
            <h2 class="text-xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 md:gap-3">
              🧘 <span class="hidden sm:inline">Biblioteca de </span>Prácticas
              <span class="text-xs md:text-sm font-normal text-gray-500 dark:text-gray-400">(${this.practices.length})</span>
            </h2>
            <button id="practice-library-close" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition p-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Tabs - Scrollable on mobile -->
          <div class="flex gap-1.5 md:gap-2 mb-3 md:mb-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            <button class="practice-type-tab active whitespace-nowrap text-sm md:text-base" data-type="all">
              Todas
            </button>
            <button class="practice-type-tab whitespace-nowrap text-sm md:text-base" data-type="meditation">
              🧘 <span class="hidden sm:inline">Meditaciones</span><span class="sm:hidden">Med.</span>
            </button>
            <button class="practice-type-tab whitespace-nowrap text-sm md:text-base" data-type="reflection">
              💭 <span class="hidden sm:inline">Reflexiones</span><span class="sm:hidden">Refl.</span>
            </button>
            <button class="practice-type-tab whitespace-nowrap text-sm md:text-base" data-type="action">
              🎯 <span class="hidden sm:inline">Acciones</span><span class="sm:hidden">Acc.</span>
            </button>
            <button class="practice-type-tab whitespace-nowrap text-sm md:text-base" data-type="physical">
              🌳 <span class="hidden sm:inline">Ejercicios Físicos</span><span class="sm:hidden">Físico</span>
            </button>
          </div>

          <!-- Learning Paths Integration - Collapsible on mobile -->
          <div class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-2.5 md:p-4 mb-3 md:mb-4 border border-purple-200 dark:border-purple-800">
            <div class="flex items-center justify-between gap-2">
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 dark:text-white text-sm md:text-base">🎯 ¿Camino estructurado?</h3>
                <p class="text-xs md:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">Rutas guiadas paso a paso</p>
              </div>
              <button id="open-learning-paths-from-library" class="px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm md:text-base font-semibold rounded-lg transition whitespace-nowrap flex-shrink-0">
                Paths →
              </button>
            </div>
          </div>

          <!-- Filters - Stack on mobile -->
          <div class="flex flex-col sm:flex-row gap-2 md:gap-3">
            <input type="text"
                   id="practice-search"
                   placeholder="Buscar práctica..."
                   class="w-full sm:flex-1 px-3 md:px-4 py-2 text-sm md:text-base bg-gray-100 dark:bg-gray-800 rounded-lg border-none focus:ring-2 focus:ring-blue-500 dark:text-white">

            <div class="flex gap-2">
              <select id="practice-difficulty-filter"
                      class="flex-1 sm:flex-none px-2 md:px-4 py-2 text-sm md:text-base bg-gray-100 dark:bg-gray-800 rounded-lg border-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                <option value="all">Dificultad</option>
                <option value="básico">Básico</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>

              <select id="practice-duration-filter"
                      class="flex-1 sm:flex-none px-2 md:px-4 py-2 text-sm md:text-base bg-gray-100 dark:bg-gray-800 rounded-lg border-none focus:ring-2 focus:ring-blue-500 dark:text-white">
                <option value="all">Duración</option>
                <option value="short">< 15 min</option>
                <option value="medium">15-30 min</option>
                <option value="long">30-60 min</option>
                <option value="verylong">> 60 min</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Content - Smaller padding on mobile -->
        <div id="practice-library-content" class="flex-1 overflow-y-auto p-3 md:p-6">
          ${this.renderPractices()}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachEventListeners();
    this.attachLearningPathsIntegration();
  }

  attachLearningPathsIntegration() {
    // Botón para abrir Learning Paths
    const openPathsBtn = document.getElementById('open-learning-paths-from-library');
    if (openPathsBtn) {
      openPathsBtn.addEventListener('click', () => {
        // Cerrar la biblioteca de prácticas
        this.close();

        // Abrir el selector de Learning Paths con el libro actual si hay uno seleccionado
        if (window.learningPaths) {
          const currentBookFilter = this.filters.book;
          const bookId = currentBookFilter !== 'all' ? currentBookFilter : null;

          if (bookId) {
            window.learningPaths.open(bookId);
          } else {
            // Si no hay libro específico, mostrar mensaje informativo
            window.toast?.info('Selecciona un libro para ver sus Learning Paths');

            // Abrir biblioteca para que seleccione un libro
            if (window.biblioteca) {
              window.biblioteca?.render();
            }
          }
        }
      });
    }
  }

  renderPractices() {
    const filteredPractices = this.filterPractices();

    if (filteredPractices.length === 0) {
      return `
        <div class="text-center py-12 text-gray-500 dark:text-gray-400">
          <p class="text-xl mb-2">No se encontraron prácticas</p>
          <p>Prueba a cambiar los filtros</p>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${filteredPractices.map(practice => this.renderPracticeCard(practice)).join('')}
      </div>
    `;
  }

  // 🔧 FIX v2.9.265: Mobile-friendly cards
  renderPracticeCard(practice) {
    const typeEmoji = {
      meditation: '🧘',
      reflection: '💭',
      action: '🎯',
      physical: '🌳'
    };

    const difficultyDots = {
      básico: '●○○',
      intermedio: '●●○',
      avanzado: '●●●'
    };

    return `
      <div class="practice-card bg-white dark:bg-gray-800 rounded-xl p-3 md:p-5 shadow-md hover:shadow-xl transition border border-gray-200 dark:border-gray-700">
        <!-- Header row: Icon + Title + Meta -->
        <div class="flex items-start gap-2 md:gap-3 mb-2">
          <div class="text-2xl md:text-3xl flex-shrink-0">${typeEmoji[practice.type] || '📖'}</div>
          <div class="flex-1 min-w-0">
            <h3 class="text-base md:text-lg font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
              ${practice.title}
            </h3>
            <div class="flex items-center gap-2 mt-1 text-xs md:text-sm text-gray-500 dark:text-gray-400">
              <span>⏱️ ${practice.duration}</span>
              <span title="Dificultad">${difficultyDots[practice.difficulty] || '●●○'}</span>
            </div>
          </div>
        </div>

        <!-- Book Badge - Compact -->
        <div class="mb-2">
          <span class="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full line-clamp-1">
            📚 ${practice.book.title}
          </span>
        </div>

        <!-- Description - Shorter on mobile -->
        <p class="text-xs md:text-sm text-gray-600 dark:text-gray-200 mb-3 line-clamp-2 md:line-clamp-3">
          ${practice.description}
        </p>

        <!-- Actions - Full width button on mobile -->
        <div class="flex gap-2">
          <button class="practice-do-now flex-1 px-3 md:px-4 py-2 text-sm md:text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition"
                  data-practice-id="${practice.id}"
                  data-book-id="${practice.book.id}"
                  data-section-id="${practice.section.id}"
                  data-chapter-id="${practice.chapter.id}">
            Hacer
          </button>
          <button class="practice-add-to-plan px-3 md:px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-semibold transition"
                  data-practice-id="${practice.id}"
                  title="Añadir a plan">
            +
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  attachEventListeners() {
    // Close button
    const closeBtn = document.getElementById('practice-library-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Close on backdrop click
    const modal = document.getElementById('practice-library-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.close();
      });
    }

    // Type tabs
    // 🔧 FIX v2.9.338: Usar currentTarget en vez de target para evitar que
    // el clic en spans internos rompa el filtrado
    const typeTabs = document.querySelectorAll('.practice-type-tab');
    typeTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        // Update active state
        typeTabs.forEach(t => t.classList.remove('active'));
        // 🔧 FIX: currentTarget es siempre el botón, no el span interno
        e.currentTarget.classList.add('active');

        // Update filter
        this.filters.type = e.currentTarget.dataset.type;
        this.updateContent();
      });
    });

    // Search input
    const searchInput = document.getElementById('practice-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.updateContent(e.target.value);
      });
    }

    // Difficulty filter
    const difficultyFilter = document.getElementById('practice-difficulty-filter');
    if (difficultyFilter) {
      difficultyFilter.addEventListener('change', (e) => {
        this.filters.difficulty = e.target.value;
        this.updateContent();
      });
    }

    // Duration filter
    const durationFilter = document.getElementById('practice-duration-filter');
    if (durationFilter) {
      durationFilter.addEventListener('change', (e) => {
        this.filters.duration = e.target.value;
        this.updateContent();
      });
    }

    // "Hacer ahora" buttons
    const doNowButtons = document.querySelectorAll('.practice-do-now');
    doNowButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const bookId = e.target.dataset.bookId;
        const sectionId = e.target.dataset.sectionId;
        const chapterId = e.target.dataset.chapterId;

        // Cerrar modal
        this.close();

        // Navegar al capítulo
        if (window.bookEngine) {
          window.bookEngine.loadBook(bookId, sectionId, chapterId);
        }
      });
    });

    // "Añadir a plan" buttons
    const addToPlanButtons = document.querySelectorAll('.practice-add-to-plan');
    addToPlanButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const practiceId = e.target.dataset.practiceId;
        this.addToPlan(practiceId);
      });
    });
  }

  updateContent(searchQuery = '') {
    const contentDiv = document.getElementById('practice-library-content');
    if (!contentDiv) return;

    if (searchQuery) {
      const results = this.searchPractices(searchQuery);
      contentDiv.innerHTML = this.renderSearchResults(results);
    } else {
      contentDiv.innerHTML = this.renderPractices();
    }

    // Re-attach event listeners for new content
    this.attachPracticeButtons();
  }

  renderSearchResults(practices) {
    if (practices.length === 0) {
      return `
        <div class="text-center py-12 text-gray-500 dark:text-gray-400">
          <p class="text-xl mb-2">No se encontraron prácticas</p>
          <p>Prueba con otros términos de búsqueda</p>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${practices.map(practice => this.renderPracticeCard(practice)).join('')}
      </div>
    `;
  }

  attachPracticeButtons() {
    // "Hacer ahora" buttons
    const doNowButtons = document.querySelectorAll('.practice-do-now');
    doNowButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const bookId = e.target.dataset.bookId;
        const sectionId = e.target.dataset.sectionId;
        const chapterId = e.target.dataset.chapterId;

        // Cerrar modal
        this.close();

        // Navegar al capítulo
        if (window.bookEngine) {
          window.bookEngine.loadBook(bookId, sectionId, chapterId);
        }
      });
    });

    // "Añadir a plan" buttons
    const addToPlanButtons = document.querySelectorAll('.practice-add-to-plan');
    addToPlanButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const practiceId = e.target.dataset.practiceId;
        this.addToPlan(practiceId);
      });
    });
  }

  // ==========================================================================
  // INTEGRACIÓN CON ACTION PLANS
  // ==========================================================================

  addToPlan(practiceId) {
    const practice = this.practices.find(p => p.id === practiceId);
    if (!practice) return;

    // Obtener plan actual de localStorage
    let actionPlan = [];
    try {
      actionPlan = JSON.parse(localStorage.getItem('user_action_plan') || '[]');
    } catch (e) {
      actionPlan = [];
    }

    // Verificar si ya está en el plan
    if (actionPlan.some(p => p.id === practiceId)) {
      if (window.Toast) {
        window.Toast.show(`"${practice.title}" ya está en tu plan`, 'info');
      }
      return;
    }

    // Agregar al plan
    actionPlan.push({
      id: practice.id,
      title: practice.title,
      duration: practice.duration,
      type: practice.type || 'practice',
      source: 'practice-library',
      addedAt: new Date().toISOString(),
      completed: false
    });

    // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
    try {
      // Guardar en localStorage
      localStorage.setItem('user_action_plan', JSON.stringify(actionPlan));

      // Integrar con action-plans.js si está disponible
      if (window.actionPlans && typeof window.actionPlans.addPractice === 'function') {
        window.actionPlans.addPractice(practice);
      }

      // Mostrar confirmación
      if (window.Toast) {
        window.Toast.show(`"${practice.title}" añadido a tu plan (${actionPlan.length} prácticas)`, 'success');
      } else if (window.showToast) {
        window.showToast(`"${practice.title}" añadido a tu plan`, 'success');
      }
    } catch (error) {
      logger.error('Error guardando práctica en plan de acción:', error);
      window.toast?.error('Error al guardar la práctica. Intenta de nuevo.');
    }
  }

  /**
   * Obtener plan de acción actual
   */
  getActionPlan() {
    try {
      return JSON.parse(localStorage.getItem('user_action_plan') || '[]');
    } catch (e) {
      return [];
    }
  }

  /**
   * Limpiar plan de acción
   */
  clearActionPlan() {
    localStorage.removeItem('user_action_plan');
  }
}

// ==========================================================================
// ESTILOS CSS
// ==========================================================================

const practiceLibraryStyles = `
<style>
  .practice-type-tab {
    padding: 0.5rem 1rem;
    background: #f3f4f6;
    color: #4b5563;
    border-radius: 0.5rem;
    font-weight: 600;
    transition: all 0.2s;
    border: 2px solid transparent;
  }

  .dark .practice-type-tab {
    background: #374151;
    color: #9ca3af;
  }

  .practice-type-tab:hover {
    background: #e5e7eb;
  }

  .dark .practice-type-tab:hover {
    background: #4b5563;
  }

  .practice-type-tab.active {
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white;
    border-color: #3b82f6;
  }

  .practice-card {
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .practice-card:hover {
    transform: translateY(-4px);
  }

  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
`;

// Inyectar estilos
if (!document.getElementById('practice-library-styles')) {
  const styleElement = document.createElement('div');
  styleElement.id = 'practice-library-styles';
  styleElement.innerHTML = practiceLibraryStyles;
  document.head.appendChild(styleElement);
}

// ==========================================================================
// INICIALIZACIÓN GLOBAL
// ==========================================================================

// Crear instancia global
window.practiceLibrary = new PracticeLibrary();

// logger.debug('✅ Practice Library initialized');
