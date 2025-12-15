/**
 * MEMORY STORAGE
 * Almacenamiento en memoria puro - NO depende de AsyncStorage nativo
 * Soluciona el problema de AsyncStorage siendo null
 *
 * Este sistema almacena datos en la memoria de la aplicación.
 * Los datos se pierden cuando se cierra la app (comportamiento aceptable).
 *
 * @version 1.0.0
 */

class MemoryStorage {
  constructor() {
    this.data = {};
    console.log('[MemoryStorage] Inicializado - Almacenamiento en memoria puro');
  }

  /**
   * Obtener un valor
   */
  async getItem(key) {
    try {
      if (!key) {
        console.warn('[MemoryStorage] getItem: key es null o undefined');
        return null;
      }
      const value = this.data[key] || null;
      console.log(`[MemoryStorage] getItem("${key}") => ${value ? 'found' : 'null'}`);
      return value;
    } catch (error) {
      console.error('[MemoryStorage] getItem error:', error);
      return null;
    }
  }

  /**
   * Guardar un valor
   */
  async setItem(key, value) {
    try {
      if (!key) {
        console.warn('[MemoryStorage] setItem: key es null o undefined');
        return null;
      }
      const strValue = typeof value === 'string' ? value : JSON.stringify(value);
      this.data[key] = strValue;
      console.log(`[MemoryStorage] setItem("${key}") => OK`);
      return null;
    } catch (error) {
      console.error('[MemoryStorage] setItem error:', error);
      return null;
    }
  }

  /**
   * Eliminar un valor
   */
  async removeItem(key) {
    try {
      if (!key) {
        console.warn('[MemoryStorage] removeItem: key es null o undefined');
        return null;
      }
      delete this.data[key];
      console.log(`[MemoryStorage] removeItem("${key}") => OK`);
      return null;
    } catch (error) {
      console.error('[MemoryStorage] removeItem error:', error);
      return null;
    }
  }

  /**
   * Limpiar todo
   */
  async clear() {
    try {
      this.data = {};
      console.log('[MemoryStorage] clear() => OK');
      return null;
    } catch (error) {
      console.error('[MemoryStorage] clear error:', error);
      return null;
    }
  }

  /**
   * Obtener todas las claves
   */
  async getAllKeys() {
    try {
      const keys = Object.keys(this.data);
      console.log('[MemoryStorage] getAllKeys() =>', keys.length, 'keys');
      return keys;
    } catch (error) {
      console.error('[MemoryStorage] getAllKeys error:', error);
      return [];
    }
  }

  /**
   * Obtener múltiples valores
   */
  async multiGet(keys) {
    try {
      return keys.map(key => [key, this.data[key] || null]);
    } catch (error) {
      console.error('[MemoryStorage] multiGet error:', error);
      return keys.map(key => [key, null]);
    }
  }

  /**
   * Guardar múltiples valores
   */
  async multiSet(keyValuePairs) {
    try {
      keyValuePairs.forEach(([key, value]) => {
        const strValue = typeof value === 'string' ? value : JSON.stringify(value);
        this.data[key] = strValue;
      });
      console.log('[MemoryStorage] multiSet() =>', keyValuePairs.length, 'items');
      return null;
    } catch (error) {
      console.error('[MemoryStorage] multiSet error:', error);
      return null;
    }
  }

  /**
   * Eliminar múltiples valores
   */
  async multiRemove(keys) {
    try {
      keys.forEach(key => {
        delete this.data[key];
      });
      console.log('[MemoryStorage] multiRemove() =>', keys.length, 'items');
      return null;
    } catch (error) {
      console.error('[MemoryStorage] multiRemove error:', error);
      return null;
    }
  }

  /**
   * Debug: ver contenido
   */
  debug() {
    console.log('[MemoryStorage] DEBUG - Content:', this.data);
    return this.data;
  }

  /**
   * Debug: ver estadísticas
   */
  stats() {
    const keys = Object.keys(this.data);
    let totalSize = 0;
    keys.forEach(key => {
      totalSize += (this.data[key] ? this.data[key].length : 0);
    });
    console.log(`[MemoryStorage] STATS - ${keys.length} keys, ~${Math.round(totalSize / 1024)}KB`);
    return { keys: keys.length, size: totalSize };
  }
}

// Crear instancia única y exportar
const memoryStorage = new MemoryStorage();
export default memoryStorage;
