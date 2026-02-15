<?php
/**
 * DIRECT BTC DONATION (P2P)
 * Endpoint para verificar donaciones P2P en Bitcoin
 *
 * En modo P2P, el pago va directo a la wallet de la entidad verificada.
 * Este endpoint solo verifica que la transacción existe y los fondos llegaron.
 *
 * @version 1.0.0
 * @created 2025-01-15
 */

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
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
 * Obtener entidad con su dirección BTC
 */
function getEntityWithBtc($entityId, $supabaseUrl, $supabaseKey) {
    if (empty($supabaseUrl)) return null;

    $ch = curl_init("{$supabaseUrl}/rest/v1/transition_entities?id=eq.{$entityId}&select=id,name,btc_address,is_verified");
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
 * Verificar transacción en blockchain (Blockstream API)
 */
function verifyTransaction($txId, $targetAddress) {
    // Obtener datos de la transacción
    $ch = curl_init("https://blockstream.info/api/tx/{$txId}");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        return [
            'success' => false,
            'error' => 'Transacción no encontrada en blockchain'
        ];
    }

    $tx = json_decode($response, true);
    if (!$tx) {
        return [
            'success' => false,
            'error' => 'Datos de transacción inválidos'
        ];
    }

    // Buscar output que va a la dirección objetivo
    $outputs = $tx['vout'] ?? [];
    $matchingOutput = null;

    foreach ($outputs as $output) {
        $address = $output['scriptpubkey_address'] ?? null;
        if ($address === $targetAddress) {
            $matchingOutput = $output;
            break;
        }
    }

    if (!$matchingOutput) {
        return [
            'success' => false,
            'error' => 'La transacción no envía fondos a la dirección de la entidad',
            'targetAddress' => $targetAddress
        ];
    }

    // Calcular confirmaciones
    $confirmations = 0;
    $isConfirmed = false;

    if (isset($tx['status']['confirmed']) && $tx['status']['confirmed']) {
        $blockHeight = $tx['status']['block_height'];

        // Obtener altura actual
        $ch = curl_init("https://blockstream.info/api/blocks/tip/height");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5
        ]);
        $tipHeight = intval(curl_exec($ch));
        curl_close($ch);

        if ($tipHeight > 0 && $blockHeight > 0) {
            $confirmations = $tipHeight - $blockHeight + 1;
            $isConfirmed = true;
        }
    }

    $satoshis = $matchingOutput['value'] ?? 0;
    $btcAmount = $satoshis / 100000000;

    return [
        'success' => true,
        'txId' => $txId,
        'btcAmount' => $btcAmount,
        'satoshis' => $satoshis,
        'targetAddress' => $targetAddress,
        'confirmations' => $confirmations,
        'confirmed' => $isConfirmed,
        'txUrl' => "https://blockstream.info/tx/{$txId}"
    ];
}

/**
 * Registrar donación P2P verificada
 */
function logP2PDonation($data, $supabaseUrl, $supabaseKey) {
    if (empty($supabaseUrl)) return;

    $ch = curl_init("{$supabaseUrl}/rest/v1/entity_donations");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}",
            "Content-Type: application/json",
            "Prefer: return=minimal"
        ],
        CURLOPT_POSTFIELDS => json_encode($data)
    ]);
    curl_exec($ch);
    curl_close($ch);
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

$action = $data['action'] ?? 'verify';
$entityId = $data['entityId'] ?? null;
$txId = trim($data['txId'] ?? '');

// Validar campos
if (!$entityId) {
    http_response_code(400);
    echo json_encode(['error' => 'entityId is required']);
    exit;
}

if (!$txId) {
    http_response_code(400);
    echo json_encode(['error' => 'txId is required']);
    exit;
}

// Validar formato txId
if (!preg_match('/^[a-fA-F0-9]{64}$/', $txId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Formato de TX ID inválido. Debe ser un hash de 64 caracteres.']);
    exit;
}

// Obtener entidad
$entity = getEntityWithBtc($entityId, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);

// Si no hay BD, usar datos del request
if (!$entity) {
    $entity = [
        'id' => $entityId,
        'name' => $data['entityName'] ?? 'Entidad',
        'btc_address' => $data['btcAddress'] ?? null,
        'is_verified' => true
    ];
}

// Verificar que la entidad tiene dirección BTC
if (empty($entity['btc_address'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Esta entidad no tiene una dirección Bitcoin configurada para pagos P2P'
    ]);
    exit;
}

// Verificar transacción en blockchain
$verification = verifyTransaction($txId, $entity['btc_address']);

if (!$verification['success']) {
    http_response_code(400);
    echo json_encode($verification);
    exit;
}

// Registrar la donación P2P
$donationId = 'p2p_' . bin2hex(random_bytes(12));
logP2PDonation([
    'id' => $donationId,
    'entity_id' => $entityId,
    'btc_amount' => $verification['btcAmount'],
    'btc_tx_id' => $txId,
    'btc_address' => $entity['btc_address'],
    'payment_method' => 'btc',
    'is_p2p' => true,
    'status' => $verification['confirmed'] ? 'confirmed' : 'pending_confirmation',
    'verified_at' => date('c'),
    'donor_id' => $data['donorId'] ?? null,
    'donor_name' => $data['donorName'] ?? 'Anónimo'
], $SUPABASE_URL, $SUPABASE_SERVICE_KEY);

// Respuesta exitosa
echo json_encode([
    'success' => true,
    'donationId' => $donationId,
    'entityId' => $entityId,
    'entityName' => $entity['name'],
    'txId' => $txId,
    'btcAmount' => $verification['btcAmount'],
    'confirmations' => $verification['confirmations'],
    'confirmed' => $verification['confirmed'],
    'txUrl' => $verification['txUrl'],
    'message' => $verification['confirmed']
        ? 'Pago P2P verificado y confirmado en blockchain'
        : 'Transacción encontrada. Esperando confirmaciones en blockchain.'
]);
