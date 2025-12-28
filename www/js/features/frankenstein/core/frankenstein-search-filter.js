/**
 * FrankensteinSearchFilter - Sistema de búsqueda y filtrado de piezas
 *
 * Este módulo gestiona toda la lógica de búsqueda, filtrado y sugerencias
 * inteligentes para la selección de piezas en el laboratorio Frankenstein.
 *
 * Funcionalidades:
 * - Búsqueda de texto en piezas
 * - Filtrado por atributos específicos
 * - Filtrado de piezas compatibles con misión
 * - Sistema de sugerencias inteligentes
 * - Priorización de piezas según contexto
 *
 * @module FrankensteinSearchFilter
 * @version 2.9.154
 */

export class FrankensteinSearchFilter {
  /**
   * Constructor del sistema de búsqueda y filtrado
   *
   * @param {Object} missionsSystemRef - Referencia al sistema de misiones
   * @param {Object} labUIRef - Referencia al UI del laboratorio
   * @param {Object} domCache - Caché de elementos DOM
   */
  constructor(missionsSystemRef, labUIRef, domCache) {
    this.missionsSystem = missionsSystemRef;
    this.labUI = labUIRef;
    this.dom = domCache;
    this.currentFilter = null;

    // Timeouts para cleanup
    this.timeouts = [];
  }

  /**
   * Buscar piezas por query de texto
   *
   * @param {string} query - Texto de búsqueda
   * @param {Array} availablePieces - Piezas disponibles para buscar
   * @param {Array} selectedPieces - Piezas ya seleccionadas
   * @returns {Array} Piezas filtradas que coinciden con la búsqueda
   */
  search(query, availablePieces, selectedPieces) {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      // Si no hay búsqueda, retornar null para indicar que se debe usar filtro activo
      return null;
    }

    // Filtrar piezas que coincidan con la búsqueda
    const filtered = availablePieces.filter(piece => {
      const title = piece.title.toLowerCase();
      const bookTitle = piece.bookTitle.toLowerCase();
      const category = (piece.category || '').toLowerCase();

      return title.includes(normalizedQuery) ||
             bookTitle.includes(normalizedQuery) ||
             category.includes(normalizedQuery);
    });

    return filtered;
  }

  /**
   * Renderizar piezas filtradas
   *
   * @param {Array} pieces - Piezas a renderizar
   * @param {HTMLElement} gridElement - Elemento del grid donde renderizar
   * @param {Function} createBookTreeCallback - Función para crear árbol de libro
   * @param {Function} updateCountCallback - Función para actualizar contador
   */
  renderFiltered(pieces, gridElement, createBookTreeCallback, updateCountCallback) {
    if (!gridElement) return;

    gridElement.innerHTML = '';

    if (pieces.length === 0) {
      gridElement.innerHTML = '<p class="no-results">No se encontraron piezas</p>';
      return;
    }

    // Organizar piezas filtradas por libro
    const piecesByBook = {};
    pieces.forEach(piece => {
      if (!piecesByBook[piece.bookId]) {
        piecesByBook[piece.bookId] = {
          bookTitle: piece.bookTitle,
          bookId: piece.bookId,
          color: piece.color,
          chapters: {}
        };
      }

      if (!piecesByBook[piece.bookId].chapters[piece.chapterId]) {
        piecesByBook[piece.bookId].chapters[piece.chapterId] = {
          chapterTitle: this.getChapterTitle(piece),
          pieces: []
        };
      }

      piecesByBook[piece.bookId].chapters[piece.chapterId].pieces.push(piece);
    });

    // Crear árbol para cada libro
    Object.entries(piecesByBook).forEach(([bookId, bookData]) => {
      const bookTree = createBookTreeCallback(bookId, bookData);
      gridElement.appendChild(bookTree);
    });

    // Actualizar contador de piezas
    if (updateCountCallback) {
      updateCountCallback();
    }
  }

  /**
   * Filtrar piezas por atributo específico
   *
   * @param {string} attribute - Atributo por el cual filtrar
   * @param {Array} availablePieces - Piezas disponibles
   * @param {HTMLElement} gridElement - Elemento del grid
   * @param {Function} createBookTreeCallback - Función para crear árbol de libro
   * @param {Function} updateCountCallback - Función para actualizar contador
   * @param {Function} initDragAndDropCallback - Función para inicializar drag and drop
   */
  filterByAttribute(attribute, availablePieces, gridElement, createBookTreeCallback, updateCountCallback, initDragAndDropCallback) {
    if (!this.missionsSystem || !gridElement) return;

    // Filtrar piezas que proveen el atributo especificado
    const filtered = availablePieces.filter(piece => {
      const analysis = this.missionsSystem.analyzePiece(piece);
      return analysis.attributes[attribute] && analysis.attributes[attribute] > 0;
    });

    // Ordenar por valor del atributo (mayor primero)
    filtered.sort((a, b) => {
      const analysisA = this.missionsSystem.analyzePiece(a);
      const analysisB = this.missionsSystem.analyzePiece(b);
      const valueA = analysisA.attributes[attribute] || 0;
      const valueB = analysisB.attributes[attribute] || 0;
      return valueB - valueA;
    });

    // Limpiar grid
    gridElement.innerHTML = '';

    // Mostrar mensaje de información del filtro
    if (filtered.length > 0) {
      const attrData = this.missionsSystem.attributes[attribute];
      const attrName = attrData ? `${attrData.icon} ${attrData.name}` : attribute;

      const filterInfo = document.createElement('div');
      filterInfo.className = 'filter-info';
      filterInfo.innerHTML = `
        Mostrando ${filtered.length} piezas que aportan <strong>${attrName}</strong>
        <button class="clear-filter-btn" onclick="window.frankensteinLabUI.populatePiecesGrid('all')">
          ✕ Limpiar filtro
        </button>
      `;
      gridElement.appendChild(filterInfo);
    }

    // Organizar piezas filtradas por libro y renderizarlas
    const piecesByBook = {};
    filtered.forEach(piece => {
      if (!piecesByBook[piece.bookId]) {
        piecesByBook[piece.bookId] = {
          bookTitle: piece.bookTitle,
          bookId: piece.bookId,
          color: piece.color,
          chapters: {}
        };
      }

      if (!piecesByBook[piece.bookId].chapters[piece.chapterId]) {
        piecesByBook[piece.bookId].chapters[piece.chapterId] = {
          chapterTitle: this.getChapterTitle(piece),
          pieces: []
        };
      }

      piecesByBook[piece.bookId].chapters[piece.chapterId].pieces.push(piece);
    });

    // Crear árbol para cada libro
    Object.entries(piecesByBook).forEach(([bookId, bookData]) => {
      const bookTree = createBookTreeCallback(bookId, bookData);
      gridElement.appendChild(bookTree);
    });

    // Actualizar contador de piezas
    if (updateCountCallback) {
      updateCountCallback();
    }

    // Inicializar drag and drop
    if (initDragAndDropCallback) {
      const timeoutId = setTimeout(() => {
        initDragAndDropCallback();
      }, 100);
      this.timeouts.push(timeoutId);
    }
  }

  /**
   * Filtrar piezas compatibles con la misión actual
   *
   * @param {Object} selectedMission - Misión seleccionada
   * @param {Array} availablePieces - Piezas disponibles
   * @param {Array} selectedPieces - Piezas ya seleccionadas
   * @param {Function} getCurrentRequirementsCallback - Función para obtener requisitos actuales
   * @param {Function} showEmptyStateCallback - Función para mostrar estado vacío
   * @param {Function} renderFilteredCallback - Función para renderizar piezas filtradas
   * @param {Function} showSuggestionsCallback - Función para mostrar sugerencias
   * @returns {Array} Piezas compatibles
   */
  filterCompatible(selectedMission, availablePieces, selectedPieces, getCurrentRequirementsCallback, showEmptyStateCallback, renderFilteredCallback, showSuggestionsCallback) {
    if (!selectedMission) {
      return null; // Indicar que no hay misión seleccionada
    }

    const requirements = getCurrentRequirementsCallback();
    const compatible = this.getCompatiblePieces(requirements, availablePieces, selectedPieces, selectedMission);

    if (compatible.length === 0) {
      if (showEmptyStateCallback) {
        showEmptyStateCallback();
      }
    } else {
      if (renderFilteredCallback) {
        renderFilteredCallback(compatible);
      }
      if (showSuggestionsCallback) {
        showSuggestionsCallback(compatible, requirements);
      }
    }

    return compatible;
  }

  /**
   * Obtener piezas compatibles basadas en requisitos
   *
   * @param {Array} requirements - Requisitos de la misión
   * @param {Array} availablePieces - Piezas disponibles
   * @param {Array} selectedPieces - Piezas ya seleccionadas
   * @param {Object} selectedMission - Misión seleccionada
   * @returns {Array} Piezas compatibles
   */
  getCompatiblePieces(requirements, availablePieces, selectedPieces, selectedMission) {
    if (!this.missionsSystem) return [];

    const needed = this.getMissingRequirements(requirements);
    if (needed.length === 0) return [];

    return availablePieces.filter(piece => {
      // Verificar si ya está seleccionada
      const alreadySelected = selectedPieces.find(p => p.id === piece.id);
      if (alreadySelected) return false;

      const analysis = this.missionsSystem.analyzePiece(piece);

      const helpsRequirement = needed.some(req => {
        if (this.missionsSystem.attributes[req.type]) {
          return (analysis.attributes[req.type] || 0) > 0;
        }
        return req.type === piece.type;
      });

      if (!helpsRequirement) return false;

      // Verificar umbral de poder
      const piecePower = analysis.totalPower || piece.power || this.getPiecePower(piece.type);
      const currentPower = this.calculateCurrentPower(selectedPieces, selectedMission);
      const requiredPower = selectedMission?.minPower || 0;

      // Preferir piezas que ayuden a alcanzar el objetivo de poder
      const powerNeeded = requiredPower - currentPower;
      if (powerNeeded > 0 && piecePower < powerNeeded * 0.2) {
        return false; // Demasiado débil para ser útil
      }

      return true;
    });
  }

  /**
   * Obtener requisitos faltantes
   *
   * @param {Array} requirements - Requisitos totales
   * @returns {Array} Requisitos no cumplidos
   */
  getMissingRequirements(requirements) {
    if (!this.labUI || !this.labUI.isRequirementFulfilled) {
      return requirements || [];
    }
    return requirements.filter(req => !this.labUI.isRequirementFulfilled(req));
  }

  /**
   * Mostrar panel de sugerencias inteligentes
   *
   * @param {Array} compatiblePieces - Piezas compatibles
   * @param {Array} requirements - Requisitos de la misión
   * @param {HTMLElement} gridElement - Elemento del grid
   * @param {Array} availablePieces - Piezas disponibles
   * @param {Function} setTimeoutCallback - Función para setTimeout con tracking
   */
  showSuggestions(compatiblePieces, requirements, gridElement, availablePieces, setTimeoutCallback) {
    // Remover sugerencias existentes
    const existing = document.querySelector('.smart-suggestions');
    if (existing) existing.remove();

    // Obtener top 3 sugerencias
    const topSuggestions = this.getTopSuggestions(compatiblePieces, requirements);

    if (topSuggestions.length === 0) return;

    // Crear panel de sugerencias
    const panel = document.createElement('div');
    panel.classList.add('smart-suggestions', 'active');

    panel.innerHTML = `
      <div class="suggestions-header">
        💡 Sugerencias Inteligentes
      </div>
      <div class="suggestions-list">
        ${topSuggestions.map((suggestion, index) => `
          <div class="suggestion-item" data-piece-id="${suggestion.piece.id}">
            <span class="suggestion-icon">${this.getTypeIcon(suggestion.piece.type)}</span>
            <span class="suggestion-text">${suggestion.reason}</span>
            <span class="suggestion-badge">+${suggestion.piece.power || this.getPiecePower(suggestion.piece.type)}⚡</span>
          </div>
        `).join('')}
      </div>
    `;

    // Insertar antes del grid de piezas
    if (gridElement && gridElement.parentElement) {
      gridElement.parentElement.insertBefore(panel, gridElement);
    }

    // Adjuntar event listeners para click
    panel.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const pieceId = item.dataset.pieceId;
        const piece = availablePieces.find(p => p.id === pieceId);
        if (piece) {
          // Buscar tarjeta y trigger selección
          const card = document.querySelector(`.piece-card[data-piece-id="${pieceId}"]`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const timeoutId1 = setTimeout(() => {
              card.classList.add('bounce');
              const timeoutId2 = setTimeout(() => card.classList.remove('bounce'), 600);
              if (setTimeoutCallback) {
                setTimeoutCallback(timeoutId2);
              }
            }, 300);
            if (setTimeoutCallback) {
              setTimeoutCallback(timeoutId1);
            }
          }
        }
      });
    });
  }

  /**
   * Obtener top sugerencias basadas en requisitos y estrategia
   *
   * @param {Array} compatiblePieces - Piezas compatibles
   * @param {Array} requirements - Requisitos de la misión
   * @returns {Array} Top 3 sugerencias priorizadas
   */
  getTopSuggestions(compatiblePieces, requirements) {
    if (!this.missionsSystem) return [];

    const suggestions = [];
    const missing = this.getMissingRequirements(requirements);
    const analyzedPieces = compatiblePieces.map(piece => ({
      piece,
      analysis: this.missionsSystem.analyzePiece(piece)
    }));

    const getEntryPower = (entry) =>
      entry.analysis.totalPower || entry.piece.power || this.getPiecePower(entry.piece.type);

    missing.forEach(req => {
      let candidates = [];

      if (this.missionsSystem.attributes[req.type]) {
        // Filtrar y ordenar por atributo específico
        candidates = analyzedPieces
          .filter(entry => (entry.analysis.attributes[req.type] || 0) > 0)
          .sort((a, b) => (b.analysis.attributes[req.type] || 0) - (a.analysis.attributes[req.type] || 0));
      } else {
        // Filtrar y ordenar por tipo y poder
        candidates = analyzedPieces
          .filter(entry => entry.piece.type === req.type)
          .sort((a, b) => getEntryPower(b) - getEntryPower(a));
      }

      if (candidates.length === 0) return;

      const best = candidates[0];
      suggestions.push({
        piece: best.piece,
        reason: this.getSuggestionReason(best.piece, req, best.analysis),
        priority: this.getSuggestionPriority(best.piece, req, best.analysis)
      });
    });

    // Ordenar por prioridad y retornar top 3
    return suggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);
  }

  /**
   * Obtener texto de razón para sugerencia
   *
   * @param {Object} piece - Pieza sugerida
   * @param {Object} requirement - Requisito que cumple
   * @param {Object} analysis - Análisis de la pieza
   * @returns {string} Texto de razón
   */
  getSuggestionReason(piece, requirement, analysis) {
    if (this.missionsSystem?.attributes?.[requirement.type] && analysis) {
      const attrData = this.missionsSystem.attributes[requirement.type];
      const boost = Math.round(analysis.attributes[requirement.type] || 0);
      return `${attrData.icon} +${boost} ${attrData.name}`;
    }

    return `${piece.title.substring(0, 40)}${piece.title.length > 40 ? '...' : ''}`;
  }

  /**
   * Obtener puntuación de prioridad para sugerencia
   *
   * @param {Object} piece - Pieza a evaluar
   * @param {Object} requirement - Requisito relacionado
   * @param {Object} analysis - Análisis de la pieza
   * @returns {number} Puntuación de prioridad
   */
  getSuggestionPriority(piece, requirement, analysis) {
    let score = 0;

    // Mayor poder = mayor prioridad
    const power = (analysis?.totalPower) || piece.power || this.getPiecePower(piece.type);
    score += power;

    if (this.missionsSystem?.attributes?.[requirement.type] && analysis) {
      const target = this.getRequirementTarget(requirement) || 0;
      const current = this.getRequirementCurrentValue(requirement);
      const boost = analysis.attributes[requirement.type] || 0;
      const deficit = Math.max(0, target - current);
      score += boost * 2;

      if (deficit > 0) {
        const coverage = Math.min(1, boost / deficit);
        score += coverage * 150;
      }
    } else {
      // Tipo necesario = bonus
      score += 50;
    }

    // Déficit de poder actual
    const currentPower = this.calculateCurrentPower();
    const requiredPower = this.labUI?.selectedMission?.minPower || 0;
    const deficit = requiredPower - currentPower;

    if (deficit > 0 && power >= deficit * 0.5) {
      score += 100; // Gran bonus si la pieza puede cerrar la brecha
    }

    return score;
  }

  /**
   * Obtener ícono de tipo de pieza
   *
   * @param {string} type - Tipo de pieza
   * @returns {string} Ícono emoji
   */
  getTypeIcon(type) {
    const icons = {
      chapter: '📖',
      exercise: '⚡',
      resource: '🔧'
    };
    return icons[type] || '📦';
  }

  /**
   * Obtener título de capítulo de una pieza
   *
   * @param {Object} piece - Pieza
   * @returns {string} Título del capítulo
   */
  getChapterTitle(piece) {
    if (this.labUI && this.labUI.getChapterTitle) {
      return this.labUI.getChapterTitle(piece);
    }
    return piece.chapterTitle || `Capítulo ${piece.chapterId || 'desconocido'}`;
  }

  /**
   * Obtener objetivo de requisito
   *
   * @param {Object} requirement - Requisito
   * @returns {number} Valor objetivo
   */
  getRequirementTarget(requirement) {
    if (this.labUI && this.labUI.getRequirementTarget) {
      return this.labUI.getRequirementTarget(requirement);
    }
    return requirement.target || requirement.count || 0;
  }

  /**
   * Obtener valor actual de requisito
   *
   * @param {Object} requirement - Requisito
   * @returns {number} Valor actual
   */
  getRequirementCurrentValue(requirement) {
    if (this.labUI && this.labUI.getRequirementCurrentValue) {
      return this.labUI.getRequirementCurrentValue(requirement);
    }
    return 0;
  }

  /**
   * Calcular poder actual de piezas seleccionadas
   *
   * @param {Array} selectedPieces - Piezas seleccionadas (opcional)
   * @param {Object} selectedMission - Misión seleccionada (opcional)
   * @returns {number} Poder total actual
   */
  calculateCurrentPower(selectedPieces = null, selectedMission = null) {
    if (this.labUI && this.labUI.calculateCurrentPower) {
      return this.labUI.calculateCurrentPower();
    }

    const pieces = selectedPieces || [];
    return pieces.reduce((total, piece) => {
      const power = piece.power || this.getPiecePower(piece.type);
      return total + power;
    }, 0);
  }

  /**
   * Obtener poder base de un tipo de pieza
   *
   * @param {string} type - Tipo de pieza
   * @returns {number} Poder base
   */
  getPiecePower(type) {
    if (this.labUI && this.labUI.getPiecePower) {
      return this.labUI.getPiecePower(type);
    }

    const powerValues = {
      chapter: 30,
      exercise: 50,
      resource: 40
    };
    return powerValues[type] || 20;
  }

  /**
   * Limpiar recursos y listeners
   */
  destroy() {
    // Limpiar todos los timeouts
    this.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.timeouts = [];

    // Remover panel de sugerencias si existe
    const suggestionsPanel = document.querySelector('.smart-suggestions');
    if (suggestionsPanel) {
      suggestionsPanel.remove();
    }

    // Limpiar referencias
    this.currentFilter = null;
  }
}
