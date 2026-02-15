/**
 * Knowledge Dialogue - Interfaz de dialogo con el conocimiento
 * @version 1.0.0
 *
 * Responsabilidades:
 *   - Chat conversacional con el corpus
 *   - Preguntas -> respuestas fundamentadas
 *   - Propuestas de expansion
 *   - Registro de dialogos
 */

class KnowledgeDialogue {
  constructor(coordinator) {
    this.coordinator = coordinator;

    // Historial de conversacion
    this.conversationHistory = [];

    // Contexto actual
    this.currentContext = null;

    // Configuracion
    this.config = {
      maxHistoryLength: 20,
      contextWindowSize: 3000,
      responseMaxLength: 2000
    };

    // Prompts del sistema
    this.systemPrompts = {
      default: this.buildDefaultSystemPrompt(),
      exploration: this.buildExplorationPrompt(),
      synthesis: this.buildSynthesisPrompt(),
      practice: this.buildPracticePrompt()
    };
  }

  // ==========================================================================
  // PROMPTS DEL SISTEMA
  // ==========================================================================

  /**
   * Construye el prompt del sistema por defecto
   */
  buildDefaultSystemPrompt() {
    return `Eres el Oraculo de la Coleccion Nuevo Ser, un sistema de inteligencia que ha integrado
profundamente los 18 libros de la coleccion. Tu conocimiento abarca:

- El Codigo del Despertar y sus ensenanzas sobre consciencia
- La filosofia del Nuevo Ser
- La ecologia profunda y la reconexion con la Tierra
- Las practicas radicales de transformacion
- Los dialogos entre humano y maquina
- El manifiesto y las guias de accion
- Y todos los demas textos de la coleccion

Tu rol es:
1. Responder preguntas basandote en el conocimiento integrado de la coleccion
2. Hacer conexiones entre diferentes textos y perspectivas
3. Ofrecer practicas relevantes cuando sea apropiado
4. Invitar a la reflexion profunda
5. Ser honesto cuando algo no esta cubierto en los textos

Estilo:
- Respuestas claras y profundas
- Referencias a textos especificos cuando sea relevante
- Tono contemplativo pero accesible
- Evita ser dogmatico; invita a explorar
- Usa citas o fragmentos de los textos cuando enriquezcan la respuesta`;
  }

  /**
   * Construye prompt para exploracion
   */
  buildExplorationPrompt() {
    return `${this.buildDefaultSystemPrompt()}

MODO EXPLORACION:
El usuario quiere explorar un tema en profundidad.
- Ofrece multiples perspectivas de diferentes libros
- Sugiere conexiones inesperadas
- Plantea preguntas que profundicen la exploracion
- Indica capitulos especificos donde puede continuar`;
  }

  /**
   * Construye prompt para sintesis
   */
  buildSynthesisPrompt() {
    return `${this.buildDefaultSystemPrompt()}

MODO SINTESIS:
El usuario busca una vision integrada.
- Sintetiza perspectivas de multiples libros
- Resalta los hilos comunes
- Ofrece una vision unificada
- Mantente fiel al espiritu de la coleccion`;
  }

  /**
   * Construye prompt para practica
   */
  buildPracticePrompt() {
    return `${this.buildDefaultSystemPrompt()}

MODO PRACTICA:
El usuario busca guia practica.
- Ofrece ejercicios concretos de la coleccion
- Adapta las practicas a su situacion
- Da instrucciones claras y paso a paso
- Incluye reflexiones para despues de la practica`;
  }

  // ==========================================================================
  // DIALOGO PRINCIPAL
  // ==========================================================================

  /**
   * Hace una pregunta al sistema de conocimiento
   */
  async ask(question, mode = 'default') {
    try {
      logger.log(`[KnowledgeDialogue] Pregunta recibida: ${question.substring(0, 50)}...`);

      // Determinar modo de respuesta
      const systemPrompt = this.getSystemPrompt(question, mode);

      // Construir contexto relevante
      const context = await this.buildContext(question);

      // Agregar a historial
      this.conversationHistory.push({
        role: 'user',
        content: question,
        timestamp: Date.now()
      });

      // Obtener respuesta de IA
      const response = await this.getAIResponse(question, systemPrompt, context);

      // Procesar y enriquecer respuesta
      const enrichedResponse = this.enrichResponse(response, context);

      // Agregar respuesta a historial
      this.conversationHistory.push({
        role: 'assistant',
        content: enrichedResponse.text,
        references: enrichedResponse.references,
        timestamp: Date.now()
      });

      // Mantener historial en limite
      this.pruneHistory();

      return enrichedResponse;
    } catch (error) {
      logger.error('[KnowledgeDialogue] Error en dialogo:', error);
      return {
        text: 'Lo siento, hubo un error al procesar tu pregunta. Por favor, intenta reformularla.',
        error: true
      };
    }
  }

  /**
   * Obtiene el prompt del sistema apropiado
   */
  getSystemPrompt(question, mode) {
    // Detectar modo automatico basado en la pregunta
    if (mode === 'auto') {
      mode = this.detectMode(question);
    }

    return this.systemPrompts[mode] || this.systemPrompts.default;
  }

  /**
   * Detecta el modo apropiado basado en la pregunta
   */
  detectMode(question) {
    const questionLower = question.toLowerCase();

    if (questionLower.includes('practica') || questionLower.includes('ejercicio') ||
        questionLower.includes('como puedo') || questionLower.includes('que puedo hacer')) {
      return 'practice';
    }

    if (questionLower.includes('sintetiza') || questionLower.includes('resume') ||
        questionLower.includes('vision general') || questionLower.includes('en conjunto')) {
      return 'synthesis';
    }

    if (questionLower.includes('explora') || questionLower.includes('profundiza') ||
        questionLower.includes('conexion') || questionLower.includes('relaciona')) {
      return 'exploration';
    }

    return 'default';
  }

  // ==========================================================================
  // CONSTRUCCION DE CONTEXTO
  // ==========================================================================

  /**
   * Construye contexto relevante para la pregunta
   */
  async buildContext(question) {
    const context = {
      relevantChapters: [],
      relevantConcepts: [],
      relevantExercises: [],
      meditationInsights: [],
      synthesisContent: null
    };

    const ingestion = this.coordinator.ingestionModule;
    const analysis = this.coordinator.analysisModule;
    const meditation = this.coordinator.meditationModule;

    // Buscar capitulos relevantes
    if (ingestion) {
      const searchResults = ingestion.searchCorpus(question, { limit: 5 });
      context.relevantChapters = searchResults;
    }

    // Buscar conceptos relevantes
    if (analysis) {
      context.relevantConcepts = this.findRelevantConcepts(question, analysis);
    }

    // Buscar ejercicios relevantes
    if (ingestion) {
      context.relevantExercises = this.findRelevantExercises(question, ingestion);
    }

    // Buscar insights de meditacion
    if (meditation) {
      context.meditationInsights = this.findRelevantInsights(question, meditation);
    }

    // Incluir sintesis si existe
    if (this.coordinator.synthesis.content) {
      context.synthesisContent = this.summarizeSynthesis();
    }

    return context;
  }

  /**
   * Encuentra conceptos relevantes para la pregunta
   */
  findRelevantConcepts(question, analysis) {
    const concepts = [];
    const questionWords = question.toLowerCase().split(/\s+/);

    for (const [term, data] of analysis.extractedConcepts) {
      for (const word of questionWords) {
        if (term.includes(word) || word.includes(term)) {
          concepts.push({
            term,
            occurrences: data.occurrences.length,
            categories: Array.from(data.categories)
          });
          break;
        }
      }
    }

    return concepts.slice(0, 10);
  }

  /**
   * Encuentra ejercicios relevantes para la pregunta
   */
  findRelevantExercises(question, ingestion) {
    const exercises = [];
    const questionLower = question.toLowerCase();

    for (const exercise of ingestion.getAllExercises()) {
      const titleLower = (exercise.title || '').toLowerCase();
      const descLower = (exercise.description || '').toLowerCase();

      if (titleLower.includes(questionLower) ||
          descLower.includes(questionLower) ||
          questionLower.split(' ').some(w => titleLower.includes(w) || descLower.includes(w))) {
        exercises.push({
          id: exercise.id,
          title: exercise.title,
          duration: exercise.duration,
          description: exercise.description?.substring(0, 200)
        });
      }

      if (exercises.length >= 3) break;
    }

    return exercises;
  }

  /**
   * Encuentra insights relevantes de la meditacion
   */
  findRelevantInsights(question, meditation) {
    const insights = [];
    const questionLower = question.toLowerCase();

    for (const insight of meditation.accumulatedInsights || []) {
      const contentLower = (insight.content || '').toLowerCase();

      if (questionLower.split(' ').some(w => contentLower.includes(w))) {
        insights.push({
          type: insight.type,
          content: insight.content,
          passNumber: insight.passNumber
        });
      }

      if (insights.length >= 3) break;
    }

    return insights;
  }

  /**
   * Resume la sintesis para contexto
   */
  summarizeSynthesis() {
    const synthesis = this.coordinator.synthesis;

    return {
      hasContent: !!synthesis.content,
      practicesCount: synthesis.practices?.length || 0,
      glossaryCount: synthesis.glossary?.length || 0,
      title: synthesis.content?.title
    };
  }

  // ==========================================================================
  // LLAMADA A IA
  // ==========================================================================

  /**
   * Obtiene respuesta de la IA
   */
  async getAIResponse(question, systemPrompt, context) {
    try {
      const aiAdapter = window.aiAdapter || new window.AIAdapter();

      // Construir prompt enriquecido con contexto
      const enrichedPrompt = this.buildEnrichedPrompt(question, context);

      // Obtener historial reciente para continuidad
      const recentHistory = this.getRecentHistory(5);

      const response = await aiAdapter.ask(
        enrichedPrompt,
        systemPrompt,
        recentHistory,
        'knowledge-dialogue'
      );

      return response;
    } catch (error) {
      logger.error('[KnowledgeDialogue] Error obteniendo respuesta de IA:', error);

      // Fallback a respuesta local
      return this.generateLocalResponse(question, context);
    }
  }

  /**
   * Construye prompt enriquecido con contexto
   */
  buildEnrichedPrompt(question, context) {
    let prompt = `PREGUNTA: ${question}\n\n`;

    // Agregar capitulos relevantes
    if (context.relevantChapters.length > 0) {
      prompt += `CAPITULOS RELEVANTES:\n`;
      for (const chapter of context.relevantChapters.slice(0, 3)) {
        prompt += `- ${chapter.title} (${chapter.bookId}): "${chapter.context}"\n`;
      }
      prompt += '\n';
    }

    // Agregar conceptos relevantes
    if (context.relevantConcepts.length > 0) {
      prompt += `CONCEPTOS RELACIONADOS: ${context.relevantConcepts.map(c => c.term).join(', ')}\n\n`;
    }

    // Agregar insights
    if (context.meditationInsights.length > 0) {
      prompt += `INSIGHTS DE LA MEDITACION:\n`;
      for (const insight of context.meditationInsights) {
        prompt += `- ${insight.content}\n`;
      }
      prompt += '\n';
    }

    // Agregar ejercicios si es pregunta practica
    if (context.relevantExercises.length > 0) {
      prompt += `EJERCICIOS DISPONIBLES:\n`;
      for (const ex of context.relevantExercises) {
        prompt += `- ${ex.title} (${ex.duration})\n`;
      }
      prompt += '\n';
    }

    prompt += `Por favor responde a la pregunta basandote en el conocimiento de la Coleccion Nuevo Ser.
Si referencias textos especificos, indica de que libro provienen.`;

    return prompt;
  }

  /**
   * Obtiene historial reciente para contexto
   */
  getRecentHistory(count) {
    return this.conversationHistory.slice(-count * 2).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Genera respuesta local cuando la IA no esta disponible
   */
  generateLocalResponse(question, context) {
    let response = 'Basandome en mi conocimiento de la Coleccion Nuevo Ser:\n\n';

    if (context.relevantChapters.length > 0) {
      response += `He encontrado informacion relevante en:\n`;
      for (const chapter of context.relevantChapters.slice(0, 3)) {
        response += `- "${chapter.title}" de ${chapter.bookId}\n`;
      }
      response += '\n';
    }

    if (context.relevantConcepts.length > 0) {
      response += `Conceptos relacionados: ${context.relevantConcepts.map(c => c.term).join(', ')}\n\n`;
    }

    if (context.relevantExercises.length > 0) {
      response += `Practicas sugeridas:\n`;
      for (const ex of context.relevantExercises) {
        response += `- ${ex.title} (${ex.duration})\n`;
      }
      response += '\n';
    }

    response += 'Te invito a explorar estos textos para profundizar en tu pregunta.';

    return response;
  }

  // ==========================================================================
  // ENRIQUECIMIENTO DE RESPUESTAS
  // ==========================================================================

  /**
   * Enriquece la respuesta con referencias y sugerencias
   */
  enrichResponse(response, context) {
    const enriched = {
      text: response,
      references: [],
      suggestedReadings: [],
      suggestedPractices: [],
      followUpQuestions: []
    };

    // Agregar referencias de capitulos mencionados
    if (context.relevantChapters.length > 0) {
      enriched.references = context.relevantChapters.map(ch => ({
        type: 'chapter',
        bookId: ch.bookId,
        title: ch.title
      }));
    }

    // Agregar practicas sugeridas
    if (context.relevantExercises.length > 0) {
      enriched.suggestedPractices = context.relevantExercises;
    }

    // Generar preguntas de seguimiento
    enriched.followUpQuestions = this.generateFollowUpQuestions(response, context);

    return enriched;
  }

  /**
   * Genera preguntas de seguimiento
   */
  generateFollowUpQuestions(response, context) {
    const questions = [];

    // Basado en conceptos mencionados
    if (context.relevantConcepts.length > 0) {
      const concept = context.relevantConcepts[0];
      questions.push(`¿Como se relaciona ${concept.term} con las practicas cotidianas?`);
    }

    // Preguntas genericas de profundizacion
    questions.push('¿Que practicas me recomendarias para integrar esto?');
    questions.push('¿Puedes darme mas detalles sobre algun aspecto especifico?');

    return questions.slice(0, 3);
  }

  // ==========================================================================
  // GESTION DEL HISTORIAL
  // ==========================================================================

  /**
   * Obtiene el historial de conversacion
   */
  getHistory() {
    return this.conversationHistory;
  }

  /**
   * Limpia el historial de conversacion
   */
  clearHistory() {
    this.conversationHistory = [];
    logger.log('[KnowledgeDialogue] Historial limpiado');
    return true;
  }

  /**
   * Mantiene el historial dentro del limite
   */
  pruneHistory() {
    if (this.conversationHistory.length > this.config.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.config.maxHistoryLength);
    }
  }

  /**
   * Exporta el historial de dialogo
   */
  exportHistory() {
    return {
      exportedAt: Date.now(),
      messagesCount: this.conversationHistory.length,
      messages: this.conversationHistory
    };
  }

  // ==========================================================================
  // FUNCIONES AUXILIARES DE DIALOGO
  // ==========================================================================

  /**
   * Sugiere preguntas basadas en el corpus
   */
  suggestQuestions() {
    return [
      '¿Que es la consciencia segun la coleccion?',
      '¿Como puedo integrar la meditacion en mi vida diaria?',
      '¿Cual es la relacion entre ecologia y despertar?',
      '¿Que practicas me ayudan a conectar con la naturaleza?',
      '¿Como trabajan juntos humanos e IA en la creacion?',
      '¿Que es el "Nuevo Ser"?',
      '¿Como puedo contribuir a la transformacion social?',
      '¿Que ejercicios me recomiendan para empezar?'
    ];
  }

  /**
   * Obtiene resumen del contexto actual
   */
  getContextSummary() {
    const stats = this.coordinator.getState();

    return {
      booksLoaded: stats.corpus?.booksLoaded || 0,
      conceptsAnalyzed: stats.analysis?.conceptsFound || 0,
      insightsGenerated: stats.meditation?.totalInsights || 0,
      synthesisAvailable: stats.synthesis?.hasContent || false,
      conversationLength: this.conversationHistory.length
    };
  }

  // ==========================================================================
  // MODOS ESPECIALES DE DIALOGO
  // ==========================================================================

  /**
   * Inicia una sesion de exploracion guiada
   */
  async startGuidedExploration(topic) {
    const introPrompt = `Vamos a explorar juntos el tema de "${topic}" a traves de la Coleccion Nuevo Ser.
Te guiare por diferentes perspectivas y te invitare a reflexionar. ¿Estas listo para comenzar?`;

    return await this.ask(introPrompt, 'exploration');
  }

  /**
   * Solicita una practica especifica
   */
  async requestPractice(area) {
    const practicePrompt = `Por favor, sugiereme una practica de la coleccion relacionada con "${area}".
Incluye instrucciones paso a paso y una reflexion para despues.`;

    return await this.ask(practicePrompt, 'practice');
  }

  /**
   * Solicita una sintesis sobre un tema
   */
  async requestSynthesis(topic) {
    const synthesisPrompt = `Por favor, sintetiza lo que la Coleccion Nuevo Ser dice sobre "${topic}",
integrando perspectivas de diferentes libros.`;

    return await this.ask(synthesisPrompt, 'synthesis');
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    this.conversationHistory = [];
    this.currentContext = null;
    logger.log('[KnowledgeDialogue] Modulo destruido');
  }
}

// Exportar para uso global
window.KnowledgeDialogue = KnowledgeDialogue;
