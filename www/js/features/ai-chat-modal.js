// ============================================================================
// AI CHAT MODAL - Modal de Conversación con IA
// ============================================================================

class AIChatModal {
  constructor(bookEngine, aiAdapter) {
    this.bookEngine = bookEngine;
    this.aiAdapter = aiAdapter;
    this.i18n = window.i18n || new I18n();
    this.isOpen = false;
    this.currentMode = 'default';
    this.conversationHistory = [];
    this.isLoading = false;
  }

  // ==========================================================================
  // APERTURA Y CIERRE
  // ==========================================================================

  open() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.render();
    this.attachEventListeners();

    // Focus en input
    setTimeout(() => {
      const input = document.getElementById('ai-chat-input');
      if (input) input.focus();
    }, 100);
  }

  close() {
    const modal = document.getElementById('ai-chat-modal');
    if (modal) {
      modal.remove();
    }
    this.isOpen = false;
  }

  // ==========================================================================
  // RENDERIZADO
  // ==========================================================================

  render() {
    // Eliminar modal existente si hay
    const existing = document.getElementById('ai-chat-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'ai-chat-modal';
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4';

    modal.innerHTML = `
      <div class="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col border-2 border-cyan-500/30">
        <!-- Header -->
        ${this.renderHeader()}

        <!-- Messages Area -->
        <div id="ai-chat-messages" class="flex-1 overflow-y-auto p-6 space-y-4">
          ${this.renderMessages()}
        </div>

        <!-- Input Area -->
        ${this.renderInput()}
      </div>
    `;

    document.body.appendChild(modal);

    // Scroll to bottom
    setTimeout(() => this.scrollToBottom(), 100);
  }

  renderHeader() {
    const bookData = this.bookEngine.getCurrentBookData();
    const bookConfig = this.bookEngine.getCurrentBookConfig();
    const bookId = this.bookEngine.getCurrentBook();

    // Verificar si tiene modos de IA
    const hasModes = bookConfig?.features?.aiChat?.modes &&
                     Object.keys(bookConfig.features.aiChat.modes).length > 1;

    return `
      <div class="border-b border-gray-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <span class="text-4xl">${Icons.bot(36)}</span>
            <div>
              <h2 class="text-2xl font-bold text-cyan-300">${this.i18n.t('chat.title')}</h2>
              <p class="text-sm opacity-70">${bookData.title}</p>
            </div>
          </div>
          <button id="close-ai-chat"
                  class="p-2 hover:bg-gray-800 rounded-lg transition flex items-center justify-center">
            ${Icons.close(24)}
          </button>
        </div>

        ${hasModes ? this.renderModeSelector() : ''}

        <!-- Model Selector -->
        ${this.renderModelSelector()}

        <!-- Quick Info -->
        <div class="text-xs opacity-60 mt-2 flex items-center gap-1">
          ${Icons.lightbulb(14)} ${this.i18n.t('chat.askAbout')}
        </div>
      </div>
    `;
  }

  renderModelSelector() {
    const aiConfig = window.aiConfig;
    if (!aiConfig) return '';

    const provider = aiConfig.config.provider;
    const models = aiConfig.getAvailableModels(provider);
    const selectedModel = aiConfig.getSelectedModel();

    // No mostrar selector si no hay modelos o solo hay uno
    if (!models || models.length <= 1) return '';

    // Obtener nombre del proveedor para el título
    const providerNames = {
      'claude': 'Claude',
      'openai': 'OpenAI',
      'gemini': 'Gemini',
      'mistral': 'Mistral',
      'huggingface': 'HuggingFace',
      'ollama': 'Ollama'
    };
    const providerName = providerNames[provider] || provider;

    return `
      <div class="mt-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-semibold flex items-center gap-2">
            ${Icons.ai(16)}
            <span>Modelo (${providerName})</span>
          </label>
          <span class="text-xs opacity-50">${models.length} disponibles</span>
        </div>
        <select id="ai-model-selector"
                class="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none cursor-pointer">
          ${models.map(model => `
            <option value="${model.id}" ${model.id === selectedModel ? 'selected' : ''}>
              ${model.name} - ${model.description}
            </option>
          `).join('')}
        </select>
      </div>
    `;
  }

  renderModeSelector() {
    const bookConfig = this.bookEngine.getCurrentBookConfig();
    const modes = bookConfig?.features?.aiChat?.modes || {};

    if (Object.keys(modes).length <= 1) return '';

    return `
      <div class="mb-4">
        <label class="text-sm font-semibold mb-2 block">Modo de conversación:</label>
        <div class="flex gap-2 flex-wrap">
          ${Object.entries(modes).map(([key, mode]) => `
            <button class="mode-btn px-4 py-2 rounded-lg border transition ${
              key === this.currentMode
                ? 'bg-cyan-600 border-cyan-500 text-white'
                : 'bg-gray-800 border-gray-700 hover:border-cyan-500'
            }"
                    data-mode="${key}">
              ${mode.name}
            </button>
          `).join('')}
        </div>
        <p class="text-xs opacity-60 mt-2" id="mode-description">
          ${modes[this.currentMode]?.systemPrompt?.substring(0, 150) || ''}...
        </p>
      </div>
    `;
  }

  renderMessages() {
    if (this.conversationHistory.length === 0) {
      return this.renderWelcomeMessage();
    }

    return this.conversationHistory.map((msg, index) =>
      this.renderMessage(msg, index)
    ).join('');
  }

  renderWelcomeMessage() {
    const bookData = this.bookEngine.getCurrentBookData();

    return `
      <div class="welcome-message text-center py-12 opacity-70">
        <div class="text-6xl mb-4">💭</div>
        <h3 class="text-xl font-bold mb-2">Comienza una conversación</h3>
        <p class="text-sm mb-6">Pregunta sobre "${bookData.title}"</p>

        <div class="max-w-2xl mx-auto text-left space-y-2">
          <p class="text-sm font-semibold mb-2">Ejemplos de preguntas:</p>
          ${this.getSuggestedQuestions().map(q => `
            <button class="suggested-question block w-full text-left px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition text-sm"
                    data-question="${q}">
              "${q}"
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  getSuggestedQuestions() {
    const bookId = this.bookEngine.getCurrentBook();

    if (bookId === 'codigo-despertar') {
      return [
        '¿Qué es la conciencia según el libro?',
        '¿Cómo puedo empezar a meditar?',
        '¿Cuál es la relación entre IA y conciencia?'
      ];
    } else if (bookId === 'manifiesto') {
      return [
        '¿Cuáles son las premisas ocultas del sistema actual?',
        '¿Qué alternativas económicas propone el Manifiesto?',
        '¿Cómo puedo empezar a actuar para el cambio?'
      ];
    }

    return [
      '¿Cuál es la idea central del libro?',
      'Explícame un concepto clave',
      '¿Cómo aplico esto en mi vida?'
    ];
  }

  renderMessage(msg, index) {
    const isUser = msg.role === 'user';

    return `
      <div class="message ${isUser ? 'user-message' : 'ai-message'} animate-fade-in" data-index="${index}">
        <div class="flex gap-3 ${isUser ? 'flex-row-reverse' : ''}">
          <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser ? 'bg-cyan-600' : 'bg-purple-600'
          }">
            ${isUser ? Icons.user(20) : Icons.bot(20)}
          </div>

          <div class="flex-1 ${isUser ? 'text-right' : ''}">
            <div class="inline-block max-w-[80%] p-4 rounded-2xl ${
              isUser
                ? 'bg-cyan-600 text-white rounded-tr-none'
                : 'bg-gray-800 border border-gray-700 rounded-tl-none'
            }">
              <div class="message-content whitespace-pre-wrap">${this.formatMessageContent(msg.content)}</div>
            </div>
            <div class="text-xs opacity-50 mt-1 ${isUser ? 'text-right' : ''}">
              ${new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  formatMessageContent(content) {
    // Formateo básico de markdown
    let formatted = content;

    // Negritas
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');

    // Cursivas
    formatted = formatted.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

    // Listas
    formatted = formatted.replace(/^- (.+)$/gm, '<li class="ml-4">• $1</li>');

    // Párrafos
    formatted = formatted.split('\n\n').map(p =>
      p.trim() ? `<p class="mb-2">${p}</p>` : ''
    ).join('');

    return formatted;
  }

  renderInput() {
    return `
      <div class="border-t border-gray-700 p-4">
        <form id="ai-chat-form" class="flex gap-3">
          <textarea
            id="ai-chat-input"
            rows="2"
            placeholder="${this.i18n.t('chat.placeholder')}"
            class="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg resize-none focus:border-cyan-500 focus:outline-none transition"
            ${this.isLoading ? 'disabled' : ''}
          ></textarea>
          <button
            type="submit"
            class="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-bold transition flex items-center gap-2"
            ${this.isLoading ? 'disabled' : ''}
          >
            ${this.isLoading ? '⏳' : '📤'}
            ${this.isLoading ? this.i18n.t('chat.thinking') : this.i18n.t('chat.send')}
          </button>
        </form>

        ${this.renderAIStatus()}
      </div>
    `;
  }

  renderAIStatus() {
    // Verificar configuración de IA
    if (!window.aiAdapter || !window.aiConfig) {
      return `
        <div class="mt-3 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg text-sm flex items-center gap-2">
          ${Icons.alertTriangle(18)} ${this.i18n.t('chat.notConfigured')}
        </div>
      `;
    }

    const currentProvider = window.aiConfig.getCurrentProvider();
    const hasApiKey = window.aiConfig.getClaudeApiKey() !== null;

    if (!hasApiKey) {
      return `
        <div class="mt-3 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg text-sm flex items-center gap-2">
          ${Icons.alertTriangle(18)} ${this.i18n.t('chat.noApiKey')}
          <button onclick="window.toast.info('chat.configure')"
                  class="underline hover:text-yellow-300">
            ${this.i18n.t('chat.configureNow')}
          </button>
        </div>
      `;
    }

    return `
      <div class="mt-3 text-xs opacity-60 flex items-center gap-2">
        <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        IA lista • Proveedor: ${currentProvider}
      </div>
    `;
  }

  // ==========================================================================
  // MANEJO DE EVENTOS
  // ==========================================================================

  attachEventListeners() {
    // Close button
    const closeBtn = document.getElementById('close-ai-chat');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Click outside modal
    const modal = document.getElementById('ai-chat-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.close();
        }
      });
    }

    // ESC key
    document.addEventListener('keydown', this.handleEscKey.bind(this));

    // Form submit
    const form = document.getElementById('ai-chat-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.sendMessage();
      });
    }

    // Mode buttons
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        this.switchMode(mode);
      });
    });

    // Model selector
    const modelSelector = document.getElementById('ai-model-selector');
    if (modelSelector) {
      modelSelector.addEventListener('change', (e) => {
        const selectedModel = e.target.value;
        if (window.aiConfig) {
          window.aiConfig.setSelectedModel(selectedModel);
          // Mostrar confirmación
          const modelInfo = window.aiConfig.getModelInfo(selectedModel);
          if (modelInfo) {
            console.log(`✅ Modelo cambiado a: ${modelInfo.name}`);
          }
        }
      });
    }

    // Suggested questions
    const suggestedBtns = document.querySelectorAll('.suggested-question');
    suggestedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const question = btn.getAttribute('data-question');
        const input = document.getElementById('ai-chat-input');
        if (input) {
          input.value = question;
          input.focus();
        }
      });
    });

    // Enter to send (Shift+Enter for new line)
    const input = document.getElementById('ai-chat-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
  }

  handleEscKey(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  // ==========================================================================
  // LÓGICA DE CHAT
  // ==========================================================================

  switchMode(mode) {
    this.currentMode = mode;
    this.render();
    this.attachEventListeners();
  }

  async sendMessage() {
    const input = document.getElementById('ai-chat-input');
    if (!input || !input.value.trim() || this.isLoading) return;

    const userMessage = input.value.trim();
    input.value = '';

    // Añadir mensaje del usuario
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    });

    // Re-render con loading
    this.isLoading = true;
    this.render();
    this.attachEventListeners();
    this.scrollToBottom();

    try {
      // Obtener respuesta de IA
      const response = await this.getAIResponse(userMessage);

      // Añadir respuesta de IA
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting AI response:', error);

      // Mensaje de error
      this.conversationHistory.push({
        role: 'assistant',
        content: `❌ Error: ${error.message}\n\nPor favor, verifica tu configuración de IA e intenta nuevamente.`,
        timestamp: new Date().toISOString()
      });
    } finally {
      this.isLoading = false;
      this.render();
      this.attachEventListeners();
      this.scrollToBottom();
    }
  }

  async getAIResponse(userMessage) {
    // Verificar que tenemos sistema de IA
    if (!window.aiAdapter) {
      throw new Error('Sistema de IA no disponible');
    }

    // Construir contexto del sistema
    const systemContext = this.buildSystemContext();

    // Preparar historial de conversación
    const history = this.conversationHistory
      .slice(-10) // Últimos 10 mensajes
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Llamar a la IA
    const response = await window.aiAdapter.ask(
      userMessage,
      systemContext,
      history
    );

    return response;
  }

  buildSystemContext() {
    const bookId = this.bookEngine.getCurrentBook();
    const bookData = this.bookEngine.getCurrentBookData();
    const bookConfig = this.bookEngine.getCurrentBookConfig();

    // Get authors string (handle both formats: authors[] array or author/coAuthor strings)
    let authorsString = 'autor desconocido';
    if (bookData.authors && Array.isArray(bookData.authors)) {
      authorsString = bookData.authors.join(' & ');
    } else if (bookData.author) {
      authorsString = bookData.coAuthor ? `${bookData.author} & ${bookData.coAuthor}` : bookData.author;
    }

    // Context base del libro
    let context = `Estás conversando sobre el libro "${bookData.title}" por ${authorsString}.\n\n`;

    // Añadir contexto del modo actual (si aplica)
    if (bookConfig?.features?.aiChat?.modes?.[this.currentMode]) {
      const modeConfig = bookConfig.features.aiChat.modes[this.currentMode];
      context += modeConfig.systemPrompt + '\n\n';
    } else if (bookConfig?.features?.aiChat?.systemPrompt) {
      context += bookConfig.features.aiChat.systemPrompt + '\n\n';
    }

    // Añadir contexto del capítulo actual (si aplica)
    const currentChapterId = this.bookEngine.currentChapter;
    if (currentChapterId) {
      const chapter = this.bookEngine.getChapter(currentChapterId);
      if (chapter) {
        context += `El usuario está leyendo actualmente el capítulo "${chapter.title}".\n\n`;
      }
    }

    // Instrucciones generales
    context += `Responde de manera clara, profunda y relevante al contenido del libro. Usa ejemplos cuando sea útil. Mantén un tono apropiado al libro y al modo de conversación seleccionado.`;

    return context;
  }

  scrollToBottom() {
    const messagesArea = document.getElementById('ai-chat-messages');
    if (messagesArea) {
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  clearHistory() {
    this.conversationHistory = [];
    this.render();
    this.attachEventListeners();
  }

  exportHistory() {
    const bookData = this.bookEngine.getCurrentBookData();
    const exported = {
      book: bookData.title,
      date: new Date().toISOString(),
      mode: this.currentMode,
      messages: this.conversationHistory
    };

    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${bookData.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Exportar para uso global
window.AIChatModal = AIChatModal;
