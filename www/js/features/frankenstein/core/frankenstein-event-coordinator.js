/**
 * FRANKENSTEIN EVENT COORDINATOR
 * Orquestación centralizada de todos los event listeners del laboratorio
 *
 * @module FrankensteinEventCoordinator
 * @version 2.9.201
 * @author J. Irurtzun & Claude Sonnet 4.5
 *
 * @description
 * Coordina todos los event listeners del laboratorio Frankenstein:
 * - Event listeners de UI (botones, inputs, modales)
 * - Navegación del menú lateral
 * - Filtros y búsqueda de piezas
 * - Gestos y swipes del bottom sheet
 * - Cleanup completo de listeners
 *
 * @dependencies
 * - FrankensteinBottomSheet: Gestos del bottom sheet
 * - FrankensteinModals: Sistema de modales
 * - Todos los módulos del laboratorio
 *
 * REFACTORING v2.9.201:
 * ✅ Extraído desde frankenstein-ui.js (líneas 3356-3618, 7040-7189)
 * ✅ Coordinación centralizada de eventos
 * ✅ Sistema de cleanup de listeners
 * ✅ Gestión de menú lateral
 * ✅ Actualización de badges
 */

/**
 * Coordinador de eventos del laboratorio Frankenstein
 *
 * @class FrankensteinEventCoordinator
 * @exports FrankensteinEventCoordinator
 */
export class FrankensteinEventCoordinator {
  /**
   * Constructor del coordinador de eventos
   *
   * @param {FrankensteinLabUI} labUIRef - Referencia a la instancia principal
   * @param {Object} domCache - Cache de referencias DOM
   */
  constructor(labUIRef, domCache) {
    this.labUI = labUIRef;
    this.dom = domCache;
    this.listeners = [];
    this.abortController = new AbortController();
  }

  /**
   * Adjuntar todos los event listeners del laboratorio
   *
   * @description
   * Método principal que inicializa todos los event listeners:
   * - Prevención de interferencias con selección de texto
   * - Bottom sheet gestures
   * - Filtros y búsqueda de piezas
   * - Botones de acción
   * - Menú lateral
   * - Modales
   * - FABs
   * - Tooltips y tutoriales
   *
   * @returns {void}
   */
  attachAll() {
    // Prevenir interferencia con text selection
    const laboratory = document.querySelector('.frankenstein-laboratory');
    if (laboratory) {
      this._addEventListener(laboratory, 'mousedown', (e) => e.stopPropagation());
      this._addEventListener(laboratory, 'mouseup', (e) => e.stopPropagation());
      this._addEventListener(laboratory, 'click', (e) => e.stopPropagation());
    }

    // Bottom Sheet - Swipe Gestures (delegado al módulo)
    if (this.labUI.bottomSheet) {
      this.labUI.bottomSheet.init();
    }

    // Bottom Sheet - Header Click
    this._addEventListenerById('bottom-sheet-header-click', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.toggleBottomSheet();
    });

    // Toggle Requirements Button
    this._addEventListenerById('toggle-requirements', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.toggleRequirements();
    });

    // Filtros de piezas (ahora con pills)
    this._attachFilterPills();

    // Búsqueda de piezas
    this._addEventListenerById('pieces-search', 'input', (e) => {
      this.labUI.searchPieces(e.target.value);
    });

    // Botones de acción del ser
    this._attachActionButtons();

    // Botón cambiar misión
    this._addEventListenerById('btn-change-mission', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.openMissionModal();
    });

    // === HEADER MEJORADO: Nuevos botones ===
    this._attachHeaderButtons();

    // === MODALES ===
    this._attachModalListeners();

    // === FABs ===
    this._attachFABListeners();

    // === MINI CHALLENGE ===
    this._addEventListenerById('mini-challenge-refresh', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.generateMiniChallenge(true);
    });

    // Vitruvian popup close button
    this._addEventListenerById('vitruvian-popup-close', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.hideVitruvianPopup();
    });

    // Sticky header scroll detection en modal de piezas
    const piecesModalBody = document.querySelector('.pieces-modal-body');
    if (piecesModalBody) {
      this._addEventListener(piecesModalBody, 'scroll', () => {
        this.labUI.handlePiecesModalScroll();
      });
    }

    // Initialize Phase 3 features
    this.labUI.initContextualTooltips();
    this.labUI.showMiniTutorial();

    this.labUI.restoreLabState();

    // Open mission modal on first load if no mission selected
    if (!this.labUI.selectedMission) {
      this.labUI._setTimeout(() => this.labUI.openMissionModal(), 500);
    }
  }

  /**
   * Adjuntar filtros de piezas (pills)
   * @private
   */
  _attachFilterPills() {
    document.querySelectorAll('.filter-pill').forEach(btn => {
      this._addEventListener(btn, 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Special handling for compatible filter
        if (btn.dataset.filter === 'compatible') {
          this.labUI.filterCompatiblePieces();
        } else {
          this.labUI.populatePiecesGrid(btn.dataset.filter);
        }
      });
    });
  }

  /**
   * Adjuntar botones de acción del ser
   * @private
   */
  _attachActionButtons() {
    this._addEventListenerById('btn-clear-selection', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.clearSelection();
    });

    this._addEventListenerById('btn-export-being', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.exportBeingAsPrompt();
    });

    this._addEventListenerById('btn-validate-being', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.validateBeing();
    });

    this._addEventListenerById('btn-talk-to-being', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.talkToBeing();
    });

    this._addEventListenerById('btn-create-microsociety-card', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.createMicroSociety();
    });

    this._addEventListenerById('btn-open-microsociety-card', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.openMicrosocietiesSimulator();
    });
  }

  /**
   * Adjuntar botones del header mejorado
   * @private
   */
  _attachHeaderButtons() {
    // Botón menú hamburguesa
    this._addEventListenerById('btn-menu-hamburger', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleSideMenu();
    });

    // Overlay del menú lateral
    this._addEventListenerById('lab-menu-overlay', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.closeSideMenu();
    });

    // Items del menú lateral
    document.querySelectorAll('.lab-menu-item').forEach(item => {
      this._addEventListener(item, 'click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const section = item.dataset.section;
        this.handleMenuNavigation(section);
      });
    });

    // Botón de seres guardados
    this._addEventListenerById('btn-saved-beings', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.showSavedBeingsModal();
    });

    // Botón de estadísticas
    this._addEventListenerById('btn-stats', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.frankensteinStats) {
        window.frankensteinStats.open();
      } else {
        this.labUI.showNotification('Estadísticas en desarrollo', 'info');
      }
    });

    // Botón de ajustes
    this._addEventListenerById('btn-settings', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.frankensteinSettings) {
        window.frankensteinSettings.open();
      } else {
        this.labUI.showNotification('Ajustes en desarrollo', 'info');
      }
    });

    // Botón cerrar laboratorio
    this._addEventListenerById('btn-close-lab', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.labUI.organism && this.labUI.organism.hide) {
        this.labUI.organism.hide();
      } else {
        // Fallback: navegar a index
        window.location.href = 'index.html';
      }
    });

    // Actualizar contadores en menú
    this.updateMenuBadges();
  }

  /**
   * Adjuntar listeners de modales
   * @private
   */
  _attachModalListeners() {
    // Modal de misiones
    this._addEventListenerById('mission-modal-close', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.closeMissionModal();
    });

    this._addEventListenerById('mission-modal-overlay', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.closeMissionModal();
    });

    this._addEventListenerById('modal-open-pieces', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.closeRequirementsModal();
      this.labUI.openPiecesModal();
    });

    // Modal de requisitos
    this._addEventListenerById('requirements-modal-close', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.closeRequirementsModal();
    });

    this._addEventListenerById('requirements-modal-overlay', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.closeRequirementsModal();
    });

    // Modal de piezas
    this._addEventListenerById('pieces-modal-close', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.closePiecesModal();
    });

    this._addEventListenerById('pieces-modal-overlay', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.closePiecesModal();
    });

    this._addEventListenerById('pieces-open-requirements', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.closePiecesModal();
      this.labUI.openRequirementsModal();
    });
  }

  /**
   * Adjuntar listeners de FABs
   * @private
   */
  _attachFABListeners() {
    // FAB Requirements
    this._addEventListenerById('fab-requirements', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.openRequirementsModal();
    });

    // FAB Pieces
    this._addEventListenerById('fab-pieces', 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.openPiecesModal();
    });
  }

  /**
   * Toggle del menú lateral
   *
   * @description
   * Alterna entre abrir y cerrar el menú lateral
   *
   * @returns {void}
   */
  toggleSideMenu() {
    const menu = document.getElementById('lab-side-menu');
    if (menu) {
      if (menu.classList.contains('open')) {
        this.closeSideMenu();
      } else {
        this.openSideMenu();
      }
    }
  }

  /**
   * Abrir menú lateral
   *
   * @description
   * Abre el menú lateral con animación y feedback háptico
   *
   * @returns {void}
   */
  openSideMenu() {
    const menu = document.getElementById('lab-side-menu');
    if (menu) {
      menu.classList.add('open');
      document.body.style.overflow = 'hidden';
      // Feedback háptico si disponible
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  }

  /**
   * Cerrar menú lateral
   *
   * @description
   * Cierra el menú lateral y restaura el scroll
   *
   * @returns {void}
   */
  closeSideMenu() {
    const menu = document.getElementById('lab-side-menu');
    if (menu) {
      menu.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  /**
   * Manejar navegación desde el menú lateral
   *
   * @description
   * Coordina la navegación entre diferentes secciones del laboratorio:
   * - Seres guardados
   * - Microsociedades
   * - Retos
   * - Ajustes
   * - Estadísticas
   * - Ayuda
   * - Salir
   *
   * @param {string} section - Sección a la que navegar
   * @returns {void}
   */
  handleMenuNavigation(section) {
    logger.log(`[Menu] Navegando a: ${section}`);
    this.closeSideMenu();

    switch(section) {
      case 'laboratorio':
        // Ya estamos aquí, solo cerrar menú
        break;

      case 'seres':
        this.labUI.showSavedBeingsModal();
        break;

      case 'microsociedades':
        this.labUI.openMicrosocietiesSimulator();
        break;

      case 'retos':
        if (window.frankensteinChallengesModal && this.labUI.currentBeing && this.labUI.currentMission) {
          window.frankensteinChallengesModal.open(this.labUI.currentBeing, this.labUI.currentMission);
        } else if (!this.labUI.currentBeing || !this.labUI.currentMission) {
          this.labUI.showNotification('Primero crea y valida un ser con una misión', 'warning');
        } else {
          this.labUI.showNotification('Sistema de retos no disponible', 'info');
        }
        break;

      case 'ajustes':
        if (window.frankensteinSettings) {
          window.frankensteinSettings.open();
        } else {
          this.labUI.showNotification('Ajustes en desarrollo', 'info');
        }
        break;

      case 'estadisticas':
        if (window.frankensteinStats) {
          window.frankensteinStats.open();
        } else {
          this.labUI.showNotification('Estadísticas en desarrollo', 'info');
        }
        break;

      case 'ayuda':
        this.labUI.showHelpModal();
        break;

      case 'salir':
        if (this.labUI.organism && this.labUI.organism.hide) {
          this.labUI.organism.hide();
        } else {
          window.location.href = 'index.html';
        }
        break;

      default:
        logger.log(`[Menu] Sección desconocida: ${section}`);
    }
  }

  /**
   * Actualizar badges del menú con contadores
   *
   * @description
   * Actualiza los contadores visuales del menú:
   * - Contador de seres guardados
   * - Contador de microsociedades
   *
   * @returns {void}
   */
  updateMenuBadges() {
    // Contador de seres guardados
    const savedBeings = this.labUI.loadBeings();
    const seresCount = savedBeings.length;

    const headerBadge = document.getElementById('saved-beings-count');
    if (headerBadge) {
      headerBadge.textContent = seresCount;
      headerBadge.style.display = seresCount > 0 ? 'flex' : 'none';
    }

    const menuSeresCount = document.getElementById('menu-seres-count');
    if (menuSeresCount) {
      menuSeresCount.textContent = seresCount;
      menuSeresCount.style.display = seresCount > 0 ? 'inline-flex' : 'none';
    }

    // Contador de microsociedades
    try {
      const microsocieties = JSON.parse(localStorage.getItem('frankenstein_microsocieties') || '[]');
      const microCount = microsocieties.length;

      const menuMicroCount = document.getElementById('menu-micro-count');
      if (menuMicroCount) {
        menuMicroCount.textContent = microCount;
        menuMicroCount.style.display = microCount > 0 ? 'inline-flex' : 'none';
      }
    } catch (e) {
      logger.warn('[Menu] Error al obtener microsociedades:', e);
    }
  }

  /**
   * Intentar abrir la experiencia de microsociedades con fallbacks
   *
   * @description
   * Intenta abrir el simulador de microsociedades con múltiples fallbacks:
   * 1. Panel de microsociedades (microsocietiesInit)
   * 2. Galería de microsociedades (microsocietiesGallery)
   * 3. Mensaje de no disponible
   *
   * @returns {void}
   * @private
   */
  _openMicrosocietiesSimulator() {
    // Preferir el nuevo panel de microsociedades
    if (window.microsocietiesInit && typeof window.microsocietiesInit.open === 'function') {
      window.microsocietiesInit.open();
      return;
    }

    // Fallback: galería si está disponible
    if (window.microsocietiesGallery && typeof window.microsocietiesGallery.open === 'function') {
      window.microsocietiesGallery.open();
      return;
    }

    // Mensaje si no está disponible
    this.labUI.showNotification('Microsociedades en desarrollo', 'info');
  }

  /**
   * Helper: Agregar event listener con tracking
   *
   * @description
   * Wrapper para addEventListener que permite cleanup automático
   *
   * @param {HTMLElement} element - Elemento DOM
   * @param {string} event - Tipo de evento
   * @param {Function} handler - Manejador del evento
   * @param {Object} options - Opciones del listener
   * @returns {void}
   * @private
   */
  _addEventListener(element, event, handler, options = {}) {
    if (!element) return;

    const mergedOptions = {
      ...options,
      signal: this.abortController.signal
    };

    element.addEventListener(event, handler, mergedOptions);

    // Track para cleanup manual si es necesario
    this.listeners.push({ element, event, handler, options });
  }

  /**
   * Helper: Agregar event listener por ID
   *
   * @description
   * Wrapper que busca elemento por ID y agrega listener
   *
   * @param {string} elementId - ID del elemento
   * @param {string} event - Tipo de evento
   * @param {Function} handler - Manejador del evento
   * @param {Object} options - Opciones del listener
   * @returns {void}
   * @private
   */
  _addEventListenerById(elementId, event, handler, options = {}) {
    const element = document.getElementById(elementId);
    if (element) {
      this._addEventListener(element, event, handler, options);
    }
  }

  /**
   * Cleanup completo de todos los event listeners
   *
   * @description
   * Limpia todos los event listeners registrados para evitar memory leaks
   * Usa AbortController para cleanup automático
   *
   * @returns {void}
   */
  destroy() {
    // Usar AbortController para cleanup automático
    this.abortController.abort();

    // Limpiar array de listeners
    this.listeners = [];

    logger.log('[EventCoordinator] Event listeners limpiados');
  }
}

// Export default
export default FrankensteinEventCoordinator;
