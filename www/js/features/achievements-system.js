// ============================================================================
// ACHIEVEMENTS SYSTEM - Sistema de Logros y Gamificación
// ============================================================================

class AchievementSystem {
  constructor(bookEngine) {
    this.bookEngine = bookEngine;
    this.unlockedAchievements = this.loadUnlocked();
    this.stats = this.loadStats();
    this.i18n = window.i18n || { t: (key) => key };

    // MEMORY LEAK FIX #61: Reutilizar AudioContext
    this.audioContext = null;

    // 🔧 FIX #60: Trackear timeouts de notificaciones para prevenir memory leaks
    this.notificationTimeouts = new Set();

    // 🔧 FIX #62: Caché para getTotalCount() (evita iteración en cada llamada)
    this._totalCountCache = null;

    // 🔧 OPTIMIZACIÓN: Cachear window.ACHIEVEMENTS para reducir accesos a window
    this.achievements = window.ACHIEVEMENTS || {};

    // 🔧 FIX #58: Indexar logros por tipo de acción para evaluación eficiente
    this.achievementIndex = this.buildAchievementIndex();
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

    // Sincronizar con Supabase si está logeado
    if (window.authHelper && window.authHelper.user) {
      try {
        window.supabaseSyncHelper?.syncPreference('achievements-unlocked', this.unlockedAchievements);
      } catch (error) {
        console.warn('[Achievements] No se pudo sincronizar achievements con Supabase:', error);
      }
    }
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

    // Sincronizar con Supabase si está logeado
    if (window.authHelper && window.authHelper.user) {
      try {
        window.supabaseSyncHelper?.syncPreference('achievements-stats', this.stats);
      } catch (error) {
        console.warn('[Achievements] No se pudo sincronizar stats con Supabase:', error);
      }
    }
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
  // 🔧 FIX #58: INDEXACIÓN DE LOGROS PARA EVALUACIÓN EFICIENTE
  // ==========================================================================

  /**
   * Construye un índice de logros por tipo de acción
   * Esto permite evaluar solo los logros relevantes en checkAndUnlock()
   */
  buildAchievementIndex() {
    const actionTypeIndex = new Map();

    // Iterar sobre todas las categorías de logros
    if (this.achievements) {
      Object.values(this.achievements).forEach(categoryAchievements => {
        if (!Array.isArray(categoryAchievements)) return;

        categoryAchievements.forEach(achievement => {
          // Extraer tipo(s) de acción que este logro puede desbloquear
          const actionTypes = this.extractActionTypes(achievement);

          actionTypes.forEach(actionType => {
            if (!actionTypeIndex.has(actionType)) {
              actionTypeIndex.set(actionType, []);
            }
            actionTypeIndex.get(actionType).push(achievement);
          });
        });
      });
    }

    return actionTypeIndex;
  }

  /**
   * Extrae los tipos de acción relevantes de la condición de un logro
   * Analiza el código de la función condition para determinar qué stats o progress verifica
   */
  extractActionTypes(achievement) {
    const actionTypes = [];

    if (!achievement.condition) return ['generic'];

    // Convertir la función a string para analizar qué propiedades verifica
    const conditionString = achievement.condition.toString();

    // Mapeo de propiedades stats a tipos de acción
    const statsMapping = {
      'booksOpened': 'bookOpened',
      'uniqueBooksOpened': 'bookOpened',
      'booksOpenedList': 'bookOpened',
      'notesCount': 'noteCreated',
      'aiChats': 'aiChat',
      'reflexionsCount': 'reflexionSaved',
      'audioUsed': 'audioUsed',
      'totalReadingMinutes': 'readingTime',
      'timelineViewed': 'timelineViewed',
      'resourcesViewed': 'resourcesViewed',
      'meditationsCompleted': 'meditationCompleted',
      'koansGenerated': 'koanGenerated',
      'plansCreated': 'planCreated',
      'plansCompleted': 'planCompleted'
    };

    // Detectar qué propiedades de stats se verifican
    for (const [statsProp, actionType] of Object.entries(statsMapping)) {
      if (conditionString.includes(statsProp)) {
        actionTypes.push(actionType);
      }
    }

    // Detectar verificaciones de progress (capítulos leídos, etc.)
    if (conditionString.includes('chaptersRead') ||
        conditionString.includes('progress') ||
        conditionString.includes('chapter')) {
      actionTypes.push('bookOpened'); // Los logros de progress se verifican al abrir libros
    }

    // Si no se detectó ningún tipo específico, clasificar como genérico
    if (actionTypes.length === 0) {
      actionTypes.push('generic');
    }

    return actionTypes;
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
    // 🔧 FIX #58: Pasar tipo de acción para evaluación eficiente
    this.checkAndUnlock('bookOpened', bookId);
  }

  trackNoteCreated() {
    this.stats.notesCount++;
    this.saveStats();
    // 🔧 FIX #58: Pasar tipo de acción para evaluación eficiente
    this.checkAndUnlock('noteCreated');
  }

  trackAIChat() {
    this.stats.aiChats++;
    this.saveStats();
    // 🔧 FIX #58: Pasar tipo de acción para evaluación eficiente
    this.checkAndUnlock('aiChat');
  }

  trackReflexionSaved() {
    this.stats.reflexionsCount++;
    this.saveStats();
    // 🔧 FIX #58: Pasar tipo de acción para evaluación eficiente
    this.checkAndUnlock('reflexionSaved');
  }

  trackAudioUsed() {
    if (this.stats.audioUsed === 0) {
      this.stats.audioUsed = 1;
      this.saveStats();
      // 🔧 FIX #58: Pasar tipo de acción para evaluación eficiente
      this.checkAndUnlock('audioUsed');
    }
  }

  trackReadingTime(minutes) {
    this.stats.totalReadingMinutes += minutes;
    this.saveStats();
    // 🔧 FIX #58: Pasar tipo de acción para evaluación eficiente
    this.checkAndUnlock('readingTime');
  }

  trackTimelineViewed() {
    if (!this.stats.timelineViewed) {
      this.stats.timelineViewed = true;
      this.saveStats();
      // 🔧 FIX #58: Pasar tipo de acción para evaluación eficiente
      this.checkAndUnlock('timelineViewed');
    }
  }

  trackResourcesViewed() {
    if (!this.stats.resourcesViewed) {
      this.stats.resourcesViewed = true;
      this.saveStats();
      // 🔧 FIX #58: Pasar tipo de acción para evaluación eficiente
      this.checkAndUnlock('resourcesViewed');
    }
  }

  trackMeditationCompleted() {
    this.stats.meditationsCompleted++;
    this.saveStats();
    // 🔧 FIX #58: Pasar tipo de acción para evaluación eficiente
    this.checkAndUnlock('meditationCompleted');
  }

  trackKoanGenerated() {
    this.stats.koansGenerated++;
    this.saveStats();
    // 🔧 FIX #58: Pasar tipo de acción para evaluación eficiente
    this.checkAndUnlock('koanGenerated');
  }

  // ==========================================================================
  // VERIFICACIÓN Y DESBLOQUEO
  // ==========================================================================

  /**
   * 🔧 FIX #58: Verifica y desbloquea logros solo evaluando los relevantes al tipo de acción
   * @param {string} actionType - Tipo de acción que desencadenó la verificación
   * @param {string} bookId - ID del libro actual (opcional)
   */
  checkAndUnlock(actionType = 'generic', bookId = null) {
    const currentBook = bookId || this.bookEngine?.getCurrentBook();

    // 🔧 FIX #58: Solo obtener logros relevantes al tipo de acción
    const relevantAchievements = this.achievementIndex.get(actionType) || [];

    // Obtener progreso del libro
    const progress = currentBook ? this.bookEngine?.getBookProgress(currentBook) || {} : {};

    // 🔧 FIX #58: Evaluar solo los logros relevantes en lugar de TODOS los logros
    for (const achievement of relevantAchievements) {
      // Saltar logros ya desbloqueados
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
    // Verificar si el usuario quiere ver notificaciones de logros
    const showAchievementNotifications = localStorage.getItem('show-achievement-notifications');
    if (showAchievementNotifications === 'false') {
      // Usuario desactivó notificaciones, solo guardar silenciosamente
      console.log('[Achievements] Logro desbloqueado (notificación desactivada):', achievement.titulo);
      return;
    }

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

    // 🔧 FIX #60: Trackear timeout para poder limpiarlo después y prevenir acumulación
    const timeout1 = setTimeout(() => {
      notification.classList.remove('animate-slide-in-right');
      notification.classList.add('animate-slide-out-right');

      const timeout2 = setTimeout(() => {
        notification.remove();
        this.notificationTimeouts.delete(timeout2);
      }, 300);

      this.notificationTimeouts.add(timeout2);
      this.notificationTimeouts.delete(timeout1);
    }, 5000);

    this.notificationTimeouts.add(timeout1);
  }

  // FIX #61: Reutilizar AudioContext en lugar de crear uno nuevo cada vez
  getAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('[Achievements] AudioContext not supported');
        return null;
      }
    }
    return this.audioContext;
  }

  playUnlockSound() {
    // Crear un pequeño sonido de celebración usando Web Audio API
    try {
      const audioContext = this.getAudioContext();
      if (!audioContext) return;

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
      console.warn('[Achievements] Error playing sound:', e);
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
    // 🔧 FIX #62: Usar caché para evitar iteración en cada llamada
    if (this._totalCountCache !== null) {
      return this._totalCountCache;
    }

    let total = 0;
    if (this.achievements) {
      for (const category of Object.values(this.achievements)) {
        total += category.length;
      }
    }

    // 🔧 FIX #62: Guardar en caché
    this._totalCountCache = total;
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
      if (this.achievements) {
        for (const category of Object.values(this.achievements)) {
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
    if (this.achievements?.global) {
      achievementsToShow.push(...this.achievements.global.map(a => ({ ...a, category: 'Global' })));
    }

    // Del libro actual
    if (bookId && this.achievements?.[bookId]) {
      const bookData = this.bookEngine?.getCurrentBookData();
      const bookTitle = bookData?.title || bookId;
      achievementsToShow.push(...this.achievements[bookId].map(a => ({ ...a, category: bookTitle })));
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
                  : 'bg-gray-200 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700/50 opacity-60 grayscale'
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

  showDashboardModal(options = {}) {
    const { fromProgressDashboard = false } = options;
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
            ${fromProgressDashboard ? `
              <button id="back-to-progress" class="text-amber-300 hover:text-white p-2 hover:bg-amber-800/50 rounded-lg transition mr-2" title="Volver a Progreso">
                ${Icons.back(20)}
              </button>
            ` : ''}
            <span class="text-3xl">🏆</span>
            <h2 class="text-xl font-bold text-amber-200">Mis Logros</h2>
          </div>
          <button id="close-achievements-modal"
                  class="text-amber-300 hover:text-white p-3 hover:bg-amber-800/50 rounded-lg transition"
                  aria-label="Cerrar logros"
                  title="Cerrar">
            ${Icons.close(20)}
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          ${this.renderDashboard(bookId)}
        </div>

        ${fromProgressDashboard ? `
        <!-- Footer with back button -->
        <div class="px-6 py-4 border-t border-amber-500/30 flex justify-between items-center">
          <button id="back-to-progress-footer" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold transition text-sm flex items-center gap-2">
            ${Icons.back(16)} Volver a Mi Progreso
          </button>
          <p class="text-xs text-gray-500">Sigue explorando para desbloquear más</p>
        </div>
        ` : ''}
      </div>
    `;

    document.body.appendChild(modal);

    // 🔧 FIX #63: Añadir escape handler para cerrar modal
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        modal.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(() => {
          modal.remove();
          document.removeEventListener('keydown', escapeHandler);
        }, 200);
      }
    };
    document.addEventListener('keydown', escapeHandler);

    // Event listeners
    document.getElementById('close-achievements-modal')?.addEventListener('click', () => {
      modal.style.animation = 'fadeOut 0.2s ease-out';
      setTimeout(() => {
        modal.remove();
        document.removeEventListener('keydown', escapeHandler);
      }, 200);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(() => {
          modal.remove();
          document.removeEventListener('keydown', escapeHandler);
        }, 200);
      }
    });

    // Back to progress dashboard buttons
    const backToProgress = () => {
      modal.style.animation = 'fadeOut 0.2s ease-out';
      setTimeout(() => {
        modal.remove();
        if (window.progressDashboard) {
          window.progressDashboard.show();
        }
      }, 200);
    };

    document.getElementById('back-to-progress')?.addEventListener('click', backToProgress);
    document.getElementById('back-to-progress-footer')?.addEventListener('click', backToProgress);

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
    if (this.achievements) {
      for (const category of Object.values(this.achievements)) {
        achievement = category.find(a => a.id === achievementId);
        if (achievement) break;
      }
    }

    if (achievement && window.shareHelper) {
      window.shareHelper.shareAchievement(achievement);
    }
  }

  // ==========================================================================
  // CLEANUP - 🔧 FIX #60, #61
  // ==========================================================================

  /**
   * Limpia recursos para prevenir memory leaks
   * Debe llamarse cuando se destruye el componente
   */
  cleanup() {
    console.log('[Achievements] Cleanup iniciado');

    // 🔧 FIX #60: Limpiar timeouts de notificaciones pendientes
    this.notificationTimeouts.forEach(timeout => clearTimeout(timeout));
    this.notificationTimeouts.clear();
    console.log('[Achievements] Timeouts de notificaciones limpiados');

    // Cerrar AudioContext (#61)
    if (this.audioContext) {
      this.audioContext.close().then(() => {
        console.log('[Achievements] AudioContext cerrado');
      }).catch(err => {
        console.warn('[Achievements] Error al cerrar AudioContext:', err);
      });
      this.audioContext = null;
    }

    console.log('[Achievements] Cleanup completado');
  }
}

// Exportar
window.AchievementSystem = AchievementSystem;
