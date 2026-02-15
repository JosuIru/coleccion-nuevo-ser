<?php
/**
 * ERROR LOGGER - Sistema de logging y alertas de errores API
 * Registra fallos de API y envía alertas al admin
 *
 * @version 1.0.0
 */

require_once __DIR__ . '/config.php';

class APIErrorLogger {
    private $supabaseUrl;
    private $supabaseKey;
    private $adminEmail = 'irurag@gmail.com';
    private $appName = 'Colección Nuevo Ser';

    public function __construct() {
        $this->supabaseUrl = SUPABASE_URL;
        $this->supabaseKey = SUPABASE_SERVICE_KEY;
    }

    /**
     * Registrar error de API
     */
    public function logError($errorType, $errorMessage, $httpCode, $endpoint, $details = null) {
        try {
            // Guardar en base de datos
            $this->saveToDatabase($errorType, $errorMessage, $httpCode, $endpoint, $details);

            // Enviar email si es error crítico
            if ($this->isCriticalError($errorType, $httpCode)) {
                $this->sendAdminAlert($errorType, $errorMessage, $httpCode, $endpoint, $details);
            }

            error_log("[API-ERROR] {$errorType}: {$errorMessage} (HTTP {$httpCode})");

        } catch (Exception $e) {
            error_log("[ERROR-LOGGER] Failed to log error: " . $e->getMessage());
        }
    }

    /**
     * Guardar error en Supabase
     */
    private function saveToDatabase($errorType, $errorMessage, $httpCode, $endpoint, $details) {
        $payload = [
            'error_type' => $errorType,
            'error_message' => $errorMessage,
            'http_code' => $httpCode,
            'endpoint' => $endpoint,
            'details' => $details ? json_encode($details) : null,
            'created_at' => date('c'),
            'timestamp' => date('Y-m-d H:i:s')
        ];

        $ch = curl_init($this->supabaseUrl . '/rest/v1/api_errors_log');

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'apikey: ' . $this->supabaseKey,
                'Authorization: Bearer ' . $this->supabaseKey,
                'Content-Type: application/json',
                'Prefer: return=minimal'
            ],
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_TIMEOUT => 10
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode < 200 || $httpCode >= 300) {
            throw new Exception("Failed to save error log: HTTP $httpCode");
        }
    }

    /**
     * Detectar si es error crítico
     */
    private function isCriticalError($errorType, $httpCode) {
        // Errores críticos: model not found (deprecation), auth failed, timeouts
        return in_array($errorType, ['MODEL_DEPRECATED', 'MODEL_NOT_FOUND', 'AUTH_FAILED', 'TIMEOUT'])
            || ($httpCode >= 400 && $httpCode < 500);
    }

    /**
     * Enviar alerta al admin
     */
    private function sendAdminAlert($errorType, $errorMessage, $httpCode, $endpoint, $details) {
        $subject = "⚠️ [{$this->appName}] Error crítico en API: {$errorType}";

        $message = $this->buildEmailBody($errorType, $errorMessage, $httpCode, $endpoint, $details);

        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: noreply@' . parse_url($this->supabaseUrl, PHP_URL_HOST)
        ];

        mail($this->adminEmail, $subject, $message, implode("\r\n", $headers));
    }

    /**
     * Construir cuerpo del email
     */
    private function buildEmailBody($errorType, $errorMessage, $httpCode, $endpoint, $details) {
        $timestamp = date('d/m/Y H:i:s');

        $typeLabel = $this->getErrorTypeLabel($errorType);
        $severity = $this->getErrorSeverity($errorType);

        $html = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: Arial, sans-serif; background: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
                .header { background: " . ($severity === 'CRÍTICO' ? '#dc2626' : '#ea580c') . "; color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px; }
                .content { color: #333; line-height: 1.6; }
                .error-box { background: #fee; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .detail { margin: 10px 0; }
                .label { font-weight: bold; color: #555; }
                .value { color: #333; word-break: break-all; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2 style='margin: 0;'>⚠️ Alerta de Error API</h2>
                    <p style='margin: 5px 0 0 0; opacity: 0.9;'>Severidad: <strong>{$severity}</strong></p>
                </div>

                <div class='content'>
                    <div class='error-box'>
                        <div class='detail'>
                            <span class='label'>Tipo de Error:</span><br>
                            <span class='value'>{$typeLabel}</span>
                        </div>
                        <div class='detail'>
                            <span class='label'>Mensaje:</span><br>
                            <span class='value'>{$errorMessage}</span>
                        </div>
                    </div>

                    <div class='detail'>
                        <span class='label'>Endpoint:</span><br>
                        <span class='value'>{$endpoint}</span>
                    </div>

                    <div class='detail'>
                        <span class='label'>Código HTTP:</span><br>
                        <span class='value'>{$httpCode}</span>
                    </div>

                    <div class='detail'>
                        <span class='label'>Hora:</span><br>
                        <span class='value'>{$timestamp}</span>
                    </div>";

        if ($details) {
            $html .= "
                    <div class='detail'>
                        <span class='label'>Detalles:</span><br>
                        <span class='value'><pre style='background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;'>" . htmlspecialchars(json_encode($details, JSON_PRETTY_PRINT)) . "</pre></span>
                    </div>";
        }

        // Recomendar acciones
        if ($errorType === 'MODEL_DEPRECATED' || $errorType === 'MODEL_NOT_FOUND') {
            $html .= "
                    <div style='background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;'>
                        <strong>⚡ Acción recomendada:</strong><br>
                        El modelo de Claude puede haberse deprecado. Necesitas actualizar la versión en:<br>
                        • <code>api/support-chat.php</code><br>
                        • <code>api/config.php</code><br>
                        Consulta: <a href='https://docs.anthropic.com/en/docs/about/models'>Modelos disponibles de Anthropic</a>
                    </div>";
        }

        $html .= "
                    <div class='footer'>
                        <p>Este es un mensaje automático de alerta de {$this->appName}</p>
                        <p>No respondere a este email directamente.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>";

        return $html;
    }

    /**
     * Obtener etiqueta del tipo de error
     */
    private function getErrorTypeLabel($errorType) {
        $labels = [
            'MODEL_DEPRECATED' => '❌ Modelo de Claude Deprecado',
            'MODEL_NOT_FOUND' => '❌ Modelo No Encontrado',
            'AUTH_FAILED' => '🔒 Autenticación Fallida',
            'TIMEOUT' => '⏱️ Timeout de Conexión',
            'RATE_LIMIT' => '🚫 Límite de Velocidad Excedido',
            'UNKNOWN_ERROR' => '❓ Error Desconocido'
        ];

        return $labels[$errorType] ?? $errorType;
    }

    /**
     * Obtener severidad del error
     */
    private function getErrorSeverity($errorType) {
        $critical = ['MODEL_DEPRECATED', 'MODEL_NOT_FOUND', 'AUTH_FAILED'];
        return in_array($errorType, $critical) ? 'CRÍTICO' : 'ADVERTENCIA';
    }
}

// Exportar instancia global (disponible en otros scripts que lo incluyan)
$GLOBALS['errorLogger'] = new APIErrorLogger();
