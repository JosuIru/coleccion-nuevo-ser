// ============================================================================
// AI SETTINGS MODAL - Configuración de Proveedores de IA
// ============================================================================

class AISettingsModal {
  constructor(aiConfig) {
    this.aiConfig = aiConfig;
    this.i18n = window.i18n || new I18n();
    this.isOpen = false;
  }

  open() {
    this.isOpen = true;
    this.render();
    this.attachEventListeners();
  }

  close() {
    this.isOpen = false;
    // 🔧 FIX #32: Cleanup escape key handler to prevent memory leaks
    if (this.handleEscape) {
      document.removeEventListener('keydown', this.handleEscape);
      this.handleEscape = null;
    }
    const modal = document.getElementById('ai-settings-modal');
    if (modal) modal.remove();
  }

  render() {
    // Remover modal anterior si existe
    const existing = document.getElementById('ai-settings-modal');
    if (existing) existing.remove();

    // Verificar que aiConfig existe
    if (!this.aiConfig) {
      logger.error('AIConfig no está disponible');
      return;
    }

    const currentProvider = this.aiConfig.getCurrentProvider();
    const claudeKey = this.aiConfig.getClaudeApiKey();
    const openaiKey = this.aiConfig.getOpenAIApiKey();
    const geminiKey = this.aiConfig.getGeminiApiKey();
    const mistralKey = this.aiConfig.getMistralApiKey();
    const huggingfaceToken = this.aiConfig.getHuggingFaceToken();
    const ollamaUrl = this.aiConfig.getOllamaUrl();

    const html = `
      <div id="ai-settings-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[10000] p-4">
        <div class="bg-gray-900 rounded-xl max-w-sm sm:max-w-lg md:max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-cyan-500/30">
          <!-- Header -->
          <div class="p-4 sm:p-6 border-b border-gray-800">
            <div class="flex items-center justify-between">
              <h2 class="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
                ${Icons.settings(24)} ${this.i18n.t('ai.title')}
              </h2>
              <button id="close-ai-settings" class="hover:text-red-400 transition flex items-center justify-center" aria-label="Cerrar configuración de IA">
                ${Icons.close(24)}
              </button>
            </div>
            <p class="text-sm opacity-70 mt-2">
              Configura el proveedor de IA para el chat interactivo
            </p>
          </div>

          <!-- Content -->
          <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">

            <!-- Provider Selector -->
            <div>
              <label class="block text-sm font-bold mb-3">${this.i18n.t('ai.provider')}</label>
              <select id="ai-provider-select" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white">
                <option value="claude" ${currentProvider === 'claude' ? 'selected' : ''}>
                  🚀 Claude (Anthropic) - Calidad Máxima ★★★★★
                </option>
                <option value="openai" ${currentProvider === 'openai' ? 'selected' : ''}>
                  💬 ChatGPT (OpenAI) - Alta Calidad ★★★★★
                </option>
                <option value="gemini" ${currentProvider === 'gemini' ? 'selected' : ''}>
                  ✨ Gemini (Google) - Gratis/Pago ★★★★☆
                </option>
                <option value="mistral" ${currentProvider === 'mistral' ? 'selected' : ''}>
                  🌀 Mistral AI - Económico ★★★★★
                </option>
                <option value="huggingface" ${currentProvider === 'huggingface' ? 'selected' : ''}>
                  🤗 HuggingFace - Gratis ★★★☆☆
                </option>
                <option value="ollama" ${currentProvider === 'ollama' ? 'selected' : ''}>
                  🦙 Ollama (Local) - Gratis & Privado ★★★★☆
                </option>
                <option value="local" ${currentProvider === 'local' ? 'selected' : ''}>
                  💾 Modo Local - Sin IA ★★☆☆☆
                </option>
              </select>
            </div>

            <!-- Claude API Key -->
            <div id="claude-config" class="${currentProvider === 'claude' ? '' : 'hidden'}">
              <label class="block text-sm font-bold mb-2">${this.i18n.t('ai.apiKey')}</label>
              <div class="space-y-2">
                <input
                  type="password"
                  id="claude-api-key-input"
                  value="${claudeKey || ''}"
                  placeholder="sk-ant-..."
                  class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                />
                <div class="flex items-center gap-2">
                  <button id="toggle-key-visibility" class="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    ${Icons.eye(12)} Mostrar/Ocultar
                  </button>
                  <span class="text-xs opacity-50">|</span>
                  <a href="https://console.anthropic.com/settings/keys" target="_blank" class="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    ${Icons.link(12)} ${this.i18n.t('ai.getKey')}
                  </a>
                </div>
              </div>
              <div class="mt-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg text-xs space-y-1">
                <p class="font-bold flex items-center gap-1">${Icons.helpCircle(14)} Información:</p>
                <p>• Calidad máxima de respuestas</p>
                <p>• Costo: ~$0.01-0.02 por conversación</p>
                <p>• Tu API key se guarda solo en tu navegador (LocalStorage)</p>
                <p>• Necesitas cuenta en Anthropic</p>
              </div>
            </div>

            <!-- OpenAI API Key -->
            <div id="openai-config" class="${currentProvider === 'openai' ? '' : 'hidden'}">
              <label class="block text-sm font-bold mb-2">OpenAI API Key</label>
              <div class="space-y-2">
                <input
                  type="password"
                  id="openai-api-key-input"
                  value="${openaiKey || ''}"
                  placeholder="sk-..."
                  class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                />
                <div class="flex items-center gap-2">
                  <button id="toggle-openai-visibility" class="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    ${Icons.eye(12)} Mostrar/Ocultar
                  </button>
                  <span class="text-xs opacity-50">|</span>
                  <a href="https://platform.openai.com/api-keys" target="_blank" class="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    ${Icons.link(12)} Obtener API Key
                  </a>
                </div>
              </div>
              <div class="mt-3 p-3 bg-green-900/20 border border-green-700/30 rounded-lg text-xs space-y-1">
                <p class="font-bold flex items-center gap-1">${Icons.messageSquare(14)} ChatGPT:</p>
                <p>• Alta calidad de respuestas (GPT-4o-mini)</p>
                <p>• Costo: ~$0.002-0.02 por conversación</p>
                <p>• Tu API key se guarda solo en tu navegador</p>
                <p>• Muy rápido y fiable</p>
              </div>
            </div>

            <!-- Gemini API Key -->
            <div id="gemini-config" class="${currentProvider === 'gemini' ? '' : 'hidden'}">
              <label class="block text-sm font-bold mb-2">Gemini API Key</label>
              <div class="space-y-2">
                <input
                  type="password"
                  id="gemini-api-key-input"
                  value="${geminiKey || ''}"
                  placeholder="AIza..."
                  class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                />
                <div class="flex items-center gap-2">
                  <button id="toggle-gemini-visibility" class="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    ${Icons.eye(12)} Mostrar/Ocultar
                  </button>
                  <span class="text-xs opacity-50">|</span>
                  <a href="https://aistudio.google.com/apikey" target="_blank" class="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    ${Icons.link(12)} Obtener API Key Gratis
                  </a>
                </div>
              </div>
              <div class="mt-3 p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg text-xs space-y-1">
                <p class="font-bold flex items-center gap-1">${Icons.sparkles(14)} Gemini (Google):</p>
                <p>• Tier gratuito: 60 consultas/minuto</p>
                <p>• Buena calidad de respuestas</p>
                <p>• Rápido y multimodal</p>
                <p>• Ideal para empezar sin costo</p>
              </div>
            </div>

            <!-- Mistral API Key -->
            <div id="mistral-config" class="${currentProvider === 'mistral' ? '' : 'hidden'}">
              <label class="block text-sm font-bold mb-2">Mistral API Key</label>
              <div class="space-y-2">
                <input
                  type="password"
                  id="mistral-api-key-input"
                  value="${mistralKey || ''}"
                  placeholder="..."
                  class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                />
                <div class="flex items-center gap-2">
                  <button id="toggle-mistral-visibility" class="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    ${Icons.eye(12)} Mostrar/Ocultar
                  </button>
                  <span class="text-xs opacity-50">|</span>
                  <a href="https://console.mistral.ai/api-keys" target="_blank" class="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    ${Icons.link(12)} Obtener API Key
                  </a>
                </div>
              </div>
              <div class="mt-3 p-3 bg-orange-900/20 border border-orange-700/30 rounded-lg text-xs space-y-1">
                <p class="font-bold flex items-center gap-1">${Icons.refreshCw(14)} Mistral AI:</p>
                <p>• Alta calidad (mistral-small-latest)</p>
                <p>• Muy económico: ~$0.001/conversación</p>
                <p>• Rápido y eficiente</p>
                <p>• Modelos open-weight europeos</p>
              </div>
            </div>

            <!-- HuggingFace Token -->
            <div id="huggingface-config" class="${currentProvider === 'huggingface' ? '' : 'hidden'}">
              <label class="block text-sm font-bold mb-2">HuggingFace Token</label>
              <div class="space-y-2">
                <input
                  type="password"
                  id="huggingface-token-input"
                  value="${huggingfaceToken || ''}"
                  placeholder="hf_..."
                  class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                />
                <div class="flex items-center gap-2">
                  <button id="toggle-hf-visibility" class="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    ${Icons.eye(12)} Mostrar/Ocultar
                  </button>
                  <span class="text-xs opacity-50">|</span>
                  <a href="https://huggingface.co/settings/tokens" target="_blank" class="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                    ${Icons.link(12)} Obtener Token Gratis
                  </a>
                </div>
              </div>
              <div class="mt-3 p-3 bg-green-900/20 border border-green-700/30 rounded-lg text-xs space-y-1">
                <p class="font-bold flex items-center gap-1">${Icons.sparkles(14)} Información:</p>
                <p>• 100% Gratis - Sin límites estrictos</p>
                <p>• Calidad media de respuestas</p>
                <p>• Tu token se guarda solo en tu navegador</p>
                <p>• Crear cuenta gratis en huggingface.co</p>
              </div>
            </div>

            <!-- Ollama Config -->
            <div id="ollama-config" class="${currentProvider === 'ollama' ? '' : 'hidden'}">
              <label class="block text-sm font-bold mb-2">Ollama Server URL</label>
              <div class="space-y-2">
                <input
                  type="text"
                  id="ollama-url-input"
                  value="${ollamaUrl || 'http://localhost:11434'}"
                  placeholder="http://localhost:11434"
                  class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                />
                <a href="https://ollama.ai/download" target="_blank" class="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                  ${Icons.link(12)} Descargar Ollama (Gratis)
                </a>
              </div>
              <div class="mt-3 p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg text-xs space-y-1">
                <p class="font-bold flex items-center gap-1">${Icons.settings(14)} Información:</p>
                <p>• 100% Gratis - Ejecuta en tu PC</p>
                <p>• Privacidad total - Sin enviar datos a internet</p>
                <p>• Alta calidad - Modelos como Llama 2, Mistral</p>
                <p>• Requiere instalación local</p>
                <p>• Usa tu GPU/CPU - Sin límites</p>
              </div>
            </div>

            <!-- Local Mode Info -->
            <div id="local-config" class="${currentProvider === 'local' ? '' : 'hidden'}">
              <div class="p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-sm space-y-2">
                <p class="font-bold flex items-center gap-1">${Icons.lightbulb(14)} ${this.i18n.t('ai.localMode')}</p>
                <p class="opacity-80">
                  Este modo proporciona respuestas predefinidas sin usar IA real.
                  Es útil para probar la interfaz sin configurar una API key.
                </p>
                <p class="text-yellow-400 text-xs flex items-center gap-1">
                  ${Icons.alertTriangle(12)} Las respuestas serán genéricas y limitadas
                </p>
              </div>
            </div>

            <!-- Current Status -->
            <div class="p-4 bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border border-cyan-700/30 rounded-lg">
              <p class="text-sm font-bold mb-2 flex items-center gap-2">${Icons.activity(16)} ${this.i18n.t('ai.status')}</p>
              <div class="text-sm space-y-1 opacity-80">
                <p>${this.i18n.t('ai.provider')}: <span class="text-cyan-300 font-bold">${this.getProviderName(currentProvider)}</span></p>
                <p>${this.i18n.t('ai.status')}: <span class="${this.isConfigured(currentProvider) ? 'text-green-400' : 'text-red-400'} font-bold">
                  ${this.isConfigured(currentProvider) ? `✅ ${this.i18n.t('ai.configured')}` : `❌ ${this.i18n.t('ai.notConfigured')}`}
                </span></p>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="p-4 sm:p-6 border-t border-gray-800 flex justify-end gap-2 sm:gap-3">
            <button id="cancel-ai-settings" class="px-4 sm:px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-sm sm:text-base">
              ${this.i18n.t('btn.cancel')}
            </button>
            <button id="save-ai-settings" class="px-4 sm:px-6 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition font-bold text-sm sm:text-base">
              💾 ${this.i18n.t('btn.save')}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  attachEventListeners() {
    // Close buttons
    document.getElementById('close-ai-settings')?.addEventListener('click', () => this.close());
    document.getElementById('cancel-ai-settings')?.addEventListener('click', () => this.close());

    // Save button
    document.getElementById('save-ai-settings')?.addEventListener('click', () => this.save());

    // Provider selector
    document.getElementById('ai-provider-select')?.addEventListener('change', (e) => {
      this.updateProviderUI(e.target.value);
    });

    // Toggle key visibility
    document.getElementById('toggle-key-visibility')?.addEventListener('click', () => {
      const input = document.getElementById('claude-api-key-input');
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    });

    // Toggle HuggingFace token visibility
    document.getElementById('toggle-hf-visibility')?.addEventListener('click', () => {
      const input = document.getElementById('huggingface-token-input');
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    });

    // Toggle OpenAI key visibility
    document.getElementById('toggle-openai-visibility')?.addEventListener('click', () => {
      const input = document.getElementById('openai-api-key-input');
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    });

    // Toggle Gemini key visibility
    document.getElementById('toggle-gemini-visibility')?.addEventListener('click', () => {
      const input = document.getElementById('gemini-api-key-input');
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    });

    // Toggle Mistral key visibility
    document.getElementById('toggle-mistral-visibility')?.addEventListener('click', () => {
      const input = document.getElementById('mistral-api-key-input');
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    });

    // Close on backdrop click
    document.getElementById('ai-settings-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'ai-settings-modal') this.close();
    });

    // ESC to close
    document.addEventListener('keydown', this.handleEscape = (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  }

  updateProviderUI(provider) {
    const claudeConfig = document.getElementById('claude-config');
    const openaiConfig = document.getElementById('openai-config');
    const geminiConfig = document.getElementById('gemini-config');
    const mistralConfig = document.getElementById('mistral-config');
    const huggingfaceConfig = document.getElementById('huggingface-config');
    const ollamaConfig = document.getElementById('ollama-config');
    const localConfig = document.getElementById('local-config');

    // Hide all configs first
    [claudeConfig, openaiConfig, geminiConfig, mistralConfig, huggingfaceConfig, ollamaConfig, localConfig].forEach(el => {
      if (el) el.classList.add('hidden');
    });

    // Show the selected one
    const configMap = {
      'claude': claudeConfig,
      'openai': openaiConfig,
      'gemini': geminiConfig,
      'mistral': mistralConfig,
      'huggingface': huggingfaceConfig,
      'ollama': ollamaConfig,
      'local': localConfig
    };

    const selectedConfig = configMap[provider];
    if (selectedConfig) {
      selectedConfig.classList.remove('hidden');
    }
  }

  save() {
    const provider = document.getElementById('ai-provider-select')?.value;

    if (provider === 'claude') {
      const apiKey = document.getElementById('claude-api-key-input')?.value.trim();
      if (apiKey) {
        this.aiConfig.setClaudeApiKey(apiKey);
        logger.log('✅ Claude API Key guardada');
      } else {
        window.toast?.warning('Por favor ingresa una API Key de Claude');
        return;
      }
    } else if (provider === 'openai') {
      const apiKey = document.getElementById('openai-api-key-input')?.value.trim();
      if (apiKey) {
        this.aiConfig.setOpenAIApiKey(apiKey);
        logger.log('✅ OpenAI API Key guardada');
      } else {
        window.toast?.warning('Por favor ingresa una API Key de OpenAI');
        return;
      }
    } else if (provider === 'gemini') {
      const apiKey = document.getElementById('gemini-api-key-input')?.value.trim();
      if (apiKey) {
        this.aiConfig.setGeminiApiKey(apiKey);
        logger.log('✅ Gemini API Key guardada');
      } else {
        window.toast?.warning('Por favor ingresa una API Key de Gemini');
        return;
      }
    } else if (provider === 'mistral') {
      const apiKey = document.getElementById('mistral-api-key-input')?.value.trim();
      if (apiKey) {
        this.aiConfig.setMistralApiKey(apiKey);
        logger.log('✅ Mistral API Key guardada');
      } else {
        window.toast?.warning('Por favor ingresa una API Key de Mistral');
        return;
      }
    } else if (provider === 'huggingface') {
      const token = document.getElementById('huggingface-token-input')?.value.trim();
      if (token) {
        this.aiConfig.setHuggingFaceToken(token);
        logger.log('✅ HuggingFace Token guardado');
      } else {
        window.toast?.warning('Por favor ingresa un token de HuggingFace');
        return;
      }
    } else if (provider === 'ollama') {
      const url = document.getElementById('ollama-url-input')?.value.trim();
      if (url) {
        this.aiConfig.enableOllama(url);
        logger.log('✅ Ollama configurado');
      } else {
        window.toast?.warning('Por favor ingresa la URL de Ollama');
        return;
      }
    } else if (provider === 'local') {
      this.aiConfig.useLocalMode();
      logger.log('✅ Modo Local activado');
    }

    this.close();

    // Show success message
    this.showToast('Configuración guardada correctamente', 'success');
  }

  getProviderName(provider) {
    const names = {
      'claude': 'Claude API (Anthropic)',
      'openai': 'ChatGPT (OpenAI)',
      'gemini': 'Gemini (Google)',
      'mistral': 'Mistral AI',
      'huggingface': 'HuggingFace API',
      'ollama': 'Ollama (Local)',
      'local': 'Modo Local (Sin IA)'
    };
    return names[provider] || provider;
  }

  isConfigured(provider) {
    if (provider === 'claude') {
      return this.aiConfig.isClaudeConfigured();
    } else if (provider === 'openai') {
      return this.aiConfig.isOpenAIConfigured();
    } else if (provider === 'gemini') {
      return this.aiConfig.isGeminiConfigured();
    } else if (provider === 'mistral') {
      return this.aiConfig.isMistralConfigured();
    } else if (provider === 'huggingface') {
      return this.aiConfig.isHuggingFaceConfigured();
    } else if (provider === 'ollama') {
      return true; // No validation needed for local Ollama
    } else if (provider === 'local') {
      return true; // Always configured
    }
    return false;
  }

  showToast(message, type = 'info') {
    const colors = {
      'success': 'bg-green-600',
      'error': 'bg-red-600',
      'info': 'bg-blue-600'
    };

    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 right-6 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-[10000] animate-fade-in`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Exportar para uso global
window.AISettingsModal = AISettingsModal;
