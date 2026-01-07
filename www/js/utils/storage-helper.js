/**
 * STORAGE HELPER - Wrapper seguro para localStorage
 * ===================================================
 * Maneja automáticamente errores de cuota, modo privado y JSON parsing
 *
 * @version 1.0.0
 */

class StorageHelper {
  /**
   * Obtener valor de localStorage con manejo de errores
   * @param {string} key - Clave del item
   * @param {*} defaultValue - Valor por defecto si falla o no existe
   * @returns {*} Valor parseado o defaultValue
   */
  static get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;

      // Intentar parsear como JSON
      try {
        return JSON.parse(value);
      } catch {
        // Si no es JSON válido, devolver como string
        return value;
      }
    } catch (error) {
      if (typeof logger !== 'undefined') {
        logger.warn(`[StorageHelper] Error reading ${key}:`, error.message);
      }
      return defaultValue;
    }
  }

  /**
   * Guardar valor en localStorage con manejo de errores
   * @param {string} key - Clave del item
   * @param {*} value - Valor a guardar (se serializará automáticamente)
   * @param {boolean} showErrorToast - Mostrar toast si falla
   * @returns {boolean} true si se guardó exitosamente
   */
  static set(key, value, showErrorToast = false) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      // QuotaExceededError - localStorage lleno
      if (error.name === 'QuotaExceededError') {
        logger.error(`[StorageHelper] Quota exceeded for ${key}`);
        if (showErrorToast && window.toast) {
          window.toast.error('Espacio de almacenamiento lleno. Limpia datos antiguos.');
        }
      } else {
        logger.error(`[StorageHelper] Error saving ${key}:`, error);
        if (showErrorToast && window.toast) {
          window.toast.error('Error al guardar datos');
        }
      }
      return false;
    }
  }

  /**
   * Eliminar valor de localStorage
   * @param {string} key - Clave del item
   * @returns {boolean} true si se eliminó exitosamente
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      logger.error(`[StorageHelper] Error removing ${key}:`, error);
      return false;
    }
  }

  /**
   * Verificar si existe una clave
   * @param {string} key - Clave a verificar
   * @returns {boolean}
   */
  static has(key) {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Limpiar todas las claves que coincidan con un prefijo
   * @param {string} prefix - Prefijo de las claves a eliminar
   * @returns {number} Cantidad de claves eliminadas
   */
  static clearByPrefix(prefix) {
    try {
      const keys = Object.keys(localStorage);
      let removed = 0;

      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key);
          removed++;
        }
      });

      return removed;
    } catch (error) {
      logger.error('[StorageHelper] Error clearing by prefix:', error);
      return 0;
    }
  }

  /**
   * Obtener tamaño aproximado usado por localStorage (en bytes)
   * @returns {number} Tamaño en bytes
   */
  static getSize() {
    try {
      let size = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          size += localStorage[key].length + key.length;
        }
      }
      return size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Obtener tamaño en formato legible
   * @returns {string} Tamaño formateado (ej: "2.5 MB")
   */
  static getSizeFormatted() {
    const bytes = this.getSize();
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /**
   * Obtener todas las claves con un prefijo
   * @param {string} prefix - Prefijo a buscar
   * @returns {string[]} Array de claves
   */
  static getKeysByPrefix(prefix) {
    try {
      const keys = Object.keys(localStorage);
      return keys.filter(key => key.startsWith(prefix));
    } catch (error) {
      return [];
    }
  }

  /**
   * Verificar si localStorage está disponible
   * @returns {boolean}
   */
  static isAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtener estadísticas de uso
   * @returns {Object} Objeto con estadísticas
   */
  static getStats() {
    return {
      available: this.isAvailable(),
      size: this.getSize(),
      sizeFormatted: this.getSizeFormatted(),
      itemCount: Object.keys(localStorage).length,
      quotaExceeded: false
    };
  }
}

// Exportar globalmente
window.StorageHelper = StorageHelper;

// Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageHelper;
}
