/**
 * RewardService - Sistema de generación de recompensas
 *
 * Genera seres, piezas y comunidades como recompensa al resolver crisis
 *
 * @version 1.0.0
 */

// Atributos disponibles para piezas y seres
const ATTRIBUTES = [
  'reflection', 'analysis', 'creativity', 'empathy', 'communication',
  'leadership', 'action', 'resilience', 'strategy', 'consciousness',
  'connection', 'wisdom', 'organization', 'collaboration', 'technical'
];

// Avatares según atributo dominante
const AVATAR_MAP = {
  consciousness: '🌟', wisdom: '🦉', empathy: '💜', creativity: '🎨',
  leadership: '👑', action: '⚡', resilience: '💪', analysis: '🔬',
  reflection: '🧠', communication: '🗣️', connection: '🌍', strategy: '♟️',
  organization: '📋', collaboration: '🤝', technical: '⚙️'
};

// Tipos de piezas según categoría de crisis
const CRISIS_PIECE_MAP = {
  environmental: ['connection', 'consciousness', 'action', 'resilience'],
  social: ['empathy', 'collaboration', 'communication', 'leadership'],
  political: ['strategy', 'organization', 'leadership', 'analysis'],
  economic: ['technical', 'organization', 'strategy', 'action'],
  health: ['empathy', 'resilience', 'technical', 'collaboration'],
  technological: ['technical', 'creativity', 'analysis', 'strategy'],
  humanitarian: ['empathy', 'action', 'collaboration', 'resilience'],
  default: ['wisdom', 'reflection', 'creativity', 'consciousness']
};

// Nombres para seres generados según temática
const BEING_NAMES = {
  environmental: ['Guardián Verde', 'Espíritu del Bosque', 'Protector Oceánico', 'Alma de la Tierra'],
  social: ['Tejedor de Lazos', 'Puente Humano', 'Voz del Pueblo', 'Arquitecto Social'],
  political: ['Estratega de Paz', 'Mediador Sabio', 'Constructor de Consensos', 'Diplomático Luminoso'],
  economic: ['Equilibrador de Recursos', 'Innovador Consciente', 'Distribuidor Justo', 'Visionario Económico'],
  health: ['Sanador Holístico', 'Guardián de la Salud', 'Restaurador Vital', 'Cuidador Universal'],
  technological: ['Alquimista Digital', 'Puente Humano-Máquina', 'Innovador Ético', 'Guardián del Código'],
  humanitarian: ['Ángel de la Esperanza', 'Portador de Luz', 'Defensor de los Vulnerables', 'Emisario de Paz'],
  default: ['Ser del Despertar', 'Agente de Cambio', 'Portador de Consciencia', 'Catalizador']
};

// Nombres para comunidades
const COMMUNITY_NAMES = {
  environmental: 'Guardianes de Gaia',
  social: 'Red de Conexiones',
  political: 'Consejo de Sabios',
  economic: 'Colectivo de Equilibrio',
  health: 'Círculo Sanador',
  technological: 'Alianza Digital',
  humanitarian: 'Hermandad de Luz',
  default: 'Comunidad del Despertar'
};

class RewardService {
  /**
   * Genera recompensas basadas en la crisis resuelta
   * @param {Object} crisis - Crisis resuelta
   * @param {number} performance - Rendimiento (0-100)
   * @returns {Object} Recompensas generadas
   */
  generateRewards(crisis, performance = 100) {
    const rewards = {
      xp: 0,
      consciousness: 0,
      energy: 0,
      pieces: [],
      being: null,
      community: null
    };

    const difficulty = crisis.severity || crisis.difficulty || 'medium';
    const category = this.detectCategory(crisis);

    // Recompensas base según dificultad
    const baseRewards = this.getBaseRewards(difficulty);
    rewards.xp = Math.floor(baseRewards.xp * (performance / 100));
    rewards.consciousness = Math.floor(baseRewards.consciousness * (performance / 100));
    rewards.energy = baseRewards.energy;

    // Siempre dar al menos 1-2 piezas
    const pieceCount = this.calculatePieceCount(difficulty, performance);
    rewards.pieces = this.generatePieces(category, pieceCount, difficulty);

    // Probabilidad de obtener un ser completo
    if (this.rollForBeing(difficulty, performance)) {
      rewards.being = this.generateBeing(category, crisis);
    }

    // Probabilidad de obtener una comunidad (muy raro)
    if (this.rollForCommunity(difficulty, performance)) {
      rewards.community = this.generateCommunity(category, crisis);
    }

    return rewards;
  }

  /**
   * Detecta la categoría de la crisis
   */
  detectCategory(crisis) {
    const text = `${crisis.title || ''} ${crisis.description || ''} ${crisis.category || ''}`.toLowerCase();

    if (text.includes('clima') || text.includes('ambiente') || text.includes('ecolog') ||
        text.includes('forest') || text.includes('ocean') || text.includes('pollution')) {
      return 'environmental';
    }
    if (text.includes('social') || text.includes('comunidad') || text.includes('protest') ||
        text.includes('rights') || text.includes('equality')) {
      return 'social';
    }
    if (text.includes('politic') || text.includes('gobierno') || text.includes('election') ||
        text.includes('law') || text.includes('policy')) {
      return 'political';
    }
    if (text.includes('econom') || text.includes('financi') || text.includes('market') ||
        text.includes('trade') || text.includes('business')) {
      return 'economic';
    }
    if (text.includes('salud') || text.includes('health') || text.includes('medical') ||
        text.includes('disease') || text.includes('hospital')) {
      return 'health';
    }
    if (text.includes('tech') || text.includes('digital') || text.includes('cyber') ||
        text.includes('ai') || text.includes('software')) {
      return 'technological';
    }
    if (text.includes('humanitari') || text.includes('refugee') || text.includes('crisis') ||
        text.includes('emergency') || text.includes('disaster')) {
      return 'humanitarian';
    }

    return 'default';
  }

  /**
   * Recompensas base según dificultad
   */
  getBaseRewards(difficulty) {
    const rewards = {
      easy: { xp: 50, consciousness: 10, energy: 5 },
      medium: { xp: 100, consciousness: 25, energy: 10 },
      hard: { xp: 200, consciousness: 50, energy: 15 },
      critical: { xp: 400, consciousness: 100, energy: 25 }
    };

    return rewards[difficulty] || rewards.medium;
  }

  /**
   * Calcula cantidad de piezas a dar
   */
  calculatePieceCount(difficulty, performance) {
    const base = { easy: 1, medium: 2, hard: 3, critical: 4 };
    const count = base[difficulty] || 2;

    // Bonus por buen rendimiento
    if (performance >= 90) return count + 2;
    if (performance >= 75) return count + 1;
    return count;
  }

  /**
   * Genera piezas de atributos
   */
  generatePieces(category, count, difficulty) {
    const pieces = [];
    const relevantAttrs = CRISIS_PIECE_MAP[category] || CRISIS_PIECE_MAP.default;
    const powerMultiplier = { easy: 1, medium: 1.5, hard: 2, critical: 3 }[difficulty] || 1.5;

    for (let i = 0; i < count; i++) {
      // 70% atributos relevantes a la crisis, 30% aleatorios
      const useRelevant = Math.random() < 0.7;
      const attrPool = useRelevant ? relevantAttrs : ATTRIBUTES;
      const attribute = attrPool[Math.floor(Math.random() * attrPool.length)];

      // Poder de la pieza (5-30 según dificultad)
      const basePower = 5 + Math.floor(Math.random() * 15);
      const power = Math.floor(basePower * powerMultiplier);

      // Rareza
      const rarityRoll = Math.random();
      let rarity = 'common';
      if (rarityRoll > 0.95) rarity = 'legendary';
      else if (rarityRoll > 0.85) rarity = 'epic';
      else if (rarityRoll > 0.7) rarity = 'rare';

      pieces.push({
        type: 'attribute_fragment',
        attribute,
        power,
        rarity,
        icon: AVATAR_MAP[attribute] || '✨',
        name: `Fragmento de ${this.capitalizeAttribute(attribute)}`,
        description: `+${power} ${this.capitalizeAttribute(attribute)} para el Laboratorio`
      });
    }

    return pieces;
  }

  /**
   * Probabilidad de obtener un ser
   */
  rollForBeing(difficulty, performance) {
    const baseChance = { easy: 0.05, medium: 0.15, hard: 0.30, critical: 0.50 };
    const chance = (baseChance[difficulty] || 0.15) * (performance / 100);
    return Math.random() < chance;
  }

  /**
   * Genera un ser completo
   */
  generateBeing(category, crisis) {
    const names = BEING_NAMES[category] || BEING_NAMES.default;
    const name = names[Math.floor(Math.random() * names.length)];
    const relevantAttrs = CRISIS_PIECE_MAP[category] || CRISIS_PIECE_MAP.default;

    // Generar atributos con bonus en los relevantes
    const attributes = {};
    ATTRIBUTES.forEach(attr => {
      const isRelevant = relevantAttrs.includes(attr);
      const base = 15 + Math.floor(Math.random() * 25);
      attributes[attr] = isRelevant ? base + 15 : base;
    });

    // Encontrar atributo dominante
    const dominant = Object.entries(attributes).sort((a, b) => b[1] - a[1])[0][0];

    return {
      name,
      avatar: AVATAR_MAP[dominant] || '🧬',
      attributes,
      totalPower: Object.values(attributes).reduce((a, b) => a + b, 0),
      status: 'available',
      level: 1,
      experience: 0,
      sourceApp: 'crisis-reward',
      crisisTitle: crisis.title || 'Crisis Resuelta',
      awakened: true
    };
  }

  /**
   * Probabilidad de obtener comunidad
   */
  rollForCommunity(difficulty, performance) {
    // Muy raro: solo en dificultad crítica con buen rendimiento
    if (difficulty !== 'critical') return false;
    return performance >= 85 && Math.random() < 0.15;
  }

  /**
   * Genera una comunidad de seres
   */
  generateCommunity(category, crisis) {
    const communityName = COMMUNITY_NAMES[category] || COMMUNITY_NAMES.default;
    const beingCount = 3 + Math.floor(Math.random() * 3); // 3-5 seres

    const beings = [];
    for (let i = 0; i < beingCount; i++) {
      const being = this.generateBeing(category, crisis);
      being.name = `${being.name} ${['Alfa', 'Beta', 'Gamma', 'Delta', 'Epsilon'][i] || i + 1}`;
      beings.push(being);
    }

    return {
      name: communityName,
      description: `Una comunidad de ${beingCount} seres despertados al resolver "${crisis.title}"`,
      beings,
      category,
      activated: false,
      icon: '🏛️'
    };
  }

  /**
   * Capitaliza nombre de atributo
   */
  capitalizeAttribute(attr) {
    const translations = {
      reflection: 'Reflexión', analysis: 'Análisis', creativity: 'Creatividad',
      empathy: 'Empatía', communication: 'Comunicación', leadership: 'Liderazgo',
      action: 'Acción', resilience: 'Resiliencia', strategy: 'Estrategia',
      consciousness: 'Consciencia', connection: 'Conexión', wisdom: 'Sabiduría',
      organization: 'Organización', collaboration: 'Colaboración', technical: 'Técnico'
    };
    return translations[attr] || attr.charAt(0).toUpperCase() + attr.slice(1);
  }

  /**
   * Calcula rendimiento basado en seres desplegados vs requeridos
   */
  calculatePerformance(crisis, deployedBeings) {
    if (!crisis || !deployedBeings) return 50;

    const required = crisis.requiredBeings || 1;
    const deployed = deployedBeings.length;
    const ratio = Math.min(deployed / required, 2); // Max 200%

    // Base performance por cumplir requerimiento
    let performance = ratio >= 1 ? 70 : 50 * ratio;

    // Bonus por poder total
    const totalPower = deployedBeings.reduce((sum, b) =>
      sum + (b.totalPower || Object.values(b.attributes || {}).reduce((a, v) => a + v, 0)), 0);

    const targetPower = (crisis.difficulty === 'critical' ? 300 :
                         crisis.difficulty === 'hard' ? 200 :
                         crisis.difficulty === 'medium' ? 100 : 50);

    if (totalPower >= targetPower) {
      performance += 20;
    } else if (totalPower >= targetPower * 0.7) {
      performance += 10;
    }

    return Math.min(100, Math.max(0, performance));
  }
}

export const rewardService = new RewardService();
export default rewardService;
