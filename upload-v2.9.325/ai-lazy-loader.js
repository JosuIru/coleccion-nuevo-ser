/**
 * AI LAZY LOADER - Wrapper para carga dinámica de features AI
 * ============================================================
 * Proporciona métodos convenientes para cargar features AI solo cuando se necesitan
 *
 * @version 2.9.324
 * @fix v2.9.324: Instancia aiAdapter y aiChatModal automáticamente en lazy loading
 */

class AILazyLoader {
  constructor() {
    this.loadingPromises = new Map();
  }

  /**
   * Mostrar AI Chat Modal con carga lazy
   * Uso: window.aiLazyLoader.showAIChatModal()
   */
  async showAIChatModal() {
    try {
      // Cargar módulo si no está cargado
      if (!window.lazyLoader?.isLoaded('ai-chat-modal')) {
        if (window.toast) {
          window.toast.info('Cargando Chat IA...');
        }
        await window.lazyLoader.loadAIChatModal();
      }

      // Instanciar aiAdapter si no existe
      if (!window.aiAdapter && window.AIAdapter && window.AIConfig) {
        logger.log('[AILazyLoader] Instanciando AIAdapter...');
        if (!window.aiConfig) {
          window.aiConfig = new window.AIConfig();
          logger.log('[AILazyLoader] AIConfig instanciado');
        }
        window.aiAdapter = new window.AIAdapter(window.aiConfig);
        logger.log('[AILazyLoader] AIAdapter instanciado correctamente');
      }

      // Instanciar modal si solo se cargó la clase pero no la instancia
      if (!window.aiChatModal && window.AIChatModal) {
        logger.log('[AILazyLoader] Instanciando AI Chat Modal...');

        // Obtener bookEngine - priorizar bookReader.bookEngine
        let bookEngine = null;
        if (window.bookReader?.bookEngine) {
          bookEngine = window.bookReader.bookEngine;
          logger.log('[AILazyLoader] bookEngine obtenido desde window.bookReader');
        } else if (window.bookEngine) {
          bookEngine = window.bookEngine;
          logger.log('[AILazyLoader] bookEngine obtenido desde window.bookEngine');
        }

        // Obtener aiAdapter
        const aiAdapter = window.aiAdapter;

        // Debug logging
        logger.log('[AILazyLoader] Dependencias encontradas:', {
          bookEngine: !!bookEngine,
          aiAdapter: !!aiAdapter,
          bookReader: !!window.bookReader,
          windowBookEngine: !!window.bookEngine,
          windowAIAdapter: !!window.aiAdapter
        });

        if (bookEngine && aiAdapter) {
          window.aiChatModal = new window.AIChatModal(bookEngine, aiAdapter);
          logger.log('[AILazyLoader] AI Chat Modal instanciado correctamente');
        } else {
          const missing = [];
          if (!bookEngine) missing.push('bookEngine');
          if (!aiAdapter) missing.push('aiAdapter');

          logger.error('[AILazyLoader] No se encontraron dependencias:', missing.join(', '));

          if (window.toast) {
            window.toast.error('Error: Sistema IA no inicializado');
          }
          return;
        }
      }

      // Abrir modal
      if (window.aiChatModal) {
        window.aiChatModal.open();
      } else if (typeof openAIChatModal === 'function') {
        openAIChatModal();
      } else {
        logger.error('[AILazyLoader] AI Chat Modal no encontrado después de carga');
      }
    } catch (error) {
      logger.error('[AILazyLoader] Error cargando AI Chat Modal:', error);
      if (window.toast) {
        window.toast.error('Error al cargar Chat IA');
      }
    }
  }

  /**
   * Mostrar AI Settings Modal con carga lazy
   * Uso: window.aiLazyLoader.showAISettings()
   */
  async showAISettings() {
    try {
      // Cargar módulo si no está cargado
      if (!window.lazyLoader?.isLoaded('ai-settings')) {
        if (window.toast) {
          window.toast.info('Cargando Configuración IA...');
        }
        await window.lazyLoader.loadAISettings();
      }

      // Abrir modal
      if (window.aiSettingsModal) {
        window.aiSettingsModal.open();
      } else if (typeof openAISettingsModal === 'function') {
        openAISettingsModal();
      } else {
        logger.error('[AILazyLoader] AI Settings Modal no encontrado después de carga');
      }
    } catch (error) {
      logger.error('[AILazyLoader] Error cargando AI Settings:', error);
      if (window.toast) {
        window.toast.error('Error al cargar Configuración IA');
      }
    }
  }

  /**
   * Cargar AI Suggestions on-demand
   * Uso: await window.aiLazyLoader.ensureAISuggestions()
   */
  async ensureAISuggestions() {
    if (window.lazyLoader?.isLoaded('ai-suggestions')) {
      return Promise.resolve();
    }

    try {
      await window.lazyLoader.loadAISuggestions();
      return true;
    } catch (error) {
      logger.error('[AILazyLoader] Error cargando AI Suggestions:', error);
      return false;
    }
  }

  /**
   * Cargar AI Premium features on-demand
   * Uso: await window.aiLazyLoader.ensureAIPremium()
   */
  async ensureAIPremium() {
    if (window.lazyLoader?.isLoaded('ai-premium')) {
      return Promise.resolve();
    }

    try {
      await window.lazyLoader.loadAIPremium();
      return true;
    } catch (error) {
      logger.error('[AILazyLoader] Error cargando AI Premium:', error);
      return false;
    }
  }

  /**
   * Cargar ElevenLabs TTS Provider (solo cuando se selecciona)
   * Uso: await window.aiLazyLoader.ensureElevenLabs()
   */
  async ensureElevenLabs() {
    if (window.lazyLoader?.isLoaded('elevenlabs-tts')) {
      return Promise.resolve();
    }

    try {
      if (typeof logger !== 'undefined') {
        logger.log('[AILazyLoader] Cargando ElevenLabs TTS Provider...');
      }
      await window.lazyLoader.loadElevenLabs();
      return true;
    } catch (error) {
      logger.error('[AILazyLoader] Error cargando ElevenLabs:', error);
      return false;
    }
  }

  /**
   * Cargar Resource AI Helper on-demand
   * Uso: await window.aiLazyLoader.ensureResourceAIHelper()
   */
  async ensureResourceAIHelper() {
    if (window.lazyLoader?.isLoaded('resource-ai-helper')) {
      return Promise.resolve();
    }

    try {
      await window.lazyLoader.loadResourceAIHelper();
      return true;
    } catch (error) {
      logger.error('[AILazyLoader] Error cargando Resource AI Helper:', error);
      return false;
    }
  }

  /**
   * Pre-cargar features AI en segundo plano (opcional)
   * Útil si sabemos que el usuario probablemente las usará
   */
  async preloadAIFeatures() {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        this.ensureAISuggestions();
        // Cargar chat modal después de 5 segundos idle
        setTimeout(() => {
          this.ensureAIChatModal();
        }, 5000);
      }, { timeout: 10000 });
    }
  }

  /**
   * Verificar si alguna feature AI está cargada
   */
  hasAnyFeatureLoaded() {
    if (!window.lazyLoader) return false;

    return window.lazyLoader.isLoaded('ai-chat-modal') ||
           window.lazyLoader.isLoaded('ai-settings') ||
           window.lazyLoader.isLoaded('ai-suggestions') ||
           window.lazyLoader.isLoaded('ai-premium') ||
           window.lazyLoader.isLoaded('elevenlabs-tts') ||
           window.lazyLoader.isLoaded('resource-ai-helper');
  }

  /**
   * Obtener estado de carga de features AI
   */
  getLoadStatus() {
    if (!window.lazyLoader) {
      return { ready: false, message: 'LazyLoader no disponible' };
    }

    return {
      ready: true,
      aiChatModal: window.lazyLoader.isLoaded('ai-chat-modal'),
      aiSettings: window.lazyLoader.isLoaded('ai-settings'),
      aiSuggestions: window.lazyLoader.isLoaded('ai-suggestions'),
      aiPremium: window.lazyLoader.isLoaded('ai-premium'),
      elevenLabs: window.lazyLoader.isLoaded('elevenlabs-tts'),
      resourceAIHelper: window.lazyLoader.isLoaded('resource-ai-helper')
    };
  }

  /**
   * Helper privado para cargar AI Chat Modal sin mostrar
   */
  async ensureAIChatModal() {
    if (window.lazyLoader?.isLoaded('ai-chat-modal')) {
      return Promise.resolve();
    }

    try {
      await window.lazyLoader.loadAIChatModal();
      return true;
    } catch (error) {
      logger.error('[AILazyLoader] Error cargando AI Chat Modal:', error);
      return false;
    }
  }
}

// Exportar globalmente
window.AILazyLoader = AILazyLoader;
window.aiLazyLoader = new AILazyLoader();

// Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AILazyLoader;
}
