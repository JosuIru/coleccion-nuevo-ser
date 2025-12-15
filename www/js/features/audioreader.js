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
        } else if (window.capacitorTextToSpeech && window.capacitorTextToSpeech.TextToSpeech) {
          // Fallback al plugin cargado manualmente
          this.nativeTTS = window.capacitorTextToSpeech.TextToSpeech;

          const result = await this.nativeTTS.getSupportedLanguages();
          const languages = result?.languages || [];
          logger.log('✅ TTS nativo inicializado (fallback). Idiomas:', languages.length);
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
        // No mostrar advertencia todavía, las voces pueden estar cargando
        // console.log('⏳ Esperando voces TTS...');
        return;
      }

      // Intentar cargar voz preferida guardada
      const preferredVoiceURI = localStorage.getItem('preferred-tts-voice');
      if (preferredVoiceURI) {
        const preferredVoice = voices.find(v => v.voiceURI === preferredVoiceURI);
        if (preferredVoice) {
          this.selectedVoice = preferredVoice;
          // console.log('✅ Voz TTS cargada:', this.selectedVoice?.name, this.selectedVoice?.lang);
          return;
        }
      }

      // Buscar voz española (prioridad: ES-ES, luego ES-MX, luego ES-*)
      const spanishVoices = voices.filter(v => v.lang && v.lang.startsWith('es'));

      if (spanishVoices.length > 0) {
        // Preferir voces de España
        const esES = spanishVoices.find(v => v.lang === 'es-ES');
        this.selectedVoice = esES || spanishVoices[0];
      } else {
        // Fallback a cualquier voz disponible
        this.selectedVoice = voices[0];
      }

      // console.log('✅ Voz TTS cargada:', this.selectedVoice?.name, this.selectedVoice?.lang);

      // Mostrar lista de voces disponibles para debugging
      if (voices.length > 0) {
        // console.log(`📢 ${voices.length} voces TTS disponibles:`,
        //   voices.map(v => `${v.name} (${v.lang})`).slice(0, 5).join(', ') +
        //   (voices.length > 5 ? '...' : '')
        // );
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

  prepareContent(chapterContent) {
    // Extraer texto del HTML del capítulo
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = chapterContent;

    // Obtener párrafos (p, h2, h3, li)
    const elements = tempDiv.querySelectorAll('p, h2, h3, li, blockquote');
    this.paragraphs = [];

    elements.forEach((el, index) => {
      const text = el.innerText.trim();
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

    if ((this.ttsProvider === 'openai' || this.ttsProvider === 'huggingface') && this.ttsManager) {
      // Premium TTS pause (OpenAI o Hugging Face)
      try {
        this.ttsManager.pause();
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
    await this.updateUI();
  }

  async resume() {
    if (!this.isPaused) return;

    this.isPaused = false;

    // Adquirir wake lock
    await this.acquireWakeLock();

    if ((this.ttsProvider === 'openai' || this.ttsProvider === 'huggingface') && this.ttsManager) {
      // Premium TTS resume (OpenAI o Hugging Face)
      try {
        this.ttsManager.resume();
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
    if ((this.ttsProvider === 'openai' || this.ttsProvider === 'huggingface') && this.ttsManager) {
      try {
        this.ttsManager.stop();
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
    if (!['browser', 'openai', 'huggingface'].includes(provider)) {
      console.error('❌ Provider inválido:', provider);
      return;
    }

    // Validar que TTSManager esté disponible para providers premium
    if ((provider === 'openai' || provider === 'huggingface') && !this.ttsManager) {
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
      huggingface: '🤗 Hugging Face'
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
    if (this.ttsProvider === 'openai' && this.ttsManager && localStorage.getItem('openai-tts-key')) {
      // Usar OpenAI TTS Premium
      await this.speakWithOpenAI(paragraph, index);
    } else if (this.nativeTTS) {
      // Usar TTS nativo de Capacitor (Android)
      await this.speakWithNativeTTS(paragraph, index);
    } else {
      // Usar Web Speech API (navegador)
      this.speakWithWebSpeechAPI(paragraph, index);
    }
  }

  async speakWithNativeTTS(paragraph, index) {
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
      // Si falla el TTS nativo, detener reproducción
      this.stop();
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
    // Remover controles existentes
    const existing = document.getElementById('audioreader-controls');
    if (existing) existing.remove();

    const bookData = this.bookEngine.getCurrentBookData();
    const voices = await this.getAvailableVoices();
    const tiempoEstimado = this.calcularTiempoEstimado();
    const bookmarks = this.getBookmarksForCurrentChapter();
    const sleepTimerRestante = this.getSleepTimerRemaining();

    // Renderizar versión minimizada o expandida
    if (this.isMinimized) {
      return this.renderMinimizedPlayer(bookData, tiempoEstimado);
    }

    const html = `
      <div id="audioreader-controls"
           class="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 max-w-full sm:max-w-5xl bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border-2 border-slate-300 dark:border-slate-700/50 sm:rounded-2xl rounded-t-2xl shadow-2xl px-4 sm:px-8 py-4 sm:py-6 z-40 backdrop-blur-lg transition-transform duration-300">

        <!-- Header: Barra de arrastre, Título y botones -->
        <div class="flex flex-col mb-4">
          <!-- Barra de arrastre (solo móvil) -->
          <div id="audioreader-drag-handle" class="sm:hidden flex justify-center py-2 cursor-grab active:cursor-grabbing touch-none">
            <div class="w-12 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full"></div>
          </div>

          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">${bookData.title}</div>
              <div class="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-1">
                ${this.paragraphs.length > 0
                  ? `<span>📄 ${this.currentParagraphIndex + 1} / ${this.paragraphs.length}</span>
                     ${tiempoEstimado > 0 ? `<span>• ⏱️ ${this.formatearTiempo(tiempoEstimado)}</span>` : ''}`
                  : '<span>⏸️ Listo para narrar</span>'
                }
                ${sleepTimerRestante > 0 ? `<span class="text-orange-400">• 😴 ${sleepTimerRestante}min</span>` : ''}
              </div>
            </div>

            <!-- Botones minimizar y cerrar -->
            <div class="flex items-center gap-2 ml-3">
              <button id="audioreader-minimize"
                      class="w-10 h-10 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition flex items-center justify-center"
                      title="Minimizar">
                ${Icons.chevronDown(22)}
              </button>
              <button id="audioreader-close"
                      class="w-10 h-10 rounded-lg hover:bg-red-600/20 text-red-500 dark:text-red-400 hover:text-red-400 dark:hover:text-red-300 transition flex items-center justify-center"
                      title="Cerrar (Esc)">
                ${Icons.close(22)}
              </button>
            </div>
          </div>
        </div>

        <!-- Controles principales: Play/Pause centrado con prev/next -->
        <div class="flex items-center justify-center gap-3 sm:gap-4 mb-5">
          <button id="audioreader-prev"
                  class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center text-slate-900 dark:text-white"
                  ${this.currentParagraphIndex === 0 || this.paragraphs.length === 0 ? 'disabled' : ''}
                  title="Párrafo anterior (←)">
            ${Icons.skipBack(22)}
          </button>

          ${!this.isPlaying || this.isPaused ? `
            <button id="audioreader-play"
                    class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-2xl hover:shadow-cyan-500/50 hover:scale-110 flex items-center justify-center text-white"
                    title="Reproducir (Espacio)">
              ${Icons.play(32)}
            </button>
          ` : `
            <button id="audioreader-pause"
                    class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 transition-all shadow-2xl hover:shadow-orange-500/50 hover:scale-110 flex items-center justify-center text-white animate-pulse"
                    title="Pausar (Espacio)">
              ${Icons.pause(32)}
            </button>
          `}

          <button id="audioreader-next"
                  class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center text-slate-900 dark:text-white"
                  ${this.currentParagraphIndex >= this.paragraphs.length - 1 || this.paragraphs.length === 0 ? 'disabled' : ''}
                  title="Siguiente párrafo (→)">
            ${Icons.skipForward(22)}
          </button>
        </div>

        <!-- Botón Stop más visible -->
        <div class="flex justify-center mb-4">
          <button id="audioreader-stop"
                  class="px-6 py-2.5 rounded-lg bg-red-100 dark:bg-red-600/20 hover:bg-red-200 dark:hover:bg-red-600/30 border border-red-300 dark:border-red-500/50 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  ${!this.isPlaying && !this.isPaused ? 'disabled' : ''}
                  title="Detener">
            ${Icons.stop(18)}
            <span class="text-sm font-medium">Detener</span>
          </button>
        </div>

        <!-- Controles secundarios organizados por secciones -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">

          <!-- Sección: Reproducción -->
          <div class="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-300 dark:border-slate-700/50">
            <div class="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
              ${Icons.settings(14)} REPRODUCCIÓN
            </div>
            <div class="flex flex-col gap-2">
              <!-- Velocidad -->
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-700 dark:text-slate-300">Velocidad</span>
                <select id="audioreader-rate"
                        class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none">
                  <option value="0.5" ${this.rate === 0.5 ? 'selected' : ''}>🐌 0.5x</option>
                  <option value="0.75" ${this.rate === 0.75 ? 'selected' : ''}>🚶 0.75x</option>
                  <option value="1" ${this.rate === 1.0 ? 'selected' : ''}>▶️ Normal</option>
                  <option value="1.25" ${this.rate === 1.25 ? 'selected' : ''}>🏃 1.25x</option>
                  <option value="1.5" ${this.rate === 1.5 ? 'selected' : ''}>⚡ 1.5x</option>
                  <option value="2" ${this.rate === 2.0 ? 'selected' : ''}>🚀 2x</option>
                </select>
              </div>

              <!-- Voz -->
              ${voices.length > 1 ? `
                <div class="flex items-center justify-between">
                  <span class="text-xs text-slate-700 dark:text-slate-300">Voz</span>
                  <select id="audioreader-voice"
                          class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white max-w-[180px] truncate focus:ring-2 focus:ring-cyan-500 focus:outline-none">
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
                <div class="flex items-center justify-between">
                  <span class="text-xs text-slate-700 dark:text-slate-300">Motor</span>
                  <select id="audioreader-tts-provider"
                          class="px-3 py-1.5 rounded-lg text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                            this.ttsProvider === 'openai'
                              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
                              : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white'
                          }">
                    <option value="browser" ${this.ttsProvider === 'browser' ? 'selected' : ''}>🔊 Navegador</option>
                    ${localStorage.getItem('openai-tts-key') ? `
                      <option value="openai" ${this.ttsProvider === 'openai' ? 'selected' : ''}>✨ OpenAI</option>
                    ` : ''}
                  </select>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Sección: Opciones -->
          <div class="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-300 dark:border-slate-700/50">
            <div class="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-2">
              ${Icons.wrench(14)} OPCIONES
            </div>
            <div class="flex flex-col gap-2">
              <!-- Auto-avance -->
              <button id="audioreader-auto-advance"
                      class="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                        this.autoAdvanceChapter
                          ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30'
                          : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                      }">
                <span class="flex items-center gap-2">
                  ${Icons.book(16)} Continuo
                </span>
                <span class="text-xs">${this.autoAdvanceChapter ? 'ON' : 'OFF'}</span>
              </button>

              <!-- Palabra por Palabra -->
              <button id="audioreader-word-by-word"
                      class="w-full px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-between ${
                        this.wordByWordEnabled
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/30'
                          : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300'
                      }">
                <span class="flex items-center gap-2">
                  <span class="text-base">✨</span> Palabra a palabra
                </span>
                <span class="text-xs">${this.wordByWordEnabled ? 'ON' : 'OFF'}</span>
              </button>

              <!-- Sleep Timer -->
              <div class="flex items-center justify-between">
                <span class="text-xs text-slate-700 dark:text-slate-300">Sleep Timer</span>
                <select id="audioreader-sleep-timer"
                        class="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none ${sleepTimerRestante > 0 ? 'ring-2 ring-orange-400' : ''}">
                  <option value="0" ${sleepTimerRestante === 0 ? 'selected' : ''}>Desactivado</option>
                  <option value="15" ${this.sleepTimerMinutes === 15 ? 'selected' : ''}>15 min</option>
                  <option value="30" ${this.sleepTimerMinutes === 30 ? 'selected' : ''}>30 min</option>
                  <option value="45" ${this.sleepTimerMinutes === 45 ? 'selected' : ''}>45 min</option>
                  <option value="60" ${this.sleepTimerMinutes === 60 ? 'selected' : ''}>60 min</option>
                </select>
              </div>

              <!-- Botones adicionales -->
              <div class="flex gap-2">
                <button id="audioreader-add-bookmark"
                        class="flex-1 px-3 py-2 rounded-lg text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white transition-all flex items-center justify-center gap-2 hover:scale-105"
                        title="Añadir bookmark (M)">
                  ${Icons.bookmark(16)} Marcar
                </button>

                ${window.audioControlModal ? `
                  <button id="audioreader-audio-control"
                          class="flex-1 px-3 py-2 rounded-lg text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white transition-all flex items-center justify-center gap-2 hover:scale-105"
                          title="Control de Audio Avanzado">
                    ${Icons.headphones(16)} Audio
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>

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

        <!-- Ayuda de atajos (colapsable) -->
        <details class="mt-2 text-xs text-slate-600 dark:text-slate-400 opacity-70">
          <summary class="cursor-pointer hover:opacity-100">⌨️ Atajos de teclado</summary>
          <div class="mt-2 grid grid-cols-2 gap-1 text-xs">
            <div><kbd class="px-1 bg-slate-200 dark:bg-slate-800 rounded">Espacio/K</kbd> Play/Pause</div>
            <div><kbd class="px-1 bg-slate-200 dark:bg-slate-800 rounded">←/→</kbd> Anterior/Siguiente</div>
            <div><kbd class="px-1 bg-slate-200 dark:bg-slate-800 rounded">↑/↓</kbd> Velocidad</div>
            <div><kbd class="px-1 bg-slate-200 dark:bg-slate-800 rounded">M</kbd> Bookmark</div>
            <div><kbd class="px-1 bg-slate-200 dark:bg-slate-800 rounded">Ctrl+1-9</kbd> Saltar a bookmark</div>
            <div><kbd class="px-1 bg-slate-200 dark:bg-slate-800 rounded">Esc</kbd> Cerrar</div>
          </div>
        </details>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    this.attachControlListeners();
    this.attachDragListeners();

    // IMPORTANTE: Siempre re-adjuntar keyboard listeners cuando re-renderizamos
    // porque el panel fue destruido y recreado
    const estabanActivos = this.keyboardListenerAttached;
    if (estabanActivos) {
      this.detachKeyboardListeners();
    }
    this.attachKeyboardListeners();
  }

  renderMinimizedPlayer(bookData, tiempoEstimado) {
    const html = `
      <div id="audioreader-controls"
           class="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-slate-100 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border-t-2 border-slate-300 dark:border-slate-700/50 shadow-2xl px-4 py-3 z-40 backdrop-blur-lg transition-transform duration-300">

        <!-- Barra de arrastre -->
        <div id="audioreader-drag-handle" class="flex justify-center pb-2 cursor-grab active:cursor-grabbing touch-none">
          <div class="w-12 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full"></div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <!-- Info del libro -->
          <div class="flex-1 min-w-0">
            <div class="font-bold text-xs text-slate-900 dark:text-white truncate">${bookData.title}</div>
            <div class="text-xs text-slate-600 dark:text-slate-400 truncate">
              ${this.paragraphs.length > 0
                ? `${this.currentParagraphIndex + 1}/${this.paragraphs.length} ${tiempoEstimado > 0 ? `• ${this.formatearTiempo(tiempoEstimado)}` : ''}`
                : 'Listo para narrar'
              }
            </div>
          </div>

          <!-- Controles mini -->
          <div class="flex items-center gap-2">
            <button id="audioreader-prev"
                    class="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-30 transition flex items-center justify-center text-slate-900 dark:text-white"
                    ${this.currentParagraphIndex === 0 || this.paragraphs.length === 0 ? 'disabled' : ''}>
              ${Icons.skipBack(18)}
            </button>

            ${!this.isPlaying || this.isPaused ? `
              <button id="audioreader-play"
                      class="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition shadow-lg flex items-center justify-center text-white">
                ${Icons.play(24)}
              </button>
            ` : `
              <button id="audioreader-pause"
                      class="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 transition shadow-lg flex items-center justify-center text-white animate-pulse">
                ${Icons.pause(24)}
              </button>
            `}

            <button id="audioreader-next"
                    class="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-30 transition flex items-center justify-center text-slate-900 dark:text-white"
                    ${this.currentParagraphIndex >= this.paragraphs.length - 1 || this.paragraphs.length === 0 ? 'disabled' : ''}>
              ${Icons.skipForward(18)}
            </button>

            <button id="audioreader-expand"
                    class="w-10 h-10 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition flex items-center justify-center">
              ${Icons.chevronUp(22)}
            </button>

            <button id="audioreader-close"
                    class="w-10 h-10 rounded-lg hover:bg-red-600/20 text-red-500 dark:text-red-400 transition flex items-center justify-center">
              ${Icons.close(18)}
            </button>
          </div>
        </div>

        <!-- Progress bar -->
        ${this.paragraphs.length > 0 ? `
          <div class="mt-2 w-full h-1 bg-slate-300 dark:bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-cyan-500 transition-all"
                 style="width: ${((this.currentParagraphIndex + 1) / this.paragraphs.length * 100).toFixed(1)}%">
            </div>
          </div>
        ` : ''}
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    this.attachControlListeners();
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

    // Minimize/Expand
    const minimizeBtn = document.getElementById('audioreader-minimize');
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => this.toggleMinimize());
    }

    const expandBtn = document.getElementById('audioreader-expand');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => this.toggleMinimize());
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
    // Preparar contenido del capítulo actual ANTES de renderizar
    const chapterContent = document.querySelector('.chapter-content');
    if (chapterContent) {
      this.prepareContent(chapterContent.innerHTML);
    }

    // Verificar si hay posición guardada para este capítulo
    const posicionGuardada = this.loadLastPosition();

    await this.renderControls();
    // IMPORTANTE: Adjuntar event listeners después de renderizar
    this.attachControlListeners();

    // Activar atajos de teclado
    this.attachKeyboardListeners();

    // Si hay posición guardada, mostrar botón de continuar
    if (posicionGuardada && posicionGuardada.paragrafo > 0) {
      this.showContinueFromSavedPosition(posicionGuardada);
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

    logger.log('🧹 Audioreader cleanup completado');
  }

  async toggle() {
    const controls = document.getElementById('audioreader-controls');
    if (controls) {
      this.hide();
    } else {
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
