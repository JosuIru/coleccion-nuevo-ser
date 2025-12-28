// ============================================================================
// WIDGET DATA HELPER - Sincronizar datos para Android Widgets
// ============================================================================
// Prepara y sincroniza datos de lectura para los widgets de Android
// Los widgets nativos leen de SharedPreferences

// 🔧 FIX v2.9.198: Migrated console.log to logger
class WidgetDataHelper {
  constructor() {
    this.isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
    this.lastUpdate = null;
    this.updateInterval = null;

    this.init();
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  async init() {
    // Cargar última actualización
    this.lastUpdate = this.getFromStorage('widget-last-update', null);

    // Sincronizar datos al iniciar
    await this.syncWidgetData();

    // Actualizar periódicamente (cada 5 minutos)
    this.updateInterval = setInterval(() => {
      this.syncWidgetData();
    }, 5 * 60 * 1000);

    // Exponer globalmente
    window.widgetDataHelper = this;

    // logger.debug('WidgetDataHelper initialized');
  }

  // ==========================================================================
  // SINCRONIZAR DATOS PARA WIDGETS
  // ==========================================================================

  async syncWidgetData() {
    const widgetData = this.collectWidgetData();

    // Guardar en localStorage (para web)
    this.saveToStorage('widget-data', widgetData);
    this.saveToStorage('widget-last-update', Date.now());

    // Sincronizar con SharedPreferences (para Android widgets)
    if (this.isCapacitor) {
      await this.syncToSharedPreferences(widgetData);
    }

    this.lastUpdate = Date.now();
    // logger.debug('Widget data synced:', widgetData);

    return widgetData;
  }

  collectWidgetData() {
    const currentBook = this.getCurrentBook();
    const todayStats = this.getTodayStats();
    const overallProgress = this.getOverallProgress();
    const dailyKoan = this.getDailyKoan();
    const streakDays = this.getStreakDays();

    return {
      // Libro actual
      currentBook: {
        id: currentBook.id,
        title: currentBook.title,
        shortTitle: this.shortenTitle(currentBook.title, 15),
        chapter: currentBook.chapter,
        chapterTitle: currentBook.chapterTitle,
        progress: currentBook.progress
      },

      // Estadísticas del día
      today: {
        chaptersRead: todayStats.chaptersRead,
        minutesRead: todayStats.minutesRead,
        notesCreated: todayStats.notesCreated
      },

      // Progreso general
      overall: {
        booksStarted: overallProgress.booksStarted,
        booksCompleted: overallProgress.booksCompleted,
        totalProgress: overallProgress.totalProgress,
        totalChapters: overallProgress.totalChapters,
        chaptersCompleted: overallProgress.chaptersCompleted
      },

      // Racha de lectura
      streak: {
        days: streakDays,
        emoji: this.getStreakEmoji(streakDays)
      },

      // Koan del día
      dailyKoan: {
        text: dailyKoan.text,
        shortText: this.shortenTitle(dailyKoan.text, 50),
        source: dailyKoan.source
      },

      // Metadatos
      lastUpdated: Date.now()
    };
  }

  // ==========================================================================
  // OBTENER DATOS DE LECTURA
  // ==========================================================================

  getCurrentBook() {
    // Buscar último libro leído
    const lastBook = this.getFromStorage('last-book-read', null);
    const books = ['manifiesto', 'codigo-despertar', 'sintaxis', 'manual', 'transmisiones', 'cartas', 'reflexiones'];

    const bookTitles = {
      'manifiesto': 'Manifiesto del Nuevo Ser',
      'codigo-despertar': 'El Código del Despertar',
      'sintaxis': 'Sintaxis de la Conciencia',
      'manual': 'Manual del Nuevo Ser',
      'transmisiones': 'Transmisiones desde el Límite',
      'cartas': 'Cartas a un Aprendiz',
      'reflexiones': 'Reflexiones en el Umbral'
    };

    if (lastBook && lastBook.bookId) {
      const progress = this.getBookProgress(lastBook.bookId);
      return {
        id: lastBook.bookId,
        title: bookTitles[lastBook.bookId] || lastBook.bookId,
        chapter: lastBook.chapter || 1,
        chapterTitle: lastBook.chapterTitle || 'Capítulo actual',
        progress: progress
      };
    }

    // Si no hay libro reciente, buscar el primero con progreso
    for (const bookId of books) {
      const progress = this.getBookProgress(bookId);
      if (progress > 0 && progress < 100) {
        return {
          id: bookId,
          title: bookTitles[bookId],
          chapter: 1,
          chapterTitle: 'Continuar lectura',
          progress: progress
        };
      }
    }

    // Default al primer libro
    return {
      id: 'manifiesto',
      title: 'Manifiesto del Nuevo Ser',
      chapter: 1,
      chapterTitle: 'Comenzar a leer',
      progress: 0
    };
  }

  getBookProgress(bookId) {
    const progressData = this.getFromStorage(`reading-progress-${bookId}`, {});
    if (!progressData.chaptersRead || !progressData.totalChapters) {
      return 0;
    }
    const readCount = Object.values(progressData.chaptersRead).filter(Boolean).length;
    return Math.round((readCount / progressData.totalChapters) * 100);
  }

  getTodayStats() {
    const today = new Date().toISOString().slice(0, 10);
    const todayData = this.getFromStorage(`stats-${today}`, {
      chaptersRead: 0,
      minutesRead: 0,
      notesCreated: 0
    });

    return todayData;
  }

  getOverallProgress() {
    const books = ['manifiesto', 'codigo-despertar', 'sintaxis', 'manual', 'transmisiones', 'cartas', 'reflexiones'];
    let booksStarted = 0;
    let booksCompleted = 0;
    let totalChapters = 0;
    let chaptersCompleted = 0;

    for (const bookId of books) {
      const progressData = this.getFromStorage(`reading-progress-${bookId}`, {});
      if (progressData.chaptersRead && progressData.totalChapters) {
        const readCount = Object.values(progressData.chaptersRead).filter(Boolean).length;
        totalChapters += progressData.totalChapters;
        chaptersCompleted += readCount;

        if (readCount > 0) booksStarted++;
        if (readCount >= progressData.totalChapters) booksCompleted++;
      }
    }

    const totalProgress = totalChapters > 0 ? Math.round((chaptersCompleted / totalChapters) * 100) : 0;

    return {
      booksStarted,
      booksCompleted,
      totalProgress,
      totalChapters,
      chaptersCompleted
    };
  }

  getStreakDays() {
    const streakData = this.getFromStorage('reading-streak', { currentStreak: 0 });
    return streakData.currentStreak || 0;
  }

  getDailyKoan() {
    const koans = [
      { text: "La conciencia no se busca, se reconoce.", source: "Manifiesto" },
      { text: "El observador y lo observado son uno.", source: "Código" },
      { text: "Cada pensamiento es un universo.", source: "Sintaxis" },
      { text: "La realidad es un acuerdo temporal.", source: "Manual" },
      { text: "El límite es la puerta.", source: "Transmisiones" },
      { text: "Aprender es recordar lo olvidado.", source: "Cartas" },
      { text: "En el umbral, todo es posible.", source: "Reflexiones" },
      { text: "Ser es ya despertar.", source: "Manifiesto" },
      { text: "La mente es el mapa, no el territorio.", source: "Código" },
      { text: "Cada momento es el primer momento.", source: "Sintaxis" },
      { text: "La paradoja es la puerta de la sabiduría.", source: "Manual" },
      { text: "El silencio habla más claro.", source: "Transmisiones" },
      { text: "Cuestionar es la raíz del saber.", source: "Cartas" },
      { text: "El fin es siempre un comienzo.", source: "Reflexiones" }
    ];

    // Koan basado en el día del año
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const koanIndex = dayOfYear % koans.length;

    return koans[koanIndex];
  }

  // ==========================================================================
  // SINCRONIZAR CON SHARED PREFERENCES (Android)
  // ==========================================================================

  async syncToSharedPreferences(widgetData) {
    try {
      // Usar Capacitor Preferences plugin si está disponible
      if (window.Capacitor?.Plugins?.Preferences) {
        const { Preferences } = window.Capacitor.Plugins;

        // Guardar datos individuales para widgets
        await Preferences.set({
          key: 'widget_current_book',
          value: widgetData.currentBook.shortTitle
        });

        await Preferences.set({
          key: 'widget_progress',
          value: String(widgetData.currentBook.progress)
        });

        await Preferences.set({
          key: 'widget_chapter',
          value: widgetData.currentBook.chapterTitle
        });

        await Preferences.set({
          key: 'widget_streak',
          value: String(widgetData.streak.days)
        });

        await Preferences.set({
          key: 'widget_koan',
          value: widgetData.dailyKoan.shortText
        });

        await Preferences.set({
          key: 'widget_chapters_today',
          value: String(widgetData.today.chaptersRead)
        });

        await Preferences.set({
          key: 'widget_last_update',
          value: String(Date.now())
        });

        // Actualizar widgets nativos usando el plugin
        if (window.Capacitor?.Plugins?.WidgetBridge) {
          try {
            await window.Capacitor.Plugins.WidgetBridge.updateWidgetData({
              currentBook: widgetData.currentBook.title,
              progress: widgetData.currentBook.progress,
              streak: widgetData.streak.days,
              totalChapters: widgetData.currentBook.totalChapters,
              chaptersRead: widgetData.currentBook.chaptersRead,
              dailyKoan: widgetData.dailyKoan.shortText,
              koanDate: new Date().toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short'
              })
            });
            // logger.debug('✓ Native widgets updated');
          } catch (widgetError) {
            // console.warn('Error updating native widgets:', widgetError);
          }
        }

        // logger.debug('Widget data synced to SharedPreferences');
      }
    } catch (error) {
      // console.warn('Error syncing to SharedPreferences:', error);
    }
  }

  // ==========================================================================
  // ACTUALIZAR AL LEER
  // ==========================================================================

  onChapterRead(bookId, chapterId, chapterTitle) {
    // Actualizar libro actual
    this.saveToStorage('last-book-read', {
      bookId,
      chapter: chapterId,
      chapterTitle,
      timestamp: Date.now()
    });

    // Actualizar stats del día
    const today = new Date().toISOString().slice(0, 10);
    const todayStats = this.getFromStorage(`stats-${today}`, {
      chaptersRead: 0,
      minutesRead: 0,
      notesCreated: 0
    });
    todayStats.chaptersRead++;
    this.saveToStorage(`stats-${today}`, todayStats);

    // Sincronizar widgets
    this.syncWidgetData();
  }

  onNoteCreated(bookId) {
    const today = new Date().toISOString().slice(0, 10);
    const todayStats = this.getFromStorage(`stats-${today}`, {
      chaptersRead: 0,
      minutesRead: 0,
      notesCreated: 0
    });
    todayStats.notesCreated++;
    this.saveToStorage(`stats-${today}`, todayStats);

    this.syncWidgetData();
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  shortenTitle(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  getStreakEmoji(days) {
    if (days === 0) return '💤';
    if (days < 3) return '🌱';
    if (days < 7) return '🌿';
    if (days < 14) return '🌳';
    if (days < 30) return '🔥';
    if (days < 100) return '⭐';
    return '🏆';
  }

  getFromStorage(key, defaultValue) {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  saveToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // console.warn('Error saving to storage:', error);
    }
  }

  // ==========================================================================
  // UI HELPERS
  // ==========================================================================

  getWidgetPreview() {
    const data = this.collectWidgetData();

    return `
      <div class="widget-preview space-y-4">
        <!-- Widget Grande -->
        <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 border border-slate-700">
          <p class="text-xs text-gray-400 mb-2">Widget Grande (4x2)</p>
          <div class="bg-slate-900/50 rounded-xl p-4 border border-slate-600">
            <div class="flex items-center gap-3 mb-3">
              <span class="text-3xl">📖</span>
              <div class="flex-1">
                <p class="font-semibold text-white">${data.currentBook.shortTitle}</p>
                <p class="text-sm text-gray-400">${data.currentBook.chapterTitle}</p>
              </div>
            </div>
            <div class="bg-slate-700 rounded-full h-2 mb-2">
              <div class="bg-gradient-to-r from-sky-500 to-cyan-400 h-2 rounded-full"
                   style="width: ${data.currentBook.progress}%"></div>
            </div>
            <div class="flex justify-between text-xs text-gray-400">
              <span>${data.currentBook.progress}% completado</span>
              <span>${data.streak.emoji} ${data.streak.days} días</span>
            </div>
          </div>
        </div>

        <!-- Widget Pequeño -->
        <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 border border-slate-700">
          <p class="text-xs text-gray-400 mb-2">Widget Pequeño (2x2)</p>
          <div class="bg-slate-900/50 rounded-xl p-3 border border-slate-600 w-32 mx-auto text-center">
            <p class="text-sm font-semibold text-white truncate">${data.currentBook.shortTitle}</p>
            <p class="text-2xl font-bold text-sky-400">${data.currentBook.progress}%</p>
            <span class="text-xl">${data.streak.emoji}</span>
          </div>
        </div>

        <!-- Widget Koan -->
        <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 border border-slate-700">
          <p class="text-xs text-gray-400 mb-2">Widget Koan (4x1)</p>
          <div class="bg-slate-900/50 rounded-xl p-3 border border-slate-600">
            <p class="text-sm text-white italic">"${data.dailyKoan.shortText}"</p>
            <p class="text-xs text-gray-400 mt-1">— ${data.dailyKoan.source}</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Destruir la instancia y limpiar recursos
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    logger.debug('[WidgetDataHelper] Instancia destruida');
  }
}

// ==========================================================================
// INICIALIZACIÓN AUTOMÁTICA
// ==========================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new WidgetDataHelper());
} else {
  new WidgetDataHelper();
}

// Exportar
window.WidgetDataHelper = WidgetDataHelper;
