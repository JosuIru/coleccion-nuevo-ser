// ============================================================================
// LOGGER - Sistema de logging condicional (solo desarrollo)
// ============================================================================
// Muestra logs solo en desarrollo (localhost o ?debug=true)

class Logger {
  constructor() {
    this.isDev = this.checkIfDevelopment();
    this.manualOverride = this.loadDebugSetting();
  }

  checkIfDevelopment() {
    // Check if running on localhost
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '';

    // Check if debug parameter is in URL
    const urlParams = new URLSearchParams(window.location.search);
    const hasDebugParam = urlParams.get('debug') === 'true';

    return isLocalhost || hasDebugParam;
  }

  /**
   * Carga configuración de debug desde localStorage
   */
  loadDebugSetting() {
    try {
      return localStorage.getItem('debug_mode') === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Verifica si debug está activo (por cualquier método)
   */
  isDebugEnabled() {
    return this.isDev || this.manualOverride;
  }

  /**
   * Activa/desactiva modo debug manualmente
   * @param {boolean} enabled - true para activar, false para desactivar
   */
  setDebugMode(enabled) {
    this.manualOverride = enabled;
    try {
      if (enabled) {
        localStorage.setItem('debug_mode', 'true');
      } else {
        localStorage.removeItem('debug_mode');
      }
    } catch {
      // localStorage no disponible
    }
    console.log(`[LOGGER] Modo debug ${enabled ? 'ACTIVADO' : 'DESACTIVADO'}`);
    return this.getStatus();
  }

  /**
   * Toggle de modo debug
   */
  toggleDebugMode() {
    return this.setDebugMode(!this.manualOverride);
  }

  log(...args) {
    if (this.isDebugEnabled()) {
      console.log('[LOG]', ...args);
    }
  }

  warn(...args) {
    if (this.isDebugEnabled()) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args) {
    // Always show errors, even in production
    console.error('[ERROR]', ...args);
  }

  info(...args) {
    if (this.isDebugEnabled()) {
      console.info('[INFO]', ...args);
    }
  }

  debug(...args) {
    if (this.isDebugEnabled()) {
      console.debug('[DEBUG]', ...args);
    }
  }

  group(...args) {
    if (this.isDebugEnabled()) {
      console.group(...args);
    }
  }

  groupEnd() {
    if (this.isDebugEnabled()) {
      console.groupEnd();
    }
  }

  table(data) {
    if (this.isDebugEnabled()) {
      console.table(data);
    }
  }

  // Status indicator
  getStatus() {
    return {
      mode: this.isDev ? 'development' : 'production',
      debugEnabled: this.isDebugEnabled(),
      manualOverride: this.manualOverride,
      autoDetected: this.isDev
    };
  }
}

// Global instance
window.logger = new Logger();
