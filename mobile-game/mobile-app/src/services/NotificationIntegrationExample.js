/**
 * NOTIFICATION INTEGRATION EXAMPLES
 * Ejemplos de cómo integrar NotificationService en diferentes partes de la app
 */

import NotificationService, { NOTIFICATION_TYPES } from './NotificationService';
import useGameStore from '../stores/gameStore';

// ═══════════════════════════════════════════════════════════
// EJEMPLO 1: Inicialización en App.js
// ═══════════════════════════════════════════════════════════

export const initializeNotificationsInApp = async (navigation) => {
  logger.info('🔔 Inicializando sistema de notificaciones...', '');

  // Inicializar servicio
  const initialized = await NotificationService.initialize();

  if (!initialized) {
    console.warn('⚠️ No se pudieron inicializar las notificaciones');
    return false;
  }

  // Configurar handler global para acciones de notificaciones
  global.notificationActionHandler = (type, data) => {
    console.log(`📲 Notificación tocada: ${type}`, data);

    // Navegar a la pantalla apropiada
    switch (data.screen) {
      case 'CrisisDetail':
        navigation.navigate('CrisisDetail', { crisisId: data.crisisId });
        break;

      case 'Map':
        if (data.centerOnFractal) {
          navigation.navigate('Map', {
            centerOn: {
              latitude: data.latitude,
              longitude: data.longitude
            },
            highlightFractal: data.fractalId
          });
        } else {
          navigation.navigate('Map');
        }
        break;

      case 'Profile':
        navigation.navigate('Profile', { tab: data.tab || 'overview' });
        break;

      case 'Library':
        navigation.navigate('Library');
        break;

      case 'Events':
        navigation.navigate('Events', { eventId: data.eventId });
        break;

      default:
        console.warn(`⚠️ Pantalla desconocida: ${data.screen}`);
    }
  };

  // Programar recordatorio diario de lectura (si está habilitado)
  const config = NotificationService.getConfig();
  if (config.enabledTypes[NOTIFICATION_TYPES.READING_REMINDER]) {
    await NotificationService.scheduleReadingReminder(
      config.readingReminderTime || '20:00'
    );
  }

  logger.info('✅ Sistema de notificaciones listo', '');
  return true;
};

// ═══════════════════════════════════════════════════════════
// EJEMPLO 2: Monitoreo de Crisis Cercanas (MapScreen)
// ═══════════════════════════════════════════════════════════

export class CrisisProximityMonitor {
  constructor() {
    this.notifiedCrises = new Set();
    this.notificationCooldown = 30 * 60 * 1000; // 30 minutos
    this.lastNotificationTimes = new Map();
  }

  /**
   * Verificar y notificar crisis cercanas
   */
  async checkNearbyCrises(userLocation, crises) {
    const now = Date.now();

    for (const crisis of crises) {
      const distance = this.calculateDistance(
        userLocation,
        crisis.location
      );

      // Crisis a menos de 500m
      if (distance < 500) {
        const crisisId = crisis.id;
        const lastNotified = this.lastNotificationTimes.get(crisisId);

        // Notificar solo si no se notificó recientemente
        if (!lastNotified || (now - lastNotified) > this.notificationCooldown) {
          const notified = await NotificationService.notifyCrisisNearby(
            crisis,
            Math.round(distance)
          );

          if (notified) {
            this.lastNotificationTimes.set(crisisId, now);
            logger.info("`🔥 Notificada crisis ${crisis.name} a ${distance}m`", "");
          }
        }
      }
    }
  }

  /**
   * Calcular distancia entre dos puntos (Haversine formula)
   */
  calculateDistance(point1, point2) {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
  }

  /**
   * Resetear estado
   */
  reset() {
    this.notifiedCrises.clear();
    this.lastNotificationTimes.clear();
  }
}

// ═══════════════════════════════════════════════════════════
// EJEMPLO 3: Monitoreo de Fractales (MapScreen)
// ═══════════════════════════════════════════════════════════

export class FractalProximityMonitor {
  constructor() {
    this.activatedFractals = new Set();
  }

  /**
   * Verificar fractales cercanos
   */
  async checkNearbyFractals(userLocation, fractals) {
    for (const fractal of fractals) {
      const distance = this.calculateDistance(
        userLocation,
        fractal.location
      );

      // Fractal a menos de 50m y no notificado antes
      if (distance < 50 && !this.activatedFractals.has(fractal.id)) {
        const notified = await NotificationService.notifyFractalActivated(
          fractal,
          Math.round(distance)
        );

        if (notified) {
          this.activatedFractals.add(fractal.id);
          logger.info("`✨ Notificado fractal ${fractal.type} a ${distance}m`", "");
        }
      }
    }
  }

  /**
   * Remover fractal del tracking (cuando se recoge)
   */
  removeFractal(fractalId) {
    this.activatedFractals.delete(fractalId);
  }

  /**
   * Calcular distancia
   */
  calculateDistance(point1, point2) {
    const R = 6371e3;
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

// ═══════════════════════════════════════════════════════════
// EJEMPLO 4: Monitoreo de Misiones (MissionManager)
// ═══════════════════════════════════════════════════════════

export class MissionCompletionMonitor {
  constructor() {
    this.checkInterval = null;
  }

  /**
   * Iniciar monitoreo de misiones
   */
  startMonitoring(activeMissions) {
    this.stopMonitoring(); // Detener si ya existe

    this.checkInterval = setInterval(() => {
      this.checkCompletedMissions(activeMissions);
    }, 60 * 1000); // Cada minuto
  }

  /**
   * Verificar misiones completadas
   */
  async checkCompletedMissions(missions) {
    const now = Date.now();

    for (const mission of missions) {
      if (mission.completesAt && !mission.notified) {
        const completionTime = new Date(mission.completesAt).getTime();

        if (now >= completionTime) {
          await NotificationService.notifyMissionCompleted(
            mission,
            mission.rewards || {}
          );

          // Marcar como notificada para evitar duplicados
          mission.notified = true;

          logger.info("`✅ Notificada misión completada: ${mission.name}`", "");
        }
      }
    }
  }

  /**
   * Detener monitoreo
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// ═══════════════════════════════════════════════════════════
// EJEMPLO 5: Monitoreo de Energía (Zustand Store)
// ═══════════════════════════════════════════════════════════

export class EnergyMonitor {
  constructor() {
    this.wasEnergyFull = false;
    this.lastNotificationTime = 0;
    this.cooldown = 2 * 60 * 60 * 1000; // 2 horas entre notificaciones
  }

  /**
   * Verificar si energía está completa
   */
  async checkEnergyStatus(currentEnergy, maxEnergy) {
    const isFullNow = currentEnergy >= maxEnergy;

    // Si energía acaba de llenarse
    if (isFullNow && !this.wasEnergyFull) {
      const now = Date.now();

      // Respetar cooldown
      if (now - this.lastNotificationTime > this.cooldown) {
        await NotificationService.notifyEnergyFull();
        this.lastNotificationTime = now;
        logger.info('⚡ Notificada energía completa', '');
      }
    }

    this.wasEnergyFull = isFullNow;
  }
}

// ═══════════════════════════════════════════════════════════
// EJEMPLO 6: Monitoreo de Seres Descansando
// ═══════════════════════════════════════════════════════════

export class BeingRestMonitor {
  constructor() {
    this.notifiedBeings = new Set();
  }

  /**
   * Verificar seres que terminaron de descansar
   */
  async checkRestingBeings(beings) {
    const now = Date.now();

    for (const being of beings) {
      if (being.status === 'resting' && being.restUntil) {
        const restEndTime = new Date(being.restUntil).getTime();

        // Si terminó de descansar y no se notificó
        if (now >= restEndTime && !this.notifiedBeings.has(being.id)) {
          await NotificationService.notifyBeingRested(being);
          this.notifiedBeings.add(being.id);

          logger.info("`💤 Notificado ser descansado: ${being.name}`", "");
        }
      }

      // Limpiar si el ser ya no está descansando
      if (being.status !== 'resting' && this.notifiedBeings.has(being.id)) {
        this.notifiedBeings.delete(being.id);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// EJEMPLO 7: Integración con Zustand Store
// ═══════════════════════════════════════════════════════════

export const setupNotificationMiddleware = (gameStore) => {
  const energyMonitor = new EnergyMonitor();
  const beingMonitor = new BeingRestMonitor();

  // Suscribirse a cambios en el store
  gameStore.subscribe((state, prevState) => {
    // Monitorear energía
    if (state.user.energy !== prevState.user.energy) {
      energyMonitor.checkEnergyStatus(
        state.user.energy,
        state.user.maxEnergy
      );
    }

    // Monitorear seres
    if (state.beings !== prevState.beings) {
      beingMonitor.checkRestingBeings(state.beings);
    }
  });

  logger.info('✅ Middleware de notificaciones conectado al store', '');
};

// ═══════════════════════════════════════════════════════════
// EJEMPLO 8: Pantalla de Configuración de Notificaciones
// ═══════════════════════════════════════════════════════════

export const NotificationSettingsComponent = {
  /**
   * Obtener configuración actual
   */
  async getSettings() {
    return NotificationService.getConfig();
  },

  /**
   * Habilitar/deshabilitar notificaciones globalmente
   */
  async toggleNotifications(enabled) {
    await NotificationService.updateConfig({ enabled });
  },

  /**
   * Habilitar/deshabilitar tipo específico
   */
  async toggleNotificationType(type, enabled) {
    await NotificationService.setNotificationTypeEnabled(type, enabled);
  },

  /**
   * Configurar horario de silencio
   */
  async setQuietHours(startHour, endHour) {
    await NotificationService.setQuietHours(startHour, endHour);
  },

  /**
   * Configurar límite diario
   */
  async setDailyLimit(limit) {
    await NotificationService.updateConfig({ maxPerDay: limit });
  },

  /**
   * Configurar hora de recordatorio de lectura
   */
  async setReadingReminderTime(time) {
    await NotificationService.scheduleReadingReminder(time);
  },

  /**
   * Cancelar recordatorio de lectura
   */
  async cancelReadingReminder() {
    await NotificationService.cancelReadingReminder();
  },

  /**
   * Obtener analytics
   */
  async getAnalytics() {
    return NotificationService.getAnalytics();
  },

  /**
   * Enviar notificación de prueba
   */
  async sendTestNotification(type) {
    await NotificationService.sendTestNotification(type);
  }
};

// ═══════════════════════════════════════════════════════════
// EJEMPLO 9: Hook de React para Notificaciones
// ═══════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import logger from '../utils/logger';

export const useNotifications = () => {
  const [config, setConfig] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const currentConfig = NotificationService.getConfig();
    const currentAnalytics = NotificationService.getAnalytics();

    setConfig(currentConfig);
    setAnalytics(currentAnalytics);
    setLoading(false);
  };

  const toggleType = async (type, enabled) => {
    await NotificationService.setNotificationTypeEnabled(type, enabled);
    await loadData();
  };

  const setQuietHours = async (start, end) => {
    await NotificationService.setQuietHours(start, end);
    await loadData();
  };

  const sendTest = async (type) => {
    await NotificationService.sendTestNotification(type);
  };

  return {
    config,
    analytics,
    loading,
    toggleType,
    setQuietHours,
    sendTest,
    refresh: loadData
  };
};

// ═══════════════════════════════════════════════════════════
// EJEMPLO 10: Manejo de Push Notifications Remotas
// ═══════════════════════════════════════════════════════════

export const setupRemotePushNotifications = async () => {
  // Obtener token del dispositivo
  const token = await NotificationService.getDeviceToken();

  if (token) {
    console.log('📱 Token del dispositivo:', token);

    // Enviar token al servidor para poder enviar push notifications
    await sendTokenToServer(token);
  }
};

const sendTokenToServer = async (token) => {
  try {
    const response = await fetch('https://your-api.com/register-device', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token.token,
        platform: token.os,
        userId: 'current-user-id' // Obtener del store
      })
    });

    if (response.ok) {
      logger.info('✅ Token registrado en servidor', '');
    }
  } catch (error) {
    logger.error('❌ Error registrando token:', error);
  }
};

// ═══════════════════════════════════════════════════════════
// EXPORTAR TODOS LOS EJEMPLOS
// ═══════════════════════════════════════════════════════════

export default {
  initializeNotificationsInApp,
  CrisisProximityMonitor,
  FractalProximityMonitor,
  MissionCompletionMonitor,
  EnergyMonitor,
  BeingRestMonitor,
  setupNotificationMiddleware,
  NotificationSettingsComponent,
  useNotifications,
  setupRemotePushNotifications
};
