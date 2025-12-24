// ============================================================================
// AUDIO ENHANCEMENTS - Mejoras para AudioReader
// ============================================================================
// Extensión que agrega funcionalidades avanzadas al AudioReader

class AudioEnhancements {
  constructor(audioReader) {
    this.audioReader = audioReader;
    // Si es EnhancedAudioReader, trabajar con el baseReader interno
    this.targetReader = audioReader.baseReader || audioReader;
    this.wordSync = null;
    this.statistics = this.loadStatistics();
    this.audioEffects = null;
    this.voiceCommands = null;
    this.isWordSyncEnabled = localStorage.getItem('audio-word-sync-enabled') !== 'false';
    this.isEffectsEnabled = localStorage.getItem('audio-effects-enabled') !== 'false';
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  initialize() {
    // Inicializar Word Sync si está disponible
    if (window.WordByWordSync && this.isWordSyncEnabled) {
      this.wordSync = new WordByWordSync();
      // console.log('✅ Word Sync inicializado');
    }

    // Inicializar efectos de audio
    if (this.isEffectsEnabled) {
      this.audioEffects = new AudioEffects();
      // console.log('✅ Audio Effects inicializado');
    }

    // Inicializar comandos de voz si está disponible
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      this.voiceCommands = new VoiceCommands(this.audioReader);
      // console.log('✅ Voice Commands inicializado');
    }

    // Hook en métodos del audioReader
    this.hookAudioReaderMethods();

    // console.log('✅ Audio Enhancements inicializado');
  }

  // ==========================================================================
  // INTEGRACIÓN CON AUDIOREADER
  // ==========================================================================

  hookAudioReaderMethods() {
    const originalSpeakParagraph = this.targetReader.speakParagraph.bind(this.targetReader);
    const originalStop = this.targetReader.stop.bind(this.targetReader);
    const originalNext = this.targetReader.next.bind(this.targetReader);

    // Hook: speakParagraph (para word sync)
    this.targetReader.speakParagraph = (index) => {
      // Ejecutar original
      originalSpeakParagraph(index);

      // Aplicar word sync si está habilitado
      if (this.wordSync && this.isWordSyncEnabled && this.targetReader.paragraphs[index]) {
        const paragraph = this.targetReader.paragraphs[index];
        const element = document.querySelector(`[data-paragraph-index="${index}"]`);

        if (element) {
          this.wordSync.prepareParagraph(element, paragraph.text);
          this.wordSync.start(this.targetReader.rate);
        }
      }

      // Registrar estadísticas
      this.trackParagraphStart(index);
    };

    // Hook: stop
    this.targetReader.stop = () => {
      // Detener word sync
      if (this.wordSync) {
        this.wordSync.stop();
      }

      // Ejecutar original
      originalStop();

      // Guardar estadísticas
      this.saveStatistics();
    };

    // Hook: next (para efectos de sonido)
    this.targetReader.next = () => {
      // Efecto de sonido
      if (this.audioEffects) {
        this.audioEffects.play('transition');
      }

      // Ejecutar original
      originalNext();
    };
  }

  // ==========================================================================
  // PAUSAS INTELIGENTES
  // ==========================================================================

  enableSmartPauses() {
    // Detectar puntos de puntuación y agregar pausas naturales
    if (!this.targetReader.utterance) return;

    const originalText = this.targetReader.paragraphs[this.targetReader.currentParagraphIndex]?.text;
    if (!originalText) return;

    // Agregar pausas en puntos naturales
    const enhancedText = this.addSmartPauses(originalText);

    return enhancedText;
  }

  addSmartPauses(text) {
    // Agregar pausas SSML-like (compatible con algunos TTS)
    let enhanced = text;

    // Pausas largas después de punto
    enhanced = enhanced.replace(/\.\s+/g, '. <break time="800ms"/> ');

    // Pausas medias después de coma
    enhanced = enhanced.replace(/,\s+/g, ', <break time="400ms"/> ');

    // Pausas después de dos puntos
    enhanced = enhanced.replace(/:\s+/g, ': <break time="600ms"/> ');

    // Pausas después de punto y coma
    enhanced = enhanced.replace(/;\s+/g, '; <break time="500ms"/> ');

    // Pausas antes/después de comillas
    enhanced = enhanced.replace(/"/g, ' <break time="300ms"/> " <break time="300ms"/> ');

    return enhanced;
  }

  // Para sistemas que no soportan SSML, usar una versión alternativa
  addNaturalPauses(text) {
    // Agregar espacios adicionales que el TTS interpretará como pausas
    let enhanced = text;

    // Después de punto
    enhanced = enhanced.replace(/\.\s+/g, '.    ');

    // Después de coma
    enhanced = enhanced.replace(/,\s+/g, ',  ');

    return enhanced;
  }

  // ==========================================================================
  // ESTADÍSTICAS DE ESCUCHA
  // ==========================================================================

  loadStatistics() {
    const saved = localStorage.getItem('audio-listening-stats');
    if (saved) {
      return JSON.parse(saved);
    }

    return {
      totalTimeListened: 0, // en segundos
      totalParagraphsListened: 0,
      totalChaptersCompleted: 0,
      sessionsCount: 0,
      averageSpeed: 1.0,
      favoriteSpeed: 1.0,
      lastListeningDate: null,
      streak: 0, // días consecutivos
      byBook: {}, // estadísticas por libro
      byChapter: {} // estadísticas por capítulo
    };
  }

  saveStatistics() {
    localStorage.setItem('audio-listening-stats', JSON.stringify(this.statistics));
  }

  trackParagraphStart(index) {
    this.currentParagraphStartTime = Date.now();
  }

  trackParagraphEnd(index) {
    if (this.currentParagraphStartTime) {
      const duration = (Date.now() - this.currentParagraphStartTime) / 1000; // segundos
      this.statistics.totalTimeListened += duration;
      this.statistics.totalParagraphsListened++;

      // Actualizar por libro/capítulo
      const bookId = this.targetReader.bookEngine?.currentBookId;
      const chapterId = this.targetReader.bookEngine?.currentChapterId;

      if (bookId) {
        if (!this.statistics.byBook[bookId]) {
          this.statistics.byBook[bookId] = { timeListened: 0, paragraphs: 0 };
        }
        this.statistics.byBook[bookId].timeListened += duration;
        this.statistics.byBook[bookId].paragraphs++;
      }

      if (chapterId) {
        if (!this.statistics.byChapter[chapterId]) {
          this.statistics.byChapter[chapterId] = { timeListened: 0, paragraphs: 0, completed: false };
        }
        this.statistics.byChapter[chapterId].timeListened += duration;
        this.statistics.byChapter[chapterId].paragraphs++;
      }

      this.currentParagraphStartTime = null;
    }
  }

  trackChapterCompleted(chapterId) {
    this.statistics.totalChaptersCompleted++;

    if (chapterId && this.statistics.byChapter[chapterId]) {
      this.statistics.byChapter[chapterId].completed = true;
    }

    this.saveStatistics();
  }

  updateStreak() {
    const today = new Date().toDateString();
    const lastDate = this.statistics.lastListeningDate;

    if (lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastDate === yesterday.toDateString()) {
        // Consecutivo
        this.statistics.streak++;
      } else if (!lastDate) {
        // Primera vez
        this.statistics.streak = 1;
      } else {
        // Se rompió la racha
        this.statistics.streak = 1;
      }

      this.statistics.lastListeningDate = today;
      this.saveStatistics();
    }
  }

  getStatisticsSummary() {
    const hours = Math.floor(this.statistics.totalTimeListened / 3600);
    const minutes = Math.floor((this.statistics.totalTimeListened % 3600) / 60);

    return {
      totalTime: `${hours}h ${minutes}m`,
      totalTimeSeconds: this.statistics.totalTimeListened,
      paragraphs: this.statistics.totalParagraphsListened,
      chapters: this.statistics.totalChaptersCompleted,
      streak: this.statistics.streak,
      averageSpeed: this.statistics.averageSpeed.toFixed(2)
    };
  }

  // ==========================================================================
  // CONTROL DE CONFIGURACIÓN
  // ==========================================================================

  toggleWordSync() {
    this.isWordSyncEnabled = !this.isWordSyncEnabled;
    localStorage.setItem('audio-word-sync-enabled', this.isWordSyncEnabled.toString());

    if (!this.isWordSyncEnabled && this.wordSync) {
      this.wordSync.stop();
    }

    return this.isWordSyncEnabled;
  }

  toggleEffects() {
    this.isEffectsEnabled = !this.isEffectsEnabled;
    localStorage.setItem('audio-effects-enabled', this.isEffectsEnabled.toString());

    return this.isEffectsEnabled;
  }

  setWordSyncMode(mode) {
    if (this.wordSync) {
      this.wordSync.setMode(mode);
    }
  }
}

// ============================================================================
// AUDIO EFFECTS - Efectos de sonido para transiciones
// ============================================================================

class AudioEffects {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.isEnabled = true;
    this.volume = 0.3;

    this.initialize();
  }

  initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.createSounds();
    } catch (error) {
      // console.warn('AudioContext no disponible para efectos');
    }
  }

  createSounds() {
    // Crear efectos de sonido sintéticos
    this.sounds = {
      transition: this.createTransitionSound(),
      chapterStart: this.createChapterStartSound(),
      chapterEnd: this.createChapterEndSound(),
      bookmark: this.createBookmarkSound(),
      pause: this.createPauseSound()
    };
  }

  createTransitionSound() {
    // Sonido suave de transición (sweep)
    return (ctx) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(400, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(this.volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    };
  }

  createChapterStartSound() {
    // Campana suave
    return (ctx) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    };
  }

  createChapterEndSound() {
    // Dos tonos descendentes
    return (ctx) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.frequency.setValueAtTime(600, ctx.currentTime);
      osc2.frequency.setValueAtTime(400, ctx.currentTime + 0.15);

      gainNode.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.4);
    };
  }

  createBookmarkSound() {
    // Click suave
    return (ctx) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
      oscillator.type = 'square';

      gainNode.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);
    };
  }

  createPauseSound() {
    // Tono corto
    return (ctx) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(500, ctx.currentTime);

      gainNode.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    };
  }

  play(soundName) {
    if (!this.isEnabled || !this.audioContext) return;

    const soundGenerator = this.sounds[soundName];
    if (soundGenerator) {
      try {
        soundGenerator(this.audioContext);
      } catch (error) {
        // console.warn('Error reproduciendo efecto:', error);
      }
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  toggle() {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  /**
   * 🔧 FIX #61: Limpiar recursos de audio para prevenir memory leaks
   */
  cleanup() {
    if (this.audioContext) {
      try {
        this.audioContext.close();
        this.audioContext = null;
        // console.log('[AudioEffects] AudioContext cerrado');
      } catch (error) {
        console.warn('[AudioEffects] Error al cerrar AudioContext:', error);
      }
    }
    this.sounds = {};
  }
}

// ============================================================================
// VOICE COMMANDS - Comandos por voz
// ============================================================================

class VoiceCommands {
  constructor(audioReader) {
    this.audioReader = audioReader;
    this.recognition = null;
    this.isListening = false;
    this.isEnabled = localStorage.getItem('voice-commands-enabled') === 'true';

    if (this.isEnabled) {
      this.initialize();
    }
  }

  initialize() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // console.warn('Speech Recognition no disponible');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es-ES';
    this.recognition.continuous = true;
    this.recognition.interimResults = false;

    this.recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.toLowerCase().trim();

      this.processCommand(command);
    };

    this.recognition.onerror = (event) => {
      // console.warn('Speech recognition error:', event.error);
    };

    // console.log('✅ Voice Commands inicializado');
  }

  start() {
    if (this.recognition && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
        // console.log('🎤 Escuchando comandos de voz...');
      } catch (error) {
        // console.warn('Error iniciando reconocimiento:', error);
      }
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      // console.log('🎤 Comandos de voz detenidos');
    }
  }

  processCommand(command) {
    // console.log('🎤 Comando recibido:', command);

    // Comandos de reproducción
    if (command.includes('reproducir') || command.includes('play')) {
      this.audioReader.play();
      this.speak('Reproduciendo');
    } else if (command.includes('pausar') || command.includes('pausa')) {
      this.audioReader.pause();
      this.speak('Pausado');
    } else if (command.includes('detener') || command.includes('parar')) {
      this.audioReader.stop();
      this.speak('Detenido');
    } else if (command.includes('siguiente')) {
      this.audioReader.next();
      this.speak('Siguiente párrafo');
    } else if (command.includes('anterior')) {
      this.audioReader.previous();
      this.speak('Párrafo anterior');
    }

    // Comandos de velocidad
    else if (command.includes('más rápido') || command.includes('acelerar')) {
      const newRate = Math.min(2.0, this.audioReader.rate + 0.25);
      this.audioReader.setRate(newRate);
      this.speak(`Velocidad ${newRate}`);
    } else if (command.includes('más lento') || command.includes('despacio')) {
      const newRate = Math.max(0.5, this.audioReader.rate - 0.25);
      this.audioReader.setRate(newRate);
      this.speak(`Velocidad ${newRate}`);
    } else if (command.includes('velocidad normal')) {
      this.audioReader.setRate(1.0);
      this.speak('Velocidad normal');
    }

    // Comandos de marcadores
    else if (command.includes('marcar') || command.includes('bookmark')) {
      this.audioReader.addBookmark();
      this.speak('Marcado');
    }
  }

  speak(text) {
    // Feedback de voz para confirmar comando
    if (window.speechSynthesis && this.isEnabled) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.5;
      utterance.volume = 0.5;
      window.speechSynthesis.speak(utterance);
    }
  }

  toggle() {
    this.isEnabled = !this.isEnabled;
    localStorage.setItem('voice-commands-enabled', this.isEnabled.toString());

    if (this.isEnabled) {
      if (!this.recognition) {
        this.initialize();
      }
      this.start();
    } else {
      this.stop();
    }

    return this.isEnabled;
  }
}

// Exportar
window.AudioEnhancements = AudioEnhancements;
window.AudioEffects = AudioEffects;
window.VoiceCommands = VoiceCommands;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioEnhancements, AudioEffects, VoiceCommands };
}
