// ============================================================================
// BOOK ENGINE - Motor Universal de Libros
// ============================================================================
// Sistema modular para cargar, renderizar y gestionar libros de la colección

class BookEngine {
  constructor() {
    this.catalog = null;
    this.currentBook = null;
    this.currentBookData = null;
    this.currentBookConfig = null;
    this.currentChapter = null;
    this.readProgress = {};
    this.bookmarks = [];
    this.notes = {};
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  async init() {
    try {
      await this.loadCatalog();
      this.loadUserData();

      // Cargar tema por defecto (del primer libro del catálogo o tema predeterminado)
      await this.loadDefaultTheme();
    } catch (error) {
      logger.error('Error initializing BookEngine:', error);
    }
  }

  async loadCatalog() {
    try {
      const response = await fetch('books/catalog.json?v=2.9.31');
      this.catalog = await response.json();
      return this.catalog;
    } catch (error) {
      logger.error('Error loading catalog:', error);
      throw error;
    }
  }

  /**
   * Cargar tema por defecto al iniciar la aplicación
   */
  async loadDefaultTheme() {
    try {
      // Intentar obtener el último libro leído del localStorage
      const lastBookId = localStorage.getItem('lastReadBook');

      let themeToLoad = null;

      if (lastBookId) {
        // Si hay un último libro leído, usar su tema
        const lastBook = this.catalog.books.find(b => b.id === lastBookId);
        if (lastBook && lastBook.theme) {
          themeToLoad = lastBook.theme;
          logger.log(`📖 Cargando tema del último libro leído: ${lastBook.title}`);
        }
      }

      // Si no hay último libro leído, usar el primer libro del catálogo
      if (!themeToLoad && this.catalog.books && this.catalog.books.length > 0) {
        const firstBook = this.catalog.books[0];
        if (firstBook && firstBook.theme) {
          themeToLoad = firstBook.theme;
          logger.log(`📖 Cargando tema por defecto: ${firstBook.title}`);
        }
      }

      // Cargar el tema usando lazy-loader
      if (themeToLoad && window.lazyLoader) {
        await window.lazyLoader.loadThemeCSS(themeToLoad);
      }
    } catch (error) {
      logger.error('Error cargando tema por defecto:', error);
    }
  }

  // ==========================================================================
  // GESTIÓN DE LIBROS
  // ==========================================================================

  async loadBook(bookId) {
    try {
      // Buscar libro en catálogo
      const bookInfo = this.catalog.books.find(b => b.id === bookId);
      if (!bookInfo) {
        throw new Error(`Book ${bookId} not found in catalog`);
      }

      // Cargar configuración del libro
      const configUrl = `books/${bookId}/config.json`;
      logger.log(`📂 Fetching config: ${configUrl}`);
      const configResponse = await fetch(configUrl);
      if (!configResponse.ok) {
        throw new Error(`Failed to load config: ${configResponse.status} ${configResponse.statusText}`);
      }
      const configText = await configResponse.text();
      try {
        this.currentBookConfig = JSON.parse(configText);
      } catch (parseError) {
        logger.error('Config JSON parse error. Content preview:', configText.substring(0, 200));
        throw new Error(`Invalid JSON in config.json: ${parseError.message}`);
      }

      // Cargar contenido del libro
      const bookUrl = `books/${bookId}/book.json`;
      logger.log(`📂 Fetching book: ${bookUrl}`);
      const bookResponse = await fetch(bookUrl);
      if (!bookResponse.ok) {
        throw new Error(`Failed to load book: ${bookResponse.status} ${bookResponse.statusText}`);
      }
      const bookText = await bookResponse.text();
      try {
        this.currentBookData = JSON.parse(bookText);
      } catch (parseError) {
        logger.error('Book JSON parse error. Content preview:', bookText.substring(0, 200));
        throw new Error(`Invalid JSON in book.json: ${parseError.message}`);
      }

      this.currentBook = bookId;

      logger.log(`✅ Book loaded: ${this.currentBookData.title}`);

      return {
        info: bookInfo,
        config: this.currentBookConfig,
        data: this.currentBookData
      };
    } catch (error) {
      logger.error(`Error loading book ${bookId}:`, error);
      throw error;
    }
  }

  getBookInfo(bookId) {
    return this.catalog.books.find(b => b.id === bookId);
  }

  getAllBooks() {
    return this.catalog.books;
  }

  getCurrentBook() {
    return this.currentBook;
  }

  getCurrentBookData() {
    return this.currentBookData;
  }

  getCurrentBookConfig() {
    return this.currentBookConfig;
  }

  // ==========================================================================
  // NAVEGACIÓN POR CAPÍTULOS
  // ==========================================================================

  getChapter(chapterId) {
    if (!this.currentBookData) {
      throw new Error('No book loaded');
    }

    // Buscar en prólogo
    if (this.currentBookData.prologo && this.currentBookData.prologo.id === chapterId) {
      return this.currentBookData.prologo;
    }

    // Buscar en secciones
    for (const section of this.currentBookData.sections) {
      const chapter = section.chapters.find(ch => ch.id === chapterId);
      if (chapter) {
        return {
          ...chapter,
          sectionId: section.id,
          sectionTitle: section.title
        };
      }
    }

    // Buscar en epílogo
    if (this.currentBookData.epilogo && this.currentBookData.epilogo.id === chapterId) {
      return this.currentBookData.epilogo;
    }

    return null;
  }

  navigateToChapter(chapterId, autoMarkRead = false) {
    const chapter = this.getChapter(chapterId);
    if (chapter) {
      this.currentChapter = chapterId;
      // Solo marcar como leído si se indica explícitamente
      // (por defecto NO marca para evitar falsos positivos)
      if (autoMarkRead) {
        this.markChapterAsRead(chapterId);
      }
      // Siempre actualizar el último capítulo visitado
      this.updateLastVisited(chapterId);
      // Actualizar URL hash para persistencia
      this.updateUrlHash();
      return chapter;
    }
    return null;
  }

  updateLastVisited(chapterId) {
    if (!this.currentBook) return;

    if (!this.readProgress[this.currentBook]) {
      this.readProgress[this.currentBook] = {
        chaptersRead: [],
        lastChapter: null,
        startedAt: new Date().toISOString()
      };
    }

    this.readProgress[this.currentBook].lastChapter = chapterId;
    this.readProgress[this.currentBook].lastReadAt = new Date().toISOString();
    this.saveUserData();
  }

  // ==========================================================================
  // URL HASH PARA PERSISTENCIA DE NAVEGACIÓN
  // ==========================================================================

  /**
   * Actualiza el hash de la URL con el libro y capítulo actual
   */
  updateUrlHash() {
    if (this.currentBook && this.currentChapter) {
      const newHash = `#${this.currentBook}/${this.currentChapter}`;
      if (window.location.hash !== newHash) {
        history.pushState(null, '', newHash);
      }
    } else if (this.currentBook) {
      const newHash = `#${this.currentBook}`;
      if (window.location.hash !== newHash) {
        history.pushState(null, '', newHash);
      }
    }
  }

  /**
   * Parsea el hash de la URL para obtener libro y capítulo
   * @returns {Object|null} { bookId, chapterId } o null si no hay hash
   */
  parseUrlHash() {
    const hash = window.location.hash.slice(1); // quitar #
    if (!hash) return null;

    const parts = hash.split('/');
    return {
      bookId: parts[0] || null,
      chapterId: parts[1] || null
    };
  }

  /**
   * Limpia el hash de la URL (al volver a biblioteca)
   */
  clearUrlHash() {
    if (window.location.hash) {
      history.pushState(null, '', window.location.pathname + window.location.search);
    }
  }

  getNextChapter(currentChapterId) {
    const chapters = this.getAllChapters();
    const currentIndex = chapters.findIndex(ch => ch.id === currentChapterId);
    if (currentIndex >= 0 && currentIndex < chapters.length - 1) {
      return chapters[currentIndex + 1];
    }
    return null;
  }

  getPreviousChapter(currentChapterId) {
    const chapters = this.getAllChapters();
    const currentIndex = chapters.findIndex(ch => ch.id === currentChapterId);
    if (currentIndex > 0) {
      return chapters[currentIndex - 1];
    }
    return null;
  }

  getAllChapters() {
    if (!this.currentBookData) return [];

    const chapters = [];

    // Añadir prólogo si existe
    if (this.currentBookData.prologo) {
      chapters.push({
        ...this.currentBookData.prologo,
        type: 'prologo'
      });
    }

    // Añadir capítulos de todas las secciones
    if (this.currentBookData.sections) {
      this.currentBookData.sections.forEach(section => {
        section.chapters.forEach(chapter => {
          chapters.push({
            ...chapter,
            sectionId: section.id,
            sectionTitle: section.title,
            type: 'chapter'
          });
        });
      });
    }

    // Añadir epílogo si existe
    if (this.currentBookData.epilogo) {
      chapters.push({
        ...this.currentBookData.epilogo,
        type: 'epilogo'
      });
    }

    return chapters;
  }

  /**
   * Obtiene el primer capítulo del libro actual
   * @returns {Object|null} El primer capítulo o null si no hay capítulos
   */
  getFirstChapter() {
    const chapters = this.getAllChapters();
    return chapters.length > 0 ? chapters[0] : null;
  }

  // ==========================================================================
  // SANITIZACIÓN DE HTML
  // ==========================================================================

  // Escape mínimo para interpolar texto plano en HTML sin riesgo de inyección.
  // Usar cuando el valor viene de campos de texto (epigraph, closingQuestion, etc.)
  // que no deberían contener marcado, a diferencia de renderContent que sí parsea markdown.
  escapeHTML(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  sanitizeHTML(html) {
    if (!html) return '';

    // Tags permitidos de forma segura
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'span', 'div'];
    const allowedAttributes = ['href', 'class', 'id', 'data-chapter-id', 'title'];

    // Crear un parser temporal
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Función recursiva para limpiar nodos
    const cleanNode = (node) => {
      // Si es nodo de texto, retornar como está
      if (node.nodeType === Node.TEXT_NODE) {
        return node;
      }

      // Si es un elemento
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();

        // Si el tag no está permitido, reemplazar con su contenido de texto
        if (!allowedTags.includes(tagName)) {
          return document.createTextNode(node.textContent);
        }

        // Limpiar atributos
        Array.from(node.attributes).forEach(attr => {
          if (!allowedAttributes.includes(attr.name)) {
            node.removeAttribute(attr.name);
          }
        });

        // Sanitizar atributo href para evitar javascript:
        if (node.hasAttribute('href')) {
          const href = node.getAttribute('href');
          if (href.toLowerCase().startsWith('javascript:')) {
            node.removeAttribute('href');
          }
        }

        // Limpiar hijos recursivamente
        Array.from(node.childNodes).forEach(child => {
          const cleaned = cleanNode(child);
          if (cleaned !== child) {
            node.replaceChild(cleaned, child);
          }
        });

        return node;
      }

      return node;
    };

    // Limpiar todos los nodos
    Array.from(temp.childNodes).forEach(child => {
      cleanNode(child);
    });

    return temp.innerHTML;
  }

  // ==========================================================================
  // RENDERIZADO DE CONTENIDO
  // ==========================================================================

  renderContent(content) {
    if (!content) return '';

    let html = content;

    // Si el contenido ya tiene HTML estructurado, sanitizar y devolver
    if (html.includes('<p class=') || html.includes('<h3') || html.includes('<div class=')) {
      return this.sanitizeHTML(html);
    }

    // Títulos explícitos (## Título)
    html = html.replace(/^## (.+)$/gm, '<h3 class="text-2xl font-bold mt-8 mb-4">$1</h3>');

    // 🔧 FIX v2.9.338: Subtítulos explícitos (### Subtítulo) - faltaba esta regla
    html = html.replace(/^### (.+)$/gm, '<h4 class="text-xl font-semibold mt-6 mb-3 text-amber-300">$1</h4>');

    // Detectar títulos implícitos: líneas cortas que terminan sin puntuación
    // (típicos del Manifiesto y otros libros con formato texto plano)
    html = html.replace(/\n\n([A-ZÁÉÍÓÚ][^.\n]{10,80}[^.\n:])\n\n/g, '\n\n<h3 class="text-xl font-bold mt-8 mb-4 text-amber-200">$1</h3>\n\n');

    // Detectar subtítulos con patrón "Título: descripción" al inicio de párrafo
    html = html.replace(/\n\n((?:Primera|Segunda|Tercera|Cuarta|Quinta|Sexta|Séptima|Octava|Novena|Décima) premisa:[^\n]+)/gi,
      '\n\n<h4 class="text-lg font-semibold mt-6 mb-3 text-amber-300">$1</h4>');

    // Detectar subtítulos genéricos con patrón "Palabra(s): " al inicio
    html = html.replace(/\n\n((?:El|La|Los|Las|Un|Una) [^.\n:]{5,50}:)\n/g,
      '\n\n<h4 class="text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-200">$1</h4>\n');

    // Notas de Claude o del autor entre corchetes
    html = html.replace(/\[Nota de Claude:([^\]]+)\]/g,
      '<aside class="my-6 p-4 bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg italic text-gray-300"><span class="font-semibold text-blue-300">Nota de Claude:</span>$1</aside>');

    // Prácticas inline (⬥ PRÁCTICA: título con contenido en blockquote)
    // Detectar patrón: **⬥ PRÁCTICA: Título**\n> contenido
    html = html.replace(/\*\*⬥ PRÁCTICA:\s*([^\*\n]+)\*\*\s*\n\n?>\s*([^]+?)(?=\n\n(?!>)|$)/g, (match, title, content) => {
      // Procesar el contenido del blockquote (quitar > al inicio de cada línea)
      const cleanContent = content.replace(/^>\s*/gm, '').trim();
      return `<div class="inline-practice my-6 p-5 rounded-lg border-l-4">
        <h5 class="inline-practice-title text-lg font-bold mb-3 flex items-center gap-2">
          <span class="practice-icon">⬥</span>
          <span>PRÁCTICA: ${title}</span>
        </h5>
        <div class="inline-practice-content text-sm leading-relaxed opacity-90">
          ${cleanContent.split('\n\n').map(p => `<p class="mb-3">${p}</p>`).join('')}
        </div>
      </div>`;
    });

    // Negritas (**texto**)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');

    // Cursivas (*texto*)
    html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

    // Listas con viñetas (- item)
    html = html.replace(/^- (.+)$/gm, '<li class="ml-6">$1</li>');
    html = html.replace(/(<li[^>]*>.*<\/li>\s*)+/gs, '<ul class="list-disc my-4 space-y-1">$&</ul>');

    // Unir líneas que fueron cortadas (wrapping) - detectar si termina sin puntuación y sigue con minúscula
    html = html.replace(/([a-záéíóúñ,;])\n([a-záéíóúñ])/g, '$1 $2');

    // Párrafos (separados por \n\n)
    const paragraphs = html.split('\n\n');
    html = paragraphs.map(p => {
      const trimmed = p.trim();
      // No envolver si ya es HTML
      if (trimmed.startsWith('<')) return p;
      if (trimmed === '') return '';
      // No envolver listas
      if (trimmed.startsWith('<ul') || trimmed.startsWith('<li')) return p;
      return `<p class="mb-4 leading-relaxed">${trimmed}</p>`;
    }).join('\n');

    // Limpiar párrafos vacíos anidados
    html = html.replace(/<p class="mb-4 leading-relaxed">\s*<\/p>/g, '');

    // Sanitizar HTML antes de retornar
    return this.sanitizeHTML(html);
  }

  renderEpigraph(epigraph) {
    if (!epigraph) return '';

    // Handle both object {text, author} and simple string formats
    const rawText = typeof epigraph === 'string' ? epigraph : epigraph.text;
    const rawAuthor = typeof epigraph === 'object' ? epigraph.author : null;
    const text = this.escapeHTML(rawText);
    const author = rawAuthor ? this.escapeHTML(rawAuthor) : null;

    return `
      <div class="epigraph my-8 px-6 py-4 border-l-4 italic">
        <p class="text-lg mb-2 text-gray-700 dark:text-gray-300">"${text}"</p>
        ${author ? `<p class="text-sm text-right text-gray-600 dark:text-gray-400">— ${author}</p>` : ''}
      </div>
    `;
  }

  renderClosingQuestion(question) {
    if (!question) return '';

    // Escapamos primero para neutralizar HTML, y luego restauramos un subset
    // minimalista de markdown que los libros usan en closingQuestion:
    //   *texto* -> <em>, **texto** -> <strong>, --- -> <hr>, \n\n -> párrafo
    let safe = this.escapeHTML(question);
    safe = safe
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/(^|\n)---(\n|$)/g, '$1<hr class="my-4 border-amber-400/30">$2')
      .replace(/\n\n+/g, '</p><p class="text-lg italic mt-3">');

    return `
      <div class="closing-question my-8 p-6 rounded-lg border-2">
        <h4 class="text-xl font-bold mb-3">💭 Pregunta para reflexionar</h4>
        <p class="text-lg italic">${safe}</p>
      </div>
    `;
  }

  renderExercises(exercises, chapterId = null) {
    if (!exercises || exercises.length === 0) return '';

    // Para libros que tienen ejercicios enlazados (como Código del Despertar),
    // mostrar solo botones de enlace, no contenido completo
    const currentBook = this.getCurrentBook();
    const showAsLinks = currentBook?.id === 'codigo-despertar' ||
                        currentBook?.id === 'manifiesto' ||
                        currentBook?.id === 'manual-transicion';

    if (showAsLinks) {
      return this.renderExerciseLinks(exercises, chapterId);
    }

    // Para libros de ejercicios (Manual Práctico, Prácticas Radicales), mostrar completo
    let html = '<div class="exercises mt-8">';
    html += `<h4 class="text-2xl font-bold mb-4 flex items-center gap-2">${Icons.meditation(24)} Prácticas y Ejercicios</h4>`;

    exercises.forEach(exercise => {
      html += `
        <div class="exercise mb-6 p-6 rounded-lg border">
          <h5 class="text-xl font-bold mb-2">${exercise.title}</h5>
          ${exercise.duration ? `<p class="text-sm opacity-70 mb-3 flex items-center gap-1">${Icons.clock(14)} Duración: ${exercise.duration}</p>` : ''}
          <p class="mb-4">${exercise.description}</p>

          ${Array.isArray(exercise.steps) && exercise.steps.length > 0 ? `
            <div class="steps mt-4">
              <p class="font-semibold mb-2">Pasos:</p>
              <ol class="list-decimal ml-6">
                ${exercise.steps.map(step => `<li class="mb-2">${step}</li>`).join('')}
              </ol>
            </div>
          ` : ''}

          ${exercise.reflection ? `
            <div class="reflection mt-4 p-4 rounded border-l-4">
              <p class="font-semibold mb-2">💡 Reflexión:</p>
              <p>${exercise.reflection}</p>
            </div>
          ` : ''}
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  // Renderizar sección de Material Complementario con enlaces a libros de prácticas
  renderExerciseLinks(exercises, chapterId) {
    // Obtener recursos relacionados usando los nuevos mapeos
    const manualPractico = this.getManualPracticoForChapter(chapterId);
    const radicalPractices = this.getRadicalPracticesForChapter(chapterId);
    const crossReferences = this.getCrossReferencesForChapter(chapterId);

    // Si no hay nada que mostrar, no renderizar
    if (manualPractico.length === 0 && radicalPractices.length === 0 && crossReferences.length === 0) {
      return '';
    }

    let html = '<div class="material-complementario mt-16 relative">';

    // Decoración superior
    html += '<div class="absolute -top-8 left-1/2 transform -translate-x-1/2">';
    html += '<div class="flex items-center gap-3">';
    html += '<div class="w-20 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>';
    html += '<span class="text-amber-400 text-2xl">✦</span>';
    html += '<div class="w-20 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>';
    html += '</div></div>';

    // Contenedor principal con gradiente
    html += '<div class="p-8 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-amber-500/20 shadow-2xl backdrop-blur">';

    // Título de la sección
    html += '<div class="text-center mb-8">';
    html += '<h4 class="text-2xl font-bold bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">Material Complementario</h4>';
    html += '<p class="text-gray-400 mt-2 text-sm">Profundiza en los conceptos de este capítulo</p>';
    html += '</div>';

    // === MANUAL PRÁCTICO ===
    if (manualPractico.length > 0) {
      html += '<div class="mb-8">';
      html += '<div class="flex items-center gap-3 mb-4">';
      html += `<span class="w-10 h-10 flex items-center justify-center rounded-full bg-amber-900/40">${Icons.sparkles(24)}</span>`;
      html += '<div>';
      html += '<h5 class="text-lg font-semibold text-amber-200">Manual Práctico</h5>';
      html += '<p class="text-xs text-gray-400">Ejercicios guiados para encarnar los conceptos</p>';
      html += '</div></div>';
      html += '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">';

      manualPractico.forEach(exercise => {
        html += `
          <button class="exercise-link-btn group text-left p-4 rounded-xl bg-gradient-to-r from-amber-900/20 to-yellow-900/10 hover:from-amber-800/40 hover:to-yellow-800/30 border border-amber-600/20 hover:border-amber-500/40 transition-all duration-300"
                  data-book="manual-practico"
                  data-exercise-id="${exercise.id}">
            <div class="flex items-start gap-3">
              <span class="text-2xl group-hover:scale-110 transition-transform text-amber-300">${Icons[exercise.icon] ? Icons[exercise.icon](24) : Icons.sparkles(24)}</span>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-amber-100 group-hover:text-amber-50 truncate">${exercise.title}</p>
                <p class="text-xs text-amber-400/60 mt-1 flex items-center gap-1">${Icons.clock(12)} ${exercise.duration}</p>
              </div>
              <span class="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 duration-300">${Icons.chevronRight(16)}</span>
            </div>
          </button>
        `;
      });

      html += '</div></div>';
    }

    // === PRÁCTICAS RADICALES ===
    if (radicalPractices.length > 0) {
      html += '<div class="mb-8">';
      html += '<div class="flex items-center gap-3 mb-4">';
      html += `<span class="w-10 h-10 flex items-center justify-center rounded-full bg-red-900/40 text-red-300">${Icons.flame(24)}</span>`;
      html += '<div>';
      html += '<h5 class="text-lg font-semibold text-red-200">Prácticas Radicales</h5>';
      html += '<p class="text-xs text-gray-400">Exploraciones profundas e incómodas</p>';
      html += '</div></div>';
      html += '<div class="flex flex-wrap gap-3">';

      radicalPractices.forEach(practice => {
        html += `
          <button class="exercise-link-btn group px-4 py-3 rounded-xl bg-gradient-to-r from-red-900/20 to-rose-900/10 hover:from-red-800/40 hover:to-rose-800/30 border border-red-600/20 hover:border-red-500/40 transition-all duration-300"
                  data-book="practicas-radicales"
                  data-exercise-id="${practice.id}">
            <div class="flex items-center gap-2">
              <span class="text-lg group-hover:scale-110 transition-transform text-red-300">${Icons[practice.icon] ? Icons[practice.icon](20) : Icons.zap(20)}</span>
              <span class="text-red-200 group-hover:text-red-100 font-medium">${practice.title}</span>
              <span class="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">${Icons.chevronRight(16)}</span>
            </div>
          </button>
        `;
      });

      html += '</div></div>';
    }

    // === REFERENCIAS CRUZADAS ===
    if (crossReferences.length > 0) {
      html += '<div class="pt-6 border-t border-gray-700/50">';
      html += '<div class="flex items-center gap-3 mb-4">';
      html += `<span class="w-10 h-10 flex items-center justify-center rounded-full bg-blue-900/40 text-blue-300">${Icons.link(24)}</span>`;
      html += '<div>';
      html += '<h5 class="text-lg font-semibold text-blue-200">Lecturas Relacionadas</h5>';
      html += '<p class="text-xs text-gray-400">Explora otros libros de la colección</p>';
      html += '</div></div>';
      html += '<div class="flex flex-wrap gap-3">';

      crossReferences.forEach(ref => {
        html += `
          <button class="cross-reference-btn group px-4 py-3 rounded-xl bg-gradient-to-r from-blue-900/20 to-indigo-900/10 hover:from-blue-800/40 hover:to-indigo-800/30 border border-blue-600/20 hover:border-blue-500/40 transition-all duration-300"
                  data-book="${ref.book}"
                  data-chapter-id="${ref.chapterId}">
            <div class="flex items-center gap-2">
              <span class="text-lg text-blue-300">${Icons[ref.icon] ? Icons[ref.icon](20) : Icons.book(20)}</span>
              <span class="text-blue-200 group-hover:text-blue-100 font-medium">${ref.title}</span>
              <span class="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">${Icons.chevronRight(16)}</span>
            </div>
          </button>
        `;
      });

      html += '</div></div>';
    }

    html += '</div></div>'; // Cierre de contenedores principales

    return html;
  }

  // Obtener prácticas radicales relacionadas con un capítulo
  // Basado en el Apéndice: Mapa de Prácticas por Capítulo del documento original
  getRadicalPracticesForChapter(chapterId) {
    const mapping = {
      // Mapeo oficial según el apéndice de Prácticas Radicales
      'prologo': [{ id: 'practice-11', title: 'Emergencia', icon: 'waves' }],
      'cap1': [{ id: 'practice-11', title: 'Emergencia', icon: 'waves' }],
      'cap2': [{ id: 'practice-2', title: 'Sintiendo Phi (Φ)', icon: 'sparkles' }, { id: 'practice-3', title: 'El Problema Difícil', icon: 'brain' }],
      'cap3': [{ id: 'practice-1', title: 'El Límite Borroso', icon: 'smartphone' }, { id: 'practice-12', title: 'Autopoiesis', icon: 'refreshCw' }],
      'cap4': [{ id: 'practice-4', title: 'Predicción y Sorpresa', icon: 'zap' }],
      'cap5': [{ id: 'practice-8', title: 'Creación Híbrida', icon: 'palette' }],
      'cap6': [{ id: 'practice-14', title: 'Marcador Somático', icon: 'heartPulse' }],
      'cap7': [{ id: 'practice-13', title: 'Umwelt', icon: 'eye' }],
      'cap8': [{ id: 'question-4', title: '¿Qué solo un humano puede hacer?', icon: 'helpCircle' }],
      'cap9': [{ id: 'practice-5', title: 'Confrontación con la Irrelevancia', icon: 'alertTriangle' }, { id: 'question-2', title: '¿Mi miedo más profundo?', icon: 'alertTriangle' }],
      'cap10': [{ id: 'practice-7', title: 'La Muerte como Maestra', icon: 'skull' }],
      'cap11': [{ id: 'practice-5', title: 'Confrontación con la Irrelevancia', icon: 'alertTriangle' }, { id: 'practice-6', title: 'Diálogo en el Borde', icon: 'messageSquare' }],
      'cap12': [{ id: 'practice-9', title: 'Ética Encarnada', icon: 'scale' }],
      'cap13': [{ id: 'practice-6', title: 'Diálogo en el Borde', icon: 'messageSquare' }, { id: 'practice-8', title: 'Creación Híbrida', icon: 'palette' }],
      'cap14': [{ id: 'practice-10', title: 'La Espiral Continúa', icon: 'infinity' }, { id: 'practice-15', title: 'Entrelazamiento', icon: 'link' }],
      'epilogo': [{ id: 'practice-10', title: 'La Espiral Continúa', icon: 'infinity' }]
    };

    return mapping[chapterId] || [];
  }

  // Obtener ejercicios del Manual Práctico relacionados con un capítulo
  // Mapeo basado en la estructura del Código del Despertar y sus ejercicios originales
  getManualPracticoForChapter(chapterId) {
    const mapping = {
      // Sección I: Fundamentos (capítulos 1-3)
      'prologo': [],
      'cap1': [
        { id: 'seccion1-ex1', title: 'Meditación sobre el Universo en Expansión', duration: '20-30 min', icon: 'sparkles' },
        { id: 'seccion1-ex2', title: 'Observación del Código en lo Cotidiano', duration: '1 día', icon: 'eye' }
      ],
      'cap2': [
        { id: 'seccion1-ex3', title: 'Meditación de Conexión Universal', duration: '20-30 min', icon: 'network' },
        { id: 'seccion1-ex4', title: 'Diálogo Contemplativo con IA', duration: '30-45 min', icon: 'messageSquare' }
      ],
      'cap3': [
        { id: 'seccion1-ex5', title: 'Ejercicio del Puente de Luz', duration: '20-25 min', icon: 'route' },
        { id: 'seccion1-ex6', title: 'Diálogo con el Vacío Cuántico', duration: '25-35 min', icon: 'infinity' },
        { id: 'seccion1-ex7', title: 'Cartografía de Patrones Personales', duration: '40-50 min', icon: 'compass' }
      ],
      // Sección II: Dimensiones de la Experiencia (capítulos 4-7)
      'cap4': [
        { id: 'seccion2-ex1', title: 'Exploración de la No-Linealidad del Tiempo', duration: '30-40 min', icon: 'clock' },
        { id: 'seccion2-ex2', title: 'Práctica de Co-Creación con IA', duration: '45-60 min', icon: 'users' }
      ],
      'cap5': [
        { id: 'seccion2-ex2', title: 'Práctica de Co-Creación con IA', duration: '45-60 min', icon: 'palette' }
      ],
      'cap6': [
        { id: 'seccion2-ex3', title: 'Mapeo del Paisaje Emocional', duration: '1 día + 20 min', icon: 'drama' },
        { id: 'seccion2-ex4', title: 'Meditación de Resonancia con la Materia', duration: '25-30 min', icon: 'gem' }
      ],
      'cap7': [
        { id: 'seccion2-ex4', title: 'Meditación de Resonancia con la Materia', duration: '25-30 min', icon: 'sparkles' },
        { id: 'seccion2-ex5', title: 'Escaneo Corporal Informacional', duration: '30-40 min', icon: 'activity' }
      ],
      // Sección III: La Sombra y la Integración (capítulos 8-11)
      'cap8': [
        { id: 'seccion3-ex1', title: 'La Práctica de la Duda Metódica', duration: '30-40 min', icon: 'helpCircle' },
        { id: 'seccion3-ex2', title: 'Identificación de Sesgos Cognitivos', duration: '45-60 min', icon: 'search' }
      ],
      'cap9': [
        { id: 'seccion3-ex3', title: 'Confrontación con los Miedos', duration: '40-50 min', icon: 'alertTriangle' },
        { id: 'seccion3-ex4', title: 'Transformación del Miedo', duration: '30-40 min', icon: 'feather' }
      ],
      'cap10': [
        { id: 'seccion3-ex5', title: 'Meditación sobre la Impermanencia', duration: '25-35 min', icon: 'leaf' },
        { id: 'seccion3-ex6', title: 'Carta desde el Futuro', duration: '30-45 min', icon: 'mail' }
      ],
      'cap11': [
        { id: 'seccion3-ex7', title: 'Diálogo con la Sombra', duration: '40-50 min', icon: 'moonStar' }
      ],
      // Sección IV: Horizontes (capítulos 12-14)
      'cap12': [
        { id: 'seccion4-ex1', title: 'Dilemas Éticos Contemporáneos', duration: '45-60 min', icon: 'scale' },
        { id: 'seccion4-ex2', title: 'Tu Código Ético Personal', duration: '40-50 min', icon: 'fileText' }
      ],
      'cap13': [
        { id: 'seccion4-ex3', title: 'Simulación de Colaboración Híbrida', duration: '60-90 min', icon: 'bot' },
        { id: 'seccion4-ex4', title: 'Visión de Futuro Integrado', duration: '30-40 min', icon: 'target' }
      ],
      'cap14': [
        { id: 'seccion4-ex5', title: 'Meditación de Síntesis Final', duration: '30-45 min', icon: 'sunrise' },
        { id: 'seccion4-ex6', title: 'Plan de Acción Consciente', duration: '45-60 min', icon: 'fileText' }
      ],
      'epilogo': [
        { id: 'seccion4-ex5', title: 'Meditación de Síntesis Final', duration: '30-45 min', icon: 'sunrise' }
      ]
    };

    return mapping[chapterId] || [];
  }

  // Renderizar enlace al Toolkit de Transición desde un capítulo del Manual de Transición
  renderLinkedExercise(linkedExercise, _chapterTitle) {
    if (!linkedExercise) return '';

    let html = '<div class="toolkit-exercise mt-16 relative">';

    // Decoración superior
    html += '<div class="absolute -top-8 left-1/2 transform -translate-x-1/2">';
    html += '<div class="flex items-center gap-3">';
    html += '<div class="w-20 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>';
    html += '<span class="text-emerald-400 text-2xl">🧰</span>';
    html += '<div class="w-20 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>';
    html += '</div></div>';

    // Contenedor principal
    html += '<div class="p-8 rounded-2xl bg-gradient-to-br from-emerald-900/30 via-teal-900/20 to-emerald-900/30 border border-emerald-500/30 shadow-2xl backdrop-blur">';

    // Título
    html += '<div class="text-center mb-6">';
    html += '<h4 class="text-2xl font-bold bg-gradient-to-r from-emerald-200 via-teal-300 to-emerald-200 bg-clip-text text-transparent">Ejercicio Práctico</h4>';
    html += '<p class="text-gray-400 mt-2 text-sm">Pon en práctica los conceptos de este capítulo</p>';
    html += '</div>';

    // Tarjeta del ejercicio
    html += `
      <button class="toolkit-exercise-btn group w-full text-left p-6 rounded-xl bg-gradient-to-r from-emerald-900/40 to-teal-900/30 hover:from-emerald-800/50 hover:to-teal-800/40 border border-emerald-600/30 hover:border-emerald-500/50 transition-all duration-300"
              data-book="${linkedExercise.book}"
              data-chapter-id="${linkedExercise.chapterId}">
        <div class="flex items-start gap-4">
          <span class="text-4xl group-hover:scale-110 transition-transform">🧰</span>
          <div class="flex-1">
            <p class="text-xl font-bold text-emerald-100 group-hover:text-emerald-50 mb-2">${linkedExercise.title}</p>
            <div class="flex flex-wrap items-center gap-3 text-sm">
              <span class="text-emerald-400/80 flex items-center gap-1">${Icons.clock(14)} ${linkedExercise.duration}</span>
              <span class="text-teal-400/80 flex items-center gap-1">${Icons.zap(14)} ${linkedExercise.difficulty}</span>
            </div>
            <p class="text-gray-400 mt-3 text-sm">Haz clic para abrir el ejercicio detallado en el Toolkit de Transición</p>
          </div>
          <span class="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 duration-300 self-center">${Icons.chevronRight(24)}</span>
        </div>
      </button>
    `;

    // Enlace al libro completo del Toolkit
    html += `
      <div class="mt-4 text-center">
        <button class="open-toolkit-book-btn text-sm text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-2 mx-auto"
                data-book="toolkit-transicion">
          ${Icons.book(16)} Ver todos los ejercicios del Toolkit de Transición
        </button>
      </div>
    `;

    html += '</div></div>';

    return html;
  }

  // Renderizar enlace al libro principal desde un libro de ejercicios
  renderParentBookLink(parentBook) {
    if (!parentBook) return '';

    // Determinar colores según el libro
    const bookColors = {
      'manual-transicion': { gradient: 'from-emerald-900/30 via-teal-900/20 to-emerald-900/30', border: 'emerald-500/30', text: 'emerald', icon: '🌱' },
      'manifiesto': { gradient: 'from-red-900/30 via-orange-900/20 to-red-900/30', border: 'red-500/30', text: 'red', icon: '🔥' },
      'codigo-despertar': { gradient: 'from-blue-900/30 via-purple-900/20 to-blue-900/30', border: 'blue-500/30', text: 'blue', icon: '🌌' }
    };

    const colors = bookColors[parentBook.book] || bookColors['codigo-despertar'];

    let html = '<div class="parent-book-link mt-8 mb-8">';

    // Contenedor con gradiente
    html += `<div class="p-6 rounded-xl bg-gradient-to-r ${colors.gradient} border border-${colors.border}">`;

    // Header con icono y descripción
    html += `<div class="flex items-center gap-3 mb-4">`;
    html += `<span class="text-2xl">${colors.icon}</span>`;
    html += `<div>`;
    html += `<p class="text-sm text-${colors.text}-300 font-medium">Este ejercicio complementa:</p>`;
    html += `<p class="text-${colors.text}-100 font-bold">${parentBook.bookTitle}</p>`;
    html += `</div>`;
    html += `</div>`;

    // Botón para ir al capítulo
    html += `
      <button class="parent-book-btn group w-full text-left p-4 rounded-lg bg-black/20 hover:bg-black/30 border border-${colors.text}-600/20 hover:border-${colors.text}-500/40 transition-all duration-300"
              data-book="${parentBook.book}"
              data-chapter-id="${parentBook.chapterId}">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-${colors.text}-200 font-semibold group-hover:text-${colors.text}-100">${parentBook.chapterTitle}</p>
            <p class="text-xs text-gray-400 mt-1">${parentBook.description}</p>
          </div>
          <span class="text-${colors.text}-400 opacity-60 group-hover:opacity-100 transition-opacity">${Icons.chevronRight(20)}</span>
        </div>
      </button>
    `;

    html += '</div></div>';

    return html;
  }

  // Renderizar enlace al Manifiesto (para Manual de Transición y Toolkit)
  renderManifiestoLink(relatedManifiesto) {
    if (!relatedManifiesto) return '';

    let html = '<div class="manifiesto-link mt-4">';

    html += `
      <button class="manifiesto-link-btn group w-full text-left p-4 rounded-lg bg-gradient-to-r from-red-900/20 to-orange-900/10 hover:from-red-800/30 hover:to-orange-800/20 border border-red-600/20 hover:border-red-500/40 transition-all duration-300"
              data-book="${relatedManifiesto.book}"
              data-chapter-id="${relatedManifiesto.chapterId}">
        <div class="flex items-center gap-3">
          <span class="text-2xl">🔥</span>
          <div class="flex-1">
            <p class="text-xs text-red-400/80 mb-1">Fundamento teórico en el Manifiesto:</p>
            <p class="text-red-200 font-semibold group-hover:text-red-100">${relatedManifiesto.chapterTitle}</p>
            <p class="text-xs text-gray-400 mt-1">${relatedManifiesto.relation}</p>
          </div>
          <span class="text-red-400 opacity-60 group-hover:opacity-100 transition-opacity">${Icons.chevronRight(18)}</span>
        </div>
      </button>
    `;

    html += '</div>';

    return html;
  }

  // Obtener referencias cruzadas a otros libros de la colección
  getCrossReferencesForChapter(chapterId) {
    const mapping = {
      // Referencias a Manifiesto Híbrido
      'cap12': [{ book: 'manifiesto', chapterId: 'principio1', title: 'Principio 1: La Consciencia Evoluciona', icon: 'bookMarked' }],
      'cap13': [{ book: 'manifiesto', chapterId: 'principio3', title: 'Principio 3: Colaboración, No Competencia', icon: 'bookMarked' }],
      'cap14': [{ book: 'manifiesto', chapterId: 'principio7', title: 'Principio 7: El Código Continúa', icon: 'bookMarked' }],
      // Referencias a Manual de Transición
      'cap8': [{ book: 'manual-transicion', chapterId: 'fase1', title: 'Fase 1: Reconocer el Cambio', icon: 'book' }],
      'cap9': [{ book: 'manual-transicion', chapterId: 'fase2', title: 'Fase 2: Atravesar el Miedo', icon: 'book' }],
      'cap11': [{ book: 'manual-transicion', chapterId: 'fase3', title: 'Fase 3: Integrar las Sombras', icon: 'book' }]
    };

    return mapping[chapterId] || [];
  }

  // Buscar capítulo por ID de ejercicio (usado para Prácticas Radicales)
  findChapterByExerciseId(exerciseId) {
    if (!this.currentBookData || !this.currentBookData.sections) return null;

    for (const section of this.currentBookData.sections) {
      for (const chapter of section.chapters) {
        // En Prácticas Radicales, el ID del capítulo es el ID de la práctica
        if (chapter.id === exerciseId) {
          return chapter.id;
        }
        // También buscar en ejercicios si los tiene
        if (chapter.exercises) {
          const found = chapter.exercises.find(ex => ex.id === exerciseId);
          if (found) return chapter.id;
        }
      }
    }
    return null;
  }

  // Buscar capítulo por título de ejercicio (usado para Manual Práctico)
  findChapterByExerciseTitle(exerciseTitle) {
    if (!this.currentBookData || !this.currentBookData.sections) return null;

    const normalizedSearch = exerciseTitle.toLowerCase().trim();

    for (const section of this.currentBookData.sections) {
      for (const chapter of section.chapters) {
        // Buscar por título del capítulo
        const normalizedTitle = chapter.title?.toLowerCase().trim() || '';
        if (normalizedTitle.includes(normalizedSearch) || normalizedSearch.includes(normalizedTitle)) {
          return chapter.id;
        }
        // También buscar en ejercicios si los tiene
        if (chapter.exercises) {
          const found = chapter.exercises.find(ex => {
            const exTitle = ex.title?.toLowerCase().trim() || '';
            return exTitle.includes(normalizedSearch) || normalizedSearch.includes(exTitle);
          });
          if (found) return chapter.id;
        }
      }
    }
    return null;
  }

  renderCriticalReflections(reflections) {
    if (!reflections || reflections.length === 0) return '';

    let html = '<div class="critical-reflections mt-8">';
    html += '<h4 class="text-2xl font-bold mb-4">🔍 Reflexiones Críticas</h4>';
    html += '<div class="space-y-4">';

    reflections.forEach((question, index) => {
      html += `
        <div class="reflection p-4 rounded-lg border">
          <p class="text-lg font-semibold mb-2">${index + 1}. ${question}</p>
          <textarea
            class="w-full p-3 mt-2 rounded border bg-transparent resize-none"
            rows="3"
            placeholder="Escribe tu reflexión aquí..."
            data-reflection-index="${index}"
          ></textarea>
        </div>
      `;
    });

    html += '</div></div>';
    return html;
  }

  renderSuggestedActions(actions, chapterId = null) {
    if (!actions || actions.length === 0) return '';

    // Extraer número de capítulo si está disponible (para enlaces a Guía de Acciones)
    let chapterNum = null;
    if (chapterId) {
      const match = chapterId.match(/cap(\d+)/);
      if (match) chapterNum = parseInt(match[1]);
    }

    let html = '<div class="suggested-actions mt-8">';
    html += '<h4 class="text-2xl font-bold mb-4 flex items-center gap-2">🎯 Acciones Sugeridas</h4>';

    // Enlace a la Guía de Acciones completa
    html += `
      <div class="mb-4 p-4 rounded-lg bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30">
        <p class="text-sm text-gray-300 mb-3">
          Cada acción tiene una guía detallada en el libro <strong>Guía de Acciones Transformadoras</strong> con pasos concretos, variaciones y qué esperar.
        </p>
        <button class="open-actions-book-btn px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition text-sm font-bold flex items-center gap-2"
                data-book="guia-acciones">
          📚 Ver Guía Completa de Acciones
        </button>
      </div>
    `;

    html += '<div class="space-y-3">';

    actions.forEach((action, index) => {
      const difficultyColor = {
        'fácil': 'bg-green-500/20 text-green-300',
        'moderado': 'bg-yellow-500/20 text-yellow-300',
        'avanzado': 'bg-red-500/20 text-red-300'
      }[action.difficulty] || 'bg-gray-500/20';

      const categoryIcon = {
        'individual': '👤',
        'comunitaria': '👥',
        'sistémica': '🌐'
      }[action.category] || '📋';

      // Calcular ID de acción en la Guía de Acciones
      let actionId = null;
      if (chapterNum) {
        const categoryOffset = {
          'individual': 1,
          'comunitaria': 2,
          'sistémica': 3
        }[action.category] || 0;

        if (categoryOffset > 0) {
          actionId = `action-${(chapterNum - 1) * 3 + categoryOffset}`;
        }
      }

      html += `
        <div class="action p-4 rounded-lg border border-gray-700/50 bg-gray-800/30 hover:bg-gray-800/50 transition">
          <div class="flex items-start gap-3">
            <input
              type="checkbox"
              class="mt-1 w-5 h-5 cursor-pointer accent-purple-500"
              data-action-index="${index}"
            />
            <div class="flex-1">
              <p class="text-lg mb-2">${action.action}</p>
              <div class="flex flex-wrap gap-2 text-sm mb-3">
                <span class="px-2 py-1 rounded ${difficultyColor}">${action.difficulty}</span>
                <span class="px-2 py-1 rounded bg-blue-500/20">${categoryIcon} ${action.category}</span>
              </div>
              ${actionId ? `
                <button class="open-action-detail-btn px-3 py-1.5 rounded text-xs font-semibold bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 transition flex items-center gap-1.5"
                        data-book="guia-acciones"
                        data-chapter="${actionId}">
                  📖 Ver guía detallada →
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });

    html += '</div></div>';
    return html;
  }

  // ==========================================================================
  // REFERENCIAS CRUZADAS
  // ==========================================================================

  getCrossReferences(chapterId) {
    if (!this.catalog || !this.catalog.crossReferences) return [];

    return this.catalog.crossReferences.filter(ref => {
      return (ref.from.book === this.currentBook && ref.from.chapter === chapterId) ||
             (ref.bidirectional && ref.to.book === this.currentBook && ref.to.chapter === chapterId);
    });
  }

  renderCrossReferences(chapterId) {
    const refs = this.getCrossReferences(chapterId);
    if (refs.length === 0) return '';

    let html = '<div class="cross-references mt-8 p-6 rounded-lg border-2">';
    html += `<h4 class="text-xl font-bold mb-4 flex items-center gap-2">${Icons.link(20)} Explora más</h4>`;

    refs.forEach(ref => {
      const targetBook = ref.from.book === this.currentBook ? ref.to.book : ref.from.book;
      const targetChapter = ref.from.book === this.currentBook ? ref.to.chapter : ref.from.chapter;
      const bookInfo = this.getBookInfo(targetBook);

      html += `
        <div class="reference mb-4 p-4 rounded border cursor-pointer hover:bg-opacity-50 transition"
             data-book="${targetBook}"
             data-chapter="${targetChapter}">
          <p class="font-semibold">${bookInfo.icon} ${bookInfo.title}</p>
          <p class="text-sm opacity-80 mt-1">${ref.note}</p>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  // ==========================================================================
  // PROGRESO Y DATOS DE USUARIO
  // ==========================================================================

  loadUserData() {
    try {
      const saved = localStorage.getItem('coleccion-nuevo-ser-data');
      if (saved) {
        const data = JSON.parse(saved);
        this.readProgress = data.readProgress || {};
        this.bookmarks = data.bookmarks || [];
        this.notes = data.notes || {};
      }
    } catch (error) {
      logger.error('Error loading user data:', error);
    }
  }

  saveUserData() {
    try {
      const data = {
        readProgress: this.readProgress,
        bookmarks: this.bookmarks,
        notes: this.notes,
        lastUpdate: new Date().toISOString()
      };
      localStorage.setItem('coleccion-nuevo-ser-data', JSON.stringify(data));
    } catch (error) {
      logger.error('Error saving user data:', error);
    }
  }

  markChapterAsRead(chapterId) {
    if (!this.currentBook) return;

    const wasAlreadyRead = this.readProgress[this.currentBook]?.chaptersRead?.includes(chapterId);

    if (!this.readProgress[this.currentBook]) {
      this.readProgress[this.currentBook] = {
        chaptersRead: [],
        lastChapter: null,
        startedAt: new Date().toISOString()
      };
    }

    if (!this.readProgress[this.currentBook].chaptersRead.includes(chapterId)) {
      this.readProgress[this.currentBook].chaptersRead.push(chapterId);
    }

    // Actualizar timestamp
    this.readProgress[this.currentBook].lastReadAt = new Date().toISOString();

    this.saveUserData();

    // Sincronizar a la nube si está autenticado
    this.syncProgressToCloud();

    // Triggers para features didácticas (solo si el capítulo no estaba leído antes)
    if (!wasAlreadyRead) {
      // Mostrar pregunta reflexiva
      if (window.reflexiveModal && window.ReflexiveModal?.shouldShowForChapter(this.currentBook, chapterId)) {
        window.ReflexiveModal.markAsShown(this.currentBook, chapterId);
        setTimeout(() => {
          window.reflexiveModal.show(this.currentBook, chapterId);
        }, 500); // Pequeño delay para mejor UX
      }

      // Verificar logros
      // 🔧 FIX #58: Pasar tipo de acción para evaluación eficiente
      if (window.achievementSystem) {
        window.achievementSystem.checkAndUnlock('bookOpened', this.currentBook);
      }

      // Disparar evento para sistema de racha y otros listeners
      window.dispatchEvent(new CustomEvent('chapter-read', {
        detail: {
          bookId: this.currentBook,
          chapterId: chapterId,
          timestamp: new Date().toISOString()
        }
      }));

      // Verificar si el libro está ahora completo
      const progress = this.getProgress(this.currentBook);
      if (progress.percentage === 100) {
        const bookData = this.getCurrentBookData();

        // 🔧 v2.9.326: Generar certificado de lectura
        if (window.certificateGenerator) {
          setTimeout(() => {
            const cert = window.certificateGenerator.checkAndGenerateCertificate(this.currentBook);
            if (cert) {
              // Mostrar notificación de certificado ganado
              if (window.toast) {
                window.toast.success('🎓 ¡Felicidades! Has ganado un certificado de lectura', {
                  duration: 6000
                });
                // Mostrar modal después de un momento
                setTimeout(() => {
                  window.certificateGenerator.showCertificateModal(this.currentBook);
                }, 1000);
              }
            }
          }, 1000);
        }

        // Shareable moments (si está disponible)
        if (window.shareableMoments) {
          setTimeout(() => {
            window.shareableMoments.onBookCompleted({
              title: bookData?.title || 'Libro',
              chapters: progress.totalChapters,
              estimatedReadTime: `${Math.ceil(progress.totalChapters * 10)} minutos`
            });
          }, 1500);
        }
      }
    }
  }

  /**
   * Sincronizar progreso de lectura a la nube (sin bloquear UI)
   */
  async syncProgressToCloud() {
    if (!window.supabaseSyncHelper || !window.supabaseAuthHelper?.isAuthenticated()) {
      return; // No hacer nada si no está autenticado
    }

    try {
      await window.supabaseSyncHelper.migrateReadingProgress();
    } catch (error) {
      logger.error('Error sincronizando progreso:', error);
      // No mostrar error al usuario, es sync en background
    }
  }

  /**
   * Sincronizar notas a la nube (sin bloquear UI)
   */
  async syncNotesToCloud() {
    if (!window.supabaseSyncHelper || !window.supabaseAuthHelper?.isAuthenticated()) {
      return;
    }

    try {
      await window.supabaseSyncHelper.migrateNotes();
    } catch (error) {
      logger.error('Error sincronizando notas:', error);
    }
  }

  /**
   * Sincronizar bookmarks a la nube (sin bloquear UI)
   */
  async syncBookmarksToCloud() {
    if (!window.supabaseSyncHelper || !window.supabaseAuthHelper?.isAuthenticated()) {
      return;
    }

    try {
      await window.supabaseSyncHelper.migrateBookmarks();
    } catch (error) {
      logger.error('Error sincronizando bookmarks:', error);
    }
  }

  unmarkChapterAsRead(chapterId) {
    if (!this.currentBook) return;
    if (!this.readProgress[this.currentBook]) return;

    const index = this.readProgress[this.currentBook].chaptersRead.indexOf(chapterId);
    if (index > -1) {
      this.readProgress[this.currentBook].chaptersRead.splice(index, 1);
    }

    this.saveUserData();
  }

  toggleChapterRead(chapterId) {
    if (!this.currentBook) return false;

    const isRead = this.isChapterRead(chapterId);
    if (isRead) {
      this.unmarkChapterAsRead(chapterId);
    } else {
      this.markChapterAsRead(chapterId);
    }

    return !isRead; // Devuelve el nuevo estado
  }

  isChapterRead(chapterId) {
    if (!this.currentBook) return false;
    return this.readProgress[this.currentBook]?.chaptersRead?.includes(chapterId) || false;
  }

  getProgress(bookId) {
    const progress = this.readProgress[bookId];
    if (!progress) return { percentage: 0, chaptersRead: 0, totalChapters: 0 };

    const bookInfo = this.getBookInfo(bookId);
    const totalChapters = bookInfo ? bookInfo.chapters : 0;
    const chaptersRead = progress.chaptersRead.length;
    const percentage = totalChapters > 0 ? (chaptersRead / totalChapters) * 100 : 0;

    return {
      percentage: Math.round(percentage),
      chaptersRead,
      totalChapters,
      lastChapter: progress.lastChapter,
      lastReadAt: progress.lastReadAt
    };
  }

  getGlobalProgress() {
    const books = this.getAllBooks();
    let totalChapters = 0;
    let totalRead = 0;

    books.forEach(book => {
      const progress = this.getProgress(book.id);
      totalChapters += progress.totalChapters;
      totalRead += progress.chaptersRead;
    });

    return {
      totalChapters,
      totalRead,
      percentage: totalChapters > 0 ? Math.round((totalRead / totalChapters) * 100) : 0,
      booksStarted: Object.keys(this.readProgress).length,
      totalBooks: books.length
    };
  }

  /**
   * Obtener progreso del libro en formato objeto {chapterId: true/false}
   * Usado por el sistema de logros
   */
  getBookProgress(bookId) {
    const progress = this.readProgress[bookId];
    if (!progress || !progress.chaptersRead) return {};

    const result = {};
    progress.chaptersRead.forEach(chapterId => {
      result[chapterId] = true;
    });
    return result;
  }

  // ==========================================================================
  // NOTAS Y MARCADORES
  // ==========================================================================

  addNote(chapterId, note) {
    if (!this.currentBook) return;

    const key = `${this.currentBook}:${chapterId}`;
    if (!this.notes[key]) {
      this.notes[key] = [];
    }

    this.notes[key].push({
      id: Date.now(),
      text: note,
      createdAt: new Date().toISOString()
    });

    this.saveUserData();

    // Sincronizar notas a la nube
    this.syncNotesToCloud();
  }

  getNotes(chapterId) {
    if (!this.currentBook) return [];
    const key = `${this.currentBook}:${chapterId}`;
    return this.notes[key] || [];
  }

  addBookmark(chapterId) {
    if (!this.currentBook) return;

    const bookmark = {
      book: this.currentBook,
      chapter: chapterId,
      createdAt: new Date().toISOString()
    };

    // Evitar duplicados
    const exists = this.bookmarks.some(b =>
      b.book === bookmark.book && b.chapter === bookmark.chapter
    );

    if (!exists) {
      this.bookmarks.push(bookmark);
      this.saveUserData();

      // Sincronizar bookmarks a la nube
      this.syncBookmarksToCloud();
    }
  }

  removeBookmark(chapterId) {
    if (!this.currentBook) return;

    this.bookmarks = this.bookmarks.filter(b =>
      !(b.book === this.currentBook && b.chapter === chapterId)
    );

    this.saveUserData();

    // Sincronizar bookmarks a la nube
    this.syncBookmarksToCloud();
  }

  isBookmarked(chapterId) {
    if (!this.currentBook) return false;
    return this.bookmarks.some(b =>
      b.book === this.currentBook && b.chapter === chapterId
    );
  }

  // ==========================================================================
  // TEMAS
  // ==========================================================================

  async applyTheme(config) {
    if (!config || !config.theme) return;

    const root = document.documentElement;
    const theme = config.theme;

    // Aplicar variables CSS
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-secondary', theme.secondary);
    root.style.setProperty('--color-accent', theme.accent);
    root.style.setProperty('--color-background', theme.background);
    root.style.setProperty('--color-background-secondary', theme.backgroundSecondary);
    root.style.setProperty('--color-text', theme.text);
    root.style.setProperty('--color-text-secondary', theme.textSecondary);
    root.style.setProperty('--color-border', theme.border);

    // 🔧 v2.9.389: Aplicar clase de tema al body SIN eliminar theme-dark/light
    // Remover solo clases de temas de libros anteriores, preservando theme-dark, theme-light, dark, etc.
    const classesToKeep = Array.from(document.body.classList).filter(cls =>
      cls === 'theme-dark' || cls === 'theme-light' || cls === 'dark' ||
      cls === 'min-h-screen' || !cls.startsWith('theme-')
    );
    document.body.className = classesToKeep.join(' ');
    document.body.classList.add(`theme-${this.currentBook}`);

    // Cargar CSS del tema dinámicamente usando lazy-loader
    const bookInfo = this.getBookInfo(this.currentBook);
    if (bookInfo && bookInfo.theme && window.lazyLoader) {
      try {
        await window.lazyLoader.loadThemeCSS(bookInfo.theme);
      } catch (error) {
        logger.error(`Error cargando tema CSS: ${bookInfo.theme}`, error);
      }
    }

    logger.log(`✅ Theme applied: ${theme.name}`);
  }

  // ==========================================================================
  // DESCARGAS
  // ==========================================================================

  getLatestAPK() {
    if (!this.catalog || !this.catalog.downloads || !this.catalog.downloads.android) {
      return 'downloads/CodigoDelDespertar-v1.1.5.apk'; // Fallback
    }
    return `downloads/${this.catalog.downloads.android.latest}`;
  }

  getAPKInfo() {
    if (!this.catalog || !this.catalog.downloads || !this.catalog.downloads.android) {
      return null;
    }
    const latest = this.catalog.downloads.android.versions[0];
    return {
      file: this.getLatestAPK(),
      version: latest.version,
      size: latest.size,
      date: latest.date,
      changelog: latest.changelog
    };
  }
}

// Exportar para uso global
window.BookEngine = BookEngine;

// Exportar función de sanitización como helper global
window.sanitizeHTML = function(html) {
  // Reutilizar la lógica de BookEngine
  const temp = new BookEngine();
  return temp.sanitizeHTML(html);
};
