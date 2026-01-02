// ============================================================================
// AUDIOREADER PLAYBACK - Control de reproducción
// ============================================================================
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

    // Verificar problemas de TTS en la plataforma
    if (window.ttsPlatformHelper) {
      const ttsIssueDetected = await window.ttsPlatformHelper.checkAndShowModalIfNeeded();
      if (ttsIssueDetected) {
        console.warn('⚠️ TTS no disponible');
        return false;
      }
    }

    // Preparar contenido si se proporciona
    if (chapterContent && ar.content) {
      ar.content.prepare(chapterContent);
      ar.currentParagraphIndex = 0;
    }

    const paragraphs = ar.content?.getParagraphs() || [];
    if (paragraphs.length === 0) {
      console.error('❌ No hay contenido preparado para narrar');
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

    // Pausar ambient/binaural
    await this.syncAmbientAudio(false);

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

    ar.isPaused = false;

    // Adquirir wake lock
    await this.acquireWakeLock();

    // Notificar Background Audio
    if (window.backgroundAudio) {
      window.backgroundAudio.resume();
    }

    // Reanudar ambient/binaural
    await this.syncAmbientAudio(true);

    // Reanudar TTS o reiniciar párrafo
    if (ar.tts) {
      ar.tts.resume();
    }

    // Para la mayoría de providers, reiniciar desde el párrafo actual
    this.speakCurrentParagraph();

    if (ar.ui) {
      await ar.ui.updateUI();
    }

    if (typeof logger !== 'undefined') {
      logger.log('▶️ Audio reanudado');
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
          console.error('Error en TTS:', error);
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

    const currentChapter = ar.bookEngine?.currentChapter;
    if (!currentChapter) return;

    const nextChapter = ar.bookEngine?.getNextChapter?.();
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
      console.warn('Error adquiriendo wake lock:', error);
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
      console.warn('Error liberando wake lock:', error);
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
      console.warn('Error configurando Media Session:', error);
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
      if (!window.audioMixer) return;

      if (isPlaying) {
        const ambientSelect = document.getElementById('audioreader-ambient-select');
        const binauralSelect = document.getElementById('audioreader-binaural-select');

        if (ambientSelect?.value) {
          await window.audioMixer.playAmbient(ambientSelect.value);
        }
        if (binauralSelect?.value) {
          await window.audioMixer.playBinaural(binauralSelect.value);
        }
      } else {
        await window.audioMixer.stopAll();
      }
    } catch (error) {
      console.warn('Error sincronizando ambient/binaural:', error);
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
