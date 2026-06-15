// ============================================================================
// WORD BY WORD SYNC - Sincronización palabra por palabra
// ============================================================================
// Resalta palabras individuales mientras el TTS las narra

// 🔧 FIX v2.9.198: Migrated console.log to logger
class WordByWordSync {
  constructor() {
    this.isActive = false;
    this.currentParagraph = null;
    this.words = [];
    this.currentWordIndex = 0;
    this.intervalId = null;
    this.ttsRate = 1.0; // Velocidad del TTS
    this.wordsPerMinute = 150; // WPM base para español
  }

  // ==========================================================================
  // INICIALIZACIÓN Y PREPARACIÓN
  // ==========================================================================

  prepareParagraph(paragraphElement, text) {
    if (!paragraphElement || !text) return false;

    // Guardar párrafo original
    this.currentParagraph = paragraphElement;

    // Dividir en palabras (preservando puntuación)
    this.words = this.tokenizeWords(text);

    // Convertir el párrafo a formato palabra por palabra
    this.wrapWordsInSpans(paragraphElement, this.words);

    return true;
  }

  tokenizeWords(text) {
    // Dividir en palabras preservando puntuación
    // Expresión regular que captura palabras y puntuación
    const regex = /(\S+|\s+)/g;
    const tokens = text.match(regex) || [];

    return tokens.map((token, index) => ({
      text: token,
      index,
      isWord: /\S/.test(token) // No es solo espacio en blanco
    })).filter(token => token.isWord);
  }

  wrapWordsInSpans(element, words) {
    // Reconstruir el HTML del párrafo con spans para cada palabra
    const wrappedHTML = words.map((word, idx) => {
      return `<span class="word-sync" data-word-index="${idx}">${word.text}</span>`;
    }).join(' ');

    element.innerHTML = wrappedHTML;
  }

  // ==========================================================================
  // SINCRONIZACIÓN
  // ==========================================================================

  start(ttsRate = 1.0) {
    if (!this.currentParagraph || this.words.length === 0) {
      // logger.warn('No hay párrafo preparado para sincronizar');
      return false;
    }

    this.ttsRate = ttsRate;
    this.currentWordIndex = 0;
    this.isActive = true;

    // Calcular duración por palabra en ms
    const wpmAdjusted = this.wordsPerMinute * this.ttsRate;
    const msPerWord = (60 * 1000) / wpmAdjusted;

    // Iniciar resaltado palabra por palabra
    this.highlightNextWord();

    // Configurar intervalo para siguiente palabra
    this.intervalId = setInterval(() => {
      this.highlightNextWord();
    }, msPerWord);

    // logger.debug(`✅ Sincronización palabra por palabra iniciada (${wpmAdjusted.toFixed(0)} WPM)`);
    return true;
  }

  stop() {
    this.isActive = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Limpiar resaltados
    this.clearHighlights();

    // logger.debug('⏸️ Sincronización palabra por palabra detenida');
  }

  pause() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  resume(ttsRate) {
    if (!this.isActive) return;

    this.ttsRate = ttsRate || this.ttsRate;

    const wpmAdjusted = this.wordsPerMinute * this.ttsRate;
    const msPerWord = (60 * 1000) / wpmAdjusted;

    this.intervalId = setInterval(() => {
      this.highlightNextWord();
    }, msPerWord);
  }

  // ==========================================================================
  // RESALTADO
  // ==========================================================================

  highlightNextWord() {
    if (!this.isActive || this.currentWordIndex >= this.words.length) {
      this.stop();
      return;
    }

    // Limpiar resaltado anterior
    this.clearHighlights();

    // Resaltar palabra actual
    const wordSpan = this.currentParagraph.querySelector(
      `[data-word-index="${this.currentWordIndex}"]`
    );

    if (wordSpan) {
      wordSpan.classList.add('word-highlighted');

      // Scroll suave a la palabra si está fuera de vista
      this.scrollToWordIfNeeded(wordSpan);
    }

    this.currentWordIndex++;
  }

  clearHighlights() {
    if (!this.currentParagraph) return;

    const highlightedWords = this.currentParagraph.querySelectorAll('.word-highlighted');
    highlightedWords.forEach(word => {
      word.classList.remove('word-highlighted');
    });
  }

  scrollToWordIfNeeded(wordElement) {
    const rect = wordElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Si la palabra está fuera del viewport (con margen)
    if (rect.top < 100 || rect.bottom > viewportHeight - 100) {
      wordElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }

  // ==========================================================================
  // MODOS DE VISUALIZACIÓN
  // ==========================================================================

  setMode(mode) {
    // Aplicar diferentes estilos de resaltado
    if (!this.currentParagraph) return;

    // Remover clases de modos anteriores
    this.currentParagraph.classList.remove(
      'word-sync-mode-underline',
      'word-sync-mode-background',
      'word-sync-mode-scale',
      'word-sync-mode-karaoke'
    );

    // Aplicar nuevo modo
    switch (mode) {
      case 'UNDERLINE':
        this.currentParagraph.classList.add('word-sync-mode-underline');
        break;
      case 'BACKGROUND':
        this.currentParagraph.classList.add('word-sync-mode-background');
        break;
      case 'SCALE':
        this.currentParagraph.classList.add('word-sync-mode-scale');
        break;
      case 'KARAOKE':
        this.currentParagraph.classList.add('word-sync-mode-karaoke');
        break;
      default:
        // Modo por defecto (highlight sutil)
        break;
    }
  }

  // ==========================================================================
  // CALIBRACIÓN AUTOMÁTICA
  // ==========================================================================

  calibrate(actualDuration, wordCount) {
    // Ajustar WPM basado en duración real de párrafos anteriores
    if (actualDuration > 0 && wordCount > 0) {
      const measuredWPM = (wordCount / (actualDuration / 60000));
      this.wordsPerMinute = measuredWPM;
      // logger.debug(`📊 WPM calibrado: ${measuredWPM.toFixed(0)}`);
    }
  }

  // ==========================================================================
  // MODO KARAOKE (mostrar solo contexto cercano)
  // ==========================================================================

  enableKaraokeMode() {
    if (!this.currentParagraph) return;

    // Añadir clase para karaoke mode
    this.currentParagraph.classList.add('word-sync-karaoke-mode');

    // Ocultar todas las palabras excepto las cercanas
    const wordSpans = this.currentParagraph.querySelectorAll('.word-sync');
    wordSpans.forEach((span, idx) => {
      span.style.opacity = '0.2';
    });
  }

  updateKaraokeContext() {
    if (!this.currentParagraph) return;

    const wordSpans = this.currentParagraph.querySelectorAll('.word-sync');
    const contextRange = 5; // Mostrar 5 palabras antes y después

    wordSpans.forEach((span, idx) => {
      const distance = Math.abs(idx - this.currentWordIndex);

      if (distance === 0) {
        // Palabra actual
        span.style.opacity = '1';
        span.style.transform = 'scale(1.2)';
      } else if (distance <= contextRange) {
        // Palabras cercanas
        const opacity = 1 - (distance / contextRange) * 0.8;
        span.style.opacity = opacity.toString();
        span.style.transform = 'scale(1)';
      } else {
        // Palabras lejanas
        span.style.opacity = '0.1';
        span.style.transform = 'scale(1)';
      }
    });
  }

  disableKaraokeMode() {
    if (!this.currentParagraph) return;

    this.currentParagraph.classList.remove('word-sync-karaoke-mode');

    const wordSpans = this.currentParagraph.querySelectorAll('.word-sync');
    wordSpans.forEach(span => {
      span.style.opacity = '1';
      span.style.transform = 'scale(1)';
    });
  }

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================

  getProgress() {
    if (this.words.length === 0) return 0;
    return (this.currentWordIndex / this.words.length) * 100;
  }

  getEstimatedTimeRemaining() {
    const remainingWords = this.words.length - this.currentWordIndex;
    const wpmAdjusted = this.wordsPerMinute * this.ttsRate;
    const minutesRemaining = remainingWords / wpmAdjusted;
    return minutesRemaining * 60 * 1000; // en ms
  }

  // ==========================================================================
  // LIMPIEZA
  // ==========================================================================

  destroy() {
    this.stop();
    this.currentParagraph = null;
    this.words = [];
    this.currentWordIndex = 0;
  }
}

// Estilos CSS para word-by-word sync
const wordSyncStyles = `
<style id="word-sync-styles">
  /* Palabra resaltada - estilo por defecto */
  .word-highlighted {
    background: linear-gradient(to right, #06b6d4 0%, #06b6d4 100%);
    background-size: 100% 3px;
    background-position: 0 100%;
    background-repeat: no-repeat;
    color: #06b6d4;
    font-weight: 600;
    transition: all 0.15s ease-out;
  }

  /* Modo Underline */
  .word-sync-mode-underline .word-highlighted {
    background: none;
    border-bottom: 3px solid #06b6d4;
    color: inherit;
  }

  /* Modo Background */
  .word-sync-mode-background .word-highlighted {
    background: rgba(6, 182, 212, 0.2);
    background-size: auto;
    padding: 2px 4px;
    border-radius: 4px;
    color: #06b6d4;
  }

  /* Modo Scale */
  .word-sync-mode-scale .word-highlighted {
    background: none;
    transform: scale(1.15);
    color: #06b6d4;
    display: inline-block;
  }

  /* Modo Karaoke */
  .word-sync-mode-karaoke {
    font-size: 1.2em;
    line-height: 2;
  }

  .word-sync-mode-karaoke .word-highlighted {
    background: linear-gradient(to right, #06b6d4 0%, #a855f7 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 1.3em;
    font-weight: 700;
    transform: scale(1.1);
  }

  /* Karaoke Mode container */
  .word-sync-karaoke-mode {
    text-align: center;
    font-size: 1.5em;
    line-height: 2.5;
  }

  .word-sync-karaoke-mode .word-sync {
    transition: opacity 0.3s ease, transform 0.3s ease;
    display: inline-block;
    margin: 0 4px;
  }

  /* Wrapper para palabras */
  .word-sync {
    display: inline;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .word-sync:hover {
    color: #06b6d4;
  }
</style>
`;

// Inyectar estilos si no existen
if (!document.getElementById('word-sync-styles')) {
  document.head.insertAdjacentHTML('beforeend', wordSyncStyles);
}

// Exportar
window.WordByWordSync = WordByWordSync;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = WordByWordSync;
}
