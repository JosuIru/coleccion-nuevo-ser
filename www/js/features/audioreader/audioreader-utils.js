// ============================================================================
// AUDIOREADER UTILS - Utilidades compartidas para AudioReader
// ============================================================================
// v2.9.278: Modularización del AudioReader
// Proporciona timer tracking, formateo de tiempo y utilidades comunes

class AudioReaderUtils {
  constructor() {
    this.timers = [];
    this.intervals = [];
  }

  // ==========================================================================
  // TIMER TRACKING (Memory Leak Prevention)
  // ==========================================================================

  /**
   * setTimeout con tracking automático para cleanup
   * Previene memory leaks al trackear todos los timers creados
   */
  setTimeout(callback, delay) {
    const timerId = setTimeout(() => {
      callback();
      const index = this.timers.indexOf(timerId);
      if (index > -1) {
        this.timers.splice(index, 1);
      }
    }, delay);
    this.timers.push(timerId);
    return timerId;
  }

  /**
   * setInterval con tracking automático para cleanup
   */
  setInterval(callback, delay) {
    const intervalId = setInterval(callback, delay);
    this.intervals.push(intervalId);
    return intervalId;
  }

  /**
   * clearTimeout con auto-remove del tracking
   */
  clearTimeout(timerId) {
    if (timerId) {
      clearTimeout(timerId);
      const index = this.timers.indexOf(timerId);
      if (index > -1) {
        this.timers.splice(index, 1);
      }
    }
  }

  /**
   * clearInterval con auto-remove del tracking
   */
  clearInterval(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
      const index = this.intervals.indexOf(intervalId);
      if (index > -1) {
        this.intervals.splice(index, 1);
      }
    }
  }

  /**
   * Limpia todos los timers e intervals registrados
   */
  clearAllTimers() {
    if (this.timers && this.timers.length > 0) {
      this.timers.forEach(timerId => {
        try {
          clearTimeout(timerId);
        } catch (e) {
          // Ignorar errores de limpieza
        }
      });
      this.timers = [];
    }

    if (this.intervals && this.intervals.length > 0) {
      this.intervals.forEach(intervalId => {
        try {
          clearInterval(intervalId);
        } catch (e) {
          // Ignorar errores de limpieza
        }
      });
      this.intervals = [];
    }
  }

  // ==========================================================================
  // TIEMPO Y FORMATEO
  // ==========================================================================

  /**
   * Calcula el tiempo estimado de lectura restante
   * @param {Array} paragraphs - Array de párrafos
   * @param {number} currentIndex - Índice del párrafo actual
   * @param {number} rate - Velocidad de lectura (1.0 = normal)
   * @returns {number} Minutos estimados
   */
  estimateTime(paragraphs, currentIndex, rate = 1.0) {
    if (!paragraphs || paragraphs.length === 0) return 0;

    const wordsPerMinute = 150 * rate;
    let totalWords = 0;

    for (let i = currentIndex; i < paragraphs.length; i++) {
      if (paragraphs[i] && paragraphs[i].text) {
        totalWords += paragraphs[i].text.split(/\s+/).length;
      }
    }

    return totalWords / wordsPerMinute;
  }

  /**
   * Formatea minutos a string legible (ej: "5min", "1h 30min", "45s")
   * @param {number} minutes - Minutos a formatear
   * @returns {string} Tiempo formateado
   */
  formatTime(minutes) {
    if (minutes < 1) {
      return `${Math.ceil(minutes * 60)}s`;
    } else if (minutes < 60) {
      return `${Math.ceil(minutes)}min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.ceil(minutes % 60);
      return `${hours}h ${mins}min`;
    }
  }

  /**
   * Formatea segundos a mm:ss
   * @param {number} seconds - Segundos a formatear
   * @returns {string} Tiempo formateado (mm:ss)
   */
  formatSeconds(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // ==========================================================================
  // VOCES
  // ==========================================================================

  /**
   * Simplifica el nombre de una voz TTS para mostrar en la UI
   * @param {string} fullName - Nombre completo de la voz
   * @returns {string} Nombre simplificado
   */
  simplifyVoiceName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
      return 'Voz';
    }

    let name = fullName;

    // Si es un URN/URI técnico, extraer parte legible
    if (name.includes('urn:') || name.includes('://')) {
      const parts = name.split(':');
      const lastPart = parts[parts.length - 1];

      if (lastPart && lastPart.includes('+')) {
        const [, variant] = lastPart.split('+');
        const capitalizedVariant = variant.charAt(0).toUpperCase() + variant.slice(1);
        name = `Español ${capitalizedVariant}`;
      } else if (lastPart) {
        name = 'Español';
      }
    } else {
      // No es URI, limpiar nombre
      name = name.replace(/^Microsoft\s+/i, '');
      name = name.replace(/^Google\s+/i, '');
      name = name.replace(/\s+-\s+.*$/, '');
      name = name.replace(/\s+\(.*?\)$/, '');
    }

    // Limitar longitud
    if (name.length > 25) {
      name = name.substring(0, 23) + '...';
    }

    return name.trim() || 'Voz';
  }

  // ==========================================================================
  // ALMACENAMIENTO SEGURO
  // ==========================================================================

  /**
   * Guarda en localStorage con manejo de errores
   * @param {string} key - Clave de almacenamiento
   * @param {*} value - Valor a guardar
   * @returns {boolean} True si se guardó correctamente
   */
  safeStorageSet(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      logger.warn(`[AudioReaderUtils] Error guardando ${key}:`, error);
      return false;
    }
  }

  /**
   * Lee de localStorage con manejo de errores
   * @param {string} key - Clave de almacenamiento
   * @param {*} defaultValue - Valor por defecto si no existe
   * @returns {*} Valor almacenado o defaultValue
   */
  safeStorageGet(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.warn(`[AudioReaderUtils] Error leyendo ${key}:`, error);
      return defaultValue;
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    this.clearAllTimers();
  }
}

// Exportar globalmente
window.AudioReaderUtils = AudioReaderUtils;
