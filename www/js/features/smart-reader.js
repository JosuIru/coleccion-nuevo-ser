// ============================================================================
// SMART READER - Panel Contextual Inteligente
// ============================================================================
// v2.9.372: Guardar términos favoritos, highlights persistentes
// - Glosario expandido de 75+ términos filosóficos/científicos
// - Contexto histórico detallado
// - Conexiones entre libros de la colección
// - Preguntas de reflexión generadas por IA
// - Biografías de autores citados
// - Citas relacionadas

class SmartReader {
  constructor() {
    this.panelElement = null;
    this.currentChapterId = null;
    this.isEnabled = this.loadPreference();
    this.cachedInsights = {};

    // Diccionario de términos filosóficos/científicos
    this.glossary = this.initGlossary();

    // Conexiones predefinidas entre libros
    this.bookConnections = this.initBookConnections();

    // Biografías de autores
    this.authors = this.initAuthors();

    // Citas por tema
    this.thematicQuotes = this.initThematicQuotes();

    // v2.9.372: Términos guardados y highlights
    this.savedTerms = this.loadSavedTerms();
    this.userHighlights = this.loadUserHighlights();

    // Configuración
    this.config = {
      autoShowPanel: true,
      highlightTerms: true,
      maxReflectionQuestions: 3,
      showAuthorBio: true,
      showRelatedQuotes: true
    };
  }

  // ==========================================================================
  // v2.9.372: TÉRMINOS GUARDADOS
  // ==========================================================================

  loadSavedTerms() {
    try {
      return JSON.parse(localStorage.getItem('smart-reader-saved-terms') || '[]');
    } catch {
      return [];
    }
  }

  saveSavedTerms() {
    localStorage.setItem('smart-reader-saved-terms', JSON.stringify(this.savedTerms));
  }

  /**
   * Guarda un término como favorito
   */
  saveTerm(termKey) {
    if (this.savedTerms.includes(termKey)) {
      window.toast?.info('Término ya guardado');
      return;
    }

    const term = this.glossary[termKey.toLowerCase()];
    if (!term) {
      window.toast?.error('Término no encontrado');
      return;
    }

    this.savedTerms.push(termKey.toLowerCase());
    this.saveSavedTerms();
    window.toast?.success(`"${term.term}" guardado en tu glosario personal`);
  }

  /**
   * Elimina un término de favoritos
   */
  removeSavedTerm(termKey) {
    const index = this.savedTerms.indexOf(termKey.toLowerCase());
    if (index > -1) {
      this.savedTerms.splice(index, 1);
      this.saveSavedTerms();
      window.toast?.info('Término eliminado');
    }
  }

  /**
   * Verifica si un término está guardado
   */
  isTermSaved(termKey) {
    return this.savedTerms.includes(termKey.toLowerCase());
  }

  /**
   * Obtiene todos los términos guardados con su información
   */
  getSavedTermsWithInfo() {
    return this.savedTerms
      .map(key => {
        const term = this.glossary[key];
        return term ? { key, ...term } : null;
      })
      .filter(Boolean);
  }

  /**
   * Muestra modal con términos guardados
   */
  showSavedTermsModal() {
    document.getElementById('saved-terms-modal')?.remove();

    const savedTerms = this.getSavedTermsWithInfo();

    const modal = document.createElement('div');
    modal.id = 'saved-terms-modal';
    modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4';
    modal.innerHTML = `
      <div class="bg-slate-900 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col border border-cyan-500/30">
        <div class="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            📚 Mi Glosario Personal
          </h3>
          <button onclick="document.getElementById('saved-terms-modal')?.remove()"
                  class="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          ${savedTerms.length === 0 ? `
            <div class="text-center py-8 text-gray-500">
              <div class="text-4xl mb-2">📖</div>
              <p>No tienes términos guardados</p>
              <p class="text-sm mt-1">Haz clic en ⭐ junto a cualquier término para guardarlo</p>
            </div>
          ` : `
            <div class="space-y-3">
              ${savedTerms.map(term => `
                <div class="bg-slate-800/50 rounded-xl p-4 group">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1">
                      <h4 class="font-bold text-cyan-300">${term.term}</h4>
                      <p class="text-sm text-gray-300 mt-1">${term.definition}</p>
                      <span class="text-xs text-gray-500 mt-2 inline-block px-2 py-0.5 bg-gray-700 rounded">${term.category}</span>
                    </div>
                    <button onclick="window.smartReader?.removeSavedTerm('${term.key}'); window.smartReader?.showSavedTermsModal()"
                            class="p-2 hover:bg-red-900/50 rounded-lg text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition">
                      🗑️
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div class="p-3 border-t border-gray-700 text-center text-sm text-gray-500">
          ${savedTerms.length} término${savedTerms.length !== 1 ? 's' : ''} guardado${savedTerms.length !== 1 ? 's' : ''}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  // ==========================================================================
  // v2.9.372: HIGHLIGHTS PERSISTENTES
  // ==========================================================================

  loadUserHighlights() {
    try {
      return JSON.parse(localStorage.getItem('smart-reader-highlights') || '{}');
    } catch {
      return {};
    }
  }

  saveUserHighlights() {
    localStorage.setItem('smart-reader-highlights', JSON.stringify(this.userHighlights));
  }

  /**
   * Guarda un highlight del usuario
   */
  addHighlight(bookId, chapterId, text, color = 'yellow') {
    const key = `${bookId}:${chapterId}`;
    if (!this.userHighlights[key]) {
      this.userHighlights[key] = [];
    }

    const highlight = {
      id: `hl-${Date.now()}`,
      text: text.substring(0, 500),
      color,
      createdAt: new Date().toISOString()
    };

    this.userHighlights[key].push(highlight);
    this.saveUserHighlights();

    return highlight;
  }

  /**
   * Elimina un highlight
   */
  removeHighlight(bookId, chapterId, highlightId) {
    const key = `${bookId}:${chapterId}`;
    if (this.userHighlights[key]) {
      this.userHighlights[key] = this.userHighlights[key].filter(h => h.id !== highlightId);
      this.saveUserHighlights();
    }
  }

  /**
   * Obtiene highlights de un capítulo
   */
  getChapterHighlights(bookId, chapterId) {
    const key = `${bookId}:${chapterId}`;
    return this.userHighlights[key] || [];
  }

  /**
   * Obtiene todos los highlights
   */
  getAllHighlights() {
    const all = [];
    for (const [key, highlights] of Object.entries(this.userHighlights)) {
      const [bookId, chapterId] = key.split(':');
      for (const hl of highlights) {
        all.push({ ...hl, bookId, chapterId });
      }
    }
    return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Muestra modal con todos los highlights
   */
  showHighlightsModal() {
    document.getElementById('highlights-modal')?.remove();

    const highlights = this.getAllHighlights();

    const colors = {
      yellow: 'bg-yellow-500/30 border-yellow-500/50',
      green: 'bg-green-500/30 border-green-500/50',
      blue: 'bg-blue-500/30 border-blue-500/50',
      pink: 'bg-pink-500/30 border-pink-500/50'
    };

    const modal = document.createElement('div');
    modal.id = 'highlights-modal';
    modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4';
    modal.innerHTML = `
      <div class="bg-slate-900 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col border border-yellow-500/30">
        <div class="p-4 border-b border-gray-700 flex items-center justify-between">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            🖍️ Mis Subrayados
          </h3>
          <button onclick="document.getElementById('highlights-modal')?.remove()"
                  class="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          ${highlights.length === 0 ? `
            <div class="text-center py-8 text-gray-500">
              <div class="text-4xl mb-2">🖍️</div>
              <p>No tienes subrayados guardados</p>
              <p class="text-sm mt-1">Selecciona texto para subrayar pasajes importantes</p>
            </div>
          ` : `
            <div class="space-y-3">
              ${highlights.map(hl => `
                <div class="rounded-xl p-4 border ${colors[hl.color] || colors.yellow} group">
                  <p class="text-gray-200 text-sm">"${hl.text}"</p>
                  <div class="flex items-center justify-between mt-2">
                    <span class="text-xs text-gray-500">${new Date(hl.createdAt).toLocaleDateString()}</span>
                    <button onclick="window.smartReader?.removeHighlight('${hl.bookId}', '${hl.chapterId}', '${hl.id}'); window.smartReader?.showHighlightsModal()"
                            class="p-1 hover:bg-red-900/50 rounded text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xs">
                      Eliminar
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div class="p-3 border-t border-gray-700 text-center text-sm text-gray-500">
          ${highlights.length} subrayado${highlights.length !== 1 ? 's' : ''}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  /**
   * Aplica highlights guardados al contenido del capítulo
   */
  applyStoredHighlights(bookId, chapterId) {
    const highlights = this.getChapterHighlights(bookId, chapterId);
    if (highlights.length === 0) return;

    const content = document.querySelector('.chapter-content, .prose, [data-chapter-content]');
    if (!content) return;

    const colors = {
      yellow: 'bg-yellow-400/30',
      green: 'bg-green-400/30',
      blue: 'bg-blue-400/30',
      pink: 'bg-pink-400/30'
    };

    // Aplicar cada highlight al texto
    for (const hl of highlights) {
      const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
      let node;

      while ((node = walker.nextNode())) {
        if (node.textContent.includes(hl.text)) {
          const span = document.createElement('span');
          span.className = `${colors[hl.color] || colors.yellow} rounded px-0.5`;
          span.setAttribute('data-highlight-id', hl.id);

          const parts = node.textContent.split(hl.text);
          if (parts.length > 1) {
            const fragment = document.createDocumentFragment();
            parts.forEach((part, i) => {
              if (part) fragment.appendChild(document.createTextNode(part));
              if (i < parts.length - 1) {
                const hlSpan = span.cloneNode();
                hlSpan.textContent = hl.text;
                fragment.appendChild(hlSpan);
              }
            });
            node.parentNode.replaceChild(fragment, node);
            break; // Solo aplicar una vez por highlight
          }
        }
      }
    }
  }

  // ==========================================================================
  // PREFERENCIAS
  // ==========================================================================

  loadPreference() {
    return localStorage.getItem('smart-reader-enabled') !== 'false';
  }

  savePreference() {
    localStorage.setItem('smart-reader-enabled', this.isEnabled.toString());
  }

  toggle() {
    this.isEnabled = !this.isEnabled;
    this.savePreference();

    if (this.isEnabled) {
      this.activate();
      window.toast?.success('Smart Reader activado');
    } else {
      this.deactivate();
      window.toast?.info('Smart Reader desactivado');
    }
  }

  // ==========================================================================
  // GLOSARIO DE TÉRMINOS EXPANDIDO (75+ términos)
  // ==========================================================================

  initGlossary() {
    return {
      // =====================================================================
      // FILOSOFÍA Y CONSCIENCIA (25 términos)
      // =====================================================================
      'consciencia': {
        term: 'Consciencia',
        definition: 'Estado de percepción y conocimiento de uno mismo y del entorno. Capacidad de ser testigo de la propia experiencia. En filosofía, el "darse cuenta" fundamental que subyace a toda experiencia.',
        category: 'filosofia',
        related: ['awareness', 'presencia', 'atención']
      },
      'despertar': {
        term: 'Despertar',
        definition: 'Proceso de tomar consciencia de nuestra verdadera naturaleza más allá de las identificaciones del ego. Un cambio fundamental en la percepción de la realidad que implica reconocer la consciencia como base de todo.',
        category: 'filosofia',
        related: ['iluminación', 'satori', 'realización']
      },
      'ego': {
        term: 'Ego',
        definition: 'Estructura mental que crea la ilusión de separación. El sentido del "yo" construido a partir de pensamientos, memorias, creencias y el cuerpo físico. No es malo en sí mismo, pero la identificación exclusiva con él genera sufrimiento.',
        category: 'filosofia',
        related: ['identidad', 'personalidad', 'yo']
      },
      'presente': {
        term: 'Momento Presente',
        definition: 'El único punto de poder real donde la vida sucede. El "ahora" atemporal que existe más allá de las proyecciones mentales del pasado y futuro. La puerta de entrada a la paz y la realización.',
        category: 'filosofia',
        related: ['ahora', 'presencia', 'momento']
      },
      'no-dualidad': {
        term: 'No-dualidad (Advaita)',
        definition: 'Visión filosófica que reconoce la unidad fundamental de toda existencia, más allá de las aparentes separaciones sujeto-objeto. La realización de que el observador y lo observado son uno.',
        category: 'filosofia',
        related: ['unidad', 'advaita', 'vedanta']
      },
      'samsara': {
        term: 'Samsara',
        definition: 'En tradiciones orientales, el ciclo de nacimiento, muerte y renacimiento condicionado por el karma. Metafóricamente, el ciclo de patrones mentales repetitivos y reactividad inconsciente.',
        category: 'filosofia',
        related: ['ciclo', 'reencarnación', 'karma']
      },
      'nirvana': {
        term: 'Nirvana',
        definition: 'Estado de liberación del sufrimiento y los ciclos de existencia condicionada. "Extinción" del fuego de los deseos y aversiones. Paz y libertad absolutas, no un lugar sino un estado de consciencia.',
        category: 'filosofia',
        related: ['liberación', 'moksha', 'despertar']
      },
      'iluminación': {
        term: 'Iluminación',
        definition: 'Realización directa de la verdadera naturaleza de la realidad y del ser. Despertar completo a la consciencia que siempre ha estado presente. No es algo que se gana sino que se reconoce.',
        category: 'filosofia',
        related: ['bodhi', 'satori', 'despertar']
      },
      'dharma': {
        term: 'Dharma',
        definition: 'En budismo: las enseñanzas de Buda y la verdad universal. En hinduismo: el orden cósmico y el deber individual. También se refiere al propósito o camino de vida auténtico de cada persona.',
        category: 'filosofia',
        related: ['propósito', 'camino', 'enseñanza']
      },
      'karma': {
        term: 'Karma',
        definition: 'Ley de causa y efecto a nivel mental, emocional y físico. No es destino ni castigo, sino la tendencia natural de las acciones a generar consecuencias. La semilla que plantamos hoy florece mañana.',
        category: 'filosofia',
        related: ['acción', 'consecuencia', 'causalidad']
      },
      'maya': {
        term: 'Maya',
        definition: 'El velo de ilusión que oculta la verdadera naturaleza de la realidad. No significa que el mundo sea falso, sino que nuestra percepción ordinaria está distorsionada por la mente condicionada.',
        category: 'filosofia',
        related: ['ilusión', 'velo', 'apariencia']
      },
      'vacuidad': {
        term: 'Vacuidad (Sunyata)',
        definition: 'La naturaleza última de los fenómenos: carentes de existencia inherente e independiente. No es la nada, sino la ausencia de un ser fijo y separado. La plenitud vacía de donde todo emerge.',
        category: 'filosofia',
        related: ['sunyata', 'interdependencia', 'forma']
      },
      'ser': {
        term: 'Ser',
        definition: 'La existencia fundamental antes de toda cualificación. El "Yo Soy" puro anterior a cualquier identificación. La presencia consciente que es la base de toda experiencia.',
        category: 'filosofia',
        related: ['existencia', 'esencia', 'presencia']
      },
      'testigo': {
        term: 'Testigo (Sakshi)',
        definition: 'La consciencia pura que observa todos los fenómenos sin identificarse con ellos. El observador silencioso e inmutable que permanece consciente de pensamientos, emociones y sensaciones.',
        category: 'filosofia',
        related: ['observador', 'consciencia', 'atman']
      },
      'atman': {
        term: 'Atman',
        definition: 'En hinduismo, el Ser verdadero o alma individual que es idéntico a Brahman (consciencia universal). Lo que permanece cuando todas las identificaciones falsas se disuelven.',
        category: 'filosofia',
        related: ['alma', 'ser', 'brahman']
      },
      'brahman': {
        term: 'Brahman',
        definition: 'La realidad última, consciencia infinita que es la fuente y sustancia de todo lo que existe. No es un dios personal sino la naturaleza fundamental del ser.',
        category: 'filosofia',
        related: ['absoluto', 'consciencia', 'realidad']
      },
      'tao': {
        term: 'Tao (Dao)',
        definition: 'El camino o principio fundamental que gobierna el universo. No puede definirse pero puede vivirse. El flujo natural de la existencia con el cual podemos alinearnos o resistirnos.',
        category: 'filosofia',
        related: ['camino', 'flujo', 'naturaleza']
      },
      'wu-wei': {
        term: 'Wu Wei',
        definition: 'Acción sin esfuerzo o no-acción. No significa pasividad sino actuar en armonía con el flujo natural de las cosas, sin resistencia ni forzamiento. Actuar desde la quietud interior.',
        category: 'filosofia',
        related: ['no-acción', 'fluir', 'rendición']
      },
      'dukkha': {
        term: 'Dukkha',
        definition: 'Sufrimiento, insatisfacción o estrés existencial. La Primera Noble Verdad del budismo reconoce que el sufrimiento es inherente a la existencia condicionada por el apego y la aversión.',
        category: 'filosofia',
        related: ['sufrimiento', 'insatisfacción', 'descontento']
      },
      'impermanencia': {
        term: 'Impermanencia (Anicca)',
        definition: 'La naturaleza transitoria de todos los fenómenos. Nada permanece igual ni por un instante. Comprender esto profundamente libera del apego y permite abrazar el cambio.',
        category: 'filosofia',
        related: ['cambio', 'anicca', 'transitoriedad']
      },
      'apego': {
        term: 'Apego',
        definition: 'La tendencia mental a aferrarse a experiencias, personas, cosas o ideas como fuente de felicidad. Según el budismo, es la causa principal del sufrimiento.',
        category: 'filosofia',
        related: ['aferramiento', 'deseo', 'tanha']
      },
      'ecuanimidad': {
        term: 'Ecuanimidad (Upekkha)',
        definition: 'Equilibrio mental ante las circunstancias cambiantes de la vida. No es indiferencia sino presencia equilibrada que no se perturba por placer o dolor, ganancia o pérdida.',
        category: 'filosofia',
        related: ['equilibrio', 'serenidad', 'balance']
      },
      'compasión': {
        term: 'Compasión (Karuna)',
        definition: 'La respuesta natural del corazón ante el sufrimiento ajeno, unida al deseo de aliviarlo. No es lástima sino reconocimiento de nuestra humanidad compartida.',
        category: 'filosofia',
        related: ['karuna', 'empatía', 'amor']
      },
      'bodhisattva': {
        term: 'Bodhisattva',
        definition: 'Ser iluminado que elige permanecer en el mundo para ayudar a todos los seres a liberarse del sufrimiento. El ideal del budismo Mahayana.',
        category: 'filosofia',
        related: ['iluminado', 'servicio', 'compasión']
      },
      'satori': {
        term: 'Satori',
        definition: 'En Zen, un momento de despertar súbito o comprensión directa de la naturaleza de la realidad. Una ruptura del pensamiento ordinario que revela lo que siempre ha estado presente.',
        category: 'filosofia',
        related: ['despertar', 'kensho', 'iluminación']
      },

      // =====================================================================
      // PRÁCTICAS CONTEMPLATIVAS (15 términos)
      // =====================================================================
      'meditación': {
        term: 'Meditación',
        definition: 'Práctica de entrenar la atención y consciencia para lograr claridad mental, calma emocional y percepción profunda. Existen múltiples técnicas: concentración, observación, apertura, investigación.',
        category: 'practica',
        related: ['contemplación', 'dhyana', 'zazen']
      },
      'mindfulness': {
        term: 'Mindfulness (Atención Plena)',
        definition: 'Consciencia momento a momento de pensamientos, sensaciones corporales, emociones y entorno, sin juicio ni reactividad. Cualidad de presencia cultivable mediante práctica.',
        category: 'practica',
        related: ['sati', 'presencia', 'consciencia']
      },
      'samadhi': {
        term: 'Samadhi',
        definition: 'Estados profundos de absorción meditativa donde la mente se unifica completamente con el objeto de meditación. Existen diferentes niveles de profundidad.',
        category: 'practica',
        related: ['absorción', 'concentración', 'jhana']
      },
      'vipassana': {
        term: 'Vipassana',
        definition: 'Meditación de insight o visión clara. Práctica de observar la realidad tal como es, momento a momento, desarrollando comprensión directa de impermanencia, sufrimiento y no-yo.',
        category: 'practica',
        related: ['insight', 'observación', 'investigación']
      },
      'samatha': {
        term: 'Samatha',
        definition: 'Meditación de calma o tranquilidad. Práctica de concentrar la mente en un solo objeto (respiración, mantra, visualización) para desarrollar estabilidad y quietud mental.',
        category: 'practica',
        related: ['calma', 'concentración', 'shamatha']
      },
      'zazen': {
        term: 'Zazen',
        definition: 'Meditación sentada del Zen. Práctica de simplemente sentarse con atención plena, sin objetivo ni manipulación de la experiencia. "Solo sentarse" (shikantaza).',
        category: 'practica',
        related: ['zen', 'sentarse', 'meditación']
      },
      'koan': {
        term: 'Koan',
        definition: 'Acertijo o paradoja usada en Zen para romper el pensamiento conceptual y provocar un salto hacia la comprensión directa. Ejemplos: "¿Cuál es el sonido de una sola mano?"',
        category: 'practica',
        related: ['paradoja', 'zen', 'contemplación']
      },
      'mantra': {
        term: 'Mantra',
        definition: 'Palabra, sílaba o frase sagrada repetida como práctica meditativa. Puede ser en sánscrito (Om, Om Mani Padme Hum) o cualquier idioma. Calma la mente y la eleva.',
        category: 'practica',
        related: ['repetición', 'sagrado', 'sonido']
      },
      'pranayama': {
        term: 'Pranayama',
        definition: 'Técnicas de control de la respiración del yoga. Prana = energía vital, ayama = extensión. Regulan el sistema nervioso, calman la mente y expanden la consciencia.',
        category: 'practica',
        related: ['respiración', 'prana', 'yoga']
      },
      'yoga': {
        term: 'Yoga',
        definition: 'Sistema de prácticas para unir cuerpo, mente y espíritu. Yoga = unión. Incluye posturas (asana), respiración (pranayama), ética (yamas/niyamas) y meditación.',
        category: 'practica',
        related: ['unión', 'práctica', 'disciplina']
      },
      'contemplación': {
        term: 'Contemplación',
        definition: 'Práctica de observación profunda y reflexiva. Puede ser de un texto, una pregunta, la naturaleza o cualquier objeto. Difiere de la meditación en que usa el pensamiento para trascenderlo.',
        category: 'practica',
        related: ['reflexión', 'observación', 'indagación']
      },
      'autoindagación': {
        term: 'Autoindagación (Atma Vichara)',
        definition: 'Práctica de investigar la naturaleza del yo preguntando "¿Quién soy yo?" La técnica central enseñada por Ramana Maharshi para realizar el Ser.',
        category: 'practica',
        related: ['vichara', 'investigación', 'quien soy']
      },
      'rendición': {
        term: 'Rendición (Ishvara Pranidhana)',
        definition: 'Entrega de la voluntad personal a algo mayor: la vida, Dios, la verdad. No es resignación pasiva sino alineamiento activo con el flujo de la existencia.',
        category: 'practica',
        related: ['entrega', 'soltar', 'aceptación']
      },
      'tonglen': {
        term: 'Tonglen',
        definition: 'Práctica tibetana de dar y recibir. Se inhala el sufrimiento de otros (transformándolo en el corazón) y se exhala amor, paz y bienestar. Cultiva compasión y disuelve el ego.',
        category: 'practica',
        related: ['compasión', 'tibetano', 'dar']
      },
      'metta': {
        term: 'Metta (Loving-Kindness)',
        definition: 'Práctica de cultivar amor incondicional y benevolencia hacia uno mismo y todos los seres. Se repiten frases de buenos deseos expandiendo gradualmente el círculo.',
        category: 'practica',
        related: ['amor', 'benevolencia', 'bondad']
      },

      // =====================================================================
      // CIENCIA Y FÍSICA (15 términos)
      // =====================================================================
      'cuántica': {
        term: 'Física Cuántica',
        definition: 'Rama de la física que estudia el comportamiento de la materia y energía a escalas subatómicas. Revela una realidad fundamentalmente probabilística, interconectada y dependiente del observador.',
        category: 'ciencia',
        related: ['mecánica cuántica', 'partículas', 'onda']
      },
      'entrelazamiento': {
        term: 'Entrelazamiento Cuántico',
        definition: 'Fenómeno donde partículas conectadas mantienen correlación instantánea independientemente de la distancia. Einstein lo llamó "acción fantasmal a distancia". Sugiere interconexión fundamental.',
        category: 'ciencia',
        related: ['correlación', 'no-localidad', 'quantum']
      },
      'superposición': {
        term: 'Superposición Cuántica',
        definition: 'Estado donde una partícula existe simultáneamente en múltiples estados posibles hasta ser observada. Solo al medirla "colapsa" en un estado definido.',
        category: 'ciencia',
        related: ['quantum', 'colapso', 'observador']
      },
      'observador': {
        term: 'Efecto del Observador',
        definition: 'El hecho de que la medición afecta el resultado en física cuántica. Sugiere que la consciencia podría estar intrínsecamente ligada a la naturaleza de la realidad.',
        category: 'ciencia',
        related: ['medición', 'colapso', 'consciencia']
      },
      'neuroplasticidad': {
        term: 'Neuroplasticidad',
        definition: 'Capacidad del cerebro de reorganizarse formando nuevas conexiones neuronales a lo largo de la vida. Base científica para el cambio mental, el aprendizaje y la transformación personal.',
        category: 'ciencia',
        related: ['cerebro', 'cambio', 'neuronas']
      },
      'coherencia': {
        term: 'Coherencia',
        definition: 'Estado de armonía y sincronización entre diferentes sistemas. La coherencia cardíaca, cerebral y emocional mejora el funcionamiento integral del organismo.',
        category: 'ciencia',
        related: ['armonía', 'sincronización', 'corazón']
      },
      'epigenética': {
        term: 'Epigenética',
        definition: 'Estudio de cómo el comportamiento y el ambiente pueden causar cambios en la expresión genética sin alterar el ADN. Demuestra que no somos víctimas de nuestros genes.',
        category: 'ciencia',
        related: ['genes', 'ambiente', 'expresión']
      },
      'campo': {
        term: 'Campo Unificado',
        definition: 'En física teórica, el campo fundamental del que emergen todas las fuerzas y partículas. Algunos lo relacionan con la consciencia como sustrato de la realidad.',
        category: 'ciencia',
        related: ['unificación', 'física', 'energía']
      },
      'emergencia': {
        term: 'Emergencia',
        definition: 'Fenómeno donde propiedades complejas surgen de interacciones simples. La consciencia puede ser emergente del cerebro, o puede ser que el cerebro emerja de la consciencia.',
        category: 'ciencia',
        related: ['complejidad', 'sistemas', 'propiedad']
      },
      'información': {
        term: 'Información',
        definition: 'En física contemporánea, la información podría ser más fundamental que la materia y la energía. "It from bit" - la realidad podría ser fundamentalmente informacional.',
        category: 'ciencia',
        related: ['bit', 'realidad', 'física']
      },
      'holografía': {
        term: 'Principio Holográfico',
        definition: 'Teoría que sugiere que toda la información de un volumen de espacio está codificada en su frontera. El universo podría ser una proyección holográfica.',
        category: 'ciencia',
        related: ['holograma', 'universo', 'información']
      },
      'entropía': {
        term: 'Entropía',
        definition: 'Medida del desorden de un sistema. La segunda ley de la termodinámica dice que tiende a aumentar. La vida y la consciencia parecen crear islas de orden local.',
        category: 'ciencia',
        related: ['desorden', 'termodinámica', 'orden']
      },
      'relatividad': {
        term: 'Relatividad',
        definition: 'Teoría de Einstein que revolucionó la comprensión del espacio, tiempo, masa y energía. Espacio y tiempo son relativos al observador; E=mc².',
        category: 'ciencia',
        related: ['einstein', 'tiempo', 'espacio']
      },
      'caos': {
        term: 'Teoría del Caos',
        definition: 'Estudio de sistemas dinámicos altamente sensibles a condiciones iniciales (efecto mariposa). Pequeños cambios pueden producir grandes efectos. Orden oculto en aparente desorden.',
        category: 'ciencia',
        related: ['complejidad', 'mariposa', 'sistemas']
      },
      'autopoiesis': {
        term: 'Autopoiesis',
        definition: 'Capacidad de los sistemas vivos de producirse y mantenerse a sí mismos. Los seres vivos son sistemas que se auto-crean continuamente.',
        category: 'ciencia',
        related: ['vida', 'autorganización', 'sistemas']
      },

      // =====================================================================
      // PSICOLOGÍA (15 términos)
      // =====================================================================
      'inconsciente': {
        term: 'Inconsciente',
        definition: 'Parte de la mente que contiene pensamientos, memorias, deseos y motivaciones no accesibles a la consciencia ordinaria. Influye profundamente en comportamiento y experiencia.',
        category: 'psicologia',
        related: ['subconsciente', 'mente', 'freud']
      },
      'sombra': {
        term: 'Sombra (Jung)',
        definition: 'Aspectos de la personalidad que rechazamos, negamos o proyectamos en otros. Contiene no solo aspectos "negativos" sino también potenciales sin desarrollar. Integrarla es clave para la individuación.',
        category: 'psicologia',
        related: ['proyección', 'jung', 'integración']
      },
      'arquetipo': {
        term: 'Arquetipo',
        definition: 'Patrones universales del inconsciente colectivo que influyen en el comportamiento humano. Ejemplos: el héroe, la madre, el sabio, el embaucador, el self.',
        category: 'psicologia',
        related: ['jung', 'colectivo', 'patrón']
      },
      'individuación': {
        term: 'Individuación',
        definition: 'Proceso de integración psicológica propuesto por Jung. Implica integrar conscientemente aspectos inconscientes (sombra, anima/animus) para alcanzar la totalidad del Self.',
        category: 'psicologia',
        related: ['jung', 'integración', 'self']
      },
      'self': {
        term: 'Self (Sí-Mismo)',
        definition: 'En psicología junguiana, el arquetipo de la totalidad y el centro regulador de la psique. No es el ego sino el principio organizador que incluye consciente e inconsciente.',
        category: 'psicologia',
        related: ['jung', 'totalidad', 'centro']
      },
      'proyección': {
        term: 'Proyección',
        definition: 'Mecanismo de defensa donde atribuimos a otros cualidades, sentimientos o motivaciones que no reconocemos en nosotros mismos. Lo que irrita en otros suele ser un espejo.',
        category: 'psicologia',
        related: ['sombra', 'defensa', 'espejo']
      },
      'resiliencia': {
        term: 'Resiliencia',
        definition: 'Capacidad de adaptarse positivamente a la adversidad, trauma, tragedia o estrés significativo. No es ausencia de dificultad sino capacidad de recuperación y crecimiento.',
        category: 'psicologia',
        related: ['adaptación', 'fortaleza', 'crecimiento']
      },
      'trauma': {
        term: 'Trauma',
        definition: 'Respuesta psicológica a eventos extremadamente estresantes que abruma la capacidad de afrontamiento. Puede almacenarse en el cuerpo y la mente, afectando la vida actual.',
        category: 'psicologia',
        related: ['herida', 'TEPT', 'sanación']
      },
      'apego seguro': {
        term: 'Apego',
        definition: 'Teoría de Bowlby sobre los vínculos emocionales tempranos. El estilo de apego (seguro, ansioso, evitativo) formado en la infancia influye en las relaciones adultas.',
        category: 'psicologia',
        related: ['vínculo', 'bowlby', 'relación']
      },
      'flujo': {
        term: 'Flujo (Flow)',
        definition: 'Estado de absorción completa en una actividad, donde el tiempo parece desaparecer y la acción fluye sin esfuerzo. Estudiado por Csikszentmihalyi como clave de la felicidad.',
        category: 'psicologia',
        related: ['absorción', 'óptimo', 'felicidad']
      },
      'inteligencia emocional': {
        term: 'Inteligencia Emocional',
        definition: 'Capacidad de reconocer, comprender y gestionar las propias emociones y las de los demás. Incluye autoconciencia, autorregulación, motivación, empatía y habilidades sociales.',
        category: 'psicologia',
        related: ['emociones', 'goleman', 'EQ']
      },
      'disociación': {
        term: 'Disociación',
        definition: 'Desconexión entre pensamientos, sentimientos, acciones o sentido de identidad. Puede ser mecanismo protector ante el trauma o estado alterado en meditación.',
        category: 'psicologia',
        related: ['defensa', 'trauma', 'consciencia']
      },
      'autocompasión': {
        term: 'Autocompasión',
        definition: 'Tratarse a uno mismo con la misma bondad que daríamos a un buen amigo que sufre. Incluye mindfulness del sufrimiento, humanidad compartida y amabilidad hacia uno mismo.',
        category: 'psicologia',
        related: ['compasión', 'bondad', 'self']
      },
      'crecimiento postraumático': {
        term: 'Crecimiento Postraumático',
        definition: 'Cambio psicológico positivo como resultado de la lucha con circunstancias de vida altamente desafiantes. El trauma puede ser catalizador de transformación profunda.',
        category: 'psicologia',
        related: ['trauma', 'resiliencia', 'transformación']
      },
      'estrés': {
        term: 'Estrés',
        definition: 'Respuesta del organismo ante demandas percibidas como amenazantes. El estrés agudo puede ser adaptativo; el crónico es dañino. La percepción determina el impacto.',
        category: 'psicologia',
        related: ['ansiedad', 'cortisol', 'respuesta']
      },

      // =====================================================================
      // INTELIGENCIA ARTIFICIAL Y TECNOLOGÍA (5 términos)
      // =====================================================================
      'singularidad': {
        term: 'Singularidad Tecnológica',
        definition: 'Punto hipotético donde la inteligencia artificial supera la capacidad humana, generando cambios impredecibles y potencialmente exponenciales en la civilización.',
        category: 'tecnologia',
        related: ['kurzweil', 'superinteligencia', 'futuro']
      },
      'inteligencia artificial': {
        term: 'Inteligencia Artificial',
        definition: 'Sistemas computacionales capaces de realizar tareas que normalmente requieren inteligencia humana: aprendizaje, razonamiento, percepción, creatividad.',
        category: 'tecnologia',
        related: ['IA', 'machine learning', 'algoritmo']
      },
      'superinteligencia': {
        term: 'Superinteligencia',
        definition: 'Forma de inteligencia que supera significativamente las capacidades cognitivas humanas en todos los dominios. Plantea preguntas existenciales sobre el futuro de la humanidad.',
        category: 'tecnologia',
        related: ['bostrom', 'AGI', 'riesgo']
      },
      'transhumanismo': {
        term: 'Transhumanismo',
        definition: 'Movimiento que busca mejorar la condición humana mediante tecnología: aumentar longevidad, capacidades cognitivas y físicas. Plantea cuestiones éticas profundas.',
        category: 'tecnologia',
        related: ['mejora', 'cyborg', 'futuro']
      },
      'consciencia artificial': {
        term: 'Consciencia Artificial',
        definition: 'Pregunta sobre si las máquinas pueden tener experiencia subjetiva. ¿Puede una IA "sentir"? ¿Qué significa realmente la consciencia?',
        category: 'tecnologia',
        related: ['qualia', 'mente', 'IA']
      }
    };
  }

  // ==========================================================================
  // AUTORES Y BIOGRAFÍAS
  // ==========================================================================

  initAuthors() {
    return {
      'eckhart tolle': {
        name: 'Eckhart Tolle',
        bio: 'Autor alemán de "El Poder del Ahora" y "Una Nueva Tierra". Experimentó una transformación espiritual profunda a los 29 años tras años de depresión. Enseña presencia y consciencia del momento presente.',
        works: ['El Poder del Ahora', 'Una Nueva Tierra', 'Practicando el Poder del Ahora']
      },
      'carl jung': {
        name: 'Carl Gustav Jung',
        bio: 'Psiquiatra y psicoanalista suizo (1875-1961), fundador de la psicología analítica. Desarrolló conceptos como inconsciente colectivo, arquetipos, sombra e individuación.',
        works: ['El Hombre y sus Símbolos', 'Recuerdos, Sueños, Pensamientos', 'Tipos Psicológicos']
      },
      'thich nhat hanh': {
        name: 'Thich Nhat Hanh',
        bio: 'Monje budista vietnamita (1926-2022), poeta, activista de paz y maestro de mindfulness. Fundó Plum Village. Popularizó la práctica de la atención plena en Occidente.',
        works: ['El Milagro de Mindfulness', 'Paz Es Cada Paso', 'El Corazón de las Enseñanzas de Buda']
      },
      'viktor frankl': {
        name: 'Viktor Frankl',
        bio: 'Neurólogo y psiquiatra austriaco (1905-1997), sobreviviente del Holocausto. Fundó la logoterapia basada en encontrar significado. Su experiencia en campos de concentración informó su obra.',
        works: ['El Hombre en Busca de Sentido', 'Psicoanálisis y Existencialismo']
      },
      'dalai lama': {
        name: 'Dalai Lama (Tenzin Gyatso)',
        bio: '14º Dalai Lama, líder espiritual del budismo tibetano desde 1950. Premio Nobel de la Paz 1989. Enseña compasión, no-violencia y el diálogo entre ciencia y espiritualidad.',
        works: ['El Arte de la Felicidad', 'El Universo en un Solo Átomo']
      },
      'ramana maharshi': {
        name: 'Ramana Maharshi',
        bio: 'Sabio indio (1879-1950) de Tiruvannamalai. A los 16 años experimentó despertar espontáneo. Enseñó principalmente a través del silencio y la práctica de autoindagación "¿Quién soy yo?"',
        works: ['Nan Yar? (¿Quién soy yo?)', 'Talks with Sri Ramana Maharshi']
      },
      'nisargadatta maharaj': {
        name: 'Nisargadatta Maharaj',
        bio: 'Maestro espiritual indio (1897-1981) de la tradición Advaita Vedanta. Un humilde vendedor de bidis (cigarrillos) que alcanzó el reconocimiento como uno de los grandes sabios del siglo XX.',
        works: ['Yo Soy Eso', 'Semillas de Consciencia']
      },
      'alan watts': {
        name: 'Alan Watts',
        bio: 'Filósofo británico (1915-1973) que popularizó la filosofía oriental en Occidente. Carismático comunicador del Zen, Taoísmo y Vedanta.',
        works: ['El Camino del Zen', 'La Sabiduría de la Inseguridad', 'El Libro del Tabú']
      },
      'krishnamurti': {
        name: 'Jiddu Krishnamurti',
        bio: 'Filósofo indio (1895-1986). Rechazó ser declarado el nuevo mesías y enseñó la liberación a través de la observación directa de la mente, sin gurús ni sistemas.',
        works: ['La Libertad Primera y Última', 'El Vuelo del Águila']
      },
      'lao tse': {
        name: 'Lao Tse (Laozi)',
        bio: 'Filósofo chino legendario (siglo VI a.C.), considerado fundador del Taoísmo. Autor del Tao Te Ching, texto fundamental sobre el Tao y la vida en armonía.',
        works: ['Tao Te Ching']
      },
      'buda': {
        name: 'Buda (Siddharta Gautama)',
        bio: 'Fundador del budismo (563-483 a.C. aprox.). Príncipe que renunció a su vida de privilegio en busca de la liberación del sufrimiento. Alcanzó la iluminación bajo el árbol Bodhi.',
        works: ['Dhammapada', 'Sutras del Canon Pali']
      }
    };
  }

  // ==========================================================================
  // CITAS TEMÁTICAS
  // ==========================================================================

  initThematicQuotes() {
    return {
      'consciencia': [
        { text: 'La consciencia es la base de toda vida y el campo de todas las posibilidades.', author: 'Deepak Chopra' },
        { text: 'No eres una gota en el océano. Eres el océano entero en una gota.', author: 'Rumi' }
      ],
      'presente': [
        { text: 'Realiza profundamente que el momento presente es todo lo que tienes.', author: 'Eckhart Tolle' },
        { text: 'El ayer es historia, el mañana es un misterio, el hoy es un regalo.', author: 'Bil Keane' }
      ],
      'ego': [
        { text: 'El ego no es quien realmente eres. El ego es la imagen que tienes de ti mismo.', author: 'Wayne Dyer' },
        { text: 'El ego es solo una ilusión, pero una ilusión muy influyente.', author: 'Wayne Dyer' }
      ],
      'sufrimiento': [
        { text: 'El dolor es inevitable, el sufrimiento es opcional.', author: 'Haruki Murakami' },
        { text: 'Lo que resistes, persiste. Lo que aceptas, se transforma.', author: 'Carl Jung' }
      ],
      'cambio': [
        { text: 'El secreto del cambio es enfocar toda tu energía no en luchar contra lo viejo, sino en construir lo nuevo.', author: 'Sócrates' },
        { text: 'Nada es permanente excepto el cambio.', author: 'Heráclito' }
      ],
      'silencio': [
        { text: 'El silencio no es la ausencia de sonido, sino la presencia de la paz.', author: 'Anónimo' },
        { text: 'En el silencio se encuentra la fuerza.', author: 'Lao Tse' }
      ]
    };
  }

  // ==========================================================================
  // CONEXIONES ENTRE LIBROS
  // ==========================================================================

  initBookConnections() {
    return {
      'el-codigo-del-despertar': {
        'cap1': [
          { bookId: 'manual-practico', chapterId: 'ejercicio-1', label: 'Ejercicio: Consciencia del Ahora' },
          { bookId: 'practicas-radicales', chapterId: 'practica-1', label: 'Práctica: Meditación Básica' }
        ],
        'cap2': [
          { bookId: 'manual-practico', chapterId: 'ejercicio-3', label: 'Ejercicio: Observar el Ego' },
          { bookId: 'practicas-radicales', chapterId: 'practica-2', label: 'Práctica: Testigo Silencioso' }
        ],
        'cap3': [
          { bookId: 'practicas-radicales', chapterId: 'practica-5', label: 'Práctica: Contemplación Profunda' }
        ],
        'cap4': [
          { bookId: 'manual-practico', chapterId: 'ejercicio-5', label: 'Ejercicio: Integración de la Sombra' }
        ],
        'cap5': [
          { bookId: 'practicas-radicales', chapterId: 'practica-7', label: 'Práctica: Meditación del Corazón' }
        ]
      },
      'manual-practico': {
        'ejercicio-1': [
          { bookId: 'el-codigo-del-despertar', chapterId: 'cap1', label: 'Teoría: El Código del Despertar' }
        ],
        'ejercicio-3': [
          { bookId: 'el-codigo-del-despertar', chapterId: 'cap2', label: 'Teoría: La Naturaleza del Ego' }
        ]
      },
      'practicas-radicales': {
        'practica-1': [
          { bookId: 'el-codigo-del-despertar', chapterId: 'cap5', label: 'Fundamento: La Meditación' }
        ],
        'practica-5': [
          { bookId: 'el-codigo-del-despertar', chapterId: 'cap3', label: 'Teoría: La Contemplación' }
        ]
      }
    };
  }

  // ==========================================================================
  // ANÁLISIS DE CONTENIDO
  // ==========================================================================

  analyzeChapter(chapterId, content) {
    if (this.cachedInsights[chapterId]) {
      return this.cachedInsights[chapterId];
    }

    const insights = {
      terms: this.findTerms(content),
      connections: this.findConnections(chapterId),
      historicalContext: this.findHistoricalContext(content),
      authors: this.findAuthors(content),
      relatedQuotes: this.findRelatedQuotes(content),
      reflectionQuestions: []
    };

    this.cachedInsights[chapterId] = insights;
    return insights;
  }

  findTerms(content) {
    const foundTerms = [];
    const contentLower = content.toLowerCase();

    Object.keys(this.glossary).forEach(key => {
      const term = this.glossary[key];
      const searchTerms = [key, ...(term.related || [])];

      for (const searchTerm of searchTerms) {
        if (contentLower.includes(searchTerm.toLowerCase())) {
          if (!foundTerms.find(t => t.term === term.term)) {
            foundTerms.push(term);
          }
          break;
        }
      }
    });

    return [...new Map(foundTerms.map(t => [t.term, t])).values()].slice(0, 10);
  }

  findConnections(chapterId) {
    const currentBookId = window.bookEngine?.getCurrentBook();
    if (!currentBookId) return [];

    const bookConns = this.bookConnections[currentBookId];
    if (!bookConns) return [];

    return bookConns[chapterId] || [];
  }

  findHistoricalContext(content) {
    const contexts = [];
    const contentLower = content.toLowerCase();

    const historicalData = {
      'siglo xx': {
        event: 'Siglo XX',
        description: 'Período de transformaciones radicales: guerras mundiales, revolución tecnológica, psicoanálisis, física cuántica, y el encuentro masivo de Oriente y Occidente.',
        period: '1900-2000'
      },
      'siglo xxi': {
        event: 'Siglo XXI',
        description: 'Era de la información, inteligencia artificial, crisis climática, y un nuevo despertar de la consciencia colectiva hacia la interconexión global.',
        period: '2000-presente'
      },
      'segunda guerra mundial': {
        event: 'Segunda Guerra Mundial',
        description: 'Conflicto global (1939-1945) que transformó la consciencia humana sobre el sufrimiento, la resiliencia, y la capacidad tanto destructiva como sanadora de la humanidad.',
        period: '1939-1945'
      },
      'revolución industrial': {
        event: 'Revolución Industrial',
        description: 'Transformación social y económica (s. XVIII-XIX) que cambió radicalmente la relación del ser humano con el trabajo, la naturaleza y el tiempo.',
        period: 'siglos XVIII-XIX'
      },
      'renacimiento': {
        event: 'Renacimiento',
        description: 'Período de renovación cultural (s. XIV-XVI) que recuperó el humanismo, el pensamiento crítico, y la exploración del potencial humano.',
        period: 'siglos XIV-XVI'
      },
      'ilustración': {
        event: 'Ilustración',
        description: 'Movimiento intelectual (s. XVIII) que promovió la razón, el método científico, y la libertad individual como bases del progreso humano.',
        period: 'siglo XVIII'
      },
      'budismo': {
        event: 'Origen del Budismo',
        description: 'Tradición espiritual fundada por Siddharta Gautama en la India hace 2,500 años. Enseña el camino hacia la liberación del sufrimiento mediante la comprensión y la práctica.',
        period: 'siglo VI a.C.'
      },
      'yoga': {
        event: 'Tradición del Yoga',
        description: 'Sistema de prácticas con más de 5,000 años de antigüedad, originado en la India. Integra cuerpo, mente y espíritu hacia la realización del Ser.',
        period: '3000+ años'
      },
      'vedanta': {
        event: 'Vedanta',
        description: 'Una de las escuelas filosóficas más antiguas de la India, basada en los Upanishads. Enseña la no-dualidad (Advaita) y la identidad del ser individual con el Ser universal.',
        period: '800 a.C. - presente'
      },
      'taoísmo': {
        event: 'Taoísmo',
        description: 'Filosofía y tradición espiritual china fundada por Lao Tse. Enseña la armonía con el Tao, el flujo natural de la existencia.',
        period: 'siglo VI a.C.'
      },
      'zen': {
        event: 'Budismo Zen',
        description: 'Escuela de budismo Mahayana que enfatiza la meditación (zazen), la experiencia directa, y la transmisión de maestro a discípulo.',
        period: 'siglo VI d.C.'
      }
    };

    Object.keys(historicalData).forEach(key => {
      if (contentLower.includes(key)) {
        const data = historicalData[key];
        if (!contexts.find(c => c.event === data.event)) {
          contexts.push(data);
        }
      }
    });

    return contexts.slice(0, 4);
  }

  findAuthors(content) {
    const foundAuthors = [];
    const contentLower = content.toLowerCase();

    Object.keys(this.authors).forEach(key => {
      if (contentLower.includes(key)) {
        foundAuthors.push(this.authors[key]);
      }
    });

    return foundAuthors.slice(0, 3);
  }

  findRelatedQuotes(content) {
    const quotes = [];
    const contentLower = content.toLowerCase();

    const themes = Object.keys(this.thematicQuotes);
    themes.forEach(theme => {
      if (contentLower.includes(theme)) {
        const themeQuotes = this.thematicQuotes[theme];
        if (themeQuotes && themeQuotes.length > 0) {
          const randomQuote = themeQuotes[Math.floor(Math.random() * themeQuotes.length)];
          if (!quotes.find(q => q.text === randomQuote.text)) {
            quotes.push({ ...randomQuote, theme });
          }
        }
      }
    });

    return quotes.slice(0, 3);
  }

  // ==========================================================================
  // PREGUNTAS DE REFLEXIÓN
  // ==========================================================================

  async generateReflectionQuestions(chapter) {
    // 🔧 FIX v2.9.379: Usar AIUtils para verificación unificada de disponibilidad IA
    const aiUtils = window.aiUtils;
    const aiAdapter = window.aiAdapter;

    if (!aiAdapter || (aiUtils && !aiUtils.isAIAvailable())) {
      return this.getDefaultQuestions(chapter);
    }

    try {
      const prompt = `Basándote en el siguiente capítulo de un libro de desarrollo personal y consciencia, genera 3 preguntas de reflexión profundas y personales. Las preguntas deben invitar a la introspección.

Título: ${chapter.title}
Contenido resumido: ${chapter.content?.substring(0, 500) || chapter.closingQuestion || ''}

Responde SOLO con las 3 preguntas, una por línea, sin numeración.`;

      const response = await aiAdapter.ask(prompt, '', []);

      if (response) {
        const questions = response.split('\n')
          .map(q => q.trim())
          .filter(q => q.length > 10 && q.includes('?'))
          .slice(0, 3);

        if (questions.length > 0) {
          return questions;
        }
      }
    } catch (error) {
      logger.warn('[SmartReader] Error generating AI questions:', error);
      if (aiUtils) {
        aiUtils.showErrorToast(error);
      }
    }

    return this.getDefaultQuestions(chapter);
  }

  getDefaultQuestions(chapter) {
    const questionPool = [
      '¿Qué aspecto de este capítulo resuena más con tu experiencia personal?',
      '¿Cómo podrías aplicar estas ideas en tu vida cotidiana?',
      '¿Qué creencias o patrones propios te invita a examinar este contenido?',
      '¿Qué emoción surge al leer estas palabras? ¿Qué te dice esa emoción?',
      '¿Cómo cambiaría tu vida si integraras profundamente esta enseñanza?',
      '¿Qué resistencia notas en ti al considerar estas ideas?',
      '¿Qué parte de ti necesita escuchar especialmente este mensaje hoy?',
      '¿Cómo se relaciona esto con tus relaciones más importantes?',
      '¿Qué acción concreta podrías tomar hoy basándote en esto?'
    ];

    if (chapter?.closingQuestion) {
      return [chapter.closingQuestion, questionPool[0], questionPool[3]];
    }

    const shuffled = questionPool.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }

  // ==========================================================================
  // HIGHLIGHT DE TÉRMINOS
  // ==========================================================================

  highlightTermsInContent() {
    if (!this.isEnabled || !this.config.highlightTerms) return;

    const contentArea = document.querySelector('.chapter-content');
    if (!contentArea) return;

    Object.keys(this.glossary).forEach(key => {
      const term = this.glossary[key];
      const regex = new RegExp(`\\b(${key})\\b`, 'gi');

      const walker = document.createTreeWalker(
        contentArea,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      const nodesToProcess = [];
      while (walker.nextNode()) {
        if (regex.test(walker.currentNode.textContent)) {
          nodesToProcess.push(walker.currentNode);
        }
        regex.lastIndex = 0;
      }

      nodesToProcess.slice(0, 2).forEach(node => {
        const span = document.createElement('span');
        span.innerHTML = node.textContent.replace(regex, (match) => {
          return `<span class="smart-term" data-term="${key}" title="${term.definition.substring(0, 100)}...">${match}</span>`;
        });

        if (span.innerHTML !== node.textContent) {
          node.parentNode.replaceChild(span, node);
        }
      });
    });

    this.injectStyles();
    this.attachTermClickHandler();
  }

  attachTermClickHandler() {
    document.querySelectorAll('.smart-term').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const termKey = el.dataset.term;
        const term = this.glossary[termKey];
        if (term) {
          this.showTermPopup(el, term);
        }
      });
    });
  }

  showTermPopup(element, term) {
    document.querySelector('.smart-term-popup')?.remove();

    const popup = document.createElement('div');
    popup.className = 'smart-term-popup fixed bg-slate-800 border border-blue-500/50 rounded-xl p-4 shadow-2xl z-[10000] max-w-xs';

    const rect = element.getBoundingClientRect();
    popup.style.top = `${rect.bottom + 10}px`;
    popup.style.left = `${Math.max(10, rect.left - 50)}px`;

    const categoryColors = {
      filosofia: 'bg-purple-500/20 text-purple-300',
      ciencia: 'bg-blue-500/20 text-blue-300',
      psicologia: 'bg-green-500/20 text-green-300',
      practica: 'bg-amber-500/20 text-amber-300',
      tecnologia: 'bg-cyan-500/20 text-cyan-300'
    };

    popup.innerHTML = `
      <div class="flex items-center gap-2 mb-2">
        <span class="font-bold text-white">${term.term}</span>
        <span class="text-xs px-1.5 py-0.5 rounded ${categoryColors[term.category] || 'bg-gray-500/20'}">
          ${term.category}
        </span>
      </div>
      <p class="text-sm text-gray-300 leading-relaxed">${term.definition}</p>
      ${term.related?.length ? `
        <div class="mt-2 pt-2 border-t border-gray-700">
          <p class="text-xs text-gray-500">Relacionados: ${term.related.join(', ')}</p>
        </div>
      ` : ''}
      <button onclick="this.parentElement.remove()"
              class="absolute -top-2 -right-2 w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white text-xs">
        ✕
      </button>
    `;

    document.body.appendChild(popup);

    setTimeout(() => {
      document.addEventListener('click', function handler(e) {
        if (!popup.contains(e.target) && e.target !== element) {
          popup.remove();
          document.removeEventListener('click', handler);
        }
      });
    }, 100);
  }

  injectStyles() {
    if (document.getElementById('smart-reader-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'smart-reader-styles';
    styles.textContent = `
      .smart-term {
        border-bottom: 1px dotted currentColor;
        cursor: help;
        position: relative;
      }
      .smart-term:hover {
        background: rgba(59, 130, 246, 0.2);
        border-radius: 2px;
      }
      .smart-reader-panel {
        transition: transform 0.3s ease, opacity 0.3s ease;
      }
      .smart-reader-panel.collapsed {
        transform: translateX(100%);
        opacity: 0;
      }
      .smart-term-popup {
        animation: fadeIn 0.2s ease;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(styles);
  }

  // ==========================================================================
  // UI - PANEL LATERAL
  // ==========================================================================

  async show(chapter) {
    if (!chapter) return;

    this.currentChapterId = chapter.id;
    this.close();

    const contentEl = document.querySelector('.chapter-content');
    const content = contentEl?.textContent || chapter.content || '';
    const insights = this.analyzeChapter(chapter.id, content);

    const questions = await this.generateReflectionQuestions(chapter);
    insights.reflectionQuestions = questions;

    const panel = document.createElement('div');
    panel.id = 'smart-reader-panel';
    panel.className = 'smart-reader-panel fixed right-0 top-0 h-full w-96 max-w-[90vw] bg-slate-900 border-l border-gray-700 shadow-2xl z-[9998] flex flex-col';
    panel.innerHTML = `
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-blue-900/30 to-purple-900/30">
        <div>
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <span class="text-xl">🧠</span> Smart Reader
          </h2>
          <p class="text-xs text-gray-400">Panel contextual inteligente</p>
        </div>
        <button onclick="window.smartReader?.close()"
                class="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        ${this.renderTermsSection(insights.terms)}
        ${this.renderConnectionsSection(insights.connections)}
        ${this.renderHistoricalSection(insights.historicalContext)}
        ${this.renderAuthorsSection(insights.authors)}
        ${this.renderQuotesSection(insights.relatedQuotes)}
        ${this.renderQuestionsSection(insights.reflectionQuestions)}
      </div>

      <!-- Footer -->
      <div class="p-3 border-t border-gray-700 flex items-center justify-between">
        <label class="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input type="checkbox" ${this.config.highlightTerms ? 'checked' : ''}
                 onchange="window.smartReader?.toggleHighlight(this.checked)"
                 class="rounded bg-slate-700 border-gray-600 text-blue-500">
          <span>Resaltar términos</span>
        </label>
        <button onclick="window.smartReader?.refresh()"
                class="text-xs text-gray-500 hover:text-white">
          🔄 Actualizar
        </button>
      </div>
    `;

    document.body.appendChild(panel);
    this.panelElement = panel;

    if (this.config.highlightTerms) {
      this.highlightTermsInContent();
    }

    this._escapeHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this._escapeHandler);
  }

  renderTermsSection(terms) {
    if (!terms || terms.length === 0) return '';

    const categoryColors = {
      filosofia: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      ciencia: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      psicologia: 'bg-green-500/20 text-green-300 border-green-500/30',
      practica: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      tecnologia: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    };

    const categoryIcons = {
      filosofia: '🔮',
      ciencia: '🔬',
      psicologia: '🧠',
      practica: '🧘',
      tecnologia: '💻'
    };

    return `
      <div>
        <h3 class="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
          <span>📖</span> Términos Clave (${terms.length})
        </h3>
        <div class="space-y-2">
          ${terms.map(term => `
            <details class="bg-slate-800/50 rounded-lg border ${categoryColors[term.category]?.split(' ')[2] || 'border-gray-700/50'} group">
              <summary class="p-3 cursor-pointer flex items-center gap-2 list-none">
                <span class="text-sm">${categoryIcons[term.category] || '📝'}</span>
                <span class="font-medium text-white flex-1">${term.term}</span>
                <span class="text-xs px-1.5 py-0.5 rounded ${categoryColors[term.category] || 'bg-gray-500/20 text-gray-300'}">
                  ${term.category}
                </span>
                <svg class="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </summary>
              <div class="px-3 pb-3">
                <p class="text-xs text-gray-400 leading-relaxed">${term.definition}</p>
                ${term.related?.length ? `
                  <p class="text-xs text-gray-500 mt-2">
                    <span class="text-gray-600">Relacionados:</span> ${term.related.join(', ')}
                  </p>
                ` : ''}
              </div>
            </details>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderConnectionsSection(connections) {
    if (!connections || connections.length === 0) return '';

    return `
      <div>
        <h3 class="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
          <span>🔗</span> Conexiones
        </h3>
        <div class="space-y-2">
          ${connections.map(conn => `
            <button onclick="window.smartReader?.navigateToConnection('${conn.bookId}', '${conn.chapterId}')"
                    class="w-full text-left bg-slate-800/50 hover:bg-slate-700/50 rounded-lg p-3 border border-gray-700/50 transition-colors group">
              <p class="text-sm text-white group-hover:text-blue-300">${conn.label}</p>
              <p class="text-xs text-gray-500 mt-1">📚 ${this.getBookName(conn.bookId)}</p>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderHistoricalSection(contexts) {
    if (!contexts || contexts.length === 0) return '';

    return `
      <div>
        <h3 class="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
          <span>📜</span> Contexto Histórico
        </h3>
        <div class="space-y-2">
          ${contexts.map(ctx => `
            <div class="bg-amber-900/20 rounded-lg p-3 border border-amber-500/30">
              <div class="flex items-center justify-between mb-1">
                <p class="font-medium text-amber-400 text-sm">${ctx.event}</p>
                ${ctx.period ? `<span class="text-xs text-amber-500/70">${ctx.period}</span>` : ''}
              </div>
              <p class="text-xs text-gray-400 leading-relaxed">${ctx.description}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderAuthorsSection(authors) {
    if (!this.config.showAuthorBio || !authors || authors.length === 0) return '';

    return `
      <div>
        <h3 class="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
          <span>👤</span> Autores Citados
        </h3>
        <div class="space-y-2">
          ${authors.map(author => `
            <details class="bg-slate-800/50 rounded-lg border border-gray-700/50 group">
              <summary class="p-3 cursor-pointer flex items-center gap-2 list-none">
                <span class="font-medium text-white flex-1">${author.name}</span>
                <svg class="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </summary>
              <div class="px-3 pb-3">
                <p class="text-xs text-gray-400 leading-relaxed mb-2">${author.bio}</p>
                ${author.works?.length ? `
                  <p class="text-xs text-gray-500">
                    <span class="text-gray-600">Obras:</span> ${author.works.join(', ')}
                  </p>
                ` : ''}
              </div>
            </details>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderQuotesSection(quotes) {
    if (!this.config.showRelatedQuotes || !quotes || quotes.length === 0) return '';

    return `
      <div>
        <h3 class="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
          <span>💬</span> Citas Relacionadas
        </h3>
        <div class="space-y-2">
          ${quotes.map(quote => `
            <div class="bg-slate-800/50 rounded-lg p-3 border-l-4 border-purple-500/50">
              <p class="text-sm text-gray-300 italic leading-relaxed">"${quote.text}"</p>
              <p class="text-xs text-purple-400 mt-2">— ${quote.author}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderQuestionsSection(questions) {
    if (!questions || questions.length === 0) return '';

    return `
      <div>
        <h3 class="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
          <span>💭</span> Preguntas de Reflexión
        </h3>
        <div class="space-y-3">
          ${questions.map((q, _i) => `
            <div class="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-3 border border-blue-700/30">
              <p class="text-sm text-gray-200 leading-relaxed">${this.escapeHtml(q)}</p>
              <button onclick="window.smartReader?.openJournal('${encodeURIComponent(q)}')"
                      class="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
                Escribir reflexión
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // ACCIONES
  // ==========================================================================

  getBookName(bookId) {
    const names = {
      'el-codigo-del-despertar': 'El Código del Despertar',
      'manual-practico': 'Manual Práctico',
      'practicas-radicales': 'Prácticas Radicales'
    };
    return names[bookId] || bookId;
  }

  async navigateToConnection(bookId, chapterId) {
    this.close();

    if (window.bookReader?.navigateToExercise) {
      await window.bookReader.navigateToExercise(bookId, chapterId);
    } else if (window.bookEngine) {
      await window.bookEngine.loadBook(bookId);
      window.bookReader?.navigateToChapter(chapterId);
    }
  }

  openJournal(questionEncoded) {
    const question = decodeURIComponent(questionEncoded);

    if (window.notesModal) {
      window.notesModal.open(this.currentChapterId, question);
    } else {
      navigator.clipboard.writeText(question).then(() => {
        window.toast?.success('Pregunta copiada. Abre tus notas para escribir tu reflexión.');
      });
    }
  }

  toggleHighlight(enabled) {
    this.config.highlightTerms = enabled;
    localStorage.setItem('smart-reader-highlight', enabled.toString());

    if (enabled) {
      this.highlightTermsInContent();
    } else {
      document.querySelectorAll('.smart-term').forEach(el => {
        el.outerHTML = el.textContent;
      });
    }
  }

  async refresh() {
    if (this.currentChapterId) {
      delete this.cachedInsights[this.currentChapterId];
      const chapter = window.bookReader?.currentChapter;
      if (chapter) {
        await this.show(chapter);
        window.toast?.success('Panel actualizado');
      }
    }
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ==========================================================================
  // ACTIVACIÓN/DESACTIVACIÓN
  // ==========================================================================

  activate() {
    this.isEnabled = true;
    this.savePreference();

    const chapter = window.bookReader?.currentChapter;
    if (chapter && this.config.autoShowPanel) {
      this.show(chapter);
    }
  }

  deactivate() {
    this.isEnabled = false;
    this.savePreference();
    this.close();

    document.querySelectorAll('.smart-term').forEach(el => {
      el.outerHTML = el.textContent;
    });
  }

  close() {
    if (this.panelElement) {
      this.panelElement.remove();
      this.panelElement = null;
    }
    if (this._escapeHandler) {
      document.removeEventListener('keydown', this._escapeHandler);
      this._escapeHandler = null;
    }
    document.querySelector('.smart-term-popup')?.remove();
  }
}

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================

window.SmartReader = SmartReader;
window.smartReader = new SmartReader();

logger.log('[SmartReader] Panel contextual inteligente expandido inicializado');
