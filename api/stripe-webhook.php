<?php
/**
 * STRIPE WEBHOOK - Procesa eventos de pago de Stripe
 *
 * Eventos soportados:
 * - checkout.session.completed: Compra de tokens exitosa
 * - customer.subscription.created: Nueva suscripción
 * - customer.subscription.updated: Cambio de plan
 * - customer.subscription.deleted: Cancelación
 * - invoice.payment_succeeded: Pago recurrente exitoso
 * - invoice.payment_failed: Pago fallido
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

// Obtener payload y signature
$payload = file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

// Verificar que existen las constantes necesarias
if (!defined('STRIPE_WEBHOOK_SECRET')) {
    logWebhookError('stripe', 'STRIPE_WEBHOOK_SECRET no configurado');
    http_response_code(500);
    exit('Webhook secret not configured');
}

// Verificar firma del webhook
try {
    $event = verifyStripeSignature($payload, $sigHeader, STRIPE_WEBHOOK_SECRET);
} catch (Exception $e) {
    logWebhookError('stripe', 'Firma inválida: ' . $e->getMessage());
    http_response_code(400);
    exit('Invalid signature');
}

// Procesar evento
try {
    $result = processStripeEvent($event);

    logWebhookSuccess('stripe', $event['type'], $result);

    http_response_code(200);
    echo json_encode(['status' => 'success', 'event' => $event['type']]);

} catch (Exception $e) {
    logWebhookError('stripe', 'Error procesando evento: ' . $e->getMessage(), $event);
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verifica la firma del webhook de Stripe
 */
function verifyStripeSignature($payload, $sigHeader, $secret) {
    $elements = explode(',', $sigHeader);
    $timestamp = null;
    $signatures = [];

    foreach ($elements as $element) {
        $parts = explode('=', $element, 2);
        if (count($parts) === 2) {
            if ($parts[0] === 't') {
                $timestamp = $parts[1];
            } elseif ($parts[0] === 'v1') {
                $signatures[] = $parts[1];
            }
        }
    }

    if (!$timestamp || empty($signatures)) {
        throw new Exception('Invalid signature header format');
    }

    // Verificar que no es muy antiguo (5 minutos)
    if (abs(time() - $timestamp) > 300) {
        throw new Exception('Timestamp too old');
    }

    // Calcular firma esperada
    $signedPayload = $timestamp . '.' . $payload;
    $expectedSignature = hash_hmac('sha256', $signedPayload, $secret);

    // Comparar firmas
    $valid = false;
    foreach ($signatures as $sig) {
        if (hash_equals($expectedSignature, $sig)) {
            $valid = true;
            break;
        }
    }

    if (!$valid) {
        throw new Exception('Signature verification failed');
    }

    return json_decode($payload, true);
}

/**
 * Procesa un evento de Stripe
 */
function processStripeEvent($event) {
    $type = $event['type'];
    $data = $event['data']['object'];

    switch ($type) {
        case 'checkout.session.completed':
            return handleCheckoutCompleted($data);

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
            return handleSubscriptionChange($data, $type);

        case 'customer.subscription.deleted':
            return handleSubscriptionCancelled($data);

        case 'invoice.payment_succeeded':
            return handlePaymentSucceeded($data);

        case 'invoice.payment_failed':
            return handlePaymentFailed($data);

        default:
            return ['action' => 'ignored', 'reason' => 'Unhandled event type'];
    }
}

/**
 * Procesa checkout completado (compra de tokens)
 */
function handleCheckoutCompleted($session) {
    $metadata = $session['metadata'] ?? [];
    $userId = $metadata['user_id'] ?? null;
    $tokensAmount = $metadata['tokens_amount'] ?? 0;
    $packageId = $metadata['package_id'] ?? null;

    if (!$userId || !$tokensAmount) {
        return ['action' => 'skipped', 'reason' => 'Missing user_id or tokens_amount'];
    }

    // Añadir tokens al usuario
    $result = addTokensToUser($userId, $tokensAmount, [
        'payment_method' => 'stripe',
        'payment_id' => $session['id'],
        'package_id' => $packageId,
        'amount_paid' => $session['amount_total'] / 100,
        'currency' => $session['currency']
    ]);

    // Registrar evento de suscripción
    logSubscriptionEvent($userId, 'token_purchase', [
        'tokens_amount' => $tokensAmount,
        'payment_id' => $session['id'],
        'amount' => $session['amount_total'] / 100,
        'currency' => $session['currency']
    ]);

    return [
        'action' => 'tokens_added',
        'user_id' => $userId,
        'tokens' => $tokensAmount
    ];
}

/**
 * Procesa cambio de suscripción
 */
function handleSubscriptionChange($subscription, $eventType) {
    $customerId = $subscription['customer'];
    $status = $subscription['status'];
    $priceId = $subscription['items']['data'][0]['price']['id'] ?? null;

    // Obtener usuario por customer_id de Stripe
    $userId = getUserIdByStripeCustomer($customerId);

    if (!$userId) {
        return ['action' => 'skipped', 'reason' => 'User not found for customer'];
    }

    // Determinar tier basado en price_id
    $tier = getTierFromPriceId($priceId);

    // Actualizar perfil del usuario
    updateUserSubscription($userId, [
        'subscription_tier' => $tier,
        'subscription_status' => $status,
        'stripe_customer_id' => $customerId,
        'stripe_subscription_id' => $subscription['id']
    ]);

    // Registrar evento
    logSubscriptionEvent($userId, $eventType === 'customer.subscription.created' ? 'subscription_created' : 'subscription_updated', [
        'tier' => $tier,
        'status' => $status,
        'subscription_id' => $subscription['id']
    ]);

    return [
        'action' => 'subscription_updated',
        'user_id' => $userId,
        'tier' => $tier,
        'status' => $status
    ];
}

/**
 * Procesa cancelación de suscripción
 */
function handleSubscriptionCancelled($subscription) {
    $customerId = $subscription['customer'];
    $userId = getUserIdByStripeCustomer($customerId);

    if (!$userId) {
        return ['action' => 'skipped', 'reason' => 'User not found'];
    }

    // Degradar a free
    updateUserSubscription($userId, [
        'subscription_tier' => 'free',
        'subscription_status' => 'cancelled'
    ]);

    logSubscriptionEvent($userId, 'subscription_cancelled', [
        'subscription_id' => $subscription['id']
    ]);

    return [
        'action' => 'subscription_cancelled',
        'user_id' => $userId
    ];
}

/**
 * Procesa pago recurrente exitoso
 */
function handlePaymentSucceeded($invoice) {
    $customerId = $invoice['customer'];
    $userId = getUserIdByStripeCustomer($customerId);

    if (!$userId) {
        return ['action' => 'skipped', 'reason' => 'User not found'];
    }

    // Añadir tokens mensuales según el plan
    $subscription = $invoice['subscription'] ?? null;
    if ($subscription) {
        $monthlyTokens = getMonthlyTokensForUser($userId);
        if ($monthlyTokens > 0) {
            addTokensToUser($userId, $monthlyTokens, [
                'payment_method' => 'stripe_recurring',
                'payment_id' => $invoice['id'],
                'type' => 'monthly_bonus'
            ]);
        }
    }

    logSubscriptionEvent($userId, 'payment_succeeded', [
        'invoice_id' => $invoice['id'],
        'amount' => $invoice['amount_paid'] / 100
    ]);

    return [
        'action' => 'payment_processed',
        'user_id' => $userId
    ];
}

/**
 * Procesa pago fallido
 */
function handlePaymentFailed($invoice) {
    $customerId = $invoice['customer'];
    $userId = getUserIdByStripeCustomer($customerId);

    if (!$userId) {
        return ['action' => 'skipped', 'reason' => 'User not found'];
    }

    logSubscriptionEvent($userId, 'payment_failed', [
        'invoice_id' => $invoice['id'],
        'attempt_count' => $invoice['attempt_count']
    ]);

    // TODO: Enviar notificación al usuario

    return [
        'action' => 'payment_failed_logged',
        'user_id' => $userId
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
            'payment_method' => $metadata['payment_method'] ?? 'stripe',
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
 * Obtiene user_id por Stripe customer_id
 */
function getUserIdByStripeCustomer($customerId) {
    $supabaseUrl = SUPABASE_URL;
    $serviceKey = SUPABASE_SERVICE_KEY;

    $ch = curl_init("$supabaseUrl/rest/v1/profiles?stripe_customer_id=eq.$customerId&select=id");
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
            'payment_provider' => 'stripe',
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
 * Obtiene tier desde price_id de Stripe
 */
function getTierFromPriceId($priceId) {
    // Mapeo de price_ids a tiers (configurar según tu Stripe)
    $mapping = [
        'price_premium_monthly' => 'premium',
        'price_pro_monthly' => 'pro'
    ];

    return $mapping[$priceId] ?? 'free';
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

    // Tokens mensuales por plan
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

    // También guardar en Supabase si es posible
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
