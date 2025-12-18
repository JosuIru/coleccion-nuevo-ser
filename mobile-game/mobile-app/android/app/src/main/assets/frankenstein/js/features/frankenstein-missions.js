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

    // Misiones disponibles
    this.missions = [
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

    this.currentMission = null;
    this.createdBeing = null;
  }

  /**
   * Analizar pieza de conocimiento y extraer atributos
   */
  analyzePiece(piece) {
    // piece puede ser: chapter, exercise, resource
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
   */
  createBeing(pieces, name = 'Ser sin nombre') {
    const being = {
      name: name,
      pieces: pieces,
      attributes: {},
      totalPower: 0,
      balance: {},
      createdAt: new Date()
    };

    // Sumar atributos de todas las piezas
    pieces.forEach(pieceData => {
      Object.entries(pieceData.attributes).forEach(([attr, value]) => {
        being.attributes[attr] = (being.attributes[attr] || 0) + value;
      });
      being.totalPower += pieceData.totalPower;
    });

    // Calcular balance
    being.balance = this.calculateBalance(being.attributes);

    return being;
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
