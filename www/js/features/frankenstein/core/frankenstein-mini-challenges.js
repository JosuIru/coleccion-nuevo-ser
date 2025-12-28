/**
 * frankenstein-mini-challenges.js
 *
 * Sistema de mini-challenges (eventos relámpago) para el Laboratorio Frankenstein.
 * Gestiona la generación, renderizado y completado de desafíos dinámicos que otorgan
 * piezas especiales como recompensa.
 *
 * Características principales:
 * - Generación automática de challenges basados en misiones activas
 * - Sistema de progreso y tracking
 * - Recompensas de piezas especiales al completar
 * - Historial de challenges completados
 * - Integración con sistema de misiones y atributos
 *
 * @module FrankensteinMiniChallenges
 * @requires FrankensteinMissions
 */

/**
 * @class FrankensteinMiniChallenges
 * @description Gestiona el sistema de mini-challenges del Laboratorio Frankenstein
 *
 * @example
 * const miniChallenges = new FrankensteinMiniChallenges(
 *   missionsSystemRef,
 *   labUIRef,
 *   domCache
 * );
 *
 * // Generar nuevo challenge
 * miniChallenges.generate(currentBeing, selectedMission);
 *
 * // Actualizar progreso
 * miniChallenges.updateProgress();
 *
 * // Completar challenge
 * miniChallenges.complete();
 */
export class FrankensteinMiniChallenges {
  /**
   * @constructor
   * @param {FrankensteinMissions} missionsSystemRef - Referencia al sistema de misiones
   * @param {FrankensteinUI} labUIRef - Referencia a la UI del laboratorio
   * @param {Object} domCache - Caché de elementos DOM
   */
  constructor(missionsSystemRef, labUIRef, domCache) {
    /**
     * @property {FrankensteinMissions} missionsSystem - Sistema de misiones
     */
    this.missionsSystem = missionsSystemRef;

    /**
     * @property {FrankensteinUI} labUI - Referencia a la UI del laboratorio
     */
    this.labUI = labUIRef;

    /**
     * @property {Object} dom - Caché de elementos DOM
     */
    this.dom = domCache;

    /**
     * @property {Object|null} currentChallenge - Challenge activo actual
     * @property {number} currentChallenge.id - ID único del challenge
     * @property {string} currentChallenge.attribute - Atributo objetivo
     * @property {number} currentChallenge.target - Valor objetivo a alcanzar
     * @property {string} currentChallenge.createdAt - Fecha de creación ISO
     * @property {boolean} currentChallenge.completed - Estado de completado
     */
    this.currentChallenge = null;

    /**
     * @property {Array<Object>} history - Historial de challenges completados
     * @property {number} history[].id - ID del challenge
     * @property {string} history[].label - Etiqueta descriptiva
     * @property {string} history[].timestamp - Fecha de completado ISO
     * @property {string} [history[].reward] - Título de la pieza recompensa
     */
    this.history = [];
  }

  /**
   * Genera un nuevo mini-challenge basado en la misión activa
   *
   * @param {Object} being - Ser actual en construcción
   * @param {Object} mission - Misión seleccionada
   * @param {boolean} [force=false] - Forzar generación aunque exista challenge activo
   *
   * @description
   * - Prioriza atributos que faltan para completar la misión
   * - Si no hay requisitos faltantes, selecciona atributo aleatorio
   * - Establece objetivo basado en el valor actual + boost aleatorio
   * - Solo genera si no existe challenge activo o si se fuerza
   *
   * @example
   * miniChallenges.generate(currentBeing, selectedMission, true);
   */
  generate(being, mission, force = false) {
    if (!mission) {
      this.currentChallenge = null;
      this.render();
      return;
    }

    if (this.currentChallenge && !force && !this.currentChallenge.completed) {
      return;
    }

    const requirements = this.labUI.getCurrentMissionRequirements();
    const missing = this.labUI.getMissingRequirements(requirements);
    let attrKey = null;
    let baseRequirement = null;

    // Priorizar atributos faltantes de la misión
    if (missing.length > 0) {
      baseRequirement = missing.find(req => this.missionsSystem?.attributes?.[req.type]);
      attrKey = baseRequirement?.type || null;
    }

    // Fallback: seleccionar atributo aleatorio
    const attributeKeys = Object.keys(this.missionsSystem?.attributes || {});
    if (!attrKey && attributeKeys.length > 0) {
      attrKey = attributeKeys[Math.floor(Math.random() * attributeKeys.length)];
    }

    if (!attrKey) {
      this.currentChallenge = null;
      this.render();
      return;
    }

    // Calcular objetivo del challenge
    const currentValue = Math.round(being?.attributes?.[attrKey] || 0);
    const baseTarget = baseRequirement ? this.labUI.getRequirementTarget(baseRequirement) : currentValue + 20;
    const randomBoost = 15 + Math.round(Math.random() * 25);
    const target = Math.max(baseTarget, currentValue + randomBoost);

    this.currentChallenge = {
      id: Date.now(),
      attribute: attrKey,
      target,
      createdAt: new Date().toISOString(),
      completed: false
    };

    this.render();
    this.updateProgress(being);
  }

  /**
   * Renderiza el challenge actual en la UI
   *
   * @description
   * - Muestra información del challenge activo
   * - Actualiza barra de progreso
   * - Renderiza historial de challenges completados
   * - Maneja estados vacíos (sin misión, sin challenge)
   *
   * @example
   * miniChallenges.render();
   */
  render() {
    const body = this.dom.miniChallengeBody || document.getElementById('mini-challenge-body');
    const titleEl = this.dom.miniChallengeTitle || document.getElementById('mini-challenge-title');
    if (!body) return;

    // Estado: sin misión activa
    if (!this.labUI.selectedMission) {
      if (titleEl) titleEl.textContent = 'Sin misión activa';
      body.innerHTML = '<p class="empty-card-message">Selecciona una misión para recibir eventos dinámicos.</p>';
      return;
    }

    // Estado: sin challenge activo
    if (!this.currentChallenge) {
      if (titleEl) titleEl.textContent = 'Sin evento activo';
      body.innerHTML = '<p class="empty-card-message">Pulsa el botón ↻ para generar un evento relámpago.</p>';
      return;
    }

    // Renderizar challenge activo
    const challenge = this.currentChallenge;
    const attrData = this.missionsSystem?.attributes?.[challenge.attribute];
    const value = Math.round(this.labUI.currentBeing?.attributes?.[challenge.attribute] || 0);
    const percent = Math.min(100, Math.round((value / challenge.target) * 100));
    const status = challenge.completed ? 'Completado' : `${value}/${challenge.target}`;

    if (titleEl) {
      titleEl.textContent = challenge.completed
        ? 'Evento completado'
        : `${attrData?.icon || '🎯'} ${attrData?.name || 'Evento activo'}`;
    }

    body.innerHTML = `
      <div class="mini-challenge-meta">
        <span class="mini-challenge-attr">${attrData?.icon || '🎯'} ${attrData?.name || 'Atributo'}</span>
        <span class="mini-challenge-status">${status}</span>
      </div>
      <p class="mini-challenge-description">
        ${challenge.completed
          ? 'Evento superado. Se generará un nuevo reto en breve.'
          : 'Impulsa este atributo hasta la meta para desbloquear recompensas del laboratorio.'}
      </p>
      <div class="mini-challenge-progress-track">
        <div class="mini-challenge-progress-fill" style="width:${percent}%"></div>
      </div>
      <small class="mini-challenge-progress-hint">${percent >= 100 ? 'Listo para celebrar.' : `Progreso: ${percent}%`}</small>
      ${this.getHistoryMarkup()}
    `;
  }

  /**
   * Genera el markup HTML del historial de challenges
   *
   * @returns {string} HTML del historial
   *
   * @description
   * - Muestra los últimos 3 challenges completados
   * - Incluye hora de completado y recompensa obtenida
   * - Maneja estado vacío (sin historial)
   *
   * @private
   */
  getHistoryMarkup() {
    if (!this.history.length) {
      return '<div class="mini-challenge-history"><h5>Registro</h5><p class="mini-challenge-history-empty">Sin eventos completados.</p></div>';
    }

    const items = this.history.slice(0, 3).map(entry => {
      const date = new Date(entry.timestamp);
      const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const rewardTag = entry.reward ? `<span class="mini-challenge-reward">🎁 ${entry.reward}</span>` : '';
      return `<li><span>${entry.label}${rewardTag}</span><span>${time}</span></li>`;
    }).join('');

    return `<div class="mini-challenge-history"><h5>Registro</h5><ul>${items}</ul></div>`;
  }

  /**
   * Actualiza el progreso del challenge actual
   *
   * @param {Object} being - Ser actual en construcción
   *
   * @description
   * - Verifica si se alcanzó el objetivo
   * - Completa automáticamente el challenge si se cumple
   * - Re-renderiza la UI con el nuevo progreso
   *
   * @example
   * miniChallenges.updateProgress(currentBeing);
   */
  updateProgress(being) {
    if (!this.currentChallenge || !this.labUI.selectedMission) {
      this.render();
      return;
    }

    const value = Math.round(being?.attributes?.[this.currentChallenge.attribute] || 0);
    if (!this.currentChallenge.completed && value >= this.currentChallenge.target) {
      this.complete(being);
    } else {
      this.render();
    }
  }

  /**
   * Completa el challenge actual y otorga recompensas
   *
   * @param {Object} being - Ser actual en construcción
   *
   * @description
   * - Marca el challenge como completado
   * - Añade entrada al historial
   * - Muestra notificación de éxito
   * - Otorga pieza especial como recompensa
   * - Genera nuevo challenge automáticamente
   *
   * @example
   * miniChallenges.complete(currentBeing);
   */
  complete(being) {
    if (!this.currentChallenge || this.currentChallenge.completed) return;

    const attrData = this.missionsSystem?.attributes?.[this.currentChallenge.attribute];
    const label = attrData?.name || 'Evento';

    this.currentChallenge.completed = true;
    this.history.unshift({
      id: this.currentChallenge.id,
      label,
      timestamp: new Date().toISOString()
    });

    this.render();
    this.labUI.showNotification(`⚡ Evento relámpago completado: ${label}`, 'success', 3200);
    this.labUI.spawnProgressReward(100, 'Evento');

    // Otorgar pieza especial
    if (this.currentChallenge?.attribute) {
      this.rewardSpecialPiece(this.currentChallenge.attribute);
    }

    // Generar nuevo challenge después de un delay
    this.labUI._setTimeout(() => this.generate(being, this.labUI.selectedMission, true), 3500);
  }

  /**
   * Otorga una pieza especial como recompensa por completar challenge
   *
   * @param {string} attributeKey - Clave del atributo del challenge
   *
   * @description
   * - Genera pieza con valores altos del atributo principal
   * - Añade atributo de apoyo complementario (50% del valor principal)
   * - Marca como pieza legendaria con categoría especial
   * - Añade automáticamente al inventario (bypass quiz)
   * - Actualiza historial con información de la recompensa
   *
   * @example
   * miniChallenges.rewardSpecialPiece('empathy');
   */
  rewardSpecialPiece(attributeKey) {
    const attrData = this.missionsSystem?.attributes?.[attributeKey];
    if (!attrData) return;

    // Verificar espacio en inventario
    if (this.labUI.selectedPieces.length >= 12) {
      this.labUI.showNotification('Inventario lleno: no puedes recibir la pieza especial. Libera un espacio.', 'warning', 4200);
      return;
    }

    // Calcular valores de atributos
    const rewardValue = 30 + Math.round(Math.random() * 25);
    const supportAttribute = this.getSupportAttributeForReward(attributeKey);
    const syntheticAttributes = { [attributeKey]: rewardValue };

    if (supportAttribute && this.missionsSystem?.attributes?.[supportAttribute]) {
      syntheticAttributes[supportAttribute] = Math.round(rewardValue * 0.5);
    }

    // Crear pieza especial
    const rewardPiece = {
      id: `lab-reward-${attributeKey}-${Date.now()}`,
      title: `${attrData.icon || '✨'} Fragmento ${attrData.name}`,
      description: `Pieza especial desbloqueada al completar un evento relámpago centrado en ${attrData.name}.`,
      type: 'special',
      category: 'lab-reward',
      bookId: 'lab-reward',
      chapterId: `evento-${attributeKey}`,
      icon: attrData.icon || '✨',
      dominantAttribute: attributeKey,
      syntheticAttributes,
      rarity: 'legendary',
      source: 'mini-challenge',
      tags: ['recompensa', 'evento'],
      isSpecialReward: true
    };

    // Añadir pieza sin quiz
    this.labUI.skipQuizForSpecialReward = true;
    this.labUI.togglePieceSelectionEnhanced(rewardPiece);
    this.labUI.showNotification(`🎁 Has obtenido ${rewardPiece.title}`, 'success', 3800);

    // Actualizar historial con recompensa
    if (this.history.length > 0) {
      this.history[0].reward = rewardPiece.title;
      this.render();
    }
  }

  /**
   * Obtiene el atributo de apoyo complementario para una recompensa
   *
   * @param {string} attributeKey - Atributo principal
   * @returns {string|null} Atributo de apoyo o null si no existe
   *
   * @description
   * Mapeo de atributos complementarios:
   * - empathy ↔ communication
   * - action ↔ strategy
   * - reflection ↔ analysis
   * - resilience ↔ organization
   * - creativity ↔ collaboration
   * - wisdom ↔ consciousness
   * - connection → empathy
   * - leadership → collaboration
   * - technical → action
   *
   * @private
   *
   * @example
   * const support = miniChallenges.getSupportAttributeForReward('empathy');
   * // returns: 'communication'
   */
  getSupportAttributeForReward(attributeKey) {
    const supportMap = {
      empathy: 'communication',
      communication: 'empathy',
      action: 'strategy',
      strategy: 'action',
      reflection: 'analysis',
      analysis: 'reflection',
      resilience: 'organization',
      organization: 'technical',
      creativity: 'collaboration',
      collaboration: 'creativity',
      wisdom: 'consciousness',
      consciousness: 'wisdom',
      connection: 'empathy',
      leadership: 'collaboration',
      technical: 'action'
    };
    return supportMap[attributeKey] || null;
  }

  /**
   * Limpia recursos y resetea el estado
   *
   * @description
   * - Limpia el challenge actual
   * - Preserva el historial
   * - Re-renderiza la UI
   *
   * @example
   * miniChallenges.destroy();
   */
  destroy() {
    this.currentChallenge = null;
    this.render();
  }
}
