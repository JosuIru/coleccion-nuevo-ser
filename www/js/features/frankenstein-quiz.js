/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * Frankenstein Quiz System
 * Sistema educativo de evaluación para desbloqueo de piezas de conocimiento
 *
 * Modos:
 * - Investigación: Acceso libre sin quizzes
 * - Juego: Quiz obligatorio con sistema de poder variable
 *
 * Mecánica:
 * - 2/2 correctas: Pieza con poder bonus (+20%)
 * - 1/2 correctas: Pieza con poder normal (100%)
 * - 0/2 correctas: Pieza débil con poder reducido (-30%)
 *
 * @version 1.0.0
 */

class FrankensteinQuizSystem {
  constructor() {
    this.mode = 'investigacion'; // 'investigacion' | 'juego' | 'demo'
    this.difficulty = 'iniciado'; // 'principiante' | 'iniciado' | 'experto'
    this.quickMode = false; // Modo rápido: 1 pregunta en lugar de 2-3
    this.skipMastered = true; // Saltar quizzes de piezas ya dominadas
    this.quizCache = {}; // Cache de quizzes cargados
    this.piecesPower = {}; // Registro de poder de cada pieza
    this.masteredPieces = {}; // Piezas que ya dominaste (pasaste quiz)
    this.quizAttempts = {}; // Intentos por pieza
    this.weakPieces = []; // Array de piezas débiles que pueden fortalecerse

    // Configuración de niveles de dificultad
    // Cada nivel filtra preguntas según complejidad conceptual
    this.difficultySettings = {
      ninos: {
        level: 'ninos',
        questionsCount: 2,
        passingScore: 1,  // 1/2 para pasar
        powerMultipliers: {
          perfect: 1.15,  // 2/2 correctas
          good: 1.00,     // 1/2 correctas
          weak: 0.90      // 0/2 correctas (penalización mínima para no frustrar)
        },
        description: 'Preguntas fáciles con lenguaje sencillo para niños'
      },
      principiante: {
        level: 'principiante',
        questionsCount: 3,
        passingScore: 2,  // 2/3 para pasar
        powerMultipliers: {
          perfect: 1.20,  // 3/3 correctas
          good: 1.00,     // 2/3 correctas
          weak: 0.80      // 0-1/3 correctas
        },
        description: 'Preguntas sencillas sobre conceptos básicos'
      },
      iniciado: {
        level: 'iniciado',
        questionsCount: 3,
        passingScore: 2,  // 2/3 para pasar
        powerMultipliers: {
          perfect: 1.30,  // 3/3 correctas
          good: 1.10,     // 2/3 correctas
          weak: 0.70      // 0-1/3 correctas
        },
        description: 'Preguntas de complejidad media que requieren comprensión'
      },
      experto: {
        level: 'experto',
        questionsCount: 3,
        passingScore: 2,  // 2/3 para pasar
        powerMultipliers: {
          perfect: 1.50,  // 3/3 correctas
          good: 1.30,     // 2/3 correctas
          weak: 0.60      // 0-1/3 correctas
        },
        description: 'Preguntas profundas que requieren pensamiento crítico'
      }
    };

    this.chapterMetadata = null;
    this.chapterMetadataPromise = null;

    this.powerMultipliers = this.difficultySettings.iniciado.powerMultipliers;

    this.init();
  }

  /**
   * Inicializar sistema
   */
  init() {
    // Cargar modo guardado
    const savedMode = localStorage.getItem('frankenstein_mode');
    if (savedMode) {
      this.mode = savedMode;
    }

    // Cargar dificultad guardada
    const savedDifficulty = localStorage.getItem('frankenstein_difficulty');
    if (savedDifficulty && this.difficultySettings[savedDifficulty]) {
      this.difficulty = savedDifficulty;
      this.powerMultipliers = this.difficultySettings[savedDifficulty].powerMultipliers;
    }

    // Cargar registro de poder de piezas
    const savedPower = localStorage.getItem('frankenstein_pieces_power');
    if (savedPower) {
      try {
        this.piecesPower = JSON.parse(savedPower);
      } catch (e) {
        console.error('Error loading pieces power:', e);
      }
    }

    // Cargar piezas débiles
    const savedWeak = localStorage.getItem('frankenstein_weak_pieces');
    if (savedWeak) {
      try {
        this.weakPieces = JSON.parse(savedWeak);
      } catch (e) {
        console.error('Error loading weak pieces:', e);
      }
    }

    // Cargar piezas dominadas (mastered)
    const savedMastered = localStorage.getItem('frankenstein_mastered_pieces');
    if (savedMastered) {
      try {
        this.masteredPieces = JSON.parse(savedMastered);
      } catch (e) {
        console.error('Error loading mastered pieces:', e);
      }
    }

    // Cargar intentos de quiz
    const savedAttempts = localStorage.getItem('frankenstein_quiz_attempts');
    if (savedAttempts) {
      try {
        this.quizAttempts = JSON.parse(savedAttempts);
      } catch (e) {
        console.error('Error loading quiz attempts:', e);
      }
    }

    // Cargar modo rápido
    const savedQuickMode = localStorage.getItem('frankenstein_quick_mode');
    if (savedQuickMode !== null) {
      this.quickMode = savedQuickMode === 'true';
    }

    // Cargar opción de saltar dominadas
    const savedSkipMastered = localStorage.getItem('frankenstein_skip_mastered');
    if (savedSkipMastered !== null) {
      this.skipMastered = savedSkipMastered !== 'false';
    }

    logger.debug(`[FrankensteinQuiz] Initialized in ${this.mode} mode with ${this.difficulty} difficulty (quickMode: ${this.quickMode}, skipMastered: ${this.skipMastered})`);
  }

  /**
   * Activar/desactivar modo rápido
   */
  setQuickMode(enabled) {
    this.quickMode = enabled;
    localStorage.setItem('frankenstein_quick_mode', String(enabled));
    logger.debug(`[FrankensteinQuiz] Quick mode: ${enabled}`);
  }

  /**
   * Activar/desactivar saltar piezas dominadas
   */
  setSkipMastered(enabled) {
    this.skipMastered = enabled;
    localStorage.setItem('frankenstein_skip_mastered', String(enabled));
    logger.debug(`[FrankensteinQuiz] Skip mastered: ${enabled}`);
  }

  /**
   * Marcar pieza como dominada
   */
  markAsMastered(pieceKey, score) {
    this.masteredPieces[pieceKey] = {
      masteredAt: new Date().toISOString(),
      score: score
    };
    localStorage.setItem('frankenstein_mastered_pieces', JSON.stringify(this.masteredPieces));
  }

  /**
   * Verificar si una pieza está dominada
   */
  isPieceMastered(pieceKey) {
    return Boolean(this.masteredPieces[pieceKey]);
  }

  /**
   * Registrar intento de quiz
   */
  recordAttempt(pieceKey) {
    if (!this.quizAttempts[pieceKey]) {
      this.quizAttempts[pieceKey] = 0;
    }
    this.quizAttempts[pieceKey]++;
    localStorage.setItem('frankenstein_quiz_attempts', JSON.stringify(this.quizAttempts));
    return this.quizAttempts[pieceKey];
  }

  /**
   * Obtener número de intentos
   */
  getAttempts(pieceKey) {
    return this.quizAttempts[pieceKey] || 0;
  }

  /**
   * Cambiar modo de juego
   */
  setMode(mode) {
    if (mode !== 'investigacion' && mode !== 'juego' && mode !== 'demo') {
      console.error('Invalid mode:', mode);
      return;
    }

    this.mode = mode;
    localStorage.setItem('frankenstein_mode', mode);
    logger.debug(`[FrankensteinQuiz] Mode changed to: ${mode}`);

    // Emitir evento para que la UI se actualice
    document.dispatchEvent(new CustomEvent('frankenstein:modeChanged', {
      detail: { mode }
    }));
  }

  /**
   * Cambiar nivel de dificultad
   */
  setDifficulty(difficulty) {
    if (!this.difficultySettings[difficulty]) {
      console.error('Invalid difficulty:', difficulty);
      return;
    }

    this.difficulty = difficulty;
    this.powerMultipliers = this.difficultySettings[difficulty].powerMultipliers;
    localStorage.setItem('frankenstein_difficulty', difficulty);
    logger.debug(`[FrankensteinQuiz] Difficulty changed to: ${difficulty}`);

    // Emitir evento para que la UI se actualice
    document.dispatchEvent(new CustomEvent('frankenstein:difficultyChanged', {
      detail: { difficulty }
    }));
  }

  /**
   * Obtener dificultad actual
   */
  getDifficulty() {
    return this.difficulty;
  }

  /**
   * Obtener configuración de dificultad actual
   */
  getCurrentDifficultySettings() {
    return this.difficultySettings[this.difficulty];
  }

  /**
   * Obtener modo actual
   */
  getMode() {
    return this.mode;
  }

  isKidMode() {
    return this.difficulty === 'ninos';
  }

  simplifyForKids(text = '') {
    if (!text) return '';
    const replacements = [
      ['consciencia', 'mente'],
      ['filosóficamente', 'de forma muy profunda'],
      ['inteligencia artificial', 'robots inteligentes'],
      ['información', 'datos'],
      ['evolución', 'cambio'],
      ['metafísica', 'ideas profundas'],
      ['emergencia', 'aparecimiento'],
      ['constante', 'valor fijo']
    ];
    let simplified = text;
    replacements.forEach(([from, to]) => {
      simplified = simplified.replace(new RegExp(from, 'gi'), to);
    });
    if (simplified.length > 180) {
      simplified = simplified.substring(0, 177) + '...';
    }
    return simplified;
  }

  async ensureChapterMetadata() {
    if (this.chapterMetadata) return this.chapterMetadata;
    if (this.chapterMetadataPromise) return this.chapterMetadataPromise;
    this.chapterMetadataPromise = fetch('books/metadata/chapters-metadata.json')
      .then(response => (response.ok ? response.json() : null))
      .catch(error => {
        console.warn('[FrankensteinQuiz] No se pudo cargar el metadata de capítulos:', error);
        return null;
      })
      .finally(() => {
        this.chapterMetadataPromise = null;
      });
    this.chapterMetadata = await this.chapterMetadataPromise;
    return this.chapterMetadata;
  }

  getChapterMetadata(bookId, chapterId) {
    if (!this.chapterMetadata?.chapters) return null;
    return this.chapterMetadata.chapters[bookId]?.[chapterId] || null;
  }

  getQuestionPrompt(question) {
    const base = question.question || '';
    if (this.isKidMode()) {
      return `Pregunta amigable: ${this.simplifyForKids(base)}`;
    }
    return base;
  }

  buildQuestionHint(question, chapterMeta) {
    const candidates = [];
    if (question.hint) candidates.push(question.hint);
    if (question.explanation) candidates.push(question.explanation);
    if (chapterMeta?.description) candidates.push(chapterMeta.description);
    if (chapterMeta?.keywords && chapterMeta.keywords.length) {
      candidates.push(`Palabras clave: ${chapterMeta.keywords.slice(0, 4).join(', ')}`);
    }
    if (question.bookQuote) {
      candidates.push(`Cita: "${question.bookQuote}"`);
    }
    const hint = candidates.filter(Boolean).join(' ');
    if (!hint) return '';
    if (this.isKidMode()) {
      return this.simplifyForKids(hint);
    }
    return hint;
  }

  openChapterInLibrary(bookId, chapterId) {
    if (window.biblioteca?.openBook) {
      window.biblioteca.openBook(bookId, chapterId);
      return;
    }
    const url = `books/${bookId}/book.html`;
    window.open(`${url}#${chapterId}`, '_blank');
  }

  formatChapterSnippet(chapterMeta) {
    if (!chapterMeta) return '';
    const parts = [];
    if (chapterMeta.type) parts.push(`Tipo: ${chapterMeta.type}`);
    if (chapterMeta.difficulty) parts.push(`Nivel: ${chapterMeta.difficulty}`);
    if (chapterMeta.readingTime) parts.push(`Lectura: ${chapterMeta.readingTime} min`);
    if (chapterMeta.practicalUses && chapterMeta.practicalUses.length) {
      parts.push(`Aplicación: ${chapterMeta.practicalUses[0]}`);
    }
    return parts.join(' · ');
  }

  escapeHtml(text = '') {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Cargar quiz de un capítulo
   */
  async loadQuiz(bookId, chapterId) {
    // Si ya está en cache, devolver
    const cacheKey = `${bookId}:${chapterId}`;
    if (this.quizCache[cacheKey]) {
      return this.quizCache[cacheKey];
    }

    try {
      const quizFiles = [];
      if (this.isKidMode()) {
        quizFiles.push(`./books/${bookId}/quizzes-kids.json`);
        quizFiles.push(`./books/${bookId}/assets/quizzes-kids.json`);
      }
      quizFiles.push(`./books/${bookId}/quizzes.json`);
      quizFiles.push(`./books/${bookId}/assets/quizzes.json`);

      let quizData = null;
      for (const path of quizFiles) {
        let response = await fetch(path);
        if (!response.ok) continue;
        quizData = await response.json();
        break;
      }

      if (!quizData) {
        throw new Error(`Failed to load quiz for ${bookId} - tried ${quizFiles.join(', ')}`);
      }

      // Cachear todo el libro - manejar ambas estructuras
      if (quizData.chapters) {
        // Estructura antigua: { chapters: { "cap1": { questions: [...] } } }
        Object.keys(quizData.chapters).forEach(chapId => {
          const chapKey = `${bookId}:${chapId}`;
          this.quizCache[chapKey] = quizData.chapters[chapId];
        });
        return quizData.chapters[chapterId] || null;
      } else if (quizData.quizzes && Array.isArray(quizData.quizzes)) {
        // Estructura nueva: { quizzes: [ { chapterId: "cap1", questions: [...] } ] }
        quizData.quizzes.forEach(quiz => {
          const chapKey = `${bookId}:${quiz.chapterId}`;
          this.quizCache[chapKey] = quiz;
        });
        const quiz = quizData.quizzes.find(q => q.chapterId === chapterId);
        return quiz || null;
      }

      return null;
    } catch (error) {
      console.error(`[FrankensteinQuiz] Error loading quiz for ${bookId}/${chapterId}:`, error);
      return null;
    }
  }

  /**
   * Seleccionar preguntas aleatorias del pool según dificultad
   * Filtra preguntas por nivel (principiante/iniciado/experto)
   */
  selectRandomQuestions(questions) {
    if (!questions || questions.length === 0) {
      return [];
    }

    const settings = this.getCurrentDifficultySettings();
    const count = settings.questionsCount;
    const currentLevel = settings.level;

    // Filtrar preguntas por nivel de dificultad
    let filteredQuestions = questions.filter(q =>
      q.difficulty === currentLevel || q.level === currentLevel
    );

    // Si no hay suficientes preguntas del nivel actual, usar todas
    if (filteredQuestions.length < count) {
      console.warn(`[FrankensteinQuiz] Solo ${filteredQuestions.length} preguntas de nivel ${currentLevel}, usando todas las preguntas disponibles`);
      filteredQuestions = questions;
    }

    // Si hay menos preguntas que las necesarias, devolver todas
    if (filteredQuestions.length <= count) {
      return filteredQuestions;
    }

    // Seleccionar N preguntas al azar del pool filtrado
    const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Mostrar modal de quiz
   */
  async showQuizModal(piece, bookId, chapterId) {
    const pieceKey = `${bookId}/${chapterId}`;

    // En modo investigación, saltar quiz
    if (this.mode === 'investigacion') {
      return {
        passed: true,
        powerMultiplier: 1.0,
        skipped: true
      };
    }

    // En modo demo, otorgar bonus de poder sin quiz
    if (this.mode === 'demo') {
      return {
        passed: true,
        powerMultiplier: 1.20, // Bonus moderado para demo
        skipped: true,
        demoMode: true
      };
    }

    // Si la pieza ya está dominada y skipMastered está activo, saltar quiz
    if (this.skipMastered && this.isPieceMastered(pieceKey)) {
      const mastered = this.masteredPieces[pieceKey];
      logger.debug(`[FrankensteinQuiz] Pieza ${pieceKey} ya dominada, saltando quiz`);
      return {
        passed: true,
        powerMultiplier: 1.15, // Bonus moderado por pieza dominada
        skipped: true,
        mastered: true,
        previousScore: mastered.score
      };
    }

    // Si el usuario ha fallado 3+ veces, ofrecer auto-pass con penalización
    const attempts = this.getAttempts(pieceKey);
    if (attempts >= 3) {
      logger.debug(`[FrankensteinQuiz] ${attempts} intentos en ${pieceKey}, ofreciendo auto-pass`);
      const autoPass = await this.showAutoPassOption(pieceKey, attempts);
      if (autoPass) {
        return {
          passed: true,
          powerMultiplier: 0.85, // Penalización por auto-pass
          skipped: true,
          autoPass: true,
          attempts: attempts
        };
      }
    }

    // Cargar quiz del capítulo
    const quizData = await this.loadQuiz(bookId, chapterId);
    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
      console.warn(`[FrankensteinQuiz] No quiz found for ${bookId}/${chapterId}, skipping`);
      return {
        passed: true,
        powerMultiplier: 1.0,
        skipped: true
      };
    }

    // Registrar intento
    this.recordAttempt(pieceKey);

    // Seleccionar preguntas (menos si quickMode está activo)
    const questionCount = this.quickMode ? 1 : this.difficultySettings[this.difficulty]?.questionsCount || 2;
    const selectedQuestions = this.selectRandomQuestions(quizData.questions, questionCount);
    await this.ensureChapterMetadata();

    // Mostrar modal y esperar respuesta del usuario
    return new Promise((resolve) => {
      const chapterMeta = this.getChapterMetadata(bookId, chapterId);

      // Wrapper para marcar como dominada si pasa
      const wrappedResolve = (result) => {
        if (result.passed && !result.cancelled) {
          this.markAsMastered(pieceKey, result.correctCount);
        }
        resolve(result);
      };

      this.createQuizModal(piece, quizData.chapterTitle, selectedQuestions, wrappedResolve, bookId, chapterId, chapterMeta);
    });
  }

  /**
   * Mostrar opción de auto-pass después de múltiples intentos fallidos
   */
  showAutoPassOption(pieceKey, attempts) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'quiz-modal-overlay active';
      modal.innerHTML = `
        <div class="quiz-auto-pass-modal">
          <div class="quiz-auto-pass-icon">😓</div>
          <h3>¿Te está costando?</h3>
          <p>Has intentado este quiz ${attempts} veces.</p>
          <p class="quiz-auto-pass-note">Puedes saltar el quiz, pero la pieza tendrá menos poder (-15%).</p>
          <div class="quiz-auto-pass-actions">
            <button class="quiz-btn quiz-btn-retry" id="btn-retry">
              🔄 Intentar de nuevo
            </button>
            <button class="quiz-btn quiz-btn-skip" id="btn-auto-pass">
              ⏭️ Saltar quiz
            </button>
          </div>
        </div>
      `;

      // Estilos inline para el modal
      const content = modal.querySelector('.quiz-auto-pass-modal');
      content.style.cssText = `
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border-radius: 20px;
        padding: 32px;
        text-align: center;
        color: white;
        max-width: 340px;
        margin: auto;
        position: relative;
        top: 50%;
        transform: translateY(-50%);
        border: 1px solid rgba(255, 255, 255, 0.1);
      `;

      modal.querySelector('.quiz-auto-pass-icon').style.cssText = 'font-size: 48px; margin-bottom: 16px;';
      modal.querySelector('h3').style.cssText = 'margin: 0 0 8px; font-size: 20px;';
      modal.querySelector('p').style.cssText = 'color: #94a3b8; margin: 8px 0;';
      modal.querySelector('.quiz-auto-pass-note').style.cssText = 'color: #f59e0b; font-size: 14px;';
      modal.querySelector('.quiz-auto-pass-actions').style.cssText = 'display: flex; gap: 12px; justify-content: center; margin-top: 20px;';

      document.body.appendChild(modal);

      modal.querySelector('#btn-retry').onclick = () => {
        modal.remove();
        resolve(false); // Continuar con el quiz
      };

      modal.querySelector('#btn-auto-pass').onclick = () => {
        modal.remove();
        resolve(true); // Auto-pass
      };
    });
  }

  /**
   * Crear modal de quiz
   */
  createQuizModal(piece, chapterTitle, questions, resolveCallback, bookId, chapterId, chapterMeta) {
    // Crear overlay
    const chapterSnippet = this.formatChapterSnippet(chapterMeta);
    const difficultyLabel = this.escapeHtml(this.difficultySettings[this.difficulty]?.description || '');
    const overlay = document.createElement('div');
    overlay.className = 'quiz-modal-overlay active';
    overlay.innerHTML = `
      <div class="quiz-modal-content">
        <div class="quiz-modal-header">
          <h2 class="quiz-modal-title">
            <span class="quiz-icon">🧠</span>
            Prueba de Conocimiento
          </h2>
          <div class="quiz-subtitle">${chapterTitle}</div>
          <button class="quiz-modal-close" id="quiz-modal-close">
            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <div class="quiz-meta">
            <div class="quiz-meta-info">
              <span class="quiz-chapter-label">Capítulo:</span>
              <strong>${chapterTitle}</strong>
              ${chapterSnippet ? `<p class="quiz-chapter-snippet">${this.escapeHtml(chapterSnippet)}</p>` : ''}
            </div>
            <div class="quiz-meta-actions">
              <span class="quiz-level-badge">${difficultyLabel}</span>
              <button class="quiz-link-btn" type="button" data-book="${bookId}" data-chapter="${chapterId}">
                🧭 Ver capítulo
              </button>
            </div>
          </div>
        </div>

        <div class="quiz-modal-body" id="quiz-questions-container">
          <!-- Preguntas se generan dinámicamente -->
        </div>

        <div class="quiz-modal-footer">
          <button class="quiz-btn quiz-btn-cancel" id="quiz-cancel-btn">
            Cancelar
          </button>
          <button class="quiz-btn quiz-btn-submit" id="quiz-submit-btn" disabled>
            Evaluar Respuestas
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Botón de cerrar
    overlay.querySelector('#quiz-modal-close').addEventListener('click', () => {
      overlay.remove();
      resolveCallback({
        cancelled: true,
        passed: false,
        powerMultiplier: 1.0,
        correctCount: 0,
        totalQuestions: questions.length,
        skipped: false
      });
    });

    // Botón de cancelar
    overlay.querySelector('#quiz-cancel-btn').addEventListener('click', () => {
      overlay.remove();
      resolveCallback({
        cancelled: true,
        passed: false,
        powerMultiplier: 1.0,
        correctCount: 0,
        totalQuestions: questions.length,
        skipped: false
      });
    });

    // Generar preguntas
    const container = overlay.querySelector('#quiz-questions-container');
    const userAnswers = new Array(questions.length).fill(null);

    questions.forEach((q, qIndex) => {
      const hintText = this.buildQuestionHint(q, chapterMeta);
      const questionEl = document.createElement('div');
      questionEl.className = 'quiz-question';
      questionEl.innerHTML = `
        <div class="quiz-question-header">
          <span class="quiz-question-number">Pregunta ${qIndex + 1}/${questions.length}</span>
        </div>
        <div class="quiz-question-text">${this.escapeHtml(this.getQuestionPrompt(q))}</div>
        <div class="quiz-options" data-question="${qIndex}">
          ${q.options.map((option, optIndex) => `
            <div class="quiz-option" data-option="${optIndex}">
              <input
                type="radio"
                name="question_${qIndex}"
                id="q${qIndex}_opt${optIndex}"
                value="${optIndex}"
              >
              <label for="q${qIndex}_opt${optIndex}">${this.escapeHtml(option)}</label>
            </div>
          `).join('')}
        </div>
        <div class="quiz-feedback" id="feedback_${qIndex}" style="display: none;"></div>
        ${hintText ? `
          <div class="quiz-question-context">
            <button class="quiz-hint-btn" type="button">
              ${this.isKidMode() ? 'Ver pista sencilla' : 'Ver pista'}
            </button>
            <p class="quiz-hint-text">${this.escapeHtml(hintText)}</p>
          </div>
        ` : ''}
      `;

      container.appendChild(questionEl);

      // Event listeners para las opciones
      questionEl.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
          userAnswers[qIndex] = parseInt(e.target.value);

          // Habilitar botón de submit si todas respondidas
          const allAnswered = userAnswers.every(a => a !== null);
          overlay.querySelector('#quiz-submit-btn').disabled = !allAnswered;
        });
      });
    });

    // Botón de submit
    overlay.querySelector('#quiz-submit-btn').addEventListener('click', () => {
      this.evaluateQuiz(overlay, questions, userAnswers, piece, resolveCallback);
    });

    overlay.querySelector('.quiz-link-btn')?.addEventListener('click', (event) => {
      const btn = event.currentTarget;
      const targetBook = btn.dataset.book;
      const targetChapter = btn.dataset.chapter;
      this.openChapterInLibrary(targetBook, targetChapter);
    });

    overlay.querySelectorAll('.quiz-hint-btn').forEach(btn => {
      const hintEl = btn.parentElement?.querySelector('.quiz-hint-text');
      if (!hintEl) return;
      btn.addEventListener('click', () => {
        const isVisible = hintEl.classList.toggle('visible');
        btn.textContent = isVisible
          ? (this.isKidMode() ? 'Ocultar pista' : 'Ocultar pista')
          : (this.isKidMode() ? 'Ver pista sencilla' : 'Ver pista');
      });
    });
  }

  /**
   * Evaluar quiz y mostrar resultados
   */
  evaluateQuiz(overlay, questions, userAnswers, piece, resolveCallback) {
    let correctCount = 0;

    // Evaluar cada pregunta
    questions.forEach((q, qIndex) => {
      const isCorrect = userAnswers[qIndex] === q.correct;
      if (isCorrect) correctCount++;

      const feedbackEl = overlay.querySelector(`#feedback_${qIndex}`);
      const optionsContainer = overlay.querySelector(`[data-question="${qIndex}"]`);

      // Guard clause si no hay container
      if (!optionsContainer) {
        console.warn(`[FrankensteinQuiz] No options container for question ${qIndex}`);
        return;
      }

      // Marcar opción seleccionada (con null safety)
      const selectedOption = userAnswers[qIndex] !== undefined
        ? optionsContainer.querySelector(`[data-option="${userAnswers[qIndex]}"]`)
        : null;
      const correctOption = optionsContainer.querySelector(`[data-option="${q.correct}"]`);

      if (isCorrect && selectedOption) {
        selectedOption.classList.add('correct');
        if (feedbackEl) {
          feedbackEl.innerHTML = `
            <div class="feedback-correct">
              <strong>✓ Correcto</strong>
              <p>${q.explanation || ''}</p>
            </div>
          `;
        }
      } else {
        if (selectedOption) selectedOption.classList.add('incorrect');
        if (correctOption) correctOption.classList.add('correct');
        if (feedbackEl) {
          feedbackEl.innerHTML = `
            <div class="feedback-incorrect">
              <strong>✗ Incorrecto</strong>
              <p>${q.explanation || ''}</p>
              ${q.bookQuote ? `<blockquote class="quiz-quote">"${q.bookQuote}"</blockquote>` : ''}
            </div>
          `;
        }
      }

      if (feedbackEl) feedbackEl.style.display = 'block';

      // Deshabilitar opciones
      optionsContainer.querySelectorAll('input').forEach(input => {
        input.disabled = true;
      });
    });

    // Determinar resultado basado en configuración de dificultad
    const settings = this.getCurrentDifficultySettings();
    const totalQuestions = questions.length;
    const passingScore = Math.min(settings.passingScore, totalQuestions);

    let powerMultiplier;
    let resultMessage;
    let resultClass;

    // Perfecto: todas correctas
    if (correctCount === totalQuestions) {
      powerMultiplier = this.powerMultipliers.perfect;
      resultMessage = '¡Dominio Completo! Has comprendido el conocimiento a la perfección.';
      resultClass = 'result-perfect';
    // Bueno: alcanza el mínimo para pasar
    } else if (correctCount >= passingScore) {
      powerMultiplier = this.powerMultipliers.good;
      resultMessage = 'Conocimiento Adquirido. Considera releer el capítulo para profundizar.';
      resultClass = 'result-good';
    // Débil: por debajo del mínimo
    } else {
      powerMultiplier = this.powerMultipliers.weak;
      resultMessage = 'Pieza adquirida pero débil. Te recomendamos releer el capítulo para fortalecerla.';
      resultClass = 'result-weak';

      // Registrar como pieza débil
      this.weakPieces.push({
        pieceId: piece.id,
        bookId: piece.bookId,
        chapterId: piece.chapterId,
        timestamp: Date.now()
      });
      this.saveWeakPieces();
    }

    // Guardar poder de la pieza
    this.piecesPower[piece.id] = powerMultiplier;
    this.savePiecesPower();

    // Mostrar resultado final
    const submitBtn = overlay.querySelector('#quiz-submit-btn');
    submitBtn.style.display = 'none';

    const footer = overlay.querySelector('.quiz-modal-footer');
    footer.innerHTML = `
      <div class="quiz-result ${resultClass}">
        <div class="quiz-result-icon">
          ${correctCount === totalQuestions ? '🌟' : correctCount >= passingScore ? '⚡' : '⚠️'}
        </div>
        <div class="quiz-result-score">
          ${correctCount}/${totalQuestions} Correctas
        </div>
        <div class="quiz-result-message">
          ${resultMessage}
        </div>
        <div class="quiz-result-power">
          Poder de la pieza: <strong>${Math.round(powerMultiplier * 100)}%</strong>
        </div>
        <button class="quiz-btn quiz-btn-continue" id="quiz-continue-btn">
          Continuar
        </button>
      </div>
    `;

    // Botón continuar
    footer.querySelector('#quiz-continue-btn').addEventListener('click', () => {
      overlay.remove();
      resolveCallback({
        passed: true,
        powerMultiplier,
        correctCount,
        totalQuestions: questions.length
      });
    });
  }

  /**
   * Obtener poder de una pieza
   */
  getPiecePower(pieceId) {
    return this.piecesPower[pieceId] || 1.0;
  }

  /**
   * Obtener piezas débiles
   */
  getWeakPieces() {
    return this.weakPieces;
  }

  /**
   * Intentar fortalecer una pieza débil
   */
  async retryWeakPiece(weakPiece) {
    // Mostrar quiz de nuevo
    const result = await this.showQuizModal(
      { id: weakPiece.pieceId },
      weakPiece.bookId,
      weakPiece.chapterId
    );

    const settings = this.getCurrentDifficultySettings();
    const totalQuestions = result.totalQuestions || settings.questionsCount;
    const passingScore = Math.min(settings.passingScore, totalQuestions);

    // Si mejoró, actualizar y remover de débiles
    if (result.correctCount === totalQuestions) {
      this.piecesPower[weakPiece.pieceId] = this.powerMultipliers.perfect;
      this.weakPieces = this.weakPieces.filter(p => p.pieceId !== weakPiece.pieceId);
      this.savePiecesPower();
      this.saveWeakPieces();

      return {
        success: true,
        message: '¡Pieza fortalecida con éxito!',
        newPower: this.powerMultipliers.perfect
      };
    } else if (result.correctCount >= passingScore) {
      this.piecesPower[weakPiece.pieceId] = this.powerMultipliers.good;
      this.weakPieces = this.weakPieces.filter(p => p.pieceId !== weakPiece.pieceId);
      this.savePiecesPower();
      this.saveWeakPieces();

      return {
        success: true,
        message: 'Pieza mejorada a poder normal',
        newPower: this.powerMultipliers.good
      };
    } else {
      return {
        success: false,
        message: 'La pieza sigue débil. Intenta estudiar más el capítulo.',
        newPower: this.powerMultipliers.weak
      };
    }
  }

  /**
   * Guardar registro de poder en localStorage
   */
  savePiecesPower() {
    localStorage.setItem('frankenstein_pieces_power', JSON.stringify(this.piecesPower));
  }

  /**
   * Guardar piezas débiles en localStorage
   */
  saveWeakPieces() {
    localStorage.setItem('frankenstein_weak_pieces', JSON.stringify(this.weakPieces));
  }

  /**
   * Resetear todos los datos (para testing)
   */
  reset() {
    this.piecesPower = {};
    this.weakPieces = [];
    this.savePiecesPower();
    this.saveWeakPieces();
    logger.debug('[FrankensteinQuiz] System reset');
  }
}

// Exportar instancia global
window.FrankensteinQuiz = new FrankensteinQuizSystem();
