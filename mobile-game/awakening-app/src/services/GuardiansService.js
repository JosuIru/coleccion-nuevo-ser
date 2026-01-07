/**
 * GuardiansService.js
 *
 * Gestiona los 7 Guardianes del Viejo Paradigma - los enemigos principales
 * que representan las estructuras del sistema actual.
 *
 * Los Guardianes no se "destruyen", se TRANSFORMAN en su versión del Nuevo Ser.
 *
 * FASE 2: Sistema de Guardianes
 *
 * @version 1.0.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// LOS 7 GUARDIANES DEL VIEJO PARADIGMA
// ============================================================================

const GUARDIANS = {
  moloch: {
    id: 'moloch',
    name: 'MOLOCH',
    title: 'El Devorador',
    avatar: '🏭',
    color: '#DC2626', // Red
    structure: 'Capitalismo Extractivo',
    description: 'Guardián del sistema que convierte todo en mercancía y externaliza los costos hacia los débiles y el futuro.',

    // Premisas que perpetúa
    premises: ['escasez', 'valor_instrumental'],

    // Manifestaciones en el mundo
    manifestations: [
      'Corporaciones que maximizan ganancias a costa de todo',
      'Mercados que convierten bienes comunes en mercancías',
      'Externalización de costos ambientales y sociales',
      'Privatización de lo público'
    ],

    // Ataques que puede lanzar (tipos de crisis)
    attacks: [
      { id: 'economic_crisis', name: 'Crisis Económica', damage: 25, type: 'economic' },
      { id: 'precarity', name: 'Precariedad Laboral', damage: 15, type: 'social' },
      { id: 'inequality', name: 'Desigualdad Extrema', damage: 20, type: 'social' },
      { id: 'environmental_destruction', name: 'Destrucción Ambiental', damage: 30, type: 'ecological' }
    ],

    // Debilidades (cómo derrotarlo)
    weaknesses: ['cooperativismo', 'economia_regalo', 'monedas_locales', 'commons'],

    // Stats de combate
    stats: {
      health: 1000,
      power: 85,
      defense: 70,
      speed: 60
    },

    // Transformación al ser derrotado
    transformation: {
      id: 'economia_regenerativa',
      name: 'Economía Regenerativa',
      avatar: '🌿',
      description: 'El sistema económico que nutre en vez de extraer',
      bonus: { resourceGeneration: 1.5, cooperativeEfficiency: 2.0 }
    },

    // Zona del mapa que controla
    controlledRegion: 'financial_district',

    // Nivel requerido para enfrentar
    requiredLevel: 10,

    // Libros relacionados
    relatedBooks: ['ahora-instituciones', 'toolkit-transicion']
  },

  dogma: {
    id: 'dogma',
    name: 'DOGMA',
    title: 'El Inquisidor',
    avatar: '⛪',
    color: '#7C3AED', // Purple
    structure: 'Religión Institucional',
    description: 'Guardián que monopoliza lo sagrado, dividiendo el mundo entre elegidos y condenados, lo puro y lo impuro.',

    premises: ['separacion'],

    manifestations: [
      'Instituciones que monopolizan lo sagrado',
      'Fundamentalismos que excluyen',
      'Culpa como instrumento de control',
      'División entre sagrado y profano'
    ],

    attacks: [
      { id: 'division', name: 'División Ideológica', damage: 20, type: 'social' },
      { id: 'guilt', name: 'Culpa Paralizante', damage: 15, type: 'psychic' },
      { id: 'fear_control', name: 'Control por Miedo', damage: 25, type: 'psychic' },
      { id: 'exclusion', name: 'Exclusión del Diferente', damage: 20, type: 'social' }
    ],

    weaknesses: ['espiritualidad_directa', 'contemplacion', 'mistica', 'dialogo_interreligioso'],

    stats: {
      health: 800,
      power: 75,
      defense: 85,
      speed: 50
    },

    transformation: {
      id: 'sagrado_integrador',
      name: 'Lo Sagrado que Integra',
      avatar: '✨',
      description: 'Espiritualidad que une en vez de dividir',
      bonus: { wisdomGain: 1.5, healingPower: 1.3 }
    },

    controlledRegion: 'temple_district',
    requiredLevel: 12,
    relatedBooks: ['filosofia-nuevo-ser', 'practicas-radicales']
  },

  leviatan: {
    id: 'leviatan',
    name: 'LEVIATÁN',
    title: 'El Controlador',
    avatar: '🏛️',
    color: '#1D4ED8', // Blue
    structure: 'Estado-Nación',
    description: 'Guardián de las fronteras y el monopolio de la violencia, dividiendo el mundo entre ciudadanos y extranjeros.',

    premises: ['separacion'],

    manifestations: [
      'Fronteras que dividen familias y ecosistemas',
      'Nacionalismos excluyentes',
      'Monopolio estatal de la violencia',
      'Burocracia alienante'
    ],

    attacks: [
      { id: 'war', name: 'Conflicto Bélico', damage: 40, type: 'military' },
      { id: 'repression', name: 'Represión', damage: 25, type: 'social' },
      { id: 'bureaucracy', name: 'Burocracia Paralizante', damage: 15, type: 'systemic' },
      { id: 'nationalism', name: 'Nacionalismo Tóxico', damage: 20, type: 'social' }
    ],

    weaknesses: ['bioregionalismo', 'gobernanza_multinivel', 'comunidades_sin_estado', 'diplomacia_ciudadana'],

    stats: {
      health: 1200,
      power: 90,
      defense: 80,
      speed: 40
    },

    transformation: {
      id: 'gobernanza_emergente',
      name: 'Gobernanza que Emerge',
      avatar: '🌐',
      description: 'Organización política que brota de las comunidades',
      bonus: { regionLiberation: 2.0, diplomacyPower: 1.5 }
    },

    controlledRegion: 'government_quarter',
    requiredLevel: 15,
    relatedBooks: ['ahora-instituciones', 'guia-acciones']
  },

  mammon: {
    id: 'mammon',
    name: 'MAMMON',
    title: 'El Acumulador',
    avatar: '💰',
    color: '#F59E0B', // Amber
    structure: 'Mercado de Consumo',
    description: 'Guardián que convierte el vacío existencial en adicción al consumo, prometiendo felicidad a través de la posesión.',

    premises: ['materialismo', 'progreso_lineal'],

    manifestations: [
      'Publicidad que crea necesidades artificiales',
      'Obsolescencia programada',
      'Identidad = lo que posees',
      'Deuda como esclavitud moderna'
    ],

    attacks: [
      { id: 'void', name: 'Vacío Existencial', damage: 20, type: 'psychic' },
      { id: 'debt', name: 'Trampa de Deuda', damage: 25, type: 'economic' },
      { id: 'addiction', name: 'Adicción al Consumo', damage: 20, type: 'psychic' },
      { id: 'fomo', name: 'FOMO', damage: 15, type: 'psychic' }
    ],

    weaknesses: ['suficiencia', 'economia_cuidado', 'reparacion', 'minimalismo_consciente'],

    stats: {
      health: 900,
      power: 70,
      defense: 60,
      speed: 75
    },

    transformation: {
      id: 'abundancia_organizable',
      name: 'Abundancia Organizable',
      avatar: '🎁',
      description: 'Reconocer que hay suficiente cuando sabemos organizarlo',
      bonus: { resourceEfficiency: 2.0, immunityToScarcity: true }
    },

    controlledRegion: 'commercial_center',
    requiredLevel: 8,
    relatedBooks: ['manual-practico', 'guia-acciones']
  },

  maquina: {
    id: 'maquina',
    name: 'LA MÁQUINA',
    title: 'El Automatizador',
    avatar: '🏫',
    color: '#6B7280', // Gray
    structure: 'Educación Estandarizada',
    description: 'Guardián que convierte humanos únicos en piezas intercambiables, matando la creatividad y el pensamiento crítico.',

    premises: ['separacion', 'valor_instrumental'],

    manifestations: [
      'Escuelas-fábrica que producen empleados',
      'Evaluación cuantitativa de lo incuantificable',
      'Credencialismo vacío',
      'Conformismo como virtud'
    ],

    attacks: [
      { id: 'conformism', name: 'Conformismo', damage: 20, type: 'psychic' },
      { id: 'creativity_death', name: 'Muerte de Creatividad', damage: 25, type: 'developmental' },
      { id: 'anxiety', name: 'Ansiedad de Rendimiento', damage: 20, type: 'psychic' },
      { id: 'standardization', name: 'Estandarización Forzada', damage: 15, type: 'systemic' }
    ],

    weaknesses: ['pedagogia_liberadora', 'aprendizaje_autodirigido', 'comunidades_practica', 'educacion_holistica'],

    stats: {
      health: 850,
      power: 65,
      defense: 75,
      speed: 55
    },

    transformation: {
      id: 'educacion_despierta',
      name: 'Educación que Despierta',
      avatar: '🌱',
      description: 'Aprendizaje que libera el potencial único de cada ser',
      bonus: { learningSpeed: 2.0, creativityBonus: 1.5 }
    },

    controlledRegion: 'academic_zone',
    requiredLevel: 6,
    relatedBooks: ['educacion-nuevo-ser', 'codigo-despertar']
  },

  espejo: {
    id: 'espejo',
    name: 'EL ESPEJO',
    title: 'El Distractor',
    avatar: '📺',
    color: '#EC4899', // Pink
    structure: 'Medios y Entretenimiento',
    description: 'Guardián que captura la atención y la vende, creando cánones imposibles y comparación constante.',

    premises: ['escasez', 'valor_instrumental'],

    manifestations: [
      'Cánones de belleza inalcanzables',
      'Industria de la imagen corporal',
      'Comparación constante en redes',
      'Distracción perpetua del vacío'
    ],

    attacks: [
      { id: 'body_shame', name: 'Vergüenza Corporal', damage: 25, type: 'psychic' },
      { id: 'eating_disorder', name: 'Trastornos Alimentarios', damage: 30, type: 'health' },
      { id: 'comparison', name: 'Comparación Tóxica', damage: 20, type: 'psychic' },
      { id: 'distraction', name: 'Distracción Perpetua', damage: 15, type: 'developmental' }
    ],

    weaknesses: ['diversidad_celebrada', 'arte_comunitario', 'belleza_practica', 'presencia_corporal'],

    stats: {
      health: 750,
      power: 60,
      defense: 50,
      speed: 85
    },

    transformation: {
      id: 'creatividad_liberada',
      name: 'Creatividad Liberada',
      avatar: '🎨',
      description: 'Arte y belleza como práctica, no como mercancía',
      bonus: { inspirationGeneration: 2.0, immunityToShame: true }
    },

    controlledRegion: 'media_district',
    requiredLevel: 5,
    relatedBooks: ['practicas-radicales', 'manual-practico']
  },

  algoritmo: {
    id: 'algoritmo',
    name: 'EL ALGORITMO',
    title: 'El Manipulador',
    avatar: '🤖',
    color: '#0EA5E9', // Cyan
    structure: 'Redes Algorítmicas',
    description: 'El más nuevo y peligroso Guardián. Combina todas las premisas del Viejo Ser en sistemas de vigilancia y manipulación.',

    premises: ['materialismo', 'escasez', 'separacion', 'progreso_lineal', 'valor_instrumental'],

    manifestations: [
      'Plataformas que extraen datos para lucro',
      'Algoritmos que polarizan para engagement',
      'Adicción diseñada científicamente',
      'Vigilancia masiva normalizada'
    ],

    attacks: [
      { id: 'polarization', name: 'Polarización', damage: 25, type: 'social' },
      { id: 'addiction', name: 'Adicción Digital', damage: 20, type: 'psychic' },
      { id: 'misinformation', name: 'Desinformación', damage: 25, type: 'systemic' },
      { id: 'digital_loneliness', name: 'Soledad Digital', damage: 20, type: 'psychic' },
      { id: 'surveillance', name: 'Vigilancia Total', damage: 15, type: 'systemic' }
    ],

    weaknesses: ['redes_federadas', 'software_libre', 'desconexion_consciente', 'soberania_digital'],

    stats: {
      health: 1100,
      power: 95,
      defense: 65,
      speed: 95
    },

    transformation: {
      id: 'tecnologia_servidora',
      name: 'Tecnología que Sirve',
      avatar: '🌐',
      description: 'Herramientas digitales al servicio de la vida, no del lucro',
      bonus: { connectionPower: 2.0, immunityToManipulation: true, dataControl: true }
    },

    controlledRegion: 'digital_realm',
    requiredLevel: 18,
    relatedBooks: ['dialogos-maquina', 'codigo-despertar']
  }
};

// ============================================================================
// PREMISAS DEL VIEJO SER (lo que perpetúan los guardianes)
// ============================================================================

const OLD_PREMISES = {
  materialismo: {
    id: 'materialismo',
    name: 'Materialismo',
    description: 'Solo existe la materia, la consciencia es un epifenómeno',
    counter: 'consciencia_fundamental'
  },
  escasez: {
    id: 'escasez',
    name: 'Escasez',
    description: 'No hay suficiente para todos, la vida es competencia',
    counter: 'abundancia_organizable'
  },
  separacion: {
    id: 'separacion',
    name: 'Separación',
    description: 'Somos individuos aislados en competencia',
    counter: 'interdependencia_radical'
  },
  progreso_lineal: {
    id: 'progreso_lineal',
    name: 'Progreso Lineal',
    description: 'Más es siempre mejor, el crecimiento es infinito',
    counter: 'madurez_ciclica'
  },
  valor_instrumental: {
    id: 'valor_instrumental',
    name: 'Valor Instrumental',
    description: 'Todo vale según su utilidad, nada tiene valor en sí',
    counter: 'valor_intrinseco'
  }
};

// ============================================================================
// PREMISAS DEL NUEVO SER (poderes contra los guardianes)
// ============================================================================

const NEW_PREMISES = {
  consciencia_fundamental: {
    id: 'consciencia_fundamental',
    name: 'Consciencia Fundamental',
    description: 'La consciencia es lo fundamental, la materia emerge de ella',
    powers: ['meditacion', 'percepcion_expandida', 'comunicacion_no_verbal'],
    maxEvolution: 'ojo_de_gaia',
    effectiveAgainst: ['materialismo']
  },
  abundancia_organizable: {
    id: 'abundancia_organizable',
    name: 'Abundancia Organizable',
    description: 'Hay suficiente cuando sabemos organizarlo y compartirlo',
    powers: ['redistribucion', 'economia_regalo', 'permacultura'],
    maxEvolution: 'arquitecto_commons',
    effectiveAgainst: ['escasez']
  },
  interdependencia_radical: {
    id: 'interdependencia_radical',
    name: 'Interdependencia Radical',
    description: 'Todo está conectado, la separación es ilusión',
    powers: ['simbiosis', 'empatia', 'red_micelial'],
    maxEvolution: 'tejedor_redes',
    effectiveAgainst: ['separacion']
  },
  madurez_ciclica: {
    id: 'madurez_ciclica',
    name: 'Madurez Cíclica',
    description: 'El crecimiento tiene límites naturales, la madurez es saber cuándo basta',
    powers: ['suficiencia', 'regeneracion', 'muerte_consciente'],
    maxEvolution: 'anciano_sabio',
    effectiveAgainst: ['progreso_lineal']
  },
  valor_intrinseco: {
    id: 'valor_intrinseco',
    name: 'Valor Intrínseco',
    description: 'Todo ser tiene valor en sí mismo, no por su utilidad',
    powers: ['reconocimiento', 'santuario', 'derechos_naturaleza'],
    maxEvolution: 'guardian_del_ser',
    effectiveAgainst: ['valor_instrumental']
  }
};

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class GuardiansService {
  constructor() {
    this.guardianStates = {};
    this.battleHistory = [];
    this.transformedGuardians = [];
    this.currentBattle = null;
  }

  async initialize() {
    await this.loadState();
    console.log('[Guardians] Inicializado con', Object.keys(GUARDIANS).length, 'guardianes');
    return true;
  }

  // --------------------------------------------------------------------------
  // OBTENER GUARDIANES
  // --------------------------------------------------------------------------

  getAllGuardians() {
    return Object.values(GUARDIANS).map(guardian => ({
      ...guardian,
      state: this.guardianStates[guardian.id] || this.getDefaultGuardianState(guardian),
      isTransformed: this.transformedGuardians.includes(guardian.id)
    }));
  }

  getGuardian(guardianId) {
    const guardian = GUARDIANS[guardianId];
    if (!guardian) return null;

    return {
      ...guardian,
      state: this.guardianStates[guardian.id] || this.getDefaultGuardianState(guardian),
      isTransformed: this.transformedGuardians.includes(guardian.id)
    };
  }

  getDefaultGuardianState(guardian) {
    return {
      currentHealth: guardian.stats.health,
      maxHealth: guardian.stats.health,
      damageDealt: 0,
      battlesWon: 0,
      battlesLost: 0,
      weaknessesExploited: [],
      lastBattle: null
    };
  }

  getActiveGuardians() {
    return this.getAllGuardians().filter(g => !g.isTransformed);
  }

  getTransformedGuardians() {
    return this.getAllGuardians().filter(g => g.isTransformed);
  }

  getGuardiansByRegion(regionId) {
    return this.getAllGuardians().filter(g => g.controlledRegion === regionId);
  }

  // --------------------------------------------------------------------------
  // SISTEMA DE BATALLA
  // --------------------------------------------------------------------------

  /**
   * Iniciar batalla contra un guardián
   * @param {string} guardianId - ID del guardián
   * @param {Array} teamBeings - Seres del equipo
   * @param {Array} playerPremises - Premisas desbloqueadas
   * @param {Object} institutionBonus - Bonus de instituciones construidas
   */
  async startBattle(guardianId, teamBeings, playerPremises = [], institutionBonus = null) {
    const guardian = GUARDIANS[guardianId];
    if (!guardian) return { success: false, error: 'Guardián no encontrado' };

    if (this.transformedGuardians.includes(guardianId)) {
      return { success: false, error: 'Este guardián ya fue transformado' };
    }

    // Inicializar estado de batalla
    const guardianState = this.guardianStates[guardianId] || this.getDefaultGuardianState(guardian);

    this.currentBattle = {
      id: `battle_${guardianId}_${Date.now()}`,
      guardianId,
      guardian: { ...guardian, currentHealth: guardianState.currentHealth },
      team: teamBeings,
      playerPremises,
      institutionBonus, // Guardar bonus de instituciones
      turn: 1,
      phase: 'player', // 'player' or 'guardian'
      log: [],
      startedAt: Date.now(),
      damage: { toGuardian: 0, toTeam: 0 }
    };

    // Calcular bonificaciones por debilidades
    const weaknessBonus = this.calculateWeaknessBonus(guardian, playerPremises, teamBeings);

    // Integrar bonus de instituciones
    if (institutionBonus && institutionBonus.bonus > 0) {
      weaknessBonus.damageMultiplier += institutionBonus.bonus / 100; // Convertir % a multiplicador
      weaknessBonus.institutionBonus = institutionBonus;
    }

    this.currentBattle.weaknessBonus = weaknessBonus;

    // Log de inicio
    const logDetails = [];
    if (weaknessBonus.exploited.length > 0) {
      logDetails.push(`Debilidades explotadas: ${weaknessBonus.exploited.join(', ')}`);
    }
    if (institutionBonus && institutionBonus.bonus > 0) {
      const instNames = institutionBonus.institutions.map(i => i.name).join(', ');
      logDetails.push(`Instituciones activas: ${instNames} (+${institutionBonus.bonus}% daño)`);
    }

    this.currentBattle.log.push({
      type: 'battle_start',
      message: `¡Batalla iniciada contra ${guardian.name}!`,
      details: logDetails.length > 0 ? logDetails.join(' | ') : 'Sin bonificaciones especiales'
    });

    return {
      success: true,
      battle: this.currentBattle,
      weaknessBonus
    };
  }

  /**
   * Calcular bonus por explotar debilidades
   */
  calculateWeaknessBonus(guardian, playerPremises, teamBeings) {
    const exploited = [];
    let damageMultiplier = 1.0;

    // Verificar premisas del jugador contra debilidades
    for (const weakness of guardian.weaknesses) {
      const hasCounter = playerPremises.some(p =>
        NEW_PREMISES[p]?.effectiveAgainst?.some(e =>
          guardian.premises.includes(e)
        )
      );

      if (hasCounter) {
        exploited.push(weakness);
        damageMultiplier += 0.2;
      }
    }

    // Verificar seres con habilidades especiales contra el guardián
    for (const being of teamBeings) {
      if (being.specialAbility && guardian.weaknesses.some(w =>
        being.specialAbility.toLowerCase().includes(w.split('_')[0])
      )) {
        damageMultiplier += 0.15;
      }
    }

    return {
      exploited,
      damageMultiplier: Math.min(damageMultiplier, 2.5), // Cap at 2.5x
      description: exploited.length > 0
        ? `+${Math.round((damageMultiplier - 1) * 100)}% daño por debilidades`
        : 'Sin bonificación de debilidades'
    };
  }

  /**
   * Ejecutar acción del jugador
   */
  async playerAction(actionType, details = {}) {
    if (!this.currentBattle) {
      return { success: false, error: 'No hay batalla activa' };
    }

    if (this.currentBattle.phase !== 'player') {
      return { success: false, error: 'No es tu turno' };
    }

    let damage = 0;
    let effect = null;

    switch (actionType) {
      case 'attack':
        // Calcular daño base del equipo
        const teamPower = this.currentBattle.team.reduce((sum, b) =>
          sum + (b.attributes?.action || b.attributes?.wisdom || 50), 0
        );
        damage = Math.round(teamPower * this.currentBattle.weaknessBonus.damageMultiplier * (0.8 + Math.random() * 0.4));
        break;

      case 'exploit_weakness':
        // Ataque especial usando una debilidad conocida
        if (details.weakness && this.currentBattle.guardian.weaknesses.includes(details.weakness)) {
          damage = Math.round(150 * this.currentBattle.weaknessBonus.damageMultiplier);
          effect = { type: 'weakness_exploited', weakness: details.weakness };
        } else {
          damage = 50;
        }
        break;

      case 'use_premise':
        // Usar una premisa del Nuevo Ser
        const premise = NEW_PREMISES[details.premiseId];
        if (premise && premise.effectiveAgainst.some(e =>
          this.currentBattle.guardian.premises.includes(e)
        )) {
          damage = 200;
          effect = { type: 'premise_power', premise: premise.name };
        } else {
          damage = 75;
        }
        break;

      case 'heal':
        // Curar al equipo
        damage = 0;
        effect = { type: 'heal', amount: 50 };
        break;

      default:
        damage = 30;
    }

    // Aplicar daño al guardián
    this.currentBattle.guardian.currentHealth -= damage;
    this.currentBattle.damage.toGuardian += damage;

    // Log de acción
    this.currentBattle.log.push({
      type: 'player_action',
      action: actionType,
      damage,
      effect,
      message: `Tu equipo inflige ${damage} de daño a ${this.currentBattle.guardian.name}`
    });

    // Verificar victoria
    if (this.currentBattle.guardian.currentHealth <= 0) {
      return this.endBattle(true);
    }

    // Cambiar turno
    this.currentBattle.phase = 'guardian';
    this.currentBattle.turn++;

    // Ejecutar turno del guardián automáticamente
    return this.guardianAction();
  }

  /**
   * Acción del guardián (automática)
   */
  async guardianAction() {
    if (!this.currentBattle || this.currentBattle.phase !== 'guardian') {
      return { success: false, error: 'No es turno del guardián' };
    }

    const guardian = this.currentBattle.guardian;

    // Seleccionar ataque aleatorio
    const attack = guardian.attacks[Math.floor(Math.random() * guardian.attacks.length)];

    // Calcular daño
    const baseDamage = attack.damage;
    const variance = 0.8 + Math.random() * 0.4;
    const damage = Math.round(baseDamage * variance);

    this.currentBattle.damage.toTeam += damage;

    // Log de ataque
    this.currentBattle.log.push({
      type: 'guardian_action',
      attack: attack.name,
      damage,
      message: `${guardian.name} usa "${attack.name}" y causa ${damage} de daño`
    });

    // Cambiar turno al jugador
    this.currentBattle.phase = 'player';

    return {
      success: true,
      phase: 'player',
      guardianAttack: attack,
      damage,
      battle: this.currentBattle
    };
  }

  /**
   * Finalizar batalla
   */
  async endBattle(victory) {
    if (!this.currentBattle) {
      return { success: false, error: 'No hay batalla activa' };
    }

    const guardianId = this.currentBattle.guardianId;
    const guardian = GUARDIANS[guardianId];

    // Actualizar estado del guardián
    if (!this.guardianStates[guardianId]) {
      this.guardianStates[guardianId] = this.getDefaultGuardianState(guardian);
    }

    const state = this.guardianStates[guardianId];

    if (victory) {
      state.battlesWon++;
      state.currentHealth = 0;

      // Marcar como transformado
      if (!this.transformedGuardians.includes(guardianId)) {
        this.transformedGuardians.push(guardianId);
      }
    } else {
      state.battlesLost++;
      // Recuperar algo de salud
      state.currentHealth = Math.min(
        state.currentHealth + Math.round(guardian.stats.health * 0.3),
        guardian.stats.health
      );
    }

    state.lastBattle = Date.now();
    state.damageDealt += this.currentBattle.damage.toGuardian;

    // Guardar en historial
    this.battleHistory.push({
      id: this.currentBattle.id,
      guardianId,
      victory,
      damageDealt: this.currentBattle.damage.toGuardian,
      damageTaken: this.currentBattle.damage.toTeam,
      turns: this.currentBattle.turn,
      timestamp: Date.now()
    });

    // Calcular recompensas
    const rewards = victory ? {
      xp: 500 + (guardian.requiredLevel * 50),
      consciousness: 200,
      transformation: guardian.transformation,
      regionLiberated: guardian.controlledRegion
    } : {
      xp: 50,
      consciousness: 10
    };

    const result = {
      success: true,
      victory,
      guardianId,
      guardianName: guardian.name,
      transformation: victory ? guardian.transformation : null,
      rewards,
      battleStats: {
        damageDealt: this.currentBattle.damage.toGuardian,
        damageTaken: this.currentBattle.damage.toTeam,
        turns: this.currentBattle.turn
      }
    };

    // Limpiar batalla actual
    this.currentBattle = null;

    await this.saveState();

    return result;
  }

  /**
   * Huir de batalla
   */
  async fleeBattle() {
    if (!this.currentBattle) {
      return { success: false, error: 'No hay batalla activa' };
    }

    const guardianId = this.currentBattle.guardianId;

    // Guardar progreso de daño
    if (!this.guardianStates[guardianId]) {
      this.guardianStates[guardianId] = this.getDefaultGuardianState(GUARDIANS[guardianId]);
    }

    // El guardián recupera un poco de salud al huir
    const guardian = GUARDIANS[guardianId];
    this.guardianStates[guardianId].currentHealth = Math.min(
      this.currentBattle.guardian.currentHealth + Math.round(guardian.stats.health * 0.1),
      guardian.stats.health
    );

    this.currentBattle = null;
    await this.saveState();

    return { success: true, message: 'Has huido de la batalla' };
  }

  // --------------------------------------------------------------------------
  // ESTADÍSTICAS Y PROGRESO
  // --------------------------------------------------------------------------

  getProgress() {
    const total = Object.keys(GUARDIANS).length;
    const transformed = this.transformedGuardians.length;

    return {
      total,
      transformed,
      remaining: total - transformed,
      percentage: Math.round((transformed / total) * 100),
      transformedGuardians: this.transformedGuardians.map(id => ({
        id,
        transformation: GUARDIANS[id].transformation
      }))
    };
  }

  getBattleStats() {
    const victories = this.battleHistory.filter(b => b.victory).length;
    const defeats = this.battleHistory.filter(b => !b.victory).length;

    return {
      totalBattles: this.battleHistory.length,
      victories,
      defeats,
      winRate: this.battleHistory.length > 0
        ? Math.round((victories / this.battleHistory.length) * 100)
        : 0,
      totalDamageDealt: this.battleHistory.reduce((sum, b) => sum + b.damageDealt, 0),
      recentBattles: this.battleHistory.slice(-5)
    };
  }

  // --------------------------------------------------------------------------
  // PREMISAS
  // --------------------------------------------------------------------------

  getOldPremises() {
    return Object.values(OLD_PREMISES);
  }

  getNewPremises() {
    return Object.values(NEW_PREMISES);
  }

  getPremiseEffectiveness(premiseId, guardianId) {
    const premise = NEW_PREMISES[premiseId];
    const guardian = GUARDIANS[guardianId];

    if (!premise || !guardian) return 0;

    const matchingPremises = premise.effectiveAgainst.filter(e =>
      guardian.premises.includes(e)
    );

    return matchingPremises.length / guardian.premises.length;
  }

  // --------------------------------------------------------------------------
  // PERSISTENCIA
  // --------------------------------------------------------------------------

  async saveState() {
    try {
      await AsyncStorage.setItem('guardians_state', JSON.stringify({
        guardianStates: this.guardianStates,
        battleHistory: this.battleHistory.slice(-50),
        transformedGuardians: this.transformedGuardians
      }));
    } catch (error) {
      console.error('Error saving Guardians state:', error);
    }
  }

  async loadState() {
    try {
      const data = await AsyncStorage.getItem('guardians_state');
      if (data) {
        const parsed = JSON.parse(data);
        this.guardianStates = parsed.guardianStates || {};
        this.battleHistory = parsed.battleHistory || [];
        this.transformedGuardians = parsed.transformedGuardians || [];
      }
    } catch (error) {
      console.error('Error loading Guardians state:', error);
    }
  }

  async resetProgress() {
    this.guardianStates = {};
    this.battleHistory = [];
    this.transformedGuardians = [];
    this.currentBattle = null;
    await AsyncStorage.removeItem('guardians_state');
  }
}

export const guardiansService = new GuardiansService();
export { GUARDIANS, OLD_PREMISES, NEW_PREMISES };
export default guardiansService;
