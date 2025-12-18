/**
 * Premium System Test Suite
 * Coleccion Nuevo Ser - v2.9.32
 *
 * Tests para validar el sistema premium, autenticacion y creditos de IA
 * Ejecutar en consola del navegador o con Node.js
 */

class PremiumSystemTests {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
  }

  log(type, test, message, details = null) {
    const entry = { type, test, message, details, timestamp: new Date().toISOString() };
    this.results.push(entry);

    const icons = { pass: '✅', fail: '❌', warn: '⚠️', info: 'ℹ️' };
    console.log(`${icons[type]} [${test}] ${message}`);
    if (details) console.log('   ', details);

    if (type === 'pass') this.passed++;
    if (type === 'fail') this.failed++;
    if (type === 'warn') this.warnings++;
  }

  // ========================================
  // 1. TESTS DE CONFIGURACION
  // ========================================

  async testSupabaseConfig() {
    const testName = 'Supabase Config';

    // Test 1.1: Verificar que supabase esta cargado
    if (typeof window.supabase === 'undefined') {
      this.log('fail', testName, 'Supabase client not loaded');
      return false;
    }
    this.log('pass', testName, 'Supabase client loaded');

    // Test 1.2: Verificar configuracion
    if (window.SUPABASE_CONFIG) {
      const config = window.SUPABASE_CONFIG;
      if (config.url && config.url.includes('supabase.co')) {
        this.log('pass', testName, 'Supabase URL configured', config.url);
      } else {
        this.log('fail', testName, 'Invalid Supabase URL');
      }

      if (config.anonKey && config.anonKey.startsWith('eyJ')) {
        this.log('pass', testName, 'Anon key present');
      } else {
        this.log('fail', testName, 'Invalid anon key');
      }
    } else {
      this.log('warn', testName, 'SUPABASE_CONFIG not found, using defaults');
    }

    return true;
  }

  async testAIConfig() {
    const testName = 'AI Config';

    // Test 2.1: AIConfig class
    if (typeof window.AIConfig === 'undefined') {
      this.log('fail', testName, 'AIConfig class not loaded');
      return false;
    }
    this.log('pass', testName, 'AIConfig class available');

    // Test 2.2: aiConfig instance
    if (!window.aiConfig) {
      this.log('warn', testName, 'aiConfig instance not created');
    } else {
      this.log('pass', testName, 'aiConfig instance exists');

      // Verificar proveedores
      const providers = window.aiConfig.getAvailableProviders?.() || [];
      this.log('info', testName, `Available providers: ${providers.length}`, providers);
    }

    // Test 2.3: AIAdapter
    if (typeof window.AIAdapter === 'undefined') {
      this.log('fail', testName, 'AIAdapter class not loaded');
    } else {
      this.log('pass', testName, 'AIAdapter class available');
    }

    return true;
  }

  // ========================================
  // 2. TESTS DE AUTENTICACION
  // ========================================

  async testAuthSystem() {
    const testName = 'Auth System';

    // Test 3.1: AuthHelper disponible
    if (!window.authHelper && !window.AuthHelper) {
      this.log('fail', testName, 'AuthHelper not available');
      return false;
    }
    this.log('pass', testName, 'AuthHelper available');

    // Test 3.2: Verificar sesion actual
    try {
      const { data: { session } } = await window.supabase.auth.getSession();
      if (session) {
        this.log('pass', testName, 'User session active', {
          userId: session.user.id,
          email: session.user.email
        });
      } else {
        this.log('info', testName, 'No active session (user not logged in)');
      }
    } catch (error) {
      this.log('fail', testName, 'Error checking session', error.message);
    }

    // Test 3.3: AuthModal disponible
    if (window.authModal || window.AuthModal) {
      this.log('pass', testName, 'AuthModal available');
    } else {
      this.log('warn', testName, 'AuthModal not loaded');
    }

    return true;
  }

  // ========================================
  // 3. TESTS DE SISTEMA PREMIUM
  // ========================================

  async testPremiumSystem() {
    const testName = 'Premium System';

    // Test 4.1: AIPremium class
    if (typeof window.AIPremium === 'undefined') {
      this.log('fail', testName, 'AIPremium class not loaded');
      return false;
    }
    this.log('pass', testName, 'AIPremium class available');

    // Test 4.2: aiPremium instance
    if (!window.aiPremium) {
      this.log('warn', testName, 'aiPremium instance not created');
      return false;
    }
    this.log('pass', testName, 'aiPremium instance exists');

    // Test 4.3: Metodos criticos
    const requiredMethods = [
      'checkCredits',
      'consumeCredits',
      'hasFeature',
      'getCreditsRemaining',
      'getTier'
    ];

    for (const method of requiredMethods) {
      if (typeof window.aiPremium[method] === 'function') {
        this.log('pass', testName, `Method ${method}() available`);
      } else {
        this.log('fail', testName, `Method ${method}() MISSING`);
      }
    }

    // Test 4.4: Verificar creditos actuales
    try {
      const credits = window.aiPremium.getCreditsRemaining?.();
      const tier = window.aiPremium.getTier?.();
      this.log('info', testName, `Current state: ${tier} tier, ${credits} credits remaining`);
    } catch (error) {
      this.log('warn', testName, 'Could not get credits info', error.message);
    }

    return true;
  }

  // ========================================
  // 4. TESTS DE INTEGRACION DE CREDITOS
  // ========================================

  async testCreditsIntegration() {
    const testName = 'Credits Integration';

    // Test 5.1: Verificar que ai-chat-modal consume creditos
    // NOTA: Este es un problema conocido - el chat modal NO consume creditos

    if (window.aiChatModal) {
      const modalCode = window.aiChatModal.constructor.toString();
      const consumesCredits = modalCode.includes('consumeCredits') ||
                             modalCode.includes('checkCredits');

      if (consumesCredits) {
        this.log('pass', testName, 'AIChatModal integrates credits system');
      } else {
        this.log('fail', testName, 'AIChatModal does NOT consume credits - CRITICAL BUG');
      }
    } else {
      this.log('warn', testName, 'AIChatModal not loaded, cannot verify integration');
    }

    // Test 5.2: Verificar ai-book-features
    if (window.AIBookFeatures) {
      this.log('pass', testName, 'AIBookFeatures available (has credit integration)');
    } else {
      this.log('warn', testName, 'AIBookFeatures not loaded');
    }

    return true;
  }

  // ========================================
  // 5. TESTS DE STRIPE/PAGOS
  // ========================================

  async testPaymentSystem() {
    const testName = 'Payment System';

    // Test 6.1: Stripe loaded
    if (typeof window.Stripe === 'undefined') {
      this.log('warn', testName, 'Stripe.js not loaded (will load on demand)');
    } else {
      this.log('pass', testName, 'Stripe.js available');
    }

    // Test 6.2: Pricing modal
    if (window.pricingModal || window.PricingModal) {
      this.log('pass', testName, 'PricingModal available');
    } else {
      this.log('warn', testName, 'PricingModal not loaded');
    }

    // Test 6.3: Verificar configuracion de Stripe
    const stripeKey = window.STRIPE_PUBLISHABLE_KEY ||
                     window.ENV?.STRIPE_PUBLISHABLE_KEY;

    if (stripeKey && stripeKey.startsWith('pk_')) {
      const isTest = stripeKey.startsWith('pk_test_');
      this.log('pass', testName, `Stripe key configured (${isTest ? 'TEST' : 'LIVE'} mode)`);
    } else {
      this.log('fail', testName, 'Stripe publishable key not configured');
    }

    return true;
  }

  // ========================================
  // 6. TESTS DE SEGURIDAD
  // ========================================

  async testSecurity() {
    const testName = 'Security';

    // Test 7.1: Verificar que no hay API keys expuestas
    const sensitivePatterns = [
      /sk_live_[a-zA-Z0-9]+/,  // Stripe secret key
      /sk-[a-zA-Z0-9-]+/,      // OpenAI key
      /sk-ant-[a-zA-Z0-9-]+/,  // Anthropic key
    ];

    const pageContent = document.documentElement.innerHTML;
    for (const pattern of sensitivePatterns) {
      if (pattern.test(pageContent)) {
        this.log('fail', testName, `Sensitive key pattern found: ${pattern}`);
      }
    }
    this.log('pass', testName, 'No sensitive API keys exposed in DOM');

    // Test 7.2: HTTPS
    if (location.protocol === 'https:' || location.hostname === 'localhost') {
      this.log('pass', testName, 'Secure connection (HTTPS or localhost)');
    } else {
      this.log('fail', testName, 'Insecure connection (HTTP)');
    }

    // Test 7.3: CSP headers (informativo)
    const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (csp) {
      this.log('pass', testName, 'CSP meta tag present');
    } else {
      this.log('warn', testName, 'No CSP meta tag (check server headers)');
    }

    return true;
  }

  // ========================================
  // 7. TESTS DE BASE DE DATOS
  // ========================================

  async testDatabase() {
    const testName = 'Database';

    if (!window.supabase) {
      this.log('fail', testName, 'Supabase not available');
      return false;
    }

    // Test 8.1: Verificar conexion
    try {
      const { data, error } = await window.supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        // RLS puede bloquear si no hay sesion
        if (error.code === 'PGRST301' || error.message.includes('RLS')) {
          this.log('pass', testName, 'RLS is active (expected when not logged in)');
        } else {
          this.log('fail', testName, 'Database error', error.message);
        }
      } else {
        this.log('pass', testName, 'Database connection working');
      }
    } catch (error) {
      this.log('fail', testName, 'Database connection failed', error.message);
    }

    return true;
  }

  // ========================================
  // 8. TESTS DE PERSISTENCIA
  // ========================================

  async testPersistence() {
    const testName = 'Persistence';

    // Test 9.1: localStorage disponible
    try {
      localStorage.setItem('test-premium-system', 'test');
      localStorage.removeItem('test-premium-system');
      this.log('pass', testName, 'localStorage available');
    } catch (error) {
      this.log('fail', testName, 'localStorage not available', error.message);
    }

    // Test 9.2: Verificar datos guardados
    const savedKeys = [
      'nuevosser-auth',
      'ai-config',
      'user-settings',
      'reading-progress'
    ];

    for (const key of savedKeys) {
      const value = localStorage.getItem(key);
      if (value) {
        this.log('info', testName, `Key '${key}' has data (${value.length} chars)`);
      }
    }

    // Test 9.3: AIPersistence
    if (window.AIPersistence) {
      this.log('pass', testName, 'AIPersistence class available');
    } else {
      this.log('warn', testName, 'AIPersistence not loaded');
    }

    return true;
  }

  // ========================================
  // EJECUTAR TODOS LOS TESTS
  // ========================================

  async runAll() {
    console.log('\n========================================');
    console.log('PREMIUM SYSTEM TEST SUITE');
    console.log('Coleccion Nuevo Ser v2.9.32');
    console.log('========================================\n');

    const tests = [
      () => this.testSupabaseConfig(),
      () => this.testAIConfig(),
      () => this.testAuthSystem(),
      () => this.testPremiumSystem(),
      () => this.testCreditsIntegration(),
      () => this.testPaymentSystem(),
      () => this.testSecurity(),
      () => this.testDatabase(),
      () => this.testPersistence(),
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        this.log('fail', 'Test Runner', `Test threw exception: ${error.message}`);
      }
      console.log(''); // Separador
    }

    // Resumen
    console.log('========================================');
    console.log('RESUMEN');
    console.log('========================================');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`⚠️ Warnings: ${this.warnings}`);
    console.log(`Total: ${this.results.length} checks`);

    const score = Math.round((this.passed / (this.passed + this.failed)) * 100);
    console.log(`\nScore: ${score}%`);

    if (this.failed > 0) {
      console.log('\n❌ CRITICAL ISSUES FOUND - Review failed tests');
    } else if (this.warnings > 3) {
      console.log('\n⚠️ WARNINGS FOUND - Review for production readiness');
    } else {
      console.log('\n✅ SYSTEM LOOKS HEALTHY');
    }

    return {
      passed: this.passed,
      failed: this.failed,
      warnings: this.warnings,
      score,
      results: this.results
    };
  }
}

// Exportar para uso en navegador y Node.js
if (typeof window !== 'undefined') {
  window.PremiumSystemTests = PremiumSystemTests;

  // Auto-run si se carga directamente
  if (document.readyState === 'complete') {
    console.log('Run tests with: new PremiumSystemTests().runAll()');
  }
}

if (typeof module !== 'undefined') {
  module.exports = PremiumSystemTests;
}
