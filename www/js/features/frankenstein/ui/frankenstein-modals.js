/**
 * FRANKENSTEIN MODALS v2.9.201
 * Sistema de gestión de modales para el laboratorio Frankenstein
 * Maneja todos los modales: requisitos, piezas, misiones, prompts y seres guardados
 *
 * @version 2.9.201
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

/**
 * @class FrankensteinModals
 * @description Gestiona todos los modales del laboratorio Frankenstein
 *
 * Modales gestionados:
 * - Requirements Modal: Muestra requisitos de la misión actual
 * - Pieces Modal: Catálogo de piezas disponibles con filtros
 * - Mission Modal: Selector de misiones disponibles
 * - Prompt Modal: Muestra prompt generado para IA
 * - Saved Beings Modal: Galería de seres guardados
 *
 * Features:
 * - Gestión de overlay y scroll
 * - Animaciones de apertura/cierre
 * - Event listeners con cleanup automático
 * - Integración con gestos móviles
 * - Compatible con sistema de memoria leak prevention
 */
export class FrankensteinModals {
  /**
   * @param {Object} domCache - Referencia al cache de elementos DOM
   * @param {Object} labUIRef - Referencia a la instancia principal de FrankensteinLabUI
   */
  constructor(domCache, labUIRef) {
    this.dom = domCache;
    this.labUI = labUIRef;

    /**
     * Modal actualmente abierto (para gestión de stack)
     * @type {string|null}
     */
    this.activeModal = null;

    /**
     * Event listeners registrados para cleanup
     * @type {Array<{target: EventTarget, event: string, handler: Function}>}
     */
    this.eventListeners = [];

    /**
     * Timeouts registrados para cleanup
     * @type {Array<number>}
     */
    this.timeouts = [];
  }

  /**
   * Wrapper de setTimeout con tracking automático
   * @param {Function} callback - Función a ejecutar
   * @param {number} delay - Delay en ms
   * @returns {number} Timer ID
   * @private
   */
  _setTimeout(callback, delay) {
    const timerId = setTimeout(() => {
      callback();
      // Auto-remove del tracking array al completarse
      const index = this.timeouts.indexOf(timerId);
      if (index > -1) {
        this.timeouts.splice(index, 1);
      }
    }, delay);
    this.timeouts.push(timerId);
    return timerId;
  }

  /**
   * Wrapper de addEventListener con tracking automático
   * @param {EventTarget} target - Elemento DOM
   * @param {string} event - Nombre del evento
   * @param {Function} handler - Handler function
   * @param {Object} options - Event listener options
   * @private
   */
  _addEventListener(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    this.eventListeners.push({ target, event, handler });
  }

  /**
   * REQUIREMENTS MODAL
   * ==================
   * Muestra los requisitos de la misión actual con estado de cumplimiento
   */

  /**
   * Abrir modal de requisitos
   * @public
   */
  openRequirements() {
    const modal = document.getElementById('requirements-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.activeModal = 'requirements';
    }
  }

  /**
   * Cerrar modal de requisitos
   * @public
   */
  closeRequirements() {
    const modal = document.getElementById('requirements-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      this.activeModal = null;
    }
  }

  /**
   * MISSION MODAL
   * =============
   * Muestra selector de misiones disponibles
   */

  /**
   * Abrir modal de misión
   * @public
   */
  openMission() {
    const modal = document.getElementById('mission-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.activeModal = 'mission';
    }
  }

  /**
   * Cerrar modal de misión
   * @public
   */
  closeMission() {
    const modal = document.getElementById('mission-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      this.activeModal = null;
    }
  }

  /**
   * PIECES MODAL
   * ============
   * Catálogo de piezas disponibles con sistema de filtros
   */

  /**
   * Abrir modal de piezas
   * @public
   */
  openPieces() {
    const modal = document.getElementById('pieces-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.activeModal = 'pieces';

      // Cerrar cualquier libro expandido al abrir el modal
      const expandedBooks = document.querySelectorAll('.book-tree-item.expanded');
      expandedBooks.forEach(book => {
        const content = book.querySelector('.book-tree-content');
        const toggle = book.querySelector('.book-tree-toggle');
        const header = book.querySelector('.book-tree-header');
        if (content) content.classList.remove('open');
        if (toggle) toggle.classList.remove('open');
        if (header) header.classList.remove('open');
        book.classList.remove('expanded');
      });

      // Quitar clase del grid
      const grid = document.getElementById('pieces-grid');
      if (grid) grid.classList.remove('has-expanded-book');

      // Update missing requirements when opening
      if (this.labUI.updateMissingRequirementsQuickView) {
        this.labUI.updateMissingRequirementsQuickView();
      }

      // Re-poblar grid para asegurar que esté visible
      const activeFilter = document.querySelector('.filter-pill.active');
      const filter = activeFilter ? activeFilter.dataset.filter : 'all';
      if (this.labUI.populatePiecesGrid) {
        this.labUI.populatePiecesGrid(filter);
      }

      // Evaluar estado inicial del sticky header
      this._setTimeout(() => {
        if (this.labUI.handlePiecesModalScroll) {
          this.labUI.handlePiecesModalScroll();
        }
      }, 100);
    }
  }

  /**
   * Cerrar modal de piezas
   * @public
   */
  closePieces() {
    const modal = document.getElementById('pieces-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      this.activeModal = null;
    }
    if (this.labUI.closeBookBottomSheet) {
      this.labUI.closeBookBottomSheet();
    }
  }

  /**
   * PROMPT MODAL
   * ============
   * Muestra el prompt generado para conversación con IA
   */

  /**
   * Mostrar modal de prompt generado
   * @param {string} prompt - Texto del prompt a mostrar
   * @public
   */
  showPrompt(prompt) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
    modal.style.zIndex = '9999';
    modal.innerHTML = `
      <div class="bg-slate-900 rounded-xl border-2 border-cyan-500 p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-cyan-300">Prompt del Ser</h3>
          <button class="text-white hover:text-red-400" onclick="this.closest('.fixed').remove()" aria-label="Cerrar modal"><span aria-hidden="true">✕</span></button>
        </div>
        <pre class="bg-slate-800 p-4 rounded text-sm text-gray-300 overflow-auto">${prompt}</pre>
        <div class="mt-4 flex gap-2">
          <button class="lab-button primary" onclick="navigator.clipboard.writeText(\`${prompt.replace(/`/g, '\\`')}\`); window.toast?.success('Copiado')">
            📋 Copiar
          </button>
          <button class="lab-button" onclick="window.frankensteinLabUI.talkToBeing()">
            💬 Hablar con el Ser
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.activeModal = 'prompt';
  }

  /**
   * SAVED BEINGS MODAL
   * ==================
   * Galería de seres guardados con opciones de carga/eliminación
   */

  /**
   * Mostrar modal de seres guardados
   * @public
   */
  showSavedBeings() {
    const savedBeings = this.labUI.loadBeings ? this.labUI.loadBeings() : [];

    const modal = document.createElement('div');
    modal.id = 'saved-beings-modal';

    modal.innerHTML = `
      <div class="saved-beings-header">
        <h3>🗂️ Seres Guardados</h3>
        <button class="saved-beings-close" onclick="this.closest('#saved-beings-modal').remove()" aria-label="Cerrar seres guardados"><span aria-hidden="true">✕</span></button>
      </div>

      <div class="saved-beings-body scrollable">
        ${savedBeings.length === 0 ? `
          <div class="empty-beings-state" style="text-align: center; padding: 4rem 2rem;">
            <svg width="120" height="120" viewBox="0 0 120 120" style="margin: 0 auto 2rem; opacity: 0.3;">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--franken-brass)" stroke-width="2"/>
              <path d="M 40 50 L 50 60 L 40 70 M 80 50 L 70 60 L 80 70" stroke="var(--franken-brass)" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M 45 85 Q 60 95 75 85" stroke="var(--franken-brass)" stroke-width="3" fill="none" stroke-linecap="round"/>
            </svg>
            <p style="color: var(--franken-parchment); font-size: 1.2rem; margin-bottom: 0.5rem;">No hay seres guardados todavía</p>
            <p style="color: rgba(244, 233, 216, 0.6); font-size: 0.9rem;">Crea un ser y usa el botón "Guardar Ser" para preservarlo</p>
          </div>
        ` : `
          <div class="beings-grid responsive">
            ${savedBeings.map(saved => {
              // Manejar tanto estructura antigua como nueva (demo data)
              const totalPower = saved.totalPower || saved.being?.totalPower || 0;
              const pieceCount = saved.pieceCount || saved.pieces?.length || 0;
              const timestamp = saved.timestamp || saved.createdAt;

              // Generar avatar URL y colores si el sistema está disponible
              let avatarUrl = '';
              let bgGradient = '';
              let beingEmoji = '🧬';
              let radarChart = '';

              if (this.labUI.avatarSystem && saved.being) {
                avatarUrl = this.labUI.avatarSystem.generateAvatarUrl(saved.being);
                bgGradient = this.labUI.avatarSystem.generateBeingGradient(saved.being);
                beingEmoji = this.labUI.avatarSystem.getBeingEmoji(saved.being);
                radarChart = this.labUI.avatarSystem.generateRadarChart(saved.being.attributes, 120);
              }

              const attrEntries = Object.entries(saved.being?.attributes || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6);
              const attributesHTML = attrEntries.length
                ? attrEntries.map(([attr, value]) => {
                    const attrData = this.labUI.missionsSystem.attributes[attr];
                    return `<span class="being-card-attribute-pill">${attrData?.icon || '📊'} ${attrData?.name || attr}: ${value}</span>`;
                  }).join('')
                : '<span class="being-card-attribute-pill">Sin atributos calculados</span>';
              const missionName = saved.mission?.name || 'Misión desconocida';

              return `
                <div class="being-card" style="background: ${bgGradient || 'rgba(34, 28, 23, 0.6)'}; border: 2px solid rgba(139, 115, 85, 0.4); backdrop-filter: blur(10px);">
                  <div class="being-card-header">
                    <div class="being-card-avatar">
                      ${avatarUrl
                        ? `<img src="${avatarUrl}" alt="${saved.name || 'Ser guardado'}">`
                        : beingEmoji}
                    </div>
                    <div class="being-card-info">
                      <p class="being-card-date">${new Date(timestamp).toLocaleString('es-ES')}</p>
                      <h4 class="being-card-name">${saved.name || 'Ser guardado'}</h4>
                      <p class="being-card-mission">🎯 ${missionName}</p>
                      <div class="being-card-stats">
                        <span>⚡ ${Math.round(totalPower)} poder</span>
                        <span>🧩 ${pieceCount} piezas</span>
                      </div>
                    </div>
                    <div class="being-card-actions">
                      <button
                        class="lab-button secondary"
                        onclick="window.frankensteinLabUI.loadBeing('${saved.id}'); document.getElementById('saved-beings-modal').remove()">
                        📥 Cargar
                      </button>
                      <button
                        class="lab-button danger"
                        onclick="if(confirm('¿Eliminar este ser?')) { window.frankensteinLabUI.deleteBeing('${saved.id}'); this.closest('.being-card').remove(); if(document.querySelectorAll('.being-card').length === 0) { document.getElementById('saved-beings-modal').remove(); window.frankensteinLabUI.showSavedBeingsModal(); } }">
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                  <div class="being-card-body">
                    ${radarChart ? `<div class="being-card-radar">${radarChart}</div>` : ''}
                    <div class="being-card-attributes">
                      ${attributesHTML}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    document.body.appendChild(modal);

    // Añadir bloqueo de scroll del body
    document.body.classList.add('modal-open');

    // Inicializar swipe-to-close si mobileGestures está disponible
    if (window.mobileGestures) {
      window.mobileGestures.setupSwipeToCloseModal(modal, () => {
        modal.remove();
        document.body.classList.remove('modal-open');
      });
    }

    // Añadir listener al botón de cerrar
    const closeButton = modal.querySelector('.saved-beings-close');
    if (closeButton) {
      const closeButtonHandler = () => {
        modal.remove();
        document.body.classList.remove('modal-open');
      };
      this._addEventListener(closeButton, 'click', closeButtonHandler);
    }

    this.activeModal = 'saved-beings';
  }

  /**
   * UTILITY METHODS
   * ===============
   * Métodos auxiliares para gestión de modales
   */

  /**
   * Cerrar todos los modales abiertos
   * @public
   */
  closeAll() {
    this.closeRequirements();
    this.closeMission();
    this.closePieces();

    // Cerrar modales dinámicos (prompt, saved beings)
    const dynamicModals = document.querySelectorAll('.fixed.inset-0, #saved-beings-modal');
    dynamicModals.forEach(modal => modal.remove());

    // Restaurar scroll del body
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');

    this.activeModal = null;
  }

  /**
   * Verificar si hay algún modal abierto
   * @returns {boolean} True si hay un modal activo
   * @public
   */
  hasActiveModal() {
    return this.activeModal !== null;
  }

  /**
   * Obtener el nombre del modal activo
   * @returns {string|null} Nombre del modal activo o null
   * @public
   */
  getActiveModal() {
    return this.activeModal;
  }

  /**
   * CLEANUP & DESTROY
   * =================
   * Limpieza de recursos
   */

  /**
   * Limpiar todos los event listeners registrados
   * @private
   */
  _cleanupEventListeners() {
    this.eventListeners.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }

  /**
   * Limpiar todos los timeouts pendientes
   * @private
   */
  _cleanupTimeouts() {
    this.timeouts.forEach(timerId => clearTimeout(timerId));
    this.timeouts = [];
  }

  /**
   * Destruir instancia y liberar recursos
   * @public
   */
  destroy() {
    logger.log(`[FrankensteinModals] Cleaning up: ${this.timeouts.length} timeouts, ${this.eventListeners.length} listeners`);

    // Cerrar todos los modales
    this.closeAll();

    // Limpiar timeouts y listeners
    this._cleanupTimeouts();
    this._cleanupEventListeners();

    // Limpiar referencias
    this.dom = null;
    this.labUI = null;
    this.activeModal = null;
  }
}

export default FrankensteinModals;
