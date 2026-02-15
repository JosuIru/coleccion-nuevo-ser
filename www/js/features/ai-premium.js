/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
// 🔧 v2.9.386: Migrado a sistema de TOKENS (híbrido con suscripciones)
 * AI PREMIUM - Sistema de Tokens y Rate Limiting
 * Gestión de tokens de IA, verificación de permisos y consumo
 *
 * MODELO HÍBRIDO:
 * - Suscripciones mensuales dan tokens gratis cada mes
 * - Paquetes de tokens adicionales disponibles para compra
 * - Métodos de pago: Stripe, PayPal, Bitcoin
 *
 * @version 2.0.0
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
    this.authHelper.onAuthStateChange((event, _user) => {
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
   * Verificar si tiene tokens suficientes
   * @param {number} estimatedTokens - Tokens estimados necesarios
   * @param {string} featureName - Nombre de la feature (opcional)
   * 🔧 v2.9.391: Si tiene tokens suficientes, puede usar IA sin importar el plan
   */
  async checkCredits(estimatedTokens = 100, featureName = null) {
    const profile = this.authHelper.getProfile();

    if (!profile) {
      throw new Error('Usuario no autenticado. Por favor, inicia sesión primero.');
    }

    // Usar nuevo sistema de tokens
    const tokenBalance = this.authHelper.getTokenBalance();

    // 🔧 v2.9.391: Debug logging para verificar tokens
    logger.debug('[AIPremium] checkCredits:', {
      estimatedTokens,
      featureName,
      tier: profile.subscription_tier,
      tokenBalance: profile.token_balance,
      aiCreditsRemaining: profile.ai_credits_remaining,
      totalTokens: tokenBalance
    });

    // 🔧 v2.9.391: Si tiene tokens suficientes (>= lo que necesita),
    // puede usar la feature sin importar el plan
    if (tokenBalance >= estimatedTokens) {
      logger.debug('[AIPremium] Tokens suficientes, acceso permitido');
      return true;
    }

    // Si no tiene tokens suficientes, verificar plan para dar mensaje apropiado
    if (featureName && !this.hasFeature(featureName)) {
      const tier = profile.subscription_tier || 'free';
      throw new Error(
        `Esta función requiere plan ${tier === 'free' ? 'Premium o Pro' : 'superior'}. ` +
        `Actualiza tu plan para acceder a "${featureName}".`
      );
    }

    // No tiene tokens suficientes
    const tokensNeeded = estimatedTokens - tokenBalance;
    throw new Error(
      `Tokens insuficientes. Necesitas ${this.formatTokens(tokensNeeded)} tokens más. ` +
      `Compra tokens adicionales o actualiza tu plan.`
    );
  }

  /**
   * Alias para compatibilidad: checkTokens
   */
  async checkTokens(estimatedTokens = 100, featureName = null) {
    return this.checkCredits(estimatedTokens, featureName);
  }

  /**
   * Obtener tokens disponibles (total: comprados + mensuales)
   */
  getCreditsRemaining() {
    return this.authHelper.getTokenBalance();
  }

  /**
   * Alias para nuevo sistema
   */
  getTokenBalance() {
    return this.authHelper.getTokenBalance();
  }

  /**
   * Obtener tokens comprados (wallet)
   */
  getPurchasedTokens() {
    return this.authHelper.getPurchasedTokens();
  }

  /**
   * Obtener tokens mensuales restantes
   */
  getMonthlyTokensRemaining() {
    return this.authHelper.getMonthlyTokensRemaining();
  }

  /**
   * Obtener total de tokens mensuales del plan
   */
  getCreditsTotal() {
    const plan = this.authHelper.getSubscriptionTier();
    return window.PLANS_CONFIG?.getMonthlyTokens(plan) || 0;
  }

  /**
   * Obtener porcentaje de uso de tokens mensuales
   */
  getCreditsPercentage() {
    const monthlyRemaining = this.getMonthlyTokensRemaining();
    const monthlyTotal = this.getCreditsTotal();

    if (monthlyTotal === 0) return 100; // Si no hay mensuales, mostrar 100%
    return Math.round((monthlyRemaining / monthlyTotal) * 100);
  }

  /**
   * Obtener fecha de reset de tokens mensuales
   */
  getCreditsResetDate() {
    const profile = this.authHelper.getProfile();
    return profile?.ai_credits_reset_date
      ? new Date(profile.ai_credits_reset_date)
      : null;
  }

  /**
   * Obtener días hasta reset de tokens mensuales
   */
  getDaysUntilReset() {
    const resetDate = this.getCreditsResetDate();
    if (!resetDate) return null;

    const now = new Date();
    const diffTime = resetDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  /**
   * Formatear tokens para mostrar (ej: 150K, 1.5M)
   */
  formatTokens(amount) {
    return window.PLANS_CONFIG?.formatTokens(amount) || amount.toLocaleString();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSUMO DE CRÉDITOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Consumir tokens y registrar uso
   * @param {number} tokensAmount - Cantidad de tokens a consumir
   * @param {string} context - Contexto (ai_chat, elevenlabs_tts, game_master)
   * @param {string} provider - Proveedor (claude, openai, etc)
   * @param {string} model - Modelo específico
   */
  async consumeCredits(
    tokensAmount,
    context,
    provider = 'claude',
    model = 'claude-3-5-sonnet',
    _tokensUsed = 0 // Deprecated, se usa tokensAmount
  ) {
    const user = this.authHelper.getUser();

    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      // Verificar que haya tokens
      if (!this.authHelper.hasEnoughTokens(tokensAmount)) {
        throw new Error(
          `Tokens insuficientes. Tienes ${this.formatTokens(this.getTokenBalance())}, ` +
          `necesitas ${this.formatTokens(tokensAmount)}. Compra más tokens para continuar.`
        );
      }

      // Consumir tokens (usando nuevo sistema)
      const result = await this.authHelper.consumeTokens(
        tokensAmount,
        context,
        provider,
        model
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // Notificar listeners
      this.notifyCreditUpdate(result.remaining);

      // Verificar si tokens están bajos
      if (this.authHelper.isTokenBalanceLow()) {
        this.showLowTokensWarning();
      }

      logger.debug(
        `✅ Consumidos ${this.formatTokens(tokensAmount)} tokens. Restantes: ${this.formatTokens(result.remaining)}`
      );

      return {
        success: true,
        remaining: result.remaining,
        percentage: this.getCreditsPercentage(),
      };
    } catch (error) {
      logger.error('❌ Error consumiendo tokens:', error);
      throw error;
    }
  }

  /**
   * Alias: consumeTokens
   */
  async consumeTokens(tokensAmount, context, provider, model) {
    return this.consumeCredits(tokensAmount, context, provider, model);
  }

  /**
   * Mostrar advertencia de tokens bajos
   */
  showLowTokensWarning() {
    if (window.toast) {
      window.toast.warning(
        `⚠️ Tokens bajos (${this.formatTokens(this.getTokenBalance())}). ` +
        `<a href="#" onclick="window.tokenPurchaseModal?.open(); return false;">Comprar más</a>`,
        8000
      );
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
  estimateCostUSD(tokens, _provider = 'claude', model = 'claude-3-5-sonnet') {
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
   * Obtener información de plan actual (usando PLANS_CONFIG)
   */
  getPlanInfo() {
    const tier = this.authHelper.getSubscriptionTier();
    const planConfig = window.PLANS_CONFIG?.getPlan(tier);
    const tokensInfo = this.authHelper.getTokensInfo();

    if (!planConfig) {
      return {
        id: 'free',
        name: 'Gratuito',
        icon: '🆓',
        monthlyTokens: 5000,
        features: [],
        tokensInfo,
      };
    }

    // Construir lista de features activas
    const activeFeatures = Object.entries(planConfig.features || {})
      .filter(([_, enabled]) => enabled)
      .map(([featureId]) => {
        const featureDesc = window.PLANS_CONFIG?.featureDescriptions?.[featureId];
        return featureDesc ? `${featureDesc.icon} ${featureDesc.name}` : featureId;
      });

    return {
      id: planConfig.id,
      name: planConfig.name,
      icon: planConfig.icon,
      monthlyTokens: planConfig.monthlyTokens,
      price: planConfig.price,
      features: activeFeatures,
      tokensInfo,
    };
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
   * Crear widget de tokens (muestra total, comprados y mensuales)
   */
  createCreditsWidget() {
    const tokensInfo = this.authHelper.getTokensInfo();
    const daysLeft = this.getDaysUntilReset();
    const planInfo = this.getPlanInfo();

    const widget = document.createElement('div');
    widget.className = 'ai-credits-widget ai-tokens-widget';
    widget.innerHTML = `
      <div class="tokens-display">
        <div class="tokens-icon">🪙</div>
        <div class="tokens-info">
          <div class="tokens-total">${tokensInfo.formatted}</div>
          <div class="tokens-label">Tokens disponibles</div>
          <div class="tokens-breakdown">
            <span class="tokens-monthly" title="Tokens mensuales del plan ${planInfo.name}">
              📅 ${this.formatTokens(tokensInfo.monthly)}
            </span>
            <span class="tokens-purchased" title="Tokens comprados (wallet)">
              💰 ${this.formatTokens(tokensInfo.purchased)}
            </span>
          </div>
          ${daysLeft !== null ? `<div class="tokens-reset">Mensuales renuevan en ${daysLeft} días</div>` : ''}
        </div>
      </div>

      <div class="tokens-actions">
        <button class="btn-buy-tokens" onclick="window.tokenPurchaseModal?.open()">
          + Comprar tokens
        </button>
      </div>

      ${tokensInfo.isLow ? '<div class="tokens-low-warning">⚠️ Tokens bajos</div>' : ''}
    `;

    // Escuchar cambios de tokens
    this.onCreditsUpdate(() => {
      const newInfo = this.authHelper.getTokensInfo();
      const totalEl = widget.querySelector('.tokens-total');
      const monthlyEl = widget.querySelector('.tokens-monthly');
      const purchasedEl = widget.querySelector('.tokens-purchased');
      const warningEl = widget.querySelector('.tokens-low-warning');

      if (totalEl) totalEl.textContent = newInfo.formatted;
      if (monthlyEl) monthlyEl.innerHTML = `📅 ${this.formatTokens(newInfo.monthly)}`;
      if (purchasedEl) purchasedEl.innerHTML = `💰 ${this.formatTokens(newInfo.purchased)}`;

      // Mostrar/ocultar warning
      if (newInfo.isLow && !warningEl) {
        const warning = document.createElement('div');
        warning.className = 'tokens-low-warning';
        warning.textContent = '⚠️ Tokens bajos';
        widget.appendChild(warning);
      } else if (!newInfo.isLow && warningEl) {
        warningEl.remove();
      }
    });

    return widget;
  }

  /**
   * Crear widget compacto para header
   */
  createCompactTokensWidget() {
    const tokensInfo = this.authHelper.getTokensInfo();

    const widget = document.createElement('button');
    widget.className = 'compact-tokens-widget';
    widget.title = 'Ver tokens disponibles';
    widget.onclick = () => window.tokenPurchaseModal?.open();
    widget.innerHTML = `
      <span class="widget-icon">🪙</span>
      <span class="widget-amount">${tokensInfo.formatted}</span>
      ${tokensInfo.isLow ? '<span class="widget-warning">!</span>' : ''}
    `;

    // Escuchar cambios
    this.onCreditsUpdate(() => {
      const newInfo = this.authHelper.getTokensInfo();
      const amountEl = widget.querySelector('.widget-amount');
      const warningEl = widget.querySelector('.widget-warning');

      if (amountEl) amountEl.textContent = newInfo.formatted;

      if (newInfo.isLow && !warningEl) {
        const warning = document.createElement('span');
        warning.className = 'widget-warning';
        warning.textContent = '!';
        widget.appendChild(warning);
      } else if (!newInfo.isLow && warningEl) {
        warningEl.remove();
      }
    });

    return widget;
  }

  /**
   * Mostrar aviso de tokens bajos (versión modal)
   */
  showLowCreditsWarning() {
    const tokensInfo = this.authHelper.getTokensInfo();

    if (tokensInfo.isLow && tokensInfo.total > 0) {
      const warning = document.createElement('div');
      warning.className = 'low-tokens-warning fade-in';
      warning.innerHTML = `
        <div class="warning-content">
          <span class="warning-icon">⚠️</span>
          <span class="warning-text">
            Te quedan ${tokensInfo.formatted} tokens
          </span>
          <button class="btn-primary" onclick="window.tokenPurchaseModal?.open(); this.closest('.low-tokens-warning').remove()">
            Comprar tokens
          </button>
          <button class="btn-secondary" onclick="this.closest('.low-tokens-warning').remove()">
            Cerrar
          </button>
        </div>
      `;

      document.body.appendChild(warning);

      // Auto-remover después de 15 segundos
      setTimeout(() => {
        if (warning.parentNode) {
          warning.classList.add('fade-out');
          setTimeout(() => warning.remove(), 300);
        }
      }, 15000);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPRA DE TOKENS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtener paquetes de tokens disponibles
   */
  getTokenPackages() {
    return window.PLANS_CONFIG?.getAllTokenPackages() || [];
  }

  /**
   * Obtener paquete popular
   */
  getPopularPackage() {
    return window.PLANS_CONFIG?.getPopularPackage();
  }

  /**
   * Obtener métodos de pago disponibles
   */
  getPaymentMethods() {
    const methods = window.PLANS_CONFIG?.paymentMethods || {};
    return Object.values(methods).filter(m => m.enabled);
  }

  /**
   * Iniciar compra de paquete de tokens
   * @param {string} packageId - ID del paquete
   * @param {string} paymentMethod - stripe, paypal, bitcoin
   */
  async purchaseTokens(packageId, paymentMethod = 'stripe') {
    const pkg = window.PLANS_CONFIG?.getTokenPackage(packageId);
    if (!pkg) {
      throw new Error('Paquete no encontrado');
    }

    logger.debug(`Iniciando compra: ${pkg.name} (${pkg.tokens} tokens) via ${paymentMethod}`);

    switch (paymentMethod) {
      case 'stripe':
        return this.purchaseWithStripe(pkg);
      case 'paypal':
        return this.purchaseWithPayPal(pkg);
      case 'bitcoin':
        return this.purchaseWithBitcoin(pkg);
      default:
        throw new Error('Método de pago no soportado');
    }
  }

  /**
   * Compra con Stripe
   */
  async purchaseWithStripe(pkg) {
    // Llamar a Edge Function de Supabase
    const user = this.authHelper.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const response = await fetch(
      `${window.supabaseConfig.url}/functions/v1/create-token-checkout`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.supabaseConfig.anonKey}`,
        },
        body: JSON.stringify({
          packageId: pkg.id,
          userId: user.id,
          successUrl: window.location.origin + '?tokens_purchased=success',
          cancelUrl: window.location.origin + '?tokens_purchased=cancelled',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error creando checkout');
    }

    const { checkoutUrl } = await response.json();

    // Redirigir a Stripe Checkout
    window.location.href = checkoutUrl;
  }

  /**
   * Compra con PayPal
   */
  async purchaseWithPayPal(pkg) {
    const user = this.authHelper.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Llamar a Edge Function para crear orden PayPal
    const response = await fetch(
      `${window.supabaseConfig.url}/functions/v1/paypal-create-order`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.supabaseConfig.anonKey}`,
        },
        body: JSON.stringify({
          packageId: pkg.id,
          userId: user.id,
          amount: pkg.price,
          currency: pkg.currency,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error creando orden PayPal');
    }

    const { approvalUrl } = await response.json();

    // Redirigir a PayPal
    window.location.href = approvalUrl;
  }

  /**
   * Compra con Bitcoin (genera solicitud de pago)
   */
  async purchaseWithBitcoin(pkg) {
    const user = this.authHelper.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Calcular monto en BTC
    const btcAmount = window.PLANS_CONFIG?.calculateBtcAmount(pkg.price);
    const btcAddress = window.PLANS_CONFIG?.paymentConfig?.btcAddresses?.segwit;

    if (!btcAddress) {
      throw new Error('Dirección BTC no configurada');
    }

    // Crear solicitud de pago en la base de datos
    const { data, error } = await this.supabase
      .from('btc_payment_requests')
      .insert({
        user_id: user.id,
        package_id: pkg.id,
        tokens_amount: pkg.tokens,
        eur_amount: pkg.price,
        btc_amount: btcAmount,
        btc_address: btcAddress,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      requestId: data.id,
      btcAddress,
      btcAmount,
      eurAmount: pkg.price,
      tokens: pkg.tokens,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
    };
  }

  /**
   * Notificar pago BTC realizado
   * @param {string} requestId - ID de la solicitud
   * @param {string} txId - Transaction ID de blockchain
   */
  async notifyBtcPayment(requestId, txId) {
    const { data, error } = await this.supabase
      .from('btc_payment_requests')
      .update({
        tx_id: txId,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    // Disparar verificación automática
    await this.triggerBtcVerification(requestId);

    return data;
  }

  /**
   * Disparar verificación automática de pago BTC
   */
  async triggerBtcVerification(requestId) {
    try {
      const response = await fetch(
        `${window.supabaseConfig.url}/functions/v1/verify-btc-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.supabaseConfig.anonKey}`,
          },
          body: JSON.stringify({ requestId }),
        }
      );

      return await response.json();
    } catch (error) {
      logger.error('Error triggering BTC verification:', error);
      // No lanzar error, la verificación también corre por cron
    }
  }
}

// Crear instancia global
window.aiPremium = new AIPremium();

logger.debug('✅ AIPremium loaded. Use window.aiPremium for credit management.');
