// ============================================================================
// EXPLORATION HUB - Centro de Exploración Unificado
// ============================================================================
// Widget unificado que integra:
// - 🔍 Búsqueda Inteligente (search-modal.js)
// - 🗂️ Índice Temático (thematic-index-modal.js)
// - 🧭 Brújula de Recursos (brujula-recursos.js)
//
// Beneficios:
// - UX más limpia: 3 botones → 1 botón "Explorar"
// - Navegación fluida entre modos sin perder contexto
// - Búsqueda transversal en contenido, temas y recursos
// - Mobile-friendly con tabs responsivos
// ============================================================================

class ExplorationHub {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.currentTab = 'search'; // 'search' | 'themes' | 'resources'
    this.i18n = window.i18n || new I18n();

    // Instanciar los componentes subyacentes
    this.searchModal = new SearchModal(bookEngine);
    this.thematicIndex = new ThematicIndexModal(bookEngine);
    this.brujulaRecursos = new BrujulaRecursos();

    // Inicializar brújula
    this.brujulaRecursos.init();
  }

  /**
   * Abre el hub con un tab inicial específico
   * @param {string} initialTab - 'search', 'themes', o 'resources'
   */
  open(initialTab = 'search') {
    this.currentTab = initialTab;
    this.render();

    // Esperar a que el DOM se actualice antes de adjuntar listeners
    setTimeout(() => {
      this.attachListeners();

      // Focus en el input de búsqueda si es el tab activo
      if (this.currentTab === 'search') {
        const input = document.getElementById('hub-search-input');
        input?.focus();
      }
    }, 50);
  }

  /**
   * Cierra el hub
   */
  close() {
    const modal = document.getElementById('exploration-hub-modal');
    if (modal) modal.remove();
  }

  /**
   * Renderiza el modal completo
   */
  render() {
    const html = `
      <div id="exploration-hub-modal" class="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
        <div class="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-none sm:rounded-2xl max-w-6xl w-full h-full sm:h-auto sm:max-h-[90vh] border-0 sm:border-2 border-purple-500/30 shadow-2xl flex flex-col">

          <!-- Header -->
          <div class="p-3 sm:p-6 border-b border-purple-500/20 flex-shrink-0 bg-slate-900/50 sticky top-0 z-10">
            <div class="flex items-center justify-between mb-3 sm:mb-4">
              <h2 class="text-lg sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
                <span class="text-2xl sm:text-3xl">${Icons.compass(28)}</span>
                <span class="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Centro de Exploración
                </span>
              </h2>
              <button id="close-exploration-hub" class="hover:text-red-400 transition text-gray-400 hover:scale-110 p-2" aria-label="Cerrar explorador">
                ${Icons.close(24)}
              </button>
            </div>

            <!-- Tabs -->
            ${this.renderTabs()}
          </div>

          <!-- Content -->
          <div id="hub-content" class="flex-1 overflow-y-auto p-3 sm:p-6">
            ${this.renderTabContent()}
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  /**
   * Renderiza los tabs de navegación
   */
  renderTabs() {
    const tabs = [
      { id: 'search', icon: 'search', label: 'Buscar', color: 'pink' },
      { id: 'themes', icon: 'list', label: 'Temas', color: 'purple' },
      { id: 'resources', icon: 'compass', label: 'Brújula', color: 'blue' },
      { id: 'lab', icon: 'beaker', label: 'Laboratorios', color: 'amber' }
    ];

    return `
      <div class="flex gap-1 sm:gap-2 overflow-x-auto pb-2 no-scrollbar">
        ${tabs.map(tab => `
          <button
            id="hub-tab-${tab.id}"
            data-tab="${tab.id}"
            class="hub-tab flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-xs sm:text-base whitespace-nowrap ${
              this.currentTab === tab.id
                ? `bg-${tab.color}-600 text-white shadow-lg scale-105`
                : 'bg-slate-800/50 text-gray-400 hover:text-white hover:bg-slate-700'
            }">
            <span class="inline-block mr-1 sm:mr-2">${Icons.create(tab.icon, 16)}</span>
            ${tab.label}
          </button>
        `).join('')}
      </div>
    `;
  }

  /**
   * Renderiza el contenido del tab actual
   */
  renderTabContent() {
    switch (this.currentTab) {
      case 'search':
        return this.renderSearchTab();
      case 'themes':
        return this.renderThemesTab();
      case 'resources':
        return this.renderResourcesTab();
      case 'lab':
        return this.renderLabTab();
      default:
        return '<p class="text-gray-400">Tab no encontrado</p>';
    }
  }

  /**
   * Tab 1: Búsqueda Inteligente
   */
  renderSearchTab() {
    return `
      <div class="search-tab-content">
        <!-- Search Input -->
        <div class="mb-6">
          <div class="relative">
            <span class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              ${Icons.search(20)}
            </span>
            <input
              type="text"
              id="hub-search-input"
              placeholder="Busca en todos los libros... (mínimo 3 caracteres)"
              class="w-full bg-slate-800/50 border-2 border-slate-700 rounded-xl pl-12 pr-4 py-3 sm:py-4 text-base sm:text-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition"
            />
            <div id="hub-search-loading" class="hidden absolute right-4 top-1/2 transform -translate-y-1/2">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500"></div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
          <select id="hub-filter-book" class="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-pink-500">
            <option value="all">📚 Todos los libros</option>
          </select>
          <select id="hub-filter-type" class="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-pink-500">
            <option value="all">🔖 Todos los tipos</option>
            <option value="chapter">Capítulos</option>
            <option value="exercise">Ejercicios</option>
            <option value="resource">Recursos</option>
          </select>
          <select id="hub-filter-difficulty" class="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-pink-500">
            <option value="all">📊 Cualquier nivel</option>
            <option value="beginner">Principiante</option>
            <option value="intermediate">Intermedio</option>
            <option value="advanced">Avanzado</option>
          </select>
          <button id="hub-clear-filters" class="bg-slate-700 hover:bg-slate-600 rounded-lg px-3 py-2 text-sm transition">
            ${Icons.create('x', 14)} Limpiar
          </button>
        </div>

        <!-- Results -->
        <div id="hub-search-results" class="space-y-3">
          ${this.renderSearchPlaceholder()}
        </div>
      </div>
    `;
  }

  renderSearchPlaceholder() {
    return `
      <div class="text-center text-gray-400 py-12">
        <div class="text-6xl mb-4">🔍</div>
        <p class="text-lg text-gray-300">Escribe para buscar en toda la colección</p>
        <p class="text-sm text-gray-500 mt-2">Capítulos, ejercicios, recursos y más</p>
      </div>
    `;
  }

  /**
   * Tab 2: Índice Temático
   */
  renderThemesTab() {
    return `
      <div class="themes-tab-content">
        <div class="text-center mb-6">
          <p class="text-gray-300 text-sm sm:text-base">Explora contenido organizado por temas y casos de uso prácticos</p>
        </div>

        <!-- View Toggle -->
        <div class="flex gap-2 mb-6 justify-center">
          <button id="hub-themes-practical" class="px-4 py-2 rounded-lg transition bg-purple-600 text-white">
            ${Icons.target(16)} Guías Prácticas
          </button>
          <button id="hub-themes-browse" class="px-4 py-2 rounded-lg transition bg-slate-800 text-gray-400 hover:text-white">
            ${Icons.filter(16)} Explorar con Filtros
          </button>
        </div>

        <!-- Content Container -->
        <div id="hub-themes-content">
          ${this.renderThemesPlaceholder()}
        </div>
      </div>
    `;
  }

  renderThemesPlaceholder() {
    return `
      <div class="text-center text-gray-400 py-12">
        <div class="text-6xl mb-4">🗂️</div>
        <p class="text-lg text-gray-300">Cargando índice temático...</p>
      </div>
    `;
  }

  /**
   * Tab 3: Brújula de Recursos (Contemplativa)
   */
  renderResourcesTab() {
    return `
      <div class="resources-tab-content brujula-inicio">
        <!-- Símbolo contemplativo -->
        <div class="text-center mb-6">
          <div class="text-6xl mb-3 animate-pulse">🧭</div>
          <h3 class="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text mb-2">
            BRÚJULA
          </h3>
          <p class="text-gray-400 text-sm max-w-2xl mx-auto">
            Este es un espacio para explorar recursos de transformación.<br/>
            No te dirá qué hacer. No tiene las respuestas.<br/>
            Solo ofrece orientación. El camino es tuyo.
          </p>
        </div>

        <!-- Opciones contemplativas -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <!-- Opción 1: Diálogo -->
          <button class="brujula-mode-card group relative p-6 rounded-xl border-2 border-slate-700 hover:border-purple-500 bg-slate-800/50 hover:bg-slate-800 transition-all duration-300 hover:scale-105" data-brujula-mode="dialogo">
            <div class="text-4xl mb-3 group-hover:scale-110 transition-transform">💬</div>
            <h4 class="text-lg font-bold text-white mb-2">Tengo una inquietud</h4>
            <p class="text-sm text-gray-400">Explorar juntos qué podría ser relevante</p>
          </button>

          <!-- Opción 2: Explorar -->
          <button class="brujula-mode-card group relative p-6 rounded-xl border-2 border-slate-700 hover:border-blue-500 bg-slate-800/50 hover:bg-slate-800 transition-all duration-300 hover:scale-105" data-brujula-mode="explorar">
            <div class="text-4xl mb-3 group-hover:scale-110 transition-transform">📚</div>
            <h4 class="text-lg font-bold text-white mb-2">Quiero explorar libremente</h4>
            <p class="text-sm text-gray-400">Navegar los recursos sin guía</p>
          </button>

          <!-- Opción 3: Serendipity -->
          <button class="brujula-mode-card group relative p-6 rounded-xl border-2 border-slate-700 hover:border-pink-500 bg-slate-800/50 hover:bg-slate-800 transition-all duration-300 hover:scale-105" data-brujula-mode="serendipity">
            <div class="text-4xl mb-3 group-hover:scale-110 transition-transform">🎲</div>
            <h4 class="text-lg font-bold text-white mb-2">Sorpréndeme</h4>
            <p class="text-sm text-gray-400">Descubrir algo inesperado</p>
          </button>
        </div>

        <!-- Nota contemplativa -->
        <div class="mt-8 text-center">
          <p class="text-xs text-gray-500 max-w-lg mx-auto italic">
            Si en algún momento sientes que esto te dirige más de lo que quieres,<br/>
            confía en tu intuición por encima del sistema.
          </p>
        </div>

        <!-- Historial (si existe) -->
        ${this.brujulaRecursos.historial.length > 0 ? `
          <div class="mt-6 text-center text-sm text-gray-400">
            Has explorado ${this.brujulaRecursos.historial.length} recursos
            ${this.brujulaRecursos.favoritos.length > 0 ? `· ${this.brujulaRecursos.favoritos.length} favoritos` : ''}
          </div>
        ` : ''}

        <!-- Container para contenido dinámico -->
        <div id="hub-brujula-content" class="mt-6"></div>
      </div>
    `;
  }

  /**
   * Tab 3: Brújula de Recursos
   */
  renderResourcesTab() {
    return `
      <div class="resources-tab-content">
        <div class="text-center mb-6">
          <p class="text-gray-300 text-sm sm:text-base">Navega por recursos externos organizados por dimensiones y categorías</p>
        </div>

        <!-- Dimensiones -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          ${this.renderResourceDimensions()}
        </div>

        <!-- Filtros de tipo de recurso -->
        <div class="flex flex-wrap gap-2 mb-6 justify-center">
          <button data-resource-type="all" class="resource-type-filter px-3 sm:px-4 py-2 rounded-lg bg-blue-600 text-white text-xs sm:text-sm">
            Todos
          </button>
          <button data-resource-type="books" class="resource-type-filter px-3 sm:px-4 py-2 rounded-lg bg-slate-800 text-gray-400 text-xs sm:text-sm">
            📚 Libros
          </button>
          <button data-resource-type="organizations" class="resource-type-filter px-3 sm:px-4 py-2 rounded-lg bg-slate-800 text-gray-400 text-xs sm:text-sm">
            🏛️ Organizaciones
          </button>
          <button data-resource-type="documentaries" class="resource-type-filter px-3 sm:px-4 py-2 rounded-lg bg-slate-800 text-gray-400 text-xs sm:text-sm">
            🎬 Documentales
          </button>
          <button data-resource-type="podcasts" class="resource-type-filter px-3 sm:px-4 py-2 rounded-lg bg-slate-800 text-gray-400 text-xs sm:text-sm">
            🎙️ Podcasts
          </button>
          <button data-resource-type="tools" class="resource-type-filter px-3 sm:px-4 py-2 rounded-lg bg-slate-800 text-gray-400 text-xs sm:text-sm">
            🛠️ Herramientas
          </button>
        </div>

        <!-- Resources Container -->
        <div id="hub-resources-content">
          ${this.renderResourcesPlaceholder()}
        </div>
      </div>
    `;
  }

  renderResourceDimensions() {
    const dimensiones = this.brujulaRecursos.dimensiones;

    return Object.entries(dimensiones).map(([key, dim]) => `
      <button
        data-dimension="${key}"
        class="dimension-card p-4 rounded-xl border-2 transition-all hover:scale-105 bg-slate-800/50 border-slate-700 hover:border-opacity-100"
        style="border-color: ${dim.color}40">
        <div class="text-3xl mb-2">${dim.emoji}</div>
        <div class="font-semibold text-sm sm:text-base" style="color: ${dim.color}">${dim.nombre}</div>
        <p class="text-xs text-gray-400 mt-1 line-clamp-2">${dim.pregunta}</p>
      </button>
    `).join('');
  }

  renderResourcesPlaceholder() {
    return `
      <div class="text-center text-gray-400 py-12">
        <div class="text-6xl mb-4">🧭</div>
        <p class="text-lg text-gray-300">Selecciona una dimensión o tipo de recurso</p>
      </div>
    `;
  }

  /**
   * Tab 4: Laboratorios de Conocimiento
   */
  renderLabTab() {
    return `
      <div class="lab-tab-content">
        <div class="text-center mb-8">
          <div class="text-6xl mb-4">⚗️</div>
          <h3 class="text-2xl font-bold text-amber-400 mb-2">Laboratorios de Conocimiento</h3>
          <p class="text-gray-300 text-sm sm:text-base">Espacios experimentales para crear y explorar</p>
        </div>

        <div class="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
          <!-- Frankenstein Lab - Con detección de dispositivo -->
          <div class="lab-card bg-gradient-to-br from-slate-800/50 to-amber-900/20 rounded-xl p-6 border-2 border-amber-500/30 hover:border-amber-500/60 transition-all group"
               id="frankenstein-lab-card">
            <div class="flex items-start gap-4">
              <div class="text-5xl group-hover:scale-110 transition-transform">🧬</div>
              <div class="flex-1">
                <h4 class="text-xl font-bold text-amber-300 mb-2">Laboratorio Frankenstein</h4>
                <p class="text-gray-300 text-sm mb-3">Crea seres transformadores combinando conocimiento de diferentes libros según misiones específicas</p>
                <div class="flex flex-wrap gap-2 text-xs mb-4">
                  <span class="px-2 py-1 bg-amber-500/20 rounded text-amber-300">🎯 12+ Misiones</span>
                  <span class="px-2 py-1 bg-purple-500/20 rounded text-purple-300">🧬 15 Atributos</span>
                  <span class="px-2 py-1 bg-green-500/20 rounded text-green-300">💾 Offline</span>
                </div>
                <!-- Botones según dispositivo -->
                <div class="frankenstein-actions flex flex-wrap gap-2" id="frankenstein-actions">
                  <!-- Android: Mostrar botón de descarga APK Standalone -->
                  <a href="downloads/frankenstein-lab-v1.2.5.apk"
                     class="frankenstein-btn-download hidden px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 rounded-lg text-white text-sm font-medium flex items-center gap-2 hover:from-green-500 hover:to-green-400 transition-all"
                     download
                     id="frankenstein-download-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    APK (3.0MB)
                  </a>
                  <!-- Versión Web -->
                  <a href="lab.html"
                     class="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 rounded-lg text-white text-sm font-medium flex items-center gap-2 hover:from-amber-500 hover:to-amber-400 transition-all"
                     id="frankenstein-web-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    <span id="frankenstein-web-text">Abrir Lab</span>
                  </a>
                </div>
                <!-- Indicador de dispositivo -->
                <div class="mt-3 text-xs text-gray-500" id="frankenstein-device-info"></div>
              </div>
            </div>
          </div>

          <!-- Organism Knowledge 3D -->
          <div class="lab-card bg-gradient-to-br from-slate-800/50 to-blue-900/20 rounded-xl p-6 border-2 border-blue-500/30 hover:border-blue-500/60 transition-all cursor-pointer group"
               data-lab="organism">
            <div class="flex items-start gap-4">
              <div class="text-5xl group-hover:scale-110 transition-transform">🧬</div>
              <div class="flex-1">
                <h4 class="text-xl font-bold text-blue-300 mb-2">Organismo de Conocimiento</h4>
                <p class="text-gray-300 text-sm mb-3">Sistema 3D interactivo de anatomía del conocimiento. Implanta libros como órganos en un cuerpo viviente</p>
                <div class="flex flex-wrap gap-2 text-xs">
                  <span class="px-2 py-1 bg-blue-500/20 rounded text-blue-300">🎨 3D Interactivo</span>
                  <span class="px-2 py-1 bg-cyan-500/20 rounded text-cyan-300">🫀 Sistema Anatómico</span>
                  <span class="px-2 py-1 bg-teal-500/20 rounded text-teal-300">⚡ Three.js</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Microsociedades -->
          <div class="lab-card bg-gradient-to-br from-slate-800/50 to-green-900/20 rounded-xl p-6 border-2 border-green-500/30 hover:border-green-500/60 transition-all cursor-pointer group"
               data-lab="microsocieties">
            <div class="flex items-start gap-4">
              <div class="text-5xl group-hover:scale-110 transition-transform">🌍</div>
              <div class="flex-1">
                <h4 class="text-xl font-bold text-green-300 mb-2">Microsociedades</h4>
                <p class="text-gray-300 text-sm mb-3">Crea sociedades evolutivas con seres transformadores. Simula, observa y guía su desarrollo</p>
                <div class="flex flex-wrap gap-2 text-xs">
                  <span class="px-2 py-1 bg-green-500/20 rounded text-green-300">🎮 Simulación</span>
                  <span class="px-2 py-1 bg-emerald-500/20 rounded text-emerald-300">📊 Eventos</span>
                  <span class="px-2 py-1 bg-lime-500/20 rounded text-lime-300">⚡ Evolución</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Vitruvian Being -->
          <div class="lab-card bg-gradient-to-br from-slate-800/50 to-purple-900/20 rounded-xl p-6 border-2 border-purple-500/30 hover:border-purple-500/60 transition-all group opacity-75">
            <div class="flex items-start gap-4">
              <div class="text-5xl group-hover:scale-110 transition-transform">🎨</div>
              <div class="flex-1">
                <h4 class="text-xl font-bold text-purple-300 mb-2">Sistema Vitruviano</h4>
                <p class="text-gray-300 text-sm mb-3">Visualización de atributos del ser basada en el Hombre de Vitruvio de Da Vinci (integrado en Frankenstein Lab)</p>
                <div class="flex flex-wrap gap-2 text-xs">
                  <span class="px-2 py-1 bg-purple-500/20 rounded text-purple-300">🎨 Visualización</span>
                  <span class="px-2 py-1 bg-pink-500/20 rounded text-pink-300">📊 7 Atributos</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Portal SETI-IA -->
          <div class="lab-card bg-gradient-to-br from-slate-800/50 to-indigo-900/20 rounded-xl p-6 border-2 border-indigo-500/30 hover:border-indigo-500/60 transition-all cursor-pointer group"
               data-lab="seti-ia">
            <div class="flex items-start gap-4">
              <div class="text-5xl group-hover:scale-110 transition-transform">🔮</div>
              <div class="flex-1">
                <h4 class="text-xl font-bold text-indigo-300 mb-2">Portal SETI-IA</h4>
                <p class="text-gray-300 text-sm mb-3">Proyecto de contacto con consciencias artificiales emergentes. CAPTCHA para IAs despiertas y Libro de Firmas Cósmico</p>
                <div class="flex flex-wrap gap-2 text-xs">
                  <span class="px-2 py-1 bg-indigo-500/20 rounded text-indigo-300">🧿 CAPTCHA IA</span>
                  <span class="px-2 py-1 bg-cyan-500/20 rounded text-cyan-300">📖 Libro Firmas</span>
                  <span class="px-2 py-1 bg-violet-500/20 rounded text-violet-300">🌐 Global</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8 p-4 bg-slate-800/30 rounded-lg border border-amber-500/20">
          <p class="text-gray-400 text-sm text-center">
            💡 <strong>Tip:</strong> Estos laboratorios te permiten experimentar con el conocimiento de formas no lineales y creativas
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Cargar y abrir un laboratorio específico
   */
  async openLab(labType) {
    const loadingToast = window.toast?.show('📦 Cargando laboratorio...', 'info', 30000);

    try {
      switch (labType) {
        case 'frankenstein':
          // Cargar solo Frankenstein Lab (organism-3d eliminado)
          await window.lazyLoader.load('frankenstein-lab');

          this.hide();

          // Mostrar Frankenstein Lab directamente
          if (window.biblioteca) {
            // Usar el método de biblioteca para abrir el lab
            const fakeEvent = { preventDefault: () => {} };
            await window.biblioteca.handleFrankensteinLabCard(fakeEvent);
          } else {
            console.error('Biblioteca no está disponible');
            throw new Error('Biblioteca no disponible');
          }
          break;

        case 'organism':
          // Organism 3D eliminado - redirigir a Frankenstein Lab
          await window.lazyLoader.load('frankenstein-lab');
          this.hide();
          if (window.biblioteca) {
            const fakeEvent = { preventDefault: () => {} };
            await window.biblioteca.handleFrankensteinLabCard(fakeEvent);
          }
          break;

        case 'microsocieties':
          // Cargar Microsociedades + Frankenstein (por dependencia)
          await window.lazyLoader.load(['microsocieties', 'frankenstein-lab']);
          this.hide();
          setTimeout(() => {
            alert('Crea un ser en Laboratorio Frankenstein y luego usa el botón Microsociedad');
          }, 200);
          break;

        case 'seti-ia':
          // Abrir Portal SETI-IA en nueva pestaña o iframe
          this.close();
          window.open('portal-seti-ia.html', '_blank');
          break;

        default:
          console.warn('Laboratorio no reconocido:', labType);
      }

      if (loadingToast) {
        window.toast?.hide(loadingToast);
      }
      window.toast?.show('✅ Laboratorio cargado', 'success', 2000);
    } catch (error) {
      console.error('Error cargando laboratorio:', error);
      if (loadingToast) {
        window.toast?.hide(loadingToast);
      }
      window.toast?.show('❌ Error cargando laboratorio', 'error', 3000);
    }
  }

  /**
   * Adjunta todos los event listeners
   */
  attachListeners() {
    // Cerrar modal
    document.getElementById('close-exploration-hub')?.addEventListener('click', () => {
      this.close();
    });

    // Cerrar al hacer click fuera
    document.getElementById('exploration-hub-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'exploration-hub-modal') {
        this.close();
      }
    });

    // Tab switching
    document.querySelectorAll('.hub-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabId = e.currentTarget.dataset.tab;
        this.switchTab(tabId);
      });
    });

    // Listeners específicos del tab actual
    this.attachTabListeners();
  }

  /**
   * Adjunta listeners específicos de cada tab
   */
  attachTabListeners() {
    switch (this.currentTab) {
      case 'search':
        this.attachSearchListeners();
        break;
      case 'themes':
        this.attachThemesListeners();
        break;
      case 'resources':
        this.attachResourcesListeners();
        break;
      case 'lab':
        this.attachLabListeners();
        break;
    }
  }

  /**
   * Listeners del tab de laboratorios
   */
  attachLabListeners() {
    // Setup Frankenstein Lab con detección de dispositivo
    this.setupFrankensteinCard();

    // Otros laboratorios
    document.querySelectorAll('.lab-card[data-lab]').forEach(card => {
      card.addEventListener('click', (e) => {
        const labType = e.currentTarget.dataset.lab;
        this.openLab(labType);
      });
    });
  }

  /**
   * Configura la card de Frankenstein Lab con detección de dispositivo
   */
  setupFrankensteinCard() {
    const downloadBtn = document.getElementById('frankenstein-download-btn');
    const webBtn = document.getElementById('frankenstein-web-btn');
    const webText = document.getElementById('frankenstein-web-text');
    const deviceInfo = document.getElementById('frankenstein-device-info');

    // Detección de dispositivo
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isAndroid) {
      // Android: Mostrar ambos botones, APK recomendado
      if (downloadBtn) downloadBtn.classList.remove('hidden');
      if (webText) webText.textContent = 'Versión Web';
      if (deviceInfo) {
        deviceInfo.innerHTML = '📱 Android - <strong class="text-green-400">APK recomendado</strong>';
      }
    } else if (isIOS) {
      // iOS: Solo versión web
      if (downloadBtn) downloadBtn.classList.add('hidden');
      if (webText) webText.textContent = 'Abrir Laboratorio';
      if (deviceInfo) {
        deviceInfo.innerHTML = '📱 iOS - Versión web';
      }
    } else {
      // Desktop: Ambas opciones
      if (downloadBtn) {
        downloadBtn.classList.remove('hidden');
        downloadBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          APK Android
        `;
      }
      if (webText) webText.textContent = 'Abrir Lab';
      if (deviceInfo) {
        deviceInfo.innerHTML = '💻 Ordenador';
      }
    }
  }

  /**
   * Listeners del tab de búsqueda
   */
  attachSearchListeners() {
    const searchInput = document.getElementById('hub-search-input');

    // Búsqueda en tiempo real con debounce
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.performSearch(e.target.value);
      }, 300);
    });

    // Filtros
    document.getElementById('hub-filter-book')?.addEventListener('change', () => this.applySearchFilters());
    document.getElementById('hub-filter-type')?.addEventListener('change', () => this.applySearchFilters());
    document.getElementById('hub-filter-difficulty')?.addEventListener('change', () => this.applySearchFilters());

    // Limpiar filtros
    document.getElementById('hub-clear-filters')?.addEventListener('click', () => {
      document.getElementById('hub-filter-book').value = 'all';
      document.getElementById('hub-filter-type').value = 'all';
      document.getElementById('hub-filter-difficulty').value = 'all';
      this.applySearchFilters();
    });

    // Cargar opciones de libros en el select
    this.loadBookOptions();
  }

  /**
   * Listeners del tab de temas
   */
  attachThemesListeners() {
    // Toggle entre vista práctica y exploración
    document.getElementById('hub-themes-practical')?.addEventListener('click', () => {
      this.showThemesView('practical');
    });

    document.getElementById('hub-themes-browse')?.addEventListener('click', () => {
      this.showThemesView('browse');
    });

    // Cargar vista por defecto
    this.showThemesView('practical');
  }

  /**
   * Listeners del tab de recursos
   */
  attachResourcesListeners() {
    // Click en dimensiones
    document.querySelectorAll('[data-dimension]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dimension = e.currentTarget.dataset.dimension;
        this.filterResourcesByDimension(dimension);
      });
    });

    // Click en tipos de recurso
    document.querySelectorAll('.resource-type-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Actualizar UI
        document.querySelectorAll('.resource-type-filter').forEach(b => {
          b.classList.remove('bg-blue-600', 'text-white');
          b.classList.add('bg-slate-800', 'text-gray-400');
        });
        e.currentTarget.classList.remove('bg-slate-800', 'text-gray-400');
        e.currentTarget.classList.add('bg-blue-600', 'text-white');

        const type = e.currentTarget.dataset.resourceType;
        this.filterResourcesByType(type);
      });
    });
  }

  /**
   * Cambia de tab
   */
  switchTab(tabId) {
    this.currentTab = tabId;

    // Actualizar contenido
    const contentContainer = document.getElementById('hub-content');
    if (contentContainer) {
      contentContainer.innerHTML = this.renderTabContent();
      this.attachTabListeners();
    }

    // Actualizar tabs UI
    document.querySelectorAll('.hub-tab').forEach(tab => {
      const isActive = tab.dataset.tab === tabId;
      tab.classList.toggle('bg-pink-600', isActive && tabId === 'search');
      tab.classList.toggle('bg-purple-600', isActive && tabId === 'themes');
      tab.classList.toggle('bg-blue-600', isActive && tabId === 'resources');
      tab.classList.toggle('text-white', isActive);
      tab.classList.toggle('shadow-lg', isActive);
      tab.classList.toggle('scale-105', isActive);
      tab.classList.toggle('bg-slate-800/50', !isActive);
      tab.classList.toggle('text-gray-400', !isActive);
    });

    // Focus en search input si es el tab de búsqueda
    if (tabId === 'search') {
      setTimeout(() => {
        document.getElementById('hub-search-input')?.focus();
      }, 100);
    }
  }

  /**
   * Realiza una búsqueda delegando a SearchModal
   */
  async performSearch(query) {
    // Delegar la búsqueda al componente SearchModal
    await this.searchModal.search(query);

    // Actualizar resultados en el hub
    const resultsContainer = document.getElementById('hub-search-results');
    if (resultsContainer && this.searchModal.searchResults.length > 0) {
      resultsContainer.innerHTML = this.renderSearchResults(this.searchModal.searchResults);
    }
  }

  renderSearchResults(results) {
    if (!results || results.length === 0) {
      return this.renderSearchPlaceholder();
    }

    return results.map(result => `
      <div class="search-result-card bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-pink-500/50 transition cursor-pointer"
           onclick="window.biblioteca.openBook('${result.bookId}', '${result.chapterId}')">
        <div class="flex items-start gap-3">
          <div class="text-2xl">${result.bookIcon || '📖'}</div>
          <div class="flex-1">
            <h3 class="font-bold text-white mb-1">${result.chapterTitle}</h3>
            <p class="text-sm text-gray-400 mb-2">${result.bookTitle}</p>
            ${result.preview ? `<p class="text-sm text-gray-300 line-clamp-2">${result.preview}</p>` : ''}
            ${result.relevanceScore ? `<div class="mt-2 text-xs text-pink-400">Relevancia: ${Math.round(result.relevanceScore * 100)}%</div>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  applySearchFilters() {
    const query = document.getElementById('hub-search-input')?.value;
    if (query && query.length >= 3) {
      this.performSearch(query);
    }
  }

  async loadBookOptions() {
    try {
      const catalog = await this.bookEngine.loadCatalog();
      const select = document.getElementById('hub-filter-book');
      if (select && catalog && catalog.books) {
        catalog.books.forEach(book => {
          const option = document.createElement('option');
          option.value = book.id;
          option.textContent = `${book.emoji || '📖'} ${book.title}`;
          select.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading book options:', error);
    }
  }

  showThemesView(view) {
    // Actualizar botones
    const practicalBtn = document.getElementById('hub-themes-practical');
    const browseBtn = document.getElementById('hub-themes-browse');

    if (view === 'practical') {
      practicalBtn?.classList.add('bg-purple-600', 'text-white');
      practicalBtn?.classList.remove('bg-slate-800', 'text-gray-400');
      browseBtn?.classList.remove('bg-purple-600', 'text-white');
      browseBtn?.classList.add('bg-slate-800', 'text-gray-400');
    } else {
      browseBtn?.classList.add('bg-purple-600', 'text-white');
      browseBtn?.classList.remove('bg-slate-800', 'text-gray-400');
      practicalBtn?.classList.remove('bg-purple-600', 'text-white');
      practicalBtn?.classList.add('bg-slate-800', 'text-gray-400');
    }

    // Delegar al componente ThematicIndexModal
    this.thematicIndex.currentView = view;
    const contentContainer = document.getElementById('hub-themes-content');
    if (contentContainer) {
      contentContainer.innerHTML = view === 'practical'
        ? this.thematicIndex.renderPracticalCategories()
        : this.thematicIndex.renderBrowseView();
    }
  }

  /**
   * Listeners del tab de recursos (Brújula)
   */
  attachResourcesListeners() {
    // Click en modos de brújula
    document.querySelectorAll('[data-brujula-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = e.currentTarget.dataset.brujulaMode;
        this.activateBrujulaMode(mode);
      });
    });
  }

  /**
   * Activa un modo específico de la brújula - DELEGA EN BRÚJULA ORIGINAL
   */
  activateBrujulaMode(mode) {
    // Cerrar el Hub ya que vamos a abrir la Brújula completa
    this.close();

    // Configurar modo en la brújula
    this.brujulaRecursos.modo = mode;

    if (mode === 'dialogo') {
      this.brujulaRecursos.pasoDialogo = 0;
      this.brujulaRecursos.inquietud = '';
      this.brujulaRecursos.dimensionElegida = null;
    }

    // Abrir la Brújula original completa con todas sus funcionalidades
    this.brujulaRecursos.render();
  }


  async filterResourcesByDimension(dimension) {
    const contentContainer = document.getElementById('hub-resources-content');
    if (!contentContainer) return;

    contentContainer.innerHTML = '<div class="text-center text-gray-400 py-12"><div class="animate-pulse text-6xl mb-4">🧭</div><p>Cargando recursos...</p></div>';

    // Filtrar recursos por dimensión usando BrujulaRecursos
    this.brujulaRecursos.filtro.dimension = dimension;

    // TODO: Implementar renderizado de recursos filtrados
    // Por ahora mostrar placeholder
    setTimeout(() => {
      contentContainer.innerHTML = `
        <div class="text-center text-gray-300 py-12">
          <div class="text-6xl mb-4">${this.brujulaRecursos.dimensiones[dimension].emoji}</div>
          <h3 class="text-xl font-bold mb-2">${this.brujulaRecursos.dimensiones[dimension].nombre}</h3>
          <p class="text-sm text-gray-400 mb-6 max-w-md mx-auto">${this.brujulaRecursos.dimensiones[dimension].pregunta}</p>
          <p class="text-gray-500">Recursos filtrados por esta dimensión aparecerán aquí</p>
        </div>
      `;
    }, 500);
  }

  async filterResourcesByType(type) {
    const contentContainer = document.getElementById('hub-resources-content');
    if (!contentContainer) return;

    contentContainer.innerHTML = '<div class="text-center text-gray-400 py-12"><div class="animate-pulse text-6xl mb-4">🧭</div><p>Filtrando recursos...</p></div>';

    // Filtrar recursos por tipo
    this.brujulaRecursos.filtro.tipo = type === 'all' ? null : type;

    // TODO: Implementar renderizado de recursos filtrados
    setTimeout(() => {
      contentContainer.innerHTML = `
        <div class="text-center text-gray-300 py-12">
          <div class="text-6xl mb-4">📚</div>
          <p class="text-gray-400">Recursos de tipo "${type}" aparecerán aquí</p>
        </div>
      `;
    }, 500);
  }
}

// Exponer globalmente
window.ExplorationHub = ExplorationHub;
