// ============================================================================
// AUDIOREADER - Sistema de Narración con TTS (Text-to-Speech)
// ============================================================================
// Usa @capacitor-community/text-to-speech para Android nativo
// Fallback a Web Speech API para navegadores web

class AudioReader {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.synthesis = window.speechSynthesis;
    this.utterance = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentParagraphIndex = 0;
    this.paragraphs = [];
    this.rate = 1.0;
    this.selectedVoice = null;
    this.selectedVoiceURI = localStorage.getItem('preferred-tts-voice'); // Para TTS nativo
    this.autoAdvanceChapter = false;

    // Verificar si estamos en Android/Capacitor
    this.isCapacitor = !!(window.Capacitor && window.Capacitor.isNative);
    this.isAndroid = this.isCapacitor && window.Capacitor.getPlatform() === 'android';

    // Plugin TTS nativo (se cargará si está disponible)
    this.nativeTTS = null;

    // ⭐ TTS Manager (para voces premium OpenAI y Hugging Face)
    this.ttsManager = window.TTSManager ? new window.TTSManager() : null;
    // Provider: 'browser' | 'openai' | 'huggingface'
    this.ttsProvider = localStorage.getItem('tts-provider') || 'browser';

    // Wake Lock para mantener pantalla activa durante audio
    this.wakeLock = null;

    // ⭐ Estado minimizado/expandido
    this.isMinimized = localStorage.getItem('audioreader-minimized') === 'true';
    this.dragStartY = 0;
    this.dragCurrentY = 0;
    this.isDragging = false;

    // ⭐ Seguimiento palabra por palabra
    this.wordByWordEnabled = localStorage.getItem('audioreader-word-by-word') === 'true';
    this.currentWordIndex = 0;
    this.wordsInCurrentParagraph = [];

    // 🧹 Referencias a event handlers para cleanup
    this.dragHandlers = {
      onDragStart: null,
      onDragMove: null,
      onDragEnd: null,
      dragHandleElement: null
    };

    // ⭐ NUEVAS FEATURES
    // Sleep Timer
    this.sleepTimer = null;
    this.sleepTimerMinutes = 0;
    this.sleepTimerStartTime = null;

    // Bookmarks de audio
    this.audioBookmarks = this.loadBookmarks();

    // Tiempo estimado
    this.estimatedTimeRemaining = 0;
    this.startTime = null;

    // Keyboard listeners
    this.keyboardListenerAttached = false;

    // Inicializar TTS según plataforma
    this.initTTS();
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  async initTTS() {
    if (this.isCapacitor) {
      try {
        // Intentar usar el plugin nativo de Capacitor
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech) {
          this.nativeTTS = window.Capacitor.Plugins.TextToSpeech;

          // Verificar voces disponibles
          const result = await this.nativeTTS.getSupportedLanguages();
          const languages = result?.languages || [];
          logger.log('✅ TTS nativo inicializado. Idiomas:', languages.length);

          // Verificar si español está disponible
          if (languages.some(l => l.startsWith('es'))) {
            logger.log('✅ Español disponible en TTS nativo');
          }

          // ⭐ Si no hay provider configurado o es 'browser', usar nativo por defecto
          if (!localStorage.getItem('tts-provider') || this.ttsProvider === 'browser') {
            this.ttsProvider = 'native';
            logger.log('✅ TTS nativo configurado como provider por defecto');
          }

          // ⭐ Inicialización "dummy" para asegurar que el TTS esté listo
          try {
            await this.nativeTTS.speak({
              text: ' ',
              lang: 'es-ES',
              rate: 1.0,
              pitch: 1.0,
              volume: 0.01
            });
            logger.log('✅ TTS nativo pre-calentado y listo');
          } catch (e) {
            logger.log('⚠️ Pre-calentamiento TTS falló (normal en primer uso)');
          }
        } else if (window.capacitorTextToSpeech && window.capacitorTextToSpeech.TextToSpeech) {
          // Fallback al plugin cargado manualmente
          this.nativeTTS = window.capacitorTextToSpeech.TextToSpeech;

          const result = await this.nativeTTS.getSupportedLanguages();
          const languages = result?.languages || [];
          logger.log('✅ TTS nativo inicializado (fallback). Idiomas:', languages.length);

          // ⭐ Si no hay provider configurado o es 'browser', usar nativo por defecto
          if (!localStorage.getItem('tts-provider') || this.ttsProvider === 'browser') {
            this.ttsProvider = 'native';
            logger.log('✅ TTS nativo configurado como provider por defecto');
          }

          // ⭐ Inicialización "dummy" para asegurar que el TTS esté listo
          try {
            await this.nativeTTS.speak({
              text: ' ',
              lang: 'es-ES',
              rate: 1.0,
              pitch: 1.0,
              volume: 0.01
            });
            logger.log('✅ TTS nativo pre-calentado y listo (fallback)');
          } catch (e) {
            logger.log('⚠️ Pre-calentamiento TTS falló (normal en primer uso)');
          }
        } else {
          // console.warn('⚠️ Plugin TTS no encontrado, usando Web Speech API');
          this.nativeTTS = null;
          this.loadVoices();
        }
      } catch (error) {
        // console.warn('⚠️ Plugin TTS nativo no disponible, usando Web Speech API:', error.message);
        this.nativeTTS = null;
        this.loadVoices();
      }
    } else {
      // En web, usar Web Speech API
      this.loadVoices();
    }

    // ⭐ Auto-configurar ElevenLabs para usuarios Premium
    if (window.authHelper && window.authHelper.isPremium && window.authHelper.isPremium()) {
      // Si el usuario es premium y no tiene un provider configurado
      const savedProvider = localStorage.getItem('tts-provider');

      if (!savedProvider || savedProvider === 'browser') {
        // Verificar si ElevenLabs está disponible
        if (this.ttsManager && this.ttsManager.providers && this.ttsManager.providers.elevenlabs) {
          this.ttsProvider = 'elevenlabs';
          localStorage.setItem('tts-provider', 'elevenlabs');
          console.log('✅ Usuario Premium detectado: ElevenLabs configurado automáticamente');
        } else {
          console.log('ℹ️ Usuario Premium detectado, pero ElevenLabs no está disponible aún');
        }
      } else {
        console.log(`ℹ️ Usuario Premium usando provider guardado: ${savedProvider}`);
      }
    }
  }

  async loadVoices() {
    try {
      // Esperar a que las voces estén disponibles
      if (!this.synthesis || typeof this.synthesis.getVoices !== 'function') {
        // console.warn('⚠️ Speech Synthesis no disponible o getVoices no está soportado');
        return;
      }

      // Si hay polyfill disponible, usarlo para carga más robusta
      if (window.ttsPolyfill) {
        // console.log('🔧 Usando TTS Polyfill para carga robusta de voces...');
        try {
          await window.ttsPolyfill.waitForVoices(10000);
          this.selectBestVoice();
          return;
        } catch (error) {
          // console.warn('⚠️ Polyfill timeout, usando método estándar...');
          // Continuar con método estándar si el polyfill falla
        }
      }

      const voices = this.synthesis.getVoices();
      if (voices && voices.length > 0) {
        this.selectBestVoice();
      } else {
        // Escuchar evento de voces cargadas
        this.synthesis.addEventListener('voiceschanged', () => {
          this.selectBestVoice();
        }, { once: true });

        // Reintentar después de 500ms por si el evento no se dispara (común en algunos navegadores)
        setTimeout(() => {
          const retryVoices = this.synthesis.getVoices();
          if (retryVoices && retryVoices.length > 0 && !this.selectedVoice) {
            this.selectBestVoice();
          }
        }, 500);

        // Último intento después de 2 segundos
        setTimeout(() => {
          const finalVoices = this.synthesis.getVoices();
          if (!finalVoices || finalVoices.length === 0) {
            // console.warn('⚠️ No se encontraron voces TTS. El audio no funcionará hasta que se instalen voces en el sistema.');
          } else if (!this.selectedVoice) {
            this.selectBestVoice();
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error loading voices:', error);
    }
  }

  selectBestVoice() {
    try {
      if (!this.synthesis || typeof this.synthesis.getVoices !== 'function') return;

      const voices = this.synthesis.getVoices();
      if (!voices || voices.length === 0) {
        console.log('⏳ Esperando voces TTS...');
        return;
      }

      // Intentar cargar voz preferida guardada
      const preferredVoiceURI = localStorage.getItem('preferred-tts-voice');
      if (preferredVoiceURI) {
        const preferredVoice = voices.find(v => v.voiceURI === preferredVoiceURI);
        if (preferredVoice) {
          this.selectedVoice = preferredVoice;
          console.log('✅ Voz TTS preferida cargada:', this.selectedVoice?.name, this.selectedVoice?.lang);
          return;
        } else {
          console.warn('⚠️ Voz preferida no encontrada, seleccionando mejor alternativa');
        }
      }

      // Buscar voz española (prioridad: ES-ES, luego ES-MX, luego ES-*)
      const spanishVoices = voices.filter(v => v.lang && v.lang.startsWith('es'));

      if (spanishVoices.length > 0) {
        // Preferir voces de España
        const esES = spanishVoices.find(v => v.lang === 'es-ES');
        this.selectedVoice = esES || spanishVoices[0];
        console.log('✅ Voz española seleccionada por defecto:', this.selectedVoice?.name, this.selectedVoice?.lang);
      } else {
        // Fallback a cualquier voz disponible
        this.selectedVoice = voices[0];
        console.warn('⚠️ No hay voces en español, usando fallback:', this.selectedVoice?.name, this.selectedVoice?.lang);
      }

      // Mostrar lista de voces disponibles para debugging
      if (voices.length > 0) {
        console.log(`📢 ${voices.length} voces TTS disponibles:`,
          voices.filter(v => v.lang && v.lang.startsWith('es')).map(v => `${v.name} (${v.lang})`).join(', ') ||
          voices.map(v => `${v.name} (${v.lang})`).slice(0, 5).join(', ')
        );
      }
    } catch (error) {
      console.error('Error selecting voice:', error);
    }
  }

  // Método helper para listar todas las voces (debugging)
  listVoices() {
    const voices = this.synthesis?.getVoices() || [];
    // console.table(voices.map(v => ({
    //   name: v.name,
    //   lang: v.lang,
    //   default: v.default,
    //   localService: v.localService
    // })));
    return voices;
  }

  async getAvailableVoices() {
    // Si usa TTS nativo (Capacitor), obtener voces del plugin
    if (this.nativeTTS) {
      try {
        const result = await this.nativeTTS.getSupportedVoices();
        const voices = result.voices || [];
        // Filtrar solo voces en español
        const spanishVoices = voices.filter(v => v.lang && v.lang.startsWith('es'));
        return this.sortVoicesByQuality(spanishVoices);
      } catch (error) {
        // console.warn('No se pudieron obtener voces del TTS nativo:', error);
        return [];
      }
    }

    // Web Speech API
    try {
      if (!this.synthesis || typeof this.synthesis.getVoices !== 'function') return [];
      const voices = this.synthesis.getVoices();
      const spanishVoices = voices ? voices.filter(v => v.lang && v.lang.startsWith('es')) : [];

      return this.sortVoicesByQuality(spanishVoices);
    } catch (error) {
      console.error('Error getting voices:', error);
      return [];
    }
  }

  sortVoicesByQuality(voces) {
    // Si no hay voces, devolver array vacío
    if (!voces || voces.length === 0) {
      return [];
    }

    // SIMPLIFICADO: Solo limitar a las primeras 20 voces para no saturar el selector
    // Las voces ya vienen filtradas por español en getAvailableVoices()
    return voces.slice(0, 20);
  }

  simplificarNombreVoz(nombreCompleto) {
    // Validar entrada
    if (!nombreCompleto || typeof nombreCompleto !== 'string') {
      return 'Voz';
    }

    let nombre = nombreCompleto;

    // Si es un URN/URI técnico (urn:moz-tts:espeak:es+male7), extraer parte legible
    if (nombre.includes('urn:') || nombre.includes('://')) {
      const partes = nombre.split(':');
      const ultimaParte = partes[partes.length - 1]; // "es+male7" o "es"

      if (ultimaParte && ultimaParte.includes('+')) {
        // "es+male7" → "Español Male7"
        const [idioma, variante] = ultimaParte.split('+');
        // Capitalizar variante (male7 → Male7)
        const varianteCapitalizada = variante.charAt(0).toUpperCase() + variante.slice(1);
        nombre = `Español ${varianteCapitalizada}`;
      } else if (ultimaParte) {
        // "es" → "Español"
        nombre = 'Español';
      }
    } else {
      // No es URI, usar nombre tal cual pero limpio
      nombre = nombre.replace(/^Microsoft\s+/i, '');
      nombre = nombre.replace(/^Google\s+/i, '');
      nombre = nombre.replace(/\s+-\s+.*$/, '');
      nombre = nombre.replace(/\s+\(.*?\)$/, '');
    }

    // Limitar longitud
    if (nombre.length > 25) {
      nombre = nombre.substring(0, 23) + '...';
    }

    return nombre.trim() || 'Voz';
  }

  // ==========================================================================
  // WAKE LOCK - Mantener pantalla activa durante reproducción
  // ==========================================================================

  async acquireWakeLock() {
    try {
      // Usar Web Wake Lock API (funciona en Android WebView con el permiso WAKE_LOCK)
      if ('wakeLock' in navigator) {
        try {
          this.wakeLock = await navigator.wakeLock.request('screen');
          this.wakeLock.addEventListener('release', () => {
            logger.log('🔓 Wake lock liberado automáticamente');
          });
          logger.log('🔒 Wake lock adquirido - La pantalla se mantendrá activa durante la reproducción');
        } catch (err) {
          // Si falla, intentar de nuevo después de un momento (a veces falla si la pantalla está apagada)
          if (err.name === 'NotAllowedError') {
            // console.warn('⚠️ Wake lock no permitido - asegúrate de que la pantalla esté encendida');
          } else {
            // console.warn('⚠️ No se pudo adquirir wake lock:', err.message);
          }
        }
      } else {
        logger.log('ℹ️ Wake Lock API no disponible - la pantalla podría apagarse durante la reproducción');
      }
    } catch (error) {
      // console.warn('⚠️ Error al adquirir wake lock:', error);
    }
  }

  async releaseWakeLock() {
    try {
      // Liberar Web Wake Lock API
      if (this.wakeLock && !this.wakeLock.released) {
        await this.wakeLock.release();
        this.wakeLock = null;
        logger.log('🔓 Wake lock liberado - La pantalla puede apagarse normalmente');
      }
    } catch (error) {
      // console.warn('⚠️ Error al liberar wake lock:', error);
    }
  }

  setupMediaSession() {
    // Media Session API para controles nativos en móvil y reproducción en background
    if ('mediaSession' in navigator) {
      try {
        const bookData = this.bookEngine.getCurrentBookData();

        navigator.mediaSession.metadata = new MediaMetadata({
          title: bookData.title || 'Audiolibro',
          artist: bookData.authors?.join(', ') || 'Colección Nuevo Ser',
          album: 'Colección Nuevo Ser',
          artwork: [
            { src: bookData.cover || '/img/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: bookData.cover || '/img/icon-512.png', sizes: '512x512', type: 'image/png' }
          ]
        });

        // Configurar action handlers para controles nativos
        navigator.mediaSession.setActionHandler('play', () => {
          if (this.isPaused) {
            this.resume();
          } else {
            this.play();
          }
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          this.pause();
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
          this.previous();
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
          this.next();
        });

        navigator.mediaSession.setActionHandler('stop', () => {
          this.stop();
        });

        // Actualizar posición (para la barra de progreso en controles nativos)
        if (this.paragraphs.length > 0) {
          const totalDuration = this.paragraphs.length * 10; // Estimación aproximada
          navigator.mediaSession.setPositionState({
            duration: totalDuration,
            playbackRate: this.rate,
            position: this.currentParagraphIndex * 10
          });
        }

        logger.log('🎵 Media Session configurada para controles nativos');
      } catch (error) {
        console.warn('⚠️ Error configurando Media Session:', error);
      }
    }
  }

  // ==========================================================================
  // PREPARACIÓN DEL CONTENIDO
  // ==========================================================================

  /**
   * Sanitiza texto para TTS - elimina símbolos markdown y caracteres problemáticos
   */
  sanitizeTextForTTS(text) {
    if (!text) return '';

    return text
      // Eliminar símbolos markdown de encabezados (# ## ### etc.)
      .replace(/^#{1,6}\s*/gm, '')
      // Eliminar asteriscos de negrita/cursiva
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      // Eliminar guiones bajos de negrita/cursiva
      .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
      // Eliminar backticks de código
      .replace(/`([^`]+)`/g, '$1')
      // Eliminar corchetes de enlaces markdown [texto](url)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Eliminar símbolos de lista al inicio
      .replace(/^[\s]*[-*+]\s+/gm, '')
      // Eliminar números de lista ordenada al inicio
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // Eliminar blockquote markers
      .replace(/^>\s*/gm, '')
      // Eliminar múltiples espacios
      .replace(/\s{2,}/g, ' ')
      // Eliminar caracteres especiales que se leen mal
      .replace(/[│├└┌┐┘┬┴┼─═║╔╗╚╝╠╣╬]/g, '')
      // Normalizar puntuación para pausas naturales
      .replace(/\.{3,}/g, '...')
      .replace(/!{2,}/g, '!')
      .replace(/\?{2,}/g, '?')
      .trim();
  }

  prepareContent(chapterContent) {
    // Extraer texto del HTML del capítulo
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = chapterContent;

    // Obtener párrafos (p, h2, h3, li)
    const elements = tempDiv.querySelectorAll('p, h2, h3, li, blockquote');
    this.paragraphs = [];

    elements.forEach((el, index) => {
      // Sanitizar texto para TTS
      const rawText = el.innerText.trim();
      const text = this.sanitizeTextForTTS(rawText);

      if (text && text.length > 0) {
        this.paragraphs.push({
          index,
          text,
          element: el,
          spoken: false
        });
      }
    });

    logger.log(`📖 Preparados ${this.paragraphs.length} párrafos para narrar`);
    return this.paragraphs.length;
  }

  // ==========================================================================
  // CONTROLES DE REPRODUCCIÓN
  // ==========================================================================

  async play(chapterContent = null) {
    // Verificar si hay problemas con TTS (Linux + Chrome sin voces)
    if (window.ttsPlatformHelper) {
      const ttsIssueDetected = await window.ttsPlatformHelper.checkAndShowModalIfNeeded();
      if (ttsIssueDetected) {
        // Se mostró el modal de ayuda, no continuar con la reproducción
        console.warn('⚠️ TTS no disponible. Modal de ayuda mostrado.');
        return false;
      }
    }

    // Si se proporciona contenido, prepararlo
    if (chapterContent) {
      this.prepareContent(chapterContent);
      this.currentParagraphIndex = 0;
    }

    // Si no hay párrafos preparados, error
    if (this.paragraphs.length === 0) {
      console.error('❌ No hay contenido preparado para narrar');
      return false;
    }

    // Si estaba pausado, reanudar
    if (this.isPaused && !this.nativeTTS) {
      this.resume();
      return true;
    }

    // Adquirir wake lock para mantener pantalla activa
    await this.acquireWakeLock();

    // Iniciar Background Audio Helper (Foreground Service en Android, audio silencioso en web)
    if (window.backgroundAudio) {
      const bookData = this.bookEngine.getCurrentBookData();
      await window.backgroundAudio.start({
        title: bookData?.title || 'Audiolibro',
        chapter: this.bookEngine.currentChapter?.title || ''
      });
    }

    // Configurar Media Session API para controles nativos en móvil
    this.setupMediaSession();

    // Iniciar narración
    this.isPlaying = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.speakParagraph(this.currentParagraphIndex);
    await this.updateUI();

    // Track para logros
    if (window.achievementSystem) {
      window.achievementSystem.trackAudioUsed();
    }

    return true;
  }

  async pause() {
    if (!this.isPlaying || this.isPaused) return;

    if ((this.ttsProvider === 'openai' || this.ttsProvider === 'huggingface' || this.ttsProvider === 'elevenlabs') && this.ttsManager) {
      // Premium TTS pause (OpenAI, Hugging Face o ElevenLabs)
      try {
        if (this.ttsProvider === 'elevenlabs' && this.ttsManager.providers.elevenlabs) {
          this.ttsManager.providers.elevenlabs.pause();
        } else {
          this.ttsManager.pause();
        }
        this.isPaused = true;
        logger.log('⏸️ Audio premium pausado');
      } catch (e) {
        console.error('Error pausando TTS premium:', e);
      }
    } else if (this.nativeTTS) {
      // TTS nativo no soporta pausa, hay que detener
      try {
        await this.nativeTTS.stop();
        this.isPaused = true;
        logger.log('⏸️ Audio pausado (TTS nativo detenido)');
      } catch (e) {
        console.error('Error pausando TTS nativo:', e);
      }
    } else {
      // Web Speech API - verificar que esté hablando antes de pausar
      if (this.synthesis && this.synthesis.speaking) {
        // Chrome/Brave a veces tienen problemas con pause/resume
        // Usar cancel en su lugar y guardar estado
        this.synthesis.cancel();
        this.isPaused = true;
        logger.log('⏸️ Audio pausado (párrafo actual guardado)');
      } else {
        // Si no está hablando, simplemente marcar como pausado
        this.isPaused = true;
        logger.log('⏸️ Audio marcado como pausado');
      }
    }

    // Notificar al Background Audio Helper que está pausado
    if (window.backgroundAudio) {
      window.backgroundAudio.pause();
    }

    await this.updateUI();
  }

  async resume() {
    if (!this.isPaused) return;

    this.isPaused = false;

    // Adquirir wake lock
    await this.acquireWakeLock();

    // Notificar al Background Audio Helper que se reanuda
    if (window.backgroundAudio) {
      window.backgroundAudio.resume();
    }

    if ((this.ttsProvider === 'openai' || this.ttsProvider === 'huggingface' || this.ttsProvider === 'elevenlabs') && this.ttsManager) {
      // Premium TTS resume (OpenAI, Hugging Face o ElevenLabs)
      try {
        if (this.ttsProvider === 'elevenlabs' && this.ttsManager.providers.elevenlabs) {
          this.ttsManager.providers.elevenlabs.resume();
        } else {
          this.ttsManager.resume();
        }
        logger.log('▶️ Audio premium reanudado');
      } catch (e) {
        console.error('Error reanudando TTS premium, reiniciando:', e);
        this.speakParagraph(this.currentParagraphIndex);
      }
    } else if (this.nativeTTS) {
      // TTS nativo no soporta resume, reiniciar desde el párrafo actual
      this.speakParagraph(this.currentParagraphIndex);
    } else {
      // Web Speech API - reiniciar desde el párrafo actual
      // En lugar de resume() que falla en Chrome/Brave, reiniciamos
      this.speakParagraph(this.currentParagraphIndex);
      logger.log('▶️ Audio reanudado desde párrafo actual');
    }
    await this.updateUI();
  }

  async stop(resetPosition = true) {
    if ((this.ttsProvider === 'openai' || this.ttsProvider === 'huggingface' || this.ttsProvider === 'elevenlabs') && this.ttsManager) {
      try {
        if (this.ttsProvider === 'elevenlabs' && this.ttsManager.providers.elevenlabs) {
          this.ttsManager.providers.elevenlabs.stop();
        } else {
          this.ttsManager.stop();
        }
      } catch (e) {
        console.error('Error deteniendo TTS premium:', e);
      }
    } else if (this.nativeTTS) {
      try {
        await this.nativeTTS.stop();
      } catch (e) {
        // Ignorar errores al detener
      }
    } else if (this.synthesis) {
      this.synthesis.cancel();
    }

    // Liberar wake lock cuando se detiene la reproducción
    await this.releaseWakeLock();

    // Detener Background Audio Helper (Foreground Service en Android, audio silencioso en web)
    if (window.backgroundAudio) {
      await window.backgroundAudio.stop();
    }

    this.isPlaying = false;
    this.isPaused = false;

    // Solo resetear la posición si se solicita explícitamente (botón Stop)
    // No resetear cuando se cierra el panel para poder continuar después
    if (resetPosition) {
      this.currentParagraphIndex = 0;
    }

    this.clearHighlights();
    await this.updateUI();
  }

  async next() {
    if (this.currentParagraphIndex < this.paragraphs.length - 1) {
      const wasPlaying = this.isPlaying;

      if ((this.ttsProvider === 'openai' || this.ttsProvider === 'huggingface') && this.ttsManager) {
        try {
          this.ttsManager.stop();
        } catch (e) {
          console.error('Error deteniendo OpenAI TTS para next:', e);
        }
      } else if (this.nativeTTS) {
        try {
          await this.nativeTTS.stop();
        } catch (e) {
          console.error('Error deteniendo TTS para next:', e);
        }
      } else {
        this.synthesis.cancel();
      }

      this.currentParagraphIndex++;

      // Solo reanudar si estaba reproduciendo
      if (wasPlaying) {
        this.isPaused = false;
        this.speakParagraph(this.currentParagraphIndex);
      } else {
        await this.updateUI();
      }
    }
  }

  async previous() {
    if (this.currentParagraphIndex > 0) {
      const wasPlaying = this.isPlaying;

      if ((this.ttsProvider === 'openai' || this.ttsProvider === 'huggingface') && this.ttsManager) {
        try {
          this.ttsManager.stop();
        } catch (e) {
          console.error('Error deteniendo TTS premium para previous:', e);
        }
      } else if (this.nativeTTS) {
        try {
          await this.nativeTTS.stop();
        } catch (e) {
          console.error('Error deteniendo TTS para previous:', e);
        }
      } else {
        this.synthesis.cancel();
      }

      this.currentParagraphIndex--;

      // Solo reanudar si estaba reproduciendo
      if (wasPlaying) {
        this.isPaused = false;
        this.speakParagraph(this.currentParagraphIndex);
      } else {
        await this.updateUI();
      }
    }
  }

  async setRate(rate) {
    this.rate = parseFloat(rate);

    // Si está reproduciendo, reiniciar con nueva velocidad
    if (this.isPlaying && !this.isPaused) {
      const currentIndex = this.currentParagraphIndex;
      if ((this.ttsProvider === 'openai' || this.ttsProvider === 'huggingface') && this.ttsManager) {
        this.ttsManager.stop();
      } else if (this.nativeTTS) {
        await this.nativeTTS.stop();
      } else {
        this.synthesis.cancel();
      }
      this.speakParagraph(currentIndex);
    }

    await this.updateUI();
  }

  async setVoice(voiceURI) {
    try {
      // Si usa TTS nativo, guardar la voz seleccionada en localStorage
      if (this.nativeTTS) {
        localStorage.setItem('preferred-tts-voice', voiceURI);
        this.selectedVoiceURI = voiceURI;
        logger.log('✅ Voz TTS nativa cambiada a:', voiceURI);
        return;
      }

      // Web Speech API
      if (!this.synthesis || typeof this.synthesis.getVoices !== 'function') {
        // console.warn('⚠️ getVoices no disponible');
        return;
      }
      const voices = this.synthesis.getVoices();
      this.selectedVoice = voices.find(v => v.voiceURI === voiceURI);
      localStorage.setItem('preferred-tts-voice', voiceURI);
      logger.log('✅ Voz cambiada a:', this.selectedVoice?.name);
    } catch (error) {
      console.error('Error setting voice:', error);
    }
  }

  async toggleAutoAdvance() {
    this.autoAdvanceChapter = !this.autoAdvanceChapter;
    await this.updateUI();
  }

  async toggleWordByWord() {
    this.wordByWordEnabled = !this.wordByWordEnabled;
    localStorage.setItem('audioreader-word-by-word', this.wordByWordEnabled);

    // Re-renderizar el párrafo actual si está activo
    if (this.wordByWordEnabled && this.paragraphs.length > 0) {
      await this.highlightParagraph(this.currentParagraphIndex);
      window.toast?.success('✨ Modo palabra por palabra activado');
    } else {
      // Limpiar y restaurar el párrafo actual
      this.clearHighlights();
      if (this.paragraphs.length > 0) {
        await this.highlightParagraph(this.currentParagraphIndex);
      }
      window.toast?.info('Modo palabra por palabra desactivado');
    }

    await this.updateUI();
  }

  async setTTSProvider(provider) {
    // Validar provider
    if (!['browser', 'openai', 'huggingface', 'elevenlabs'].includes(provider)) {
      console.error('❌ Provider inválido:', provider);
      return;
    }

    // Validar que TTSManager esté disponible para providers premium
    if ((provider === 'openai' || provider === 'huggingface' || provider === 'elevenlabs') && !this.ttsManager) {
      window.toast?.error('Sistema TTS Premium no disponible');
      return;
    }

    // Validar API keys
    if (provider === 'openai') {
      const hasOpenAIKey = localStorage.getItem('openai-tts-key');
      if (!hasOpenAIKey) {
        window.toast?.warning('Configura tu API Key de OpenAI en Configuración');
        return;
      }
    }

    if (provider === 'huggingface') {
      const hasHFKey = localStorage.getItem('huggingface-tts-key');
      if (!hasHFKey) {
        window.toast?.warning('Configura tu API Key de Hugging Face en Configuración');
        return;
      }
    }

    // Validar ElevenLabs (requiere suscripción Premium)
    if (provider === 'elevenlabs') {
      if (!this.ttsManager.isElevenLabsAvailable()) {
        window.toast?.warning('Voces ElevenLabs requieren suscripción Premium');
        return;
      }
    }

    // Cambiar provider
    this.ttsProvider = provider;
    localStorage.setItem('tts-provider', provider);

    if (this.ttsManager) {
      this.ttsManager.setProvider(provider);
    }

    // Feedback visual
    const providerNames = {
      browser: '🔊 Navegador',
      openai: '✨ OpenAI TTS',
      huggingface: '🤗 Hugging Face',
      elevenlabs: '🎙️ ElevenLabs Premium'
    };
    window.toast?.success(`Voz cambiada a: ${providerNames[provider]}`);

    await this.updateUI();
  }

  // ==========================================================================
  // MOTOR DE NARRACIÓN
  // ==========================================================================

  async speakParagraph(index) {
    if (index >= this.paragraphs.length) {
      // Terminó el capítulo
      this.onChapterEnd();
      return;
    }

    const paragraph = this.paragraphs[index];

    // Highlight del párrafo actual
    this.highlightParagraph(index);

    // Guardar posición actual
    this.savePosition();

    // ⭐ Selección de provider según configuración
    if (this.ttsProvider === 'elevenlabs' && this.ttsManager && this.ttsManager.isElevenLabsAvailable()) {
      // Usar ElevenLabs Premium (requiere suscripción)
      await this.speakWithElevenLabs(paragraph, index);
    } else if (this.ttsProvider === 'openai' && this.ttsManager && localStorage.getItem('openai-tts-key')) {
      // Usar OpenAI TTS Premium
      await this.speakWithOpenAI(paragraph, index);
    } else if (this.ttsProvider === 'native' && this.nativeTTS) {
      // Usar TTS nativo de Capacitor (Android) - CONFIGURADO POR DEFECTO
      await this.speakWithNativeTTS(paragraph, index);
    } else if (this.nativeTTS) {
      // Fallback: TTS nativo disponible pero no configurado explícitamente
      await this.speakWithNativeTTS(paragraph, index);
    } else {
      // Usar Web Speech API (navegador)
      this.speakWithWebSpeechAPI(paragraph, index);
    }
  }

  async speakWithNativeTTS(paragraph, index, retryCount = 0) {
    try {
      const options = {
        text: paragraph.text,
        lang: 'es-ES',
        rate: this.rate,
        pitch: 1.0,
        volume: 1.0,
        category: 'playback'
      };

      // Si hay una voz seleccionada, usarla
      if (this.selectedVoiceURI) {
        options.voice = this.selectedVoiceURI;
      }

      await this.nativeTTS.speak(options);

      // El speak de Capacitor TTS es síncrono y espera a terminar
      paragraph.spoken = true;

      // Avanzar al siguiente párrafo si seguimos reproduciendo
      if (this.isPlaying && !this.isPaused) {
        this.currentParagraphIndex++;

        if (this.currentParagraphIndex < this.paragraphs.length) {
          // Pequeña pausa entre párrafos
          setTimeout(() => {
            if (this.isPlaying && !this.isPaused) {
              this.speakParagraph(this.currentParagraphIndex);
            }
          }, 300);
        } else {
          // Terminó el capítulo
          this.onChapterEnd();
        }
      }
    } catch (error) {
      console.error('❌ Error en TTS nativo:', error);

      // Si es el primer intento y el error es de inicialización, reintentar
      if (retryCount < 3 && error.message && error.message.includes('not ready')) {
        console.log(`⚠️ TTS no listo, reintentando (${retryCount + 1}/3)...`);
        setTimeout(() => {
          if (this.isPlaying && !this.isPaused) {
            this.speakWithNativeTTS(paragraph, index, retryCount + 1);
          }
        }, 1000);
      } else {
        // Si falla después de reintentos, detener reproducción
        this.stop();
        window.toast?.error('Error en reproductor de audio. Por favor, inténtalo de nuevo.');
      }
    }
  }

  speakWithWebSpeechAPI(paragraph, index) {
    // Verificar que synthesis esté disponible
    if (!this.synthesis) {
      console.error('❌ speechSynthesis no disponible');
      this.stop();
      return;
    }

    // Verificar que haya voces disponibles
    if (!this.selectedVoice) {
      const voices = this.synthesis.getVoices();
      if (!voices || voices.length === 0) {
        console.error('❌ No hay voces de TTS disponibles');
        window.toast?.error('No hay voces de síntesis disponibles en tu navegador');
        this.stop();
        return;
      }
      // Intentar seleccionar una voz automáticamente
      this.selectBestVoice();
      if (!this.selectedVoice) {
        // Usar la primera voz disponible como fallback
        this.selectedVoice = voices.find(v => v.lang.startsWith('es')) || voices[0];
        // console.warn('⚠️ Usando voz fallback:', this.selectedVoice?.name);
      }
    }

    // Chrome/Brave fix: cancelar cualquier síntesis pendiente antes de hablar
    // Esto previene que se quede "colgado" en algunos navegadores
    if (this.synthesis.speaking || this.synthesis.pending) {
      this.synthesis.cancel();
    }

    try {
      // Crear utterance
      this.utterance = new SpeechSynthesisUtterance(paragraph.text);
      this.utterance.voice = this.selectedVoice;
      this.utterance.rate = this.rate;
      this.utterance.pitch = 1.0;
      this.utterance.volume = 1.0;

      // Siempre definir idioma para compatibilidad con Chrome/Brave
      this.utterance.lang = this.selectedVoice?.lang || 'es-ES';

      // En Android, asegurar que lang esté definido
      if (this.isAndroid && !this.utterance.lang) {
        this.utterance.lang = 'es-ES';
      }
    } catch (error) {
      console.error('❌ Error creando utterance:', error);
      this.stop();
      return;
    }

    // Eventos
    this.utterance.onstart = () => {
      logger.log('▶️ Iniciando síntesis de párrafo', index);
    };

    // ⭐ Boundary event para seguimiento palabra por palabra
    if (this.wordByWordEnabled) {
      this.utterance.onboundary = (event) => {
        // El evento boundary se dispara en cada límite de palabra
        if (event.name === 'word') {
          this.highlightWord(event.charIndex, event.charLength);
        }
      };
    }

    this.utterance.onend = () => {
      paragraph.spoken = true;

      // Avanzar al siguiente párrafo
      this.currentParagraphIndex++;

      if (this.currentParagraphIndex < this.paragraphs.length && this.isPlaying && !this.isPaused) {
        // Continuar con el siguiente
        setTimeout(() => {
          this.speakParagraph(this.currentParagraphIndex);
        }, 300); // Pequeña pausa entre párrafos
      } else {
        // Terminó el capítulo
        this.onChapterEnd();
      }
    };

    this.utterance.onerror = (event) => {
      // Algunos navegadores reportan errores espurios, ignorar "interrupted"
      if (event.error === 'interrupted' || event.error === 'canceled') {
        logger.log('⚠️ Síntesis interrumpida:', event.error);
        return;
      }
      console.error('❌ Error en síntesis de voz:', event);
      this.stop();
    };

    // Iniciar síntesis
    try {
      this.synthesis.speak(this.utterance);

      // Chrome/Brave workaround: forzar resume si se queda pausado
      // Algunos navegadores quedan en pausa automáticamente
      setTimeout(() => {
        if (this.synthesis.paused && !this.isPaused) {
          this.synthesis.resume();
        }
      }, 100);
    } catch (error) {
      console.error('❌ Error al iniciar síntesis:', error);
      this.stop();
    }
  }

  async speakWithOpenAI(paragraph, index) {
    if (!this.ttsManager) {
      console.error('❌ TTSManager no disponible');
      this.stop();
      return;
    }

    try {
      const voice = localStorage.getItem('openai-voice') || 'nova';
      const model = localStorage.getItem('openai-model') || 'tts-1';

      logger.log('🎙️ Iniciando síntesis OpenAI con voz:', voice);

      await this.ttsManager.speak(paragraph.text, {
        voice,
        model,
        speed: this.rate,
        onProgress: (current, total) => {
          // Actualizar UI con progreso (opcional)
          logger.log(`Progreso audio: ${current.toFixed(1)}s / ${total.toFixed(1)}s`);
        },
        onEnd: () => {
          paragraph.spoken = true;
          logger.log('✅ Síntesis OpenAI completada para párrafo', index);

          // Avanzar al siguiente párrafo
          this.currentParagraphIndex++;

          if (this.currentParagraphIndex < this.paragraphs.length && this.isPlaying && !this.isPaused) {
            // Pequeña pausa entre párrafos
            setTimeout(() => {
              if (this.isPlaying && !this.isPaused) {
                this.speakParagraph(this.currentParagraphIndex);
              }
            }, 300);
          } else {
            // Terminó el capítulo
            this.onChapterEnd();
          }
        },
        onError: (error) => {
          console.error('❌ Error en OpenAI TTS:', error);

          // Mostrar error específico
          if (error.message.includes('API key')) {
            window.toast?.error('API Key de OpenAI inválida');
          } else if (error.message.includes('créditos')) {
            window.toast?.error('Sin créditos en OpenAI. Añade saldo a tu cuenta');
          } else if (error.message.includes('límite')) {
            window.toast?.error('Límite de uso alcanzado. Intenta más tarde');
          } else {
            window.toast?.error('Error en voz premium');
          }

          // Fallback automático a navegador
          logger.log('⚠️ Fallback a Web Speech API');
          this.ttsProvider = 'browser';
          localStorage.setItem('tts-provider', 'browser');
          this.ttsManager.setProvider('browser');

          // Reintentar con Web Speech API
          this.speakWithWebSpeechAPI(paragraph, index);
        }
      });
    } catch (error) {
      console.error('❌ Error en speakWithOpenAI:', error);
      window.toast?.error('Error en voz premium, usando voz del navegador');

      // Fallback a navegador
      this.ttsProvider = 'browser';
      localStorage.setItem('tts-provider', 'browser');
      this.speakWithWebSpeechAPI(paragraph, index);
    }
  }

  async speakWithElevenLabs(paragraph, index) {
    if (!this.ttsManager || !this.ttsManager.providers.elevenlabs) {
      console.error('❌ ElevenLabs provider no disponible');
      // Fallback a navegador
      this.speakWithWebSpeechAPI(paragraph, index);
      return;
    }

    try {
      const voice = localStorage.getItem('elevenlabs-voice') || 'EXAVITQu4vr4xnSDxMaL'; // Sara por defecto
      const stability = parseFloat(localStorage.getItem('elevenlabs-stability') || '0.5');
      const similarityBoost = parseFloat(localStorage.getItem('elevenlabs-similarity') || '0.75');

      logger.log('🎙️ Iniciando síntesis ElevenLabs con voz:', voice);

      // Establecer contexto para el caché persistente
      const bookId = this.bookEngine?.currentBook || 'unknown';
      const chapterId = this.bookEngine?.currentChapter || 'unknown';
      this.ttsManager.providers.elevenlabs.setContext(bookId, chapterId, index);

      // Usar el provider ElevenLabs directamente (maneja créditos internamente)
      await this.ttsManager.providers.elevenlabs.speak(paragraph.text, {
        voice,
        stability,
        similarity_boost: similarityBoost,
        speed: this.rate,
        onProgress: (current, total) => {
          logger.log(`Progreso audio: ${current.toFixed(1)}s / ${total.toFixed(1)}s`);
        },
        onEnd: () => {
          paragraph.spoken = true;
          logger.log('✅ Síntesis ElevenLabs completada para párrafo', index);

          // Avanzar al siguiente párrafo
          this.currentParagraphIndex++;

          if (this.currentParagraphIndex < this.paragraphs.length && this.isPlaying && !this.isPaused) {
            setTimeout(() => {
              if (this.isPlaying && !this.isPaused) {
                this.speakParagraph(this.currentParagraphIndex);
              }
            }, 300);
          } else {
            this.onChapterEnd();
          }
        },
        onError: (error) => {
          console.error('❌ Error en ElevenLabs TTS:', error);

          // Mostrar error específico
          if (error.message.includes('Premium')) {
            window.toast?.error('Voces ElevenLabs requieren suscripción Premium');
          } else if (error.message.includes('créditos') || error.message.includes('insuficientes')) {
            window.toast?.error('Sin créditos para ElevenLabs. Renueva tu suscripción');
          } else if (error.message.includes('API key')) {
            window.toast?.error('API key de ElevenLabs no configurada');
          } else {
            window.toast?.error('Error en voz ElevenLabs');
          }

          // Fallback automático a navegador
          logger.log('⚠️ Fallback a Web Speech API');
          this.ttsProvider = 'browser';
          localStorage.setItem('tts-provider', 'browser');
          if (this.ttsManager) {
            this.ttsManager.setProvider('browser');
          }

          // Reintentar con Web Speech API
          this.speakWithWebSpeechAPI(paragraph, index);
        }
      });
    } catch (error) {
      console.error('❌ Error en speakWithElevenLabs:', error);
      window.toast?.error('Error en voz premium, usando voz del navegador');

      // Fallback a navegador
      this.ttsProvider = 'browser';
      localStorage.setItem('tts-provider', 'browser');
      this.speakWithWebSpeechAPI(paragraph, index);
    }
  }

  async onChapterEnd() {
    logger.log('✅ Capítulo terminado');
    this.isPlaying = false;
    this.isPaused = false;
    this.clearHighlights();
    await this.updateUI();

    // Si auto-advance está activado, pasar al siguiente capítulo
    if (this.autoAdvanceChapter) {
      logger.log('🔄 Auto-avance activado, pasando al siguiente capítulo en 2s...');
      setTimeout(() => {
        this.advanceToNextChapter();
      }, 2000);
    } else {
      // Solo liberar wake lock si NO hay auto-advance (si hay, se sigue reproduciendo)
      await this.releaseWakeLock();
    }
  }

  advanceToNextChapter() {
    const currentChapter = window.bookReader && window.bookReader.currentChapter;
    if (!currentChapter) return;

    const nextChapter = this.bookEngine.getNextChapter(currentChapter.id);
    if (nextChapter && window.bookReader) {
      window.bookReader.navigateToChapter(nextChapter.id);

      // Esperar a que se cargue el nuevo capítulo y continuar reproducción
      setTimeout(() => {
        const newContent = document.querySelector('.chapter-content');
        if (newContent) {
          this.play(newContent.innerHTML);
        }
      }, 1000);
    }
  }

  // ==========================================================================
  // HIGHLIGHTING
  // ==========================================================================

  async highlightParagraph(index) {
    // Limpiar highlights anteriores
    this.clearHighlights();

    // Buscar el párrafo en el DOM actual
    const chapterContent = document.querySelector('.chapter-content');
    if (!chapterContent) return;

    const elements = chapterContent.querySelectorAll('p, h2, h3, li, blockquote');

    if (elements[index]) {
      elements[index].classList.add('audioreader-highlight');

      // Si el modo palabra por palabra está activado, envolver cada palabra en un span
      if (this.wordByWordEnabled) {
        this.wrapWordsInSpans(elements[index]);
      }

      // Scroll suave al párrafo
      elements[index].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }

    await this.updateUI();
  }

  wrapWordsInSpans(element) {
    // Guardar el HTML original en caso de que ya esté procesado
    if (element.hasAttribute('data-original-html')) {
      return; // Ya está procesado
    }

    // Guardar el texto original
    element.setAttribute('data-original-html', element.innerHTML);

    // Obtener el texto del elemento
    const originalHTML = element.innerHTML;

    // Dividir por palabras pero manteniendo espacios y puntuación
    const words = originalHTML.split(/(\s+)/);

    this.wordsInCurrentParagraph = [];
    let htmlWithSpans = '';
    let wordIndex = 0;

    words.forEach(segment => {
      // Si es un espacio, añadirlo directamente
      if (/^\s+$/.test(segment)) {
        htmlWithSpans += segment;
      } else if (segment.trim().length > 0) {
        // Es una palabra (puede incluir puntuación)
        htmlWithSpans += `<span class="audioreader-word" data-word-index="${wordIndex}">${segment}</span>`;
        this.wordsInCurrentParagraph.push(segment);
        wordIndex++;
      }
    });

    element.innerHTML = htmlWithSpans;
    this.currentWordIndex = 0;
  }

  highlightWord(charIndex, charLength) {
    // Limpiar resaltado de palabra anterior
    const previousWord = document.querySelector('.audioreader-word-active');
    if (previousWord) {
      previousWord.classList.remove('audioreader-word-active');
    }

    // Encontrar la palabra actual basándose en el índice de caracteres
    const chapterContent = document.querySelector('.chapter-content');
    if (!chapterContent) return;

    const words = chapterContent.querySelectorAll('.audioreader-word');

    // Calcular qué palabra corresponde al índice de caracteres
    let charCount = 0;
    for (let i = 0; i < words.length; i++) {
      const wordText = words[i].textContent;
      const wordStart = charCount;
      const wordEnd = charCount + wordText.length;

      // Verificar si el boundary está dentro de esta palabra
      if (charIndex >= wordStart && charIndex < wordEnd) {
        words[i].classList.add('audioreader-word-active');

        // Scroll suave a la palabra si está fuera de vista
        words[i].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });

        this.currentWordIndex = i;
        break;
      }

      charCount += wordText.length + 1; // +1 por el espacio
    }
  }

  clearHighlights() {
    const highlighted = document.querySelectorAll('.audioreader-highlight');
    highlighted.forEach(el => {
      el.classList.remove('audioreader-highlight');

      // Restaurar HTML original si fue procesado para palabra por palabra
      if (el.hasAttribute('data-original-html')) {
        el.innerHTML = el.getAttribute('data-original-html');
        el.removeAttribute('data-original-html');
      }
    });

    // Limpiar también palabras activas
    const activeWords = document.querySelectorAll('.audioreader-word-active');
    activeWords.forEach(el => el.classList.remove('audioreader-word-active'));
  }

  // ==========================================================================
  // UI - CONTROLES
  // ==========================================================================

  async renderControls() {
    try {
      console.log('🎧 renderControls() START');
      // Remover controles existentes
      const existing = document.getElementById('audioreader-controls');
      if (existing) existing.remove();

      const bookData = this.bookEngine.getCurrentBookData();
      if (!bookData) {
        alert('ERROR: No hay bookData - libro no cargado');
        return;
      }

      const voices = await this.getAvailableVoices();

      const tiempoEstimado = this.calcularTiempoEstimado();
      const bookmarks = this.getBookmarksForCurrentChapter();
      const sleepTimerRestante = this.getSleepTimerRemaining();

      // Renderizar versión minimizada o expandida
      if (this.isMinimized) {
        console.log('🎧 Rendering minimized player...');
        return this.renderMinimizedPlayer(bookData, tiempoEstimado);
      }

      console.log('🎧 Rendering full player...');
      // Ya no hay bottom nav, siempre bottom-0
      const bottomOffset = 'bottom-0';

    const html = `
      <div id="audioreader-controls"
           style="position:fixed !important; bottom:0 !important; left:0 !important; right:0 !important; z-index:99999 !important; display:flex !important; visibility:visible !important; opacity:1 !important; background:#1e293b !important; min-height:200px !important;"
           class="fixed ${bottomOffset} left-0 right-0 sm:bottom-6 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 max-w-full sm:max-w-5xl max-h-[70vh] sm:max-h-[85vh] flex flex-col bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border-2 border-slate-300 dark:border-slate-700/50 sm:rounded-2xl rounded-t-2xl shadow-2xl z-[9000] backdrop-blur-lg transition-transform duration-300">

        <!-- Header FIJO: Barra de arrastre, Título y botones -->
        <div class="flex-shrink-0 px-4 sm:px-8 pt-3 sm:pt-4 pb-2 border-b border-slate-200 dark:border-slate-700/50">
          <!-- Barra de arrastre (solo móvil) -->
          <div id="audioreader-drag-handle" class="sm:hidden flex justify-center pb-2 cursor-grab active:cursor-grabbing touch-none">
            <div class="w-12 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full"></div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <div class="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">${bookData.title}</div>
              <div class="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                ${this.paragraphs.length > 0
                  ? `<span>${this.currentParagraphIndex + 1}/${this.paragraphs.length}</span>
                     ${tiempoEstimado > 0 ? `<span>• ${this.formatearTiempo(tiempoEstimado)}</span>` : ''}`
                  : '<span>Listo</span>'
                }
                ${sleepTimerRestante > 0 ? `<span class="text-orange-400">• 😴 ${sleepTimerRestante}m</span>` : ''}
              </div>
            </div>

            <!-- Botones minimizar y cerrar -->
            <div class="flex items-center gap-1 ml-2">
              <button id="audioreader-minimize"
                      class="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400 transition flex items-center justify-center"
                      title="Minimizar">
                ${Icons.chevronDown(20)}
              </button>
              <button id="audioreader-close"
                      class="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/50 text-red-500 dark:text-red-400 transition flex items-center justify-center"
                      title="Cerrar (Esc)">
                ${Icons.close(20)}
              </button>
            </div>
          </div>
        </div>

        <!-- Contenido scrolleable -->
        <div class="flex-1 overflow-y-auto px-4 sm:px-8 py-3 sm:py-4">

        <!-- Controles principales: Play/Pause centrado con prev/next y stop -->
        <div class="flex items-center justify-center gap-2 sm:gap-4 mb-3 sm:mb-4">
          <button id="audioreader-prev"
                  class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center text-slate-900 dark:text-white"
                  ${this.currentParagraphIndex === 0 || this.paragraphs.length === 0 ? 'disabled' : ''}
                  title="Anterior">
            ${Icons.skipBack(18)}
          </button>

          ${!this.isPlaying || this.isPaused ? `
            <button id="audioreader-play"
                    class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-xl flex items-center justify-center text-white"
                    title="Reproducir">
              ${Icons.play(28)}
            </button>
          ` : `
            <button id="audioreader-pause"
                    class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 transition-all shadow-xl flex items-center justify-center text-white animate-pulse"
                    title="Pausar">
              ${Icons.pause(28)}
            </button>
          `}

          <button id="audioreader-next"
                  class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center text-slate-900 dark:text-white"
                  ${this.currentParagraphIndex >= this.paragraphs.length - 1 || this.paragraphs.length === 0 ? 'disabled' : ''}
                  title="Siguiente">
            ${Icons.skipForward(18)}
          </button>

          <button id="audioreader-stop"
                  class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-100 dark:bg-red-600/20 hover:bg-red-200 dark:hover:bg-red-600/30 border border-red-300 dark:border-red-500/50 text-red-600 dark:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                  ${!this.isPlaying && !this.isPaused ? 'disabled' : ''}
                  title="Detener">
            ${Icons.stop(18)}
          </button>
        </div>

        <!-- Controles secundarios: diseño compacto -->
        <div class="grid grid-cols-2 gap-2 mb-3">
          <!-- Velocidad -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-600 dark:text-slate-400">⚡</span>
            <select id="audioreader-rate"
                    class="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-cyan-500 focus:outline-none">
              <option value="0.5" ${this.rate === 0.5 ? 'selected' : ''}>0.5x</option>
              <option value="0.75" ${this.rate === 0.75 ? 'selected' : ''}>0.75x</option>
              <option value="1" ${this.rate === 1.0 ? 'selected' : ''}>1x</option>
              <option value="1.25" ${this.rate === 1.25 ? 'selected' : ''}>1.25x</option>
              <option value="1.5" ${this.rate === 1.5 ? 'selected' : ''}>1.5x</option>
              <option value="2" ${this.rate === 2.0 ? 'selected' : ''}>2x</option>
            </select>
          </div>

          <!-- Sleep Timer -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-600 dark:text-slate-400">😴</span>
            <select id="audioreader-sleep-timer"
                    class="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-orange-500 focus:outline-none ${sleepTimerRestante > 0 ? 'ring-1 ring-orange-400' : ''}">
              <option value="0" ${sleepTimerRestante === 0 ? 'selected' : ''}>Off</option>
              <option value="15" ${this.sleepTimerMinutes === 15 ? 'selected' : ''}>15m</option>
              <option value="30" ${this.sleepTimerMinutes === 30 ? 'selected' : ''}>30m</option>
              <option value="60" ${this.sleepTimerMinutes === 60 ? 'selected' : ''}>60m</option>
            </select>
          </div>

          <!-- Voz (si hay múltiples) -->
          ${voices.length > 1 ? `
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-600 dark:text-slate-400">🗣️</span>
              <select id="audioreader-voice"
                      class="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white truncate focus:ring-1 focus:ring-cyan-500 focus:outline-none">
                ${voices.map((v, idx) => {
                  const voiceId = v.voiceURI || v.name || `voice-${idx}`;
                  const displayName = this.simplificarNombreVoz(v.name || v.voiceURI || `Voz ${idx + 1}`);
                  const isSelected = this.selectedVoice && (this.selectedVoice.voiceURI === v.voiceURI || this.selectedVoice.name === v.name);
                  return `<option value="${voiceId}" ${isSelected ? 'selected' : ''}>${displayName}</option>`;
                }).join('')}
              </select>
            </div>
          ` : ''}

          <!-- TTS Provider -->
          ${this.ttsManager ? `
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-600 dark:text-slate-400">🔊</span>
              <select id="audioreader-tts-provider"
                      class="flex-1 px-2 py-1 rounded text-xs font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none ${
                        this.ttsProvider === 'elevenlabs'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : this.ttsProvider === 'openai'
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
                            : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white'
                      }">
                <option value="browser" ${this.ttsProvider === 'browser' ? 'selected' : ''}>Navegador</option>
                ${localStorage.getItem('openai-tts-key') ? `
                  <option value="openai" ${this.ttsProvider === 'openai' ? 'selected' : ''}>OpenAI</option>
                ` : ''}
                ${this.ttsManager.isElevenLabsAvailable?.() || (this.ttsManager.providers?.elevenlabs && window.authHelper?.isPremium?.()) ? `
                  <option value="elevenlabs" ${this.ttsProvider === 'elevenlabs' ? 'selected' : ''}>ElevenLabs</option>
                ` : ''}
              </select>
            </div>
          ` : ''}
        </div>

        <!-- Botones de opciones -->
        <div class="flex gap-2 mb-3">
          <button id="audioreader-auto-advance"
                  class="flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                    this.autoAdvanceChapter
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }">
            ${Icons.book(14)} Auto
          </button>

          <button id="audioreader-word-by-word"
                  class="flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                    this.wordByWordEnabled
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }">
            ✨ Palabra
          </button>

          <button id="audioreader-add-bookmark"
                  class="flex-1 px-2 py-1.5 rounded text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white transition-all flex items-center justify-center gap-1"
                  title="Bookmark">
            ${Icons.bookmark(14)} Marcar
          </button>

          ${window.audioControlModal ? `
            <button id="audioreader-audio-control"
                    class="px-2 py-1.5 rounded text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white transition-all flex items-center justify-center"
                    title="Audio avanzado">
              ${Icons.headphones(14)}
            </button>
          ` : ''}
        </div>

        <!-- Ambiente y Binaural (colapsable en móvil) -->
        <details class="mb-2">
          <summary class="text-xs font-medium text-purple-700 dark:text-purple-300 cursor-pointer flex items-center gap-1 py-1">
            🎵 Ambiente y Binaural
          </summary>
          <div class="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg grid grid-cols-2 gap-2">
            <select id="audioreader-ambient-select"
                    class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-purple-500 focus:outline-none">
              <option value="">🌊 Sin ambiente</option>
              <option value="rain">🌧️ Lluvia</option>
              <option value="forest">🌳 Bosque</option>
              <option value="ocean">🌊 Océano</option>
              <option value="fire">🔥 Fogata</option>
            </select>

            <select id="audioreader-binaural-select"
                    class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-none">
              <option value="">🧠 Sin binaural</option>
              <option value="focus">🎯 Enfoque</option>
              <option value="relax">😌 Relax</option>
              <option value="deep">🧘 Meditación</option>
              <option value="sleep">😴 Sueño</option>
            </select>

            <div class="col-span-2 flex items-center gap-2">
              <span class="text-xs text-slate-600 dark:text-slate-400">Vol</span>
              <input type="range" id="audioreader-ambient-volume"
                     min="0" max="100" value="30"
                     class="flex-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full appearance-none cursor-pointer accent-purple-500">
              <span id="audioreader-ambient-volume-label" class="text-xs text-slate-600 dark:text-slate-400 w-6">30%</span>
            </div>
          </div>
        </details>

        <!-- Progress bar -->
        ${this.paragraphs.length > 0 ? `
          <div class="mt-2 w-full h-1 bg-slate-300 dark:bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-cyan-500 transition-all"
                 style="width: ${((this.currentParagraphIndex + 1) / this.paragraphs.length * 100).toFixed(1)}%">
            </div>
          </div>
        ` : ''}

        <!-- Bookmarks List (si hay) -->
        ${bookmarks.length > 0 ? `
          <div class="mt-2 pt-2 border-t border-slate-300 dark:border-slate-700">
            <div class="text-xs text-slate-600 dark:text-slate-400 opacity-75 mb-1">📌 Bookmarks (Ctrl+1-9):</div>
            <div class="flex flex-wrap gap-1">
              ${bookmarks.map((bm, idx) => `
                <button class="audioreader-bookmark-item px-2 py-1 text-xs bg-purple-200 dark:bg-purple-900/30 hover:bg-purple-300 dark:hover:bg-purple-700 text-purple-900 dark:text-purple-200 rounded border border-purple-300 dark:border-purple-700/50 transition"
                        data-bookmark-index="${idx}"
                        title="${bm.nombre}">
                  ${idx + 1}. ${bm.nombre.substring(0, 15)}${bm.nombre.length > 15 ? '...' : ''}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Ayuda de atajos (colapsable, oculto en móvil) -->
        <details class="hidden sm:block mt-2 text-xs text-slate-600 dark:text-slate-400 opacity-70">
          <summary class="cursor-pointer hover:opacity-100">⌨️ Atajos</summary>
          <div class="mt-1 grid grid-cols-3 gap-1 text-xs">
            <div><kbd class="px-1 bg-slate-200 dark:bg-slate-800 rounded">Espacio</kbd> Play</div>
            <div><kbd class="px-1 bg-slate-200 dark:bg-slate-800 rounded">←/→</kbd> Nav</div>
            <div><kbd class="px-1 bg-slate-200 dark:bg-slate-800 rounded">Esc</kbd> Cerrar</div>
          </div>
        </details>

        </div><!-- Fin contenido scrolleable -->
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    this.attachControlListeners();
    this.attachDragListeners();

    // IMPORTANTE: Siempre re-adjuntar keyboard listeners cuando re-renderizamos
    const estabanActivos = this.keyboardListenerAttached;
    if (estabanActivos) {
      this.detachKeyboardListeners();
    }
    this.attachKeyboardListeners();
    console.log('🎧 renderControls() DONE');
    } catch (error) {
      console.error('🎧 ERROR in renderControls():', error);
      alert('Error renderControls: ' + error.message);
    }
  }

  renderMinimizedPlayer(bookData, tiempoEstimado) {
    // Detectar si hay bottom nav visible (móvil)
    const bottomNav = document.querySelector('.app-bottom-nav');
    const hasBottomNav = bottomNav && window.getComputedStyle(bottomNav).display !== 'none';

    // Actualizar el botón de Audio en el bottom nav si existe
    if (hasBottomNav) {
      this.updateBottomNavAudioButton();
    }

    const html = `
      <!-- Barra de progreso pegada al bottom nav con botón expandir -->
      ${hasBottomNav ? `
        <div id="audioreader-progress-bar"
             class="fixed left-0 right-0 z-[899] group cursor-pointer"
             style="bottom: 64px;">
          <!-- Progress bar -->
          ${this.paragraphs.length > 0 ? `
            <div class="relative w-full h-1 bg-cyan-500/30 dark:bg-cyan-400/30 group-hover:h-2 transition-all">
              <div class="h-full bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 transition-all duration-300"
                   style="width: ${((this.currentParagraphIndex + 1) / this.paragraphs.length * 100).toFixed(1)}%">
              </div>
              <!-- Botón expandir (visible al hover/touch) -->
              <button id="audioreader-expand-mini"
                      class="absolute right-2 -top-7 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity bg-slate-800 dark:bg-slate-700 text-white px-3 py-1.5 rounded-t-lg text-xs font-medium shadow-lg flex items-center gap-1"
                      title="Expandir reproductor">
                ${Icons.chevronUp(14)}
                <span>Expandir</span>
              </button>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Bottom Sheet Expandible -->
      <div id="audioreader-bottom-sheet"
           class="fixed left-0 right-0 z-[8999] transition-all duration-300 transform translate-y-full"
           style="bottom: ${hasBottomNav ? '64px' : '0'};">
        <div class="bg-white dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700 shadow-2xl backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95 rounded-t-3xl px-5 pb-5 pt-3">

          <!-- Handle para arrastrar -->
          <div class="flex justify-center pb-3">
            <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
          </div>

          <!-- Info del libro -->
          <div class="mb-4">
            <div class="font-bold text-sm text-slate-900 dark:text-white truncate mb-1">
              ${bookData.title}
            </div>
            <div class="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
              ${this.paragraphs.length > 0
                ? `<span>${this.currentParagraphIndex + 1}/${this.paragraphs.length}</span>
                   ${tiempoEstimado > 0 ? `<span>•</span><span>${this.formatearTiempo(tiempoEstimado)}</span>` : ''}`
                : '<span>Listo para narrar</span>'
              }
            </div>
          </div>

          <!-- Progress bar -->
          ${this.paragraphs.length > 0 ? `
            <div class="mb-4 w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-400 dark:to-blue-500 transition-all duration-500"
                   style="width: ${((this.currentParagraphIndex + 1) / this.paragraphs.length * 100).toFixed(1)}%">
              </div>
            </div>
          ` : ''}

          <!-- Controles -->
          <div class="flex items-center justify-center gap-3">
            <button id="audioreader-prev"
                    class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-md hover:shadow-lg active:scale-95"
                    ${this.currentParagraphIndex === 0 || this.paragraphs.length === 0 ? 'disabled' : ''}>
              ${Icons.skipBack(20)}
            </button>

            ${!this.isPlaying || this.isPaused ? `
              <button id="audioreader-play"
                      class="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 dark:from-cyan-600 dark:to-blue-700 dark:hover:from-cyan-500 dark:hover:to-blue-600 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center text-white active:scale-95">
                ${Icons.play(32)}
              </button>
            ` : `
              <button id="audioreader-pause"
                      class="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 dark:from-orange-600 dark:to-red-700 dark:hover:from-orange-500 dark:hover:to-red-600 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center text-white active:scale-95">
                ${Icons.pause(32)}
              </button>
            `}

            <button id="audioreader-next"
                    class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-md hover:shadow-lg active:scale-95"
                    ${this.currentParagraphIndex >= this.paragraphs.length - 1 || this.paragraphs.length === 0 ? 'disabled' : ''}>
              ${Icons.skipForward(20)}
            </button>
          </div>

          <!-- Acciones adicionales -->
          <div class="flex items-center justify-center gap-2 mt-4">
            <button id="audioreader-expand"
                    class="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow active:scale-95">
              ${Icons.chevronUp(18)}
              <span>Expandir</span>
            </button>

            <button id="audioreader-close"
                    class="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow active:scale-95">
              ${Icons.close(18)}
              <span>Cerrar</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Overlay para cerrar el bottom sheet -->
      <div id="audioreader-overlay"
           class="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-[8998] opacity-0 pointer-events-none transition-opacity duration-300">
      </div>

      <style>
        @keyframes pulse-soft {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(6, 182, 212, 0);
          }
        }
        .animate-pulse-soft {
          animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      </style>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    this.attachControlListeners();
    this.attachMinimizedPlayerGestures();
    this.attachDragListeners();

    const estabanActivos = this.keyboardListenerAttached;
    if (estabanActivos) {
      this.detachKeyboardListeners();
    }
    this.attachKeyboardListeners();
  }

  attachDragListeners() {
    // 🧹 Limpiar listeners anteriores primero
    this.detachDragListeners();

    const dragHandle = document.getElementById('audioreader-drag-handle');
    if (!dragHandle) return;

    // Guardar referencia al elemento
    this.dragHandlers.dragHandleElement = dragHandle;

    // Crear handlers y guardar referencias
    this.dragHandlers.onDragStart = (e) => {
      this.isDragging = true;
      this.dragStartY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
      dragHandle.style.cursor = 'grabbing';
    };

    this.dragHandlers.onDragMove = (e) => {
      if (!this.isDragging) return;
      e.preventDefault();

      this.dragCurrentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
      const deltaY = this.dragCurrentY - this.dragStartY;

      // Si arrastra hacia abajo más de 50px, minimizar
      // Si arrastra hacia arriba más de 50px, expandir
      if (this.isMinimized && deltaY < -50) {
        this.toggleMinimize();
        this.isDragging = false;
      } else if (!this.isMinimized && deltaY > 50) {
        this.toggleMinimize();
        this.isDragging = false;
      }
    };

    this.dragHandlers.onDragEnd = () => {
      this.isDragging = false;
      dragHandle.style.cursor = 'grab';
    };

    // Touch events
    dragHandle.addEventListener('touchstart', this.dragHandlers.onDragStart, { passive: true });
    document.addEventListener('touchmove', this.dragHandlers.onDragMove, { passive: false });
    document.addEventListener('touchend', this.dragHandlers.onDragEnd);

    // Mouse events
    dragHandle.addEventListener('mousedown', this.dragHandlers.onDragStart);
    document.addEventListener('mousemove', this.dragHandlers.onDragMove);
    document.addEventListener('mouseup', this.dragHandlers.onDragEnd);
  }

  detachDragListeners() {
    // Remover listeners si existen
    if (this.dragHandlers.onDragStart) {
      const dragHandle = this.dragHandlers.dragHandleElement;
      if (dragHandle) {
        dragHandle.removeEventListener('touchstart', this.dragHandlers.onDragStart);
        dragHandle.removeEventListener('mousedown', this.dragHandlers.onDragStart);
      }
    }

    if (this.dragHandlers.onDragMove) {
      document.removeEventListener('touchmove', this.dragHandlers.onDragMove);
      document.removeEventListener('mousemove', this.dragHandlers.onDragMove);
    }

    if (this.dragHandlers.onDragEnd) {
      document.removeEventListener('touchend', this.dragHandlers.onDragEnd);
      document.removeEventListener('mouseup', this.dragHandlers.onDragEnd);
    }

    // Limpiar referencias
    this.dragHandlers = {
      onDragStart: null,
      onDragMove: null,
      onDragEnd: null,
      dragHandleElement: null
    };
  }

  updateBottomNavAudioButton() {
    const audioTab = document.querySelector('[data-tab="audio"]');
    if (!audioTab) return;

    const icon = audioTab.querySelector('.app-bottom-nav-icon');
    const label = audioTab.querySelector('.app-bottom-nav-label');

    if (!icon || !label) return;

    // Transformar el botón según el estado
    if (this.paragraphs.length > 0) {
      // Hay contenido cargado
      if (this.isPlaying && !this.isPaused) {
        // Está reproduciendo → mostrar Pause
        icon.innerHTML = '⏸️';
        label.textContent = 'Pausa';
        audioTab.classList.add('active');
      } else {
        // Está pausado o detenido → mostrar Play
        icon.innerHTML = '▶️';
        label.textContent = 'Play';
        audioTab.classList.add('active');
      }
    } else {
      // Sin contenido → estado por defecto
      icon.innerHTML = '🎧';
      label.textContent = 'Audio';
      audioTab.classList.remove('active');
    }

    // Actualizar el handler del click
    audioTab.onclick = (e) => {
      e.preventDefault();
      if (this.paragraphs.length > 0) {
        // Play/Pause directo
        if (this.isPlaying && !this.isPaused) {
          this.pause();
        } else {
          this.resume();
        }
      } else {
        // Abrir bottom sheet para seleccionar contenido
        window.bookReader?.toggleAudioPlayer();
      }
    };

    // Actualizar barra de progreso si existe
    this.updateProgressBar();
  }

  // ⭐ Sincronizar iconos del header con el estado actual
  updateHeaderAudioIcons() {
    const iconMobile = document.getElementById('audio-icon-mobile');
    const expandBtn = document.getElementById('audio-expand-btn-mobile');
    const progressContainer = document.getElementById('audio-progress-bar-container');
    const paraInfo = document.getElementById('audio-paragraph-info');

    if (!iconMobile) return; // Si no hay icono, salir

    // Determinar qué icono mostrar según el estado
    if (this.paragraphs.length === 0) {
      // Sin contenido preparado → icono de auriculares
      iconMobile.innerHTML = Icons.audio ? Icons.audio(20) : '🎧';
      if (expandBtn) expandBtn.classList.add('hidden');
      if (progressContainer) progressContainer.classList.add('hidden');
    } else if (this.isPlaying && !this.isPaused) {
      // Reproduciendo → icono de pausa
      iconMobile.innerHTML = Icons.pause ? Icons.pause(20) : '⏸';
      if (expandBtn) expandBtn.classList.remove('hidden');
      if (progressContainer) progressContainer.classList.remove('hidden');
    } else {
      // Pausado o detenido con contenido → icono de play
      iconMobile.innerHTML = Icons.play ? Icons.play(20) : '▶';
      if (expandBtn) expandBtn.classList.remove('hidden');
      if (progressContainer) progressContainer.classList.remove('hidden');
    }

    // Actualizar info de párrafo
    if (paraInfo && this.paragraphs.length > 0) {
      paraInfo.textContent = `${this.currentParagraphIndex + 1}/${this.paragraphs.length}`;
    }
  }

  updateProgressBar() {
    const progressBar = document.getElementById('audioreader-progress-bar');
    if (!progressBar || this.paragraphs.length === 0) return;

    const progressFill = progressBar.querySelector('div > div');
    if (progressFill) {
      const percentage = ((this.currentParagraphIndex + 1) / this.paragraphs.length * 100).toFixed(1);
      progressFill.style.width = `${percentage}%`;
    }
  }

  attachMinimizedPlayerGestures() {
    // Ya no se usa el FAB, todo se maneja desde el bottom nav
    // Esta función ahora solo gestiona el opening del long press en la barra de progreso
    const progressBar = document.getElementById('audioreader-progress-bar');
    if (!progressBar) return;

    // Long press en la barra de progreso para abrir el bottom sheet completo
    let longPressTimer = null;

    progressBar.addEventListener('touchstart', (e) => {
      longPressTimer = setTimeout(() => {
        this.toggleMinimize(); // Expandir el reproductor completo
        if (navigator.vibrate) navigator.vibrate(50);
      }, 500);
    });

    progressBar.addEventListener('touchend', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    });

    progressBar.addEventListener('touchmove', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    });

    // Gestos de swipe para cerrar el bottom sheet
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (!isBottomSheetOpen) return;
      touchCurrentY = e.touches[0].clientY;
      const deltaY = touchCurrentY - touchStartY;

      // Si arrastra hacia abajo más de 100px, cerrar
      if (deltaY > 100) {
        isBottomSheetOpen = false;
        bottomSheet.classList.add('translate-y-full');
        overlay.classList.remove('opacity-100');
        overlay.classList.add('opacity-0', 'pointer-events-none');
        touchStartY = 0;
        touchCurrentY = 0;
      }
    };

    // Click handler para desktop (evitar conflicto con touch events)
    const handleFabClickDesktop = (e) => {
      // Solo ejecutar si NO fue un evento touch (para evitar doble disparo)
      if (e.pointerType === 'mouse' || !('ontouchstart' in window)) {
        handleFabClick(e);
      }
    };

    // Adjuntar eventos al FAB (touch para móvil, click para desktop)
    fab.addEventListener('touchstart', handleFabTouchStart, { passive: true });
    fab.addEventListener('touchend', handleFabTouchEnd, { passive: false }); // No passive para poder preventDefault
    fab.addEventListener('click', handleFabClickDesktop);

    // Adjuntar eventos al overlay y bottom sheet
    overlay.addEventListener('click', handleOverlayClick);
    bottomSheet.addEventListener('touchstart', handleTouchStart, { passive: true });
    bottomSheet.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Guardar referencias para limpieza posterior
    if (!this.minimizedPlayerGestureHandlers) {
      this.minimizedPlayerGestureHandlers = {};
    }
    this.minimizedPlayerGestureHandlers.fab = fab;
    this.minimizedPlayerGestureHandlers.overlay = overlay;
    this.minimizedPlayerGestureHandlers.bottomSheet = bottomSheet;
    this.minimizedPlayerGestureHandlers.handleFabClick = handleFabClick;
    this.minimizedPlayerGestureHandlers.handleFabClickDesktop = handleFabClickDesktop;
    this.minimizedPlayerGestureHandlers.handleFabTouchStart = handleFabTouchStart;
    this.minimizedPlayerGestureHandlers.handleFabTouchEnd = handleFabTouchEnd;
    this.minimizedPlayerGestureHandlers.handleOverlayClick = handleOverlayClick;
    this.minimizedPlayerGestureHandlers.handleTouchStart = handleTouchStart;
    this.minimizedPlayerGestureHandlers.handleTouchMove = handleTouchMove;
  }

  detachMinimizedPlayerGestures() {
    if (!this.minimizedPlayerGestureHandlers) return;

    const {
      fab,
      overlay,
      bottomSheet,
      handleFabClickDesktop,
      handleFabTouchStart,
      handleFabTouchEnd,
      handleOverlayClick,
      handleTouchStart,
      handleTouchMove
    } = this.minimizedPlayerGestureHandlers;

    if (fab) {
      if (handleFabTouchStart) fab.removeEventListener('touchstart', handleFabTouchStart);
      if (handleFabTouchEnd) fab.removeEventListener('touchend', handleFabTouchEnd);
      if (handleFabClickDesktop) fab.removeEventListener('click', handleFabClickDesktop);
    }
    if (overlay && handleOverlayClick) {
      overlay.removeEventListener('click', handleOverlayClick);
    }
    if (bottomSheet) {
      if (handleTouchStart) bottomSheet.removeEventListener('touchstart', handleTouchStart);
      if (handleTouchMove) bottomSheet.removeEventListener('touchmove', handleTouchMove);
    }

    this.minimizedPlayerGestureHandlers = null;
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    localStorage.setItem('audioreader-minimized', this.isMinimized);
    this.renderControls();
  }

  attachControlListeners() {
    // Play
    const playBtn = document.getElementById('audioreader-play');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        // Si hay párrafos preparados y está pausado, solo reanudar
        if (this.paragraphs.length > 0 && this.isPaused) {
          this.resume();
        } else if (this.paragraphs.length > 0) {
          // Si hay contenido pero no está pausado, reproducir desde posición actual
          this.isPlaying = true;
          this.isPaused = false;
          this.speakParagraph(this.currentParagraphIndex);
          this.updateUI();
        } else {
          // Si no hay contenido preparado, preparar y reproducir desde inicio
          const chapterContent = document.querySelector('.chapter-content');
          if (chapterContent) {
            this.play(chapterContent.innerHTML);
          }
        }
      });
    }

    // Pause
    const pauseBtn = document.getElementById('audioreader-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.pause());
    }

    // Stop
    const stopBtn = document.getElementById('audioreader-stop');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.stop());
    }

    // Previous
    const prevBtn = document.getElementById('audioreader-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previous());
    }

    // Next
    const nextBtn = document.getElementById('audioreader-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.next());
    }

    // Rate
    const rateSelect = document.getElementById('audioreader-rate');
    if (rateSelect) {
      rateSelect.addEventListener('change', (e) => this.setRate(e.target.value));
    }

    // Voice
    const voiceSelect = document.getElementById('audioreader-voice');
    if (voiceSelect) {
      voiceSelect.addEventListener('change', (e) => this.setVoice(e.target.value));
    }

    // Auto-advance
    const autoBtn = document.getElementById('audioreader-auto-advance');
    if (autoBtn) {
      autoBtn.addEventListener('click', () => this.toggleAutoAdvance());
    }

    // ⭐ Word by Word Toggle
    const wordByWordBtn = document.getElementById('audioreader-word-by-word');
    if (wordByWordBtn) {
      wordByWordBtn.addEventListener('click', () => this.toggleWordByWord());
    }

    // ⭐ TTS Provider Selector
    const ttsProviderSelect = document.getElementById('audioreader-tts-provider');
    if (ttsProviderSelect) {
      ttsProviderSelect.addEventListener('change', (e) => {
        this.setTTSProvider(e.target.value);
      });
    }

    // ⭐ Add Bookmark
    const addBookmarkBtn = document.getElementById('audioreader-add-bookmark');
    if (addBookmarkBtn) {
      addBookmarkBtn.addEventListener('click', () => this.addBookmark());
    }

    // ⭐ Sleep Timer
    const sleepTimerSelect = document.getElementById('audioreader-sleep-timer');
    if (sleepTimerSelect) {
      sleepTimerSelect.addEventListener('change', (e) => {
        const minutos = parseInt(e.target.value);
        this.setSleepTimer(minutos);
      });
    }

    // ⭐ Bookmark items (click para saltar)
    const bookmarkItems = document.querySelectorAll('.audioreader-bookmark-item');
    bookmarkItems.forEach(item => {
      item.addEventListener('click', () => {
        const indice = parseInt(item.getAttribute('data-bookmark-index'));
        this.jumpToBookmark(indice);
      });

      // Click derecho para eliminar
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const indice = parseInt(item.getAttribute('data-bookmark-index'));
        if (confirm('¿Eliminar este bookmark?')) {
          this.deleteBookmark(indice);
        }
      });
    });

    // ⭐ Audio Control Modal (Enhanced)
    const audioControlBtn = document.getElementById('audioreader-audio-control');
    if (audioControlBtn && window.audioControlModal) {
      audioControlBtn.addEventListener('click', () => {
        window.audioControlModal.open();
      });
    }

    // ⭐ Ambient Sound Select
    const ambientSelect = document.getElementById('audioreader-ambient-select');
    if (ambientSelect) {
      ambientSelect.addEventListener('change', async (e) => {
        const sound = e.target.value;
        // Inicializar AudioMixer si no existe
        if (!window.audioMixer && window.AudioMixer) {
          window.audioMixer = new AudioMixer();
          await window.audioMixer.initialize();
        }
        if (sound && window.audioMixer) {
          await window.audioMixer.playAmbient(sound);
          window.toast?.success(`🎵 Sonido: ${e.target.options[e.target.selectedIndex].text}`);
        } else if (!sound && window.audioMixer) {
          window.audioMixer.stopAmbient();
          window.toast?.info('🔇 Sonido ambiente desactivado');
        }
      });
    }

    // ⭐ Binaural Select
    const binauralSelect = document.getElementById('audioreader-binaural-select');
    if (binauralSelect) {
      binauralSelect.addEventListener('change', async (e) => {
        const preset = e.target.value;
        // Inicializar AudioMixer si no existe
        if (!window.audioMixer && window.AudioMixer) {
          window.audioMixer = new AudioMixer();
          await window.audioMixer.initialize();
        }
        if (preset && window.audioMixer) {
          await window.audioMixer.playBinaural(preset);
          window.toast?.success(`🧠 Binaural: ${e.target.options[e.target.selectedIndex].text}`);
        } else if (!preset && window.audioMixer) {
          window.audioMixer.stopBinaural();
          window.toast?.info('🔇 Binaural desactivado');
        }
      });
    }

    // ⭐ Ambient Volume
    const ambientVolume = document.getElementById('audioreader-ambient-volume');
    const ambientVolumeLabel = document.getElementById('audioreader-ambient-volume-label');
    if (ambientVolume) {
      ambientVolume.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value) / 100;
        if (window.audioMixer) {
          window.audioMixer.setChannelVolume('ambient', volume);
          window.audioMixer.setChannelVolume('binaural', volume);
        }
        if (ambientVolumeLabel) {
          ambientVolumeLabel.textContent = `${e.target.value}%`;
        }
      });
    }

    // Minimize/Expand
    const minimizeBtn = document.getElementById('audioreader-minimize');
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => this.toggleMinimize());
    }

    const expandBtn = document.getElementById('audioreader-expand');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => this.toggleMinimize());
    }

    // Expand mini (desde barra de progreso)
    const expandMiniBtn = document.getElementById('audioreader-expand-mini');
    if (expandMiniBtn) {
      expandMiniBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMinimize();
      });
    }

    // Close
    const closeBtn = document.getElementById('audioreader-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
  }

  async updateUI() {
    // NO re-renderizar todo, solo actualizar estados de botones
    this.updateButtonStates();
    this.updateProgressInfo();

    // Actualizar bottom nav y barra de progreso si está minimizado
    if (this.isMinimized) {
      this.updateBottomNavAudioButton();
      this.updateProgressBar();
    }

    // ⭐ Sincronizar iconos del header con estado actual
    this.updateHeaderAudioIcons();
  }

  updateButtonStates() {
    const controls = document.getElementById('audioreader-controls');
    if (!controls) return;

    // Actualizar botones Play/Pause
    const playBtn = document.getElementById('audioreader-play');
    const pauseBtn = document.getElementById('audioreader-pause');
    const playPauseContainer = playBtn?.parentElement || pauseBtn?.parentElement;

    if (playPauseContainer) {
      const shouldShowPlay = !this.isPlaying || this.isPaused;

      if (shouldShowPlay && !playBtn) {
        // Cambiar a botón Play
        playPauseContainer.innerHTML = `
          <button id="audioreader-play"
                  class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-cyan-600 hover:bg-cyan-700 transition flex items-center justify-center"
                  title="Reproducir">
            ${Icons.play(24)}
          </button>`;
        const newPlayBtn = document.getElementById('audioreader-play');
        newPlayBtn.addEventListener('click', () => {
          if (this.paragraphs.length > 0 && this.isPaused) {
            this.resume();
          } else if (this.paragraphs.length > 0) {
            this.isPlaying = true;
            this.isPaused = false;
            this.speakParagraph(this.currentParagraphIndex);
            this.updateUI();
          } else {
            const chapterContent = document.querySelector('.chapter-content');
            if (chapterContent) {
              this.play(chapterContent.innerHTML);
            }
          }
        });
      } else if (!shouldShowPlay && !pauseBtn) {
        // Cambiar a botón Pause
        playPauseContainer.innerHTML = `
          <button id="audioreader-pause"
                  class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-orange-600 hover:bg-orange-700 transition flex items-center justify-center"
                  title="Pausar">
            ${Icons.pause(24)}
          </button>`;
        const newPauseBtn = document.getElementById('audioreader-pause');
        newPauseBtn.addEventListener('click', () => this.pause());
      }
    }

    // Actualizar estado de botones prev/next/stop
    const prevBtn = document.getElementById('audioreader-prev');
    const nextBtn = document.getElementById('audioreader-next');
    const stopBtn = document.getElementById('audioreader-stop');

    if (prevBtn) {
      prevBtn.disabled = this.currentParagraphIndex === 0 || this.paragraphs.length === 0;
    }
    if (nextBtn) {
      nextBtn.disabled = this.currentParagraphIndex >= this.paragraphs.length - 1 || this.paragraphs.length === 0;
    }
    if (stopBtn) {
      stopBtn.disabled = !this.isPlaying && !this.isPaused;
    }

    // Actualizar botón Auto-advance
    const autoBtn = document.getElementById('audioreader-auto-advance');
    if (autoBtn) {
      if (this.autoAdvanceChapter) {
        autoBtn.className = 'w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30';
      } else {
        autoBtn.className = 'w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300';
      }
      const statusSpan = autoBtn.querySelector('span:last-child');
      if (statusSpan) statusSpan.textContent = this.autoAdvanceChapter ? 'ON' : 'OFF';
    }

    // Actualizar botón Word-by-Word
    const wordByWordBtn = document.getElementById('audioreader-word-by-word');
    if (wordByWordBtn) {
      if (this.wordByWordEnabled) {
        wordByWordBtn.className = 'w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/30';
      } else {
        wordByWordBtn.className = 'w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300';
      }
      const statusSpan = wordByWordBtn.querySelector('span:last-child');
      if (statusSpan) statusSpan.textContent = this.wordByWordEnabled ? 'ON' : 'OFF';
    }
  }

  updateProgressInfo() {
    const controls = document.getElementById('audioreader-controls');
    if (!controls) return;

    // Actualizar contador de párrafos y tiempo estimado
    const infoContainer = controls.querySelector('.text-xs.opacity-50');
    if (infoContainer && this.paragraphs.length > 0) {
      const tiempoEstimado = this.calcularTiempoEstimado();
      const sleepTimerRestante = this.getSleepTimerRemaining();

      infoContainer.innerHTML = `
        <span>Párrafo ${this.currentParagraphIndex + 1} / ${this.paragraphs.length}</span>
        ${tiempoEstimado > 0 ? `<span>• ${this.formatearTiempo(tiempoEstimado)} restante</span>` : ''}
        ${sleepTimerRestante > 0 ? `<span class="text-orange-400">• 😴 ${sleepTimerRestante}min</span>` : ''}
      `;
    }

    // Actualizar barra de progreso
    const progressBar = controls.querySelector('.h-1.bg-slate-800 .bg-cyan-500');
    if (progressBar && this.paragraphs.length > 0) {
      const progress = ((this.currentParagraphIndex + 1) / this.paragraphs.length * 100).toFixed(1);
      progressBar.style.width = `${progress}%`;
    }
  }

  // ==========================================================================
  // MOSTRAR/OCULTAR
  // ==========================================================================

  async show() {
    try {
      console.log('🎧 AudioReader.show() called');
      this.isMinimized = false;

      // Preparar contenido del capítulo actual
      const chapterContent = document.querySelector('.chapter-content');
      if (chapterContent) {
        this.prepareContent(chapterContent.innerHTML);
      }

      // Verificar si hay posición guardada
      const posicionGuardada = this.loadLastPosition();

      await this.renderControls();

      // Verificar que el elemento fue creado
      const controlsElement = document.getElementById('audioreader-controls');
      if (!controlsElement) {
        alert('ERROR: Panel de audio no creado');
        return;
      }

      // Adjuntar event listeners
      this.attachControlListeners();
      this.attachKeyboardListeners();

      // Si hay posición guardada, mostrar opción de continuar
      if (posicionGuardada && posicionGuardada.paragrafo > 0) {
        this.showContinueFromSavedPosition(posicionGuardada);
      }
    } catch (error) {
      console.error('🎧 ERROR in show():', error);
      alert('Error show(): ' + error.message);
    }
  }

  // Reproductor COMPLETO con estilos inline (funciona en móvil)
  showSimplePlayer() {
    const existing = document.getElementById('audioreader-controls');
    if (existing) existing.remove();

    const bookData = this.bookEngine?.getCurrentBookData() || { title: 'Audio' };
    const totalParagraphs = this.paragraphs?.length || 0;
    const currentPara = this.currentParagraphIndex + 1;
    const progress = totalParagraphs > 0 ? ((currentPara / totalParagraphs) * 100).toFixed(1) : 0;
    const tiempoEstimado = this.calcularTiempoEstimado ? this.calcularTiempoEstimado() : 0;
    const sleepRemaining = this.getSleepTimerRemaining ? this.getSleepTimerRemaining() : 0;

    const panel = document.createElement('div');
    panel.id = 'audioreader-controls';
    panel.style.cssText = 'position:fixed;bottom:0;left:0;right:0;max-height:70vh;overflow-y:auto;background:linear-gradient(to bottom right,#1e293b,#0f172a);color:white;z-index:999999;box-shadow:0 -4px 30px rgba(0,0,0,0.6);border-top:2px solid #0ea5e9;border-radius:16px 16px 0 0;';

    const isPlaying = this.isPlaying && !this.isPaused;

    panel.innerHTML = `
      <div style="padding:16px 20px;">
        <!-- Drag handle -->
        <div style="display:flex;justify-content:center;padding-bottom:8px;">
          <div style="width:48px;height:5px;background:#475569;border-radius:3px;"></div>
        </div>

        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="flex:1;min-width:0;">
            <div style="font-weight:bold;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${bookData.title}</div>
            <div style="font-size:12px;color:#94a3b8;">
              ${totalParagraphs > 0 ? `${currentPara}/${totalParagraphs}` : 'Listo'}
              ${tiempoEstimado > 0 ? ` • ${this.formatearTiempo(tiempoEstimado)}` : ''}
              ${sleepRemaining > 0 ? ` • 😴 ${sleepRemaining}m` : ''}
            </div>
          </div>
          <div style="display:flex;gap:6px;">
            <button id="audio-minimize-btn" style="width:36px;height:36px;background:#334155;border:none;border-radius:8px;color:#94a3b8;font-size:16px;cursor:pointer;">▼</button>
            <button id="audio-close-btn" style="width:36px;height:36px;background:#7f1d1d;border:none;border-radius:8px;color:#fca5a5;font-size:18px;cursor:pointer;">×</button>
          </div>
        </div>

        <!-- Controles principales -->
        <div style="display:flex;justify-content:center;align-items:center;gap:12px;margin-bottom:16px;">
          <button id="audio-prev-btn" style="width:46px;height:46px;background:linear-gradient(135deg,#475569,#334155);border:none;border-radius:12px;color:white;font-size:18px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);">⏮</button>
          <button id="audio-play-btn" style="width:60px;height:60px;background:linear-gradient(135deg,${isPlaying ? '#f97316,#dc2626' : '#06b6d4,#2563eb'});border:none;border-radius:16px;color:white;font-size:26px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,0.4);">${isPlaying ? '⏸' : '▶'}</button>
          <button id="audio-next-btn" style="width:46px;height:46px;background:linear-gradient(135deg,#475569,#334155);border:none;border-radius:12px;color:white;font-size:18px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);">⏭</button>
          <button id="audio-stop-btn" style="width:46px;height:46px;background:#7f1d1d;border:1px solid #dc2626;border-radius:12px;color:#fca5a5;font-size:18px;cursor:pointer;">⏹</button>
        </div>

        <!-- Barra de progreso -->
        <div style="margin-bottom:16px;">
          <div style="height:6px;background:#334155;border-radius:3px;overflow:hidden;">
            <div id="audio-progress" style="height:100%;background:linear-gradient(90deg,#06b6d4,#3b82f6);width:${progress}%;transition:width 0.3s;"></div>
          </div>
        </div>

        <!-- Controles secundarios -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:11px;">⚡</span>
            <select id="audio-rate-select" style="flex:1;padding:8px;background:#334155;border:1px solid #475569;border-radius:6px;color:white;font-size:12px;">
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1" ${this.rate === 1 ? 'selected' : ''}>1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:11px;">😴</span>
            <select id="audio-sleep-select" style="flex:1;padding:8px;background:#334155;border:1px solid #475569;border-radius:6px;color:white;font-size:12px;">
              <option value="0">Off</option>
              <option value="15" ${this.sleepTimerMinutes === 15 ? 'selected' : ''}>15m</option>
              <option value="30" ${this.sleepTimerMinutes === 30 ? 'selected' : ''}>30m</option>
              <option value="60" ${this.sleepTimerMinutes === 60 ? 'selected' : ''}>60m</option>
            </select>
          </div>
        </div>

        <!-- Opciones -->
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
          <button id="audio-auto-btn" style="flex:1;min-width:70px;padding:8px;background:${this.autoAdvanceChapter ? '#16a34a' : '#334155'};border:none;border-radius:6px;color:white;font-size:11px;cursor:pointer;">📖 Auto</button>
          <button id="audio-word-btn" style="flex:1;min-width:70px;padding:8px;background:${this.wordByWordEnabled ? '#d97706' : '#334155'};border:none;border-radius:6px;color:white;font-size:11px;cursor:pointer;">✨ Palabra</button>
          <button id="audio-bookmark-btn" style="flex:1;min-width:70px;padding:8px;background:#334155;border:none;border-radius:6px;color:white;font-size:11px;cursor:pointer;">🔖 Marcar</button>
        </div>

        <!-- Sistema de Voces -->
        <details style="margin-bottom:8px;" open>
          <summary style="font-size:12px;color:#22d3ee;cursor:pointer;padding:8px 0;">🎤 Sistema de Voz</summary>
          <div style="padding:12px;background:#164e63;border-radius:8px;margin-top:8px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div>
                <label style="font-size:10px;color:#94a3b8;display:block;margin-bottom:4px;">Proveedor</label>
                <select id="audio-tts-provider" style="width:100%;padding:8px;background:#334155;border:1px solid #475569;border-radius:6px;color:white;font-size:11px;">
                  <option value="webSpeech" ${this.ttsProvider === 'webSpeech' ? 'selected' : ''}>Web Speech</option>
                  <option value="capacitor" ${this.ttsProvider === 'capacitor' ? 'selected' : ''}>Capacitor</option>
                  <option value="openai" ${this.ttsProvider === 'openai' ? 'selected' : ''}>OpenAI</option>
                </select>
              </div>
              <div>
                <label style="font-size:10px;color:#94a3b8;display:block;margin-bottom:4px;">Voz</label>
                <select id="audio-voice-select" style="width:100%;padding:8px;background:#334155;border:1px solid #475569;border-radius:6px;color:white;font-size:11px;">
                  <option value="">Cargando voces...</option>
                </select>
              </div>
            </div>
            <button id="audio-test-voice" style="margin-top:8px;width:100%;padding:8px;background:#0e7490;border:none;border-radius:6px;color:white;font-size:11px;cursor:pointer;">🔊 Probar voz</button>
          </div>
        </details>

        <!-- Ambiente y Binaural -->
        <details style="margin-bottom:8px;">
          <summary style="font-size:12px;color:#a78bfa;cursor:pointer;padding:8px 0;">🎵 Ambiente y Binaural</summary>
          <div style="padding:12px;background:#1e1b4b;border-radius:8px;margin-top:8px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
              <select id="audio-ambient-select" style="padding:8px;background:#334155;border:1px solid #475569;border-radius:6px;color:white;font-size:11px;">
                <option value="">🌊 Sin ambiente</option>
                <option value="rain">🌧️ Lluvia</option>
                <option value="forest">🌳 Bosque</option>
                <option value="ocean">🌊 Océano</option>
                <option value="fire">🔥 Fogata</option>
              </select>
              <select id="audio-binaural-select" style="padding:8px;background:#334155;border:1px solid #475569;border-radius:6px;color:white;font-size:11px;">
                <option value="">🧠 Sin binaural</option>
                <option value="focus">🎯 Enfoque</option>
                <option value="relax">😌 Relax</option>
                <option value="deep">🧘 Meditación</option>
                <option value="sleep">😴 Sueño</option>
              </select>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:11px;color:#94a3b8;">Vol</span>
              <input type="range" id="audio-ambient-vol" min="0" max="100" value="30" style="flex:1;height:4px;">
              <span id="audio-vol-label" style="font-size:11px;color:#94a3b8;width:30px;">30%</span>
            </div>
          </div>
        </details>
      </div>
    `;

    document.body.appendChild(panel);
    this.attachSimplePlayerListeners(panel);
  }

  // Listeners para el reproductor completo
  attachSimplePlayerListeners(panel) {
    const self = this;
    const updatePlayBtn = () => {
      const btn = document.getElementById('audio-play-btn');
      if (btn) {
        const playing = self.isPlaying && !self.isPaused;
        btn.textContent = playing ? '⏸' : '▶';
        btn.style.background = playing ? 'linear-gradient(135deg,#f97316,#dc2626)' : 'linear-gradient(135deg,#06b6d4,#2563eb)';
      }
    };

    document.getElementById('audio-close-btn').onclick = () => { panel.remove(); self.stop(); };
    document.getElementById('audio-minimize-btn').onclick = () => panel.remove();

    document.getElementById('audio-play-btn').onclick = async () => {
      try {
        if (self.isPlaying && !self.isPaused) {
          self.pause();
        } else {
          const content = document.querySelector('.chapter-content');
          if (content) {
            const result = await self.play(content.innerHTML);
            if (result === false) {
              alert('Play retornó false - revisar TTS o contenido');
            }
          } else {
            alert('No se encontró .chapter-content');
          }
        }
        updatePlayBtn();
      } catch (err) {
        alert('Error en play: ' + err.message);
        console.error('Error play:', err);
      }
    };

    document.getElementById('audio-prev-btn').onclick = () => { self.previousParagraph(); self.updateSimplePlayerProgress(); };
    document.getElementById('audio-next-btn').onclick = () => { self.nextParagraph(); self.updateSimplePlayerProgress(); };
    document.getElementById('audio-stop-btn').onclick = () => { self.stop(); updatePlayBtn(); };

    document.getElementById('audio-rate-select').value = String(this.rate || 1);
    document.getElementById('audio-rate-select').onchange = (e) => self.setRate(parseFloat(e.target.value));

    document.getElementById('audio-sleep-select').onchange = (e) => {
      if (self.setSleepTimer) self.setSleepTimer(parseInt(e.target.value));
    };

    document.getElementById('audio-auto-btn').onclick = (e) => {
      self.autoAdvanceChapter = !self.autoAdvanceChapter;
      e.target.style.background = self.autoAdvanceChapter ? '#16a34a' : '#334155';
      localStorage.setItem('audio-auto-advance', self.autoAdvanceChapter);
    };

    document.getElementById('audio-word-btn').onclick = (e) => {
      self.wordByWordEnabled = !self.wordByWordEnabled;
      e.target.style.background = self.wordByWordEnabled ? '#d97706' : '#334155';
    };

    document.getElementById('audio-bookmark-btn').onclick = () => {
      if (self.addBookmarkAtCurrentPosition) self.addBookmarkAtCurrentPosition();
      window.toast?.success('Bookmark añadido');
    };

    // Ambiente
    const ambientSelect = document.getElementById('audio-ambient-select');
    if (ambientSelect) {
      ambientSelect.onchange = (e) => {
        if (window.audioMixer && e.target.value) {
          window.audioMixer.playAmbient(e.target.value);
        } else if (window.audioMixer) {
          window.audioMixer.stopAmbient();
        }
      };
    }

    // Binaural
    const binauralSelect = document.getElementById('audio-binaural-select');
    if (binauralSelect) {
      binauralSelect.onchange = (e) => {
        if (window.binauralAudio && e.target.value) {
          window.binauralAudio.start(e.target.value);
        } else if (window.binauralAudio) {
          window.binauralAudio.stop();
        }
      };
    }

    // Volumen ambiente
    const volSlider = document.getElementById('audio-ambient-vol');
    const volLabel = document.getElementById('audio-vol-label');
    if (volSlider) {
      volSlider.oninput = (e) => {
        const vol = e.target.value;
        if (volLabel) volLabel.textContent = vol + '%';
        if (window.audioMixer) window.audioMixer.setAmbientVolume(vol / 100);
      };
    }

    // TTS Provider y Voces
    const ttsProviderSelect = document.getElementById('audio-tts-provider');
    const voiceSelect = document.getElementById('audio-voice-select');
    const testVoiceBtn = document.getElementById('audio-test-voice');

    // Función para cargar voces del proveedor actual
    const loadVoicesForProvider = async (provider) => {
      if (!voiceSelect) return;
      voiceSelect.innerHTML = '<option value="">Cargando...</option>';

      try {
        let voices = [];
        if (provider === 'webSpeech') {
          voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith('es'));
          voiceSelect.innerHTML = voices.length > 0
            ? voices.map(v => `<option value="${v.name}">${v.name.substring(0, 20)}</option>`).join('')
            : '<option value="">No hay voces ES</option>';
        } else if (provider === 'capacitor') {
          voiceSelect.innerHTML = '<option value="es-ES">Español (ES)</option><option value="es-MX">Español (MX)</option><option value="es-US">Español (US)</option>';
        } else if (provider === 'openai') {
          voiceSelect.innerHTML = '<option value="alloy">Alloy</option><option value="echo">Echo</option><option value="fable">Fable</option><option value="onyx">Onyx</option><option value="nova">Nova</option><option value="shimmer">Shimmer</option>';
        }
      } catch (err) {
        voiceSelect.innerHTML = '<option value="">Error</option>';
      }
    };

    if (ttsProviderSelect) {
      // Cargar voces iniciales
      loadVoicesForProvider(self.ttsProvider || 'webSpeech');

      ttsProviderSelect.onchange = async (e) => {
        const provider = e.target.value;
        self.ttsProvider = provider;
        localStorage.setItem('audio-tts-provider', provider);
        if (self.ttsManager) self.ttsManager.setProvider(provider);
        await loadVoicesForProvider(provider);
        window.toast?.info(`Proveedor: ${provider}`);
      };
    }

    if (voiceSelect) {
      voiceSelect.onchange = (e) => {
        const voice = e.target.value;
        if (voice) {
          self.selectedVoice = voice;
          localStorage.setItem('audio-selected-voice', voice);
          if (self.ttsManager && self.ttsManager.setVoice) {
            self.ttsManager.setVoice(voice);
          }
        }
      };
    }

    if (testVoiceBtn) {
      testVoiceBtn.onclick = () => {
        const testText = 'Esta es una prueba del sistema de voz.';
        if (self.ttsManager) {
          self.ttsManager.speak(testText);
        } else if (speechSynthesis) {
          const utt = new SpeechSynthesisUtterance(testText);
          utt.lang = 'es-ES';
          speechSynthesis.speak(utt);
        }
      };
    }
  }

  // Actualizar progreso del reproductor simple
  updateSimplePlayerProgress() {
    const progressBar = document.getElementById('audio-progress');
    if (progressBar && this.paragraphs.length > 0) {
      const progress = ((this.currentParagraphIndex + 1) / this.paragraphs.length * 100).toFixed(1);
      progressBar.style.width = progress + '%';
    }
  }

  hide() {
    // Guardar posición actual antes de cerrar (si hay contenido y no está en el principio)
    if (this.paragraphs.length > 0 && this.currentParagraphIndex > 0) {
      this.savePosition();
      logger.log(`💾 Posición guardada: Párrafo ${this.currentParagraphIndex + 1}/${this.paragraphs.length}`);
    }

    // 🧹 CLEANUP COMPLETO para evitar memory leaks
    this.stop(false); // false = no resetear posición guardada
    this.clearSleepTimer();
    this.detachKeyboardListeners();
    this.detachDragListeners(); // 🔧 Remover drag listeners
    this.detachMinimizedPlayerGestures(); // 🔧 Remover gesture listeners del FAB

    // 🔧 Limpiar caché de TTS (liberar blob URLs)
    if (this.ttsManager && this.ttsManager.providers && this.ttsManager.providers.openai) {
      try {
        this.ttsManager.providers.openai.clearCache();
        logger.log('🗑️ Caché TTS limpiado');
      } catch (err) {
        console.warn('Error limpiando caché TTS:', err);
      }
    }

    // Liberar Wake Lock si está activo
    if (this.wakeLock) {
      this.wakeLock.release().catch(err => {
        console.warn('Error liberando wake lock:', err);
      });
      this.wakeLock = null;
    }

    // Remover UI
    const controls = document.getElementById('audioreader-controls');
    if (controls) controls.remove();

    // Remover elementos del reproductor minimizado (FAB, bottom sheet, overlay)
    const fab = document.getElementById('audioreader-fab');
    const bottomSheet = document.getElementById('audioreader-bottom-sheet');
    const overlay = document.getElementById('audioreader-overlay');
    if (fab) fab.remove();
    if (bottomSheet) bottomSheet.remove();
    if (overlay) overlay.remove();

    logger.log('🧹 Audioreader cleanup completado');
  }

  async toggle() {
    console.log('🎧 AudioReader.toggle() called');
    const controls = document.getElementById('audioreader-controls');
    console.log('🎧 Controls exist:', !!controls);
    if (controls) {
      console.log('🎧 Hiding controls...');
      this.hide();
    } else {
      console.log('🎧 Showing controls...');
      await this.show();
    }
  }

  // ==========================================================================
  // ⭐ SLEEP TIMER
  // ==========================================================================

  setSleepTimer(minutos) {
    this.clearSleepTimer();

    if (minutos === 0) {
      this.sleepTimerMinutes = 0;
      this.updateUI();
      return;
    }

    this.sleepTimerMinutes = minutos;
    this.sleepTimerStartTime = Date.now();

    this.sleepTimer = setTimeout(() => {
      logger.log('😴 Sleep timer finalizado, deteniendo audio...');
      this.fadeOutAndStop();
    }, minutos * 60 * 1000);

    this.updateUI();
    window.toast?.success(`Sleep timer: ${minutos} minutos`);
  }

  clearSleepTimer() {
    if (this.sleepTimer) {
      clearTimeout(this.sleepTimer);
      this.sleepTimer = null;
      this.sleepTimerMinutes = 0;
      this.sleepTimerStartTime = null;
    }
  }

  getSleepTimerRemaining() {
    if (!this.sleepTimer || !this.sleepTimerStartTime) return 0;

    const transcurrido = (Date.now() - this.sleepTimerStartTime) / 1000 / 60;
    const restante = Math.max(0, this.sleepTimerMinutes - transcurrido);
    return Math.ceil(restante);
  }

  async fadeOutAndStop() {
    const pasosFadeOut = 10;
    const velocidadInicial = this.rate;

    for (let i = pasosFadeOut; i >= 0; i--) {
      const factorVolumen = i / pasosFadeOut;

      if (this.nativeTTS) {
        // TTS nativo no soporta cambio de volumen en tiempo real
        // Solo detener al final
        if (i === 0) {
          await this.stop();
        }
      } else if (this.utterance) {
        this.utterance.volume = factorVolumen;
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    this.rate = velocidadInicial;
    await this.stop();
    window.toast?.info('😴 Sleep timer finalizado');
  }

  // ==========================================================================
  // ⭐ BOOKMARKS DE AUDIO
  // ==========================================================================

  loadBookmarks() {
    try {
      const datosGuardados = localStorage.getItem('audio-bookmarks');
      return datosGuardados ? JSON.parse(datosGuardados) : {};
    } catch (error) {
      console.error('Error cargando bookmarks:', error);
      return {};
    }
  }

  saveBookmarks() {
    try {
      localStorage.setItem('audio-bookmarks', JSON.stringify(this.audioBookmarks));
    } catch (error) {
      console.error('Error guardando bookmarks:', error);
    }
  }

  async addBookmark(nombre = null) {
    const idLibro = this.bookEngine.currentBook?.id;
    const idCapitulo = this.bookEngine.currentChapter?.id;

    if (!idLibro || !idCapitulo) {
      window.toast?.error('No hay capítulo activo');
      return;
    }

    const claveBookmark = `${idLibro}:${idCapitulo}`;

    if (!this.audioBookmarks[claveBookmark]) {
      this.audioBookmarks[claveBookmark] = [];
    }

    const nombreBookmark = nombre || `Párrafo ${this.currentParagraphIndex + 1}`;

    this.audioBookmarks[claveBookmark].push({
      nombre: nombreBookmark,
      paragrafo: this.currentParagraphIndex,
      timestamp: Date.now(),
      tituloCapitulo: this.bookEngine.currentChapter?.title || 'Sin título'
    });

    this.saveBookmarks();
    // Re-renderizar controles para mostrar el nuevo bookmark
    await this.renderControls();
    this.attachControlListeners();
    window.toast?.success(`📌 Bookmark guardado: ${nombreBookmark}`);
  }

  getBookmarksForCurrentChapter() {
    const idLibro = this.bookEngine.currentBook?.id;
    const idCapitulo = this.bookEngine.currentChapter?.id;

    if (!idLibro || !idCapitulo) return [];

    const claveBookmark = `${idLibro}:${idCapitulo}`;
    return this.audioBookmarks[claveBookmark] || [];
  }

  jumpToBookmark(indice) {
    const bookmarks = this.getBookmarksForCurrentChapter();
    if (indice < 0 || indice >= bookmarks.length) return;

    const bookmark = bookmarks[indice];
    const estabaReproduciendo = this.isPlaying;

    if (this.nativeTTS) {
      this.nativeTTS.stop().catch(() => {});
    } else if (this.synthesis) {
      this.synthesis.cancel();
    }

    this.currentParagraphIndex = bookmark.paragrafo;

    if (estabaReproduciendo) {
      this.isPaused = false;
      this.speakParagraph(this.currentParagraphIndex);
    } else {
      this.updateUI();
      this.highlightParagraph(this.currentParagraphIndex);
    }

    window.toast?.success(`Saltando a: ${bookmark.nombre}`);
  }

  async deleteBookmark(indice) {
    const idLibro = this.bookEngine.currentBook?.id;
    const idCapitulo = this.bookEngine.currentChapter?.id;

    if (!idLibro || !idCapitulo) return;

    const claveBookmark = `${idLibro}:${idCapitulo}`;
    const bookmarks = this.audioBookmarks[claveBookmark];

    if (!bookmarks || indice < 0 || indice >= bookmarks.length) return;

    bookmarks.splice(indice, 1);

    if (bookmarks.length === 0) {
      delete this.audioBookmarks[claveBookmark];
    }

    this.saveBookmarks();
    // Re-renderizar controles para actualizar la lista de bookmarks
    await this.renderControls();
    this.attachControlListeners();
    window.toast?.info('🗑️ Bookmark eliminado');
  }

  // ==========================================================================
  // ⭐ PERSISTENCIA DE POSICIÓN
  // ==========================================================================

  savePosition() {
    const idLibro = this.bookEngine.currentBook?.id;
    const idCapitulo = this.bookEngine.currentChapter?.id;

    if (!idLibro || !idCapitulo) return;

    const posicion = {
      libro: idLibro,
      capitulo: idCapitulo,
      paragrafo: this.currentParagraphIndex,
      timestamp: Date.now()
    };

    localStorage.setItem('audioreader-last-position', JSON.stringify(posicion));
  }

  loadLastPosition() {
    try {
      const datosGuardados = localStorage.getItem('audioreader-last-position');
      if (!datosGuardados) return null;

      const posicion = JSON.parse(datosGuardados);

      const idLibroActual = this.bookEngine.currentBook?.id;
      const idCapituloActual = this.bookEngine.currentChapter?.id;

      if (posicion.libro === idLibroActual && posicion.capitulo === idCapituloActual) {
        return posicion;
      }

      return null;
    } catch (error) {
      console.error('Error cargando última posición:', error);
      return null;
    }
  }

  async continuarDesdePosicionGuardada() {
    const posicionGuardada = this.loadLastPosition();

    if (posicionGuardada && posicionGuardada.paragrafo > 0) {
      this.currentParagraphIndex = posicionGuardada.paragrafo;
      this.highlightParagraph(this.currentParagraphIndex);
      await this.updateUI();

      window.toast?.info(`Continuando desde párrafo ${posicionGuardada.paragrafo + 1}`);
      return true;
    }

    return false;
  }

  showContinueFromSavedPosition(posicionGuardada) {
    const controls = document.getElementById('audioreader-controls');
    if (!controls) return;

    // Crear banner de continuación
    const banner = document.createElement('div');
    banner.id = 'audioreader-continue-banner';
    banner.className = 'mb-4 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 border-2 border-cyan-300 dark:border-cyan-700 rounded-xl';
    banner.innerHTML = `
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 flex-1">
          <div class="text-2xl">📖</div>
          <div class="flex-1">
            <div class="font-bold text-sm text-slate-900 dark:text-white">
              Continuar desde donde lo dejaste
            </div>
            <div class="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Párrafo ${posicionGuardada.paragrafo + 1} de ${this.paragraphs.length}
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <button id="audioreader-continue-btn"
                  class="px-4 py-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2">
            ${Icons.play(16)}
            Continuar
          </button>
          <button id="audioreader-restart-btn"
                  class="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium transition-all flex items-center gap-2">
            ${Icons.skipBack(16)}
            Reiniciar
          </button>
        </div>
      </div>
    `;

    // Insertar el banner al principio del panel de controles
    controls.insertBefore(banner, controls.firstChild);

    // Event listeners para los botones
    const continueBtn = document.getElementById('audioreader-continue-btn');
    const restartBtn = document.getElementById('audioreader-restart-btn');

    if (continueBtn) {
      continueBtn.addEventListener('click', async () => {
        // Continuar desde posición guardada
        this.currentParagraphIndex = posicionGuardada.paragrafo;
        this.highlightParagraph(this.currentParagraphIndex);
        await this.updateUI();
        banner.remove();
        window.toast?.success(`Continuando desde párrafo ${posicionGuardada.paragrafo + 1}`);

        // Auto-reproducir si el usuario hace click en continuar
        this.play();
      });
    }

    if (restartBtn) {
      restartBtn.addEventListener('click', async () => {
        // Empezar desde el principio
        this.currentParagraphIndex = 0;
        this.highlightParagraph(0);
        await this.updateUI();
        banner.remove();
        window.toast?.info('Reiniciando desde el principio');
      });
    }
  }

  // ==========================================================================
  // ⭐ TIEMPO ESTIMADO
  // ==========================================================================

  calcularTiempoEstimado() {
    if (this.paragraphs.length === 0) return 0;

    const palabrasPorMinuto = 150 * this.rate;
    const parrafosRestantes = this.paragraphs.length - this.currentParagraphIndex;

    let palabrasTotales = 0;
    for (let i = this.currentParagraphIndex; i < this.paragraphs.length; i++) {
      palabrasTotales += this.paragraphs[i].text.split(/\s+/).length;
    }

    const minutosEstimados = palabrasTotales / palabrasPorMinuto;
    return minutosEstimados;
  }

  formatearTiempo(minutos) {
    if (minutos < 1) {
      return `${Math.ceil(minutos * 60)}s`;
    } else if (minutos < 60) {
      return `${Math.ceil(minutos)}min`;
    } else {
      const horas = Math.floor(minutos / 60);
      const mins = Math.ceil(minutos % 60);
      return `${horas}h ${mins}min`;
    }
  }

  // ==========================================================================
  // ⭐ ATAJOS DE TECLADO
  // ==========================================================================

  attachKeyboardListeners() {
    if (this.keyboardListenerAttached) return;

    this.keyboardHandler = (evento) => {
      const controlsVisible = document.getElementById('audioreader-controls');
      if (!controlsVisible) return;

      // ESC siempre cierra, incluso en selectores
      if (evento.key === 'Escape') {
        evento.preventDefault();
        evento.stopPropagation();
        this.hide();
        return;
      }

      if (evento.target.tagName === 'INPUT' || evento.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (evento.key) {
        case ' ':
        case 'k':
          evento.preventDefault();
          if (this.isPlaying && !this.isPaused) {
            this.pause();
          } else {
            const chapterContent = document.querySelector('.chapter-content');
            if (chapterContent) {
              this.play(chapterContent.innerHTML);
            } else {
              this.resume();
            }
          }
          break;

        case 'ArrowRight':
        case 'l':
          evento.preventDefault();
          this.next();
          break;

        case 'ArrowLeft':
        case 'j':
          evento.preventDefault();
          this.previous();
          break;

        case 'ArrowUp':
          evento.preventDefault();
          const nuevaVelocidadMas = Math.min(2.0, this.rate + 0.25);
          this.setRate(nuevaVelocidadMas);
          window.toast?.info(`Velocidad: ${nuevaVelocidadMas}x`);
          break;

        case 'ArrowDown':
          evento.preventDefault();
          const nuevaVelocidadMenos = Math.max(0.5, this.rate - 0.25);
          this.setRate(nuevaVelocidadMenos);
          window.toast?.info(`Velocidad: ${nuevaVelocidadMenos}x`);
          break;

        case 'm':
          evento.preventDefault();
          this.addBookmark();
          break;

        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          if (evento.ctrlKey || evento.metaKey) {
            evento.preventDefault();
            const numero = parseInt(evento.key);
            if (numero > 0) {
              const bookmarks = this.getBookmarksForCurrentChapter();
              if (numero <= bookmarks.length) {
                this.jumpToBookmark(numero - 1);
              }
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', this.keyboardHandler);
    this.keyboardListenerAttached = true;
    logger.log('⌨️ Atajos de teclado activados');
  }

  detachKeyboardListeners() {
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardListenerAttached = false;
      logger.log('⌨️ Atajos de teclado desactivados');
    }
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  isSupported() {
    // Soportado si tenemos TTS nativo o Web Speech API
    return this.nativeTTS !== null || 'speechSynthesis' in window;
  }

  getStatus() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentParagraph: this.currentParagraphIndex,
      totalParagraphs: this.paragraphs.length,
      rate: this.rate,
      voice: this.selectedVoice?.name,
      autoAdvance: this.autoAdvanceChapter,
      usingNativeTTS: this.nativeTTS !== null,
      sleepTimer: this.getSleepTimerRemaining(),
      estimatedTime: this.calcularTiempoEstimado(),
      bookmarks: this.getBookmarksForCurrentChapter().length
    };
  }
}

// Exportar para uso global
window.AudioReader = AudioReader;
