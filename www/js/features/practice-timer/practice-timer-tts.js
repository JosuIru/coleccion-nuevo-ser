/**
 * Practice Timer - TTS Narration Module
 * Gestiona la narracion por voz para practicas guiadas
 * @version 2.9.390 - Modularizado
 */

class PracticeTimerTTS {
  constructor(practiceTimer) {
    this.practiceTimer = practiceTimer;
  }

  // ==========================================================================
  // INICIALIZACION TTS
  // ==========================================================================

  /**
   * Inicializa el TTS Manager
   */
  async initTTS() {
    const practiceTimer = this.practiceTimer;

    // Detectar si estamos en Capacitor (Android/iOS nativo)
    practiceTimer.isCapacitor = !!(window.Capacitor && window.Capacitor.isNative);
    practiceTimer.isNativeApp = !!(window.Capacitor || window.cordova || document.URL.indexOf('http://') === -1);

    // Verificar si Web Speech API esta disponible
    practiceTimer.speechSynthesisAvailable = 'speechSynthesis' in window && typeof window.speechSynthesis !== 'undefined';

    // Intentar usar TTS nativo de Capacitor primero
    if (practiceTimer.isCapacitor) {
      await this.initNativeTTS();
    }

    // TTSManager como fallback o para web
    if (window.TTSManager && !practiceTimer.ttsManager) {
      try {
        practiceTimer.ttsManager = new window.TTSManager();
      } catch (error) {
        logger.error('[PracticeTimerTTS] Error inicializando TTSManager:', error);
      }
    }

    // Cargar preferencia guardada
    practiceTimer.ttsEnabled = localStorage.getItem('practice-timer-tts') === 'true';
    practiceTimer.ttsSpeed = parseFloat(localStorage.getItem('practice-timer-tts-speed')) || 0.9;

    logger.log('[PracticeTimerTTS] TTS inicializado:', {
      nativeTTS: !!practiceTimer.nativeTTS,
      ttsManager: !!practiceTimer.ttsManager,
      speechSynthesis: practiceTimer.speechSynthesisAvailable,
      enabled: practiceTimer.ttsEnabled
    });
  }

  /**
   * Inicializa TTS nativo de Capacitor
   */
  async initNativeTTS() {
    const practiceTimer = this.practiceTimer;

    try {
      // Buscar el plugin en diferentes ubicaciones
      if (window.Capacitor?.Plugins?.TextToSpeech) {
        practiceTimer.nativeTTS = window.Capacitor.Plugins.TextToSpeech;
        logger.log('[PracticeTimerTTS] TTS nativo encontrado en Capacitor.Plugins');
      } else if (window.capacitorTextToSpeech?.TextToSpeech) {
        practiceTimer.nativeTTS = window.capacitorTextToSpeech.TextToSpeech;
        logger.log('[PracticeTimerTTS] TTS nativo encontrado en capacitorTextToSpeech');
      } else {
        logger.warn('[PracticeTimerTTS] Plugin TextToSpeech no encontrado');
        return;
      }

      // Pre-calentar el TTS sin verificar idiomas
      try {
        await practiceTimer.nativeTTS.speak({
          text: ' ',
          lang: 'es-ES',
          rate: 1.0,
          pitch: 1.0,
          volume: 0.01
        });
        logger.log('[PracticeTimerTTS] TTS nativo pre-calentado correctamente');
      } catch (warmupError) {
        logger.log('[PracticeTimerTTS] Pre-calentamiento TTS:', warmupError.message || 'ok');
      }

    } catch (error) {
      logger.error('[PracticeTimerTTS] Error inicializando TTS nativo:', error);
      practiceTimer.nativeTTS = null;
    }
  }

  /**
   * Verifica si TTS esta disponible
   */
  isTTSAvailable() {
    const practiceTimer = this.practiceTimer;

    if (practiceTimer.nativeTTS) return true;
    if (practiceTimer.ttsManager) return true;
    if (practiceTimer.speechSynthesisAvailable) return true;

    return false;
  }

  // ==========================================================================
  // CONTROL DE TTS
  // ==========================================================================

  /**
   * Activa/Desactiva el TTS
   */
  toggleTTS() {
    const practiceTimer = this.practiceTimer;

    if (!this.isTTSAvailable()) {
      if (window.toast) {
        window.toast.warning('La narracion no esta disponible en esta app. Funciona en navegador web.', 4000);
      } else {
        alert('La narracion por voz no esta disponible en la app movil. Funciona en navegador web.');
      }
      return;
    }

    practiceTimer.ttsEnabled = !practiceTimer.ttsEnabled;
    localStorage.setItem('practice-timer-tts', practiceTimer.ttsEnabled.toString());

    const iconOn = document.getElementById('timer-audio-icon-on');
    const iconOff = document.getElementById('timer-audio-icon-off');
    const label = document.getElementById('timer-audio-label');
    const speedPanel = document.getElementById('timer-audio-speed');
    const readBtn = document.getElementById('timer-read-step');

    if (practiceTimer.ttsEnabled) {
      iconOn?.classList.remove('hidden');
      iconOff?.classList.add('hidden');
      label.textContent = 'Narracion ON';
      label.classList.remove('text-gray-400');
      label.classList.add('text-violet-400');
      speedPanel?.classList.remove('hidden');
      speedPanel?.classList.add('flex');
      readBtn?.classList.remove('hidden');
      readBtn?.classList.add('flex');

      if (practiceTimer.autoReadSteps && practiceTimer.isRunning) {
        setTimeout(() => this.speakCurrentStep(), 500);
      }
    } else {
      iconOn?.classList.add('hidden');
      iconOff?.classList.remove('hidden');
      label.textContent = 'Narracion';
      label.classList.add('text-gray-400');
      label.classList.remove('text-violet-400');
      speedPanel?.classList.add('hidden');
      speedPanel?.classList.remove('flex');
      readBtn?.classList.add('hidden');
      readBtn?.classList.remove('flex');

      this.stopSpeaking();
    }

    logger.log('[PracticeTimerTTS] TTS:', practiceTimer.ttsEnabled ? 'ON' : 'OFF');
  }

  /**
   * Establece la velocidad del TTS
   */
  setTTSSpeed(speed) {
    this.practiceTimer.ttsSpeed = speed;
    localStorage.setItem('practice-timer-tts-speed', speed.toString());
    logger.log('[PracticeTimerTTS] TTS speed:', speed);
  }

  /**
   * Lee el paso actual en voz alta
   */
  async speakCurrentStep() {
    const practiceTimer = this.practiceTimer;

    logger.log('[PracticeTimerTTS] speakCurrentStep llamado', {
      nativeTTS: !!practiceTimer.nativeTTS,
      ttsManager: !!practiceTimer.ttsManager,
      speechSynthesis: !!window.speechSynthesis,
      isTTSAvailable: this.isTTSAvailable()
    });

    if (!practiceTimer.currentPractice) {
      logger.warn('[PracticeTimerTTS] No hay practica actual');
      return;
    }

    const step = practiceTimer.currentPractice.steps[practiceTimer.currentStepIndex];
    if (!step) return;

    const text = typeof step === 'string' ? step : (step.text || '');
    if (!text) {
      logger.warn('[PracticeTimerTTS] Texto vacio');
      return;
    }

    this.stopSpeaking();

    practiceTimer.isSpeaking = true;
    this.updateSpeakingUI(true);

    try {
      const preparedText = this.prepareTextForMeditation(text);
      logger.log('[PracticeTimerTTS] Texto a narrar:', preparedText.substring(0, 50) + '...');

      if (practiceTimer.nativeTTS) {
        logger.log('[PracticeTimerTTS] Usando TTS nativo de Capacitor');
        await practiceTimer.nativeTTS.speak({
          text: preparedText,
          lang: 'es-ES',
          rate: practiceTimer.ttsSpeed,
          pitch: 1.0,
          volume: 1.0
        });
        logger.log('[PracticeTimerTTS] TTS nativo completado');
        practiceTimer.isSpeaking = false;
        this.updateSpeakingUI(false);
      } else if (practiceTimer.ttsManager) {
        logger.log('[PracticeTimerTTS] Usando TTSManager');
        await practiceTimer.ttsManager.speak(preparedText, {
          speed: practiceTimer.ttsSpeed,
          voice: 'es-ES',
          onEnd: () => {
            practiceTimer.isSpeaking = false;
            this.updateSpeakingUI(false);
          },
          onError: (error) => {
            logger.error('[PracticeTimerTTS] TTSManager error:', error);
            practiceTimer.isSpeaking = false;
            this.updateSpeakingUI(false);
          }
        });
      } else if (typeof window !== 'undefined' && window.speechSynthesis && typeof window.speechSynthesis.speak === 'function') {
        logger.log('[PracticeTimerTTS] Usando Web Speech API');
        const utterance = new SpeechSynthesisUtterance(preparedText);
        utterance.lang = 'es-ES';
        utterance.rate = practiceTimer.ttsSpeed;
        utterance.onend = () => {
          practiceTimer.isSpeaking = false;
          this.updateSpeakingUI(false);
        };
        utterance.onerror = () => {
          practiceTimer.isSpeaking = false;
          this.updateSpeakingUI(false);
        };
        window.speechSynthesis.speak(utterance);
      } else {
        logger.error('[PracticeTimerTTS] Ningun metodo TTS disponible');
        practiceTimer.isSpeaking = false;
        this.updateSpeakingUI(false);
        if (window.toast) {
          window.toast.warning('Narracion no disponible en este dispositivo', 3000);
        }
      }
    } catch (error) {
      logger.error('[PracticeTimerTTS] Error al hablar:', error);
      practiceTimer.isSpeaking = false;
      this.updateSpeakingUI(false);
    }
  }

  /**
   * Prepara el texto para meditacion (anade pausas naturales)
   */
  prepareTextForMeditation(text) {
    let prepared = text
      .replace(/\.\s+/g, '... ')
      .replace(/,\s+/g, ', ')
      .replace(/:\s+/g, ': ');

    return prepared;
  }

  /**
   * Detiene la narracion actual
   */
  stopSpeaking() {
    const practiceTimer = this.practiceTimer;

    if (practiceTimer.nativeTTS) {
      try { practiceTimer.nativeTTS.stop(); } catch (error) { /* Ignore */ }
    }

    if (practiceTimer.ttsManager) {
      try { practiceTimer.ttsManager.stop(); } catch (error) { /* Ignore */ }
    }

    if (typeof window !== 'undefined' && window.speechSynthesis && typeof window.speechSynthesis.cancel === 'function') {
      try { window.speechSynthesis.cancel(); } catch (error) { /* Ignore */ }
    }

    practiceTimer.isSpeaking = false;
    this.updateSpeakingUI(false);
  }

  /**
   * Actualiza la UI cuando esta hablando
   */
  updateSpeakingUI(speaking) {
    const readBtn = document.getElementById('timer-read-step');
    if (readBtn) {
      if (speaking) {
        readBtn.innerHTML = `
          <svg class="w-4 h-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
          </svg>
          <span class="text-sm text-white">Detener</span>
        `;
        readBtn.classList.remove('bg-amber-600', 'hover:bg-amber-500');
        readBtn.classList.add('bg-red-600', 'hover:bg-red-500');
      } else {
        readBtn.innerHTML = `
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
          </svg>
          <span class="text-sm text-white">Leer</span>
        `;
        readBtn.classList.add('bg-amber-600', 'hover:bg-amber-500');
        readBtn.classList.remove('bg-red-600', 'hover:bg-red-500');
      }
    }
  }

  /**
   * Actualiza UI de audio al iniciar
   */
  updateAudioUI() {
    const practiceTimer = this.practiceTimer;
    const audioToggle = document.getElementById('timer-audio-toggle');
    const iconOn = document.getElementById('timer-audio-icon-on');
    const iconOff = document.getElementById('timer-audio-icon-off');
    const label = document.getElementById('timer-audio-label');
    const speedPanel = document.getElementById('timer-audio-speed');
    const readBtn = document.getElementById('timer-read-step');

    if (!this.isTTSAvailable()) {
      if (audioToggle) {
        audioToggle.classList.add('opacity-50');
        audioToggle.title = 'No disponible en app movil';
      }
      iconOn?.classList.add('hidden');
      iconOff?.classList.remove('hidden');
      if (label) {
        label.textContent = 'No disponible';
        label.classList.add('text-gray-500');
        label.classList.remove('text-gray-400', 'text-violet-400');
      }
      speedPanel?.classList.add('hidden');
      readBtn?.classList.add('hidden');
      return;
    }

    if (audioToggle) {
      audioToggle.classList.remove('opacity-50');
      audioToggle.title = '';
    }

    if (practiceTimer.ttsEnabled) {
      iconOn?.classList.remove('hidden');
      iconOff?.classList.add('hidden');
      label.textContent = 'Narracion ON';
      label.classList.remove('text-gray-400');
      label.classList.add('text-violet-400');
      speedPanel?.classList.remove('hidden');
      speedPanel?.classList.add('flex');
      readBtn?.classList.remove('hidden');
      readBtn?.classList.add('flex');
    } else {
      iconOn?.classList.add('hidden');
      iconOff?.classList.remove('hidden');
      label.textContent = 'Narracion';
      label.classList.add('text-gray-400');
      label.classList.remove('text-violet-400');
      speedPanel?.classList.add('hidden');
      speedPanel?.classList.remove('flex');
      readBtn?.classList.add('hidden');
      readBtn?.classList.remove('flex');
    }

    document.querySelectorAll('.speed-btn').forEach(btn => {
      const speed = parseFloat(btn.dataset.speed);
      if (Math.abs(speed - practiceTimer.ttsSpeed) < 0.05) {
        btn.classList.remove('bg-slate-700');
        btn.classList.add('bg-violet-600');
      } else {
        btn.classList.add('bg-slate-700');
        btn.classList.remove('bg-violet-600');
      }
    });
  }

  /**
   * Destruye el modulo y limpia recursos
   */
  destroy() {
    this.stopSpeaking();
  }
}

// Exportar globalmente
window.PracticeTimerTTS = PracticeTimerTTS;
