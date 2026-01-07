/**
 * EVENTS SERVICE
 * ==============
 *
 * Servicio para manejar eventos temporales que generan urgencia y engagement.
 *
 * TIPOS DE EVENTOS:
 * - Crisis Surge: Oleadas de crisis temporales
 * - Double Rewards: Recompensas dobles por tiempo limitado
 * - Community Challenge: Desafíos colaborativos globales
 * - Special Mission: Misiones especiales únicas
 * - Consciousness Boost: Multiplicador temporal de consciencia
 * - Being Summon: Invocación de seres especiales
 * - Global Event: Eventos colaborativos a nivel mundial
 *
 * CARACTERÍSTICAS:
 * - Detección automática de eventos activos
 * - Notificaciones de eventos nuevos
 * - Tracking de progreso en tiempo real
 * - Leaderboards competitivos
 * - Recompensas automáticas al completar
 *
 * USO:
 * ```javascript
 * import eventsService from './services/EventsService';
 *
 * // Obtener eventos activos
 * const events = await eventsService.getActiveEvents();
 *
 * // Unirse a un evento
 * await eventsService.joinEvent(eventId);
 *
 * // Actualizar progreso
 * await eventsService.updateProgress(eventId, 10);
 * ```
 *
 * @version 1.0.0
 */

import logger from '../utils/logger';
import useGameStore from '../stores/gameStore';
import realtimeManager from './RealtimeManager';

class EventsService {
  constructor() {
    this.supabase = null;
    this.initialized = false;
    this.activeEvents = [];
    this.userParticipation = new Map();

    // Listeners
    this.eventListeners = [];
    this.realtimeUnsubscriber = null;

    // Cache
    this.lastFetch = null;
    this.cacheTimeout = 60000; // 1 minuto
  }

  // ========================================================================
  // INICIALIZACIÓN
  // ========================================================================

  /**
   * Inicializa el servicio
   */
  async init(supabase) {
    if (this.initialized) {
      logger.info('EventsService', 'Ya inicializado');
      return true;
    }

    if (!supabase) {
      logger.error('EventsService', 'Supabase client no proporcionado');
      return false;
    }

    this.supabase = supabase;

    // Obtener eventos activos
    await this.refreshActiveEvents();

    // Configurar Realtime para detectar nuevos eventos
    this.setupRealtimeListener();

    // Configurar polling para detectar eventos que terminan
    this.startEventPolling();

    this.initialized = true;
    logger.info('EventsService', '✓ Inicializado');

    return true;
  }

  /**
   * Configura listener de Realtime para eventos
   */
  setupRealtimeListener() {
    if (!realtimeManager.isConnected) {
      logger.warn('EventsService', 'RealtimeManager no conectado');
      return;
    }

    this.realtimeUnsubscriber = realtimeManager.subscribe('events', (payload) => {
      this.handleRealtimeEventUpdate(payload);
    });

    logger.info('EventsService', '✓ Realtime listener configurado');
  }

  /**
   * Maneja actualizaciones de eventos vía Realtime
   */
  async handleRealtimeEventUpdate(payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    logger.debug('EventsService', `Event ${eventType}: ${newRecord?.event_name || oldRecord?.event_name}`);

    if (eventType === 'INSERT') {
      // Nuevo evento creado
      await this.refreshActiveEvents();
      this.notifyListeners('event_created', newRecord);

      // Notificar al usuario
      logger.info('EventsService', `🎪 ¡Nuevo evento! ${newRecord.event_name}`);

    } else if (eventType === 'UPDATE') {
      // Evento actualizado
      await this.refreshActiveEvents();
      this.notifyListeners('event_updated', newRecord);

    } else if (eventType === 'DELETE') {
      // Evento eliminado (raro, pero posible)
      await this.refreshActiveEvents();
      this.notifyListeners('event_deleted', oldRecord);
    }
  }

  /**
   * Inicia polling para detectar eventos que terminan
   */
  startEventPolling() {
    // Verificar cada 2 minutos
    this.pollingInterval = setInterval(async () => {
      const now = Date.now();
      const shouldRefresh = !this.lastFetch || (now - this.lastFetch) > this.cacheTimeout;

      if (shouldRefresh) {
        await this.refreshActiveEvents();
      }

      // Detectar eventos que acaban de terminar
      this.checkExpiredEvents();

    }, 120000); // 2 minutos
  }

  /**
   * Detecta eventos que han expirado
   */
  checkExpiredEvents() {
    const now = new Date();

    this.activeEvents.forEach(event => {
      const endsAt = new Date(event.ends_at);

      if (endsAt <= now) {
        logger.info('EventsService', `⏰ Evento terminado: ${event.event_name}`);
        this.notifyListeners('event_expired', event);
      }
    });
  }

  // ========================================================================
  // OBTENER EVENTOS
  // ========================================================================

  /**
   * Obtiene eventos activos para el usuario
   */
  async getActiveEvents(forceRefresh = false) {
    // Usar cache si no ha pasado mucho tiempo
    const now = Date.now();
    const cacheValid = this.lastFetch && (now - this.lastFetch) < this.cacheTimeout;

    if (!forceRefresh && cacheValid && this.activeEvents.length > 0) {
      logger.debug('EventsService', 'Usando eventos en cache');
      return this.activeEvents;
    }

    // Refrescar desde la nube
    await this.refreshActiveEvents();
    return this.activeEvents;
  }

  /**
   * Refresca eventos desde Supabase
   */
  async refreshActiveEvents() {
    try {
      const user = useGameStore.getState().user;
      if (!user || !user.id) {
        logger.warn('EventsService', 'No hay usuario autenticado');
        return [];
      }

      // Llamar función RPC de Supabase
      const { data, error } = await this.supabase
        .rpc('get_active_events_for_user', {
          p_user_id: user.id,
          p_user_level: user.level || 1
        });

      if (error) {
        logger.error('EventsService', 'Error obteniendo eventos:', error);
        return this.activeEvents;
      }

      this.activeEvents = data || [];
      this.lastFetch = Date.now();

      // Actualizar mapa de participación
      this.activeEvents.forEach(event => {
        if (event.is_participating) {
          this.userParticipation.set(event.event_id, {
            progress: event.participation_progress,
            participating: true
          });
        }
      });

      logger.info('EventsService', `✓ ${this.activeEvents.length} eventos activos`);

      return this.activeEvents;

    } catch (error) {
      logger.error('EventsService', 'Error en refreshActiveEvents:', error);
      return this.activeEvents;
    }
  }

  /**
   * Obtiene un evento específico por ID
   */
  async getEvent(eventId) {
    // Primero buscar en cache
    let event = this.activeEvents.find(e => e.event_id === eventId);

    if (event) {
      return event;
    }

    // Si no está en cache, obtener desde Supabase
    try {
      const { data, error } = await this.supabase
        .from('temporary_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      logger.error('EventsService', `Error obteniendo evento ${eventId}:`, error);
      return null;
    }
  }

  // ========================================================================
  // PARTICIPACIÓN EN EVENTOS
  // ========================================================================

  /**
   * Une al usuario a un evento
   */
  async joinEvent(eventId) {
    try {
      const user = useGameStore.getState().user;
      if (!user || !user.id) {
        throw new Error('No hay usuario autenticado');
      }

      // Llamar función RPC
      const { data, error } = await this.supabase
        .rpc('join_event', {
          p_user_id: user.id,
          p_event_id: eventId
        });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Error uniéndose al evento');
      }

      // Actualizar participación local
      this.userParticipation.set(eventId, {
        progress: { current: 0, goal: 100 },
        participating: true
      });

      // Refrescar eventos
      await this.refreshActiveEvents();

      logger.info('EventsService', `✓ Unido al evento: ${eventId}`);

      this.notifyListeners('event_joined', { eventId });

      return {
        success: true,
        message: data.message
      };

    } catch (error) {
      logger.error('EventsService', 'Error en joinEvent:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Actualiza progreso del usuario en un evento
   */
  async updateProgress(eventId, progressDelta, taskCompleted = null) {
    try {
      const user = useGameStore.getState().user;
      if (!user || !user.id) {
        throw new Error('No hay usuario autenticado');
      }

      // Llamar función RPC
      const { data, error } = await this.supabase
        .rpc('update_event_progress', {
          p_user_id: user.id,
          p_event_id: eventId,
          p_progress_delta: progressDelta,
          p_task_completed: taskCompleted
        });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Error actualizando progreso');
      }

      // Actualizar cache local
      this.userParticipation.set(eventId, {
        progress: data.progress,
        participating: true
      });

      logger.info('EventsService', `✓ Progreso actualizado: ${data.progress.current}/${data.progress.goal}`);

      this.notifyListeners('progress_updated', {
        eventId,
        progress: data.progress,
        isCompleted: data.is_completed
      });

      // Si completó el evento, reclamar recompensas
      if (data.is_completed) {
        await this.claimRewards(eventId);
      }

      return {
        success: true,
        progress: data.progress,
        isCompleted: data.is_completed
      };

    } catch (error) {
      logger.error('EventsService', 'Error en updateProgress:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reclama recompensas de un evento completado
   */
  async claimRewards(eventId) {
    try {
      const user = useGameStore.getState().user;
      if (!user || !user.id) {
        throw new Error('No hay usuario autenticado');
      }

      // Obtener evento
      const event = await this.getEvent(eventId);
      if (!event || !event.rewards) {
        throw new Error('Evento no encontrado o sin recompensas');
      }

      // Verificar que ya completó
      const { data: participation } = await this.supabase
        .from('user_event_participation')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .eq('is_completed', true)
        .single();

      if (!participation) {
        throw new Error('Evento no completado');
      }

      if (participation.rewards_claimed) {
        throw new Error('Recompensas ya reclamadas');
      }

      // Aplicar recompensas al usuario
      const store = useGameStore.getState();
      const rewards = event.rewards;

      if (rewards.xp) {
        store.addXP(rewards.xp);
        logger.info('EventsService', `+${rewards.xp} XP`);
      }

      if (rewards.consciousness) {
        store.addConsciousness(rewards.consciousness);
        logger.info('EventsService', `+${rewards.consciousness} Consciousness`);
      }

      if (rewards.energy) {
        store.addEnergy(rewards.energy);
      }

      if (rewards.special_piece) {
        // Agregar pieza especial al inventario
        store.addPiece({
          name: rewards.special_piece,
          type: 'event_reward',
          rarity: 'special',
          source: `event_${eventId}`,
          attributes: rewards.piece_attributes || {}
        });
        logger.info('EventsService', `Pieza especial obtenida: ${rewards.special_piece}`);
      }

      // Marcar recompensas como reclamadas
      await this.supabase
        .from('user_event_participation')
        .update({
          rewards_claimed: true,
          rewards_claimed_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('event_id', eventId);

      // Guardar cambios
      store.saveToStorage();

      logger.info('EventsService', '✓ Recompensas reclamadas');

      this.notifyListeners('rewards_claimed', { eventId, rewards });

      return {
        success: true,
        rewards
      };

    } catch (error) {
      logger.error('EventsService', 'Error en claimRewards:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========================================================================
  // LEADERBOARDS
  // ========================================================================

  /**
   * Obtiene leaderboard de un evento
   */
  async getLeaderboard(eventId, limit = 100) {
    try {
      const { data, error } = await this.supabase
        .from('event_leaderboard')
        .select('*')
        .eq('event_id', eventId)
        .order('rank', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return data || [];

    } catch (error) {
      logger.error('EventsService', 'Error obteniendo leaderboard:', error);
      return [];
    }
  }

  /**
   * Obtiene posición del usuario en leaderboard
   */
  async getUserRank(eventId, userId) {
    try {
      const { data, error } = await this.supabase
        .from('event_leaderboard')
        .select('rank, score')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      logger.debug('EventsService', 'Usuario no en leaderboard');
      return null;
    }
  }

  // ========================================================================
  // HELPERS
  // ========================================================================

  /**
   * Verifica si el usuario está participando en un evento
   */
  isParticipating(eventId) {
    return this.userParticipation.has(eventId);
  }

  /**
   * Obtiene progreso del usuario en un evento
   */
  getProgress(eventId) {
    const participation = this.userParticipation.get(eventId);
    return participation?.progress || null;
  }

  /**
   * Calcula tiempo restante de un evento
   */
  getTimeRemaining(event) {
    const now = new Date();
    const endsAt = new Date(event.ends_at);
    const diff = endsAt - now;

    if (diff <= 0) {
      return { expired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return {
      expired: false,
      days,
      hours,
      minutes,
      totalMs: diff
    };
  }

  // ========================================================================
  // LISTENERS
  // ========================================================================

  /**
   * Registra listener para cambios de eventos
   */
  addEventListener(callback) {
    this.eventListeners.push(callback);
    return () => {
      this.eventListeners = this.eventListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notifica a todos los listeners
   */
  notifyListeners(eventName, data) {
    this.eventListeners.forEach(callback => {
      try {
        callback(eventName, data);
      } catch (error) {
        logger.error('EventsService', 'Error en listener:', error);
      }
    });
  }

  // ========================================================================
  // CLEANUP
  // ========================================================================

  cleanup() {
    logger.info('EventsService', 'Limpiando recursos...');

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    if (this.realtimeUnsubscriber) {
      this.realtimeUnsubscriber();
      this.realtimeUnsubscriber = null;
    }

    this.activeEvents = [];
    this.userParticipation.clear();
    this.eventListeners = [];
    this.initialized = false;

    logger.info('EventsService', '✓ Recursos limpiados');
  }
}

// Exportar instancia singleton
const eventsService = new EventsService();

export default eventsService;
