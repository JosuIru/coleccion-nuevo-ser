// ============================================================================
// CHAPTER COMMENTS - Sistema de Comentarios por Capítulo
// ============================================================================
// v2.9.327: Permite a los usuarios dejar y ver comentarios públicos en capítulos
// Funciona offline-first con localStorage, sincroniza con Supabase cuando disponible

class ChapterComments {
  constructor() {
    this.comments = this.loadLocalComments();
    this.modalElement = null;
    this.currentBookId = null;
    this.currentChapterId = null;
    this.i18n = window.i18n || { t: (key) => key };

    // Configuración
    this.config = {
      maxCommentLength: 500,
      minCommentLength: 10,
      commentsPerPage: 20
    };
  }

  // ==========================================================================
  // PERSISTENCIA LOCAL
  // ==========================================================================

  loadLocalComments() {
    try {
      return JSON.parse(localStorage.getItem('chapter-comments')) || {};
    } catch {
      return {};
    }
  }

  saveLocalComments() {
    try {
      localStorage.setItem('chapter-comments', JSON.stringify(this.comments));
    } catch (error) {
      logger.error('[ChapterComments] Error guardando comentarios:', error);
    }
  }

  // ==========================================================================
  // API DE COMENTARIOS
  // ==========================================================================

  /**
   * Obtiene comentarios de un capítulo
   */
  async getComments(bookId, chapterId) {
    const key = `${bookId}:${chapterId}`;
    const localComments = this.comments[key] || [];

    // Si Supabase está disponible, intentar obtener comentarios públicos
    if (this.isSupabaseAvailable()) {
      try {
        const publicComments = await this.fetchPublicComments(bookId, chapterId);
        // Merge local and public, avoiding duplicates
        return this.mergeComments(localComments, publicComments);
      } catch (error) {
        logger.warn('[ChapterComments] Error fetching public comments:', error);
      }
    }

    return localComments;
  }

  /**
   * Añade un comentario
   */
  async addComment(bookId, chapterId, text, isPublic = false) {
    if (text.length < this.config.minCommentLength) {
      throw new Error(`El comentario debe tener al menos ${this.config.minCommentLength} caracteres`);
    }
    if (text.length > this.config.maxCommentLength) {
      throw new Error(`El comentario no puede exceder ${this.config.maxCommentLength} caracteres`);
    }

    const comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      bookId,
      chapterId,
      text: text.trim(),
      userName: this.getUserName(),
      userId: this.getUserId(),
      createdAt: new Date().toISOString(),
      isPublic,
      synced: false
    };

    // Guardar localmente
    const key = `${bookId}:${chapterId}`;
    if (!this.comments[key]) {
      this.comments[key] = [];
    }
    this.comments[key].unshift(comment);
    this.saveLocalComments();

    // Si es público y Supabase está disponible, sincronizar
    if (isPublic && this.isSupabaseAvailable()) {
      try {
        await this.syncCommentToCloud(comment);
        comment.synced = true;
        this.saveLocalComments();
      } catch (error) {
        logger.warn('[ChapterComments] Error syncing comment:', error);
      }
    }

    return comment;
  }

  /**
   * Elimina un comentario propio
   */
  async deleteComment(bookId, chapterId, commentId) {
    const key = `${bookId}:${chapterId}`;
    if (!this.comments[key]) return;

    const index = this.comments[key].findIndex(c => c.id === commentId);
    if (index === -1) return;

    const comment = this.comments[key][index];

    // Solo permite eliminar comentarios propios
    if (comment.userId !== this.getUserId()) {
      throw new Error('No puedes eliminar comentarios de otros usuarios');
    }

    this.comments[key].splice(index, 1);
    this.saveLocalComments();

    // Si estaba sincronizado, eliminar de la nube
    if (comment.synced && this.isSupabaseAvailable()) {
      try {
        await this.deleteFromCloud(commentId);
      } catch (error) {
        logger.warn('[ChapterComments] Error deleting from cloud:', error);
      }
    }
  }

  // ==========================================================================
  // SUPABASE SYNC
  // ==========================================================================

  isSupabaseAvailable() {
    return !!(window.supabaseConfig?.url &&
              window.supabaseSyncHelper?.supabase &&
              window.authHelper?.user);
  }

  async fetchPublicComments(bookId, chapterId) {
    if (!this.isSupabaseAvailable()) return [];

    try {
      const { data, error } = await window.supabaseSyncHelper.supabase
        .from('chapter_comments')
        .select('*')
        .eq('book_id', bookId)
        .eq('chapter_id', chapterId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(this.config.commentsPerPage);

      if (error) throw error;
      return (data || []).map(this.mapCloudComment);
    } catch (error) {
      logger.error('[ChapterComments] Error fetching:', error);
      return [];
    }
  }

  async syncCommentToCloud(comment) {
    if (!this.isSupabaseAvailable()) return;

    const { error } = await window.supabaseSyncHelper.supabase
      .from('chapter_comments')
      .insert({
        id: comment.id,
        user_id: comment.userId,
        book_id: comment.bookId,
        chapter_id: comment.chapterId,
        text: comment.text,
        user_name: comment.userName,
        is_public: comment.isPublic,
        created_at: comment.createdAt
      });

    if (error) throw error;
  }

  async deleteFromCloud(commentId) {
    if (!this.isSupabaseAvailable()) return;

    const { error } = await window.supabaseSyncHelper.supabase
      .from('chapter_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', this.getUserId());

    if (error) throw error;
  }

  mapCloudComment(row) {
    return {
      id: row.id,
      bookId: row.book_id,
      chapterId: row.chapter_id,
      text: row.text,
      userName: row.user_name,
      userId: row.user_id,
      createdAt: row.created_at,
      isPublic: row.is_public,
      synced: true
    };
  }

  mergeComments(local, cloud) {
    const merged = [...local];
    const localIds = new Set(local.map(c => c.id));

    cloud.forEach(c => {
      if (!localIds.has(c.id)) {
        merged.push(c);
      }
    });

    return merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  getUserName() {
    if (window.authHelper?.user?.user_metadata?.name) {
      return window.authHelper.user.user_metadata.name;
    }
    if (window.authHelper?.user?.email) {
      return window.authHelper.user.email.split('@')[0];
    }
    return localStorage.getItem('user-display-name') || 'Lector Anónimo';
  }

  getUserId() {
    return window.authHelper?.user?.id || `local-${this.getLocalUserId()}`;
  }

  getLocalUserId() {
    let id = localStorage.getItem('local-user-id');
    if (!id) {
      id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('local-user-id', id);
    }
    return id;
  }

  // ==========================================================================
  // UI - MODAL DE COMENTARIOS
  // ==========================================================================

  async show(bookId, chapterId, chapterTitle = '') {
    this.currentBookId = bookId;
    this.currentChapterId = chapterId;

    // Cerrar modal existente
    this.close();

    const comments = await this.getComments(bookId, chapterId);

    const modal = document.createElement('div');
    modal.id = 'chapter-comments-modal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="window.chapterComments?.close()"></div>
      <div class="relative bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col border border-gray-700">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              💬 Comentarios de la Comunidad
            </h2>
            <p class="text-xs text-gray-400 mt-0.5 truncate">${this.escapeHtml(chapterTitle)}</p>
          </div>
          <button onclick="window.chapterComments?.close()"
                  class="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- New Comment Form -->
        <div class="p-4 border-b border-gray-700 bg-slate-800/50">
          <textarea id="new-comment-text"
                    class="w-full p-3 bg-slate-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 resize-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    placeholder="Comparte tu reflexión sobre este capítulo..."
                    rows="3"
                    maxlength="${this.config.maxCommentLength}"></textarea>
          <div class="flex items-center justify-between mt-3">
            <label class="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" id="comment-is-public" class="rounded bg-slate-600 border-gray-500 text-cyan-500 focus:ring-cyan-500">
              <span>Hacer público</span>
            </label>
            <div class="flex items-center gap-2">
              <span id="char-count" class="text-xs text-gray-500">0/${this.config.maxCommentLength}</span>
              <button onclick="window.chapterComments?.submitComment()"
                      class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold text-sm transition-colors">
                Publicar
              </button>
            </div>
          </div>
        </div>

        <!-- Comments List -->
        <div id="comments-list" class="flex-1 overflow-y-auto p-4 space-y-4">
          ${comments.length === 0 ? `
            <div class="text-center py-8 text-gray-500">
              <div class="text-4xl mb-2">💭</div>
              <p>Sé el primero en compartir una reflexión</p>
            </div>
          ` : comments.map(c => this.renderComment(c)).join('')}
        </div>

        <!-- Footer -->
        <div class="p-3 border-t border-gray-700 text-center">
          <p class="text-xs text-gray-500">
            ${this.isSupabaseAvailable()
              ? '🌐 Conectado - Los comentarios públicos son visibles para todos'
              : '📱 Modo offline - Los comentarios se guardan localmente'}
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalElement = modal;

    // Character counter
    const textarea = modal.querySelector('#new-comment-text');
    const charCount = modal.querySelector('#char-count');
    textarea.addEventListener('input', () => {
      charCount.textContent = `${textarea.value.length}/${this.config.maxCommentLength}`;
    });

    // Escape to close
    this._escapeHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this._escapeHandler);
  }

  renderComment(comment) {
    const isOwn = comment.userId === this.getUserId();
    const date = new Date(comment.createdAt).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return `
      <div class="bg-slate-800/50 rounded-xl p-4 border border-gray-700/50 ${isOwn ? 'border-l-2 border-l-cyan-500' : ''}">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
              ${comment.userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="font-semibold text-gray-200 text-sm">${this.escapeHtml(comment.userName)}</div>
              <div class="text-xs text-gray-500">${date}</div>
            </div>
          </div>
          ${isOwn ? `
            <button onclick="window.chapterComments?.deleteCommentUI('${comment.id}')"
                    class="p-1 hover:bg-red-900/30 rounded text-gray-500 hover:text-red-400 transition-colors"
                    title="Eliminar">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          ` : ''}
        </div>
        <p class="mt-3 text-gray-300 text-sm leading-relaxed">${this.escapeHtml(comment.text)}</p>
        <div class="mt-2 flex items-center gap-2">
          ${comment.isPublic ? '<span class="text-xs text-cyan-400/70">🌐 Público</span>' : '<span class="text-xs text-gray-500">🔒 Privado</span>'}
          ${comment.synced ? '<span class="text-xs text-green-400/70">✓ Sincronizado</span>' : ''}
        </div>
      </div>
    `;
  }

  async submitComment() {
    const textarea = document.getElementById('new-comment-text');
    const isPublicCheckbox = document.getElementById('comment-is-public');

    if (!textarea) return;

    const text = textarea.value.trim();
    if (text.length < this.config.minCommentLength) {
      window.toast?.warn(`El comentario debe tener al menos ${this.config.minCommentLength} caracteres`);
      return;
    }

    try {
      await this.addComment(
        this.currentBookId,
        this.currentChapterId,
        text,
        isPublicCheckbox?.checked || false
      );

      window.toast?.success('Comentario añadido');

      // Refresh comments
      await this.show(this.currentBookId, this.currentChapterId);
    } catch (error) {
      window.toast?.error(error.message || 'Error al añadir comentario');
    }
  }

  async deleteCommentUI(commentId) {
    if (!confirm('¿Eliminar este comentario?')) return;

    try {
      await this.deleteComment(this.currentBookId, this.currentChapterId, commentId);
      window.toast?.success('Comentario eliminado');

      // Refresh
      await this.show(this.currentBookId, this.currentChapterId);
    } catch (error) {
      window.toast?.error(error.message || 'Error al eliminar');
    }
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

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ==========================================================================
  // CONTADOR DE COMENTARIOS
  // ==========================================================================

  getCommentCount(bookId, chapterId) {
    const key = `${bookId}:${chapterId}`;
    return (this.comments[key] || []).length;
  }
}

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================

window.ChapterComments = ChapterComments;
window.chapterComments = new ChapterComments();

logger.log('[ChapterComments] Sistema de comentarios inicializado');
