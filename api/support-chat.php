<?php
/**
 * SUPPORT CHAT API
 * Endpoint para chat de soporte con Claude AI
 *
 * Features:
 * - Respuestas contextuales basadas en categoria
 * - Deteccion automatica de cuando escalar a humano
 * - Historial de conversacion
 *
 * @version 1.0.0
 * @created 2025-01-16
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Cargar API key de Claude desde config existente
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/error-logger.php';

$input = json_decode(file_get_contents('php://input'), true);

$userMessage = $input['message'] ?? '';
$category = $input['category'] ?? 'other';
$userContext = $input['userContext'] ?? '';
$history = $input['history'] ?? [];
$conversationId = $input['conversationId'] ?? null;

if (empty($userMessage)) {
    http_response_code(400);
    echo json_encode(['error' => 'Message is required']);
    exit;
}

// System prompts por categoria (del support-chat.js)
$systemPrompts = [
    'billing' => "Eres un asistente de soporte especializado en pagos y suscripciones de Coleccion Nuevo Ser.

Informacion clave:
- Planes: Free (5K tokens gratis/mes), Premium (4.99€/mes, 100K tokens), Pro (9.99€/mes, 300K tokens)
- Paquetes de tokens: Basico 50K/2.99€, Estandar 150K/7.99€, Premium 500K/19.99€, Pro 1.5M/49.99€
- Metodos de pago: Tarjeta (Stripe), PayPal, Bitcoin
- Los tokens comprados no expiran, los mensuales se renuevan cada mes
- Para cancelar suscripcion: ir a Mi Cuenta > Plan > Cancelar
- Reembolsos: dentro de 14 dias del pago

Responde de forma clara, concisa y profesional. Si el usuario tiene un problema que no puedes resolver, sugiere contactar a irurag@gmail.com",

    'technical' => "Eres un asistente de soporte tecnico para Coleccion Nuevo Ser.

Problemas comunes y soluciones:
- Audio no funciona: verificar permisos del navegador, recargar pagina, probar otro navegador
- Sincronizacion: requiere cuenta activa, verificar conexion a internet
- App lenta: limpiar cache del navegador, reiniciar app
- Login fallido: verificar email/password, usar 'Olvide mi contrasena'

Responde con soluciones paso a paso. Si el problema persiste, sugiere contactar a irurag@gmail.com",

    'account' => "Eres un asistente de soporte para cuentas de Coleccion Nuevo Ser.

Informacion clave:
- Cambiar contrasena: Mi Cuenta > Perfil > Cambiar Contrasena
- Eliminar cuenta: Mi Cuenta > Ajustes > Eliminar cuenta (IRREVERSIBLE)
- Exportar datos: Mi Cuenta > Ajustes > Exportar mis datos
- Privacidad: sincronizacion opcional, datos encriptados

Responde de forma clara y profesional. Para temas delicados, ofrece contactar a irurag@gmail.com",

    'content' => "Eres un asistente de soporte para contenido de Coleccion Nuevo Ser.

La coleccion incluye libros sobre:
- Filosofia del Nuevo Ser
- Practicas de transformacion
- Guias de accion
- Transicion consciente

Acceso: Plan Free tiene acceso limitado, Premium/Pro acceso completo a todos los libros.

Responde sobre el contenido disponible y como acceder.",

    'ai' => "Eres un asistente de soporte para funciones IA de Coleccion Nuevo Ser.

Funciones disponibles:
- Chat IA: dialogo sobre los libros (~500 tokens/consulta)
- Tutor IA: aprendizaje personalizado (~800 tokens)
- Quizzes IA: evaluacion de comprension (~600 tokens)
- Game Master: experiencias interactivas (~1000 tokens, solo Pro)
- Voces ElevenLabs: narracion premium (~200 tokens/1K caracteres)

Explica como usar las funciones y el consumo de tokens.",

    'other' => "Eres un asistente de soporte general para Coleccion Nuevo Ser.

Ayuda al usuario de forma amable y profesional. Si no puedes resolver el problema, ofrece escalar a soporte humano escribiendo a irurag@gmail.com"
];

$systemPrompt = $systemPrompts[$category] ?? $systemPrompts['other'];

// Construir mensajes para Claude
$messages = [];

// Añadir contexto de usuario
if (!empty($userContext)) {
    $messages[] = [
        'role' => 'user',
        'content' => "Contexto del usuario:\n" . $userContext
    ];
    $messages[] = [
        'role' => 'assistant',
        'content' => 'Entendido. Usare este contexto para ayudar mejor al usuario.'
    ];
}

// Añadir historial (ultimos 6 mensajes)
$recentHistory = array_slice($history, -6);
foreach ($recentHistory as $msg) {
    $messages[] = [
        'role' => $msg['role'],
        'content' => $msg['content']
    ];
}

// Añadir mensaje actual
$messages[] = [
    'role' => 'user',
    'content' => $userMessage
];

try {
    // Llamar a Claude API
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
            'max_tokens' => 500,
            'system' => $systemPrompt,
            'messages' => $messages
        ])
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        $data = json_decode($response, true);
        $errorMsg = $data['error']['message'] ?? 'Unknown error';

        // Detectar deprecation de modelo
        if ($httpCode === 404 && strpos($errorMsg, 'model:') !== false) {
            if (isset($GLOBALS['errorLogger'])) {
                $GLOBALS['errorLogger']->logError('MODEL_DEPRECATED', $errorMsg, $httpCode, '/api/support-chat.php', [
                    'model_used' => 'claude-sonnet-4-20250514',
                    'message_partial' => $userMessage,
                    'category' => $category
                ]);
            }
        } else {
            if (isset($GLOBALS['errorLogger'])) {
                $GLOBALS['errorLogger']->logError('CLAUDE_API_ERROR', $errorMsg, $httpCode, '/api/support-chat.php', [
                    'model_used' => 'claude-sonnet-4-20250514'
                ]);
            }
        }

        throw new Exception('Claude API error: ' . $httpCode);
    }

    $data = json_decode($response, true);
    $aiResponse = $data['content'][0]['text'] ?? 'Lo siento, no pude generar una respuesta.';

    // Detectar si necesita escalacion
    $needsEscalation = false;
    $escalationReason = '';

    $escalationKeywords = [
        'no puedo ayudar',
        'necesitas hablar con',
        'contacta a',
        'requiere atencion humana',
        'fuera de mis capacidades'
    ];

    $lowerResponse = strtolower($aiResponse);
    foreach ($escalationKeywords as $keyword) {
        if (strpos($lowerResponse, $keyword) !== false) {
            $needsEscalation = true;
            $escalationReason = 'IA sugiere escalacion';
            break;
        }
    }

    // Responder
    echo json_encode([
        'response' => $aiResponse,
        'needsEscalation' => $needsEscalation,
        'reason' => $escalationReason,
        'conversationId' => $conversationId ?? 'conv_' . time()
    ]);

} catch (Exception $e) {
    error_log('[SupportChat] Error: ' . $e->getMessage());

    // Fallback local
    http_response_code(200);
    echo json_encode([
        'response' => getFallbackResponse($category),
        'needsEscalation' => false,
        'reason' => '',
        'conversationId' => $conversationId ?? 'conv_' . time()
    ]);
}

// Respuestas de fallback si falla la API
function getFallbackResponse($category) {
    $responses = [
        'billing' => 'Para temas de pagos y suscripciones, puedes ir a Mi Cuenta > Plan para ver opciones. Si necesitas ayuda especifica con un pago, escribenos a irurag@gmail.com',
        'technical' => 'Para problemas tecnicos, intenta: 1) Recargar la pagina 2) Limpiar cache del navegador 3) Probar en otro navegador. Si persiste el problema, contacta irurag@gmail.com',
        'account' => 'Para gestionar tu cuenta, ve a Mi Cuenta desde el menu. Alli puedes cambiar tu perfil, contrasena y preferencias.',
        'content' => 'El contenido esta organizado en la Biblioteca. Los planes Premium y Pro tienen acceso completo a todos los libros.',
        'ai' => 'Las funciones IA consumen tokens. Puedes ver tu balance en Mi Cuenta > Tokens. Si tienes problemas, verifica que tengas tokens disponibles.',
        'other' => 'Gracias por contactarnos. Si necesitas ayuda especifica, por favor describe tu problema con mas detalle o escribe a irurag@gmail.com'
    ];

    return $responses[$category] ?? $responses['other'];
}
