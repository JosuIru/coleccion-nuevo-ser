// ============================================================================
// AUDIOREADER POSITION - Módulo de persistencia de posición
// ============================================================================
// Extraído de audioreader.js para modularización
// v2.9.234: First modular extraction

/**
 * Maneja la persistencia de posición de lectura del AudioReader
 * @class
 */
class AudioReaderPosition {
  constructor(audioReader) {
    this.audioReader = audioReader;
    this.storageKey = 'audioreader-last-position';
  }

  /**
   * Guardar posición actual
   */
  save() {
    const bookEngine = this.audioReader.bookEngine;
    const bookId = bookEngine?.currentBook;
    const chapterId = bookEngine?.currentChapter?.id;

    if (!bookId || !chapterId) return;

    const position = {
      libro: bookId,
      capitulo: chapterId,
      paragrafo: this.audioReader.currentParagraphIndex,
      timestamp: Date.now()
    };

    try {
      const storageKey = `audio-position-${bookId}-${chapterId}`;
      localStorage.setItem(this.storageKey, JSON.stringify(position));

      // Sincronizar con Supabase si está disponible
      if (window.authHelper?.user && window.supabaseSyncHelper) {
        window.supabaseSyncHelper.syncPreference(storageKey, position);
      }
    } catch (error) {
      logger.warn('[Position] Error guardando:', error);
    }
  }

  /**
   * Cargar última posición guardada
   * @returns {Object|null} Posición guardada o null
   */
  load() {
    try {
      const savedData = localStorage.getItem(this.storageKey);
      if (!savedData) return null;

      const position = JSON.parse(savedData);
      const bookEngine = this.audioReader.bookEngine;
      const currentBookId = bookEngine?.currentBook;
      const currentChapterId = bookEngine?.currentChapter?.id;

      // Solo retornar si coincide con libro y capítulo actual
      if (position.libro === currentBookId && position.capitulo === currentChapterId) {
        return position;
      }

      return null;
    } catch (error) {
      logger.error('[Position] Error cargando:', error);
      return null;
    }
  }

  /**
   * Continuar desde posición guardada
   * @returns {Promise<boolean>} true si se continuó desde posición guardada
   */
  async continueFromSaved() {
    const savedPosition = this.load();

    if (savedPosition && savedPosition.paragrafo > 0) {
      this.audioReader.currentParagraphIndex = savedPosition.paragrafo;
      this.audioReader.highlightParagraph?.(this.audioReader.currentParagraphIndex);
      await this.audioReader.updateUI?.();

      window.toast?.info(`Continuando desde parrafo ${savedPosition.paragrafo + 1}`);
      return true;
    }

    return false;
  }

  /**
   * Verificar si hay posición guardada para el capítulo actual
   * @returns {boolean}
   */
  hasSavedPosition() {
    const position = this.load();
    return position !== null && position.paragrafo > 0;
  }

  /**
   * Obtener información de posición guardada
   * @returns {Object|null}
   */
  getSavedPositionInfo() {
    const position = this.load();
    if (!position) return null;

    return {
      paragraph: position.paragrafo,
      total: this.audioReader.paragraphs?.length || 0,
      timestamp: position.timestamp
    };
  }

  /**
   * Limpiar posición guardada del capítulo actual
   */
  clear() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      logger.warn('[Position] Error limpiando:', error);
    }
  }

  /**
   * Destruir el módulo
   */
  destroy() {
    this.audioReader = null;
  }
}

// Exportar globalmente
window.AudioReaderPosition = AudioReaderPosition;
