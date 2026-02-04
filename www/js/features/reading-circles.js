// ============================================================================
// READING CIRCLES - Círculos de Lectura Compartida
// ============================================================================
// v2.9.372: Real-time sync mejorado, chat en tiempo real
// Funciona offline-first con localStorage, sincroniza con Supabase cuando disponible

class ReadingCircles {
  constructor() {
    this.circles = this.loadLocalCircles();
    this.modalElement = null;
    this.currentCircleId = null;

    // v2.9.372: Estado de sync en tiempo real
    this.syncInterval = null;
    this.lastSyncTime = 0;
    this.isOnline = navigator.onLine;
    this.typingUsers = new Map(); // Map of circleId -> Set of userIds typing

    // Configuración
    this.config = {
      maxCircleNameLength: 50,
      maxDescriptionLength: 200,
      maxMembersPerCircle: 20,
      inviteCodeLength: 8,
      syncIntervalMs: 10000, // Sync cada 10 segundos
      typingTimeoutMs: 3000  // Typing indicator timeout
    };

    // v2.9.372: Iniciar listeners de conectividad
    this.initConnectivityListeners();
  }

  // ==========================================================================
  // v2.9.372: REAL-TIME SYNC
  // ==========================================================================

  initConnectivityListeners() {
    this._onlineHandler = () => {
      this.isOnline = true;
      this.startRealtimeSync();
      window.toast?.success('Conexión restaurada');
    };

    this._offlineHandler = () => {
      this.isOnline = false;
      this.stopRealtimeSync();
      window.toast?.warn('Sin conexión - Modo offline');
    };

    window.addEventListener('online', this._onlineHandler);
    window.addEventListener('offline', this._offlineHandler);
  }

  destroyConnectivityListeners() {
    if (this._onlineHandler) {
      window.removeEventListener('online', this._onlineHandler);
      this._onlineHandler = null;
    }
    if (this._offlineHandler) {
      window.removeEventListener('offline', this._offlineHandler);
      this._offlineHandler = null;
    }
  }

  startRealtimeSync() {
    if (this.syncInterval) return;
    if (!this.isSupabaseAvailable()) return;

    // Sync inicial
    this.syncAllCircles();

    // Sync periódico (solo cuando app visible)
    this.syncInterval = setInterval(() => {
      if (document.hidden) return;
      this.syncAllCircles();
    }, this.config.syncIntervalMs);

    logger.log('[ReadingCircles] Real-time sync iniciado');
  }

  stopRealtimeSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    logger.log('[ReadingCircles] Real-time sync detenido');
  }

  async syncAllCircles() {
    if (!this.isSupabaseAvailable()) return;

    try {
      const cloudCircles = await this.fetchMyCirclesFromCloud();

      // Merge cloud data with local
      for (const cloudCircle of cloudCircles) {
        const localIndex = this.circles.myCircles.findIndex(c => c.id === cloudCircle.id);

        if (localIndex === -1) {
          // Nuevo círculo de la nube
          this.circles.myCircles.push(cloudCircle);
        } else {
          // Actualizar si la versión de la nube es más reciente
          const localCircle = this.circles.myCircles[localIndex];
          const cloudUpdated = new Date(cloudCircle.activity?.[0]?.timestamp || 0);
          const localUpdated = new Date(localCircle.activity?.[0]?.timestamp || 0);

          if (cloudUpdated > localUpdated) {
            this.circles.myCircles[localIndex] = cloudCircle;
          }
        }
      }

      this.saveLocalCircles();
      this.lastSyncTime = Date.now();

      // Actualizar UI si el modal está abierto
      if (this.modalElement && this.currentCircleId) {
        this.refreshCircleDetail();
      }
    } catch (error) {
      logger.warn('[ReadingCircles] Error syncing:', error);
    }
  }

  refreshCircleDetail() {
    const circle = this.getCircle(this.currentCircleId);
    if (!circle) return;

    const tabContent = document.getElementById('tab-content');
    const activeTab = document.querySelector('[id^="tab-"].border-emerald-500');

    if (tabContent && activeTab) {
      if (activeTab.id === 'tab-members') {
        tabContent.innerHTML = this.renderMembersTab(circle);
      } else if (activeTab.id === 'tab-activity') {
        tabContent.innerHTML = this.renderActivityTab(circle);
      } else if (activeTab.id === 'tab-chat') {
        tabContent.innerHTML = this.renderChatTab(circle);
        this.scrollChatToBottom();
      }
    }
  }

  // ==========================================================================
  // v2.9.372: CHAT EN TIEMPO REAL
  // ==========================================================================

  /**
   * Enviar mensaje de chat (diferente de actividad)
   */
  sendChatMessage(circleId, message) {
    if (!message || message.trim().length < 1) return;

    const circle = this.circles.myCircles.find(c => c.id === circleId);
    if (!circle) return;

    // Inicializar array de chat si no existe
    if (!circle.chat) {
      circle.chat = [];
    }

    const chatMessage = {
      id: `msg-${Date.now()}`,
      userId: this.getUserId(),
      userName: this.getUserName(),
      message: message.trim().substring(0, 500),
      timestamp: new Date().toISOString(),
      read: [this.getUserId()]
    };

    circle.chat.push(chatMessage);

    // Mantener solo los últimos 100 mensajes
    if (circle.chat.length > 100) {
      circle.chat = circle.chat.slice(-100);
    }

    this.saveLocalCircles();
    this.syncCircleToCloud(circle);

    // Actualizar UI
    if (this.currentCircleId === circleId) {
      this.refreshCircleDetail();
    }

    return chatMessage;
  }

  /**
   * Indicador de "está escribiendo"
   */
  setTypingStatus(circleId, isTyping) {
    if (!this.isSupabaseAvailable()) return;

    // Local typing indicator
    if (!this.typingUsers.has(circleId)) {
      this.typingUsers.set(circleId, new Set());
    }

    const typingSet = this.typingUsers.get(circleId);

    if (isTyping) {
      typingSet.add(this.getUserId());

      // Auto-clear después de timeout
      setTimeout(() => {
        typingSet.delete(this.getUserId());
        this.updateTypingIndicator(circleId);
      }, this.config.typingTimeoutMs);
    } else {
      typingSet.delete(this.getUserId());
    }

    this.updateTypingIndicator(circleId);
  }

  updateTypingIndicator(circleId) {
    const indicator = document.getElementById('typing-indicator');
    if (!indicator) return;

    const typingSet = this.typingUsers.get(circleId);
    if (!typingSet || typingSet.size === 0) {
      indicator.classList.add('hidden');
      return;
    }

    // Obtener nombres de usuarios escribiendo (excepto yo)
    const circle = this.getCircle(circleId);
    if (!circle) return;

    const typingNames = [];
    for (const userId of typingSet) {
      if (userId !== this.getUserId()) {
        const member = circle.members.find(m => m.id === userId);
        if (member) {
          typingNames.push(member.name.split(' ')[0]);
        }
      }
    }

    if (typingNames.length === 0) {
      indicator.classList.add('hidden');
    } else {
      indicator.classList.remove('hidden');
      const text = typingNames.length === 1
        ? `${typingNames[0]} está escribiendo...`
        : `${typingNames.join(', ')} están escribiendo...`;
      indicator.textContent = text;
    }
  }

  /**
   * Marcar mensajes como leídos
   */
  markChatAsRead(circleId) {
    const circle = this.getCircle(circleId);
    if (!circle || !circle.chat) return;

    let updated = false;
    for (const msg of circle.chat) {
      if (!msg.read.includes(this.getUserId())) {
        msg.read.push(this.getUserId());
        updated = true;
      }
    }

    if (updated) {
      this.saveLocalCircles();
      // No sync para evitar overhead
    }
  }

  /**
   * Contar mensajes no leídos
   */
  getUnreadCount(circleId) {
    const circle = this.getCircle(circleId);
    if (!circle || !circle.chat) return 0;

    return circle.chat.filter(msg =>
      msg.userId !== this.getUserId() &&
      !msg.read.includes(this.getUserId())
    ).length;
  }

  scrollChatToBottom() {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 50);
    }
  }

  renderChatTab(circle) {
    if (!circle.chat || circle.chat.length === 0) {
      return `
        <div class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-2">💬</div>
          <p>No hay mensajes aún</p>
          <p class="text-sm mt-1">¡Sé el primero en saludar!</p>
        </div>
      `;
    }

    // Agrupar mensajes por día
    const messagesByDay = {};
    for (const msg of circle.chat) {
      const day = new Date(msg.timestamp).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      if (!messagesByDay[day]) {
        messagesByDay[day] = [];
      }
      messagesByDay[day].push(msg);
    }

    let html = '<div id="chat-messages" class="space-y-4 max-h-80 overflow-y-auto pr-2">';

    for (const [day, messages] of Object.entries(messagesByDay)) {
      // Separador de día
      html += `
        <div class="flex items-center gap-2 my-4">
          <div class="flex-1 h-px bg-gray-700"></div>
          <span class="text-xs text-gray-500 capitalize">${day}</span>
          <div class="flex-1 h-px bg-gray-700"></div>
        </div>
      `;

      for (const msg of messages) {
        const isMe = msg.userId === this.getUserId();
        const time = new Date(msg.timestamp).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });

        html += `
          <div class="flex ${isMe ? 'justify-end' : 'justify-start'}">
            <div class="max-w-[80%] ${isMe
              ? 'bg-emerald-600/30 border-emerald-500/30'
              : 'bg-slate-800/50 border-gray-700/50'
            } border rounded-2xl px-4 py-2 ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}">
              ${!isMe ? `<p class="text-xs text-cyan-400 font-medium mb-1">${this.escapeHtml(msg.userName)}</p>` : ''}
              <p class="text-sm text-white">${this.escapeHtml(msg.message)}</p>
              <p class="text-xs text-gray-500 mt-1 ${isMe ? 'text-right' : ''}">${time}</p>
            </div>
          </div>
        `;
      }
    }

    html += '</div>';

    // Indicador de "está escribiendo"
    html += '<p id="typing-indicator" class="text-xs text-gray-400 italic mt-2 hidden"></p>';

    return html;
  }

  // ==========================================================================
  // PERSISTENCIA LOCAL
  // ==========================================================================

  loadLocalCircles() {
    try {
      return JSON.parse(localStorage.getItem('reading-circles')) || {
        myCircles: [],      // Círculos que he creado o a los que me he unido
        invitations: []     // Invitaciones pendientes
      };
    } catch {
      return { myCircles: [], invitations: [] };
    }
  }

  saveLocalCircles() {
    try {
      localStorage.setItem('reading-circles', JSON.stringify(this.circles));
    } catch (error) {
      logger.error('[ReadingCircles] Error guardando círculos:', error);
    }
  }

  // ==========================================================================
  // GESTIÓN DE CÍRCULOS
  // ==========================================================================

  /**
   * Crea un nuevo círculo de lectura
   */
  createCircle(name, description, bookId) {
    if (!name || name.length < 3) {
      throw new Error('El nombre debe tener al menos 3 caracteres');
    }
    if (name.length > this.config.maxCircleNameLength) {
      throw new Error(`El nombre no puede exceder ${this.config.maxCircleNameLength} caracteres`);
    }

    const circle = {
      id: `circle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      description: (description || '').trim().substring(0, this.config.maxDescriptionLength),
      bookId: bookId,
      creatorId: this.getUserId(),
      creatorName: this.getUserName(),
      inviteCode: this.generateInviteCode(),
      createdAt: new Date().toISOString(),
      members: [{
        id: this.getUserId(),
        name: this.getUserName(),
        role: 'admin',
        joinedAt: new Date().toISOString(),
        progress: this.getCurrentProgress(bookId)
      }],
      activity: [{
        type: 'circle_created',
        userId: this.getUserId(),
        userName: this.getUserName(),
        timestamp: new Date().toISOString(),
        message: 'creó el círculo'
      }],
      synced: false
    };

    this.circles.myCircles.push(circle);
    this.saveLocalCircles();

    // Sincronizar con Supabase si disponible
    this.syncCircleToCloud(circle);

    return circle;
  }

  /**
   * Unirse a un círculo usando código de invitación
   */
  async joinCircle(inviteCode) {
    const normalizedCode = inviteCode.toUpperCase().trim();

    // Buscar primero localmente
    let circle = this.circles.myCircles.find(c => c.inviteCode === normalizedCode);

    // Si no está local, buscar en la nube
    if (!circle && this.isSupabaseAvailable()) {
      circle = await this.findCircleByCode(normalizedCode);
    }

    if (!circle) {
      throw new Error('Código de invitación inválido');
    }

    // Verificar si ya soy miembro
    if (circle.members.some(m => m.id === this.getUserId())) {
      throw new Error('Ya eres miembro de este círculo');
    }

    // Verificar límite de miembros
    if (circle.members.length >= this.config.maxMembersPerCircle) {
      throw new Error('El círculo ha alcanzado el límite de miembros');
    }

    // Añadir como miembro
    const newMember = {
      id: this.getUserId(),
      name: this.getUserName(),
      role: 'member',
      joinedAt: new Date().toISOString(),
      progress: this.getCurrentProgress(circle.bookId)
    };

    circle.members.push(newMember);

    // Añadir actividad
    circle.activity.unshift({
      type: 'member_joined',
      userId: this.getUserId(),
      userName: this.getUserName(),
      timestamp: new Date().toISOString(),
      message: 'se unió al círculo'
    });

    // Guardar localmente si no existe
    if (!this.circles.myCircles.find(c => c.id === circle.id)) {
      this.circles.myCircles.push(circle);
    }

    this.saveLocalCircles();
    this.syncCircleToCloud(circle);

    return circle;
  }

  /**
   * Salir de un círculo
   */
  leaveCircle(circleId) {
    const circleIndex = this.circles.myCircles.findIndex(c => c.id === circleId);
    if (circleIndex === -1) return;

    const circle = this.circles.myCircles[circleIndex];
    const memberIndex = circle.members.findIndex(m => m.id === this.getUserId());

    if (memberIndex === -1) return;

    const member = circle.members[memberIndex];

    // Si soy el único admin y hay otros miembros, transferir admin
    if (member.role === 'admin') {
      const otherMembers = circle.members.filter(m => m.id !== this.getUserId());
      if (otherMembers.length > 0) {
        otherMembers[0].role = 'admin';
        circle.activity.unshift({
          type: 'admin_transferred',
          userId: otherMembers[0].id,
          userName: otherMembers[0].name,
          timestamp: new Date().toISOString(),
          message: 'es el nuevo administrador'
        });
      }
    }

    // Remover miembro
    circle.members.splice(memberIndex, 1);

    // Añadir actividad
    circle.activity.unshift({
      type: 'member_left',
      userId: this.getUserId(),
      userName: this.getUserName(),
      timestamp: new Date().toISOString(),
      message: 'abandonó el círculo'
    });

    // Si no quedan miembros, eliminar el círculo
    if (circle.members.length === 0) {
      this.circles.myCircles.splice(circleIndex, 1);
      this.deleteCircleFromCloud(circleId);
    } else {
      this.syncCircleToCloud(circle);
    }

    this.saveLocalCircles();
  }

  /**
   * Actualizar mi progreso en un círculo
   */
  updateMyProgress(circleId) {
    const circle = this.circles.myCircles.find(c => c.id === circleId);
    if (!circle) return;

    const member = circle.members.find(m => m.id === this.getUserId());
    if (!member) return;

    const newProgress = this.getCurrentProgress(circle.bookId);
    const oldProgress = member.progress?.percentage || 0;

    member.progress = newProgress;
    member.lastActive = new Date().toISOString();

    // Añadir actividad si hay cambio significativo (más de 5%)
    if (newProgress.percentage - oldProgress >= 5) {
      circle.activity.unshift({
        type: 'progress_update',
        userId: this.getUserId(),
        userName: this.getUserName(),
        timestamp: new Date().toISOString(),
        message: `avanzó a ${newProgress.percentage}%`,
        data: newProgress
      });

      // Mantener solo las últimas 50 actividades
      if (circle.activity.length > 50) {
        circle.activity = circle.activity.slice(0, 50);
      }
    }

    this.saveLocalCircles();
    this.syncCircleToCloud(circle);
  }

  /**
   * Añadir mensaje al círculo
   */
  addMessage(circleId, message) {
    if (!message || message.trim().length < 2) return;

    const circle = this.circles.myCircles.find(c => c.id === circleId);
    if (!circle) return;

    circle.activity.unshift({
      type: 'message',
      userId: this.getUserId(),
      userName: this.getUserName(),
      timestamp: new Date().toISOString(),
      message: message.trim().substring(0, 500)
    });

    // Mantener solo las últimas 50 actividades
    if (circle.activity.length > 50) {
      circle.activity = circle.activity.slice(0, 50);
    }

    this.saveLocalCircles();
    this.syncCircleToCloud(circle);
  }

  // ==========================================================================
  // SUPABASE SYNC
  // ==========================================================================

  isSupabaseAvailable() {
    return !!(window.supabaseConfig?.url &&
              window.supabaseSyncHelper?.supabase &&
              window.authHelper?.user);
  }

  async syncCircleToCloud(circle) {
    if (!this.isSupabaseAvailable()) return;

    try {
      const { error } = await window.supabaseSyncHelper.supabase
        .from('reading_circles')
        .upsert({
          id: circle.id,
          name: circle.name,
          description: circle.description,
          book_id: circle.bookId,
          creator_id: circle.creatorId,
          invite_code: circle.inviteCode,
          members: JSON.stringify(circle.members),
          activity: JSON.stringify(circle.activity),
          created_at: circle.createdAt,
          updated_at: new Date().toISOString()
        });

      if (!error) {
        circle.synced = true;
        this.saveLocalCircles();
      }
    } catch (error) {
      logger.warn('[ReadingCircles] Error syncing circle:', error);
    }
  }

  async findCircleByCode(inviteCode) {
    if (!this.isSupabaseAvailable()) return null;

    try {
      const { data, error } = await window.supabaseSyncHelper.supabase
        .from('reading_circles')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        bookId: data.book_id,
        creatorId: data.creator_id,
        inviteCode: data.invite_code,
        members: JSON.parse(data.members || '[]'),
        activity: JSON.parse(data.activity || '[]'),
        createdAt: data.created_at,
        synced: true
      };
    } catch (error) {
      logger.error('[ReadingCircles] Error finding circle:', error);
      return null;
    }
  }

  async deleteCircleFromCloud(circleId) {
    if (!this.isSupabaseAvailable()) return;

    try {
      await window.supabaseSyncHelper.supabase
        .from('reading_circles')
        .delete()
        .eq('id', circleId);
    } catch (error) {
      logger.warn('[ReadingCircles] Error deleting circle from cloud:', error);
    }
  }

  async fetchMyCirclesFromCloud() {
    if (!this.isSupabaseAvailable()) return [];

    try {
      const { data, error } = await window.supabaseSyncHelper.supabase
        .from('reading_circles')
        .select('*')
        .contains('members', JSON.stringify([{ id: this.getUserId() }]));

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        bookId: row.book_id,
        creatorId: row.creator_id,
        inviteCode: row.invite_code,
        members: JSON.parse(row.members || '[]'),
        activity: JSON.parse(row.activity || '[]'),
        createdAt: row.created_at,
        synced: true
      }));
    } catch (error) {
      logger.error('[ReadingCircles] Error fetching circles:', error);
      return [];
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < this.config.inviteCodeLength; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  getUserId() {
    return window.authHelper?.user?.id || `local-${this.getLocalUserId()}`;
  }

  getUserName() {
    if (window.authHelper?.user?.user_metadata?.name) {
      return window.authHelper.user.user_metadata.name;
    }
    if (window.authHelper?.user?.email) {
      return window.authHelper.user.email.split('@')[0];
    }
    return localStorage.getItem('user-display-name') || 'Lector Anónimo';
  }

  getLocalUserId() {
    let id = localStorage.getItem('local-user-id');
    if (!id) {
      id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('local-user-id', id);
    }
    return id;
  }

  getCurrentProgress(bookId) {
    if (!window.bookEngine) return { percentage: 0, chaptersRead: 0, totalChapters: 0 };

    const progress = window.bookEngine.getProgress(bookId);
    return {
      percentage: progress?.percentage || 0,
      chaptersRead: progress?.chaptersRead || 0,
      totalChapters: progress?.totalChapters || 0,
      currentChapter: window.bookReader?.currentChapter?.title || null
    };
  }

  getBookTitle(bookId) {
    if (!window.bookEngine) return bookId;
    const books = window.bookEngine.getAllBooks();
    const book = books.find(b => b.id === bookId);
    return book?.title || bookId;
  }

  getMyCircles() {
    return this.circles.myCircles;
  }

  getCircle(circleId) {
    return this.circles.myCircles.find(c => c.id === circleId);
  }

  // ==========================================================================
  // UI - MODAL PRINCIPAL
  // ==========================================================================

  show() {
    this.close();

    // Actualizar progreso en todos mis círculos
    this.circles.myCircles.forEach(circle => {
      this.updateMyProgress(circle.id);
    });

    const modal = document.createElement('div');
    modal.id = 'reading-circles-modal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="window.readingCircles?.close()"></div>
      <div class="relative bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-700">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <span class="text-2xl">👥</span> Círculos de Lectura
            </h2>
            <p class="text-xs text-gray-400 mt-0.5">Lee junto a otros y comparte tu progreso</p>
          </div>
          <button onclick="window.readingCircles?.close()"
                  class="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Actions Bar -->
        <div class="p-4 border-b border-gray-700 bg-slate-800/50 flex flex-wrap gap-2">
          <button onclick="window.readingCircles?.showCreateForm()"
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Crear Círculo
          </button>
          <button onclick="window.readingCircles?.showJoinForm()"
                  class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
            Unirse con Código
          </button>
        </div>

        <!-- Content -->
        <div id="circles-content" class="flex-1 overflow-y-auto p-4">
          ${this.renderCirclesList()}
        </div>

        <!-- Footer -->
        <div class="p-3 border-t border-gray-700 text-center">
          <p class="text-xs text-gray-500">
            ${this.isSupabaseAvailable()
              ? '🌐 Conectado - Los círculos se sincronizan en tiempo real'
              : '📱 Modo offline - Inicia sesión para sincronizar círculos'}
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

  renderCirclesList() {
    const circles = this.getMyCircles();

    if (circles.length === 0) {
      return `
        <div class="text-center py-12 text-gray-500">
          <div class="text-5xl mb-4">📚</div>
          <p class="text-lg mb-2">No tienes círculos de lectura</p>
          <p class="text-sm">Crea uno nuevo o únete con un código de invitación</p>
        </div>
      `;
    }

    return circles.map(circle => this.renderCircleCard(circle)).join('');
  }

  renderCircleCard(circle) {
    const memberCount = circle.members.length;
    const myMember = circle.members.find(m => m.id === this.getUserId());
    const isAdmin = myMember?.role === 'admin';
    const bookTitle = this.getBookTitle(circle.bookId);

    // Calcular progreso promedio
    const avgProgress = circle.members.reduce((sum, m) => sum + (m.progress?.percentage || 0), 0) / memberCount;

    return `
      <div class="bg-slate-800/50 rounded-xl p-4 mb-4 border border-gray-700/50 hover:border-gray-600 transition-colors cursor-pointer"
           onclick="window.readingCircles?.showCircleDetail('${circle.id}')">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-bold text-white truncate">${this.escapeHtml(circle.name)}</h3>
              ${isAdmin ? '<span class="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Admin</span>' : ''}
            </div>
            <p class="text-sm text-gray-400 truncate mb-2">📖 ${this.escapeHtml(bookTitle)}</p>
            ${circle.description ? `<p class="text-xs text-gray-500 line-clamp-2 mb-2">${this.escapeHtml(circle.description)}</p>` : ''}
            <div class="flex items-center gap-4 text-xs text-gray-500">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                </svg>
                ${memberCount} miembro${memberCount !== 1 ? 's' : ''}
              </span>
              <span>📊 ${Math.round(avgProgress)}% promedio</span>
            </div>
          </div>
          <div class="flex flex-col items-end gap-2">
            <!-- Progress ring -->
            <div class="relative w-12 h-12">
              <svg class="w-12 h-12 transform -rotate-90">
                <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="4" fill="none" class="text-gray-700"/>
                <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="4" fill="none"
                        class="text-emerald-500"
                        stroke-dasharray="${Math.round(avgProgress * 1.26)} 126"
                        stroke-linecap="round"/>
              </svg>
              <span class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                ${Math.round(avgProgress)}%
              </span>
            </div>
          </div>
        </div>
        <!-- Recent activity preview -->
        ${circle.activity.length > 0 ? `
          <div class="mt-3 pt-3 border-t border-gray-700/50">
            <p class="text-xs text-gray-500">
              <span class="text-gray-400">${this.escapeHtml(circle.activity[0].userName)}</span>
              ${this.escapeHtml(circle.activity[0].message)}
              <span class="text-gray-600">· ${this.formatTimeAgo(circle.activity[0].timestamp)}</span>
            </p>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ==========================================================================
  // UI - CREAR CÍRCULO
  // ==========================================================================

  showCreateForm() {
    const content = document.getElementById('circles-content');
    if (!content) return;

    // Obtener libros disponibles
    const books = window.bookEngine?.getAllBooks() || [];
    const currentBookId = window.bookEngine?.getCurrentBook() || '';

    content.innerHTML = `
      <div class="max-w-md mx-auto">
        <button onclick="window.readingCircles?.refreshList()"
                class="flex items-center gap-2 text-gray-400 hover:text-white mb-4 text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver
        </button>

        <h3 class="text-lg font-bold text-white mb-4">Crear Nuevo Círculo</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Nombre del Círculo *</label>
            <input type="text" id="circle-name"
                   class="w-full p-3 bg-slate-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                   placeholder="Ej: Club de lectura del despertar"
                   maxlength="${this.config.maxCircleNameLength}">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Descripción (opcional)</label>
            <textarea id="circle-description"
                      class="w-full p-3 bg-slate-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      placeholder="¿Cuál es el objetivo del círculo?"
                      rows="2"
                      maxlength="${this.config.maxDescriptionLength}"></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Libro a Leer *</label>
            <select id="circle-book"
                    class="w-full p-3 bg-slate-700 border border-gray-600 rounded-xl text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none">
              ${books.map(b => `
                <option value="${b.id}" ${b.id === currentBookId ? 'selected' : ''}>${this.escapeHtml(b.title)}</option>
              `).join('')}
            </select>
          </div>

          <button onclick="window.readingCircles?.submitCreateForm()"
                  class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors">
            Crear Círculo
          </button>
        </div>
      </div>
    `;
  }

  submitCreateForm() {
    const name = document.getElementById('circle-name')?.value;
    const description = document.getElementById('circle-description')?.value;
    const bookId = document.getElementById('circle-book')?.value;

    try {
      const circle = this.createCircle(name, description, bookId);
      window.toast?.success('Círculo creado exitosamente');
      this.showCircleDetail(circle.id);
    } catch (error) {
      window.toast?.error(error.message);
    }
  }

  // ==========================================================================
  // UI - UNIRSE A CÍRCULO
  // ==========================================================================

  showJoinForm() {
    const content = document.getElementById('circles-content');
    if (!content) return;

    content.innerHTML = `
      <div class="max-w-md mx-auto">
        <button onclick="window.readingCircles?.refreshList()"
                class="flex items-center gap-2 text-gray-400 hover:text-white mb-4 text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver
        </button>

        <h3 class="text-lg font-bold text-white mb-4">Unirse a un Círculo</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Código de Invitación</label>
            <input type="text" id="invite-code"
                   class="w-full p-3 bg-slate-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none text-center text-xl tracking-widest font-mono uppercase"
                   placeholder="XXXXXXXX"
                   maxlength="${this.config.inviteCodeLength}">
            <p class="text-xs text-gray-500 mt-1">Ingresa el código de 8 caracteres que te compartieron</p>
          </div>

          <button onclick="window.readingCircles?.submitJoinForm()"
                  class="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-colors">
            Unirse al Círculo
          </button>
        </div>
      </div>
    `;

    // Focus en el input
    setTimeout(() => document.getElementById('invite-code')?.focus(), 100);
  }

  async submitJoinForm() {
    const inviteCode = document.getElementById('invite-code')?.value;

    if (!inviteCode || inviteCode.length < this.config.inviteCodeLength) {
      window.toast?.error('Ingresa un código de invitación válido');
      return;
    }

    try {
      const circle = await this.joinCircle(inviteCode);
      window.toast?.success(`Te uniste a "${circle.name}"`);
      this.showCircleDetail(circle.id);
    } catch (error) {
      window.toast?.error(error.message);
    }
  }

  // ==========================================================================
  // UI - DETALLE DE CÍRCULO
  // ==========================================================================

  showCircleDetail(circleId) {
    const circle = this.getCircle(circleId);
    if (!circle) return;

    this.currentCircleId = circleId;
    const content = document.getElementById('circles-content');
    if (!content) return;

    const isAdmin = circle.members.find(m => m.id === this.getUserId())?.role === 'admin';
    const bookTitle = this.getBookTitle(circle.bookId);

    content.innerHTML = `
      <div>
        <button onclick="window.readingCircles?.refreshList()"
                class="flex items-center gap-2 text-gray-400 hover:text-white mb-4 text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver a mis círculos
        </button>

        <!-- Circle Header -->
        <div class="bg-gradient-to-r from-emerald-900/50 to-cyan-900/50 rounded-xl p-4 mb-4 border border-emerald-700/30">
          <h3 class="text-xl font-bold text-white mb-1">${this.escapeHtml(circle.name)}</h3>
          <p class="text-sm text-gray-300 mb-2">📖 ${this.escapeHtml(bookTitle)}</p>
          ${circle.description ? `<p class="text-sm text-gray-400">${this.escapeHtml(circle.description)}</p>` : ''}

          <div class="mt-3 flex flex-wrap items-center gap-3">
            <div class="bg-slate-800/50 px-3 py-1.5 rounded-lg">
              <span class="text-xs text-gray-400">Código:</span>
              <span class="font-mono font-bold text-emerald-400 ml-1">${circle.inviteCode}</span>
              <button onclick="window.readingCircles?.copyInviteCode('${circle.inviteCode}')"
                      class="ml-2 text-gray-400 hover:text-white">
                <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </button>
            </div>
            <button onclick="window.readingCircles?.shareCircle('${circle.id}')"
                    class="bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 px-3 py-1.5 rounded-lg text-sm transition-colors">
              Compartir
            </button>
            <button onclick="window.readingCircles?.confirmLeave('${circle.id}')"
                    class="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded-lg text-sm transition-colors">
              Salir
            </button>
          </div>
        </div>

        <!-- Tabs (v2.9.372: añadida pestaña de Chat) -->
        <div class="flex border-b border-gray-700 mb-4">
          <button id="tab-members" onclick="window.readingCircles?.showTab('members')"
                  class="px-4 py-2 text-sm font-medium text-white border-b-2 border-emerald-500">
            Miembros (${circle.members.length})
          </button>
          <button id="tab-chat" onclick="window.readingCircles?.showTab('chat')"
                  class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white border-b-2 border-transparent relative">
            💬 Chat
            ${this.getUnreadCount(circleId) > 0 ? `<span class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">${this.getUnreadCount(circleId)}</span>` : ''}
          </button>
          <button id="tab-activity" onclick="window.readingCircles?.showTab('activity')"
                  class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white border-b-2 border-transparent">
            Actividad
          </button>
        </div>

        <!-- Tab Content -->
        <div id="tab-content">
          ${this.renderMembersTab(circle)}
        </div>

        <!-- Chat Input (v2.9.372: mejorado con indicador de escritura) -->
        <div class="mt-4 pt-4 border-t border-gray-700">
          <div class="flex gap-2">
            <input type="text" id="circle-message"
                   class="flex-1 p-3 bg-slate-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none"
                   placeholder="Escribe un mensaje..."
                   maxlength="500"
                   oninput="window.readingCircles?.setTypingStatus('${circleId}', this.value.length > 0)"
                   onkeypress="if(event.key==='Enter')window.readingCircles?.handleChatSend()">
            <button onclick="window.readingCircles?.handleChatSend()"
                    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors">
              Enviar
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderMembersTab(circle) {
    return `
      <div class="space-y-3">
        ${circle.members
          .sort((a, b) => (b.progress?.percentage || 0) - (a.progress?.percentage || 0))
          .map((member, index) => `
            <div class="flex items-center gap-3 bg-slate-800/30 rounded-xl p-3 ${member.id === this.getUserId() ? 'ring-1 ring-emerald-500/50' : ''}">
              <div class="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-white font-bold text-sm">
                ${index + 1}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-white truncate">${this.escapeHtml(member.name)}</span>
                  ${member.role === 'admin' ? '<span class="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">Admin</span>' : ''}
                  ${member.id === this.getUserId() ? '<span class="text-xs text-emerald-400">(tú)</span>' : ''}
                </div>
                <div class="text-xs text-gray-500">
                  ${member.progress?.currentChapter ? `Leyendo: ${member.progress.currentChapter}` : 'Sin actividad reciente'}
                </div>
              </div>
              <div class="text-right">
                <div class="text-lg font-bold text-emerald-400">${member.progress?.percentage || 0}%</div>
                <div class="text-xs text-gray-500">${member.progress?.chaptersRead || 0}/${member.progress?.totalChapters || 0}</div>
              </div>
            </div>
          `).join('')}
      </div>
    `;
  }

  renderActivityTab(circle) {
    if (circle.activity.length === 0) {
      return `
        <div class="text-center py-8 text-gray-500">
          <p>No hay actividad reciente</p>
        </div>
      `;
    }

    return `
      <div class="space-y-3">
        ${circle.activity.slice(0, 20).map(activity => `
          <div class="flex gap-3 ${activity.type === 'message' ? 'bg-slate-800/30 rounded-xl p-3' : 'py-2'}">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              ${activity.userName.charAt(0).toUpperCase()}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-baseline gap-2">
                <span class="font-medium text-white">${this.escapeHtml(activity.userName)}</span>
                <span class="text-xs text-gray-500">${this.formatTimeAgo(activity.timestamp)}</span>
              </div>
              <p class="text-sm ${activity.type === 'message' ? 'text-gray-200' : 'text-gray-400'}">
                ${this.escapeHtml(activity.message)}
              </p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  showTab(tabName) {
    const circle = this.getCircle(this.currentCircleId);
    if (!circle) return;

    const tabContent = document.getElementById('tab-content');
    const tabMembers = document.getElementById('tab-members');
    const tabChat = document.getElementById('tab-chat');
    const tabActivity = document.getElementById('tab-activity');

    if (!tabContent || !tabMembers || !tabActivity) return;

    // Reset tab styles
    const inactiveClass = 'px-4 py-2 text-sm font-medium text-gray-400 hover:text-white border-b-2 border-transparent';
    const activeClass = 'px-4 py-2 text-sm font-medium text-white border-b-2 border-emerald-500';

    tabMembers.className = inactiveClass;
    if (tabChat) tabChat.className = inactiveClass + ' relative';
    tabActivity.className = inactiveClass;

    if (tabName === 'members') {
      tabMembers.className = activeClass;
      tabContent.innerHTML = this.renderMembersTab(circle);
    } else if (tabName === 'chat') {
      if (tabChat) tabChat.className = activeClass + ' relative';
      tabContent.innerHTML = this.renderChatTab(circle);
      this.markChatAsRead(this.currentCircleId);
      this.scrollChatToBottom();
      // Iniciar sync más frecuente mientras el chat está abierto
      this.startRealtimeSync();
    } else {
      tabActivity.className = activeClass;
      tabContent.innerHTML = this.renderActivityTab(circle);
    }
  }

  /**
   * v2.9.372: Maneja el envío de mensajes (chat o actividad según la pestaña)
   */
  handleChatSend() {
    const input = document.getElementById('circle-message');
    if (!input || !this.currentCircleId) return;

    const message = input.value.trim();
    if (message.length < 1) {
      window.toast?.warn('Escribe un mensaje');
      return;
    }

    // Determinar si estamos en la pestaña de chat
    const chatTab = document.getElementById('tab-chat');
    const isInChatTab = chatTab?.classList.contains('border-emerald-500');

    if (isInChatTab) {
      // Enviar como mensaje de chat
      this.sendChatMessage(this.currentCircleId, message);
    } else {
      // Enviar como actividad (comportamiento anterior)
      this.addMessage(this.currentCircleId, message);
      this.showCircleDetail(this.currentCircleId);
      this.showTab('activity');
    }

    input.value = '';
    this.setTypingStatus(this.currentCircleId, false);
  }

  // ==========================================================================
  // UI - ACCIONES
  // ==========================================================================

  sendMessage() {
    const input = document.getElementById('circle-message');
    if (!input || !this.currentCircleId) return;

    const message = input.value.trim();
    if (message.length < 2) {
      window.toast?.warn('El mensaje es muy corto');
      return;
    }

    this.addMessage(this.currentCircleId, message);
    input.value = '';
    this.showCircleDetail(this.currentCircleId);
    this.showTab('activity');
  }

  copyInviteCode(code) {
    navigator.clipboard.writeText(code).then(() => {
      window.toast?.success('Código copiado');
    }).catch(() => {
      window.toast?.info(`Código: ${code}`);
    });
  }

  shareCircle(circleId) {
    const circle = this.getCircle(circleId);
    if (!circle) return;

    const shareText = `¡Únete a mi círculo de lectura "${circle.name}"!\n\nCódigo: ${circle.inviteCode}\n\nEstamos leyendo: ${this.getBookTitle(circle.bookId)}`;

    if (window.shareableMoments) {
      window.shareableMoments.showShareModal({
        type: 'circle_invite',
        title: `Invitación: ${circle.name}`,
        message: shareText,
        hashtags: ['ColeccionNuevoSer', 'CirculoDeLectura']
      });
    } else if (navigator.share) {
      navigator.share({
        title: `Círculo de Lectura: ${circle.name}`,
        text: shareText
      });
    } else {
      this.copyInviteCode(circle.inviteCode);
    }
  }

  confirmLeave(circleId) {
    const circle = this.getCircle(circleId);
    if (!circle) return;

    if (confirm(`¿Seguro que quieres salir del círculo "${circle.name}"?`)) {
      this.leaveCircle(circleId);
      window.toast?.info('Has salido del círculo');
      this.refreshList();
    }
  }

  refreshList() {
    const content = document.getElementById('circles-content');
    if (content) {
      content.innerHTML = this.renderCirclesList();
    }
    this.currentCircleId = null;
  }

  // ==========================================================================
  // HELPERS UI
  // ==========================================================================

  formatTimeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'ahora';
    if (diffMins < 60) return `hace ${diffMins}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays < 7) return `hace ${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
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
    this.currentCircleId = null;
    this.stopRealtimeSync();
    this.destroyConnectivityListeners();
  }
}

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================

window.ReadingCircles = ReadingCircles;
window.readingCircles = new ReadingCircles();

logger.log('[ReadingCircles] Sistema de círculos de lectura inicializado');
