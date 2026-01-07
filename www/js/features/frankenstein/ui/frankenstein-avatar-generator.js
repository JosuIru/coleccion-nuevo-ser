/**
 * FrankensteinAvatarGenerator - Módulo de generación y visualización de avatares
 *
 * Gestiona la generación visual del avatar del ser creado, incluyendo:
 * - Imagen de avatar basada en atributos
 * - Emoji representativo del ser
 * - Gradiente de fondo personalizado
 * - Gráfico radar de atributos
 *
 * @module frankenstein/ui/frankenstein-avatar-generator
 * @requires FrankensteinAvatarSystem (global)
 * @version 1.0.0
 * @created 2025-12-28
 */

export class FrankensteinAvatarGenerator {
  /**
   * Constructor del generador de avatares
   *
   * @param {FrankensteinAvatarSystem} avatarSystemReference - Referencia al sistema de avatares global
   * @param {Object} domCache - Cache de elementos DOM
   * @param {HTMLElement} [domCache.beingAvatar] - Contenedor del avatar
   */
  constructor(avatarSystemReference, domCache) {
    this.avatarSystem = avatarSystemReference;
    this.dom = domCache;
    this.containerElement = null;
  }

  /**
   * Actualizar visualización del avatar basado en el ser actual
   *
   * Genera y muestra:
   * - Avatar visual del ser (imagen generada)
   * - Emoji representativo
   * - Gradiente de fondo basado en atributos
   * - Gráfico radar de atributos
   *
   * @param {Object} currentBeing - Datos del ser actual
   * @param {Object} currentBeing.attributes - Atributos del ser
   * @param {Array} selectedPieces - Piezas seleccionadas para el ser
   * @returns {void}
   */
  updateDisplay(currentBeing, selectedPieces) {
    const container = this.dom.beingAvatar || document.getElementById('being-avatar-display');
    if (!container) {
      logger.warn('[AvatarGenerator] Contenedor de avatar no encontrado');
      return;
    }

    this.containerElement = container;

    // Si no hay sistema de avatares o no hay ser, ocultar
    if (!this.avatarSystem || !currentBeing || !selectedPieces || selectedPieces.length === 0) {
      container.style.display = 'none';
      return;
    }

    // Generar avatar y visualizaciones
    const avatarUrl = this.avatarSystem.generateAvatarUrl(currentBeing);
    const beingEmoji = this.avatarSystem.getBeingEmoji(currentBeing);
    const bgGradient = this.avatarSystem.generateBeingGradient(currentBeing);
    const radarChart = this.avatarSystem.generateRadarChart(currentBeing.attributes, 180);

    // Aplicar estilos al contenedor
    this.applyContainerStyles(container, bgGradient);

    // Renderizar contenido del avatar
    this.renderAvatarContent(container, avatarUrl, beingEmoji, radarChart);
  }

  /**
   * Aplicar estilos visuales al contenedor del avatar
   *
   * @param {HTMLElement} container - Contenedor del avatar
   * @param {string} bgGradient - Gradiente de fondo CSS
   * @private
   */
  applyContainerStyles(container, bgGradient) {
    container.style.display = 'block';
    container.style.background = bgGradient;
    container.style.borderRadius = '12px';
    container.style.border = '2px solid rgba(139, 115, 85, 0.4)';
    container.style.backdropFilter = 'blur(10px)';
  }

  /**
   * Renderizar contenido HTML del avatar
   *
   * @param {HTMLElement} container - Contenedor del avatar
   * @param {string} avatarUrl - URL de la imagen del avatar
   * @param {string} beingEmoji - Emoji representativo del ser
   * @param {string} radarChart - HTML del gráfico radar
   * @private
   */
  renderAvatarContent(container, avatarUrl, beingEmoji, radarChart) {
    container.innerHTML = `
      <div style="display: flex; gap: 2rem; align-items: center; justify-content: center; flex-wrap: wrap;">
        <!-- Avatar principal con emoji -->
        <div style="position: relative;">
          <div style="width: 140px; height: 140px; border-radius: 50%; overflow: hidden; border: 3px solid var(--franken-brass); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); background: rgba(0, 0, 0, 0.2);">
            <img src="${avatarUrl}" alt="Avatar del Ser" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div style="position: absolute; bottom: -10px; right: -10px; width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--franken-brass), var(--franken-copper)); border: 2px solid var(--franken-parchment); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">
            ${beingEmoji}
          </div>
        </div>

        <!-- Gráfico radar de atributos -->
        <div style="flex: 1; min-width: 200px; max-width: 300px;">
          ${radarChart}
          <p style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--franken-parchment); opacity: 0.7; text-align: center;">
            Gráfico de Atributos
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Regenerar avatar del ser (forzar nueva generación)
   *
   * @param {Object} currentBeing - Datos del ser actual
   * @param {Array} selectedPieces - Piezas seleccionadas
   * @returns {void}
   */
  regenerate(currentBeing, selectedPieces) {
    if (!this.avatarSystem || !currentBeing) {
      logger.warn('[AvatarGenerator] No se puede regenerar: sistema o ser no disponible');
      return;
    }

    // Forzar regeneración limpiando cache si existe
    if (this.avatarSystem.clearCache) {
      this.avatarSystem.clearCache(currentBeing);
    }

    // Actualizar display con nuevo avatar
    this.updateDisplay(currentBeing, selectedPieces);
  }

  /**
   * Ocultar el avatar sin destruir el contenedor
   *
   * @returns {void}
   */
  hide() {
    if (this.containerElement) {
      this.containerElement.style.display = 'none';
    }
  }

  /**
   * Mostrar el avatar (si hay ser válido)
   *
   * @returns {void}
   */
  show() {
    if (this.containerElement && this.containerElement.innerHTML.trim() !== '') {
      this.containerElement.style.display = 'block';
    }
  }

  /**
   * Limpiar recursos y restablecer estado
   *
   * @returns {void}
   */
  destroy() {
    if (this.containerElement) {
      this.containerElement.style.display = 'none';
      this.containerElement.innerHTML = '';
      this.containerElement = null;
    }

    this.avatarSystem = null;
    this.dom = null;
  }

  /**
   * Obtener estado actual del generador
   *
   * @returns {Object} Estado del generador
   */
  getState() {
    return {
      isVisible: this.containerElement?.style.display !== 'none',
      hasContent: this.containerElement?.innerHTML.trim() !== '',
      hasAvatarSystem: !!this.avatarSystem
    };
  }
}
