<?php
/**
 * ENTITY ENDORSEMENT API
 * Endpoint para gestionar avales de entidades con stake
 *
 * @version 1.0.0
 * @created 2025-01-15
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}

$SUPABASE_URL = defined('SUPABASE_URL') ? SUPABASE_URL : (getenv('SUPABASE_URL') ?: '');
$SUPABASE_SERVICE_KEY = defined('SUPABASE_SERVICE_KEY') ? SUPABASE_SERVICE_KEY :
                        (defined('SUPABASE_ANON_KEY') ? SUPABASE_ANON_KEY : (getenv('SUPABASE_SERVICE_KEY') ?: ''));

$MIN_STAKE = 20; // Mínimo €20 de stake
$MIN_ACCOUNT_AGE_DAYS = 7; // Cuenta debe tener al menos 7 días
$MIN_REPUTATION_TO_ENDORSE = 10; // Reputación mínima para poder avalar

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Verificar token JWT y obtener usuario
 */
function verifyUser($authHeader, $supabaseUrl, $supabaseKey) {
    if (!$authHeader || !preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
        return null;
    }

    $token = $matches[1];

    $ch = curl_init("{$supabaseUrl}/auth/v1/user");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$token}"
        ]
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        return null;
    }

    return json_decode($response, true);
}

/**
 * Obtener reputación del usuario
 */
function getUserReputation($userId, $supabaseUrl, $supabaseKey) {
    $ch = curl_init("{$supabaseUrl}/rest/v1/user_reputation?user_id=eq.{$userId}");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($response, true);
    return (is_array($data) && !empty($data)) ? $data[0] : null;
}

/**
 * Verificar si el usuario puede avalar
 */
function canUserEndorse($userId, $supabaseUrl, $supabaseKey) {
    global $MIN_ACCOUNT_AGE_DAYS, $MIN_REPUTATION_TO_ENDORSE;

    // Obtener perfil del usuario
    $ch = curl_init("{$supabaseUrl}/rest/v1/profiles?id=eq.{$userId}&select=created_at");
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
    if (empty($profiles)) {
        return ['canEndorse' => false, 'reason' => 'Usuario no encontrado'];
    }

    $profile = $profiles[0];
    $createdAt = strtotime($profile['created_at']);
    $accountAgeDays = (time() - $createdAt) / 86400;

    if ($accountAgeDays < $MIN_ACCOUNT_AGE_DAYS) {
        return [
            'canEndorse' => false,
            'reason' => "Tu cuenta debe tener al menos {$MIN_ACCOUNT_AGE_DAYS} días de antigüedad",
            'daysRemaining' => ceil($MIN_ACCOUNT_AGE_DAYS - $accountAgeDays)
        ];
    }

    // Obtener reputación
    $reputation = getUserReputation($userId, $supabaseUrl, $supabaseKey);
    $score = $reputation['reputation_score'] ?? 0;

    if ($score < $MIN_REPUTATION_TO_ENDORSE) {
        return [
            'canEndorse' => false,
            'reason' => "Necesitas al menos {$MIN_REPUTATION_TO_ENDORSE} puntos de reputación",
            'currentScore' => $score
        ];
    }

    // Verificar avales previos fallidos
    $slashedCount = $reputation['endorsements_slashed'] ?? 0;
    if ($slashedCount >= 2) {
        return [
            'canEndorse' => false,
            'reason' => 'Has perdido demasiados avales por entidades fraudulentas'
        ];
    }

    return ['canEndorse' => true, 'reputationScore' => $score];
}

/**
 * Detectar posible colusión
 */
function detectCollusion($entityId, $endorserId, $supabaseUrl, $supabaseKey) {
    // Obtener avales existentes
    $ch = curl_init("{$supabaseUrl}/rest/v1/entity_endorsements?entity_id=eq.{$entityId}&stake_status=eq.active&select=endorser_id,endorser_ip,created_at");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $existingEndorsements = json_decode($response, true) ?: [];

    $flags = [];

    // Verificar si ya avaló esta entidad
    foreach ($existingEndorsements as $e) {
        if ($e['endorser_id'] === $endorserId) {
            return ['suspicious' => true, 'reason' => 'Ya has avalado esta entidad'];
        }
    }

    // Más verificaciones de colusión podrían añadirse aquí
    // - Verificar IPs similares
    // - Verificar grafo social
    // - Verificar patrones de avales

    return ['suspicious' => false, 'flags' => $flags];
}

/**
 * Crear aval
 */
function createEndorsement($entityId, $endorserId, $reason, $stakeAmount, $supabaseUrl, $supabaseKey) {
    $ch = curl_init("{$supabaseUrl}/rest/v1/entity_endorsements");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}",
            "Content-Type: application/json",
            "Prefer: return=representation"
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'entity_id' => $entityId,
            'endorser_id' => $endorserId,
            'stake_amount' => $stakeAmount,
            'stake_status' => 'active',
            'reason' => $reason,
            'endorser_ip' => $_SERVER['REMOTE_ADDR'] ?? null
        ])
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        $data = json_decode($response, true);
        return ['success' => true, 'endorsement' => $data[0] ?? null];
    }

    return ['success' => false, 'error' => 'Error al guardar aval'];
}

/**
 * Obtener avales de una entidad
 */
function getEndorsements($entityId, $supabaseUrl, $supabaseKey) {
    $ch = curl_init("{$supabaseUrl}/rest/v1/entity_endorsements?entity_id=eq.{$entityId}&stake_status=eq.active&select=*,profiles(full_name)");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $endorsements = json_decode($response, true) ?: [];

    // Formatear respuesta
    return array_map(function($e) {
        return [
            'id' => $e['id'],
            'endorser_id' => $e['endorser_id'],
            'endorser_name' => $e['profiles']['full_name'] ?? 'Anónimo',
            'stake_amount' => $e['stake_amount'],
            'reason' => $e['reason'],
            'created_at' => $e['created_at']
        ];
    }, $endorsements);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROCESAMIENTO
// ═══════════════════════════════════════════════════════════════════════════════

// GET: Obtener avales o verificar si puede avalar
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $entityId = $_GET['entityId'] ?? null;
    $action = $_GET['action'] ?? null;
    $userId = $_GET['userId'] ?? null;

    if ($action === 'can_endorse' && $userId) {
        $result = canUserEndorse($userId, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
        echo json_encode($result);
        exit;
    }

    if ($entityId) {
        $endorsements = getEndorsements($entityId, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
        echo json_encode(['endorsements' => $endorsements, 'count' => count($endorsements)]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'entityId or action required']);
    exit;
}

// POST: Crear aval
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Verificar usuario
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $user = verifyUser($authHeader, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);

    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'No autorizado']);
        exit;
    }

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    $action = $data['action'] ?? '';
    $entityId = $data['entityId'] ?? null;
    $reason = $data['reason'] ?? '';
    $stakeAmount = floatval($data['stakeAmount'] ?? $MIN_STAKE);

    if ($action !== 'endorse') {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
        exit;
    }

    if (!$entityId) {
        http_response_code(400);
        echo json_encode(['error' => 'entityId is required']);
        exit;
    }

    if (!$reason || strlen($reason) < 10) {
        http_response_code(400);
        echo json_encode(['error' => 'Debes proporcionar una razón de al menos 10 caracteres']);
        exit;
    }

    if ($stakeAmount < $MIN_STAKE) {
        http_response_code(400);
        echo json_encode(['error' => "El stake mínimo es €{$MIN_STAKE}"]);
        exit;
    }

    // Verificar si puede avalar
    $canEndorse = canUserEndorse($user['id'], $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
    if (!$canEndorse['canEndorse']) {
        http_response_code(403);
        echo json_encode(['error' => $canEndorse['reason']]);
        exit;
    }

    // Detectar colusión
    $collusion = detectCollusion($entityId, $user['id'], $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
    if ($collusion['suspicious']) {
        http_response_code(403);
        echo json_encode(['error' => $collusion['reason']]);
        exit;
    }

    // Crear aval
    $result = createEndorsement($entityId, $user['id'], $reason, $stakeAmount, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
    echo json_encode($result);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
