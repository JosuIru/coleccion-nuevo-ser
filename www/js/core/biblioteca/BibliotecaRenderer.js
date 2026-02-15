// ============================================================================
// BIBLIOTECA RENDERER - Renderizado de UI
// ============================================================================
// Módulo extraído de biblioteca.js para mejor organización

/**
 * Clase para gestionar todo el renderizado de la Biblioteca
 */
class BibliotecaRenderer {
  constructor(biblioteca) {
    this.biblioteca = biblioteca;
  }

  // ==========================================================================
  // HELPERS DE RENDERIZADO
  // ==========================================================================

  renderBotonAccion(configuracionBoton) {
    const bib = this.biblioteca;
    const textoLabel = configuracionBoton.labelKey
      ? bib.i18n.t(configuracionBoton.labelKey)
      : configuracionBoton.label;

    const tituloBoton = configuracionBoton.labelKey
      ? bib.i18n.t(configuracionBoton.labelKey)
      : configuracionBoton.label;

    // 🔧 v2.9.401: Usar data-lucide igual que settings-modal
    let iconoHTML;
    if (configuracionBoton.iconDynamic) {
      const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('theme-dark');
      const themeIcon = isDark ? 'sun' : 'moon';
      iconoHTML = `<span id="theme-icon-bib"><i data-lucide="${themeIcon}" class="w-5 h-5"></i></span>`;
    } else {
      const iconName = configuracionBoton.icon;
      if (configuracionBoton.iconClass) {
        iconoHTML = `<span class="${configuracionBoton.iconClass}"><i data-lucide="${iconName}" class="w-5 h-5"></i></span>`;
      } else {
        iconoHTML = `<i data-lucide="${iconName}" class="w-5 h-5"></i>`;
      }
    }

    const labelHTML = configuracionBoton.labelDynamic
      ? `<span class="hidden sm:inline" id="theme-label-bib">${window.themeHelper?.getThemeLabel() || 'Tema'}</span>`
      : `<span class="hidden sm:inline">${textoLabel}</span>`;

    const clasesAdicionales = configuracionBoton.cssClass || '';

    return `
      <button id="${configuracionBoton.id}"
              class="${clasesAdicionales} px-3 sm:px-4 py-2.5 bg-gradient-to-r ${configuracionBoton.gradient} hover:${configuracionBoton.hoverGradient} text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
              title="${tituloBoton}"
              aria-label="${tituloBoton}">
        ${iconoHTML}
        ${labelHTML}
      </button>
    `;
  }

  renderBotonesAccionGlobal() {
    return window.BIBLIOTECA_CONFIG.BOTONES_ACCION_GLOBAL
      .map(boton => this.renderBotonAccion(boton))
      .join('\n');
  }

  renderHeader() {
    const datosLibreria = this.biblioteca.bookEngine.catalog.library;

    return `
      <div class="header mb-6 sm:mb-8">
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 text-gradient flex items-center justify-center gap-3">
          ${Icons.library(48)} ${datosLibreria.name}
        </h1>
        <p class="text-lg sm:text-xl text-gray-700 dark:text-gray-300">
          ${datosLibreria.tagline}
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Por ${datosLibreria.authors.join(' & ')}
        </p>

        <!-- Global Actions -->
        <div class="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8">
          ${this.renderBotonesPrimarios()}
          ${this.renderMenuDropdown()}
        </div>
      </div>
    `;
  }

  renderBotonesPrimarios() {
    return window.BIBLIOTECA_CONFIG.BOTONES_PRIMARIOS
      .map(boton => this.renderBotonAccion(boton))
      .join('\n');
  }

  renderMenuDropdown() {
    return `
      <div class="relative">
        <button id="more-options-btn-bib"
                class="px-3 sm:px-4 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-semibold shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                title="Más opciones">
          <i data-lucide="more-vertical" class="w-5 h-5"></i>
          <span class="hidden sm:inline">Más</span>
        </button>

        <!-- Dropdown Menu -->
        <div id="more-options-menu-bib" class="hidden absolute right-0 mt-3 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden backdrop-blur-sm">
          <div class="py-1">
            ${this.renderOpcionesMenuDropdown()}
          </div>
        </div>
      </div>
    `;
  }

  renderOpcionesMenuDropdown() {
    const bib = this.biblioteca;
    const isAdmin = bib._adminCache === true;
    const isAuthenticated = !!window.authHelper?.getCurrentUser();

    const botonesFiltrados = window.BIBLIOTECA_CONFIG.BOTONES_SECUNDARIOS.filter(boton => {
      if (boton.adminOnly && !isAdmin) return false;
      if (boton.requiresAuth && !isAuthenticated) return false;
      return true;
    });

    const grupos = {};
    const ordenGrupos = ['cuenta', 'premium', 'app', 'info', 'sesion', 'admin'];
    botonesFiltrados.forEach(boton => {
      const grupo = boton.group || 'otros';
      if (!grupos[grupo]) grupos[grupo] = [];
      grupos[grupo].push(boton);
    });

    let html = '';
    let primerGrupo = true;

    ordenGrupos.forEach(nombreGrupo => {
      const botonesGrupo = grupos[nombreGrupo];
      if (!botonesGrupo || botonesGrupo.length === 0) return;

      if (!primerGrupo) {
        html += '<div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>';
      }
      primerGrupo = false;

      botonesGrupo.forEach(boton => {
        html += this.renderBotonDropdown(boton);
      });
    });

    return html;
  }

  renderBotonDropdown(boton) {
    const bib = this.biblioteca;
    const textoLabel = boton.labelKey
      ? bib.i18n.t(boton.labelKey)
      : boton.label;

    // 🔧 v2.9.401: Usar EXACTAMENTE el mismo formato que settings-modal (data-lucide + text-color)
    const iconColorMap = {
      'user': 'text-indigo-400',
      'settings': 'text-slate-400',
      'crown': 'text-amber-400',
      'download': 'text-emerald-400',
      'language': 'text-blue-400',
      'info': 'text-cyan-400',
      'shield': 'text-red-400',
      'log-out': 'text-red-400'
    };

    // Mapear nombres de config a nombres de Lucide
    const lucideNameMap = {
      'user': 'user',
      'settings': 'settings',
      'crown': 'crown',
      'download': 'download',
      'language': 'globe',
      'info': 'info',
      'shield': 'shield',
      'log-out': 'log-out'
    };

    let iconoHTML;
    if (boton.iconDynamic) {
      const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('theme-dark');
      const themeIcon = isDark ? 'sun' : 'moon';
      iconoHTML = `<span id="theme-icon-menu"><i data-lucide="${themeIcon}" class="w-5 h-5 text-violet-400"></i></span>`;
    } else {
      const lucideName = lucideNameMap[boton.icon] || boton.icon;
      const colorClass = iconColorMap[boton.icon] || 'text-gray-400';
      iconoHTML = `<i data-lucide="${lucideName}" class="w-5 h-5 ${colorClass}"></i>`;
    }

    const labelHTML = boton.labelDynamic
      ? `<span id="theme-label-menu">${window.themeHelper?.getThemeLabel() || 'Tema'}</span>`
      : textoLabel;

    const estiloEspecial = boton.id === 'logout-btn-bib'
      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
      : 'text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600';

    return `
      <button id="${boton.id}"
              class="w-full px-4 py-3 text-left ${estiloEspecial} transition-all duration-200 flex items-center gap-3 font-medium group"
              title="${textoLabel}"
              aria-label="${textoLabel}">
        <span class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-white dark:group-hover:bg-gray-600 transition-colors duration-200">${iconoHTML}</span>
        <span class="group-hover:translate-x-1 transition-transform duration-200">${labelHTML}</span>
      </button>
    `;
  }

  // ==========================================================================
  // RENDERIZADO PRINCIPAL
  // ==========================================================================

  render() {
    const bib = this.biblioteca;
    const contenedorPrincipal = document.getElementById('biblioteca-view');
    if (!contenedorPrincipal) return;

    const isMobile = (() => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileUA = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent.toLowerCase());
      if (isTablet && width >= 768) return false;
      return (isMobileUA && width < 768) || width < 480;
    })();

    const progresoGlobal = bib.bookEngine.getGlobalProgress();
    const tieneProgreso = progresoGlobal.totalRead > 0;

    const htmlCompleto = `
      <div class="biblioteca-container min-h-screen p-4 sm:p-6 ${isMobile ? 'has-bottom-nav' : ''}">
        ${this.renderHeader()}
        ${tieneProgreso ? this.renderCurrentJourney() : ''}
        ${this.renderDailyPractice()}
        ${tieneProgreso ? this.renderGlobalStats() : ''}
        ${this.renderExploreLibrary()}
        ${this.renderToolsSection()}
        ${this.renderFutureBooks()}
        ${this.renderAbout()}
      </div>
      ${this.renderBottomNav()}
    `;

    contenedorPrincipal.innerHTML = htmlCompleto;

    // 🔧 v2.9.401: Inicializar Lucide (Icons.init() ya lo hace internamente)
    if (window.lucide) {
      lucide.createIcons();
    }

    this.populateBooksGrid();

    if (isMobile) {
      requestAnimationFrame(() => {
        const container = document.querySelector('.biblioteca-container');
        if (container) {
          const bottomNav = document.getElementById('biblioteca-bottom-nav');
          const padding = bottomNav ? bottomNav.offsetHeight + 20 : 140;
          container.style.paddingBottom = `${padding}px`;
        }
      });
    }

    this.attachExploreLibraryListeners();
    this.attachToolsSectionListeners();
    this.renderPracticeWidget();
  }

  async renderPracticeWidget(attempt = 0, startTime = Date.now()) {
    const bib = this.biblioteca;
    const MAX_RETRIES = 5;
    const TIMEOUT_MS = 5000;

    if (Date.now() - startTime > TIMEOUT_MS) {
      logger.warn('[BibliotecaRenderer] Practice widget timeout después de 5s');
      const container = document.getElementById('practice-widget-container');
      if (container) {
        container.innerHTML = `
          <div class="text-center text-gray-500 text-sm py-4">
            <p>El sistema de prácticas no está disponible temporalmente.</p>
            <button onclick="location.reload()" class="mt-2 text-cyan-400 hover:text-cyan-300 underline">
              Recargar página
            </button>
          </div>
        `;
      }
      return;
    }

    if (attempt >= MAX_RETRIES) {
      const container = document.getElementById('practice-widget-container');
      if (container) {
        container.style.display = 'none';
      }
      return;
    }

    if (!window.practiceLibrary || !window.practiceRecommender) {
      await new Promise(resolve => bib.utils.setTimeout(resolve, 200));
      return this.renderPracticeWidget(attempt + 1, startTime);
    }

    const container = document.getElementById('practice-widget-container');
    if (!container) return;

    try {
      const widgetHTML = await window.practiceWidget.render();
      container.innerHTML = widgetHTML;
      window.practiceWidget.attachEventListeners(container);
    } catch (error) {
      logger.error('[BibliotecaRenderer] Error rendering practice widget:', error);
      container.innerHTML = `
        <div class="text-center text-gray-500 text-sm py-4">
          <p>Error al cargar el sistema de prácticas.</p>
          <button onclick="location.reload()" class="mt-2 text-cyan-400 hover:text-cyan-300 underline">
            Recargar página
          </button>
        </div>
      `;
    }
  }

  renderBottomNav() {
    const activeTab = window.StorageHelper?.get('biblioteca-active-tab', 'inicio') || 'inicio';

    return `
      <nav class="app-bottom-nav" id="biblioteca-bottom-nav">
        <button class="app-bottom-nav-tab ${activeTab === 'inicio' ? 'active' : ''}" data-tab="inicio" onclick="window.biblioteca?.scrollToTop()">
          <span class="app-bottom-nav-icon">🏠</span>
          <span class="app-bottom-nav-label">Inicio</span>
        </button>
        <button class="app-bottom-nav-tab ${activeTab === 'libros' ? 'active' : ''}" data-tab="libros" onclick="window.biblioteca?.scrollToBooks()">
          <span class="app-bottom-nav-icon">📚</span>
          <span class="app-bottom-nav-label">Libros</span>
        </button>
        <button class="app-bottom-nav-tab ${activeTab === 'practicas' ? 'active' : ''}" data-tab="practicas" onclick="window.biblioteca?.openPracticeLibrary()">
          <span class="app-bottom-nav-icon">🧘</span>
          <span class="app-bottom-nav-label">Prácticas</span>
        </button>
        <button class="app-bottom-nav-tab ${activeTab === 'herramientas' ? 'active' : ''}" data-tab="herramientas" onclick="window.biblioteca?.openToolsMenu()">
          <span class="app-bottom-nav-icon">🛠️</span>
          <span class="app-bottom-nav-label">Herramientas</span>
        </button>
        <button class="app-bottom-nav-tab ${activeTab === 'perfil' ? 'active' : ''}" data-tab="perfil" onclick="window.biblioteca?.openProfileMenu()">
          <span class="app-bottom-nav-icon">👤</span>
          <span class="app-bottom-nav-label">Perfil</span>
        </button>
      </nav>
    `;
  }

  // ==========================================================================
  // SECCIONES CONTEXTUALES
  // ==========================================================================

  renderGlobalStats() {
    const bib = this.biblioteca;
    const progresoGlobal = bib.bookEngine.getGlobalProgress();

    return `
      <div class="global-stats mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-300 dark:border-blue-700/30">
        <h3 class="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          ${bib.i18n.t('library.progress')}
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div class="stat">
            <div class="text-2xl sm:text-3xl font-bold text-cyan-600 dark:text-cyan-300">${progresoGlobal.totalRead}</div>
            <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-300">${bib.i18n.t('library.chaptersRead')}</div>
          </div>
          <div class="stat">
            <div class="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-300">${progresoGlobal.totalChapters}</div>
            <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-300">${bib.i18n.t('library.totalChapters')}</div>
          </div>
          <div class="stat">
            <div class="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-300">${progresoGlobal.percentage}%</div>
            <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-300">${bib.i18n.t('library.completed')}</div>
          </div>
          <div class="stat">
            <div class="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-300">${progresoGlobal.booksStarted}</div>
            <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-300">${bib.i18n.t('library.booksStarted')}</div>
          </div>
        </div>
        <div class="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-full mt-4 overflow-hidden">
          <div class="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
               style="width: ${progresoGlobal.percentage}%"></div>
        </div>
      </div>
    `;
  }

  renderCurrentJourney() {
    const bib = this.biblioteca;
    const librosEnProgreso = bib.bookEngine.catalog.books
      .filter(libro => {
        const progreso = bib.bookEngine.getProgress(libro.id);
        return progreso.chaptersRead > 0 && progreso.percentage < 100;
      })
      .sort((libroA, libroB) => {
        const progresoA = bib.bookEngine.getProgress(libroA.id);
        const progresoB = bib.bookEngine.getProgress(libroB.id);
        return progresoB.percentage - progresoA.percentage;
      });

    if (librosEnProgreso.length === 0) return '';

    const libroActual = librosEnProgreso[0];
    const progresoLibro = bib.bookEngine.getProgress(libroActual.id);
    const siguienteCapitulo = bib.utils.getSiguienteCapitulo(libroActual.id);

    return `
      <div class="current-journey-section mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl bg-gradient-to-r from-cyan-100 to-purple-100 dark:from-cyan-900/20 dark:to-purple-900/20 border border-cyan-300 dark:border-cyan-700/30">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">📖</span>
          <h3 class="text-xl sm:text-2xl font-bold text-cyan-600 dark:text-cyan-300">Tu Camino Actual</h3>
        </div>

        <div class="flex flex-col sm:flex-row items-start gap-4">
          <div class="flex-1">
            <div class="flex items-start gap-3 mb-3">
              <div class="w-12 h-12 flex items-center justify-center rounded-lg" style="background: ${libroActual.color}20; color: ${libroActual.color}">
                ${Icons.getBookIcon(libroActual.id, 32, libroActual.color)}
              </div>
              <div>
                <h4 class="text-lg font-bold text-gray-900 dark:text-white">${libroActual.title}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">${libroActual.subtitle}</p>
              </div>
            </div>

            <div class="mb-3">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-600 dark:text-gray-400">${progresoLibro.chaptersRead} de ${progresoLibro.totalChapters} capítulos</span>
                <span class="font-semibold text-cyan-600 dark:text-cyan-400">${progresoLibro.percentage}%</span>
              </div>
              <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full transition-all duration-500 rounded-full"
                     style="width: ${progresoLibro.percentage}%; background: linear-gradient(90deg, ${libroActual.color}, ${libroActual.secondaryColor || libroActual.color})"></div>
              </div>
            </div>

            ${siguienteCapitulo ? `
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Próximo: <span class="text-gray-800 dark:text-gray-200">${siguienteCapitulo.title}</span>
              </p>
            ` : ''}
          </div>

          <button onclick="window.biblioteca?.openBook('${libroActual.id}')"
                  class="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                  style="background: linear-gradient(135deg, ${libroActual.color}, ${libroActual.secondaryColor || libroActual.color})">
            ${Icons.book(18)} Continuar leyendo
          </button>
        </div>
      </div>
    `;
  }

  renderStreakWidget() {
    if (!window.streakSystem) return '';
    return window.streakSystem.renderWidget();
  }

  renderDailyPractice() {
    const bib = this.biblioteca;
    const streakWidget = this.renderStreakWidget();

    const herramientasDelDia = [
      { titulo: 'Principio del Reconocimiento', categoria: 'Filosofía', icono: '💡', descripcion: 'Explora cómo el reconocimiento mutuo transforma las relaciones humanas', libroId: 'filosofia-nuevo-ser', accion: 'Leer capítulo' },
      { titulo: 'Transición Consciente', categoria: 'Teoría', icono: '🔄', descripcion: 'Comprende los mecanismos de cambio sistémico en comunidades', libroId: 'manual-transicion', accion: 'Explorar' },
      { titulo: 'Estructura de Microsociedad', categoria: 'Comunidad', icono: '🏛️', descripcion: 'Diseña una estructura organizativa basada en el reconocimiento', libroId: 'toolkit-transicion', accion: 'Ver herramienta' },
      { titulo: 'Resolución de Conflictos', categoria: 'Social', icono: '🤝', descripcion: 'Aplica el diálogo transformativo en situaciones de tensión', libroId: 'guia-acciones', accion: 'Practicar' },
      { titulo: 'Herramientas para Educadores', categoria: 'Educación', icono: '🎓', descripcion: 'Integra los principios del Nuevo Ser en contextos educativos', libroId: 'ahora-instituciones', accion: 'Descubrir' },
      { titulo: 'Diálogo con la Máquina', categoria: 'IA y Ética', icono: '🤖', descripcion: 'Reflexiona sobre la relación humano-IA desde el reconocimiento', libroId: 'dialogos-maquina', accion: 'Leer' },
      { titulo: 'Práctica Radical', categoria: 'Interior', icono: '🌀', descripcion: 'Ejercicio para anclarte en el presente y actuar desde la claridad', libroId: 'practicas-radicales', accion: 'Practicar' },
      { titulo: 'Conexión con la Tierra', categoria: 'Ecología', icono: '🌍', descripcion: 'Reconecta con los ritmos naturales como base de la transformación', libroId: 'tierra-que-despierta', accion: 'Explorar' }
    ];

    const userHistory = bib.utils.getUserPracticeHistory();
    let herramientaHoy;

    if (Object.keys(userHistory).length > 0) {
      herramientaHoy = bib.utils.findLeastUsedTool(herramientasDelDia, userHistory);
      logger.debug('[BibliotecaRenderer] Herramienta del día: personalizada según historial');
    } else {
      const indiceHerramienta = new Date().getDate() % herramientasDelDia.length;
      herramientaHoy = herramientasDelDia[indiceHerramienta];
      logger.debug('[BibliotecaRenderer] Herramienta del día: rotación por fecha');
    }

    return `
      ${streakWidget}
      <div class="daily-practice-section mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-slate-800/50 dark:to-indigo-900/30 border border-indigo-300 dark:border-indigo-700/30">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">${herramientaHoy.icono}</span>
          <h3 class="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-300">Herramienta del Día</h3>
          <span class="ml-auto text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30">${herramientaHoy.categoria}</span>
        </div>

        <div class="flex flex-col sm:flex-row items-start gap-4">
          <div class="flex-1">
            <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-1">${herramientaHoy.titulo}</h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${herramientaHoy.descripcion}</p>
          </div>

          <button onclick="window.biblioteca?.openDailyPractice('${herramientaHoy.libroId}')"
                  class="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-2">
            ${herramientaHoy.accion} →
          </button>
        </div>

        <div class="mt-4 pt-4 border-t border-indigo-700/30 dark:border-indigo-700/30 border-indigo-300/50">
          <p class="text-xs text-gray-600 dark:text-gray-500 mb-2">Áreas de transformación:</p>
          <div class="flex flex-wrap gap-2">
            <span class="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-gray-400">🏛️ Comunidades</span>
            <span class="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-gray-400">🎓 Educación</span>
            <span class="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-gray-400">🤝 Conflictos</span>
            <span class="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-gray-400">🏢 Organizaciones</span>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // EXPLORAR BIBLIOTECA
  // ==========================================================================

  renderExploreLibrary() {
    return `
      <div class="explore-library-section mb-6 sm:mb-8">
        <button id="explore-library-toggle"
                class="explore-library-header w-full expanded"
                aria-expanded="true">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📚</span>
            <div class="text-left">
              <h3 class="text-xl font-bold text-white">Explorar Biblioteca</h3>
              <p class="text-sm text-gray-400">${this.biblioteca.bookEngine.catalog.books.filter(b => b.status === 'published').length} libros disponibles</p>
            </div>
          </div>
          <svg class="chevron w-6 h-6 text-gray-400 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        <div id="explore-library-content" class="explore-library-content expanded">
          ${this.renderSearchAndFilters()}
          ${this.renderBooksGridHTML()}
        </div>
      </div>
    `;
  }

  attachExploreLibraryListeners() {
    const bib = this.biblioteca;
    const toggleBtn = document.getElementById('explore-library-toggle');
    const contentDiv = document.getElementById('explore-library-content');

    if (toggleBtn && contentDiv) {
      bib.eventManager.addEventListener(toggleBtn, 'click', () => {
        const isExpanded = toggleBtn.classList.toggle('expanded');
        contentDiv.classList.toggle('expanded');
        toggleBtn.setAttribute('aria-expanded', isExpanded);
      });
    }
  }

  renderSearchAndFilters() {
    const bib = this.biblioteca;
    const opcionesCategorias = window.BIBLIOTECA_CONFIG.CATEGORIAS_FILTRO
      .map(categoria => {
        const labelTexto = categoria.value === 'all'
          ? bib.i18n.t(categoria.label)
          : categoria.label;
        return `<option value="${categoria.value}">${labelTexto}</option>`;
      })
      .join('');

    return `
      <div class="search-filters mb-6 space-y-4">
        <div class="relative">
          <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>
          <input
            type="text"
            id="search-input"
            placeholder="Buscar por título o autor..."
            class="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
          />
        </div>

        <div class="flex flex-wrap gap-3">
          <select id="status-filter" class="flex-1 min-w-[140px] px-4 py-2.5 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:border-cyan-500 focus:outline-none cursor-pointer transition-all">
            <option value="all">📚 Todos</option>
            <option value="in-progress">📖 En progreso</option>
            <option value="not-started">✨ Sin empezar</option>
            <option value="completed">✅ Completados</option>
          </select>

          <select id="category-filter" class="flex-1 min-w-[140px] px-4 py-2.5 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:border-cyan-500 focus:outline-none cursor-pointer transition-all">
            ${opcionesCategorias}
          </select>

          <select id="duration-filter" class="flex-1 min-w-[140px] px-4 py-2.5 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:border-cyan-500 focus:outline-none cursor-pointer transition-all">
            <option value="all">⏱️ Cualquier duración</option>
            <option value="short">⚡ Corto (≤5h)</option>
            <option value="medium">📖 Medio (6-10h)</option>
            <option value="long">📚 Largo (&gt;10h)</option>
          </select>
        </div>
      </div>
    `;
  }

  renderBooksGridHTML() {
    return '<div id="books-grid-container" class="books-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"></div>';
  }

  populateBooksGrid() {
    const contenedorGrid = document.getElementById('books-grid-container');
    if (!contenedorGrid) return;

    const libros = this.biblioteca.filters.getFilteredBooks();
    const fragment = document.createDocumentFragment();

    libros.forEach(libro => {
      const card = this.createBookCard(libro);
      fragment.appendChild(card);
    });

    contenedorGrid.innerHTML = '';
    contenedorGrid.appendChild(fragment);
  }

  createBookCard(libro) {
    const bib = this.biblioteca;
    const card = document.createElement('div');
    card.className = 'book-card group relative rounded-xl border-2 overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer hover:border-opacity-80 bg-white dark:bg-slate-900/60 backdrop-blur-sm';
    card.style.borderColor = `${libro.color}40`;
    card.dataset.bookId = libro.id;

    const progresoLibro = bib.bookEngine.getProgress(libro.id);
    const libroIniciado = progresoLibro.chaptersRead > 0;

    const safeColor = Sanitizer.sanitizeAttribute(libro.color);
    const safeSecondaryColor = Sanitizer.sanitizeAttribute(libro.secondaryColor);
    const safeTitle = Sanitizer.escapeHtml(libro.title);
    const safeSubtitle = Sanitizer.escapeHtml(libro.subtitle);
    const safeDescription = libro.description ? Sanitizer.escapeHtml(libro.description) : '';

    card.innerHTML = `
      <div class="absolute inset-0 bg-gradient-to-br opacity-5 dark:opacity-10 group-hover:opacity-15 dark:group-hover:opacity-20 transition-opacity duration-300"
           style="background: linear-gradient(135deg, ${safeColor}, ${safeSecondaryColor})"></div>

      <div class="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none"
           style="background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg=='); background-repeat: repeat;"></div>

      <div class="relative p-4 sm:p-6">
        <div class="flex items-start justify-between mb-3 sm:mb-4">
          <div class="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center" style="color: ${safeColor}">
            ${Icons.getBookIcon(libro.id, 48, safeColor)}
          </div>
          <div class="flex flex-col items-end gap-2">
            ${libro.status === 'published' ?
              `<span class="px-2 py-1 text-xs font-semibold rounded bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-500/30">${bib.i18n.t('library.published')}</span>` :
              `<span class="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-500/30">${bib.i18n.t('library.comingSoon')}</span>`
            }
            ${libroIniciado ?
              `<span class="px-2 py-1 text-xs font-semibold rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30">${bib.i18n.t('library.inProgress')}</span>` :
              `<span class="px-2 py-1 text-xs font-semibold rounded bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30">${bib.i18n.t('library.notStarted')}</span>`
            }
          </div>
        </div>

        <h3 class="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-[${safeColor}] transition">
          ${safeTitle}
        </h3>

        <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
          ${safeSubtitle}
        </p>

        ${safeDescription ? `
          <div class="book-description-wrapper mb-3">
            <p class="book-description text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed" data-expanded="false">
              ${safeDescription}
            </p>
            ${safeDescription.length > 120 ? `
              <button class="read-more-btn text-xs font-medium mt-1 transition-colors hover:underline"
                      style="color: ${safeColor}"
                      data-action="toggle-description"
                      aria-expanded="false">
                Leer más ↓
              </button>
            ` : ''}
          </div>
        ` : ''}

        ${this.renderComplementaryInfo(libro)}

        <div class="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
          <span class="flex items-center gap-1">${Icons.book(14)} ${libro.chapters} ${bib.i18n.t('library.chapters')}</span>
          <span class="flex items-center gap-1">${Icons.clock(14)} ${libro.estimatedReadTime}</span>
        </div>

        ${libroIniciado ? `
          <div class="mb-3 sm:mb-4">
            <div class="flex justify-between text-xs mb-1 text-gray-700 dark:text-gray-300">
              <span>${progresoLibro.chaptersRead} ${bib.i18n.t('progress.of')} ${progresoLibro.totalChapters} ${bib.i18n.t('library.chapters')}</span>
              <span class="font-semibold">${progresoLibro.percentage}%</span>
            </div>
            <div class="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
              <div class="h-full transition-all duration-500 rounded-full"
                   style="width: ${progresoLibro.percentage}%; background: linear-gradient(90deg, ${libro.color}, ${libro.secondaryColor || libro.color})"></div>
            </div>
          </div>
        ` : ''}

        <div class="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          ${(libro.tags || []).slice(0, 3).map(etiqueta =>
            `<span class="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200">#${etiqueta}</span>`
          ).join('')}
        </div>

        <button class="w-full py-3 sm:py-4 px-4 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 text-white shadow-md min-h-[48px]"
                style="background: linear-gradient(135deg, ${libro.color}, ${libro.secondaryColor || libro.color})"
                data-action="open-book"
                data-book-id="${libro.id}">
          ${libroIniciado ? `${Icons.book(18)} ${bib.i18n.t('library.continue')}` : `${Icons.zap(18)} ${bib.i18n.t('library.start')}`}
        </button>

        <div class="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2 text-base sm:text-sm text-gray-600 dark:text-gray-400">
          ${libro.features.meditations ? `<span class="px-1.5 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700/30 transition cursor-help" title="Meditaciones" aria-label="Meditaciones">${Icons.meditation(18)}</span>` : ''}
          ${libro.features.exercises ? `<span class="px-1.5 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700/30 transition cursor-help" title="Ejercicios" aria-label="Ejercicios">${Icons.edit(18)}</span>` : ''}
          ${libro.features.aiChat ? `<span class="px-1.5 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700/30 transition cursor-help" title="Chat IA" aria-label="Chat IA">${Icons.bot(18)}</span>` : ''}
          ${libro.features.timeline ? `<span class="px-1.5 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700/30 transition cursor-help" title="Timeline" aria-label="Timeline">${Icons.calendar(18)}</span>` : ''}
          ${libro.features.audiobook ? `<span class="px-1.5 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700/30 transition cursor-help" title="Audioreader" aria-label="Audioreader">${Icons.volume(18)}</span>` : ''}
          ${libro.features.actionTracker ? `<span class="px-1.5 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700/30 transition cursor-help" title="Tracker Acciones" aria-label="Tracker Acciones">${Icons.zap(18)}</span>` : ''}
        </div>
      </div>
    `;

    return card;
  }

  renderComplementaryInfo(book) {
    const relacionLibro = window.BIBLIOTECA_CONFIG.RELACIONES_COMPLEMENTARIAS[book.id];
    if (!relacionLibro) return '';

    if (relacionLibro.type === 'complements') {
      return `
        <div class="mb-3 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50">
          <p class="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
            ${Icons.link(12)}
            <span>Complementa a: <strong class="text-gray-800 dark:text-gray-200">${relacionLibro.targetTitle}</strong></span>
          </p>
        </div>
      `;
    }

    if (relacionLibro.type === 'hasGuides') {
      const listaGuias = relacionLibro.guides
        .map(guia => `<span class="inline-flex items-center gap-1">${guia.title}</span>`)
        .join(', ');

      return `
        <div class="mb-3 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50">
          <p class="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2 flex-wrap">
            ${Icons.sparkles(12)}
            <span>Guías: <strong class="text-gray-800 dark:text-gray-200">${listaGuias}</strong></span>
          </p>
        </div>
      `;
    }

    return '';
  }

  // ==========================================================================
  // TOOLS SECTION
  // ==========================================================================

  renderToolsSection() {
    const bib = this.biblioteca;
    const herramientas = window.BIBLIOTECA_CONFIG.HERRAMIENTAS_ECOSISTEMA;

    if (!herramientas || herramientas.length === 0) return '';

    let html = `
      <div class="tools-section mb-8 sm:mb-12 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-900/20 via-teal-900/10 to-cyan-900/20 border border-emerald-700/30">
        <button id="tools-section-toggle"
                class="tools-section-header w-full"
                aria-expanded="false">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-emerald-500/20">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
            </div>
            <div class="text-left">
              <h3 class="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-300">${bib.i18n.t('library.tools') || 'Herramientas y Aplicaciones'}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">Aplicaciones web complementarias del ecosistema Nuevo Ser</p>
            </div>
          </div>
          <svg class="chevron w-6 h-6 text-gray-400 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        <div id="tools-section-content" class="tools-section-content">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
    `;

    herramientas.forEach(herramienta => {
      // 🔧 FIX v2.9.384: Permitir herramientas con handler/isBook en lugar de url
      const hasValidAction = herramienta.url || herramienta.handler || herramienta.isBook;
      if (!herramienta || !herramienta.name || !herramienta.icon || !hasValidAction) {
        logger.warn('[BibliotecaRenderer] Herramienta con datos incompletos, saltando:', herramienta);
        return;
      }

      html += this.renderToolCard(herramienta);
    });

    html += '</div></div></div>';
    return html;
  }

  renderToolCard(herramienta) {
    const isInternal = herramienta.isInternal || false;
    const isNew = herramienta.isNew || false;
    const badgeText = isNew ? '✨ Nuevo' : (isInternal ? '🎮 Juego' : '🌐 Web App');

    let colorTheme = 'emerald';
    if (herramienta.id === 'frankenstein-lab') colorTheme = 'purple';
    else if (herramienta.id === 'cosmos-navigation') colorTheme = 'indigo';
    else if (herramienta.id === 'coleccion-nuevo-ser') colorTheme = 'pink';
    else if (herramienta.id === 'truk') colorTheme = 'blue';
    else if (herramienta.id === 'educators-kit') colorTheme = 'amber';
    else if (herramienta.id === 'ai-practice-generator') colorTheme = 'violet';
    else if (herramienta.id === 'transition-map') colorTheme = 'teal';

    const colorMap = this.getToolColorMap();
    const colors = colorMap[colorTheme];

    const wrapperTag = (isInternal || herramienta.hasApk) ? 'div' : 'a';
    const wrapperAttrs = isInternal
      ? `data-tool-handler="${herramienta.handler}" data-tool-id="${herramienta.id}"`
      : (herramienta.hasApk ? '' : `href="${herramienta.url}" target="_blank" rel="noopener noreferrer"`);

    return `
      <${wrapperTag} ${wrapperAttrs}
         class="tool-card group relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${colors.hoverShadow} cursor-pointer block bg-white dark:bg-slate-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-slate-700/50 ${colors.hoverBorderColor}">

        <div class="relative p-4 sm:p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="p-3 rounded-xl bg-gradient-to-br ${colors.gradientFrom} border-2 ${colors.borderColor}">
              <span class="text-4xl">${herramienta.icon}</span>
            </div>
            <span class="px-3 py-1 text-xs font-semibold rounded-full ${colors.badgeBg} ${colors.badgeText} border ${colors.badgeBorder}">
              ${badgeText}
            </span>
          </div>

          <h4 class="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-white ${colors.hoverTextColor} transition">
            ${herramienta.name}
          </h4>

          <p class="text-sm mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
            ${herramienta.description}
          </p>

          <div class="flex flex-wrap gap-2 mb-4">
            ${herramienta.tags.map(tag =>
              `<span class="px-2 py-1 text-xs rounded-full ${colors.tagBg} ${colors.tagText} border ${colors.tagBorder}">#${tag}</span>`
            ).join('')}
          </div>

          ${herramienta.hasApk ? `
            <div class="flex flex-wrap gap-2" id="tool-actions-${herramienta.id}">
              <a href="${herramienta.apkUrl}"
                 class="tool-apk-btn hidden flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 text-center bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg items-center justify-center gap-2"
                 download
                 onclick="event.stopPropagation()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                APK (${herramienta.apkSize})
              </a>
              <a href="${herramienta.url}"
                 class="tool-web-btn flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-300 text-center bg-gradient-to-r ${colors.btnGradient} text-white shadow-lg ${colors.btnShadow} flex items-center justify-center gap-2"
                 onclick="event.stopPropagation()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span class="tool-web-text">Abrir Lab</span>
              </a>
            </div>
            <div class="mt-2 text-xs text-center text-gray-600 dark:text-gray-400 tool-device-info" id="device-info-${herramienta.id}"></div>
          ` : `
            <div class="w-full py-3 px-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 text-center bg-gradient-to-r ${colors.btnGradient} text-white shadow-lg hover:shadow-xl ${colors.btnShadow}">
              ${herramienta.actionText || (isInternal ? '🎮 Jugar Ahora' : '🚀 Abrir Aplicación')}
            </div>
          `}
        </div>
      </${wrapperTag}>
    `;
  }

  getToolColorMap() {
    return {
      'purple': {
        gradientFrom: 'from-purple-500/20 to-violet-500/20',
        borderColor: 'border-purple-500/30',
        hoverBorderColor: 'hover:border-purple-500/50',
        hoverShadow: 'hover:shadow-purple-500/20',
        hoverTextColor: 'group-hover:text-purple-600 dark:group-hover:text-purple-300',
        badgeBg: 'bg-purple-100 dark:bg-purple-500/20',
        badgeText: 'text-purple-700 dark:text-purple-300',
        badgeBorder: 'border-purple-300 dark:border-purple-500/30',
        tagBg: 'bg-purple-100 dark:bg-purple-900/30',
        tagText: 'text-purple-700 dark:text-purple-400',
        tagBorder: 'border-purple-300 dark:border-purple-700/30',
        btnGradient: 'from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500',
        btnShadow: 'group-hover:shadow-purple-500/25'
      },
      'pink': {
        gradientFrom: 'from-pink-500/20 to-rose-500/20',
        borderColor: 'border-pink-500/30',
        hoverBorderColor: 'hover:border-pink-500/50',
        hoverShadow: 'hover:shadow-pink-500/20',
        hoverTextColor: 'group-hover:text-pink-600 dark:group-hover:text-pink-300',
        badgeBg: 'bg-pink-100 dark:bg-pink-500/20',
        badgeText: 'text-pink-700 dark:text-pink-300',
        badgeBorder: 'border-pink-300 dark:border-pink-500/30',
        tagBg: 'bg-pink-100 dark:bg-pink-900/30',
        tagText: 'text-pink-700 dark:text-pink-400',
        tagBorder: 'border-pink-300 dark:border-pink-700/30',
        btnGradient: 'from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500',
        btnShadow: 'group-hover:shadow-pink-500/25'
      },
      'indigo': {
        gradientFrom: 'from-indigo-500/20 to-blue-500/20',
        borderColor: 'border-indigo-500/30',
        hoverBorderColor: 'hover:border-indigo-500/50',
        hoverShadow: 'hover:shadow-indigo-500/20',
        hoverTextColor: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-300',
        badgeBg: 'bg-indigo-100 dark:bg-indigo-500/20',
        badgeText: 'text-indigo-700 dark:text-indigo-300',
        badgeBorder: 'border-indigo-300 dark:border-indigo-500/30',
        tagBg: 'bg-indigo-100 dark:bg-indigo-900/30',
        tagText: 'text-indigo-700 dark:text-indigo-400',
        tagBorder: 'border-indigo-300 dark:border-indigo-700/30',
        btnGradient: 'from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500',
        btnShadow: 'group-hover:shadow-indigo-500/25'
      },
      'blue': {
        gradientFrom: 'from-blue-500/20 to-cyan-500/20',
        borderColor: 'border-blue-500/30',
        hoverBorderColor: 'hover:border-blue-500/50',
        hoverShadow: 'hover:shadow-blue-500/20',
        hoverTextColor: 'group-hover:text-blue-600 dark:group-hover:text-blue-300',
        badgeBg: 'bg-blue-100 dark:bg-blue-500/20',
        badgeText: 'text-blue-700 dark:text-blue-300',
        badgeBorder: 'border-blue-300 dark:border-blue-500/30',
        tagBg: 'bg-blue-100 dark:bg-blue-900/30',
        tagText: 'text-blue-700 dark:text-blue-400',
        tagBorder: 'border-blue-300 dark:border-blue-700/30',
        btnGradient: 'from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500',
        btnShadow: 'group-hover:shadow-blue-500/25'
      },
      'emerald': {
        gradientFrom: 'from-emerald-500/20 to-teal-500/20',
        borderColor: 'border-emerald-500/30',
        hoverBorderColor: 'hover:border-emerald-500/50',
        hoverShadow: 'hover:shadow-emerald-500/20',
        hoverTextColor: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-300',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-500/20',
        badgeText: 'text-emerald-700 dark:text-emerald-300',
        badgeBorder: 'border-emerald-300 dark:border-emerald-500/30',
        tagBg: 'bg-emerald-100 dark:bg-emerald-900/30',
        tagText: 'text-emerald-700 dark:text-emerald-400',
        tagBorder: 'border-emerald-300 dark:border-emerald-700/30',
        btnGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
        btnShadow: 'group-hover:shadow-emerald-500/25'
      },
      'amber': {
        gradientFrom: 'from-amber-500/20 to-orange-500/20',
        borderColor: 'border-amber-500/30',
        hoverBorderColor: 'hover:border-amber-500/50',
        hoverShadow: 'hover:shadow-amber-500/20',
        hoverTextColor: 'group-hover:text-amber-600 dark:group-hover:text-amber-300',
        badgeBg: 'bg-amber-100 dark:bg-amber-500/20',
        badgeText: 'text-amber-700 dark:text-amber-300',
        badgeBorder: 'border-amber-300 dark:border-amber-500/30',
        tagBg: 'bg-amber-100 dark:bg-amber-900/30',
        tagText: 'text-amber-700 dark:text-amber-400',
        tagBorder: 'border-amber-300 dark:border-amber-700/30',
        btnGradient: 'from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500',
        btnShadow: 'group-hover:shadow-amber-500/25'
      },
      'violet': {
        gradientFrom: 'from-violet-500/20 to-purple-500/20',
        borderColor: 'border-violet-500/30',
        hoverBorderColor: 'hover:border-violet-500/50',
        hoverShadow: 'hover:shadow-violet-500/20',
        hoverTextColor: 'group-hover:text-violet-600 dark:group-hover:text-violet-300',
        badgeBg: 'bg-violet-100 dark:bg-violet-500/20',
        badgeText: 'text-violet-700 dark:text-violet-300',
        badgeBorder: 'border-violet-300 dark:border-violet-500/30',
        tagBg: 'bg-violet-100 dark:bg-violet-900/30',
        tagText: 'text-violet-700 dark:text-violet-400',
        tagBorder: 'border-violet-300 dark:border-violet-700/30',
        btnGradient: 'from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500',
        btnShadow: 'group-hover:shadow-violet-500/25'
      },
      'teal': {
        gradientFrom: 'from-teal-500/20 to-cyan-500/20',
        borderColor: 'border-teal-500/30',
        hoverBorderColor: 'hover:border-teal-500/50',
        hoverShadow: 'hover:shadow-teal-500/20',
        hoverTextColor: 'group-hover:text-teal-600 dark:group-hover:text-teal-300',
        badgeBg: 'bg-teal-100 dark:bg-teal-500/20',
        badgeText: 'text-teal-700 dark:text-teal-300',
        badgeBorder: 'border-teal-300 dark:border-teal-500/30',
        tagBg: 'bg-teal-100 dark:bg-teal-900/30',
        tagText: 'text-teal-700 dark:text-teal-400',
        tagBorder: 'border-teal-300 dark:border-teal-700/30',
        btnGradient: 'from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500',
        btnShadow: 'group-hover:shadow-teal-500/25'
      }
    };
  }

  attachToolsSectionListeners() {
    const bib = this.biblioteca;
    const toggleBtn = document.getElementById('tools-section-toggle');
    const contentDiv = document.getElementById('tools-section-content');

    if (toggleBtn && contentDiv) {
      bib.eventManager.addEventListener(toggleBtn, 'click', () => {
        const isExpanded = toggleBtn.classList.toggle('expanded');
        contentDiv.classList.toggle('expanded');
        toggleBtn.setAttribute('aria-expanded', isExpanded);
      });
    }
  }

  // ==========================================================================
  // OTRAS SECCIONES
  // ==========================================================================

  renderFutureBooks() {
    const bib = this.biblioteca;
    const librosFuturos = bib.bookEngine.catalog.futureBooks;
    if (!librosFuturos || librosFuturos.length === 0) return '';

    let htmlSeccion = '<div class="future-books mb-8 sm:mb-12">';
    htmlSeccion += `<h3 class="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      ${bib.i18n.t('library.comingSoon')}
    </h3>`;
    htmlSeccion += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';

    librosFuturos.forEach(libroFuturo => {
      htmlSeccion += `
        <div class="future-book p-6 rounded-xl border border-dashed border-gray-400 dark:border-gray-600">
          <h4 class="text-xl font-bold mb-2 text-gray-700 dark:text-gray-300">${libroFuturo.title}</h4>
          <p class="text-sm mb-3 text-gray-600 dark:text-gray-400">${libroFuturo.category}</p>
          <p class="text-sm text-gray-500 dark:text-gray-500">${libroFuturo.description}</p>
        </div>
      `;
    });

    htmlSeccion += '</div></div>';
    return htmlSeccion;
  }

  renderAbout() {
    const bib = this.biblioteca;
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
          ${bib.bookEngine.catalog.library.description}
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Versión ${bib.bookEngine.catalog.library.version} •
          Última actualización: ${new Date(bib.bookEngine.catalog.library.lastUpdate).toLocaleDateString('es-ES')}
        </p>
      </div>
    `;
  }

  renderError(error) {
    const bib = this.biblioteca;
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
          <h2 class="text-2xl sm:text-3xl font-bold mb-4">${bib.i18n.t('error.loadLibrary')}</h2>
          <p class="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-6">${error.message}</p>
          <button onclick="location.reload()"
                  class="px-5 sm:px-6 py-2 sm:py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition text-sm sm:text-base">
            ${bib.i18n.t('btn.retry')}
          </button>
        </div>
      </div>
    `;
  }
}

// Exportar globalmente
window.BibliotecaRenderer = BibliotecaRenderer;
