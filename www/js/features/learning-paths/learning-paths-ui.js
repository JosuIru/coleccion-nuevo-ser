// ============================================================================
// LEARNING PATHS UI - Renderizado de interfaz
// ============================================================================
// v2.9.390: Modularizado desde learning-paths.js

class LearningPathsUI {
  constructor(learningPaths) {
    this.learningPaths = learningPaths;
  }

  // ==========================================================================
  // RENDERIZADO PRINCIPAL
  // ==========================================================================

  render() {
    logger.debug('[LearningPaths] Inicio de render()');
    const existing = document.getElementById('learning-paths-modal');
    if (existing) {
      logger.debug('[LearningPaths] Removiendo modal existente');
      existing.remove();
    }

    logger.debug('[LearningPaths] bookId actual:', this.learningPaths.bookId);
    const html = `
      <div id="learning-paths-modal"
           class="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:p-4 transition-opacity duration-200">
        <div class="bg-gradient-to-br from-slate-900 to-purple-950 rounded-t-2xl md:rounded-2xl border border-purple-500/30 shadow-2xl max-w-5xl w-full max-h-[95vh] md:max-h-[90vh] overflow-hidden">

          <!-- Header - Compact on mobile -->
          <div class="bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-3 md:p-6 border-b border-purple-500/30">
            <div class="flex items-center justify-between">
              <div class="min-w-0 flex-1">
                <h2 class="text-lg md:text-2xl font-bold text-purple-300 flex items-center gap-2">
                  🎯 <span class="hidden sm:inline">Learning Paths</span><span class="sm:hidden">Paths</span>
                </h2>
                <p class="text-xs md:text-sm text-gray-400 mt-0.5 md:mt-1 truncate">Rutas segun tus objetivos</p>
              </div>
              <button id="close-paths" class="text-gray-400 hover:text-white transition p-2 flex-shrink-0">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Content - Smaller padding on mobile -->
          <div class="p-3 md:p-6 overflow-y-auto" style="max-height: calc(95vh - 80px)">
            ${this.learningPaths.currentPath ? this.renderActivePath() : this.renderGoalSelection()}
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    setTimeout(() => {
      document.getElementById('learning-paths-modal')?.classList.remove('opacity-0');
    }, 10);
  }

  // ==========================================================================
  // SELECCION DE OBJETIVO
  // ==========================================================================

  renderGoalSelection() {
    const paths = this.learningPaths.data.getPredefinedPaths(this.learningPaths.bookId);

    return `
      <div class="space-y-4 md:space-y-6">
        <div class="text-center mb-4 md:mb-8">
          <h3 class="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">Cual es tu objetivo?</h3>
          <p class="text-sm md:text-base text-gray-400">Selecciona un path o crea uno con IA</p>
        </div>

        ${paths.length === 0 ? `
          <div class="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 md:p-6 mb-4 md:mb-6">
            <h4 class="text-base md:text-lg font-bold text-yellow-300 mb-2">📚 Sin Learning Paths</h4>
            <p class="text-sm text-gray-300 mb-3 md:mb-4">Crea uno personalizado con IA o explora las practicas individuales.</p>
            <button id="open-practice-library-from-paths" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition font-semibold text-white text-sm md:text-base">
              🧘 Ver Practicas
            </button>
          </div>
        ` : ''}

        <!-- Practice Library Link (si hay paths) -->
        ${paths.length > 0 ? `
          <div class="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-xl p-3 md:p-4 mb-4 md:mb-6 border border-blue-700">
            <div class="flex items-center justify-between gap-2">
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-white text-sm md:text-base">🧘 Practicas individuales?</h4>
                <p class="text-xs md:text-sm text-gray-400 hidden sm:block">Explora sin seguir un path</p>
              </div>
              <button id="open-practice-library-from-paths" class="px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm md:text-base font-semibold rounded-lg transition whitespace-nowrap flex-shrink-0">
                Practicas
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Paths predefinidos - Stack on mobile -->
        ${paths.length > 0 ? `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          ${paths.map(path => `
            <button data-path-id="${path.id}" ${path.sourceBook ? `data-source-book="${path.sourceBook}"` : ''}
                    class="path-card text-left p-4 md:p-6 rounded-xl border-2 border-gray-700 hover:border-purple-500 hover:bg-purple-900/20 transition-all duration-200 active:scale-[0.98]">
              <div class="flex items-start gap-3 md:gap-4">
                <div class="text-3xl md:text-4xl flex-shrink-0">${path.icon}</div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-base md:text-lg font-bold text-white mb-1 line-clamp-2">${path.title}</h4>
                  ${path.sourceBook ? `<span class="text-xs text-blue-400 mb-1 inline-block">📚 ${this.learningPaths.data.getBookTitle(path.sourceBook)}</span>` : ''}
                  <p class="text-xs md:text-sm text-gray-400 mb-2 md:mb-3 line-clamp-2">${path.description}</p>
                  <div class="flex flex-wrap gap-1.5 md:gap-2 text-xs">
                    <span class="px-2 py-0.5 md:py-1 bg-purple-600/30 rounded">${path.duration}</span>
                    <span class="px-2 py-0.5 md:py-1 bg-pink-600/30 rounded">${path.difficulty}</span>
                    <span class="px-2 py-0.5 md:py-1 bg-indigo-600/30 rounded">${path.steps.length} pasos</span>
                  </div>
                </div>
              </div>
            </button>
          `).join('')}
        </div>
        ` : ''}

        <!-- Custom path con IA -->
        <div class="mt-4 md:mt-8 p-4 md:p-6 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-xl border border-indigo-500/30">
          <h4 class="text-base md:text-lg font-bold text-white mb-2 md:mb-3 flex items-center gap-2">
            🤖 Path Personalizado con IA
          </h4>
          <p class="text-xs md:text-sm text-gray-400 mb-3 md:mb-4">
            Describe tu objetivo y la IA creara un plan personalizado
          </p>
          <textarea id="custom-goal-input"
                    class="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm md:text-base resize-none focus:border-purple-500 focus:outline-none"
                    rows="2"
                    placeholder="Ej: Quiero iniciar una comunidad de transicion..."></textarea>
          <button id="generate-custom-path"
                  class="mt-3 w-full md:w-auto px-6 py-2.5 md:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition font-semibold text-sm md:text-base">
            Generar Path con IA
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // VISTA DE PATH ACTIVO
  // ==========================================================================

  renderActivePath() {
    const path = this.learningPaths.currentPath;
    const progress = this.learningPaths.userProgress[path.id] || { completedSteps: [] };
    const completedCount = progress.completedSteps.length;
    const totalSteps = path.steps.length;
    const percentage = Math.round((completedCount / totalSteps) * 100);

    return `
      <div class="space-y-4 md:space-y-6">
        <!-- Header del path - Compact on mobile -->
        <div class="bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-4 md:p-6 rounded-xl border border-purple-500/30">
          <div class="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3 md:mb-4">
            <div class="flex-1 min-w-0">
              <h3 class="text-xl md:text-2xl font-bold text-white flex items-center gap-2 flex-wrap">
                <span>${path.icon}</span> <span class="line-clamp-1">${path.title}</span>
              </h3>
              <p class="text-sm text-gray-400 mt-1 line-clamp-2">${path.description}</p>
            </div>
            <button id="back-to-selection" class="text-purple-400 hover:text-purple-300 text-xs md:text-sm whitespace-nowrap flex-shrink-0">
              Cambiar
            </button>
          </div>

          <!-- Progreso general -->
          <div class="mt-3 md:mt-4">
            <div class="flex justify-between text-xs md:text-sm text-gray-400 mb-1.5 md:mb-2">
              <span>Progreso</span>
              <span>${completedCount}/${totalSteps} (${percentage}%)</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2 md:h-3">
              <div class="bg-gradient-to-r from-purple-500 to-pink-500 h-2 md:h-3 rounded-full transition-all duration-300"
                   style="width: ${percentage}%"></div>
            </div>
          </div>

          <!-- Metadata -->
          <div class="flex gap-3 md:gap-4 mt-3 md:mt-4 text-xs md:text-sm">
            <span class="text-gray-400">⏱️ ${path.duration}</span>
            <span class="text-gray-400">📊 ${path.difficulty}</span>
          </div>
        </div>

        <!-- Pasos del path -->
        <div class="space-y-3 md:space-y-4">
          ${path.steps.map((step, index) => {
            const isCompleted = progress.completedSteps.includes(index);
            const isCurrent = !isCompleted && progress.completedSteps.length === index;

            return `
              <div class="step-card p-3 md:p-6 rounded-xl border-2 ${
                isCompleted ? 'border-green-500/50 bg-green-900/10' :
                isCurrent ? 'border-purple-500 bg-purple-900/20' :
                'border-gray-700 bg-gray-800/30'
              }">
                <div class="flex items-start gap-3 md:gap-4">
                  <!-- Indicador de paso -->
                  <div class="flex-shrink-0">
                    ${isCompleted ?
                      '<div class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm md:text-base">✓</div>' :
                      `<div class="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 ${isCurrent ? 'border-purple-500 bg-purple-500/20' : 'border-gray-600'} flex items-center justify-center text-gray-400 font-bold text-sm md:text-base">${index + 1}</div>`
                    }
                  </div>

                  <!-- Contenido del paso -->
                  <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap justify-between items-start gap-1 mb-1.5 md:mb-2">
                      <h4 class="text-base md:text-lg font-bold text-white">${step.title}</h4>
                      ${isCurrent ? '<span class="text-xs px-2 py-0.5 bg-purple-600 rounded-full text-white">Actual</span>' : ''}
                    </div>

                    <p class="text-gray-400 text-xs md:text-sm mb-2 md:mb-3">${step.description}</p>

                    <!-- Accion concreta -->
                    <div class="bg-indigo-900/30 p-2 md:p-3 rounded-lg mb-2 md:mb-3">
                      <p class="text-xs md:text-sm font-semibold text-indigo-300 mb-0.5 md:mb-1">🎯 Accion:</p>
                      <p class="text-xs md:text-sm text-gray-300">${step.action}</p>
                    </div>

                    <!-- Recursos - Collapsible on mobile -->
                    ${step.resources && step.resources.length > 0 ? `
                      <details class="mb-2 md:mb-3">
                        <summary class="text-xs font-semibold text-gray-500 cursor-pointer">📚 Recursos (${step.resources.length})</summary>
                        <div class="flex flex-wrap gap-1.5 mt-2">
                          ${step.resources.map(r => `
                            <span class="text-xs px-2 py-0.5 bg-gray-700 rounded">${r}</span>
                          `).join('')}
                        </div>
                      </details>
                    ` : ''}

                    <!-- Criterio de completitud -->
                    <details class="text-xs text-gray-500">
                      <summary class="cursor-pointer hover:text-gray-400">Como se que complete esto?</summary>
                      <p class="mt-2 text-gray-400">${step.completionCriteria}</p>
                    </details>

                    <!-- Boton de marcar completo -->
                    ${!isCompleted ? `
                      <button data-step-index="${index}"
                              class="mark-complete-btn mt-3 md:mt-4 w-full md:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition text-xs md:text-sm font-semibold">
                        ✓ Completado
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Acciones finales -->
        ${completedCount === totalSteps ? `
          <div class="bg-gradient-to-r from-green-900/30 to-emerald-900/30 p-4 md:p-6 rounded-xl border border-green-500/30 text-center">
            <div class="text-5xl md:text-6xl mb-2 md:mb-3">🎉</div>
            <h3 class="text-xl md:text-2xl font-bold text-white mb-2">Completado!</h3>
            <p class="text-sm text-gray-400 mb-3 md:mb-4">Has terminado este learning path</p>
            <div class="flex flex-col sm:flex-row gap-2 justify-center">
              <button id="reset-path" class="px-4 md:px-6 py-2.5 md:py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition text-sm md:text-base">
                🔄 Reiniciar
              </button>
              <button id="back-to-selection" class="px-4 md:px-6 py-2.5 md:py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm md:text-base">
                Otro Path
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ==========================================================================
  // PREVIEW DE PATH IA
  // ==========================================================================

  showAIPreview() {
    if (!this.learningPaths.aiPreviewPath) return;

    const path = this.learningPaths.aiPreviewPath;

    // Crear modal de preview
    document.getElementById('ai-preview-modal')?.remove();

    const previewModal = document.createElement('div');
    previewModal.id = 'ai-preview-modal';
    previewModal.className = 'fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4';
    previewModal.innerHTML = `
      <div class="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-purple-500/30">
        <!-- Header -->
        <div class="p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-purple-500/30">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold text-white flex items-center gap-2">
              🤖 Preview del Path IA
            </h3>
            <button onclick="document.getElementById('ai-preview-modal')?.remove()"
                    class="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white">
              ✕
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4">
          <!-- Path Info -->
          <div class="bg-purple-900/20 rounded-xl p-4 mb-4 border border-purple-500/20">
            <h4 class="text-lg font-bold text-white mb-2">${path.icon} ${path.title}</h4>
            <div class="flex gap-3 text-sm">
              <span class="text-purple-300">⏱️ ${path.duration}</span>
              <span class="text-pink-300">📊 ${path.difficulty}</span>
              <span class="text-indigo-300">📋 ${path.steps.length} pasos</span>
            </div>
          </div>

          <!-- Timeline visual de pasos -->
          <div class="relative">
            <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-pink-500"></div>

            ${path.steps.map((step, index) => `
              <div class="relative pl-10 pb-4">
                <div class="absolute left-2 w-5 h-5 rounded-full bg-purple-600 border-2 border-purple-400 flex items-center justify-center text-xs text-white font-bold">
                  ${index + 1}
                </div>
                <div class="bg-slate-800/50 rounded-lg p-3">
                  <h5 class="font-semibold text-white mb-1">${step.title}</h5>
                  <p class="text-sm text-gray-400 mb-2">${step.description}</p>
                  <p class="text-xs text-indigo-400">🎯 ${step.action.substring(0, 100)}${step.action.length > 100 ? '...' : ''}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Actions -->
        <div class="p-4 border-t border-gray-700 flex gap-3">
          <button onclick="window.learningPaths?.ai.confirmAIPath()"
                  class="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-white transition">
            ✅ Comenzar este Path
          </button>
          <button onclick="window.learningPaths?.ai.regeneratePath()"
                  class="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold text-white transition">
            🔄 Regenerar
          </button>
          <button onclick="document.getElementById('ai-preview-modal')?.remove()"
                  class="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 transition">
            Cancelar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(previewModal);
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    // No hay recursos que limpiar en este modulo
  }
}

// Exportar globalmente
window.LearningPathsUI = LearningPathsUI;
