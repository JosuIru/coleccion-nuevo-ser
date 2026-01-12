/**
 * Practice Timer - Timer visual para prácticas guiadas
 * Gestiona la ejecución paso a paso de prácticas con temporizador
 * @version 1.0.0
 */

class PracticeTimer {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.currentPractice = null;
    this.currentStepIndex = 0;
    this.secondsRemaining = 0;
    this.totalSeconds = 0;
    this.timerInterval = null;
    this.modalElement = null;
    this.completedSteps = [];

    // Audio para transiciones
    this.bellSound = null;
    this.loadBellSound();

    // Sistema de sonidos de fondo
    this.ambientEnabled = false;
    this.ambientType = 'nature'; // nature, rain, ocean, bowls, whitenoise, whales
    this.ambientVolume = 0.3;
    this.ambientNodes = null;
    this.loadAmbientPreferences();

    // Sistema TTS para narración
    this.ttsEnabled = false;
    this.ttsSpeed = 0.9; // Velocidad lenta para meditación
    this.ttsManager = null;
    this.isSpeaking = false;
    this.autoReadSteps = true;
  }

  /**
   * Carga preferencias de sonido ambiente
   */
  loadAmbientPreferences() {
    try {
      this.ambientEnabled = localStorage.getItem('practice-timer-ambient') === 'true';
      this.ambientType = localStorage.getItem('practice-timer-ambient-type') || 'nature';
      this.ambientVolume = parseFloat(localStorage.getItem('practice-timer-ambient-volume')) || 0.3;
    } catch (e) {
      console.warn('[PracticeTimer] Error cargando preferencias de ambiente');
    }
  }

  /**
   * Guarda preferencias de sonido ambiente
   */
  saveAmbientPreferences() {
    try {
      localStorage.setItem('practice-timer-ambient', this.ambientEnabled.toString());
      localStorage.setItem('practice-timer-ambient-type', this.ambientType);
      localStorage.setItem('practice-timer-ambient-volume', this.ambientVolume.toString());
    } catch (e) {
      console.warn('[PracticeTimer] Error guardando preferencias de ambiente');
    }
  }

  /**
   * Carga el sonido de campana
   */
  loadBellSound() {
    try {
      // Usar AudioContext para generar un tono de campana
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('[PracticeTimer] AudioContext no disponible');
    }
  }

  /**
   * Reproduce un sonido de campana
   */
  playBell() {
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = 528; // Frecuencia de "sanación"
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.5);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 1.5);
    } catch (error) {
      console.warn('[PracticeTimer] Error reproduciendo sonido:', error);
    }
  }

  // ========================================
  // SISTEMA DE SONIDOS DE FONDO (AMBIENT)
  // ========================================

  /**
   * Inicia el sonido de fondo
   */
  startAmbientSound() {
    if (!this.audioContext || !this.ambientEnabled) return;

    // Detener sonido anterior si existe
    this.stopAmbientSound();

    try {
      // Crear nodo de ganancia principal para el ambiente
      this.ambientGain = this.audioContext.createGain();
      this.ambientGain.gain.value = this.ambientVolume;
      this.ambientGain.connect(this.audioContext.destination);

      // Crear el tipo de sonido seleccionado
      switch (this.ambientType) {
        case 'nature':
          this.createNatureSound();
          break;
        case 'rain':
          this.createRainSound();
          break;
        case 'ocean':
          this.createOceanSound();
          break;
        case 'bowls':
          this.createBowlsSound();
          break;
        case 'whitenoise':
          this.createWhiteNoiseSound();
          break;
        case 'whales':
          this.createWhaleSound();
          break;
        default:
          this.createNatureSound();
      }

      console.log('[PracticeTimer] Sonido ambiente iniciado:', this.ambientType);
    } catch (error) {
      console.warn('[PracticeTimer] Error iniciando sonido ambiente:', error);
    }
  }

  /**
   * Detiene el sonido de fondo
   */
  stopAmbientSound() {
    // Detener audio de ballenas si existe
    this.stopWhaleAudio();

    if (this.ambientNodes) {
      this.ambientNodes.forEach(node => {
        try {
          if (node.stop) node.stop();
          if (node.disconnect) node.disconnect();
        } catch (e) {}
      });
      this.ambientNodes = null;
    }
    if (this.ambientGain) {
      try {
        this.ambientGain.disconnect();
      } catch (e) {}
      this.ambientGain = null;
    }
  }

  /**
   * Crea ruido blanco filtrado (base para varios sonidos)
   */
  createNoiseBuffer(duration = 2) {
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  /**
   * Sonido de naturaleza (pájaros + brisa suave)
   */
  createNatureSound() {
    this.ambientNodes = [];

    // Brisa suave (ruido rosa filtrado)
    const noiseBuffer = this.createNoiseBuffer(2);
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const lpFilter = this.audioContext.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.value = 400;

    const hpFilter = this.audioContext.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.value = 100;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.value = 0.15;

    noise.connect(lpFilter);
    lpFilter.connect(hpFilter);
    hpFilter.connect(noiseGain);
    noiseGain.connect(this.ambientGain);
    noise.start();

    this.ambientNodes.push(noise, lpFilter, hpFilter, noiseGain);

    // Sonidos de pájaros (tonos aleatorizados)
    this.startBirdSounds();
  }

  /**
   * Genera sonidos de pájaros periódicos
   */
  startBirdSounds() {
    const playBird = () => {
      if (!this.ambientEnabled || !this.isRunning) return;

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      // Frecuencia aleatoria de pájaro (1000-4000 Hz)
      const baseFreq = 1500 + Math.random() * 2500;
      osc.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, this.audioContext.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, this.audioContext.currentTime + 0.2);
      osc.type = 'sine';

      gain.gain.setValueAtTime(0, this.audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(0.03, this.audioContext.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ambientGain);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.3);

      // Siguiente pájaro en 2-8 segundos
      if (this.ambientEnabled && this.isRunning) {
        setTimeout(playBird, 2000 + Math.random() * 6000);
      }
    };

    // Iniciar después de un delay aleatorio
    setTimeout(playBird, 1000 + Math.random() * 3000);
  }

  /**
   * Sonido de lluvia
   */
  createRainSound() {
    this.ambientNodes = [];

    // Ruido filtrado para simular lluvia
    const noiseBuffer = this.createNoiseBuffer(2);
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    // Filtro para sonido de lluvia
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 0.5;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.value = 0.4;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ambientGain);
    noise.start();

    this.ambientNodes.push(noise, filter, noiseGain);

    // Gotas ocasionales
    this.startRainDrops();
  }

  /**
   * Genera gotas de lluvia ocasionales
   */
  startRainDrops() {
    const playDrop = () => {
      if (!this.ambientEnabled || !this.isRunning) return;

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.frequency.setValueAtTime(800 + Math.random() * 400, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
      osc.type = 'sine';

      gain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ambientGain);
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.1);

      if (this.ambientEnabled && this.isRunning) {
        setTimeout(playDrop, 100 + Math.random() * 500);
      }
    };

    setTimeout(playDrop, 500);
  }

  /**
   * Sonido de olas del océano
   */
  createOceanSound() {
    this.ambientNodes = [];

    // Ruido base del océano
    const noiseBuffer = this.createNoiseBuffer(4);
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const lpFilter = this.audioContext.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.value = 800;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.value = 0.3;

    noise.connect(lpFilter);
    lpFilter.connect(noiseGain);
    noiseGain.connect(this.ambientGain);
    noise.start();

    this.ambientNodes.push(noise, lpFilter, noiseGain);

    // Olas que suben y bajan
    this.startWaves(noiseGain);
  }

  /**
   * Modula el volumen para simular olas
   */
  startWaves(gainNode) {
    const wave = () => {
      if (!this.ambientEnabled || !this.isRunning || !gainNode) return;

      const waveDuration = 4 + Math.random() * 4; // 4-8 segundos por ola
      const now = this.audioContext.currentTime;

      // Ola sube
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.linearRampToValueAtTime(0.4, now + waveDuration * 0.4);
      // Ola baja
      gainNode.gain.linearRampToValueAtTime(0.15, now + waveDuration);

      if (this.ambientEnabled && this.isRunning) {
        setTimeout(wave, waveDuration * 1000);
      }
    };

    wave();
  }

  /**
   * Sonido de cuencos tibetanos
   */
  createBowlsSound() {
    this.ambientNodes = [];

    // Crear sonido de cuenco periódicamente
    const playBowl = () => {
      if (!this.ambientEnabled || !this.isRunning) return;

      // Frecuencia de cuenco tibetano (varios armónicos)
      const baseFreq = [174, 285, 396, 417, 528, 639][Math.floor(Math.random() * 6)];

      // Fundamental
      const osc1 = this.audioContext.createOscillator();
      osc1.frequency.value = baseFreq;
      osc1.type = 'sine';

      // Armónicos
      const osc2 = this.audioContext.createOscillator();
      osc2.frequency.value = baseFreq * 2;
      osc2.type = 'sine';

      const osc3 = this.audioContext.createOscillator();
      osc3.frequency.value = baseFreq * 3;
      osc3.type = 'sine';

      const gain = this.audioContext.createGain();
      const now = this.audioContext.currentTime;

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 8);

      osc1.connect(gain);
      osc2.connect(gain);
      osc3.connect(gain);
      gain.connect(this.ambientGain);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      osc1.stop(now + 8);
      osc2.stop(now + 8);
      osc3.stop(now + 8);

      // Siguiente cuenco en 6-15 segundos
      if (this.ambientEnabled && this.isRunning) {
        setTimeout(playBowl, 6000 + Math.random() * 9000);
      }
    };

    // Iniciar primer cuenco
    playBowl();
  }

  /**
   * Ruido blanco simple
   */
  createWhiteNoiseSound() {
    this.ambientNodes = [];

    const noiseBuffer = this.createNoiseBuffer(2);
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    // Filtro suave
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 8000;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.value = 0.2;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ambientGain);
    noise.start();

    this.ambientNodes.push(noise, filter, noiseGain);
  }

  /**
   * Sonido de ballenas (sintetizado con Web Audio API para máxima compatibilidad)
   * Crea sonidos submarinos evocadores de cantos de ballenas
   */
  createWhaleSound() {
    this.ambientNodes = [];

    // Crear sonido de ballena sintetizado usando Web Audio API
    // Esto evita problemas de CORS y garantiza compatibilidad

    // Función para crear un "canto" de ballena
    const createWhaleCall = (startTime, baseFreq, duration) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      // Frecuencia base baja como las ballenas reales (20-200 Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, startTime);

      // Modulación de frecuencia característica del canto de ballena
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.5, startTime + duration * 0.3);
      osc.frequency.linearRampToValueAtTime(baseFreq * 0.7, startTime + duration * 0.6);
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.2, startTime + duration);

      // Filtro pasa-bajos para sonido submarino
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 2;

      // Envelope de volumen suave
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.5);
      gain.gain.setValueAtTime(0.15, startTime + duration - 0.5);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);

      osc.start(startTime);
      osc.stop(startTime + duration);

      this.ambientNodes.push(osc, filter, gain);
    };

    // Crear ruido de fondo submarino
    const bufferSize = this.audioContext.sampleRate * 2;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.03;
    }

    const underwaterNoise = this.audioContext.createBufferSource();
    underwaterNoise.buffer = noiseBuffer;
    underwaterNoise.loop = true;

    const underwaterFilter = this.audioContext.createBiquadFilter();
    underwaterFilter.type = 'lowpass';
    underwaterFilter.frequency.value = 200;

    const underwaterGain = this.audioContext.createGain();
    underwaterGain.gain.value = 0.3;

    underwaterNoise.connect(underwaterFilter);
    underwaterFilter.connect(underwaterGain);
    underwaterGain.connect(this.ambientGain);
    underwaterNoise.start();

    this.ambientNodes.push(underwaterNoise, underwaterFilter, underwaterGain);

    // Programar cantos de ballena repetitivos
    const scheduleWhaleCalls = () => {
      if (!this.ambientPlaying || this.ambientType !== 'whales') return;

      const now = this.audioContext.currentTime;

      // Canto principal (frecuencia baja)
      createWhaleCall(now + Math.random() * 2, 80 + Math.random() * 40, 4 + Math.random() * 3);

      // Respuesta (frecuencia ligeramente diferente)
      createWhaleCall(now + 3 + Math.random() * 2, 100 + Math.random() * 50, 3 + Math.random() * 2);

      // Canto largo ocasional
      if (Math.random() > 0.5) {
        createWhaleCall(now + 7 + Math.random() * 3, 60 + Math.random() * 30, 6 + Math.random() * 4);
      }

      // Programar siguiente ciclo
      this.whaleCallTimeout = setTimeout(scheduleWhaleCalls, 12000 + Math.random() * 8000);
    };

    // Iniciar ciclo de cantos
    scheduleWhaleCalls();

    console.log('[PracticeTimer] Reproduciendo sonido sintetizado de ballenas');
  }

  /**
   * Detiene el sonido de ballenas si está reproduciéndose
   */
  stopWhaleAudio() {
    // Limpiar timeout de cantos programados
    if (this.whaleCallTimeout) {
      clearTimeout(this.whaleCallTimeout);
      this.whaleCallTimeout = null;
    }
  }

  /**
   * Ajusta el volumen del sonido ambiente
   */
  setAmbientVolume(volume) {
    this.ambientVolume = Math.max(0, Math.min(1, volume));
    if (this.ambientGain) {
      this.ambientGain.gain.value = this.ambientVolume;
    }
    this.saveAmbientPreferences();
  }

  /**
   * Cambia el tipo de sonido ambiente
   */
  setAmbientType(type) {
    this.ambientType = type;
    this.saveAmbientPreferences();

    // Reiniciar si está reproduciendo
    if (this.ambientEnabled && this.isRunning) {
      this.stopAmbientSound();
      this.startAmbientSound();
    }

    this.updateAmbientUI();
  }

  /**
   * Activa/desactiva el sonido ambiente
   */
  toggleAmbient() {
    this.ambientEnabled = !this.ambientEnabled;
    this.saveAmbientPreferences();

    if (this.ambientEnabled && this.isRunning) {
      this.startAmbientSound();
    } else {
      this.stopAmbientSound();
    }

    this.updateAmbientUI();
    console.log('[PracticeTimer] Sonido ambiente:', this.ambientEnabled ? 'ON' : 'OFF');
  }

  /**
   * Actualiza la UI de sonido ambiente
   */
  updateAmbientUI() {
    const btn = document.getElementById('timer-ambient-toggle');
    const panel = document.getElementById('timer-ambient-panel');
    const volumeSlider = document.getElementById('timer-ambient-volume');

    if (btn) {
      if (this.ambientEnabled) {
        btn.classList.remove('border-slate-700');
        btn.classList.add('border-emerald-500', 'bg-emerald-500/10');
        btn.querySelector('.ambient-label').textContent = 'Ambiente ON';
        btn.querySelector('.ambient-label').classList.add('text-emerald-400');
        btn.querySelector('.ambient-label').classList.remove('text-gray-400');
      } else {
        btn.classList.add('border-slate-700');
        btn.classList.remove('border-emerald-500', 'bg-emerald-500/10');
        btn.querySelector('.ambient-label').textContent = 'Ambiente';
        btn.querySelector('.ambient-label').classList.remove('text-emerald-400');
        btn.querySelector('.ambient-label').classList.add('text-gray-400');
      }
    }

    if (panel) {
      if (this.ambientEnabled) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    }

    if (volumeSlider) {
      volumeSlider.value = this.ambientVolume * 100;
    }

    // Actualizar botones de tipo de sonido
    document.querySelectorAll('.ambient-type-btn').forEach(b => {
      if (b.dataset.type === this.ambientType) {
        b.classList.remove('bg-slate-700');
        b.classList.add('bg-emerald-600');
      } else {
        b.classList.add('bg-slate-700');
        b.classList.remove('bg-emerald-600');
      }
    });
  }

  /**
   * Inicializa el TTS Manager
   */
  initTTS() {
    if (window.TTSManager && !this.ttsManager) {
      this.ttsManager = new window.TTSManager();
      // Cargar preferencia guardada
      this.ttsEnabled = localStorage.getItem('practice-timer-tts') === 'true';
      this.ttsSpeed = parseFloat(localStorage.getItem('practice-timer-tts-speed')) || 0.9;
      console.log('[PracticeTimer] TTS inicializado, enabled:', this.ttsEnabled);
    }
  }

  /**
   * Inicializa el timer
   */
  init() {
    this.createModal();
    this.initTTS();
    console.log('[PracticeTimer] Inicializado');
  }

  /**
   * Crea el modal del timer
   */
  createModal() {
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
                <h2 id="timer-practice-title" class="text-lg font-bold text-white">Práctica</h2>
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
                Instrucción del paso actual...
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
              <!-- Botón de Narración TTS -->
              <button id="timer-audio-toggle" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors" aria-label="Activar/Desactivar narración">
                <svg id="timer-audio-icon-off" class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
                </svg>
                <svg id="timer-audio-icon-on" class="w-5 h-5 text-violet-400 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                </svg>
                <span id="timer-audio-label" class="text-sm text-gray-400">Narración</span>
              </button>

              <!-- Botón de Sonido Ambiente -->
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
                <button class="speed-btn px-2 py-1 text-xs rounded bg-slate-700 hover:bg-violet-600 transition-colors" data-speed="1.1">Rápida</button>
              </div>

              <!-- Panel de Sonido Ambiente -->
              <div id="timer-ambient-panel" class="hidden p-3 rounded-xl bg-slate-800 border border-slate-700">
                <div class="flex flex-wrap items-center justify-center gap-2 mb-3">
                  <button class="ambient-type-btn px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1" data-type="nature">
                    <span>🌿</span> Naturaleza
                  </button>
                  <button class="ambient-type-btn px-3 py-1.5 text-xs rounded-lg bg-slate-700 hover:bg-emerald-600 transition-colors flex items-center gap-1" data-type="rain">
                    <span>🌧️</span> Lluvia
                  </button>
                  <button class="ambient-type-btn px-3 py-1.5 text-xs rounded-lg bg-slate-700 hover:bg-emerald-600 transition-colors flex items-center gap-1" data-type="ocean">
                    <span>🌊</span> Océano
                  </button>
                  <button class="ambient-type-btn px-3 py-1.5 text-xs rounded-lg bg-slate-700 hover:bg-emerald-600 transition-colors flex items-center gap-1" data-type="bowls">
                    <span>🔔</span> Cuencos
                  </button>
                  <button class="ambient-type-btn px-3 py-1.5 text-xs rounded-lg bg-slate-700 hover:bg-emerald-600 transition-colors flex items-center gap-1" data-type="whitenoise">
                    <span>📻</span> Ruido blanco
                  </button>
                  <button class="ambient-type-btn px-3 py-1.5 text-xs rounded-lg bg-slate-700 hover:bg-emerald-600 transition-colors flex items-center gap-1" data-type="whales">
                    <span>🐋</span> Ballenas
                  </button>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-gray-500">Volumen:</span>
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
    this.modalElement = document.getElementById('practice-timer-modal');
    this.attachEventListeners();
  }

  /**
   * Configura los event listeners
   */
  attachEventListeners() {
    document.getElementById('timer-close')?.addEventListener('click', () => this.stop());
    document.getElementById('timer-play-pause')?.addEventListener('click', () => this.togglePause());
    document.getElementById('timer-prev')?.addEventListener('click', () => this.previousStep());
    document.getElementById('timer-next')?.addEventListener('click', () => this.nextStep());

    // Audio controls (TTS)
    document.getElementById('timer-audio-toggle')?.addEventListener('click', () => this.toggleTTS());
    document.getElementById('timer-read-step')?.addEventListener('click', () => this.speakCurrentStep());

    // Speed buttons
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const speed = parseFloat(e.target.dataset.speed);
        this.setTTSSpeed(speed);
        // Update button styles
        document.querySelectorAll('.speed-btn').forEach(b => {
          b.classList.remove('bg-violet-600');
          b.classList.add('bg-slate-700');
        });
        e.target.classList.remove('bg-slate-700');
        e.target.classList.add('bg-violet-600');
      });
    });

    // Ambient sound controls
    document.getElementById('timer-ambient-toggle')?.addEventListener('click', () => this.toggleAmbient());

    // Ambient type buttons
    document.querySelectorAll('.ambient-type-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.currentTarget.dataset.type;
        this.setAmbientType(type);
      });
    });

    // Ambient volume slider
    const volumeSlider = document.getElementById('timer-ambient-volume');
    const volumeLabel = document.getElementById('timer-ambient-volume-label');
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value) / 100;
        this.setAmbientVolume(volume);
        if (volumeLabel) {
          volumeLabel.textContent = `${e.target.value}%`;
        }
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.isRunning) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          this.togglePause();
          break;
        case 'ArrowRight':
          this.nextStep();
          break;
        case 'ArrowLeft':
          this.previousStep();
          break;
        case 'Escape':
          this.stop();
          break;
        case 'a':
        case 'A':
          this.toggleTTS();
          break;
        case 'r':
        case 'R':
          this.speakCurrentStep();
          break;
        case 'm':
        case 'M':
          this.toggleAmbient();
          break;
      }
    });
  }

  /**
   * Inicia el timer con una práctica
   */
  start(practice) {
    if (!practice || !practice.steps || practice.steps.length === 0) {
      console.error('[PracticeTimer] Práctica inválida');
      return;
    }

    this.currentPractice = practice;
    this.currentStepIndex = 0;
    this.completedSteps = [];
    this.isRunning = true;
    this.isPaused = false;

    // Mostrar modal
    this.modalElement?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Actualizar UI inicial
    this.updateHeader();
    this.renderStepsProgress();
    this.updateAudioUI();
    this.updateAmbientUI();
    this.loadCurrentStep();

    // Reproducir sonido inicial
    this.playBell();

    // Iniciar sonido ambiente si está activado
    if (this.ambientEnabled) {
      setTimeout(() => this.startAmbientSound(), 500);
    }

    // Leer el primer paso si TTS está activado
    if (this.ttsEnabled && this.autoReadSteps) {
      setTimeout(() => this.speakCurrentStep(), 1500);
    }

    console.log('[PracticeTimer] Iniciando práctica:', practice.title);
  }

  /**
   * Actualiza el header del modal
   */
  updateHeader() {
    const typeIcons = {
      meditation: '🧘',
      reflection: '📝',
      action: '🎯',
      physical: '🌳'
    };

    document.getElementById('timer-practice-icon').textContent = typeIcons[this.currentPractice.type] || '✨';
    document.getElementById('timer-practice-title').textContent = this.currentPractice.title;
    document.getElementById('timer-practice-duration').textContent = this.currentPractice.duration;
  }

  /**
   * Renderiza los indicadores de progreso de pasos
   */
  renderStepsProgress() {
    const container = document.getElementById('timer-steps-progress');
    if (!container) return;

    container.innerHTML = this.currentPractice.steps.map((step, index) => `
      <div class="step-indicator flex flex-col items-center gap-1">
        <div class="w-3 h-3 rounded-full transition-all ${index < this.currentStepIndex ? 'bg-violet-500' : index === this.currentStepIndex ? 'bg-violet-500 ring-4 ring-violet-500/30' : 'bg-slate-700'
      }"></div>
        <span class="text-xs text-gray-500">${index + 1}</span>
      </div>
    `).join('');
  }

  /**
   * Carga el paso actual
   */
  loadCurrentStep() {
    const step = this.currentPractice.steps[this.currentStepIndex];
    if (!step) return;

    // Parsear duración del paso
    this.secondsRemaining = this.parseDuration(step.duration);
    this.totalSeconds = this.secondsRemaining;

    // Actualizar UI
    document.getElementById('timer-current-step').innerHTML = `
      <p class="text-xl text-white leading-relaxed">
        ${step.text || step}
      </p>
    `;
    document.getElementById('timer-step-label').textContent = `Paso ${this.currentStepIndex + 1} de ${this.currentPractice.steps.length}`;

    this.updateTimerDisplay();
    this.updateProgressCircle();
    this.renderStepsProgress();

    // Iniciar countdown si no está pausado
    if (!this.isPaused) {
      this.startCountdown();
    }
  }

  /**
   * Parsea una duración string a segundos
   * Ajustado para evitar silencios prolongados
   */
  parseDuration(durationStr) {
    if (!durationStr) return 45; // Default 45 segundos (más corto)

    let seconds = 0;

    // Intentar parsear segundos "X seg" o "X segundos" o "Xs"
    const secMatch = durationStr.match(/(\d+)\s*(?:seg|segundos?|s\b)/i);
    if (secMatch) {
      seconds = parseInt(secMatch[1]);
    }
    // Intentar parsear "X min" o "X minutos"
    else {
      const minMatch = durationStr.match(/(\d+)\s*(?:min|minutos?)/i);
      if (minMatch) {
        seconds = parseInt(minMatch[1]) * 60;
      } else {
        // Intentar parsear solo número (asumiendo minutos)
        const minutes = parseInt(durationStr);
        if (!isNaN(minutes)) {
          seconds = minutes * 60;
        } else {
          seconds = 45; // Default
        }
      }
    }

    // Límites para evitar silencios muy largos o muy cortos
    // Mínimo 15 segundos, máximo 5 minutos (300 segundos)
    seconds = Math.max(15, Math.min(300, seconds));

    return seconds;
  }

  /**
   * Inicia el countdown
   */
  startCountdown() {
    this.clearInterval();

    this.timerInterval = setInterval(() => {
      if (this.isPaused) return;

      this.secondsRemaining--;
      this.updateTimerDisplay();
      this.updateProgressCircle();

      if (this.secondsRemaining <= 0) {
        this.playBell();
        this.completedSteps.push(this.currentStepIndex);
        this.stopSpeaking(); // Detener narración del paso anterior

        // Auto-avanzar al siguiente paso
        if (this.currentStepIndex < this.currentPractice.steps.length - 1) {
          this.currentStepIndex++;
          this.loadCurrentStep();

          // Leer el siguiente paso si TTS está activado
          if (this.ttsEnabled && this.autoReadSteps) {
            setTimeout(() => this.speakCurrentStep(), 1000);
          }
        } else {
          // Práctica completada
          this.complete();
        }
      }
    }, 1000);
  }

  /**
   * Actualiza el display del timer
   */
  updateTimerDisplay() {
    const minutes = Math.floor(this.secondsRemaining / 60);
    const seconds = this.secondsRemaining % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    document.getElementById('timer-display').textContent = display;
  }

  /**
   * Actualiza el círculo de progreso
   */
  updateProgressCircle() {
    const circle = document.getElementById('timer-progress-circle');
    if (!circle) return;

    const circumference = 283; // 2 * PI * 45
    const progress = this.secondsRemaining / this.totalSeconds;
    const offset = circumference * (1 - progress);

    circle.style.strokeDashoffset = offset;
  }

  /**
   * Pausa/reanuda el timer
   */
  togglePause() {
    this.isPaused = !this.isPaused;

    const playIcon = document.getElementById('timer-play-icon');
    const pauseIcon = document.getElementById('timer-pause-icon');

    if (this.isPaused) {
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
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.loadCurrentStep();
    }
  }

  /**
   * Va al siguiente paso
   */
  nextStep() {
    if (this.currentStepIndex < this.currentPractice.steps.length - 1) {
      this.completedSteps.push(this.currentStepIndex);
      this.currentStepIndex++;
      this.stopSpeaking(); // Detener narración actual
      this.playBell();
      this.loadCurrentStep();

      // Leer el siguiente paso si TTS está activado
      if (this.ttsEnabled && this.autoReadSteps) {
        setTimeout(() => this.speakCurrentStep(), 1000);
      }
    } else {
      this.complete();
    }
  }

  /**
   * Completa la práctica
   */
  complete() {
    this.clearInterval();
    this.playBell();

    // Mostrar pantalla de completado
    const container = document.getElementById('timer-current-step');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-8">
          <span class="text-6xl mb-6 block animate-bounce">🎉</span>
          <h3 class="text-2xl font-bold text-white mb-4">¡Práctica Completada!</h3>
          ${this.currentPractice.reflection ? `
            <div class="bg-amber-900/20 rounded-xl p-4 mb-6 border border-amber-500/20 text-left">
              <h4 class="text-sm font-semibold text-amber-300 mb-2">Reflexión Final</h4>
              <p class="text-gray-300 italic">${this.currentPractice.reflection}</p>
            </div>
          ` : ''}
          <div class="flex flex-wrap gap-3 justify-center">
            <button id="timer-rate-btn" class="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold text-white transition-all">
              Valorar Práctica
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
    document.getElementById('timer-rate-btn')?.addEventListener('click', () => this.showRating());
    document.getElementById('timer-done-btn')?.addEventListener('click', () => this.stop());
  }

  /**
   * Muestra el diálogo de valoración
   */
  showRating() {
    const container = document.getElementById('timer-current-step');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-4">
          <h3 class="text-xl font-bold text-white mb-4">¿Cómo te fue?</h3>
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
        this.selectedRating = parseInt(e.currentTarget.dataset.rating);
      });
    });

    document.getElementById('save-rating-btn')?.addEventListener('click', () => {
      const notes = document.getElementById('practice-notes')?.value || '';
      this.saveRating(this.selectedRating, notes);
      this.stop();
    });
  }

  /**
   * Guarda la valoración
   */
  saveRating(rating, notes) {
    if (!this.currentPractice) return;

    try {
      const history = JSON.parse(localStorage.getItem('practice-completion-history') || '[]');
      history.push({
        practiceId: this.currentPractice.id,
        practiceTitle: this.currentPractice.title,
        rating: rating,
        notes: notes,
        completedAt: new Date().toISOString()
      });
      localStorage.setItem('practice-completion-history', JSON.stringify(history.slice(-100)));

      if (window.toast) {
        window.toast.show('✅ Práctica guardada', 'success', 2000);
      }
    } catch (error) {
      console.error('[PracticeTimer] Error guardando valoración:', error);
    }
  }

  /**
   * Registra la completitud
   */
  trackCompletion() {
    // Integrar con sistema de achievements si existe
    if (window.achievementSystem) {
      window.achievementSystem.trackPracticeCompleted(this.currentPractice.id);
    }

    // Integrar con streak system si existe
    if (window.streakSystem) {
      window.streakSystem.recordActivity('practice');
    }

    // Integrar con practice recommender si existe
    if (window.practiceRecommender) {
      window.practiceRecommender.markCompleted(this.currentPractice.id);
    }
  }

  // ========================================
  // MÉTODOS DE TTS (NARRACIÓN DE PRÁCTICAS)
  // ========================================

  /**
   * Activa/Desactiva el TTS
   */
  toggleTTS() {
    this.ttsEnabled = !this.ttsEnabled;
    localStorage.setItem('practice-timer-tts', this.ttsEnabled.toString());

    // Actualizar UI
    const iconOn = document.getElementById('timer-audio-icon-on');
    const iconOff = document.getElementById('timer-audio-icon-off');
    const label = document.getElementById('timer-audio-label');
    const speedPanel = document.getElementById('timer-audio-speed');
    const readBtn = document.getElementById('timer-read-step');

    if (this.ttsEnabled) {
      iconOn?.classList.remove('hidden');
      iconOff?.classList.add('hidden');
      label.textContent = 'Narración ON';
      label.classList.remove('text-gray-400');
      label.classList.add('text-violet-400');
      speedPanel?.classList.remove('hidden');
      speedPanel?.classList.add('flex');
      readBtn?.classList.remove('hidden');
      readBtn?.classList.add('flex');

      // Leer paso actual automáticamente
      if (this.autoReadSteps && this.isRunning) {
        setTimeout(() => this.speakCurrentStep(), 500);
      }
    } else {
      iconOn?.classList.add('hidden');
      iconOff?.classList.remove('hidden');
      label.textContent = 'Narración';
      label.classList.add('text-gray-400');
      label.classList.remove('text-violet-400');
      speedPanel?.classList.add('hidden');
      speedPanel?.classList.remove('flex');
      readBtn?.classList.add('hidden');
      readBtn?.classList.remove('flex');

      // Detener narración si está hablando
      this.stopSpeaking();
    }

    console.log('[PracticeTimer] TTS:', this.ttsEnabled ? 'ON' : 'OFF');
  }

  /**
   * Establece la velocidad del TTS
   */
  setTTSSpeed(speed) {
    this.ttsSpeed = speed;
    localStorage.setItem('practice-timer-tts-speed', speed.toString());
    console.log('[PracticeTimer] TTS speed:', speed);
  }

  /**
   * Lee el paso actual en voz alta
   */
  async speakCurrentStep() {
    if (!this.ttsManager || !this.currentPractice) {
      console.warn('[PracticeTimer] TTS no disponible');
      return;
    }

    const step = this.currentPractice.steps[this.currentStepIndex];
    if (!step) return;

    const text = typeof step === 'string' ? step : (step.text || '');
    if (!text) return;

    // Detener narración anterior si existe
    this.stopSpeaking();

    this.isSpeaking = true;
    this.updateSpeakingUI(true);

    try {
      // Preparar texto para meditación (pausas naturales)
      const preparedText = this.prepareTextForMeditation(text);

      await this.ttsManager.speak(preparedText, {
        speed: this.ttsSpeed,
        voice: 'es-ES', // Preferir voz en español
        onEnd: () => {
          this.isSpeaking = false;
          this.updateSpeakingUI(false);
        },
        onError: (error) => {
          console.error('[PracticeTimer] TTS error:', error);
          this.isSpeaking = false;
          this.updateSpeakingUI(false);
        }
      });
    } catch (error) {
      console.error('[PracticeTimer] Error al hablar:', error);
      this.isSpeaking = false;
      this.updateSpeakingUI(false);
    }
  }

  /**
   * Prepara el texto para meditación (añade pausas naturales)
   */
  prepareTextForMeditation(text) {
    // Añadir pausas después de puntos y comas para un ritmo más meditativo
    let prepared = text
      .replace(/\.\s+/g, '... ') // Pausa más larga después de puntos
      .replace(/,\s+/g, ', ') // Pausa corta después de comas
      .replace(/:\s+/g, ': '); // Pausa después de dos puntos

    return prepared;
  }

  /**
   * Detiene la narración actual
   */
  stopSpeaking() {
    if (this.ttsManager) {
      this.ttsManager.stop();
    }
    this.isSpeaking = false;
    this.updateSpeakingUI(false);
  }

  /**
   * Actualiza la UI cuando está hablando
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
    const iconOn = document.getElementById('timer-audio-icon-on');
    const iconOff = document.getElementById('timer-audio-icon-off');
    const label = document.getElementById('timer-audio-label');
    const speedPanel = document.getElementById('timer-audio-speed');
    const readBtn = document.getElementById('timer-read-step');

    if (this.ttsEnabled) {
      iconOn?.classList.remove('hidden');
      iconOff?.classList.add('hidden');
      label.textContent = 'Narración ON';
      label.classList.remove('text-gray-400');
      label.classList.add('text-violet-400');
      speedPanel?.classList.remove('hidden');
      speedPanel?.classList.add('flex');
      readBtn?.classList.remove('hidden');
      readBtn?.classList.add('flex');
    } else {
      iconOn?.classList.add('hidden');
      iconOff?.classList.remove('hidden');
      label.textContent = 'Narración';
      label.classList.add('text-gray-400');
      label.classList.remove('text-violet-400');
      speedPanel?.classList.add('hidden');
      speedPanel?.classList.remove('flex');
      readBtn?.classList.add('hidden');
      readBtn?.classList.remove('flex');
    }

    // Actualizar botón de velocidad seleccionado
    document.querySelectorAll('.speed-btn').forEach(btn => {
      const speed = parseFloat(btn.dataset.speed);
      if (Math.abs(speed - this.ttsSpeed) < 0.05) {
        btn.classList.remove('bg-slate-700');
        btn.classList.add('bg-violet-600');
      } else {
        btn.classList.add('bg-slate-700');
        btn.classList.remove('bg-violet-600');
      }
    });
  }

  /**
   * Detiene el timer y cierra el modal
   */
  stop() {
    this.clearInterval();
    this.isRunning = false;
    this.isPaused = false;
    this.currentPractice = null;
    this.currentStepIndex = 0;

    // Detener narración
    this.stopSpeaking();

    // Detener sonido ambiente
    this.stopAmbientSound();

    this.modalElement?.classList.add('hidden');
    document.body.style.overflow = '';

    // Restaurar controles
    document.getElementById('timer-play-pause')?.classList.remove('hidden');
    document.getElementById('timer-prev')?.classList.remove('hidden');
    document.getElementById('timer-next')?.classList.remove('hidden');
  }

  /**
   * Limpia el interval
   */
  clearInterval() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
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
