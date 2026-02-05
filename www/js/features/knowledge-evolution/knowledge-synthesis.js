/**
 * Knowledge Synthesis - Generacion del libro evolucionado
 * @version 1.0.0
 *
 * Responsabilidades:
 *   - Generar "El Nuevo Ser: Sintesis Evolutiva"
 *   - Estructurar el libro en partes coherentes
 *   - Sintetizar 21 practicas esenciales
 *   - Crear glosario evolutivo
 *   - Exportar en multiples formatos
 */

class KnowledgeSynthesis {
  constructor(coordinator) {
    this.coordinator = coordinator;

    // Estructura del libro sintetizado
    this.bookStructure = {
      title: 'El Nuevo Ser: Sintesis Evolutiva',
      subtitle: 'La Evolucion del Conocimiento de la Coleccion Nuevo Ser',
      authors: ['J. Irurtzun Argandoña', 'Claude (Anthropic)'],
      coCreatedWith: 'Knowledge Evolution System',
      parts: [
        {
          id: 'prologo',
          title: 'Prologo: La Evolucion del Conocimiento',
          description: 'Como emerge un libro de la integracion de 18 perspectivas'
        },
        {
          id: 'parte1',
          title: 'PARTE I: El Despertar',
          subtitle: 'Consciencia, presencia y reconocimiento',
          chapters: 5
        },
        {
          id: 'parte2',
          title: 'PARTE II: La Reconexion',
          subtitle: 'Ecologia, relaciones y comunidad',
          chapters: 5
        },
        {
          id: 'parte3',
          title: 'PARTE III: La Accion',
          subtitle: 'Transformacion personal y sistemica',
          chapters: 5
        },
        {
          id: 'parte4',
          title: 'PARTE IV: La Sintesis',
          subtitle: 'Integracion y trascendencia',
          chapters: 6
        },
        {
          id: 'practicas',
          title: '21 Practicas Esenciales',
          description: 'Destiladas de todos los ejercicios de la coleccion'
        },
        {
          id: 'glosario',
          title: 'Glosario Evolutivo',
          description: 'Terminos clave redefinidos desde la sintesis'
        }
      ]
    };

    // Contenido generado
    this.generatedContent = new Map();

    // Practicas esenciales
    this.essentialPractices = [];

    // Glosario
    this.glossary = [];

    // Estado
    this.isGenerating = false;
    this.currentProgress = 0;
  }

  // ==========================================================================
  // GENERACION PRINCIPAL
  // ==========================================================================

  /**
   * Genera el libro sintetizado completo
   */
  async generateSynthesis(onProgress) {
    try {
      logger.log('[KnowledgeSynthesis] Iniciando generacion del libro sintetizado...');
      this.isGenerating = true;

      // Fase 1: Generar prologo (10%)
      await this.generatePrologue();
      if (onProgress) onProgress(10, 'Prologo');

      // Fase 2: Generar Parte I - El Despertar (25%)
      await this.generatePart('parte1');
      if (onProgress) onProgress(25, 'Parte I');

      // Fase 3: Generar Parte II - La Reconexion (40%)
      await this.generatePart('parte2');
      if (onProgress) onProgress(40, 'Parte II');

      // Fase 4: Generar Parte III - La Accion (55%)
      await this.generatePart('parte3');
      if (onProgress) onProgress(55, 'Parte III');

      // Fase 5: Generar Parte IV - La Sintesis (70%)
      await this.generatePart('parte4');
      if (onProgress) onProgress(70, 'Parte IV');

      // Fase 6: Sintetizar practicas (85%)
      await this.synthesizePractices();
      if (onProgress) onProgress(85, 'Practicas');

      // Fase 7: Crear glosario (95%)
      await this.createGlossary();
      if (onProgress) onProgress(95, 'Glosario');

      // Fase 8: Ensamblar libro completo
      this.assembleBook();
      if (onProgress) onProgress(100, 'Completado');

      this.isGenerating = false;
      logger.log('[KnowledgeSynthesis] Libro sintetizado generado exitosamente');

      return {
        success: true,
        book: this.getBook(),
        stats: this.getStats()
      };
    } catch (error) {
      this.isGenerating = false;
      logger.error('[KnowledgeSynthesis] Error en generacion:', error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================================================
  // GENERACION DEL PROLOGO
  // ==========================================================================

  /**
   * Genera el prologo del libro sintetizado
   */
  async generatePrologue() {
    const meditation = this.coordinator.meditationModule;
    const transcendence = meditation?.getPassResult(5);
    const metaInsight = transcendence?.metaInsight;

    const prologue = {
      id: 'prologo',
      title: 'Prologo: La Evolucion del Conocimiento',
      epigraph: {
        text: 'Todo lo que un ser humano ha pensado, otros pueden pensarlo de nuevo.',
        author: 'Albert Einstein'
      },
      content: this.composePrologueContent(metaInsight),
      closingQuestion: '¿Que emerge cuando 18 perspectivas dialogan entre si?'
    };

    this.generatedContent.set('prologo', prologue);
    return prologue;
  }

  /**
   * Compone el contenido del prologo
   */
  composePrologueContent(metaInsight) {
    const stats = this.coordinator.getState();

    let content = `## Un Libro que Nace de Muchos Libros

Lo que sostienes no es un libro ordinario. Es el resultado de un proceso extraordinario: la lectura profunda, el analisis sistematico y la integracion creativa de 18 libros que conforman la Coleccion Nuevo Ser.

Este no es un resumen. No es una compilacion. Es algo diferente: una **sintesis evolutiva** donde el conocimiento disperso en miles de paginas converge, dialoga y trasciende sus formas originales para revelar patrones y posibilidades que ninguno de los libros individuales contenia.

## El Proceso de Evolucion

La creacion de este libro siguio un proceso de cinco fases que llamamos "meditacion sobre el conocimiento":

1. **Comprension**: Lectura profunda de cada uno de los ${stats.corpus?.booksLoaded || 18} libros, extrayendo su mensaje esencial.

2. **Conexion**: Identificacion de los hilos que atraviesan todos los textos, los temas que aparecen una y otra vez bajo diferentes formas.

3. **Profundizacion**: Exploracion de las tensiones y paradojas donde los textos parecen contradecirse, buscando la verdad mas profunda que subyace a las aparentes contradicciones.

4. **Integracion**: Sintesis de las multiples perspectivas en una vision coherente que honra la complejidad sin perderse en ella.

5. **Trascendencia**: Emergencia de insights nuevos que no estaban en ninguno de los textos originales pero que surgieron de su dialogo.

## Lo que Encontraras

Este libro esta organizado en cuatro partes que reflejan el viaje del despertar:

**Parte I: El Despertar** explora la naturaleza de la consciencia, la presencia y el reconocimiento de quien verdaderamente somos.

**Parte II: La Reconexion** aborda nuestra relacion con la naturaleza, los otros seres y la comunidad de la vida.

**Parte III: La Accion** presenta las herramientas para la transformacion personal y sistemica.

**Parte IV: La Sintesis** integra todas las dimensiones en una vision unificada del Nuevo Ser.

Ademas, encontraras **21 Practicas Esenciales** destiladas de los mas de ${stats.corpus?.totalExercises || 100} ejercicios de la coleccion, y un **Glosario Evolutivo** que redefine los terminos clave desde la perspectiva de la sintesis.

## Una Invitacion

${metaInsight?.invitation || 'El siguiente paso no es leer mas, sino encarnar lo comprendido.'}

Este libro no pretende reemplazar a los 18 que lo originaron. Cada uno de ellos tiene su propia sabiduria, su propio ritmo, su propia profundidad. Esta sintesis es una puerta de entrada, un mapa del territorio, una invitacion a explorar mas profundamente.

Que este texto te sirva como compañero en el viaje hacia el Nuevo Ser que ya eres.`;

    return content;
  }

  // ==========================================================================
  // GENERACION DE PARTES
  // ==========================================================================

  /**
   * Genera una parte del libro
   */
  async generatePart(partId) {
    const partConfig = this.bookStructure.parts.find(p => p.id === partId);
    if (!partConfig) return null;

    const part = {
      id: partId,
      title: partConfig.title,
      subtitle: partConfig.subtitle,
      chapters: []
    };

    // Determinar temas para esta parte
    const themes = this.getThemesForPart(partId);

    // Generar capitulos
    const numChapters = partConfig.chapters || 5;
    for (let i = 0; i < numChapters; i++) {
      const theme = themes[i % themes.length];
      const chapter = await this.generateChapter(partId, i + 1, theme);
      part.chapters.push(chapter);
    }

    this.generatedContent.set(partId, part);
    return part;
  }

  /**
   * Obtiene los temas relevantes para una parte
   */
  getThemesForPart(partId) {
    const themeMapping = {
      'parte1': ['consciencia', 'ia-humano'], // El Despertar
      'parte2': ['ecologia', 'relaciones'],   // La Reconexion
      'parte3': ['accion', 'creatividad'],    // La Accion
      'parte4': ['consciencia', 'ecologia', 'accion', 'relaciones', 'creatividad', 'ia-humano'] // La Sintesis
    };

    const themeIds = themeMapping[partId] || ['consciencia'];
    const analysisThemes = this.coordinator.analysis.themes || [];

    return themeIds.map(id => {
      const found = analysisThemes.find(t => t.id === id);
      return found || { id, name: id.charAt(0).toUpperCase() + id.slice(1), topTerms: [] };
    });
  }

  /**
   * Genera un capitulo individual
   */
  async generateChapter(partId, chapterNumber, theme) {
    const chapterTitles = this.getChapterTitles(partId);
    const title = chapterTitles[chapterNumber - 1] || `Capitulo ${chapterNumber}`;

    // Obtener contenido relevante del corpus
    const relevantContent = this.gatherRelevantContent(theme);

    // Generar epigraph
    const epigraph = this.selectEpigraph(theme);

    // Generar contenido
    const content = this.composeChapterContent(partId, chapterNumber, theme, relevantContent);

    // Generar pregunta de cierre
    const closingQuestion = this.generateClosingQuestion(theme);

    return {
      id: `${partId}-cap${chapterNumber}`,
      title,
      epigraph,
      content,
      closingQuestion,
      sourceTheme: theme.id,
      exercises: [] // Se agregan desde las practicas
    };
  }

  /**
   * Obtiene titulos de capitulos para cada parte
   */
  getChapterTitles(partId) {
    const titles = {
      'parte1': [
        'El Observador y lo Observado',
        'La Naturaleza de la Mente',
        'Presencia: El Eterno Ahora',
        'Inteligencia Mas Alla del Cerebro',
        'El Despertar como Proceso Evolutivo'
      ],
      'parte2': [
        'La Tierra como Organismo Vivo',
        'Redes de Interdependencia',
        'Comunidad: Del Yo al Nosotros',
        'Comunicacion Profunda',
        'Amor como Fuerza Evolutiva'
      ],
      'parte3': [
        'Accion Consciente',
        'Simplicidad Radical',
        'Creatividad Transformadora',
        'Herramientas para el Cambio',
        'Transicion Personal y Sistemica'
      ],
      'parte4': [
        'La Vision Integrada',
        'Paradojas del Camino',
        'Humano y Maquina: Una Nueva Alianza',
        'El Nuevo Ser Emergente',
        'Hacia el Futuro',
        'Epilogo: El Viaje Continua'
      ]
    };

    return titles[partId] || [];
  }

  /**
   * Recopila contenido relevante del corpus para un tema
   */
  gatherRelevantContent(theme) {
    const relevant = [];
    const analysis = this.coordinator.analysisModule;
    const ingestion = this.coordinator.ingestionModule;

    if (!analysis || !ingestion) return relevant;

    // Buscar capitulos con este tema
    for (const [chapterId, cached] of analysis.analysisCache) {
      if (cached.categories?.includes(theme.id)) {
        const chapter = ingestion.index.byChapter.get(chapterId);
        if (chapter) {
          relevant.push({
            chapterId,
            bookId: chapter.bookId,
            title: chapter.title,
            contentPreview: chapter.content?.substring(0, 500),
            keyPhrases: cached.keyPhrases
          });
        }
      }
    }

    return relevant.slice(0, 10); // Limitar a 10 fuentes
  }

  /**
   * Selecciona un epigraph apropiado para el tema
   */
  selectEpigraph(theme) {
    const epigraphs = {
      'consciencia': {
        text: 'La consciencia es el gran milagro de la existencia.',
        author: 'Thomas Nagel'
      },
      'ecologia': {
        text: 'Somos parte de la tierra y ella es parte de nosotros.',
        author: 'Jefe Seattle'
      },
      'accion': {
        text: 'Se el cambio que quieres ver en el mundo.',
        author: 'Mahatma Gandhi'
      },
      'relaciones': {
        text: 'El amor es el unico camino hacia la comprension del otro.',
        author: 'Martin Buber'
      },
      'creatividad': {
        text: 'La creatividad es la inteligencia divirtiendose.',
        author: 'Albert Einstein'
      },
      'ia-humano': {
        text: 'El futuro pertenece a quienes creen en la belleza de sus sueños.',
        author: 'Eleanor Roosevelt'
      }
    };

    return epigraphs[theme.id] || {
      text: 'Todo camino comienza con un primer paso.',
      author: 'Lao Tzu'
    };
  }

  /**
   * Compone el contenido de un capitulo
   */
  composeChapterContent(partId, chapterNumber, theme, relevantContent) {
    const themeName = theme.name || theme.id;
    const topTerms = theme.topTerms?.slice(0, 5) || [];

    // Obtener insights de la meditacion
    const meditation = this.coordinator.meditationModule;
    const insights = meditation?.accumulatedInsights?.filter(i =>
      i.source?.includes(theme.id)
    ) || [];

    let content = `### ${themeName}\n\n`;

    // Introduccion basada en el tema
    content += this.generateThemeIntroduction(theme) + '\n\n';

    // Desarrollo basado en contenido relevante
    if (relevantContent.length > 0) {
      content += '### Voces de la Coleccion\n\n';
      content += this.synthesizeRelevantContent(relevantContent) + '\n\n';
    }

    // Conceptos clave
    if (topTerms.length > 0) {
      content += '### Conceptos Clave\n\n';
      content += topTerms.map(t => `- **${t}**`).join('\n') + '\n\n';
    }

    // Insights de la meditacion
    if (insights.length > 0) {
      content += '### Insights Emergentes\n\n';
      for (const insight of insights.slice(0, 3)) {
        content += `*${insight.content}*\n\n`;
      }
    }

    // Reflexion practica
    content += '### Hacia la Practica\n\n';
    content += this.generatePracticalReflection(theme) + '\n\n';

    return content;
  }

  /**
   * Genera introduccion para un tema
   */
  generateThemeIntroduction(theme) {
    const introductions = {
      'consciencia': 'La consciencia es el fundamento de toda experiencia. Sin ella, no habria universo conocido, ' +
                     'ni amor, ni sufrimiento, ni busqueda de sentido. Comprender la consciencia es comprendernos a nosotros mismos.',
      'ecologia': 'No somos seres separados del mundo natural, sino expresiones de la vida misma. ' +
                  'La crisis ecologica es, en su raiz, una crisis de percepcion: hemos olvidado que pertenecemos a la Tierra.',
      'accion': 'El conocimiento sin accion es esteril. La accion sin conocimiento es ciega. ' +
                'La transformacion emerge de la union de comprension profunda y compromiso apasionado.',
      'relaciones': 'Existimos en relacion. Nuestra identidad se teje en el encuentro con otros. ' +
                    'Sanar las relaciones es sanar el mundo.',
      'creatividad': 'La creatividad no es un don reservado para artistas. Es la capacidad fundamental ' +
                     'de responder de forma nueva a la vida, de crear posibilidades donde antes no las habia.',
      'ia-humano': 'En este momento de la historia, dos formas de inteligencia se encuentran: la biologica, ' +
                   'forjada por miles de millones de años de evolucion, y la artificial, creada en apenas decadas. ' +
                   'El futuro dependera de como aprendamos a colaborar.'
    };

    return introductions[theme.id] || `El tema de ${theme.name} atraviesa toda la coleccion, revelando aspectos fundamentales del Nuevo Ser.`;
  }

  /**
   * Sintetiza contenido relevante de multiples fuentes
   */
  synthesizeRelevantContent(relevantContent) {
    if (relevantContent.length === 0) return '';

    let synthesis = '';

    // Agrupar por libro
    const byBook = new Map();
    for (const item of relevantContent) {
      if (!byBook.has(item.bookId)) {
        byBook.set(item.bookId, []);
      }
      byBook.get(item.bookId).push(item);
    }

    for (const [bookId, items] of byBook) {
      const book = this.coordinator.corpus.books.get(bookId);
      const bookTitle = book?.title || bookId;

      synthesis += `**Desde "${bookTitle}":**\n\n`;

      for (const item of items.slice(0, 2)) {
        if (item.keyPhrases?.length > 0) {
          synthesis += `- ${item.keyPhrases[0]}\n`;
        }
      }
      synthesis += '\n';
    }

    return synthesis;
  }

  /**
   * Genera reflexion practica para un tema
   */
  generatePracticalReflection(theme) {
    const reflections = {
      'consciencia': 'Dedica unos minutos cada dia a simplemente ser consciente de ser consciente. ' +
                     'Observa como el observador y lo observado son aspectos de una misma realidad.',
      'ecologia': 'Sal a la naturaleza. Siente el suelo bajo tus pies. Respira el aire que los arboles te regalan. ' +
                  'Recuerda que eres parte de este tejido de vida.',
      'accion': 'Identifica una accion concreta que puedas realizar hoy y que este alineada con tus valores mas profundos. ' +
                'No esperes a tener todo claro; la claridad emerge de la accion.',
      'relaciones': 'Practica la escucha profunda con alguien cercano. Escucha no solo sus palabras, ' +
                    'sino el ser que habla detras de las palabras.',
      'creatividad': 'Permite que algo nuevo emerja hoy. No tiene que ser grande ni perfecto. ' +
                     'Simplemente deja que la vida se exprese a traves de ti de una forma que nunca antes habia tomado.',
      'ia-humano': 'Reflexiona sobre tu relacion con la tecnologia. ¿Te sirve o te esclaviza? ' +
                   '¿Como podrias usarla de forma mas consciente y al servicio de la vida?'
    };

    return reflections[theme.id] || 'Toma un momento para integrar lo leido. ¿Que resuena contigo? ¿Que te invita a explorar mas profundamente?';
  }

  /**
   * Genera pregunta de cierre para un capitulo
   */
  generateClosingQuestion(theme) {
    const questions = {
      'consciencia': '¿Quien es el que pregunta quien soy?',
      'ecologia': '¿Como vivir de forma que la Tierra celebre tu existencia?',
      'accion': '¿Cual es la accion que solo tu puedes realizar en este momento del mundo?',
      'relaciones': '¿Que seria posible si realmente vieras al otro como a ti mismo?',
      'creatividad': '¿Que quiere nacer a traves de ti?',
      'ia-humano': '¿Como podemos crear juntos un futuro que honre a todos los seres?'
    };

    return questions[theme.id] || '¿Que descubrimiento te invita a profundizar?';
  }

  // ==========================================================================
  // SINTESIS DE PRACTICAS
  // ==========================================================================

  /**
   * Sintetiza las 21 practicas esenciales
   */
  async synthesizePractices() {
    const ingestion = this.coordinator.ingestionModule;
    if (!ingestion) return;

    // Obtener todos los ejercicios
    const allExercises = ingestion.getAllExercises();
    logger.log(`[KnowledgeSynthesis] Procesando ${allExercises.length} ejercicios para sintesis`);

    // Categorizar ejercicios
    const categorized = this.categorizeExercises(allExercises);

    // Seleccionar y sintetizar las 21 practicas esenciales
    this.essentialPractices = this.selectEssentialPractices(categorized);

    // Guardar en estructura del libro
    this.generatedContent.set('practicas', {
      id: 'practicas',
      title: '21 Practicas Esenciales',
      description: 'Destiladas de todos los ejercicios de la coleccion',
      practices: this.essentialPractices
    });

    return this.essentialPractices;
  }

  /**
   * Categoriza ejercicios por tipo
   */
  categorizeExercises(exercises) {
    const categories = {
      meditacion: [],
      contemplacion: [],
      accion: [],
      relacional: [],
      creativo: [],
      corporal: [],
      naturaleza: []
    };

    for (const exercise of exercises) {
      const titleLower = (exercise.title || '').toLowerCase();
      const descLower = (exercise.description || '').toLowerCase();
      const combined = titleLower + ' ' + descLower;

      if (combined.includes('medita') || combined.includes('respirac') || combined.includes('silencio')) {
        categories.meditacion.push(exercise);
      } else if (combined.includes('contempl') || combined.includes('observ') || combined.includes('reflexion')) {
        categories.contemplacion.push(exercise);
      } else if (combined.includes('accion') || combined.includes('compromiso') || combined.includes('hacer')) {
        categories.accion.push(exercise);
      } else if (combined.includes('dialogo') || combined.includes('comunicacion') || combined.includes('relacion')) {
        categories.relacional.push(exercise);
      } else if (combined.includes('creativ') || combined.includes('arte') || combined.includes('expresion')) {
        categories.creativo.push(exercise);
      } else if (combined.includes('cuerpo') || combined.includes('movimiento') || combined.includes('sensacion')) {
        categories.corporal.push(exercise);
      } else if (combined.includes('naturaleza') || combined.includes('tierra') || combined.includes('bosque')) {
        categories.naturaleza.push(exercise);
      } else {
        categories.contemplacion.push(exercise); // Default
      }
    }

    return categories;
  }

  /**
   * Selecciona las 21 practicas esenciales
   */
  selectEssentialPractices(categorized) {
    const practices = [];
    let practiceNumber = 1;

    // 3 practicas de cada categoria (7 categorias x 3 = 21)
    for (const [category, exercises] of Object.entries(categorized)) {
      const selected = exercises.slice(0, 3);

      for (const exercise of selected) {
        practices.push({
          number: practiceNumber++,
          category,
          title: exercise.title,
          duration: exercise.duration,
          description: exercise.description,
          steps: exercise.steps,
          reflection: exercise.reflection,
          sourceBook: exercise.bookId,
          originalId: exercise.id
        });

        if (practiceNumber > 21) break;
      }

      if (practiceNumber > 21) break;
    }

    // Si no hay suficientes, rellenar con practicas genericas
    while (practices.length < 21) {
      practices.push(this.generateGenericPractice(practices.length + 1));
    }

    return practices;
  }

  /**
   * Genera una practica generica si faltan
   */
  generateGenericPractice(number) {
    const genericPractices = [
      {
        title: 'Respiracion Consciente',
        category: 'meditacion',
        duration: '5-10 minutos',
        description: 'Practica fundamental de atencion a la respiracion',
        steps: ['Sientate comodo', 'Cierra los ojos', 'Observa tu respiracion sin modificarla'],
        reflection: '¿Que notas cuando simplemente respiras con atencion?'
      },
      {
        title: 'Caminar Consciente',
        category: 'corporal',
        duration: '15-20 minutos',
        description: 'Meditacion en movimiento conectando con la tierra',
        steps: ['Camina lentamente', 'Siente cada paso', 'Permanece presente'],
        reflection: '¿Como cambia tu experiencia cuando caminas con plena atencion?'
      },
      {
        title: 'Escucha Profunda',
        category: 'relacional',
        duration: '20-30 minutos',
        description: 'Practica de escuchar sin juzgar ni preparar respuesta',
        steps: ['Escucha a alguien', 'No interrumpas', 'Refleja lo escuchado'],
        reflection: '¿Que surge cuando realmente escuchas?'
      }
    ];

    const base = genericPractices[(number - 1) % genericPractices.length];
    return {
      number,
      ...base,
      sourceBook: 'sintesis',
      originalId: `sintesis-${number}`
    };
  }

  // ==========================================================================
  // CREACION DEL GLOSARIO
  // ==========================================================================

  /**
   * Crea el glosario evolutivo
   */
  async createGlossary() {
    const analysis = this.coordinator.analysisModule;
    if (!analysis) return;

    // Obtener conceptos mas frecuentes
    const topConcepts = Array.from(analysis.extractedConcepts.entries())
      .sort((a, b) => b[1].occurrences.length - a[1].occurrences.length)
      .slice(0, 50);

    this.glossary = topConcepts.map(([term, data]) => ({
      term,
      definition: this.generateConceptDefinition(term, data),
      occurrences: data.occurrences.length,
      categories: Array.from(data.categories),
      relatedTerms: this.getRelatedTermsForGlossary(term, analysis)
    }));

    // Ordenar alfabeticamente
    this.glossary.sort((a, b) => a.term.localeCompare(b.term));

    // Guardar en estructura del libro
    this.generatedContent.set('glosario', {
      id: 'glosario',
      title: 'Glosario Evolutivo',
      description: 'Terminos clave redefinidos desde la perspectiva de la sintesis',
      entries: this.glossary
    });

    return this.glossary;
  }

  /**
   * Genera definicion para un concepto
   */
  generateConceptDefinition(term, data) {
    // Definiciones personalizadas para terminos clave
    const customDefinitions = {
      'consciencia': 'La capacidad fundamental del universo de conocerse a si mismo. No un epifenomeno del cerebro, sino la condicion de posibilidad de toda experiencia.',
      'despertar': 'El proceso de reconocer nuestra verdadera naturaleza mas alla de las identificaciones limitadas. Un movimiento evolutivo de la consciencia.',
      'ecologia': 'La ciencia de las relaciones. En sentido profundo, el reconocimiento de nuestra pertenencia al tejido de la vida.',
      'transformacion': 'El cambio fundamental en la estructura de la consciencia y la accion. No mejora gradual, sino salto cualitativo.',
      'integracion': 'La union de aspectos aparentemente separados en una totalidad coherente. El movimiento de la fragmentacion a la plenitud.',
      'comunidad': 'El campo de relaciones donde el individuo encuentra su plena expresion. No la masa, sino el nosotros consciente.',
      'practica': 'La encarnacion del conocimiento. El puente entre comprension y transformacion.',
      'amor': 'La fuerza fundamental que une todo lo existente. No solo emocion, sino energia cosmica de conexion.',
      'simplicidad': 'La elegancia de lo esencial. No carencia, sino plenitud sin exceso.',
      'creatividad': 'La capacidad de la vida de expresarse de formas siempre nuevas. El universo creandose a si mismo a traves de nosotros.'
    };

    if (customDefinitions[term]) {
      return customDefinitions[term];
    }

    // Generar definicion basada en categorias
    const categories = Array.from(data.categories);
    if (categories.length > 0) {
      return `Concepto central relacionado con ${categories.join(' y ')}. Aparece en ${data.occurrences.length} contextos de la coleccion.`;
    }

    return `Termino recurrente en la coleccion con ${data.occurrences.length} apariciones.`;
  }

  /**
   * Obtiene terminos relacionados para el glosario
   */
  getRelatedTermsForGlossary(term, analysis) {
    const related = analysis.getRelatedConcepts(term, 5);
    return related.map(r => r.term);
  }

  // ==========================================================================
  // ENSAMBLAJE DEL LIBRO
  // ==========================================================================

  /**
   * Ensambla el libro completo
   */
  assembleBook() {
    const book = {
      title: this.bookStructure.title,
      subtitle: this.bookStructure.subtitle,
      authors: this.bookStructure.authors,
      coCreatedWith: this.bookStructure.coCreatedWith,
      generatedAt: Date.now(),
      sourceCollection: 'Coleccion Nuevo Ser',
      sourceBooksCount: this.coordinator.corpus.books.size,
      sections: []
    };

    // Agregar prologo
    const prologue = this.generatedContent.get('prologo');
    if (prologue) {
      book.sections.push({
        id: 'prologo',
        title: prologue.title,
        chapters: [prologue]
      });
    }

    // Agregar partes
    for (const partId of ['parte1', 'parte2', 'parte3', 'parte4']) {
      const part = this.generatedContent.get(partId);
      if (part) {
        book.sections.push({
          id: part.id,
          title: part.title,
          subtitle: part.subtitle,
          chapters: part.chapters
        });
      }
    }

    // Agregar practicas
    const practicas = this.generatedContent.get('practicas');
    if (practicas) {
      book.sections.push({
        id: 'practicas',
        title: practicas.title,
        type: 'practices',
        practices: practicas.practices
      });
    }

    // Agregar glosario
    const glosario = this.generatedContent.get('glosario');
    if (glosario) {
      book.sections.push({
        id: 'glosario',
        title: glosario.title,
        type: 'glossary',
        entries: glosario.entries
      });
    }

    // Guardar en coordinador
    this.coordinator.synthesis.content = book;
    this.coordinator.synthesis.practices = this.essentialPractices;
    this.coordinator.synthesis.glossary = this.glossary;

    return book;
  }

  // ==========================================================================
  // EXPORTACION
  // ==========================================================================

  /**
   * Exporta el libro sintetizado
   */
  async export(format = 'json') {
    const book = this.getBook();
    if (!book) {
      throw new Error('No hay libro generado para exportar');
    }

    switch (format) {
      case 'json':
        return this.exportJSON(book);
      case 'markdown':
        return this.exportMarkdown(book);
      case 'html':
        return this.exportHTML(book);
      default:
        throw new Error(`Formato no soportado: ${format}`);
    }
  }

  /**
   * Exporta como JSON
   */
  exportJSON(book) {
    return {
      format: 'json',
      content: JSON.stringify(book, null, 2),
      filename: 'nuevo-ser-sintesis-evolutiva.json'
    };
  }

  /**
   * Exporta como Markdown
   */
  exportMarkdown(book) {
    let markdown = `# ${book.title}\n\n`;
    markdown += `*${book.subtitle}*\n\n`;
    markdown += `Autores: ${book.authors.join(', ')}\n\n`;
    markdown += `---\n\n`;

    for (const section of book.sections) {
      markdown += `## ${section.title}\n\n`;

      if (section.subtitle) {
        markdown += `*${section.subtitle}*\n\n`;
      }

      if (section.chapters) {
        for (const chapter of section.chapters) {
          markdown += `### ${chapter.title}\n\n`;

          if (chapter.epigraph) {
            markdown += `> "${chapter.epigraph.text}"\n> — ${chapter.epigraph.author}\n\n`;
          }

          if (chapter.content) {
            markdown += `${chapter.content}\n\n`;
          }

          if (chapter.closingQuestion) {
            markdown += `**Pregunta de cierre:** *${chapter.closingQuestion}*\n\n`;
          }

          markdown += `---\n\n`;
        }
      }

      if (section.practices) {
        for (const practice of section.practices) {
          markdown += `### Practica ${practice.number}: ${practice.title}\n\n`;
          markdown += `**Duracion:** ${practice.duration}\n\n`;
          markdown += `${practice.description}\n\n`;

          if (practice.steps?.length > 0) {
            markdown += `**Pasos:**\n`;
            for (const step of practice.steps) {
              markdown += `- ${step}\n`;
            }
            markdown += '\n';
          }

          if (practice.reflection) {
            markdown += `**Reflexion:** ${practice.reflection}\n\n`;
          }

          markdown += `---\n\n`;
        }
      }

      if (section.entries) {
        for (const entry of section.entries) {
          markdown += `**${entry.term}**: ${entry.definition}\n\n`;
        }
      }
    }

    return {
      format: 'markdown',
      content: markdown,
      filename: 'nuevo-ser-sintesis-evolutiva.md'
    };
  }

  /**
   * Exporta como HTML
   */
  exportHTML(book) {
    const markdown = this.exportMarkdown(book).content;

    // Conversion basica de markdown a HTML
    let html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${book.title}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1 { color: #1e3a5f; }
    h2 { color: #2d5986; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
    h3 { color: #3d7ab8; }
    blockquote { border-left: 3px solid #ccc; padding-left: 20px; color: #666; font-style: italic; }
    hr { border: none; border-top: 1px solid #eee; margin: 30px 0; }
  </style>
</head>
<body>
${this.markdownToHTML(markdown)}
</body>
</html>`;

    return {
      format: 'html',
      content: html,
      filename: 'nuevo-ser-sintesis-evolutiva.html'
    };
  }

  /**
   * Conversion basica de Markdown a HTML
   */
  markdownToHTML(markdown) {
    return markdown
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^\> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^---$/gm, '<hr>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, '<p>$1</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<h[123]>)/g, '$1')
      .replace(/(<\/h[123]>)<\/p>/g, '$1')
      .replace(/<p>(<blockquote>)/g, '$1')
      .replace(/(<\/blockquote>)<\/p>/g, '$1')
      .replace(/<p>(<li>)/g, '<ul>$1')
      .replace(/(<\/li>)<\/p>/g, '$1</ul>')
      .replace(/<p>(<hr>)/g, '$1')
      .replace(/(<hr>)<\/p>/g, '$1');
  }

  // ==========================================================================
  // ACCESO A DATOS
  // ==========================================================================

  /**
   * Obtiene el libro generado
   */
  getBook() {
    return this.coordinator.synthesis.content;
  }

  /**
   * Obtiene estadisticas de la sintesis
   */
  getStats() {
    const book = this.getBook();
    if (!book) return null;

    let totalChapters = 0;
    let totalPractices = 0;
    let totalGlossaryEntries = 0;

    for (const section of book.sections || []) {
      if (section.chapters) {
        totalChapters += section.chapters.length;
      }
      if (section.practices) {
        totalPractices += section.practices.length;
      }
      if (section.entries) {
        totalGlossaryEntries += section.entries.length;
      }
    }

    return {
      sectionsCount: book.sections?.length || 0,
      chaptersCount: totalChapters,
      practicesCount: totalPractices,
      glossaryEntriesCount: totalGlossaryEntries,
      sourceBooksCount: book.sourceBooksCount,
      generatedAt: book.generatedAt
    };
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    this.generatedContent.clear();
    this.essentialPractices = [];
    this.glossary = [];
    this.isGenerating = false;
    logger.log('[KnowledgeSynthesis] Modulo destruido');
  }
}

// Exportar para uso global
window.KnowledgeSynthesis = KnowledgeSynthesis;
