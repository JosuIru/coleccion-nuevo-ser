// ============================================================================
// CHAPTER RESOURCES MODAL - Modal de recursos complementarios por capítulo
// ============================================================================

// 🔧 FIX v2.9.198: Migrated console.log to logger
class ChapterResourcesModal {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.i18n = window.i18n || new I18n();
    this.resourcesData = null;
    this.metadataData = null;
    this.currentChapterId = null;
    this.currentTab = 'all';
    this.favorites = this.loadFavorites();

    // 🔧 FIX: EventManager para gestión automática de listeners
    this.eventManager = new EventManager();
    this.eventManager.setComponentName('ChapterResourcesModal');
    this._eventListenersAttached = false;
  }

  /**
   * Carga recursos desde resources.json del libro actual
   */
  async loadResources() {
    const bookId = this.bookEngine.getCurrentBook();
    if (!bookId) return null;

    try {
      const response = await fetch(`books/${bookId}/assets/resources.json`);
      if (!response.ok) {
        // logger.warn(`No resources.json found for ${bookId}`);
        return null;
      }
      this.resourcesData = await response.json();
      return this.resourcesData;
    } catch (error) {
      // logger.warn(`Error loading resources for ${bookId}:`, error);
      return null;
    }
  }

  /**
   * Carga metadata desde chapter-metadata.json del libro actual
   */
  async loadMetadata() {
    const bookId = this.bookEngine.getCurrentBook();
    if (!bookId) return null;

    try {
      const response = await fetch(`books/${bookId}/assets/chapter-metadata.json`);
      if (!response.ok) {
        // logger.warn(`No chapter-metadata.json found for ${bookId}`);
        return null;
      }
      this.metadataData = await response.json();
      return this.metadataData;
    } catch (error) {
      // logger.warn(`Error loading metadata for ${bookId}:`, error);
      return null;
    }
  }

  /**
   * Abre modal con recursos filtrados por capítulo
   * FIX v2.9.234: Added loading state for async data
   */
  async open(chapterId) {
    this.currentChapterId = chapterId;

    // FIX v2.9.234: Show loading state while fetching data
    this.renderLoading();

    try {
      // Cargar recursos y metadata si no están cargados
      if (!this.resourcesData) {
        await this.loadResources();
      }
      if (!this.metadataData) {
        await this.loadMetadata();
      }

      // Si no hay recursos NI metadata, mostrar mensaje
      if (!this.resourcesData && !this.metadataData) {
        this.close();
        if (window.toast) {
          window.toast.info(this.i18n.t('resources.noResourcesAvailable') || 'No hay recursos disponibles para este libro');
        }
        return;
      }

      // Renderizar modal
      this.render();
      this.attachEventListeners();
    } catch (error) {
      logger.error('Error opening chapter resources:', error);
      this.close();
      window.toast?.error('Error al cargar recursos');
    }
  }

  /**
   * FIX v2.9.234: Loading state for async data
   */
  renderLoading() {
    this.close(); // Remove existing modal

    const html = `
      <div id="chapter-resources-modal" class="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div class="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-2xl p-8 border-2 border-amber-500/30 shadow-2xl">
          <div class="flex flex-col items-center gap-4">
            <div class="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
            <p class="text-gray-400">Cargando recursos...</p>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  /**
   * Obtiene recursos relacionados con el capítulo actual
   * Si no hay recursos específicos para el capítulo, devuelve todos los recursos del libro
   */
  getResourcesForChapter(chapterId) {
    if (!this.resourcesData) return null;

    // Filtrar recursos por capítulo
    const filtered = {
      organizations: (this.resourcesData.organizations || []).filter(
        org => org.relatedChapters && org.relatedChapters.includes(chapterId)
      ),
      books: (this.resourcesData.books || []).filter(
        book => book.relatedChapters && book.relatedChapters.includes(chapterId)
      ),
      tools: (this.resourcesData.tools || []).filter(
        tool => tool.relatedChapters && tool.relatedChapters.includes(chapterId)
      ),
      documentaries: (this.resourcesData.documentaries || []).filter(
        doc => doc.relatedChapters && doc.relatedChapters.includes(chapterId)
      ),
      podcasts: (this.resourcesData.podcasts || []).filter(
        pod => pod.relatedChapters && pod.relatedChapters.includes(chapterId)
      )
    };

    // Contar total de recursos filtrados
    const totalFiltered =
      filtered.organizations.length +
      filtered.books.length +
      filtered.tools.length +
      filtered.documentaries.length +
      filtered.podcasts.length;

    // Si no hay recursos específicos para este capítulo, devolver TODOS los recursos del libro
    if (totalFiltered === 0) {
      // logger.debug('[ChapterResourcesModal] No resources for this chapter, showing all book resources');
      return {
        organizations: this.resourcesData.organizations || [],
        books: this.resourcesData.books || [],
        tools: this.resourcesData.tools || [],
        documentaries: this.resourcesData.documentaries || [],
        podcasts: this.resourcesData.podcasts || []
      };
    }

    return filtered;
  }

  /**
   * Cuenta el número total de ejercicios y prácticas para el capítulo actual
   */
  getExercisesCount() {
    if (!this.metadataData || !this.currentChapterId) return 0;

    const metadata = this.metadataData[this.currentChapterId];
    if (!metadata) return 0;

    const exercisesCount = (metadata.relatedExercises || []).length;
    const practicesCount = (metadata.relatedPractices || []).length;

    return exercisesCount + practicesCount;
  }

  /**
   * Renderiza el modal
   */
  render() {
    const existing = document.getElementById('chapter-resources-modal');
    if (existing) existing.remove();

    const resources = this.getResourcesForChapter(this.currentChapterId);
    if (!resources) return;

    const totalCount =
      resources.organizations.length +
      resources.books.length +
      resources.tools.length +
      resources.documentaries.length +
      resources.podcasts.length;

    const html = `
      <div id="chapter-resources-modal" class="fixed inset-0 bg-black/90 flex items-center justify-center z-[10000] p-4 backdrop-blur-sm overflow-y-auto">
        <div class="bg-white dark:bg-gray-900 rounded-2xl max-w-6xl w-full border-2 border-cyan-500/30 shadow-2xl my-4 max-h-[90vh] flex flex-col">

          <!-- Header -->
          <div class="p-4 sm:p-6 border-b border-cyan-500/20 flex-shrink-0">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl sm:text-2xl font-bold flex items-center gap-3">
                  <span class="text-3xl">📚</span>
                  <span class="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    ${this.i18n.t('resources.title')}
                  </span>
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  ${totalCount} ${this.i18n.t('resources.resourcesAvailable')}
                </p>
              </div>
              <button id="close-resources-modal" class="hover:text-red-400 transition text-gray-700 dark:text-white" aria-label="Cerrar">
                ${Icons.close(28)}
              </button>
            </div>

            <!-- Tabs -->
            <div class="flex gap-2 mt-4 overflow-x-auto pb-2">
              ${this.renderTabs(resources)}
            </div>
          </div>

          <!-- Content -->
          <div class="p-4 sm:p-6 overflow-y-auto flex-1">
            <div id="resources-content">
              ${this.renderContent(resources)}
            </div>
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  /**
   * Renderiza las tabs de filtrado
   */
  renderTabs(resources) {
    // Contar ejercicios de metadata
    const exercisesCount = this.getExercisesCount();

    const tabs = [
      // Nueva tab de Ejercicios (solo si hay metadata)
      ...(exercisesCount > 0 ? [{ id: 'exercises', label: 'Ejercicios', icon: '✨', count: exercisesCount }] : []),
      { id: 'all', label: this.i18n.t('resources.all'), icon: '📚', count:
        resources.organizations.length + resources.books.length +
        resources.tools.length + resources.documentaries.length + resources.podcasts.length },
      { id: 'organizations', label: this.i18n.t('resources.organizations'), icon: '🏢', count: resources.organizations.length },
      { id: 'books', label: this.i18n.t('resources.books'), icon: '📖', count: resources.books.length },
      { id: 'tools', label: this.i18n.t('resources.tools'), icon: '🛠️', count: resources.tools.length },
      { id: 'documentaries', label: this.i18n.t('resources.documentaries'), icon: '🎬', count: resources.documentaries.length },
      { id: 'podcasts', label: this.i18n.t('resources.podcasts'), icon: '🎙️', count: resources.podcasts.length }
    ];

    return tabs
      .filter(tab => tab.count > 0 || tab.id === 'all')
      .map(tab => `
        <button
          class="tab-btn px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
            this.currentTab === tab.id
              ? 'bg-cyan-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
          }"
          data-tab="${tab.id}">
          ${tab.icon} ${tab.label} ${tab.count > 0 ? `(${tab.count})` : ''}
        </button>
      `).join('');
  }

  /**
   * Renderiza el contenido según la tab activa
   */
  renderContent(resources) {
    if (this.currentTab === 'exercises') {
      return this.renderExercisesTab();
    }

    if (this.currentTab === 'all') {
      return this.renderAllResources(resources);
    }

    const typeMap = {
      organizations: { data: resources.organizations, renderer: this.renderOrganizationCard.bind(this) },
      books: { data: resources.books, renderer: this.renderBookCard.bind(this) },
      tools: { data: resources.tools, renderer: this.renderToolCard.bind(this) },
      documentaries: { data: resources.documentaries, renderer: this.renderDocumentaryCard.bind(this) },
      podcasts: { data: resources.podcasts, renderer: this.renderPodcastCard.bind(this) }
    };

    const type = typeMap[this.currentTab];
    if (!type || type.data.length === 0) {
      return `
        <div class="text-center text-gray-500 dark:text-gray-400 py-12">
          <div class="text-6xl mb-4">🔍</div>
          <p>${this.i18n.t('resources.noResourcesInCategory')}</p>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${type.data.map(item => type.renderer(item)).join('')}
      </div>
    `;
  }

  /**
   * Renderiza todas las categorías
   */
  renderAllResources(resources) {
    let html = '';

    if (resources.organizations.length > 0) {
      html += `
        <div class="mb-8">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            🏢 ${this.i18n.t('resources.organizations')} (${resources.organizations.length})
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${resources.organizations.map(org => this.renderOrganizationCard(org)).join('')}
          </div>
        </div>
      `;
    }

    if (resources.books.length > 0) {
      html += `
        <div class="mb-8">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            📖 ${this.i18n.t('resources.books')} (${resources.books.length})
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${resources.books.map(book => this.renderBookCard(book)).join('')}
          </div>
        </div>
      `;
    }

    if (resources.tools.length > 0) {
      html += `
        <div class="mb-8">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            🛠️ ${this.i18n.t('resources.tools')} (${resources.tools.length})
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${resources.tools.map(tool => this.renderToolCard(tool)).join('')}
          </div>
        </div>
      `;
    }

    if (resources.documentaries.length > 0) {
      html += `
        <div class="mb-8">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            🎬 ${this.i18n.t('resources.documentaries')} (${resources.documentaries.length})
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${resources.documentaries.map(doc => this.renderDocumentaryCard(doc)).join('')}
          </div>
        </div>
      `;
    }

    if (resources.podcasts.length > 0) {
      html += `
        <div class="mb-8">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            🎙️ ${this.i18n.t('resources.podcasts')} (${resources.podcasts.length})
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${resources.podcasts.map(pod => this.renderPodcastCard(pod)).join('')}
          </div>
        </div>
      `;
    }

    return html || `
      <div class="text-center text-gray-500 dark:text-gray-400 py-12">
        <div class="text-6xl mb-4">🔍</div>
        <p>${this.i18n.t('resources.noResourcesForChapter')}</p>
      </div>
    `;
  }

  /**
   * Renderiza la tab de Ejercicios (metadata)
   */
  renderExercisesTab() {
    if (!this.metadataData || !this.currentChapterId) {
      return `
        <div class="text-center text-gray-500 dark:text-gray-400 py-12">
          <div class="text-6xl mb-4">✨</div>
          <p>No hay ejercicios disponibles para este capítulo</p>
        </div>
      `;
    }

    const metadata = this.metadataData[this.currentChapterId];
    if (!metadata) {
      return `
        <div class="text-center text-gray-500 dark:text-gray-400 py-12">
          <div class="text-6xl mb-4">✨</div>
          <p>No hay ejercicios disponibles para este capítulo</p>
        </div>
      `;
    }

    let html = '';

    // Información del capítulo
    if (metadata.estimatedTime) {
      html += `
        <div class="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-blue-500/30 mb-6">
          <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
            ${Icons.clock(24)} Tiempo Estimado
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            ${metadata.estimatedTime.reading ? `
              <div class="text-center">
                <div class="text-2xl mb-1">${Icons.book(24)}</div>
                <div class="text-gray-400">Lectura</div>
                <div class="font-bold">${metadata.estimatedTime.reading}</div>
              </div>
            ` : ''}
            ${metadata.estimatedTime.exercises ? `
              <div class="text-center">
                <div class="text-2xl mb-1">${Icons.sparkles(24)}</div>
                <div class="text-gray-400">Ejercicios</div>
                <div class="font-bold">${metadata.estimatedTime.exercises}</div>
              </div>
            ` : ''}
            ${metadata.estimatedTime.practices ? `
              <div class="text-center">
                <div class="text-2xl mb-1">${Icons.target(24)}</div>
                <div class="text-gray-400">Prácticas</div>
                <div class="font-bold">${metadata.estimatedTime.practices}</div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    // Ejercicios del Manual Práctico
    if (metadata.relatedExercises && metadata.relatedExercises.length > 0) {
      html += `
        <div class="mb-8">
          <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
            ${Icons.sparkles(24)} Ejercicios del Manual Práctico (${metadata.relatedExercises.length})
          </h3>
          <div class="space-y-4">
            ${metadata.relatedExercises.map(exercise => this.renderExerciseCard(exercise)).join('')}
          </div>
        </div>
      `;
    }

    // Prácticas Radicales
    if (metadata.relatedPractices && metadata.relatedPractices.length > 0) {
      html += `
        <div class="mb-8">
          <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
            ${Icons.zap(24)} Prácticas Radicales (${metadata.relatedPractices.length})
          </h3>
          <div class="space-y-4">
            ${metadata.relatedPractices.map(practice => this.renderPracticeCard(practice)).join('')}
          </div>
        </div>
      `;
    }

    return html;
  }

  /**
   * Renderiza card de ejercicio
   */
  renderExerciseCard(exercise) {
    const priorityColors = {
      recommended: 'border-green-500/50 bg-green-900/10 dark:bg-green-900/20',
      optional: 'border-gray-500/30 bg-gray-100 dark:bg-gray-800/50',
      advanced: 'border-amber-500/50 bg-amber-900/10 dark:bg-amber-900/20'
    };

    const priorityLabels = {
      recommended: '⭐ Recomendado',
      optional: 'Opcional',
      advanced: '🔥 Avanzado'
    };

    return `
      <div class="exercise-card bg-gray-50 dark:bg-gray-800/80 border ${priorityColors[exercise.priority] || priorityColors.optional} rounded-lg p-5 hover:shadow-lg transition">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="text-3xl">${Icons[exercise.icon] ? Icons[exercise.icon](28) : '✨'}</div>
            <div>
              <h4 class="font-bold text-lg text-gray-900 dark:text-gray-100">${exercise.title}</h4>
              <div class="flex items-center gap-3 mt-1">
                <span class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  ${Icons.clock(14)} ${exercise.duration}
                </span>
                <span class="text-xs px-2 py-1 rounded ${priorityColors[exercise.priority] || priorityColors.optional} text-gray-600 dark:text-gray-200">
                  ${priorityLabels[exercise.priority] || 'Opcional'}
                </span>
              </div>
            </div>
          </div>
        </div>
        ${exercise.reason ? `
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <strong>¿Por qué?</strong> ${exercise.reason}
          </p>
        ` : ''}
        <button
          class="btn-primary w-full flex items-center justify-center gap-2"
          onclick="window.bookReader.navigateToExercise('${exercise.book}', '${exercise.exerciseId}')">
          Ir al Ejercicio ${Icons.chevronRight(16)}
        </button>
      </div>
    `;
  }

  /**
   * Renderiza card de práctica radical
   */
  renderPracticeCard(practice) {
    const priorityColors = {
      recommended: 'border-purple-500/50 bg-purple-900/10 dark:bg-purple-900/20',
      optional: 'border-gray-500/30 bg-gray-100 dark:bg-gray-800/50',
      advanced: 'border-red-500/50 bg-red-900/10 dark:bg-red-900/20'
    };

    const priorityLabels = {
      recommended: '⭐ Recomendado',
      optional: 'Opcional',
      advanced: '🔥 Avanzado'
    };

    return `
      <div class="practice-card bg-gray-50 dark:bg-gray-800/80 border ${priorityColors[practice.priority] || priorityColors.optional} rounded-lg p-5 hover:shadow-lg transition">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="text-3xl">${Icons[practice.icon] ? Icons[practice.icon](28) : '⚡'}</div>
            <div>
              <h4 class="font-bold text-lg text-gray-900 dark:text-gray-100">${practice.title}</h4>
              <span class="text-xs px-2 py-1 rounded ${priorityColors[practice.priority] || priorityColors.optional} text-gray-600 dark:text-gray-200">
                ${priorityLabels[practice.priority] || 'Opcional'}
              </span>
            </div>
          </div>
        </div>
        ${practice.reason ? `
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <strong>¿Por qué?</strong> ${practice.reason}
          </p>
        ` : ''}
        <button
          class="btn-primary w-full flex items-center justify-center gap-2"
          onclick="window.bookReader.navigateToPractice('${practice.book}', '${practice.practiceId}')">
          Ir a la Práctica ${Icons.chevronRight(16)}
        </button>
      </div>
    `;
  }

  /**
   * Renderiza card de organización
   */
  renderOrganizationCard(org) {
    const isFavorite = this.isFavorite('org', org.id);

    return `
      <div class="resource-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-cyan-500 transition">
        <div class="flex items-start justify-between mb-2">
          <div class="flex-1">
            <h4 class="font-bold text-lg text-gray-900 dark:text-white">${org.name}</h4>
            <div class="flex flex-wrap gap-1 mt-1">
              <span class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">${org.type}</span>
              ${org.location ? `<span class="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200 rounded">${org.location}</span>` : ''}
            </div>
          </div>
          <button
            class="favorite-btn text-2xl hover:scale-110 transition"
            data-type="org"
            data-id="${org.id}"
            title="${isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
            ${isFavorite ? '⭐' : '☆'}
          </button>
        </div>

        <p class="text-sm text-gray-600 dark:text-gray-200 mb-3">${org.description}</p>

        ${org.focus && org.focus.length > 0 ? `
          <div class="flex flex-wrap gap-1 mb-3">
            ${org.focus.slice(0, 4).map(f => `
              <span class="text-xs px-2 py-1 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 rounded">${f}</span>
            `).join('')}
            ${org.focus.length > 4 ? `<span class="text-xs px-2 py-1 text-gray-500">+${org.focus.length - 4}</span>` : ''}
          </div>
        ` : ''}

        <div class="flex gap-2">
          ${org.website ? `
            <a href="${org.website}" target="_blank" rel="noopener"
               class="flex-1 px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition text-center">
              🌐 ${this.i18n.t('resources.visitWebsite')}
            </a>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Renderiza card de libro
   */
  renderBookCard(book) {
    const isFavorite = this.isFavorite('book', book.id);

    return `
      <div class="resource-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-cyan-500 transition">
        <div class="flex items-start justify-between mb-2">
          <div class="flex-1">
            <h4 class="font-bold text-lg text-gray-900 dark:text-white">${book.title}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">${book.author} (${book.year})</p>
          </div>
          <button
            class="favorite-btn text-2xl hover:scale-110 transition"
            data-type="book"
            data-id="${book.id}"
            title="${isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
            ${isFavorite ? '⭐' : '☆'}
          </button>
        </div>

        <p class="text-sm text-gray-600 dark:text-gray-200 mb-2">${book.description}</p>

        ${book.why ? `
          <div class="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-3 mb-3 text-sm">
            <p class="font-semibold text-amber-800 dark:text-amber-300">💡 ${this.i18n.t('resources.whyRead')}:</p>
            <p class="text-amber-700 dark:text-amber-200">${book.why}</p>
          </div>
        ` : ''}

        ${book.link ? `
          <a href="${book.link}" target="_blank" rel="noopener"
             class="block px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition text-center">
            🔗 ${this.i18n.t('resources.readOnline')}
          </a>
        ` : ''}
      </div>
    `;
  }

  /**
   * Renderiza card de herramienta
   */
  renderToolCard(tool) {
    const isFavorite = this.isFavorite('tool', tool.id);

    return `
      <div class="resource-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-cyan-500 transition">
        <div class="flex items-start justify-between mb-2">
          <div class="flex-1">
            <h4 class="font-bold text-lg text-gray-900 dark:text-white">${tool.name}</h4>
            <span class="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">${tool.type}</span>
          </div>
          <button
            class="favorite-btn text-2xl hover:scale-110 transition"
            data-type="tool"
            data-id="${tool.id}"
            title="${isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
            ${isFavorite ? '⭐' : '☆'}
          </button>
        </div>

        <p class="text-sm text-gray-600 dark:text-gray-200 mb-3">${tool.description}</p>

        ${tool.use ? `
          <div class="bg-blue-50 dark:bg-blue-900/20 p-3 mb-3 rounded text-sm">
            <p class="font-semibold text-blue-800 dark:text-blue-300">🎯 ${this.i18n.t('resources.useFor')}:</p>
            <p class="text-blue-700 dark:text-blue-200">${tool.use}</p>
          </div>
        ` : ''}

        <a href="${tool.website}" target="_blank" rel="noopener"
           class="block px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition text-center">
          🚀 ${this.i18n.t('resources.tryTool')}
        </a>
      </div>
    `;
  }

  /**
   * Renderiza card de documental
   */
  renderDocumentaryCard(doc) {
    const isFavorite = this.isFavorite('doc', doc.id);

    return `
      <div class="resource-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-cyan-500 transition">
        <div class="flex items-start justify-between mb-2">
          <div class="flex-1">
            <h4 class="font-bold text-lg text-gray-900 dark:text-white">${doc.title}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400">${doc.year} · ${doc.platform}</p>
          </div>
          <button
            class="favorite-btn text-2xl hover:scale-110 transition"
            data-type="doc"
            data-id="${doc.id}"
            title="${isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
            ${isFavorite ? '⭐' : '☆'}
          </button>
        </div>

        <p class="text-sm text-gray-600 dark:text-gray-200 mb-3">${doc.description}</p>

        ${doc.why ? `
          <div class="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-3 text-sm">
            <p class="font-semibold text-green-800 dark:text-green-300">🎬 ${this.i18n.t('resources.whyWatch')}:</p>
            <p class="text-green-700 dark:text-green-200">${doc.why}</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Renderiza card de podcast
   */
  renderPodcastCard(pod) {
    const isFavorite = this.isFavorite('podcast', pod.id);

    return `
      <div class="resource-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-cyan-500 transition">
        <div class="flex items-start justify-between mb-2">
          <div class="flex-1">
            <h4 class="font-bold text-lg text-gray-900 dark:text-white">${pod.name}</h4>
          </div>
          <button
            class="favorite-btn text-2xl hover:scale-110 transition"
            data-type="podcast"
            data-id="${pod.id}"
            title="${isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
            ${isFavorite ? '⭐' : '☆'}
          </button>
        </div>

        <p class="text-sm text-gray-600 dark:text-gray-200 mb-3">${pod.description}</p>

        <a href="${pod.website}" target="_blank" rel="noopener"
           class="block px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition text-center">
          🎙️ ${this.i18n.t('resources.listen')}
        </a>
      </div>
    `;
  }

  /**
   * Gestión de favoritos
   */
  isFavorite(type, id) {
    return this.favorites[type]?.includes(id) || false;
  }

  toggleFavorite(type, id) {
    if (!this.favorites[type]) {
      this.favorites[type] = [];
    }

    const index = this.favorites[type].indexOf(id);
    if (index > -1) {
      this.favorites[type].splice(index, 1);
    } else {
      this.favorites[type].push(id);
    }

    this.saveFavorites();
  }

  loadFavorites() {
    try {
      const stored = localStorage.getItem('resources-favorites');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  saveFavorites() {
    localStorage.setItem('resources-favorites', JSON.stringify(this.favorites));
  }

  /**
   * Event listeners
   */
  attachEventListeners() {
    // 🔧 FIX: Protección contra re-attach múltiple
    if (this._eventListenersAttached) {
      logger.warn('[ChapterResourcesModal] Listeners already attached, skipping');
      return;
    }

    // Close button
    const closeBtn = document.getElementById('close-resources-modal');
    if (closeBtn) {
      this.eventManager.addEventListener(closeBtn, 'click', () => {
        this.close();
      });
    }

    // Tab buttons
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', (e) => {
        this.currentTab = e.currentTarget.dataset.tab;
        const resources = this.getResourcesForChapter(this.currentChapterId);
        document.getElementById('resources-content').innerHTML = this.renderContent(resources);

        // Update active tab styling
        document.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.remove('bg-cyan-500', 'text-white');
          b.classList.add('bg-gray-100', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300');
        });
        e.currentTarget.classList.remove('bg-gray-100', 'dark:bg-gray-800', 'text-gray-700', 'dark:text-gray-300');
        e.currentTarget.classList.add('bg-cyan-500', 'text-white');

        // Re-attach favorite listeners
        this.attachFavoriteListeners();
      });
    });

    // Favorite buttons
    this.attachFavoriteListeners();

    // Close on backdrop click
    const modal = document.getElementById('chapter-resources-modal');
    if (modal) {
      this.eventManager.addEventListener(modal, 'click', (e) => {
        if (e.target.id === 'chapter-resources-modal') {
          this.close();
        }
      });
    }

    // 🔧 FIX: ESC to close usando EventManager
    const handleEscape = (e) => {
      if (e.key === 'Escape') this.close();
    };
    this.eventManager.addEventListener(document, 'keydown', handleEscape);

    this._eventListenersAttached = true;
  }

  attachFavoriteListeners() {
    const favBtns = document.querySelectorAll('.favorite-btn');
    favBtns.forEach(btn => {
      this.eventManager.addEventListener(btn, 'click', (e) => {
        e.preventDefault();
        const type = btn.dataset.type;
        const id = btn.dataset.id;
        this.toggleFavorite(type, id);

        // Update button
        const isFavorite = this.isFavorite(type, id);
        btn.textContent = isFavorite ? '⭐' : '☆';
        btn.title = isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos';

        // Show feedback
        window.toast?.success(
          isFavorite
            ? this.i18n.t('resources.addedToFavorites')
            : this.i18n.t('resources.removedFromFavorites')
        );
      });
    });
  }

  /**
   * Cierra el modal
   */
  close() {
    // 🔧 FIX: Cleanup de event listeners ANTES de remover
    if (this.eventManager) {
      this.eventManager.cleanup();
    }
    this._eventListenersAttached = false;

    const modal = document.getElementById('chapter-resources-modal');
    if (modal) modal.remove();
  }
}

// Exportar globalmente
window.ChapterResourcesModal = ChapterResourcesModal;

// 🔧 v2.9.325: Auto-instanciar para que funcione el botón
window.chapterResourcesModal = new ChapterResourcesModal();
