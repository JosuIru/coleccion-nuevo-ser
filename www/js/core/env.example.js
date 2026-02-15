/**
 * ENV.JS - Environment Configuration
 *
 * INSTRUCCIONES:
 * 1. Copia este archivo a env.js
 * 2. Reemplaza los valores con tus credenciales reales
 * 3. NUNCA subas env.js al repositorio (está en .gitignore)
 *
 * Para producción: despliega env.js con valores reales en tu servidor
 */

window.env = {
  // Supabase Configuration
  SUPABASE_URL: 'https://tu-proyecto.supabase.co',
  SUPABASE_ANON_KEY: 'tu_anon_key_aqui',

  // Google reCAPTCHA (optional)
  RECAPTCHA_SITE_KEY: '',

  // Stripe (optional, for payments)
  STRIPE_PUBLISHABLE_KEY: '',

  // Environment
  NODE_ENV: 'production',  // 'development' or 'production'
  DEBUG_MODE: false
};
