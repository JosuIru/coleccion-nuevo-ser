/**
 * Knowledge UI - Modal y visualizacion del sistema
 * @version 1.0.0
 *
 * Responsabilidades:
 *   - Dashboard de analisis
 *   - Timeline de fases
 *   - Visualizacion de conceptos
 *   - Chat de dialogo
 *   - Exportador de sintesis
 */

class KnowledgeUI {
  constructor(coordinator) {
    this.coordinator = coordinator;

    // Referencias DOM
    this.modal = null;
    this.contentContainer = null;

    // Estado de UI
    this.activeTab = 'dashboard';
    this.isOpen = false;

    // Tabs disponibles
    this.tabs = [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'pipeline', label: 'Pipeline', icon: '⚡' },
      { id: 'concepts', label: 'Conceptos', icon: '🔗' },
      { id: 'synthesis', label: 'Sintesis', icon: '📖' },
      { id: 'dialogue', label: 'Dialogo', icon: '💬' },
      { id: 'export', label: 'Exportar', icon: '📤' }
    ];
  }

  // ==========================================================================
  // CREACION DEL MODAL
  // ==========================================================================

  /**
   * Crea el modal principal
   */
  createMainModal() {
    // Evitar duplicados
    if (document.getElementById('knowledge-evolution-modal')) {
      this.modal = document.getElementById('knowledge-evolution-modal');
      return;
    }

    this.modal = document.createElement('div');
    this.modal.id = 'knowledge-evolution-modal';
    this.modal.className = 'fixed inset-0 z-50 hidden';
    this.modal.innerHTML = this.getModalHTML();

    document.body.appendChild(this.modal);

    // Configurar eventos
    this.setupEventListeners();

    logger.log('[KnowledgeUI] Modal creado');
  }

  /**
   * Genera HTML del modal
   */
  getModalHTML() {
    return `
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="window.knowledgeEvolution?.closeModal()"></div>
      <div class="absolute inset-4 md:inset-8 bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-700">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🧠</span>
            <div>
              <h2 class="text-xl font-bold text-white">Knowledge Evolution</h2>
              <p class="text-sm text-slate-400">Agente de Evolucion del Conocimiento</p>
            </div>
          </div>
          <button onclick="window.knowledgeEvolution?.closeModal()" class="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-slate-700 bg-slate-800/30 px-4">
          ${this.tabs.map(tab => `
            <button
              id="ke-tab-${tab.id}"
              onclick="window.knowledgeEvolution?.uiModule?.switchTab('${tab.id}')"
              class="px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                tab.id === this.activeTab
                  ? 'text-amber-400 border-amber-400'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }"
            >
              <span class="mr-2">${tab.icon}</span>
              ${tab.label}
            </button>
          `).join('')}
        </div>

        <!-- Content -->
        <div id="ke-content" class="flex-1 overflow-auto p-6">
          ${this.renderTabContent(this.activeTab)}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // RENDERIZADO DE TABS
  // ==========================================================================

  /**
   * Renderiza contenido de un tab
   */
  renderTabContent(tabId) {
    switch (tabId) {
      case 'dashboard':
        return this.renderDashboard();
      case 'pipeline':
        return this.renderPipeline();
      case 'concepts':
        return this.renderConcepts();
      case 'synthesis':
        return this.renderSynthesis();
      case 'dialogue':
        return this.renderDialogue();
      case 'export':
        return this.renderExport();
      default:
        return '<p class="text-slate-400">Tab no encontrado</p>';
    }
  }

  /**
   * Cambia de tab
   */
  switchTab(tabId) {
    this.activeTab = tabId;

    // Actualizar estilos de tabs
    for (const tab of this.tabs) {
      const tabEl = document.getElementById(`ke-tab-${tab.id}`);
      if (tabEl) {
        if (tab.id === tabId) {
          tabEl.className = 'px-4 py-3 text-sm font-medium transition-colors border-b-2 text-amber-400 border-amber-400';
        } else {
          tabEl.className = 'px-4 py-3 text-sm font-medium transition-colors border-b-2 text-slate-400 border-transparent hover:text-slate-200';
        }
      }
    }

    // Actualizar contenido
    const contentEl = document.getElementById('ke-content');
    if (contentEl) {
      contentEl.innerHTML = this.renderTabContent(tabId);
      this.attachTabEventListeners(tabId);
    }
  }

  // ==========================================================================
  // TAB: DASHBOARD
  // ==========================================================================

  /**
   * Renderiza el dashboard
   */
  renderDashboard() {
    const state = this.coordinator.getState();

    return `
      <div class="space-y-6">
        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${this.renderStatCard('📚', 'Libros Cargados', state.corpus?.booksLoaded || 0, '/18')}
          ${this.renderStatCard('📝', 'Palabras', this.formatNumber(state.corpus?.totalWords || 0), '')}
          ${this.renderStatCard('📖', 'Capitulos', state.corpus?.totalChapters || 0, '')}
          ${this.renderStatCard('🏋️', 'Ejercicios', state.corpus?.totalExercises || 0, '')}
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${this.renderStatCard('💡', 'Conceptos', state.analysis?.conceptsFound || 0, '')}
          ${this.renderStatCard('🎯', 'Temas', state.analysis?.themesIdentified || 0, '')}
          ${this.renderStatCard('🔗', 'Conexiones', state.analysis?.connectionsFound || 0, '')}
          ${this.renderStatCard('✨', 'Insights', state.meditation?.totalInsights || 0, '')}
        </div>

        <!-- Estado del Sistema -->
        <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 class="text-lg font-semibold text-white mb-4">Estado del Sistema</h3>
          <div class="space-y-3">
            ${this.renderStatusItem('Inicializacion', state.initialized)}
            ${this.renderStatusItem('Corpus Cargado', state.corpus?.booksLoaded > 0)}
            ${this.renderStatusItem('Analisis Completado', state.analysis?.conceptsFound > 0)}
            ${this.renderStatusItem('Meditacion Completada', state.meditation?.totalInsights > 0)}
            ${this.renderStatusItem('Sintesis Generada', state.synthesis?.hasContent)}
          </div>
        </div>

        <!-- Acciones Rapidas -->
        <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 class="text-lg font-semibold text-white mb-4">Acciones Rapidas</h3>
          <div class="flex flex-wrap gap-3">
            <button onclick="window.knowledgeEvolution?.runFullPipeline()" class="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors flex items-center gap-2">
              <span>⚡</span> Ejecutar Pipeline Completo
            </button>
            <button onclick="window.knowledgeEvolution?.uiModule?.switchTab('dialogue')" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2">
              <span>💬</span> Iniciar Dialogo
            </button>
            <button onclick="window.knowledgeEvolution?.uiModule?.switchTab('export')" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2">
              <span>📤</span> Exportar Sintesis
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza una tarjeta de estadistica
   */
  renderStatCard(icon, label, value, suffix) {
    return `
      <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <div class="flex items-center gap-3">
          <span class="text-2xl">${icon}</span>
          <div>
            <p class="text-xs text-slate-400">${label}</p>
            <p class="text-xl font-bold text-white">${value}<span class="text-sm text-slate-400">${suffix}</span></p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza un item de estado
   */
  renderStatusItem(label, completed) {
    const icon = completed ? '✅' : '⏳';
    const color = completed ? 'text-green-400' : 'text-slate-400';

    return `
      <div class="flex items-center justify-between">
        <span class="text-slate-300">${label}</span>
        <span class="${color}">${icon}</span>
      </div>
    `;
  }

  // ==========================================================================
  // TAB: PIPELINE
  // ==========================================================================

  /**
   * Renderiza el pipeline de ejecucion
   */
  renderPipeline() {
    const state = this.coordinator.state;

    const phases = [
      { id: 'ingestion', name: 'Ingestion', icon: '📥', progress: state.progress.ingestion },
      { id: 'analysis', name: 'Analisis', icon: '🔍', progress: state.progress.analysis },
      { id: 'meditation', name: 'Meditacion', icon: '🧘', progress: state.progress.meditation },
      { id: 'synthesis', name: 'Sintesis', icon: '📝', progress: state.progress.synthesis }
    ];

    return `
      <div class="space-y-6">
        <!-- Timeline de Fases -->
        <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 class="text-lg font-semibold text-white mb-6">Pipeline de Evolucion</h3>
          <div class="space-y-6">
            ${phases.map((phase, index) => `
              <div class="flex items-start gap-4" id="ke-phase-${phase.id}">
                <div class="flex flex-col items-center">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center ${
                    phase.progress === 100 ? 'bg-green-600' :
                    phase.progress > 0 ? 'bg-amber-600 animate-pulse' :
                    'bg-slate-700'
                  }">
                    <span class="text-lg">${phase.icon}</span>
                  </div>
                  ${index < phases.length - 1 ? `
                    <div class="w-0.5 h-12 ${phase.progress === 100 ? 'bg-green-600' : 'bg-slate-700'}"></div>
                  ` : ''}
                </div>
                <div class="flex-1 pb-6">
                  <h4 class="text-white font-medium">${phase.name}</h4>
                  <div class="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-amber-500 to-green-500 transition-all duration-500"
                         style="width: ${phase.progress}%"
                         id="ke-progress-${phase.id}"></div>
                  </div>
                  <p class="mt-1 text-sm text-slate-400" id="ke-status-${phase.id}">
                    ${phase.progress === 100 ? 'Completado' : phase.progress > 0 ? `${phase.progress}%` : 'Pendiente'}
                  </p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Controles -->
        <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 class="text-lg font-semibold text-white mb-4">Controles del Pipeline</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button onclick="window.knowledgeEvolution?.runIngestion()" class="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
              📥 Solo Ingestion
            </button>
            <button onclick="window.knowledgeEvolution?.runAnalysis()" class="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
              🔍 Solo Analisis
            </button>
            <button onclick="window.knowledgeEvolution?.runMeditation()" class="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
              🧘 Solo Meditacion
            </button>
            <button onclick="window.knowledgeEvolution?.runSynthesis()" class="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
              📝 Solo Sintesis
            </button>
          </div>
          <div class="mt-4">
            <button onclick="window.knowledgeEvolution?.runFullPipeline()" class="w-full px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors font-medium">
              ⚡ Ejecutar Pipeline Completo
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // TAB: CONCEPTS
  // ==========================================================================

  /**
   * Renderiza visualizacion de conceptos
   */
  renderConcepts() {
    const analysis = this.coordinator.analysisModule;
    const summary = analysis?.getSummary() || {};

    return `
      <div class="space-y-6">
        <!-- Temas Principales -->
        <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 class="text-lg font-semibold text-white mb-4">Temas Principales</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            ${(summary.themes || []).map(theme => `
              <div class="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                <p class="font-medium text-white">${theme.name}</p>
                <p class="text-sm text-slate-400">${theme.count} conceptos</p>
              </div>
            `).join('') || '<p class="text-slate-400 col-span-3">Ejecuta el analisis primero</p>'}
          </div>
        </div>

        <!-- Top Conceptos -->
        <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 class="text-lg font-semibold text-white mb-4">Conceptos Mas Frecuentes</h3>
          <div class="flex flex-wrap gap-2">
            ${(summary.topConcepts || []).map(concept => `
              <span class="px-3 py-1 bg-amber-600/20 text-amber-300 rounded-full text-sm border border-amber-600/30">
                ${concept.term} <span class="text-amber-500/70">(${concept.count})</span>
              </span>
            `).join('') || '<p class="text-slate-400">Ejecuta el analisis primero</p>'}
          </div>
        </div>

        <!-- Estadisticas -->
        <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 class="text-lg font-semibold text-white mb-4">Estadisticas del Analisis</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p class="text-2xl font-bold text-amber-400">${summary.totalConcepts || 0}</p>
              <p class="text-sm text-slate-400">Conceptos</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-amber-400">${summary.totalThemes || 0}</p>
              <p class="text-sm text-slate-400">Temas</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-amber-400">${summary.totalConnections || 0}</p>
              <p class="text-sm text-slate-400">Conexiones</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-amber-400">${summary.totalTensions || 0}</p>
              <p class="text-sm text-slate-400">Tensiones</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // TAB: SYNTHESIS
  // ==========================================================================

  /**
   * Renderiza preview de la sintesis
   */
  renderSynthesis() {
    const synthesis = this.coordinator.synthesis;
    const hasContent = synthesis?.content;

    if (!hasContent) {
      return `
        <div class="flex flex-col items-center justify-center h-64 text-center">
          <span class="text-5xl mb-4">📝</span>
          <h3 class="text-xl font-semibold text-white mb-2">Sintesis No Generada</h3>
          <p class="text-slate-400 mb-6">Ejecuta el pipeline completo para generar el libro sintetizado</p>
          <button onclick="window.knowledgeEvolution?.runFullPipeline()" class="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors">
            Generar Sintesis
          </button>
        </div>
      `;
    }

    const book = synthesis.content;

    return `
      <div class="space-y-6">
        <!-- Header del Libro -->
        <div class="bg-gradient-to-r from-amber-900/30 to-slate-800/50 rounded-xl p-6 border border-amber-700/30">
          <h2 class="text-2xl font-bold text-white mb-2">${book.title}</h2>
          <p class="text-amber-300 mb-4">${book.subtitle}</p>
          <p class="text-sm text-slate-400">
            Por ${book.authors?.join(', ')} | ${book.sourceBooksCount || 0} libros fuente
          </p>
        </div>

        <!-- Estructura -->
        <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 class="text-lg font-semibold text-white mb-4">Estructura del Libro</h3>
          <div class="space-y-3">
            ${(book.sections || []).map(section => `
              <div class="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div>
                  <p class="font-medium text-white">${section.title}</p>
                  ${section.subtitle ? `<p class="text-sm text-slate-400">${section.subtitle}</p>` : ''}
                </div>
                <span class="text-sm text-slate-400">
                  ${section.chapters?.length || section.practices?.length || section.entries?.length || 0} items
                </span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Practicas -->
        <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 class="text-lg font-semibold text-white mb-4">21 Practicas Esenciales</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            ${(synthesis.practices || []).slice(0, 10).map(practice => `
              <div class="p-3 bg-slate-700/30 rounded-lg">
                <p class="font-medium text-white text-sm">${practice.number}. ${practice.title}</p>
                <p class="text-xs text-slate-400">${practice.duration} | ${practice.category}</p>
              </div>
            `).join('')}
          </div>
          ${(synthesis.practices || []).length > 10 ? `
            <p class="text-sm text-slate-400 mt-3">...y ${synthesis.practices.length - 10} practicas mas</p>
          ` : ''}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // TAB: DIALOGUE
  // ==========================================================================

  /**
   * Renderiza interfaz de dialogo
   */
  renderDialogue() {
    const dialogue = this.coordinator.dialogueModule;
    const history = dialogue?.getHistory() || [];
    const suggestions = dialogue?.suggestQuestions() || [];

    return `
      <div class="flex flex-col h-full" style="height: calc(100vh - 250px);">
        <!-- Historial -->
        <div class="flex-1 overflow-y-auto space-y-4 mb-4" id="ke-dialogue-history">
          ${history.length === 0 ? `
            <div class="text-center py-8">
              <span class="text-4xl mb-4 block">💬</span>
              <p class="text-slate-400 mb-4">Inicia una conversacion con el conocimiento</p>
              <div class="flex flex-wrap justify-center gap-2">
                ${suggestions.slice(0, 4).map(q => `
                  <button onclick="window.knowledgeEvolution?.uiModule?.askSuggested('${q}')"
                          class="px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors">
                    ${q}
                  </button>
                `).join('')}
              </div>
            </div>
          ` : history.map(msg => `
            <div class="${msg.role === 'user' ? 'text-right' : 'text-left'}">
              <div class="inline-block max-w-[80%] ${
                msg.role === 'user'
                  ? 'bg-amber-600/20 text-amber-100 border-amber-600/30'
                  : 'bg-slate-700/50 text-slate-200 border-slate-600'
              } rounded-xl p-4 border">
                <p class="whitespace-pre-wrap">${msg.content}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Input -->
        <div class="border-t border-slate-700 pt-4">
          <div class="flex gap-3">
            <input type="text" id="ke-dialogue-input"
                   placeholder="Escribe tu pregunta..."
                   class="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                   onkeypress="if(event.key==='Enter')window.knowledgeEvolution?.uiModule?.sendMessage()">
            <button onclick="window.knowledgeEvolution?.uiModule?.sendMessage()"
                    class="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors">
              Enviar
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Envia mensaje al dialogo
   */
  async sendMessage() {
    const input = document.getElementById('ke-dialogue-input');
    if (!input || !input.value.trim()) return;

    const question = input.value.trim();
    input.value = '';

    // Mostrar mensaje del usuario inmediatamente
    const historyEl = document.getElementById('ke-dialogue-history');
    if (historyEl) {
      historyEl.innerHTML += `
        <div class="text-right">
          <div class="inline-block max-w-[80%] bg-amber-600/20 text-amber-100 border-amber-600/30 rounded-xl p-4 border">
            <p>${question}</p>
          </div>
        </div>
        <div class="text-left" id="ke-response-loading">
          <div class="inline-block bg-slate-700/50 text-slate-400 rounded-xl p-4 border border-slate-600">
            <p>Pensando...</p>
          </div>
        </div>
      `;
      historyEl.scrollTop = historyEl.scrollHeight;
    }

    // Obtener respuesta
    const response = await this.coordinator.askQuestion(question);

    // Actualizar con respuesta
    const loadingEl = document.getElementById('ke-response-loading');
    if (loadingEl) {
      loadingEl.outerHTML = `
        <div class="text-left">
          <div class="inline-block max-w-[80%] bg-slate-700/50 text-slate-200 border-slate-600 rounded-xl p-4 border">
            <p class="whitespace-pre-wrap">${response.text || response}</p>
            ${response.references?.length > 0 ? `
              <div class="mt-3 pt-3 border-t border-slate-600">
                <p class="text-xs text-slate-400">Referencias: ${response.references.map(r => r.title).join(', ')}</p>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    if (historyEl) {
      historyEl.scrollTop = historyEl.scrollHeight;
    }
  }

  /**
   * Pregunta sugerida
   */
  async askSuggested(question) {
    const input = document.getElementById('ke-dialogue-input');
    if (input) {
      input.value = question;
      await this.sendMessage();
    }
  }

  // ==========================================================================
  // TAB: EXPORT
  // ==========================================================================

  /**
   * Renderiza opciones de exportacion
   */
  renderExport() {
    const synthesis = this.coordinator.synthesis;
    const hasContent = synthesis?.content;

    return `
      <div class="space-y-6">
        <!-- Estado -->
        <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 class="text-lg font-semibold text-white mb-4">Estado de la Sintesis</h3>
          ${hasContent ? `
            <div class="flex items-center gap-3 text-green-400">
              <span class="text-2xl">✅</span>
              <p>Sintesis lista para exportar</p>
            </div>
          ` : `
            <div class="flex items-center gap-3 text-amber-400">
              <span class="text-2xl">⏳</span>
              <p>Primero genera la sintesis ejecutando el pipeline</p>
            </div>
          `}
        </div>

        <!-- Formatos -->
        <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 class="text-lg font-semibold text-white mb-4">Formatos de Exportacion</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onclick="window.knowledgeEvolution?.uiModule?.exportAs('json')"
                    class="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl border border-slate-600 transition-colors ${!hasContent ? 'opacity-50 cursor-not-allowed' : ''}"
                    ${!hasContent ? 'disabled' : ''}>
              <span class="text-3xl block mb-2">📋</span>
              <p class="font-medium text-white">JSON</p>
              <p class="text-sm text-slate-400">Datos estructurados</p>
            </button>
            <button onclick="window.knowledgeEvolution?.uiModule?.exportAs('markdown')"
                    class="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl border border-slate-600 transition-colors ${!hasContent ? 'opacity-50 cursor-not-allowed' : ''}"
                    ${!hasContent ? 'disabled' : ''}>
              <span class="text-3xl block mb-2">📝</span>
              <p class="font-medium text-white">Markdown</p>
              <p class="text-sm text-slate-400">Texto formateado</p>
            </button>
            <button onclick="window.knowledgeEvolution?.uiModule?.exportAs('html')"
                    class="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-xl border border-slate-600 transition-colors ${!hasContent ? 'opacity-50 cursor-not-allowed' : ''}"
                    ${!hasContent ? 'disabled' : ''}>
              <span class="text-3xl block mb-2">🌐</span>
              <p class="font-medium text-white">HTML</p>
              <p class="text-sm text-slate-400">Pagina web</p>
            </button>
          </div>
        </div>

        <!-- Guardado Local -->
        <div class="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h3 class="text-lg font-semibold text-white mb-4">Persistencia</h3>
          <div class="flex flex-wrap gap-3">
            <button onclick="window.knowledgeEvolution?.saveState()" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
              💾 Guardar Estado
            </button>
            <button onclick="window.knowledgeEvolution?.loadState()" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
              📂 Cargar Estado
            </button>
            <button onclick="window.knowledgeEvolution?.clearState()" class="px-4 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded-lg transition-colors">
              🗑️ Limpiar Estado
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Exporta en el formato especificado
   */
  async exportAs(format) {
    try {
      const result = await this.coordinator.exportSynthesis(format);

      // Crear descarga
      const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.coordinator.showToast(`Exportado como ${format.toUpperCase()}`, 'success');
    } catch (error) {
      logger.error('[KnowledgeUI] Error exportando:', error);
      this.coordinator.showToast('Error al exportar', 'error');
    }
  }

  // ==========================================================================
  // ACTUALIZACION DE PROGRESO
  // ==========================================================================

  /**
   * Actualiza el estado de una fase
   */
  updatePhaseStatus(phaseId, status) {
    const phaseEl = document.getElementById(`ke-phase-${phaseId}`);
    if (!phaseEl) return;

    const circleEl = phaseEl.querySelector('div > div:first-child');
    if (circleEl) {
      circleEl.className = `w-10 h-10 rounded-full flex items-center justify-center ${
        status === 'completed' ? 'bg-green-600' :
        status === 'running' ? 'bg-amber-600 animate-pulse' :
        'bg-slate-700'
      }`;
    }
  }

  /**
   * Actualiza el progreso de una fase
   */
  updateProgress(phaseId, progress, label = '') {
    const progressEl = document.getElementById(`ke-progress-${phaseId}`);
    if (progressEl) {
      progressEl.style.width = `${progress}%`;
    }

    const statusEl = document.getElementById(`ke-status-${phaseId}`);
    if (statusEl) {
      statusEl.textContent = progress === 100 ? 'Completado' : `${progress}% ${label}`;
    }
  }

  // ==========================================================================
  // CONTROL DEL MODAL
  // ==========================================================================

  /**
   * Abre el modal
   */
  openModal() {
    if (this.modal) {
      this.modal.classList.remove('hidden');
      this.isOpen = true;

      // Refrescar contenido
      this.switchTab(this.activeTab);
    }
  }

  /**
   * Cierra el modal
   */
  closeModal() {
    if (this.modal) {
      this.modal.classList.add('hidden');
      this.isOpen = false;
    }
  }

  // ==========================================================================
  // EVENTOS
  // ==========================================================================

  /**
   * Configura event listeners
   */
  setupEventListeners() {
    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeModal();
      }
    });
  }

  /**
   * Adjunta event listeners especificos del tab
   */
  attachTabEventListeners(_tabId) {
    // Eventos especificos por tab si son necesarios
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  /**
   * Formatea numeros grandes
   */
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
    this.isOpen = false;
    logger.log('[KnowledgeUI] Modulo destruido');
  }
}

// Exportar para uso global
window.KnowledgeUI = KnowledgeUI;
