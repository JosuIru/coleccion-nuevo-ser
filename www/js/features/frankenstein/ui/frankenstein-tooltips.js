/**
 * FrankensteinTooltips
 *
 * Gestiona los tooltips contextuales y ayudas interactivas para la interfaz
 * del Laboratorio Frankenstein. Proporciona información contextual al usuario
 * sobre los diferentes elementos de la UI.
 *
 * Características:
 * - Tooltips contextuales en elementos clave de la interfaz
 * - Posicionamiento automático inteligente (top/bottom)
 * - Soporte para mouse y touch events
 * - Atajos de teclado opcionales
 * - Gestión automática de memoria y limpieza de eventos
 *
 * @module FrankensteinTooltips
 * @version 1.0.0
 * @requires EventManager (global window.EventManager)
 */

export class FrankensteinTooltips {
  /**
   * Crea una nueva instancia del gestor de tooltips
   *
   * @example
   * const tooltips = new FrankensteinTooltips();
   * tooltips.init();
   */
  constructor() {
    /** @private {HTMLElement|null} Elemento tooltip actualmente visible */
    this.activeTooltip = null;

    /** @private {Array<Function>} Lista de cleanups para event listeners */
    this.eventCleanups = [];

    /** @private {Array<number>} IDs de timeouts activos */
    this.activeTimeouts = [];
  }

  /**
   * Inicializa los tooltips contextuales en elementos clave de la UI
   *
   * Define tooltips para:
   * - Selector de misión
   * - Panel de piezas disponibles
   * - Filtro de compatibilidad
   * - Panel de requisitos
   * - Contenedor del ser vitruviano
   *
   * @public
   */
  init() {
    const tooltipConfigurationData = [
      {
        selector: '#btn-change-mission',
        title: '🎯 Cambiar Misión',
        content: 'Cada misión requiere diferentes tipos de piezas. Haz clic para ver todas las misiones disponibles.',
        shortcut: null
      },
      {
        selector: '#pieces-bottom-sheet-header-click',
        title: '📦 Piezas Disponibles',
        content: 'Desliza hacia arriba o toca para expandir. Usa filtros para encontrar lo que necesitas.',
        shortcut: 'Swipe ↑'
      },
      {
        selector: '.filter-pill[data-filter="compatible"]',
        title: '⚡ Filtro Inteligente',
        content: 'Muestra solo las piezas que te ayudan a completar la misión actual.',
        shortcut: 'A'
      },
      {
        selector: '#toggle-requirements',
        title: '📋 Requisitos',
        content: 'Expande para ver qué necesitas. Verde ✅ = cumplido, Gris ⬜ = pendiente.',
        shortcut: 'R'
      },
      {
        selector: '#vitruvian-being-container',
        title: '🧬 Tu Ser',
        content: 'Arrastra piezas aquí o tócalas para añadirlas. El ser crece con cada pieza.',
        shortcut: 'Drag & Drop'
      }
    ];

    tooltipConfigurationData.forEach(tooltipData => {
      const element = document.querySelector(tooltipData.selector);
      if (!element) return;

      // Mouse enter - mostrar tooltip
      const mouseEnterHandler = () => {
        this.show(element, tooltipData);
      };
      this._addEventListener(element, 'mouseenter', mouseEnterHandler);

      // Mouse leave - ocultar tooltip
      const mouseLeaveHandler = () => {
        this.hide();
      };
      this._addEventListener(element, 'mouseleave', mouseLeaveHandler);

      // Touch support - mostrar tooltip temporal
      const touchStartHandler = (e) => {
        if (e.target.closest('.help-hint')) {
          e.preventDefault();
          this.show(element, tooltipData);
          this._setTimeout(() => this.hide(), 3000);
        }
      };
      this._addEventListener(element, 'touchstart', touchStartHandler);
    });
  }

  /**
   * Muestra un tooltip junto a un elemento específico
   *
   * El tooltip se posiciona automáticamente arriba o abajo del elemento
   * dependiendo del espacio disponible en el viewport.
   *
   * @public
   * @param {HTMLElement} elementoReferencia - Elemento junto al cual mostrar el tooltip
   * @param {Object} datosTooltip - Datos del tooltip
   * @param {string} datosTooltip.title - Título del tooltip (puede incluir emojis)
   * @param {string} datosTooltip.content - Contenido descriptivo
   * @param {string|null} [datosTooltip.shortcut=null] - Atajo de teclado opcional
   *
   * @example
   * tooltips.show(button, {
   *   title: '🎯 Acción',
   *   content: 'Descripción de la acción',
   *   shortcut: 'Ctrl+A'
   * });
   */
  show(elementoReferencia, datosTooltip) {
    // Eliminar tooltip existente
    this.hide();

    const elementoTooltip = document.createElement('div');
    elementoTooltip.classList.add('franken-tooltip');
    elementoTooltip.id = 'active-tooltip';

    elementoTooltip.innerHTML = `
      <div class="tooltip-title">
        ${datosTooltip.title}
      </div>
      <div class="tooltip-content">
        ${datosTooltip.content}
      </div>
      ${datosTooltip.shortcut ? `
        <div class="tooltip-shortcut">
          Atajo: <kbd>${datosTooltip.shortcut}</kbd>
        </div>
      ` : ''}
    `;

    document.body.appendChild(elementoTooltip);

    // Calcular posición del tooltip
    const rectanguloElemento = elementoReferencia.getBoundingClientRect();
    const rectanguloTooltip = elementoTooltip.getBoundingClientRect();

    let coordenadaTop, coordenadaLeft;
    let posicionFinal = 'top';

    // Intentar posicionar arriba
    if (rectanguloElemento.top > rectanguloTooltip.height + 20) {
      coordenadaTop = rectanguloElemento.top - rectanguloTooltip.height - 10;
      coordenadaLeft = rectanguloElemento.left + (rectanguloElemento.width / 2) - (rectanguloTooltip.width / 2);
      posicionFinal = 'top';
    } else {
      // Posicionar abajo
      coordenadaTop = rectanguloElemento.bottom + 10;
      coordenadaLeft = rectanguloElemento.left + (rectanguloElemento.width / 2) - (rectanguloTooltip.width / 2);
      posicionFinal = 'bottom';
    }

    // Mantener tooltip dentro del viewport
    if (coordenadaLeft < 10) coordenadaLeft = 10;
    if (coordenadaLeft + rectanguloTooltip.width > window.innerWidth - 10) {
      coordenadaLeft = window.innerWidth - rectanguloTooltip.width - 10;
    }

    elementoTooltip.style.top = `${coordenadaTop}px`;
    elementoTooltip.style.left = `${coordenadaLeft}px`;
    elementoTooltip.setAttribute('data-position', posicionFinal);

    // Animar entrada del tooltip
    requestAnimationFrame(() => {
      elementoTooltip.classList.add('show');
    });

    this.activeTooltip = elementoTooltip;
  }

  /**
   * Oculta el tooltip actualmente visible
   *
   * Aplica animación de salida antes de remover el elemento del DOM.
   *
   * @public
   */
  hide() {
    const elementoTooltip = document.getElementById('active-tooltip');
    if (elementoTooltip) {
      elementoTooltip.classList.remove('show');
      this._setTimeout(() => elementoTooltip.remove(), 200);
      this.activeTooltip = null;
    }
  }

  /**
   * Limpia todos los event listeners y tooltips activos
   *
   * Debe ser llamado cuando se cierra el Laboratorio Frankenstein
   * para prevenir memory leaks.
   *
   * @public
   */
  destroy() {
    // Limpiar tooltip activo
    this.hide();

    // Limpiar todos los event listeners
    this.eventCleanups.forEach(cleanup => cleanup());
    this.eventCleanups = [];

    // Limpiar timeouts activos
    this.activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.activeTimeouts = [];

    this.activeTooltip = null;
  }

  /**
   * Registra un event listener usando EventManager (si está disponible)
   * o addEventListener nativo como fallback
   *
   * @private
   * @param {HTMLElement} elemento - Elemento al que agregar el listener
   * @param {string} tipoEvento - Tipo de evento (click, mouseenter, etc.)
   * @param {Function} manejador - Función manejadora del evento
   */
  _addEventListener(elemento, tipoEvento, manejador) {
    if (window.EventManager) {
      const cleanup = window.EventManager.on(elemento, tipoEvento, manejador);
      this.eventCleanups.push(cleanup);
    } else {
      elemento.addEventListener(tipoEvento, manejador);
      this.eventCleanups.push(() => elemento.removeEventListener(tipoEvento, manejador));
    }
  }

  /**
   * Crea un setTimeout y lo registra para limpieza posterior
   *
   * @private
   * @param {Function} callback - Función a ejecutar
   * @param {number} delayMs - Delay en milisegundos
   * @returns {number} ID del timeout
   */
  _setTimeout(callback, delayMs) {
    const timeoutId = setTimeout(callback, delayMs);
    this.activeTimeouts.push(timeoutId);
    return timeoutId;
  }
}

/**
 * TESTING BÁSICO
 *
 * Para verificar que el módulo funciona correctamente:
 *
 * 1. Importar el módulo:
 *    import { FrankensteinTooltips } from './frankenstein-tooltips.js';
 *
 * 2. Crear instancia y inicializar:
 *    const tooltips = new FrankensteinTooltips();
 *    tooltips.init();
 *
 * 3. Verificar tooltips en elementos:
 *    - Pasar mouse sobre botón de cambiar misión
 *    - Pasar mouse sobre header del panel de piezas
 *    - Verificar que tooltips se posicionan correctamente
 *    - Verificar que se ocultan al salir del elemento
 *
 * 4. Verificar cleanup:
 *    tooltips.destroy();
 *    // Verificar que no quedan tooltips en el DOM
 *    // Verificar que no se disparan eventos después del destroy
 *
 * 5. Test de posicionamiento:
 *    // Crear elemento en la parte superior de la página
 *    const topButton = document.createElement('button');
 *    topButton.style.position = 'fixed';
 *    topButton.style.top = '10px';
 *    document.body.appendChild(topButton);
 *
 *    tooltips.show(topButton, {
 *      title: 'Test Top',
 *      content: 'Debe aparecer abajo',
 *      shortcut: null
 *    });
 *
 *    // Crear elemento en la parte inferior
 *    const bottomButton = document.createElement('button');
 *    bottomButton.style.position = 'fixed';
 *    bottomButton.style.bottom = '10px';
 *    document.body.appendChild(bottomButton);
 *
 *    tooltips.show(bottomButton, {
 *      title: 'Test Bottom',
 *      content: 'Debe aparecer arriba',
 *      shortcut: 'Ctrl+B'
 *    });
 *
 * RESULTADOS ESPERADOS:
 * ✅ Tooltips aparecen al pasar mouse
 * ✅ Tooltips se ocultan al salir
 * ✅ Posicionamiento automático funciona
 * ✅ Atajos de teclado se muestran cuando existen
 * ✅ No hay memory leaks después de destroy()
 * ✅ Tooltips permanecen dentro del viewport
 */
