/**
 * ACHIEVEMENTS SERVICE
 * Sistema de logros desbloqueables en el juego
 *
 * @version 1.0.0
 */

import memoryStorage from '../utils/MemoryStorage';
const AsyncStorage = memoryStorage;
import logger from '../utils/logger';

/**
 * Definición de logros disponibles
 */
const ACHIEVEMENTS = {
  // Logros de crisis
  crisis_resolver_1: {
    id: 'crisis_resolver_1',
    title: 'Primer Rescate',
    description: 'Resuelve tu primer crisis',
    icon: '🚨',
    condition: 'crises_resolved >= 1',
    rarity: 'common',
    xpReward: 50
  },
  crisis_resolver_10: {
    id: 'crisis_resolver_10',
    title: 'Campeón de Crisis',
    description: 'Resuelve 10 crisis',
    icon: '🔥',
    condition: 'crises_resolved >= 10',
    rarity: 'uncommon',
    xpReward: 200
  },
  crisis_resolver_50: {
    id: 'crisis_resolver_50',
    title: 'Héroe Global',
    description: 'Resuelve 50 crisis',
    icon: '🌍',
    condition: 'crises_resolved >= 50',
    rarity: 'rare',
    xpReward: 500
  },
  crisis_resolver_100: {
    id: 'crisis_resolver_100',
    title: 'Leyenda Viviente',
    description: 'Resuelve 100 crisis',
    icon: '⭐',
    condition: 'crises_resolved >= 100',
    rarity: 'epic',
    xpReward: 1000
  },

  // Logros de lecturaReader: {
    id: 'reader_1',
    title: 'Primer Página',
    description: 'Lee tu primer capítulo',
    icon: '📖',
    condition: 'chapters_read >= 1',
    rarity: 'common',
    xpReward: 30
  },
  reader_5: {
    id: 'reader_5',
    title: 'Ávido Lector',
    description: 'Lee 5 capítulos',
    icon: '📚',
    condition: 'chapters_read >= 5',
    rarity: 'uncommon',
    xpReward: 100
  },
  reader_complete: {
    id: 'reader_complete',
    title: 'Maestro de la Consciencia',
    description: 'Completa un libro entero',
    icon: '🎓',
    condition: 'books_completed >= 1',
    rarity: 'rare',
    xpReward: 300
  },

  // Logros de niveles
  level_5: {
    id: 'level_5',
    title: 'Aprendiz Inicial',
    description: 'Alcanza nivel 5',
    icon: '📈',
    condition: 'user_level >= 5',
    rarity: 'common',
    xpReward: 75
  },
  level_10: {
    id: 'level_10',
    title: 'Transformador',
    description: 'Alcanza nivel 10',
    icon: '✨',
    condition: 'user_level >= 10',
    rarity: 'uncommon',
    xpReward: 150
  },
  level_20: {
    id: 'level_20',
    title: 'Arquitecto de Cambio',
    description: 'Alcanza nivel 20',
    icon: '🏗️',
    condition: 'user_level >= 20',
    rarity: 'rare',
    xpReward: 300
  },
  level_50: {
    id: 'level_50',
    title: 'Nuevo Ser',
    description: 'Alcanza nivel 50 (máximo)',
    icon: '🌟',
    condition: 'user_level >= 50',
    rarity: 'legendary',
    xpReward: 1000
  },

  // Logros de seres
  beings_5: {
    id: 'beings_5',
    title: 'Coleccionista Inicial',
    description: 'Posee 5 seres diferentes',
    icon: '🧬',
    condition: 'beings_count >= 5',
    rarity: 'common',
    xpReward: 75
  },
  beings_10: {
    id: 'beings_10',
    title: 'Criador Experto',
    description: 'Posee 10 seres diferentes',
    icon: '🔬',
    condition: 'beings_count >= 10',
    rarity: 'uncommon',
    xpReward: 200
  },
  beings_all_types: {
    id: 'beings_all_types',
    title: 'Completacionista',
    description: 'Posee seres de todos los arquetipos',
    icon: '👥',
    condition: 'all_archetypes_unlocked === true',
    rarity: 'epic',
    xpReward: 400
  },

  // Logros de fractales
  fractals_10: {
    id: 'fractals_10',
    title: 'Cazador de Fractales',
    description: 'Recolecta 10 fractales',
    icon: '✨',
    condition: 'fractals_collected >= 10',
    rarity: 'common',
    xpReward: 50
  },
  fractals_50: {
    id: 'fractals_50',
    title: 'Maestro de Energia',
    description: 'Recolecta 50 fractales',
    icon: '⚡',
    condition: 'fractals_collected >= 50',
    rarity: 'uncommon',
    xpReward: 200
  },
  all_fractal_types: {
    id: 'all_fractal_types',
    title: 'Recolector Completo',
    description: 'Recolecta todos los tipos de fractales',
    icon: '🌈',
    condition: 'all_fractal_types_collected === true',
    rarity: 'rare',
    xpReward: 300
  },

  // Logros especiales
  high_success_rate: {
    id: 'high_success_rate',
    title: 'Estratega Brillante',
    description: 'Mantén 80%+ de tasa de éxito',
    icon: '🎯',
    condition: 'success_rate >= 0.8',
    rarity: 'rare',
    xpReward: 250
  },
  perfect_day: {
    id: 'perfect_day',
    title: 'Día Perfecto',
    description: 'Completa 5 misiones en un día sin fallos',
    icon: '🌞',
    condition: 'daily_perfect_completion === true',
    rarity: 'rare',
    xpReward: 200
  },
  first_fusion: {
    id: 'first_fusion',
    title: 'Alquimista Inicial',
    description: 'Crea tu primer ser híbrido',
    icon: '🧪',
    condition: 'hybrids_created >= 1',
    rarity: 'uncommon',
    xpReward: 150
  },
  population_saved_1m: {
    id: 'population_saved_1m',
    title: 'Salvador de Millones',
    description: 'Ayuda a 1,000,000 de personas',
    icon: '🌍',
    condition: 'population_saved >= 1000000',
    rarity: 'epic',
    xpReward: 500
  }
};

class AchievementsService {
  constructor() {
    this.achievements = ACHIEVEMENTS;
    this.unlockedAchievements = new Set();
    this.loadUnlockedAchievements();
  }

  /**
   * Cargar logros desbloqueados del almacenamiento
   */
  async loadUnlockedAchievements() {
    try {
      const stored = await AsyncStorage.getItem('unlocked_achievements');
      if (stored) {
        this.unlockedAchievements = new Set(JSON.parse(stored));
      }
    } catch (error) {
      logger.error('AchievementsService', 'Error loading achievements', error);
    }
  }

  /**
   * Guardar logros desbloqueados
   */
  async saveUnlockedAchievements() {
    try {
      const data = Array.from(this.unlockedAchievements);
      await AsyncStorage.setItem('unlocked_achievements', JSON.stringify(data));
    } catch (error) {
      logger.error('AchievementsService', 'Error saving achievements', error);
    }
  }

  /**
   * Obtener todos los logros
   */
  getAllAchievements() {
    return Object.values(this.achievements).map(achievement => ({
      ...achievement,
      unlocked: this.unlockedAchievements.has(achievement.id)
    }));
  }

  /**
   * Obtener logros desbloqueados
   */
  getUnlockedAchievements() {
    return Object.values(this.achievements)
      .filter(a => this.unlockedAchievements.has(a.id))
      .sort((a, b) => {
        const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
        return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
      });
  }

  /**
   * Desbloquear un logro
   */
  async unlockAchievement(achievementId) {
    if (!this.achievements[achievementId]) {
      logger.warn('AchievementsService', `Achievement not found: ${achievementId}`);
      return false;
    }

    if (this.unlockedAchievements.has(achievementId)) {
      return false; // Ya estaba desbloqueado
    }

    this.unlockedAchievements.add(achievementId);
    await this.saveUnlockedAchievements();

    const achievement = this.achievements[achievementId];
    logger.info('AchievementsService', `🏆 Achievement unlocked: ${achievement.title}`);

    return true;
  }

  /**
   * Verificar y desbloquear logros basado en estadísticas del usuario
   */
  async checkAndUnlockAchievements(userStats) {
    const newUnlocks = [];

    for (const [id, achievement] of Object.entries(this.achievements)) {
      if (this.unlockedAchievements.has(id)) continue;

      const isUnlocked = this.evaluateCondition(achievement.condition, userStats);
      if (isUnlocked) {
        await this.unlockAchievement(id);
        newUnlocks.push(achievement);
      }
    }

    return newUnlocks;
  }

  /**
   * Evaluar condición de un logro
   */
  evaluateCondition(condition, userStats) {
    try {
      // Reemplazar variable en la condición con valores reales
      let evalCondition = condition;

      for (const [key, value] of Object.entries(userStats)) {
        if (typeof value === 'number' || typeof value === 'boolean') {
          evalCondition = evalCondition.replace(new RegExp(key, 'g'), JSON.stringify(value));
        }
      }

      // Evaluar la condición (seguro porque solo contiene operadores y números)
      // eslint-disable-next-line no-eval
      return eval(evalCondition);
    } catch (error) {
      logger.error('AchievementsService', `Error evaluating condition: ${condition}`, error);
      return false;
    }
  }

  /**
   * Obtener estadísticas de logros
   */
  getAchievementStats() {
    const allAchievements = Object.keys(this.achievements).length;
    const unlockedCount = this.unlockedAchievements.size;
    const percentComplete = Math.round((unlockedCount / allAchievements) * 100);

    return {
      total: allAchievements,
      unlocked: unlockedCount,
      locked: allAchievements - unlockedCount,
      percentComplete,
      xpTotal: this.getUnlockedAchievements().reduce((sum, a) => sum + a.xpReward, 0)
    };
  }

  /**
   * Obtener logro por ID
   */
  getAchievementById(achievementId) {
    const achievement = this.achievements[achievementId];
    if (!achievement) return null;

    return {
      ...achievement,
      unlocked: this.unlockedAchievements.has(achievementId)
    };
  }
}

export default new AchievementsService();
