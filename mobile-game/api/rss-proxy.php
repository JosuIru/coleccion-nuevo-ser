<?php
/**
 * RSS Proxy para Awakening Protocol
 *
 * Permite fetch de RSS feeds evitando problemas de CORS.
 * Cachea respuestas por 1 hora para reducir carga.
 *
 * @version 1.0.0
 * @date 2025-12-17
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Solo GET permitido
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

define('CACHE_DIR', __DIR__ . '/cache/rss/');
define('CACHE_LIFETIME', 3600); // 1 hora en segundos

// Feeds permitidos (whitelist por seguridad)
$ALLOWED_FEEDS = [
    'un_news' => 'https://news.un.org/feed/subscribe/en/news/all/rss.xml',
    'bbc_world' => 'https://feeds.bbci.co.uk/news/world/rss.xml',
    'guardian_env' => 'https://www.theguardian.com/environment/rss',
    'guardian_world' => 'https://www.theguardian.com/world/rss',
    'aljazeera' => 'https://www.aljazeera.com/xml/rss/all.xml'
];

// ============================================================================
// FUNCIONES
// ============================================================================

/**
 * Obtener feed RSS y parsearlo
 */
function fetchAndParseRSS($url, $feedId) {
    // Verificar caché
    $cacheFile = CACHE_DIR . $feedId . '.json';

    if (file_exists($cacheFile)) {
        $cacheTime = filemtime($cacheFile);
        if (time() - $cacheTime < CACHE_LIFETIME) {
            $cached = file_get_contents($cacheFile);
            if ($cached) {
                return json_decode($cached, true);
            }
        }
    }

    // Fetch del feed
    $context = stream_context_create([
        'http' => [
            'timeout' => 15,
            'user_agent' => 'Awakening Protocol RSS Fetcher/1.0'
        ]
    ]);

    $xmlContent = @file_get_contents($url, false, $context);

    if ($xmlContent === false) {
        return ['error' => 'Failed to fetch feed', 'url' => $url];
    }

    // Parsear XML
    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($xmlContent);

    if ($xml === false) {
        return ['error' => 'Failed to parse XML'];
    }

    // Extraer artículos
    $articles = [];
    $items = $xml->channel->item ?? $xml->item ?? [];

    foreach ($items as $item) {
        $articles[] = [
            'title' => cleanText((string)$item->title),
            'description' => cleanText((string)$item->description),
            'link' => (string)$item->link,
            'pubDate' => (string)$item->pubDate,
            'guid' => (string)($item->guid ?? $item->link),
            'source' => $feedId
        ];

        // Máximo 20 artículos por feed
        if (count($articles) >= 20) break;
    }

    $result = [
        'feed' => $feedId,
        'fetched_at' => date('c'),
        'count' => count($articles),
        'articles' => $articles
    ];

    // Guardar en caché
    if (!is_dir(CACHE_DIR)) {
        mkdir(CACHE_DIR, 0755, true);
    }
    file_put_contents($cacheFile, json_encode($result));

    return $result;
}

/**
 * Limpiar texto de HTML y entidades
 */
function cleanText($text) {
    $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = strip_tags($text);
    $text = preg_replace('/\s+/', ' ', $text);
    return trim($text);
}

/**
 * Obtener todos los feeds
 */
function fetchAllFeeds($allowedFeeds) {
    $allArticles = [];
    $errors = [];

    foreach ($allowedFeeds as $feedId => $url) {
        $result = fetchAndParseRSS($url, $feedId);

        if (isset($result['error'])) {
            $errors[] = ['feed' => $feedId, 'error' => $result['error']];
        } else {
            $allArticles = array_merge($allArticles, $result['articles']);
        }
    }

    // Ordenar por fecha (más recientes primero)
    usort($allArticles, function($a, $b) {
        return strtotime($b['pubDate']) - strtotime($a['pubDate']);
    });

    return [
        'success' => true,
        'fetched_at' => date('c'),
        'total_articles' => count($allArticles),
        'errors' => $errors,
        'articles' => array_slice($allArticles, 0, 50) // Máximo 50 artículos
    ];
}

// ============================================================================
// MANEJO DE PETICIONES
// ============================================================================

$action = $_GET['action'] ?? 'all';
$feedId = $_GET['feed'] ?? null;

try {
    switch ($action) {
        case 'single':
            // Obtener un feed específico
            if (!$feedId || !isset($ALLOWED_FEEDS[$feedId])) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid or missing feed ID']);
                exit;
            }
            $result = fetchAndParseRSS($ALLOWED_FEEDS[$feedId], $feedId);
            break;

        case 'all':
        default:
            // Obtener todos los feeds
            $result = fetchAllFeeds($ALLOWED_FEEDS);
            break;
    }

    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}
