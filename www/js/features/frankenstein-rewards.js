/**
 * FRANKENSTEIN LAB - SISTEMA DE RECOMPENSAS
 * Sistema de XP, monedas, logros, rachas y feedback visual
 *
 * @version 1.0.0
 * @author J. Irurtzun & Claude
 */

class FrankensteinRewards {
  constructor() {
    this.storageKey = 'frankenstein-rewards';
    this.data = {
      // XP y nivel
      xp: 0,
      level: 1,
      totalXP: 0,

      // Monedas (energía de consciencia)
      coins: 100, // Empezar con 100
      totalCoinsEarned: 100,

      // Rachas
      currentStreak: 0,
      lastPlayDate: null,
      longestStreak: 0,

      // Logros desbloqueados
      achievements: [],

      // Estadísticas
      stats: {
        beingsCreated: 0,
        missionsCompleted: 0,
        piecesUsed: 0,
        quizzesCompleted: 0,
        perfectQuizzes: 0,
        daysPlayed: 0,
        totalPlayTime: 0
      },

      // Multiplicadores activos
      activeMultipliers: [],

      // Fecha de inicio
      startedAt: new Date().toISOString()
    };

    // Definiciones de logros
    this.achievementDefs = {
      // Logros de inicio
      'first-steps': {
        id: 'first-steps',
        name: 'Primeros Pasos',
        description: 'Crea tu primer ser transformador',
        icon: '👶',
        xpReward: 50,
        coinReward: 25,
        condition: (stats) => stats.beingsCreated >= 1
      },
      'piece-collector': {
        id: 'piece-collector',
        name: 'Coleccionista',
        description: 'Usa 50 piezas diferentes',
        icon: '📦',
        xpReward: 100,
        coinReward: 50,
        condition: (stats) => stats.piecesUsed >= 50
      },
      'mission-starter': {
        id: 'mission-starter',
        name: 'Agente del Cambio',
        description: 'Completa tu primera misión',
        icon: '🎯',
        xpReward: 75,
        coinReward: 40,
        condition: (stats) => stats.missionsCompleted >= 1
      },

      // Logros de constancia
      'streak-3': {
        id: 'streak-3',
        name: 'Constante',
        description: 'Juega 3 días seguidos',
        icon: '🔥',
        xpReward: 100,
        coinReward: 75,
        condition: (stats, data) => data.currentStreak >= 3
      },
      'streak-7': {
        id: 'streak-7',
        name: 'Comprometido',
        description: 'Juega 7 días seguidos',
        icon: '⚡',
        xpReward: 250,
        coinReward: 150,
        condition: (stats, data) => data.currentStreak >= 7
      },
      'streak-30': {
        id: 'streak-30',
        name: 'Dedicación Total',
        description: 'Juega 30 días seguidos',
        icon: '💎',
        xpReward: 1000,
        coinReward: 500,
        condition: (stats, data) => data.currentStreak >= 30
      },

      // Logros de maestría
      'quiz-master': {
        id: 'quiz-master',
        name: 'Maestro del Quiz',
        description: 'Completa 10 quizzes perfectos',
        icon: '🎓',
        xpReward: 200,
        coinReward: 100,
        condition: (stats) => stats.perfectQuizzes >= 10
      },
      'being-creator': {
        id: 'being-creator',
        name: 'Creador de Seres',
        description: 'Crea 10 seres diferentes',
        icon: '🧬',
        xpReward: 300,
        coinReward: 150,
        condition: (stats) => stats.beingsCreated >= 10
      },
      'mission-master': {
        id: 'mission-master',
        name: 'Maestro de Misiones',
        description: 'Completa 5 misiones diferentes',
        icon: '👑',
        xpReward: 400,
        coinReward: 200,
        condition: (stats) => stats.missionsCompleted >= 5
      },

      // Logros de nivel
      'level-5': {
        id: 'level-5',
        name: 'Aprendiz',
        description: 'Alcanza nivel 5',
        icon: '⭐',
        xpReward: 150,
        coinReward: 100,
        condition: (stats, data) => data.level >= 5
      },
      'level-10': {
        id: 'level-10',
        name: 'Experimentado',
        description: 'Alcanza nivel 10',
        icon: '🌟',
        xpReward: 300,
        coinReward: 200,
        condition: (stats, data) => data.level >= 10
      },
      'level-25': {
        id: 'level-25',
        name: 'Experto',
        description: 'Alcanza nivel 25',
        icon: '✨',
        xpReward: 750,
        coinReward: 500,
        condition: (stats, data) => data.level >= 25
      }
    };

    // XP necesario por nivel (curva exponencial suave)
    this.xpCurve = (level) => Math.floor(100 * Math.pow(level, 1.5));

    // Recompensas por acción
    this.rewards = {
      selectPiece: { xp: 2, coins: 0 },
      createBeing: { xp: 25, coins: 10 },
      validateBeing: { xp: 15, coins: 5 },
      completeMission: { xp: 100, coins: 50 },
      completeQuiz: { xp: 20, coins: 10 },
      perfectQuiz: { xp: 50, coins: 25 },
      dailyLogin: { xp: 30, coins: 20 },
      streakBonus: { xp: 10, coins: 5 } // Por día de racha
    };

    // Audio effects
    this.sounds = {
      xpGain: null,
      levelUp: null,
      achievement: null,
      coinGain: null
    };

    this.load();
    this.checkDailyLogin();
    this.initSounds();
  }

  /**
   * Inicializar efectos de sonido
   */
  initSounds() {
    // Crear AudioContext solo cuando haya interacción
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
      this.audioContext = null;
    }
  }

  /**
   * Crear sonido simple con Web Audio API
   */
  playSound(type) {
    if (!this.audioContext) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioCtx();
      } catch {
        return;
      }
    }

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    switch (type) {
      case 'xp':
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialDecayTo(0.01, ctx.currentTime + 0.2);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
        break;

      case 'levelUp':
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialDecayTo(0.01, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        break;

      case 'achievement':
        // Fanfare corta
        const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
          gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.1);
          gain.gain.exponentialDecayTo(0.01, ctx.currentTime + i * 0.1 + 0.15);
          osc.start(ctx.currentTime + i * 0.1);
          osc.stop(ctx.currentTime + i * 0.1 + 0.15);
        });
        break;

      case 'coins':
        oscillator.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
        oscillator.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.05); // E6
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialDecayTo(0.01, ctx.currentTime + 0.15);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.15);
        break;
    }
  }

  /**
   * Cargar datos desde localStorage
   */
  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.data = { ...this.data, ...parsed };
      }
    } catch (error) {
      logger.warn('[FrankensteinRewards] Error loading:', error);
    }
  }

  /**
   * Guardar datos en localStorage
   */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (error) {
      logger.warn('[FrankensteinRewards] Error saving:', error);
    }
  }

  /**
   * Verificar y aplicar bonus de login diario
   */
  checkDailyLogin() {
    const today = new Date().toDateString();
    const lastPlay = this.data.lastPlayDate;

    if (lastPlay !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastPlay === yesterday.toDateString()) {
        // Continuar racha
        this.data.currentStreak++;
        this.data.longestStreak = Math.max(this.data.longestStreak, this.data.currentStreak);
      } else if (lastPlay !== null) {
        // Racha rota
        this.data.currentStreak = 1;
      } else {
        // Primer día
        this.data.currentStreak = 1;
      }

      this.data.lastPlayDate = today;
      this.data.stats.daysPlayed++;

      // Aplicar recompensa diaria
      const dailyReward = this.calculateDailyReward();

      this.save();

      return dailyReward;
    }

    return null;
  }

  /**
   * Calcular recompensa diaria con bonus de racha
   */
  calculateDailyReward() {
    const base = this.rewards.dailyLogin;
    const streakBonus = this.rewards.streakBonus;
    const streakMultiplier = Math.min(this.data.currentStreak, 30); // Max 30 días bonus

    return {
      xp: base.xp + (streakBonus.xp * streakMultiplier),
      coins: base.coins + (streakBonus.coins * streakMultiplier),
      streak: this.data.currentStreak,
      isNewRecord: this.data.currentStreak > this.data.longestStreak
    };
  }

  /**
   * Dar XP al jugador
   */
  addXP(amount, source = 'unknown') {
    // Aplicar multiplicadores activos
    let multiplier = 1;
    this.data.activeMultipliers = this.data.activeMultipliers.filter(m => {
      if (Date.now() < m.expiresAt) {
        multiplier *= m.value;
        return true;
      }
      return false;
    });

    const finalAmount = Math.round(amount * multiplier);
    const oldLevel = this.data.level;

    this.data.xp += finalAmount;
    this.data.totalXP += finalAmount;

    // Verificar level up
    const levelsGained = [];
    while (this.data.xp >= this.xpCurve(this.data.level)) {
      this.data.xp -= this.xpCurve(this.data.level);
      this.data.level++;
      levelsGained.push(this.data.level);
    }

    this.save();
    this.checkAchievements();

    // Mostrar feedback visual
    if (finalAmount > 0) {
      this.showXPPopup(finalAmount, source);
      this.playSound('xp');
    }

    // Feedback de level up
    if (levelsGained.length > 0) {
      this.showLevelUpAnimation(this.data.level);
      this.playSound('levelUp');
    }

    return {
      xpGained: finalAmount,
      newXP: this.data.xp,
      level: this.data.level,
      xpToNext: this.xpCurve(this.data.level),
      levelsGained,
      multiplierApplied: multiplier > 1 ? multiplier : null
    };
  }

  /**
   * Dar monedas al jugador
   */
  addCoins(amount, source = 'unknown') {
    this.data.coins += amount;
    this.data.totalCoinsEarned += amount;
    this.save();

    if (amount > 0) {
      this.showCoinPopup(amount, source);
      this.playSound('coins');
    }

    return {
      coinsGained: amount,
      totalCoins: this.data.coins
    };
  }

  /**
   * Gastar monedas
   */
  spendCoins(amount) {
    if (this.data.coins >= amount) {
      this.data.coins -= amount;
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Dar recompensa completa (XP + monedas)
   */
  giveReward(type, customMultiplier = 1) {
    const reward = this.rewards[type];
    if (!reward) {
      logger.warn(`[FrankensteinRewards] Unknown reward type: ${type}`);
      return null;
    }

    const xpResult = this.addXP(Math.round(reward.xp * customMultiplier), type);
    const coinResult = this.addCoins(Math.round(reward.coins * customMultiplier), type);

    // Actualizar estadísticas según el tipo
    switch (type) {
      case 'createBeing':
        this.data.stats.beingsCreated++;
        break;
      case 'completeMission':
        this.data.stats.missionsCompleted++;
        break;
      case 'completeQuiz':
        this.data.stats.quizzesCompleted++;
        break;
      case 'perfectQuiz':
        this.data.stats.perfectQuizzes++;
        this.data.stats.quizzesCompleted++;
        break;
    }

    this.save();
    this.checkAchievements();

    return {
      type,
      ...xpResult,
      ...coinResult
    };
  }

  /**
   * Incrementar contador de piezas usadas
   */
  trackPieceUsed() {
    this.data.stats.piecesUsed++;
    this.save();

    // Pequeña recompensa por seleccionar piezas
    if (this.data.stats.piecesUsed % 10 === 0) {
      // Bonus cada 10 piezas
      this.addXP(10, 'pieceMilestone');
    }
  }

  /**
   * Verificar y desbloquear logros
   */
  checkAchievements() {
    const newAchievements = [];

    for (const [id, def] of Object.entries(this.achievementDefs)) {
      if (!this.data.achievements.includes(id)) {
        if (def.condition(this.data.stats, this.data)) {
          this.unlockAchievement(id);
          newAchievements.push(def);
        }
      }
    }

    return newAchievements;
  }

  /**
   * Desbloquear un logro específico
   */
  unlockAchievement(achievementId) {
    if (this.data.achievements.includes(achievementId)) {
      return false;
    }

    const def = this.achievementDefs[achievementId];
    if (!def) {
      logger.warn(`[FrankensteinRewards] Unknown achievement: ${achievementId}`);
      return false;
    }

    this.data.achievements.push(achievementId);

    // Dar recompensas del logro
    if (def.xpReward) {
      this.data.xp += def.xpReward;
      this.data.totalXP += def.xpReward;
    }
    if (def.coinReward) {
      this.data.coins += def.coinReward;
      this.data.totalCoinsEarned += def.coinReward;
    }

    this.save();

    // Mostrar animación de logro
    this.showAchievementUnlocked(def);
    this.playSound('achievement');

    return true;
  }

  /**
   * Mostrar popup de XP ganado
   */
  showXPPopup(amount, source) {
    const popup = document.createElement('div');
    popup.className = 'fr-reward-popup fr-xp-popup';
    popup.innerHTML = `
      <span class="fr-reward-icon">⭐</span>
      <span class="fr-reward-amount">+${amount} XP</span>
    `;
    popup.style.cssText = `
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translateX(-50%) translateY(0);
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 50px;
      font-weight: bold;
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 10001;
      animation: frRewardPopup 1.5s ease-out forwards;
      box-shadow: 0 4px 20px rgba(79, 70, 229, 0.5);
    `;

    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1500);
  }

  /**
   * Mostrar popup de monedas ganadas
   */
  showCoinPopup(amount, source) {
    const popup = document.createElement('div');
    popup.className = 'fr-reward-popup fr-coin-popup';
    popup.innerHTML = `
      <span class="fr-reward-icon">🪙</span>
      <span class="fr-reward-amount">+${amount}</span>
    `;
    popup.style.cssText = `
      position: fixed;
      top: 28%;
      left: 50%;
      transform: translateX(-50%) translateY(0);
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 10px 20px;
      border-radius: 50px;
      font-weight: bold;
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      z-index: 10000;
      animation: frRewardPopup 1.5s ease-out forwards;
      box-shadow: 0 4px 20px rgba(245, 158, 11, 0.5);
    `;

    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1500);
  }

  /**
   * Mostrar animación de subida de nivel
   */
  showLevelUpAnimation(newLevel) {
    const overlay = document.createElement('div');
    overlay.className = 'fr-levelup-overlay';
    overlay.innerHTML = `
      <div class="fr-levelup-content">
        <div class="fr-levelup-icon">🎉</div>
        <div class="fr-levelup-title">¡NIVEL ${newLevel}!</div>
        <div class="fr-levelup-subtitle">Has alcanzado un nuevo nivel</div>
        <div class="fr-levelup-rewards">
          <span>+50 🪙</span>
        </div>
      </div>
    `;
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10002;
      animation: frFadeIn 0.3s ease-out;
    `;

    const content = overlay.querySelector('.fr-levelup-content');
    content.style.cssText = `
      text-align: center;
      color: white;
      animation: frScaleIn 0.5s ease-out;
    `;

    overlay.querySelector('.fr-levelup-icon').style.cssText = `
      font-size: 80px;
      animation: frBounce 0.6s ease-out;
    `;

    overlay.querySelector('.fr-levelup-title').style.cssText = `
      font-size: 48px;
      font-weight: bold;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 16px 0 8px;
    `;

    overlay.querySelector('.fr-levelup-subtitle').style.cssText = `
      font-size: 18px;
      color: #94a3b8;
      margin-bottom: 16px;
    `;

    overlay.querySelector('.fr-levelup-rewards').style.cssText = `
      font-size: 24px;
    `;

    // Bonus de monedas por nivel
    this.addCoins(50, 'levelUp');

    document.body.appendChild(overlay);

    overlay.addEventListener('click', () => overlay.remove());
    setTimeout(() => overlay.remove(), 3000);
  }

  /**
   * Mostrar notificación de logro desbloqueado
   */
  showAchievementUnlocked(achievement) {
    const toast = document.createElement('div');
    toast.className = 'fr-achievement-toast';
    toast.innerHTML = `
      <div class="fr-achievement-icon">${achievement.icon}</div>
      <div class="fr-achievement-info">
        <div class="fr-achievement-label">¡Logro Desbloqueado!</div>
        <div class="fr-achievement-name">${achievement.name}</div>
        <div class="fr-achievement-desc">${achievement.description}</div>
        <div class="fr-achievement-rewards">
          ${achievement.xpReward ? `<span>+${achievement.xpReward} ⭐</span>` : ''}
          ${achievement.coinReward ? `<span>+${achievement.coinReward} 🪙</span>` : ''}
        </div>
      </div>
    `;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 2px solid #fbbf24;
      border-radius: 16px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      z-index: 10003;
      animation: frSlideIn 0.5s ease-out;
      box-shadow: 0 8px 32px rgba(251, 191, 36, 0.3);
      max-width: 350px;
    `;

    toast.querySelector('.fr-achievement-icon').style.cssText = `
      font-size: 48px;
      animation: frPulse 1s ease-in-out infinite;
    `;

    toast.querySelector('.fr-achievement-info').style.cssText = `
      color: white;
    `;

    toast.querySelector('.fr-achievement-label').style.cssText = `
      font-size: 12px;
      color: #fbbf24;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    `;

    toast.querySelector('.fr-achievement-name').style.cssText = `
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 4px;
    `;

    toast.querySelector('.fr-achievement-desc').style.cssText = `
      font-size: 14px;
      color: #94a3b8;
      margin-bottom: 8px;
    `;

    toast.querySelector('.fr-achievement-rewards').style.cssText = `
      display: flex;
      gap: 12px;
      font-size: 14px;
      color: #fbbf24;
    `;

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'frSlideOut 0.5s ease-in forwards';
      setTimeout(() => toast.remove(), 500);
    }, 5000);
  }

  /**
   * Crear HUD de recompensas para la UI
   */
  createRewardsHUD() {
    const hud = document.createElement('div');
    hud.id = 'fr-rewards-hud';
    hud.innerHTML = `
      <div class="fr-hud-item fr-hud-level" title="Tu nivel">
        <span class="fr-hud-icon">⭐</span>
        <span class="fr-hud-value" id="fr-hud-level">${this.data.level}</span>
      </div>
      <div class="fr-hud-item fr-hud-xp" title="Experiencia">
        <div class="fr-xp-bar">
          <div class="fr-xp-fill" id="fr-hud-xp-fill" style="width: ${(this.data.xp / this.xpCurve(this.data.level)) * 100}%"></div>
        </div>
        <span class="fr-xp-text" id="fr-hud-xp-text">${this.data.xp}/${this.xpCurve(this.data.level)}</span>
      </div>
      <div class="fr-hud-item fr-hud-coins" title="Energía de Consciencia">
        <span class="fr-hud-icon">🪙</span>
        <span class="fr-hud-value" id="fr-hud-coins">${this.data.coins}</span>
      </div>
      <div class="fr-hud-item fr-hud-streak" title="Racha diaria">
        <span class="fr-hud-icon">🔥</span>
        <span class="fr-hud-value" id="fr-hud-streak">${this.data.currentStreak}</span>
      </div>
    `;

    hud.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      display: flex;
      gap: 12px;
      z-index: 9999;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(10px);
      padding: 8px 16px;
      border-radius: 50px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;

    return hud;
  }

  /**
   * Actualizar HUD
   */
  updateHUD() {
    const levelEl = document.getElementById('fr-hud-level');
    const xpFillEl = document.getElementById('fr-hud-xp-fill');
    const xpTextEl = document.getElementById('fr-hud-xp-text');
    const coinsEl = document.getElementById('fr-hud-coins');
    const streakEl = document.getElementById('fr-hud-streak');

    if (levelEl) levelEl.textContent = this.data.level;
    if (xpFillEl) xpFillEl.style.width = `${(this.data.xp / this.xpCurve(this.data.level)) * 100}%`;
    if (xpTextEl) xpTextEl.textContent = `${this.data.xp}/${this.xpCurve(this.data.level)}`;
    if (coinsEl) coinsEl.textContent = this.data.coins;
    if (streakEl) streakEl.textContent = this.data.currentStreak;
  }

  /**
   * Obtener todos los logros con estado
   */
  getAllAchievements() {
    return Object.values(this.achievementDefs).map(def => ({
      ...def,
      unlocked: this.data.achievements.includes(def.id)
    }));
  }

  /**
   * Obtener estadísticas del jugador
   */
  getPlayerStats() {
    return {
      level: this.data.level,
      xp: this.data.xp,
      xpToNext: this.xpCurve(this.data.level),
      totalXP: this.data.totalXP,
      coins: this.data.coins,
      streak: this.data.currentStreak,
      longestStreak: this.data.longestStreak,
      achievementsUnlocked: this.data.achievements.length,
      totalAchievements: Object.keys(this.achievementDefs).length,
      ...this.data.stats
    };
  }

  /**
   * Mostrar panel de logros
   */
  showAchievementsPanel() {
    const achievements = this.getAllAchievements();
    const unlocked = achievements.filter(a => a.unlocked);
    const locked = achievements.filter(a => !a.unlocked);

    const panel = document.createElement('div');
    panel.className = 'fr-achievements-panel';
    panel.innerHTML = `
      <div class="fr-panel-header">
        <h2>🏆 Logros</h2>
        <span class="fr-panel-count">${unlocked.length}/${achievements.length}</span>
        <button class="fr-panel-close" onclick="this.closest('.fr-achievements-panel').remove()">✕</button>
      </div>
      <div class="fr-panel-body">
        ${unlocked.length > 0 ? `
          <div class="fr-achievement-section">
            <h3>Desbloqueados</h3>
            <div class="fr-achievement-grid">
              ${unlocked.map(a => `
                <div class="fr-achievement-card fr-unlocked">
                  <span class="fr-achievement-icon">${a.icon}</span>
                  <span class="fr-achievement-name">${a.name}</span>
                  <span class="fr-achievement-desc">${a.description}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        ${locked.length > 0 ? `
          <div class="fr-achievement-section">
            <h3>Por desbloquear</h3>
            <div class="fr-achievement-grid">
              ${locked.map(a => `
                <div class="fr-achievement-card fr-locked">
                  <span class="fr-achievement-icon">🔒</span>
                  <span class="fr-achievement-name">${a.name}</span>
                  <span class="fr-achievement-desc">${a.description}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this.applyPanelStyles(panel);
    document.body.appendChild(panel);
  }

  /**
   * Aplicar estilos al panel de logros
   */
  applyPanelStyles(panel) {
    panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 10004;
      overflow: hidden;
      animation: frScaleIn 0.3s ease-out;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    `;
  }

  /**
   * Inyectar estilos CSS para las animaciones
   */
  static injectStyles() {
    if (document.getElementById('fr-rewards-styles')) return;

    const style = document.createElement('style');
    style.id = 'fr-rewards-styles';
    style.textContent = `
      @keyframes frRewardPopup {
        0% { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.8); }
        20% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.1); }
        40% { transform: translateX(-50%) translateY(0) scale(1); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-40px) scale(0.9); }
      }

      @keyframes frFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes frScaleIn {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }

      @keyframes frBounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }

      @keyframes frPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      @keyframes frSlideIn {
        from { opacity: 0; transform: translateX(100px); }
        to { opacity: 1; transform: translateX(0); }
      }

      @keyframes frSlideOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100px); }
      }

      .fr-hud-item {
        display: flex;
        align-items: center;
        gap: 6px;
        color: white;
        font-size: 14px;
        font-weight: 600;
      }

      .fr-hud-icon {
        font-size: 16px;
      }

      .fr-hud-xp {
        flex-direction: column;
        gap: 2px;
      }

      .fr-xp-bar {
        width: 60px;
        height: 6px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        overflow: hidden;
      }

      .fr-xp-fill {
        height: 100%;
        background: linear-gradient(90deg, #4f46e5, #7c3aed);
        border-radius: 3px;
        transition: width 0.3s ease;
      }

      .fr-xp-text {
        font-size: 12px;
        color: #94a3b8;
      }

      .fr-panel-header {
        display: flex;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
      }

      .fr-panel-header h2 {
        margin: 0;
        font-size: 20px;
        flex: 1;
      }

      .fr-panel-count {
        color: #fbbf24;
        font-size: 14px;
        margin-right: 16px;
      }

      .fr-panel-close {
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 20px;
        cursor: pointer;
        padding: 4px 8px;
      }

      .fr-panel-close:hover {
        color: white;
      }

      .fr-panel-body {
        padding: 20px;
        overflow-y: auto;
        max-height: calc(80vh - 60px);
      }

      .fr-achievement-section h3 {
        color: #94a3b8;
        font-size: 14px;
        margin: 0 0 12px 0;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .fr-achievement-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 12px;
        margin-bottom: 24px;
      }

      .fr-achievement-card {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        transition: transform 0.2s, background 0.2s;
      }

      .fr-achievement-card:hover {
        transform: translateY(-2px);
        background: rgba(255, 255, 255, 0.08);
      }

      .fr-achievement-card.fr-unlocked {
        border: 1px solid rgba(251, 191, 36, 0.3);
      }

      .fr-achievement-card.fr-locked {
        opacity: 0.5;
      }

      .fr-achievement-card .fr-achievement-icon {
        font-size: 32px;
        display: block;
        margin-bottom: 8px;
      }

      .fr-achievement-card .fr-achievement-name {
        color: white;
        font-weight: 600;
        font-size: 14px;
        display: block;
        margin-bottom: 4px;
      }

      .fr-achievement-card .fr-achievement-desc {
        color: #64748b;
        font-size: 12px;
        display: block;
      }
    `;

    document.head.appendChild(style);
  }
}

// Inyectar estilos automáticamente
FrankensteinRewards.injectStyles();

// Crear instancia global
window.frankensteinRewards = new FrankensteinRewards();

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FrankensteinRewards;
}
