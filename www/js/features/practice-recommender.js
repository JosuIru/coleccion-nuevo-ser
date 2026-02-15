// ============================================================================
// SISTEMA DE RECOMENDACIÓN DE PRÁCTICAS
// ============================================================================
// Motor inteligente que sugiere ejercicios/prácticas basado en:
// - Progreso de lectura del usuario
// - Historial de prácticas completadas
// - Nivel de dificultad apropiado
// - Tiempo desde última práctica
// - Intereses inferidos del usuario
// ============================================================================

// 🔧 FIX v2.9.198: Migrated console.log to logger
class PracticeRecommender {
  constructor(practiceLibrary, bookEngine) {
    this.practiceLibrary = practiceLibrary;
    this.bookEngine = bookEngine;
    this.userPreferences = this.loadPreferences();
    this.practiceHistory = this.loadHistory();
  }

  // ==========================================================================
  // STORAGE - Preferencias e Historial
  // ==========================================================================

  loadPreferences() {
    const stored = localStorage.getItem('practice_preferences');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        logger.error('Error loading preferences:', e);
      }
    }

    // Default preferences
    return {
      favoriteTypes: [], // meditation, reflection, action, physical
      preferredDifficulty: 'intermedio',
      preferredDuration: 'medium', // short, medium, long
      interests: [] // tags like 'mindfulness', 'ecology', 'activism'
    };
  }

  savePreferences() {
    localStorage.setItem('practice_preferences', JSON.stringify(this.userPreferences));
  }

  loadHistory() {
    const stored = localStorage.getItem('practice_history');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        logger.error('Error loading history:', e);
      }
    }

    return {
      completed: [], // Array de { practiceId, date, rating }
      skipped: [],   // Array de { practiceId, date }
      started: []    // Array de { practiceId, date }
    };
  }

  saveHistory() {
    localStorage.setItem('practice_history', JSON.stringify(this.practiceHistory));
  }

  // ==========================================================================
  // TRACKING - Completar/Saltar Prácticas
  // ==========================================================================

  markCompleted(practiceId, rating = 5) {
    this.practiceHistory.completed.push({
      practiceId,
      date: new Date().toISOString(),
      rating
    });

    // Inferir preferencias del usuario basado en lo que completa
    const practice = this.practiceLibrary.practices.find(p => p.id === practiceId);
    if (practice) {
      this.updatePreferencesFromPractice(practice);
    }

    this.saveHistory();

    // Actualizar logros si existe el sistema
    if (window.achievementSystem) {
      window.achievementSystem.trackPracticeCompleted(practiceId);
    }
  }

  markSkipped(practiceId) {
    this.practiceHistory.skipped.push({
      practiceId,
      date: new Date().toISOString()
    });
    this.saveHistory();
  }

  markStarted(practiceId) {
    this.practiceHistory.started.push({
      practiceId,
      date: new Date().toISOString()
    });
    this.saveHistory();
  }

  updatePreferencesFromPractice(practice) {
    // Añadir tipo favorito
    if (!this.userPreferences.favoriteTypes.includes(practice.type)) {
      this.userPreferences.favoriteTypes.push(practice.type);
    }

    // Añadir intereses (tags)
    practice.tags.forEach(tag => {
      if (!this.userPreferences.interests.includes(tag)) {
        this.userPreferences.interests.push(tag);
      }
    });

    // Limitar a top 10 intereses
    if (this.userPreferences.interests.length > 10) {
      this.userPreferences.interests = this.userPreferences.interests.slice(-10);
    }

    this.savePreferences();
  }

  // ==========================================================================
  // ALGORITMO DE RECOMENDACIÓN
  // ==========================================================================

  async getRecommendations(count = 3) {
    // Asegurar que las prácticas están cargadas
    if (this.practiceLibrary.practices.length === 0) {
      await this.practiceLibrary.loadAllPractices();
    }

    const practices = this.practiceLibrary.practices;

    // Calcular score para cada práctica
    const scored = practices.map(practice => ({
      practice,
      score: this.calculateScore(practice)
    }));

    // Ordenar por score (mayor a menor)
    scored.sort((a, b) => b.score - a.score);

    // Aplicar diversidad: no recomendar 3 del mismo tipo
    const diverse = this.ensureDiversity(scored, count);

    return diverse.slice(0, count).map(item => item.practice);
  }

  calculateScore(practice) {
    let score = 0;

    // 1. Bonus por libros en progreso (+30 puntos)
    const bookProgress = this.bookEngine.getProgress(practice.book.id);
    if (bookProgress && bookProgress.chaptersRead > 0) {
      score += 30;

      // Bonus extra si es el libro actual (+20 puntos)
      if (bookProgress.lastChapter) {
        score += 20;
      }
    }

    // 2. Bonus por tipo favorito (+25 puntos)
    if (this.userPreferences.favoriteTypes.includes(practice.type)) {
      score += 25;
    }

    // 3. Bonus por intereses del usuario (+15 puntos por tag coincidente)
    const matchingTags = practice.tags.filter(tag =>
      this.userPreferences.interests.includes(tag)
    );
    score += matchingTags.length * 15;

    // 4. Bonus por dificultad apropiada (+20 puntos)
    if (practice.difficulty === this.userPreferences.preferredDifficulty) {
      score += 20;
    }

    // 5. Bonus por duración preferida (+15 puntos)
    const duration = this.practiceLibrary.parseDuration(practice.duration);
    const preferredDuration = this.userPreferences.preferredDuration;

    if (
      (preferredDuration === 'short' && duration < 15) ||
      (preferredDuration === 'medium' && duration >= 15 && duration <= 30) ||
      (preferredDuration === 'long' && duration > 30)
    ) {
      score += 15;
    }

    // 6. Penalización si ya fue completada recientemente (-50 puntos)
    const recentlyCompleted = this.wasCompletedRecently(practice.id, 7); // 7 días
    if (recentlyCompleted) {
      score -= 50;
    }

    // 7. Penalización si fue saltada (-30 puntos)
    const wasSkipped = this.wasSkipped(practice.id);
    if (wasSkipped) {
      score -= 30;
    }

    // 8. Bonus por nunca realizada (+10 puntos)
    const neverDone = !this.wasEverCompleted(practice.id);
    if (neverDone) {
      score += 10;
    }

    // 9. Bonus por tiempo sin hacer prácticas similares (+20 puntos)
    const daysSinceSimilar = this.daysSinceLastPracticeOfType(practice.type);
    if (daysSinceSimilar > 3) {
      score += 20;
    }

    // 10. Factor de novedad/frescura
    // Prácticas de libros recién añadidos tienen bonus
    const isNewBook = this.isRecentBook(practice.book.id);
    if (isNewBook) {
      score += 15;
    }

    // 11. Randomización ligera para evitar monotonía
    score += Math.random() * 10;

    return score;
  }

  ensureDiversity(scoredPractices, count) {
    const diverse = [];
    const typesSeen = new Set();

    for (const item of scoredPractices) {
      // Siempre añadir el primero
      if (diverse.length === 0) {
        diverse.push(item);
        typesSeen.add(item.practice.type);
        continue;
      }

      // Si ya tenemos suficientes, parar
      if (diverse.length >= count) {
        break;
      }

      // Si este tipo ya lo tenemos y hay otros disponibles, intentar variedad
      if (typesSeen.has(item.practice.type) && typesSeen.size < 4) {
        // Buscar siguiente de otro tipo
        const alternative = scoredPractices.find(p =>
          !typesSeen.has(p.practice.type) &&
          !diverse.includes(p)
        );

        if (alternative) {
          diverse.push(alternative);
          typesSeen.add(alternative.practice.type);
          continue;
        }
      }

      // Añadir este aunque sea del mismo tipo
      diverse.push(item);
      typesSeen.add(item.practice.type);
    }

    return diverse;
  }

  // ==========================================================================
  // HELPERS - Consultas de Historial
  // ==========================================================================

  wasCompletedRecently(practiceId, days = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return this.practiceHistory.completed.some(entry => {
      if (entry.practiceId !== practiceId) return false;
      const entryDate = new Date(entry.date);
      return entryDate > cutoff;
    });
  }

  wasEverCompleted(practiceId) {
    return this.practiceHistory.completed.some(entry => entry.practiceId === practiceId);
  }

  wasSkipped(practiceId) {
    return this.practiceHistory.skipped.some(entry => entry.practiceId === practiceId);
  }

  daysSinceLastPracticeOfType(type) {
    const completedOfType = this.practiceHistory.completed.filter(entry => {
      const practice = this.practiceLibrary.practices.find(p => p.id === entry.practiceId);
      return practice && practice.type === type;
    });

    if (completedOfType.length === 0) {
      return Infinity; // Nunca hecho
    }

    // Encontrar la más reciente
    const mostRecent = completedOfType.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    })[0];

    const daysSince = Math.floor(
      (new Date() - new Date(mostRecent.date)) / (1000 * 60 * 60 * 24)
    );

    return daysSince;
  }

  isRecentBook(bookId) {
    // Considerar "recientes" los libros añadidos en los últimos 30 días
    // Verifica la fecha de adición del libro en el catálogo
    try {
      const catalog = this.bookEngine?.catalog;
      if (!catalog?.books) return false;

      const book = catalog.books.find(b => b.id === bookId);
      if (!book?.dateAdded) {
        // Fallback: libros sin fecha se consideran antiguos, excepto estos conocidos como recientes
        const knownRecentBooks = ['tierra-que-despierta', 'nacimiento', 'dialogos-maquina'];
        return knownRecentBooks.includes(bookId);
      }

      // Calcular días desde que se añadió
      const addedDate = new Date(book.dateAdded);
      const now = new Date();
      const daysSince = Math.floor((now - addedDate) / (1000 * 60 * 60 * 24));

      return daysSince <= 30; // Reciente si fue añadido hace 30 días o menos
    } catch (error) {
      return false;
    }
  }

  // ==========================================================================
  // PRÁCTICA DEL DÍA
  // ==========================================================================

  async getPracticeOfTheDay() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Check si ya hay una práctica del día guardada para hoy
    const stored = localStorage.getItem('practice_of_the_day');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.date === today) {
          // Buscar la práctica
          const practice = this.practiceLibrary.practices.find(p => p.id === data.practiceId);
          if (practice) {
            return practice;
          }
        }
      } catch (e) {
        logger.error('Error loading practice of the day:', e);
      }
    }

    // Generar nueva práctica del día
    const recommendations = await this.getRecommendations(5);
    const practiceOfTheDay = recommendations[0];

    // Guardar para hoy
    localStorage.setItem('practice_of_the_day', JSON.stringify({
      date: today,
      practiceId: practiceOfTheDay.id
    }));

    return practiceOfTheDay;
  }

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================

  getStats() {
    const totalCompleted = this.practiceHistory.completed.length;
    const totalStarted = this.practiceHistory.started.length;
    const totalSkipped = this.practiceHistory.skipped.length;

    // Streak: días consecutivos con al menos 1 práctica
    const streak = this.calculateStreak();

    // Tipos más practicados
    const typeCounts = {};
    this.practiceHistory.completed.forEach(entry => {
      const practice = this.practiceLibrary.practices.find(p => p.id === entry.practiceId);
      if (practice) {
        typeCounts[practice.type] = (typeCounts[practice.type] || 0) + 1;
      }
    });

    const favoriteType = Object.keys(typeCounts).sort((a, b) =>
      typeCounts[b] - typeCounts[a]
    )[0] || null;

    return {
      totalCompleted,
      totalStarted,
      totalSkipped,
      streak,
      favoriteType,
      typeCounts
    };
  }

  calculateStreak() {
    if (this.practiceHistory.completed.length === 0) {
      return 0;
    }

    // Obtener fechas únicas de prácticas completadas
    const dates = [...new Set(
      this.practiceHistory.completed.map(entry =>
        entry.date.split('T')[0]
      )
    )].sort().reverse();

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const dateStr of dates) {
      const practiceDate = new Date(dateStr);
      practiceDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((currentDate - practiceDate) / (1000 * 60 * 60 * 24));

      if (diffDays === streak) {
        streak++;
      } else if (diffDays > streak) {
        break;
      }
    }

    return streak;
  }
}

// ==========================================================================
// WIDGET - Ejercicio del Día
// ==========================================================================

class PracticeOfTheDayWidget {
  constructor(recommender) {
    this.recommender = recommender;
    this.isOpen = false;
  }

  async render() {
    const practiceOfDay = await this.recommender.getPracticeOfTheDay();
    const suggestions = await this.recommender.getRecommendations(3);
    const stats = this.recommender.getStats();

    const typeEmoji = {
      meditation: '🧘',
      reflection: '💭',
      action: '🎯',
      physical: '🌳'
    };

    return `
      <div class="practice-of-day-widget bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-2xl p-6 mb-8 border-2 border-violet-300 dark:border-violet-700">
        <!-- Header con stats -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            ✨ Práctica del Día
          </h3>
          <div class="flex items-center gap-3 text-sm">
            <div class="flex items-center gap-1 bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
              <span class="text-orange-500">🔥</span>
              <span class="font-bold text-gray-900 dark:text-white">${stats.streak}</span>
              <span class="text-gray-600 dark:text-gray-400">días</span>
            </div>
            <div class="flex items-center gap-1 bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
              <span class="text-green-500">✓</span>
              <span class="font-bold text-gray-900 dark:text-white">${stats.totalCompleted}</span>
            </div>
          </div>
        </div>

        <!-- Práctica destacada -->
        <div class="bg-white dark:bg-gray-800 rounded-xl p-5 mb-4 shadow-lg border border-violet-200 dark:border-violet-800">
          <div class="flex items-start gap-4">
            <div class="text-5xl">${typeEmoji[practiceOfDay.type]}</div>
            <div class="flex-1">
              <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                ${practiceOfDay.title}
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                📚 ${practiceOfDay.book.title}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-200 mb-3 line-clamp-2">
                ${practiceOfDay.description}
              </p>
              <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <span>⏱️ ${practiceOfDay.duration}</span>
                <span>•</span>
                <span>${this.getDifficultyLabel(practiceOfDay.difficulty)}</span>
              </div>
              <div class="flex gap-2">
                <button class="practice-do-featured flex-1 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-lg font-semibold transition"
                        data-practice-id="${practiceOfDay.id}"
                        data-book-id="${practiceOfDay.book.id}"
                        data-section-id="${practiceOfDay.section.id}"
                        data-chapter-id="${practiceOfDay.chapter.id}">
                  Hacer ahora
                </button>
                <button class="practice-skip px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-semibold transition"
                        data-practice-id="${practiceOfDay.id}">
                  Otro día
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sugerencias rápidas -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          ${suggestions.map(practice => this.renderQuickSuggestion(practice, typeEmoji)).join('')}
        </div>

        <!-- Ver todas -->
        <button id="open-practice-library-widget"
                class="w-full mt-4 px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-gray-900 dark:text-white font-semibold transition border border-violet-200 dark:border-violet-800">
          Ver todas las prácticas →
        </button>
      </div>
    `;
  }

  renderQuickSuggestion(practice, typeEmoji) {
    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-violet-200 dark:border-violet-800 hover:shadow-md transition">
        <div class="text-2xl mb-2">${typeEmoji[practice.type]}</div>
        <h5 class="font-semibold text-sm text-gray-900 dark:text-white mb-1 line-clamp-2">
          ${practice.title}
        </h5>
        <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">
          ⏱️ ${practice.duration}
        </p>
        <button class="practice-do-quick w-full px-3 py-1.5 bg-violet-100 dark:bg-violet-900/30 hover:bg-violet-200 dark:hover:bg-violet-900/50 text-violet-900 dark:text-violet-200 rounded text-sm font-medium transition"
                data-practice-id="${practice.id}"
                data-book-id="${practice.book.id}"
                data-section-id="${practice.section.id}"
                data-chapter-id="${practice.chapter.id}">
          Hacer
        </button>
      </div>
    `;
  }

  getDifficultyLabel(difficulty) {
    const labels = {
      básico: '●○○ Básico',
      intermedio: '●●○ Intermedio',
      avanzado: '●●● Avanzado'
    };
    return labels[difficulty] || difficulty;
  }

  attachEventListeners(container) {
    // "Hacer ahora" de práctica destacada
    const doFeaturedBtn = container.querySelector('.practice-do-featured');
    if (doFeaturedBtn) {
      doFeaturedBtn.addEventListener('click', (e) => {
        const practiceId = e.target.dataset.practiceId;
        const bookId = e.target.dataset.bookId;
        const sectionId = e.target.dataset.sectionId;
        const chapterId = e.target.dataset.chapterId;

        this.recommender.markStarted(practiceId);

        if (window.bookEngine) {
          window.bookEngine.loadBook(bookId, sectionId, chapterId);
        }
      });
    }

    // "Otro día" (skip)
    const skipBtn = container.querySelector('.practice-skip');
    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        const practiceId = e.target.dataset.practiceId;
        this.recommender.markSkipped(practiceId);

        // Generar nueva práctica del día
        this.regenerateWidget();

        if (window.Toast) {
          window.Toast.show('Práctica saltada. Te sugerimos otra:', 'info');
        }
      });
    }

    // Botones de sugerencias rápidas
    const quickButtons = container.querySelectorAll('.practice-do-quick');
    quickButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const practiceId = e.target.dataset.practiceId;
        const bookId = e.target.dataset.bookId;
        const sectionId = e.target.dataset.sectionId;
        const chapterId = e.target.dataset.chapterId;

        this.recommender.markStarted(practiceId);

        if (window.bookEngine) {
          window.bookEngine.loadBook(bookId, sectionId, chapterId);
        }
      });
    });

    // "Ver todas las prácticas"
    const openLibraryBtn = container.querySelector('#open-practice-library-widget');
    if (openLibraryBtn) {
      openLibraryBtn.addEventListener('click', () => {
        // 🔧 FIX #7: Usar método wrapper de biblioteca que actualiza tab activo
        if (window.biblioteca?.openPracticeLibrary) {
          window.biblioteca.openPracticeLibrary();
        } else if (window.practiceLibrary) {
          window.practiceLibrary.open();
        }
      });
    }
  }

  async regenerateWidget() {
    // Limpiar práctica del día guardada
    localStorage.removeItem('practice_of_the_day');

    // Re-renderizar
    const container = document.querySelector('.practice-of-day-widget');
    if (container) {
      const html = await this.render();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const newWidget = tempDiv.firstElementChild;

      container.replaceWith(newWidget);
      this.attachEventListeners(newWidget);
    }
  }
}

window.PracticeOfTheDayWidget = PracticeOfTheDayWidget;

// ==========================================================================
// INICIALIZACIÓN GLOBAL
// ==========================================================================

// 🔧 v2.9.325: Exportar clase e instancia
window.PracticeRecommender = PracticeRecommender;
window.practiceRecommender = new PracticeRecommender();

// logger.debug('✅ Practice Recommender System loaded');
