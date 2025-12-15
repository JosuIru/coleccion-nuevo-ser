/**
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
    this.quizCache = {}; // Cache de quizzes cargados
    this.piecesPower = {}; // Registro de poder de cada pieza
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

    console.log(`[FrankensteinQuiz] Initialized in ${this.mode} mode with ${this.difficulty} difficulty`);
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
    console.log(`[FrankensteinQuiz] Mode changed to: ${mode}`);

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
    console.log(`[FrankensteinQuiz] Difficulty changed to: ${difficulty}`);

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
      // Intentar cargar desde la raíz del libro primero (usar ruta relativa para compatibilidad)
      let response = await fetch(`./books/${bookId}/quizzes.json`);

      // Si no existe, intentar desde assets/
      if (!response.ok) {
        response = await fetch(`./books/${bookId}/assets/quizzes.json`);
      }

      if (!response.ok) {
        throw new Error(`Failed to load quiz for ${bookId} - tried both /quizzes.json and /assets/quizzes.json`);
      }

      const quizData = await response.json();

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

    // Seleccionar 2 preguntas aleatorias
    const selectedQuestions = this.selectRandomQuestions(quizData.questions);

    // Mostrar modal y esperar respuesta del usuario
    return new Promise((resolve) => {
      this.createQuizModal(piece, quizData.chapterTitle, selectedQuestions, resolve);
    });
  }

  /**
   * Crear modal de quiz
   */
  createQuizModal(piece, chapterTitle, questions, resolveCallback) {
    // Crear overlay
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
      const questionEl = document.createElement('div');
      questionEl.className = 'quiz-question';
      questionEl.innerHTML = `
        <div class="quiz-question-header">
          <span class="quiz-question-number">Pregunta ${qIndex + 1}/${questions.length}</span>
        </div>
        <div class="quiz-question-text">${q.question}</div>
        <div class="quiz-options" data-question="${qIndex}">
          ${q.options.map((option, optIndex) => `
            <div class="quiz-option" data-option="${optIndex}">
              <input
                type="radio"
                name="question_${qIndex}"
                id="q${qIndex}_opt${optIndex}"
                value="${optIndex}"
              >
              <label for="q${qIndex}_opt${optIndex}">${option}</label>
            </div>
          `).join('')}
        </div>
        <div class="quiz-feedback" id="feedback_${qIndex}" style="display: none;"></div>
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
    console.log('[FrankensteinQuiz] System reset');
  }
}

// Exportar instancia global
window.FrankensteinQuiz = new FrankensteinQuizSystem();
