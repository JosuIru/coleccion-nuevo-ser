/**
 * FRANKENSTEIN BOTTOM SHEET - Mobile UI Component
 * Gestiona el bottom sheet móvil para navegación de libros y capítulos
 *
 * Características:
 * - Gestos táctiles avanzados (swipe up/down)
 * - Estados: collapsed, half, full
 * - Integración con MobileGestures
 * - Filtrado y búsqueda de piezas
 * - Renderizado optimizado de capítulos
 *
 * @version 1.0.0
 * @author J. Irurtzun & Claude Sonnet 4.5
 */

import { logger } from '../../../core/logger.js';

export class FrankensteinBottomSheet {
  /**
   * @param {Object} domCache - Cache de elementos DOM
   * @param {Object} labUIRef - Referencia a FrankensteinLabUI
   */
  constructor(domCache, labUIRef) {
    this.dom = domCache;
    this.labUI = labUIRef;

    // Estado del bottom sheet
    this.currentState = 'collapsed';
    this.isExpanded = false;

    // Datos móviles
    this.mobileBooksData = {};
    this.mobileSheetFilter = 'all';
    this.mobileSheetSearch = '';

    // Gestión de eventos
    this.eventListeners = [];
    this.timeoutIds = [];
    this.bookSheetKeyHandler = null;

    // Gestos táctiles (fallback)
    this.touchStartY = 0;
    this.touchCurrentY = 0;
    this.isDragging = false;
  }

  /**
   * Inicializa los gestos del bottom sheet
   */
  init() {
    const bottomSheet = document.getElementById('pieces-bottom-sheet');
    const handle = document.getElementById('bottom-sheet-handle');

    if (!bottomSheet || !handle) {
      logger.warn('Bottom sheet elements not found');
      return;
    }

    // Usar el sistema de gestos móviles si está disponible
    if (window.mobileGestures) {
      logger.debug('🎯 Usando MobileGestures avanzado para bottom sheet');

      window.mobileGestures.setupBottomSheet(bottomSheet, {
        handle: handle,
        states: {
          collapsed: { transform: 'translateY(calc(100% - 60px))', threshold: 100 },
          half: { transform: 'translateY(50%)', threshold: 150 },
          full: { transform: 'translateY(0)', threshold: 100 }
        },
        initialState: 'collapsed',
        onStateChange: (state) => {
          logger.debug(`📱 Bottom sheet state changed: ${state}`);
          this.currentState = state;
          this.isExpanded = state === 'full';

          // Actualizar clases CSS
          bottomSheet.classList.remove('collapsed', 'half', 'full');
          bottomSheet.classList.add(state);

          // Bloquear scroll del workspace si está full
          if (state === 'full') {
            window.mobileGestures.lockScroll('.lab-workspace');
          } else {
            window.mobileGestures.unlockScroll('.lab-workspace');
          }
        }
      });

      this.currentState = 'collapsed';
      return;
    }

    // Fallback: implementación básica si mobileGestures no está disponible
    logger.debug('⚠️ MobileGestures no disponible, usando implementación básica');
    this._setupFallbackGestures(bottomSheet, handle);
  }

  /**
   * Configuración de gestos fallback (sin MobileGestures)
   * @private
   */
  _setupFallbackGestures(bottomSheet, handle) {
    // Touch Events
    const handleTouchStart = (e) => {
      this.touchStartY = e.touches[0].clientY;
      this.isDragging = true;
      bottomSheet.style.transition = 'none';
    };
    this._addEventListener(handle, 'touchstart', handleTouchStart, { passive: true });

    const handleTouchMove = (e) => {
      if (!this.isDragging) return;
      this.touchCurrentY = e.touches[0].clientY;
      const deltaY = this.touchCurrentY - this.touchStartY;

      const currentTransform = this.getBottomSheetTransform(this.currentState);
      bottomSheet.style.transform = `translateY(calc(${currentTransform} + ${deltaY}px))`;
    };
    this._addEventListener(handle, 'touchmove', handleTouchMove, { passive: true });

    const handleTouchEnd = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      bottomSheet.style.transition = '';

      const deltaY = this.touchCurrentY - this.touchStartY;
      const threshold = 100;

      if (deltaY < -threshold) {
        this.currentState = this._expandState(this.currentState);
      } else if (deltaY > threshold) {
        this.currentState = this._collapseState(this.currentState);
      } else {
        this.setState(this.currentState);
      }
    };
    this._addEventListener(handle, 'touchend', handleTouchEnd, { passive: true });

    this.currentState = 'collapsed';
  }

  /**
   * Obtiene el valor transform para un estado dado
   * @param {string} state - Estado del bottom sheet
   * @returns {string} Valor CSS transform
   */
  getBottomSheetTransform(state) {
    switch (state) {
      case 'collapsed': return 'calc(100% - 60px)';
      case 'half': return '50%';
      case 'full': return '0';
      default: return 'calc(100% - 60px)';
    }
  }

  /**
   * Expande el bottom sheet un nivel
   * @private
   */
  _expandState(currentState) {
    if (currentState === 'collapsed') {
      this.setState('half');
      return 'half';
    } else if (currentState === 'half') {
      this.setState('full');
      return 'full';
    }
    return currentState;
  }

  /**
   * Colapsa el bottom sheet un nivel
   * @private
   */
  _collapseState(currentState) {
    if (currentState === 'full') {
      this.setState('half');
      return 'half';
    } else if (currentState === 'half') {
      this.setState('collapsed');
      return 'collapsed';
    }
    return currentState;
  }

  /**
   * Establece el estado del bottom sheet
   * @param {string} state - Nuevo estado ('collapsed', 'half', 'full')
   */
  setState(state) {
    const bottomSheet = document.getElementById('pieces-bottom-sheet');
    if (!bottomSheet) return;

    bottomSheet.classList.remove('collapsed', 'half', 'full');
    bottomSheet.classList.add(state);

    this.currentState = state;
    this.isExpanded = state === 'full';
  }

  /**
   * Expande el bottom sheet (público)
   */
  expand() {
    this.currentState = this._expandState(this.currentState);
  }

  /**
   * Colapsa el bottom sheet (público)
   */
  collapse() {
    this.currentState = this._collapseState(this.currentState);
  }

  /**
   * Toggle entre estados del bottom sheet
   */
  toggle() {
    const currentState = this.currentState || 'collapsed';

    if (currentState === 'collapsed') {
      this.setState('half');
      this.currentState = 'half';
    } else if (currentState === 'half') {
      this.setState('full');
      this.currentState = 'full';
    } else {
      this.setState('collapsed');
      this.currentState = 'collapsed';
    }
  }

  /**
   * Abre el bottom sheet con los capítulos de un libro
   * @param {string} bookId - ID del libro
   */
  openBook(bookId) {
    const bookData = this.mobileBooksData?.[bookId];
    if (!bookData) {
      logger.warn(`Book data not found for: ${bookId}`);
      return;
    }

    this.close();
    this.mobileSheetFilter = 'all';
    this.mobileSheetSearch = '';

    const sheet = document.createElement('div');
    sheet.id = 'book-bottom-sheet';
    sheet.className = 'book-bottom-sheet';
    sheet.innerHTML = `
      <div class="book-bottom-sheet-overlay"></div>
      <div class="book-bottom-sheet-content">
        <div class="book-bottom-sheet-header">
          <div>
            <p class="sheet-label">Libro</p>
            <h3>${bookData.bookTitle}</h3>
          </div>
          <button class="sheet-close" aria-label="Cerrar menú de libro"><span aria-hidden="true">✕</span></button>
        </div>
        <div class="book-bottom-sheet-toolbar">
          <div class="mobile-filter-chips" role="tablist">
            <button class="mobile-filter-chip active" data-filter="all">Todos</button>
            <button class="mobile-filter-chip" data-filter="chapter">Capítulos</button>
            <button class="mobile-filter-chip" data-filter="exercise">Ejercicios</button>
            <button class="mobile-filter-chip" data-filter="resource">Recursos</button>
          </div>
          <div class="mobile-search-wrapper">
            <input type="search" id="mobile-book-search" placeholder="Buscar pieza o capítulo..." autocomplete="off">
            <span class="mobile-search-icon">🔍</span>
          </div>
        </div>
        <div class="book-bottom-sheet-body"></div>
      </div>
    `;

    document.body.appendChild(sheet);
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => sheet.classList.add('open'));

    // Event listeners
    const closeBtn = sheet.querySelector('.sheet-close');
    if (closeBtn) {
      this._addEventListener(closeBtn, 'click', () => this.close());
    }

    const overlay = sheet.querySelector('.book-bottom-sheet-overlay');
    if (overlay) {
      this._addEventListener(overlay, 'click', () => this.close());
    }

    // Renderizar contenido
    const body = sheet.querySelector('.book-bottom-sheet-body');
    if (body) {
      this.renderChapters(body, bookId, bookData);
      this._setupControls(sheet, bookId, bookData);
    }

    // Keyboard handler
    this.bookSheetKeyHandler = (event) => {
      if (event.key === 'Escape') {
        this.close();
      }
    };
    this._addEventListener(document, 'keydown', this.bookSheetKeyHandler);
  }

  /**
   * Configura los controles del bottom sheet (filtros y búsqueda)
   * @private
   */
  _setupControls(sheet, bookId, bookData) {
    const body = sheet.querySelector('.book-bottom-sheet-body');
    if (!body) return;

    // Filtros
    const filterButtons = sheet.querySelectorAll('.mobile-filter-chip');
    filterButtons.forEach(btn => {
      const filterClickHandler = (e) => {
        e.preventDefault();
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.mobileSheetFilter = btn.dataset.filter || 'all';
        this.renderChapters(body, bookId, bookData);
      };
      this._addEventListener(btn, 'click', filterClickHandler);
    });

    // Búsqueda
    const searchInput = sheet.querySelector('#mobile-book-search');
    if (searchInput) {
      searchInput.value = '';
      let searchDebounce;
      const searchInputHandler = () => {
        clearTimeout(searchDebounce);
        searchDebounce = this._setTimeout(() => {
          this.mobileSheetSearch = searchInput.value.trim().toLowerCase();
          this.renderChapters(body, bookId, bookData);
        }, 120);
      };
      this._addEventListener(searchInput, 'input', searchInputHandler);
    }
  }

  /**
   * Cierra el bottom sheet del libro
   */
  close() {
    const sheet = document.getElementById('book-bottom-sheet');
    if (!sheet) return;

    sheet.classList.remove('open');
    this._setTimeout(() => sheet.remove(), 250);
    document.body.classList.remove('modal-open');

    if (this.bookSheetKeyHandler) {
      document.removeEventListener('keydown', this.bookSheetKeyHandler);
      this.bookSheetKeyHandler = null;
    }
  }

  /**
   * Renderiza los capítulos del libro en el bottom sheet
   * @param {HTMLElement} container - Contenedor donde renderizar
   * @param {string} bookId - ID del libro
   * @param {Object} bookData - Datos del libro
   */
  renderChapters(container, bookId, bookData) {
    container.innerHTML = '';
    const chapters = Object.entries(bookData.chapters || {});

    if (chapters.length === 0) {
      container.innerHTML = '<p class="mobile-chapter-empty">No hay piezas registradas para este libro.</p>';
      return;
    }

    chapters.forEach(([chapterId, chapterData]) => {
      const details = document.createElement('details');
      details.className = 'mobile-chapter-block';

      const chapterTitle = chapterData.chapterTitle || `Capítulo ${chapterId}`;
      const chapterPower = this._calculateChapterPower(chapterData.pieces || []);
      const piecesCount = chapterData.pieces?.length || 0;
      const chapterMatchesSearch = this.mobileSheetSearch
        ? chapterTitle.toLowerCase().includes(this.mobileSheetSearch)
        : true;

      // Filtrar piezas
      const filteredPieces = (chapterData.pieces || []).filter(piece => {
        const typeMatch = this.mobileSheetFilter === 'all' || piece.type === this.mobileSheetFilter;
        const text = `${piece.title || ''} ${piece.bookTitle || ''}`.toLowerCase();
        const pieceMatchesSearch = this.mobileSheetSearch ? text.includes(this.mobileSheetSearch) : true;
        return typeMatch && pieceMatchesSearch;
      });

      if (!chapterMatchesSearch && filteredPieces.length === 0) {
        return;
      }

      details.innerHTML = `
        <summary>
          <div>
            <p class="mobile-chapter-title">${chapterTitle}</p>
            <span class="mobile-chapter-meta">${piecesCount} piezas • ⚡ ${chapterPower}</span>
          </div>
          <span class="mobile-chapter-chevron">⌄</span>
        </summary>
      `;

      const piecesWrapper = document.createElement('div');
      piecesWrapper.className = 'mobile-chapter-pieces';

      if (filteredPieces.length === 0) {
        piecesWrapper.innerHTML = `
          <div class="mobile-empty-state">
            <span>Sin piezas que coincidan con el filtro.</span>
          </div>
        `;
      }

      filteredPieces.forEach(piece => {
        const card = this._createMobilePieceCard(piece);
        piecesWrapper.appendChild(card);
      });

      details.appendChild(piecesWrapper);
      container.appendChild(details);
      details.open = chapters.length <= 3 || details.open;

      const detailsToggleHandler = () => {
        if (details.open) {
          container.querySelectorAll('.mobile-chapter-block').forEach(block => {
            if (block !== details) block.removeAttribute('open');
          });
        }
      };
      this._addEventListener(details, 'toggle', detailsToggleHandler);
    });

    if (!container.children.length) {
      container.innerHTML = `
        <div class="mobile-empty-state">
          <span>No se encontraron piezas con ese filtro.</span>
        </div>
      `;
    }
  }

  /**
   * Calcula el poder total de un capítulo
   * @private
   */
  _calculateChapterPower(pieces = []) {
    return pieces.reduce((sum, piece) => {
      const analysis = this.labUI.missionsSystem?.analyzePiece(piece) || { totalPower: 0 };
      return sum + (analysis.totalPower || 0);
    }, 0);
  }

  /**
   * Crea una tarjeta de pieza móvil
   * @private
   */
  _createMobilePieceCard(piece) {
    const card = document.createElement('div');
    card.className = 'mobile-piece-card';
    card.dataset.pieceId = piece.id;
    card.dataset.type = piece.type;

    const analysis = this.labUI.missionsSystem?.analyzePiece(piece) || { attributes: {} };
    const attrsPreview = Object.entries(analysis.attributes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([attr, value]) => {
        const attrData = this.labUI.missionsSystem.attributes[attr];
        return `<span class="mobile-piece-attr">${attrData?.icon || '📊'} ${Math.round(value)}</span>`;
      })
      .join('');

    const typeLabel = this._getTypeLabel(piece.type);
    const isSelected = this._isPieceSelected(piece.id);

    card.innerHTML = `
      <div class="mobile-piece-main">
        <div class="mobile-piece-icon">${piece.icon}</div>
        <div class="mobile-piece-info">
          <h5>${piece.title}</h5>
          <p>${typeLabel} • ⚡ ${Math.round(analysis.totalPower)}</p>
          <div class="mobile-piece-attrs">${attrsPreview}</div>
        </div>
        <button class="lab-button mobile-piece-action" type="button">${isSelected ? 'Quitar' : 'Agregar'}</button>
      </div>
    `;

    const actionBtn = card.querySelector('.mobile-piece-action');
    const handleToggle = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.togglePieceSelectionEnhanced(piece, card);
      this._updateMobilePieceActionState(actionBtn, card);
    };

    this._addEventListener(card, 'click', handleToggle);
    this._addEventListener(actionBtn, 'click', handleToggle);

    if (isSelected) {
      card.classList.add('selected');
    }

    return card;
  }

  /**
   * Obtiene la etiqueta del tipo de pieza
   * @private
   */
  _getTypeLabel(type) {
    const labels = {
      'chapter': 'Capítulo',
      'exercise': 'Ejercicio',
      'resource': 'Recurso'
    };
    return labels[type] || 'Pieza';
  }

  /**
   * Verifica si una pieza está seleccionada
   * @private
   */
  _isPieceSelected(pieceId) {
    return this.labUI.selectedPieces.some(p => p.id === pieceId);
  }

  /**
   * Actualiza el estado del botón de acción de la pieza
   * @private
   */
  _updateMobilePieceActionState(button, card) {
    const pieceId = card.dataset.pieceId;
    const isSelected = this._isPieceSelected(pieceId);

    button.textContent = isSelected ? 'Quitar' : 'Agregar';

    if (isSelected) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  }

  /**
   * Registra el libro en el sistema móvil
   * @param {string} bookId - ID del libro
   * @param {Object} bookData - Datos del libro
   */
  registerBook(bookId, bookData) {
    this.mobileBooksData[bookId] = bookData;
  }

  /**
   * Agrega un event listener y lo registra para cleanup
   * @private
   */
  _addEventListener(element, event, handler, options) {
    element.addEventListener(event, handler, options);
    this.eventListeners.push({ element, event, handler, options });
  }

  /**
   * Crea un timeout y lo registra para cleanup
   * @private
   */
  _setTimeout(callback, delay) {
    const timeoutId = setTimeout(callback, delay);
    this.timeoutIds.push(timeoutId);
    return timeoutId;
  }

  /**
   * Limpia todos los event listeners y timeouts
   */
  destroy() {
    // Limpiar event listeners
    this.eventListeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.eventListeners = [];

    // Limpiar timeouts
    this.timeoutIds.forEach(id => clearTimeout(id));
    this.timeoutIds = [];

    // Limpiar keyboard handler
    if (this.bookSheetKeyHandler) {
      document.removeEventListener('keydown', this.bookSheetKeyHandler);
      this.bookSheetKeyHandler = null;
    }

    // Cerrar sheet si está abierto
    this.close();

    logger.debug('🧹 FrankensteinBottomSheet destroyed');
  }
}

export default FrankensteinBottomSheet;
