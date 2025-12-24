// ============================================================================
// ENHANCED AUDIOREADER - Extensión del AudioReader con procesamiento avanzado
// ============================================================================
// Integra AudioMixer y AudioProcessor para experiencia de audio premium

class EnhancedAudioReader {
  constructor(bookEngine) {
    // AudioReader base (mantener compatibilidad)
    this.baseReader = new AudioReader(bookEngine);

    // Componentes de audio avanzado
    this.audioMixer = null;
    this.audioProcessor = null;

    // Estado
    this.currentMode = 'NORMAL';
    this.currentProfile = 'VOICE_CLARITY';
    this.isEnhanced = true; // Flag para activar/desactivar mejoras

    // Preferencias guardadas
    this.loadPreferences();
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  async initialize() {
    // Inicializar AudioMixer
    this.audioMixer = new AudioMixer();
    await this.audioMixer.initialize();

    // Exponer audioMixer globalmente para acceso desde audioreader.js
    window.audioMixer = this.audioMixer;

    // Inicializar AudioProcessor
    this.audioProcessor = new AudioProcessor(this.audioMixer.audioContext);
    this.audioProcessor.initialize();

    // Conectar procesador al canal de voz del mixer
    const voiceGain = this.audioMixer.channels.voice.gainNode;
    this.audioProcessor.connect(voiceGain);

    // Aplicar perfil por defecto
    this.audioProcessor.applyProfile(this.currentProfile);

    // console.log('✅ Enhanced AudioReader inicializado');
  }

  // ==========================================================================
  // MODOS DE ESCUCHA
  // ==========================================================================

  async setMode(modeName) {
    if (!this.audioMixer) await this.initialize();

    const mode = await this.audioMixer.applyMode(modeName);
    if (mode) {
      this.currentMode = modeName;

      // Aplicar velocidad TTS si el modo lo especifica
      if (mode.ttsRate && this.baseReader) {
        this.baseReader.setRate(mode.ttsRate);
      }

      // Guardar preferencia
      localStorage.setItem('audio-mode-preference', modeName);

      // Toast notification
      if (window.toast) {
        window.toast.success(`🎵 Modo: ${mode.name}`);
      }

      return mode;
    }
  }

  getModes() {
    if (!this.audioMixer) return {};
    return this.audioMixer.getAudioModes();
  }

  getCurrentMode() {
    return this.currentMode;
  }

  // ==========================================================================
  // PERFILES DE AUDIO
  // ==========================================================================

  setProfile(profileName) {
    if (!this.audioProcessor) return;

    this.audioProcessor.applyProfile(profileName);
    this.currentProfile = profileName;

    // Guardar preferencia
    localStorage.setItem('audio-profile-preference', profileName);

    const profiles = this.audioProcessor.getProfiles();
    const profile = profiles[profileName];

    if (profile && window.toast) {
      window.toast.success(`🎚️ Perfil: ${profile.name}`);
    }
  }

  getProfiles() {
    if (!this.audioProcessor) return {};
    return this.audioProcessor.getProfiles();
  }

  getCurrentProfile() {
    return this.currentProfile;
  }

  // ==========================================================================
  // CONTROL DE AMBIENTE Y BINAURAL
  // ==========================================================================

  async playAmbient(soundscapeName) {
    if (!this.audioMixer) await this.initialize();
    await this.audioMixer.playAmbient(soundscapeName);
  }

  stopAmbient() {
    if (this.audioMixer) {
      this.audioMixer.stopAmbient();
    }
  }

  async playBinaural(presetName) {
    if (!this.audioMixer) await this.initialize();
    await this.audioMixer.playBinaural(presetName);
  }

  stopBinaural() {
    if (this.audioMixer) {
      this.audioMixer.stopBinaural();
    }
  }

  // ==========================================================================
  // CONTROL DE VOLUMEN
  // ==========================================================================

  setVoiceVolume(volume) {
    if (this.audioMixer) {
      this.audioMixer.setChannelVolume('voice', volume);
    }
  }

  setAmbientVolume(volume) {
    if (this.audioMixer) {
      this.audioMixer.setChannelVolume('ambient', volume);
    }
  }

  setBinauralVolume(volume) {
    if (this.audioMixer) {
      this.audioMixer.setChannelVolume('binaural', volume);
    }
  }

  setMasterVolume(volume) {
    if (this.audioMixer) {
      this.audioMixer.setMasterVolume(volume);
    }
    if (this.baseReader) {
      // También ajustar volumen del base reader para compatibilidad
      this.baseReader.setVolume?.(volume);
    }
  }

  // ==========================================================================
  // ECUALIZADOR
  // ==========================================================================

  setBass(gainDB) {
    if (this.audioProcessor) {
      this.audioProcessor.setBass(gainDB);
    }
  }

  setMid(gainDB) {
    if (this.audioProcessor) {
      this.audioProcessor.setMid(gainDB);
    }
  }

  setTreble(gainDB) {
    if (this.audioProcessor) {
      this.audioProcessor.setTreble(gainDB);
    }
  }

  setReverb(amount) {
    if (this.audioProcessor) {
      this.audioProcessor.setReverb(amount);
    }
  }

  // ==========================================================================
  // CONTROL DE REPRODUCCIÓN (Delegado al base reader)
  // ==========================================================================

  async play(chapterContent = null) {
    // Inicializar componentes si es necesario
    if (!this.audioMixer && this.isEnhanced) {
      await this.initialize();
    }

    // Reproducir con el reader base
    return await this.baseReader.play(chapterContent);
  }

  async pause() {
    return await this.baseReader.pause();
  }

  async resume() {
    return await this.baseReader.resume();
  }

  async stop() {
    const result = await this.baseReader.stop();

    // Detener ambiente y binaural gradualmente
    if (this.audioMixer) {
      await this.audioMixer.fadeOut(this.audioMixer.channels.ambient.gainNode, 2000);
      await this.audioMixer.fadeOut(this.audioMixer.channels.binaural.gainNode, 3000);
    }

    return result;
  }

  async toggle() {
    return await this.baseReader.toggle();
  }

  next() {
    return this.baseReader.next();
  }

  previous() {
    return this.baseReader.previous();
  }

  skipToIndex(index) {
    return this.baseReader.skipToIndex(index);
  }

  setRate(rate) {
    return this.baseReader.setRate(rate);
  }

  toggleAutoAdvanceChapter() {
    return this.baseReader.toggleAutoAdvanceChapter();
  }

  // ==========================================================================
  // SLEEP TIMER (Delegado)
  // ==========================================================================

  setSleepTimer(minutes) {
    return this.baseReader.setSleepTimer(minutes);
  }

  cancelSleepTimer() {
    return this.baseReader.cancelSleepTimer();
  }

  getSleepTimerRemaining() {
    return this.baseReader.getSleepTimerRemaining();
  }

  // ==========================================================================
  // BOOKMARKS (Delegado)
  // ==========================================================================

  addBookmark() {
    return this.baseReader.addBookmark();
  }

  getBookmarks() {
    return this.baseReader.getBookmarks();
  }

  jumpToBookmark(bookmarkId) {
    return this.baseReader.jumpToBookmark(bookmarkId);
  }

  deleteBookmark(bookmarkId) {
    return this.baseReader.deleteBookmark(bookmarkId);
  }

  // ==========================================================================
  // UI Y ESTADO
  // ==========================================================================

  async updateUI() {
    return await this.baseReader.updateUI();
  }

  getState() {
    return {
      // Estado del base reader
      ...this.baseReader.getState?.() || {
        isPlaying: this.baseReader.isPlaying,
        isPaused: this.baseReader.isPaused,
        currentParagraphIndex: this.baseReader.currentParagraphIndex,
        totalParagraphs: this.baseReader.paragraphs.length,
        rate: this.baseReader.rate
      },

      // Estado de mejoras
      isEnhanced: this.isEnhanced,
      currentMode: this.currentMode,
      currentProfile: this.currentProfile,
      hasAmbient: !!this.audioMixer?.channels.ambient.source,
      hasBinaural: !!this.audioMixer?.channels.binaural.leftOsc
    };
  }

  // ==========================================================================
  // PREFERENCIAS
  // ==========================================================================

  loadPreferences() {
    this.currentMode = localStorage.getItem('audio-mode-preference') || 'NORMAL';
    this.currentProfile = localStorage.getItem('audio-profile-preference') || 'VOICE_CLARITY';
    this.isEnhanced = localStorage.getItem('audio-enhanced') !== 'false';
  }

  savePreferences() {
    localStorage.setItem('audio-mode-preference', this.currentMode);
    localStorage.setItem('audio-profile-preference', this.currentProfile);
    localStorage.setItem('audio-enhanced', this.isEnhanced.toString());
  }

  toggleEnhanced() {
    this.isEnhanced = !this.isEnhanced;
    this.savePreferences();

    if (!this.isEnhanced && this.audioMixer) {
      // Detener mejoras
      this.audioMixer.stopAll();
    }

    return this.isEnhanced;
  }

  // ==========================================================================
  // PRESETS RÁPIDOS
  // ==========================================================================

  async quickSetup(presetName) {
    const presets = {
      'meditate': async () => {
        await this.setMode('MEDITATION');
        this.setProfile('MEDITATION');
      },

      'focus': async () => {
        await this.setMode('FOCUS');
        this.setProfile('VOICE_CLARITY');
      },

      'sleep': async () => {
        await this.setMode('SLEEP');
        this.setProfile('WARM');
        this.setSleepTimer(30); // 30 minutos
      },

      'energize': async () => {
        await this.setMode('ENERGIZE');
        this.setProfile('PODCAST');
      },

      'relax': async () => {
        await this.setMode('RELAX');
        this.setProfile('AUDIOBOOK');
      }
    };

    if (presets[presetName]) {
      await presets[presetName]();

      if (window.toast) {
        window.toast.success(`✨ Preset aplicado: ${presetName}`);
      }
    }
  }

  // ==========================================================================
  // ANÁLISIS Y VISUALIZACIÓN
  // ==========================================================================

  getAudioAnalyzer() {
    if (!this.audioProcessor) return null;
    return this.audioProcessor.createAnalyzer();
  }

  // ==========================================================================
  // LIMPIEZA
  // ==========================================================================

  async destroy() {
    if (this.audioMixer) {
      await this.audioMixer.stopAll();
      this.audioMixer.destroy();
    }

    if (this.audioProcessor) {
      this.audioProcessor.destroy();
    }

    if (this.baseReader && this.baseReader.destroy) {
      await this.baseReader.destroy();
    }
  }
}

// Exportar
window.EnhancedAudioReader = EnhancedAudioReader;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedAudioReader;
}
