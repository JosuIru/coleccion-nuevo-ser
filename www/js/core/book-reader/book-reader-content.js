// ============================================================================
// BOOK READER CONTENT - Renderizado de contenido de capítulos
// ============================================================================
// v2.9.279: Modularización del BookReader
// Responsable de renderizar el contenido principal de cada capítulo

class BookReaderContent {
  constructor(bookReader) {
    this.bookReader = bookReader;
  }

  // ==========================================================================
  // ACCESSORS (para acceso más limpio a propiedades del bookReader)
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

  // ==========================================================================
  // DEPENDENCY INJECTION
  // ==========================================================================

  /**
   * Acceso seguro a dependencias globales
   */
  getDependency(name) {
    if (window.dependencyInjector) {
      return window.dependencyInjector.getSafe(name);
    }
    return window[name] || null;
  }

  // ==========================================================================
  // STRING HELPERS
  // ==========================================================================

  /**
   * Acortar título de capítulo para navegación móvil
   * @param {string} title - Título completo del capítulo
   * @param {number} maxLength - Longitud máxima (default: 35 para móvil)
   * @returns {string} - Título acortado con elipsis si es necesario
   */
  shortenChapterTitle(title, maxLength = 35) {
    if (!title) return '';
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength).trim() + '...';
  }

  // ==========================================================================
  // MAIN CONTENT RENDERING
  // ==========================================================================

  /**
   * Renderiza el contenido completo de un capítulo
   * @returns {string} HTML del capítulo
   */
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
    // 🔧 FIX v2.9.266: prose-invert solo en dark mode
    html += `<div class="content prose dark:prose-invert max-w-none overflow-x-hidden break-words prose-slate">`;
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
    const aiSuggestions = this.getDependency('aiSuggestions'); // 🔧 FIX #87
    if (aiSuggestions) {
      const bookId = this.bookEngine.getCurrentBook();
      html += aiSuggestions.render(bookId, this.currentChapter.id);
    }

    // Botón de marcar capítulo como leído
    html += this.renderMarkAsReadButton();

    // Action cards al final del capítulo
    html += this.renderActionCards();

    html += '</div>';

    return html;
  }

  // ==========================================================================
  // CONTEXTUAL PRACTICE BANNER
  // ==========================================================================

  /**
   * Renderiza un banner contextual de práctica
   * Aparece sutilmente cuando el capítulo tiene ejercicios o práctica asociada
   * @returns {string} HTML del banner
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
          <button class="action-btn" onclick="window.bookReader?.scrollToElement('.exercises-section')">
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
          <button class="action-btn" onclick="window.bookReader?.scrollToElement('.linked-exercise')">
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

  // ==========================================================================
  // ACTION CARDS
  // ==========================================================================

  /**
   * Renderiza las tarjetas de acción al final del capítulo
   * @returns {string} HTML de las action cards
   */
  renderActionCards() {
    const bookId = this.bookEngine.getCurrentBook();
    const chapterId = this.currentChapter && this.currentChapter.id;
    if (!bookId || !chapterId) return '';

    // Verificar qué features están disponibles
    const bookConfig = this.bookEngine.getCurrentBookConfig();
    const InteractiveQuiz = this.getDependency('InteractiveQuiz'); // 🔧 FIX #87
    const hasQuiz = InteractiveQuiz && this.currentChapter && this.currentChapter.quiz;
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

  // ==========================================================================
  // MARK AS READ BUTTON
  // ==========================================================================

  /**
   * Renderiza el botón de marcar capítulo como leído
   * @returns {string} HTML del botón
   */
  renderMarkAsReadButton() {
    const Icons = this.getDependency('Icons');
    const isRead = this.bookEngine.isChapterRead(this.currentChapter?.id);

    return `
      <div class="mark-read-section mt-12 pt-8 border-t border-gray-200 dark:border-gray-700/50 text-center">
        <button id="mark-chapter-read-btn"
                class="inline-flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 ${
                  isRead
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-400 dark:border-green-500/30 hover:bg-green-200 dark:hover:bg-green-900/50'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-cyan-500'
                }">
          ${Icons ? (isRead ? Icons.checkCircle(22) : Icons.circle(22)) : (isRead ? '✓' : '○')}
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

  // ==========================================================================
  // FOOTER NAVIGATION
  // ==========================================================================

  /**
   * Renderiza la navegación del footer (anterior/siguiente capítulo)
   * @returns {string} HTML del footer de navegación
   */
  renderFooterNav() {
    if (typeof logger !== 'undefined') {
      logger.debug('🔍 [DEBUG] renderFooterNav() llamado para capítulo:', this.currentChapter?.id);
    }
    const Icons = this.getDependency('Icons');
    const prevChapter = this.bookEngine.getPreviousChapter(this.currentChapter?.id);
    const nextChapter = this.bookEngine.getNextChapter(this.currentChapter?.id);
    if (typeof logger !== 'undefined') {
      logger.debug('🔍 [DEBUG] prevChapter:', prevChapter?.id, prevChapter?.title);
      logger.debug('🔍 [DEBUG] nextChapter:', nextChapter?.id, nextChapter?.title);
    }

    const chevronLeft = Icons?.chevronLeft?.(16) || '←';
    const chevronRight = Icons?.chevronRight?.(16) || '→';

    return `
      <div class="footer-nav border-t border-gray-200 dark:border-slate-700/50 bg-gradient-to-r from-gray-100/90 dark:from-slate-900/50 to-gray-50/90 dark:to-slate-800/50 backdrop-blur-sm">
        <div class="max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 flex flex-row justify-between items-center gap-2 sm:gap-4">
          ${prevChapter ? `
            <button id="prev-chapter"
                    data-chapter-id="${prevChapter.id}"
                    class="group flex items-center gap-1.5 sm:gap-3 px-2.5 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-slate-800/80 hover:bg-gray-200 dark:hover:bg-slate-700/80 border border-gray-300 dark:border-slate-600/50 hover:border-gray-400 dark:hover:border-slate-500/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/10 flex-1 max-w-[50%] sm:max-w-md"
                    title="${prevChapter.title}">
              <div class="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded sm:rounded-lg bg-gray-200 dark:bg-slate-700/50 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-600/20 flex items-center justify-center transition-colors">
                ${chevronLeft}
              </div>
              <div class="flex-1 text-left min-w-0">
                <div class="text-[10px] sm:text-xs text-gray-500 dark:text-slate-500 uppercase tracking-wide hidden sm:block mb-0.5">Anterior</div>
                <div class="text-[11px] sm:text-sm font-semibold text-gray-700 dark:text-slate-200 truncate leading-tight">${this.shortenChapterTitle(prevChapter.title, 22)}</div>
              </div>
            </button>
          ` : '<div class="hidden sm:flex flex-1"></div>'}
          ${nextChapter ? `
            <button id="next-chapter"
                    data-chapter-id="${nextChapter.id}"
                    class="group flex items-center gap-1.5 sm:gap-3 px-2.5 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-cyan-600/90 to-blue-600/90 hover:from-cyan-500/90 hover:to-blue-500/90 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/20 flex-1 max-w-[50%] sm:max-w-md"
                    title="${nextChapter.title}">
              <div class="flex-1 text-right min-w-0">
                <div class="text-[10px] sm:text-xs text-cyan-100 uppercase tracking-wide hidden sm:block mb-0.5">Siguiente</div>
                <div class="text-[11px] sm:text-sm font-semibold text-white truncate leading-tight">${this.shortenChapterTitle(nextChapter.title, 22)}</div>
              </div>
              <div class="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded sm:rounded-lg bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                ${chevronRight}
              </div>
            </button>
          ` : '<div class="hidden sm:flex flex-1"></div>'}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // PREMIUM EDITION
  // ==========================================================================

  /**
   * Verifica si el capítulo actual es el último del libro
   * @returns {boolean} true si es el último capítulo
   */
  isLastChapter() {
    if (!this.currentChapter) return false;
    const nextChapter = this.bookEngine.getNextChapter(this.currentChapter.id);
    return !nextChapter; // Es el último si no hay siguiente
  }

  /**
   * Renderiza el botón de descarga de Edición Premium
   * Aparece solo al final del último capítulo de cada libro
   * @returns {string} HTML del botón premium
   */
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
            <p class="text-gray-600 dark:text-gray-300 mb-1">${this.i18n.t('premium.description')}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">${this.i18n.t('premium.features')}</p>
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
              <span class="text-xs text-gray-400 dark:text-gray-500 block">${this.i18n.t('premium.optional')}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // UPDATE METHODS (para actualización parcial sin re-render completo)
  // ==========================================================================

  /**
   * Actualiza solo el contenido del capítulo sin re-renderizar todo el BookReader
   * Usado para navegación rápida entre capítulos
   */
  updateChapterContent() {
    const contentArea = document.querySelector('.chapter-content');
    if (!contentArea) {
      logger.warn('[BookReaderContent] No se encontró .chapter-content para actualizar');
      return;
    }

    // Re-renderizar el contenido del capítulo
    contentArea.innerHTML = this.renderChapterContent();

    // Re-inicializar iconos
    const Icons = this.getDependency('Icons');
    if (Icons) {
      Icons.init();
    }

    // Re-adjuntar event listeners del contenido
    if (this.bookReader.events) {
      this.bookReader.events.attachContentEventListeners();
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Limpia referencias para evitar memory leaks
   */
  destroy() {
    this.bookReader = null;
  }
}

// Exportar globalmente
window.BookReaderContent = BookReaderContent;
