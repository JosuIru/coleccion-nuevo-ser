<?php
/**
 * CONFIGURACIÓN DEL PROXY AI
 *
 * INSTRUCCIONES:
 * 1. Copia este archivo a config.php
 * 2. Reemplaza los valores con tus credenciales reales
 * 3. NUNCA subas config.php al repositorio
 */

// ═══════════════════════════════════════════════════════════════════════════════
// API Keys de IA
// ═══════════════════════════════════════════════════════════════════════════════

// Claude - Para usuarios Premium (https://console.anthropic.com/settings/keys)
define('CLAUDE_API_KEY', 'tu_claude_api_key_aqui');

// Mistral - Para usuarios Free (https://console.mistral.ai/api-keys)
define('MISTRAL_API_KEY', 'tu_mistral_api_key_aqui');

// ═══════════════════════════════════════════════════════════════════════════════
// Supabase Configuration
// ═══════════════════════════════════════════════════════════════════════════════

define('SUPABASE_URL', 'https://tu-proyecto.supabase.co');
define('SUPABASE_ANON_KEY', 'tu_supabase_anon_key_aqui');
define('SUPABASE_SERVICE_KEY', 'tu_supabase_service_key_aqui'); // Opcional, más permisos

// ═══════════════════════════════════════════════════════════════════════════════
// Payment Configuration - Stripe
// ═══════════════════════════════════════════════════════════════════════════════

define('STRIPE_SECRET_KEY', 'sk_test_tu_stripe_secret_key');
define('STRIPE_WEBHOOK_SECRET', 'whsec_tu_stripe_webhook_secret');

// ═══════════════════════════════════════════════════════════════════════════════
// Payment Configuration - PayPal
// ═══════════════════════════════════════════════════════════════════════════════

define('PAYPAL_CLIENT_ID', 'tu_paypal_client_id');
define('PAYPAL_CLIENT_SECRET', 'tu_paypal_client_secret');
define('PAYPAL_WEBHOOK_ID', 'tu_paypal_webhook_id');
define('PAYPAL_MODE', 'sandbox'); // 'sandbox' o 'live'
