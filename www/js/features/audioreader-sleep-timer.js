// ============================================================================
// AUDIOREADER SLEEP TIMER - Módulo de temporizador de sueño
// ============================================================================
// Extraído de audioreader.js para modularización
// v2.9.234: First modular extraction

/**
 * Maneja el temporizador de sueño para detener audio automáticamente
 * @class
 */
class AudioReaderSleepTimer {
  constructor(audioReader) {
    this.audioReader = audioReader;
    this.timer = null;
    this.minutes = 0;
    this.startTime = null;
    this.isPaused = false;
    this.remainingTime = 0;

    // Restaurar desde localStorage al inicializar
    this.restoreFromStorage();
  }

  /**
   * Restaurar sleep timer desde localStorage al iniciar
   */
  restoreFromStorage() {
    try {
      const savedData = localStorage.getItem('audioreader-sleep-timer-data');
      if (!savedData) return;

      const { minutes, startTime } = JSON.parse(savedData);
      if (!minutes || !startTime) return;

      // Calcular tiempo transcurrido desde que se guardó
      const elapsedMs = Date.now() - startTime;
      const elapsedMinutes = elapsedMs / 1000 / 60;
      const remainingMinutes = minutes - elapsedMinutes;

      // Si aún queda tiempo, restaurar el timer
      if (remainingMinutes > 1) {
        this.minutes = minutes;
        this.startTime = startTime;
        console.log(`[SleepTimer] Restaurado - ${Math.ceil(remainingMinutes)}m restantes`);
      } else {
        // Timer expirado, limpiar storage
        localStorage.removeItem('audioreader-sleep-timer-data');
      }
    } catch (error) {
      console.warn('[SleepTimer] Error restaurando:', error);
      localStorage.removeItem('audioreader-sleep-timer-data');
    }
  }

  /**
   * Configurar el temporizador de sueño
   * @param {number} minutes - Minutos para el temporizador (0 para cancelar)
   */
  set(minutes) {
    this.clear();

    if (minutes === 0) {
      this.minutes = 0;
      localStorage.removeItem('audioreader-sleep-timer-data');
      this.audioReader.updateUI?.();
      return;
    }

    this.minutes = minutes;
    this.startTime = Date.now();

    // Persistir en localStorage
    try {
      localStorage.setItem('audioreader-sleep-timer-data', JSON.stringify({
        minutes: minutes,
        startTime: this.startTime
      }));
    } catch (error) {
      console.warn('[SleepTimer] Error guardando:', error);
    }

    // Crear el timer usando el método tracked del audioReader
    this.timer = this.audioReader._setTimeout(() => {
      console.log('[SleepTimer] Finalizado, deteniendo audio...');
      this.audioReader.fadeOutAndStop?.() || this.audioReader.stop?.();
      localStorage.removeItem('audioreader-sleep-timer-data');
    }, minutes * 60 * 1000);

    this.audioReader.updateUI?.();
    window.toast?.success(`Sleep timer: ${minutes} minutos`);
  }

  /**
   * Limpiar/cancelar el temporizador
   */
  clear() {
    if (this.timer) {
      this.audioReader._clearTimeout?.(this.timer) || clearTimeout(this.timer);
      this.timer = null;
      this.minutes = 0;
      this.startTime = null;
      localStorage.removeItem('audioreader-sleep-timer-data');
    }
  }

  /**
   * Obtener minutos restantes del timer
   * @returns {number} Minutos restantes (redondeado hacia arriba)
   */
  getRemaining() {
    if (!this.startTime || !this.minutes) return 0;

    const elapsed = (Date.now() - this.startTime) / 1000 / 60;
    const remaining = Math.max(0, this.minutes - elapsed);
    return Math.ceil(remaining);
  }

  /**
   * Reactivar timer restaurado cuando se inicia reproducción
   */
  reactivate() {
    // Solo reactivar si hay valores restaurados pero no hay timer activo
    if (this.timer || !this.startTime || !this.minutes) return;

    const remainingMinutes = this.getRemaining();
    if (remainingMinutes <= 0) {
      this.minutes = 0;
      this.startTime = null;
      localStorage.removeItem('audioreader-sleep-timer-data');
      return;
    }

    // Reactivar el timer con el tiempo restante
    this.timer = this.audioReader._setTimeout(() => {
      console.log('[SleepTimer] Finalizado, deteniendo audio...');
      this.audioReader.fadeOutAndStop?.() || this.audioReader.stop?.();
      localStorage.removeItem('audioreader-sleep-timer-data');
    }, remainingMinutes * 60 * 1000);

    console.log(`[SleepTimer] Reactivado - ${remainingMinutes}m restantes`);
  }

  /**
   * Pausar sleep timer al minimizar app
   */
  pause() {
    if (!this.timer || this.isPaused) return;

    // Calcular tiempo restante
    const elapsed = (Date.now() - this.startTime) / 1000 / 60;
    this.remainingTime = Math.max(0, this.minutes - elapsed);

    // Cancelar timer actual
    this.audioReader._clearTimeout?.(this.timer) || clearTimeout(this.timer);
    this.timer = null;
    this.isPaused = true;

    console.log(`[SleepTimer] Pausado - ${Math.ceil(this.remainingTime)}m restantes`);
  }

  /**
   * Resumir sleep timer al volver a la app
   */
  resume() {
    if (!this.isPaused || this.remainingTime <= 0) return;

    // Crear nuevo timer con el tiempo restante
    this.timer = this.audioReader._setTimeout(() => {
      console.log('[SleepTimer] Finalizado - deteniendo reproducción');
      this.audioReader.stop?.();
    }, this.remainingTime * 60 * 1000);

    // Actualizar tiempo de inicio para reflejar el tiempo restante
    this.startTime = Date.now();
    this.minutes = this.remainingTime;
    this.isPaused = false;
    this.remainingTime = 0;

    console.log(`[SleepTimer] Resumido - ${Math.ceil(this.minutes)}m restantes`);
  }

  /**
   * Destruir el módulo y limpiar recursos
   */
  destroy() {
    this.clear();
    this.audioReader = null;
  }
}

// Exportar globalmente
window.AudioReaderSleepTimer = AudioReaderSleepTimer;
