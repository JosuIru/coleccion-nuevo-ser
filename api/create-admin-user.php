<?php
/**
 * SCRIPT ADMIN - Crear Usuario Admin con Tokens
 *
 * Uso: php create-admin-user.php <email> <nombre> <tokens>
 * Ejemplo: php create-admin-user.php irurag@gmail.com "Admin" 500000
 */

require_once __DIR__ . '/config.php';

if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    echo "Forbidden\n";
    exit(1);
}

// Verificar argumentos
if ($argc < 4) {
    echo "Uso: php create-admin-user.php <email> <nombre> <tokens>\n";
    echo "Ejemplo: php create-admin-user.php irurag@gmail.com \"Admin\" 500000\n";
    exit(1);
}

$email = $argv[1];
$fullName = $argv[2];
$tokens = intval($argv[3]);

if ($tokens <= 0) {
    echo "Error: La cantidad de tokens debe ser un número positivo\n";
    exit(1);
}

echo "===========================================\n";
echo "CREAR USUARIO ADMIN\n";
echo "===========================================\n";
echo "Email: $email\n";
echo "Nombre: $fullName\n";
echo "Tokens iniciales: " . number_format($tokens) . "\n";
echo "-------------------------------------------\n";

$supabaseUrl = SUPABASE_URL;
$supabaseKey = defined('SUPABASE_SERVICE_KEY') && SUPABASE_SERVICE_KEY !== ''
    ? SUPABASE_SERVICE_KEY
    : SUPABASE_ANON_KEY;

// Generar UUID
$userId = sprintf(
    '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
    mt_rand(0, 0xffff), mt_rand(0, 0xffff),
    mt_rand(0, 0xffff),
    mt_rand(0, 0x0fff) | 0x4000,
    mt_rand(0, 0x3fff) | 0x8000,
    mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
);

echo "Creando usuario...\n";

// Crear perfil en profiles
$profileData = [
    'id' => $userId,
    'email' => $email,
    'full_name' => $fullName,
    'subscription_tier' => 'pro',
    'token_balance' => $tokens,
    'tokens_purchased_total' => $tokens,
    'ai_credits_remaining' => 300000 // Créditos mensuales del plan Pro
];

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => "$supabaseUrl/rest/v1/profiles",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "apikey: $supabaseKey",
        "Authorization: Bearer $supabaseKey",
        "Content-Type: application/json",
        "Prefer: return=representation"
    ],
    CURLOPT_POSTFIELDS => json_encode($profileData)
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 201) {
    echo "Error al crear perfil: HTTP $httpCode\n";
    echo "Respuesta: $response\n";
    exit(1);
}

echo "✓ Usuario creado exitosamente\n";
echo "\n";
echo "===========================================\n";
echo "USUARIO CREADO\n";
echo "===========================================\n";
echo "ID: $userId\n";
echo "Email: $email\n";
echo "Nombre: $fullName\n";
echo "Plan: Pro\n";
echo "Tokens (comprados): " . number_format($tokens) . "\n";
echo "Tokens mensuales: 300,000\n";
echo "===========================================\n";
echo "\n";
echo "⚠️  IMPORTANTE: Para iniciar sesión, el usuario debe:\n";
echo "1. Ir a la app y crear cuenta con email: $email\n";
echo "2. Verificar el email\n";
echo "3. Los tokens se asignarán automáticamente\n";
echo "\nAlternativamente, puedes usar el dashboard de Supabase\n";
echo "para crear el usuario en auth.users manualmente.\n";
