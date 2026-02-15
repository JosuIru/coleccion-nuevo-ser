<?php
/**
 * CONFIRM ENTITY DONATION BTC
 * Endpoint para confirmar pagos BTC de donaciones a entidades
 *
 * @version 1.0.0
 * @created 2025-01-15
 */

function getAllowedOrigins() {
    $raw = getenv('APP_ALLOWED_ORIGINS') ?: '';
    $origins = array_filter(array_map('trim', explode(',', $raw)));
    if (empty($origins)) {
        $origins = [
            'https://gailu.net',
            'https://www.gailu.net',
            'http://localhost:5173',
            'http://localhost:8100'
        ];
    }
    return $origins;
}

function applyCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin) {
        $allowedOrigins = getAllowedOrigins();
        if (!in_array($origin, $allowedOrigins, true)) {
            http_response_code(403);
            echo json_encode(['error' => 'Origin not allowed']);
            exit;
        }
        header("Access-Control-Allow-Origin: $origin");
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

// Headers CORS
applyCorsHeaders();
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

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verificar transacción BTC en blockchain
 */
function verifyBtcTransaction($txId, $expectedAddress, $expectedAmount) {
    // Usar API de Blockstream para verificar
    $ch = curl_init("https://blockstream.info/api/tx/{$txId}");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        return ['success' => false, 'error' => 'Transaction not found'];
    }

    $tx = json_decode($response, true);

    if (!$tx) {
        return ['success' => false, 'error' => 'Invalid transaction data'];
    }

    // Verificar que la transacción tiene outputs
    $outputs = $tx['vout'] ?? [];
    $foundOutput = null;

    foreach ($outputs as $output) {
        $address = $output['scriptpubkey_address'] ?? null;
        $valueSats = $output['value'] ?? 0;

        if ($address === $expectedAddress) {
            $foundOutput = [
                'address' => $address,
                'amount' => $valueSats / 100000000, // Convertir satoshis a BTC
                'valueSats' => $valueSats
            ];
            break;
        }
    }

    if (!$foundOutput) {
        return [
            'success' => false,
            'error' => 'No output found for expected address'
        ];
    }

    // Verificar confirmaciones
    $confirmations = 0;
    if (isset($tx['status']['confirmed']) && $tx['status']['confirmed']) {
        $blockHeight = $tx['status']['block_height'];

        // Obtener altura actual del blockchain
        $ch = curl_init("https://blockstream.info/api/blocks/tip/height");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5
        ]);
        $currentHeight = intval(curl_exec($ch));
        curl_close($ch);

        if ($currentHeight > 0 && $blockHeight > 0) {
            $confirmations = $currentHeight - $blockHeight + 1;
        }
    }

    return [
        'success' => true,
        'txId' => $txId,
        'amount' => $foundOutput['amount'],
        'address' => $foundOutput['address'],
        'confirmations' => $confirmations,
        'confirmed' => $confirmations >= 1,
        'txUrl' => "https://blockstream.info/tx/{$txId}"
    ];
}

/**
 * Actualizar estado de donación
 */
function updateDonationStatus($donationId, $status, $txId, $supabaseUrl, $supabaseKey) {
    $ch = curl_init("{$supabaseUrl}/rest/v1/entity_donations?id=eq.{$donationId}");
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => 'PATCH',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}",
            "Content-Type: application/json",
            "Prefer: return=minimal"
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'status' => $status,
            'btc_tx_id' => $txId,
            'verified_at' => date('c')
        ])
    ]);
    curl_exec($ch);
    curl_close($ch);
}

/**
 * Obtener donación por ID
 */
function getDonation($donationId, $supabaseUrl, $supabaseKey) {
    $ch = curl_init("{$supabaseUrl}/rest/v1/entity_donations?id=eq.{$donationId}");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $donations = json_decode($response, true);
    return (is_array($donations) && !empty($donations)) ? $donations[0] : null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROCESAMIENTO
// ═══════════════════════════════════════════════════════════════════════════════

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

$donationId = $data['donationId'] ?? null;
$txId = trim($data['txId'] ?? '');

if (!$donationId) {
    http_response_code(400);
    echo json_encode(['error' => 'donationId is required']);
    exit;
}

if (!$txId) {
    http_response_code(400);
    echo json_encode(['error' => 'txId is required']);
    exit;
}

// Validar formato de txId (64 caracteres hex)
if (!preg_match('/^[a-fA-F0-9]{64}$/', $txId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid txId format']);
    exit;
}

// Obtener donación de la base de datos
$donation = null;
if (!empty($SUPABASE_URL)) {
    $donation = getDonation($donationId, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
}

// Si no hay donación en BD, usar datos del request
if (!$donation) {
    $donation = [
        'id' => $donationId,
        'btc_address' => $data['btcAddress'] ?? 'bc1qjnva46wy92ldhsv4w0j26jmu8c5wm5cxvgdfd7',
        'btc_amount' => floatval($data['btcAmount'] ?? 0)
    ];
}

$expectedAddress = $donation['btc_address'];
$expectedAmount = $donation['btc_amount'];

// Verificar transacción en blockchain
$verification = verifyBtcTransaction($txId, $expectedAddress, $expectedAmount);

if (!$verification['success']) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $verification['error'],
        'message' => 'No se pudo verificar la transacción. Verifica el TX ID e intenta de nuevo.'
    ]);
    exit;
}

// Verificar monto (con tolerancia del 5%)
$receivedAmount = $verification['amount'];
$minExpected = $expectedAmount * 0.95;

if ($receivedAmount < $minExpected) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Monto insuficiente',
        'expected' => $expectedAmount,
        'received' => $receivedAmount,
        'message' => "Se esperaban {$expectedAmount} BTC pero se recibieron {$receivedAmount} BTC"
    ]);
    exit;
}

// Actualizar estado en base de datos
$status = $verification['confirmed'] ? 'confirmed' : 'pending_confirmation';
if (!empty($SUPABASE_URL)) {
    updateDonationStatus($donationId, $status, $txId, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
}

// Respuesta exitosa
echo json_encode([
    'success' => true,
    'donationId' => $donationId,
    'txId' => $txId,
    'btcAmount' => $receivedAmount,
    'confirmations' => $verification['confirmations'],
    'confirmed' => $verification['confirmed'],
    'txUrl' => $verification['txUrl'],
    'status' => $status,
    'message' => $verification['confirmed']
        ? 'Transacción verificada y confirmada'
        : 'Transacción encontrada, esperando confirmaciones'
]);
