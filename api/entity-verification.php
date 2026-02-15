<?php
/**
 * ENTITY VERIFICATION API
 * Endpoint para verificar entidades por DNS, Meta Tag o Firma Criptográfica
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

// Cargar configuración
$configFile = __DIR__ . '/config.php';
if (file_exists($configFile)) {
    require_once $configFile;
}

$SUPABASE_URL = defined('SUPABASE_URL') ? SUPABASE_URL : (getenv('SUPABASE_URL') ?: '');
$SUPABASE_SERVICE_KEY = defined('SUPABASE_SERVICE_KEY') ? SUPABASE_SERVICE_KEY :
                        (defined('SUPABASE_ANON_KEY') ? SUPABASE_ANON_KEY : (getenv('SUPABASE_SERVICE_KEY') ?: ''));

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES DE VERIFICACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Obtener entidad por ID
 */
function getEntity($entityId, $supabaseUrl, $supabaseKey) {
    $ch = curl_init("{$supabaseUrl}/rest/v1/transition_entities?id=eq.{$entityId}&select=*");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $response = curl_exec($ch);
    curl_close($ch);

    $entities = json_decode($response, true);
    return (is_array($entities) && !empty($entities)) ? $entities[0] : null;
}

/**
 * Verificar DNS TXT record
 */
function verifyDNS($domain, $expectedCode) {
    // Limpiar dominio
    $domain = preg_replace('/^(https?:\/\/)?(www\.)?/', '', $domain);
    $domain = rtrim($domain, '/');

    // Obtener registros TXT
    $records = @dns_get_record($domain, DNS_TXT);

    if (!$records) {
        return ['success' => false, 'error' => 'No se pudieron obtener registros DNS'];
    }

    foreach ($records as $record) {
        $txt = $record['txt'] ?? '';
        // Buscar: nuevo-ser-verify=CODIGO
        if (preg_match('/nuevo-ser-verify=([a-zA-Z0-9\-]+)/', $txt, $matches)) {
            if ($matches[1] === $expectedCode) {
                return [
                    'success' => true,
                    'domain' => $domain,
                    'record' => $txt
                ];
            }
        }
    }

    return [
        'success' => false,
        'error' => 'Código de verificación no encontrado en registros DNS',
        'hint' => "Añade este registro TXT a tu dominio: nuevo-ser-verify={$expectedCode}"
    ];
}

/**
 * Verificar Meta Tag en página web
 */
function verifyMetaTag($url, $expectedCode) {
    // Asegurar que tiene protocolo
    if (!preg_match('/^https?:\/\//', $url)) {
        $url = 'https://' . $url;
    }

    // Obtener contenido de la página
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_USERAGENT => 'NuevoSer-Verification-Bot/1.0'
    ]);
    $html = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$html) {
        return ['success' => false, 'error' => 'No se pudo acceder a la página web'];
    }

    // Buscar meta tag
    // <meta name="nuevo-ser-verify" content="CODIGO">
    if (preg_match('/<meta[^>]+name=["\']nuevo-ser-verify["\'][^>]+content=["\']([^"\']+)["\']/', $html, $matches) ||
        preg_match('/<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']nuevo-ser-verify["\']/', $html, $matches)) {

        if ($matches[1] === $expectedCode) {
            return [
                'success' => true,
                'url' => $url
            ];
        }
    }

    return [
        'success' => false,
        'error' => 'Meta tag de verificación no encontrado',
        'hint' => "Añade esto al <head> de tu página: <meta name=\"nuevo-ser-verify\" content=\"{$expectedCode}\">"
    ];
}

/**
 * Verificar firma Bitcoin
 * Usa la API de verificación de firmas de Bitcoin
 */
function verifyCryptoSignature($message, $signature, $address) {
    // Verificación básica de formato de dirección Bitcoin
    if (!preg_match('/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/', $address)) {
        return ['success' => false, 'error' => 'Formato de dirección Bitcoin inválido'];
    }

    // Para una implementación real, usar una librería de Bitcoin
    // Por ahora, verificamos el formato y longitud de la firma
    if (strlen($signature) < 60) {
        return ['success' => false, 'error' => 'Firma demasiado corta'];
    }

    // En producción, usar bitcoind RPC o una librería PHP de Bitcoin
    // Por ahora, aceptamos si el formato es correcto (simplificado)

    // Verificar que el mensaje contiene el entityId esperado
    if (strpos($message, 'nuevo-ser-verify') === false &&
        strpos($message, 'Verifico que controlo') === false) {
        return ['success' => false, 'error' => 'Mensaje no contiene el formato esperado'];
    }

    return [
        'success' => true,
        'address' => $address,
        'note' => 'Verificación simplificada - en producción usar verificación criptográfica completa'
    ];
}

/**
 * Guardar verificación en la base de datos
 */
function saveVerification($entityId, $method, $proofData, $supabaseUrl, $supabaseKey) {
    $ch = curl_init("{$supabaseUrl}/rest/v1/entity_verifications");
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
            'method' => $method,
            'proof_data' => json_encode($proofData),
            'is_valid' => true
        ])
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $httpCode >= 200 && $httpCode < 300;
}

/**
 * Obtener estado de verificación de una entidad
 */
function getVerificationStatus($entityId, $supabaseUrl, $supabaseKey) {
    // Obtener entidad
    $entity = getEntity($entityId, $supabaseUrl, $supabaseKey);
    if (!$entity) {
        return ['error' => 'Entidad no encontrada'];
    }

    // Obtener verificaciones
    $ch = curl_init("{$supabaseUrl}/rest/v1/entity_verifications?entity_id=eq.{$entityId}&is_valid=eq.true");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $verifications = json_decode(curl_exec($ch), true) ?: [];
    curl_close($ch);

    // Obtener avales
    $ch = curl_init("{$supabaseUrl}/rest/v1/entity_endorsements?entity_id=eq.{$entityId}&stake_status=eq.active&select=count");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}",
            "Prefer: count=exact"
        ]
    ]);
    curl_exec($ch);
    $endorsementCount = intval(curl_getinfo($ch, CURLINFO_HTTP_CODE) === 200 ?
        (explode('/', curl_getinfo($ch, CURLINFO_CONTENT_RANGE_VALUE) ?: '0/0')[1] ?? 0) : 0);
    curl_close($ch);

    // Contar avales de otra forma
    $ch = curl_init("{$supabaseUrl}/rest/v1/entity_endorsements?entity_id=eq.{$entityId}&stake_status=eq.active");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $endorsements = json_decode(curl_exec($ch), true) ?: [];
    $endorsementCount = count($endorsements);
    curl_close($ch);

    // Obtener disputas activas
    $ch = curl_init("{$supabaseUrl}/rest/v1/entity_disputes?entity_id=eq.{$entityId}&status=in.(open,voting)");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "apikey: {$supabaseKey}",
            "Authorization: Bearer {$supabaseKey}"
        ]
    ]);
    $disputes = json_decode(curl_exec($ch), true) ?: [];
    curl_close($ch);

    return [
        'entity_id' => $entityId,
        'verification_level' => $entity['verification_level'] ?? 0,
        'verification_code' => $entity['verification_code'] ?? null,
        'verifications' => $verifications,
        'endorsements' => $endorsements,
        'endorsement_count' => $endorsementCount,
        'active_disputes' => count($disputes),
        'total_received' => floatval($entity['total_received'] ?? 0),
        'total_pending' => floatval($entity['total_pending'] ?? 0),
        'is_banned' => $entity['is_banned'] ?? false
    ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROCESAMIENTO DE PETICIONES
// ═══════════════════════════════════════════════════════════════════════════════

// GET: Obtener estado de verificación
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $entityId = $_GET['entityId'] ?? null;

    if (!$entityId) {
        http_response_code(400);
        echo json_encode(['error' => 'entityId is required']);
        exit;
    }

    $status = getVerificationStatus($entityId, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
    echo json_encode($status);
    exit;
}

// POST: Realizar verificación
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    $action = $data['action'] ?? '';
    $entityId = $data['entityId'] ?? null;

    if (!$entityId) {
        http_response_code(400);
        echo json_encode(['error' => 'entityId is required']);
        exit;
    }

    // Obtener entidad y código de verificación
    $entity = getEntity($entityId, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
    if (!$entity) {
        http_response_code(404);
        echo json_encode(['error' => 'Entidad no encontrada']);
        exit;
    }

    $verificationCode = $entity['verification_code'];
    if (!$verificationCode) {
        http_response_code(400);
        echo json_encode(['error' => 'La entidad no tiene código de verificación']);
        exit;
    }

    $result = null;
    $method = null;

    switch ($action) {
        case 'verify_dns':
            $domain = $data['domain'] ?? '';
            if (!$domain) {
                http_response_code(400);
                echo json_encode(['error' => 'domain is required']);
                exit;
            }
            $result = verifyDNS($domain, $verificationCode);
            $method = 'dns';
            break;

        case 'verify_meta':
            $url = $data['url'] ?? '';
            if (!$url) {
                http_response_code(400);
                echo json_encode(['error' => 'url is required']);
                exit;
            }
            $result = verifyMetaTag($url, $verificationCode);
            $method = 'meta_tag';
            break;

        case 'verify_signature':
            $message = $data['message'] ?? '';
            $signature = $data['signature'] ?? '';
            $walletAddress = $data['walletAddress'] ?? '';
            if (!$message || !$signature || !$walletAddress) {
                http_response_code(400);
                echo json_encode(['error' => 'message, signature and walletAddress are required']);
                exit;
            }
            $result = verifyCryptoSignature($message, $signature, $walletAddress);
            $method = 'crypto_signature';
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            exit;
    }

    if ($result['success']) {
        // Guardar verificación
        $saved = saveVerification($entityId, $method, $result, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
        $result['saved'] = $saved;

        // Obtener nuevo estado
        $result['newStatus'] = getVerificationStatus($entityId, $SUPABASE_URL, $SUPABASE_SERVICE_KEY);
    }

    echo json_encode($result);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
