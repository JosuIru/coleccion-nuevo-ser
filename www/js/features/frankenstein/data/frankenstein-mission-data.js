/**
 * FRANKENSTEIN LAB - MISSION DATA
 * Extracted from frankenstein-missions.js (Refactoring v2.9.200 Phase 1)
 *
 * Contains: Mission definitions, objectives, requirements templates
 *
 * @version 1.0.0
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

// Define global namespace for Frankenstein mission data
if (typeof window.FrankensteinMissionData === 'undefined') {
  window.FrankensteinMissionData = {};
}

/**
 * Misiones disponibles en el sistema Frankenstein
 * Cada misión define atributos requeridos, balances, dificultad y mensajes
 */
window.FrankensteinMissionData.MISSIONS = [
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

/**
 * Ranking de dificultad para ordenamiento
 */
window.FrankensteinMissionData.DIFFICULTY_RANK = {
  facil: 0,
  intermedio: 1,
  avanzado: 2,
  experto: 3
};

/**
 * Configuración del sistema de progresión
 */
window.FrankensteinMissionData.PROGRESSION_CONFIG = {
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

/**
 * Atributos que puede tener un "Ser Transformador"
 */
window.FrankensteinMissionData.ATTRIBUTES = {
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
