/**
 * FrankensteinRewardsSystem - Sistema de recompensas y gamificación
 *
 * Gestiona el sistema de recompensas, login diario, HUD y logros
 * del laboratorio Frankenstein.
 *
 * Responsabilidades:
 * - Inicializar sistema de recompensas (FrankensteinRewards)
 * - Gestionar login diario y rachas
 * - Mostrar recompensas diarias al usuario
 * - Crear y gestionar HUD de recompensas
 * - Integrar botón de logros en la UI
 *
 * Dependencias externas:
 * - FrankensteinRewards: Motor de recompensas (debe estar cargado)
 * - frankenstein-ui.css: Estilos para modales y HUD
 *
 * @class FrankensteinRewardsSystem
 * @module frankenstein/core/rewards-system
 * @version 2.9.154
 * @since 2.9.154
 *
 * @example
 * const rewardsSystem = new FrankensteinRewardsSystem(labUIInstance, domCache);
 * rewardsSystem.init();
 */
export class FrankensteinRewardsSystem {
  /**
   * Constructor del sistema de recompensas
   *
   * @param {FrankensteinLabUI} labUIRef - Referencia a la instancia principal de LabUI
   * @param {Object} domCache - Cache de referencias DOM para optimización
   */
  constructor(labUIRef, domCache) {
    this.labUI = labUIRef;
    this.dom = domCache;
    this.rewardsEngine = null;
    this.hudElement = null;
    this.achievementsButton = null;
    this.dailyRewardModal = null;
  }

  /**
   * Inicializar sistema de recompensas
   *
   * Verifica disponibilidad del motor FrankensteinRewards,
   * lo inicializa si es necesario y verifica el login diario.
   *
   * @public
   * @returns {boolean} true si se inicializó correctamente
   */
  init() {
    if (typeof FrankensteinRewards === 'undefined') {
      console.warn('⚠️ FrankensteinRewards no disponible');
      return false;
    }

    // Crear instancia global si no existe
    if (!window.frankensteinRewards) {
      window.frankensteinRewards = new FrankensteinRewards();
    }

    this.rewardsEngine = window.frankensteinRewards;

    // Verificar login diario y mostrar recompensa si aplica
    const dailyReward = this.rewardsEngine.checkDailyLogin();
    if (dailyReward) {
      // Usar setTimeout a través de LabUI para registro de timeouts
      if (this.labUI && this.labUI._setTimeout) {
        this.labUI._setTimeout(() => {
          this.showDailyReward(dailyReward);
        }, 1500);
      } else {
        setTimeout(() => {
          this.showDailyReward(dailyReward);
        }, 1500);
      }
    }

    console.log('✅ Sistema de recompensas inicializado');
    return true;
  }

  /**
   * Mostrar modal de recompensa de login diario
   *
   * Crea y muestra un modal estilizado con información sobre:
   * - Racha de días consecutivos
   * - XP y monedas ganadas
   * - Indicador de nuevo récord si aplica
   *
   * @public
   * @param {Object} rewardData - Datos de la recompensa diaria
   * @param {number} rewardData.streak - Días consecutivos de login
   * @param {number} rewardData.xp - XP ganado
   * @param {number} rewardData.coins - Monedas ganadas
   * @param {boolean} rewardData.isNewRecord - Si es un nuevo récord de racha
   */
  showDailyReward(rewardData) {
    // Crear modal de recompensa
    const modal = document.createElement('div');
    modal.className = 'daily-reward-modal';
    modal.innerHTML = `
      <div class="daily-reward-content">
        <div class="daily-reward-icon">${rewardData.streak >= 7 ? '🔥' : '☀️'}</div>
        <h2>¡Bienvenido de nuevo!</h2>
        <p class="daily-streak">Racha: ${rewardData.streak} día${rewardData.streak !== 1 ? 's' : ''}</p>
        ${rewardData.isNewRecord ? '<p class="new-record">🏆 ¡Nuevo récord!</p>' : ''}
        <div class="daily-rewards">
          <span class="daily-xp">+${rewardData.xp} ⭐ XP</span>
          <span class="daily-coins">+${rewardData.coins} 🪙</span>
        </div>
        <button class="lab-button primary" onclick="this.closest('.daily-reward-modal').remove()">
          ¡Genial!
        </button>
      </div>
    `;

    // Estilos inline del modal
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10005;
      animation: frFadeIn 0.3s ease-out;
    `;

    const content = modal.querySelector('.daily-reward-content');
    content.style.cssText = `
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 20px;
      padding: 32px;
      text-align: center;
      color: white;
      max-width: 320px;
      border: 2px solid #fbbf24;
      box-shadow: 0 0 40px rgba(251, 191, 36, 0.3);
    `;

    // Estilos de elementos internos
    modal.querySelector('.daily-reward-icon').style.cssText = 'font-size: 64px; margin-bottom: 16px;';
    modal.querySelector('h2').style.cssText = 'margin: 0 0 8px; font-size: 24px;';
    modal.querySelector('.daily-streak').style.cssText = 'color: #fbbf24; font-size: 18px; margin: 8px 0;';
    modal.querySelector('.daily-rewards').style.cssText = 'display: flex; justify-content: center; gap: 20px; margin: 16px 0; font-size: 20px;';

    const newRecord = modal.querySelector('.new-record');
    if (newRecord) {
      newRecord.style.cssText = 'color: #22c55e; font-size: 14px; margin: 4px 0;';
    }

    // Aplicar recompensas al perfil del usuario
    if (this.rewardsEngine) {
      this.rewardsEngine.addXP(rewardData.xp, 'dailyLogin');
      this.rewardsEngine.addCoins(rewardData.coins, 'dailyLogin');
    }

    // Agregar modal al DOM
    document.body.appendChild(modal);
    this.dailyRewardModal = modal;

    // Auto-cerrar después de 5 segundos si el usuario no interactúa
    setTimeout(() => {
      if (modal && modal.parentElement) {
        modal.remove();
        this.dailyRewardModal = null;
      }
    }, 5000);
  }

  /**
   * Inicializar HUD de recompensas en la UI
   *
   * Crea el HUD persistente que muestra nivel, XP y monedas,
   * y agrega botón de logros al header de la aplicación.
   *
   * @public
   * @returns {boolean} true si se inicializó correctamente
   */
  initHUD() {
    if (!this.rewardsEngine) {
      console.warn('⚠️ Sistema de recompensas no inicializado');
      return false;
    }

    // Remover HUD existente si hay
    const existingHUD = document.getElementById('fr-rewards-hud');
    if (existingHUD) {
      existingHUD.remove();
    }

    // Crear nuevo HUD usando el motor de recompensas
    const hud = this.rewardsEngine.createRewardsHUD();
    document.body.appendChild(hud);
    this.hudElement = hud;

    // Agregar botón de logros al header si existe
    this._addAchievementsButton();

    console.log('✅ HUD de recompensas inicializado');
    return true;
  }

  /**
   * Agregar botón de logros al header de la aplicación
   *
   * @private
   */
  _addAchievementsButton() {
    const headerActions = document.querySelector('.lab-header-actions');
    if (!headerActions) return;

    // Remover botón existente si hay
    const existingBtn = document.getElementById('btn-achievements');
    if (existingBtn) {
      existingBtn.remove();
    }

    // Crear botón de logros
    const achievementsBtn = document.createElement('button');
    achievementsBtn.className = 'lab-header-icon-btn';
    achievementsBtn.id = 'btn-achievements';
    achievementsBtn.title = 'Logros';
    achievementsBtn.innerHTML = '<span>🏆</span>';
    achievementsBtn.onclick = () => {
      if (this.rewardsEngine && this.rewardsEngine.showAchievementsPanel) {
        this.rewardsEngine.showAchievementsPanel();
      }
    };

    // Insertar antes del botón de ajustes para mantener orden visual
    const settingsBtn = document.getElementById('btn-settings');
    if (settingsBtn) {
      headerActions.insertBefore(achievementsBtn, settingsBtn);
    } else {
      headerActions.appendChild(achievementsBtn);
    }

    this.achievementsButton = achievementsBtn;
  }

  /**
   * Limpiar y destruir el sistema de recompensas
   *
   * Remueve todos los elementos DOM creados (HUD, modal, botón de logros)
   * y limpia referencias.
   *
   * @public
   */
  destroy() {
    // Remover modal de recompensa diaria si existe
    if (this.dailyRewardModal && this.dailyRewardModal.parentElement) {
      this.dailyRewardModal.remove();
      this.dailyRewardModal = null;
    }

    // Remover HUD
    if (this.hudElement && this.hudElement.parentElement) {
      this.hudElement.remove();
      this.hudElement = null;
    }

    // Remover botón de logros
    if (this.achievementsButton && this.achievementsButton.parentElement) {
      this.achievementsButton.remove();
      this.achievementsButton = null;
    }

    // Limpiar referencias
    this.rewardsEngine = null;
    this.labUI = null;
    this.dom = null;

    console.log('✅ Sistema de recompensas destruido');
  }

  /**
   * Obtener estadísticas actuales del sistema de recompensas
   *
   * @public
   * @returns {Object|null} Objeto con estadísticas o null si no hay motor
   * @property {number} level - Nivel actual del usuario
   * @property {number} xp - XP actual
   * @property {number} coins - Monedas actuales
   * @property {number} streak - Racha de días consecutivos
   */
  getStats() {
    if (!this.rewardsEngine) return null;

    return {
      level: this.rewardsEngine.level || 1,
      xp: this.rewardsEngine.xp || 0,
      coins: this.rewardsEngine.coins || 0,
      streak: this.rewardsEngine.loginStreak || 0
    };
  }
}
