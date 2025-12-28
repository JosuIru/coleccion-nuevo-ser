/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * Environment Configuration Module
 * Centralized configuration loader for all environment variables
 *
 * @version 2.9.197
 * Priority order:
 * 1. window.__CONFIG__ (injected at build time or by server)
 * 2. window.env (from env.js file - legacy support)
 * 3. import.meta.env (Vite/bundler environment variables)
 * 4. null (no fallback - fail safely)
 *
 * 🔧 FIX v2.9.197: Security - moved API keys to env config
 */

// Helper to get environment variable with priority order
function getEnvVar(key, fallback = null) {
  // Priority 1: window.__CONFIG__ (production injection)
  if (window.__CONFIG__ && window.__CONFIG__[key]) {
    return window.__CONFIG__[key];
  }

  // Priority 2: window.env (legacy env.js file)
  if (window.env && window.env[key]) {
    return window.env[key];
  }

  // Priority 3: import.meta.env (bundler environment)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
    return import.meta.env[`VITE_${key}`];
  }

  // Priority 4: fallback value
  return fallback;
}

// Environment detection helpers
const isProduction = () => {
  const nodeEnv = getEnvVar('NODE_ENV');
  if (nodeEnv) return nodeEnv === 'production';

  // Detect based on hostname
  const hostname = window.location.hostname;
  return hostname !== 'localhost' &&
         hostname !== '127.0.0.1' &&
         !hostname.includes('192.168.') &&
         !hostname.includes('file://');
};

const isDevelopment = () => !isProduction();

// Export configuration object
export const config = {
  // Supabase Configuration
  supabase: {
    url: getEnvVar('SUPABASE_URL'),
    anonKey: getEnvVar('SUPABASE_ANON_KEY')
  },

  // Stripe Configuration (public keys only)
  stripe: {
    publishableKey: getEnvVar('STRIPE_PUBLISHABLE_KEY', '')
  },

  // Google reCAPTCHA
  recaptcha: {
    siteKey: getEnvVar('RECAPTCHA_SITE_KEY', '')
  },

  // Application Settings
  app: {
    environment: getEnvVar('NODE_ENV', isProduction() ? 'production' : 'development'),
    debugMode: getEnvVar('DEBUG_MODE', 'false') === 'true',
    url: getEnvVar('APP_URL', window.location.origin)
  }
};

// Validation - warn if critical config is missing
if (!config.supabase.url || !config.supabase.anonKey) {
  console.warn(
    '⚠️ CONFIGURATION ERROR: Supabase credentials not found!\n\n' +
    'Please configure environment variables. See setup instructions:\n' +
    '1. Copy www/js/core/env.example.js to www/js/core/env.js\n' +
    '2. Fill in your Supabase credentials\n' +
    '3. Or inject via window.__CONFIG__ in production\n\n' +
    'Some features will not work without proper configuration.'
  );
}

// Debug logging in development
if (config.app.debugMode && isDevelopment()) {
  logger.debug('🔧 Environment Configuration Loaded:', {
    environment: config.app.environment,
    supabaseConfigured: !!(config.supabase.url && config.supabase.anonKey),
    stripeConfigured: !!config.stripe.publishableKey,
    recaptchaConfigured: !!config.recaptcha.siteKey
  });
}

// Make available globally for legacy code
window.__APP_CONFIG__ = config;

export default config;
