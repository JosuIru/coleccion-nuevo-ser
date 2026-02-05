/**
 * Practice Timer - Coordinador Principal
 * Timer visual para practicas guiadas
 * @version 2.9.390 - Arquitectura modular
 *
 * Modulos:
 *   - PracticeTimerAmbient    - Sonidos ambiente (rain, ocean, forest, etc.)
 *   - PracticeTimerTTS        - Narracion TTS
 *   - PracticeTimerRecurring  - Practicas recurrentes
 *   - PracticeTimerUI         - Modal y renders
 *   - PracticeTimerPlayback   - Control del timer (start/stop/pause)
 */

class PracticeTimer {
  constructor() {
    // Estado del timer
    this.isRunning = false;
    this.isPaused = false;
    this.currentPractice = null;
    this.currentStepIndex = 0;
    this.secondsRemaining = 0;
    this.totalSeconds = 0;
    this.timerInterval = null;
    this.modalElement = null;
    this.completedSteps = [];
    this.selectedRating = null;

    // AbortController para cleanup de event listeners
    this._abortController = null;

    // Sistema de sonidos de fondo
    this.ambientEnabled = false;
    this.activeAmbients = new Set();
    this.ambientVolume = 0.3;
    this.ambientNodes = null;
    this.ambientGain = null;
    this.usingAudioMixer = false;
    this.audioContext = null;

    // Tracking de timeouts para cleanup
    this.ambientTimeouts = [];
    this.whaleCallTimeout = null;

    // Modo aleatorio de sonidos
    this.randomAmbientEnabled = false;
    this.randomAmbientInterval = null;
    this.RANDOM_CHANGE_SECONDS = 60;
    this.allSoundTypes = ['rain', 'ocean', 'forest', 'river', 'whales', 'fire', 'storm', 'wind', 'night', 'birds', 'cafe', 'meditation', 'piano'];

    // Sistema TTS para narracion
    this.ttsEnabled = false;
    this.ttsSpeed = 0.9;
    this.ttsManager = null;
    this.nativeTTS = null;
    this.isSpeaking = false;
    this.autoReadSteps = true;
    this.isCapacitor = false;
    this.isNativeApp = false;
    this.speechSynthesisAvailable = false;

    // Sistema de practicas recurrentes
    this._reminderInterval = null;
    this._lastReminderId = null;

    // Inicializar modulos
    this.ambient = new (window.PracticeTimerAmbient || PracticeTimerAmbient)(this);
    this.tts = new (window.PracticeTimerTTS || PracticeTimerTTS)(this);
    this.recurring = new (window.PracticeTimerRecurring || PracticeTimerRecurring)(this);
    this.ui = new (window.PracticeTimerUI || PracticeTimerUI)(this);
    this.playback = new (window.PracticeTimerPlayback || PracticeTimerPlayback)(this);

    // Cargar practicas recurrentes
    this.recurringPractices = this.recurring.loadRecurringPractices();

    // Cargar preferencias
    this.ambient.loadAmbientPreferences();
    this.ambient.loadBellSound();

    // Iniciar recordatorios de practicas recurrentes
    this.recurring.startRecurringReminders();
  }

  // ==========================================================================
  // INICIALIZACION
  // ==========================================================================

  /**
   * Inicializa el timer
   */
  async init() {
    this.ui.init();
    await this.tts.initTTS();
    logger.log('[PracticeTimer] Inicializado (v2.9.390 modular)');
  }

  // ==========================================================================
  // DELEGACION A MODULOS - PLAYBACK
  // ==========================================================================

  /**
   * Inicia el timer con una practica
   */
  start(practice) {
    this.playback.start(practice);
  }

  /**
   * Detiene el timer y cierra el modal
   */
  stop() {
    this.playback.stop();
  }

  /**
   * Pausa/reanuda el timer
   */
  togglePause() {
    this.playback.togglePause();
  }

  /**
   * Va al paso anterior
   */
  previousStep() {
    this.playback.previousStep();
  }

  /**
   * Va al siguiente paso
   */
  nextStep() {
    this.playback.nextStep();
  }

  /**
   * Limpia el interval
   */
  clearInterval() {
    this.playback.clearInterval();
  }

  // ==========================================================================
  // DELEGACION A MODULOS - AMBIENT
  // ==========================================================================

  /**
   * Carga preferencias de sonido ambiente
   */
  loadAmbientPreferences() {
    this.ambient.loadAmbientPreferences();
  }

  /**
   * Guarda preferencias de sonido ambiente
   */
  saveAmbientPreferences() {
    this.ambient.saveAmbientPreferences();
  }

  /**
   * Carga el sonido de campana
   */
  loadBellSound() {
    this.ambient.loadBellSound();
  }

  /**
   * Reproduce un sonido de campana
   */
  playBell() {
    this.ambient.playBell();
  }

  /**
   * Inicia los sonidos de fondo
   */
  async startAmbientSound() {
    return this.ambient.startAmbientSound();
  }

  /**
   * Detiene el sonido de fondo
   */
  async stopAmbientSound() {
    return this.ambient.stopAmbientSound();
  }

  /**
   * Activa/desactiva el sonido ambiente
   */
  async toggleAmbient() {
    return this.ambient.toggleAmbient();
  }

  /**
   * Toggle un sonido ambiente (multi-select)
   */
  async toggleAmbientType(type) {
    return this.ambient.toggleAmbientType(type);
  }

  /**
   * Para todos los sonidos ambiente
   */
  async stopAllAmbients() {
    return this.ambient.stopAllAmbients();
  }

  /**
   * Ajusta el volumen del sonido ambiente
   */
  setAmbientVolume(volume) {
    this.ambient.setAmbientVolume(volume);
  }

  /**
   * Activa/desactiva el modo aleatorio
   */
  toggleRandomAmbient() {
    this.ambient.toggleRandomAmbient();
  }

  /**
   * Actualiza la UI de sonido ambiente
   */
  updateAmbientUI() {
    this.ambient.updateAmbientUI();
  }

  // ==========================================================================
  // DELEGACION A MODULOS - TTS
  // ==========================================================================

  /**
   * Inicializa el TTS Manager
   */
  async initTTS() {
    return this.tts.initTTS();
  }

  /**
   * Verifica si TTS esta disponible
   */
  isTTSAvailable() {
    return this.tts.isTTSAvailable();
  }

  /**
   * Activa/Desactiva el TTS
   */
  toggleTTS() {
    this.tts.toggleTTS();
  }

  /**
   * Establece la velocidad del TTS
   */
  setTTSSpeed(speed) {
    this.tts.setTTSSpeed(speed);
  }

  /**
   * Lee el paso actual en voz alta
   */
  async speakCurrentStep() {
    return this.tts.speakCurrentStep();
  }

  /**
   * Detiene la narracion actual
   */
  stopSpeaking() {
    this.tts.stopSpeaking();
  }

  /**
   * Actualiza UI de audio
   */
  updateAudioUI() {
    this.tts.updateAudioUI();
  }

  // ==========================================================================
  // DELEGACION A MODULOS - RECURRING
  // ==========================================================================

  /**
   * Carga las practicas recurrentes programadas
   */
  loadRecurringPractices() {
    return this.recurring.loadRecurringPractices();
  }

  /**
   * Guarda las practicas recurrentes
   */
  saveRecurringPractices() {
    this.recurring.saveRecurringPractices();
  }

  /**
   * Programa una practica recurrente
   */
  scheduleRecurringPractice(practice, frequency, time, customDays = []) {
    return this.recurring.scheduleRecurringPractice(practice, frequency, time, customDays);
  }

  /**
   * Elimina una practica recurrente
   */
  removeRecurringPractice(recurringId) {
    this.recurring.removeRecurringPractice(recurringId);
  }

  /**
   * Activa/desactiva una practica recurrente
   */
  toggleRecurringPractice(recurringId) {
    this.recurring.toggleRecurringPractice(recurringId);
  }

  /**
   * Obtiene las practicas recurrentes
   */
  getRecurringPractices() {
    return this.recurring.getRecurringPractices();
  }

  /**
   * Inicia la verificacion periodica de practicas recurrentes
   */
  startRecurringReminders() {
    this.recurring.startRecurringReminders();
  }

  /**
   * Detiene la verificacion periodica de practicas recurrentes
   */
  stopRecurringReminders() {
    this.recurring.stopRecurringReminders();
  }

  /**
   * Obtiene practicas pendientes para hoy
   */
  getTodaysPendingPractices() {
    return this.recurring.getTodaysPendingPractices();
  }

  /**
   * Muestra modal para programar practica recurrente
   */
  showScheduleModal(practice) {
    this.recurring.showScheduleModal(practice);
  }

  /**
   * Muestra lista de practicas programadas
   */
  showScheduledPracticesModal() {
    this.recurring.showScheduledPracticesModal();
  }

  // ==========================================================================
  // DELEGACION A MODULOS - UI
  // ==========================================================================

  /**
   * Crea el modal del timer
   */
  createModal() {
    this.ui.createModal();
  }

  /**
   * Actualiza el header del modal
   */
  updateHeader() {
    this.ui.updateHeader();
  }

  /**
   * Renderiza los indicadores de progreso de pasos
   */
  renderStepsProgress() {
    this.ui.renderStepsProgress();
  }

  /**
   * Carga el paso actual
   */
  loadCurrentStep() {
    this.ui.loadCurrentStep();
  }

  /**
   * Muestra el dialogo de valoracion
   */
  showRating() {
    this.ui.showRating();
  }

  /**
   * Guarda la valoracion
   */
  saveRating(rating, notes) {
    this.ui.saveRating(rating, notes);
  }

  // ==========================================================================
  // CLEANUP Y DESTRUCCION
  // ==========================================================================

  /**
   * Destruye el timer y limpia todos los recursos
   */
  destroy() {
    // Abortar todos los event listeners
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }

    // Destruir modulos
    this.playback.destroy();
    this.ambient.destroy();
    this.tts.destroy();
    this.recurring.destroy();
    this.ui.destroy();

    // Limpiar timeouts de ambiente restantes
    if (this.ambientTimeouts?.length > 0) {
      this.ambientTimeouts.forEach(id => clearTimeout(id));
      this.ambientTimeouts = [];
    }

    // Limpiar timeout de ballenas
    if (this.whaleCallTimeout) {
      clearTimeout(this.whaleCallTimeout);
      this.whaleCallTimeout = null;
    }

    logger.log('[PracticeTimer] Destruido (v2.9.390 modular)');
  }
}

// Exportar para uso global
window.PracticeTimer = PracticeTimer;

// Auto-inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.practiceTimer = new PracticeTimer();
    window.practiceTimer.init();
  });
} else {
  window.practiceTimer = new PracticeTimer();
  window.practiceTimer.init();
}
