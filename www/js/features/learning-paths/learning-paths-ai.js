// ============================================================================
// LEARNING PATHS AI - Generacion de paths con IA
// ============================================================================
// v2.9.390: Modularizado desde learning-paths.js

class LearningPathsAI {
  constructor(learningPaths) {
    this.learningPaths = learningPaths;
  }

  // ==========================================================================
  // GENERACION DE PATH PERSONALIZADO
  // ==========================================================================

  async generateCustomPath(goal) {
    const btn = document.getElementById('generate-custom-path');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="animate-pulse">🔄 Generando...</span>';
    }

    // Obtener recursos del libro actual
    const bookId = this.learningPaths.bookId;
    let resources = [];

    // Intentar cargar recursos del libro
    if (bookId) {
      try {
        const response = await fetch(`books/${bookId}/assets/resources.json`);
        if (response.ok) {
          const data = await response.json();
          Object.keys(data).forEach(key => {
            if (Array.isArray(data[key])) {
              resources = resources.concat(data[key]);
            }
          });
        }
      } catch (error) {
        // No hay recursos, continuamos con fallback
      }
    }

    let customPath = null;

    // Intentar con IA si esta disponible
    if (window.resourceAIHelper) {
      try {
        customPath = await window.resourceAIHelper.generateLearningPath(goal, resources, bookId);
      } catch (error) {
        logger.error('Error con IA, usando fallback:', error);
      }
    }

    // Fallback: generar path basico sin IA
    if (!customPath) {
      customPath = this.generateFallbackPath(goal);
    }

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Generar Path con IA';
    }

    if (customPath && customPath.steps && customPath.steps.length > 0) {
      // Mostrar preview en lugar de aplicar directamente
      this.learningPaths.aiPreviewPath = {
        id: 'custom-' + Date.now(),
        icon: '✨',
        title: customPath.goal || goal,
        description: 'Path personalizado para tu objetivo',
        duration: customPath.estimatedTime || '4-6 semanas',
        difficulty: customPath.difficulty || 'intermedio',
        steps: customPath.steps
      };

      this.learningPaths.ui.showAIPreview();
    } else {
      window.toast?.error('Error al generar path. Intenta de nuevo.');
    }
  }

  // ==========================================================================
  // CONFIRMAR PATH DE IA
  // ==========================================================================

  confirmAIPath() {
    if (!this.learningPaths.aiPreviewPath) return;

    this.learningPaths.currentPath = this.learningPaths.aiPreviewPath;
    this.learningPaths.aiPreviewPath = null;

    document.getElementById('ai-preview-modal')?.remove();

    this.learningPaths.ui.render();
    this.learningPaths.events.attachEventListeners();

    window.toast?.success('Path activado! Comienza tu recorrido.');
  }

  // ==========================================================================
  // REGENERAR PATH
  // ==========================================================================

  regeneratePath() {
    document.getElementById('ai-preview-modal')?.remove();
    this.learningPaths.aiPreviewPath = null;

    const goal = document.getElementById('custom-goal-input')?.value.trim();
    if (goal) {
      this.generateCustomPath(goal);
    }
  }

  // ==========================================================================
  // FALLBACK SIN IA
  // ==========================================================================

  generateFallbackPath(goal) {
    return {
      goal: goal,
      estimatedTime: '4-6 semanas',
      difficulty: 'intermedio',
      steps: [
        {
          title: 'Definir tu objetivo',
          description: 'Clarifica exactamente que quieres lograr',
          action: `Escribe en un papel: "${goal}" y desglosalo en 3 resultados especificos`,
          resources: ['Papel y boligrafo'],
          completionCriteria: 'Tienes 3 resultados medibles escritos'
        },
        {
          title: 'Investigar recursos',
          description: 'Encuentra materiales que te ayuden',
          action: 'Busca en la coleccion capitulos, practicas y recursos relacionados',
          resources: ['Biblioteca de Practicas', 'Recursos de los libros'],
          completionCriteria: 'Has identificado al menos 5 recursos relevantes'
        },
        {
          title: 'Plan de accion semanal',
          description: 'Crea un calendario de actividades',
          action: 'Distribuye los recursos y practicas en un plan de 4 semanas',
          resources: ['Calendario', 'Lista de recursos identificados'],
          completionCriteria: 'Tienes un plan escrito con actividades para cada semana'
        },
        {
          title: 'Primera semana de practica',
          description: 'Comienza a ejecutar tu plan',
          action: 'Sigue el plan de la primera semana y registra observaciones',
          resources: ['Tu plan de accion', 'Diario de practica'],
          completionCriteria: 'Has completado las actividades de la semana 1'
        },
        {
          title: 'Evaluacion y ajuste',
          description: 'Revisa tu progreso y ajusta el plan',
          action: 'Evalua que funciono, que no, y ajusta las proximas semanas',
          resources: ['Notas de la semana 1', 'Plan original'],
          completionCriteria: 'Tienes plan ajustado para las semanas siguientes'
        }
      ]
    };
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    // No hay recursos que limpiar en este modulo
  }
}

// Exportar globalmente
window.LearningPathsAI = LearningPathsAI;
