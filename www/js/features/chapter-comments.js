// ============================================================================
// CHAPTER COMMENTS - Sistema de Comentarios por Capítulo
// ============================================================================
// v2.9.371: Sistema anti-spam, likes, reportes y moderación
// v2.9.327: Permite a los usuarios dejar y ver comentarios públicos en capítulos
// v2.9.368: Sistema de threads (respuestas anidadas)
// Funciona offline-first con localStorage, sincroniza con Supabase cuando disponible

class ChapterComments {
  constructor() {
    this.comments = this.loadLocalComments();
    this.modalElement = null;
    this.currentBookId = null;
    this.currentChapterId = null;
    this.replyingTo = null; // v2.9.368: ID del comentario al que se responde
    this.i18n = window.i18n || { t: (key) => key };

    // Configuración
    this.config = {
      maxCommentLength: 500,
      minCommentLength: 10,
      commentsPerPage: 20,
      maxThreadDepth: 3 // v2.9.368: Profundidad máxima de threads
    };

    // v2.9.371: Sistema anti-spam
    this.spamConfig = {
      maxCommentsPerMinute: 3,
      maxCommentsPerHour: 15,
      minTimeBetweenComments: 10000, // 10 segundos
      suspiciousPatterns: [
        /(.)\1{5,}/gi,           // Caracteres repetidos (aaaaaaaa)
        /https?:\/\/[^\s]+/gi,    // URLs
        /(compra|gratis|oferta|descuento|gana dinero|bitcoin|crypto)/gi, // Spam comercial
        /[A-Z\s]{20,}/g,          // Todo mayúsculas
        /(.+)\1{3,}/gi            // Frases repetidas
      ],
      blockedWords: ['spam', 'viagra', 'casino', 'xxx', 'porn'],
      warningThreshold: 2,        // Advertencias antes de bloqueo temporal
      tempBlockDuration: 3600000  // 1 hora de bloqueo temporal
    };

    // v2.9.371: Estado de anti-spam
    this.spamState = this.loadSpamState();

    // v2.9.371: Likes y reportes
    this.likes = this.loadLikes();
    this.reports = this.loadReports();
  }

  // ==========================================================================
  // v2.9.371: SISTEMA ANTI-SPAM
  // ==========================================================================

  loadSpamState() {
    try {
      return JSON.parse(localStorage.getItem('comments-spam-state')) || {
        commentTimestamps: [],
        warnings: 0,
        blockedUntil: null
      };
    } catch {
      return { commentTimestamps: [], warnings: 0, blockedUntil: null };
    }
  }

  saveSpamState() {
    localStorage.setItem('comments-spam-state', JSON.stringify(this.spamState));
  }

  /**
   * Verifica si el usuario puede comentar (anti-spam)
   * @returns {{canComment: boolean, reason: string|null}}
   */
  checkSpamStatus() {
    const now = Date.now();

    // Verificar bloqueo temporal
    if (this.spamState.blockedUntil && now < this.spamState.blockedUntil) {
      const remaining = Math.ceil((this.spamState.blockedUntil - now) / 60000);
      return {
        canComment: false,
        reason: `Temporalmente bloqueado. Intenta en ${remaining} minutos.`
      };
    }

    // Limpiar timestamps antiguos (más de 1 hora)
    this.spamState.commentTimestamps = this.spamState.commentTimestamps
      .filter(ts => now - ts < 3600000);

    // Verificar límite por minuto
    const lastMinute = this.spamState.commentTimestamps.filter(ts => now - ts < 60000);
    if (lastMinute.length >= this.spamConfig.maxCommentsPerMinute) {
      return {
        canComment: false,
        reason: 'Has comentado demasiado rápido. Espera un momento.'
      };
    }

    // Verificar límite por hora
    if (this.spamState.commentTimestamps.length >= this.spamConfig.maxCommentsPerHour) {
      return {
        canComment: false,
        reason: 'Has alcanzado el límite de comentarios por hora.'
      };
    }

    // Verificar tiempo entre comentarios
    const lastComment = this.spamState.commentTimestamps[this.spamState.commentTimestamps.length - 1];
    if (lastComment && now - lastComment < this.spamConfig.minTimeBetweenComments) {
      const wait = Math.ceil((this.spamConfig.minTimeBetweenComments - (now - lastComment)) / 1000);
      return {
        canComment: false,
        reason: `Espera ${wait} segundos antes de comentar de nuevo.`
      };
    }

    return { canComment: true, reason: null };
  }

  /**
   * Analiza el contenido en busca de spam
   * @returns {{isSpam: boolean, reason: string|null, score: number}}
   */
  analyzeContent(text) {
    let spamScore = 0;
    const reasons = [];

    // Verificar palabras bloqueadas
    const lowerText = text.toLowerCase();
    for (const word of this.spamConfig.blockedWords) {
      if (lowerText.includes(word)) {
        spamScore += 3;
        reasons.push('Contiene palabras no permitidas');
        break;
      }
    }

    // Verificar patrones sospechosos
    for (const pattern of this.spamConfig.suspiciousPatterns) {
      if (pattern.test(text)) {
        spamScore += 2;
        if (pattern.source.includes('http')) {
          reasons.push('No se permiten enlaces');
        } else if (pattern.source.includes('A-Z')) {
          reasons.push('Evita escribir todo en mayúsculas');
        } else {
          reasons.push('Contenido sospechoso detectado');
        }
      }
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;
    }

    // Verificar proporción de caracteres especiales
    const specialChars = text.replace(/[a-záéíóúüñ\s]/gi, '').length;
    if (specialChars / text.length > 0.3) {
      spamScore += 1;
      reasons.push('Demasiados caracteres especiales');
    }

    // Verificar comentario muy corto pero con intención de spam
    if (text.length < 20 && spamScore > 0) {
      spamScore += 1;
    }

    const isSpam = spamScore >= 3;

    return {
      isSpam,
      reason: reasons.length > 0 ? reasons[0] : null,
      score: spamScore
    };
  }

  /**
   * Registra un comentario para tracking anti-spam
   */
  recordComment() {
    this.spamState.commentTimestamps.push(Date.now());
    this.saveSpamState();
  }

  /**
   * Añade una advertencia al usuario
   */
  addWarning() {
    this.spamState.warnings++;
    if (this.spamState.warnings >= this.spamConfig.warningThreshold) {
      this.spamState.blockedUntil = Date.now() + this.spamConfig.tempBlockDuration;
      this.spamState.warnings = 0;
      this.saveSpamState();
      return true; // Usuario bloqueado
    }
    this.saveSpamState();
    return false;
  }

  // ==========================================================================
  // v2.9.371: SISTEMA DE LIKES
  // ==========================================================================

  loadLikes() {
    try {
      return JSON.parse(localStorage.getItem('comments-likes')) || {};
    } catch {
      return {};
    }
  }

  saveLikes() {
    localStorage.setItem('comments-likes', JSON.stringify(this.likes));
  }

  /**
   * Da like a un comentario
   */
  async toggleLike(commentId) {
    const userId = this.getUserId();
    const likeKey = `${commentId}:${userId}`;

    if (this.likes[likeKey]) {
      // Unlike
      delete this.likes[likeKey];
      this.updateCommentLikeCount(commentId, -1);
    } else {
      // Like
      this.likes[likeKey] = Date.now();
      this.updateCommentLikeCount(commentId, 1);
    }

    this.saveLikes();

    // Sync con Supabase si disponible
    if (this.isSupabaseAvailable()) {
      try {
        await this.syncLikeToCloud(commentId, !this.likes[likeKey]);
      } catch (error) {
        logger.warn('[ChapterComments] Error syncing like:', error);
      }
    }

    return !this.likes[likeKey]; // Retorna si ahora tiene like
  }

  hasLiked(commentId) {
    const userId = this.getUserId();
    return !!this.likes[`${commentId}:${userId}`];
  }

  updateCommentLikeCount(commentId, delta) {
    // Buscar comentario en todos los capítulos
    for (const key of Object.keys(this.comments)) {
      const comment = this.comments[key].find(c => c.id === commentId);
      if (comment) {
        comment.likeCount = (comment.likeCount || 0) + delta;
        this.saveLocalComments();
        break;
      }
    }
  }

  getCommentLikeCount(commentId) {
    for (const key of Object.keys(this.comments)) {
      const comment = this.comments[key].find(c => c.id === commentId);
      if (comment) {
        return comment.likeCount || 0;
      }
    }
    return 0;
  }

  // ==========================================================================
  // v2.9.371: SISTEMA DE REPORTES
  // ==========================================================================

  loadReports() {
    try {
      return JSON.parse(localStorage.getItem('comments-reports')) || {};
    } catch {
      return {};
    }
  }

  saveReports() {
    localStorage.setItem('comments-reports', JSON.stringify(this.reports));
  }

  /**
   * Reporta un comentario
   */
  async reportComment(commentId, reason) {
    const userId = this.getUserId();
    const reportKey = `${commentId}:${userId}`;

    // No permitir reportar el mismo comentario dos veces
    if (this.reports[reportKey]) {
      window.toast?.info('Ya has reportado este comentario');
      return false;
    }

    const report = {
      commentId,
      userId,
      reason,
      createdAt: new Date().toISOString()
    };

    this.reports[reportKey] = report;
    this.saveReports();

    // Marcar comentario como reportado
    this.markCommentReported(commentId);

    // Sync con Supabase
    if (this.isSupabaseAvailable()) {
      try {
        await this.syncReportToCloud(report);
      } catch (error) {
        logger.warn('[ChapterComments] Error syncing report:', error);
      }
    }

    window.toast?.success('Comentario reportado. Gracias por ayudar a mantener la comunidad.');
    return true;
  }

  markCommentReported(commentId) {
    for (const key of Object.keys(this.comments)) {
      const comment = this.comments[key].find(c => c.id === commentId);
      if (comment) {
        comment.reportCount = (comment.reportCount || 0) + 1;
        // Auto-ocultar si tiene muchos reportes
        if (comment.reportCount >= 3) {
          comment.hidden = true;
        }
        this.saveLocalComments();
        break;
      }
    }
  }

  hasReported(commentId) {
    const userId = this.getUserId();
    return !!this.reports[`${commentId}:${userId}`];
  }

  /**
   * Muestra el modal de reporte
   */
  showReportModal(commentId) {
    const existing = document.getElementById('report-comment-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'report-comment-modal';
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4';
    modal.innerHTML = `
      <div class="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-red-500/30">
        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
          🚩 Reportar comentario
        </h3>
        <p class="text-gray-400 text-sm mb-4">
          Selecciona el motivo del reporte:
        </p>
        <div class="space-y-2 mb-4">
          <label class="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition">
            <input type="radio" name="report-reason" value="spam" class="text-red-500">
            <span class="text-gray-200">Spam o publicidad</span>
          </label>
          <label class="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition">
            <input type="radio" name="report-reason" value="offensive" class="text-red-500">
            <span class="text-gray-200">Contenido ofensivo</span>
          </label>
          <label class="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition">
            <input type="radio" name="report-reason" value="harassment" class="text-red-500">
            <span class="text-gray-200">Acoso o intimidación</span>
          </label>
          <label class="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition">
            <input type="radio" name="report-reason" value="misinformation" class="text-red-500">
            <span class="text-gray-200">Información falsa</span>
          </label>
          <label class="flex items-center gap-3 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition">
            <input type="radio" name="report-reason" value="other" class="text-red-500">
            <span class="text-gray-200">Otro motivo</span>
          </label>
        </div>
        <div class="flex gap-3">
          <button id="cancel-report" class="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
            Cancelar
          </button>
          <button id="submit-report" class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold transition">
            Reportar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('#cancel-report')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    modal.querySelector('#submit-report')?.addEventListener('click', () => {
      const selectedReason = modal.querySelector('input[name="report-reason"]:checked')?.value;
      if (!selectedReason) {
        window.toast?.error('Selecciona un motivo');
        return;
      }
      this.reportComment(commentId, selectedReason);
      modal.remove();
      this.updateUI?.();
    });
  }

  async syncLikeToCloud(_commentId, _isUnlike) {
    // Implementar sincronización con Supabase cuando esté disponible
  }

  async syncReportToCloud(_report) {
    // Implementar sincronización con Supabase cuando esté disponible
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
   * @param {string} parentId - v2.9.368: ID del comentario padre (para threads)
   */
  async addComment(bookId, chapterId, text, isPublic = false, parentId = null) {
    // v2.9.371: Verificar anti-spam antes de procesar
    const spamStatus = this.checkSpamStatus();
    if (!spamStatus.canComment) {
      throw new Error(spamStatus.reason);
    }

    // Analizar contenido
    const contentAnalysis = this.analyzeContent(text);
    if (contentAnalysis.isSpam) {
      const wasBlocked = this.addWarning();
      if (wasBlocked) {
        throw new Error('Tu cuenta ha sido temporalmente bloqueada por actividad sospechosa.');
      }
      throw new Error(contentAnalysis.reason || 'El comentario no cumple con las normas de la comunidad.');
    }

    if (text.length < this.config.minCommentLength) {
      throw new Error(`El comentario debe tener al menos ${this.config.minCommentLength} caracteres`);
    }
    if (text.length > this.config.maxCommentLength) {
      throw new Error(`El comentario no puede exceder ${this.config.maxCommentLength} caracteres`);
    }

    // v2.9.371: Registrar comentario para tracking anti-spam
    this.recordComment();

    const comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      bookId,
      chapterId,
      text: text.trim(),
      userName: this.getUserName(),
      userId: this.getUserId(),
      createdAt: new Date().toISOString(),
      isPublic,
      synced: false,
      parentId: parentId || null, // v2.9.368: Thread support
      replies: [], // v2.9.368: Array de IDs de respuestas
      likeCount: 0, // v2.9.371: Contador de likes
      reportCount: 0 // v2.9.371: Contador de reportes
    };

    // Guardar localmente
    const key = `${bookId}:${chapterId}`;
    if (!this.comments[key]) {
      this.comments[key] = [];
    }

    // v2.9.368: Si es una respuesta, añadir referencia en el padre
    if (parentId) {
      const parentComment = this.comments[key].find(c => c.id === parentId);
      if (parentComment) {
        if (!parentComment.replies) parentComment.replies = [];
        parentComment.replies.push(comment.id);
      }
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
          <!-- v2.9.368: Reply indicator -->
          <div id="reply-indicator" class="hidden mb-3"></div>

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
          ` : this.getThreadedComments(comments).map(c => this.renderComment(c)).join('')}
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

  renderComment(comment, depth = 0) {
    const isOwn = comment.userId === this.getUserId();
    const date = new Date(comment.createdAt).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const canReply = depth < this.config.maxThreadDepth;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const marginClass = depth > 0 ? `ml-${Math.min(depth * 4, 12)}` : '';

    return `
      <div class="bg-slate-800/50 rounded-xl p-4 border border-gray-700/50 ${isOwn ? 'border-l-2 border-l-cyan-500' : ''} ${marginClass}" data-comment-id="${comment.id}">
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
          <div class="flex items-center gap-1">
            ${canReply ? `
              <button onclick="window.chapterComments?.setReplyTo('${comment.id}', '${this.escapeHtml(comment.userName)}')"
                      class="p-1 hover:bg-cyan-900/30 rounded text-gray-500 hover:text-cyan-400 transition-colors"
                      title="Responder">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                </svg>
              </button>
            ` : ''}
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
        </div>
        <p class="mt-3 text-gray-300 text-sm leading-relaxed">${this.escapeHtml(comment.text)}</p>
        <div class="mt-2 flex items-center gap-2">
          ${comment.isPublic ? '<span class="text-xs text-cyan-400/70">🌐 Público</span>' : '<span class="text-xs text-gray-500">🔒 Privado</span>'}
          ${comment.synced ? '<span class="text-xs text-green-400/70">✓ Sincronizado</span>' : ''}
          ${hasReplies ? `<span class="text-xs text-purple-400/70">💬 ${comment.replies.length} ${comment.replies.length === 1 ? 'respuesta' : 'respuestas'}</span>` : ''}
        </div>
      </div>
      ${hasReplies ? this.renderReplies(comment, depth) : ''}
    `;
  }

  // v2.9.368: Renderiza las respuestas de un comentario
  renderReplies(parentComment, depth) {
    const key = `${this.currentBookId}:${this.currentChapterId}`;
    const allComments = this.comments[key] || [];

    const replies = parentComment.replies
      .map(replyId => allComments.find(c => c.id === replyId))
      .filter(Boolean)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Orden cronológico

    if (replies.length === 0) return '';

    return `
      <div class="mt-2 space-y-2">
        ${replies.map(reply => this.renderComment(reply, depth + 1)).join('')}
      </div>
    `;
  }

  // v2.9.368: Establece el comentario al que se responde
  setReplyTo(commentId, userName) {
    this.replyingTo = commentId;

    const replyIndicator = document.getElementById('reply-indicator');
    const textarea = document.getElementById('new-comment-text');

    if (replyIndicator) {
      replyIndicator.innerHTML = `
        <div class="flex items-center justify-between p-2 bg-cyan-900/30 rounded-lg border border-cyan-500/30">
          <span class="text-sm text-cyan-400">↩️ Respondiendo a <strong>${this.escapeHtml(userName)}</strong></span>
          <button onclick="window.chapterComments?.cancelReply()" class="text-gray-400 hover:text-white p-1">✕</button>
        </div>
      `;
      replyIndicator.classList.remove('hidden');
    }

    if (textarea) {
      textarea.focus();
      textarea.placeholder = `Escribe tu respuesta a ${userName}...`;
    }
  }

  // v2.9.368: Cancela la respuesta
  cancelReply() {
    this.replyingTo = null;

    const replyIndicator = document.getElementById('reply-indicator');
    const textarea = document.getElementById('new-comment-text');

    if (replyIndicator) {
      replyIndicator.innerHTML = '';
      replyIndicator.classList.add('hidden');
    }

    if (textarea) {
      textarea.placeholder = 'Comparte tu reflexión sobre este capítulo...';
    }
  }

  // v2.9.368: Obtiene comentarios organizados en threads (solo raíz)
  getThreadedComments(comments) {
    return comments.filter(c => !c.parentId);
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
      // v2.9.368: Support for replies
      await this.addComment(
        this.currentBookId,
        this.currentChapterId,
        text,
        isPublicCheckbox?.checked || false,
        this.replyingTo // parentId for threads
      );

      const isReply = !!this.replyingTo;
      this.replyingTo = null; // Reset reply state

      window.toast?.success(isReply ? 'Respuesta añadida' : 'Comentario añadido');

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
