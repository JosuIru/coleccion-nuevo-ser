/**
 * SUPPORT CHAT - Chat de Soporte IA con Claude
 * Sistema de soporte interactivo para usuarios
 *
 * Features:
 * - Chat directo con Claude para dudas de soporte
 * - Respuestas automaticas basadas en FAQ
 * - Escalado a admin cuando necesario
 * - Historial de conversaciones guardado
 * - Notificaciones al admin cuando se requiere atencion humana
 *
 * @version 1.0.0
 * @created 2025-01-15
 */

// Fallback logger
if (typeof logger === 'undefined') {
  window.logger = {
    debug: (...args) => console.log('[DEBUG]', ...args),
    log: (...args) => console.log('[LOG]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    info: (...args) => console.info('[INFO]', ...args)
  };
}

class SupportChat {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.conversationId = null;
    this.isTyping = false;
    this.needsHumanReview = false;

    // Sistema de categorias para routing
    this.categories = {
      billing: {
        label: 'Pagos y Suscripciones',
        icon: '💳',
        keywords: ['pago', 'suscripcion', 'factura', 'cobro', 'precio', 'cancelar', 'reembolso', 'token', 'credito', 'paypal', 'bitcoin', 'btc', 'stripe']
      },
      technical: {
        label: 'Problemas Tecnicos',
        icon: '🔧',
        keywords: ['error', 'bug', 'fallo', 'no funciona', 'crash', 'lento', 'problema', 'carga', 'sincroniza']
      },
      account: {
        label: 'Mi Cuenta',
        icon: '👤',
        keywords: ['cuenta', 'perfil', 'contrasena', 'password', 'email', 'eliminar', 'datos', 'privacidad']
      },
      content: {
        label: 'Contenido y Libros',
        icon: '📚',
        keywords: ['libro', 'capitulo', 'leer', 'audio', 'texto', 'contenido', 'acceso']
      },
      ai: {
        label: 'Funciones IA',
        icon: '🤖',
        keywords: ['ia', 'chat', 'tutor', 'quiz', 'resumen', 'voz', 'claude', 'inteligencia']
      },
      other: {
        label: 'Otro',
        icon: '❓',
        keywords: []
      }
    };

    // Respuestas rapidas FAQ
    this.quickReplies = [
      { text: 'Como compro tokens?', category: 'billing' },
      { text: 'No me funciona el audio', category: 'technical' },
      { text: 'Quiero cancelar mi suscripcion', category: 'billing' },
      { text: 'Tengo un problema tecnico', category: 'technical' },
      { text: 'Hablar con soporte humano', category: 'other' }
    ];

    this.init();
  }

  init() {
    // Crear boton flotante de soporte
    this.createFloatingButton();
    logger.debug('SupportChat initialized');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UI - BOTON FLOTANTE Y MODAL
  // ═══════════════════════════════════════════════════════════════════════════

  createFloatingButton() {
    // No crear si ya existe
    if (document.getElementById('support-chat-fab')) return;

    const fab = document.createElement('button');
    fab.id = 'support-chat-fab';
    fab.className = 'fixed bottom-20 right-4 z-[9000] w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg flex items-center justify-center text-white hover:scale-110 transition-all duration-300';
    fab.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
      </svg>
    `;
    fab.setAttribute('aria-label', 'Abrir chat de soporte');
    fab.addEventListener('click', () => this.toggle());

    document.body.appendChild(fab);
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTROL DEL FAB (mostrar/ocultar)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Ocultar el botón flotante (ej: al entrar al lector)
   */
  hideFab() {
    const fab = document.getElementById('support-chat-fab');
    if (fab) {
      fab.style.display = 'none';
    }
    // Si el chat está abierto, cerrarlo
    if (this.isOpen) {
      this.close();
    }
  }

  /**
   * Mostrar el botón flotante (ej: al salir del lector)
   */
  showFab() {
    const fab = document.getElementById('support-chat-fab');
    if (fab) {
      fab.style.display = 'flex';
    }
  }

  /**
   * Verificar si el FAB está visible
   */
  isFabVisible() {
    const fab = document.getElementById('support-chat-fab');
    return fab && fab.style.display !== 'none';
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.render();
    this.loadHistory();
  }

  close() {
    this.isOpen = false;
    const modal = document.getElementById('support-chat-modal');
    if (modal) {
      modal.classList.add('translate-y-full', 'opacity-0');
      setTimeout(() => modal.remove(), 300);
    }
  }

  render() {
    // Eliminar si existe
    const existing = document.getElementById('support-chat-modal');
    if (existing) existing.remove();

    const user = window.authHelper?.getUser();
    const isLoggedIn = !!user;

    const modal = document.createElement('div');
    modal.id = 'support-chat-modal';
    modal.className = 'fixed bottom-20 right-4 z-[9500] w-[360px] max-w-[calc(100vw-32px)] h-[500px] max-h-[calc(100vh-120px)] bg-slate-900 rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden transform transition-all duration-300';
    modal.innerHTML = `
      <!-- Header -->
      <div class="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 p-4 flex items-center justify-between border-b border-white/10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <span class="text-white text-lg">🤖</span>
          </div>
          <div>
            <h3 class="font-semibold text-white">Soporte IA</h3>
            <p class="text-xs text-slate-400">Respuestas instantaneas</p>
          </div>
        </div>
        <button id="support-chat-close" class="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <!-- Messages area -->
      <div id="support-chat-messages" class="flex-1 overflow-y-auto p-4 space-y-4">
        ${this.renderWelcomeMessage(isLoggedIn)}
      </div>

      <!-- Quick replies -->
      <div id="support-quick-replies" class="px-4 pb-2">
        <div class="flex flex-wrap gap-2">
          ${this.quickReplies.map(qr => `
            <button class="quick-reply-btn text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-full border border-white/10 transition-colors" data-text="${qr.text}">
              ${qr.text}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Input area -->
      <div class="p-4 border-t border-white/10">
        <div class="flex gap-2">
          <input type="text" id="support-chat-input" placeholder="${isLoggedIn ? 'Escribe tu pregunta...' : 'Inicia sesion para chatear'}"
                 class="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none ${!isLoggedIn ? 'opacity-50' : ''}"
                 ${!isLoggedIn ? 'disabled' : ''}>
          <button id="support-chat-send" class="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors" ${!isLoggedIn ? 'disabled' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </div>
        ${!isLoggedIn ? `
          <button id="support-login-btn" class="w-full mt-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors">
            Iniciar sesion para chatear
          </button>
        ` : ''}
      </div>
    `;

    document.body.appendChild(modal);
    this.attachEvents();

    // Animacion de entrada
    requestAnimationFrame(() => {
      modal.classList.remove('translate-y-full', 'opacity-0');
    });
  }

  renderWelcomeMessage(isLoggedIn) {
    if (this.messages.length > 0) {
      return this.messages.map(msg => this.renderMessage(msg)).join('');
    }

    return `
      <div class="assistant-message">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <span class="text-sm">🤖</span>
          </div>
          <div class="bg-white/5 rounded-2xl rounded-tl-none p-3 max-w-[80%]">
            <p class="text-slate-200 text-sm">
              Hola! Soy el asistente de soporte de Coleccion Nuevo Ser.
              ${isLoggedIn
                ? 'Puedo ayudarte con dudas sobre pagos, funciones de la app, problemas tecnicos, y mas. Como puedo ayudarte hoy?'
                : 'Para poder ayudarte mejor, por favor inicia sesion primero.'
              }
            </p>
          </div>
        </div>
      </div>
    `;
  }

  renderMessage(msg) {
    const isUser = msg.role === 'user';
    return `
      <div class="${isUser ? 'user-message flex justify-end' : 'assistant-message'}">
        <div class="flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}">
          ${!isUser ? `
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <span class="text-sm">🤖</span>
            </div>
          ` : ''}
          <div class="${isUser
            ? 'bg-cyan-500 text-white rounded-2xl rounded-tr-none'
            : 'bg-white/5 rounded-2xl rounded-tl-none'
          } p-3 max-w-[80%]">
            <p class="${isUser ? '' : 'text-slate-200'} text-sm whitespace-pre-wrap">${this.escapeHtml(msg.content)}</p>
          </div>
        </div>
      </div>
    `;
  }

  renderTypingIndicator() {
    return `
      <div id="typing-indicator" class="assistant-message">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <span class="text-sm">🤖</span>
          </div>
          <div class="bg-white/5 rounded-2xl rounded-tl-none p-3">
            <div class="flex gap-1">
              <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
              <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
              <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENTOS
  // ═══════════════════════════════════════════════════════════════════════════

  attachEvents() {
    // Cerrar
    document.getElementById('support-chat-close')?.addEventListener('click', () => this.close());

    // Enviar mensaje
    const input = document.getElementById('support-chat-input');
    const sendBtn = document.getElementById('support-chat-send');

    sendBtn?.addEventListener('click', () => this.sendMessage());
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Quick replies
    document.querySelectorAll('.quick-reply-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.text;
        if (text) {
          input.value = text;
          this.sendMessage();
        }
      });
    });

    // Login button
    document.getElementById('support-login-btn')?.addEventListener('click', () => {
      this.close();
      if (window.authModal) {
        window.authModal.show('login');
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENVIAR Y RECIBIR MENSAJES
  // ═══════════════════════════════════════════════════════════════════════════

  async sendMessage() {
    const input = document.getElementById('support-chat-input');
    const text = input?.value.trim();

    if (!text || this.isTyping) return;

    // Agregar mensaje del usuario
    this.addMessage({ role: 'user', content: text });
    input.value = '';

    // Mostrar typing indicator
    this.showTypingIndicator();

    // Detectar categoria
    const category = this.detectCategory(text);

    // Verificar si necesita atencion humana
    if (this.needsHumanAttention(text)) {
      await this.escalateToHuman(text, category);
      return;
    }

    try {
      // Llamar a la IA para respuesta
      const response = await this.getAIResponse(text, category);
      this.hideTypingIndicator();
      this.addMessage({ role: 'assistant', content: response });
    } catch (error) {
      logger.error('[SupportChat] Error getting AI response:', error);
      this.hideTypingIndicator();
      this.addMessage({
        role: 'assistant',
        content: 'Lo siento, hubo un problema al procesar tu mensaje. Por favor intenta de nuevo o contacta a irurag@gmail.com'
      });
    }

    // Guardar conversacion
    this.saveConversation();
  }

  async getAIResponse(userMessage, category) {
    // Construir contexto del sistema
    const systemContext = this.buildSystemContext(category);

    // Obtener perfil del usuario para contexto
    const profile = window.authHelper?.getProfile() || {};
    const userContext = `
Usuario: ${profile.full_name || 'Anonimo'}
Plan: ${profile.subscription_tier || 'free'}
Tokens disponibles: ${(profile.ai_credits_remaining || 0) + (profile.token_balance || 0)}
`;

    // Llamar a la API de soporte (usa Claude)
    // Usar URL absoluta para que funcione en Android
    const apiUrl = window.ENV?.SUPPORT_CHAT_API || 'https://gailu.net/api/support-chat.php';
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          category,
          systemContext,
          userContext,
          history: this.messages.slice(-6), // Ultimos 6 mensajes
          conversationId: this.conversationId
        })
      });

      if (!response.ok) {
        throw new Error('API error');
      }

      const data = await response.json();

      // Verificar si la IA sugiere escalado
      if (data.needsEscalation) {
        this.needsHumanReview = true;
        await this.notifyAdmin(userMessage, category, data.reason);
      }

      return data.response;
    } catch (error) {
      // Fallback a respuestas locales si la API falla
      return this.getFallbackResponse(userMessage, category);
    }
  }

  buildSystemContext(category) {
    const contexts = {
      billing: `
Eres un asistente de soporte especializado en pagos y suscripciones de Coleccion Nuevo Ser.
Informacion clave:
- Planes: Free (5K tokens gratis/mes), Premium (4.99€/mes, 100K tokens), Pro (9.99€/mes, 300K tokens)
- Paquetes de tokens: Basico 50K/2.99€, Estandar 150K/7.99€, Premium 500K/19.99€, Pro 1.5M/49.99€
- Metodos de pago: Tarjeta (Stripe), PayPal, Bitcoin
- Los tokens comprados no expiran, los mensuales se renuevan cada mes
- Para cancelar suscripcion: ir a Mi Cuenta > Plan > Cancelar
- Reembolsos: dentro de 14 dias del pago
`,
      technical: `
Eres un asistente de soporte tecnico para Coleccion Nuevo Ser.
Problemas comunes:
- Audio no funciona: verificar permisos, recargar pagina, probar otro navegador
- Sincronizacion: requiere cuenta, verificar conexion a internet
- App lenta: limpiar cache, reiniciar app
- Login fallido: verificar email/password, usar "Olvide mi contrasena"
`,
      account: `
Eres un asistente de soporte para cuentas de Coleccion Nuevo Ser.
Informacion clave:
- Cambiar contrasena: Mi Cuenta > Perfil > Cambiar Contrasena
- Eliminar cuenta: Mi Cuenta > Ajustes > Eliminar cuenta (irreversible)
- Exportar datos: Mi Cuenta > Ajustes > Exportar mis datos
- Privacidad: sincronizacion opcional, datos encriptados
`,
      content: `
Eres un asistente de soporte para contenido de Coleccion Nuevo Ser.
La coleccion incluye libros sobre:
- Filosofia del Nuevo Ser
- Practicas de transformacion
- Guias de accion
- Transicion consciente
Acceso: Free tiene acceso limitado, Premium/Pro acceso completo
`,
      ai: `
Eres un asistente de soporte para funciones IA de Coleccion Nuevo Ser.
Funciones disponibles:
- Chat IA: dialogo sobre los libros (~500 tokens/consulta)
- Tutor IA: aprendizaje personalizado (~800 tokens)
- Quizzes IA: evaluacion de comprension (~600 tokens)
- Game Master: experiencias interactivas (~1000 tokens, solo Pro)
- Voces ElevenLabs: narracion premium (~200 tokens/1K caracteres)
`,
      other: `
Eres un asistente de soporte general para Coleccion Nuevo Ser.
Ayuda al usuario de forma amable y profesional.
Si no puedes resolver el problema, ofrece escalar a soporte humano.
`
    };

    return contexts[category] || contexts.other;
  }

  getFallbackResponse(message, category) {
    const responses = {
      billing: 'Para temas de pagos y suscripciones, puedes ir a Mi Cuenta > Plan para ver opciones. Si necesitas ayuda especifica con un pago, escribenos a irurag@gmail.com',
      technical: 'Para problemas tecnicos, intenta: 1) Recargar la pagina 2) Limpiar cache del navegador 3) Probar en otro navegador. Si persiste el problema, contacta irurag@gmail.com',
      account: 'Para gestionar tu cuenta, ve a Mi Cuenta desde el menu. Alli puedes cambiar tu perfil, contrasena y preferencias.',
      content: 'El contenido esta organizado en la Biblioteca. Los planes Premium y Pro tienen acceso completo a todos los libros.',
      ai: 'Las funciones IA consumen tokens. Puedes ver tu balance en Mi Cuenta > Tokens. Si tienes problemas, verifica que tengas tokens disponibles.',
      other: 'Gracias por contactarnos. Si necesitas ayuda especifica, por favor describe tu problema con mas detalle o escribe a irurag@gmail.com'
    };

    return responses[category] || responses.other;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DETECCION Y ESCALADO
  // ═══════════════════════════════════════════════════════════════════════════

  detectCategory(text) {
    const lowerText = text.toLowerCase();

    for (const [catId, cat] of Object.entries(this.categories)) {
      if (cat.keywords.some(kw => lowerText.includes(kw))) {
        return catId;
      }
    }

    return 'other';
  }

  needsHumanAttention(text) {
    const escalationKeywords = [
      'hablar con humano',
      'hablar con persona',
      'soporte humano',
      'agente',
      'operador',
      'queja',
      'denuncia',
      'demanda',
      'abogado',
      'legal',
      'fraude',
      'estafa',
      'robo'
    ];

    const lowerText = text.toLowerCase();
    return escalationKeywords.some(kw => lowerText.includes(kw));
  }

  async escalateToHuman(userMessage, category) {
    this.hideTypingIndicator();
    this.needsHumanReview = true;

    // Notificar al admin
    await this.notifyAdmin(userMessage, category, 'Solicitud de atencion humana');

    this.addMessage({
      role: 'assistant',
      content: `Entiendo que necesitas hablar con un humano. He notificado a nuestro equipo de soporte y te contactaran pronto al email registrado en tu cuenta.\n\nTambien puedes escribir directamente a:\n📧 irurag@gmail.com\n\nTu numero de ticket: #${this.generateTicketId()}`
    });
  }

  async notifyAdmin(userMessage, category, reason) {
    const user = window.authHelper?.getUser();
    const profile = window.authHelper?.getProfile();

    try {
      // Llamar a API para notificar admin
      const notifyUrl = window.ENV?.ADMIN_NOTIFICATION_API || 'https://gailu.net/api/admin-notification.php';
      await fetch(notifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'support_escalation',
          userId: user?.id,
          userEmail: user?.email,
          userName: profile?.full_name,
          category,
          reason,
          message: userMessage,
          conversationId: this.conversationId,
          conversationHistory: this.messages.slice(-10),
          timestamp: new Date().toISOString()
        })
      });

      logger.log('[SupportChat] Admin notified of escalation');
    } catch (error) {
      logger.error('[SupportChat] Failed to notify admin:', error);
    }
  }

  generateTicketId() {
    return `NS${Date.now().toString(36).toUpperCase()}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS UI
  // ═══════════════════════════════════════════════════════════════════════════

  addMessage(msg) {
    this.messages.push(msg);
    const container = document.getElementById('support-chat-messages');
    if (container) {
      container.innerHTML += this.renderMessage(msg);
      container.scrollTop = container.scrollHeight;
    }

    // Ocultar quick replies despues del primer mensaje
    const quickReplies = document.getElementById('support-quick-replies');
    if (quickReplies && this.messages.length > 1) {
      quickReplies.style.display = 'none';
    }
  }

  showTypingIndicator() {
    this.isTyping = true;
    const container = document.getElementById('support-chat-messages');
    if (container) {
      container.innerHTML += this.renderTypingIndicator();
      container.scrollTop = container.scrollHeight;
    }
  }

  hideTypingIndicator() {
    this.isTyping = false;
    document.getElementById('typing-indicator')?.remove();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERSISTENCIA
  // ═══════════════════════════════════════════════════════════════════════════

  async loadHistory() {
    const userId = window.authHelper?.getUser()?.id;
    if (!userId) return;

    try {
      // Intentar cargar conversacion activa
      const stored = localStorage.getItem(`support_chat_${userId}`);
      if (stored) {
        const data = JSON.parse(stored);
        // Solo cargar si es reciente (menos de 1 hora)
        if (Date.now() - data.timestamp < 3600000) {
          this.messages = data.messages || [];
          this.conversationId = data.conversationId;
          this.updateMessagesUI();
        }
      }
    } catch (error) {
      logger.error('[SupportChat] Error loading history:', error);
    }
  }

  saveConversation() {
    const userId = window.authHelper?.getUser()?.id;
    if (!userId) return;

    if (!this.conversationId) {
      this.conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    try {
      localStorage.setItem(`support_chat_${userId}`, JSON.stringify({
        conversationId: this.conversationId,
        messages: this.messages.slice(-20), // Ultimos 20 mensajes
        timestamp: Date.now()
      }));
    } catch (error) {
      logger.error('[SupportChat] Error saving conversation:', error);
    }
  }

  updateMessagesUI() {
    const container = document.getElementById('support-chat-messages');
    if (container && this.messages.length > 0) {
      container.innerHTML = this.messages.map(msg => this.renderMessage(msg)).join('');
      container.scrollTop = container.scrollHeight;
    }
  }

  // Limpiar conversacion
  clearConversation() {
    this.messages = [];
    this.conversationId = null;
    this.needsHumanReview = false;

    const userId = window.authHelper?.getUser()?.id;
    if (userId) {
      localStorage.removeItem(`support_chat_${userId}`);
    }

    this.updateMessagesUI();
  }
}

// Crear instancia global
window.SupportChat = SupportChat;
window.supportChat = new SupportChat();

logger.debug('SupportChat module loaded');
