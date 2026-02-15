<?php
/**
 * PAYPAL WEBHOOK - Procesa eventos de pago de PayPal
 *
 * Eventos soportados:
 * - CHECKOUT.ORDER.APPROVED: Orden aprobada
 * - PAYMENT.CAPTURE.COMPLETED: Pago capturado
 * - BILLING.SUBSCRIPTION.CREATED: Suscripción creada
 * - BILLING.SUBSCRIPTION.ACTIVATED: Suscripción activada
 * - BILLING.SUBSCRIPTION.CANCELLED: Suscripción cancelada
 * - PAYMENT.SALE.COMPLETED: Venta completada
 *
 * @version 1.0.0
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/logger-service.php';

// Solo aceptar POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method not allowed');
}

// Obtener payload
$payload = file_get_contents('php://input');
$headers = getallheaders();

// Verificar que existen las constantes necesarias
if (!defined('PAYPAL_WEBHOOK_ID') || !defined('PAYPAL_CLIENT_ID') || !defined('PAYPAL_CLIENT_SECRET')) {
    logWebhookError('paypal', 'PayPal credentials not configured');
    http_response_code(500);
    exit('PayPal not configured');
}

// Verificar firma del webhook
try {
    $isValid = verifyPayPalWebhook($payload, $headers);
    if (!$isValid) {
        throw new Exception('Invalid webhook signature');
    }
} catch (Exception $e) {
    logWebhookError('paypal', 'Verification failed: ' . $e->getMessage());
    http_response_code(400);
    exit('Invalid signature');
}

// Procesar evento
$event = json_decode($payload, true);

try {
    $result = processPayPalEvent($event);

    logWebhookSuccess('paypal', $event['event_type'], $result);

    http_response_code(200);
    echo json_encode(['status' => 'success', 'event' => $event['event_type']]);

} catch (Exception $e) {
    logWebhookError('paypal', 'Error processing event: ' . $e->getMessage(), $event);
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verifica el webhook de PayPal
 */
function verifyPayPalWebhook($payload, $headers) {
    $webhookId = PAYPAL_WEBHOOK_ID;

    // Obtener headers necesarios
    $transmissionId = $headers['Paypal-Transmission-Id'] ?? $headers['paypal-transmission-id'] ?? '';
    $transmissionTime = $headers['Paypal-Transmission-Time'] ?? $headers['paypal-transmission-time'] ?? '';
    $certUrl = $headers['Paypal-Cert-Url'] ?? $headers['paypal-cert-url'] ?? '';
    $authAlgo = $headers['Paypal-Auth-Algo'] ?? $headers['paypal-auth-algo'] ?? '';
    $transmissionSig = $headers['Paypal-Transmission-Sig'] ?? $headers['paypal-transmission-sig'] ?? '';

    if (!$transmissionId || !$transmissionTime || !$transmissionSig) {
        // En desarrollo, permitir sin verificación si no hay headers
        if (PAYPAL_MODE === 'sandbox') {
            return true;
        }
        throw new Exception('Missing required headers');
    }

    // Obtener access token
    $accessToken = getPayPalAccessToken();

    // Verificar con PayPal API
    $verifyUrl = PAYPAL_MODE === 'live'
        ? 'https://api.paypal.com/v1/notifications/verify-webhook-signature'
        : 'https://api.sandbox.paypal.com/v1/notifications/verify-webhook-signature';

    $verifyData = [
        'auth_algo' => $authAlgo,
        'cert_url' => $certUrl,
        'transmission_id' => $transmissionId,
        'transmission_sig' => $transmissionSig,
        'transmission_time' => $transmissionTime,
        'webhook_id' => $webhookId,
        'webhook_event' => json_decode($payload, true)
    ];

    $ch = curl_init($verifyUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($verifyData),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $accessToken
        ]
    ]);

    $response = json_decode(curl_exec($ch), true);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        throw new Exception('PayPal verification request failed');
    }

    return ($response['verification_status'] ?? '') === 'SUCCESS';
}

/**
 * Obtiene access token de PayPal
 */
function getPayPalAccessToken() {
    $tokenUrl = PAYPAL_MODE === 'live'
        ? 'https://api.paypal.com/v1/oauth2/token'
        : 'https://api.sandbox.paypal.com/v1/oauth2/token';

    $ch = curl_init($tokenUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
        CURLOPT_USERPWD => PAYPAL_CLIENT_ID . ':' . PAYPAL_CLIENT_SECRET,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/x-www-form-urlencoded'
        ]
    ]);

    $response = json_decode(curl_exec($ch), true);
    curl_close($ch);

    return $response['access_token'] ?? null;
}

/**
 * Procesa un evento de PayPal
 */
function processPayPalEvent($event) {
    $type = $event['event_type'];
    $resource = $event['resource'];

    switch ($type) {
        case 'CHECKOUT.ORDER.APPROVED':
            return handleOrderApproved($resource);

        case 'PAYMENT.CAPTURE.COMPLETED':
            return handlePaymentCaptured($resource);

        case 'BILLING.SUBSCRIPTION.CREATED':
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
            return handleSubscriptionActivated($resource);

        case 'BILLING.SUBSCRIPTION.CANCELLED':
        case 'BILLING.SUBSCRIPTION.SUSPENDED':
            return handleSubscriptionCancelled($resource);

        case 'PAYMENT.SALE.COMPLETED':
            return handleSaleCompleted($resource);

        default:
            return ['action' => 'ignored', 'reason' => 'Unhandled event type'];
    }
}

/**
 * Procesa orden aprobada
 */
function handleOrderApproved($order) {
    // La orden está aprobada pero aún no capturada
    // Generalmente solo logueamos y esperamos el capture
    return [
        'action' => 'order_approved',
        'order_id' => $order['id']
    ];
}

/**
 * Procesa pago capturado (compra de tokens)
 */
function handlePaymentCaptured($capture) {
    $customId = $capture['custom_id'] ?? '';
    $amount = $capture['amount']['value'] ?? 0;
    $currency = $capture['amount']['currency_code'] ?? 'EUR';

    // Parsear custom_id que contiene user_id y tokens
    // Formato esperado: "user_id:tokens_amount:package_id"
    $parts = explode(':', $customId);
    $userId = $parts[0] ?? null;
    $tokensAmount = intval($parts[1] ?? 0);
    $packageId = $parts[2] ?? null;

    if (!$userId || !$tokensAmount) {
        return ['action' => 'skipped', 'reason' => 'Missing user_id or tokens in custom_id'];
    }

    // Añadir tokens al usuario
    $newBalance = addTokensToUser($userId, $tokensAmount, [
        'payment_method' => 'paypal',
        'payment_id' => $capture['id'],
        'package_id' => $packageId,
        'amount_paid' => $amount,
        'currency' => $currency
    ]);

    // Registrar evento
    logSubscriptionEvent($userId, 'token_purchase', [
        'tokens_amount' => $tokensAmount,
        'payment_id' => $capture['id'],
        'amount' => $amount,
        'currency' => $currency,
        'provider' => 'paypal'
    ]);

    return [
        'action' => 'tokens_added',
        'user_id' => $userId,
        'tokens' => $tokensAmount,
        'new_balance' => $newBalance
    ];
}

/**
 * Procesa suscripción activada
 */
function handleSubscriptionActivated($subscription) {
    $customId = $subscription['custom_id'] ?? '';
    $planId = $subscription['plan_id'] ?? '';

    // Parsear custom_id para obtener user_id
    $userId = explode(':', $customId)[0] ?? null;

    if (!$userId) {
        return ['action' => 'skipped', 'reason' => 'Missing user_id'];
    }

    // Determinar tier basado en plan_id
    $tier = getTierFromPayPalPlan($planId);

    // Actualizar perfil del usuario
    updateUserSubscription($userId, [
        'subscription_tier' => $tier,
        'subscription_status' => 'active',
        'paypal_subscription_id' => $subscription['id']
    ]);

    // Registrar evento
    logSubscriptionEvent($userId, 'subscription_created', [
        'tier' => $tier,
        'subscription_id' => $subscription['id'],
        'provider' => 'paypal'
    ]);

    return [
        'action' => 'subscription_activated',
        'user_id' => $userId,
        'tier' => $tier
    ];
}

/**
 * Procesa cancelación de suscripción
 */
function handleSubscriptionCancelled($subscription) {
    $subscriptionId = $subscription['id'];

    // Buscar usuario por subscription_id
    $userId = getUserIdByPayPalSubscription($subscriptionId);

    if (!$userId) {
        return ['action' => 'skipped', 'reason' => 'User not found'];
    }

    // Degradar a free
    updateUserSubscription($userId, [
        'subscription_tier' => 'free',
        'subscription_status' => 'cancelled'
    ]);

    logSubscriptionEvent($userId, 'subscription_cancelled', [
        'subscription_id' => $subscriptionId,
        'provider' => 'paypal'
    ]);

    return [
        'action' => 'subscription_cancelled',
        'user_id' => $userId
    ];
}

/**
 * Procesa venta completada (pago recurrente)
 */
function handleSaleCompleted($sale) {
    $billingAgreementId = $sale['billing_agreement_id'] ?? null;

    if (!$billingAgreementId) {
        return ['action' => 'skipped', 'reason' => 'Not a subscription payment'];
    }

    $userId = getUserIdByPayPalSubscription($billingAgreementId);

    if (!$userId) {
        return ['action' => 'skipped', 'reason' => 'User not found'];
    }

    // Añadir tokens mensuales
    $monthlyTokens = getMonthlyTokensForUser($userId);
    if ($monthlyTokens > 0) {
        addTokensToUser($userId, $monthlyTokens, [
            'payment_method' => 'paypal_recurring',
            'payment_id' => $sale['id'],
            'type' => 'monthly_bonus'
        ]);
    }

    logSubscriptionEvent($userId, 'payment_succeeded', [
        'sale_id' => $sale['id'],
        'amount' => $sale['amount']['total'] ?? 0,
        'provider' => 'paypal'
    ]);

    return [
        'action' => 'recurring_payment_processed',
        'user_id' => $userId,
        'tokens_added' => $monthlyTokens
    ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS DE BASE DE DATOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Añade tokens a un usuario
 */
function addTokensToUser($userId, $amount, $metadata = []) {
    $supabaseUrl = SUPABASE_URL;
    $serviceKey = SUPABASE_SERVICE_KEY;

    // Obtener balance actual
    $ch = curl_init("$supabaseUrl/rest/v1/profiles?id=eq.$userId&select=token_balance");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $serviceKey,
            'Authorization: Bearer ' . $serviceKey
        ]
    ]);
    $response = json_decode(curl_exec($ch), true);
    curl_close($ch);

    $currentBalance = $response[0]['token_balance'] ?? 0;
    $newBalance = $currentBalance + $amount;

    // Actualizar balance
    $ch = curl_init("$supabaseUrl/rest/v1/profiles?id=eq.$userId");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => 'PATCH',
        CURLOPT_POSTFIELDS => json_encode([
            'token_balance' => $newBalance,
            'tokens_purchased_total' => $currentBalance + $amount
        ]),
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $serviceKey,
            'Authorization: Bearer ' . $serviceKey,
            'Content-Type: application/json',
            'Prefer: return=minimal'
        ]
    ]);
    curl_exec($ch);
    curl_close($ch);

    // Registrar transacción
    $ch = curl_init("$supabaseUrl/rest/v1/transactions");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([
            'user_id' => $userId,
            'type' => 'token_purchase',
            'tokens_amount' => $amount,
            'balance_before' => $currentBalance,
            'balance_after' => $newBalance,
            'payment_method' => $metadata['payment_method'] ?? 'paypal',
            'payment_id' => $metadata['payment_id'] ?? null,
            'metadata' => json_encode($metadata)
        ]),
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $serviceKey,
            'Authorization: Bearer ' . $serviceKey,
            'Content-Type: application/json'
        ]
    ]);
    curl_exec($ch);
    curl_close($ch);

    return $newBalance;
}

/**
 * Obtiene user_id por PayPal subscription_id
 */
function getUserIdByPayPalSubscription($subscriptionId) {
    $supabaseUrl = SUPABASE_URL;
    $serviceKey = SUPABASE_SERVICE_KEY;

    $ch = curl_init("$supabaseUrl/rest/v1/profiles?paypal_subscription_id=eq.$subscriptionId&select=id");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $serviceKey,
            'Authorization: Bearer ' . $serviceKey
        ]
    ]);
    $response = json_decode(curl_exec($ch), true);
    curl_close($ch);

    return $response[0]['id'] ?? null;
}

/**
 * Actualiza suscripción del usuario
 */
function updateUserSubscription($userId, $data) {
    $supabaseUrl = SUPABASE_URL;
    $serviceKey = SUPABASE_SERVICE_KEY;

    $ch = curl_init("$supabaseUrl/rest/v1/profiles?id=eq.$userId");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => 'PATCH',
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $serviceKey,
            'Authorization: Bearer ' . $serviceKey,
            'Content-Type: application/json',
            'Prefer: return=minimal'
        ]
    ]);
    curl_exec($ch);
    curl_close($ch);
}

/**
 * Registra evento de suscripción
 */
function logSubscriptionEvent($userId, $eventType, $metadata = []) {
    $supabaseUrl = SUPABASE_URL;
    $serviceKey = SUPABASE_SERVICE_KEY;

    $ch = curl_init("$supabaseUrl/rest/v1/subscription_events");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode([
            'user_id' => $userId,
            'event_type' => $eventType,
            'payment_provider' => 'paypal',
            'metadata' => $metadata
        ]),
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $serviceKey,
            'Authorization: Bearer ' . $serviceKey,
            'Content-Type: application/json'
        ]
    ]);
    curl_exec($ch);
    curl_close($ch);
}

/**
 * Obtiene tier desde plan_id de PayPal
 */
function getTierFromPayPalPlan($planId) {
    // Mapeo de plan_ids a tiers (configurar según tu PayPal)
    $mapping = [
        'P-PREMIUM-MONTHLY' => 'premium',
        'P-PRO-MONTHLY' => 'pro'
    ];

    return $mapping[$planId] ?? 'free';
}

/**
 * Obtiene tokens mensuales según el plan del usuario
 */
function getMonthlyTokensForUser($userId) {
    $supabaseUrl = SUPABASE_URL;
    $serviceKey = SUPABASE_SERVICE_KEY;

    $ch = curl_init("$supabaseUrl/rest/v1/profiles?id=eq.$userId&select=subscription_tier");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $serviceKey,
            'Authorization: Bearer ' . $serviceKey
        ]
    ]);
    $response = json_decode(curl_exec($ch), true);
    curl_close($ch);

    $tier = $response[0]['subscription_tier'] ?? 'free';

    $monthlyTokens = [
        'free' => 5000,
        'premium' => 100000,
        'pro' => 300000
    ];

    return $monthlyTokens[$tier] ?? 5000;
}

/**
 * Log de error de webhook
 */
function logWebhookError($provider, $message, $context = []) {
    error_log("[WEBHOOK_ERROR][$provider] $message " . json_encode($context));

    try {
        $supabaseUrl = SUPABASE_URL;
        $serviceKey = SUPABASE_SERVICE_KEY;

        $ch = curl_init("$supabaseUrl/rest/v1/api_errors_log");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode([
                'error_type' => 'webhook_error',
                'source' => "webhook_$provider",
                'message' => $message,
                'context' => $context
            ]),
            CURLOPT_HTTPHEADER => [
                'apikey: ' . $serviceKey,
                'Authorization: Bearer ' . $serviceKey,
                'Content-Type: application/json'
            ]
        ]);
        curl_exec($ch);
        curl_close($ch);
    } catch (Exception $e) {
        // Ignorar errores de logging
    }
}

/**
 * Log de éxito de webhook
 */
function logWebhookSuccess($provider, $eventType, $result) {
    error_log("[WEBHOOK_SUCCESS][$provider] $eventType: " . json_encode($result));
}
