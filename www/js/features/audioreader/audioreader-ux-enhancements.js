// ============================================================================
// AUDIOREADER UX ENHANCEMENTS - Mejoras de experiencia de usuario
// ============================================================================
// v2.9.377: Mejoras UX completas para el reproductor de audio

class AudioReaderUXEnhancements {
  constructor(audioReader) {
    this.audioReader = audioReader;
    this.isNightModeActive = false;
    this.swipeStartX = 0;
    this.swipeStartY = 0;
    this.waveAnimationFrame = null;
    this.floatingPlayerVisible = false;
    this.lastScrollY = 0;
    this.scrollThreshold = 200;
  }

  // ==========================================================================
  // 1. MINI-PLAYER FLOTANTE AL HACER SCROLL
  // ==========================================================================

  initFloatingPlayer() {
    // Crear el mini-player flotante
    if (document.getElementById('audioreader-floating-player')) return;

    const floating = document.createElement('div');
    floating.id = 'audioreader-floating-player';
    floating.className = 'fixed top-0 left-0 right-0 z-50 transform -translate-y-full transition-transform duration-300';
    floating.innerHTML = `
      <div class="bg-slate-900/95 backdrop-blur-xl border-b border-white/10 shadow-lg safe-area-top">
        <div class="flex items-center gap-3 px-4 py-2">
          <!-- Waveform indicator -->
          <div id="floating-wave" class="flex items-end gap-0.5 h-6 w-8">
            <span class="wave-bar w-1 bg-cyan-400 rounded-full"></span>
            <span class="wave-bar w-1 bg-cyan-400 rounded-full"></span>
            <span class="wave-bar w-1 bg-cyan-400 rounded-full"></span>
            <span class="wave-bar w-1 bg-cyan-400 rounded-full"></span>
            <span class="wave-bar w-1 bg-cyan-400 rounded-full"></span>
          </div>

          <!-- Progress mini -->
          <div class="flex-1">
            <div class="h-1 bg-slate-700 rounded-full overflow-hidden">
              <div id="floating-progress" class="h-full bg-cyan-500 transition-all" style="width: 0%"></div>
            </div>
            <p id="floating-info" class="text-xs text-slate-400 mt-0.5 truncate">Reproduciendo...</p>
          </div>

          <!-- Controls -->
          <div class="flex items-center gap-1">
            <button id="floating-prev" class="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white">
              ${Icons?.skipBack?.(16) || '⏮'}
            </button>
            <button id="floating-play-pause" class="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white">
              ${Icons?.pause?.(20) || '⏸'}
            </button>
            <button id="floating-next" class="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white">
              ${Icons?.skipForward?.(16) || '⏭'}
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(floating);

    // Listeners
    floating.querySelector('#floating-prev')?.addEventListener('click', () => this.audioReader.playback?.previous());
    floating.querySelector('#floating-next')?.addEventListener('click', () => this.audioReader.playback?.next());
    floating.querySelector('#floating-play-pause')?.addEventListener('click', async () => {
      if (this.audioReader.isPaused) {
        await this.audioReader.playback?.resume();
      } else {
        await this.audioReader.playback?.pause();
      }
    });

    // Scroll listener
    this.handleScroll = this.handleScroll.bind(this);
    window.addEventListener('scroll', this.handleScroll, { passive: true });
  }

  handleScroll() {
    const ar = this.audioReader;
    if (!ar.isPlaying) {
      this.hideFloatingPlayer();
      return;
    }

    const currentScrollY = window.scrollY;
    const floating = document.getElementById('audioreader-floating-player');
    const mainControls = document.getElementById('audioreader-controls');

    if (!floating) return;

    // Mostrar floating si scrolleamos hacia arriba y el panel principal no es visible
    const mainControlsRect = mainControls?.getBoundingClientRect();
    const isMainControlsVisible = mainControlsRect && mainControlsRect.top < window.innerHeight;

    if (currentScrollY > this.scrollThreshold && !isMainControlsVisible) {
      this.showFloatingPlayer();
    } else {
      this.hideFloatingPlayer();
    }

    this.lastScrollY = currentScrollY;
  }

  showFloatingPlayer() {
    const floating = document.getElementById('audioreader-floating-player');
    if (floating && !this.floatingPlayerVisible) {
      floating.classList.remove('-translate-y-full');
      this.floatingPlayerVisible = true;
      this.updateFloatingPlayer();
    }
  }

  hideFloatingPlayer() {
    const floating = document.getElementById('audioreader-floating-player');
    if (floating && this.floatingPlayerVisible) {
      floating.classList.add('-translate-y-full');
      this.floatingPlayerVisible = false;
    }
  }

  updateFloatingPlayer() {
    const ar = this.audioReader;
    const paragraphs = ar.content?.getParagraphs() || [];
    const progress = paragraphs.length > 0 ? (ar.currentParagraphIndex + 1) / paragraphs.length * 100 : 0;

    const progressBar = document.getElementById('floating-progress');
    const info = document.getElementById('floating-info');
    const playPauseBtn = document.getElementById('floating-play-pause');

    if (progressBar) progressBar.style.width = `${progress}%`;
    if (info) info.textContent = `${ar.currentParagraphIndex + 1}/${paragraphs.length} párrafos`;
    if (playPauseBtn) {
      playPauseBtn.innerHTML = ar.isPaused
        ? (Icons?.play?.(20) || '▶')
        : (Icons?.pause?.(20) || '⏸');
      playPauseBtn.className = `w-10 h-10 rounded-full flex items-center justify-center text-white ${ar.isPaused ? 'bg-cyan-500' : 'bg-orange-500'}`;
    }
  }

  // ==========================================================================
  // 2. INDICADOR DE ONDA/ACTIVIDAD
  // ==========================================================================

  initWaveIndicator() {
    // Añadir estilos CSS para la animación de onda
    if (!document.getElementById('wave-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'wave-animation-styles';
      style.textContent = `
        @keyframes waveAnimation {
          0%, 100% { height: 4px; }
          50% { height: 100%; }
        }
        .wave-bar {
          animation: waveAnimation 0.5s ease-in-out infinite;
          min-height: 4px;
        }
        .wave-bar:nth-child(1) { animation-delay: 0s; }
        .wave-bar:nth-child(2) { animation-delay: 0.1s; }
        .wave-bar:nth-child(3) { animation-delay: 0.2s; }
        .wave-bar:nth-child(4) { animation-delay: 0.15s; }
        .wave-bar:nth-child(5) { animation-delay: 0.05s; }
        .wave-paused .wave-bar {
          animation-play-state: paused;
          height: 4px !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  updateWaveState(isPlaying) {
    const waveContainers = document.querySelectorAll('#floating-wave, #main-wave');
    waveContainers.forEach(container => {
      if (container) {
        container.classList.toggle('wave-paused', !isPlaying);
      }
    });
  }

  // ==========================================================================
  // 3. GESTOS SWIPE PARA SALTAR PÁRRAFOS
  // ==========================================================================

  initSwipeGestures() {
    const chapterContent = document.querySelector('.chapter-content');
    if (!chapterContent) return;

    chapterContent.addEventListener('touchstart', (e) => {
      this.swipeStartX = e.touches[0].clientX;
      this.swipeStartY = e.touches[0].clientY;
    }, { passive: true });

    chapterContent.addEventListener('touchend', (e) => {
      if (!this.audioReader.isPlaying) return;

      const deltaX = e.changedTouches[0].clientX - this.swipeStartX;
      const deltaY = e.changedTouches[0].clientY - this.swipeStartY;

      // Solo detectar swipe horizontal significativo
      if (Math.abs(deltaX) > 80 && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
        if (deltaX > 0) {
          // Swipe derecha -> anterior
          this.audioReader.playback?.previous();
          this.showSwipeFeedback('⏮ Anterior');
        } else {
          // Swipe izquierda -> siguiente
          this.audioReader.playback?.next();
          this.showSwipeFeedback('Siguiente ⏭');
        }
      }
    }, { passive: true });
  }

  showSwipeFeedback(text) {
    const existing = document.getElementById('swipe-feedback');
    if (existing) existing.remove();

    const feedback = document.createElement('div');
    feedback.id = 'swipe-feedback';
    feedback.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-full text-lg font-medium z-[100] pointer-events-none';
    feedback.textContent = text;
    document.body.appendChild(feedback);

    setTimeout(() => feedback.remove(), 800);
  }

  // ==========================================================================
  // 4. BARRA DE PROGRESO MEJORADA
  // ==========================================================================

  renderEnhancedProgressBar(container, progress, currentIndex, total, timeRemaining) {
    const progressHTML = `
      <div class="audioreader-enhanced-progress px-4 py-3">
        <!-- Progress bar táctil -->
        <div class="relative h-2 bg-slate-800 rounded-full overflow-hidden cursor-pointer group" id="progress-bar-touch">
          <div class="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300" style="width: ${progress}%"></div>
          <div class="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" style="left: calc(${progress}% - 8px)"></div>
        </div>

        <!-- Info row -->
        <div class="flex justify-between items-center mt-2 text-xs">
          <div class="flex items-center gap-2 text-slate-400">
            <span class="font-mono">${currentIndex + 1}</span>
            <div class="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full bg-cyan-500/50" style="width: ${progress}%"></div>
            </div>
            <span class="font-mono">${total}</span>
          </div>
          <div class="flex items-center gap-1 text-cyan-400">
            ${Icons?.clock?.(12) || '⏱'}
            <span>${timeRemaining}</span>
          </div>
        </div>
      </div>
    `;
    return progressHTML;
  }

  initProgressBarTouch() {
    const progressBar = document.getElementById('progress-bar-touch');
    if (!progressBar) return;

    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const paragraphs = this.audioReader.content?.getParagraphs() || [];
      const newIndex = Math.floor(percent * paragraphs.length);

      if (newIndex >= 0 && newIndex < paragraphs.length) {
        this.audioReader.currentParagraphIndex = newIndex;
        if (this.audioReader.isPlaying && !this.audioReader.isPaused) {
          this.audioReader.playback?.speakCurrentParagraph?.();
        }
        this.audioReader.ui?.updateUI();
      }
    });
  }

  // ==========================================================================
  // 5. SLEEP TIMER MÁS ACCESIBLE
  // ==========================================================================

  renderSleepTimerQuickAccess() {
    return `
      <div class="flex items-center gap-2 px-4 py-2 border-t border-white/5">
        <span class="text-xs text-slate-500">💤 Apagar en:</span>
        <div class="flex gap-1">
          <button class="sleep-quick-btn px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300" data-minutes="5">5m</button>
          <button class="sleep-quick-btn px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300" data-minutes="15">15m</button>
          <button class="sleep-quick-btn px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300" data-minutes="30">30m</button>
          <button class="sleep-quick-btn px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300" data-minutes="60">1h</button>
          <button id="sleep-cancel-btn" class="px-2 py-1 text-xs rounded bg-red-900/50 hover:bg-red-800 text-red-400 hidden">✕</button>
        </div>
        <span id="sleep-countdown" class="text-xs text-amber-400 ml-auto hidden"></span>
      </div>
    `;
  }

  initSleepTimerQuickAccess() {
    document.querySelectorAll('.sleep-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const minutes = parseInt(btn.dataset.minutes);
        this.startSleepTimer(minutes);
      });
    });

    document.getElementById('sleep-cancel-btn')?.addEventListener('click', () => {
      this.cancelSleepTimer();
    });
  }

  startSleepTimer(minutes) {
    this.cancelSleepTimer();

    const endTime = Date.now() + minutes * 60 * 1000;
    this.sleepTimerEnd = endTime;

    const cancelBtn = document.getElementById('sleep-cancel-btn');
    const countdown = document.getElementById('sleep-countdown');

    if (cancelBtn) cancelBtn.classList.remove('hidden');
    if (countdown) countdown.classList.remove('hidden');

    // Marcar botón activo
    document.querySelectorAll('.sleep-quick-btn').forEach(b => {
      b.classList.remove('bg-amber-600', 'text-white');
      b.classList.add('bg-slate-800', 'text-slate-300');
    });
    const activeBtn = document.querySelector(`.sleep-quick-btn[data-minutes="${minutes}"]`);
    if (activeBtn) {
      activeBtn.classList.remove('bg-slate-800', 'text-slate-300');
      activeBtn.classList.add('bg-amber-600', 'text-white');
    }

    this.sleepTimerInterval = setInterval(() => {
      const remaining = Math.max(0, this.sleepTimerEnd - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);

      if (countdown) countdown.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

      if (remaining <= 0) {
        this.audioReader.playback?.stop();
        this.cancelSleepTimer();
        window.toast?.info('Sleep timer: reproducción detenida');
      }
    }, 1000);
  }

  cancelSleepTimer() {
    if (this.sleepTimerInterval) {
      clearInterval(this.sleepTimerInterval);
      this.sleepTimerInterval = null;
    }
    this.sleepTimerEnd = null;

    const cancelBtn = document.getElementById('sleep-cancel-btn');
    const countdown = document.getElementById('sleep-countdown');

    if (cancelBtn) cancelBtn.classList.add('hidden');
    if (countdown) {
      countdown.classList.add('hidden');
      countdown.textContent = '';
    }

    document.querySelectorAll('.sleep-quick-btn').forEach(b => {
      b.classList.remove('bg-amber-600', 'text-white');
      b.classList.add('bg-slate-800', 'text-slate-300');
    });
  }

  // ==========================================================================
  // 6. SLIDER DE VELOCIDAD MÁS INTUITIVO
  // ==========================================================================

  renderSpeedSlider(currentRate) {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const currentIndex = rates.indexOf(currentRate) !== -1 ? rates.indexOf(currentRate) : 2;

    return `
      <div class="speed-slider-container">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs text-slate-500">Velocidad</span>
          <span id="speed-value" class="text-sm font-mono text-cyan-400">${currentRate}x</span>
        </div>
        <input type="range" id="speed-slider"
               min="0" max="6" value="${currentIndex}"
               class="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
               list="speed-marks">
        <div class="flex justify-between text-[10px] text-slate-600 mt-1">
          <span>0.5x</span>
          <span>1x</span>
          <span>2x</span>
        </div>
      </div>
    `;
  }

  initSpeedSlider() {
    const slider = document.getElementById('speed-slider');
    const valueDisplay = document.getElementById('speed-value');
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    if (slider) {
      slider.addEventListener('input', (e) => {
        const rate = rates[parseInt(e.target.value)];
        if (valueDisplay) valueDisplay.textContent = `${rate}x`;
        this.audioReader.tts?.setRate(rate);
      });
    }
  }

  // ==========================================================================
  // 7. MODO NOCHE - OSCURECER PANTALLA
  // ==========================================================================

  initNightMode() {
    // Crear overlay de modo noche
    if (!document.getElementById('night-mode-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'night-mode-overlay';
      overlay.className = 'fixed inset-0 bg-black/0 pointer-events-none z-40 transition-all duration-500';
      document.body.appendChild(overlay);
    }
  }

  toggleNightMode(enabled) {
    this.isNightModeActive = enabled;
    const overlay = document.getElementById('night-mode-overlay');

    if (overlay) {
      overlay.style.backgroundColor = enabled ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0)';
    }

    // Guardar preferencia
    localStorage.setItem('audioreader-night-mode', enabled ? 'true' : 'false');
  }

  renderNightModeToggle() {
    const isEnabled = localStorage.getItem('audioreader-night-mode') === 'true';
    return `
      <button id="night-mode-toggle"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${isEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}">
        <span>🌙</span>
        <span>Modo noche</span>
        <span class="text-xs">${isEnabled ? 'ON' : 'OFF'}</span>
      </button>
    `;
  }

  initNightModeToggle() {
    const toggle = document.getElementById('night-mode-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const newState = !this.isNightModeActive;
        this.toggleNightMode(newState);

        // Actualizar UI del botón
        toggle.className = `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${newState ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`;
        toggle.querySelector('span:last-child').textContent = newState ? 'ON' : 'OFF';
      });
    }

    // Aplicar estado guardado
    if (localStorage.getItem('audioreader-night-mode') === 'true') {
      this.toggleNightMode(true);
    }
  }

  // ==========================================================================
  // 8. BOOKMARKS - GUARDAR POSICIÓN
  // ==========================================================================

  saveBookmark() {
    const ar = this.audioReader;
    const bookId = ar.bookEngine?.currentBook?.id;
    const chapterId = ar.bookEngine?.currentChapter?.id;

    if (!bookId || !chapterId) return;

    const bookmark = {
      bookId,
      chapterId,
      paragraphIndex: ar.currentParagraphIndex,
      timestamp: Date.now(),
      chapterTitle: ar.bookEngine?.currentChapter?.title || ''
    };

    // Guardar en localStorage
    const bookmarks = this.getBookmarks();
    const key = `${bookId}-${chapterId}`;
    bookmarks[key] = bookmark;
    localStorage.setItem('audioreader-bookmarks', JSON.stringify(bookmarks));

    window.toast?.success('📖 Posición guardada');
    return bookmark;
  }

  getBookmarks() {
    try {
      return JSON.parse(localStorage.getItem('audioreader-bookmarks') || '{}');
    } catch {
      return {};
    }
  }

  loadBookmark(bookId, chapterId) {
    const bookmarks = this.getBookmarks();
    const key = `${bookId}-${chapterId}`;
    return bookmarks[key] || null;
  }

  hasBookmark() {
    const ar = this.audioReader;
    const bookId = ar.bookEngine?.currentBook?.id;
    const chapterId = ar.bookEngine?.currentChapter?.id;

    if (!bookId || !chapterId) return false;

    return !!this.loadBookmark(bookId, chapterId);
  }

  restoreBookmark() {
    const ar = this.audioReader;
    const bookId = ar.bookEngine?.currentBook?.id;
    const chapterId = ar.bookEngine?.currentChapter?.id;

    const bookmark = this.loadBookmark(bookId, chapterId);
    if (bookmark) {
      ar.currentParagraphIndex = bookmark.paragraphIndex;
      window.toast?.info(`📖 Continuando desde párrafo ${bookmark.paragraphIndex + 1}`);
      return true;
    }
    return false;
  }

  renderBookmarkButton() {
    const hasBookmark = this.hasBookmark();
    return `
      <div class="flex gap-2">
        <button id="bookmark-save"
                class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors">
          <span>📖</span>
          <span>Guardar posición</span>
        </button>
        ${hasBookmark ? `
          <button id="bookmark-restore"
                  class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm transition-colors">
            <span>↩️</span>
            <span>Continuar</span>
          </button>
        ` : ''}
      </div>
    `;
  }

  initBookmarkButtons() {
    document.getElementById('bookmark-save')?.addEventListener('click', () => {
      this.saveBookmark();
    });

    document.getElementById('bookmark-restore')?.addEventListener('click', () => {
      if (this.restoreBookmark()) {
        this.audioReader.ui?.updateUI();
      }
    });
  }

  // ==========================================================================
  // INICIALIZACIÓN GLOBAL
  // ==========================================================================

  init() {
    this.initWaveIndicator();
    this.initNightMode();
    this.initFloatingPlayer();
    this.initSwipeGestures();
  }

  destroy() {
    window.removeEventListener('scroll', this.handleScroll);
    this.cancelSleepTimer();
    this.toggleNightMode(false);

    document.getElementById('audioreader-floating-player')?.remove();
    document.getElementById('night-mode-overlay')?.remove();
    document.getElementById('wave-animation-styles')?.remove();
  }
}

// Exportar globalmente
window.AudioReaderUXEnhancements = AudioReaderUXEnhancements;
