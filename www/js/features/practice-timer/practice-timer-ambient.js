/**
 * Practice Timer - Ambient Sounds Module
 * Gestiona los sonidos de fondo para prácticas guiadas
 * @version 2.9.390 - Modularizado
 */

class PracticeTimerAmbient {
  constructor(practiceTimer) {
    this.practiceTimer = practiceTimer;
  }

  // ==========================================================================
  // PREFERENCIAS DE SONIDO AMBIENTE
  // ==========================================================================

  /**
   * Carga preferencias de sonido ambiente
   */
  loadAmbientPreferences() {
    try {
      this.practiceTimer.ambientEnabled = localStorage.getItem('practice-timer-ambient') === 'true';
      this.practiceTimer.ambientVolume = parseFloat(localStorage.getItem('practice-timer-ambient-volume')) || 0.3;
      const saved = localStorage.getItem('practice-timer-active-ambients');
      if (saved) {
        this.practiceTimer.activeAmbients = new Set(JSON.parse(saved));
      }
    } catch (error) {
      logger.warn('[PracticeTimerAmbient] Error cargando preferencias de ambiente');
    }
  }

  /**
   * Guarda preferencias de sonido ambiente
   */
  saveAmbientPreferences() {
    try {
      localStorage.setItem('practice-timer-ambient', this.practiceTimer.ambientEnabled.toString());
      localStorage.setItem('practice-timer-ambient-volume', this.practiceTimer.ambientVolume.toString());
      localStorage.setItem('practice-timer-active-ambients', JSON.stringify([...this.practiceTimer.activeAmbients]));
    } catch (error) {
      logger.warn('[PracticeTimerAmbient] Error guardando preferencias de ambiente');
    }
  }

  // ==========================================================================
  // SONIDO DE CAMPANA
  // ==========================================================================

  /**
   * Carga el sonido de campana
   */
  loadBellSound() {
    try {
      this.practiceTimer.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      logger.warn('[PracticeTimerAmbient] AudioContext no disponible');
    }
  }

  /**
   * Reproduce un sonido de campana
   */
  playBell() {
    if (!this.practiceTimer.audioContext) return;

    try {
      const audioContext = this.practiceTimer.audioContext;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 528; // Frecuencia de "sanacion"
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1.5);
    } catch (error) {
      logger.warn('[PracticeTimerAmbient] Error reproduciendo sonido:', error);
    }
  }

  // ==========================================================================
  // SISTEMA DE SONIDOS DE FONDO (AMBIENT)
  // ==========================================================================

  /**
   * Inicia los sonidos de fondo usando AudioMixer (multi-select)
   */
  async startAmbientSound() {
    if (!this.practiceTimer.ambientEnabled || this.practiceTimer.activeAmbients.size === 0) return;

    try {
      if (!window.audioMixer && window.AudioMixer) {
        logger.log('[PracticeTimerAmbient] Inicializando AudioMixer...');
        window.audioMixer = new window.AudioMixer();
      }

      if (window.audioMixer) {
        logger.log('[PracticeTimerAmbient] Iniciando ambientes:', [...this.practiceTimer.activeAmbients]);

        window.audioMixer.setAmbientVolume(this.practiceTimer.ambientVolume);

        for (const soundName of this.practiceTimer.activeAmbients) {
          await window.audioMixer.addAmbient(soundName);
        }
        this.practiceTimer.usingAudioMixer = true;
        return;
      }

      logger.log('[PracticeTimerAmbient] AudioMixer no disponible');
    } catch (error) {
      logger.warn('[PracticeTimerAmbient] Error iniciando sonido ambiente:', error);
    }
  }

  /**
   * Registra un timeout de ambiente con limite de 30 elementos
   */
  trackAmbientTimeout(timeoutId) {
    if (this.practiceTimer.ambientTimeouts.length >= 30) {
      clearTimeout(this.practiceTimer.ambientTimeouts[0]);
      this.practiceTimer.ambientTimeouts.shift();
    }
    this.practiceTimer.ambientTimeouts.push(timeoutId);
  }

  /**
   * Detiene el sonido de fondo
   */
  async stopAmbientSound() {
    if (this.practiceTimer.ambientTimeouts && this.practiceTimer.ambientTimeouts.length > 0) {
      this.practiceTimer.ambientTimeouts.forEach(id => clearTimeout(id));
      this.practiceTimer.ambientTimeouts = [];
    }

    if (this.practiceTimer.usingAudioMixer && window.audioMixer) {
      try {
        await window.audioMixer.stopAmbient();
      } catch (error) {
        // Ignore stop errors
      }
      this.practiceTimer.usingAudioMixer = false;
    }

    this.stopWhaleAudio();

    if (this.practiceTimer.ambientNodes) {
      this.practiceTimer.ambientNodes.forEach(node => {
        try {
          if (node.stop) node.stop();
          if (node.disconnect) node.disconnect();
        } catch (error) {
          // Ignore node cleanup errors
        }
      });
      this.practiceTimer.ambientNodes = null;
    }
    if (this.practiceTimer.ambientGain) {
      try {
        this.practiceTimer.ambientGain.disconnect();
      } catch (error) {
        // Ignore gain cleanup error
      }
      this.practiceTimer.ambientGain = null;
    }
  }

  // ==========================================================================
  // CREADORES DE SONIDO SINTETIZADO (FALLBACK)
  // ==========================================================================

  /**
   * Crea ruido blanco filtrado (base para varios sonidos)
   */
  createNoiseBuffer(duration = 2) {
    const audioContext = this.practiceTimer.audioContext;
    const bufferSize = audioContext.sampleRate * duration;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  /**
   * Sonido de naturaleza (pajaros + brisa suave)
   */
  createNatureSound() {
    const audioContext = this.practiceTimer.audioContext;
    this.practiceTimer.ambientNodes = [];

    const noiseBuffer = this.createNoiseBuffer(2);
    const noise = audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const lpFilter = audioContext.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.value = 400;

    const hpFilter = audioContext.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.value = 100;

    const noiseGain = audioContext.createGain();
    noiseGain.gain.value = 0.15;

    noise.connect(lpFilter);
    lpFilter.connect(hpFilter);
    hpFilter.connect(noiseGain);
    noiseGain.connect(this.practiceTimer.ambientGain);
    noise.start();

    this.practiceTimer.ambientNodes.push(noise, lpFilter, hpFilter, noiseGain);

    this.startBirdSounds();
  }

  /**
   * Genera sonidos de pajaros periodicos
   */
  startBirdSounds() {
    const audioContext = this.practiceTimer.audioContext;
    const practiceTimer = this.practiceTimer;

    const playBird = () => {
      if (!practiceTimer.ambientEnabled || !practiceTimer.isRunning) return;

      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      const baseFreq = 1500 + Math.random() * 2500;
      osc.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, audioContext.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, audioContext.currentTime + 0.2);
      osc.type = 'sine';

      gain.gain.setValueAtTime(0, audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(0.03, audioContext.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(practiceTimer.ambientGain);
      osc.start();
      osc.stop(audioContext.currentTime + 0.3);

      if (practiceTimer.ambientEnabled && practiceTimer.isRunning) {
        const timeoutId = setTimeout(playBird, 2000 + Math.random() * 6000);
        this.trackAmbientTimeout(timeoutId);
      }
    };

    const initialTimeoutId = setTimeout(playBird, 1000 + Math.random() * 3000);
    this.trackAmbientTimeout(initialTimeoutId);
  }

  /**
   * Sonido de lluvia
   */
  createRainSound() {
    const audioContext = this.practiceTimer.audioContext;
    this.practiceTimer.ambientNodes = [];

    const noiseBuffer = this.createNoiseBuffer(2);
    const noise = audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 0.5;

    const noiseGain = audioContext.createGain();
    noiseGain.gain.value = 0.4;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.practiceTimer.ambientGain);
    noise.start();

    this.practiceTimer.ambientNodes.push(noise, filter, noiseGain);

    this.startRainDrops();
  }

  /**
   * Genera gotas de lluvia ocasionales
   */
  startRainDrops() {
    const audioContext = this.practiceTimer.audioContext;
    const practiceTimer = this.practiceTimer;

    const playDrop = () => {
      if (!practiceTimer.ambientEnabled || !practiceTimer.isRunning) return;

      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.frequency.setValueAtTime(800 + Math.random() * 400, audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
      osc.type = 'sine';

      gain.gain.setValueAtTime(0.05, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(practiceTimer.ambientGain);
      osc.start();
      osc.stop(audioContext.currentTime + 0.1);

      if (practiceTimer.ambientEnabled && practiceTimer.isRunning) {
        const timeoutId = setTimeout(playDrop, 100 + Math.random() * 500);
        this.trackAmbientTimeout(timeoutId);
      }
    };

    const initialTimeoutId = setTimeout(playDrop, 500);
    this.trackAmbientTimeout(initialTimeoutId);
  }

  /**
   * Sonido de olas del oceano
   */
  createOceanSound() {
    const audioContext = this.practiceTimer.audioContext;
    this.practiceTimer.ambientNodes = [];

    const noiseBuffer = this.createNoiseBuffer(4);
    const noise = audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const lpFilter = audioContext.createBiquadFilter();
    lpFilter.type = 'lowpass';
    lpFilter.frequency.value = 800;

    const noiseGain = audioContext.createGain();
    noiseGain.gain.value = 0.3;

    noise.connect(lpFilter);
    lpFilter.connect(noiseGain);
    noiseGain.connect(this.practiceTimer.ambientGain);
    noise.start();

    this.practiceTimer.ambientNodes.push(noise, lpFilter, noiseGain);

    this.startWaves(noiseGain);
  }

  /**
   * Modula el volumen para simular olas
   */
  startWaves(gainNode) {
    const audioContext = this.practiceTimer.audioContext;
    const practiceTimer = this.practiceTimer;

    const wave = () => {
      if (!practiceTimer.ambientEnabled || !practiceTimer.isRunning || !gainNode) return;

      const waveDuration = 4 + Math.random() * 4;
      const now = audioContext.currentTime;

      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.linearRampToValueAtTime(0.4, now + waveDuration * 0.4);
      gainNode.gain.linearRampToValueAtTime(0.15, now + waveDuration);

      if (practiceTimer.ambientEnabled && practiceTimer.isRunning) {
        const timeoutId = setTimeout(wave, waveDuration * 1000);
        this.trackAmbientTimeout(timeoutId);
      }
    };

    wave();
  }

  /**
   * Sonido de cuencos tibetanos
   */
  createBowlsSound() {
    const audioContext = this.practiceTimer.audioContext;
    const practiceTimer = this.practiceTimer;
    this.practiceTimer.ambientNodes = [];

    const playBowl = () => {
      if (!practiceTimer.ambientEnabled || !practiceTimer.isRunning) return;

      const baseFreq = [174, 285, 396, 417, 528, 639][Math.floor(Math.random() * 6)];

      const osc1 = audioContext.createOscillator();
      osc1.frequency.value = baseFreq;
      osc1.type = 'sine';

      const osc2 = audioContext.createOscillator();
      osc2.frequency.value = baseFreq * 2;
      osc2.type = 'sine';

      const osc3 = audioContext.createOscillator();
      osc3.frequency.value = baseFreq * 3;
      osc3.type = 'sine';

      const gain = audioContext.createGain();
      const now = audioContext.currentTime;

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 8);

      osc1.connect(gain);
      osc2.connect(gain);
      osc3.connect(gain);
      gain.connect(practiceTimer.ambientGain);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      osc1.stop(now + 8);
      osc2.stop(now + 8);
      osc3.stop(now + 8);

      if (practiceTimer.ambientEnabled && practiceTimer.isRunning) {
        const timeoutId = setTimeout(playBowl, 6000 + Math.random() * 9000);
        this.trackAmbientTimeout(timeoutId);
      }
    };

    playBowl();
  }

  /**
   * Ruido blanco simple
   */
  createWhiteNoiseSound() {
    const audioContext = this.practiceTimer.audioContext;
    this.practiceTimer.ambientNodes = [];

    const noiseBuffer = this.createNoiseBuffer(2);
    const noise = audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 8000;

    const noiseGain = audioContext.createGain();
    noiseGain.gain.value = 0.2;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.practiceTimer.ambientGain);
    noise.start();

    this.practiceTimer.ambientNodes.push(noise, filter, noiseGain);
  }

  /**
   * Sonido de ballenas (sintetizado con Web Audio API)
   */
  createWhaleSound() {
    const audioContext = this.practiceTimer.audioContext;
    const practiceTimer = this.practiceTimer;
    this.practiceTimer.ambientNodes = [];

    const createWhaleCall = (startTime, baseFreq, duration) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, startTime);

      osc.frequency.linearRampToValueAtTime(baseFreq * 1.5, startTime + duration * 0.3);
      osc.frequency.linearRampToValueAtTime(baseFreq * 0.7, startTime + duration * 0.6);
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.2, startTime + duration);

      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 2;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.5);
      gain.gain.setValueAtTime(0.15, startTime + duration - 0.5);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(practiceTimer.ambientGain);

      osc.start(startTime);
      osc.stop(startTime + duration);

      practiceTimer.ambientNodes.push(osc, filter, gain);
    };

    const bufferSize = audioContext.sampleRate * 2;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.03;
    }

    const underwaterNoise = audioContext.createBufferSource();
    underwaterNoise.buffer = noiseBuffer;
    underwaterNoise.loop = true;

    const underwaterFilter = audioContext.createBiquadFilter();
    underwaterFilter.type = 'lowpass';
    underwaterFilter.frequency.value = 200;

    const underwaterGain = audioContext.createGain();
    underwaterGain.gain.value = 0.3;

    underwaterNoise.connect(underwaterFilter);
    underwaterFilter.connect(underwaterGain);
    underwaterGain.connect(practiceTimer.ambientGain);
    underwaterNoise.start();

    this.practiceTimer.ambientNodes.push(underwaterNoise, underwaterFilter, underwaterGain);

    const scheduleWhaleCalls = () => {
      if (!practiceTimer.ambientPlaying || practiceTimer.ambientType !== 'whales') return;

      const now = audioContext.currentTime;

      createWhaleCall(now + Math.random() * 2, 80 + Math.random() * 40, 4 + Math.random() * 3);
      createWhaleCall(now + 3 + Math.random() * 2, 100 + Math.random() * 50, 3 + Math.random() * 2);

      if (Math.random() > 0.5) {
        createWhaleCall(now + 7 + Math.random() * 3, 60 + Math.random() * 30, 6 + Math.random() * 4);
      }

      practiceTimer.whaleCallTimeout = setTimeout(scheduleWhaleCalls, 12000 + Math.random() * 8000);
    };

    scheduleWhaleCalls();

    logger.log('[PracticeTimerAmbient] Reproduciendo sonido sintetizado de ballenas');
  }

  /**
   * Detiene el sonido de ballenas si esta reproduciendose
   */
  stopWhaleAudio() {
    if (this.practiceTimer.whaleCallTimeout) {
      clearTimeout(this.practiceTimer.whaleCallTimeout);
      this.practiceTimer.whaleCallTimeout = null;
    }
  }

  // ==========================================================================
  // CONTROL DE SONIDO AMBIENTE
  // ==========================================================================

  /**
   * Ajusta el volumen del sonido ambiente
   */
  setAmbientVolume(volume) {
    this.practiceTimer.ambientVolume = Math.max(0, Math.min(1, volume));

    if (this.practiceTimer.usingAudioMixer && window.audioMixer) {
      window.audioMixer.setAmbientVolume(this.practiceTimer.ambientVolume);
    }

    if (this.practiceTimer.ambientGain) {
      this.practiceTimer.ambientGain.gain.value = this.practiceTimer.ambientVolume;
    }

    this.saveAmbientPreferences();
  }

  /**
   * Toggle un sonido ambiente (multi-select) con debounce
   */
  async toggleAmbientType(type) {
    if (this.practiceTimer._isTogglingAmbient) return;
    this.practiceTimer._isTogglingAmbient = true;

    try {
      this.updateAmbientUI();

      if (this.practiceTimer.activeAmbients.has(type)) {
        this.practiceTimer.activeAmbients.delete(type);
        if (window.audioMixer && this.practiceTimer.ambientEnabled) {
          await window.audioMixer.removeAmbient(type);
        }
      } else {
        this.practiceTimer.activeAmbients.add(type);
        if (window.audioMixer && this.practiceTimer.ambientEnabled && this.practiceTimer.isRunning) {
          await window.audioMixer.addAmbient(type);
        }
      }

      this.saveAmbientPreferences();
      this.updateAmbientUI();
    } finally {
      setTimeout(() => { this.practiceTimer._isTogglingAmbient = false; }, 300);
    }
  }

  /**
   * Para todos los sonidos ambiente
   */
  async stopAllAmbients() {
    this.practiceTimer.activeAmbients.clear();
    this.saveAmbientPreferences();
    if (window.audioMixer) {
      await window.audioMixer.stopAmbient();
    }
    this.stopRandomAmbient();
    this.updateAmbientUI();
  }

  // ==========================================================================
  // MODO ALEATORIO DE SONIDOS
  // ==========================================================================

  /**
   * Activa/desactiva el modo aleatorio de sonidos
   */
  toggleRandomAmbient() {
    this.practiceTimer.randomAmbientEnabled = !this.practiceTimer.randomAmbientEnabled;

    if (this.practiceTimer.randomAmbientEnabled) {
      this.startRandomAmbient();
    } else {
      this.stopRandomAmbient();
    }

    this.updateRandomAmbientUI();
  }

  /**
   * Inicia el modo aleatorio
   */
  startRandomAmbient() {
    if (this.practiceTimer.randomAmbientInterval) {
      clearInterval(this.practiceTimer.randomAmbientInterval);
    }

    this.pickRandomSounds();

    this.practiceTimer.randomAmbientInterval = setInterval(() => {
      if (this.practiceTimer.isRunning && !this.practiceTimer.isPaused && this.practiceTimer.ambientEnabled) {
        this.pickRandomSounds();
      }
    }, this.practiceTimer.RANDOM_CHANGE_SECONDS * 1000);

    logger.log('[PracticeTimerAmbient] Modo aleatorio activado, cambio cada', this.practiceTimer.RANDOM_CHANGE_SECONDS, 'segundos');
  }

  /**
   * Detiene el modo aleatorio
   */
  stopRandomAmbient() {
    if (this.practiceTimer.randomAmbientInterval) {
      clearInterval(this.practiceTimer.randomAmbientInterval);
      this.practiceTimer.randomAmbientInterval = null;
    }
    this.practiceTimer.randomAmbientEnabled = false;
    this.updateRandomAmbientUI();
  }

  /**
   * Elige 1-3 sonidos aleatorios y los activa
   */
  async pickRandomSounds() {
    const numSounds = Math.floor(Math.random() * 3) + 1;

    const shuffled = [...this.practiceTimer.allSoundTypes].sort(() => Math.random() - 0.5);

    const selectedSounds = shuffled.slice(0, numSounds);

    logger.log('[PracticeTimerAmbient] Sonidos aleatorios seleccionados:', selectedSounds);

    if (window.audioMixer) {
      await window.audioMixer.stopAmbient();
    }
    this.practiceTimer.activeAmbients.clear();

    for (const sound of selectedSounds) {
      this.practiceTimer.activeAmbients.add(sound);
      if (window.audioMixer && this.practiceTimer.ambientEnabled && this.practiceTimer.isRunning) {
        await window.audioMixer.addAmbient(sound);
      }
    }

    this.saveAmbientPreferences();
    this.updateAmbientUI();
  }

  /**
   * Actualiza UI del boton aleatorio
   */
  updateRandomAmbientUI() {
    const btn = document.getElementById('timer-random-ambient');
    if (btn) {
      if (this.practiceTimer.randomAmbientEnabled) {
        btn.classList.remove('text-cyan-400', 'hover:text-cyan-300');
        btn.classList.add('text-green-400', 'bg-green-900/30', 'px-1', 'rounded');
        btn.textContent = 'Aleatorio ON';
      } else {
        btn.classList.remove('text-green-400', 'bg-green-900/30', 'px-1', 'rounded');
        btn.classList.add('text-cyan-400', 'hover:text-cyan-300');
        btn.textContent = 'Aleatorio';
      }
    }
  }

  // ==========================================================================
  // TOGGLE Y UI DE AMBIENTE
  // ==========================================================================

  /**
   * Activa/desactiva el sonido ambiente
   */
  async toggleAmbient() {
    this.practiceTimer.ambientEnabled = !this.practiceTimer.ambientEnabled;
    this.saveAmbientPreferences();

    if (this.practiceTimer.ambientEnabled && this.practiceTimer.isRunning) {
      await this.startAmbientSound();
    } else {
      await this.stopAmbientSound();
    }

    this.updateAmbientUI();
    logger.log('[PracticeTimerAmbient] Sonido ambiente:', this.practiceTimer.ambientEnabled ? 'ON' : 'OFF');
  }

  /**
   * Actualiza la UI de sonido ambiente
   */
  updateAmbientUI() {
    const btn = document.getElementById('timer-ambient-toggle');
    const panel = document.getElementById('timer-ambient-panel');
    const volumeSlider = document.getElementById('timer-ambient-volume');

    if (btn) {
      if (this.practiceTimer.ambientEnabled) {
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
      if (this.practiceTimer.ambientEnabled) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    }

    if (volumeSlider) {
      volumeSlider.value = this.practiceTimer.ambientVolume * 100;
    }

    document.querySelectorAll('.ambient-type-btn').forEach(b => {
      const type = b.dataset.type;
      if (this.practiceTimer.activeAmbients.has(type)) {
        b.classList.remove('bg-slate-700');
        b.classList.add('bg-emerald-600', 'ring-2', 'ring-emerald-400');
      } else {
        b.classList.add('bg-slate-700');
        b.classList.remove('bg-emerald-600', 'ring-2', 'ring-emerald-400');
      }
    });

    if (btn && this.practiceTimer.ambientEnabled && this.practiceTimer.activeAmbients.size > 0) {
      const label = btn.querySelector('.ambient-label');
      if (label) {
        label.textContent = `Ambiente (${this.practiceTimer.activeAmbients.size})`;
      }
    }
  }

  /**
   * Destruye el modulo y limpia recursos
   */
  destroy() {
    this.stopAmbientSound();
    this.stopRandomAmbient();
  }
}

// Exportar globalmente
window.PracticeTimerAmbient = PracticeTimerAmbient;
