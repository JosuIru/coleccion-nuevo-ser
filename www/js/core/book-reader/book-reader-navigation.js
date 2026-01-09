// ============================================================================
// BOOK READER NAVIGATION - Navegacion entre capitulos y libros
// ============================================================================
// v2.9.279: Modularizacion del BookReader
// Navegacion, scroll, compartir capitulos

class BookReaderNavigation {
  constructor(bookReader) {
    this.bookReader = bookReader;
  }

  // ==========================================================================
  // ACCESSORS
  // ==========================================================================

  get bookEngine() {
    return this.bookReader.bookEngine;
  }

  get i18n() {
    return this.bookReader.i18n;
  }

  get currentChapter() {
    return this.bookReader.currentChapter;
  }

  set currentChapter(value) {
    this.bookReader.currentChapter = value;
  }

  get eventManager() {
    return this.bookReader.eventManager;
  }

  // ==========================================================================
  // DEPENDENCY INJECTION
  // ==========================================================================

  getDependency(name) {
    if (window.dependencyInjector) {
      return window.dependencyInjector.getSafe(name);
    }
    return window[name] || null;
  }

  // ==========================================================================
  // TOAST HELPER
  // ==========================================================================

  showToast(type, message) {
    const toast = this.getDependency('toast');
    if (toast && typeof toast[type] === 'function') {
      toast[type](message);
    } else {
      if (typeof logger !== 'undefined') {
        logger.debug(`[Toast ${type.toUpperCase()}]`, message);
      }
    }
  }

  // ==========================================================================
  // ERROR CAPTURE
  // ==========================================================================

  captureError(error, context) {
    const errorBoundary = this.getDependency('errorBoundary');
    if (errorBoundary) {
      errorBoundary.captureError(error, context);
    } else {
      logger.error('[BookReaderNavigation] Error:', error, context);
    }
  }

  // ==========================================================================
  // CHAPTER NAVIGATION
  // ==========================================================================

  /**
   * Navega a un capitulo especifico
   * @param {string} chapterId - ID del capitulo destino
   * @param {boolean} skipAudioStop - Si true, no detiene el AudioReader (para auto-advance)
   */
  navigateToChapter(chapterId, skipAudioStop = false) {
    try {
      if (typeof logger !== 'undefined') {
        logger.debug('[DEBUG] navigateToChapter() llamado con chapterId:', chapterId);
      }

      const chapter = this.bookEngine.navigateToChapter(chapterId);

      if (typeof logger !== 'undefined') {
        logger.debug('[DEBUG] chapter obtenido:', chapter?.id, chapter?.title);
      }

      if (chapter) {
        this.currentChapter = chapter;

        // Detener reproductor al cambiar de capitulo (SALVO si es auto-advance)
        if (!skipAudioStop) {
          const audioReader = this.getDependency('audioReader');
          if (audioReader && (audioReader.isPlaying || audioReader.paragraphs.length > 0)) {
            if (typeof logger !== 'undefined') {
              logger.debug('Deteniendo reproductor al cambiar de capitulo');
            }
            audioReader.stop();
          }
        }

        // Verificar si ya existe la estructura DOM Y esta visible
        // Si no existe O no esta visible, hacer render completo. Si existe, actualizacion parcial.
        const container = document.getElementById('book-reader-view');
        const contentArea = document.querySelector('.chapter-content');
        const isContainerVisible = container && !container.classList.contains('hidden');
        const hasRendered = contentArea !== null && isContainerVisible;

        if (typeof logger !== 'undefined') {
          logger.debug('[DEBUG] hasRendered:', hasRendered, 'isContainerVisible:', isContainerVisible);
        }

        if (!hasRendered) {
          // Primera vez O container oculto: render completo
          if (typeof logger !== 'undefined') {
            logger.debug('[DEBUG] Primera vez - render completo');
          }
          this.bookReader.render();
          this.bookReader.attachEventListeners();

          // Asegurar que el container este visible
          if (container) {
            container.classList.remove('hidden');
          }
        } else {
          // Ya renderizado - solo actualizar las partes que cambian
          // Evita re-renderizar TODO el reader, mejora rendimiento significativamente
          if (typeof logger !== 'undefined') {
            logger.debug('[DEBUG] Actualizacion parcial');
          }
          this.bookReader.updateChapterContent();
          this.bookReader.updateHeader();
          this.bookReader.updateSidebar();
          this.bookReader.updateFooterNav();
        }

        // Scroll to top
        const finalContentArea = document.querySelector('.chapter-content');
        if (finalContentArea) {
          finalContentArea.scrollTop = 0;
        }

        if (typeof logger !== 'undefined') {
          logger.debug('[DEBUG] navigateToChapter() completado');
        }
      } else {
        logger.error('[DEBUG] No se pudo obtener el chapter para:', chapterId);
      }
    } catch (error) {
      logger.error('[BookReaderNavigation] Error navegando a capitulo:', error);
      this.captureError(error, {
        context: 'navigate_to_chapter',
        chapterId: chapterId,
        filename: 'book-reader-navigation.js'
      });
      this.showToast('error', 'Error al cargar el capitulo');
    }
  }

  // ==========================================================================
  // BOOK SWITCHING
  // ==========================================================================

  /**
   * Cambia al libro especificado con confirmacion del usuario
   * @param {string} bookId - ID del libro de destino
   */
  async handleBookSwitch(bookId) {
    try {
      const allBooks = this.bookEngine.getAllBooks();
      const targetBook = allBooks.find(book => book.id === bookId);

      if (!targetBook) {
        logger.warn('[BookReaderNavigation] Libro no encontrado:', bookId);
        this.showToast('error', 'Libro no encontrado');
        return;
      }

      // Confirmar cambio de libro
      const currentBookId = this.bookEngine.getCurrentBook();
      if (currentBookId === bookId) {
        this.showToast('info', 'Ya estas leyendo este libro');
        return;
      }

      // 🔧 v2.9.341: Asegurar que confirmMessage sea siempre un string
      // (i18n.t() podría devolver un objeto si hay problemas de configuración)
      let confirmMessage = this.i18n?.t('reader.confirmBookSwitch', { title: targetBook.title });
      if (typeof confirmMessage !== 'string' || !confirmMessage) {
        confirmMessage = `¿Cambiar a "${targetBook.title}"?`;
      }

      if (!confirm(confirmMessage)) {
        return;
      }

      // Cargar el libro de destino
      await this.bookEngine.loadBook(bookId);
      this.bookReader.applyBookTheme();

      // Navegar al primer capitulo
      const firstChapter = this.bookEngine.getFirstChapter();
      if (firstChapter) {
        this.navigateToChapter(firstChapter.id);
      } else {
        // Fallback: render completo si no hay primer capitulo
        this.bookReader.render();
        this.bookReader.attachEventListeners();
      }

      this.showToast('success', this.i18n?.t('reader.bookSwitched') || 'Libro cambiado exitosamente');
    } catch (error) {
      logger.error('[BookReaderNavigation] Error cambiando de libro:', error);
      this.captureError(error, {
        context: 'handle_book_switch',
        bookId: bookId,
        filename: 'book-reader-navigation.js'
      });
      this.showToast('error', 'Error al cambiar de libro');
    }
  }

  // ==========================================================================
  // METADATA-DRIVEN NAVIGATION
  // ==========================================================================

  /**
   * Navigate to a specific exercise in Manual Practico
   * Called from chapter-resources-modal.js exercise cards
   * @param {string} bookId - ID del libro que contiene el ejercicio
   * @param {string} exerciseId - ID del ejercicio/capitulo
   */
  async navigateToExercise(bookId, exerciseId) {
    try {
      // Close chapter resources modal if open
      const chapterResourcesModal = this.getDependency('chapterResourcesModal');
      if (chapterResourcesModal) {
        chapterResourcesModal.close();
      }

      // Load the target book
      await this.bookEngine.loadBook(bookId);
      this.bookReader.applyBookTheme();

      // Navigate usando metodo con actualizacion parcial
      const chapter = this.bookEngine.getChapter(exerciseId);
      if (chapter) {
        this.navigateToChapter(exerciseId);
        this.showToast('success', 'Navegando al ejercicio...');
      } else {
        this.showToast('warning', 'Ejercicio no encontrado, mostrando primer capitulo');
        const firstChapter = this.bookEngine.getFirstChapter();
        if (firstChapter) {
          this.navigateToChapter(firstChapter.id);
        }
      }

    } catch (error) {
      logger.error('[BookReaderNavigation] Error navigating to exercise:', error);
      this.showToast('error', 'Error al navegar al ejercicio');
    }
  }

  /**
   * Navigate to a specific practice in Practicas Radicales
   * Called from chapter-resources-modal.js practice cards
   * @param {string} bookId - ID del libro que contiene la practica
   * @param {string} practiceId - ID de la practica/capitulo
   */
  async navigateToPractice(bookId, practiceId) {
    try {
      // Close chapter resources modal if open
      const chapterResourcesModal = this.getDependency('chapterResourcesModal');
      if (chapterResourcesModal) {
        chapterResourcesModal.close();
      }

      // Load the target book
      await this.bookEngine.loadBook(bookId);
      this.bookReader.applyBookTheme();

      // Navigate usando metodo con actualizacion parcial
      const chapter = this.bookEngine.getChapter(practiceId);
      if (chapter) {
        this.navigateToChapter(practiceId);
        this.showToast('success', 'Navegando a la practica...');
      } else {
        this.showToast('warning', 'Practica no encontrada, mostrando primer capitulo');
        const firstChapter = this.bookEngine.getFirstChapter();
        if (firstChapter) {
          this.navigateToChapter(firstChapter.id);
        }
      }

    } catch (error) {
      logger.error('[BookReaderNavigation] Error navigating to practice:', error);
      this.showToast('error', 'Error al navegar a la practica');
    }
  }

  // ==========================================================================
  // BACK TO LIBRARY
  // ==========================================================================

  /**
   * Volver a la vista de biblioteca
   */
  backToLibrary() {
    // Hide the book reader
    this.bookReader.hide();

    // Show the biblioteca view
    const bibliotecaView = document.getElementById('biblioteca-view');
    if (bibliotecaView) {
      bibliotecaView.classList.remove('hidden');
    }

    // Mostrar main-nav al volver a biblioteca
    const mainNav = document.getElementById('main-nav');
    if (mainNav) {
      mainNav.classList.remove('hidden');
    }

    // Update URL hash to remove book reference
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', window.location.pathname);
    }

    // Scroll to top
    window.scrollTo(0, 0);
  }

  // ==========================================================================
  // SCROLL HELPERS
  // ==========================================================================

  /**
   * Scroll suave a un elemento con validacion de existencia
   * @param {string} selector - Selector CSS del elemento objetivo
   */
  scrollToElement(selector) {
    const targetElement = document.querySelector(selector);

    if (!targetElement) {
      logger.warn(`[BookReaderNavigation] Elemento no encontrado: ${selector}`);
      if (window.toast) {
        window.toast.warning('Referencia no encontrada');
      } else {
        this.showToast('warning', 'Referencia no encontrada');
      }
      return;
    }

    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ==========================================================================
  // FONT SIZE
  // ==========================================================================

  /**
   * Aplica el tamano de fuente guardado en localStorage
   */
  applyFontSize() {
    const savedFontSize = localStorage.getItem('font-size');
    if (savedFontSize) {
      const chapterContent = document.querySelector('.chapter-content');
      if (chapterContent) {
        chapterContent.style.fontSize = savedFontSize + 'px';
      }
    }
  }

  // ==========================================================================
  // SHARE HELPERS
  // ==========================================================================

  /**
   * Comparte el capitulo actual usando shareableMoments o shareHelper
   * 🔧 v2.9.327: Mejorado con modal de redes sociales
   */
  shareCurrentChapter() {
    if (!this.currentChapter) return;

    const bookData = this.bookEngine?.getCurrentBookData();
    const bookTitle = bookData?.title || 'Colección Nuevo Ser';
    const chapterTitle = this.currentChapter.title || '';
    const progress = this.bookEngine?.getProgress(this.bookEngine.getCurrentBook());

    // Get epigraph or first paragraph as quote
    let quote = '';
    if (this.currentChapter.epigraph?.text) {
      quote = this.currentChapter.epigraph.text;
    } else if (this.currentChapter.closingQuestion) {
      quote = this.currentChapter.closingQuestion;
    }

    // 🔧 v2.9.327: Usar shareableMoments si está disponible para mostrar modal con opciones
    if (window.shareableMoments) {
      const moment = quote
        ? window.shareableMoments.createInsightMoment(
            quote.substring(0, 280),
            bookTitle,
            chapterTitle
          )
        : {
            type: 'chapter_progress',
            title: '📖 Mi progreso de lectura',
            message: `Estoy leyendo "${bookTitle}" - ${chapterTitle}\n\n📊 Progreso: ${progress?.percentage || 0}% completado (${progress?.chaptersRead || 0}/${progress?.totalChapters || 0} capítulos)`,
            hashtags: ['ColeccionNuevoSer', 'Lectura', 'Transformacion']
          };
      window.shareableMoments.showShareModal(moment);
      return;
    }

    // Fallback a shareHelper
    const shareHelper = this.getDependency('shareHelper');
    if (!shareHelper) return;

    if (quote) {
      shareHelper.shareQuote({
        quote: quote.substring(0, 280),
        author: this.currentChapter.epigraph?.author || '',
        bookTitle: bookTitle,
        chapterTitle: chapterTitle
      });
    } else {
      shareHelper.shareProgress({
        bookTitle: bookTitle,
        progress: progress?.percentage || 0,
        chaptersRead: progress?.chaptersRead || 0,
        totalChapters: progress?.totalChapters || 0
      });
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    this.bookReader = null;
  }
}

// Exportar globalmente
window.BookReaderNavigation = BookReaderNavigation;
