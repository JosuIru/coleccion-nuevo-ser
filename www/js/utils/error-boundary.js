/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * ERROR BOUNDARY
 * Sistema global de manejo de errores con recuperación automática
 *
 * Características:
 * - Captura errores no manejados (window.onerror)
 * - Captura promesas rechazadas (unhandledrejection)
 * - Categorización de errores (crítico, recuperable, menor)
 * - Estrategias de recuperación automática
 * - Logging estructurado para debugging
 * - UI fallback para errores críticos
 *
 * @version 1.0.0
 */

class ErrorBoundary {
  constructor(config = {}) {
    this.config = {
      enableRecovery: true,
      enableLogging: true,
      enableReporting: false, // Para futuro: enviar a Sentry/LogRocket
      maxRecoveryAttempts: 3,
      showUserFeedback: true,
      ...config
    };

    this.errorLog = [];
    this.recoveryAttempts = new Map();
    this.fatalErrorOccurred = false;

    this.init();
  }

  /**
   * Inicializar handlers globales
   */
  init() {
    // Handler para errores síncronos no capturados
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'uncaught_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        event: event
      });
    });

    // Handler para promesas rechazadas no manejadas
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'unhandled_rejection',
        message: event.reason?.message || String(event.reason),
        error: event.reason,
        promise: event.promise,
        event: event
      });
    });

    logger.debug('[ErrorBoundary] Sistema de manejo de errores inicializado');
  }

  /**
   * Handler principal de errores
   */
  handleError(errorInfo) {
    if (this.fatalErrorOccurred) {
      console.error('[ErrorBoundary] Error ignorado (modo fatal):', errorInfo);
      return;
    }

    // Categorizar error
    const category = this.categorizeError(errorInfo);

    // Crear contexto completo
    const errorContext = {
      ...errorInfo,
      category,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      appVersion: window.__APP_VERSION__ || 'unknown'
    };

    // Log estructurado
    if (this.config.enableLogging) {
      this.logError(errorContext);
    }

    // Guardar en historial
    this.errorLog.push(errorContext);
    if (this.errorLog.length > 100) {
      this.errorLog.shift(); // Mantener últimos 100 errores
    }

    // Estrategia de recuperación según categoría
    switch (category) {
      case 'fatal':
        this.handleFatalError(errorContext);
        break;
      case 'recoverable':
        this.handleRecoverableError(errorContext);
        break;
      case 'minor':
        this.handleMinorError(errorContext);
        break;
    }

    // Reporting externo (si está habilitado)
    if (this.config.enableReporting) {
      this.reportError(errorContext);
    }

    // Notificar a analytics si está disponible
    if (window.analyticsHelper) {
      window.analyticsHelper.trackError(
        category,
        errorContext.message,
        errorContext.filename || 'unknown'
      );
    }
  }

  /**
   * Categorizar error por severidad
   */
  categorizeError(errorInfo) {
    const message = errorInfo.message?.toLowerCase() || '';
    const filename = errorInfo.filename?.toLowerCase() || '';

    // Errores fatales (requieren recarga)
    if (
      message.includes('out of memory') ||
      message.includes('maximum call stack') ||
      message.includes('script error') ||
      (errorInfo.type === 'uncaught_error' && !errorInfo.error)
    ) {
      return 'fatal';
    }

    // Errores recuperables (se puede continuar)
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('not found') ||
      filename.includes('supabase') ||
      filename.includes('api')
    ) {
      return 'recoverable';
    }

    // Errores menores (warnings)
    return 'minor';
  }

  /**
   * Manejar error fatal
   */
  handleFatalError(errorContext) {
    console.error('[ErrorBoundary] 🔴 ERROR FATAL:', errorContext);

    this.fatalErrorOccurred = true;

    // Mostrar UI de error fatal
    if (this.config.showUserFeedback) {
      this.showFatalErrorUI(errorContext);
    }

    // Guardar estado para debugging
    try {
      localStorage.setItem('last_fatal_error', JSON.stringify({
        timestamp: errorContext.timestamp,
        message: errorContext.message,
        url: errorContext.url,
        version: errorContext.appVersion
      }));
    } catch (e) {
      console.error('[ErrorBoundary] No se pudo guardar error:', e);
    }
  }

  /**
   * Manejar error recuperable
   */
  handleRecoverableError(errorContext) {
    console.warn('[ErrorBoundary] 🟡 ERROR RECUPERABLE:', errorContext);

    const errorKey = errorContext.message + errorContext.filename;
    const attempts = this.recoveryAttempts.get(errorKey) || 0;

    if (attempts < this.config.maxRecoveryAttempts) {
      this.recoveryAttempts.set(errorKey, attempts + 1);

      if (this.config.enableRecovery) {
        this.attemptRecovery(errorContext);
      }
    } else {
      console.error('[ErrorBoundary] Máximo de intentos de recuperación alcanzado');

      // Mostrar mensaje al usuario
      if (window.toast) {
        window.toast.error('Ha ocurrido un error. Por favor, recarga la página.');
      }
    }

    // Limpiar intentos después de 5 minutos
    setTimeout(() => {
      this.recoveryAttempts.delete(errorKey);
    }, 5 * 60 * 1000);
  }

  /**
   * Manejar error menor
   */
  handleMinorError(errorContext) {
    logger.debug('[ErrorBoundary] ℹ️ ERROR MENOR:', errorContext);

    // Solo logging, no requiere acción del usuario
  }

  /**
   * Intentar recuperación automática
   */
  attemptRecovery(errorContext) {
    const message = errorContext.message?.toLowerCase() || '';

    // Estrategias específicas según el tipo de error
    if (message.includes('network') || message.includes('fetch')) {
      logger.debug('[ErrorBoundary] Reintentando operación de red...');
      // La lógica de retry debe estar en el código que hace la llamada
      // Aquí solo notificamos al usuario
      if (window.toast) {
        window.toast.warning('Problema de conexión. Reintentando...');
      }
    } else if (message.includes('not found') || message.includes('undefined')) {
      logger.debug('[ErrorBoundary] Intentando restaurar estado...');
      // Reinicializar componente si es posible
      this.reinitializeComponent(errorContext);
    }
  }

  /**
   * Reinicializar componente que falló
   */
  reinitializeComponent(errorContext) {
    const filename = errorContext.filename || '';

    try {
      if (filename.includes('book-reader')) {
        logger.debug('[ErrorBoundary] Reinicializando BookReader...');
        if (window.bookReader) {
          window.bookReader.render();
        }
      } else if (filename.includes('auth')) {
        logger.debug('[ErrorBoundary] Reinicializando Auth...');
        if (window.authModal) {
          window.authModal.init();
        }
      }
      // Agregar más casos según necesidad
    } catch (e) {
      console.error('[ErrorBoundary] Fallo en reinicialización:', e);
    }
  }

  /**
   * Mostrar UI de error fatal
   */
  showFatalErrorUI(errorContext) {
    // Crear overlay de error
    const overlay = document.createElement('div');
    overlay.id = 'fatal-error-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      z-index: 10002;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    overlay.innerHTML = `
      <div style="
        background: #1e293b;
        border: 2px solid #ef4444;
        border-radius: 12px;
        padding: 32px;
        max-width: 500px;
        text-align: center;
        color: white;
      ">
        <div style="font-size: 64px; margin-bottom: 16px;">⚠️</div>
        <h2 style="margin: 0 0 16px 0; color: #ef4444;">Error Fatal</h2>
        <p style="margin: 0 0 24px 0; color: #94a3b8;">
          La aplicación ha encontrado un error crítico y necesita recargarse.
        </p>
        <div style="
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 16px;
          margin: 0 0 24px 0;
          text-align: left;
          font-family: monospace;
          font-size: 12px;
          color: #ef4444;
          max-height: 150px;
          overflow-y: auto;
        ">
          ${this.escapeHtml(errorContext.message)}
        </div>
        <button
          onclick="window.location.reload()"
          style="
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 32px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          "
          onmouseover="this.style.background='#2563eb'"
          onmouseout="this.style.background='#3b82f6'"
        >
          Recargar Aplicación
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  /**
   * Escapar HTML para prevenir XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Log estructurado de error
   */
  logError(errorContext) {
    const logStyle = this.getLogStyle(errorContext.category);

    console.group(`%c[ErrorBoundary] ${errorContext.category.toUpperCase()}`, logStyle);
    logger.debug('Mensaje:', errorContext.message);
    logger.debug('Tipo:', errorContext.type);
    logger.debug('Timestamp:', errorContext.timestamp);
    logger.debug('URL:', errorContext.url);
    logger.debug('Versión:', errorContext.appVersion);

    if (errorContext.filename) {
      logger.debug('Archivo:', errorContext.filename);
    }

    if (errorContext.lineno) {
      logger.debug('Línea:', `${errorContext.lineno}:${errorContext.colno}`);
    }

    if (errorContext.error) {
      logger.debug('Stack:', errorContext.error.stack);
    }

    console.groupEnd();
  }

  /**
   * Estilos para logs según categoría
   */
  getLogStyle(category) {
    switch (category) {
      case 'fatal':
        return 'background: #dc2626; color: white; padding: 2px 8px; border-radius: 3px; font-weight: bold;';
      case 'recoverable':
        return 'background: #f59e0b; color: white; padding: 2px 8px; border-radius: 3px; font-weight: bold;';
      case 'minor':
        return 'background: #3b82f6; color: white; padding: 2px 8px; border-radius: 3px; font-weight: bold;';
      default:
        return '';
    }
  }

  /**
   * Reportar error a servicio externo (placeholder)
   */
  reportError(errorContext) {
    // TODO: Integrar con Sentry, LogRocket, o servicio propio
    logger.debug('[ErrorBoundary] Reporting error:', errorContext);
  }

  /**
   * Método manual para capturar errores en try-catch
   */
  captureError(error, context = {}) {
    this.handleError({
      type: 'captured_error',
      message: error.message,
      error: error,
      ...context
    });
  }

  /**
   * Obtener historial de errores
   */
  getErrorLog() {
    return this.errorLog;
  }

  /**
   * Obtener estadísticas de errores
   */
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      fatal: 0,
      recoverable: 0,
      minor: 0,
      byType: {},
      last24Hours: 0
    };

    const last24h = Date.now() - (24 * 60 * 60 * 1000);

    this.errorLog.forEach(error => {
      // Por categoría
      stats[error.category]++;

      // Por tipo
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;

      // Últimas 24 horas
      if (new Date(error.timestamp).getTime() > last24h) {
        stats.last24Hours++;
      }
    });

    return stats;
  }

  /**
   * Limpiar errores antiguos
   */
  clearOldErrors(hoursOld = 24) {
    const cutoff = Date.now() - (hoursOld * 60 * 60 * 1000);
    this.errorLog = this.errorLog.filter(error =>
      new Date(error.timestamp).getTime() > cutoff
    );
  }

  /**
   * Obtener info de debug
   */
  getDebugInfo() {
    return {
      config: this.config,
      fatalErrorOccurred: this.fatalErrorOccurred,
      recoveryAttempts: Array.from(this.recoveryAttempts.entries()),
      stats: this.getErrorStats(),
      recentErrors: this.errorLog.slice(-10)
    };
  }
}

// Exportar global
window.ErrorBoundary = ErrorBoundary;

// Inicializar automáticamente
window.errorBoundary = new ErrorBoundary({
  enableRecovery: true,
  enableLogging: true,
  enableReporting: false,
  maxRecoveryAttempts: 3,
  showUserFeedback: true
});

logger.debug('[ErrorBoundary] Sistema global de errores inicializado');

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorBoundary;
}
