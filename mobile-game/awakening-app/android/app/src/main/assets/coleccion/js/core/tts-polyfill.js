// ============================================================================
// TTS POLYFILL - Fallback robusto para Web Speech API
// ============================================================================
// Soluciona problemas de voces en Chrome/Brave Linux

class TTSPolyfill {
  constructor() {
    this.nativeSynthesis = window.speechSynthesis;
    this.voices = [];
    this.voicesLoaded = false;
    this.loadAttempts = 0;
    this.maxAttempts = 10;

    this.init();
  }

  init() {
    if (!this.nativeSynthesis) {
      // console.warn('⚠️ Web Speech API no disponible');
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
        // console.log(`✅ Voces TTS cargadas (intento ${this.loadAttempts}): ${voices.length} voces`);

        const spanish = voices.filter(v => v.lang.startsWith('es'));
        if (spanish.length > 0) {
          // console.log(`🇪🇸 ${spanish.length} voces en español disponibles`);
        }

        return true;
      }

      // Si no se cargaron y quedan intentos, reintentar
      if (this.loadAttempts < this.maxAttempts) {
        // console.log(`⏳ Intento ${this.loadAttempts}/${this.maxAttempts} - Esperando voces...`);
        setTimeout(attemptLoad, 500);
      } else {
        // console.warn('⚠️ No se pudieron cargar voces después de', this.maxAttempts, 'intentos');
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
    const pollInterval = setInterval(() => {
      if (this.voicesLoaded || this.loadAttempts >= this.maxAttempts) {
        clearInterval(pollInterval);
      } else {
        attemptLoad();
      }
    }, 500);
  }

  // Trick para forzar carga de voces en Chrome
  triggerVoiceLoad() {
    // console.log('🔧 Intentando forzar carga de voces...');

    // Crear y cancelar utterance (trick conocido)
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    this.nativeSynthesis.speak(utterance);

    setTimeout(() => {
      this.nativeSynthesis.cancel();

      // Reintentar obtener voces
      setTimeout(() => {
        const voices = this.nativeSynthesis.getVoices();
        if (voices && voices.length > 0) {
          this.voices = voices;
          this.voicesLoaded = true;
          // console.log('✅ Voces cargadas después de trigger:', voices.length);
        }
      }, 500);
    }, 100);
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

        setTimeout(checkVoices, 200);
      };

      checkVoices();
    });
  }

  // Diagnóstico
  diagnose() {
    // console.group('🔍 Diagnóstico TTS');
    // console.log('speechSynthesis:', !!this.nativeSynthesis);
    // console.log('Voces cargadas:', this.voicesLoaded);
    // console.log('Total de voces:', this.voices.length);
    // console.log('Voces en español:', this.getSpanishVoices().length);
    // console.log('Mejor voz española:', this.getBestSpanishVoice()?.name);
    // console.log('Intentos de carga:', this.loadAttempts);

    if (this.voices.length > 0) {
      // console.table(this.voices.slice(0, 10).map(v => ({
      //   name: v.name,
      //   lang: v.lang,
      //   default: v.default,
      //   local: v.localService
      // })));
    }

    // console.groupEnd();
  }
}

// Crear instancia global
window.ttsPolyfill = new TTSPolyfill();

// Exponer método de diagnóstico fácil
window.diagnosticarTTS = () => window.ttsPolyfill.diagnose();

// console.log('✅ TTS Polyfill cargado. Usa diagnosticarTTS() para verificar.');
