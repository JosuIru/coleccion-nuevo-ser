<?php
/**
 * SETUP - Crear tabla api_errors_log en Supabase
 * Ejecutar una sola vez para crear la infraestructura
 */

require_once __DIR__ . '/config.php';

function isDebugAllowed() {
    $env = getenv('APP_ENV') ?: '';
    $debugFlag = getenv('ENABLE_DEBUG_ENDPOINTS') ?: '';
    if ($env === 'production' && $debugFlag !== '1') {
        return false;
    }
    $expected = getenv('ADMIN_DEBUG_TOKEN') ?: hash('sha256', 'irurag@gmail.com' . 'debug-key');
    $provided = $_GET['admin_token'] ?? '';
    return $provided !== '' && hash_equals($expected, $provided);
}

if (php_sapi_name() !== 'cli' && !isDebugAllowed()) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Endpoint disabled']);
    exit;
}

$sql = <<<SQL
CREATE TABLE IF NOT EXISTS api_errors_log (
  id BIGSERIAL PRIMARY KEY,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  http_code INTEGER,
  endpoint TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_api_errors_type ON api_errors_log(error_type);
CREATE INDEX IF NOT EXISTS idx_api_errors_created ON api_errors_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_errors_resolved ON api_errors_log(resolved);

ALTER TABLE api_errors_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access" ON api_errors_log
  FOR ALL
  USING (true)
  WITH CHECK (true);
SQL;

header('Content-Type: application/json');

try {
    // Conectar a Supabase PostgreSQL via REST API
    $url = SUPABASE_URL . '/rest/v1/rpc/exec_sql';

    $ch = curl_init($url);

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . SUPABASE_SERVICE_KEY,
            'Authorization: Bearer ' . SUPABASE_SERVICE_KEY,
            'Content-Type: application/json',
            'Prefer: return=representation'
        ],
        CURLOPT_POSTFIELDS => json_encode(['query' => $sql]),
        CURLOPT_TIMEOUT => 30
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    // Si falla via REST API, intentar crear tabla de prueba
    if ($httpCode !== 200 && $httpCode !== 201) {
        // Crear tabla de prueba para verificar conexión
        $testUrl = SUPABASE_URL . '/rest/v1/api_errors_log?select=count';

        $ch = curl_init($testUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'apikey: ' . SUPABASE_SERVICE_KEY,
                'Authorization: Bearer ' . SUPABASE_SERVICE_KEY
            ],
            CURLOPT_TIMEOUT => 10
        ]);

        $testResponse = curl_exec($ch);
        $testCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($testCode === 200) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Tabla api_errors_log ya existe y es accesible',
                'verified' => true
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'No se pudo crear/acceder a tabla. Ejecuta manualmente en SQL Editor de Supabase',
                'http_code' => $httpCode,
                'curl_error' => $curlError,
                'response' => $response
            ]);
        }
    } else {
        echo json_encode([
            'status' => 'success',
            'message' => 'Tabla api_errors_log creada exitosamente',
            'http_code' => $httpCode
        ]);
    }

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Exception: ' . $e->getMessage()
    ]);
}
?>
