// ============================================================================
// AUDIOREADER TTS ENGINE - Motor de síntesis de voz
// ============================================================================
// v2.9.278: Modularización del AudioReader
// Maneja todos los providers de TTS: Web Speech, Native, OpenAI, ElevenLabs

class AudioReaderTTSEngine {
  constructor(audioReader) {
    this.audioReader = audioReader;
    this.synthesis = window.speechSynthesis;
    this.utterance = null;
    this.nativeTTS = null;
    this.ttsManager = null;
    this.isInitialized = false;
    this.initPromise = null;

    // Provider actual: 'browser' | 'native' | 'openai' | 'elevenlabs'
    this.provider = localStorage.getItem('tts-provider') || 'browser';

    // Voces
    this.selectedVoice = null;
    this.selectedVoiceURI = localStorage.getItem('preferred-tts-voice');
    this.rate = 1.0;

    // Plataforma
    this.isCapacitor = !!(window.Capacitor && window.Capacitor.isNative);
    this.isAndroid = this.isCapacitor && window.Capacitor.getPlatform() === 'android';
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  async init() {
    return this.ensureInitialized();
  }

  async ensureInitialized() {
    // Ya inicializado
    if (this.isInitialized) return;

    // Inicialización en progreso - esperar
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    // Iniciar nueva inicialización
    this.initPromise = this._doInit();

    try {
      await this.initPromise;
      this.isInitialized = true;
      logger.warn('✅ TTS Engine inicializado. nativeTTS:', !!this.nativeTTS, 'isCapacitor:', this.isCapacitor);
    } catch (error) {
      logger.error('❌ Error inicializando TTS:', error);
      this.initPromise = null; // Permitir reintentos
    }
  }

  async _doInit() {
    if (this.isCapacitor) {
      await this.initNativeTTS();
    }

    // Siempre cargar voces de Web Speech API como fallback
    await this.loadVoices();

    // Inicializar TTSManager si está disponible
    if (window.TTSManager) {
      this.ttsManager = new window.TTSManager();
    }

    // Auto-configurar ElevenLabs para usuarios Premium
    this.autoConfigurePremium();
  }

  async initNativeTTS() {
    try {
      logger.warn('🔍 initNativeTTS: Capacitor.Plugins.TextToSpeech =', !!window.Capacitor?.Plugins?.TextToSpeech);

      if (window.Capacitor?.Plugins?.TextToSpeech) {
        this.nativeTTS = window.Capacitor.Plugins.TextToSpeech;
        logger.warn('🔍 nativeTTS asignado:', !!this.nativeTTS);

        const result = await this.nativeTTS.getSupportedLanguages();
        const languages = result?.languages || [];
        logger.warn('✅ TTS nativo: idiomas disponibles:', languages.length);

        // Pre-calentar el TTS (sin await para no bloquear)
        this.nativeTTS.speak({
          text: ' ',
          lang: 'es-ES',
          rate: 1.0,
          pitch: 1.0,
          volume: 0.01
        }).catch(() => {
          // Normal en primer uso
        });

      } else if (window.capacitorTextToSpeech?.TextToSpeech) {
        this.nativeTTS = window.capacitorTextToSpeech.TextToSpeech;
        logger.warn('🔍 nativeTTS asignado (fallback):', !!this.nativeTTS);
      } else {
        logger.warn('⚠️ No se encontró plugin TextToSpeech');
      }
    } catch (error) {
      logger.error('❌ Error en initNativeTTS:', error);
      this.nativeTTS = null;
    }
  }

  async loadVoices() {
    try {
      if (!this.synthesis || typeof this.synthesis.getVoices !== 'function') {
        return;
      }

      // Si hay polyfill disponible
      if (window.ttsPolyfill) {
        try {
          await window.ttsPolyfill.waitForVoices(10000);
          this.selectBestVoice();
          return;
        } catch (error) {
          // Continuar con método estándar
        }
      }

      const voices = this.synthesis.getVoices();
      if (voices && voices.length > 0) {
        this.selectBestVoice();
      } else {
        this.synthesis.addEventListener('voiceschanged', () => {
          this.selectBestVoice();
        }, { once: true });

        // Reintentos
        setTimeout(() => {
          const retryVoices = this.synthesis.getVoices();
          if (retryVoices?.length > 0 && !this.selectedVoice) {
            this.selectBestVoice();
          }
        }, 500);

        setTimeout(() => {
          if (!this.selectedVoice) {
            this.selectBestVoice();
          }
        }, 2000);
      }
    } catch (error) {
      logger.error('Error loading voices:', error);
    }
  }

  selectBestVoice() {
    try {
      if (!this.synthesis) return;

      const voices = this.synthesis.getVoices();
      if (!voices || voices.length === 0) return;

      // Intentar cargar voz preferida
      if (this.selectedVoiceURI) {
        const preferredVoice = voices.find(v => v.voiceURI === this.selectedVoiceURI);
        if (preferredVoice) {
          this.selectedVoice = preferredVoice;
          return;
        }
      }

      // Buscar voz española
      const spanishVoices = voices.filter(v => v.lang?.startsWith('es'));
      if (spanishVoices.length > 0) {
        const esES = spanishVoices.find(v => v.lang === 'es-ES');
        this.selectedVoice = esES || spanishVoices[0];
      } else {
        this.selectedVoice = voices[0];
      }
    } catch (error) {
      logger.error('Error selecting voice:', error);
    }
  }

  autoConfigurePremium() {
    if (window.authHelper?.isPremium?.()) {
      const savedProvider = localStorage.getItem('tts-provider');
      if (!savedProvider || savedProvider === 'browser') {
        if (this.ttsManager?.providers?.elevenlabs) {
          this.provider = 'elevenlabs';
          try {
            localStorage.setItem('tts-provider', 'elevenlabs');
          } catch (e) {}
        }
      }
    }
  }

  // ==========================================================================
  // VOCES
  // ==========================================================================

  async getAvailableVoices() {
    if (this.nativeTTS) {
      try {
        const result = await this.nativeTTS.getSupportedVoices();
        const voices = result.voices || [];
        return voices.filter(v => v.lang?.startsWith('es')).slice(0, 20);
      } catch (error) {
        return [];
      }
    }

    try {
      if (!this.synthesis) return [];
      const voices = this.synthesis.getVoices();
      return (voices || []).filter(v => v.lang?.startsWith('es')).slice(0, 20);
    } catch (error) {
      return [];
    }
  }

  setVoice(voiceURI) {
    this.selectedVoiceURI = voiceURI;
    try {
      localStorage.setItem('preferred-tts-voice', voiceURI);
    } catch (e) {}

    if (this.synthesis) {
      const voices = this.synthesis.getVoices();
      const voice = voices?.find(v => v.voiceURI === voiceURI);
      if (voice) {
        this.selectedVoice = voice;
      }
    }
  }

  setRate(rate) {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
    try {
      localStorage.setItem('tts-rate', this.rate.toString());
    } catch (e) {}
  }

  getRate() {
    return this.rate;
  }

  // ==========================================================================
  // PROVIDER
  // ==========================================================================

  setProvider(provider) {
    if (!['browser', 'native', 'openai', 'elevenlabs'].includes(provider)) {
      logger.warn('Provider no válido:', provider);
      return false;
    }

    // Validar disponibilidad
    if (provider === 'openai' && !localStorage.getItem('openai-tts-key')) {
      window.toast?.error('Configura tu API Key de OpenAI primero');
      return false;
    }

    if (provider === 'elevenlabs' && !this.ttsManager?.isElevenLabsAvailable?.()) {
      window.toast?.error('ElevenLabs requiere suscripción Premium');
      return false;
    }

    this.provider = provider;
    try {
      localStorage.setItem('tts-provider', provider);
    } catch (e) {}

    if (this.ttsManager) {
      this.ttsManager.setProvider(provider);
    }

    return true;
  }

  getProvider() {
    return this.provider;
  }

  // ==========================================================================
  // SÍNTESIS DE VOZ
  // ==========================================================================

  async speak(paragraph, index, callbacks = {}) {
    // Asegurar que TTS está inicializado antes de hablar
    await this.ensureInitialized();

    logger.warn('🔊 speak: isInitialized=', this.isInitialized, 'nativeTTS=', !!this.nativeTTS, 'provider=', this.provider);

    const { onEnd, onError, showPauseIndicator } = callbacks;

    if (this.provider === 'elevenlabs' && this.ttsManager?.isElevenLabsAvailable?.()) {
      await this.speakWithElevenLabs(paragraph, index, callbacks);
    } else if (this.provider === 'openai' && this.ttsManager && localStorage.getItem('openai-tts-key')) {
      await this.speakWithOpenAI(paragraph, index, callbacks);
    } else if (this.provider === 'native' && this.nativeTTS) {
      logger.warn('🔊 Usando TTS nativo (provider=native)');
      await this.speakWithNativeTTS(paragraph, index, callbacks);
    } else if (this.nativeTTS) {
      logger.warn('🔊 Usando TTS nativo (fallback)');
      await this.speakWithNativeTTS(paragraph, index, callbacks);
    } else {
      logger.warn('🔊 Usando Web Speech API (fallback)');
      this.speakWithWebSpeechAPI(paragraph, index, callbacks);
    }
  }

  async speakWithNativeTTS(paragraph, index, callbacks = {}, retryCount = 0) {
    const { onEnd, onError, onPauseNeeded } = callbacks;

    try {
      const textToSpeak = paragraph.text || '';
      logger.warn('🎤 speakWithNativeTTS: texto =', textToSpeak.substring(0, 50) + '...');

      if (!textToSpeak || textToSpeak.trim().length === 0) {
        logger.warn('⚠️ Texto vacío, saltando');
        if (onEnd) onEnd(100);
        return;
      }

      const options = {
        text: textToSpeak,
        lang: 'es-ES',
        rate: this.rate,
        pitch: 1.0,
        volume: 1.0,
        category: 'playback'
      };

      if (this.selectedVoiceURI) {
        options.voice = this.selectedVoiceURI;
      }

      logger.warn('🎤 Iniciando speak nativo...');
      const startTime = Date.now();
      await this.nativeTTS.speak(options);
      const elapsed = Date.now() - startTime;
      logger.warn('🎤 speak nativo completado en', elapsed, 'ms');

      paragraph.spoken = true;

      // Manejar pausa y siguiente
      if (onEnd) {
        const pauseDuration = paragraph.pauseAfter || 300;
        if (paragraph.isExerciseStep && pauseDuration > 1000 && onPauseNeeded) {
          onPauseNeeded(pauseDuration, paragraph.stepNumber, paragraph.totalSteps);
        }
        onEnd(pauseDuration);
      }
    } catch (error) {
      // Ignore interrupted/canceled errors (from stop/pause)
      const errorMsg = error?.message?.toLowerCase() || '';
      if (errorMsg.includes('interrupted') || errorMsg.includes('canceled') || errorMsg.includes('cancelled')) {
        logger.warn('⏹️ TTS nativo interrumpido (pausa/stop)');
        return;
      }

      logger.error('❌ Error en TTS nativo:', error);

      if (retryCount < 3 && error.message?.includes('not ready')) {
        setTimeout(() => {
          this.speakWithNativeTTS(paragraph, index, callbacks, retryCount + 1);
        }, 1000);
      } else if (onError) {
        onError(error);
      }
    }
  }

  speakWithWebSpeechAPI(paragraph, index, callbacks = {}) {
    const { onEnd, onError, onPauseNeeded, onWordBoundary } = callbacks;

    if (!this.synthesis) {
      onError?.(new Error('speechSynthesis no disponible'));
      return;
    }

    if (!this.selectedVoice) {
      const voices = this.synthesis.getVoices();
      if (!voices?.length) {
        onError?.(new Error('No hay voces disponibles'));
        return;
      }
      this.selectBestVoice();
      if (!this.selectedVoice) {
        this.selectedVoice = voices.find(v => v.lang?.startsWith('es')) || voices[0];
      }
    }

    if (this.synthesis.speaking || this.synthesis.pending) {
      this.synthesis.cancel();
    }

    // Limpiar utterance anterior
    if (this.utterance) {
      this.utterance.onstart = null;
      this.utterance.onend = null;
      this.utterance.onerror = null;
      this.utterance.onboundary = null;
    }

    try {
      this.utterance = new SpeechSynthesisUtterance(paragraph.text);
      this.utterance.voice = this.selectedVoice;
      this.utterance.rate = this.rate;
      this.utterance.pitch = 1.0;
      this.utterance.volume = 1.0;
      this.utterance.lang = this.selectedVoice?.lang || 'es-ES';
    } catch (error) {
      onError?.(error);
      return;
    }

    // Word boundary para palabra por palabra
    if (onWordBoundary) {
      this.utterance.onboundary = (event) => {
        if (event.name === 'word') {
          onWordBoundary(event.charIndex, event.charLength);
        }
      };
    }

    this.utterance.onend = () => {
      paragraph.spoken = true;
      const pauseDuration = paragraph.pauseAfter || 300;

      if (paragraph.isExerciseStep && pauseDuration > 1000 && onPauseNeeded) {
        onPauseNeeded(pauseDuration, paragraph.stepNumber, paragraph.totalSteps);
      }

      onEnd?.(pauseDuration);
    };

    this.utterance.onerror = (event) => {
      if (event.error === 'interrupted' || event.error === 'canceled') {
        return;
      }
      onError?.(event);
    };

    try {
      this.synthesis.speak(this.utterance);

      // Chrome workaround
      setTimeout(() => {
        if (this.synthesis.paused) {
          this.synthesis.resume();
        }
      }, 100);
    } catch (error) {
      onError?.(error);
    }
  }

  async speakWithOpenAI(paragraph, index, callbacks = {}) {
    const { onEnd, onError, onPauseNeeded } = callbacks;

    if (!this.ttsManager) {
      this.speakWithWebSpeechAPI(paragraph, index, callbacks);
      return;
    }

    try {
      const voice = localStorage.getItem('openai-voice') || 'nova';
      const model = localStorage.getItem('openai-model') || 'tts-1';

      await this.ttsManager.speak(paragraph.text, {
        voice,
        model,
        speed: this.rate,
        onEnd: () => {
          paragraph.spoken = true;
          const pauseDuration = paragraph.pauseAfter || 300;

          if (paragraph.isExerciseStep && pauseDuration > 1000 && onPauseNeeded) {
            onPauseNeeded(pauseDuration, paragraph.stepNumber, paragraph.totalSteps);
          }

          onEnd?.(pauseDuration);
        },
        onError: (error) => {
          logger.error('❌ Error en OpenAI TTS:', error);

          // Fallback a navegador
          this.provider = 'browser';
          try { localStorage.setItem('tts-provider', 'browser'); } catch(e) {}
          this.ttsManager?.setProvider('browser');

          this.speakWithWebSpeechAPI(paragraph, index, callbacks);
        }
      });
    } catch (error) {
      this.provider = 'browser';
      try { localStorage.setItem('tts-provider', 'browser'); } catch(e) {}
      this.speakWithWebSpeechAPI(paragraph, index, callbacks);
    }
  }

  async speakWithElevenLabs(paragraph, index, callbacks = {}) {
    const { onEnd, onError, onPauseNeeded } = callbacks;

    if (!this.ttsManager?.providers?.elevenlabs) {
      this.speakWithWebSpeechAPI(paragraph, index, callbacks);
      return;
    }

    try {
      const voice = localStorage.getItem('elevenlabs-voice') || 'EXAVITQu4vr4xnSDxMaL';
      const stability = parseFloat(localStorage.getItem('elevenlabs-stability') || '0.5');
      const similarityBoost = parseFloat(localStorage.getItem('elevenlabs-similarity') || '0.75');

      const bookId = this.audioReader?.bookEngine?.currentBook || 'unknown';
      const chapterId = this.audioReader?.bookEngine?.currentChapter || 'unknown';

      await this.ttsManager.providers.elevenlabs.speakWithContext(paragraph.text, {
        voiceId: voice,
        bookId,
        chapterId,
        paragraphIndex: index,
        stability,
        similarityBoost,
        onEnd: () => {
          paragraph.spoken = true;
          const pauseDuration = paragraph.pauseAfter || 300;

          if (paragraph.isExerciseStep && pauseDuration > 1000 && onPauseNeeded) {
            onPauseNeeded(pauseDuration, paragraph.stepNumber, paragraph.totalSteps);
          }

          onEnd?.(pauseDuration);
        },
        onError: (error) => {
          logger.error('❌ Error en ElevenLabs:', error);

          // Fallback
          this.provider = 'browser';
          try { localStorage.setItem('tts-provider', 'browser'); } catch(e) {}

          this.speakWithWebSpeechAPI(paragraph, index, callbacks);
        }
      });
    } catch (error) {
      this.provider = 'browser';
      try { localStorage.setItem('tts-provider', 'browser'); } catch(e) {}
      this.speakWithWebSpeechAPI(paragraph, index, callbacks);
    }
  }

  // ==========================================================================
  // CONTROL
  // ==========================================================================

  pause() {
    if (this.provider === 'elevenlabs' && this.ttsManager?.providers?.elevenlabs) {
      this.ttsManager.providers.elevenlabs.pause?.();
    } else if (['openai', 'huggingface'].includes(this.provider) && this.ttsManager) {
      this.ttsManager.pause?.();
    } else if (this.nativeTTS) {
      // Native TTS can't pause - we stop it and will restart from current paragraph on resume
      try { this.nativeTTS.stop(); } catch (e) {}
    } else if (this.synthesis?.speaking) {
      this.synthesis.pause();
    }
  }

  resume() {
    if (this.provider === 'elevenlabs' && this.ttsManager?.providers?.elevenlabs) {
      this.ttsManager.providers.elevenlabs.resume?.();
    } else if (['openai', 'huggingface'].includes(this.provider) && this.ttsManager) {
      this.ttsManager.resume?.();
    } else if (this.synthesis?.paused) {
      this.synthesis.resume();
    }
  }

  stop() {
    if (this.provider === 'elevenlabs' && this.ttsManager?.providers?.elevenlabs) {
      this.ttsManager.providers.elevenlabs.stop?.();
    } else if (['openai', 'huggingface'].includes(this.provider) && this.ttsManager) {
      this.ttsManager.stop?.();
    }

    if (this.nativeTTS) {
      try { this.nativeTTS.stop(); } catch (e) {}
    }

    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }

    // Limpiar utterance
    if (this.utterance) {
      this.utterance.onstart = null;
      this.utterance.onend = null;
      this.utterance.onerror = null;
      this.utterance.onboundary = null;
      this.utterance = null;
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    this.stop();

    if (this.ttsManager?.providers?.openai) {
      try { this.ttsManager.providers.openai.cleanup?.(); } catch (e) {}
    }

    this.selectedVoice = null;
    this.nativeTTS = null;
    this.ttsManager = null;
    this.audioReader = null;
  }
}

// Exportar globalmente
window.AudioReaderTTSEngine = AudioReaderTTSEngine;
