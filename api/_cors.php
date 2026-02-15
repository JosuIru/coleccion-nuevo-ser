<?php
/**
 * Shared CORS helpers for API endpoints.
 */

if (!function_exists('getAllowedOrigins')) {
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
}

if (!function_exists('applyCorsHeaders')) {
    function applyCorsHeaders($methods = 'GET, POST, OPTIONS', $headers = 'Content-Type, Authorization') {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if ($origin) {
            $allowedOrigins = getAllowedOrigins();
            if (!in_array($origin, $allowedOrigins, true)) {
                http_response_code(403);
                header('Content-Type: application/json');
                echo json_encode(['error' => 'Origin not allowed']);
                exit;
            }
            header("Access-Control-Allow-Origin: $origin");
            header('Vary: Origin');
        }
        header("Access-Control-Allow-Methods: $methods");
        header("Access-Control-Allow-Headers: $headers");
    }
}

