<?php
/**
 * ADMIN DEBUG API - API para panel admin de debug
 * Devuelve logs, errores, estado de features
 *
 * @version 2.0.0
 */

// Forzar recarga de caché PHP
if (function_exists('opcache_invalidate')) {
    opcache_invalidate(__FILE__, true);
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/logger-service.php';
require_once __DIR__ . '/error-logger.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verificar que sea admin (simplificado - verificar via token)
$adminEmail = 'irurag@gmail.com';
$isAdmin = isset($_GET['admin_token']) && $_GET['admin_token'] === hash('sha256', $adminEmail . 'debug-key');

if (!$isAdmin && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$action = $_GET['action'] ?? 'logs';

switch ($action) {
    case 'logs':
        handleLogs();
        break;
    case 'errors':
        handleErrors();
        break;
    case 'stats':
        handleStats();
        break;
    case 'health':
        handleHealth();
        break;
    case 'features':
        handleFeatures();
        break;
    case 'tests':
        handleTests();
        break;
    case 'debug-paths':
        handleDebugPaths();
        break;
    case 'check-paths':
        // Endpoint alternativo para evitar caché
        $bp = dirname(__DIR__) . '/desarrollo/cns/';
        echo json_encode([
            'v' => '3.0',
            'base' => $bp,
            'js_ok' => is_dir($bp . 'js/'),
            'feat_ok' => is_dir($bp . 'js/features/'),
            'dirs' => is_dir($bp) ? array_values(array_filter(scandir($bp), fn($i) => $i !== '.' && $i !== '..')) : []
        ], JSON_PRETTY_PRINT);
        break;
    case 'js-check':
        // Test rápido de archivos JS
        $bp = dirname(__DIR__) . '/desarrollo/cns/';
        $core = ['app-initialization.js','auth-helper.js','biblioteca.js','event-bus.js','i18n.js','logger.js','plans-config.js','supabase-config.js','supabase-sync-helper.js','theme-helper.js','toast.js','tts-providers.js'];
        $services = ['LearningPathService.js','BaseService.js','BookService.js','UserService.js','SyncBridgeService.js'];
        $coreOk = 0; $svcOk = 0;
        foreach($core as $f) if(file_exists($bp.'js/core/'.$f)) $coreOk++;
        foreach($services as $f) if(file_exists($bp.'js/services/'.$f)) $svcOk++;
        echo json_encode(['v'=>'4.0','core'=>$coreOk.'/'.count($core),'services'=>$svcOk.'/'.count($services)]);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
}

function handleDebugPaths() {
    $basePath = getBasePath();
    $result = [
        'version' => '2.0',
        'basePath' => $basePath,
        'jsPath' => $basePath . 'js/',
        'featuresPath' => $basePath . 'js/features/',
        'js_exists' => is_dir($basePath . 'js/'),
        'features_exists' => is_dir($basePath . 'js/features/'),
        'app_contents' => []
    ];

    // Listar qué hay en la carpeta de la app
    $items = @scandir($basePath);
    if ($items) {
        $result['app_contents'] = array_values(array_filter($items, function($i) {
            return $i !== '.' && $i !== '..';
        }));
    }

    echo json_encode($result, JSON_PRETTY_PRINT);
}

/**
 * Devuelve la ruta base del proyecto
 * En servidor: /home/gailu/www/ (api está en /home/gailu/www/api/)
 */
function detectBasePath() {
    $basePath = dirname(__DIR__) . '/';
    return [
        'basePath' => $basePath,
        'jsPath' => $basePath . 'js/',
        'featuresPath' => $basePath . 'js/features/'
    ];
}

/**
 * Obtiene la ruta base detectada o usa fallback
 */
function getBasePath() {
    // La app está en /desarrollo/cns/, el API en /api/
    return dirname(__DIR__) . '/desarrollo/cns/';
}

function handleLogs() {
    $limit = $_GET['limit'] ?? 100;
    $level = $_GET['level'] ?? null;
    $source = $_GET['source'] ?? null;

    $loggerService = $GLOBALS['loggerService'] ?? new LoggerService();
    $logs = $loggerService->getLogs($limit, $level, $source);

    echo json_encode([
        'status' => 'success',
        'logs' => $logs,
        'total' => count($logs)
    ]);
}

function handleErrors() {
    $supabaseUrl = SUPABASE_URL;
    $serviceKey = SUPABASE_SERVICE_KEY;

    $ch = curl_init("$supabaseUrl/rest/v1/api_errors_log?order=created_at.desc&limit=50");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $serviceKey,
            'Authorization: Bearer ' . $serviceKey
        ],
        CURLOPT_TIMEOUT => 10
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $errors = json_decode($response, true);
        echo json_encode([
            'status' => 'success',
            'errors' => $errors,
            'total' => count($errors)
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Could not fetch errors'
        ]);
    }
}

function handleStats() {
    $loggerService = $GLOBALS['loggerService'] ?? new LoggerService();
    $stats = $loggerService->getStats();

    echo json_encode([
        'status' => 'success',
        'stats' => $stats,
        'timestamp' => date('c')
    ]);
}

function handleHealth() {
    $health = [
        'status' => 'ok',
        'timestamp' => date('c'),
        'services' => [
            'api' => checkAPIHealth(),
            'supabase' => checkSupabaseHealth(),
            'claude' => checkClaudeHealth()
        ]
    ];

    echo json_encode($health);
}

function handleFeatures() {
    // Usar detección automática de ruta
    $baseDir = getBasePath();
    $featuresDir = $baseDir . 'js/features/';

    // Lista completa de features con nombres descriptivos
    $featuresList = [
        // === BACKEND / API ===
        'chat_support' => ['name' => 'Chat de Soporte IA', 'category' => 'API'],
        'error_logging' => ['name' => 'Sistema de Errores', 'category' => 'API'],
        'system_logging' => ['name' => 'Logging del Sistema', 'category' => 'API'],
        'admin_panel' => ['name' => 'Panel Admin', 'category' => 'API'],
        'tokens_system' => ['name' => 'Sistema de Tokens', 'category' => 'API'],
        'elevenlabs_tts' => ['name' => 'Audio Premium ElevenLabs', 'category' => 'API'],

        // === IA / INTELIGENCIA ARTIFICIAL ===
        'ai-chat-modal' => ['name' => 'Chat IA Modal', 'category' => 'IA'],
        'ai-practice-generator' => ['name' => 'Generador de Prácticas IA', 'category' => 'IA'],
        'ai-premium' => ['name' => 'IA Premium', 'category' => 'IA'],
        'ai-settings-modal' => ['name' => 'Configuración IA', 'category' => 'IA'],
        'ai-suggestions' => ['name' => 'Sugerencias IA', 'category' => 'IA'],
        'auto-summary' => ['name' => 'Resumen Automático IA', 'category' => 'IA'],
        'koan-generator' => ['name' => 'Generador de Koans', 'category' => 'IA'],
        'resource-ai-helper' => ['name' => 'Asistente IA Recursos', 'category' => 'IA'],

        // === AUDIO ===
        'audio-enhancements' => ['name' => 'Mejoras de Audio', 'category' => 'Audio'],
        'audio-mixer' => ['name' => 'Mezclador de Audio', 'category' => 'Audio'],
        'audio-processor' => ['name' => 'Procesador de Audio', 'category' => 'Audio'],
        'audio-visualizer' => ['name' => 'Visualizador de Audio', 'category' => 'Audio'],
        'binaural-audio' => ['name' => 'Audio Binaural', 'category' => 'Audio'],
        'binaural-modal' => ['name' => 'Modal Binaural', 'category' => 'Audio'],
        'enhanced-audioreader' => ['name' => 'AudioReader Mejorado', 'category' => 'Audio'],
        'podcast-player' => ['name' => 'Reproductor Podcast', 'category' => 'Audio'],
        'radical-audio-system' => ['name' => 'Sistema Audio Radical', 'category' => 'Audio'],
        'soundscape-cache' => ['name' => 'Caché de Soundscapes', 'category' => 'Audio'],
        'word-by-word-sync' => ['name' => 'Sincronización Palabra a Palabra', 'category' => 'Audio'],

        // === AUDIOREADER ===
        'audioreader-bookmarks' => ['name' => 'Marcadores AudioReader', 'category' => 'AudioReader'],
        'audioreader-meditation' => ['name' => 'Meditación AudioReader', 'category' => 'AudioReader'],
        'audioreader-position' => ['name' => 'Posición AudioReader', 'category' => 'AudioReader'],
        'audioreader-sleep-timer' => ['name' => 'Timer de Sueño', 'category' => 'AudioReader'],

        // === GAMIFICACIÓN ===
        'achievements-system' => ['name' => 'Sistema de Logros', 'category' => 'Gamificación'],
        'leaderboards' => ['name' => 'Tablas de Clasificación', 'category' => 'Gamificación'],
        'streak-system' => ['name' => 'Sistema de Rachas', 'category' => 'Gamificación'],

        // === APRENDIZAJE ===
        'flashcards-system' => ['name' => 'Sistema de Flashcards', 'category' => 'Aprendizaje'],
        'interactive-quiz' => ['name' => 'Quiz Interactivo', 'category' => 'Aprendizaje'],
        'learning-paths' => ['name' => 'Rutas de Aprendizaje', 'category' => 'Aprendizaje'],
        'micro-courses' => ['name' => 'Micro Cursos', 'category' => 'Aprendizaje'],
        'concept-maps' => ['name' => 'Mapas Conceptuales', 'category' => 'Aprendizaje'],

        // === PRÁCTICAS / MEDITACIÓN ===
        'practice-library' => ['name' => 'Biblioteca de Prácticas', 'category' => 'Prácticas'],
        'practice-recommender' => ['name' => 'Recomendador de Prácticas', 'category' => 'Prácticas'],
        'practice-timer' => ['name' => 'Timer de Práctica', 'category' => 'Prácticas'],
        'meditation-scripts-parser' => ['name' => 'Parser de Meditaciones', 'category' => 'Prácticas'],
        'radical-meditation-parser' => ['name' => 'Parser Meditación Radical', 'category' => 'Prácticas'],

        // === LECTURA ===
        'smart-reader' => ['name' => 'Lector Inteligente', 'category' => 'Lectura'],
        'chapter-comments' => ['name' => 'Comentarios de Capítulo', 'category' => 'Lectura'],
        'chapter-resources-modal' => ['name' => 'Recursos de Capítulo', 'category' => 'Lectura'],
        'contextual-hints' => ['name' => 'Pistas Contextuales', 'category' => 'Lectura'],
        'daily-reading-widget' => ['name' => 'Widget Lectura Diaria', 'category' => 'Lectura'],
        'text-selection-helper' => ['name' => 'Ayudante Selección Texto', 'category' => 'Lectura'],
        'thematic-index-modal' => ['name' => 'Índice Temático', 'category' => 'Lectura'],
        'timeline-viewer' => ['name' => 'Visor de Línea Temporal', 'category' => 'Lectura'],

        // === NOTAS ===
        'notes-modal' => ['name' => 'Modal de Notas', 'category' => 'Notas'],
        'smart-notes' => ['name' => 'Notas Inteligentes', 'category' => 'Notas'],
        'voice-notes' => ['name' => 'Notas de Voz', 'category' => 'Notas'],

        // === NAVEGACIÓN / UI ===
        'command-palette' => ['name' => 'Paleta de Comandos', 'category' => 'UI'],
        'cosmos-navigation' => ['name' => 'Navegación Cosmos', 'category' => 'UI'],
        'exploration-hub' => ['name' => 'Hub de Exploración', 'category' => 'UI'],
        'fab-menu' => ['name' => 'Menú FAB', 'category' => 'UI'],
        'radial-menu' => ['name' => 'Menú Radial', 'category' => 'UI'],
        'search-modal' => ['name' => 'Modal de Búsqueda', 'category' => 'UI'],
        'transition-globe' => ['name' => 'Globo de Transición', 'category' => 'UI'],

        // === RECURSOS ===
        'brujula-recursos' => ['name' => 'Brújula de Recursos', 'category' => 'Recursos'],
        'brujula-recursos-ui' => ['name' => 'UI Brújula Recursos', 'category' => 'Recursos'],
        'resources-viewer' => ['name' => 'Visor de Recursos', 'category' => 'Recursos'],

        // === SOCIAL / COMPARTIR ===
        'reading-circles' => ['name' => 'Círculos de Lectura', 'category' => 'Social'],
        'shareable-moments' => ['name' => 'Momentos Compartibles', 'category' => 'Social'],
        'quote-image-generator' => ['name' => 'Generador de Citas', 'category' => 'Social'],
        'certificate-generator' => ['name' => 'Generador de Certificados', 'category' => 'Social'],

        // === CUENTA / AUTH ===
        'auth-modal' => ['name' => 'Modal Autenticación', 'category' => 'Cuenta'],
        'my-account-modal' => ['name' => 'Mi Cuenta', 'category' => 'Cuenta'],
        'token-purchase-modal' => ['name' => 'Compra de Tokens', 'category' => 'Cuenta'],
        'pricing-modal' => ['name' => 'Modal de Precios', 'category' => 'Cuenta'],
        'donations-modal' => ['name' => 'Modal de Donaciones', 'category' => 'Cuenta'],
        'entity-donation-modal' => ['name' => 'Donación a Entidades', 'category' => 'Cuenta'],

        // === CONFIGURACIÓN ===
        'settings-modal' => ['name' => 'Modal Configuración', 'category' => 'Config'],
        'language-selector' => ['name' => 'Selector de Idioma', 'category' => 'Config'],
        'content-adapter' => ['name' => 'Adaptador de Contenido', 'category' => 'Config'],

        // === PROGRESO ===
        'progress-dashboard' => ['name' => 'Dashboard de Progreso', 'category' => 'Progreso'],
        'action-plans' => ['name' => 'Planes de Acción', 'category' => 'Progreso'],

        // === AYUDA / ONBOARDING ===
        'help-center-modal' => ['name' => 'Centro de Ayuda', 'category' => 'Ayuda'],
        'onboarding-tutorial' => ['name' => 'Tutorial Onboarding', 'category' => 'Ayuda'],
        'welcome-flow' => ['name' => 'Flujo de Bienvenida', 'category' => 'Ayuda'],
        'support-chat' => ['name' => 'Chat de Soporte', 'category' => 'Ayuda'],

        // === OTROS ===
        'admin-debug-panel' => ['name' => 'Panel Debug Admin', 'category' => 'Admin'],
        'admin-panel-modal' => ['name' => 'Modal Panel Admin', 'category' => 'Admin'],
        'educators-kit' => ['name' => 'Kit para Educadores', 'category' => 'Educación'],
        'entity-verification-system' => ['name' => 'Verificación de Entidades', 'category' => 'Verificación'],
        'external-integrations' => ['name' => 'Integraciones Externas', 'category' => 'Integraciones'],
        'koan-modal' => ['name' => 'Modal de Koans', 'category' => 'Contenido'],
        'reflexive-modal' => ['name' => 'Modal Reflexivo', 'category' => 'Contenido'],
        'update-modal' => ['name' => 'Modal de Actualizaciones', 'category' => 'Sistema']
    ];

    $features = [];

    foreach ($featuresList as $key => $info) {
        // Las features de API siempre están activas
        if ($info['category'] === 'API') {
            $enabled = true;
        } else {
            // Verificar si el archivo JS existe
            $filePath = $featuresDir . $key . '.js';
            $enabled = file_exists($filePath);
        }

        $features[$key] = [
            'name' => $info['name'],
            'category' => $info['category'],
            'enabled' => $enabled,
            'status' => $enabled ? 'active' : 'inactive'
        ];
    }

    // Ordenar por categoría
    uasort($features, function($a, $b) {
        return strcmp($a['category'], $b['category']);
    });

    echo json_encode([
        'status' => 'success',
        'features' => $features,
        'total' => count($features),
        'active' => count(array_filter($features, fn($f) => $f['enabled']))
    ]);
}

function checkAPIHealth() {
    $startTime = microtime(true);

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'x-api-key: ' . CLAUDE_API_KEY,
            'anthropic-version: 2023-06-01'
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'model' => 'claude-sonnet-4-20250514',
            'max_tokens' => 10,
            'messages' => [['role' => 'user', 'content' => 'ping']]
        ]),
        CURLOPT_TIMEOUT => 5
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $responseTime = round((microtime(true) - $startTime) * 1000);

    return [
        'name' => 'Claude API',
        'status' => $httpCode === 200 ? 'ok' : 'error',
        'http_code' => $httpCode,
        'response_time' => $responseTime . 'ms'
    ];
}

function checkSupabaseHealth() {
    $startTime = microtime(true);

    $ch = curl_init(SUPABASE_URL . '/rest/v1/');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . SUPABASE_ANON_KEY
        ],
        CURLOPT_TIMEOUT => 5
    ]);

    curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $responseTime = round((microtime(true) - $startTime) * 1000);

    return [
        'name' => 'Supabase',
        'status' => $httpCode < 400 ? 'ok' : 'error',
        'http_code' => $httpCode,
        'response_time' => $responseTime . 'ms'
    ];
}

function checkClaudeHealth() {
    return [
        'name' => 'Modelo Claude',
        'status' => 'ok',
        'model' => 'claude-sonnet-4-20250514',
        'version' => 'latest'
    ];
}

/**
 * TESTS - Verificación completa del sistema
 * Testea endpoints, tablas, APIs, features y funcionalidades
 */
function handleTests() {
    $results = [
        'version' => '3.1',
        'timestamp' => date('c'),
        'tests' => []
    ];

    $passed = 0;
    $failed = 0;
    // Usar detección automática de ruta
    $baseDir = getBasePath();
    $featuresDir = $baseDir . 'js/features/';
    $coreDir = $baseDir . 'js/core/';
    $servicesDir = $baseDir . 'js/services/';

    // ═══════════════════════════════════════════════════════════════
    // TEST 1: ENDPOINTS PHP
    // ═══════════════════════════════════════════════════════════════
    $endpoints = [
        'support-chat.php' => 'Chat de Soporte',
        'premium-ai-proxy.php' => 'Proxy IA Premium',
        'check-version.php' => 'Verificador de Versión',
        'logger-service.php' => 'Logger Service',
        'error-logger.php' => 'Error Logger',
        'admin-debug-api.php' => 'Admin Debug API',
        'stripe-webhook.php' => 'Stripe Webhook',
        'paypal-webhook.php' => 'PayPal Webhook'
    ];

    foreach ($endpoints as $file => $name) {
        $exists = file_exists(__DIR__ . '/' . $file);
        $results['tests'][] = [
            'category' => 'Endpoints PHP',
            'name' => $name,
            'test' => "Archivo $file existe",
            'passed' => $exists,
            'details' => $exists ? 'OK' : 'No encontrado'
        ];
        $exists ? $passed++ : $failed++;
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 2: TABLAS SUPABASE (TODAS)
    // ═══════════════════════════════════════════════════════════════
    $tables = [
        // Core
        'profiles' => 'Perfiles de Usuario',
        'user_settings' => 'Configuración Usuario',

        // Logs
        'system_logs' => 'Logs del Sistema',
        'api_errors_log' => 'Errores de API',

        // Progreso
        'user_progress' => 'Progreso de Usuario',
        'reading_progress' => 'Progreso de Lectura',
        'reading_sessions' => 'Sesiones de Lectura',

        // Logros
        'achievements' => 'Logros',
        'user_achievements' => 'Logros de Usuario',

        // Notas y marcadores
        'notes' => 'Notas',
        'bookmarks' => 'Marcadores',
        'reflections' => 'Reflexiones',

        // Learning
        'learning_paths' => 'Rutas de Aprendizaje',
        'user_learning_paths' => 'Progreso en Rutas',
        'learning_path_stages' => 'Etapas de Ruta',

        // IA
        'ai_usage' => 'Uso de IA',
        'ai_cache' => 'Caché de IA',

        // Transacciones
        'transactions' => 'Transacciones',
        'subscription_events' => 'Eventos Suscripción',

        // Otros
        'action_plans' => 'Planes de Acción',
        'koan_history' => 'Historial Koans'
    ];

    foreach ($tables as $table => $name) {
        $result = testSupabaseTable($table);
        $results['tests'][] = [
            'category' => 'Tablas Supabase',
            'name' => $name,
            'test' => "Tabla $table",
            'passed' => $result['exists'],
            'details' => $result['details']
        ];
        $result['exists'] ? $passed++ : $failed++;
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 3: FEATURES CRÍTICAS (JS)
    // ═══════════════════════════════════════════════════════════════
    $criticalFeatures = [
        // IA
        'ai-chat-modal.js' => 'Chat IA Modal',
        'ai-premium.js' => 'IA Premium',
        'support-chat.js' => 'Chat Soporte',

        // Audio
        'enhanced-audioreader.js' => 'AudioReader',
        'audio-mixer.js' => 'Mezclador Audio',
        'binaural-modal.js' => 'Binaural Modal',

        // Lectura
        'smart-reader.js' => 'Lector Inteligente',
        'chapter-resources-modal.js' => 'Recursos Capítulo',

        // UI Principales
        'settings-modal.js' => 'Modal Configuración',
        'my-account-modal.js' => 'Mi Cuenta',
        'auth-modal.js' => 'Autenticación',
        'search-modal.js' => 'Búsqueda',
        'notes-modal.js' => 'Notas',
        'fab-menu.js' => 'Menú FAB',

        // Gamificación
        'achievements-system.js' => 'Sistema Logros',
        'streak-system.js' => 'Sistema Rachas',
        'progress-dashboard.js' => 'Dashboard Progreso',

        // Aprendizaje
        'interactive-quiz.js' => 'Quiz Interactivo',
        'learning-paths.js' => 'Rutas Aprendizaje',
        'flashcards-system.js' => 'Flashcards',

        // Prácticas
        'practice-library.js' => 'Biblioteca Prácticas',
        'practice-timer.js' => 'Timer Práctica',

        // Pagos
        'pricing-modal.js' => 'Modal Precios',
        'token-purchase-modal.js' => 'Compra Tokens',
        'donations-modal.js' => 'Donaciones',

        // Social
        'shareable-moments.js' => 'Momentos Compartibles',
        'quote-image-generator.js' => 'Generador Citas',

        // Navegación
        'command-palette.js' => 'Paleta Comandos',
        'exploration-hub.js' => 'Hub Exploración',
        'brujula-recursos.js' => 'Brújula Recursos',

        // Ayuda
        'help-center-modal.js' => 'Centro Ayuda',
        'onboarding-tutorial.js' => 'Onboarding',
        'welcome-flow.js' => 'Flujo Bienvenida'
    ];

    foreach ($criticalFeatures as $file => $name) {
        $exists = file_exists($featuresDir . $file);
        $results['tests'][] = [
            'category' => 'Features JS',
            'name' => $name,
            'test' => $file,
            'passed' => $exists,
            'details' => $exists ? 'OK' : 'No encontrado'
        ];
        $exists ? $passed++ : $failed++;
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 4: CORE JS
    // ═══════════════════════════════════════════════════════════════
    $coreFiles = [
        'app-initialization.js' => 'Inicialización App',
        'auth-helper.js' => 'Helper Autenticación',
        'supabase-config.js' => 'Config Supabase',
        'supabase-sync-helper.js' => 'Sync Helper',
        'event-bus.js' => 'Event Bus',
        'i18n.js' => 'Internacionalización',
        'logger.js' => 'Logger',
        'toast.js' => 'Notificaciones Toast',
        'theme-helper.js' => 'Helper Temas',
        'plans-config.js' => 'Config Planes',
        'tts-providers.js' => 'Proveedores TTS',
        'biblioteca.js' => 'Biblioteca Principal'
    ];

    foreach ($coreFiles as $file => $name) {
        $exists = file_exists($coreDir . $file);
        $results['tests'][] = [
            'category' => 'Core JS',
            'name' => $name,
            'test' => $file,
            'passed' => $exists,
            'details' => $exists ? 'OK' : 'No encontrado'
        ];
        $exists ? $passed++ : $failed++;
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 5: SERVICES JS
    // ═══════════════════════════════════════════════════════════════
    $serviceFiles = [
        'LearningPathService.js' => 'Learning Path Service',
        'BaseService.js' => 'Base Service',
        'BookService.js' => 'Book Service',
        'UserService.js' => 'User Service',
        'SyncBridgeService.js' => 'Sync Bridge Service'
    ];

    foreach ($serviceFiles as $file => $name) {
        $exists = file_exists($servicesDir . $file);
        $results['tests'][] = [
            'category' => 'Services JS',
            'name' => $name,
            'test' => $file,
            'passed' => $exists,
            'details' => $exists ? 'OK' : 'No encontrado'
        ];
        $exists ? $passed++ : $failed++;
    }

    // ═══════════════════════════════════════════════════════════════
    // TEST 6: APIs EXTERNAS
    // ═══════════════════════════════════════════════════════════════

    // Claude API
    $claudeTest = testClaudeAPI();
    $results['tests'][] = [
        'category' => 'APIs Externas',
        'name' => 'Claude API (Anthropic)',
        'test' => 'Responde correctamente',
        'passed' => $claudeTest['passed'],
        'details' => $claudeTest['details']
    ];
    $claudeTest['passed'] ? $passed++ : $failed++;

    // Supabase REST API
    $supabaseTest = testSupabaseAPI();
    $results['tests'][] = [
        'category' => 'APIs Externas',
        'name' => 'Supabase REST API',
        'test' => 'Conexión establecida',
        'passed' => $supabaseTest['passed'],
        'details' => $supabaseTest['details']
    ];
    $supabaseTest['passed'] ? $passed++ : $failed++;

    // ═══════════════════════════════════════════════════════════════
    // TEST 7: CONFIGURACIÓN
    // ═══════════════════════════════════════════════════════════════

    // API Keys configuradas
    $results['tests'][] = [
        'category' => 'Configuración',
        'name' => 'Claude API Key',
        'test' => 'Key configurada',
        'passed' => defined('CLAUDE_API_KEY') && strlen(CLAUDE_API_KEY) > 10,
        'details' => defined('CLAUDE_API_KEY') ? 'Configurada (' . strlen(CLAUDE_API_KEY) . ' chars)' : 'No definida'
    ];
    (defined('CLAUDE_API_KEY') && strlen(CLAUDE_API_KEY) > 10) ? $passed++ : $failed++;

    $results['tests'][] = [
        'category' => 'Configuración',
        'name' => 'Supabase URL',
        'test' => 'URL configurada',
        'passed' => defined('SUPABASE_URL') && strpos(SUPABASE_URL, 'supabase.co') !== false,
        'details' => defined('SUPABASE_URL') ? SUPABASE_URL : 'No definida'
    ];
    (defined('SUPABASE_URL') && strpos(SUPABASE_URL, 'supabase.co') !== false) ? $passed++ : $failed++;

    $results['tests'][] = [
        'category' => 'Configuración',
        'name' => 'Supabase Service Key',
        'test' => 'Key configurada',
        'passed' => defined('SUPABASE_SERVICE_KEY') && strlen(SUPABASE_SERVICE_KEY) > 50,
        'details' => defined('SUPABASE_SERVICE_KEY') ? 'Configurada (' . strlen(SUPABASE_SERVICE_KEY) . ' chars)' : 'No definida'
    ];
    (defined('SUPABASE_SERVICE_KEY') && strlen(SUPABASE_SERVICE_KEY) > 50) ? $passed++ : $failed++;

    // ═══════════════════════════════════════════════════════════════
    // TEST 8: PERMISOS Y ESCRITURA
    // ═══════════════════════════════════════════════════════════════

    // Test de escritura en logs
    $writeTest = testLogWrite();
    $results['tests'][] = [
        'category' => 'Permisos',
        'name' => 'Escritura en system_logs',
        'test' => 'Puede insertar registros',
        'passed' => $writeTest['passed'],
        'details' => $writeTest['details']
    ];
    $writeTest['passed'] ? $passed++ : $failed++;

    // ═══════════════════════════════════════════════════════════════
    // TEST 9: ASSETS CRÍTICOS
    // ═══════════════════════════════════════════════════════════════
    $assetsDir = $baseDir;
    $criticalAssets = [
        'index.html' => 'Página Principal',
        'css/core.css' => 'CSS Core',
        'css/awakening-theme.css' => 'CSS Tema',
        'books/catalog.json' => 'Catálogo Libros'
    ];

    foreach ($criticalAssets as $file => $name) {
        $exists = file_exists($assetsDir . $file);
        $results['tests'][] = [
            'category' => 'Assets',
            'name' => $name,
            'test' => $file,
            'passed' => $exists,
            'details' => $exists ? 'OK' : 'No encontrado'
        ];
        $exists ? $passed++ : $failed++;
    }

    // ═══════════════════════════════════════════════════════════════
    // RESUMEN POR CATEGORÍA
    // ═══════════════════════════════════════════════════════════════
    $categories = [];
    foreach ($results['tests'] as $test) {
        $cat = $test['category'];
        if (!isset($categories[$cat])) {
            $categories[$cat] = ['passed' => 0, 'failed' => 0];
        }
        $test['passed'] ? $categories[$cat]['passed']++ : $categories[$cat]['failed']++;
    }

    $results['summary'] = [
        'total' => $passed + $failed,
        'passed' => $passed,
        'failed' => $failed,
        'success_rate' => round(($passed / ($passed + $failed)) * 100, 1) . '%',
        'by_category' => $categories
    ];

    $results['status'] = $failed === 0 ? 'all_passed' : ($failed < 5 ? 'mostly_passed' : 'issues_found');

    echo json_encode($results);
}

/**
 * Test si una tabla de Supabase existe y es accesible
 */
function testSupabaseTable($table) {
    $ch = curl_init(SUPABASE_URL . "/rest/v1/$table?limit=1");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . SUPABASE_SERVICE_KEY,
            'Authorization: Bearer ' . SUPABASE_SERVICE_KEY
        ],
        CURLOPT_TIMEOUT => 5
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        return ['exists' => true, 'details' => 'OK - Accesible'];
    } elseif ($httpCode === 404 || strpos($response, 'PGRST') !== false) {
        return ['exists' => false, 'details' => 'Tabla no existe'];
    } else {
        return ['exists' => false, 'details' => "HTTP $httpCode"];
    }
}

/**
 * Test de Claude API
 */
function testClaudeAPI() {
    $startTime = microtime(true);

    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'x-api-key: ' . CLAUDE_API_KEY,
            'anthropic-version: 2023-06-01'
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'model' => 'claude-sonnet-4-20250514',
            'max_tokens' => 5,
            'messages' => [['role' => 'user', 'content' => 'hi']]
        ]),
        CURLOPT_TIMEOUT => 10
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $responseTime = round((microtime(true) - $startTime) * 1000);

    if ($httpCode === 200) {
        return ['passed' => true, 'details' => "OK - {$responseTime}ms"];
    } else {
        $error = json_decode($response, true);
        $msg = $error['error']['message'] ?? "HTTP $httpCode";
        return ['passed' => false, 'details' => $msg];
    }
}

/**
 * Test de Supabase REST API
 */
function testSupabaseAPI() {
    $startTime = microtime(true);

    $ch = curl_init(SUPABASE_URL . '/rest/v1/');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . SUPABASE_SERVICE_KEY
        ],
        CURLOPT_TIMEOUT => 5
    ]);

    curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $responseTime = round((microtime(true) - $startTime) * 1000);

    if ($httpCode < 400) {
        return ['passed' => true, 'details' => "OK - {$responseTime}ms"];
    } else {
        return ['passed' => false, 'details' => "HTTP $httpCode"];
    }
}

/**
 * Test de escritura en system_logs
 */
function testLogWrite() {
    $testData = [
        'level' => 'DEBUG',
        'message' => 'Test de escritura desde admin panel - ' . date('c'),
        'source' => 'admin-test',
        'context' => json_encode(['test' => true])
    ];

    $ch = curl_init(SUPABASE_URL . '/rest/v1/system_logs');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . SUPABASE_SERVICE_KEY,
            'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
            'Content-Type: application/json',
            'Prefer: return=minimal'
        ],
        CURLOPT_POSTFIELDS => json_encode($testData),
        CURLOPT_TIMEOUT => 5
    ]);

    curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        return ['passed' => true, 'details' => 'OK - Registro insertado'];
    } else {
        return ['passed' => false, 'details' => "HTTP $httpCode - Error al insertar"];
    }
}

// LoggerService ya está definido en logger-service.php (incluido arriba)
