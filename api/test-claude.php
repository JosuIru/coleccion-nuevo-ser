<?php
/**
 * TEST - Verificar conexión con Claude API
 */

header('Content-Type: application/json');

function isDebugAllowed() {
    $env = getenv('APP_ENV') ?: '';
    $debugFlag = getenv('ENABLE_DEBUG_ENDPOINTS') ?: '';
    if ($env === 'production' && $debugFlag !== '1') {
        return false;
    }
    $expected = getenv('ADMIN_DEBUG_TOKEN') ?: hash('sha256', 'irurag@gmail.com' . 'debug-key');
    $provided = $_GET['admin_token'] ?? '';
    return $provided !== '' && hash_equals($expected, $provided);
}

if (php_sapi_name() !== 'cli' && !isDebugAllowed()) {
    http_response_code(403);
    echo json_encode(['error' => 'Endpoint disabled']);
    exit;
}

// Cargar config
require_once __DIR__ . '/config.php';

// Verificar que existe la constante
if (!defined('CLAUDE_API_KEY')) {
    echo json_encode(['error' => 'CLAUDE_API_KEY no definida']);
    exit;
}

$apiKey = CLAUDE_API_KEY;
echo json_encode([
    'step' => 1,
    'api_key_exists' => !empty($apiKey),
    'api_key_length' => strlen($apiKey),
    'api_key_prefix' => substr($apiKey, 0, 15) . '...'
]);
echo "\n";

// Test curl
if (!function_exists('curl_init')) {
    echo json_encode(['error' => 'curl no está instalado en PHP']);
    exit;
}

echo json_encode(['step' => 2, 'curl' => 'OK']);
echo "\n";

// Llamar a Claude
$ch = curl_init('https://api.anthropic.com/v1/messages');

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'x-api-key: ' . $apiKey,
        'anthropic-version: 2023-06-01'
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'model' => 'claude-sonnet-4-20250514',
        'max_tokens' => 100,
        'messages' => [
            ['role' => 'user', 'content' => 'Di solo "OK funcionando"']
        ]
    ]),
    CURLOPT_TIMEOUT => 30
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

echo json_encode([
    'step' => 3,
    'http_code' => $httpCode,
    'curl_error' => $curlError ?: null,
    'response' => json_decode($response, true)
]);
