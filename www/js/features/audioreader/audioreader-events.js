// ============================================================================
// AUDIOREADER EVENTS - Gestión de eventos y atajos de teclado
// ============================================================================
// v2.9.358: Drag usa toggleMinimize() y drag handle mejorado para mejor touch
// v2.9.357: Fix drag - ahora usa toggleMinimize() para expandir/colapsar correctamente
// v2.9.278: Modularización del AudioReader
// Maneja keyboard, visibility, beforeunload, gestos de drag

class AudioReaderEvents {
  constructor(audioReader) {
    this.audioReader = audioReader;

    // Handlers para cleanup
    this.keyboardHandler = null;
    this.keyboardListenerAttached = false;
    this.visibilityChangeHandler = null;
    this.beforeUnloadHandler = null;

    // Drag handlers
    this.dragHandlers = {
      onDragStart: null,
      onDragMove: null,
      onDragEnd: null,
      dragHandleElement: null
    };
    this.isDragging = false;
    this.dragStartY = 0;
    this.dragCurrentY = 0;
  }

  // ==========================================================================
  // ATAJOS DE TECLADO
  // ==========================================================================

  attachKeyboardListeners() {
    if (this.keyboardListenerAttached) return;

    const ar = this.audioReader;

    this.keyboardHandler = (evento) => {
      // Verificar que el audioReader esté visible
      const container = document.getElementById('audioreader-container');
      if (!container || container.classList.contains('hidden')) {
        return;
      }

      const controlsVisible = document.getElementById('audioreader-controls');
      if (!controlsVisible) return;

      // ESC siempre cierra
      if (evento.key === 'Escape') {
        evento.preventDefault();
        evento.stopPropagation();
        ar.hide?.();
        return;
      }

      // Ignorar si está en input/textarea
      if (evento.target.tagName === 'INPUT' || evento.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (evento.key) {
        case ' ':
        case 'k':
          evento.preventDefault();
          if (ar.isPlaying && !ar.isPaused) {
            ar.playback?.pause();
          } else if (ar.isPaused) {
            ar.playback?.resume();
          } else {
            const chapterContent = document.querySelector('.chapter-content');
            if (chapterContent) {
              ar.playback?.play(chapterContent.innerHTML);
            }
          }
          break;

        case 'ArrowRight':
        case 'l':
          evento.preventDefault();
          ar.playback?.next();
          break;

        case 'ArrowLeft':
        case 'j':
          evento.preventDefault();
          ar.playback?.previous();
          break;

        case 'ArrowUp':
          evento.preventDefault();
          if (ar.tts) {
            const newRate = Math.min(2.0, ar.tts.getRate() + 0.25);
            ar.tts.setRate(newRate);
            window.toast?.info(`Velocidad: ${newRate}x`);
          }
          break;

        case 'ArrowDown':
          evento.preventDefault();
          if (ar.tts) {
            const newRate = Math.max(0.5, ar.tts.getRate() - 0.25);
            ar.tts.setRate(newRate);
            window.toast?.info(`Velocidad: ${newRate}x`);
          }
          break;

        case 'm':
          evento.preventDefault();
          ar.bookmarksModule?.add?.();
          break;

        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          if (evento.ctrlKey || evento.metaKey) {
            evento.preventDefault();
            const numero = parseInt(evento.key);
            if (numero > 0) {
              const bookmarks = ar.bookmarksModule?.getForCurrentChapter?.() || [];
              if (numero <= bookmarks.length) {
                ar.bookmarksModule?.jumpTo?.(numero - 1);
              }
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', this.keyboardHandler);
    this.keyboardListenerAttached = true;

    if (typeof logger !== 'undefined') {
      logger.log('⌨️ Atajos de teclado activados');
    }
  }

  detachKeyboardListeners() {
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
      this.keyboardListenerAttached = false;

      if (typeof logger !== 'undefined') {
        logger.log('⌨️ Atajos de teclado desactivados');
      }
    }
  }

  // ==========================================================================
  // VISIBILITY CHANGE
  // ==========================================================================

  attachVisibilityHandler() {
    const ar = this.audioReader;

    this.visibilityChangeHandler = async () => {
      if (document.hidden) {
        // App en background
        if (ar.playback?.wakeLock && !ar.playback.wakeLock.released) {
          if (typeof logger !== 'undefined') {
            logger.log('📱 App en background - liberando wake lock');
          }
          await ar.playback.releaseWakeLock();
        }

        // Pausar sleep timer
        if (ar.sleepTimerModule && !ar.sleepTimerModule.isPaused) {
          ar.sleepTimerModule.pause?.();
        }
      } else {
        // App en foreground
        if (ar.isPlaying && !ar.isPaused) {
          if (typeof logger !== 'undefined') {
            logger.log('📱 App en foreground - re-adquiriendo wake lock');
          }
          await ar.playback?.acquireWakeLock();
        }

        // Resumir sleep timer
        if (ar.sleepTimerModule?.isPaused) {
          ar.sleepTimerModule.resume?.();
        }
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);

    if (typeof logger !== 'undefined') {
      logger.log('👁️ Handler de visibilidad adjuntado');
    }
  }

  detachVisibilityHandler() {
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;

      if (typeof logger !== 'undefined') {
        logger.log('👁️ Handler de visibilidad removido');
      }
    }
  }

  // ==========================================================================
  // BEFORE UNLOAD
  // ==========================================================================

  attachBeforeUnloadHandler() {
    const ar = this.audioReader;

    this.beforeUnloadHandler = async () => {
      // Liberar wake lock
      if (ar.playback?.wakeLock && !ar.playback.wakeLock.released) {
        try {
          await ar.playback.wakeLock.release();
        } catch (e) {}
      }

      // Guardar posición
      ar.positionModule?.save?.();
    };

    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  detachBeforeUnloadHandler() {
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
  }

  // ==========================================================================
  // GESTOS DE DRAG (para bottom sheet)
  // ==========================================================================

  attachDragListeners() {
    const ar = this.audioReader;
    const dragHandle = document.querySelector('.audioreader-drag-handle');
    if (!dragHandle) return;

    this.dragHandlers.dragHandleElement = dragHandle;

    this.dragHandlers.onDragStart = (e) => {
      this.isDragging = true;
      this.dragStartY = e.touches ? e.touches[0].clientY : e.clientY;
      this.dragCurrentY = this.dragStartY;
    };

    this.dragHandlers.onDragMove = (e) => {
      if (!this.isDragging) return;
      this.dragCurrentY = e.touches ? e.touches[0].clientY : e.clientY;
    };

    this.dragHandlers.onDragEnd = () => {
      if (!this.isDragging) return;

      const deltaY = this.dragCurrentY - this.dragStartY;
      this.isDragging = false;

      // Swipe hacia arriba: expandir (pasar de minimizado a completo)
      if (deltaY < -50 && ar.ui?.isMinimized) {
        ar.ui.toggleMinimize?.();
      }
      // Swipe hacia abajo: minimizar (pasar de completo a minimizado)
      else if (deltaY > 50 && !ar.ui?.isMinimized) {
        ar.ui.toggleMinimize?.();
      }
    };

    dragHandle.addEventListener('touchstart', this.dragHandlers.onDragStart, { passive: true });
    dragHandle.addEventListener('mousedown', this.dragHandlers.onDragStart);
    document.addEventListener('touchmove', this.dragHandlers.onDragMove, { passive: true });
    document.addEventListener('mousemove', this.dragHandlers.onDragMove);
    document.addEventListener('touchend', this.dragHandlers.onDragEnd);
    document.addEventListener('mouseup', this.dragHandlers.onDragEnd);
  }

  detachDragListeners() {
    const dragHandle = this.dragHandlers.dragHandleElement;

    if (this.dragHandlers.onDragStart && dragHandle) {
      dragHandle.removeEventListener('touchstart', this.dragHandlers.onDragStart);
      dragHandle.removeEventListener('mousedown', this.dragHandlers.onDragStart);
    }

    if (this.dragHandlers.onDragMove) {
      document.removeEventListener('touchmove', this.dragHandlers.onDragMove);
      document.removeEventListener('mousemove', this.dragHandlers.onDragMove);
    }

    if (this.dragHandlers.onDragEnd) {
      document.removeEventListener('touchend', this.dragHandlers.onDragEnd);
      document.removeEventListener('mouseup', this.dragHandlers.onDragEnd);
    }

    this.dragHandlers = {
      onDragStart: null,
      onDragMove: null,
      onDragEnd: null,
      dragHandleElement: null
    };
  }

  // ==========================================================================
  // PAUSE INDICATOR CONTROLS
  // ==========================================================================

  attachPauseControlListeners() {
    const ar = this.audioReader;

    const skipBtn = document.getElementById('audioreader-skip-pause');
    const extendBtn = document.getElementById('audioreader-extend-pause');

    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        ar.ui?.skipPause?.();
      });
    }

    if (extendBtn) {
      extendBtn.addEventListener('click', () => {
        ar.ui?.extendPause?.(60000); // Extender 1 minuto
      });
    }
  }

  // ==========================================================================
  // INICIALIZACIÓN Y CLEANUP
  // ==========================================================================

  attachAll() {
    this.attachKeyboardListeners();
    this.attachVisibilityHandler();
    this.attachBeforeUnloadHandler();
    this.attachDragListeners();
  }

  detachAll() {
    this.detachKeyboardListeners();
    this.detachVisibilityHandler();
    this.detachBeforeUnloadHandler();
    this.detachDragListeners();
  }

  cleanup() {
    this.detachAll();
  }

  destroy() {
    this.cleanup();
    this.audioReader = null;
  }
}

// Exportar globalmente
window.AudioReaderEvents = AudioReaderEvents;
