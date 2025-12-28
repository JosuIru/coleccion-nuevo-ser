/**
 * FRANKENSTEIN MISSION VALIDATOR
 *
 * Sistema de validación de requisitos de misión para el Laboratorio Frankenstein.
 * Maneja la verificación de cumplimiento, visualización de progreso, y celebraciones
 * cuando se completan objetivos de misión.
 *
 * @module FrankensteinMissionValidator
 * @version 2.9.154
 *
 * EXTRACTED FROM: frankenstein-ui.js (lines 4287-4736 + 5267-5305)
 * TOTAL: ~480 lines
 *
 * FEATURES:
 * - Validación de requisitos de misión
 * - Panel de progreso de requisitos
 * - Checklist interactivo
 * - Resumen mini en workspace
 * - Briefing detallado de misión
 * - Sistema de milestones y celebraciones
 * - Detección de conflictos
 * - Tips y sugerencias de piezas
 *
 * DEPENDENCIES:
 * - FrankensteinMissionsSystem (referencia)
 * - FrankensteinLabUI (referencia)
 * - DOM Cache (referencia)
 */

export class FrankensteinMissionValidator {
  /**
   * Constructor del validador de misiones
   *
   * @param {FrankensteinMissionsSystem} missionsSystemRef - Referencia al sistema de misiones
   * @param {FrankensteinLabUI} labUIRef - Referencia al UI del laboratorio
   * @param {Object} domCache - Cache de elementos DOM
   */
  constructor(missionsSystemRef, labUIRef, domCache) {
    this.missionsSystem = missionsSystemRef;
    this.labUI = labUIRef;
    this.dom = domCache;

    // Estado interno
    this.lastProgressPercentage = 0;
    this.lastRequirementState = {};
    this.hasShownConfetti = false;
    this.pendingRequirementsUpdate = false;

    console.log('[FrankensteinMissionValidator] Inicializado');
  }

  /**
   * Actualizar panel completo de requisitos de misión
   *
   * Actualiza todos los elementos del panel de requisitos:
   * - Nombre de misión
   * - Poder actual vs requerido
   * - Barra de progreso
   * - Checklist de requisitos
   * - Mini resumen
   * - Briefing
   * - Tips de piezas
   *
   * @public
   */
  updateRequirementsPanel() {
    const selectedMission = this.labUI.selectedMission;
    const currentBeing = this.labUI.currentBeing;

    if (!selectedMission) {
      this.clearRequirementsPanel();
      return;
    }

    const missionNameEl = this.dom.currentMissionName || document.getElementById('current-mission-name');
    const currentPowerEl = this.dom.currentPower || document.getElementById('current-power');
    const requiredPowerEl = this.dom.requiredPower || document.getElementById('required-power');
    const progressFill = this.dom.progressFill || document.getElementById('progress-fill');
    const progressText = this.dom.progressText || document.getElementById('progress-text');
    const checklist = this.dom.requirementsChecklist || document.getElementById('requirements-checklist');

    if (!missionNameEl || !currentPowerEl || !requiredPowerEl || !progressFill || !progressText || !checklist) {
      this.pendingRequirementsUpdate = true;
      return;
    }

    this.pendingRequirementsUpdate = false;

    const mission = selectedMission;
    const requirements = mission.requirements || [];
    const missingRequirements = this.labUI.getMissingRequirements(requirements);

    // Update mission name
    missionNameEl.textContent = mission.name;

    // Update power indicator
    const currentPower = this.labUI.calculateCurrentPower();
    const requiredPower = mission.minPower || 0;

    currentPowerEl.textContent = Math.floor(currentPower);
    requiredPowerEl.textContent = requiredPower;

    // Update progress bar
    const fulfilled = this.countFulfilledRequirements(requirements);
    const total = requirements.length;
    const percentage = total > 0 ? (fulfilled / total) * 100 : 0;

    progressFill.style.width = `${percentage}%`;
    if (percentage > this.lastProgressPercentage) {
      progressFill.classList.add('increased');
      this.labUI._setTimeout(() => progressFill.classList.remove('increased'), 600);
    }

    progressText.textContent = `${fulfilled}/${total}`;

    this.lastProgressPercentage = percentage;

    // Update checklist
    this.updateRequirementsChecklist(requirements);

    // Show progress hint when requirements are fulfilled
    if (fulfilled > 0 && fulfilled < total) {
      this.labUI.showProgressHint(`${fulfilled}/${total} requisitos cumplidos`);
    }

    // Show confetti if complete
    if (fulfilled === total && total > 0 && !this.hasShownConfetti) {
      this.labUI.showConfetti();
      this.hasShownConfetti = true;
    }

    // Update FAB badges
    this.labUI.updateFABBadges();

    // Update missing requirements quick view
    this.labUI.updateMissingRequirementsQuickView();

    // Update mini summary in workspace
    this.updateRequirementsSummaryMini();
    this.updateRequirementsBriefing(mission, {
      requirements,
      requiredPower,
      fulfilled,
      total
    });
    this.updatePiecesTipsPanel(missingRequirements, requirements);
    this.labUI.updateMissionProgressUI({ fulfilled, total });
    this.handleRequirementMilestones(requirements);
    this.labUI.updateStickyRequirementsHeader();
  }

  /**
   * Actualizar checklist de requisitos
   *
   * @param {Array} requirements - Array de requisitos de misión
   * @public
   */
  updateRequirementsChecklist(requirements) {
    const checklist = this.dom.requirementsChecklist || document.getElementById('requirements-checklist');
    if (!checklist) return;

    checklist.innerHTML = requirements.map(req => {
      const fulfilled = this.isRequirementFulfilled(req);
      const conflict = this.hasRequirementConflict(req);
      const currentValue = Math.round(this.getRequirementCurrentValue(req));
      const targetValue = this.getRequirementTarget(req) || 0;
      const attrData = this.missionsSystem?.attributes?.[req.type];

      const className = fulfilled ? 'fulfilled' : (conflict ? 'conflict' : '');
      const icon = this.getRequirementIcon(req.type);
      const status = fulfilled ? '✅' : (conflict ? '🔴' : '⬜');
      const label = attrData ? `${attrData.icon} ${attrData.name}` : (req.description || req.type);

      return `
        <div class="requirement-item ${className}">
          <div class="requirement-icon">${icon}</div>
          <div class="requirement-text">
            <span>${label}</span>
            <span class="requirement-value">${targetValue ? `${currentValue}/${targetValue}` : currentValue}</span>
          </div>
          <div class="requirement-status">${status}</div>
        </div>
      `;
    }).join('');
  }

  /**
   * Limpiar panel de requisitos (cuando no hay misión seleccionada)
   *
   * @public
   */
  clearRequirementsPanel() {
    const missionNameEl = document.getElementById('current-mission-name');
    const currentPowerEl = document.getElementById('current-power');
    const requiredPowerEl = document.getElementById('required-power');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const checklist = document.getElementById('requirements-checklist');

    if (!missionNameEl || !currentPowerEl || !requiredPowerEl || !progressFill || !progressText || !checklist) {
      return;
    }

    missionNameEl.textContent = 'Sin Misión';
    currentPowerEl.textContent = '0';
    requiredPowerEl.textContent = '0';
    progressFill.style.width = '0%';
    progressText.textContent = '0/0';
    checklist.innerHTML = '';
    this.updateRequirementsSummaryMini();
    this.updateRequirementsBriefing(null);
    this.updatePiecesTipsPanel();
    this.lastRequirementState = {};
    this.labUI.updateMissionProgressUI({ fulfilled: 0, total: 0 });
    this.labUI.activeMiniChallenge = null;
    this.labUI.renderMiniChallenge();
    this.labUI.updateStickyRequirementsHeader(true);
  }

  /**
   * Actualizar resumen mini de requisitos (workspace panel)
   *
   * Panel compacto que muestra progreso de requisitos en el workspace
   *
   * @public
   */
  updateRequirementsSummaryMini() {
    const selectedMission = this.labUI.selectedMission;

    const miniSummary = document.getElementById('mission-requirements-summary');
    const progressFillMini = this.dom.progressFillMini || document.getElementById('progress-fill-mini');
    const progressLabelMini = this.dom.progressLabelMini || document.getElementById('progress-label-mini');
    const requirementsListMini = this.dom.requirementsListMini || document.getElementById('requirements-list-mini');
    const summaryLabel = this.dom.requirementsSummaryLabel || document.getElementById('requirements-summary-label');
    const viewAllBtn = document.getElementById('requirements-mini-view-all');

    if (!miniSummary) return;

    if (!selectedMission) {
      miniSummary.hidden = false;
      if (summaryLabel) summaryLabel.textContent = '--';
      if (progressFillMini) {
        progressFillMini.style.width = '0%';
        progressFillMini.style.backgroundColor = '#555';
      }
      if (progressLabelMini) {
        progressLabelMini.textContent = 'Selecciona una misión';
      }
      if (requirementsListMini) {
        requirementsListMini.innerHTML = '<p class="empty-card-message">Selecciona una misión para ver requisitos.</p>';
      }
      if (viewAllBtn) {
        viewAllBtn.style.display = 'none';
      }
      return;
    }

    const requirements = this.labUI.getCurrentMissionRequirements();
    const total = requirements.length;
    const fulfilled = this.countFulfilledRequirements(requirements);
    const percentage = total > 0 ? (fulfilled / total) * 100 : 0;

    miniSummary.hidden = false;

    if (summaryLabel) {
      summaryLabel.textContent = total > 0 ? `${fulfilled}/${total}` : '--';
    }

    if (progressFillMini) {
      progressFillMini.style.width = `${percentage}%`;
      progressFillMini.style.backgroundColor = percentage >= 100 ? '#4CAF50' : '#FF9800';
    }

    if (progressLabelMini) {
      progressLabelMini.textContent = total > 0 ? `${fulfilled}/${total} cumplidos` : 'Sin requisitos';
    }

    if (requirementsListMini) {
      if (requirements.length === 0) {
        requirementsListMini.innerHTML = '<p class="empty-card-message">Esta misión no tiene requisitos definidos.</p>';
      } else {
        const topRequirements = requirements.slice(0, 5);
        requirementsListMini.innerHTML = topRequirements.map(req => {
          const isFulfilled = this.isRequirementFulfilled(req);
          const icon = isFulfilled ? '✅' : '⬜';
          const attrData = this.missionsSystem?.attributes?.[req.type];
          const label = attrData ? `${attrData.icon} ${attrData.name}` : (req.description || req.type);
          const targetValue = this.getRequirementTarget(req) || 0;
          const currentValue = Math.round(this.getRequirementCurrentValue(req));

          return `
            <div class="requirement-mini-item ${isFulfilled ? 'fulfilled' : ''}">
              <span class="requirement-mini-icon">${icon}</span>
              <div class="requirement-mini-text">
                <span>${label}</span>
                <small>${targetValue ? `${currentValue}/${targetValue}` : currentValue}</small>
              </div>
            </div>
          `;
        }).join('');

        if (requirements.length > 5) {
          requirementsListMini.innerHTML += `
            <div class="requirement-mini-more">
              +${requirements.length - 5} más...
              <button class="view-all-requirements" onclick="document.getElementById('fab-requirements').click()">
                Ver todos
              </button>
            </div>
          `;
        }
      }
    }

    if (viewAllBtn) {
      viewAllBtn.style.display = requirements.length > 0 ? 'inline-flex' : 'none';
    }
  }

  /**
   * Actualizar briefing de misión dentro del modal de requisitos
   *
   * @param {Object|null} mission - Misión seleccionada
   * @param {Object} options - Opciones de briefing
   * @param {Array} options.requirements - Requisitos de la misión
   * @param {number} options.requiredPower - Poder requerido
   * @param {number} options.fulfilled - Requisitos cumplidos
   * @param {number} options.total - Total de requisitos
   * @public
   */
  updateRequirementsBriefing(mission, { requirements = [], requiredPower = 0, fulfilled = 0, total = 0 } = {}) {
    const nameEl = this.dom.modalMissionName || document.getElementById('modal-mission-name');
    const descEl = this.dom.modalMissionDescription || document.getElementById('modal-mission-description');
    const difficultyEl = this.dom.modalMissionDifficulty || document.getElementById('modal-mission-difficulty');
    const powerEl = this.dom.modalMissionPower || document.getElementById('modal-mission-power');
    const progressEl = this.dom.modalMissionProgress || document.getElementById('modal-mission-progress');
    const hintsList = this.dom.modalMissionHints || document.getElementById('modal-mission-hints');

    if (!nameEl || !descEl || !difficultyEl || !powerEl || !progressEl || !hintsList) {
      return;
    }

    if (!mission) {
      nameEl.textContent = 'Selecciona una misión';
      descEl.textContent = 'Elige una misión para conocer sus requisitos, objetivos y sugerencias.';
      difficultyEl.textContent = '--';
      difficultyEl.dataset.level = '';
      powerEl.textContent = '0';
      progressEl.textContent = '0/0';
      hintsList.innerHTML = '<li>Selecciona una misión para recibir sugerencias estratégicas.</li>';
      return;
    }

    nameEl.textContent = mission.name;
    descEl.textContent = mission.longDescription || mission.description || 'Misión sin descripción.';
    difficultyEl.textContent = mission.difficulty || '--';
    difficultyEl.dataset.level = mission.difficulty || '';
    powerEl.textContent = Math.max(requiredPower, mission.minPower || 0).toLocaleString('es-ES');
    progressEl.textContent = total > 0 ? `${fulfilled}/${total}` : '--';

    const missing = this.labUI.getMissingRequirements(requirements);
    if (missing.length === 0) {
      hintsList.innerHTML = '<li>¡Todos los requisitos están cubiertos! Puedes validar el ser.</li>';
      return;
    }

    hintsList.innerHTML = missing.slice(0, 4).map(req => {
      const attrData = this.missionsSystem?.attributes?.[req.type];
      const label = attrData ? `${attrData.icon} ${attrData.name}` : (req.description || req.type);
      const targetValue = this.getRequirementTarget(req) || 0;
      const currentValue = Math.round(this.getRequirementCurrentValue(req));
      return `<li><strong>${label}:</strong> ${currentValue}/${targetValue}. Añade piezas que mejoren este atributo.</li>`;
    }).join('');
  }

  /**
   * Actualizar panel de tips dentro del modal de piezas
   *
   * @param {Array} missing - Requisitos faltantes
   * @param {Array} requirements - Todos los requisitos
   * @public
   */
  updatePiecesTipsPanel(missing = [], requirements = []) {
    const tipsList = document.getElementById('pieces-tips-list');
    if (!tipsList) return;

    if (!this.labUI.selectedMission) {
      tipsList.innerHTML = '<li>Selecciona una misión para recibir recomendaciones de piezas.</li>';
      return;
    }

    if (!missing || missing.length === 0) {
      tipsList.innerHTML = '<li>¡Requisitos completos! Usa esta vista para refinar o validar tu ser.</li>';
      return;
    }

    tipsList.innerHTML = missing.slice(0, 3).map(req => {
      const attrData = this.missionsSystem?.attributes?.[req.type];
      const label = attrData ? `${attrData.icon} ${attrData.name}` : (req.description || req.type);
      const targetValue = this.getRequirementTarget(req) || 0;
      const currentValue = Math.round(this.getRequirementCurrentValue(req));
      const remaining = Math.max(0, targetValue - currentValue);
      return `<li>${label}: agrega piezas que aporten al menos ${remaining} puntos.</li>`;
    }).join('');
  }

  /**
   * Obtener icono para un tipo de requisito
   *
   * @param {string} type - Tipo de requisito
   * @returns {string} Emoji del icono
   * @public
   */
  getRequirementIcon(type) {
    const attribute = this.missionsSystem?.attributes?.[type];
    if (attribute) {
      return attribute.icon || '📊';
    }

    const icons = {
      chapter: '📖',
      exercise: '⚡',
      resource: '🔧',
      power: '💪',
      balance: '⚖️',
      category: '🏷️'
    };
    return icons[type] || '📋';
  }

  /**
   * Obtener valor objetivo de un requisito
   *
   * @param {Object} requirement - Requisito de misión
   * @returns {number} Valor objetivo
   * @public
   */
  getRequirementTarget(requirement) {
    if (!requirement) return 0;
    if (typeof requirement.count === 'number') return requirement.count;
    if (typeof requirement.min === 'number') return requirement.min;
    if (typeof requirement.value === 'number') return requirement.value;
    return 0;
  }

  /**
   * Obtener progreso actual de un requisito
   *
   * @param {Object} requirement - Requisito de misión
   * @returns {number} Valor actual
   * @public
   */
  getRequirementCurrentValue(requirement) {
    if (!requirement) return 0;

    if (requirement.type === 'power') {
      return Math.round(this.labUI.currentBeing?.totalPower || this.labUI.calculateCurrentPower());
    }

    if (this.missionsSystem?.attributes?.[requirement.type]) {
      if (this.labUI.currentBeing?.attributes?.[requirement.type] != null) {
        return Math.round(this.labUI.currentBeing.attributes[requirement.type]);
      }

      if (this.labUI.selectedPieces.length > 0) {
        return this.labUI.selectedPieces.reduce((sum, piece) => {
          const analysis = this.missionsSystem.analyzePiece(piece);
          return sum + (analysis.attributes[requirement.type] || 0);
        }, 0);
      }

      return 0;
    }

    return this.labUI.selectedPieces.filter(p => p.type === requirement.type).length;
  }

  /**
   * Verificar si un requisito está cumplido
   *
   * @param {Object} req - Requisito a verificar
   * @returns {boolean} True si está cumplido
   * @public
   */
  isRequirementFulfilled(req) {
    if (!req) return false;

    const target = this.getRequirementTarget(req) || 1;

    if (req.type === 'power') {
      return this.getRequirementCurrentValue(req) >= target;
    }

    if (this.missionsSystem?.attributes?.[req.type]) {
      return this.getRequirementCurrentValue(req) >= target;
    }

    const selectedByType = this.labUI.selectedPieces.filter(p => p.type === req.type);
    return selectedByType.length >= target;
  }

  /**
   * Verificar si un requisito tiene conflicto
   *
   * @param {Object} req - Requisito a verificar
   * @returns {boolean} True si hay conflicto
   * @public
   */
  hasRequirementConflict(req) {
    if (this.missionsSystem?.attributes?.[req.type] || req.type === 'power') {
      return false;
    }

    // Detectar conflictos (ej: demasiadas piezas de un tipo)
    const selectedByType = this.labUI.selectedPieces.filter(p => p.type === req.type);
    const maxCount = req.maxCount || Infinity;
    return selectedByType.length > maxCount;
  }

  /**
   * Contar requisitos cumplidos
   *
   * @param {Array} requirements - Array de requisitos
   * @returns {number} Cantidad de requisitos cumplidos
   * @public
   */
  countFulfilledRequirements(requirements) {
    return requirements.filter(req => this.isRequirementFulfilled(req)).length;
  }

  /**
   * Obtener clave única para un requisito (para tracking)
   *
   * @param {Object} requirement - Requisito
   * @returns {string} Clave única
   * @private
   */
  getRequirementKey(requirement) {
    if (!requirement) return '';
    return requirement.id ||
      `${requirement.type || 'req'}-${requirement.description || ''}-${requirement.count || requirement.min || requirement.value || ''}`;
  }

  /**
   * Manejar hitos de requisitos (detectar cuando se cumplen)
   *
   * Detecta cuando un requisito pasa de no cumplido a cumplido
   * y dispara celebraciones apropiadas.
   *
   * @param {Array} requirements - Requisitos de la misión actual
   * @public
   */
  handleRequirementMilestones(requirements = []) {
    if (!requirements || requirements.length === 0) {
      this.lastRequirementState = {};
      return;
    }

    if (!this.lastRequirementState) {
      this.lastRequirementState = {};
    }

    const newlyFulfilled = [];
    requirements.forEach(req => {
      const key = this.getRequirementKey(req);
      const isFulfilled = this.isRequirementFulfilled(req);
      if (isFulfilled && !this.lastRequirementState[key]) {
        newlyFulfilled.push(req);
      }
      this.lastRequirementState[key] = isFulfilled;
    });

    if (newlyFulfilled.length > 0) {
      const fulfilled = this.countFulfilledRequirements(requirements);
      const total = requirements.length;
      const percent = total > 0 ? (fulfilled / total) * 100 : 0;
      newlyFulfilled.forEach(req => this.triggerRequirementCelebration(req, percent, fulfilled, total));
    }
  }

  /**
   * Disparar celebración cuando se completa un requisito
   *
   * @param {Object} requirement - Requisito completado
   * @param {number} percent - Porcentaje de progreso total
   * @param {number} fulfilled - Requisitos cumplidos
   * @param {number} total - Total de requisitos
   * @public
   */
  triggerRequirementCelebration(requirement, percent, fulfilled, total) {
    const attrData = this.missionsSystem?.attributes?.[requirement.type];
    const label = attrData
      ? `${attrData.icon || '🎯'} ${attrData.name}`
      : (requirement.description || 'Requisito de misión');
    this.spawnProgressReward(percent || 0, label);
    this.labUI.showNotification(`✅ Objetivo completado: ${label}`, 'success', 2400);

    if (fulfilled === total && total > 0) {
      this.labUI.showNotification('🏆 ¡Todos los objetivos de la misión están listos! Valida tu ser.', 'success', 3500);
    }
  }

  /**
   * Crear animación de recompensa de progreso
   *
   * @param {number} percent - Porcentaje de progreso
   * @param {string} label - Etiqueta del requisito
   * @private
   */
  spawnProgressReward(percent, label) {
    const card = document.querySelector('.mission-progress-card');
    if (!card) return;

    const celebration = document.createElement('div');
    celebration.className = 'progress-celebration';
    celebration.textContent = `+ ${label}`;
    const clampPercent = Math.max(10, Math.min(90, percent || 0));
    celebration.style.left = `${clampPercent}%`;
    celebration.style.top = '10px';
    card.appendChild(celebration);
    this.labUI._setTimeout(() => celebration.remove(), 1200);
  }

  /**
   * Reset del estado de confetti
   * (llamar cuando se cambia de misión)
   *
   * @public
   */
  resetConfettiState() {
    this.hasShownConfetti = false;
  }

  /**
   * Cleanup del validador
   *
   * @public
   */
  destroy() {
    this.lastRequirementState = {};
    this.lastProgressPercentage = 0;
    this.hasShownConfetti = false;
    this.pendingRequirementsUpdate = false;

    console.log('[FrankensteinMissionValidator] Destruido');
  }
}
