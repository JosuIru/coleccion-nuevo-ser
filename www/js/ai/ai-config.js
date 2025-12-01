// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE IA - Sistema flexible con múltiples proveedores
// Permite usar Claude API, APIs gratuitas o modo local
// ═══════════════════════════════════════════════════════════════════════════════

class AIConfig {
  constructor() {
    this.providers = {
      CLAUDE: 'claude',
      OPENAI: 'openai',        // ChatGPT
      GEMINI: 'gemini',        // Google Gemini
      MISTRAL: 'mistral',      // Mistral AI
      HUGGINGFACE: 'huggingface', // API gratuita
      OLLAMA: 'ollama', // Local gratuito
      LOCAL: 'local' // Respuestas predefinidas
    };

    // Modelos disponibles por proveedor (actualizados 2025)
    this.availableModels = {
      [this.providers.CLAUDE]: [
        { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: 'Más reciente, equilibrado' },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Rápido y capaz' },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Más económico' },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Máxima calidad' }
      ],
      [this.providers.OPENAI]: [
        { id: 'gpt-4.1', name: 'GPT-4.1', description: 'Más reciente 2025' },
        { id: 'gpt-4o', name: 'GPT-4o', description: 'Multimodal avanzado' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Rápido y económico' },
        { id: 'o1', name: 'o1', description: 'Razonamiento avanzado' },
        { id: 'o1-mini', name: 'o1 Mini', description: 'Razonamiento económico' }
      ],
      [this.providers.GEMINI]: [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Más reciente 2025' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Alta calidad' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Rápido' }
      ],
      [this.providers.MISTRAL]: [
        { id: 'mistral-large-latest', name: 'Mistral Large', description: 'Máxima calidad' },
        { id: 'mistral-medium-latest', name: 'Mistral Medium', description: 'Equilibrado' },
        { id: 'mistral-small-latest', name: 'Mistral Small', description: 'Económico' },
        { id: 'codestral-latest', name: 'Codestral', description: 'Especializado en código' }
      ],
      [this.providers.HUGGINGFACE]: [
        { id: 'mistralai/Mistral-7B-Instruct-v0.2', name: 'Mistral 7B v0.2', description: 'Estable, gratis' },
        { id: 'microsoft/Phi-3-mini-4k-instruct', name: 'Phi-3 Mini', description: 'Microsoft, compacto' },
        { id: 'google/gemma-2-2b-it', name: 'Gemma 2 2B', description: 'Google, ligero' },
        { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen 2.5 7B', description: 'Alibaba, multilingüe' },
        { id: 'tiiuae/falcon-7b-instruct', name: 'Falcon 7B', description: 'TII UAE, gratis' }
      ],
      [this.providers.OLLAMA]: [
        { id: 'llama3.2', name: 'Llama 3.2', description: 'Meta AI, más reciente' },
        { id: 'mistral', name: 'Mistral', description: 'Rápido y capaz' },
        { id: 'phi3', name: 'Phi-3', description: 'Microsoft, compacto' },
        { id: 'gemma2', name: 'Gemma 2', description: 'Google, eficiente' },
        { id: 'qwen2.5', name: 'Qwen 2.5', description: 'Alibaba, multilingüe' }
      ]
    };

    this.config = this.loadConfig();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURACIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  loadConfig() {
    const stored = localStorage.getItem('ai_config');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Error loading AI config:', error);
      }
    }

    // Configuración por defecto (modo local gratuito)
    return {
      provider: this.providers.LOCAL,
      apiKeys: {
        claude: '',
        openai: '',      // ChatGPT API key
        gemini: '',      // Google Gemini API key
        mistral: '',     // Mistral AI API key
        huggingface: ''  // Token gratuito de HuggingFace
      },
      ollamaUrl: 'http://localhost:11434', // Ollama local
      preferences: {
        maxTokens: 1024,
        temperature: 0.7,
        model: 'claude-3-5-sonnet-20241022'
      }
    };
  }

  saveConfig() {
    localStorage.setItem('ai_config', JSON.stringify(this.config));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GESTIÓN DE API KEYS
  // ═══════════════════════════════════════════════════════════════════════════

  setClaudeApiKey(apiKey) {
    this.config.apiKeys.claude = apiKey;
    this.config.provider = this.providers.CLAUDE;
    this.saveConfig();
    return true;
  }

  setHuggingFaceToken(token) {
    this.config.apiKeys.huggingface = token;
    this.config.provider = this.providers.HUGGINGFACE;
    this.saveConfig();
    return true;
  }

  setOpenAIApiKey(apiKey) {
    this.config.apiKeys.openai = apiKey;
    this.config.provider = this.providers.OPENAI;
    this.saveConfig();
    return true;
  }

  setGeminiApiKey(apiKey) {
    this.config.apiKeys.gemini = apiKey;
    this.config.provider = this.providers.GEMINI;
    this.saveConfig();
    return true;
  }

  setMistralApiKey(apiKey) {
    this.config.apiKeys.mistral = apiKey;
    this.config.provider = this.providers.MISTRAL;
    this.saveConfig();
    return true;
  }

  enableOllama(url = 'http://localhost:11434') {
    this.config.ollamaUrl = url;
    this.config.provider = this.providers.OLLAMA;
    this.saveConfig();
    return true;
  }

  useLocalMode() {
    this.config.provider = this.providers.LOCAL;
    this.saveConfig();
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GETTERS
  // ═══════════════════════════════════════════════════════════════════════════

  getCurrentProvider() {
    return this.config.provider;
  }

  getClaudeApiKey() {
    return this.config.apiKeys.claude;
  }

  getHuggingFaceToken() {
    return this.config.apiKeys.huggingface;
  }

  getOpenAIApiKey() {
    return this.config.apiKeys.openai;
  }

  getGeminiApiKey() {
    return this.config.apiKeys.gemini;
  }

  getMistralApiKey() {
    return this.config.apiKeys.mistral;
  }

  getOllamaUrl() {
    return this.config.ollamaUrl;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GESTIÓN DE MODELOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene los modelos disponibles para el proveedor actual
   */
  getAvailableModels(provider = null) {
    const currentProvider = provider || this.config.provider;
    return this.availableModels[currentProvider] || [];
  }

  /**
   * Obtiene el modelo seleccionado actualmente
   */
  getSelectedModel() {
    return this.config.preferences?.selectedModel || this.getDefaultModel();
  }

  /**
   * Obtiene el modelo por defecto para el proveedor actual
   */
  getDefaultModel() {
    const provider = this.config.provider;
    const models = this.availableModels[provider];
    return models && models.length > 0 ? models[0].id : null;
  }

  /**
   * Establece el modelo seleccionado
   */
  setSelectedModel(modelId) {
    if (!this.config.preferences) {
      this.config.preferences = {};
    }
    this.config.preferences.selectedModel = modelId;
    this.saveConfig();
    console.log(`✅ Modelo seleccionado: ${modelId}`);
  }

  /**
   * Obtiene información del modelo por su ID
   */
  getModelInfo(modelId) {
    for (const provider in this.availableModels) {
      const model = this.availableModels[provider].find(m => m.id === modelId);
      if (model) return model;
    }
    return null;
  }

  isClaudeConfigured() {
    return this.config.apiKeys.claude && this.config.apiKeys.claude.length > 0;
  }

  isHuggingFaceConfigured() {
    return this.config.apiKeys.huggingface && this.config.apiKeys.huggingface.length > 0;
  }

  isOpenAIConfigured() {
    return this.config.apiKeys.openai && this.config.apiKeys.openai.length > 0;
  }

  isGeminiConfigured() {
    return this.config.apiKeys.gemini && this.config.apiKeys.gemini.length > 0;
  }

  isMistralConfigured() {
    return this.config.apiKeys.mistral && this.config.apiKeys.mistral.length > 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INFORMACIÓN DE PROVEEDORES
  // ═══════════════════════════════════════════════════════════════════════════

  getProviderInfo() {
    return {
      [this.providers.CLAUDE]: {
        name: 'Claude API (Anthropic)',
        cost: 'De pago (~$0.01-0.02/conversación)',
        quality: '★★★★★',
        speed: '★★★★☆',
        setup: 'Requiere API key de Anthropic',
        pros: ['Máxima calidad', 'Contexto largo', 'Respuestas profundas', '✅ Funciona vía proxy en gailu.net', 'Cada usuario usa su propia API key'],
        cons: ['Requiere pago', 'Necesita API key propia'],
        getApiKey: 'https://console.anthropic.com/settings/keys',
        estimatedCost: '~$0.01-0.02 por conversación (solo pagas Claude API, el proxy es gratis en gailu.net)'
      },
      [this.providers.OPENAI]: {
        name: 'ChatGPT (OpenAI)',
        cost: 'De pago (~$0.002-0.02/conversación)',
        quality: '★★★★★',
        speed: '★★★★★',
        setup: 'Requiere API key de OpenAI',
        pros: ['Alta calidad', 'Muy rápido', 'GPT-4o disponible', 'Amplia documentación'],
        cons: ['Requiere pago', 'Necesita API key'],
        getApiKey: 'https://platform.openai.com/api-keys',
        estimatedCost: '~$0.002-0.02 por conversación según modelo'
      },
      [this.providers.GEMINI]: {
        name: 'Gemini (Google)',
        cost: 'Gratis / De pago',
        quality: '★★★★☆',
        speed: '★★★★★',
        setup: 'Requiere API key de Google AI Studio',
        pros: ['Tier gratuito generoso', 'Rápido', 'Multimodal', 'Buena calidad'],
        cons: ['Requiere cuenta Google', 'Limitaciones en tier gratis'],
        getApiKey: 'https://aistudio.google.com/apikey',
        estimatedCost: 'Gratis hasta 60 consultas/minuto, luego de pago'
      },
      [this.providers.MISTRAL]: {
        name: 'Mistral AI',
        cost: 'De pago (~$0.001-0.008/conversación)',
        quality: '★★★★★',
        speed: '★★★★★',
        setup: 'Requiere API key de Mistral',
        pros: ['Alta calidad', 'Muy económico', 'Rápido', 'Modelos open-weight'],
        cons: ['Requiere pago', 'Menos conocido'],
        getApiKey: 'https://console.mistral.ai/api-keys',
        estimatedCost: '~$0.001-0.008 por conversación según modelo'
      },
      [this.providers.HUGGINGFACE]: {
        name: 'HuggingFace Inference API',
        cost: 'Gratis',
        quality: '★★★☆☆',
        speed: '★★★☆☆',
        setup: 'Token gratuito en huggingface.co',
        pros: ['100% gratis', 'Sin límites estrictos', 'Varios modelos', '✅ Funciona vía proxy en gailu.net'],
        cons: ['Calidad media', 'Más lento', 'Respuestas básicas'],
        getApiKey: 'https://huggingface.co/settings/tokens',
        estimatedCost: 'Gratis (el proxy es gratis en gailu.net)'
      },
      [this.providers.OLLAMA]: {
        name: 'Ollama (Local)',
        cost: 'Gratis',
        quality: '★★★★☆',
        speed: '★★★★★',
        setup: 'Instalar Ollama en tu computadora',
        pros: ['100% gratis', 'Privacidad total', 'Sin límites', 'Muy rápido'],
        cons: ['Requiere instalación', 'Usa recursos locales', 'Solo en PC/Mac'],
        getApiKey: 'https://ollama.ai/download',
        estimatedCost: 'Gratis (usa tu GPU/CPU)'
      },
      [this.providers.LOCAL]: {
        name: 'Modo Local (Sin IA)',
        cost: 'Gratis',
        quality: '★★☆☆☆',
        speed: '★★★★★',
        setup: 'No requiere configuración',
        pros: ['Inmediato', 'Sin configuración', 'Funciona sin internet'],
        cons: ['Respuestas predefinidas', 'No personalizado', 'Limitado'],
        getApiKey: null,
        estimatedCost: 'Gratis'
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS PARA UI
  // ═══════════════════════════════════════════════════════════════════════════

  getProviderDisplayName(provider) {
    const info = this.getProviderInfo();
    return info[provider]?.name || 'Desconocido';
  }

  getRecommendedProvider() {
    // Si tiene Claude configurado, usarlo
    if (this.isClaudeConfigured()) {
      return {
        provider: this.providers.CLAUDE,
        reason: 'Tienes Claude API configurada (máxima calidad)'
      };
    }

    // Si tiene HuggingFace configurado, usarlo
    if (this.isHuggingFaceConfigured()) {
      return {
        provider: this.providers.HUGGINGFACE,
        reason: 'Tienes HuggingFace configurado (gratis, calidad media)'
      };
    }

    // Sugerir Ollama si está en desktop
    if (this.isDesktop()) {
      return {
        provider: this.providers.OLLAMA,
        reason: 'Ollama local es gratis y de alta calidad (requiere instalación)'
      };
    }

    // Por defecto, HuggingFace (gratis y no requiere instalación)
    return {
      provider: this.providers.HUGGINGFACE,
      reason: 'HuggingFace es gratis y funciona sin instalación'
    };
  }

  isDesktop() {
    return !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDACIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  async validateClaudeKey(apiKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error validating Claude key:', error);
      return false;
    }
  }

  async validateHuggingFaceToken(token) {
    try {
      const response = await fetch('https://huggingface.co/api/whoami-v2', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error validating HuggingFace token:', error);
      return false;
    }
  }

  async checkOllamaAvailability(url) {
    try {
      const response = await fetch(`${url}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Ollama not available:', error);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTADÍSTICAS DE USO
  // ═══════════════════════════════════════════════════════════════════════════

  getUsageStats() {
    const stats = localStorage.getItem('ai_usage_stats');
    if (stats) {
      try {
        return JSON.parse(stats);
      } catch (error) {
        return this.createEmptyStats();
      }
    }
    return this.createEmptyStats();
  }

  createEmptyStats() {
    return {
      claude: { calls: 0, tokens: 0, estimatedCost: 0 },
      openai: { calls: 0, tokens: 0, estimatedCost: 0 },
      gemini: { calls: 0, tokens: 0, estimatedCost: 0 },
      mistral: { calls: 0, tokens: 0, estimatedCost: 0 },
      huggingface: { calls: 0, tokens: 0 },
      ollama: { calls: 0, tokens: 0 },
      local: { calls: 0 }
    };
  }

  incrementUsage(provider, tokensUsed = 0) {
    const stats = this.getUsageStats();

    if (!stats[provider]) {
      stats[provider] = { calls: 0, tokens: 0 };
    }

    stats[provider].calls++;
    stats[provider].tokens += tokensUsed;

    // Calcular costo estimado para Claude
    if (provider === this.providers.CLAUDE) {
      // $3 por millón de tokens input + $15 por millón output (aprox 50/50)
      const avgCostPerToken = (3 + 15) / 2 / 1000000;
      stats[provider].estimatedCost = stats[provider].tokens * avgCostPerToken;
    }

    localStorage.setItem('ai_usage_stats', JSON.stringify(stats));
    return stats;
  }

  resetStats() {
    localStorage.setItem('ai_usage_stats', JSON.stringify(this.createEmptyStats()));
  }
}

// Exportar para uso global
window.AIConfig = AIConfig;
