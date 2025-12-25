// ============================================================================
// BACKGROUND AUDIO HELPER
// ============================================================================
// Sistema para mantener el audio activo cuando la pantalla está apagada.
// - En Android/Capacitor: Usa Foreground Service nativo
// - En Web: Usa Audio silencioso + Media Session API como "ancla"

class BackgroundAudioHelper {
  constructor() {
    this.isActive = false;
    this.pausedByFocus = false;

    // Detectar plataforma
    this.isCapacitor = !!(window.Capacitor && window.Capacitor.isNative);
    this.isAndroid = this.isCapacitor && window.Capacitor.getPlatform() === 'android';

    // Plugin nativo de Capacitor
    this.nativePlugin = null;

    // Para web: audio silencioso
    this.silentAudio = null;
    this.audioContext = null;
    this.silentOscillator = null;
    this.silentGain = null;

    // Metadata para Media Session
    this.currentTitle = 'Colección Nuevo Ser';
    this.currentChapter = '';

    this.init();
  }

  async init() {
    if (this.isCapacitor) {
      // Intentar obtener el plugin nativo
      try {
        if (window.Capacitor.Plugins && window.Capacitor.Plugins.BackgroundAudio) {
          this.nativePlugin = window.Capacitor.Plugins.BackgroundAudio;
          console.log('BackgroundAudioHelper: Plugin nativo disponible');
          if (this.nativePlugin.addListener) {
            this.nativePlugin.addListener('event', (data) => {
              this.handleNativeEvent(data);
            });
          }
        }
      } catch (error) {
        console.warn('BackgroundAudioHelper: Plugin nativo no disponible', error);
      }
    }

    // Configurar Media Session API (funciona en ambas plataformas)
    this.setupMediaSession();
  }

  handleNativeEvent(data) {
    const type = data?.type;
    if (!type) return;

    if (type === 'noisy' || type === 'focus-loss' || type === 'focus-loss-transient') {
      if (window.audioReader && window.audioReader.isPlaying && !window.audioReader.isPaused) {
        this.pausedByFocus = true;
        window.audioReader.pause();
      }
      this.dispatchEvent('backgroundaudio:pause');
      return;
    }

    if (type === 'focus-gain') {
      if (this.pausedByFocus && window.audioReader && window.audioReader.isPaused) {
        window.audioReader.resume();
      }
      this.pausedByFocus = false;
      this.dispatchEvent('backgroundaudio:play');
    }
  }

  // ==========================================================================
  // MEDIA SESSION API
  // ==========================================================================

  setupMediaSession() {
    if (!('mediaSession' in navigator)) {
      console.warn('BackgroundAudioHelper: Media Session API no disponible');
      return;
    }

    // 🔧 FIX #52: Limpiar handlers existentes antes de registrar nuevos para evitar duplicación
    this.clearMediaSession();

    // Configurar metadata inicial
    navigator.mediaSession.metadata = new MediaMetadata({
      title: this.currentTitle,
      artist: 'Colección Nuevo Ser',
      album: 'Audiolibro'
    });

    // Configurar handlers para controles de medios
    navigator.mediaSession.setActionHandler('play', () => {
      this.dispatchEvent('backgroundaudio:play');
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      this.dispatchEvent('backgroundaudio:pause');
    });

    navigator.mediaSession.setActionHandler('stop', () => {
      this.dispatchEvent('backgroundaudio:stop');
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      this.dispatchEvent('backgroundaudio:previous');
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      this.dispatchEvent('backgroundaudio:next');
    });
  }

  // 🔧 FIX #52: Limpiar handlers de Media Session API
  clearMediaSession() {
    if ('mediaSession' in navigator) {
      try {
        // Limpiar metadata
        navigator.mediaSession.metadata = null;

        // Limpiar todos los action handlers
        const actions = ['play', 'pause', 'stop', 'previoustrack', 'nexttrack', 'seekbackward', 'seekforward'];
        actions.forEach(action => {
          try {
            navigator.mediaSession.setActionHandler(action, null);
          } catch (e) {
            // Ignorar errores (algunos actions pueden no estar soportados)
          }
        });

        console.log('[BackgroundAudioHelper] Media Session limpiada');
      } catch (error) {
        console.warn('[BackgroundAudioHelper] Error limpiando Media Session:', error);
      }
    }
  }

  updateMediaSessionMetadata(title, chapter) {
    if (!('mediaSession' in navigator)) return;

    this.currentTitle = title || this.currentTitle;
    this.currentChapter = chapter || this.currentChapter;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: this.currentChapter || this.currentTitle,
      artist: 'Colección Nuevo Ser',
      album: this.currentTitle
    });
  }

  setMediaSessionPlaybackState(state) {
    if (!('mediaSession' in navigator)) return;

    // state puede ser: 'playing', 'paused', 'none'
    navigator.mediaSession.playbackState = state;
  }

  // ==========================================================================
  // AUDIO SILENCIOSO (Para Web)
  // ==========================================================================

  async createSilentAudio() {
    try {
      // Crear AudioContext si no existe o fue cerrado
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioContextClass();
      }

      // Configurar oscilador si fue destruido
      if (!this.silentOscillator || !this.silentGain) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        gainNode.gain.value = 0.001;
        oscillator.frequency.value = 1; // 1 Hz, inaudible

        oscillator.start();
        this.silentOscillator = oscillator;
        this.silentGain = gainNode;
      }

      // Crear elemento de audio si no existe todavía
      if (!this.silentAudio) {
        this.silentAudio = document.createElement('audio');
        this.silentAudio.id = 'background-audio-anchor';
        this.silentAudio.loop = true;
        this.silentAudio.volume = 0.01;

        const silentWav = this.generateSilentWav();
        this.silentAudio.src = silentWav;
        document.body.appendChild(this.silentAudio);
      }

      console.log('BackgroundAudioHelper: Audio silencioso preparado');
    } catch (error) {
      console.warn('BackgroundAudioHelper: Error creando audio silencioso', error);
    }
  }

  generateSilentWav() {
    // Generar un archivo WAV silencioso de 1 segundo (44100 Hz, mono, 16-bit)
    const sampleRate = 44100;
    const duration = 1; // 1 segundo
    const numSamples = sampleRate * duration;
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const headerSize = 44;
    const fileSize = headerSize + dataSize;

    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    // RIFF header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, fileSize - 8, true);
    this.writeString(view, 8, 'WAVE');

    // fmt chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Los datos son todo ceros (silencio), ya inicializados por ArrayBuffer

    // Convertir a base64 data URL
    const uint8Array = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return 'data:audio/wav;base64,' + btoa(binary);
  }

  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  async startSilentAudio() {
    if (!this.silentAudio || !this.silentOscillator || !this.silentGain) {
      await this.createSilentAudio();
    }

    if (this.silentAudio) {
      try {
        await this.silentAudio.play();
        console.log('BackgroundAudioHelper: Audio silencioso iniciado');
      } catch (error) {
        console.warn('BackgroundAudioHelper: Error iniciando audio silencioso', error);
      }
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  stopSilentAudio() {
    if (this.silentAudio) {
      this.silentAudio.pause();
      console.log('BackgroundAudioHelper: Audio silencioso detenido');
    }

    if (this.silentOscillator) {
      try {
        this.silentOscillator.stop();
      } catch (error) {
        console.warn('BackgroundAudioHelper: Error deteniendo oscilador', error);
      }
      try {
        this.silentOscillator.disconnect();
      } catch {
        // ignore disconnect errors
      }
      this.silentOscillator = null;
    }

    if (this.silentGain) {
      try {
        this.silentGain.disconnect();
      } catch {
        // ignore
      }
      this.silentGain = null;
    }

    if (this.audioContext) {
      this.audioContext.suspend().catch((error) => {
        console.warn('BackgroundAudioHelper: Error suspendiendo AudioContext', error);
      });
    }
  }

  // ==========================================================================
  // API PRINCIPAL
  // ==========================================================================

  async start(options = {}) {
    const { title, chapter } = options;

    try {
      // Actualizar metadata
      this.updateMediaSessionMetadata(title, chapter);
      this.setMediaSessionPlaybackState('playing');

      if (this.isAndroid && this.nativePlugin) {
        // Android: Usar Foreground Service nativo
        const result = await this.nativePlugin.start();
        console.log('BackgroundAudioHelper: Foreground Service iniciado', result);
      } else {
        // Web: Usar audio silencioso como ancla
        await this.startSilentAudio();
      }

      this.isActive = true;
      return { success: true };
    } catch (error) {
      console.error('BackgroundAudioHelper: Error al iniciar', error);
      return { success: false, error: error.message };
    }
  }

  async stop() {
    if (!this.isActive) return { success: true, alreadyInactive: true };

    try {
      this.setMediaSessionPlaybackState('none');

      if (this.isAndroid && this.nativePlugin) {
        // Android: Detener Foreground Service
        const result = await this.nativePlugin.stop();
        console.log('BackgroundAudioHelper: Foreground Service detenido', result);
      } else {
        // Web: Detener audio silencioso
        this.stopSilentAudio();
      }

      this.isActive = false;
      return { success: true };
    } catch (error) {
      console.error('BackgroundAudioHelper: Error al detener', error);
      return { success: false, error: error.message };
    }
  }

  async pause() {
    this.setMediaSessionPlaybackState('paused');
    // No detenemos el servicio/audio silencioso para permitir reanudar
  }

  async resume() {
    this.setMediaSessionPlaybackState('playing');

    // Asegurarse de que el audio silencioso siga reproduciéndose
    if (!this.isAndroid && this.silentAudio && this.silentAudio.paused) {
      await this.startSilentAudio();
    }
  }

  isRunning() {
    return this.isActive;
  }

  // Emitir eventos personalizados
  dispatchEvent(eventName) {
    const event = new CustomEvent(eventName);
    window.dispatchEvent(event);
  }

  // Cleanup
  destroy() {
    this.stop();

    if (this.silentAudio && this.silentAudio.parentNode) {
      this.silentAudio.parentNode.removeChild(this.silentAudio);
      this.silentAudio = null;
    }

    // 🔧 FIX #61: Cerrar AudioContext correctamente con manejo de promesa
    if (this.audioContext) {
      this.audioContext.close().then(() => {
        console.log('[BackgroundAudioHelper] AudioContext cerrado correctamente');
      }).catch((err) => {
        console.warn('[BackgroundAudioHelper] Error al cerrar AudioContext:', err);
      });
      this.audioContext = null;
    }

    // 🔧 FIX #52: Limpiar Media Session handlers al destruir
    this.clearMediaSession();
  }
}

// Crear instancia global
window.BackgroundAudioHelper = BackgroundAudioHelper;
window.backgroundAudio = new BackgroundAudioHelper();

console.log('BackgroundAudioHelper cargado');
