/**
 * TransitionService - Ultimate Goal Tracking: La Gran Transición
 *
 * Tracks player progress toward the ultimate goal of the game:
 * transforming themselves into a "Nuevo Ser" and contributing
 * to the collective awakening of humanity.
 *
 * INTEGRA:
 * - Índice de Consciencia Global (0-100%)
 * - Comunicaciones de Gaia según nivel
 * - Progreso de Guardianes transformados
 * - Instituciones construidas
 * - Seres despertados y evolucionados
 *
 * @version 2.0.0 - Phase 4: Global Consciousness Integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

const TRANSITION_STORAGE_KEY = '@awakening_transition_progress';

// ============================================================================
// COMUNICACIONES DE GAIA
// La Tierra habla al jugador según el nivel de consciencia global
// ============================================================================

const GAIA_COMMUNICATIONS = {
  // 0-15%: Silencio (estado inicial)
  dormant: {
    threshold: 0,
    messages: [
      { type: 'whisper', text: '...' },
      { type: 'dream', text: 'En lo profundo del sueño, algo se mueve.' }
    ]
  },

  // 15-25%: Primeras señales sutiles
  stirring: {
    threshold: 15,
    messages: [
      { type: 'intuition', text: 'Sientes una conexión sutil con algo más grande que tú.' },
      { type: 'synchronicity', text: 'Las coincidencias parecen guiarte hacia un propósito.' },
      { type: 'dream', text: 'Sueñas con raíces que conectan todo bajo la superficie.' }
    ],
    powers: ['Señales sutiles: sincronicidades en misiones']
  },

  // 25-40%: Gaia empieza a comunicarse
  awakening: {
    threshold: 25,
    messages: [
      { type: 'voice', text: 'Puedo sentirte ahora. Eres parte de mi despertar.' },
      { type: 'vision', text: 'Ves la red de vida que conecta todos los seres.' },
      { type: 'emotion', text: 'Una oleada de gratitud ancestral te envuelve.' },
      { type: 'guidance', text: 'Donde sientas resistencia, hay un guardián que teme la transformación.' }
    ],
    powers: ['Visión de conexiones: ves relaciones entre seres', 'Guía intuitiva: pistas en misiones']
  },

  // 40-55%: Comunicación clara
  connected: {
    threshold: 40,
    messages: [
      { type: 'teaching', text: 'Los guardianes no son enemigos. Son partes de mí que olvidaron quiénes eran.' },
      { type: 'revelation', text: 'Cada institución del Nuevo Ser es un órgano de mi nuevo cuerpo.' },
      { type: 'encouragement', text: 'Has hecho lo que pocos se atreven: mirar más allá del velo.' },
      { type: 'warning', text: 'El Viejo Ser no muere fácilmente. Se defenderá.' }
    ],
    powers: ['Recursos aparecen: bonus aleatorios', 'Aliados inesperados: NPCs ayudan']
  },

  // 55-70%: Ayuda activa
  flourishing: {
    threshold: 55,
    messages: [
      { type: 'empowerment', text: 'Mi fuerza fluye a través de ti. Úsala con sabiduría.' },
      { type: 'gratitude', text: 'Cada guardián transformado es una herida que sana.' },
      { type: 'prophecy', text: 'Veo posibilidades que antes estaban cerradas. Tú las abres.' },
      { type: 'unity', text: 'Ya no estás solo. Somos una red de despertares.' }
    ],
    powers: ['Regeneración pasiva: seres sanan solos', 'Protección parcial: menos daño de corrupción']
  },

  // 70-85%: Protección
  thriving: {
    threshold: 70,
    messages: [
      { type: 'celebration', text: '¡El punto de inflexión se acerca! Puedo sentirlo.' },
      { type: 'protection', text: 'Mis antiguos guardianes ahora te protegen como Instituciones del Nuevo Ser.' },
      { type: 'revelation', text: 'El Nuevo Ser no es un ser individual. Es lo que surge cuando todos despertamos.' },
      { type: 'preparation', text: 'Prepárate para llevar esto más allá del juego.' }
    ],
    powers: ['Inmunidad parcial: 25% menos daño en crisis', 'Bonus global: +15% a todas las acciones']
  },

  // 85-99%: Pre-integración
  transcending: {
    threshold: 85,
    messages: [
      { type: 'merging', text: 'La frontera entre tú y yo se difumina.' },
      { type: 'vision', text: 'Veo el mundo que viene. Es hermoso.' },
      { type: 'call', text: 'El juego te ha preparado. La realidad te espera.' },
      { type: 'blessing', text: 'Lleva este despertar contigo, más allá de la pantalla.' }
    ],
    powers: ['Inmunidad total a corrupción', 'Desafíos del Mundo Real desbloqueados']
  },

  // 100%: Integración completa
  awakened: {
    threshold: 100,
    messages: [
      { type: 'unity', text: 'Ya no hay "tú" y "yo". Somos el despertar mismo.' },
      { type: 'completion', text: 'La Gran Transición ha comenzado. No en el juego, sino en el mundo.' },
      { type: 'invitation', text: 'Ahora eres un Agente de la Transición. ¿Qué harás?' }
    ],
    powers: ['El Nuevo Ser desbloqueado', 'Modo Agente: acciones reales']
  }
};

class TransitionService {
  constructor() {
    this.transitionProgress = null;
  }

  /**
   * The Three Pillars of Transition
   */
  transitionPillars = {
    personal: {
      id: 'personal',
      name: 'Transformación Personal',
      description: 'Despertar tu propia consciencia y evolucionar como ser',
      icon: '🧘',
      milestones: [
        {
          id: 'first_awakening',
          name: 'Primer Despertar',
          description: 'Completa tu primera misión y despierta a un ser',
          requirement: { missionsCompleted: 1 },
          reward: { consciousness: 10, title: 'Iniciado' }
        },
        {
          id: 'library_seeker',
          name: 'Buscador de Conocimiento',
          description: 'Completa 3 quizzes de la biblioteca',
          requirement: { quizzesCompleted: 3 },
          reward: { wisdom: 15, title: 'Buscador' }
        },
        {
          id: 'meditation_practice',
          name: 'Práctica Contemplativa',
          description: 'Visita 5 santuarios diferentes',
          requirement: { sanctuariesVisited: 5 },
          reward: { consciousness: 20, title: 'Contemplativo' }
        },
        {
          id: 'shadow_work',
          name: 'Trabajo con la Sombra',
          description: 'Purifica a 3 seres corrompidos',
          requirement: { beingsPurified: 3 },
          reward: { empathy: 20, title: 'Sanador de Sombras' }
        },
        {
          id: 'evolution_master',
          name: 'Maestro de la Evolución',
          description: 'Evoluciona un ser hasta nivel de Maestría',
          requirement: { masteryBeings: 1 },
          reward: { allStats: 10, title: 'Maestro' }
        },
        {
          id: 'nuevo_ser_aspect',
          name: 'Aspecto del Nuevo Ser',
          description: 'Alcanza la evolución trascendente con un ser',
          requirement: { transcendentBeings: 1 },
          reward: { consciousness: 50, title: 'Trascendente' }
        }
      ]
    },
    collective: {
      id: 'collective',
      name: 'Despertar Colectivo',
      description: 'Contribuir al despertar de la humanidad',
      icon: '🌍',
      milestones: [
        {
          id: 'crisis_responder',
          name: 'Respondedor de Crisis',
          description: 'Completa 10 misiones de crisis global',
          requirement: { crisesResolved: 10 },
          reward: { action: 15, title: 'Respondedor' }
        },
        {
          id: 'being_awakener',
          name: 'Despertador de Seres',
          description: 'Despierta a 20 seres en total',
          requirement: { totalBeingsAwakened: 20 },
          reward: { empathy: 20, title: 'Despertador' }
        },
        {
          id: 'corruption_fighter',
          name: 'Luchador contra la Corrupción',
          description: 'Reduce la corrupción global en 3 zonas',
          requirement: { corruptionZonesCleansed: 3 },
          reward: { action: 25, title: 'Purificador' }
        },
        {
          id: 'network_builder',
          name: 'Constructor de Redes',
          description: 'Conecta 5 santuarios a través de seres',
          requirement: { sanctuariesConnected: 5 },
          reward: { connection: 30, title: 'Tejedor de Redes' }
        },
        {
          id: 'legendary_collector',
          name: 'Colector de Legendarios',
          description: 'Desbloquea a todos los seres legendarios',
          requirement: { legendaryBeingsUnlocked: 7 },
          reward: { wisdom: 40, title: 'Guardián del Conocimiento' }
        },
        {
          id: 'global_healer',
          name: 'Sanador Global',
          description: 'Alcanza 80% de consciencia global',
          requirement: { globalConsciousness: 80 },
          reward: { allStats: 20, title: 'Sanador del Mundo' }
        }
      ]
    },
    transcendent: {
      id: 'transcendent',
      name: 'Trascendencia',
      description: 'Ir más allá del juego hacia la acción real',
      icon: '✨',
      milestones: [
        {
          id: 'all_books_mastered',
          name: 'Todos los Libros Dominados',
          description: 'Completa todos los quizzes de la biblioteca con puntuación perfecta',
          requirement: { perfectQuizzes: 7 },
          reward: { wisdom: 50, title: 'Erudito' }
        },
        {
          id: 'world_explorer',
          name: 'Explorador del Mundo',
          description: 'Explora todas las regiones del mapa',
          requirement: { regionsExplored: 16 },
          reward: { discovery: 40, title: 'Explorador Global' }
        },
        {
          id: 'hidden_finder',
          name: 'Descubridor de lo Oculto',
          description: 'Encuentra a todos los seres ocultos',
          requirement: { hiddenBeingsFound: 15 },
          reward: { consciousness: 30, title: 'Vidente' }
        },
        {
          id: 'el_nuevo_ser',
          name: 'El Nuevo Ser',
          description: 'Desbloquea al Nuevo Ser - el ser definitivo',
          requirement: { nuevoSerUnlocked: true },
          reward: { transcendence: 100, title: 'El Nuevo Ser' }
        },
        {
          id: 'great_transition',
          name: 'La Gran Transición',
          description: 'Completa todos los hitos de todos los pilares',
          requirement: { allMilestonesCompleted: true },
          reward: {
            transcendence: 500,
            title: 'Agente de la Transición',
            unlocks: 'realWorldChallenges'
          }
        }
      ]
    }
  };

  /**
   * Real World Challenges - Unlocked after completing The Great Transition
   */
  realWorldChallenges = [
    {
      id: 'daily_meditation',
      name: 'Meditación Diaria',
      description: 'Practica 10 minutos de meditación real cada día',
      type: 'habit',
      duration: '30 días',
      guidance: 'Usa las técnicas de los ejercicios del libro'
    },
    {
      id: 'random_kindness',
      name: 'Bondad Aleatoria',
      description: 'Realiza un acto de bondad anónimo en el mundo real',
      type: 'action',
      guidance: 'Ayuda a alguien sin esperar nada a cambio'
    },
    {
      id: 'community_connection',
      name: 'Conexión Comunitaria',
      description: 'Únete o crea un grupo de transformación en tu comunidad',
      type: 'community',
      guidance: 'Comparte las ideas del Nuevo Ser con otros'
    },
    {
      id: 'conscious_consumption',
      name: 'Consumo Consciente',
      description: 'Evalúa y transforma tus hábitos de consumo',
      type: 'lifestyle',
      guidance: 'Aplica los principios de la Guía de Acciones'
    },
    {
      id: 'nature_reconnection',
      name: 'Reconexión con la Naturaleza',
      description: 'Pasa tiempo significativo en la naturaleza cada semana',
      type: 'habit',
      guidance: 'Practica la presencia como en La Tierra que Despierta'
    },
    {
      id: 'dialogue_practice',
      name: 'Práctica del Diálogo',
      description: 'Inicia conversaciones profundas sobre consciencia',
      type: 'communication',
      guidance: 'Usa las herramientas de Diálogos con la Máquina'
    },
    {
      id: 'institutional_action',
      name: 'Acción Institucional',
      description: 'Participa en mejorar una institución de tu entorno',
      type: 'action',
      guidance: 'Aplica el enfoque de Ahora: Instituciones'
    },
    {
      id: 'teach_others',
      name: 'Enseñar a Otros',
      description: 'Comparte lo aprendido con al menos 3 personas',
      type: 'teaching',
      guidance: 'Conviértete en un nodo de despertar'
    }
  ];

  /**
   * Initialize transition progress
   */
  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(TRANSITION_STORAGE_KEY);
      if (stored) {
        this.transitionProgress = JSON.parse(stored);
      } else {
        this.transitionProgress = this.createInitialProgress();
        await this.saveProgress();
      }
      return this.transitionProgress;
    } catch (error) {
      logger.error('TransitionService', 'Error initializing:', error);
      this.transitionProgress = this.createInitialProgress();
      return this.transitionProgress;
    }
  }

  /**
   * Create initial progress structure
   */
  createInitialProgress() {
    const progress = {
      currentTitle: 'Dormido',
      totalTranscendence: 0,
      globalConsciousnessContribution: 0,
      pillars: {},
      statistics: {
        missionsCompleted: 0,
        quizzesCompleted: 0,
        perfectQuizzes: 0,
        sanctuariesVisited: 0,
        beingsPurified: 0,
        masteryBeings: 0,
        transcendentBeings: 0,
        crisesResolved: 0,
        totalBeingsAwakened: 0,
        corruptionZonesCleansed: 0,
        sanctuariesConnected: 0,
        legendaryBeingsUnlocked: 0,
        globalConsciousness: 15, // Empieza en 15% (comunidades existentes)
        regionsExplored: 0,
        hiddenBeingsFound: 0,
        nuevoSerUnlocked: false,
        allMilestonesCompleted: false,
        // Nuevas estadísticas para Guardianes e Instituciones
        guardiansTransformed: 0,
        institutionsBuilt: 0,
        institutionsMaxLevel: 0,
        totalGuardianBattles: 0,
        guardianBattlesWon: 0
      },
      completedMilestones: [],
      realWorldChallengesUnlocked: false,
      realWorldChallengesProgress: {},
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Initialize pillar progress
    Object.keys(this.transitionPillars).forEach(pillarId => {
      progress.pillars[pillarId] = {
        completedMilestones: [],
        progress: 0
      };
    });

    return progress;
  }

  /**
   * Update a statistic and check milestones
   */
  async updateStatistic(statName, value, isIncrement = true) {
    if (!this.transitionProgress) await this.initialize();

    if (isIncrement) {
      if (typeof this.transitionProgress.statistics[statName] === 'number') {
        this.transitionProgress.statistics[statName] += value;
      } else if (typeof this.transitionProgress.statistics[statName] === 'boolean') {
        this.transitionProgress.statistics[statName] = value;
      }
    } else {
      this.transitionProgress.statistics[statName] = value;
    }

    this.transitionProgress.lastUpdated = new Date().toISOString();

    // Check for newly completed milestones
    const newlyCompleted = this.checkMilestones();

    await this.saveProgress();

    return {
      progress: this.transitionProgress,
      newlyCompletedMilestones: newlyCompleted
    };
  }

  /**
   * Check all milestones for completion
   */
  checkMilestones() {
    const newlyCompleted = [];
    const stats = this.transitionProgress.statistics;

    Object.entries(this.transitionPillars).forEach(([pillarId, pillar]) => {
      pillar.milestones.forEach(milestone => {
        // Skip if already completed
        if (this.transitionProgress.completedMilestones.includes(milestone.id)) {
          return;
        }

        // Check requirements
        let completed = true;
        Object.entries(milestone.requirement).forEach(([reqKey, reqValue]) => {
          if (reqKey === 'allMilestonesCompleted') {
            // Special check for final milestone
            const totalMilestones = Object.values(this.transitionPillars)
              .reduce((sum, p) => sum + p.milestones.length, 0) - 1; // Exclude this milestone
            completed = this.transitionProgress.completedMilestones.length >= totalMilestones;
          } else if (typeof reqValue === 'boolean') {
            completed = completed && stats[reqKey] === reqValue;
          } else {
            completed = completed && (stats[reqKey] || 0) >= reqValue;
          }
        });

        if (completed) {
          this.completeMilestone(pillarId, milestone);
          newlyCompleted.push({ pillarId, milestone });
        }
      });
    });

    return newlyCompleted;
  }

  /**
   * Complete a milestone and apply rewards
   */
  completeMilestone(pillarId, milestone) {
    if (!this.transitionProgress.completedMilestones.includes(milestone.id)) {
      this.transitionProgress.completedMilestones.push(milestone.id);
      this.transitionProgress.pillars[pillarId].completedMilestones.push(milestone.id);

      // Update pillar progress percentage
      const pillar = this.transitionPillars[pillarId];
      const completedCount = this.transitionProgress.pillars[pillarId].completedMilestones.length;
      this.transitionProgress.pillars[pillarId].progress =
        Math.round((completedCount / pillar.milestones.length) * 100);

      // Apply rewards
      if (milestone.reward.title) {
        this.transitionProgress.currentTitle = milestone.reward.title;
      }

      if (milestone.reward.transcendence) {
        this.transitionProgress.totalTranscendence += milestone.reward.transcendence;
      }

      // Check for real world challenges unlock
      if (milestone.reward.unlocks === 'realWorldChallenges') {
        this.transitionProgress.realWorldChallengesUnlocked = true;
      }

      logger.info('TransitionService', ` Milestone completed: ${milestone.name}`);
    }
  }

  /**
   * Get overall transition progress
   */
  getOverallProgress() {
    if (!this.transitionProgress) return 0;

    const totalMilestones = Object.values(this.transitionPillars)
      .reduce((sum, pillar) => sum + pillar.milestones.length, 0);

    return Math.round(
      (this.transitionProgress.completedMilestones.length / totalMilestones) * 100
    );
  }

  /**
   * Get detailed progress report
   */
  getProgressReport() {
    if (!this.transitionProgress) {
      return null;
    }

    const report = {
      currentTitle: this.transitionProgress.currentTitle,
      totalTranscendence: this.transitionProgress.totalTranscendence,
      overallProgress: this.getOverallProgress(),
      pillars: {},
      nextMilestones: [],
      realWorldChallengesUnlocked: this.transitionProgress.realWorldChallengesUnlocked
    };

    // Pillar details
    Object.entries(this.transitionPillars).forEach(([pillarId, pillar]) => {
      const pillarProgress = this.transitionProgress.pillars[pillarId];
      report.pillars[pillarId] = {
        name: pillar.name,
        icon: pillar.icon,
        description: pillar.description,
        progress: pillarProgress.progress,
        completedCount: pillarProgress.completedMilestones.length,
        totalCount: pillar.milestones.length
      };

      // Find next uncompleted milestone for this pillar
      const nextMilestone = pillar.milestones.find(
        m => !this.transitionProgress.completedMilestones.includes(m.id)
      );
      if (nextMilestone) {
        report.nextMilestones.push({
          pillarId,
          pillarIcon: pillar.icon,
          ...nextMilestone,
          currentProgress: this.getMilestoneProgress(nextMilestone)
        });
      }
    });

    return report;
  }

  /**
   * Get progress toward a specific milestone
   */
  getMilestoneProgress(milestone) {
    const stats = this.transitionProgress.statistics;
    const progress = {};

    Object.entries(milestone.requirement).forEach(([reqKey, reqValue]) => {
      if (reqKey === 'allMilestonesCompleted') {
        const totalMilestones = Object.values(this.transitionPillars)
          .reduce((sum, p) => sum + p.milestones.length, 0) - 1;
        progress[reqKey] = {
          current: this.transitionProgress.completedMilestones.length,
          required: totalMilestones,
          percentage: Math.round(
            (this.transitionProgress.completedMilestones.length / totalMilestones) * 100
          )
        };
      } else if (typeof reqValue === 'boolean') {
        progress[reqKey] = {
          current: stats[reqKey] ? 1 : 0,
          required: 1,
          percentage: stats[reqKey] ? 100 : 0
        };
      } else {
        progress[reqKey] = {
          current: stats[reqKey] || 0,
          required: reqValue,
          percentage: Math.min(100, Math.round(((stats[reqKey] || 0) / reqValue) * 100))
        };
      }
    });

    return progress;
  }

  /**
   * Get available real world challenges
   */
  getRealWorldChallenges() {
    if (!this.transitionProgress?.realWorldChallengesUnlocked) {
      return {
        unlocked: false,
        message: 'Completa La Gran Transición para desbloquear los desafíos del mundo real'
      };
    }

    return {
      unlocked: true,
      challenges: this.realWorldChallenges.map(challenge => ({
        ...challenge,
        status: this.transitionProgress.realWorldChallengesProgress[challenge.id] || 'not_started'
      }))
    };
  }

  /**
   * Update real world challenge progress
   */
  async updateRealWorldChallenge(challengeId, status) {
    if (!this.transitionProgress) await this.initialize();

    if (!this.transitionProgress.realWorldChallengesUnlocked) {
      return { success: false, message: 'Desafíos del mundo real no desbloqueados' };
    }

    this.transitionProgress.realWorldChallengesProgress[challengeId] = status;
    await this.saveProgress();

    return { success: true, status };
  }

  /**
   * Get transition story/narrative for current progress
   */
  getTransitionNarrative() {
    const progress = this.getOverallProgress();
    const title = this.transitionProgress?.currentTitle || 'Dormido';

    if (progress === 0) {
      return {
        title: 'El Comienzo',
        narrative: 'Tu viaje hacia el despertar está por comenzar. El mundo necesita seres conscientes que puedan ayudar en la Gran Transición. ¿Estás listo para despertar?',
        encouragement: 'Completa tu primera misión para dar el primer paso.'
      };
    } else if (progress < 25) {
      return {
        title: 'Primeros Pasos',
        narrative: `Como ${title}, has comenzado a ver más allá del velo de la inconsciencia. Cada ser que despiertas, cada crisis que resuelves, es un paso hacia la transformación global.`,
        encouragement: 'Sigue explorando y aprendiendo. El conocimiento es la llave.'
      };
    } else if (progress < 50) {
      return {
        title: 'Caminante del Despertar',
        narrative: `${title}, tu consciencia se expande. Has tocado tanto la luz de los santuarios como la oscuridad de las zonas de corrupción. Ambas son maestras en este camino.`,
        encouragement: 'Los seres legendarios guardan secretos ancestrales. Búscalos.'
      };
    } else if (progress < 75) {
      return {
        title: 'Guardián de la Transición',
        narrative: `${title}, te has convertido en un pilar de la transformación. Tu trabajo ha elevado la consciencia global. Los seres que has despertado forman una red de luz.`,
        encouragement: 'El Nuevo Ser espera a aquellos que completan el camino.'
      };
    } else if (progress < 100) {
      return {
        title: 'Al Borde de la Trascendencia',
        narrative: `${title}, estás cerca de completar La Gran Transición. Pocos han llegado tan lejos. El velo entre el juego y la realidad se adelgaza.`,
        encouragement: 'Los desafíos del mundo real te esperan. Prepárate para llevar esto más allá de la pantalla.'
      };
    } else {
      return {
        title: 'Agente de la Transición',
        narrative: `Has completado La Gran Transición. Pero este no es el final, es el verdadero comienzo. El juego te ha preparado para la acción real. El mundo necesita Agentes de la Transición - seres despiertos que actúen en la realidad.`,
        encouragement: 'Los desafíos del mundo real están desbloqueados. ¿Llevarás el despertar más allá de la pantalla?'
      };
    }
  }

  // =========================================================================
  // ÍNDICE DE CONSCIENCIA GLOBAL
  // =========================================================================

  /**
   * Calcula el Índice de Consciencia Global integrando todos los sistemas
   * Fórmula:
   * - Base: 15% (comunidades indígenas y proyectos existentes)
   * - Guardianes transformados: +10% cada uno (máx 70%)
   * - Instituciones construidas: +2% base + 0.5% por nivel (máx 21%)
   * - Quizzes completados: +0.5% cada uno (máx 6.5%)
   * - Seres legendarios: +1% cada uno (máx 13%)
   * Total máximo: ~125% (capped a 100%)
   */
  calculateGlobalConsciousness(gameState = {}) {
    let consciousness = 15; // Base

    // Guardianes transformados: +10% cada uno
    const guardiansTransformed = gameState.guardiansTransformed ||
      this.transitionProgress?.statistics?.guardiansTransformed || 0;
    consciousness += guardiansTransformed * 10;

    // Instituciones: +2% base + 0.5% por nivel adicional
    const institutionsBuilt = gameState.institutionsBuilt ||
      this.transitionProgress?.statistics?.institutionsBuilt || 0;
    const institutionLevels = gameState.totalInstitutionLevels || institutionsBuilt;
    consciousness += (institutionsBuilt * 2) + (institutionLevels * 0.5);

    // Quizzes completados: +0.5% cada uno
    const quizzesCompleted = gameState.quizzesCompleted ||
      this.transitionProgress?.statistics?.quizzesCompleted || 0;
    consciousness += quizzesCompleted * 0.5;

    // Seres legendarios: +1% cada uno
    const legendaryBeings = gameState.legendaryBeingsUnlocked ||
      this.transitionProgress?.statistics?.legendaryBeingsUnlocked || 0;
    consciousness += legendaryBeings * 1;

    // Seres despertados: +0.1% cada uno (máx +5%)
    const beingsAwakened = gameState.totalBeingsAwakened ||
      this.transitionProgress?.statistics?.totalBeingsAwakened || 0;
    consciousness += Math.min(beingsAwakened * 0.1, 5);

    // Crisis resueltas: +0.2% cada una (máx +5%)
    const crisesResolved = gameState.crisesResolved ||
      this.transitionProgress?.statistics?.crisesResolved || 0;
    consciousness += Math.min(crisesResolved * 0.2, 5);

    // Cap at 100%
    return Math.min(Math.round(consciousness * 10) / 10, 100);
  }

  /**
   * Actualiza el índice de consciencia global
   */
  async updateGlobalConsciousness(gameState = {}) {
    if (!this.transitionProgress) await this.initialize();

    const newConsciousness = this.calculateGlobalConsciousness(gameState);
    const oldConsciousness = this.transitionProgress.statistics.globalConsciousness;

    this.transitionProgress.statistics.globalConsciousness = newConsciousness;

    // Verificar si hubo cambio de nivel de Gaia
    const oldLevel = this.getGaiaLevel(oldConsciousness);
    const newLevel = this.getGaiaLevel(newConsciousness);

    let gaiaMessage = null;
    if (newLevel !== oldLevel) {
      gaiaMessage = this.getGaiaWelcomeMessage(newLevel);
    }

    await this.saveProgress();

    return {
      consciousness: newConsciousness,
      change: newConsciousness - oldConsciousness,
      gaiaLevel: newLevel,
      gaiaMessage,
      powers: GAIA_COMMUNICATIONS[newLevel]?.powers || []
    };
  }

  /**
   * Obtiene el nivel de conexión con Gaia basado en consciencia
   */
  getGaiaLevel(consciousness = null) {
    const level = consciousness ?? this.transitionProgress?.statistics?.globalConsciousness ?? 15;

    if (level >= 100) return 'awakened';
    if (level >= 85) return 'transcending';
    if (level >= 70) return 'thriving';
    if (level >= 55) return 'flourishing';
    if (level >= 40) return 'connected';
    if (level >= 25) return 'awakening';
    if (level >= 15) return 'stirring';
    return 'dormant';
  }

  /**
   * Obtiene una comunicación aleatoria de Gaia para el nivel actual
   */
  getGaiaMessage(specificType = null) {
    const level = this.getGaiaLevel();
    const levelData = GAIA_COMMUNICATIONS[level];

    if (!levelData?.messages?.length) {
      return null;
    }

    if (specificType) {
      const filtered = levelData.messages.filter(m => m.type === specificType);
      if (filtered.length > 0) {
        return filtered[Math.floor(Math.random() * filtered.length)];
      }
    }

    return levelData.messages[Math.floor(Math.random() * levelData.messages.length)];
  }

  /**
   * Obtiene mensaje de bienvenida al alcanzar nuevo nivel de Gaia
   */
  getGaiaWelcomeMessage(level) {
    const levelData = GAIA_COMMUNICATIONS[level];
    if (!levelData) return null;

    const welcomeMessages = {
      dormant: null,
      stirring: {
        type: 'milestone',
        text: 'Algo ha cambiado. La Tierra comienza a notarte.',
        powers: levelData.powers
      },
      awakening: {
        type: 'milestone',
        text: 'Gaia despierta contigo. Ahora puede guiarte.',
        powers: levelData.powers
      },
      connected: {
        type: 'milestone',
        text: 'La conexión se fortalece. Gaia te habla claramente.',
        powers: levelData.powers
      },
      flourishing: {
        type: 'milestone',
        text: 'Tu trabajo da frutos. Gaia te empodera.',
        powers: levelData.powers
      },
      thriving: {
        type: 'milestone',
        text: 'El punto de inflexión se acerca. Gaia te protege.',
        powers: levelData.powers
      },
      transcending: {
        type: 'milestone',
        text: 'La frontera entre juego y realidad se difumina.',
        powers: levelData.powers
      },
      awakened: {
        type: 'milestone',
        text: 'La Gran Transición está completa. Gaia ha despertado.',
        powers: levelData.powers
      }
    };

    return welcomeMessages[level];
  }

  /**
   * Obtiene estado completo de Gaia
   */
  getGaiaStatus() {
    const consciousness = this.transitionProgress?.statistics?.globalConsciousness ?? 15;
    const level = this.getGaiaLevel(consciousness);
    const levelData = GAIA_COMMUNICATIONS[level];

    // Calcular progreso hacia siguiente nivel
    const thresholds = Object.values(GAIA_COMMUNICATIONS)
      .map(l => l.threshold)
      .sort((a, b) => a - b);

    const currentThreshold = levelData.threshold;
    const nextThresholdIndex = thresholds.indexOf(currentThreshold) + 1;
    const nextThreshold = nextThresholdIndex < thresholds.length
      ? thresholds[nextThresholdIndex]
      : 100;

    const progressToNext = nextThreshold > currentThreshold
      ? Math.round(((consciousness - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
      : 100;

    return {
      consciousness,
      level,
      levelName: this.getGaiaLevelName(level),
      currentMessage: this.getGaiaMessage(),
      powers: levelData.powers || [],
      progressToNextLevel: progressToNext,
      nextLevelAt: nextThreshold,
      isAwakened: level === 'awakened'
    };
  }

  /**
   * Nombre amigable del nivel de Gaia
   */
  getGaiaLevelName(level) {
    const names = {
      dormant: 'Gaia Dormida',
      stirring: 'Primeras Señales',
      awakening: 'Gaia Despertando',
      connected: 'Conexión Establecida',
      flourishing: 'Gaia Floreciente',
      thriving: 'Gaia Próspera',
      transcending: 'Trascendencia',
      awakened: 'Gaia Despierta'
    };
    return names[level] || 'Desconocido';
  }

  /**
   * Save progress to storage
   */
  async saveProgress() {
    try {
      await AsyncStorage.setItem(
        TRANSITION_STORAGE_KEY,
        JSON.stringify(this.transitionProgress)
      );
    } catch (error) {
      logger.error('TransitionService', 'Error saving:', error);
    }
  }

  /**
   * Reset all progress (use with caution)
   */
  async resetProgress() {
    this.transitionProgress = this.createInitialProgress();
    await this.saveProgress();
    return this.transitionProgress;
  }
}

export default new TransitionService();
