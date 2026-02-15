<?php
/**
 * Proxy para archivos de audio
 * Permite cargar audios desde servicios externos evitando problemas de CORS
 *
 * Uso: audio-proxy.php?url=https://freesound.org/data/previews/...mp3
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
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

// Headers CORS
applyCorsHeaders();

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Solo permitir GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Obtener la URL del parámetro
$audioUrl = $_GET['url'] ?? null;

if (!$audioUrl) {
    http_response_code(400);
    echo json_encode(['error' => 'URL parameter is required']);
    exit;
}

// Validar que la URL es de un dominio permitido (seguridad)
$allowedDomains = [
    'freesound.org',
    'cdn.freesound.org',
    'pixabay.com',
    'cdn.pixabay.com',
    'mixkit.co',
    'assets.mixkit.co'
];

$parsedUrl = parse_url($audioUrl);
$host = $parsedUrl['host'] ?? '';

$isAllowed = false;
foreach ($allowedDomains as $domain) {
    if (strpos($host, $domain) !== false) {
        $isAllowed = true;
        break;
    }
}

if (!$isAllowed) {
    http_response_code(403);
    echo json_encode(['error' => 'Domain not allowed']);
    exit;
}

// Hacer la petición al servidor de audio
$ch = curl_init($audioUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,  // Seguir redirecciones
    CURLOPT_MAXREDIRS => 5,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; ColeccionNuevoSer/2.9)',
    CURLOPT_HTTPHEADER => [
        'Accept: audio/mpeg, audio/*, */*'
    ]
]);

$audioData = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$curlError = curl_error($ch);
curl_close($ch);

// Manejar errores de curl
if ($curlError) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Connection error: ' . $curlError]);
    exit;
}

// Verificar código HTTP
if ($httpCode !== 200) {
    http_response_code($httpCode);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Audio fetch error, HTTP ' . $httpCode]);
    exit;
}

// Enviar el audio con los headers correctos
header('Content-Type: ' . ($contentType ?: 'audio/mpeg'));
header('Content-Length: ' . strlen($audioData));
header('Cache-Control: public, max-age=86400');  // Cache 24 horas
header('Accept-Ranges: bytes');

echo $audioData;
