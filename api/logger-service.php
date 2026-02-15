<?php
/**
 * LOGGER SERVICE - Sistema centralizado de logging
 * Registra logs de web, APK, errores, eventos
 *
 * @version 1.0.0
 */

require_once __DIR__ . '/config.php';

class LoggerService {
    private $supabaseUrl;
    private $supabaseKey;

    public function __construct() {
        $this->supabaseUrl = SUPABASE_URL;
        $this->supabaseKey = SUPABASE_SERVICE_KEY;
    }

    /**
     * Guardar log
     */
    public function log($level, $message, $context = null, $source = 'api') {
        try {
            $logData = [
                'level' => $level,
                'message' => $message,
                'context' => $context ? json_encode($context) : null,
                'source' => $source,
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'created_at' => date('c')
            ];

            $ch = curl_init($this->supabaseUrl . '/rest/v1/system_logs');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_HTTPHEADER => [
                    'apikey: ' . $this->supabaseKey,
                    'Authorization: Bearer ' . $this->supabaseKey,
                    'Content-Type: application/json',
                    'Prefer: return=minimal'
                ],
                CURLOPT_POSTFIELDS => json_encode($logData),
                CURLOPT_TIMEOUT => 5
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            return $httpCode >= 200 && $httpCode < 300;

        } catch (Exception $e) {
            error_log("[LoggerService] Error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtener logs (para panel admin)
     */
    public function getLogs($limit = 100, $level = null, $source = null) {
        try {
            $query = "$this->supabaseUrl/rest/v1/system_logs?order=created_at.desc&limit=$limit";

            if ($level) {
                $query .= "&level=eq.$level";
            }
            if ($source) {
                $query .= "&source=eq.$source";
            }

            $ch = curl_init($query);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    'apikey: ' . $this->supabaseKey,
                    'Authorization: Bearer ' . $this->supabaseKey
                ],
                CURLOPT_TIMEOUT => 10
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode === 200) {
                return json_decode($response, true);
            }
            return [];

        } catch (Exception $e) {
            error_log("[LoggerService] Error fetching logs: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Obtener estadísticas de logs
     */
    public function getStats($hoursAgo = 24) {
        try {
            $query = "$this->supabaseUrl/rest/v1/system_logs";

            $ch = curl_init($query . "?select=level,count()&group_by=level");
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => [
                    'apikey: ' . $this->supabaseKey,
                    'Authorization: Bearer ' . $this->supabaseKey
                ],
                CURLOPT_TIMEOUT => 10
            ]);

            $response = curl_exec($ch);
            curl_close($ch);

            return json_decode($response, true) ?: [];

        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * Limpiar logs antiguos (>7 días)
     */
    public function cleanOldLogs($daysOld = 7) {
        try {
            $date = date('c', strtotime("-$daysOld days"));

            $ch = curl_init($this->supabaseUrl . '/rest/v1/system_logs?created_at=lt.' . urlencode($date));
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CUSTOMREQUEST => 'DELETE',
                CURLOPT_HTTPHEADER => [
                    'apikey: ' . $this->supabaseKey,
                    'Authorization: Bearer ' . $this->supabaseKey
                ],
                CURLOPT_TIMEOUT => 10
            ]);

            curl_exec($ch);
            curl_close($ch);

            return true;

        } catch (Exception $e) {
            return false;
        }
    }
}

// Exportar como global
$GLOBALS['loggerService'] = new LoggerService();
