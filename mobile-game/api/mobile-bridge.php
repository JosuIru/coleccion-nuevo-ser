<?php
/**
 * MOBILE BRIDGE API
 * API de SOLO LECTURA para el juego móvil
 *
 * PRINCIPIOS:
 * - NUNCA modifica datos del sistema web
 * - SOLO lee datos existentes
 * - Retorna copias, no referencias
 * - Completamente aislado del sistema principal
 *
 * @version 1.0.1
 * @author Awakening Protocol Team
 */

// Error reporting en desarrollo
if (defined('DEV_MODE') && DEV_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Logging de errores
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/mobile-bridge-errors.log');

// CORS para permitir requests desde app móvil (restringir en producción)
$allowed_origins = [
    'http://localhost:8081',
    'capacitor://localhost',
    'https://tudominio.com'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: *'); // Solo desarrollo
}

header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Solo GET permitido (seguridad extra)
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Only GET requests allowed. This API is READ-ONLY.'
    ]);
    exit;
}

// Manejar OPTIONS para CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Rate limiting básico
session_start();
$rate_limit_key = 'api_requests_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$max_requests_per_minute = 60;

if (!isset($_SESSION[$rate_limit_key])) {
    $_SESSION[$rate_limit_key] = ['count' => 0, 'reset_time' => time() + 60];
}

$rate_data = $_SESSION[$rate_limit_key];

if (time() > $rate_data['reset_time']) {
    $_SESSION[$rate_limit_key] = ['count' => 1, 'reset_time' => time() + 60];
} else {
    $rate_data['count']++;

    if ($rate_data['count'] > $max_requests_per_minute) {
        http_response_code(429);
        echo json_encode([
            'status' => 'error',
            'message' => 'Rate limit exceeded. Max ' . $max_requests_per_minute . ' requests per minute.',
            'retry_after' => $rate_data['reset_time'] - time()
        ]);
        exit;
    }

    $_SESSION[$rate_limit_key] = $rate_data;
}

/**
 * Clase principal del Bridge
 * Solo lectura, no modifica nada
 */
class MobileBridgeAPI {

    private $supabaseUrl;
    private $supabaseKey;

    public function __construct() {
        // Cargar configuración de Supabase si existe
        $configPath = __DIR__ . '/../../www/js/core/supabase-config.js';

        if (file_exists($configPath)) {
            // Extraer URL y key del archivo JS (lectura simple)
            $config = file_get_contents($configPath);

            // Buscar SUPABASE_URL y SUPABASE_ANON_KEY
            preg_match("/SUPABASE_URL\s*=\s*['\"]([^'\"]+)['\"]/", $config, $urlMatch);
            preg_match("/SUPABASE_ANON_KEY\s*=\s*['\"]([^'\"]+)['\"]/", $config, $keyMatch);

            $this->supabaseUrl = $urlMatch[1] ?? null;
            $this->supabaseKey = $keyMatch[1] ?? null;
        }
    }

    /**
     * Obtener seres de un usuario
     * Lee de Supabase (vista READ-ONLY)
     *
     * @param string $userId UUID del usuario
     * @return array Seres del usuario
     */
    public function getBeings($userId) {
        if (!$this->validateUserId($userId)) {
            $this->logError('Invalid user ID provided', ['userId' => $userId]);
            return $this->errorResponse('Invalid user ID format');
        }

        try {
            // Si hay Supabase, leer de ahí
            if ($this->supabaseUrl && $this->supabaseKey) {
                $beings = $this->readFromSupabase('frankenstein_beings', [
                    'user_id' => $userId
                ]);
            } else {
                // Fallback: leer de archivo JSON local
                $beings = $this->readFromLocalStorage($userId, 'frankenstein_beings');
            }

            // Validar estructura de datos
            if (!is_array($beings)) {
                $beings = [];
            }

            return $this->successResponse([
                'beings' => $beings,
                'count' => count($beings),
                'source' => $this->supabaseUrl ? 'supabase' : 'local'
            ]);

        } catch (Exception $e) {
            $this->logError('Error getting beings', [
                'userId' => $userId,
                'error' => $e->getMessage()
            ]);
            return $this->errorResponse('Failed to retrieve beings');
        }
    }

    /**
     * Obtener progreso de lectura
     *
     * @param string $userId UUID del usuario
     * @return array Progreso de lectura
     */
    public function getReadingProgress($userId) {
        if (!$this->validateUserId($userId)) {
            return $this->errorResponse('Invalid user ID');
        }

        try {
            if ($this->supabaseUrl && $this->supabaseKey) {
                $progress = $this->readFromSupabase('reading_progress', [
                    'user_id' => $userId
                ]);
            } else {
                $progress = $this->readFromLocalStorage($userId, 'reading_progress');
            }

            return $this->successResponse([
                'progress' => $progress ?? [],
                'source' => $this->supabaseUrl ? 'supabase' : 'local'
            ]);

        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Obtener microsociedades del usuario
     *
     * @param string $userId UUID del usuario
     * @return array Microsociedades
     */
    public function getMicrosocieties($userId) {
        if (!$this->validateUserId($userId)) {
            return $this->errorResponse('Invalid user ID');
        }

        try {
            if ($this->supabaseUrl && $this->supabaseKey) {
                $societies = $this->readFromSupabase('microsocieties', [
                    'user_id' => $userId
                ]);
            } else {
                $societies = $this->readFromLocalStorage($userId, 'microsocieties');
            }

            return $this->successResponse([
                'societies' => $societies ?? [],
                'count' => count($societies ?? []),
                'source' => $this->supabaseUrl ? 'supabase' : 'local'
            ]);

        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Obtener catálogo de libros
     * (Público, no requiere user ID)
     */
    public function getBooksCatalog() {
        try {
            $catalogPath = __DIR__ . '/../../www/books/catalog.json';

            if (!file_exists($catalogPath)) {
                return $this->errorResponse('Catalog not found');
            }

            $catalog = json_decode(file_get_contents($catalogPath), true);

            return $this->successResponse([
                'catalog' => $catalog,
                'source' => 'local'
            ]);

        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Health check
     */
    public function healthCheck() {
        return $this->successResponse([
            'status' => 'healthy',
            'version' => '1.0.0',
            'mode' => 'read-only',
            'timestamp' => time(),
            'supabase_configured' => !empty($this->supabaseUrl)
        ]);
    }

    // ═══════════════════════════════════════════════════════════
    // HELPERS PRIVADOS
    // ═══════════════════════════════════════════════════════════

    /**
     * Lee datos de Supabase (tabla o vista READ-ONLY)
     */
    private function readFromSupabase($table, $filters = []) {
        if (!$this->supabaseUrl || !$this->supabaseKey) {
            throw new Exception('Supabase not configured');
        }

        // Validar nombre de tabla (prevenir inyección)
        $allowed_tables = [
            'frankenstein_beings',
            'reading_progress',
            'microsocieties'
        ];

        if (!in_array($table, $allowed_tables, true)) {
            throw new Exception('Invalid table name');
        }

        // Construir URL con filtros
        $url = $this->supabaseUrl . '/rest/v1/' . $table;

        $queryParams = [];
        foreach ($filters as $key => $value) {
            // Sanitizar clave y valor
            $sanitized_key = preg_replace('/[^a-z_]/', '', $key);
            $sanitized_value = $this->sanitizeInput($value);
            $queryParams[] = $sanitized_key . '=eq.' . urlencode($sanitized_value);
        }

        if (!empty($queryParams)) {
            $url .= '?' . implode('&', $queryParams);
        }

        // Request GET (solo lectura)
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10); // Timeout de 10 segundos
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true); // Verificar SSL
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . $this->supabaseKey,
            'Authorization: Bearer ' . $this->supabaseKey,
            'Content-Type: application/json'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_error = curl_error($ch);
        curl_close($ch);

        if ($curl_error) {
            $this->logError('CURL error', ['error' => $curl_error, 'table' => $table]);
            throw new Exception('Network error occurred');
        }

        if ($httpCode !== 200) {
            $this->logError('Supabase request failed', [
                'httpCode' => $httpCode,
                'table' => $table,
                'response' => substr($response, 0, 200)
            ]);
            throw new Exception('Database request failed');
        }

        $decoded_response = json_decode($response, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->logError('JSON decode error', ['error' => json_last_error_msg()]);
            throw new Exception('Invalid response format');
        }

        return $decoded_response;
    }

    /**
     * Lee datos de localStorage guardado en archivos JSON
     * (Fallback si no hay Supabase)
     */
    private function readFromLocalStorage($userId, $key) {
        // Ruta donde se guardarían datos de usuario
        $userDataPath = __DIR__ . "/../../data/users/{$userId}/{$key}.json";

        if (!file_exists($userDataPath)) {
            return null;
        }

        $data = file_get_contents($userDataPath);
        return json_decode($data, true);
    }

    /**
     * Valida UUID de usuario
     */
    private function validateUserId($userId) {
        if (empty($userId) || !is_string($userId)) {
            return false;
        }

        // Validar formato UUID v4
        $pattern = '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i';
        return preg_match($pattern, $userId) === 1;
    }

    /**
     * Sanitiza parámetros de entrada
     */
    private function sanitizeInput($input) {
        if (is_string($input)) {
            return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
        }
        return $input;
    }

    /**
     * Valida parámetro de acción
     */
    private function validateAction($action) {
        $allowed_actions = [
            'health',
            'get_beings',
            'get_progress',
            'get_societies',
            'get_catalog'
        ];

        return in_array($action, $allowed_actions, true);
    }

    /**
     * Log de errores con contexto
     */
    private function logError($message, $context = []) {
        $log_entry = sprintf(
            "[%s] %s | Context: %s | IP: %s\n",
            date('Y-m-d H:i:s'),
            $message,
            json_encode($context),
            $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        );

        error_log($log_entry);
    }

    /**
     * Formato de respuesta exitosa
     */
    private function successResponse($data) {
        return [
            'status' => 'success',
            'data' => $data,
            'timestamp' => time()
        ];
    }

    /**
     * Formato de respuesta de error
     */
    private function errorResponse($message) {
        return [
            'status' => 'error',
            'message' => $message,
            'timestamp' => time()
        ];
    }
}

// ═══════════════════════════════════════════════════════════
// ROUTER - Maneja las diferentes acciones
// ═══════════════════════════════════════════════════════════

try {
    $api = new MobileBridgeAPI();

    // Obtener y sanitizar acción del query string
    $action = $_GET['action'] ?? 'health';
    $action = $api->sanitizeInput($action);

    // Validar acción
    if (!$api->validateAction($action)) {
        http_response_code(400);
        $response = [
            'status' => 'error',
            'message' => 'Invalid action',
            'available_actions' => [
                'health',
                'get_beings',
                'get_progress',
                'get_societies',
                'get_catalog'
            ]
        ];
        echo json_encode($response, JSON_PRETTY_PRINT);
        exit;
    }

    // Obtener y sanitizar user_id
    $userId = isset($_GET['user_id']) ? $api->sanitizeInput($_GET['user_id']) : null;

    // Enrutar según la acción
    switch ($action) {
        case 'health':
            $response = $api->healthCheck();
            break;

        case 'get_beings':
            if (!$userId) {
                http_response_code(400);
                $response = ['status' => 'error', 'message' => 'user_id parameter is required'];
            } else {
                $response = $api->getBeings($userId);
            }
            break;

        case 'get_progress':
            if (!$userId) {
                http_response_code(400);
                $response = ['status' => 'error', 'message' => 'user_id parameter is required'];
            } else {
                $response = $api->getReadingProgress($userId);
            }
            break;

        case 'get_societies':
            if (!$userId) {
                http_response_code(400);
                $response = ['status' => 'error', 'message' => 'user_id parameter is required'];
            } else {
                $response = $api->getMicrosocieties($userId);
            }
            break;

        case 'get_catalog':
            $response = $api->getBooksCatalog();
            break;

        default:
            http_response_code(404);
            $response = [
                'status' => 'error',
                'message' => 'Unknown action',
                'available_actions' => [
                    'health',
                    'get_beings',
                    'get_progress',
                    'get_societies',
                    'get_catalog'
                ]
            ];
    }

    // Retornar respuesta JSON
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    // Manejo global de errores
    http_response_code(500);

    $error_response = [
        'status' => 'error',
        'message' => 'An unexpected error occurred'
    ];

    // En desarrollo, incluir detalles del error
    if (defined('DEV_MODE') && DEV_MODE) {
        $error_response['debug'] = [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ];
    }

    error_log('Unhandled exception: ' . $e->getMessage());
    echo json_encode($error_response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
