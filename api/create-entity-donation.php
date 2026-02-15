<?php
/**
 * CREATE ENTITY DONATION
 * Endpoint para crear donaciones a entidades del mapa de transición
 *
 * Métodos de pago:
 * - Stripe: Redirige a checkout
 * - PayPal: Crea orden PayPal
 * - BTC: Devuelve dirección para pago manual
 *
 * @version 1.0.0
 * @created 2025-01-15
 */

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Token');
header('Content-Type: application/json; charset=utf-8');

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}

$SUPABASE_URL = defined('SUPABASE_URL') ? SUPABASE_URL : (getenv('SUPABASE_URL') ?: '');
$SUPABASE_SERVICE_KEY = defined('SUPABASE_SERVICE_KEY') ? SUPABASE_SERVICE_KEY :
                        (defined('SUPABASE_ANON_KEY') ? SUPABASE_ANON_KEY : (getenv('SUPABASE_SERVICE_KEY') ?: ''));

// Stripe (opcional - si está configurado)
$STRIPE_SECRET_KEY = defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : (getenv('STRIPE_SECRET_KEY') ?: '');

// PayPal (opcional - si está configurado)
$PAYPAL_CLIENT_ID = defined('PAYPAL_CLIENT_ID') ? PAYPAL_CLIENT_ID : (getenv('PAYPAL_CLIENT_ID') ?: '');
$PAYPAL_SECRET = defined('PAYPAL_SECRET') ? PAYPAL_SECRET : (getenv('PAYPAL_SECRET') ?: '');

// Dirección BTC de escrow (para entidades no verificadas)
$ESCROW_BTC_ADDRESS = defined('ESCROW_BTC_ADDRESS') ? ESCROW_BTC_ADDRESS :
                      (getenv('ESCROW_BTC_ADDRESS') ?: 'bc1qjnva46wy92ldhsv4w0j26jmu8c5wm5cxvgdfd7');

// Precio BTC fallback
$BTC_PRICE_EUR = 95000;

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Obtener precio actual de BTC
 */
function getBtcPrice() {
    global $BTC_PRICE_EUR;

    $ch = curl_init('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    return $data['bitcoin']['eur'] ?? $BTC_PRICE_EUR;
}

/**
 * Obtener información de la entidad
 */
function getEntity($entityId, $supabaseUrl, $supabaseKey) {
    $ch = curl_init("{$supabaseUrl}/rest/v1/transition_entities?id=eq.{$entityId}&select=id,name,category,is_verified,btc_address,user_id");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $entities = json_decode($response, true);
    return (is_array($entities) && !empty($entities)) ? $entities[0] : null;
}

/**
 * Crear registro de donación en la base de datos
 */
function createDonationRecord($data, $supabaseUrl, $supabaseKey) {
    $ch = curl_init("{$supabaseUrl}/rest/v1/entity_donations");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}",
            "Content-Type: application/json",
            "Prefer: return=representation"
        ],
        CURLOPT_POSTFIELDS => json_encode($data)
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        $result = json_decode($response, true);
        return is_array($result) && !empty($result) ? $result[0] : null;
    }

    return null;
}

/**
 * Crear checkout de Stripe
 */
function createStripeCheckout($donation, $entity, $stripeKey, $returnUrl) {
    if (empty($stripeKey)) {
        return null;
    }

    $ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer {$stripeKey}",
            "Content-Type: application/x-www-form-urlencoded"
        ],
        CURLOPT_POSTFIELDS => http_build_query([
            'mode' => 'payment',
            'success_url' => $returnUrl . '?donation_success=true&id=' . $donation['id'],
            'cancel_url' => $returnUrl . '?donation_cancelled=true',
            'line_items[0][price_data][currency]' => 'eur',
            'line_items[0][price_data][unit_amount]' => intval($donation['amount'] * 100),
            'line_items[0][price_data][product_data][name]' => 'Donación a ' . ($entity['name'] ?? 'Proyecto'),
            'line_items[0][quantity]' => 1,
            'metadata[donation_id]' => $donation['id'],
            'metadata[entity_id]' => $donation['entity_id']
        ])
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    return $data['url'] ?? null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROCESAMIENTO
// ═══════════════════════════════════════════════════════════════════════════════

// Obtener datos de la petición
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

// Validar campos requeridos
$entityId = $data['entityId'] ?? null;
$amount = floatval($data['amount'] ?? 0);
$currency = $data['currency'] ?? 'EUR';
$paymentMethod = $data['paymentMethod'] ?? 'stripe';
$donorId = $data['donorId'] ?? null;
$donorName = $data['donorName'] ?? 'Anónimo';
$donorEmail = $data['donorEmail'] ?? null;
$donorMessage = $data['donorMessage'] ?? null;

if (!$entityId) {
    http_response_code(400);
    echo json_encode(['error' => 'entityId is required']);
    exit;
}

if ($amount <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid amount']);
    exit;
}

// Obtener información de la entidad
$entity = null;
if (!empty($SUPABASE_URL)) {
    $entity = getEntity($entityId, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
}

// Si no hay base de datos configurada, crear respuesta mock
if (!$entity) {
    $entity = [
        'id' => $entityId,
        'name' => 'Proyecto Demo',
        'category' => 'proyecto',
        'is_verified' => false,
        'btc_address' => null
    ];
}

// Determinar modo de donación
$isP2P = ($entity['is_verified'] && !empty($entity['btc_address']) && $paymentMethod === 'btc');
$btcAddress = $isP2P ? $entity['btc_address'] : $ESCROW_BTC_ADDRESS;

// Generar ID de donación
$donationId = 'don_' . bin2hex(random_bytes(12));

// Calcular monto BTC si es necesario
$btcAmount = null;
if ($paymentMethod === 'btc') {
    $btcPrice = getBtcPrice();
    $btcAmount = round($amount / $btcPrice, 8);
}

// Preparar datos de donación
$donationData = [
    'id' => $donationId,
    'entity_id' => $entityId,
    'amount' => $amount,
    'currency' => $currency,
    'payment_method' => $paymentMethod,
    'donor_id' => $donorId,
    'donor_name' => $donorName,
    'donor_email' => $donorEmail,
    'donor_message' => $donorMessage,
    'btc_amount' => $btcAmount,
    'btc_address' => $btcAddress,
    'is_p2p' => $isP2P,
    'status' => 'pending'
];

// Guardar en base de datos si está disponible
$savedDonation = null;
if (!empty($SUPABASE_URL)) {
    $savedDonation = createDonationRecord($donationData, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
}

// Respuesta según método de pago
$response = [
    'success' => true,
    'donationId' => $donationId,
    'amount' => $amount,
    'currency' => $currency,
    'paymentMethod' => $paymentMethod
];

switch ($paymentMethod) {
    case 'stripe':
        // Crear checkout de Stripe
        $returnUrl = $data['returnUrl'] ?? 'https://gailu.net/transition-map.html';
        $checkoutUrl = createStripeCheckout($donationData, $entity, $STRIPE_SECRET_KEY, $returnUrl);

        if ($checkoutUrl) {
            $response['checkoutUrl'] = $checkoutUrl;
        } else {
            // Si no hay Stripe configurado, devolver error amigable
            $response['checkoutUrl'] = null;
            $response['message'] = 'Stripe no configurado. Usa Bitcoin para donar.';
        }
        break;

    case 'paypal':
        // Para PayPal, devolver URL de demo por ahora
        $response['paypalUrl'] = null;
        $response['message'] = 'PayPal próximamente. Usa Bitcoin para donar ahora.';
        break;

    case 'btc':
        // Devolver info para pago BTC
        $response['btcAmount'] = $btcAmount;
        $response['btcAddress'] = $btcAddress;
        $response['isP2P'] = $isP2P;
        $response['btcPrice'] = getBtcPrice();
        break;
}

echo json_encode($response);
