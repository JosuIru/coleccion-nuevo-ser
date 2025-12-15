<?php
/**
 * Proxy de IA Premium - Colección Nuevo Ser
 *
 * Este proxy usa la API key del administrador para usuarios Premium/Pro
 * Los usuarios gratuitos deben usar su propia API key
 *
 * Subir a: gailu.net/api/premium-ai-proxy.php
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
// CONFIGURACIÓN - Editar con tus claves
// ═══════════════════════════════════════════════════════════════════════════════

// API Keys del administrador (NUNCA exponer al frontend)
// Recomendación: usar variables de entorno en producción
$ADMIN_API_KEYS = [
    'claude' => getenv('CLAUDE_API_KEY') ?: 'sk-ant-api03-TU-CLAVE-AQUI',
    'openai' => getenv('OPENAI_API_KEY') ?: 'sk-TU-CLAVE-AQUI',
    'gemini' => getenv('GEMINI_API_KEY') ?: 'TU-CLAVE-AQUI',
    'mistral' => getenv('MISTRAL_API_KEY') ?: 'TU-CLAVE-AQUI'
];

// Supabase para verificar suscripciones
$SUPABASE_URL = getenv('SUPABASE_URL') ?: 'https://TU-PROYECTO.supabase.co';
$SUPABASE_SERVICE_KEY = getenv('SUPABASE_SERVICE_KEY') ?: 'TU-SERVICE-KEY';

// Límites por plan
$PLAN_LIMITS = [
    'free' => 50,      // 50 consultas/mes
    'premium' => 500,  // 500 consultas/mes
    'pro' => 2000      // 2000 consultas/mes
];

// Modelos por plan
$PLAN_MODELS = [
    'free' => 'claude-3-5-haiku-20241022',     // Más económico para free
    'premium' => 'claude-3-5-sonnet-20241022', // Buen balance
    'pro' => 'claude-3-5-sonnet-20241022'      // Igual que premium, pero más consultas
];

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════════

function verifyUserSubscription($userToken, $supabaseUrl, $supabaseKey) {
    // Verificar el token JWT del usuario con Supabase
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

    // Obtener suscripción del usuario
    $ch = curl_init("{$supabaseUrl}/rest/v1/subscriptions?user_id=eq.{$userId}&status=eq.active&select=plan");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $subscriptions = json_decode($response, true);
    $plan = 'free';

    if (!empty($subscriptions) && isset($subscriptions[0]['plan'])) {
        $plan = $subscriptions[0]['plan'];
    }

    // Verificar uso actual
    $ch = curl_init("{$supabaseUrl}/rest/v1/ai_usage?user_id=eq.{$userId}&select=credits_used,monthly_limit");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $usage = json_decode($response, true);
    $creditsUsed = $usage[0]['credits_used'] ?? 0;
    $monthlyLimit = $usage[0]['monthly_limit'] ?? $GLOBALS['PLAN_LIMITS']['free'];

    return [
        'valid' => true,
        'userId' => $userId,
        'plan' => $plan,
        'creditsUsed' => $creditsUsed,
        'monthlyLimit' => $monthlyLimit,
        'creditsRemaining' => max(0, $monthlyLimit - $creditsUsed)
    ];
}

function incrementUserCredits($userId, $supabaseUrl, $supabaseKey, $credits = 1) {
    // Incrementar contador de créditos usados
    $ch = curl_init("{$supabaseUrl}/rest/v1/rpc/increment_ai_credits");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}",
            "Content-Type: application/json"
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'p_user_id' => $userId,
            'p_credits' => $credits
        ])
    ]);
    curl_exec($ch);
    curl_close($ch);
}

function callClaudeAPI($apiKey, $model, $messages, $systemPrompt, $maxTokens = 1024) {
    $ch = curl_init('https://api.anthropic.com/v1/messages');

    $body = [
        'model' => $model,
        'max_tokens' => $maxTokens,
        'messages' => $messages
    ];

    if ($systemPrompt) {
        $body['system'] = $systemPrompt;
    }

    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'x-api-key: ' . $apiKey,
            'anthropic-version: 2023-06-01',
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
        $errorMsg = $data['error']['message'] ?? $data['error'] ?? 'Unknown error';
        return ['error' => $errorMsg, 'httpCode' => $httpCode];
    }

    return [
        'success' => true,
        'text' => $data['content'][0]['text'] ?? '',
        'usage' => $data['usage'] ?? null
    ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROCESAMIENTO DE LA PETICIÓN
// ═══════════════════════════════════════════════════════════════════════════════

// Obtener token del usuario
$userToken = $_SERVER['HTTP_X_USER_TOKEN'] ?? null;

// Obtener datos de la petición
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

$messages = $data['messages'] ?? [];
$systemPrompt = $data['systemPrompt'] ?? '';
$feature = $data['feature'] ?? 'chat'; // chat, tutor, adapter, game_master

if (empty($messages)) {
    http_response_code(400);
    echo json_encode(['error' => 'Messages are required']);
    exit;
}

// Verificar usuario si tiene token
$userInfo = null;
if ($userToken) {
    $userInfo = verifyUserSubscription($userToken, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);

    if (!$userInfo['valid']) {
        // Token inválido, pero permitir si tiene API key propia
        $userInfo = null;
    }
}

// Determinar plan y límites
$plan = $userInfo['plan'] ?? 'free';
$creditsRemaining = $userInfo['creditsRemaining'] ?? 0;
$userId = $userInfo['userId'] ?? null;

// Usuarios no autenticados o free sin créditos: rechazar
if (!$userInfo || ($plan === 'free' && $creditsRemaining <= 0)) {
    http_response_code(403);
    echo json_encode([
        'error' => 'No tienes créditos de IA disponibles',
        'plan' => $plan,
        'creditsRemaining' => $creditsRemaining,
        'upgrade' => true,
        'message' => 'Suscríbete a Premium para obtener 500 consultas IA/mes o configura tu propia API key'
    ]);
    exit;
}

// Verificar si tiene créditos
if ($creditsRemaining <= 0) {
    http_response_code(403);
    echo json_encode([
        'error' => 'Has agotado tus créditos de IA este mes',
        'plan' => $plan,
        'creditsRemaining' => 0,
        'resetDate' => date('Y-m-01', strtotime('first day of next month')),
        'upgrade' => $plan !== 'pro'
    ]);
    exit;
}

// Determinar modelo según plan
$model = $PLAN_MODELS[$plan] ?? $PLAN_MODELS['free'];

// Calcular créditos a consumir según feature
$creditsCost = [
    'chat' => 1,
    'tutor' => 2,
    'adapter' => 3,
    'game_master' => 5
];
$cost = $creditsCost[$feature] ?? 1;

// Verificar que tiene suficientes créditos
if ($creditsRemaining < $cost) {
    http_response_code(403);
    echo json_encode([
        'error' => "Esta función cuesta {$cost} créditos y solo te quedan {$creditsRemaining}",
        'creditsRemaining' => $creditsRemaining,
        'cost' => $cost
    ]);
    exit;
}

// Hacer la llamada a Claude con la API key del admin
$apiKey = $ADMIN_API_KEYS['claude'];
$result = callClaudeAPI($apiKey, $model, $messages, $systemPrompt);

if (isset($result['error'])) {
    http_response_code(500);
    echo json_encode(['error' => $result['error']]);
    exit;
}

// Incrementar créditos usados
if ($userId) {
    incrementUserCredits($userId, $SUPABASE_URL, $SUPABASE_SERVICE_KEY, $cost);
}

// Devolver respuesta exitosa
echo json_encode([
    'success' => true,
    'text' => $result['text'],
    'model' => $model,
    'creditsUsed' => $cost,
    'creditsRemaining' => $creditsRemaining - $cost,
    'plan' => $plan
]);
