/**
 * LAZY LOADER - Carga dinámica de features bajo demanda
 * ======================================================
 * Reduce el tiempo de carga inicial cargando features grandes solo cuando se necesitan
 *
 * @version 1.0.0
 */

class LazyLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
  }

  /**
   * Cargar múltiples scripts en orden
   * @param {string[]} scripts - Array de URLs de scripts
   * @returns {Promise<void>}
   */
  async loadScripts(scripts) {
    for (const script of scripts) {
      await this.loadScript(script);
    }
  }

  /**
   * Cargar un script individual
   * @param {string} src - URL del script
   * @returns {Promise<void>}
   */
  loadScript(src) {
    // Si ya se cargó, devolver promise resuelta
    if (this.loadedModules.has(src)) {
      return Promise.resolve();
    }

    // Si está cargando, devolver la promise existente
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src);
    }

    // Crear nueva promise de carga
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;

      script.onload = () => {
        this.loadedModules.set(src, true);
        this.loadingPromises.delete(src);
        if (typeof logger !== 'undefined') {
          logger.debug(`[LazyLoader] Loaded: ${src}`);
        }
        resolve();
      };

      script.onerror = () => {
        this.loadingPromises.delete(src);
        logger.error(`[LazyLoader] Failed to load: ${src}`);
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  /**
   * Cargar Frankenstein Lab (31 archivos)
   * @returns {Promise<void>}
   */
  async loadFrankensteinLab() {
    if (this.loadedModules.has('frankenstein-lab')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Frankenstein Lab...');
    }

    const scripts = [
      // Core
      'js/features/frankenstein/core/frankenstein-constants.js?v=2.9.154',
      'js/features/frankenstein/core/frankenstein-piece-database.js?v=2.9.154',
      'js/features/frankenstein/core/frankenstein-mission-database.js?v=2.9.154',
      'js/features/frankenstein/core/frankenstein-being-calculator.js?v=2.9.154',
      'js/features/frankenstein/core/frankenstein-being-storage.js?v=2.9.154',
      'js/features/frankenstein/core/frankenstein-micro-society.js?v=2.9.154',

      // Utils
      'js/features/frankenstein/utils/frankenstein-analytics.js?v=2.9.154',
      'js/features/frankenstein/utils/frankenstein-drag-drop-handler.js?v=2.9.154',

      // UI
      'js/features/frankenstein/ui/frankenstein-ui-renderer.js?v=2.9.154',
      'js/features/frankenstein/ui/frankenstein-modals.js?v=2.9.154',
      'js/features/frankenstein/ui/frankenstein-bottom-sheet.js?v=2.9.154',
      'js/features/frankenstein/ui/frankenstein-tutorial.js?v=2.9.154',
      'js/features/frankenstein/ui/frankenstein-tooltips.js?v=2.9.154',
      'js/features/frankenstein/ui/frankenstein-piece-cards.js?v=2.9.154',

      // Main
      'js/features/frankenstein/frankenstein-lab.js?v=2.9.154'
    ];

    try {
      await this.loadScripts(scripts);
      this.loadedModules.set('frankenstein-lab', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Frankenstein Lab cargado');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Frankenstein Lab:', error);
      throw error;
    }
  }

  /**
   * Cargar Cosmos Navigation
   * @returns {Promise<void>}
   */
  async loadCosmosNavigation() {
    if (this.loadedModules.has('cosmos-navigation')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Cosmos Navigation...');
    }

    try {
      await this.loadScript('js/features/cosmos-navigation.js?v=2.9.154');
      this.loadedModules.set('cosmos-navigation', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Cosmos Navigation cargado');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Cosmos Navigation:', error);
      throw error;
    }
  }

  /**
   * Cargar AI Chat Modal (64KB + 36KB = 100KB)
   * @returns {Promise<void>}
   */
  async loadAIChatModal() {
    // 🔧 FIX v2.9.307: Verificar si ya está cargado (directo en HTML o lazy)
    if (this.loadedModules.has('ai-chat-modal') || typeof window.AIChatModal !== 'undefined') {
      this.loadedModules.set('ai-chat-modal', true);
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando AI Chat Modal...');
    }

    const scripts = [
      'js/ai/ai-adapter.js?v=2.9.283',
      'js/features/ai-chat-modal.js?v=2.9.283'
    ];

    try {
      await this.loadScripts(scripts);
      this.loadedModules.set('ai-chat-modal', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ AI Chat Modal cargado');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando AI Chat Modal:', error);
      throw error;
    }
  }

  /**
   * Cargar AI Settings Modal (24KB)
   * @returns {Promise<void>}
   */
  async loadAISettings() {
    if (this.loadedModules.has('ai-settings')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando AI Settings...');
    }

    try {
      await this.loadScript('js/features/ai-settings-modal.js?v=2.9.283');
      this.loadedModules.set('ai-settings', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ AI Settings cargado');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando AI Settings:', error);
      throw error;
    }
  }

  /**
   * Cargar AI Suggestions (16KB)
   * @returns {Promise<void>}
   */
  async loadAISuggestions() {
    if (this.loadedModules.has('ai-suggestions')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando AI Suggestions...');
    }

    try {
      await this.loadScript('js/features/ai-suggestions.js?v=2.9.283');
      this.loadedModules.set('ai-suggestions', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ AI Suggestions cargado');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando AI Suggestions:', error);
      throw error;
    }
  }

  /**
   * Cargar AI Premium features (16KB + pricing modal)
   * @returns {Promise<void>}
   */
  async loadAIPremium() {
    if (this.loadedModules.has('ai-premium')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando AI Premium...');
    }

    const scripts = [
      'js/features/ai-premium.js?v=2.9.283',
      'js/features/pricing-modal.js?v=2.9.283'
    ];

    try {
      await this.loadScripts(scripts);
      this.loadedModules.set('ai-premium', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ AI Premium cargado');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando AI Premium:', error);
      throw error;
    }
  }

  /**
   * Cargar ElevenLabs TTS Provider (20KB)
   * @returns {Promise<void>}
   */
  async loadElevenLabs() {
    if (this.loadedModules.has('elevenlabs-tts')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando ElevenLabs TTS...');
    }

    try {
      await this.loadScript('js/core/elevenlabs-tts-provider.js?v=2.9.283');
      this.loadedModules.set('elevenlabs-tts', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ ElevenLabs TTS cargado');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando ElevenLabs TTS:', error);
      throw error;
    }
  }

  /**
   * Cargar Resource AI Helper
   * @returns {Promise<void>}
   */
  async loadResourceAIHelper() {
    if (this.loadedModules.has('resource-ai-helper')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Resource AI Helper...');
    }

    try {
      await this.loadScript('js/features/resource-ai-helper.js?v=2.9.283');
      this.loadedModules.set('resource-ai-helper', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Resource AI Helper cargado');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Resource AI Helper:', error);
      throw error;
    }
  }

  /**
   * Cargar Interactive Quiz (16KB)
   * @returns {Promise<void>}
   */
  async loadInteractiveQuiz() {
    if (this.loadedModules.has('interactive-quiz')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Interactive Quiz...');
    }

    try {
      await this.loadScript('js/features/interactive-quiz.js?v=2.9.283');
      this.loadedModules.set('interactive-quiz', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Interactive Quiz cargado');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Interactive Quiz:', error);
      throw error;
    }
  }

  /**
   * Cargar Concept Maps (44KB)
   * @returns {Promise<void>}
   */
  async loadConceptMaps() {
    if (this.loadedModules.has('concept-maps')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Concept Maps...');
    }

    try {
      await this.loadScript('js/features/concept-maps.js?v=2.9.283');
      this.loadedModules.set('concept-maps', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Concept Maps cargado');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Concept Maps:', error);
      throw error;
    }
  }

  /**
   * Cargar Action Plans (28KB)
   * @returns {Promise<void>}
   */
  async loadActionPlans() {
    if (this.loadedModules.has('action-plans')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Action Plans...');
    }

    try {
      await this.loadScript('js/features/action-plans.js?v=2.9.283');
      this.loadedModules.set('action-plans', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Action Plans cargado');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Action Plans:', error);
      throw error;
    }
  }

  /**
   * Cargar todas las Learning Features juntas (88KB)
   * @returns {Promise<void>}
   */
  async loadLearningFeatures() {
    if (this.loadedModules.has('learning-features-bundle')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Learning Features Bundle...');
    }

    const scripts = [
      'js/features/interactive-quiz.js?v=2.9.283',
      'js/features/concept-maps.js?v=2.9.283',
      'js/features/action-plans.js?v=2.9.283'
    ];

    try {
      await this.loadScripts(scripts);
      this.loadedModules.set('learning-features-bundle', true);
      // Marcar también individualmente
      this.loadedModules.set('interactive-quiz', true);
      this.loadedModules.set('concept-maps', true);
      this.loadedModules.set('action-plans', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Learning Features Bundle cargado (88KB)');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Learning Features Bundle:', error);
      throw error;
    }
  }

  /**
   * Cargar Learning Paths (modular ~100KB total)
   * v2.9.390: Arquitectura modular
   * @returns {Promise<void>}
   */
  async loadLearningPaths() {
    if (this.loadedModules.has('learning-paths')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Learning Paths (modular)...');
    }

    const scripts = [
      'js/features/learning-paths/learning-paths-data.js?v=2.9.390',
      'js/features/learning-paths/learning-paths-ui.js?v=2.9.390',
      'js/features/learning-paths/learning-paths-events.js?v=2.9.390',
      'js/features/learning-paths/learning-paths-ai.js?v=2.9.390',
      'js/features/learning-paths/index.js?v=2.9.390'
    ];

    try {
      await this.loadScripts(scripts);
      this.loadedModules.set('learning-paths', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Learning Paths cargado (modular - 5 modulos)');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Learning Paths:', error);
      throw error;
    }
  }

  /**
   * Cargar Settings Modal (modular ~124KB total)
   * v2.9.390: Arquitectura modular
   * @returns {Promise<void>}
   */
  async loadSettingsModal() {
    if (this.loadedModules.has('settings-modal')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Settings Modal (modular)...');
    }

    try {
      // Cargar módulos en orden: primero los módulos auxiliares, luego el coordinador
      await this.loadScript('js/features/settings-modal/settings-modal-general.js?v=2.9.390');
      await this.loadScript('js/features/settings-modal/settings-modal-ai.js?v=2.9.390');
      await this.loadScript('js/features/settings-modal/settings-modal-account.js?v=2.9.390');
      await this.loadScript('js/features/settings-modal/settings-modal-appearance.js?v=2.9.390');
      await this.loadScript('js/features/settings-modal/settings-modal-events.js?v=2.9.390');
      await this.loadScript('js/features/settings-modal/index.js?v=2.9.390');

      this.loadedModules.set('settings-modal', true);

      if (typeof logger !== 'undefined') {
        logger.log('[LazyLoader] Settings Modal cargado (modular)');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Settings Modal:', error);
      throw error;
    }
  }

  /**
   * Cargar Welcome Flow (28KB) - Solo para nuevos usuarios
   * @returns {Promise<void>}
   */
  async loadWelcomeFlow() {
    if (this.loadedModules.has('welcome-flow')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Welcome Flow...');
    }

    try {
      await this.loadScript('js/features/welcome-flow.js?v=1.0.0');
      this.loadedModules.set('welcome-flow', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Welcome Flow cargado (28KB)');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Welcome Flow:', error);
      throw error;
    }
  }

  /**
   * Cargar Onboarding Tutorial (28KB) - Solo para nuevos usuarios
   * @returns {Promise<void>}
   */
  async loadOnboardingTutorial() {
    if (this.loadedModules.has('onboarding-tutorial')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Onboarding Tutorial...');
    }

    try {
      await this.loadScript('js/features/onboarding-tutorial.js');
      this.loadedModules.set('onboarding-tutorial', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Onboarding Tutorial cargado (28KB)');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Onboarding Tutorial:', error);
      throw error;
    }
  }

  /**
   * Cargar Notes Modal (28KB)
   * @returns {Promise<void>}
   */
  async loadNotesModal() {
    if (this.loadedModules.has('notes-modal')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Notes Modal...');
    }

    try {
      await this.loadScript('js/features/notes-modal.js');
      this.loadedModules.set('notes-modal', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Notes Modal cargado (28KB)');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Notes Modal:', error);
      throw error;
    }
  }

  /**
   * Cargar Exploration Hub (44KB)
   * @returns {Promise<void>}
   */
  async loadExplorationHub() {
    // 🔧 FIX v2.9.307: Verificar si ya está cargado (directo en HTML o lazy)
    if (this.loadedModules.has('exploration-hub') || typeof window.ExplorationHub !== 'undefined') {
      this.loadedModules.set('exploration-hub', true);
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Exploration Hub...');
    }

    try {
      // Cargar dependencias: Search Modal y Thematic Index Modal
      await this.loadSearchModal();
      await this.loadThematicIndexModal();

      await this.loadScript('js/features/exploration-hub.js');
      this.loadedModules.set('exploration-hub', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Exploration Hub cargado (44KB)');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Exploration Hub:', error);
      throw error;
    }
  }

  /**
   * Cargar Micro Courses (85KB)
   * @returns {Promise<void>}
   */
  async loadMicroCourses() {
    if (this.loadedModules.has('micro-courses') || typeof window.MicroCourses !== 'undefined') {
      this.loadedModules.set('micro-courses', true);
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Micro Courses...');
    }

    try {
      await this.loadScript('js/features/micro-courses.js?v=2.9.330');
      this.loadedModules.set('micro-courses', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Micro Courses cargado (85KB)');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Micro Courses:', error);
      throw error;
    }
  }

  /**
   * Cargar Brújula de Recursos (44KB total)
   * @returns {Promise<void>}
   */
  async loadBrujulaRecursos() {
    // 🔧 FIX v2.9.307: Verificar si ya está cargado (directo en HTML o lazy)
    if (this.loadedModules.has('brujula-recursos') || typeof window.BrujulaRecursos !== 'undefined') {
      this.loadedModules.set('brujula-recursos', true);
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Brújula de Recursos...');
    }

    const scripts = [
      'js/features/brujula-recursos.js',
      'js/features/brujula-recursos-ui.js'
    ];

    try {
      await this.loadScripts(scripts);
      this.loadedModules.set('brujula-recursos', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Brújula de Recursos cargada (44KB)');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Brújula de Recursos:', error);
      throw error;
    }
  }

  /**
   * Cargar Smart Notes (24KB)
   * @returns {Promise<void>}
   */
  async loadSmartNotes() {
    if (this.loadedModules.has('smart-notes')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Smart Notes...');
    }

    try {
      await this.loadScript('js/features/smart-notes.js');
      this.loadedModules.set('smart-notes', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Smart Notes cargado (24KB)');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Smart Notes:', error);
      throw error;
    }
  }

  /**
   * Cargar Voice Notes (20KB)
   * @returns {Promise<void>}
   */
  async loadVoiceNotes() {
    if (this.loadedModules.has('voice-notes')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Voice Notes...');
    }

    try {
      await this.loadScript('js/features/voice-notes.js?v=2.8.6.4-a11y');
      this.loadedModules.set('voice-notes', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Voice Notes cargado (20KB)');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Voice Notes:', error);
      throw error;
    }
  }

  /**
   * Cargar Shareable Moments (20KB)
   * @returns {Promise<void>}
   */
  async loadShareableMoments() {
    if (this.loadedModules.has('shareable-moments')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Shareable Moments...');
    }

    try {
      await this.loadScript('js/features/shareable-moments.js?v=1.0.0');
      this.loadedModules.set('shareable-moments', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Shareable Moments cargado (20KB)');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Shareable Moments:', error);
      throw error;
    }
  }

  /**
   * Cargar Thematic Index Modal
   * @returns {Promise<void>}
   */
  async loadThematicIndexModal() {
    if (this.loadedModules.has('thematic-index-modal')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Thematic Index Modal...');
    }

    try {
      await this.loadScript('js/features/thematic-index-modal.js');
      this.loadedModules.set('thematic-index-modal', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Thematic Index Modal cargado');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Thematic Index Modal:', error);
      throw error;
    }
  }

  /**
   * Cargar Chapter Resources Modal (36KB)
   * @returns {Promise<void>}
   */
  async loadChapterResourcesModal() {
    if (this.loadedModules.has('chapter-resources-modal')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Chapter Resources Modal...');
    }

    try {
      await this.loadScript('js/features/chapter-resources-modal.js?v=2.9.176');
      this.loadedModules.set('chapter-resources-modal', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Chapter Resources Modal cargado (36KB)');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Chapter Resources Modal:', error);
      throw error;
    }
  }

  /**
   * Cargar Search Modal (40KB)
   * @returns {Promise<void>}
   */
  async loadSearchModal() {
    if (this.loadedModules.has('search-modal')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Search Modal...');
    }

    try {
      await this.loadScript('js/features/search-modal.js');
      this.loadedModules.set('search-modal', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Search Modal cargado (40KB)');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Search Modal:', error);
      throw error;
    }
  }

  /**
   * Cargar Auth Modal (40KB)
   * @returns {Promise<void>}
   */
  async loadAuthModal() {
    if (this.loadedModules.has('auth-modal')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Auth Modal...');
    }

    try {
      await this.loadScript('js/features/auth-modal.js?v=2.9.237');
      this.loadedModules.set('auth-modal', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Auth Modal cargado (40KB)');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Auth Modal:', error);
      throw error;
    }
  }

  /**
   * Cargar AudioReader Suite completo (164KB)
   * Incluye: 13 módulos del sistema de narración TTS
   * @returns {Promise<void>}
   */
  async loadAudioreaderSuite() {
    if (this.loadedModules.has('audioreader-suite')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando AudioReader Suite...');
    }

    try {
      // Cargar módulos en orden de dependencias
      // 1. External modules
      await this.loadScript('js/features/audioreader-sleep-timer.js?v=2.9.283');
      await this.loadScript('js/features/audioreader-bookmarks.js?v=2.9.283');
      await this.loadScript('js/features/audioreader-meditation.js?v=2.9.283');
      await this.loadScript('js/features/audioreader-position.js?v=2.9.283');

      // 2. Internal modules (modular architecture)
      await this.loadScript('js/features/audioreader/audioreader-utils.js?v=2.9.283');
      await this.loadScript('js/features/audioreader/audioreader-content.js?v=2.9.283');
      await this.loadScript('js/features/audioreader/audioreader-highlighter.js?v=2.9.283');
      await this.loadScript('js/features/audioreader/audioreader-tts-engine.js?v=2.9.283');
      await this.loadScript('js/features/audioreader/audioreader-playback.js?v=2.9.283');
      await this.loadScript('js/features/audioreader/audioreader-events.js?v=2.9.358');
      await this.loadScript('js/features/audioreader/audioreader-ui.js?v=2.9.377');

      // 3. UX Enhancements (debe cargarse antes de index.js)
      await this.loadScript('js/features/audioreader/audioreader-ux-enhancements.js?v=2.9.377');

      // 4. Main AudioReader class (must be last)
      await this.loadScript('js/features/audioreader/index.js?v=2.9.377');

      this.loadedModules.set('audioreader-suite', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ AudioReader Suite cargado (164KB - 13 módulos)');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando AudioReader Suite:', error);
      throw error;
    }
  }

  /**
   * Pre-cargar módulos en segundo plano (después de carga inicial)
   * @param {string[]} modules - Array de nombres de módulos
   */
  async preloadModules(modules) {
    // Esperar a que la página esté idle
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(async () => {
        for (const module of modules) {
          try {
            await this._loadModuleByName(module);
          } catch (error) {
            logger.warn(`[LazyLoader] Error pre-cargando ${module}:`, error);
          }
        }
      }, { timeout: 5000 });
    } else {
      // Fallback: cargar después de 3 segundos
      setTimeout(async () => {
        for (const module of modules) {
          try {
            await this._loadModuleByName(module);
          } catch (error) {
            logger.warn(`[LazyLoader] Error pre-cargando ${module}:`, error);
          }
        }
      }, 3000);
    }
  }

  /**
   * Cargar módulo por nombre (helper interno)
   * @private
   */
  async _loadModuleByName(module) {
    switch (module) {
      case 'frankenstein-lab':
        return await this.loadFrankensteinLab();
      case 'cosmos-navigation':
        return await this.loadCosmosNavigation();
      case 'ai-chat-modal':
        return await this.loadAIChatModal();
      case 'ai-settings':
        return await this.loadAISettings();
      case 'ai-suggestions':
        return await this.loadAISuggestions();
      case 'ai-premium':
        return await this.loadAIPremium();
      case 'elevenlabs-tts':
        return await this.loadElevenLabs();
      case 'resource-ai-helper':
        return await this.loadResourceAIHelper();
      case 'interactive-quiz':
        return await this.loadInteractiveQuiz();
      case 'concept-maps':
        return await this.loadConceptMaps();
      case 'action-plans':
        return await this.loadActionPlans();
      case 'learning-features':
        return await this.loadLearningFeatures();
      case 'learning-paths':
        return await this.loadLearningPaths();
      case 'settings-modal':
        return await this.loadSettingsModal();
      case 'welcome-flow':
        return await this.loadWelcomeFlow();
      case 'onboarding-tutorial':
        return await this.loadOnboardingTutorial();
      case 'notes-modal':
        return await this.loadNotesModal();
      case 'exploration-hub':
        return await this.loadExplorationHub();
      case 'brujula-recursos':
        return await this.loadBrujulaRecursos();
      case 'smart-notes':
        return await this.loadSmartNotes();
      case 'voice-notes':
        return await this.loadVoiceNotes();
      case 'shareable-moments':
        return await this.loadShareableMoments();
      case 'thematic-index-modal':
        return await this.loadThematicIndexModal();
      case 'chapter-resources-modal':
        return await this.loadChapterResourcesModal();
      case 'search-modal':
        return await this.loadSearchModal();
      case 'auth-modal':
        return await this.loadAuthModal();
      case 'audioreader-suite':
        return await this.loadAudioreaderSuite();
      // 🔧 FIX v2.9.306: Agregar módulos faltantes
      case 'my-account':
        return await this.loadScript('js/features/my-account-modal.js');
      case 'admin-panel':
        return await this.loadScript('js/features/admin-panel-modal.js?v=2.9.284');
      case 'premium-system':
      case 'ai-features':
        return await this.loadAIPremium();
      case 'cosmos-3d':
        return await this.loadCosmosNavigation();
      case 'contentAdapter':
        logger.warn('[LazyLoader] contentAdapter is deprecated, module no longer exists');
        return Promise.resolve();
      default:
        logger.warn(`[LazyLoader] Módulo desconocido: ${module}`);
    }
  }

  /**
   * Método público para cargar módulos
   * 🔧 FIX v2.9.306: Agregado método público .load() que faltaba
   * @param {string|Array} modules - Nombre del módulo o array de módulos
   * @returns {Promise}
   */
  async load(modules) {
    // Si es un array, cargar todos
    if (Array.isArray(modules)) {
      return Promise.all(modules.map(m => this._loadModuleByName(m)));
    }
    // Si es un string, cargar uno solo
    return this._loadModuleByName(modules);
  }

  /**
   * Cargar Knowledge Evolution System (7 archivos modulares)
   * @returns {Promise<void>}
   */
  async loadKnowledgeEvolution() {
    if (this.loadedModules.has('knowledge-evolution')) {
      return Promise.resolve();
    }

    if (typeof logger !== 'undefined') {
      logger.log('[LazyLoader] Cargando Knowledge Evolution...');
    }

    const scripts = [
      'js/features/knowledge-evolution/knowledge-ingestion.js?v=2.9.398',
      'js/features/knowledge-evolution/knowledge-analysis.js?v=2.9.399',
      'js/features/knowledge-evolution/knowledge-meditation.js?v=2.9.400',
      'js/features/knowledge-evolution/knowledge-synthesis.js?v=2.9.401',
      'js/features/knowledge-evolution/knowledge-dialogue.js?v=2.9.402',
      'js/features/knowledge-evolution/knowledge-ui.js?v=2.9.403',
      'js/features/knowledge-evolution/index.js?v=2.9.403'
    ];

    try {
      await this.loadScripts(scripts);
      this.loadedModules.set('knowledge-evolution', true);

      if (typeof logger !== 'undefined') {
        logger.log('✅ Knowledge Evolution cargado');
      }
    } catch (error) {
      logger.error('[LazyLoader] Error cargando Knowledge Evolution:', error);
      throw error;
    }
  }

  /**
   * Verificar si un módulo está cargado
   * @param {string} module - Nombre del módulo
   * @returns {boolean}
   */
  isLoaded(module) {
    return this.loadedModules.has(module);
  }

  /**
   * Obtener estadísticas de carga
   * @returns {Object}
   */
  getStats() {
    return {
      loadedModules: Array.from(this.loadedModules.keys()),
      loadingModules: Array.from(this.loadingPromises.keys()),
      totalLoaded: this.loadedModules.size,
      totalLoading: this.loadingPromises.size
    };
  }

  /**
   * Cargar tema CSS de forma dinámica
   * 🔧 FIX v2.9.299: Agregado método faltante desde lazy-loader viejo
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

// Exportar globalmente
window.LazyLoader = LazyLoader;
window.lazyLoader = new LazyLoader();

// Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LazyLoader;
}
