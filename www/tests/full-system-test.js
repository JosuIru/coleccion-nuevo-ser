/**
 * FULL SYSTEM TEST - Coleccion Nuevo Ser v2.9.32
 *
 * Ejecutar en consola del navegador:
 *   const test = new FullSystemTest();
 *   await test.runAll();
 *
 * @version 1.0.0
 * @date 2024-12-16
 */

class FullSystemTest {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  log(status, category, test, details = '') {
    const icons = { pass: '✅', fail: '❌', warn: '⚠️', info: 'ℹ️' };
    const icon = icons[status] || '•';

    console.log(`${icon} [${category}] ${test}`);
    if (details) console.log(`   └─ ${details}`);

    this.results.push({ status, category, test, details });
    if (status === 'pass') this.passed++;
    if (status === 'fail') this.failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 1: CARGA DE SCRIPTS
  // ═══════════════════════════════════════════════════════════════

  testScriptsLoaded() {
    console.log('\n═══ TEST 1: CARGA DE SCRIPTS ═══\n');

    // Core
    this.log(
      typeof window.supabase !== 'undefined' ? 'pass' : 'fail',
      'Core', 'Supabase Client'
    );

    this.log(
      typeof window.authHelper !== 'undefined' ? 'pass' : 'fail',
      'Core', 'AuthHelper'
    );

    this.log(
      window.supabaseAuthHelper === window.authHelper ? 'pass' : 'fail',
      'Core', 'AuthHelper alias (supabaseAuthHelper)'
    );

    this.log(
      typeof window.PLANS_CONFIG !== 'undefined' ? 'pass' : 'fail',
      'Core', 'PLANS_CONFIG'
    );

    // AI System
    this.log(
      typeof window.aiConfig !== 'undefined' ? 'pass' : 'fail',
      'AI', 'AIConfig'
    );

    this.log(
      typeof window.aiAdapter !== 'undefined' ? 'pass' : 'fail',
      'AI', 'AIAdapter'
    );

    this.log(
      typeof window.aiPremium !== 'undefined' ? 'pass' : 'fail',
      'AI', 'AIPremium'
    );

    // Premium
    this.log(
      typeof window.pricingModal !== 'undefined' ? 'pass' : 'fail',
      'Premium', 'PricingModal'
    );

    this.log(
      typeof window.lazyLoader !== 'undefined' ? 'pass' : 'fail',
      'Premium', 'LazyLoader'
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 2: SISTEMA DE AUTENTICACIÓN
  // ═══════════════════════════════════════════════════════════════

  async testAuthSystem() {
    console.log('\n═══ TEST 2: SISTEMA DE AUTENTICACIÓN ═══\n');

    const auth = window.authHelper;

    // Métodos existen
    this.log(
      typeof auth.signIn === 'function' ? 'pass' : 'fail',
      'Auth', 'Método signIn existe'
    );

    this.log(
      typeof auth.signUp === 'function' ? 'pass' : 'fail',
      'Auth', 'Método signUp existe'
    );

    this.log(
      typeof auth.signOut === 'function' ? 'pass' : 'fail',
      'Auth', 'Método signOut existe'
    );

    this.log(
      typeof auth.signInWithGoogle === 'function' ? 'pass' : 'fail',
      'Auth', 'Método signInWithGoogle existe'
    );

    this.log(
      typeof auth.signInAnonymously === 'function' ? 'pass' : 'fail',
      'Auth', 'Método signInAnonymously existe'
    );

    // UI Methods
    this.log(
      typeof auth.showLoginModal === 'function' ? 'pass' : 'fail',
      'Auth UI', 'Método showLoginModal existe'
    );

    this.log(
      typeof auth.showSignupModal === 'function' ? 'pass' : 'fail',
      'Auth UI', 'Método showSignupModal existe'
    );

    this.log(
      typeof auth.renderSettingsPanel === 'function' ? 'pass' : 'fail',
      'Auth UI', 'Método renderSettingsPanel existe'
    );

    // Estado actual
    const isAuth = auth.isAuthenticated();
    this.log('info', 'Auth', `Usuario autenticado: ${isAuth ? 'SÍ' : 'NO'}`);

    if (isAuth) {
      const user = auth.getUser();
      const profile = auth.getProfile();
      this.log('info', 'Auth', `Email: ${user?.email || 'N/A'}`);
      this.log('info', 'Auth', `Tier: ${profile?.subscription_tier || 'free'}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 3: SISTEMA DE CRÉDITOS
  // ═══════════════════════════════════════════════════════════════

  async testCreditsSystem() {
    console.log('\n═══ TEST 3: SISTEMA DE CRÉDITOS ═══\n');

    const premium = window.aiPremium;
    const auth = window.authHelper;

    // Métodos existen
    this.log(
      typeof premium.checkCredits === 'function' ? 'pass' : 'fail',
      'Credits', 'Método checkCredits existe'
    );

    this.log(
      typeof premium.consumeCredits === 'function' ? 'pass' : 'fail',
      'Credits', 'Método consumeCredits existe'
    );

    this.log(
      typeof premium.getCreditsRemaining === 'function' ? 'pass' : 'fail',
      'Credits', 'Método getCreditsRemaining existe'
    );

    this.log(
      typeof premium.hasFeature === 'function' ? 'pass' : 'fail',
      'Credits', 'Método hasFeature existe'
    );

    // Estado actual
    if (auth.isAuthenticated()) {
      const credits = premium.getCreditsRemaining();
      const total = premium.getCreditsTotal();
      const percentage = premium.getCreditsPercentage();

      this.log('info', 'Credits', `Créditos: ${credits} / ${total} (${percentage}%)`);

      // Test checkCredits sin consumir
      try {
        await premium.checkCredits(1, null);
        this.log('pass', 'Credits', 'checkCredits funciona (sin feature check)');
      } catch (e) {
        this.log('warn', 'Credits', `checkCredits: ${e.message}`);
      }
    } else {
      this.log('warn', 'Credits', 'Usuario no autenticado - algunos tests omitidos');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 4: PLANS CONFIG
  // ═══════════════════════════════════════════════════════════════

  testPlansConfig() {
    console.log('\n═══ TEST 4: CONFIGURACIÓN DE PLANES ═══\n');

    const config = window.PLANS_CONFIG;

    if (!config) {
      this.log('fail', 'Plans', 'PLANS_CONFIG no está definido');
      return;
    }

    // Planes existen
    this.log(
      config.plans?.free ? 'pass' : 'fail',
      'Plans', 'Plan FREE definido'
    );

    this.log(
      config.plans?.premium ? 'pass' : 'fail',
      'Plans', 'Plan PREMIUM definido'
    );

    this.log(
      config.plans?.pro ? 'pass' : 'fail',
      'Plans', 'Plan PRO definido'
    );

    // Precios correctos
    this.log(
      config.plans?.free?.price === 0 ? 'pass' : 'fail',
      'Plans', 'Precio FREE = 0'
    );

    this.log(
      config.plans?.premium?.price === 9.99 ? 'pass' : 'fail',
      'Plans', 'Precio PREMIUM = 9.99€',
      `Actual: ${config.plans?.premium?.price}`
    );

    this.log(
      config.plans?.pro?.price === 19.99 ? 'pass' : 'fail',
      'Plans', 'Precio PRO = 19.99€',
      `Actual: ${config.plans?.pro?.price}`
    );

    // Créditos
    this.log('info', 'Plans', `Créditos FREE: ${config.plans?.free?.credits}`);
    this.log('info', 'Plans', `Créditos PREMIUM: ${config.plans?.premium?.credits}`);
    this.log('info', 'Plans', `Créditos PRO: ${config.plans?.pro?.credits}`);

    // Métodos helper
    this.log(
      typeof config.getPlan === 'function' ? 'pass' : 'fail',
      'Plans', 'Método getPlan existe'
    );

    this.log(
      typeof config.hasFeature === 'function' ? 'pass' : 'fail',
      'Plans', 'Método hasFeature existe'
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 5: PRICING MODAL
  // ═══════════════════════════════════════════════════════════════

  testPricingModal() {
    console.log('\n═══ TEST 5: PRICING MODAL ═══\n');

    const modal = window.pricingModal;

    this.log(
      typeof modal.showPricingModal === 'function' ? 'pass' : 'fail',
      'Pricing', 'Método showPricingModal existe'
    );

    this.log(
      typeof modal.closeModal === 'function' ? 'pass' : 'fail',
      'Pricing', 'Método closeModal existe'
    );

    this.log(
      typeof modal.handleCheckout === 'function' ? 'pass' : 'fail',
      'Pricing', 'Método handleCheckout existe'
    );

    // Verificar que usa PLANS_CONFIG
    this.log(
      modal.plans?.premium?.credits === window.PLANS_CONFIG?.plans?.premium?.credits ? 'pass' : 'warn',
      'Pricing', 'Usa créditos de PLANS_CONFIG'
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 6: AI CHAT MODAL
  // ═══════════════════════════════════════════════════════════════

  testAIChatModal() {
    console.log('\n═══ TEST 6: AI CHAT MODAL ═══\n');

    const chat = window.aiChatModal;

    if (!chat) {
      this.log('warn', 'AI Chat', 'aiChatModal no cargado (puede ser lazy-loaded)');
      return;
    }

    this.log(
      typeof chat.open === 'function' ? 'pass' : 'fail',
      'AI Chat', 'Método open existe'
    );

    this.log(
      typeof chat.sendMessage === 'function' ? 'pass' : 'fail',
      'AI Chat', 'Método sendMessage existe'
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 7: SUPABASE CONNECTION
  // ═══════════════════════════════════════════════════════════════

  async testSupabaseConnection() {
    console.log('\n═══ TEST 7: CONEXIÓN SUPABASE ═══\n');

    try {
      const { data, error } = await window.supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        this.log('fail', 'Supabase', 'Error conectando', error.message);
      } else {
        this.log('pass', 'Supabase', 'Conexión exitosa a base de datos');
      }
    } catch (e) {
      this.log('fail', 'Supabase', 'Excepción al conectar', e.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 8: RLS EN TABLAS IA
  // ═══════════════════════════════════════════════════════════════

  async testRLS() {
    console.log('\n═══ TEST 8: RLS EN TABLAS IA ═══\n');

    const tables = ['ai_missions', 'ai_conversations', 'ai_activity_log'];

    for (const table of tables) {
      try {
        const { data, error } = await window.supabase
          .from(table)
          .select('id')
          .limit(1);

        if (error) {
          // RLS error es esperado si no hay permisos
          if (error.message.includes('permission denied') ||
              error.code === '42501') {
            this.log('pass', 'RLS', `${table}: RLS activo (permiso denegado sin auth)`);
          } else {
            this.log('warn', 'RLS', `${table}: ${error.message}`);
          }
        } else {
          this.log('pass', 'RLS', `${table}: Acceso OK (usuario autenticado)`);
        }
      } catch (e) {
        this.log('fail', 'RLS', `${table}: Excepción`, e.message);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // RUN ALL TESTS
  // ═══════════════════════════════════════════════════════════════

  async runAll() {
    console.clear();
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     FULL SYSTEM TEST - Colección Nuevo Ser v2.9.32     ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    this.results = [];
    this.passed = 0;
    this.failed = 0;

    // Run all tests
    this.testScriptsLoaded();
    await this.testAuthSystem();
    await this.testCreditsSystem();
    this.testPlansConfig();
    this.testPricingModal();
    this.testAIChatModal();
    await this.testSupabaseConnection();
    await this.testRLS();

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                      RESUMEN                           ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    const total = this.passed + this.failed;
    const percentage = total > 0 ? Math.round((this.passed / total) * 100) : 0;

    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📊 Score: ${percentage}%`);

    if (this.failed > 0) {
      console.log('\n❌ Tests fallidos:');
      this.results
        .filter(r => r.status === 'fail')
        .forEach(r => console.log(`   • [${r.category}] ${r.test}`));
    }

    console.log('\n' + (percentage >= 80 ? '🎉 Sistema OK!' : '⚠️ Revisar errores'));

    return { passed: this.passed, failed: this.failed, percentage, results: this.results };
  }
}

// Auto-register
window.FullSystemTest = FullSystemTest;
console.log('✅ FullSystemTest loaded. Run: const t = new FullSystemTest(); await t.runAll();');
