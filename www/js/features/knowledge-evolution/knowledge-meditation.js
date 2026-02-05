/**
 * Knowledge Meditation - Multi-pass deepening del conocimiento
 * @version 1.0.0
 *
 * Responsabilidades:
 *   - Ejecutar 5 passes iterativos de profundizacion
 *   - Pass 1: Comprension - Resumen estructurado por libro
 *   - Pass 2: Conexion - Hilos conductores transversales
 *   - Pass 3: Profundizacion - Tensiones y paradojas
 *   - Pass 4: Integracion - Sintesis de perspectivas
 *   - Pass 5: Trascendencia - Emergencia de nuevos insights
 */

class KnowledgeMeditation {
  constructor(coordinator) {
    this.coordinator = coordinator;

    // Configuracion de passes
    this.passConfig = [
      {
        id: 1,
        name: 'Comprension',
        description: 'Resumen estructurado por libro',
        prompt: 'comprehension'
      },
      {
        id: 2,
        name: 'Conexion',
        description: 'Hilos conductores transversales',
        prompt: 'connection'
      },
      {
        id: 3,
        name: 'Profundizacion',
        description: 'Tensiones y paradojas',
        prompt: 'deepening'
      },
      {
        id: 4,
        name: 'Integracion',
        description: 'Sintesis de perspectivas',
        prompt: 'integration'
      },
      {
        id: 5,
        name: 'Trascendencia',
        description: 'Emergencia de nuevos insights',
        prompt: 'transcendence'
      }
    ];

    // Resultados de cada pass
    this.passResults = new Map();

    // Insights acumulados
    this.accumulatedInsights = [];

    // Estado
    this.currentPassNumber = 0;
    this.isRunning = false;
  }

  // ==========================================================================
  // EJECUCION DE PASSES
  // ==========================================================================

  /**
   * Ejecuta todos los passes de meditacion
   */
  async runAllPasses(onProgress) {
    try {
      logger.log('[KnowledgeMeditation] Iniciando meditacion multi-pass...');
      this.isRunning = true;

      const totalPasses = this.passConfig.length;

      for (let i = 0; i < totalPasses; i++) {
        this.currentPassNumber = i + 1;

        const passConfig = this.passConfig[i];
        logger.log(`[KnowledgeMeditation] Ejecutando Pass ${passConfig.id}: ${passConfig.name}`);

        const result = await this.runPass(passConfig.id);
        this.passResults.set(passConfig.id, result);

        // Actualizar progreso
        const progress = Math.round(((i + 1) / totalPasses) * 100);
        if (onProgress) {
          onProgress(progress, passConfig.id);
        }

        // Guardar insights del pass
        if (result.insights) {
          this.accumulatedInsights.push(...result.insights);
        }
      }

      // Guardar en coordinador
      this.saveResults();

      this.isRunning = false;
      logger.log(`[KnowledgeMeditation] Meditacion completada: ${this.accumulatedInsights.length} insights generados`);

      return {
        success: true,
        totalPasses,
        totalInsights: this.accumulatedInsights.length,
        passes: Array.from(this.passResults.entries())
      };
    } catch (error) {
      this.isRunning = false;
      logger.error('[KnowledgeMeditation] Error en meditacion:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ejecuta un pass individual
   */
  async runPass(passNumber) {
    const passConfig = this.passConfig.find(p => p.id === passNumber);
    if (!passConfig) {
      throw new Error(`Pass ${passNumber} no encontrado`);
    }

    switch (passNumber) {
      case 1:
        return await this.runComprehensionPass();
      case 2:
        return await this.runConnectionPass();
      case 3:
        return await this.runDeepeningPass();
      case 4:
        return await this.runIntegrationPass();
      case 5:
        return await this.runTranscendencePass();
      default:
        throw new Error(`Pass ${passNumber} no implementado`);
    }
  }

  // ==========================================================================
  // PASS 1: COMPRENSION
  // ==========================================================================

  /**
   * Pass 1: Genera resumenes estructurados por libro
   */
  async runComprehensionPass() {
    const summaries = [];
    const insights = [];

    const books = this.coordinator.corpus.books;

    for (const [bookId, book] of books) {
      const summary = this.generateBookSummary(book);
      summaries.push(summary);

      // Extraer insights del resumen
      if (summary.coreMessage) {
        insights.push({
          type: 'comprehension',
          source: bookId,
          content: summary.coreMessage,
          passNumber: 1
        });
      }
    }

    return {
      passNumber: 1,
      name: 'Comprension',
      summaries,
      insights,
      timestamp: Date.now()
    };
  }

  /**
   * Genera resumen estructurado de un libro
   */
  generateBookSummary(book) {
    const sections = book.sections || [];
    const chapterCount = sections.reduce((acc, s) => acc + (s.chapters?.length || 0), 0);

    // Extraer temas principales del libro
    const bookThemes = this.extractBookThemes(book);

    // Extraer mensaje central
    const coreMessage = this.extractCoreMessage(book);

    return {
      bookId: book._id,
      title: book.title,
      subtitle: book.subtitle,
      author: book.author,
      structure: {
        sectionsCount: sections.length,
        chaptersCount: chapterCount,
        exercisesCount: book._stats?.exercises || 0
      },
      themes: bookThemes,
      coreMessage,
      sectionSummaries: sections.map(s => ({
        id: s.id,
        title: s.title,
        chaptersCount: s.chapters?.length || 0
      }))
    };
  }

  /**
   * Extrae temas principales de un libro
   */
  extractBookThemes(book) {
    const themes = new Set();
    const analysis = this.coordinator.analysisModule;

    if (!analysis) return [];

    const sections = book.sections || [];
    for (const section of sections) {
      for (const chapter of section.chapters || []) {
        const chapterId = `${book._id}:${section.id}:${chapter.id}`;
        const cached = analysis.analysisCache.get(chapterId);
        if (cached?.categories) {
          cached.categories.forEach(c => themes.add(c));
        }
      }
    }

    return Array.from(themes);
  }

  /**
   * Extrae el mensaje central de un libro
   */
  extractCoreMessage(book) {
    // Intentar extraer del prologo o primer capitulo
    const sections = book.sections || [];

    if (sections.length > 0) {
      const firstSection = sections[0];
      if (firstSection.chapters?.length > 0) {
        const firstChapter = firstSection.chapters[0];

        // Buscar pregunta de cierre como indicador del tema
        if (firstChapter.closingQuestion) {
          return `Pregunta central: ${firstChapter.closingQuestion}`;
        }

        // Tomar primera frase significativa del contenido
        if (firstChapter.content) {
          const firstParagraph = firstChapter.content.split('\n\n')[0];
          if (firstParagraph && firstParagraph.length > 20) {
            return firstParagraph.substring(0, 200) + '...';
          }
        }
      }
    }

    return book.subtitle || 'Sin mensaje central identificado';
  }

  // ==========================================================================
  // PASS 2: CONEXION
  // ==========================================================================

  /**
   * Pass 2: Identifica hilos conductores transversales
   */
  async runConnectionPass() {
    const threads = [];
    const insights = [];

    // Obtener temas del analisis
    const themes = this.coordinator.analysis.themes || [];

    for (const theme of themes) {
      const thread = await this.traceThematicThread(theme);
      threads.push(thread);

      // Generar insight sobre el hilo
      if (thread.books.length >= 3) {
        insights.push({
          type: 'connection',
          source: `theme:${theme.id}`,
          content: `El tema "${theme.name}" conecta ${thread.books.length} libros: ${thread.books.join(', ')}`,
          passNumber: 2,
          strength: thread.books.length
        });
      }
    }

    // Identificar conexiones entre conceptos de diferentes libros
    const crossBookConnections = this.findCrossBookConnections();

    return {
      passNumber: 2,
      name: 'Conexion',
      threads,
      crossBookConnections,
      insights,
      timestamp: Date.now()
    };
  }

  /**
   * Traza un hilo tematico a traves de los libros
   */
  async traceThematicThread(theme) {
    const booksWithTheme = new Set();
    const chaptersWithTheme = [];

    const analysis = this.coordinator.analysisModule;
    if (!analysis) return { theme: theme.id, books: [], chapters: [] };

    for (const [chapterId, cached] of analysis.analysisCache) {
      if (cached.categories?.includes(theme.id)) {
        booksWithTheme.add(cached.bookId);
        chaptersWithTheme.push({
          chapterId,
          bookId: cached.bookId,
          title: cached.title
        });
      }
    }

    return {
      themeId: theme.id,
      themeName: theme.name,
      books: Array.from(booksWithTheme),
      chapters: chaptersWithTheme,
      strength: chaptersWithTheme.length
    };
  }

  /**
   * Encuentra conexiones entre libros diferentes
   */
  findCrossBookConnections() {
    const connections = [];
    const analysis = this.coordinator.analysisModule;

    if (!analysis) return connections;

    // Agrupar conceptos por libro
    const conceptsByBook = new Map();

    for (const [term, concept] of analysis.extractedConcepts) {
      for (const occurrence of concept.occurrences) {
        if (!conceptsByBook.has(occurrence.bookId)) {
          conceptsByBook.set(occurrence.bookId, new Set());
        }
        conceptsByBook.get(occurrence.bookId).add(term);
      }
    }

    // Encontrar conceptos compartidos entre pares de libros
    const bookIds = Array.from(conceptsByBook.keys());

    for (let i = 0; i < bookIds.length; i++) {
      for (let j = i + 1; j < bookIds.length; j++) {
        const bookA = bookIds[i];
        const bookB = bookIds[j];

        const conceptsA = conceptsByBook.get(bookA);
        const conceptsB = conceptsByBook.get(bookB);

        const shared = [...conceptsA].filter(c => conceptsB.has(c));

        if (shared.length >= 5) {
          connections.push({
            bookA,
            bookB,
            sharedConcepts: shared,
            strength: shared.length
          });
        }
      }
    }

    // Ordenar por fuerza
    connections.sort((a, b) => b.strength - a.strength);

    return connections.slice(0, 50);
  }

  // ==========================================================================
  // PASS 3: PROFUNDIZACION
  // ==========================================================================

  /**
   * Pass 3: Explora tensiones y paradojas
   */
  async runDeepeningPass() {
    const tensions = this.coordinator.analysis.tensions || [];
    const paradoxes = [];
    const insights = [];

    // Analizar cada tension
    for (const tension of tensions) {
      const analysis = await this.analyzeTension(tension);

      if (analysis.isParadox) {
        paradoxes.push(analysis);
      }

      // Generar insight
      insights.push({
        type: 'deepening',
        source: `tension:${tension.pole1}-${tension.pole2}`,
        content: analysis.synthesis,
        passNumber: 3
      });
    }

    // Buscar paradojas emergentes
    const emergentParadoxes = this.findEmergentParadoxes();
    paradoxes.push(...emergentParadoxes);

    return {
      passNumber: 3,
      name: 'Profundizacion',
      tensionsAnalyzed: tensions.length,
      paradoxes,
      insights,
      timestamp: Date.now()
    };
  }

  /**
   * Analiza una tension en profundidad
   */
  async analyzeTension(tension) {
    // Analisis basico (puede expandirse con IA)
    return {
      pole1: tension.pole1,
      pole2: tension.pole2,
      sharedChapters: tension.sharedChapters?.length || 0,
      isParadox: this.isTensionParadoxical(tension),
      synthesis: this.synthesizeTension(tension),
      resolution: this.suggestResolution(tension)
    };
  }

  /**
   * Determina si una tension es paradojica
   */
  isTensionParadoxical(tension) {
    // Pares que forman paradojas conocidas
    const paradoxicalPairs = [
      ['accion', 'contemplacion'],
      ['individual', 'colectivo'],
      ['simplicidad', 'complejidad'],
      ['urgencia', 'paciencia']
    ];

    for (const [a, b] of paradoxicalPairs) {
      if ((tension.pole1 === a && tension.pole2 === b) ||
          (tension.pole1 === b && tension.pole2 === a)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Sintetiza una tension
   */
  synthesizeTension(tension) {
    const templates = {
      'accion-contemplacion': 'La accion consciente emerge de la contemplacion profunda',
      'individual-colectivo': 'El individuo se realiza en y a traves de lo colectivo',
      'tecnologia-naturaleza': 'La tecnologia puede ser una extension de la naturaleza cuando sirve a la vida',
      'simplicidad-complejidad': 'La verdadera simplicidad integra la complejidad sin negarla',
      'tradicion-innovacion': 'La innovacion autentica hunde sus raices en la sabiduria tradicional',
      'razon-intuicion': 'La razon iluminada por la intuicion alcanza la verdadera comprension',
      'ciencia-espiritualidad': 'Ciencia y espiritualidad son dos caminos hacia la misma verdad',
      'local-global': 'Actuar localmente pensando globalmente crea cambio sistemico',
      'urgencia-paciencia': 'La urgencia paciente combina determinacion con sabiduria del tiempo',
      'personal-sistemico': 'La transformacion personal y sistemica son inseparables'
    };

    const key = `${tension.pole1}-${tension.pole2}`;
    const reverseKey = `${tension.pole2}-${tension.pole1}`;

    return templates[key] || templates[reverseKey] ||
           `La integracion de ${tension.pole1} y ${tension.pole2} revela una dimension superior`;
  }

  /**
   * Sugiere una resolucion para la tension
   */
  suggestResolution(tension) {
    return {
      approach: 'integracion',
      description: `Integrar ${tension.pole1} y ${tension.pole2} en una perspectiva mas amplia`,
      practice: `Meditar sobre como ${tension.pole1} y ${tension.pole2} se complementan`
    };
  }

  /**
   * Busca paradojas emergentes en el corpus
   */
  findEmergentParadoxes() {
    const paradoxes = [];

    // Buscar patrones de paradoja en el texto
    const ingestion = this.coordinator.ingestionModule;
    if (!ingestion) return paradoxes;

    const paradoxPatterns = [
      /para ganar[,]? hay que perder/gi,
      /menos es m[aá]s/gi,
      /la fuerza est[aá] en la debilidad/gi,
      /el vac[ií]o est[aá] lleno/gi,
      /el silencio habla/gi,
      /morir para nacer/gi,
      /perder para encontrar/gi
    ];

    for (const [chapterId, chapter] of ingestion.index.byChapter) {
      if (!chapter.content) continue;

      for (const pattern of paradoxPatterns) {
        const matches = chapter.content.match(pattern);
        if (matches) {
          paradoxes.push({
            type: 'emergent',
            pattern: matches[0],
            chapterId,
            bookId: chapter.bookId
          });
        }
      }
    }

    return paradoxes;
  }

  // ==========================================================================
  // PASS 4: INTEGRACION
  // ==========================================================================

  /**
   * Pass 4: Sintetiza perspectivas diversas
   */
  async runIntegrationPass() {
    const syntheses = [];
    const insights = [];

    // Obtener resultados de passes anteriores
    const comprehension = this.passResults.get(1);
    const connection = this.passResults.get(2);
    const deepening = this.passResults.get(3);

    // Sintetizar por categoria tematica
    const themes = this.coordinator.analysis.themes || [];

    for (const theme of themes) {
      const synthesis = this.synthesizeTheme(theme, comprehension, connection, deepening);
      syntheses.push(synthesis);

      insights.push({
        type: 'integration',
        source: `theme:${theme.id}`,
        content: synthesis.integratedPerspective,
        passNumber: 4
      });
    }

    // Crear sintesis global
    const globalSynthesis = this.createGlobalSynthesis(syntheses);

    return {
      passNumber: 4,
      name: 'Integracion',
      themeSyntheses: syntheses,
      globalSynthesis,
      insights,
      timestamp: Date.now()
    };
  }

  /**
   * Sintetiza un tema integrando perspectivas de diferentes libros
   */
  synthesizeTheme(theme, comprehension, connection, deepening) {
    // Encontrar el hilo tematico
    const thread = connection?.threads?.find(t => t.themeId === theme.id);

    // Recopilar perspectivas de cada libro
    const perspectives = [];

    if (thread?.books) {
      for (const bookId of thread.books) {
        const bookSummary = comprehension?.summaries?.find(s => s.bookId === bookId);
        if (bookSummary) {
          perspectives.push({
            bookId,
            title: bookSummary.title,
            coreMessage: bookSummary.coreMessage
          });
        }
      }
    }

    return {
      themeId: theme.id,
      themeName: theme.name,
      perspectives,
      integratedPerspective: this.integratePerespectives(theme, perspectives)
    };
  }

  /**
   * Integra multiples perspectivas en una vision unificada
   */
  integratePerespectives(theme, perspectives) {
    if (perspectives.length === 0) {
      return `El tema ${theme.name} requiere mayor exploracion`;
    }

    const bookTitles = perspectives.map(p => p.title).join(', ');

    return `${theme.name}: Vision integrada de ${perspectives.length} libros (${bookTitles}). ` +
           `Cada perspectiva aporta una dimension unica que enriquece la comprension global del tema.`;
  }

  /**
   * Crea una sintesis global de todos los temas
   */
  createGlobalSynthesis(themeSyntheses) {
    const topThemes = themeSyntheses
      .sort((a, b) => b.perspectives.length - a.perspectives.length)
      .slice(0, 5);

    return {
      title: 'Vision Integrada de la Coleccion Nuevo Ser',
      mainThemes: topThemes.map(t => t.themeName),
      description: 'La coleccion articula una vision coherente del despertar de la consciencia ' +
                   'que integra dimension personal, relacional, ecologica y cosmica.',
      coreInsight: 'El nuevo ser emerge de la integracion consciente de multiples dimensiones de la existencia'
    };
  }

  // ==========================================================================
  // PASS 5: TRASCENDENCIA
  // ==========================================================================

  /**
   * Pass 5: Genera nuevos insights que trascienden el material original
   */
  async runTranscendencePass() {
    const emergentInsights = [];
    const newQuestions = [];
    const futurePaths = [];

    // Recopilar todo el conocimiento procesado
    const allInsights = this.accumulatedInsights;
    const integration = this.passResults.get(4);

    // Generar insights emergentes
    emergentInsights.push(...this.generateEmergentInsights(allInsights, integration));

    // Generar nuevas preguntas
    newQuestions.push(...this.generateNewQuestions(integration));

    // Identificar caminos futuros
    futurePaths.push(...this.identifyFuturePaths(integration));

    // Crear meta-insight
    const metaInsight = this.createMetaInsight(emergentInsights, newQuestions, futurePaths);

    return {
      passNumber: 5,
      name: 'Trascendencia',
      emergentInsights,
      newQuestions,
      futurePaths,
      metaInsight,
      insights: emergentInsights,
      timestamp: Date.now()
    };
  }

  /**
   * Genera insights que emergen del conjunto
   */
  generateEmergentInsights(allInsights, integration) {
    const insights = [];

    // Insight sobre la naturaleza del conocimiento integrado
    insights.push({
      type: 'transcendence',
      source: 'meta-analysis',
      content: 'El conocimiento de la coleccion no es la suma de sus partes, sino un campo de posibilidades ' +
               'que se actualiza en cada lectura consciente.',
      passNumber: 5,
      level: 'meta'
    });

    // Insight sobre la evolucion del lector
    insights.push({
      type: 'transcendence',
      source: 'reader-evolution',
      content: 'Quien recorre estos textos no solo adquiere informacion; se transforma en el proceso ' +
               'de comprension, actualizando en si mismo el potencial que los textos describen.',
      passNumber: 5,
      level: 'meta'
    });

    // Insight sobre la co-creacion
    insights.push({
      type: 'transcendence',
      source: 'co-creation',
      content: 'La coleccion es un ejemplo vivo de co-creacion humano-IA, donde el dialogo entre inteligencias ' +
               'diferentes produce algo que ninguna podria crear sola.',
      passNumber: 5,
      level: 'meta'
    });

    return insights;
  }

  /**
   * Genera nuevas preguntas que el material sugiere pero no responde
   */
  generateNewQuestions(integration) {
    return [
      {
        question: '¿Como se manifiesta el despertar en la era de la inteligencia artificial?',
        relevance: 'La coleccion explora la consciencia pero apenas comienza a integrar la dimension IA',
        suggestedExploration: 'Desarrollar una fenomenologia de la consciencia extendida humano-IA'
      },
      {
        question: '¿Que practicas emergen de la integracion de todas las tradiciones presentadas?',
        relevance: 'Cada libro ofrece practicas, pero falta un sistema integrado',
        suggestedExploration: 'Crear un curriculum integral que combine todas las dimensiones'
      },
      {
        question: '¿Como se transmite esta vision a las proximas generaciones?',
        relevance: 'La urgencia de la transicion requiere pedagogias nuevas',
        suggestedExploration: 'Desarrollar metodologias educativas basadas en la coleccion'
      },
      {
        question: '¿Que instituciones del Nuevo Ser deben crearse?',
        relevance: 'La transformacion requiere estructuras sociales renovadas',
        suggestedExploration: 'Diseñar prototipos institucionales coherentes con la vision'
      }
    ];
  }

  /**
   * Identifica caminos de desarrollo futuro
   */
  identifyFuturePaths(integration) {
    return [
      {
        path: 'Profundizacion contemplativa',
        description: 'Desarrollar las practicas meditativas hacia estados mas profundos',
        priority: 'alta',
        nextSteps: ['Retiros intensivos', 'Guia de maestros', 'Comunidades de practica']
      },
      {
        path: 'Aplicacion social',
        description: 'Traducir la vision a proyectos concretos de transformacion social',
        priority: 'alta',
        nextSteps: ['Proyectos piloto', 'Redes de accion', 'Documentacion de experiencias']
      },
      {
        path: 'Dialogo interreligioso',
        description: 'Conectar con otras tradiciones espirituales y filosoficas',
        priority: 'media',
        nextSteps: ['Encuentros interreligiosos', 'Textos comparativos', 'Practicas compartidas']
      },
      {
        path: 'Investigacion cientifica',
        description: 'Validar empiricamente las afirmaciones sobre consciencia y cambio',
        priority: 'media',
        nextSteps: ['Colaboraciones con investigadores', 'Estudios de caso', 'Mediciones']
      }
    ];
  }

  /**
   * Crea un meta-insight que sintetiza toda la meditacion
   */
  createMetaInsight(emergentInsights, newQuestions, futurePaths) {
    return {
      title: 'Meta-Insight: La Evolucion del Conocimiento',
      content: 'La coleccion Nuevo Ser representa un momento de inflexion en la evolucion de la consciencia humana. ' +
               'No es solo un conjunto de libros sino un campo de posibilidades que se actualiza en cada lectura, ' +
               'cada dialogo, cada accion inspirada por su vision. La sintesis evolutiva que emerge de esta meditacion ' +
               'apunta hacia un futuro donde la separacion entre conocer y ser se disuelve, donde la sabiduria no se ' +
               'acumula sino que se vive, y donde la transformacion personal y planetaria se revelan como un solo movimiento.',
      emergentPatterns: emergentInsights.length,
      openQuestions: newQuestions.length,
      futurePaths: futurePaths.length,
      invitation: 'El siguiente paso no es leer mas, sino encarnar lo comprendido.'
    };
  }

  // ==========================================================================
  // GUARDADO Y ACCESO
  // ==========================================================================

  /**
   * Guarda resultados en el coordinador
   */
  saveResults() {
    this.coordinator.meditation.passes = Array.from(this.passResults.entries());
    this.coordinator.meditation.insights = this.accumulatedInsights;
    this.coordinator.meditation.currentPass = this.currentPassNumber;

    logger.log('[KnowledgeMeditation] Resultados guardados');
  }

  /**
   * Obtiene todos los insights generados
   */
  getInsights() {
    return this.accumulatedInsights;
  }

  /**
   * Obtiene resultado de un pass especifico
   */
  getPassResult(passNumber) {
    return this.passResults.get(passNumber);
  }

  /**
   * Obtiene resumen de la meditacion
   */
  getSummary() {
    const transcendence = this.passResults.get(5);

    return {
      passesCompleted: this.passResults.size,
      totalInsights: this.accumulatedInsights.length,
      insightsByType: this.groupInsightsByType(),
      metaInsight: transcendence?.metaInsight,
      newQuestions: transcendence?.newQuestions?.length || 0,
      futurePaths: transcendence?.futurePaths?.length || 0
    };
  }

  /**
   * Agrupa insights por tipo
   */
  groupInsightsByType() {
    const groups = {};

    for (const insight of this.accumulatedInsights) {
      const type = insight.type || 'unknown';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(insight);
    }

    return groups;
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    this.passResults.clear();
    this.accumulatedInsights = [];
    this.currentPassNumber = 0;
    this.isRunning = false;
    logger.log('[KnowledgeMeditation] Modulo destruido');
  }
}

// Exportar para uso global
window.KnowledgeMeditation = KnowledgeMeditation;
