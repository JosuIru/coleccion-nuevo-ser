<?php
/**
 * ADMIN NOTIFICATION API
 * Endpoint para enviar notificaciones al admin cuando se escala soporte
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

$input = json_decode(file_get_contents('php://input'), true);

$type = $input['type'] ?? '';
$userId = $input['userId'] ?? '';
$userEmail = $input['userEmail'] ?? '';
$userName = $input['userName'] ?? 'Usuario';
$category = $input['category'] ?? 'other';
$reason = $input['reason'] ?? '';
$message = $input['message'] ?? '';
$conversationId = $input['conversationId'] ?? '';
$conversationHistory = $input['conversationHistory'] ?? [];
$timestamp = $input['timestamp'] ?? date('c');

if (empty($type)) {
    http_response_code(400);
    echo json_encode(['error' => 'Type is required']);
    exit;
}

// Email del admin
$adminEmail = 'irurag@gmail.com';

// Preparar el email
$subject = "[Coleccion Nuevo Ser] Escalacion de Soporte - $category";

$body = "
=== ESCALACION DE SOPORTE ===

Usuario: $userName
Email: $userEmail
ID: $userId
Categoria: $category
Razon: $reason
Timestamp: $timestamp
Conversation ID: $conversationId

--- MENSAJE ORIGINAL ---
$message

--- HISTORIAL DE CONVERSACION ---
";

foreach ($conversationHistory as $msg) {
    $role = strtoupper($msg['role']);
    $content = $msg['content'];
    $body .= "\n[$role]: $content\n";
}

$body .= "
===========================
";

// Headers del email
$headers = [
    'From: soporte@nuevosser.com',
    'Reply-To: ' . $userEmail,
    'X-Mailer: PHP/' . phpversion(),
    'Content-Type: text/plain; charset=UTF-8'
];

// Intentar enviar email
try {
    $success = mail($adminEmail, $subject, $body, implode("\r\n", $headers));

    if ($success) {
        // Tambien guardar en log
        error_log("[AdminNotification] Support escalation - User: $userEmail, Category: $category, Reason: $reason");

        echo json_encode([
            'success' => true,
            'message' => 'Admin notified successfully'
        ]);
    } else {
        throw new Exception('Mail function failed');
    }
} catch (Exception $e) {
    error_log("[AdminNotification] Error: " . $e->getMessage());

    // Al menos guardar en log si el email falla
    error_log("[AdminNotification] ESCALATION FAILED TO EMAIL - User: $userEmail, Category: $category");
    error_log("[AdminNotification] Message: $message");
    error_log("[AdminNotification] Conversation: " . json_encode($conversationHistory));

    // Retornar success de todas formas (para no bloquear al usuario)
    echo json_encode([
        'success' => true,
        'message' => 'Notification logged (email failed)',
        'warning' => 'Email notification may have failed'
    ]);
}
