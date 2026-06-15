<?php
/**
 * CONFIRM TRANSPARENCY BTC
 * Verifica una transacción BTC y la registra como aporte público del panel.
 */

require_once __DIR__ . '/_cors.php';
applyCorsHeaders('POST, OPTIONS', 'Content-Type, Authorization');

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}

$SUPABASE_URL = defined('SUPABASE_URL') ? SUPABASE_URL : (getenv('SUPABASE_URL') ?: '');
$SUPABASE_SERVICE_KEY = defined('SUPABASE_SERVICE_KEY') ? SUPABASE_SERVICE_KEY :
    (defined('SUPABASE_ANON_KEY') ? SUPABASE_ANON_KEY : (getenv('SUPABASE_SERVICE_KEY') ?: ''));

$COLLECTION_BTC_ADDRESSES = [
    'bc1qjnva46wy92ldhsv4w0j26jmu8c5wm5cxvgdfd7',
    'bc1p29l9vjelerljlwhg6dhr0uldldus4zgn8vjaecer0spj7273d7rss4gnyk'
];
$BTC_PRICE_EUR = 95000;

function getBtcPriceEur() {
    global $BTC_PRICE_EUR;

    $ch = curl_init('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    return floatval($data['bitcoin']['eur'] ?? $BTC_PRICE_EUR);
}

function verifyTransparencyBtcTransaction($txId, $allowedAddresses) {
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

    $matchedOutputs = [];
    foreach (($tx['vout'] ?? []) as $output) {
        $address = $output['scriptpubkey_address'] ?? null;
        if ($address && in_array($address, $allowedAddresses, true)) {
            $matchedOutputs[] = [
                'address' => $address,
                'amount_btc' => ($output['value'] ?? 0) / 100000000
            ];
        }
    }

    if (empty($matchedOutputs)) {
        return ['success' => false, 'error' => 'No output found for collection addresses'];
    }

    $confirmations = 0;
    if (!empty($tx['status']['confirmed']) && !empty($tx['status']['block_height'])) {
        $tip = curl_init('https://blockstream.info/api/blocks/tip/height');
        curl_setopt_array($tip, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5
        ]);
        $currentHeight = intval(curl_exec($tip));
        curl_close($tip);

        if ($currentHeight > 0) {
            $confirmations = $currentHeight - intval($tx['status']['block_height']) + 1;
        }
    }

    $amountBtc = array_reduce($matchedOutputs, function ($carry, $output) {
        return $carry + $output['amount_btc'];
    }, 0.0);

    return [
        'success' => true,
        'amount_btc' => round($amountBtc, 8),
        'address' => $matchedOutputs[0]['address'],
        'confirmations' => $confirmations,
        'confirmed' => $confirmations >= 1
    ];
}

function getGoalBySlug($goalSlug, $supabaseUrl, $supabaseKey) {
    $ch = curl_init("{$supabaseUrl}/rest/v1/transparency_goals?slug=eq." . rawurlencode($goalSlug) . "&select=slug,title,is_active");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $goals = json_decode($response, true);
    return (is_array($goals) && !empty($goals)) ? $goals[0] : null;
}

function getContributionBySourceReference($reference, $supabaseUrl, $supabaseKey) {
    $ch = curl_init("{$supabaseUrl}/rest/v1/transparency_contributions?source_reference=eq." . rawurlencode($reference) . "&select=id,amount_eur,goal_slug");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $rows = json_decode($response, true);
    return (is_array($rows) && !empty($rows)) ? $rows[0] : null;
}

function insertTransparencyContribution($payload, $supabaseUrl, $supabaseKey) {
    $ch = curl_init("{$supabaseUrl}/rest/v1/transparency_contributions");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}",
            "Content-Type: application/json",
            "Prefer: return=representation"
        ],
        CURLOPT_POSTFIELDS => json_encode($payload)
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode < 200 || $httpCode >= 300) {
        return null;
    }

    $result = json_decode($response, true);
    return (is_array($result) && !empty($result)) ? $result[0] : null;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

$txId = trim($data['txId'] ?? '');
$goalSlug = trim($data['goalSlug'] ?? '');
$label = trim($data['label'] ?? 'Aporte BTC verificado');
$visibility = trim($data['visibility'] ?? 'publico');

if (!preg_match('/^[a-fA-F0-9]{64}$/', $txId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid txId format']);
    exit;
}

if (empty($SUPABASE_URL) || empty($SUPABASE_SERVICE_KEY)) {
    http_response_code(500);
    echo json_encode(['error' => 'Supabase not configured']);
    exit;
}

if (!in_array($visibility, ['publico', 'anonimo'], true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid visibility']);
    exit;
}

$goal = null;
if ($goalSlug !== '') {
    $goal = getGoalBySlug($goalSlug, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
    if (!$goal || empty($goal['is_active'])) {
        http_response_code(404);
        echo json_encode(['error' => 'Transparency goal not found']);
        exit;
    }
}

$existing = getContributionBySourceReference($txId, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
if ($existing) {
    echo json_encode([
        'success' => true,
        'alreadyRegistered' => true,
        'amountEUR' => floatval($existing['amount_eur'] ?? 0),
        'goalSlug' => $existing['goal_slug'] ?? null
    ]);
    exit;
}

$verification = verifyTransparencyBtcTransaction($txId, $COLLECTION_BTC_ADDRESSES);
if (!$verification['success']) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $verification['error']
    ]);
    exit;
}

if (!$verification['confirmed']) {
    http_response_code(409);
    echo json_encode([
        'success' => false,
        'error' => 'Transaction is not yet confirmed on-chain',
        'confirmations' => $verification['confirmations']
    ]);
    exit;
}

$btcPriceEur = getBtcPriceEur();
$amountEur = round($verification['amount_btc'] * $btcPriceEur, 2);
$safeLabel = $visibility === 'anonimo' ? 'Aporte anónimo BTC' : mb_substr($label !== '' ? $label : 'Aporte BTC verificado', 0, 120);

$inserted = insertTransparencyContribution([
    'goal_slug' => $goalSlug !== '' ? $goalSlug : null,
    'label' => $safeLabel,
    'amount_eur' => $amountEur,
    'contribution_date' => date('Y-m-d'),
    'visibility' => $visibility,
    'source_type' => 'btc',
    'source_reference' => $txId
], $SUPABASE_URL, $SUPABASE_SERVICE_KEY);

if (!$inserted) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not store transparency contribution']);
    exit;
}

echo json_encode([
    'success' => true,
    'txId' => $txId,
    'goalSlug' => $goalSlug ?: null,
    'amountBTC' => $verification['amount_btc'],
    'amountEUR' => $amountEur,
    'confirmations' => $verification['confirmations'],
    'address' => $verification['address']
]);
