// ============================================================================
// AUDIOREADER - Sistema de Narración con TTS (Text-to-Speech)
// ============================================================================
// v2.9.282: Fix crítico - ambient/binaural ahora usan localStorage (funcionan minimizado)
//
// Módulos:
//   - AudioReaderUtils      - Timer tracking, formateo de tiempo
//   - AudioReaderContent    - Preparación de contenido
//   - AudioReaderHighlighter - Resaltado de texto
//   - AudioReaderTTSEngine  - Motor de síntesis de voz
//   - AudioReaderPlayback   - Control de reproducción
//   - AudioReaderEvents     - Gestión de eventos
//   - AudioReaderUI         - Interfaz de usuario
//
// Módulos externos (ya existentes):
//   - AudioReaderSleepTimer
//   - AudioReaderBookmarks
//   - AudioReaderMeditation
//   - AudioReaderPosition

class AudioReader {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;

    // Estado de reproducción
    this.isPlaying = false;
    this.isPaused = false;
    this.currentParagraphIndex = 0;
    this.startTime = null;

    // Inicializar módulos internos
    this.utils = new (window.AudioReaderUtils || AudioReaderUtils)();
    this.content = new (window.AudioReaderContent || AudioReaderContent)(this);
    this.highlighter = new (window.AudioReaderHighlighter || AudioReaderHighlighter)(this);
    this.tts = new (window.AudioReaderTTSEngine || AudioReaderTTSEngine)(this);
    this.playback = new (window.AudioReaderPlayback || AudioReaderPlayback)(this);
    this.events = new (window.AudioReaderEvents || AudioReaderEvents)(this);
    this.ui = new (window.AudioReaderUI || AudioReaderUI)(this);

    // Inicializar módulos externos (si están disponibles)
    if (window.AudioReaderSleepTimer) {
      this.sleepTimerModule = new window.AudioReaderSleepTimer(this);
    }

    if (window.AudioReaderMeditation) {
      this.meditationModule = new window.AudioReaderMeditation(this);
    }

    if (window.AudioReaderBookmarks) {
      this.bookmarksModule = new window.AudioReaderBookmarks(this);
    }

    if (window.AudioReaderPosition) {
      this.positionModule = new window.AudioReaderPosition(this);
    }

    // Cargar preferencia de palabra por palabra
    this.highlighter.loadPreference();

    // Inicializar TTS
    this.init();
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  async init() {
    await this.tts.init();

    // Inicializar AudioMixer para sonidos de fondo (ambient y binaural)
    await this.initAudioMixer();

    // Adjuntar handlers globales
    this.events.attachVisibilityHandler();
    this.events.attachBeforeUnloadHandler();

    if (typeof logger !== 'undefined') {
      logger.log('✅ AudioReader inicializado (v2.9.280 modular)');
    }
  }

  async initAudioMixer() {
    try {
      if (window.AudioMixer && !window.audioMixer) {
        window.audioMixer = new window.AudioMixer();
        await window.audioMixer.initialize();
        if (typeof logger !== 'undefined') {
          logger.log('🎵 AudioMixer inicializado para ambient/binaural');
        }
      }
    } catch (error) {
      logger.warn('Error inicializando AudioMixer:', error);
    }
  }

  // ==========================================================================
  // API PÚBLICA - Reproducción
  // ==========================================================================

  async play(chapterContent = null) {
    return await this.playback.play(chapterContent);
  }

  async pause() {
    await this.playback.pause();
  }

  async resume() {
    await this.playback.resume();
  }

  async stop(resetPosition = true) {
    await this.playback.stop(resetPosition);
  }

  async next() {
    await this.playback.next();
  }

  async previous() {
    await this.playback.previous();
  }

  // ==========================================================================
  // API PÚBLICA - Configuración
  // ==========================================================================

  setRate(rate) {
    this.tts.setRate(rate);
  }

  setVoice(voiceURI) {
    this.tts.setVoice(voiceURI);
  }

  setTTSProvider(provider) {
    return this.tts.setProvider(provider);
  }

  async getAvailableVoices() {
    return await this.tts.getAvailableVoices();
  }

  toggleAutoAdvance() {
    return this.playback.toggleAutoAdvance();
  }

  toggleWordByWord() {
    const enabled = !this.highlighter.isWordByWordEnabled();
    this.highlighter.setWordByWordEnabled(enabled);

    if (enabled) {
      window.toast?.success('Seguimiento palabra por palabra activado');
    } else {
      window.toast?.info('Seguimiento palabra por palabra desactivado');
    }

    return enabled;
  }

  // ==========================================================================
  // API PÚBLICA - UI
  // ==========================================================================

  async show() {
    try {
      // Preparar contenido si no está listo
      const paragraphs = this.content.getParagraphs();
      if (paragraphs.length === 0) {
        const chapterContent = document.querySelector('.chapter-content');
        if (chapterContent) {
          this.content.prepare(chapterContent.innerHTML);
        }
      }

      // Renderizar UI
      await this.ui.render();

      // Verificar posición guardada
      const savedPosition = this.positionModule?.load?.();
      if (savedPosition && savedPosition.paragrafo > 0) {
        this.currentParagraphIndex = savedPosition.paragrafo;
      }

    } catch (error) {
      logger.error('Error en show():', error);
    }
  }

  hide() {
    // Guardar posición antes de cerrar
    if (this.content.getParagraphs().length > 0 && this.currentParagraphIndex > 0) {
      this.positionModule?.save?.();
    }

    // Detener sin resetear posición
    this.playback.stop(false);

    // Limpiar UI
    this.ui.destroy();
    this.events.detachKeyboardListeners();
    this.highlighter.clearHighlights();
  }

  async toggle() {
    const controls = document.getElementById('audioreader-controls');
    if (controls) {
      this.hide();
    } else {
      await this.show();
    }
  }

  // ==========================================================================
  // API PÚBLICA - Bookmarks
  // ==========================================================================

  addBookmark(nombre = null) {
    return this.bookmarksModule?.add?.(nombre);
  }

  getBookmarksForCurrentChapter() {
    return this.bookmarksModule?.getForCurrentChapter?.() || [];
  }

  jumpToBookmark(indice) {
    this.bookmarksModule?.jumpTo?.(indice);
  }

  deleteBookmark(indice) {
    this.bookmarksModule?.delete?.(indice);
  }

  // ==========================================================================
  // API PÚBLICA - Sleep Timer
  // ==========================================================================

  setSleepTimer(minutos) {
    this.sleepTimerModule?.set?.(minutos);
  }

  clearSleepTimer() {
    this.sleepTimerModule?.clear?.();
  }

  getSleepTimerRemaining() {
    return this.sleepTimerModule?.getRemaining?.() || 0;
  }

  // ==========================================================================
  // API PÚBLICA - Posición
  // ==========================================================================

  savePosition() {
    this.positionModule?.save?.();
  }

  loadLastPosition() {
    return this.positionModule?.load?.();
  }

  // ==========================================================================
  // API PÚBLICA - Estado
  // ==========================================================================

  isSupported() {
    return !!(window.speechSynthesis || (window.Capacitor?.Plugins?.TextToSpeech));
  }

  getStatus() {
    const paragraphs = this.content.getParagraphs();
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentParagraph: this.currentParagraphIndex,
      totalParagraphs: paragraphs.length,
      rate: this.tts.getRate(),
      provider: this.tts.getProvider(),
      autoAdvance: this.playback.isAutoAdvanceEnabled(),
      wordByWord: this.highlighter.isWordByWordEnabled(),
      sleepTimer: this.getSleepTimerRemaining()
    };
  }

  // ==========================================================================
  // BACKWARD COMPATIBILITY
  // ==========================================================================

  // Para código existente que accede directamente a propiedades
  get paragraphs() {
    return this.content.getParagraphs();
  }

  get rate() {
    return this.tts.getRate();
  }

  get autoAdvanceChapter() {
    return this.playback.isAutoAdvanceEnabled();
  }

  get wordByWordEnabled() {
    return this.highlighter.isWordByWordEnabled();
  }

  get ttsProvider() {
    return this.tts.getProvider();
  }

  // Métodos legacy que delegan a módulos
  prepareContent(chapterContent) {
    return this.content.prepare(chapterContent);
  }

  speakParagraph(index) {
    this.currentParagraphIndex = index;
    this.playback.speakCurrentParagraph();
  }

  highlightParagraph(index) {
    this.highlighter.highlightParagraph(index);
  }

  clearHighlights() {
    this.highlighter.clearHighlights();
  }

  async renderControls() {
    await this.ui.render();
  }

  async updateUI() {
    await this.ui.updateUI();
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  cleanup() {
    // Detener reproducción
    this.playback.stop(true);

    // Limpiar módulos
    this.utils.clearAllTimers();
    this.tts.stop();
    this.events.cleanup();
    this.highlighter.clearHighlights();

    if (typeof logger !== 'undefined') {
      logger.log('🧹 AudioReader cleanup completado');
    }
  }

  destroy() {
    this.cleanup();

    // Destruir módulos
    this.utils.destroy();
    this.content.destroy();
    this.highlighter.destroy();
    this.tts.destroy();
    this.playback.destroy();
    this.events.destroy();
    this.ui.destroy();

    // Destruir módulos externos
    this.sleepTimerModule?.destroy?.();
    this.meditationModule?.destroy?.();
    this.bookmarksModule?.destroy?.();
    this.positionModule?.destroy?.();

    // Limpiar referencia global
    if (window.audioReader === this) {
      window.audioReader = null;
    }

    if (typeof logger !== 'undefined') {
      logger.log('💥 AudioReader destruido');
    }
  }
}

// Exportar globalmente
window.AudioReader = AudioReader;
