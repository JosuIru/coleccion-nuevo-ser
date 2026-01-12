/**
 * LOGGER UTILITY
 * Sistema de logging condicional que se desactiva en producción
 *
 * @version 1.0.0
 */

const isDevelopment = __DEV__;

/**
 * Logger - Sistema de logging que respeta el modo de desarrollo
 *
 * En desarrollo: muestra logs completos
 * En producción: solo muestra errores críticos
 */
const logger = {
  /**
   * Log de información general
   */
  info: (tag, message, data = null) => {
    if (isDevelopment) {
      console.log(`[${tag}] ${message}`, data || '');
    }
  },

  /**
   * Log de warnings
   */
  warn: (tag, message, data = null) => {
    if (isDevelopment) {
      console.warn(`⚠️ [${tag}] ${message}`, data || '');
    }
  },

  /**
   * Log de errores (siempre se muestra)
   */
  error: (tag, message, error = null) => {
    console.error(`❌ [${tag}] ${message}`, error || '');
  },

  /**
   * Log de debug (solo en desarrollo)
   */
  debug: (tag, message, data = null) => {
    if (isDevelopment && typeof global.LOG_DEBUG !== 'undefined') {
      console.log(`🐛 [${tag}] ${message}`, data || '');
    }
  },

  /**
   * Log de éxito (solo en desarrollo)
   */
  success: (tag, message, data = null) => {
    if (isDevelopment) {
      console.log(`✅ [${tag}] ${message}`, data || '');
    }
  },

  /**
   * Log de inicio de proceso
   */
  start: (tag, message) => {
    if (isDevelopment) {
      console.log(`🚀 [${tag}] ${message}`);
    }
  },

  /**
   * Log de finalización de proceso
   */
  end: (tag, message, duration = null) => {
    if (isDevelopment) {
      const durationStr = duration ? ` (${duration}ms)` : '';
      console.log(`✓ [${tag}] ${message}${durationStr}`);
    }
  },

  /**
   * Log de network request
   */
  network: (tag, method, url, status = null) => {
    if (isDevelopment) {
      const statusStr = status ? ` → ${status}` : '';
      console.log(`📡 [${tag}] ${method} ${url}${statusStr}`);
    }
  },

  /**
   * Log de performance
   */
  performance: (tag, metric, value, unit = 'ms') => {
    if (isDevelopment) {
      console.log(`⏱️ [${tag}] ${metric}: ${value}${unit}`);
    }
  },

  /**
   * Log de memory
   */
  memory: (tag, message) => {
    if (isDevelopment && global.MemoryWarning) {
      console.warn(`💾 [${tag}] ${message}`);
    }
  }
};

export { logger };
export default logger;
