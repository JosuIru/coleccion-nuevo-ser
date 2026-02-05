/**
 * Practice Timer - Playback Control Module
 * Gestiona el control del timer (start/stop/pause)
 * @version 2.9.390 - Modularizado
 */

class PracticeTimerPlayback {
  constructor(practiceTimer) {
    this.practiceTimer = practiceTimer;
  }

  // ==========================================================================
  // INICIO DE PRACTICA
  // ==========================================================================

  /**
   * Inicia el timer con una practica
   */
  start(practice) {
    const practiceTimer = this.practiceTimer;

    if (!practice || !practice.steps || practice.steps.length === 0) {
      logger.error('[PracticeTimerPlayback] Practica invalida');
      return;
    }

    // Re-crear modal si fue destruido
    if (!practiceTimer.modalElement || !document.contains(practiceTimer.modalElement)) {
      practiceTimer.ui.createModal();
    }

    practiceTimer.currentPractice = practice;
    practiceTimer.currentStepIndex = 0;
    practiceTimer.completedSteps = [];
    practiceTimer.isRunning = true;
    practiceTimer.isPaused = false;

    // Mostrar modal
    practiceTimer.modalElement?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Actualizar UI inicial
    practiceTimer.ui.updateHeader();
    practiceTimer.ui.renderStepsProgress();
    practiceTimer.tts.updateAudioUI();
    practiceTimer.ambient.updateAmbientUI();
    practiceTimer.ui.loadCurrentStep();

    // Reproducir sonido inicial
    practiceTimer.ambient.playBell();

    // Iniciar sonido ambiente si esta activado
    if (practiceTimer.ambientEnabled) {
      setTimeout(() => practiceTimer.ambient.startAmbientSound(), 500);
    }

    // Leer el primer paso si TTS esta activado
    if (practiceTimer.ttsEnabled && practiceTimer.autoReadSteps) {
      setTimeout(() => practiceTimer.tts.speakCurrentStep(), 1500);
    }

    logger.log('[PracticeTimerPlayback] Iniciando practica:', practice.title);
  }

  // ==========================================================================
  // CONTROL DEL COUNTDOWN
  // ==========================================================================

  /**
   * Parsea una duracion string a segundos
   */
  parseDuration(durationStr) {
    if (!durationStr) return 45;

    let seconds = 0;

    const secMatch = durationStr.match(/(\d+)\s*(?:seg|segundos?|s\b)/i);
    if (secMatch) {
      seconds = parseInt(secMatch[1]);
    } else {
      const minMatch = durationStr.match(/(\d+)\s*(?:min|minutos?)/i);
      if (minMatch) {
        seconds = parseInt(minMatch[1]) * 60;
      } else {
        const minutes = parseInt(durationStr);
        if (!isNaN(minutes)) {
          seconds = minutes * 60;
        } else {
          seconds = 45;
        }
      }
    }

    // Limites para evitar silencios muy largos o muy cortos
    seconds = Math.max(15, Math.min(300, seconds));

    return seconds;
  }

  /**
   * Inicia el countdown
   */
  startCountdown() {
    const practiceTimer = this.practiceTimer;
    this.clearInterval();

    practiceTimer.timerInterval = setInterval(() => {
      if (practiceTimer.isPaused) return;

      practiceTimer.secondsRemaining--;
      this.updateTimerDisplay();
      this.updateProgressCircle();

      if (practiceTimer.secondsRemaining <= 0) {
        practiceTimer.ambient.playBell();
        practiceTimer.completedSteps.push(practiceTimer.currentStepIndex);
        practiceTimer.tts.stopSpeaking();

        // Auto-avanzar al siguiente paso
        if (practiceTimer.currentStepIndex < practiceTimer.currentPractice.steps.length - 1) {
          practiceTimer.currentStepIndex++;
          practiceTimer.ui.loadCurrentStep();

          // Leer el siguiente paso si TTS esta activado
          if (practiceTimer.ttsEnabled && practiceTimer.autoReadSteps) {
            setTimeout(() => practiceTimer.tts.speakCurrentStep(), 1000);
          }
        } else {
          // Practica completada
          this.complete();
        }
      }
    }, 1000);
  }

  /**
   * Actualiza el display del timer
   */
  updateTimerDisplay() {
    const practiceTimer = this.practiceTimer;
    const minutes = Math.floor(practiceTimer.secondsRemaining / 60);
    const seconds = practiceTimer.secondsRemaining % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    document.getElementById('timer-display').textContent = display;
  }

  /**
   * Actualiza el circulo de progreso
   */
  updateProgressCircle() {
    const practiceTimer = this.practiceTimer;
    const circle = document.getElementById('timer-progress-circle');
    if (!circle) return;

    const circumference = 283; // 2 * PI * 45
    const progress = practiceTimer.secondsRemaining / practiceTimer.totalSeconds;
    const offset = circumference * (1 - progress);

    circle.style.strokeDashoffset = offset;
  }

  // ==========================================================================
  // CONTROL DE PAUSA Y NAVEGACION
  // ==========================================================================

  /**
   * Pausa/reanuda el timer
   */
  togglePause() {
    const practiceTimer = this.practiceTimer;
    practiceTimer.isPaused = !practiceTimer.isPaused;

    const playIcon = document.getElementById('timer-play-icon');
    const pauseIcon = document.getElementById('timer-pause-icon');

    if (practiceTimer.isPaused) {
      playIcon?.classList.remove('hidden');
      pauseIcon?.classList.add('hidden');
    } else {
      playIcon?.classList.add('hidden');
      pauseIcon?.classList.remove('hidden');
    }
  }

  /**
   * Va al paso anterior
   */
  previousStep() {
    const practiceTimer = this.practiceTimer;
    if (practiceTimer.currentStepIndex > 0) {
      practiceTimer.currentStepIndex--;
      practiceTimer.ui.loadCurrentStep();
    }
  }

  /**
   * Va al siguiente paso
   */
  nextStep() {
    const practiceTimer = this.practiceTimer;
    if (practiceTimer.currentStepIndex < practiceTimer.currentPractice.steps.length - 1) {
      practiceTimer.completedSteps.push(practiceTimer.currentStepIndex);
      practiceTimer.currentStepIndex++;
      practiceTimer.tts.stopSpeaking();
      practiceTimer.ambient.playBell();
      practiceTimer.ui.loadCurrentStep();

      if (practiceTimer.ttsEnabled && practiceTimer.autoReadSteps) {
        setTimeout(() => practiceTimer.tts.speakCurrentStep(), 1000);
      }
    } else {
      this.complete();
    }
  }

  // ==========================================================================
  // FINALIZACION DE PRACTICA
  // ==========================================================================

  /**
   * Completa la practica
   */
  complete() {
    const practiceTimer = this.practiceTimer;
    this.clearInterval();
    practiceTimer.ambient.playBell();

    // Mostrar pantalla de completado
    const container = document.getElementById('timer-current-step');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-8">
          <span class="text-6xl mb-6 block animate-bounce">🎉</span>
          <h3 class="text-2xl font-bold text-white mb-4">Practica Completada!</h3>
          ${practiceTimer.currentPractice.reflection ? `
            <div class="bg-amber-900/20 rounded-xl p-4 mb-6 border border-amber-500/20 text-left">
              <h4 class="text-sm font-semibold text-amber-300 mb-2">Reflexion Final</h4>
              <p class="text-gray-300 italic">${practiceTimer.currentPractice.reflection}</p>
            </div>
          ` : ''}
          <div class="flex flex-wrap gap-3 justify-center">
            <button id="timer-rate-btn" class="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold text-white transition-all">
              Valorar Practica
            </button>
            <button id="timer-done-btn" class="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-semibold text-gray-300 transition-all">
              Terminar
            </button>
          </div>
        </div>
      `;
    }

    // Ocultar controles
    document.getElementById('timer-play-pause')?.classList.add('hidden');
    document.getElementById('timer-prev')?.classList.add('hidden');
    document.getElementById('timer-next')?.classList.add('hidden');

    // Registrar completado
    this.trackCompletion();

    // Event listeners para botones de completado
    const signalOpts = practiceTimer._abortController ? { signal: practiceTimer._abortController.signal } : {};
    document.getElementById('timer-rate-btn')?.addEventListener('click', () => practiceTimer.ui.showRating(), signalOpts);
    document.getElementById('timer-done-btn')?.addEventListener('click', () => this.stop(), signalOpts);
  }

  /**
   * Registra la completitud
   */
  trackCompletion() {
    const practiceTimer = this.practiceTimer;

    if (window.achievementSystem) {
      window.achievementSystem.trackPracticeCompleted(practiceTimer.currentPractice.id);
    }

    if (window.streakSystem) {
      window.streakSystem.recordActivity('practice');
    }

    if (window.practiceRecommender) {
      window.practiceRecommender.markCompleted(practiceTimer.currentPractice.id);
    }
  }

  // ==========================================================================
  // DETENCION Y LIMPIEZA
  // ==========================================================================

  /**
   * Detiene el timer y cierra el modal
   */
  stop() {
    const practiceTimer = this.practiceTimer;

    this.clearInterval();
    practiceTimer.isRunning = false;
    practiceTimer.isPaused = false;
    practiceTimer.currentPractice = null;
    practiceTimer.currentStepIndex = 0;

    // Detener narracion
    practiceTimer.tts.stopSpeaking();

    // Detener modo aleatorio
    practiceTimer.ambient.stopRandomAmbient();

    // Detener sonido ambiente
    practiceTimer.ambient.stopAmbientSound();

    // Destruir modal y limpiar listeners
    practiceTimer.destroy();

    document.body.style.overflow = '';
  }

  /**
   * Limpia el interval
   */
  clearInterval() {
    const practiceTimer = this.practiceTimer;
    if (practiceTimer.timerInterval) {
      clearInterval(practiceTimer.timerInterval);
      practiceTimer.timerInterval = null;
    }
  }

  /**
   * Destruye el modulo y limpia recursos
   */
  destroy() {
    this.clearInterval();
  }
}

// Exportar globalmente
window.PracticeTimerPlayback = PracticeTimerPlayback;
