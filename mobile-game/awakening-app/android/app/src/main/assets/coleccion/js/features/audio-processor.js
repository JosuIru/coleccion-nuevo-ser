// ============================================================================
// AUDIO PROCESSOR - Procesamiento y mejora de calidad de audio
// ============================================================================
// Ecualizador, compresor, reverb y efectos para mejorar la voz TTS

class AudioProcessor {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.input = null;
    this.output = null;

    // Nodos de procesamiento
    this.filters = {
      lowShelf: null,    // Bajos
      mid: null,         // Medios
      highShelf: null    // Agudos
    };

    this.compressor = null;  // Compresor dinámico
    this.convolver = null;   // Reverb
    this.initialized = false;
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  initialize() {
    if (this.initialized) return;

    // Crear nodos de entrada/salida
    this.input = this.audioContext.createGain();
    this.output = this.audioContext.createGain();

    // === ECUALIZADOR DE 3 BANDAS ===

    // Filtro de bajos (Low Shelf - 200Hz)
    this.filters.lowShelf = this.audioContext.createBiquadFilter();
    this.filters.lowShelf.type = 'lowshelf';
    this.filters.lowShelf.frequency.value = 200;
    this.filters.lowShelf.gain.value = 0; // dB

    // Filtro de medios (Peaking - 1000Hz)
    this.filters.mid = this.audioContext.createBiquadFilter();
    this.filters.mid.type = 'peaking';
    this.filters.mid.frequency.value = 1000;
    this.filters.mid.Q.value = 1;
    this.filters.mid.gain.value = 0; // dB

    // Filtro de agudos (High Shelf - 4000Hz)
    this.filters.highShelf = this.audioContext.createBiquadFilter();
    this.filters.highShelf.type = 'highshelf';
    this.filters.highShelf.frequency.value = 4000;
    this.filters.highShelf.gain.value = 0; // dB

    // === COMPRESOR DINÁMICO ===
    // Hace que la voz suene más clara y consistente
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -24;  // dB
    this.compressor.knee.value = 30;        // dB
    this.compressor.ratio.value = 12;       // ratio
    this.compressor.attack.value = 0.003;   // seconds
    this.compressor.release.value = 0.25;   // seconds

    // === REVERB SUTIL ===
    this.convolver = this.audioContext.createConvolver();

    // Crear impulse response simple (reverb de sala pequeña)
    this.createReverbImpulse(0.5, 0.3); // duración, decay

    // Nodo de mezcla wet/dry para reverb
    this.reverbMix = this.audioContext.createGain();
    this.reverbMix.gain.value = 0.05; // Muy sutil por defecto

    // === CONEXIÓN DE LA CADENA DE PROCESAMIENTO ===
    // Input -> EQ -> Compressor -> (Reverb parallel) -> Output

    this.input.connect(this.filters.lowShelf);
    this.filters.lowShelf.connect(this.filters.mid);
    this.filters.mid.connect(this.filters.highShelf);
    this.filters.highShelf.connect(this.compressor);

    // Señal seca (sin reverb)
    this.compressor.connect(this.output);

    // Señal con reverb (parallel processing)
    this.compressor.connect(this.convolver);
    this.convolver.connect(this.reverbMix);
    this.reverbMix.connect(this.output);

    this.initialized = true;
    // console.log('✅ AudioProcessor inicializado');
  }

  // ==========================================================================
  // CREAR IMPULSE RESPONSE PARA REVERB
  // ==========================================================================

  createReverbImpulse(duration, decay) {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Crear reverb con decay exponencial
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }

    this.convolver.buffer = impulse;
  }

  // ==========================================================================
  // PERFILES DE ECUALIZACIÓN
  // ==========================================================================

  applyProfile(profileName) {
    const profiles = this.getProfiles();
    const profile = profiles[profileName];

    if (!profile) {
      // console.warn('Perfil de audio no encontrado:', profileName);
      return;
    }

    // Aplicar ajustes de EQ
    this.filters.lowShelf.gain.value = profile.eq.bass;
    this.filters.mid.gain.value = profile.eq.mid;
    this.filters.highShelf.gain.value = profile.eq.treble;

    // Aplicar reverb
    this.reverbMix.gain.value = profile.reverb;

    // Aplicar compresor
    if (profile.compressor) {
      this.compressor.threshold.value = profile.compressor.threshold;
      this.compressor.ratio.value = profile.compressor.ratio;
    }

    // console.log('🎚️ Perfil de audio aplicado:', profile.name);
  }

  getProfiles() {
    return {
      FLAT: {
        name: 'Plano',
        description: 'Sin procesamiento',
        eq: { bass: 0, mid: 0, treble: 0 },
        reverb: 0,
        compressor: { threshold: -50, ratio: 1 }
      },

      VOICE_CLARITY: {
        name: 'Claridad de Voz',
        description: 'Voz clara y articulada',
        eq: {
          bass: -2,    // Reducir bajos (menos "boominess")
          mid: 3,      // Aumentar medios (claridad)
          treble: 2    // Aumentar agudos (definición)
        },
        reverb: 0.02,
        compressor: { threshold: -24, ratio: 12 }
      },

      WARM: {
        name: 'Cálido',
        description: 'Voz cálida y envolvente',
        eq: {
          bass: 3,     // Aumentar bajos (calidez)
          mid: 1,      // Medios suaves
          treble: -1   // Reducir agudos (menos brillo)
        },
        reverb: 0.08,
        compressor: { threshold: -30, ratio: 8 }
      },

      MEDITATION: {
        name: 'Meditación',
        description: 'Voz suave y espacial',
        eq: {
          bass: 2,     // Bajos cálidos
          mid: 0,      // Medios neutros
          treble: -2   // Agudos suaves
        },
        reverb: 0.12,  // Más reverb para sensación de espacio
        compressor: { threshold: -28, ratio: 6 }
      },

      PODCAST: {
        name: 'Podcast',
        description: 'Estilo radio/podcast profesional',
        eq: {
          bass: 1,     // Bajos presentes pero controlados
          mid: 4,      // Medios prominentes
          treble: 3    // Agudos brillantes
        },
        reverb: 0.03,
        compressor: { threshold: -20, ratio: 16 }
      },

      AUDIOBOOK: {
        name: 'Audiolibro',
        description: 'Optimizado para escucha prolongada',
        eq: {
          bass: 0,     // Bajos neutros
          mid: 2,      // Medios claros
          treble: 1    // Agudos suaves
        },
        reverb: 0.04,
        compressor: { threshold: -26, ratio: 10 }
      }
    };
  }

  // ==========================================================================
  // CONTROL MANUAL DE EQ
  // ==========================================================================

  setBass(gainDB) {
    this.filters.lowShelf.gain.value = gainDB;
  }

  setMid(gainDB) {
    this.filters.mid.gain.value = gainDB;
  }

  setTreble(gainDB) {
    this.filters.highShelf.gain.value = gainDB;
  }

  setReverb(amount) {
    // amount: 0.0 - 1.0
    this.reverbMix.gain.value = amount * 0.2; // Max 0.2 para no saturar
  }

  // ==========================================================================
  // CONEXIÓN
  // ==========================================================================

  connect(destination) {
    if (!this.initialized) this.initialize();
    this.output.connect(destination);
  }

  disconnect() {
    if (this.output) {
      this.output.disconnect();
    }
  }

  getInputNode() {
    if (!this.initialized) this.initialize();
    return this.input;
  }

  getOutputNode() {
    if (!this.initialized) this.initialize();
    return this.output;
  }

  // ==========================================================================
  // ANÁLISIS DE AUDIO
  // ==========================================================================

  createAnalyzer() {
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    // Conectar en paralelo para no afectar la señal
    this.output.connect(analyser);

    return analyser;
  }

  // ==========================================================================
  // LIMPIEZA
  // ==========================================================================

  destroy() {
    this.disconnect();

    Object.values(this.filters).forEach(filter => {
      if (filter) filter.disconnect();
    });

    if (this.compressor) this.compressor.disconnect();
    if (this.convolver) this.convolver.disconnect();
    if (this.reverbMix) this.reverbMix.disconnect();

    this.initialized = false;
  }
}

// Exportar
window.AudioProcessor = AudioProcessor;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioProcessor;
}
