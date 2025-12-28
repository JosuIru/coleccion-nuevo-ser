/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * SISTEMA DE AUDIO AMBIENTAL FRANKENSTEIN
 * Genera sonidos de laboratorio usando Web Audio API
 * No requiere archivos de audio externos
 */

class FrankensteinAudioSystem {
  constructor() {
    this.audioContext = null;
    this.sounds = {
      ambient: null,
      bubbling: null,
      thunder: null,
      electricity: null
    };
    this.oscillators = [];
    this.gainNodes = [];

    // Audio habilitado por defecto si no hay valor en localStorage
    const storedAudio = localStorage.getItem('frankenstein-audio');
    this.enabled = storedAudio === null ? true : storedAudio === 'true';

    this.masterVolume = parseFloat(localStorage.getItem('frankenstein-volume')) || 0.3;
    this.thunderTimer = null;
  }

  /**
   * Inicializar contexto de audio
   */
  async init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      // logger.debug('🔊 Sistema de audio Frankenstein inicializado');
    } catch (error) {
      console.error('❌ Error inicializando audio:', error);
    }
  }

  /**
   * Generar sonido ambiental de laboratorio (tono bajo continuo)
   */
  createAmbientSound() {
    if (!this.audioContext) return;

    const oscillator1 = this.audioContext.createOscillator();
    const oscillator2 = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    // Osciladores con frecuencias bajas
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(40, this.audioContext.currentTime);

    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(60, this.audioContext.currentTime);

    // Filtro pasa-bajos para sonido más atmosférico
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, this.audioContext.currentTime);
    filter.Q.setValueAtTime(1, this.audioContext.currentTime);

    // Volumen muy bajo para ambiente
    gainNode.gain.setValueAtTime(this.masterVolume * 0.15, this.audioContext.currentTime);

    // Conectar
    oscillator1.connect(filter);
    oscillator2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator1.start();
    oscillator2.start();

    this.oscillators.push(oscillator1, oscillator2);
    this.gainNodes.push(gainNode);

    return { oscillator1, oscillator2, gainNode };
  }

  /**
   * Generar sonido de burbujas (sonidos aleatorios pop)
   */
  createBubblingSound() {
    if (!this.audioContext) return;

    const bubbleInterval = setInterval(() => {
      if (!this.enabled) return;

      // Burbujas aleatorias cada 1-3 segundos
      if (Math.random() > 0.7) {
        this.playBubblePop();
      }
    }, 1000);

    return bubbleInterval;
  }

  /**
   * Burbuja individual
   */
  playBubblePop() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(
      200 + Math.random() * 400,
      this.audioContext.currentTime
    );

    // Envelope rápido (pop)
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.1, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  /**
   * Generar trueno (ruido blanco + baja frecuencia)
   */
  playThunder() {
    if (!this.audioContext) return;

    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Ruido blanco
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.audioContext.currentTime);

    const gainNode = this.audioContext.createGain();
    const now = this.audioContext.currentTime;

    // Envelope de trueno (sube rápido, baja lento)
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.5, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    noise.start(now);
    noise.stop(now + 2);

    // Flash visual de relámpago
    this.flashLightning();
  }

  /**
   * Flash visual de relámpago
   */
  flashLightning() {
    const lab = document.querySelector('.frankenstein-laboratory');
    if (!lab) return;

    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at 50% 0%, rgba(224, 247, 255, 0.5) 0%, transparent 60%);
      pointer-events: none;
      z-index: 100;
      animation: lightning-flash 0.3s ease-out;
    `;

    lab.appendChild(flash);
    setTimeout(() => flash.remove(), 300);
  }

  /**
   * Generar electricidad (chisporroteo)
   */
  playElectricity() {
    if (!this.audioContext) return;

    const duration = 0.2 + Math.random() * 0.3;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    oscillator.type = 'sawtooth';
    const baseFreq = 1000 + Math.random() * 2000;
    oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);

    // Modulación rápida de frecuencia (chisporroteo)
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    lfo.frequency.setValueAtTime(100, this.audioContext.currentTime);
    lfoGain.gain.setValueAtTime(500, this.audioContext.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    lfo.start();

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, this.audioContext.currentTime);

    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(this.masterVolume * 0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + duration);
    lfo.stop(now + duration);
  }

  /**
   * Programar truenos aleatorios
   */
  scheduleRandomThunder() {
    if (this.thunderTimer) {
      clearTimeout(this.thunderTimer);
    }

    if (!this.enabled) return;

    // Truenos cada 20-60 segundos
    const delay = 20000 + Math.random() * 40000;
    this.thunderTimer = setTimeout(() => {
      this.playThunder();
      this.scheduleRandomThunder();
    }, delay);
  }

  /**
   * Iniciar todos los sonidos
   */
  start() {
    if (!this.audioContext || !this.enabled) return;

    // Resume audio context si está suspendido (requerido por navegadores)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.sounds.ambient = this.createAmbientSound();
    this.sounds.bubbling = this.createBubblingSound();
    this.scheduleRandomThunder();

    // logger.debug('🔊 Audio ambiental iniciado');
  }

  /**
   * Detener todos los sonidos
   */
  stop() {
    // Detener osciladores
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Ya detenido
      }
    });
    this.oscillators = [];

    // Limpiar intervals
    if (this.sounds.bubbling) {
      clearInterval(this.sounds.bubbling);
    }

    if (this.thunderTimer) {
      clearTimeout(this.thunderTimer);
    }

    // logger.debug('🔇 Audio ambiental detenido');
  }

  /**
   * Toggle audio
   */
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('frankenstein-audio', this.enabled);

    if (this.enabled) {
      this.start();
    } else {
      this.stop();
    }

    return this.enabled;
  }

  /**
   * Cambiar volumen
   */
  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('frankenstein-volume', this.masterVolume);

    // Actualizar volumen de gain nodes activos
    this.gainNodes.forEach(gain => {
      gain.gain.setValueAtTime(this.masterVolume * 0.15, this.audioContext.currentTime);
    });
  }

  /**
   * Efectos de interacción
   */
  playInteractionSound(type) {
    switch (type) {
      case 'select':
        this.playElectricity();
        break;
      case 'create':
        this.playThunder();
        break;
      case 'bubble':
        this.playBubblePop();
        break;
    }
  }

  /**
   * 🔧 FIX #61: Limpiar recursos de audio para prevenir memory leaks
   * ⭐ FIX v2.9.181: Añadir cleanup de bubbling interval
   */
  cleanup() {
    // Detener todos los oscillators activos
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator ya detenido
      }
    });
    this.oscillators = [];
    this.gainNodes = [];

    // ⭐ FIX v2.9.181: Limpiar interval de burbujas
    if (this.sounds.bubbling) {
      clearInterval(this.sounds.bubbling);
      this.sounds.bubbling = null;
    }

    // Limpiar timer de thunder
    if (this.thunderTimer) {
      clearTimeout(this.thunderTimer);
      this.thunderTimer = null;
    }

    // Cerrar AudioContext
    if (this.audioContext) {
      try {
        this.audioContext.close();
        this.audioContext = null;
        // logger.debug('🔇 AudioContext cerrado');
      } catch (error) {
        console.warn('[FrankensteinAudio] Error al cerrar AudioContext:', error);
      }
    }

    // Limpiar referencias a sonidos
    this.sounds = {
      ambient: null,
      bubbling: null,
      thunder: null,
      electricity: null
    };
  }
}

// Exportar globalmente
window.FrankensteinAudioSystem = FrankensteinAudioSystem;
