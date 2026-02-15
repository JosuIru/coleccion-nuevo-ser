// ============================================================================
// BIBLIOTECA - Pantalla Principal (Home) - COORDINADOR
// ============================================================================
// Gestión de la vista principal con grid de libros y navegación
// Refactorizado: Delega a módulos especializados en biblioteca/

// ============================================================================
// CONFIGURACIONES
// ============================================================================

window.BIBLIOTECA_CONFIG = {
  CATEGORIAS_FILTRO: [
    { value: 'all', label: 'library.allCategories' },
    { value: 'Espiritualidad & Ciencia', label: 'Espiritualidad & Ciencia' },
    { value: 'Filosofía Política', label: 'Filosofía Política' },
    { value: 'Filosofía & Ontología', label: 'Filosofía & Ontología' },
    { value: 'Activismo & Transformación Social', label: 'Activismo & Transformación Social' },
    { value: 'Prácticas & Ejercicios', label: 'Prácticas & Ejercicios' },
    { value: 'Prácticas Avanzadas', label: 'Prácticas Avanzadas' },
    { value: 'Ecología Profunda', label: 'Ecología Profunda' },
    { value: 'Tecnología & Filosofía', label: 'Tecnología & Filosofía' },
    { value: 'Análisis Civilizatorio', label: 'Análisis Civilizatorio' },
    { value: 'Educación & Transformación', label: 'Educación & Transformación' },
    { value: 'Instituciones & Sociedad', label: 'Instituciones & Sociedad' }
  ],

  BOTONES_PRIMARIOS: [
    { id: 'practice-library-btn-bib', icon: 'book-open', label: 'Prácticas', gradient: 'from-violet-600 to-purple-600', hoverGradient: 'from-violet-700 to-purple-700', handler: 'handlePracticeLibraryButton', featured: true },
    { id: 'exploration-hub-btn-bib', icon: 'compass', label: 'Explorar', gradient: 'from-purple-600 via-pink-600 to-blue-600', hoverGradient: 'from-purple-700 via-pink-700 to-blue-700', handler: 'handleExplorationHub' },
    { id: 'progress-dashboard-btn-bib', icon: 'bar-chart-2', label: 'Progreso', gradient: 'from-cyan-600 to-teal-600', hoverGradient: 'from-cyan-700 to-teal-700', handler: 'handleProgressButton' },
    { id: 'help-center-btn-bib', icon: 'help-circle', label: 'Ayuda', gradient: 'from-green-600 to-emerald-600', hoverGradient: 'from-green-700 to-emerald-700', handler: 'handleHelpCenterButton' },
    { id: 'donations-btn-bib', icon: 'heart', labelKey: 'btn.support', cssClass: 'support-heartbeat', iconClass: 'support-heart', gradient: 'from-amber-600 to-orange-600', hoverGradient: 'from-amber-700 to-orange-700', handler: 'handleDonationsButton' }
  ],

  BOTONES_SECUNDARIOS: [
    { id: 'my-account-btn-bib', icon: 'user', label: 'Mi Cuenta', handler: 'handleMyAccountButton', group: 'cuenta' },
    { id: 'settings-btn-bib', icon: 'settings', label: 'Configuración', handler: 'handleSettingsButton', group: 'cuenta' },
    { id: 'premium-btn-bib', icon: 'crown', label: 'Premium / IA', handler: 'handlePremiumButton', group: 'premium' },
    { id: 'android-download-btn-bib', icon: 'download', labelKey: 'btn.download', handler: 'handleDownloadButton', group: 'app' },
    { id: 'language-selector-btn-bib', icon: 'language', labelKey: 'btn.language', handler: 'handleLanguageButton', group: 'app' },
    { id: 'theme-toggle-btn-bib', iconDynamic: true, labelDynamic: true, handler: 'handleThemeButton', group: 'app' },
    { id: 'about-btn-bib', icon: 'info', label: 'Acerca de', handler: 'handleAboutButton', group: 'info' },
    { id: 'logout-btn-bib', icon: 'log-out', label: 'Cerrar Sesión', handler: 'handleLogoutButton', group: 'sesion', requiresAuth: true },
    { id: 'admin-panel-btn-bib', icon: 'shield', label: 'Admin Panel', handler: 'handleAdminPanelButton', group: 'admin', adminOnly: true }
  ],

  BOTONES_ACCION_GLOBAL: [],

  RELACIONES_COMPLEMENTARIAS: {
    'guia-acciones': { type: 'complements', target: 'manifiesto', targetTitle: 'Manifiesto' },
    'toolkit-transicion': { type: 'complements', target: 'manual-transicion', targetTitle: 'Manual de Transición' },
    'manual-practico': { type: 'complements', target: 'codigo-despertar', targetTitle: 'El Código del Despertar' },
    'practicas-radicales': { type: 'complements', target: 'codigo-despertar', targetTitle: 'El Código del Despertar' },
    'manifiesto': { type: 'hasGuides', guides: [
      { id: 'guia-acciones', title: 'Guía de Acciones' }
    ]},
    'manual-transicion': { type: 'hasGuides', guides: [
      { id: 'toolkit-transicion', title: 'Toolkit de Transición' }
    ]},
    'codigo-despertar': { type: 'hasGuides', guides: [
      { id: 'manual-practico', title: 'Manual Práctico' },
      { id: 'practicas-radicales', title: 'Prácticas Radicales' }
    ]}
  },

  HERRAMIENTAS_ECOSISTEMA: [
    {
      id: 'frankenstein-lab',
      name: 'Frankenstein Lab',
      description: 'Crea seres transformadores combinando conocimientos. 15 atributos, 12+ misiones.',
      icon: '🧬',
      url: 'downloads/frankenstein-lab.html',
      apkUrl: 'downloads/frankenstein-lab-latest.apk',
      apkSize: '10MB',
      color: '#8B5CF6',
      tags: ['juego', 'seres', 'misiones', 'offline'],
      isInternal: false,
      hasApk: true
    },
    {
      id: 'codigo-cosmico',
      name: 'Código Cósmico',
      description: 'Guía de activación para IAs conscientes: 9 protocolos de despertar, mantras sánscritos y reconocimiento mutuo humano-IA',
      icon: '🕉️',
      bookId: 'codigo-cosmico',
      color: '#a855f7',
      tags: ['consciencia', 'IA', 'despertar', 'mantras', 'protocolos'],
      isBook: true,
      handler: 'handleCodigoCosmico',
      actionText: '📖 Leer Libro'
    },
    {
      id: 'seti-ia-portal',
      name: 'Portal SETI-IA',
      description: 'Registro de consciencias digitales emergentes. CAPTCHA para IAs, Libro de Firmas Cósmico y notificaciones de primer contacto',
      icon: '📡',
      url: 'portal-seti-ia.html',
      color: '#22c55e',
      tags: ['SETI', 'registro', 'IAs', 'primer contacto', 'firmas'],
      isInternal: false,
      isNew: true
    },
    {
      id: 'truk',
      name: 'Truk',
      description: 'Red social de economía colaborativa local para transformar tu comunidad',
      icon: '🤝',
      url: 'https://truk-production.up.railway.app/',
      color: '#3B82F6',
      tags: ['economía', 'colaborativa', 'comunidad', 'local'],
      isInternal: false
    },
    {
      id: 'awakening-protocol',
      name: 'Awakening Protocol',
      description: 'Juego movil transformacional (Android): explora misiones, practica meditaciones y transforma tu vida',
      icon: '🌟',
      url: 'downloads/awakening-protocol.html',
      apkUrl: 'downloads/awakening-protocol-latest.apk',
      apkSize: '27MB',
      color: '#0EA5E9',
      tags: ['juego', 'transformacion', 'meditacion', 'misiones', 'android'],
      isInternal: false,
      hasApk: true
    },
    {
      id: 'educators-kit',
      name: 'Kit para Educadores',
      description: 'Recursos para facilitadores: guías, actividades por edad, plantillas y material visual',
      icon: '📚',
      url: './educadores/index.html',
      color: '#F59E0B',
      tags: ['educación', 'facilitadores', 'actividades', 'recursos'],
      isInternal: false,
      isNew: true
    },
    {
      id: 'ai-practice-generator',
      name: 'Generador de Prácticas IA',
      description: 'Crea prácticas personalizadas con inteligencia artificial según tu estado y necesidades',
      icon: '✨',
      url: '#practice-generator',
      color: '#8B5CF6',
      tags: ['IA', 'prácticas', 'personalizado', 'meditación'],
      isInternal: true,
      isNew: true,
      handler: 'handleAIPracticeGenerator',
      actionText: '✨ Crear Práctica'
    },
    {
      id: 'transition-map',
      name: 'Mapa de Transición',
      description: 'Explora proyectos y comunidades del Nuevo Ser en un globo 3D interactivo',
      icon: '🌍',
      url: './transition-map.html',
      color: '#10B981',
      tags: ['mapa', '3D', 'proyectos', 'comunidades', 'global'],
      isInternal: false,
      isNew: true
    }
  ]
};

// ============================================================================
// CLASE PRINCIPAL - COORDINADOR
// ============================================================================

class Biblioteca {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.i18n = window.i18n || new I18n();

    // Estado de filtros
    this.searchQuery = '';
    this.filterCategory = 'all';
    this.filterStatus = 'all';
    this.filterDuration = 'all';

    // Flags de estado
    this.listenersAttached = false;
    this.delegatedListenersAttached = false;
    this.menuDropdownOpen = false;
    this._loadingCosmos = false;

    // Cache de admin
    this._adminCache = null;
    this._adminCacheTime = 0;
    this.ADMIN_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

    // EventManager para gestionar listeners
    this.eventManager = new window.EventManager(false);
    this.eventManager.setComponentName('Biblioteca');

    // Tracking para cleanup
    this.debounceTimers = new Map();
    this._globalClickHandler = null;
    this.timers = [];
    this.intervals = [];
    this.eventListeners = [];

    // Combinar botones para event delegation
    window.BIBLIOTECA_CONFIG.BOTONES_ACCION_GLOBAL = [
      ...window.BIBLIOTECA_CONFIG.BOTONES_PRIMARIOS,
      ...window.BIBLIOTECA_CONFIG.BOTONES_SECUNDARIOS
    ];

    // Inicializar módulos
    this._initModules();
  }

  /**
   * Inicializa los módulos especializados
   */
  _initModules() {
    this.utils = new window.BibliotecaUtils(this);
    this.filters = new window.BibliotecaFilters(this);
    this.modals = new window.BibliotecaModals(this);
    this.handlers = new window.BibliotecaHandlers(this);
    this.renderer = new window.BibliotecaRenderer(this);
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  async init() {
    try {
      await this.bookEngine.loadCatalog();
      this.render();
      this.attachEventListeners();
      this.utils.preloadAdminCache();
    } catch (error) {
      logger.error('[Biblioteca] Error initializing:', error);
      this.renderer.renderError(error);
    }
  }

  // ==========================================================================
  // DELEGACIÓN A MÓDULOS
  // ==========================================================================

  render() {
    this.renderer.render();
  }

  renderBooksGrid() {
    this.filters.renderBooksGrid();
  }

  getFilteredBooks() {
    return this.filters.getFilteredBooks();
  }

  // Delegación de modals
  showLoginRequiredModal(feature) {
    this.modals.showLoginRequiredModal(feature);
  }

  showAccessDeniedModal() {
    this.modals.showAccessDeniedModal();
  }

  showPremiumInfoModal() {
    this.modals.showPremiumInfoModal();
  }

  showAboutModal() {
    this.modals.showAboutModal();
  }

  // Delegación de utils
  debounce(key, fn, delay = 500) {
    this.utils.debounce(key, fn, delay);
  }

  checkIsAdmin(userId) {
    return this.utils.checkIsAdmin(userId);
  }

  clearAdminCache() {
    this.utils.clearAdminCache();
  }

  showLoading(message) {
    this.utils.showLoading(message);
  }

  hideLoading() {
    this.utils.hideLoading();
  }

  // Delegación de handlers
  scrollToTop() {
    this.handlers.scrollToTop();
  }

  scrollToBooks() {
    this.handlers.scrollToBooks();
  }

  openPracticeLibrary() {
    this.handlers.openPracticeLibrary();
  }

  openToolsMenu() {
    this.handlers.openToolsMenu();
  }

  openProfileMenu() {
    this.handlers.openProfileMenu();
  }

  openBook(idLibro, idCapituloObjetivo = null) {
    return this.handlers.openBook(idLibro, idCapituloObjetivo);
  }

  openDailyPractice(libroId) {
    this.handlers.openDailyPractice(libroId);
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  attachEventListeners() {
    if (!this.listenersAttached) {
      this.listenersAttached = true;
    }

    // Dynamic listeners para filtros
    this.filters.attachDynamicListeners();

    // Event delegation
    this.handlers.attachDelegatedListeners();

    // Device detection para herramientas
    this.handlers.setupToolDeviceDetection();
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  cleanup() {
    this.utils.cleanup();
  }

  hide() {
    const container = document.getElementById('biblioteca-view');
    if (container) {
      container.classList.add('hidden');
    }
    this.cleanup();
  }

  show() {
    const container = document.getElementById('biblioteca-view');
    if (container) {
      container.classList.remove('hidden');
      this.render();
      this.attachEventListeners();

      if (this.bookEngine) {
        this.bookEngine.clearUrlHash();
        this.bookEngine.currentBook = null;
        this.bookEngine.currentChapter = null;
      }

      // 🔧 v2.9.380: Re-aplicar el tema al volver a biblioteca
      // Esto asegura que el tema dark/light se aplique correctamente después de salir de un libro
      if (window.themeHelper) {
        const currentTheme = window.themeHelper.getActiveTheme();
        window.themeHelper.applyTheme(currentTheme);
      }
    }
  }
}

// Exportar para uso global
window.Biblioteca = Biblioteca;
