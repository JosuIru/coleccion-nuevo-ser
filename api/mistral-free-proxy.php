<?php
/**
 * Proxy de Mistral GRATIS - Colección Nuevo Ser
 *
 * Este proxy usa la API key del administrador para dar acceso
 * gratuito limitado a usuarios autenticados con plan FREE
 *
 * Subir a: gailu.net/api/mistral-free-proxy.php
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
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Token');
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
// CONFIGURACIÓN - Cargar desde config.php
// ═══════════════════════════════════════════════════════════════════════════════

$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}

// API Key de Mistral
$MISTRAL_API_KEY = defined('MISTRAL_API_KEY') ? MISTRAL_API_KEY : (getenv('MISTRAL_API_KEY') ?: '');

// Supabase para verificar usuarios
$SUPABASE_URL = defined('SUPABASE_URL') ? SUPABASE_URL : (getenv('SUPABASE_URL') ?: '');
$SUPABASE_KEY = defined('SUPABASE_ANON_KEY') ? SUPABASE_ANON_KEY : (getenv('SUPABASE_ANON_KEY') ?: '');

// Límite mensual para usuarios free (en consultas)
$FREE_MONTHLY_LIMIT = 50;

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════════

function verifyUser($userToken, $supabaseUrl, $supabaseKey) {
    if (!$userToken || !$supabaseUrl || !$supabaseKey) {
        return ['valid' => false, 'error' => 'Missing configuration'];
    }

    // Verificar token del usuario con Supabase
    $ch = curl_init("{$supabaseUrl}/auth/v1/user");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$userToken}"
        ]
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        return ['valid' => false, 'error' => 'Invalid user token'];
    }

    $user = json_decode($response, true);
    $userId = $user['id'] ?? null;

    if (!$userId) {
        return ['valid' => false, 'error' => 'User not found'];
    }

    return [
        'valid' => true,
        'userId' => $userId,
        'email' => $user['email'] ?? ''
    ];
}

function callMistralAPI($apiKey, $model, $messages, $maxTokens = 1024, $temperature = 0.7) {
    $ch = curl_init('https://api.mistral.ai/v1/chat/completions');

    $body = [
        'model' => $model,
        'messages' => $messages,
        'max_tokens' => $maxTokens,
        'temperature' => $temperature
    ];

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode($body),
        CURLOPT_TIMEOUT => 60
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        return ['error' => "Connection error: {$error}"];
    }

    $data = json_decode($response, true);

    if ($httpCode !== 200) {
        $errorMsg = $data['message'] ?? $data['error']['message'] ?? 'Unknown error';
        return ['error' => $errorMsg, 'httpCode' => $httpCode];
    }

    return [
        'success' => true,
        'choices' => $data['choices'] ?? [],
        'usage' => $data['usage'] ?? null
    ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROCESAMIENTO DE LA PETICIÓN
// ═══════════════════════════════════════════════════════════════════════════════

// Verificar que Mistral está configurado
if (empty($MISTRAL_API_KEY)) {
    http_response_code(503);
    echo json_encode([
        'error' => 'Servicio de IA gratuito no disponible temporalmente',
        'code' => 'SERVICE_UNAVAILABLE'
    ]);
    exit;
}

// Obtener token del usuario
$userToken = $_SERVER['HTTP_X_USER_TOKEN'] ?? null;

if (!$userToken) {
    // Intentar obtener de Authorization header
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
        $userToken = trim($matches[1]);
    }
}

if (!$userToken) {
    http_response_code(401);
    echo json_encode([
        'error' => 'Autenticación requerida para usar IA gratuita',
        'code' => 'AUTH_REQUIRED'
    ]);
    exit;
}

// Verificar usuario
$userInfo = verifyUser($userToken, $SUPABASE_URL, $SUPABASE_KEY);

if (!$userInfo['valid']) {
    http_response_code(401);
    echo json_encode([
        'error' => 'Token de usuario inválido',
        'code' => 'INVALID_TOKEN'
    ]);
    exit;
}

// Obtener datos de la petición
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

$messages = $data['messages'] ?? [];
$model = $data['model'] ?? 'mistral-small-latest';
$maxTokens = min(intval($data['max_tokens'] ?? 1024), 2048); // Límite para free
$temperature = floatval($data['temperature'] ?? 0.7);

if (empty($messages)) {
    http_response_code(400);
    echo json_encode(['error' => 'Messages are required']);
    exit;
}

// Llamar a Mistral
$result = callMistralAPI($MISTRAL_API_KEY, $model, $messages, $maxTokens, $temperature);

if (isset($result['error'])) {
    $httpCode = $result['httpCode'] ?? 500;
    http_response_code($httpCode);
    echo json_encode(['error' => $result['error']]);
    exit;
}

// Devolver respuesta exitosa
echo json_encode([
    'success' => true,
    'choices' => $result['choices'],
    'model' => $model,
    'usage' => $result['usage'],
    'plan' => 'free'
]);
