/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * LAZY LOADER - Sistema de Carga Dinámica de Módulos
 * Reduce el tiempo de carga inicial cargando módulos bajo demanda
 *
 * @version 1.0.0
 */

class LazyLoader {
  constructor() {
    this.loadedModules = new Set();
    this.loadingModules = new Map(); // module name -> Promise
    this.moduleConfig = this.getModuleConfig();
  }

  /**
   * Configuración de módulos lazy-loadables
   */
  getModuleConfig() {
    return {
      // Frankenstein Lab Complete System
      'frankenstein-lab': {
        name: 'Frankenstein Lab',
        scripts: [
          'js/core/mobile-gestures.js?v=1.0.0',
          'js/features/frankenstein-demo-data.js?v=1.0.0',
          'js/features/frankenstein-avatar-system.js?v=1.0.2',
          'js/features/frankenstein-quiz.js?v=1.0.1',
          // 🔧 REFACTORING v2.9.200: Load mission data before missions system
          'js/features/frankenstein/data/frankenstein-mission-data.js?v=2.9.200',
          'js/features/frankenstein-missions.js?v=2.9.43',
          'js/features/frankenstein-ui.js?v=3.1.0',
          'js/features/frankenstein-audio.js?v=1.0.0',
          'js/features/frankenstein-challenges.js?v=1.0.0',
          'js/features/frankenstein-tooltips.js?v=1.0.0',
          'js/features/vitruvian-being.js?v=2.0.0'
        ],
        css: [
          'css/frankenstein-base.css?v=2.9.52',
          'css/frankenstein-animations.css?v=2.9.52',
          'css/frankenstein-components.css?v=2.9.52',
          'css/frankenstein-vitruvian.css?v=3.0.0',
          'css/frankenstein-quiz.css?v=2.9.52',
          'css/frankenstein-lab.css?v=2.9.53',
          'css/mobile-scroll-fix.css?v=1.0.0',
          'css/mobile-enhancements.css?v=1.0.0',
          'css/glassmorphism-effects.css?v=1.0.0',
          'css/gpu-animations.css?v=1.0.0'
        ]
      },

      // Microsociedades Game System
      'microsocieties': {
        name: 'Microsociedades',
        scripts: [
          'js/features/frankenstein-microsocieties.js?v=1.0.0',
          'js/features/microsocieties-missions.js?v=1.0.0',
          'js/features/microsocieties-progression.js?v=1.0.0',
          'js/features/microsocieties-save-system.js?v=1.0.0',
          'js/features/microsocieties-avatars.js?v=2.0.1',
          'js/features/microsocieties-events.js?v=1.0.0',
          'js/features/microsocieties-tutorial.js?v=1.0.0',
          'js/features/microsocieties-animations.js?v=1.0.0',
          'js/features/microsocieties-events-modal.js?v=1.0.0',
          'js/features/microsocieties-audio.js?v=1.0.0',
          'js/features/microsocieties-story-mode.js?v=1.0.0',
          'js/features/microsocieties-sandbox.js?v=1.0.0',
          'js/features/microsocieties-interventions.js?v=1.0.0',
          'js/features/microsocieties-leaderboards.js?v=1.0.0'
        ],
        css: [
          'css/microsocieties.css',
          'css/microsocieties-enhanced.css'
        ]
      },

      // Advanced Audio System
      'audio-advanced': {
        name: 'Audio Avanzado',
        scripts: [
          'js/features/audio-mixer.js?v=3.0.0',
          'js/features/audio-processor.js?v=3.0.0',
          'js/features/audio-visualizer.js?v=3.0.0',
          'js/features/word-by-word-sync.js?v=3.0.0',
          'js/features/soundscape-cache.js?v=3.0.0',
          'js/features/enhanced-audioreader.js?v=3.0.0',
          'js/features/audio-control-modal.js?v=3.0.0',
          'js/features/audio-enhancements.js?v=3.1.0'
        ],
        css: []
      },

      // Cosmos 3D Navigation
      'cosmos-3d': {
        name: 'Cosmos Navigation',
        scripts: [
          'js/features/cosmos-navigation.js?v=3.1.1'
        ],
        css: []
      },

      // Interactive Learning Features
      'interactive-learning': {
        name: 'Aprendizaje Interactivo',
        scripts: [
          'js/features/resource-ai-helper.js?v=2.8.7',
          'js/features/interactive-quiz.js?v=2.8.7',
          'js/features/learning-paths.js?v=2.8.7',
          'js/features/concept-maps.js',
          'js/features/action-plans.js'
        ],
        css: []
      },

      // Premium System (Auth + Payment)
      // Nota: auth-helper.js ahora se carga globalmente en index.html
      'premium-system': {
        name: 'Sistema Premium',
        scripts: [
          'js/core/plans-config.js?v=1.0.0',
          'js/features/auth-modal.js?v=1.0.0',
          'js/features/pricing-modal.js?v=1.0.0'
        ],
        css: [
          'css/auth-premium.css?v=1.0.0'
        ]
      },

      // AI Features (Premium Content)
      'ai-features': {
        name: 'Características IA Premium',
        scripts: [
          'js/features/ai-premium.js?v=1.0.0',
          'js/features/ai-book-features.js?v=1.0.0',
          'js/features/ai-game-master.js?v=1.0.0',
          'js/core/ia-integration.js?v=1.0.0',
          'js/features/ai-persistence.js?v=1.0.0',
          'js/features/ai-dashboard-widget.js?v=1.0.0'
        ],
        css: [
          'css/ai-features.css?v=1.0.0'
        ]
      },

      // System Validation & Health
      'system-validation': {
        name: 'Validación y Salud del Sistema',
        scripts: [
          'js/core/premium-validator.js?v=1.0.0',
          'js/core/system-health.js?v=1.0.0'
        ],
        css: []
      },

      // Content Adapter (IA)
      'contentAdapter': {
        name: 'Adaptador de Contenido IA',
        scripts: [
          'js/features/content-adapter.js?v=1.1.0'
        ],
        css: [
          'css/features/content-adapter.css?v=1.0.0'
        ]
      },

      // My Account Modal
      'my-account': {
        name: 'Mi Cuenta',
        scripts: [
          'js/features/my-account-modal.js?v=1.0.0'
        ],
        css: []
      },

      // Admin Panel
      'admin-panel': {
        name: 'Panel de Administración',
        scripts: [
          'js/features/admin-panel-modal.js?v=1.0.0'
        ],
        css: []
      }
    };
  }

  /**
   * Cargar un módulo (o grupo de módulos)
   * @param {string|string[]} moduleName - Nombre del módulo o array de módulos
   * @returns {Promise} Promise que se resuelve cuando todos los módulos están cargados
   */
  async load(moduleName) {
    // Si es array, cargar múltiples módulos en paralelo
    if (Array.isArray(moduleName)) {
      return Promise.all(moduleName.map(name => this.load(name)));
    }

    // Si ya está cargado, retornar inmediatamente
    if (this.loadedModules.has(moduleName)) {
      logger.debug(`✅ Módulo "${moduleName}" ya cargado`);
      return Promise.resolve();
    }

    // Si ya está cargándose, retornar la Promise existente
    if (this.loadingModules.has(moduleName)) {
      logger.debug(`⏳ Módulo "${moduleName}" ya se está cargando...`);
      return this.loadingModules.get(moduleName);
    }

    const config = this.moduleConfig[moduleName];
    if (!config) {
      logger.error(`❌ Módulo "${moduleName}" no encontrado en configuración`);
      return Promise.reject(new Error(`Módulo no encontrado: ${moduleName}`));
    }

    logger.debug(`📦 Cargando módulo: ${config.name}...`);

    // Mostrar indicador de carga si está disponible
    const loaderId = window.loadingIndicator?.showBar(`module-${moduleName}`);

    // Crear Promise de carga
    const loadingPromise = this.loadModule(moduleName, config);
    this.loadingModules.set(moduleName, loadingPromise);

    try {
      await loadingPromise;
      this.loadedModules.add(moduleName);
      this.loadingModules.delete(moduleName);
      logger.debug(`✅ Módulo "${config.name}" cargado exitosamente`);

      // Ocultar indicador de carga
      if (loaderId) window.loadingIndicator?.hide(loaderId);

      return Promise.resolve();
    } catch (error) {
      this.loadingModules.delete(moduleName);
      logger.error(`❌ Error cargando módulo "${config.name}":`, error);

      // Ocultar indicador de carga en error
      if (loaderId) window.loadingIndicator?.hide(loaderId);

      return Promise.reject(error);
    }
  }

  /**
   * Cargar un módulo específico (CSS + JS)
   */
  async loadModule(moduleName, config) {
    const promises = [];

    // Cargar CSS primero (en paralelo)
    if (config.css && config.css.length > 0) {
      promises.push(...config.css.map(href => this.loadCSS(href)));
    }

    // Cargar scripts en secuencia (para mantener orden de dependencias)
    if (config.scripts && config.scripts.length > 0) {
      // Esperar CSS antes de empezar con JS
      await Promise.all(promises);

      // Cargar scripts secuencialmente
      for (const src of config.scripts) {
        await this.loadScript(src);
      }
    }

    return Promise.resolve();
  }

  /**
   * Cargar un CSS de forma dinámica
   */
  loadCSS(href) {
    return new Promise((resolve, reject) => {
      // Verificar si ya existe
      const existing = document.querySelector(`link[href="${href}"]`);
      if (existing) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Error cargando CSS: ${href}`));
      document.head.appendChild(link);
    });
  }

  /**
   * Cargar un script de forma dinámica
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      // Verificar si ya existe
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = false; // Mantener orden de ejecución
      // 🔧 REFACTORING v2.9.200: Enable ES6 modules for frankenstein-ui.js
      if (src.includes('frankenstein-ui.js')) {
        script.type = 'module';
      }
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Error cargando script: ${src}`));
      document.body.appendChild(script);
    });
  }

  /**
   * Pre-cargar módulos en background (útil para anticipar uso)
   */
  preload(moduleName) {
    logger.debug(`🔮 Pre-cargando módulo: ${moduleName}...`);
    return this.load(moduleName);
  }

  /**
   * Verificar si un módulo está cargado
   */
  isLoaded(moduleName) {
    return this.loadedModules.has(moduleName);
  }

  /**
   * Obtener lista de módulos cargados
   */
  getLoadedModules() {
    return Array.from(this.loadedModules);
  }

  /**
   * Obtener lista de módulos disponibles
   */
  getAvailableModules() {
    return Object.keys(this.moduleConfig);
  }

  /**
   * Cargar tema CSS de forma dinámica
   * @param {string} nombreTema - Nombre del tema (ej: 'codigo-despertar')
   * @returns {Promise} Promise que se resuelve cuando el tema está cargado
   */
  async loadThemeCSS(nombreTema) {
    const dataAtributoTema = 'data-theme-css';
    const temaActual = document.querySelector(`link[${dataAtributoTema}]`);

    // Si el tema actual es el mismo, no hacer nada
    if (temaActual && temaActual.getAttribute(dataAtributoTema) === nombreTema) {
      logger.debug(`✅ Tema "${nombreTema}" ya está cargado`);
      return Promise.resolve();
    }

    logger.debug(`🎨 Cargando tema: ${nombreTema}...`);

    // Crear la URL del CSS del tema
    const urlTema = `css/themes/${nombreTema}.css`;

    // Crear nuevo elemento link para el tema
    const nuevoLinkTema = document.createElement('link');
    nuevoLinkTema.rel = 'stylesheet';
    nuevoLinkTema.href = urlTema;
    nuevoLinkTema.setAttribute(dataAtributoTema, nombreTema);

    return new Promise((resolve, reject) => {
      nuevoLinkTema.onload = () => {
        // Remover el tema anterior después de que el nuevo esté cargado
        if (temaActual) {
          temaActual.remove();
          logger.debug(`🗑️ Tema anterior removido`);
        }
        logger.debug(`✅ Tema "${nombreTema}" cargado exitosamente`);
        resolve();
      };

      nuevoLinkTema.onerror = () => {
        logger.error(`❌ Error cargando tema: ${urlTema}`);
        reject(new Error(`Error cargando tema: ${urlTema}`));
      };

      // Agregar el nuevo tema al head
      document.head.appendChild(nuevoLinkTema);
    });
  }

  /**
   * Obtener el tema actualmente cargado
   * @returns {string|null} Nombre del tema actual o null si no hay ninguno
   */
  getCurrentTheme() {
    const temaActual = document.querySelector('link[data-theme-css]');
    return temaActual ? temaActual.getAttribute('data-theme-css') : null;
  }
}

// Crear instancia global
window.lazyLoader = new LazyLoader();

// Exponer para debugging
logger.debug('📦 LazyLoader inicializado. Módulos disponibles:', window.lazyLoader.getAvailableModules());
