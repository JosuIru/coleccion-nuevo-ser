// ============================================================================
// AI CHAT MODAL - Modal de Conversación con IA
// ============================================================================

// 🔧 FIX v2.9.198: Migrated console.log to logger
class AIChatModal {
  constructor(bookEngine, aiAdapter) {
    this.bookEngine = bookEngine;
    this.aiAdapter = aiAdapter;
    this.i18n = window.i18n || new I18n();
    this.isOpen = false;
    this.currentMode = 'default';
    // Restore practical mode from localStorage
    this.practicalMode = localStorage.getItem('ai-practical-mode') === 'true';
    this.conversationHistory = [];
    this.isLoading = false;
    this.showConfig = false;
    this.boundEscHandler = null; // Bound escape key handler

    // 🔧 FIX #27: Hacer configurable el tamaño del historial de mensajes
    this.maxHistoryLength = parseInt(localStorage.getItem('ai-max-history') || '10', 10);

    // 🔧 FIX #86: Event manager centralizado para limpieza consistente
    this.eventManager = new EventManager();
    this.eventManager.setComponentName('AIChatModal');

    // 🔧 FIX v2.9.269: Focus trap para accesibilidad
    this.focusTrap = null;
  }

  // ==========================================================================
  // GESTIÓN DE CRÉDITOS (🔧 FIX #23)
  // ==========================================================================

  /**
   * 🔧 FIX #23: Verificar si hay suficientes créditos para una consulta
   * @param {number} estimatedTokens - Número estimado de tokens necesarios
   * @returns {Promise<boolean>} - true si hay créditos suficientes
   */
  async checkCredits(estimatedTokens = 1000) {
    // Si no hay sistema de créditos, permitir siempre
    if (!window.aiPremium) return true;

    // Si es usuario autenticado, verificar créditos
    if (!window.authHelper?.user) return true;

    const profile = window.authHelper?.getProfile?.();
    const isPremiumUser = ['premium', 'pro'].includes(profile?.subscription_tier);

    // Los usuarios premium no necesitan verificación local (el proxy maneja sus créditos)
    if (isPremiumUser) return true;

    try {
      const hasCredits = await window.aiPremium.checkCredits(estimatedTokens, 'ai_chat');
      return hasCredits;
    } catch (error) {
      logger.warn('Credit check warning:', error.message);
      // En caso de error, permitir continuar (graceful degradation)
      return true;
    }
  }

  /**
   * 🔧 FIX #23: Consumir créditos después de una consulta exitosa
   * @param {string} userMessage - Mensaje del usuario
   * @param {string} aiResponse - Respuesta de la IA
   */
  async consumeCredits(userMessage, aiResponse) {
    // Si no hay sistema de créditos, no hacer nada
    if (!window.aiPremium) return;

    // Si no es usuario autenticado, no consumir
    if (!window.authHelper?.user) return;

    const profile = window.authHelper?.getProfile?.();
    const isPremiumUser = ['premium', 'pro'].includes(profile?.subscription_tier);

    // Los usuarios premium no consumen créditos localmente (el proxy maneja sus créditos)
    if (isPremiumUser) return;

    try {
      const provider = window.aiConfig?.getCurrentProvider?.() || 'local';
      const model = window.aiConfig?.getSelectedModel?.() || 'local';

      // Calcular tokens basado en caracteres (estimación: ~4 caracteres = 1 token)
      const inputTokens = Math.ceil(userMessage.length / 4);
      const outputTokens = Math.ceil(aiResponse.length / 4);
      const totalTokens = inputTokens + outputTokens;

      // 🔧 FIX #24: Calcular créditos basado en tokens usados reales
      // Convertir tokens a créditos: 1 crédito = 1000 tokens
      const creditsToConsume = Math.ceil(totalTokens / 1000);

      logger.debug(`[AI Chat] Consumiendo ${creditsToConsume} créditos (${totalTokens} tokens: ${inputTokens} input + ${outputTokens} output)`);

      await window.aiPremium.consumeCredits(creditsToConsume, 'ai_chat', provider, model, totalTokens);
    } catch (error) {
      logger.warn('Credit consume warning:', error.message);
    }
  }

  /**
   * 🔧 FIX #23: Mostrar mensaje cuando no hay créditos suficientes
   * @param {number} estimatedTokens - Tokens estimados necesarios
   */
  showNoCreditsMessage(estimatedTokens) {
    this.conversationHistory.push({
      role: 'assistant',
      content: `💳 **Sin créditos suficientes**\n\nNecesitas aproximadamente ${estimatedTokens} créditos para esta consulta.\n\n💡 **Soluciones:**\n- Actualiza tu plan en ⚙️ Configuración > Premium\n- Espera al próximo mes para el reset de créditos\n- Usa un proveedor gratuito como HuggingFace u Ollama local`,
      timestamp: new Date().toISOString(),
      isError: true
    });
    this.render();
    this.attachEventListeners();
  }

  // ==========================================================================
  // APERTURA Y CIERRE
  // ==========================================================================

  open() {
    if (this.isOpen) return;

    // Registrar uso de feature para hints contextuales
    if (window.contextualHints) {
      window.contextualHints.markFeatureUsed('ai-chat');
    }

    this.isOpen = true;
    this.render();
    this.attachEventListeners();

    // 🔧 FIX v2.9.269: Activar focus trap para accesibilidad
    setTimeout(() => {
      const modal = document.getElementById('ai-chat-modal');
      if (modal && window.createFocusTrap) {
        this.focusTrap = window.createFocusTrap(modal);
      }
      // Focus en input
      const input = document.getElementById('ai-chat-input');
      if (input) input.focus();
    }, 100);
  }

  close() {
    // 🔧 FIX v2.9.269: Desactivar focus trap
    if (this.focusTrap) {
      this.focusTrap.deactivate();
      this.focusTrap = null;
    }
    // 🔧 FIX #86: Limpiar todos los event listeners con EventManager
    if (this.eventManager) {
      this.eventManager.cleanup();
    }

    // 🔧 FIX #21: Limpiar escape key handler y setear a null para evitar handlers huérfanos
    if (this.boundEscHandler) {
      document.removeEventListener('keydown', this.boundEscHandler);
      this.boundEscHandler = null;
    }

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
    modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-0 sm:p-4';
    modal.style.zIndex = '10000';

    modal.innerHTML = `
      <div class="bg-gray-900 rounded-none sm:rounded-2xl shadow-2xl max-w-4xl w-full h-full sm:h-[90vh] flex flex-col border-0 sm:border-2 border-cyan-500/30">
        <!-- Header (compacto, sticky en móvil) -->
        ${this.renderHeader()}

        <!-- Messages Area (más espacio) -->
        <div id="ai-chat-messages" class="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 min-h-0">
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
      <div class="border-b border-gray-700 p-2 sm:p-3 flex-shrink-0 sticky top-0 bg-gray-900 z-10">
        <!-- Línea superior: título + botones -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            <span class="flex-shrink-0">${Icons.bot(20)}</span>
            <div class="min-w-0">
              <h2 class="text-base sm:text-lg font-bold text-cyan-300 truncate">${this.i18n.t('chat.title')}</h2>
            </div>
          </div>
          <div class="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            <!-- Quick AI Selector inline -->
            ${this.renderQuickAISelectorInline()}
            <button id="toggle-ai-config"
                    class="p-1.5 sm:p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition flex items-center justify-center ${this.showConfig ? 'bg-cyan-600/30 text-cyan-300' : ''}"
                    title="Configurar IA">
              ${Icons.settings(18)}
            </button>
            <button id="close-ai-chat"
                    class="p-1.5 sm:p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition flex items-center justify-center">
              ${Icons.close(18)}
            </button>
          </div>
        </div>

        ${hasModes ? this.renderModeSelector() : ''}

        <!-- Practical Mode Toggle (only when AI is configured) -->
        ${this.renderPracticalModeToggle()}

        <!-- Config Panel (collapsible) -->
        ${this.showConfig ? this.renderConfigPanel() : ''}
      </div>
    `;
  }

  // Selector inline compacto para el header
  renderQuickAISelectorInline() {
    const aiConfig = window.aiConfig;
    if (!aiConfig) return '';

    // Verificar si el usuario es Premium/Pro
    const profile = window.authHelper?.getProfile?.();
    const isPremiumUser = profile && ['premium', 'pro'].includes(profile.subscription_tier);

    // Si es usuario premium, mostrar badge de Premium en lugar del selector
    if (isPremiumUser) {
      const selectedModel = aiConfig.getSelectedModel();
      const modelInfo = aiConfig.getModelInfo(selectedModel);
      const modelName = modelInfo ? modelInfo.name : 'Claude 3.5 Haiku';

      return `
        <div class="flex items-center gap-1 mr-2">
          <div class="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/50 rounded-lg px-3 py-1 flex items-center gap-2">
            <span class="text-amber-400 text-xs font-semibold">⭐ Premium</span>
            <span class="text-gray-400 text-xs">•</span>
            <span class="text-cyan-300 text-xs">${modelName}</span>
          </div>
          <span class="w-2 h-2 rounded-full flex-shrink-0 bg-green-400" title="Servicio Premium activo"></span>
        </div>
      `;
    }

    // Usuario FREE - mostrar selector normal
    const currentProvider = aiConfig.getCurrentProvider();
    const models = aiConfig.getAvailableModels(currentProvider);
    const selectedModel = aiConfig.getSelectedModel();
    const isConfigured = this.isProviderConfigured(currentProvider);

    // Renderizar selector de modelos si hay más de 1
    const modelSelector = models && models.length > 1 ? `
      <select id="quick-model-selector"
              class="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-xs text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none cursor-pointer max-w-[120px]">
        ${models.map(model => `
          <option value="${model.id}" ${model.id === selectedModel ? 'selected' : ''}>
            ${model.name.length > 15 ? model.name.substring(0, 15) + '...' : model.name}
          </option>
        `).join('')}
      </select>
    ` : '';

    // Helper para mostrar estado de configuración
    const getStatusIcon = (provider) => {
      return this.isProviderConfigured(provider) ? '✓' : '✗';
    };

    return `
      <div class="flex items-center gap-1 mr-2">
        <select id="quick-provider-selector"
                class="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-xs text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none cursor-pointer">
          <option value="claude" ${currentProvider === 'claude' ? 'selected' : ''}>🚀 Claude ${getStatusIcon('claude')}</option>
          <option value="openai" ${currentProvider === 'openai' ? 'selected' : ''}>💬 GPT ${getStatusIcon('openai')}</option>
          <option value="gemini" ${currentProvider === 'gemini' ? 'selected' : ''}>✨ Gemini ${getStatusIcon('gemini')}</option>
          <option value="qwen" ${currentProvider === 'qwen' ? 'selected' : ''}>🌐 Qwen ${getStatusIcon('qwen')}</option>
          <option value="mistral" ${currentProvider === 'mistral' ? 'selected' : ''}>🌀 Mistral ${getStatusIcon('mistral')}</option>
          <option value="huggingface" ${currentProvider === 'huggingface' ? 'selected' : ''}>🤗 HF ${getStatusIcon('huggingface')}</option>
          <option value="ollama" ${currentProvider === 'ollama' ? 'selected' : ''}>🦙 Ollama ${getStatusIcon('ollama')}</option>
          <option value="local" ${currentProvider === 'local' ? 'selected' : ''}>💾 Local ${getStatusIcon('local')}</option>
        </select>
        ${modelSelector}
        <span class="w-2 h-2 rounded-full flex-shrink-0 ${isConfigured ? 'bg-green-400' : 'bg-red-400'}" title="${isConfigured ? 'Configurado' : 'Sin API Key'}"></span>
      </div>
    `;
  }

  // Versión expandida para el panel de configuración (se mantiene por si se usa)
  renderQuickAISelector() {
    const aiConfig = window.aiConfig;
    if (!aiConfig) return '';

    const currentProvider = aiConfig.getCurrentProvider();
    const models = aiConfig.getAvailableModels(currentProvider);
    const selectedModel = aiConfig.getSelectedModel();

    // Helper para mostrar estado de configuración
    const getStatusIcon = (provider) => {
      return this.isProviderConfigured(provider) ? '✓' : '✗';
    };

    return `
      <div class="mt-3 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-300 dark:border-gray-700 space-y-3">
        <!-- Selector de Servicio -->
        <div>
          <label class="text-xs font-semibold opacity-70 mb-1 block text-gray-900 dark:text-white">Preguntar a:</label>
          <select id="quick-provider-selector-expanded"
                  class="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none cursor-pointer">
            <optgroup label="💰 De pago">
              <option value="claude" ${currentProvider === 'claude' ? 'selected' : ''}>🚀 Claude (Anthropic) ${getStatusIcon('claude')}</option>
              <option value="openai" ${currentProvider === 'openai' ? 'selected' : ''}>💬 ChatGPT (OpenAI) ${getStatusIcon('openai')}</option>
              <option value="mistral" ${currentProvider === 'mistral' ? 'selected' : ''}>🌀 Mistral AI ${getStatusIcon('mistral')}</option>
            </optgroup>
            <optgroup label="🆓 Gratis">
              <option value="gemini" ${currentProvider === 'gemini' ? 'selected' : ''}>✨ Gemini (Google) ${getStatusIcon('gemini')}</option>
              <option value="qwen" ${currentProvider === 'qwen' ? 'selected' : ''}>🌐 Qwen (Alibaba) ${getStatusIcon('qwen')}</option>
              <option value="huggingface" ${currentProvider === 'huggingface' ? 'selected' : ''}>🤗 HuggingFace ${getStatusIcon('huggingface')}</option>
            </optgroup>
            <optgroup label="🏠 Local">
              <option value="ollama" ${currentProvider === 'ollama' ? 'selected' : ''}>🦙 Ollama ${getStatusIcon('ollama')}</option>
              <option value="local" ${currentProvider === 'local' ? 'selected' : ''}>💾 Modo offline ${getStatusIcon('local')}</option>
            </optgroup>
          </select>
        </div>

        <!-- Selector de Modelo (si hay más de 1) -->
        <div id="quick-model-container">
          ${models && models.length > 1 ? `
            <label class="text-xs font-semibold opacity-70 mb-1 block">Modelo:</label>
            <select id="quick-model-selector"
                    class="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none cursor-pointer">
              ${models.map(model => `
                <option value="${model.id}" ${model.id === selectedModel ? 'selected' : ''}>
                  ${model.name}
                </option>
              `).join('')}
            </select>
          ` : ''}
        </div>

        <!-- Estado de configuración -->
        <div class="text-xs flex items-center gap-2">
          <span class="w-2 h-2 rounded-full ${this.isProviderConfigured(currentProvider) ? 'bg-green-400' : 'bg-red-400'}"></span>
          <span class="opacity-70">${this.isProviderConfigured(currentProvider) ? 'Listo' : 'Sin configurar'}</span>
          ${!this.isProviderConfigured(currentProvider) ? `
            <span class="text-cyan-400 cursor-pointer hover:underline" onclick="document.getElementById('toggle-ai-config').click()">
              → Configurar
            </span>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderModelSelector() {
    // Este método ya no se usa, pero lo mantenemos por compatibilidad
    return '';
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
                : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:border-cyan-500 text-gray-900 dark:text-white'
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

  renderPracticalModeToggle() {
    // Only show if AI is configured
    const aiConfig = window.aiConfig;
    if (!aiConfig) return '';

    const currentProvider = aiConfig.getCurrentProvider();
    const isConfigured = this.isProviderConfigured(currentProvider);

    if (!isConfigured) return '';

    return `
      <div class="mt-3 p-3 bg-gradient-to-r from-violet-900/30 to-purple-900/30 rounded-lg border border-purple-500/30">
        <label class="flex items-center justify-between cursor-pointer">
          <div class="flex items-center gap-2">
            ${Icons.create('tool', 20)}
            <div>
              <span class="font-semibold text-purple-300">Modo Práctico</span>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Obtén planes de acción paso a paso con enlaces a capítulos, ejercicios y meditaciones relevantes
              </p>
            </div>
          </div>
          <input type="checkbox"
                 id="practical-mode-toggle"
                 ${this.practicalMode ? 'checked' : ''}
                 class="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-2 cursor-pointer">
        </label>
      </div>
    `;
  }

  renderConfigPanel() {
    const aiConfig = window.aiConfig;
    if (!aiConfig) return '<p class="text-red-400">Sistema de IA no disponible</p>';

    // Verificar si el usuario es Premium/Pro
    const profile = window.authHelper?.getProfile?.();
    const isPremiumUser = profile && ['premium', 'pro'].includes(profile.subscription_tier);

    // Usuarios premium: mostrar info del servicio premium
    if (isPremiumUser) {
      const selectedModel = aiConfig.getSelectedModel();
      const models = aiConfig.getAvailableModels('claude'); // Premium usa Claude

      return `
        <div class="mt-4 p-4 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/50 rounded-lg space-y-4 animate-fade-in">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold flex items-center gap-2 text-amber-400">
              ⭐ Servicio Premium
            </h3>
          </div>

          <div class="bg-gray-900/50 p-4 rounded-lg space-y-3">
            <div class="flex items-center gap-2">
              <span class="text-green-400">✓</span>
              <span class="text-sm text-gray-300">Acceso a <strong class="text-cyan-300">Claude 3.5</strong> (Anthropic)</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-green-400">✓</span>
              <span class="text-sm text-gray-300">Sin configuración de API keys</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-green-400">✓</span>
              <span class="text-sm text-gray-300">Créditos incluidos en tu suscripción</span>
            </div>
          </div>

          <!-- Selector de Modelo Claude -->
          ${models && models.length > 1 ? `
            <div>
              <label class="block text-sm font-semibold mb-2 text-gray-300">Modelo Claude:</label>
              <select id="chat-model-select" class="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white">
                ${models.map(model => `
                  <option value="${model.id}" ${model.id === selectedModel ? 'selected' : ''}>
                    ${model.name} - ${model.description}
                  </option>
                `).join('')}
              </select>
              <button id="save-chat-config" class="mt-3 w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-bold transition text-sm">
                💾 Guardar modelo
              </button>
            </div>
          ` : ''}

          <div class="text-xs text-amber-300/70 mt-4">
            💡 Tu suscripción Premium incluye acceso ilimitado a Claude. No necesitas configurar API keys.
          </div>

          <button id="cancel-chat-config" class="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm text-white">
            Cerrar
          </button>
        </div>
      `;
    }

    // Usuarios FREE: mostrar configuración normal
    const currentProvider = aiConfig.getCurrentProvider();

    return `
      <div class="mt-4 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-cyan-500/30 space-y-4 animate-fade-in">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            ${Icons.settings(20)} Configuración de IA
          </h3>
        </div>

        <!-- Provider Selector -->
        <div>
          <label class="block text-sm font-semibold mb-2 text-gray-900 dark:text-white">1. Servicio de IA</label>
          <select id="chat-provider-select" class="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white">
            <optgroup label="💰 De pago (alta calidad)">
              <option value="claude" ${currentProvider === 'claude' ? 'selected' : ''}>Claude (Anthropic)</option>
              <option value="openai" ${currentProvider === 'openai' ? 'selected' : ''}>ChatGPT (OpenAI)</option>
              <option value="mistral" ${currentProvider === 'mistral' ? 'selected' : ''}>Mistral AI</option>
            </optgroup>
            <optgroup label="🆓 Gratis">
              <option value="gemini" ${currentProvider === 'gemini' ? 'selected' : ''}>Gemini (Google) - 60 consultas/min gratis</option>
              <option value="qwen" ${currentProvider === 'qwen' ? 'selected' : ''}>Qwen (Alibaba) - 1M tokens gratis/mes</option>
              <option value="huggingface" ${currentProvider === 'huggingface' ? 'selected' : ''}>HuggingFace - 100% gratis</option>
            </optgroup>
            <optgroup label="🏠 Local / Sin conexión">
              <option value="ollama" ${currentProvider === 'ollama' ? 'selected' : ''}>Ollama - Ejecuta en tu PC</option>
              <option value="local" ${currentProvider === 'local' ? 'selected' : ''}>Modo offline - Sin IA real</option>
            </optgroup>
          </select>
        </div>

        <!-- Model Selector (dinámico según proveedor) -->
        <div id="chat-model-section">
          ${this.renderModelSelector(currentProvider)}
        </div>

        <!-- API Key Input (dinámico según proveedor) -->
        <div id="chat-api-key-section">
          ${this.renderApiKeyInput(currentProvider)}
        </div>

        <!-- Save Button -->
        <div class="flex gap-2">
          <button id="save-chat-config" class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-bold transition text-sm">
            💾 Guardar
          </button>
          <button id="cancel-chat-config" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition text-sm">
            Cerrar
          </button>
        </div>

        <!-- Status -->
        <div class="text-xs opacity-70 flex items-center gap-2">
          <span class="w-2 h-2 rounded-full ${this.isProviderConfigured(currentProvider) ? 'bg-green-400' : 'bg-red-400'}"></span>
          ${this.isProviderConfigured(currentProvider) ? 'Configurado' : 'No configurado'}
        </div>
      </div>
    `;
  }

  renderModelSelector(provider) {
    const aiConfig = window.aiConfig;
    if (!aiConfig) return '';

    const models = aiConfig.getAvailableModels(provider);
    if (!models || models.length <= 1) return '';

    const selectedModel = aiConfig.getSelectedModel();

    return `
      <div>
        <label class="block text-sm font-semibold mb-2">2. Modelo</label>
        <select id="chat-model-select" class="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          ${models.map(model => `
            <option value="${model.id}" ${model.id === selectedModel ? 'selected' : ''}>
              ${model.name} - ${model.description}
            </option>
          `).join('')}
        </select>
      </div>
    `;
  }

  renderApiKeyInput(provider) {
    const aiConfig = window.aiConfig;
    if (!aiConfig) return '';

    const configs = {
      claude: {
        key: aiConfig.getClaudeApiKey() || '',
        placeholder: 'sk-ant-...',
        label: 'API Key de Claude',
        link: 'https://console.anthropic.com/settings/keys',
        info: 'Calidad máxima • ~$0.01-0.02/conversación'
      },
      openai: {
        key: aiConfig.getOpenAIApiKey() || '',
        placeholder: 'sk-...',
        label: 'API Key de OpenAI',
        link: 'https://platform.openai.com/api-keys',
        info: 'Alta calidad • ~$0.002-0.02/conversación'
      },
      gemini: {
        key: aiConfig.getGeminiApiKey() || '',
        placeholder: 'AIza...',
        label: 'API Key de Gemini',
        link: 'https://aistudio.google.com/apikey',
        info: 'Gratis: 60 consultas/min • Buena calidad'
      },
      qwen: {
        key: aiConfig.getQwenApiKey() || '',
        placeholder: 'sk-...',
        label: 'API Key de Qwen (DashScope)',
        link: 'https://bailian.console.alibabacloud.com/?apiKey=1#/api-key',
        info: '¡1M tokens GRATIS/mes! • Crear cuenta en Alibaba Cloud'
      },
      mistral: {
        key: aiConfig.getMistralApiKey() || '',
        placeholder: '...',
        label: 'API Key de Mistral',
        link: 'https://console.mistral.ai/api-keys',
        info: 'Muy económico • ~$0.001/conversación'
      },
      huggingface: {
        key: aiConfig.getHuggingFaceToken() || '',
        placeholder: 'hf_...',
        label: 'Token de HuggingFace',
        link: 'https://huggingface.co/settings/tokens',
        info: '100% Gratis • Crear cuenta en huggingface.co'
      },
      ollama: {
        key: aiConfig.getOllamaUrl() || 'http://localhost:11434',
        placeholder: 'http://localhost:11434',
        label: 'URL de Ollama',
        link: 'https://ollama.ai/download',
        info: 'Gratis & Privado • Ejecuta en tu PC'
      },
      local: {
        key: '',
        placeholder: '',
        label: '',
        link: '',
        info: 'Respuestas predefinidas sin IA real'
      }
    };

    const config = configs[provider] || configs.local;

    if (provider === 'local') {
      return `
        <div class="p-3 bg-gray-900/50 rounded-lg text-sm">
          <p class="opacity-70">${config.info}</p>
        </div>
      `;
    }

    return `
      <div class="space-y-2">
        <label class="block text-sm font-semibold">${config.label}</label>
        <div class="relative">
          <input
            type="password"
            id="chat-api-key-input"
            value="${config.key}"
            placeholder="${config.placeholder}"
            class="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm font-mono pr-10"
          />
          <button id="toggle-chat-key" class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:text-cyan-400 transition">
            ${Icons.eye(16)}
          </button>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="opacity-60">${config.info}</span>
          <a href="${config.link}" target="_blank" class="text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            ${Icons.link(12)} Obtener
          </a>
        </div>
      </div>
    `;
  }

  isProviderConfigured(provider) {
    const aiConfig = window.aiConfig;
    if (!aiConfig) return false;

    switch (provider) {
      case 'claude': return aiConfig.isClaudeConfigured();
      case 'openai': return aiConfig.isOpenAIConfigured();
      case 'gemini': return aiConfig.isGeminiConfigured();
      case 'qwen': return aiConfig.isQwenConfigured();
      case 'mistral': return aiConfig.isMistralConfigured();
      case 'huggingface': return aiConfig.isHuggingFaceConfigured();
      case 'ollama': return true;
      case 'local': return true;
      default: return false;
    }
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

    // Detectar entorno y estado de IA
    const isNativeApp = !!(window.Capacitor || window.cordova || document.URL.indexOf('http://') === -1);
    const aiConfig = window.aiConfig;
    const currentProvider = aiConfig?.getCurrentProvider?.() || 'local';
    const isAuthenticated = !!window.authHelper?.user;
    const profile = window.authHelper?.getProfile?.();
    const isPremium = profile && ['premium', 'pro'].includes(profile.subscription_tier);

    // Verificar si hay IA disponible
    const hasConfiguredAI = currentProvider !== 'local' && currentProvider !== 'puter' ||
                            (currentProvider === 'puter' && !isNativeApp);
    const isAIAvailable = isPremium || hasConfiguredAI;

    // Si no hay IA disponible, mostrar mensaje informativo
    if (!isAIAvailable) {
      return this.renderNoAIMessage(isAuthenticated, isPremium, isNativeApp);
    }

    return `
      <div class="welcome-message text-center py-12 opacity-70">
        <div class="text-6xl mb-4">💭</div>
        <h3 class="text-xl font-bold mb-2">Comienza una conversación</h3>
        <p class="text-sm mb-6">Pregunta sobre "${bookData.title}"</p>

        <div class="max-w-2xl mx-auto text-left space-y-2">
          <p class="text-sm font-semibold mb-2">Sugerencias para profundizar:</p>
          <p class="text-xs opacity-60 mb-3">Haz clic en una sugerencia para preguntar a la IA:</p>
          ${this.getSuggestedQuestions().map((q, idx) => `
            <button class="suggested-question block w-full text-left px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800/50 hover:bg-cyan-600/30 hover:border-cyan-500 border border-gray-300 dark:border-transparent transition text-sm cursor-pointer text-gray-900 dark:text-white"
                    data-question-index="${idx}">
              💬 ${q}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Mensaje cuando no hay IA disponible
   */
  renderNoAIMessage(isAuthenticated, isPremium, isNativeApp) {
    return `
      <div class="no-ai-message text-center py-8 px-4">
        <div class="text-6xl mb-4">🤖</div>
        <h3 class="text-xl font-bold mb-3 text-cyan-300">Chat con IA</h3>

        <div class="max-w-md mx-auto space-y-4">
          <!-- Info principal -->
          <div class="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <p class="text-gray-300 mb-3">
              Para usar el chat con inteligencia artificial necesitas:
            </p>

            <div class="space-y-3 text-left">
              <!-- Opción 1: Planes Premium -->
              <div class="flex items-start gap-3 p-3 bg-gradient-to-r from-amber-900/30 to-amber-800/20 rounded-lg border border-amber-500/30">
                <span class="text-2xl">⭐</span>
                <div>
                  <p class="font-semibold text-amber-300">Plan Premium</p>
                  <p class="text-xs text-gray-400 mb-2">IA ilimitada sin configuración</p>
                  ${!isAuthenticated ? `
                    <button id="ai-chat-login-btn" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-sm font-semibold transition">
                      Iniciar Sesión / Registrarse
                    </button>
                  ` : `
                    <button id="ai-chat-plans-btn" class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-sm font-semibold transition">
                      Ver Planes Premium
                    </button>
                  `}
                </div>
              </div>

              <!-- Separador -->
              <div class="flex items-center gap-2 text-gray-500">
                <div class="flex-1 h-px bg-gray-700"></div>
                <span class="text-xs">o bien</span>
                <div class="flex-1 h-px bg-gray-700"></div>
              </div>

              <!-- Opción 2: Configurar propia -->
              <div class="flex items-start gap-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                <span class="text-2xl">⚙️</span>
                <div>
                  <p class="font-semibold text-cyan-300">Configura tu propia IA</p>
                  <p class="text-xs text-gray-400 mb-2">Usa tu API key de OpenAI, Gemini, etc.</p>
                  <button id="ai-chat-settings-btn" class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold transition">
                    Abrir Ajustes IA
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Info adicional para móvil -->
          ${isNativeApp ? `
            <div class="bg-blue-900/20 rounded-lg p-3 border border-blue-500/30">
              <p class="text-xs text-blue-300 flex items-start gap-2">
                <span>ℹ️</span>
                <span>En la app móvil, Puter AI no está disponible. Usa Gemini (gratis) o un plan Premium.</span>
              </p>
            </div>
          ` : ''}

          <!-- Proveedores gratuitos recomendados -->
          <div class="text-xs text-gray-500">
            <p class="mb-2">🆓 Proveedores gratuitos recomendados:</p>
            <div class="flex flex-wrap justify-center gap-2">
              <span class="px-2 py-1 bg-gray-800 rounded">Gemini (Google)</span>
              <span class="px-2 py-1 bg-gray-800 rounded">Qwen (1M tokens/mes)</span>
              <span class="px-2 py-1 bg-gray-800 rounded">HuggingFace</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 🔧 FIX #25: Preguntas sugeridas dinámicas basadas en el contexto actual
  getSuggestedQuestions() {
    const bookId = this.bookEngine?.getCurrentBook();
    const chapterId = this.bookEngine?.currentChapter;
    const bookData = this.bookEngine?.getCurrentBookData();

    const questions = [];

    // Intentar obtener datos del capítulo actual
    let currentChapter = null;
    if (chapterId && bookData?.sections) {
      for (const section of bookData.sections) {
        if (section.chapters) {
          currentChapter = section.chapters.find(ch => ch.id === chapterId);
          if (currentChapter) break;
        }
      }
    }

    // Si hay capítulo actual, generar preguntas contextuales
    if (currentChapter) {
      // Pregunta sobre el tema del capítulo
      if (currentChapter.title) {
        questions.push(`¿Cuál es la idea principal de "${currentChapter.title}"?`);
      }

      // Pregunta sobre ejercicios si los hay
      if (currentChapter.exercises && currentChapter.exercises.length > 0) {
        questions.push(`¿Cómo puedo practicar los ejercicios de este capítulo?`);
      }

      // Pregunta sobre recursos si los hay
      if (currentChapter.resources && currentChapter.resources.length > 0) {
        questions.push(`¿Qué recursos adicionales recomiendas para profundizar?`);
      }

      // Pregunta sobre aplicación práctica
      questions.push('¿Cómo aplico estos conceptos en mi vida diaria?');
    }
    // 🔧 FIX #25: Generar preguntas basadas en el contenido real del libro (sin hardcodeo)
    else if (bookData) {
      // Pregunta sobre el título/tema del libro
      if (bookData.title) {
        questions.push(`¿Cuál es la idea central de "${bookData.title}"?`);
      }

      // Pregunta basada en el subtítulo o descripción
      if (bookData.subtitle) {
        questions.push(`Explícame más sobre ${bookData.subtitle.toLowerCase()}`);
      }

      // Analizar primeras secciones/capítulos para generar preguntas relevantes
      if (bookData.sections && bookData.sections.length > 0) {
        const firstSection = bookData.sections[0];

        // Pregunta sobre la primera sección
        if (firstSection.title && firstSection.title !== bookData.title) {
          questions.push(`¿Qué aborda el libro sobre ${firstSection.title.toLowerCase()}?`);
        }

        // Si hay capítulos, preguntar sobre conceptos del primer capítulo
        if (firstSection.chapters && firstSection.chapters.length > 0) {
          const firstChapter = firstSection.chapters[0];
          if (firstChapter.title) {
            questions.push(`Explícame el concepto de "${firstChapter.title}"`);
          }
        }
      }

      // Pregunta genérica de aplicación práctica
      questions.push('¿Cómo puedo aplicar las enseñanzas de este libro?');
    }
    // Fallback solo si no hay datos del libro
    else {
      questions.push(
        '¿Cuál es la idea central del libro?',
        'Explícame un concepto clave',
        '¿Cómo aplico esto en mi vida?'
      );
    }

    // Asegurar que siempre haya al menos 3 preguntas
    while (questions.length < 3) {
      questions.push('Cuéntame más sobre este tema');
    }

    // Limitar a 4 preguntas máximo
    return questions.slice(0, 4);
  }

  renderMessage(msg, index) {
    const isUser = msg.role === 'user';
    const isError = msg.isError === true;

    // Estilo especial para mensajes de error
    const errorStyles = isError
      ? 'bg-red-900/40 border-red-600 border-2 text-white'
      : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100';

    const avatarStyles = isError
      ? 'bg-red-600'
      : (isUser ? 'bg-cyan-600' : 'bg-purple-600');

    return `
      <div class="message ${isUser ? 'user-message' : 'ai-message'} ${isError ? 'error-message' : ''} animate-fade-in" data-index="${index}">
        <div class="flex gap-3 ${isUser ? 'flex-row-reverse' : ''}">
          <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${avatarStyles}">
            ${isUser ? Icons.user(20) : (isError ? '⚠️' : Icons.bot(20))}
          </div>

          <div class="flex-1 ${isUser ? 'text-right' : ''}">
            <div class="inline-block max-w-[80%] p-4 rounded-2xl ${
              isUser
                ? 'bg-cyan-600 text-white rounded-tr-none'
                : `${errorStyles} rounded-tl-none`
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

  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  formatMessageContent(content) {
    // Sanitizar primero para prevenir XSS
    let formatted = this.escapeHtml(content);

    // Negritas (después de sanitizar)
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
      <div class="border-t border-gray-700 p-2 sm:p-4 flex-shrink-0">
        <form id="ai-chat-form" class="flex gap-2 sm:gap-3">
          <textarea
            id="ai-chat-input"
            rows="2"
            placeholder="${this.i18n.t('chat.placeholder')}"
            class="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg resize-none focus:border-cyan-500 focus:outline-none transition text-sm sm:text-base text-gray-900 dark:text-white"
            ${this.isLoading ? 'disabled' : ''}
          ></textarea>
          <button
            type="submit"
            class="px-3 py-2 sm:px-6 sm:py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base flex-shrink-0 min-w-[3rem] sm:min-w-0"
            ${this.isLoading ? 'disabled' : ''}
          >
            <span class="text-lg sm:text-base">${this.isLoading ? '⏳' : '📤'}</span>
            <span class="hidden sm:inline">${this.isLoading ? this.i18n.t('chat.thinking') : this.i18n.t('chat.send')}</span>
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

    // Botón de Login (cuando no hay IA disponible)
    const loginBtn = document.getElementById('ai-chat-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        this.close();
        // Abrir modal de autenticación
        if (window.authModal) {
          window.authModal.open();
        } else if (window.openAuthModal) {
          window.openAuthModal();
        } else {
          window.toast?.info('Función de login no disponible');
        }
      });
    }

    // Botón de Ver Planes (cuando está autenticado pero sin premium)
    const plansBtn = document.getElementById('ai-chat-plans-btn');
    if (plansBtn) {
      plansBtn.addEventListener('click', () => {
        this.close();
        // Abrir sección de planes/premium
        if (window.openPremiumModal) {
          window.openPremiumModal();
        } else if (window.showPremiumPlans) {
          window.showPremiumPlans();
        } else {
          // Intentar abrir ajustes de perfil
          window.location.hash = '#premium';
          window.toast?.info('Ve a tu perfil para ver los planes disponibles');
        }
      });
    }

    // Botón de Ajustes IA (para configurar propia API key)
    const settingsBtn = document.getElementById('ai-chat-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.close();
        // Abrir ajustes de IA
        if (window.aiSettingsModal) {
          window.aiSettingsModal.open();
        } else if (window.aiLazyLoader?.showAISettings) {
          window.aiLazyLoader.showAISettings();
        } else {
          window.toast?.info('Cargando ajustes de IA...');
        }
      });
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

    // 🔧 FIX #21: Remover handler anterior antes de añadir nuevo para evitar sobrescritura
    if (this.boundEscHandler) {
      document.removeEventListener('keydown', this.boundEscHandler);
    }

    // ESC key - store bound handler for cleanup
    this.boundEscHandler = this.handleEscKey.bind(this);
    document.addEventListener('keydown', this.boundEscHandler);

    // Form submit
    const form = document.getElementById('ai-chat-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.sendMessage();
      });
    }

    // Toggle AI config panel
    const toggleConfigBtn = document.getElementById('toggle-ai-config');
    if (toggleConfigBtn) {
      toggleConfigBtn.addEventListener('click', () => {
        // 🔧 FIX #22: Guardar texto del input antes del re-render
        const currentInput = document.getElementById('ai-chat-input');
        const savedInputValue = currentInput?.value || '';

        this.showConfig = !this.showConfig;
        this.render();
        this.attachEventListeners();

        // 🔧 FIX #22: Restaurar texto con requestAnimationFrame para asegurar DOM listo
        requestAnimationFrame(() => {
          const newInput = document.getElementById('ai-chat-input');
          if (newInput && savedInputValue) {
            newInput.value = savedInputValue;
            newInput.focus();
          }
        });
      });
    }

    // Config panel event listeners
    this.attachConfigEventListeners();

    // Mode buttons
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        this.switchMode(mode);
      });
    });

    // Practical mode toggle
    const practicalModeToggle = document.getElementById('practical-mode-toggle');
    if (practicalModeToggle) {
      practicalModeToggle.addEventListener('change', (e) => {
        this.practicalMode = e.target.checked;
        // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
        try {
          localStorage.setItem('ai-practical-mode', this.practicalMode ? 'true' : 'false');
        } catch (error) {
          logger.error('Error guardando modo práctico:', error);
        }

        if (window.toast) {
          window.toast.info(this.practicalMode ?
            'Modo Práctico activado: Recibirás planes de acción con enlaces' :
            'Modo Práctico desactivado'
          );
        }
      });
    }

    // Quick provider selector
    const quickProviderSelector = document.getElementById('quick-provider-selector');
    if (quickProviderSelector) {
      quickProviderSelector.addEventListener('change', (e) => {
        const provider = e.target.value;
        if (window.aiConfig) {
          // 🔧 FIX #22: Guardar texto del input antes del re-render
          const currentInput = document.getElementById('ai-chat-input');
          const savedInputValue = currentInput?.value || '';

          // Cambiar proveedor (esto también actualiza el config)
          window.aiConfig.config.provider = provider;
          window.aiConfig.saveConfig();

          // Re-render para actualizar el selector de modelos
          this.render();
          this.attachEventListeners();

          // 🔧 FIX #22: Restaurar texto con requestAnimationFrame para asegurar DOM listo
          requestAnimationFrame(() => {
            const newInput = document.getElementById('ai-chat-input');
            if (newInput && savedInputValue) {
              newInput.value = savedInputValue;
              newInput.focus(); // Mantener foco en input
            }
          });

          // Mostrar estado
          if (!this.isProviderConfigured(provider)) {
            window.toast?.warning(`${provider} no está configurado. Haz clic en ⚙️ para añadir tu API key.`);
          } else {
            window.toast?.success(`Cambiado a ${provider}`);
          }
        }
      });
    }

    // Quick model selector
    const quickModelSelector = document.getElementById('quick-model-selector');
    if (quickModelSelector) {
      quickModelSelector.addEventListener('change', (e) => {
        const selectedModel = e.target.value;
        if (window.aiConfig) {
          window.aiConfig.setSelectedModel(selectedModel);
          // logger.debug(`✅ Modelo cambiado a: ${selectedModel}`);
        }
      });
    }

    // Suggested questions - usar event delegation en el contenedor de mensajes
    const messagesArea = document.getElementById('ai-chat-messages');
    // logger.debug('🔧 Configurando eventos sugerencias, messagesArea:', !!messagesArea);
    if (messagesArea) {
      messagesArea.addEventListener('click', (e) => {
        // logger.debug('👆 Click en messagesArea, target:', e.target.className);
        const btn = e.target.closest('.suggested-question');
        if (btn) {
          e.preventDefault();
          e.stopPropagation();
          const questionIndex = parseInt(btn.getAttribute('data-question-index'), 10);
          const suggestedQuestions = this.getSuggestedQuestions();
          const question = suggestedQuestions[questionIndex];
          const input = document.getElementById('ai-chat-input');

          // logger.debug('📝 Sugerencia clickeada:', questionIndex, question);

          if (input && question) {
            input.value = question;
            input.focus();
            // Feedback visual
            btn.classList.add('bg-cyan-600/50');
            setTimeout(() => btn.classList.remove('bg-cyan-600/50'), 200);
          }
        }
      });
    }

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

  attachConfigEventListeners() {
    // Provider selector change
    const providerSelect = document.getElementById('chat-provider-select');
    if (providerSelect) {
      providerSelect.addEventListener('change', (e) => {
        const provider = e.target.value;

        // Update model selector
        const modelSection = document.getElementById('chat-model-section');
        if (modelSection) {
          modelSection.innerHTML = this.renderModelSelector(provider);
        }

        // Update API key section
        const apiKeySection = document.getElementById('chat-api-key-section');
        if (apiKeySection) {
          apiKeySection.innerHTML = this.renderApiKeyInput(provider);
          this.attachToggleKeyVisibility();
        }
      });
    }

    // Toggle key visibility
    this.attachToggleKeyVisibility();

    // Save config button
    const saveBtn = document.getElementById('save-chat-config');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveConfig());
    }

    // Cancel config button
    const cancelBtn = document.getElementById('cancel-chat-config');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        // 🔧 FIX #22: Guardar texto del input antes del re-render
        const currentInput = document.getElementById('ai-chat-input');
        const savedInputValue = currentInput?.value || '';

        this.showConfig = false;
        this.render();
        this.attachEventListeners();

        // 🔧 FIX #22: Restaurar texto con requestAnimationFrame para asegurar DOM listo
        requestAnimationFrame(() => {
          const newInput = document.getElementById('ai-chat-input');
          if (newInput && savedInputValue) {
            newInput.value = savedInputValue;
            newInput.focus();
          }
        });
      });
    }
  }

  attachToggleKeyVisibility() {
    const toggleBtn = document.getElementById('toggle-chat-key');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const input = document.getElementById('chat-api-key-input');
        if (input) {
          input.type = input.type === 'password' ? 'text' : 'password';
        }
      });
    }
  }

  saveConfig() {
    const aiConfig = window.aiConfig;
    if (!aiConfig) return;

    const providerSelect = document.getElementById('chat-provider-select');
    const modelSelect = document.getElementById('chat-model-select');
    const apiKeyInput = document.getElementById('chat-api-key-input');

    if (!providerSelect) return;

    const provider = providerSelect.value;
    const model = modelSelect?.value;
    const apiKey = apiKeyInput?.value?.trim() || '';

    // 🔧 FIX #22: Guardar texto del input antes del re-render
    const currentInput = document.getElementById('ai-chat-input');
    const savedInputValue = currentInput?.value || '';

    // Guardar según el proveedor
    switch (provider) {
      case 'claude':
        if (apiKey) aiConfig.setClaudeApiKey(apiKey);
        break;
      case 'openai':
        if (apiKey) aiConfig.setOpenAIApiKey(apiKey);
        break;
      case 'gemini':
        if (apiKey) aiConfig.setGeminiApiKey(apiKey);
        break;
      case 'qwen':
        if (apiKey) aiConfig.setQwenApiKey(apiKey);
        break;
      case 'mistral':
        if (apiKey) aiConfig.setMistralApiKey(apiKey);
        break;
      case 'huggingface':
        if (apiKey) aiConfig.setHuggingFaceToken(apiKey);
        break;
      case 'ollama':
        if (apiKey) aiConfig.enableOllama(apiKey);
        break;
      case 'local':
        aiConfig.useLocalMode();
        break;
    }

    // Guardar modelo seleccionado
    if (model) {
      aiConfig.setSelectedModel(model);
    }

    // Cerrar panel de configuración
    this.showConfig = false;
    this.render();
    this.attachEventListeners();

    // 🔧 FIX #22: Restaurar texto con requestAnimationFrame para asegurar DOM listo
    requestAnimationFrame(() => {
      const newInput = document.getElementById('ai-chat-input');
      if (newInput && savedInputValue) {
        newInput.value = savedInputValue;
        newInput.focus();
      }
    });

    // Mostrar toast de confirmación
    if (window.toast) {
      window.toast.success('Configuración de IA guardada');
    } else {
      // logger.debug('✅ Configuración de IA guardada');
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
    // 🔧 FIX #22: Guardar texto del input antes del re-render
    const currentInput = document.getElementById('ai-chat-input');
    const savedInputValue = currentInput?.value || '';

    this.currentMode = mode;
    this.render();
    this.attachEventListeners();

    // 🔧 FIX #22: Restaurar texto con requestAnimationFrame para asegurar DOM listo
    requestAnimationFrame(() => {
      const newInput = document.getElementById('ai-chat-input');
      if (newInput && savedInputValue) {
        newInput.value = savedInputValue;
        newInput.focus();
      }
    });
  }

  async sendMessage() {
    const input = document.getElementById('ai-chat-input');
    if (!input || !input.value.trim() || this.isLoading) return;

    const userMessage = input.value.trim();
    input.value = '';

    // 🔧 FIX #23: Verificar créditos usando método centralizado
    const estimatedInputTokens = Math.ceil(userMessage.length / 4) + 500;
    const estimatedOutputTokens = 500;
    const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;

    const hasCredits = await this.checkCredits(estimatedTotalTokens);
    if (!hasCredits) {
      this.showNoCreditsMessage(estimatedTotalTokens);
      return;
    }

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

      // 🔧 FIX #23: Consumir créditos usando método centralizado
      await this.consumeCredits(userMessage, response);

      // Añadir respuesta de IA
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      });

      // Track para logros
      if (window.achievementSystem) {
        window.achievementSystem.trackAIChat();
      }

    } catch (error) {
      logger.error('Error getting AI response:', error);

      // Mensaje de error detallado
      let errorContent = `❌ **Error de IA**\n\n`;

      // Analizar tipo de error
      const errorMessage = error.message || 'Error desconocido';

      if (errorMessage.includes('API key') || errorMessage.includes('unauthorized') || errorMessage.includes('invalid')) {
        errorContent += `🔑 **Problema de autenticación**\n\n${errorMessage}\n\n💡 **Solución:** Ve a ⚙️ Configuración > Inteligencia Artificial y verifica tu API key.`;
      } else if (errorMessage.includes('quota') || errorMessage.includes('crédito') || errorMessage.includes('credit') || errorMessage.includes('insufficient')) {
        errorContent += `💳 **Sin créditos disponibles**\n\n${errorMessage}\n\n💡 **Solución:** Recarga créditos en tu cuenta o cambia a otro proveedor en ⚙️ Configuración > IA.`;
      } else if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('rate limit') || errorMessage.includes('límite')) {
        errorContent += `⏱️ **Límite de uso alcanzado**\n\n${errorMessage}\n\n💡 **Solución:** Espera unos minutos o cambia a otro proveedor en ⚙️ Configuración > IA.`;
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('conexión')) {
        errorContent += `📡 **Problema de conexión**\n\n${errorMessage}\n\n💡 **Solución:** Verifica tu conexión a internet e intenta nuevamente.`;
      } else if (errorMessage.includes('not configured') || errorMessage.includes('no disponible')) {
        errorContent += `⚙️ **Configuración necesaria**\n\n${errorMessage}\n\n💡 **Solución:** Configura tu proveedor de IA en ⚙️ Configuración > Inteligencia Artificial.`;
      } else {
        errorContent += `${errorMessage}\n\n💡 **Solución:** Verifica tu configuración de IA en ⚙️ Configuración > Inteligencia Artificial e intenta nuevamente.`;
      }

      this.conversationHistory.push({
        role: 'assistant',
        content: errorContent,
        timestamp: new Date().toISOString(),
        isError: true
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

    // 🔧 FIX #27: Usar tamaño de historial configurable
    const history = this.conversationHistory
      .slice(-this.maxHistoryLength)
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
    let context = `Eres un asistente experto sobre el libro "${bookData.title}" por ${authorsString}.\n\n`;

    // Añadir contexto del modo actual (si aplica)
    if (bookConfig?.features?.aiChat?.modes?.[this.currentMode]) {
      const modeConfig = bookConfig.features.aiChat.modes[this.currentMode];
      context += modeConfig.systemPrompt + '\n\n';
    } else if (bookConfig?.features?.aiChat?.systemPrompt) {
      context += bookConfig.features.aiChat.systemPrompt + '\n\n';
    }

    // Añadir contexto del capítulo actual CON SU CONTENIDO
    const currentChapterId = this.bookEngine.currentChapter;
    if (currentChapterId) {
      const chapter = this.bookEngine.getChapter(currentChapterId);
      if (chapter) {
        context += `=== CAPÍTULO ACTUAL ===\n`;
        context += `Título: "${chapter.title}"\n\n`;

        // Añadir epígrafe si existe
        if (chapter.epigraph) {
          context += `Epígrafe: "${chapter.epigraph.text}" - ${chapter.epigraph.author}\n\n`;
        }

        // Añadir contenido del capítulo (limitado para no exceder tokens)
        if (chapter.content) {
          // 🔧 FIX #26: Truncado inteligente que prioriza contenido importante
          const cleanContent = chapter.content
            .replace(/<[^>]*>/g, '') // Quitar tags HTML
            .replace(/\s+/g, ' ')     // Normalizar espacios
            .trim();

          const maxLength = 4000;
          let truncatedContent;

          if (cleanContent.length <= maxLength) {
            // Si cabe todo, incluir todo
            truncatedContent = cleanContent;
          } else {
            // Truncado inteligente: priorizar párrafos importantes
            const paragraphs = cleanContent.split(/(?:\. |\n\n)/); // Split por punto+espacio o doble salto

            // Calcular prioridad de cada párrafo
            const scoredParagraphs = paragraphs.map((p, index) => {
              let score = 0;

              // Mayor prioridad para primeros y últimos párrafos
              if (index === 0) score += 10;
              if (index === paragraphs.length - 1) score += 5;

              // Priorizar párrafos con encabezados
              if (p.match(/^##\s+/)) score += 8;

              // Priorizar párrafos con negritas (contenido enfatizado)
              const boldCount = (p.match(/\*\*[^*]+\*\*/g) || []).length;
              score += boldCount * 3;

              // Priorizar párrafos con listas
              if (p.match(/^[-•*]\s+/) || p.match(/^\d+\.\s+/)) score += 4;

              // Priorizar párrafos con palabras clave importantes
              const keywords = ['importante', 'clave', 'fundamental', 'esencial', 'crucial', 'ejemplo', 'práctica'];
              keywords.forEach(kw => {
                if (p.toLowerCase().includes(kw)) score += 2;
              });

              return { text: p, score, length: p.length };
            });

            // Ordenar por prioridad descendente
            scoredParagraphs.sort((a, b) => b.score - a.score);

            // Construir contenido truncado con los párrafos más importantes
            const selectedParagraphs = [];
            let currentLength = 0;

            for (const para of scoredParagraphs) {
              if (currentLength + para.length + 2 <= maxLength) { // +2 por ". "
                selectedParagraphs.push(para);
                currentLength += para.length + 2;
              }
            }

            // Reordenar párrafos seleccionados según orden original (para coherencia)
            selectedParagraphs.sort((a, b) => {
              return paragraphs.indexOf(a.text) - paragraphs.indexOf(b.text);
            });

            truncatedContent = selectedParagraphs.map(p => p.text).join('. ');

            // Añadir indicador de truncado solo si efectivamente se truncó
            if (truncatedContent.length < cleanContent.length) {
              truncatedContent += '... [contenido resumido inteligentemente]';
            }
          }

          context += `Contenido del capítulo:\n${truncatedContent}\n\n`;
        }

        // Añadir pregunta de cierre si existe
        if (chapter.closingQuestion) {
          context += `Pregunta de cierre del capítulo: "${chapter.closingQuestion}"\n\n`;
        }

        context += `=== FIN DEL CAPÍTULO ===\n\n`;
      }
    }

    // Instrucciones generales
    context += `INSTRUCCIONES: Responde basándote en el contenido del capítulo actual. Si el usuario pregunta sobre algo específico del capítulo, usa la información proporcionada arriba. Sé claro, profundo y relevante. Si no tienes información suficiente del capítulo para responder, indícalo honestamente.`;

    // 🔧 FIX #28: Modo práctico conciso (reducción de ~100 líneas a ~8 líneas = -90% tokens)
    if (this.practicalMode) {
      const currentChapterId = this.bookEngine.currentChapter;
      const currentChapterData = currentChapterId ? this.bookEngine.getChapter(currentChapterId) : null;
      const exercisesCount = currentChapterData?.exercises?.length || 0;

      context += `\n\n=== MODO PRÁCTICO ===\n`;
      context += `Eres un guía práctico. Enfócate en:\n`;
      context += `- Ejercicios concretos\n`;
      context += `- Pasos accionables\n`;
      context += `- Ejemplos reales\n\n`;
      context += `Capítulo actual: ${currentChapterData?.title || 'No seleccionado'}\n`;
      context += `Ejercicios disponibles: ${exercisesCount}`;
    }

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

  // 🔧 FIX #27: Permitir configuración del tamaño del historial
  setMaxHistory(length) {
    this.maxHistoryLength = length;
    // 🔧 FIX v2.9.198: Error handling - prevent silent failures in localStorage operations
    try {
      localStorage.setItem('ai-max-history', length.toString());
    } catch (error) {
      logger.error('Error guardando tamaño de historial de IA:', error);
    }
  }

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
