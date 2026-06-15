// ============================================================================
// INTERACTIVE QUIZ - Sistema de quizzes interactivos por capítulo
// ============================================================================

class InteractiveQuiz {
  constructor() {
    this.currentQuiz = null;
    this.currentQuestionIndex = 0;
    this.answers = [];
    this.score = 0;
    this.isOpen = false;
  }

  // ==========================================================================
  // CARGAR QUIZ
  // ==========================================================================

  async loadQuiz(bookId, chapterId, kids = false) {
    try {
      const file = kids ? 'quizzes-kids.json' : 'quizzes.json';
      const response = await fetch(`books/${bookId}/assets/${file}`);
      if (!response.ok) return null;

      const allQuizzes = await response.json();
      return allQuizzes.quizzes?.find(q => q.chapterId === chapterId) || null;
    } catch (error) {
      logger.error('Error cargando quiz:', error);
      return null;
    }
  }

  // ==========================================================================
  // ABRIR QUIZ
  // ==========================================================================

  async open(bookId, chapterId, kids = false) {
    // FIX v2.9.234: Show loading state while fetching data
    this.renderLoading();

    try {
      const quiz = await this.loadQuiz(bookId, chapterId, kids);

      if (!quiz) {
        // Si se pidió la versión para niños y no existe, caer a la normal.
        if (kids) { return this.open(bookId, chapterId, false); }
        this.close();
        window.toast?.info('No hay quiz disponible para este capitulo');
        return;
      }

      // ¿Existe la versión alternativa? (para mostrar el toggle niños/normal)
      this.hasAlternate = !!(await this.loadQuiz(bookId, chapterId, !kids));
      this.bookId = bookId;
      this.chapterId = chapterId;
      this.kidsMode = kids;

      this.currentQuiz = quiz;
      this.currentQuestionIndex = 0;
      this.answers = [];
      this.score = 0;
      // Solo las preguntas evaluables (con opciones) cuentan para la puntuación;
      // las de tipo 'reflection' se muestran pero no se puntúan.
      this.gradedCount = quiz.questions.filter(q => Array.isArray(q.options) && q.options.length > 0).length;
      this.isOpen = true;

      this.render();
      this.attachEventListeners();
    } catch (error) {
      logger.error('Error opening quiz:', error);
      this.close();
      window.toast?.error('Error al cargar el quiz');
    }
  }

  /**
   * FIX v2.9.234: Loading state for async data
   */
  renderLoading() {
    const existing = document.getElementById('quiz-modal');
    if (existing) existing.remove();

    const html = `
      <div id="quiz-modal" class="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div class="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-8 border border-cyan-500/30 shadow-2xl">
          <div class="flex flex-col items-center gap-4">
            <div class="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
            <p class="text-gray-400">Cargando quiz...</p>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  close(force = false) {
    // 🔧 FIX v2.9.266: Confirmar si el quiz está en progreso
    if (!force && this.answers.length > 0 && this.currentQuestionIndex < (this.currentQuiz?.questions?.length || 0)) {
      const confirmExit = window.confirm('¿Estás seguro de que quieres salir? Perderás tu progreso en el quiz.');
      if (!confirmExit) return;
    }

    // 🔧 FIX #32: Cleanup escape key handler to prevent memory leaks
    if (this.handleEscape) {
      document.removeEventListener('keydown', this.handleEscape);
      this.handleEscape = null;
    }
    const modal = document.getElementById('quiz-modal');
    if (modal) {
      modal.classList.add('opacity-0');
      setTimeout(() => {
        modal.remove();
        this.isOpen = false;
        // Reset state
        this.answers = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
      }, 200);
    }
  }

  // ==========================================================================
  // RENDERIZADO
  // ==========================================================================

  render() {
    const existing = document.getElementById('quiz-modal');
    if (existing) existing.remove();

    const html = `
      <div id="quiz-modal"
           class="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-200">
        <div class="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl border border-cyan-500/30 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">

          <!-- Header -->
          <div class="bg-gradient-to-r from-cyan-900/50 to-indigo-900/50 p-6 border-b border-cyan-500/30">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-2xl font-bold text-cyan-300 flex items-center gap-2">
                  🎯 ${this.currentQuiz.title}
                </h2>
                <p class="text-sm text-gray-400 mt-1">${this.currentQuiz.description}</p>
                ${this.hasAlternate ? `
                  <button id="toggle-kids" class="mt-2 text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition">
                    ${this.kidsMode ? '🎓 Ver versión normal' : '👶 Ver versión para niños'}
                  </button>
                ` : ''}
              </div>
              <button id="close-quiz" class="text-gray-400 hover:text-white transition p-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Progreso -->
            <div class="mt-4">
              <div class="flex justify-between text-sm text-gray-400 mb-2">
                <span>Pregunta ${this.currentQuestionIndex + 1} de ${this.currentQuiz.questions.length}</span>
                <span>${Math.round(((this.currentQuestionIndex) / this.currentQuiz.questions.length) * 100)}% completado</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2">
                <div class="bg-gradient-to-r from-cyan-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                     style="width: ${(this.currentQuestionIndex / this.currentQuiz.questions.length) * 100}%"></div>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="p-6 overflow-y-auto" style="max-height: calc(90vh - 200px)">
            ${this.renderCurrentQuestion()}
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    setTimeout(() => {
      document.getElementById('quiz-modal')?.classList.remove('opacity-0');
    }, 10);
  }

  renderCurrentQuestion() {
    if (this.currentQuestionIndex >= this.currentQuiz.questions.length) {
      return this.renderResults();
    }

    const question = this.currentQuiz.questions[this.currentQuestionIndex];

    // Preguntas de reflexión: sin respuesta correcta, no se puntúan.
    if (this.isReflection(question)) {
      return this.renderReflection(question);
    }

    return `
      <div class="space-y-6">
        <!-- Pregunta -->
        <div class="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 p-6 rounded-xl border border-indigo-500/30">
          <h3 class="text-xl font-semibold text-white mb-2">${question.question}</h3>
          ${question.context ? `<p class="text-sm text-gray-400 italic">${question.context}</p>` : ''}
        </div>

        <!-- Opciones -->
        <div class="space-y-3">
          ${question.options.map((option, index) => `
            <button data-option-index="${index}"
                    class="quiz-option w-full text-left p-4 rounded-xl border-2 border-gray-700 hover:border-cyan-500 hover:bg-cyan-900/20 transition-all duration-200 group">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full border-2 border-gray-600 group-hover:border-cyan-400 flex items-center justify-center text-gray-400 group-hover:text-cyan-300 flex-shrink-0">
                  ${String.fromCharCode(65 + index)}
                </div>
                <span class="text-gray-300 group-hover:text-white">${option}</span>
              </div>
            </button>
          `).join('')}
        </div>

        ${question.hint ? `
          <details class="mt-4">
            <summary class="text-sm text-cyan-400 hover:text-cyan-300 cursor-pointer">
              💡 Ver pista
            </summary>
            <p class="text-sm text-gray-400 mt-2 pl-6">${question.hint}</p>
          </details>
        ` : ''}
      </div>
    `;
  }

  isReflection(question) {
    return question.type === 'reflection' || !(Array.isArray(question.options) && question.options.length > 0);
  }

  renderReflection(question) {
    const points = Array.isArray(question.guidingPoints) ? question.guidingPoints : [];
    return `
      <div class="space-y-6">
        <!-- Pregunta de reflexión -->
        <div class="bg-gradient-to-r from-amber-900/30 to-orange-900/30 p-6 rounded-xl border border-amber-500/30">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-semibold text-amber-300 uppercase tracking-wide">💭 Reflexión</span>
          </div>
          <h3 class="text-xl font-semibold text-white">${question.question}</h3>
        </div>

        ${points.length ? `
          <div class="bg-slate-800/50 p-4 rounded-xl border border-gray-700">
            <p class="text-sm font-semibold text-gray-300 mb-2">Para reflexionar:</p>
            <ul class="space-y-2">
              ${points.map(p => `<li class="text-sm text-gray-400 flex items-start gap-2"><span class="text-amber-400">·</span><span>${p}</span></li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <textarea id="reflection-answer" rows="4"
                  placeholder="Escribe tu reflexión (opcional, solo para ti)..."
                  class="w-full p-4 rounded-xl bg-slate-800/50 border border-gray-700 text-gray-200 placeholder-gray-500 focus:border-amber-500 focus:outline-none resize-none"></textarea>

        <button id="continue-reflection"
                class="w-full px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-lg transition font-semibold">
          Continuar →
        </button>
      </div>
    `;
  }

  renderResults() {
    const graded = this.gradedCount || 0;
    const percentage = graded > 0 ? Math.round((this.score / graded) * 100) : 100;
    const passed = percentage >= 70;

    let feedback, emoji;
    if (percentage >= 90) {
      emoji = '🏆';
      feedback = 'Excelente! Dominas completamente este tema.';
    } else if (percentage >= 70) {
      emoji = '✅';
      feedback = 'Muy bien! Has comprendido los conceptos clave.';
    } else if (percentage >= 50) {
      emoji = '📚';
      feedback = 'Buen intento. Te recomendamos revisar el capítulo nuevamente.';
    } else {
      emoji = '💪';
      feedback = 'Necesitas reforzar estos conceptos. Vuelve a leer el capítulo.';
    }

    return `
      <div class="text-center space-y-6">
        <div class="text-8xl">${emoji}</div>

        <div>
          <h3 class="text-3xl font-bold text-white mb-2">
            ${this.score} / ${graded}
          </h3>
          <p class="text-5xl font-bold ${passed ? 'text-green-400' : 'text-yellow-400'}">
            ${percentage}%
          </p>
        </div>

        <div class="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 p-6 rounded-xl border border-indigo-500/30">
          <p class="text-lg text-gray-300">${feedback}</p>
        </div>

        <!-- Desglose de respuestas -->
        <div class="bg-slate-800/50 p-6 rounded-xl border border-gray-700 text-left space-y-4">
          <h4 class="text-lg font-semibold text-white mb-4">📊 Resumen de respuestas:</h4>
          ${this.currentQuiz.questions.map((q, i) => {
            const userAnswer = this.answers[i];
            // Preguntas de reflexión: se muestran como reflexión, no como acierto/fallo.
            if (this.isReflection(q)) {
              const reflectionText = (userAnswer && userAnswer.text) ? userAnswer.text : '';
              return `
              <div class="pb-3 border-b border-gray-700 last:border-0">
                <div class="flex items-start gap-3">
                  <span class="text-2xl">💭</span>
                  <div class="flex-1">
                    <p class="text-sm font-semibold text-gray-300">${q.question}</p>
                    ${reflectionText ? `
                      <p class="text-xs text-amber-300/80 mt-1 italic">Tu reflexión: ${reflectionText}</p>
                    ` : `
                      <p class="text-xs text-gray-500 mt-1">Reflexión personal (sin puntuación)</p>
                    `}
                  </div>
                </div>
              </div>
              `;
            }
            const correct = userAnswer === q.correctAnswer;
            return `
              <div class="pb-3 border-b border-gray-700 last:border-0">
                <div class="flex items-start gap-3">
                  <span class="text-2xl">${correct ? '✅' : '❌'}</span>
                  <div class="flex-1">
                    <p class="text-sm font-semibold text-gray-300">${q.question}</p>
                    ${!correct ? `
                      <p class="text-xs text-red-400 mt-1">Tu respuesta: ${q.options[userAnswer]}</p>
                      <p class="text-xs text-green-400">Correcta: ${q.options[q.correctAnswer]}</p>
                    ` : ''}
                    ${q.explanation ? `
                      <p class="text-xs text-gray-500 mt-2 italic">${q.explanation}</p>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Acciones -->
        <div class="flex gap-3 justify-center">
          <button id="retry-quiz" class="px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 rounded-lg transition font-semibold">
            🔄 Volver a intentar
          </button>
          <button id="close-quiz-results" class="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
            Cerrar
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  attachEventListeners() {
    // Cerrar modal
    document.getElementById('close-quiz')?.addEventListener('click', () => this.close());
    document.getElementById('close-quiz-results')?.addEventListener('click', () => this.close());

    // Reintentar
    document.getElementById('retry-quiz')?.addEventListener('click', () => {
      this.currentQuestionIndex = 0;
      this.answers = [];
      this.score = 0;
      this.render();
      this.attachEventListeners();
    });

    // Opciones de respuesta
    document.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const optionIndex = parseInt(e.currentTarget.dataset.optionIndex);
        this.handleAnswer(optionIndex);
      });
    });

    // Continuar en preguntas de reflexión
    document.getElementById('continue-reflection')?.addEventListener('click', () => {
      const text = document.getElementById('reflection-answer')?.value || '';
      this.handleReflection(text);
    });

    // Alternar entre versión normal y versión para niños
    document.getElementById('toggle-kids')?.addEventListener('click', () => {
      this.open(this.bookId, this.chapterId, !this.kidsMode);
    });

    // ESC para cerrar
    document.addEventListener('keydown', this.handleEscape = (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  }

  handleAnswer(optionIndex) {
    const question = this.currentQuiz.questions[this.currentQuestionIndex];
    const correct = optionIndex === question.correctAnswer;

    this.answers.push(optionIndex);
    if (correct) this.score++;

    // Mostrar feedback visual
    const buttons = document.querySelectorAll('.quiz-option');
    buttons.forEach((btn, i) => {
      btn.disabled = true;
      if (i === question.correctAnswer) {
        btn.classList.add('border-green-500', 'bg-green-900/30');
      } else if (i === optionIndex && !correct) {
        btn.classList.add('border-red-500', 'bg-red-900/30');
      }
    });

    // Avanzar a siguiente pregunta después de 1.5s
    setTimeout(() => {
      this.currentQuestionIndex++;
      this.render();
      this.attachEventListeners();
    }, 1500);
  }

  handleReflection(text) {
    // Las reflexiones no se puntúan; se registra la respuesta (si la hay) y se avanza.
    this.answers.push({ reflection: true, text: (text || '').trim() });
    this.currentQuestionIndex++;
    this.render();
    this.attachEventListeners();
  }

  // ==========================================================================
  // GUARDAR PROGRESO
  // ==========================================================================

  saveQuizResult(bookId, chapterId) {
    const key = `quiz-results-${bookId}`;
    const results = JSON.parse(localStorage.getItem(key) || '{}');

    const graded = this.gradedCount || 0;
    results[chapterId] = {
      score: this.score,
      total: graded,
      percentage: graded > 0 ? Math.round((this.score / graded) * 100) : 100,
      date: new Date().toISOString(),
      passed: graded > 0 ? (this.score / graded) >= 0.7 : true
    };

    localStorage.setItem(key, JSON.stringify(results));

    // Trackear achievement
    if (window.achievementSystem) {
      window.achievementSystem.trackQuizCompleted(results[chapterId].percentage);
    }
  }

  getQuizResults(bookId) {
    return JSON.parse(localStorage.getItem(`quiz-results-${bookId}`) || '{}');
  }
}

// ==========================================================================
// EXPORTAR
// ==========================================================================

window.InteractiveQuiz = InteractiveQuiz;
window.interactiveQuiz = new InteractiveQuiz();
