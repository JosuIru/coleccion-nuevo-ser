/**
 * FrankensteinTutorial - Sistema de Tutorial y Selector de Modo
 *
 * Responsabilidades:
 * - Mostrar tutorial interactivo inicial
 * - Crear selector de modo de juego (investigación/aprendizaje/demo)
 * - Selector de dificultad de quiz (niños/principiante/iniciado/experto)
 * - Mostrar hints de progreso contextuales
 * - Gestión de estado de tutorial (localStorage)
 * - Cleanup de event listeners
 *
 * @module FrankensteinTutorial
 */

export class FrankensteinTutorial {
  /**
   * Constructor del sistema de tutorial
   * @param {Object} domCache - Cache de referencias DOM
   * @param {Object} labUIRef - Referencia a FrankensteinUI principal
   */
  constructor(domCache, labUIRef) {
    this.dom = domCache;
    this.labUI = labUIRef;
    this.tutorialStep = 0;
    this.tutorialListeners = [];
    this.tutorialOverlay = null;

    // Referencia a métodos de la clase principal
    this._addEventListener = labUIRef._addEventListener.bind(labUIRef);
    this._setTimeout = labUIRef._setTimeout.bind(labUIRef);
    this.showNotification = labUIRef.showNotification.bind(labUIRef);
    this.showTooltip = labUIRef.showTooltip.bind(labUIRef);
    this.hideTooltip = labUIRef.hideTooltip.bind(labUIRef);

    console.log('[FrankensteinTutorial] Sistema de tutorial inicializado');
  }

  /**
   * Mostrar mini tutorial para Laboratorio Frankenstein
   * Solo se muestra si no se ha visto antes (localStorage)
   */
  show() {
    // Verificar si ya se mostró
    if (localStorage.getItem('frankenstein-tutorial-shown')) {
      console.log('[FrankensteinTutorial] Tutorial ya mostrado previamente');
      return;
    }

    const overlay = document.createElement('div');
    overlay.classList.add('franken-mini-tutorial', 'active');

    overlay.innerHTML = `
      <div class="tutorial-card">
        <div class="tutorial-header">
          <div class="tutorial-icon">⚗️</div>
          <div class="tutorial-title">Laboratorio Frankenstein</div>
          <div class="tutorial-subtitle">Crea seres de conocimiento únicos</div>
        </div>

        <div class="tutorial-steps">
          <div class="tutorial-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <div class="step-title">Selecciona una Misión</div>
              <div class="step-description">Cada misión requiere diferentes piezas de conocimiento</div>
            </div>
          </div>

          <div class="tutorial-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <div class="step-title">Desliza el Panel de Piezas</div>
              <div class="step-description">Swipe hacia arriba para ver todas las piezas disponibles</div>
            </div>
          </div>

          <div class="tutorial-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <div class="step-title">Usa "⚡ Compatibles"</div>
              <div class="step-description">Filtra solo las piezas que necesitas para tu misión</div>
            </div>
          </div>

          <div class="tutorial-step">
            <div class="step-number">4</div>
            <div class="step-content">
              <div class="step-title">Toca para Seleccionar</div>
              <div class="step-description">Verás animaciones y el progreso en la barra superior</div>
            </div>
          </div>

          <div class="tutorial-step">
            <div class="step-number">5</div>
            <div class="step-content">
              <div class="step-title">Completa y Activa</div>
              <div class="step-description">Cuando cumplas los requisitos, ¡confetti y celebración! 🎉</div>
            </div>
          </div>
        </div>

        <div class="tutorial-actions">
          <button class="tutorial-btn tutorial-btn-secondary" id="tutorial-skip">
            Omitir
          </button>
          <button class="tutorial-btn tutorial-btn-primary" id="tutorial-start">
            ¡Entendido!
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.tutorialOverlay = overlay;

    // Event listeners
    const skipButton = overlay.querySelector('#tutorial-skip');
    const startButton = overlay.querySelector('#tutorial-start');

    const tutorialSkipHandler = () => {
      this.skip();
    };
    this._addEventListener(skipButton, 'click', tutorialSkipHandler);
    this.tutorialListeners.push({ element: skipButton, event: 'click', handler: tutorialSkipHandler });

    const tutorialStartHandler = () => {
      this.complete();
    };
    this._addEventListener(startButton, 'click', tutorialStartHandler);
    this.tutorialListeners.push({ element: startButton, event: 'click', handler: tutorialStartHandler });

    console.log('[FrankensteinTutorial] Tutorial mostrado');
  }

  /**
   * Saltar tutorial sin completarlo
   */
  skip() {
    localStorage.setItem('frankenstein-tutorial-shown', 'skipped');
    this.hideTutorial();
    console.log('[FrankensteinTutorial] Tutorial omitido');
  }

  /**
   * Completar tutorial y mostrar primer tooltip
   */
  complete() {
    localStorage.setItem('frankenstein-tutorial-shown', 'completed');
    this.hideTutorial();

    // Mostrar primer tooltip después de cerrar tutorial
    this._setTimeout(() => {
      const missionSelector = document.getElementById('mission-selector');
      if (missionSelector) {
        this.showTooltip(missionSelector, {
          title: '🎯 Empieza Aquí',
          content: 'Selecciona una misión para comenzar tu creación',
          shortcut: null
        });

        this._setTimeout(() => this.hideTooltip(), 4000);
      }
    }, 500);

    console.log('[FrankensteinTutorial] Tutorial completado');
  }

  /**
   * Ocultar overlay de tutorial
   * @private
   */
  hideTutorial() {
    if (this.tutorialOverlay) {
      this.tutorialOverlay.classList.remove('active');
      this._setTimeout(() => {
        if (this.tutorialOverlay && this.tutorialOverlay.parentNode) {
          this.tutorialOverlay.remove();
        }
        this.tutorialOverlay = null;
      }, 300);
    }
  }

  /**
   * Mostrar hint de progreso cuando se cumple un requisito
   * @param {string} hintText - Texto del hint a mostrar
   */
  showProgressHint(hintText) {
    const progressBar = document.querySelector('.mission-progress-bar');
    if (!progressBar) {
      console.warn('[FrankensteinTutorial] Progress bar not found');
      return;
    }

    const hint = document.createElement('div');
    hint.classList.add('progress-hint');
    hint.textContent = hintText;

    progressBar.style.position = 'relative';
    progressBar.appendChild(hint);

    this._setTimeout(() => {
      hint.style.opacity = '0';
      hint.style.transform = 'translateX(-50%) translateY(-10px)';
      this._setTimeout(() => {
        if (hint.parentNode) {
          hint.remove();
        }
      }, 300);
    }, 2000);

    console.log(`[FrankensteinTutorial] Progress hint shown: ${hintText}`);
  }

  /**
   * Crear selector de modo de juego y dificultad
   * Muestra dos controles: Modo (investigación/aprendizaje/demo) y Dificultad
   */
  createModeSelector() {
    if (!window.FrankensteinQuiz) {
      console.warn('[FrankensteinTutorial] Quiz system not available');
      return;
    }

    // Buscar el header del laboratorio
    const labHeader = document.querySelector('.lab-header');
    if (!labHeader) {
      console.warn('[FrankensteinTutorial] Lab header not found');
      return;
    }

    // Obtener modo y dificultad actuales
    const currentMode = window.FrankensteinQuiz.getMode();
    const currentDifficulty = window.FrankensteinQuiz.getDifficulty();

    // Crear el selector
    const selector = document.createElement('div');
    selector.className = 'game-mode-selector';
    selector.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.5rem;">
        <div>
          <div class="game-mode-label">
            <span>🎮</span> Modo de Juego
          </div>
          <div class="game-mode-toggle">
            <button class="game-mode-option ${currentMode === 'investigacion' ? 'active' : ''}" data-mode="investigacion" title="Explora sin evaluaciones">
              🔍 Investigación
            </button>
            <button class="game-mode-option ${currentMode === 'juego' ? 'active' : ''}" data-mode="juego" title="Aprende con quizzes">
              🧠 Aprendizaje
            </button>
            <button class="game-mode-option ${currentMode === 'demo' ? 'active' : ''}" data-mode="demo" title="Explora seres y sociedades de ejemplo">
              ✨ Demo
            </button>
          </div>
        </div>

        <div>
          <div class="game-mode-label">
            <span>⚡</span> Dificultad Quiz
          </div>
          <div class="difficulty-toggle">
            <button class="difficulty-option ${currentDifficulty === 'ninos' ? 'active' : ''}" data-difficulty="ninos" title="Preguntas fáciles con lenguaje sencillo para niños">
              🎈 Niños
            </button>
            <button class="difficulty-option ${currentDifficulty === 'principiante' ? 'active' : ''}" data-difficulty="principiante" title="Preguntas sencillas sobre conceptos básicos">
              🌱 Principiante
            </button>
            <button class="difficulty-option ${currentDifficulty === 'iniciado' ? 'active' : ''}" data-difficulty="iniciado" title="Preguntas de complejidad media">
              📚 Iniciado
            </button>
            <button class="difficulty-option ${currentDifficulty === 'experto' ? 'active' : ''}" data-difficulty="experto" title="Preguntas profundas y complejas">
              🎓 Experto
            </button>
          </div>
        </div>
      </div>

      <div class="game-mode-description">
        <span id="mode-description">
          ${this.getModeDescription(currentMode)}
        </span>
      </div>
    `;

    // Insertar después del header del laboratorio
    labHeader.parentNode.insertBefore(selector, labHeader.nextSibling);

    // Event listeners para modo de juego
    selector.querySelectorAll('.game-mode-option').forEach(btn => {
      const gameModeHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const mode = btn.dataset.mode;
        console.log(`[FrankensteinTutorial] Changing mode to: ${mode}`);

        if (!window.FrankensteinQuiz) {
          console.error('[FrankensteinTutorial] FrankensteinQuiz not available');
          return;
        }

        window.FrankensteinQuiz.setMode(mode);
        console.log(`[FrankensteinTutorial] Mode changed, current mode: ${window.FrankensteinQuiz.getMode()}`);

        // Actualizar UI
        selector.querySelectorAll('.game-mode-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Actualizar descripción
        const desc = selector.querySelector('#mode-description');
        desc.textContent = this.getModeDescription(mode);

        // Si se activa modo demo, cargar datos de ejemplo
        if (mode === 'demo' && window.FrankensteinDemoData) {
          window.FrankensteinDemoData.loadDemoData(this.labUI);
          this.showNotification('✨ Datos de demostración cargados. Revisa la sección "Seres Guardados" para ver los ejemplos.', 'success', 5000);
        }

        // Mostrar notificación
        const modeMessages = {
          'investigacion': '🔍 Modo Investigación activado',
          'juego': '🧠 Modo Aprendizaje activado',
          'demo': '✨ Modo Demo activado'
        };
        this.showNotification(modeMessages[mode] || 'Modo cambiado', 'info');
      };
      this._addEventListener(btn, 'click', gameModeHandler);
    });

    // Event listeners para dificultad
    selector.querySelectorAll('.difficulty-option').forEach(btn => {
      const difficultyHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const difficulty = btn.dataset.difficulty;
        console.log(`[FrankensteinTutorial] Changing difficulty to: ${difficulty}`);

        if (!window.FrankensteinQuiz) {
          console.error('[FrankensteinTutorial] FrankensteinQuiz not available');
          return;
        }

        window.FrankensteinQuiz.setDifficulty(difficulty);

        // Actualizar UI
        selector.querySelectorAll('.difficulty-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Mostrar notificación
        const difficultyMessages = {
          'ninos': '🎈 Nivel Niños: Preguntas fáciles con lenguaje sencillo',
          'principiante': '🌱 Nivel Principiante: Preguntas sencillas y conceptos básicos',
          'iniciado': '📚 Nivel Iniciado: Preguntas de complejidad media',
          'experto': '🎓 Nivel Experto: Preguntas profundas y pensamiento crítico'
        };
        this.showNotification(difficultyMessages[difficulty] || 'Nivel cambiado', 'info');
      };
      this._addEventListener(btn, 'click', difficultyHandler);
    });

    console.log('[FrankensteinTutorial] Selector de modo creado');
  }

  /**
   * Obtener descripción del modo de juego
   * @param {string} mode - Modo de juego (investigacion, juego, demo)
   * @returns {string} Descripción del modo
   */
  getModeDescription(mode) {
    const descriptions = {
      'investigacion': 'Explora libremente sin evaluaciones. Las piezas tienen poder estándar. Ideal para lectura y reflexión.',
      'juego': 'Responde quizzes adaptados a tu nivel. El poder de las piezas depende de tu comprensión. Elige entre Principiante, Iniciado o Experto.',
      'demo': 'Explora seres y microsociedades de ejemplo. Sin quizzes, poder moderado. Perfecto para conocer el sistema.'
    };
    return descriptions[mode] || 'Modo desconocido';
  }

  /**
   * Resetear tutorial (forzar que se vuelva a mostrar)
   * Útil para testing o si el usuario quiere volver a verlo
   */
  reset() {
    localStorage.removeItem('frankenstein-tutorial-shown');
    console.log('[FrankensteinTutorial] Tutorial reseteado');
  }

  /**
   * Verificar si el tutorial ya se ha mostrado
   * @returns {boolean} true si ya se mostró, false si no
   */
  hasBeenShown() {
    return !!localStorage.getItem('frankenstein-tutorial-shown');
  }

  /**
   * Destruir instancia y limpiar listeners
   * Implementa cleanup completo para prevenir memory leaks
   */
  destroy() {
    console.log('[FrankensteinTutorial] Destruyendo sistema de tutorial');

    // Ocultar tutorial si está visible
    this.hideTutorial();

    // Limpiar listeners
    this.tutorialListeners.forEach(({ element, event, handler }) => {
      if (element) {
        element.removeEventListener(event, handler);
      }
    });
    this.tutorialListeners = [];

    // Limpiar referencias
    this.dom = null;
    this.labUI = null;
    this.tutorialOverlay = null;

    console.log('[FrankensteinTutorial] Sistema de tutorial destruido');
  }
}

// Exportación por defecto para backward compatibility
export default FrankensteinTutorial;
