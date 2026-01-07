<?php
/**
 * CHECK VERSION API
 * Verifica si hay actualizaciones disponibles para la aplicación
 *
 * @version 1.0.0
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Tabla de versiones y actualizaciones disponibles
$VERSION_DATABASE = [
    // Versión actual en producción
    'latest' => '2.9.286',

    // Información de cada versión
    'versions' => [
        '2.9.286' => [
            'release_date' => '2026-01-07',
            'platform' => 'all',
            'security' => false,
            'critical' => false,
            'features' => [
                'Migración completa a sistema de logger',
                'Corrección de botón sidebar intermitente',
                'Eliminada flecha en navegación de footer',
                'Desactivado auto-check de actualizaciones local',
                'Optimización de lazy-loading (364KB)',
                'Arquitectura modular BookReader y AudioReader'
            ]
        ],
        '2.9.48' => [
            'release_date' => '2025-12-19',
            'platform' => 'all',
            'security' => false,
            'critical' => true,
            'features' => [
                'Revertidos cambios que rompían el lector',
                'Restaurado funcionamiento del menú lateral',
                'Restaurados estilos del reproductor'
            ]
        ],
        '2.9.47' => [
            'release_date' => '2025-12-19',
            'platform' => 'all',
            'security' => false,
            'critical' => false,
            'features' => [
                'Corrección de z-index del lector de libros',
                'Menú principal no tapa el lector',
                'Mejoras en navegación móvil'
            ]
        ],
        '2.9.46' => [
            'release_date' => '2025-12-19',
            'platform' => 'all',
            'security' => false,
            'critical' => false,
            'features' => [
                'Corrección del modo claro/oscuro',
                'Mejoras en el lector de libros',
                'Optimización de navegación',
                'Limpieza de archivos obsoletos',
                'Consolidación del sistema de autenticación'
            ]
        ],
        '2.9.37' => [
            'release_date' => '2025-12-18',
            'platform' => 'all',
            'security' => true,
            'critical' => false,
            'features' => [
                'Event Bus para comunicación entre módulos',
                'Lazy-load CSS de temas',
                'Service Layer (Base/Book/UserService)',
                'Correcciones de seguridad XSS'
            ]
        ]
    ],

    // URLs de descarga por versión y plataforma
    'downloads' => [
        '2.9.286' => [
            'web' => 'https://gailu.net/index.html',
            'android' => 'https://gailu.net/downloads/coleccion-nuevo-ser-v2.9.286.apk',
            'ios' => 'https://apps.apple.com/app/coleccion-nuevo-ser'
        ],
        '2.9.48' => [
            'web' => '/index.html',
            'android' => '/downloads/coleccion-nuevo-ser-v2.9.48.apk',
            'ios' => 'https://apps.apple.com/app/coleccion-nuevo-ser'
        ],
        '2.9.47' => [
            'web' => '/index.html',
            'android' => '/downloads/coleccion-nuevo-ser-v2.9.47.apk',
            'ios' => 'https://apps.apple.com/app/coleccion-nuevo-ser'
        ],
        '2.9.46' => [
            'web' => '/index.html',
            'android' => '/downloads/coleccion-nuevo-ser-v2.9.46.apk',
            'ios' => 'https://apps.apple.com/app/coleccion-nuevo-ser',
            'release_notes' => '/downloads/RELEASE-2.9.46.md'
        ],
        '2.9.37' => [
            'web' => '/index.html',
            'android' => '/downloads/coleccion-nuevo-ser-v2.9.37.apk',
            'ios' => 'https://apps.apple.com/app/coleccion-nuevo-ser'
        ]
    ],

    // Migraciones necesarias entre versiones
    'migrations' => [
        '2.9.31_to_2.9.32' => [
            'localStorage_keys_to_migrate' => ['coleccion-nuevo-ser-data'],
            'cache_to_clear' => ['books_cache', 'resources_cache'],
            'required_data_sync' => true
        ]
    ],

    // Versiones mínimas soportadas (más viejas se fuerzan a actualizar)
    'minimum_version' => '2.9.0',
    'end_of_life' => [
        '2.8.x' => '2025-06-01'
    ]
];

/**
 * Comparar versiones (retorna: -1 si a < b, 0 si a == b, 1 si a > b)
 */
function compareVersions($a, $b) {
    $aparts = array_map('intval', explode('.', $a));
    $bparts = array_map('intval', explode('.', $b));

    for ($i = 0; $i < 3; $i++) {
        $aval = isset($aparts[$i]) ? $aparts[$i] : 0;
        $bval = isset($bparts[$i]) ? $bparts[$i] : 0;

        if ($aval > $bval) return 1;
        if ($aval < $bval) return -1;
    }

    return 0;
}

/**
 * Procesar request
 */
function handleRequest() {
    global $VERSION_DATABASE;

    // Leer JSON del body
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        return error_response('Invalid request format');
    }

    $currentVersion = $input['currentVersion'] ?? null;
    $platform = $input['platform'] ?? 'web';
    $timestamp = $input['timestamp'] ?? time();

    if (!$currentVersion) {
        return error_response('currentVersion is required');
    }

    // Validar formato de versión
    if (!preg_match('/^\d+\.\d+\.\d+$/', $currentVersion)) {
        return error_response('Invalid version format');
    }

    // Verificar si versión actual es menor que mínima
    $minVersion = $VERSION_DATABASE['minimum_version'];
    if (compareVersions($currentVersion, $minVersion) < 0) {
        return json_encode([
            'status' => 'error',
            'message' => 'Version no soportada. Por favor actualiza a la versión mínima.',
            'minimumVersion' => $minVersion,
            'forceUpdate' => true
        ]);
    }

    // Obtener versión más reciente
    $latestVersion = $VERSION_DATABASE['latest'];

    // Comparar versiones
    $updateAvailable = compareVersions($currentVersion, $latestVersion) < 0;

    // Preparar respuesta
    $response = [
        'status' => 'success',
        'currentVersion' => $currentVersion,
        'latestVersion' => $latestVersion,
        'updateAvailable' => $updateAvailable,
        'platform' => $platform,
        'timestamp' => time()
    ];

    // Si hay actualización disponible
    if ($updateAvailable) {
        $updateInfo = $VERSION_DATABASE['versions'][$latestVersion] ?? [];
        $downloadUrl = $VERSION_DATABASE['downloads'][$latestVersion][$platform] ?? null;

        // Mapear plataforma si no está disponible exacta
        if (!$downloadUrl && strpos($platform, 'android') === 0) {
            $downloadUrl = $VERSION_DATABASE['downloads'][$latestVersion]['android'] ?? null;
        }
        if (!$downloadUrl && strpos($platform, 'ios') === 0) {
            $downloadUrl = $VERSION_DATABASE['downloads'][$latestVersion]['ios'] ?? null;
        }

        $response['update'] = [
            'version' => $latestVersion,
            'releaseDate' => $updateInfo['release_date'] ?? 'Unknown',
            'isSecurity' => $updateInfo['security'] ?? false,
            'isCritical' => $updateInfo['critical'] ?? false,
            'features' => $updateInfo['features'] ?? [],
            'downloadUrl' => $downloadUrl,
            'releaseNotesUrl' => $VERSION_DATABASE['downloads'][$latestVersion]['release_notes'] ?? null,
            'changesSummary' => buildChangesSummary($currentVersion, $latestVersion),
            'estimatedSize' => getEstimatedSize($latestVersion, $platform),
            'migrationRequired' => hasMigration($currentVersion, $latestVersion)
        ];
    }

    return $response;
}

/**
 * Obtener resumen de cambios entre versiones
 */
function buildChangesSummary($fromVersion, $toVersion) {
    $changes = [];

    if (compareVersions($toVersion, $fromVersion) > 0) {
        // Versión más reciente tiene estas características
        $changes[] = '✓ Sistema de versiones y actualizaciones automáticas';
        $changes[] = '✓ Verificación de actualizaciones en background';
        $changes[] = '✓ Notificaciones de nuevas versiones';
        $changes[] = '✓ Mejor rendimiento y estabilidad';
    }

    return $changes;
}

/**
 * Obtener tamaño estimado de descarga
 */
function getEstimatedSize($version, $platform) {
    $sizes = [
        'web' => '2.5MB',
        'android' => '49MB',
        'android-browser' => '2.5MB',
        'ios' => '45MB',
        'ios-browser' => '2.5MB'
    ];

    return $sizes[$platform] ?? 'Unknown';
}

/**
 * Verificar si hay migración requerida
 */
function hasMigration($fromVersion, $toVersion) {
    global $VERSION_DATABASE;

    $key = "{$fromVersion}_to_{$toVersion}";
    return isset($VERSION_DATABASE['migrations'][$key]);
}

/**
 * Retornar error
 */
function error_response($message) {
    http_response_code(400);
    return json_encode([
        'status' => 'error',
        'message' => $message,
        'timestamp' => time()
    ]);
}

// Manejar CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Procesar request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    echo json_encode(handleRequest(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
} else {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Only POST requests are supported'
    ]);
}
?>
