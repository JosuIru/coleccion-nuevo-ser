/**
// 🔧 FIX v2.9.198: Migrated console.log to logger
 * Supabase Configuration
 * Configuración centralizada para Supabase
 *
 * 🔧 FIX v2.9.197: Security - moved API keys to env config
 *
 * Priority order for configuration:
 * 1. window.env (from env.js - production)
 * 2. window.__CONFIG__ (injected at build time)
 * 3. No fallback - fail with clear error message
 *
 * IMPORTANTE: En producción, crea www/js/core/env.js con tus credenciales reales.
 * Ver env.example.js para el formato correcto.
 */

// Get environment variables if available
const env = window.env || window.__CONFIG__ || {};

// Check if we're likely in production but missing env.js
const isLikelyProduction = (
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1' &&
  !window.location.hostname.includes('192.168.')
);

// Warn if missing configuration in production
if ((!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) && isLikelyProduction) {
  logger.error(
    '❌ SUPABASE CONFIG: Credenciales no configuradas en producción.\n' +
    'CRÍTICO: La aplicación no funcionará sin credenciales válidas.\n\n' +
    'Configuración requerida:\n' +
    '1. Crea www/js/core/env.js con tus credenciales reales\n' +
    '2. O inyecta via window.__CONFIG__\n' +
    'Ver env.example.js para el formato correcto.'
  );
}

const supabaseConfig = {
    // 🔧 FIX v2.9.197: Security - no hardcoded keys, must come from env
    url: env.SUPABASE_URL || null,
    anonKey: env.SUPABASE_ANON_KEY || null,

    // Google reCAPTCHA Site Key (public key)
    recaptchaSiteKey: env.RECAPTCHA_SITE_KEY || '',

    // Stripe publishable key (public)
    stripePublishableKey: env.STRIPE_PUBLISHABLE_KEY || '',

    // Configuración de autenticación
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storageKey: 'nuevosser-auth',
    },

    // Configuración de real-time
    realtime: {
        enabled: true,
        channel: 'nuevosser-sync',
    },

    // Nombres de tablas en Supabase
    tables: {
        profiles: 'profiles',
        readingProgress: 'reading_progress',
        notes: 'notes',
        achievements: 'achievements',
        reflections: 'reflections',
        bookmarks: 'bookmarks',
        settings: 'user_settings',
        actionPlans: 'action_plans',
        koans: 'koan_history',
        aiSignatures: 'ai_signatures', // Libro de Firmas Cósmico - Portal SETI-IA
        chapterComments: 'chapter_comments', // 🔧 v2.9.327: Comentarios por capítulo
        readingCircles: 'reading_circles', // 🔧 v2.9.328: Círculos de lectura compartida
    }
};

// Environment detection
supabaseConfig.isProduction = env.NODE_ENV === 'production';
supabaseConfig.debugMode = env.DEBUG_MODE === true || env.DEBUG_MODE === 'true';

// Log configuration source (only in debug mode)
if (supabaseConfig.debugMode) {
    logger.debug('Supabase Config:', {
        source: env.SUPABASE_URL ? 'env.js' : 'fallback',
        isProduction: supabaseConfig.isProduction,
        url: supabaseConfig.url.substring(0, 30) + '...'
    });
}

// Export configuration
window.supabaseConfig = supabaseConfig;
