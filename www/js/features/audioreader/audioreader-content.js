// ============================================================================
// AUDIOREADER CONTENT - Preparación y parsing de contenido para TTS
// ============================================================================
// v2.9.278: Modularización del AudioReader
// Responsable de parsear HTML a párrafos y detectar ejercicios/meditaciones

class AudioReaderContent {
  constructor(audioReader) {
    this.audioReader = audioReader;
    this.paragraphs = [];
  }

  // ==========================================================================
  // PREPARACIÓN DEL CONTENIDO
  // ==========================================================================

  /**
   * Prepara el contenido del capítulo para narración
   * @param {string} chapterHTML - HTML del capítulo
   * @returns {number} Número de párrafos preparados
   */
  prepare(chapterHTML) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = chapterHTML;

    const isExerciseBook = this.isExerciseBook();
    const exerciseDuration = this.extractDuration(tempDiv);
    const totalExerciseSteps = isExerciseBook
      ? tempDiv.querySelectorAll('ol.exercise-steps li').length
      : 0;

    const elements = tempDiv.querySelectorAll('p, h2, h3, li, blockquote');
    this.paragraphs = [];

    let currentStepNumber = 0;

    elements.forEach((el, index) => {
      const rawText = el.innerText.trim();

      if (this.isFooterElement(rawText)) {
        return;
      }

      const text = this.sanitizeText(rawText);

      if (text && text.length > 0) {
        const isExerciseStep = this.isExerciseStep(el);

        if (isExerciseStep) {
          currentStepNumber++;
        }

        let pauseAfter = 0;
        if (isExerciseBook && isExerciseStep) {
          const customPause = el.getAttribute('data-pause');
          if (customPause) {
            pauseAfter = parseInt(customPause) * 1000;
          } else {
            pauseAfter = this.calculatePauseTime(exerciseDuration, totalExerciseSteps, currentStepNumber);
          }
        }

        this.paragraphs.push({
          index,
          text,
          element: el,
          spoken: false,
          isExerciseStep,
          stepNumber: isExerciseStep ? currentStepNumber : null,
          totalSteps: isExerciseStep ? totalExerciseSteps : null,
          pauseAfter
        });
      }
    });

    if (isExerciseBook && exerciseDuration) {
      if (typeof logger !== 'undefined') {
        logger.log(`🧘 Libro de ejercicios detectado - Duración: ${exerciseDuration} min - ${totalExerciseSteps} pasos`);
      }
    }

    if (typeof logger !== 'undefined') {
      logger.log(`📖 Preparados ${this.paragraphs.length} párrafos para narrar`);
    }

    return this.paragraphs.length;
  }

  /**
   * Obtiene los párrafos preparados
   * @returns {Array} Array de párrafos
   */
  getParagraphs() {
    return this.paragraphs;
  }

  /**
   * Obtiene un párrafo específico
   * @param {number} index - Índice del párrafo
   * @returns {Object|null} Párrafo o null
   */
  getParagraph(index) {
    return this.paragraphs[index] || null;
  }

  // ==========================================================================
  // SANITIZACIÓN DE TEXTO
  // ==========================================================================

  /**
   * Sanitiza texto para TTS - elimina símbolos markdown y caracteres problemáticos
   * @param {string} text - Texto a sanitizar
   * @returns {string} Texto sanitizado
   */
  sanitizeText(text) {
    if (!text) return '';

    return text
      // Eliminar flechas Unicode y ASCII
      .replace(/→/g, ' ')
      .replace(/←/g, ' ')
      .replace(/↑/g, ' ')
      .replace(/↓/g, ' ')
      .replace(/⇒/g, ' ')
      .replace(/⇐/g, ' ')
      .replace(/->/g, ' ')
      .replace(/<-/g, ' ')
      .replace(/=>/g, ' ')
      // Eliminar guiones sueltos con espacios
      .replace(/\s+-\s+/g, ' ')
      // Eliminar símbolos markdown de encabezados
      .replace(/^#{1,6}\s*/gm, '')
      // Eliminar asteriscos de negrita/cursiva
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      // Eliminar guiones bajos de negrita/cursiva
      .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
      // Eliminar backticks de código
      .replace(/`([^`]+)`/g, '$1')
      // Eliminar corchetes de enlaces markdown
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Eliminar símbolos de lista
      .replace(/^[\s]*[-*+]\s+/gm, '')
      // Eliminar números de lista ordenada
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // Eliminar blockquote markers
      .replace(/^>\s*/gm, '')
      // Eliminar múltiples espacios
      .replace(/\s{2,}/g, ' ')
      // Eliminar caracteres de tabla
      .replace(/[│├└┌┐┘┬┴┼─═║╔╗╚╝╠╣╬]/g, '')
      // Normalizar puntuación
      .replace(/\.{3,}/g, '...')
      .replace(/!{2,}/g, '!')
      .replace(/\?{2,}/g, '?')
      .trim();
  }

  // ==========================================================================
  // DETECCIÓN DE EJERCICIOS
  // ==========================================================================

  /**
   * Detecta si el libro actual es de ejercicios/meditaciones
   * @returns {boolean}
   */
  isExerciseBook() {
    const currentBookId = this.audioReader?.bookEngine?.currentBook || '';
    const exerciseBooks = ['manual-practico', 'practicas-radicales'];
    return exerciseBooks.includes(currentBookId);
  }

  /**
   * Detecta si un elemento es un paso de ejercicio
   * @param {HTMLElement} element - Elemento DOM
   * @returns {boolean}
   */
  isExerciseStep(element) {
    if (element.tagName !== 'LI') return false;

    const parent = element.parentElement;
    if (!parent || parent.tagName !== 'OL') return false;

    return parent.classList.contains('exercise-steps');
  }

  /**
   * Extrae la duración del ejercicio del HTML
   * @param {HTMLElement} containerDiv - Contenedor del ejercicio
   * @returns {number|null} Duración en minutos o null
   */
  extractDuration(containerDiv) {
    const durationElements = containerDiv.querySelectorAll('.duration, p.duration');
    for (const el of durationElements) {
      const text = el.textContent;
      const match = text.match(/(\d+)(?:-\d+)?\s*(?:min|minutos)/i);
      if (match) {
        return parseInt(match[1]);
      }
    }
    return null;
  }

  /**
   * Calcula el tiempo de pausa con distribución progresiva
   * Los pasos contemplativos tienen pausas más largas
   * @param {number} durationMinutes - Duración total del ejercicio
   * @param {number} totalSteps - Número de pasos
   * @param {number} currentStep - Paso actual
   * @returns {number} Milisegundos de pausa
   */
  calculatePauseTime(durationMinutes, totalSteps, currentStep = 1) {
    if (!durationMinutes) {
      return 15000;
    }

    if (!totalSteps || totalSteps === 0) {
      return 15000;
    }

    const totalSeconds = durationMinutes * 60;
    const estimatedReadingTimePerStep = 12;
    const totalReadingTime = totalSteps * estimatedReadingTimePerStep;
    const availableTimeForPauses = Math.max(totalSeconds - totalReadingTime, totalSteps * 15);

    const position = currentStep / totalSteps;
    let weight;

    if (position <= 0.25) {
      weight = 0.6; // Preparación
    } else if (position <= 0.5) {
      weight = 0.9; // Entrada
    } else if (position <= 0.75) {
      weight = 1.3; // Inmersión
    } else if (position < 1.0) {
      weight = 1.5; // Contemplación
    } else {
      weight = 2.0; // Integración final
    }

    const basePauseSeconds = availableTimeForPauses / totalSteps;
    let pauseSeconds = Math.floor(basePauseSeconds * weight);

    const minPause = 15;
    const maxPause = 300;
    pauseSeconds = Math.max(minPause, Math.min(maxPause, pauseSeconds));

    if (currentStep === totalSteps && pauseSeconds < 45) {
      pauseSeconds = 45;
    }

    const pauseMilliseconds = pauseSeconds * 1000;

    if (typeof logger !== 'undefined') {
      const phaseNames = ['Preparación', 'Entrada', 'Inmersión', 'Contemplación', 'Integración'];
      const phaseIndex = position <= 0.25 ? 0 : position <= 0.5 ? 1 : position <= 0.75 ? 2 : position < 1 ? 3 : 4;
      logger.log(`🧘 Paso ${currentStep}/${totalSteps} [${phaseNames[phaseIndex]}]: Pausa de ${pauseSeconds}s`);
    }

    return pauseMilliseconds;
  }

  // ==========================================================================
  // FILTRADO DE ELEMENTOS
  // ==========================================================================

  /**
   * Detecta si un texto es parte del footer repetitivo
   * @param {string} text - Texto a verificar
   * @returns {boolean}
   */
  isFooterElement(text) {
    if (!text) return false;

    const footerPatterns = [
      /^©/,
      /anterior\s*\|?\s*siguiente/i,
      /ir\s+al\s+índice/i,
      /volver\s+al\s+inicio/i,
      /^\s*\|\s*$/,
      /página\s+\d+/i,
      /^\d+\s*\/\s*\d+$/,
    ];

    return footerPatterns.some(pattern => pattern.test(text));
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Limpia referencias para evitar memory leaks
   */
  destroy() {
    this.paragraphs = [];
    this.audioReader = null;
  }
}

// Exportar globalmente
window.AudioReaderContent = AudioReaderContent;
