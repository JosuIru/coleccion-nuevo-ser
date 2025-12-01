// ============================================================================
// ACHIEVEMENTS SYSTEM - Sistema de Logros y Gamificación
// ============================================================================

class AchievementSystem {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.unlockedAchievements = this.loadUnlocked();
    this.stats = this.loadStats();
    this.i18n = window.i18n || { t: (key) => key };
  }

  // ==========================================================================
  // PERSISTENCIA
  // ==========================================================================

  loadUnlocked() {
    try {
      return JSON.parse(localStorage.getItem('achievements-unlocked')) || {};
    } catch {
      return {};
    }
  }

  saveUnlocked() {
    localStorage.setItem('achievements-unlocked', JSON.stringify(this.unlockedAchievements));
  }

  loadStats() {
    try {
      return JSON.parse(localStorage.getItem('achievements-stats')) || this.getDefaultStats();
    } catch {
      return this.getDefaultStats();
    }
  }

  saveStats() {
    localStorage.setItem('achievements-stats', JSON.stringify(this.stats));
  }

  getDefaultStats() {
    return {
      booksOpened: 0,
      uniqueBooksOpened: 0,
      notesCount: 0,
      aiChats: 0,
      reflexionsCount: 0,
      audioUsed: 0,
      totalReadingMinutes: 0,
      timelineViewed: false,
      resourcesViewed: false,
      meditationsCompleted: 0,
      koansGenerated: 0,
      booksOpenedList: [],
      plansCreated: 0,
      plansCompleted: 0
    };
  }

  // ==========================================================================
  // TRACKING DE ESTADÍSTICAS
  // ==========================================================================

  trackBookOpened(bookId) {
    this.stats.booksOpened++;
    if (!this.stats.booksOpenedList.includes(bookId)) {
      this.stats.booksOpenedList.push(bookId);
      this.stats.uniqueBooksOpened = this.stats.booksOpenedList.length;
    }
    this.saveStats();
    this.checkAndUnlock();
  }

  trackNoteCreated() {
    this.stats.notesCount++;
    this.saveStats();
    this.checkAndUnlock();
  }

  trackAIChat() {
    this.stats.aiChats++;
    this.saveStats();
    this.checkAndUnlock();
  }

  trackReflexionSaved() {
    this.stats.reflexionsCount++;
    this.saveStats();
    this.checkAndUnlock();
  }

  trackAudioUsed() {
    if (this.stats.audioUsed === 0) {
      this.stats.audioUsed = 1;
      this.saveStats();
      this.checkAndUnlock();
    }
  }

  trackReadingTime(minutes) {
    this.stats.totalReadingMinutes += minutes;
    this.saveStats();
    this.checkAndUnlock();
  }

  trackTimelineViewed() {
    if (!this.stats.timelineViewed) {
      this.stats.timelineViewed = true;
      this.saveStats();
      this.checkAndUnlock();
    }
  }

  trackResourcesViewed() {
    if (!this.stats.resourcesViewed) {
      this.stats.resourcesViewed = true;
      this.saveStats();
      this.checkAndUnlock();
    }
  }

  trackMeditationCompleted() {
    this.stats.meditationsCompleted++;
    this.saveStats();
    this.checkAndUnlock();
  }

  trackKoanGenerated() {
    this.stats.koansGenerated++;
    this.saveStats();
    this.checkAndUnlock();
  }

  // ==========================================================================
  // VERIFICACIÓN Y DESBLOQUEO
  // ==========================================================================

  checkAndUnlock(bookId = null) {
    const currentBook = bookId || this.bookEngine?.getCurrentBook();
    const achievementsToCheck = [];

    // Siempre verificar logros globales
    if (window.ACHIEVEMENTS?.global) {
      achievementsToCheck.push(...window.ACHIEVEMENTS.global);
    }

    // Verificar logros del libro actual
    if (currentBook && window.ACHIEVEMENTS?.[currentBook]) {
      achievementsToCheck.push(...window.ACHIEVEMENTS[currentBook]);
    }

    // Obtener progreso del libro
    const progress = currentBook ? this.bookEngine?.getBookProgress(currentBook) || {} : {};

    for (const achievement of achievementsToCheck) {
      if (this.unlockedAchievements[achievement.id]) continue;

      let unlocked = false;
      try {
        // Los logros pueden verificar progress o stats según su tipo
        unlocked = achievement.condition(progress, this.stats) ||
                   achievement.condition(this.stats, progress);
      } catch {
        try {
          unlocked = achievement.condition(progress);
        } catch {
          try {
            unlocked = achievement.condition(this.stats);
          } catch {
            unlocked = false;
          }
        }
      }

      if (unlocked) {
        this.unlock(achievement);
      }
    }
  }

  unlock(achievement) {
    this.unlockedAchievements[achievement.id] = {
      unlockedAt: new Date().toISOString(),
      points: achievement.points
    };
    this.saveUnlocked();
    this.showNotification(achievement);
  }

  // ==========================================================================
  // NOTIFICACIÓN
  // ==========================================================================

  showNotification(achievement) {
    // Crear notificación
    const notification = document.createElement('div');
    notification.id = 'achievement-notification';
    notification.className = 'fixed top-4 right-4 z-[100] animate-slide-in-right';
    notification.innerHTML = `
      <div class="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl shadow-2xl p-4 max-w-sm border-2 border-amber-300">
        <div class="flex items-center gap-4">
          <div class="text-4xl">${achievement.icon}</div>
          <div class="flex-1">
            <p class="text-amber-900 text-sm font-semibold uppercase tracking-wide">Logro Desbloqueado</p>
            <h3 class="text-xl font-bold text-amber-950">${achievement.titulo}</h3>
            <p class="text-amber-800 text-sm">${achievement.descripcion}</p>
            <p class="text-amber-900 font-bold mt-1">+${achievement.points} puntos</p>
          </div>
        </div>
      </div>
    `;

    // Añadir estilos de animación si no existen
    if (!document.getElementById('achievement-styles')) {
      const styles = document.createElement('style');
      styles.id = 'achievement-styles';
      styles.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(400px); opacity: 0; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.4s ease-out;
        }
        .animate-slide-out-right {
          animation: slideOutRight 0.3s ease-out forwards;
        }
      `;
      document.head.appendChild(styles);
    }

    // Añadir al DOM
    document.body.appendChild(notification);

    // Reproducir sonido (opcional)
    this.playUnlockSound();

    // Remover después de 5 segundos
    setTimeout(() => {
      notification.classList.remove('animate-slide-in-right');
      notification.classList.add('animate-slide-out-right');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  playUnlockSound() {
    // Crear un pequeño sonido de celebración usando Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (e) {
      // Silenciar errores de audio
    }
  }

  // ==========================================================================
  // DASHBOARD
  // ==========================================================================

  getTotalPoints() {
    return Object.values(this.unlockedAchievements)
      .reduce((sum, a) => sum + (a.points || 0), 0);
  }

  getUnlockedCount() {
    return Object.keys(this.unlockedAchievements).length;
  }

  getTotalCount() {
    let total = 0;
    if (window.ACHIEVEMENTS) {
      for (const category of Object.values(window.ACHIEVEMENTS)) {
        total += category.length;
      }
    }
    return total;
  }

  getTotalAchievementsCount() {
    return this.getTotalCount();
  }

  getRecentAchievements() {
    // Obtener logros desbloqueados con datos completos, ordenados por fecha
    const unlocked = [];

    for (const [id, data] of Object.entries(this.unlockedAchievements)) {
      // Buscar el logro en todas las categorías
      let achievement = null;
      if (window.ACHIEVEMENTS) {
        for (const category of Object.values(window.ACHIEVEMENTS)) {
          achievement = category.find(a => a.id === id);
          if (achievement) break;
        }
      }

      if (achievement) {
        unlocked.push({
          ...achievement,
          unlockedAt: data.unlockedAt
        });
      }
    }

    // Ordenar por fecha (más recientes primero)
    return unlocked.sort((a, b) =>
      new Date(b.unlockedAt) - new Date(a.unlockedAt)
    );
  }

  renderDashboard(bookId = null) {
    const totalPoints = this.getTotalPoints();
    const unlockedCount = this.getUnlockedCount();
    const totalCount = this.getTotalCount();

    // Obtener logros a mostrar
    let achievementsToShow = [];

    // Globales
    if (window.ACHIEVEMENTS?.global) {
      achievementsToShow.push(...window.ACHIEVEMENTS.global.map(a => ({ ...a, category: 'Global' })));
    }

    // Del libro actual
    if (bookId && window.ACHIEVEMENTS?.[bookId]) {
      const bookData = this.bookEngine?.getCurrentBookData();
      const bookTitle = bookData?.title || bookId;
      achievementsToShow.push(...window.ACHIEVEMENTS[bookId].map(a => ({ ...a, category: bookTitle })));
    }

    return `
      <div class="achievements-dashboard">
        <!-- Stats Header -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="bg-amber-900/30 rounded-xl p-4 text-center border border-amber-500/30">
            <p class="text-3xl font-bold text-amber-400">${totalPoints}</p>
            <p class="text-sm text-amber-200">Puntos</p>
          </div>
          <div class="bg-purple-900/30 rounded-xl p-4 text-center border border-purple-500/30">
            <p class="text-3xl font-bold text-purple-400">${unlockedCount}</p>
            <p class="text-sm text-purple-200">Logros</p>
          </div>
          <div class="bg-cyan-900/30 rounded-xl p-4 text-center border border-cyan-500/30">
            <p class="text-3xl font-bold text-cyan-400">${Math.round((unlockedCount / totalCount) * 100)}%</p>
            <p class="text-sm text-cyan-200">Completado</p>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mb-6">
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-400">Progreso general</span>
            <span class="text-gray-400">${unlockedCount}/${totalCount}</span>
          </div>
          <div class="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-500"
                 style="width: ${(unlockedCount / totalCount) * 100}%"></div>
          </div>
        </div>

        <!-- Achievements Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          ${achievementsToShow.map(achievement => {
            const isUnlocked = this.unlockedAchievements[achievement.id];
            return `
              <div class="achievement-card relative p-4 rounded-xl border-2 transition-all ${
                isUnlocked
                  ? 'bg-amber-900/20 border-amber-500/50 scale-100'
                  : 'bg-gray-800/50 border-gray-700/50 opacity-60 grayscale'
              }">
                <div class="text-center">
                  <span class="text-3xl mb-2 block">${achievement.icon}</span>
                  <h4 class="font-bold text-sm ${isUnlocked ? 'text-amber-200' : 'text-gray-400'}">${achievement.titulo}</h4>
                  <p class="text-xs ${isUnlocked ? 'text-amber-100/70' : 'text-gray-500'} mt-1">${achievement.descripcion}</p>
                  <p class="text-xs mt-2 ${isUnlocked ? 'text-amber-400' : 'text-gray-600'}">+${achievement.points} pts</p>
                </div>
                ${isUnlocked ? `
                  <div class="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                    <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <button class="share-achievement-btn absolute -bottom-1 -right-1 bg-blue-500 hover:bg-blue-400 rounded-full p-1 transition"
                          data-achievement-id="${achievement.id}" title="Compartir logro">
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                    </svg>
                  </button>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // MODAL DE LOGROS
  // ==========================================================================

  showDashboardModal() {
    const bookId = this.bookEngine?.getCurrentBook();

    // Eliminar modal existente
    const existing = document.getElementById('achievements-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'achievements-modal';
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    modal.style.animation = 'fadeIn 0.3s ease-out';

    modal.innerHTML = `
      <div class="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-amber-500/30">
        <!-- Header -->
        <div class="bg-gradient-to-r from-amber-900/50 to-yellow-900/50 px-6 py-4 border-b border-amber-500/30 flex items-center justify-between rounded-t-2xl">
          <div class="flex items-center gap-3">
            <span class="text-3xl">🏆</span>
            <h2 class="text-xl font-bold text-amber-200">Mis Logros</h2>
          </div>
          <button id="close-achievements-modal" class="text-amber-300 hover:text-white p-2 hover:bg-amber-800/50 rounded-lg transition">
            ${Icons.close(20)}
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          ${this.renderDashboard(bookId)}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('close-achievements-modal')?.addEventListener('click', () => {
      modal.style.animation = 'fadeOut 0.2s ease-out';
      setTimeout(() => modal.remove(), 200);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(() => modal.remove(), 200);
      }
    });

    // Share achievement buttons
    modal.querySelectorAll('.share-achievement-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const achievementId = btn.getAttribute('data-achievement-id');
        this.shareAchievement(achievementId);
      });
    });
  }

  shareAchievement(achievementId) {
    // Find the achievement
    let achievement = null;
    if (window.ACHIEVEMENTS) {
      for (const category of Object.values(window.ACHIEVEMENTS)) {
        achievement = category.find(a => a.id === achievementId);
        if (achievement) break;
      }
    }

    if (achievement && window.shareHelper) {
      window.shareHelper.shareAchievement(achievement);
    }
  }
}

// Exportar
window.AchievementSystem = AchievementSystem;
