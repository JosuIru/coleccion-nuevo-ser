// ============================================================================
// LEARNING PATHS - Rutas de aprendizaje personalizadas
// v2.9.372: Mejoras visuales, preview de AI paths, timeline visual
// ============================================================================

class LearningPaths {
  constructor() {
    this.currentPath = null;
    this.isOpen = false;
    this.userProgress = this.loadProgress();
    this.pendingTimer = null;
    // v2.9.372: Estado de preview AI
    this.aiPreviewPath = null;
  }

  // ==========================================================================
  // DATOS Y PROGRESO
  // ==========================================================================

  loadProgress() {
    // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
    try {
      return JSON.parse(localStorage.getItem('learning-paths-progress') || '{}');
    } catch (error) {
      logger.error('Error cargando progreso de rutas de aprendizaje:', error);
      return {};
    }
  }

  saveProgress() {
    // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
    try {
      localStorage.setItem('learning-paths-progress', JSON.stringify(this.userProgress));
    } catch (error) {
      logger.error('Error guardando progreso de rutas de aprendizaje:', error);
      window.toast?.error('Error al guardar progreso. Intenta de nuevo.');
    }
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
      this.render();
      logger.debug('[LearningPaths] 🔗 Adjuntando event listeners...');

      // Esperar a que el DOM esté listo antes de adjuntar listeners
      // 🔧 FIX v2.9.268: Track timer to clear on close (prevent memory leak)
      this.pendingTimer = setTimeout(() => {
        this.pendingTimer = null;
        this.attachEventListeners();
        logger.debug('[LearningPaths] ✅ Learning Paths abierto correctamente');
      }, 10);
    } catch (error) {
      logger.error('[LearningPaths] ❌ Error al abrir:', error);
    }
  }

  close() {
    // 🔧 FIX v2.9.268: Clear pending timer to prevent memory leak
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
    // 🔧 FIX #32: Cleanup escape key handler to prevent memory leaks
    if (this.handleEscape) {
      document.removeEventListener('keydown', this.handleEscape);
      this.handleEscape = null;
    }
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
  // RENDERIZADO
  // ==========================================================================

  render() {
    logger.debug('[LearningPaths] 🎨 Inicio de render()');
    const existing = document.getElementById('learning-paths-modal');
    if (existing) {
      logger.debug('[LearningPaths] 🗑️ Removiendo modal existente');
      existing.remove();
    }

    logger.debug('[LearningPaths] 📚 bookId actual:', this.bookId);
    // 🔧 FIX v2.9.265: Mobile-friendly modal
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
                <p class="text-xs md:text-sm text-gray-400 mt-0.5 md:mt-1 truncate">Rutas según tus objetivos</p>
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
            ${this.currentPath ? this.renderActivePath() : this.renderGoalSelection()}
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    setTimeout(() => {
      document.getElementById('learning-paths-modal')?.classList.remove('opacity-0');
    }, 10);
  }

  // 🔧 FIX v2.9.265: Mobile-friendly goal selection
  renderGoalSelection() {
    const paths = this.getPredefinedPaths(this.bookId);

    return `
      <div class="space-y-4 md:space-y-6">
        <div class="text-center mb-4 md:mb-8">
          <h3 class="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">¿Cuál es tu objetivo?</h3>
          <p class="text-sm md:text-base text-gray-400">Selecciona un path o crea uno con IA</p>
        </div>

        ${paths.length === 0 ? `
          <div class="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 md:p-6 mb-4 md:mb-6">
            <h4 class="text-base md:text-lg font-bold text-yellow-300 mb-2">📚 Sin Learning Paths</h4>
            <p class="text-sm text-gray-300 mb-3 md:mb-4">Crea uno personalizado con IA o explora las prácticas individuales.</p>
            <button id="open-practice-library-from-paths" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition font-semibold text-white text-sm md:text-base">
              🧘 Ver Prácticas
            </button>
          </div>
        ` : ''}

        <!-- Practice Library Link (si hay paths) -->
        ${paths.length > 0 ? `
          <div class="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-xl p-3 md:p-4 mb-4 md:mb-6 border border-blue-700">
            <div class="flex items-center justify-between gap-2">
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-white text-sm md:text-base">🧘 ¿Prácticas individuales?</h4>
                <p class="text-xs md:text-sm text-gray-400 hidden sm:block">Explora sin seguir un path</p>
              </div>
              <button id="open-practice-library-from-paths" class="px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm md:text-base font-semibold rounded-lg transition whitespace-nowrap flex-shrink-0">
                Prácticas →
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
                  ${path.sourceBook ? `<span class="text-xs text-blue-400 mb-1 inline-block">📚 ${this.getBookTitle(path.sourceBook)}</span>` : ''}
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
            Describe tu objetivo y la IA creará un plan personalizado
          </p>
          <textarea id="custom-goal-input"
                    class="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm md:text-base resize-none focus:border-purple-500 focus:outline-none"
                    rows="2"
                    placeholder="Ej: Quiero iniciar una comunidad de transición..."></textarea>
          <button id="generate-custom-path"
                  class="mt-3 w-full md:w-auto px-6 py-2.5 md:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition font-semibold text-sm md:text-base">
            ✨ Generar Path con IA
          </button>
        </div>
      </div>
    `;
  }

  // 🔧 FIX v2.9.265: Mobile-friendly active path view
  renderActivePath() {
    const path = this.currentPath;
    const progress = this.userProgress[path.id] || { completedSteps: [] };
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
              ← Cambiar
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

                    <!-- Acción concreta -->
                    <div class="bg-indigo-900/30 p-2 md:p-3 rounded-lg mb-2 md:mb-3">
                      <p class="text-xs md:text-sm font-semibold text-indigo-300 mb-0.5 md:mb-1">🎯 Acción:</p>
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
                      <summary class="cursor-pointer hover:text-gray-400">¿Cómo sé que completé esto?</summary>
                      <p class="mt-2 text-gray-400">${step.completionCriteria}</p>
                    </details>

                    <!-- Botón de marcar completo -->
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
            <h3 class="text-xl md:text-2xl font-bold text-white mb-2">¡Completado!</h3>
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
  // HELPERS
  // ==========================================================================

  // 🔧 FIX v2.9.265: Helper para mostrar nombre de libro
  getBookTitle(bookId) {
    const bookTitles = {
      'tierra-que-despierta': 'Tierra que Despierta',
      'manual-transicion': 'Manual de Transición',
      'codigo-despertar': 'Código del Despertar',
      'guia-acciones': 'Guía de Acciones',
      'toolkit-transicion': 'Toolkit Transición',
      'manual-practico': 'Manual Práctico',
      'practicas-radicales': 'Prácticas Radicales',
      'manifiesto': 'Manifiesto',
      'filosofia-nuevo-ser': 'Filosofía Nuevo Ser',
      'dialogos-maquina': 'Diálogos con la Máquina',
      'ahora-instituciones': 'Ahora Instituciones'
    };
    return bookTitles[bookId] || bookId;
  }

  // ==========================================================================
  // PATHS PREDEFINIDOS
  // ==========================================================================

  getPredefinedPaths(bookId) {
    const pathsDatabase = {
      // ========================================================================
      // TIERRA QUE DESPIERTA - Deep Ecology & Reconnection
      // ========================================================================
      'tierra-que-despierta': [
        {
          id: 'procesar-duelo-ecologico',
          icon: '🌍',
          title: 'Procesar Duelo Ecológico',
          description: 'Atraviesa el dolor por la crisis ecológica de forma sana y transformadora',
          duration: '6-8 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Nombrar las Pérdidas',
              description: 'Identifica y reconoce las pérdidas ecológicas que has presenciado',
              action: 'Completa la práctica "Inventario de Pérdidas" (Cap 2) y comparte con una persona de confianza',
              resources: ['Cap 2: El Costo del Olvido', 'Práctica: Inventario de pérdidas'],
              completionCriteria: 'Has creado tu lista personal de pérdidas y la has compartido'
            },
            {
              title: 'Comprender la Solastalgia',
              description: 'Explora el dolor del lugar que cambia',
              action: 'Lee sobre solastalgia (Cap 2), identifica dónde la sientes en tu vida',
              resources: ['Glenn Albrecht: Solastalgia', 'Cap 2'],
              completionCriteria: 'Puedes nombrar tu propia experiencia de solastalgia'
            },
            {
              title: 'Ritual de Duelo Colectivo',
              description: 'Procesa el duelo en comunidad',
              action: 'Participa u organiza un círculo de duelo ecológico (Work That Reconnects)',
              resources: ['Joanna Macy: The Work That Reconnects', 'Guía de círculos'],
              completionCriteria: 'Has participado en al menos un ritual colectivo de duelo'
            },
            {
              title: 'De Duelo a Acción',
              description: 'Transforma el dolor en compromiso activo',
              action: 'Identifica una acción concreta que honre tu duelo y ejecútala',
              resources: ['Guía de Acciones Transformadoras', 'Ejemplos de acciones'],
              completionCriteria: 'Has completado tu acción y registrado cómo se sintió'
            }
          ]
        },
        {
          id: 'recordar-pertenencia',
          icon: '🌳',
          title: 'Recordar que Somos Tierra',
          description: 'Desaprender la separación y recordar la pertenencia fundamental',
          duration: '4-6 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Arqueología Personal',
              description: 'Explora tu propia historia de separación',
              action: 'Completa la práctica "Arqueología personal de la separación" (Cap 1)',
              resources: ['Cap 1: La Gran Separación', 'Cuaderno de prácticas'],
              completionCriteria: 'Has identificado cuándo aprendiste la separación'
            },
            {
              title: 'Un Día sin Mediación',
              description: 'Experimenta contacto directo con el mundo vivo',
              action: 'Dedica un día completo sin pantallas, al aire libre (Práctica Cap 3)',
              resources: ['Cap 3: La Anestesia Moderna', 'Guía de práctica'],
              completionCriteria: 'Has completado el día y registrado tus observaciones'
            },
            {
              title: 'Establecer Práctica de Lugar',
              description: 'Crea relación profunda con un lugar específico',
              action: 'Elige un lugar (árbol, río, monte) y visítalo semanalmente durante un mes',
              resources: ['Sit Spot practice', 'Nature awareness'],
              completionCriteria: 'Has visitado tu lugar 4 veces y notas cambios sutiles'
            },
            {
              title: 'Integración en Lo Cotidiano',
              description: 'Lleva la reconexión a tu vida diaria',
              action: 'Elige 3 prácticas pequeñas de reconexión y haz una diaria por 2 semanas',
              resources: ['Prácticas de reconexión', 'Tracking sheet'],
              completionCriteria: 'Has practicado durante 14 días consecutivos'
            }
          ]
        },
        {
          id: 'activismo-enraizado',
          icon: '🌱',
          title: 'Activismo desde Raíces Profundas',
          description: 'Actúa por el cambio sin quemarte, desde conexión profunda',
          duration: '8-10 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Identificar tus Dones',
              description: 'Descubre qué tienes para ofrecer al movimiento ecológico',
              action: 'Completa inventario de habilidades, pasiones y recursos disponibles',
              resources: ['Asset-based community development', 'Gifts inventory'],
              completionCriteria: 'Tienes lista clara de tus dones y cómo ofrecerlos'
            },
            {
              title: 'Encontrar tu Comunidad',
              description: 'Conecta con otros que comparten el compromiso',
              action: 'Investiga 5 iniciativas locales, visita 2, comprométete con 1',
              resources: ['Mapa de iniciativas', 'Guía de participación'],
              completionCriteria: 'Estás participando activamente en un colectivo'
            },
            {
              title: 'Prácticas de Sostenibilidad Personal',
              description: 'Cultiva prácticas que te permitan actuar a largo plazo',
              action: 'Establece rutina de autocuidado para activistas (meditación, naturaleza, comunidad)',
              resources: ['Activist burnout prevention', 'Self-care rituals'],
              completionCriteria: 'Tienes rutina semanal de renovación y la sigues 4 semanas'
            },
            {
              title: 'Tu Primera Campaña',
              description: 'Lidera o co-lidera una acción de impacto',
              action: 'Diseña y ejecuta una campaña local específica (ej: salvar un árbol, presión a ayuntamiento)',
              resources: ['Campaign planning toolkit', 'Casos de éxito'],
              completionCriteria: 'Has liderado una acción con resultados medibles'
            }
          ]
        }
      ],

      // ========================================================================
      // MANUAL DE TRANSICIÓN - Already implemented
      // ========================================================================
      'manual-transicion': [
        {
          id: 'iniciar-comunidad-transicion',
          icon: '🌱',
          title: 'Iniciar Comunidad de Transición',
          description: 'Crear y lanzar una iniciativa de transición en tu ciudad',
          duration: '8-12 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Fundamentos de la Transición',
              description: 'Comprende los principios básicos del movimiento de transición',
              action: 'Lee los primeros 3 capítulos del Manual y estudia 5 recursos clave sobre transición',
              resources: ['Transition Handbook', 'Post Carbon Institute', 'Resilience.org'],
              completionCriteria: 'Puedes explicar qué es la transición y por qué es necesaria'
            },
            {
              title: 'Reunir Grupo Inicial',
              description: 'Encuentra 5-10 personas interesadas en tu ciudad',
              action: 'Organiza 2 reuniones informales para presentar la idea y reclutar colaboradores',
              resources: ['Plantilla presentación', 'Guía de reclutamiento'],
              completionCriteria: 'Tienes al menos 5 personas comprometidas para formar el núcleo'
            },
            {
              title: 'Mapeo de Recursos Locales',
              description: 'Identifica recursos, habilidades y activos comunitarios',
              action: 'Realiza mapeo participativo con el grupo usando metodología Asset Mapping',
              resources: ['Asset Mapping Guide', 'Community Survey Template'],
              completionCriteria: 'Tienes mapa visual de recursos comunitarios (personas, lugares, organizaciones)'
            },
            {
              title: 'Primera Acción Visible',
              description: 'Lanza un proyecto piloto pequeño pero visible',
              action: 'Elige y ejecuta una acción concreta (huerto comunitario, repair café, etc.)',
              resources: ['Guía de primeros proyectos', 'Casos de éxito'],
              completionCriteria: 'Has realizado un evento/proyecto público que genera interés'
            }
          ]
        },
        {
          id: 'cooperativa-energetica',
          icon: '⚡',
          title: 'Crear Cooperativa Energética',
          description: 'Lanzar una cooperativa de energías renovables',
          duration: '12-16 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Investigación y Modelo',
              description: 'Estudia modelos de cooperativas energéticas exitosas',
              action: 'Analiza 3 casos de estudio (Som Energia, Ecopower, Brixton Energy)',
              resources: ['REScoop.eu', 'Casos de éxito'],
              completionCriteria: 'Comprendes modelos jurídicos, financieros y técnicos posibles'
            },
            {
              title: 'Grupo Promotor',
              description: 'Reúne equipo con habilidades complementarias',
              action: 'Reclutar: jurista, ingeniero energético, contador, comunicador',
              resources: [],
              completionCriteria: 'Grupo de 8-12 personas con habilidades diversas comprometido'
            },
            {
              title: 'Plan de Negocio',
              description: 'Desarrollar plan técnico y financiero viable',
              action: 'Crear business plan con proyecciones a 5 años',
              resources: ['Template business plan cooperativas', 'Asesoría legal'],
              completionCriteria: 'Plan de negocio validado por expertos'
            },
            {
              title: 'Constitución Legal',
              description: 'Formalizar la cooperativa jurídicamente',
              action: 'Registrar cooperativa, redactar estatutos, abrir cuenta bancaria',
              resources: ['Modelo estatutos', 'Asesoría jurídica'],
              completionCriteria: 'Cooperativa legalmente constituida y registrada'
            }
          ]
        },
        {
          id: 'resiliencia-local',
          icon: '🏘️',
          title: 'Construir Resiliencia Local',
          description: 'Fortalece la capacidad de tu comunidad para enfrentar disrupciones',
          duration: '10-12 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Evaluación de Vulnerabilidades',
              description: 'Identifica dependencias críticas de tu comunidad',
              action: 'Mapea: alimentos (¿de dónde vienen?), energía, agua, economía local',
              resources: ['Community resilience assessment', 'Vulnerability mapping'],
              completionCriteria: 'Tienes mapa de dependencias y puntos débiles'
            },
            {
              title: 'Sistemas Alimentarios Locales',
              description: 'Fortalece producción y distribución local de alimentos',
              action: 'Identifica productores locales, crea directorio, organiza mercado de proximidad',
              resources: ['Food systems mapping', 'CSA models'],
              completionCriteria: 'Has conectado productores locales con consumidores'
            },
            {
              title: 'Economía de Proximidad',
              description: 'Impulsa intercambios y monedas locales',
              action: 'Investiga bancos de tiempo o monedas locales, pilotea uno con tu grupo',
              resources: ['Timebanking guide', 'Local currencies'],
              completionCriteria: 'Has participado en al menos 5 intercambios en sistema alternativo'
            },
            {
              title: 'Red de Apoyo Mutuo',
              description: 'Crea estructuras de cuidado comunitario',
              action: 'Organiza red vecinal de apoyo (emergencias, cuidados, compartir herramientas)',
              resources: ['Mutual aid networks', 'Tool libraries'],
              completionCriteria: 'Red activa con al menos 20 vecinos participando'
            }
          ]
        }
      ],

      // ========================================================================
      // CÓDIGO DEL DESPERTAR - Already implemented
      // ========================================================================
      'codigo-despertar': [
        {
          id: 'profundizar-meditacion',
          icon: '🧘',
          title: 'Profundizar en Meditación',
          description: 'Establece práctica meditativa sólida y profundiza comprensión',
          duration: '8 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Fundamentos Teóricos',
              description: 'Comprende la base científica y contemplativa de la meditación',
              action: 'Lee capítulos 1-3 del Código del Despertar y 2 libros de recursos',
              resources: ['Mindfulness in Plain English', 'The Mind Illuminated'],
              completionCriteria: 'Entiendes qué es y qué no es la meditación'
            },
            {
              title: 'Establecer Práctica Diaria',
              description: 'Crea hábito de meditación regular',
              action: 'Medita 10 minutos diarios durante 21 días consecutivos',
              resources: ['Insight Timer app', 'Guided meditations'],
              completionCriteria: '21 días consecutivos de práctica registrada'
            },
            {
              title: 'Aumentar Duración',
              description: 'Profundiza sesiones de práctica',
              action: 'Incrementa a 20-30 minutos diarios durante 3 semanas',
              resources: ['Timer apps', 'Community support'],
              completionCriteria: '3 semanas de sesiones de 20-30 min'
            },
            {
              title: 'Retiro de Un Día',
              description: 'Experiencia de práctica intensiva',
              action: 'Realiza retiro personal de un día (8 horas de práctica)',
              resources: ['Guía de retiro personal', 'Centros de retiro'],
              completionCriteria: 'Has completado 1 día de retiro (puede ser en casa)'
            }
          ]
        },
        {
          id: 'integrar-ciencia-espiritualidad',
          icon: '🔬',
          title: 'Integrar Ciencia y Espiritualidad',
          description: 'Explora el puente entre conocimiento científico y experiencia contemplativa',
          duration: '6-8 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Neurociencia de la Meditación',
              description: 'Comprende qué ocurre en el cerebro durante la práctica',
              action: 'Lee Sección II del Código del Despertar sobre neurociencia contemplativa',
              resources: ['Altered Traits', 'The Neuroscience of Mindfulness'],
              completionCriteria: 'Puedes explicar 3 cambios cerebrales producidos por meditación'
            },
            {
              title: 'Física Cuántica y Conciencia',
              description: 'Explora la relación entre física moderna y experiencia subjetiva',
              action: 'Lee Sección III sobre física cuántica, reflexiona sobre implicaciones',
              resources: ['The Tao of Physics', 'Quantum Mind'],
              completionCriteria: 'Comprendes principales interpretaciones de mecánica cuántica'
            },
            {
              title: 'Experimentación Personal',
              description: 'Prueba las ideas mediante experiencia directa',
              action: 'Elige 3 experimentos contemplativos del libro y ejecútalos',
              resources: ['Prácticas del Código del Despertar', 'Journaling'],
              completionCriteria: 'Has completado 3 experimentos y documentado resultados'
            },
            {
              title: 'Diálogo con Otros',
              description: 'Comparte y discute estas integraciones',
              action: 'Organiza o únete a grupo de estudio sobre ciencia y contemplación',
              resources: ['Mind & Life Institute', 'Science and Nonduality'],
              completionCriteria: 'Has participado en al menos 3 conversaciones profundas'
            }
          ]
        }
      ],

      // ========================================================================
      // GUÍA DE ACCIONES TRANSFORMADORAS
      // ========================================================================
      'guia-acciones': [
        {
          id: 'primera-accion-transformadora',
          icon: '💪',
          title: 'Tu Primera Acción Transformadora',
          description: 'Identifica y ejecuta una acción de impacto en tu entorno',
          duration: '4-6 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Identificar el Punto de Apalancamiento',
              description: 'Encuentra dónde tu acción puede tener mayor impacto',
              action: 'Analiza tu esfera de influencia: trabajo, vecindario, familia, organizaciones',
              resources: ['Leverage points analysis', 'Sphere of influence'],
              completionCriteria: 'Has identificado 3 posibles puntos de intervención'
            },
            {
              title: 'Diseñar la Acción',
              description: 'Planifica una acción específica, medible y alcanzable',
              action: 'Usa metodología SMART para definir tu acción transformadora',
              resources: ['SMART goals', 'Action planning template'],
              completionCriteria: 'Tienes plan de acción claro con pasos concretos'
            },
            {
              title: 'Ejecutar con Presencia',
              description: 'Lleva a cabo la acción con atención plena',
              action: 'Implementa tu acción, registra el proceso y los obstáculos',
              resources: ['Action log', 'Reflection prompts'],
              completionCriteria: 'Has completado la acción y documentado aprendizajes'
            },
            {
              title: 'Evaluar e Iterar',
              description: 'Aprende de la experiencia y ajusta',
              action: 'Evalúa impacto, celebra logros, identifica qué mejorar para próxima acción',
              resources: ['Impact assessment', 'Iteration frameworks'],
              completionCriteria: 'Tienes evaluación escrita y plan para siguiente acción'
            }
          ]
        },
        {
          id: 'activismo-cotidiano',
          icon: '🌟',
          title: 'Activismo en lo Cotidiano',
          description: 'Transforma tus hábitos diarios en actos de resistencia y creación',
          duration: '6 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Auditoría de Hábitos',
              description: 'Examina tus prácticas diarias desde perspectiva de impacto',
              action: 'Registra durante 1 semana: consumo, desplazamientos, energía, residuos',
              resources: ['Habit audit worksheet', 'Carbon footprint calculator'],
              completionCriteria: 'Tienes registro detallado de una semana típica'
            },
            {
              title: 'Cambios de Alto Impacto',
              description: 'Identifica y ejecuta los cambios más significativos',
              action: 'Elige 3 cambios de alto impacto (ej: dieta, transporte, energía) e impleméntalos',
              resources: ['High-impact actions list', 'Behavior change guide'],
              completionCriteria: 'Has mantenido 3 nuevos hábitos durante 3 semanas'
            },
            {
              title: 'Contagiar por Ejemplo',
              description: 'Comparte tus cambios de forma que inspire a otros',
              action: 'Documenta tu proceso y comparte (blog, redes, conversaciones)',
              resources: ['Storytelling for change', 'Social media for activism'],
              completionCriteria: 'Has inspirado a al menos 2 personas a hacer cambios similares'
            }
          ]
        }
      ],

      // ========================================================================
      // TOOLKIT DE TRANSICIÓN
      // ========================================================================
      'toolkit-transicion': [
        {
          id: 'huerto-comunitario',
          icon: '🌻',
          title: 'Lanzar Huerto Comunitario',
          description: 'Crea espacio de cultivo colectivo en tu barrio',
          duration: '8-12 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Encontrar el Espacio',
              description: 'Identifica y consigue terreno disponible',
              action: 'Mapea espacios vacíos, negocia con ayuntamiento o propietarios',
              resources: ['Urban land access guide', 'Negotiation tips'],
              completionCriteria: 'Tienes acceso asegurado a terreno por al menos 1 año'
            },
            {
              title: 'Formar el Grupo',
              description: 'Reúne personas comprometidas con el proyecto',
              action: 'Organiza 2 reuniones abiertas, establece roles y compromisos',
              resources: ['Community organizing', 'Group dynamics'],
              completionCriteria: 'Grupo de 8-15 personas con roles definidos'
            },
            {
              title: 'Diseño Participativo',
              description: 'Co-diseña el espacio con el grupo',
              action: 'Taller de diseño usando principios de permacultura',
              resources: ['Permaculture design', 'Participatory design'],
              completionCriteria: 'Plano del huerto consensuado y dibujado'
            },
            {
              title: 'Primera Siembra',
              description: 'Lanza el huerto con celebración comunitaria',
              action: 'Evento público de inauguración y siembra colectiva',
              resources: ['Seasonal planting guide', 'Event organizing'],
              completionCriteria: 'Huerto inaugurado con primeras plantas en tierra'
            }
          ]
        },
        {
          id: 'repair-cafe',
          icon: '🔧',
          title: 'Organizar Repair Café',
          description: 'Crea espacio mensual de reparación comunitaria',
          duration: '6-8 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Reunir Reparadores',
              description: 'Encuentra personas con habilidades de reparación',
              action: 'Mapea habilidades en tu red: electrónica, textil, carpintería, bicicletas',
              resources: ['Skills inventory', 'Repair Café Foundation'],
              completionCriteria: 'Tienes al menos 4 reparadores comprometidos'
            },
            {
              title: 'Conseguir Espacio',
              description: 'Encuentra local apropiado para el evento',
              action: 'Negocia con centro cívico, biblioteca o espacio comunitario',
              resources: ['Space requirements', 'Partnership templates'],
              completionCriteria: 'Local confirmado para al menos 3 meses'
            },
            {
              title: 'Primer Evento',
              description: 'Lanza el Repair Café piloto',
              action: 'Organiza evento de 3 horas, documenta qué funciona y qué no',
              resources: ['Event checklist', 'Insurance info'],
              completionCriteria: 'Primer evento realizado con al menos 10 objetos reparados'
            },
            {
              title: 'Establecer Regularidad',
              description: 'Crea calendario mensual sostenible',
              action: 'Planifica próximos 3 meses, delega responsabilidades, crea sistema',
              resources: ['Sustainability planning', 'Volunteer management'],
              completionCriteria: 'Calendario publicado y equipo rotativo organizado'
            }
          ]
        }
      ],

      // ========================================================================
      // MANUAL PRÁCTICO
      // ========================================================================
      'manual-practico': [
        {
          id: 'rutina-practica-diaria',
          icon: '📿',
          title: 'Establecer Rutina de Práctica Diaria',
          description: 'Crea y mantén un sistema personal de prácticas transformadoras',
          duration: '6 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Auditoría de Tiempo',
              description: 'Comprende cómo usas tu tiempo actualmente',
              action: 'Registra tu día típico en bloques de 30 min durante 1 semana',
              resources: ['Time audit template', 'Time tracking apps'],
              completionCriteria: 'Tienes registro detallado de tu semana tipo'
            },
            {
              title: 'Diseñar tu Rutina',
              description: 'Crea secuencia personalizada de prácticas',
              action: 'Elige 3-5 prácticas del Manual, asigna horarios específicos',
              resources: ['Habit stacking', 'Morning/evening routines'],
              completionCriteria: 'Rutina diseñada con prácticas, horarios y duración'
            },
            {
              title: 'Primeras 3 Semanas',
              description: 'Establece el hábito con compromiso firme',
              action: 'Sigue tu rutina diariamente, usa tracker, ajusta si necesario',
              resources: ['Habit tracker', 'Accountability partner'],
              completionCriteria: '21 días consecutivos completados (mínimo 80%)'
            },
            {
              title: 'Consolidación',
              description: 'Refina y profundiza la práctica',
              action: 'Continúa 3 semanas más, ajusta según aprendizajes',
              resources: ['Practice refinement', 'Deepening techniques'],
              completionCriteria: '42 días totales, rutina integrada en vida diaria'
            }
          ]
        },
        {
          id: 'dominar-tecnica-central',
          icon: '🎯',
          title: 'Dominar una Técnica Central',
          description: 'Profundiza en UNA práctica hasta alcanzar maestría básica',
          duration: '12 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Elegir la Práctica',
              description: 'Selecciona UNA técnica que resuene profundamente',
              action: 'Explora 5-7 prácticas del Manual, elige 1 para dedicarte por completo',
              resources: ['Practice descriptions', 'Selection criteria'],
              completionCriteria: 'Has elegido una práctica y sabes por qué'
            },
            {
              title: 'Fase Intensiva',
              description: 'Practica diariamente durante 6 semanas',
              action: 'Dedica 30-60 min diarios a tu práctica, lleva diario detallado',
              resources: ['Practice journal', 'Progress markers'],
              completionCriteria: '42 días de práctica continua documentada'
            },
            {
              title: 'Estudio Profundo',
              description: 'Estudia la tradición y teoría detrás de la práctica',
              action: 'Lee 2-3 libros especializados, busca maestros o comunidad',
              resources: ['Recommended readings', 'Teacher directory'],
              completionCriteria: 'Has completado estudio teórico y conectado con comunidad'
            },
            {
              title: 'Transmisión',
              description: 'Comparte la práctica con otros',
              action: 'Enseña la técnica a 3 personas o guía sesión grupal',
              resources: ['Teaching basics', 'Group facilitation'],
              completionCriteria: 'Has transmitido la práctica exitosamente'
            }
          ]
        }
      ],

      // ========================================================================
      // PRÁCTICAS RADICALES
      // ========================================================================
      'practicas-radicales': [
        {
          id: 'simplicidad-voluntaria',
          icon: '🍃',
          title: 'Camino hacia Simplicidad Voluntaria',
          description: 'Reduce complejidad y consumo, aumenta libertad y claridad',
          duration: '10-12 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Auditoría de Posesiones',
              description: 'Examina todo lo que posees',
              action: 'Inventario completo de objetos, evalúa qué usas vs qué acumulas',
              resources: ['Minimalism guide', 'KonMari method'],
              completionCriteria: 'Lista completa de posesiones con evaluación de uso'
            },
            {
              title: 'Liberación Material',
              description: 'Desprende del 50% de tus posesiones',
              action: 'Dona, regala o vende la mitad de lo que no usas regularmente',
              resources: ['Decluttering strategies', 'Donation centers'],
              completionCriteria: 'Has reducido posesiones significativamente'
            },
            {
              title: 'Dieta de Consumo',
              description: 'Reduce compras a lo esencial durante 3 meses',
              action: 'Compra solo necesidades básicas, registra cada compra y su justificación',
              resources: ['Buy nothing challenge', 'Consumption tracker'],
              completionCriteria: '12 semanas con consumo reducido al mínimo'
            },
            {
              title: 'Nuevo Estilo de Vida',
              description: 'Integra simplicidad como filosofía permanente',
              action: 'Define tus principios de simplicidad, comparte con comunidad',
              resources: ['Voluntary simplicity', 'Simple living communities'],
              completionCriteria: 'Manifesto personal escrito y compartido'
            }
          ]
        },
        {
          id: 'desobediencia-creativa',
          icon: '🎨',
          title: 'Arte como Desobediencia Creativa',
          description: 'Usa creatividad para cuestionar y transformar lo establecido',
          duration: '8 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Identificar el Mensaje',
              description: 'Define qué quieres comunicar o confrontar',
              action: 'Elige una injusticia o absurdo que te indigna, articula tu crítica',
              resources: ['Culture jamming', 'Activist art examples'],
              completionCriteria: 'Mensaje claro y contundente formulado'
            },
            {
              title: 'Experimentación Artística',
              description: 'Prueba diferentes medios y formatos',
              action: 'Crea 3 prototipos en formatos diferentes (graffiti, performance, video, etc.)',
              resources: ['DIY art techniques', 'Guerrilla art'],
              completionCriteria: 'Tres propuestas creativas desarrolladas'
            },
            {
              title: 'Intervención Pública',
              description: 'Lleva tu arte al espacio público',
              action: 'Ejecuta intervención en lugar estratégico, documenta reacciones',
              resources: ['Public art permits', 'Documentation strategies'],
              completionCriteria: 'Intervención realizada y documentada'
            },
            {
              title: 'Viralización y Seguimiento',
              description: 'Amplifica el impacto de tu acción',
              action: 'Comparte documentación, invita a otros a replicar, evalúa impacto',
              resources: ['Social media strategy', 'Impact metrics'],
              completionCriteria: 'Al menos 3 personas inspiradas a crear su propia intervención'
            }
          ]
        }
      ],

      // ========================================================================
      // MANIFIESTO DE LA CONCIENCIA COMPARTIDA
      // ========================================================================
      'manifiesto': [
        {
          id: 'escribir-tu-manifiesto',
          icon: '📜',
          title: 'Escribe tu Propio Manifiesto',
          description: 'Articula tu visión personal de transformación',
          duration: '4-6 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Clarificar Valores',
              description: 'Identifica tus principios fundamentales',
              action: 'Lista 10 valores esenciales, prioriza los 5 más importantes',
              resources: ['Values clarification', 'Priority matrix'],
              completionCriteria: 'Tienes lista clara de 5 valores priorizados'
            },
            {
              title: 'Visión de Futuro',
              description: 'Imagina el mundo que quieres co-crear',
              action: 'Escribe descripción detallada del futuro que deseas (500 palabras)',
              resources: ['Visioning exercises', 'Future scenarios'],
              completionCriteria: 'Visión de futuro articulada por escrito'
            },
            {
              title: 'Redactar Borrador',
              description: 'Escribe primera versión de tu manifiesto',
              action: 'Combina valores + visión + compromisos concretos (1-2 páginas)',
              resources: ['Manifesto examples', 'Writing guide'],
              completionCriteria: 'Borrador completo de manifiesto personal'
            },
            {
              title: 'Compartir y Comprometerse',
              description: 'Declara públicamente tu manifiesto',
              action: 'Comparte con 5 personas, firma y fecha, revisa anualmente',
              resources: ['Public commitment', 'Accountability structures'],
              completionCriteria: 'Manifiesto compartido y firmado'
            }
          ]
        },
        {
          id: 'circulo-consciencia-compartida',
          icon: '⭕',
          title: 'Círculo de Conciencia Compartida',
          description: 'Crea grupo de práctica y apoyo mutuo',
          duration: '8-12 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Reunir el Círculo',
              description: 'Encuentra 4-8 personas comprometidas',
              action: 'Invita a personas afines, haz reunión inicial de intenciones',
              resources: ['Circle guidelines', 'Invitation templates'],
              completionCriteria: 'Grupo de 4-8 personas comprometido a reunirse regularmente'
            },
            {
              title: 'Establecer Estructura',
              description: 'Define formato y compromisos del círculo',
              action: 'Acuerda: frecuencia, duración, formato, roles rotativos',
              resources: ['Circle formats', 'Facilitation guides'],
              completionCriteria: 'Acuerdos claros documentados y aceptados'
            },
            {
              title: 'Primeras 6 Sesiones',
              description: 'Establece ritmo y profundiza conexión',
              action: 'Reúnanse 6 veces siguiendo formato acordado',
              resources: ['Session plans', 'Check-in prompts'],
              completionCriteria: '6 reuniones completadas con asistencia regular'
            },
            {
              title: 'Acción Colectiva',
              description: 'Del círculo a la acción en el mundo',
              action: 'El grupo identifica y ejecuta una acción transformadora conjunta',
              resources: ['Collective action', 'Group decision-making'],
              completionCriteria: 'Acción colectiva planificada y ejecutada'
            }
          ]
        }
      ],

      // ========================================================================
      // FILOSOFÍA DEL NUEVO SER
      // ========================================================================
      'filosofia-nuevo-ser': [
        {
          id: 'desarrollar-pensamiento-filosofico',
          icon: '🧠',
          title: 'Desarrollar Pensamiento Filosófico',
          description: 'Cultiva capacidad de reflexión profunda y cuestionamiento radical',
          duration: '8 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Lectura Filosófica Activa',
              description: 'Aprende a leer filosofía de forma participativa',
              action: 'Lee 3 capítulos del libro, toma notas marginales, formula 5 preguntas por capítulo',
              resources: ['Guía de lectura filosófica', 'Note-taking methods'],
              completionCriteria: 'Has leído 3 capítulos con anotaciones y preguntas formuladas'
            },
            {
              title: 'Diálogo Socrático',
              description: 'Practica el arte de preguntar y responder',
              action: 'Organiza 3 conversaciones filosóficas con amigos usando método socrático',
              resources: ['Socratic method', 'Dialogue guidelines'],
              completionCriteria: 'Has facilitado 3 diálogos socráticos'
            },
            {
              title: 'Escritura Reflexiva',
              description: 'Articula tu propio pensamiento filosófico',
              action: 'Escribe 3 ensayos cortos (500 palabras) sobre preguntas filosóficas que te inquietan',
              resources: ['Philosophical writing', 'Essay structure'],
              completionCriteria: 'Has escrito y revisado 3 ensayos filosóficos'
            },
            {
              title: 'Integración Vital',
              description: 'Conecta filosofía con tu vida concreta',
              action: 'Identifica 1 idea filosófica del libro y experimenta vivirla durante 2 semanas',
              resources: ['Filosofía como forma de vida', 'Experimentos existenciales'],
              completionCriteria: 'Has vivido conscientemente según una idea filosófica y documentado el proceso'
            }
          ]
        },
        {
          id: 'ontologia-participativa',
          icon: '🌀',
          title: 'Ontología Participativa',
          description: 'Explora una visión del ser donde observador y observado co-surgen',
          duration: '6-8 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Fenomenología Personal',
              description: 'Observa cómo tu experiencia co-crea la realidad',
              action: 'Práctica diaria: 20 min de observación fenomenológica (sin interpretar, solo notar)',
              resources: ['Husserl: Ideas', 'Phenomenology guide'],
              completionCriteria: '21 días de práctica fenomenológica documentada'
            },
            {
              title: 'Experimentos de Co-surgimiento',
              description: 'Prueba empíricamente la no-dualidad',
              action: 'Realiza 5 experimentos del libro sobre percepción participativa',
              resources: ['Experimentos del libro', 'Varela: The Embodied Mind'],
              completionCriteria: 'Has completado 5 experimentos con resultados documentados'
            },
            {
              title: 'Diálogo con Tradiciones',
              description: 'Estudia ontologías no-occidentales',
              action: 'Lee sobre 3 ontologías indígenas o no-dualistas (budismo, taoísmo, andina)',
              resources: ['Indigenous ontologies', 'Comparative philosophy'],
              completionCriteria: 'Has estudiado 3 tradiciones y escrito comparaciones'
            },
            {
              title: 'Nueva Narrativa Personal',
              description: 'Reescribe tu historia desde ontología participativa',
              action: 'Escribe autobiografía de 1000 palabras desde perspectiva no-dual',
              resources: ['Narrative identity', 'Post-egoic writing'],
              completionCriteria: 'Autobiografía participativa escrita y compartida'
            }
          ]
        },
        {
          id: 'etica-relacional',
          icon: '🤝',
          title: 'Ética Relacional',
          description: 'Desarrolla ética basada en interdependencia, no en individuos aislados',
          duration: '6 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Mapeo de Interdependencias',
              description: 'Visualiza tu red de relaciones y dependencias',
              action: 'Crea mapa visual de todas tus interdependencias (humanas, ecológicas, tecnológicas)',
              resources: ['Systems mapping', 'Interdependence analysis'],
              completionCriteria: 'Mapa completo de interdependencias con al menos 50 nodos'
            },
            {
              title: 'Dilemas Éticos Relacionales',
              description: 'Analiza situaciones desde perspectiva relacional',
              action: 'Toma 3 dilemas éticos del libro, resuélvelos desde ética relacional vs individualista',
              resources: ['Care ethics', 'Ubuntu philosophy'],
              completionCriteria: 'Has analizado 3 dilemas con ambos marcos y comparado'
            },
            {
              title: 'Prácticas de Cuidado Mutuo',
              description: 'Implementa ética relacional en lo cotidiano',
              action: 'Establece 3 prácticas de cuidado mutuo con personas de tu red',
              resources: ['Mutual aid practices', 'Care collectives'],
              completionCriteria: '3 prácticas de cuidado activas durante 4 semanas'
            },
            {
              title: 'Ensayo sobre Responsabilidad',
              description: 'Articula tu comprensión de responsabilidad relacional',
              action: 'Escribe ensayo: "¿De qué soy responsable desde una ética relacional?"',
              resources: ['Relational responsibility', 'Ethics of care'],
              completionCriteria: 'Ensayo de 1000 palabras escrito y revisado'
            }
          ]
        }
      ],

      // ========================================================================
      // DIÁLOGOS CON LA MÁQUINA
      // ========================================================================
      'dialogos-maquina': [
        {
          id: 'dialogar-con-ia',
          icon: '🤖',
          title: 'Arte del Diálogo con IA',
          description: 'Aprende a dialogar profundamente con inteligencias artificiales',
          duration: '4-6 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Primeros Diálogos',
              description: 'Establece práctica regular de conversación con IA',
              action: 'Mantén 7 conversaciones diarias con IA (diferentes temas, niveles de profundidad)',
              resources: ['Claude', 'ChatGPT', 'Prompt engineering basics'],
              completionCriteria: '7 días de diálogos documentados con reflexiones'
            },
            {
              title: 'Preguntas Poderosas',
              description: 'Aprende a formular preguntas que generan insight',
              action: 'Practica 5 tipos de preguntas del libro (fenomenológicas, paradójicas, generativas, etc.)',
              resources: ['Question taxonomy', 'Art of questioning'],
              completionCriteria: 'Has practicado cada tipo y documentado diferencias en respuestas'
            },
            {
              title: 'Meta-Diálogo',
              description: 'Reflexiona sobre el propio proceso de diálogo',
              action: 'Conversa con IA sobre la naturaleza del diálogo humano-IA que estás teniendo',
              resources: ['Metacognition', 'Recursive dialogue'],
              completionCriteria: 'Has tenido 3 conversaciones meta-dialógicas profundas'
            },
            {
              title: 'Proyecto Colaborativo',
              description: 'Co-crea algo significativo con IA',
              action: 'Elige un proyecto (ensayo, poema, código, etc.) y créalo en colaboración con IA',
              resources: ['Co-creation methods', 'Human-AI collaboration'],
              completionCriteria: 'Proyecto completado y reflexión sobre el proceso de colaboración'
            }
          ]
        },
        {
          id: 'filosofia-ia',
          icon: '💭',
          title: 'Filosofía de la Inteligencia Artificial',
          description: 'Explora preguntas filosóficas sobre IA, conciencia y cognición',
          duration: '8 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Lecturas Fundamentales',
              description: 'Estudia filosofía de la mente y computación',
              action: 'Lee 4 textos clave: Turing, Searle, Dennett, y un capítulo del libro',
              resources: ['Turing Test', 'Chinese Room', 'Consciousness Explained'],
              completionCriteria: 'Has leído los 4 textos y escrito resúmenes críticos'
            },
            {
              title: 'Experimentos Mentales',
              description: 'Trabaja con los thought experiments clásicos',
              action: 'Analiza 5 experimentos mentales sobre IA y formula tu posición en cada uno',
              resources: ['Thought experiments in AI', 'Philosophy of mind'],
              completionCriteria: 'Análisis escrito de 5 experimentos con tu posición argumentada'
            },
            {
              title: 'Diálogos Filosóficos con IA',
              description: 'Explora estas preguntas directamente con IA',
              action: 'Conversa con IA sobre: ¿Eres consciente? ¿Comprendes? ¿Qué significa entender?',
              resources: ['Diálogos del libro', 'Phenomenology of AI'],
              completionCriteria: '5 conversaciones filosóficas profundas documentadas'
            },
            {
              title: 'Ensayo Final',
              description: 'Articula tu filosofía de la IA',
              action: 'Escribe ensayo de 2000 palabras sobre tu posición respecto a mente/IA',
              resources: ['Philosophical writing', 'Argumentación'],
              completionCriteria: 'Ensayo completo, revisado, compartido con comunidad'
            }
          ]
        },
        {
          id: 'etica-ia',
          icon: '⚖️',
          title: 'Ética de la Inteligencia Artificial',
          description: 'Desarrolla criterio ético para creación y uso de IA',
          duration: '6 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Casos de Estudio',
              description: 'Analiza dilemas éticos reales de IA',
              action: 'Estudia 5 casos: sesgo algorítmico, deepfakes, vigilancia, automatización laboral, IA militar',
              resources: ['AI ethics cases', 'IEEE ethics guidelines'],
              completionCriteria: 'Has analizado 5 casos y propuesto marcos de evaluación'
            },
            {
              title: 'Marcos Éticos Comparados',
              description: 'Estudia diferentes enfoques de ética IA',
              action: 'Compara: utilitarismo, deontología, ética del cuidado, ética indígena aplicados a IA',
              resources: ['Ethics frameworks', 'Comparative ethics'],
              completionCriteria: 'Matriz comparativa de 4 marcos éticos aplicados a IA'
            },
            {
              title: 'Auditoría Personal',
              description: 'Examina tu propio uso de IA',
              action: 'Registra durante 2 semanas: qué IA usas, para qué, con qué consecuencias',
              resources: ['Digital ethics', 'Personal audit tools'],
              completionCriteria: 'Auditoría completa con análisis ético de tus usos'
            },
            {
              title: 'Manifiesto Ético Personal',
              description: 'Define tus principios para relacionarte con IA',
              action: 'Escribe tu código ético personal para uso y desarrollo de IA',
              resources: ['Ethical codes', 'Personal manifestos'],
              completionCriteria: 'Manifiesto ético escrito, firmado, compartido'
            }
          ]
        }
      ],

      // ========================================================================
      // PEDAGOGÍA DEL DESPERTAR
      // ========================================================================
      'pedagogia-despertar': [
        {
          id: 'educacion-transformadora',
          icon: '🎓',
          title: 'Educación Transformadora',
          description: 'Diseña e implementa experiencias educativas que despiertan',
          duration: '10-12 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Estudiar Pedagogías Críticas',
              description: 'Comprende teorías de educación liberadora',
              action: 'Lee: Paulo Freire, bell hooks, Ivan Illich, y capítulos clave del libro',
              resources: ['Pedagogía del Oprimido', 'Teaching to Transgress'],
              completionCriteria: 'Has leído 4 textos y escrito síntesis comparativa'
            },
            {
              title: 'Diseño de Experiencia',
              description: 'Crea una experiencia educativa transformadora',
              action: 'Diseña taller/curso de 4 sesiones usando principios del libro',
              resources: ['Workshop design', 'Transformative learning'],
              completionCriteria: 'Currículo completo con objetivos, métodos, evaluación'
            },
            {
              title: 'Piloto y Iteración',
              description: 'Implementa tu diseño con grupo real',
              action: 'Facilita las 4 sesiones, recoge feedback, ajusta',
              resources: ['Facilitation skills', 'Feedback methods'],
              completionCriteria: '4 sesiones completadas con evaluación de participantes'
            },
            {
              title: 'Documentación y Compartir',
              description: 'Sistematiza aprendizajes para que otros los usen',
              action: 'Crea guía descargable de tu experiencia educativa',
              resources: ['Educational resources', 'Open pedagogy'],
              completionCriteria: 'Guía publicada y compartida con comunidad educativa'
            }
          ]
        },
        {
          id: 'aprender-a-aprender',
          icon: '🧩',
          title: 'Aprender a Aprender',
          description: 'Domina metacognición y auto-dirección en el aprendizaje',
          duration: '8 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Auditoría de Aprendizaje',
              description: 'Comprende cómo aprendes actualmente',
              action: 'Registra durante 2 semanas: qué aprendes, cómo, qué funciona, qué no',
              resources: ['Learning styles', 'Metacognition tools'],
              completionCriteria: 'Perfil completo de tu proceso de aprendizaje actual'
            },
            {
              title: 'Experimentos de Método',
              description: 'Prueba diferentes estrategias de aprendizaje',
              action: 'Elige un tema, apréndelo con 5 métodos diferentes (Feynman, spaced repetition, etc.)',
              resources: ['Learning techniques', 'Study methods'],
              completionCriteria: 'Has probado 5 métodos y evaluado efectividad de cada uno'
            },
            {
              title: 'Sistema Personal',
              description: 'Diseña tu sistema de aprendizaje óptimo',
              action: 'Crea tu "manual de aprendizaje" personalizado con mejores prácticas',
              resources: ['Personal knowledge management', 'Learning systems'],
              completionCriteria: 'Manual escrito con tu sistema personalizado'
            },
            {
              title: 'Proyecto de Dominio',
              description: 'Aplica tu sistema a aprender algo nuevo',
              action: 'Elige habilidad nueva y apréndela durante 4 semanas usando tu sistema',
              resources: ['Skill acquisition', 'Deliberate practice'],
              completionCriteria: 'Habilidad adquirida con documentación del proceso'
            }
          ]
        },
        {
          id: 'comunidades-aprendizaje',
          icon: '👥',
          title: 'Comunidades de Aprendizaje',
          description: 'Crea espacios colectivos de aprendizaje transformador',
          duration: '12 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Investigación y Modelos',
              description: 'Estudia comunidades de aprendizaje existentes',
              action: 'Investiga 5 modelos: circles of trust, study circles, learning cooperatives',
              resources: ['Community learning models', 'Peer learning'],
              completionCriteria: 'Has estudiado 5 modelos y extraído principios clave'
            },
            {
              title: 'Convocar Comunidad',
              description: 'Reúne grupo comprometido con aprendizaje colectivo',
              action: 'Invita 6-12 personas, haz sesión de intenciones y acuerdos',
              resources: ['Community organizing', 'Group agreements'],
              completionCriteria: 'Grupo de 6-12 personas con acuerdos claros'
            },
            {
              title: 'Ciclo de 8 Sesiones',
              description: 'Facilita proceso de aprendizaje colectivo',
              action: 'Reúnanse 8 veces, rota facilitación, documenta aprendizajes',
              resources: ['Facilitation guides', 'Collective learning'],
              completionCriteria: '8 sesiones completadas con documentación'
            },
            {
              title: 'Cosecha y Siguiente Ciclo',
              description: 'Sistematiza lo aprendido y planea continuidad',
              action: 'Sesión de cosecha, evalúa proceso, decide si continúa y cómo',
              resources: ['Harvest methods', 'Sustainability planning'],
              completionCriteria: 'Documento de aprendizajes y plan para siguiente ciclo'
            }
          ]
        }
      ],

      // ========================================================================
      // ECOLOGÍA PROFUNDA
      // ========================================================================
      'ecologia-profunda': [
        {
          id: 'inmersion-naturaleza',
          icon: '🌲',
          title: 'Inmersión en Naturaleza',
          description: 'Desarrolla conexión profunda con el mundo natural',
          duration: '8 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Sit Spot Diario',
              description: 'Establece lugar de observación regular en naturaleza',
              action: 'Elige un lugar natural, visítalo 20 min diarios durante 3 semanas',
              resources: ['Sit spot practice', 'Nature awareness'],
              completionCriteria: '21 días de práctica con diario de observaciones'
            },
            {
              title: 'Estudio de Lugar',
              description: 'Conoce profundamente un ecosistema local',
              action: 'Estudia ecosistema cercano: especies, relaciones, ciclos, historia',
              resources: ['Field guides', 'Local ecology'],
              completionCriteria: 'Monografía de 1000 palabras sobre tu ecosistema local'
            },
            {
              title: 'Rastreo y Señales',
              description: 'Aprende a leer huellas y señales de fauna',
              action: 'Practica identificación de huellas, excrementos, marcas territoriales',
              resources: ['Animal tracking', 'Field guides'],
              completionCriteria: 'Has identificado 10 especies por sus señales'
            },
            {
              title: 'Solo en Naturaleza',
              description: 'Experiencia de soledad en naturaleza (24h)',
              action: 'Pasa 24 horas solo en naturaleza, ayuno opcional, diario de experiencia',
              resources: ['Vision quest', 'Wilderness solo'],
              completionCriteria: 'Has completado 24h solo y documentado la experiencia'
            }
          ]
        },
        {
          id: 'ecopsicologia',
          icon: '🌍',
          title: 'Ecopsicología Aplicada',
          description: 'Sana la separación psique-naturaleza',
          duration: '10 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Trabajo con Duelo Ecológico',
              description: 'Procesa conscientemente el dolor por la crisis',
              action: 'Completa prácticas de duelo del libro, participa en ritual colectivo',
              resources: ['Work That Reconnects', 'Eco-grief practices'],
              completionCriteria: 'Has participado en ritual y procesado duelo personalmente'
            },
            {
              title: 'Consejo de Todos los Seres',
              description: 'Práctica de identificación con otras especies',
              action: 'Participa u organiza Consejo de Todos los Seres (ritual ecopsicológico)',
              resources: ['Council of All Beings', 'Deep ecology practices'],
              completionCriteria: 'Has participado en Consejo y hablado como otra especie'
            },
            {
              title: 'Terapia de Lugar',
              description: 'Usa naturaleza como co-terapeuta',
              action: 'Durante 4 semanas, lleva temas personales a naturaleza para procesarlos',
              resources: ['Ecotherapy', 'Nature as therapist'],
              completionCriteria: '4 semanas de práctica con documentación de insights'
            },
            {
              title: 'Integración Comunitaria',
              description: 'Comparte ecopsicología con tu comunidad',
              action: 'Organiza taller de ecopsicología para 8-15 personas',
              resources: ['Workshop facilitation', 'Ecopsychology exercises'],
              completionCriteria: 'Taller facilitado con evaluación de participantes'
            }
          ]
        }
      ],

      // ========================================================================
      // ARTE DE LA RELACIÓN CONSCIENTE
      // ========================================================================
      'arte-relacion-consciente': [
        {
          id: 'comunicacion-no-violenta',
          icon: '💬',
          title: 'Comunicación No Violenta',
          description: 'Domina el arte de comunicarte desde empatía y honestidad',
          duration: '8 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Los 4 Componentes',
              description: 'Aprende observación, sentimientos, necesidades, peticiones',
              action: 'Estudia teoría CNV, practica cada componente durante 1 semana',
              resources: ['Rosenberg: NVC', 'CNV worksheets'],
              completionCriteria: 'Has practicado los 4 componentes y documentado ejemplos'
            },
            {
              title: 'Auto-Empatía',
              description: 'Conecta con tus propios sentimientos y necesidades',
              action: 'Práctica diaria de auto-empatía durante 3 semanas',
              resources: ['Self-empathy exercises', 'Feelings & needs lists'],
              completionCriteria: '21 días de práctica con journal'
            },
            {
              title: 'Empatía hacia Otros',
              description: 'Escucha empática sin juicio ni consejo',
              action: 'Practica escucha empática con 5 personas diferentes',
              resources: ['Empathic listening', 'CNV dialogue'],
              completionCriteria: '5 conversaciones empáticas con reflexión sobre cada una'
            },
            {
              title: 'Conversaciones Difíciles',
              description: 'Aplica CNV en situaciones de conflicto',
              action: 'Elige 3 conflictos pendientes, abórdalos con CNV',
              resources: ['Conflict resolution', 'Difficult conversations'],
              completionCriteria: '3 conversaciones difíciles completadas con CNV'
            }
          ]
        },
        {
          id: 'intimidad-autentica',
          icon: '❤️',
          title: 'Cultivar Intimidad Auténtica',
          description: 'Profundiza en cercanía emocional genuina',
          duration: '10 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Vulnerabilidad Gradual',
              description: 'Practica compartir con autenticidad creciente',
              action: 'Comparte algo vulnerable con 1 persona nueva cada semana durante 5 semanas',
              resources: ['Brené Brown: Vulnerability', 'Intimacy exercises'],
              completionCriteria: '5 semanas de práctica documentada'
            },
            {
              title: 'Escucha Profunda',
              description: 'Desarrolla capacidad de presencia total',
              action: 'Sesiones semanales de 1 hora de escucha profunda recíproca',
              resources: ['Deep listening', 'Presence practices'],
              completionCriteria: '5 sesiones de escucha profunda completadas'
            },
            {
              title: 'Relación Consciente',
              description: 'Aplica principios del libro a una relación',
              action: 'Elige 1 relación cercana, implementa 5 prácticas del libro durante 4 semanas',
              resources: ['Conscious relating', 'Relationship practices'],
              completionCriteria: '4 semanas de práctica con evaluación del cambio'
            },
            {
              title: 'Círculo de Intimidad',
              description: 'Crea espacio grupal de vulnerabilidad segura',
              action: 'Convoca círculo de 4-6 personas para 6 sesiones de intimidad auténtica',
              resources: ['Intimacy circles', 'Group facilitation'],
              completionCriteria: '6 sesiones completadas con grupo'
            }
          ]
        },
        {
          id: 'relaciones-liberadoras',
          icon: '🕊️',
          title: 'Relaciones Liberadoras',
          description: 'Crea vínculos que honran libertad y autonomía mutua',
          duration: '8 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Identificar Apegos',
              description: 'Observa patrones de apego y control en tus relaciones',
              action: 'Inventario de apegos: ¿dónde te aferras?, ¿dónde intentas controlar?',
              resources: ['Attachment theory', 'Non-attachment'],
              completionCriteria: 'Inventario completo de patrones de apego'
            },
            {
              title: 'Acuerdos Explícitos',
              description: 'Negocia acuerdos conscientes en lugar de expectativas tácitas',
              action: 'Con 3 relaciones cercanas, explicita acuerdos y expectativas',
              resources: ['Relationship agreements', 'Conscious contracts'],
              completionCriteria: '3 conjuntos de acuerdos explícitos co-creados'
            },
            {
              title: 'Soltar sin Abandonar',
              description: 'Practica no-apego manteniendo compromiso',
              action: 'Durante 4 semanas, practica estar presente sin aferrarte',
              resources: ['Non-attachment practices', 'Loving detachment'],
              completionCriteria: '4 semanas de práctica con journal de observaciones'
            },
            {
              title: 'Celebrar Autonomía',
              description: 'Honra el crecimiento y cambio de quienes amas',
              action: 'Identifica crecimiento en otros y celébralo explícitamente',
              resources: ['Celebrating growth', 'Relational freedom'],
              completionCriteria: 'Has celebrado conscientemente el crecimiento de 5 personas'
            }
          ]
        }
      ],

      // ========================================================================
      // SIMPLICIDAD RADICAL
      // ========================================================================
      'simplicidad-radical': [
        {
          id: 'camino-simplicidad',
          icon: '🏔️',
          title: 'Camino hacia Simplicidad',
          description: 'Reduce complejidad, aumenta claridad y libertad',
          duration: '12 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Auditoría de Complejidad',
              description: 'Identifica fuentes de complicación en tu vida',
              action: 'Mapea: posesiones, compromisos, relaciones, deudas, información consumida',
              resources: ['Life audit tools', 'Complexity mapping'],
              completionCriteria: 'Mapa completo de áreas de complejidad'
            },
            {
              title: 'Simplificación Material',
              description: 'Reduce posesiones a lo esencial',
              action: 'Deshazte del 50% de posesiones no esenciales',
              resources: ['Minimalism', 'Decluttering methods'],
              completionCriteria: 'Has reducido posesiones en 50% documentado'
            },
            {
              title: 'Simplificación Temporal',
              description: 'Reduce compromisos y obligaciones',
              action: 'Elimina 30% de compromisos recurrentes',
              resources: ['Essentialism', 'Time management'],
              completionCriteria: 'Agenda simplificada con 30% menos compromisos'
            },
            {
              title: 'Simplicidad Digital',
              description: 'Reduce ruido informacional',
              action: 'Elimina 80% de suscripciones, notificaciones, apps',
              resources: ['Digital minimalism', 'Information diet'],
              completionCriteria: 'Entorno digital radicalmente simplificado'
            }
          ]
        },
        {
          id: 'autosuficiencia',
          icon: '🛠️',
          title: 'Cultivar Autosuficiencia',
          description: 'Desarrolla habilidades básicas para depender menos del sistema',
          duration: '16 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Producción de Alimentos',
              description: 'Aprende a producir parte de tu comida',
              action: 'Inicia huerto (balcón/jardín/comunitario), produce 10% de tu alimentación',
              resources: ['Urban farming', 'Permaculture basics'],
              completionCriteria: 'Huerto activo produciendo regularmente'
            },
            {
              title: 'Habilidades de Reparación',
              description: 'Aprende a reparar en vez de reemplazar',
              action: 'Aprende 3 habilidades: textil, electrónica básica, carpintería',
              resources: ['Repair manuals', 'Fix-it workshops'],
              completionCriteria: 'Has reparado exitosamente 5 objetos'
            },
            {
              title: 'Producción Artesanal',
              description: 'Crea en vez de comprar',
              action: 'Aprende a hacer 3 productos que usas regularmente',
              resources: ['DIY guides', 'Maker culture'],
              completionCriteria: 'Produces regularmente 3 items que antes comprabas'
            },
            {
              title: 'Reducción Dependencia Monetaria',
              description: 'Reduce necesidad de dinero',
              action: 'Participa en economías alternativas: trueque, banco de tiempo, sharing',
              resources: ['Alternative economies', 'Gift economy'],
              completionCriteria: '20% de necesidades satisfechas fuera de economía monetaria'
            }
          ]
        }
      ],

      // ========================================================================
      // REVOLUCIÓN CREATIVA
      // ========================================================================
      'revolucion-creativa': [
        {
          id: 'desbloqueo-creativo',
          icon: '🎨',
          title: 'Desbloqueo Creativo',
          description: 'Libera tu creatividad natural bloqueada',
          duration: '8 semanas',
          difficulty: 'Principiante',
          steps: [
            {
              title: 'Páginas Matutinas',
              description: 'Escritura automática diaria para limpiar bloqueos',
              action: '3 páginas escritas a mano cada mañana durante 6 semanas',
              resources: ['Julia Cameron: The Artist\'s Way', 'Morning pages'],
              completionCriteria: '42 días de páginas matutinas completadas'
            },
            {
              title: 'Citas de Artista',
              description: 'Tiempo regular dedicado a juego creativo',
              action: '2 horas semanales de exploración creativa sin objetivo',
              resources: ['Artist dates', 'Creative play'],
              completionCriteria: '6 citas de artista documentadas'
            },
            {
              title: 'Experimentación Multi-Media',
              description: 'Prueba 5 medios creativos diferentes',
              action: 'Crea en: escritura, dibujo, música, fotografía, movimiento',
              resources: ['Creative exploration', 'Multi-media art'],
              completionCriteria: 'Has creado en 5 medios diferentes'
            },
            {
              title: 'Proyecto Creativo Personal',
              description: 'Completa una obra creativa de inicio a fin',
              action: 'Elige medio favorito y crea proyecto de 4 semanas',
              resources: ['Project management', 'Creative process'],
              completionCriteria: 'Proyecto creativo completado y compartido'
            }
          ]
        },
        {
          id: 'arte-activismo',
          icon: '✊',
          title: 'Arte como Activismo',
          description: 'Usa creatividad para transformación social',
          duration: '10 semanas',
          difficulty: 'Intermedio',
          steps: [
            {
              title: 'Estudiar Artivismo',
              description: 'Aprende de artistas activistas',
              action: 'Estudia 5 casos: Banksy, Pussy Riot, Teatro del Oprimido, etc.',
              resources: ['Artivism examples', 'Political art'],
              completionCriteria: 'Has estudiado 5 artistas/colectivos y sus métodos'
            },
            {
              title: 'Identificar tu Mensaje',
              description: 'Define qué injusticia quieres confrontar',
              action: 'Elige causa que te enciende, investiga a fondo',
              resources: ['Issue research', 'Critical analysis'],
              completionCriteria: 'Causa elegida con investigación profunda'
            },
            {
              title: 'Crear Intervención',
              description: 'Diseña acción artística con impacto social',
              action: 'Crea intervención pública: performance, guerrilla art, cultura jamming',
              resources: ['Guerrilla art', 'Performance activism'],
              completionCriteria: 'Intervención ejecutada y documentada'
            },
            {
              title: 'Amplificar Impacto',
              description: 'Difunde tu acción para multiplicar efecto',
              action: 'Documenta, comparte en redes, contacta medios, invita a replicar',
              resources: ['Media activism', 'Social media for change'],
              completionCriteria: 'Al menos 1000 personas alcanzadas con tu acción'
            }
          ]
        },
        {
          id: 'imaginacion-radical',
          icon: '🌈',
          title: 'Imaginación Radical',
          description: 'Cultiva capacidad de imaginar futuros alternativos',
          duration: '8 semanas',
          difficulty: 'Avanzado',
          steps: [
            {
              title: 'Deconstruir Realismo Capitalista',
              description: 'Identifica límites ideológicos de tu imaginación',
              action: 'Lee Mark Fisher, identifica qué "no puedes imaginar"',
              resources: ['Capitalist Realism', 'Ideology critique'],
              completionCriteria: 'Has identificado 10 límites de tu imaginación política'
            },
            {
              title: 'Estudiar Utopías',
              description: 'Aprende de visiones radicales del pasado y presente',
              action: 'Estudia 5 utopías: Fourier, Rojava, Zapatistas, Solarpunk, etc.',
              resources: ['Utopian studies', 'Prefigurative politics'],
              completionCriteria: 'Has estudiado 5 experimentos utópicos'
            },
            {
              title: 'Escribir tu Utopía',
              description: 'Articula tu visión de mundo posible',
              action: 'Escribe relato de 5000 palabras describiendo tu mundo ideal',
              resources: ['Speculative fiction', 'Visionary writing'],
              completionCriteria: 'Relato utópico completo y revisado'
            },
            {
              title: 'Prefiguración',
              description: 'Empieza a vivir el futuro que imaginas',
              action: 'Identifica 3 aspectos de tu utopía y empieza a vivirlos hoy',
              resources: ['Prefigurative politics', 'Lived utopias'],
              completionCriteria: '3 prácticas prefigurativas activas durante 4 semanas'
            }
          ]
        }
      ]
    };

    // 🔧 FIX v2.9.265: Si el libro tiene paths, devolverlos
    // Si no tiene paths específicos, devolver todos los paths disponibles
    if (bookId && pathsDatabase[bookId] && pathsDatabase[bookId].length > 0) {
      return pathsDatabase[bookId];
    }

    // Fallback: devolver todos los paths de todos los libros
    const allPaths = [];
    Object.entries(pathsDatabase).forEach(([sourceBookId, paths]) => {
      paths.forEach(path => {
        allPaths.push({
          ...path,
          sourceBook: sourceBookId  // Para saber de qué libro viene
        });
      });
    });

    return allPaths;
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  attachEventListeners() {
    // Cerrar
    document.getElementById('close-paths')?.addEventListener('click', () => this.close());

    // Abrir Practice Library desde Learning Paths
    document.getElementById('open-practice-library-from-paths')?.addEventListener('click', () => {
      this.close();
      if (window.practiceLibrary) {
        // Establecer filtro del libro actual si está disponible
        if (this.bookId) {
          window.practiceLibrary.filters.book = this.bookId;
        }
        // 🔧 FIX #7: Usar método wrapper de biblioteca que actualiza tab activo
        if (window.biblioteca?.openPracticeLibrary) {
          window.biblioteca.openPracticeLibrary();
        } else {
          window.practiceLibrary.open();
        }
      } else {
        window.toast?.error('Biblioteca de Prácticas no disponible');
      }
    });

    // Seleccionar path predefinido
    // 🔧 FIX v2.9.265: Soporta paths de otros libros
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

      await this.generateCustomPath(goal);
    });

    // Volver a selección
    document.querySelectorAll('#back-to-selection').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentPath = null;
        this.render();
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
      if (confirm('¿Seguro que quieres reiniciar este path?')) {
        delete this.userProgress[this.currentPath.id];
        this.saveProgress();
        this.render();
        this.attachEventListeners();
      }
    });

    // ESC para cerrar
    document.addEventListener('keydown', this.handleEscape = (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  }

  // 🔧 FIX v2.9.265: Mejorado para soportar paths de cualquier libro
  selectPath(pathId, sourceBook = null) {
    const paths = this.getPredefinedPaths(this.bookId);
    this.currentPath = paths.find(p => p.id === pathId);

    // Si se especificó sourceBook, actualizar el bookId para operaciones futuras
    if (sourceBook) {
      this.bookId = sourceBook;
    }

    if (this.currentPath) {
      this.render();
      this.attachEventListeners();
    }
  }

  markStepComplete(stepIndex) {
    if (!this.userProgress[this.currentPath.id]) {
      this.userProgress[this.currentPath.id] = { completedSteps: [] };
    }

    if (!this.userProgress[this.currentPath.id].completedSteps.includes(stepIndex)) {
      this.userProgress[this.currentPath.id].completedSteps.push(stepIndex);
      this.saveProgress();

      // Trackear achievement
      if (window.achievementSystem) {
        window.achievementSystem.trackLearningPathProgress(
          this.userProgress[this.currentPath.id].completedSteps.length,
          this.currentPath.steps.length
        );
      }

      this.render();
      this.attachEventListeners();

      window.toast?.success('¡Paso completado!');
    }
  }

  // v2.9.372: Mejorado con preview antes de confirmar
  async generateCustomPath(goal) {
    const btn = document.getElementById('generate-custom-path');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="animate-pulse">🔄 Generando...</span>';
    }

    // Obtener recursos del libro actual
    const bookId = this.bookId;
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

    // Intentar con IA si está disponible
    if (window.resourceAIHelper) {
      try {
        customPath = await window.resourceAIHelper.generateLearningPath(goal, resources, bookId);
      } catch (error) {
        logger.error('Error con IA, usando fallback:', error);
      }
    }

    // Fallback: generar path básico sin IA
    if (!customPath) {
      customPath = this.generateFallbackPath(goal);
    }

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '✨ Generar Path con IA';
    }

    if (customPath && customPath.steps && customPath.steps.length > 0) {
      // v2.9.372: Mostrar preview en lugar de aplicar directamente
      this.aiPreviewPath = {
        id: 'custom-' + Date.now(),
        icon: '✨',
        title: customPath.goal || goal,
        description: 'Path personalizado para tu objetivo',
        duration: customPath.estimatedTime || '4-6 semanas',
        difficulty: customPath.difficulty || 'intermedio',
        steps: customPath.steps
      };

      this.showAIPreview();
    } else {
      window.toast?.error('Error al generar path. Intenta de nuevo.');
    }
  }

  // v2.9.372: Mostrar preview del path generado por IA
  showAIPreview() {
    if (!this.aiPreviewPath) return;

    const path = this.aiPreviewPath;

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
          <button onclick="window.learningPaths?.confirmAIPath()"
                  class="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-white transition">
            ✅ Comenzar este Path
          </button>
          <button onclick="window.learningPaths?.regeneratePath()"
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

  // v2.9.372: Confirmar y usar el path de preview
  confirmAIPath() {
    if (!this.aiPreviewPath) return;

    this.currentPath = this.aiPreviewPath;
    this.aiPreviewPath = null;

    document.getElementById('ai-preview-modal')?.remove();

    this.render();
    this.attachEventListeners();

    window.toast?.success('¡Path activado! Comienza tu recorrido.');
  }

  // v2.9.372: Regenerar path con IA
  regeneratePath() {
    document.getElementById('ai-preview-modal')?.remove();
    this.aiPreviewPath = null;

    const goal = document.getElementById('custom-goal-input')?.value.trim();
    if (goal) {
      this.generateCustomPath(goal);
    }
  }

  // 🔧 FIX v2.9.265: Fallback sin IA
  generateFallbackPath(goal) {
    return {
      goal: goal,
      estimatedTime: '4-6 semanas',
      difficulty: 'intermedio',
      steps: [
        {
          title: 'Definir tu objetivo',
          description: 'Clarifica exactamente qué quieres lograr',
          action: `Escribe en un papel: "${goal}" y desglósalo en 3 resultados específicos`,
          resources: ['Papel y bolígrafo'],
          completionCriteria: 'Tienes 3 resultados medibles escritos'
        },
        {
          title: 'Investigar recursos',
          description: 'Encuentra materiales que te ayuden',
          action: 'Busca en la colección capítulos, prácticas y recursos relacionados',
          resources: ['Biblioteca de Prácticas', 'Recursos de los libros'],
          completionCriteria: 'Has identificado al menos 5 recursos relevantes'
        },
        {
          title: 'Plan de acción semanal',
          description: 'Crea un calendario de actividades',
          action: 'Distribuye los recursos y prácticas en un plan de 4 semanas',
          resources: ['Calendario', 'Lista de recursos identificados'],
          completionCriteria: 'Tienes un plan escrito con actividades para cada semana'
        },
        {
          title: 'Primera semana de práctica',
          description: 'Comienza a ejecutar tu plan',
          action: 'Sigue el plan de la primera semana y registra observaciones',
          resources: ['Tu plan de acción', 'Diario de práctica'],
          completionCriteria: 'Has completado las actividades de la semana 1'
        },
        {
          title: 'Evaluación y ajuste',
          description: 'Revisa tu progreso y ajusta el plan',
          action: 'Evalúa qué funcionó, qué no, y ajusta las próximas semanas',
          resources: ['Notas de la semana 1', 'Plan original'],
          completionCriteria: 'Tienes plan ajustado para las semanas siguientes'
        }
      ]
    };
  }
}

// ==========================================================================
// EXPORTAR
// ==========================================================================

window.LearningPaths = LearningPaths;
window.learningPaths = new LearningPaths();
