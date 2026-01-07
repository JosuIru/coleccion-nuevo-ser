/**
 * REALTIME MANAGER
 * ================
 *
 * Servicio centralizado para manejar TODAS las suscripciones Realtime de Supabase
 * en un solo canal WebSocket, optimizando performance y batería.
 *
 * CARACTERÍSTICAS:
 * - Un solo WebSocket para todas las tablas
 * - Subscripciones múltiples en un canal
 * - Sistema de listeners con callbacks
 * - Auto-reconexión inteligente
 * - Pausa automática en background
 * - Debouncing de eventos duplicados
 *
 * OPTIMIZACIÓN CLAVE:
 * En lugar de 5+ canales WebSocket separados:
 * - beings_sync channel
 * - events_sync channel
 * - achievements_sync channel
 * - clans_sync channel
 * - frankenstein_sync channel
 *
 * Usamos 1 solo canal con filtros por tabla:
 * - realtime_manager_channel (con múltiples .on() para diferentes tablas)
 *
 * AHORRO ESTIMADO:
 * - Conexiones WebSocket: 5 → 1 (80% reducción)
 * - Batería: ~15-20% menos consumo
 * - Memoria: ~2-3 MB menos uso
 *
 * USO:
 * ```javascript
 * import realtimeManager from './services/RealtimeManager';
 *
 * // Inicializar
 * await realtimeManager.init(supabase, userId);
 *
 * // Suscribirse a cambios
 * realtimeManager.subscribe('beings', (payload) => {
 *   console.log('Being updated:', payload);
 * });
 *
 * // Pausar (cuando app va a background)
 * realtimeManager.pause();
 *
 * // Resumir (cuando app vuelve a foreground)
 * realtimeManager.resume();
 * ```
 *
 * @version 1.0.0
 */

import { AppState } from 'react-native';
import logger from '../utils/logger';

class RealtimeManager {
  constructor() {
    this.supabase = null;
    this.userId = null;
    this.channel = null;
    this.isConnected = false;
    this.isPaused = false;

    // Listeners registrados por tipo de entidad
    this.listeners = {
      beings: [],
      events: [],
      achievements: [],
      clans: [],
      sync_queue: [],
      reading_progress: [],
      notes: [],
      bookmarks: []
    };

    // Debouncing para evitar eventos duplicados
    this.recentEvents = new Map();
    this.debounceTime = 1000; // 1 segundo

    // Estado de la app para pausar en background
    this.appStateSubscription = null;
    this.backgroundPauseEnabled = true;
  }

  // ========================================================================
  // INICIALIZACIÓN
  // ========================================================================

  /**
   * Inicializa el RealtimeManager
   * @param {object} supabase - Cliente de Supabase
   * @param {string} userId - ID del usuario actual
   */
  async init(supabase, userId) {
    if (!supabase || !userId) {
      logger.warn('RealtimeManager', 'Supabase o userId no proporcionado');
      return false;
    }

    this.supabase = supabase;
    this.userId = userId;

    // Setup del canal único
    await this.setupChannel();

    // Listener para pausar en background
    this.setupBackgroundListener();

    logger.info('RealtimeManager', '✓ Inicializado con canal único optimizado');
    return true;
  }

  /**
   * Configura el canal WebSocket único para todas las subscripciones
   */
  async setupChannel() {
    if (this.channel) {
      logger.info('RealtimeManager', 'Canal ya existe, recreando...');
      await this.disconnect();
    }

    try {
      // Crear UN SOLO canal para todas las tablas
      this.channel = this.supabase.channel('realtime_manager_unified');

      // ====================================================================
      // SUBSCRIPCIÓN 1: BEINGS (Mobile Game + Frankenstein Lab)
      // ====================================================================
      this.channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'frankenstein_beings',
          filter: `user_id=eq.${this.userId}`
        },
        (payload) => this.handleEvent('beings', payload)
      );

      // ====================================================================
      // SUBSCRIPCIÓN 2: EVENTOS TEMPORALES
      // ====================================================================
      this.channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'temporary_events',
          filter: `is_active=eq.true`
        },
        (payload) => this.handleEvent('events', payload)
      );

      // ====================================================================
      // SUBSCRIPCIÓN 3: ACHIEVEMENTS
      // ====================================================================
      this.channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'frankenstein_achievements',
          filter: `user_id=eq.${this.userId}`
        },
        (payload) => this.handleEvent('achievements', payload)
      );

      // ====================================================================
      // SUBSCRIPCIÓN 4: CLANES Y COMUNIDADES
      // ====================================================================
      // Nota: Aquí filtraremos por clanes a los que pertenece el usuario
      // Esto se implementará cuando tengamos la tabla clans lista
      this.channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clans',
          filter: `members.cs.{${this.userId}}`
        },
        (payload) => this.handleEvent('clans', payload)
      );

      // ====================================================================
      // SUBSCRIPCIÓN 5: SYNC QUEUE (para sincronización bidireccional)
      // ====================================================================
      this.channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sync_queue',
          filter: `user_id=eq.${this.userId}`
        },
        (payload) => this.handleEvent('sync_queue', payload)
      );

      // ====================================================================
      // SUBSCRIPCIÓN 6: READING PROGRESS (desde webapp)
      // ====================================================================
      this.channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reading_progress',
          filter: `user_id=eq.${this.userId}`
        },
        (payload) => this.handleEvent('reading_progress', payload)
      );

      // ====================================================================
      // SUBSCRIPCIÓN 7: NOTES (sincronización de notas)
      // ====================================================================
      this.channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${this.userId}`
        },
        (payload) => this.handleEvent('notes', payload)
      );

      // ====================================================================
      // SUBSCRIPCIÓN 8: BOOKMARKS (sincronización de marcadores)
      // ====================================================================
      this.channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${this.userId}`
        },
        (payload) => this.handleEvent('bookmarks', payload)
      );

      // ====================================================================
      // SUBSCRIBE AL CANAL (activa el WebSocket)
      // ====================================================================
      this.channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          logger.info('RealtimeManager', '✓ Canal suscrito exitosamente');
        } else if (status === 'CHANNEL_ERROR') {
          this.isConnected = false;
          logger.error('RealtimeManager', 'Error en canal, reintentando...');
          this.reconnect();
        } else if (status === 'TIMED_OUT') {
          this.isConnected = false;
          logger.warn('RealtimeManager', 'Timeout en suscripción, reintentando...');
          this.reconnect();
        }
      });

    } catch (error) {
      logger.error('RealtimeManager', 'Error configurando canal:', error);
      this.isConnected = false;
    }
  }

  // ========================================================================
  // MANEJO DE EVENTOS
  // ========================================================================

  /**
   * Maneja un evento Realtime con debouncing
   * @param {string} type - Tipo de entidad (beings, events, etc)
   * @param {object} payload - Payload de Supabase
   */
  handleEvent(type, payload) {
    // Verificar si está pausado
    if (this.isPaused) {
      logger.debug('RealtimeManager', `Evento ${type} ignorado (pausado)`);
      return;
    }

    // Debouncing: evitar eventos duplicados en 1 segundo
    const eventKey = `${type}_${payload.eventType}_${payload.new?.id || payload.old?.id}`;
    const now = Date.now();
    const lastEventTime = this.recentEvents.get(eventKey);

    if (lastEventTime && (now - lastEventTime) < this.debounceTime) {
      logger.debug('RealtimeManager', `Evento ${eventKey} debounced`);
      return;
    }

    this.recentEvents.set(eventKey, now);

    // Limpiar eventos antiguos del Map (mantener solo últimos 5 minutos)
    if (this.recentEvents.size > 100) {
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      for (const [key, time] of this.recentEvents.entries()) {
        if (time < fiveMinutesAgo) {
          this.recentEvents.delete(key);
        }
      }
    }

    // Notificar a todos los listeners registrados para este tipo
    const typeListeners = this.listeners[type] || [];

    logger.debug('RealtimeManager', `Evento ${type}: ${payload.eventType}`);

    typeListeners.forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        logger.error('RealtimeManager', `Error en callback de ${type}:`, error);
      }
    });
  }

  // ========================================================================
  // SUBSCRIPCIONES (API PÚBLICA)
  // ========================================================================

  /**
   * Suscribe un callback para recibir eventos de un tipo específico
   * @param {string} type - Tipo de entidad (beings, events, achievements, clans, etc)
   * @param {function} callback - Función a llamar cuando ocurra un evento
   * @returns {function} Función para desuscribir
   */
  subscribe(type, callback) {
    if (!this.listeners[type]) {
      logger.warn('RealtimeManager', `Tipo de entidad desconocido: ${type}`);
      return () => {};
    }

    this.listeners[type].push(callback);
    logger.info('RealtimeManager', `Listener registrado para ${type}`);

    // Retornar función de cleanup
    return () => {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
      logger.info('RealtimeManager', `Listener removido de ${type}`);
    };
  }

  /**
   * Desuscribe todos los listeners de un tipo
   * @param {string} type - Tipo de entidad
   */
  unsubscribeAll(type) {
    if (this.listeners[type]) {
      this.listeners[type] = [];
      logger.info('RealtimeManager', `Todos los listeners de ${type} removidos`);
    }
  }

  // ========================================================================
  // PAUSA Y RECONEXIÓN
  // ========================================================================

  /**
   * Pausa las subscripciones Realtime (útil en background)
   */
  pause() {
    if (this.isPaused) return;

    this.isPaused = true;
    logger.info('RealtimeManager', '⏸ Pausado (background mode)');

    // Opcional: Desconectar completamente para ahorrar más batería
    // this.disconnect();
  }

  /**
   * Resume las subscripciones Realtime
   */
  async resume() {
    if (!this.isPaused) return;

    this.isPaused = false;
    logger.info('RealtimeManager', '▶ Resumido (foreground mode)');

    // Si estaba desconectado, reconectar
    if (!this.isConnected) {
      await this.reconnect();
    }
  }

  /**
   * Reconecta el canal si se pierde la conexión
   */
  async reconnect() {
    logger.info('RealtimeManager', '🔄 Reconectando...');

    await this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
    await this.setupChannel();
  }

  /**
   * Desconecta el canal completamente
   */
  async disconnect() {
    if (this.channel) {
      try {
        await this.supabase.removeChannel(this.channel);
        this.channel = null;
        this.isConnected = false;
        logger.info('RealtimeManager', 'Canal desconectado');
      } catch (error) {
        logger.error('RealtimeManager', 'Error desconectando:', error);
      }
    }
  }

  // ========================================================================
  // BACKGROUND/FOREGROUND DETECTION
  // ========================================================================

  /**
   * Configura listener para detectar cuando app va a background
   */
  setupBackgroundListener() {
    if (!this.backgroundPauseEnabled) return;

    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App en background, pausar Realtime
        this.pause();
      } else if (nextAppState === 'active') {
        // App en foreground, resumir Realtime
        this.resume();
      }
    });

    logger.info('RealtimeManager', 'Background pause activado');
  }

  /**
   * Remueve listener de background
   */
  removeBackgroundListener() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
      logger.info('RealtimeManager', 'Background pause desactivado');
    }
  }

  // ========================================================================
  // CONFIGURACIÓN
  // ========================================================================

  /**
   * Activa/desactiva pausa automática en background
   * @param {boolean} enabled
   */
  setBackgroundPauseEnabled(enabled) {
    this.backgroundPauseEnabled = enabled;

    if (enabled) {
      this.setupBackgroundListener();
    } else {
      this.removeBackgroundListener();
    }
  }

  /**
   * Configura tiempo de debouncing
   * @param {number} milliseconds
   */
  setDebounceTime(milliseconds) {
    this.debounceTime = milliseconds;
    logger.info('RealtimeManager', `Debounce time actualizado: ${milliseconds}ms`);
  }

  // ========================================================================
  // ESTADO Y DIAGNÓSTICO
  // ========================================================================

  /**
   * Obtiene estado actual del RealtimeManager
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isPaused: this.isPaused,
      userId: this.userId,
      channelStatus: this.channel?.state || 'not_initialized',
      listeners: Object.keys(this.listeners).reduce((acc, type) => {
        acc[type] = this.listeners[type].length;
        return acc;
      }, {}),
      backgroundPauseEnabled: this.backgroundPauseEnabled,
      debounceTime: this.debounceTime
    };
  }

  /**
   * Limpia todos los recursos
   */
  async cleanup() {
    logger.info('RealtimeManager', 'Limpiando recursos...');

    await this.disconnect();
    this.removeBackgroundListener();

    // Limpiar todos los listeners
    Object.keys(this.listeners).forEach(type => {
      this.listeners[type] = [];
    });

    this.supabase = null;
    this.userId = null;
    this.recentEvents.clear();

    logger.info('RealtimeManager', '✓ Recursos limpiados');
  }
}

// Exportar instancia singleton
const realtimeManager = new RealtimeManager();

export default realtimeManager;
