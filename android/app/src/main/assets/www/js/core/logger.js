// ============================================================================
// LOGGER - Sistema de logging condicional (solo desarrollo)
// ============================================================================
// Muestra logs solo en desarrollo (localhost o ?debug=true)

class Logger {
  constructor() {
    this.isDev = this.checkIfDevelopment();
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

  log(...args) {
    if (this.isDev) {
      console.log('[LOG]', ...args);
    }
  }

  warn(...args) {
    if (this.isDev) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args) {
    // Always show errors, even in production
    console.error('[ERROR]', ...args);
  }

  info(...args) {
    if (this.isDev) {
      console.info('[INFO]', ...args);
    }
  }

  debug(...args) {
    if (this.isDev) {
      console.debug('[DEBUG]', ...args);
    }
  }

  group(...args) {
    if (this.isDev) {
      console.group(...args);
    }
  }

  groupEnd() {
    if (this.isDev) {
      console.groupEnd();
    }
  }

  table(data) {
    if (this.isDev) {
      console.table(data);
    }
  }

  // Status indicator
  getStatus() {
    return {
      mode: this.isDev ? 'development' : 'production',
      logsEnabled: this.isDev
    };
  }
}

// Global instance
window.logger = new Logger();
