// ============================================================================
// BOOK READER UTILS - Utilidades y gestión de recursos
// ============================================================================
// v2.9.279: Modularización del BookReader
// Timer tracking, dependency injection, helpers

class BookReaderUtils {
  constructor(bookReader) {
    this.bookReader = bookReader;

    // Timer tracking para memory leak prevention
    this.timers = [];
    this.intervals = [];
    this.eventListeners = [];
  }

  // ==========================================================================
  // DEPENDENCY INJECTION
  // ==========================================================================

  /**
   * Acceso seguro a dependencias globales
   */
  getDependency(name) {
    if (window.dependencyInjector) {
      return window.dependencyInjector.getSafe(name);
    }
    return window[name] || null;
  }

  /**
   * Acceso seguro a múltiples dependencias
   */
  getDependencies(names) {
    if (window.dependencyInjector) {
      return window.dependencyInjector.getMultipleSafe(names);
    }
    const result = {};
    names.forEach(name => {
      result[name] = window[name] || null;
    });
    return result;
  }

  // ==========================================================================
  // TOAST HELPERS
  // ==========================================================================

  /**
   * Helper para mostrar toasts de forma segura
   */
  showToast(type, message) {
    const toast = this.getDependency('toast');
    if (toast && typeof toast[type] === 'function') {
      toast[type](message);
    } else {
      if (typeof logger !== 'undefined') {
        logger.debug(`[Toast ${type.toUpperCase()}]`, message);
      }
    }
  }

  // ==========================================================================
  // THEME HELPERS
  // ==========================================================================

  /**
   * Helper para obtener tema de forma segura
   */
  getThemeInfo() {
    const themeHelper = this.getDependency('themeHelper');
    return {
      icon: themeHelper?.getThemeIcon?.() || '🌙',
      label: themeHelper?.getThemeLabel?.() || 'Tema'
    };
  }

  /**
   * Aplicar tema de libro
   */
  applyBookTheme() {
    const themeHelper = this.getDependency('themeHelper');
    const bookEngine = this.bookReader.bookEngine;
    if (themeHelper && bookEngine) {
      themeHelper.applyBookTheme(bookEngine.getCurrentBookConfig());
    }
  }

  /**
   * Remover tema de libro
   */
  removeBookTheme() {
    const themeHelper = this.getDependency('themeHelper');
    if (themeHelper) {
      themeHelper.removeBookTheme();
    }
  }

  /**
   * Actualizar iconos de tema en la UI
   */
  updateThemeIcons() {
    const themeHelper = this.getDependency('themeHelper');
    if (!themeHelper) return;

    const icon = themeHelper.getThemeIcon();
    const label = themeHelper.getThemeLabel();

    const iconElements = ['theme-icon', 'theme-icon-mobile', 'theme-icon-dropdown', 'theme-icon-bib'];
    const labelElements = ['theme-label', 'theme-label-mobile', 'theme-label-dropdown', 'theme-label-bib'];

    iconElements.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = icon;
    });

    labelElements.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = label;
    });
  }

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  /**
   * Capturar errores de forma segura
   */
  captureError(error, context) {
    const errorBoundary = this.getDependency('errorBoundary');
    if (errorBoundary) {
      errorBoundary.captureError(error, context);
    } else {
      logger.error('[BookReader] Error:', error, context);
    }
  }

  // ==========================================================================
  // TIMER & LISTENER TRACKING (Memory leak prevention)
  // ==========================================================================

  /**
   * setTimeout wrapper con tracking automático
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
   * setInterval wrapper con tracking automático
   */
  setInterval(callback, delay) {
    const intervalId = setInterval(callback, delay);
    this.intervals.push(intervalId);
    return intervalId;
  }

  /**
   * addEventListener wrapper con tracking automático
   */
  addEventListener(target, event, handler, options) {
    if (!target) return;
    target.addEventListener(event, handler, options);
    this.eventListeners.push({ target, event, handler, options });
  }

  /**
   * Limpiar un timeout específico
   */
  clearTimeout(timerId) {
    clearTimeout(timerId);
    const index = this.timers.indexOf(timerId);
    if (index > -1) {
      this.timers.splice(index, 1);
    }
  }

  /**
   * Limpiar un interval específico
   */
  clearInterval(intervalId) {
    clearInterval(intervalId);
    const index = this.intervals.indexOf(intervalId);
    if (index > -1) {
      this.intervals.splice(index, 1);
    }
  }

  // ==========================================================================
  // STRING HELPERS
  // ==========================================================================

  /**
   * Acortar título de capítulo para navegación móvil
   */
  shortenChapterTitle(title, maxLength = 35) {
    if (!title) return '';
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength).trim() + '...';
  }

  // ==========================================================================
  // PLATFORM DETECTION
  // ==========================================================================

  /**
   * Detectar si está en Capacitor (app nativa)
   */
  isCapacitor() {
    return typeof window.Capacitor !== 'undefined';
  }

  /**
   * Detectar si es móvil
   */
  isMobile() {
    return window.innerWidth < 768;
  }

  /**
   * Detectar si es tablet
   */
  isTablet() {
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  }

  /**
   * Detectar si es desktop
   */
  isDesktop() {
    return window.innerWidth >= 1024;
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Limpiar todos los timers e intervals
   */
  clearAllTimers() {
    // Limpiar timers
    if (this.timers.length > 0) {
      const timersCount = this.timers.length;
      this.timers.forEach(timerId => clearTimeout(timerId));
      this.timers = [];
      if (typeof logger !== 'undefined') {
        logger.debug(`[BookReaderUtils] Limpiados ${timersCount} timers`);
      }
    }

    // Limpiar intervals
    if (this.intervals.length > 0) {
      const intervalsCount = this.intervals.length;
      this.intervals.forEach(intervalId => clearInterval(intervalId));
      this.intervals = [];
      if (typeof logger !== 'undefined') {
        logger.debug(`[BookReaderUtils] Limpiados ${intervalsCount} intervals`);
      }
    }

    // Limpiar event listeners trackeados
    if (this.eventListeners.length > 0) {
      const listenersCount = this.eventListeners.length;
      this.eventListeners.forEach(({ target, event, handler, options }) => {
        if (target && typeof target.removeEventListener === 'function') {
          target.removeEventListener(event, handler, options);
        }
      });
      this.eventListeners = [];
      if (typeof logger !== 'undefined') {
        logger.debug(`[BookReaderUtils] Limpiados ${listenersCount} event listeners`);
      }
    }
  }

  destroy() {
    this.clearAllTimers();
    this.bookReader = null;
  }
}

// Exportar globalmente
window.BookReaderUtils = BookReaderUtils;
