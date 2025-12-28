// ============================================================================
// RESOURCES VIEWER - Visor de Recursos Externos
// ============================================================================
// Modal para explorar organizaciones, libros, documentales y herramientas

// 🔧 FIX v2.9.198: Migrated console.log to logger
class ResourcesViewer {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.isOpen = false;
    this.resourcesData = null;
    this.selectedTab = 'organizations'; // organizations, books, documentaries, tools
    this.selectedChapter = 'all';

    // 🔧 FIX v2.9.197: Memory leak cleanup - timer and listener tracking
    this.timers = [];
    this.intervals = [];
    this.eventListeners = [];
  }

  // ==========================================================================
  // CARGA DE DATOS
  // ==========================================================================

  async loadResourcesData() {
    if (this.resourcesData) return this.resourcesData;

    try {
      const bookId = this.bookEngine.getCurrentBook();
      // 🔧 FIX v2.9.234: Usar SafeFetch con cache offline
      if (window.SafeFetch) {
        this.resourcesData = await window.SafeFetch.jsonWithFallback(
          `books/${bookId}/assets/resources.json`,
          null,
          { showToast: false }
        );
      } else {
        const response = await fetch(`books/${bookId}/assets/resources.json`);
        if (!response.ok) throw new Error('Recursos no disponibles');
        this.resourcesData = await response.json();
      }
      return this.resourcesData;
    } catch (error) {
      console.error('Error cargando recursos:', error);
      if (window.toast) {
        window.toast.error('Error al cargar recursos');
      }
      return null;
    }
  }

  // ==========================================================================
  // UI - RENDERIZADO
  // ==========================================================================

  async open() {
    if (this.isOpen) return;

    const data = await this.loadResourcesData();
    if (!data) {
      if (window.toast) {
        window.toast.info('Recursos no disponibles para este libro');
      }
      return;
    }

    this.isOpen = true;
    this.render();

    // Esperar a que el DOM esté listo antes de adjuntar listeners
    // 🔧 FIX v2.9.197: Usar _setTimeout para tracking automático
    this._setTimeout(() => {
      this.attachEventListeners();
    }, 10);

    // Track para logros
    if (window.achievementSystem) {
      window.achievementSystem.trackResourcesViewed();
    }
  }

  close() {
    // 🔧 FIX v2.9.197: Cleanup antes de cerrar
    this.cleanup();

    const modal = document.getElementById('resources-modal');
    if (modal) {
      modal.classList.add('opacity-0');
      // 🔧 FIX v2.9.197: Usar _setTimeout para tracking automático
      this._setTimeout(() => {
        modal.remove();
        this.isOpen = false;
      }, 200);
    }
  }

  render() {
    // Remover modal existente
    const existing = document.getElementById('resources-modal');
    if (existing) existing.remove();

    const bookData = this.bookEngine.getCurrentBookData();

    const html = `
      <div id="resources-modal"
           class="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-200">
        <div class="bg-slate-900/95 rounded-2xl border border-orange-900/50 shadow-2xl max-w-7xl w-full h-[90vh] flex flex-col overflow-hidden">

          <!-- Header -->
          ${this.renderHeader(bookData)}

          <!-- Tabs -->
          ${this.renderTabs()}

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6">
            ${this.renderContent()}
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    // Fade in
    // 🔧 FIX v2.9.197: Usar _setTimeout para tracking automático
    this._setTimeout(() => {
      const modal = document.getElementById('resources-modal');
      if (modal) modal.classList.remove('opacity-0');
    }, 10);
  }

  renderHeader(bookData) {
    return `
      <div class="border-b border-orange-900/30 p-6 flex items-center justify-between bg-gradient-to-r from-orange-950/50 to-red-950/50">
        <div class="flex-1">
          <h2 class="text-3xl font-bold mb-1 flex items-center gap-3">
            ${Icons.link(28)} Recursos Externos
          </h2>
          <p class="text-sm opacity-70 flex items-center gap-1">
            ${bookData.title} ${Icons.chevronRight(14)} Organizaciones, libros, documentales y herramientas
          </p>
        </div>

        <button id="close-resources-btn"
                class="w-10 h-10 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-700 hover:bg-gray-200 transition flex items-center justify-center text-gray-900 dark:text-white"
                aria-label="Cerrar recursos">
          ${Icons.close(24)}
        </button>
      </div>
    `;
  }

  renderTabs() {
    const tabs = [
      { id: 'organizations', name: 'Organizaciones', icon: '🏢', count: this.resourcesData?.organizations?.length || 0 },
      { id: 'books', name: 'Libros', icon: '📚', count: this.resourcesData?.books?.length || 0 },
      { id: 'documentaries', name: 'Documentales', icon: '🎬', count: this.resourcesData?.documentaries?.length || 0 },
      { id: 'tools', name: 'Herramientas', icon: '🛠️', count: this.resourcesData?.tools?.length || 0 }
    ];

    return `
      <div class="border-b border-slate-700 bg-slate-800/30">
        <div class="flex gap-1 p-2">
          ${tabs.map(tab => `
            <button class="resource-tab flex-1 px-6 py-3 rounded-lg transition font-semibold ${
              this.selectedTab === tab.id
                ? 'bg-orange-600 text-white'
                : 'bg-slate-800/50 hover:bg-slate-700 text-slate-300'
            }" data-tab="${tab.id}">
              <span class="text-xl mr-2">${tab.icon}</span>
              ${tab.name}
              <span class="ml-2 text-sm opacity-70">(${tab.count})</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderContent() {
    switch (this.selectedTab) {
      case 'organizations':
        return this.renderOrganizations();
      case 'books':
        return this.renderBooks();
      case 'documentaries':
        return this.renderDocumentaries();
      case 'tools':
        return this.renderTools();
      default:
        return '<p>Contenido no disponible</p>';
    }
  }

  renderOrganizations() {
    const orgs = this.resourcesData?.organizations || [];
    if (orgs.length === 0) {
      return this.renderEmpty('🏢', 'No hay organizaciones disponibles');
    }

    return `
      <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        ${orgs.map(org => this.renderOrganizationCard(org)).join('')}
      </div>
    `;
  }

  renderOrganizationCard(org) {
    const typeColors = {
      'cooperativa': 'bg-green-950/30 border-green-900/50 text-green-400',
      'ong': 'bg-blue-950/30 border-blue-900/50 text-blue-400',
      'movimiento': 'bg-red-950/30 border-red-900/50 text-red-400',
      'plataforma': 'bg-purple-950/30 border-purple-900/50 text-purple-400',
      'red': 'bg-orange-950/30 border-orange-900/50 text-orange-400'
    };

    const typeClass = typeColors[org.type] || 'bg-slate-800 border-slate-700 text-slate-400';

    return `
      <div class="resource-card bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-orange-500/50 transition group">
        <!-- Header -->
        <div class="flex items-start justify-between mb-4">
          <h3 class="text-xl font-bold group-hover:text-orange-400 transition">
            ${org.name}
          </h3>
          <span class="text-xs px-3 py-1 rounded-full border ${typeClass}">
            ${org.type}
          </span>
        </div>

        <!-- Description -->
        <p class="text-sm opacity-70 mb-4 line-clamp-3">
          ${org.description}
        </p>

        <!-- Focus areas -->
        ${Array.isArray(org.focus) && org.focus.length > 0 ? `
          <div class="flex flex-wrap gap-2 mb-4">
            ${org.focus.slice(0, 3).map(f => `
              <span class="text-xs px-2 py-1 rounded bg-orange-950/30 text-orange-400">
                ${this.formatFocus(f)}
              </span>
            `).join('')}
            ${org.focus.length > 3 ? `<span class="text-xs opacity-50">+${org.focus.length - 3}</span>` : ''}
          </div>
        ` : ''}

        <!-- Location -->
        ${org.location ? `
          <div class="text-xs opacity-50 mb-3">
            📍 ${org.location}
          </div>
        ` : ''}

        <!-- Related chapters -->
        ${org.relatedChapters && org.relatedChapters.length > 0 ? `
          <div class="text-xs opacity-50 mb-3 flex items-center gap-1">
            ${Icons.book(12)} Mencionado en ${org.relatedChapters.length} capítulo(s)
          </div>
        ` : ''}

        <!-- Actions -->
        <div class="flex gap-2">
          ${org.website ? `
            <a href="${org.website}"
               target="_blank"
               class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 transition text-sm font-semibold">
              ${Icons.link(16)} Visitar sitio web
            </a>
          ` : ''}
          ${org.contact ? `
            <a href="mailto:${org.contact}"
               class="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-sm">
              ✉️
            </a>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderBooks() {
    const books = this.resourcesData?.books || [];
    if (books.length === 0) {
      return this.renderEmpty('📚', 'No hay libros disponibles');
    }

    return `
      <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${books.map(book => this.renderBookCard(book)).join('')}
      </div>
    `;
  }

  renderBookCard(book) {
    return `
      <div class="resource-card bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-orange-500/50 transition group">
        <!-- Title -->
        <h3 class="text-lg font-bold mb-2 group-hover:text-orange-400 transition line-clamp-2">
          ${book.title}
        </h3>

        <!-- Author & Year -->
        <div class="text-sm opacity-70 mb-3">
          Por <span class="font-semibold">${book.author}</span>
          ${book.year ? ` (${book.year})` : ''}
        </div>

        <!-- Synopsis -->
        ${book.synopsis ? `
          <p class="text-xs opacity-60 mb-4 line-clamp-3">
            ${book.synopsis}
          </p>
        ` : ''}

        <!-- Topics -->
        ${Array.isArray(book.topics) && book.topics.length > 0 ? `
          <div class="flex flex-wrap gap-1 mb-4">
            ${book.topics.slice(0, 3).map(t => `
              <span class="text-xs px-2 py-1 rounded bg-orange-950/30 text-orange-400">
                ${this.formatFocus(t)}
              </span>
            `).join('')}
          </div>
        ` : ''}

        <!-- Related chapters -->
        ${book.relatedChapters && book.relatedChapters.length > 0 ? `
          <div class="text-xs opacity-50 mb-3 flex items-center gap-1">
            ${Icons.book(12)} Mencionado en ${book.relatedChapters.length} capítulo(s)
          </div>
        ` : ''}

        <!-- Actions -->
        ${book.url ? `
          <a href="${book.url}"
             target="_blank"
             class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 transition text-sm font-semibold">
            ${Icons.book(16)} Más información
          </a>
        ` : ''}
      </div>
    `;
  }

  renderDocumentaries() {
    const docs = this.resourcesData?.documentaries || [];
    if (docs.length === 0) {
      return this.renderEmpty('🎬', 'No hay documentales disponibles');
    }

    return `
      <div class="max-w-6xl mx-auto space-y-6">
        ${docs.map(doc => this.renderDocumentaryCard(doc)).join('')}
      </div>
    `;
  }

  renderDocumentaryCard(doc) {
    return `
      <div class="resource-card bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-orange-500/50 transition group">
        <div class="flex gap-6">
          <!-- Thumbnail placeholder -->
          <div class="w-48 h-28 bg-slate-900 rounded-lg flex items-center justify-center text-4xl flex-shrink-0">
            🎬
          </div>

          <!-- Content -->
          <div class="flex-1">
            <!-- Title & Year -->
            <h3 class="text-xl font-bold mb-2 group-hover:text-orange-400 transition">
              ${doc.title}
            </h3>
            <div class="text-sm opacity-70 mb-2">
              ${doc.director ? `Dirigido por <span class="font-semibold">${doc.director}</span>` : ''}
              ${doc.year ? ` (${doc.year})` : ''}
              ${doc.duration ? ` • ${doc.duration}` : ''}
            </div>

            <!-- Synopsis -->
            ${doc.synopsis ? `
              <p class="text-sm opacity-70 mb-3 line-clamp-2">
                ${doc.synopsis}
              </p>
            ` : ''}

            <!-- Themes -->
            ${Array.isArray(doc.themes) && doc.themes.length > 0 ? `
              <div class="flex flex-wrap gap-2 mb-3">
                ${doc.themes.map(t => `
                  <span class="text-xs px-2 py-1 rounded bg-orange-950/30 text-orange-400">
                    ${this.formatFocus(t)}
                  </span>
                `).join('')}
              </div>
            ` : ''}

            <!-- Actions -->
            ${doc.url ? `
              <a href="${doc.url}"
                 target="_blank"
                 class="inline-block px-6 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 transition text-sm font-semibold">
                ▶️ Ver documental
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  renderTools() {
    const tools = this.resourcesData?.tools || [];
    if (tools.length === 0) {
      return this.renderEmpty('🛠️', 'No hay herramientas disponibles');
    }

    return `
      <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        ${tools.map(tool => this.renderToolCard(tool)).join('')}
      </div>
    `;
  }

  renderToolCard(tool) {
    const typeColors = {
      'comunicacion': 'bg-blue-950/30 border-blue-900/50 text-blue-400',
      'organizacion': 'bg-green-950/30 border-green-900/50 text-green-400',
      'financiacion': 'bg-yellow-950/30 border-yellow-900/50 text-yellow-400',
      'seguridad': 'bg-red-950/30 border-red-900/50 text-red-400',
      'educacion': 'bg-purple-950/30 border-purple-900/50 text-purple-400'
    };

    const typeClass = typeColors[tool.type] || 'bg-slate-800 border-slate-700 text-slate-400';

    return `
      <div class="resource-card bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-orange-500/50 transition group">
        <!-- Header -->
        <div class="flex items-start justify-between mb-4">
          <h3 class="text-xl font-bold group-hover:text-orange-400 transition">
            ${tool.name}
          </h3>
          <span class="text-xs px-3 py-1 rounded-full border ${typeClass}">
            ${tool.type}
          </span>
        </div>

        <!-- Description -->
        <p class="text-sm opacity-70 mb-4">
          ${tool.description}
        </p>

        <!-- Features -->
        ${Array.isArray(tool.features) && tool.features.length > 0 ? `
          <ul class="text-xs space-y-1 mb-4 opacity-70">
            ${tool.features.slice(0, 3).map(f => `
              <li class="flex items-center gap-1">${Icons.check(12)} ${f}</li>
            `).join('')}
          </ul>
        ` : ''}

        <!-- Cost -->
        ${tool.cost ? `
          <div class="text-sm mb-4">
            ${tool.cost === 'gratuito'
              ? '<span class="px-3 py-1 rounded-full bg-green-950/30 border border-green-900/50 text-green-400">💚 Gratuito</span>'
              : `<span class="px-3 py-1 rounded-full bg-slate-800 border border-slate-700">💰 ${tool.cost}</span>`
            }
          </div>
        ` : ''}

        <!-- Actions -->
        ${tool.url ? `
          <a href="${tool.url}"
             target="_blank"
             class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 transition text-sm font-semibold">
            ${Icons.link(16)} Visitar herramienta
          </a>
        ` : ''}
      </div>
    `;
  }

  renderEmpty(icon, message) {
    return `
      <div class="text-center py-12 opacity-50">
        <div class="text-6xl mb-4">${icon}</div>
        <p class="text-lg">${message}</p>
      </div>
    `;
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  formatFocus(focus) {
    const map = {
      'economia_solidaria': 'Economía Solidaria',
      'justicia_climatica': 'Justicia Climática',
      'derechos_humanos': 'Derechos Humanos',
      'feminismo': 'Feminismo',
      'anticapitalismo': 'Anticapitalismo',
      'democracia_participativa': 'Democracia Participativa',
      'commons': 'Comunes',
      'tecnologia_libre': 'Tecnología Libre'
    };
    return map[focus] || focus.replace(/_/g, ' ');
  }

  // ==========================================================================
  // TIMER & LISTENER TRACKING (🔧 FIX v2.9.197: Memory leak prevention)
  // ==========================================================================

  /**
   * setTimeout wrapper con tracking automático
   */
  _setTimeout(callback, delay) {
    const timerId = setTimeout(() => {
      callback();
      // Auto-remove del tracking array al completarse
      const index = this.timers.indexOf(timerId);
      if (index > -1) {
        this.timers.splice(index, 1);
      }
    }, delay);
    this.timers.push(timerId);
    return timerId;
  }

  /**
   * setInterval wrapper con tracking automático
   */
  _setInterval(callback, delay) {
    const intervalId = setInterval(callback, delay);
    this.intervals.push(intervalId);
    return intervalId;
  }

  /**
   * addEventListener wrapper con tracking automático
   */
  _addEventListener(target, event, handler, options) {
    if (!target) return;
    target.addEventListener(event, handler, options);
    this.eventListeners.push({ target, event, handler, options });
  }

  /**
   * Cleanup completo de timers, intervals y listeners
   */
  cleanup() {
    // Limpiar timers
    this.timers.forEach(timerId => clearTimeout(timerId));
    this.timers = [];

    // Limpiar intervals
    this.intervals.forEach(intervalId => clearInterval(intervalId));
    this.intervals = [];

    // Limpiar event listeners
    this.eventListeners.forEach(({ target, event, handler, options }) => {
      if (target && typeof target.removeEventListener === 'function') {
        target.removeEventListener(event, handler, options);
      }
    });
    this.eventListeners = [];

    logger.debug('[ResourcesViewer] Cleanup completado');
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  attachEventListeners() {
    // 🔧 FIX v2.9.197: Migrar TODOS los listeners a _addEventListener

    // Close button
    const closeBtn = document.getElementById('close-resources-btn');
    if (closeBtn) {
      this._addEventListener(closeBtn, 'click', () => this.close());
    }

    // Close on ESC
    const escHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    };
    this._addEventListener(document, 'keydown', escHandler);

    // Close on click outside
    const modal = document.getElementById('resources-modal');
    if (modal) {
      this._addEventListener(modal, 'click', (e) => {
        if (e.target === modal) {
          this.close();
        }
      });
    }

    // Tab buttons
    const tabBtns = document.querySelectorAll('.resource-tab');
    tabBtns.forEach(btn => {
      this._addEventListener(btn, 'click', () => {
        this.selectedTab = btn.getAttribute('data-tab');
        this.render();
        // 🔧 FIX v2.9.197: Cleanup listeners anteriores antes de re-render
        this.cleanup();
        this._setTimeout(() => {
          this.attachEventListeners();
        }, 10);
      });
    });
  }
}

// Exportar para uso global
window.ResourcesViewer = ResourcesViewer;
