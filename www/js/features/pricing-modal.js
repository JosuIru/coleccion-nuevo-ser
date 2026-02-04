/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * PRICING MODAL - UI de Planes y Pagos
 * Modal para seleccionar plan de suscripción y procesar pagos
 *
 * Usa PLANS_CONFIG como fuente centralizada de verdad.
 *
 * @version 2.0.0
 * @updated 2024-12-16
 */

class PricingModal {
  constructor() {
    this.stripe = null;
    this.authHelper = window.authHelper;
    this.supabase = null;
    this.escapeHandler = null; // Handler for escape key

    // Generar planes desde PLANS_CONFIG
    this.plans = this.buildPlansFromConfig();

    this.init();
  }

  /**
   * Construir planes desde PLANS_CONFIG centralizado
   */
  buildPlansFromConfig() {
    const config = window.PLANS_CONFIG;
    if (!config) {
      logger.warn('PLANS_CONFIG no disponible, usando configuración por defecto');
      return this.getDefaultPlans();
    }

    const featureDescriptions = config.featureDescriptions;

    return {
      free: {
        name: config.plans.free.name,
        price: '0€',
        period: '/mes',
        icon: config.plans.free.icon,
        credits: config.plans.free.credits,
        features: [
          'Acceso a todos los libros',
          'Progreso sincronizado',
          'Quizzes interactivos',
          `${config.plans.free.credits} créditos IA/mes`,
          'Modo offline',
        ],
        notIncluded: [
          'Chat IA',
          'Voces Premium ElevenLabs',
          'Prácticas IA personalizadas',
        ],
        button: 'Plan Actual',
        buttonAction: 'current',
        stripePriceId: null,
      },
      premium: {
        name: config.plans.premium.name,
        price: `${config.plans.premium.price.toFixed(2).replace('.', ',')}€`,
        period: '/mes',
        icon: config.plans.premium.icon,
        badge: config.plans.premium.recommended ? 'Recomendado' : null,
        credits: config.plans.premium.credits,
        features: [
          'Todo lo de Gratuito',
          `${featureDescriptions.ai_chat.icon} ${featureDescriptions.ai_chat.name}`,
          `${featureDescriptions.ai_content_adapter.icon} ${featureDescriptions.ai_content_adapter.name}`,
          `${featureDescriptions.elevenlabs_tts.icon} ${featureDescriptions.elevenlabs_tts.name}`,
          `${featureDescriptions.ai_practice_generator.icon} ${featureDescriptions.ai_practice_generator.name}`,
          `${featureDescriptions.ai_auto_summary.icon} ${featureDescriptions.ai_auto_summary.name}`,
          `${featureDescriptions.advanced_analytics.icon} ${featureDescriptions.advanced_analytics.name}`,
          `${config.plans.premium.credits} créditos IA/mes`,
        ],
        notIncluded: [
          `${featureDescriptions.ai_smart_notes.icon} ${featureDescriptions.ai_smart_notes.name}`,
          `${featureDescriptions.ai_koan_generator.icon} ${featureDescriptions.ai_koan_generator.name}`,
          `${featureDescriptions.priority_support.icon} ${featureDescriptions.priority_support.name}`,
        ],
        button: 'Comenzar Premium',
        buttonAction: 'premium',
        stripePriceId: config.plans.premium.stripePriceId,
      },
      pro: {
        name: config.plans.pro.name,
        price: `${config.plans.pro.price.toFixed(2).replace('.', ',')}€`,
        period: '/mes',
        icon: config.plans.pro.icon,
        credits: config.plans.pro.credits,
        features: [
          'Todo lo de Premium',
          `${featureDescriptions.ai_smart_notes.icon} ${featureDescriptions.ai_smart_notes.name}`,
          `${featureDescriptions.ai_koan_generator.icon} ${featureDescriptions.ai_koan_generator.name}`,
          `${featureDescriptions.priority_support.icon} ${featureDescriptions.priority_support.name}`,
          `${config.plans.pro.credits} créditos IA/mes`,
        ],
        notIncluded: [],
        button: 'Comenzar Pro',
        buttonAction: 'pro',
        stripePriceId: config.plans.pro.stripePriceId,
      },
    };
  }

  /**
   * Configuración por defecto si PLANS_CONFIG no está disponible
   */
  getDefaultPlans() {
    return {
      free: {
        name: 'Gratuito',
        price: '0€',
        period: '/mes',
        icon: '🆓',
        credits: 10,
        features: ['Acceso a todos los libros', 'Quizzes interactivos', '10 créditos IA/mes'],
        notIncluded: ['Chat IA', 'Voces Premium', 'Prácticas IA'],
        button: 'Plan Actual',
        buttonAction: 'current',
      },
      premium: {
        name: 'Premium',
        price: '9,99€',
        period: '/mes',
        icon: '⭐',
        badge: 'Recomendado',
        credits: 500,
        features: ['Todo lo de Gratuito', 'Chat IA', 'Voces ElevenLabs', 'Prácticas IA', 'Resúmenes IA', '500 créditos/mes'],
        notIncluded: ['Notas inteligentes IA', 'Koans IA'],
        button: 'Comenzar Premium',
        buttonAction: 'premium',
        stripePriceId: 'price_premium_monthly',
      },
      pro: {
        name: 'Pro',
        price: '19,99€',
        period: '/mes',
        icon: '👑',
        credits: 2000,
        features: ['Todo lo de Premium', 'Notas inteligentes IA', 'Koans IA', 'Soporte prioritario', '2000 créditos/mes'],
        notIncluded: [],
        button: 'Comenzar Pro',
        buttonAction: 'pro',
        stripePriceId: 'price_pro_monthly',
      },
    };
  }

  /**
   * Inicializar
   */
  async init() {
    // Esperar a Supabase
    if (typeof window.supabase !== 'undefined') {
      this.supabase = window.supabase;
    } else {
      setTimeout(() => this.init(), 500);
      return;
    }

    // Cargar Stripe.js
    await this.loadStripe();

    logger.debug('✅ PricingModal inicializado');
  }

  /**
   * Cargar Stripe.js dinámicamente
   */
  loadStripe() {
    return new Promise((resolve) => {
      if (window.Stripe) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        // Usar la clave pública de Stripe
        const publishableKey = this.getStripePublishableKey();
        if (publishableKey) {
          window.stripe = Stripe(publishableKey);
        }
        resolve();
      };
      script.onerror = () => {
        logger.error('❌ Error cargando Stripe.js');
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Obtener clave pública de Stripe
   */
  getStripePublishableKey() {
    // Esta clave debe estar en las variables de entorno del frontend
    return window.STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_KEY_HERE';
  }

  /**
   * Mostrar modal de pricing
   */
  showPricingModal() {
    const modal = document.createElement('div');
    modal.className = 'pricing-modal-overlay fade-in';
    modal.innerHTML = `
      <div class="pricing-modal-container scale-in">
        <button class="pricing-modal-close" onclick="window.pricingModal.closeModal()" aria-label="Cerrar modal de precios">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" stroke-width="2"/>
          </svg>
        </button>

        <div class="pricing-header">
          <h2>Elige tu Plan</h2>
          <p>Acceso a IA avanzada para mejorar tu aprendizaje</p>
        </div>

        <div class="pricing-grid">
          ${this.getPricingCardsHTML()}
        </div>

        <div class="pricing-footer">
          <p>💳 Pago seguro con Stripe</p>
          <p>Cancela en cualquier momento. Sin compromisos a largo plazo.</p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Click fuera para cerrar
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('pricing-modal-overlay')) {
        this.closeModal();
      }
    });

    // Escape key para cerrar modal
    this.escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
  }

  /**
   * Obtener HTML de tarjetas de pricing
   */
  getPricingCardsHTML() {
    const currentTier = this.authHelper.getSubscriptionTier();

    return Object.entries(this.plans)
      .map(([key, plan]) => {
        const isCurrentPlan = currentTier === key;

        return `
          <div class="pricing-card ${key} ${plan.badge ? 'featured' : ''}">
            ${plan.badge ? `<div class="pricing-badge">${plan.badge}</div>` : ''}

            <div class="pricing-icon">${plan.icon}</div>
            <h3 class="pricing-name">${plan.name}</h3>

            <div class="pricing-price">
              ${plan.price}
              <span class="pricing-period">${plan.period}</span>
            </div>

            <ul class="pricing-features">
              ${plan.features.map((f) => `
                <li class="feature-included">
                  <span class="feature-icon">✓</span>
                  <span class="feature-text">${f}</span>
                </li>
              `).join('')}

              ${plan.notIncluded.map((f) => `
                <li class="feature-excluded">
                  <span class="feature-icon">✗</span>
                  <span class="feature-text">${f}</span>
                </li>
              `).join('')}
            </ul>

            <div class="pricing-actions">
              ${isCurrentPlan
                ? `<button class="btn-pricing current" disabled>Plan Actual</button>`
                : key === 'free'
                ? `<button class="btn-pricing secondary" onclick="window.pricingModal.selectFree()">Elegir Gratuito</button>`
                : `<button class="btn-pricing primary" onclick="window.pricingModal.handleCheckout('${key}')">
                    ${plan.button}
                  </button>`
              }
            </div>
          </div>
        `;
      })
      .join('');
  }

  /**
   * Manejar selección de plan gratuito
   */
  selectFree() {
    this.closeModal();
    alert(
      'Ya tienes acceso al plan gratuito. Crea una cuenta o inicia sesión para comenzar.'
    );
  }

  /**
   * Manejar checkout (proceso de pago)
   */
  async handleCheckout(tier) {
    // Verificar autenticación
    if (!this.authHelper.isAuthenticated()) {
      alert('Debes iniciar sesión para comprar un plan.');
      this.closeModal();
      window.authModal.showLoginModal();
      return;
    }

    const user = this.authHelper.getUser();
    const button = event.target;

    button.disabled = true;
    button.textContent = 'Procesando...';

    try {
      // Notificar intento de checkout al admin
      if (window.adminNotifications) {
        window.adminNotifications.notifyPayment(tier, user.id);
      }

      // Llamar a Edge Function para crear sesión
      const { data, error } = await this.supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            tier,
            userId: user.id,
          },
        }
      );

      if (error) {
        throw error;
      }

      if (!data.sessionId) {
        throw new Error('No se obtuvo session ID');
      }

      // Redirigir a Stripe Checkout
      const stripe = window.Stripe(this.getStripePublishableKey());

      const result = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (result.error) {
        throw result.error;
      }
    } catch (error) {
      logger.error('❌ Error en checkout:', error);
      alert('Error al procesar el pago: ' + error.message);

      button.disabled = false;
      button.textContent = `Comenzar ${tier.charAt(0).toUpperCase() + tier.slice(1)}`;
    }
  }

  /**
   * Cerrar modal
   */
  closeModal() {
    // Limpiar escape key handler
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }

    const overlay = document.querySelector('.pricing-modal-overlay');
    if (overlay) {
      overlay.remove();
      document.body.style.overflow = '';
    }
  }
}

// Crear instancia global
window.pricingModal = new PricingModal();

logger.debug('✅ PricingModal loaded. Use window.pricingModal.showPricingModal() to open.');
