<?php
/**
 * AI PROXY - Claude API para usuarios Premium/Pro
 * Colección Nuevo Ser
 *
 * IMPORTANTE: Crea api/config.php con tus credenciales reales.
 * Ver config.example.php para el formato correcto.
 */

// Cargar configuración desde archivo separado (no versionado)
$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
} else {
    // Fallback para desarrollo local - NO USAR EN PRODUCCIÓN
    // Estos valores se sobreescribirán con config.php en producción
    define('CLAUDE_API_KEY', getenv('CLAUDE_API_KEY') ?: '');
    define('SUPABASE_URL', getenv('SUPABASE_URL') ?: 'https://flxrilsxghiqfsfifxch.supabase.co');
    define('SUPABASE_ANON_KEY', getenv('SUPABASE_ANON_KEY') ?: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZseHJpbHN4Z2hpcWZzZmlmeGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODUzMDQsImV4cCI6MjA4MDI2MTMwNH0.Q-loU9hZybMoFr4SrIvnCyhZPOmsYdRAqnJnyIvUdV4');

    // En producción sin config.php, las variables de entorno deben estar configuradas
    if (!CLAUDE_API_KEY && $_SERVER['REQUEST_METHOD'] === 'POST') {
        error_log('WARNING: CLAUDE_API_KEY not configured. Create api/config.php with your credentials.');
    }
}

// Costos por modelo
$MODEL_COSTS = [
    'claude-sonnet-4-20250514' => 1,
    'claude-3-5-sonnet-20241022' => 1,
    'claude-3-5-haiku-20241022' => 1,
    'claude-3-opus-20240229' => 3,
    'default' => 1
];

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
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
}

// CORS
applyCorsHeaders();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['error' => 'Method not allowed']));
}

// *** LEER BODY UNA SOLA VEZ ***
$RAW_BODY = file_get_contents('php://input');
$BODY = json_decode($RAW_BODY, true) ?: [];

// Obtener token
function getAuthToken() {
    global $BODY;

    // Header Authorization
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s+(.+)/i', $auth, $matches)) {
        return trim($matches[1]);
    }

    // Fallback: token en body
    return isset($BODY['_token']) ? trim($BODY['_token']) : null;
}

// Verificar token con Supabase
function verifyToken($token) {
    $ch = curl_init(SUPABASE_URL . '/auth/v1/user');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
            'apikey: ' . SUPABASE_ANON_KEY
        ]
    ]);
    $response = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return $code === 200 ? json_decode($response, true) : null;
}

// Obtener perfil
function getProfile($userId, $token) {
    $ch = curl_init(SUPABASE_URL . '/rest/v1/profiles?id=eq.' . $userId . '&select=subscription_tier,ai_credits_remaining,ai_credits_total');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
            'apikey: ' . SUPABASE_ANON_KEY
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);
    $data = json_decode($response, true);
    return $data[0] ?? null;
}

// Actualizar créditos
function updateCredits($userId, $credits, $token) {
    $ch = curl_init(SUPABASE_URL . '/rest/v1/profiles?id=eq.' . $userId);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => 'PATCH',
        CURLOPT_POSTFIELDS => json_encode(['ai_credits_remaining' => $credits]),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
            'apikey: ' . SUPABASE_ANON_KEY,
            'Content-Type: application/json'
        ]
    ]);
    curl_exec($ch);
    curl_close($ch);
}

// Llamar a Claude
function callClaude($messages, $model, $system, $maxTokens) {
    $body = [
        'model' => $model,
        'max_tokens' => $maxTokens,
        'messages' => $messages
    ];
    if ($system) $body['system'] = $system;

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($body),
        CURLOPT_HTTPHEADER => [
            'x-api-key: ' . CLAUDE_API_KEY,
            'anthropic-version: 2023-06-01',
            'Content-Type: application/json'
        ]
    ]);
    $response = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'data' => json_decode($response, true)];
}

// === MAIN ===
try {
    // 1. Auth
    $token = getAuthToken();
    if (!$token) {
        http_response_code(401);
        die(json_encode(['error' => 'Authorization required']));
    }

    // 2. Verify user
    $user = verifyToken($token);
    if (!$user) {
        http_response_code(401);
        die(json_encode(['error' => 'Invalid token']));
    }

    // 3. Get profile
    $profile = getProfile($user['id'], $token);
    if (!$profile) {
        http_response_code(404);
        die(json_encode(['error' => 'Profile not found']));
    }

    // 4. Check tier
    if (!in_array($profile['subscription_tier'], ['premium', 'pro'])) {
        http_response_code(403);
        die(json_encode(['error' => 'Premium/Pro required', 'tier' => $profile['subscription_tier']]));
    }

    // 5. Validate body
    if (!isset($BODY['messages'])) {
        http_response_code(400);
        die(json_encode(['error' => 'Messages required']));
    }

    $model = $BODY['model'] ?? 'claude-3-5-haiku-20241022';
    $system = $BODY['system'] ?? null;
    $maxTokens = $BODY['max_tokens'] ?? 1024;

    // 6. Check credits
    global $MODEL_COSTS;
    $cost = $MODEL_COSTS[$model] ?? 1;
    $credits = (int)$profile['ai_credits_remaining'];

    if ($credits < $cost) {
        http_response_code(402);
        die(json_encode(['error' => 'No credits', 'remaining' => $credits]));
    }

    // 7. Call Claude
    $result = callClaude($BODY['messages'], $model, $system, $maxTokens);

    if ($result['code'] !== 200) {
        http_response_code($result['code']);
        die(json_encode($result['data']));
    }

    // 8. Deduct credits
    $newCredits = $credits - $cost;
    updateCredits($user['id'], $newCredits, $token);

    // 9. Return response
    $result['data']['_credits'] = [
        'used' => $cost,
        'remaining' => $newCredits
    ];
    echo json_encode($result['data']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
