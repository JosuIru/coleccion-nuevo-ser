// ============================================================================
// CONTEXTUAL HINTS - Sistema de Sugerencias Contextuales
// ============================================================================
// Muestra sugerencias sutiles para descubrir features sin abrumar
// - Aparecen en el momento correcto basado en contexto
// - Se pueden descartar permanentemente
// - No son intrusivos
// ============================================================================

// 🔧 FIX v2.9.198: Migrated console.log to logger
class ContextualHints {
  constructor() {
    this.storageKey = 'contextual_hints_data';
    this.data = this.loadData();
    this.currentHint = null;
    this.hintTimeout = null;

    // 🧹 MEMORY LEAK FIX #70, #73: Trackear timeouts para limpiarlos
    this.autoCloseTimeout = null;

    // 🔧 FIX #86: Event manager centralizado para limpieza consistente
    this.eventManager = new EventManager();
    this.eventManager.setComponentName('ContextualHints');

    // 🔧 FIX #74: No detectar aquí - usar getter dinámico en su lugar (ver más abajo)

    // Definición de hints con sus condiciones
    this.hints = {
      // === HINTS DE BIBLIOTECA ===
      'search-tip': {
        id: 'search-tip',
        title: '🔍 Búsqueda Rápida',
        content: 'Presiona <kbd>Ctrl+K</kbd> o <kbd>/</kbd> para buscar en cualquier momento.',
        context: 'biblioteca',
        trigger: 'visits >= 3 && !hasUsedSearch',
        priority: 5,
        keyboardOnly: true // No mostrar en móvil
      },
      'practice-library': {
        id: 'practice-library',
        title: '🧘 Biblioteca de Prácticas',
        content: 'Accede a más de 50 meditaciones y ejercicios en el botón "Prácticas".',
        context: 'biblioteca',
        trigger: 'chaptersRead >= 3 && !hasUsedPracticeLibrary',
        priority: 7
      },
      'exploration-hub': {
        id: 'exploration-hub',
        title: '🧭 Hub de Exploración',
        content: 'El botón "Explorar" te permite navegar por temas, conceptos y recursos relacionados.',
        context: 'biblioteca',
        trigger: 'booksStarted >= 2 && !hasUsedExplorationHub',
        priority: 6
      },

      // === HINTS DE LECTURA ===
      'text-selection': {
        id: 'text-selection',
        title: '✨ Selección Inteligente',
        content: 'Selecciona cualquier texto para explicarlo, definirlo o preguntarle a la IA.',
        context: 'reader',
        trigger: 'chaptersRead >= 2 && !hasUsedTextSelection',
        priority: 9
      },
      'ai-chat': {
        id: 'ai-chat',
        title: '🤖 Chat con IA',
        content: 'Tienes dudas? El chat de IA puede profundizar en cualquier concepto del libro.',
        context: 'reader',
        trigger: 'chaptersRead >= 5 && !hasUsedAiChat',
        priority: 8
      },
      'audio-reader': {
        id: 'audio-reader',
        title: '🎧 Escucha mientras...',
        content: 'Activa el AudioReader para escuchar el libro. Perfecto para multitarea.',
        context: 'reader',
        trigger: 'visits >= 5 && !hasUsedAudioReader',
        priority: 7
      },
      'notes-system': {
        id: 'notes-system',
        title: '📝 Sistema de Notas',
        content: 'Guarda tus reflexiones con el botón de notas. Se sincronizan entre dispositivos.',
        context: 'reader',
        trigger: 'chaptersRead >= 3 && !hasUsedNotes',
        priority: 6
      },
      'keyboard-shortcuts': {
        id: 'keyboard-shortcuts',
        title: '⌨️ Atajos de Teclado',
        content: 'Presiona <kbd>?</kbd> para ver todos los atajos disponibles.',
        context: 'reader',
        trigger: 'visits >= 7 && !hasSeenShortcuts',
        priority: 4,
        keyboardOnly: true // No mostrar en móvil
      },
      'bookmark-tip': {
        id: 'bookmark-tip',
        title: '🔖 Marcadores',
        content: 'Guarda capítulos importantes con el botón de marcador o presiona <kbd>B</kbd>.',
        context: 'reader',
        trigger: 'chaptersRead >= 4 && !hasUsedBookmarks',
        priority: 5,
        keyboardOnly: true // No mostrar en móvil
      },

      // === HINTS DE PROGRESO ===
      'streak-intro': {
        id: 'streak-intro',
        title: '🔥 Sistema de Rachas',
        content: 'Lee o practica cada día para mantener tu racha. ¡Los hábitos se construyen con constancia!',
        context: 'biblioteca',
        trigger: 'visits >= 2 && streakDays === 0',
        priority: 8
      },
      'progress-dashboard': {
        id: 'progress-dashboard',
        title: '📊 Dashboard de Progreso',
        content: 'Mira tu progreso detallado en el botón "Progreso" del menú.',
        context: 'biblioteca',
        trigger: 'chaptersRead >= 10 && !hasUsedProgressDashboard',
        priority: 5
      },

      // === HINTS DE FEATURES AVANZADOS ===
      'frankenstein-lab': {
        id: 'frankenstein-lab',
        title: '🧬 Frankenstein Lab',
        content: 'Crea tu propio "Ser Transformador" combinando atributos de consciencia. Es único en su tipo.',
        context: 'biblioteca',
        trigger: 'chaptersRead >= 15 && !hasUsedFrankensteinLab',
        priority: 6
      },
      'binaural-audio': {
        id: 'binaural-audio',
        title: '🎵 Audio Binaural',
        content: 'Activa sonidos binaurales mientras lees para mejorar la concentración.',
        context: 'reader',
        trigger: 'chaptersRead >= 8 && !hasUsedBinauralAudio',
        priority: 4
      },
      'koan-generator': {
        id: 'koan-generator',
        title: '🔮 Generador de Koanes',
        content: 'Obtén koanes zen para reflexionar. Disponible en algunos libros.',
        context: 'reader',
        trigger: 'chaptersRead >= 10 && !hasUsedKoanGenerator',
        priority: 3
      }
    };
  }

  // ==========================================================================
  // GESTIÓN DE DATOS
  // ==========================================================================

  loadData() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      logger.error('[ContextualHints] Error loading data:', e);
    }

    return {
      dismissedHints: [],
      seenHints: [],
      featureUsage: {
        hasUsedSearch: false,
        hasUsedPracticeLibrary: false,
        hasUsedExplorationHub: false,
        hasUsedTextSelection: false,
        hasUsedAiChat: false,
        hasUsedAudioReader: false,
        hasUsedNotes: false,
        hasSeenShortcuts: false,
        hasUsedBookmarks: false,
        hasUsedProgressDashboard: false,
        hasUsedFrankensteinLab: false,
        hasUsedBinauralAudio: false,
        hasUsedKoanGenerator: false
      },
      visits: 0,
      lastHintShown: null
    };
  }

  saveData() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      logger.error('[ContextualHints] Error saving data:', e);
    }
  }

  // ==========================================================================
  // LÓGICA DE HINTS
  // ==========================================================================

  /**
   * Registra una visita y verifica si mostrar un hint
   */
  onPageVisit(context) {
    this.data.visits++;
    this.saveData();

    // No mostrar hints muy seguido
    const now = Date.now();
    if (this.data.lastHintShown && now - this.data.lastHintShown < 60000) {
      return; // Esperar al menos 1 minuto entre hints
    }

    // Buscar hint apropiado
    const hint = this.findBestHint(context);
    if (hint) {
      // 🔧 FIX #70: Limpiar timeout anterior antes de crear uno nuevo
      if (this.hintTimeout) {
        clearTimeout(this.hintTimeout);
        this.hintTimeout = null;
      }

      // Delay para no interrumpir inmediatamente
      this.hintTimeout = setTimeout(() => {
        this.showHint(hint);
        this.hintTimeout = null;
      }, 5000);
    }
  }

  /**
   * Encuentra el mejor hint para mostrar basado en contexto
   */
  findBestHint(context) {
    const eligibleHints = Object.values(this.hints)
      .filter(hint => {
        // Filtrar por contexto
        if (hint.context !== context) return false;

        // No mostrar hints ya descartados
        if (this.data.dismissedHints.includes(hint.id)) return false;

        // Filtrar hints de teclado en móvil
        if (this.isMobile && hint.keyboardOnly) return false;

        // Evaluar condición de trigger
        return this.evaluateTrigger(hint.trigger);
      })
      .sort((a, b) => b.priority - a.priority);

    return eligibleHints[0] || null;
  }

  /**
   * Evalúa si se cumple la condición de un trigger
   * 🔒 SECURITY FIX #71: Usa SafeExpressionEvaluator en lugar de new Function()
   */
  evaluateTrigger(trigger) {
    try {
      // Crear contexto de evaluación
      const context = {
        visits: this.data.visits,
        chaptersRead: this.getChaptersRead(),
        booksStarted: this.getBooksStarted(),
        streakDays: this.getStreakDays(),
        ...this.data.featureUsage
      };

      // Evaluar la expresión de forma segura sin new Function()
      if (!window.SafeExpressionEvaluator) {
        logger.error('[ContextualHints] SafeExpressionEvaluator not loaded');
        return false;
      }

      const evaluator = new SafeExpressionEvaluator(false);
      return evaluator.evaluate(trigger, context);
    } catch (e) {
      logger.error('[ContextualHints] Error evaluating trigger:', e);
      return false;
    }
  }

  // ==========================================================================
  // UI
  // ==========================================================================

  /**
   * Muestra un hint
   * 🧹 FIX #73: Guardar timeout para poder limpiarlo después
   */
  showHint(hint) {
    // No mostrar si ya hay uno visible
    if (this.currentHint) return;

    // Limpiar timeout anterior si existe
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout);
      this.autoCloseTimeout = null;
    }

    this.currentHint = hint;
    this.data.lastHintShown = Date.now();
    this.data.seenHints.push(hint.id);
    this.saveData();

    // 🔧 FIX #72: Crear elementos DOM en lugar de innerHTML con onclick inline
    const hintElement = document.createElement('div');
    hintElement.id = 'contextual-hint';
    hintElement.className = 'contextual-hint';

    // Botón de cerrar
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.title = 'No mostrar más';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => this.dismissHint(hint.id));

    // Título
    const titleDiv = document.createElement('div');
    titleDiv.className = 'title';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = hint.title;
    titleDiv.appendChild(titleSpan);

    // Contenido
    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    contentDiv.textContent = hint.content;

    // Botón "Entendido"
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'actions';
    const gotItBtn = document.createElement('button');
    gotItBtn.className = 'got-it-btn';
    gotItBtn.textContent = 'Entendido';
    gotItBtn.addEventListener('click', () => this.closeHint());
    actionsDiv.appendChild(gotItBtn);

    // Ensamblar
    hintElement.appendChild(closeBtn);
    hintElement.appendChild(titleDiv);
    hintElement.appendChild(contentDiv);
    hintElement.appendChild(actionsDiv);

    document.body.appendChild(hintElement);

    // Auto-cerrar después de 15 segundos (guardar timeout)
    this.autoCloseTimeout = setTimeout(() => {
      this.closeHint();
    }, 15000);
  }

  /**
   * Cierra el hint actual
   * 🧹 FIX #70, #73: Limpiar timeouts para evitar memory leak
   */
  closeHint() {
    // 🔧 FIX #70: Limpiar hint timeout pendiente
    if (this.hintTimeout) {
      clearTimeout(this.hintTimeout);
      this.hintTimeout = null;
    }

    // 🔧 FIX #73: Limpiar auto-close timeout
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout);
      this.autoCloseTimeout = null;
    }

    const hintElement = document.getElementById('contextual-hint');
    if (hintElement) {
      hintElement.classList.add('fade-out');
      setTimeout(() => {
        hintElement.remove();
      }, 300);
    }
    this.currentHint = null;
  }

  /**
   * Descarta un hint permanentemente
   */
  dismissHint(hintId) {
    this.data.dismissedHints.push(hintId);
    this.saveData();
    this.closeHint();
  }

  // ==========================================================================
  // REGISTRO DE USO DE FEATURES
  // ==========================================================================

  /**
   * Marca un feature como usado
   */
  markFeatureUsed(featureKey) {
    if (this.data.featureUsage.hasOwnProperty(featureKey)) {
      this.data.featureUsage[featureKey] = true;
      this.saveData();

      // Cerrar hint si estaba mostrando uno relacionado
      if (this.currentHint) {
        this.closeHint();
      }
    }
  }

  // Métodos de conveniencia para marcar features
  onSearchUsed() { this.markFeatureUsed('hasUsedSearch'); }
  onPracticeLibraryUsed() { this.markFeatureUsed('hasUsedPracticeLibrary'); }
  onExplorationHubUsed() { this.markFeatureUsed('hasUsedExplorationHub'); }
  onTextSelectionUsed() { this.markFeatureUsed('hasUsedTextSelection'); }
  onAiChatUsed() { this.markFeatureUsed('hasUsedAiChat'); }
  onAudioReaderUsed() { this.markFeatureUsed('hasUsedAudioReader'); }
  onNotesUsed() { this.markFeatureUsed('hasUsedNotes'); }
  onShortcutsSeen() { this.markFeatureUsed('hasSeenShortcuts'); }
  onBookmarksUsed() { this.markFeatureUsed('hasUsedBookmarks'); }
  onProgressDashboardUsed() { this.markFeatureUsed('hasUsedProgressDashboard'); }
  onFrankensteinLabUsed() { this.markFeatureUsed('hasUsedFrankensteinLab'); }
  onBinauralAudioUsed() { this.markFeatureUsed('hasUsedBinauralAudio'); }
  onKoanGeneratorUsed() { this.markFeatureUsed('hasUsedKoanGenerator'); }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * 🔧 FIX #74: isMobile como getter dinámico que se actualiza con cambios de ventana
   */
  get isMobile() {
    return this.detectMobile();
  }

  /**
   * Detecta si estamos en un dispositivo móvil/tablet
   */
  detectMobile() {
    // Método 1: Detectar Capacitor (app nativa)
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      return true;
    }

    // Método 2: Detectar pantalla táctil y tamaño de pantalla
    const hasTouchScreen = ('ontouchstart' in window) ||
                           (navigator.maxTouchPoints > 0) ||
                           (navigator.msMaxTouchPoints > 0);
    const isSmallScreen = window.innerWidth <= 1024; // tablet y móvil

    return hasTouchScreen && isSmallScreen;
  }

  getChaptersRead() {
    try {
      if (window.bookEngine) {
        return window.bookEngine.getGlobalProgress().totalRead || 0;
      }
    } catch (e) {
      logger.debug('[ContextualHints] Error getting chapters read:', e);
    }
    return 0;
  }

  getBooksStarted() {
    try {
      if (window.bookEngine) {
        return window.bookEngine.getGlobalProgress().booksStarted || 0;
      }
    } catch (e) {
      logger.debug('[ContextualHints] Error getting books started:', e);
    }
    return 0;
  }

  getStreakDays() {
    try {
      if (window.streakSystem) {
        return window.streakSystem.getStreakStatus().currentStreak || 0;
      }
    } catch (e) {
      logger.debug('[ContextualHints] Error getting streak days:', e);
    }
    return 0;
  }

  /**
   * Resetea todos los datos (para testing)
   */
  reset() {
    localStorage.removeItem(this.storageKey);
    this.data = this.loadData();
    logger.debug('[ContextualHints] Data reset');
  }
}

// ============================================================================
// ESTILOS INLINE (se añaden al CSS principal también)
// ============================================================================

const hintStyles = document.createElement('style');
hintStyles.textContent = `
  .contextual-hint {
    position: fixed;
    bottom: 5rem;
    right: 1.5rem;
    max-width: 300px;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.98);
    border: 1px solid rgba(6, 182, 212, 0.4);
    border-radius: 0.75rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(6, 182, 212, 0.1);
    z-index: 1000;
    animation: hint-slide-in 0.3s ease-out;
    backdrop-filter: blur(10px);
  }

  @keyframes hint-slide-in {
    from {
      opacity: 0;
      transform: translateX(20px) translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateX(0) translateY(0);
    }
  }

  .contextual-hint.fade-out {
    animation: hint-fade-out 0.3s ease-out forwards;
  }

  @keyframes hint-fade-out {
    to {
      opacity: 0;
      transform: translateX(20px);
    }
  }

  .contextual-hint .close-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(71, 85, 105, 0.5);
    border: none;
    border-radius: 50%;
    color: #94a3b8;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .contextual-hint .close-btn:hover {
    background: rgba(239, 68, 68, 0.3);
    color: #fca5a5;
  }

  .contextual-hint .title {
    font-weight: 600;
    color: #e2e8f0;
    margin-bottom: 0.5rem;
    padding-right: 1.5rem;
  }

  .contextual-hint .content {
    font-size: 0.875rem;
    color: #94a3b8;
    line-height: 1.5;
  }

  .contextual-hint .content kbd {
    display: inline-block;
    padding: 0.125rem 0.375rem;
    font-size: 0.75rem;
    font-family: monospace;
    background: rgba(71, 85, 105, 0.5);
    border: 1px solid rgba(100, 116, 139, 0.5);
    border-radius: 0.25rem;
    color: #e2e8f0;
  }

  .contextual-hint .actions {
    margin-top: 0.75rem;
    display: flex;
    justify-content: flex-end;
  }

  .contextual-hint .got-it-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    background: rgba(6, 182, 212, 0.2);
    border: 1px solid rgba(6, 182, 212, 0.3);
    border-radius: 0.375rem;
    color: #67e8f9;
    cursor: pointer;
    transition: all 0.2s;
  }

  .contextual-hint .got-it-btn:hover {
    background: rgba(6, 182, 212, 0.3);
    border-color: rgba(6, 182, 212, 0.5);
  }

  @media (max-width: 640px) {
    .contextual-hint {
      left: 1rem;
      right: 1rem;
      max-width: none;
      bottom: 4.5rem;
    }
  }
`;
document.head.appendChild(hintStyles);

// ============================================================================
// EXPORTAR Y AUTO-INICIALIZAR
// ============================================================================

window.ContextualHints = ContextualHints;
window.contextualHints = new ContextualHints();

// 🔧 FIX #75: NO auto-invocar onPageVisit - llamar explícitamente desde app-initialization.js
// para tener mejor control del timing y evitar que se ejecute antes de que la app esté lista
// La invocación se hará desde app-initialization.js después de cargar todos los módulos
