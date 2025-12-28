/**
 * SafeStorage - Wrapper seguro para localStorage
 *
 * 🔧 FIX v2.9.199: localStorage error handling - quota exceeded protection
 *
 * Proporciona operaciones seguras de localStorage con:
 * - Try-catch automático para QuotaExceededError
 * - Manejo de modo incógnito/privado
 * - Fallbacks seguros para JSON.parse
 * - Logging consistente de errores
 * - Estrategia de limpieza automática para quota exceeded
 *
 * @example
 * import { safeStorage } from './utils/safe-storage.js';
 *
 * // Guardar dato
 * safeStorage.setItem('key', 'value');
 * safeStorage.setItem('json-key', { data: 'object' });
 *
 * // Obtener dato
 * const value = safeStorage.getItem('key');
 * const jsonData = safeStorage.getItem('json-key', { default: 'fallback' });
 */

class SafeStorage {
  constructor() {
    this.isAvailable = this.checkAvailability();
    this.logger = window.logger || console;
  }

  /**
   * Verifica si localStorage está disponible
   * (puede no estarlo en modo incógnito o si está bloqueado)
   */
  checkAvailability() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      this.logger.warn('[SafeStorage] localStorage no disponible:', error.message);
      return false;
    }
  }

  /**
   * Guarda un ítem en localStorage de forma segura
   *
   * @param {string} key - Clave del ítem
   * @param {*} value - Valor a guardar (se serializa automáticamente si es objeto)
   * @param {object} options - Opciones adicionales
   * @param {boolean} options.silent - No mostrar toast de error (default: false)
   * @param {boolean} options.autoCleanOnQuota - Limpiar datos antiguos si quota excedida (default: true)
   * @returns {boolean} - true si se guardó exitosamente
   */
  setItem(key, value, options = {}) {
    const { silent = false, autoCleanOnQuota = true } = options;

    if (!this.isAvailable) {
      if (!silent) {
        this.logger.warn('[SafeStorage] localStorage no disponible, no se pudo guardar:', key);
      }
      return false;
    }

    try {
      // Serializar automáticamente si no es string
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        this.logger.warn('[SafeStorage] localStorage quota exceeded para key:', key);

        if (!silent) {
          window.toast?.warn('Almacenamiento lleno. Limpiando datos antiguos...');
        }

        // Estrategia de limpieza automática
        if (autoCleanOnQuota) {
          this.cleanOldData();

          // Reintentar después de limpiar
          try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, stringValue);

            if (!silent) {
              window.toast?.success('Datos guardados tras limpieza.');
            }
            return true;
          } catch (retryError) {
            this.logger.error('[SafeStorage] Error tras limpieza:', retryError);
            if (!silent) {
              window.toast?.error('No se pudo guardar. Libera espacio manualmente.');
            }
            return false;
          }
        }
      } else {
        this.logger.error('[SafeStorage] Error guardando en localStorage:', error);
        if (!silent) {
          window.toast?.error('Error al guardar configuración.');
        }
      }
      return false;
    }
  }

  /**
   * Obtiene un ítem de localStorage de forma segura
   *
   * @param {string} key - Clave del ítem
   * @param {*} defaultValue - Valor por defecto si no existe o hay error
   * @param {object} options - Opciones adicionales
   * @param {boolean} options.parse - Intentar parsear como JSON (default: auto-detecta)
   * @returns {*} - Valor obtenido o defaultValue
   */
  getItem(key, defaultValue = null, options = {}) {
    const { parse = 'auto' } = options;

    if (!this.isAvailable) {
      return defaultValue;
    }

    try {
      const raw = localStorage.getItem(key);

      if (raw === null) {
        return defaultValue;
      }

      // Auto-detectar si es JSON
      if (parse === 'auto') {
        if (raw.startsWith('{') || raw.startsWith('[')) {
          try {
            return JSON.parse(raw);
          } catch {
            // Si falla el parse, devolver raw string
            return raw;
          }
        }
        return raw;
      }

      // Parse explícito
      if (parse === true) {
        try {
          return JSON.parse(raw);
        } catch (error) {
          this.logger.warn('[SafeStorage] Error parseando JSON para key:', key, error);
          return defaultValue;
        }
      }

      // No parsear
      return raw;
    } catch (error) {
      this.logger.error('[SafeStorage] Error leyendo de localStorage:', error);
      return defaultValue;
    }
  }

  /**
   * Elimina un ítem de localStorage de forma segura
   */
  removeItem(key) {
    if (!this.isAvailable) return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      this.logger.error('[SafeStorage] Error eliminando de localStorage:', error);
      return false;
    }
  }

  /**
   * Limpia datos antiguos de localStorage
   * Estrategia: eliminar entradas que empiecen con prefijos temporales o de caché
   */
  cleanOldData() {
    if (!this.isAvailable) return;

    try {
      const keysToClean = [
        'ai_cache_',       // Caché de AI
        'tts-audio-cache-', // Caché de audio TTS
        'temp_',           // Datos temporales
        'cache_'           // Otros cachés
      ];

      let removedCount = 0;
      const keysToRemove = [];

      // Identificar claves a eliminar
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && keysToClean.some(prefix => key.startsWith(prefix))) {
          keysToRemove.push(key);
        }
      }

      // Eliminar claves identificadas
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          removedCount++;
        } catch (error) {
          this.logger.warn('[SafeStorage] Error eliminando key:', key, error);
        }
      });

      this.logger.info(`[SafeStorage] Limpieza completada: ${removedCount} entradas eliminadas`);

      // Si no se eliminó nada, intentar limpiar entradas muy antiguas
      if (removedCount === 0) {
        this.cleanOldestEntries(10);
      }
    } catch (error) {
      this.logger.error('[SafeStorage] Error en limpieza de datos:', error);
    }
  }

  /**
   * Elimina las N entradas más antiguas basándose en timestamps
   */
  cleanOldestEntries(count = 10) {
    try {
      const entries = [];

      // Recolectar todas las entradas con timestamp
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        try {
          const value = localStorage.getItem(key);
          const parsed = JSON.parse(value);

          // Si tiene timestamp, agregarlo a la lista
          if (parsed && (parsed.timestamp || parsed.created || parsed.lastModified)) {
            const timestamp = parsed.timestamp || parsed.created || parsed.lastModified;
            entries.push({ key, timestamp });
          }
        } catch {
          // Ignorar entradas que no son JSON
        }
      }

      // Ordenar por timestamp (más antiguo primero)
      entries.sort((a, b) => a.timestamp - b.timestamp);

      // Eliminar las N más antiguas
      const toRemove = entries.slice(0, count);
      toRemove.forEach(entry => {
        try {
          localStorage.removeItem(entry.key);
        } catch (error) {
          this.logger.warn('[SafeStorage] Error eliminando entrada antigua:', entry.key, error);
        }
      });

      this.logger.info(`[SafeStorage] ${toRemove.length} entradas antiguas eliminadas`);
    } catch (error) {
      this.logger.error('[SafeStorage] Error limpiando entradas antiguas:', error);
    }
  }

  /**
   * Obtiene información del uso de localStorage
   */
  getStorageInfo() {
    if (!this.isAvailable) {
      return {
        available: false,
        totalSize: 0,
        itemCount: 0,
        largestKeys: []
      };
    }

    try {
      let totalSize = 0;
      const itemSizes = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          const size = (key.length + (value?.length || 0)) * 2; // aproximado en bytes (UTF-16)
          totalSize += size;
          itemSizes.push({ key, size });
        }
      }

      // Ordenar por tamaño (mayor primero)
      itemSizes.sort((a, b) => b.size - a.size);

      return {
        available: true,
        totalSize,
        itemCount: localStorage.length,
        largestKeys: itemSizes.slice(0, 10) // Top 10 más grandes
      };
    } catch (error) {
      this.logger.error('[SafeStorage] Error obteniendo info de storage:', error);
      return {
        available: false,
        totalSize: 0,
        itemCount: 0,
        largestKeys: [],
        error: error.message
      };
    }
  }

  /**
   * Limpia todo localStorage (usar con precaución)
   */
  clear() {
    if (!this.isAvailable) return false;

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      this.logger.error('[SafeStorage] Error limpiando localStorage:', error);
      return false;
    }
  }
}

// Exportar instancia singleton
export const safeStorage = new SafeStorage();

// También exportar como global para compatibilidad con código existente
if (typeof window !== 'undefined') {
  window.safeStorage = safeStorage;
}

export default safeStorage;
