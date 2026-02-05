// ============================================================================
// TTS POLYFILL - Fallback robusto para Web Speech API
// ============================================================================
// Soluciona problemas de voces en Chrome/Brave Linux

// 🔧 FIX v2.9.198: Migrated console.log to logger
class TTSPolyfill {
  constructor() {
    this.nativeSynthesis = window.speechSynthesis;
    this.voices = [];
    this.voicesLoaded = false;
    this.loadAttempts = 0;
    this.maxAttempts = 20;
    this._timers = [];
    this._intervals = [];

    this.init();
  }

  /**
   * setTimeout wrapper con tracking para cleanup
   */
  _trackTimeout(fn, delay) {
    const id = setTimeout(() => {
      this._timers = this._timers.filter(t => t !== id);
      fn();
    }, delay);
    this._timers.push(id);
    return id;
  }

  /**
   * setInterval wrapper con tracking para cleanup
   */
  _trackInterval(fn, delay) {
    const id = setInterval(fn, delay);
    this._intervals.push(id);
    return id;
  }

  /**
   * Limpia todos los timers, intervals y recursos
   */
  destroy() {
    this._timers.forEach(id => clearTimeout(id));
    this._intervals.forEach(id => clearInterval(id));
    this._timers = [];
    this._intervals = [];

    if (this.nativeSynthesis) {
      this.nativeSynthesis.cancel();
    }

    logger.log('[TTSPolyfill] Destroyed');
  }

  init() {
    if (!this.nativeSynthesis) {
      // logger.warn('⚠️ Web Speech API no disponible');
      return;
    }

    // Estrategia agresiva de carga de voces
    this.loadVoicesAggressively();
  }

  loadVoicesAggressively() {
    const attemptLoad = () => {
      this.loadAttempts++;

      // Intentar obtener voces
      const voices = this.nativeSynthesis.getVoices();

      if (voices && voices.length > 0) {
        this.voices = voices;
        this.voicesLoaded = true;
        // logger.debug(`✅ Voces TTS cargadas (intento ${this.loadAttempts}): ${voices.length} voces`);

        const spanish = voices.filter(v => v.lang.startsWith('es'));
        if (spanish.length > 0) {
          // logger.debug(`🇪🇸 ${spanish.length} voces en español disponibles`);
        }

        return true;
      }

      // Si no se cargaron y quedan intentos, reintentar con backoff progresivo
      if (this.loadAttempts < this.maxAttempts) {
        // logger.debug(`⏳ Intento ${this.loadAttempts}/${this.maxAttempts} - Esperando voces...`);
        const retryDelay = this.loadAttempts < 5 ? 300 :
                          this.loadAttempts < 10 ? 500 : 1000;
        this._trackTimeout(attemptLoad, retryDelay);
      } else {
        // logger.warn('⚠️ No se pudieron cargar voces después de', this.maxAttempts, 'intentos');
        // Último recurso: trigger manual
        this.triggerVoiceLoad();
      }

      return false;
    };

    // Intento 1: Inmediato
    if (attemptLoad()) return;

    // Intento 2: Event listener (estándar)
    this.nativeSynthesis.addEventListener('voiceschanged', () => {
      if (!this.voicesLoaded) {
        attemptLoad();
      }
    }, { once: true });

    // Intento 3: Polling manual cada 500ms
    const pollInterval = this._trackInterval(() => {
      if (this.voicesLoaded || this.loadAttempts >= this.maxAttempts) {
        clearInterval(pollInterval);
        this._intervals = this._intervals.filter(id => id !== pollInterval);
      } else {
        attemptLoad();
      }
    }, 500);
  }

  // Trick para forzar carga de voces en Chrome/Brave
  triggerVoiceLoad() {
    // logger.debug('🔧 Intentando forzar carga de voces...');

    // Estrategia 1: Crear y cancelar utterance vacía (trick conocido para Chrome)
    const emptyUtterance = new SpeechSynthesisUtterance('');
    emptyUtterance.volume = 0;
    this.nativeSynthesis.speak(emptyUtterance);

    this._trackTimeout(() => {
      this.nativeSynthesis.cancel();

      // Reintentar obtener voces con cadena de retries post-trigger
      const postTriggerRetry = (attempt) => {
        const voices = this.nativeSynthesis.getVoices();
        if (voices && voices.length > 0) {
          this.voices = voices;
          this.voicesLoaded = true;
          return;
        }
        if (attempt < 5) {
          this._trackTimeout(() => postTriggerRetry(attempt + 1), 1000);
        }
      };
      this._trackTimeout(() => postTriggerRetry(0), 500);
    }, 100);

    // Estrategia 2: Utterance con texto real a volumen 0 (para Brave Linux)
    this._trackTimeout(() => {
      if (!this.voicesLoaded) {
        const textUtterance = new SpeechSynthesisUtterance('.');
        textUtterance.volume = 0;
        textUtterance.rate = 10;
        this.nativeSynthesis.speak(textUtterance);
        this._trackTimeout(() => {
          this.nativeSynthesis.cancel();
          const voices = this.nativeSynthesis.getVoices();
          if (voices && voices.length > 0) {
            this.voices = voices;
            this.voicesLoaded = true;
          }
        }, 200);
      }
    }, 3000);
  }

  getVoices() {
    return this.voices;
  }

  getSpanishVoices() {
    return this.voices.filter(v => v.lang && v.lang.startsWith('es'));
  }

  getBestSpanishVoice() {
    const spanish = this.getSpanishVoices();
    if (spanish.length === 0) return null;

    // Preferencias (en orden)
    const preferences = [
      'es-ES',  // España
      'es-MX',  // México
      'es-',    // Cualquier español
    ];

    for (const pref of preferences) {
      const voice = spanish.find(v => v.lang.startsWith(pref));
      if (voice) return voice;
    }

    return spanish[0];
  }

  async waitForVoices(timeout = 10000) {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkVoices = () => {
        if (this.voicesLoaded && this.voices.length > 0) {
          resolve(this.voices);
          return;
        }

        if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout esperando voces'));
          return;
        }

        this._trackTimeout(checkVoices, 200);
      };

      checkVoices();
    });
  }

  // Diagnóstico
  diagnose() {
    // logger.group('🔍 Diagnóstico TTS');
    // logger.debug('speechSynthesis:', !!this.nativeSynthesis);
    // logger.debug('Voces cargadas:', this.voicesLoaded);
    // logger.debug('Total de voces:', this.voices.length);
    // logger.debug('Voces en español:', this.getSpanishVoices().length);
    // logger.debug('Mejor voz española:', this.getBestSpanishVoice()?.name);
    // logger.debug('Intentos de carga:', this.loadAttempts);

    if (this.voices.length > 0) {
      // logger.table(this.voices.slice(0, 10).map(v => ({
      //   name: v.name,
      //   lang: v.lang,
      //   default: v.default,
      //   local: v.localService
      // })));
    }

    // logger.groupEnd();
  }
}

// Crear instancia global
window.ttsPolyfill = new TTSPolyfill();

// Exponer método de diagnóstico fácil
window.diagnosticarTTS = () => window.ttsPolyfill.diagnose();

// logger.debug('✅ TTS Polyfill cargado. Usa diagnosticarTTS() para verificar.');
