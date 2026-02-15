/**
 * AI Utils - Utilidades compartidas para herramientas IA
 * Centraliza la verificación de disponibilidad, créditos y mensajes de estado
 *
 * @version 1.0.0
 */

class AIUtils {
  constructor() {
    this.logger = window.logger || console;
  }

  // ==========================================================================
  // VERIFICACIÓN DE DISPONIBILIDAD
  // ==========================================================================

  /**
   * Verifica si el usuario es Premium o Pro
   * @returns {boolean}
   */
  isPremiumUser() {
    const profile = window.authHelper?.getProfile?.();
    return profile && ['premium', 'pro'].includes(profile.subscription_tier);
  }

  /**
   * 🔧 v2.9.393: Verifica si el usuario tiene acceso a IA premium
   * Considera plan premium/pro O tokens comprados
   * @returns {boolean}
   */
  hasAIAccess() {
    const profile = window.authHelper?.getProfile?.();
    if (!profile) return false;

    // Plan premium/pro tiene acceso
    if (['premium', 'pro'].includes(profile.subscription_tier)) return true;

    // Tokens comprados dan acceso
    const tokenBalance = profile.token_balance || 0;
    if (tokenBalance > 0) return true;

    // Créditos mensuales restantes
    const aiCredits = profile.ai_credits_remaining || 0;
    if (aiCredits > 0) return true;

    return false;
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!window.authHelper?.user;
  }

  /**
   * Verifica si estamos en app nativa (Capacitor/Cordova)
   * @returns {boolean}
   */
  isNativeApp() {
    return !!(window.Capacitor || window.cordova || document.URL.indexOf('http://') === -1);
  }

  /**
   * Obtiene el proveedor actual de IA
   * @returns {string}
   */
  getCurrentProvider() {
    return window.aiConfig?.getCurrentProvider?.() || 'local';
  }

  /**
   * Verifica si un proveedor está configurado
   * @param {string} provider - Nombre del proveedor
   * @returns {boolean}
   */
  isProviderConfigured(provider) {
    const aiConfig = window.aiConfig;
    if (!aiConfig) return false;

    switch (provider) {
      case 'claude': return aiConfig.isClaudeConfigured?.() || false;
      case 'openai': return aiConfig.isOpenAIConfigured?.() || false;
      case 'gemini': return aiConfig.isGeminiConfigured?.() || false;
      case 'qwen': return aiConfig.isQwenConfigured?.() || false;
      case 'mistral': return aiConfig.isMistralConfigured?.() || false;
      case 'huggingface': return aiConfig.isHuggingFaceConfigured?.() || false;
      case 'ollama': return true;
      case 'local': return true;
      case 'puter': return !this.isNativeApp(); // Puter no funciona en app nativa
      default: return false;
    }
  }

  /**
   * Verifica si hay IA disponible (Premium, tokens o proveedor configurado)
   * 🔧 v2.9.393: Considera tokens comprados además de plan
   * @returns {boolean}
   */
  isAIAvailable() {
    // Premium o tokens comprados siempre tienen IA
    if (this.hasAIAccess()) return true;

    // Verificar proveedor configurado
    const currentProvider = this.getCurrentProvider();

    // Puter no funciona en app nativa
    if (currentProvider === 'puter' && this.isNativeApp()) return false;

    // Local siempre "disponible" (respuestas predefinidas)
    if (currentProvider === 'local') return false; // Pero no es IA real

    return this.isProviderConfigured(currentProvider);
  }

  /**
   * Obtiene información del estado de IA
   * 🔧 v2.9.393: Usa hasAIAccess() que considera tokens además de plan
   * @returns {Object} { available, provider, isPremium, hasAccess, reason }
   */
  getAIStatus() {
    const isPremium = this.isPremiumUser();
    const hasAccess = this.hasAIAccess();  // 🔧 v2.9.393
    const isAuthenticated = this.isAuthenticated();
    const provider = this.getCurrentProvider();
    const isNative = this.isNativeApp();
    const isConfigured = this.isProviderConfigured(provider);

    let available = false;
    let reason = '';

    // 🔧 v2.9.393: Verificar acceso premium O tokens comprados
    if (hasAccess) {
      available = true;
      reason = isPremium ? 'premium' : 'tokens';
    } else if (provider === 'puter' && isNative) {
      available = false;
      reason = 'puter_native';
    } else if (provider === 'local') {
      available = false;
      reason = 'local_only';
    } else if (!isConfigured) {
      available = false;
      reason = 'not_configured';
    } else {
      available = true;
      reason = 'configured';
    }

    return {
      available,
      provider,
      isPremium,
      hasAccess,  // 🔧 v2.9.393
      isAuthenticated,
      isNative,
      isConfigured,
      reason
    };
  }

  // ==========================================================================
  // GESTIÓN DE CRÉDITOS
  // ==========================================================================

  /**
   * Verifica si hay créditos suficientes
   * @param {number} estimatedTokens - Tokens estimados
   * @param {string} feature - Nombre de la feature
   * @returns {Promise<boolean>}
   */
  async checkCredits(estimatedTokens = 1000, feature = 'ai_tool') {
    // Premium no necesita verificación local
    if (this.isPremiumUser()) return true;

    // Si no hay sistema de créditos, permitir
    if (!window.aiPremium) return true;

    // Si no está autenticado, permitir (usará su propia API key)
    if (!this.isAuthenticated()) return true;

    try {
      return await window.aiPremium.checkCredits(estimatedTokens, feature);
    } catch (error) {
      this.logger.warn('[AIUtils] Credit check warning:', error.message);
      return true; // Graceful degradation
    }
  }

  /**
   * Consume créditos después de una consulta
   * @param {string} input - Texto de entrada
   * @param {string} output - Texto de salida
   * @param {string} feature - Nombre de la feature
   */
  async consumeCredits(input, output, feature = 'ai_tool') {
    // Premium no consume créditos localmente
    if (this.isPremiumUser()) return;

    // Si no hay sistema de créditos, no hacer nada
    if (!window.aiPremium) return;

    // Si no está autenticado, no consumir
    if (!this.isAuthenticated()) return;

    try {
      const provider = this.getCurrentProvider();
      const model = window.aiConfig?.getSelectedModel?.() || 'unknown';

      const inputTokens = Math.ceil((input?.length || 0) / 4);
      const outputTokens = Math.ceil((output?.length || 0) / 4);
      const totalTokens = inputTokens + outputTokens;
      const creditsToConsume = Math.ceil(totalTokens / 1000);

      await window.aiPremium.consumeCredits(creditsToConsume, feature, provider, model, totalTokens);
    } catch (error) {
      this.logger.warn('[AIUtils] Credit consume warning:', error.message);
    }
  }

  // ==========================================================================
  // UI COMPONENTS
  // ==========================================================================

  /**
   * Renderiza banner de estado de IA
   * @param {Object} options - Opciones de renderizado
   * @returns {string} HTML del banner
   */
  renderAIStatusBanner(options = {}) {
    const {
      showWhenAvailable = false,
      compact = false,
      onLoginClick: _onLoginClick = null,
      onPlansClick: _onPlansClick = null,
      onSettingsClick: _onSettingsClick = null
    } = options;

    const status = this.getAIStatus();

    // Si IA está disponible y no queremos mostrar nada
    if (status.available && !showWhenAvailable) return '';

    // Si IA está disponible, mostrar badge
    if (status.available) {
      return this.renderAvailableBadge(status, compact);
    }

    // Si no está disponible, mostrar opciones
    return this.renderUnavailableBanner(status, compact);
  }

  /**
   * Renderiza badge cuando IA está disponible
   */
  renderAvailableBadge(status, compact = false) {
    const aiConfig = window.aiConfig;
    const modelName = aiConfig?.getModelInfo?.(aiConfig.getSelectedModel?.())?.name || 'IA';

    if (status.isPremium) {
      if (compact) {
        return `
          <div class="flex items-center gap-1">
            <span class="text-amber-400 text-xs font-semibold">⭐ Premium</span>
            <span class="w-2 h-2 rounded-full bg-green-400"></span>
          </div>
        `;
      }
      return `
        <div class="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/50 rounded-lg px-3 py-1.5">
          <span class="text-amber-400 text-xs font-semibold">⭐ Premium</span>
          <span class="text-gray-400 text-xs">•</span>
          <span class="text-cyan-300 text-xs">${modelName}</span>
          <span class="w-2 h-2 rounded-full bg-green-400" title="IA activa"></span>
        </div>
      `;
    }

    // Usuario con proveedor configurado
    if (compact) {
      return `
        <div class="flex items-center gap-1">
          <span class="text-cyan-300 text-xs">${status.provider}</span>
          <span class="w-2 h-2 rounded-full bg-green-400"></span>
        </div>
      `;
    }
    return `
      <div class="flex items-center gap-2 bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-1.5">
        <span class="text-gray-300 text-xs">${status.provider}</span>
        <span class="text-gray-400 text-xs">•</span>
        <span class="text-cyan-300 text-xs">${modelName}</span>
        <span class="w-2 h-2 rounded-full bg-green-400" title="IA configurada"></span>
      </div>
    `;
  }

  /**
   * Renderiza banner cuando IA no está disponible
   */
  renderUnavailableBanner(status, compact = false) {
    if (compact) {
      return `
        <div class="flex items-center gap-2 bg-amber-900/30 border border-amber-500/30 rounded-lg px-3 py-1.5">
          <span class="text-amber-400 text-xs">⚠️ IA no configurada</span>
          <button class="ai-utils-settings-btn text-cyan-400 text-xs underline">Configurar</button>
        </div>
      `;
    }

    let message = '';
    let tip = '';

    if (status.reason === 'puter_native') {
      message = 'Puter AI no funciona en apps Android. Necesitas configurar otro proveedor.';
      tip = '💡 Gemini de Google es gratis y fácil de configurar.';
    } else if (status.reason === 'local_only') {
      message = 'Modo local activo. Las respuestas serán predefinidas, no de IA real.';
      tip = '💡 Configura una API key para respuestas personalizadas.';
    } else if (status.reason === 'not_configured') {
      message = `El proveedor "${status.provider}" no tiene API key configurada.`;
      tip = '💡 Ve a ⚙️ Configurar IA para añadir tu API key.';
    } else {
      message = 'Configura un proveedor de IA o activa Premium para usar esta función.';
      tip = '💡 Premium incluye Claude 3.5 sin necesidad de API keys.';
    }

    return `
      <div class="bg-gradient-to-r from-amber-900/20 to-gray-800/50 rounded-xl p-4 mb-4 border border-amber-500/30">
        <div class="flex items-start gap-3">
          <span class="text-2xl">🤖</span>
          <div class="flex-1">
            <p class="font-semibold text-amber-300 text-sm mb-1">IA no disponible</p>
            <p class="text-xs text-gray-400 mb-2">${message}</p>
            ${tip ? `<p class="text-xs text-cyan-400/80 mb-3">${tip}</p>` : ''}
            <div class="flex flex-wrap gap-2">
              ${!status.isAuthenticated ? `
                <button type="button" class="ai-utils-login-btn px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-semibold transition">
                  ⭐ Iniciar sesión
                </button>
              ` : `
                <button type="button" class="ai-utils-plans-btn px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-semibold transition">
                  ⭐ Ver planes Premium
                </button>
              `}
              <button type="button" class="ai-utils-settings-btn px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition">
                ⚙️ Configurar IA
              </button>
            </div>
            <p class="text-xs text-emerald-400/70 mt-2">💚 Los fondos apoyan proyectos libres y gratuitos</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza selector rápido de proveedor IA (como en el chat)
   * @param {Object} options - Opciones
   * @returns {string} HTML del selector
   */
  renderProviderSelector(options = {}) {
    const {
      showModels = true,
      inline = true,
      idPrefix = 'ai-utils'
    } = options;

    const aiConfig = window.aiConfig;
    if (!aiConfig) return '';

    const status = this.getAIStatus();

    // Si es Premium, mostrar badge
    if (status.isPremium) {
      const modelName = aiConfig.getModelInfo?.(aiConfig.getSelectedModel?.())?.name || 'Claude 3.5';
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

    // Usuario FREE - mostrar selector
    const currentProvider = this.getCurrentProvider();
    const models = aiConfig.getAvailableModels?.(currentProvider) || [];
    const selectedModel = aiConfig.getSelectedModel?.() || '';
    const isConfigured = this.isProviderConfigured(currentProvider);

    const getStatusIcon = (provider) => this.isProviderConfigured(provider) ? '✓' : '✗';

    const modelSelector = showModels && models.length > 1 ? `
      <select id="${idPrefix}-model-selector"
              class="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-xs text-gray-900 dark:text-white focus:border-cyan-500 focus:outline-none cursor-pointer max-w-[120px]">
        ${models.map(model => `
          <option value="${model.id}" ${model.id === selectedModel ? 'selected' : ''}>
            ${model.name?.length > 15 ? model.name.substring(0, 15) + '...' : model.name}
          </option>
        `).join('')}
      </select>
    ` : '';

    return `
      <div class="flex items-center gap-1 ${inline ? 'mr-2' : ''}">
        <select id="${idPrefix}-provider-selector"
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

  /**
   * Adjunta eventos a los botones del banner de estado
   * @param {HTMLElement} container - Contenedor donde buscar botones
   * @param {Function} onClose - Callback opcional que se ejecuta antes de abrir cualquier modal (ej: cerrar modal actual)
   */
  attachBannerEvents(container, onClose = null) {
    if (!container) return;

    // Botón Login
    const loginBtn = container.querySelector('.ai-utils-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        if (onClose) onClose();
        if (window.authModal) {
          window.authModal.open();
        } else if (window.openAuthModal) {
          window.openAuthModal();
        } else {
          window.toast?.info('Función de login no disponible');
        }
      });
    }

    // Botón Planes
    const plansBtn = container.querySelector('.ai-utils-plans-btn');
    if (plansBtn) {
      plansBtn.addEventListener('click', () => {
        if (onClose) onClose();
        if (window.openPremiumModal) {
          window.openPremiumModal();
        } else if (window.showPremiumPlans) {
          window.showPremiumPlans();
        } else {
          window.location.hash = '#premium';
          window.toast?.info('Ve a tu perfil para ver los planes disponibles');
        }
      });
    }

    // Botón Settings
    const settingsBtn = container.querySelector('.ai-utils-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        if (onClose) onClose();
        if (window.aiSettingsModal) {
          window.aiSettingsModal.open();
        } else if (window.aiLazyLoader?.showAISettings) {
          window.aiLazyLoader.showAISettings();
        } else {
          window.toast?.info('Cargando ajustes de IA...');
        }
      });
    }
  }

  /**
   * Adjunta eventos al selector de proveedor
   * @param {HTMLElement} container - Contenedor
   * @param {string} idPrefix - Prefijo de IDs
   * @param {Function} onProviderChange - Callback al cambiar proveedor
   * @param {Function} onModelChange - Callback al cambiar modelo
   */
  attachProviderSelectorEvents(container, idPrefix = 'ai-utils', onProviderChange = null, onModelChange = null) {
    if (!container) return;

    const providerSelector = container.querySelector(`#${idPrefix}-provider-selector`);
    if (providerSelector) {
      providerSelector.addEventListener('change', (e) => {
        const provider = e.target.value;
        if (window.aiConfig) {
          // 🔧 FIX v2.9.381: Guardar el proveedor Y establecer un modelo por defecto para ese proveedor
          window.aiConfig.config.provider = provider;

          // Establecer modelo por defecto del nuevo proveedor
          const models = window.aiConfig.getAvailableModels(provider);
          if (models && models.length > 0) {
            window.aiConfig.config.preferences = window.aiConfig.config.preferences || {};
            window.aiConfig.config.preferences.selectedModel = models[0].id;
          }

          window.aiConfig.saveConfig();

          // Actualizar el indicador de estado en el DOM
          const statusDot = container.querySelector(`#${idPrefix}-provider-selector`)?.closest('.flex')?.querySelector('.rounded-full');
          const isConfigured = this.isProviderConfigured(provider);

          if (statusDot) {
            statusDot.classList.remove('bg-green-400', 'bg-red-400', 'bg-yellow-400');
            if (isConfigured) {
              statusDot.classList.add('bg-green-400');
            } else if (provider === 'puter' && this.isNativeApp()) {
              statusDot.classList.add('bg-red-400');
            } else {
              statusDot.classList.add('bg-yellow-400');
            }
          }

          // Mensajes según el estado
          if (provider === 'puter' && this.isNativeApp()) {
            window.toast?.warning('⚠️ Puter no funciona en Android. Usa Gemini (gratis) o configura otra IA.', 5000);
          } else if (provider === 'local') {
            window.toast?.info('Modo local: respuestas simuladas. Configura una IA para respuestas reales.', 4000);
          } else if (!isConfigured) {
            window.toast?.warning(`⚙️ ${provider} no tiene API key. Ve a Ajustes > IA para configurar.`, 5000);
          } else {
            const modelName = window.aiConfig.getModelInfo(window.aiConfig.getSelectedModel())?.name || provider;
            window.toast?.success(`✓ Cambiado a ${modelName}`);
          }

          if (onProviderChange) onProviderChange(provider);
        }
      });
    }

    const modelSelector = container.querySelector(`#${idPrefix}-model-selector`);
    if (modelSelector) {
      modelSelector.addEventListener('change', (e) => {
        const model = e.target.value;
        if (window.aiConfig) {
          window.aiConfig.setSelectedModel(model);
          const modelInfo = window.aiConfig.getModelInfo(model);
          window.toast?.info(`Modelo: ${modelInfo?.name || model}`);
          if (onModelChange) onModelChange(model);
        }
      });
    }
  }

  // ==========================================================================
  // MENSAJES DE ERROR
  // ==========================================================================

  /**
   * Formatea mensaje de error de IA para mostrar al usuario
   * @param {Error} error - Error capturado
   * @returns {string} Mensaje formateado
   */
  formatErrorMessage(error) {
    const errorMessage = error?.message || 'Error desconocido';

    if (errorMessage.includes('API key') || errorMessage.includes('unauthorized') || errorMessage.includes('invalid')) {
      return `🔑 **Problema de autenticación**\n\n${errorMessage}\n\n💡 **Solución:** Ve a ⚙️ Configuración > Inteligencia Artificial y verifica tu API key.`;
    }

    if (errorMessage.includes('quota') || errorMessage.includes('crédito') || errorMessage.includes('credit') || errorMessage.includes('insufficient')) {
      return `💳 **Sin créditos disponibles**\n\n${errorMessage}\n\n💡 **Solución:** Recarga créditos o cambia a otro proveedor en ⚙️ Configuración > IA.`;
    }

    if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('rate limit') || errorMessage.includes('límite')) {
      return `⏱️ **Límite de uso alcanzado**\n\n${errorMessage}\n\n💡 **Solución:** Espera unos minutos o cambia a otro proveedor.`;
    }

    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('conexión')) {
      return `📡 **Problema de conexión**\n\n${errorMessage}\n\n💡 **Solución:** Verifica tu conexión a internet.`;
    }

    if (errorMessage.includes('not configured') || errorMessage.includes('no disponible')) {
      return `⚙️ **Configuración necesaria**\n\n${errorMessage}\n\n💡 **Solución:** Configura tu proveedor de IA en ⚙️ Configuración.`;
    }

    return `❌ **Error**\n\n${errorMessage}\n\n💡 **Solución:** Verifica tu configuración de IA e intenta nuevamente.`;
  }

  /**
   * Muestra toast de error formateado
   * @param {Error} error - Error
   */
  showErrorToast(error) {
    const message = error?.message || 'Error desconocido';

    if (message.includes('API key') || message.includes('unauthorized')) {
      window.toast?.error('API Key inválida. Revisa tu configuración de IA.');
    } else if (message.includes('quota') || message.includes('crédito')) {
      window.toast?.error('Sin créditos. Considera Premium o cambia de proveedor.');
    } else if (message.includes('rate limit') || message.includes('límite')) {
      window.toast?.warning('Límite alcanzado. Espera unos minutos.');
    } else if (message.includes('network') || message.includes('fetch')) {
      window.toast?.error('Error de conexión. Verifica tu internet.');
    } else {
      window.toast?.error(message);
    }
  }
}

// Crear instancia global
window.AIUtils = AIUtils;
window.aiUtils = new AIUtils();

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIUtils;
}
