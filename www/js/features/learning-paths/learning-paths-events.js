// ============================================================================
// LEARNING PATHS EVENTS - Manejadores de eventos
// ============================================================================
// v2.9.390: Modularizado desde learning-paths.js

class LearningPathsEvents {
  constructor(learningPaths) {
    this.learningPaths = learningPaths;
    this.handleEscape = null;
  }

  // ==========================================================================
  // ADJUNTAR EVENTOS
  // ==========================================================================

  attachEventListeners() {
    // Cerrar
    document.getElementById('close-paths')?.addEventListener('click', () => this.learningPaths.close());

    // Abrir Practice Library desde Learning Paths
    document.getElementById('open-practice-library-from-paths')?.addEventListener('click', () => {
      this.learningPaths.close();
      if (window.practiceLibrary) {
        // Establecer filtro del libro actual si esta disponible
        if (this.learningPaths.bookId) {
          window.practiceLibrary.filters.book = this.learningPaths.bookId;
        }
        // Usar metodo wrapper de biblioteca que actualiza tab activo
        if (window.biblioteca?.openPracticeLibrary) {
          window.biblioteca.openPracticeLibrary();
        } else {
          window.practiceLibrary.open();
        }
      } else {
        window.toast?.error('Biblioteca de Practicas no disponible');
      }
    });

    // Seleccionar path predefinido
    document.querySelectorAll('.path-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const pathId = e.currentTarget.dataset.pathId;
        const sourceBook = e.currentTarget.dataset.sourceBook || null;
        this.selectPath(pathId, sourceBook);
      });
    });

    // Generar path personalizado con IA
    document.getElementById('generate-custom-path')?.addEventListener('click', async () => {
      const goal = document.getElementById('custom-goal-input')?.value.trim();
      if (!goal) {
        window.toast?.info('Describe tu objetivo primero');
        return;
      }

      await this.learningPaths.ai.generateCustomPath(goal);
    });

    // Volver a seleccion
    document.querySelectorAll('#back-to-selection').forEach(btn => {
      btn.addEventListener('click', () => {
        this.learningPaths.currentPath = null;
        this.learningPaths.ui.render();
        this.attachEventListeners();
      });
    });

    // Marcar paso como completado
    document.querySelectorAll('.mark-complete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const stepIndex = parseInt(e.currentTarget.dataset.stepIndex);
        this.markStepComplete(stepIndex);
      });
    });

    // Reiniciar path
    document.getElementById('reset-path')?.addEventListener('click', () => {
      if (confirm('Seguro que quieres reiniciar este path?')) {
        delete this.learningPaths.userProgress[this.learningPaths.currentPath.id];
        this.learningPaths.data.saveProgress();
        this.learningPaths.ui.render();
        this.attachEventListeners();
      }
    });

    // ESC para cerrar
    document.addEventListener('keydown', this.handleEscape = (e) => {
      if (e.key === 'Escape' && this.learningPaths.isOpen) this.learningPaths.close();
    });
  }

  // ==========================================================================
  // ACCIONES
  // ==========================================================================

  selectPath(pathId, sourceBook = null) {
    const paths = this.learningPaths.data.getPredefinedPaths(this.learningPaths.bookId);
    this.learningPaths.currentPath = paths.find(p => p.id === pathId);

    // Si se especifico sourceBook, actualizar el bookId para operaciones futuras
    if (sourceBook) {
      this.learningPaths.bookId = sourceBook;
    }

    if (this.learningPaths.currentPath) {
      this.learningPaths.ui.render();
      this.attachEventListeners();
    }
  }

  markStepComplete(stepIndex) {
    if (!this.learningPaths.userProgress[this.learningPaths.currentPath.id]) {
      this.learningPaths.userProgress[this.learningPaths.currentPath.id] = { completedSteps: [] };
    }

    if (!this.learningPaths.userProgress[this.learningPaths.currentPath.id].completedSteps.includes(stepIndex)) {
      this.learningPaths.userProgress[this.learningPaths.currentPath.id].completedSteps.push(stepIndex);
      this.learningPaths.data.saveProgress();

      // Trackear achievement
      if (window.achievementSystem) {
        window.achievementSystem.trackLearningPathProgress(
          this.learningPaths.userProgress[this.learningPaths.currentPath.id].completedSteps.length,
          this.learningPaths.currentPath.steps.length
        );
      }

      this.learningPaths.ui.render();
      this.attachEventListeners();

      window.toast?.success('Paso completado!');
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  removeEscapeHandler() {
    if (this.handleEscape) {
      document.removeEventListener('keydown', this.handleEscape);
      this.handleEscape = null;
    }
  }

  destroy() {
    this.removeEscapeHandler();
  }
}

// Exportar globalmente
window.LearningPathsEvents = LearningPathsEvents;
