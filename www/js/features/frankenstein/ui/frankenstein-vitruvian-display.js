/**
 * @fileoverview FrankensteinVitruvianDisplay - Gestión del display de Vitruvio
 *
 * Responsabilidades:
 * - Actualizar el HUD de Vitruvio con atributos dominantes
 * - Mostrar resumen de composición del ser
 * - Gestionar popup de feedback visual al añadir piezas
 * - Sincronizar visualización con estado del ser actual
 *
 * Componentes:
 * - vitruvian-hud: Panel de atributos dominantes con barras de progreso
 * - vitruvian-slot-legend: Lista de piezas clave del ser
 * - vitruvian-popup: Feedback animado al añadir piezas
 * - being-components-list: Lista completa de componentes
 *
 * @module FrankensteinVitruvianDisplay
 * @version 2.9.154
 */

/**
 * FrankensteinVitruvianDisplay - Gestión del display de Vitruvio
 *
 * Este módulo maneja toda la visualización del ser Vitruviano:
 * - HUD con atributos dominantes (top 4)
 * - Leyenda con piezas clave (top 3)
 * - Popup animado al añadir piezas
 * - Lista de componentes del ser
 *
 * Integración con:
 * - missionsSystem: Para obtener definiciones de atributos
 * - vitruvianBeing: Para clonar SVG del ser
 * - currentBeing: Para obtener estado actual de atributos y piezas
 */
export class FrankensteinVitruvianDisplay {
  /**
   * Crea una nueva instancia del display de Vitruvio
   *
   * @param {Object} missionsSystemRef - Referencia al sistema de misiones
   * @param {Object} domCache - Caché de elementos DOM
   * @param {Function} getCanonicalBeingPieces - Función para obtener piezas canónicas
   * @param {Function} calculateCurrentPower - Función para calcular poder total
   * @param {Object} vitruvianBeingRef - Referencia al ser vitruviano
   * @param {Function} setTimeout - Función para crear timeouts rastreables
   */
  constructor(
    missionsSystemRef,
    domCache,
    getCanonicalBeingPieces,
    calculateCurrentPower,
    vitruvianBeingRef,
    setTimeout
  ) {
    this.missionsSystem = missionsSystemRef;
    this.domCache = domCache;
    this.getCanonicalBeingPieces = getCanonicalBeingPieces;
    this.calculateCurrentPower = calculateCurrentPower;
    this.vitruvianBeingRef = vitruvianBeingRef;
    this._setTimeout = setTimeout;

    // Estado del popup
    this.vitruvianPopupTimeout = null;

    // Estado actual del ser (se actualizará externamente)
    this.currentBeing = null;
  }

  /**
   * Actualiza el HUD de Vitruvio con atributos dominantes
   *
   * Muestra:
   * - Badge de energía total
   * - Top 4 atributos dominantes con barras de progreso
   * - Leyenda con top 3 piezas clave
   *
   * Estados:
   * - Sin ser: Mensaje de ayuda
   * - Sin atributos: Mensaje de estado vacío
   * - Con atributos: Lista ordenada por valor descendente
   *
   * @public
   */
  updateHud() {
    const hudElement = this.domCache.vitruvianHud || document.getElementById('vitruvian-hud');
    const badgeElement = this.domCache.vitruvianEnergyBadge || document.getElementById('vitruvian-energy-badge');
    const legendElement = this.domCache.vitruvianSlotLegend || document.getElementById('vitruvian-slot-legend');

    if (!hudElement) return;

    // Actualizar badge de energía total
    if (badgeElement) {
      const totalPower = Math.max(0, Math.round(this.currentBeing?.totalPower || this.calculateCurrentPower() || 0));
      badgeElement.textContent = `⚡ ${totalPower}`;
    }

    // Sin ser configurado - mostrar mensaje de ayuda
    if (!this.currentBeing || !this.currentBeing.attributes) {
      hudElement.innerHTML = '<p class="vitruvian-hud-empty">Añade capítulos y ejercicios para activar este radar.</p>';
      if (legendElement) {
        legendElement.innerHTML = '<p class="vitruvian-composition-empty">Selecciona piezas para ver qué partes del cuerpo se energizan.</p>';
      }
      return;
    }

    // Obtener top 4 atributos dominantes
    const atributosDominantes = Object.entries(this.currentBeing.attributes || {})
      .filter(([, valor]) => valor > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    // Renderizar atributos dominantes
    if (!atributosDominantes.length) {
      hudElement.innerHTML = '<p class="vitruvian-hud-empty">Aún no hay atributos dominantes para mostrar.</p>';
    } else {
      hudElement.innerHTML = atributosDominantes.map(([claveAtributo, valorAtributo]) => {
        const definicionAtributo = this.missionsSystem?.attributes?.[claveAtributo];
        const porcentajeBarra = Math.min(100, Math.round((valorAtributo / 120) * 100));
        return `
          <div class="vitruvian-hud-item">
            <div class="vitruvian-hud-icon">${definicionAtributo?.icon || '📊'}</div>
            <div class="vitruvian-hud-details">
              <p>${definicionAtributo?.name || claveAtributo}</p>
              <span>${Math.round(valorAtributo)}</span>
              <div class="vitruvian-hud-meter">
                <span style="width:${porcentajeBarra}%"></span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Renderizar leyenda con piezas clave
    if (legendElement) {
      const piezasClave = this.getCanonicalBeingPieces().slice(0, 3);
      if (!piezasClave.length) {
        legendElement.innerHTML = '<p class="vitruvian-composition-empty">Selecciona piezas para ver cómo se distribuye la energía.</p>';
      } else {
        legendElement.innerHTML = `
          <p class="vitruvian-composition-title">Componentes clave</p>
          <ul class="vitruvian-composition-list">
            ${piezasClave.map(pieza => `
              <li>
                <span class="composition-icon">${pieza.icon}</span>
                <div>
                  <p>${pieza.title}</p>
                  <small>${pieza.typeLabel} · ${pieza.bookTitle}</small>
                </div>
                <span class="composition-power">⚡ ${pieza.totalPower}</span>
              </li>
            `).join('')}
          </ul>
        `;
      }
    }
  }

  /**
   * Actualiza el resumen de composición del ser
   *
   * Muestra en el panel de componentes:
   * - Contador de piezas totales
   * - Top 4 piezas con icono, título, tipo y poder
   *
   * Estados:
   * - Sin piezas: Mensaje de ayuda
   * - Con piezas: Lista con máximo 4 elementos
   *
   * @public
   */
  updateCompositionSummary() {
    const listaElemento = this.domCache.beingComponentsList || document.getElementById('being-components-list');
    const contadorElemento = document.getElementById('being-components-count');

    if (!listaElemento) return;

    const todasLasPiezas = this.getCanonicalBeingPieces();

    // Actualizar contador
    if (contadorElemento) {
      contadorElemento.textContent = `${todasLasPiezas.length} pieza${todasLasPiezas.length === 1 ? '' : 's'}`;
    }

    // Renderizar lista de componentes
    if (!todasLasPiezas.length) {
      listaElemento.innerHTML = '<li>Selecciona capítulos y ejercicios para componer este ser.</li>';
      return;
    }

    listaElemento.innerHTML = todasLasPiezas.slice(0, 4).map(pieza => `
      <li>
        <span class="component-icon">${pieza.icon}</span>
        <div>
          <p>${pieza.title}</p>
          <small>${pieza.typeLabel} · ${pieza.bookTitle}</small>
        </div>
        <span class="component-power">⚡ ${pieza.totalPower}</span>
      </li>
    `).join('');
  }

  /**
   * Muestra popup animado al añadir una pieza
   *
   * Características:
   * - Clona y anima el SVG del ser Vitruviano
   * - Muestra información de la pieza añadida
   * - Lista atributos otorgados con iconos
   * - Auto-cierre después de 4 segundos
   * - Cancela popups anteriores si existen
   *
   * Animaciones:
   * - Pulse en el contenedor del ser (600ms)
   * - Fade in del popup completo
   *
   * @param {Object} pieza - Pieza añadida al ser
   * @param {string} pieza.title - Título de la pieza
   * @param {Object} pieza.type - Tipo de pieza (chapter/exercise)
   * @public
   */
  showPopup(pieza) {
    const popupElemento = this.domCache.vitruvianPopup || document.getElementById('vitruvian-popup');
    const contenedorSer = document.getElementById('vitruvian-popup-being');
    const infoPieza = document.getElementById('vitruvian-popup-piece');
    const contenedorAtributos = document.getElementById('vitruvian-popup-attributes');

    if (!popupElemento || !contenedorSer || !infoPieza || !contenedorAtributos) return;

    // Clonar SVG del ser Vitruviano actual
    const vitruvianoMain = document.querySelector('#vitruvian-being-container svg') || this.vitruvianBeingRef?.svg;
    contenedorSer.innerHTML = '';

    if (vitruvianoMain) {
      const svgClonado = vitruvianoMain.cloneNode(true);
      contenedorSer.appendChild(svgClonado);

      // Añadir animación de pulso
      contenedorSer.classList.add('piece-added');
      this._setTimeout(() => {
        contenedorSer.classList.remove('piece-added');
      }, 600);
    } else {
      contenedorSer.innerHTML = '<p class="vitruvian-popup-empty">Añade piezas para visualizar el ser</p>';
    }

    // Actualizar información de la pieza
    const analisisPieza = this.missionsSystem.analyzePiece(pieza);
    infoPieza.innerHTML = `
      ¡Pieza añadida!<br>
      <strong>${pieza.title}</strong>
    `;

    // Actualizar atributos otorgados
    const entradasAtributos = analisisPieza?.attributes
      ? Object.entries(analisisPieza.attributes).filter(([, valor]) => valor > 0)
      : [];

    const htmlAtributos = entradasAtributos.length
      ? entradasAtributos
          .filter(([_, valor]) => valor > 0)
          .map(([claveAtributo, valor]) => {
            const datosAtributo = this.missionsSystem.attributes[claveAtributo];
            if (!datosAtributo) return '';
            return `
              <span class="vitruvian-popup-attribute">
                ${datosAtributo.icon} +${valor}
              </span>
            `;
          })
          .join('')
      : '<p class="vitruvian-popup-empty">Aún no hay atributos para mostrar.</p>';

    contenedorAtributos.innerHTML = htmlAtributos;

    // Mostrar popup
    popupElemento.classList.add('visible');

    // Auto-ocultar después de 4 segundos
    if (this.vitruvianPopupTimeout) {
      clearTimeout(this.vitruvianPopupTimeout);
      this.vitruvianPopupTimeout = null;
    }

    this.vitruvianPopupTimeout = this._setTimeout(() => {
      this.hidePopup();
      this.vitruvianPopupTimeout = null;
    }, 4000);
  }

  /**
   * Oculta el popup de Vitruvio
   *
   * Limpia:
   * - Clase 'visible' del popup
   * - Timeout de auto-cierre si existe
   *
   * @public
   */
  hidePopup() {
    const popupElemento = this.domCache.vitruvianPopup || document.getElementById('vitruvian-popup');

    if (popupElemento) {
      popupElemento.classList.remove('visible');
    }

    if (this.vitruvianPopupTimeout) {
      clearTimeout(this.vitruvianPopupTimeout);
      this.vitruvianPopupTimeout = null;
    }
  }

  /**
   * Actualiza la referencia al ser actual
   *
   * @param {Object} nuevoSer - Nuevo estado del ser
   * @public
   */
  updateCurrentBeing(nuevoSer) {
    this.currentBeing = nuevoSer;
  }

  /**
   * Cleanup completo del display
   *
   * Limpia:
   * - Timeouts activos del popup
   * - Referencias a objetos externos
   *
   * @public
   */
  destroy() {
    // Limpiar popup timeout
    if (this.vitruvianPopupTimeout) {
      clearTimeout(this.vitruvianPopupTimeout);
      this.vitruvianPopupTimeout = null;
    }

    // Limpiar referencias
    this.missionsSystem = null;
    this.domCache = null;
    this.getCanonicalBeingPieces = null;
    this.calculateCurrentPower = null;
    this.vitruvianBeingRef = null;
    this.currentBeing = null;
  }
}
