/**
 * Sistema de Providers TTS
 * Arquitectura modular para múltiples motores de síntesis de voz
 */

class TTSProvider {
  constructor() {
    this.currentAudio = null;
    this.isPlaying = false;
    this.isPaused = false;
  }

  async speak(text, options = {}) {
    throw new Error('speak() debe ser implementado por la subclase');
  }

  pause() {
    throw new Error('pause() debe ser implementado por la subclase');
  }

  resume() {
    throw new Error('resume() debe ser implementado por la subclase');
  }

  stop() {
    throw new Error('stop() debe ser implementado por la subclase');
  }

  async getAvailableVoices() {
    throw new Error('getAvailableVoices() debe ser implementado por la subclase');
  }
}

/**
 * Provider para Web Speech API (nativo del navegador)
 */
class BrowserTTSProvider extends TTSProvider {
  constructor() {
    super();
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
  }

  async speak(text, options = {}) {
    const {
      voice = null,
      speed = 1.0,
      pitch = 1.0,
      volume = 0.9,
      onProgress = null,
      onEnd = null,
      onError = null
    } = options;

    return new Promise((resolve, reject) => {
      // Cancelar cualquier síntesis en curso
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Configurar parámetros
      utterance.rate = speed;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Seleccionar voz si se especificó
      if (voice) {
        const voices = this.synth.getVoices();
        const selectedVoice = voices.find(v => v.name === voice || v.lang === voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      // Eventos
      utterance.onstart = () => {
        this.isPlaying = true;
        this.isPaused = false;
      };

      utterance.onend = () => {
        this.isPlaying = false;
        this.isPaused = false;
        if (onEnd) onEnd();
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('Browser TTS error:', event);
        this.isPlaying = false;
        this.isPaused = false;
        if (onError) onError(event);
        reject(event);
      };

      // Simular progreso (Web Speech API no tiene progreso real)
      if (onProgress) {
        const estimatedDuration = text.length / 10; // ~10 caracteres por segundo
        let elapsed = 0;
        const progressInterval = setInterval(() => {
          if (!this.isPlaying) {
            clearInterval(progressInterval);
            return;
          }
          elapsed += 0.1;
          onProgress(elapsed, estimatedDuration);
        }, 100);
      }

      // Iniciar síntesis
      this.synth.speak(utterance);
    });
  }

  pause() {
    if (this.isPlaying && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
    }
  }

  resume() {
    if (this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
    }
  }

  stop() {
    this.synth.cancel();
    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;
  }

  async getAvailableVoices() {
    return new Promise((resolve) => {
      let voices = this.synth.getVoices();

      if (voices.length > 0) {
        resolve(this.formatVoices(voices));
      } else {
        // En algunos navegadores las voces cargan asíncronamente
        this.synth.onvoiceschanged = () => {
          voices = this.synth.getVoices();
          resolve(this.formatVoices(voices));
        };
      }
    });
  }

  formatVoices(voices) {
    // Priorizar voces en español
    const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
    const otherVoices = voices.filter(v => !v.lang.startsWith('es'));

    return [...spanishVoices, ...otherVoices].map(v => ({
      id: v.name,
      name: v.name,
      lang: v.lang,
      gender: this.guessGender(v.name),
      quality: this.guessQuality(v.name)
    }));
  }

  guessGender(name) {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('male') || nameLower.includes('man') ||
        nameLower.includes('sergio') || nameLower.includes('jorge')) {
      return 'male';
    }
    if (nameLower.includes('female') || nameLower.includes('woman') ||
        nameLower.includes('lucia') || nameLower.includes('monica')) {
      return 'female';
    }
    return 'neutral';
  }

  guessQuality(name) {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('google') || nameLower.includes('natural') ||
        nameLower.includes('premium')) {
      return 'high';
    }
    if (nameLower.includes('enhanced') || nameLower.includes('plus')) {
      return 'medium';
    }
    return 'basic';
  }
}

/**
 * Provider para OpenAI TTS API
 */
class OpenAITTSProvider extends TTSProvider {
  constructor() {
    super();
    this.apiKey = null;
    this.baseURL = 'https://api.openai.com/v1/audio/speech';
    this.cache = new Map();
    this.cacheEnabled = true;
  }

  setApiKey(key) {
    this.apiKey = key;
  }

  setCacheEnabled(enabled) {
    this.cacheEnabled = enabled;
  }

  async speak(text, options = {}) {
    const {
      voice = 'nova',
      model = 'tts-1',
      speed = 1.0,
      onProgress = null,
      onEnd = null,
      onError = null
    } = options;

    if (!this.apiKey) {
      const error = new Error('OpenAI API key no configurada');
      if (onError) onError(error);
      throw error;
    }

    try {
      // Generar hash para caché
      const cacheKey = this.getCacheKey(text, voice, speed, model);

      // Verificar caché
      let audioUrl;
      if (this.cacheEnabled && this.cache.has(cacheKey)) {
        // console.log('🎵 Usando audio cacheado');
        audioUrl = this.cache.get(cacheKey);
      } else {
        // Generar audio nuevo
        // console.log('🎙️ Generando audio con OpenAI TTS...');
        audioUrl = await this.generateAudio(text, voice, speed, model);

        // Guardar en caché
        if (this.cacheEnabled) {
          this.cache.set(cacheKey, audioUrl);
          // console.log(`📦 Audio cacheado (${this.cache.size} items en caché)`);
        }
      }

      // Reproducir
      return this.playAudio(audioUrl, onProgress, onEnd, onError);

    } catch (error) {
      console.error('OpenAI TTS error:', error);
      if (onError) onError(error);
      throw error;
    }
  }

  async generateAudio(text, voice, speed, model) {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        voice,
        input: text,
        speed,
        response_format: 'mp3'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Error generando audio';

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch (e) {
        errorMessage = errorText;
      }

      // Errores específicos
      if (response.status === 401) {
        throw new Error('API key inválida o expirada');
      } else if (response.status === 429) {
        throw new Error('Límite de uso alcanzado. Intenta más tarde.');
      } else if (response.status === 402) {
        throw new Error('Sin créditos. Añade saldo a tu cuenta OpenAI.');
      }

      throw new Error(errorMessage);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    return audioUrl;
  }

  playAudio(url, onProgress, onEnd, onError) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      this.currentAudio = audio;
      this.isPlaying = true;
      this.isPaused = false;

      // Progreso
      if (onProgress) {
        audio.addEventListener('timeupdate', () => {
          onProgress(audio.currentTime, audio.duration);
        });
      }

      // Finalización
      audio.addEventListener('ended', () => {
        this.isPlaying = false;
        this.isPaused = false;
        if (onEnd) onEnd();
        resolve();
      });

      // Error
      audio.addEventListener('error', (event) => {
        this.isPlaying = false;
        this.isPaused = false;
        const error = new Error('Error reproduciendo audio');
        if (onError) onError(error);
        reject(error);
      });

      // Reproducir
      audio.play().catch(error => {
        this.isPlaying = false;
        if (onError) onError(error);
        reject(error);
      });
    });
  }

  pause() {
    if (this.currentAudio && this.isPlaying && !this.isPaused) {
      this.currentAudio.pause();
      this.isPaused = true;
    }
  }

  resume() {
    if (this.currentAudio && this.isPaused) {
      this.currentAudio.play();
      this.isPaused = false;
    }
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
    this.isPaused = false;
  }

  getCacheKey(text, voice, speed, model) {
    // Hash simple para caché (primeros 100 caracteres + parámetros)
    const textHash = text.substring(0, 100).replace(/\s+/g, '_');
    return `${model}-${voice}-${speed}-${textHash}`;
  }

  async getAvailableVoices() {
    return [
      {
        id: 'nova',
        name: 'Nova (Femenina) ⭐',
        gender: 'female',
        quality: 'premium',
        recommended: true
      },
      {
        id: 'alloy',
        name: 'Alloy (Neutral)',
        gender: 'neutral',
        quality: 'premium'
      },
      {
        id: 'echo',
        name: 'Echo (Masculina)',
        gender: 'male',
        quality: 'premium'
      },
      {
        id: 'fable',
        name: 'Fable (Neutral)',
        gender: 'neutral',
        quality: 'premium'
      },
      {
        id: 'onyx',
        name: 'Onyx (Masculina)',
        gender: 'male',
        quality: 'premium'
      },
      {
        id: 'shimmer',
        name: 'Shimmer (Femenina)',
        gender: 'female',
        quality: 'premium'
      }
    ];
  }

  clearCache() {
    // Liberar URLs de objetos
    this.cache.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        // console.warn('Error revocando URL:', e);
      }
    });
    this.cache.clear();
    // console.log('🗑️ Caché de audio limpiado');
  }

  getCacheSize() {
    return this.cache.size;
  }
}


/**
 * Manager de TTS que gestiona múltiples providers
 */
class TTSManager {
  constructor() {
    this.providers = {
      browser: new BrowserTTSProvider(),
      openai: new OpenAITTSProvider(),
      elevenlabs: null // Se inicializa lazy si está disponible
    };

    // Cargar configuración guardada
    this.currentProvider = localStorage.getItem('tts-provider') || 'browser';
    const openaiKey = localStorage.getItem('openai-tts-key');
    if (openaiKey) {
      this.providers.openai.setApiKey(openaiKey);
    }

    const cacheEnabled = localStorage.getItem('tts-cache-enabled') !== 'false';
    this.providers.openai.setCacheEnabled(cacheEnabled);

    // Inicializar ElevenLabs si está disponible
    this.initElevenLabs();
  }

  /**
   * Inicializar ElevenLabs provider (lazy loading)
   */
  initElevenLabs() {
    if (typeof window.ElevenLabsTTSProvider !== 'undefined') {
      this.providers.elevenlabs = new window.ElevenLabsTTSProvider();
      const elevenLabsKey = localStorage.getItem('elevenlabs-tts-key');
      if (elevenLabsKey) {
        this.providers.elevenlabs.setApiKey(elevenLabsKey);
      }
      const cacheEnabled = localStorage.getItem('tts-cache-enabled') !== 'false';
      this.providers.elevenlabs.setCacheEnabled(cacheEnabled);
      console.log('✅ ElevenLabs TTS provider inicializado');
    } else {
      // Reintentar después de que carguen todos los scripts
      setTimeout(() => {
        if (typeof window.ElevenLabsTTSProvider !== 'undefined' && !this.providers.elevenlabs) {
          this.initElevenLabs();
        }
      }, 1000);
    }
  }

  setProvider(providerName) {
    if (!this.providers[providerName]) {
      throw new Error(`Provider ${providerName} no existe`);
    }
    this.currentProvider = providerName;
    localStorage.setItem('tts-provider', providerName);
  }

  getProvider(providerName = null) {
    const name = providerName || this.currentProvider;
    return this.providers[name];
  }

  getCurrentProviderName() {
    return this.currentProvider;
  }

  async speak(text, options = {}) {
    const provider = this.getProvider();

    try {
      return await provider.speak(text, options);
    } catch (error) {
      console.error(`Error con provider ${this.currentProvider}:`, error);

      // Fallback automático a navegador si no estamos ya usándolo
      if (this.currentProvider !== 'browser') {
        // console.warn('⚠️ Fallback a navegador');
        const browserProvider = this.providers.browser;
        return await browserProvider.speak(text, options);
      }

      throw error;
    }
  }

  pause() {
    const provider = this.getProvider();
    provider.pause();
  }

  resume() {
    const provider = this.getProvider();
    provider.resume();
  }

  stop() {
    const provider = this.getProvider();
    provider.stop();
  }

  async getAvailableVoices(providerName = null) {
    const provider = this.getProvider(providerName);
    return await provider.getAvailableVoices();
  }

  isPlaying() {
    const provider = this.getProvider();
    return provider.isPlaying;
  }

  isPaused() {
    const provider = this.getProvider();
    return provider.isPaused;
  }

  setOpenAIKey(key) {
    this.providers.openai.setApiKey(key);
    localStorage.setItem('openai-tts-key', key);
  }

  getOpenAIKey() {
    return localStorage.getItem('openai-tts-key');
  }

  setHuggingFaceKey(key) {
    if (this.providers.huggingface) {
      this.providers.huggingface.setApiKey(key);
    }
    localStorage.setItem('huggingface-tts-key', key);
  }

  getHuggingFaceKey() {
    return localStorage.getItem('huggingface-tts-key');
  }

  setElevenLabsKey(key) {
    if (this.providers.elevenlabs) {
      this.providers.elevenlabs.setApiKey(key);
    }
    localStorage.setItem('elevenlabs-tts-key', key);
  }

  getElevenLabsKey() {
    return localStorage.getItem('elevenlabs-tts-key');
  }

  setCacheEnabled(enabled) {
    this.providers.openai.setCacheEnabled(enabled);
    if (this.providers.huggingface) {
      this.providers.huggingface.setCacheEnabled(enabled);
    }
    if (this.providers.elevenlabs) {
      this.providers.elevenlabs.setCacheEnabled(enabled);
    }
    localStorage.setItem('tts-cache-enabled', enabled.toString());
  }

  clearCache() {
    this.providers.openai.clearCache();
    if (this.providers.huggingface) {
      this.providers.huggingface.clearCache();
    }
    if (this.providers.elevenlabs) {
      this.providers.elevenlabs.clearCache();
    }
  }

  getCacheSize() {
    let total = this.providers.openai.getCacheSize();
    if (this.providers.elevenlabs) {
      total += this.providers.elevenlabs.cache.size;
    }
    return total;
  }

  /**
   * Verificar si ElevenLabs está disponible (provider + premium)
   */
  isElevenLabsAvailable() {
    if (!this.providers.elevenlabs) return false;
    if (typeof window.aiPremium !== 'undefined') {
      return window.aiPremium.hasFeature('elevenlabs_tts');
    }
    return false;
  }

  /**
   * Obtener voces de ElevenLabs
   */
  async getElevenLabsVoices() {
    if (this.providers.elevenlabs) {
      return await this.providers.elevenlabs.getAvailableVoices();
    }
    return [];
  }
}

// Exportar
window.TTSProvider = TTSProvider;
window.BrowserTTSProvider = BrowserTTSProvider;
window.OpenAITTSProvider = OpenAITTSProvider;
window.TTSManager = TTSManager;
