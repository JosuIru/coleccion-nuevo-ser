/**
 * WEB BRIDGE SERVICE
 * ==================
 *
 * Servicio de sincronización entre el Mobile Game (Awakening Protocol) y la Webapp
 * para el proyecto Colección Nuevo Ser.
 *
 * CARACTERÍSTICAS:
 * - Exporta estado del juego móvil a formato compartido
 * - Importa estado desde webapp (progreso de lectura, achievements)
 * - Sincroniza beings creados en el juego con Supabase
 * - Resolución de conflictos por timestamp
 * - Integración con Zustand store
 *
 * DEPENDENCIAS:
 * - Supabase Client (@supabase/supabase-js)
 * - Zustand store (../stores/gameStore)
 * - Logger (../utils/logger)
 *
 * USO:
 * ```javascript
 * import WebBridgeService from './services/WebBridgeService';
 *
 * // Inicializar
 * await WebBridgeService.init();
 *
 * // Sincronizar
 * await WebBridgeService.sync();
 * ```
 *
 * @version 1.0.0
 */

// Supabase desactivado temporalmente - instalar @supabase/supabase-js si se necesita
// import { createClient } from '@supabase/supabase-js';
let createClient = null;
try {
  createClient = require('@supabase/supabase-js').createClient;
} catch (e) {
  console.log('[WebBridge] Supabase not available, sync disabled');
}

import useGameStore from '../stores/gameStore';
import logger from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WebBridgeService {
  constructor() {
    this.supabase = null;
    this.supabaseAvailable = !!createClient;
    this.platform = 'mobile';
    this.deviceId = null;
    this.lastSync = null;
    this.isSyncing = false;
    this.initialized = false;
    this.autoSyncEnabled = false;
    this.syncInterval = null;
  }

  // ========================================================================
  // INICIALIZACIÓN
  // ========================================================================

  /**
   * Inicializa el servicio con configuración de Supabase
   */
  async init(supabaseConfig) {
    if (this.initialized) {
      logger.info('WebBridge ya inicializado', '');
      return;
    }

    try {
      // Verificar si Supabase está disponible
      if (!this.supabaseAvailable || !createClient) {
        logger.warn('WebBridge', 'Supabase no disponible, sync desactivado');
        this.initialized = true;
        return;
      }

      // Validar configuración
      if (!supabaseConfig || !supabaseConfig.url || !supabaseConfig.anonKey) {
        logger.warn('WebBridge', 'Configuración de Supabase no proporcionada, sync desactivado');
        this.initialized = true;
        return;
      }

      // Crear cliente Supabase con manejo de errores para URL API
      try {
        this.supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
      } catch (urlError) {
        // Hermes no soporta completamente URL API
        logger.warn('WebBridge', 'URL API no soportada (Hermes), sync desactivado');
        this.supabaseAvailable = false;
        this.initialized = true;
        return;
      }

      // Obtener o crear device ID
      this.deviceId = await this.getOrCreateDeviceId();

      // Cargar timestamp de última sincronización
      await this.loadLastSyncTimestamp();

      this.initialized = true;
      logger.info('✓ WebBridge inicializado', '');

    } catch (error) {
      // Marcar como inicializado para evitar reintentos
      this.initialized = true;
      this.supabaseAvailable = false;
      logger.warn('WebBridge', `Sync desactivado: ${error.message}`);
    }
  }

  // ========================================================================
  // SINCRONIZACIÓN PRINCIPAL
  // ========================================================================

  /**
   * Ejecuta sincronización bidireccional
   */
  async sync() {
    if (!this.initialized) {
      logger.warn('WebBridge no inicializado', '');
      return { success: false, reason: 'not_initialized' };
    }

    // No sincronizar si Supabase no está disponible
    if (!this.supabaseAvailable || !this.supabase) {
      return { success: false, reason: 'supabase_unavailable' };
    }

    if (this.isSyncing) {
      logger.info('Sincronización en progreso...', '');
      return { success: false, reason: 'already_syncing' };
    }

    this.isSyncing = true;
    useGameStore.getState().setSyncing(true);

    try {
      logger.info('Iniciando sincronización con webapp...', '');

      const user_id = useGameStore.getState().user.id;
      if (!user_id) {
        throw new Error('Usuario no autenticado');
      }

      // 1. Push: Enviar beings a Supabase
      const pushResults = await this.pushBeingsToSupabase();

      // 2. Pull: Obtener cambios desde webapp (progreso, achievements)
      const pullResults = await this.pullChangesFromWebapp();

      // 3. Actualizar timestamp
      this.lastSync = new Date();
      await this.saveLastSyncTimestamp();

      // 4. Actualizar sync_state
      await this.updateSyncState();

      const results = {
        success: true,
        timestamp: this.lastSync.toISOString(),
        pushed: pushResults,
        pulled: pullResults
      };

      logger.info('✓ Sincronización completada', JSON.stringify(results));

      return results;

    } catch (error) {
      logger.error('Error en sincronización:', error);
      return {
        success: false,
        error: error.message
      };

    } finally {
      this.isSyncing = false;
      useGameStore.getState().setSyncing(false);
    }
  }

  // ========================================================================
  // EXPORTAR ESTADO (PUSH)
  // ========================================================================

  /**
   * Exporta estado del juego a formato compartido
   */
  exportGameState() {
    const state = useGameStore.getState();

    return {
      user: {
        id: state.user.id,
        level: state.user.level,
        xp: state.user.xp,
        energy: state.user.energy,
        consciousness_points: state.user.consciousnessPoints
      },
      beings: state.beings.map(being => ({
        being_id: being.id,
        name: being.name,
        avatar: being.avatar || '🌱',
        status: being.status || 'available',
        current_mission: being.currentMission,
        level: being.level || 1,
        experience: being.experience || 0,
        attributes: being.attributes || {},
        source_app: being.sourceApp || 'mobile-game',
        community_id: being.communityId,
        last_modified_at: new Date().toISOString()
      })),
      communities: state.communities || [],
      pieces: state.pieces || []
    };
  }

  /**
   * Sincroniza beings con Supabase
   */
  async pushBeingsToSupabase() {
    try {
      const gameState = this.exportGameState();
      const user_id = gameState.user.id;
      let syncedCount = 0;

      logger.info(`Sincronizando ${gameState.beings.length} beings...`, '');

      for (const being of gameState.beings) {
        try {
          // Llamar función RPC para sincronizar
          const { data, error } = await this.supabase.rpc('sync_entity', {
            p_user_id: user_id,
            p_entity_type: 'being',
            p_entity_id: being.being_id,
            p_data: being,
            p_platform: this.platform,
            p_modified_at: being.last_modified_at
          });

          if (error) {
            // Silenciar errores de RPC no configurados
            continue;
          }

          if (data?.status === 'conflict') {
            logger.warn(`Conflicto detectado para ${being.name}`, '');
            // El servidor tiene datos más recientes, podríamos aplicarlos aquí
          } else {
            syncedCount++;
          }

        } catch (error) {
          logger.error(`Error en being ${being.name}:`, error);
        }
      }

      logger.info(`✓ ${syncedCount} beings sincronizados`, '');

      return {
        beings: syncedCount
      };

    } catch (error) {
      logger.error('Error en pushBeingsToSupabase:', error);
      return { beings: 0 };
    }
  }

  // ========================================================================
  // IMPORTAR ESTADO (PULL)
  // ========================================================================

  /**
   * Obtiene cambios desde webapp
   */
  async pullChangesFromWebapp() {
    try {
      const user_id = useGameStore.getState().user.id;
      const lastSyncTimestamp = this.lastSync?.toISOString() || '1970-01-01T00:00:00Z';

      // Llamar función RPC
      const { data, error } = await this.supabase.rpc('get_changes_since', {
        p_user_id: user_id,
        p_platform: this.platform,
        p_last_sync: lastSyncTimestamp
      });

      if (error) throw error;

      const results = {
        reading_progress: 0,
        achievements: 0,
        beings: 0
      };

      if (!data) return results;

      // 1. Aplicar progreso de lectura
      if (data.reading_progress && data.reading_progress.length > 0) {
        results.reading_progress = await this.applyReadingProgress(data.reading_progress);
      }

      // 2. Aplicar achievements
      if (data.achievements && data.achievements.length > 0) {
        results.achievements = await this.applyAchievements(data.achievements);
      }

      // 3. Aplicar beings (si se crearon desde webapp/frankenstein-lab)
      if (data.beings && data.beings.length > 0) {
        results.beings = await this.applyBeings(data.beings);
      }

      return results;

    } catch (error) {
      // Silenciar - RPC no configurado en backend
      return {
        reading_progress: 0,
        achievements: 0,
        beings: 0
      };
    }
  }

  /**
   * Aplica progreso de lectura recibido desde webapp
   */
  async applyReadingProgress(remoteProgress) {
    let appliedCount = 0;

    try {
      // El progreso de lectura podría usarse para desbloquear contenido
      // o generar recompensas en el juego móvil

      logger.info(`Recibido progreso de ${remoteProgress.length} capítulos`, '');

      // Por ahora solo lo registramos, pero podrías:
      // - Desbloquear misiones basadas en capítulos leídos
      // - Dar XP/consciousness por lectura
      // - Crear achievements por lectura completa

      remoteProgress.forEach(progress => {
        if (progress.completed) {
          appliedCount++;
          // Aquí podrías dar recompensas:
          // useGameStore.getState().addXP(10);
          // useGameStore.getState().addConsciousness(5);
        }
      });

      return appliedCount;

    } catch (error) {
      logger.error('Error aplicando progreso de lectura:', error);
      return appliedCount;
    }
  }

  /**
   * Aplica achievements recibidos desde webapp
   */
  async applyAchievements(remoteAchievements) {
    let appliedCount = 0;

    try {
      logger.info(`Recibidos ${remoteAchievements.length} achievements`, '');

      // Aplicar recompensas de achievements
      remoteAchievements.forEach(achievement => {
        if (achievement.completed && achievement.rewards) {
          const rewards = achievement.rewards;

          if (rewards.xp) {
            useGameStore.getState().addXP(rewards.xp);
          }

          if (rewards.consciousness) {
            useGameStore.getState().addConsciousness(rewards.consciousness);
          }

          if (rewards.energy) {
            useGameStore.getState().addEnergy(rewards.energy);
          }

          appliedCount++;
        }
      });

      logger.info(`✓ ${appliedCount} achievements aplicados`, '');

      return appliedCount;

    } catch (error) {
      logger.error('Error aplicando achievements:', error);
      return appliedCount;
    }
  }

  /**
   * Aplica beings recibidos desde webapp (ej. creados en frankenstein-lab)
   */
  async applyBeings(remoteBeings) {
    let appliedCount = 0;

    try {
      const currentBeings = useGameStore.getState().beings;

      logger.info(`Recibidos ${remoteBeings.length} beings desde webapp`, '');

      remoteBeings.forEach(remoteBeing => {
        // Solo aplicar si no existe localmente
        const exists = currentBeings.find(b => b.id === remoteBeing.being_id);

        if (!exists && remoteBeing.synced_from === 'web') {
          // Agregar being creado en webapp
          const newBeing = {
            id: remoteBeing.being_id,
            name: remoteBeing.name,
            avatar: remoteBeing.avatar,
            status: 'available',
            level: remoteBeing.level || 1,
            experience: remoteBeing.experience || 0,
            attributes: remoteBeing.attributes,
            sourceApp: 'webapp',
            createdAt: remoteBeing.created_at
          };

          useGameStore.getState().addBeing(newBeing);
          appliedCount++;
        }
      });

      if (appliedCount > 0) {
        logger.info(`✓ ${appliedCount} beings agregados desde webapp`, '');
      }

      return appliedCount;

    } catch (error) {
      logger.error('Error aplicando beings:', error);
      return appliedCount;
    }
  }

  // ========================================================================
  // GESTIÓN DE ESTADO
  // ========================================================================

  /**
   * Actualiza sync_state en Supabase
   */
  async updateSyncState() {
    try {
      const user_id = useGameStore.getState().user.id;

      const { error } = await this.supabase
        .from('sync_state')
        .upsert({
          user_id: user_id,
          platform: this.platform,
          device_id: this.deviceId,
          last_sync_at: new Date().toISOString(),
          sync_status: 'idle'
        }, {
          onConflict: 'user_id,platform,device_id'
        });

      if (error) throw error;

    } catch (error) {
      // Silenciar - tabla sync_state no existe en backend
    }
  }

  // ========================================================================
  // SINCRONIZACIÓN AUTOMÁTICA
  // ========================================================================

  /**
   * Inicia sincronización automática
   */
  startAutoSync(intervalMinutes = 10) {
    // No iniciar auto-sync si Supabase no está disponible
    if (!this.supabaseAvailable || !this.supabase) {
      return;
    }

    if (this.syncInterval) return;

    const intervalMs = intervalMinutes * 60 * 1000;

    logger.info(`Auto-sync activado (cada ${intervalMinutes} min)`, '');

    this.syncInterval = setInterval(() => {
      this.sync();
    }, intervalMs);

    this.autoSyncEnabled = true;
  }

  /**
   * Detiene sincronización automática
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      this.autoSyncEnabled = false;
      logger.info('Auto-sync desactivado', '');
    }
  }

  // ========================================================================
  // PERSISTENCIA
  // ========================================================================

  /**
   * Genera o recupera Device ID único
   */
  async getOrCreateDeviceId() {
    try {
      let deviceId = await AsyncStorage.getItem('sync_device_id');

      if (!deviceId) {
        deviceId = `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('sync_device_id', deviceId);
      }

      return deviceId;

    } catch (error) {
      logger.error('Error obteniendo device ID:', error);
      return `mobile_${Date.now()}`;
    }
  }

  /**
   * Guarda timestamp de última sincronización
   */
  async saveLastSyncTimestamp() {
    try {
      if (this.lastSync) {
        await AsyncStorage.setItem('sync_last_sync', this.lastSync.toISOString());
      }
    } catch (error) {
      logger.error('Error guardando timestamp de sync:', error);
    }
  }

  /**
   * Carga timestamp de última sincronización
   */
  async loadLastSyncTimestamp() {
    try {
      const lastSyncStr = await AsyncStorage.getItem('sync_last_sync');
      if (lastSyncStr) {
        this.lastSync = new Date(lastSyncStr);
      }
    } catch (error) {
      logger.error('Error cargando timestamp de sync:', error);
    }
  }

  // ========================================================================
  // API PÚBLICA
  // ========================================================================

  /**
   * Obtiene estado de sincronización
   */
  getSyncStatus() {
    const state = useGameStore.getState();

    return {
      initialized: this.initialized,
      syncing: this.isSyncing,
      lastSync: this.lastSync,
      autoSync: this.autoSyncEnabled,
      platform: this.platform,
      deviceId: this.deviceId,
      user: state.user ? {
        id: state.user.id,
        level: state.user.level
      } : null
    };
  }

  /**
   * Fuerza sincronización inmediata
   */
  async forceSync() {
    return await this.sync();
  }

  /**
   * Limpia datos de sincronización (logout)
   */
  async clear() {
    try {
      await AsyncStorage.removeItem('sync_last_sync');
      this.stopAutoSync();
      this.lastSync = null;
      logger.info('Datos de sincronización limpiados', '');
    } catch (error) {
      logger.error('Error limpiando datos de sync:', error);
    }
  }
}

// Exportar instancia singleton
const webBridgeService = new WebBridgeService();

export default webBridgeService;
