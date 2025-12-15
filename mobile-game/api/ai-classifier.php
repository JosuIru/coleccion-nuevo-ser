<?php
/**
 * AI CLASSIFIER - Clasificador de Crisis con IA
 * Analiza noticias reales y las convierte en crisis jugables
 *
 * SOPORTA:
 * - OpenAI GPT-4
 * - Anthropic Claude
 * - Google Gemini
 * - Modo offline con clasificación predefinida
 *
 * @version 1.0.0
 * @author Awakening Protocol Team
 */

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Clase principal del AI Classifier
 */
class AIClassifier {

    private $cacheDir;
    private $rateLimit = 10; // Máximo 10 clasificaciones por minuto
    private $rateLimitWindow = 60; // segundos
    private $rateLimitFile;

    // Configuración de proveedores IA
    private $aiProviders = [
        'openai' => [
            'name' => 'OpenAI GPT-4',
            'endpoint' => 'https://api.openai.com/v1/chat/completions',
            'model' => 'gpt-4-turbo-preview',
            'enabled' => false
        ],
        'claude' => [
            'name' => 'Anthropic Claude',
            'endpoint' => 'https://api.anthropic.com/v1/messages',
            'model' => 'claude-3-5-sonnet-20241022',
            'enabled' => false
        ],
        'gemini' => [
            'name' => 'Google Gemini',
            'endpoint' => 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
            'enabled' => false
        ]
    ];

    private $currentProvider = 'openai';
    private $apiKey = null;

    // 20 Crisis predefinidas como fallback
    private $fallbackCrises = [
        [
            'type' => 'environmental',
            'title' => 'Deforestación en la Amazonía',
            'description' => 'La deforestación amenaza el pulmón del planeta',
            'location' => ['country' => 'Brasil', 'city' => 'Amazonas', 'lat' => -3.4653, 'lon' => -62.2159],
            'urgency' => 8,
            'scale' => 'continental',
            'attributes' => ['empathy' => 60, 'action' => 80, 'organization' => 70],
            'population_affected' => 500000,
            'duration_minutes' => 45
        ],
        [
            'type' => 'humanitarian',
            'title' => 'Crisis de refugiados en el Mediterráneo',
            'description' => 'Miles de personas buscan refugio en Europa',
            'location' => ['country' => 'Grecia', 'city' => 'Lesbos', 'lat' => 39.1079, 'lon' => 26.5544],
            'urgency' => 9,
            'scale' => 'regional',
            'attributes' => ['empathy' => 90, 'organization' => 75, 'resilience' => 80],
            'population_affected' => 50000,
            'duration_minutes' => 60
        ],
        [
            'type' => 'social',
            'title' => 'Protestas por derechos civiles',
            'description' => 'Manifestaciones masivas por igualdad y justicia',
            'location' => ['country' => 'USA', 'city' => 'New York', 'lat' => 40.7128, 'lon' => -74.0060],
            'urgency' => 7,
            'scale' => 'national',
            'attributes' => ['empathy' => 70, 'leadership' => 65, 'communication' => 80],
            'population_affected' => 100000,
            'duration_minutes' => 40
        ],
        [
            'type' => 'health',
            'title' => 'Brote de enfermedad infecciosa',
            'description' => 'Emergencia sanitaria requiere respuesta rápida',
            'location' => ['country' => 'Congo', 'city' => 'Kinshasa', 'lat' => -4.3217, 'lon' => 15.3125],
            'urgency' => 9,
            'scale' => 'regional',
            'attributes' => ['organization' => 85, 'technical' => 75, 'empathy' => 70],
            'population_affected' => 200000,
            'duration_minutes' => 50
        ],
        [
            'type' => 'economic',
            'title' => 'Crisis económica y desempleo masivo',
            'description' => 'Colapso financiero afecta a millones',
            'location' => ['country' => 'Argentina', 'city' => 'Buenos Aires', 'lat' => -34.6037, 'lon' => -58.3816],
            'urgency' => 8,
            'scale' => 'national',
            'attributes' => ['strategy' => 80, 'organization' => 75, 'collaboration' => 70],
            'population_affected' => 1000000,
            'duration_minutes' => 55
        ],
        [
            'type' => 'environmental',
            'title' => 'Incendios forestales incontrolados',
            'description' => 'Fuego devasta ecosistemas y comunidades',
            'location' => ['country' => 'Australia', 'city' => 'Sydney', 'lat' => -33.8688, 'lon' => 151.2093],
            'urgency' => 10,
            'scale' => 'regional',
            'attributes' => ['action' => 90, 'resilience' => 85, 'organization' => 80],
            'population_affected' => 150000,
            'duration_minutes' => 50
        ],
        [
            'type' => 'infrastructure',
            'title' => 'Colapso de infraestructura crítica',
            'description' => 'Puente colapsado corta acceso vital',
            'location' => ['country' => 'India', 'city' => 'Mumbai', 'lat' => 19.0760, 'lon' => 72.8777],
            'urgency' => 8,
            'scale' => 'local',
            'attributes' => ['technical' => 85, 'organization' => 80, 'action' => 75],
            'population_affected' => 500000,
            'duration_minutes' => 35
        ],
        [
            'type' => 'social',
            'title' => 'Discriminación y desigualdad sistémica',
            'description' => 'Comunidad marginalizada lucha por derechos',
            'location' => ['country' => 'South Africa', 'city' => 'Johannesburg', 'lat' => -26.2041, 'lon' => 28.0473],
            'urgency' => 7,
            'scale' => 'national',
            'attributes' => ['empathy' => 85, 'leadership' => 70, 'communication' => 75],
            'population_affected' => 300000,
            'duration_minutes' => 45
        ],
        [
            'type' => 'humanitarian',
            'title' => 'Hambruna y crisis alimentaria',
            'description' => 'Escasez de alimentos amenaza vidas',
            'location' => ['country' => 'Yemen', 'city' => 'Sana\'a', 'lat' => 15.3694, 'lon' => 44.1910],
            'urgency' => 10,
            'scale' => 'national',
            'attributes' => ['empathy' => 95, 'organization' => 85, 'action' => 80],
            'population_affected' => 2000000,
            'duration_minutes' => 60
        ],
        [
            'type' => 'educational',
            'title' => 'Crisis de acceso a educación',
            'description' => 'Escuelas cerradas afectan a generación entera',
            'location' => ['country' => 'Afghanistan', 'city' => 'Kabul', 'lat' => 34.5553, 'lon' => 69.2075],
            'urgency' => 8,
            'scale' => 'national',
            'attributes' => ['empathy' => 75, 'organization' => 80, 'creativity' => 70],
            'population_affected' => 1000000,
            'duration_minutes' => 50
        ],
        [
            'type' => 'environmental',
            'title' => 'Sequía extrema y escasez de agua',
            'description' => 'Falta de agua potable amenaza comunidades',
            'location' => ['country' => 'Kenya', 'city' => 'Nairobi', 'lat' => -1.2921, 'lon' => 36.8219],
            'urgency' => 9,
            'scale' => 'regional',
            'attributes' => ['organization' => 85, 'technical' => 75, 'empathy' => 80],
            'population_affected' => 750000,
            'duration_minutes' => 55
        ],
        [
            'type' => 'health',
            'title' => 'Colapso del sistema de salud',
            'description' => 'Hospitales saturados, pacientes sin atención',
            'location' => ['country' => 'Venezuela', 'city' => 'Caracas', 'lat' => 10.4806, 'lon' => -66.9036],
            'urgency' => 9,
            'scale' => 'national',
            'attributes' => ['organization' => 90, 'empathy' => 85, 'resilience' => 80],
            'population_affected' => 500000,
            'duration_minutes' => 60
        ],
        [
            'type' => 'environmental',
            'title' => 'Contaminación tóxica en río',
            'description' => 'Derrame químico contamina agua potable',
            'location' => ['country' => 'China', 'city' => 'Shanghai', 'lat' => 31.2304, 'lon' => 121.4737],
            'urgency' => 8,
            'scale' => 'local',
            'attributes' => ['technical' => 85, 'action' => 80, 'organization' => 75],
            'population_affected' => 200000,
            'duration_minutes' => 40
        ],
        [
            'type' => 'economic',
            'title' => 'Desalojo masivo por deuda',
            'description' => 'Familias pierden hogares por crisis económica',
            'location' => ['country' => 'Spain', 'city' => 'Madrid', 'lat' => 40.4168, 'lon' => -3.7038],
            'urgency' => 7,
            'scale' => 'local',
            'attributes' => ['empathy' => 80, 'organization' => 70, 'collaboration' => 75],
            'population_affected' => 50000,
            'duration_minutes' => 35
        ],
        [
            'type' => 'social',
            'title' => 'Violencia de género sistémica',
            'description' => 'Aumento alarmante de casos de violencia',
            'location' => ['country' => 'Mexico', 'city' => 'Mexico City', 'lat' => 19.4326, 'lon' => -99.1332],
            'urgency' => 9,
            'scale' => 'national',
            'attributes' => ['empathy' => 90, 'leadership' => 75, 'communication' => 80],
            'population_affected' => 100000,
            'duration_minutes' => 50
        ],
        [
            'type' => 'infrastructure',
            'title' => 'Apagón eléctrico masivo',
            'description' => 'Red eléctrica colapsa afectando millones',
            'location' => ['country' => 'Pakistan', 'city' => 'Karachi', 'lat' => 24.8607, 'lon' => 67.0011],
            'urgency' => 8,
            'scale' => 'national',
            'attributes' => ['technical' => 90, 'organization' => 85, 'action' => 75],
            'population_affected' => 10000000,
            'duration_minutes' => 45
        ],
        [
            'type' => 'environmental',
            'title' => 'Tsunami amenaza costa',
            'description' => 'Alerta de tsunami requiere evacuación inmediata',
            'location' => ['country' => 'Indonesia', 'city' => 'Jakarta', 'lat' => -6.2088, 'lon' => 106.8456],
            'urgency' => 10,
            'scale' => 'regional',
            'attributes' => ['action' => 95, 'organization' => 90, 'resilience' => 85],
            'population_affected' => 500000,
            'duration_minutes' => 30
        ],
        [
            'type' => 'humanitarian',
            'title' => 'Población desplazada por conflicto',
            'description' => 'Guerra civil genera crisis de desplazados',
            'location' => ['country' => 'Syria', 'city' => 'Aleppo', 'lat' => 36.2021, 'lon' => 37.1343],
            'urgency' => 10,
            'scale' => 'national',
            'attributes' => ['empathy' => 95, 'organization' => 85, 'resilience' => 90],
            'population_affected' => 3000000,
            'duration_minutes' => 60
        ],
        [
            'type' => 'educational',
            'title' => 'Analfabetismo y falta de recursos',
            'description' => 'Generación sin acceso a educación básica',
            'location' => ['country' => 'Nigeria', 'city' => 'Lagos', 'lat' => 6.5244, 'lon' => 3.3792],
            'urgency' => 7,
            'scale' => 'national',
            'attributes' => ['empathy' => 70, 'creativity' => 75, 'organization' => 80],
            'population_affected' => 500000,
            'duration_minutes' => 55
        ],
        [
            'type' => 'health',
            'title' => 'Desnutrición infantil aguda',
            'description' => 'Niños en riesgo por falta de alimentación',
            'location' => ['country' => 'Somalia', 'city' => 'Mogadishu', 'lat' => 2.0469, 'lon' => 45.3182],
            'urgency' => 10,
            'scale' => 'national',
            'attributes' => ['empathy' => 95, 'organization' => 85, 'action' => 90],
            'population_affected' => 300000,
            'duration_minutes' => 60
        ]
    ];

    public function __construct() {
        $this->cacheDir = __DIR__ . '/../cache/ai/';
        $this->rateLimitFile = $this->cacheDir . 'rate_limit.json';

        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }

        // Cargar configuración de API keys desde archivo .env si existe
        $this->loadApiKeys();
    }

    /**
     * Cargar API keys desde archivo de configuración
     */
    private function loadApiKeys() {
        $envFile = __DIR__ . '/../.env';

        if (file_exists($envFile)) {
            $envContent = file_get_contents($envFile);
            $lines = explode("\n", $envContent);

            foreach ($lines as $line) {
                if (strpos($line, 'OPENAI_API_KEY=') === 0) {
                    $this->apiKey = trim(substr($line, 15));
                    $this->aiProviders['openai']['enabled'] = true;
                    $this->currentProvider = 'openai';
                } elseif (strpos($line, 'CLAUDE_API_KEY=') === 0) {
                    $this->aiProviders['claude']['api_key'] = trim(substr($line, 15));
                    $this->aiProviders['claude']['enabled'] = true;
                } elseif (strpos($line, 'GEMINI_API_KEY=') === 0) {
                    $this->aiProviders['gemini']['api_key'] = trim(substr($line, 15));
                    $this->aiProviders['gemini']['enabled'] = true;
                }
            }
        }
    }

    /**
     * Clasificar una noticia en crisis jugable
     *
     * @param array $newsItem Noticia a clasificar
     * @return array Crisis estructurada
     */
    public function classifyNews($newsItem) {
        try {
            // Verificar rate limiting
            if (!$this->checkRateLimit()) {
                return $this->errorResponse('Rate limit exceeded. Max 10 classifications per minute.');
            }

            // Intentar clasificación con IA
            if ($this->isAIEnabled()) {
                $crisis = $this->classifyWithAI($newsItem);

                if ($crisis) {
                    // Guardar en base de datos (si está configurada)
                    $this->saveCrisisToDatabase($crisis);

                    return $this->successResponse($crisis);
                }
            }

            // Fallback: Clasificación predefinida
            $crisis = $this->classifyWithFallback($newsItem);
            $this->saveCrisisToDatabase($crisis);

            return $this->successResponse($crisis);

        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    /**
     * Clasificar con IA (OpenAI, Claude, Gemini)
     */
    private function classifyWithAI($newsItem) {
        $provider = $this->getCurrentProvider();

        if (!$provider || !$provider['enabled']) {
            return null;
        }

        $prompt = $this->buildClassificationPrompt($newsItem);

        switch ($this->currentProvider) {
            case 'openai':
                return $this->classifyWithOpenAI($prompt);
            case 'claude':
                return $this->classifyWithClaude($prompt);
            case 'gemini':
                return $this->classifyWithGemini($prompt);
            default:
                return null;
        }
    }

    /**
     * Construir prompt de clasificación
     */
    private function buildClassificationPrompt($newsItem) {
        $title = $newsItem['title'] ?? '';
        $description = $newsItem['description'] ?? '';

        return <<<PROMPT
Analiza la siguiente noticia y extrae información estructurada para convertirla en una crisis de un juego educativo sobre transformación social.

NOTICIA:
Título: {$title}
Descripción: {$description}

Extrae la siguiente información en formato JSON:

{
  "type": "uno de: environmental, social, economic, humanitarian, educational, health, infrastructure",
  "title": "título corto y descriptivo (máximo 60 caracteres)",
  "description": "descripción concisa de la crisis (máximo 150 caracteres)",
  "location": {
    "country": "nombre del país",
    "city": "ciudad principal afectada",
    "lat": latitud (número decimal),
    "lon": longitud (número decimal)
  },
  "urgency": número del 1 al 10 (10 = máxima urgencia),
  "scale": "uno de: local, regional, national, continental, global",
  "attributes": {
    "empathy": valor 1-100 (cuánta empatía se requiere),
    "organization": valor 1-100 (cuánta organización se requiere),
    "action": valor 1-100 (cuánta capacidad de acción se requiere),
    "technical": valor 1-100 (cuántas habilidades técnicas se requieren),
    "communication": valor 1-100 (cuánta comunicación se requiere),
    "leadership": valor 1-100 (cuánto liderazgo se requiere)
  },
  "population_affected": número estimado de personas afectadas,
  "duration_minutes": duración estimada de la misión en minutos (15-60)
}

Retorna SOLO el JSON, sin texto adicional.
PROMPT;
    }

    /**
     * Clasificar con OpenAI GPT-4
     */
    private function classifyWithOpenAI($prompt) {
        if (!$this->apiKey) return null;

        $provider = $this->aiProviders['openai'];

        $data = [
            'model' => $provider['model'],
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'Eres un asistente que analiza noticias y las convierte en datos estructurados JSON para un juego educativo.'
                ],
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'temperature' => 0.3,
            'max_tokens' => 500
        ];

        $ch = curl_init($provider['endpoint']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apiKey
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log("OpenAI API error: HTTP {$httpCode}");
            return null;
        }

        $result = json_decode($response, true);

        if (!isset($result['choices'][0]['message']['content'])) {
            return null;
        }

        $content = $result['choices'][0]['message']['content'];

        // Extraer JSON del contenido
        return $this->extractJSON($content);
    }

    /**
     * Clasificar con Anthropic Claude
     */
    private function classifyWithClaude($prompt) {
        $provider = $this->aiProviders['claude'];

        if (!isset($provider['api_key'])) return null;

        $data = [
            'model' => $provider['model'],
            'max_tokens' => 1024,
            'messages' => [
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ]
        ];

        $ch = curl_init($provider['endpoint']);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'x-api-key: ' . $provider['api_key'],
            'anthropic-version: 2023-06-01'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log("Claude API error: HTTP {$httpCode}");
            return null;
        }

        $result = json_decode($response, true);

        if (!isset($result['content'][0]['text'])) {
            return null;
        }

        return $this->extractJSON($result['content'][0]['text']);
    }

    /**
     * Clasificar con Google Gemini
     */
    private function classifyWithGemini($prompt) {
        $provider = $this->aiProviders['gemini'];

        if (!isset($provider['api_key'])) return null;

        $url = $provider['endpoint'] . '?key=' . $provider['api_key'];

        $data = [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt]
                    ]
                ]
            ]
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log("Gemini API error: HTTP {$httpCode}");
            return null;
        }

        $result = json_decode($response, true);

        if (!isset($result['candidates'][0]['content']['parts'][0]['text'])) {
            return null;
        }

        return $this->extractJSON($result['candidates'][0]['content']['parts'][0]['text']);
    }

    /**
     * Extraer JSON de una respuesta de texto
     */
    private function extractJSON($text) {
        // Buscar JSON en el texto
        $start = strpos($text, '{');
        $end = strrpos($text, '}');

        if ($start === false || $end === false) {
            return null;
        }

        $jsonString = substr($text, $start, $end - $start + 1);
        $decoded = json_decode($jsonString, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return null;
        }

        // Validar estructura
        if (!$this->validateCrisisStructure($decoded)) {
            return null;
        }

        return $decoded;
    }

    /**
     * Clasificación con fallback (sin IA)
     */
    private function classifyWithFallback($newsItem) {
        // Seleccionar una crisis predefinida que coincida con la categoría
        $category = $newsItem['primaryCategory'] ?? 'environmental';

        $matchingCrises = array_filter($this->fallbackCrises, function($crisis) use ($category) {
            return $crisis['type'] === $category;
        });

        if (empty($matchingCrises)) {
            $matchingCrises = $this->fallbackCrises;
        }

        // Seleccionar aleatoriamente
        $selectedCrisis = $matchingCrises[array_rand($matchingCrises)];

        // Personalizar con datos de la noticia
        $selectedCrisis['source_title'] = $newsItem['title'] ?? '';
        $selectedCrisis['source_url'] = $newsItem['url'] ?? '';
        $selectedCrisis['classified_by'] = 'fallback';

        return $selectedCrisis;
    }

    /**
     * Validar estructura de crisis
     */
    private function validateCrisisStructure($crisis) {
        $required = ['type', 'title', 'description', 'location', 'urgency', 'scale', 'attributes'];

        foreach ($required as $field) {
            if (!isset($crisis[$field])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Guardar crisis en base de datos
     */
    private function saveCrisisToDatabase($crisis) {
        // TODO: Implementar guardado en Supabase o base de datos local
        // Por ahora solo guardar en caché JSON

        $cacheFile = $this->cacheDir . 'crisis_' . time() . '_' . uniqid() . '.json';
        file_put_contents($cacheFile, json_encode($crisis, JSON_PRETTY_PRINT));

        return true;
    }

    /**
     * Verificar si IA está habilitada
     */
    private function isAIEnabled() {
        foreach ($this->aiProviders as $provider) {
            if ($provider['enabled']) {
                return true;
            }
        }
        return false;
    }

    /**
     * Obtener proveedor actual
     */
    private function getCurrentProvider() {
        return $this->aiProviders[$this->currentProvider] ?? null;
    }

    /**
     * Verificar rate limiting
     */
    private function checkRateLimit() {
        if (!file_exists($this->rateLimitFile)) {
            $this->initRateLimit();
            return true;
        }

        $data = json_decode(file_get_contents($this->rateLimitFile), true);
        $now = time();

        // Limpiar entradas antiguas
        $data['requests'] = array_filter($data['requests'], function($timestamp) use ($now) {
            return ($now - $timestamp) < $this->rateLimitWindow;
        });

        // Verificar límite
        if (count($data['requests']) >= $this->rateLimit) {
            return false;
        }

        // Agregar nueva solicitud
        $data['requests'][] = $now;
        file_put_contents($this->rateLimitFile, json_encode($data));

        return true;
    }

    /**
     * Inicializar rate limiting
     */
    private function initRateLimit() {
        file_put_contents($this->rateLimitFile, json_encode(['requests' => [time()]]));
    }

    /**
     * Health check
     */
    public function healthCheck() {
        $enabledProviders = array_filter($this->aiProviders, function($p) {
            return $p['enabled'];
        });

        return [
            'status' => 'success',
            'service' => 'AI Classifier',
            'version' => '1.0.0',
            'ai_enabled' => $this->isAIEnabled(),
            'current_provider' => $this->currentProvider,
            'enabled_providers' => array_keys($enabledProviders),
            'fallback_crises_count' => count($this->fallbackCrises),
            'timestamp' => time()
        ];
    }

    /**
     * Respuesta exitosa
     */
    private function successResponse($crisis) {
        return [
            'status' => 'success',
            'data' => $crisis,
            'timestamp' => time()
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
}

// ═══════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════

$classifier = new AIClassifier();

$action = $_GET['action'] ?? 'classify';

switch ($action) {
    case 'classify':
        // Obtener noticia desde POST body
        $input = file_get_contents('php://input');
        $newsItem = json_decode($input, true);

        if (!$newsItem) {
            $response = [
                'status' => 'error',
                'message' => 'Invalid news item. Send JSON in POST body.'
            ];
        } else {
            $response = $classifier->classifyNews($newsItem);
        }
        break;

    case 'health':
        $response = $classifier->healthCheck();
        break;

    default:
        http_response_code(404);
        $response = [
            'status' => 'error',
            'message' => 'Unknown action',
            'available_actions' => ['classify', 'health']
        ];
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
