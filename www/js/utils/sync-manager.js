/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * SYNC MANAGER
 * Sistema robusto de sincronización con Supabase
 *
 * 🔧 FIX #99: Manejo de errores y reintentos para sincronización
 *
 * Características:
 * - Cola de sincronización con procesamiento secuencial
 * - Reintentos automáticos con backoff exponencial
 * - Persistencia de operaciones fallidas en localStorage
 * - Feedback visual al usuario
 * - Recuperación de operaciones pendientes al iniciar
 *
 * @version 1.0.0
 */

class SyncManager {
  constructor() {
    this.queue = [];
    this.syncing = false;
    this.retryAttempts = 3;
    this.pendingQueueKey = 'sync-pending-queue';
    this.syncStats = {
      successful: 0,
      failed: 0,
      pending: 0
    };

    // Cargar operaciones pendientes al iniciar
    this.loadPendingQueue();

    logger.debug('[SyncManager] Inicializado');
  }

  /**
   * Añadir operación a la cola de sincronización
   * @param {string} operation - Tipo de operación (settings, progress, notes, etc.)
   * @param {Object} data - Datos a sincronizar
   * @param {Object} options - Opciones adicionales
   */
  async sync(operation, data, options = {}) {
    const item = {
      id: this.generateId(),
      operation,
      data,
      options,
      attempts: 0,
      timestamp: Date.now()
    };

    this.queue.push(item);
    this.syncStats.pending = this.queue.length;

    logger.debug('[SyncManager] Operación añadida a la cola:', operation);

    // Iniciar procesamiento si no está activo
    if (!this.syncing) {
      await this.processQueue();
    }

    return item.id;
  }

  /**
   * Procesar cola de sincronización
   */
  async processQueue() {
    if (this.syncing) {
      logger.debug('[SyncManager] Ya hay un proceso de sincronización en curso');
      return;
    }

    this.syncing = true;
    logger.debug('[SyncManager] Iniciando procesamiento de cola...');

    while (this.queue.length > 0) {
      const item = this.queue[0];

      try {
        // Ejecutar operación
        await this.executeSync(item);

        // Operación exitosa - remover de cola
        this.queue.shift();
        this.syncStats.successful++;
        this.syncStats.pending = this.queue.length;

        logger.debug('[SyncManager] ✅ Operación completada:', item.operation);

        // Feedback al usuario (opcional)
        if (item.options.showSuccessToast && window.toast) {
          window.toast.success('✅ Sincronizado correctamente');
        }

      } catch (error) {
        console.error('[SyncManager] ❌ Error en operación:', item.operation, error);

        item.attempts++;

        if (item.attempts >= this.retryAttempts) {
          // Falló después de todos los reintentos
          console.warn('[SyncManager] Operación fallida tras', this.retryAttempts, 'intentos');

          this.queue.shift();
          this.syncStats.failed++;
          this.syncStats.pending = this.queue.length;

          // Guardar en cola persistente para retry posterior
          this.saveForLater(item);

          // Feedback al usuario
          if (window.toast) {
            window.toast.error('❌ Error al sincronizar. Se reintentará más tarde.');
          }

        } else {
          // Reintentar después de un delay con backoff exponencial
          const delay = this.calculateBackoff(item.attempts);
          logger.debug('[SyncManager] Reintentando en', delay, 'ms (intento', item.attempts + 1, '/', this.retryAttempts + ')');

          await new Promise(resolve => setTimeout(resolve, delay));
          // No remover de la cola - se volverá a intentar en el próximo ciclo
        }
      }
    }

    this.syncing = false;
    logger.debug('[SyncManager] Procesamiento de cola finalizado');
  }

  /**
   * Ejecutar operación de sincronización
   * @param {Object} item - Item de la cola
   */
  async executeSync(item) {
    const { operation, data } = item;

    // Verificar que el usuario está autenticado
    if (!window.supabaseAuthHelper?.isAuthenticated()) {
      throw new Error('Usuario no autenticado');
    }

    // Ejecutar según el tipo de operación
    switch (operation) {
      case 'settings':
        await this.syncSettings(data);
        break;

      case 'progress':
        await this.syncProgress(data);
        break;

      case 'notes':
        await this.syncNotes(data);
        break;

      case 'achievements':
        await this.syncAchievements(data);
        break;

      case 'streak':
        await this.syncStreak(data);
        break;

      default:
        console.warn('[SyncManager] Tipo de operación desconocida:', operation);
        // Usar syncSettingsToCloud como fallback
        if (window.supabaseSyncHelper && data.keys) {
          await window.supabaseSyncHelper.syncSettingsToCloud(data.keys);
        }
    }
  }

  /**
   * Sincronizar configuración
   */
  async syncSettings(data) {
    if (!window.supabaseSyncHelper) {
      throw new Error('supabaseSyncHelper no disponible');
    }

    const keys = data.keys || [];
    await window.supabaseSyncHelper.syncSettingsToCloud(keys);
  }

  /**
   * Sincronizar progreso de lectura
   */
  async syncProgress(data) {
    const { bookId, progress } = data;

    if (!window.supabaseClient) {
      throw new Error('supabaseClient no disponible');
    }

    const userId = window.supabaseAuthHelper.user.id;

    const { error } = await window.supabaseClient
      .from('reading_progress')
      .upsert({
        user_id: userId,
        book_id: bookId,
        progress_data: progress,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  /**
   * Sincronizar notas
   */
  async syncNotes(data) {
    const { noteId, noteData } = data;

    if (!window.supabaseClient) {
      throw new Error('supabaseClient no disponible');
    }

    const userId = window.supabaseAuthHelper.user.id;

    const { error } = await window.supabaseClient
      .from('notes')
      .upsert({
        user_id: userId,
        note_id: noteId,
        note_data: noteData,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  /**
   * Sincronizar achievements
   */
  async syncAchievements(data) {
    if (!window.supabaseSyncHelper || !window.supabaseSyncHelper.syncAchievementsToCloud) {
      throw new Error('Método de sincronización de achievements no disponible');
    }

    await window.supabaseSyncHelper.syncAchievementsToCloud(data);
  }

  /**
   * Sincronizar streak
   */
  async syncStreak(data) {
    if (!window.supabaseSyncHelper || !window.supabaseSyncHelper.syncStreakData) {
      throw new Error('Método de sincronización de streak no disponible');
    }

    await window.supabaseSyncHelper.syncStreakData(data);
  }

  /**
   * Calcular delay con backoff exponencial
   * @param {number} attempt - Número de intento
   * @returns {number} Delay en milisegundos
   */
  calculateBackoff(attempt) {
    // Backoff exponencial: 1s, 2s, 4s
    const baseDelay = 1000;
    return Math.min(baseDelay * Math.pow(2, attempt - 1), 10000);
  }

  /**
   * Guardar operación fallida para retry posterior
   * @param {Object} item - Item fallido
   */
  saveForLater(item) {
    try {
      const pending = this.loadPendingQueueFromStorage();

      // Agregar timestamp de fallo
      item.failedAt = Date.now();

      pending.push(item);

      // Mantener solo las últimas 50 operaciones fallidas
      const trimmed = pending.slice(-50);

      localStorage.setItem(this.pendingQueueKey, JSON.stringify(trimmed));

      logger.debug('[SyncManager] Operación guardada para retry posterior');
    } catch (error) {
      console.error('[SyncManager] Error guardando operación fallida:', error);
    }
  }

  /**
   * Cargar cola pendiente desde localStorage
   */
  loadPendingQueue() {
    const pending = this.loadPendingQueueFromStorage();

    if (pending.length > 0) {
      logger.debug('[SyncManager] Cargadas', pending.length, 'operaciones pendientes');

      // Reintentar operaciones pendientes en el próximo tick
      setTimeout(() => this.retryPending(), 2000);
    }
  }

  /**
   * Cargar array de operaciones pendientes desde localStorage
   */
  loadPendingQueueFromStorage() {
    try {
      const stored = localStorage.getItem(this.pendingQueueKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[SyncManager] Error cargando cola pendiente:', error);
      return [];
    }
  }

  /**
   * Reintentar operaciones pendientes
   */
  async retryPending() {
    const pending = this.loadPendingQueueFromStorage();

    if (pending.length === 0) {
      return;
    }

    logger.debug('[SyncManager] Reintentando', pending.length, 'operaciones pendientes...');

    // Verificar autenticación antes de reintentar
    if (!window.supabaseAuthHelper?.isAuthenticated()) {
      console.warn('[SyncManager] Usuario no autenticado. No se pueden reintentar operaciones.');
      return;
    }

    // Resetear intentos y añadir a la cola
    for (const item of pending) {
      item.attempts = 0; // Reset attempts
      this.queue.push(item);
    }

    this.syncStats.pending = this.queue.length;

    // Limpiar cola persistente
    localStorage.removeItem(this.pendingQueueKey);

    // Procesar cola
    await this.processQueue();
  }

  /**
   * Generar ID único para operaciones
   */
  generateId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtener estadísticas de sincronización
   */
  getStats() {
    return {
      ...this.syncStats,
      queueLength: this.queue.length,
      syncing: this.syncing,
      pendingStorage: this.loadPendingQueueFromStorage().length
    };
  }

  /**
   * Limpiar todas las colas
   */
  clearAll() {
    this.queue = [];
    this.syncStats = {
      successful: 0,
      failed: 0,
      pending: 0
    };
    localStorage.removeItem(this.pendingQueueKey);
    logger.debug('[SyncManager] Todas las colas han sido limpiadas');
  }

  /**
   * Obtener información de debug
   */
  getDebugInfo() {
    return {
      stats: this.getStats(),
      queue: this.queue.map(item => ({
        id: item.id,
        operation: item.operation,
        attempts: item.attempts,
        timestamp: item.timestamp
      })),
      pending: this.loadPendingQueueFromStorage().map(item => ({
        id: item.id,
        operation: item.operation,
        failedAt: item.failedAt
      }))
    };
  }
}

// Crear instancia global
window.syncManager = new SyncManager();

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SyncManager;
}

logger.debug('[SyncManager] Módulo cargado');
