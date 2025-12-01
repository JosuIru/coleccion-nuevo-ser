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
    const books = this.bookEngine?.getBooks() || [];
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
      const unlockedAchievements = this.achievementSystem.unlockedAchievements || [];
      stats.achievementsUnlocked = unlockedAchievements.length;
      stats.totalAchievements = this.achievementSystem.getTotalAchievementsCount?.() || 0;
      stats.totalPoints = this.achievementSystem.getTotalPoints?.() || 0;
    }

    return stats;
  }

  getBookStats(bookId) {
    const progress = this.bookEngine?.getBookProgress(bookId) || { read: 0, total: 0 };
    return {
      chaptersRead: progress.read,
      totalChapters: progress.total,
      percentage: progress.total > 0 ? Math.round((progress.read / progress.total) * 100) : 0
    };
  }

  getNotesCount() {
    try {
      const notes = JSON.parse(localStorage.getItem('user-notes')) || {};
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
    const books = this.bookEngine?.getBooks() || [];

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

          <!-- Stats Overview -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${this.renderStatCard('📚', 'Capítulos Leídos', `${stats.totalChaptersRead}/${stats.totalChapters}`, 'cyan')}
            ${this.renderStatCard('🏆', 'Logros', `${stats.achievementsUnlocked}/${stats.totalAchievements}`, 'yellow')}
            ${this.renderStatCard('⭐', 'Puntos', stats.totalPoints.toString(), 'purple')}
            ${this.renderStatCard('📝', 'Notas', stats.notesCreated.toString(), 'green')}
          </div>

          <!-- Progress Ring -->
          <div class="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <h3 class="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
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
          <div class="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <h3 class="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
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

  renderStatCard(icon, label, value, color) {
    const colorClasses = {
      cyan: 'from-cyan-900/30 to-cyan-800/20 border-cyan-500/30',
      yellow: 'from-yellow-900/30 to-yellow-800/20 border-yellow-500/30',
      purple: 'from-purple-900/30 to-purple-800/20 border-purple-500/30',
      green: 'from-green-900/30 to-green-800/20 border-green-500/30'
    };

    return `
      <div class="bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border text-center">
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

    return `
      <div class="flex items-center gap-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
        <div class="text-2xl">${book.emoji || '📖'}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-gray-200 truncate">${book.shortTitle || book.title}</span>
            ${isComplete ? '<span class="text-green-400 text-sm">✓</span>' : ''}
          </div>
          <div class="flex items-center gap-2 mt-1">
            <div class="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-cyan-500'}"
                   style="width: ${stats.percentage}%"></div>
            </div>
            <span class="text-xs text-gray-400 w-12 text-right">${stats.percentage}%</span>
          </div>
        </div>
        <div class="text-xs text-gray-500">
          ${stats.chaptersRead}/${stats.totalChapters}
        </div>
      </div>
    `;
  }

  renderRecentAchievements() {
    if (!this.achievementSystem) return '';

    const recent = this.achievementSystem.getRecentAchievements?.() || [];
    if (recent.length === 0) return '';

    return `
      <div class="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
        <h3 class="text-lg font-bold text-yellow-300 mb-4 flex items-center gap-2">
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
        this.achievementSystem.showDashboardModal();
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
