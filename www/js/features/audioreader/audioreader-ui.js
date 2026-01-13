// ============================================================================
// AUDIOREADER UI - Interfaz de usuario del reproductor
// ============================================================================
// v2.9.358: Drag handle mejorado con touch-action:none y user-select:none
// v2.9.357: Drag handle más grande (área táctil h-6) para mejor usabilidad
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

      // Guard clause: si audioReader fue destruido, salir
      if (!ar) {
        this.isRendering = false;
        return;
      }

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
      logger.error('Error en renderControls:', error);
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

    // Calcular offset para no tapar footer-nav de capítulos
    const footerNav = document.querySelector('.footer-nav');
    const footerNavHeight = footerNav ? footerNav.offsetHeight : 0;
    const bottomOffset = footerNavHeight > 0 ? `${footerNavHeight}px` : 'env(safe-area-inset-bottom, 0px)';

    const container = document.createElement('div');
    container.id = 'audioreader-container';
    container.innerHTML = `
      <div id="audioreader-controls" class="fixed inset-x-0 z-50 bg-gradient-to-t from-slate-900 via-slate-900/95 to-slate-900/90 backdrop-blur-xl border-t border-white/10 shadow-2xl" style="bottom: ${bottomOffset}; padding-bottom: 16px;">
        <!-- Drag handle - área táctil grande, evita selección de texto -->
        <div class="audioreader-drag-handle w-full h-8 flex items-center justify-center cursor-grab select-none touch-none" style="user-select: none; -webkit-user-select: none; touch-action: none;">
          <div class="w-16 h-1.5 bg-white/50 rounded-full"></div>
        </div>

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
            <!-- Wave indicator -->
            <div id="main-wave" class="flex items-end gap-0.5 h-6 w-8 ${ar.isPlaying && !ar.isPaused ? '' : 'wave-paused'}">
              <span class="wave-bar w-1 bg-cyan-400 rounded-full"></span>
              <span class="wave-bar w-1 bg-cyan-400 rounded-full"></span>
              <span class="wave-bar w-1 bg-cyan-400 rounded-full"></span>
              <span class="wave-bar w-1 bg-cyan-400 rounded-full"></span>
              <span class="wave-bar w-1 bg-cyan-400 rounded-full"></span>
            </div>

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

        <!-- Secondary controls - Mejorado -->
        <div class="px-4 sm:px-6 py-3 border-t border-white/5">
          <!-- Velocidad slider -->
          <div class="mb-3">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-slate-500">Velocidad</span>
              <span id="speed-value" class="text-sm font-mono text-cyan-400">${ar.tts?.getRate() || 1}x</span>
            </div>
            <input type="range" id="speed-slider"
                   min="0" max="6" value="${[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].indexOf(ar.tts?.getRate() || 1)}"
                   class="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500">
            <div class="flex text-[10px] text-slate-600 mt-1">
              <span class="w-[14.28%] text-left">0.5</span>
              <span class="w-[14.28%] text-center">0.75</span>
              <span class="w-[14.28%] text-center">1x</span>
              <span class="w-[14.28%] text-center">1.25</span>
              <span class="w-[14.28%] text-center">1.5</span>
              <span class="w-[14.28%] text-center">1.75</span>
              <span class="w-[14.28%] text-right">2x</span>
            </div>
          </div>

          <!-- Controles rápidos -->
          <div class="grid grid-cols-2 gap-2">
            <!-- Auto-advance -->
            <button id="audioreader-auto-advance" class="px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${ar.playback?.isAutoAdvanceEnabled() ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}">
              <span>↪️ Auto</span>
              <span>${ar.playback?.isAutoAdvanceEnabled() ? 'ON' : 'OFF'}</span>
            </button>

            <!-- Night mode -->
            <button id="night-mode-toggle" class="px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${localStorage.getItem('audioreader-night-mode') === 'true' ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}">
              <span>🌙 Noche</span>
              <span>${localStorage.getItem('audioreader-night-mode') === 'true' ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        <!-- Sleep Timer Quick Access -->
        <div class="px-4 sm:px-6 py-2 border-t border-white/5">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs text-slate-500">💤 Apagar en:</span>
            <div class="flex gap-1 flex-wrap">
              <button class="sleep-quick-btn px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300" data-minutes="5">5m</button>
              <button class="sleep-quick-btn px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300" data-minutes="15">15m</button>
              <button class="sleep-quick-btn px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300" data-minutes="30">30m</button>
              <button class="sleep-quick-btn px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300" data-minutes="60">1h</button>
              <button id="sleep-cancel-btn" class="px-2 py-1 text-xs rounded bg-red-900/50 hover:bg-red-800 text-red-400 hidden">✕</button>
            </div>
            <span id="sleep-countdown" class="text-xs text-amber-400 ml-auto hidden"></span>
          </div>
        </div>

        <!-- Bookmarks -->
        <div class="px-4 sm:px-6 py-2 border-t border-white/5">
          <div class="flex gap-2">
            <button id="bookmark-save" class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors">
              📖 Guardar posición
            </button>
            ${ar.uxEnhancements?.hasBookmark?.() ? `
              <button id="bookmark-restore" class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm transition-colors">
                ↩️ Continuar
              </button>
            ` : ''}
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
              <!-- Sonidos Ambiente (multi-selección, máx 3) -->
              <div class="mb-3">
                <div class="flex items-center justify-between mb-2">
                  <label class="text-xs text-slate-500">Sonidos Ambiente <span class="text-slate-600">(máx 3)</span></label>
                  <button id="audioreader-stop-all-ambient" class="text-xs text-red-400 hover:text-red-300">🔇 Parar todos</button>
                </div>
                <div id="audioreader-ambient-grid" class="grid grid-cols-5 gap-1.5">
                  <button class="ambient-toggle p-1.5 rounded-lg bg-slate-700 hover:bg-purple-600 text-center text-lg transition-colors" data-sound="rain" title="Lluvia">🌧️</button>
                  <button class="ambient-toggle p-1.5 rounded-lg bg-slate-700 hover:bg-purple-600 text-center text-lg transition-colors" data-sound="ocean" title="Océano">🌊</button>
                  <button class="ambient-toggle p-1.5 rounded-lg bg-slate-700 hover:bg-purple-600 text-center text-lg transition-colors" data-sound="forest" title="Bosque">🌲</button>
                  <button class="ambient-toggle p-1.5 rounded-lg bg-slate-700 hover:bg-purple-600 text-center text-lg transition-colors" data-sound="river" title="Río">💧</button>
                  <button class="ambient-toggle p-1.5 rounded-lg bg-slate-700 hover:bg-purple-600 text-center text-lg transition-colors" data-sound="whales" title="Ballenas">🐋</button>
                  <button class="ambient-toggle p-1.5 rounded-lg bg-slate-700 hover:bg-purple-600 text-center text-lg transition-colors" data-sound="fire" title="Fuego">🔥</button>
                  <button class="ambient-toggle p-1.5 rounded-lg bg-slate-700 hover:bg-purple-600 text-center text-lg transition-colors" data-sound="storm" title="Tormenta">⛈️</button>
                  <button class="ambient-toggle p-1.5 rounded-lg bg-slate-700 hover:bg-purple-600 text-center text-lg transition-colors" data-sound="wind" title="Viento">🌬️</button>
                  <button class="ambient-toggle p-1.5 rounded-lg bg-slate-700 hover:bg-purple-600 text-center text-lg transition-colors" data-sound="night" title="Noche">🌙</button>
                  <button class="ambient-toggle p-1.5 rounded-lg bg-slate-700 hover:bg-purple-600 text-center text-lg transition-colors" data-sound="birds" title="Pájaros">🐦</button>
                  <button class="ambient-toggle p-1.5 rounded-lg bg-slate-700 hover:bg-purple-600 text-center text-lg transition-colors" data-sound="cafe" title="Cafetería">☕</button>
                  <button class="ambient-toggle p-1.5 rounded-lg bg-slate-700 hover:bg-purple-600 text-center text-lg transition-colors" data-sound="meditation" title="Meditación">🕉️</button>
                  <button class="ambient-toggle p-1.5 rounded-lg bg-slate-700 hover:bg-purple-600 text-center text-lg transition-colors" data-sound="piano" title="Piano">🎹</button>
                </div>
              </div>

              <!-- Binaural -->
              <div class="mb-3">
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

              <div class="flex items-center gap-3">
                <span class="text-xs text-slate-500">Volumen</span>
                <input type="range" id="audioreader-ambient-volume"
                       min="0" max="100" value="30"
                       class="flex-1 h-1 bg-slate-600 rounded-full appearance-none cursor-pointer accent-purple-500">
                <span id="audioreader-ambient-volume-label" class="text-xs text-slate-400 w-8">30%</span>
              </div>
            </div>
          </details>
        </div>

        <!-- Voice System -->
        <div class="px-4 sm:px-6 py-3 border-t border-white/5">
          <details class="group" open>
            <summary class="text-xs font-medium text-cyan-400 cursor-pointer flex items-center gap-2 py-1">
              <span class="transition-transform group-open:rotate-90">▶</span>
              🎤 Sistema de Voz
            </summary>
            <div class="mt-3 p-3 bg-cyan-900/20 rounded-lg">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-slate-500 mb-1">Proveedor</label>
                  <select id="audioreader-tts-provider"
                          class="w-full px-3 py-2 rounded-lg bg-slate-800 text-white text-sm border border-slate-700">
                    <option value="browser" ${ar.tts?.getProvider() === 'browser' ? 'selected' : ''}>Web Speech</option>
                    ${ar.tts?.nativeTTS ? `<option value="native" ${ar.tts?.getProvider() === 'native' ? 'selected' : ''}>Sistema (Android)</option>` : ''}
                    ${localStorage.getItem('openai-tts-key') ? `<option value="openai" ${ar.tts?.getProvider() === 'openai' ? 'selected' : ''}>OpenAI</option>` : ''}
                    ${ar.tts?.ttsManager?.isElevenLabsAvailable?.() || (ar.tts?.ttsManager?.providers?.elevenlabs && window.authHelper?.isPremium?.()) ? `<option value="elevenlabs" ${ar.tts?.getProvider() === 'elevenlabs' ? 'selected' : ''}>ElevenLabs</option>` : ''}
                  </select>
                </div>
                <div>
                  <label class="block text-xs text-slate-500 mb-1">Voz</label>
                  <select id="audioreader-voice-select"
                          class="w-full px-3 py-2 rounded-lg bg-slate-800 text-white text-sm border border-slate-700">
                    <option value="">Cargando voces...</option>
                  </select>
                </div>
              </div>
              <button id="audioreader-test-voice"
                      class="mt-3 w-full px-3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-medium transition-colors">
                🔊 Probar voz
              </button>
            </div>
          </details>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    this.attachControlListeners();
    this.loadVoicesForProvider(ar.tts?.getProvider() || 'browser');

    // Restaurar preferencias de binaural y volumen desde localStorage
    const savedBinaural = localStorage.getItem('audioreader-binaural') || '';
    const savedVolume = localStorage.getItem('audioreader-volume') || '30';

    const binauralSelect = document.getElementById('audioreader-binaural-select');
    const volumeSlider = document.getElementById('audioreader-ambient-volume');
    const volumeLabel = document.getElementById('audioreader-ambient-volume-label');

    if (binauralSelect && savedBinaural) binauralSelect.value = savedBinaural;
    if (volumeSlider) {
      volumeSlider.value = savedVolume;
      if (volumeLabel) volumeLabel.textContent = `${savedVolume}%`;
    }

    // Los sonidos ambiente se restauran en attachAmbientBinauralListeners()
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

    // Calcular offset para no tapar footer-nav de capítulos
    const footerNav = document.querySelector('.footer-nav');
    const footerNavHeight = footerNav ? footerNav.offsetHeight : 0;
    const bottomOffset = footerNavHeight > 0 ? `${footerNavHeight}px` : '0px';

    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'audioreader-overlay';
    overlay.className = 'fixed inset-0 bg-black/50 z-40 hidden';
    document.body.appendChild(overlay);

    // Bottom sheet
    const bottomSheet = document.createElement('div');
    bottomSheet.id = 'audioreader-bottom-sheet';
    bottomSheet.className = 'fixed inset-x-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-2xl transform transition-transform duration-300';
    bottomSheet.style.bottom = bottomOffset;
    bottomSheet.style.paddingBottom = '16px';

    bottomSheet.innerHTML = `
      <div id="audioreader-controls">
        <!-- Drag handle - área táctil grande, evita selección de texto -->
        <div class="audioreader-drag-handle w-full h-8 flex items-center justify-center cursor-grab select-none touch-none" style="user-select: none; -webkit-user-select: none; touch-action: none;">
          <div class="w-16 h-1.5 bg-white/50 rounded-full"></div>
        </div>

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

    // Voice system controls
    this.attachVoiceSystemListeners();

    // UX Enhancements listeners
    this.attachUXEnhancementsListeners();
  }

  /**
   * Attach listeners for UX enhancements
   */
  attachUXEnhancementsListeners() {
    const ar = this.audioReader;

    // Speed slider
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        const rate = rates[parseInt(e.target.value)];
        if (speedValue) speedValue.textContent = `${rate}x`;
        ar.tts?.setRate(rate);
      });
    }

    // Night mode toggle
    const nightModeToggle = document.getElementById('night-mode-toggle');
    if (nightModeToggle) {
      nightModeToggle.addEventListener('click', () => {
        if (ar.uxEnhancements) {
          const newState = !ar.uxEnhancements.isNightModeActive;
          ar.uxEnhancements.toggleNightMode(newState);
          nightModeToggle.className = `px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${newState ? 'bg-indigo-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`;
          nightModeToggle.querySelector('span:last-child').textContent = newState ? 'ON' : 'OFF';
        }
      });
    }

    // Sleep timer quick buttons
    document.querySelectorAll('.sleep-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const minutes = parseInt(btn.dataset.minutes);
        if (ar.uxEnhancements) {
          ar.uxEnhancements.startSleepTimer(minutes);
        }
      });
    });

    const sleepCancelBtn = document.getElementById('sleep-cancel-btn');
    if (sleepCancelBtn) {
      sleepCancelBtn.addEventListener('click', () => {
        if (ar.uxEnhancements) {
          ar.uxEnhancements.cancelSleepTimer();
        }
      });
    }

    // Bookmarks
    const bookmarkSaveBtn = document.getElementById('bookmark-save');
    const bookmarkRestoreBtn = document.getElementById('bookmark-restore');

    if (bookmarkSaveBtn) {
      bookmarkSaveBtn.addEventListener('click', () => {
        if (ar.uxEnhancements) {
          ar.uxEnhancements.saveBookmark();
        }
      });
    }

    if (bookmarkRestoreBtn) {
      bookmarkRestoreBtn.addEventListener('click', () => {
        if (ar.uxEnhancements?.restoreBookmark()) {
          this.updateUI();
        }
      });
    }
  }

  /**
   * Attach listeners for ambient and binaural sound controls
   */
  attachAmbientBinauralListeners() {
    const ambientGrid = document.getElementById('audioreader-ambient-grid');
    const stopAllBtn = document.getElementById('audioreader-stop-all-ambient');
    const binauralSelect = document.getElementById('audioreader-binaural-select');
    const volumeSlider = document.getElementById('audioreader-ambient-volume');
    const volumeLabel = document.getElementById('audioreader-ambient-volume-label');

    // Multi-select ambient toggle buttons (con debounce)
    if (ambientGrid) {
      let isProcessing = false;

      ambientGrid.querySelectorAll('.ambient-toggle').forEach(btn => {
        btn.addEventListener('click', async () => {
          // Debounce: evitar clicks rápidos
          if (isProcessing) return;
          isProcessing = true;

          const soundName = btn.dataset.sound;

          if (!window.audioMixer) {
            isProcessing = false;
            return;
          }

          try {
            // Actualizar UI inmediatamente para feedback visual
            const wasActive = btn.classList.contains('bg-purple-600');
            if (wasActive) {
              btn.classList.remove('bg-purple-600', 'ring-2', 'ring-purple-400');
              btn.classList.add('bg-slate-700');
            } else {
              btn.classList.remove('bg-slate-700');
              btn.classList.add('bg-purple-600', 'ring-2', 'ring-purple-400');
            }

            // Ejecutar toggle en audioMixer
            await window.audioMixer.toggleAmbientSound(soundName);

            // Guardar en localStorage
            this.saveActiveAmbients();
          } catch (err) {
            logger.error('Error toggling ambient:', err);
          } finally {
            // Permitir nuevo click después de 300ms
            setTimeout(() => { isProcessing = false; }, 300);
          }
        });
      });

      // Restaurar estado guardado
      this.restoreActiveAmbients();
    }

    // Stop all ambient sounds
    if (stopAllBtn) {
      stopAllBtn.addEventListener('click', async () => {
        if (window.audioMixer) {
          await window.audioMixer.stopAmbient();
          // Reset all buttons
          ambientGrid?.querySelectorAll('.ambient-toggle').forEach(btn => {
            btn.classList.remove('bg-purple-600', 'ring-2', 'ring-purple-400');
            btn.classList.add('bg-slate-700');
          });
          localStorage.removeItem('audioreader-active-ambients');
          window.toast?.info('Todos los ambientes detenidos');
        }
      });
    }

    // Binaural sound selection (solo audioMixer, NO binauralModal - ese es para koans)
    if (binauralSelect) {
      binauralSelect.addEventListener('change', async (e) => {
        const value = e.target.value;
        logger.log('🧠 Binaural seleccionado:', value, 'audioMixer:', !!window.audioMixer);

        // Guardar preferencia en localStorage
        try {
          if (value) {
            localStorage.setItem('audioreader-binaural', value);
          } else {
            localStorage.removeItem('audioreader-binaural');
          }
        } catch (err) {}

        if (window.audioMixer) {
          if (value) {
            try {
              await window.audioMixer.playBinaural(value);
              window.toast?.success('Binaural activado');
            } catch (err) {
              logger.error('Error reproduciendo binaural:', err);
              window.toast?.error('Error al reproducir binaural');
            }
          } else {
            window.audioMixer.stopBinaural();
          }
        } else {
          window.toast?.warning('AudioMixer no disponible');
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

        // Guardar en localStorage
        try {
          localStorage.setItem('audioreader-volume', volume.toString());
        } catch (err) {}

        if (window.audioMixer) {
          window.audioMixer.setAmbientVolume(volume / 100);
          window.audioMixer.setBinauralVolume(volume / 100);
        }
      });
    }
  }

  /**
   * Attach listeners for voice system controls
   */
  attachVoiceSystemListeners() {
    const ar = this.audioReader;
    const providerSelect = document.getElementById('audioreader-tts-provider');
    const voiceSelect = document.getElementById('audioreader-voice-select');
    const testVoiceBtn = document.getElementById('audioreader-test-voice');

    // TTS Provider change
    if (providerSelect) {
      providerSelect.addEventListener('change', async (e) => {
        const provider = e.target.value;
        logger.log('🎤 Cambiando proveedor TTS a:', provider);

        if (ar.tts) {
          ar.tts.setProvider(provider);
          await this.loadVoicesForProvider(provider);
          window.toast?.success(`Proveedor: ${provider === 'browser' ? 'Web Speech' : 'Nativo'}`);
        }
      });
    }

    // Voice selection change
    if (voiceSelect) {
      voiceSelect.addEventListener('change', (e) => {
        const voiceURI = e.target.value;
        logger.log('🎤 Voz seleccionada:', voiceURI);

        if (voiceURI && ar.tts) {
          ar.tts.setVoice(voiceURI);
          window.toast?.success('Voz actualizada');
        }
      });
    }

    // Test voice button
    if (testVoiceBtn) {
      testVoiceBtn.addEventListener('click', async () => {
        const testText = 'Esta es una prueba del sistema de voz.';
        logger.log('🔊 Probando voz...');

        if (ar.tts) {
          try {
            await ar.tts.ensureInitialized();
            ar.tts.speak(testText, 0, {
              onEnd: () => logger.log('✅ Prueba de voz completada'),
              onError: (err) => logger.error('❌ Error en prueba de voz:', err)
            });
          } catch (err) {
            logger.error('Error al probar voz:', err);
            window.toast?.error('Error al probar voz');
          }
        }
      });
    }
  }

  /**
   * Load voices for the current TTS provider
   */
  async loadVoicesForProvider(provider) {
    const voiceSelect = document.getElementById('audioreader-voice-select');
    if (!voiceSelect) return;

    voiceSelect.innerHTML = '<option value="">Cargando voces...</option>';

    try {
      if (provider === 'browser') {
        // Web Speech API voices
        voiceSelect.disabled = false;
        voiceSelect.title = '';
        const voices = await this.audioReader.tts?.getAvailableVoices() || [];
        const spanishVoices = voices.filter(v => v.lang && v.lang.startsWith('es'));

        if (spanishVoices.length > 0) {
          voiceSelect.innerHTML = spanishVoices
            .map(v => `<option value="${v.voiceURI}">${v.name}</option>`)
            .join('');
        } else {
          voiceSelect.innerHTML = '<option value="">No hay voces en español</option>';
        }
      } else if (provider === 'native') {
        // Native TTS usa la voz del sistema Android
        voiceSelect.innerHTML = `
          <option value="es-ES">🤖 Voz del sistema Android</option>
        `;
        voiceSelect.disabled = true;
        voiceSelect.title = 'La voz se configura en Ajustes de Android > Accesibilidad > Texto a voz';
      }

      // Restaurar voz guardada si existe
      const savedVoice = localStorage.getItem('preferred-tts-voice');
      if (savedVoice) {
        const option = voiceSelect.querySelector(`option[value="${savedVoice}"]`);
        if (option) {
          voiceSelect.value = savedVoice;
        }
      }
    } catch (err) {
      logger.error('Error cargando voces:', err);
      voiceSelect.innerHTML = '<option value="">Error cargando voces</option>';
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

  // Save active ambient sounds to localStorage
  saveActiveAmbients() {
    if (window.audioMixer) {
      const active = window.audioMixer.getActiveAmbients();
      localStorage.setItem('audioreader-active-ambients', JSON.stringify(active));
    }
  }

  // Restore active ambient sounds from localStorage
  async restoreActiveAmbients() {
    try {
      const saved = localStorage.getItem('audioreader-active-ambients');
      if (!saved) return;

      const ambients = JSON.parse(saved);
      if (!Array.isArray(ambients) || ambients.length === 0) return;

      const grid = document.getElementById('audioreader-ambient-grid');
      if (!grid) return;

      const ar = this.audioReader;

      // 🔧 FIX v2.9.378: NO restaurar volumen si está en pausa
      if (window.audioMixer && !ar?.isPaused) {
        const savedVolume = localStorage.getItem('audioreader-volume');
        const volume = savedVolume ? parseInt(savedVolume) / 100 : 0.3;
        window.audioMixer.setAmbientVolume(volume);
      }

      // Restaurar sonidos y UI (solo añadir si no están ya activos)
      for (const soundName of ambients) {
        if (window.audioMixer && !window.audioMixer.channels?.ambient?.sources?.has(soundName)) {
          await window.audioMixer.addAmbient(soundName);
          // Si está pausado, silenciar inmediatamente después de añadir
          if (ar?.isPaused) {
            window.audioMixer.setAmbientVolume(0);
          }
        }
        const btn = grid.querySelector(`[data-sound="${soundName}"]`);
        if (btn) {
          btn.classList.remove('bg-slate-700');
          btn.classList.add('bg-purple-600', 'ring-2', 'ring-purple-400');
        }
      }
    } catch (err) {
      logger.error('Error restaurando ambientes:', err);
    }
  }

  // ==========================================================================
  // UI UPDATES
  // ==========================================================================

  async updateUI() {
    // Guardar valores de binaural/voice antes de re-renderizar
    const savedBinaural = document.getElementById('audioreader-binaural-select')?.value || '';
    const savedVolume = document.getElementById('audioreader-ambient-volume')?.value || '30';
    const savedProvider = document.getElementById('audioreader-tts-provider')?.value || '';
    const savedVoice = document.getElementById('audioreader-voice-select')?.value || '';

    await this.render();

    // Restaurar valores después de re-renderizar
    const binauralSelect = document.getElementById('audioreader-binaural-select');
    const volumeSlider = document.getElementById('audioreader-ambient-volume');
    const volumeLabel = document.getElementById('audioreader-ambient-volume-label');
    const providerSelect = document.getElementById('audioreader-tts-provider');
    const voiceSelect = document.getElementById('audioreader-voice-select');

    // Los ambientes se restauran automáticamente en restoreActiveAmbients()
    if (false) { // Legacy code removed
    }
    if (binauralSelect && savedBinaural) {
      binauralSelect.value = savedBinaural;
    }
    if (volumeSlider) {
      volumeSlider.value = savedVolume;
      if (volumeLabel) {
        volumeLabel.textContent = `${savedVolume}%`;
      }
    }
    if (providerSelect && savedProvider) {
      providerSelect.value = savedProvider;
    }
    if (voiceSelect && savedVoice) {
      voiceSelect.value = savedVoice;
    }

    this.updateHeaderAudioIcons();
    this.updateBottomNavAudioButton();

    // Actualizar indicadores de onda
    const ar = this.audioReader;
    if (ar.uxEnhancements) {
      ar.uxEnhancements.updateWaveState(ar.isPlaying && !ar.isPaused);
      ar.uxEnhancements.updateFloatingPlayer();
    }
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
    if (this.audioReader?.meditationModule) {
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

    // Guard clause: si audioReader fue destruido, salir
    if (!ar) return;

    // Usar headphones (SVG inline) en lugar de audio (Lucide) para evitar problemas de init
    const playingIcon = Icons?.pause?.(20) || '⏸';
    const stoppedIcon = Icons?.headphones?.(20) || '🎧';

    // Buscar iconos por ID específico (usados en book-reader-header.js)
    const iconIds = ['audio-icon-mobile', 'audio-icon-tablet', 'audio-icon-desktop'];

    iconIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = (ar.isPlaying && !ar.isPaused) ? playingIcon : stoppedIcon;
      }
    });

    // También buscar elementos con data-audio-icon por compatibilidad
    const iconElements = document.querySelectorAll('[data-audio-icon]');
    iconElements.forEach(el => {
      el.innerHTML = (ar.isPlaying && !ar.isPaused) ? playingIcon : stoppedIcon;
    });
  }

  updateBottomNavAudioButton() {
    const ar = this.audioReader;

    // Guard clause: si audioReader fue destruido, salir
    if (!ar) return;

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
