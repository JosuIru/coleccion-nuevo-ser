// ============================================================================
// AUDIOREADER MEDITATION - Módulo de audio meditativo
// ============================================================================
// Extraído de audioreader.js para modularización
// v2.9.234: First modular extraction

/**
 * Maneja los sonidos de meditación (campanas, pausas) para el AudioReader
 * @class
 */
class AudioReaderMeditation {
  constructor(audioReader) {
    this.audioReader = audioReader;
    this.audioContext = null;
    this.bellEnabled = localStorage.getItem('meditation-bell-enabled') !== 'false';

    // Estado de pausas
    this.currentPauseEndTime = null;
    this.pauseResolve = null;
    this.pauseTimerInterval = null;
  }

  /**
   * Inicializa el contexto de audio para sonidos de meditación
   */
  init() {
    if (this.audioContext) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioContext = new AudioContext();
        logger.log('[Meditation] Audio context initialized');
      }
    } catch (error) {
      logger.warn('[Meditation] Could not initialize audio context:', error);
    }
  }

  /**
   * Reproduce un sonido de campana/gong para transiciones de meditación
   * @param {string} type - 'start' | 'end' | 'soft'
   */
  playBell(type = 'start') {
    if (!this.bellEnabled) return;

    // Inicializar contexto si no existe
    if (!this.audioContext) {
      this.init();
    }

    const ctx = this.audioContext;
    if (!ctx) return;

    // Reanudar contexto si está suspendido (política de autoplay)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    try {
      const now = ctx.currentTime;

      // Crear osciladores para un sonido de campana tibetana
      const fundamental = ctx.createOscillator();
      const harmonic1 = ctx.createOscillator();
      const harmonic2 = ctx.createOscillator();

      const gainNode = ctx.createGain();
      const filterNode = ctx.createBiquadFilter();

      // Configurar frecuencias según tipo
      let baseFreq, duration, volume;
      switch (type) {
        case 'start':
          baseFreq = 528; // Frecuencia de transformación (Solfeggio)
          duration = 4;
          volume = 0.3;
          break;
        case 'end':
          baseFreq = 432; // Frecuencia de sanación
          duration = 3;
          volume = 0.25;
          break;
        case 'soft':
        default:
          baseFreq = 396; // Frecuencia de liberación
          duration = 2;
          volume = 0.15;
          break;
      }

      // Configurar osciladores (fundamental + armónicos)
      fundamental.type = 'sine';
      fundamental.frequency.setValueAtTime(baseFreq, now);

      harmonic1.type = 'sine';
      harmonic1.frequency.setValueAtTime(baseFreq * 2.756, now);

      harmonic2.type = 'sine';
      harmonic2.frequency.setValueAtTime(baseFreq * 5.404, now);

      // Filtro para suavizar
      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(2000, now);
      filterNode.Q.setValueAtTime(1, now);

      // Envelope ADSR para la campana
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(volume * 0.7, now + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Conectar nodos
      fundamental.connect(gainNode);
      harmonic1.connect(gainNode);
      harmonic2.connect(gainNode);
      gainNode.connect(filterNode);
      filterNode.connect(ctx.destination);

      // Reducir volumen de armónicos
      const harm1Gain = ctx.createGain();
      harm1Gain.gain.setValueAtTime(0.3, now);
      harmonic1.disconnect();
      harmonic1.connect(harm1Gain);
      harm1Gain.connect(gainNode);

      const harm2Gain = ctx.createGain();
      harm2Gain.gain.setValueAtTime(0.1, now);
      harmonic2.disconnect();
      harmonic2.connect(harm2Gain);
      harm2Gain.connect(gainNode);

      // Iniciar y detener
      fundamental.start(now);
      harmonic1.start(now);
      harmonic2.start(now);

      fundamental.stop(now + duration);
      harmonic1.stop(now + duration);
      harmonic2.stop(now + duration);

      logger.log(`[Meditation] Bell: ${type} (${baseFreq}Hz)`);

    } catch (error) {
      logger.warn('[Meditation] Error playing bell:', error);
    }
  }

  /**
   * Toggle para activar/desactivar campanas de meditación
   * @returns {boolean} Nuevo estado
   */
  toggleBell() {
    this.bellEnabled = !this.bellEnabled;
    try {
      localStorage.setItem('meditation-bell-enabled', this.bellEnabled.toString());
    } catch (e) {
      // Ignore storage errors
    }
    return this.bellEnabled;
  }

  /**
   * Verificar si las campanas están habilitadas
   * @returns {boolean}
   */
  isBellEnabled() {
    return this.bellEnabled;
  }

  /**
   * Crear una pausa cronometrada para ejercicios de meditación
   * @param {number} seconds - Duración de la pausa en segundos
   * @param {Function} onTick - Callback cada segundo con tiempo restante
   * @returns {Promise} Se resuelve cuando termina la pausa
   */
  createPause(seconds, onTick = null) {
    return new Promise((resolve) => {
      this.pauseResolve = resolve;
      this.currentPauseEndTime = Date.now() + (seconds * 1000);

      // Reproducir campana al iniciar pausa
      this.playBell('soft');

      // Actualizar UI cada segundo
      this.pauseTimerInterval = setInterval(() => {
        const remaining = Math.max(0, this.currentPauseEndTime - Date.now());
        const remainingSeconds = Math.ceil(remaining / 1000);

        if (onTick) {
          onTick(remainingSeconds);
        }

        if (remaining <= 0) {
          this.endPause();
        }
      }, 1000);
    });
  }

  /**
   * Terminar la pausa actual prematuramente
   */
  endPause() {
    if (this.pauseTimerInterval) {
      clearInterval(this.pauseTimerInterval);
      this.pauseTimerInterval = null;
    }

    // Reproducir campana suave al terminar
    this.playBell('soft');

    if (this.pauseResolve) {
      this.pauseResolve();
      this.pauseResolve = null;
    }

    this.currentPauseEndTime = null;
  }

  /**
   * Verificar si hay una pausa activa
   * @returns {boolean}
   */
  isPauseActive() {
    return this.currentPauseEndTime !== null && this.currentPauseEndTime > Date.now();
  }

  /**
   * Obtener tiempo restante de la pausa actual
   * @returns {number} Segundos restantes
   */
  getPauseRemaining() {
    if (!this.currentPauseEndTime) return 0;
    return Math.max(0, Math.ceil((this.currentPauseEndTime - Date.now()) / 1000));
  }

  /**
   * Destruir el módulo y limpiar recursos
   */
  destroy() {
    this.endPause();

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.audioReader = null;
  }
}

// Exportar globalmente
window.AudioReaderMeditation = AudioReaderMeditation;
