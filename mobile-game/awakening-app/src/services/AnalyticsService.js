/**
 * ANALYTICS SERVICE
 * Sistema de analytics y A/B testing para medir impacto de mejoras
 *
 * Características:
 * - Tracking de eventos clave (tutorial, misiones, energía, retención)
 * - Sistema A/B testing con grupos de control/variante
 * - Persistencia local con AsyncStorage
 * - Agregación y reporte de métricas
 *
 * @version 1.0.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  EVENTS: '@analytics_events',
  SESSION: '@analytics_session',
  AB_GROUP: '@analytics_ab_group',
  USER_COHORT: '@analytics_cohort'
};

// Eventos clave a trackear
const EVENT_TYPES = {
  // Onboarding & Tutorial
  TUTORIAL_STARTED: 'tutorial_started',
  TUTORIAL_COMPLETED: 'tutorial_completed',
  TUTORIAL_SKIPPED: 'tutorial_skipped',
  TUTORIAL_STEP_VIEWED: 'tutorial_step_viewed',

  // Misiones
  MISSION_VIEWED: 'mission_viewed',
  MISSION_STARTED: 'mission_started',
  MISSION_COMPLETED: 'mission_completed',
  MISSION_FAILED: 'mission_failed',
  TIME_TO_FIRST_MISSION: 'time_to_first_mission',

  // Energía
  ENERGY_VIEWED: 'energy_viewed',
  ENERGY_DEPLETED: 'energy_depleted',
  ENERGY_SHOP_OPENED: 'energy_shop_opened',
  ENERGY_PURCHASED: 'energy_purchased',

  // Sesión
  SESSION_STARTED: 'session_started',
  SESSION_ENDED: 'session_ended',
  APP_OPENED: 'app_opened',
  APP_BACKGROUNDED: 'app_backgrounded',

  // Retención
  DAY_1_RETURN: 'day_1_return',
  DAY_7_RETURN: 'day_7_return',
  DAY_30_RETURN: 'day_30_return',

  // Frankenstein Lab
  LAB_OPENED: 'lab_opened',
  BEING_CREATED: 'being_created',
  BEING_ASSIGNED: 'being_assigned',

  // Engagement
  SCREEN_VIEW: 'screen_view',
  FEATURE_USED: 'feature_used'
};

// Grupos A/B
const AB_GROUPS = {
  CONTROL: 'control',     // Sin mejoras de Fase 3
  VARIANT_A: 'variant_a'  // Con mejoras de Fase 3 (tutorial + energy indicator)
};

// ═══════════════════════════════════════════════════════════
// ANALYTICS SERVICE CLASS
// ═══════════════════════════════════════════════════════════

class AnalyticsService {
  constructor() {
    this.sessionStartTime = null;
    this.eventsBuffer = [];
    this.abGroup = null;
    this.userCohort = null;
    this.isInitialized = false;
  }

  // ───────────────────────────────────────────────────────
  // Inicialización
  // ───────────────────────────────────────────────────────

  async initialize() {
    try {
      // Asignar grupo A/B si no existe
      await this.assignABGroup();

      // Cargar cohorte del usuario
      await this.loadUserCohort();

      // Iniciar sesión
      this.sessionStartTime = Date.now();
      await this.trackEvent(EVENT_TYPES.APP_OPENED);

      this.isInitialized = true;

      console.log('[Analytics] Initialized', {
        abGroup: this.abGroup,
        cohort: this.userCohort
      });
    } catch (error) {
      console.error('[Analytics] Initialization error:', error);
    }
  }

  // ───────────────────────────────────────────────────────
  // A/B Testing
  // ───────────────────────────────────────────────────────

  async assignABGroup() {
    try {
      // Verificar si ya tiene grupo asignado
      let group = await AsyncStorage.getItem(STORAGE_KEYS.AB_GROUP);

      if (!group) {
        // Asignar aleatoriamente (50/50)
        group = Math.random() < 0.5 ? AB_GROUPS.CONTROL : AB_GROUPS.VARIANT_A;
        await AsyncStorage.setItem(STORAGE_KEYS.AB_GROUP, group);

        console.log('[Analytics] AB Group assigned:', group);
      }

      this.abGroup = group;
      return group;
    } catch (error) {
      console.error('[Analytics] Error assigning AB group:', error);
      this.abGroup = AB_GROUPS.VARIANT_A; // Default a variant con mejoras
      return this.abGroup;
    }
  }

  getABGroup() {
    return this.abGroup;
  }

  isControlGroup() {
    return this.abGroup === AB_GROUPS.CONTROL;
  }

  isVariantGroup() {
    return this.abGroup === AB_GROUPS.VARIANT_A;
  }

  // ───────────────────────────────────────────────────────
  // User Cohort
  // ───────────────────────────────────────────────────────

  async loadUserCohort() {
    try {
      let cohort = await AsyncStorage.getItem(STORAGE_KEYS.USER_COHORT);

      if (!cohort) {
        // Crear cohorte basada en fecha de instalación
        const installDate = new Date();
        cohort = `cohort_${installDate.getFullYear()}_${installDate.getMonth() + 1}`;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_COHORT, cohort);
      }

      this.userCohort = cohort;
      return cohort;
    } catch (error) {
      console.error('[Analytics] Error loading cohort:', error);
      return null;
    }
  }

  // ───────────────────────────────────────────────────────
  // Event Tracking
  // ───────────────────────────────────────────────────────

  async trackEvent(eventType, metadata = {}) {
    try {
      const event = {
        type: eventType,
        timestamp: Date.now(),
        abGroup: this.abGroup,
        cohort: this.userCohort,
        metadata
      };

      // Agregar a buffer
      this.eventsBuffer.push(event);

      // Persistir eventos (cada 10 eventos o inmediatamente para eventos críticos)
      const criticalEvents = [
        EVENT_TYPES.TUTORIAL_COMPLETED,
        EVENT_TYPES.MISSION_COMPLETED,
        EVENT_TYPES.TIME_TO_FIRST_MISSION
      ];

      if (this.eventsBuffer.length >= 10 || criticalEvents.includes(eventType)) {
        await this.persistEvents();
      }

      console.log('[Analytics] Event tracked:', eventType, metadata);
    } catch (error) {
      console.error('[Analytics] Error tracking event:', error);
    }
  }

  async persistEvents() {
    try {
      if (this.eventsBuffer.length === 0) return;

      // Cargar eventos existentes
      const existingEventsJson = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
      const existingEvents = existingEventsJson ? JSON.parse(existingEventsJson) : [];

      // Agregar nuevos eventos
      const allEvents = [...existingEvents, ...this.eventsBuffer];

      // Guardar (máximo 1000 eventos para no ocupar mucho espacio)
      const eventsToSave = allEvents.slice(-1000);
      await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(eventsToSave));

      // Limpiar buffer
      this.eventsBuffer = [];
    } catch (error) {
      console.error('[Analytics] Error persisting events:', error);
    }
  }

  // ───────────────────────────────────────────────────────
  // Métodos de conveniencia para trackear eventos
  // ───────────────────────────────────────────────────────

  // Tutorial
  async trackTutorialStarted() {
    await this.trackEvent(EVENT_TYPES.TUTORIAL_STARTED);
  }

  async trackTutorialStep(stepNumber, stepTitle) {
    await this.trackEvent(EVENT_TYPES.TUTORIAL_STEP_VIEWED, { stepNumber, stepTitle });
  }

  async trackTutorialCompleted() {
    await this.trackEvent(EVENT_TYPES.TUTORIAL_COMPLETED);
  }

  async trackTutorialSkipped(stepNumber) {
    await this.trackEvent(EVENT_TYPES.TUTORIAL_SKIPPED, { stepNumber });
  }

  // Misiones
  async trackMissionStarted(missionId, timeToFirstMission = null) {
    const metadata = { missionId };

    if (timeToFirstMission !== null) {
      await this.trackEvent(EVENT_TYPES.TIME_TO_FIRST_MISSION, {
        duration: timeToFirstMission
      });
    }

    await this.trackEvent(EVENT_TYPES.MISSION_STARTED, metadata);
  }

  async trackMissionCompleted(missionId, duration) {
    await this.trackEvent(EVENT_TYPES.MISSION_COMPLETED, {
      missionId,
      duration
    });
  }

  async trackMissionViewed(missionId) {
    await this.trackEvent(EVENT_TYPES.MISSION_VIEWED, { missionId });
  }

  // Energía
  async trackEnergyViewed(currentEnergy, maxEnergy) {
    await this.trackEvent(EVENT_TYPES.ENERGY_VIEWED, {
      currentEnergy,
      maxEnergy,
      percentage: Math.round((currentEnergy / maxEnergy) * 100)
    });
  }

  async trackEnergyDepleted() {
    await this.trackEvent(EVENT_TYPES.ENERGY_DEPLETED);
  }

  async trackEnergyShopOpened(fromLocation) {
    await this.trackEvent(EVENT_TYPES.ENERGY_SHOP_OPENED, { fromLocation });
  }

  // Sesión
  async trackSessionStart() {
    this.sessionStartTime = Date.now();
    await this.trackEvent(EVENT_TYPES.SESSION_STARTED);
  }

  async trackSessionEnd() {
    if (this.sessionStartTime) {
      const duration = Date.now() - this.sessionStartTime;
      await this.trackEvent(EVENT_TYPES.SESSION_ENDED, {
        duration,
        durationMinutes: Math.round(duration / 60000)
      });

      // Persistir eventos pendientes
      await this.persistEvents();
    }
  }

  async trackAppBackgrounded() {
    await this.trackEvent(EVENT_TYPES.APP_BACKGROUNDED);
    await this.persistEvents(); // Asegurar que se guarden los eventos
  }

  // Screens
  async trackScreenView(screenName) {
    await this.trackEvent(EVENT_TYPES.SCREEN_VIEW, { screenName });
  }

  // ───────────────────────────────────────────────────────
  // Reportes y Métricas
  // ───────────────────────────────────────────────────────

  async getMetrics() {
    try {
      const eventsJson = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
      if (!eventsJson) return null;

      const events = JSON.parse(eventsJson);

      // Calcular métricas clave
      const metrics = {
        // Tutorial
        tutorialStarted: events.filter(e => e.type === EVENT_TYPES.TUTORIAL_STARTED).length,
        tutorialCompleted: events.filter(e => e.type === EVENT_TYPES.TUTORIAL_COMPLETED).length,
        tutorialSkipped: events.filter(e => e.type === EVENT_TYPES.TUTORIAL_SKIPPED).length,
        tutorialCompletionRate: 0,

        // Misiones
        missionsStarted: events.filter(e => e.type === EVENT_TYPES.MISSION_STARTED).length,
        missionsCompleted: events.filter(e => e.type === EVENT_TYPES.MISSION_COMPLETED).length,
        missionsViewed: events.filter(e => e.type === EVENT_TYPES.MISSION_VIEWED).length,

        // Time to first mission
        timeToFirstMission: [],
        avgTimeToFirstMission: 0,

        // Energía
        energyViewed: events.filter(e => e.type === EVENT_TYPES.ENERGY_VIEWED).length,
        energyDepleted: events.filter(e => e.type === EVENT_TYPES.ENERGY_DEPLETED).length,
        energyShopOpened: events.filter(e => e.type === EVENT_TYPES.ENERGY_SHOP_OPENED).length,

        // Sesiones
        sessions: events.filter(e => e.type === EVENT_TYPES.SESSION_STARTED).length,
        avgSessionDuration: 0,

        // General
        totalEvents: events.length,
        abGroup: this.abGroup,
        cohort: this.userCohort
      };

      // Calcular completion rate del tutorial
      if (metrics.tutorialStarted > 0) {
        metrics.tutorialCompletionRate =
          (metrics.tutorialCompleted / metrics.tutorialStarted * 100).toFixed(1);
      }

      // Calcular avg time to first mission
      const timeToFirstEvents = events.filter(e => e.type === EVENT_TYPES.TIME_TO_FIRST_MISSION);
      if (timeToFirstEvents.length > 0) {
        metrics.timeToFirstMission = timeToFirstEvents.map(e => e.metadata.duration);
        metrics.avgTimeToFirstMission = Math.round(
          metrics.timeToFirstMission.reduce((a, b) => a + b, 0) / timeToFirstEvents.length / 60000
        ); // en minutos
      }

      // Calcular avg session duration
      const sessionEndEvents = events.filter(e => e.type === EVENT_TYPES.SESSION_ENDED);
      if (sessionEndEvents.length > 0) {
        const totalDuration = sessionEndEvents.reduce((sum, e) => sum + (e.metadata?.duration || 0), 0);
        metrics.avgSessionDuration = Math.round(totalDuration / sessionEndEvents.length / 60000); // en minutos
      }

      return metrics;
    } catch (error) {
      console.error('[Analytics] Error getting metrics:', error);
      return null;
    }
  }

  async getReport() {
    const metrics = await this.getMetrics();
    if (!metrics) return 'No hay datos de analytics disponibles.';

    return `
═══════════════════════════════════════════
REPORTE DE ANALYTICS
═══════════════════════════════════════════

CONFIGURACIÓN:
- Grupo A/B: ${metrics.abGroup}
- Cohorte: ${metrics.cohort}
- Total eventos: ${metrics.totalEvents}

TUTORIAL:
- Iniciados: ${metrics.tutorialStarted}
- Completados: ${metrics.tutorialCompleted}
- Salteados: ${metrics.tutorialSkipped}
- Tasa de completación: ${metrics.tutorialCompletionRate}%

MISIONES:
- Vistas: ${metrics.missionsViewed}
- Iniciadas: ${metrics.missionsStarted}
- Completadas: ${metrics.missionsCompleted}
- Tiempo promedio a 1ª misión: ${metrics.avgTimeToFirstMission} min

ENERGÍA:
- Veces visualizada: ${metrics.energyViewed}
- Veces agotada: ${metrics.energyDepleted}
- Aperturas de tienda: ${metrics.energyShopOpened}

SESIONES:
- Total sesiones: ${metrics.sessions}
- Duración promedio: ${metrics.avgSessionDuration} min

═══════════════════════════════════════════
    `.trim();
  }

  // ───────────────────────────────────────────────────────
  // Utilidades
  // ───────────────────────────────────────────────────────

  async clearAllData() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.EVENTS,
        STORAGE_KEYS.SESSION,
        STORAGE_KEYS.AB_GROUP,
        STORAGE_KEYS.USER_COHORT
      ]);

      this.eventsBuffer = [];
      this.sessionStartTime = null;
      this.abGroup = null;
      this.userCohort = null;
      this.isInitialized = false;

      console.log('[Analytics] All data cleared');
    } catch (error) {
      console.error('[Analytics] Error clearing data:', error);
    }
  }

  async exportEvents() {
    try {
      const eventsJson = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
      return eventsJson ? JSON.parse(eventsJson) : [];
    } catch (error) {
      console.error('[Analytics] Error exporting events:', error);
      return [];
    }
  }
}

// ═══════════════════════════════════════════════════════════
// EXPORT SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════

const analyticsService = new AnalyticsService();

export default analyticsService;
export { EVENT_TYPES, AB_GROUPS };
