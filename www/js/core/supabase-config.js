/**
 * Supabase Configuration
 * Configuración centralizada para Supabase
 *
 * Priority order for configuration:
 * 1. window.env (from env.js - production)
 * 2. Fallback values (development defaults)
 */

// Get environment variables if available
const env = window.env || {};

// Development fallback values
const DEV_DEFAULTS = {
    url: 'https://flxrilsxghiqfsfifxch.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZseHJpbHN4Z2hpcWZzZmlmeGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODUzMDQsImV4cCI6MjA4MDI2MTMwNH0.Q-loU9hZybMoFr4SrIvnCyhZPOmsYdRAqnJnyIvUdV4',
    recaptchaSiteKey: ''
};

const supabaseConfig = {
    // Use env variables if available, otherwise fallback to dev defaults
    url: env.SUPABASE_URL || DEV_DEFAULTS.url,
    anonKey: env.SUPABASE_ANON_KEY || DEV_DEFAULTS.anonKey,

    // Google reCAPTCHA Site Key (public key)
    recaptchaSiteKey: env.RECAPTCHA_SITE_KEY || DEV_DEFAULTS.recaptchaSiteKey,

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
    }
};

// Environment detection
supabaseConfig.isProduction = env.NODE_ENV === 'production';
supabaseConfig.debugMode = env.DEBUG_MODE === true || env.DEBUG_MODE === 'true';

// Log configuration source (only in debug mode)
if (supabaseConfig.debugMode) {
    console.log('Supabase Config:', {
        source: env.SUPABASE_URL ? 'env.js' : 'fallback',
        isProduction: supabaseConfig.isProduction,
        url: supabaseConfig.url.substring(0, 30) + '...'
    });
}

// Export configuration
window.supabaseConfig = supabaseConfig;
