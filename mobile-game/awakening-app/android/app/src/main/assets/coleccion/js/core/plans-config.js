/**
 * Configuracion Centralizada de Planes Premium
 * Coleccion Nuevo Ser
 *
 * IMPORTANTE: Este archivo es la UNICA fuente de verdad para planes.
 * Sincronizar con: supabase/functions/stripe-webhook/index.ts
 *
 * @version 2.9.32
 * @updated 2024-12-16
 */

const PLANS_CONFIG = {
  // =============================================
  // DEFINICION DE PLANES
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
      credits: 10,
      stripePriceId: null, // No tiene precio en Stripe

      features: {
        ai_chat: false,
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
        maxConversationsPerDay: 3,
        maxTokensPerMessage: 500,
        maxHistoryMessages: 5,
      },

      description: 'Acceso basico a la coleccion',
      descriptionEn: 'Basic access to the collection',
    },

    premium: {
      id: 'premium',
      name: 'Premium',
      nameEn: 'Premium',
      icon: '⭐',
      price: 9.99,
      currency: 'EUR',
      interval: 'month',
      credits: 500,
      stripePriceId: 'price_premium_monthly', // Reemplazar con ID real de Stripe

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
        maxConversationsPerDay: 50,
        maxTokensPerMessage: 4000,
        maxHistoryMessages: 20,
      },

      description: 'Chat IA, tutor personalizado y adaptacion de contenido',
      descriptionEn: 'AI Chat, personalized tutor and content adaptation',
      recommended: true, // Marcar como recomendado en UI
    },

    pro: {
      id: 'pro',
      name: 'Pro',
      nameEn: 'Pro',
      icon: '👑',
      price: 19.99,
      currency: 'EUR',
      interval: 'month',
      credits: 2000,
      stripePriceId: 'price_pro_monthly', // Reemplazar con ID real de Stripe

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
        maxConversationsPerDay: -1, // Sin limite
        maxTokensPerMessage: 8000,
        maxHistoryMessages: 50,
      },

      description: 'Todas las funciones + Game Master IA + soporte prioritario',
      descriptionEn: 'All features + AI Game Master + priority support',
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
  // METODOS HELPER
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
   * Obtener creditos mensuales de un plan
   */
  getCredits(planId) {
    return this.getPlan(planId).credits;
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
};

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.PLANS_CONFIG = PLANS_CONFIG;
}

if (typeof module !== 'undefined') {
  module.exports = PLANS_CONFIG;
}
