<?php
/**
 * ENTITY DISPUTE API
 * Sistema descentralizado de disputas para entidades
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

$DISPUTE_STAKE = 5; // €5 fianza para abrir disputa
$REQUIRED_VOTES = 5; // Votos necesarios para resolver
$VOTING_PERIOD_DAYS = 7;
$MIN_REPUTATION_TO_ARBITRATE = 50;

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES
// ═══════════════════════════════════════════════════════════════════════════════

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

    return ($httpCode === 200) ? json_decode($response, true) : null;
}

function canUserArbitrate($userId, $supabaseUrl, $supabaseKey) {
    global $MIN_REPUTATION_TO_ARBITRATE;

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
    $reputation = (is_array($data) && !empty($data)) ? $data[0] : null;

    if (!$reputation) {
        return ['canArbitrate' => false, 'reason' => 'No tienes reputación registrada'];
    }

    if (!($reputation['can_arbitrate'] ?? false)) {
        return ['canArbitrate' => false, 'reason' => 'No tienes permiso para arbitrar'];
    }

    $score = $reputation['reputation_score'] ?? 0;
    if ($score < $MIN_REPUTATION_TO_ARBITRATE) {
        return [
            'canArbitrate' => false,
            'reason' => "Necesitas {$MIN_REPUTATION_TO_ARBITRATE} puntos de reputación",
            'currentScore' => $score
        ];
    }

    return ['canArbitrate' => true, 'reputationScore' => $score];
}

function openDispute($entityId, $complainantId, $reason, $description, $evidenceUrls, $supabaseUrl, $supabaseKey) {
    global $DISPUTE_STAKE, $VOTING_PERIOD_DAYS;

    $votingEnds = date('c', strtotime("+{$VOTING_PERIOD_DAYS} days"));

    $ch = curl_init("{$supabaseUrl}/rest/v1/entity_disputes");
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
            'complainant_id' => $complainantId,
            'complainant_stake' => $DISPUTE_STAKE,
            'reason' => $reason,
            'description' => $description,
            'evidence_urls' => $evidenceUrls,
            'status' => 'open',
            'voting_ends_at' => $votingEnds
        ])
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        $data = json_decode($response, true);
        return ['success' => true, 'dispute' => $data[0] ?? null];
    }

    return ['success' => false, 'error' => 'Error al crear disputa'];
}

function voteOnDispute($disputeId, $arbiterId, $vote, $reasoning, $supabaseUrl, $supabaseKey) {
    // Verificar que el usuario puede arbitrar
    $canArbitrate = canUserArbitrate($arbiterId, $supabaseUrl, $supabaseKey);
    if (!$canArbitrate['canArbitrate']) {
        return ['success' => false, 'error' => $canArbitrate['reason']];
    }

    // Verificar que no ha votado ya
    $ch = curl_init("{$supabaseUrl}/rest/v1/dispute_votes?dispute_id=eq.{$disputeId}&arbiter_id=eq.{$arbiterId}");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $existingVotes = json_decode($response, true) ?: [];
    if (!empty($existingVotes)) {
        return ['success' => false, 'error' => 'Ya has votado en esta disputa'];
    }

    // Registrar voto
    $ch = curl_init("{$supabaseUrl}/rest/v1/dispute_votes");
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
            'dispute_id' => $disputeId,
            'arbiter_id' => $arbiterId,
            'vote' => $vote,
            'reasoning' => $reasoning
        ])
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode < 200 || $httpCode >= 300) {
        return ['success' => false, 'error' => 'Error al registrar voto'];
    }

    // Actualizar contadores en la disputa
    $voteColumn = ($vote === 'fraud') ? 'votes_fraud' : 'votes_legitimate';

    $ch = curl_init("{$supabaseUrl}/rest/v1/rpc/increment_dispute_vote");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}",
            "Content-Type: application/json"
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'dispute_id' => $disputeId,
            'vote_type' => $vote
        ])
    ]);
    curl_exec($ch);
    curl_close($ch);

    // Verificar si hay suficientes votos para resolver
    checkAndResolveDispute($disputeId, $supabaseUrl, $supabaseKey);

    return ['success' => true, 'message' => 'Voto registrado'];
}

function checkAndResolveDispute($disputeId, $supabaseUrl, $supabaseKey) {
    global $REQUIRED_VOTES;

    // Obtener disputa
    $ch = curl_init("{$supabaseUrl}/rest/v1/entity_disputes?id=eq.{$disputeId}");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $disputes = json_decode($response, true);
    if (empty($disputes)) return;

    $dispute = $disputes[0];
    $fraudVotes = $dispute['votes_fraud'] ?? 0;
    $legitVotes = $dispute['votes_legitimate'] ?? 0;
    $totalVotes = $fraudVotes + $legitVotes;

    // Necesitamos mayoría clara con suficientes votos
    if ($totalVotes < $REQUIRED_VOTES) return;

    $status = null;
    if ($fraudVotes > $legitVotes * 1.5) {
        // Mayoría clara de fraude
        $status = 'resolved_fraud';
        // Aquí se ejecutarían las penalizaciones:
        // - Slash a avaladores
        // - Devolver fondos a donantes
        // - Banear entidad
        handleFraudResolution($dispute, $supabaseUrl, $supabaseKey);
    } elseif ($legitVotes > $fraudVotes * 1.5) {
        // Mayoría clara de legítimo
        $status = 'resolved_legitimate';
        // Penalizar al denunciante (pierde fianza)
    }

    if ($status) {
        $ch = curl_init("{$supabaseUrl}/rest/v1/entity_disputes?id=eq.{$disputeId}");
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => 'PATCH',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                "apikey: {$supabaseKey}",
                "Authorization: Bearer {$supabaseKey}",
                "Content-Type: application/json"
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'status' => $status,
                'resolved_at' => date('c')
            ])
        ]);
        curl_exec($ch);
        curl_close($ch);
    }
}

function handleFraudResolution($dispute, $supabaseUrl, $supabaseKey) {
    $entityId = $dispute['entity_id'];

    // 1. Banear entidad
    $ch = curl_init("{$supabaseUrl}/rest/v1/transition_entities?id=eq.{$entityId}");
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => 'PATCH',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}",
            "Content-Type: application/json"
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'is_banned' => true,
            'ban_reason' => 'Disputa resuelta como fraude',
            'verification_level' => 0
        ])
    ]);
    curl_exec($ch);
    curl_close($ch);

    // 2. Slash a avaladores
    $ch = curl_init("{$supabaseUrl}/rest/v1/entity_endorsements?entity_id=eq.{$entityId}&stake_status=eq.active");
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => 'PATCH',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}",
            "Content-Type: application/json"
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'stake_status' => 'slashed',
            'slashed_at' => date('c')
        ])
    ]);
    curl_exec($ch);
    curl_close($ch);

    // 3. Marcar donaciones para refund
    $ch = curl_init("{$supabaseUrl}/rest/v1/entity_donations?entity_id=eq.{$entityId}&withdrawal_status=eq.held");
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => 'PATCH',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}",
            "Content-Type: application/json"
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'withdrawal_status' => 'refunded'
        ])
    ]);
    curl_exec($ch);
    curl_close($ch);
}

function getDisputes($entityId, $status, $supabaseUrl, $supabaseKey) {
    $filter = "entity_id=eq.{$entityId}";
    if ($status) {
        if (strpos($status, ',') !== false) {
            $statuses = array_map('trim', explode(',', $status));
            $filter .= "&status=in.(" . implode(',', $statuses) . ")";
        } else {
            $filter .= "&status=eq.{$status}";
        }
    }

    $ch = curl_init("{$supabaseUrl}/rest/v1/entity_disputes?{$filter}&order=created_at.desc");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true) ?: [];
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROCESAMIENTO
// ═══════════════════════════════════════════════════════════════════════════════

// GET: Obtener disputas
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $entityId = $_GET['entityId'] ?? null;
    $status = $_GET['status'] ?? null;

    if (!$entityId) {
        http_response_code(400);
        echo json_encode(['error' => 'entityId is required']);
        exit;
    }

    $disputes = getDisputes($entityId, $status, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
    echo json_encode(['disputes' => $disputes]);
    exit;
}

// POST: Abrir disputa o votar
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
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

    switch ($action) {
        case 'open':
            $entityId = $data['entityId'] ?? null;
            $reason = $data['reason'] ?? '';
            $description = $data['description'] ?? '';
            $evidenceUrls = $data['evidenceUrls'] ?? [];

            if (!$entityId || !$reason || !$description) {
                http_response_code(400);
                echo json_encode(['error' => 'entityId, reason and description are required']);
                exit;
            }

            $validReasons = ['fraud', 'impersonation', 'abandoned', 'other'];
            if (!in_array($reason, $validReasons)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid reason']);
                exit;
            }

            $result = openDispute($entityId, $user['id'], $reason, $description, $evidenceUrls, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
            echo json_encode($result);
            break;

        case 'vote':
            $disputeId = $data['disputeId'] ?? null;
            $vote = $data['vote'] ?? '';
            $reasoning = $data['reasoning'] ?? '';

            if (!$disputeId || !$vote) {
                http_response_code(400);
                echo json_encode(['error' => 'disputeId and vote are required']);
                exit;
            }

            if (!in_array($vote, ['fraud', 'legitimate'])) {
                http_response_code(400);
                echo json_encode(['error' => 'vote must be fraud or legitimate']);
                exit;
            }

            $result = voteOnDispute($disputeId, $user['id'], $vote, $reasoning, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
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
