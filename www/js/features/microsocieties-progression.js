/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * SISTEMA DE PROGRESIÓN Y UNLOCKS
 * Niveles, XP, achievements, y contenido desbloqueable
 */

class ProgressionSystem {
  constructor() {
    this.player = {
      level: 1,
      xp: 0,
      totalXP: 0,
      unlocks: ['speed-1x'], // Siempre disponible
      achievements: [],
      settings: {
        tutorialCompleted: false,
        soundEnabled: true,
        musicEnabled: true,
        notificationsEnabled: true
      },
      stats: {
        societiesCreated: 0,
        totalTurns: 0,
        successfulEvents: 0,
        failedEvents: 0,
        beingsCreated: 0,
        highestGeneration: 1,
        longestSurvival: 0,
        timePlayed: 0
      }
    };

    this.loadProgress();
  }

  /**
   * Tabla de XP por nivel
   */
  getXPForLevel(level) {
    // Curva exponencial: level^2 * 100
    return Math.floor(Math.pow(level, 2) * 100);
  }

  /**
   * Añadir XP y verificar level up
   */
  addXP(amount) {
    this.player.xp += amount;
    this.player.totalXP += amount;

    const levelsGained = [];

    // Verificar level ups
    while (this.player.xp >= this.getXPForLevel(this.player.level)) {
      this.player.xp -= this.getXPForLevel(this.player.level);
      this.player.level++;
      levelsGained.push(this.player.level);

      // Unlocks automáticos por nivel
      this.checkLevelUnlocks(this.player.level);
    }

    this.saveProgress();

    return {
      newLevel: this.player.level,
      levelsGained,
      currentXP: this.player.xp,
      xpToNext: this.getXPForLevel(this.player.level)
    };
  }

  /**
   * Desbloquear contenido
   */
  unlock(unlockId) {
    if (!this.player.unlocks.includes(unlockId)) {
      this.player.unlocks.push(unlockId);
      this.saveProgress();
      return true;
    }
    return false;
  }

  /**
   * Verificar si algo está desbloqueado
   */
  isUnlocked(unlockId) {
    return this.player.unlocks.includes(unlockId);
  }

  /**
   * Unlocks automáticos por nivel
   */
  checkLevelUnlocks(level) {
    const levelUnlocks = {
      2: ['speed-2x'],
      5: ['intervention-blessing'],
      10: ['speed-5x', 'event-premium-1'],
      15: ['intervention-inspire'],
      20: ['speed-10x', 'sandbox-mode'],
      25: ['intervention-evolve'],
      30: ['event-premium-2'],
      40: ['sandbox-unlimited-population'],
      50: ['achievement-master']
    };

    if (levelUnlocks[level]) {
      levelUnlocks[level].forEach(unlockId => this.unlock(unlockId));
    }
  }

  /**
   * Otorgar achievement
   */
  grantAchievement(achievementId) {
    if (!this.player.achievements.includes(achievementId)) {
      this.player.achievements.push(achievementId);

      // XP bonus por achievement
      const achievement = this.getAchievementData(achievementId);
      if (achievement) {
        this.addXP(achievement.xp);
      }

      this.saveProgress();
      return true;
    }
    return false;
  }

  /**
   * Datos de achievements
   */
  getAchievementData(achievementId) {
    const achievements = {
      'first-society': {
        name: 'Primera Sociedad',
        description: 'Crea tu primera microsociedad',
        icon: '🌍',
        xp: 50
      },
      'survivor': {
        name: 'Superviviente',
        description: 'Sobrevive 50 turnos',
        icon: '🛡️',
        xp: 200
      },
      'evolution-master': {
        name: 'Maestro de la Evolución',
        description: 'Alcanza generación 10',
        icon: '🧬',
        xp: 500
      },
      'harmony': {
        name: 'Armonía',
        description: 'Todas las métricas entre 70-80 simultáneamente',
        icon: '☯️',
        xp: 300
      },
      'phoenix': {
        name: 'Ave Fénix',
        description: 'Recupera una sociedad al borde del colapso',
        icon: '🔥',
        xp: 400
      },
      'strategist': {
        name: 'Estratega',
        description: 'Resuelve 25 eventos exitosamente',
        icon: '🎯',
        xp: 250
      },
      'master': {
        name: 'Maestro',
        description: 'Alcanza nivel 50',
        icon: '👑',
        xp: 1000
      }
    };

    return achievements[achievementId];
  }

  /**
   * Actualizar estadísticas
   */
  updateStats(stat, value) {
    if (this.player.stats.hasOwnProperty(stat)) {
      if (typeof value === 'number' && stat.startsWith('total')) {
        this.player.stats[stat] += value;
      } else if (stat.startsWith('highest') || stat.startsWith('longest')) {
        this.player.stats[stat] = Math.max(this.player.stats[stat], value);
      } else {
        this.player.stats[stat] = value;
      }
      this.saveProgress();
    }
  }

  /**
   * Obtener progreso completo
   */
  getProgress() {
    return {
      level: this.player.level,
      xp: this.player.xp,
      xpToNext: this.getXPForLevel(this.player.level),
      totalXP: this.player.totalXP,
      unlocks: [...this.player.unlocks],
      achievements: [...this.player.achievements],
      stats: {...this.player.stats},
      percentage: this.getCompletionPercentage()
    };
  }

  /**
   * Porcentaje de completación
   */
  getCompletionPercentage() {
    // Total de unlocks posibles
    const totalUnlocks = 30; // Aproximado
    const unlockedCount = this.player.unlocks.length;

    // Total de achievements posibles
    const totalAchievements = 20; // Aproximado
    const achievedCount = this.player.achievements.length;

    // Nivel máximo esperado
    const maxLevel = 50;
    const levelProgress = Math.min(this.player.level / maxLevel, 1);

    // Promedio ponderado
    const completion = (
      (unlockedCount / totalUnlocks) * 0.4 +
      (achievedCount / totalAchievements) * 0.3 +
      levelProgress * 0.3
    ) * 100;

    return Math.round(completion);
  }

  /**
   * Catálogo de unlocks
   */
  getUnlocksCatalog() {
    return {
      // Velocidades
      'speed-1x': {
        name: 'Velocidad Normal',
        description: '1 turno cada 2 segundos',
        category: 'speed',
        free: true
      },
      'speed-2x': {
        name: 'Velocidad 2x',
        description: '1 turno cada 1 segundo',
        category: 'speed',
        requiredLevel: 2
      },
      'speed-5x': {
        name: 'Velocidad 5x',
        description: '1 turno cada 0.4 segundos',
        category: 'speed',
        requiredLevel: 10
      },
      'speed-10x': {
        name: 'Velocidad 10x',
        description: '1 turno cada 0.2 segundos',
        category: 'speed',
        requiredLevel: 20
      },

      // Intervenciones Divinas
      'intervention-blessing': {
        name: 'Bendición',
        description: 'Aumenta Salud +20 y Cohesión +15',
        category: 'intervention',
        cost: 10,
        requiredLevel: 5
      },
      'intervention-inspire': {
        name: 'Inspiración',
        description: 'Aumenta fitness de todos los seres +10',
        category: 'intervention',
        cost: 15,
        requiredLevel: 15
      },
      'intervention-evolve': {
        name: 'Evolución Forzada',
        description: 'Fuerza hibridación inmediata',
        category: 'intervention',
        cost: 20,
        requiredLevel: 25
      },
      'intervention-resurrection': {
        name: 'Resurrección',
        description: 'Revive 1 ser muerto',
        category: 'intervention',
        cost: 30,
        requiredLevel: 30
      },
      'intervention-divine-guidance': {
        name: 'Guía Divina',
        description: 'Garantiza éxito del próximo evento',
        category: 'intervention',
        cost: 25,
        requiredLevel: 20
      },

      // Eventos Premium
      'event-premium-1': {
        name: 'Pack de Eventos: Sabiduría',
        description: '5 eventos adicionales de sabiduría profunda',
        category: 'events',
        requiredLevel: 10
      },
      'event-premium-2': {
        name: 'Pack de Eventos: Acción',
        description: '5 eventos adicionales de acción directa',
        category: 'events',
        requiredLevel: 30
      },
      'event-custom-editor': {
        name: 'Editor de Eventos',
        description: 'Crea tus propios eventos personalizados',
        category: 'tools',
        requiredLevel: 35
      },

      // Modo Sandbox
      'sandbox-mode': {
        name: 'Modo Sandbox',
        description: 'Configuración libre de parámetros',
        category: 'mode',
        requiredLevel: 20
      },
      'sandbox-unlimited-population': {
        name: 'Población Ilimitada',
        description: 'Remueve límite de 20 seres',
        category: 'sandbox',
        requiredLevel: 40
      },

      // Cosméticos
      'avatar-premium': {
        name: 'Avatares Premium',
        description: 'Desbloquea estilos visuales adicionales para seres',
        category: 'cosmetic',
        requiredLevel: 25
      },
      'theme-dark': {
        name: 'Tema Oscuro',
        description: 'Tema visual alternativo',
        category: 'cosmetic',
        free: true
      },
      'theme-light': {
        name: 'Tema Claro',
        description: 'Tema visual claro',
        category: 'cosmetic',
        requiredLevel: 10
      }
    };
  }

  /**
   * Verificar si puede comprar unlock
   */
  canAfford(unlockId, currency = 'divine_energy') {
    const unlock = this.getUnlocksCatalog()[unlockId];
    if (!unlock) return false;

    // Verificar nivel
    if (unlock.requiredLevel && this.player.level < unlock.requiredLevel) {
      return false;
    }

    // Verificar currency (implementar sistema de moneda)
    // Por ahora siempre true si cumple nivel
    return true;
  }

  /**
   * Guardar progreso
   */
  saveProgress() {
    localStorage.setItem('microsocieties-progression', JSON.stringify(this.player));
  }

  /**
   * Cargar progreso
   */
  loadProgress() {
    const saved = localStorage.getItem('microsocieties-progression');
    if (saved) {
      const data = JSON.parse(saved);
      this.player = {
        ...this.player,
        ...data
      };
    }
  }

  /**
   * Resetear progreso
   */
  resetProgress() {
    this.player = {
      level: 1,
      xp: 0,
      totalXP: 0,
      unlocks: ['speed-1x'],
      achievements: [],
      settings: {
        tutorialCompleted: false,
        soundEnabled: true,
        musicEnabled: true,
        notificationsEnabled: true
      },
      stats: {
        societiesCreated: 0,
        totalTurns: 0,
        successfulEvents: 0,
        failedEvents: 0,
        beingsCreated: 0,
        highestGeneration: 1,
        longestSurvival: 0,
        timePlayed: 0
      }
    };
    this.saveProgress();
  }

  /**
   * Exportar progreso (para compartir/backup)
   */
  exportProgress() {
    return {
      version: '1.0',
      timestamp: Date.now(),
      data: this.player
    };
  }

  /**
   * Importar progreso
   */
  importProgress(exportData) {
    if (exportData.version === '1.0' && exportData.data) {
      this.player = exportData.data;
      this.saveProgress();
      return true;
    }
    return false;
  }
}

// Exportar
window.ProgressionSystem = ProgressionSystem;
// logger.debug('📊 Sistema de Progresión cargado');
