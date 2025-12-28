/**
 * FrankensteinBeingBuilder
 *
 * Sistema de construcción de seres para el Laboratorio Frankenstein.
 * Gestiona la selección de piezas, actualización del ser y cálculos de atributos.
 *
 * Responsabilidades:
 * - Toggle de selección de piezas con animaciones
 * - Construcción y actualización del ser actual
 * - Actualización de display visual del ser
 * - Cálculo de poder total y atributos
 * - Actualización de balance de atributos
 * - Integración con quiz, vitruvian being y avatar
 *
 * Extraído desde frankenstein-ui.js (líneas 2445-2690, 5310-5326, 5796-5942)
 *
 * @version 2.9.201
 * @since 2.9.201
 */

export class FrankensteinBeingBuilder {
  /**
   * Constructor del sistema de construcción de seres
   *
   * @param {Object} missionsSystemRef - Referencia al sistema de misiones
   * @param {Object} labUIRef - Referencia a la UI del laboratorio
   * @param {Object} domCache - Caché de elementos DOM
   */
  constructor(missionsSystemRef, labUIRef, domCache) {
    this.missionsSystem = missionsSystemRef;
    this.labUI = labUIRef;
    this.dom = domCache;

    // Referencias a otros módulos
    this.vitruvianBeing = null;
    this.avatarGenerator = null;

    // Estado interno
    this.selectedPieces = [];
    this.currentBeing = null;
    this.skipQuizForSpecialReward = false;

    // Timeouts para cleanup
    this.timeouts = new Set();
  }

  /**
   * Inicializar referencias a módulos
   *
   * @param {Object} modules - Objeto con referencias a módulos
   */
  initializeModules(modules = {}) {
    if (modules.vitruvianBeing) {
      this.vitruvianBeing = modules.vitruvianBeing;
    }
    if (modules.avatarGenerator) {
      this.avatarGenerator = modules.avatarGenerator;
    }
  }

  /**
   * Actualizar ser a partir de piezas seleccionadas
   *
   * Esta función analiza todas las piezas seleccionadas y genera
   * un ser compuesto con sus atributos, poder total y balance.
   */
  updateBeingFromPieces() {
    if (this.selectedPieces.length === 0) {
      this.currentBeing = null;
      this.updateBeingDisplay();
      return;
    }

    // Analizar cada pieza
    const analyzedPieces = this.selectedPieces.map(piece =>
      this.missionsSystem.analyzePiece(piece)
    );

    // Crear ser
    this.currentBeing = this.missionsSystem.createBeing(analyzedPieces, 'Ser en construcción');

    // Actualizar display
    this.updateBeingDisplay();

    // Actualizar indicador de poder si está disponible
    if (window.powerIndicator) {
      const totalPower = this.currentBeing.totalPower || 0;
      const pieceCount = this.selectedPieces.length;
      window.powerIndicator.update(totalPower, pieceCount);
    }

    // Habilitar botones
    if (this.labUI?.updateActionButtons) {
      this.labUI.updateActionButtons();
    }
  }

  /**
   * Actualizar display del ser
   *
   * Actualiza todos los elementos visuales relacionados con el ser actual:
   * - Información básica (nombre, misión, poder, piezas)
   * - Atributos y balance
   * - Visualización del Hombre de Vitrubio
   * - Avatar generado
   * - Contexto de IA
   */
  updateBeingDisplay() {
    // Actualizar pill de dificultad de misión
    const missionDifficultyPill = document.getElementById('mission-difficulty-pill');
    if (missionDifficultyPill) {
      const difficulty = this.labUI?.selectedMission?.difficulty || '--';
      missionDifficultyPill.textContent = difficulty;
      missionDifficultyPill.dataset.level = difficulty;
    }

    // Actualizar nombre del ser
    const nameEl = this.dom.beingName || document.getElementById('being-name');
    if (nameEl) {
      nameEl.textContent = this.currentBeing?.name || 'Ser sin nombre';
    }

    // Actualizar etiqueta de misión
    const missionLabel = this.dom.beingMission || document.getElementById('being-mission');
    if (missionLabel) {
      missionLabel.textContent = this.labUI?.selectedMission
        ? `Misión: ${this.labUI.selectedMission.name}`
        : 'No hay misión seleccionada';
    }

    // Actualizar poder total
    const powerValue = Math.max(
      0,
      Math.round(this.currentBeing?.totalPower || this.calculateCurrentPower() || 0)
    );
    const powerEl = this.dom.beingPower || document.getElementById('being-power');
    if (powerEl) {
      powerEl.textContent = powerValue.toLocaleString('es-ES');
    }

    // Actualizar cantidad de piezas
    const piecesEl = this.dom.beingPieces || document.getElementById('being-pieces');
    if (piecesEl) {
      piecesEl.textContent = this.selectedPieces.length;
    }

    // Actualizar estado del ser
    const statusEl = this.dom.beingStatus || document.getElementById('being-status');
    if (statusEl) {
      let status = this.labUI?.selectedMission ? 'Selecciona piezas' : 'Sin misión';

      if (this.labUI?.selectedMission) {
        if (this.labUI?.lastValidationResults?.viable) {
          status = 'Validado';
        } else if (this.selectedPieces.length > 0) {
          status = 'En progreso';
        }
      }

      statusEl.textContent = status;
    }

    // Actualizar visualizaciones del Hombre de Vitrubio
    if (this.labUI?.updateVitruvianHud) {
      this.labUI.updateVitruvianHud();
    }
    if (this.labUI?.updateBeingCompositionSummary) {
      this.labUI.updateBeingCompositionSummary();
    }

    // Actualizar atributos y balance
    this.updateAttributeBars();
    this.updateBalance();
    this.updateAvatarDisplay();

    // Actualizar visualización del Hombre de Vitrubio
    if (this.vitruvianBeing && this.currentBeing) {
      this.vitruvianBeing.updateAttributes(this.currentBeing.attributes);
    } else if (this.vitruvianBeing) {
      // Si no hay ser, resetear
      this.vitruvianBeing.reset();
    }

    // Actualizar metadata del sidebar de piezas
    if (this.labUI?.updatePiecesSidebarMeta) {
      this.labUI.updatePiecesSidebarMeta();
    }

    // Actualizar contexto de IA
    if (window.labAIEngineProxy?.updateContext) {
      window.labAIEngineProxy.updateContext(this.currentBeing, this.labUI?.selectedMission);
    }

    // Actualizar progreso de challenges
    if (this.labUI?.updateMiniChallengeProgress) {
      this.labUI.updateMiniChallengeProgress();
    }
    if (this.labUI?.updateDemoScenarioProgress) {
      this.labUI.updateDemoScenarioProgress();
    }
    if (this.labUI?.updateActionButtons) {
      this.labUI.updateActionButtons();
    }
  }

  /**
   * Actualizar display del avatar
   *
   * Delegado a FrankensteinAvatarGenerator
   *
   * @version 2.9.201
   */
  updateAvatarDisplay() {
    if (this.avatarGenerator) {
      this.avatarGenerator.updateDisplay(this.currentBeing, this.selectedPieces);
    } else {
      // Fallback: ocultar contenedor si no hay generador
      const container = this.dom.beingAvatar || document.getElementById('being-avatar-display');
      if (container) {
        container.style.display = 'none';
      }
    }
  }

  /**
   * Actualizar barras de atributos
   *
   * Muestra los atributos del ser actual con indicadores visuales:
   * - Overview de balance (intelectual, emocional, acción, espiritual, práctico)
   * - Chips de atributos individuales con barras de progreso
   * - Estado de cumplimiento de requisitos
   */
  updateAttributeBars() {
    const container = this.dom.beingAttributes || document.getElementById('being-attributes');
    const summaryMeta = document.getElementById('attributes-summary-meta');
    if (!container || !this.missionsSystem) return;

    const attributes = this.currentBeing?.attributes || {};
    const requiredAttrs = this.labUI?.selectedMission?.requiredAttributes || {};
    const entries = Object.entries(attributes).filter(([, value]) => value > 0);

    // Mensaje si no hay atributos
    if (!this.currentBeing || this.selectedPieces.length === 0 || entries.length === 0) {
      container.innerHTML = '<p class="empty-card-message">Agrega piezas para ver los atributos resultantes de tu ser.</p>';
      if (summaryMeta) summaryMeta.textContent = 'Sin atributos';
      return;
    }

    // Actualizar metadata
    if (summaryMeta) {
      summaryMeta.textContent = `${entries.length} atributos activos`;
    }

    // Obtener snapshot del balance
    const balanceSnapshot = this.currentBeing.balance ||
      this.missionsSystem?.calculateBalance(attributes) || null;

    // Generar datos del overview
    const overviewData = balanceSnapshot ? [
      { key: 'intellectual', label: 'Intelectual', icon: '🧠', value: Math.round(balanceSnapshot.intellectual || 0) },
      { key: 'emotional', label: 'Emocional', icon: '❤️', value: Math.round(balanceSnapshot.emotional || 0) },
      { key: 'action', label: 'Acción', icon: '⚡', value: Math.round(balanceSnapshot.action || 0) },
      { key: 'spiritual', label: 'Espiritual', icon: '🌟', value: Math.round(balanceSnapshot.spiritual || 0) },
      { key: 'practical', label: 'Práctico', icon: '🔧', value: Math.round(balanceSnapshot.practical || 0) }
    ] : [];

    const maxOverviewValue = overviewData.length > 0
      ? Math.max(...overviewData.map(d => d.value), 1)
      : 1;

    // Generar HTML del overview
    const overviewHTML = overviewData.length > 0 ? `
      <div class="attributes-overview">
        ${overviewData.map(data => {
          const progress = maxOverviewValue > 0
            ? Math.min(100, Math.round((data.value / maxOverviewValue) * 100))
            : 0;
          return `
            <div class="attribute-radar-card">
              <div class="attribute-radar-meter" style="--progress:${progress}%;">
                <span class="attribute-radar-value">${data.value}</span>
                <span class="attribute-radar-label">${data.icon}</span>
              </div>
              <small>${data.label}</small>
            </div>
          `;
        }).join('')}
      </div>
    ` : '';

    // Generar chips de atributos individuales
    let chipsHTML = '';

    entries
      .sort((a, b) => (b[1] - a[1]))
      .forEach(([key, value]) => {
        const attrData = this.missionsSystem.attributes[key] || {};
        const required = requiredAttrs[key] || 0;
        const percentage = required > 0 ? Math.min((value / required) * 100, 100) : 100;
        const status = required > 0 ? (value >= required ? 'met' : 'unmet') : 'met';

        chipsHTML += `
          <div class="attribute-chip ${status}">
            <div class="chip-head">
              <span class="attribute-icon">${attrData.icon || '🔆'}</span>
              <div class="chip-title">
                <span class="attribute-name">${attrData.name || key}</span>
                <span class="attribute-value">${required > 0 ? `${Math.round(value)}/${required}` : Math.round(value)}</span>
              </div>
            </div>
            <div class="chip-bar">
              <span style="width: ${percentage}%; background-color: ${attrData.color || '#c084fc'};"></span>
            </div>
          </div>
        `;
      });

    // Renderizar contenedor completo
    container.innerHTML = `
      <div class="attributes-panel">
        ${overviewHTML}
        <div class="attributes-grid">
          ${chipsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Actualizar balance
   *
   * Muestra el balance general del ser entre diferentes dimensiones:
   * - Intelectual, Emocional, Acción, Espiritual, Práctico
   * - Porcentaje de harmonía total
   */
  updateBalance() {
    const container = this.dom.beingBalance || document.getElementById('being-balance');
    const summaryMeta = document.getElementById('balance-summary-meta');
    if (!container) return;

    // Mensaje si no hay ser
    if (!this.currentBeing) {
      container.innerHTML = '<p class="empty-card-message">Selecciona piezas para generar un balance.</p>';
      if (summaryMeta) summaryMeta.textContent = '0%';
      return;
    }

    // Obtener balance del ser o calcularlo
    let balance = this.currentBeing.balance;
    if (!balance || typeof balance !== 'object') {
      balance = this.missionsSystem?.calculateBalance(this.currentBeing.attributes || {}) || {};
    }

    // Actualizar metadata con harmonía
    if (summaryMeta) {
      summaryMeta.textContent = `${Math.round(balance.harmony || 0)}%`;
    }

    // Renderizar grid de balance
    container.innerHTML = `
      <div class="balance-grid">
        <div class="balance-item">
          <span class="balance-label">🧠 Intelectual</span>
          <span class="balance-value">${Math.round(balance.intellectual || 0)}</span>
        </div>
        <div class="balance-item">
          <span class="balance-label">❤️ Emocional</span>
          <span class="balance-value">${Math.round(balance.emotional || 0)}</span>
        </div>
        <div class="balance-item">
          <span class="balance-label">⚡ Acción</span>
          <span class="balance-value">${Math.round(balance.action || 0)}</span>
        </div>
        <div class="balance-item">
          <span class="balance-label">🌟 Espiritual</span>
          <span class="balance-value">${Math.round(balance.spiritual || 0)}</span>
        </div>
        <div class="balance-item">
          <span class="balance-label">🔧 Práctico</span>
          <span class="balance-value">${Math.round(balance.practical || 0)}</span>
        </div>
        <div class="balance-item harmony">
          <span class="balance-label">✨ Harmonía</span>
          <span class="balance-value">${Math.round(balance.harmony || 0)}%</span>
        </div>
      </div>
    `;
  }

  /**
   * Calcular poder total actual
   *
   * Suma el poder de todas las piezas seleccionadas.
   * Usa analyzePiece del missionsSystem para cálculos precisos.
   *
   * @returns {number} Poder total calculado
   */
  calculateCurrentPower() {
    if (this.currentBeing?.totalPower) {
      return this.currentBeing.totalPower;
    }

    if (!this.missionsSystem) {
      return this.selectedPieces.reduce((total, piece) => {
        const power = piece.power || this.getPiecePower(piece.type);
        return total + power;
      }, 0);
    }

    return this.selectedPieces.reduce((total, piece) => {
      const analysis = this.missionsSystem.analyzePiece(piece);
      return total + (analysis.totalPower || this.getPiecePower(piece.type));
    }, 0);
  }

  /**
   * Obtener poder de una pieza por tipo (fallback)
   *
   * @param {string} type - Tipo de pieza
   * @returns {number} Poder base de la pieza
   */
  getPiecePower(type) {
    const powerMap = {
      chapter: 100,
      exercise: 80,
      meditation: 60,
      reward: 150
    };
    return powerMap[type] || 50;
  }

  /**
   * Toggle de selección de pieza con animaciones mejoradas
   *
   * Esta función gestiona todo el flujo de selección/deselección:
   * - Validación de límite de piezas (máx 12)
   * - Mostrar quiz en modo juego
   * - Animaciones visuales (ripple, particles, vitruvian)
   * - Actualización del ser y requisitos
   * - Tracking de estadísticas
   *
   * @param {Object} piece - Datos de la pieza
   * @param {HTMLElement} card - Elemento DOM de la tarjeta (opcional)
   * @returns {Promise<void>}
   */
  async togglePieceSelectionEnhanced(piece, card) {
    const targetCard = card ||
      document.querySelector(`.piece-card[data-piece-id="${piece.id}"]`) ||
      document.querySelector(`.mobile-piece-card[data-piece-id="${piece.id}"]`);

    const isSelecting = targetCard ?
      !targetCard.classList.contains('selected') :
      !this.isPieceSelected(piece.id);

    if (isSelecting) {
      // Validar límite de piezas
      if (this.selectedPieces.length >= 12) {
        if (this.labUI?.showNotification) {
          this.labUI.showNotification('Máximo 12 piezas para un ser', 'warning');
        }
        return;
      }

      // Bypass del quiz para recompensas especiales
      const bypassQuiz = this.skipQuizForSpecialReward;
      this.skipQuizForSpecialReward = false;

      // EN MODO JUEGO: Mostrar quiz antes de añadir pieza
      if (!bypassQuiz) {
        if (window.FrankensteinQuiz) {
          const currentMode = window.FrankensteinQuiz.getMode();
          console.log(`[BeingBuilder] Quiz mode: ${currentMode}, piece: ${piece.title} (${piece.bookId}/${piece.chapterId})`);

          if (currentMode === 'juego') {
            try {
              console.log(`[BeingBuilder] Showing quiz for ${piece.bookId}/${piece.chapterId}`);
              const quizResult = await window.FrankensteinQuiz.showQuizModal(
                piece,
                piece.bookId,
                piece.chapterId
              );

              console.log(`[BeingBuilder] Quiz result:`, quizResult);

              // Si el usuario canceló el quiz, no añadir la pieza
              if (quizResult.cancelled) {
                console.log(`[BeingBuilder] Quiz cancelled, not adding piece`);
                return;
              }

              if (!quizResult.skipped) {
                // Aplicar multiplicador de poder a la pieza
                piece.powerMultiplier = quizResult.powerMultiplier;

                // Guardar resultado del quiz
                piece.quizScore = quizResult.correctCount;
                piece.quizTotal = quizResult.totalQuestions;

                // Dar recompensas por completar quiz
                if (window.frankensteinRewards) {
                  const isPerfect = quizResult.correctCount === quizResult.totalQuestions;
                  if (isPerfect) {
                    window.frankensteinRewards.giveReward('perfectQuiz', quizResult.powerMultiplier);
                  } else {
                    window.frankensteinRewards.giveReward('completeQuiz', quizResult.powerMultiplier);
                  }
                }
              }
            } catch (error) {
              console.error('[BeingBuilder] Error en quiz:', error);
              // Si hay error, no añadir la pieza
              return;
            }
          } else {
            console.log(`[BeingBuilder] Skipping quiz - mode is "${currentMode}"`);
          }
        } else {
          console.warn('[BeingBuilder] FrankensteinQuiz not available');
        }
      } else {
        console.log('[BeingBuilder] Añadiendo pieza especial sin quiz.');
      }

      // Solo ejecutar animaciones si el quiz fue exitoso o no hay quiz
      // Create ripple effect
      if (targetCard && this.labUI?.createSelectionRipple) {
        this.labUI.createSelectionRipple(targetCard);
      }

      // Particle burst
      this._setTimeout(() => {
        if (!targetCard) return;
        if (this.labUI?.createParticleBurst) {
          this.labUI.createParticleBurst(targetCard, {
            particleCount: 12,
            types: ['circle', 'energy'],
            duration: 800
          });
        }
      }, 100);

      // If there's a vitruvian being, animate to it
      const vitruvianContainer = document.getElementById('vitruvian-being-container');
      if (vitruvianContainer) {
        this._setTimeout(() => {
          if (targetCard && this.labUI?.animatePieceToTarget) {
            this.labUI.animatePieceToTarget(targetCard, vitruvianContainer);
          }
        }, 200);
      }

      // Show Vitruvian popup after animation completes
      this._setTimeout(() => {
        if (this.labUI?.showVitruvianPopup) {
          this.labUI.showVitruvianPopup(piece);
        }
      }, 800);

      // Añadir pieza
      if (targetCard) {
        targetCard.classList.add('selected');
      }
      this.selectedPieces.push(piece);

      // Trackear pieza para estadísticas de recompensas
      if (window.frankensteinRewards) {
        window.frankensteinRewards.trackPieceUsed();
      }

      // Disparar partículas de energía si el sistema está disponible
      if (window.energyParticles && targetCard) {
        window.energyParticles.createSelectionEffect(targetCard);
      }

      // Pulso de energía en el Hombre de Vitrubio
      if (this.vitruvianBeing && piece.dominantAttribute) {
        this.vitruvianBeing.pulseEnergy(piece.dominantAttribute);
      }

      // Actualizar display del ser
      this.updateBeingFromPieces();

      // Update requirements panel
      if (this.labUI?.updateRequirementsPanel) {
        this.labUI.updateRequirementsPanel();
      }

      // Guardar estado
      if (this.labUI?.saveLabState) {
        this.labUI.saveLabState();
      }
    } else {
      // Deselección
      if (this.labUI?.triggerHaptic) {
        this.labUI.triggerHaptic('light');
      }

      if (targetCard) {
        targetCard.classList.add('shake');
        this._setTimeout(() => targetCard.classList.remove('shake'), 500);
        targetCard.classList.remove('selected');
      }

      this.selectedPieces = this.selectedPieces.filter(p => p.id !== piece.id);

      // Actualizar display del ser
      this.updateBeingFromPieces();

      // Update requirements panel
      if (this.labUI?.updateRequirementsPanel) {
        this.labUI.updateRequirementsPanel();
      }

      // Guardar estado
      if (this.labUI?.saveLabState) {
        this.labUI.saveLabState();
      }
    }
  }

  /**
   * Verificar si una pieza está seleccionada
   *
   * @param {string} pieceId - ID de la pieza
   * @returns {boolean} True si la pieza está seleccionada
   */
  isPieceSelected(pieceId) {
    return this.selectedPieces.some(p => p.id === pieceId);
  }

  /**
   * Limpiar selección actual
   *
   * Remueve todas las piezas seleccionadas y resetea el ser.
   */
  clearSelection() {
    // Limpiar clases visuales
    document.querySelectorAll('.piece-card.selected, .mobile-piece-card.selected').forEach(card => {
      card.classList.remove('selected');
    });

    // Resetear estado
    this.selectedPieces = [];
    this.currentBeing = null;

    // Actualizar display
    this.updateBeingDisplay();

    // Resetear indicador de poder
    if (window.powerIndicator) {
      window.powerIndicator.update(0, 0);
    }
  }

  /**
   * Obtener piezas seleccionadas
   *
   * @returns {Array} Array de piezas seleccionadas
   */
  getSelectedPieces() {
    return [...this.selectedPieces];
  }

  /**
   * Obtener ser actual
   *
   * @returns {Object|null} Ser actual o null
   */
  getCurrentBeing() {
    return this.currentBeing;
  }

  /**
   * Establecer piezas seleccionadas (para restauración de estado)
   *
   * @param {Array} pieces - Array de piezas a establecer
   */
  setSelectedPieces(pieces) {
    this.selectedPieces = pieces || [];
    if (this.selectedPieces.length > 0) {
      this.updateBeingFromPieces();
    } else {
      this.currentBeing = null;
      this.updateBeingDisplay();
    }
  }

  /**
   * Habilitar bypass de quiz para siguiente pieza
   * Usado para recompensas especiales
   */
  enableQuizBypass() {
    this.skipQuizForSpecialReward = true;
  }

  /**
   * setTimeout con tracking para cleanup
   *
   * @param {Function} callback - Función a ejecutar
   * @param {number} delay - Delay en ms
   * @returns {number} ID del timeout
   */
  _setTimeout(callback, delay) {
    const timeoutId = setTimeout(() => {
      this.timeouts.delete(timeoutId);
      callback();
    }, delay);
    this.timeouts.add(timeoutId);
    return timeoutId;
  }

  /**
   * Limpiar recursos
   */
  destroy() {
    // Limpiar timeouts pendientes
    this.timeouts.forEach(id => clearTimeout(id));
    this.timeouts.clear();

    // Limpiar referencias
    this.missionsSystem = null;
    this.labUI = null;
    this.dom = null;
    this.vitruvianBeing = null;
    this.avatarGenerator = null;
    this.selectedPieces = [];
    this.currentBeing = null;

    console.log('[BeingBuilder] Destroyed');
  }
}
