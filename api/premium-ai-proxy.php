<?php
/**
 * Proxy de IA Premium - Colección Nuevo Ser
 *
 * Sistema de TOKENS (híbrido):
 * - Tokens mensuales del plan (se renuevan cada mes)
 * - Tokens comprados (wallet, no expiran)
 *
 * Los tokens se consumen en orden: primero mensuales, luego comprados.
 *
 * Subir a: gailu.net/api/premium-ai-proxy.php
 *
 * @version 2.0.0 - Sistema de tokens
 * @updated 2025-01-15
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

$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}

// API Keys del administrador
$ADMIN_API_KEYS = [
    'claude' => defined('CLAUDE_API_KEY') ? CLAUDE_API_KEY : (getenv('CLAUDE_API_KEY') ?: ''),
    'mistral' => defined('MISTRAL_API_KEY') ? MISTRAL_API_KEY : (getenv('MISTRAL_API_KEY') ?: '')
];

// Supabase para verificar tokens
$SUPABASE_URL = defined('SUPABASE_URL') ? SUPABASE_URL : (getenv('SUPABASE_URL') ?: '');
$SUPABASE_SERVICE_KEY = defined('SUPABASE_SERVICE_KEY') ? SUPABASE_SERVICE_KEY :
                        (defined('SUPABASE_ANON_KEY') ? SUPABASE_ANON_KEY : (getenv('SUPABASE_SERVICE_KEY') ?: ''));

// Tokens mensuales por plan (sincronizar con plans-config.js)
$PLAN_MONTHLY_TOKENS = [
    'free' => 5000,       // 5K tokens gratis
    'premium' => 100000,  // 100K tokens
    'pro' => 300000       // 300K tokens
];

// Modelos por plan
$PLAN_MODELS = [
    'free' => 'claude-3-5-haiku-20241022',
    'premium' => 'claude-3-5-sonnet-20241022',
    'pro' => 'claude-3-5-sonnet-20241022'
];

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verificar usuario y obtener balance de tokens
 */
function verifyUserAndTokens($userToken, $supabaseUrl, $supabaseKey) {
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

    // Obtener perfil del usuario con todos los campos de tokens
    $ch = curl_init("{$supabaseUrl}/rest/v1/profiles?id=eq.{$userId}&select=subscription_tier,token_balance,ai_credits_remaining,ai_credits_reset_date");
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

    if (!is_array($profiles) || empty($profiles)) {
        return ['valid' => false, 'error' => 'Profile not found'];
    }

    $profile = $profiles[0];
    $plan = $profile['subscription_tier'] ?? 'free';

    // Tokens comprados (wallet)
    $purchasedTokens = intval($profile['token_balance'] ?? 0);

    // Tokens mensuales restantes
    $monthlyTokens = intval($profile['ai_credits_remaining'] ?? 0);

    // Verificar si necesita reset mensual
    $resetDate = $profile['ai_credits_reset_date'] ?? null;
    if ($resetDate && strtotime($resetDate) <= time()) {
        // Resetear tokens mensuales
        $monthlyMax = $GLOBALS['PLAN_MONTHLY_TOKENS'][$plan] ?? 5000;
        $monthlyTokens = $monthlyMax;

        // Actualizar en la base de datos
        $nextReset = date('Y-m-d', strtotime('first day of next month'));
        $updateCh = curl_init("{$supabaseUrl}/rest/v1/profiles?id=eq.{$userId}");
        curl_setopt_array($updateCh, [
            CURLOPT_CUSTOMREQUEST => 'PATCH',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                "apikey: {$supabaseKey}",
                "Authorization: Bearer {$supabaseKey}",
                "Content-Type: application/json",
                "Prefer: return=minimal"
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'ai_credits_remaining' => $monthlyMax,
                'ai_credits_reset_date' => $nextReset
            ])
        ]);
        curl_exec($updateCh);
        curl_close($updateCh);
    }

    // Total disponible
    $totalTokens = $purchasedTokens + $monthlyTokens;

    return [
        'valid' => true,
        'userId' => $userId,
        'plan' => $plan,
        'purchasedTokens' => $purchasedTokens,
        'monthlyTokens' => $monthlyTokens,
        'totalTokens' => $totalTokens,
        'monthlyMax' => $GLOBALS['PLAN_MONTHLY_TOKENS'][$plan] ?? 5000
    ];
}

/**
 * Consumir tokens del usuario
 * Primero consume tokens mensuales, luego comprados
 */
function consumeTokens($userId, $tokensToConsume, $supabaseUrl, $supabaseKey, $monthlyTokens, $purchasedTokens) {
    $monthlyConsumed = 0;
    $purchasedConsumed = 0;

    // Primero consumir de tokens mensuales
    if ($monthlyTokens > 0) {
        $monthlyConsumed = min($tokensToConsume, $monthlyTokens);
        $tokensToConsume -= $monthlyConsumed;
    }

    // Si no alcanza, consumir de tokens comprados
    if ($tokensToConsume > 0 && $purchasedTokens > 0) {
        $purchasedConsumed = min($tokensToConsume, $purchasedTokens);
    }

    // Actualizar en la base de datos
    $newMonthly = $monthlyTokens - $monthlyConsumed;
    $newPurchased = $purchasedTokens - $purchasedConsumed;

    $ch = curl_init("{$supabaseUrl}/rest/v1/profiles?id=eq.{$userId}");
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
            'ai_credits_remaining' => $newMonthly,
            'token_balance' => $newPurchased
        ])
    ]);
    curl_exec($ch);
    curl_close($ch);

    return [
        'success' => true,
        'monthlyRemaining' => $newMonthly,
        'purchasedRemaining' => $newPurchased,
        'totalRemaining' => $newMonthly + $newPurchased
    ];
}

/**
 * Registrar uso en ai_usage
 */
function logUsage($userId, $context, $provider, $model, $tokensInput, $tokensOutput, $supabaseUrl, $supabaseKey) {
    $ch = curl_init("{$supabaseUrl}/rest/v1/ai_usage");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}",
            "Content-Type: application/json",
            "Prefer: return=minimal"
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'user_id' => $userId,
            'context' => $context,
            'provider' => $provider,
            'model' => $model,
            'tokens_input' => $tokensInput,
            'tokens_output' => $tokensOutput,
            'tokens_total' => $tokensInput + $tokensOutput,
            'cost_usd' => calculateCost($tokensInput, $tokensOutput, $model)
        ])
    ]);
    curl_exec($ch);
    curl_close($ch);
}

/**
 * Calcular costo en USD
 */
function calculateCost($tokensInput, $tokensOutput, $model) {
    // Precios por 1M tokens (Anthropic pricing)
    $prices = [
        'claude-3-5-sonnet-20241022' => ['input' => 3.0, 'output' => 15.0],
        'claude-3-5-haiku-20241022' => ['input' => 0.25, 'output' => 1.25],
        'claude-3-opus-20240229' => ['input' => 15.0, 'output' => 75.0]
    ];

    $price = $prices[$model] ?? $prices['claude-3-5-sonnet-20241022'];

    $inputCost = ($tokensInput / 1000000) * $price['input'];
    $outputCost = ($tokensOutput / 1000000) * $price['output'];

    return round($inputCost + $outputCost, 6);
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
$systemPrompt = $data['systemPrompt'] ?? $data['system'] ?? '';
$feature = $data['feature'] ?? 'chat'; // chat, tutor, adapter, game_master
$maxTokens = min(intval($data['max_tokens'] ?? 4096), 8192);

if (empty($messages)) {
    http_response_code(400);
    echo json_encode(['error' => 'Messages are required']);
    exit;
}

// Verificar usuario si tiene token
$userInfo = null;
if ($userToken) {
    $userInfo = verifyUserAndTokens($userToken, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);

    if (!$userInfo['valid']) {
        http_response_code(401);
        echo json_encode(['error' => $userInfo['error']]);
        exit;
    }
}

if (!$userInfo) {
    http_response_code(401);
    echo json_encode([
        'error' => 'Autenticación requerida',
        'message' => 'Por favor inicia sesión para usar el chat de IA'
    ]);
    exit;
}

// Obtener información de tokens
$plan = $userInfo['plan'];
$totalTokens = $userInfo['totalTokens'];
$monthlyTokens = $userInfo['monthlyTokens'];
$purchasedTokens = $userInfo['purchasedTokens'];
$userId = $userInfo['userId'];

// Estimar tokens necesarios (aproximado)
$estimatedTokens = 100; // Mínimo base
foreach ($messages as $msg) {
    $estimatedTokens += intval(strlen($msg['content'] ?? '') / 4);
}
$estimatedTokens = min($estimatedTokens + $maxTokens, 10000); // Cap máximo

// Verificar si tiene tokens suficientes
if ($totalTokens < $estimatedTokens) {
    http_response_code(403);
    echo json_encode([
        'error' => 'Tokens insuficientes',
        'tokensAvailable' => $totalTokens,
        'tokensNeeded' => $estimatedTokens,
        'message' => 'Compra más tokens para continuar usando el chat de IA',
        'purchaseUrl' => true
    ]);
    exit;
}

// 🔧 v2.9.392: Verificar feature según plan O si tiene tokens comprados
// Si el usuario tiene tokens comprados (wallet), puede usar cualquier feature
// Esto alinea el comportamiento del proxy con el frontend (ai-premium.js)
$featureAccess = [
    'free' => ['chat'],
    'premium' => ['chat', 'tutor', 'adapter', 'content_adaptation'],
    'pro' => ['chat', 'tutor', 'adapter', 'content_adaptation', 'game_master']
];

$allowedFeatures = $featureAccess[$plan] ?? $featureAccess['free'];
$hasPurchasedTokens = $purchasedTokens > 0;

// Permitir acceso si: (1) la feature está en su plan, O (2) tiene tokens comprados
if (!in_array($feature, $allowedFeatures) && !$hasPurchasedTokens) {
    http_response_code(403);
    echo json_encode([
        'error' => "La función '{$feature}' no está disponible en tu plan {$plan}",
        'plan' => $plan,
        'upgrade' => true,
        'message' => 'Actualiza tu plan o compra tokens para acceder a esta función'
    ]);
    exit;
}

// Determinar modelo según plan
$model = $PLAN_MODELS[$plan] ?? $PLAN_MODELS['free'];

// Hacer la llamada a Claude
$apiKey = $ADMIN_API_KEYS['claude'];
$result = callClaudeAPI($apiKey, $model, $messages, $systemPrompt, $maxTokens);

if (isset($result['error'])) {
    http_response_code(500);
    echo json_encode(['error' => $result['error']]);
    exit;
}

// Calcular tokens reales usados
$tokensInput = $result['usage']['input_tokens'] ?? 0;
$tokensOutput = $result['usage']['output_tokens'] ?? 0;
$tokensUsed = $tokensInput + $tokensOutput;

// Consumir tokens
$consumeResult = consumeTokens(
    $userId,
    $tokensUsed,
    $SUPABASE_URL,
    $SUPABASE_SERVICE_KEY,
    $monthlyTokens,
    $purchasedTokens
);

// Registrar uso
logUsage($userId, $feature, 'claude', $model, $tokensInput, $tokensOutput, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);

// Devolver respuesta exitosa
echo json_encode([
    'success' => true,
    'text' => $result['text'],
    'model' => $model,
    'tokensUsed' => $tokensUsed,
    'tokensRemaining' => $consumeResult['totalRemaining'],
    'monthlyRemaining' => $consumeResult['monthlyRemaining'],
    'purchasedRemaining' => $consumeResult['purchasedRemaining'],
    'plan' => $plan,
    'usage' => [
        'input' => $tokensInput,
        'output' => $tokensOutput,
        'total' => $tokensUsed
    ]
]);
