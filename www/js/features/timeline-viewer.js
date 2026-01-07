// ============================================================================
// TIMELINE VIEWER - Visor de Línea Temporal Histórica
// ============================================================================
// Modal para explorar eventos históricos de movimientos sociales (Manifiesto)

class TimelineViewer {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.isOpen = false;
    this.timelineData = null;
    this.selectedCategory = 'all';
    this.selectedEvent = null;
    // 🔧 FIX v2.9.271: Track ESC handler for cleanup
    this.escHandler = null;
  }

  // ==========================================================================
  // CARGA DE DATOS
  // ==========================================================================

  async loadTimelineData() {
    if (this.timelineData) return this.timelineData;

    try {
      const bookId = this.bookEngine.getCurrentBook();
      const response = await fetch(`books/${bookId}/assets/timeline.json`);
      if (!response.ok) throw new Error('Timeline no disponible para este libro');
      this.timelineData = await response.json();
      return this.timelineData;
    } catch (error) {
      logger.error('Error cargando timeline:', error);
      return null;
    }
  }

  // ==========================================================================
  // UI - RENDERIZADO
  // ==========================================================================

  async open() {
    if (this.isOpen) return;

    // FIX v2.9.234: Show loading state while fetching data
    this.renderLoading();
    this.isOpen = true;

    try {
      const data = await this.loadTimelineData();
      if (!data) {
        this.close();
        window.toast?.info('Timeline no disponible para este libro');
        return;
      }

      this.render();
      this.attachEventListeners();

      // Track para logros
      if (window.achievementSystem) {
        window.achievementSystem.trackTimelineViewed();
      }
    } catch (error) {
      logger.error('Error opening timeline:', error);
      this.close();
      window.toast?.error('Error al cargar timeline');
    }
  }

  /**
   * FIX v2.9.234: Loading state for async data
   */
  renderLoading() {
    const existing = document.getElementById('timeline-modal');
    if (existing) existing.remove();

    const html = `
      <div id="timeline-modal" class="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div class="bg-slate-900/95 rounded-2xl p-8 border border-red-900/50 shadow-2xl">
          <div class="flex flex-col items-center gap-4">
            <div class="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
            <p class="text-gray-400">Cargando timeline historico...</p>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  close() {
    // 🔧 FIX v2.9.271: Cleanup ESC handler
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
      this.escHandler = null;
    }

    const modal = document.getElementById('timeline-modal');
    if (modal) {
      modal.classList.add('opacity-0');
      setTimeout(() => {
        modal.remove();
        this.isOpen = false;
        this.selectedEvent = null;
      }, 200);
    }
  }

  render() {
    // Remover modal existente
    const existing = document.getElementById('timeline-modal');
    if (existing) existing.remove();

    const bookData = this.bookEngine.getCurrentBookData();

    const html = `
      <div id="timeline-modal"
           class="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 transition-opacity duration-200">
        <div class="bg-slate-900/95 rounded-xl sm:rounded-2xl border border-red-900/50 shadow-2xl max-w-7xl w-full h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden">

          <!-- Header -->
          ${this.renderHeader(bookData)}

          <!-- Main Content -->
          <div class="flex flex-col md:flex-row flex-1 overflow-hidden">
            <!-- Sidebar: Categories & Patterns -->
            <div class="hidden md:block md:w-64 lg:w-80 border-r border-red-900/30 bg-slate-800/30 overflow-y-auto">
              ${this.renderSidebar()}
            </div>

            <!-- Main Timeline -->
            <div class="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
              ${this.selectedEvent
                ? this.renderEventDetail()
                : this.renderTimeline()
              }
            </div>
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    // Fade in
    setTimeout(() => {
      const modal = document.getElementById('timeline-modal');
      if (modal) modal.classList.remove('opacity-0');
    }, 10);
  }

  renderHeader(bookData) {
    return `
      <div class="border-b border-red-900/30 p-3 sm:p-4 md:p-6 flex items-center justify-between bg-gradient-to-r from-red-950/50 to-orange-950/50">
        <div class="flex-1 min-w-0">
          <h2 class="text-xl sm:text-2xl md:text-3xl font-bold mb-1 flex items-center gap-2 sm:gap-3">
            ${Icons.clock(20)} <span class="truncate">Timeline Histórico</span>
          </h2>
          <p class="text-xs sm:text-sm opacity-70 flex items-center gap-1 truncate">
            <span class="hidden sm:inline">${bookData.title} ${Icons.chevronRight(14)}</span> Movimientos sociales (1789-2024)
          </p>
        </div>

        <div class="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          ${this.selectedEvent ? `
            <button id="back-to-timeline-btn"
                    class="px-2 sm:px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-xs sm:text-sm flex items-center gap-1">
              ${Icons.chevronLeft(16)} <span class="hidden sm:inline">Volver</span>
            </button>
          ` : ''}
          <button id="close-timeline-btn"
                  class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-700 hover:bg-gray-200 transition flex items-center justify-center flex-shrink-0 text-gray-900 dark:text-white"
                  aria-label="Cerrar línea temporal">
            ${Icons.close(20)}
          </button>
        </div>
      </div>
    `;
  }

  renderSidebar() {
    const categories = this.getCategories();
    const patterns = this.timelineData?.patterns?.observations || [];

    return `
      <div class="p-4 space-y-6">
        <!-- Filtros por categoría -->
        <div>
          <h3 class="text-sm font-bold mb-3 opacity-50">CATEGORÍAS</h3>
          <div class="space-y-2">
            <button class="category-filter w-full text-left px-3 py-2 rounded-lg transition ${
              this.selectedCategory === 'all'
                ? 'bg-red-600 font-bold'
                : 'bg-slate-800/50 hover:bg-slate-700'
            }" data-category="all">
              📜 Todos los eventos (${this.timelineData?.events?.length || 0})
            </button>
            ${categories.map(cat => `
              <button class="category-filter w-full text-left px-3 py-2 rounded-lg transition text-sm ${
                this.selectedCategory === cat.id
                  ? 'bg-red-600 font-bold'
                  : 'bg-slate-800/50 hover:bg-slate-700'
              }" data-category="${cat.id}">
                ${cat.icon} ${cat.name} (${cat.count})
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Patrones históricos -->
        <div>
          <h3 class="text-sm font-bold mb-3 opacity-50">PATRONES HISTÓRICOS</h3>
          <div class="space-y-2">
            ${patterns.map(pattern => `
              <div class="p-3 rounded-lg bg-orange-950/30 border border-orange-900/30 text-xs">
                <div class="font-bold text-orange-400 mb-1">${pattern.pattern}</div>
                <div class="opacity-70">${pattern.description}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderTimeline() {
    const filteredEvents = this.getFilteredEvents();
    const categories = this.getCategories();

    if (filteredEvents.length === 0) {
      return `
        <div class="text-center py-12 opacity-50">
          <div class="text-6xl mb-4">⏳</div>
          <p class="text-lg">No hay eventos en esta categoría</p>
        </div>
      `;
    }

    return `
      <div class="max-w-4xl mx-auto px-2 sm:px-0">
        <!-- Filtro móvil -->
        <div class="md:hidden mb-4">
          <label class="block text-sm font-bold mb-2 opacity-70">Filtrar por categoría:</label>
          <select id="mobile-category-filter" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm">
            <option value="all" ${this.selectedCategory === 'all' ? 'selected' : ''}>📜 Todos los eventos (${this.timelineData?.events?.length || 0})</option>
            ${categories.map(cat => `
              <option value="${cat.id}" ${this.selectedCategory === cat.id ? 'selected' : ''}>
                ${cat.icon} ${cat.name} (${cat.count})
              </option>
            `).join('')}
          </select>
        </div>

        <div class="relative ml-0 sm:ml-16 md:ml-28">
          <!-- Línea vertical del timeline (oculta en móvil) -->
          <div class="hidden sm:block absolute sm:-left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500 via-orange-500 to-red-500 opacity-30"></div>

          <!-- Eventos -->
          <div class="space-y-4 sm:space-y-6 md:space-y-8">
            ${filteredEvents.map(event => this.renderTimelineEvent(event)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderTimelineEvent(event) {
    const categoryInfo = this.getCategoryInfo(event.category);

    return `
      <div class="timeline-event relative ml-0 sm:ml-16 md:ml-28 cursor-pointer hover:bg-slate-800/30 rounded-lg p-3 sm:p-4 transition group"
           data-event-id="${event.id}">

        <!-- Año y Dot en móvil (arriba) -->
        <div class="flex sm:hidden items-center gap-2 mb-3 pb-2 border-b border-red-900/30">
          <div class="w-3 h-3 rounded-full bg-red-600 border-2 border-slate-900 flex-shrink-0"></div>
          <span class="font-bold text-base text-red-400">${event.year}</span>
        </div>

        <!-- Año en tablet/desktop (lateral) -->
        <div class="hidden sm:block absolute sm:-left-16 md:-left-28 top-2 sm:top-4 w-14 md:w-20 text-right font-bold text-base md:text-lg text-red-400">
          ${event.year}
        </div>

        <!-- Dot en tablet/desktop (lateral) -->
        <div class="hidden sm:block absolute sm:-left-6 top-4 sm:top-6 w-5 h-5 rounded-full bg-red-600 border-4 border-slate-900 group-hover:scale-125 transition z-10"></div>

        <!-- Contenido -->
        <div>
          <!-- Título -->
          <h3 class="text-lg sm:text-xl font-bold group-hover:text-red-400 transition mb-2">
            ${event.title}
          </h3>

          <!-- Badge de categoría -->
          <div class="mb-2">
            <span class="inline-block text-xs px-2 py-1 rounded bg-slate-800 text-red-400">
              ${categoryInfo.icon} ${categoryInfo.name}
            </span>
          </div>

          <!-- Descripción -->
          <p class="text-xs sm:text-sm opacity-70 mb-2 line-clamp-2">
            ${event.description}
          </p>

          <!-- Footer -->
          <div class="flex items-center gap-2 sm:gap-4 text-xs opacity-50 flex-wrap">
            <span class="flex items-center gap-1">${Icons.zap(12)} Impacto: ${event.impact?.split('.')[0]}...</span>
            <span class="flex items-center gap-1">${Icons.chevronRight(12)} Leer más</span>
          </div>
        </div>
      </div>
    `;
  }

  renderEventDetail() {
    const event = this.timelineData.events.find(e => e.id === this.selectedEvent);
    if (!event) return '<p>Evento no encontrado</p>';

    const categoryInfo = this.getCategoryInfo(event.category);
    const relatedChapters = event.relatedChapters || [];

    return `
      <div class="max-w-4xl mx-auto">
        <!-- Header del evento -->
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-2 text-sm opacity-50">
            <span class="px-3 py-1 rounded-full bg-red-950/50 border border-red-900/30 text-red-400">
              ${categoryInfo.icon} ${categoryInfo.name}
            </span>
            <span>${event.year}</span>
          </div>

          <h1 class="text-4xl font-bold mb-4">${event.title}</h1>
        </div>

        <!-- Descripción -->
        <div class="prose prose-invert max-w-none mb-6">
          <p class="text-lg leading-relaxed">${event.description}</p>
        </div>

        <!-- Impacto -->
        <div class="bg-red-950/20 border border-red-900/30 rounded-xl p-6 mb-6">
          <h3 class="text-lg font-bold mb-3 text-red-400">💥 Impacto Histórico</h3>
          <p class="text-sm leading-relaxed">${event.impact}</p>
        </div>

        <!-- Lecciones -->
        ${event.lessons ? `
          <div class="bg-orange-950/20 border border-orange-900/30 rounded-xl p-6 mb-6">
            <h3 class="text-lg font-bold mb-3 text-orange-400">📚 Lecciones Aprendidas</h3>
            <p class="text-sm leading-relaxed">${event.lessons}</p>
          </div>
        ` : ''}

        <!-- Capítulos relacionados -->
        ${relatedChapters.length > 0 ? `
          <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 class="text-lg font-bold mb-3 flex items-center gap-2">${Icons.book(20)} Capítulos relacionados</h3>
            <div class="space-y-2">
              ${relatedChapters.map(chId => {
                const chapter = this.bookEngine.getChapter(chId);
                return chapter ? `
                  <button class="w-full text-left px-4 py-3 rounded-lg bg-slate-900/50 hover:bg-slate-700 transition flex items-center gap-2"
                          data-navigate-chapter="${chId}">
                    ${Icons.chevronRight(16)} ${chapter.title}
                  </button>
                ` : '';
              }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  getCategories() {
    const events = this.timelineData?.events || [];
    const categoryCounts = {};

    for (const event of events) {
      categoryCounts[event.category] = (categoryCounts[event.category] || 0) + 1;
    }

    const categoryMap = {
      'revoluciones': { name: 'Revoluciones', icon: '⚔️' },
      'movimientos_sociales': { name: 'Movimientos Sociales', icon: '✊' },
      'represion': { name: 'Represión', icon: '🔒' },
      'victorias': { name: 'Victorias', icon: '🎉' },
      'otros': { name: 'Otros', icon: '📌' }
    };

    return Object.entries(categoryCounts).map(([id, count]) => ({
      id,
      name: categoryMap[id]?.name || id,
      icon: categoryMap[id]?.icon || '📍',
      count
    }));
  }

  getCategoryInfo(categoryId) {
    const map = {
      'revoluciones': { name: 'Revolución', icon: '⚔️' },
      'movimientos_sociales': { name: 'Movimiento Social', icon: '✊' },
      'represion': { name: 'Represión', icon: '🔒' },
      'victorias': { name: 'Victoria', icon: '🎉' },
      'otros': { name: 'Otro', icon: '📌' }
    };
    return map[categoryId] || { name: categoryId, icon: '📍' };
  }

  getFilteredEvents() {
    const events = this.timelineData?.events || [];
    if (this.selectedCategory === 'all') {
      return events;
    }
    return events.filter(e => e.category === this.selectedCategory);
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  attachEventListeners() {
    // Close button
    const closeBtn = document.getElementById('close-timeline-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Back to timeline button
    const backBtn = document.getElementById('back-to-timeline-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.selectedEvent = null;
        this.render();
        this.attachEventListeners();
      });
    }

    // 🔧 FIX v2.9.271: Store ESC handler for cleanup in close()
    this.escHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escHandler);

    // Close on click outside
    const modal = document.getElementById('timeline-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.close();
        }
      });
    }

    // Category filters (sidebar)
    const categoryBtns = document.querySelectorAll('.category-filter');
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedCategory = btn.getAttribute('data-category');
        this.render();
        this.attachEventListeners();
      });
    });

    // Mobile category filter
    const mobileFilter = document.getElementById('mobile-category-filter');
    if (mobileFilter) {
      mobileFilter.addEventListener('change', (e) => {
        this.selectedCategory = e.target.value;
        this.render();
        this.attachEventListeners();
      });
    }

    // Timeline event clicks
    const eventDivs = document.querySelectorAll('.timeline-event');
    eventDivs.forEach(div => {
      div.addEventListener('click', () => {
        this.selectedEvent = div.getAttribute('data-event-id');
        this.render();
        this.attachEventListeners();
      });
    });

    // Navigate to chapter buttons
    const navBtns = document.querySelectorAll('[data-navigate-chapter]');
    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const chapterId = btn.getAttribute('data-navigate-chapter');
        this.close();

        // Navegar al capítulo
        setTimeout(() => {
          if (window.bookReader) {
            window.bookReader.navigateToChapter(chapterId);
          }
        }, 300);
      });
    });
  }
}

// Exportar para uso global
window.TimelineViewer = TimelineViewer;
