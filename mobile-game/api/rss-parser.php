<?php
/**
 * RSS PARSER - Sistema de Crisis Dinámicas
 * Parsea noticias de fuentes RSS globales para generar crisis reales
 *
 * FUENTES:
 * - UN News (https://news.un.org)
 * - Reuters (https://www.reuters.com)
 * - BBC World (https://www.bbc.com)
 * - The Guardian (https://www.theguardian.com)
 *
 * @version 1.0.0
 * @author Awakening Protocol Team
 */

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Clase principal del RSS Parser
 */
class RSSParser {

    private $cacheDir;
    private $cacheLifetime = 3600; // 1 hora
    private $maxNewsPerFeed = 20;

    // URLs de feeds RSS
    private $feedSources = [
        'un_news' => [
            'url' => 'https://news.un.org/feed/subscribe/en/news/all/rss.xml',
            'name' => 'UN News',
            'reliability' => 0.95,
            'language' => 'en'
        ],
        'reuters_world' => [
            'url' => 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best',
            'name' => 'Reuters World',
            'reliability' => 0.90,
            'language' => 'en'
        ],
        'bbc_world' => [
            'url' => 'http://feeds.bbci.co.uk/news/world/rss.xml',
            'name' => 'BBC World',
            'reliability' => 0.88,
            'language' => 'en'
        ],
        'guardian_world' => [
            'url' => 'https://www.theguardian.com/world/rss',
            'name' => 'The Guardian',
            'reliability' => 0.85,
            'language' => 'en'
        ]
    ];

    // Keywords para filtrar crisis relevantes
    private $crisisKeywords = [
        'environmental' => [
            'climate', 'disaster', 'flood', 'drought', 'wildfire', 'hurricane',
            'earthquake', 'tsunami', 'pollution', 'deforestation', 'extinction',
            'global warming', 'sea level', 'carbon', 'renewable', 'sustainability'
        ],
        'social' => [
            'protest', 'demonstration', 'rights', 'inequality', 'discrimination',
            'refugee', 'migration', 'violence', 'conflict', 'uprising',
            'civil unrest', 'human rights', 'freedom', 'justice'
        ],
        'economic' => [
            'crisis', 'recession', 'unemployment', 'poverty', 'inflation',
            'debt', 'market crash', 'economic', 'financial', 'bankruptcy',
            'sanctions', 'trade war', 'GDP', 'economy'
        ],
        'humanitarian' => [
            'famine', 'hunger', 'aid', 'emergency', 'relief', 'displaced',
            'homeless', 'crisis', 'suffering', 'victims', 'casualties',
            'humanitarian', 'UN', 'Red Cross', 'WHO'
        ],
        'health' => [
            'pandemic', 'epidemic', 'disease', 'outbreak', 'health crisis',
            'virus', 'infection', 'medical', 'hospital', 'vaccine',
            'mortality', 'WHO', 'healthcare'
        ],
        'educational' => [
            'education crisis', 'school closure', 'literacy', 'access to education',
            'student', 'teacher', 'university', 'learning'
        ],
        'infrastructure' => [
            'collapse', 'damaged infrastructure', 'power outage', 'water shortage',
            'transportation', 'blackout', 'grid', 'bridge collapse'
        ]
    ];

    public function __construct() {
        // Crear directorio de caché si no existe
        $this->cacheDir = __DIR__ . '/../cache/rss/';
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
    }

    /**
     * Endpoint principal: Obtener noticias
     *
     * @param int $limit Número máximo de noticias a retornar
     * @param string $type Tipo de crisis a filtrar (opcional)
     * @return array Noticias formateadas
     */
    public function getNews($limit = 20, $type = null) {
        try {
            // Intentar obtener de caché
            $cached = $this->getFromCache('all_news');

            if ($cached) {
                return $this->formatResponse($cached, $limit, $type);
            }

            // Parsear todos los feeds
            $allNews = [];

            foreach ($this->feedSources as $feedId => $feedInfo) {
                $feedNews = $this->parseFeed($feedInfo);

                if ($feedNews) {
                    $allNews = array_merge($allNews, $feedNews);
                }
            }

            // Filtrar por keywords relevantes
            $filteredNews = $this->filterByKeywords($allNews);

            // Deduplicar noticias similares
            $uniqueNews = $this->deduplicateNews($filteredNews);

            // Ordenar por fecha (más reciente primero)
            usort($uniqueNews, function($a, $b) {
                return strtotime($b['pubDate']) - strtotime($a['pubDate']);
            });

            // Guardar en caché
            $this->saveToCache('all_news', $uniqueNews);

            return $this->formatResponse($uniqueNews, $limit, $type);

        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Parsear un feed RSS individual
     *
     * @param array $feedInfo Información del feed
     * @return array Noticias del feed
     */
    private function parseFeed($feedInfo) {
        try {
            // Timeout de 10 segundos
            $context = stream_context_create([
                'http' => [
                    'timeout' => 10,
                    'user_agent' => 'AwakeningProtocol/1.0'
                ]
            ]);

            $xmlContent = @file_get_contents($feedInfo['url'], false, $context);

            if ($xmlContent === false) {
                error_log("Failed to fetch feed: {$feedInfo['name']}");
                return [];
            }

            // Suprimir warnings de XML malformado
            libxml_use_internal_errors(true);
            $xml = simplexml_load_string($xmlContent);
            libxml_clear_errors();

            if ($xml === false) {
                error_log("Failed to parse XML: {$feedInfo['name']}");
                return [];
            }

            $news = [];
            $count = 0;

            // Manejar diferentes formatos RSS/Atom
            if (isset($xml->channel->item)) {
                // RSS 2.0
                foreach ($xml->channel->item as $item) {
                    if ($count >= $this->maxNewsPerFeed) break;

                    $newsItem = $this->parseRSSItem($item, $feedInfo);
                    if ($newsItem) {
                        $news[] = $newsItem;
                        $count++;
                    }
                }
            } elseif (isset($xml->entry)) {
                // Atom
                foreach ($xml->entry as $entry) {
                    if ($count >= $this->maxNewsPerFeed) break;

                    $newsItem = $this->parseAtomEntry($entry, $feedInfo);
                    if ($newsItem) {
                        $news[] = $newsItem;
                        $count++;
                    }
                }
            }

            return $news;

        } catch (Exception $e) {
            error_log("Error parsing feed {$feedInfo['name']}: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Parsear item RSS 2.0
     */
    private function parseRSSItem($item, $feedInfo) {
        $title = (string) $item->title;
        $description = (string) ($item->description ?? '');
        $link = (string) $item->link;
        $pubDate = (string) $item->pubDate;

        // Extraer imagen si existe
        $imageUrl = null;

        if (isset($item->enclosure) && isset($item->enclosure['url'])) {
            $imageUrl = (string) $item->enclosure['url'];
        } elseif (isset($item->children('media', true)->thumbnail)) {
            $imageUrl = (string) $item->children('media', true)->thumbnail['url'];
        }

        return [
            'title' => trim($title),
            'description' => $this->cleanDescription($description),
            'url' => trim($link),
            'pubDate' => $this->normalizeDate($pubDate),
            'imageUrl' => $imageUrl,
            'source' => $feedInfo['name'],
            'sourceId' => $feedInfo['url'],
            'reliability' => $feedInfo['reliability'],
            'language' => $feedInfo['language']
        ];
    }

    /**
     * Parsear entry Atom
     */
    private function parseAtomEntry($entry, $feedInfo) {
        $title = (string) $entry->title;
        $summary = (string) ($entry->summary ?? '');
        $link = '';

        if (isset($entry->link)) {
            $link = (string) $entry->link['href'];
        }

        $pubDate = (string) ($entry->published ?? $entry->updated);

        return [
            'title' => trim($title),
            'description' => $this->cleanDescription($summary),
            'url' => trim($link),
            'pubDate' => $this->normalizeDate($pubDate),
            'imageUrl' => null,
            'source' => $feedInfo['name'],
            'sourceId' => $feedInfo['url'],
            'reliability' => $feedInfo['reliability'],
            'language' => $feedInfo['language']
        ];
    }

    /**
     * Limpiar descripción HTML
     */
    private function cleanDescription($description) {
        // Remover HTML tags
        $clean = strip_tags($description);

        // Decodificar HTML entities
        $clean = html_entity_decode($clean, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Limitar a 500 caracteres
        if (strlen($clean) > 500) {
            $clean = substr($clean, 0, 497) . '...';
        }

        return trim($clean);
    }

    /**
     * Normalizar fecha a formato ISO 8601
     */
    private function normalizeDate($dateString) {
        try {
            $timestamp = strtotime($dateString);

            if ($timestamp === false) {
                return date('c'); // Fecha actual como fallback
            }

            return date('c', $timestamp);
        } catch (Exception $e) {
            return date('c');
        }
    }

    /**
     * Filtrar noticias por keywords relevantes
     */
    private function filterByKeywords($news) {
        $filtered = [];

        foreach ($news as $newsItem) {
            $text = strtolower($newsItem['title'] . ' ' . $newsItem['description']);

            // Buscar coincidencias con keywords
            $matches = [];

            foreach ($this->crisisKeywords as $category => $keywords) {
                foreach ($keywords as $keyword) {
                    if (stripos($text, $keyword) !== false) {
                        if (!isset($matches[$category])) {
                            $matches[$category] = 0;
                        }
                        $matches[$category]++;
                    }
                }
            }

            // Si tiene al menos 1 match, incluir
            if (!empty($matches)) {
                // Ordenar categorías por número de matches
                arsort($matches);

                $newsItem['detectedCategories'] = array_keys($matches);
                $newsItem['primaryCategory'] = array_keys($matches)[0];
                $newsItem['relevanceScore'] = array_sum($matches);

                $filtered[] = $newsItem;
            }
        }

        // Ordenar por relevancia
        usort($filtered, function($a, $b) {
            return $b['relevanceScore'] - $a['relevanceScore'];
        });

        return $filtered;
    }

    /**
     * Deduplicar noticias similares
     */
    private function deduplicateNews($news) {
        $unique = [];
        $seenTitles = [];

        foreach ($news as $newsItem) {
            // Normalizar título para comparación
            $normalizedTitle = $this->normalizeForComparison($newsItem['title']);

            // Verificar si ya existe una noticia muy similar
            $isDuplicate = false;

            foreach ($seenTitles as $seenTitle) {
                $similarity = 0;
                similar_text($normalizedTitle, $seenTitle, $similarity);

                if ($similarity > 80) { // 80% de similitud
                    $isDuplicate = true;
                    break;
                }
            }

            if (!$isDuplicate) {
                $unique[] = $newsItem;
                $seenTitles[] = $normalizedTitle;
            }
        }

        return $unique;
    }

    /**
     * Normalizar texto para comparación
     */
    private function normalizeForComparison($text) {
        $text = strtolower($text);
        $text = preg_replace('/[^a-z0-9\s]/', '', $text);
        $text = preg_replace('/\s+/', ' ', $text);
        return trim($text);
    }

    /**
     * Obtener noticias del caché
     */
    private function getFromCache($key) {
        $cacheFile = $this->cacheDir . md5($key) . '.json';

        if (file_exists($cacheFile)) {
            $cacheTime = filemtime($cacheFile);

            if ((time() - $cacheTime) < $this->cacheLifetime) {
                $cached = file_get_contents($cacheFile);
                return json_decode($cached, true);
            }
        }

        return null;
    }

    /**
     * Guardar noticias en caché
     */
    private function saveToCache($key, $data) {
        $cacheFile = $this->cacheDir . md5($key) . '.json';
        file_put_contents($cacheFile, json_encode($data, JSON_PRETTY_PRINT));
    }

    /**
     * Formatear respuesta
     */
    private function formatResponse($news, $limit, $type = null) {
        // Filtrar por tipo si se especifica
        if ($type) {
            $news = array_filter($news, function($item) use ($type) {
                return isset($item['primaryCategory']) && $item['primaryCategory'] === $type;
            });
        }

        // Limitar resultados
        $news = array_slice($news, 0, $limit);

        return [
            'status' => 'success',
            'data' => [
                'news' => array_values($news),
                'count' => count($news),
                'cached' => true,
                'timestamp' => time()
            ]
        ];
    }

    /**
     * Respuesta de error
     */
    private function errorResponse($message) {
        return [
            'status' => 'error',
            'message' => $message,
            'timestamp' => time()
        ];
    }

    /**
     * Health check
     */
    public function healthCheck() {
        return [
            'status' => 'success',
            'service' => 'RSS Parser',
            'version' => '1.0.0',
            'feeds_configured' => count($this->feedSources),
            'cache_dir_writable' => is_writable($this->cacheDir),
            'timestamp' => time()
        ];
    }
}

// ═══════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════

$parser = new RSSParser();

$action = $_GET['action'] ?? 'get_news';
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
$type = $_GET['type'] ?? null;

switch ($action) {
    case 'get_news':
        $response = $parser->getNews($limit, $type);
        break;

    case 'health':
        $response = $parser->healthCheck();
        break;

    default:
        http_response_code(404);
        $response = [
            'status' => 'error',
            'message' => 'Unknown action',
            'available_actions' => ['get_news', 'health']
        ];
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
