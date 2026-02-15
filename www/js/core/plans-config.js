/**
 * Configuracion Centralizada de Planes y Tokens
 * Coleccion Nuevo Ser
 *
 * IMPORTANTE: Este archivo es la UNICA fuente de verdad para planes y tokens.
 * Sincronizar con: supabase/functions/stripe-webhook/index.ts
 *
 * @version 2.9.386
 * @updated 2025-01-15
 *
 * MODELO HIBRIDO:
 * - Suscripciones mensuales dan tokens gratis cada mes
 * - Paquetes de tokens adicionales disponibles para compra
 * - Metodos de pago: Stripe, PayPal, Bitcoin
 */

const PLANS_CONFIG = {
  // =============================================
  // PAQUETES DE TOKENS PARA COMPRA
  // =============================================
  tokenPackages: {
    basico: {
      id: 'basico',
      name: 'Basico',
      nameEn: 'Basic',
      icon: '🪙',
      tokens: 50000,
      price: 2.99,
      currency: 'EUR',
      discount: 0,
      stripePriceId: 'price_tokens_basico',
      popular: false,
    },
    estandar: {
      id: 'estandar',
      name: 'Estandar',
      nameEn: 'Standard',
      icon: '💰',
      tokens: 150000,
      price: 7.99,
      currency: 'EUR',
      discount: 11,
      stripePriceId: 'price_tokens_estandar',
      popular: true,
    },
    premium_pack: {
      id: 'premium_pack',
      name: 'Premium',
      nameEn: 'Premium',
      icon: '💎',
      tokens: 500000,
      price: 19.99,
      currency: 'EUR',
      discount: 20,
      stripePriceId: 'price_tokens_premium',
      popular: false,
    },
    pro_pack: {
      id: 'pro_pack',
      name: 'Pro',
      nameEn: 'Pro',
      icon: '🚀',
      tokens: 1500000,
      price: 49.99,
      currency: 'EUR',
      discount: 33,
      stripePriceId: 'price_tokens_pro',
      popular: false,
    },
  },

  // =============================================
  // PRECIOS DE TOKENS POR RECURSO (con margen ~40%)
  // =============================================
  tokenPricing: {
    // Modelos de IA (tokens por 1K tokens de API)
    'claude-3-5-sonnet': { costPer1K: 0.003, pricePer1K: 0.005, margin: 40 },
    'claude-3-5-haiku': { costPer1K: 0.001, pricePer1K: 0.002, margin: 50 },
    'gpt-4o': { costPer1K: 0.005, pricePer1K: 0.008, margin: 37 },
    'gpt-4o-mini': { costPer1K: 0.0005, pricePer1K: 0.001, margin: 50 },
    'gemini-2.0-flash': { costPer1K: 0.001, pricePer1K: 0.002, margin: 50 },
    'mistral-large': { costPer1K: 0.002, pricePer1K: 0.003, margin: 33 },

    // ElevenLabs TTS (tokens por 1K caracteres)
    'elevenlabs': { costPer1K: 0.018, pricePer1K: 0.030, margin: 40 },

    // Conversion: 1 token de usuario ≈ 1 token de API
    // Para simplificar, usamos ratio 1:1
    tokenRatio: 1,
  },

  // =============================================
  // METODOS DE PAGO DISPONIBLES
  // =============================================
  paymentMethods: {
    stripe: {
      id: 'stripe',
      name: 'Tarjeta',
      nameEn: 'Card',
      icon: '💳',
      enabled: true,
      description: 'Visa, Mastercard, Google Pay, Apple Pay',
    },
    paypal: {
      id: 'paypal',
      name: 'PayPal',
      nameEn: 'PayPal',
      icon: '🅿️',
      enabled: true,
      description: 'Paga con tu cuenta PayPal',
    },
    bitcoin: {
      id: 'bitcoin',
      name: 'Bitcoin',
      nameEn: 'Bitcoin',
      icon: '₿',
      enabled: true,
      description: 'Pago manual con verificacion',
      // La direccion BTC se configura en env.js
    },
  },

  // =============================================
  // DEFINICION DE PLANES (SUSCRIPCIONES)
  // =============================================
  plans: {
    free: {
      id: 'free',
      name: 'Gratuito',
      nameEn: 'Free',
      icon: '🆓',
      price: 0,
      currency: 'EUR',
      interval: 'month',
      monthlyTokens: 5000, // Tokens gratis al mes
      stripePriceId: null,

      features: {
        ai_chat: true,  // Permitido pero con tokens limitados
        ai_tutor: false,
        ai_game_master: false,
        ai_content_adapter: false,
        elevenlabs_tts: false,
        advanced_analytics: false,
        priority_support: false,
        offline_mode: true,
        sync_cloud: true,
      },

      limits: {
        maxConversationsPerDay: 5,
        maxTokensPerMessage: 1000,
        maxHistoryMessages: 5,
      },

      description: 'Acceso basico con 5,000 tokens/mes',
      descriptionEn: 'Basic access with 5,000 tokens/month',
    },

    premium: {
      id: 'premium',
      name: 'Premium',
      nameEn: 'Premium',
      icon: '⭐',
      price: 4.99,
      currency: 'EUR',
      interval: 'month',
      monthlyTokens: 100000, // 100K tokens gratis al mes
      stripePriceId: 'price_premium_monthly',

      features: {
        ai_chat: true,
        ai_tutor: true,
        ai_game_master: false,
        ai_content_adapter: true,
        elevenlabs_tts: true,
        advanced_analytics: true,
        priority_support: false,
        offline_mode: true,
        sync_cloud: true,
      },

      limits: {
        maxConversationsPerDay: -1, // Sin limite
        maxTokensPerMessage: 4000,
        maxHistoryMessages: 20,
      },

      description: '100,000 tokens/mes + voces premium',
      descriptionEn: '100,000 tokens/month + premium voices',
      recommended: true,
    },

    pro: {
      id: 'pro',
      name: 'Pro',
      nameEn: 'Pro',
      icon: '👑',
      price: 9.99,
      currency: 'EUR',
      interval: 'month',
      monthlyTokens: 300000, // 300K tokens gratis al mes
      stripePriceId: 'price_pro_monthly',

      features: {
        ai_chat: true,
        ai_tutor: true,
        ai_game_master: true,
        ai_content_adapter: true,
        elevenlabs_tts: true,
        advanced_analytics: true,
        priority_support: true,
        offline_mode: true,
        sync_cloud: true,
      },

      limits: {
        maxConversationsPerDay: -1,
        maxTokensPerMessage: 8000,
        maxHistoryMessages: 50,
      },

      description: '300,000 tokens/mes + Game Master + soporte prioritario',
      descriptionEn: '300,000 tokens/month + Game Master + priority support',
    },
  },

  // =============================================
  // FEATURES DISPONIBLES
  // =============================================
  featureDescriptions: {
    ai_chat: {
      name: 'Chat con IA',
      nameEn: 'AI Chat',
      description: 'Conversa con un asistente IA sobre los libros',
      icon: '💬',
    },
    ai_tutor: {
      name: 'Tutor Personalizado',
      nameEn: 'Personal Tutor',
      description: 'Explicaciones profundas y adaptadas a tu nivel',
      icon: '🎓',
    },
    ai_game_master: {
      name: 'Game Master IA',
      nameEn: 'AI Game Master',
      description: 'NPCs conversacionales y narrativa adaptativa',
      icon: '🎮',
    },
    ai_content_adapter: {
      name: 'Adaptador de Contenido',
      nameEn: 'Content Adapter',
      description: 'Adapta el contenido a tu estilo de aprendizaje',
      icon: '🔄',
    },
    elevenlabs_tts: {
      name: 'Voces Premium ElevenLabs',
      nameEn: 'ElevenLabs Premium Voices',
      description: 'Narración con voces IA de alta calidad',
      icon: '🎙️',
    },
    advanced_analytics: {
      name: 'Analiticas Avanzadas',
      nameEn: 'Advanced Analytics',
      description: 'Estadisticas detalladas de tu progreso',
      icon: '📊',
    },
    priority_support: {
      name: 'Soporte Prioritario',
      nameEn: 'Priority Support',
      description: 'Respuestas en menos de 24 horas',
      icon: '🚀',
    },
    offline_mode: {
      name: 'Modo Offline',
      nameEn: 'Offline Mode',
      description: 'Lee sin conexion a internet',
      icon: '📴',
    },
    sync_cloud: {
      name: 'Sincronizacion Cloud',
      nameEn: 'Cloud Sync',
      description: 'Tu progreso sincronizado en todos tus dispositivos',
      icon: '☁️',
    },
  },

  // =============================================
  // CONFIGURACION DE PAGOS
  // =============================================
  paymentConfig: {
    // PayPal
    paypalEmail: 'codigodespierto',  // paypal.me/codigodespierto
    paypalUrl: 'https://www.paypal.com/paypalme/codigodespierto',

    // Bitcoin - Direcciones para recibir pagos
    btcAddresses: {
      segwit: 'bc1qjnva46wy92ldhsv4w0j26jmu8c5wm5cxvgdfd7',
      taproot: 'bc1p29l9vjelerljlwhg6dhr0uldldus4zgn8vjaecer0spj7273d7rss4gnyk',
    },

    // Tasa BTC/EUR aproximada (se actualiza dinamicamente)
    btcEurRate: 40000, // Precio aproximado, actualizar via API
  },

  // =============================================
  // METODOS HELPER - PLANES
  // =============================================

  /**
   * Obtener plan por ID
   */
  getPlan(planId) {
    return this.plans[planId] || this.plans.free;
  },

  /**
   * Obtener todos los planes como array
   */
  getAllPlans() {
    return Object.values(this.plans);
  },

  /**
   * Verificar si un plan tiene una feature
   */
  hasFeature(planId, featureId) {
    const plan = this.getPlan(planId);
    return plan.features[featureId] === true;
  },

  /**
   * Obtener tokens mensuales de un plan
   */
  getMonthlyTokens(planId) {
    return this.getPlan(planId).monthlyTokens || 0;
  },

  /**
   * Obtener precio formateado
   */
  getFormattedPrice(planId) {
    const plan = this.getPlan(planId);
    if (plan.price === 0) return 'Gratis';
    return `${plan.price.toFixed(2)} ${plan.currency}/mes`;
  },

  /**
   * Obtener plan recomendado
   */
  getRecommendedPlan() {
    return Object.values(this.plans).find(p => p.recommended) || this.plans.premium;
  },

  /**
   * Comparar dos planes (para upgrades/downgrades)
   */
  comparePlans(currentPlanId, targetPlanId) {
    const planOrder = ['free', 'premium', 'pro'];
    const currentIndex = planOrder.indexOf(currentPlanId);
    const targetIndex = planOrder.indexOf(targetPlanId);

    if (targetIndex > currentIndex) return 'upgrade';
    if (targetIndex < currentIndex) return 'downgrade';
    return 'same';
  },

  /**
   * Obtener features que se ganan/pierden al cambiar de plan
   */
  getFeatureDiff(fromPlanId, toPlanId) {
    const fromPlan = this.getPlan(fromPlanId);
    const toPlan = this.getPlan(toPlanId);

    const gained = [];
    const lost = [];

    for (const [feature, enabled] of Object.entries(toPlan.features)) {
      if (enabled && !fromPlan.features[feature]) {
        gained.push(this.featureDescriptions[feature]);
      } else if (!enabled && fromPlan.features[feature]) {
        lost.push(this.featureDescriptions[feature]);
      }
    }

    return { gained, lost };
  },

  // =============================================
  // METODOS HELPER - TOKENS
  // =============================================

  /**
   * Obtener paquete de tokens por ID
   */
  getTokenPackage(packageId) {
    return this.tokenPackages[packageId] || null;
  },

  /**
   * Obtener todos los paquetes de tokens
   */
  getAllTokenPackages() {
    return Object.values(this.tokenPackages);
  },

  /**
   * Obtener paquete popular
   */
  getPopularPackage() {
    return Object.values(this.tokenPackages).find(p => p.popular) || this.tokenPackages.estandar;
  },

  /**
   * Calcular precio por 1K tokens de un paquete
   */
  getPricePerKTokens(packageId) {
    const pkg = this.getTokenPackage(packageId);
    if (!pkg) return 0;
    return ((pkg.price / pkg.tokens) * 1000).toFixed(4);
  },

  /**
   * Formatear cantidad de tokens para mostrar
   */
  formatTokens(amount) {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
  },

  /**
   * Calcular costo en tokens para una operacion
   * @param {string} resource - Tipo de recurso (claude-3-5-sonnet, elevenlabs, etc)
   * @param {number} units - Cantidad de unidades (tokens API o caracteres)
   */
  calculateTokenCost(resource, units) {
    const pricing = this.tokenPricing[resource];
    if (!pricing) return units; // Si no hay pricing especifico, 1:1

    // Precio por 1K unidades * (unidades / 1000)
    const cost = pricing.pricePer1K * (units / 1000);
    // Convertir a tokens internos (redondeando hacia arriba)
    return Math.ceil(cost * 1000);
  },

  /**
   * Calcular equivalente en BTC para un precio en EUR
   */
  calculateBtcAmount(eurAmount) {
    const rate = this.paymentConfig.btcEurRate;
    return (eurAmount / rate).toFixed(8);
  },

  /**
   * Obtener URL de PayPal para un monto
   */
  getPayPalUrl(amount) {
    return `${this.paymentConfig.paypalUrl}/${amount}EUR`;
  },

  // =============================================
  // DEPRECADO - Mantener por compatibilidad
  // =============================================

  /**
   * @deprecated Usar getMonthlyTokens() en su lugar
   */
  getCredits(planId) {
    return this.getMonthlyTokens(planId);
  },
};

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.PLANS_CONFIG = PLANS_CONFIG;
}

if (typeof module !== 'undefined') {
  module.exports = PLANS_CONFIG;
}
