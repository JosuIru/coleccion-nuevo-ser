/**
 * CorruptionService.js
 *
 * Gestiona el sistema de corrupción y purificación de seres.
 * Los seres pueden corromperse por diversas causas y necesitan
 * ser purificados mediante rituales, meditación o ayuda.
 *
 * @version 1.0.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

// ============================================================================
// TIPOS DE CORRUPCIÓN
// ============================================================================

const CORRUPTION_TYPES = {
  despair: {
    id: 'despair',
    name: 'Desesperanza',
    icon: '😔',
    color: '#6b7280',
    description: 'La pérdida de fe en el cambio positivo.',
    statPenalties: { empathy: -15, action: -20, resilience: -10 },
    negativeTraits: ['Desilusionado', 'Apático', 'Nihilista'],
    purificationMethods: ['meditation', 'community', 'reading'],
    purificationDifficulty: 'medium'
  },
  chaos: {
    id: 'chaos',
    name: 'Caos',
    icon: '🌀',
    color: '#7c3aed',
    description: 'Pérdida de centro y estabilidad interna.',
    statPenalties: { wisdom: -20, organization: -25, reflection: -15 },
    negativeTraits: ['Inestable', 'Impulsivo', 'Fragmentado'],
    purificationMethods: ['meditation', 'sanctuary', 'ritual'],
    purificationDifficulty: 'hard'
  },
  shadow: {
    id: 'shadow',
    name: 'Sombra',
    icon: '🌑',
    color: '#1f2937',
    description: 'La parte oscura ha tomado control.',
    statPenalties: { connection: -20, empathy: -15, trust: -25 },
    negativeTraits: ['Oscurecido', 'Desconfiado', 'Aislado'],
    purificationMethods: ['community', 'redemption_mission', 'mentor'],
    purificationDifficulty: 'hard'
  },
  void: {
    id: 'void',
    name: 'Vacío',
    icon: '⬛',
    color: '#000000',
    description: 'Desconexión total de la consciencia.',
    statPenalties: { all: -30 },
    negativeTraits: ['Vacío', 'Perdido', 'Disociado'],
    purificationMethods: ['legendary_ritual', 'nuevo_ser_intervention'],
    purificationDifficulty: 'extreme'
  },
  burnout: {
    id: 'burnout',
    name: 'Agotamiento',
    icon: '🔥',
    color: '#dc2626',
    description: 'Exceso de misiones sin descanso.',
    statPenalties: { energy: -40, action: -25, resilience: -20 },
    negativeTraits: ['Agotado', 'Sobrecargado', 'Quebrantado'],
    purificationMethods: ['rest', 'energy_sanctuary', 'vacation'],
    purificationDifficulty: 'easy'
  },
  cynicism: {
    id: 'cynicism',
    name: 'Cinismo',
    icon: '😒',
    color: '#9ca3af',
    description: 'Pérdida de idealismo y esperanza.',
    statPenalties: { inspiration: -30, leadership: -20, empathy: -15 },
    negativeTraits: ['Cínico', 'Escéptico', 'Desencantado'],
    purificationMethods: ['reading', 'success_mission', 'mentor'],
    purificationDifficulty: 'medium'
  }
};

// Métodos de purificación
const PURIFICATION_METHODS = {
  meditation: {
    id: 'meditation',
    name: 'Meditación Profunda',
    icon: '🧘',
    description: 'Tiempo en silencio reconectando con la esencia.',
    duration: 8 * 60 * 60 * 1000, // 8 horas
    effectiveness: { despair: 0.7, chaos: 0.8, burnout: 0.6 },
    requirements: null
  },
  rest: {
    id: 'rest',
    name: 'Descanso Restaurador',
    icon: '😴',
    description: 'Tiempo offline para recuperación.',
    duration: 12 * 60 * 60 * 1000, // 12 horas
    effectiveness: { burnout: 0.9, despair: 0.4 },
    requirements: null
  },
  community: {
    id: 'community',
    name: 'Apoyo Comunitario',
    icon: '🤝',
    description: 'Otros seres sanos ayudan en la recuperación.',
    duration: 4 * 60 * 60 * 1000,
    effectiveness: { shadow: 0.7, despair: 0.8, cynicism: 0.5 },
    requirements: { healthyBeings: 2 }
  },
  sanctuary: {
    id: 'sanctuary',
    name: 'Retiro en Santuario',
    icon: '🏛️',
    description: 'Visita a un lugar de poder para sanación.',
    duration: 6 * 60 * 60 * 1000,
    effectiveness: { chaos: 0.8, shadow: 0.6, despair: 0.7 },
    requirements: { sanctuary: true }
  },
  reading: {
    id: 'reading',
    name: 'Estudio de Sabiduría',
    icon: '📚',
    description: 'Lectura de textos sagrados de la biblioteca.',
    duration: 2 * 60 * 60 * 1000,
    effectiveness: { cynicism: 0.8, despair: 0.6 },
    requirements: { readChapter: true }
  },
  ritual: {
    id: 'ritual',
    name: 'Ritual de Purificación',
    icon: '🔥',
    description: 'Ceremonia especial de limpieza energética.',
    duration: 4 * 60 * 60 * 1000,
    effectiveness: { chaos: 0.9, shadow: 0.7, void: 0.3 },
    requirements: { items: ['purification_essence'] }
  },
  redemption_mission: {
    id: 'redemption_mission',
    name: 'Misión de Redención',
    icon: '⚔️',
    description: 'Completar una misión especial de sanación.',
    duration: 0, // Depende de la misión
    effectiveness: { shadow: 0.9, cynicism: 0.8 },
    requirements: { completeMission: 'redemption' }
  },
  mentor: {
    id: 'mentor',
    name: 'Guía de Mentor',
    icon: '👨‍🏫',
    description: 'Un ser legendario guía la recuperación.',
    duration: 2 * 60 * 60 * 1000,
    effectiveness: { shadow: 0.8, cynicism: 0.9, despair: 0.7 },
    requirements: { legendaryBeing: true }
  },
  legendary_ritual: {
    id: 'legendary_ritual',
    name: 'Ritual de los Ancestros',
    icon: '✨',
    description: 'El ritual más poderoso, requiere todos los legendarios.',
    duration: 24 * 60 * 60 * 1000,
    effectiveness: { void: 0.9 },
    requirements: { allLegendary: true }
  },
  energy_sanctuary: {
    id: 'energy_sanctuary',
    name: 'Fuente de Energía',
    icon: '⚡',
    description: 'Visita a la Fuente de Energía.',
    duration: 4 * 60 * 60 * 1000,
    effectiveness: { burnout: 0.95 },
    requirements: { sanctuaryType: 'energy' }
  }
};

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class CorruptionService {
  constructor() {
    this.corruptedBeings = {}; // beingId -> corruption data
    this.purificationInProgress = {}; // beingId -> purification data
    this.corruptionHistory = [];
  }

  async initialize() {
    await this.loadState();
    return true;
  }

  // --------------------------------------------------------------------------
  // CORRUPCIÓN
  // --------------------------------------------------------------------------

  /**
   * Aplicar corrupción a un ser
   */
  async corruptBeing(beingId, corruptionType, source) {
    const corruption = CORRUPTION_TYPES[corruptionType];
    if (!corruption) throw new Error('Tipo de corrupción inválido');

    const corruptionData = {
      beingId,
      type: corruptionType,
      ...corruption,
      level: 1,
      appliedAt: Date.now(),
      source,
      trait: corruption.negativeTraits[
        Math.floor(Math.random() * corruption.negativeTraits.length)
      ]
    };

    // Si ya está corrupto, aumentar nivel
    if (this.corruptedBeings[beingId]) {
      const existing = this.corruptedBeings[beingId];
      if (existing.type === corruptionType) {
        corruptionData.level = Math.min(5, existing.level + 1);
      } else {
        // Corrupción diferente, mantener la peor
        const existingDifficulty = this.getDifficultyValue(existing.purificationDifficulty);
        const newDifficulty = this.getDifficultyValue(corruption.purificationDifficulty);
        if (newDifficulty <= existingDifficulty) {
          return { applied: false, reason: 'Ya tiene corrupción más severa' };
        }
      }
    }

    this.corruptedBeings[beingId] = corruptionData;
    this.corruptionHistory.push({
      ...corruptionData,
      event: 'corrupted'
    });

    await this.saveState();

    return {
      applied: true,
      corruption: corruptionData
    };
  }

  getDifficultyValue(difficulty) {
    const values = { easy: 1, medium: 2, hard: 3, extreme: 4 };
    return values[difficulty] || 2;
  }

  /**
   * Verificar si un ser está corrupto
   */
  isCorrupted(beingId) {
    return !!this.corruptedBeings[beingId];
  }

  getCorruption(beingId) {
    return this.corruptedBeings[beingId] || null;
  }

  /**
   * Calcular penalizaciones de stats por corrupción
   */
  getStatPenalties(beingId) {
    const corruption = this.corruptedBeings[beingId];
    if (!corruption) return {};

    const penalties = {};
    const multiplier = corruption.level;

    if (corruption.statPenalties.all) {
      return { all: corruption.statPenalties.all * multiplier };
    }

    for (const [stat, penalty] of Object.entries(corruption.statPenalties)) {
      penalties[stat] = penalty * multiplier;
    }

    return penalties;
  }

  /**
   * Causas automáticas de corrupción
   */
  checkMissionFailureCorruption(beingId, crisis, failureType) {
    // Alta urgencia + fracaso = posible desesperanza
    if (crisis.urgency >= 8 && failureType === 'total_failure') {
      if (Math.random() < 0.3) {
        return this.corruptBeing(beingId, 'despair', 'mission_failure');
      }
    }
    return null;
  }

  checkOverworkCorruption(beingId, missionsLast24h) {
    // Más de 5 misiones sin descanso = burnout
    if (missionsLast24h >= 5) {
      if (Math.random() < 0.4) {
        return this.corruptBeing(beingId, 'burnout', 'overwork');
      }
    }
    return null;
  }

  // --------------------------------------------------------------------------
  // PURIFICACIÓN
  // --------------------------------------------------------------------------

  /**
   * Obtener métodos de purificación disponibles para un ser
   */
  getAvailablePurificationMethods(beingId, gameState) {
    const corruption = this.corruptedBeings[beingId];
    if (!corruption) return [];

    const corruptionType = CORRUPTION_TYPES[corruption.type];
    const availableMethods = [];

    for (const methodId of corruptionType.purificationMethods) {
      const method = PURIFICATION_METHODS[methodId];
      if (!method) continue;

      const canUse = this.checkPurificationRequirements(method, gameState);
      const effectiveness = method.effectiveness[corruption.type] || 0.5;

      availableMethods.push({
        ...method,
        canUse,
        effectiveness,
        estimatedSuccess: effectiveness * (1 - corruption.level * 0.1) // Menos éxito con más nivel
      });
    }

    return availableMethods;
  }

  checkPurificationRequirements(method, gameState) {
    if (!method.requirements) return true;

    const reqs = method.requirements;

    if (reqs.healthyBeings) {
      const healthyCount = (gameState.beings || []).filter(
        b => !this.isCorrupted(b.id)
      ).length;
      if (healthyCount < reqs.healthyBeings) return false;
    }

    if (reqs.sanctuary) {
      // Verificar que hay santuario disponible
      if (!gameState.sanctuariesAvailable) return false;
    }

    if (reqs.legendaryBeing) {
      if (!gameState.hasLegendaryBeing) return false;
    }

    if (reqs.allLegendary) {
      if (!gameState.allLegendaryUnlocked) return false;
    }

    return true;
  }

  /**
   * Iniciar proceso de purificación
   */
  async startPurification(beingId, methodId, helpers = []) {
    const corruption = this.corruptedBeings[beingId];
    if (!corruption) throw new Error('El ser no está corrupto');

    const method = PURIFICATION_METHODS[methodId];
    if (!method) throw new Error('Método de purificación inválido');

    const effectiveness = method.effectiveness[corruption.type] || 0.5;
    const successChance = effectiveness * (1 - corruption.level * 0.1);

    // Bonus por ayudantes
    const helperBonus = helpers.length * 0.05;

    this.purificationInProgress[beingId] = {
      beingId,
      methodId,
      method,
      corruption,
      startTime: Date.now(),
      endTime: Date.now() + method.duration,
      successChance: Math.min(0.95, successChance + helperBonus),
      helpers
    };

    await this.saveState();

    return {
      started: true,
      purification: this.purificationInProgress[beingId]
    };
  }

  /**
   * Verificar y completar purificación
   */
  async completePurification(beingId) {
    const purification = this.purificationInProgress[beingId];
    if (!purification) return null;

    if (Date.now() < purification.endTime) {
      return {
        complete: false,
        remainingTime: purification.endTime - Date.now(),
        progress: (Date.now() - purification.startTime) / (purification.endTime - purification.startTime)
      };
    }

    // Determinar éxito
    const roll = Math.random();
    const success = roll < purification.successChance;

    const result = {
      complete: true,
      success,
      roll,
      successChance: purification.successChance
    };

    if (success) {
      // Purificación exitosa
      delete this.corruptedBeings[beingId];
      result.purified = true;

      this.corruptionHistory.push({
        beingId,
        event: 'purified',
        method: purification.methodId,
        timestamp: Date.now()
      });
    } else {
      // Fracaso - reducir nivel o mantener
      const corruption = this.corruptedBeings[beingId];
      if (corruption.level > 1) {
        corruption.level--;
        result.levelReduced = true;
      } else {
        result.noChange = true;
      }
    }

    delete this.purificationInProgress[beingId];
    await this.saveState();

    return result;
  }

  getPurificationStatus(beingId) {
    const purification = this.purificationInProgress[beingId];
    if (!purification) return null;

    return {
      ...purification,
      progress: Math.min(1, (Date.now() - purification.startTime) / (purification.endTime - purification.startTime)),
      remainingTime: Math.max(0, purification.endTime - Date.now()),
      isComplete: Date.now() >= purification.endTime
    };
  }

  // --------------------------------------------------------------------------
  // MISIONES DE REDENCIÓN
  // --------------------------------------------------------------------------

  generateRedemptionMission(beingId) {
    const corruption = this.corruptedBeings[beingId];
    if (!corruption) return null;

    const missionTypes = {
      despair: {
        title: 'Sembrar Esperanza',
        description: 'Ayuda a una comunidad a recuperar la fe en el futuro.',
        objective: 'Completar 3 misiones humanitarias con éxito',
        reward: 'Purificación completa + trait "Esperanzado"'
      },
      shadow: {
        title: 'Enfrentar la Sombra',
        description: 'Adentrarse en una zona corrupta y emerger victorioso.',
        objective: 'Sobrevivir a una zona de corrupción sombra',
        reward: 'Purificación completa + trait "Integrado"'
      },
      cynicism: {
        title: 'Redescubrir el Asombro',
        description: 'Presenciar un milagro de la consciencia.',
        objective: 'Participar en el desbloqueo de un ser legendario',
        reward: 'Purificación completa + trait "Renovado"'
      },
      chaos: {
        title: 'Encontrar el Centro',
        description: 'Meditar en el Templo de la Reflexión.',
        objective: 'Completar entrenamiento en santuario de reflexión',
        reward: 'Purificación completa + trait "Centrado"'
      },
      burnout: {
        title: 'El Arte del Descanso',
        description: 'Aprender que la pausa es parte del camino.',
        objective: 'No realizar misiones por 48 horas',
        reward: 'Purificación completa + trait "Equilibrado"'
      }
    };

    return {
      id: `redemption_${beingId}_${Date.now()}`,
      type: 'redemption',
      ...missionTypes[corruption.type] || missionTypes.despair,
      beingId,
      corruptionType: corruption.type,
      createdAt: Date.now()
    };
  }

  // --------------------------------------------------------------------------
  // ESTADÍSTICAS
  // --------------------------------------------------------------------------

  getCorruptionStats() {
    const corrupted = Object.values(this.corruptedBeings);
    const byType = {};

    corrupted.forEach(c => {
      byType[c.type] = (byType[c.type] || 0) + 1;
    });

    return {
      totalCorrupted: corrupted.length,
      byType,
      totalPurified: this.corruptionHistory.filter(h => h.event === 'purified').length,
      inPurification: Object.keys(this.purificationInProgress).length
    };
  }

  // --------------------------------------------------------------------------
  // PERSISTENCIA
  // --------------------------------------------------------------------------

  async saveState() {
    try {
      await AsyncStorage.setItem('corruption_state', JSON.stringify({
        corruptedBeings: this.corruptedBeings,
        purificationInProgress: this.purificationInProgress,
        corruptionHistory: this.corruptionHistory.slice(-100) // Últimos 100 eventos
      }));
    } catch (error) {
      logger.error('CorruptionService', 'Error saving state:', error);
    }
  }

  async loadState() {
    try {
      const data = await AsyncStorage.getItem('corruption_state');
      if (data) {
        const parsed = JSON.parse(data);
        this.corruptedBeings = parsed.corruptedBeings || {};
        this.purificationInProgress = parsed.purificationInProgress || {};
        this.corruptionHistory = parsed.corruptionHistory || [];
      }
    } catch (error) {
      logger.error('CorruptionService', 'Error loading state:', error);
    }
  }
}

export const corruptionService = new CorruptionService();
export { CORRUPTION_TYPES, PURIFICATION_METHODS };
export default CorruptionService;
