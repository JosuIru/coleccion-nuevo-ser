/**
 * Frankenstein Piece Cards Module
 *
 * @module frankenstein/ui/frankenstein-piece-cards
 * @description Gestiona el renderizado y visualización de las tarjetas de piezas en el Frankenstein Lab.
 * Incluye tanto la vista en árbol como la vista en grid, soporte para mobile y desktop,
 * y la integración con el sistema de misiones para mostrar atributos y poder.
 *
 * @dependencies
 * - labUI: Referencia al FrankensteinLabUI principal
 * - domCache: Cache de elementos DOM
 * - missionsSystemRef: Sistema de misiones para análisis de piezas
 * - organism: Para acceder al catálogo de libros
 * - availablePieces: Array de piezas disponibles
 *
 * @version 2.9.154
 * @date 2024-12-28
 */

import { getPieceTypeLabel } from '../data/frankenstein-piece-catalog.js';

/**
 * @class FrankensteinPieceCards
 * @description Gestiona el renderizado de tarjetas de piezas para el Frankenstein Lab.
 * Soporta vistas desktop (árbol jerárquico) y mobile (cards desplegables).
 */
export class FrankensteinPieceCards {
  /**
   * @constructor
   * @param {Object} labUIRef - Referencia al FrankensteinLabUI principal
   * @param {Object} domCache - Cache de elementos DOM
   * @param {Object} missionsSystemRef - Sistema de misiones
   */
  constructor(labUIRef, domCache, missionsSystemRef) {
    this.labUI = labUIRef;
    this.dom = domCache;
    this.missionsSystem = missionsSystemRef;

    // Referencias internas
    this.mobileBooksData = {};
    this.mobileSheetFilter = 'all';
    this.mobileSheetSearch = '';
    this.bookSheetKeyHandler = null;
  }

  /**
   * Poblar grid de piezas (renderizado como árbol jerárquico)
   *
   * @param {string} filter - Filtro de tipo de pieza ('all', 'chapter', 'exercise', 'resource')
   * @description Organiza las piezas por libro y capítulo, creando una estructura de árbol
   * jerárquico. En mobile muestra cards colapsables, en desktop muestra árbol expandible.
   */
  populateGrid(filter = 'all') {
    const grid = this.dom.piecesGrid || document.getElementById('pieces-grid');
    if (!grid) return;

    grid.innerHTML = '';
    if (this.isMobileViewport()) {
      this.mobileBooksData = {};
    }

    // Organizar piezas por libro
    const piecesByBook = this.organizeByBook(filter);

    // Crear árbol para cada libro
    Object.entries(piecesByBook).forEach(([bookId, bookData]) => {
      const bookTree = this.createBookTree(bookId, bookData);
      grid.appendChild(bookTree);
    });

    // Update pieces count badge
    this.labUI.updatePiecesCountBadge();

    // Initialize drag and drop enhanced
    this.labUI._setTimeout(() => {
      this.labUI.initDragAndDropEnhanced();
    }, 100);
  }

  /**
   * Exposed helper para que datos de demo puedan refrescar la UI
   *
   * @param {string} filter - Filtro de tipo de pieza
   * @description Wrapper que actualiza el grid de piezas y las vistas auxiliares
   */
  renderTree(filter = 'all') {
    this.populateGrid(filter);
    this.labUI.updateMissingRequirementsQuickView();
    this.labUI.handlePiecesModalScroll();
  }

  /**
   * Organizar piezas por libro y capítulo
   *
   * @param {string} filter - Filtro de tipo de pieza
   * @returns {Object} Objeto organizado: { bookId: { bookTitle, chapters: { chapterId: { pieces: [] } } } }
   * @description Agrupa las piezas disponibles primero por libro y luego por capítulo,
   * aplicando el filtro de tipo si se especifica.
   */
  organizeByBook(filter) {
    const organized = {};

    this.labUI.availablePieces.forEach(piece => {
      // Aplicar filtro
      if (filter !== 'all' && piece.type !== filter) return;

      // Agrupar por libro
      if (!organized[piece.bookId]) {
        organized[piece.bookId] = {
          bookTitle: piece.bookTitle,
          bookId: piece.bookId,
          color: piece.color,
          chapters: {}
        };
      }

      // Agrupar por capítulo
      if (!organized[piece.bookId].chapters[piece.chapterId]) {
        organized[piece.bookId].chapters[piece.chapterId] = {
          chapterTitle: this.getChapterTitle(piece),
          pieces: []
        };
      }

      organized[piece.bookId].chapters[piece.chapterId].pieces.push(piece);
    });

    return organized;
  }

  /**
   * Obtener título del capítulo de una pieza
   *
   * @param {Object} piece - Objeto pieza con bookId y chapterId
   * @returns {string} Título del capítulo o fallback
   * @description Busca el título del capítulo en el catálogo de libros.
   * Intenta múltiples rutas de acceso (organism, sections, chapters) y retorna
   * un fallback si no encuentra el título.
   */
  getChapterTitle(piece) {
    // Buscar el capítulo original
    const catalog = this.labUI.organism.bookEngine?.catalog;
    if (!catalog) {
      return `Capítulo ${piece.chapterId}`;
    }

    const book = catalog.books.find(b => b.id === piece.bookId);
    if (!book) {
      return `Capítulo ${piece.chapterId}`;
    }

    // Intentar obtener capítulos usando el método del organism
    try {
      const chapters = this.labUI.organism.getBookChapters(book);
      if (chapters && Array.isArray(chapters)) {
        const chapter = chapters.find(c => c.id === piece.chapterId);
        if (chapter && chapter.title) {
          return chapter.title;
        }
      }
    } catch (error) {
      // Silent error
    }

    // Fallback: buscar en sections si existen y son iterables
    if (book.sections && Array.isArray(book.sections)) {
      for (const section of book.sections) {
        if (section.chapters && Array.isArray(section.chapters)) {
          const chapter = section.chapters.find(c => c.id === piece.chapterId);
          if (chapter && chapter.title) {
            return chapter.title;
          }
        }
      }
    }

    // Fallback: buscar en chapters directamente si existe
    if (book.chapters && Array.isArray(book.chapters)) {
      const chapter = book.chapters.find(c => c.id === piece.chapterId);
      if (chapter && chapter.title) {
        return chapter.title;
      }
    }

    return `Capítulo ${piece.chapterId}`;
  }

  /**
   * Obtener HTML del resumen de estadísticas
   *
   * @param {number} totalPower - Poder total
   * @param {number} totalPieces - Número total de piezas
   * @returns {string} HTML del resumen de estadísticas
   * @description Genera el HTML para mostrar poder total y número de piezas
   */
  getStatsSummaryHtml(totalPower, totalPieces) {
    return `
      <div class="book-card-stats">
        <div class="book-card-stat">
          <span>Poder</span>
          <strong>${totalPower}</strong>
        </div>
        <div class="book-card-stat">
          <span>Piezas</span>
          <strong>${totalPieces}</strong>
        </div>
      </div>
    `;
  }

  /**
   * Crear card de libro para vista mobile
   *
   * @param {string} bookId - ID del libro
   * @param {Object} bookData - Datos del libro (bookTitle, chapters)
   * @param {string} subtitleText - Texto del subtítulo
   * @param {number} totalPieces - Total de piezas
   * @param {number} totalPower - Poder total
   * @param {Object} aggregatedAttributes - Atributos agregados { attributeName: value }
   * @returns {HTMLElement} Card de libro mobile
   * @description Crea una tarjeta colapsable de libro para la vista mobile,
   * mostrando título, estadísticas y preview de atributos principales.
   */
  createBookCardMobile(bookId, bookData, subtitleText, totalPieces, totalPower, aggregatedAttributes) {
    this.mobileBooksData[bookId] = bookData;
    const attributesPreview = Object.entries(aggregatedAttributes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([attr, value]) => {
        const attrData = this.missionsSystem.attributes[attr];
        if (!attrData) return '';
        return `<span class="book-card-attr">${attrData.icon} ${Math.round(value)}</span>`;
      })
      .join('');

    const card = document.createElement('div');
    card.className = 'book-card-mobile';
    card.dataset.bookId = bookId;

    card.innerHTML = `
      <div class="book-card-top">
        <div class="book-card-icon">📚</div>
        <div class="book-card-info">
          <h4>${bookData.bookTitle}</h4>
          <p>${subtitleText}</p>
        </div>
        <button class="book-card-open" type="button" data-book-id="${bookId}">
          Ver piezas
        </button>
      </div>
      ${this.getStatsSummaryHtml(totalPower, totalPieces)}
      <div class="book-card-attributes-scroll">
        ${attributesPreview || '<span class="book-card-attr muted">Añade piezas para ver atributos</span>'}
      </div>
    `;

    const openBtn = card.querySelector('.book-card-open');
    const openBtnClickHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openBookBottomSheet(bookId);
    };
    this.labUI._addEventListener(openBtn, 'click', openBtnClickHandler);

    return card;
  }

  /**
   * Abrir bottom sheet de libro (mobile)
   *
   * @param {string} bookId - ID del libro
   * @description Abre un panel deslizante desde abajo con las piezas del libro,
   * incluyendo filtros y búsqueda.
   */
  openBookBottomSheet(bookId) {
    const bookData = this.mobileBooksData?.[bookId];
    if (!bookData) return;

    this.closeBookBottomSheet();
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

    const sheetCloseHandler = () => this.closeBookBottomSheet();
    this.labUI._addEventListener(sheet.querySelector('.sheet-close'), 'click', sheetCloseHandler);

    const overlayClickHandler = () => this.closeBookBottomSheet();
    this.labUI._addEventListener(sheet.querySelector('.book-bottom-sheet-overlay'), 'click', overlayClickHandler);

    const body = sheet.querySelector('.book-bottom-sheet-body');
    this.renderMobileBookChapters(body, bookId, bookData);
    this.setupBookBottomSheetControls(sheet, bookId, bookData);

    this.bookSheetKeyHandler = (event) => {
      if (event.key === 'Escape') {
        this.closeBookBottomSheet();
      }
    };
    this.labUI._addEventListener(document, 'keydown', this.bookSheetKeyHandler);
  }

  /**
   * Configurar controles del bottom sheet
   *
   * @param {HTMLElement} sheet - Elemento del sheet
   * @param {string} bookId - ID del libro
   * @param {Object} bookData - Datos del libro
   * @description Configura los event listeners para filtros y búsqueda en el bottom sheet
   */
  setupBookBottomSheetControls(sheet, bookId, bookData) {
    const body = sheet.querySelector('.book-bottom-sheet-body');
    if (!body) return;

    const filterButtons = sheet.querySelectorAll('.mobile-filter-chip');
    filterButtons.forEach(btn => {
      const filterClickHandler = (e) => {
        e.preventDefault();
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.mobileSheetFilter = btn.dataset.filter || 'all';
        this.renderMobileBookChapters(body, bookId, bookData);
      };
      this.labUI._addEventListener(btn, 'click', filterClickHandler);
    });

    const searchInput = sheet.querySelector('#mobile-book-search');
    if (searchInput) {
      searchInput.value = '';
      let searchDebounce;
      const searchInputHandler = () => {
        clearTimeout(searchDebounce);
        searchDebounce = this.labUI._setTimeout(() => {
          this.mobileSheetSearch = searchInput.value.trim().toLowerCase();
          this.renderMobileBookChapters(body, bookId, bookData);
        }, 120);
      };
      this.labUI._addEventListener(searchInput, 'input', searchInputHandler);
    }
  }

  /**
   * Cerrar bottom sheet de libro
   *
   * @description Cierra el panel deslizante de libro con animación
   */
  closeBookBottomSheet() {
    const sheet = document.getElementById('book-bottom-sheet');
    if (!sheet) return;
    sheet.classList.remove('open');
    this.labUI._setTimeout(() => sheet.remove(), 250);
    document.body.classList.remove('modal-open');
    if (this.bookSheetKeyHandler) {
      document.removeEventListener('keydown', this.bookSheetKeyHandler);
      this.bookSheetKeyHandler = null;
    }
  }

  /**
   * Renderizar capítulos del libro en mobile
   *
   * @param {HTMLElement} container - Contenedor donde renderizar
   * @param {string} bookId - ID del libro
   * @param {Object} bookData - Datos del libro
   * @description Renderiza los capítulos del libro como bloques colapsables,
   * aplicando filtros y búsqueda activos.
   */
  renderMobileBookChapters(container, bookId, bookData) {
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
      const chapterPower = this.calculateChapterPower(chapterData.pieces || []);
      const piecesCount = chapterData.pieces?.length || 0;
      const chapterMatchesSearch = this.mobileSheetSearch
        ? chapterTitle.toLowerCase().includes(this.mobileSheetSearch)
        : true;

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
        const card = this.createMobilePieceCard(piece);
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
      this.labUI._addEventListener(details, 'toggle', detailsToggleHandler);
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
   * Crear card de pieza para mobile
   *
   * @param {Object} piece - Objeto pieza
   * @returns {HTMLElement} Card de pieza mobile
   * @description Crea una tarjeta de pieza para la vista mobile,
   * mostrando icono, título, tipo, poder y preview de atributos.
   */
  createMobilePieceCard(piece) {
    const card = document.createElement('div');
    card.className = 'mobile-piece-card';
    card.dataset.pieceId = piece.id;
    card.dataset.type = piece.type;

    const analysis = this.missionsSystem?.analyzePiece(piece) || { attributes: {} };
    const attrsPreview = Object.entries(analysis.attributes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([attr, value]) => {
        const attrData = this.missionsSystem.attributes[attr];
        return `<span class="mobile-piece-attr">${attrData?.icon || '📊'} ${Math.round(value)}</span>`;
      })
      .join('');

    card.innerHTML = `
      <div class="mobile-piece-main">
        <div class="mobile-piece-icon">${piece.icon}</div>
        <div class="mobile-piece-info">
          <h5>${piece.title}</h5>
          <p>${this.getTypeLabel(piece.type)} • ⚡ ${Math.round(analysis.totalPower)}</p>
          <div class="mobile-piece-attrs">${attrsPreview}</div>
        </div>
        <button class="lab-button mobile-piece-action" type="button">${this.isPieceSelected(piece.id) ? 'Quitar' : 'Agregar'}</button>
      </div>
    `;

    const actionBtn = card.querySelector('.mobile-piece-action');
    const handleToggle = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.togglePieceSelectionEnhanced(piece, card);
      this.updateMobilePieceActionState(actionBtn, card);
    };

    this.labUI._addEventListener(card, 'click', handleToggle);
    this.labUI._addEventListener(actionBtn, 'click', handleToggle);

    if (this.isPieceSelected(piece.id)) {
      card.classList.add('selected');
    }

    return card;
  }

  /**
   * Actualizar estado del botón de acción en mobile piece card
   *
   * @param {HTMLElement} button - Botón de acción
   * @param {HTMLElement} card - Card de pieza
   * @description Actualiza el texto y clase del botón según si la pieza está seleccionada
   */
  updateMobilePieceActionState(button, card) {
    if (!button || !card) return;
    if (card.classList.contains('selected')) {
      button.textContent = 'Quitar';
      button.classList.add('secondary');
    } else {
      button.textContent = 'Agregar';
      button.classList.remove('secondary');
    }
  }

  /**
   * Verificar si una pieza está seleccionada
   *
   * @param {string} pieceId - ID de la pieza
   * @returns {boolean} true si la pieza está seleccionada
   */
  isPieceSelected(pieceId) {
    return this.labUI.selectedPieces.some(p => p.id === pieceId);
  }

  /**
   * Calcular poder total de un capítulo
   *
   * @param {Array} pieces - Array de piezas del capítulo
   * @returns {number} Poder total del capítulo
   * @description Suma el poder total de todas las piezas del capítulo
   */
  calculateChapterPower(pieces = []) {
    return pieces.reduce((sum, piece) => {
      const analysis = this.missionsSystem.analyzePiece(piece);
      return sum + (analysis.totalPower || 0);
    }, 0);
  }

  /**
   * Crear árbol de libro (vista desktop)
   *
   * @param {string} bookId - ID del libro
   * @param {Object} bookData - Datos del libro { bookTitle, chapters: {} }
   * @returns {HTMLElement} Elemento del árbol de libro
   * @description Crea un árbol jerárquico colapsable para desktop,
   * mostrando libro > capítulos > piezas con estadísticas agregadas.
   */
  createBookTree(bookId, bookData) {
    const bookItem = document.createElement('div');
    bookItem.className = 'book-tree-item';
    bookItem.dataset.bookId = bookId;

    // Calcular total de piezas, poder y atributos agregados
    let totalPieces = 0;
    let totalPower = 0;
    const aggregatedAttributes = {};

    Object.values(bookData.chapters).forEach(ch => {
      totalPieces += ch.pieces.length;
      ch.pieces.forEach(piece => {
        const analysis = this.missionsSystem.analyzePiece(piece);
        totalPower += analysis.totalPower;

        // Agregar atributos
        Object.entries(analysis.attributes).forEach(([attr, value]) => {
          if (!aggregatedAttributes[attr]) {
            aggregatedAttributes[attr] = 0;
          }
          aggregatedAttributes[attr] += value;
        });
      });
    });

    // Crear HTML de atributos
    const attributesHTML = Object.entries(aggregatedAttributes)
      .map(([attr, value]) => {
        const attrData = this.missionsSystem.attributes[attr];
        // Validar que attrData existe antes de acceder a sus propiedades
        if (!attrData) {
          return '';
        }
        return `<span class="tree-attribute" title="${attrData.name}: +${value}">${attrData.icon}${value}</span>`;
      })
      .join('');

    const chapterCount = Object.keys(bookData.chapters).length;

    const isCompactView = window.innerWidth <= 768;
    const subtitleText = isCompactView
      ? `${chapterCount} caps • ${totalPieces} piezas`
      : `${chapterCount} capítulos • ${totalPieces} piezas de conocimiento`;

    if (this.isMobileViewport()) {
      return this.createBookCardMobile(bookId, bookData, subtitleText, totalPieces, totalPower, aggregatedAttributes);
    }

    bookItem.innerHTML = `
      <div class="book-tree-header">
        <div class="book-tree-leading">
          <span class="book-tree-toggle" title="Abrir/Cerrar libro">▶</span>
          <span class="book-tree-icon">📚</span>
        </div>
        <div class="book-tree-title">
          <div class="book-tree-title-text">${bookData.bookTitle}</div>
          <div class="book-tree-subtitle">${subtitleText}</div>
        </div>
        <div class="book-tree-stats">
          <span class="book-tree-power" title="Poder total">⚡ ${totalPower}</span>
          <span class="book-tree-count" title="Piezas totales">📦 ${totalPieces}</span>
        </div>
      </div>
      <div class="book-tree-attributes">
        ${attributesHTML}
      </div>
      <div class="book-tree-content">
        <div class="book-chapters" id="chapters-${bookId}">
          <!-- Capítulos se insertan aquí -->
        </div>
      </div>
    `;

    const header = bookItem.querySelector('.book-tree-header');
    const toggle = bookItem.querySelector('.book-tree-toggle');
    const content = bookItem.querySelector('.book-tree-content');

    const headerClickHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = content.classList.contains('open');
      const grid = document.getElementById('pieces-grid');
      const stickyHeader = document.getElementById('requirements-sticky-header');

      if (isOpen) {
        // Cerrar este libro
        toggle.classList.remove('open');
        header.classList.remove('open');
        content.classList.remove('open');
        bookItem.classList.remove('expanded');

        // Quitar clase del grid
        if (grid) {
          grid.classList.remove('has-expanded-book');
        }

        // Remover clase del body
        document.body.classList.remove('book-expanded');

        // Ocultar sticky header al cerrar libro
        if (stickyHeader) {
          stickyHeader.classList.remove('visible');
        }
      } else {
        // COMPORTAMIENTO DE ACORDEÓN: Cerrar todos los demás libros primero
        document.querySelectorAll('.book-tree-content.open').forEach(openContent => {
          const openItem = openContent.closest('.book-tree-item');
          const openToggle = openItem.querySelector('.book-tree-toggle');
          const openHeader = openItem.querySelector('.book-tree-header');
          openToggle.classList.remove('open');
          openHeader.classList.remove('open');
          openContent.classList.remove('open');
          openItem.classList.remove('expanded');
        });

        // Abrir este libro y expandirlo
        toggle.classList.add('open');
        header.classList.add('open');
        content.classList.add('open');
        bookItem.classList.add('expanded');

        // Añadir clase al grid para mostrar solo este libro
        if (grid) {
          grid.classList.add('has-expanded-book');
        }

        // Agregar clase al body para ocultar elementos
        document.body.classList.add('book-expanded');

        // Mostrar sticky header al expandir libro
        if (stickyHeader) {
          stickyHeader.classList.add('visible');
          this.labUI.updateStickyRequirementsHeader();
        }

        // No hacer scroll automático - el libro ahora es absolute y toma control de la vista
      }
    };
    this.labUI._addEventListener(header, 'click', headerClickHandler);

    // Añadir capítulos
    const chaptersContainer = bookItem.querySelector(`#chapters-${bookId}`);
    Object.entries(bookData.chapters).forEach(([chapterId, chapterData]) => {
      const chapterTree = this.createChapterTree(bookId, chapterId, chapterData);
      chaptersContainer.appendChild(chapterTree);
    });

    return bookItem;
  }

  /**
   * Crear árbol de capítulo (vista desktop)
   *
   * @param {string} bookId - ID del libro
   * @param {string} chapterId - ID del capítulo
   * @param {Object} chapterData - Datos del capítulo { chapterTitle, pieces: [] }
   * @returns {HTMLElement} Elemento del árbol de capítulo
   * @description Crea un árbol colapsable de capítulo con sus piezas,
   * mostrando poder total y atributos agregados.
   */
  createChapterTree(bookId, chapterId, chapterData) {
    const chapterItem = document.createElement('div');
    chapterItem.className = 'chapter-tree-item';
    chapterItem.dataset.chapterId = chapterId;

    // Calcular poder total y atributos del capítulo
    let totalPower = 0;
    const aggregatedAttributes = {};

    chapterData.pieces.forEach(piece => {
      const analysis = this.missionsSystem.analyzePiece(piece);
      totalPower += analysis.totalPower;

      // Agregar atributos
      Object.entries(analysis.attributes).forEach(([attr, value]) => {
        if (!aggregatedAttributes[attr]) {
          aggregatedAttributes[attr] = 0;
        }
        aggregatedAttributes[attr] += value;
      });
    });

    // Asegurar que tenemos un título válido
    const chapterTitle = chapterData.chapterTitle || `Capítulo ${chapterId}`;

    // Crear HTML de atributos
    const attributesHTML = Object.entries(aggregatedAttributes)
      .map(([attr, value]) => {
        const attrData = this.missionsSystem.attributes[attr];
        // Validar que attrData existe antes de acceder a sus propiedades
        if (!attrData) {
          return '';
        }
        return `<span class="tree-attribute" title="${attrData.name}: +${value}">${attrData.icon}${value}</span>`;
      })
      .join('');

    chapterItem.innerHTML = `
      <div class="chapter-tree-header">
        <span class="chapter-tree-toggle">▶</span>
        <span class="chapter-tree-icon">📖</span>
        <span class="chapter-tree-title">${chapterTitle}</span>
        <span class="chapter-tree-stats">
          <span class="chapter-tree-count" title="Piezas">${chapterData.pieces.length}</span>
          <span class="chapter-tree-power" title="Poder total">⚡${totalPower}</span>
        </span>
      </div>
      <div class="chapter-tree-attributes">
        ${attributesHTML}
      </div>
      <div class="chapter-tree-content">
        <div class="chapter-pieces" id="pieces-${bookId}-${chapterId}">
          <!-- Piezas se insertan aquí -->
        </div>
      </div>
    `;

    const header = chapterItem.querySelector('.chapter-tree-header');
    const toggle = chapterItem.querySelector('.chapter-tree-toggle');
    const content = chapterItem.querySelector('.chapter-tree-content');

    const chapterHeaderClickHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = content.classList.contains('open');

      if (isOpen) {
        toggle.classList.remove('open');
        header.classList.remove('open');
        content.classList.remove('open');
      } else {
        toggle.classList.add('open');
        header.classList.add('open');
        content.classList.add('open');
      }
    };
    this.labUI._addEventListener(header, 'click', chapterHeaderClickHandler);

    // Añadir piezas
    const piecesContainer = chapterItem.querySelector(`#pieces-${bookId}-${chapterId}`);
    chapterData.pieces.forEach(piece => {
      const card = this.createPieceCard(piece);
      piecesContainer.appendChild(card);
    });

    return chapterItem;
  }

  /**
   * Crear carta de pieza (vista desktop)
   *
   * @param {Object} piece - Objeto pieza
   * @returns {HTMLElement} Card de pieza desktop
   * @description Crea una tarjeta de pieza para la vista desktop,
   * mostrando icono, tipo, título, atributos y poder.
   */
  createPieceCard(piece) {
    const card = document.createElement('div');
    card.className = 'piece-card';
    card.dataset.pieceId = piece.id;
    card.dataset.type = piece.type;
    card.style.borderColor = piece.color;

    // Analizar atributos que aporta esta pieza
    const analysis = this.missionsSystem.analyzePiece(piece);
    const attributesHTML = Object.entries(analysis.attributes || {})
      .map(([attr, value]) => {
        const attrData = this.missionsSystem.attributes[attr];
        // Validar que attrData existe antes de acceder a sus propiedades
        if (!attrData) {
          return '';
        }
        return `<span class="piece-attribute"
          data-tooltip-type="attribute"
          data-tooltip-name="${attrData.name}"
          data-tooltip-icon="${attrData.icon}"
          data-tooltip-value="${value}"
          data-tooltip-desc="${attrData.description || attrData.name}"
        >${attrData.icon} ${value}</span>`;
      })
      .join(' ');

    card.innerHTML = `
      <span class="piece-icon">${piece.icon}</span>
      <span class="piece-type-badge">${this.getTypeLabel(piece.type)}</span>
      <span class="piece-title">${piece.title}</span>
      <div class="piece-attributes-preview">
        ${attributesHTML}
      </div>
      <span class="piece-power">⚡ ${analysis.totalPower}</span>
    `;

    const pieceCardClickHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.labUI.togglePieceSelectionEnhanced(piece, card);
    };
    this.labUI._addEventListener(card, 'click', pieceCardClickHandler);

    return card;
  }

  /**
   * Obtener etiqueta de tipo de pieza
   *
   * @param {string} tipoPieza - Tipo de pieza ('chapter', 'exercise', 'resource')
   * @returns {string} Etiqueta traducida del tipo
   * @description Wrapper del método del catálogo para obtener la etiqueta del tipo de pieza
   */
  getTypeLabel(tipoPieza) {
    return getPieceTypeLabel(tipoPieza);
  }

  /**
   * Verificar si estamos en viewport mobile
   *
   * @returns {boolean} true si viewport es mobile (<=768px)
   * @description Detecta si el viewport es mobile para renderizar la vista apropiada
   */
  isMobileViewport() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  }

  /**
   * Destruir la instancia y limpiar recursos
   *
   * @description Limpia referencias y datos para evitar memory leaks
   */
  destroy() {
    this.mobileBooksData = {};
    this.mobileSheetFilter = 'all';
    this.mobileSheetSearch = '';
    this.bookSheetKeyHandler = null;
    this.labUI = null;
    this.dom = null;
    this.missionsSystem = null;
  }
}
