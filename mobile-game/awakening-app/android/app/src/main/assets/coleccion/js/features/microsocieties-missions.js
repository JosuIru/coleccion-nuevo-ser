/**
 * SISTEMA DE MISIONES Y OBJETIVOS
 * Para dar estructura y progresión al juego
 */

class MissionSystem {
  constructor() {
    this.missions = this.createMissions();
    this.activeMissions = [];
    this.completedMissions = [];

    // Cargar progreso guardado
    this.loadProgress();
  }

  /**
   * Crear todas las misiones del juego
   */
  createMissions() {
    return [
      // ========== TUTORIAL ==========
      {
        id: 'tutorial-1',
        name: 'Primeros Pasos',
        description: 'Crea tu primera microsociedad',
        category: 'tutorial',
        difficulty: 'beginner',
        objectives: [
          { type: 'create_society', count: 1, current: 0 }
        ],
        rewards: {
          xp: 50,
          unlocks: ['tutorial-2']
        },
        tips: 'Selecciona piezas de conocimiento en el Laboratorio Frankenstein y crea un ser viable para comenzar.'
      },
      {
        id: 'tutorial-2',
        name: 'Primeros Turnos',
        description: 'Sobrevive 5 turnos',
        category: 'tutorial',
        difficulty: 'beginner',
        objectives: [
          { type: 'survive_turns', turns: 5, current: 0 }
        ],
        rewards: {
          xp: 100,
          unlocks: ['tutorial-3', 'speed-2x']
        },
        tips: 'Dale a ▶️ Iniciar y observa cómo tu sociedad responde a los eventos.'
      },
      {
        id: 'tutorial-3',
        name: 'Primera Generación',
        description: 'Crea un ser de generación 2',
        category: 'tutorial',
        difficulty: 'beginner',
        objectives: [
          { type: 'reach_generation', generation: 2, current: 0 }
        ],
        rewards: {
          xp: 150,
          unlocks: ['survival-10']
        },
        tips: 'La hibridación ocurre cada 10 turnos. Los mejores seres se reproducen automáticamente.'
      },

      // ========== SUPERVIVENCIA ==========
      {
        id: 'survival-10',
        name: 'Resistencia Básica',
        description: 'Sobrevive 10 turnos sin colapsar',
        category: 'survival',
        difficulty: 'easy',
        objectives: [
          { type: 'survive_turns', turns: 10, current: 0 }
        ],
        rewards: {
          xp: 200,
          unlocks: ['survival-25', 'knowledge-50']
        }
      },
      {
        id: 'survival-25',
        name: 'Superviviente',
        description: 'Sobrevive 25 turnos',
        category: 'survival',
        difficulty: 'medium',
        objectives: [
          { type: 'survive_turns', turns: 25, current: 0 }
        ],
        rewards: {
          xp: 500,
          unlocks: ['survival-50', 'speed-5x']
        }
      },
      {
        id: 'survival-50',
        name: 'Sociedad Resiliente',
        description: 'Sobrevive 50 turnos',
        category: 'survival',
        difficulty: 'hard',
        objectives: [
          { type: 'survive_turns', turns: 50, current: 0 }
        ],
        rewards: {
          xp: 1000,
          unlocks: ['survival-100', 'intervention-blessing']
        }
      },
      {
        id: 'survival-100',
        name: 'Civilización Eterna',
        description: 'Sobrevive 100 turnos',
        category: 'survival',
        difficulty: 'expert',
        objectives: [
          { type: 'survive_turns', turns: 100, current: 0 }
        ],
        rewards: {
          xp: 2500,
          unlocks: ['speed-10x', 'sandbox-mode']
        }
      },

      // ========== MÉTRICAS ==========
      {
        id: 'knowledge-50',
        name: 'Sabiduría Emergente',
        description: 'Alcanza 50 de Conocimiento',
        category: 'metrics',
        difficulty: 'easy',
        objectives: [
          { type: 'reach_metric', metric: 'knowledge', value: 50, current: 0 }
        ],
        rewards: {
          xp: 150,
          unlocks: ['knowledge-80']
        }
      },
      {
        id: 'knowledge-80',
        name: 'Sabiduría Colectiva',
        description: 'Alcanza 80 de Conocimiento',
        category: 'metrics',
        difficulty: 'medium',
        objectives: [
          { type: 'reach_metric', metric: 'knowledge', value: 80, current: 0 }
        ],
        rewards: {
          xp: 400,
          unlocks: ['knowledge-100', 'event-wisdom']
        }
      },
      {
        id: 'knowledge-100',
        name: 'Iluminación Total',
        description: 'Alcanza 100 de Conocimiento',
        category: 'metrics',
        difficulty: 'hard',
        objectives: [
          { type: 'reach_metric', metric: 'knowledge', value: 100, current: 0 }
        ],
        rewards: {
          xp: 800,
          unlocks: ['intervention-inspire']
        }
      },
      {
        id: 'action-80',
        name: 'Movilización Masiva',
        description: 'Alcanza 80 de Acción',
        category: 'metrics',
        difficulty: 'medium',
        objectives: [
          { type: 'reach_metric', metric: 'action', value: 80, current: 0 }
        ],
        rewards: {
          xp: 400,
          unlocks: ['event-action']
        }
      },
      {
        id: 'cohesion-90',
        name: 'Unidad Inquebrantable',
        description: 'Alcanza 90 de Cohesión',
        category: 'metrics',
        difficulty: 'medium',
        objectives: [
          { type: 'reach_metric', metric: 'cohesion', value: 90, current: 0 }
        ],
        rewards: {
          xp: 400,
          unlocks: ['event-cohesion']
        }
      },
      {
        id: 'health-full',
        name: 'Vitalidad Perfecta',
        description: 'Mantén Salud en 100 por 10 turnos consecutivos',
        category: 'metrics',
        difficulty: 'hard',
        objectives: [
          { type: 'maintain_metric', metric: 'health', value: 100, turns: 10, current: 0 }
        ],
        rewards: {
          xp: 600,
          unlocks: ['intervention-blessing']
        }
      },

      // ========== EVOLUCIÓN ==========
      {
        id: 'generation-3',
        name: 'Tercera Generación',
        description: 'Crea un ser de generación 3',
        category: 'evolution',
        difficulty: 'medium',
        objectives: [
          { type: 'reach_generation', generation: 3, current: 0 }
        ],
        rewards: {
          xp: 300,
          unlocks: ['generation-5']
        }
      },
      {
        id: 'generation-5',
        name: 'Quinta Generación',
        description: 'Crea un ser de generación 5',
        category: 'evolution',
        difficulty: 'hard',
        objectives: [
          { type: 'reach_generation', generation: 5, current: 0 }
        ],
        rewards: {
          xp: 750,
          unlocks: ['generation-10', 'mutation-boost']
        }
      },
      {
        id: 'generation-10',
        name: 'Evolución Avanzada',
        description: 'Crea un ser de generación 10',
        category: 'evolution',
        difficulty: 'expert',
        objectives: [
          { type: 'reach_generation', generation: 10, current: 0 }
        ],
        rewards: {
          xp: 2000,
          unlocks: ['avatar-premium']
        }
      },
      {
        id: 'population-15',
        name: 'Sociedad Próspera',
        description: 'Alcanza 15 seres vivos simultáneamente',
        category: 'evolution',
        difficulty: 'medium',
        objectives: [
          { type: 'reach_population', count: 15, current: 0 }
        ],
        rewards: {
          xp: 500,
          unlocks: ['population-20']
        }
      },
      {
        id: 'population-20',
        name: 'Civilización Floreciente',
        description: 'Alcanza 20 seres vivos simultáneamente',
        category: 'evolution',
        difficulty: 'hard',
        objectives: [
          { type: 'reach_population', count: 20, current: 0 }
        ],
        rewards: {
          xp: 1000,
          unlocks: ['sandbox-unlimited-population']
        }
      },
      {
        id: 'fitness-90',
        name: 'Ser Supremo',
        description: 'Crea un ser con fitness 90+',
        category: 'evolution',
        difficulty: 'hard',
        objectives: [
          { type: 'reach_fitness', value: 90, current: 0 }
        ],
        rewards: {
          xp: 800,
          unlocks: ['intervention-evolve']
        }
      },

      // ========== EVENTOS ==========
      {
        id: 'events-success-5',
        name: 'Decisiones Acertadas',
        description: 'Resuelve exitosamente 5 eventos',
        category: 'events',
        difficulty: 'easy',
        objectives: [
          { type: 'successful_events', count: 5, current: 0 }
        ],
        rewards: {
          xp: 250,
          unlocks: ['events-success-10']
        }
      },
      {
        id: 'events-success-10',
        name: 'Estratega Competente',
        description: 'Resuelve exitosamente 10 eventos',
        category: 'events',
        difficulty: 'medium',
        objectives: [
          { type: 'successful_events', count: 10, current: 0 }
        ],
        rewards: {
          xp: 500,
          unlocks: ['events-success-25', 'event-custom-editor']
        }
      },
      {
        id: 'events-success-25',
        name: 'Maestro Estratega',
        description: 'Resuelve exitosamente 25 eventos',
        category: 'events',
        difficulty: 'hard',
        objectives: [
          { type: 'successful_events', count: 25, current: 0 }
        ],
        rewards: {
          xp: 1200,
          unlocks: ['events-premium-pack']
        }
      },
      {
        id: 'perfect-streak-5',
        name: 'Racha Perfecta',
        description: 'Resuelve 5 eventos exitosamente en fila',
        category: 'events',
        difficulty: 'hard',
        objectives: [
          { type: 'event_streak', count: 5, current: 0 }
        ],
        rewards: {
          xp: 600,
          unlocks: ['intervention-divine-guidance']
        }
      },

      // ========== DESAFÍOS ESPECIALES ==========
      {
        id: 'comeback-king',
        name: 'Resurrección',
        description: 'Recupera una sociedad con Salud < 20',
        category: 'special',
        difficulty: 'hard',
        objectives: [
          { type: 'comeback', from_health: 20, to_health: 80, current: 0 }
        ],
        rewards: {
          xp: 1000,
          unlocks: ['intervention-resurrection']
        }
      },
      {
        id: 'balanced-society',
        name: 'Equilibrio Perfecto',
        description: 'Todas las métricas entre 70-80 simultáneamente',
        category: 'special',
        difficulty: 'expert',
        objectives: [
          { type: 'balanced_metrics', min: 70, max: 80, current: 0 }
        ],
        rewards: {
          xp: 1500,
          unlocks: ['achievement-harmony']
        }
      },
      {
        id: 'phoenix',
        name: 'Ave Fénix',
        description: 'Sobrevive después de que todos menos 1 ser mueran',
        category: 'special',
        difficulty: 'expert',
        objectives: [
          { type: 'phoenix', min_population: 1, recover_to: 10, current: 0 }
        ],
        rewards: {
          xp: 2000,
          unlocks: ['achievement-phoenix']
        }
      },

      // ========== MODO HISTORIA (FASE 2) ==========
      {
        id: 'story-ch1',
        name: 'Capítulo 1: El Despertar',
        description: 'Completa el primer capítulo de la historia',
        category: 'story',
        difficulty: 'medium',
        requirements: ['tutorial-3'],
        objectives: [
          { type: 'complete_chapter', chapter: 1, current: 0 }
        ],
        rewards: {
          xp: 1000,
          unlocks: ['story-ch2']
        }
      },
      {
        id: 'story-ch2',
        name: 'Capítulo 2: La Prueba',
        description: 'Completa el segundo capítulo',
        category: 'story',
        difficulty: 'hard',
        requirements: ['story-ch1'],
        objectives: [
          { type: 'complete_chapter', chapter: 2, current: 0 }
        ],
        rewards: {
          xp: 1500,
          unlocks: ['story-ch3']
        }
      },
      {
        id: 'story-ch3',
        name: 'Capítulo 3: La Transformación',
        description: 'Completa el tercer capítulo',
        category: 'story',
        difficulty: 'expert',
        requirements: ['story-ch2'],
        objectives: [
          { type: 'complete_chapter', chapter: 3, current: 0 }
        ],
        rewards: {
          xp: 2500,
          unlocks: ['sandbox-mode']
        }
      }
    ];
  }

  /**
   * Obtener misión por ID
   */
  getMission(missionId) {
    return this.missions.find(m => m.id === missionId);
  }

  /**
   * Obtener misiones disponibles
   */
  getAvailableMissions(playerProgress) {
    return this.missions.filter(mission => {
      // Ya completada
      if (this.completedMissions.includes(mission.id)) {
        return false;
      }

      // Verificar requirements
      if (mission.requirements) {
        const hasRequirements = mission.requirements.every(reqId =>
          this.completedMissions.includes(reqId)
        );
        if (!hasRequirements) return false;
      }

      // Verificar unlocks del jugador
      // (las primeras misiones siempre están disponibles)
      return true;
    });
  }

  /**
   * Activar misiones para tracking
   */
  activateMission(missionId) {
    if (!this.activeMissions.includes(missionId)) {
      this.activeMissions.push(missionId);
      this.saveProgress();
    }
  }

  /**
   * Actualizar progreso de misión
   */
  updateProgress(society, eventData = null) {
    let completedAny = false;

    this.activeMissions.forEach(missionId => {
      const mission = this.getMission(missionId);
      if (!mission) return;

      let completed = true;

      mission.objectives.forEach(obj => {
        switch (obj.type) {
          case 'create_society':
            obj.current = 1; // Solo con tener una sociedad activa
            break;

          case 'survive_turns':
            obj.current = society.turn;
            break;

          case 'reach_metric':
            obj.current = society.metrics[obj.metric] || 0;
            break;

          case 'maintain_metric':
            // Necesita tracking especial (implementar en society)
            break;

          case 'reach_generation':
            const maxGen = Math.max(...society.beings.filter(b => b.alive).map(b => b.generation || 1));
            obj.current = maxGen;
            break;

          case 'reach_population':
            obj.current = society.beings.filter(b => b.alive).length;
            break;

          case 'reach_fitness':
            const maxFit = Math.max(...society.beings.filter(b => b.alive).map(b => b.fitness));
            obj.current = Math.round(maxFit);
            break;

          case 'successful_events':
            // Tracking desde eventData
            if (eventData && eventData.success) {
              obj.current = (obj.current || 0) + 1;
            }
            break;

          case 'event_streak':
            // Implementar tracking de racha
            break;

          case 'balanced_metrics':
            const m = society.metrics;
            const inRange = Object.values(m).every(v => v >= obj.min && v <= obj.max);
            obj.current = inRange ? 1 : 0;
            break;
        }

        // Verificar si objetivo cumplido
        const target = obj.turns || obj.value || obj.count || obj.generation || 1;
        if (obj.current < target) {
          completed = false;
        }
      });

      if (completed) {
        this.completeMission(missionId);
        completedAny = true;
      }
    });

    this.saveProgress();
    return completedAny;
  }

  /**
   * Completar misión
   */
  completeMission(missionId) {
    const mission = this.getMission(missionId);
    if (!mission) return null;

    // Mover a completadas
    this.activeMissions = this.activeMissions.filter(id => id !== missionId);
    this.completedMissions.push(missionId);

    this.saveProgress();

    return {
      mission,
      rewards: mission.rewards
    };
  }

  /**
   * Obtener progreso de misión activa
   */
  getMissionProgress(missionId) {
    const mission = this.getMission(missionId);
    if (!mission) return null;

    const total = mission.objectives.length;
    const completed = mission.objectives.filter(obj => {
      const target = obj.turns || obj.value || obj.count || obj.generation || 1;
      return obj.current >= target;
    }).length;

    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
      objectives: mission.objectives
    };
  }

  /**
   * Guardar progreso
   */
  saveProgress() {
    const data = {
      activeMissions: this.activeMissions,
      completedMissions: this.completedMissions,
      missionData: this.missions.map(m => ({
        id: m.id,
        objectives: m.objectives.map(o => ({ type: o.type, current: o.current || 0 }))
      }))
    };

    localStorage.setItem('microsocieties-missions', JSON.stringify(data));
  }

  /**
   * Cargar progreso
   */
  loadProgress() {
    const saved = localStorage.getItem('microsocieties-missions');
    if (!saved) {
      // Primera vez: activar tutorial
      this.activeMissions = ['tutorial-1'];
      return;
    }

    const data = JSON.parse(saved);
    this.activeMissions = data.activeMissions || [];
    this.completedMissions = data.completedMissions || [];

    // Restaurar current values en objectives
    if (data.missionData) {
      data.missionData.forEach(saved => {
        const mission = this.getMission(saved.id);
        if (mission) {
          saved.objectives.forEach((savedObj, i) => {
            if (mission.objectives[i]) {
              mission.objectives[i].current = savedObj.current || 0;
            }
          });
        }
      });
    }
  }

  /**
   * Resetear todo el progreso
   */
  resetProgress() {
    this.activeMissions = ['tutorial-1'];
    this.completedMissions = [];
    this.missions.forEach(m => {
      m.objectives.forEach(o => o.current = 0);
    });
    this.saveProgress();
  }
}

// Exportar
window.MissionSystem = MissionSystem;
// console.log('🎯 Sistema de Misiones cargado');
