// ============================================================================
// SHAREABLE MOMENTS - Sistema de Momentos Compartibles
// ============================================================================
// Permite compartir logros, insights y progreso en redes sociales
// para facilitar el crecimiento orgánico de la app
// ============================================================================

class ShareableMoments {
  constructor() {
    this.appUrl = 'https://gailu.net/coleccion';
    this.appName = 'Colección Nuevo Ser';

    // Tipos de momentos compartibles
    this.momentTypes = {
      BOOK_STARTED: 'book_started',
      BOOK_COMPLETED: 'book_completed',
      CHAPTER_COMPLETED: 'chapter_completed',
      STREAK_MILESTONE: 'streak_milestone',
      PRACTICE_COMPLETED: 'practice_completed',
      INSIGHT: 'insight',
      MILESTONE: 'milestone'
    };
  }

  // ==========================================================================
  // GENERADORES DE MOMENTOS
  // ==========================================================================

  /**
   * Genera un momento compartible cuando se completa un libro
   */
  createBookCompletedMoment(bookData) {
    const emojis = ['🎉', '📚', '✨', '🌟', '🚀'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    return {
      type: this.momentTypes.BOOK_COMPLETED,
      title: `${emoji} ¡Libro completado!`,
      message: `Acabo de terminar "${bookData.title}" en ${this.appName}. ${bookData.chapters} capítulos de transformación personal.`,
      hashtags: ['NuevoSer', 'TransformacionPersonal', 'Lectura', 'Consciencia'],
      stats: {
        chapters: bookData.chapters,
        estimatedTime: bookData.estimatedReadTime
      },
      quote: bookData.favoriteQuote || null,
      imageData: this.generateShareImage(bookData, 'completed')
    };
  }

  /**
   * Genera un momento compartible para una racha
   */
  createStreakMoment(streakDays) {
    const milestones = {
      7: { emoji: '🔥', message: '¡Una semana de práctica diaria!' },
      14: { emoji: '💪', message: '¡Dos semanas sin fallar!' },
      21: { emoji: '🌱', message: '¡21 días - un hábito en formación!' },
      30: { emoji: '🏆', message: '¡Un mes completo de dedicación!' },
      60: { emoji: '⭐', message: '¡Dos meses de transformación!' },
      90: { emoji: '🌟', message: '¡90 días - maestría en progreso!' },
      100: { emoji: '💎', message: '¡100 días de consciencia!' },
      365: { emoji: '👑', message: '¡Un año de práctica constante!' }
    };

    const milestone = milestones[streakDays];
    if (!milestone) return null;

    return {
      type: this.momentTypes.STREAK_MILESTONE,
      title: `${milestone.emoji} Racha de ${streakDays} días`,
      message: `${milestone.message} Practicando consciencia con ${this.appName}.`,
      hashtags: ['Racha', 'HabitosConscientes', 'Disciplina', 'NuevoSer'],
      stats: { days: streakDays }
    };
  }

  /**
   * Genera un momento para compartir un insight/cita
   */
  createInsightMoment(quote, bookTitle, chapterTitle) {
    return {
      type: this.momentTypes.INSIGHT,
      title: '💡 Insight del día',
      message: `"${quote}"\n\n— De "${bookTitle}", capítulo "${chapterTitle}"`,
      hashtags: ['Insight', 'Reflexion', 'Consciencia', 'NuevoSer'],
      quote: quote,
      source: { book: bookTitle, chapter: chapterTitle }
    };
  }

  /**
   * Genera un momento para práctica completada
   */
  createPracticeCompletedMoment(practiceData) {
    return {
      type: this.momentTypes.PRACTICE_COMPLETED,
      title: '🧘 Práctica completada',
      message: `Acabo de completar "${practiceData.title}" (${practiceData.duration}). Otro paso en mi camino de transformación.`,
      hashtags: ['Meditacion', 'PracticaDiaria', 'Mindfulness', 'NuevoSer'],
      stats: {
        duration: practiceData.duration,
        type: practiceData.type
      }
    };
  }

  // ==========================================================================
  // COMPARTIR EN REDES
  // ==========================================================================

  /**
   * Comparte en Twitter/X
   */
  shareToTwitter(moment) {
    const text = this.formatForTwitter(moment);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(this.appUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');

    this.trackShare('twitter', moment.type);
  }

  /**
   * Comparte en Facebook
   */
  shareToFacebook(moment) {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.appUrl)}&quote=${encodeURIComponent(moment.message)}`;
    window.open(url, '_blank', 'width=600,height=400');

    this.trackShare('facebook', moment.type);
  }

  /**
   * Comparte en LinkedIn
   */
  shareToLinkedIn(moment) {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(this.appUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');

    this.trackShare('linkedin', moment.type);
  }

  /**
   * Comparte en WhatsApp
   */
  shareToWhatsApp(moment) {
    const text = `${moment.message}\n\n${this.appUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');

    this.trackShare('whatsapp', moment.type);
  }

  /**
   * Comparte en Telegram
   */
  shareToTelegram(moment) {
    const text = `${moment.message}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(this.appUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');

    this.trackShare('telegram', moment.type);
  }

  /**
   * Copia al portapapeles
   */
  async copyToClipboard(moment) {
    const text = `${moment.message}\n\n${this.appUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      if (window.toast) {
        window.toast.success('Copiado al portapapeles');
      }
      this.trackShare('clipboard', moment.type);
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }

  /**
   * Usa Web Share API si está disponible
   */
  async nativeShare(moment) {
    if (!navigator.share) {
      return false;
    }

    try {
      await navigator.share({
        title: moment.title,
        text: moment.message,
        url: this.appUrl
      });
      this.trackShare('native', moment.type);
      return true;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
      return false;
    }
  }

  // ==========================================================================
  // UI - MODAL DE COMPARTIR
  // ==========================================================================

  /**
   * Muestra el modal de compartir
   */
  showShareModal(moment) {
    // Remover modal existente si hay
    const existing = document.getElementById('share-moment-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'share-moment-modal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="window.shareableMoments?.closeShareModal()"></div>
      <div class="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 max-w-md w-full p-6 shadow-2xl animate-fade-in">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-white">${moment.title}</h3>
          <button onclick="window.shareableMoments?.closeShareModal()" class="p-2 hover:bg-slate-700 rounded-lg transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Preview -->
        <div class="bg-slate-700/50 rounded-xl p-4 mb-6 border border-slate-600/50">
          <p class="text-gray-300 text-sm leading-relaxed">${moment.message}</p>
          ${moment.quote ? `
            <div class="mt-3 pt-3 border-t border-slate-600/50">
              <p class="text-cyan-400 text-sm italic">"${moment.quote}"</p>
            </div>
          ` : ''}
        </div>

        <!-- Share Buttons -->
        <div class="grid grid-cols-3 gap-3 mb-4">
          <button onclick="window.shareableMoments?.shareToTwitter(window.shareableMoments._currentMoment)"
                  class="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 border border-[#1DA1F2]/30 transition">
            <span class="text-2xl">𝕏</span>
            <span class="text-xs text-gray-400">Twitter</span>
          </button>
          <button onclick="window.shareableMoments?.shareToWhatsApp(window.shareableMoments._currentMoment)"
                  class="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/30 transition">
            <span class="text-2xl">💬</span>
            <span class="text-xs text-gray-400">WhatsApp</span>
          </button>
          <button onclick="window.shareableMoments?.shareToTelegram(window.shareableMoments._currentMoment)"
                  class="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#0088CC]/20 hover:bg-[#0088CC]/30 border border-[#0088CC]/30 transition">
            <span class="text-2xl">✈️</span>
            <span class="text-xs text-gray-400">Telegram</span>
          </button>
          <button onclick="window.shareableMoments?.shareToFacebook(window.shareableMoments._currentMoment)"
                  class="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#1877F2]/20 hover:bg-[#1877F2]/30 border border-[#1877F2]/30 transition">
            <span class="text-2xl">📘</span>
            <span class="text-xs text-gray-400">Facebook</span>
          </button>
          <button onclick="window.shareableMoments?.shareToLinkedIn(window.shareableMoments._currentMoment)"
                  class="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#0A66C2]/20 hover:bg-[#0A66C2]/30 border border-[#0A66C2]/30 transition">
            <span class="text-2xl">💼</span>
            <span class="text-xs text-gray-400">LinkedIn</span>
          </button>
          <button onclick="window.shareableMoments?.copyToClipboard(window.shareableMoments._currentMoment)"
                  class="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-600/50 hover:bg-slate-600/70 border border-slate-500/30 transition">
            <span class="text-2xl">📋</span>
            <span class="text-xs text-gray-400">Copiar</span>
          </button>
        </div>

        <!-- Native Share (if available) -->
        ${navigator.share ? `
          <button onclick="window.shareableMoments?.nativeShare(window.shareableMoments._currentMoment)"
                  class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-semibold transition flex items-center justify-center gap-2">
            <span>📤</span>
            <span>Compartir...</span>
          </button>
        ` : ''}

        <!-- Invite Friends -->
        <div class="mt-4 pt-4 border-t border-slate-700">
          <p class="text-center text-sm text-gray-500">
            Invita a un amigo a despertar contigo
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this._currentMoment = moment;
  }

  closeShareModal() {
    const modal = document.getElementById('share-moment-modal');
    if (modal) {
      modal.classList.add('opacity-0');
      setTimeout(() => modal.remove(), 200);
    }
    this._currentMoment = null;
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  formatForTwitter(moment) {
    let text = moment.message;

    // Añadir hashtags
    if (moment.hashtags && moment.hashtags.length > 0) {
      const hashtagStr = moment.hashtags.map(h => `#${h}`).join(' ');
      text = `${text}\n\n${hashtagStr}`;
    }

    // Truncar si es muy largo (280 - URL length aprox)
    const maxLength = 250;
    if (text.length > maxLength) {
      text = text.substring(0, maxLength - 3) + '...';
    }

    return text;
  }

  generateShareImage(bookData, type) {
    // Placeholder - en el futuro se podría generar una imagen canvas
    return null;
  }

  trackShare(platform, momentType) {
    if (window.analyticsHelper) {
      window.analyticsHelper.trackEvent('share_moment', {
        platform,
        moment_type: momentType
      });
    }
  }

  // ==========================================================================
  // TRIGGERS AUTOMÁTICOS
  // ==========================================================================

  /**
   * Verifica si debe mostrar opción de compartir al completar libro
   */
  onBookCompleted(bookData) {
    const moment = this.createBookCompletedMoment(bookData);
    this.showShareModal(moment);
  }

  /**
   * Verifica si hay milestone de racha para compartir
   */
  onStreakUpdate(streakDays) {
    const milestones = [7, 14, 21, 30, 60, 90, 100, 365];
    if (milestones.includes(streakDays)) {
      const moment = this.createStreakMoment(streakDays);
      if (moment) {
        // Delay pequeño para no interrumpir
        setTimeout(() => {
          this.showShareModal(moment);
        }, 1000);
      }
    }
  }
}

// ============================================================================
// EXPORTAR Y AUTO-INICIALIZAR
// ============================================================================

window.ShareableMoments = ShareableMoments;
window.shareableMoments = new ShareableMoments();
