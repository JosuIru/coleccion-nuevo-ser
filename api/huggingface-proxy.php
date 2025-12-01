<?php
/**
 * Proxy para HuggingFace Inference API
 * Permite usar HuggingFace desde aplicaciones web evitando problemas de CORS
 *
 * Subir a: gailu.net/api/huggingface-proxy.php
 */

// Headers CORS para permitir peticiones desde cualquier origen
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-HuggingFace-Token');
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Obtener el token de HuggingFace del header
$token = $_SERVER['HTTP_X_HUGGINGFACE_TOKEN'] ?? null;

if (!$token) {
    http_response_code(400);
    echo json_encode(['error' => 'HuggingFace token not provided. Use X-HuggingFace-Token header.']);
    exit;
}

// Obtener datos del body
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

$prompt = $data['prompt'] ?? '';
$systemContext = $data['systemContext'] ?? '';
$model = $data['model'] ?? 'mistralai/Mistral-7B-Instruct-v0.2';

if (empty($prompt)) {
    http_response_code(400);
    echo json_encode(['error' => 'Prompt is required']);
    exit;
}

// Construir el prompt completo
$fullPrompt = $systemContext
    ? "{$systemContext}\n\nUsuario: {$prompt}\nAsistente:"
    : "Usuario: {$prompt}\nAsistente:";

// URL de la API de HuggingFace
$apiUrl = "https://api-inference.huggingface.co/models/{$model}";

// Preparar la petición
$requestBody = json_encode([
    'inputs' => $fullPrompt,
    'parameters' => [
        'max_new_tokens' => 512,
        'temperature' => 0.7,
        'top_p' => 0.95,
        'return_full_text' => false
    ]
]);

// Hacer la petición a HuggingFace
$ch = curl_init($apiUrl);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $requestBody,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json'
    ],
    CURLOPT_TIMEOUT => 60,
    CURLOPT_SSL_VERIFYPEER => true
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// Manejar errores de curl
if ($curlError) {
    http_response_code(500);
    echo json_encode(['error' => 'Connection error: ' . $curlError]);
    exit;
}

// Parsear respuesta
$responseData = json_decode($response, true);

// Manejar errores de la API
if ($httpCode !== 200) {
    http_response_code($httpCode);

    // HuggingFace puede devolver diferentes formatos de error
    $errorMessage = 'Unknown error';
    if (isset($responseData['error'])) {
        $errorMessage = $responseData['error'];
    } elseif (isset($responseData['message'])) {
        $errorMessage = $responseData['message'];
    } elseif (is_string($response)) {
        $errorMessage = $response;
    }

    // Si el modelo está cargando, informar al usuario
    if (strpos($errorMessage, 'loading') !== false || strpos($errorMessage, 'currently loading') !== false) {
        echo json_encode([
            'error' => 'El modelo está cargando. Por favor, espera unos segundos e intenta de nuevo.',
            'retry' => true,
            'estimated_time' => $responseData['estimated_time'] ?? 20
        ]);
        exit;
    }

    echo json_encode(['error' => $errorMessage]);
    exit;
}

// Extraer el texto generado
$text = '';
if (is_array($responseData) && isset($responseData[0]['generated_text'])) {
    $text = $responseData[0]['generated_text'];
} elseif (isset($responseData['generated_text'])) {
    $text = $responseData['generated_text'];
} elseif (is_array($responseData) && isset($responseData[0]['text'])) {
    $text = $responseData[0]['text'];
}

// Limpiar el texto (eliminar el prompt si aparece)
$text = trim($text);

// Devolver respuesta exitosa
echo json_encode([
    'text' => $text,
    'model' => $model,
    'success' => true
]);
