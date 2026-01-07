/**
 * ACHIEVEMENTS CONFIGURATION
 * ==========================
 *
 * Definición de todos los logros disponibles en el juego.
 *
 * CATEGORÍAS:
 * - Beings: Relacionados con crear y desarrollar seres
 * - Missions: Completar misiones y crisis
 * - Level: Progreso de nivel
 * - Community: Participación en comunidades
 * - Events: Participación en eventos temporales
 * - Special: Logros secretos y especiales
 *
 * ESTRUCTURA DE UN LOGRO:
 * {
 *   id: string,
 *   category: string,
 *   name: string,
 *   description: string,
 *   icon: string (emoji o URL),
 *   rarity: 'common' | 'rare' | 'epic' | 'legendary',
 *   condition: function(stats),
 *   rewards: { xp, consciousness, energy, special_item }
 * }
 */

export const ACHIEVEMENT_CATEGORIES = {
  BEINGS: 'beings',
  MISSIONS: 'missions',
  LEVEL: 'level',
  COMMUNITY: 'community',
  EVENTS: 'events',
  SPECIAL: 'special'
};

export const ACHIEVEMENT_RARITIES = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

export const ACHIEVEMENTS = [
  // ========================================================================
  // BEINGS CATEGORY
  // ========================================================================
  {
    id: 'first_being',
    category: ACHIEVEMENT_CATEGORIES.BEINGS,
    name: 'Primer Ser Transformador',
    description: 'Crea tu primer Ser Transformador',
    icon: '🌱',
    rarity: ACHIEVEMENT_RARITIES.COMMON,
    condition: (stats) => stats.beingsCreated >= 1,
    rewards: {
      xp: 50,
      consciousness: 10
    }
  },

  {
    id: 'being_collector_5',
    category: ACHIEVEMENT_CATEGORIES.BEINGS,
    name: 'Coleccionista Novato',
    description: 'Crea 5 Seres Transformadores',
    icon: '🌿',
    rarity: ACHIEVEMENT_RARITIES.COMMON,
    condition: (stats) => stats.beingsCreated >= 5,
    rewards: {
      xp: 100,
      consciousness: 25
    }
  },

  {
    id: 'being_collector_10',
    category: ACHIEVEMENT_CATEGORIES.BEINGS,
    name: 'Coleccionista Experimentado',
    description: 'Crea 10 Seres Transformadores',
    icon: '🌳',
    rarity: ACHIEVEMENT_RARITIES.RARE,
    condition: (stats) => stats.beingsCreated >= 10,
    rewards: {
      xp: 250,
      consciousness: 50,
      special_item: 'legendary_piece'
    }
  },

  {
    id: 'being_master',
    category: ACHIEVEMENT_CATEGORIES.BEINGS,
    name: 'Maestro de Seres',
    description: 'Lleva un Ser al nivel 10',
    icon: '⭐',
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    condition: (stats) => stats.maxBeingLevel >= 10,
    rewards: {
      xp: 500,
      consciousness: 100,
      energy: 50
    }
  },

  {
    id: 'being_collection_complete',
    category: ACHIEVEMENT_CATEGORIES.BEINGS,
    name: 'Colección Completa',
    description: 'Crea al menos un Ser de cada especialidad',
    icon: '🏆',
    rarity: ACHIEVEMENT_RARITIES.LEGENDARY,
    condition: (stats) => stats.uniqueSpecialties >= 7, // Asumiendo 7 especialidades
    rewards: {
      xp: 1000,
      consciousness: 250,
      energy: 100,
      special_item: 'mythic_piece'
    }
  },

  // ========================================================================
  // MISSIONS CATEGORY
  // ========================================================================
  {
    id: 'first_mission',
    category: ACHIEVEMENT_CATEGORIES.MISSIONS,
    name: 'Primera Misión',
    description: 'Completa tu primera misión',
    icon: '🎯',
    rarity: ACHIEVEMENT_RARITIES.COMMON,
    condition: (stats) => stats.missionsCompleted >= 1,
    rewards: {
      xp: 50,
      consciousness: 10
    }
  },

  {
    id: 'mission_veteran_10',
    category: ACHIEVEMENT_CATEGORIES.MISSIONS,
    name: 'Veterano de Misiones',
    description: 'Completa 10 misiones',
    icon: '🎖️',
    rarity: ACHIEVEMENT_RARITIES.COMMON,
    condition: (stats) => stats.missionsCompleted >= 10,
    rewards: {
      xp: 200,
      consciousness: 50
    }
  },

  {
    id: 'mission_expert_50',
    category: ACHIEVEMENT_CATEGORIES.MISSIONS,
    name: 'Experto en Misiones',
    description: 'Completa 50 misiones',
    icon: '🏅',
    rarity: ACHIEVEMENT_RARITIES.RARE,
    condition: (stats) => stats.missionsCompleted >= 50,
    rewards: {
      xp: 500,
      consciousness: 150,
      energy: 50
    }
  },

  {
    id: 'mission_master_100',
    category: ACHIEVEMENT_CATEGORIES.MISSIONS,
    name: 'Maestro de Misiones',
    description: 'Completa 100 misiones',
    icon: '🎗️',
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    condition: (stats) => stats.missionsCompleted >= 100,
    rewards: {
      xp: 1000,
      consciousness: 300,
      energy: 100
    }
  },

  {
    id: 'crisis_resolver',
    category: ACHIEVEMENT_CATEGORIES.MISSIONS,
    name: 'Resolvedor de Crisis',
    description: 'Resuelve 25 crisis existenciales',
    icon: '💫',
    rarity: ACHIEVEMENT_RARITIES.RARE,
    condition: (stats) => stats.crisisResolved >= 25,
    rewards: {
      xp: 400,
      consciousness: 100
    }
  },

  {
    id: 'perfect_mission',
    category: ACHIEVEMENT_CATEGORIES.MISSIONS,
    name: 'Misión Perfecta',
    description: 'Completa una misión con 100% de efectividad',
    icon: '✨',
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    condition: (stats) => stats.perfectMissions >= 1,
    rewards: {
      xp: 300,
      consciousness: 75
    }
  },

  // ========================================================================
  // LEVEL CATEGORY
  // ========================================================================
  {
    id: 'level_5',
    category: ACHIEVEMENT_CATEGORIES.LEVEL,
    name: 'Despertar Inicial',
    description: 'Alcanza el nivel 5',
    icon: '🌅',
    rarity: ACHIEVEMENT_RARITIES.COMMON,
    condition: (stats) => stats.userLevel >= 5,
    rewards: {
      xp: 100,
      consciousness: 25
    }
  },

  {
    id: 'level_10',
    category: ACHIEVEMENT_CATEGORIES.LEVEL,
    name: 'Consciente Emergente',
    description: 'Alcanza el nivel 10',
    icon: '🌄',
    rarity: ACHIEVEMENT_RARITIES.RARE,
    condition: (stats) => stats.userLevel >= 10,
    rewards: {
      xp: 250,
      consciousness: 75,
      energy: 50
    }
  },

  {
    id: 'level_20',
    category: ACHIEVEMENT_CATEGORIES.LEVEL,
    name: 'Maestro de la Consciencia',
    description: 'Alcanza el nivel 20',
    icon: '🌞',
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    condition: (stats) => stats.userLevel >= 20,
    rewards: {
      xp: 500,
      consciousness: 200,
      energy: 100,
      special_item: 'consciousness_crystal'
    }
  },

  {
    id: 'level_50',
    category: ACHIEVEMENT_CATEGORIES.LEVEL,
    name: 'Iluminación Trascendente',
    description: 'Alcanza el nivel 50',
    icon: '☀️',
    rarity: ACHIEVEMENT_RARITIES.LEGENDARY,
    condition: (stats) => stats.userLevel >= 50,
    rewards: {
      xp: 2000,
      consciousness: 500,
      energy: 250,
      special_item: 'transcendent_core'
    }
  },

  // ========================================================================
  // COMMUNITY CATEGORY
  // ========================================================================
  {
    id: 'first_community',
    category: ACHIEVEMENT_CATEGORIES.COMMUNITY,
    name: 'Miembro de Comunidad',
    description: 'Únete a tu primera comunidad',
    icon: '👥',
    rarity: ACHIEVEMENT_RARITIES.COMMON,
    condition: (stats) => stats.communitiesJoined >= 1,
    rewards: {
      xp: 75,
      consciousness: 20
    }
  },

  {
    id: 'community_contributor',
    category: ACHIEVEMENT_CATEGORIES.COMMUNITY,
    name: 'Contribuidor Activo',
    description: 'Aporta 100 puntos a comunidades',
    icon: '🤝',
    rarity: ACHIEVEMENT_RARITIES.RARE,
    condition: (stats) => stats.communityContribution >= 100,
    rewards: {
      xp: 300,
      consciousness: 75
    }
  },

  {
    id: 'community_leader',
    category: ACHIEVEMENT_CATEGORIES.COMMUNITY,
    name: 'Líder Comunitario',
    description: 'Crea una comunidad y alcanza 10 miembros',
    icon: '👑',
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    condition: (stats) => stats.communitiesCreated >= 1 && stats.maxCommunityMembers >= 10,
    rewards: {
      xp: 750,
      consciousness: 200,
      special_item: 'leadership_badge'
    }
  },

  // ========================================================================
  // EVENTS CATEGORY
  // ========================================================================
  {
    id: 'first_event',
    category: ACHIEVEMENT_CATEGORIES.EVENTS,
    name: 'Participante Activo',
    description: 'Participa en tu primer evento temporal',
    icon: '🎪',
    rarity: ACHIEVEMENT_RARITIES.COMMON,
    condition: (stats) => stats.eventsJoined >= 1,
    rewards: {
      xp: 100,
      consciousness: 25
    }
  },

  {
    id: 'event_completionist',
    category: ACHIEVEMENT_CATEGORIES.EVENTS,
    name: 'Completador de Eventos',
    description: 'Completa 5 eventos temporales',
    icon: '🎊',
    rarity: ACHIEVEMENT_RARITIES.RARE,
    condition: (stats) => stats.eventsCompleted >= 5,
    rewards: {
      xp: 500,
      consciousness: 150,
      energy: 75
    }
  },

  {
    id: 'event_champion',
    category: ACHIEVEMENT_CATEGORIES.EVENTS,
    name: 'Campeón de Eventos',
    description: 'Termina en el top 10 de un evento',
    icon: '🥇',
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    condition: (stats) => stats.topEventRank <= 10 && stats.topEventRank > 0,
    rewards: {
      xp: 1000,
      consciousness: 250,
      energy: 100,
      special_item: 'champion_trophy'
    }
  },

  // ========================================================================
  // SPECIAL CATEGORY
  // ========================================================================
  {
    id: 'early_adopter',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    name: 'Adoptador Temprano',
    description: 'Juega durante la primera semana del lanzamiento',
    icon: '🎁',
    rarity: ACHIEVEMENT_RARITIES.LEGENDARY,
    condition: (stats) => stats.accountCreatedAt &&
      new Date(stats.accountCreatedAt) < new Date('2025-01-01'), // Ajustar fecha
    rewards: {
      xp: 500,
      consciousness: 200,
      special_item: 'founders_badge'
    }
  },

  {
    id: 'daily_dedication_7',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    name: 'Dedicación Diaria',
    description: 'Inicia sesión durante 7 días consecutivos',
    icon: '📅',
    rarity: ACHIEVEMENT_RARITIES.RARE,
    condition: (stats) => stats.consecutiveDays >= 7,
    rewards: {
      xp: 300,
      consciousness: 100,
      energy: 50
    }
  },

  {
    id: 'daily_dedication_30',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    name: 'Maestro de la Constancia',
    description: 'Inicia sesión durante 30 días consecutivos',
    icon: '📆',
    rarity: ACHIEVEMENT_RARITIES.EPIC,
    condition: (stats) => stats.consecutiveDays >= 30,
    rewards: {
      xp: 1000,
      consciousness: 300,
      energy: 150,
      special_item: 'persistence_gem'
    }
  },

  {
    id: 'consciousness_milestone_1000',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    name: 'Consciencia Expandida',
    description: 'Acumula 1000 puntos de consciencia',
    icon: '🧠',
    rarity: ACHIEVEMENT_RARITIES.RARE,
    condition: (stats) => stats.totalConsciousness >= 1000,
    rewards: {
      xp: 500,
      energy: 100
    }
  },

  {
    id: 'the_awakened',
    category: ACHIEVEMENT_CATEGORIES.SPECIAL,
    name: 'El Despierto',
    description: 'Completa todos los logros del juego',
    icon: '🌌',
    rarity: ACHIEVEMENT_RARITIES.LEGENDARY,
    condition: (stats) => stats.achievementsUnlocked >= 30, // Ajustar al número total
    rewards: {
      xp: 5000,
      consciousness: 1000,
      energy: 500,
      special_item: 'ultimate_awakening'
    }
  }
];

/**
 * Obtiene un logro por ID
 */
export function getAchievement(achievementId) {
  return ACHIEVEMENTS.find(a => a.id === achievementId);
}

/**
 * Obtiene logros por categoría
 */
export function getAchievementsByCategory(category) {
  return ACHIEVEMENTS.filter(a => a.category === category);
}

/**
 * Obtiene logros por rareza
 */
export function getAchievementsByRarity(rarity) {
  return ACHIEVEMENTS.filter(a => a.rarity === rarity);
}

/**
 * Calcula el total de XP disponible en logros
 */
export function getTotalAchievementXP() {
  return ACHIEVEMENTS.reduce((sum, a) => sum + (a.rewards.xp || 0), 0);
}

/**
 * Calcula el total de Consciencia disponible en logros
 */
export function getTotalAchievementConsciousness() {
  return ACHIEVEMENTS.reduce((sum, a) => sum + (a.rewards.consciousness || 0), 0);
}

export default ACHIEVEMENTS;
