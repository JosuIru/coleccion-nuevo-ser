// ============================================================================
// BIBLIOTECA UTILS - Utilidades y funciones de soporte
// ============================================================================
// Módulo extraído de biblioteca.js para mejor organización

/**
 * Clase con métodos utilitarios para la Biblioteca
 * Incluye: debounce, timers, admin cache, práctica tracking, loading
 */
class BibliotecaUtils {
  constructor(biblioteca) {
    this.biblioteca = biblioteca;
  }

  // ==========================================================================
  // DEBOUNCE Y TIMERS
  // ==========================================================================

  /**
   * Helper para debounce de operaciones (ej: localStorage writes)
   * @param {string} key - Identificador único para el debounce
   * @param {Function} fn - Función a ejecutar
   * @param {number} delay - Delay en milisegundos
   */
  debounce(key, fn, delay = 500) {
    const bib = this.biblioteca;
    if (bib.debounceTimers.has(key)) {
      clearTimeout(bib.debounceTimers.get(key));
    }
    const timer = setTimeout(() => {
      fn();
      bib.debounceTimers.delete(key);
    }, delay);
    bib.debounceTimers.set(key, timer);
  }

  /**
   * Wrapper para setTimeout con auto-cleanup
   * @param {Function} callback - Función a ejecutar
   * @param {number} delay - Delay en milisegundos
   * @returns {number} Timer ID
   */
  setTimeout(callback, delay) {
    const bib = this.biblioteca;
    const timerId = setTimeout(() => {
      callback();
      const indice = bib.timers.indexOf(timerId);
      if (indice > -1) bib.timers.splice(indice, 1);
    }, delay);
    bib.timers.push(timerId);
    return timerId;
  }

  /**
   * Wrapper para setInterval con auto-cleanup
   * @param {Function} callback - Función a ejecutar
   * @param {number} delay - Delay en milisegundos
   * @returns {number} Interval ID
   */
  setInterval(callback, delay) {
    const intervalId = setInterval(callback, delay);
    this.biblioteca.intervals.push(intervalId);
    return intervalId;
  }

  /**
   * Wrapper para addEventListener con tracking
   * @param {EventTarget} target - Elemento target
   * @param {string} event - Tipo de evento
   * @param {Function} handler - Handler del evento
   * @param {Object} options - Opciones del listener
   */
  addEventListener(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    this.biblioteca.eventListeners.push({ target, event, handler, options });
  }

  // ==========================================================================
  // ADMIN CACHE
  // ==========================================================================

  /**
   * Pre-cargar cache de admin (fire-and-forget)
   */
  preloadAdminCache() {
    const user = window.authHelper?.getCurrentUser();
    if (user?.id) {
      this.checkIsAdmin(user.id).catch(() => {
        // Silently ignore errors - cache stays null (non-admin default)
      });
    }
  }

  /**
   * Verifica si un usuario es admin (con caché)
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>}
   */
  async checkIsAdmin(userId) {
    const bib = this.biblioteca;
    try {
      const now = Date.now();
      if (bib._adminCache !== null && now - bib._adminCacheTime < bib.ADMIN_CACHE_TTL) {
        logger.debug('[BibliotecaUtils] Usando caché de admin');
        return bib._adminCache;
      }

      const supabase = window.supabaseClient;
      if (!supabase) return false;

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const isAdmin = data?.role === 'admin';
      bib._adminCache = isAdmin;
      bib._adminCacheTime = now;
      logger.debug('[BibliotecaUtils] Caché de admin actualizado:', isAdmin);

      return isAdmin;
    } catch (error) {
      logger.error('Error verificando admin:', error);
      return false;
    }
  }

  /**
   * Limpiar caché de admin (útil al hacer logout)
   */
  clearAdminCache() {
    this.biblioteca._adminCache = null;
    this.biblioteca._adminCacheTime = 0;
    logger.debug('[BibliotecaUtils] Caché de admin limpiado');
  }

  // ==========================================================================
  // PRÁCTICA Y PROGRESO
  // ==========================================================================

  /**
   * Obtiene el siguiente capítulo no leído de un libro
   * @param {string} libroId - ID del libro
   * @returns {Object|null} Capítulo siguiente o null
   */
  getSiguienteCapitulo(libroId) {
    try {
      const datosLibro = this.biblioteca.bookEngine.getBookData(libroId);
      if (!datosLibro?.chapters) return null;

      for (const capitulo of datosLibro.chapters) {
        if (!this.biblioteca.bookEngine.isChapterRead(capitulo.id)) {
          return capitulo;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtiene el historial de herramientas usadas por el usuario
   * @returns {Object} Historial de prácticas
   */
  getUserPracticeHistory() {
    return window.StorageHelper?.get('daily-practice-history', {}) || {};
  }

  /**
   * Encuentra la herramienta menos usada del array
   * @param {Array} tools - Array de herramientas
   * @param {Object} history - Historial de uso
   * @returns {Object} Herramienta menos usada
   */
  findLeastUsedTool(tools, history) {
    const toolUsage = tools.map(tool => ({
      tool,
      count: history[tool.libroId] || 0
    }));

    toolUsage.sort((a, b) => a.count - b.count);
    const minCount = toolUsage[0].count;
    const leastUsed = toolUsage.filter(t => t.count === minCount);
    const randomIndex = Math.floor(Math.random() * leastUsed.length);

    return leastUsed[randomIndex].tool;
  }

  /**
   * Registra el uso de una herramienta
   * @param {string} libroId - ID del libro/herramienta
   */
  trackPracticeUsage(libroId) {
    const history = this.getUserPracticeHistory();
    history[libroId] = (history[libroId] || 0) + 1;
    window.StorageHelper?.set('daily-practice-history', history);
    logger.debug(`[BibliotecaUtils] Práctica registrada: ${libroId} (${history[libroId]} veces)`);
  }

  // ==========================================================================
  // LOADING OVERLAY
  // ==========================================================================

  /**
   * Muestra overlay de carga
   * @param {string} message - Mensaje a mostrar
   */
  showLoading(message) {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
    overlay.innerHTML = `
      <div class="text-center text-white">
        <div class="inline-flex items-center justify-center w-16 h-16 mb-4">
          <svg class="animate-spin w-12 h-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div class="text-xl">${message}</div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  /**
   * Oculta overlay de carga
   */
  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Limpia todos los recursos (timers, intervals, listeners)
   */
  cleanup() {
    const bib = this.biblioteca;
    logger.debug('[BibliotecaUtils] Iniciando cleanup...');

    // Limpiar timers
    bib.timers.forEach(timerId => clearTimeout(timerId));
    bib.timers = [];

    // Limpiar intervals
    bib.intervals.forEach(intervalId => clearInterval(intervalId));
    bib.intervals = [];

    // Limpiar event listeners nativos
    bib.eventListeners.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler);
    });
    bib.eventListeners = [];

    // Limpiar global click handler
    if (bib._globalClickHandler) {
      document.removeEventListener('click', bib._globalClickHandler);
      bib._globalClickHandler = null;
    }

    // Limpiar EventManager
    if (bib.eventManager) {
      bib.eventManager.cleanup();
    }

    // Limpiar debounce timers
    bib.debounceTimers.forEach((timerId) => {
      clearTimeout(timerId);
    });
    bib.debounceTimers.clear();

    // Resetear flags
    bib.delegatedListenersAttached = false;
    bib.listenersAttached = false;

    logger.debug('[BibliotecaUtils] Cleanup completado');
  }
}

// Exportar globalmente
window.BibliotecaUtils = BibliotecaUtils;
