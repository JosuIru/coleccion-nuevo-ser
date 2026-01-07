/**
 * FrankensteinExperimentLog - Sistema de registro de experimentos
 *
 * Gestiona el historial de validaciones de seres creados, almacenando
 * resultados, puntajes y análisis de cada experimento realizado.
 *
 * Características:
 * - Persistencia en localStorage
 * - Límite de 20 registros más recientes
 * - Renderizado automático de entradas
 * - Análisis de viabilidad y atributos
 * - Integración con sistema de misiones
 *
 * @class FrankensteinExperimentLog
 * @version 1.0.0
 * @author Equipo de Desarrollo
 * @since 2024
 */

export class FrankensteinExperimentLog {
  /**
   * Constructor del sistema de registro de experimentos
   *
   * @param {Object} domCache - Caché de referencias DOM
   * @param {Object} dependencies - Dependencias del sistema
   * @param {Object} dependencies.missionsSystem - Sistema de misiones
   * @param {Function} dependencies.getCurrentMissionRequirements - Función para obtener requisitos actuales
   * @param {Function} dependencies.countFulfilledRequirements - Función para contar requisitos cumplidos
   * @param {string} storageKey - Clave de almacenamiento en localStorage
   */
  constructor(domCache, dependencies = {}, storageKey = 'frankenstein-experiments') {
    this.dom = domCache;
    this.storageKey = storageKey;
    this.entries = [];

    // Dependencies
    this.missionsSystem = dependencies.missionsSystem;
    this.getCurrentMissionRequirements = dependencies.getCurrentMissionRequirements;
    this.countFulfilledRequirements = dependencies.countFulfilledRequirements;
  }

  /**
   * Cargar log de experimentos desde localStorage
   *
   * Recupera el historial de experimentos guardados y actualiza
   * la visualización. Si hay errores, inicializa un log vacío.
   *
   * @returns {void}
   */
  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      this.entries = stored ? JSON.parse(stored) : [];
      logger.log(`📊 [ExperimentLog] Cargados ${this.entries.length} registros`);
    } catch (error) {
      logger.warn('[ExperimentLog] No se pudo leer la bitácora:', error);
      this.entries = [];
    }
    this.render();
  }

  /**
   * Registrar nueva entrada de experimento
   *
   * Crea un registro detallado del resultado de validación de un ser,
   * incluyendo viabilidad, puntaje, atributos y piezas utilizadas.
   * Mantiene solo los 20 registros más recientes.
   *
   * @param {Object} options - Opciones para registrar entrada
   * @param {Object} options.results - Resultados de validación
   * @param {boolean} options.results.viable - Si el ser es viable
   * @param {number} options.results.percentage - Porcentaje de viabilidad
   * @param {Array} options.results.strengths - Fortalezas detectadas
   * @param {Array} options.results.missingAttributes - Atributos faltantes
   * @param {Array} options.results.balanceIssues - Problemas de balance
   * @param {Object} options.currentBeing - Ser actual siendo validado
   * @param {Object} options.currentBeing.attributes - Atributos del ser
   * @param {Object} options.selectedMission - Misión seleccionada
   * @param {string} options.selectedMission.name - Nombre de la misión
   * @param {string} options.selectedMission.successMessage - Mensaje de éxito
   * @param {Array} options.selectedPieces - Piezas seleccionadas
   * @returns {Object|null} - Entrada creada o null si falta currentBeing
   */
  record({ results, currentBeing, selectedMission, selectedPieces }) {
    if (!currentBeing) {
      logger.warn('[ExperimentLog] No se puede registrar sin un ser actual');
      return null;
    }

    const missionName = selectedMission?.name || 'Sin misión';
    const requirements = this.getCurrentMissionRequirements
      ? this.getCurrentMissionRequirements()
      : [];

    const fulfilledCount = this.countFulfilledRequirements
      ? this.countFulfilledRequirements(requirements)
      : 0;

    // Construir entrada de experimento
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      mission: missionName,
      viable: !!results.viable,
      score: results.percentage || 0,
      fulfilled: fulfilledCount,
      totalReqs: requirements.length,

      // Top 3 atributos más altos
      attributes: Object.entries(currentBeing.attributes || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([key, value]) => {
          const attrData = this.missionsSystem?.attributes?.[key];
          return `${attrData?.icon || '📊'} ${attrData?.name || key}: ${Math.round(value)}`;
        }),

      // Primeras 4 piezas
      pieces: (selectedPieces || [])
        .map(piece => piece.title || piece.id)
        .slice(0, 4),

      // Insight principal
      insight: results.viable
        ? (results.strengths?.[0]?.message || selectedMission?.successMessage || 'Ser viable.')
        : (results.missingAttributes?.[0]?.message || results.balanceIssues?.[0]?.message || 'Ajusta los atributos faltantes.')
    };

    // Agregar al inicio y mantener solo 20 registros
    this.entries = [entry, ...this.entries].slice(0, 20);

    // Guardar en localStorage
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.entries));
      logger.log('✅ [ExperimentLog] Entrada guardada:', entry.mission, `${entry.score}%`);
    } catch (error) {
      logger.warn('[ExperimentLog] No se pudo guardar la bitácora:', error);
    }

    // Renderizar actualización
    this.render();

    return entry;
  }

  /**
   * Renderizar log de experimentos en UI
   *
   * Genera HTML para mostrar el historial de experimentos con
   * información detallada de cada validación realizada.
   *
   * @returns {void}
   */
  render() {
    const list = this.dom.experimentLogList || document.getElementById('experiment-log-list');
    const meta = this.dom.experimentLogMeta || document.getElementById('experiment-log-meta');

    if (!list) {
      logger.warn('[ExperimentLog] No se encontró elemento experiment-log-list');
      return;
    }

    // Sin registros
    if (!this.entries.length) {
      list.innerHTML = '<p class="empty-card-message">Valida un ser para registrar sus resultados.</p>';
      if (meta) meta.textContent = 'Sin registros';
      return;
    }

    // Actualizar metadatos
    if (meta) {
      meta.textContent = `${this.entries.length} registro${this.entries.length !== 1 ? 's' : ''}`;
    }

    // Renderizar entradas
    list.innerHTML = this.entries.map(entry => `
      <div class="experiment-log-item ${entry.viable ? 'viable' : 'inviable'}">
        <div class="experiment-log-header">
          <div>
            <p class="experiment-log-date">${new Date(entry.timestamp).toLocaleString('es-ES')}</p>
            <h4>${entry.mission}</h4>
          </div>
          <span class="experiment-log-score">${entry.score}%</span>
        </div>
        <p class="experiment-log-highlight">${entry.insight}</p>
        <div class="experiment-log-meta">
          <span>🎯 ${entry.fulfilled}/${entry.totalReqs} requisitos</span>
          <span>🧩 ${entry.pieces.join(', ') || 'Sin piezas registradas'}</span>
        </div>
        <div class="experiment-log-attributes">
          ${entry.attributes.map(attr => `<span>${attr}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  /**
   * Limpiar todo el log de experimentos
   *
   * Elimina todos los registros del historial y actualiza
   * localStorage y la visualización.
   *
   * @returns {void}
   */
  clear() {
    this.entries = [];
    try {
      localStorage.removeItem(this.storageKey);
      logger.log('🗑️ [ExperimentLog] Log limpiado');
    } catch (error) {
      logger.warn('[ExperimentLog] Error al limpiar log:', error);
    }
    this.render();
  }

  /**
   * Obtener estadísticas del log
   *
   * @returns {Object} Estadísticas del log
   */
  getStats() {
    const viableCount = this.entries.filter(e => e.viable).length;
    const totalCount = this.entries.length;
    const avgScore = totalCount > 0
      ? this.entries.reduce((sum, e) => sum + e.score, 0) / totalCount
      : 0;

    return {
      total: totalCount,
      viable: viableCount,
      inviable: totalCount - viableCount,
      viabilityRate: totalCount > 0 ? (viableCount / totalCount) * 100 : 0,
      averageScore: avgScore
    };
  }

  /**
   * Obtener entradas filtradas
   *
   * @param {Object} filters - Filtros a aplicar
   * @param {boolean} filters.viable - Filtrar por viabilidad
   * @param {string} filters.mission - Filtrar por misión
   * @param {number} filters.minScore - Puntaje mínimo
   * @returns {Array} Entradas filtradas
   */
  getFilteredEntries(filters = {}) {
    let filtered = [...this.entries];

    if (filters.viable !== undefined) {
      filtered = filtered.filter(e => e.viable === filters.viable);
    }

    if (filters.mission) {
      filtered = filtered.filter(e => e.mission === filters.mission);
    }

    if (filters.minScore !== undefined) {
      filtered = filtered.filter(e => e.score >= filters.minScore);
    }

    return filtered;
  }

  /**
   * Limpiar recursos y referencias
   *
   * @returns {void}
   */
  destroy() {
    this.entries = [];
    this.dom = null;
    this.missionsSystem = null;
    this.getCurrentMissionRequirements = null;
    this.countFulfilledRequirements = null;
    logger.log('🧹 [ExperimentLog] Sistema destruido');
  }
}

// Exportar para uso global (backward compatibility)
if (typeof window !== 'undefined') {
  window.FrankensteinExperimentLog = FrankensteinExperimentLog;
}
