/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * AI PREMIUM - Sistema de Créditos y Rate Limiting
 * Gestión de créditos de IA, verificación de permisos y consumo
 *
 * @version 1.0.0
 */

class AIPremium {
  constructor() {
    this.authHelper = window.authHelper;
    this.supabase = null;
    this.creditUpdateListeners = [];

    this.init();
  }

  /**
   * Inicializar
   */
  async init() {
    if (typeof window.supabase !== 'undefined') {
      this.supabase = window.supabase;
    } else {
      setTimeout(() => this.init(), 500);
      return;
    }

    // Escuchar cambios de auth
    this.authHelper.onAuthStateChange((event, user) => {
      if (event === 'signed_in') {
        logger.debug('🔐 AI Premium verificando permisos...');
      } else if (event === 'signed_out') {
        this.notifyCreditUpdate(0);
      }
    });

    logger.debug('✅ AI Premium inicializado');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFICACIÓN DE PERMISOS Y CRÉDITOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verificar si el usuario tiene una feature habilitada
   */
  hasFeature(featureName) {
    return this.authHelper.hasFeature(featureName);
  }

  /**
   * Verificar si tiene créditos suficientes
   */
  async checkCredits(estimatedTokens = 100, featureName = null) {
    const profile = this.authHelper.getProfile();

    if (!profile) {
      throw new Error('Usuario no autenticado. Por favor, inicia sesión primero.');
    }

    // Si es free, rechazar características premium
    if (featureName && !this.hasFeature(featureName)) {
      const tier = profile.subscription_tier;
      throw new Error(
        `Esta función es de ${tier === 'free' ? 'pago' : 'plan superior'}. ` +
        `Actualiza tu plan para acceder a "${featureName}".`
      );
    }

    const remaining = profile.ai_credits_remaining || 0;

    if (remaining < estimatedTokens) {
      const creditsNeeded = estimatedTokens - remaining;
      throw new Error(
        `Créditos insuficientes. Necesitas ${creditsNeeded} créditos más. ` +
        `Tus créditos se renuevan el ${new Date(profile.ai_credits_reset_date).toLocaleDateString('es-ES')}`
      );
    }

    return true;
  }

  /**
   * Obtener créditos disponibles
   */
  getCreditsRemaining() {
    return this.authHelper.getAICredits();
  }

  /**
   * Obtener total de créditos mensuales
   */
  getCreditsTotal() {
    const profile = this.authHelper.getProfile();
    return profile?.ai_credits_total || 0;
  }

  /**
   * Obtener porcentaje de uso
   */
  getCreditsPercentage() {
    const remaining = this.getCreditsRemaining();
    const total = this.getCreditsTotal();

    if (total === 0) return 0;
    return Math.round((remaining / total) * 100);
  }

  /**
   * Obtener fecha de reset de créditos
   */
  getCreditsResetDate() {
    const profile = this.authHelper.getProfile();
    return profile?.ai_credits_reset_date
      ? new Date(profile.ai_credits_reset_date)
      : null;
  }

  /**
   * Obtener días hasta reset
   */
  getDaysUntilReset() {
    const resetDate = this.getCreditsResetDate();
    if (!resetDate) return null;

    const now = new Date();
    const diffTime = resetDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSUMO DE CRÉDITOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Consumir créditos y registrar uso
   */
  async consumeCredits(
    creditsAmount,
    context,
    provider = 'claude',
    model = 'claude-3-5-sonnet',
    tokensUsed = 0
  ) {
    const user = this.authHelper.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      // Verificar que haya créditos
      if (!this.authHelper.hasEnoughCredits(creditsAmount)) {
        throw new Error(
          `Créditos insuficientes. Tienes ${this.getCreditsRemaining()}, ` +
          `necesitas ${creditsAmount}.`
        );
      }

      // Consumir créditos (usando RPC de Supabase)
      const result = await this.authHelper.consumeCredits(
        creditsAmount,
        context,
        provider,
        model,
        tokensUsed
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // Notificar listeners
      this.notifyCreditUpdate(result.remaining);

      logger.debug(
        `✅ Consumidos ${creditsAmount} créditos. Restantes: ${result.remaining}`
      );

      return {
        success: true,
        remaining: result.remaining,
        percentage: this.getCreditsPercentage(),
      };
    } catch (error) {
      logger.error('❌ Error consumiendo créditos:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de uso de IA
   */
  async getUsageHistory(days = 30) {
    if (!this.supabase) return [];

    const user = this.authHelper.getUser();
    if (!user) return [];

    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const { data, error } = await this.supabase
        .from('ai_usage')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', fromDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error obteniendo historial:', error);
      return [];
    }
  }

  /**
   * Obtener estadísticas de uso
   */
  async getUsageStats() {
    const history = await this.getUsageHistory(30);

    const stats = {
      totalCalls: history.length,
      totalTokens: history.reduce((sum, h) => sum + (h.tokens_total || 0), 0),
      totalCost: history.reduce((sum, h) => sum + parseFloat(h.cost_usd || 0), 0),
      byContext: {},
      byProvider: {},
      byModel: {},
    };

    // Agrupar por contexto
    history.forEach((h) => {
      stats.byContext[h.context] = (stats.byContext[h.context] || 0) + 1;
      stats.byProvider[h.provider] = (stats.byProvider[h.provider] || 0) + 1;
      stats.byModel[h.model] = (stats.byModel[h.model] || 0) + 1;
    });

    return stats;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ELEVENLABS TTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Consumir créditos para ElevenLabs TTS
   * @param {number} textLength - Longitud del texto a sintetizar
   * @returns {Promise<object>} Resultado del consumo
   */
  async consumeElevenLabsCredits(textLength) {
    // Verificar feature
    if (!this.hasFeature('elevenlabs_tts')) {
      throw new Error('Voces ElevenLabs solo disponibles en Premium/Pro');
    }

    // Calcular créditos: ~5 créditos por 1000 caracteres
    const creditsNeeded = Math.ceil((textLength / 1000) * 5);

    // Verificar créditos
    await this.checkCredits(creditsNeeded, 'elevenlabs_tts');

    // Consumir
    return await this.consumeCredits(
      creditsNeeded,
      'elevenlabs_tts',
      'elevenlabs',
      'eleven_multilingual_v2',
      textLength
    );
  }

  /**
   * Estimar créditos ElevenLabs sin consumir
   * @param {number} textLength - Longitud del texto
   * @returns {number} Créditos estimados
   */
  estimateElevenLabsCredits(textLength) {
    return Math.ceil((textLength / 1000) * 5);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ESTIMACIONES DE COSTO
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Estimar créditos necesarios para una operación
   */
  estimateCredits(tokensEstimated) {
    // 1 crédito = ~1 token (simplificado)
    // En producción, usar pricing real de cada provider
    return Math.ceil(tokensEstimated);
  }

  /**
   * Estimar costo en USD
   */
  estimateCostUSD(tokens, provider = 'claude', model = 'claude-3-5-sonnet') {
    // Costos por 1K tokens - Actualizado Diciembre 2024
    // Fuentes: anthropic.com/pricing, openai.com/pricing, ai.google.dev/pricing
    const costPerK = {
      // Anthropic Claude (por 1K tokens output, input ~1/5)
      'claude-opus-4': 0.075,
      'claude-sonnet-4': 0.015,
      'claude-3-5-sonnet': 0.015,
      'claude-3-5-haiku': 0.004,
      'claude-3-haiku': 0.00125,
      // OpenAI GPT (por 1K tokens output)
      'gpt-4o': 0.010,
      'gpt-4o-mini': 0.0006,
      'gpt-4-turbo': 0.030,
      'gpt-3.5-turbo': 0.002,
      // Google Gemini
      'gemini-2.0-flash': 0.0004,
      'gemini-1.5-flash': 0.000075,
      'gemini-1.5-pro': 0.005,
      // Mistral
      'mistral-large': 0.008,
      'mistral-small': 0.002,
      // Gratuitos
      'qwen-turbo': 0.0,
      'huggingface': 0.0,
      'ollama': 0.0,
      'local': 0.0,
      'default': 0.002,
    };

    const cost = costPerK[model] || costPerK['default'];
    return ((tokens / 1000) * cost).toFixed(6);
  }

  /**
   * Obtener información de plan actual
   */
  getPlanInfo() {
    const profile = this.authHelper.getProfile();

    const plans = {
      free: {
        name: 'Gratuito',
        monthlyCredits: 10,
        features: ['ai_chat: NO', 'ai_tutor: NO', 'ai_game_master: NO'],
        icon: '🆓',
      },
      premium: {
        name: 'Premium',
        monthlyCredits: 500,
        features: ['ai_chat: SÍ', 'ai_tutor: SÍ', 'ai_game_master: NO'],
        icon: '⭐',
      },
      pro: {
        name: 'Pro',
        monthlyCredits: 2000,
        features: ['ai_chat: SÍ', 'ai_tutor: SÍ', 'ai_game_master: SÍ'],
        icon: '👑',
      },
    };

    const tier = profile?.subscription_tier || 'free';
    return plans[tier] || plans['free'];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LISTENERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Suscribirse a cambios de créditos
   */
  onCreditsUpdate(callback) {
    this.creditUpdateListeners.push(callback);

    // Llamar inmediatamente con estado actual
    callback({
      remaining: this.getCreditsRemaining(),
      total: this.getCreditsTotal(),
      percentage: this.getCreditsPercentage(),
    });

    // Retornar función para desuscribirse
    return () => {
      this.creditUpdateListeners = this.creditUpdateListeners.filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Notificar cambios de créditos
   */
  notifyCreditUpdate(remaining) {
    this.creditUpdateListeners.forEach((callback) => {
      try {
        callback({
          remaining,
          total: this.getCreditsTotal(),
          percentage: this.getCreditsPercentage(),
        });
      } catch (error) {
        logger.error('Error en credit update listener:', error);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WIDGETS UI
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Crear widget de créditos
   */
  createCreditsWidget() {
    const remaining = this.getCreditsRemaining();
    const total = this.getCreditsTotal();
    const percentage = this.getCreditsPercentage();
    const daysLeft = this.getDaysUntilReset();

    const widget = document.createElement('div');
    widget.className = 'ai-credits-widget';
    widget.innerHTML = `
      <div class="credits-display">
        <div class="credits-icon">🪙</div>
        <div class="credits-info">
          <div class="credits-count">${remaining} / ${total}</div>
          <div class="credits-label">Créditos IA</div>
          <div class="credits-reset">Renuevan en ${daysLeft} días</div>
        </div>
      </div>

      <div class="credits-bar">
        <div class="credits-bar-fill" style="width: ${percentage}%"></div>
      </div>

      <div class="credits-percentage">${percentage}%</div>
    `;

    // Escuchar cambios de créditos
    this.onCreditsUpdate((credits) => {
      const bar = widget.querySelector('.credits-bar-fill');
      const count = widget.querySelector('.credits-count');
      const percent = widget.querySelector('.credits-percentage');

      if (bar && count && percent) {
        const newPercentage = (credits.remaining / credits.total) * 100;
        bar.style.width = `${newPercentage}%`;
        count.textContent = `${credits.remaining} / ${credits.total}`;
        percent.textContent = `${Math.round(newPercentage)}%`;
      }
    });

    return widget;
  }

  /**
   * Mostrar aviso de créditos bajos
   */
  showLowCreditsWarning() {
    const remaining = this.getCreditsRemaining();
    const total = this.getCreditsTotal();
    const percentage = (remaining / total) * 100;

    if (percentage <= 20 && percentage > 0) {
      const warning = document.createElement('div');
      warning.className = 'low-credits-warning fade-in';
      warning.innerHTML = `
        <div class="warning-content">
          <span class="warning-icon">⚠️</span>
          <span class="warning-text">
            Te quedan ${remaining} créditos (${Math.round(percentage)}%)
          </span>
          <button onclick="window.pricingModal.showPricingModal(); this.closest('.low-credits-warning').remove()">
            Actualizar Plan
          </button>
        </div>
      `;

      document.body.appendChild(warning);

      // Auto-remover después de 10 segundos
      setTimeout(() => {
        warning.classList.add('fade-out');
        setTimeout(() => warning.remove(), 300);
      }, 10000);
    }
  }
}

// Crear instancia global
window.aiPremium = new AIPremium();

logger.debug('✅ AIPremium loaded. Use window.aiPremium for credit management.');
