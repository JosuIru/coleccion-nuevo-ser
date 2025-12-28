// ============================================================================
// SOUNDSCAPE CACHE - Sistema de descarga y cache offline de soundscapes
// ============================================================================
// Permite descargar soundscapes para uso sin conexión usando IndexedDB

// 🔧 FIX v2.9.198: Migrated console.log to logger
class SoundscapeCache {
  constructor() {
    this.dbName = 'soundscape-cache-db';
    this.dbVersion = 1;
    this.storeName = 'soundscapes';
    this.db = null;
    // 🧹 Tracking de blob URLs para cleanup
    this.blobUrls = new Set();
  }

  // ==========================================================================
  // INICIALIZACIÓN DE BASE DE DATOS
  // ==========================================================================

  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Error abriendo IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        // logger.debug('✅ Soundscape Cache DB inicializada');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Crear object store si no existe
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'name' });
          objectStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });
          objectStore.createIndex('size', 'size', { unique: false });

          // logger.debug('📦 Object store creado:', this.storeName);
        }
      };
    });
  }

  // ==========================================================================
  // DESCARGA DE SOUNDSCAPES
  // ==========================================================================

  async downloadSoundscape(name, url, onProgress) {
    try {
      // Inicializar DB si no está lista
      if (!this.db) {
        await this.initialize();
      }

      // logger.debug(`⬇️ Descargando soundscape: ${name}`);

      // Descargar usando fetch con seguimiento de progreso
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Obtener tamaño total
      const contentLength = response.headers.get('content-length');
      const total = parseInt(contentLength, 10);

      // Leer datos en chunks
      const reader = response.body.getReader();
      const chunks = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // Callback de progreso
        if (onProgress && total) {
          const progress = (receivedLength / total) * 100;
          onProgress(progress, receivedLength, total);
        }
      }

      // Combinar chunks en un solo ArrayBuffer
      const blob = new Blob(chunks);
      const arrayBuffer = await blob.arrayBuffer();

      // Guardar en IndexedDB
      const soundscapeData = {
        name,
        url,
        data: arrayBuffer,
        size: arrayBuffer.byteLength,
        downloadedAt: new Date().toISOString(),
        mimeType: response.headers.get('content-type') || 'audio/mpeg'
      };

      await this.saveSoundscape(soundscapeData);

      // logger.debug(`✅ Soundscape descargado: ${name} (${this.formatBytes(arrayBuffer.byteLength)})`);

      return soundscapeData;
    } catch (error) {
      console.error(`❌ Error descargando soundscape ${name}:`, error);
      throw error;
    }
  }

  async saveSoundscape(soundscapeData) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.put(soundscapeData);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ==========================================================================
  // RECUPERACIÓN DE SOUNDSCAPES
  // ==========================================================================

  async getSoundscape(name) {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.get(name);

      request.onsuccess = () => {
        if (request.result) {
          // logger.debug(`📦 Soundscape recuperado de cache: ${name}`);
        }
        resolve(request.result);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async isCached(name) {
    const soundscape = await this.getSoundscape(name);
    return !!soundscape;
  }

  async getAllSoundscapes() {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ==========================================================================
  // ELIMINACIÓN
  // ==========================================================================

  async deleteSoundscape(name) {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.delete(name);

      request.onsuccess = () => {
        // logger.debug(`🗑️ Soundscape eliminado: ${name}`);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async clearAll() {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.clear();

      request.onsuccess = () => {
        // logger.debug('🗑️ Todos los soundscapes eliminados');
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ==========================================================================
  // INTEGRACIÓN CON AUDIO MIXER
  // ==========================================================================

  async loadFromCacheOrNetwork(name, url) {
    try {
      // Intentar cargar desde cache primero
      const cached = await this.getSoundscape(name);

      if (cached && cached.data) {
        // Crear Blob desde ArrayBuffer
        const blob = new Blob([cached.data], { type: cached.mimeType });
        const blobUrl = URL.createObjectURL(blob);

        // 🧹 Trackear URL para cleanup posterior
        this.blobUrls.add(blobUrl);

        return {
          url: blobUrl,
          source: 'cache',
          data: cached
        };
      }

      // Si no está en cache, devolver URL de red
      // logger.debug(`⚠️ Soundscape no está en cache, usando red: ${name}`);
      return {
        url: url,
        source: 'network',
        data: null
      };
    } catch (error) {
      console.error('Error cargando soundscape:', error);
      return {
        url: url,
        source: 'network',
        data: null
      };
    }
  }

  // ==========================================================================
  // DESCARGA EN LOTE
  // ==========================================================================

  async downloadAll(soundscapesConfig, onProgress, onComplete) {
    const total = Object.keys(soundscapesConfig).length;
    let completed = 0;
    const results = [];

    for (const [name, config] of Object.entries(soundscapesConfig)) {
      try {
        const result = await this.downloadSoundscape(
          name,
          config.url,
          (progress) => {
            // Progreso individual
            if (onProgress) {
              onProgress({
                name,
                progress,
                completed,
                total
              });
            }
          }
        );

        results.push({ name, success: true, data: result });
        completed++;

      } catch (error) {
        console.error(`Error descargando ${name}:`, error);
        results.push({ name, success: false, error: error.message });
        completed++;
      }

      // Callback de progreso general
      if (onProgress) {
        onProgress({
          name,
          progress: 100,
          completed,
          total
        });
      }
    }

    if (onComplete) {
      onComplete(results);
    }

    return results;
  }

  // ==========================================================================
  // ESTADÍSTICAS Y UTILIDADES
  // ==========================================================================

  async getTotalSize() {
    const soundscapes = await this.getAllSoundscapes();
    const totalBytes = soundscapes.reduce((sum, s) => sum + (s.size || 0), 0);
    return totalBytes;
  }

  async getStorageInfo() {
    const soundscapes = await this.getAllSoundscapes();
    const totalSize = await this.getTotalSize();

    return {
      count: soundscapes.length,
      totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      soundscapes: soundscapes.map(s => ({
        name: s.name,
        size: this.formatBytes(s.size),
        downloadedAt: new Date(s.downloadedAt).toLocaleString()
      }))
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  async estimateQuotaUsage() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        usageFormatted: this.formatBytes(estimate.usage),
        quotaFormatted: this.formatBytes(estimate.quota),
        percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
      };
    }
    return null;
  }

  // ==========================================================================
  // LIMPIEZA Y MANTENIMIENTO
  // ==========================================================================

  async cleanOldSoundscapes(maxAgeDays = 30) {
    const soundscapes = await this.getAllSoundscapes();
    const now = new Date();
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    for (const soundscape of soundscapes) {
      const downloadedAt = new Date(soundscape.downloadedAt);
      const age = now - downloadedAt;

      if (age > maxAgeMs) {
        await this.deleteSoundscape(soundscape.name);
        deletedCount++;
      }
    }

    // logger.debug(`🧹 Limpieza completada: ${deletedCount} soundscapes eliminados`);
    return deletedCount;
  }

  // ==========================================================================
  // PREFETCHING INTELIGENTE
  // ==========================================================================

  async prefetchForMode(modeName, soundscapesConfig) {
    // Precargar soundscapes basados en el modo actual
    const modePresets = {
      'MEDITATION': ['rain', 'ocean'],
      'FOCUS': ['cafe', 'rain'],
      'SLEEP': ['ocean', 'river'],
      'ENERGIZE': ['forest'],
      'RELAX': ['river', 'rain']
    };

    const soundscapesToPrefetch = modePresets[modeName] || [];

    for (const name of soundscapesToPrefetch) {
      const isCached = await this.isCached(name);

      if (!isCached && soundscapesConfig[name]) {
        // logger.debug(`🔄 Prefetching soundscape: ${name}`);
        await this.downloadSoundscape(name, soundscapesConfig[name].url);
      }
    }
  }

  // ==========================================================================
  // 🧹 CLEANUP - Liberar memoria de blob URLs
  // ==========================================================================

  cleanupBlobUrls() {
    // Revocar todos los blob URLs creados
    this.blobUrls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.warn('Error revocando blob URL:', e);
      }
    });

    this.blobUrls.clear();
    // logger.debug('🗑️ Blob URLs de soundscape limpiados');
  }
}

// Exportar
window.SoundscapeCache = SoundscapeCache;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoundscapeCache;
}
