// ============================================================================
// AUDIOREADER HIGHLIGHTER - Resaltado de texto durante reproducción
// ============================================================================
// v2.9.278: Modularización del AudioReader
// Maneja el resaltado de párrafos y palabra por palabra

class AudioReaderHighlighter {
  constructor(audioReader) {
    this.audioReader = audioReader;
    this.wordByWordEnabled = false;
    this.currentWordIndex = 0;
    this.wordsInCurrentParagraph = [];
  }

  // ==========================================================================
  // RESALTADO DE PÁRRAFOS
  // ==========================================================================

  /**
   * Resalta el párrafo actual y hace scroll
   * @param {number} index - Índice del párrafo
   */
  async highlightParagraph(index) {
    this.clearHighlights();

    const chapterContent = document.querySelector('.chapter-content');
    if (!chapterContent) return;

    const elements = chapterContent.querySelectorAll('p, h2, h3, li, blockquote');

    if (elements[index]) {
      elements[index].classList.add('audioreader-highlight');

      if (this.wordByWordEnabled) {
        this.wrapWordsInSpans(elements[index]);
      }

      elements[index].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }

    // Notificar a la UI para actualizar
    if (this.audioReader && this.audioReader.ui) {
      await this.audioReader.ui.updateUI();
    }
  }

  // ==========================================================================
  // RESALTADO PALABRA POR PALABRA
  // ==========================================================================

  /**
   * Activa o desactiva el modo palabra por palabra
   * @param {boolean} enabled - Estado del modo
   */
  setWordByWordEnabled(enabled) {
    this.wordByWordEnabled = enabled;

    try {
      localStorage.setItem('audioreader-word-by-word', enabled.toString());
    } catch (e) {
      // Ignorar errores de storage
    }

    if (!enabled) {
      this.clearWordHighlights();
    }
  }

  /**
   * Obtiene el estado del modo palabra por palabra
   * @returns {boolean}
   */
  isWordByWordEnabled() {
    return this.wordByWordEnabled;
  }

  /**
   * Carga la preferencia guardada del modo palabra por palabra
   */
  loadPreference() {
    try {
      this.wordByWordEnabled = localStorage.getItem('audioreader-word-by-word') === 'true';
    } catch (e) {
      this.wordByWordEnabled = false;
    }
    return this.wordByWordEnabled;
  }

  /**
   * Envuelve cada palabra del elemento en spans para resaltado individual
   * @param {HTMLElement} element - Elemento a procesar
   */
  wrapWordsInSpans(element) {
    if (element.hasAttribute('data-original-html')) {
      return;
    }

    element.setAttribute('data-original-html', element.innerHTML);

    const originalHTML = element.innerHTML;
    const words = originalHTML.split(/(\s+)/);

    this.wordsInCurrentParagraph = [];
    let htmlWithSpans = '';
    let wordIndex = 0;

    words.forEach(segment => {
      if (/^\s+$/.test(segment)) {
        htmlWithSpans += segment;
      } else if (segment.trim().length > 0) {
        htmlWithSpans += `<span class="audioreader-word" data-word-index="${wordIndex}">${segment}</span>`;
        this.wordsInCurrentParagraph.push(segment);
        wordIndex++;
      }
    });

    element.innerHTML = htmlWithSpans;
    this.currentWordIndex = 0;
  }

  /**
   * Resalta una palabra específica basándose en el índice de caracteres
   * @param {number} charIndex - Índice del carácter donde inicia la palabra
   * @param {number} charLength - Longitud de la palabra
   */
  highlightWord(charIndex, charLength) {
    const previousWord = document.querySelector('.audioreader-word-active');
    if (previousWord) {
      previousWord.classList.remove('audioreader-word-active');
    }

    const chapterContent = document.querySelector('.chapter-content');
    if (!chapterContent) return;

    const words = chapterContent.querySelectorAll('.audioreader-word');

    let charCount = 0;
    for (let i = 0; i < words.length; i++) {
      const wordText = words[i].textContent;
      const wordStart = charCount;
      const wordEnd = charCount + wordText.length;

      if (charIndex >= wordStart && charIndex < wordEnd) {
        words[i].classList.add('audioreader-word-active');

        words[i].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });

        this.currentWordIndex = i;
        break;
      }

      charCount += wordText.length + 1;
    }
  }

  // ==========================================================================
  // LIMPIEZA DE RESALTADOS
  // ==========================================================================

  /**
   * Limpia todos los resaltados de párrafos y palabras
   */
  clearHighlights() {
    const highlighted = document.querySelectorAll('.audioreader-highlight');
    highlighted.forEach(el => {
      el.classList.remove('audioreader-highlight');

      if (el.hasAttribute('data-original-html')) {
        el.innerHTML = el.getAttribute('data-original-html');
        el.removeAttribute('data-original-html');
      }
    });

    this.clearWordHighlights();
  }

  /**
   * Limpia solo los resaltados de palabras
   */
  clearWordHighlights() {
    const activeWords = document.querySelectorAll('.audioreader-word-active');
    activeWords.forEach(el => el.classList.remove('audioreader-word-active'));
    this.wordsInCurrentParagraph = [];
    this.currentWordIndex = 0;
  }

  // ==========================================================================
  // ACCESORES
  // ==========================================================================

  /**
   * Obtiene el índice de la palabra actual
   * @returns {number}
   */
  getCurrentWordIndex() {
    return this.currentWordIndex;
  }

  /**
   * Obtiene las palabras del párrafo actual
   * @returns {Array}
   */
  getWordsInCurrentParagraph() {
    return this.wordsInCurrentParagraph;
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Limpia referencias para evitar memory leaks
   */
  destroy() {
    this.clearHighlights();
    this.wordsInCurrentParagraph = [];
    this.audioReader = null;
  }
}

// Exportar globalmente
window.AudioReaderHighlighter = AudioReaderHighlighter;
