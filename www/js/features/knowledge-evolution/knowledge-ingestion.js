/**
 * Knowledge Ingestion - Carga y parseo de libros de la coleccion
 * @version 1.0.0
 *
 * Responsabilidades:
 *   - Cargar catalog.json con metadatos de todos los libros
 *   - Cargar cada book.json con contenido completo
 *   - Parsear estructura: prologo -> partes -> capitulos -> ejercicios
 *   - Crear indice navegable y texto plano completo
 *   - Calcular estadisticas del corpus
 */

class KnowledgeIngestion {
  constructor(coordinator) {
    this.coordinator = coordinator;
    this.config = coordinator.config;

    // Cache de libros cargados
    this.loadedBooks = new Map();

    // Indice del corpus
    this.index = {
      byBook: new Map(),      // bookId -> { title, sections, chapters[] }
      byChapter: new Map(),   // chapterId -> { bookId, sectionId, title, content }
      byExercise: new Map(),  // exerciseId -> { bookId, chapterId, title, steps }
      fullText: new Map()     // bookId -> texto plano completo
    };

    // Lista de libros de la coleccion (18 libros segun plan)
    this.collectionBooks = [
      // Fundacion Teorica
      'codigo-despertar',
      'filosofia-nuevo-ser',
      'codigo-cosmico',
      // Crisis y Reconexion
      'tierra-que-despierta',
      'nacimiento',
      // Accion Transformadora
      'manifiesto',
      'guia-acciones',
      'manual-transicion',
      'toolkit-transicion',
      'ahora-instituciones',
      // Areas Especializadas
      'educacion-nuevo-ser',
      'arte-relacion-consciente',
      'simplicidad-radical',
      'revolucion-creativa',
      'dialogos-maquina',
      // Practica Directa
      'manual-practico',
      'practicas-radicales',
      'ecologia-profunda'
    ];
  }

  // ==========================================================================
  // CARGA DE CATALOGO
  // ==========================================================================

  /**
   * Carga el catalogo general de la biblioteca
   */
  async loadCatalog() {
    try {
      const catalogPath = `${this.config.booksPath}${this.config.catalogFile}`;
      const response = await fetch(catalogPath);

      if (!response.ok) {
        throw new Error(`Error cargando catalogo: ${response.status}`);
      }

      const catalog = await response.json();
      this.coordinator.corpus.catalog = catalog;

      logger.log(`[KnowledgeIngestion] Catalogo cargado: ${catalog.books?.length || 0} libros registrados`);
      return catalog;
    } catch (error) {
      logger.error('[KnowledgeIngestion] Error cargando catalogo:', error);
      throw error;
    }
  }

  // ==========================================================================
  // CARGA DE LIBROS
  // ==========================================================================

  /**
   * Carga un libro individual por su ID
   */
  async loadBook(bookId) {
    try {
      // Verificar cache
      if (this.loadedBooks.has(bookId)) {
        return this.loadedBooks.get(bookId);
      }

      const bookPath = `${this.config.booksPath}${bookId}/book.json`;
      const response = await fetch(bookPath);

      if (!response.ok) {
        logger.warn(`[KnowledgeIngestion] Libro no encontrado: ${bookId}`);
        return null;
      }

      const book = await response.json();

      // Agregar metadata
      book._id = bookId;
      book._loadedAt = Date.now();

      // Procesar y indexar
      this.processBook(book);

      // Guardar en cache
      this.loadedBooks.set(bookId, book);
      this.coordinator.corpus.books.set(bookId, book);

      logger.log(`[KnowledgeIngestion] Libro cargado: ${book.title}`);
      return book;
    } catch (error) {
      logger.error(`[KnowledgeIngestion] Error cargando libro ${bookId}:`, error);
      return null;
    }
  }

  /**
   * Carga todos los libros de la coleccion
   */
  async ingestAllBooks(onProgress) {
    try {
      logger.log('[KnowledgeIngestion] Iniciando ingestion de todos los libros...');

      // Primero cargar catalogo
      await this.loadCatalog();

      const totalBooks = this.collectionBooks.length;
      let loadedCount = 0;
      let successCount = 0;

      // Cargar libros secuencialmente para evitar sobrecarga
      for (const bookId of this.collectionBooks) {
        const book = await this.loadBook(bookId);

        if (book) {
          successCount++;
        }

        loadedCount++;
        const progress = Math.round((loadedCount / totalBooks) * 100);

        if (onProgress) {
          onProgress(progress);
        }
      }

      // Calcular estadisticas finales
      this.calculateStats();

      logger.log(`[KnowledgeIngestion] Ingestion completada: ${successCount}/${totalBooks} libros cargados`);

      return {
        success: true,
        totalBooks,
        loadedBooks: successCount,
        stats: this.getStats()
      };
    } catch (error) {
      logger.error('[KnowledgeIngestion] Error en ingestion:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==========================================================================
  // PROCESAMIENTO E INDEXACION
  // ==========================================================================

  /**
   * Procesa un libro y lo indexa
   */
  processBook(book) {
    const bookId = book._id;
    const bookIndex = {
      title: book.title,
      subtitle: book.subtitle,
      author: book.author,
      coAuthor: book.coAuthor,
      sections: [],
      chapters: [],
      exercises: []
    };

    let fullText = [];
    let chapterCount = 0;
    let exerciseCount = 0;
    let wordCount = 0;

    // Procesar secciones
    if (book.sections && Array.isArray(book.sections)) {
      for (const section of book.sections) {
        const sectionData = {
          id: section.id,
          title: section.title,
          subtitle: section.subtitle,
          chapters: []
        };

        // Procesar capitulos
        if (section.chapters && Array.isArray(section.chapters)) {
          for (const chapter of section.chapters) {
            chapterCount++;

            const chapterId = `${bookId}:${section.id}:${chapter.id}`;
            const chapterData = {
              id: chapterId,
              bookId,
              sectionId: section.id,
              title: chapter.title,
              epigraph: chapter.epigraph,
              content: chapter.content || '',
              closingQuestion: chapter.closingQuestion,
              exercises: []
            };

            // Contar palabras
            if (chapter.content) {
              const words = chapter.content.split(/\s+/).length;
              wordCount += words;
              fullText.push(chapter.content);
            }

            // Procesar ejercicios
            if (chapter.exercises && Array.isArray(chapter.exercises)) {
              for (const exercise of chapter.exercises) {
                exerciseCount++;

                const exerciseId = `${chapterId}:${exercise.id}`;
                const exerciseData = {
                  id: exerciseId,
                  bookId,
                  chapterId,
                  title: exercise.title,
                  duration: exercise.duration,
                  description: exercise.description,
                  steps: exercise.steps || [],
                  reflection: exercise.reflection
                };

                // Indexar ejercicio
                this.index.byExercise.set(exerciseId, exerciseData);
                chapterData.exercises.push(exerciseId);
                bookIndex.exercises.push(exerciseId);

                // Agregar texto del ejercicio
                if (exercise.description) {
                  fullText.push(exercise.description);
                }
                if (exercise.steps) {
                  fullText.push(exercise.steps.join('\n'));
                }
              }
            }

            // Indexar capitulo
            this.index.byChapter.set(chapterId, chapterData);
            sectionData.chapters.push(chapterId);
            bookIndex.chapters.push(chapterId);
          }
        }

        bookIndex.sections.push(sectionData);
      }
    }

    // Guardar texto completo
    this.index.fullText.set(bookId, fullText.join('\n\n'));

    // Indexar libro
    this.index.byBook.set(bookId, bookIndex);

    // Actualizar estadisticas parciales
    book._stats = {
      chapters: chapterCount,
      exercises: exerciseCount,
      words: wordCount
    };
  }

  // ==========================================================================
  // ESTADISTICAS
  // ==========================================================================

  /**
   * Calcula estadisticas globales del corpus
   */
  calculateStats() {
    let totalWords = 0;
    let totalChapters = 0;
    let totalExercises = 0;

    for (const [bookId, book] of this.coordinator.corpus.books) {
      if (book._stats) {
        totalWords += book._stats.words;
        totalChapters += book._stats.chapters;
        totalExercises += book._stats.exercises;
      }
    }

    this.coordinator.corpus.totalWords = totalWords;
    this.coordinator.corpus.totalChapters = totalChapters;
    this.coordinator.corpus.totalExercises = totalExercises;

    logger.log(`[KnowledgeIngestion] Estadisticas: ${totalWords} palabras, ${totalChapters} capitulos, ${totalExercises} ejercicios`);
  }

  /**
   * Obtiene estadisticas del corpus
   */
  getStats() {
    return {
      booksLoaded: this.coordinator.corpus.books.size,
      booksInCollection: this.collectionBooks.length,
      totalWords: this.coordinator.corpus.totalWords,
      totalChapters: this.coordinator.corpus.totalChapters,
      totalExercises: this.coordinator.corpus.totalExercises,
      indexedChapters: this.index.byChapter.size,
      indexedExercises: this.index.byExercise.size
    };
  }

  // ==========================================================================
  // ACCESO A DATOS
  // ==========================================================================

  /**
   * Obtiene el texto completo de un libro
   */
  getBookFullText(bookId) {
    return this.index.fullText.get(bookId) || '';
  }

  /**
   * Obtiene todos los textos del corpus como un solo string
   */
  getCorpusFullText() {
    const texts = [];
    for (const [bookId, text] of this.index.fullText) {
      const book = this.coordinator.corpus.books.get(bookId);
      if (book) {
        texts.push(`\n\n=== ${book.title} ===\n\n${text}`);
      }
    }
    return texts.join('\n\n');
  }

  /**
   * Obtiene un capitulo por su ID
   */
  getChapter(chapterId) {
    return this.index.byChapter.get(chapterId);
  }

  /**
   * Obtiene un ejercicio por su ID
   */
  getExercise(exerciseId) {
    return this.index.byExercise.get(exerciseId);
  }

  /**
   * Obtiene todos los capitulos de un libro
   */
  getBookChapters(bookId) {
    const bookIndex = this.index.byBook.get(bookId);
    if (!bookIndex) return [];

    return bookIndex.chapters.map(chapterId => this.index.byChapter.get(chapterId));
  }

  /**
   * Obtiene todos los ejercicios del corpus
   */
  getAllExercises() {
    return Array.from(this.index.byExercise.values());
  }

  /**
   * Busca en el corpus por texto
   */
  searchCorpus(query, options = {}) {
    const results = [];
    const queryLower = query.toLowerCase();
    const limit = options.limit || 50;

    for (const [chapterId, chapter] of this.index.byChapter) {
      if (chapter.content && chapter.content.toLowerCase().includes(queryLower)) {
        // Encontrar contexto
        const contentLower = chapter.content.toLowerCase();
        const index = contentLower.indexOf(queryLower);
        const start = Math.max(0, index - 100);
        const end = Math.min(chapter.content.length, index + query.length + 100);
        const context = chapter.content.substring(start, end);

        results.push({
          type: 'chapter',
          id: chapterId,
          bookId: chapter.bookId,
          title: chapter.title,
          context: `...${context}...`,
          relevance: 1.0
        });

        if (results.length >= limit) break;
      }
    }

    return results;
  }

  /**
   * Obtiene estructura del corpus para visualizacion
   */
  getCorpusStructure() {
    const structure = {
      books: []
    };

    for (const [bookId, bookIndex] of this.index.byBook) {
      structure.books.push({
        id: bookId,
        title: bookIndex.title,
        subtitle: bookIndex.subtitle,
        sections: bookIndex.sections.map(section => ({
          id: section.id,
          title: section.title,
          chaptersCount: section.chapters.length
        })),
        stats: this.coordinator.corpus.books.get(bookId)?._stats
      });
    }

    return structure;
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    this.loadedBooks.clear();
    this.index.byBook.clear();
    this.index.byChapter.clear();
    this.index.byExercise.clear();
    this.index.fullText.clear();
    logger.log('[KnowledgeIngestion] Modulo destruido');
  }
}

// Exportar para uso global
window.KnowledgeIngestion = KnowledgeIngestion;
