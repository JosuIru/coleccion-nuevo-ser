/**
 * FRANKENSTEIN LAB - DEMO SCENARIOS MODULE
 * Sistema de gestión de escenarios educativos de demostración
 *
 * Responsabilidades:
 * - Aplicar escenarios de demostración a seres demo
 * - Renderizar card de escenario con objetivos
 * - Evaluar cumplimiento de objetivos
 * - Actualizar progreso de escenarios
 *
 * @module FrankensteinDemoScenarios
 * @version 1.0.0
 * @author Claude Sonnet 4.5
 * @date 2025-12-28
 *
 * Extraído desde frankenstein-ui.js (líneas 4950-5069)
 * Como parte de la refactorización modular v2.9.201
 */

export class FrankensteinDemoScenarios {
  /**
   * Constructor
   * @param {Object} labUIRef - Referencia a FrankensteinUI
   * @param {Object} domCache - Cache de referencias DOM
   */
  constructor(labUIRef, domCache) {
    this.labUI = labUIRef;
    this.dom = domCache;
    this.currentScenario = null;
  }

  /**
   * Aplicar escenario de demostración
   *
   * Carga el escenario educativo asociado a un ser demo desde FrankensteinDemoData.
   * Verifica si está en modo demo antes de aplicar.
   *
   * @param {Object|null} savedBeing - Ser guardado a aplicar
   * @property {string} savedBeing.id - ID del ser (debe empezar con 'demo-' o estar en modo demo)
   *
   * Workflow:
   * 1. Obtener escenario desde FrankensteinDemoData
   * 2. Verificar modo demo o prefijo 'demo-'
   * 3. Asignar escenario activo o limpiarlo
   * 4. Re-renderizar card
   *
   * @example
   * // Aplicar escenario
   * demoScenarios.apply({ id: 'demo-eco-activist-001' });
   *
   * // Limpiar escenario
   * demoScenarios.apply(null);
   */
  apply(savedBeing) {
    if (!savedBeing) {
      this.currentScenario = null;
      this.render();
      return;
    }

    const scenario = window.FrankensteinDemoData?.getDemoScenario?.(savedBeing.id);
    const isDemoMode = typeof window.FrankensteinQuiz?.getMode === 'function'
      ? window.FrankensteinQuiz.getMode() === 'demo'
      : false;

    if (scenario && (isDemoMode || (savedBeing.id && savedBeing.id.toString().startsWith('demo-')))) {
      this.currentScenario = {
        ...scenario,
        beingId: savedBeing.id
      };
    } else {
      this.currentScenario = null;
    }

    this.render();
  }

  /**
   * Renderizar card de escenario demo
   *
   * Genera el HTML del card de escenario educativo con:
   * - Título y descripción introductoria
   * - Objetivos con estado de cumplimiento
   * - Call to action
   * - Tips educativos
   *
   * Layout del card:
   * - Sin escenario: Mensaje vacío explicando cómo activar
   * - Con escenario: Intro + Objetivos + CTA + Tips
   *
   * Estados de objetivos:
   * - ✅ fulfilled: Objetivo cumplido
   * - ⬜ unfulfilled: Pendiente de cumplir
   *
   * @fires render - Actualiza el DOM del card
   *
   * @example
   * // Llamada típica desde UI
   * demoScenarios.render();
   */
  render() {
    const body = document.getElementById('demo-scenario-body');
    const titleEl = document.getElementById('demo-scenario-title');
    if (!body) return;

    const isDemoMode = typeof window.FrankensteinQuiz?.getMode === 'function'
      ? window.FrankensteinQuiz.getMode() === 'demo'
      : false;

    if (!this.currentScenario) {
      if (titleEl) titleEl.textContent = 'Ruta educativa';
      body.innerHTML = `<p class="empty-card-message">${isDemoMode
        ? 'Carga un ser demo desde la sección "Seres Guardados" para recibir guía educativa.'
        : 'Activa el modo demo para desbloquear rutas educativas con narrativas guiadas.'}</p>`;
      return;
    }

    const scenario = this.currentScenario;
    if (titleEl) {
      titleEl.textContent = scenario.title || 'Recorrido demo';
    }

    const objectives = (scenario.objectives || []).map(obj => {
      const status = this.evaluate(obj);
      const label = obj.label || status.label || 'Objetivo';
      return `
        <div class="scenario-objective ${status.fulfilled ? 'fulfilled' : ''}">
          <div class="scenario-objective-icon">${status.fulfilled ? '✅' : '⬜'}</div>
          <div>
            <p>${label}</p>
            <small>${status.progressText || ''}</small>
          </div>
        </div>
      `;
    }).join('') || '<p class="empty-card-message">Configura objetivos en FrankensteinDemoData para esta guía.</p>';

    const tips = scenario.tips?.length
      ? `<div class="scenario-tips"><h5>Recomendado</h5><ul>${scenario.tips.map(tip => `<li>${tip}</li>`).join('')}</ul></div>`
      : '';

    body.innerHTML = `
      <p class="scenario-intro">${scenario.intro || 'Explora este ser demo para aprender a ensamblar combinaciones efectivas.'}</p>
      <div class="scenario-objectives">${objectives}</div>
      ${scenario.callToAction ? `<div class="scenario-cta">${scenario.callToAction}</div>` : ''}
      ${tips}
    `;
  }

  /**
   * Evaluar cumplimiento de objetivo de escenario
   *
   * Tipos de objetivos soportados:
   * - 'attribute': Verificar que atributo alcance valor mínimo
   * - 'mission': Verificar que misión específica esté activa
   * - 'validation': Verificar que ser haya sido validado exitosamente
   *
   * @param {Object} objective - Objetivo a evaluar
   * @param {string} objective.type - Tipo de objetivo ('attribute'|'mission'|'validation')
   * @param {string} [objective.attribute] - Key del atributo (si type='attribute')
   * @param {number} [objective.target] - Valor objetivo (si type='attribute')
   * @param {number} [objective.value] - Alias de target
   * @param {string} [objective.missionId] - ID de misión requerida (si type='mission')
   * @param {string} [objective.targetMissionId] - Alias de missionId
   * @param {string} [objective.label] - Etiqueta descriptiva del objetivo
   *
   * @returns {Object} Resultado de evaluación
   * @returns {boolean} .fulfilled - Si el objetivo está cumplido
   * @returns {string} .progressText - Texto de progreso (ej: "80/95")
   * @returns {string} .label - Etiqueta del objetivo
   *
   * @example
   * // Evaluar objetivo de atributo
   * const result = demoScenarios.evaluate({
   *   type: 'attribute',
   *   attribute: 'wisdom',
   *   target: 95,
   *   label: 'Sabiduría ≥ 95'
   * });
   * // => { fulfilled: true, progressText: "98/95", label: "Sabiduría ≥ 95" }
   *
   * // Evaluar objetivo de misión
   * const result = demoScenarios.evaluate({
   *   type: 'mission',
   *   missionId: 'earth-defender',
   *   label: 'Activa misión Defensor'
   * });
   * // => { fulfilled: false, progressText: "Activa la misión sugerida", label: "..." }
   */
  evaluate(objective) {
    if (!objective) {
      return { fulfilled: false, progressText: '', label: 'Objetivo' };
    }

    const type = objective.type || 'attribute';

    if (type === 'attribute') {
      const attrKey = objective.attribute;
      const target = objective.target || objective.value || 0;
      const current = Math.round(this.labUI.currentBeing?.attributes?.[attrKey] || 0);
      return {
        fulfilled: current >= target,
        progressText: `${current}/${target}`,
        label: objective.label
      };
    }

    if (type === 'mission') {
      const missionId = objective.missionId || objective.targetMissionId;
      const fulfilled = !!missionId && this.labUI.selectedMission?.id === missionId;
      return {
        fulfilled,
        progressText: fulfilled ? 'Misión activa' : 'Activa la misión sugerida',
        label: objective.label
      };
    }

    if (type === 'validation') {
      const fulfilled = !!this.labUI.lastValidationResults?.viable;
      return {
        fulfilled,
        progressText: fulfilled ? 'Ser validado' : 'Pendiente de validación',
        label: objective.label
      };
    }

    return {
      fulfilled: false,
      progressText: '',
      label: objective.label
    };
  }

  /**
   * Actualizar progreso de escenario demo
   *
   * Re-evalúa todos los objetivos del escenario activo y actualiza la UI.
   * Llamado automáticamente cuando:
   * - Se añade/quita una pieza
   * - Se valida el ser
   * - Se cambia la misión activa
   *
   * @fires render - Actualiza visualización del card
   *
   * @example
   * // Llamada típica tras cambio de estado
   * labUI.selectedPieces.push(newPiece);
   * labUI.updateBeingFromPieces();
   * demoScenarios.updateProgress();
   */
  updateProgress() {
    if (!this.currentScenario) return;
    this.render();
  }

  /**
   * Limpieza de recursos
   * Resetea el estado del módulo
   */
  destroy() {
    this.currentScenario = null;
    this.labUI = null;
    this.dom = null;
  }
}

/**
 * BACKWARD COMPATIBILITY WRAPPER
 *
 * Provee métodos legacy para compatibilidad con código antiguo
 * que usa FrankensteinUI directamente.
 *
 * @deprecated Usar instancia de FrankensteinDemoScenarios directamente
 */
export const createDemoScenariosLegacyWrapper = (labUIInstance) => {
  const demoScenarios = new FrankensteinDemoScenarios(labUIInstance, {});

  return {
    /**
     * @deprecated Usar demoScenarios.apply()
     */
    applyDemoScenario(savedBeing) {
      return demoScenarios.apply(savedBeing);
    },

    /**
     * @deprecated Usar demoScenarios.render()
     */
    renderDemoScenarioCard() {
      return demoScenarios.render();
    },

    /**
     * @deprecated Usar demoScenarios.evaluate()
     */
    evaluateScenarioObjective(objective) {
      return demoScenarios.evaluate(objective);
    },

    /**
     * @deprecated Usar demoScenarios.updateProgress()
     */
    updateDemoScenarioProgress() {
      return demoScenarios.updateProgress();
    },

    // Exponer instancia para acceso directo
    _instance: demoScenarios
  };
};
