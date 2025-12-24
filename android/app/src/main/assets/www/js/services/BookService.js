/**
 * BOOK SERVICE - Servicio para gestión de libros y progreso de lectura
 * Extiende BaseService para operaciones específicas de libros
 *
 * @version 1.0.0
 */

class BookService extends BaseService {
  constructor() {
    // Usar tabla de reading_progress como principal
    super('reading_progress', {
      cacheTTL: 5 * 60 * 1000, // 5 minutos
      enableOfflineQueue: true
    });

    this.bookmarksCache = new Map();
  }

  /**
   * Obtener información de un libro desde el catálogo
   *
   * @param {string} bookId - ID del libro
   * @returns {Promise<Object|null>} Información del libro
   */
  async getBook(bookId) {
    const cacheKey = `book:${bookId}`;

    // Verificar cache
    if (this.cache.has(cacheKey)) {
      const entrada = this.cache.get(cacheKey);
      if (Date.now() < entrada.expira) {
        return entrada.datos;
      }
    }

    try {
      // Cargar catálogo de libros
      const catalogo = window.libros || await this.cargarCatalogo();
      const libro = catalogo.find(l => l.id === bookId);

      if (libro) {
        // Guardar en cache
        this.cache.set(cacheKey, {
          datos: libro,
          expira: Date.now() + this.cacheTTL
        });
      }

      return libro || null;
    } catch (error) {
      this.manejarError('getBook', error);
      return null;
    }
  }

  /**
   * Cargar catálogo de libros
   * @private
   * @returns {Promise<Array>} Lista de libros
   */
  async cargarCatalogo() {
    try {
      const response = await fetch('/books/catalog.json');
      const data = await response.json();
      window.libros = data.books || [];
      return window.libros;
    } catch (error) {
      this.manejarError('cargarCatalogo', error);
      return [];
    }
  }

  /**
   * Obtener progreso de lectura de un usuario para un libro
   *
   * @param {string} userId - ID del usuario
   * @param {string} bookId - ID del libro
   * @returns {Promise<Object|null>} Progreso de lectura
   */
  async getReadingProgress(userId, bookId) {
    if (!userId) {
      userId = this.getCurrentUserId();
    }

    if (!userId) {
      console.warn('No hay usuario autenticado para obtener progreso');
      return null;
    }

    const cacheKey = `reading_progress:${userId}:${bookId}`;

    // Verificar cache
    if (this.cache.has(cacheKey)) {
      const entrada = this.cache.get(cacheKey);
      if (Date.now() < entrada.expira) {
        return entrada.datos;
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        this.manejarError('getReadingProgress', error);
        return null;
      }

      // Si no existe, crear registro inicial
      if (!data) {
        const nuevoProgreso = {
          user_id: userId,
          book_id: bookId,
          current_page: 0,
          progress_percent: 0,
          last_position: null,
          completed: false,
          started_at: new Date().toISOString(),
          completed_at: null
        };

        const { data: creado, error: errorCrear } = await this.supabase
          .from('reading_progress')
          .insert(nuevoProgreso)
          .select()
          .single();

        if (errorCrear) {
          this.manejarError('getReadingProgress:create', errorCrear);
          return nuevoProgreso; // Retornar progreso local aunque falle en DB
        }

        // Guardar en cache
        this.cache.set(cacheKey, {
          datos: creado,
          expira: Date.now() + this.cacheTTL
        });

        return creado;
      }

      // Guardar en cache
      this.cache.set(cacheKey, {
        datos: data,
        expira: Date.now() + this.cacheTTL
      });

      return data;
    } catch (error) {
      this.manejarError('getReadingProgress', error);
      return null;
    }
  }

  /**
   * Actualizar progreso de lectura
   *
   * @param {string} userId - ID del usuario
   * @param {string} bookId - ID del libro
   * @param {Object} progreso - Datos de progreso
   * @param {number} progreso.current_page - Página actual
   * @param {number} progreso.progress_percent - Porcentaje de progreso
   * @param {Object} progreso.last_position - Última posición de lectura
   * @param {boolean} progreso.completed - Libro completado
   * @returns {Promise<Object|null>} Progreso actualizado
   */
  async updateReadingProgress(userId, bookId, progreso) {
    if (!userId) {
      userId = this.getCurrentUserId();
    }

    if (!userId) {
      console.warn('No hay usuario autenticado para actualizar progreso');
      return null;
    }

    // Preparar datos de actualización
    const datosActualizacion = {
      updated_at: new Date().toISOString()
    };

    if (progreso.current_page !== undefined) {
      datosActualizacion.current_page = progreso.current_page;
    }

    if (progreso.progress_percent !== undefined) {
      datosActualizacion.progress_percent = progreso.progress_percent;
    }

    if (progreso.last_position !== undefined) {
      datosActualizacion.last_position = progreso.last_position;
    }

    if (progreso.completed !== undefined) {
      datosActualizacion.completed = progreso.completed;
      if (progreso.completed) {
        datosActualizacion.completed_at = new Date().toISOString();
        datosActualizacion.progress_percent = 100;
      }
    }

    try {
      // Primero obtener el registro existente (o crearlo)
      const registroExistente = await this.getReadingProgress(userId, bookId);

      if (!registroExistente || !registroExistente.id) {
        // Si no existe, crearlo
        const nuevoProgreso = {
          user_id: userId,
          book_id: bookId,
          ...datosActualizacion,
          started_at: new Date().toISOString()
        };

        const { data, error } = await this.supabase
          .from('reading_progress')
          .insert(nuevoProgreso)
          .select()
          .single();

        if (error) {
          this.manejarError('updateReadingProgress:insert', error);
          return null;
        }

        // Invalidar cache
        this.invalidarCache();

        return data;
      }

      // Actualizar registro existente
      const { data, error } = await this.supabase
        .from('reading_progress')
        .update(datosActualizacion)
        .eq('id', registroExistente.id)
        .select()
        .single();

      if (error) {
        this.manejarError('updateReadingProgress:update', error);
        return null;
      }

      // Invalidar cache
      this.invalidarCache();

      return data;
    } catch (error) {
      this.manejarError('updateReadingProgress', error);
      return null;
    }
  }

  /**
   * Obtener marcadores de un libro
   *
   * @param {string} userId - ID del usuario
   * @param {string} bookId - ID del libro
   * @returns {Promise<Array>} Lista de marcadores
   */
  async getBookmarks(userId, bookId) {
    if (!userId) {
      userId = this.getCurrentUserId();
    }

    if (!userId) {
      console.warn('No hay usuario autenticado para obtener marcadores');
      return [];
    }

    const cacheKey = `bookmarks:${userId}:${bookId}`;

    // Verificar cache
    if (this.bookmarksCache.has(cacheKey)) {
      const entrada = this.bookmarksCache.get(cacheKey);
      if (Date.now() < entrada.expira) {
        return entrada.datos;
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });

      if (error) {
        this.manejarError('getBookmarks', error);
        return [];
      }

      // Guardar en cache
      this.bookmarksCache.set(cacheKey, {
        datos: data || [],
        expira: Date.now() + this.cacheTTL
      });

      return data || [];
    } catch (error) {
      this.manejarError('getBookmarks', error);
      return [];
    }
  }

  /**
   * Guardar un marcador
   *
   * @param {string} userId - ID del usuario
   * @param {string} bookId - ID del libro
   * @param {Object} datosBookmark - Datos del marcador
   * @param {string} datosBookmark.title - Título del marcador
   * @param {string} datosBookmark.page - Página
   * @param {string} datosBookmark.position - Posición en la página
   * @param {string} datosBookmark.notes - Notas opcionales
   * @returns {Promise<Object|null>} Marcador creado
   */
  async saveBookmark(userId, bookId, datosBookmark) {
    if (!userId) {
      userId = this.getCurrentUserId();
    }

    if (!userId) {
      console.warn('No hay usuario autenticado para guardar marcador');
      return null;
    }

    const nuevoBookmark = {
      user_id: userId,
      book_id: bookId,
      title: datosBookmark.title || 'Marcador sin título',
      page: datosBookmark.page || '',
      position: datosBookmark.position || null,
      notes: datosBookmark.notes || '',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await this.supabase
        .from('bookmarks')
        .insert(nuevoBookmark)
        .select()
        .single();

      if (error) {
        this.manejarError('saveBookmark', error);
        return null;
      }

      // Invalidar cache de bookmarks
      const cacheKey = `bookmarks:${userId}:${bookId}`;
      this.bookmarksCache.delete(cacheKey);

      return data;
    } catch (error) {
      this.manejarError('saveBookmark', error);
      return null;
    }
  }

  /**
   * Eliminar un marcador
   *
   * @param {string} bookmarkId - ID del marcador
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  async deleteBookmark(bookmarkId) {
    try {
      const { error } = await this.supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) {
        this.manejarError('deleteBookmark', error);
        return false;
      }

      // Invalidar cache de bookmarks
      this.bookmarksCache.clear();

      return true;
    } catch (error) {
      this.manejarError('deleteBookmark', error);
      return false;
    }
  }

  /**
   * Obtener todos los libros con progreso del usuario
   *
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Lista de libros con progreso
   */
  async getBooksWithProgress(userId) {
    if (!userId) {
      userId = this.getCurrentUserId();
    }

    if (!userId) {
      console.warn('No hay usuario autenticado');
      return [];
    }

    try {
      // Cargar catálogo
      const catalogo = await this.cargarCatalogo();

      // Obtener progreso de todos los libros
      const { data: progresos, error } = await this.supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        this.manejarError('getBooksWithProgress', error);
        return catalogo; // Retornar catálogo sin progreso
      }

      // Combinar catálogo con progreso
      const librosConProgreso = catalogo.map(libro => {
        const progreso = progresos?.find(p => p.book_id === libro.id);
        return {
          ...libro,
          progress: progreso || {
            current_page: 0,
            progress_percent: 0,
            completed: false
          }
        };
      });

      return librosConProgreso;
    } catch (error) {
      this.manejarError('getBooksWithProgress', error);
      return [];
    }
  }

  /**
   * Marcar libro como completado
   *
   * @param {string} userId - ID del usuario
   * @param {string} bookId - ID del libro
   * @returns {Promise<Object|null>} Progreso actualizado
   */
  async completeBook(userId, bookId) {
    return this.updateReadingProgress(userId, bookId, {
      completed: true,
      progress_percent: 100
    });
  }

  /**
   * Obtener estadísticas de lectura del usuario
   *
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Estadísticas
   */
  async getReadingStats(userId) {
    if (!userId) {
      userId = this.getCurrentUserId();
    }

    if (!userId) {
      console.warn('No hay usuario autenticado');
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        this.manejarError('getReadingStats', error);
        return null;
      }

      const estadisticas = {
        librosIniciados: data?.length || 0,
        librosCompletados: data?.filter(p => p.completed).length || 0,
        progresoPromedio: data?.length > 0
          ? data.reduce((sum, p) => sum + (p.progress_percent || 0), 0) / data.length
          : 0,
        ultimaLectura: data?.length > 0
          ? data.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0]
          : null
      };

      return estadisticas;
    } catch (error) {
      this.manejarError('getReadingStats', error);
      return null;
    }
  }
}

// Crear instancia global y exportar
window.BookService = BookService;
window.bookService = new BookService();

console.log('📚 BookService inicializado');
