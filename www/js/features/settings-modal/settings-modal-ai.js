/**
 * SettingsModalAI - Tab Inteligencia Artificial
 * v2.9.390: Arquitectura modular
 */
class SettingsModalAI {
    constructor(settingsModal) {
        this.settingsModal = settingsModal;
    }

    // ==========================================================================
    // TAB IA
    // ==========================================================================

    renderAITab() {
        const aiConfig = window.aiConfig;
        if (!aiConfig) {
            return `
                <div class="settings-section">
                    <h3 class="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Inteligencia Artificial</h3>
                    <p class="text-red-400">Sistema de IA no disponible</p>
                </div>
            `;
        }

        const currentProvider = aiConfig.getCurrentProvider();
        const isConfigured = this.isProviderConfigured(currentProvider);

        return `
            <div class="settings-section">
                <h3 class="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">
                    ${Icons.bot(24)} Configuración de IA
                </h3>

                <p class="text-gray-300 mb-6 text-sm sm:text-base">
                    Configura el servicio de inteligencia artificial para usar el Chat IA, sugerencias contextuales y análisis de contenido.
                </p>

                <!-- Provider Selector -->
                <div class="mb-6">
                    <label class="block text-sm font-semibold mb-2 text-gray-200">1. Servicio de IA</label>
                    <select id="settings-ai-provider-select" class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition">
                        <optgroup label="De pago (alta calidad)">
                            <option value="claude" ${currentProvider === 'claude' ? 'selected' : ''}>Claude (Anthropic)</option>
                            <option value="openai" ${currentProvider === 'openai' ? 'selected' : ''}>ChatGPT (OpenAI)</option>
                            <option value="mistral" ${currentProvider === 'mistral' ? 'selected' : ''}>Mistral AI</option>
                        </optgroup>
                        <optgroup label="Gratis">
                            <option value="gemini" ${currentProvider === 'gemini' ? 'selected' : ''}>Gemini (Google) - 60 consultas/min gratis</option>
                            <option value="qwen" ${currentProvider === 'qwen' ? 'selected' : ''}>Qwen (Alibaba) - 1M tokens gratis/mes</option>
                            <option value="huggingface" ${currentProvider === 'huggingface' ? 'selected' : ''}>HuggingFace - 100% gratis</option>
                        </optgroup>
                        <optgroup label="Local / Sin conexión">
                            <option value="ollama" ${currentProvider === 'ollama' ? 'selected' : ''}>Ollama - Ejecuta en tu PC</option>
                            <option value="local" ${currentProvider === 'local' ? 'selected' : ''}>Modo offline - Sin IA real</option>
                        </optgroup>
                    </select>
                </div>

                <!-- Model Selector -->
                <div id="settings-ai-model-section" class="mb-6">
                    ${this.renderAIModelSelector(currentProvider)}
                </div>

                <!-- API Key Input -->
                <div id="settings-ai-key-section" class="mb-6">
                    ${this.renderAIKeyInput(currentProvider)}
                </div>

                <!-- Status -->
                <div class="flex items-center gap-3 p-4 rounded-lg ${isConfigured ? 'bg-green-900/20 border border-green-500/30' : 'bg-red-900/20 border border-red-500/30'}">
                    <span class="w-3 h-3 rounded-full flex-shrink-0 ${isConfigured ? 'bg-green-400' : 'bg-red-400'}"></span>
                    <div class="text-sm">
                        ${isConfigured
                            ? '<span class="text-green-300 font-semibold">Configurado</span> - El servicio de IA está listo para usar'
                            : '<span class="text-red-300 font-semibold">No configurado</span> - Ingresa tu API key para habilitar la IA'}
                    </div>
                </div>

                <!-- Save Button -->
                <div class="mt-6">
                    <button id="save-ai-settings" class="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition text-sm sm:text-base flex items-center justify-center gap-2">
                        ${Icons.check(20)} Guardar Configuración
                    </button>
                </div>

                <!-- Usage Stats (si existe) -->
                ${this.renderAIUsageStats()}
            </div>
        `;
    }

    // ==========================================================================
    // MODEL SELECTOR
    // ==========================================================================

    renderAIModelSelector(provider) {
        const aiConfig = window.aiConfig;
        if (!aiConfig) return '';

        const models = aiConfig.getAvailableModels(provider);
        if (!models || models.length <= 1) return '';

        const selectedModel = aiConfig.getSelectedModel();

        return `
            <div>
                <label class="block text-sm font-semibold mb-2 text-gray-200">2. Modelo</label>
                <select id="settings-ai-model-select" class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition">
                    ${models.map(model => `
                        <option value="${model.id}" ${model.id === selectedModel ? 'selected' : ''}>
                            ${model.name} - ${model.description}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
    }

    // ==========================================================================
    // API KEY INPUT
    // ==========================================================================

    renderAIKeyInput(provider) {
        const aiConfig = window.aiConfig;
        if (!aiConfig) return '';

        const configs = {
            claude: {
                key: aiConfig.getClaudeApiKey() || '',
                placeholder: 'sk-ant-...',
                label: 'API Key de Claude',
                link: 'https://console.anthropic.com/settings/keys',
                info: 'Calidad máxima - ~$0.01-0.02/conversación'
            },
            openai: {
                key: aiConfig.getOpenAIApiKey() || '',
                placeholder: 'sk-...',
                label: 'API Key de OpenAI',
                link: 'https://platform.openai.com/api-keys',
                info: 'Alta calidad - ~$0.002-0.02/conversación'
            },
            gemini: {
                key: aiConfig.getGeminiApiKey() || '',
                placeholder: 'AIza...',
                label: 'API Key de Gemini',
                link: 'https://aistudio.google.com/apikey',
                info: 'Gratis: 60 consultas/min - Buena calidad'
            },
            qwen: {
                key: aiConfig.getQwenApiKey() || '',
                placeholder: 'sk-...',
                label: 'API Key de Qwen (DashScope)',
                link: 'https://bailian.console.alibabacloud.com/?apiKey=1#/api-key',
                info: '1M tokens GRATIS/mes! - Crear cuenta en Alibaba Cloud'
            },
            mistral: {
                key: aiConfig.getMistralApiKey() || '',
                placeholder: '...',
                label: 'API Key de Mistral',
                link: 'https://console.mistral.ai/api-keys',
                info: 'Muy económico - ~$0.001/conversación'
            },
            huggingface: {
                key: aiConfig.getHuggingFaceToken() || '',
                placeholder: 'hf_...',
                label: 'Token de HuggingFace',
                link: 'https://huggingface.co/settings/tokens',
                info: '100% Gratis - Crear cuenta en huggingface.co'
            },
            ollama: {
                key: aiConfig.getOllamaUrl() || 'http://localhost:11434',
                placeholder: 'http://localhost:11434',
                label: 'URL de Ollama',
                link: 'https://ollama.ai/download',
                info: 'Gratis & Privado - Ejecuta en tu PC'
            },
            local: {
                key: '',
                placeholder: '',
                label: '',
                link: '',
                info: 'Respuestas predefinidas sin IA real'
            }
        };

        const config = configs[provider];
        if (!config || provider === 'local') return '';

        return `
            <div>
                <label class="block text-sm font-semibold mb-2 text-gray-200">
                    3. ${config.label}
                    <a href="${config.link}" target="_blank" class="ml-2 text-xs text-blue-400 hover:text-blue-300">
                        (Obtener API key ${Icons.create('external-link', 12)})
                    </a>
                </label>
                <input
                    type="password"
                    id="settings-ai-key-input"
                    value="${config.key}"
                    placeholder="${config.placeholder}"
                    class="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                />
                <p class="mt-2 text-xs text-gray-400">
                    ${Icons.info(12)} ${config.info}
                </p>
            </div>
        `;
    }

    // ==========================================================================
    // USAGE STATS
    // ==========================================================================

    renderAIUsageStats() {
        const stats = localStorage.getItem('ai_usage_stats');
        if (!stats) return '';

        try {
            const parsedStats = JSON.parse(stats);
            const totalRequests = parsedStats.totalRequests || 0;

            return `
                <div class="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h4 class="text-sm font-semibold text-gray-300 mb-3">Estadísticas de Uso</h4>
                    <div class="grid grid-cols-2 gap-4 text-center text-sm">
                        <div>
                            <div class="text-2xl font-bold text-blue-400">${totalRequests}</div>
                            <div class="text-xs text-gray-400 mt-1">Consultas totales</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-green-400">${parsedStats.lastUsed ? 'Activo' : 'Inactivo'}</div>
                            <div class="text-xs text-gray-400 mt-1">Estado</div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            return '';
        }
    }

    // ==========================================================================
    // HELPERS
    // ==========================================================================

    isProviderConfigured(provider) {
        const aiConfig = window.aiConfig;
        if (!aiConfig) return false;

        const configs = {
            claude: () => aiConfig.getClaudeApiKey(),
            openai: () => aiConfig.getOpenAIApiKey(),
            gemini: () => aiConfig.getGeminiApiKey(),
            qwen: () => aiConfig.getQwenApiKey(),
            mistral: () => aiConfig.getMistralApiKey(),
            huggingface: () => aiConfig.getHuggingFaceToken(),
            ollama: () => aiConfig.getOllamaUrl(),
            local: () => true
        };

        const getKey = configs[provider];
        return getKey ? !!getKey() : false;
    }
}

// Exponer globalmente
window.SettingsModalAI = SettingsModalAI;
