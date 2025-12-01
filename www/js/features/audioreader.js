// ============================================================================
// AUDIOREADER - Sistema de Narración con TTS (Text-to-Speech)
// ============================================================================
// Usa Web Speech API para narrar capítulos con controles de reproducción

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
    this.autoAdvanceChapter = false;

    // Verificar si estamos en Android/Capacitor
    this.isCapacitor = !!(window.Capacitor && window.Capacitor.isNative);
    this.isAndroid = this.isCapacitor && window.Capacitor.getPlatform() === 'android';

    // Inicializar voces (con timeout para Android)
    if (this.isAndroid) {
      // En Android, dar más tiempo para que se carguen las voces
      setTimeout(() => this.loadVoices(), 1000);
    } else {
      this.loadVoices();
    }
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  loadVoices() {
    try {
      // Esperar a que las voces estén disponibles
      if (!this.synthesis || typeof this.synthesis.getVoices !== 'function') {
        console.warn('⚠️ Speech Synthesis no disponible o getVoices no está soportado');
        return;
      }

      const voices = this.synthesis.getVoices();
      if (voices && voices.length > 0) {
        this.selectBestVoice();
      } else {
        this.synthesis.addEventListener('voiceschanged', () => {
          this.selectBestVoice();
        });
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
        console.warn('⚠️ No hay voces disponibles');
        return;
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

      logger.log('✅ Voz seleccionada:', this.selectedVoice?.name, this.selectedVoice?.lang);
    } catch (error) {
      console.error('Error selecting voice:', error);
    }
  }

  getAvailableVoices() {
    try {
      if (!this.synthesis || typeof this.synthesis.getVoices !== 'function') return [];
      const voices = this.synthesis.getVoices();
      return voices ? voices.filter(v => v.lang && v.lang.startsWith('es')) : [];
    } catch (error) {
      console.error('Error getting voices:', error);
      return [];
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

  play(chapterContent = null) {
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
    if (this.isPaused) {
      this.resume();
      return true;
    }

    // Iniciar narración
    this.isPlaying = true;
    this.isPaused = false;
    this.speakParagraph(this.currentParagraphIndex);
    this.updateUI();

    // Track para logros
    if (window.achievementSystem) {
      window.achievementSystem.trackAudioUsed();
    }

    return true;
  }

  pause() {
    if (!this.isPlaying) return;

    this.synthesis.pause();
    this.isPaused = true;
    this.updateUI();
  }

  resume() {
    if (!this.isPaused) return;

    this.synthesis.resume();
    this.isPaused = false;
    this.updateUI();
  }

  stop() {
    this.synthesis.cancel();
    this.isPlaying = false;
    this.isPaused = false;
    this.currentParagraphIndex = 0;
    this.clearHighlights();
    this.updateUI();
  }

  next() {
    if (this.currentParagraphIndex < this.paragraphs.length - 1) {
      this.synthesis.cancel();
      this.currentParagraphIndex++;
      this.speakParagraph(this.currentParagraphIndex);
    }
  }

  previous() {
    if (this.currentParagraphIndex > 0) {
      this.synthesis.cancel();
      this.currentParagraphIndex--;
      this.speakParagraph(this.currentParagraphIndex);
    }
  }

  setRate(rate) {
    this.rate = parseFloat(rate);

    // Si está reproduciendo, reiniciar con nueva velocidad
    if (this.isPlaying && !this.isPaused) {
      const currentIndex = this.currentParagraphIndex;
      this.synthesis.cancel();
      this.speakParagraph(currentIndex);
    }

    this.updateUI();
  }

  setVoice(voiceURI) {
    try {
      if (!this.synthesis || typeof this.synthesis.getVoices !== 'function') {
        console.warn('⚠️ getVoices no disponible');
        return;
      }
      const voices = this.synthesis.getVoices();
      this.selectedVoice = voices.find(v => v.voiceURI === voiceURI);
      logger.log('✅ Voz cambiada a:', this.selectedVoice?.name);
    } catch (error) {
      console.error('Error setting voice:', error);
    }
  }

  toggleAutoAdvance() {
    this.autoAdvanceChapter = !this.autoAdvanceChapter;
    this.updateUI();
  }

  // ==========================================================================
  // MOTOR DE NARRACIÓN
  // ==========================================================================

  speakParagraph(index) {
    if (index >= this.paragraphs.length) {
      // Terminó el capítulo
      this.onChapterEnd();
      return;
    }

    // Verificar que synthesis esté disponible
    if (!this.synthesis) {
      console.error('❌ speechSynthesis no disponible');
      this.stop();
      return;
    }

    const paragraph = this.paragraphs[index];

    try {
      // Crear utterance
      this.utterance = new SpeechSynthesisUtterance(paragraph.text);
      this.utterance.voice = this.selectedVoice;
      this.utterance.rate = this.rate;
      this.utterance.pitch = 1.0;
      this.utterance.volume = 1.0;

      // En Android, asegurar que lang esté definido
      if (this.isAndroid && !this.utterance.lang) {
        this.utterance.lang = 'es-ES';
      }
    } catch (error) {
      console.error('❌ Error creando utterance:', error);
      this.stop();
      return;
    }

    // Highlight del párrafo actual
    this.highlightParagraph(index);

    // Eventos
    this.utterance.onend = () => {
      paragraph.spoken = true;

      // Avanzar al siguiente párrafo
      this.currentParagraphIndex++;

      if (this.currentParagraphIndex < this.paragraphs.length && this.isPlaying) {
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
      console.error('❌ Error en síntesis de voz:', event);
      this.stop();
    };

    // Iniciar síntesis
    this.synthesis.speak(this.utterance);
  }

  onChapterEnd() {
    logger.log('✅ Capítulo terminado');
    this.isPlaying = false;
    this.isPaused = false;
    this.clearHighlights();
    this.updateUI();

    // Si auto-advance está activado, pasar al siguiente capítulo
    if (this.autoAdvanceChapter) {
      logger.log('🔄 Auto-avance activado, pasando al siguiente capítulo en 2s...');
      setTimeout(() => {
        this.advanceToNextChapter();
      }, 2000);
    }
  }

  advanceToNextChapter() {
    const currentChapter = window.bookReader?.currentChapter;
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

  highlightParagraph(index) {
    // Limpiar highlights anteriores
    this.clearHighlights();

    // Buscar el párrafo en el DOM actual
    const chapterContent = document.querySelector('.chapter-content');
    if (!chapterContent) return;

    const elements = chapterContent.querySelectorAll('p, h2, h3, li, blockquote');

    if (elements[index]) {
      elements[index].classList.add('audioreader-highlight');

      // Scroll suave al párrafo
      elements[index].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }

    this.updateUI();
  }

  clearHighlights() {
    const highlighted = document.querySelectorAll('.audioreader-highlight');
    highlighted.forEach(el => el.classList.remove('audioreader-highlight'));
  }

  // ==========================================================================
  // UI - CONTROLES
  // ==========================================================================

  renderControls() {
    // Remover controles existentes
    const existing = document.getElementById('audioreader-controls');
    if (existing) existing.remove();

    const bookData = this.bookEngine.getCurrentBookData();
    const voices = this.getAvailableVoices();

    const html = `
      <div id="audioreader-controls"
           class="fixed bottom-24 sm:bottom-6 left-2 right-2 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 max-w-full sm:max-w-3xl bg-slate-900/95 border border-slate-700 rounded-xl sm:rounded-2xl shadow-2xl px-3 sm:px-6 py-3 sm:py-4 z-40 backdrop-blur-sm">

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">

          <!-- Libro/Capítulo info -->
          <div class="text-xs sm:text-sm text-center sm:text-left">
            <div class="font-bold truncate">${bookData.title}</div>
            <div class="text-xs opacity-50">
              ${this.paragraphs.length > 0
                ? `Párrafo ${this.currentParagraphIndex + 1} / ${this.paragraphs.length}`
                : 'Listo para narrar'
              }
            </div>
          </div>

          <!-- Controles principales -->
          <div class="flex items-center justify-center gap-1 sm:gap-2">
            <button id="audioreader-prev"
                    class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center"
                    ${this.currentParagraphIndex === 0 || !this.isPlaying ? 'disabled' : ''}
                    title="Párrafo anterior">
              ${Icons.skipBack(18)}
            </button>

            ${!this.isPlaying || this.isPaused ? `
              <button id="audioreader-play"
                      class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-cyan-600 hover:bg-cyan-700 transition flex items-center justify-center"
                      title="Reproducir">
                ${Icons.play(24)}
              </button>
            ` : `
              <button id="audioreader-pause"
                      class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-orange-600 hover:bg-orange-700 transition flex items-center justify-center"
                      title="Pausar">
                ${Icons.pause(24)}
              </button>
            `}

            <button id="audioreader-stop"
                    class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center"
                    ${!this.isPlaying ? 'disabled' : ''}
                    title="Detener">
              ${Icons.stop(18)}
            </button>

            <button id="audioreader-next"
                    class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center"
                    ${this.currentParagraphIndex >= this.paragraphs.length - 1 || !this.isPlaying ? 'disabled' : ''}
                    title="Siguiente párrafo">
              ${Icons.skipForward(18)}
            </button>
          </div>

          <!-- Opciones (Velocidad, Voz, Auto-advance) - En fila separada en móvil -->
          <div class="flex items-center justify-between sm:justify-start gap-2 sm:gap-4 flex-wrap">
            <!-- Velocidad -->
            <div class="flex items-center gap-1 sm:gap-2">
              <span class="text-xs opacity-50 hidden sm:inline">Velocidad:</span>
              <select id="audioreader-rate"
                      class="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs sm:text-sm">
                <option value="0.5" ${this.rate === 0.5 ? 'selected' : ''}>0.5x</option>
                <option value="0.75" ${this.rate === 0.75 ? 'selected' : ''}>0.75x</option>
                <option value="1" ${this.rate === 1.0 ? 'selected' : ''}>1x</option>
                <option value="1.25" ${this.rate === 1.25 ? 'selected' : ''}>1.25x</option>
                <option value="1.5" ${this.rate === 1.5 ? 'selected' : ''}>1.5x</option>
                <option value="2" ${this.rate === 2.0 ? 'selected' : ''}>2x</option>
              </select>
            </div>

            <!-- Voz (solo si hay múltiples voces) - Oculto en móvil -->
            ${voices.length > 1 ? `
              <div class="hidden sm:flex items-center gap-2">
                <span class="text-xs opacity-50">Voz:</span>
                <select id="audioreader-voice"
                        class="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm max-w-[150px]">
                  ${voices.map(v => `
                    <option value="${v.voiceURI}" ${this.selectedVoice?.voiceURI === v.voiceURI ? 'selected' : ''}>
                      ${v.name} (${v.lang})
                    </option>
                  `).join('')}
                </select>
              </div>
            ` : ''}

            <!-- Auto-advance - Reproducir todos los capítulos -->
            <button id="audioreader-auto-advance"
                    class="px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs transition flex items-center gap-1 ${
                      this.autoAdvanceChapter
                        ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-400'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }"
                    title="Reproducir todos los capítulos seguidos">
              ${Icons.book(16)} <span class="hidden sm:inline">${this.autoAdvanceChapter ? 'Continuo ON' : 'Continuo'}</span>
              <span class="sm:hidden">${this.autoAdvanceChapter ? Icons.check(14) : ''}</span>
            </button>

            <!-- Cerrar -->
            <button id="audioreader-close"
                    class="w-8 h-8 rounded-lg hover:bg-slate-700 transition flex items-center justify-center ml-auto sm:ml-0"
                    title="Cerrar">
              ${Icons.close(18)}
            </button>
          </div>
        </div>

        <!-- Progress bar -->
        ${this.paragraphs.length > 0 ? `
          <div class="mt-3 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full bg-cyan-500 transition-all"
                 style="width: ${((this.currentParagraphIndex + 1) / this.paragraphs.length * 100).toFixed(1)}%">
            </div>
          </div>
        ` : ''}
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    this.attachControlListeners();
  }

  attachControlListeners() {
    // Play
    const playBtn = document.getElementById('audioreader-play');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        const chapterContent = document.querySelector('.chapter-content');
        if (chapterContent) {
          this.play(chapterContent.innerHTML);
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

    // Close
    const closeBtn = document.getElementById('audioreader-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
  }

  updateUI() {
    // Re-renderizar controles para reflejar estado actual
    this.renderControls();
  }

  // ==========================================================================
  // MOSTRAR/OCULTAR
  // ==========================================================================

  show() {
    this.renderControls();

    // Preparar contenido del capítulo actual
    const chapterContent = document.querySelector('.chapter-content');
    if (chapterContent) {
      this.prepareContent(chapterContent.innerHTML);
    }
  }

  hide() {
    this.stop();
    const controls = document.getElementById('audioreader-controls');
    if (controls) controls.remove();
  }

  toggle() {
    const controls = document.getElementById('audioreader-controls');
    if (controls) {
      this.hide();
    } else {
      this.show();
    }
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  isSupported() {
    return 'speechSynthesis' in window;
  }

  getStatus() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      currentParagraph: this.currentParagraphIndex,
      totalParagraphs: this.paragraphs.length,
      rate: this.rate,
      voice: this.selectedVoice?.name,
      autoAdvance: this.autoAdvanceChapter
    };
  }
}

// Exportar para uso global
window.AudioReader = AudioReader;
