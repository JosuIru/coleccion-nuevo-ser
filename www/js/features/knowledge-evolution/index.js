/**
 * Knowledge Evolution - Agente de Evolucion del Conocimiento (Coordinador Principal)
 * Sistema que ingiere, analiza, conecta y sintetiza los 18 libros de la coleccion Nuevo Ser
 * @version 1.0.0
 *
 * Modulos:
 *   - KnowledgeIngestion    - Carga y parseo de libros
 *   - KnowledgeAnalysis     - Extraccion de conceptos y temas
 *   - KnowledgeMeditation   - Multi-pass deepening
 *   - KnowledgeSynthesis    - Generacion de contenido evolucionado
 *   - KnowledgeDialogue     - Interfaz de dialogo con autor
 *   - KnowledgeUI           - Modal y visualizacion
 */

class KnowledgeEvolution {
  constructor() {
    // Estado del sistema
    this.state = {
      initialized: false,
      currentPhase: null, // 'ingestion', 'analysis', 'meditation', 'synthesis', 'dialogue'
      progress: {
        ingestion: 0,
        analysis: 0,
        meditation: 0,
        synthesis: 0
      }
    };

    // Datos procesados
    this.corpus = {
      catalog: null,
      books: new Map(),
      totalWords: 0,
      totalChapters: 0,
      totalExercises: 0
    };

    // Resultados de analisis
    this.analysis = {
      concepts: new Map(),
      themes: [],
      connections: [],
      tensions: []
    };

    // Resultados de meditacion
    this.meditation = {
      passes: [],
      currentPass: 0,
      insights: []
    };

    // Libro sintetizado
    this.synthesis = {
      title: 'El Nuevo Ser: Sintesis Evolutiva',
      structure: null,
      content: null,
      practices: [],
      glossary: []
    };

    // Dialogos
    this.dialogues = {
      history: [],
      currentContext: null
    };

    // Configuracion
    this.config = {
      booksPath: 'books/',
      catalogFile: 'catalog.json',
      maxConcurrentLoads: 3,
      meditationPasses: 5,
      synthesisChapters: 21
    };

    // Inicializar modulos (se cargan dinamicamente)
    this.ingestionModule = null;
    this.analysisModule = null;
    this.meditationModule = null;
    this.synthesisModule = null;
    this.dialogueModule = null;
    this.uiModule = null;
  }

  /**
   * Inicializa el sistema Knowledge Evolution
   */
  async init() {
    try {
      logger.log('[KnowledgeEvolution] Iniciando sistema v1.0.0...');

      // Cargar modulos
      await this.loadModules();

      // Crear UI
      if (this.uiModule) {
        this.uiModule.createMainModal();
      }

      this.state.initialized = true;
      logger.log('[KnowledgeEvolution] Sistema inicializado correctamente');

      return true;
    } catch (error) {
      logger.error('[KnowledgeEvolution] Error al inicializar:', error);
      return false;
    }
  }

  /**
   * Carga dinamica de modulos
   */
  async loadModules() {
    try {
      // Los modulos se cargan desde window si ya estan disponibles
      this.ingestionModule = new (window.KnowledgeIngestion || KnowledgeIngestion)(this);
      this.analysisModule = new (window.KnowledgeAnalysis || KnowledgeAnalysis)(this);
      this.meditationModule = new (window.KnowledgeMeditation || KnowledgeMeditation)(this);
      this.synthesisModule = new (window.KnowledgeSynthesis || KnowledgeSynthesis)(this);
      this.dialogueModule = new (window.KnowledgeDialogue || KnowledgeDialogue)(this);
      this.uiModule = new (window.KnowledgeUI || KnowledgeUI)(this);

      logger.log('[KnowledgeEvolution] Modulos cargados');
    } catch (error) {
      logger.error('[KnowledgeEvolution] Error cargando modulos:', error);
      throw error;
    }
  }

  // ==========================================================================
  // ORQUESTACION DE FASES
  // ==========================================================================

  /**
   * Ejecuta el pipeline completo de evolucion del conocimiento
   */
  async runFullPipeline() {
    try {
      logger.log('[KnowledgeEvolution] Iniciando pipeline completo...');

      // Fase 1: Ingestion
      await this.runIngestion();

      // Fase 2: Analisis
      await this.runAnalysis();

      // Fase 3: Meditacion
      await this.runMeditation();

      // Fase 4: Sintesis
      await this.runSynthesis();

      logger.log('[KnowledgeEvolution] Pipeline completado exitosamente');
      return true;
    } catch (error) {
      logger.error('[KnowledgeEvolution] Error en pipeline:', error);
      return false;
    }
  }

  /**
   * Fase 1: Ingestion de libros
   */
  async runIngestion() {
    this.state.currentPhase = 'ingestion';
    this.state.progress.ingestion = 0;

    if (this.uiModule) {
      this.uiModule.updatePhaseStatus('ingestion', 'running');
    }

    const result = await this.ingestionModule.ingestAllBooks((progress) => {
      this.state.progress.ingestion = progress;
      if (this.uiModule) {
        this.uiModule.updateProgress('ingestion', progress);
      }
    });

    this.state.progress.ingestion = 100;
    if (this.uiModule) {
      this.uiModule.updatePhaseStatus('ingestion', 'completed');
    }

    return result;
  }

  /**
   * Fase 2: Analisis de conceptos
   */
  async runAnalysis() {
    this.state.currentPhase = 'analysis';
    this.state.progress.analysis = 0;

    if (this.uiModule) {
      this.uiModule.updatePhaseStatus('analysis', 'running');
    }

    const result = await this.analysisModule.analyzeCorpus((progress) => {
      this.state.progress.analysis = progress;
      if (this.uiModule) {
        this.uiModule.updateProgress('analysis', progress);
      }
    });

    this.state.progress.analysis = 100;
    if (this.uiModule) {
      this.uiModule.updatePhaseStatus('analysis', 'completed');
    }

    return result;
  }

  /**
   * Fase 3: Meditacion multi-pass
   */
  async runMeditation() {
    this.state.currentPhase = 'meditation';
    this.state.progress.meditation = 0;

    if (this.uiModule) {
      this.uiModule.updatePhaseStatus('meditation', 'running');
    }

    const result = await this.meditationModule.runAllPasses((progress, passNumber) => {
      this.state.progress.meditation = progress;
      this.meditation.currentPass = passNumber;
      if (this.uiModule) {
        this.uiModule.updateProgress('meditation', progress, `Pass ${passNumber}/5`);
      }
    });

    this.state.progress.meditation = 100;
    if (this.uiModule) {
      this.uiModule.updatePhaseStatus('meditation', 'completed');
    }

    return result;
  }

  /**
   * Fase 4: Sintesis del libro evolucionado
   */
  async runSynthesis() {
    this.state.currentPhase = 'synthesis';
    this.state.progress.synthesis = 0;

    if (this.uiModule) {
      this.uiModule.updatePhaseStatus('synthesis', 'running');
    }

    const result = await this.synthesisModule.generateSynthesis((progress, chapter) => {
      this.state.progress.synthesis = progress;
      if (this.uiModule) {
        this.uiModule.updateProgress('synthesis', progress, chapter);
      }
    });

    this.state.progress.synthesis = 100;
    if (this.uiModule) {
      this.uiModule.updatePhaseStatus('synthesis', 'completed');
    }

    return result;
  }

  // ==========================================================================
  // METODOS DELEGADOS - Ingestion Module
  // ==========================================================================

  async loadCatalog() {
    return this.ingestionModule.loadCatalog();
  }

  async loadBook(bookId) {
    return this.ingestionModule.loadBook(bookId);
  }

  getCorpusStats() {
    return this.ingestionModule.getStats();
  }

  // ==========================================================================
  // METODOS DELEGADOS - Analysis Module
  // ==========================================================================

  extractConcepts(text, bookId) {
    return this.analysisModule.extractConcepts(text, bookId);
  }

  getConceptGraph() {
    return this.analysisModule.getConceptGraph();
  }

  getThematicCategories() {
    return this.analysisModule.getThematicCategories();
  }

  // ==========================================================================
  // METODOS DELEGADOS - Meditation Module
  // ==========================================================================

  async runSinglePass(passNumber) {
    return this.meditationModule.runPass(passNumber);
  }

  getMeditationInsights() {
    return this.meditationModule.getInsights();
  }

  // ==========================================================================
  // METODOS DELEGADOS - Synthesis Module
  // ==========================================================================

  getSynthesizedBook() {
    return this.synthesisModule.getBook();
  }

  async exportSynthesis(format = 'json') {
    return this.synthesisModule.export(format);
  }

  // ==========================================================================
  // METODOS DELEGADOS - Dialogue Module
  // ==========================================================================

  async askQuestion(question) {
    return this.dialogueModule.ask(question);
  }

  getDialogueHistory() {
    return this.dialogueModule.getHistory();
  }

  clearDialogue() {
    return this.dialogueModule.clearHistory();
  }

  // ==========================================================================
  // METODOS DELEGADOS - UI Module
  // ==========================================================================

  openModal() {
    if (this.uiModule) {
      this.uiModule.openModal();
    }
  }

  closeModal() {
    if (this.uiModule) {
      this.uiModule.closeModal();
    }
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  /**
   * Muestra un toast/notificacion
   */
  showToast(message, type = 'info') {
    if (window.toast) {
      const icons = {
        info: '🧠',
        success: '✅',
        warning: '⚠️',
        error: '❌'
      };
      window.toast.show(`${icons[type]} ${message}`, type, 4000);
      return;
    }

    // Fallback: crear toast simple
    const existingToast = document.querySelector('.knowledge-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'knowledge-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background: #1e293b;
      border: 1px solid rgba(148, 163, 184, 0.3);
      border-radius: 12px;
      color: white;
      font-size: 14px;
      z-index: 10000;
      animation: fadeInUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 4000);
  }

  /**
   * Obtiene el estado actual del sistema
   */
  getState() {
    return {
      ...this.state,
      corpus: {
        booksLoaded: this.corpus.books.size,
        totalWords: this.corpus.totalWords,
        totalChapters: this.corpus.totalChapters,
        totalExercises: this.corpus.totalExercises
      },
      analysis: {
        conceptsFound: this.analysis.concepts.size,
        themesIdentified: this.analysis.themes.length,
        connectionsFound: this.analysis.connections.length
      },
      meditation: {
        currentPass: this.meditation.currentPass,
        totalInsights: this.meditation.insights.length
      },
      synthesis: {
        hasContent: !!this.synthesis.content,
        practicesCount: this.synthesis.practices.length
      }
    };
  }

  // ==========================================================================
  // PERSISTENCIA
  // ==========================================================================

  /**
   * Guarda el estado actual en localStorage
   */
  saveState() {
    try {
      const stateToSave = {
        timestamp: Date.now(),
        state: this.state,
        analysis: {
          concepts: Array.from(this.analysis.concepts.entries()),
          themes: this.analysis.themes,
          connections: this.analysis.connections,
          tensions: this.analysis.tensions
        },
        meditation: this.meditation,
        synthesis: this.synthesis,
        dialogues: this.dialogues
      };
      localStorage.setItem('knowledgeEvolution_state', JSON.stringify(stateToSave));
      logger.log('[KnowledgeEvolution] Estado guardado');
    } catch (error) {
      logger.error('[KnowledgeEvolution] Error guardando estado:', error);
    }
  }

  /**
   * Restaura el estado desde localStorage
   */
  loadState() {
    try {
      const saved = localStorage.getItem('knowledgeEvolution_state');
      if (!saved) return false;

      const data = JSON.parse(saved);
      this.state = data.state;
      this.analysis.concepts = new Map(data.analysis.concepts);
      this.analysis.themes = data.analysis.themes;
      this.analysis.connections = data.analysis.connections;
      this.analysis.tensions = data.analysis.tensions;
      this.meditation = data.meditation;
      this.synthesis = data.synthesis;
      this.dialogues = data.dialogues;

      logger.log('[KnowledgeEvolution] Estado restaurado');
      return true;
    } catch (error) {
      logger.error('[KnowledgeEvolution] Error restaurando estado:', error);
      return false;
    }
  }

  /**
   * Limpia todo el estado guardado
   */
  clearState() {
    localStorage.removeItem('knowledgeEvolution_state');
    logger.log('[KnowledgeEvolution] Estado limpiado');
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    if (this.ingestionModule?.destroy) this.ingestionModule.destroy();
    if (this.analysisModule?.destroy) this.analysisModule.destroy();
    if (this.meditationModule?.destroy) this.meditationModule.destroy();
    if (this.synthesisModule?.destroy) this.synthesisModule.destroy();
    if (this.dialogueModule?.destroy) this.dialogueModule.destroy();
    if (this.uiModule?.destroy) this.uiModule.destroy();

    logger.log('[KnowledgeEvolution] Sistema destruido');
  }
}

// Exportar para uso global
window.KnowledgeEvolution = KnowledgeEvolution;
