/**
 * Practice Timer - UI Module
 * Gestiona el modal y renderizado de la UI
 * @version 2.9.390 - Modularizado
 */

class PracticeTimerUI {
  constructor(practiceTimer) {
    this.practiceTimer = practiceTimer;
  }

  /**
   * Inicializa el modulo de UI
   */
  init() {
    this.createModal();
  }

  /**
   * Crea el modal del timer
   */
  createModal() {
    const practiceTimer = this.practiceTimer;

    // Abortar listeners anteriores antes de recrear
    if (practiceTimer._abortController) {
      practiceTimer._abortController.abort();
    }
    practiceTimer._abortController = new AbortController();

    const existingModal = document.getElementById('practice-timer-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modalHTML = `
      <div id="practice-timer-modal" class="fixed inset-0 z-[10000] hidden" role="dialog" aria-modal="true">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/90"></div>

        <!-- Modal Container -->
        <div class="relative h-full flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-slate-700/50">
            <div class="flex items-center gap-3">
              <span class="text-2xl" id="timer-practice-icon">🧘</span>
              <div>
                <h2 id="timer-practice-title" class="text-lg font-bold text-white">Practica</h2>
                <p id="timer-practice-duration" class="text-sm text-gray-400">15 min</p>
              </div>
            </div>
            <button id="timer-close" class="p-2 rounded-lg hover:bg-slate-700 transition-colors" aria-label="Cerrar">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Main Content -->
          <div class="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
            <!-- Timer Circle -->
            <div class="relative mb-8">
              <svg class="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
                <!-- Background circle -->
                <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" stroke-width="4"/>
                <!-- Progress circle -->
                <circle id="timer-progress-circle" cx="50" cy="50" r="45" fill="none" stroke="url(#timer-gradient)" stroke-width="4" stroke-linecap="round"
                        stroke-dasharray="283" stroke-dashoffset="0"/>
                <defs>
                  <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#8b5cf6"/>
                    <stop offset="100%" style="stop-color:#a855f7"/>
                  </linearGradient>
                </defs>
              </svg>
              <!-- Time Display -->
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span id="timer-display" class="text-5xl font-bold text-white font-mono">00:00</span>
                <span id="timer-step-label" class="text-sm text-gray-400 mt-2">Paso 1 de 4</span>
              </div>
            </div>

            <!-- Current Step Instructions -->
            <div id="timer-current-step" class="w-full max-w-md text-center mb-8">
              <p class="text-xl text-white leading-relaxed">
                Instruccion del paso actual...
              </p>
            </div>

            <!-- Controls -->
            <div class="flex items-center gap-4">
              <button id="timer-prev" class="p-3 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors" aria-label="Paso anterior">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>

              <button id="timer-play-pause" class="p-5 rounded-full bg-violet-600 hover:bg-violet-500 transition-colors" aria-label="Pausar/Reanudar">
                <svg id="timer-play-icon" class="w-8 h-8 text-white hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <svg id="timer-pause-icon" class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </button>

              <button id="timer-next" class="p-3 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors" aria-label="Siguiente paso">
                <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>

            <!-- Audio Controls -->
            <div class="flex flex-wrap items-center justify-center gap-3 mt-6">
              <!-- Boton de Narracion TTS -->
              <button id="timer-audio-toggle" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors" aria-label="Activar/Desactivar narracion">
                <svg id="timer-audio-icon-off" class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
                </svg>
                <svg id="timer-audio-icon-on" class="w-5 h-5 text-violet-400 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                </svg>
                <span id="timer-audio-label" class="text-sm text-gray-400">Narracion</span>
              </button>

              <!-- Boton de Sonido Ambiente -->
              <button id="timer-ambient-toggle" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors" aria-label="Activar/Desactivar sonido ambiente">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
                </svg>
                <span class="ambient-label text-sm text-gray-400">Ambiente</span>
              </button>

              <button id="timer-read-step" class="hidden items-center gap-2 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 transition-colors" aria-label="Leer paso actual">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                </svg>
                <span class="text-sm text-white">Leer</span>
              </button>
            </div>

            <!-- Panel de opciones de audio (expandible) -->
            <div class="mt-4 space-y-3">
              <!-- Velocidad TTS -->
              <div id="timer-audio-speed" class="hidden items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700">
                <span class="text-xs text-gray-500">Velocidad:</span>
                <button class="speed-btn px-2 py-1 text-xs rounded bg-slate-700 hover:bg-violet-600 transition-colors" data-speed="0.7">Lenta</button>
                <button class="speed-btn px-2 py-1 text-xs rounded bg-violet-600" data-speed="0.9">Normal</button>
                <button class="speed-btn px-2 py-1 text-xs rounded bg-slate-700 hover:bg-violet-600 transition-colors" data-speed="1.1">Rapida</button>
              </div>

              <!-- Panel de Sonido Ambiente (multi-select con AudioMixer) -->
              <div id="timer-ambient-panel" class="hidden p-2 rounded-xl bg-slate-800 border border-slate-700">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-xs text-gray-500">Mezclar sonidos <span class="text-gray-600">(max 3)</span></span>
                  <div class="flex gap-2">
                    <button id="timer-random-ambient" class="text-xs text-cyan-400 hover:text-cyan-300" title="Cambiar sonidos aleatoriamente">Aleatorio</button>
                    <button id="timer-stop-all-ambient" class="text-xs text-red-400 hover:text-red-300">Parar</button>
                  </div>
                </div>
                <div class="grid grid-cols-5 gap-1.5 mb-2">
                  <button class="ambient-type-btn px-2 py-1.5 text-base rounded-lg bg-slate-700 hover:bg-emerald-600 transition-colors text-center" data-type="rain" title="Lluvia">🌧️</button>
                  <button class="ambient-type-btn px-2 py-1.5 text-base rounded-lg bg-slate-700 hover:bg-emerald-600 transition-colors text-center" data-type="ocean" title="Oceano">🌊</button>
                  <button class="ambient-type-btn px-2 py-1.5 text-base rounded-lg bg-slate-700 hover:bg-emerald-600 transition-colors text-center" data-type="forest" title="Bosque">🌲</button>
                  <button class="ambient-type-btn px-2 py-1.5 text-base rounded-lg bg-slate-700 hover:bg-emerald-600 transition-colors text-center" data-type="river" title="Rio">💧</button>
                  <button class="ambient-type-btn px-2 py-1.5 text-base rounded-lg bg-slate-700 hover:bg-emerald-600 transition-colors text-center" data-type="whales" title="Ballenas">🐋</button>
                  <button class="ambient-type-btn px-2 py-1.5 text-base rounded-lg bg-slate-700 hover:bg-emerald-600 transition-colors text-center" data-type="fire" title="Fuego">🔥</button>
                  <button class="ambient-type-btn px-2 py-1.5 text-base rounded-lg bg-slate-700 hover:bg-emerald-600 transition-colors text-center" data-type="storm" title="Tormenta">⛈️</button>
                  <button class="ambient-type-btn px-2 py-1.5 text-base rounded-lg bg-slate-700 hover:bg-emerald-600 transition-colors text-center" data-type="wind" title="Viento">🌬️</button>
                  <button class="ambient-type-btn px-2 py-1.5 text-base rounded-lg bg-slate-700 hover:bg-emerald-600 transition-colors text-center" data-type="night" title="Noche">🌙</button>
                  <button class="ambient-type-btn px-2 py-1.5 text-base rounded-lg bg-slate-700 hover:bg-emerald-600 transition-colors text-center" data-type="birds" title="Pajaros">🐦</button>
                  <button class="ambient-type-btn px-2 py-1.5 text-base rounded-lg bg-slate-700 hover:bg-emerald-600 transition-colors text-center" data-type="cafe" title="Cafeteria">☕</button>
                  <button class="ambient-type-btn px-2 py-1.5 text-base rounded-lg bg-slate-700 hover:bg-emerald-600 transition-colors text-center" data-type="meditation" title="Meditacion">🕉️</button>
                  <button class="ambient-type-btn px-2 py-1.5 text-base rounded-lg bg-slate-700 hover:bg-emerald-600 transition-colors text-center" data-type="piano" title="Piano">🎹</button>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-gray-500">Vol:</span>
                  <input type="range" id="timer-ambient-volume" min="0" max="100" value="30"
                         class="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500">
                  <span id="timer-ambient-volume-label" class="text-xs text-gray-400 w-8">30%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Steps Progress Bar -->
          <div class="p-4 border-t border-slate-700/50">
            <div id="timer-steps-progress" class="flex gap-2 justify-center">
              <!-- Step indicators -->
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    practiceTimer.modalElement = document.getElementById('practice-timer-modal');
    this.attachEventListeners();
  }

  /**
   * Anade evento tanto para click como touchend (movil)
   */
  addTouchAndClickListener(element, callback) {
    if (!element) return;
    const signal = this.practiceTimer._abortController?.signal;

    let touchHandled = false;

    element.addEventListener('touchend', (e) => {
      e.preventDefault();
      touchHandled = true;
      callback(e);
      setTimeout(() => { touchHandled = false; }, 300);
    }, { passive: false, signal });

    element.addEventListener('click', (e) => {
      if (!touchHandled) {
        callback(e);
      }
    }, { signal });
  }

  /**
   * Configura los event listeners
   */
  attachEventListeners() {
    const practiceTimer = this.practiceTimer;
    const signal = practiceTimer._abortController?.signal;

    // Controles principales
    this.addTouchAndClickListener(document.getElementById('timer-close'), () => practiceTimer.playback.stop());
    this.addTouchAndClickListener(document.getElementById('timer-play-pause'), () => practiceTimer.playback.togglePause());
    this.addTouchAndClickListener(document.getElementById('timer-prev'), () => practiceTimer.playback.previousStep());
    this.addTouchAndClickListener(document.getElementById('timer-next'), () => practiceTimer.playback.nextStep());

    // Audio controls (TTS)
    this.addTouchAndClickListener(document.getElementById('timer-audio-toggle'), () => practiceTimer.tts.toggleTTS());
    this.addTouchAndClickListener(document.getElementById('timer-read-step'), () => practiceTimer.tts.speakCurrentStep());

    // Speed buttons
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const speed = parseFloat(e.target.dataset.speed);
        practiceTimer.tts.setTTSSpeed(speed);
        document.querySelectorAll('.speed-btn').forEach(b => {
          b.classList.remove('bg-violet-600');
          b.classList.add('bg-slate-700');
        });
        e.target.classList.remove('bg-slate-700');
        e.target.classList.add('bg-violet-600');
      }, { signal });
    });

    // Ambient sound controls
    this.addTouchAndClickListener(document.getElementById('timer-ambient-toggle'), () => practiceTimer.ambient.toggleAmbient());

    // Ambient type buttons - multi-select
    document.querySelectorAll('.ambient-type-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.type;
        practiceTimer.ambient.toggleAmbientType(type);
      }, { signal });
    });

    // Stop all ambient sounds button
    this.addTouchAndClickListener(
      document.getElementById('timer-stop-all-ambient'),
      () => practiceTimer.ambient.stopAllAmbients()
    );

    // Random ambient button
    this.addTouchAndClickListener(
      document.getElementById('timer-random-ambient'),
      () => practiceTimer.ambient.toggleRandomAmbient()
    );

    // Ambient volume slider
    const volumeSlider = document.getElementById('timer-ambient-volume');
    const volumeLabel = document.getElementById('timer-ambient-volume-label');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value) / 100;
        practiceTimer.ambient.setAmbientVolume(volume);
        if (volumeLabel) {
          volumeLabel.textContent = `${e.target.value}%`;
        }
      }, { signal });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!practiceTimer.isRunning) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          practiceTimer.playback.togglePause();
          break;
        case 'ArrowRight':
          practiceTimer.playback.nextStep();
          break;
        case 'ArrowLeft':
          practiceTimer.playback.previousStep();
          break;
        case 'Escape':
          practiceTimer.playback.stop();
          break;
        case 'a':
        case 'A':
          practiceTimer.tts.toggleTTS();
          break;
        case 'r':
        case 'R':
          practiceTimer.tts.speakCurrentStep();
          break;
        case 'm':
        case 'M':
          practiceTimer.ambient.toggleAmbient();
          break;
      }
    }, { signal });
  }

  // ==========================================================================
  // ACTUALIZACION DE UI
  // ==========================================================================

  /**
   * Actualiza el header del modal
   */
  updateHeader() {
    const practiceTimer = this.practiceTimer;
    const typeIcons = {
      meditation: '🧘',
      reflection: '📝',
      action: '🎯',
      physical: '🌳'
    };

    document.getElementById('timer-practice-icon').textContent = typeIcons[practiceTimer.currentPractice.type] || '✨';
    document.getElementById('timer-practice-title').textContent = practiceTimer.currentPractice.title;
    document.getElementById('timer-practice-duration').textContent = practiceTimer.currentPractice.duration;
  }

  /**
   * Renderiza los indicadores de progreso de pasos
   */
  renderStepsProgress() {
    const practiceTimer = this.practiceTimer;
    const container = document.getElementById('timer-steps-progress');
    if (!container) return;

    container.innerHTML = practiceTimer.currentPractice.steps.map((step, index) => `
      <div class="step-indicator flex flex-col items-center gap-1">
        <div class="w-3 h-3 rounded-full transition-all ${index < practiceTimer.currentStepIndex ? 'bg-violet-500' : index === practiceTimer.currentStepIndex ? 'bg-violet-500 ring-4 ring-violet-500/30' : 'bg-slate-700'
      }"></div>
        <span class="text-xs text-gray-500">${index + 1}</span>
      </div>
    `).join('');
  }

  /**
   * Carga el paso actual
   */
  loadCurrentStep() {
    const practiceTimer = this.practiceTimer;
    const step = practiceTimer.currentPractice.steps[practiceTimer.currentStepIndex];
    if (!step) return;

    // Parsear duracion del paso
    practiceTimer.secondsRemaining = practiceTimer.playback.parseDuration(step.duration);
    practiceTimer.totalSeconds = practiceTimer.secondsRemaining;

    // Actualizar UI
    document.getElementById('timer-current-step').innerHTML = `
      <p class="text-xl text-white leading-relaxed">
        ${step.text || step}
      </p>
    `;
    document.getElementById('timer-step-label').textContent = `Paso ${practiceTimer.currentStepIndex + 1} de ${practiceTimer.currentPractice.steps.length}`;

    practiceTimer.playback.updateTimerDisplay();
    practiceTimer.playback.updateProgressCircle();
    this.renderStepsProgress();

    // Iniciar countdown si no esta pausado
    if (!practiceTimer.isPaused) {
      practiceTimer.playback.startCountdown();
    }
  }

  // ==========================================================================
  // VALORACION
  // ==========================================================================

  /**
   * Muestra el dialogo de valoracion
   */
  showRating() {
    const practiceTimer = this.practiceTimer;
    const container = document.getElementById('timer-current-step');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-4">
          <h3 class="text-xl font-bold text-white mb-4">Como te fue?</h3>
          <div class="flex justify-center gap-4 mb-6">
            <button class="rating-btn p-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all text-4xl" data-rating="1">😟</button>
            <button class="rating-btn p-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all text-4xl" data-rating="2">😐</button>
            <button class="rating-btn p-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all text-4xl" data-rating="3">🙂</button>
            <button class="rating-btn p-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all text-4xl" data-rating="4">😊</button>
            <button class="rating-btn p-4 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all text-4xl" data-rating="5">🤩</button>
          </div>
          <textarea id="practice-notes" rows="3"
                    class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-gray-200 placeholder-gray-500 outline-none resize-none mb-4"
                    placeholder="Notas personales (opcional)..."></textarea>
          <button id="save-rating-btn" class="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold text-white transition-all">
            Guardar y Terminar
          </button>
        </div>
      `;
    }

    // Event listeners
    document.querySelectorAll('.rating-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('ring-2', 'ring-violet-500'));
        e.currentTarget.classList.add('ring-2', 'ring-violet-500');
        practiceTimer.selectedRating = parseInt(e.currentTarget.dataset.rating);
      });
    });

    document.getElementById('save-rating-btn')?.addEventListener('click', () => {
      const notes = document.getElementById('practice-notes')?.value || '';
      this.saveRating(practiceTimer.selectedRating, notes);
      practiceTimer.playback.stop();
    });
  }

  /**
   * Guarda la valoracion
   */
  saveRating(rating, notes) {
    const practiceTimer = this.practiceTimer;
    if (!practiceTimer.currentPractice) return;

    try {
      const history = JSON.parse(localStorage.getItem('practice-completion-history') || '[]');
      history.push({
        practiceId: practiceTimer.currentPractice.id,
        practiceTitle: practiceTimer.currentPractice.title,
        rating: rating,
        notes: notes,
        completedAt: new Date().toISOString()
      });
      localStorage.setItem('practice-completion-history', JSON.stringify(history.slice(-100)));

      if (window.toast) {
        window.toast.show('Practica guardada', 'success', 2000);
      }
    } catch (error) {
      logger.error('[PracticeTimerUI] Error guardando valoracion:', error);
    }
  }

  /**
   * Destruye el modulo y limpia recursos
   */
  destroy() {
    const practiceTimer = this.practiceTimer;

    if (practiceTimer._abortController) {
      practiceTimer._abortController.abort();
      practiceTimer._abortController = null;
    }

    if (practiceTimer.modalElement) {
      practiceTimer.modalElement.remove();
      practiceTimer.modalElement = null;
    }
  }
}

// Exportar globalmente
window.PracticeTimerUI = PracticeTimerUI;
