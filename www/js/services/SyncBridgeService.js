/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * SYNC BRIDGE SERVICE
 * ===================
 *
 * Servicio de sincronización bidireccional entre webapp y mobile game (Awakening Protocol)
 * para el proyecto Colección Nuevo Ser.
 *
 * CARACTERÍSTICAS:
 * - Sincronización de progreso de lectura
 * - Sincronización de logros/achievements
 * - Sincronización de "seres" creados en el mobile game
 * - Resolución de conflictos por timestamp (más reciente gana)
 * - Eventos via eventBus cuando hay cambios
 * - Queue offline-first para cambios sin conexión
 *
 * DEPENDENCIAS:
 * - window.supabase (cliente Supabase)
 * - window.eventBus (sistema de eventos)
 * - window.authHelper (autenticación)
 *
 * USO:
 * ```javascript
 * // Inicializar
 * await window.syncBridge.init();
 *
 * // Sincronizar manualmente
 * await window.syncBridge.sync();
 *
 * // Escuchar eventos de sincronización
 * eventBus.on('sync.completed', (data) => {
 *   logger.debug('Sync completado:', data);
 * });
 * ```
 *
 * @version 1.0.0
 */

class SyncBridgeService {
  constructor() {
    this.supabase = null;
    this.user = null;
    this.platform = 'web';
    this.deviceId = this.getOrCreateDeviceId();
    this.lastSync = null;
    this.syncInterval = null;
    this.autoSyncEnabled = true;
    this.autoSyncIntervalMs = 5 * 60 * 1000; // 5 minutos
    this.syncQueue = []; // Cola para operaciones offline
    this.isSyncing = false;
    this.initialized = false;
  }

  // ========================================================================
  // INICIALIZACIÓN
  // ========================================================================

  /**
   * Inicializa el servicio de sincronización
   */
  async init() {
    if (this.initialized) {
      logger.debug('[SyncBridge] Ya inicializado');
      return;
    }

    try {
      // Verificar dependencias
      if (!window.supabase) {
        console.warn('[SyncBridge] Supabase no disponible, sincronización deshabilitada');
        return;
      }

      if (!window.eventBus) {
        console.warn('[SyncBridge] EventBus no disponible');
        return;
      }

      this.supabase = window.supabase;

      // Escuchar cambios de autenticación
      if (window.authHelper) {
        window.authHelper.onAuthStateChange((event, session) => {
          this.handleAuthChange(event, session);
        });

        // Obtener usuario actual
        this.user = window.authHelper.user;
      }

      // Cargar timestamp de última sincronización
      this.loadLastSyncTimestamp();

      // Procesar cola offline al reconectar
      this.processQueueOnReconnect();

      // Iniciar sincronización automática si hay usuario
      if (this.user && this.autoSyncEnabled) {
        this.startAutoSync();
      }

      this.initialized = true;
      logger.debug('[SyncBridge] ✓ Inicializado correctamente');

      // Emitir evento
      window.eventBus?.emit('sync.initialized', {
        platform: this.platform,
        deviceId: this.deviceId,
        autoSync: this.autoSyncEnabled
      });

    } catch (error) {
      console.error('[SyncBridge] Error en inicialización:', error);
    }
  }

  // ========================================================================
  // SINCRONIZACIÓN PRINCIPAL
  // ========================================================================

  /**
   * Ejecuta sincronización bidireccional completa
   */
  async sync(options = {}) {
    const { force = false, silent = false } = options;

    // Validar precondiciones
    if (!this.user) {
      if (!silent) logger.debug('[SyncBridge] No hay usuario autenticado');
      return { success: false, reason: 'no_user' };
    }

    if (this.isSyncing && !force) {
      if (!silent) logger.debug('[SyncBridge] Sincronización en progreso...');
      return { success: false, reason: 'already_syncing' };
    }

    this.isSyncing = true;

    try {
      if (!silent) logger.debug('[SyncBridge] Iniciando sincronización...');

      // Emitir evento de inicio
      window.eventBus?.emit('sync.started', {
        timestamp: new Date().toISOString(),
        platform: this.platform
      });

      // 1. Push: Enviar cambios locales a Supabase
      const pushResults = await this.pushLocalChanges();

      // 2. Pull: Obtener cambios remotos desde última sincronización
      const pullResults = await this.pullRemoteChanges();

      // 3. Procesar cola de operaciones pendientes
      await this.processOfflineQueue();

      // 4. Actualizar timestamp de última sincronización
      this.lastSync = new Date();
      this.saveLastSyncTimestamp();

      // 5. Actualizar sync_state en Supabase
      await this.updateSyncState();

      const syncResults = {
        success: true,
        timestamp: this.lastSync.toISOString(),
        pushed: pushResults,
        pulled: pullResults,
        queueProcessed: this.syncQueue.length === 0
      };

      if (!silent) {
        logger.debug('[SyncBridge] ✓ Sincronización completada', syncResults);
      }

      // Emitir evento de completado
      window.eventBus?.emit('sync.completed', syncResults);

      return syncResults;

    } catch (error) {
      console.error('[SyncBridge] Error en sincronización:', error);

      // Emitir evento de error
      window.eventBus?.emit('sync.error', {
        error: error.message,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        error: error.message
      };

    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Push: Envía cambios locales a Supabase
   */
  async pushLocalChanges() {
    const results = {
      readingProgress: 0,
      achievements: 0,
      beings: 0
    };

    try {
      // 1. Sincronizar progreso de lectura
      const readingProgressData = this.getLocalReadingProgress();
      if (readingProgressData.length > 0) {
        results.readingProgress = await this.syncReadingProgress(readingProgressData);
      }

      // 2. Sincronizar achievements (si existen localmente)
      const achievementsData = this.getLocalAchievements();
      if (achievementsData.length > 0) {
        results.achievements = await this.syncAchievements(achievementsData);
      }

      // Nota: Los beings se crean principalmente en mobile, no en web

      return results;

    } catch (error) {
      console.error('[SyncBridge] Error en push:', error);
      throw error;
    }
  }

  /**
   * Pull: Obtiene cambios remotos desde Supabase
   */
  async pullRemoteChanges() {
    const results = {
      beings: 0,
      readingProgress: 0,
      achievements: 0
    };

    try {
      const lastSyncTimestamp = this.lastSync?.toISOString() || '1970-01-01T00:00:00Z';

      // Llamar función RPC para obtener cambios
      const { data, error } = await this.supabase.rpc('get_changes_since', {
        p_user_id: this.user.id,
        p_platform: this.platform,
        p_last_sync: lastSyncTimestamp
      });

      if (error) throw error;

      if (data) {
        // 1. Procesar beings recibidos
        if (data.beings && data.beings.length > 0) {
          results.beings = await this.applyRemoteBeings(data.beings);
        }

        // 2. Procesar progreso de lectura
        if (data.reading_progress && data.reading_progress.length > 0) {
          results.readingProgress = await this.applyRemoteReadingProgress(data.reading_progress);
        }

        // 3. Procesar achievements
        if (data.achievements && data.achievements.length > 0) {
          results.achievements = await this.applyRemoteAchievements(data.achievements);
        }
      }

      return results;

    } catch (error) {
      console.error('[SyncBridge] Error en pull:', error);
      throw error;
    }
  }

  // ========================================================================
  // SINCRONIZACIÓN DE PROGRESO DE LECTURA
  // ========================================================================

  /**
   * Obtiene progreso de lectura local desde localStorage
   */
  getLocalReadingProgress() {
    try {
      const readProgressStr = localStorage.getItem('read_progress');
      if (!readProgressStr) return [];

      const readProgress = JSON.parse(readProgressStr);
      const progressArray = [];

      // Convertir objeto { book_chapter: true } a array estructurado
      Object.keys(readProgress).forEach(key => {
        const parts = key.split('_');
        if (parts.length >= 2) {
          const bookId = parts[0];
          const chapterId = parts.slice(1).join('_');

          progressArray.push({
            book_id: bookId,
            chapter_id: chapterId,
            completed: readProgress[key] === true,
            progress_percentage: readProgress[key] === true ? 100 : 0,
            last_position: 0,
            reading_time_seconds: 0,
            last_read_at: new Date().toISOString()
          });
        }
      });

      return progressArray;

    } catch (error) {
      console.error('[SyncBridge] Error obteniendo progreso local:', error);
      return [];
    }
  }

  /**
   * Sincroniza progreso de lectura con Supabase
   */
  async syncReadingProgress(progressArray) {
    let syncedCount = 0;

    try {
      for (const progress of progressArray) {
        const { data, error } = await this.supabase.rpc('sync_entity', {
          p_user_id: this.user.id,
          p_entity_type: 'reading_progress',
          p_entity_id: `${progress.book_id}_${progress.chapter_id}`,
          p_data: progress,
          p_platform: this.platform,
          p_modified_at: progress.last_read_at
        });

        if (!error && data?.status !== 'conflict') {
          syncedCount++;
        } else if (data?.status === 'conflict') {
          logger.debug('[SyncBridge] Conflicto en progreso:', progress.book_id, progress.chapter_id);
          // Emitir evento de conflicto
          window.eventBus?.emit('sync.conflict', {
            type: 'reading_progress',
            local: progress,
            remote: data.server_data
          });
        }
      }

      return syncedCount;

    } catch (error) {
      console.error('[SyncBridge] Error sincronizando progreso:', error);
      return syncedCount;
    }
  }

  /**
   * Aplica progreso de lectura remoto a localStorage
   */
  async applyRemoteReadingProgress(remoteProgress) {
    let appliedCount = 0;

    try {
      const readProgressStr = localStorage.getItem('read_progress') || '{}';
      const readProgress = JSON.parse(readProgressStr);

      remoteProgress.forEach(item => {
        const key = `${item.book_id}_${item.chapter_id}`;

        // Solo aplicar si no existe localmente o si el remoto es más reciente
        if (!readProgress[key] || item.completed) {
          readProgress[key] = item.completed;
          appliedCount++;

          // Emitir evento de cambio
          window.eventBus?.emit('sync.reading_progress.updated', {
            bookId: item.book_id,
            chapterId: item.chapter_id,
            completed: item.completed
          });
        }
      });

      localStorage.setItem('read_progress', JSON.stringify(readProgress));

      return appliedCount;

    } catch (error) {
      console.error('[SyncBridge] Error aplicando progreso remoto:', error);
      return appliedCount;
    }
  }

  // ========================================================================
  // SINCRONIZACIÓN DE BEINGS
  // ========================================================================

  /**
   * Aplica beings remotos recibidos desde mobile game
   */
  async applyRemoteBeings(remoteBeings) {
    let appliedCount = 0;

    try {
      // Guardar beings en localStorage para que puedan ser usados en la webapp
      const beingsStr = localStorage.getItem('synced_beings') || '[]';
      const localBeings = JSON.parse(beingsStr);

      remoteBeings.forEach(remoteBeing => {
        // Buscar si ya existe localmente
        const existingIndex = localBeings.findIndex(b => b.being_id === remoteBeing.being_id);

        if (existingIndex >= 0) {
          // Actualizar si el remoto es más reciente
          const localModified = new Date(localBeings[existingIndex].last_modified_at);
          const remoteModified = new Date(remoteBeing.last_modified_at);

          if (remoteModified > localModified) {
            localBeings[existingIndex] = remoteBeing;
            appliedCount++;
          }
        } else {
          // Agregar nuevo being
          localBeings.push(remoteBeing);
          appliedCount++;
        }
      });

      localStorage.setItem('synced_beings', JSON.stringify(localBeings));

      if (appliedCount > 0) {
        // Emitir evento de cambio
        window.eventBus?.emit('sync.beings.updated', {
          count: appliedCount,
          beings: localBeings
        });
      }

      return appliedCount;

    } catch (error) {
      console.error('[SyncBridge] Error aplicando beings remotos:', error);
      return appliedCount;
    }
  }

  // ========================================================================
  // SINCRONIZACIÓN DE ACHIEVEMENTS
  // ========================================================================

  /**
   * Obtiene achievements locales
   */
  getLocalAchievements() {
    try {
      const achievementsStr = localStorage.getItem('achievements') || '[]';
      return JSON.parse(achievementsStr);
    } catch (error) {
      console.error('[SyncBridge] Error obteniendo achievements locales:', error);
      return [];
    }
  }

  /**
   * Sincroniza achievements con Supabase
   */
  async syncAchievements(achievementsArray) {
    let syncedCount = 0;

    try {
      for (const achievement of achievementsArray) {
        const { data, error } = await this.supabase.rpc('sync_entity', {
          p_user_id: this.user.id,
          p_entity_type: 'achievement',
          p_entity_id: achievement.achievement_id,
          p_data: achievement,
          p_platform: this.platform,
          p_modified_at: achievement.unlocked_at || new Date().toISOString()
        });

        if (!error && data?.status !== 'conflict') {
          syncedCount++;
        }
      }

      return syncedCount;

    } catch (error) {
      console.error('[SyncBridge] Error sincronizando achievements:', error);
      return syncedCount;
    }
  }

  /**
   * Aplica achievements remotos
   */
  async applyRemoteAchievements(remoteAchievements) {
    let appliedCount = 0;

    try {
      const achievementsStr = localStorage.getItem('achievements') || '[]';
      const localAchievements = JSON.parse(achievementsStr);

      remoteAchievements.forEach(remoteAchievement => {
        const existingIndex = localAchievements.findIndex(
          a => a.achievement_id === remoteAchievement.achievement_id
        );

        if (existingIndex >= 0) {
          // Actualizar si el remoto está más avanzado
          if (remoteAchievement.completed && !localAchievements[existingIndex].completed) {
            localAchievements[existingIndex] = remoteAchievement;
            appliedCount++;
          }
        } else {
          // Agregar nuevo achievement
          localAchievements.push(remoteAchievement);
          appliedCount++;
        }
      });

      localStorage.setItem('achievements', JSON.stringify(localAchievements));

      if (appliedCount > 0) {
        window.eventBus?.emit('sync.achievements.updated', {
          count: appliedCount,
          achievements: localAchievements
        });
      }

      return appliedCount;

    } catch (error) {
      console.error('[SyncBridge] Error aplicando achievements remotos:', error);
      return appliedCount;
    }
  }

  // ========================================================================
  // COLA OFFLINE-FIRST
  // ========================================================================

  /**
   * Agrega operación a la cola para procesar cuando haya conexión
   */
  queueOperation(operation) {
    this.syncQueue.push({
      ...operation,
      timestamp: new Date().toISOString(),
      retryCount: 0
    });

    this.saveQueueToStorage();
  }

  /**
   * Procesa cola de operaciones pendientes
   */
  async processOfflineQueue() {
    if (this.syncQueue.length === 0) return;

    logger.debug(`[SyncBridge] Procesando ${this.syncQueue.length} operaciones en cola...`);

    const failedOperations = [];

    for (const operation of this.syncQueue) {
      try {
        await this.executeQueuedOperation(operation);
      } catch (error) {
        console.error('[SyncBridge] Error procesando operación:', error);
        operation.retryCount++;

        if (operation.retryCount < 3) {
          failedOperations.push(operation);
        }
      }
    }

    this.syncQueue = failedOperations;
    this.saveQueueToStorage();
  }

  /**
   * Ejecuta operación de la cola
   */
  async executeQueuedOperation(operation) {
    const { entity_type, entity_id, data, operation_type } = operation;

    if (operation_type === 'create' || operation_type === 'update') {
      await this.supabase.rpc('sync_entity', {
        p_user_id: this.user.id,
        p_entity_type: entity_type,
        p_entity_id: entity_id,
        p_data: data,
        p_platform: this.platform,
        p_modified_at: operation.timestamp
      });
    }
  }

  /**
   * Procesa cola al reconectar
   */
  processQueueOnReconnect() {
    window.addEventListener('online', () => {
      logger.debug('[SyncBridge] Conexión restaurada, procesando cola...');
      this.processOfflineQueue();
    });
  }

  // ========================================================================
  // SINCRONIZACIÓN AUTOMÁTICA
  // ========================================================================

  /**
   * Inicia sincronización automática periódica
   */
  startAutoSync() {
    if (this.syncInterval) return;

    logger.debug(`[SyncBridge] Auto-sync activado (cada ${this.autoSyncIntervalMs / 1000}s)`);

    this.syncInterval = setInterval(() => {
      this.sync({ silent: true });
    }, this.autoSyncIntervalMs);
  }

  /**
   * Detiene sincronización automática
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.debug('[SyncBridge] Auto-sync desactivado');
    }
  }

  // ========================================================================
  // GESTIÓN DE ESTADO
  // ========================================================================

  /**
   * Actualiza registro de sync_state en Supabase
   */
  async updateSyncState() {
    try {
      const { error } = await this.supabase
        .from('sync_state')
        .upsert({
          user_id: this.user.id,
          platform: this.platform,
          device_id: this.deviceId,
          last_sync_at: new Date().toISOString(),
          sync_status: 'idle'
        }, {
          onConflict: 'user_id,platform,device_id'
        });

      if (error) throw error;

    } catch (error) {
      console.error('[SyncBridge] Error actualizando sync_state:', error);
    }
  }

  /**
   * Maneja cambios de autenticación
   */
  handleAuthChange(event, session) {
    this.user = session?.user || null;

    if (event === 'SIGNED_IN' && this.autoSyncEnabled) {
      logger.debug('[SyncBridge] Usuario autenticado, iniciando sync...');
      this.sync({ silent: true });
      this.startAutoSync();
    } else if (event === 'SIGNED_OUT') {
      logger.debug('[SyncBridge] Usuario desconectado, deteniendo sync');
      this.stopAutoSync();
    }
  }

  // ========================================================================
  // PERSISTENCIA LOCAL
  // ========================================================================

  /**
   * Genera o recupera Device ID único
   */
  getOrCreateDeviceId() {
    let deviceId = localStorage.getItem('sync_device_id');

    if (!deviceId) {
      deviceId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('sync_device_id', deviceId);
    }

    return deviceId;
  }

  /**
   * Guarda timestamp de última sincronización
   */
  saveLastSyncTimestamp() {
    if (this.lastSync) {
      localStorage.setItem('sync_last_sync', this.lastSync.toISOString());
    }
  }

  /**
   * Carga timestamp de última sincronización
   */
  loadLastSyncTimestamp() {
    const lastSyncStr = localStorage.getItem('sync_last_sync');
    if (lastSyncStr) {
      this.lastSync = new Date(lastSyncStr);
    }
  }

  /**
   * Guarda cola de sincronización
   */
  saveQueueToStorage() {
    localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
  }

  /**
   * Carga cola de sincronización
   */
  loadQueueFromStorage() {
    try {
      const queueStr = localStorage.getItem('sync_queue');
      if (queueStr) {
        this.syncQueue = JSON.parse(queueStr);
      }
    } catch (error) {
      console.error('[SyncBridge] Error cargando cola:', error);
      this.syncQueue = [];
    }
  }

  // ========================================================================
  // API PÚBLICA
  // ========================================================================

  /**
   * Obtiene beings sincronizados
   */
  getSyncedBeings() {
    try {
      const beingsStr = localStorage.getItem('synced_beings') || '[]';
      return JSON.parse(beingsStr);
    } catch (error) {
      console.error('[SyncBridge] Error obteniendo beings:', error);
      return [];
    }
  }

  /**
   * Obtiene estado de sincronización
   */
  getSyncStatus() {
    return {
      initialized: this.initialized,
      syncing: this.isSyncing,
      lastSync: this.lastSync,
      autoSync: this.autoSyncEnabled,
      queueSize: this.syncQueue.length,
      platform: this.platform,
      deviceId: this.deviceId,
      user: this.user ? {
        id: this.user.id,
        email: this.user.email
      } : null
    };
  }

  /**
   * Fuerza sincronización inmediata
   */
  async forceSync() {
    return await this.sync({ force: true, silent: false });
  }
}

// ============================================================================
// INICIALIZACIÓN GLOBAL
// ============================================================================

// Crear instancia global
window.syncBridge = new SyncBridgeService();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.syncBridge.init();
  });
} else {
  // DOM ya está listo
  window.syncBridge.init();
}

logger.debug('[SyncBridge] Servicio cargado - Accesible como window.syncBridge');
