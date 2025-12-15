// ============================================================================
// PROGRESS DASHBOARD - Panel de Progreso Integral
// ============================================================================

class ProgressDashboard {
  constructor(bookEngine, achievementSystem) {
    this.bookEngine = bookEngine;
    this.achievementSystem = achievementSystem;
    this.i18n = window.i18n || { t: (key) => key };
  }

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================

  getOverallStats() {
    const stats = {
      totalChaptersRead: 0,
      totalChapters: 0,
      totalBooks: 0,
      booksCompleted: 0,
      notesCreated: this.getNotesCount(),
      reflectionsSaved: this.getReflectionsCount(),
      aiChatsCount: this.getAIChatsCount(),
      audioTimeMinutes: this.getAudioTimeMinutes(),
      achievementsUnlocked: 0,
      totalAchievements: 0,
      totalPoints: 0
    };

    // Obtener stats de cada libro
    const books = this.bookEngine?.getAllBooks() || [];
    stats.totalBooks = books.length;

    books.forEach(book => {
      const bookProgress = this.getBookStats(book.id);
      stats.totalChaptersRead += bookProgress.chaptersRead;
      stats.totalChapters += bookProgress.totalChapters;
      if (bookProgress.chaptersRead === bookProgress.totalChapters && bookProgress.totalChapters > 0) {
        stats.booksCompleted++;
      }
    });

    // Stats de logros
    if (this.achievementSystem) {
      const unlockedAchievements = this.achievementSystem.unlockedAchievements || {};
      stats.achievementsUnlocked = Object.keys(unlockedAchievements).length;
      stats.totalAchievements = this.achievementSystem.getTotalAchievementsCount?.() || 0;
      stats.totalPoints = this.achievementSystem.getTotalPoints?.() || 0;
    }

    return stats;
  }

  getBookStats(bookId) {
    // Usar getProgress() que devuelve { percentage, chaptersRead, totalChapters }
    const progress = this.bookEngine?.getProgress(bookId) || { percentage: 0, chaptersRead: 0, totalChapters: 0 };
    return {
      chaptersRead: progress.chaptersRead || 0,
      totalChapters: progress.totalChapters || 0,
      percentage: progress.percentage || 0
    };
  }

  getNotesCount() {
    try {
      // NotesModal usa 'coleccion_notes' como key
      const notes = JSON.parse(localStorage.getItem('coleccion_notes')) || {};
      return Object.values(notes).flat().length;
    } catch {
      return 0;
    }
  }

  getReflectionsCount() {
    try {
      const reflections = JSON.parse(localStorage.getItem('user-reflections')) || {};
      return Object.keys(reflections).length;
    } catch {
      return 0;
    }
  }

  getAIChatsCount() {
    // Usar stats del achievementSystem si está disponible
    if (this.achievementSystem?.stats?.aiChats) {
      return this.achievementSystem.stats.aiChats;
    }
    // Fallback a localStorage
    try {
      return parseInt(localStorage.getItem('ai-chats-count')) || 0;
    } catch {
      return 0;
    }
  }

  getAudioTimeMinutes() {
    try {
      return parseInt(localStorage.getItem('audio-time-minutes')) || 0;
    } catch {
      return 0;
    }
  }

  // ==========================================================================
  // MODAL PRINCIPAL
  // ==========================================================================

  show() {
    const existing = document.getElementById('progress-dashboard-modal');
    if (existing) existing.remove();

    const stats = this.getOverallStats();
    const books = this.bookEngine?.getAllBooks() || [];

    const modal = document.createElement('div');
    modal.id = 'progress-dashboard-modal';
    modal.className = 'fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    modal.style.animation = 'fadeIn 0.3s ease-out';

    modal.innerHTML = `
      <div class="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-cyan-500/30">
        <!-- Header -->
        <div class="bg-gradient-to-r from-cyan-900/50 to-purple-900/50 px-6 py-4 border-b border-cyan-500/30 flex items-center justify-between rounded-t-2xl">
          <div class="flex items-center gap-3">
            <span class="text-3xl">📊</span>
            <div>
              <h2 class="text-xl font-bold text-cyan-200">Tu Progreso de Aprendizaje</h2>
              <p class="text-sm text-cyan-400/70">Visualiza tu camino de transformación</p>
            </div>
          </div>
          <button id="close-progress-dashboard" class="text-cyan-300 hover:text-white p-2 hover:bg-cyan-800/50 rounded-lg transition">
            ${Icons.close(20)}
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">

          <!-- Stats Overview - Clickable cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${this.renderStatCard('📚', 'Capítulos Leídos', `${stats.totalChaptersRead}/${stats.totalChapters}`, 'cyan', 'stat-chapters-btn')}
            ${this.renderStatCard('🏆', 'Logros', `${stats.achievementsUnlocked}/${stats.totalAchievements}`, 'yellow', 'stat-achievements-btn')}
            ${this.renderStatCard('⭐', 'Puntos', stats.totalPoints.toString(), 'purple', 'stat-points-btn')}
            ${this.renderStatCard('📝', 'Notas', stats.notesCreated.toString(), 'green', 'stat-notes-btn')}
          </div>

          <!-- Progress Ring -->
          <div class="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-300 dark:border-gray-700/50">
            <h3 class="text-lg font-bold text-cyan-700 dark:text-cyan-300 mb-4 flex items-center gap-2">
              <span>🎯</span> Progreso General
            </h3>
            <div class="flex flex-col md:flex-row items-center gap-6">
              ${this.renderProgressRing(stats)}
              <div class="flex-1 space-y-3">
                ${this.renderProgressMetric('Libros completados', stats.booksCompleted, stats.totalBooks, 'bg-cyan-500')}
                ${this.renderProgressMetric('Reflexiones guardadas', stats.reflectionsSaved, 50, 'bg-purple-500')}
                ${this.renderProgressMetric('Conversaciones IA', stats.aiChatsCount, 100, 'bg-green-500')}
                ${this.renderProgressMetric('Minutos de audio', stats.audioTimeMinutes, 300, 'bg-yellow-500')}
              </div>
            </div>
          </div>

          <!-- Per-Book Progress -->
          <div class="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-300 dark:border-gray-700/50">
            <h3 class="text-lg font-bold text-cyan-700 dark:text-cyan-300 mb-4 flex items-center gap-2">
              <span>📖</span> Progreso por Libro
            </h3>
            <div class="space-y-3">
              ${books.map(book => this.renderBookProgress(book)).join('')}
            </div>
          </div>

          <!-- Recent Achievements -->
          ${this.renderRecentAchievements()}

          <!-- Motivational Section -->
          ${this.renderMotivationalSection(stats)}
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-cyan-500/30 flex justify-between items-center">
          <p class="text-xs text-gray-500">Sigue explorando para desbloquear más logros</p>
          <button id="view-all-achievements" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold transition text-sm">
            Ver todos los logros
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.attachListeners();
  }

  // ==========================================================================
  // COMPONENTES DE RENDER
  // ==========================================================================

  renderStatCard(icon, label, value, color, actionId = null) {
    const colorClasses = {
      cyan: 'from-cyan-900/30 to-cyan-800/20 border-cyan-500/30 hover:border-cyan-400/50',
      yellow: 'from-yellow-900/30 to-yellow-800/20 border-yellow-500/30 hover:border-yellow-400/50',
      purple: 'from-purple-900/30 to-purple-800/20 border-purple-500/30 hover:border-purple-400/50',
      green: 'from-green-900/30 to-green-800/20 border-green-500/30 hover:border-green-400/50'
    };

    const clickableClass = actionId ? 'cursor-pointer hover:scale-105 transition-transform' : '';
    const idAttr = actionId ? `id="${actionId}"` : '';

    return `
      <div ${idAttr} class="bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border text-center ${clickableClass}">
        <div class="text-3xl mb-2">${icon}</div>
        <div class="text-2xl font-bold text-white">${value}</div>
        <div class="text-xs text-gray-400 mt-1">${label}</div>
      </div>
    `;
  }

  renderProgressRing(stats) {
    const percentage = stats.totalChapters > 0
      ? Math.round((stats.totalChaptersRead / stats.totalChapters) * 100)
      : 0;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return `
      <div class="relative w-40 h-40 flex-shrink-0">
        <svg class="w-full h-full transform -rotate-90">
          <circle cx="80" cy="80" r="45" stroke="#374151" stroke-width="10" fill="none"/>
          <circle cx="80" cy="80" r="45"
                  stroke="url(#progressGradient)"
                  stroke-width="10"
                  fill="none"
                  stroke-linecap="round"
                  stroke-dasharray="${circumference}"
                  stroke-dashoffset="${strokeDashoffset}"
                  class="transition-all duration-1000"/>
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#06b6d4"/>
              <stop offset="100%" stop-color="#8b5cf6"/>
            </linearGradient>
          </defs>
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-3xl font-bold text-white">${percentage}%</span>
          <span class="text-xs text-gray-400">completado</span>
        </div>
      </div>
    `;
  }

  renderProgressMetric(label, current, max, colorClass) {
    const percentage = Math.min(100, Math.round((current / max) * 100));
    return `
      <div>
        <div class="flex justify-between text-sm mb-1">
          <span class="text-gray-300">${label}</span>
          <span class="text-gray-400">${current}/${max}</span>
        </div>
        <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div class="${colorClass} h-full rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
  }

  renderBookProgress(book) {
    const stats = this.getBookStats(book.id);
    const isComplete = stats.percentage === 100;
    const readChapters = this.getReadChaptersList(book.id);
    const hasReadChapters = readChapters.length > 0;

    return `
      <div class="book-progress-item bg-white dark:bg-gray-900/50 rounded-lg border border-gray-300 dark:border-gray-700/50 overflow-hidden">
        <div class="flex items-center gap-4 p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/50 transition"
             onclick="this.parentElement.querySelector('.chapters-list')?.classList.toggle('hidden')">
          <div class="text-2xl">${book.emoji || '📖'}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-gray-900 dark:text-gray-200 truncate">${book.shortTitle || book.title}</span>
              ${isComplete ? '<span class="text-green-400 text-sm">✓</span>' : ''}
            </div>
            <div class="flex items-center gap-2 mt-1">
              <div class="flex-1 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-cyan-500'}"
                     style="width: ${stats.percentage}%"></div>
              </div>
              <span class="text-xs text-gray-600 dark:text-gray-400 w-12 text-right">${stats.percentage}%</span>
            </div>
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-500 flex items-center gap-2">
            ${stats.chaptersRead}/${stats.totalChapters}
            ${hasReadChapters ? '<span class="text-cyan-400">▼</span>' : ''}
          </div>
        </div>
        ${hasReadChapters ? `
          <div class="chapters-list hidden border-t border-gray-300 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/30 p-3">
            <p class="text-xs text-cyan-400 mb-2 font-semibold">Capítulos leídos:</p>
            <div class="space-y-1 max-h-40 overflow-y-auto">
              ${readChapters.map(ch => `
                <div class="flex items-center gap-2 text-xs text-gray-300 py-1 px-2 bg-gray-900/50 rounded">
                  <span class="text-green-400">✓</span>
                  <span class="truncate">${ch.title}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  getReadChaptersList(bookId) {
    const progress = this.bookEngine?.readProgress?.[bookId];
    if (!progress || !progress.chaptersRead || progress.chaptersRead.length === 0) {
      return [];
    }

    // Obtener los títulos de los capítulos
    const chapters = [];
    const currentBook = this.bookEngine?.getCurrentBook();

    // Si es el libro actual, podemos obtener los capítulos directamente
    if (currentBook === bookId) {
      const allChapters = this.bookEngine?.getAllChapters() || [];
      progress.chaptersRead.forEach(chapterId => {
        const chapter = allChapters.find(ch => ch.id === chapterId);
        if (chapter) {
          chapters.push({ id: chapterId, title: chapter.title });
        } else {
          chapters.push({ id: chapterId, title: chapterId });
        }
      });
    } else {
      // Para otros libros, solo mostrar los IDs formateados
      progress.chaptersRead.forEach(chapterId => {
        const formattedTitle = this.formatChapterId(chapterId);
        chapters.push({ id: chapterId, title: formattedTitle });
      });
    }

    return chapters;
  }

  formatChapterId(chapterId) {
    // Convertir IDs como "cap1", "prologo", "seccion1" en títulos legibles
    const mappings = {
      'prologo': 'Prólogo',
      'epilogo': 'Epílogo',
      'introduccion': 'Introducción',
      'conclusion': 'Conclusión'
    };

    if (mappings[chapterId]) {
      return mappings[chapterId];
    }

    // Capítulos numerados
    const capMatch = chapterId.match(/cap(\d+)/);
    if (capMatch) {
      return `Capítulo ${capMatch[1]}`;
    }

    // Secciones
    const secMatch = chapterId.match(/seccion(\d+)/);
    if (secMatch) {
      return `Sección ${secMatch[1]}`;
    }

    return chapterId;
  }

  renderRecentAchievements() {
    if (!this.achievementSystem) return '';

    const recent = this.achievementSystem.getRecentAchievements?.() || [];
    if (recent.length === 0) return '';

    return `
      <div class="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-300 dark:border-gray-700/50">
        <h3 class="text-lg font-bold text-yellow-700 dark:text-yellow-300 mb-4 flex items-center gap-2">
          <span>🏆</span> Logros Recientes
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          ${recent.slice(0, 4).map(achievement => `
            <div class="bg-yellow-900/20 rounded-lg p-3 border border-yellow-500/30 text-center">
              <div class="text-3xl mb-2">${achievement.icon}</div>
              <div class="text-sm font-semibold text-yellow-200 truncate">${achievement.titulo}</div>
              <div class="text-xs text-yellow-400/70">+${achievement.points} pts</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderMotivationalSection(stats) {
    let message = '';
    let icon = '';

    if (stats.totalChaptersRead === 0) {
      icon = '🌱';
      message = '¡Comienza tu viaje! Abre cualquier libro para empezar tu transformación.';
    } else if (stats.booksCompleted === stats.totalBooks && stats.totalBooks > 0) {
      icon = '🎉';
      message = '¡Increíble! Has completado toda la colección. Eres un verdadero buscador de conocimiento.';
    } else if (stats.totalChaptersRead >= stats.totalChapters * 0.5) {
      icon = '🚀';
      message = '¡Vas muy bien! Ya has pasado la mitad del camino. Sigue así.';
    } else {
      icon = '💪';
      message = 'Cada capítulo es un paso hacia tu despertar. ¡Continúa explorando!';
    }

    return `
      <div class="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-xl p-6 border border-cyan-500/20 text-center">
        <div class="text-4xl mb-3">${icon}</div>
        <p class="text-gray-200">${message}</p>
      </div>
    `;
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  attachListeners() {
    const modal = document.getElementById('progress-dashboard-modal');
    if (!modal) return;

    // Close button
    document.getElementById('close-progress-dashboard')?.addEventListener('click', () => this.close());

    // Click outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });

    // ESC key
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // View all achievements button
    document.getElementById('view-all-achievements')?.addEventListener('click', () => {
      this.close();
      if (this.achievementSystem) {
        this.achievementSystem.showDashboardModal({ fromProgressDashboard: true });
      }
    });

    // Stat cards - clickable actions
    // Chapters card - scroll to books section
    document.getElementById('stat-chapters-btn')?.addEventListener('click', () => {
      const booksSection = modal.querySelector('.book-progress-item')?.parentElement;
      if (booksSection) {
        booksSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Expand first book with chapters
        const firstExpandable = modal.querySelector('.book-progress-item .chapters-list');
        if (firstExpandable) {
          firstExpandable.classList.remove('hidden');
        }
      }
    });

    // Achievements card - open achievements modal
    document.getElementById('stat-achievements-btn')?.addEventListener('click', () => {
      this.close();
      if (this.achievementSystem) {
        this.achievementSystem.showDashboardModal({ fromProgressDashboard: true });
      }
    });

    // Points card - also open achievements (points are shown there)
    document.getElementById('stat-points-btn')?.addEventListener('click', () => {
      this.close();
      if (this.achievementSystem) {
        this.achievementSystem.showDashboardModal({ fromProgressDashboard: true });
      }
    });

    // Notes card - open notes modal
    document.getElementById('stat-notes-btn')?.addEventListener('click', () => {
      this.close();
      if (window.notesModal) {
        window.notesModal.open();
      }
    });
  }

  close() {
    const modal = document.getElementById('progress-dashboard-modal');
    if (modal) {
      modal.style.animation = 'fadeOut 0.2s ease-out';
      setTimeout(() => modal.remove(), 200);
    }
  }
}

// Exportar
window.ProgressDashboard = ProgressDashboard;
