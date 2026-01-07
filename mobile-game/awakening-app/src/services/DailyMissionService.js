/**
 * DAILY MISSION SERVICE
 * Sistema de misiones diarias con reset cada 24h
 *
 * Características:
 * - 3 misiones diarias generadas automáticamente
 * - Reset a medianoche (hora local)
 * - Bonus por completar todas las misiones del día
 * - Racha de días consecutivos
 *
 * @version 1.0.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

const STORAGE_KEY = 'daily_missions';
const STREAK_KEY = 'daily_streak';

// Plantillas de misiones diarias
const MISSION_TEMPLATES = [
  // Misiones de crisis
  {
    type: 'resolve_crisis',
    variants: [
      { title: 'Primer Respuesta', description: 'Resuelve 1 crisis de cualquier tipo', target: 1, xp: 50, consciousness: 15 },
      { title: 'Agente Activo', description: 'Resuelve 2 crisis', target: 2, xp: 100, consciousness: 30 },
      { title: 'Héroe del Día', description: 'Resuelve 3 crisis', target: 3, xp: 200, consciousness: 50 }
    ]
  },
  // Misiones de seres
  {
    type: 'deploy_beings',
    variants: [
      { title: 'Despertar', description: 'Despliega seres en 2 misiones', target: 2, xp: 40, consciousness: 10 },
      { title: 'Coordinador', description: 'Despliega 3 seres diferentes', target: 3, xp: 75, consciousness: 25 },
      { title: 'Líder de Equipo', description: 'Despliega un equipo de 2+ seres en una misión', target: 1, xp: 60, consciousness: 20 }
    ]
  },
  // Misiones de exploración
  {
    type: 'explore',
    variants: [
      { title: 'Explorador', description: 'Visita el mapa de crisis', target: 1, xp: 20, consciousness: 5 },
      { title: 'Investigador', description: 'Revisa los detalles de 3 crisis', target: 3, xp: 35, consciousness: 10 },
      { title: 'Estratega', description: 'Planifica una misión (ver probabilidades)', target: 1, xp: 30, consciousness: 10 }
    ]
  },
  // Misiones del laboratorio
  {
    type: 'lab',
    variants: [
      { title: 'Científico', description: 'Visita el Laboratorio Frankenstein', target: 1, xp: 25, consciousness: 10 },
      { title: 'Creador', description: 'Obtén 2 fragmentos de atributos', target: 2, xp: 45, consciousness: 15 },
      { title: 'Alquimista', description: 'Crea o mejora un ser en el laboratorio', target: 1, xp: 80, consciousness: 30 }
    ]
  },
  // Misiones de colección
  {
    type: 'collection',
    variants: [
      { title: 'Coleccionista', description: 'Ten al menos 3 seres en tu colección', target: 3, xp: 30, consciousness: 10 },
      { title: 'Guardián', description: 'Asegura que todos tus seres tengan +50% energía', target: 1, xp: 40, consciousness: 15 },
      { title: 'Maestro', description: 'Sube de nivel a cualquier ser', target: 1, xp: 100, consciousness: 40 }
    ]
  },
  // Misiones de consciencia
  {
    type: 'consciousness',
    variants: [
      { title: 'Iluminación', description: 'Gana 50 puntos de consciencia', target: 50, xp: 30, consciousness: 0 },
      { title: 'Despertar Interior', description: 'Gana 100 puntos de consciencia', target: 100, xp: 50, consciousness: 0 },
      { title: 'Ascensión', description: 'Gana 200 puntos de consciencia', target: 200, xp: 80, consciousness: 0 }
    ]
  }
];

// Bonus por completar todas las misiones diarias
const DAILY_COMPLETION_BONUS = {
  xp: 150,
  consciousness: 50,
  energy: 20
};

// Bonus por racha de días
const STREAK_BONUSES = {
  3: { multiplier: 1.25, badge: '🔥' },   // 3 días: +25%
  7: { multiplier: 1.5, badge: '⚡' },    // 7 días: +50%
  14: { multiplier: 1.75, badge: '💎' },  // 14 días: +75%
  30: { multiplier: 2.0, badge: '👑' }    // 30 días: x2
};

class DailyMissionService {
  constructor() {
    this.dailyMissions = [];
    this.lastResetDate = null;
    this.streak = 0;
    this.initialized = false;
  }

  /**
   * Inicializar servicio
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await this.loadData();
      await this.checkAndResetIfNeeded();
      this.initialized = true;
      logger.info('📅 DailyMissionService inicializado', '');
    } catch (error) {
      logger.error('Error inicializando DailyMissionService:', error);
    }
  }

  /**
   * Cargar datos desde AsyncStorage
   */
  async loadData() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.dailyMissions = data.missions || [];
        this.lastResetDate = data.lastResetDate;
      }

      const streakData = await AsyncStorage.getItem(STREAK_KEY);
      if (streakData) {
        const streak = JSON.parse(streakData);
        this.streak = streak.count || 0;
      }
    } catch (error) {
      logger.error('Error loading daily missions:', error);
    }
  }

  /**
   * Guardar datos
   */
  async saveData() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        missions: this.dailyMissions,
        lastResetDate: this.lastResetDate
      }));

      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({
        count: this.streak,
        lastUpdate: new Date().toISOString()
      }));
    } catch (error) {
      logger.error('Error saving daily missions:', error);
    }
  }

  /**
   * Verificar si necesita reset y hacerlo
   */
  async checkAndResetIfNeeded() {
    const today = this.getTodayDateString();

    if (this.lastResetDate !== today) {
      // Verificar racha antes de resetear
      if (this.lastResetDate) {
        const yesterday = this.getYesterdayDateString();
        const allCompleted = this.dailyMissions.every(m => m.completed);

        if (this.lastResetDate === yesterday && allCompleted) {
          // Mantener racha
          this.streak++;
          logger.info(`🔥 ¡Racha de ${this.streak} días!`, '');
        } else if (this.lastResetDate !== yesterday) {
          // Perdió la racha
          this.streak = 0;
          logger.info('💔 Racha reiniciada', '');
        }
      }

      // Generar nuevas misiones
      await this.generateDailyMissions();
      this.lastResetDate = today;
      await this.saveData();

      logger.info(`📅 Misiones diarias reseteadas para ${today}`, '');
    }
  }

  /**
   * Generar 3 misiones diarias aleatorias
   */
  async generateDailyMissions() {
    // Seleccionar 3 tipos diferentes de misiones
    const shuffledTemplates = [...MISSION_TEMPLATES].sort(() => Math.random() - 0.5);
    const selectedTemplates = shuffledTemplates.slice(0, 3);

    this.dailyMissions = selectedTemplates.map((template, index) => {
      // Seleccionar una variante aleatoria
      const variant = template.variants[Math.floor(Math.random() * template.variants.length)];

      return {
        id: `daily_${Date.now()}_${index}`,
        type: template.type,
        title: variant.title,
        description: variant.description,
        target: variant.target,
        progress: 0,
        completed: false,
        claimed: false,
        rewards: {
          xp: variant.xp,
          consciousness: variant.consciousness
        },
        createdAt: new Date().toISOString()
      };
    });
  }

  /**
   * Obtener misiones diarias actuales
   */
  async getDailyMissions() {
    await this.checkAndResetIfNeeded();
    return {
      missions: this.dailyMissions,
      streak: this.streak,
      streakBonus: this.getStreakBonus(),
      timeUntilReset: this.getTimeUntilReset(),
      allCompleted: this.dailyMissions.every(m => m.completed),
      allClaimed: this.dailyMissions.every(m => m.claimed)
    };
  }

  /**
   * Actualizar progreso de una misión
   */
  async updateProgress(type, amount = 1) {
    await this.checkAndResetIfNeeded();

    let updated = false;

    for (const mission of this.dailyMissions) {
      if (mission.type === type && !mission.completed) {
        mission.progress = Math.min(mission.target, mission.progress + amount);

        if (mission.progress >= mission.target) {
          mission.completed = true;
          logger.info(`✅ Misión diaria completada: ${mission.title}`, '');
        }

        updated = true;
      }
    }

    if (updated) {
      await this.saveData();
    }

    return this.dailyMissions;
  }

  /**
   * Reclamar recompensa de una misión
   */
  async claimReward(missionId, gameStore) {
    const mission = this.dailyMissions.find(m => m.id === missionId);

    if (!mission) {
      return { success: false, error: 'Misión no encontrada' };
    }

    if (!mission.completed) {
      return { success: false, error: 'Misión no completada' };
    }

    if (mission.claimed) {
      return { success: false, error: 'Recompensa ya reclamada' };
    }

    // Aplicar bonus de racha
    const streakBonus = this.getStreakBonus();
    const multiplier = streakBonus?.multiplier || 1;

    const finalRewards = {
      xp: Math.round(mission.rewards.xp * multiplier),
      consciousness: Math.round(mission.rewards.consciousness * multiplier)
    };

    // Aplicar recompensas
    const state = gameStore.getState();
    if (finalRewards.xp > 0) state.addXP(finalRewards.xp);
    if (finalRewards.consciousness > 0) state.addConsciousness(finalRewards.consciousness);

    mission.claimed = true;
    await this.saveData();

    logger.info(`🎁 Recompensa reclamada: +${finalRewards.xp} XP, +${finalRewards.consciousness} consciencia`, '');

    // Verificar si completó todas las misiones del día
    const allClaimed = this.dailyMissions.every(m => m.claimed);
    if (allClaimed) {
      return {
        success: true,
        rewards: finalRewards,
        dailyBonusAvailable: true
      };
    }

    return {
      success: true,
      rewards: finalRewards
    };
  }

  /**
   * Reclamar bonus diario (por completar todas)
   */
  async claimDailyBonus(gameStore) {
    const allClaimed = this.dailyMissions.every(m => m.claimed);

    if (!allClaimed) {
      return { success: false, error: 'Primero reclama todas las misiones individuales' };
    }

    // Verificar si ya reclamó el bonus hoy
    const bonusKey = `daily_bonus_${this.getTodayDateString()}`;
    const alreadyClaimed = await AsyncStorage.getItem(bonusKey);

    if (alreadyClaimed) {
      return { success: false, error: 'Bonus ya reclamado hoy' };
    }

    // Aplicar bonus de racha
    const streakBonus = this.getStreakBonus();
    const multiplier = streakBonus?.multiplier || 1;

    const finalBonus = {
      xp: Math.round(DAILY_COMPLETION_BONUS.xp * multiplier),
      consciousness: Math.round(DAILY_COMPLETION_BONUS.consciousness * multiplier),
      energy: DAILY_COMPLETION_BONUS.energy
    };

    // Aplicar recompensas
    const state = gameStore.getState();
    state.addXP(finalBonus.xp);
    state.addConsciousness(finalBonus.consciousness);
    state.addEnergy(finalBonus.energy);

    // Marcar como reclamado
    await AsyncStorage.setItem(bonusKey, 'true');

    logger.info(`🏆 Bonus diario reclamado: +${finalBonus.xp} XP, +${finalBonus.consciousness} consciencia, +${finalBonus.energy} energía`, '');

    return {
      success: true,
      rewards: finalBonus,
      streak: this.streak,
      streakBonus
    };
  }

  /**
   * Obtener bonus de racha actual
   */
  getStreakBonus() {
    let currentBonus = null;

    for (const [days, bonus] of Object.entries(STREAK_BONUSES)) {
      if (this.streak >= parseInt(days)) {
        currentBonus = { days: parseInt(days), ...bonus };
      }
    }

    return currentBonus;
  }

  /**
   * Obtener tiempo hasta próximo reset
   */
  getTimeUntilReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diffMs = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      hours,
      minutes,
      formatted: `${hours}h ${minutes}m`
    };
  }

  /**
   * Helpers de fecha
   */
  getTodayDateString() {
    return new Date().toISOString().split('T')[0];
  }

  getYesterdayDateString() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
}

export const dailyMissionService = new DailyMissionService();
export default dailyMissionService;
