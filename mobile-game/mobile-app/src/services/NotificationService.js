/**
 * NOTIFICATION SERVICE
 * Sistema completo de notificaciones para Awakening Protocol
 *
 * CARACTERÍSTICAS:
 * - Notificaciones locales y push
 * - Scheduling inteligente
 * - Horarios de silencio configurables
 * - Priorización de notificaciones
 * - Analytics integrado
 * - Background processing
 */

import memoryStorage from '../utils/MemoryStorage';
const AsyncStorage = memoryStorage;
import PushNotification from 'react-native-push-notification';
import { Platform, PermissionsAndroid } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import { NOTIFICATIONS } from '../config/constants';
import logger from '../utils/logger';

// ═══════════════════════════════════════════════════════════
// TIPOS DE NOTIFICACIONES
// ═══════════════════════════════════════════════════════════

export const NOTIFICATION_TYPES = {
  CRISIS_NEARBY: 'crisis_nearby',
  MISSION_COMPLETED: 'mission_completed',
  FRACTAL_ACTIVATED: 'fractal_activated',
  ENERGY_FULL: 'energy_full',
  BEING_RESTED: 'being_rested',
  READING_REMINDER: 'reading_reminder',
  COMMUNITY_EVENT: 'community_event'
};

// Prioridades (alta → baja)
const PRIORITIES = {
  [NOTIFICATION_TYPES.CRISIS_NEARBY]: 5,
  [NOTIFICATION_TYPES.MISSION_COMPLETED]: 4,
  [NOTIFICATION_TYPES.FRACTAL_ACTIVATED]: 3,
  [NOTIFICATION_TYPES.BEING_RESTED]: 2,
  [NOTIFICATION_TYPES.ENERGY_FULL]: 2,
  [NOTIFICATION_TYPES.READING_REMINDER]: 1,
  [NOTIFICATION_TYPES.COMMUNITY_EVENT]: 3
};

// ═══════════════════════════════════════════════════════════
// NOTIFICATION SERVICE CLASS
// ═══════════════════════════════════════════════════════════

class NotificationService {
  constructor() {
    this.initialized = false;
    this.permissionGranted = false;
    this.scheduledNotifications = [];
    this.dailyNotificationCount = 0;
    this.lastResetDate = null;

    // Configuración por defecto
    this.config = {
      enabled: true,
      quietHoursStart: NOTIFICATIONS.QUIET_HOURS.start,
      quietHoursEnd: NOTIFICATIONS.QUIET_HOURS.end,
      maxPerDay: NOTIFICATIONS.MAX_PER_DAY,
      enabledTypes: {
        [NOTIFICATION_TYPES.CRISIS_NEARBY]: true,
        [NOTIFICATION_TYPES.MISSION_COMPLETED]: true,
        [NOTIFICATION_TYPES.FRACTAL_ACTIVATED]: true,
        [NOTIFICATION_TYPES.ENERGY_FULL]: true,
        [NOTIFICATION_TYPES.BEING_RESTED]: true,
        [NOTIFICATION_TYPES.READING_REMINDER]: true,
        [NOTIFICATION_TYPES.COMMUNITY_EVENT]: true
      },
      readingReminderTime: '20:00' // Hora por defecto para recordatorio de lectura
    };

    // Analytics
    this.analytics = {
      sent: 0,
      opened: 0,
      dismissed: 0,
      byType: {}
    };
  }

  // ═══════════════════════════════════════════════════════════
  // INICIALIZACIÓN
  // ═══════════════════════════════════════════════════════════

  /**
   * Inicializar servicio de notificaciones
   */
  async initialize() {
    if (this.initialized) {
      logger.info('⚠️ NotificationService ya inicializado', '');
      return true;
    }

    logger.info('🔔 Inicializando NotificationService...', '');

    try {
      // Cargar configuración guardada
      await this.loadConfig();

      // Solicitar permisos
      this.permissionGranted = await this.requestPermissions();

      if (!this.permissionGranted) {
        console.warn('⚠️ Permisos de notificaciones no concedidos');
        return false;
      }

      // Configurar canales (Android)
      if (Platform.OS === 'android') {
        this.createNotificationChannels();
      }

      // Configurar handlers
      this.setupPushNotificationHandlers();

      // Cargar analytics
      await this.loadAnalytics();

      // Resetear contador diario si es necesario
      await this.resetDailyCountIfNeeded();

      // Iniciar background tasks
      this.startBackgroundTasks();

      this.initialized = true;
      logger.info('✅ NotificationService inicializado correctamente', '');

      return true;

    } catch (error) {
      logger.error('❌ Error inicializando NotificationService:', error);
      return false;
    }
  }

  /**
   * Solicitar permisos de notificaciones
   */
  async requestPermissions() {
    logger.info('📲 Solicitando permisos de notificaciones...', '');

    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          // Android 13+ requiere permiso explícito
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notificaciones de Awakening Protocol',
              message: 'Recibe alertas sobre crisis cercanas, misiones y recompensas',
              buttonNeutral: 'Preguntar después',
              buttonNegative: 'Cancelar',
              buttonPositive: 'Permitir'
            }
          );

          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }

        // Android < 13 tiene permisos por defecto
        return true;
      }

      if (Platform.OS === 'ios') {
        // iOS requiere solicitud explícita
        return new Promise((resolve) => {
          PushNotification.requestPermissions()
            .then((permissions) => {
              console.log('✅ Permisos iOS concedidos:', permissions);
              resolve(permissions.alert || permissions.badge);
            })
            .catch((error) => {
              logger.error('❌ Error solicitando permisos iOS:', error);
              resolve(false);
            });
        });
      }

      return false;

    } catch (error) {
      logger.error('❌ Error en requestPermissions:', error);
      return false;
    }
  }

  /**
   * Crear canales de notificaciones (Android)
   */
  createNotificationChannels() {
    logger.info('📢 Creando canales de notificaciones (Android)...', '');

    const channels = [
      {
        channelId: 'crisis_notifications',
        channelName: 'Crisis Cercanas',
        channelDescription: 'Notificaciones de alta prioridad sobre crisis cerca de ti',
        importance: 5, // IMPORTANCE_HIGH
        vibrate: true,
        playSound: true,
        soundName: 'default'
      },
      {
        channelId: 'mission_notifications',
        channelName: 'Misiones',
        channelDescription: 'Actualizaciones sobre tus misiones activas',
        importance: 4,
        vibrate: true,
        playSound: true
      },
      {
        channelId: 'fractal_notifications',
        channelName: 'Fractales',
        channelDescription: 'Alertas cuando hay fractales cerca para recolectar',
        importance: 3,
        vibrate: true,
        playSound: false
      },
      {
        channelId: 'game_notifications',
        channelName: 'Juego',
        channelDescription: 'Notificaciones generales del juego',
        importance: 3,
        vibrate: false,
        playSound: false
      },
      {
        channelId: 'reminder_notifications',
        channelName: 'Recordatorios',
        channelDescription: 'Recordatorios personalizados',
        importance: 2,
        vibrate: false,
        playSound: false
      },
      {
        channelId: 'community_notifications',
        channelName: 'Eventos Comunitarios',
        channelDescription: 'Eventos globales y actividades especiales',
        importance: 3,
        vibrate: true,
        playSound: true
      }
    ];

    channels.forEach(channel => {
      PushNotification.createChannel(
        channel,
        (created) => logger.info("`Canal ${channel.channelId}: ${created ? '✅' : '⚠️ ya existe'}`", "")
      );
    });
  }

  /**
   * Configurar handlers de notificaciones push
   */
  setupPushNotificationHandlers() {
    logger.info('⚙️ Configurando handlers de notificaciones...', '');

    PushNotification.configure({
      // Cuando llega una notificación (app en foreground o background)
      onNotification: (notification) => {
        console.log('📬 Notificación recibida:', notification);

        // Registrar en analytics
        if (notification.userInteraction) {
          // Usuario tocó la notificación
          this.trackNotificationOpened(notification);
          this.handleNotificationAction(notification);
        } else {
          // Notificación mostrada pero no interactuada
          this.trackNotificationShown(notification);
        }

        // Requerido en iOS
        if (Platform.OS === 'ios') {
          notification.finish('UIBackgroundFetchResultNoData');
        }
      },

      // Cuando se registra el token (para push notifications remotas)
      onRegister: (token) => {
        console.log('🔑 Token de notificaciones push:', token);
        this.saveDeviceToken(token);
      },

      // Cuando hay error al registrar
      onRegistrationError: (error) => {
        logger.error('❌ Error registrando notificaciones push:', error);
      },

      // Permisos
      permissions: {
        alert: true,
        badge: true,
        sound: true
      },

      // Solo solicitar permisos en iOS cuando sea necesario
      requestPermissions: Platform.OS === 'ios'
    });
  }

  // ═══════════════════════════════════════════════════════════
  // ENVÍO DE NOTIFICACIONES
  // ═══════════════════════════════════════════════════════════

  /**
   * Enviar notificación (con filtros y priorización)
   */
  async sendNotification(type, data, options = {}) {
    // Verificar si las notificaciones están habilitadas
    if (!this.config.enabled || !this.config.enabledTypes[type]) {
      logger.info("`⏭️ Notificación tipo ${type} deshabilitada`", "");
      return false;
    }

    // Verificar límite diario
    if (this.dailyNotificationCount >= this.config.maxPerDay) {
      logger.info("`⏭️ Límite diario de notificaciones alcanzado (${this.config.maxPerDay})`", "");
      return false;
    }

    // Verificar horario de silencio
    if (this.isQuietHours() && !options.ignoreQuietHours) {
      logger.info('⏭️ Horario de silencio activo, notificación bloqueada', '');
      return false;
    }

    // Construir notificación según tipo
    const notification = this.buildNotification(type, data, options);

    if (!notification) {
      console.error('❌ Error construyendo notificación');
      return false;
    }

    // Enviar notificación local
    try {
      PushNotification.localNotification(notification);

      // Incrementar contador diario
      this.dailyNotificationCount++;
      await this.saveDailyCount();

      // Registrar en analytics
      this.trackNotificationSent(type);

      console.log(`✅ Notificación enviada: ${type}`, notification);
      return true;

    } catch (error) {
      logger.error('❌ Error enviando notificación:', error);
      return false;
    }
  }

  /**
   * Construir notificación según tipo
   */
  buildNotification(type, data, options) {
    const baseNotification = {
      channelId: this.getChannelForType(type),
      priority: options.priority || 'high',
      vibrate: options.vibrate !== false,
      playSound: options.playSound !== false,
      soundName: options.soundName || 'default',
      userInfo: {
        type: type,
        data: data,
        timestamp: new Date().toISOString()
      }
    };

    switch (type) {
      case NOTIFICATION_TYPES.CRISIS_NEARBY:
        return {
          ...baseNotification,
          title: '🔥 Crisis cerca de ti',
          message: data.crisisName || 'Nueva crisis detectada',
          bigText: `${data.crisisType || 'Crisis'} a ${data.distance || '<500'}m de tu ubicación. ¡Tu ayuda es necesaria!`,
          channelId: 'crisis_notifications',
          priority: 'max', // Máxima prioridad
          importance: 'high',
          actions: JSON.stringify([
            { id: 'view', title: 'Ver Crisis' },
            { id: 'dismiss', title: 'Ignorar' }
          ]),
          data: {
            screen: 'CrisisDetail',
            crisisId: data.crisisId
          }
        };

      case NOTIFICATION_TYPES.MISSION_COMPLETED:
        return {
          ...baseNotification,
          title: '✅ Misión completada',
          message: data.missionName || 'Una de tus misiones ha finalizado',
          bigText: `Recompensas: ${data.xp || 0} XP, ${data.consciousness || 0} Consciencia, ${data.energy || 0} Energía`,
          channelId: 'mission_notifications',
          actions: JSON.stringify([
            { id: 'collect', title: 'Recoger Recompensas' },
            { id: 'later', title: 'Más Tarde' }
          ]),
          data: {
            screen: 'Profile',
            missionId: data.missionId
          }
        };

      case NOTIFICATION_TYPES.FRACTAL_ACTIVATED:
        return {
          ...baseNotification,
          title: `✨ Fractal de ${data.fractalType || 'Sabiduría'} cercano`,
          message: 'Toca para recolectar',
          bigText: `Hay un fractal a menos de ${data.distance || 50}m de ti. ¡Recógelo antes de que desaparezca!`,
          channelId: 'fractal_notifications',
          actions: JSON.stringify([
            { id: 'collect', title: 'Ir a Recoger' },
            { id: 'dismiss', title: 'Ignorar' }
          ]),
          data: {
            screen: 'Map',
            fractalId: data.fractalId,
            centerOnFractal: true
          }
        };

      case NOTIFICATION_TYPES.ENERGY_FULL:
        return {
          ...baseNotification,
          title: '⚡ Energía completa',
          message: 'Listo para nuevas misiones',
          bigText: 'Tu energía se ha recuperado al 100%. ¡Es momento de continuar tu transformación!',
          channelId: 'game_notifications',
          data: {
            screen: 'Map'
          }
        };

      case NOTIFICATION_TYPES.BEING_RESTED:
        return {
          ...baseNotification,
          title: `💤 ${data.beingName || 'Un ser'} ha descansado`,
          message: 'Disponible para desplegar',
          bigText: `${data.beingName || 'Tu ser'} ha terminado de descansar y está listo para nuevas misiones.`,
          channelId: 'game_notifications',
          data: {
            screen: 'Profile',
            tab: 'beings'
          }
        };

      case NOTIFICATION_TYPES.READING_REMINDER:
        return {
          ...baseNotification,
          title: '📚 Momento de crecer',
          message: 'Lee 1 capítulo = 1 ser nuevo',
          bigText: 'La lectura transforma. Cada capítulo completado te permite crear un nuevo ser con atributos únicos.',
          channelId: 'reminder_notifications',
          playSound: false,
          vibrate: false,
          data: {
            screen: 'Library'
          }
        };

      case NOTIFICATION_TYPES.COMMUNITY_EVENT:
        return {
          ...baseNotification,
          title: '🌍 Evento global',
          message: data.eventName || 'Nuevo evento comunitario',
          bigText: data.eventDescription || 'Se ha activado un nuevo evento global. ¡Participa con otros jugadores!',
          channelId: 'community_notifications',
          data: {
            screen: 'Events',
            eventId: data.eventId
          }
        };

      default:
        console.warn(`⚠️ Tipo de notificación desconocido: ${type}`);
        return null;
    }
  }

  /**
   * Obtener canal apropiado para tipo de notificación
   */
  getChannelForType(type) {
    const channelMap = {
      [NOTIFICATION_TYPES.CRISIS_NEARBY]: 'crisis_notifications',
      [NOTIFICATION_TYPES.MISSION_COMPLETED]: 'mission_notifications',
      [NOTIFICATION_TYPES.FRACTAL_ACTIVATED]: 'fractal_notifications',
      [NOTIFICATION_TYPES.ENERGY_FULL]: 'game_notifications',
      [NOTIFICATION_TYPES.BEING_RESTED]: 'game_notifications',
      [NOTIFICATION_TYPES.READING_REMINDER]: 'reminder_notifications',
      [NOTIFICATION_TYPES.COMMUNITY_EVENT]: 'community_notifications'
    };

    return channelMap[type] || 'game_notifications';
  }

  // ═══════════════════════════════════════════════════════════
  // NOTIFICACIONES PROGRAMADAS
  // ═══════════════════════════════════════════════════════════

  /**
   * Programar notificación local para el futuro
   */
  async scheduleNotification(type, data, scheduledDate, options = {}) {
    const notification = this.buildNotification(type, data, options);

    if (!notification) {
      console.error('❌ Error construyendo notificación programada');
      return false;
    }

    try {
      const notificationId = Date.now(); // ID único

      PushNotification.localNotificationSchedule({
        ...notification,
        id: notificationId,
        date: scheduledDate, // Objeto Date
        allowWhileIdle: true // Android: permitir aunque en modo ahorro
      });

      // Guardar en lista de programadas
      this.scheduledNotifications.push({
        id: notificationId,
        type: type,
        scheduledFor: scheduledDate.toISOString()
      });

      await this.saveScheduledNotifications();

      console.log(`⏰ Notificación programada para ${scheduledDate}:`, type);
      return notificationId;

    } catch (error) {
      logger.error('❌ Error programando notificación:', error);
      return false;
    }
  }

  /**
   * Programar recordatorio diario de lectura
   */
  async scheduleReadingReminder(time = '20:00') {
    // Cancelar recordatorio anterior si existe
    await this.cancelReadingReminder();

    const [hour, minute] = time.split(':').map(Number);
    const now = new Date();
    const scheduledDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hour,
      minute,
      0
    );

    // Si la hora ya pasó hoy, programar para mañana
    if (scheduledDate < now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    const notificationId = await this.scheduleNotification(
      NOTIFICATION_TYPES.READING_REMINDER,
      {},
      scheduledDate,
      { repeatType: 'day' } // Repetir cada día
    );

    // Guardar configuración
    this.config.readingReminderTime = time;
    await this.saveConfig();

    logger.info("`📚 Recordatorio de lectura programado para ${time} diariamente`", "");
    return notificationId;
  }

  /**
   * Cancelar recordatorio de lectura
   */
  async cancelReadingReminder() {
    const reminderNotifications = this.scheduledNotifications.filter(
      n => n.type === NOTIFICATION_TYPES.READING_REMINDER
    );

    for (const notification of reminderNotifications) {
      PushNotification.cancelLocalNotification(notification.id);
    }

    this.scheduledNotifications = this.scheduledNotifications.filter(
      n => n.type !== NOTIFICATION_TYPES.READING_REMINDER
    );

    await this.saveScheduledNotifications();
    logger.info('❌ Recordatorio de lectura cancelado', '');
  }

  /**
   * Cancelar notificación programada por ID
   */
  async cancelScheduledNotification(notificationId) {
    PushNotification.cancelLocalNotification(notificationId);

    this.scheduledNotifications = this.scheduledNotifications.filter(
      n => n.id !== notificationId
    );

    await this.saveScheduledNotifications();
    logger.info("`❌ Notificación ${notificationId} cancelada`", "");
  }

  /**
   * Cancelar todas las notificaciones programadas
   */
  async cancelAllScheduledNotifications() {
    PushNotification.cancelAllLocalNotifications();
    this.scheduledNotifications = [];
    await this.saveScheduledNotifications();
    logger.info('❌ Todas las notificaciones programadas canceladas', '');
  }

  // ═══════════════════════════════════════════════════════════
  // NOTIFICACIONES ESPECÍFICAS DEL JUEGO
  // ═══════════════════════════════════════════════════════════

  /**
   * Notificar crisis cercana
   */
  async notifyCrisisNearby(crisis, distance) {
    return await this.sendNotification(
      NOTIFICATION_TYPES.CRISIS_NEARBY,
      {
        crisisId: crisis.id,
        crisisName: crisis.name,
        crisisType: crisis.type,
        distance: Math.round(distance)
      },
      {
        priority: 'max',
        vibrate: true,
        playSound: true
      }
    );
  }

  /**
   * Notificar misión completada
   */
  async notifyMissionCompleted(mission, rewards) {
    return await this.sendNotification(
      NOTIFICATION_TYPES.MISSION_COMPLETED,
      {
        missionId: mission.id,
        missionName: mission.name,
        xp: rewards.xp || 0,
        consciousness: rewards.consciousness || 0,
        energy: rewards.energy || 0
      }
    );
  }

  /**
   * Notificar fractal cercano activado
   */
  async notifyFractalActivated(fractal, distance) {
    return await this.sendNotification(
      NOTIFICATION_TYPES.FRACTAL_ACTIVATED,
      {
        fractalId: fractal.id,
        fractalType: fractal.type,
        distance: Math.round(distance)
      }
    );
  }

  /**
   * Notificar energía completa
   */
  async notifyEnergyFull() {
    return await this.sendNotification(
      NOTIFICATION_TYPES.ENERGY_FULL,
      {}
    );
  }

  /**
   * Notificar ser descansado
   */
  async notifyBeingRested(being) {
    return await this.sendNotification(
      NOTIFICATION_TYPES.BEING_RESTED,
      {
        beingId: being.id,
        beingName: being.name
      }
    );
  }

  /**
   * Notificar evento comunitario (push desde servidor)
   */
  async notifyCommunityEvent(event) {
    return await this.sendNotification(
      NOTIFICATION_TYPES.COMMUNITY_EVENT,
      {
        eventId: event.id,
        eventName: event.name,
        eventDescription: event.description
      },
      {
        ignoreQuietHours: true // Eventos importantes ignoran horario de silencio
      }
    );
  }

  // ═══════════════════════════════════════════════════════════
  // BACKGROUND TASKS
  // ═══════════════════════════════════════════════════════════

  /**
   * Iniciar tareas en background
   */
  startBackgroundTasks() {
    logger.info('🔄 Iniciando background tasks...', '');

    // Verificar energía cada 5 minutos
    BackgroundTimer.setInterval(() => {
      this.checkEnergyStatus();
    }, 5 * 60 * 1000); // 5 minutos

    // Verificar seres descansando cada 10 minutos
    BackgroundTimer.setInterval(() => {
      this.checkRestingBeings();
    }, 10 * 60 * 1000); // 10 minutos

    // Verificar misiones completadas cada 15 minutos
    BackgroundTimer.setInterval(() => {
      this.checkCompletedMissions();
    }, 15 * 60 * 1000); // 15 minutos
  }

  /**
   * Detener tareas en background
   */
  stopBackgroundTasks() {
    logger.info('⏸️ Deteniendo background tasks...', '');
    BackgroundTimer.stopBackgroundTimer();
  }

  /**
   * Verificar estado de energía
   */
  async checkEnergyStatus() {
    try {
      const gameState = await AsyncStorage.getItem('game_state');
      if (!gameState) return;

      const state = JSON.parse(gameState);
      const { user } = state;

      // Notificar si energía está completa
      if (user.energy >= user.maxEnergy) {
        // Verificar si no se notificó recientemente
        const lastNotification = await AsyncStorage.getItem('last_energy_notification');
        const now = Date.now();

        if (!lastNotification || (now - parseInt(lastNotification)) > 2 * 60 * 60 * 1000) {
          await this.notifyEnergyFull();
          await AsyncStorage.setItem('last_energy_notification', now.toString());
        }
      }
    } catch (error) {
      logger.error('❌ Error verificando energía:', error);
    }
  }

  /**
   * Verificar seres descansando
   */
  async checkRestingBeings() {
    try {
      const gameState = await AsyncStorage.getItem('game_state');
      if (!gameState) return;

      const state = JSON.parse(gameState);
      const { beings } = state;

      const now = Date.now();

      for (const being of beings) {
        if (being.status === 'resting' && being.restUntil) {
          const restEndTime = new Date(being.restUntil).getTime();

          // Si terminó de descansar hace menos de 15 minutos, notificar
          if (now >= restEndTime && now - restEndTime < 15 * 60 * 1000) {
            await this.notifyBeingRested(being);
          }
        }
      }
    } catch (error) {
      logger.error('❌ Error verificando seres:', error);
    }
  }

  /**
   * Verificar misiones completadas
   */
  async checkCompletedMissions() {
    try {
      const activeMissions = await AsyncStorage.getItem('active_missions');
      if (!activeMissions) return;

      const missions = JSON.parse(activeMissions);
      const now = Date.now();

      for (const mission of missions) {
        if (mission.completesAt) {
          const completionTime = new Date(mission.completesAt).getTime();

          // Si completó hace menos de 15 minutos, notificar
          if (now >= completionTime && now - completionTime < 15 * 60 * 1000) {
            await this.notifyMissionCompleted(mission, mission.rewards || {});
          }
        }
      }
    } catch (error) {
      logger.error('❌ Error verificando misiones:', error);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════

  /**
   * Verificar si estamos en horario de silencio
   */
  isQuietHours() {
    const now = new Date();
    const currentHour = now.getHours();

    const start = this.config.quietHoursStart;
    const end = this.config.quietHoursEnd;

    if (start < end) {
      // Ejemplo: 22:00 - 08:00
      return currentHour >= start || currentHour < end;
    } else {
      // Ejemplo: 08:00 - 22:00 (horario invertido, poco común)
      return currentHour >= start && currentHour < end;
    }
  }

  /**
   * Resetear contador diario si cambió el día
   */
  async resetDailyCountIfNeeded() {
    const today = new Date().toDateString();

    if (this.lastResetDate !== today) {
      this.dailyNotificationCount = 0;
      this.lastResetDate = today;
      await this.saveDailyCount();
      logger.info('🔄 Contador diario de notificaciones reseteado', '');
    }
  }

  /**
   * Manejar acción de notificación (cuando usuario toca)
   */
  handleNotificationAction(notification) {
    const { type, data } = notification.userInfo || {};

    console.log(`👆 Usuario tocó notificación tipo: ${type}`, data);

    // Aquí se debe navegar a la pantalla correspondiente
    // Esto se implementa mejor desde el componente raíz de la app
    // que tiene acceso al navigation context

    // Emitir evento para que la app lo capture
    if (global.notificationActionHandler) {
      global.notificationActionHandler(type, data);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════════

  /**
   * Registrar notificación enviada
   */
  trackNotificationSent(type) {
    this.analytics.sent++;

    if (!this.analytics.byType[type]) {
      this.analytics.byType[type] = { sent: 0, opened: 0, dismissed: 0 };
    }

    this.analytics.byType[type].sent++;
    this.saveAnalytics();
  }

  /**
   * Registrar notificación mostrada
   */
  trackNotificationShown(notification) {
    logger.info('👀 Notificación mostrada (no interactuada)', '');
  }

  /**
   * Registrar notificación abierta
   */
  trackNotificationOpened(notification) {
    this.analytics.opened++;

    const type = notification.userInfo?.type;

    if (type && this.analytics.byType[type]) {
      this.analytics.byType[type].opened++;
    }

    this.saveAnalytics();
    console.log('📊 Analytics: Notificación abierta', type);
  }

  /**
   * Obtener estadísticas de notificaciones
   */
  getAnalytics() {
    return {
      ...this.analytics,
      openRate: this.analytics.sent > 0
        ? ((this.analytics.opened / this.analytics.sent) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  // ═══════════════════════════════════════════════════════════
  // CONFIGURACIÓN
  // ═══════════════════════════════════════════════════════════

  /**
   * Actualizar configuración
   */
  async updateConfig(updates) {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();
    console.log('⚙️ Configuración actualizada:', updates);
  }

  /**
   * Habilitar/deshabilitar tipo de notificación
   */
  async setNotificationTypeEnabled(type, enabled) {
    this.config.enabledTypes[type] = enabled;
    await this.saveConfig();
    logger.info("`🔔 Notificación ${type}: ${enabled ? 'habilitada' : 'deshabilitada'}`", "");
  }

  /**
   * Configurar horario de silencio
   */
  async setQuietHours(startHour, endHour) {
    this.config.quietHoursStart = startHour;
    this.config.quietHoursEnd = endHour;
    await this.saveConfig();
    logger.info("`🔕 Horario de silencio: ${startHour}:00 - ${endHour}:00`", "");
  }

  /**
   * Obtener configuración actual
   */
  getConfig() {
    return { ...this.config };
  }

  // ═══════════════════════════════════════════════════════════
  // PERSISTENCIA
  // ═══════════════════════════════════════════════════════════

  /**
   * Guardar configuración
   */
  async saveConfig() {
    try {
      await AsyncStorage.setItem('notification_config', JSON.stringify(this.config));
    } catch (error) {
      logger.error('❌ Error guardando configuración:', error);
    }
  }

  /**
   * Cargar configuración
   */
  async loadConfig() {
    try {
      const stored = await AsyncStorage.getItem('notification_config');

      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
        logger.info('✅ Configuración cargada', '');
      }
    } catch (error) {
      logger.error('❌ Error cargando configuración:', error);
    }
  }

  /**
   * Guardar notificaciones programadas
   */
  async saveScheduledNotifications() {
    try {
      await AsyncStorage.setItem(
        'scheduled_notifications',
        JSON.stringify(this.scheduledNotifications)
      );
    } catch (error) {
      logger.error('❌ Error guardando notificaciones programadas:', error);
    }
  }

  /**
   * Cargar notificaciones programadas
   */
  async loadScheduledNotifications() {
    try {
      const stored = await AsyncStorage.getItem('scheduled_notifications');

      if (stored) {
        this.scheduledNotifications = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('❌ Error cargando notificaciones programadas:', error);
    }
  }

  /**
   * Guardar contador diario
   */
  async saveDailyCount() {
    try {
      await AsyncStorage.setItem('notification_daily_data', JSON.stringify({
        count: this.dailyNotificationCount,
        date: this.lastResetDate
      }));
    } catch (error) {
      logger.error('❌ Error guardando contador diario:', error);
    }
  }

  /**
   * Cargar contador diario
   */
  async loadDailyCount() {
    try {
      const stored = await AsyncStorage.getItem('notification_daily_data');

      if (stored) {
        const data = JSON.parse(stored);
        this.dailyNotificationCount = data.count || 0;
        this.lastResetDate = data.date;
      }
    } catch (error) {
      logger.error('❌ Error cargando contador diario:', error);
    }
  }

  /**
   * Guardar analytics
   */
  async saveAnalytics() {
    try {
      await AsyncStorage.setItem('notification_analytics', JSON.stringify(this.analytics));
    } catch (error) {
      logger.error('❌ Error guardando analytics:', error);
    }
  }

  /**
   * Cargar analytics
   */
  async loadAnalytics() {
    try {
      const stored = await AsyncStorage.getItem('notification_analytics');

      if (stored) {
        this.analytics = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('❌ Error cargando analytics:', error);
    }
  }

  /**
   * Guardar token de dispositivo (para push notifications remotas)
   */
  async saveDeviceToken(token) {
    try {
      await AsyncStorage.setItem('device_push_token', JSON.stringify(token));
      logger.info('💾 Token de dispositivo guardado', '');
    } catch (error) {
      logger.error('❌ Error guardando token:', error);
    }
  }

  /**
   * Obtener token de dispositivo
   */
  async getDeviceToken() {
    try {
      const stored = await AsyncStorage.getItem('device_push_token');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      logger.error('❌ Error obteniendo token:', error);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // TESTING Y DEBUG
  // ═══════════════════════════════════════════════════════════

  /**
   * Enviar notificación de prueba
   */
  async sendTestNotification(type) {
    logger.info("`🧪 Enviando notificación de prueba: ${type}`", "");

    const testData = {
      [NOTIFICATION_TYPES.CRISIS_NEARBY]: {
        crisisId: 'test-123',
        crisisName: 'Crisis de Prueba',
        crisisType: 'ambiental',
        distance: 250
      },
      [NOTIFICATION_TYPES.MISSION_COMPLETED]: {
        missionId: 'test-mission',
        missionName: 'Misión de Prueba',
        xp: 100,
        consciousness: 50,
        energy: 20
      },
      [NOTIFICATION_TYPES.FRACTAL_ACTIVATED]: {
        fractalId: 'test-fractal',
        fractalType: 'Sabiduría',
        distance: 35
      },
      [NOTIFICATION_TYPES.BEING_RESTED]: {
        beingId: 'test-being',
        beingName: 'Ser de Prueba'
      },
      [NOTIFICATION_TYPES.COMMUNITY_EVENT]: {
        eventId: 'test-event',
        eventName: 'Evento de Prueba',
        eventDescription: 'Este es un evento de prueba del sistema de notificaciones'
      }
    };

    return await this.sendNotification(
      type,
      testData[type] || {},
      { ignoreQuietHours: true } // Ignorar horario de silencio en tests
    );
  }

  /**
   * Resetear todos los contadores y analytics
   */
  async resetAnalytics() {
    this.analytics = {
      sent: 0,
      opened: 0,
      dismissed: 0,
      byType: {}
    };

    await this.saveAnalytics();
    logger.info('🔄 Analytics reseteados', '');
  }

  /**
   * Limpiar todas las notificaciones del centro de notificaciones
   */
  clearAllNotifications() {
    PushNotification.removeAllDeliveredNotifications();
    logger.info('🧹 Todas las notificaciones eliminadas del centro', '');
  }
}

// ═══════════════════════════════════════════════════════════
// EXPORTAR INSTANCIA SINGLETON
// ═══════════════════════════════════════════════════════════

export default new NotificationService();
