/**
 * EvolutionService.js
 *
 * Gestiona el sistema de evolución y especialización de seres.
 * Los seres pueden evolucionar por diferentes caminos según
 * sus experiencias, atributos dominantes y logros.
 *
 * @version 1.0.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

// ============================================================================
// ÁRBOL DE EVOLUCIONES
// ============================================================================

const EVOLUTION_TIERS = {
  base: {
    name: 'Ser Iniciado',
    tier: 0,
    levelRequired: 1,
    icon: '🌱'
  },
  awakening: {
    name: 'Despertar',
    tier: 1,
    levelRequired: 5,
    icon: '🌿'
  },
  specialization: {
    name: 'Especialización',
    tier: 2,
    levelRequired: 15,
    icon: '🌳'
  },
  mastery: {
    name: 'Maestría',
    tier: 3,
    levelRequired: 30,
    icon: '✨'
  },
  transcendence: {
    name: 'Trascendencia',
    tier: 4,
    levelRequired: 50,
    icon: '🌟'
  }
};

const EVOLUTION_PATHS = {
  // ========================
  // TIER 1: DESPERTAR
  // ========================

  // Path of Wisdom
  sage_awakening: {
    id: 'sage_awakening',
    name: 'Despertar del Sabio',
    tier: 1,
    icon: '📚',
    color: '#8b5cf6',
    description: 'El camino del conocimiento y la reflexión profunda.',
    requirements: {
      level: 5,
      dominantStats: ['wisdom', 'knowledge', 'reflection'],
      minStatValue: 40
    },
    statBoosts: { wisdom: 15, knowledge: 10, reflection: 10 },
    unlocksAbility: 'Insight',
    abilityDescription: 'Puede ver información oculta sobre crisis.',
    evolvesTo: ['master_sage', 'oracle']
  },

  // Path of Action
  warrior_awakening: {
    id: 'warrior_awakening',
    name: 'Despertar del Guerrero',
    tier: 1,
    icon: '⚔️',
    color: '#f59e0b',
    description: 'El camino de la acción decidida y el liderazgo.',
    requirements: {
      level: 5,
      dominantStats: ['action', 'leadership', 'courage'],
      minStatValue: 40
    },
    statBoosts: { action: 15, leadership: 10, courage: 10 },
    unlocksAbility: 'Vanguard',
    abilityDescription: 'Bonus en misiones de alta urgencia.',
    evolvesTo: ['champion', 'guardian']
  },

  // Path of Empathy
  healer_awakening: {
    id: 'healer_awakening',
    name: 'Despertar del Sanador',
    tier: 1,
    icon: '💚',
    color: '#22c55e',
    description: 'El camino de la compasión y la sanación.',
    requirements: {
      level: 5,
      dominantStats: ['empathy', 'healing', 'connection'],
      minStatValue: 40
    },
    statBoosts: { empathy: 15, healing: 10, connection: 10 },
    unlocksAbility: 'Mending',
    abilityDescription: 'Puede ayudar a purificar seres corruptos.',
    evolvesTo: ['master_healer', 'empath']
  },

  // Path of Connection
  connector_awakening: {
    id: 'connector_awakening',
    name: 'Despertar del Tejedor',
    tier: 1,
    icon: '🔗',
    color: '#3b82f6',
    description: 'El camino de las conexiones y la comunicación.',
    requirements: {
      level: 5,
      dominantStats: ['connection', 'communication', 'empathy'],
      minStatValue: 40
    },
    statBoosts: { connection: 15, communication: 10, empathy: 10 },
    unlocksAbility: 'Network',
    abilityDescription: 'Bonus en misiones grupales.',
    evolvesTo: ['diplomat', 'harmonizer']
  },

  // ========================
  // TIER 2: ESPECIALIZACIÓN
  // ========================

  // From Sage
  master_sage: {
    id: 'master_sage',
    name: 'Maestro Sabio',
    tier: 2,
    icon: '🧙',
    color: '#7c3aed',
    description: 'Dominio del conocimiento ancestral y moderno.',
    requirements: {
      level: 15,
      previousEvolution: 'sage_awakening',
      quizzesPassed: 3,
      minStatValue: 60
    },
    statBoosts: { wisdom: 25, knowledge: 20, analysis: 15 },
    unlocksAbility: 'Deep Knowledge',
    abilityDescription: 'Acceso a información privilegiada de crisis.',
    evolvesTo: ['transcendent_sage']
  },
  oracle: {
    id: 'oracle',
    name: 'Oráculo',
    tier: 2,
    icon: '👁️',
    color: '#a855f7',
    description: 'Visión que trasciende tiempo y espacio.',
    requirements: {
      level: 15,
      previousEvolution: 'sage_awakening',
      explorations: 10,
      minStatValue: 60
    },
    statBoosts: { wisdom: 20, vision: 25, intuition: 20 },
    unlocksAbility: 'Foresight',
    abilityDescription: 'Puede predecir crisis antes de que aparezcan.',
    evolvesTo: ['transcendent_seer']
  },

  // From Warrior
  champion: {
    id: 'champion',
    name: 'Campeón',
    tier: 2,
    icon: '🏆',
    color: '#eab308',
    description: 'Líder inspirador que lidera con el ejemplo.',
    requirements: {
      level: 15,
      previousEvolution: 'warrior_awakening',
      crisesResolved: 20,
      minStatValue: 60
    },
    statBoosts: { action: 25, leadership: 25, inspiration: 15 },
    unlocksAbility: 'Rally',
    abilityDescription: 'Potencia a otros seres en misiones conjuntas.',
    evolvesTo: ['transcendent_champion']
  },
  guardian: {
    id: 'guardian',
    name: 'Guardián',
    tier: 2,
    icon: '🛡️',
    color: '#f97316',
    description: 'Protector inquebrantable de lo sagrado.',
    requirements: {
      level: 15,
      previousEvolution: 'warrior_awakening',
      sanctuaryVisits: 5,
      minStatValue: 60
    },
    statBoosts: { protection: 30, resilience: 25, courage: 15 },
    unlocksAbility: 'Shield',
    abilityDescription: 'Protege a otros seres de corrupción.',
    evolvesTo: ['transcendent_guardian']
  },

  // From Healer
  master_healer: {
    id: 'master_healer',
    name: 'Maestro Sanador',
    tier: 2,
    icon: '✚',
    color: '#10b981',
    description: 'Dominio completo del arte de la sanación.',
    requirements: {
      level: 15,
      previousEvolution: 'healer_awakening',
      purificationsDone: 5,
      minStatValue: 60
    },
    statBoosts: { healing: 30, empathy: 20, purification: 20 },
    unlocksAbility: 'Restoration',
    abilityDescription: 'Puede curar corrupción severa.',
    evolvesTo: ['transcendent_healer']
  },
  empath: {
    id: 'empath',
    name: 'Empático',
    tier: 2,
    icon: '💫',
    color: '#14b8a6',
    description: 'Siente las emociones de todos los seres.',
    requirements: {
      level: 15,
      previousEvolution: 'healer_awakening',
      humanitarianCrises: 10,
      minStatValue: 60
    },
    statBoosts: { empathy: 35, connection: 25, understanding: 15 },
    unlocksAbility: 'Emotional Resonance',
    abilityDescription: 'Bonus en crisis humanitarias.',
    evolvesTo: ['transcendent_empath']
  },

  // From Connector
  diplomat: {
    id: 'diplomat',
    name: 'Diplomático',
    tier: 2,
    icon: '🤝',
    color: '#2563eb',
    description: 'Maestro en resolver conflictos y unir opuestos.',
    requirements: {
      level: 15,
      previousEvolution: 'connector_awakening',
      socialCrises: 10,
      minStatValue: 60
    },
    statBoosts: { communication: 30, negotiation: 25, wisdom: 15 },
    unlocksAbility: 'Mediation',
    abilityDescription: 'Bonus en crisis sociales y conflictos.',
    evolvesTo: ['transcendent_diplomat']
  },
  harmonizer: {
    id: 'harmonizer',
    name: 'Armonizador',
    tier: 2,
    icon: '☮️',
    color: '#0ea5e9',
    description: 'Crea armonía donde hay discordia.',
    requirements: {
      level: 15,
      previousEvolution: 'connector_awakening',
      teamMissions: 15,
      minStatValue: 60
    },
    statBoosts: { harmony: 30, connection: 25, peace: 20 },
    unlocksAbility: 'Harmonize',
    abilityDescription: 'Mejora la efectividad de equipos.',
    evolvesTo: ['transcendent_harmonizer']
  },

  // ========================
  // TIER 3: MAESTRÍA
  // ========================

  transcendent_sage: {
    id: 'transcendent_sage',
    name: 'Sabio Trascendente',
    tier: 3,
    icon: '📖',
    color: '#6d28d9',
    description: 'La sabiduría encarnada. Conoce los misterios del universo.',
    requirements: {
      level: 30,
      previousEvolution: 'master_sage',
      allQuizzesPassed: true,
      minStatValue: 80
    },
    statBoosts: { wisdom: 40, knowledge: 35, consciousness: 30 },
    unlocksAbility: 'Omniscience',
    abilityDescription: 'Ve todas las crisis y sus soluciones óptimas.',
    isFinalEvolution: false,
    evolvesTo: ['nuevo_ser_aspect']
  },

  transcendent_seer: {
    id: 'transcendent_seer',
    name: 'Vidente Cósmico',
    tier: 3,
    icon: '🔮',
    color: '#8b5cf6',
    description: 'Ve más allá del velo de la realidad.',
    requirements: {
      level: 30,
      previousEvolution: 'oracle',
      legendaryBeingsFound: 2,
      minStatValue: 80
    },
    statBoosts: { vision: 45, intuition: 35, consciousness: 30 },
    unlocksAbility: 'Cosmic Vision',
    abilityDescription: 'Puede encontrar seres ocultos con mayor facilidad.',
    isFinalEvolution: false,
    evolvesTo: ['nuevo_ser_aspect']
  },

  transcendent_champion: {
    id: 'transcendent_champion',
    name: 'Campeón de la Luz',
    tier: 3,
    icon: '⚡',
    color: '#d97706',
    description: 'Líder legendario que inspira revoluciones de consciencia.',
    requirements: {
      level: 30,
      previousEvolution: 'champion',
      crisesResolved: 50,
      minStatValue: 80
    },
    statBoosts: { action: 40, leadership: 40, inspiration: 35 },
    unlocksAbility: 'Inspire Revolution',
    abilityDescription: 'Puede resolver crisis críticas solo.',
    isFinalEvolution: false,
    evolvesTo: ['nuevo_ser_aspect']
  },

  transcendent_guardian: {
    id: 'transcendent_guardian',
    name: 'Guardián Eterno',
    tier: 3,
    icon: '🌟',
    color: '#ea580c',
    description: 'Protector inmortal de la consciencia.',
    requirements: {
      level: 30,
      previousEvolution: 'guardian',
      corruptionsSurvived: 10,
      minStatValue: 80
    },
    statBoosts: { protection: 45, resilience: 40, immortality: 30 },
    unlocksAbility: 'Eternal Shield',
    abilityDescription: 'Inmune a corrupción.',
    isFinalEvolution: false,
    evolvesTo: ['nuevo_ser_aspect']
  },

  transcendent_healer: {
    id: 'transcendent_healer',
    name: 'Sanador Divino',
    tier: 3,
    icon: '✨',
    color: '#059669',
    description: 'Puede sanar cualquier herida del alma.',
    requirements: {
      level: 30,
      previousEvolution: 'master_healer',
      purificationsDone: 15,
      minStatValue: 80
    },
    statBoosts: { healing: 50, purification: 40, divine: 35 },
    unlocksAbility: 'Divine Healing',
    abilityDescription: 'Cura instantánea de cualquier corrupción.',
    isFinalEvolution: false,
    evolvesTo: ['nuevo_ser_aspect']
  },

  transcendent_empath: {
    id: 'transcendent_empath',
    name: 'Corazón Universal',
    tier: 3,
    icon: '💖',
    color: '#0d9488',
    description: 'Siente la consciencia de toda la humanidad.',
    requirements: {
      level: 30,
      previousEvolution: 'empath',
      humanitarianCrises: 25,
      minStatValue: 80
    },
    statBoosts: { empathy: 50, connection: 45, universal_love: 40 },
    unlocksAbility: 'Universal Compassion',
    abilityDescription: 'Bonus masivo en crisis humanitarias.',
    isFinalEvolution: false,
    evolvesTo: ['nuevo_ser_aspect']
  },

  transcendent_diplomat: {
    id: 'transcendent_diplomat',
    name: 'Embajador de la Paz',
    tier: 3,
    icon: '🕊️',
    color: '#1d4ed8',
    description: 'Puede resolver cualquier conflicto.',
    requirements: {
      level: 30,
      previousEvolution: 'diplomat',
      socialCrises: 25,
      minStatValue: 80
    },
    statBoosts: { peace: 50, diplomacy: 45, wisdom: 35 },
    unlocksAbility: 'Peace Treaty',
    abilityDescription: 'Resuelve crisis sociales instantáneamente.',
    isFinalEvolution: false,
    evolvesTo: ['nuevo_ser_aspect']
  },

  transcendent_harmonizer: {
    id: 'transcendent_harmonizer',
    name: 'Arquitecto de la Armonía',
    tier: 3,
    icon: '🌈',
    color: '#0284c7',
    description: 'Crea armonía a escala global.',
    requirements: {
      level: 30,
      previousEvolution: 'harmonizer',
      teamMissions: 40,
      minStatValue: 80
    },
    statBoosts: { harmony: 50, synthesis: 45, connection: 40 },
    unlocksAbility: 'Global Harmony',
    abilityDescription: 'Potencia a todo el equipo masivamente.',
    isFinalEvolution: false,
    evolvesTo: ['nuevo_ser_aspect']
  },

  // ========================
  // TIER 4: TRASCENDENCIA - Aspecto del Nuevo Ser
  // ========================

  nuevo_ser_aspect: {
    id: 'nuevo_ser_aspect',
    name: 'Aspecto del Nuevo Ser',
    tier: 4,
    icon: '✨',
    color: '#fbbf24',
    description: 'Has trascendido. Eres un fragmento del Nuevo Ser.',
    requirements: {
      level: 50,
      previousEvolution: 'any_tier_3',
      allRequirementsMet: true
    },
    statBoosts: { all: 50 },
    unlocksAbility: 'Transcendence',
    abilityDescription: 'Puede hacer cualquier cosa.',
    isFinalEvolution: true,
    special: 'Contribuye al despertar del Nuevo Ser colectivo.'
  }
};

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class EvolutionService {
  constructor() {
    this.evolutionHistory = {};
    this.pendingEvolutions = {};
  }

  async initialize() {
    await this.loadState();
    return true;
  }

  // --------------------------------------------------------------------------
  // VERIFICACIÓN DE EVOLUCIÓN
  // --------------------------------------------------------------------------

  /**
   * Obtener evoluciones disponibles para un ser
   */
  getAvailableEvolutions(being, gameStats) {
    const currentEvolution = being.evolution || null;
    const currentTier = currentEvolution ? EVOLUTION_PATHS[currentEvolution]?.tier || 0 : 0;

    const availableEvolutions = [];

    for (const [evolutionId, evolution] of Object.entries(EVOLUTION_PATHS)) {
      // Solo mostrar evoluciones del siguiente tier
      if (evolution.tier !== currentTier + 1) continue;

      // Verificar requisitos
      const requirements = this.checkEvolutionRequirements(being, evolution, gameStats);

      if (requirements.canEvolve || requirements.progress > 0.5) {
        availableEvolutions.push({
          ...evolution,
          requirements,
          canEvolve: requirements.canEvolve,
          progress: requirements.progress
        });
      }
    }

    return availableEvolutions;
  }

  checkEvolutionRequirements(being, evolution, gameStats) {
    const reqs = evolution.requirements;
    const checks = {};
    let metCount = 0;
    let totalCount = 0;

    // Level check
    if (reqs.level) {
      totalCount++;
      checks.level = {
        required: reqs.level,
        current: being.level || 1,
        met: (being.level || 1) >= reqs.level
      };
      if (checks.level.met) metCount++;
    }

    // Previous evolution check
    if (reqs.previousEvolution) {
      totalCount++;
      const isPrevious = reqs.previousEvolution === 'any_tier_3'
        ? EVOLUTION_PATHS[being.evolution]?.tier === 3
        : being.evolution === reqs.previousEvolution;
      checks.previousEvolution = {
        required: reqs.previousEvolution,
        current: being.evolution,
        met: isPrevious
      };
      if (checks.previousEvolution.met) metCount++;
    }

    // Dominant stats check
    if (reqs.dominantStats && reqs.minStatValue) {
      totalCount++;
      const hasStats = reqs.dominantStats.some(
        stat => (being.attributes?.[stat] || 0) >= reqs.minStatValue
      );
      checks.dominantStats = {
        required: reqs.dominantStats,
        minValue: reqs.minStatValue,
        met: hasStats
      };
      if (checks.dominantStats.met) metCount++;
    }

    // Quizzes passed
    if (reqs.quizzesPassed) {
      totalCount++;
      checks.quizzesPassed = {
        required: reqs.quizzesPassed,
        current: gameStats?.quizzesPassed || 0,
        met: (gameStats?.quizzesPassed || 0) >= reqs.quizzesPassed
      };
      if (checks.quizzesPassed.met) metCount++;
    }

    // Crises resolved
    if (reqs.crisesResolved) {
      totalCount++;
      checks.crisesResolved = {
        required: reqs.crisesResolved,
        current: gameStats?.crisesResolved || 0,
        met: (gameStats?.crisesResolved || 0) >= reqs.crisesResolved
      };
      if (checks.crisesResolved.met) metCount++;
    }

    // Explorations
    if (reqs.explorations) {
      totalCount++;
      checks.explorations = {
        required: reqs.explorations,
        current: gameStats?.explorations || 0,
        met: (gameStats?.explorations || 0) >= reqs.explorations
      };
      if (checks.explorations.met) metCount++;
    }

    // Sanctuary visits
    if (reqs.sanctuaryVisits) {
      totalCount++;
      checks.sanctuaryVisits = {
        required: reqs.sanctuaryVisits,
        current: gameStats?.sanctuaryVisits || 0,
        met: (gameStats?.sanctuaryVisits || 0) >= reqs.sanctuaryVisits
      };
      if (checks.sanctuaryVisits.met) metCount++;
    }

    // Purifications done
    if (reqs.purificationsDone) {
      totalCount++;
      checks.purificationsDone = {
        required: reqs.purificationsDone,
        current: gameStats?.purificationsDone || 0,
        met: (gameStats?.purificationsDone || 0) >= reqs.purificationsDone
      };
      if (checks.purificationsDone.met) metCount++;
    }

    return {
      checks,
      canEvolve: metCount === totalCount,
      progress: totalCount > 0 ? metCount / totalCount : 0,
      metCount,
      totalCount
    };
  }

  // --------------------------------------------------------------------------
  // EVOLUCIÓN
  // --------------------------------------------------------------------------

  /**
   * Evolucionar un ser
   */
  async evolveBeing(beingId, evolutionId, currentBeing) {
    const evolution = EVOLUTION_PATHS[evolutionId];
    if (!evolution) throw new Error('Evolución no encontrada');

    // Aplicar boosts de stats
    const newAttributes = { ...currentBeing.attributes };
    for (const [stat, boost] of Object.entries(evolution.statBoosts)) {
      if (stat === 'all') {
        for (const key of Object.keys(newAttributes)) {
          newAttributes[key] = (newAttributes[key] || 0) + boost;
        }
      } else {
        newAttributes[stat] = (newAttributes[stat] || 0) + boost;
      }
    }

    const evolvedBeing = {
      ...currentBeing,
      evolution: evolutionId,
      evolutionName: evolution.name,
      evolutionIcon: evolution.icon,
      evolutionTier: evolution.tier,
      attributes: newAttributes,
      abilities: [
        ...(currentBeing.abilities || []),
        {
          id: evolution.unlocksAbility,
          name: evolution.unlocksAbility,
          description: evolution.abilityDescription,
          unlockedAt: Date.now()
        }
      ],
      evolvedAt: Date.now()
    };

    // Registrar en historial
    if (!this.evolutionHistory[beingId]) {
      this.evolutionHistory[beingId] = [];
    }
    this.evolutionHistory[beingId].push({
      from: currentBeing.evolution || 'base',
      to: evolutionId,
      timestamp: Date.now()
    });

    await this.saveState();

    return {
      success: true,
      being: evolvedBeing,
      evolution,
      newAbility: {
        name: evolution.unlocksAbility,
        description: evolution.abilityDescription
      }
    };
  }

  // --------------------------------------------------------------------------
  // INFORMACIÓN
  // --------------------------------------------------------------------------

  getEvolutionPath(evolutionId) {
    return EVOLUTION_PATHS[evolutionId] || null;
  }

  getEvolutionTree() {
    const tree = {
      tiers: EVOLUTION_TIERS,
      paths: EVOLUTION_PATHS
    };
    return tree;
  }

  getBeingEvolutionHistory(beingId) {
    return this.evolutionHistory[beingId] || [];
  }

  getPossibleFinalEvolutions(currentEvolution) {
    if (!currentEvolution) {
      // Desde base, mostrar todos los tier 1
      return Object.values(EVOLUTION_PATHS).filter(e => e.tier === 1);
    }

    const current = EVOLUTION_PATHS[currentEvolution];
    if (!current || !current.evolvesTo) return [];

    return current.evolvesTo.map(id => EVOLUTION_PATHS[id]).filter(Boolean);
  }

  // --------------------------------------------------------------------------
  // PERSISTENCIA
  // --------------------------------------------------------------------------

  async saveState() {
    try {
      await AsyncStorage.setItem('evolution_state', JSON.stringify({
        evolutionHistory: this.evolutionHistory,
        pendingEvolutions: this.pendingEvolutions
      }));
    } catch (error) {
      logger.error('EvolutionService', 'Error saving state:', error);
    }
  }

  async loadState() {
    try {
      const data = await AsyncStorage.getItem('evolution_state');
      if (data) {
        const parsed = JSON.parse(data);
        this.evolutionHistory = parsed.evolutionHistory || {};
        this.pendingEvolutions = parsed.pendingEvolutions || {};
      }
    } catch (error) {
      logger.error('EvolutionService', 'Error loading state:', error);
    }
  }
}

export const evolutionService = new EvolutionService();
export { EVOLUTION_PATHS, EVOLUTION_TIERS };
export default EvolutionService;
