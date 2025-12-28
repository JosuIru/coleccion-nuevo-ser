/**
 * ========================================
 * FRANKENSTEIN DRAG & DROP HANDLER
 * ========================================
 *
 * @module FrankensteinDragDropHandler
 * @description Gestor de drag & drop mejorado para el laboratorio Frankenstein
 * @version 2.9.200
 * @date 2025-12-28
 *
 * CARACTERÍSTICAS:
 * - Drag & drop interactivo de piezas
 * - Resaltado de slots compatibles
 * - Animaciones y efectos visuales
 * - Validación de compatibilidad
 * - Event listener cleanup
 *
 * DEPENDENCIAS:
 * - frankenstein-piece-catalog.js (isSlotCompatible)
 *
 * EXTRACCIÓN:
 * - Origen: frankenstein-ui.js (líneas 6727-6862)
 * - Funciones extraídas: initDragAndDropEnhanced, highlightCompatibleSlots,
 *   clearSlotHighlights, isSlotCompatible, getPieceData
 */

import { isSlotCompatible as isSlotCompatibleHelper } from '../data/frankenstein-piece-catalog.js';

/**
 * @class FrankensteinDragDropHandler
 * @description Gestor completo de drag & drop para el laboratorio Frankenstein
 */
export class FrankensteinDragDropHandler {
  /**
   * Constructor del drag & drop handler
   * @param {Object} labUIRef - Referencia al LabUI principal
   * @param {Object} domCache - Cache de elementos DOM
   */
  constructor(labUIRef, domCache) {
    this.labUI = labUIRef;
    this.dom = domCache;
    this.dragListeners = [];
    this.initialized = false;
  }

  /**
   * Inicializar sistema de drag & drop mejorado
   * @public
   */
  init() {
    if (this.initialized) {
      console.warn('[DragDropHandler] Ya inicializado, limpiando antes de reiniciar');
      this.destroy();
    }

    this.initDragAndDropEnhanced();
    this.initialized = true;
  }

  /**
   * Resaltar slots compatibles con el tipo de pieza
   * @param {string} pieceType - Tipo de pieza (chapter, exercise, resource)
   * @public
   */
  highlightCompatibleSlots(pieceType) {
    const slots = document.querySelectorAll('.vitruvian-slot');

    slots.forEach(slot => {
      // Remover estados previos
      slot.classList.remove('compatible', 'incompatible', 'empty');

      const slotType = slot.dataset.type;

      if (!slotType) {
        slot.classList.add('empty');
      } else if (this.isSlotCompatible(slotType, pieceType)) {
        slot.classList.add('compatible');
      } else {
        slot.classList.add('incompatible');
      }
    });
  }

  /**
   * Limpiar todos los highlights de slots
   * @public
   */
  clearHighlights() {
    const slots = document.querySelectorAll('.vitruvian-slot');
    slots.forEach(slot => {
      slot.classList.remove('compatible', 'incompatible', 'empty');
    });
  }

  /**
   * Verificar si un slot es compatible con un tipo de pieza
   * @param {string} tipoSlot - Tipo del slot (head, heart, arms, core, legs)
   * @param {string} tipoPieza - Tipo de pieza (chapter, exercise, resource)
   * @returns {boolean} True si son compatibles
   * @public
   */
  isSlotCompatible(tipoSlot, tipoPieza) {
    // Delegar a la función helper del catálogo de piezas
    return isSlotCompatibleHelper(tipoSlot, tipoPieza);
  }

  /**
   * Obtener datos de pieza desde elemento DOM
   * @param {HTMLElement} element - Elemento DOM de la pieza
   * @returns {Object|null} Datos de la pieza o null
   * @public
   */
  getPieceData(element) {
    const pieceId = element.dataset.pieceId;
    if (!pieceId) return null;

    return this.labUI.availablePieces.find(p => p.id === pieceId);
  }

  /**
   * Inicializar drag & drop mejorado con animaciones
   * @private
   */
  initDragAndDropEnhanced() {
    const pieces = document.querySelectorAll('.piece-card');

    // Configurar drag en piezas
    pieces.forEach(piece => {
      piece.setAttribute('draggable', 'true');

      // Drag start
      const dragStartHandler = (e) => {
        piece.classList.add('dragging');
        const pieceData = this.getPieceData(piece);

        // Resaltar slots compatibles
        if (pieceData) {
          this.highlightCompatibleSlots(pieceData.type);
        }

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', piece.id);

        // Crear imagen de drag personalizada
        const clone = piece.cloneNode(true);
        clone.classList.add('drag-clone');
        clone.style.position = 'absolute';
        clone.style.top = '-1000px';
        document.body.appendChild(clone);
        e.dataTransfer.setDragImage(clone, clone.offsetWidth / 2, clone.offsetHeight / 2);

        // Cleanup del clon
        this.labUI._setTimeout(() => clone.remove(), 0);
      };
      this.labUI._addEventListener(piece, 'dragstart', dragStartHandler);

      // Drag end
      const dragEndHandler = (e) => {
        piece.classList.remove('dragging');
        this.clearHighlights();
      };
      this.labUI._addEventListener(piece, 'dragend', dragEndHandler);
    });

    // Configurar zonas de drop
    this.setupDropZones();
  }

  /**
   * Configurar zonas de drop (slots y being-display)
   * @private
   */
  setupDropZones() {
    const dropZones = document.querySelectorAll('.vitruvian-slot, .being-display');

    dropZones.forEach(zone => {
      // Drag over
      const dragOverHandler = (e) => {
        e.preventDefault();
        zone.classList.add('drop-zone-active');
      };
      this.labUI._addEventListener(zone, 'dragover', dragOverHandler);

      // Drag leave
      const dragLeaveHandler = (e) => {
        zone.classList.remove('drop-zone-active');
      };
      this.labUI._addEventListener(zone, 'dragleave', dragLeaveHandler);

      // Drop
      const dropHandler = (e) => {
        e.preventDefault();
        zone.classList.remove('drop-zone-active');

        const pieceId = e.dataTransfer.getData('text/plain');
        const piece = document.getElementById(pieceId);

        if (piece) {
          // Animar pieza hacia la zona
          this.labUI.animatePieceToTarget(piece, zone);

          // Añadir pieza al ser
          const pieceData = this.getPieceData(piece);
          if (pieceData) {
            this.labUI._setTimeout(() => {
              this.labUI.togglePieceSelectionEnhanced(pieceData, piece);
            }, 300);
          }
        }
      };
      this.labUI._addEventListener(zone, 'drop', dropHandler);
    });
  }

  /**
   * Verificar compatibilidad entre slot y datos de pieza
   * @param {HTMLElement} slotElement - Elemento del slot
   * @param {Object} pieceData - Datos de la pieza
   * @returns {boolean} True si son compatibles
   * @public
   */
  isSlotCompatibleWithPiece(slotElement, pieceData) {
    if (!slotElement || !pieceData) return false;

    const slotType = slotElement.dataset.type;
    if (!slotType) return false;

    return this.isSlotCompatible(slotType, pieceData.type);
  }

  /**
   * Obtener todos los slots compatibles para un tipo de pieza
   * @param {string} pieceType - Tipo de pieza
   * @returns {HTMLElement[]} Array de slots compatibles
   * @public
   */
  getCompatibleSlots(pieceType) {
    const slots = document.querySelectorAll('.vitruvian-slot');
    const compatibleSlots = [];

    slots.forEach(slot => {
      const slotType = slot.dataset.type;
      if (slotType && this.isSlotCompatible(slotType, pieceType)) {
        compatibleSlots.push(slot);
      }
    });

    return compatibleSlots;
  }

  /**
   * Verificar si un slot está vacío
   * @param {HTMLElement} slotElement - Elemento del slot
   * @returns {boolean} True si está vacío
   * @public
   */
  isSlotEmpty(slotElement) {
    if (!slotElement) return false;
    return !slotElement.dataset.type || slotElement.dataset.type === '';
  }

  /**
   * Cleanup completo de event listeners
   * @public
   */
  destroy() {
    // Limpiar highlights
    this.clearHighlights();

    // Los event listeners se limpian automáticamente vía EventManager
    // ya que están registrados con labUI._addEventListener

    this.initialized = false;
    console.log('[DragDropHandler] Destruido correctamente');
  }

  /**
   * Reinicializar drag & drop (útil después de actualizar piezas)
   * @public
   */
  reinit() {
    console.log('[DragDropHandler] Reinicializando...');
    this.destroy();
    this.init();
  }

  /**
   * Obtener estado del handler
   * @returns {Object} Estado actual
   * @public
   */
  getState() {
    return {
      initialized: this.initialized,
      draggablePieces: document.querySelectorAll('.piece-card[draggable="true"]').length,
      dropZones: document.querySelectorAll('.vitruvian-slot, .being-display').length
    };
  }
}

/**
 * ========================================
 * BACKWARD COMPATIBILITY
 * ========================================
 */

/**
 * Export individual functions for backward compatibility
 * @deprecated Use FrankensteinDragDropHandler class instead
 */
export function initDragAndDropEnhanced(labUIRef) {
  console.warn('[DEPRECATED] Use FrankensteinDragDropHandler.init() instead');
  const handler = new FrankensteinDragDropHandler(labUIRef, {});
  handler.init();
  return handler;
}

export function highlightCompatibleSlots(pieceType) {
  console.warn('[DEPRECATED] Use FrankensteinDragDropHandler.highlightCompatibleSlots() instead');
  const slots = document.querySelectorAll('.vitruvian-slot');
  slots.forEach(slot => {
    slot.classList.remove('compatible', 'incompatible', 'empty');
    const slotType = slot.dataset.type;
    if (!slotType) {
      slot.classList.add('empty');
    } else if (isSlotCompatibleHelper(slotType, pieceType)) {
      slot.classList.add('compatible');
    } else {
      slot.classList.add('incompatible');
    }
  });
}

export function clearSlotHighlights() {
  console.warn('[DEPRECATED] Use FrankensteinDragDropHandler.clearHighlights() instead');
  const slots = document.querySelectorAll('.vitruvian-slot');
  slots.forEach(slot => {
    slot.classList.remove('compatible', 'incompatible', 'empty');
  });
}

export function isSlotCompatible(tipoSlot, tipoPieza) {
  return isSlotCompatibleHelper(tipoSlot, tipoPieza);
}

export function getPieceData(element, availablePieces) {
  console.warn('[DEPRECATED] Use FrankensteinDragDropHandler.getPieceData() instead');
  const pieceId = element.dataset.pieceId;
  if (!pieceId) return null;
  return availablePieces.find(p => p.id === pieceId);
}
