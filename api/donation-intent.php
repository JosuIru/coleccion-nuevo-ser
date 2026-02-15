<?php
/**
 * DONATION INTENT API
 * Endpoint para gestionar intenciones de donación
 * (cuando la entidad aún no puede recibir donaciones)
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
 * Crear intención de donación
 */
function createIntent($entityId, $donorId, $donorEmail, $amount, $message, $supabaseUrl, $supabaseKey) {
    $expiresAt = date('c', strtotime('+90 days'));

    $ch = curl_init("{$supabaseUrl}/rest/v1/donation_intents");
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
            'donor_id' => $donorId,
            'donor_email' => $donorEmail,
            'amount' => $amount,
            'currency' => 'EUR',
            'message' => $message,
            'status' => 'pending',
            'expires_at' => $expiresAt
        ])
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        $data = json_decode($response, true);
        return ['success' => true, 'intent' => $data[0] ?? null];
    }

    return ['success' => false, 'error' => 'Error al guardar intención'];
}

/**
 * Obtener intenciones pendientes de una entidad
 */
function getPendingIntents($entityId, $supabaseUrl, $supabaseKey) {
    $ch = curl_init("{$supabaseUrl}/rest/v1/donation_intents?entity_id=eq.{$entityId}&status=eq.pending&select=id,amount,currency,message,created_at");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $intents = json_decode($response, true) ?: [];

    $totalAmount = array_reduce($intents, function($sum, $i) {
        return $sum + floatval($i['amount']);
    }, 0);

    return [
        'intents' => $intents,
        'count' => count($intents),
        'totalAmount' => $totalAmount
    ];
}

/**
 * Actualizar total pendiente en la entidad
 */
function updateEntityPendingTotal($entityId, $supabaseUrl, $supabaseKey) {
    $pending = getPendingIntents($entityId, $supabaseUrl, $supabaseKey);

    $ch = curl_init("{$supabaseUrl}/rest/v1/transition_entities?id=eq.{$entityId}");
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
            'total_pending' => $pending['totalAmount']
        ])
    ]);
    curl_exec($ch);
    curl_close($ch);
}

/**
 * Notificar intenciones pendientes cuando una entidad se verifica
 */
function notifyPendingDonors($entityId, $supabaseUrl, $supabaseKey) {
    // Obtener intenciones pendientes
    $ch = curl_init("{$supabaseUrl}/rest/v1/donation_intents?entity_id=eq.{$entityId}&status=eq.pending&select=id,donor_email,amount");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $intents = json_decode($response, true) ?: [];
    $notified = 0;

    foreach ($intents as $intent) {
        if (!empty($intent['donor_email'])) {
            // Aquí se enviaría el email de notificación
            // Por ahora solo actualizamos el estado

            $ch = curl_init("{$supabaseUrl}/rest/v1/donation_intents?id=eq.{$intent['id']}");
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
                    'status' => 'notified',
                    'notified_at' => date('c')
                ])
            ]);
            curl_exec($ch);
            curl_close($ch);

            $notified++;
        }
    }

    return ['notified' => $notified];
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROCESAMIENTO
// ═══════════════════════════════════════════════════════════════════════════════

// GET: Obtener intenciones pendientes
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $entityId = $_GET['entityId'] ?? null;

    if (!$entityId) {
        http_response_code(400);
        echo json_encode(['error' => 'entityId is required']);
        exit;
    }

    $result = getPendingIntents($entityId, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
    echo json_encode($result);
    exit;
}

// POST: Crear intención o notificar
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    $action = $data['action'] ?? 'create';
    $entityId = $data['entityId'] ?? null;

    if (!$entityId) {
        http_response_code(400);
        echo json_encode(['error' => 'entityId is required']);
        exit;
    }

    switch ($action) {
        case 'create':
            // Verificar usuario (opcional)
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            $user = verifyUser($authHeader, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);

            $amount = floatval($data['amount'] ?? 0);
            if ($amount <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'amount must be greater than 0']);
                exit;
            }

            $donorId = $user ? $user['id'] : null;
            $donorEmail = $data['donorEmail'] ?? ($user ? $user['email'] : null);
            $message = $data['message'] ?? '';

            $result = createIntent($entityId, $donorId, $donorEmail, $amount, $message, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);

            if ($result['success']) {
                // Actualizar total pendiente
                updateEntityPendingTotal($entityId, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
            }

            echo json_encode($result);
            break;

        case 'notify':
            // Notificar a donantes pendientes (llamado cuando entidad se verifica)
            $result = notifyPendingDonors($entityId, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
            echo json_encode($result);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
