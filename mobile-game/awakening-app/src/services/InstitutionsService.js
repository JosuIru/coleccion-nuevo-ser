/**
 * INSTITUTIONS SERVICE - Instituciones del Nuevo Ser
 * ==================================================
 *
 * Sistema de construcción de instituciones que contrarrestan
 * a los Guardianes del Viejo Paradigma.
 *
 * FASE 3: Instituciones Construibles
 *
 * Las 7 instituciones representan las estructuras del Nuevo Ser
 * que emergen cuando los Guardianes son transformados.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

// ============================================================================
// DEFINICIÓN DE LAS 7 INSTITUCIONES DEL NUEVO SER
// ============================================================================

const INSTITUTIONS = {
  cooperativa_produccion: {
    id: 'cooperativa_produccion',
    name: 'Cooperativa de Producción',
    shortName: 'Cooperativa',
    avatar: '🤝',
    description: 'Estructura económica basada en la cooperación, no en la explotación. Genera recursos sin externalizar costos.',

    // Relación con Guardianes
    counters: ['moloch'],
    counterBonus: 25, // % de daño extra contra Moloch

    // Requisitos para construir
    requirements: {
      quizzes: ['ahora-instituciones', 'manual-transicion'],
      guardianTransformed: null, // O puede requerir que Moloch esté transformado
      minLevel: 8,
      resources: {
        wisdomFragments: 100,
        awakenedBeings: 5,
        consciousnessIndex: 20
      }
    },

    // Beneficios al construirla
    benefits: {
      resourceGeneration: { type: 'wisdomFragments', amount: 10, interval: 'daily' },
      passiveBonus: { stat: 'economyEfficiency', value: 15 },
      unlocks: ['economia_regalo', 'moneda_local'],
      globalConsciousnessBonus: 2
    },

    // Niveles de mejora
    levels: {
      1: { name: 'Cooperativa Local', capacity: 10, bonus: 1.0 },
      2: { name: 'Red Cooperativa', capacity: 25, bonus: 1.5, cost: 200 },
      3: { name: 'Economía Solidaria Regional', capacity: 50, bonus: 2.0, cost: 500 },
      4: { name: 'Sistema Cooperativo Integral', capacity: 100, bonus: 3.0, cost: 1000 }
    },

    // Color y estética
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',

    // Narrativa
    lore: 'Donde antes Moloch devoraba el trabajo alienado, ahora florece la abundancia compartida. Los trabajadores son dueños de su destino.'
  },

  commons_digital: {
    id: 'commons_digital',
    name: 'Commons Digital',
    shortName: 'Commons',
    avatar: '🌐',
    description: 'Red de comunicación federada, libre de vigilancia y manipulación algorítmica.',

    counters: ['algoritmo'],
    counterBonus: 25,

    requirements: {
      quizzes: ['dialogos-maquina', 'toolkit-transicion'],
      guardianTransformed: null,
      minLevel: 12,
      resources: {
        wisdomFragments: 150,
        awakenedBeings: 8,
        consciousnessIndex: 30
      }
    },

    benefits: {
      resourceGeneration: { type: 'connections', amount: 5, interval: 'daily' },
      passiveBonus: { stat: 'communicationRange', value: 50 },
      unlocks: ['red_federada', 'software_libre'],
      globalConsciousnessBonus: 3
    },

    levels: {
      1: { name: 'Nodo Local', capacity: 15, bonus: 1.0 },
      2: { name: 'Red Comunitaria', capacity: 40, bonus: 1.5, cost: 250 },
      3: { name: 'Federación Regional', capacity: 100, bonus: 2.0, cost: 600 },
      4: { name: 'Internet del Pueblo', capacity: 500, bonus: 3.0, cost: 1200 }
    },

    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.15)',

    lore: 'Donde el Algoritmo fragmentaba y polarizaba, ahora la tecnología sirve a la conexión genuina entre seres conscientes.'
  },

  escuela_libre: {
    id: 'escuela_libre',
    name: 'Escuela Libre',
    shortName: 'Escuela',
    avatar: '📚',
    description: 'Espacio de aprendizaje autodirigido donde florece la creatividad y el despertar.',

    counters: ['maquina'],
    counterBonus: 25,

    requirements: {
      quizzes: ['educar-nuevo-ser'],
      guardianTransformed: null,
      minLevel: 6,
      resources: {
        wisdomFragments: 80,
        awakenedBeings: 3,
        consciousnessIndex: 15
      }
    },

    benefits: {
      resourceGeneration: { type: 'awakenedBeings', amount: 1, interval: 'weekly' },
      passiveBonus: { stat: 'awakeningSpeed', value: 30 },
      unlocks: ['pedagogia_liberadora', 'comunidad_practica'],
      globalConsciousnessBonus: 2.5
    },

    levels: {
      1: { name: 'Círculo de Aprendizaje', capacity: 8, bonus: 1.0 },
      2: { name: 'Escuela Comunitaria', capacity: 25, bonus: 1.5, cost: 150 },
      3: { name: 'Universidad Popular', capacity: 75, bonus: 2.0, cost: 400 },
      4: { name: 'Red de Aprendizaje Libre', capacity: 200, bonus: 3.0, cost: 800 }
    },

    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',

    lore: 'Donde la Máquina producía conformismo, ahora cada ser desarrolla sus dones únicos al servicio del todo.'
  },

  santuario_ecologico: {
    id: 'santuario_ecologico',
    name: 'Santuario Ecológico',
    shortName: 'Santuario',
    avatar: '🌿',
    description: 'Zona de regeneración donde la naturaleza sana y los seres se reconectan con la Tierra.',

    counters: ['mammon'],
    counterBonus: 25,

    requirements: {
      quizzes: ['tierra-que-despierta'],
      guardianTransformed: null,
      minLevel: 7,
      resources: {
        wisdomFragments: 90,
        awakenedBeings: 4,
        consciousnessIndex: 18
      }
    },

    benefits: {
      resourceGeneration: { type: 'healingEnergy', amount: 15, interval: 'daily' },
      passiveBonus: { stat: 'regeneration', value: 20 },
      unlocks: ['permacultura', 'derechos_naturaleza'],
      globalConsciousnessBonus: 3,
      specialEffect: 'beingsHealFaster'
    },

    levels: {
      1: { name: 'Jardín Regenerativo', capacity: 5, bonus: 1.0 },
      2: { name: 'Bosque Protegido', capacity: 20, bonus: 1.5, cost: 180 },
      3: { name: 'Bioregión Consciente', capacity: 50, bonus: 2.0, cost: 450 },
      4: { name: 'Santuario de Gaia', capacity: 150, bonus: 3.0, cost: 900 }
    },

    color: '#22C55E',
    bgColor: 'rgba(34, 197, 94, 0.15)',

    lore: 'Donde Mammon convertía la naturaleza en mercancía, ahora la Tierra respira libre y los seres se curan en su abrazo.'
  },

  centro_contemplativo: {
    id: 'centro_contemplativo',
    name: 'Centro Contemplativo',
    shortName: 'Centro',
    avatar: '🧘',
    description: 'Espacio sagrado para prácticas contemplativas profundas, libre de dogmas institucionales.',

    counters: ['dogma'],
    counterBonus: 25,

    requirements: {
      quizzes: ['codigo-despertar', 'practicas-radicales'],
      guardianTransformed: null,
      minLevel: 10,
      resources: {
        wisdomFragments: 120,
        awakenedBeings: 6,
        consciousnessIndex: 25
      }
    },

    benefits: {
      resourceGeneration: { type: 'consciousness', amount: 8, interval: 'daily' },
      passiveBonus: { stat: 'meditationPower', value: 40 },
      unlocks: ['contemplacion_profunda', 'mistica_directa'],
      globalConsciousnessBonus: 3.5
    },

    levels: {
      1: { name: 'Espacio de Silencio', capacity: 6, bonus: 1.0 },
      2: { name: 'Zendo Comunitario', capacity: 20, bonus: 1.5, cost: 220 },
      3: { name: 'Monasterio Abierto', capacity: 50, bonus: 2.0, cost: 550 },
      4: { name: 'Nodo de Consciencia', capacity: 150, bonus: 3.0, cost: 1100 }
    },

    color: '#6366F1',
    bgColor: 'rgba(99, 102, 241, 0.15)',

    lore: 'Donde Dogma monopolizaba lo sagrado, ahora cada ser accede directamente a la fuente de consciencia que siempre ha sido.'
  },

  asamblea_ciudadana: {
    id: 'asamblea_ciudadana',
    name: 'Asamblea Ciudadana',
    shortName: 'Asamblea',
    avatar: '🏛️',
    description: 'Estructura de gobernanza participativa donde las decisiones emergen del colectivo.',

    counters: ['leviatan'],
    counterBonus: 25,

    requirements: {
      quizzes: ['manifiesto-conciencia', 'ahora-instituciones'],
      guardianTransformed: null,
      minLevel: 14,
      resources: {
        wisdomFragments: 180,
        awakenedBeings: 10,
        consciousnessIndex: 35
      }
    },

    benefits: {
      resourceGeneration: { type: 'influence', amount: 12, interval: 'daily' },
      passiveBonus: { stat: 'collectiveDecision', value: 35 },
      unlocks: ['bioregionalismo', 'democracia_directa'],
      globalConsciousnessBonus: 4
    },

    levels: {
      1: { name: 'Círculo Vecinal', capacity: 12, bonus: 1.0 },
      2: { name: 'Asamblea de Barrio', capacity: 50, bonus: 1.5, cost: 300 },
      3: { name: 'Consejo Bioregional', capacity: 200, bonus: 2.0, cost: 750 },
      4: { name: 'Federación de Asambleas', capacity: 1000, bonus: 3.0, cost: 1500 }
    },

    color: '#EC4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',

    lore: 'Donde Leviatán imponía su voluntad desde arriba, ahora la inteligencia colectiva teje decisiones que honran a todos los seres.'
  },

  circulo_cuidados: {
    id: 'circulo_cuidados',
    name: 'Círculo de Cuidados',
    shortName: 'Círculo',
    avatar: '💗',
    description: 'Red de apoyo mutuo que sana la corrupción y previene el agotamiento de los que despiertan.',

    counters: ['espejo'],
    counterBonus: 25,

    requirements: {
      quizzes: ['filosofia-nuevo-ser', 'guia-acciones'],
      guardianTransformed: null,
      minLevel: 5,
      resources: {
        wisdomFragments: 70,
        awakenedBeings: 2,
        consciousnessIndex: 12
      }
    },

    benefits: {
      resourceGeneration: { type: 'careEnergy', amount: 10, interval: 'daily' },
      passiveBonus: { stat: 'burnoutResistance', value: 50 },
      unlocks: ['apoyo_mutuo', 'belleza_diversa'],
      globalConsciousnessBonus: 2,
      specialEffect: 'curesCorruption'
    },

    levels: {
      1: { name: 'Grupo de Apoyo', capacity: 6, bonus: 1.0 },
      2: { name: 'Red de Cuidado', capacity: 20, bonus: 1.5, cost: 120 },
      3: { name: 'Sistema de Bienestar', capacity: 60, bonus: 2.0, cost: 350 },
      4: { name: 'Cultura del Cuidado', capacity: 200, bonus: 3.0, cost: 700 }
    },

    color: '#F472B6',
    bgColor: 'rgba(244, 114, 182, 0.15)',

    lore: 'Donde Espejo imponía cánones de perfección inalcanzable, ahora cada ser es celebrado en su belleza única e irrepetible.'
  }
};

// ============================================================================
// QUIZ BOOK ID MAPPINGS
// ============================================================================

const QUIZ_BOOK_MAP = {
  'ahora-instituciones': 'ahora-instituciones',
  'manual-transicion': 'manual-transicion',
  'dialogos-maquina': 'dialogos-maquina',
  'toolkit-transicion': 'toolkit-transicion',
  'educar-nuevo-ser': 'educar-nuevo-ser',
  'tierra-que-despierta': 'tierra-que-despierta',
  'codigo-despertar': 'codigo-despertar',
  'practicas-radicales': 'practicas-radicales',
  'manifiesto-conciencia': 'manifiesto-conciencia',
  'filosofia-nuevo-ser': 'filosofia-nuevo-ser',
  'guia-acciones': 'guia-acciones'
};

// ============================================================================
// INSTITUTIONS SERVICE
// ============================================================================

class InstitutionsService {
  constructor() {
    this.institutions = {};
    this.builtInstitutions = [];
    this.institutionProgress = {};
    this.initialized = false;
  }

  /**
   * Inicializa el servicio de instituciones
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Cargar progreso guardado
      const saved = await AsyncStorage.getItem('institutions_progress');
      if (saved) {
        const data = JSON.parse(saved);
        this.builtInstitutions = data.builtInstitutions || [];
        this.institutionProgress = data.institutionProgress || {};
      }

      // Inicializar todas las instituciones
      this.institutions = { ...INSTITUTIONS };

      this.initialized = true;
      logger.info('[InstitutionsService] Inicializado', {
        totalInstitutions: Object.keys(this.institutions).length,
        built: this.builtInstitutions.length
      });

      return {
        success: true,
        institutions: this.getAllInstitutions(),
        built: this.builtInstitutions
      };
    } catch (error) {
      logger.error('[InstitutionsService] Error al inicializar:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene todas las instituciones con su estado
   */
  getAllInstitutions() {
    return Object.values(this.institutions).map(inst => ({
      ...inst,
      isBuilt: this.builtInstitutions.includes(inst.id),
      currentLevel: this.institutionProgress[inst.id]?.level || 0,
      progress: this.institutionProgress[inst.id] || null
    }));
  }

  /**
   * Obtiene una institución por ID
   */
  getInstitution(institutionId) {
    const institution = this.institutions[institutionId];
    if (!institution) return null;

    return {
      ...institution,
      isBuilt: this.builtInstitutions.includes(institutionId),
      currentLevel: this.institutionProgress[institutionId]?.level || 0,
      progress: this.institutionProgress[institutionId] || null
    };
  }

  /**
   * Verifica si el jugador puede construir una institución
   */
  canBuild(institutionId, gameState) {
    const institution = this.institutions[institutionId];
    if (!institution) {
      return { canBuild: false, reason: 'Institución no encontrada' };
    }

    if (this.builtInstitutions.includes(institutionId)) {
      return { canBuild: false, reason: 'Ya está construida' };
    }

    const reqs = institution.requirements;
    const missing = [];

    // Verificar nivel
    if (gameState.level < reqs.minLevel) {
      missing.push(`Nivel ${reqs.minLevel} requerido (tienes ${gameState.level})`);
    }

    // Verificar quizzes aprobados
    const completedQuizzes = gameState.completedQuizzes || [];
    const missingQuizzes = reqs.quizzes.filter(q => !completedQuizzes.includes(q));
    if (missingQuizzes.length > 0) {
      missing.push(`Quizzes pendientes: ${missingQuizzes.join(', ')}`);
    }

    // Verificar recursos
    const resources = gameState.resources || {};
    if (resources.wisdomFragments < (reqs.resources.wisdomFragments || 0)) {
      missing.push(`Fragmentos de Sabiduría: ${resources.wisdomFragments || 0}/${reqs.resources.wisdomFragments}`);
    }

    // Verificar seres despertados
    const awakenedCount = gameState.awakenedBeings?.length || 0;
    if (awakenedCount < (reqs.resources.awakenedBeings || 0)) {
      missing.push(`Seres despertados: ${awakenedCount}/${reqs.resources.awakenedBeings}`);
    }

    // Verificar índice de consciencia
    const consciousnessIndex = gameState.globalConsciousness || 0;
    if (consciousnessIndex < (reqs.resources.consciousnessIndex || 0)) {
      missing.push(`Consciencia Global: ${consciousnessIndex}%/${reqs.resources.consciousnessIndex}%`);
    }

    // Verificar guardián transformado si es requerido
    if (reqs.guardianTransformed) {
      const transformedGuardians = gameState.transformedGuardians || [];
      if (!transformedGuardians.includes(reqs.guardianTransformed)) {
        missing.push(`Requiere transformar a ${reqs.guardianTransformed}`);
      }
    }

    return {
      canBuild: missing.length === 0,
      missing,
      requirements: reqs,
      currentState: {
        level: gameState.level,
        quizzes: completedQuizzes.length,
        wisdom: resources.wisdomFragments || 0,
        beings: awakenedCount,
        consciousness: consciousnessIndex
      }
    };
  }

  /**
   * Construye una institución
   */
  async build(institutionId, gameState) {
    const checkResult = this.canBuild(institutionId, gameState);

    if (!checkResult.canBuild) {
      return {
        success: false,
        reason: 'No se cumplen los requisitos',
        missing: checkResult.missing
      };
    }

    const institution = this.institutions[institutionId];

    // Consumir recursos
    const resourceCost = institution.requirements.resources;

    // Agregar a instituciones construidas
    this.builtInstitutions.push(institutionId);

    // Inicializar progreso
    this.institutionProgress[institutionId] = {
      level: 1,
      builtAt: Date.now(),
      totalGenerated: 0,
      lastCollection: Date.now()
    };

    // Guardar progreso
    await this._saveProgress();

    logger.info('[InstitutionsService] Institución construida:', {
      id: institutionId,
      name: institution.name
    });

    return {
      success: true,
      institution: this.getInstitution(institutionId),
      resourceCost,
      benefits: institution.benefits,
      message: `¡${institution.name} ha sido construida! ${institution.lore}`
    };
  }

  /**
   * Mejora una institución al siguiente nivel
   */
  async upgrade(institutionId, gameState) {
    if (!this.builtInstitutions.includes(institutionId)) {
      return { success: false, reason: 'La institución no está construida' };
    }

    const institution = this.institutions[institutionId];
    const currentProgress = this.institutionProgress[institutionId];
    const currentLevel = currentProgress?.level || 1;
    const nextLevel = currentLevel + 1;

    if (nextLevel > 4) {
      return { success: false, reason: 'Nivel máximo alcanzado' };
    }

    const levelData = institution.levels[nextLevel];
    const cost = levelData.cost || 0;

    if ((gameState.resources?.wisdomFragments || 0) < cost) {
      return {
        success: false,
        reason: `Fragmentos insuficientes: ${gameState.resources?.wisdomFragments || 0}/${cost}`
      };
    }

    // Actualizar nivel
    this.institutionProgress[institutionId].level = nextLevel;
    this.institutionProgress[institutionId].upgradedAt = Date.now();

    await this._saveProgress();

    logger.info('[InstitutionsService] Institución mejorada:', {
      id: institutionId,
      newLevel: nextLevel,
      name: levelData.name
    });

    return {
      success: true,
      institution: this.getInstitution(institutionId),
      newLevel: nextLevel,
      newName: levelData.name,
      newBonus: levelData.bonus,
      cost,
      message: `¡${institution.shortName} ahora es ${levelData.name}!`
    };
  }

  /**
   * Recolecta recursos generados por las instituciones
   */
  async collectResources() {
    const now = Date.now();
    const collected = {
      wisdomFragments: 0,
      connections: 0,
      awakenedBeings: 0,
      healingEnergy: 0,
      consciousness: 0,
      influence: 0,
      careEnergy: 0
    };

    for (const instId of this.builtInstitutions) {
      const institution = this.institutions[instId];
      const progress = this.institutionProgress[instId];

      if (!progress) continue;

      const lastCollection = progress.lastCollection || progress.builtAt;
      const timePassed = now - lastCollection;
      const daysPassed = timePassed / (1000 * 60 * 60 * 24);

      const gen = institution.benefits.resourceGeneration;
      const levelBonus = institution.levels[progress.level]?.bonus || 1.0;

      let multiplier = 0;
      if (gen.interval === 'daily') {
        multiplier = Math.floor(daysPassed);
      } else if (gen.interval === 'weekly') {
        multiplier = Math.floor(daysPassed / 7);
      }

      if (multiplier > 0) {
        const amount = Math.floor(gen.amount * multiplier * levelBonus);
        collected[gen.type] = (collected[gen.type] || 0) + amount;

        progress.totalGenerated = (progress.totalGenerated || 0) + amount;
        progress.lastCollection = now;
      }
    }

    await this._saveProgress();

    // Filtrar recursos con valor > 0
    const actualCollected = Object.entries(collected)
      .filter(([_, v]) => v > 0)
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

    return {
      success: true,
      collected: actualCollected,
      hasResources: Object.keys(actualCollected).length > 0
    };
  }

  /**
   * Calcula el bonus total contra un guardián
   */
  getGuardianBonus(guardianId) {
    let totalBonus = 0;

    for (const instId of this.builtInstitutions) {
      const institution = this.institutions[instId];
      if (institution.counters.includes(guardianId)) {
        const level = this.institutionProgress[instId]?.level || 1;
        const levelBonus = institution.levels[level]?.bonus || 1.0;
        totalBonus += institution.counterBonus * levelBonus;
      }
    }

    return {
      bonus: totalBonus,
      institutions: this.builtInstitutions
        .filter(id => this.institutions[id].counters.includes(guardianId))
        .map(id => ({
          id,
          name: this.institutions[id].name,
          bonus: this.institutions[id].counterBonus
        }))
    };
  }

  /**
   * Calcula el bonus total a la consciencia global
   */
  getConsciousnessBonus() {
    let totalBonus = 0;

    for (const instId of this.builtInstitutions) {
      const institution = this.institutions[instId];
      const level = this.institutionProgress[instId]?.level || 1;
      const levelBonus = institution.levels[level]?.bonus || 1.0;
      totalBonus += (institution.benefits.globalConsciousnessBonus || 0) * levelBonus;
    }

    return totalBonus;
  }

  /**
   * Obtiene todas las habilidades desbloqueadas
   */
  getUnlockedAbilities() {
    const abilities = [];

    for (const instId of this.builtInstitutions) {
      const institution = this.institutions[instId];
      abilities.push(...(institution.benefits.unlocks || []));
    }

    return abilities;
  }

  /**
   * Obtiene estadísticas generales
   */
  getStats() {
    const total = Object.keys(this.institutions).length;
    const built = this.builtInstitutions.length;

    let totalLevel = 0;
    let maxLevel = 0;

    for (const instId of this.builtInstitutions) {
      const level = this.institutionProgress[instId]?.level || 1;
      totalLevel += level;
      if (level > maxLevel) maxLevel = level;
    }

    return {
      total,
      built,
      remaining: total - built,
      percentage: Math.round((built / total) * 100),
      averageLevel: built > 0 ? Math.round(totalLevel / built * 10) / 10 : 0,
      maxLevel,
      consciousnessBonus: this.getConsciousnessBonus(),
      unlockedAbilities: this.getUnlockedAbilities().length
    };
  }

  /**
   * Obtiene instituciones que pueden construirse
   */
  getAvailableToBuild(gameState) {
    return Object.values(this.institutions)
      .filter(inst => !this.builtInstitutions.includes(inst.id))
      .map(inst => {
        const check = this.canBuild(inst.id, gameState);
        return {
          ...inst,
          canBuild: check.canBuild,
          missing: check.missing,
          currentState: check.currentState
        };
      })
      .sort((a, b) => {
        // Ordenar por: puede construir primero, luego por nivel requerido
        if (a.canBuild !== b.canBuild) return b.canBuild - a.canBuild;
        return a.requirements.minLevel - b.requirements.minLevel;
      });
  }

  /**
   * Guarda el progreso en storage
   */
  async _saveProgress() {
    try {
      await AsyncStorage.setItem('institutions_progress', JSON.stringify({
        builtInstitutions: this.builtInstitutions,
        institutionProgress: this.institutionProgress
      }));
    } catch (error) {
      logger.error('[InstitutionsService] Error guardando progreso:', error);
    }
  }

  /**
   * Resetea todo el progreso (para testing)
   */
  async reset() {
    this.builtInstitutions = [];
    this.institutionProgress = {};
    await AsyncStorage.removeItem('institutions_progress');
    logger.info('[InstitutionsService] Progreso reseteado');
    return { success: true };
  }
}

// Exportar instancia singleton
const institutionsService = new InstitutionsService();
export default institutionsService;

// También exportar la clase y datos para testing
export { InstitutionsService, INSTITUTIONS };
