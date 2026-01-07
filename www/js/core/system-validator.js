/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * System Validator - Validación rápida del sistema
 * Coleccion Nuevo Ser v2.9.32
 *
 * Ejecutar: window.systemValidator.runQuickCheck()
 *
 * @version 1.0.0
 * @updated 2024-12-16
 */

class SystemValidator {
  constructor() {
    this.checks = [];
  }

  /**
   * Ejecutar validación rápida
   */
  async runQuickCheck() {
    logger.debug('🔍 Ejecutando validación rápida del sistema...\n');
    this.checks = [];

    // 1. Core Dependencies
    this.check('Supabase Client', typeof window.supabase !== 'undefined');
    this.check('Auth Helper', typeof window.authHelper !== 'undefined');
    this.check('Auth Helper Alias', window.supabaseAuthHelper === window.authHelper);
    this.check('Plans Config', typeof window.PLANS_CONFIG !== 'undefined');

    // 2. AI System
    this.check('AI Config', typeof window.aiConfig !== 'undefined');
    this.check('AI Adapter', typeof window.aiAdapter !== 'undefined');
    this.check('AI Premium', typeof window.aiPremium !== 'undefined');
    this.check('AI Game Master', typeof window.aiGameMaster !== 'undefined');

    // 3. Premium System
    this.check('Pricing Modal', typeof window.pricingModal !== 'undefined');
    this.check('Lazy Loader', typeof window.lazyLoader !== 'undefined');

    // 4. Auth State
    const isAuth = window.authHelper?.isAuthenticated?.() || false;
    this.check('Auth Initialized', window.authHelper?.initialized === true, 'warn');
    this.info('User Authenticated', isAuth ? 'Yes' : 'No');

    if (isAuth) {
      const tier = window.authHelper.getSubscriptionTier();
      const credits = window.authHelper.getAICredits();
      this.info('Subscription Tier', tier);
      this.info('AI Credits', credits);
    }

    // 5. Configuration Checks
    const hasStripeKey = typeof window.STRIPE_PUBLISHABLE_KEY !== 'undefined' &&
                         window.STRIPE_PUBLISHABLE_KEY !== 'pk_test_YOUR_KEY_HERE';
    this.check('Stripe Key Configured', hasStripeKey, 'warn');

    // Results
    const passed = this.checks.filter(c => c.status === 'pass').length;
    const failed = this.checks.filter(c => c.status === 'fail').length;
    const warnings = this.checks.filter(c => c.status === 'warn').length;

    logger.debug('\n' + '═'.repeat(50));
    logger.debug(`📊 RESULTADO: ${passed} OK, ${failed} FAIL, ${warnings} WARN`);
    logger.debug('═'.repeat(50));

    if (failed > 0) {
      logger.debug('\n❌ Problemas detectados:');
      this.checks.filter(c => c.status === 'fail').forEach(c => {
        logger.debug(`   - ${c.name}`);
      });
    }

    if (warnings > 0) {
      logger.debug('\n⚠️ Advertencias:');
      this.checks.filter(c => c.status === 'warn').forEach(c => {
        logger.debug(`   - ${c.name}`);
      });
    }

    const score = Math.round((passed / (passed + failed)) * 100);
    logger.debug(`\n🎯 Score del sistema: ${score}%`);

    return {
      passed,
      failed,
      warnings,
      score,
      checks: this.checks
    };
  }

  check(name, condition, warnIfFalse = false) {
    const status = condition ? 'pass' : (warnIfFalse === 'warn' ? 'warn' : 'fail');
    const icon = status === 'pass' ? '✅' : (status === 'warn' ? '⚠️' : '❌');
    logger.debug(`${icon} ${name}`);
    this.checks.push({ name, status, type: 'check' });
  }

  info(name, value) {
    logger.debug(`ℹ️ ${name}: ${value}`);
    this.checks.push({ name, value, status: 'info', type: 'info' });
  }

  /**
   * Verificar configuración de producción
   */
  checkProductionReadiness() {
    logger.debug('\n🚀 Verificando preparación para producción...\n');

    const issues = [];

    // Critical checks
    if (!window.STRIPE_PUBLISHABLE_KEY ||
        window.STRIPE_PUBLISHABLE_KEY.includes('YOUR_KEY')) {
      issues.push('❌ CRÍTICO: Stripe publishable key no configurada');
    }

    if (!window.authHelper?.initialized) {
      issues.push('❌ CRÍTICO: Sistema de auth no inicializado');
    }

    // Check if using test Supabase
    const supabaseUrl = window.supabaseConfig?.url || '';
    if (supabaseUrl.includes('localhost')) {
      issues.push('⚠️ Usando Supabase local');
    }

    // Check RLS (can't verify from frontend, just remind)
    issues.push('⚠️ RECORDATORIO: Ejecutar migración 004_fix_ai_tables_rls.sql');
    issues.push('⚠️ RECORDATORIO: Configurar Google OAuth en Supabase Dashboard');

    if (issues.length > 0) {
      logger.debug('Problemas encontrados:');
      issues.forEach(i => logger.debug(`   ${i}`));
    } else {
      logger.debug('✅ Sistema listo para producción');
    }

    return issues;
  }
}

// Crear instancia global
window.systemValidator = new SystemValidator();

logger.debug('✅ SystemValidator loaded. Use window.systemValidator.runQuickCheck()');
