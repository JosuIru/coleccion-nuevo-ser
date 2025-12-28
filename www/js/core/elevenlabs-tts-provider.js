/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * ElevenLabs TTS Provider
 * Síntesis de voz de alta calidad con voces naturales
 *
 * Soporta dos modos:
 * 1. Edge Function de Supabase (recomendado para Premium) - API key en servidor
 * 2. API key personal del usuario (alternativa)
 *
 * Sistema de caché de 3 niveles:
 * 1. Caché compartido en servidor (Supabase Storage) - todos los usuarios
 * 2. Caché local persistente (Filesystem/IndexedDB) - dispositivo
 * 3. Caché en memoria (sesión actual)
 *
 * @version 3.0.0
 */

class ElevenLabsTTSProvider {
  constructor() {
    this.currentAudio = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.personalApiKey = null;
    this.usePersonalKey = false; // Si true, usa API key personal en vez de Edge Function
    this.baseURL = 'https://api.elevenlabs.io/v1/text-to-speech';
    this.cache = new Map(); // Cache en memoria (sesión)
    this.cacheEnabled = true;
    this.sharedCacheEnabled = true; // Caché compartido en servidor

    // Contexto actual para metadata del caché
    this.currentContext = {
      bookId: null,
      chapterId: null,
      paragraphIndex: null
    };

    // Voces en español disponibles en ElevenLabs
    this.spanishVoices = [
      { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sara', gender: 'female', description: 'Voz femenina clara y natural' },
      { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'male', description: 'Voz masculina profesional' },
      { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'female', description: 'Voz femenina cálida' },
      { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', gender: 'female', description: 'Voz femenina joven' },
      { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', gender: 'female', description: 'Voz femenina expresiva' },
      { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', gender: 'male', description: 'Voz masculina profunda' },
      { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', gender: 'male', description: 'Voz masculina fuerte' },
      { id: 'pMsXgVXv3BLzUgSXRplE', name: 'Serena', gender: 'female', description: 'Voz femenina suave' }
    ];

    // Modelo por defecto (multilingüe para español)
    this.defaultModel = 'eleven_multilingual_v2';

    // Cargar configuración guardada
    this.loadConfig();
  }

  /**
   * Carga configuración desde localStorage
   */
  loadConfig() {
    // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
    try {
      const savedKey = localStorage.getItem('elevenlabs-personal-key');
      if (savedKey) {
        this.personalApiKey = savedKey;
      }
      this.usePersonalKey = localStorage.getItem('elevenlabs-use-personal-key') === 'true';
    } catch (error) {
      console.error('Error cargando configuración de ElevenLabs:', error);
      this.usePersonalKey = false;
    }
  }

  /**
   * Configura la API key personal de ElevenLabs
   */
  setApiKey(key) {
    this.personalApiKey = key;
    // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
    try {
      if (key) {
        localStorage.setItem('elevenlabs-personal-key', key);
      } else {
        localStorage.removeItem('elevenlabs-personal-key');
      }
    } catch (error) {
      console.error('Error guardando API key de ElevenLabs:', error);
      window.toast?.error('Error al guardar API key. Intenta de nuevo.');
    }
  }

  /**
   * Activa/desactiva el uso de API key personal
   */
  setUsePersonalKey(use) {
    this.usePersonalKey = use;
    // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
    try {
      localStorage.setItem('elevenlabs-use-personal-key', use.toString());
    } catch (error) {
      console.error('Error guardando configuración de ElevenLabs:', error);
    }
  }

  /**
   * Verifica si tiene API key personal configurada
   */
  hasPersonalKey() {
    return !!this.personalApiKey;
  }

  /**
   * Habilita/deshabilita el caché de audio
   */
  setCacheEnabled(enabled) {
    this.cacheEnabled = enabled;
  }

  /**
   * Establece el contexto actual para metadata del caché
   */
  setContext(bookId, chapterId, paragraphIndex) {
    this.currentContext = { bookId, chapterId, paragraphIndex };
  }

  /**
   * Obtiene el gestor de caché persistente
   */
  getPersistentCache() {
    return window.audioCacheManager;
  }

  /**
   * Genera un hash del texto para identificación
   */
  hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Busca audio en el caché compartido del servidor
   */
  async checkSharedCache(textHash, voiceId, cacheKey) {
    if (!this.sharedCacheEnabled || !window.supabase) return null;

    try {
      // 🔧 FIX v2.9.197: Security - no hardcoded URLs, use config
      const supabaseUrl = window.supabase.supabaseUrl ||
                          window.supabaseConfig?.url ||
                          localStorage.getItem('supabase-url');

      const functionUrl = `${supabaseUrl}/functions/v1/audio-cache`;
      const params = new URLSearchParams({
        text_hash: textHash,
        voice_id: voiceId,
        cache_key: cacheKey
      });

      const response = await fetch(`${functionUrl}?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.exists && data.url) {
          logger.debug('☁️ ElevenLabs: Audio encontrado en caché compartido');
          return data.url;
        }
      }
    } catch (error) {
      console.warn('Error verificando caché compartido:', error);
    }
    return null;
  }

  /**
   * Sube audio al caché compartido del servidor
   */
  async uploadToSharedCache(audioBlob, cacheKey, textHash, voiceId) {
    if (!this.sharedCacheEnabled || !window.supabase) return;

    try {
      const { data: { session } } = await window.supabase.auth.getSession();
      if (!session) return; // Necesita autenticación

      // 🔧 FIX v2.9.197: Security - no hardcoded URLs, use config
      const supabaseUrl = window.supabase.supabaseUrl ||
                          window.supabaseConfig?.url ||
                          localStorage.getItem('supabase-url');

      const functionUrl = `${supabaseUrl}/functions/v1/audio-cache`;

      const formData = new FormData();
      formData.append('audio', audioBlob, `${cacheKey}.mp3`);
      formData.append('metadata', JSON.stringify({
        cache_key: cacheKey,
        book_id: this.currentContext.bookId || 'unknown',
        chapter_id: this.currentContext.chapterId,
        paragraph_index: this.currentContext.paragraphIndex,
        voice_id: voiceId,
        text_hash: textHash
      }));

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      if (response.ok) {
        logger.debug('☁️ ElevenLabs: Audio subido al caché compartido');
      }
    } catch (error) {
      console.warn('Error subiendo a caché compartido:', error);
      // No fallar si no se puede subir
    }
  }

  /**
   * Genera y reproduce audio con ElevenLabs
   * Sistema de caché de 3 niveles:
   * 1. Caché compartido (servidor) - disponible para todos
   * 2. Caché local (dispositivo) - offline
   * 3. Generar nuevo (ElevenLabs) - gasta créditos
   */
  async speak(text, options = {}) {
    const {
      voice = this.spanishVoices[0].id,
      model = this.defaultModel,
      stability = 0.5,
      similarity_boost = 0.75,
      speed = 1.0,
      onProgress = null,
      onEnd = null,
      onError = null
    } = options;

    // Verificar si el usuario tiene acceso premium (si no usa key personal)
    if (!this.usePersonalKey) {
      if (window.aiPremium && !window.aiPremium.hasFeature('elevenlabs_tts')) {
        const error = new Error('Voces ElevenLabs solo disponibles en Premium');
        if (onError) onError(error);
        throw error;
      }
    }

    try {
      // Generar hash y clave de caché
      const textHash = this.hashText(text);
      const cacheKey = this.getCacheKey(text, voice, stability, similarity_boost, model);
      const persistentCache = this.getPersistentCache();

      // ========== NIVEL 1: Caché compartido (servidor) ==========
      if (this.sharedCacheEnabled) {
        const sharedUrl = await this.checkSharedCache(textHash, voice, cacheKey);
        if (sharedUrl) {
          // Descargar y guardar localmente para uso offline
          try {
            const response = await fetch(sharedUrl);
            const audioBlob = await response.blob();

            // Guardar en caché local
            if (persistentCache) {
              await persistentCache.set(cacheKey, audioBlob, {
                bookId: this.currentContext.bookId,
                chapterId: this.currentContext.chapterId,
                paragraphIndex: this.currentContext.paragraphIndex,
                textLength: text.length,
                voiceId: voice
              });
            }

            const audioUrl = URL.createObjectURL(audioBlob);
            return this.playAudio(audioUrl, onProgress, onEnd, onError);
          } catch (downloadError) {
            console.warn('Error descargando audio compartido:', downloadError);
            // Continuar con otros niveles de caché
          }
        }
      }

      // ========== NIVEL 2: Caché local persistente ==========
      if (this.cacheEnabled && persistentCache) {
        const hasPersistent = await persistentCache.has(cacheKey);
        if (hasPersistent) {
          logger.debug('💾 ElevenLabs: Usando audio de caché local');
          const audioUrl = await persistentCache.get(cacheKey);
          if (audioUrl) {
            return this.playAudio(audioUrl, onProgress, onEnd, onError);
          }
        }
      }

      // ========== NIVEL 3: Caché en memoria ==========
      if (this.cacheEnabled && this.cache.has(cacheKey)) {
        logger.debug('🎵 ElevenLabs: Usando audio de memoria');
        const audioUrl = this.cache.get(cacheKey);
        return this.playAudio(audioUrl, onProgress, onEnd, onError);
      }

      // ========== NIVEL 4: Generar nuevo (gasta créditos) ==========
      logger.debug('🎙️ ElevenLabs: Generando audio nuevo...');
      const audioBlob = await this.generateAudioBlob(text, voice, stability, similarity_boost, model);
      const audioUrl = URL.createObjectURL(audioBlob);

      // Guardar en caché de memoria
      if (this.cacheEnabled) {
        this.cache.set(cacheKey, audioUrl);
        logger.debug(`📦 ElevenLabs: Audio en memoria (${this.cache.size} items)`);
      }

      // Guardar en caché local persistente
      if (this.cacheEnabled && persistentCache) {
        await persistentCache.set(cacheKey, audioBlob, {
          bookId: this.currentContext.bookId,
          chapterId: this.currentContext.chapterId,
          paragraphIndex: this.currentContext.paragraphIndex,
          textLength: text.length,
          voiceId: voice
        });
      }

      // Subir al caché compartido (en background, no bloquea)
      this.uploadToSharedCache(audioBlob, cacheKey, textHash, voice);

      // Reproducir
      return this.playAudio(audioUrl, onProgress, onEnd, onError);

    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      if (onError) onError(error);
      throw error;
    }
  }

  /**
   * Genera audio y retorna el Blob - usa Edge Function o API key personal
   */
  async generateAudioBlob(text, voiceId, stability, similarity_boost, model) {
    // Decidir qué método usar
    if (this.usePersonalKey && this.personalApiKey) {
      return await this.generateBlobWithPersonalKey(text, voiceId, stability, similarity_boost, model);
    } else {
      return await this.generateBlobWithEdgeFunction(text, voiceId, stability, similarity_boost, model);
    }
  }

  /**
   * Genera audio y retorna URL (legacy, usa generateAudioBlob internamente)
   */
  async generateAudio(text, voiceId, stability, similarity_boost, model) {
    const blob = await this.generateAudioBlob(text, voiceId, stability, similarity_boost, model);
    return URL.createObjectURL(blob);
  }

  /**
   * Genera audio usando Supabase Edge Function y retorna Blob
   */
  async generateBlobWithEdgeFunction(text, voiceId, stability, similarity_boost, model) {
    // Verificar que Supabase esté disponible
    if (!window.supabase) {
      throw new Error('Supabase no disponible');
    }

    // Obtener sesión actual
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Debes iniciar sesión para usar voces ElevenLabs');
    }

    // URL de la Edge Function
    // 🔧 FIX v2.9.197: Security - no hardcoded URLs, use config
    const supabaseUrl = window.supabase.supabaseUrl ||
                        window.supabaseConfig?.url ||
                        localStorage.getItem('supabase-url');

    const functionUrl = `${supabaseUrl}/functions/v1/elevenlabs-tts`;

    logger.debug('🔗 Llamando Edge Function:', functionUrl);

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
        model_id: model,
        stability,
        similarity_boost
      })
    });

    if (!response.ok) {
      let errorMessage = 'Error generando audio';

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;

        // Manejar errores específicos
        if (response.status === 403) {
          throw new Error(errorMessage);
        } else if (response.status === 402) {
          throw new Error(`Créditos insuficientes. ${errorData.credits_needed} necesarios, ${errorData.credits_remaining} disponibles`);
        }
      } catch (e) {
        if (e.message.includes('Créditos') || e.message.includes('Premium')) {
          throw e;
        }
        errorMessage = await response.text();
      }

      throw new Error(errorMessage);
    }

    // Leer créditos usados del header
    const creditsUsed = response.headers.get('X-Credits-Used');
    const creditsRemaining = response.headers.get('X-Credits-Remaining');
    if (creditsUsed) {
      logger.debug(`💰 Créditos usados: ${creditsUsed}, restantes: ${creditsRemaining}`);
    }

    return await response.blob();
  }

  /**
   * Genera audio usando Supabase Edge Function (retorna URL)
   */
  async generateWithEdgeFunction(text, voiceId, stability, similarity_boost, model) {
    const blob = await this.generateBlobWithEdgeFunction(text, voiceId, stability, similarity_boost, model);
    return URL.createObjectURL(blob);
  }

  /**
   * Genera audio usando API key personal y retorna Blob
   */
  async generateBlobWithPersonalKey(text, voiceId, stability, similarity_boost, model) {
    if (!this.personalApiKey) {
      throw new Error('API key personal de ElevenLabs no configurada');
    }

    const url = `${this.baseURL}/${voiceId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': this.personalApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability,
          similarity_boost
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Error generando audio con ElevenLabs';

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail?.message || errorJson.detail || errorMessage;
      } catch (e) {
        errorMessage = errorText;
      }

      // Errores específicos
      if (response.status === 401) {
        throw new Error('API key de ElevenLabs inválida');
      } else if (response.status === 429) {
        throw new Error('Límite de uso de ElevenLabs alcanzado');
      } else if (response.status === 400) {
        throw new Error('Texto demasiado largo o formato inválido');
      }

      throw new Error(errorMessage);
    }

    return await response.blob();
  }

  /**
   * Genera audio usando API key personal (retorna URL)
   */
  async generateWithPersonalKey(text, voiceId, stability, similarity_boost, model) {
    const blob = await this.generateBlobWithPersonalKey(text, voiceId, stability, similarity_boost, model);
    return URL.createObjectURL(blob);
  }

  /**
   * Reproduce el audio generado
   */
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

      // Fin
      audio.addEventListener('ended', () => {
        this.isPlaying = false;
        this.isPaused = false;
        if (onEnd) onEnd();
        resolve();
      });

      // Error
      audio.addEventListener('error', (e) => {
        this.isPlaying = false;
        const error = new Error('Error reproduciendo audio');
        if (onError) onError(error);
        reject(error);
      });

      // Iniciar reproducción
      audio.play().catch((e) => {
        this.isPlaying = false;
        if (onError) onError(e);
        reject(e);
      });
    });
  }

  /**
   * Pausa la reproducción
   */
  pause() {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause();
      this.isPaused = true;
      this.isPlaying = false;
    }
  }

  /**
   * Reanuda la reproducción
   */
  resume() {
    if (this.currentAudio && this.isPaused) {
      this.currentAudio.play();
      this.isPaused = false;
      this.isPlaying = true;
    }
  }

  /**
   * Detiene la reproducción
   */
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
    this.isPaused = false;
  }

  /**
   * Obtiene las voces disponibles
   */
  async getAvailableVoices() {
    return this.spanishVoices;
  }

  /**
   * Genera una clave de caché única
   */
  getCacheKey(text, voice, stability, similarity, model) {
    const data = `${text}|${voice}|${stability}|${similarity}|${model}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `elevenlabs_${hash}`;
  }

  /**
   * Estima los créditos necesarios para un texto
   * Aproximadamente 5 créditos por cada 1000 caracteres
   */
  estimateCredits(textLength) {
    return Math.ceil((textLength / 1000) * 5);
  }

  /**
   * Limpia el caché de audio
   */
  clearCache() {
    // Revocar URLs de blob para liberar memoria
    this.cache.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    this.cache.clear();
    logger.debug('🗑️ ElevenLabs: Caché limpiado');
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.ElevenLabsTTSProvider = ElevenLabsTTSProvider;
}
