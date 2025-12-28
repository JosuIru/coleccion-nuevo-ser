// ============================================================================
// AUDIOREADER BOOKMARKS - Módulo de marcadores de audio
// ============================================================================
// Extraído de audioreader.js para modularización
// v2.9.234: First modular extraction

/**
 * Maneja los marcadores (bookmarks) de posición en el audio
 * @class
 */
class AudioReaderBookmarks {
  constructor(audioReader) {
    this.audioReader = audioReader;
    this.bookmarks = this.load();
  }

  /**
   * Cargar bookmarks desde localStorage
   * @returns {Object} Objeto con todos los bookmarks
   */
  load() {
    try {
      const savedData = localStorage.getItem('audio-bookmarks');
      return savedData ? JSON.parse(savedData) : {};
    } catch (error) {
      console.error('[Bookmarks] Error cargando:', error);
      return {};
    }
  }

  /**
   * Guardar bookmarks en localStorage
   */
  save() {
    try {
      localStorage.setItem('audio-bookmarks', JSON.stringify(this.bookmarks));
    } catch (error) {
      console.error('[Bookmarks] Error guardando:', error);
    }
  }

  /**
   * Generar clave única para bookmark
   * @param {string} bookId - ID del libro
   * @param {string} chapterId - ID del capítulo
   * @returns {string} Clave única
   */
  generateKey(bookId, chapterId) {
    return `bookmark:${bookId}:${chapterId}`;
  }

  /**
   * Agregar un nuevo bookmark
   * @param {string} name - Nombre opcional del bookmark
   * @returns {Promise<boolean>} Éxito de la operación
   */
  async add(name = null) {
    const bookEngine = this.audioReader.bookEngine;
    const bookId = bookEngine?.currentBook;
    const chapterId = bookEngine?.currentChapter?.id;

    if (!bookId || !chapterId) {
      window.toast?.error('No hay capitulo activo');
      return false;
    }

    const key = this.generateKey(bookId, chapterId);

    if (!this.bookmarks[key]) {
      this.bookmarks[key] = [];
    }

    const bookmarkName = name || `Parrafo ${this.audioReader.currentParagraphIndex + 1}`;

    this.bookmarks[key].push({
      nombre: bookmarkName,
      paragrafo: this.audioReader.currentParagraphIndex,
      timestamp: Date.now(),
      tituloCapitulo: bookEngine.currentChapter?.title || 'Sin titulo'
    });

    this.save();

    // Re-renderizar controles si el método existe
    if (this.audioReader.renderControls) {
      await this.audioReader.renderControls();
      this.audioReader.attachControlListeners?.();
    }

    window.toast?.success(`Bookmark guardado: ${bookmarkName}`);
    return true;
  }

  /**
   * Obtener bookmarks del capítulo actual
   * @returns {Array} Lista de bookmarks
   */
  getForCurrentChapter() {
    const bookEngine = this.audioReader.bookEngine;
    const bookId = bookEngine?.currentBook;
    const chapterId = bookEngine?.currentChapter?.id;

    if (!bookId || !chapterId) return [];

    const key = this.generateKey(bookId, chapterId);
    return this.bookmarks[key] || [];
  }

  /**
   * Saltar a un bookmark específico
   * @param {number} index - Índice del bookmark
   */
  jumpTo(index) {
    const bookmarks = this.getForCurrentChapter();
    if (index < 0 || index >= bookmarks.length) return;

    const bookmark = bookmarks[index];
    const wasPlaying = this.audioReader.isPlaying;

    // Detener reproducción actual
    if (this.audioReader.nativeTTS) {
      this.audioReader.nativeTTS.stop().catch(() => {});
    } else if (this.audioReader.synthesis) {
      this.audioReader.synthesis.cancel();
    }

    // Actualizar posición
    this.audioReader.currentParagraphIndex = bookmark.paragrafo;

    // Reanudar si estaba reproduciendo
    if (wasPlaying) {
      this.audioReader.isPaused = false;
      this.audioReader.speakParagraph?.(this.audioReader.currentParagraphIndex);
    } else {
      this.audioReader.updateUI?.();
      this.audioReader.highlightParagraph?.(this.audioReader.currentParagraphIndex);
    }

    window.toast?.success(`Saltando a: ${bookmark.nombre}`);
  }

  /**
   * Eliminar un bookmark
   * @param {number} index - Índice del bookmark a eliminar
   * @returns {Promise<boolean>} Éxito de la operación
   */
  async delete(index) {
    const bookEngine = this.audioReader.bookEngine;
    const bookId = bookEngine?.currentBook;
    const chapterId = bookEngine?.currentChapter?.id;

    if (!bookId || !chapterId) return false;

    const key = this.generateKey(bookId, chapterId);
    const bookmarksList = this.bookmarks[key];

    if (!bookmarksList || index < 0 || index >= bookmarksList.length) return false;

    bookmarksList.splice(index, 1);

    if (bookmarksList.length === 0) {
      delete this.bookmarks[key];
    }

    this.save();

    // Re-renderizar controles si el método existe
    if (this.audioReader.renderControls) {
      await this.audioReader.renderControls();
      this.audioReader.attachControlListeners?.();
    }

    window.toast?.info('Bookmark eliminado');
    return true;
  }

  /**
   * Obtener todos los bookmarks de un libro
   * @param {string} bookId - ID del libro
   * @returns {Array} Lista de bookmarks con metadata
   */
  getAllForBook(bookId) {
    const results = [];

    for (const [key, bookmarks] of Object.entries(this.bookmarks)) {
      if (key.startsWith(`bookmark:${bookId}:`)) {
        const chapterId = key.split(':')[2];
        bookmarks.forEach((bookmark, index) => {
          results.push({
            ...bookmark,
            chapterId,
            index
          });
        });
      }
    }

    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Limpiar todos los bookmarks de un capítulo
   * @param {string} bookId - ID del libro
   * @param {string} chapterId - ID del capítulo
   */
  clearChapter(bookId, chapterId) {
    const key = this.generateKey(bookId, chapterId);
    delete this.bookmarks[key];
    this.save();
  }

  /**
   * Destruir el módulo y limpiar recursos
   */
  destroy() {
    this.audioReader = null;
    this.bookmarks = {};
  }
}

// Exportar globalmente
window.AudioReaderBookmarks = AudioReaderBookmarks;
