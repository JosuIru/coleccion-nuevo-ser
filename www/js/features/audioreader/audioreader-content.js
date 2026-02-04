// ============================================================================
// AUDIOREADER CONTENT - Preparación y parsing de contenido para TTS
// ============================================================================
// v2.9.386: Filtrado mejorado de UI, chunking de párrafos largos, sanitización
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

    // Eliminar secciones que NO deben leerse (UI, navegación, acciones)
    this.removeNonReadableSections(tempDiv);

    const isExerciseBook = this.isExerciseBook();
    const exerciseDuration = this.extractDuration(tempDiv);
    const totalExerciseSteps = isExerciseBook
      ? tempDiv.querySelectorAll('ol.exercise-steps li').length
      : 0;

    const elements = tempDiv.querySelectorAll('p, h2, h3, li, blockquote');
    this.paragraphs = [];

    let currentStepNumber = 0;
    let paragraphIndex = 0;

    for (const el of elements) {
      const rawText = el.innerText.trim();

      // Filtrar elementos no deseados
      if (this.isFooterElement(rawText) || this.isUIElement(el, rawText)) {
        continue;
      }

      const text = this.sanitizeText(rawText);

      // Solo añadir si hay texto significativo (más de 2 caracteres)
      if (text && text.length > 2) {
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

        // Dividir párrafos muy largos para evitar cortes de TTS
        const chunks = this.splitLongText(text);

        for (const chunk of chunks) {
          this.paragraphs.push({
            index: paragraphIndex++,
            text: chunk,
            element: el,
            spoken: false,
            isExerciseStep,
            stepNumber: isExerciseStep ? currentStepNumber : null,
            totalSteps: isExerciseStep ? totalExerciseSteps : null,
            pauseAfter: chunks.indexOf(chunk) === chunks.length - 1 ? pauseAfter : 200
          });
        }
      }
    }

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
   * Elimina secciones del DOM que no deben ser leídas
   * @param {HTMLElement} container - Contenedor del HTML
   */
  removeNonReadableSections(container) {
    // Selectores de secciones a eliminar (UI, navegación, acciones)
    const selectorsToRemove = [
      '.chapter-complete-actions',      // "¿Qué quieres hacer ahora?"
      '.mark-read-section',             // Botón de marcar como leído
      '.premium-edition-box',           // Box de edición premium
      '.footer-nav',                    // Navegación anterior/siguiente
      '.chapter-practice-banner',       // Banner de práctica
      '.action-cards',                  // Tarjetas de acción
      '.actions-grid',                  // Grid de acciones
      '.ai-suggestions',                // Sugerencias de IA
      '[data-no-tts]',                  // Elementos marcados explícitamente
      '.audioreader-controls',          // Controles del reproductor
      '.exercise-links',                // Enlaces a ejercicios
      '.complementary-material',        // Material complementario
      '.parent-book-link',              // Enlace al libro padre
      '.manifiesto-link',               // Enlace al manifiesto
      'button',                         // Todos los botones
      'nav',                            // Elementos de navegación
      '.navigation',                    // Navegación
      '.chapter-nav',                   // Navegación de capítulo
    ];

    selectorsToRemove.forEach(selector => {
      try {
        container.querySelectorAll(selector).forEach(el => el.remove());
      } catch (e) {
        // Selector inválido, ignorar
      }
    });
  }

  /**
   * Divide textos muy largos para evitar que el TTS se corte
   * @param {string} text - Texto a dividir
   * @param {number} maxLength - Longitud máxima por chunk (default: 400 caracteres)
   * @returns {string[]} Array de chunks
   */
  splitLongText(text, maxLength = 400) {
    if (!text || text.length <= maxLength) {
      return [text];
    }

    const chunks = [];
    let remaining = text;

    while (remaining.length > maxLength) {
      // Buscar punto de corte natural (. ! ? ; :) cerca del límite
      let cutPoint = maxLength;

      // Buscar hacia atrás un punto de corte natural
      const punctuation = ['. ', '! ', '? ', '; ', ': ', ', '];
      for (const punct of punctuation) {
        const lastPunct = remaining.lastIndexOf(punct, maxLength);
        if (lastPunct > maxLength * 0.5) { // Al menos 50% del chunk
          cutPoint = lastPunct + punct.length;
          break;
        }
      }

      // Si no encontramos puntuación, buscar espacio
      if (cutPoint === maxLength) {
        const lastSpace = remaining.lastIndexOf(' ', maxLength);
        if (lastSpace > maxLength * 0.7) {
          cutPoint = lastSpace + 1;
        }
      }

      chunks.push(remaining.substring(0, cutPoint).trim());
      remaining = remaining.substring(cutPoint).trim();
    }

    if (remaining.length > 0) {
      chunks.push(remaining);
    }

    return chunks;
  }

  /**
   * Detecta si un elemento es parte de la UI y no contenido de lectura
   * @param {HTMLElement} element - Elemento DOM
   * @param {string} text - Texto del elemento
   * @returns {boolean}
   */
  isUIElement(element, text) {
    if (!element || !text) return true;

    // Verificar clases del elemento o sus padres
    const uiClasses = [
      'action-card', 'action-btn', 'btn', 'button',
      'nav', 'navigation', 'menu', 'modal',
      'footer', 'header', 'sidebar',
      'toast', 'tooltip', 'dropdown'
    ];

    let current = element;
    while (current && current !== document.body) {
      const classList = current.classList;
      if (classList) {
        for (const cls of uiClasses) {
          if (classList.contains(cls)) {
            return true;
          }
        }
      }
      current = current.parentElement;
    }

    // Filtrar por contenido típico de UI
    const uiTextPatterns = [
      /^(anterior|siguiente|continuar|ver más|leer más)$/i,
      /^(guardar|cancelar|cerrar|aceptar|rechazar)$/i,
      /^(play|pause|stop|siguiente|anterior)$/i,
      /^\d+\s*\/\s*\d+$/,           // "1 / 10"
      /^[←→↑↓⏮⏭▶⏸⏹🎧📖📝🤖🎯📚]$/,  // Solo iconos
      /^(escuchar audio|tomar notas|preguntar a la ia|quiz)$/i,
      /^¿qué quieres hacer ahora\?$/i,
      /^elige cómo continuar/i,
    ];

    for (const pattern of uiTextPatterns) {
      if (pattern.test(text.trim())) {
        return true;
      }
    }

    return false;
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
      .replace(/[→←↑↓⇒⇐⇔↔➜➔➤►▶◀◄⏩⏪⏭⏮]/g, ' ')
      .replace(/->/g, ' ')
      .replace(/<-/g, ' ')
      .replace(/=>/g, ' ')
      .replace(/<=/g, ' ')

      // Eliminar emojis comunes de UI
      .replace(/[🎧📖📝🤖🎯📚💡⚡🧘✅✓✔️☐☑️⏱️🔒🔓⚙️🔧]/g, '')

      // Eliminar guiones y barras sueltas
      .replace(/\s+-\s+/g, ', ')           // " - " → ", "
      .replace(/\s+–\s+/g, ', ')           // " – " → ", "
      .replace(/\s+—\s+/g, ', ')           // " — " → ", "
      .replace(/\s*\|\s*/g, ', ')          // " | " → ", "
      .replace(/\s*\/\s*/g, ' o ')         // " / " → " o "

      // Eliminar símbolos markdown de encabezados
      .replace(/^#{1,6}\s*/gm, '')

      // Eliminar asteriscos de negrita/cursiva
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')

      // Eliminar guiones bajos de negrita/cursiva
      .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')

      // Eliminar backticks de código
      .replace(/`([^`]+)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')      // Bloques de código

      // Eliminar corchetes de enlaces markdown
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

      // Eliminar símbolos de lista
      .replace(/^[\s]*[-*+•◦▪▸]\s+/gm, '')

      // Eliminar números de lista ordenada (pero mantener números en contexto)
      .replace(/^[\s]*\d+[.)]\s+/gm, '')

      // Eliminar blockquote markers
      .replace(/^>\s*/gm, '')

      // Eliminar caracteres de tabla y diagramas
      .replace(/[│├└┌┐┘┬┴┼─═║╔╗╚╝╠╣╬┃┏┓┗┛┣┫┳┻╋]/g, '')

      // Eliminar caracteres especiales problemáticos
      .replace(/[©®™§¶†‡°•·]/g, '')

      // Eliminar URLs
      .replace(/https?:\/\/[^\s]+/gi, '')
      .replace(/www\.[^\s]+/gi, '')

      // Eliminar códigos/referencias técnicas
      .replace(/\b[A-Z0-9]{10,}\b/g, '')   // Códigos largos
      .replace(/\b\d{4,}\b/g, (match) => { // Números largos: leer como número
        return match.length > 8 ? '' : match;
      })

      // Normalizar puntuación
      .replace(/\.{3,}/g, '...')
      .replace(/!{2,}/g, '!')
      .replace(/\?{2,}/g, '?')
      .replace(/,{2,}/g, ',')
      .replace(/;{2,}/g, ';')

      // Eliminar paréntesis vacíos
      .replace(/\(\s*\)/g, '')
      .replace(/\[\s*\]/g, '')

      // Eliminar múltiples espacios y saltos de línea
      .replace(/\s{2,}/g, ' ')
      .replace(/\n+/g, ' ')

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
   * Detecta si un texto es parte del footer, navegación o UI repetitiva
   * @param {string} text - Texto a verificar
   * @returns {boolean}
   */
  isFooterElement(text) {
    if (!text) return true;

    // Textos muy cortos (menos de 3 caracteres) probablemente son símbolos
    if (text.trim().length < 3) return true;

    const footerPatterns = [
      // Copyright y legal
      /^©/,
      /^copyright/i,
      /todos los derechos/i,

      // Navegación
      /anterior\s*\|?\s*siguiente/i,
      /ir\s+al\s+índice/i,
      /volver\s+(al\s+)?(inicio|arriba|menú)/i,
      /^(anterior|siguiente)$/i,
      /capítulo\s+(anterior|siguiente)/i,

      // Paginación
      /^\s*\|\s*$/,
      /página\s+\d+/i,
      /^\d+\s*[/de]\s*\d+$/,

      // UI del reproductor y acciones
      /^¿qué quieres hacer/i,
      /^elige cómo continuar/i,
      /^marcar como leído/i,
      /^marcar como no leído/i,
      /^capítulo completado/i,
      /^escuchar audio$/i,
      /^tomar notas$/i,
      /^preguntar a la ia$/i,
      /^quiz interactivo$/i,
      /^ver recursos$/i,
      /^siguiente capítulo$/i,
      /^edición premium/i,
      /^descarga.*premium/i,
      /contribución.*sugerida/i,

      // Material complementario
      /^material complementario$/i,
      /^recursos adicionales$/i,
      /^ver práctica$/i,
      /^ver ejercicio$/i,
      /^explorar$/i,

      // Tiempo y duración genéricos
      /^\d+\s*(min|minutos?|seg|segundos?|h|horas?)$/i,

      // Solo números
      /^\d+$/,

      // Solo puntuación o símbolos
      /^[^\w\sáéíóúüñ]+$/i,
    ];

    return footerPatterns.some(pattern => pattern.test(text.trim()));
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
