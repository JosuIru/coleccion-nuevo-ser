/**
 * Audio Cache Manager
 * Sistema de caché persistente para audios generados con ElevenLabs
 *
 * Guarda audios en carpeta "AudioLibros" accesible desde el dispositivo
 * Permite escuchar offline y descargar capítulos completos
 *
 * @version 2.0.0
 */

class AudioCacheManager {
  constructor() {
    this.dbName = 'AudioCacheDB';
    this.storeName = 'audioCache';
    this.db = null;
    this.maxCacheSizeMB = 500; // Límite de caché en MB
    this.baseDir = 'AudioLibros'; // Carpeta pública accesible

    // Detectar plataforma
    this.isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
    this.Filesystem = this.isNative ? Capacitor.Plugins.Filesystem : null;

    // Directorio base: DOCUMENTS para acceso público en Android
    this.directory = this.isNative ? 'DOCUMENTS' : 'DATA';

    this.init();
  }

  /**
   * Inicializa el sistema de caché
   */
  async init() {
    try {
      if (this.isNative) {
        // Crear directorio de caché en Android
        await this.ensureCacheDirectory();
      }

      // Inicializar IndexedDB (para metadatos y web)
      await this.initIndexedDB();

      console.log('✅ AudioCacheManager inicializado');
    } catch (error) {
      console.error('❌ Error inicializando AudioCacheManager:', error);
    }
  }

  /**
   * Crea el directorio base de AudioLibros
   */
  async ensureCacheDirectory() {
    if (!this.Filesystem) return;

    try {
      await this.Filesystem.mkdir({
        path: this.baseDir,
        directory: this.directory,
        recursive: true
      });
      console.log(`📁 Directorio AudioLibros creado/verificado`);
    } catch (e) {
      // El directorio ya existe, ignorar
    }
  }

  /**
   * Crea el directorio para un libro específico
   */
  async ensureBookDirectory(bookId) {
    if (!this.Filesystem || !bookId) return;

    const bookDir = `${this.baseDir}/${this.sanitizeFileName(bookId)}`;
    try {
      await this.Filesystem.mkdir({
        path: bookDir,
        directory: this.directory,
        recursive: true
      });
    } catch (e) {
      // El directorio ya existe
    }
    return bookDir;
  }

  /**
   * Sanitiza nombre de archivo (quita caracteres especiales)
   */
  sanitizeFileName(name) {
    if (!name) return 'unknown';
    return name
      .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\-_]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 50);
  }

  /**
   * Genera nombre de archivo legible
   */
  generateFileName(metadata) {
    const { bookId, chapterId, paragraphIndex } = metadata;
    const bookName = this.sanitizeFileName(bookId || 'libro');
    const chapterName = this.sanitizeFileName(chapterId || 'capitulo');
    const paragraph = paragraphIndex !== undefined ? `_p${String(paragraphIndex).padStart(3, '0')}` : '';
    return `${chapterName}${paragraph}.mp3`;
  }

  /**
   * Obtiene la ruta completa de un archivo de audio
   */
  getAudioPath(metadata) {
    const bookDir = this.sanitizeFileName(metadata.bookId || 'general');
    const fileName = this.generateFileName(metadata);
    return `${this.baseDir}/${bookDir}/${fileName}`;
  }

  /**
   * Inicializa IndexedDB
   */
  initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'cacheKey' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('bookId', 'bookId', { unique: false });
          store.createIndex('chapterId', 'chapterId', { unique: false });
        }
      };
    });
  }

  /**
   * Genera una clave de caché única basada en el contenido
   */
  generateCacheKey(text, voiceId, stability, similarity, model) {
    const data = `${text}|${voiceId}|${stability}|${similarity}|${model}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `el_${Math.abs(hash)}`;
  }

  /**
   * Verifica si existe audio en caché
   */
  async has(cacheKey) {
    try {
      const metadata = await this.getMetadata(cacheKey);
      if (!metadata) return false;

      // Verificar que el archivo existe
      if (this.isNative) {
        try {
          const filePath = metadata.filePath || this.getAudioPath(metadata);
          await this.Filesystem.stat({
            path: filePath,
            directory: this.directory
          });
          return true;
        } catch {
          // Archivo no existe, limpiar metadata
          await this.deleteMetadata(cacheKey);
          return false;
        }
      } else {
        // En web, el audio está en metadata.audioBlob
        return !!metadata.audioBlob;
      }
    } catch {
      return false;
    }
  }

  /**
   * Obtiene audio del caché
   * @returns {string|null} URL del audio o null si no existe
   */
  async get(cacheKey) {
    try {
      const metadata = await this.getMetadata(cacheKey);
      if (!metadata) return null;

      if (this.isNative) {
        // Leer archivo de Filesystem
        const filePath = metadata.filePath || this.getAudioPath(metadata);
        const result = await this.Filesystem.readFile({
          path: filePath,
          directory: this.directory
        });

        // Convertir base64 a blob URL
        const blob = this.base64ToBlob(result.data, 'audio/mpeg');
        return URL.createObjectURL(blob);
      } else {
        // En web, usar blob guardado en IndexedDB
        if (metadata.audioBlob) {
          return URL.createObjectURL(metadata.audioBlob);
        }
      }

      return null;
    } catch (error) {
      console.error('Error obteniendo audio de caché:', error);
      return null;
    }
  }

  /**
   * Obtiene la ruta del archivo en el dispositivo (para compartir/abrir)
   */
  async getFilePath(cacheKey) {
    try {
      const metadata = await this.getMetadata(cacheKey);
      if (!metadata || !this.isNative) return null;

      const filePath = metadata.filePath || this.getAudioPath(metadata);
      const result = await this.Filesystem.getUri({
        path: filePath,
        directory: this.directory
      });
      return result.uri;
    } catch (error) {
      console.error('Error obteniendo ruta de archivo:', error);
      return null;
    }
  }

  /**
   * Guarda audio en caché
   */
  async set(cacheKey, audioBlob, metadata = {}) {
    try {
      const { bookId, chapterId, paragraphIndex, textLength, voiceId } = metadata;

      if (this.isNative) {
        // Asegurar que existe el directorio del libro
        await this.ensureBookDirectory(bookId);

        // Generar ruta del archivo
        const filePath = this.getAudioPath(metadata);

        // Convertir blob a base64 y guardar en Filesystem
        const base64 = await this.blobToBase64(audioBlob);

        await this.Filesystem.writeFile({
          path: filePath,
          data: base64,
          directory: this.directory
        });

        // Guardar metadata en IndexedDB (con ruta del archivo)
        await this.saveMetadata({
          cacheKey,
          bookId,
          chapterId,
          paragraphIndex,
          textLength,
          voiceId,
          filePath,
          fileSize: audioBlob.size,
          createdAt: Date.now()
        });

        console.log(`💾 Audio guardado: ${filePath} (${(audioBlob.size / 1024).toFixed(1)} KB)`);
      } else {
        // En web, guardar blob directamente en IndexedDB
        await this.saveMetadata({
          cacheKey,
          bookId,
          chapterId,
          paragraphIndex,
          textLength,
          voiceId,
          fileSize: audioBlob.size,
          audioBlob: audioBlob,
          createdAt: Date.now()
        });
        console.log(`💾 Audio cacheado en IndexedDB: ${cacheKey} (${(audioBlob.size / 1024).toFixed(1)} KB)`);
      }

      // Verificar límite de caché
      await this.enforceStorageLimit();

      return true;
    } catch (error) {
      console.error('Error guardando audio en caché:', error);
      return false;
    }
  }

  /**
   * Guarda metadata en IndexedDB
   */
  saveMetadata(data) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB no inicializado'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene metadata de IndexedDB
   */
  getMetadata(cacheKey) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(cacheKey);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Elimina metadata de IndexedDB
   */
  deleteMetadata(cacheKey) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(cacheKey);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene todos los items del caché
   */
  getAllMetadata() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve([]);
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Calcula el tamaño total del caché
   */
  async getCacheSize() {
    try {
      const items = await this.getAllMetadata();
      const totalBytes = items.reduce((sum, item) => sum + (item.fileSize || 0), 0);
      return {
        bytes: totalBytes,
        megabytes: (totalBytes / (1024 * 1024)).toFixed(2),
        itemCount: items.length
      };
    } catch {
      return { bytes: 0, megabytes: '0', itemCount: 0 };
    }
  }

  /**
   * Obtiene estadísticas del caché por libro
   */
  async getCacheStats() {
    try {
      const items = await this.getAllMetadata();
      const stats = {
        total: { count: 0, size: 0 },
        byBook: {}
      };

      items.forEach(item => {
        stats.total.count++;
        stats.total.size += item.fileSize || 0;

        if (item.bookId) {
          if (!stats.byBook[item.bookId]) {
            stats.byBook[item.bookId] = { count: 0, size: 0 };
          }
          stats.byBook[item.bookId].count++;
          stats.byBook[item.bookId].size += item.fileSize || 0;
        }
      });

      return stats;
    } catch {
      return { total: { count: 0, size: 0 }, byBook: {} };
    }
  }

  /**
   * Elimina un item del caché
   */
  async delete(cacheKey) {
    try {
      // Obtener metadata para saber la ruta del archivo
      const metadata = await this.getMetadata(cacheKey);

      // Eliminar archivo si es nativo
      if (this.isNative && metadata) {
        try {
          const filePath = metadata.filePath || this.getAudioPath(metadata);
          await this.Filesystem.deleteFile({
            path: filePath,
            directory: this.directory
          });
        } catch {
          // Archivo no existe, ignorar
        }
      }

      // Eliminar metadata
      await this.deleteMetadata(cacheKey);

      return true;
    } catch (error) {
      console.error('Error eliminando de caché:', error);
      return false;
    }
  }

  /**
   * Limpia todo el caché
   */
  async clearAll() {
    try {
      const items = await this.getAllMetadata();

      // Eliminar archivos
      if (this.isNative) {
        for (const item of items) {
          try {
            const filePath = item.filePath || this.getAudioPath(item);
            await this.Filesystem.deleteFile({
              path: filePath,
              directory: this.directory
            });
          } catch {
            // Ignorar errores individuales
          }
        }

        // Intentar eliminar directorios vacíos
        try {
          await this.Filesystem.rmdir({
            path: this.baseDir,
            directory: this.directory,
            recursive: true
          });
          // Recrear directorio base
          await this.ensureCacheDirectory();
        } catch {
          // Ignorar si no se puede eliminar
        }
      }

      // Limpiar IndexedDB
      return new Promise((resolve, reject) => {
        if (!this.db) {
          resolve();
          return;
        }

        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => {
          console.log('🗑️ Caché de AudioLibros limpiado');
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error limpiando caché:', error);
    }
  }

  /**
   * Limpia caché de un libro específico
   */
  async clearBook(bookId) {
    try {
      const items = await this.getAllMetadata();
      const bookItems = items.filter(item => item.bookId === bookId);

      for (const item of bookItems) {
        await this.delete(item.cacheKey);
      }

      console.log(`🗑️ Caché limpiado para libro: ${bookId} (${bookItems.length} items)`);
      return bookItems.length;
    } catch (error) {
      console.error('Error limpiando caché de libro:', error);
      return 0;
    }
  }

  /**
   * Aplica límite de almacenamiento (elimina los más antiguos)
   */
  async enforceStorageLimit() {
    try {
      const { bytes } = await this.getCacheSize();
      const maxBytes = this.maxCacheSizeMB * 1024 * 1024;

      if (bytes > maxBytes) {
        console.log(`⚠️ Caché excede límite (${(bytes / 1024 / 1024).toFixed(1)}MB > ${this.maxCacheSizeMB}MB)`);

        // Obtener items ordenados por fecha (más antiguos primero)
        const items = await this.getAllMetadata();
        items.sort((a, b) => a.createdAt - b.createdAt);

        let currentSize = bytes;
        const targetSize = maxBytes * 0.8; // Reducir al 80%

        for (const item of items) {
          if (currentSize <= targetSize) break;

          await this.delete(item.cacheKey);
          currentSize -= item.fileSize || 0;
          console.log(`🗑️ Eliminado del caché: ${item.cacheKey}`);
        }
      }
    } catch (error) {
      console.error('Error aplicando límite de caché:', error);
    }
  }

  /**
   * Convierte Blob a Base64
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convierte Base64 a Blob
   */
  base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Obtiene la ubicación de la carpeta AudioLibros
   */
  async getAudioLibrosPath() {
    if (!this.isNative) {
      return 'Almacenamiento del navegador (IndexedDB)';
    }

    try {
      const result = await this.Filesystem.getUri({
        path: this.baseDir,
        directory: this.directory
      });
      return result.uri;
    } catch {
      return 'Documentos/AudioLibros';
    }
  }

  /**
   * Lista todos los libros que tienen audios descargados
   */
  async getDownloadedBooks() {
    try {
      const items = await this.getAllMetadata();
      const books = {};

      items.forEach(item => {
        if (item.bookId) {
          if (!books[item.bookId]) {
            books[item.bookId] = {
              bookId: item.bookId,
              chapters: new Set(),
              totalFiles: 0,
              totalSize: 0
            };
          }
          books[item.bookId].totalFiles++;
          books[item.bookId].totalSize += item.fileSize || 0;
          if (item.chapterId) {
            books[item.bookId].chapters.add(item.chapterId);
          }
        }
      });

      // Convertir Set a array
      return Object.values(books).map(book => ({
        ...book,
        chapters: Array.from(book.chapters),
        chapterCount: book.chapters.size
      }));
    } catch (error) {
      console.error('Error listando libros descargados:', error);
      return [];
    }
  }

  /**
   * Obtiene audios de un capítulo específico
   */
  async getChapterAudios(bookId, chapterId) {
    try {
      const items = await this.getAllMetadata();
      return items
        .filter(item => item.bookId === bookId && item.chapterId === chapterId)
        .sort((a, b) => (a.paragraphIndex || 0) - (b.paragraphIndex || 0));
    } catch (error) {
      console.error('Error obteniendo audios del capítulo:', error);
      return [];
    }
  }

  /**
   * Verifica si un capítulo está completamente descargado
   */
  async isChapterDownloaded(bookId, chapterId, totalParagraphs) {
    const audios = await this.getChapterAudios(bookId, chapterId);
    return audios.length >= totalParagraphs;
  }
}

// Crear instancia global
window.audioCacheManager = new AudioCacheManager();

console.log('✅ AudioCacheManager v2.0 loaded - Audios en carpeta AudioLibros');
