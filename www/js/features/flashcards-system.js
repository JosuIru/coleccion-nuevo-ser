// ============================================================================
// FLASHCARDS SYSTEM - Sistema de Tarjetas de Estudio
// ============================================================================
// v2.9.369: Crear flashcards desde notas con repaso espaciado
// ============================================================================

class FlashcardsSystem {
  constructor() {
    this.i18n = window.i18n || { t: (key) => key };
    this.flashcards = this.loadFlashcards();
    this.currentDeck = [];
    this.currentIndex = 0;
    this.isFlipped = false;
    this.sessionStats = { correct: 0, incorrect: 0, total: 0 };

    // Intervalos de repaso espaciado (en días)
    this.intervals = [1, 3, 7, 14, 30, 60];
  }

  // ==========================================================================
  // GESTIÓN DE DATOS
  // ==========================================================================

  loadFlashcards() {
    try {
      return JSON.parse(localStorage.getItem('flashcards-data') || '[]');
    } catch {
      return [];
    }
  }

  saveFlashcards() {
    try {
      localStorage.setItem('flashcards-data', JSON.stringify(this.flashcards));
    } catch (error) {
      logger.error('Error guardando flashcards:', error);
    }
  }

  createFlashcard(front, back, source = {}) {
    const flashcard = {
      id: `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      front: front.trim(),
      back: back.trim(),
      source: {
        bookId: source.bookId || null,
        chapterId: source.chapterId || null,
        noteId: source.noteId || null
      },
      created: new Date().toISOString(),
      // Datos de repaso espaciado
      level: 0, // 0-5, determina el intervalo
      nextReview: new Date().toISOString(),
      lastReview: null,
      correctCount: 0,
      incorrectCount: 0
    };

    this.flashcards.push(flashcard);
    this.saveFlashcards();
    window.toast?.success('Flashcard creada');

    return flashcard;
  }

  deleteFlashcard(id) {
    this.flashcards = this.flashcards.filter(fc => fc.id !== id);
    this.saveFlashcards();
  }

  updateFlashcard(id, updates) {
    const index = this.flashcards.findIndex(fc => fc.id === id);
    if (index !== -1) {
      this.flashcards[index] = { ...this.flashcards[index], ...updates };
      this.saveFlashcards();
    }
  }

  // ==========================================================================
  // REPASO ESPACIADO
  // ==========================================================================

  getDueFlashcards() {
    const now = new Date();
    return this.flashcards.filter(fc => new Date(fc.nextReview) <= now);
  }

  markAsCorrect(flashcard) {
    const newLevel = Math.min(flashcard.level + 1, this.intervals.length - 1);
    const daysUntilNext = this.intervals[newLevel];
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + daysUntilNext);

    this.updateFlashcard(flashcard.id, {
      level: newLevel,
      nextReview: nextReview.toISOString(),
      lastReview: new Date().toISOString(),
      correctCount: flashcard.correctCount + 1
    });

    this.sessionStats.correct++;
    this.sessionStats.total++;
  }

  markAsIncorrect(flashcard) {
    // Reducir nivel pero no menos de 0
    const newLevel = Math.max(flashcard.level - 1, 0);
    const daysUntilNext = this.intervals[newLevel];
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + daysUntilNext);

    this.updateFlashcard(flashcard.id, {
      level: newLevel,
      nextReview: nextReview.toISOString(),
      lastReview: new Date().toISOString(),
      incorrectCount: flashcard.incorrectCount + 1
    });

    this.sessionStats.incorrect++;
    this.sessionStats.total++;
  }

  // ==========================================================================
  // CREAR DESDE NOTA
  // ==========================================================================

  createFromNote(note) {
    // Abrir modal para crear flashcard desde una nota
    this.showCreateModal(note.content, '', {
      noteId: note.id,
      bookId: note.bookId,
      chapterId: note.chapterId
    });
  }

  showCreateModal(initialFront = '', initialBack = '', source = {}) {
    document.getElementById('flashcard-create-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'flashcard-create-modal';
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10001] p-4';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6">
        <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          🎴 Crear Flashcard
        </h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frente (Pregunta/Concepto)
            </label>
            <textarea id="flashcard-front"
                      class="w-full h-24 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      placeholder="¿Qué quieres recordar?">${this.escapeHtml(initialFront)}</textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reverso (Respuesta/Definición)
            </label>
            <textarea id="flashcard-back"
                      class="w-full h-24 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      placeholder="La respuesta o explicación...">${this.escapeHtml(initialBack)}</textarea>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button id="cancel-flashcard-create" class="flex-1 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition">
            Cancelar
          </button>
          <button id="save-flashcard-create" class="flex-1 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold transition">
            Crear Flashcard
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('cancel-flashcard-create')?.addEventListener('click', () => modal.remove());

    document.getElementById('save-flashcard-create')?.addEventListener('click', () => {
      const front = document.getElementById('flashcard-front').value.trim();
      const back = document.getElementById('flashcard-back').value.trim();

      if (!front || !back) {
        window.toast?.error('Completa ambos campos');
        return;
      }

      this.createFlashcard(front, back, source);
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Focus
    setTimeout(() => document.getElementById('flashcard-front')?.focus(), 50);
  }

  // ==========================================================================
  // SESIÓN DE REPASO
  // ==========================================================================

  startReviewSession() {
    this.currentDeck = this.getDueFlashcards();

    if (this.currentDeck.length === 0) {
      window.toast?.info('No hay flashcards pendientes de repaso');
      this.showEmptyState();
      return;
    }

    // Mezclar el deck
    this.currentDeck = this.shuffleArray(this.currentDeck);
    this.currentIndex = 0;
    this.isFlipped = false;
    this.sessionStats = { correct: 0, incorrect: 0, total: 0 };

    this.showReviewModal();
  }

  showReviewModal() {
    document.getElementById('flashcard-review-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'flashcard-review-modal';
    modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[10000] p-4';

    modal.innerHTML = `
      <div class="max-w-2xl w-full">
        <!-- Progress -->
        <div class="mb-4 flex items-center justify-between text-white/70 text-sm">
          <span>${this.currentIndex + 1} / ${this.currentDeck.length}</span>
          <button id="close-flashcard-review" class="text-white/50 hover:text-white">
            ${Icons.close(24)}
          </button>
        </div>

        <!-- Card -->
        <div id="flashcard-card"
             class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-600 shadow-2xl min-h-[300px] p-8 cursor-pointer transition-transform duration-300 flex flex-col items-center justify-center text-center">
          <div id="flashcard-content" class="text-xl text-white">
            ${this.escapeHtml(this.currentDeck[this.currentIndex].front)}
          </div>
          <p class="text-slate-400 text-sm mt-6">Toca para voltear</p>
        </div>

        <!-- Actions (hidden until flipped) -->
        <div id="flashcard-actions" class="mt-6 flex gap-4 justify-center hidden">
          <button id="flashcard-incorrect" class="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-lg transition flex items-center gap-2">
            ❌ No lo sabía
          </button>
          <button id="flashcard-correct" class="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold text-lg transition flex items-center gap-2">
            ✅ Lo sabía
          </button>
        </div>

        <!-- Stats -->
        <div class="mt-6 flex justify-center gap-8 text-sm">
          <span class="text-green-400">✅ ${this.sessionStats.correct}</span>
          <span class="text-red-400">❌ ${this.sessionStats.incorrect}</span>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachReviewListeners();
  }

  attachReviewListeners() {
    // Cerrar
    document.getElementById('close-flashcard-review')?.addEventListener('click', () => {
      this.closeReview();
    });

    // Voltear carta
    document.getElementById('flashcard-card')?.addEventListener('click', () => {
      this.flipCard();
    });

    // Correcto
    document.getElementById('flashcard-correct')?.addEventListener('click', () => {
      this.markAsCorrect(this.currentDeck[this.currentIndex]);
      this.nextCard();
    });

    // Incorrecto
    document.getElementById('flashcard-incorrect')?.addEventListener('click', () => {
      this.markAsIncorrect(this.currentDeck[this.currentIndex]);
      this.nextCard();
    });

    // Atajos de teclado
    this.keyHandler = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!this.isFlipped) {
          this.flipCard();
        }
      } else if (e.key === '1' || e.key === 'ArrowLeft') {
        if (this.isFlipped) {
          this.markAsIncorrect(this.currentDeck[this.currentIndex]);
          this.nextCard();
        }
      } else if (e.key === '2' || e.key === 'ArrowRight') {
        if (this.isFlipped) {
          this.markAsCorrect(this.currentDeck[this.currentIndex]);
          this.nextCard();
        }
      } else if (e.key === 'Escape') {
        this.closeReview();
      }
    };
    document.addEventListener('keydown', this.keyHandler);
  }

  flipCard() {
    if (this.isFlipped) return;

    this.isFlipped = true;
    const card = document.getElementById('flashcard-card');
    const content = document.getElementById('flashcard-content');
    const actions = document.getElementById('flashcard-actions');

    // Animación de volteo
    card.style.transform = 'rotateY(180deg)';
    setTimeout(() => {
      content.innerHTML = this.escapeHtml(this.currentDeck[this.currentIndex].back);
      card.style.transform = 'rotateY(0)';
      card.classList.add('bg-gradient-to-br', 'from-cyan-900', 'to-blue-900');
      card.classList.remove('from-slate-800', 'to-slate-900');
      actions.classList.remove('hidden');
    }, 150);
  }

  nextCard() {
    this.currentIndex++;

    if (this.currentIndex >= this.currentDeck.length) {
      this.showSessionComplete();
      return;
    }

    this.isFlipped = false;
    this.showReviewModal();
  }

  showSessionComplete() {
    document.getElementById('flashcard-review-modal')?.remove();
    document.removeEventListener('keydown', this.keyHandler);

    const accuracy = this.sessionStats.total > 0
      ? Math.round((this.sessionStats.correct / this.sessionStats.total) * 100)
      : 0;

    const modal = document.createElement('div');
    modal.id = 'flashcard-complete-modal';
    modal.className = 'fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[10000] p-4';
    modal.innerHTML = `
      <div class="bg-gradient-to-br from-green-900/95 to-emerald-900/95 rounded-2xl max-w-md w-full p-8 text-center border border-green-500/30">
        <div class="text-6xl mb-4">🎉</div>
        <h2 class="text-2xl font-bold text-green-200 mb-4">¡Sesión completada!</h2>

        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="bg-green-800/50 rounded-xl p-4">
            <div class="text-3xl font-bold text-green-300">${this.sessionStats.correct}</div>
            <div class="text-sm text-green-400/70">Correctas</div>
          </div>
          <div class="bg-red-800/50 rounded-xl p-4">
            <div class="text-3xl font-bold text-red-300">${this.sessionStats.incorrect}</div>
            <div class="text-sm text-red-400/70">Incorrectas</div>
          </div>
          <div class="bg-blue-800/50 rounded-xl p-4">
            <div class="text-3xl font-bold text-blue-300">${accuracy}%</div>
            <div class="text-sm text-blue-400/70">Precisión</div>
          </div>
        </div>

        <button id="close-flashcard-complete" class="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold transition">
          Continuar
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('close-flashcard-complete')?.addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Track para logros
    if (window.achievementSystem) {
      window.achievementSystem.trackFlashcardSession(this.sessionStats);
    }
  }

  showEmptyState() {
    document.getElementById('flashcard-review-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'flashcard-empty-modal';
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4';
    modal.innerHTML = `
      <div class="bg-slate-800 rounded-2xl max-w-md w-full p-8 text-center border border-slate-600">
        <div class="text-6xl mb-4">🎴</div>
        <h2 class="text-xl font-bold text-white mb-4">No hay flashcards pendientes</h2>
        <p class="text-gray-400 mb-6">
          ${this.flashcards.length === 0
            ? 'Crea tu primera flashcard desde tus notas o manualmente.'
            : 'Todas tus flashcards están al día. ¡Vuelve mañana!'}
        </p>
        <div class="flex gap-3 justify-center">
          <button id="close-flashcard-empty" class="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition">
            Cerrar
          </button>
          <button id="create-flashcard-empty" class="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-xl font-bold transition">
            Crear Flashcard
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('close-flashcard-empty')?.addEventListener('click', () => modal.remove());
    document.getElementById('create-flashcard-empty')?.addEventListener('click', () => {
      modal.remove();
      this.showCreateModal();
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  closeReview() {
    document.getElementById('flashcard-review-modal')?.remove();
    document.removeEventListener('keydown', this.keyHandler);

    if (this.sessionStats.total > 0) {
      this.showSessionComplete();
    }
  }

  // ==========================================================================
  // GESTIÓN DE DECK
  // ==========================================================================

  showDeckManager() {
    document.getElementById('flashcard-manager-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'flashcard-manager-modal';
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4';

    const dueCount = this.getDueFlashcards().length;

    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-gray-300 dark:border-slate-600">
        <!-- Header -->
        <div class="p-6 border-b border-gray-200 dark:border-slate-700">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              🎴 Mis Flashcards
            </h2>
            <button id="close-flashcard-manager" class="text-gray-400 hover:text-gray-600 dark:hover:text-white">
              ${Icons.close(24)}
            </button>
          </div>
          <div class="flex gap-4 mt-4">
            <div class="flex-1 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-cyan-700 dark:text-cyan-400">${this.flashcards.length}</div>
              <div class="text-xs text-cyan-600 dark:text-cyan-500">Total</div>
            </div>
            <div class="flex-1 bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3 text-center">
              <div class="text-2xl font-bold text-amber-700 dark:text-amber-400">${dueCount}</div>
              <div class="text-xs text-amber-600 dark:text-amber-500">Pendientes</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-4 border-b border-gray-200 dark:border-slate-700 flex gap-3">
          <button id="start-review-btn" class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition ${dueCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}">
            ${Icons.play(16)} Repasar (${dueCount})
          </button>
          <button id="create-flashcard-btn" class="px-4 py-2 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-lg transition">
            ➕ Nueva
          </button>
        </div>

        <!-- List -->
        <div class="flex-1 overflow-y-auto p-4">
          ${this.flashcards.length === 0 ? `
            <div class="text-center py-12 text-gray-500 dark:text-gray-400">
              <div class="text-4xl mb-4">📝</div>
              <p>No tienes flashcards aún</p>
              <p class="text-sm mt-2">Crea una desde tus notas o manualmente</p>
            </div>
          ` : `
            <div class="space-y-3">
              ${this.flashcards.map(fc => this.renderFlashcardItem(fc)).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('close-flashcard-manager')?.addEventListener('click', () => modal.remove());
    document.getElementById('start-review-btn')?.addEventListener('click', () => {
      if (dueCount > 0) {
        modal.remove();
        this.startReviewSession();
      }
    });
    document.getElementById('create-flashcard-btn')?.addEventListener('click', () => {
      this.showCreateModal();
    });

    // Delete buttons
    modal.querySelectorAll('.delete-flashcard-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm('¿Eliminar esta flashcard?')) {
          this.deleteFlashcard(id);
          this.showDeckManager(); // Refresh
        }
      });
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  renderFlashcardItem(fc) {
    const nextReview = new Date(fc.nextReview);
    const isdue = nextReview <= new Date();
    const levelColors = ['gray', 'red', 'orange', 'yellow', 'green', 'cyan'];
    const levelColor = levelColors[fc.level] || 'gray';

    return `
      <div class="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 dark:text-white truncate">${this.escapeHtml(fc.front)}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">${this.escapeHtml(fc.back)}</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-1 text-xs rounded-full bg-${levelColor}-100 dark:bg-${levelColor}-900/30 text-${levelColor}-700 dark:text-${levelColor}-400">
              Nivel ${fc.level}
            </span>
            ${isdue ? '<span class="px-2 py-1 text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">Pendiente</span>' : ''}
            <button class="delete-flashcard-btn text-red-400 hover:text-red-600 p-1" data-id="${fc.id}">
              ${Icons.trash(16)}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  getStats() {
    const due = this.getDueFlashcards().length;
    const total = this.flashcards.length;
    const mastered = this.flashcards.filter(fc => fc.level >= 4).length;

    return { due, total, mastered };
  }
}

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================

window.FlashcardsSystem = FlashcardsSystem;

// Crear instancia global
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.flashcardsSystem = new FlashcardsSystem();
  });
} else {
  window.flashcardsSystem = new FlashcardsSystem();
}
