/**
 * FRANKENSTEIN LAB - SISTEMA DE MISIONES Y ATRIBUTOS
 * Sistema de creación de "Seres Transformadores" con propósito
 *
 * Concepto: Cada capítulo/ejercicio/recurso es una pieza que aporta atributos
 * al ser. Las misiones requieren combinaciones específicas de atributos.
 * El ser puede vivir/florecer según el equilibrio de sus atributos.
 *
 * @version 3.0.0
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

class FrankensteinMissions {
  constructor() {
    // Atributos que puede tener un "Ser Transformador"
    this.attributes = {
      // Capacidades Intelectuales
      reflection: {
        name: 'Reflexión',
        icon: '🧠',
        description: 'Capacidad de pensar profundamente',
        color: '#3b82f6'
      },
      analysis: {
        name: 'Análisis',
        icon: '🔍',
        description: 'Capacidad de analizar sistemas complejos',
        color: '#8b5cf6'
      },
      creativity: {
        name: 'Creatividad',
        icon: '🎨',
        description: 'Capacidad de generar soluciones innovadoras',
        color: '#f59e0b'
      },

      // Capacidades Emocionales/Sociales
      empathy: {
        name: 'Empatía',
        icon: '❤️',
        description: 'Capacidad de conectar con otros',
        color: '#ef4444'
      },
      communication: {
        name: 'Comunicación',
        icon: '🗣️',
        description: 'Capacidad de expresar y escuchar',
        color: '#06b6d4'
      },
      leadership: {
        name: 'Liderazgo',
        icon: '👑',
        description: 'Capacidad de guiar y motivar',
        color: '#eab308'
      },

      // Capacidades de Acción
      action: {
        name: 'Acción',
        icon: '⚡',
        description: 'Capacidad de implementar cambios',
        color: '#10b981'
      },
      resilience: {
        name: 'Resiliencia',
        icon: '💪',
        description: 'Capacidad de perseverar',
        color: '#dc2626'
      },
      strategy: {
        name: 'Estrategia',
        icon: '♟️',
        description: 'Capacidad de planificar',
        color: '#6366f1'
      },

      // Capacidades Espirituales/Profundas
      consciousness: {
        name: 'Consciencia',
        icon: '🌟',
        description: 'Capacidad de auto-observación',
        color: '#a855f7'
      },
      connection: {
        name: 'Conexión',
        icon: '🌍',
        description: 'Sentido de interconexión',
        color: '#059669'
      },
      wisdom: {
        name: 'Sabiduría',
        icon: '📿',
        description: 'Comprensión profunda de la vida',
        color: '#7c3aed'
      },

      // Capacidades Prácticas
      organization: {
        name: 'Organización',
        icon: '📋',
        description: 'Capacidad de estructurar',
        color: '#64748b'
      },
      collaboration: {
        name: 'Colaboración',
        icon: '🤝',
        description: 'Capacidad de trabajar en equipo',
        color: '#0ea5e9'
      },
      technical: {
        name: 'Técnica',
        icon: '🔧',
        description: 'Habilidades técnicas específicas',
        color: '#475569'
      }
    };

    this.difficultyRank = {
      facil: 0,
      intermedio: 1,
      avanzado: 2,
      experto: 3
    };

    // Configuración del sistema de progresión
    this.progressionConfig = {
      // Turnos base por dificultad de misión
      turnsPerDifficulty: {
        facil: 10,
        intermedio: 15,
        avanzado: 20,
        experto: 30
      },
      // Energía máxima y costos
      maxEnergy: 100,
      energyCostPerMission: {
        facil: 15,
        intermedio: 25,
        avanzado: 40,
        experto: 60
      },
      // Recuperación de energía
      energyRecoveryPerHour: 10,
      // XP por dificultad
      xpPerDifficulty: {
        facil: 50,
        intermedio: 100,
        avanzado: 200,
        experto: 400
      },
      // XP necesaria por nivel (exponencial)
      xpPerLevel: (level) => Math.floor(100 * Math.pow(1.5, level - 1)),
      // Bonus de atributos por nivel
      attributeBonusPerLevel: 2
    };

    // Misiones disponibles
    this.missions = [
      {
        id: 'curious-explorer',
        name: 'Explorador Curioso',
        icon: '🧭',
        description: 'Recolecta aprendizajes, observa patrones y experimenta con nuevas combinaciones.',
        longDescription: 'Un ser dispuesto a probar piezas con curiosidad, validar hipótesis sencillas y compartir descubrimientos con humildad.',
        difficulty: 'facil',
        requiredAttributes: {
          reflection: 25,
          creativity: 30,
          action: 30,
          empathy: 20
        },
        balanceRequired: {
          action: { min: 25 },
          reflection: { min: 20 }
        },
        successMessage: '¡Ser viable! Puedes explorar experiencias sin miedo a equivocarte.',
        failureReasons: {
          lowReflection: 'Necesitas pausar y observar antes de actuar.',
          lowAction: 'Falta coraje para integrar aprendizajes en acción.'
        }
      },
      {
        id: 'community-starter',
        name: 'Acompañante de Base',
        icon: '🤝',
        description: 'Activa círculos de confianza y escucha a quienes te rodean.',
        longDescription: 'Un ser que genera seguridad, comparte herramientas prácticas y construye puentes desde lo cotidiano.',
        difficulty: 'facil',
        requiredAttributes: {
          empathy: 40,
          communication: 40,
          collaboration: 35,
          action: 30,
          resilience: 30
        },
        balanceRequired: {
          'empathy+communication': { min: 120 },
          action: { min: 30 }
        },
        successMessage: '¡Ser viable! Puedes sostener comunidades con presencia y claridad.',
        failureReasons: {
          lowEmpathy: 'Necesitas escuchar más allá de lo evidente.',
          lowCommunication: 'Tus mensajes se pierden. Habla con claridad y calidez.',
          lowAction: 'La comunidad espera movimiento, no discursos.'
        }
      },
      {
        id: 'social-entrepreneur',
        name: 'Emprendedor Social',
        icon: '🏢',
        description: 'Crear y liderar una empresa con impacto social transformador',
        longDescription: 'Un ser capaz de identificar problemas sociales, diseñar soluciones sostenibles, movilizar recursos, liderar equipos y mantener el propósito transformador a largo plazo.',
        difficulty: 'avanzado',
        requiredAttributes: {
          // Mínimos necesarios
          creativity: 60,
          leadership: 70,
          action: 80,
          strategy: 60,
          resilience: 70,
          // Deseables
          empathy: 50,
          communication: 50,
          organization: 40
        },
        balanceRequired: {
          // Equilibrio entre pensamiento y acción
          'reflection+analysis': { min: 80, max: 150 },
          action: { min: 60 },
          // No demasiado contemplativo, necesita acción
          consciousness: { max: 80 }
        },
        successMessage: '¡Ser viable! Puede crear empresas transformadoras con equilibrio entre visión y acción.',
        failureReasons: {
          lowAction: 'Demasiada teoría, poca acción. Necesita más práctica.',
          lowLeadership: 'No puede movilizar equipos. Necesita más liderazgo.',
          unbalanced: 'Desbalanceado entre reflexión y acción.'
        }
      },

      {
        id: 'conflict-mediator',
        name: 'Mediador de Conflictos',
        icon: '☮️',
        description: 'Facilitar diálogo y resolución en conflictos complejos',
        longDescription: 'Un ser capaz de escuchar activamente, comprender múltiples perspectivas, mantener neutralidad empática, diseñar procesos de diálogo y guiar hacia acuerdos constructivos.',
        difficulty: 'intermedio',
        requiredAttributes: {
          empathy: 90,
          communication: 80,
          wisdom: 60,
          resilience: 50,
          reflection: 60
        },
        balanceRequired: {
          // Alto en empatía pero también en sabiduría
          'empathy+wisdom': { min: 140 },
          // No demasiado acción directa
          action: { max: 60 },
          // Buena comunicación
          communication: { min: 70 }
        },
        successMessage: '¡Ser viable! Puede mediar conflictos con empatía y sabiduría.',
        failureReasons: {
          lowEmpathy: 'No puede conectar con las emociones. Necesita más empatía.',
          lowCommunication: 'No puede facilitar diálogo. Necesita más comunicación.',
          tooAction: 'Demasiado orientado a acción. La mediación requiere paciencia.'
        }
      },

      {
        id: 'community-organizer',
        name: 'Organizador Comunitario',
        icon: '🌱',
        description: 'Movilizar comunidades para el cambio social desde la base',
        longDescription: 'Un ser capaz de conectar con la gente, identificar necesidades reales, diseñar estrategias participativas, construir redes de apoyo y sostener movimientos a largo plazo.',
        difficulty: 'intermedio',
        requiredAttributes: {
          empathy: 80,
          collaboration: 90,
          action: 70,
          communication: 70,
          resilience: 60,
          strategy: 50
        },
        balanceRequired: {
          // Alto en colaboración y empatía
          'empathy+collaboration': { min: 160 },
          // Buena acción pero no excesiva
          action: { min: 60, max: 100 },
          // Conexión importante
          connection: { min: 50 }
        },
        successMessage: '¡Ser viable! Puede organizar comunidades con empatía y estrategia.',
        failureReasons: {
          lowCollaboration: 'No puede construir redes. Necesita más colaboración.',
          lowEmpathy: 'No conecta con la comunidad. Necesita más empatía.',
          lowConnection: 'No siente la interconexión. Necesita más sentido de comunidad.'
        }
      },

      {
        id: 'regenerative-designer',
        name: 'Diseñador Regenerativo',
        icon: '🌍',
        description: 'Diseñar sistemas que regeneran ecosistemas y comunidades',
        longDescription: 'Un ser capaz de comprender sistemas vivos, diseñar con la naturaleza, integrar dimensiones ecológicas y sociales, y crear soluciones que sanan el planeta.',
        difficulty: 'avanzado',
        requiredAttributes: {
          connection: 90,
          creativity: 80,
          analysis: 70,
          wisdom: 60,
          strategy: 60,
          technical: 50
        },
        balanceRequired: {
          // Muy alto en conexión con la naturaleza
          connection: { min: 80 },
          // Creatividad + análisis
          'creativity+analysis': { min: 140 },
          // No excesiva acción sin reflexión
          'reflection+analysis': { min: 100 }
        },
        successMessage: '¡Ser viable! Puede diseñar sistemas regenerativos holísticos.',
        failureReasons: {
          lowConnection: 'No siente la conexión con la Tierra. Necesita ecología profunda.',
          lowCreativity: 'No puede imaginar nuevos sistemas. Necesita más creatividad.',
          unbalanced: 'Falta balance entre análisis y creatividad.'
        }
      },

      {
        id: 'wisdom-teacher',
        name: 'Maestro de Sabiduría',
        icon: '🕉️',
        description: 'Guiar a otros en su desarrollo personal y espiritual',
        longDescription: 'Un ser capaz de sostener espacios de transformación, transmitir enseñanzas profundas, adaptar prácticas a cada persona, y encarnar la sabiduría que enseña.',
        difficulty: 'avanzado',
        requiredAttributes: {
          wisdom: 90,
          consciousness: 90,
          empathy: 70,
          communication: 60,
          reflection: 80
        },
        balanceRequired: {
          // Muy alto en sabiduría y consciencia
          'wisdom+consciousness': { min: 170 },
          // No demasiada acción externa
          action: { max: 50 },
          // Alta reflexión
          reflection: { min: 70 }
        },
        successMessage: '¡Ser viable! Puede guiar transformaciones profundas con sabiduría.',
        failureReasons: {
          lowWisdom: 'No tiene la sabiduría necesaria. Necesita más práctica contemplativa.',
          lowConsciousness: 'No tiene suficiente auto-conocimiento. Necesita más meditación.',
          tooAction: 'Demasiado orientado a hacer. La enseñanza requiere ser.'
        }
      },

      {
        id: 'systems-thinker',
        name: 'Pensador Sistémico',
        icon: '🕸️',
        description: 'Comprender y transformar sistemas complejos',
        longDescription: 'Un ser capaz de ver patrones ocultos, comprender interdependencias, identificar puntos de apalancamiento, y proponer intervenciones sistémicas efectivas.',
        difficulty: 'avanzado',
        requiredAttributes: {
          analysis: 90,
          reflection: 80,
          creativity: 60,
          strategy: 70,
          connection: 60
        },
        balanceRequired: {
          // Muy alto en análisis y reflexión
          'analysis+reflection': { min: 160 },
          // Creatividad moderada
          creativity: { min: 50 },
          // No excesiva acción sin reflexión
          action: { max: 60 }
        },
        successMessage: '¡Ser viable! Puede comprender y transformar sistemas complejos.',
        failureReasons: {
          lowAnalysis: 'No puede analizar la complejidad. Necesita más pensamiento sistémico.',
          lowReflection: 'No reflexiona lo suficiente. Necesita más contemplación.',
          tooAction: 'Actúa sin comprender. Necesita más análisis primero.'
        }
      },

      {
        id: 'artistic-activist',
        name: 'Activista Artístico',
        icon: '🎭',
        description: 'Transformar la realidad social a través del arte y la creatividad',
        longDescription: 'Un ser capaz de usar el arte como herramienta de transformación social, crear experiencias que despierten consciencias, movilizar emociones para el cambio, y comunicar verdades profundas de forma bella.',
        difficulty: 'intermedio',
        requiredAttributes: {
          creativity: 90,
          empathy: 70,
          communication: 80,
          action: 60,
          consciousness: 50
        },
        balanceRequired: {
          'creativity+communication': { min: 160 },
          empathy: { min: 60 },
          action: { min: 50, max: 90 }
        },
        successMessage: '¡Ser viable! Puede transformar el mundo a través del arte.',
        failureReasons: {
          lowCreativity: 'No tiene suficiente imaginación artística.',
          lowCommunication: 'No puede transmitir el mensaje. Necesita más capacidad expresiva.',
          lowEmpathy: 'El arte transformador requiere conexión emocional profunda.'
        }
      },

      {
        id: 'tech-humanist',
        name: 'Tecnólogo Humanista',
        icon: '🤖',
        description: 'Crear tecnología al servicio de la humanidad y el planeta',
        longDescription: 'Un ser capaz de dominar herramientas técnicas, comprender el impacto social de la tecnología, diseñar soluciones éticas, y poner la técnica al servicio del bien común.',
        difficulty: 'avanzado',
        requiredAttributes: {
          technical: 90,
          analysis: 70,
          empathy: 60,
          creativity: 65,
          wisdom: 50,
          strategy: 60
        },
        balanceRequired: {
          technical: { min: 80 },
          'empathy+wisdom': { min: 100 },
          analysis: { min: 60 }
        },
        successMessage: '¡Ser viable! Puede crear tecnología con consciencia humanista.',
        failureReasons: {
          lowTechnical: 'Habilidades técnicas insuficientes.',
          lowEmpathy: 'La tecnología sin empatía es peligrosa.',
          unbalanced: 'Falta equilibrio entre técnica y humanismo.'
        }
      },

      {
        id: 'trauma-healer',
        name: 'Sanador de Traumas',
        icon: '💚',
        description: 'Acompañar procesos de sanación individual y colectiva',
        longDescription: 'Un ser capaz de sostener espacios seguros, comprender el dolor sin dejarse abrumar, facilitar procesos de sanación, integrar herramientas terapéuticas, y mantener la esperanza en la oscuridad.',
        difficulty: 'avanzado',
        requiredAttributes: {
          empathy: 95,
          wisdom: 80,
          resilience: 80,
          consciousness: 70,
          communication: 65
        },
        balanceRequired: {
          'empathy+resilience': { min: 165 },
          wisdom: { min: 70 },
          consciousness: { min: 60 },
          action: { max: 70 }
        },
        successMessage: '¡Ser viable! Puede facilitar sanación profunda con seguridad.',
        failureReasons: {
          lowEmpathy: 'No puede sostener el dolor ajeno.',
          lowResilience: 'La sanación requiere fortaleza interna enorme.',
          lowWisdom: 'Necesita más comprensión profunda del sufrimiento humano.',
          tooAction: 'La sanación requiere presencia, no intervención excesiva.'
        }
      },

      {
        id: 'indigenous-bridge',
        name: 'Puente Intercultural',
        icon: '🌉',
        description: 'Conectar cosmovisiones y construir diálogo entre mundos',
        longDescription: 'Un ser capaz de comprender múltiples epistemologías, honrar sabidurías ancestrales, facilitar diálogo entre culturas, y tejer puentes entre lo moderno y lo tradicional.',
        difficulty: 'avanzado',
        requiredAttributes: {
          wisdom: 85,
          communication: 85,
          empathy: 80,
          connection: 90,
          consciousness: 70,
          reflection: 60
        },
        balanceRequired: {
          'wisdom+connection': { min: 170 },
          communication: { min: 80 },
          empathy: { min: 70 }
        },
        successMessage: '¡Ser viable! Puede tejer puentes entre mundos y cosmovisiones.',
        failureReasons: {
          lowWisdom: 'No comprende la profundidad de las sabidurías ancestrales.',
          lowConnection: 'No siente la interconexión de todas las formas de conocimiento.',
          lowCommunication: 'No puede traducir entre lenguajes culturales diferentes.'
        }
      },

      {
        id: 'youth-mentor',
        name: 'Mentor de Jóvenes',
        icon: '🌱',
        description: 'Guiar y empoderar a las nuevas generaciones',
        longDescription: 'Un ser capaz de conectar con jóvenes, inspirar sin imponer, crear espacios de exploración segura, transmitir herramientas útiles, y confiar en el potencial de cada persona.',
        difficulty: 'intermedio',
        requiredAttributes: {
          empathy: 85,
          communication: 80,
          creativity: 65,
          wisdom: 60,
          resilience: 55,
          collaboration: 70
        },
        balanceRequired: {
          'empathy+communication': { min: 155 },
          wisdom: { min: 50, max: 90 },
          leadership: { max: 60 }
        },
        successMessage: '¡Ser viable! Puede empoderar jóvenes con empatía y creatividad.',
        failureReasons: {
          lowEmpathy: 'No puede conectar con la experiencia juvenil.',
          lowCommunication: 'No puede llegar a los jóvenes de forma efectiva.',
          tooLeadership: 'Demasiado directivo. Los jóvenes necesitan espacio para crecer.'
        }
      },

      {
        id: 'policy-transformer',
        name: 'Transformador de Políticas',
        icon: '📜',
        description: 'Cambiar sistemas desde dentro de las instituciones',
        longDescription: 'Un ser capaz de navegar estructuras de poder, proponer políticas transformadoras, negociar con actores diversos, sostener visión de largo plazo, y lograr cambios sistémicos graduales.',
        difficulty: 'avanzado',
        requiredAttributes: {
          strategy: 90,
          analysis: 80,
          communication: 75,
          resilience: 80,
          collaboration: 70,
          organization: 70
        },
        balanceRequired: {
          'strategy+analysis': { min: 165 },
          resilience: { min: 75 },
          collaboration: { min: 60 },
          wisdom: { min: 40 }
        },
        successMessage: '¡Ser viable! Puede transformar políticas con estrategia y persistencia.',
        failureReasons: {
          lowStrategy: 'No puede navegar la complejidad institucional.',
          lowResilience: 'El cambio institucional requiere resistir frustraciones constantes.',
          lowCollaboration: 'No puede construir coaliciones necesarias para el cambio.'
        }
      },

      {
        id: 'earth-defender',
        name: 'Defensor de la Tierra',
        icon: '🛡️',
        description: 'Proteger ecosistemas y defender los derechos de la naturaleza',
        longDescription: 'Un ser capaz de actuar con valentía ante la destrucción, sostener visión biocéntrica, movilizar comunidades, resistir presiones, y defender lo que no tiene voz.',
        difficulty: 'avanzado',
        requiredAttributes: {
          connection: 95,
          action: 90,
          resilience: 90,
          empathy: 70,
          strategy: 65,
          leadership: 70
        },
        balanceRequired: {
          'connection+empathy': { min: 160 },
          'action+resilience': { min: 175 },
          consciousness: { min: 50 }
        },
        successMessage: '¡Ser viable! Puede defender la Tierra con coraje y amor.',
        failureReasons: {
          lowConnection: 'No siente suficiente amor por la Tierra.',
          lowAction: 'La defensa de la Tierra requiere acción valiente.',
          lowResilience: 'No puede sostener la lucha a largo plazo contra fuerzas destructivas.'
        }
      },

      {
        id: 'ritual-keeper',
        name: 'Guardián de Rituales',
        icon: '🕯️',
        description: 'Sostener espacios sagrados y ceremonias de transformación',
        longDescription: 'Un ser capaz de crear y sostener rituales significativos, honrar lo sagrado en todas sus formas, facilitar transiciones vitales, y mantener conexión con lo misterioso.',
        difficulty: 'intermedio',
        requiredAttributes: {
          consciousness: 85,
          wisdom: 80,
          empathy: 75,
          creativity: 70,
          connection: 80,
          communication: 60
        },
        balanceRequired: {
          'consciousness+wisdom': { min: 160 },
          connection: { min: 75 },
          creativity: { min: 60 },
          action: { max: 60 },
          technical: { max: 40 }
        },
        successMessage: '¡Ser viable! Puede sostener lo sagrado y facilitar transformaciones rituales.',
        failureReasons: {
          lowConsciousness: 'No tiene la presencia necesaria para sostener lo sagrado.',
          lowWisdom: 'Los rituales requieren comprensión profunda de arquetipos.',
          tooAction: 'Demasiado orientado a hacer. Los rituales requieren ser.',
          tooTechnical: 'Los rituales son del corazón, no de la técnica.'
        }
      },

      {
        id: 'crisis-navigator',
        name: 'Navegante de Crisis',
        icon: '⚓',
        description: 'Guiar comunidades a través de colapsos y transiciones',
        longDescription: 'Un ser capaz de mantener la calma en el caos, tomar decisiones bajo presión, sostener esperanza realista, coordinar respuestas colectivas, y transformar crisis en oportunidades.',
        difficulty: 'avanzado',
        requiredAttributes: {
          resilience: 95,
          leadership: 85,
          strategy: 80,
          wisdom: 70,
          organization: 75,
          communication: 70
        },
        balanceRequired: {
          resilience: { min: 90 },
          'leadership+strategy': { min: 160 },
          wisdom: { min: 60 },
          consciousness: { min: 50 }
        },
        successMessage: '¡Ser viable! Puede guiar comunidades a través de colapsos con sabiduría.',
        failureReasons: {
          lowResilience: 'No puede sostener la presión de crisis prolongadas.',
          lowLeadership: 'No puede guiar cuando el pánico se apodera de la gente.',
          lowStrategy: 'Las crisis requieren capacidad estratégica en tiempo real.',
          lowWisdom: 'Sin sabiduría, la crisis solo genera más caos.'
        }
      }
    ];

    // Generate requirements array from requiredAttributes for UI compatibility
    this.missions.forEach(mission => {
      mission.requirements = Object.entries(mission.requiredAttributes || {}).map(([attr, value]) => {
        const attrData = this.attributes[attr];
        return {
          type: attr,
          count: value,
          description: attrData ? `${attrData.icon} ${attrData.name}: ${value}+` : `${attr}: ${value}+`,
          icon: attrData?.icon || '📊'
        };
      });

      // Add minPower from balanceRequired if exists
      if (mission.balanceRequired) {
        Object.entries(mission.balanceRequired).forEach(([key, range]) => {
          if (range.min && !key.includes('+')) {
            // Single attribute minimum
            const attrData = this.attributes[key];
            mission.minPower = (mission.minPower || 0) + range.min;
          }
        });
      }

      // Calculate total minPower from requiredAttributes if not set
      if (!mission.minPower) {
        mission.minPower = Object.values(mission.requiredAttributes || {}).reduce((sum, val) => sum + val, 0);
      }
    });

    this.sortMissionsByDifficulty();

    this.currentMission = null;
    this.createdBeing = null;
  }

  sortMissionsByDifficulty() {
    if (!Array.isArray(this.missions)) return;
    this.missions.sort((a, b) => {
      const rankA = this.difficultyRank[a.difficulty] ?? 99;
      const rankB = this.difficultyRank[b.difficulty] ?? 99;
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return (a.name || '').localeCompare(b.name || '');
    });
  }

  /**
   * Analizar pieza de conocimiento y extraer atributos
   */
  analyzePiece(piece) {
    // piece puede ser: chapter, exercise, resource
    if (piece?.syntheticAttributes) {
      const multiplier = piece.powerMultiplier || 1;
      const adjustedAttributes = {};
      Object.entries(piece.syntheticAttributes).forEach(([attr, value]) => {
        adjustedAttributes[attr] = Math.round(value * multiplier);
      });
      const totalPower = Object.values(adjustedAttributes).reduce((sum, val) => sum + val, 0);
      return {
        piece,
        attributes: adjustedAttributes,
        totalPower,
        powerMultiplier: multiplier,
        quizScore: piece.quizScore,
        quizTotal: piece.quizTotal
      };
    }

    const attributes = {};
    const title = (piece.title || '').toLowerCase();

    // ===== CAPÍTULOS =====
    if (piece.type === 'chapter') {
      // Base común para todos los capítulos
      attributes.reflection = 12;
      attributes.analysis = 8;

      // Análisis por libro de origen (BASADO EN CONTENIDO REAL)
      const bookProfiles = {
        // El Código del Despertar: Consciencia, IA, física cuántica, meditación profunda
        'codigo-despertar': { consciousness: 25, wisdom: 20, reflection: 20, analysis: 15 },

        // La Tierra que Despierta: Ecología profunda, conexión naturaleza, crisis climática
        'tierra-que-despierta': { connection: 30, empathy: 20, consciousness: 15, wisdom: 10 },

        // Manifiesto de la Conciencia Compartida: Análisis político-social profundo, pensamiento crítico, visión sistémica
        'manifiesto': { analysis: 25, reflection: 22, creativity: 12, strategy: 12 },

        // Guía de Acciones Transformadoras: Activismo práctico, estrategias de cambio, organización comunitaria
        'guia-acciones': { action: 30, strategy: 20, organization: 18, leadership: 15 },

        // Manual Práctico: 50+ prácticas de meditación, ejercicios guiados, herramientas concretas
        'manual-practico': { action: 28, technical: 22, consciousness: 15, organization: 12 },

        // Manual de Transición: Estrategia de cambio sistémico, resiliencia, adaptación, transiciones
        'manual-transicion': { strategy: 28, resilience: 22, collaboration: 18, organization: 15 },

        // Toolkit Transición: 22 ejercicios prácticos, herramientas técnicas, frameworks aplicables
        'toolkit-transicion': { technical: 30, organization: 25, strategy: 18, action: 12 },

        // Prácticas Radicales: Experimentación radical, acción directa contemplativa, confrontación, valentía
        'practicas-radicales': { action: 32, resilience: 25, creativity: 18, courage: 20 },

        // Filosofía del Nuevo Ser: Sabiduría profunda, ontología, reflexión filosófica transformadora
        'filosofia-nuevo-ser': { wisdom: 32, reflection: 28, consciousness: 22, analysis: 15 },

        // Ahora las Instituciones: Transformación institucional, gobernanza, liderazgo sistémico
        'ahora-instituciones': { strategy: 30, collaboration: 25, organization: 22, communication: 18, leadership: 15 },

        // Diálogos con la Máquina: IA y conciencia, diálogo profundo, relación humano-máquina
        'dialogos-maquina': { analysis: 28, reflection: 25, communication: 22, consciousness: 18 }
      };

      // Aplicar perfil del libro
      if (bookProfiles[piece.bookId]) {
        Object.entries(bookProfiles[piece.bookId]).forEach(([attr, value]) => {
          attributes[attr] = (attributes[attr] || 0) + value;
        });
      }

      // Análisis semántico del título (palabras clave)
      const titleKeywords = {
        // Consciencia y sabiduría
        'despertar|consciencia|conciencia|iluminación|ser|esencia': { consciousness: 15, wisdom: 10 },
        'meditación|meditar|contemplación|mindfulness': { consciousness: 20, reflection: 15 },
        'sabiduría|sabio|filosofía|enseñanza': { wisdom: 18, reflection: 12 },

        // Acción y cambio
        'acción|actuar|hacer|transformar|cambio': { action: 20, resilience: 10 },
        'activismo|movimiento|lucha|resistencia': { action: 22, resilience: 15, leadership: 10 },
        'práctica|ejercicio|implementar|aplicar': { action: 18, technical: 12 },

        // Conexión y empatía
        'comunidad|colectivo|juntos|red|conexión': { connection: 18, collaboration: 15 },
        'empatía|compasión|amor|cuidado|ternura': { empathy: 20, connection: 12 },
        'ecología|tierra|naturaleza|biosfera': { connection: 22, wisdom: 10 },

        // Estrategia y organización
        'estrategia|plan|diseño|arquitectura': { strategy: 20, analysis: 12 },
        'organización|estructura|sistema|orden': { organization: 18, strategy: 12 },
        'herramienta|método|técnica|proceso': { technical: 18, organization: 10 },

        // Creatividad y comunicación
        'creatividad|creativo|imaginar|innovar': { creativity: 20, analysis: 8 },
        'comunicación|diálogo|conversación|hablar': { communication: 20, empathy: 12 },
        'arte|belleza|estética|expresión': { creativity: 18, empathy: 10 },

        // Liderazgo y colaboración
        'liderazgo|líder|guiar|dirigir': { leadership: 20, strategy: 12 },
        'colaboración|cooperar|trabajar|equipo': { collaboration: 20, communication: 10 },
        'facilitar|mediar|coordinar': { communication: 18, organization: 12 }
      };

      // Aplicar bonificaciones por palabras clave en el título
      Object.entries(titleKeywords).forEach(([pattern, bonuses]) => {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(title)) {
          Object.entries(bonuses).forEach(([attr, value]) => {
            attributes[attr] = (attributes[attr] || 0) + value;
          });
        }
      });

      // Tags adicionales
      if (piece.tags) {
        const tagBonus = {
          'práctica': { action: 15, technical: 8 },
          'meditación': { consciousness: 20, reflection: 12 },
          'ecología': { connection: 18, empathy: 10 },
          'activismo': { action: 20, resilience: 12 },
          'comunicación': { communication: 18, empathy: 10 },
          'transformación': { consciousness: 12, action: 8 }
        };

        piece.tags.forEach(tag => {
          if (tagBonus[tag]) {
            Object.entries(tagBonus[tag]).forEach(([attr, value]) => {
              attributes[attr] = (attributes[attr] || 0) + value;
            });
          }
        });
      }
    }

    // ===== EJERCICIOS =====
    else if (piece.type === 'exercise') {
      // Base para ejercicios (siempre prácticos)
      attributes.action = 20;
      attributes.resilience = 12;

      // Categorías de ejercicios
      const exerciseCategories = {
        meditation: { consciousness: 35, reflection: 25, wisdom: 15 },
        dialogue: { communication: 35, empathy: 25, collaboration: 15 },
        planning: { strategy: 30, organization: 25, analysis: 15 },
        practice: { action: 30, resilience: 20, technical: 15 },
        reflection: { reflection: 35, wisdom: 20, consciousness: 15 },
        creative: { creativity: 35, empathy: 20, communication: 15 },
        community: { collaboration: 35, connection: 25, empathy: 15 }
      };

      if (piece.category && exerciseCategories[piece.category]) {
        Object.entries(exerciseCategories[piece.category]).forEach(([attr, value]) => {
          attributes[attr] = (attributes[attr] || 0) + value;
        });
      }

      // Duración del ejercicio influye en profundidad
      if (piece.duration) {
        const minutes = parseInt(piece.duration);
        if (minutes >= 30) {
          // Ejercicios largos dan más profundidad
          attributes.consciousness = (attributes.consciousness || 0) + 10;
          attributes.wisdom = (attributes.wisdom || 0) + 8;
        }
      }
    }

    // ===== RECURSOS =====
    else if (piece.type === 'resource') {
      // Base para recursos
      attributes.technical = 15;
      attributes.organization = 10;

      const resourceCategories = {
        tools: { technical: 30, organization: 20, action: 10 },
        frameworks: { analysis: 28, strategy: 22, technical: 15 },
        practices: { action: 28, resilience: 18, technical: 12 },
        guides: { organization: 25, strategy: 18, communication: 12 },
        templates: { organization: 30, technical: 20, strategy: 10 },
        methods: { strategy: 28, analysis: 20, organization: 15 },
        connections: { connection: 30, collaboration: 22, communication: 15 },
        research: { analysis: 32, reflection: 20, wisdom: 12 }
      };

      if (piece.category && resourceCategories[piece.category]) {
        Object.entries(resourceCategories[piece.category]).forEach(([attr, value]) => {
          attributes[attr] = (attributes[attr] || 0) + value;
        });
      }

      // Análisis del título del recurso
      if (title.includes('comunidad') || title.includes('red')) {
        attributes.collaboration = (attributes.collaboration || 0) + 15;
        attributes.connection = (attributes.connection || 0) + 12;
      }
      if (title.includes('ecología') || title.includes('regeneración')) {
        attributes.connection = (attributes.connection || 0) + 18;
        attributes.wisdom = (attributes.wisdom || 0) + 10;
      }
    }

    // Calcular poder base
    let totalPower = Object.values(attributes).reduce((sum, val) => sum + val, 0);

    // Aplicar multiplicador de poder del quiz si existe
    const powerMultiplier = piece.powerMultiplier || 1.0;
    const adjustedAttributes = {};

    Object.entries(attributes).forEach(([attr, value]) => {
      adjustedAttributes[attr] = Math.round(value * powerMultiplier);
    });

    totalPower = Math.round(totalPower * powerMultiplier);

    return {
      piece: piece,
      attributes: adjustedAttributes,
      totalPower: totalPower,
      powerMultiplier: powerMultiplier,
      quizScore: piece.quizScore,
      quizTotal: piece.quizTotal
    };
  }

  /**
   * Validar si un ser puede completar una misión
   */
  validateBeingForMission(being, mission) {
    const results = {
      viable: true,
      score: 0,
      maxScore: 0,
      missingAttributes: [],
      balanceIssues: [],
      strengths: [],
      warnings: []
    };

    // 1. Verificar atributos mínimos requeridos
    Object.entries(mission.requiredAttributes).forEach(([attr, required]) => {
      const current = being.attributes[attr] || 0;
      results.maxScore += required;

      if (current >= required) {
        results.score += current;
        if (current >= required * 1.5) {
          results.strengths.push({
            attribute: attr,
            value: current,
            message: `Excelente ${this.attributes[attr].name}: ${current}/${required}`
          });
        }
      } else {
        results.viable = false;
        results.missingAttributes.push({
          attribute: attr,
          current: current,
          required: required,
          deficit: required - current,
          message: `${this.attributes[attr].icon} ${this.attributes[attr].name}: ${current}/${required} (-${required - current})`
        });
      }
    });

    // 2. Verificar balance requerido
    if (mission.balanceRequired) {
      Object.entries(mission.balanceRequired).forEach(([key, range]) => {
        let value = 0;

        // Puede ser suma de atributos o atributo individual
        if (key.includes('+')) {
          const attrs = key.split('+');
          value = attrs.reduce((sum, attr) => sum + (being.attributes[attr] || 0), 0);
        } else {
          value = being.attributes[key] || 0;
        }

        if (range.min !== undefined && value < range.min) {
          results.viable = false;
          results.balanceIssues.push({
            key: key,
            value: value,
            required: range.min,
            type: 'min',
            message: `${key} demasiado bajo: ${value} < ${range.min}`
          });
        }

        if (range.max !== undefined && value > range.max) {
          results.viable = false;
          results.balanceIssues.push({
            key: key,
            value: value,
            required: range.max,
            type: 'max',
            message: `${key} demasiado alto: ${value} > ${range.max}`
          });
        }
      });
    }

    // 3. Calcular puntuación final
    results.percentage = Math.round((results.score / results.maxScore) * 100);
    results.grade = this.getGrade(results.percentage);

    return results;
  }

  /**
   * Obtener calificación
   */
  getGrade(percentage) {
    if (percentage >= 95) return { letter: 'S', color: '#fbbf24', name: 'Excepcional' };
    if (percentage >= 85) return { letter: 'A', color: '#10b981', name: 'Excelente' };
    if (percentage >= 75) return { letter: 'B', color: '#06b6d4', name: 'Muy Bueno' };
    if (percentage >= 65) return { letter: 'C', color: '#8b5cf6', name: 'Bueno' };
    if (percentage >= 50) return { letter: 'D', color: '#f59e0b', name: 'Suficiente' };
    return { letter: 'F', color: '#ef4444', name: 'Insuficiente' };
  }

  /**
   * Crear ser a partir de piezas seleccionadas
   * @param {Array} pieces - Piezas analizadas que componen el ser
   * @param {string} name - Nombre del ser
   * @param {Object} existingData - Datos existentes para restaurar (opcional)
   */
  createBeing(pieces, name = 'Ser sin nombre', existingData = null) {
    const config = this.progressionConfig;

    const being = {
      // Identidad
      id: existingData?.id || `being_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name,
      pieces: pieces,
      createdAt: existingData?.createdAt || new Date().toISOString(),

      // Atributos base (calculados de piezas)
      attributes: {},
      baseAttributes: {}, // Atributos sin bonificaciones
      totalPower: 0,
      balance: {},

      // Sistema de Progresión
      level: existingData?.level || 1,
      xp: existingData?.xp || 0,
      xpToNextLevel: config.xpPerLevel(existingData?.level || 1),

      // Sistema de Energía
      energy: existingData?.energy ?? config.maxEnergy,
      maxEnergy: config.maxEnergy,
      lastEnergyUpdate: existingData?.lastEnergyUpdate || Date.now(),

      // Estado actual
      status: existingData?.status || 'idle', // idle, deployed, recovering, exhausted
      statusMessage: 'Listo para misión',

      // Misión actual
      currentMission: existingData?.currentMission || null,
      missionStartedAt: existingData?.missionStartedAt || null,
      turnsRemaining: existingData?.turnsRemaining || 0,
      turnsTotal: existingData?.turnsTotal || 0,

      // Historial básico
      stats: existingData?.stats || {
        missionsCompleted: 0,
        missionsSuccess: 0,
        missionsFailed: 0,
        totalTurnsPlayed: 0,
        challengesCompleted: 0,
        hybridChildren: 0,
        totalXpEarned: 0
      },

      // NUEVO: Estadísticas avanzadas
      advancedStats: existingData?.advancedStats || {
        averageTurnsPerMission: 0,
        fastestMission: null,                    // { id, name, turns, date }
        slowestMission: null,                    // { id, name, turns, date }
        longestStreak: 0,                        // Misiones consecutivas exitosas
        currentStreak: 0,
        totalPlayTimeMs: 0,                      // Tiempo total en milisegundos
        lastPlayedAt: null,
        efficiencyScore: 0,                      // % de turnos aprovechados
        favoriteTimeOfDay: null,                 // morning, afternoon, evening, night
        missionHistory: [],                      // Últimas 20 misiones
        levelUpHistory: []                       // Historial de subidas de nivel
      },

      // Relaciones (para microsociedades)
      relationships: existingData?.relationships || {},

      // Rasgos especiales (desbloqueables por nivel/misiones)
      traits: existingData?.traits || [],

      // NUEVO: Habilidades especiales (desbloqueables por nivel)
      abilities: existingData?.abilities || [],

      // NUEVO: Afinidades (calculadas de las piezas)
      affinities: existingData?.affinities || {
        missions: [],      // Misiones donde tiene bonus
        pieceTypes: [],    // Tipos de pieza preferidos
        bookIds: [],       // Libros afines
        attributes: []     // Atributos dominantes
      },

      // NUEVO: Especialidad (auto-detectada)
      specialty: existingData?.specialty || null,

      // NUEVO: Estado emocional/mood
      mood: existingData?.mood || 'neutral',
      moodEffects: existingData?.moodEffects || { xpMultiplier: 1.0, energyCost: 1.0 },

      // NUEVO: Logros desbloqueados
      achievements: existingData?.achievements || [],

      // Generación (para híbridos)
      generation: existingData?.generation || 1,
      parentIds: existingData?.parentIds || []
    };

    // Sumar atributos de todas las piezas
    pieces.forEach(pieceData => {
      Object.entries(pieceData.attributes).forEach(([attr, value]) => {
        being.baseAttributes[attr] = (being.baseAttributes[attr] || 0) + value;
        being.attributes[attr] = (being.attributes[attr] || 0) + value;
      });
      being.totalPower += pieceData.totalPower;
    });

    // Aplicar bonificaciones por nivel
    const levelBonus = (being.level - 1) * config.attributeBonusPerLevel;
    if (levelBonus > 0) {
      Object.keys(being.attributes).forEach(attr => {
        being.attributes[attr] += levelBonus;
      });
      being.totalPower += levelBonus * Object.keys(being.attributes).length;
    }

    // Calcular balance
    being.balance = this.calculateBalance(being.attributes);

    // Calcular afinidades basadas en las piezas
    being.affinities = this.calculateAffinities(pieces, being.attributes);

    // Detectar especialidad
    being.specialty = this.detectSpecialty(being.balance);

    // Calcular habilidades desbloqueadas por nivel
    being.abilities = this.calculateAbilities(being.level, being.traits);

    // Actualizar mood basado en energía y stats
    this.updateMood(being);

    // Actualizar energía basada en tiempo transcurrido
    this.updateBeingEnergy(being);

    return being;
  }

  /**
   * Calcular afinidades del ser basadas en sus piezas y atributos
   */
  calculateAffinities(pieces, attributes) {
    const affinities = {
      missions: [],
      pieceTypes: [],
      bookIds: [],
      attributes: []
    };

    // Contar tipos de pieza
    const pieceTypeCounts = { chapter: 0, exercise: 0, resource: 0 };
    const bookCounts = {};

    pieces.forEach(piece => {
      const pieceInfo = piece.piece || piece;
      if (pieceInfo.type) {
        pieceTypeCounts[pieceInfo.type] = (pieceTypeCounts[pieceInfo.type] || 0) + 1;
      }
      if (pieceInfo.bookId) {
        bookCounts[pieceInfo.bookId] = (bookCounts[pieceInfo.bookId] || 0) + 1;
      }
    });

    // Tipos de pieza preferidos (más del 40%)
    const totalPieces = pieces.length || 1;
    Object.entries(pieceTypeCounts).forEach(([type, count]) => {
      if (count / totalPieces >= 0.4) {
        affinities.pieceTypes.push(type);
      }
    });

    // Libros afines (al menos 2 piezas)
    affinities.bookIds = Object.entries(bookCounts)
      .filter(([_, count]) => count >= 2)
      .map(([bookId]) => bookId)
      .slice(0, 3);

    // Atributos dominantes (top 3)
    affinities.attributes = Object.entries(attributes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([attr]) => attr);

    // Misiones afines (basadas en atributos dominantes)
    affinities.missions = this.findAffineMissions(attributes).slice(0, 5);

    return affinities;
  }

  /**
   * Encontrar misiones afines basadas en atributos
   */
  findAffineMissions(attributes) {
    return this.missions
      .map(mission => {
        let score = 0;
        let totalRequired = 0;
        Object.entries(mission.requiredAttributes).forEach(([attr, required]) => {
          const current = attributes[attr] || 0;
          totalRequired += required;
          score += Math.min(current, required * 1.5);
        });
        return { id: mission.id, score: score / totalRequired };
      })
      .filter(m => m.score >= 0.7)
      .sort((a, b) => b.score - a.score)
      .map(m => m.id);
  }

  /**
   * Detectar especialidad del ser
   */
  detectSpecialty(balance) {
    const categories = {
      intellectual: { name: 'Pensador', icon: '🧠' },
      emotional: { name: 'Empático', icon: '❤️' },
      action: { name: 'Activista', icon: '⚡' },
      spiritual: { name: 'Contemplativo', icon: '🌟' },
      practical: { name: 'Práctico', icon: '🔧' }
    };

    // Encontrar dominante
    let maxKey = 'intellectual';
    let maxValue = 0;
    const values = [];

    Object.entries(categories).forEach(([key]) => {
      const value = balance[key] || 0;
      values.push(value);
      if (value > maxValue) {
        maxValue = value;
        maxKey = key;
      }
    });

    // Verificar si está equilibrado
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const isBalanced = values.every(v => avg > 0 && Math.abs(v - avg) / avg < 0.2);

    if (isBalanced) {
      return { key: 'balanced', name: 'Equilibrado', icon: '☯️' };
    }

    return { key: maxKey, ...categories[maxKey] };
  }

  /**
   * Calcular habilidades desbloqueadas por nivel
   */
  calculateAbilities(level, traits = []) {
    const allAbilities = [
      { id: 'quick-learner', name: 'Aprendiz Rápido', effect: '+10% XP', unlockLevel: 3, icon: '📚' },
      { id: 'energy-efficient', name: 'Eficiente', effect: '-10% energía', unlockLevel: 5, icon: '🔋' },
      { id: 'turn-saver', name: 'Ahorra Turnos', effect: '-1 turno misión', unlockLevel: 7, icon: '⏱️' },
      { id: 'resilient', name: 'Resiliente', effect: '+15% recuperación', unlockLevel: 10, icon: '💪' },
      { id: 'mission-expert', name: 'Experto', effect: '+15% éxito', unlockLevel: 12, icon: '🎯' },
      { id: 'double-xp', name: 'Doble XP', effect: '2x XP una vez/día', unlockLevel: 15, icon: '✨' },
      { id: 'master-crafter', name: 'Maestro', effect: '+20% poder piezas', unlockLevel: 20, icon: '👑' }
    ];

    // Habilidades por nivel
    const unlockedByLevel = allAbilities
      .filter(a => level >= a.unlockLevel)
      .map(a => ({ ...a, unlocked: true, source: 'level' }));

    // Habilidades por rasgos
    const traitAbilities = [];
    if (traits.includes('veteran')) {
      traitAbilities.push({ id: 'veteran-insight', name: 'Visión Veterana', effect: '+5% todos atributos', unlocked: true, source: 'trait', icon: '🏅' });
    }
    if (traits.includes('master')) {
      traitAbilities.push({ id: 'master-touch', name: 'Toque Maestro', effect: 'Misiones experto -15% energía', unlocked: true, source: 'trait', icon: '👑' });
    }

    return [...unlockedByLevel, ...traitAbilities];
  }

  /**
   * Actualizar mood del ser basado en su estado
   */
  updateMood(being) {
    const energyPercent = (being.energy / being.maxEnergy) * 100;
    const successRate = being.stats.missionsCompleted > 0
      ? (being.stats.missionsSuccess / being.stats.missionsCompleted) * 100
      : 100;

    // Determinar mood
    if (energyPercent < 20) {
      being.mood = 'exhausted';
      being.moodEffects = { xpMultiplier: 0.8, energyCost: 1.2 };
    } else if (energyPercent < 40) {
      being.mood = 'tired';
      being.moodEffects = { xpMultiplier: 0.9, energyCost: 1.1 };
    } else if (successRate >= 90 && being.stats.missionsCompleted >= 3) {
      being.mood = 'confident';
      being.moodEffects = { xpMultiplier: 1.15, energyCost: 0.95 };
    } else if (being.advancedStats?.currentStreak >= 3) {
      being.mood = 'focused';
      being.moodEffects = { xpMultiplier: 1.1, energyCost: 0.9 };
    } else if (energyPercent >= 80) {
      being.mood = 'energized';
      being.moodEffects = { xpMultiplier: 1.05, energyCost: 0.95 };
    } else {
      being.mood = 'neutral';
      being.moodEffects = { xpMultiplier: 1.0, energyCost: 1.0 };
    }

    return being.mood;
  }

  /**
   * Actualizar energía del ser basada en tiempo transcurrido
   */
  updateBeingEnergy(being) {
    const now = Date.now();
    const hoursPassed = (now - being.lastEnergyUpdate) / (1000 * 60 * 60);
    const energyRecovered = Math.floor(hoursPassed * this.progressionConfig.energyRecoveryPerHour);

    if (energyRecovered > 0) {
      being.energy = Math.min(being.maxEnergy, being.energy + energyRecovered);
      being.lastEnergyUpdate = now;

      // Actualizar estado si estaba recuperándose
      if (being.status === 'recovering' && being.energy >= being.maxEnergy * 0.5) {
        being.status = 'idle';
        being.statusMessage = 'Listo para misión';
      }
    }

    return being;
  }

  /**
   * Iniciar misión para un ser
   */
  startMission(being, mission) {
    const config = this.progressionConfig;
    const energyCost = config.energyCostPerMission[mission.difficulty] || 25;

    if (being.energy < energyCost) {
      return {
        success: false,
        error: 'insufficient_energy',
        message: `Energía insuficiente. Necesitas ${energyCost}, tienes ${being.energy}.`,
        energyNeeded: energyCost,
        energyCurrent: being.energy
      };
    }

    // Consumir energía
    being.energy -= energyCost;
    being.lastEnergyUpdate = Date.now();

    // Configurar misión
    const baseTurns = config.turnsPerDifficulty[mission.difficulty] || 15;
    being.currentMission = mission.id;
    being.missionStartedAt = Date.now();
    being.turnsTotal = baseTurns;
    being.turnsRemaining = baseTurns;
    being.status = 'deployed';
    being.statusMessage = `En misión: ${mission.name}`;

    return {
      success: true,
      message: `Misión iniciada. ${baseTurns} turnos para completar.`,
      turnsTotal: baseTurns,
      energySpent: energyCost,
      energyRemaining: being.energy
    };
  }

  /**
   * Procesar un turno de misión
   */
  processMissionTurn(being, mission, challengeResult = null) {
    if (being.status !== 'deployed' || !being.currentMission) {
      return { success: false, error: 'not_in_mission' };
    }

    being.turnsRemaining--;
    being.stats.totalTurnsPlayed++;

    // Procesar resultado del reto si lo hubo
    if (challengeResult) {
      if (challengeResult.success) {
        being.stats.challengesCompleted++;
      }
    }

    // Verificar si la misión terminó
    if (being.turnsRemaining <= 0) {
      return this.completeMission(being, mission, true);
    }

    return {
      success: true,
      turnsRemaining: being.turnsRemaining,
      turnsTotal: being.turnsTotal,
      progress: ((being.turnsTotal - being.turnsRemaining) / being.turnsTotal) * 100
    };
  }

  /**
   * Completar misión con estadísticas avanzadas
   */
  completeMission(being, mission, success = true) {
    const config = this.progressionConfig;
    const turnsUsed = being.turnsTotal - being.turnsRemaining;
    const missionDuration = being.missionStartedAt ? Date.now() - being.missionStartedAt : 0;

    being.stats.missionsCompleted++;

    let xpEarned = 0;
    let rewards = {};

    if (success) {
      being.stats.missionsSuccess++;
      xpEarned = config.xpPerDifficulty[mission.difficulty] || 100;

      // Aplicar multiplicador de mood
      xpEarned = Math.round(xpEarned * (being.moodEffects?.xpMultiplier || 1.0));

      // Bonus por turnos sobrantes
      if (being.turnsRemaining > 0) {
        xpEarned += being.turnsRemaining * 5;
      }

      // Actualizar estadísticas avanzadas
      this.updateAdvancedStats(being, mission, turnsUsed, missionDuration, true);

      rewards = {
        xp: xpEarned,
        trait: this.checkTraitUnlock(being, mission),
        achievement: this.checkAchievementUnlock(being, mission)
      };
    } else {
      being.stats.missionsFailed++;
      xpEarned = Math.floor((config.xpPerDifficulty[mission.difficulty] || 100) * 0.25);

      // Actualizar estadísticas avanzadas (fallo)
      this.updateAdvancedStats(being, mission, turnsUsed, missionDuration, false);
    }

    // Aplicar XP y verificar level up
    const levelUpResult = this.addXpToBeing(being, xpEarned);

    // Resetear estado de misión
    being.currentMission = null;
    being.missionStartedAt = null;
    being.turnsRemaining = 0;
    being.turnsTotal = 0;
    being.status = being.energy < being.maxEnergy * 0.3 ? 'recovering' : 'idle';
    being.statusMessage = being.status === 'recovering' ? 'Recuperándose...' : 'Listo para misión';

    // Actualizar mood después de completar misión
    this.updateMood(being);

    return {
      success: success,
      xpEarned: xpEarned,
      levelUp: levelUpResult.leveledUp,
      newLevel: being.level,
      rewards: rewards,
      advancedStats: being.advancedStats
    };
  }

  /**
   * Actualizar estadísticas avanzadas después de una misión
   */
  updateAdvancedStats(being, mission, turnsUsed, durationMs, success) {
    const stats = being.advancedStats || {};

    // Tiempo de juego
    stats.totalPlayTimeMs = (stats.totalPlayTimeMs || 0) + durationMs;
    stats.lastPlayedAt = new Date().toISOString();

    // Determinar hora del día favorita
    const hour = new Date().getHours();
    const timeOfDay = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    stats.timeOfDayCounts = stats.timeOfDayCounts || {};
    stats.timeOfDayCounts[timeOfDay] = (stats.timeOfDayCounts[timeOfDay] || 0) + 1;
    stats.favoriteTimeOfDay = Object.entries(stats.timeOfDayCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    // Promedio de turnos por misión
    const totalMissions = being.stats.missionsCompleted;
    stats.averageTurnsPerMission = totalMissions > 0
      ? ((stats.averageTurnsPerMission || 0) * (totalMissions - 1) + turnsUsed) / totalMissions
      : turnsUsed;

    // Misión más rápida/lenta
    if (success) {
      if (!stats.fastestMission || turnsUsed < stats.fastestMission.turns) {
        stats.fastestMission = {
          id: mission.id,
          name: mission.name,
          turns: turnsUsed,
          date: new Date().toISOString()
        };
      }
      if (!stats.slowestMission || turnsUsed > stats.slowestMission.turns) {
        stats.slowestMission = {
          id: mission.id,
          name: mission.name,
          turns: turnsUsed,
          date: new Date().toISOString()
        };
      }
    }

    // Racha de misiones exitosas
    if (success) {
      stats.currentStreak = (stats.currentStreak || 0) + 1;
      if (stats.currentStreak > (stats.longestStreak || 0)) {
        stats.longestStreak = stats.currentStreak;
      }
    } else {
      stats.currentStreak = 0;
    }

    // Eficiencia (turnos usados vs turnos asignados)
    const efficiency = turnsUsed > 0 ? (being.turnsTotal / turnsUsed) * 100 : 100;
    const prevEfficiency = stats.efficiencyScore || 100;
    stats.efficiencyScore = Math.round((prevEfficiency * (totalMissions - 1) + efficiency) / totalMissions);

    // Historial de misiones (últimas 20)
    stats.missionHistory = stats.missionHistory || [];
    stats.missionHistory.unshift({
      missionId: mission.id,
      missionName: mission.name,
      difficulty: mission.difficulty,
      turnsUsed,
      success,
      xpEarned: being.stats.totalXpEarned,
      date: new Date().toISOString()
    });
    if (stats.missionHistory.length > 20) {
      stats.missionHistory.pop();
    }

    being.advancedStats = stats;
    return stats;
  }

  /**
   * Verificar si se desbloquea un logro
   */
  checkAchievementUnlock(being, mission) {
    const unlockedAchievements = [];
    const achievements = being.achievements || [];
    const stats = being.stats;
    const advStats = being.advancedStats || {};

    // Definición de logros
    const achievementDefs = [
      { id: 'first-mission', name: 'Primer Paso', desc: 'Completa tu primera misión', condition: () => stats.missionsCompleted === 1, icon: '🎯' },
      { id: 'five-missions', name: 'Constante', desc: 'Completa 5 misiones', condition: () => stats.missionsCompleted >= 5, icon: '⭐' },
      { id: 'ten-missions', name: 'Comprometido', desc: 'Completa 10 misiones', condition: () => stats.missionsCompleted >= 10, icon: '🏆' },
      { id: 'perfect-rate', name: 'Perfeccionista', desc: '100% tasa de éxito con 5+ misiones', condition: () => stats.missionsCompleted >= 5 && stats.missionsSuccess === stats.missionsCompleted, icon: '💎' },
      { id: 'speed-demon', name: 'Veloz', desc: 'Completa misión en 5 turnos o menos', condition: () => advStats.fastestMission?.turns <= 5, icon: '⚡' },
      { id: 'streak-3', name: 'En Racha', desc: 'Racha de 3 misiones exitosas', condition: () => advStats.currentStreak >= 3, icon: '🔥' },
      { id: 'streak-5', name: 'Imparable', desc: 'Racha de 5 misiones exitosas', condition: () => advStats.currentStreak >= 5, icon: '🌟' },
      { id: 'expert-complete', name: 'Experto', desc: 'Completa una misión de dificultad experto', condition: () => mission.difficulty === 'experto', icon: '👑' },
      { id: 'level-5', name: 'Evolucionando', desc: 'Alcanza nivel 5', condition: () => being.level >= 5, icon: '📈' },
      { id: 'level-10', name: 'Experimentado', desc: 'Alcanza nivel 10', condition: () => being.level >= 10, icon: '🚀' },
      { id: 'efficient', name: 'Eficiente', desc: 'Mantén 90%+ eficiencia', condition: () => advStats.efficiencyScore >= 90, icon: '🎖️' }
    ];

    // Verificar cada logro
    achievementDefs.forEach(def => {
      if (!achievements.find(a => a.id === def.id) && def.condition()) {
        const newAchievement = {
          id: def.id,
          name: def.name,
          description: def.desc,
          icon: def.icon,
          unlockedAt: new Date().toISOString()
        };
        being.achievements.push(newAchievement);
        unlockedAchievements.push(newAchievement);
      }
    });

    return unlockedAchievements.length > 0 ? unlockedAchievements : null;
  }

  /**
   * Añadir XP a un ser y verificar level up
   */
  addXpToBeing(being, xpAmount) {
    being.xp += xpAmount;
    being.stats.totalXpEarned += xpAmount;

    let leveledUp = false;
    let levelsGained = 0;

    while (being.xp >= being.xpToNextLevel) {
      being.xp -= being.xpToNextLevel;
      being.level++;
      levelsGained++;
      being.xpToNextLevel = this.progressionConfig.xpPerLevel(being.level);
      leveledUp = true;

      // Aplicar bonus de nivel a atributos
      const bonus = this.progressionConfig.attributeBonusPerLevel;
      Object.keys(being.attributes).forEach(attr => {
        being.attributes[attr] += bonus;
      });
      being.totalPower += bonus * Object.keys(being.attributes).length;

      // Aumentar energía máxima cada 5 niveles
      if (being.level % 5 === 0) {
        being.maxEnergy += 10;
        being.energy = being.maxEnergy; // Rellenar energía al subir
      }
    }

    // Recalcular balance
    being.balance = this.calculateBalance(being.attributes);

    return {
      leveledUp,
      levelsGained,
      newLevel: being.level,
      xpCurrent: being.xp,
      xpToNext: being.xpToNextLevel
    };
  }

  /**
   * Verificar si se desbloquea un rasgo especial
   */
  checkTraitUnlock(being, mission) {
    const unlockedTraits = [];

    // Rasgos por misiones completadas
    if (being.stats.missionsCompleted === 1 && !being.traits.includes('novice')) {
      being.traits.push('novice');
      unlockedTraits.push({ id: 'novice', name: 'Novato', icon: '🌱' });
    }
    if (being.stats.missionsCompleted === 5 && !being.traits.includes('experienced')) {
      being.traits.push('experienced');
      unlockedTraits.push({ id: 'experienced', name: 'Experimentado', icon: '⭐' });
    }
    if (being.stats.missionsCompleted === 10 && !being.traits.includes('veteran')) {
      being.traits.push('veteran');
      unlockedTraits.push({ id: 'veteran', name: 'Veterano', icon: '🏅' });
    }

    // Rasgos por dificultad
    if (mission.difficulty === 'avanzado' && !being.traits.includes('brave')) {
      being.traits.push('brave');
      unlockedTraits.push({ id: 'brave', name: 'Valiente', icon: '🦁' });
    }
    if (mission.difficulty === 'experto' && !being.traits.includes('master')) {
      being.traits.push('master');
      unlockedTraits.push({ id: 'master', name: 'Maestro', icon: '👑' });
    }

    // Rasgos por tasa de éxito
    const successRate = being.stats.missionsSuccess / being.stats.missionsCompleted;
    if (being.stats.missionsCompleted >= 5 && successRate >= 0.9 && !being.traits.includes('reliable')) {
      being.traits.push('reliable');
      unlockedTraits.push({ id: 'reliable', name: 'Confiable', icon: '🎯' });
    }

    return unlockedTraits.length > 0 ? unlockedTraits : null;
  }

  /**
   * Obtener información completa del estado del ser
   */
  getBeingStatus(being) {
    this.updateBeingEnergy(being);

    const successRate = being.stats.missionsCompleted > 0
      ? Math.round((being.stats.missionsSuccess / being.stats.missionsCompleted) * 100)
      : 0;

    return {
      // Identidad
      id: being.id,
      name: being.name,
      generation: being.generation,

      // Progresión
      level: being.level,
      xp: being.xp,
      xpToNextLevel: being.xpToNextLevel,
      xpProgress: Math.round((being.xp / being.xpToNextLevel) * 100),

      // Energía
      energy: being.energy,
      maxEnergy: being.maxEnergy,
      energyPercent: Math.round((being.energy / being.maxEnergy) * 100),

      // Estado
      status: being.status,
      statusMessage: being.statusMessage,
      canStartMission: being.status === 'idle' && being.energy >= 15,

      // Misión actual
      inMission: being.status === 'deployed',
      currentMission: being.currentMission,
      turnsRemaining: being.turnsRemaining,
      turnsTotal: being.turnsTotal,
      missionProgress: being.turnsTotal > 0
        ? Math.round(((being.turnsTotal - being.turnsRemaining) / being.turnsTotal) * 100)
        : 0,

      // Estadísticas
      missionsCompleted: being.stats.missionsCompleted,
      successRate: successRate,
      totalXp: being.stats.totalXpEarned,

      // Rasgos
      traits: being.traits,
      traitCount: being.traits.length,

      // Poder
      totalPower: being.totalPower,
      balance: being.balance
    };
  }

  /**
   * Calcular balance general del ser
   */
  calculateBalance(attributes) {
    const balance = {
      intellectual: 0,    // reflection + analysis + creativity
      emotional: 0,       // empathy + communication + leadership
      action: 0,          // action + resilience + strategy
      spiritual: 0,       // consciousness + connection + wisdom
      practical: 0,       // organization + collaboration + technical
      total: 0,
      harmony: 0
    };

    balance.intellectual = (attributes.reflection || 0) + (attributes.analysis || 0) + (attributes.creativity || 0);
    balance.emotional = (attributes.empathy || 0) + (attributes.communication || 0) + (attributes.leadership || 0);
    balance.action = (attributes.action || 0) + (attributes.resilience || 0) + (attributes.strategy || 0);
    balance.spiritual = (attributes.consciousness || 0) + (attributes.connection || 0) + (attributes.wisdom || 0);
    balance.practical = (attributes.organization || 0) + (attributes.collaboration || 0) + (attributes.technical || 0);

    balance.total = balance.intellectual + balance.emotional + balance.action + balance.spiritual + balance.practical;

    // Calcular armonía (qué tan equilibrado está)
    const values = [balance.intellectual, balance.emotional, balance.action, balance.spiritual, balance.practical];
    const avg = balance.total / 5;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / 5;
    balance.harmony = Math.max(0, 100 - Math.sqrt(variance));

    return balance;
  }
}

// Exportar
if (typeof window !== 'undefined') {
  window.FrankensteinMissions = FrankensteinMissions;
  // console.log('✅ FrankensteinMissions class registered globally');
}
