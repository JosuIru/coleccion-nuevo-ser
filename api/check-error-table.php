<?php
/**
 * Verificar si tabla api_errors_log existe
 * Si no existe, intentar crearla
 */

require_once __DIR__ . '/config.php';

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

$supabaseUrl = SUPABASE_URL;
$serviceKey = SUPABASE_SERVICE_KEY;

// 1. Primero, intentar insert de prueba para verificar si tabla existe
$testData = [
    'error_type' => 'INIT_TEST',
    'error_message' => 'Testing table existence',
    'http_code' => 200,
    'endpoint' => '/api/check-error-table.php'
];

$ch = curl_init("$supabaseUrl/rest/v1/api_errors_log");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "apikey: $serviceKey",
        "Authorization: Bearer $serviceKey",
        'Content-Type: application/json',
        'Prefer: return=representation'
    ],
    CURLOPT_POSTFIELDS => json_encode($testData),
    CURLOPT_TIMEOUT => 10
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$responseData = json_decode($response, true);

// Tabla existe
if ($httpCode === 201) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Tabla api_errors_log existe y es accesible',
        'table_exists' => true,
        'test_record_id' => $responseData[0]['id'] ?? null
    ]);
    exit;
}

// Tabla no existe - intentar crearla
if ($httpCode === 404 || (is_array($responseData) && isset($responseData['code']) && $responseData['code'] === 'PGRST116')) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Tabla api_errors_log NO existe. Necesario ejecutar manualmente en Supabase SQL Editor.',
        'table_exists' => false,
        'http_code' => $httpCode,
        'error_response' => $responseData,
        'solution' => 'Ve a: https://app.supabase.com/project/flxrilsxghiqfsfifxch/sql y ejecuta el SQL de creación',
        'sql' => 'CREATE TABLE api_errors_log (id BIGSERIAL PRIMARY KEY, error_type TEXT NOT NULL, error_message TEXT NOT NULL, http_code INTEGER, endpoint TEXT, details JSONB, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, resolved BOOLEAN DEFAULT FALSE, resolved_at TIMESTAMP WITH TIME ZONE, admin_notes TEXT);'
    ]);
    exit;
}

// Otro error
echo json_encode([
    'status' => 'error',
    'message' => 'Error desconocido',
    'http_code' => $httpCode,
    'response' => $responseData
]);
