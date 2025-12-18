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
      // console.log(...args);
    }
  }

  warn(...args) {
    if (this.isDev) {
      // console.warn(...args);
    }
  }

  error(...args) {
    // Always show errors, even in production
    console.error(...args);
  }

  info(...args) {
    if (this.isDev) {
      // console.info(...args);
    }
  }

  debug(...args) {
    if (this.isDev) {
      // console.debug(...args);
    }
  }

  group(...args) {
    if (this.isDev) {
      // console.group(...args);
    }
  }

  groupEnd() {
    if (this.isDev) {
      // console.groupEnd();
    }
  }

  table(data) {
    if (this.isDev) {
      // console.table(data);
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
