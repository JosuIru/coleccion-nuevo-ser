/**
 * Knowledge Analysis - Extraccion de conceptos y analisis tematico
 * @version 1.0.0
 *
 * Responsabilidades:
 *   - Extraer conceptos clave por capitulo (usando IA)
 *   - Identificar temas transversales
 *   - Crear grafo de conexiones entre libros
 *   - Detectar tensiones y paradojas
 *   - Clasificar por categorias tematicas
 */

class KnowledgeAnalysis {
  constructor(coordinator) {
    this.coordinator = coordinator;

    // Categorias tematicas predefinidas
    this.thematicCategories = [
      {
        id: 'consciencia',
        name: 'Consciencia y Despertar',
        keywords: ['consciencia', 'despertar', 'meditacion', 'atencion', 'presencia', 'mindfulness', 'observador', 'testigo']
      },
      {
        id: 'ecologia',
        name: 'Ecologia y Reconexion',
        keywords: ['ecologia', 'naturaleza', 'tierra', 'gaia', 'biosfera', 'reconexion', 'interdependencia', 'vida']
      },
      {
        id: 'accion',
        name: 'Accion Transformadora',
        keywords: ['accion', 'cambio', 'transformacion', 'revolucion', 'transicion', 'movimiento', 'praxis', 'compromiso']
      },
      {
        id: 'relaciones',
        name: 'Relaciones y Comunidad',
        keywords: ['relaciones', 'comunidad', 'amor', 'vinculo', 'tribu', 'colectivo', 'comunicacion', 'empatia']
      },
      {
        id: 'creatividad',
        name: 'Creatividad y Simplicidad',
        keywords: ['creatividad', 'arte', 'simplicidad', 'minimalismo', 'esencial', 'flujo', 'expresion', 'juego']
      },
      {
        id: 'ia-humano',
        name: 'Integracion IA-Humano',
        keywords: ['inteligencia artificial', 'ia', 'maquina', 'algoritmo', 'tecnologia', 'singularidad', 'simbiosis', 'coevolucion']
      }
    ];

    // Conceptos extraidos
    this.extractedConcepts = new Map();

    // Conexiones entre conceptos
    this.conceptConnections = [];

    // Tensiones identificadas
    this.identifiedTensions = [];

    // Cache de analisis por capitulo
    this.analysisCache = new Map();
  }

  // ==========================================================================
  // ANALISIS PRINCIPAL
  // ==========================================================================

  /**
   * Analiza todo el corpus
   */
  async analyzeCorpus(onProgress) {
    try {
      logger.log('[KnowledgeAnalysis] Iniciando analisis del corpus...');

      const ingestion = this.coordinator.ingestionModule;
      const chapters = Array.from(ingestion.index.byChapter.values());
      const totalChapters = chapters.length;

      let processedCount = 0;

      // Fase 1: Extraer conceptos de cada capitulo
      for (const chapter of chapters) {
        await this.analyzeChapter(chapter);

        processedCount++;
        const progress = Math.round((processedCount / totalChapters) * 50); // 50% para extraccion

        if (onProgress) {
          onProgress(progress);
        }
      }

      // Fase 2: Identificar temas transversales
      this.identifyThemes();
      if (onProgress) onProgress(60);

      // Fase 3: Construir grafo de conexiones
      this.buildConnectionGraph();
      if (onProgress) onProgress(80);

      // Fase 4: Detectar tensiones y paradojas
      await this.detectTensions();
      if (onProgress) onProgress(95);

      // Guardar resultados en coordinador
      this.saveResults();
      if (onProgress) onProgress(100);

      logger.log(`[KnowledgeAnalysis] Analisis completado: ${this.extractedConcepts.size} conceptos, ${this.coordinator.analysis.themes.length} temas`);

      return {
        success: true,
        concepts: this.extractedConcepts.size,
        themes: this.coordinator.analysis.themes.length,
        connections: this.conceptConnections.length,
        tensions: this.identifiedTensions.length
      };
    } catch (error) {
      logger.error('[KnowledgeAnalysis] Error en analisis:', error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================================================
  // EXTRACCION DE CONCEPTOS
  // ==========================================================================

  /**
   * Analiza un capitulo individual
   */
  async analyzeChapter(chapter) {
    // Verificar cache
    if (this.analysisCache.has(chapter.id)) {
      return this.analysisCache.get(chapter.id);
    }

    const analysis = {
      chapterId: chapter.id,
      bookId: chapter.bookId,
      title: chapter.title,
      concepts: [],
      categories: [],
      keyPhrases: []
    };

    // Extraer conceptos usando patron local (sin IA por ahora para velocidad)
    const localConcepts = this.extractConceptsLocal(chapter.content);
    analysis.concepts = localConcepts;

    // Clasificar en categorias
    analysis.categories = this.classifyByCategories(chapter.content);

    // Extraer frases clave
    analysis.keyPhrases = this.extractKeyPhrases(chapter.content);

    // Registrar conceptos globalmente
    for (const concept of localConcepts) {
      if (!this.extractedConcepts.has(concept.term)) {
        this.extractedConcepts.set(concept.term, {
          term: concept.term,
          occurrences: [],
          categories: new Set(),
          relatedTerms: new Set()
        });
      }

      const globalConcept = this.extractedConcepts.get(concept.term);
      globalConcept.occurrences.push({
        chapterId: chapter.id,
        bookId: chapter.bookId,
        frequency: concept.frequency
      });

      for (const cat of analysis.categories) {
        globalConcept.categories.add(cat);
      }
    }

    // Guardar en cache
    this.analysisCache.set(chapter.id, analysis);

    return analysis;
  }

  /**
   * Extrae conceptos usando analisis local (sin IA)
   */
  extractConceptsLocal(text) {
    if (!text) return [];

    const concepts = [];
    const textLower = text.toLowerCase();
    const wordFrequency = new Map();

    // Palabras a ignorar (stopwords en espanol)
    const stopwords = new Set([
      'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al',
      'en', 'con', 'por', 'para', 'como', 'que', 'pero', 'si', 'no', 'mas', 'menos',
      'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'aquel',
      'ser', 'es', 'son', 'fue', 'era', 'sera', 'sido', 'siendo',
      'estar', 'esta', 'estan', 'estaba', 'estaban',
      'tener', 'tiene', 'tienen', 'tenia', 'tenian',
      'hacer', 'hace', 'hacen', 'hizo', 'hacia',
      'poder', 'puede', 'pueden', 'podia', 'podian',
      'decir', 'dice', 'dicen', 'dijo', 'decia',
      'ir', 'va', 'van', 'fue', 'iba', 'iban',
      'ver', 've', 'ven', 'vio', 'veia',
      'dar', 'da', 'dan', 'dio', 'daba',
      'saber', 'sabe', 'saben', 'sabia', 'sabían',
      'querer', 'quiere', 'quieren', 'quiso', 'queria',
      'llegar', 'llega', 'llegan', 'llego', 'llegaba',
      'pasar', 'pasa', 'pasan', 'paso', 'pasaba',
      'deber', 'debe', 'deben', 'debía', 'debian',
      'poner', 'pone', 'ponen', 'puso', 'ponía',
      'parecer', 'parece', 'parecen', 'parecio', 'parecia',
      'quedar', 'queda', 'quedan', 'quedo', 'quedaba',
      'creer', 'cree', 'creen', 'creyo', 'creia',
      'hablar', 'habla', 'hablan', 'hablo', 'hablaba',
      'llevar', 'lleva', 'llevan', 'llevo', 'llevaba',
      'dejar', 'deja', 'dejan', 'dejo', 'dejaba',
      'seguir', 'sigue', 'siguen', 'siguio', 'seguia',
      'encontrar', 'encuentra', 'encuentran',
      'llamar', 'llama', 'llaman',
      'venir', 'viene', 'vienen',
      'pensar', 'piensa', 'piensan',
      'salir', 'sale', 'salen',
      'volver', 'vuelve', 'vuelven',
      'tomar', 'toma', 'toman',
      'conocer', 'conoce', 'conocen',
      'vivir', 'vive', 'viven',
      'sentir', 'siente', 'sienten',
      'tratar', 'trata', 'tratan',
      'mirar', 'mira', 'miran',
      'contar', 'cuenta', 'cuentan',
      'empezar', 'empieza', 'empiezan',
      'esperar', 'espera', 'esperan',
      'buscar', 'busca', 'buscan',
      'existir', 'existe', 'existen',
      'entrar', 'entra', 'entran',
      'trabajar', 'trabaja', 'trabajan',
      'escribir', 'escribe', 'escriben',
      'perder', 'pierde', 'pierden',
      'producir', 'produce', 'producen',
      'ocurrir', 'ocurre', 'ocurren',
      'entender', 'entiende', 'entienden',
      'pedir', 'pide', 'piden',
      'recibir', 'recibe', 'reciben',
      'recordar', 'recuerda', 'recuerdan',
      'terminar', 'termina', 'terminan',
      'permitir', 'permite', 'permiten',
      'aparecer', 'aparece', 'aparecen',
      'conseguir', 'consigue', 'consiguen',
      'comenzar', 'comienza', 'comienzan',
      'servir', 'sirve', 'sirven',
      'sacar', 'saca', 'sacan',
      'necesitar', 'necesita', 'necesitan',
      'mantener', 'mantiene', 'mantienen',
      'resultar', 'resulta', 'resultan',
      'leer', 'lee', 'leen',
      'caer', 'cae', 'caen',
      'cambiar', 'cambia', 'cambian',
      'presentar', 'presenta', 'presentan',
      'crear', 'crea', 'crean',
      'abrir', 'abre', 'abren',
      'considerar', 'considera', 'consideran',
      'oír', 'oye', 'oyen',
      'acabar', 'acaba', 'acaban',
      'convertir', 'convierte', 'convierten',
      'ganar', 'gana', 'ganan',
      'formar', 'forma', 'forman',
      'traer', 'trae', 'traen',
      'partir', 'parte', 'parten',
      'morir', 'muere', 'mueren',
      'aceptar', 'acepta', 'aceptan',
      'realizar', 'realiza', 'realizan',
      'suponer', 'supone', 'suponen',
      'comprender', 'comprende', 'comprenden',
      'lograr', 'logra', 'logran',
      'explicar', 'explica', 'explican',
      'alcanzar', 'alcanza', 'alcanzan',
      'reconocer', 'reconoce', 'reconocen',
      'todo', 'toda', 'todos', 'todas',
      'otro', 'otra', 'otros', 'otras',
      'mismo', 'misma', 'mismos', 'mismas',
      'nuevo', 'nueva', 'nuevos', 'nuevas',
      'poco', 'poca', 'pocos', 'pocas',
      'mucho', 'mucha', 'muchos', 'muchas',
      'grande', 'grandes', 'pequeno', 'pequena',
      'bueno', 'buena', 'buenos', 'buenas',
      'primer', 'primero', 'primera', 'primeros', 'primeras',
      'ultimo', 'ultima', 'ultimos', 'ultimas',
      'largo', 'larga', 'largos', 'largas',
      'cierto', 'cierta', 'ciertos', 'ciertas',
      'solo', 'sola', 'solos', 'solas',
      'propio', 'propia', 'propios', 'propias',
      'menos', 'tal', 'cual', 'cuales',
      'bien', 'mal', 'mejor', 'peor',
      'muy', 'tan', 'tanto', 'tanta', 'tantos', 'tantas',
      'algo', 'alguien', 'alguno', 'alguna', 'algunos', 'algunas',
      'nada', 'nadie', 'ninguno', 'ninguna', 'ningunos', 'ningunas',
      'cada', 'cualquier', 'cualquiera',
      'donde', 'cuando', 'como', 'porque', 'aunque', 'sino',
      'ya', 'aun', 'todavia', 'siempre', 'nunca', 'jamas',
      'aqui', 'ahi', 'alli', 'alla',
      'hoy', 'ayer', 'manana', 'ahora', 'antes', 'despues',
      'entre', 'sobre', 'bajo', 'ante', 'desde', 'hasta', 'hacia', 'sin', 'segun',
      'durante', 'mediante', 'contra', 'tras',
      'y', 'e', 'o', 'u', 'ni',
      'capitulo', 'parte', 'seccion', 'pagina', 'libro',
      'vez', 'veces', 'cosa', 'cosas', 'manera', 'modo', 'forma',
      'tiempo', 'momento', 'dia', 'ano', 'vida', 'mundo', 'caso',
      'hombre', 'mujer', 'persona', 'personas', 'gente',
      'lugar', 'punto', 'hecho', 'ejemplo', 'razon'
    ]);

    // Extraer palabras y contar frecuencia
    const words = textLower.match(/[a-záéíóúüñ]{4,}/g) || [];

    for (const word of words) {
      if (!stopwords.has(word)) {
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      }
    }

    // Ordenar por frecuencia y tomar los mas relevantes
    const sortedWords = Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);

    for (const [term, frequency] of sortedWords) {
      if (frequency >= 2) { // Minimo 2 ocurrencias
        concepts.push({
          term,
          frequency,
          relevance: Math.min(frequency / 10, 1.0)
        });
      }
    }

    return concepts;
  }

  /**
   * Extrae conceptos usando IA (para analisis profundo)
   */
  async extractConceptsWithAI(text, _bookId) {
    try {
      const aiAdapter = window.aiAdapter || new window.AIAdapter();

      const prompt = `Analiza el siguiente texto de un libro filosofico/espiritual y extrae los 10 conceptos mas importantes.

TEXTO:
${text.substring(0, 3000)}

Responde SOLO con un JSON array de objetos con esta estructura:
[
  {"term": "concepto", "definition": "definicion breve", "relevance": 0.9}
]

Enfocate en conceptos filosoficos, espirituales, cientificos y transformadores.`;

      const systemContext = `Eres un analista de textos filosoficos y espirituales. Tu tarea es extraer conceptos clave con precision academica. Responde SOLO con JSON valido.`;

      const response = await aiAdapter.ask(prompt, systemContext, [], 'knowledge-analysis');

      // Parsear respuesta JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return [];
    } catch (error) {
      logger.error('[KnowledgeAnalysis] Error extrayendo conceptos con IA:', error);
      return [];
    }
  }

  // ==========================================================================
  // CLASIFICACION TEMATICA
  // ==========================================================================

  /**
   * Clasifica texto en categorias tematicas
   */
  classifyByCategories(text) {
    if (!text) return [];

    const textLower = text.toLowerCase();
    const matchedCategories = [];

    for (const category of this.thematicCategories) {
      let score = 0;
      for (const keyword of category.keywords) {
        const regex = new RegExp(keyword, 'gi');
        const matches = textLower.match(regex);
        if (matches) {
          score += matches.length;
        }
      }

      if (score > 0) {
        matchedCategories.push({
          id: category.id,
          name: category.name,
          score
        });
      }
    }

    // Ordenar por score
    matchedCategories.sort((a, b) => b.score - a.score);

    return matchedCategories.slice(0, 3).map(c => c.id);
  }

  /**
   * Extrae frases clave del texto
   */
  extractKeyPhrases(text) {
    if (!text) return [];

    const phrases = [];

    // Buscar frases entre asteriscos (enfatizadas en markdown)
    const emphasisMatches = text.match(/\*([^*]+)\*/g);
    if (emphasisMatches) {
      for (const match of emphasisMatches.slice(0, 5)) {
        phrases.push(match.replace(/\*/g, '').trim());
      }
    }

    // Buscar frases con dos puntos (definiciones)
    const colonMatches = text.match(/([A-ZÁÉÍÓÚÜ][^.!?:]{10,50}):/g);
    if (colonMatches) {
      for (const match of colonMatches.slice(0, 3)) {
        phrases.push(match.replace(':', '').trim());
      }
    }

    return phrases;
  }

  // ==========================================================================
  // IDENTIFICACION DE TEMAS
  // ==========================================================================

  /**
   * Identifica temas transversales en todo el corpus
   */
  identifyThemes() {
    const themes = [];
    const categoryScores = new Map();

    // Calcular scores por categoria
    for (const [term, concept] of this.extractedConcepts) {
      for (const category of concept.categories) {
        const currentScore = categoryScores.get(category) || { count: 0, terms: [] };
        currentScore.count++;
        currentScore.terms.push(term);
        categoryScores.set(category, currentScore);
      }
    }

    // Crear temas a partir de categorias con suficiente presencia
    for (const [categoryId, data] of categoryScores) {
      const category = this.thematicCategories.find(c => c.id === categoryId);
      if (category && data.count >= 5) {
        themes.push({
          id: categoryId,
          name: category.name,
          conceptCount: data.count,
          topTerms: data.terms.slice(0, 10),
          keywords: category.keywords
        });
      }
    }

    // Ordenar por relevancia
    themes.sort((a, b) => b.conceptCount - a.conceptCount);

    this.coordinator.analysis.themes = themes;
    return themes;
  }

  // ==========================================================================
  // GRAFO DE CONEXIONES
  // ==========================================================================

  /**
   * Construye grafo de conexiones entre conceptos
   */
  buildConnectionGraph() {
    const connections = [];
    const conceptList = Array.from(this.extractedConcepts.entries());

    // Encontrar conexiones basadas en co-ocurrencia en capitulos
    for (let i = 0; i < conceptList.length; i++) {
      for (let j = i + 1; j < conceptList.length; j++) {
        const [termA, conceptA] = conceptList[i];
        const [termB, conceptB] = conceptList[j];

        // Encontrar capitulos compartidos
        const chaptersA = new Set(conceptA.occurrences.map(o => o.chapterId));
        const chaptersB = new Set(conceptB.occurrences.map(o => o.chapterId));

        const sharedChapters = [...chaptersA].filter(c => chaptersB.has(c));

        if (sharedChapters.length >= 2) {
          connections.push({
            source: termA,
            target: termB,
            strength: sharedChapters.length,
            sharedChapters
          });
        }
      }
    }

    // Ordenar por fuerza de conexion y limitar
    connections.sort((a, b) => b.strength - a.strength);
    this.conceptConnections = connections.slice(0, 500);

    this.coordinator.analysis.connections = this.conceptConnections;
    return this.conceptConnections;
  }

  // ==========================================================================
  // DETECCION DE TENSIONES
  // ==========================================================================

  /**
   * Detecta tensiones y paradojas en el corpus
   */
  async detectTensions() {
    const tensions = [];

    // Pares de conceptos potencialmente en tension
    const tensionPairs = [
      ['accion', 'contemplacion'],
      ['individual', 'colectivo'],
      ['tecnologia', 'naturaleza'],
      ['simplicidad', 'complejidad'],
      ['tradicion', 'innovacion'],
      ['razon', 'intuicion'],
      ['ciencia', 'espiritualidad'],
      ['local', 'global'],
      ['urgencia', 'paciencia'],
      ['personal', 'sistemico']
    ];

    for (const [termA, termB] of tensionPairs) {
      const conceptA = this.extractedConcepts.get(termA);
      const conceptB = this.extractedConcepts.get(termB);

      if (conceptA && conceptB) {
        // Verificar si coexisten en los textos
        const chaptersA = new Set(conceptA.occurrences.map(o => o.chapterId));
        const chaptersB = new Set(conceptB.occurrences.map(o => o.chapterId));
        const sharedChapters = [...chaptersA].filter(c => chaptersB.has(c));

        if (sharedChapters.length > 0) {
          tensions.push({
            pole1: termA,
            pole2: termB,
            type: 'dialectica',
            sharedChapters,
            description: `Tension entre ${termA} y ${termB} - aparecen juntos en ${sharedChapters.length} capitulos`
          });
        }
      }
    }

    this.identifiedTensions = tensions;
    this.coordinator.analysis.tensions = tensions;

    return tensions;
  }

  // ==========================================================================
  // GUARDADO DE RESULTADOS
  // ==========================================================================

  /**
   * Guarda resultados en el coordinador
   */
  saveResults() {
    this.coordinator.analysis.concepts = this.extractedConcepts;

    logger.log('[KnowledgeAnalysis] Resultados guardados');
  }

  // ==========================================================================
  // ACCESO A DATOS
  // ==========================================================================

  /**
   * Obtiene el grafo de conceptos para visualizacion
   */
  getConceptGraph() {
    const nodes = Array.from(this.extractedConcepts.entries()).map(([term, data]) => ({
      id: term,
      label: term,
      size: Math.min(data.occurrences.length * 2, 20),
      categories: Array.from(data.categories)
    }));

    const edges = this.conceptConnections.map(c => ({
      source: c.source,
      target: c.target,
      weight: c.strength
    }));

    return { nodes, edges };
  }

  /**
   * Obtiene categorias tematicas con estadisticas
   */
  getThematicCategories() {
    return this.coordinator.analysis.themes;
  }

  /**
   * Busca conceptos relacionados
   */
  getRelatedConcepts(term, limit = 10) {
    const related = [];

    for (const connection of this.conceptConnections) {
      if (connection.source === term) {
        related.push({ term: connection.target, strength: connection.strength });
      } else if (connection.target === term) {
        related.push({ term: connection.source, strength: connection.strength });
      }
    }

    related.sort((a, b) => b.strength - a.strength);
    return related.slice(0, limit);
  }

  /**
   * Obtiene resumen del analisis
   */
  getSummary() {
    return {
      totalConcepts: this.extractedConcepts.size,
      totalThemes: this.coordinator.analysis.themes.length,
      totalConnections: this.conceptConnections.length,
      totalTensions: this.identifiedTensions.length,
      topConcepts: Array.from(this.extractedConcepts.entries())
        .sort((a, b) => b[1].occurrences.length - a[1].occurrences.length)
        .slice(0, 20)
        .map(([term, data]) => ({ term, count: data.occurrences.length })),
      themes: this.coordinator.analysis.themes.map(t => ({ id: t.id, name: t.name, count: t.conceptCount }))
    };
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    this.extractedConcepts.clear();
    this.conceptConnections = [];
    this.identifiedTensions = [];
    this.analysisCache.clear();
    logger.log('[KnowledgeAnalysis] Modulo destruido');
  }
}

// Exportar para uso global
window.KnowledgeAnalysis = KnowledgeAnalysis;
