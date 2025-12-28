/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * SISTEMA DE RETOS PARA SERES FRANKENSTEIN
 * Juego post-creación donde el ser enfrenta desafíos basados en su misión
 */

class FrankensteinChallengesSystem {
  constructor() {
    this.currentBeing = null;
    this.currentMission = null;
    this.challenges = [];
    this.currentChallengeIndex = 0;
    this.score = 0;
    this.challengesCompleted = 0;
  }

  /**
   * Iniciar retos para un ser específico
   */
  startChallenges(being, mission) {
    this.currentBeing = being;
    this.currentMission = mission;
    this.score = 0;
    this.challengesCompleted = 0;
    this.currentChallengeIndex = 0;

    // Generar retos según la misión
    this.challenges = this.generateChallenges(mission);

    // logger.debug(`🎮 Iniciando ${this.challenges.length} retos para ${being.name}`);
    return this.challenges;
  }

  /**
   * Generar retos según el tipo de misión
   */
  generateChallenges(mission) {
    const challengeTemplates = this.getChallengeTemplatesForMission(mission);
    const selectedChallenges = [];

    // Seleccionar 5-7 retos aleatorios
    const numChallenges = 5 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numChallenges; i++) {
      const template = challengeTemplates[i % challengeTemplates.length];
      selectedChallenges.push(this.createChallengeFromTemplate(template, i + 1));
    }

    return selectedChallenges;
  }

  /**
   * Obtener plantillas de retos según la misión
   */
  getChallengeTemplatesForMission(mission) {
    const templates = {
      'emprendedor-social': [
        {
          type: 'multiple-choice',
          scenario: 'Tu proyecto social necesita financiación. ¿Qué estrategia priorizas?',
          options: [
            { text: 'Buscar inversores de impacto', attributes: { strategy: 20, communication: 10 } },
            { text: 'Organizar crowdfunding comunitario', attributes: { connection: 25, collaboration: 15 } },
            { text: 'Aplicar a subvenciones públicas', attributes: { organization: 20, technical: 10 } },
            { text: 'Generar ingresos propios primero', attributes: { resilience: 20, action: 15 } }
          ],
          requiredAttributes: { strategy: 30, connection: 20 }
        },
        {
          type: 'scenario',
          scenario: 'Hay conflicto en tu equipo entre visión de impacto y sostenibilidad económica.',
          challenge: '¿Cómo medias el conflicto?',
          options: [
            { text: 'Facilitar diálogo para encontrar punto medio', attributes: { communication: 25, empathy: 20 } },
            { text: 'Presentar datos sobre modelos híbridos exitosos', attributes: { analysis: 20, strategy: 15 } },
            { text: 'Dividir el proyecto en fases', attributes: { organization: 25, strategy: 20 } },
            { text: 'Priorizar impacto y buscar subsidios', attributes: { courage: 20, connection: 15 } }
          ],
          requiredAttributes: { communication: 25, empathy: 15 }
        },
        {
          type: 'resource-allocation',
          scenario: 'Tienes recursos limitados. Distribúyelos entre:',
          resources: 100,
          options: [
            { id: 'impact', name: 'Maximizar impacto social', attributes: { connection: 1, empathy: 1 } },
            { id: 'team', name: 'Fortalecer al equipo', attributes: { collaboration: 1, leadership: 1 } },
            { id: 'marketing', name: 'Comunicación y visibilidad', attributes: { communication: 1, strategy: 1 } },
            { id: 'infrastructure', name: 'Infraestructura y procesos', attributes: { organization: 1, technical: 1 } }
          ],
          requiredAttributes: { strategy: 30, organization: 20 }
        },
        {
          type: 'dilemma',
          scenario: 'Una gran corporación quiere financiarte, pero sus prácticas son cuestionables.',
          dilemma: '¿Aceptas el dinero?',
          options: [
            { text: 'Sí, con condiciones claras de no interferencia', attributes: { strategy: 15, courage: 10 }, risk: 'high' },
            { text: 'No, buscar alternativas alineadas', attributes: { courage: 25, consciousness: 20 }, risk: 'low' },
            { text: 'Negociar que cambien sus prácticas', attributes: { communication: 20, leadership: 15 }, risk: 'medium' },
            { text: 'Aceptar solo una parte del financiamiento', attributes: { strategy: 20, resilience: 10 }, risk: 'medium' }
          ],
          requiredAttributes: { courage: 20, consciousness: 15 }
        },
        {
          type: 'crisis',
          scenario: '¡CRISIS! Un escándalo mediático pone en riesgo tu proyecto.',
          urgency: 'high',
          options: [
            { text: 'Comunicado transparente inmediato', attributes: { communication: 30, courage: 20 }, speed: 'fast' },
            { text: 'Reunir al equipo y stakeholders primero', attributes: { collaboration: 25, strategy: 20 }, speed: 'medium' },
            { text: 'Investigar a fondo antes de responder', attributes: { analysis: 30, reflection: 15 }, speed: 'slow' },
            { text: 'Movilizar comunidad en tu defensa', attributes: { connection: 30, leadership: 20 }, speed: 'fast' }
          ],
          requiredAttributes: { communication: 25, resilience: 20 }
        }
      ],

      'organizador-comunitario': [
        {
          type: 'multiple-choice',
          scenario: 'Tu comunidad enfrenta un problema urgente de vivienda. ¿Qué haces primero?',
          options: [
            { text: 'Organizar asamblea vecinal', attributes: { collaboration: 25, communication: 20 } },
            { text: 'Mapear recursos y necesidades', attributes: { organization: 25, analysis: 15 } },
            { text: 'Contactar con autoridades', attributes: { communication: 20, strategy: 15 } },
            { text: 'Crear grupo de acción directa', attributes: { action: 30, courage: 20 } }
          ],
          requiredAttributes: { collaboration: 30, organization: 20 }
        },
        {
          type: 'scenario',
          scenario: 'Hay división en la comunidad: vecinos antiguos vs. recién llegados.',
          challenge: '¿Cómo construyes puentes?',
          options: [
            { text: 'Espacios de encuentro y diálogo', attributes: { empathy: 25, connection: 20 } },
            { text: 'Proyectos colaborativos concretos', attributes: { action: 25, collaboration: 20 } },
            { text: 'Historias compartidas y memoria colectiva', attributes: { communication: 20, wisdom: 15 } },
            { text: 'Mediación de líderes respetados', attributes: { leadership: 25, empathy: 15 } }
          ],
          requiredAttributes: { empathy: 25, collaboration: 20 }
        },
        {
          type: 'network-building',
          scenario: 'Necesitas fortalecer redes comunitarias. Prioriza conexiones:',
          nodes: 8,
          options: [
            { id: 'neighbors', name: 'Vecinos directos', strength: 'strong', attributes: { connection: 2 } },
            { id: 'organizations', name: 'Organizaciones locales', strength: 'medium', attributes: { collaboration: 2 } },
            { id: 'institutions', name: 'Instituciones públicas', strength: 'weak', attributes: { strategy: 2 } },
            { id: 'media', name: 'Medios de comunicación', strength: 'medium', attributes: { communication: 2 } }
          ],
          requiredAttributes: { connection: 35, collaboration: 25 }
        },
        {
          type: 'power-dynamics',
          scenario: 'Las autoridades ignoran las demandas vecinales. ¿Cómo escalas la presión?',
          options: [
            { text: 'Movilización masiva pacífica', attributes: { leadership: 25, collaboration: 20 } },
            { text: 'Campaña mediática coordinada', attributes: { communication: 30, strategy: 20 } },
            { text: 'Alianzas con otras comunidades', attributes: { connection: 30, collaboration: 25 } },
            { text: 'Acción directa no violenta', attributes: { action: 35, courage: 25 } }
          ],
          requiredAttributes: { leadership: 25, courage: 20 }
        },
        {
          type: 'consensus-building',
          scenario: 'La asamblea no logra consenso sobre la estrategia a seguir.',
          participants: 50,
          positions: ['Negociación', 'Movilización', 'Judicialización', 'Autonomía'],
          options: [
            { text: 'Proceso de escucha profunda en grupos pequeños', attributes: { empathy: 30, communication: 20 } },
            { text: 'Votación con múltiples rondas', attributes: { organization: 25, strategy: 15 } },
            { text: 'Estrategia híbrida que integre todas', attributes: { creativity: 25, strategy: 25 } },
            { text: 'Diferenciación: cada grupo su estrategia', attributes: { collaboration: 20, resilience: 20 } }
          ],
          requiredAttributes: { empathy: 25, collaboration: 30 }
        }
      ],

      'disenador-regenerativo': [
        {
          type: 'systems-thinking',
          scenario: 'Diseñas un sistema alimentario local. Identifica las conexiones clave:',
          elements: ['Suelo', 'Agua', 'Biodiversidad', 'Agricultores', 'Consumidores', 'Clima'],
          options: [
            { text: 'Suelo → Biodiversidad → Agua (ciclo ecológico)', attributes: { connection: 30, wisdom: 20 } },
            { text: 'Agricultores → Consumidores (economía local)', attributes: { collaboration: 25, strategy: 15 } },
            { text: 'Clima → Agua → Suelo (adaptación)', attributes: { resilience: 25, analysis: 20 } },
            { text: 'Todo conectado en red viva', attributes: { consciousness: 30, connection: 25 } }
          ],
          requiredAttributes: { connection: 30, wisdom: 20 }
        },
        {
          type: 'biomimicry',
          scenario: 'Necesitas diseñar un sistema de gestión de residuos. ¿Qué patrón natural imitas?',
          options: [
            { text: 'Bosque: todo residuo es alimento', attributes: { wisdom: 30, connection: 20 } },
            { text: 'Mycelia: red distribuida de transformación', attributes: { connection: 35, creativity: 20 } },
            { text: 'Compostaje: descomposición en capas', attributes: { technical: 25, organization: 20 } },
            { text: 'Ecosistema: ciclos cerrados múltiples', attributes: { analysis: 30, wisdom: 25 } }
          ],
          requiredAttributes: { wisdom: 25, connection: 25 }
        },
        {
          type: 'regeneration-metrics',
          scenario: 'Define indicadores de éxito para tu diseño regenerativo:',
          categories: ['Ecológico', 'Social', 'Económico', 'Cultural'],
          options: [
            { id: 'biodiversity', name: 'Incremento de biodiversidad', category: 'Ecológico', attributes: { connection: 3 } },
            { id: 'soil-health', name: 'Salud del suelo', category: 'Ecológico', attributes: { wisdom: 3 } },
            { id: 'community', name: 'Fortalecimiento comunitario', category: 'Social', attributes: { collaboration: 3 } },
            { id: 'local-economy', name: 'Economía local', category: 'Económico', attributes: { strategy: 2 } },
            { id: 'knowledge', name: 'Transmisión de saberes', category: 'Cultural', attributes: { wisdom: 2, communication: 2 } }
          ],
          requiredAttributes: { wisdom: 30, connection: 25 }
        },
        {
          type: 'stakeholder-engagement',
          scenario: 'Involucras a distintos actores en tu diseño. ¿Cómo priorizas el diálogo?',
          stakeholders: ['Comunidad local', 'Científicos', 'Agricultores', 'Gobierno', 'Juventud'],
          options: [
            { text: 'Co-diseño horizontal con todos', attributes: { collaboration: 35, empathy: 25 } },
            { text: 'Sabidurías ancestrales primero', attributes: { wisdom: 35, connection: 20 } },
            { text: 'Evidencia científica como base', attributes: { analysis: 30, technical: 20 } },
            { text: 'Necesidades de juventud futuro', attributes: { courage: 25, consciousness: 25 } }
          ],
          requiredAttributes: { collaboration: 30, wisdom: 25 }
        },
        {
          type: 'trade-offs',
          scenario: 'Tensión entre producción económica y regeneración ecológica. ¿Cómo priorizas?',
          options: [
            { text: 'Regeneración primero, economía emerge', attributes: { courage: 30, wisdom: 25 }, timeline: 'long' },
            { text: 'Balance: 60% regeneración, 40% producción', attributes: { strategy: 30, analysis: 20 }, timeline: 'medium' },
            { text: 'Fases: restaurar primero, producir después', attributes: { resilience: 25, organization: 25 }, timeline: 'long' },
            { text: 'Economía regenerativa desde el inicio', attributes: { creativity: 30, strategy: 25 }, timeline: 'medium' }
          ],
          requiredAttributes: { wisdom: 25, strategy: 20 }
        }
      ],

      'maestro-sabiduria': [
        {
          type: 'teaching-method',
          scenario: 'Un estudiante te hace una pregunta profunda. ¿Cómo respondes?',
          options: [
            { text: 'Con otra pregunta que le haga reflexionar', attributes: { wisdom: 30, reflection: 25 } },
            { text: 'Compartiendo una historia o parábola', attributes: { communication: 25, wisdom: 20 } },
            { text: 'Invitándole a experimentar directamente', attributes: { action: 25, consciousness: 20 } },
            { text: 'Explorando juntos sin asumir que sabes', attributes: { empathy: 30, consciousness: 25 } }
          ],
          requiredAttributes: { wisdom: 30, reflection: 25 }
        },
        {
          type: 'paradox',
          scenario: 'Te preguntan: "¿Cómo logro desapegarme sin dejar de amar?"',
          nature: 'philosophical',
          options: [
            { text: 'El desapego verdadero ES el amor verdadero', attributes: { wisdom: 35, consciousness: 30 } },
            { text: 'Ama sin poseer, fluye sin aferrar', attributes: { wisdom: 30, empathy: 25 } },
            { text: 'La pregunta misma revela la respuesta', attributes: { reflection: 35, consciousness: 25 } },
            { text: 'Experimenta en silencio, la mente no puede comprenderlo', attributes: { consciousness: 40, wisdom: 20 } }
          ],
          requiredAttributes: { wisdom: 35, consciousness: 30 }
        },
        {
          type: 'group-dynamics',
          scenario: 'En tu círculo de enseñanza hay ego y competencia entre estudiantes.',
          challenge: '¿Cómo transformas la dinámica?',
          options: [
            { text: 'Ejercicio de humildad radical', attributes: { courage: 25, consciousness: 30 } },
            { text: 'Mostrar la interconexión de todos', attributes: { wisdom: 30, connection: 25 } },
            { text: 'Cada uno enseña lo que sabe', attributes: { empathy: 25, collaboration: 20 } },
            { text: 'Silencio compartido profundo', attributes: { consciousness: 35, reflection: 30 } }
          ],
          requiredAttributes: { wisdom: 30, empathy: 25 }
        },
        {
          type: 'transmission',
          scenario: 'Sientes que te acercas al final de tu vida. ¿Cómo transmites lo esencial?',
          urgency: 'existential',
          options: [
            { text: 'No transmitir nada, confiar en el proceso', attributes: { wisdom: 40, consciousness: 35 } },
            { text: 'Crear linaje de maestros-estudiantes', attributes: { collaboration: 30, wisdom: 25 } },
            { text: 'Escribir lo indescriptible', attributes: { communication: 30, courage: 20 } },
            { text: 'Cada encuentro es la transmisión completa', attributes: { consciousness: 40, empathy: 30 } }
          ],
          requiredAttributes: { wisdom: 40, consciousness: 35 }
        },
        {
          type: 'integration',
          scenario: 'Un estudiante avanzado experimenta apertura profunda pero se asusta.',
          challenge: '¿Cómo le acompañas en la integración?',
          options: [
            { text: 'Presencia silenciosa, estar disponible', attributes: { empathy: 35, consciousness: 30 } },
            { text: 'Normalizar: es parte del camino', attributes: { wisdom: 30, communication: 25 } },
            { text: 'Prácticas de enraizamiento', attributes: { action: 25, resilience: 20 } },
            { text: 'Celebrar el miedo como maestro', attributes: { courage: 30, wisdom: 25 } }
          ],
          requiredAttributes: { empathy: 30, wisdom: 30 }
        }
      ],

      'pensador-sistemico': [
        {
          type: 'pattern-recognition',
          scenario: 'Observas un sistema complejo. ¿Qué patrón identificas primero?',
          options: [
            { text: 'Bucles de retroalimentación', attributes: { analysis: 30, reflection: 20 } },
            { text: 'Puntos de apalancamiento', attributes: { strategy: 30, analysis: 25 } },
            { text: 'Propiedades emergentes', attributes: { consciousness: 25, analysis: 25 } },
            { text: 'Arquetipos sistémicos', attributes: { wisdom: 30, analysis: 30 } }
          ],
          requiredAttributes: { analysis: 35, reflection: 25 }
        },
        {
          type: 'intervention-design',
          scenario: 'Diseñas una intervención en un sistema complejo. ¿Qué principio guía?',
          options: [
            { text: 'Mínima intervención, máximo efecto', attributes: { wisdom: 30, strategy: 25 } },
            { text: 'Experimentación adaptativa', attributes: { resilience: 25, analysis: 25 } },
            { text: 'Cambiar las reglas del juego', attributes: { courage: 30, strategy: 30 } },
            { text: 'Cultivar condiciones para auto-organización', attributes: { consciousness: 35, wisdom: 30 } }
          ],
          requiredAttributes: { strategy: 30, wisdom: 25 }
        },
        {
          type: 'complexity-navigation',
          scenario: 'Múltiples stakeholders con agendas contradictorias. ¿Cómo navegas?',
          stakeholders: 12,
          conflicts: 8,
          options: [
            { text: 'Mapear el sistema completo primero', attributes: { analysis: 35, organization: 25 } },
            { text: 'Facilitar diálogo generativo', attributes: { communication: 30, empathy: 25 } },
            { text: 'Encontrar el atractor común subyacente', attributes: { wisdom: 35, analysis: 30 } },
            { text: 'Experimentos pequeños paralelos', attributes: { creativity: 30, resilience: 20 } }
          ],
          requiredAttributes: { analysis: 35, communication: 25 }
        },
        {
          type: 'scale-thinking',
          scenario: 'Una solución funciona localmente. ¿Cómo piensas en escalarla?',
          options: [
            { text: 'No escalar, replicar con adaptación local', attributes: { wisdom: 30, collaboration: 25 } },
            { text: 'Identificar principios transferibles', attributes: { analysis: 35, strategy: 30 } },
            { text: 'Crear red de aprendizaje distribuida', attributes: { connection: 30, communication: 25 } },
            { text: 'Cambiar las condiciones del sistema mayor', attributes: { courage: 35, strategy: 35 } }
          ],
          requiredAttributes: { strategy: 35, analysis: 30 }
        },
        {
          type: 'unintended-consequences',
          scenario: 'Tu intervención generó consecuencias no previstas. ¿Qué haces?',
          options: [
            { text: 'Análisis profundo de bucles causales', attributes: { analysis: 40, reflection: 30 } },
            { text: 'Involucrar a afectados en rediseño', attributes: { empathy: 30, collaboration: 30 } },
            { text: 'Aceptar la complejidad irreducible', attributes: { wisdom: 35, consciousness: 30 } },
            { text: 'Experimentación rápida de alternativas', attributes: { resilience: 30, action: 25 } }
          ],
          requiredAttributes: { analysis: 35, reflection: 30 }
        }
      ]
    };

    return templates[mission.id] || templates['emprendedor-social'];
  }

  /**
   * Crear reto individual desde plantilla
   */
  createChallengeFromTemplate(template, number) {
    return {
      ...template,
      number,
      completed: false,
      score: 0,
      playerAnswer: null
    };
  }

  /**
   * Evaluar respuesta del jugador
   */
  evaluateAnswer(challengeIndex, selectedOption) {
    const challenge = this.challenges[challengeIndex];
    if (!challenge || challenge.completed) return null;

    const option = challenge.options[selectedOption];
    if (!option) return null;

    // Calcular puntuación basada en atributos del ser
    let score = 0;
    let feedback = [];

    // Verificar si el ser tiene los atributos necesarios
    Object.entries(option.attributes).forEach(([attr, required]) => {
      const beingValue = this.currentBeing.attributes[attr] || 0;

      if (beingValue >= required) {
        score += required;
        feedback.push({
          attribute: attr,
          success: true,
          message: `✓ Tu ${attr} (${beingValue}) fue suficiente`
        });
      } else {
        const deficit = required - beingValue;
        score += Math.max(0, beingValue - (deficit / 2));
        feedback.push({
          attribute: attr,
          success: false,
          message: `✗ Necesitabas ${required} de ${attr}, tienes ${beingValue}`
        });
      }
    });

    // Bonus por atributos extras
    Object.entries(this.currentBeing.attributes).forEach(([attr, value]) => {
      if (!option.attributes[attr] && value > 50) {
        score += Math.floor(value / 10);
        feedback.push({
          attribute: attr,
          bonus: true,
          message: `★ Bonus por alto ${attr}: +${Math.floor(value / 10)}`
        });
      }
    });

    // Marcar como completado
    challenge.completed = true;
    challenge.score = Math.round(score);
    challenge.playerAnswer = selectedOption;
    challenge.feedback = feedback;

    this.score += challenge.score;
    this.challengesCompleted++;

    return {
      success: score >= Object.values(option.attributes).reduce((a, b) => a + b, 0) * 0.7,
      score: challenge.score,
      feedback,
      totalScore: this.score,
      completed: this.challengesCompleted,
      total: this.challenges.length
    };
  }

  /**
   * Obtener el siguiente reto
   */
  getNextChallenge() {
    this.currentChallengeIndex++;
    if (this.currentChallengeIndex >= this.challenges.length) {
      return null; // Todos completados
    }
    return this.challenges[this.currentChallengeIndex];
  }

  /**
   * Obtener resultados finales
   */
  getFinalResults() {
    const maxScore = this.challenges.reduce((sum, ch) =>
      sum + ch.options.reduce((max, opt) =>
        Math.max(max, Object.values(opt.attributes).reduce((a, b) => a + b, 0)), 0
      ), 0
    );

    const successRate = (this.score / maxScore) * 100;
    let rank = 'Aprendiz';

    if (successRate >= 90) rank = 'Maestro Legendario';
    else if (successRate >= 75) rank = 'Maestro';
    else if (successRate >= 60) rank = 'Experto';
    else if (successRate >= 45) rank = 'Competente';
    else if (successRate >= 30) rank = 'Novato Avanzado';

    return {
      score: this.score,
      maxScore,
      successRate: Math.round(successRate),
      rank,
      challengesCompleted: this.challengesCompleted,
      totalChallenges: this.challenges.length,
      being: this.currentBeing.name,
      mission: this.currentMission.name,
      challenges: this.challenges.map(ch => ({
        number: ch.number,
        type: ch.type,
        scenario: ch.scenario,
        score: ch.score,
        completed: ch.completed
      }))
    };
  }
}

// Exportar
window.FrankensteinChallengesSystem = FrankensteinChallengesSystem;
