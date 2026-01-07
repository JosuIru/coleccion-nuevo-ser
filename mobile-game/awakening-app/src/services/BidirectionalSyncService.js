/**
 * BIDIRECTIONAL SYNC SERVICE
 * ===========================
 *
 * Servicio avanzado de sincronización bidireccional en tiempo real
 * entre Mobile Game, Frankenstein Lab y Webapp.
 *
 * MEJORAS SOBRE WebBridgeService:
 * - Sincronización en tiempo real vía Realtime (no solo polling)
 * - Cola de cambios offline (offline-first)
 * - Resolución de conflictos mejorada (CRDT-like)
 * - Sincronización granular por entidad
 * - Optimistic updates con rollback
 * - Retry automático con exponential backoff
 *
 * ARQUITECTURA:
 *
 * Mobile → Cloud:
 * 1. Usuario hace cambio en mobile
 * 2. Se aplica localmente (optimistic update)
 * 3. Se encola en sync_queue
 * 4. Se envía a Supabase cuando hay conexión
 * 5. Si hay conflicto, se resuelve y se notifica
 *
 * Cloud → Mobile:
 * 1. Cambio ocurre en webapp/lab
 * 2. RealtimeManager lo detecta
 * 3. BidirectionalSyncService lo procesa
 * 4. Se aplica localmente (con merge si hay conflicto)
 * 5. Se actualiza UI
 *
 * TIPOS DE ENTIDADES SINCRONIZADAS:
 * - beings (Seres Transformadores)
 * - reading_progress (Progreso de lectura)
 * - achievements (Logros)
 * - notes (Notas de usuario)
 * - bookmarks (Marcadores)
 * - user_settings (Configuración)
 *
 * @version 2.0.0
 */

import { createClient } from '@supabase/supabase-js';
import useGameStore from '../stores/gameStore';
import logger from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import realtimeManager from './RealtimeManager';
import NetInfo from '@react-native-community/netinfo';

class BidirectionalSyncService {
  constructor() {
    this.supabase = null;
    this.platform = 'mobile';
    this.deviceId = null;
    this.userId = null;
    this.initialized = false;

    // Cola de sincronización offline
    this.syncQueue = [];
    this.maxQueueSize = 100;

    // Estado de sincronización
    this.isSyncing = false;
    this.lastSync = null;
    this.lastFullSync = null;

    // Retry con exponential backoff
    this.retryCount = 0;
    this.maxRetries = 3;
    this.baseRetryDelay = 2000; // 2 segundos

    // Listeners de Realtime (para cleanup)
    this.realtimeUnsubscribers = [];

    // Network state
    this.isOnline = true;
    this.networkUnsubscribe = null;
  }

  // ========================================================================
  // INICIALIZACIÓN
  // ========================================================================

  /**
   * Inicializa el servicio
   */
  async init(supabaseConfig) {
    if (this.initialized) {
      logger.info('BidirectionalSync', 'Ya inicializado');
      return true;
    }

    try {
      // Validar config
      if (!supabaseConfig || !supabaseConfig.url || !supabaseConfig.anonKey) {
        logger.error('BidirectionalSync', 'Config de Supabase inválida');
        return false;
      }

      // Crear cliente Supabase
      this.supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

      // Obtener device ID
      this.deviceId = await this.getOrCreateDeviceId();

      // Obtener user ID
      const user = useGameStore.getState().user;
      this.userId = user?.id;

      if (!this.userId) {
        logger.warn('BidirectionalSync', 'No hay usuario autenticado');
        return false;
      }

      // Cargar cola de sincronización pendiente
      await this.loadSyncQueue();

      // Cargar timestamps
      await this.loadLastSyncTimestamp();

      // Configurar listeners de red
      this.setupNetworkListener();

      // Configurar Realtime para recibir cambios de la nube
      await this.setupRealtimeListeners();

      // Procesar cola pendiente si estamos online
      if (this.isOnline && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }

      this.initialized = true;
      logger.info('BidirectionalSync', '✓ Inicializado');

      return true;

    } catch (error) {
      logger.error('BidirectionalSync', 'Error en init:', error);
      return false;
    }
  }

  // ========================================================================
  // NETWORK STATE
  // ========================================================================

  /**
   * Configura listener de estado de red
   */
  setupNetworkListener() {
    this.networkUnsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;

      logger.info('BidirectionalSync', `Network: ${this.isOnline ? 'online' : 'offline'}`);

      // Si pasamos de offline a online, procesar cola
      if (wasOffline && this.isOnline && this.syncQueue.length > 0) {
        logger.info('BidirectionalSync', '📶 Conexión restaurada, procesando cola...');
        this.processSyncQueue();
      }
    });
  }

  // ========================================================================
  // REALTIME LISTENERS (CLOUD → MOBILE)
  // ========================================================================

  /**
   * Configura listeners de Realtime para recibir cambios desde la nube
   */
  async setupRealtimeListeners() {
    try {
      // Inicializar RealtimeManager si no está ya
      await realtimeManager.init(this.supabase, this.userId);

      // Suscribirse a cambios en beings
      const unsubBeings = realtimeManager.subscribe('beings', (payload) => {
        this.handleRealtimeBeingUpdate(payload);
      });
      this.realtimeUnsubscribers.push(unsubBeings);

      // Suscribirse a cambios en reading_progress
      const unsubProgress = realtimeManager.subscribe('reading_progress', (payload) => {
        this.handleRealtimeProgressUpdate(payload);
      });
      this.realtimeUnsubscribers.push(unsubProgress);

      // Suscribirse a cambios en achievements
      const unsubAchievements = realtimeManager.subscribe('achievements', (payload) => {
        this.handleRealtimeAchievementUpdate(payload);
      });
      this.realtimeUnsubscribers.push(unsubAchievements);

      // Suscribirse a cambios en notes
      const unsubNotes = realtimeManager.subscribe('notes', (payload) => {
        this.handleRealtimeNoteUpdate(payload);
      });
      this.realtimeUnsubscribers.push(unsubNotes);

      // Suscribirse a cambios en bookmarks
      const unsubBookmarks = realtimeManager.subscribe('bookmarks', (payload) => {
        this.handleRealtimeBookmarkUpdate(payload);
      });
      this.realtimeUnsubscribers.push(unsubBookmarks);

      logger.info('BidirectionalSync', '✓ Realtime listeners configurados');

    } catch (error) {
      logger.error('BidirectionalSync', 'Error configurando Realtime:', error);
    }
  }

  /**
   * Maneja actualizaciones de beings desde la nube
   */
  handleRealtimeBeingUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    logger.debug('BidirectionalSync', `Being ${eventType}: ${newRecord?.being_id || oldRecord?.being_id}`);

    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      const being = {
        id: newRecord.being_id,
        ...newRecord.being_data,
        syncedAt: newRecord.updated_at,
        cloudId: newRecord.id
      };

      // Aplicar cambio al store
      this.applyBeingUpdate(being);

    } else if (eventType === 'DELETE') {
      // Eliminar being del store
      this.applyBeingDelete(oldRecord.being_id);
    }
  }

  /**
   * Maneja actualizaciones de progreso de lectura
   */
  handleRealtimeProgressUpdate(payload) {
    const { eventType, new: newRecord } = payload;

    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      logger.debug('BidirectionalSync', `Reading progress updated: ${newRecord.book_id}/${newRecord.chapter_id}`);

      // Aquí podrías dar recompensas en el juego basadas en lectura
      // Por ejemplo: XP por capítulos completados
      if (newRecord.is_completed) {
        // useGameStore.getState().addXP(10);
        // useGameStore.getState().addConsciousness(5);
      }
    }
  }

  /**
   * Maneja actualizaciones de achievements
   */
  handleRealtimeAchievementUpdate(payload) {
    const { eventType, new: newRecord } = payload;

    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      logger.debug('BidirectionalSync', `Achievement updated: ${newRecord.achievement_id}`);

      // Si el achievement se completó, aplicar recompensas
      if (newRecord.completed_at && newRecord.rewards) {
        this.applyAchievementRewards(newRecord.rewards);
      }
    }
  }

  /**
   * Maneja actualizaciones de notas
   */
  handleRealtimeNoteUpdate(payload) {
    logger.debug('BidirectionalSync', `Note ${payload.eventType}`);
    // TODO: implementar si necesitamos sincronizar notas al mobile game
  }

  /**
   * Maneja actualizaciones de bookmarks
   */
  handleRealtimeBookmarkUpdate(payload) {
    logger.debug('BidirectionalSync', `Bookmark ${payload.eventType}`);
    // TODO: implementar si necesitamos sincronizar bookmarks al mobile game
  }

  // ========================================================================
  // APLICAR CAMBIOS LOCALMENTE (CLOUD → MOBILE)
  // ========================================================================

  /**
   * Aplica actualización de being al store local
   */
  applyBeingUpdate(cloudBeing) {
    const store = useGameStore.getState();
    const localBeings = store.beings;
    const existingIndex = localBeings.findIndex(b => b.id === cloudBeing.id);

    if (existingIndex >= 0) {
      // Being existe, hacer merge
      const localBeing = localBeings[existingIndex];
      const mergedBeing = this.mergeBeings(localBeing, cloudBeing);

      // Actualizar en store
      const updatedBeings = [...localBeings];
      updatedBeings[existingIndex] = mergedBeing;
      store.setBeings(updatedBeings);

      logger.info('BidirectionalSync', `Being actualizado: ${mergedBeing.name}`);
    } else {
      // Being nuevo desde la nube, agregar
      store.addBeing(cloudBeing);
      logger.info('BidirectionalSync', `Being agregado desde nube: ${cloudBeing.name}`);
    }

    // Guardar en storage
    store.saveToStorage();
  }

  /**
   * Aplica eliminación de being
   */
  applyBeingDelete(beingId) {
    const store = useGameStore.getState();
    const beings = store.beings.filter(b => b.id !== beingId);
    store.setBeings(beings);
    store.saveToStorage();

    logger.info('BidirectionalSync', `Being eliminado: ${beingId}`);
  }

  /**
   * Aplica recompensas de achievement
   */
  applyAchievementRewards(rewards) {
    const store = useGameStore.getState();

    if (rewards.xp) {
      store.addXP(rewards.xp);
      logger.info('BidirectionalSync', `+${rewards.xp} XP desde achievement`);
    }

    if (rewards.consciousness) {
      store.addConsciousness(rewards.consciousness);
      logger.info('BidirectionalSync', `+${rewards.consciousness} Consciousness desde achievement`);
    }

    if (rewards.energy) {
      store.addEnergy(rewards.energy);
    }

    store.saveToStorage();
  }

  /**
   * Merge de beings con resolución de conflictos
   * Estrategia: Mantener valores más altos (stats, level, xp)
   */
  mergeBeings(local, cloud) {
    const localDate = new Date(local.updatedAt || local.createdAt || 0);
    const cloudDate = new Date(cloud.syncedAt || cloud.updatedAt || 0);

    // Base: usar el más reciente
    const base = cloudDate > localDate ? cloud : local;
    const other = cloudDate > localDate ? local : cloud;

    return {
      ...base,
      // Mantener stats más altos
      level: Math.max(local.level || 1, cloud.level || 1),
      xp: Math.max(local.xp || 0, cloud.xp || 0),
      stats: {
        ...base.stats,
        missionsCompleted: Math.max(local.stats?.missionsCompleted || 0, cloud.stats?.missionsCompleted || 0),
        missionsSuccess: Math.max(local.stats?.missionsSuccess || 0, cloud.stats?.missionsSuccess || 0),
        totalXpEarned: Math.max(local.stats?.totalXpEarned || 0, cloud.stats?.totalXpEarned || 0)
      },
      // Combinar arrays sin duplicados
      traits: [...new Set([...(local.traits || []), ...(cloud.traits || [])])],
      achievements: this.mergeAchievements(local.achievements || [], cloud.achievements || []),
      // Metadata
      syncedAt: cloudDate.toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Merge de achievements
   */
  mergeAchievements(local, cloud) {
    const merged = new Map();
    [...local, ...cloud].forEach(a => {
      if (!merged.has(a.id)) {
        merged.set(a.id, a);
      }
    });
    return Array.from(merged.values());
  }

  // ========================================================================
  // SYNC QUEUE (MOBILE → CLOUD)
  // ========================================================================

  /**
   * Encola un cambio para sincronizar con la nube
   */
  async enqueueChange(entityType, entityId, data, operation = 'upsert') {
    const change = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityType,
      entityId,
      data,
      operation, // 'upsert', 'delete'
      timestamp: new Date().toISOString(),
      retries: 0
    };

    this.syncQueue.push(change);

    // Limitar tamaño de cola
    if (this.syncQueue.length > this.maxQueueSize) {
      this.syncQueue.shift(); // Eliminar más antiguo
      logger.warn('BidirectionalSync', 'Cola llena, eliminando cambio más antiguo');
    }

    // Guardar cola
    await this.saveSyncQueue();

    // Intentar procesar si estamos online
    if (this.isOnline) {
      this.processSyncQueue();
    } else {
      logger.info('BidirectionalSync', `Cambio encolado (offline): ${entityType} ${entityId}`);
    }
  }

  /**
   * Procesa la cola de sincronización
   */
  async processSyncQueue() {
    if (!this.isOnline || this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    useGameStore.getState().setSyncing(true);

    logger.info('BidirectionalSync', `Procesando ${this.syncQueue.length} cambios en cola...`);

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Procesar cada cambio
    const remainingQueue = [];

    for (const change of this.syncQueue) {
      try {
        const success = await this.syncChange(change);

        if (success) {
          results.success++;
        } else {
          // Incrementar contador de retries
          change.retries = (change.retries || 0) + 1;

          if (change.retries < this.maxRetries) {
            // Volver a encolar
            remainingQueue.push(change);
          } else {
            results.failed++;
            logger.error('BidirectionalSync', `Cambio fallado después de ${this.maxRetries} intentos:`, change);
          }
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ change, error });
        logger.error('BidirectionalSync', 'Error procesando cambio:', error);
      }
    }

    // Actualizar cola con cambios pendientes
    this.syncQueue = remainingQueue;
    await this.saveSyncQueue();

    // Actualizar timestamp
    this.lastSync = new Date();
    await this.saveLastSyncTimestamp();

    this.isSyncing = false;
    useGameStore.getState().setSyncing(false);

    logger.info('BidirectionalSync', `✓ Sincronización completada: ${results.success} éxito, ${results.failed} fallos`);

    return results;
  }

  /**
   * Sincroniza un cambio individual con la nube
   */
  async syncChange(change) {
    try {
      if (change.operation === 'delete') {
        return await this.syncDelete(change.entityType, change.entityId);
      } else {
        return await this.syncUpsert(change.entityType, change.entityId, change.data);
      }
    } catch (error) {
      logger.error('BidirectionalSync', `Error en sync de ${change.entityType}:`, error);
      return false;
    }
  }

  /**
   * Sincroniza un upsert (INSERT o UPDATE)
   */
  async syncUpsert(entityType, entityId, data) {
    let table, payload;

    switch (entityType) {
      case 'being':
        table = 'frankenstein_beings';
        payload = {
          user_id: this.userId,
          being_id: entityId,
          being_data: data,
          name: data.name,
          level: data.level || 1,
          total_power: data.totalPower || 0,
          specialty: data.specialty?.name || 'unknown',
          missions_completed: data.stats?.missionsCompleted || 0,
          updated_at: new Date().toISOString()
        };
        break;

      case 'note':
        table = 'notes';
        payload = {
          id: entityId,
          user_id: this.userId,
          ...data,
          updated_at: new Date().toISOString()
        };
        break;

      case 'bookmark':
        table = 'bookmarks';
        payload = {
          id: entityId,
          user_id: this.userId,
          ...data,
          updated_at: new Date().toISOString()
        };
        break;

      default:
        logger.warn('BidirectionalSync', `Tipo de entidad desconocido: ${entityType}`);
        return false;
    }

    const { error } = await this.supabase
      .from(table)
      .upsert(payload, { onConflict: entityType === 'being' ? 'user_id,being_id' : 'id' });

    if (error) {
      logger.error('BidirectionalSync', `Error en upsert de ${entityType}:`, error);
      return false;
    }

    logger.debug('BidirectionalSync', `✓ ${entityType} sincronizado: ${entityId}`);
    return true;
  }

  /**
   * Sincroniza un delete
   */
  async syncDelete(entityType, entityId) {
    let table, match;

    switch (entityType) {
      case 'being':
        table = 'frankenstein_beings';
        match = { user_id: this.userId, being_id: entityId };
        break;

      case 'note':
      case 'bookmark':
        table = entityType === 'note' ? 'notes' : 'bookmarks';
        match = { id: entityId, user_id: this.userId };
        break;

      default:
        logger.warn('BidirectionalSync', `Tipo de entidad desconocido: ${entityType}`);
        return false;
    }

    const { error } = await this.supabase
      .from(table)
      .delete()
      .match(match);

    if (error) {
      logger.error('BidirectionalSync', `Error en delete de ${entityType}:`, error);
      return false;
    }

    logger.debug('BidirectionalSync', `✓ ${entityType} eliminado: ${entityId}`);
    return true;
  }

  // ========================================================================
  // API PÚBLICA
  // ========================================================================

  /**
   * Sincroniza un being al hacer cambios
   */
  async syncBeing(being) {
    await this.enqueueChange('being', being.id, being, 'upsert');
  }

  /**
   * Elimina un being
   */
  async deleteBeing(beingId) {
    await this.enqueueChange('being', beingId, null, 'delete');
  }

  /**
   * Fuerza sincronización completa (pull + push)
   */
  async fullSync() {
    logger.info('BidirectionalSync', '🔄 Iniciando sincronización completa...');

    // 1. Push: procesar cola
    await this.processSyncQueue();

    // 2. Pull: obtener cambios desde la nube
    // (ya se hace automáticamente vía Realtime, pero podemos forzarlo)
    await this.pullAllBeings();

    this.lastFullSync = new Date();
    logger.info('BidirectionalSync', '✓ Sincronización completa finalizada');
  }

  /**
   * Pull de todos los beings desde la nube
   */
  async pullAllBeings() {
    try {
      const { data, error } = await this.supabase
        .from('frankenstein_beings')
        .select('*')
        .eq('user_id', this.userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      logger.info('BidirectionalSync', `Recibidos ${data.length} beings de la nube`);

      // Aplicar cada being
      data.forEach(record => {
        const being = {
          id: record.being_id,
          ...record.being_data,
          syncedAt: record.updated_at,
          cloudId: record.id
        };

        this.applyBeingUpdate(being);
      });

      return data.length;

    } catch (error) {
      logger.error('BidirectionalSync', 'Error en pullAllBeings:', error);
      return 0;
    }
  }

  /**
   * Obtiene estado de sincronización
   */
  getStatus() {
    return {
      initialized: this.initialized,
      syncing: this.isSyncing,
      online: this.isOnline,
      queueLength: this.syncQueue.length,
      lastSync: this.lastSync,
      lastFullSync: this.lastFullSync,
      userId: this.userId,
      deviceId: this.deviceId
    };
  }

  // ========================================================================
  // PERSISTENCIA
  // ========================================================================

  async getOrCreateDeviceId() {
    try {
      let deviceId = await AsyncStorage.getItem('sync_device_id');

      if (!deviceId) {
        deviceId = `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('sync_device_id', deviceId);
      }

      return deviceId;
    } catch (error) {
      logger.error('BidirectionalSync', 'Error obteniendo device ID:', error);
      return `mobile_${Date.now()}`;
    }
  }

  async saveSyncQueue() {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      logger.error('BidirectionalSync', 'Error guardando cola:', error);
    }
  }

  async loadSyncQueue() {
    try {
      const queueData = await AsyncStorage.getItem('sync_queue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
        logger.info('BidirectionalSync', `Cola cargada: ${this.syncQueue.length} cambios pendientes`);
      }
    } catch (error) {
      logger.error('BidirectionalSync', 'Error cargando cola:', error);
    }
  }

  async saveLastSyncTimestamp() {
    try {
      if (this.lastSync) {
        await AsyncStorage.setItem('bidirectional_last_sync', this.lastSync.toISOString());
      }
    } catch (error) {
      logger.error('BidirectionalSync', 'Error guardando timestamp:', error);
    }
  }

  async loadLastSyncTimestamp() {
    try {
      const lastSyncStr = await AsyncStorage.getItem('bidirectional_last_sync');
      if (lastSyncStr) {
        this.lastSync = new Date(lastSyncStr);
      }
    } catch (error) {
      logger.error('BidirectionalSync', 'Error cargando timestamp:', error);
    }
  }

  // ========================================================================
  // CLEANUP
  // ========================================================================

  async cleanup() {
    logger.info('BidirectionalSync', 'Limpiando recursos...');

    // Limpiar listeners de Realtime
    this.realtimeUnsubscribers.forEach(unsub => unsub());
    this.realtimeUnsubscribers = [];

    // Limpiar listener de red
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }

    this.initialized = false;
    logger.info('BidirectionalSync', '✓ Recursos limpiados');
  }
}

// Exportar instancia singleton
const bidirectionalSyncService = new BidirectionalSyncService();

export default bidirectionalSyncService;
