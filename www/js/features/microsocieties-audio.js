/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * SISTEMA DE AUDIO PARA MICROSOCIEDADES
 * Música de fondo, SFX de eventos y UI
 */

class MicroSocietiesAudio {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    this.enabled = true;
    this.musicVolume = 0.3;
    this.sfxVolume = 0.5;

    this.currentMusic = null;
    this.musicTracks = {};
    this.sfxCache = {};

    this.initialized = false;
  }

  /**
   * Inicializar sistema de audio
   */
  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Crear nodos de ganancia
      this.masterGain = this.audioContext.createGain();
      this.musicGain = this.audioContext.createGain();
      this.sfxGain = this.audioContext.createGain();

      // Conectar cadena de audio
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.audioContext.destination);

      // Configurar volúmenes iniciales
      this.masterGain.gain.value = this.enabled ? 1 : 0;
      this.musicGain.gain.value = this.musicVolume;
      this.sfxGain.gain.value = this.sfxVolume;

      // Crear osciladores para música generativa
      this.createGenerativeMusic();

      this.initialized = true;
      // logger.debug('🔊 MicroSocieties Audio inicializado');

      return true;
    } catch (error) {
      console.error('❌ Error al inicializar audio:', error);
      return false;
    }
  }

  /**
   * Crear música generativa (síntesis procedural)
   */
  createGenerativeMusic() {
    // Track 1: Ambiente contemplativo
    this.musicTracks.contemplative = {
      name: 'Contemplative Ambience',
      oscillators: [],
      playing: false
    };

    // Track 2: Evolución energética
    this.musicTracks.energetic = {
      name: 'Evolutionary Energy',
      oscillators: [],
      playing: false
    };

    // Track 3: Crisis dramática
    this.musicTracks.dramatic = {
      name: 'Dramatic Crisis',
      oscillators: [],
      playing: false
    };

    // Track 4: Victoria triunfante
    this.musicTracks.triumphant = {
      name: 'Triumphant Victory',
      oscillators: [],
      playing: false
    };
  }

  /**
   * Reproducir track de música
   */
  playMusic(trackName = 'contemplative', loop = true, fadeInDuration = 2) {
    if (!this.initialized || !this.enabled) return;

    // Resume AudioContext si está suspended (por políticas del browser)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const track = this.musicTracks[trackName];
    if (!track) {
      // console.warn(`⚠️ Track "${trackName}" no encontrado`);
      return;
    }

    // Detener música actual con fade out
    if (this.currentMusic) {
      this.stopMusic(1.5);
    }

    // Crear osciladores según el track
    this.createOscillatorsForTrack(track, trackName);

    // Fade in
    const now = this.audioContext.currentTime;
    this.musicGain.gain.setValueAtTime(0, now);
    this.musicGain.gain.linearRampToValueAtTime(this.musicVolume, now + fadeInDuration);

    this.currentMusic = track;
    track.playing = true;

    // logger.debug(`🎵 Reproduciendo música: ${track.name}`);
  }

  /**
   * Crear osciladores para un track
   */
  createOscillatorsForTrack(track, trackName) {
    const now = this.audioContext.currentTime;

    // Configuraciones por track
    const configs = {
      contemplative: [
        { type: 'sine', freq: 110, detune: 0, gain: 0.15 },
        { type: 'sine', freq: 165, detune: 2, gain: 0.1 },
        { type: 'sine', freq: 220, detune: -2, gain: 0.08 },
        { type: 'triangle', freq: 55, detune: 0, gain: 0.05, lfo: 0.3 }
      ],
      energetic: [
        { type: 'sawtooth', freq: 130.81, detune: 0, gain: 0.12 },
        { type: 'square', freq: 196.00, detune: 4, gain: 0.08 },
        { type: 'sine', freq: 261.63, detune: -3, gain: 0.1 },
        { type: 'triangle', freq: 65.41, detune: 0, gain: 0.06, lfo: 0.5 }
      ],
      dramatic: [
        { type: 'sawtooth', freq: 98, detune: 0, gain: 0.15 },
        { type: 'square', freq: 146.83, detune: 6, gain: 0.1 },
        { type: 'sine', freq: 196, detune: -4, gain: 0.08 },
        { type: 'triangle', freq: 49, detune: 0, gain: 0.07, lfo: 0.7 }
      ],
      triumphant: [
        { type: 'sine', freq: 261.63, detune: 0, gain: 0.15 },
        { type: 'sine', freq: 329.63, detune: 2, gain: 0.12 },
        { type: 'sine', freq: 392.00, detune: -2, gain: 0.1 },
        { type: 'triangle', freq: 130.81, detune: 0, gain: 0.06, lfo: 0.4 }
      ]
    };

    const config = configs[trackName] || configs.contemplative;

    config.forEach(({ type, freq, detune, gain, lfo }) => {
      // Crear oscilador
      const osc = this.audioContext.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detune, now);

      // Crear ganancia para este oscilador
      const oscGain = this.audioContext.createGain();
      oscGain.gain.setValueAtTime(gain, now);

      // LFO opcional (modulación de amplitud)
      if (lfo) {
        const lfoOsc = this.audioContext.createOscillator();
        lfoOsc.frequency.setValueAtTime(lfo, now);

        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.setValueAtTime(gain * 0.3, now);

        lfoOsc.connect(lfoGain);
        lfoGain.connect(oscGain.gain);
        lfoOsc.start(now);

        track.oscillators.push(lfoOsc);
      }

      // Conectar
      osc.connect(oscGain);
      oscGain.connect(this.musicGain);
      osc.start(now);

      track.oscillators.push(osc);
    });
  }

  /**
   * Detener música
   */
  stopMusic(fadeOutDuration = 1) {
    if (!this.currentMusic || !this.currentMusic.playing) return;

    const now = this.audioContext.currentTime;

    // Fade out
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
    this.musicGain.gain.linearRampToValueAtTime(0, now + fadeOutDuration);

    // Detener y limpiar osciladores
    setTimeout(() => {
      this.currentMusic.oscillators.forEach(osc => {
        try {
          osc.stop();
        } catch (e) {
          // Oscilador ya detenido
        }
      });
      this.currentMusic.oscillators = [];
      this.currentMusic.playing = false;
      this.currentMusic = null;
    }, fadeOutDuration * 1000);

    // logger.debug('🔇 Música detenida');
  }

  /**
   * SFX: Level Up
   */
  playLevelUp() {
    if (!this.initialized || !this.enabled) return;

    const now = this.audioContext.currentTime;

    // Ascenso de notas
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    const duration = 0.15;

    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * duration);

      gain.gain.setValueAtTime(0, now + i * duration);
      gain.gain.linearRampToValueAtTime(0.3, now + i * duration + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * duration + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * duration);
      osc.stop(now + i * duration + duration);
    });
  }

  /**
   * SFX: Misión completada
   */
  playMissionComplete() {
    if (!this.initialized || !this.enabled) return;

    const now = this.audioContext.currentTime;

    // Arpeggio ascendente
    const notes = [392.00, 493.88, 587.33];
    const duration = 0.1;

    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * duration);

      gain.gain.setValueAtTime(0, now + i * duration);
      gain.gain.linearRampToValueAtTime(0.25, now + i * duration + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * duration + duration * 2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * duration);
      osc.stop(now + i * duration + duration * 2);
    });
  }

  /**
   * SFX: Hibridación
   */
  playHybridization() {
    if (!this.initialized || !this.enabled) return;

    const now = this.audioContext.currentTime;
    const duration = 0.8;

    // Sweep de frecuencia
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + duration);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * SFX: Evento de crisis
   */
  playCrisis() {
    if (!this.initialized || !this.enabled) return;

    const now = this.audioContext.currentTime;
    const duration = 1.2;

    // Disonancia dramática
    [98, 104, 110].forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.1 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.1);
      osc.stop(now + duration);
    });
  }

  /**
   * SFX: Evento exitoso
   */
  playSuccess() {
    if (!this.initialized || !this.enabled) return;

    const now = this.audioContext.currentTime;

    // Acorde mayor brillante
    [261.63, 329.63, 392.00].forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.6);
    });
  }

  /**
   * SFX: Evento fallido
   */
  playFailure() {
    if (!this.initialized || !this.enabled) return;

    const now = this.audioContext.currentTime;

    // Descenso cromático
    [196, 185, 174, 164].forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);

      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.2);
    });
  }

  /**
   * SFX: Click de UI
   */
  playClick() {
    if (!this.initialized || !this.enabled) return;

    const now = this.audioContext.currentTime;
    const duration = 0.05;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * SFX: Hover de UI
   */
  playHover() {
    if (!this.initialized || !this.enabled) return;

    const now = this.audioContext.currentTime;
    const duration = 0.03;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * SFX: Intervención Divina (FASE 3)
   */
  playIntervention() {
    if (!this.initialized || !this.enabled) return;

    const now = this.audioContext.currentTime;

    // Acorde celestial (C-E-G-C-E)
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
    const duration = 1.5;

    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);

      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.25, now + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.1);
      osc.stop(now + duration);
    });

    // Eco/reverb simulado
    setTimeout(() => {
      notes.forEach((freq, i) => {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * 2, now + 0.3 + i * 0.08);

        gain.gain.setValueAtTime(0, now + 0.3 + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.3 + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + 0.3 + i * 0.08);
        osc.stop(now + 1.0);
      });
    }, 0);
  }

  /**
   * SFX: Activación de Sandbox (FASE 3)
   */
  playSandboxActivate() {
    if (!this.initialized || !this.enabled) return;

    const now = this.audioContext.currentTime;

    // Arpeggio ascendente (G3-B3-D4-F#4-A4)
    const notes = [196.00, 246.94, 293.66, 369.99, 440.00];
    const duration = 0.5;

    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + duration);
    });
  }

  /**
   * SFX: Entrada en Leaderboard (FASE 3)
   */
  playLeaderboardEntry() {
    if (!this.initialized || !this.enabled) return;

    const now = this.audioContext.currentTime;

    // Fanfarria corta (G4-C5)
    const notes = [392.00, 523.25];
    const duration = 0.3;

    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.2);

      gain.gain.setValueAtTime(0, now + i * 0.2);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.2 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + duration);
    });
  }

  /**
   * SFX: Compartir Sociedad (FASE 3)
   */
  playShare() {
    if (!this.initialized || !this.enabled) return;

    const now = this.audioContext.currentTime;
    const duration = 0.4;

    // Ping suave
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + duration);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Toggle audio on/off
   */
  toggle() {
    this.enabled = !this.enabled;

    if (this.masterGain) {
      const now = this.audioContext.currentTime;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.enabled ? 1 : 0, now + 0.1);
    }

    // logger.debug(`🔊 Audio ${this.enabled ? 'activado' : 'desactivado'}`);
    return this.enabled;
  }

  /**
   * Configurar volumen de música
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));

    if (this.musicGain) {
      const now = this.audioContext.currentTime;
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(this.musicVolume, now + 0.1);
    }
  }

  /**
   * Configurar volumen de SFX
   */
  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));

    if (this.sfxGain) {
      const now = this.audioContext.currentTime;
      this.sfxGain.gain.setValueAtTime(this.sfxGain.gain.value, now);
      this.sfxGain.gain.linearRampToValueAtTime(this.sfxVolume, now + 0.1);
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopMusic(0.5);

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.initialized = false;
    // logger.debug('🔇 Audio destruido');
  }

  /**
   * Obtener estado
   */
  getState() {
    return {
      enabled: this.enabled,
      initialized: this.initialized,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      currentTrack: this.currentMusic ? this.currentMusic.name : null
    };
  }
}

// Exportar
window.MicroSocietiesAudio = MicroSocietiesAudio;
// logger.debug('🔊 MicroSocieties Audio System cargado');
