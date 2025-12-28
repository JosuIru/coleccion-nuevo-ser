/**
 * FRANKENSTEIN LAB - BEING TEMPLATES
 * Extracted from frankenstein-ui.js & frankenstein-missions.js (Refactoring v2.9.200 Phase 1)
 *
 * Contains: Default being structure, predefined being templates, demo beings
 *
 * @version 1.0.0
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

/**
 * DEFAULT BEING STRUCTURE
 * Base template extracted from FrankensteinMissionsSystem.createBeing()
 * Used when creating new beings from scratch
 */
export const DEFAULT_BEING_STRUCTURE = {
  // Identidad
  id: null, // Auto-generated: being_{timestamp}_{random}
  name: 'Ser sin nombre',
  pieces: [],
  createdAt: null, // Auto-generated: new Date().toISOString()

  // Atributos base (calculados de piezas)
  attributes: {},
  baseAttributes: {},
  totalPower: 0,
  balance: {},

  // Sistema de Progresión
  level: 1,
  xp: 0,
  xpToNextLevel: 100, // Calculated by progressionConfig

  // Sistema de Energía
  energy: 100,
  maxEnergy: 100,
  lastEnergyUpdate: null, // Date.now()

  // Estado actual
  status: 'idle', // idle, deployed, recovering, exhausted
  statusMessage: 'Listo para misión',

  // Misión actual
  currentMission: null,
  missionStartedAt: null,
  turnsRemaining: 0,
  turnsTotal: 0,

  // Historial básico
  stats: {
    missionsCompleted: 0,
    missionsSuccess: 0,
    missionsFailed: 0,
    totalTurnsPlayed: 0,
    challengesCompleted: 0,
    hybridChildren: 0,
    totalXpEarned: 0
  },

  // Estadísticas avanzadas
  advancedStats: {
    averageTurnsPerMission: 0,
    fastestMission: null,
    slowestMission: null,
    longestStreak: 0,
    currentStreak: 0,
    totalPlayTimeMs: 0,
    lastPlayedAt: null,
    efficiencyScore: 0,
    favoriteTimeOfDay: null,
    missionHistory: [],
    levelUpHistory: []
  },

  // Relaciones (para microsociedades)
  relationships: {},

  // Rasgos especiales (desbloqueables por nivel/misiones)
  traits: [],

  // Habilidades especiales (desbloqueables por nivel)
  abilities: [],

  // Afinidades (calculadas de las piezas)
  affinities: {
    missions: [],
    pieceTypes: [],
    bookIds: [],
    attributes: []
  },

  // Especialidad (auto-detectada)
  specialty: null,

  // Estado emocional/mood
  mood: 'neutral',
  moodEffects: { xpMultiplier: 1.0, energyCost: 1.0 },

  // Logros desbloqueados
  achievements: [],

  // Generación (para híbridos)
  generation: 1,
  parentIds: []
};

/**
 * DEMO BEING TEMPLATES
 * Pre-defined beings for demo mode and tutorials
 * Source: frankenstein-demo-data.js (exampleBeings)
 */
export const DEMO_BEINGS = {
  ECO_ACTIVIST: {
    id: 'demo-eco-activist-001',
    name: 'Guardián de la Tierra',
    missionId: 'earth-defender',
    mission: {
      id: 'earth-defender',
      name: 'Defensor de la Tierra',
      icon: '🛡️',
      description: 'Proteger ecosistemas y liderar la regeneración ambiental'
    },
    pieces: [
      {
        type: 'chapter',
        id: 'toolkit-transicion-cap1',
        bookId: 'toolkit-transicion',
        bookTitle: 'Toolkit de Transición',
        title: 'Introducción',
        icon: '📖'
      },
      {
        type: 'chapter',
        id: 'practicas-radicales-cap2',
        bookId: 'practicas-radicales',
        bookTitle: 'Prácticas Radicales',
        title: 'Conexión con la Naturaleza',
        icon: '📖'
      },
      {
        type: 'exercise',
        id: 'manifiesto-ex1',
        bookId: 'manifiesto',
        bookTitle: 'Manifiesto',
        title: 'Meditación en la Tierra',
        icon: '🧘'
      }
    ],
    being: {
      name: 'Guardián de la Tierra',
      pieces: [],
      attributes: {
        wisdom: 75,
        empathy: 90,
        courage: 80,
        creativity: 70,
        discipline: 85,
        action: 95,
        balance: 88,
        resilience: 85,
        communication: 78,
        consciousness: 82,
        organization: 80
      },
      totalPower: 908
    },
    validation: {
      valid: true,
      score: 95,
      feedback: 'Ser perfectamente equilibrado para la defensa ambiental'
    },
    createdAt: '2025-12-12T10:00:00.000Z'
  },

  PHILOSOPHER: {
    id: 'demo-philosopher-002',
    name: 'Sabio Contemplativo',
    missionId: 'consciousness-awakener',
    mission: {
      id: 'consciousness-awakener',
      name: 'Despertador de Consciencia',
      icon: '🌅',
      description: 'Facilitar el despertar de consciencia en individuos y comunidades'
    },
    pieces: [
      {
        type: 'chapter',
        id: 'codigo-despertar-cap1',
        bookId: 'codigo-despertar',
        bookTitle: 'Código del Despertar',
        title: 'El Despertar',
        icon: '📖'
      },
      {
        type: 'chapter',
        id: 'dialogos-maquina-cap1',
        bookId: 'dialogos-maquina',
        bookTitle: 'Diálogos con la Máquina',
        title: 'Conciencia y Tecnología',
        icon: '📖'
      },
      {
        type: 'resource',
        id: 'manifiesto-res1',
        bookId: 'manifiesto',
        bookTitle: 'Manifiesto',
        title: 'Fundamentos Filosóficos',
        icon: '📚'
      }
    ],
    being: {
      name: 'Sabio Contemplativo',
      pieces: [],
      attributes: {
        wisdom: 98,
        empathy: 85,
        courage: 70,
        creativity: 92,
        discipline: 88,
        action: 65,
        balance: 95,
        resilience: 75,
        communication: 80,
        consciousness: 97,
        organization: 70
      },
      totalPower: 915
    },
    validation: {
      valid: true,
      score: 98,
      feedback: 'Excepcional capacidad para despertar consciencia'
    },
    createdAt: '2025-12-12T10:15:00.000Z'
  },

  COMMUNITY_BUILDER: {
    id: 'demo-community-builder-003',
    name: 'Tejedor de Comunidad',
    missionId: 'community-weaver',
    mission: {
      id: 'community-weaver',
      name: 'Tejedor de Comunidad',
      icon: '🕸️',
      description: 'Crear y mantener redes de apoyo y colaboración'
    },
    pieces: [
      {
        type: 'chapter',
        id: 'guia-acciones-cap1',
        bookId: 'guia-acciones',
        bookTitle: 'Guía de Acciones',
        title: 'Acciones Colectivas',
        icon: '📖'
      },
      {
        type: 'chapter',
        id: 'manual-transicion-cap2',
        bookId: 'manual-transicion',
        bookTitle: 'Manual de Transición',
        title: 'Construyendo Comunidad',
        icon: '📖'
      },
      {
        type: 'exercise',
        id: 'toolkit-ex2',
        bookId: 'toolkit-transicion',
        bookTitle: 'Toolkit de Transición',
        title: 'Círculo de Diálogo',
        icon: '🧘'
      }
    ],
    being: {
      name: 'Tejedor de Comunidad',
      pieces: [],
      attributes: {
        wisdom: 80,
        empathy: 95,
        courage: 75,
        creativity: 85,
        discipline: 78,
        action: 88,
        balance: 90,
        resilience: 92,
        communication: 96,
        consciousness: 83,
        organization: 90
      },
      totalPower: 952
    },
    validation: {
      valid: true,
      score: 96,
      feedback: 'Excepcional capacidad para tejer redes comunitarias'
    },
    createdAt: '2025-12-12T10:30:00.000Z'
  },

  INNOVATOR: {
    id: 'demo-innovator-004',
    name: 'Catalizador de Innovación',
    missionId: 'tech-humanist',
    mission: {
      id: 'tech-humanist',
      name: 'Tecnólogo Humanista',
      icon: '🤖',
      description: 'Integrar tecnología y humanismo para transformación social'
    },
    pieces: [
      {
        type: 'chapter',
        id: 'dialogos-maquina-cap2',
        bookId: 'dialogos-maquina',
        bookTitle: 'Diálogos con la Máquina',
        title: 'Tecnología Consciente',
        icon: '📖'
      },
      {
        type: 'chapter',
        id: 'codigo-despertar-cap3',
        bookId: 'codigo-despertar',
        bookTitle: 'Código del Despertar',
        title: 'Innovación y Consciencia',
        icon: '📖'
      },
      {
        type: 'resource',
        id: 'toolkit-res1',
        bookId: 'toolkit-transicion',
        bookTitle: 'Toolkit de Transición',
        title: 'Herramientas Digitales',
        icon: '📚'
      }
    ],
    being: {
      name: 'Catalizador de Innovación',
      pieces: [],
      attributes: {
        wisdom: 88,
        empathy: 78,
        courage: 92,
        creativity: 97,
        discipline: 85,
        action: 90,
        balance: 82,
        resilience: 80,
        communication: 86,
        consciousness: 85,
        organization: 88
      },
      totalPower: 951
    },
    validation: {
      valid: true,
      score: 94,
      feedback: 'Excepcional capacidad innovadora con enfoque humanista'
    },
    createdAt: '2025-12-12T10:45:00.000Z'
  },

  HEALER: {
    id: 'demo-healer-005',
    name: 'Sanador Integral',
    missionId: 'trauma-healer',
    mission: {
      id: 'trauma-healer',
      name: 'Sanador de Traumas',
      icon: '💚',
      description: 'Acompañar procesos de sanación individual y colectiva'
    },
    pieces: [
      {
        type: 'chapter',
        id: 'practicas-radicales-cap1',
        bookId: 'practicas-radicales',
        bookTitle: 'Prácticas Radicales',
        title: 'Sanación Profunda',
        icon: '📖'
      },
      {
        type: 'chapter',
        id: 'manual-practico-cap2',
        bookId: 'manual-practico',
        bookTitle: 'Manual Práctico',
        title: 'Técnicas de Sanación',
        icon: '📖'
      },
      {
        type: 'exercise',
        id: 'practicas-ex1',
        bookId: 'practicas-radicales',
        bookTitle: 'Prácticas Radicales',
        title: 'Meditación Sanadora',
        icon: '🧘'
      }
    ],
    being: {
      name: 'Sanador Integral',
      pieces: [],
      attributes: {
        wisdom: 90,
        empathy: 98,
        courage: 78,
        creativity: 85,
        discipline: 82,
        action: 75,
        balance: 96,
        resilience: 88,
        communication: 87,
        consciousness: 92,
        organization: 76
      },
      totalPower: 947
    },
    validation: {
      valid: true,
      score: 97,
      feedback: 'Capacidad sanadora excepcional con profunda empatía'
    },
    createdAt: '2025-12-12T11:00:00.000Z'
  }
};

/**
 * BEING TEMPLATE CATEGORIES
 * Organized by archetype for easier discovery
 */
export const BEING_CATEGORIES = {
  ECOLOGICAL: ['ECO_ACTIVIST'],
  PHILOSOPHICAL: ['PHILOSOPHER'],
  SOCIAL: ['COMMUNITY_BUILDER'],
  TECHNOLOGICAL: ['INNOVATOR'],
  HEALING: ['HEALER']
};

/**
 * BEING STATUS TYPES
 * Valid status values for beings
 */
export const BEING_STATUS = {
  IDLE: 'idle',
  DEPLOYED: 'deployed',
  RECOVERING: 'recovering',
  EXHAUSTED: 'exhausted'
};

/**
 * BEING MOOD TYPES
 * Valid mood values for beings
 */
export const BEING_MOODS = {
  NEUTRAL: 'neutral',
  INSPIRED: 'inspired',
  FOCUSED: 'focused',
  EXHAUSTED: 'exhausted',
  TRIUMPHANT: 'triumphant'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all demo beings as an array
 * @returns {Array} Array of demo being objects
 */
export function getAllDemoBeings() {
  return Object.values(DEMO_BEINGS).map(being =>
    JSON.parse(JSON.stringify(being))
  );
}

/**
 * Get a specific demo being by key
 * @param {string} key - DEMO_BEINGS key (e.g., 'ECO_ACTIVIST')
 * @returns {Object|null} Deep copy of demo being or null if not found
 */
export function getDemoBeing(key) {
  if (!DEMO_BEINGS[key]) return null;
  return JSON.parse(JSON.stringify(DEMO_BEINGS[key]));
}

/**
 * Get a random demo being
 * @returns {Object} Deep copy of a random demo being
 */
export function getRandomDemoBeing() {
  const beings = getAllDemoBeings();
  return beings[Math.floor(Math.random() * beings.length)];
}

/**
 * Get demo beings by category
 * @param {string} category - Category key from BEING_CATEGORIES
 * @returns {Array} Array of demo beings in that category
 */
export function getDemoBeingsByCategory(category) {
  if (!BEING_CATEGORIES[category]) return [];

  return BEING_CATEGORIES[category].map(key =>
    getDemoBeing(key)
  ).filter(Boolean);
}

/**
 * Create a new being from default structure
 * @param {Object} overrides - Properties to override in default structure
 * @returns {Object} New being object with applied overrides
 */
export function createBeingFromTemplate(overrides = {}) {
  const newBeing = JSON.parse(JSON.stringify(DEFAULT_BEING_STRUCTURE));

  // Generate defaults for auto-generated fields
  const timestamp = Date.now();
  newBeing.id = `being_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  newBeing.createdAt = new Date().toISOString();
  newBeing.lastEnergyUpdate = timestamp;

  // Apply overrides (deep merge for nested objects)
  return deepMerge(newBeing, overrides);
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }

  return output;
}

/**
 * Check if value is a plain object
 * @param {*} item - Value to check
 * @returns {boolean} True if plain object
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Validate being structure
 * @param {Object} being - Being object to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateBeingStructure(being) {
  const errors = [];

  // Required fields
  const requiredFields = ['id', 'name', 'pieces', 'attributes', 'totalPower'];
  requiredFields.forEach(field => {
    if (!(field in being)) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Type checks
  if (being.pieces && !Array.isArray(being.pieces)) {
    errors.push('pieces must be an array');
  }

  if (being.attributes && typeof being.attributes !== 'object') {
    errors.push('attributes must be an object');
  }

  if (being.status && !Object.values(BEING_STATUS).includes(being.status)) {
    errors.push(`Invalid status: ${being.status}. Must be one of: ${Object.values(BEING_STATUS).join(', ')}`);
  }

  if (being.mood && !Object.values(BEING_MOODS).includes(being.mood)) {
    errors.push(`Invalid mood: ${being.mood}. Must be one of: ${Object.values(BEING_MOODS).join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if a being is a demo being
 * @param {Object} being - Being object to check
 * @returns {boolean} True if demo being
 */
export function isDemoBeing(being) {
  if (!being || !being.id) return false;
  return being.id.toString().startsWith('demo-') || Boolean(being.isDemo);
}

// ============================================================================
// EXPORTS FOR COMPATIBILITY
// ============================================================================

// Export for global window access (if needed for backward compatibility)
if (typeof window !== 'undefined') {
  window.FrankensteinBeingTemplates = {
    DEFAULT_BEING_STRUCTURE,
    DEMO_BEINGS,
    BEING_CATEGORIES,
    BEING_STATUS,
    BEING_MOODS,
    getAllDemoBeings,
    getDemoBeing,
    getRandomDemoBeing,
    getDemoBeingsByCategory,
    createBeingFromTemplate,
    validateBeingStructure,
    isDemoBeing
  };
}
