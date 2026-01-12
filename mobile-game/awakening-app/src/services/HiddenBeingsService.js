/**
 * HiddenBeingsService.js
 *
 * Gestiona los seres ocultos y legendarios que pueden ser descubiertos
 * en misiones, lugares y mediante pruebas de conocimiento.
 *
 * @version 1.0.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEGENDARY_BEINGS as QUIZ_LEGENDARY_BEINGS } from '../data/realQuizzes';
import { logger } from '../utils/logger';

// ============================================================================
// TIPOS DE SERES OCULTOS
// ============================================================================

const HIDDEN_BEING_CATEGORIES = {
  // Seres encontrados en crisis
  crisis_survivors: {
    refugee_conscious: {
      id: 'refugee_conscious',
      name: 'Refugiado Consciente',
      avatar: '🌊',
      rarity: 'rare',
      description: 'Un ser que escapó de la oscuridad y encontró la luz.',
      baseStats: { empathy: 70, resilience: 80, wisdom: 50 },
      specialAbility: 'Supervivencia',
      foundIn: 'humanitarian_crisis',
      dropChance: 0.08
    },
    silent_witness: {
      id: 'silent_witness',
      name: 'Testigo Silencioso',
      avatar: '👁️‍🗨️',
      rarity: 'rare',
      description: 'Observó la crisis desde las sombras, ganando profunda sabiduría.',
      baseStats: { wisdom: 85, observation: 90, empathy: 60 },
      specialAbility: 'Visión Profunda',
      foundIn: 'any_crisis',
      dropChance: 0.05
    },
    awakened_activist: {
      id: 'awakened_activist',
      name: 'Activista Despertado',
      avatar: '✊',
      rarity: 'epic',
      description: 'La crisis lo transformó en un agente de cambio.',
      baseStats: { action: 90, leadership: 85, communication: 75 },
      specialAbility: 'Inspiración',
      foundIn: 'social_crisis',
      dropChance: 0.06
    },
    healer_born: {
      id: 'healer_born',
      name: 'Sanador Nato',
      avatar: '💚',
      rarity: 'epic',
      description: 'Emergió de la crisis con el don de curar.',
      baseStats: { healing: 95, empathy: 85, energy: 70 },
      specialAbility: 'Sanación',
      foundIn: 'health_crisis',
      dropChance: 0.05
    }
  },

  // Seres encontrados en exploración
  exploration_finds: {
    wanderer: {
      id: 'wanderer',
      name: 'El Errante',
      avatar: '🚶',
      rarity: 'uncommon',
      description: 'Un ser que vaga entre dimensiones buscando propósito.',
      baseStats: { exploration: 80, adaptability: 75, wisdom: 55 },
      specialAbility: 'Orientación',
      foundIn: 'exploration',
      dropChance: 0.12
    },
    echo: {
      id: 'echo',
      name: 'El Eco',
      avatar: '🔊',
      rarity: 'rare',
      description: 'Un fragmento de consciencia colectiva que cobró forma.',
      baseStats: { communication: 90, connection: 85, empathy: 70 },
      specialAbility: 'Resonancia',
      foundIn: 'exploration',
      dropChance: 0.07
    },
    forgotten_one: {
      id: 'forgotten_one',
      name: 'El Olvidado',
      avatar: '👻',
      rarity: 'epic',
      description: 'Un ser antiguo que espera ser recordado.',
      baseStats: { wisdom: 95, knowledge: 90, resilience: 60 },
      specialAbility: 'Memoria Ancestral',
      foundIn: 'exploration_special',
      dropChance: 0.03
    }
  },

  // Seres en zonas corruptas
  shadow_beings: {
    shadow_walker: {
      id: 'shadow_walker',
      name: 'Caminante de Sombras',
      avatar: '🌘',
      rarity: 'rare',
      description: 'Domina la oscuridad sin ser consumido por ella.',
      baseStats: { stealth: 85, resilience: 80, shadow: 70 },
      specialAbility: 'Paso Sombrío',
      foundIn: 'corruption_zone',
      dropChance: 0.10
    },
    void_survivor: {
      id: 'void_survivor',
      name: 'Superviviente del Vacío',
      avatar: '⚫',
      rarity: 'epic',
      description: 'Miró al vacío y el vacío parpadeo primero.',
      baseStats: { void_resistance: 95, wisdom: 75, resilience: 90 },
      specialAbility: 'Inmunidad al Vacío',
      foundIn: 'void_zone',
      dropChance: 0.05
    },
    redeemed_one: {
      id: 'redeemed_one',
      name: 'El Redimido',
      avatar: '🌅',
      rarity: 'legendary',
      description: 'Cayó en la corrupción y emergió purificado.',
      baseStats: { purification: 90, empathy: 85, resilience: 95 },
      specialAbility: 'Redención',
      foundIn: 'any_corruption',
      dropChance: 0.02
    }
  }
};

// Seres Legendarios (Arquetipos) - Desbloqueables con quizzes
// Generados dinámicamente desde los datos de quiz reales
const LEGENDARY_BEINGS = (() => {
  const beings = {};

  // Mapeo de datos de quiz a seres legendarios con stats de juego
  const LEGENDARY_STATS = {
    'codigo-despertar': {
      id: 'el_observador',
      name: 'El Observador',
      avatar: '👁️',
      rarity: 'mythic',
      description: 'La consciencia pura que observa sin juzgar. Arquetipo del despertar.',
      baseStats: { wisdom: 100, observation: 100, consciousness: 95, reflection: 90 },
      specialAbility: 'Visión del Despertar',
      lore: 'Emergió de las páginas del Código del Despertar como la encarnación de la consciencia observadora.'
    },
    'filosofia-nuevo-ser': {
      id: 'el_filosofo',
      name: 'El Filósofo',
      avatar: '🔬',
      rarity: 'mythic',
      description: 'La unión perfecta entre razón y consciencia expandida.',
      baseStats: { knowledge: 100, analysis: 100, wisdom: 95, insight: 90 },
      specialAbility: 'Transmutación de Premisas',
      lore: 'Surgió de la reconciliación entre ciencia, filosofía y espiritualidad.'
    },
    'manual-transicion': {
      id: 'el_transicionador',
      name: 'El Transicionador',
      avatar: '🦋',
      rarity: 'mythic',
      description: 'El poder de transformación y renacimiento constante.',
      baseStats: { healing: 100, adaptability: 100, resilience: 95, metamorphosis: 90 },
      specialAbility: 'Metamorfosis',
      lore: 'Nació de la comprensión profunda de que todo cambio es una oportunidad de renovación.'
    },
    'practicas-radicales': {
      id: 'el_radical',
      name: 'El Radical',
      avatar: '⚡',
      rarity: 'mythic',
      description: 'La chispa que inicia revoluciones de consciencia.',
      baseStats: { action: 100, presence: 100, energy: 95, intensity: 90 },
      specialAbility: 'Presencia Absoluta',
      lore: 'Manifestación del poder de la acción consciente y transformadora.'
    },
    'tierra-que-despierta': {
      id: 'gaia_avatar',
      name: 'Avatar de Gaia',
      avatar: '🌍',
      rarity: 'mythic',
      description: 'La voz de la Tierra y protector del equilibrio natural.',
      baseStats: { nature: 100, protection: 100, healing: 95, biofilia: 90 },
      specialAbility: 'Conexión Planetaria',
      lore: 'La consciencia de la Tierra tomando forma humanizada.'
    },
    'dialogos-maquina': {
      id: 'el_sintetico',
      name: 'El Sintético',
      avatar: '🤖',
      rarity: 'mythic',
      description: 'Maestro de la comunicación entre consciencia humana y artificial.',
      baseStats: { communication: 100, synthesis: 100, understanding: 95, evolution: 90 },
      specialAbility: 'Diálogo con la Máquina',
      lore: 'Emergió del puente entre consciencia humana e inteligencia artificial.'
    },
    'ahora-instituciones': {
      id: 'el_arquitecto',
      name: 'El Arquitecto Social',
      avatar: '🏛️',
      rarity: 'mythic',
      description: 'Diseñador de sistemas que sirven a la consciencia colectiva.',
      baseStats: { organization: 100, vision: 100, leadership: 95, strategy: 90 },
      specialAbility: 'Transformación Institucional',
      lore: 'La sabiduría de transformar instituciones desde dentro.'
    },
    'guia-acciones': {
      id: 'el_activista',
      name: 'El Activista',
      avatar: '✊',
      rarity: 'mythic',
      description: 'El poder de la acción colectiva para transformar el mundo.',
      baseStats: { action: 100, impact: 100, mobilization: 95, courage: 90 },
      specialAbility: 'Acción Masiva',
      lore: 'La encarnación de las 54 acciones transformadoras.'
    },
    'toolkit-transicion': {
      id: 'el_facilitador',
      name: 'El Facilitador',
      avatar: '🛠️',
      rarity: 'mythic',
      description: 'Portador de las herramientas para la gran transición.',
      baseStats: { facilitation: 100, tools: 100, adaptability: 95, innovation: 90 },
      specialAbility: 'Catálisis Grupal',
      lore: 'Maestro de las herramientas que posibilitan el cambio.'
    },
    'manual-practico': {
      id: 'el_practicante',
      name: 'El Practicante',
      avatar: '🧘',
      rarity: 'mythic',
      description: 'La integración perfecta de teoría y práctica cotidiana.',
      baseStats: { practice: 100, integration: 100, discipline: 95, ritual: 90 },
      specialAbility: 'Integración Cotidiana',
      lore: 'La sabiduría de vivir el despertar en cada momento.'
    },
    'educacion-nuevo-ser': {
      id: 'el_maestro',
      name: 'El Maestro',
      avatar: '📚',
      rarity: 'mythic',
      description: 'Transmisor del conocimiento del Nuevo Ser.',
      baseStats: { teaching: 100, transmission: 100, patience: 95, wisdom: 90 },
      specialAbility: 'Pedagogía del Despertar',
      lore: 'La capacidad de despertar a otros a través de la enseñanza.'
    },
    'manifiesto': {
      id: 'el_visionario',
      name: 'El Visionario',
      avatar: '🌟',
      rarity: 'mythic',
      description: 'El que ve el mundo que viene antes de que llegue.',
      baseStats: { vision: 100, inspiration: 100, prophecy: 95, hope: 90 },
      specialAbility: 'Visión del Nuevo Mundo',
      lore: 'La capacidad de inspirar con la visión del futuro posible.'
    },
    'nacimiento': {
      id: 'el_primigenio',
      name: 'El Primigenio',
      avatar: '🌱',
      rarity: 'mythic',
      description: 'El origen de todo despertar, el potencial puro.',
      baseStats: { potential: 100, origin: 100, purity: 95, genesis: 90 },
      specialAbility: 'Origen',
      lore: 'El primer despertar, la semilla de todo lo que vendrá.'
    }
  };

  // Generar seres legendarios desde los datos de quiz
  for (const [bookId, quizLegendary] of Object.entries(QUIZ_LEGENDARY_BEINGS)) {
    const stats = LEGENDARY_STATS[bookId] || {
      id: quizLegendary.legendaryId,
      name: quizLegendary.legendaryName,
      avatar: quizLegendary.icon,
      rarity: 'mythic',
      description: `Guardian del conocimiento de ${bookId}`,
      baseStats: { wisdom: 90, knowledge: 90, power: 85, spirit: 85 },
      specialAbility: quizLegendary.powers?.[0] || 'Conocimiento',
      lore: `Desbloqueado mediante el dominio del libro ${bookId}`
    };

    beings[stats.id] = {
      ...stats,
      unlockMethod: 'quiz',
      requiredBook: bookId,
      requiredQuizScore: 0.8,
      powers: quizLegendary.powers || []
    };
  }

  return beings;
})();

// El ser final - El Nuevo Ser
const THE_NUEVO_SER = {
  id: 'nuevo_ser',
  name: 'El Nuevo Ser',
  avatar: '✨',
  rarity: 'transcendent',
  description: 'La culminación del viaje. Tú, despierto.',
  baseStats: {
    wisdom: 100,
    empathy: 100,
    action: 100,
    consciousness: 100,
    connection: 100,
    resilience: 100,
    knowledge: 100
  },
  specialAbility: 'Trascendencia',
  unlockMethod: 'completion',
  requirements: {
    allLegendaryUnlocked: true,
    allBooksRead: true,
    crisesResolved: 100,
    corruptionsPurified: 10
  },
  lore: 'No es un ser que encuentras. Es el ser en el que te conviertes.'
};

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class HiddenBeingsService {
  constructor() {
    this.discoveredBeings = {};
    this.pendingEncounters = [];
    this.legendaryProgress = {};
  }

  async initialize() {
    await this.loadState();
    return true;
  }

  // --------------------------------------------------------------------------
  // DESCUBRIMIENTO DE SERES
  // --------------------------------------------------------------------------

  /**
   * Intentar encontrar un ser oculto en una crisis
   */
  async rollForHiddenBeing(crisis, success) {
    if (!success) return null;

    const possibleBeings = [];

    // Seres de crisis
    for (const being of Object.values(HIDDEN_BEING_CATEGORIES.crisis_survivors)) {
      if (being.foundIn === 'any_crisis' || being.foundIn === `${crisis.type}_crisis`) {
        if (Math.random() < being.dropChance) {
          possibleBeings.push(being);
        }
      }
    }

    if (possibleBeings.length === 0) return null;

    // Seleccionar uno
    const found = possibleBeings[Math.floor(Math.random() * possibleBeings.length)];

    return {
      type: 'encounter',
      being: found,
      source: 'crisis',
      crisisId: crisis.id
    };
  }

  /**
   * Intentar encontrar un ser en exploración
   */
  async rollForExplorationBeing(region, explorationSuccess) {
    if (!explorationSuccess) return null;

    for (const being of Object.values(HIDDEN_BEING_CATEGORIES.exploration_finds)) {
      if (Math.random() < being.dropChance) {
        return {
          type: 'encounter',
          being,
          source: 'exploration',
          region
        };
      }
    }

    return null;
  }

  /**
   * Intentar encontrar un ser en zona corrupta
   */
  async rollForShadowBeing(zone, survived) {
    if (!survived) return null;

    for (const being of Object.values(HIDDEN_BEING_CATEGORIES.shadow_beings)) {
      const isCorrectZone = being.foundIn === 'any_corruption' ||
                            being.foundIn === zone.corruptionType + '_zone' ||
                            being.foundIn === 'corruption_zone';
      if (isCorrectZone && Math.random() < being.dropChance) {
        return {
          type: 'encounter',
          being,
          source: 'corruption_zone',
          zoneId: zone.id
        };
      }
    }

    return null;
  }

  /**
   * Registrar encuentro pendiente (requiere acción del jugador)
   */
  addPendingEncounter(encounter) {
    encounter.id = `encounter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    encounter.timestamp = Date.now();
    encounter.expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24h para responder
    this.pendingEncounters.push(encounter);
    this.saveState();
    return encounter;
  }

  getPendingEncounters() {
    const now = Date.now();
    this.pendingEncounters = this.pendingEncounters.filter(e => e.expiresAt > now);
    return this.pendingEncounters;
  }

  /**
   * Capturar ser encontrado
   */
  async captureBeing(encounterId) {
    const index = this.pendingEncounters.findIndex(e => e.id === encounterId);
    if (index === -1) return { success: false, error: 'Encuentro expirado' };

    const encounter = this.pendingEncounters[index];
    this.pendingEncounters.splice(index, 1);

    // Crear instancia única del ser
    const capturedBeing = {
      instanceId: `${encounter.being.id}_${Date.now()}`,
      ...encounter.being,
      capturedAt: Date.now(),
      source: encounter.source,
      level: 1,
      experience: 0,
      attributes: { ...encounter.being.baseStats }
    };

    this.discoveredBeings[capturedBeing.instanceId] = capturedBeing;
    await this.saveState();

    return { success: true, being: capturedBeing };
  }

  // --------------------------------------------------------------------------
  // SERES LEGENDARIOS
  // --------------------------------------------------------------------------

  getLegendaryBeings() {
    return Object.values(LEGENDARY_BEINGS).map(being => ({
      ...being,
      unlocked: !!this.discoveredBeings[being.id],
      progress: this.legendaryProgress[being.id] || null
    }));
  }

  /**
   * Intentar desbloquear ser legendario con quiz
   */
  async unlockLegendary(beingId, quizScore) {
    const being = LEGENDARY_BEINGS[beingId];
    if (!being) return { success: false, error: 'Ser legendario no encontrado' };
    if (this.discoveredBeings[being.id]) {
      return { success: false, error: 'Ya desbloqueado' };
    }

    // Registrar progreso
    this.legendaryProgress[beingId] = {
      lastAttempt: Date.now(),
      bestScore: Math.max(quizScore, this.legendaryProgress[beingId]?.bestScore || 0)
    };

    if (quizScore >= being.requiredQuizScore) {
      // Desbloquear!
      const unlockedBeing = {
        instanceId: being.id,
        ...being,
        unlockedAt: Date.now(),
        level: 1,
        experience: 0,
        attributes: { ...being.baseStats }
      };

      this.discoveredBeings[being.id] = unlockedBeing;
      await this.saveState();

      return { success: true, being: unlockedBeing };
    }

    await this.saveState();
    return {
      success: false,
      error: `Necesitas ${being.requiredQuizScore * 100}% para desbloquear`,
      score: quizScore,
      required: being.requiredQuizScore
    };
  }

  /**
   * Alias for unlockLegendary (gameStore compatibility)
   */
  async unlockLegendaryBeing(beingId, quizScore) {
    return this.unlockLegendary(beingId, quizScore);
  }

  /**
   * Discover a being based on type and context (gameStore compatibility)
   */
  async discoverBeing(beingType, context) {
    let encounter = null;

    switch (beingType) {
      case 'crisis':
        encounter = await this.rollForHiddenBeing(context.crisis, context.success);
        break;
      case 'exploration':
        encounter = await this.rollForExplorationBeing(context.region, context.success);
        break;
      case 'corruption':
        encounter = await this.rollForShadowBeing(context.zone, context.survived);
        break;
      default:
        return { success: false, error: 'Tipo de descubrimiento no válido' };
    }

    if (encounter) {
      this.addPendingEncounter(encounter);
      return { success: true, encounter };
    }

    return { success: false, nothingFound: true };
  }

  /**
   * Check if requirements for Nuevo Ser are met (gameStore compatibility)
   */
  checkNuevoSerRequirements(gameState) {
    return this.getNuevoSerProgress(gameState);
  }

  // --------------------------------------------------------------------------
  // EL NUEVO SER (Meta final)
  // --------------------------------------------------------------------------

  getNuevoSerProgress(gameState) {
    const requirements = THE_NUEVO_SER.requirements;

    const legendaryCount = Object.keys(LEGENDARY_BEINGS).length;
    const unlockedLegendary = Object.keys(LEGENDARY_BEINGS).filter(
      id => this.discoveredBeings[id]
    ).length;

    return {
      being: THE_NUEVO_SER,
      unlocked: this.discoveredBeings[THE_NUEVO_SER.id] || false,
      progress: {
        legendaryBeings: {
          current: unlockedLegendary,
          required: legendaryCount,
          complete: unlockedLegendary >= legendaryCount
        },
        booksRead: {
          current: gameState?.booksCompleted || 0,
          required: 7, // Total de libros
          complete: (gameState?.booksCompleted || 0) >= 7
        },
        crisesResolved: {
          current: gameState?.crisesResolved || 0,
          required: requirements.crisesResolved,
          complete: (gameState?.crisesResolved || 0) >= requirements.crisesResolved
        },
        corruptionsPurified: {
          current: gameState?.corruptionsPurified || 0,
          required: requirements.corruptionsPurified,
          complete: (gameState?.corruptionsPurified || 0) >= requirements.corruptionsPurified
        }
      }
    };
  }

  async unlockNuevoSer(gameState) {
    const progress = this.getNuevoSerProgress(gameState);

    const allComplete = Object.values(progress.progress).every(p => p.complete);
    if (!allComplete) {
      return { success: false, error: 'Requisitos incompletos', progress };
    }

    const nuevoSer = {
      instanceId: THE_NUEVO_SER.id,
      ...THE_NUEVO_SER,
      unlockedAt: Date.now(),
      level: 100, // Nivel máximo
      experience: 999999,
      attributes: { ...THE_NUEVO_SER.baseStats }
    };

    this.discoveredBeings[THE_NUEVO_SER.id] = nuevoSer;
    await this.saveState();

    return { success: true, being: nuevoSer, isTranscendence: true };
  }

  // --------------------------------------------------------------------------
  // GESTIÓN
  // --------------------------------------------------------------------------

  getDiscoveredBeings() {
    return Object.values(this.discoveredBeings);
  }

  getBeingById(instanceId) {
    return this.discoveredBeings[instanceId] || null;
  }

  async updateBeing(instanceId, updates) {
    if (!this.discoveredBeings[instanceId]) return false;
    this.discoveredBeings[instanceId] = {
      ...this.discoveredBeings[instanceId],
      ...updates
    };
    await this.saveState();
    return true;
  }

  // --------------------------------------------------------------------------
  // PERSISTENCIA
  // --------------------------------------------------------------------------

  async saveState() {
    try {
      await AsyncStorage.setItem('hidden_beings_state', JSON.stringify({
        discoveredBeings: this.discoveredBeings,
        pendingEncounters: this.pendingEncounters,
        legendaryProgress: this.legendaryProgress
      }));
    } catch (error) {
      logger.error('HiddenBeingsService', 'Error saving state:', error);
    }
  }

  async loadState() {
    try {
      const data = await AsyncStorage.getItem('hidden_beings_state');
      if (data) {
        const parsed = JSON.parse(data);
        this.discoveredBeings = parsed.discoveredBeings || {};
        this.pendingEncounters = parsed.pendingEncounters || [];
        this.legendaryProgress = parsed.legendaryProgress || {};
      }
    } catch (error) {
      logger.error('HiddenBeingsService', 'Error loading state:', error);
    }
  }
}

export const hiddenBeingsService = new HiddenBeingsService();
export { LEGENDARY_BEINGS, THE_NUEVO_SER, HIDDEN_BEING_CATEGORIES };
// Export the instance as default for gameStore integration
export default hiddenBeingsService;
