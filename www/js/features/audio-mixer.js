// ============================================================================
// AUDIO MIXER - Sistema de mezcla de audio profesional
// ============================================================================
// Combina TTS + música ambiental + ondas binaurales con procesamiento avanzado

// 🔧 FIX v2.9.284: Migrated all console.* to logger
class AudioMixer {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.isInitialized = false;

    // Canales de audio
    this.channels = {
      voice: {
        source: null,
        gainNode: null,
        processor: null,
        volume: 1.0
      },
      ambient: {
        source: null,           // Legacy: single source
        sources: new Map(),     // Multi-sound: Map<soundName, {source, gainNode}>
        gainNode: null,         // Master ambient gain
        volume: 0.3,
        loop: true
      },
      binaural: {
        leftOsc: null,
        rightOsc: null,
        gainNode: null,
        volume: 0.2
      }
    };

    // Estado
    this.currentMode = null;
    this.isPlaying = false;
    this.activeAmbients = new Set(); // Track active ambient sounds

    // Límites de rendimiento
    this.MAX_SIMULTANEOUS_AMBIENTS = 3; // Máximo 3 sonidos simultáneos para evitar sobrecarga
    this.isDucking = false; // Estado de audio ducking (bajar volumen para TTS)
    this.preDuckVolume = 0.3; // Volumen antes de ducking

    // Caché de buffers de audio decodificados
    this.audioBufferCache = new Map();
    this.isLoadingSound = false; // Evitar operaciones simultáneas
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Crear contexto de audio
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Crear nodo maestro de ganancia
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 1.0;

      // Inicializar canales
      this.initializeChannels();

      this.isInitialized = true;
      // logger.debug('✅ AudioMixer inicializado');
    } catch (error) {
      logger.error('❌ Error inicializando AudioMixer:', error);
    }
  }

  initializeChannels() {
    // Canal de voz (TTS)
    this.channels.voice.gainNode = this.audioContext.createGain();
    this.channels.voice.gainNode.connect(this.masterGain);
    this.channels.voice.gainNode.gain.value = this.channels.voice.volume;

    // Canal ambiental
    this.channels.ambient.gainNode = this.audioContext.createGain();
    this.channels.ambient.gainNode.connect(this.masterGain);
    this.channels.ambient.gainNode.gain.value = 0; // Empieza en 0 para fade in

    // Canal binaural
    this.channels.binaural.gainNode = this.audioContext.createGain();
    this.channels.binaural.gainNode.connect(this.masterGain);
    this.channels.binaural.gainNode.gain.value = 0; // Empieza en 0 para fade in
  }

  // ==========================================================================
  // CONTROL DE CANALES - AMBIENTE (Multi-sonido)
  // ==========================================================================

  // Legacy method - plays single sound (stops others)
  async playAmbient(soundscapeName) {
    await this.stopAmbient();
    await this.addAmbient(soundscapeName);
  }

  // Add an ambient sound (supports multiple simultaneous sounds)
  async addAmbient(soundscapeName) {
    // Evitar operaciones simultáneas que causan bloqueos
    if (this.isLoadingSound) {
      logger.warn('🎵 Operación en curso, ignorando:', soundscapeName);
      return;
    }

    // Si ya está activo, no hacer nada
    if (this.channels.ambient.sources.has(soundscapeName)) {
      return;
    }

    // Limitar número de sonidos simultáneos
    if (this.activeAmbients.size >= this.MAX_SIMULTANEOUS_AMBIENTS) {
      const firstSound = this.activeAmbients.values().next().value;
      this.removeAmbientSync(firstSound);
    }

    this.isLoadingSound = true;

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const soundscapeData = this.getSoundscapeData(soundscapeName);
      if (!soundscapeData) {
        this.isLoadingSound = false;
        return;
      }

      // Usar caché de buffers para evitar descargas repetidas
      let audioBuffer = this.audioBufferCache.get(soundscapeName);
      if (!audioBuffer) {
        const response = await fetch(soundscapeData.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.audioBufferCache.set(soundscapeName, audioBuffer);
      }

      // Crear gain node individual
      const gainNode = this.audioContext.createGain();
      gainNode.connect(this.channels.ambient.gainNode);
      gainNode.gain.value = 0;

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;
      source.connect(gainNode);
      source.start(0);

      // Guardar referencia
      this.channels.ambient.sources.set(soundscapeName, { source, gainNode });
      this.activeAmbients.add(soundscapeName);

      // Fade in rápido
      const targetVolume = this.calculateIndividualVolume();
      gainNode.gain.setTargetAtTime(targetVolume, this.audioContext.currentTime, 0.3);
      this.rebalanceAmbientVolumes();

    } catch (error) {
      logger.error('❌ Error añadiendo ambiente:', error);
    } finally {
      this.isLoadingSound = false;
    }
  }

  // Versión síncrona para remover (sin await)
  removeAmbientSync(soundscapeName) {
    const soundData = this.channels.ambient.sources.get(soundscapeName);
    if (!soundData) return;

    try {
      soundData.gainNode.gain.value = 0;
      soundData.source.stop();
      soundData.source.disconnect();
      soundData.gainNode.disconnect();
    } catch (e) {}

    this.channels.ambient.sources.delete(soundscapeName);
    this.activeAmbients.delete(soundscapeName);
  }

  // Remove a specific ambient sound
  async removeAmbient(soundscapeName) {
    this.removeAmbientSync(soundscapeName);
    this.rebalanceAmbientVolumes();
  }

  // Toggle an ambient sound on/off
  async toggleAmbientSound(soundscapeName) {
    if (this.channels.ambient.sources.has(soundscapeName)) {
      await this.removeAmbient(soundscapeName);
      return false;
    } else {
      await this.addAmbient(soundscapeName);
      return true;
    }
  }

  // Check if an ambient sound is active
  isAmbientActive(soundscapeName) {
    return this.channels.ambient.sources.has(soundscapeName);
  }

  // Get list of active ambient sounds
  getActiveAmbients() {
    return Array.from(this.activeAmbients);
  }

  // Calculate individual volume based on number of active sounds
  calculateIndividualVolume() {
    const count = this.activeAmbients.size || 1;
    return 1.0 / Math.pow(count, 0.6);
  }

  // Rebalance volumes when sounds are added/removed
  rebalanceAmbientVolumes() {
    const targetVolume = this.calculateIndividualVolume();
    for (const [name, data] of this.channels.ambient.sources) {
      if (data.gainNode) {
        data.gainNode.gain.setTargetAtTime(targetVolume, this.audioContext.currentTime, 0.5);
      }
    }
  }

  // Stop all ambient sounds
  async stopAmbient() {
    try {
      // Detener todos los sonidos multi-ambient
      for (const [name, data] of this.channels.ambient.sources) {
        try {
          data.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
          data.source.stop();
          data.source.disconnect();
          data.gainNode.disconnect();
        } catch (e) {}
      }
      this.channels.ambient.sources.clear();
      this.activeAmbients.clear();

      // Legacy: single source
      if (this.channels.ambient.source) {
        this.channels.ambient.source.stop();
        this.channels.ambient.source.disconnect();
        this.channels.ambient.source = null;
      }

      if (this.channels.ambient.gainNode) {
        this.channels.ambient.gainNode.gain.value = 0;
      }
    } catch (error) {
      logger.error('❌ Error deteniendo ambiente:', error);
      this.channels.ambient.sources.clear();
      this.activeAmbients.clear();
    }
  }

  // ==========================================================================
  // AUDIO DUCKING - Bajar volumen ambiente para TTS
  // ==========================================================================

  /**
   * Baja el volumen de los sonidos ambient para que el TTS se escuche mejor
   * DESACTIVADO temporalmente para optimizar rendimiento
   */
  startDucking() {
    // Desactivado - causaba problemas de rendimiento
    return;
  }

  /**
   * Restaura el volumen original de los sonidos ambient
   * DESACTIVADO temporalmente para optimizar rendimiento
   */
  stopDucking() {
    // Desactivado - causaba problemas de rendimiento
    return;
  }

  // ==========================================================================
  // CONTROL DE CANALES - BINAURAL
  // ==========================================================================

  async playBinaural(presetName) {
    logger.log('🧠 AudioMixer.playBinaural llamado:', presetName);

    if (!this.isInitialized) {
      logger.log('🧠 AudioMixer no inicializado, inicializando...');
      await this.initialize();
    }

    try {
      // Resumir AudioContext si está suspendido (necesario en móviles)
      if (this.audioContext.state === 'suspended') {
        logger.log('🧠 Resumiendo AudioContext suspendido...');
        await this.audioContext.resume();
      }

      // Detener binaural anterior si existe (esperar a que termine)
      await this.stopBinaural();

      const preset = this.getBinauralPreset(presetName);
      if (!preset) {
        logger.warn('🧠 Preset binaural no encontrado:', presetName);
        return;
      }
      logger.log('🧠 Usando preset:', preset);

      // Crear osciladores
      const leftOsc = this.audioContext.createOscillator();
      const rightOsc = this.audioContext.createOscillator();

      leftOsc.frequency.value = preset.baseFreq;
      rightOsc.frequency.value = preset.baseFreq + preset.beatFreq;

      // Crear panner para separar canales
      const leftPanner = this.audioContext.createStereoPanner();
      const rightPanner = this.audioContext.createStereoPanner();
      leftPanner.pan.value = -1; // Izquierda
      rightPanner.pan.value = 1;  // Derecha

      // Conectar
      leftOsc.connect(leftPanner);
      rightOsc.connect(rightPanner);
      leftPanner.connect(this.channels.binaural.gainNode);
      rightPanner.connect(this.channels.binaural.gainNode);

      // Iniciar
      leftOsc.start(0);
      rightOsc.start(0);

      this.channels.binaural.leftOsc = leftOsc;
      this.channels.binaural.rightOsc = rightOsc;

      // Fade in
      this.fadeIn(this.channels.binaural.gainNode, this.channels.binaural.volume, 3000);

      // logger.debug('🎧 Binaural iniciado:', presetName);
    } catch (error) {
      logger.error('❌ Error iniciando binaural:', error);
    }
  }

  async stopBinaural() {
    if (this.channels.binaural.leftOsc || this.channels.binaural.rightOsc) {
      await this.fadeOut(this.channels.binaural.gainNode, 2000);
      if (this.channels.binaural.leftOsc) {
        this.channels.binaural.leftOsc.stop();
        this.channels.binaural.leftOsc = null;
      }
      if (this.channels.binaural.rightOsc) {
        this.channels.binaural.rightOsc.stop();
        this.channels.binaural.rightOsc = null;
      }
    }
  }

  // ==========================================================================
  // CONTROL DE VOLUMEN
  // ==========================================================================

  setChannelVolume(channel, volume) {
    if (!this.channels[channel]) return;

    this.channels[channel].volume = volume;
    if (this.channels[channel].gainNode) {
      this.channels[channel].gainNode.gain.setValueAtTime(
        volume,
        this.audioContext.currentTime
      );
    }
  }

  setAmbientVolume(volume) {
    this.setChannelVolume('ambient', volume);
  }

  setBinauralVolume(volume) {
    this.setChannelVolume('binaural', volume);
  }

  setMasterVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
    }
  }

  // ==========================================================================
  // EFECTOS DE TRANSICIÓN
  // ==========================================================================

  fadeIn(gainNode, targetVolume, duration) {
    if (!gainNode) return Promise.resolve();

    const currentTime = this.audioContext.currentTime;
    gainNode.gain.cancelScheduledValues(currentTime);
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(targetVolume, currentTime + duration / 1000);

    return new Promise(resolve => setTimeout(resolve, duration));
  }

  fadeOut(gainNode, duration) {
    if (!gainNode) return Promise.resolve();

    const currentTime = this.audioContext.currentTime;
    const currentVolume = gainNode.gain.value;
    gainNode.gain.cancelScheduledValues(currentTime);
    gainNode.gain.setValueAtTime(currentVolume, currentTime);
    gainNode.gain.linearRampToValueAtTime(0, currentTime + duration / 1000);

    return new Promise(resolve => setTimeout(resolve, duration));
  }

  async crossfade(oldGainNode, newGainNode, newVolume, duration) {
    await Promise.all([
      this.fadeOut(oldGainNode, duration),
      this.fadeIn(newGainNode, newVolume, duration)
    ]);
  }

  // ==========================================================================
  // MODOS DE AUDIO
  // ==========================================================================

  async applyMode(modeName) {
    const modes = this.getAudioModes();
    const mode = modes[modeName];

    if (!mode) {
      // logger.warn('Modo de audio no encontrado:', modeName);
      return;
    }

    this.currentMode = modeName;

    // Aplicar configuración del modo
    if (mode.ambient) {
      await this.playAmbient(mode.ambient);
    } else {
      await this.stopAmbient();
    }

    if (mode.binaural) {
      await this.playBinaural(mode.binaural);
    } else {
      await this.stopBinaural();
    }

    // Ajustar volúmenes
    if (mode.volumes) {
      Object.keys(mode.volumes).forEach(channel => {
        this.setChannelVolume(channel, mode.volumes[channel]);
      });
    }

    // logger.debug('🎚️ Modo aplicado:', mode.name);
    return mode;
  }

  getAudioModes() {
    return {
      NORMAL: {
        name: 'Lectura Normal',
        description: 'Solo narración, sin efectos',
        icon: '📖',
        ambient: null,
        binaural: null,
        volumes: {
          voice: 1.0,
          ambient: 0,
          binaural: 0
        }
      },

      MEDITATION: {
        name: 'Meditación',
        description: 'Ondas Theta + ambiente relajante',
        icon: '🧘',
        ambient: 'rain',
        binaural: 'THETA',
        volumes: {
          voice: 0.9,
          ambient: 0.25,
          binaural: 0.15
        },
        ttsRate: 0.75
      },

      FOCUS: {
        name: 'Concentración',
        description: 'Ondas Beta + ambiente de estudio',
        icon: '🎯',
        ambient: 'cafe',
        binaural: 'BETA',
        volumes: {
          voice: 1.0,
          ambient: 0.2,
          binaural: 0.15
        },
        ttsRate: 0.9
      },

      SLEEP: {
        name: 'Dormir',
        description: 'Ondas Delta + ambiente nocturno',
        icon: '😴',
        ambient: 'ocean',
        binaural: 'DELTA',
        volumes: {
          voice: 0.8,
          ambient: 0.3,
          binaural: 0.2
        },
        ttsRate: 0.65
      },

      ENERGIZE: {
        name: 'Energizante',
        description: 'Ondas Gamma + ambiente natural',
        icon: '⚡',
        ambient: 'forest',
        binaural: 'GAMMA',
        volumes: {
          voice: 1.0,
          ambient: 0.25,
          binaural: 0.18
        },
        ttsRate: 1.0
      },

      RELAX: {
        name: 'Relajación',
        description: 'Ondas Alpha + ambiente suave',
        icon: '🌊',
        ambient: 'river',
        binaural: 'ALPHA',
        volumes: {
          voice: 0.95,
          ambient: 0.3,
          binaural: 0.2
        },
        ttsRate: 0.85
      }
    };
  }

  // ==========================================================================
  // DATOS DE SOUNDSCAPES
  // ==========================================================================

  getSoundscapeData(name) {
    // Base path para archivos locales
    const basePath = 'assets/audio/ambient/';

    // URLs de archivos locales (descargar de Pixabay, BigSoundBank, etc.)
    const soundscapes = {
      rain: {
        name: 'Lluvia Suave',
        url: `${basePath}rain.mp3`,
        icon: '🌧️',
        description: 'Lluvia constante y relajante'
      },
      ocean: {
        name: 'Olas del Mar',
        url: `${basePath}ocean.mp3`,
        icon: '🌊',
        description: 'Olas rompiendo en la playa'
      },
      forest: {
        name: 'Bosque',
        url: `${basePath}forest.mp3`,
        icon: '🌲',
        description: 'Pájaros y naturaleza'
      },
      river: {
        name: 'Río',
        url: `${basePath}river.mp3`,
        icon: '💧',
        description: 'Agua fluyendo suavemente'
      },
      cafe: {
        name: 'Cafetería',
        url: `${basePath}cafe.mp3`,
        icon: '☕',
        description: 'Ambiente de cafetería'
      },
      fire: {
        name: 'Fuego',
        url: `${basePath}fire.mp3`,
        icon: '🔥',
        description: 'Chimenea crepitante'
      },
      storm: {
        name: 'Tormenta',
        url: `${basePath}storm.mp3`,
        icon: '⛈️',
        description: 'Tormenta con truenos'
      },
      wind: {
        name: 'Viento',
        url: `${basePath}wind.mp3`,
        icon: '🌬️',
        description: 'Viento suave'
      },
      night: {
        name: 'Noche',
        url: `${basePath}night.mp3`,
        icon: '🌙',
        description: 'Sonidos nocturnos'
      },
      birds: {
        name: 'Pájaros',
        url: `${basePath}birds.mp3`,
        icon: '🐦',
        description: 'Canto de pájaros'
      },
      meditation: {
        name: 'Meditación',
        url: `${basePath}meditation.mp3`,
        icon: '🕉️',
        description: 'Cuencos tibetanos'
      },
      piano: {
        name: 'Piano Ambiental',
        url: `${basePath}piano.mp3`,
        icon: '🎹',
        description: 'Piano suave de fondo'
      },
      whales: {
        name: 'Ballenas',
        url: `${basePath}whales.ogg`,
        icon: '🐋',
        description: 'Cantos de ballenas y delfines'
      }
    };

    return soundscapes[name] || null;
  }

  getAllSoundscapes() {
    return {
      rain: this.getSoundscapeData('rain'),
      ocean: this.getSoundscapeData('ocean'),
      forest: this.getSoundscapeData('forest'),
      river: this.getSoundscapeData('river'),
      cafe: this.getSoundscapeData('cafe'),
      fire: this.getSoundscapeData('fire'),
      storm: this.getSoundscapeData('storm'),
      wind: this.getSoundscapeData('wind'),
      night: this.getSoundscapeData('night'),
      birds: this.getSoundscapeData('birds'),
      meditation: this.getSoundscapeData('meditation'),
      piano: this.getSoundscapeData('piano'),
      whales: this.getSoundscapeData('whales')
    };
  }

  getBinauralPreset(name) {
    const presets = {
      DELTA: { baseFreq: 200, beatFreq: 2 },
      THETA: { baseFreq: 200, beatFreq: 6 },
      ALPHA: { baseFreq: 200, beatFreq: 10 },
      BETA: { baseFreq: 200, beatFreq: 20 },
      GAMMA: { baseFreq: 200, beatFreq: 40 }
    };

    // Mapeo de nombres amigables a presets
    const nameMapping = {
      'focus': 'BETA',      // 14-20Hz - concentración
      'relax': 'ALPHA',     // 10Hz - relajación
      'deep': 'THETA',      // 6-7Hz - meditación profunda
      'sleep': 'DELTA',     // 2-4Hz - sueño
      'energize': 'GAMMA'   // 40Hz - energía
    };

    // Usar mapping si existe, sino usar directamente
    const presetKey = nameMapping[name?.toLowerCase?.()] || name?.toUpperCase?.() || name;
    return presets[presetKey];
  }

  // ==========================================================================
  // LIMPIEZA
  // ==========================================================================

  async stopAll() {
    await Promise.all([
      this.fadeOut(this.channels.voice.gainNode, 500),
      this.stopAmbient(),
      this.stopBinaural()
    ]);

    this.isPlaying = false;
  }

  destroy() {
    this.stopAll();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
  }
}

// Exportar
window.AudioMixer = AudioMixer;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioMixer;
}
