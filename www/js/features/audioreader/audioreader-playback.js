// ============================================================================
// AUDIOREADER PLAYBACK - Control de reproducción
// ============================================================================
// v2.9.386: Fix auto-avance al siguiente capítulo (getNextChapter con parámetro)
// v2.9.278: Modularización del AudioReader
// Maneja play, pause, resume, stop, next, previous, wake lock, Media Session

class AudioReaderPlayback {
  constructor(audioReader) {
    this.audioReader = audioReader;
    this.wakeLock = null;
    this.autoAdvanceChapter = localStorage.getItem('audio-auto-advance') === 'true';
    this.currentPauseTimer = null;
  }

  // ==========================================================================
  // CONTROL DE REPRODUCCIÓN
  // ==========================================================================

  async play(chapterContent = null) {
    const ar = this.audioReader;

    // Inicializar AudioContext DENTRO del gesto de usuario (antes de cualquier await largo)
    // Brave y otros navegadores estrictos bloquean AudioContext si se pierde el contexto de gesto
    if (window.audioMixer && !window.audioMixer.isInitialized) {
      try {
        await window.audioMixer.initialize();
      } catch (e) {
        logger.warn('⚠️ No se pudo pre-inicializar AudioMixer:', e);
      }
    }

    // Verificar problemas de TTS en la plataforma (puede tardar varios segundos)
    let ttsUnavailable = false;
    if (window.ttsPlatformHelper) {
      const ttsIssueDetected = await window.ttsPlatformHelper.checkAndShowModalIfNeeded();
      if (ttsIssueDetected) {
        logger.warn('⚠️ TTS no disponible - audio ambiental seguirá funcionando');
        ttsUnavailable = true;
      }
    }

    // Preparar contenido si se proporciona
    if (chapterContent && ar.content) {
      ar.content.prepare(chapterContent);
      ar.currentParagraphIndex = 0;
    }

    const paragraphs = ar.content?.getParagraphs() || [];
    if (paragraphs.length === 0) {
      logger.error('❌ No hay contenido preparado para narrar');
      return false;
    }

    // Si TTS no disponible, iniciar solo audio ambiental si hay configurado
    if (ttsUnavailable) {
      await this.syncAmbientAudio(true);
      return false;
    }

    // Si estaba pausado, reanudar
    if (ar.isPaused && !ar.tts?.nativeTTS) {
      await this.resume();
      return true;
    }

    // Adquirir wake lock
    await this.acquireWakeLock();

    // Iniciar Background Audio Helper
    if (window.backgroundAudio) {
      const bookData = ar.bookEngine?.getCurrentBookData?.();
      await window.backgroundAudio.start({
        title: bookData?.title || 'Audiolibro',
        chapter: ar.bookEngine?.currentChapter?.title || ''
      });
    }

    // Configurar Media Session API
    this.setupMediaSession();

    // Iniciar narración
    ar.isPlaying = true;
    ar.isPaused = false;
    ar.startTime = Date.now();

    this.speakCurrentParagraph();

    // Reactivar sleep timer si había uno restaurado
    if (ar.sleepTimerModule) {
      ar.sleepTimerModule.reactivate?.();
    }

    // Sincronizar ambient/binaural
    await this.syncAmbientAudio(true);

    // Actualizar UI
    if (ar.ui) {
      await ar.ui.updateUI();
    }

    // Track para logros
    if (window.achievementSystem) {
      window.achievementSystem.trackAudioUsed();
    }

    return true;
  }

  async pause() {
    const ar = this.audioReader;
    if (!ar.isPlaying || ar.isPaused) return;

    // Liberar wake lock
    await this.releaseWakeLock();

    // Pausar TTS
    if (ar.tts) {
      ar.tts.pause();
    }

    ar.isPaused = true;

    // Notificar Background Audio
    if (window.backgroundAudio) {
      window.backgroundAudio.pause();
    }

    // Silenciar ambient/binaural durante pausa
    if (window.audioMixer) {
      // Guardar volumen actual para restaurar después
      ar._pausedAmbientVolume = window.audioMixer.channels?.ambient?.volume || 0.3;
      ar._pausedBinauralVolume = window.audioMixer.channels?.binaural?.volume || 0.2;
      // Silenciar
      window.audioMixer.setAmbientVolume(0);
      window.audioMixer.setBinauralVolume(0);
    }

    // Ocultar indicador de pausa
    if (ar.ui) {
      ar.ui.hidePauseIndicator();
      await ar.ui.updateUI();
    }

    if (typeof logger !== 'undefined') {
      logger.log('⏸️ Audio pausado');
    }
  }

  async resume() {
    const ar = this.audioReader;
    if (!ar.isPaused) return;

    ar.isPlaying = true;
    ar.isPaused = false;

    // Adquirir wake lock
    await this.acquireWakeLock();

    // Notificar Background Audio
    if (window.backgroundAudio) {
      window.backgroundAudio.resume();
    }

    // Restaurar volumen de ambient/binaural
    if (window.audioMixer) {
      const ambientVol = ar._pausedAmbientVolume || 0.3;
      const binauralVol = ar._pausedBinauralVolume || 0.2;
      window.audioMixer.setAmbientVolume(ambientVol);
      window.audioMixer.setBinauralVolume(binauralVol);
    }

    // Verificar si Web Speech API puede continuar desde donde se pausó
    const canResumeWebSpeech = ar.tts?.provider === 'browser' &&
                               window.speechSynthesis?.paused;

    if (canResumeWebSpeech) {
      // Web Speech API soporta resume real - continuar desde donde se pausó
      ar.tts.resume();
      if (typeof logger !== 'undefined') {
        logger.log('▶️ Audio reanudado (Web Speech resume)');
      }
    } else {
      // Otros providers no soportan resume - reiniciar párrafo actual
      if (ar.tts) {
        ar.tts.stop();
      }
      this.speakCurrentParagraph();
      if (typeof logger !== 'undefined') {
        logger.log('▶️ Audio reanudado (reinicio de párrafo)');
      }
    }

    if (ar.ui) {
      await ar.ui.updateUI();
    }
  }

  async stop(resetPosition = true) {
    const ar = this.audioReader;

    // Detener TTS
    if (ar.tts) {
      ar.tts.stop();
    }

    // Cancelar timer de pausa pendiente
    if (this.currentPauseTimer) {
      if (ar.utils) {
        ar.utils.clearTimeout(this.currentPauseTimer);
      } else {
        clearTimeout(this.currentPauseTimer);
      }
      this.currentPauseTimer = null;
    }

    // Liberar wake lock
    await this.releaseWakeLock();

    // Detener Background Audio
    if (window.backgroundAudio) {
      await window.backgroundAudio.stop();
    }

    // Detener ambient/binaural
    await this.syncAmbientAudio(false);

    ar.isPlaying = false;
    ar.isPaused = false;

    if (resetPosition) {
      ar.currentParagraphIndex = 0;
    }

    // Ocultar indicador de pausa y limpiar highlights
    if (ar.ui) {
      ar.ui.hidePauseIndicator();
    }
    if (ar.highlighter) {
      ar.highlighter.clearHighlights();
    }
    if (ar.ui) {
      await ar.ui.updateUI();
    }
  }

  async next() {
    const ar = this.audioReader;
    const paragraphs = ar.content?.getParagraphs() || [];

    if (ar.currentParagraphIndex < paragraphs.length - 1) {
      const wasPlaying = ar.isPlaying;

      // Cancelar timer de pausa pendiente
      if (this.currentPauseTimer) {
        if (ar.utils) {
          ar.utils.clearTimeout(this.currentPauseTimer);
        } else {
          clearTimeout(this.currentPauseTimer);
        }
        this.currentPauseTimer = null;
      }

      // Detener TTS actual
      if (ar.tts) {
        ar.tts.stop();
      }

      ar.currentParagraphIndex++;

      if (wasPlaying) {
        this.speakCurrentParagraph();
      } else if (ar.highlighter) {
        ar.highlighter.highlightParagraph(ar.currentParagraphIndex);
      }
    }
  }

  async previous() {
    const ar = this.audioReader;

    if (ar.currentParagraphIndex > 0) {
      const wasPlaying = ar.isPlaying;

      // Cancelar timer de pausa pendiente
      if (this.currentPauseTimer) {
        if (ar.utils) {
          ar.utils.clearTimeout(this.currentPauseTimer);
        } else {
          clearTimeout(this.currentPauseTimer);
        }
        this.currentPauseTimer = null;
      }

      // Detener TTS actual
      if (ar.tts) {
        ar.tts.stop();
      }

      ar.currentParagraphIndex--;

      if (wasPlaying) {
        this.speakCurrentParagraph();
      } else if (ar.highlighter) {
        ar.highlighter.highlightParagraph(ar.currentParagraphIndex);
      }
    }
  }

  // ==========================================================================
  // NARRACIÓN
  // ==========================================================================

  speakCurrentParagraph() {
    const ar = this.audioReader;
    const paragraphs = ar.content?.getParagraphs() || [];
    const index = ar.currentParagraphIndex;

    if (index >= paragraphs.length) {
      this.onChapterEnd();
      return;
    }

    const paragraph = paragraphs[index];

    // Highlight del párrafo actual
    if (ar.highlighter) {
      ar.highlighter.highlightParagraph(index);
    }

    // Guardar posición
    if (ar.positionModule) {
      ar.positionModule.save();
    }

    // Hablar
    if (ar.tts) {
      ar.tts.speak(paragraph, index, {
        onEnd: (pauseDuration) => {
          this.onParagraphEnd(paragraph, pauseDuration);
        },
        onError: (error) => {
          logger.error('Error en TTS:', error);
          this.stop();
          window.toast?.error('Error en reproductor de audio');
        },
        onPauseNeeded: (duration, step, total) => {
          if (ar.ui) {
            ar.ui.showPauseIndicator(duration, step, total);
          }
        },
        onWordBoundary: (charIndex, charLength) => {
          if (ar.highlighter?.isWordByWordEnabled()) {
            ar.highlighter.highlightWord(charIndex, charLength);
          }
        }
      });
    }
  }

  onParagraphEnd(paragraph, pauseDuration) {
    const ar = this.audioReader;
    const paragraphs = ar.content?.getParagraphs() || [];

    ar.currentParagraphIndex++;

    if (ar.currentParagraphIndex < paragraphs.length && ar.isPlaying && !ar.isPaused) {
      // Programar siguiente párrafo con pausa
      const delay = pauseDuration || 300;

      const setTimeoutFn = ar.utils ? ar.utils.setTimeout.bind(ar.utils) : setTimeout;

      this.currentPauseTimer = setTimeoutFn(() => {
        this.currentPauseTimer = null;
        if (ar.isPlaying && !ar.isPaused) {
          this.speakCurrentParagraph();
        }
      }, delay);
    } else {
      this.onChapterEnd();
    }
  }

  // ==========================================================================
  // FIN DE CAPÍTULO
  // ==========================================================================

  async onChapterEnd() {
    const ar = this.audioReader;

    ar.isPlaying = false;

    await this.releaseWakeLock();
    this.clearMediaSession();

    if (window.backgroundAudio) {
      await window.backgroundAudio.stop();
    }

    if (ar.ui) {
      await ar.ui.updateUI();
    }

    if (typeof logger !== 'undefined') {
      logger.log('📖 Capítulo terminado');
    }

    if (this.autoAdvanceChapter) {
      this.advanceToNextChapter();
    }
  }

  advanceToNextChapter() {
    const ar = this.audioReader;

    // Obtener el ID del capítulo actual correctamente
    const currentChapterId = ar.bookEngine?.currentChapter ||
                             window.bookReader?.currentChapter?.id;
    if (!currentChapterId) {
      if (typeof logger !== 'undefined') {
        logger.warn('⚠️ No se pudo obtener el capítulo actual para auto-avance');
      }
      return;
    }

    // Pasar el ID del capítulo actual a getNextChapter
    const nextChapter = ar.bookEngine?.getNextChapter?.(currentChapterId);
    if (nextChapter && window.bookReader) {
      if (typeof logger !== 'undefined') {
        logger.log('⏭️ Avanzando al siguiente capítulo:', nextChapter.title);
      }

      window.bookReader.loadChapter(nextChapter.id).then(() => {
        const newContent = document.querySelector('.chapter-content')?.innerHTML;
        if (newContent) {
          this.play(newContent);
        }
      });
    } else {
      window.toast?.info('Has llegado al final del libro');
    }
  }

  toggleAutoAdvance() {
    this.autoAdvanceChapter = !this.autoAdvanceChapter;
    try {
      localStorage.setItem('audio-auto-advance', this.autoAdvanceChapter.toString());
    } catch (e) {}

    if (this.autoAdvanceChapter) {
      window.toast?.success('Auto-avance activado');
    } else {
      window.toast?.info('Auto-avance desactivado');
    }

    return this.autoAdvanceChapter;
  }

  isAutoAdvanceEnabled() {
    return this.autoAdvanceChapter;
  }

  // ==========================================================================
  // WAKE LOCK
  // ==========================================================================

  async acquireWakeLock() {
    try {
      if (this.wakeLock && !this.wakeLock.released) {
        try {
          await this.wakeLock.release();
        } catch (e) {}
        this.wakeLock = null;
      }

      if ('wakeLock' in navigator) {
        try {
          this.wakeLock = await navigator.wakeLock.request('screen');
          this.wakeLock.addEventListener('release', () => {
            this.wakeLock = null;
          });
          if (typeof logger !== 'undefined') {
            logger.log('🔒 Wake lock adquirido');
          }
        } catch (err) {
          // Silently fail
        }
      }
    } catch (error) {
      logger.warn('Error adquiriendo wake lock:', error);
    }
  }

  async releaseWakeLock() {
    if (!this.wakeLock) return;

    try {
      if (!this.wakeLock.released) {
        await this.wakeLock.release();
        if (typeof logger !== 'undefined') {
          logger.log('🔓 Wake lock liberado');
        }
      }
    } catch (error) {
      logger.warn('Error liberando wake lock:', error);
    } finally {
      this.wakeLock = null;
    }
  }

  // ==========================================================================
  // MEDIA SESSION
  // ==========================================================================

  setupMediaSession() {
    if (!('mediaSession' in navigator)) return;

    try {
      const ar = this.audioReader;
      const bookData = ar.bookEngine?.getCurrentBookData?.();

      navigator.mediaSession.metadata = new MediaMetadata({
        title: bookData?.title || 'Audiolibro',
        artist: bookData?.authors?.join(', ') || 'Colección Nuevo Ser',
        album: 'Colección Nuevo Ser',
        artwork: [
          { src: bookData?.cover || '/img/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: bookData?.cover || '/img/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => this.resume());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.previous());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      navigator.mediaSession.setActionHandler('stop', () => this.stop());

      if (typeof logger !== 'undefined') {
        logger.log('🎵 Media Session configurada');
      }
    } catch (error) {
      logger.warn('Error configurando Media Session:', error);
    }
  }

  clearMediaSession() {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('stop', null);
    } catch (error) {
      // Silently fail
    }
  }

  // ==========================================================================
  // AUDIO AMBIENTAL
  // ==========================================================================

  async syncAmbientAudio(isPlaying) {
    try {
      if (!window.audioMixer) {
        logger.warn('🎵 AudioMixer no disponible para ambient/binaural');
        return;
      }

      if (isPlaying) {
        // Leer preferencias desde localStorage (funcionan incluso si UI está minimizada/cerrada)
        const savedAmbient = localStorage.getItem('audioreader-ambient') || '';
        const savedBinaural = localStorage.getItem('audioreader-binaural') || '';

        if (savedAmbient) {
          logger.log('🎵 Iniciando ambient desde localStorage:', savedAmbient);
          await window.audioMixer.playAmbient(savedAmbient);
        }
        if (savedBinaural) {
          logger.log('🧠 Iniciando binaural desde localStorage:', savedBinaural);
          await window.audioMixer.playBinaural(savedBinaural);
        }
      } else {
        logger.log('🔇 Deteniendo ambient/binaural');
        await window.audioMixer.stopAll();
      }
    } catch (error) {
      logger.warn('Error sincronizando ambient/binaural:', error);
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    if (this.currentPauseTimer) {
      clearTimeout(this.currentPauseTimer);
      this.currentPauseTimer = null;
    }

    this.releaseWakeLock();
    this.clearMediaSession();
    this.audioReader = null;
  }
}

// Exportar globalmente
window.AudioReaderPlayback = AudioReaderPlayback;
