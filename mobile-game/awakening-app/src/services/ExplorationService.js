/**
 * ExplorationService.js
 *
 * Gestiona la mecánica de exploración del mapa mundial.
 * Los seres pueden explorar regiones sin crisis específicas
 * y descubrir eventos, seres ocultos, fragmentos de sabiduría, etc.
 *
 * @version 1.0.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

// ============================================================================
// REGIONES EXPLORABLES
// ============================================================================

const EXPLORATION_REGIONS = {
  // Américas
  north_america: {
    id: 'north_america',
    name: 'Norteamérica',
    icon: '🏔️',
    center: { lat: 45.0, lon: -100.0 },
    difficulty: 'medium',
    specialFinds: ['ancient_wisdom', 'tech_innovation'],
    description: 'Tierra de contrastes entre tecnología y naturaleza salvaje.'
  },
  central_america: {
    id: 'central_america',
    name: 'Centroamérica',
    icon: '🌴',
    center: { lat: 15.0, lon: -90.0 },
    difficulty: 'medium',
    specialFinds: ['mayan_knowledge', 'biodiversity'],
    description: 'Cuna de civilizaciones antiguas y selvas tropicales.'
  },
  south_america: {
    id: 'south_america',
    name: 'Sudamérica',
    icon: '🌳',
    center: { lat: -15.0, lon: -60.0 },
    difficulty: 'hard',
    specialFinds: ['amazon_secrets', 'incan_wisdom'],
    description: 'El pulmón del mundo guarda secretos ancestrales.'
  },

  // Europa
  western_europe: {
    id: 'western_europe',
    name: 'Europa Occidental',
    icon: '🏰',
    center: { lat: 48.0, lon: 5.0 },
    difficulty: 'easy',
    specialFinds: ['renaissance_art', 'philosophical_texts'],
    description: 'Cuna del pensamiento occidental moderno.'
  },
  eastern_europe: {
    id: 'eastern_europe',
    name: 'Europa del Este',
    icon: '⛪',
    center: { lat: 52.0, lon: 25.0 },
    difficulty: 'medium',
    specialFinds: ['orthodox_wisdom', 'folk_traditions'],
    description: 'Tierras de misterio y tradiciones profundas.'
  },
  northern_europe: {
    id: 'northern_europe',
    name: 'Escandinavia',
    icon: '❄️',
    center: { lat: 62.0, lon: 15.0 },
    difficulty: 'medium',
    specialFinds: ['norse_runes', 'arctic_visions'],
    description: 'El norte helado donde los vikingos buscaban sabiduría.'
  },

  // África
  north_africa: {
    id: 'north_africa',
    name: 'Norte de África',
    icon: '🏜️',
    center: { lat: 28.0, lon: 10.0 },
    difficulty: 'hard',
    specialFinds: ['desert_wisdom', 'ancient_libraries'],
    description: 'El Sahara guarda conocimiento de eras olvidadas.'
  },
  sub_saharan: {
    id: 'sub_saharan',
    name: 'África Subsahariana',
    icon: '🦁',
    center: { lat: 0.0, lon: 25.0 },
    difficulty: 'hard',
    specialFinds: ['tribal_wisdom', 'nature_connection'],
    description: 'La cuna de la humanidad vibra con vida.'
  },

  // Asia
  middle_east: {
    id: 'middle_east',
    name: 'Medio Oriente',
    icon: '🕌',
    center: { lat: 32.0, lon: 45.0 },
    difficulty: 'hard',
    specialFinds: ['sufi_wisdom', 'ancient_texts'],
    description: 'Encrucijada de civilizaciones y espiritualidades.'
  },
  south_asia: {
    id: 'south_asia',
    name: 'Sur de Asia',
    icon: '🕉️',
    center: { lat: 22.0, lon: 78.0 },
    difficulty: 'medium',
    specialFinds: ['vedic_knowledge', 'meditation_techniques'],
    description: 'Tierra de yoguis y sabiduría milenaria.'
  },
  east_asia: {
    id: 'east_asia',
    name: 'Asia Oriental',
    icon: '☯️',
    center: { lat: 35.0, lon: 110.0 },
    difficulty: 'medium',
    specialFinds: ['taoist_secrets', 'zen_insights'],
    description: 'Donde el Tao fluye entre montañas de niebla.'
  },
  southeast_asia: {
    id: 'southeast_asia',
    name: 'Sudeste Asiático',
    icon: '🏯',
    center: { lat: 10.0, lon: 105.0 },
    difficulty: 'medium',
    specialFinds: ['buddhist_teachings', 'island_mysteries'],
    description: 'Templos escondidos en selvas tropicales.'
  },

  // Oceanía
  oceania: {
    id: 'oceania',
    name: 'Oceanía',
    icon: '🏝️',
    center: { lat: -25.0, lon: 135.0 },
    difficulty: 'hard',
    specialFinds: ['dreamtime_wisdom', 'ocean_consciousness'],
    description: 'El tiempo del sueño de los pueblos originarios.'
  },
  pacific_islands: {
    id: 'pacific_islands',
    name: 'Islas del Pacífico',
    icon: '🌊',
    center: { lat: -5.0, lon: 170.0 },
    difficulty: 'extreme',
    specialFinds: ['navigator_knowledge', 'island_spirits'],
    description: 'Navegantes que leían las estrellas y las olas.'
  },

  // Regiones Especiales
  antarctica: {
    id: 'antarctica',
    name: 'Antártida',
    icon: '🧊',
    center: { lat: -80.0, lon: 0.0 },
    difficulty: 'extreme',
    specialFinds: ['frozen_memories', 'cosmic_signal'],
    description: 'El continente de hielo guarda secretos cósmicos.',
    requiresLevel: 20
  },
  arctic: {
    id: 'arctic',
    name: 'Ártico',
    icon: '🌌',
    center: { lat: 85.0, lon: 0.0 },
    difficulty: 'extreme',
    specialFinds: ['aurora_visions', 'polar_consciousness'],
    description: 'Bajo las auroras, la consciencia se expande.',
    requiresLevel: 15
  }
};

// Tipos de descubrimientos
const DISCOVERY_TYPES = {
  wisdom_fragment: {
    id: 'wisdom_fragment',
    name: 'Fragmento de Sabiduría',
    icon: '📜',
    rarity: 'common',
    chance: 0.25,
    rewards: { wisdom: { min: 5, max: 15 }, xp: { min: 20, max: 50 } }
  },
  hidden_being_signal: {
    id: 'hidden_being_signal',
    name: 'Señal de Ser Oculto',
    icon: '✨',
    rarity: 'rare',
    chance: 0.10,
    rewards: { hiddenBeingClue: true }
  },
  energy_well: {
    id: 'energy_well',
    name: 'Pozo de Energía',
    icon: '⚡',
    rarity: 'uncommon',
    chance: 0.15,
    rewards: { energy: { min: 20, max: 50 } }
  },
  ancient_text: {
    id: 'ancient_text',
    name: 'Texto Antiguo',
    icon: '📚',
    rarity: 'rare',
    chance: 0.08,
    rewards: { knowledge: { min: 10, max: 25 }, quizHint: true }
  },
  consciousness_node: {
    id: 'consciousness_node',
    name: 'Nodo de Consciencia',
    icon: '🔮',
    rarity: 'epic',
    chance: 0.05,
    rewards: { consciousness: { min: 30, max: 60 }, temporaryBoost: true }
  },
  crisis_preview: {
    id: 'crisis_preview',
    name: 'Visión de Crisis',
    icon: '👁️',
    rarity: 'uncommon',
    chance: 0.12,
    rewards: { crisisAdvanceWarning: true }
  },
  sanctuary_clue: {
    id: 'sanctuary_clue',
    name: 'Pista de Santuario',
    icon: '🗺️',
    rarity: 'rare',
    chance: 0.07,
    rewards: { sanctuaryBonus: true }
  },
  meditation_spot: {
    id: 'meditation_spot',
    name: 'Lugar de Meditación',
    icon: '🧘',
    rarity: 'uncommon',
    chance: 0.10,
    rewards: { meditationBonus: { min: 10, max: 30 } }
  },
  cosmic_signal: {
    id: 'cosmic_signal',
    name: 'Señal Cósmica',
    icon: '🌟',
    rarity: 'legendary',
    chance: 0.02,
    rewards: { legendaryClue: true, consciousness: { min: 50, max: 100 } }
  },
  nothing: {
    id: 'nothing',
    name: 'Sin Descubrimientos',
    icon: '🚶',
    rarity: 'common',
    chance: 0.30,
    rewards: { xp: { min: 5, max: 15 } }
  }
};

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class ExplorationService {
  constructor() {
    this.activeExplorations = {}; // beingId -> exploration data
    this.explorationHistory = [];
    this.regionDiscoveries = {}; // regionId -> discoveries made
    this.unlockedRegions = {};
  }

  async initialize() {
    await this.loadState();
    return true;
  }

  /**
   * Obtiene el estado actual de exploración
   */
  getExplorationState() {
    return {
      activeExplorations: this.activeExplorations,
      exploredRegions: Object.keys(this.regionDiscoveries),
      discoveries: this.explorationHistory,
      unlockedRegions: this.unlockedRegions
    };
  }

  // --------------------------------------------------------------------------
  // EXPLORACIÓN
  // --------------------------------------------------------------------------

  /**
   * Obtener regiones disponibles para explorar
   */
  getAvailableRegions(userLevel = 1) {
    return Object.values(EXPLORATION_REGIONS).map(region => {
      const requiredLevel = region.requiresLevel || 1;
      const isUnlocked = userLevel >= requiredLevel;
      const timesExplored = this.regionDiscoveries[region.id]?.count || 0;

      return {
        ...region,
        isUnlocked,
        requiredLevel,
        timesExplored,
        lastExplored: this.regionDiscoveries[region.id]?.lastExplored || null
      };
    });
  }

  /**
   * Iniciar exploración de una región
   */
  async startExploration(beingId, regionId, beingStats) {
    const region = EXPLORATION_REGIONS[regionId];
    if (!region) throw new Error('Región no encontrada');

    // Calcular duración según dificultad
    const baseDuration = {
      easy: 1 * 60 * 60 * 1000,    // 1 hora
      medium: 2 * 60 * 60 * 1000,  // 2 horas
      hard: 3 * 60 * 60 * 1000,    // 3 horas
      extreme: 4 * 60 * 60 * 1000  // 4 horas
    };

    const duration = baseDuration[region.difficulty] || baseDuration.medium;

    // Bonus por stats del ser
    const explorationBonus = (beingStats.exploration || 50) / 100;
    const wisdomBonus = (beingStats.wisdom || 50) / 200;

    this.activeExplorations[beingId] = {
      beingId,
      regionId,
      region,
      startTime: Date.now(),
      endTime: Date.now() + duration,
      bonuses: { exploration: explorationBonus, wisdom: wisdomBonus }
    };

    await this.saveState();

    return {
      started: true,
      exploration: this.activeExplorations[beingId],
      estimatedDuration: duration
    };
  }

  /**
   * Completar exploración y determinar descubrimientos
   */
  async completeExploration(beingId) {
    const exploration = this.activeExplorations[beingId];
    if (!exploration) return null;

    if (Date.now() < exploration.endTime) {
      return {
        complete: false,
        remainingTime: exploration.endTime - Date.now(),
        progress: (Date.now() - exploration.startTime) / (exploration.endTime - exploration.startTime)
      };
    }

    // Generar descubrimientos
    const discoveries = this.generateDiscoveries(exploration);

    // Actualizar historial de región
    if (!this.regionDiscoveries[exploration.regionId]) {
      this.regionDiscoveries[exploration.regionId] = { count: 0, discoveries: [] };
    }
    this.regionDiscoveries[exploration.regionId].count++;
    this.regionDiscoveries[exploration.regionId].lastExplored = Date.now();
    this.regionDiscoveries[exploration.regionId].discoveries.push(...discoveries);

    // Registrar en historial general
    this.explorationHistory.push({
      beingId,
      regionId: exploration.regionId,
      discoveries,
      timestamp: Date.now()
    });

    delete this.activeExplorations[beingId];
    await this.saveState();

    return {
      complete: true,
      region: exploration.region,
      discoveries,
      totalRewards: this.calculateTotalRewards(discoveries)
    };
  }

  generateDiscoveries(exploration) {
    const discoveries = [];
    const { bonuses, region } = exploration;

    // Ajustar chances según bonuses
    const chanceMultiplier = 1 + bonuses.exploration + bonuses.wisdom;

    // Número de "tiradas" según dificultad
    const rolls = {
      easy: 2,
      medium: 3,
      hard: 4,
      extreme: 5
    };
    const numRolls = rolls[region.difficulty] || 3;

    for (let i = 0; i < numRolls; i++) {
      const roll = Math.random();
      let cumulative = 0;

      for (const discovery of Object.values(DISCOVERY_TYPES)) {
        cumulative += discovery.chance * chanceMultiplier;
        if (roll < cumulative) {
          const reward = this.generateRewardFromDiscovery(discovery);
          discoveries.push({
            ...discovery,
            reward,
            foundAt: Date.now()
          });
          break;
        }
      }
    }

    // Posibilidad de descubrimiento especial de la región
    if (Math.random() < 0.15) {
      const specialFind = region.specialFinds[
        Math.floor(Math.random() * region.specialFinds.length)
      ];
      discoveries.push({
        id: `special_${specialFind}`,
        name: this.getSpecialFindName(specialFind),
        icon: '🌟',
        rarity: 'legendary',
        isRegionSpecial: true,
        specialType: specialFind,
        reward: { specialBonus: true, xp: 100, consciousness: 50 }
      });
    }

    return discoveries.filter(d => d.id !== 'nothing' || discoveries.length === 1);
  }

  generateRewardFromDiscovery(discovery) {
    const reward = {};

    for (const [key, value] of Object.entries(discovery.rewards)) {
      if (typeof value === 'object' && value.min !== undefined) {
        reward[key] = Math.floor(Math.random() * (value.max - value.min + 1)) + value.min;
      } else {
        reward[key] = value;
      }
    }

    return reward;
  }

  calculateTotalRewards(discoveries) {
    const total = {
      xp: 0,
      consciousness: 0,
      energy: 0,
      wisdom: 0,
      knowledge: 0,
      special: []
    };

    discoveries.forEach(d => {
      if (d.reward) {
        total.xp += d.reward.xp || 0;
        total.consciousness += d.reward.consciousness || 0;
        total.energy += d.reward.energy || 0;
        total.wisdom += d.reward.wisdom || 0;
        total.knowledge += d.reward.knowledge || 0;

        if (d.reward.hiddenBeingClue) total.special.push('hidden_being_clue');
        if (d.reward.legendaryClue) total.special.push('legendary_clue');
        if (d.reward.crisisAdvanceWarning) total.special.push('crisis_warning');
        if (d.reward.sanctuaryBonus) total.special.push('sanctuary_bonus');
      }
    });

    return total;
  }

  getSpecialFindName(findType) {
    const names = {
      ancient_wisdom: 'Sabiduría Ancestral',
      tech_innovation: 'Innovación Tecnológica Consciente',
      mayan_knowledge: 'Conocimiento Maya',
      biodiversity: 'Secreto de Biodiversidad',
      amazon_secrets: 'Secretos del Amazonas',
      incan_wisdom: 'Sabiduría Inca',
      renaissance_art: 'Arte del Renacimiento',
      philosophical_texts: 'Textos Filosóficos',
      orthodox_wisdom: 'Sabiduría Ortodoxa',
      folk_traditions: 'Tradiciones Ancestrales',
      norse_runes: 'Runas Nórdicas',
      arctic_visions: 'Visiones Árticas',
      desert_wisdom: 'Sabiduría del Desierto',
      ancient_libraries: 'Biblioteca Antigua',
      tribal_wisdom: 'Sabiduría Tribal',
      nature_connection: 'Conexión con la Naturaleza',
      sufi_wisdom: 'Sabiduría Sufí',
      ancient_texts: 'Textos Antiguos',
      vedic_knowledge: 'Conocimiento Védico',
      meditation_techniques: 'Técnicas de Meditación',
      taoist_secrets: 'Secretos Taoístas',
      zen_insights: 'Insights Zen',
      buddhist_teachings: 'Enseñanzas Budistas',
      island_mysteries: 'Misterios Insulares',
      dreamtime_wisdom: 'Sabiduría del Tiempo del Sueño',
      ocean_consciousness: 'Consciencia Oceánica',
      navigator_knowledge: 'Conocimiento Navegante',
      island_spirits: 'Espíritus de las Islas',
      frozen_memories: 'Memorias Congeladas',
      cosmic_signal: 'Señal Cósmica',
      aurora_visions: 'Visiones de Aurora',
      polar_consciousness: 'Consciencia Polar'
    };
    return names[findType] || 'Descubrimiento Especial';
  }

  // --------------------------------------------------------------------------
  // ESTADO
  // --------------------------------------------------------------------------

  getExplorationStatus(beingId) {
    const exploration = this.activeExplorations[beingId];
    if (!exploration) return null;

    return {
      ...exploration,
      progress: Math.min(1, (Date.now() - exploration.startTime) / (exploration.endTime - exploration.startTime)),
      remainingTime: Math.max(0, exploration.endTime - Date.now()),
      isComplete: Date.now() >= exploration.endTime
    };
  }

  getExplorationStats() {
    const totalExplorations = this.explorationHistory.length;
    const regionStats = {};

    for (const [regionId, data] of Object.entries(this.regionDiscoveries)) {
      regionStats[regionId] = {
        timesExplored: data.count,
        discoveryCount: data.discoveries.length
      };
    }

    return {
      totalExplorations,
      regionStats,
      activeExplorations: Object.keys(this.activeExplorations).length
    };
  }

  // --------------------------------------------------------------------------
  // PERSISTENCIA
  // --------------------------------------------------------------------------

  async saveState() {
    try {
      await AsyncStorage.setItem('exploration_state', JSON.stringify({
        activeExplorations: this.activeExplorations,
        explorationHistory: this.explorationHistory.slice(-50),
        regionDiscoveries: this.regionDiscoveries,
        unlockedRegions: this.unlockedRegions
      }));
    } catch (error) {
      logger.error('ExplorationService', 'Error saving Exploration state:', error);
    }
  }

  async loadState() {
    try {
      const data = await AsyncStorage.getItem('exploration_state');
      if (data) {
        const parsed = JSON.parse(data);
        this.activeExplorations = parsed.activeExplorations || {};
        this.explorationHistory = parsed.explorationHistory || [];
        this.regionDiscoveries = parsed.regionDiscoveries || {};
        this.unlockedRegions = parsed.unlockedRegions || {};
      }
    } catch (error) {
      logger.error('ExplorationService', 'Error loading Exploration state:', error);
    }
  }
}

export const explorationService = new ExplorationService();
export { EXPLORATION_REGIONS, DISCOVERY_TYPES };
export default ExplorationService;
