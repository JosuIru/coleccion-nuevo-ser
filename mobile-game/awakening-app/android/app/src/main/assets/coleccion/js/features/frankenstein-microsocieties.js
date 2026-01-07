/**
 * SISTEMA DE MICROSOCIEDADES AUTÓNOMAS
 * Simulación evolutiva de sociedades de seres híbridos
 */

class MicroSociety {
  constructor(name, beings, goal) {
    this.name = name;
    this.beings = beings.map(b => ({...b, fitness: 50, alive: true})); // Clonar y añadir fitness
    this.goal = goal;
    this.turn = 0;
    this.running = false;
    this.speed = 1; // 1x, 2x, 5x, 10x

    // Métricas de la sociedad
    this.metrics = {
      health: 100,
      knowledge: 50,
      action: 50,
      cohesion: 75
    };

    // Historia de métricas para gráfico
    this.metricsHistory = [{
      turn: 0,
      health: 100,
      knowledge: 50,
      action: 50,
      cohesion: 75
    }];

    // Log de eventos
    this.eventLog = [];

    // Timer
    this.intervalId = null;

    // console.log(`🌍 Microsociedad "${name}" creada con ${beings.length} seres`);
  }

  /**
   * Iniciar simulación
   */
  start() {
    if (this.running) return;
    this.running = true;

    // Intervalo base: 2000ms / velocidad
    const interval = 2000 / this.speed;

    this.intervalId = setInterval(() => {
      this.processTurn();
    }, interval);

    // console.log(`▶️  Simulación iniciada (velocidad ${this.speed}x)`);
  }

  /**
   * Pausar simulación
   */
  pause() {
    if (!this.running) return;
    this.running = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // console.log('⏸️  Simulación pausada');
  }

  /**
   * Cambiar velocidad
   */
  setSpeed(speed) {
    const wasRunning = this.running;
    if (wasRunning) this.pause();

    this.speed = speed;

    if (wasRunning) this.start();
  }

  /**
   * Procesar un turno
   */
  processTurn() {
    this.turn++;

    // 1. Generar evento aleatorio (usar EventsSystem si está disponible)
    const event = this.generateEvent();

    // 2. Los seres responden al evento
    const response = this.beingsRespond(event);

    // 3. Aplicar consecuencias
    this.applyConsequences(event, response);

    // 4. Cada 10 turnos: hibridación
    if (this.turn % 10 === 0) {
      this.hybridize();
    }

    // 5. Eliminar seres muy débiles
    this.cullWeakBeings();

    // 6. Guardar estado en historia
    this.saveSnapshot();

    // 7. Actualizar progreso de misiones (si está disponible)
    if (window.missionSystem) {
      window.missionSystem.updateProgress(this, {
        eventType: event.type,
        eventSuccess: response.success
      });
    }

    // 8. Verificar game over
    if (this.metrics.health <= 0 || this.beings.filter(b => b.alive).length === 0) {
      this.pause();
      this.logEvent('💀 La sociedad ha colapsado', 'critical');
    }
  }

  /**
   * Generar evento aleatorio
   */
  generateEvent() {
    const eventTemplates = [
      // CRISIS
      {
        type: 'crisis',
        name: 'Sequía de Recursos',
        description: 'Los recursos disponibles disminuyen drásticamente',
        icon: '🏜️',
        requiredAttributes: {resilience: 40, organization: 30},
        onSuccess: {health: +10, cohesion: +15},
        onFailure: {health: -25, action: -15}
      },
      {
        type: 'crisis',
        name: 'Conflicto Interno',
        description: 'Surge un conflicto sobre la dirección de la comunidad',
        icon: '⚔️',
        requiredAttributes: {wisdom: 35, empathy: 30, communication: 25},
        onSuccess: {cohesion: +20, knowledge: +10},
        onFailure: {cohesion: -30, health: -10}
      },
      {
        type: 'crisis',
        name: 'Epidemia de Desinformación',
        description: 'Información falsa amenaza la cohesión',
        icon: '🦠',
        requiredAttributes: {analysis: 40, communication: 35},
        onSuccess: {knowledge: +15, cohesion: +10},
        onFailure: {cohesion: -20, knowledge: -15}
      },

      // OPORTUNIDADES
      {
        type: 'opportunity',
        name: 'Alianza Estratégica',
        description: 'Otra comunidad propone colaboración',
        icon: '🤝',
        requiredAttributes: {strategy: 30, communication: 35, collaboration: 25},
        onSuccess: {action: +20, knowledge: +15, cohesion: +10},
        onFailure: {action: -10}
      },
      {
        type: 'opportunity',
        name: 'Descubrimiento de Conocimiento',
        description: 'Se encuentra una fuente de sabiduría antigua',
        icon: '📜',
        requiredAttributes: {wisdom: 40, curiosity: 30, reflection: 25},
        onSuccess: {knowledge: +25, wisdom: +10},
        onFailure: {knowledge: +5}
      },
      {
        type: 'opportunity',
        name: 'Recursos Abundantes',
        description: 'Se descubre una fuente de recursos',
        icon: '🌾',
        requiredAttributes: {connection: 30, technical: 25},
        onSuccess: {health: +20, action: +15},
        onFailure: {health: +5}
      },

      // DESAFÍOS INTERNOS
      {
        type: 'challenge',
        name: 'Necesidad de Innovación',
        description: 'Los métodos actuales no son suficientes',
        icon: '💡',
        requiredAttributes: {creativity: 40, technical: 30, courage: 25},
        onSuccess: {action: +20, knowledge: +15},
        onFailure: {action: -15, health: -10}
      },
      {
        type: 'challenge',
        name: 'Crisis de Sentido',
        description: 'La comunidad cuestiona su propósito',
        icon: '🌀',
        requiredAttributes: {wisdom: 45, reflection: 35, consciousness: 30},
        onSuccess: {cohesion: +25, knowledge: +15},
        onFailure: {cohesion: -25, health: -15}
      },
      {
        type: 'challenge',
        name: 'Demanda de Acción Urgente',
        description: 'Se requiere acción inmediata ante una crisis externa',
        icon: '⚡',
        requiredAttributes: {action: 40, leadership: 30, courage: 25},
        onSuccess: {action: +20, cohesion: +15, health: +10},
        onFailure: {health: -20, cohesion: -10}
      },

      // EVENTOS POSITIVOS
      {
        type: 'positive',
        name: 'Celebración Comunitaria',
        description: 'Un logro colectivo fortalece los lazos',
        icon: '🎉',
        requiredAttributes: {empathy: 20, collaboration: 20},
        onSuccess: {cohesion: +20, health: +10},
        onFailure: {cohesion: +5}
      },
      {
        type: 'positive',
        name: 'Nuevo Miembro Inspirado',
        description: 'Alguien quiere unirse a la comunidad',
        icon: '✨',
        requiredAttributes: {communication: 25, empathy: 25},
        onSuccess: {cohesion: +15, knowledge: +10},
        onFailure: {cohesion: +5}
      },

      // AMENAZAS EXTERNAS
      {
        type: 'threat',
        name: 'Presión del Sistema Dominante',
        description: 'Fuerzas externas intentan desestabilizar',
        icon: '🏛️',
        requiredAttributes: {resilience: 40, strategy: 35, courage: 30},
        onSuccess: {cohesion: +15, action: +10},
        onFailure: {health: -20, cohesion: -15}
      },
      {
        type: 'threat',
        name: 'Cooptación de Ideas',
        description: 'Sus propuestas son apropiadas sin crédito',
        icon: '🎭',
        requiredAttributes: {strategy: 35, communication: 30, resilience: 25},
        onSuccess: {knowledge: +15, cohesion: +10},
        onFailure: {cohesion: -15, knowledge: -10}
      },

      // TRANSFORMACIONES
      {
        type: 'transformation',
        name: 'Momento de Inflexión',
        description: 'La comunidad alcanza un nuevo nivel de conciencia',
        icon: '🌟',
        requiredAttributes: {consciousness: 45, wisdom: 40, reflection: 35},
        onSuccess: {knowledge: +30, cohesion: +20, health: +15},
        onFailure: {knowledge: +10}
      },
      {
        type: 'transformation',
        name: 'Regeneración Profunda',
        description: 'Oportunidad para sanar y renovar estructuras',
        icon: '🌱',
        requiredAttributes: {connection: 40, empathy: 35, wisdom: 30},
        onSuccess: {health: +25, cohesion: +20, knowledge: +10},
        onFailure: {health: +5, cohesion: +5}
      }
    ];

    return eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
  }

  /**
   * Los seres responden al evento
   */
  beingsRespond(event) {
    const aliveBeings = this.beings.filter(b => b.alive);
    if (aliveBeings.length === 0) return {success: false, totalScore: 0, contributors: []};

    // Calcular atributos agregados de la sociedad
    const societyAttributes = {};
    Object.keys(event.requiredAttributes).forEach(attr => {
      societyAttributes[attr] = aliveBeings.reduce((sum, being) => {
        return sum + (being.attributes[attr] || 0);
      }, 0);
    });

    // Calcular score
    let totalScore = 0;
    let requiredScore = 0;
    const contributors = [];

    Object.entries(event.requiredAttributes).forEach(([attr, required]) => {
      const societyValue = societyAttributes[attr] || 0;
      const score = Math.min(societyValue, required);

      totalScore += score;
      requiredScore += required;

      // Identificar contribuyentes principales
      aliveBeings.forEach(being => {
        const contribution = being.attributes[attr] || 0;
        if (contribution >= required * 0.3) { // Contribuye al menos 30% del requerido
          contributors.push({being, attr, contribution});
        }
      });
    });

    const successRate = totalScore / requiredScore;
    const success = successRate >= 0.7; // Éxito si cumple al menos 70%

    return {success, successRate, totalScore, requiredScore, contributors};
  }

  /**
   * Aplicar consecuencias del evento
   */
  applyConsequences(event, response) {
    const consequences = response.success ? event.onSuccess : event.onFailure;

    // Aplicar a métricas
    Object.entries(consequences).forEach(([metric, change]) => {
      if (this.metrics.hasOwnProperty(metric)) {
        this.metrics[metric] = Math.max(0, Math.min(100, this.metrics[metric] + change));
      }
    });

    // Actualizar fitness de contribuyentes
    if (response.success && response.contributors.length > 0) {
      response.contributors.forEach(({being}) => {
        being.fitness = Math.min(100, being.fitness + 5);
      });
    }

    // Penalizar a todos los seres si fue fracaso
    if (!response.success) {
      this.beings.forEach(being => {
        if (being.alive) {
          being.fitness = Math.max(0, being.fitness - 2);
        }
      });
    }

    // Log del evento
    const statusIcon = response.success ? '✅' : '❌';
    const statusText = response.success ? 'Resuelto' : 'Fracaso';
    const message = `${event.icon} ${event.name}: ${statusText} (${Math.round(response.successRate * 100)}%)`;

    this.logEvent(message, response.success ? 'success' : 'failure');
  }

  /**
   * Hibridación de los mejores seres
   */
  hybridize() {
    const aliveBeings = this.beings.filter(b => b.alive);
    if (aliveBeings.length < 2) return;

    // Ordenar por fitness
    const sorted = [...aliveBeings].sort((a, b) => b.fitness - a.fitness);

    // Tomar los 2 mejores
    const parent1 = sorted[0];
    const parent2 = sorted[1];

    // Crear hijo híbrido
    const child = this.createHybrid(parent1, parent2);

    // Añadir a la sociedad
    this.beings.push(child);

    this.logEvent(`🧬 Hibridación: "${child.name}" nace de "${parent1.name}" y "${parent2.name}"`, 'info');
  }

  /**
   * Crear ser híbrido
   */
  createHybrid(parent1, parent2) {
    // Generar nombre combinando
    const name1Parts = parent1.name.split(' ');
    const name2Parts = parent2.name.split(' ');
    const childName = `${name1Parts[0]} ${name2Parts[name2Parts.length - 1]}`;

    // Mezclar atributos
    const childAttributes = {};
    const allAttrs = new Set([
      ...Object.keys(parent1.attributes),
      ...Object.keys(parent2.attributes)
    ]);

    allAttrs.forEach(attr => {
      const val1 = parent1.attributes[attr] || 0;
      const val2 = parent2.attributes[attr] || 0;

      // Promedio + mutación ±5%
      const avg = (val1 + val2) / 2;
      const mutation = (Math.random() - 0.5) * 0.1 * avg;

      childAttributes[attr] = Math.max(0, avg + mutation);
    });

    return {
      name: childName,
      attributes: childAttributes,
      pieces: [...parent1.pieces.slice(0, 6), ...parent2.pieces.slice(0, 6)], // Mitad de cada padre
      totalPower: (parent1.totalPower + parent2.totalPower) / 2,
      fitness: 50,
      alive: true,
      generation: Math.max(parent1.generation || 1, parent2.generation || 1) + 1
    };
  }

  /**
   * Eliminar seres muy débiles
   */
  cullWeakBeings() {
    const aliveBeings = this.beings.filter(b => b.alive);

    // Solo cullear si hay más de 5 seres
    if (aliveBeings.length <= 5) return;

    // Eliminar seres con fitness < 20
    this.beings.forEach(being => {
      if (being.alive && being.fitness < 20) {
        being.alive = false;
        this.logEvent(`💀 "${being.name}" se ha desvanecido (fitness demasiado bajo)`, 'warning');
      }
    });
  }

  /**
   * Guardar snapshot de métricas
   */
  saveSnapshot() {
    this.metricsHistory.push({
      turn: this.turn,
      health: this.metrics.health,
      knowledge: this.metrics.knowledge,
      action: this.metrics.action,
      cohesion: this.metrics.cohesion
    });

    // Mantener solo últimos 100 snapshots
    if (this.metricsHistory.length > 100) {
      this.metricsHistory.shift();
    }
  }

  /**
   * Añadir evento al log
   */
  logEvent(message, type = 'info') {
    this.eventLog.unshift({
      turn: this.turn,
      message,
      type,
      timestamp: Date.now()
    });

    // Mantener solo últimos 50 eventos
    if (this.eventLog.length > 50) {
      this.eventLog.pop();
    }
  }

  /**
   * Obtener estado actual
   */
  getState() {
    const aliveBeings = this.beings.filter(b => b.alive);

    return {
      name: this.name,
      goal: this.goal,
      turn: this.turn,
      running: this.running,
      speed: this.speed,
      metrics: {...this.metrics},
      metricsHistory: [...this.metricsHistory],
      eventLog: [...this.eventLog],
      beings: aliveBeings.map(b => ({
        name: b.name,
        fitness: b.fitness,
        generation: b.generation || 1,
        totalPower: b.totalPower
      })),
      population: aliveBeings.length,
      totalPopulation: this.beings.length,
      avgFitness: aliveBeings.reduce((sum, b) => sum + b.fitness, 0) / aliveBeings.length
    };
  }
}

/**
 * MANAGER DE MICROSOCIEDADES
 * Gestiona múltiples sociedades y la UI
 */
class MicroSocietiesManager {
  constructor() {
    this.societies = [];
    this.currentSociety = null;
  }

  /**
   * Crear nueva sociedad
   */
  createSociety(name, beings, goal) {
    const society = new MicroSociety(name, beings, goal);
    this.societies.push(society);
    this.currentSociety = society;
    return society;
  }

  /**
   * Obtener sociedad actual
   */
  getCurrentSociety() {
    return this.currentSociety;
  }

  /**
   * Seleccionar sociedad
   */
  selectSociety(index) {
    if (index >= 0 && index < this.societies.length) {
      this.currentSociety = this.societies[index];
      return this.currentSociety;
    }
    return null;
  }

  /**
   * Listar todas las sociedades
   */
  listSocieties() {
    return this.societies.map((s, i) => ({
      index: i,
      name: s.name,
      turn: s.turn,
      running: s.running,
      population: s.beings.filter(b => b.alive).length,
      health: s.metrics.health
    }));
  }
}

// Exportar globalmente
window.MicroSociety = MicroSociety;
window.MicroSocietiesManager = MicroSocietiesManager;

// console.log('🌍 Sistema de Microsociedades cargado');
