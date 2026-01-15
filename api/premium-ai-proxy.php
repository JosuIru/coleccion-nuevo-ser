<?php
/**
 * Proxy de IA Premium - Colección Nuevo Ser
 *
 * Este proxy usa la API key del administrador para usuarios Premium/Pro
 * Los usuarios gratuitos deben usar su propia API key o el proxy free (Mistral)
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
// CONFIGURACIÓN - Cargar desde config.php
// ═══════════════════════════════════════════════════════════════════════════════

// Cargar config.php con las API keys reales
$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}

// API Keys del administrador desde config.php o variables de entorno
$ADMIN_API_KEYS = [
    'claude' => defined('CLAUDE_API_KEY') ? CLAUDE_API_KEY : (getenv('CLAUDE_API_KEY') ?: ''),
    'mistral' => defined('MISTRAL_API_KEY') ? MISTRAL_API_KEY : (getenv('MISTRAL_API_KEY') ?: '')
];

// Supabase para verificar suscripciones
$SUPABASE_URL = defined('SUPABASE_URL') ? SUPABASE_URL : (getenv('SUPABASE_URL') ?: '');
$SUPABASE_SERVICE_KEY = defined('SUPABASE_SERVICE_KEY') ? SUPABASE_SERVICE_KEY :
                        (defined('SUPABASE_ANON_KEY') ? SUPABASE_ANON_KEY : (getenv('SUPABASE_SERVICE_KEY') ?: ''));

// Límites por plan (en créditos, donde 1 crédito ≈ 1000 tokens)
$PLAN_LIMITS = [
    'free' => 100,      // ~100K tokens/mes
    'premium' => 1000,  // ~1M tokens/mes
    'pro' => 5000       // ~5M tokens/mes
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

    // Obtener perfil del usuario (subscription_tier está en profiles)
    $ch = curl_init("{$supabaseUrl}/rest/v1/profiles?id=eq.{$userId}&select=subscription_tier");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $profiles = json_decode($response, true);

    // Default: plan free
    $plan = 'free';

    if (is_array($profiles) && !empty($profiles) && isset($profiles[0]['subscription_tier'])) {
        $plan = $profiles[0]['subscription_tier'];
    }

    // Contar tokens usados este mes (sumando tokens_total de ai_usage)
    $startOfMonth = date('Y-m-01T00:00:00Z');
    $ch = curl_init("{$supabaseUrl}/rest/v1/ai_usage?user_id=eq.{$userId}&created_at=gte.{$startOfMonth}&select=tokens_total");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $usageRecords = json_decode($response, true);
    $tokensUsed = 0;
    if (is_array($usageRecords)) {
        foreach ($usageRecords as $record) {
            $tokensUsed += intval($record['tokens_total'] ?? 0);
        }
    }

    // Convertir tokens a "créditos" (1 crédito = ~1000 tokens)
    $creditsUsed = intval($tokensUsed / 1000);
    $monthlyLimit = $GLOBALS['PLAN_LIMITS'][$plan] ?? $GLOBALS['PLAN_LIMITS']['free'];

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
    // El registro de uso se hace desde el cliente (auth-helper.js)
    // Esta función solo existe por compatibilidad
    // No necesitamos hacer nada aquí
}

function callClaudeAPI($apiKey, $model, $messages, $systemPrompt, $maxTokens = 4096) {
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
$systemPrompt = $data['systemPrompt'] ?? $data['system'] ?? '';  // Soportar ambos nombres
$feature = $data['feature'] ?? 'chat'; // chat, tutor, adapter, game_master
$maxTokens = min(intval($data['max_tokens'] ?? 4096), 8192);  // Leer del cliente, máx 8192

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
    'content_adaptation' => 4,  // Adaptación de contenido (textos largos)
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
$result = callClaudeAPI($apiKey, $model, $messages, $systemPrompt, $maxTokens);

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
