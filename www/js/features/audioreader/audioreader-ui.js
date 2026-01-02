// ============================================================================
// AUDIOREADER UI - Interfaz de usuario del reproductor
// ============================================================================
// v2.9.278: Modularización del AudioReader
// Maneja renderizado de controles, progress, pause indicator, minimized player

class AudioReaderUI {
  constructor(audioReader) {
    this.audioReader = audioReader;
    this.isMinimized = localStorage.getItem('audioreader-minimized') === 'true';
    this.isBottomSheetExpanded = false;
    this.isRendering = false;

    // Timer para pausa
    this.pauseTimerInterval = null;
    this.currentPauseEndTime = null;
  }

  // ==========================================================================
  // RENDER PRINCIPAL
  // ==========================================================================

  async render() {
    if (this.isRendering) {
      return;
    }

    this.isRendering = true;

    try {
      const ar = this.audioReader;

      // Limpiar listeners anteriores
      ar.events?.detachDragListeners?.();
      ar.events?.detachKeyboardListeners?.();

      // Remover elementos anteriores
      const oldControls = document.getElementById('audioreader-controls');
      const oldFab = document.getElementById('audioreader-fab');
      const oldBottomSheet = document.getElementById('audioreader-bottom-sheet');
      const oldOverlay = document.getElementById('audioreader-overlay');
      if (oldControls) oldControls.remove();
      if (oldFab) oldFab.remove();
      if (oldBottomSheet) oldBottomSheet.remove();
      if (oldOverlay) oldOverlay.remove();

      // Obtener datos
      const bookData = ar.bookEngine?.getCurrentBookData?.() || {};
      const paragraphs = ar.content?.getParagraphs() || [];
      const tiempoEstimado = ar.utils?.estimateTime(paragraphs, ar.currentParagraphIndex, ar.tts?.getRate() || 1) || 0;

      if (this.isMinimized) {
        await this.renderMinimized(bookData, tiempoEstimado);
      } else {
        await this.renderFull(bookData, tiempoEstimado);
      }

      // Adjuntar listeners
      ar.events?.attachKeyboardListeners?.();
      ar.events?.attachDragListeners?.();

    } catch (error) {
      console.error('Error en renderControls:', error);
    } finally {
      this.isRendering = false;
    }
  }

  // ==========================================================================
  // RENDER FULL (Panel completo)
  // ==========================================================================

  async renderFull(bookData, tiempoEstimado) {
    const ar = this.audioReader;
    const paragraphs = ar.content?.getParagraphs() || [];
    const progress = paragraphs.length > 0
      ? ((ar.currentParagraphIndex + 1) / paragraphs.length * 100).toFixed(1)
      : 0;

    const container = document.createElement('div');
    container.id = 'audioreader-container';
    container.innerHTML = `
      <div id="audioreader-controls" class="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-slate-900 via-slate-900/95 to-slate-900/90 backdrop-blur-xl border-t border-white/10 shadow-2xl" style="padding-bottom: env(safe-area-inset-bottom, 16px);">
        <!-- Drag handle -->
        <div class="audioreader-drag-handle w-12 h-1 bg-white/30 rounded-full mx-auto mt-2 mb-3 cursor-grab"></div>

        <!-- Header -->
        <div class="px-4 sm:px-6 pb-2 border-b border-white/10">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <h3 class="text-sm sm:text-base font-medium text-white truncate">${bookData.title || 'Audiolibro'}</h3>
              <p class="text-xs text-slate-400 truncate">${ar.bookEngine?.currentChapter?.title || ''}</p>
            </div>
            <div class="flex items-center gap-2">
              <button id="audioreader-minimize" class="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 transition-colors" title="Minimizar">
                ${Icons?.chevronDown?.(20) || '↓'}
              </button>
              <button id="audioreader-close" class="p-2 rounded-lg bg-red-900/50 hover:bg-red-800 text-red-400 transition-colors" title="Cerrar">
                ${Icons?.x?.(20) || '✕'}
              </button>
            </div>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="px-4 sm:px-6 py-3">
          <div class="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-cyan-500 transition-all duration-300" style="width: ${progress}%"></div>
          </div>
          <div class="flex justify-between text-xs text-slate-500 mt-1">
            <span>Párrafo ${ar.currentParagraphIndex + 1} / ${paragraphs.length || 1}</span>
            <span>${ar.utils?.formatTime(tiempoEstimado) || ''} restante</span>
          </div>
        </div>

        <!-- Main controls -->
        <div class="px-4 sm:px-6 py-3">
          <div class="flex items-center justify-center gap-4">
            <button id="audioreader-prev" class="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center text-white disabled:opacity-50" title="Anterior">
              ${Icons?.skipBack?.(24) || '⏮'}
            </button>

            <button id="${ar.isPlaying && !ar.isPaused ? 'audioreader-pause' : 'audioreader-play'}"
              class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${ar.isPlaying && !ar.isPaused
                ? 'bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 animate-pulse'
                : 'bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500'}
              transition-all shadow-xl flex items-center justify-center text-white"
              title="${ar.isPlaying && !ar.isPaused ? 'Pausar' : 'Reproducir'}">
              ${ar.isPlaying && !ar.isPaused ? (Icons?.pause?.(28) || '⏸') : (Icons?.play?.(28) || '▶')}
            </button>

            <button id="audioreader-next" class="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors flex items-center justify-center text-white disabled:opacity-50" title="Siguiente">
              ${Icons?.skipForward?.(24) || '⏭'}
            </button>

            <button id="audioreader-stop" class="w-10 h-10 rounded-lg bg-slate-800/50 hover:bg-slate-700 transition-colors flex items-center justify-center text-slate-400 disabled:opacity-50" title="Detener">
              ${Icons?.square?.(20) || '⏹'}
            </button>
          </div>
        </div>

        <!-- Secondary controls -->
        <div class="px-4 sm:px-6 py-3 border-t border-white/5">
          <div class="grid grid-cols-2 gap-3">
            <!-- Rate -->
            <div>
              <label class="block text-xs text-slate-500 mb-1">Velocidad</label>
              <select id="audioreader-rate" class="w-full px-3 py-2 rounded-lg bg-slate-800 text-white text-sm border border-slate-700">
                <option value="0.5" ${ar.tts?.getRate() === 0.5 ? 'selected' : ''}>0.5x</option>
                <option value="0.75" ${ar.tts?.getRate() === 0.75 ? 'selected' : ''}>0.75x</option>
                <option value="1" ${ar.tts?.getRate() === 1 ? 'selected' : ''}>1x</option>
                <option value="1.25" ${ar.tts?.getRate() === 1.25 ? 'selected' : ''}>1.25x</option>
                <option value="1.5" ${ar.tts?.getRate() === 1.5 ? 'selected' : ''}>1.5x</option>
                <option value="2" ${ar.tts?.getRate() === 2 ? 'selected' : ''}>2x</option>
              </select>
            </div>

            <!-- Auto-advance -->
            <button id="audioreader-auto-advance" class="px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${ar.playback?.isAutoAdvanceEnabled() ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}">
              <span>Auto-avance</span>
              <span>${ar.playback?.isAutoAdvanceEnabled() ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        <!-- Ambient & Binaural sounds -->
        <div class="px-4 sm:px-6 py-3 border-t border-white/5">
          <details class="group">
            <summary class="text-xs font-medium text-purple-400 cursor-pointer flex items-center gap-2 py-1">
              <span class="transition-transform group-open:rotate-90">▶</span>
              🎵 Ambiente y Binaural
            </summary>
            <div class="mt-3 p-3 bg-purple-900/20 rounded-lg">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-slate-500 mb-1">Sonido Ambiente</label>
                  <select id="audioreader-ambient-select"
                          class="w-full px-3 py-2 rounded-lg bg-slate-800 text-white text-sm border border-slate-700">
                    <option value="">🌊 Sin ambiente</option>
                    <option value="rain">🌧️ Lluvia</option>
                    <option value="forest">🌳 Bosque</option>
                    <option value="ocean">🌊 Océano</option>
                    <option value="fire">🔥 Fogata</option>
                    <option value="night">🌙 Noche</option>
                    <option value="cafe">☕ Cafetería</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs text-slate-500 mb-1">Binaural</label>
                  <select id="audioreader-binaural-select"
                          class="w-full px-3 py-2 rounded-lg bg-slate-800 text-white text-sm border border-slate-700">
                    <option value="">🧠 Sin binaural</option>
                    <option value="focus">🎯 Enfoque (14Hz)</option>
                    <option value="relax">😌 Relajación (10Hz)</option>
                    <option value="deep">🧘 Meditación (7Hz)</option>
                    <option value="sleep">😴 Sueño (4Hz)</option>
                  </select>
                </div>
              </div>

              <div class="mt-3 flex items-center gap-3">
                <span class="text-xs text-slate-500">Volumen</span>
                <input type="range" id="audioreader-ambient-volume"
                       min="0" max="100" value="30"
                       class="flex-1 h-1 bg-slate-600 rounded-full appearance-none cursor-pointer accent-purple-500">
                <span id="audioreader-ambient-volume-label" class="text-xs text-slate-400 w-8">30%</span>
              </div>
            </div>
          </details>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    this.attachControlListeners();
  }

  // ==========================================================================
  // RENDER MINIMIZED (Bottom sheet)
  // ==========================================================================

  async renderMinimized(bookData, tiempoEstimado) {
    const ar = this.audioReader;
    const paragraphs = ar.content?.getParagraphs() || [];
    const progress = paragraphs.length > 0
      ? ((ar.currentParagraphIndex + 1) / paragraphs.length * 100).toFixed(1)
      : 0;

    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'audioreader-overlay';
    overlay.className = 'fixed inset-0 bg-black/50 z-40 hidden';
    document.body.appendChild(overlay);

    // Bottom sheet
    const bottomSheet = document.createElement('div');
    bottomSheet.id = 'audioreader-bottom-sheet';
    bottomSheet.className = 'fixed inset-x-0 bottom-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-2xl transform transition-transform duration-300';
    bottomSheet.style.paddingBottom = 'env(safe-area-inset-bottom, 16px)';

    bottomSheet.innerHTML = `
      <div id="audioreader-controls">
        <!-- Drag handle -->
        <div class="audioreader-drag-handle w-12 h-1 bg-white/30 rounded-full mx-auto mt-2 mb-2 cursor-grab"></div>

        <!-- Mini player -->
        <div class="px-4 py-2 flex items-center gap-3">
          <!-- Progress ring -->
          <div class="relative w-12 h-12 flex-shrink-0">
            <svg class="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#334155" stroke-width="3"/>
              <circle cx="18" cy="18" r="15" fill="none" stroke="#06b6d4" stroke-width="3"
                stroke-dasharray="${progress * 0.94} 94" stroke-linecap="round"/>
            </svg>
            <div class="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
              ${Math.round(parseFloat(progress))}%
            </div>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm text-white font-medium truncate">${bookData.title || 'Audiolibro'}</p>
            <p class="text-xs text-slate-400">
              ${paragraphs.length > 0 ? `${ar.currentParagraphIndex + 1}/${paragraphs.length}` : ''}
              ${ar.utils?.formatTime(tiempoEstimado) ? `• ${ar.utils.formatTime(tiempoEstimado)}` : ''}
            </p>
          </div>

          <!-- Controls -->
          <div class="flex items-center gap-2">
            <button id="audioreader-prev" class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-white">
              ${Icons?.skipBack?.(18) || '⏮'}
            </button>
            <button id="${ar.isPlaying && !ar.isPaused ? 'audioreader-pause' : 'audioreader-play'}"
              class="w-12 h-12 rounded-xl ${ar.isPlaying && !ar.isPaused
                ? 'bg-orange-500'
                : 'bg-cyan-500'}
              flex items-center justify-center text-white">
              ${ar.isPlaying && !ar.isPaused ? (Icons?.pause?.(24) || '⏸') : (Icons?.play?.(24) || '▶')}
            </button>
            <button id="audioreader-next" class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-white">
              ${Icons?.skipForward?.(18) || '⏭'}
            </button>
            <button id="audioreader-expand" class="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-white">
              ${Icons?.chevronUp?.(18) || '↑'}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(bottomSheet);
    this.attachControlListeners();
    this.attachMinimizedGestures();
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  attachControlListeners() {
    const ar = this.audioReader;

    // Play/Pause
    const playBtn = document.getElementById('audioreader-play');
    const pauseBtn = document.getElementById('audioreader-pause');

    if (playBtn) {
      playBtn.addEventListener('click', async () => {
        if (ar.isPaused) {
          await ar.playback?.resume();
        } else {
          const chapterContent = document.querySelector('.chapter-content');
          if (chapterContent) {
            await ar.playback?.play(chapterContent.innerHTML);
          }
        }
      });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', async () => {
        await ar.playback?.pause();
      });
    }

    // Navigation
    const prevBtn = document.getElementById('audioreader-prev');
    const nextBtn = document.getElementById('audioreader-next');
    const stopBtn = document.getElementById('audioreader-stop');

    if (prevBtn) prevBtn.addEventListener('click', () => ar.playback?.previous());
    if (nextBtn) nextBtn.addEventListener('click', () => ar.playback?.next());
    if (stopBtn) stopBtn.addEventListener('click', () => ar.playback?.stop());

    // Rate
    const rateSelect = document.getElementById('audioreader-rate');
    if (rateSelect) {
      rateSelect.addEventListener('change', (e) => {
        ar.tts?.setRate(parseFloat(e.target.value));
      });
    }

    // Auto-advance
    const autoBtn = document.getElementById('audioreader-auto-advance');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => {
        ar.playback?.toggleAutoAdvance();
        this.updateButtonStates();
      });
    }

    // Minimize/Expand/Close
    const minimizeBtn = document.getElementById('audioreader-minimize');
    const expandBtn = document.getElementById('audioreader-expand');
    const closeBtn = document.getElementById('audioreader-close');

    if (minimizeBtn) minimizeBtn.addEventListener('click', () => this.toggleMinimize());
    if (expandBtn) expandBtn.addEventListener('click', () => this.toggleMinimize());
    if (closeBtn) closeBtn.addEventListener('click', () => ar.hide?.());

    // Ambient/Binaural controls
    this.attachAmbientBinauralListeners();
  }

  /**
   * Attach listeners for ambient and binaural sound controls
   */
  attachAmbientBinauralListeners() {
    const ambientSelect = document.getElementById('audioreader-ambient-select');
    const binauralSelect = document.getElementById('audioreader-binaural-select');
    const volumeSlider = document.getElementById('audioreader-ambient-volume');
    const volumeLabel = document.getElementById('audioreader-ambient-volume-label');

    // Ambient sound selection
    if (ambientSelect) {
      ambientSelect.addEventListener('change', async (e) => {
        const value = e.target.value;
        if (window.audioMixer) {
          if (value) {
            await window.audioMixer.playAmbient(value);
          } else {
            window.audioMixer.stopAmbient();
          }
        }
      });
    }

    // Binaural sound selection
    if (binauralSelect) {
      binauralSelect.addEventListener('change', async (e) => {
        const value = e.target.value;
        if (window.audioMixer) {
          if (value) {
            await window.audioMixer.playBinaural(value);
          } else {
            window.audioMixer.stopBinaural();
          }
        } else if (window.binauralModal) {
          // Fallback to binaural modal if audioMixer not available
          if (value) {
            window.binauralModal.show();
          }
        }
      });
    }

    // Volume control
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value);
        if (volumeLabel) {
          volumeLabel.textContent = `${volume}%`;
        }
        if (window.audioMixer) {
          window.audioMixer.setAmbientVolume(volume / 100);
          window.audioMixer.setBinauralVolume(volume / 100);
        }
      });
    }
  }

  attachMinimizedGestures() {
    const overlay = document.getElementById('audioreader-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        if (this.isBottomSheetExpanded) {
          this.toggleBottomSheet();
        }
      });
    }
  }

  // ==========================================================================
  // UI UPDATES
  // ==========================================================================

  async updateUI() {
    await this.render();
  }

  updateButtonStates() {
    const ar = this.audioReader;
    const shouldShowPlay = !ar.isPlaying || ar.isPaused;

    // Update play/pause button
    const playBtn = document.getElementById('audioreader-play');
    const pauseBtn = document.getElementById('audioreader-pause');

    if (shouldShowPlay && pauseBtn) {
      const newPlayBtn = document.createElement('button');
      newPlayBtn.id = 'audioreader-play';
      newPlayBtn.className = 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-xl flex items-center justify-center text-white';
      newPlayBtn.innerHTML = Icons?.play?.(28) || '▶';
      newPlayBtn.addEventListener('click', async () => {
        if (ar.isPaused) {
          await ar.playback?.resume();
        } else {
          const chapterContent = document.querySelector('.chapter-content');
          if (chapterContent) {
            await ar.playback?.play(chapterContent.innerHTML);
          }
        }
      });
      pauseBtn.replaceWith(newPlayBtn);
    } else if (!shouldShowPlay && playBtn) {
      const newPauseBtn = document.createElement('button');
      newPauseBtn.id = 'audioreader-pause';
      newPauseBtn.className = 'w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 transition-all shadow-xl flex items-center justify-center text-white animate-pulse';
      newPauseBtn.innerHTML = Icons?.pause?.(28) || '⏸';
      newPauseBtn.addEventListener('click', async () => {
        await ar.playback?.pause();
      });
      playBtn.replaceWith(newPauseBtn);
    }

    // Update auto-advance button
    const autoBtn = document.getElementById('audioreader-auto-advance');
    if (autoBtn) {
      const enabled = ar.playback?.isAutoAdvanceEnabled();
      autoBtn.className = `px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${enabled ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`;
      const statusSpan = autoBtn.querySelector('span:last-child');
      if (statusSpan) statusSpan.textContent = enabled ? 'ON' : 'OFF';
    }
  }

  updateProgressInfo() {
    const ar = this.audioReader;
    const controls = document.getElementById('audioreader-controls');
    if (!controls) return;

    const paragraphs = ar.content?.getParagraphs() || [];
    const progress = paragraphs.length > 0
      ? ((ar.currentParagraphIndex + 1) / paragraphs.length * 100).toFixed(1)
      : 0;

    const progressBar = controls.querySelector('.bg-cyan-500');
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
  }

  updateProgressBar() {
    this.updateProgressInfo();
  }

  // ==========================================================================
  // PAUSE INDICATOR
  // ==========================================================================

  showPauseIndicator(pauseDurationMs, stepNumber, totalSteps) {
    const controls = document.getElementById('audioreader-controls');
    if (!controls) return;

    // Reproducir campana de meditación
    if (this.audioReader.meditationModule) {
      this.audioReader.meditationModule.playBell('start');
    }

    // Determinar fase
    const position = stepNumber / totalSteps;
    let phaseName, phaseIcon, phaseColor;

    if (position <= 0.25) {
      phaseName = 'Preparación';
      phaseIcon = '🌅';
      phaseColor = 'from-blue-600/20 to-cyan-600/20 border-cyan-500/30';
    } else if (position <= 0.5) {
      phaseName = 'Entrada';
      phaseIcon = '🌊';
      phaseColor = 'from-teal-600/20 to-emerald-600/20 border-emerald-500/30';
    } else if (position <= 0.75) {
      phaseName = 'Inmersión';
      phaseIcon = '🧘';
      phaseColor = 'from-purple-600/20 to-indigo-600/20 border-purple-500/30';
    } else if (stepNumber < totalSteps) {
      phaseName = 'Contemplación';
      phaseIcon = '✨';
      phaseColor = 'from-violet-600/20 to-purple-600/20 border-violet-500/30';
    } else {
      phaseName = 'Integración';
      phaseIcon = '🌟';
      phaseColor = 'from-amber-600/20 to-orange-600/20 border-amber-500/30';
    }

    let indicator = document.getElementById('audioreader-pause-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'audioreader-pause-indicator';
      controls.appendChild(indicator);
    }

    const pauseSeconds = Math.ceil(pauseDurationMs / 1000);
    indicator.className = `m-4 p-4 rounded-xl bg-gradient-to-r ${phaseColor} backdrop-blur-sm border`;
    indicator.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-2xl">${phaseIcon}</span>
          <div>
            <p class="text-white font-medium">${phaseName}</p>
            <p class="text-sm text-slate-400">Paso ${stepNumber} de ${totalSteps}</p>
          </div>
        </div>
        <div class="text-right">
          <p id="audioreader-pause-timer" class="text-2xl font-mono text-white">${this.formatPauseTime(pauseSeconds)}</p>
          <p class="text-xs text-slate-400">restante</p>
        </div>
      </div>
      <div class="mt-3 h-1 bg-slate-700 rounded-full overflow-hidden">
        <div id="audioreader-pause-progress" class="h-full bg-white/50 transition-all duration-1000" style="width: 100%"></div>
      </div>
      <div class="mt-3 flex gap-2">
        <button id="audioreader-skip-pause" class="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm">
          Saltar ⏭
        </button>
        <button id="audioreader-extend-pause" class="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm">
          +1 min ⏱
        </button>
      </div>
    `;

    this.startPauseTimer(pauseDurationMs);
    this.audioReader.events?.attachPauseControlListeners?.();
  }

  formatPauseTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  startPauseTimer(pauseDurationMs) {
    if (this.pauseTimerInterval) {
      clearInterval(this.pauseTimerInterval);
    }

    this.currentPauseEndTime = Date.now() + pauseDurationMs;
    const totalDuration = pauseDurationMs;

    this.pauseTimerInterval = setInterval(() => {
      const remaining = Math.max(0, this.currentPauseEndTime - Date.now());
      const seconds = Math.ceil(remaining / 1000);

      const display = document.getElementById('audioreader-pause-timer');
      if (display) {
        display.textContent = this.formatPauseTime(seconds);
      }

      const progressBar = document.getElementById('audioreader-pause-progress');
      if (progressBar) {
        const percentage = (remaining / totalDuration) * 100;
        progressBar.style.width = `${percentage}%`;
      }

      if (remaining <= 0) {
        this.hidePauseIndicator();
      }
    }, 1000);
  }

  hidePauseIndicator() {
    const indicator = document.getElementById('audioreader-pause-indicator');
    if (indicator) {
      indicator.remove();
    }

    if (this.pauseTimerInterval) {
      clearInterval(this.pauseTimerInterval);
      this.pauseTimerInterval = null;
    }

    this.currentPauseEndTime = null;

    // Reproducir campana de fin
    if (this.audioReader.meditationModule) {
      this.audioReader.meditationModule.playBell('soft');
    }
  }

  skipPause() {
    const ar = this.audioReader;

    this.hidePauseIndicator();

    // Cancelar timer de pausa pendiente
    if (ar.playback?.currentPauseTimer) {
      if (ar.utils) {
        ar.utils.clearTimeout(ar.playback.currentPauseTimer);
      } else {
        clearTimeout(ar.playback.currentPauseTimer);
      }
      ar.playback.currentPauseTimer = null;
    }

    // Continuar reproducción
    if (ar.isPlaying && !ar.isPaused) {
      ar.playback?.speakCurrentParagraph?.();
    }
  }

  extendPause(extraMs = 60000) {
    if (!this.currentPauseEndTime) return;

    this.currentPauseEndTime += extraMs;

    const remaining = Math.ceil((this.currentPauseEndTime - Date.now()) / 1000);
    const display = document.getElementById('audioreader-pause-timer');
    if (display) {
      display.textContent = this.formatPauseTime(remaining);
    }

    window.toast?.info(`Pausa extendida ${extraMs / 60000} minuto(s)`);
  }

  // ==========================================================================
  // MINIMIZE/EXPAND
  // ==========================================================================

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    try {
      localStorage.setItem('audioreader-minimized', this.isMinimized.toString());
    } catch (e) {}

    this.render();
  }

  toggleBottomSheet() {
    this.isBottomSheetExpanded = !this.isBottomSheetExpanded;

    const bottomSheet = document.getElementById('audioreader-bottom-sheet');
    const overlay = document.getElementById('audioreader-overlay');

    if (this.isBottomSheetExpanded) {
      if (bottomSheet) bottomSheet.classList.add('expanded');
      if (overlay) overlay.classList.remove('hidden');
    } else {
      if (bottomSheet) bottomSheet.classList.remove('expanded');
      if (overlay) overlay.classList.add('hidden');
    }
  }

  // ==========================================================================
  // HEADER & NAV UPDATES
  // ==========================================================================

  updateHeaderAudioIcons() {
    const ar = this.audioReader;
    const iconElements = document.querySelectorAll('[data-audio-icon]');

    iconElements.forEach(el => {
      if (ar.isPlaying && !ar.isPaused) {
        el.innerHTML = Icons?.pause?.(20) || '⏸';
      } else {
        el.innerHTML = Icons?.play?.(20) || '▶';
      }
    });
  }

  updateBottomNavAudioButton() {
    const ar = this.audioReader;
    const audioTab = document.querySelector('[data-tab="audio"]');
    if (!audioTab) return;

    const icon = audioTab.querySelector('[data-audio-icon]');
    if (icon) {
      if (ar.isPlaying && !ar.isPaused) {
        icon.innerHTML = Icons?.pause?.(20) || '⏸';
      } else {
        icon.innerHTML = Icons?.play?.(20) || '▶';
      }
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    if (this.pauseTimerInterval) {
      clearInterval(this.pauseTimerInterval);
      this.pauseTimerInterval = null;
    }

    const controls = document.getElementById('audioreader-controls');
    const container = document.getElementById('audioreader-container');
    const bottomSheet = document.getElementById('audioreader-bottom-sheet');
    const overlay = document.getElementById('audioreader-overlay');

    if (controls) controls.remove();
    if (container) container.remove();
    if (bottomSheet) bottomSheet.remove();
    if (overlay) overlay.remove();

    this.audioReader = null;
  }
}

// Exportar globalmente
window.AudioReaderUI = AudioReaderUI;
