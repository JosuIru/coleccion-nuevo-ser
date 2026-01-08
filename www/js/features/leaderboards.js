// ============================================================================
// LEADERBOARDS - Tablas de Clasificación Pública
// ============================================================================
// v2.9.328: Sistema de rankings de la comunidad lectora
// Muestra clasificaciones por progreso, rachas, logros y participación

class Leaderboards {
  constructor() {
    this.modalElement = null;
    this.currentCategory = 'progress';
    this.cachedLeaderboards = null;
    this.cacheExpiry = null;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

    // Categorías de leaderboard
    this.categories = {
      progress: {
        id: 'progress',
        name: 'Progreso de Lectura',
        icon: '📚',
        description: 'Usuarios con más libros y capítulos leídos',
        metric: 'chaptersRead',
        metricLabel: 'capítulos'
      },
      streak: {
        id: 'streak',
        name: 'Racha de Lectura',
        icon: '🔥',
        description: 'Días consecutivos leyendo',
        metric: 'currentStreak',
        metricLabel: 'días'
      },
      achievements: {
        id: 'achievements',
        name: 'Coleccionistas',
        icon: '🏆',
        description: 'Usuarios con más logros desbloqueados',
        metric: 'achievementsCount',
        metricLabel: 'logros'
      },
      community: {
        id: 'community',
        name: 'Participación',
        icon: '💬',
        description: 'Más activos en la comunidad',
        metric: 'communityScore',
        metricLabel: 'puntos'
      }
    };
  }

  // ==========================================================================
  // OBTENCIÓN DE DATOS
  // ==========================================================================

  /**
   * Obtiene los datos del leaderboard
   */
  async getLeaderboard(category = 'progress') {
    // Verificar cache
    if (this.cachedLeaderboards && this.cacheExpiry > Date.now()) {
      return this.cachedLeaderboards[category] || [];
    }

    // Intentar obtener de Supabase
    if (this.isSupabaseAvailable()) {
      try {
        const data = await this.fetchFromCloud();
        this.cachedLeaderboards = data;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        return data[category] || [];
      } catch (error) {
        logger.warn('[Leaderboards] Error fetching from cloud:', error);
      }
    }

    // Fallback: generar datos locales/demo
    return this.generateLocalLeaderboard(category);
  }

  /**
   * Obtiene todos los leaderboards de Supabase
   */
  async fetchFromCloud() {
    const leaderboards = {
      progress: [],
      streak: [],
      achievements: [],
      community: []
    };

    try {
      // Obtener datos de perfiles con estadísticas
      const { data: profiles, error } = await window.supabaseSyncHelper.supabase
        .from('profiles')
        .select('id, display_name, avatar_url, reading_stats, achievements, streak_data')
        .order('reading_stats->total_chapters_read', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (profiles && profiles.length > 0) {
        // Procesar para cada categoría
        leaderboards.progress = profiles
          .map(p => ({
            id: p.id,
            name: p.display_name || 'Lector Anónimo',
            avatar: p.avatar_url,
            value: p.reading_stats?.total_chapters_read || 0,
            secondaryValue: p.reading_stats?.books_completed || 0,
            secondaryLabel: 'libros'
          }))
          .filter(p => p.value > 0)
          .sort((a, b) => b.value - a.value)
          .slice(0, 20);

        leaderboards.streak = profiles
          .map(p => ({
            id: p.id,
            name: p.display_name || 'Lector Anónimo',
            avatar: p.avatar_url,
            value: p.streak_data?.current_streak || 0,
            secondaryValue: p.streak_data?.longest_streak || 0,
            secondaryLabel: 'mejor racha'
          }))
          .filter(p => p.value > 0)
          .sort((a, b) => b.value - a.value)
          .slice(0, 20);

        leaderboards.achievements = profiles
          .map(p => ({
            id: p.id,
            name: p.display_name || 'Lector Anónimo',
            avatar: p.avatar_url,
            value: Array.isArray(p.achievements) ? p.achievements.length : 0,
            secondaryValue: null
          }))
          .filter(p => p.value > 0)
          .sort((a, b) => b.value - a.value)
          .slice(0, 20);

        // Community score basado en actividad
        leaderboards.community = profiles
          .map(p => ({
            id: p.id,
            name: p.display_name || 'Lector Anónimo',
            avatar: p.avatar_url,
            value: this.calculateCommunityScore(p),
            secondaryValue: null
          }))
          .filter(p => p.value > 0)
          .sort((a, b) => b.value - a.value)
          .slice(0, 20);
      }
    } catch (error) {
      logger.error('[Leaderboards] Error processing cloud data:', error);
    }

    return leaderboards;
  }

  calculateCommunityScore(profile) {
    let score = 0;
    score += (profile.reading_stats?.total_chapters_read || 0) * 1;
    score += (profile.streak_data?.current_streak || 0) * 5;
    score += (Array.isArray(profile.achievements) ? profile.achievements.length : 0) * 10;
    return score;
  }

  /**
   * Genera un leaderboard local/demo
   */
  generateLocalLeaderboard(category) {
    const myStats = this.getMyStats();
    const leaderboard = [];

    // Añadir al usuario actual
    if (myStats.value > 0) {
      leaderboard.push({
        id: this.getUserId(),
        name: this.getUserName(),
        avatar: null,
        value: myStats[category]?.value || 0,
        secondaryValue: myStats[category]?.secondary || null,
        secondaryLabel: myStats[category]?.secondaryLabel || null,
        isCurrentUser: true
      });
    }

    // Generar usuarios demo para dar contexto
    const demoUsers = this.generateDemoUsers(category, myStats[category]?.value || 0);
    leaderboard.push(...demoUsers);

    // Ordenar y limitar
    return leaderboard
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);
  }

  generateDemoUsers(category, userValue) {
    const names = [
      'Luna Lectora', 'Marco Místico', 'Elena Exploradora', 'Carlos Consciente',
      'Sofia Sabia', 'Pablo Pensador', 'Ana Aurora', 'Diego Despertar',
      'María Meditadora', 'Luis Luminoso', 'Carmen Cósmica', 'Javier Jardín'
    ];

    const demoUsers = [];
    const baseValue = Math.max(userValue, 10);

    for (let i = 0; i < 8; i++) {
      const variance = Math.random() * 0.5 + 0.5; // 0.5 - 1.0
      const value = Math.floor(baseValue * variance * (1 + (8 - i) * 0.15));

      demoUsers.push({
        id: `demo-${i}`,
        name: names[i % names.length],
        avatar: null,
        value: value,
        secondaryValue: category === 'progress' ? Math.floor(value / 15) : null,
        secondaryLabel: category === 'progress' ? 'libros' : null,
        isDemo: true
      });
    }

    return demoUsers;
  }

  /**
   * Obtiene las estadísticas del usuario actual
   */
  getMyStats() {
    const stats = {
      progress: { value: 0, secondary: 0, secondaryLabel: 'libros' },
      streak: { value: 0, secondary: 0, secondaryLabel: 'mejor racha' },
      achievements: { value: 0, secondary: null },
      community: { value: 0, secondary: null }
    };

    // Progreso de lectura
    if (window.bookEngine) {
      const allBooks = window.bookEngine.getAllBooks();
      let totalChapters = 0;
      let completedBooks = 0;

      allBooks.forEach(book => {
        const progress = window.bookEngine.getProgress(book.id);
        totalChapters += progress?.chaptersRead || 0;
        if (progress?.percentage >= 100) completedBooks++;
      });

      stats.progress.value = totalChapters;
      stats.progress.secondary = completedBooks;
    }

    // Racha
    if (window.streakSystem) {
      const streakData = window.streakSystem.getStreak();
      stats.streak.value = streakData?.currentStreak || 0;
      stats.streak.secondary = streakData?.longestStreak || 0;
    }

    // Logros
    if (window.achievementSystem) {
      const achievements = window.achievementSystem.getUnlockedAchievements?.() || [];
      stats.achievements.value = achievements.length;
    }

    // Community score
    stats.community.value = stats.progress.value + (stats.streak.value * 5) + (stats.achievements.value * 10);

    return stats;
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  isSupabaseAvailable() {
    return !!(window.supabaseConfig?.url &&
              window.supabaseSyncHelper?.supabase &&
              window.authHelper?.user);
  }

  getUserId() {
    return window.authHelper?.user?.id || 'local-user';
  }

  getUserName() {
    if (window.authHelper?.user?.user_metadata?.name) {
      return window.authHelper.user.user_metadata.name;
    }
    if (window.authHelper?.user?.email) {
      return window.authHelper.user.email.split('@')[0];
    }
    return localStorage.getItem('user-display-name') || 'Tú';
  }

  getMyRank(leaderboard) {
    const myId = this.getUserId();
    const index = leaderboard.findIndex(u => u.id === myId || u.isCurrentUser);
    return index >= 0 ? index + 1 : null;
  }

  // ==========================================================================
  // UI - MODAL
  // ==========================================================================

  async show(category = 'progress') {
    this.close();
    this.currentCategory = category;

    const leaderboard = await this.getLeaderboard(category);
    const categoryInfo = this.categories[category];
    const myRank = this.getMyRank(leaderboard);

    const modal = document.createElement('div');
    modal.id = 'leaderboards-modal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="window.leaderboards?.close()"></div>
      <div class="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-amber-500/30">
        <!-- Header -->
        <div class="p-4 border-b border-gray-700 bg-gradient-to-r from-amber-900/30 to-orange-900/30">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-white flex items-center gap-2">
                <span class="text-2xl">🏅</span> Clasificación
              </h2>
              <p class="text-xs text-amber-300/70 mt-0.5">Compite con la comunidad lectora</p>
            </div>
            <button onclick="window.leaderboards?.close()"
                    class="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- My Rank Banner -->
          ${myRank ? `
            <div class="mt-3 bg-amber-500/20 rounded-xl p-3 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg">
                  #${myRank}
                </div>
                <div>
                  <p class="text-white font-medium">Tu posición</p>
                  <p class="text-xs text-amber-300/70">${categoryInfo.name}</p>
                </div>
              </div>
              <button onclick="window.leaderboards?.shareRank(${myRank}, '${category}')"
                      class="px-3 py-1.5 bg-amber-500/30 hover:bg-amber-500/50 text-amber-300 rounded-lg text-sm transition-colors">
                Compartir
              </button>
            </div>
          ` : ''}
        </div>

        <!-- Category Tabs -->
        <div class="flex overflow-x-auto border-b border-gray-700 bg-slate-800/50 px-2">
          ${Object.values(this.categories).map(cat => `
            <button onclick="window.leaderboards?.switchCategory('${cat.id}')"
                    class="flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap
                           ${cat.id === category
                             ? 'text-amber-400 border-b-2 border-amber-400'
                             : 'text-gray-400 hover:text-white border-b-2 border-transparent'}">
              <span class="mr-1.5">${cat.icon}</span>${cat.name}
            </button>
          `).join('')}
        </div>

        <!-- Leaderboard List -->
        <div id="leaderboard-content" class="flex-1 overflow-y-auto p-4">
          ${this.renderLeaderboard(leaderboard, category)}
        </div>

        <!-- Footer -->
        <div class="p-3 border-t border-gray-700 text-center">
          <p class="text-xs text-gray-500">
            ${this.isSupabaseAvailable()
              ? '🌐 Ranking global en tiempo real'
              : '📱 Inicia sesión para ver el ranking global'}
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalElement = modal;

    // Escape to close
    this._escapeHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this._escapeHandler);
  }

  renderLeaderboard(leaderboard, category) {
    const categoryInfo = this.categories[category];

    if (leaderboard.length === 0) {
      return `
        <div class="text-center py-12 text-gray-500">
          <div class="text-5xl mb-4">${categoryInfo.icon}</div>
          <p class="text-lg mb-2">Sin datos aún</p>
          <p class="text-sm">Sigue leyendo para aparecer en el ranking</p>
        </div>
      `;
    }

    return `
      <div class="space-y-2">
        ${leaderboard.map((user, index) => this.renderUserRow(user, index, categoryInfo)).join('')}
      </div>
    `;
  }

  renderUserRow(user, index, categoryInfo) {
    const rank = index + 1;
    const isTopThree = rank <= 3;
    const isCurrentUser = user.isCurrentUser || user.id === this.getUserId();

    // Medallas para top 3
    const medals = ['🥇', '🥈', '🥉'];
    const rankDisplay = isTopThree ? medals[rank - 1] : `#${rank}`;

    // Colores según posición
    const bgColors = {
      1: 'from-amber-900/40 to-yellow-900/40 border-amber-500/50',
      2: 'from-gray-700/40 to-slate-700/40 border-gray-400/50',
      3: 'from-orange-900/40 to-amber-900/40 border-orange-500/50'
    };

    const bgClass = isTopThree
      ? `bg-gradient-to-r ${bgColors[rank]}`
      : isCurrentUser
        ? 'bg-cyan-900/30 border-cyan-500/50'
        : 'bg-slate-800/30 border-gray-700/50';

    return `
      <div class="flex items-center gap-3 p-3 rounded-xl border ${bgClass} ${isCurrentUser ? 'ring-1 ring-cyan-400/50' : ''}">
        <!-- Rank -->
        <div class="w-10 h-10 flex items-center justify-center ${isTopThree ? 'text-2xl' : 'text-lg font-bold text-gray-400'}">
          ${rankDisplay}
        </div>

        <!-- Avatar -->
        <div class="w-10 h-10 rounded-full ${this.getAvatarGradient(rank)} flex items-center justify-center text-white font-bold text-sm shadow-lg">
          ${user.avatar
            ? `<img src="${user.avatar}" class="w-full h-full rounded-full object-cover" alt="">`
            : user.name.charAt(0).toUpperCase()}
        </div>

        <!-- Name & Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-medium text-white truncate">${this.escapeHtml(user.name)}</span>
            ${isCurrentUser ? '<span class="text-xs text-cyan-400">(tú)</span>' : ''}
            ${user.isDemo ? '<span class="text-xs text-gray-600">·</span>' : ''}
          </div>
          ${user.secondaryValue !== null ? `
            <p class="text-xs text-gray-500">${user.secondaryValue} ${user.secondaryLabel || ''}</p>
          ` : ''}
        </div>

        <!-- Score -->
        <div class="text-right">
          <div class="text-lg font-bold ${isTopThree ? 'text-amber-400' : 'text-white'}">
            ${user.value.toLocaleString()}
          </div>
          <div class="text-xs text-gray-500">${categoryInfo.metricLabel}</div>
        </div>
      </div>
    `;
  }

  getAvatarGradient(rank) {
    const gradients = {
      1: 'bg-gradient-to-br from-amber-400 to-yellow-500',
      2: 'bg-gradient-to-br from-gray-300 to-gray-400',
      3: 'bg-gradient-to-br from-orange-400 to-amber-500'
    };
    return gradients[rank] || 'bg-gradient-to-br from-cyan-500 to-purple-500';
  }

  async switchCategory(category) {
    this.currentCategory = category;
    const content = document.getElementById('leaderboard-content');
    if (!content) return;

    // Mostrar loading
    content.innerHTML = `
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full"></div>
      </div>
    `;

    // Actualizar tabs
    document.querySelectorAll('#leaderboards-modal button[onclick*="switchCategory"]').forEach(btn => {
      const catId = btn.getAttribute('onclick').match(/'(\w+)'/)?.[1];
      if (catId === category) {
        btn.className = btn.className.replace('text-gray-400 hover:text-white border-transparent', 'text-amber-400 border-amber-400');
      } else {
        btn.className = btn.className.replace('text-amber-400 border-amber-400', 'text-gray-400 hover:text-white border-transparent');
      }
    });

    // Cargar datos
    const leaderboard = await this.getLeaderboard(category);
    content.innerHTML = this.renderLeaderboard(leaderboard, category);
  }

  shareRank(rank, category) {
    const categoryInfo = this.categories[category];
    const shareText = `¡Soy #${rank} en ${categoryInfo.name} en Colección Nuevo Ser! ${categoryInfo.icon}\n\n¿Puedes superarme?`;

    if (window.shareableMoments) {
      window.shareableMoments.showShareModal({
        type: 'leaderboard_rank',
        title: `#${rank} en ${categoryInfo.name}`,
        message: shareText,
        hashtags: ['ColeccionNuevoSer', 'Lectura', 'Ranking']
      });
    } else if (navigator.share) {
      navigator.share({
        title: `Mi ranking en Colección Nuevo Ser`,
        text: shareText
      });
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        window.toast?.success('Copiado al portapapeles');
      });
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  close() {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
    if (this._escapeHandler) {
      document.removeEventListener('keydown', this._escapeHandler);
      this._escapeHandler = null;
    }
  }
}

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================

window.Leaderboards = Leaderboards;
window.leaderboards = new Leaderboards();

logger.log('[Leaderboards] Sistema de clasificación inicializado');
