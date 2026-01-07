/**
 * LEARNING LAZY LOADER - Wrapper para carga dinámica de Learning Features
 * ==========================================================================
 * Proporciona métodos convenientes para cargar features educativas solo cuando se necesitan
 *
 * @version 2.9.283
 */

class LearningLazyLoader {
  constructor() {
    this.loadingPromises = new Map();
  }

  /**
   * Iniciar Quiz Interactivo con carga lazy
   * @param {string} bookId - ID del libro
   * @param {string} chapterId - ID del capítulo
   * @returns {Promise<void>}
   */
  async startQuiz(bookId, chapterId) {
    try {
      // Cargar módulo si no está cargado
      if (!window.lazyLoader?.isLoaded('interactive-quiz')) {
        if (window.toast) {
          window.toast.info('Cargando Quiz Interactivo...');
        }
        await window.lazyLoader.loadInteractiveQuiz();
      }

      // Iniciar quiz
      if (window.InteractiveQuiz) {
        const quiz = new window.InteractiveQuiz(bookId, chapterId);
        quiz.start();
      } else if (typeof startInteractiveQuiz === 'function') {
        startInteractiveQuiz(bookId, chapterId);
      } else {
        logger.error('[LearningLazyLoader] Interactive Quiz no encontrado después de carga');
      }
    } catch (error) {
      logger.error('[LearningLazyLoader] Error cargando Interactive Quiz:', error);
      if (window.toast) {
        window.toast.error('Error al cargar Quiz');
      }
    }
  }

  /**
   * Abrir Concept Map con carga lazy
   * @param {string} bookId - ID del libro
   * @param {Object} options - Opciones del mapa conceptual
   * @returns {Promise<void>}
   */
  async openConceptMap(bookId, options = {}) {
    try {
      // Cargar módulo si no está cargado
      if (!window.lazyLoader?.isLoaded('concept-maps')) {
        if (window.toast) {
          window.toast.info('Cargando Mapa Conceptual...');
        }
        await window.lazyLoader.loadConceptMaps();
      }

      // Abrir mapa conceptual
      if (window.ConceptMap) {
        const map = new window.ConceptMap(bookId, options);
        map.open();
      } else if (typeof openConceptMap === 'function') {
        openConceptMap(bookId, options);
      } else {
        logger.error('[LearningLazyLoader] Concept Map no encontrado después de carga');
      }
    } catch (error) {
      logger.error('[LearningLazyLoader] Error cargando Concept Map:', error);
      if (window.toast) {
        window.toast.error('Error al cargar Mapa Conceptual');
      }
    }
  }

  /**
   * Crear Action Plan con carga lazy
   * @param {string} bookId - ID del libro
   * @param {Object} context - Contexto para el plan
   * @returns {Promise<void>}
   */
  async createActionPlan(bookId, context = {}) {
    try {
      // Cargar módulo si no está cargado
      if (!window.lazyLoader?.isLoaded('action-plans')) {
        if (window.toast) {
          window.toast.info('Cargando Plan de Acción...');
        }
        await window.lazyLoader.loadActionPlans();
      }

      // Crear plan de acción
      if (window.ActionPlan) {
        const plan = new window.ActionPlan(bookId, context);
        plan.create();
      } else if (typeof createActionPlan === 'function') {
        createActionPlan(bookId, context);
      } else {
        logger.error('[LearningLazyLoader] Action Plan no encontrado después de carga');
      }
    } catch (error) {
      logger.error('[LearningLazyLoader] Error cargando Action Plan:', error);
      if (window.toast) {
        window.toast.error('Error al cargar Plan de Acción');
      }
    }
  }

  /**
   * Cargar todas las Learning Features de una vez (88KB)
   * Útil si sabemos que el usuario va a usar varias features
   * @returns {Promise<boolean>}
   */
  async loadAllFeatures() {
    try {
      if (!window.lazyLoader?.isLoaded('learning-features-bundle')) {
        if (window.toast) {
          window.toast.info('Cargando Herramientas de Aprendizaje...');
        }
        await window.lazyLoader.loadLearningFeatures();
      }
      return true;
    } catch (error) {
      logger.error('[LearningLazyLoader] Error cargando Learning Features Bundle:', error);
      return false;
    }
  }

  /**
   * Asegurar que Interactive Quiz esté cargado (sin iniciar)
   * @returns {Promise<boolean>}
   */
  async ensureInteractiveQuiz() {
    if (window.lazyLoader?.isLoaded('interactive-quiz')) {
      return Promise.resolve(true);
    }

    try {
      await window.lazyLoader.loadInteractiveQuiz();
      return true;
    } catch (error) {
      logger.error('[LearningLazyLoader] Error cargando Interactive Quiz:', error);
      return false;
    }
  }

  /**
   * Asegurar que Concept Maps esté cargado (sin abrir)
   * @returns {Promise<boolean>}
   */
  async ensureConceptMaps() {
    if (window.lazyLoader?.isLoaded('concept-maps')) {
      return Promise.resolve(true);
    }

    try {
      await window.lazyLoader.loadConceptMaps();
      return true;
    } catch (error) {
      logger.error('[LearningLazyLoader] Error cargando Concept Maps:', error);
      return false;
    }
  }

  /**
   * Asegurar que Action Plans esté cargado (sin crear)
   * @returns {Promise<boolean>}
   */
  async ensureActionPlans() {
    if (window.lazyLoader?.isLoaded('action-plans')) {
      return Promise.resolve(true);
    }

    try {
      await window.lazyLoader.loadActionPlans();
      return true;
    } catch (error) {
      logger.error('[LearningLazyLoader] Error cargando Action Plans:', error);
      return false;
    }
  }

  /**
   * Pre-cargar features educativas en segundo plano
   * Útil si sabemos que el usuario está en modo aprendizaje
   */
  async preloadLearningFeatures() {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(async () => {
        // Cargar bundle completo cuando el navegador esté idle
        await this.loadAllFeatures();
      }, { timeout: 10000 });
    }
  }

  /**
   * Verificar si alguna feature de aprendizaje está cargada
   * @returns {boolean}
   */
  hasAnyFeatureLoaded() {
    if (!window.lazyLoader) return false;

    return window.lazyLoader.isLoaded('interactive-quiz') ||
           window.lazyLoader.isLoaded('concept-maps') ||
           window.lazyLoader.isLoaded('action-plans') ||
           window.lazyLoader.isLoaded('learning-features-bundle');
  }

  /**
   * Obtener estado de carga de Learning Features
   * @returns {Object}
   */
  getLoadStatus() {
    if (!window.lazyLoader) {
      return { ready: false, message: 'LazyLoader no disponible' };
    }

    return {
      ready: true,
      interactiveQuiz: window.lazyLoader.isLoaded('interactive-quiz'),
      conceptMaps: window.lazyLoader.isLoaded('concept-maps'),
      actionPlans: window.lazyLoader.isLoaded('action-plans'),
      bundle: window.lazyLoader.isLoaded('learning-features-bundle')
    };
  }

  /**
   * Determinar qué feature cargar según contexto
   * @param {string} context - 'quiz', 'map', 'plan', 'all'
   * @returns {Promise<boolean>}
   */
  async loadByContext(context) {
    switch (context) {
      case 'quiz':
        return await this.ensureInteractiveQuiz();
      case 'map':
        return await this.ensureConceptMaps();
      case 'plan':
        return await this.ensureActionPlans();
      case 'all':
        return await this.loadAllFeatures();
      default:
        logger.warn(`[LearningLazyLoader] Contexto desconocido: ${context}`);
        return false;
    }
  }
}

// Exportar globalmente
window.LearningLazyLoader = LearningLazyLoader;
window.learningLazyLoader = new LearningLazyLoader();

// Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LearningLazyLoader;
}
