/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * BASE SERVICE - Capa de abstracción para operaciones con Supabase
 * Proporciona métodos CRUD genéricos, cache en memoria y manejo de errores centralizado
 *
 * @version 1.0.0
 */

class BaseService {
  /**
   * @param {string} tableName - Nombre de la tabla en Supabase
   * @param {Object} opciones - Opciones de configuración
   * @param {number} opciones.cacheTTL - Tiempo de vida del cache en ms (default: 5 minutos)
   * @param {boolean} opciones.enableOfflineQueue - Habilitar cola offline (default: true)
   */
  constructor(tableName, opciones = {}) {
    this.tableName = tableName;
    this.cache = new Map();
    this.cacheTTL = opciones.cacheTTL || 5 * 60 * 1000; // 5 minutos por defecto
    this.enableOfflineQueue = opciones.enableOfflineQueue !== false;
    this.offlineQueue = [];

    // Referencias a servicios globales
    this.supabase = null;
    this.authHelper = null;

    this.init();
  }

  /**
   * Inicializar servicio y esperar a que Supabase esté disponible
   */
  async init() {
    // Esperar a que Supabase esté disponible
    await this.esperarSupabase();

    // Setup offline queue processor si está habilitado
    if (this.enableOfflineQueue) {
      this.setupOfflineQueueProcessor();
    }
  }

  /**
   * Esperar a que Supabase y AuthHelper estén disponibles
   */
  async esperarSupabase() {
    return new Promise((resolve) => {
      const verificar = () => {
        if (window.supabaseClient && window.authHelper) {
          this.supabase = window.supabaseClient;
          this.authHelper = window.authHelper;
          resolve();
        } else {
          setTimeout(verificar, 100);
        }
      };
      verificar();
    });
  }

  /**
   * Obtener un registro por ID con cache
   *
   * @param {string} id - ID del registro
   * @param {Object} opciones - Opciones de la query
   * @param {string} opciones.select - Campos a seleccionar (default: '*')
   * @param {boolean} opciones.useCache - Usar cache (default: true)
   * @returns {Promise<Object|null>} Registro o null si no existe
   */
  async get(id, opciones = {}) {
    const { select = '*', useCache = true } = opciones;
    const cacheKey = `${this.tableName}:${id}:${select}`;

    // Verificar cache
    if (useCache && this.cache.has(cacheKey)) {
      const entrada = this.cache.get(cacheKey);
      if (Date.now() < entrada.expira) {
        return entrada.datos;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select(select)
        .eq('id', id)
        .single();

      if (error) {
        this.manejarError('get', error);
        return null;
      }

      // Guardar en cache
      if (useCache && data) {
        this.cache.set(cacheKey, {
          datos: data,
          expira: Date.now() + this.cacheTTL
        });
      }

      return data;
    } catch (error) {
      this.manejarError('get', error);
      return null;
    }
  }

  /**
   * Obtener todos los registros con filtros opcionales
   *
   * @param {Object} opciones - Opciones de la query
   * @param {string} opciones.select - Campos a seleccionar (default: '*')
   * @param {Object} opciones.filtros - Filtros a aplicar (ej: {status: 'active'})
   * @param {string} opciones.order - Campo para ordenar (ej: 'created_at')
   * @param {boolean} opciones.ascending - Orden ascendente (default: true)
   * @param {number} opciones.limit - Límite de registros
   * @param {boolean} opciones.useCache - Usar cache (default: true)
   * @returns {Promise<Array>} Array de registros
   */
  async getAll(opciones = {}) {
    const {
      select = '*',
      filtros = {},
      order = 'created_at',
      ascending = true,
      limit = null,
      useCache = true
    } = opciones;

    const cacheKey = `${this.tableName}:all:${JSON.stringify({select, filtros, order, ascending, limit})}`;

    // Verificar cache
    if (useCache && this.cache.has(cacheKey)) {
      const entrada = this.cache.get(cacheKey);
      if (Date.now() < entrada.expira) {
        return entrada.datos;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    try {
      let query = this.supabase
        .from(this.tableName)
        .select(select);

      // Aplicar filtros
      Object.entries(filtros).forEach(([campo, valor]) => {
        query = query.eq(campo, valor);
      });

      // Aplicar ordenamiento
      if (order) {
        query = query.order(order, { ascending });
      }

      // Aplicar límite
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        this.manejarError('getAll', error);
        return [];
      }

      // Guardar en cache
      if (useCache && data) {
        this.cache.set(cacheKey, {
          datos: data,
          expira: Date.now() + this.cacheTTL
        });
      }

      return data || [];
    } catch (error) {
      this.manejarError('getAll', error);
      return [];
    }
  }

  /**
   * Crear un nuevo registro
   *
   * @param {Object} datos - Datos del registro
   * @param {boolean} invalidateCache - Invalidar cache (default: true)
   * @returns {Promise<Object|null>} Registro creado o null si falla
   */
  async create(datos, invalidateCache = true) {
    // Si no hay conexión y offline queue está habilitado, agregar a cola
    if (!navigator.onLine && this.enableOfflineQueue) {
      this.offlineQueue.push({
        operation: 'create',
        datos,
        timestamp: Date.now()
      });
      return { id: `offline_${Date.now()}`, ...datos, _offline: true };
    }

    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(datos)
        .select()
        .single();

      if (error) {
        this.manejarError('create', error);

        // Si falla, agregar a cola offline si está habilitado
        if (this.enableOfflineQueue) {
          this.offlineQueue.push({
            operation: 'create',
            datos,
            timestamp: Date.now()
          });
        }

        return null;
      }

      // Invalidar cache relacionado
      if (invalidateCache) {
        this.invalidarCache();
      }

      return data;
    } catch (error) {
      this.manejarError('create', error);

      // Si falla, agregar a cola offline si está habilitado
      if (this.enableOfflineQueue) {
        this.offlineQueue.push({
          operation: 'create',
          datos,
          timestamp: Date.now()
        });
      }

      return null;
    }
  }

  /**
   * Actualizar un registro existente
   *
   * @param {string} id - ID del registro
   * @param {Object} datos - Datos a actualizar
   * @param {boolean} invalidateCache - Invalidar cache (default: true)
   * @returns {Promise<Object|null>} Registro actualizado o null si falla
   */
  async update(id, datos, invalidateCache = true) {
    // Si no hay conexión y offline queue está habilitado, agregar a cola
    if (!navigator.onLine && this.enableOfflineQueue) {
      this.offlineQueue.push({
        operation: 'update',
        id,
        datos,
        timestamp: Date.now()
      });
      return { id, ...datos, _offline: true };
    }

    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(datos)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.manejarError('update', error);

        // Si falla, agregar a cola offline si está habilitado
        if (this.enableOfflineQueue) {
          this.offlineQueue.push({
            operation: 'update',
            id,
            datos,
            timestamp: Date.now()
          });
        }

        return null;
      }

      // Invalidar cache relacionado
      if (invalidateCache) {
        this.invalidarCache(id);
      }

      return data;
    } catch (error) {
      this.manejarError('update', error);

      // Si falla, agregar a cola offline si está habilitado
      if (this.enableOfflineQueue) {
        this.offlineQueue.push({
          operation: 'update',
          id,
          datos,
          timestamp: Date.now()
        });
      }

      return null;
    }
  }

  /**
   * Eliminar un registro
   *
   * @param {string} id - ID del registro
   * @param {boolean} invalidateCache - Invalidar cache (default: true)
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  async delete(id, invalidateCache = true) {
    // Si no hay conexión y offline queue está habilitado, agregar a cola
    if (!navigator.onLine && this.enableOfflineQueue) {
      this.offlineQueue.push({
        operation: 'delete',
        id,
        timestamp: Date.now()
      });
      return true;
    }

    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        this.manejarError('delete', error);

        // Si falla, agregar a cola offline si está habilitado
        if (this.enableOfflineQueue) {
          this.offlineQueue.push({
            operation: 'delete',
            id,
            timestamp: Date.now()
          });
        }

        return false;
      }

      // Invalidar cache relacionado
      if (invalidateCache) {
        this.invalidarCache(id);
      }

      return true;
    } catch (error) {
      this.manejarError('delete', error);

      // Si falla, agregar a cola offline si está habilitado
      if (this.enableOfflineQueue) {
        this.offlineQueue.push({
          operation: 'delete',
          id,
          timestamp: Date.now()
        });
      }

      return false;
    }
  }

  /**
   * Invalidar cache
   * @param {string} id - ID específico a invalidar (opcional)
   */
  invalidarCache(id = null) {
    if (id) {
      // Invalidar entradas específicas de este ID
      for (const clave of this.cache.keys()) {
        if (clave.includes(`:${id}:`)) {
          this.cache.delete(clave);
        }
      }
    } else {
      // Invalidar todo el cache de esta tabla
      for (const clave of this.cache.keys()) {
        if (clave.startsWith(`${this.tableName}:`)) {
          this.cache.delete(clave);
        }
      }
    }
  }

  /**
   * Limpiar todo el cache
   */
  limpiarCache() {
    this.cache.clear();
  }

  /**
   * Obtener usuario autenticado actual
   * @returns {Object|null} Usuario actual o null
   */
  getCurrentUser() {
    return this.authHelper?.getCurrentUser() || null;
  }

  /**
   * Obtener ID del usuario autenticado actual
   * @returns {string|null} ID del usuario o null
   */
  getCurrentUserId() {
    const usuario = this.getCurrentUser();
    return usuario?.id || null;
  }

  /**
   * Verificar si el usuario está autenticado
   * @returns {boolean} true si está autenticado
   */
  isAuthenticated() {
    return this.authHelper?.isAuthenticated() || false;
  }

  /**
   * Manejo centralizado de errores
   * @param {string} operacion - Nombre de la operación
   * @param {Error} error - Error a manejar
   */
  manejarError(operacion, error) {
    logger.error(`[${this.tableName}] Error en ${operacion}:`, error);

    // Emitir evento de error para que la UI pueda reaccionar
    window.dispatchEvent(new CustomEvent('service-error', {
      detail: {
        servicio: this.tableName,
        operacion,
        error: error.message || error
      }
    }));
  }

  /**
   * Configurar procesador de cola offline
   * Procesa operaciones pendientes cuando se recupera la conexión
   */
  setupOfflineQueueProcessor() {
    // Procesar cola cuando se recupera la conexión
    window.addEventListener('online', async () => {
      if (this.offlineQueue.length > 0) {
        logger.debug(`[${this.tableName}] Procesando ${this.offlineQueue.length} operaciones offline...`);
        await this.procesarColaOffline();
      }
    });

    // Procesar cola cada 60 segundos si hay items pendientes (solo cuando app visible)
    this._offlineQueueInterval = setInterval(async () => {
      if (document.hidden) return; // No procesar en segundo plano
      if (navigator.onLine && this.offlineQueue.length > 0) {
        await this.procesarColaOffline();
      }
    }, 60000);
  }

  /**
   * Limpiar intervalo de cola offline
   */
  stopOfflineQueueProcessing() {
    if (this._offlineQueueInterval) {
      clearInterval(this._offlineQueueInterval);
      this._offlineQueueInterval = null;
    }
  }

  /**
   * Procesar operaciones pendientes en la cola offline
   */
  async procesarColaOffline() {
    const operacionesPendientes = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const operacion of operacionesPendientes) {
      try {
        switch (operacion.operation) {
          case 'create':
            await this.create(operacion.datos, false);
            break;
          case 'update':
            await this.update(operacion.id, operacion.datos, false);
            break;
          case 'delete':
            await this.delete(operacion.id, false);
            break;
        }
      } catch (error) {
        // Si falla, volver a agregar a la cola
        this.offlineQueue.push(operacion);
      }
    }

    // Invalidar cache después de procesar todas las operaciones
    if (operacionesPendientes.length > 0) {
      this.invalidarCache();
      logger.debug(`[${this.tableName}] ${operacionesPendientes.length} operaciones offline procesadas`);
    }
  }

  /**
   * Obtener estadísticas del servicio
   * @returns {Object} Estadísticas
   */
  getStats() {
    return {
      tabla: this.tableName,
      entradasCache: this.cache.size,
      operacionesOffline: this.offlineQueue.length,
      cacheTTL: this.cacheTTL,
      offlineQueueEnabled: this.enableOfflineQueue
    };
  }
}

// Exportar a window
window.BaseService = BaseService;
