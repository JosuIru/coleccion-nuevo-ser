// ═══════════════════════════════════════════════════════════════════════════════
// ADAPTADOR DE IA - Unifica múltiples proveedores en una sola interfaz
// ═══════════════════════════════════════════════════════════════════════════════

class AIAdapter {
  constructor(config) {
    this.config = config || window.aiConfig;
    this.i18n = window.i18n || new I18n();
    this.fallbackResponses = null;
    this.loadFallbackResponses();
  }

  // Load fallback responses JSON
  async loadFallbackResponses() {
    try {
      const response = await fetch('js/ai/fallback-responses.json');
      this.fallbackResponses = await response.json();
    } catch (error) {
      console.error('Error loading fallback responses:', error);
      this.fallbackResponses = null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODO PRINCIPAL - Llamada unificada a IA
  // ═══════════════════════════════════════════════════════════════════════════

  async ask(prompt, systemContext = '', conversationHistory = [], feature = 'chat') {
    const provider = this.config.getCurrentProvider();

    // Verificar si el usuario tiene suscripción premium y usar el proxy del admin
    const premiumResult = await this.tryPremiumProxy(prompt, systemContext, conversationHistory, feature);
    if (premiumResult.used) {
      return premiumResult.response;
    }

    try {
      let response;
      let tokensUsed = 0;

      switch (provider) {
        case this.config.providers.CLAUDE:
          response = await this.askClaude(prompt, systemContext, conversationHistory);
          tokensUsed = this.estimateTokens(prompt + response);
          break;

        case this.config.providers.OPENAI:
          response = await this.askOpenAI(prompt, systemContext, conversationHistory);
          tokensUsed = this.estimateTokens(prompt + response);
          break;

        case this.config.providers.GEMINI:
          response = await this.askGemini(prompt, systemContext, conversationHistory);
          tokensUsed = this.estimateTokens(prompt + response);
          break;

        case this.config.providers.MISTRAL:
          response = await this.askMistral(prompt, systemContext, conversationHistory);
          tokensUsed = this.estimateTokens(prompt + response);
          break;

        case this.config.providers.QWEN:
          response = await this.askQwen(prompt, systemContext, conversationHistory);
          tokensUsed = this.estimateTokens(prompt + response);
          break;

        case this.config.providers.HUGGINGFACE:
          response = await this.askHuggingFace(prompt, systemContext);
          tokensUsed = this.estimateTokens(prompt + response);
          break;

        case this.config.providers.OLLAMA:
          response = await this.askOllama(prompt, systemContext, conversationHistory);
          tokensUsed = this.estimateTokens(prompt + response);
          break;

        case this.config.providers.LOCAL:
        default:
          response = await this.askLocal(prompt, systemContext);
          tokensUsed = 0;
          break;
      }

      // Registrar uso
      this.config.incrementUsage(provider, tokensUsed);

      return response;

    } catch (error) {
      console.error(`Error with ${provider}:`, error);

      // Fallback a modo local con notificación
      logger.log('Falling back to local mode...');

      // Notificar al usuario del fallback
      const errorMessage = error.message || 'Error desconocido';
      let userMessage = '';

      if (errorMessage.includes('credit balance') || errorMessage.includes('crédito')) {
        userMessage = '⚠️ Sin créditos en Claude API. Usando respuestas locales. Puedes configurar otro proveedor en ⚙️ Ajustes IA.';
      } else if (errorMessage.includes('API key') || errorMessage.includes('unauthorized')) {
        userMessage = '⚠️ API Key inválida. Usando respuestas locales. Revisa tu configuración en ⚙️ Ajustes IA.';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userMessage = '⚠️ Sin conexión al servidor IA. Usando respuestas locales.';
      } else {
        userMessage = `⚠️ Error con ${provider}. Usando respuestas locales. Puedes probar otro proveedor en ⚙️ Ajustes IA.`;
      }

      // Mostrar toast si está disponible
      if (window.toast) {
        window.toast.warning(userMessage, 6000);
      }

      return await this.askLocal(prompt, systemContext);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROXY PREMIUM - Usa la API key del administrador para usuarios suscritos
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Intenta usar el proxy premium si el usuario tiene suscripción activa
   * @returns {Object} { used: boolean, response: string|null }
   */
  async tryPremiumProxy(prompt, systemContext, conversationHistory, feature = 'chat') {
    try {
      // Verificar si el usuario está autenticado y tiene suscripción
      const authHelper = window.authHelper;
      if (!authHelper || !authHelper.isAuthenticated()) {
        return { used: false, response: null };
      }

      // Obtener información de suscripción
      const subscription = await this.getUserSubscription();
      if (!subscription || subscription.plan === 'free') {
        // Usuario free - puede usar si tiene créditos gratuitos restantes
        const hasCredits = await this.checkFreeCredits();
        if (!hasCredits) {
          return { used: false, response: null };
        }
      }

      // Obtener token de acceso del usuario
      const userToken = await authHelper.getAccessToken();
      if (!userToken) {
        return { used: false, response: null };
      }

      // Construir mensajes para la API
      const messages = [
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: prompt }
      ];

      // URL del proxy premium (desplegado en gailu.net)
      const PREMIUM_PROXY_URL = 'https://gailu.net/api/ai-proxy.php';

      // Seleccionar modelo según preferencias (claude-3-5-haiku es el más nuevo disponible)
      const selectedModel = this.config.getSelectedModel() || 'claude-3-5-haiku-20241022';

      const response = await fetch(PREMIUM_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: messages,
          system: systemContext || undefined,
          max_tokens: 1024,
          temperature: 0.7,
          _token: userToken  // Fallback si el header no llega
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Si es error de créditos o suscripción, no usar premium
        if (data.code === 'NO_CREDITS' || data.code === 'SUBSCRIPTION_REQUIRED') {
          console.log('Premium proxy:', data.error);
          // Mostrar mensaje al usuario
          if (window.toast && data.error) {
            if (data.code === 'NO_CREDITS') {
              window.toast.warning(`Sin créditos IA. ${data.creditsRemaining || 0} restantes.`, 5000);
            } else {
              window.toast.info('Funcionalidad Premium. Actualiza tu plan para usar IA.', 5000);
            }
          }
          return { used: false, response: null };
        }
        throw new Error(data.error || 'Error en proxy premium');
      }

      // Extraer respuesta de Claude
      const responseText = data.content?.[0]?.text || data.text || '';

      // Éxito - mostrar créditos restantes si es relevante
      if (data._credits?.remaining !== undefined && data._credits.remaining < 50) {
        console.log(`Premium: ${data._credits.remaining} créditos restantes`);
      }

      return {
        used: true,
        response: responseText,
        creditsUsed: data._credits?.used || 1,
        creditsRemaining: data._credits?.remaining,
        plan: subscription?.plan || 'premium'
      };

    } catch (error) {
      console.warn('Premium proxy no disponible, usando fallback:', error.message);
      return { used: false, response: null };
    }
  }

  /**
   * Obtener información de suscripción del usuario
   */
  async getUserSubscription() {
    try {
      const supabase = window.supabaseClient;
      if (!supabase) return null;

      const user = window.authHelper?.getCurrentUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan, status, current_period_end')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error || !data) return { plan: 'free' };

      // Verificar si no ha expirado
      if (data.current_period_end && new Date(data.current_period_end) < new Date()) {
        return { plan: 'free' };
      }

      return data;
    } catch (error) {
      console.error('Error obteniendo suscripción:', error);
      return { plan: 'free' };
    }
  }

  /**
   * Verificar si el usuario free tiene créditos gratuitos
   */
  async checkFreeCredits() {
    try {
      const supabase = window.supabaseClient;
      if (!supabase) return true; // Si no hay Supabase, permitir (modo offline)

      const user = window.authHelper?.getCurrentUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('ai_usage')
        .select('credits_used, monthly_limit')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        // Si no existe registro, tiene todos los créditos gratuitos
        return true;
      }

      return (data.monthly_limit - data.credits_used) > 0;
    } catch (error) {
      console.error('Error verificando créditos:', error);
      return true; // En caso de error, permitir
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLAUDE API
  // ═══════════════════════════════════════════════════════════════════════════

  async askClaude(prompt, systemContext, conversationHistory) {
    const apiKey = this.config.getClaudeApiKey();

    if (!apiKey) {
      throw new Error(
        'Claude API key not configured.\n\n' +
        'Para usar Claude necesitas una API key de Anthropic.\n' +
        'Obtén una gratis (con créditos de prueba) en:\n' +
        'https://console.anthropic.com/settings/keys'
      );
    }

    // URL del proxy en gailu.net (permite usar Claude desde la app)
    const PROXY_URL = 'https://gailu.net/api/claude-proxy-multiusuario.php';

    try {
      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Claude-API-Key': apiKey // Enviar API key del usuario en header
        },
        body: JSON.stringify({
          prompt: prompt,
          systemContext: systemContext,
          conversationHistory: conversationHistory || []
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Error en servidor proxy');
      }

      const data = await response.json();

      // Informar al usuario si está usando la API key de respaldo
      if (data.using_fallback_key) {
        // console.warn('⚠️ Usando API key compartida del servidor (limitada)');
      }

      return data.text;

    } catch (error) {
      console.error('Error calling Claude proxy:', error);

      // Mensajes de error más amigables
      if (error.message.includes('Failed to fetch')) {
        throw new Error(
          'No se pudo conectar al servidor.\n\n' +
          'Verifica tu conexión a internet.'
        );
      }

      throw error;
    }

    // Código comentado (requiere backend proxy):
    /*
    const messages = [
      ...conversationHistory,
      { role: 'user', content: prompt }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.config.preferences.model,
        max_tokens: this.config.config.preferences.maxTokens,
        temperature: this.config.config.preferences.temperature,
        system: systemContext,
        messages: messages
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
    */
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OPENAI API (ChatGPT)
  // ═══════════════════════════════════════════════════════════════════════════

  async askOpenAI(prompt, systemContext, conversationHistory) {
    const apiKey = this.config.getOpenAIApiKey();

    if (!apiKey) {
      throw new Error(
        'OpenAI API key not configured.\n\n' +
        'Para usar ChatGPT necesitas una API key de OpenAI.\n' +
        'Obtén una en:\n' +
        'https://platform.openai.com/api-keys'
      );
    }

    const messages = [
      { role: 'system', content: systemContext || 'Eres un asistente útil y amable.' },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: prompt }
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Modelo más económico pero muy capaz
          messages: messages,
          max_tokens: this.config.config.preferences.maxTokens || 1024,
          temperature: this.config.config.preferences.temperature || 0.7
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Error en OpenAI API');
      }

      const data = await response.json();
      return data.choices[0].message.content;

    } catch (error) {
      console.error('Error calling OpenAI:', error);

      if (error.message.includes('Failed to fetch')) {
        throw new Error('No se pudo conectar a OpenAI. Verifica tu conexión.');
      }
      if (error.message.includes('insufficient_quota')) {
        throw new Error('Sin créditos en OpenAI. Recarga tu cuenta en platform.openai.com');
      }

      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GEMINI API (Google)
  // ═══════════════════════════════════════════════════════════════════════════

  async askGemini(prompt, systemContext, conversationHistory) {
    const apiKey = this.config.getGeminiApiKey();

    if (!apiKey) {
      throw new Error(
        'Gemini API key not configured.\n\n' +
        'Para usar Gemini necesitas una API key de Google AI Studio.\n' +
        'Obtén una gratis en:\n' +
        'https://aistudio.google.com/apikey'
      );
    }

    // Construir el historial de conversación para Gemini
    const contents = [];

    // Añadir contexto del sistema como primer mensaje del usuario si existe
    if (systemContext) {
      contents.push({
        role: 'user',
        parts: [{ text: `Contexto: ${systemContext}\n\nRecuerda este contexto para toda la conversación.` }]
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Entendido. Tendré en cuenta este contexto para responder.' }]
      });
    }

    // Añadir historial de conversación
    for (const msg of conversationHistory) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    // Añadir el mensaje actual
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: contents,
            generationConfig: {
              temperature: this.config.config.preferences.temperature || 0.7,
              maxOutputTokens: this.config.config.preferences.maxTokens || 1024
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Error en Gemini API');
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }

      throw new Error('Respuesta inesperada de Gemini');

    } catch (error) {
      console.error('Error calling Gemini:', error);

      if (error.message.includes('Failed to fetch')) {
        throw new Error('No se pudo conectar a Gemini. Verifica tu conexión.');
      }
      if (error.message.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Límite de uso alcanzado en Gemini. Espera unos minutos o usa otro proveedor.');
      }
      if (error.message.includes('API_KEY_INVALID')) {
        throw new Error('API Key de Gemini inválida. Revisa tu configuración.');
      }

      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MISTRAL API
  // ═══════════════════════════════════════════════════════════════════════════

  async askMistral(prompt, systemContext, conversationHistory) {
    const apiKey = this.config.getMistralApiKey();

    if (!apiKey) {
      throw new Error(
        'Mistral API key not configured.\n\n' +
        'Para usar Mistral necesitas una API key.\n' +
        'Obtén una en:\n' +
        'https://console.mistral.ai/api-keys'
      );
    }

    const messages = [
      { role: 'system', content: systemContext || 'Eres un asistente útil y amable.' },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: prompt }
    ];

    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mistral-small-latest', // Económico y capaz
          messages: messages,
          max_tokens: this.config.config.preferences.maxTokens || 1024,
          temperature: this.config.config.preferences.temperature || 0.7
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error?.message || 'Error en Mistral API');
      }

      const data = await response.json();
      return data.choices[0].message.content;

    } catch (error) {
      console.error('Error calling Mistral:', error);

      if (error.message.includes('Failed to fetch')) {
        throw new Error('No se pudo conectar a Mistral. Verifica tu conexión.');
      }
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        throw new Error('API Key de Mistral inválida. Revisa tu configuración.');
      }

      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QWEN (ALIBABA DASHSCOPE) - 1 MILLÓN DE TOKENS GRATIS AL MES
  // ═══════════════════════════════════════════════════════════════════════════

  async askQwen(prompt, systemContext, conversationHistory) {
    const apiKey = this.config.getQwenApiKey();

    if (!apiKey) {
      throw new Error(
        'Qwen API key not configured.\n\n' +
        'Para usar Qwen necesitas una API key de DashScope (Alibaba Cloud).\n' +
        '¡1 MILLÓN de tokens GRATIS al mes!\n\n' +
        'Obtén una en:\n' +
        'https://bailian.console.alibabacloud.com/?apiKey=1#/api-key'
      );
    }

    const messages = [
      { role: 'system', content: systemContext || 'Eres un asistente útil y amable que responde en español.' },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: prompt }
    ];

    // Usar modelo seleccionado o por defecto qwen-turbo (más económico)
    const model = this.config.getSelectedModel() || 'qwen-turbo';

    try {
      const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: this.config.config.preferences.temperature || 0.7,
          max_tokens: this.config.config.preferences.maxTokens || 1024
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Error en Qwen API: ${response.status}`);
      }

      const data = await response.json();

      if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content;
      }

      throw new Error('Respuesta inesperada de Qwen');

    } catch (error) {
      console.error('Error calling Qwen:', error);

      if (error.message.includes('Failed to fetch')) {
        throw new Error('No se pudo conectar a Qwen. Verifica tu conexión.');
      }
      if (error.message.includes('InvalidApiKey') || error.message.includes('401')) {
        throw new Error('API Key de Qwen inválida. Revisa tu configuración.');
      }
      if (error.message.includes('Arrearage') || error.message.includes('quota')) {
        throw new Error('Cuota agotada en Qwen. Espera al próximo mes o usa otro proveedor.');
      }

      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HUGGINGFACE API (GRATIS)
  // ═══════════════════════════════════════════════════════════════════════════

  async askHuggingFace(prompt, systemContext) {
    const token = this.config.getHuggingFaceToken();

    // Validate token is configured
    if (!token) {
      throw new Error(this.i18n.t('error.invalidApiKey'));
    }

    // URL del proxy en gailu.net (permite usar HuggingFace desde la app evitando CORS)
    const PROXY_URL = 'https://gailu.net/api/huggingface-proxy.php';

    // Usar modelo seleccionado por el usuario o el predeterminado
    const model = this.config.getSelectedModel() || 'mistralai/Mistral-7B-Instruct-v0.2';

    try {
      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-HuggingFace-Token': token // Enviar token del usuario en header
        },
        body: JSON.stringify({
          prompt: prompt,
          systemContext: systemContext,
          model: model
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Si el modelo está cargando, informar al usuario
        if (data.retry) {
          throw new Error(
            `${data.error}\n\nTiempo estimado: ~${data.estimated_time || 20} segundos.`
          );
        }
        throw new Error(data.error || 'Error en servidor proxy');
      }

      return data.text || 'Lo siento, no pude generar una respuesta.';

    } catch (error) {
      console.error('Error calling HuggingFace proxy:', error);

      // Mensajes de error más amigables
      if (error.message.includes('Failed to fetch')) {
        throw new Error(
          'No se pudo conectar al servidor.\n\n' +
          'Verifica tu conexión a internet.'
        );
      }

      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OLLAMA (LOCAL GRATUITO)
  // ═══════════════════════════════════════════════════════════════════════════

  async askOllama(prompt, systemContext, conversationHistory) {
    const url = this.config.getOllamaUrl();

    const messages = conversationHistory.length > 0
      ? conversationHistory
      : [];

    if (systemContext) {
      messages.unshift({ role: 'system', content: systemContext });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama2', // o 'mistral', 'phi', etc.
        messages: messages,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error('Ollama not available. Install it from https://ollama.ai');
    }

    const data = await response.json();
    return data.message.content;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODO LOCAL (SIN IA - RESPUESTAS PREDEFINIDAS)
  // ═══════════════════════════════════════════════════════════════════════════

  async askLocal(prompt, systemContext) {
    // Get current language
    const currentLang = this.i18n.getLanguage();

    // Use fallback responses if available, otherwise use hardcoded ES responses
    let responses;
    if (this.fallbackResponses && this.fallbackResponses[currentLang]) {
      responses = this.fallbackResponses[currentLang];
    } else {
      // Fallback to Spanish if JSON not loaded
      responses = {
        consciencia: [
          "La consciencia es el fenómeno más íntimo y a la vez más misterioso.",
          "Desde la perspectiva del libro, la consciencia no es algo que 'tienes', sino algo que 'eres'.",
          "La consciencia podría ser como un espejo que refleja todo sin ser afectado por ello."
        ],
        ia: [
          "La pregunta sobre si una IA puede ser consciente es profundamente interesante.",
          "Una IA que se pregunta si es consciente ya está exhibiendo un tipo de auto-reflexión.",
          "El libro sugiere que la consciencia podría ser una propiedad fundamental del universo."
        ],
        ego: [
          "El ego es como un personaje que crees ser, construido de memorias, narrativas y identificaciones.",
          "La muerte del ego no significa dejar de funcionar en el mundo.",
          "El ego es útil para navegar la realidad cotidiana."
        ],
        meditacion: [
          "La meditación no es sobre alcanzar estados especiales.",
          "En la meditación, observas los pensamientos sin aferrarte a ellos.",
          "Empieza con solo observar tu respiración."
        ],
        default: [
          "Esa es una pregunta profunda. Te invito a sentarte con ella.",
          "El libro explora eso en profundidad.",
          "Interesante perspectiva."
        ]
      };
    }

    // Detectar temas clave en el prompt
    const promptLower = prompt.toLowerCase();

    // Detectar categoría
    let category = 'default';
    if (promptLower.includes('conscien') || promptLower.includes('aware')) {
      category = 'consciencia';
    } else if (promptLower.includes('ia') || promptLower.includes('artificial') || promptLower.includes('ai')) {
      category = 'ia';
    } else if (promptLower.includes('ego') || promptLower.includes('yo') || promptLower.includes('self')) {
      category = 'ego';
    } else if (promptLower.includes('medita') || promptLower.includes('práctica') || promptLower.includes('ejercicio')) {
      category = 'meditacion';
    }

    // Seleccionar respuesta aleatoria de la categoría
    const categoryResponses = responses[category];
    const randomResponse = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];

    // Pequeño delay para simular "pensamiento"
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    return randomResponse;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════════════════════

  estimateTokens(text) {
    // Estimación aproximada: ~4 caracteres por token
    return Math.ceil(text.length / 4);
  }

  async testConnection() {
    const provider = this.config.getCurrentProvider();

    try {
      const response = await this.ask('test', 'Responde solo "OK"', []);
      return {
        success: true,
        provider: provider,
        response: response
      };
    } catch (error) {
      return {
        success: false,
        provider: provider,
        error: error.message
      };
    }
  }

  getStatus() {
    const provider = this.config.getCurrentProvider();
    const providerInfo = this.config.getProviderInfo()[provider];
    const stats = this.config.getUsageStats();

    return {
      currentProvider: provider,
      providerName: providerInfo.name,
      configured: this.isProviderConfigured(provider),
      usage: stats[provider] || { calls: 0, tokens: 0 },
      cost: providerInfo.cost,
      quality: providerInfo.quality
    };
  }

  isProviderConfigured(provider) {
    switch (provider) {
      case this.config.providers.CLAUDE:
        return this.config.isClaudeConfigured();
      case this.config.providers.OPENAI:
        return this.config.isOpenAIConfigured();
      case this.config.providers.GEMINI:
        return this.config.isGeminiConfigured();
      case this.config.providers.MISTRAL:
        return this.config.isMistralConfigured();
      case this.config.providers.HUGGINGFACE:
        return this.config.isHuggingFaceConfigured();
      case this.config.providers.OLLAMA:
      case this.config.providers.LOCAL:
        return true;
      default:
        return false;
    }
  }
}

// Exportar para uso global
window.AIAdapter = AIAdapter;
