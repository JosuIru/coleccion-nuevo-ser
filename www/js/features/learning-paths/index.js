// ============================================================================
// LEARNING PATHS - Rutas de aprendizaje personalizadas (Coordinador)
// ============================================================================
// v2.9.390: Arquitectura modular
//
// Modulos:
//   - LearningPathsData   - Datos predefinidos y progreso
//   - LearningPathsUI     - Renderizado de interfaz
//   - LearningPathsEvents - Manejadores de eventos
//   - LearningPathsAI     - Generacion de paths con IA

class LearningPaths {
  constructor() {
    // Estado
    this.currentPath = null;
    this.isOpen = false;
    this.bookId = null;
    this.pendingTimer = null;
    this.aiPreviewPath = null;

    // Inicializar modulos
    this.data = new (window.LearningPathsData || LearningPathsData)(this);
    this.ui = new (window.LearningPathsUI || LearningPathsUI)(this);
    this.events = new (window.LearningPathsEvents || LearningPathsEvents)(this);
    this.ai = new (window.LearningPathsAI || LearningPathsAI)(this);

    // Cargar progreso
    this.userProgress = this.data.loadProgress();
  }

  // ==========================================================================
  // ABRIR MODAL
  // ==========================================================================

  open(bookId) {
    logger.debug('[LearningPaths] 🎯 Abriendo Learning Paths para libro:', bookId);
    try {
      this.isOpen = true;
      this.bookId = bookId;
      logger.debug('[LearningPaths] 📝 Renderizando modal...');
      this.ui.render();
      logger.debug('[LearningPaths] 🔗 Adjuntando event listeners...');

      // Esperar a que el DOM este listo antes de adjuntar listeners
      this.pendingTimer = setTimeout(() => {
        this.pendingTimer = null;
        this.events.attachEventListeners();
        logger.debug('[LearningPaths] ✅ Learning Paths abierto correctamente');
      }, 10);
    } catch (error) {
      logger.error('[LearningPaths] ❌ Error al abrir:', error);
    }
  }

  // ==========================================================================
  // CERRAR MODAL
  // ==========================================================================

  close() {
    // Clear pending timer to prevent memory leak
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }

    // Cleanup escape key handler
    this.events.removeEscapeHandler();

    const modal = document.getElementById('learning-paths-modal');
    if (modal) {
      modal.classList.add('opacity-0');
      setTimeout(() => {
        modal.remove();
        this.isOpen = false;
      }, 200);
    }
  }

  // ==========================================================================
  // METODOS DELEGADOS PARA COMPATIBILIDAD
  // ==========================================================================

  // Data
  loadProgress() {
    return this.data.loadProgress();
  }

  saveProgress() {
    return this.data.saveProgress();
  }

  getBookTitle(bookId) {
    return this.data.getBookTitle(bookId);
  }

  getPredefinedPaths(bookId) {
    return this.data.getPredefinedPaths(bookId);
  }

  // UI
  render() {
    return this.ui.render();
  }

  renderGoalSelection() {
    return this.ui.renderGoalSelection();
  }

  renderActivePath() {
    return this.ui.renderActivePath();
  }

  showAIPreview() {
    return this.ui.showAIPreview();
  }

  // Events
  attachEventListeners() {
    return this.events.attachEventListeners();
  }

  selectPath(pathId, sourceBook) {
    return this.events.selectPath(pathId, sourceBook);
  }

  markStepComplete(stepIndex) {
    return this.events.markStepComplete(stepIndex);
  }

  // AI
  generateCustomPath(goal) {
    return this.ai.generateCustomPath(goal);
  }

  confirmAIPath() {
    return this.ai.confirmAIPath();
  }

  regeneratePath() {
    return this.ai.regeneratePath();
  }

  generateFallbackPath(goal) {
    return this.ai.generateFallbackPath(goal);
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }

    this.data.destroy();
    this.ui.destroy();
    this.events.destroy();
    this.ai.destroy();

    if (window.learningPaths === this) {
      window.learningPaths = null;
    }

    logger.log('[LearningPaths] Destruido (v2.9.390 modular)');
  }
}

// ==========================================================================
// EXPORTAR
// ==========================================================================

window.LearningPaths = LearningPaths;
window.learningPaths = new LearningPaths();
